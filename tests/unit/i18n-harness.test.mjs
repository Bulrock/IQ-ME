// tests/unit/i18n-harness.test.mjs
//
// Story 7.1 AC-1 + AC-2 + AC-10 — locale-loader.js EXTENSIONS for the
// Epic-7 i18n harness. These are NEW exports layered on top of the Story 3.3
// load()/get()/getCurrentLocale() core (whose own contract is covered by
// locale-loader.test.mjs and MUST remain green — incl. AC-6.7's
// no-localStorage-in-source invariant). The extensions added here are PURE:
//
//   - SUPPORTED: readonly ["en","ru","pl"] (Architecture gap #2).
//   - normalizeLocale(code): lowercases + primary-subtag + SUPPORTED-guard,
//     falling back to "en" for anything unsupported. Pure, no I/O.
//   - t(key): alias of get(key) — same return for present + missing keys
//     (incl. the bare-key-literal failure mode, architecture line 836-837).
//   - resolveInitialLocale({stored, navigatorLang}): PURE boot-locale
//     resolver. Precedence: stored (if in SUPPORTED) > normalizeLocale(
//     navigatorLang) > "en". Reads NO globals — the localStorage read lives
//     in main.js (keeps locale-loader.js storage-free per 3.3 AC-6.7).
//
// Node 22 native node:test + node:assert/strict. No third-party deps.
// RED until the AC-1/AC-2 exports land in src/assessment/i18n/locale-loader.js.

import { test } from "node:test";
import assert from "node:assert/strict";

// Fetch stub so importing the module (which references fetch in load()) is safe
// even though these tests exercise only the pure exports.
globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });

let loader;
let importError = null;
try {
  loader = await import("../../src/assessment/i18n/locale-loader.js");
} catch (err) {
  importError = err;
}

// ─── AC-1: SUPPORTED export ──────────────────────────────────────────────

test("AC-1.a: SUPPORTED is exactly ['en','ru','pl']", () => {
  assert.equal(importError, null, `locale-loader.js failed to import: ${importError?.message}`);
  assert.ok(Array.isArray(loader.SUPPORTED), "SUPPORTED must be an array");
  assert.deepEqual([...loader.SUPPORTED], ["en", "ru", "pl"]);
});

// ─── AC-1: normalizeLocale ───────────────────────────────────────────────

test("AC-1.b: normalizeLocale lowercases + takes primary subtag for supported locales", () => {
  assert.equal(loader.normalizeLocale("ru-RU"), "ru");
  assert.equal(loader.normalizeLocale("PL"), "pl");
  assert.equal(loader.normalizeLocale("en-US"), "en");
  assert.equal(loader.normalizeLocale("ru"), "ru");
});

test("AC-1.c: normalizeLocale falls back to 'en' for unsupported / junk input", () => {
  assert.equal(loader.normalizeLocale("de"), "en");
  assert.equal(loader.normalizeLocale("fr-FR"), "en");
  assert.equal(loader.normalizeLocale(""), "en");
  assert.equal(loader.normalizeLocale(undefined), "en");
  assert.equal(loader.normalizeLocale(null), "en");
});

// ─── AC-1: t() is an alias of get() ──────────────────────────────────────

test("AC-1.d: t(key) returns the same as get(key) — bare-key literal for missing keys", () => {
  assert.equal(typeof loader.t, "function");
  // No bundle loaded → both must return the bare-key literal (highly-visible
  // failure mode). They must agree.
  assert.equal(loader.t("landing.headline"), loader.get("landing.headline"));
  assert.equal(loader.t("nonexistent.key"), "nonexistent.key");
});

// ─── AC-2: resolveInitialLocale is pure (no global reads) ────────────────

test("AC-2.a: resolveInitialLocale prefers a supported stored locale", () => {
  assert.equal(typeof loader.resolveInitialLocale, "function");
  assert.equal(loader.resolveInitialLocale({ stored: "ru", navigatorLang: "en-US" }), "ru");
  assert.equal(loader.resolveInitialLocale({ stored: "pl", navigatorLang: "ru-RU" }), "pl");
});

test("AC-2.b: resolveInitialLocale falls back to navigatorLang when stored is absent/unsupported", () => {
  assert.equal(loader.resolveInitialLocale({ stored: null, navigatorLang: "ru-RU" }), "ru");
  assert.equal(loader.resolveInitialLocale({ stored: "de", navigatorLang: "pl-PL" }), "pl");
  assert.equal(loader.resolveInitialLocale({ stored: "", navigatorLang: "PL" }), "pl");
});

test("AC-2.c: resolveInitialLocale falls back to 'en' when neither stored nor navigatorLang is supported", () => {
  assert.equal(loader.resolveInitialLocale({ stored: null, navigatorLang: "de-DE" }), "en");
  assert.equal(loader.resolveInitialLocale({ stored: undefined, navigatorLang: undefined }), "en");
  assert.equal(loader.resolveInitialLocale({}), "en");
});

test("AC-2.d: resolveInitialLocale reads NO globals (locale-loader stays storage-free, 3.3 AC-6.7)", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "i18n", "locale-loader.js");
  const source = readFileSync(SRC, "utf8");
  // Re-assert the 3.3 invariant from the 7.1 surface: the new exports must
  // not have smuggled storage/navigator global reads into the core module.
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage must not appear in locale-loader.js");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage must not appear");
  assert.equal(/\bnavigator\b/.test(source), false, "navigator global must not be read in locale-loader.js (pass navigatorLang as an arg)");
});
