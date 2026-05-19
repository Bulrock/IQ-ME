// Unit tests for tests/golden/parity-audit.mjs.
// Story 2-6a: red-phase failing tests authored pre-implementation.
// Tests below MUST fail until parity-audit.mjs is implemented.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const SCRIPT = resolve(__dirname, "../../golden/parity-audit.mjs");

function makeTempGoldenDir() {
  const dir = mkdtempSync(join(tmpdir(), "parity-audit-"));
  mkdirSync(join(dir, "tests", "golden"), { recursive: true });
  return dir;
}

function writeFixtures(dir, smoke, rOutput) {
  writeFileSync(
    join(dir, "tests", "golden", "vectors-smoke.json"),
    JSON.stringify(smoke, null, 2),
  );
  if (rOutput !== null) {
    writeFileSync(
      join(dir, "tests", "golden", "r-output-smoke.json"),
      JSON.stringify(rOutput, null, 2),
    );
  }
}

function runAudit(cwd) {
  return spawnSync("node", [SCRIPT], { cwd, encoding: "utf8" });
}

// AC-7.1 — Audit passes when synthetic data is within tolerance.
test("parity-audit: passes when JS vs R within ±0.001 tolerance", () => {
  const dir = makeTempGoldenDir();
  try {
    const smoke = [
      { responses: [1], itemParameters: [{ a: 1, b: 0 }], expectedTheta: 0.5, expectedSE: 0.9 },
      { responses: [0], itemParameters: [{ a: 1, b: 0 }], expectedTheta: -0.5, expectedSE: 0.9 },
    ];
    const rOutput = [
      { entryIndex: 0, rTheta: 0.5005, rSE: 0.9003 },
      { entryIndex: 1, rTheta: -0.4998, rSE: 0.9001 },
    ];
    writeFixtures(dir, smoke, rOutput);
    const result = runAudit(dir);
    assert.equal(
      result.status,
      0,
      `expected exit 0; got ${result.status}; stderr: ${result.stderr}`,
    );
    assert.ok(
      result.stdout.includes("parity-audit: ok"),
      `expected 'parity-audit: ok' in stdout; got: ${result.stdout}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-7.2 — Mock divergence: one entry drifted +0.005 → audit exits 1.
test("parity-audit: fails on >0.001 logits drift, reports entry index", () => {
  const dir = makeTempGoldenDir();
  try {
    const smoke = [
      { responses: [1], itemParameters: [{ a: 1, b: 0 }], expectedTheta: 0.5, expectedSE: 0.9 },
      { responses: [0], itemParameters: [{ a: 1, b: 0 }], expectedTheta: -0.5, expectedSE: 0.9 },
    ];
    const rOutput = [
      { entryIndex: 0, rTheta: 0.5, rSE: 0.9 },
      { entryIndex: 1, rTheta: -0.495, rSE: 0.9 }, // 0.005 drift > 0.001
    ];
    writeFixtures(dir, smoke, rOutput);
    const result = runAudit(dir);
    assert.equal(result.status, 1, `expected exit 1; got ${result.status}`);
    assert.ok(
      result.stderr.includes("entry") &&
        (result.stderr.includes("1") || result.stderr.includes("drift")),
      `expected drift report mentioning entry 1; got stderr: ${result.stderr}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-7.3 — Missing r-output-smoke.json → exits 1 with helpful message.
test("parity-audit: fails with helpful message when r-output-smoke.json missing", () => {
  const dir = makeTempGoldenDir();
  try {
    const smoke = [
      { responses: [1], itemParameters: [{ a: 1, b: 0 }], expectedTheta: 0.5, expectedSE: 0.9 },
    ];
    writeFixtures(dir, smoke, null); // skip r-output
    const result = runAudit(dir);
    assert.equal(result.status, 1, `expected exit 1; got ${result.status}`);
    assert.ok(
      result.stderr.includes("r-output-smoke.json"),
      `expected error message to name the missing file; got: ${result.stderr}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-7.4 — Output includes drift magnitudes when passing.
test("parity-audit: stdout includes max θ drift and max SE drift summary", () => {
  const dir = makeTempGoldenDir();
  try {
    const smoke = [
      { responses: [1], itemParameters: [{ a: 1, b: 0 }], expectedTheta: 0.5, expectedSE: 0.9 },
    ];
    const rOutput = [{ entryIndex: 0, rTheta: 0.5008, rSE: 0.9002 }];
    writeFixtures(dir, smoke, rOutput);
    const result = runAudit(dir);
    assert.equal(result.status, 0);
    assert.ok(
      /drift/i.test(result.stdout),
      `stdout should mention drift; got: ${result.stdout}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
