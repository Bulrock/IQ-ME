// tests/unit/locale-loader.test.mjs
//
// Story 3.3 AC-6 — src/assessment/i18n/locale-loader.js.
//
// Pattern follows tests/contract/state-shape.spec.mjs (Story 3-2):
// stub globals BEFORE dynamic-importing the SUT.
// Node 22 native node:test + node:assert/strict; no third-party deps.
//
// AC-6 contract (spec lines 89-96):
//   - named exports: load(localeCode), get(key), getCurrentLocale(); no default.
//   - load('en') → fetch('/src/content/i18n/en/strings.json'), parse JSON,
//     store, set currentLocale, return parsed namespace.
//   - load('ru') with fetch failure → retry once with 'en'.
//   - load('en') with EN fetch failure → resolve with {} (empty bundle).
//   - get('namespace.key') walks the current-locale's namespace; if undef,
//     falls back to 'en' cache; if still undef, returns the bare key literal
//     (architecture line 836 — 'highly-visible failure mode').
//   - getCurrentLocale() returns currentLocale (or null before any load).
//   - no localStorage / sessionStorage in source.
//
// Cycle-2 changes (per test-review):
//   F-11: replaced cumulative-state pattern with beforeEach() — each test
//         installs its own fetch responder set, eliminating ID-based ordering anti-pattern.
//   F-12: AC-6.5 also asserts typeof result === 'object' and pins getCurrentLocale() to 'en'
//         (the bundle actually served).
//   F-13: AC-6.6 also asserts get('landing.headline') === 'landing.headline' (bare-key
//         fallback under empty cache — the architecture-line-837 contract).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ── Fetch stub. Per-test responder map. ──────────────────────────────────

const fetchResponses = new Map(); // url → {ok, status, json:async ()=>obj} OR Error
const fetchCalls = [];

globalThis.fetch = async (url) => {
  fetchCalls.push(url);
  const responder = fetchResponses.get(url);
  if (!responder) {
    return { ok: false, status: 404, json: async () => ({}) };
  }
  if (responder instanceof Error) throw responder;
  return responder;
};

function resetFetch() {
  fetchResponses.clear();
  fetchCalls.length = 0;
}

const EN_BUNDLE = {
  chrome: {
    titleAppDefault: "IQ-ME — a fluid-reasoning screener",
    errorFallbackMessage: "Something went wrong loading the page.",
    appName: "IQ-ME",
  },
  landing: {
    headline: "Hello",
    intro: "Intro paragraph.",
    startTestButton: "Start the test",
    methodologyLink: "Read the methodology",
  },
  consent: {
    headline: "Consent",
    measuresWhat: "What it measures.",
    validityEnvelope: "Validity envelope.",
    visuospatialDisclosure: "Visuospatial disclosure.",
    continueButton: "Continue",
    notToday: "Not today",
  },
};

// ── Dynamic-import SUT ───────────────────────────────────────────────────

let loader;
let importError = null;
try {
  loader = await import("../../src/assessment/i18n/locale-loader.js");
} catch (err) {
  importError = err;
}

// F-11: beforeEach resets fetch counters. Tests that need EN-pre-loaded
// state install the EN responder and call loader.load('en') explicitly —
// no cumulative residue from prior tests.
beforeEach(() => {
  resetFetch();
});

// ─── AC-6.1: module shape ────────────────────────────────────────────────

test("AC-6.1: locale-loader.js exports load/get/getCurrentLocale (no default)", () => {
  assert.equal(importError, null, `locale-loader.js failed to import: ${importError?.message}`);
  assert.equal(typeof loader.load, "function");
  assert.equal(typeof loader.get, "function");
  assert.equal(typeof loader.getCurrentLocale, "function");
  assert.equal(loader.default, undefined);
});

// ─── AC-6.2: load('en') happy path ───────────────────────────────────────

test("AC-6.2: load('en') fetches /src/content/i18n/en/strings.json and resolves with the bundle", async () => {
  assert.equal(importError, null);
  fetchResponses.set("/src/content/i18n/en/strings.json", {
    ok: true, status: 200, json: async () => EN_BUNDLE,
  });
  const result = await loader.load("en");
  assert.deepEqual(fetchCalls, ["/src/content/i18n/en/strings.json"]);
  assert.equal(typeof result, "object", "must resolve with an object");
  assert.equal(loader.getCurrentLocale(), "en", "currentLocale must be 'en' after load('en')");
});

