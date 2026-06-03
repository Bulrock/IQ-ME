// src/assessment/save-result.js
//
// Story 6.7 — opt-in "Save my result" storage module (FR26, NFR9). Owns the
// single write + savedAt timestamp so result.js stays grep-clean of forbidden
// globals (result.test.mjs AC-9.15). Mirrors theme.js opt-in discipline:
// import performs ZERO writes; saveResult() (only writer) runs solely from the
// save-button click handler; isSaved() is read-only. Allowlisted in
// tools/lint-no-localStorage-without-consent.mjs. Stdlib-only (NFR33).

const KEY_PREFIX = "iqme:saved-result:";

// FNV-1a 32-bit — deterministic, dependency-free, key-safe hex suffix from the
// in-memory session seed. Not a security primitive.
export function hashSeed(seed) {
  const s = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function keyFor(seed) {
  return KEY_PREFIX + hashSeed(seed);
}

// Read-only. Returns true iff a saved-result entry exists for this seed.
// Null-safe and quota/disabled-storage-safe.
export function isSaved(seed) {
  try {
    return window.localStorage.getItem(keyFor(seed)) !== null;
  } catch (_e) {
    return false;
  }
}

// Writes exactly one entry under iqme:saved-result:<hashSeed(seed)> with the
// scoring artifact + a savedAt timestamp. Idempotent for a given seed (same key,
// overwrites in place). `nowMs` is injected by tests for determinism; production
// defaults to Date.now() (confined to this module, never result.js).
export function saveResult(seed, artifact, nowMs) {
  const savedAt = typeof nowMs === "number" ? nowMs : Date.now();
  const payload = { ...(artifact || {}), savedAt };
  try {
    window.localStorage.setItem(keyFor(seed), JSON.stringify(payload));
  } catch (_e) {
    /* swallow — quota exceeded / storage disabled */
  }
}
