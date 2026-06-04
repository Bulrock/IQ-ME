// tests/unit/language-switcher.test.mjs
//
// Story 7.1 AC-3 + AC-4 + AC-10 — src/assessment/language-switcher.js.
//
// Keyboard-first locale radio group (EN/RU/PL) rendered into the
// chrome-header language-switcher slot (replacing the Story 6.4 placeholder
// span). NFR9 opt-in-storage discipline mirrors theme.js:
//
//   - init(slot, opts) renders one radio per SUPPORTED locale; the radio
//     matching opts.currentLocale is checked. ZERO localStorage writes on
//     init (NFR9 — no writes on page load).
//   - A locale radio click OUTSIDE an active session writes
//     localStorage.setItem("locale", code) exactly once, then reloads the
//     page (opts.reload — injected for testability; defaults to
//     window.location.reload).
//   - A locale radio click DURING an active session (opts.isSessionActive()
//     → true) writes NOTHING, does NOT reload, sets
//     data-locale-switch-blocked="true" on the fieldset, and invokes
//     opts.onBlockedAttempt(code). FR8 enforcement copy + the teachable hint
//     are Story 7.2 — 7.1 ships only this guard seam.
//
// Node 22 native node:test + node:assert/strict. No third-party deps.
// Mirrors the jsdom-stub + localStorage-spy pattern from theme.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ─── document + localStorage stubs (mirror theme.test.mjs) ───────────────

const documentElementAttrs = Object.create(null);
const documentElementStub = {
  setAttribute(k, v) { documentElementAttrs[k] = String(v); },
  removeAttribute(k) { delete documentElementAttrs[k]; },
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(documentElementAttrs, k) ? documentElementAttrs[k] : null; },
  hasAttribute(k) { return Object.prototype.hasOwnProperty.call(documentElementAttrs, k); },
};

const documentListeners = Object.create(null);

const setItemCalls = [];
const removeItemCalls = [];
let storedLocale = null;
const localStorageStub = {
  setItem(k, v) { setItemCalls.push([k, v]); if (k === "locale") storedLocale = String(v); },
  removeItem(k) { removeItemCalls.push(k); if (k === "locale") storedLocale = null; },
  getItem(k) { return k === "locale" ? storedLocale : null; },
  clear() { storedLocale = null; },
};

