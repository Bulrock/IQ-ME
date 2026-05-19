#!/usr/bin/env node
// Story 2.6a — JS-side parity audit.
// Compares tests/golden/r-output-smoke.json (R mirt) against
// tests/golden/vectors-smoke.json (JS engine) at ±0.001 logits tolerance.
// Exit 0 on match, 1 on divergence or missing R output.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CWD = process.cwd();
const SMOKE_PATH = resolve(CWD, "tests/golden/vectors-smoke.json");
const R_OUTPUT_PATH = resolve(CWD, "tests/golden/r-output-smoke.json");
const TOLERANCE = 0.001;

if (!existsSync(R_OUTPUT_PATH)) {
  process.stderr.write(
    `parity-audit: r-output-smoke.json not found at ${R_OUTPUT_PATH}.\n` +
      `Run \`Rscript tests/golden/regenerate.R --smoke\` first.\n`,
  );
  process.exit(1);
}

const smoke = JSON.parse(readFileSync(SMOKE_PATH, "utf8"));
const rOutput = JSON.parse(readFileSync(R_OUTPUT_PATH, "utf8"));

if (smoke.length !== rOutput.length) {
  process.stderr.write(
    `parity-audit: entry count mismatch — vectors-smoke.json has ${smoke.length}, r-output-smoke.json has ${rOutput.length}.\n`,
  );
  process.exit(1);
}

const drifts = [];
let maxThetaDrift = 0;
let maxSeDrift = 0;

for (let i = 0; i < smoke.length; i++) {
  const js = smoke[i];
  const r = rOutput.find((e) => e.entryIndex === i);
  if (!r) {
    drifts.push({ entryIndex: i, reason: "missing entry in r-output-smoke.json" });
    continue;
  }
  const thetaDrift = Math.abs(js.expectedTheta - r.rTheta);
  const seDrift = Math.abs(js.expectedSE - r.rSE);
  if (thetaDrift > maxThetaDrift) maxThetaDrift = thetaDrift;
  if (seDrift > maxSeDrift) maxSeDrift = seDrift;
  if (thetaDrift > TOLERANCE || seDrift > TOLERANCE) {
    drifts.push({
      entryIndex: i,
      jsExpectedTheta: js.expectedTheta,
      rTheta: r.rTheta,
      thetaDrift,
      jsExpectedSE: js.expectedSE,
      rSE: r.rSE,
      seDrift,
    });
  }
}

if (drifts.length > 0) {
  process.stderr.write(
    `parity-audit: FAILED — ${drifts.length} of ${smoke.length} entries exceed ±${TOLERANCE} logits tolerance.\n`,
  );
  for (const d of drifts) {
    process.stderr.write(`  entry ${d.entryIndex}: ${JSON.stringify(d)}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  `parity-audit: ok (${smoke.length} entries; max θ drift ${maxThetaDrift.toFixed(6)}; max SE drift ${maxSeDrift.toFixed(6)})\n`,
);
process.exit(0);
