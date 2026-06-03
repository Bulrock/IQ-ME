// tools/cropping-fuzzer.mjs — Story 6.6 (AC-4)
//
// Pure-geometry cropping fuzzer for the top-decile score-panel tear-edge
// invariant (UX-DR25, FR24, UX Innovation #4 — anti-credentialization by
// composition). Stdlib-only ES module, NO DOM / Playwright import, so it is
// unit-testable in isolation (tests/unit/cropping-fuzzer.test.mjs) and reused
// from the Playwright spec (tests/playwright/cropping-fuzzer.spec.mjs).
//
// All rects are { x, y, width, height } with y growing downward (DOM/Playwright
// boundingBox convention).
//
// Verdict contract (assessCrop):
//   - showsScore            = the crop captures ≥ scoreThreshold of the score's
//                             AREA (default 0.5) — a sliver of a numeral is not
//                             a usable decontextualized screenshot.
//   - showsCaveatOrTearEdge = the crop intersects the caveat OR the tear-edge
//                             overlay box. The tear-edge counts as the caveat
//                             surviving: it is the artifact that binds caveat→score.
//   - verdict "fail"        = showsScore && !showsCaveatOrTearEdge — a clean
//                             score-only crop. This is the regression the fuzzer
//                             exists to catch (someone removed/shrank the
//                             tear-edge so the score can be cleanly cropped out).
//   - verdict "pass"        = everything else.

const EMPTY = (r) => !r || !(r.width > 0) || !(r.height > 0);

// Axis-aligned bounding-box intersection. Edge-touching (zero overlap area)
// does NOT count as intersecting.
export function intersects(a, b) {
  if (EMPTY(a) || EMPTY(b)) return false;
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Fraction of `target`'s area covered by `crop` ∈ [0, 1]. Zero-area target → 0.
export function overlapFraction(target, crop) {
  if (EMPTY(target) || EMPTY(crop)) return 0;
  const ix = Math.max(0, Math.min(target.x + target.width, crop.x + crop.width) - Math.max(target.x, crop.x));
  const iy = Math.max(0, Math.min(target.y + target.height, crop.y + crop.height) - Math.max(target.y, crop.y));
  const inter = ix * iy;
  const area = target.width * target.height;
  return area > 0 ? inter / area : 0;
}

// Deterministic PRNG: seed string → () => float in [0, 1). xmur3 hash seeds
// mulberry32 so a failing crop is reproducible across PR re-runs (no flakiness).
export function makeRng(seedHex) {
  let h = 1779033703 ^ String(seedHex).length;
  for (let i = 0; i < String(seedHex).length; i++) {
    h = Math.imul(h ^ String(seedHex).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = (Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate `n` crop rectangles, each fully inside `panel`, with randomized
// window sizes/positions. Window sizes span tight→large so the fuzzer probes
// both score-only slivers and wide composite crops.
export function generateCrops({ panel, n, rng }) {
  const crops = [];
  for (let i = 0; i < n; i++) {
    // widths/heights in (0, 1] of the panel; bias toward smaller windows so
    // tight score-region crops are well represented.
    const wFrac = 0.1 + 0.9 * rng() * rng();
    const hFrac = 0.1 + 0.9 * rng() * rng();
    const width = Math.max(1, panel.width * wFrac);
    const height = Math.max(1, panel.height * hFrac);
    const x = panel.x + (panel.width - width) * rng();
    const y = panel.y + (panel.height - height) * rng();
    crops.push({ x, y, width, height });
  }
  return crops;
}

// Classify one crop. opts.scoreThreshold (default 0.5) is the minimum fraction
// of the score area a crop must capture to count as "showing the score".
export function assessCrop(crop, { caveat, tearEdge, score }, opts = {}) {
  const scoreThreshold = typeof opts.scoreThreshold === "number" ? opts.scoreThreshold : 0.5;
  const showsScore = overlapFraction(score, crop) >= scoreThreshold;
  const showsCaveatOrTearEdge = intersects(caveat, crop) || intersects(tearEdge, crop);
  const verdict = !showsScore || showsCaveatOrTearEdge ? "pass" : "fail";
  return { showsScore, showsCaveatOrTearEdge, verdict };
}
