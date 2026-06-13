// src/assessment/session-persistence.js
//
// Story 11-1 — resume interrupted tests. Always-on auto-save (NFR9 relaxed per
// maintainer decision). Multi-session: each started test kept under its own
// `iqme:in-progress:<seed>` key; payload carries `selectedOptions` (itemIndex →
// picked option) so resume/Previous re-displays the real choice. Quota-safe.

import { resolveFromState } from "./methodology-registry.js";

const PREFIX = "iqme:in-progress:";
const LEGACY_KEY = "iqme:in-progress"; // pre-multi single-slot key
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
    // Nothing answered yet → don't persist an empty session (avoids a fresh mount
    // creating a junk "Unfinished — item 1 of N" entry with no responses).
    if (!Array.isArray(state.responses) || state.responses.length === 0) return;
    // Story 12-3: the "session complete → don't persist" cutoff is the chosen
    // variant's session size, not a hardcoded 16 (a 24-item full variant must
    // remain resumable at items 17–23).
    const sessionSize = resolveFromState(state).sessionSize;
    if (state.responses.length >= sessionSize) return;
    window.localStorage.setItem(keyFor(state.seed), JSON.stringify({
      seed: state.seed,
      currentItem: state.currentItem,
      responses: (state.responses || []).map((r) => ({ itemIndex: r.itemIndex, response: r.response })),
      selectedOptions: selectedOptions && typeof selectedOptions === "object" ? { ...selectedOptions } : {},
      startedAt: state.startedAt,
      // Story 12-3: persist the methodology + variant so resume rebuilds the
      // SAME pool/size (without these, a resumed full/letter-number session
      // would fall back to geometric short → wrong pool).
      methodology: state.methodology,
      variant: state.variant,
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

// All resumable in-progress sessions, most-recently-saved first (the
// "Unfinished" list). A session with zero answers isn't resumable — drop those
// (and unparseable blobs) so stale empty entries don't clutter storage or the UI.
export function listProgress() {
  migrateLegacy();
  const out = [];
  for (const k of progressKeys()) {
    let p = null;
    try { p = JSON.parse(window.localStorage.getItem(k)); } catch (_e) { /* junk */ }
    if (p && p.seed && Array.isArray(p.responses) && p.responses.length > 0) out.push(p);
    else { try { window.localStorage.removeItem(k); } catch (_e) { /* swallow */ } }
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

// True iff ≥1 resumable (answered) in-progress session exists (landing gate).
export function hasProgress() {
  return listProgress().length > 0;
}
