#!/usr/bin/env node
// Story 2.6b — generate ≥1000 random response patterns + their JS-engine
// EAP θ + SE values. Output is the JS-side reference for the full parity
// test. R-mirt third-party validation comes via golden-regen.yml --mode=full.
//
// Usage:
//   node tools/generate-full-vectors.mjs > tests/golden/vectors.json
//   node tools/generate-full-vectors.mjs --out=tests/golden/vectors.json
//
// Deterministic: same seed → byte-identical output. SHA256 recorded in
// tests/golden/CHANGELOG.md v2.0 entry.

import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

import { scoreSession } from "../src/scoring/irt/index.js";

const SEED = 20260514;
const N_PATTERNS = 1000;
const MIN_LEN = 1;
const MAX_LEN = 16;
const A_MIN = 0.5;
const A_MAX = 2.5;
const B_MIN = -3;
const B_MAX = 3;

// Mulberry32 — deterministic 32-bit seeded PRNG.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);

function randInt(lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function randFloat(lo, hi) {
  return lo + rng() * (hi - lo);
}

function generatePattern() {
  const length = randInt(MIN_LEN, MAX_LEN);
  const itemParameters = [];
  const responses = [];
  for (let i = 0; i < length; i++) {
    itemParameters.push({
      a: Number(randFloat(A_MIN, A_MAX).toFixed(3)),
      b: Number(randFloat(B_MIN, B_MAX).toFixed(3)),
    });
    responses.push(randInt(0, 1));
  }
  return { responses, itemParameters };
}

const entries = [];
for (let n = 0; n < N_PATTERNS; n++) {
  const { responses, itemParameters } = generatePattern();
  const r = scoreSession({
    responses,
    itemParameters,
    normingStats: { se_norming: 0 },
  });
  entries.push({
    responses,
    itemParameters,
    expectedTheta: Number(r.theta.toFixed(6)),
    expectedSE: Number(r.sem.toFixed(6)),
  });
}

// Sort by SHA256 of JSON.stringify(entry) for byte-stable diffs.
function entryHash(entry) {
  return createHash("sha256")
    .update(JSON.stringify(entry))
    .digest("hex");
}

entries.sort((a, b) => entryHash(a).localeCompare(entryHash(b)));

const output = JSON.stringify(entries, null, 2) + "\n";

// Parse CLI args for --out=<path>.
const outArg = process.argv.find((a) => a.startsWith("--out="));
if (outArg) {
  const outPath = outArg.slice("--out=".length);
  writeFileSync(outPath, output);
  process.stderr.write(
    `generate-full-vectors: wrote ${entries.length} entries to ${outPath}\n`,
  );
} else {
  process.stdout.write(output);
}
