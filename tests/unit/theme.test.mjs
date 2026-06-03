// tests/unit/theme.test.mjs
//
// Story 6.4 AC-10.a..AC-10.h — `src/assessment/theme.js` tri-state theme
// toggle (System / Light / Dark) with NFR9 opt-in-storage discipline:
//
//   - init() reads localStorage.theme once; if present, sets
//     <html>[data-theme] accordingly; NEVER writes to localStorage on init.
//   - Radio click handlers are the ONLY localStorage writers:
//       system → removeItem("theme") + remove data-theme attribute
//       light  → setItem("theme", "light") + data-theme="light"
//       dark   → setItem("theme", "dark")  + data-theme="dark"
//   - Initial radio "checked" state mirrors current persisted state.
//   - detach() removes listeners; post-detach synthetic clicks do NOT
//     mutate localStorage or the data-theme attribute (listener cleanup).
//
// UX-DR6 + UX-DR10 (separately-designed dark palette + tri-state toggle)
// + NFR9 (opt-in-only localStorage).
//
// Node 22 native `node:test` + `node:assert/strict`. No third-party deps.
// Mirrors the jsdom-stub + observable-end-state pattern from
// `tests/unit/item-runner-bail.test.mjs` (Story 6.3).
//
// Theme.js is intentionally a thin module: ~50-80 LOC. The contract
// described here is observable behavior, not implementation detail —
// engineer is free to render the toggle markup any reasonable way that
// satisfies AC-3 + AC-10. The tests use a minimal slot element with
// querySelector access for the three radios via `input[value="..."]`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ─── document + localStorage stubs ───────────────────────────────────────

const documentElementAttrs = Object.create(null);
const documentElementStub = {
  setAttribute(k, v) { documentElementAttrs[k] = String(v); },
  removeAttribute(k) { delete documentElementAttrs[k]; },
  getAttribute(k) {
    return Object.prototype.hasOwnProperty.call(documentElementAttrs, k) ? documentElementAttrs[k] : null;
  },
  hasAttribute(k) { return Object.prototype.hasOwnProperty.call(documentElementAttrs, k); },
};

function resetDocumentElement() {
  for (const k of Object.keys(documentElementAttrs)) delete documentElementAttrs[k];
}

const documentListeners = Object.create(null);
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

// localStorage spy — three counters track writes, clears, reads.
const setItemCalls = [];
const removeItemCalls = [];
let storedTheme = null;

const localStorageStub = {
  setItem(k, v) { setItemCalls.push([k, v]); if (k === "theme") storedTheme = String(v); },
  removeItem(k) { removeItemCalls.push(k); if (k === "theme") storedTheme = null; },
  getItem(k) { return k === "theme" ? storedTheme : null; },
  clear() { storedTheme = null; },
};

