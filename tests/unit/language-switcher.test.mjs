// tests/unit/language-switcher.test.mjs
//
// Story 7.1 AC-3 + AC-4 — src/assessment/language-switcher.js.
//
// Locale selector (EN/RU/PL) rendered into the chrome-header slot. PR-7
// (Story 11-1, AC9) reshapes it from a radio group into a custom accessible
// dropdown with country flags. NFR9 opt-in-storage + FR8 block are unchanged:
//
//   - init(slot, opts) renders a trigger button + a role="listbox" of options,
//     one per SUPPORTED locale; the option matching opts.currentLocale gets
//     aria-selected="true". ZERO localStorage writes on init.
//   - Selecting an option OUTSIDE an active session writes
//     localStorage.setItem("locale", code) exactly once, then reloads.
//   - Selecting DURING an active session (opts.isSessionActive() → true) writes
//     NOTHING, does NOT reload, sets data-locale-switch-blocked="true" on the
//     container, and invokes opts.onBlockedAttempt(code).
//
// Node 22 native node:test + node:assert/strict. No third-party deps.

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

function syntheticClickEvent(target) {
  return { type: "click", target, currentTarget: target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}

function findOption(root, code) {
  for (const o of root.querySelectorAll(".language-switcher__option")) {
    if (o.getAttribute && o.getAttribute("data-lang-option") === code) return o;
  }
  return null;
}

function findContainer(root) {
  return root.querySelector(".language-switcher");
}

function findTrigger(root) {
  return root.querySelector(".language-switcher__trigger");
}

function makeSlot() {
  return makeRootEl({ class: "chrome-header__language-switcher" });
}

// ─── Dynamic-import SUT ──────────────────────────────────────────────────

let mod;
let importError = null;
try {
  mod = await import("../../src/assessment/language-switcher.js");
} catch (err) { importError = err; }

// ─── AC-3: render — three options, current locale aria-selected, zero writes ─

test("language-switcher AC-3.a: init() renders EN/RU/PL options with currentLocale aria-selected; ZERO setItem on render (NFR9)", () => {
  assert.equal(importError, null, `language-switcher.js failed to import: ${importError?.message}`);
  resetSpies();
  const slot = makeSlot();
  mod.init(slot, { strings: STRINGS, currentLocale: "ru" });

  for (const code of ["en", "ru", "pl"]) {
    assert.ok(findOption(slot, code), `option[data-lang-option="${code}"] must be rendered`);
  }
  const ru = findOption(slot, "ru");
  assert.equal(ru.getAttribute("aria-selected"), "true", "the option matching currentLocale must be aria-selected");
  assert.equal(findOption(slot, "en").getAttribute("aria-selected"), "false", "non-current options must be aria-selected='false'");
  assert.equal(setItemCalls.length, 0, "init() MUST NOT write localStorage on render (NFR9)");
  assert.equal(reloadCalls.length, 0, "init() MUST NOT reload on render");
});

test("language-switcher AC-3.b: trigger is a listbox-popup button labelled from chrome.languageSwitcherLegend", () => {
  resetSpies();
  const slot = makeSlot();
  mod.init(slot, { strings: STRINGS, currentLocale: "en" });
  const trigger = findTrigger(slot);
  assert.ok(trigger, ".language-switcher__trigger must exist");
  assert.equal(trigger.getAttribute("aria-haspopup"), "listbox", "trigger must declare aria-haspopup='listbox'");
  assert.equal(trigger.getAttribute("aria-expanded"), "false", "trigger must default to aria-expanded='false' (collapsed)");
  assert.equal(trigger.getAttribute("aria-label"), "Language", "trigger aria-label must come from chrome.languageSwitcherLegend");
});

test("language-switcher AC-3.c: each option carries a flag indicator (data-flag)", () => {
  resetSpies();
  const slot = makeSlot();
  mod.init(slot, { strings: STRINGS, currentLocale: "en" });
  for (const code of ["en", "ru", "pl"]) {
    const opt = findOption(slot, code);
    const flag = opt.querySelector(".language-switcher__flag");
    assert.ok(flag, `option ${code} must contain a flag element`);
    assert.equal(Object.prototype.hasOwnProperty.call(flag.attrs, "data-flag"), true, `option ${code} flag must carry the data-flag marker`);
  }
});

// ─── AC-3: not-in-session selection → setItem once + reload ───────────────

test("language-switcher AC-3.d: selecting an option outside a session writes ['locale',code] ONCE and reloads", () => {
  resetSpies();
  const slot = makeSlot();
  mod.init(slot, { strings: STRINGS, currentLocale: "en", isSessionActive: () => false });

  const ru = findOption(slot, "ru");
  ru.dispatchEvent(syntheticClickEvent(ru));

  assert.deepEqual(setItemCalls, [["locale", "ru"]], "exactly one setItem(['locale','ru']) on explicit selection");
  assert.equal(reloadCalls.length, 1, "selection outside session must reload the page once");
});

// ─── AC-4: in-session selection → blocked (no write, no reload, attr + cb) ──

test("language-switcher AC-4.a: selecting DURING a session writes NOTHING, does NOT reload, sets data-locale-switch-blocked, invokes onBlockedAttempt", () => {
  resetSpies();
  const blocked = [];
  const slot = makeSlot();
  mod.init(slot, {
    strings: STRINGS,
    currentLocale: "en",
    isSessionActive: () => true,
    onBlockedAttempt: (code) => blocked.push(code),
  });

  const pl = findOption(slot, "pl");
  pl.dispatchEvent(syntheticClickEvent(pl));

  assert.equal(setItemCalls.length, 0, "in-session switch attempt MUST NOT write localStorage (FR8)");
  assert.equal(reloadCalls.length, 0, "in-session switch attempt MUST NOT reload (FR8 — locale locked mid-session)");
  const container = findContainer(slot);
  assert.equal(container.getAttribute("data-locale-switch-blocked"), "true", "container must carry data-locale-switch-blocked='true' (Story 7.2 hint hook)");
  assert.deepEqual(blocked, ["pl"], "onBlockedAttempt(code) must fire with the attempted locale");
});

test("language-switcher AC-4.b: default isSessionActive without an active session allows the switch (no false block)", () => {
  resetSpies();
  const slot = makeSlot();
  // Omit isSessionActive → default must treat 'no detectable session' as not-active.
  mod.init(slot, { strings: STRINGS, currentLocale: "en" });
  const ru = findOption(slot, "ru");
  ru.dispatchEvent(syntheticClickEvent(ru));
  assert.deepEqual(setItemCalls, [["locale", "ru"]], "with no active session the switch persists");
  assert.equal(reloadCalls.length, 1);
});
