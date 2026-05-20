// src/assessment/tail-scene-router.js — Story 6.5 AC-1.
//
// Pure decile-selector. PRD §Success-Criterion #4 (corrected per pre-arch
// readiness gap B4) defines the bottom-decile boundary as P ≤ 10 inclusive;
// the top-decile boundary as P ≥ 90 inclusive. Everything else is mid-band.

export function selectTailScene(percentile) {
  if (typeof percentile !== "number" || !Number.isFinite(percentile)) {
    throw new RangeError(`percentile must be a finite number (got ${percentile})`);
  }
  if (percentile < 0 || percentile > 100) {
    throw new RangeError(`percentile out of [0, 100] (got ${percentile})`);
  }
  if (percentile <= 10) return "bottom-decile";
  if (percentile >= 90) return "top-decile";
  return "mid-band";
}