globalThis.window = {
  localStorage: localStorageStub,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.localStorage = localStorageStub;

function resetLocalStorageSpy() {
  setItemCalls.length = 0;
  removeItemCalls.length = 0;
  storedTheme = null;
}

// ─── Dynamic-import SUT — fails RED until theme.js is implemented ────────

let themeModule;
let importError = null;
try {
  themeModule = await import("../../src/assessment/theme.js");
} catch (err) { importError = err; }

// Strings expected by theme.js init() — engineer may pull these from
// localeLoader directly; the test mirrors the chrome.* keys per AC-7.
const STRINGS = {
  chrome: {
    themeToggleLegend: "Color theme",
    themeSystemLabel: "System",
    themeLightLabel: "Light",
    themeDarkLabel: "Dark",
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────

function makeSlot() {
  // The theme-toggle slot the chrome-footer provides — theme.init()
  // renders the <fieldset> + radios into this slot.
  return makeRootEl({ class: "chrome-footer__theme-toggle" });
}

function syntheticChangeEvent(target) {
  return { type: "change", target, currentTarget: target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}

function findRadio(root, value) {
  // Engineer may render radios via inputs with name="theme" and value=<v>.
  // Accept either name-attr lookup or class lookup; here we use value.
  const all = root.querySelectorAll("input");
  for (const r of all) {
    if (r.attrs && r.attrs.type === "radio" && r.attrs.value === value) return r;
  }
  return null;
}

function setUp() {
  resetDocumentElement();
  resetLocalStorageSpy();
}

// ────────────────────────────────────────────────────────────────────────
// AC-10.a — init() with empty localStorage + no data-theme → silent
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.a: init() with empty localStorage performs ZERO setItem/removeItem calls, sets NO data-theme attribute", () => {
  assert.equal(importError, null, `theme.js failed to import (RED expected until impl): ${importError?.message}`);

  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  assert.equal(setItemCalls.length, 0, "init() MUST NOT call localStorage.setItem when no theme key exists (NFR9 — no writes on page load)");
  assert.equal(removeItemCalls.length, 0, "init() MUST NOT call localStorage.removeItem when no theme key exists (idempotent System default)");
  assert.equal(documentElementStub.hasAttribute("data-theme"), false, "init() MUST NOT set data-theme attribute when no theme key exists (System default = absence)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.b — init() with localStorage.theme=dark → data-theme=dark, no writes
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.b: init() with localStorage.theme='dark' sets data-theme='dark' on documentElement; ZERO setItem calls", () => {
  assert.equal(importError, null, "precondition: theme.js importable");

  setUp();
  storedTheme = "dark";
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  assert.equal(documentElementStub.getAttribute("data-theme"), "dark", "init() must apply persisted dark theme to <html>");
  assert.equal(setItemCalls.length, 0, "init() MUST NOT write to localStorage even when reading an existing key (NFR9)");
  assert.equal(removeItemCalls.length, 0, "init() MUST NOT clear localStorage during bootstrap");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.c — init() with localStorage.theme=light → data-theme=light, no writes
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.c: init() with localStorage.theme='light' sets data-theme='light' on documentElement; ZERO setItem calls", () => {
  setUp();
  storedTheme = "light";
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  assert.equal(documentElementStub.getAttribute("data-theme"), "light", "init() must apply persisted light theme to <html>");
  assert.equal(setItemCalls.length, 0, "init() MUST NOT write to localStorage during bootstrap (NFR9)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.d — Radio click on system → removeItem + remove data-theme
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.d: selecting System radio calls localStorage.removeItem('theme') and removes data-theme attribute", () => {
  setUp();
  storedTheme = "dark";
  documentElementStub.setAttribute("data-theme", "dark");
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  const sysRadio = findRadio(slot, "system");
  assert.ok(sysRadio, ".theme-toggle radio[value='system'] must exist (AC-3)");

  // Simulate explicit user selection — change event mirrors native radio semantics.
  sysRadio.attrs.checked = "checked";
  sysRadio.dispatchEvent(syntheticChangeEvent(sysRadio));

  assert.equal(removeItemCalls.includes("theme"), true, "system click must call localStorage.removeItem('theme') (AC-3)");
  assert.equal(documentElementStub.hasAttribute("data-theme"), false, "system click must remove data-theme attribute from <html> (AC-3)");
  // NFR9 — system click must NOT setItem (it clears, not writes).
  assert.equal(setItemCalls.length, 0, "system click MUST NOT call localStorage.setItem (NFR9 — System is absence-of-key)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.e — Radio click on light → setItem('theme','light') + data-theme='light'
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.e: selecting Light radio calls localStorage.setItem('theme','light') and sets data-theme='light'", () => {
  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  const lightRadio = findRadio(slot, "light");
  assert.ok(lightRadio, ".theme-toggle radio[value='light'] must exist (AC-3)");

  lightRadio.attrs.checked = "checked";
  lightRadio.dispatchEvent(syntheticChangeEvent(lightRadio));

  const lightWrites = setItemCalls.filter(([k, v]) => k === "theme" && v === "light");
  assert.equal(lightWrites.length, 1, "light click must call localStorage.setItem('theme', 'light') exactly once (AC-3)");
  assert.equal(documentElementStub.getAttribute("data-theme"), "light", "light click must set data-theme='light' on <html> (AC-3)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.f — Radio click on dark → setItem('theme','dark') + data-theme='dark'
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.f: selecting Dark radio calls localStorage.setItem('theme','dark') and sets data-theme='dark'", () => {
  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  const darkRadio = findRadio(slot, "dark");
  assert.ok(darkRadio, ".theme-toggle radio[value='dark'] must exist (AC-3)");

  darkRadio.attrs.checked = "checked";
  darkRadio.dispatchEvent(syntheticChangeEvent(darkRadio));

  const darkWrites = setItemCalls.filter(([k, v]) => k === "theme" && v === "dark");
  assert.equal(darkWrites.length, 1, "dark click must call localStorage.setItem('theme', 'dark') exactly once (AC-3)");
  assert.equal(documentElementStub.getAttribute("data-theme"), "dark", "dark click must set data-theme='dark' on <html> (AC-3)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.g — Initial radio selection mirrors current state
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.g: initial radio 'checked' state mirrors persisted state — System when no key, Light/Dark when key present", () => {
  // Case 1 — no key → System checked.
  setUp();
  const slot1 = makeSlot();
  themeModule.init(slot1, STRINGS);
  const sys1 = findRadio(slot1, "system");
  const light1 = findRadio(slot1, "light");
  const dark1 = findRadio(slot1, "dark");
  assert.ok(sys1, "system radio rendered");
  // "checked" attribute presence is the canonical signal; engineer may also
  // set sys1.checked = true on the property. Accept either encoding.
  const sys1Checked = sys1.attrs.checked === "checked" || sys1.checked === true || sys1.attrs.checked === "";
  assert.equal(sys1Checked, true, "system radio must be initially CHECKED when no localStorage.theme key exists (AC-3)");
  const light1Checked = light1?.attrs?.checked === "checked" || light1?.checked === true;
  const dark1Checked = dark1?.attrs?.checked === "checked" || dark1?.checked === true;
  assert.equal(light1Checked, false, "light radio must NOT be initially checked when no key");
  assert.equal(dark1Checked, false, "dark radio must NOT be initially checked when no key");

  // Case 2 — key=light → Light checked.
  setUp();
  storedTheme = "light";
  const slot2 = makeSlot();
  themeModule.init(slot2, STRINGS);
  const light2 = findRadio(slot2, "light");
  const light2Checked = light2.attrs.checked === "checked" || light2.checked === true || light2.attrs.checked === "";
  assert.equal(light2Checked, true, "light radio must be initially CHECKED when localStorage.theme === 'light'");

  // Case 3 — key=dark → Dark checked.
  setUp();
  storedTheme = "dark";
  const slot3 = makeSlot();
  themeModule.init(slot3, STRINGS);
  const dark3 = findRadio(slot3, "dark");
  const dark3Checked = dark3.attrs.checked === "checked" || dark3.checked === true || dark3.attrs.checked === "";
  assert.equal(dark3Checked, true, "dark radio must be initially CHECKED when localStorage.theme === 'dark'");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.h — Post-detach() synthetic clicks do NOT mutate localStorage
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.h: after detach(), synthetic change events on toggle radios do NOT mutate localStorage or data-theme", () => {
  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  assert.equal(typeof themeModule.detach, "function", "theme.js must export detach() for listener cleanup (AC-10.h)");

  // Capture references to the radios BEFORE detach so we can fire events
  // against them after the listeners have been removed.
  const darkRadio = findRadio(slot, "dark");
  const lightRadio = findRadio(slot, "light");
  assert.ok(darkRadio && lightRadio, "precondition: dark + light radios rendered");

  themeModule.detach();

  resetLocalStorageSpy();
  resetDocumentElement();

  // Post-detach synthetic events MUST be no-ops.
  darkRadio.dispatchEvent(syntheticChangeEvent(darkRadio));
  lightRadio.dispatchEvent(syntheticChangeEvent(lightRadio));

  assert.equal(setItemCalls.length, 0, "post-detach radio events MUST NOT call localStorage.setItem (listener cleanup — AC-10.h)");
  assert.equal(removeItemCalls.length, 0, "post-detach radio events MUST NOT call localStorage.removeItem");
  assert.equal(documentElementStub.hasAttribute("data-theme"), false, "post-detach radio events MUST NOT mutate data-theme attribute");
});
