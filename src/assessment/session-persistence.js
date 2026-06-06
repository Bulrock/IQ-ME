// src/assessment/session-persistence.js
//
// Story 11-1 — resume an interrupted test. Auto-saves the in-progress session
// (current item + responses + seed) to localStorage so it can be resumed (or
// deleted) from the saved-results page. Per maintainer decision this is
// always-on (NFR9 relaxed for the in-progress key specifically — the prior
// no-write-without-consent posture is documented as superseded for resume).
// Stdlib-only; quota/disabled-storage-safe.

const KEY = "iqme:in-progress";
const SESSION_SIZE = 16;

// Persist the live session. No-op before the session has started (startedAt 0)
// or once it's complete (all 16 answered → it's about to finalize, not resume).
export function saveProgress(state, selectedOptions) {
  try {
    if (!state || state.startedAt === 0) return;
    if (Array.isArray(state.responses) && state.responses.length >= SESSION_SIZE) return;
    const payload = {
      currentItem: state.currentItem,
      responses: (state.responses || []).map((r) => ({ itemIndex: r.itemIndex, response: r.response })),
      // Story 11-1 fix: the actual option chosen per item (itemIndex → value).
      // The scored `responses` keep only correctness (0/1); persisting the
      // selection lets Previous/resume re-display it until the user changes it.
      selectedOptions: selectedOptions && typeof selectedOptions === "object" ? { ...selectedOptions } : {},
      seed: state.seed,
      startedAt: state.startedAt,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (_e) { /* swallow — quota / disabled storage */ }
}

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_e) { return null; }
}

export function clearProgress() {
  try { window.localStorage.removeItem(KEY); } catch (_e) { /* swallow */ }
}

export function hasProgress() {
  try { return window.localStorage.getItem(KEY) !== null; } catch (_e) { return false; }
}
