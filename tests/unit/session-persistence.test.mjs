// tests/unit/session-persistence.test.mjs
//
// Story 11-1 fix — multi-session resume + selected-option retention.
//   1. Each started test is keyed by its seed (iqme:in-progress:<seed>), so a
//      new test never clobbers an earlier one — there can be any number of
//      unfinished tests (listProgress returns them all).
//   2. The payload carries `selectedOptions` (itemIndex → the option actually
//      picked), not just the scored 0/1, so Previous/resume re-displays the real
//      choice (incl. a wrong pick) until the user changes it.
//   3. A legacy single-slot key (iqme:in-progress) migrates into a keyed entry.
//
// Node 22 native node:test; no third-party deps. localStorage stub implements
// the iterable Storage surface (length + key(i)) the multi-session scan needs.

import { test } from "node:test";
import assert from "node:assert/strict";

// ── localStorage stub (must precede dynamic import) ──────────────────────
const store = new Map();
const localStorageStub = {
  getItem(k) { return store.has(k) ? store.get(k) : null; },
  setItem(k, v) { store.set(k, String(v)); },
  removeItem(k) { store.delete(k); },
  key(i) { return Array.from(store.keys())[i] ?? null; },
  get length() { return store.size; },
};
globalThis.window = { localStorage: localStorageStub };
globalThis.localStorage = localStorageStub;

const persistence = await import("../../src/assessment/session-persistence.js");

const PREFIX = "iqme:in-progress:";
const SEED_A = "a".repeat(32);
const SEED_B = "b".repeat(32);

function freshState(seed, overrides = {}) {
  return {
    currentItem: 2,
    responses: [
      { itemIndex: 0, response: 1 },
      { itemIndex: 1, response: 0 },
    ],
    seed,
    startedAt: 1234567890,
    locale: "en",
    ...overrides,
  };
}

test("saveProgress keys each session by its seed and persists the actual picks", () => {
  store.clear();
  persistence.saveProgress(freshState(SEED_A), { 0: "opt-005-5.svg", 1: "opt-007-5.svg" });
  const raw = store.get(PREFIX + SEED_A);
  assert.ok(raw, "must write iqme:in-progress:<seed>");
  const payload = JSON.parse(raw);
  assert.equal(payload.seed, SEED_A);
  assert.deepEqual(
    payload.selectedOptions,
    { 0: "opt-005-5.svg", 1: "opt-007-5.svg" },
    "the chosen option (incl. a WRONG pick) is persisted, not just the 0/1 score",
  );
});

test("starting a second test does NOT clobber the first — both are preserved", () => {
  store.clear();
  persistence.saveProgress(freshState(SEED_A), { 0: "opt-005-5.svg" });
  persistence.saveProgress(freshState(SEED_B, { startedAt: 1234999999 }), { 0: "opt-008-3.svg" });
  const list = persistence.listProgress();
  assert.equal(list.length, 2, "both unfinished tests are kept");
  assert.deepEqual(list.map((p) => p.seed).sort(), [SEED_A, SEED_B].sort());
});

test("listProgress returns most-recently-saved first", () => {
  store.clear();
  persistence.saveProgress(freshState(SEED_A, { startedAt: 1000 }), {});
  // bump savedAt ordering deterministically
  const a = JSON.parse(store.get(PREFIX + SEED_A)); a.savedAt = 100; store.set(PREFIX + SEED_A, JSON.stringify(a));
  persistence.saveProgress(freshState(SEED_B), {});
  const b = JSON.parse(store.get(PREFIX + SEED_B)); b.savedAt = 200; store.set(PREFIX + SEED_B, JSON.stringify(b));
  const list = persistence.listProgress();
  assert.equal(list[0].seed, SEED_B, "newest first");
});

test("loadProgress(seed) round-trips selectedOptions for the resumed session", () => {
  store.clear();
  persistence.saveProgress(freshState(SEED_A), { 1: "opt-007-5.svg" });
  const loaded = persistence.loadProgress(SEED_A);
  assert.deepEqual(loaded.selectedOptions, { 1: "opt-007-5.svg" });
  assert.equal(persistence.loadProgress(SEED_B), null, "unknown seed → null");
});

test("clearProgress(seed) removes only that session; no-arg clears all", () => {
  store.clear();
  persistence.saveProgress(freshState(SEED_A), {});
  persistence.saveProgress(freshState(SEED_B), {});
  persistence.clearProgress(SEED_A);
  assert.equal(persistence.listProgress().length, 1, "only the targeted session is removed");
  assert.equal(persistence.listProgress()[0].seed, SEED_B);
  persistence.clearProgress();
  assert.equal(persistence.listProgress().length, 0, "no-arg clears every unfinished test");
});

test("legacy single-slot iqme:in-progress migrates into a keyed entry", () => {
  store.clear();
  store.set("iqme:in-progress", JSON.stringify({
    seed: SEED_A, currentItem: 3, responses: [{ itemIndex: 0, response: 1 }],
    selectedOptions: { 0: "opt-005-2.svg" }, startedAt: 1, savedAt: 2,
  }));
  const list = persistence.listProgress();
  assert.equal(list.length, 1, "legacy entry surfaces as a normal session");
  assert.equal(list[0].seed, SEED_A);
  assert.equal(store.has("iqme:in-progress"), false, "bare legacy key is removed after migration");
  assert.ok(store.has(PREFIX + SEED_A), "migrated to the seed-keyed slot");
});

test("saveProgress is a no-op before a real session (startedAt 0 / initial seed)", () => {
  store.clear();
  persistence.saveProgress(freshState(SEED_A, { startedAt: 0 }), { 0: "x.svg" });
  persistence.saveProgress(freshState("0".repeat(32)), { 0: "x.svg" });
  assert.equal(persistence.listProgress().length, 0, "nothing written before the session truly starts");
});
