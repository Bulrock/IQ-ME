// src/assessment/session-persistence.js
//
// Story 11-1 — resume interrupted tests. Always-on auto-save (NFR9 relaxed per
// maintainer decision). Multi-session: each started test kept under its own
// `iqme:in-progress:<seed>` key; payload carries `selectedOptions` (itemIndex →
// picked option) so resume/Previous re-displays the real choice. Quota-safe.

const PREFIX = "iqme:in-progress:";
const LEGACY_KEY = "iqme:in-progress"; // pre-multi single-slot key
const SESSION_SIZE = 16;
const INITIAL_SEED = "0".repeat(32);

const keyFor = (seed) => PREFIX + seed;

// All localStorage keys for in-progress sessions.
function progressKeys() {
  const out = [];
  try {
    const ls = window.localStorage;
    for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(PREFIX)) out.push(k); }
  } catch (_e) { /* swallow */ }
  return out;
}

// Idempotent one-time migration of the pre-multi single-slot key → seed-keyed.
function migrateLegacy() {
  try {
    const ls = window.localStorage;
    const raw = ls.getItem(LEGACY_KEY);
    if (raw == null) return;
    try {
      const p = JSON.parse(raw);
      if (p && p.seed && ls.getItem(keyFor(p.seed)) == null) ls.setItem(keyFor(p.seed), raw);
    } catch (_e) { /* drop malformed legacy blob */ }
    ls.removeItem(LEGACY_KEY);
  } catch (_e) { /* swallow */ }
}

// Persist the live session under its seed. No-op before it has a real seed /
// has started, or once complete (all 16 answered → finalizing, not resumable).
export function saveProgress(state, selectedOptions) {
  try {
    if (!state || state.startedAt === 0 || !state.seed || state.seed === INITIAL_SEED) return;
    if (Array.isArray(state.responses) && state.responses.length >= SESSION_SIZE) return;
    window.localStorage.setItem(keyFor(state.seed), JSON.stringify({
      seed: state.seed,
      currentItem: state.currentItem,
      responses: (state.responses || []).map((r) => ({ itemIndex: r.itemIndex, response: r.response })),
      selectedOptions: selectedOptions && typeof selectedOptions === "object" ? { ...selectedOptions } : {},
      startedAt: state.startedAt,
      savedAt: Date.now(),
    }));
  } catch (_e) { /* swallow — quota / disabled storage */ }
}

// One in-progress session by seed (restores the live session).
export function loadProgress(seed) {
  try {
    const raw = seed ? window.localStorage.getItem(keyFor(seed)) : null;
    return raw ? JSON.parse(raw) : null;
  } catch (_e) { return null; }
}

// All in-progress sessions, most-recently-saved first (the "Unfinished" list).
export function listProgress() {
  migrateLegacy();
  const out = [];
  for (const k of progressKeys()) {
    try { const p = JSON.parse(window.localStorage.getItem(k)); if (p && p.seed) out.push(p); } catch (_e) { /* skip */ }
  }
  return out.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

// Remove one session by seed; with no seed, remove ALL in-progress sessions.
export function clearProgress(seed) {
  try {
    if (seed) { window.localStorage.removeItem(keyFor(seed)); return; }
    migrateLegacy();
    progressKeys().forEach((k) => window.localStorage.removeItem(k));
  } catch (_e) { /* swallow */ }
}

// True iff ≥1 in-progress session exists (landing entry-point gate).
export function hasProgress() {
  migrateLegacy();
  return progressKeys().length > 0;
}
