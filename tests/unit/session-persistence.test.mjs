// tests/unit/session-persistence.test.mjs
//
// Story 11-1 fix — the resume payload must carry the user's ACTUAL per-item
// option choice (`selectedOptions`), not just the scored 0/1. This pins the
// data-model half of the "Previous/resume loses my selected answer" fix:
// `saveProgress` persists `selectedOptions` and `loadProgress` round-trips it,
// so item-runner can re-display the real selection (even a WRONG pick) until
// the user changes it.
//
// Node 22 native node:test; no third-party deps. localStorage stub mirrors
// tests/unit/result-save-retest.test.mjs lines 83-97.

import { test } from "node:test";
import assert from "node:assert/strict";

// ── localStorage stub (must precede dynamic import) ──────────────────────
const store = new Map();
const localStorageStub = {
  getItem(k) { return store.has(k) ? store.get(k) : null; },
  setItem(k, v) { store.set(k, String(v)); },
  removeItem(k) { store.delete(k); },
};
globalThis.window = { localStorage: localStorageStub };
globalThis.localStorage = localStorageStub;

const persistence = await import("../../src/assessment/session-persistence.js");

const KEY = "iqme:in-progress";
function freshState(overrides = {}) {
  return {
    currentItem: 2,
    responses: [
      { itemIndex: 0, response: 1 },
      { itemIndex: 1, response: 0 },
    ],
    seed: "a".repeat(32),
    startedAt: 1234567890,
    locale: "en",
    ...overrides,
  };
}

test("saveProgress persists the user's actual per-item selections (incl. a wrong pick)", () => {
  store.clear();
  const sel = { 0: "shapes/correct.svg", 1: "shapes/wrong-pick.svg" };
  persistence.saveProgress(freshState(), sel);
  const raw = store.get(KEY);
  assert.ok(raw, "iqme:in-progress must be written");
  const payload = JSON.parse(raw);
  assert.deepEqual(
    payload.selectedOptions,
    { 0: "shapes/correct.svg", 1: "shapes/wrong-pick.svg" },
    "the chosen option (incl. a WRONG pick) must be persisted, not just the 0/1 score",
  );
});

test("loadProgress round-trips selectedOptions + seed so a resumed session re-displays them", () => {
  store.clear();
  const sel = { 1: "shapes/wrong-pick.svg" };
  persistence.saveProgress(freshState(), sel);
  const loaded = persistence.loadProgress();
  assert.deepEqual(loaded.selectedOptions, { 1: "shapes/wrong-pick.svg" });
  assert.equal(loaded.seed, "a".repeat(32),
    "seed round-trips — item-runner matches selections to the resumed session by seed");
});

test("saveProgress without a selections arg writes an empty map (back-compat, never undefined)", () => {
  store.clear();
  persistence.saveProgress(freshState());
  const payload = JSON.parse(store.get(KEY));
  assert.deepEqual(payload.selectedOptions, {},
    "missing arg → {} so loadProgress + object spread on resume is always safe");
});

test("saveProgress is a no-op before the session starts (startedAt 0)", () => {
  store.clear();
  persistence.saveProgress(freshState({ startedAt: 0 }), { 0: "x.svg" });
  assert.equal(store.get(KEY), undefined, "no write before the session has begun");
});

test("clearProgress removes the in-progress key", () => {
  store.clear();
  persistence.saveProgress(freshState(), { 0: "x.svg" });
  assert.ok(store.get(KEY), "precondition: key present");
  persistence.clearProgress();
  assert.equal(store.has(KEY), false, "clearProgress removes iqme:in-progress");
});