// ─── AC-6.3: get() returns EN string ─────────────────────────────────────

test("AC-6.3: get('landing.headline') returns the EN string after load('en')", async () => {
  // F-11: test populates its own cache via explicit load('en'); no dependency
  // on prior test execution order.
  assert.equal(importError, null);
  fetchResponses.set("/src/content/i18n/en/strings.json", {
    ok: true, status: 200, json: async () => EN_BUNDLE,
  });
  await loader.load("en");
  const v = loader.get("landing.headline");
  assert.equal(v, "Hello", `get('landing.headline') must return 'Hello', got: ${JSON.stringify(v)}`);
});

// ─── AC-6.4: bare-key fallback for missing keys ──────────────────────────

test("AC-6.4: get('nonexistent.key') returns the bare key literal", async () => {
  // F-11: independent of prior loads; ensure cache has EN bundle then query for missing key.
  assert.equal(importError, null);
  fetchResponses.set("/src/content/i18n/en/strings.json", {
    ok: true, status: 200, json: async () => EN_BUNDLE,
  });
  await loader.load("en");
  const v = loader.get("nonexistent.key");
  assert.equal(v, "nonexistent.key", `bare-key fallback failed; got: ${JSON.stringify(v)}`);
});

// ─── AC-6.5: RU fetch failure → EN retry (F-12 extended) ─────────────────

test("AC-6.5: load('ru') with fetch failure retries with 'en' AND returns the EN bundle; getCurrentLocale becomes 'en'", async () => {
  // F-12: also pin the post-retry result type and the getCurrentLocale value.
  // Rationale: the bundle actually served is EN, so all subsequent `get()`
  // reads target EN; the locale literal should reflect what's in the cache.
  assert.equal(importError, null);
  fetchResponses.set("/src/content/i18n/ru/strings.json", {
    ok: false, status: 404, json: async () => ({}),
  });
  fetchResponses.set("/src/content/i18n/en/strings.json", {
    ok: true, status: 200, json: async () => EN_BUNDLE,
  });
  const result = await loader.load("ru");
  assert.equal(fetchCalls[0], "/src/content/i18n/ru/strings.json", "RU URL must be attempted first");
  assert.equal(
    fetchCalls.includes("/src/content/i18n/en/strings.json"),
    true,
    "EN fallback URL must be tried after RU failure",
  );
  assert.equal(typeof result, "object", "retry must resolve with a (non-null) object");
  assert.notEqual(result, null);
  assert.equal(
    loader.getCurrentLocale(),
    "en",
    "getCurrentLocale must reflect the served bundle ('en') after RU→EN retry",
  );
});

// ─── AC-6.6: EN failure → empty bundle + bare-key fallback (F-13) ────────

test("AC-6.6: load('en') with EN fetch failure resolves with empty-ish bundle AND get() returns bare-key literals (architecture line 837)", async () => {
  // F-13: also assert bare-key fallback under empty cache. The architecture
  // mandates this as the 'highly-visible failure mode': the UI renders the
  // bare key literal (e.g. 'landing.headline' as text) when locale-load fails.
  // This is the loud failure pattern from architecture line 836-837.
  assert.equal(importError, null);
  fetchResponses.set("/src/content/i18n/en/strings.json", {
    ok: false, status: 500, json: async () => ({}),
  });
  await assert.doesNotReject(loader.load("en"));
  // After EN-fail-resolve, bare-key fallback must produce the key literal.
  const v = loader.get("landing.headline");
  assert.equal(
    v,
    "landing.headline",
    `bare-key fallback under empty cache must return key literal; got: ${JSON.stringify(v)}`,
  );
});

// ─── AC-6.7: source-grep ────────────────────────────────────────────────

test("AC-6.7: locale-loader.js source contains no forbidden globals", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "i18n", "locale-loader.js");
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`locale-loader.js source not readable: ${err.message}`); }
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden");
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden");
});
