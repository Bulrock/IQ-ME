// tests/unit/tail-scene-router.test.mjs
//
// Story 6.5 AC-1 + AC-10 — red-phase failing unit test for
// src/assessment/tail-scene-router.js `selectTailScene(percentile)`.
//
// Thresholds (PRD §Success-Criterion #4 corrected to P ≤ 10):
//   bottom-decile := percentile ≤ 10  (inclusive)
//   top-decile    := percentile ≥ 90  (inclusive)
//   mid-band      := 10 < percentile < 90
//
// Non-finite percentile → RangeError; out-of-range [0, 100] → RangeError.

import { test } from "node:test";
import { strict as assert } from "node:assert";

import { selectTailScene } from "../../src/assessment/tail-scene-router.js";

// ── happy path: mid-band ────────────────────────────────────────────────
test("AC-10: P=50 → mid-band", () => {
  assert.equal(selectTailScene(50), "mid-band");
});

test("AC-10: P=11 → mid-band (lower mid boundary)", () => {
  assert.equal(selectTailScene(11), "mid-band");
});

test("AC-10: P=89 → mid-band (upper mid boundary)", () => {
  assert.equal(selectTailScene(89), "mid-band");
});

// ── bottom-decile (inclusive) ───────────────────────────────────────────
test("AC-10: P=0 → bottom-decile", () => {
  assert.equal(selectTailScene(0), "bottom-decile");
});

test("AC-10: P=10 → bottom-decile (inclusive boundary per PRD §B4)", () => {
  assert.equal(selectTailScene(10), "bottom-decile");
});

test("AC-10: P=5 → bottom-decile", () => {
  assert.equal(selectTailScene(5), "bottom-decile");
});

// ── top-decile (inclusive) ──────────────────────────────────────────────
test("AC-10: P=100 → top-decile", () => {
  assert.equal(selectTailScene(100), "top-decile");
});

test("AC-10: P=90 → top-decile (inclusive boundary)", () => {
  assert.equal(selectTailScene(90), "top-decile");
});

test("AC-10: P=95 → top-decile", () => {
  assert.equal(selectTailScene(95), "top-decile");
});

// ── input validation ────────────────────────────────────────────────────
test("AC-10: P=NaN → RangeError", () => {
  assert.throws(() => selectTailScene(NaN), RangeError);
});

test("AC-10: P=Infinity → RangeError", () => {
  assert.throws(() => selectTailScene(Infinity), RangeError);
});

test("AC-10: P=-Infinity → RangeError", () => {
  assert.throws(() => selectTailScene(-Infinity), RangeError);
});

test("AC-10: P=-1 → RangeError (out of [0,100])", () => {
  assert.throws(() => selectTailScene(-1), RangeError);
});

test("AC-10: P=101 → RangeError (out of [0,100])", () => {
  assert.throws(() => selectTailScene(101), RangeError);
});

test("AC-10: P=undefined → RangeError (non-finite)", () => {
  assert.throws(() => selectTailScene(undefined), RangeError);
});

test("AC-10: P='10' (string) → RangeError (non-number)", () => {
  assert.throws(() => selectTailScene("10"), RangeError);
});

// ── return-type discipline ──────────────────────────────────────────────
test("AC-1: selectTailScene returns one of the three literal strings", () => {
  const out = new Set();
  for (let p = 0; p <= 100; p += 1) out.add(selectTailScene(p));
  assert.deepEqual(
    [...out].sort(),
    ["bottom-decile", "mid-band", "top-decile"].sort(),
    "selectTailScene must return exactly the three literal variant strings",
  );
});
