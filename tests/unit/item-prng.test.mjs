// tests/unit/item-prng.test.mjs
//
// Story 3.4 AC-10.1 / 10.2 / 10.2b / 10.7 — `src/assessment/item-prng.js`
// xoshiro128++ deterministic PRNG.
//
// Pattern follows tests/unit/landing-scene.test.mjs (Story 3.3):
// stub globals BEFORE dynamic-importing the SUT (none needed here — pure
// module per AC-1); wrap dynamic import in try/catch so red-phase failure
// surfaces as a readable assertion.
//
// Node 22 native node:test + node:assert/strict; no third-party deps.
//
// AC-1 contract (observable):
//   - Named export: createPrng(seed128) → { next(): Uint32 }.
//   - seed128 is Uint8Array(16) (128 bits).
//   - next() returns a uint32 (>>> 0 coerced).
//   - Pure module: no side effects on import; multiple createPrng() calls
//     with the same seed produce byte-identical sequences (AC-10.2).
//   - One-byte-different seed → divergent sequences within the first 100
//     draws (AC-10.2b avalanche).
//   - No forbidden globals (Math.random / Date.now / localStorage /
//     sessionStorage / console.log) and no default export (AC-10.7).
//
// Deterministic test seed per spec implementation note 3: Vigna's reference
// requires the four-word state to not be all-zero. The constant 0x42 satisfies
// this trivially.

import { test } from "node:test";
import assert from "node:assert/strict";

// ── Dynamic-import SUT ───────────────────────────────────────────────────

let prng;
let importError = null;
try {
  prng = await import("../../src/assessment/item-prng.js");
} catch (err) {
  importError = err;
}

function fixedSeed(byte = 0x42) {
  const a = new Uint8Array(16);
  a.fill(byte);
  return a;
}

function drawN(p, n) {
  const out = new Uint32Array(n);
  for (let i = 0; i < n; i++) out[i] = p.next();
  return out;
}

// ─── AC-10.1: module shape ───────────────────────────────────────────────

test("AC-10.1: createPrng(seed128) returns an object with a next() function", () => {
  assert.equal(importError, null, `item-prng.js failed to import: ${importError?.message}`);
  assert.equal(typeof prng.createPrng, "function", "createPrng must be a named export");
  assert.equal(prng.default, undefined, "no default export allowed");
  const p = prng.createPrng(fixedSeed());
  assert.equal(typeof p, "object");
  assert.notEqual(p, null);
  assert.equal(typeof p.next, "function", "returned object must have a next() function");
  const v = p.next();
  assert.equal(typeof v, "number", "next() must return a number");
  assert.equal(Number.isInteger(v), true, "next() must return an integer");
  assert.ok(v >= 0 && v <= 0xffffffff, `next() must return a Uint32 in [0, 2^32-1]; got ${v}`);
  // >>> 0 coercion check: bit pattern preserved through unsigned cast.
  assert.equal(v >>> 0, v, "next() output must already be a Uint32 (>>> 0 idempotent)");
});

// ─── AC-10.2: determinism (1000-draw byte-equal) ─────────────────────────

test("AC-10.2: two createPrng() calls with same seed produce byte-identical 1000-draw sequences", () => {
  assert.equal(importError, null);
  const p1 = prng.createPrng(fixedSeed());
  const p2 = prng.createPrng(fixedSeed());
  const s1 = drawN(p1, 1000);
  const s2 = drawN(p2, 1000);
  assert.deepEqual(s1, s2, "same seed must produce byte-identical 1000-draw Uint32Array");
});

// ─── AC-10.2b: avalanche (one-byte-different seed → ≥80/100 differ) ──────

test("AC-10.2b: one-byte-different seeds produce ≥80 differing draws of first 100 (avalanche)", () => {
  assert.equal(importError, null);
  const seedA = fixedSeed(0x42);
  const seedB = fixedSeed(0x42);
  seedB[0] = 0x43; // flip one byte
  const sA = drawN(prng.createPrng(seedA), 100);
  const sB = drawN(prng.createPrng(seedB), 100);
  let diffs = 0;
  for (let i = 0; i < 100; i++) if (sA[i] !== sB[i]) diffs++;
  assert.ok(diffs >= 80, `avalanche: expected ≥80 differing draws of 100, got ${diffs}`);
});

// ─── AC-10.7: source-grep forbidden globals + no default export ──────────

test("AC-10.7: item-prng.js source contains no forbidden globals or default export", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "item-prng.js");
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`item-prng.js source not readable: ${err.message}`); }
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden (NFR10)");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden (NFR10)");
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden (NFR10)");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden (NFR10)");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden (NFR10)");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden (named exports only)");
});