const reloadCalls = [];
globalThis.window = {
  localStorage: localStorageStub,
  location: { reload() { reloadCalls.push(1); } },
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.localStorage = localStorageStub;
globalThis.document = {
  documentElement: documentElementStub,
  createElement: (tag) => makeElementStub(String(tag).toLowerCase()),
  addEventListener(type, fn) { (documentListeners[type] ||= []).push(fn); },
  removeEventListener(type, fn) {
    const arr = documentListeners[type];
    if (!arr) return;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  },
  dispatchEvent(ev) {
    const arr = documentListeners[ev.type] || [];
    for (const h of arr) { try { h(ev); } catch (_e) { /* swallow */ } }
    return !ev.defaultPrevented;
  },
};

function resetSpies() {
  setItemCalls.length = 0;
  removeItemCalls.length = 0;
  reloadCalls.length = 0;
  storedLocale = null;
  for (const k of Object.keys(documentElementAttrs)) delete documentElementAttrs[k];
}

const STRINGS = { chrome: { languageSwitcherLegend: "Language" } };

function syntheticChangeEvent(target) {
  return { type: "change", target, currentTarget: target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}

function findRadio(root, value) {
  for (const r of root.querySelectorAll("input")) {
    if (r.attrs && r.attrs.type === "radio" && r.attrs.value === value) return r;
  }
  return null;
}

function findFieldset(root) {
  return root.querySelector("fieldset") || root.querySelector(".language-switcher");
}

function makeSlot() {
  return makeRootEl({ class: "chrome-header__language-switcher" });
}

// ─── Dynamic-import SUT — RED until language-switcher.js exists ──────────

let mod;
let importError = null;
try {
  mod = await import("../../src/assessment/language-switcher.js");
} catch (err) { importError = err; }

// ─── AC-3: render — three radios, current locale checked, zero writes ────

test("language-switcher AC-3.a: init() renders EN/RU/PL radios with currentLocale checked; ZERO setItem on render (NFR9)", () => {
  assert.equal(importError, null, `language-switcher.js failed to import (RED expected until impl): ${importError?.message}`);
  resetSpies();
  const slot = makeSlot();
  mod.init(slot, { strings: STRINGS, currentLocale: "ru" });

  for (const code of ["en", "ru", "pl"]) {
    assert.ok(findRadio(slot, code), `radio[value="${code}"] must be rendered`);
  }
  const ru = findRadio(slot, "ru");
  assert.equal(ru.attrs.checked, "checked", "the radio matching currentLocale must be checked");
  assert.equal(setItemCalls.length, 0, "init() MUST NOT write localStorage on render (NFR9)");
  assert.equal(reloadCalls.length, 0, "init() MUST NOT reload on render");
});

test("language-switcher AC-3.b: fieldset legend uses chrome.languageSwitcherLegend", () => {
  resetSpies();
  const slot = makeSlot();
  mod.init(slot, { strings: STRINGS, currentLocale: "en" });
  const fs = findFieldset(slot);
  assert.ok(fs, ".language-switcher fieldset must exist");
  const legend = fs.querySelector("legend");
  assert.ok(legend, "fieldset must contain a <legend>");
  assert.equal(legend.textContent, "Language", "legend text must come from chrome.languageSwitcherLegend");
});

// ─── AC-3: not-in-session click → setItem once + reload ──────────────────

test("language-switcher AC-3.c: click outside a session writes ['locale',code] ONCE and reloads", () => {
  resetSpies();
  const slot = makeSlot();
  mod.init(slot, { strings: STRINGS, currentLocale: "en", isSessionActive: () => false });

  const ru = findRadio(slot, "ru");
  ru.attrs.checked = "checked";
  ru.dispatchEvent(syntheticChangeEvent(ru));

  assert.deepEqual(setItemCalls, [["locale", "ru"]], "exactly one setItem(['locale','ru']) on explicit click");
  assert.equal(reloadCalls.length, 1, "click outside session must reload the page once");
});

// ─── AC-4: in-session click → blocked (no write, no reload, attr + callback) ─

test("language-switcher AC-4.a: click DURING a session writes NOTHING, does NOT reload, sets data-locale-switch-blocked, invokes onBlockedAttempt", () => {
  resetSpies();
  const blocked = [];
  const slot = makeSlot();
  mod.init(slot, {
    strings: STRINGS,
    currentLocale: "en",
    isSessionActive: () => true,
    onBlockedAttempt: (code) => blocked.push(code),
  });

  const pl = findRadio(slot, "pl");
  pl.attrs.checked = "checked";
  pl.dispatchEvent(syntheticChangeEvent(pl));

  assert.equal(setItemCalls.length, 0, "in-session switch attempt MUST NOT write localStorage (FR8)");
  assert.equal(reloadCalls.length, 0, "in-session switch attempt MUST NOT reload (FR8 — locale locked mid-session)");
  const fs = findFieldset(slot);
  assert.equal(fs.getAttribute("data-locale-switch-blocked"), "true", "fieldset must carry data-locale-switch-blocked='true' (Story 7.2 hint hook)");
  assert.deepEqual(blocked, ["pl"], "onBlockedAttempt(code) must fire with the attempted locale");
});

test("language-switcher AC-4.b: default isSessionActive without an active session allows the switch (no false block)", () => {
  resetSpies();
  const slot = makeSlot();
  // Omit isSessionActive → default must treat 'no detectable session' as not-active.
  mod.init(slot, { strings: STRINGS, currentLocale: "en" });
  const ru = findRadio(slot, "ru");
  ru.attrs.checked = "checked";
  ru.dispatchEvent(syntheticChangeEvent(ru));
  assert.deepEqual(setItemCalls, [["locale", "ru"]], "with no active session the switch persists");
  assert.equal(reloadCalls.length, 1);
});
