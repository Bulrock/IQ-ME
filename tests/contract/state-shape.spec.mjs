// tests/contract/state-shape.spec.mjs
//
// Story 3.2 — contract test: src/assessment/state.js full lifecycle must
// produce schema-valid state at every transition, must overwrite (not append)
// on revision, and must never touch localStorage / sessionStorage.
//
// Pattern follows tokens.spec.mjs (Story 1.10) — node:test + node:assert/strict,
// no third-party test framework, JSON schema validated via the scope-limited
// in-test helper (`./_state-schema-check.mjs`, Story 3.2 Dev Notes Decision #1).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const SCHEMA_PATH = resolve(REPO_ROOT, "src/assessment/state.schema.json");

// ── Storage stubs MUST be installed before importing state.js ────────────
// Node 22 does not ship localStorage / sessionStorage as globals. Install
// counting stubs to assert the module never touches them.

function makeStorageStub() {
  const calls = { setItem: 0, getItem: 0, removeItem: 0, clear: 0 };
  return {
    setItem: (_k, _v) => { calls.setItem++; },
    getItem: (_k) => { calls.getItem++; return null; },
    removeItem: (_k) => { calls.removeItem++; },
    clear: () => { calls.clear++; },
    _calls: calls,
  };
}

const localStorageStub = makeStorageStub();
const sessionStorageStub = makeStorageStub();

// Install BEFORE importing state.js so any (forbidden) reference during
// module init is captured. Node 22 lets us assign to globalThis.localStorage.
globalThis.localStorage = localStorageStub;
globalThis.sessionStorage = sessionStorageStub;

const stateModule = await import("../../src/assessment/state.js");
const { getState, resetState, setSeed, setLocale, setItem, recordResponse } = stateModule;
const { validateState } = await import("./_state-schema-check.mjs");

const SCHEMA = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const VALID_SEED = "0123456789abcdef0123456789abcdef";

beforeEach(() => {
  resetState();
});

test("state.js init shape — fresh state validates against schema", () => {
  const s = getState();
  assert.equal(typeof s, "object");
  assert.equal(s.currentItem, 0);
  assert.ok(Array.isArray(s.responses));
  assert.equal(s.responses.length, 0);
  assert.equal(typeof s.startedAt, "number");
  assert.ok(s.startedAt >= 0);
  assert.equal(s.locale, "en");
  assert.match(s.seed, /^[0-9a-f]{32}$/);
  const { valid, errors } = validateState(s, SCHEMA);
  assert.ok(valid, `init state failed schema: ${errors.join("; ")}`);
});

test("state.js exports only named functions (no default, no module.exports)", () => {
  assert.equal(typeof getState, "function");
  assert.equal(typeof resetState, "function");
  assert.equal(typeof setSeed, "function");
  assert.equal(typeof setLocale, "function");
  assert.equal(typeof setItem, "function");
  assert.equal(typeof recordResponse, "function");
  assert.equal(stateModule.default, undefined, "must not export a default");
});

test("getState() returns a deep-frozen snapshot — callers cannot mutate", () => {
  setSeed(VALID_SEED);
  setItem(0);
  recordResponse(0, 1);
  const s = getState();
  assert.throws(() => { s.currentItem = 999; }, /Cannot assign|read only|extensible/i);
  assert.throws(() => { s.responses.push({ itemIndex: 99, response: 0 }); }, /not extensible|Cannot add|object is not extensible/i);
  assert.throws(() => { s.responses[0].response = 0; }, /Cannot assign|read only/i);
});

test("setSeed accepts 32-char lowercase hex", () => {
  setSeed(VALID_SEED);
  assert.equal(getState().seed, VALID_SEED);
  assert.equal(localStorageStub._calls.setItem, 0);
  assert.equal(sessionStorageStub._calls.setItem, 0);
});

test("setSeed rejects non-hex / uppercase / wrong length", () => {
  assert.throws(() => setSeed("0123456789ABCDEF0123456789abcdef"), TypeError);
  assert.throws(() => setSeed("xyz"), TypeError);
  assert.throws(() => setSeed("0123456789abcdef0123456789abcde"), TypeError); // 31 chars
  assert.throws(() => setSeed("0123456789abcdef0123456789abcdef0"), TypeError); // 33 chars
  assert.throws(() => setSeed(12345), TypeError);
  assert.throws(() => setSeed(null), TypeError);
});

test("setLocale accepts en|ru|pl", () => {
  setLocale("en");
  assert.equal(getState().locale, "en");
  setLocale("ru");
  assert.equal(getState().locale, "ru");
  setLocale("pl");
  assert.equal(getState().locale, "pl");
});

