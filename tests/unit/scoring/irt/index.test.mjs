// Unit tests for src/scoring/irt/index.js — scoreSession facade + helpers.
// Story 2-5: red-phase failing tests authored pre-implementation.
// All tests below MUST fail against the current scoreSession stub and turn
// green once Story 2-5 lands the D3 composition.

import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  scoreSession,
  thetaToPercentile,
  thetaToIqScale,
} from "../../../../src/scoring/irt/index.js";

const STD = { a: 1.0, b: 0.0 };

// AC-7.1 — Return shape has all required keys.
test("scoreSession: returns D3 + epic-narrative shape", () => {
  const r = scoreSession({
    responses: [1, 1, 1],
    itemParameters: [STD, STD, STD],
    normingStats: { se_norming: 0 },
  });
  for (const key of [
    "theta",
    "sem",
    "se_total",
    "seTotal",
    "percentile",
    "iqScale",
    "displayedBand",
    "uncertaintyBand",
  ]) {
    assert.ok(key in r, `result missing key: ${key}`);
  }
  assert.ok("lower" in r.displayedBand && "upper" in r.displayedBand);
  assert.ok("lower" in r.uncertaintyBand && "upper" in r.uncertaintyBand);
});

// AC-7.2 — seTotal === se_total alias.
test("scoreSession: seTotal mirrors se_total", () => {
  const r = scoreSession({
    responses: [1, 0, 1],
    itemParameters: [STD, STD, STD],
    normingStats: { se_norming: 0.5 },
  });
  assert.equal(r.seTotal, r.se_total);
});

// AC-7.3 — uncertaintyBand deep-equal displayedBand.
test("scoreSession: uncertaintyBand mirrors displayedBand", () => {
  const r = scoreSession({
    responses: [1, 1, 0],
    itemParameters: [STD, STD, STD],
    normingStats: { se_norming: 0 },
  });
  assert.deepEqual(r.uncertaintyBand, r.displayedBand);
});

// AC-7.4 — Smoke-fixture entry 0 parity (post fixture-audit regen).
// Original Story 2.1 spec line 290 documented these as placeholders;
// regenerated against this JS impl 2026-05-19. Story 2.6a's R-mirt regen
// will replace them with authoritative R-derived values + audit divergence.
test("scoreSession: smoke fixture entry 0 yields theta ≈ 0.922944", () => {
  const r = scoreSession({
    responses: [1, 1, 1],
    itemParameters: [STD, STD, STD],
    normingStats: { se_norming: 0 },
  });
  assert.ok(
    Math.abs(r.theta - 0.922944) <= 0.001,
    `theta drift > 0.001 (got ${r.theta})`,
  );
});

// AC-7.5 — iqScale is integer in [55, 145].
test("scoreSession: iqScale is integer in plausible range", () => {
  const r = scoreSession({
    responses: [1, 1, 1],
    itemParameters: [STD, STD, STD],
    normingStats: { se_norming: 0 },
  });
  assert.ok(Number.isInteger(r.iqScale), `iqScale must be integer (got ${r.iqScale})`);
  assert.ok(r.iqScale >= 55 && r.iqScale <= 145, `iqScale ${r.iqScale} out of [55, 145]`);
});

// AC-7.6 — percentile ∈ [0, 100] AND percentile(theta=0) ≈ 50.
test("scoreSession: percentile in [0, 100]", () => {
  const r = scoreSession({
    responses: [1, 0],
    itemParameters: [STD, STD],
    normingStats: { se_norming: 0 },
  });
  assert.ok(r.percentile >= 0 && r.percentile <= 100, `percentile ${r.percentile} out of [0,100]`);
});

// AC-7.7 — displayedBand brackets theta when se_total > 0.
test("scoreSession: displayedBand brackets theta when se_total > 0", () => {
  const r = scoreSession({
    responses: [1, 1, 0],
    itemParameters: [STD, STD, STD],
    normingStats: { se_norming: 0.3 },
  });
  assert.ok(r.se_total > 0);
  assert.ok(
    r.displayedBand.lower < r.theta,
    `band.lower ${r.displayedBand.lower} not < theta ${r.theta}`,
  );
  assert.ok(
    r.theta < r.displayedBand.upper,
    `theta ${r.theta} not < band.upper ${r.displayedBand.upper}`,
  );
});

// AC-7.8 — Determinism: identical inputs → identical outputs.
test("scoreSession: deterministic — repeated calls byte-identical", () => {
  const args = {
    responses: [1, 1, 1, 0],
    itemParameters: [STD, STD, STD, STD],
    normingStats: { se_norming: 0.2 },
  };
  const a = scoreSession(args);
  const b = scoreSession(args);
  assert.equal(a.theta, b.theta);
  assert.equal(a.sem, b.sem);
  assert.equal(a.se_total, b.se_total);
  assert.equal(a.percentile, b.percentile);
  assert.equal(a.iqScale, b.iqScale);
});

// AC-7.9 — thetaToPercentile(0, {}) ≈ 50 (Φ(0) = 0.5).
test("thetaToPercentile(0) ≈ 50", () => {
  const p = thetaToPercentile(0, {});
  assert.ok(Math.abs(p - 50) < 0.01, `Φ(0)·100 expected 50 (got ${p})`);
});

// AC-7.10 — thetaToIqScale(0, {}) === 100.
test("thetaToIqScale(0) === 100", () => {
  assert.equal(thetaToIqScale(0, {}), 100);
});

// Additional — thetaToIqScale rounds to integer.
test("thetaToIqScale: rounds to integer", () => {
  const iq = thetaToIqScale(1.234, {});
  assert.ok(Number.isInteger(iq));
  assert.equal(iq, Math.round(100 + 15 * 1.234));
});
