// src/assessment/methodology-registry.js
//
// Story 12-3 (PR-15) — the single source of truth mapping a chosen
// (methodology, variant) pair to the item pool + session size that drives it.
// Both item-runner.js (session start) and result.js (scoring + completeness
// guard) resolve through here so the variant engine has exactly one place to
// reason about pools/sizes.
//
// DEFAULT-SAFE: when methodology/variant are absent (a user who never passed
// the selection scene, or a pre-12-2 resumed session), resolveVariant returns
// geometric + short — byte-identical to the original single-test behavior, so
// every existing test + frozen contract on the 16-item pool stays green.
//
// Pure module (no I/O, no globals) per the project's testability posture.

const GEOMETRIC_SHORT_POOL = "/src/items/item-parameters.json"; // the frozen 16-item pool
const GEOMETRIC_FULL_POOL = "/src/items/item-parameters-geometric-full.json";
const LETTER_NUMBER_SHORT_POOL = "/src/items/item-parameters-letter-number.json";
const LETTER_NUMBER_FULL_POOL = "/src/items/item-parameters-letter-number-full.json";

// (methodology, variant) → { poolUrl, sessionSize }. sessionSize is the number
// of items presented; for v1 pools it equals the pool size (permute-all), and
// item-selection.js's pool.length > sessionSize subset path stays available for
// any future adaptive subset.
const REGISTRY = {
  geometric: {
    short: { poolUrl: GEOMETRIC_SHORT_POOL, sessionSize: 16 },
    full: { poolUrl: GEOMETRIC_FULL_POOL, sessionSize: 24 },
  },
  "letter-number": {
    short: { poolUrl: LETTER_NUMBER_SHORT_POOL, sessionSize: 12 },
    full: { poolUrl: LETTER_NUMBER_FULL_POOL, sessionSize: 20 },
  },
};

const DEFAULT_METHODOLOGY = "geometric";
const DEFAULT_VARIANT = "short";

export function resolveVariant(methodology, variant) {
  const m = REGISTRY[methodology] ? methodology : DEFAULT_METHODOLOGY;
  const byVariant = REGISTRY[m];
  const v = byVariant[variant] ? variant : DEFAULT_VARIANT;
  const entry = byVariant[v];
  return { methodology: m, variant: v, poolUrl: entry.poolUrl, sessionSize: entry.sessionSize };
}

// Resolve directly from a session-state snapshot (the common caller shape).
export function resolveFromState(state) {
  const s = state || {};
  return resolveVariant(s.methodology, s.variant);
}
