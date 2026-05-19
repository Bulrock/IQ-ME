// Unit tests for src/scoring/irt/likelihood.js — pure 2PL primitives.

import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  itemLikelihood,
  logLikelihood,
  patternLogLikelihood,
} from "../../../../src/scoring/irt/likelihood.js";

test("itemLikelihood: symmetry — P(correct | θ=b, a, b, 1) === 0.5", () => {
  assert.equal(itemLikelihood(0, 1, 0, 1), 0.5);
  assert.equal(itemLikelihood(2, 1, 2, 1), 0.5);
  assert.equal(itemLikelihood(-3, 2, -3, 1), 0.5);
});

test("itemLikelihood: monotonic in θ for fixed a, b, response=1", () => {
  const lo = itemLikelihood(-2, 1, 0, 1);
  const mid = itemLikelihood(0, 1, 0, 1);
  const hi = itemLikelihood(2, 1, 0, 1);
  assert.ok(lo < mid && mid < hi, `not monotonic: ${lo} < ${mid} < ${hi}`);
});

test("itemLikelihood: asymptotic — P → 1 as θ → +∞, P → 0 as θ → -∞", () => {
  assert.ok(itemLikelihood(10, 1, 0, 1) > 0.999);
  assert.ok(itemLikelihood(-10, 1, 0, 1) < 0.001);
});

test("itemLikelihood: response=0 returns complement", () => {
  const p1 = itemLikelihood(1, 1, 0, 1);
  const p0 = itemLikelihood(1, 1, 0, 0);
  assert.ok(Math.abs(p0 - (1 - p1)) < 1e-15);
});

test("itemLikelihood: throws RangeError on non-binary response", () => {
  assert.throws(() => itemLikelihood(0, 1, 0, 2), RangeError);
  assert.throws(() => itemLikelihood(0, 1, 0, -1), RangeError);
  assert.throws(() => itemLikelihood(0, 1, 0, 0.5), RangeError);
});

test("logLikelihood: sum-of-logs for two identical items === 2× single", () => {
  const single = Math.log(itemLikelihood(1, 1, 0, 1));
  const dbl = logLikelihood(
    1,
    [
      { a: 1, b: 0 },
      { a: 1, b: 0 },
    ],
    [1, 1],
  );
  assert.ok(
    Math.abs(dbl - 2 * single) < 1e-12,
    `logLikelihood sum mismatch: ${dbl} vs 2× ${single}`,
  );
});

test("logLikelihood: numerically stable at extreme θ (no -Infinity, no NaN)", () => {
  const r = logLikelihood(100, [{ a: 1, b: 0 }], [0]);
  assert.ok(Number.isFinite(r), `expected finite, got ${r}`);
  assert.ok(r < 0, `expected large negative, got ${r}`);

  const r2 = logLikelihood(-100, [{ a: 1, b: 0 }], [1]);
  assert.ok(Number.isFinite(r2), `expected finite, got ${r2}`);
  assert.ok(r2 < 0, `expected large negative, got ${r2}`);
});

test("logLikelihood: throws RangeError on length mismatch", () => {
  assert.throws(
    () =>
      logLikelihood(
        0,
        [
          { a: 1, b: 0 },
          { a: 1, b: 1 },
        ],
        [1],
      ),
    RangeError,
  );
  assert.throws(
    () => logLikelihood(0, [{ a: 1, b: 0 }], [1, 0]),
    RangeError,
  );
});

test("logLikelihood: throws RangeError on non-binary response", () => {
  assert.throws(
    () => logLikelihood(0, [{ a: 1, b: 0 }], [2]),
    RangeError,
  );
});

test("patternLogLikelihood: alias of logLikelihood", () => {
  const a = logLikelihood(0.5, [{ a: 1, b: 0 }], [1]);
  const b = patternLogLikelihood(0.5, [{ a: 1, b: 0 }], [1]);
  assert.equal(a, b);
});
