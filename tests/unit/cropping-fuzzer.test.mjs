// tests/unit/cropping-fuzzer.test.mjs
//
// Story 6.6 AC-4/AC-5 — unit test for the pure-geometry cropping-fuzzer tool
// (tools/cropping-fuzzer.mjs). Locks the verdict logic independent of any real
// CSS/DOM: a crop that captures ≥scoreThreshold of the score area while
// touching neither the caveat nor the tear-edge overlay is a clean
// decontextualized score-only crop → verdict "fail" (the regression the
// fuzzer exists to catch). Every other crop → "pass".
//
// Pattern: node:test + node:assert/strict, no third-party framework
// (precedent: tests/contract/state-shape.spec.mjs, tests/unit/item-prng.test.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  intersects,
  overlapFraction,
  makeRng,
  generateCrops,
  assessCrop,
} from "../../tools/cropping-fuzzer.mjs";

// ── geometry helpers ─────────────────────────────────────────────────────
test("intersects: overlapping rects return true", () => {
  assert.equal(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }), true);
});

test("intersects: disjoint rects return false", () => {
  assert.equal(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 5, height: 5 }), false);
});

test("intersects: edge-touching rects do NOT count as intersecting", () => {
  // share the x=10 edge, zero overlap area
  assert.equal(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }), false);
});

test("overlapFraction: crop covering exactly half of target area returns 0.5", () => {
  const target = { x: 0, y: 0, width: 100, height: 100 };
  const crop = { x: 0, y: 0, width: 50, height: 100 };
  assert.equal(overlapFraction(target, crop), 0.5);
});

test("overlapFraction: no overlap returns 0; full cover returns 1", () => {
  const target = { x: 0, y: 0, width: 100, height: 100 };
  assert.equal(overlapFraction(target, { x: 200, y: 200, width: 10, height: 10 }), 0);
  assert.equal(overlapFraction(target, { x: -10, y: -10, width: 200, height: 200 }), 1);
});

test("overlapFraction: zero-area target returns 0 (no divide-by-zero)", () => {
  assert.equal(overlapFraction({ x: 0, y: 0, width: 0, height: 0 }, { x: 0, y: 0, width: 10, height: 10 }), 0);
});

// ── deterministic PRNG ───────────────────────────────────────────────────
test("makeRng: same seed yields identical sequence (reproducible crops)", () => {
  const a = makeRng("deadbeef");
  const b = makeRng("deadbeef");
  const seqA = [a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test("makeRng: different seeds diverge; all values in [0,1)", () => {
  const a = makeRng("seed-one");
  const b = makeRng("seed-two");
  const va = [a(), a(), a()];
  const vb = [b(), b(), b()];
  assert.notDeepEqual(va, vb);
  for (const v of [...va, ...vb]) {
    assert.ok(v >= 0 && v < 1, `value ${v} must be in [0,1)`);
  }
});

// ── crop generation ──────────────────────────────────────────────────────
test("generateCrops: returns n rects, each fully inside the panel", () => {
  const panel = { x: 10, y: 20, width: 300, height: 200 };
  const crops = generateCrops({ panel, n: 40, rng: makeRng("abc123") });
  assert.equal(crops.length, 40);
  for (const c of crops) {
    assert.ok(c.width > 0 && c.height > 0, "crop has positive area");
    assert.ok(c.x >= panel.x, "crop left within panel");
    assert.ok(c.y >= panel.y, "crop top within panel");
    assert.ok(c.x + c.width <= panel.x + panel.width + 1e-9, "crop right within panel");
    assert.ok(c.y + c.height <= panel.y + panel.height + 1e-9, "crop bottom within panel");
  }
});

test("generateCrops: deterministic for a fixed seed", () => {
  const panel = { x: 0, y: 0, width: 400, height: 300 };
  const c1 = generateCrops({ panel, n: 16, rng: makeRng("fixed") });
  const c2 = generateCrops({ panel, n: 16, rng: makeRng("fixed") });
  assert.deepEqual(c1, c2);
});

// ── verdict logic (the load-bearing contract) ────────────────────────────
// Layout fixture (y grows downward):
//   caveat:   y 0..40   (above the score)
//   tearEdge: y 30..150  (straddles the caveat↔score seam, dips into the score)
//   score:    y 100..200 (the numerals)
const REGIONS = {
  caveat: { x: 0, y: 0, width: 200, height: 40 },
  tearEdge: { x: 0, y: 30, width: 200, height: 120 },
  score: { x: 0, y: 100, width: 200, height: 100 },
};

test("assessCrop: score-only crop excluding caveat AND tear-edge → fail", () => {
  // crop sits entirely below the tear-edge (y 150..200) yet captures ≥50% of score area
  const crop = { x: 0, y: 150, width: 200, height: 50 };
  const r = assessCrop(crop, REGIONS);
  assert.equal(r.showsScore, true);
  assert.equal(r.showsCaveatOrTearEdge, false);
  assert.equal(r.verdict, "fail");
});

test("assessCrop: crop catching the tear-edge counts as caveat surviving → pass", () => {
  // crop from y 120..200 captures score AND intersects tearEdge (ends at 150)
  const crop = { x: 0, y: 120, width: 200, height: 80 };
  const r = assessCrop(crop, REGIONS);
  assert.equal(r.showsScore, true);
  assert.equal(r.showsCaveatOrTearEdge, true);
  assert.equal(r.verdict, "pass");
});

test("assessCrop: crop catching the caveat → pass", () => {
  const crop = { x: 0, y: 0, width: 200, height: 200 };
  const r = assessCrop(crop, REGIONS);
  assert.equal(r.showsCaveatOrTearEdge, true);
  assert.equal(r.verdict, "pass");
});

test("assessCrop: crop showing <scoreThreshold of the score → not score-only → pass", () => {
  // crop y 180..200 covers only 20% of the score area
  const crop = { x: 0, y: 180, width: 200, height: 20 };
  const r = assessCrop(crop, REGIONS);
  assert.equal(r.showsScore, false);
  assert.equal(r.verdict, "pass");
});

test("assessCrop: empty-region crop (neither score nor caveat) → pass", () => {
  const crop = { x: 500, y: 500, width: 10, height: 10 };
  const r = assessCrop(crop, REGIONS);
  assert.equal(r.showsScore, false);
  assert.equal(r.showsCaveatOrTearEdge, false);
  assert.equal(r.verdict, "pass");
});

test("assessCrop: scoreThreshold is configurable", () => {
  const crop = { x: 0, y: 150, width: 200, height: 50 }; // 50% of score
  // raise threshold above 0.5 → no longer 'shows score' → pass
  const r = assessCrop(crop, REGIONS, { scoreThreshold: 0.6 });
  assert.equal(r.showsScore, false);
  assert.equal(r.verdict, "pass");
});
