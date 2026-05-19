// Unit tests for src/scoring/irt/eap.js — EAP θ estimator.
// Story 2-3: red-phase failing tests authored pre-implementation.
// All tests below MUST fail against the current stub (`TypeError: Not implemented`)
// and turn green once `eapEstimate` body is implemented per AC-1..AC-4.

import { test } from "node:test";
import { strict as assert } from "node:assert";

import { eapEstimate } from "../../../../src/scoring/irt/eap.js";
import { quadraturePoints } from "../../../../src/scoring/irt/quadrature.js";

const DEFAULT_QUAD = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
const STD_ITEM = { a: 1.0, b: 0.0 };

// AC-5.1 — All-correct pattern: positive theta, finite, bounded.
test("eapEstimate: all-correct [1,1,1] returns θ ∈ (0, 2)", () => {
  const items = [STD_ITEM, STD_ITEM, STD_ITEM];
  const theta = eapEstimate([1, 1, 1], items, DEFAULT_QUAD);
  assert.ok(Number.isFinite(theta), `theta must be finite (got ${theta})`);
  assert.ok(theta > 0, `all-correct must yield θ > 0 (got ${theta})`);
  assert.ok(
    theta < 2,
    `all-correct three-item θ must be shrunk toward prior (< 2; got ${theta})`,
  );
});

// AC-5.2 — All-wrong pattern: negative theta, symmetric to all-correct.
test("eapEstimate: all-wrong [0,0,0] returns θ ∈ (-2, 0)", () => {
  const items = [STD_ITEM, STD_ITEM, STD_ITEM];
  const theta = eapEstimate([0, 0, 0], items, DEFAULT_QUAD);
  assert.ok(Number.isFinite(theta), `theta must be finite (got ${theta})`);
  assert.ok(theta < 0, `all-wrong must yield θ < 0 (got ${theta})`);
  assert.ok(
    theta > -2,
    `all-wrong three-item θ must be shrunk toward prior (> -2; got ${theta})`,
  );
});

// AC-5.3 — Symmetry: eapEstimate([1,0], ...) ≈ -eapEstimate([0,1], ...) for identical items.
test("eapEstimate: mixed pattern symmetric — eap([1,0]) ≈ -eap([0,1])", () => {
  const items = [STD_ITEM, STD_ITEM];
  const t10 = eapEstimate([1, 0], items, DEFAULT_QUAD);
  const t01 = eapEstimate([0, 1], items, DEFAULT_QUAD);
  assert.ok(
    Math.abs(t10 + t01) < 1e-9,
    `[1,0] and [0,1] must produce symmetric θ (got ${t10} and ${t01}; sum ${t10 + t01})`,
  );
});

// AC-5.3 (cont.) — Symmetric mixed pattern with even-length identical items → θ ≈ 0.
test("eapEstimate: balanced [1,0,1,0] returns θ very close to 0", () => {
  const items = [STD_ITEM, STD_ITEM, STD_ITEM, STD_ITEM];
  const theta = eapEstimate([1, 0, 1, 0], items, DEFAULT_QUAD);
  assert.ok(
    Math.abs(theta) < 0.01,
    `balanced mixed pattern must yield θ ≈ 0 (got ${theta})`,
  );
});

// AC-5.4 — Determinism: byte-identical output across repeated calls.
test("eapEstimate: deterministic — repeated calls return ===-equal Numbers", () => {
  const items = [STD_ITEM, STD_ITEM, STD_ITEM];
  const a = eapEstimate([1, 1, 0], items, DEFAULT_QUAD);
  const b = eapEstimate([1, 1, 0], items, DEFAULT_QUAD);
  assert.equal(a, b, `non-deterministic output: ${a} !== ${b}`);
});

// AC-5.5 — 16-item all-correct: no NaN, no ±Infinity (underflow regression guard).
test("eapEstimate: 16-item all-correct returns finite θ (no underflow)", () => {
  const items = Array(16).fill(STD_ITEM);
  const responses = Array(16).fill(1);
  const theta = eapEstimate(responses, items, DEFAULT_QUAD);
  assert.ok(
    Number.isFinite(theta),
    `16-item all-correct must yield finite θ (got ${theta})`,
  );
  assert.ok(theta > 0, `16-item all-correct must yield positive θ (got ${theta})`);
});

// AC-5.5 (cont.) — 16-item all-wrong: symmetric regression guard.
test("eapEstimate: 16-item all-wrong returns finite θ (no underflow)", () => {
  const items = Array(16).fill(STD_ITEM);
  const responses = Array(16).fill(0);
  const theta = eapEstimate(responses, items, DEFAULT_QUAD);
  assert.ok(
    Number.isFinite(theta),
    `16-item all-wrong must yield finite θ (got ${theta})`,
  );
  assert.ok(theta < 0, `16-item all-wrong must yield negative θ (got ${theta})`);
});

// AC-5.6 — RangeError surface: invalid inputs must throw, not return NaN.
test("eapEstimate: throws RangeError on length mismatch", () => {
  const items = [STD_ITEM, STD_ITEM];
  assert.throws(
    () => eapEstimate([1, 1, 0], items, DEFAULT_QUAD),
    RangeError,
    "length mismatch must throw RangeError",
  );
});

test("eapEstimate: throws RangeError on non-binary response", () => {
  const items = [STD_ITEM, STD_ITEM];
  assert.throws(
    () => eapEstimate([1, 2], items, DEFAULT_QUAD),
    RangeError,
    "non-binary response must throw RangeError",
  );
});

test("eapEstimate: throws RangeError on non-finite item discrimination", () => {
  const items = [{ a: Number.POSITIVE_INFINITY, b: 0 }, STD_ITEM];
  assert.throws(
    () => eapEstimate([1, 0], items, DEFAULT_QUAD),
    RangeError,
    "non-finite a must throw RangeError",
  );
});
