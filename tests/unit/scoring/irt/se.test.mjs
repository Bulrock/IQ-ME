// Unit tests for src/scoring/irt/se.js — posterior SE + RSS combiner.
// Story 2-4: red-phase failing tests authored pre-implementation.
// All tests below MUST fail against the current stub (`TypeError: Not implemented`)
// and turn green once `standardError` + `combinedSE` are implemented per AC-1..AC-5.

import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  standardError,
  combinedSE,
  posteriorSE,
} from "../../../../src/scoring/irt/se.js";
import { eapEstimate } from "../../../../src/scoring/irt/eap.js";
import { quadraturePoints } from "../../../../src/scoring/irt/quadrature.js";

const STD_ITEM = { a: 1.0, b: 0.0 };
const DEFAULT_QUAD = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });

function eapTheta(responses, items) {
  return eapEstimate(responses, items, DEFAULT_QUAD);
}

// AC-6.1 — SE non-negative for any valid input.
test("standardError: non-negative for 3-item all-correct", () => {
  const items = [STD_ITEM, STD_ITEM, STD_ITEM];
  const theta = eapTheta([1, 1, 1], items);
  const se = standardError(theta, [1, 1, 1], items);
  assert.ok(Number.isFinite(se), `SE must be finite (got ${se})`);
  assert.ok(se >= 0, `SE must be ≥ 0 (got ${se})`);
});

// AC-6.2 — SE bounded above by prior SD ≈ 1 (standard-normal prior).
test("standardError: bounded above by ~1 (prior SD)", () => {
  const items = [STD_ITEM];
  const theta = eapTheta([1], items);
  const se = standardError(theta, [1], items);
  assert.ok(se <= 1.01, `SE must not exceed prior SD ≈ 1 (got ${se})`);
});

// AC-6.3 — SE decreases monotonically with item count.
test("standardError: monotonically decreases with item count", () => {
  const items3 = Array(3).fill(STD_ITEM);
  const items10 = Array(10).fill(STD_ITEM);
  const items16 = Array(16).fill(STD_ITEM);
  const r3 = Array(3).fill(1);
  const r10 = Array(10).fill(1);
  const r16 = Array(16).fill(1);
  const se3 = standardError(eapTheta(r3, items3), r3, items3);
  const se10 = standardError(eapTheta(r10, items10), r10, items10);
  const se16 = standardError(eapTheta(r16, items16), r16, items16);
  assert.ok(
    se3 > se10,
    `SE(n=3) ${se3} should exceed SE(n=10) ${se10}`,
  );
  assert.ok(
    se10 > se16,
    `SE(n=10) ${se10} should exceed SE(n=16) ${se16}`,
  );
});

// AC-6.4 — Determinism: byte-identical output across calls.
test("standardError: deterministic — repeated calls return ===-equal", () => {
  const items = [STD_ITEM, STD_ITEM, STD_ITEM];
  const theta = eapTheta([1, 1, 0], items);
  const a = standardError(theta, [1, 1, 0], items);
  const b = standardError(theta, [1, 1, 0], items);
  assert.equal(a, b, `non-deterministic SE: ${a} !== ${b}`);
});

// AC-6.5 — 16-item all-correct: finite SE, no underflow.
test("standardError: 16-item all-correct returns finite SE (no underflow)", () => {
  const items = Array(16).fill(STD_ITEM);
  const responses = Array(16).fill(1);
  const theta = eapTheta(responses, items);
  const se = standardError(theta, responses, items);
  assert.ok(Number.isFinite(se), `16-item SE must be finite (got ${se})`);
  assert.ok(se > 0, `16-item SE must be > 0 (got ${se})`);
});

// AC-6.5 (cont.) — 16-item all-wrong: symmetric regression guard.
test("standardError: 16-item all-wrong returns finite SE (no underflow)", () => {
  const items = Array(16).fill(STD_ITEM);
  const responses = Array(16).fill(0);
  const theta = eapTheta(responses, items);
  const se = standardError(theta, responses, items);
  assert.ok(Number.isFinite(se), `16-item SE must be finite (got ${se})`);
  assert.ok(se > 0, `16-item SE must be > 0 (got ${se})`);
});

// AC-6.6 — combinedSE: Pythagorean contract.
test("combinedSE: (3, 4) === 5 (Pythagorean)", () => {
  assert.equal(combinedSE(3, 4), 5);
});

test("combinedSE: identity when one input is 0", () => {
  assert.equal(combinedSE(0, 5), 5);
  assert.equal(combinedSE(5, 0), 5);
});

// AC-6.7 — combinedSE: RangeError on invalid inputs.
test("combinedSE: throws RangeError on negative sem", () => {
  assert.throws(() => combinedSE(-1, 2), RangeError);
});

test("combinedSE: throws RangeError on negative seNorming", () => {
  assert.throws(() => combinedSE(2, -1), RangeError);
});

test("combinedSE: throws RangeError on non-finite input", () => {
  assert.throws(() => combinedSE(Number.NaN, 2), RangeError);
  assert.throws(() => combinedSE(2, Number.POSITIVE_INFINITY), RangeError);
});

// AC-6.8 — posteriorSE alias is ===-equal to standardError.
test("posteriorSE: same function reference as standardError", () => {
  assert.equal(posteriorSE, standardError);
});