test("setLocale rejects values outside enum", () => {
  assert.throws(() => setLocale("de"), RangeError);
  assert.throws(() => setLocale("EN"), RangeError);
  assert.throws(() => setLocale(""), RangeError);
  assert.throws(() => setLocale(null), RangeError);
});

test("setItem accepts non-negative integers; rejects negatives + non-integers", () => {
  setItem(0);
  assert.equal(getState().currentItem, 0);
  setItem(15);
  assert.equal(getState().currentItem, 15);
  assert.throws(() => setItem(-1), RangeError);
  assert.throws(() => setItem(1.5), TypeError);
  assert.throws(() => setItem("0"), TypeError);
  assert.throws(() => setItem(null), TypeError);
});

test("recordResponse appends valid {itemIndex, response} entries", () => {
  for (let i = 0; i < 16; i++) {
    setItem(i);
    recordResponse(i, i % 2);
  }
  const s = getState();
  assert.equal(s.responses.length, 16);
  for (let i = 0; i < 16; i++) {
    assert.deepEqual(s.responses[i], { itemIndex: i, response: i % 2 });
  }
});

test("recordResponse overwrites existing entry on revision (FR2 semantics)", () => {
  setItem(0);
  recordResponse(0, 0);
  setItem(1);
  recordResponse(1, 1);
  setItem(2);
  recordResponse(2, 0);
  assert.equal(getState().responses.length, 3);

  // Revise itemIndex=0
  recordResponse(0, 1);
  const s = getState();
  assert.equal(s.responses.length, 3, "revision must overwrite, not append");
  // Find the entry with itemIndex=0 and verify it's now 1
  const revised = s.responses.find(r => r.itemIndex === 0);
  assert.equal(revised.response, 1);
});

test("recordResponse rejects response outside {0, 1}", () => {
  setItem(0);
  assert.throws(() => recordResponse(0, 2), RangeError);
  assert.throws(() => recordResponse(0, -1), RangeError);
  assert.throws(() => recordResponse(0, 0.5), RangeError);
  assert.throws(() => recordResponse(0, "0"), RangeError);
  assert.throws(() => recordResponse(0, null), RangeError);
});

test("recordResponse rejects negative or non-integer itemIndex", () => {
  assert.throws(() => recordResponse(-1, 0), RangeError);
  assert.throws(() => recordResponse(1.5, 0), TypeError);
  assert.throws(() => recordResponse("0", 0), TypeError);
});

test("full 16-item lifecycle yields schema-valid final state with zero storage writes", () => {
  setSeed(VALID_SEED);
  setLocale("en");
  for (let i = 0; i < 16; i++) {
    setItem(i);
    recordResponse(i, i % 2);
  }
  const s = getState();
  assert.equal(s.responses.length, 16);
  assert.equal(s.seed, VALID_SEED);
  assert.equal(s.locale, "en");
  const { valid, errors } = validateState(s, SCHEMA);
  assert.ok(valid, `final state failed schema: ${errors.join("; ")}`);
  assert.equal(localStorageStub._calls.setItem, 0, "no localStorage.setItem calls allowed");
  assert.equal(sessionStorageStub._calls.setItem, 0, "no sessionStorage.setItem calls allowed");
});

test("resetState restores empty-init shape", () => {
  setSeed(VALID_SEED);
  setItem(5);
  recordResponse(5, 1);
  resetState();
  const s = getState();
  assert.equal(s.currentItem, 0);
  assert.equal(s.responses.length, 0);
  assert.equal(s.locale, "en");
  assert.match(s.seed, /^[0-9a-f]{32}$/);
  const { valid } = validateState(s, SCHEMA);
  assert.ok(valid);
});

test("schema-check helper rejects malformed states (negative assertions)", () => {
  const base = {
    currentItem: 0,
    responses: [],
    startedAt: 0,
    locale: "en",
    seed: "0".repeat(32),
  };

  // Wrong seed pattern (uppercase)
  const badSeed = { ...base, seed: "0123456789ABCDEF0123456789abcdef" };
  assert.equal(validateState(badSeed, SCHEMA).valid, false);

  // Locale outside enum
  const badLocale = { ...base, locale: "de" };
  assert.equal(validateState(badLocale, SCHEMA).valid, false);

  // Missing required property
  const missing = { ...base };
  delete missing.seed;
  assert.equal(validateState(missing, SCHEMA).valid, false);

  // Additional property
  const extra = { ...base, foo: "bar" };
  assert.equal(validateState(extra, SCHEMA).valid, false);

  // Negative currentItem
  const negCurrent = { ...base, currentItem: -1 };
  assert.equal(validateState(negCurrent, SCHEMA).valid, false);

  // Response with invalid enum value
  const badResp = { ...base, responses: [{ itemIndex: 0, response: 2 }] };
  assert.equal(validateState(badResp, SCHEMA).valid, false);
});
