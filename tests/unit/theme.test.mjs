// tests/unit/theme.test.mjs
//
// Story 6.4 AC-10 — `src/assessment/theme.js` tri-state theme control
// (System / Light / Dark) with NFR9 opt-in-storage discipline.
//
// PR-6 (Story 11-1, AC8): the control was reshaped from a radio <fieldset>
// (footer) into a segmented toggle of <button> segments (chrome-header). The
// observable contract is unchanged:
//   - init() reads localStorage.theme once; if present, sets <html>[data-theme]
//     accordingly; NEVER writes to localStorage on init.
//   - Segment click handlers are the ONLY localStorage writers:
//       system → removeItem("theme") + remove data-theme attribute
//       light  → setItem("theme", "light") + data-theme="light"
//       dark   → setItem("theme", "dark")  + data-theme="dark"
//   - The active segment carries aria-pressed="true"; initial pressed state
//     mirrors the persisted state (System when no key).
//   - detach() removes listeners; post-detach synthetic clicks are no-ops.
//
// Node 22 native `node:test` + `node:assert/strict`. No third-party deps.

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

// localStorage spy — counters track writes, clears, reads.
const setItemCalls = [];
const removeItemCalls = [];
let storedTheme = null;

const localStorageStub = {
  setItem(k, v) { setItemCalls.push([k, v]); if (k === "theme") storedTheme = String(v); },
  removeItem(k) { removeItemCalls.push(k); if (k === "theme") storedTheme = null; },
  getItem(k) { return k === "theme" ? storedTheme : null; },
  clear() { storedTheme = null; },
};

// matchMedia stub — PR-6 follow-OS: no saved choice resolves the active segment
// via prefers-color-scheme. Default to light (matches:false) for determinism.
let mqMatches = false;
globalThis.window = {
  localStorage: localStorageStub,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: (q) => ({ media: q, matches: mqMatches, addEventListener: () => {}, removeEventListener: () => {} }),
};
globalThis.localStorage = localStorageStub;

function resetLocalStorageSpy() {
  setItemCalls.length = 0;
  removeItemCalls.length = 0;
  storedTheme = null;
}

// ─── Dynamic-import SUT ──────────────────────────────────────────────────

let themeModule;
let importError = null;
try {
  themeModule = await import("../../src/assessment/theme.js");
} catch (err) { importError = err; }

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
  // The theme-switcher slot the chrome-header provides — theme.init() renders
  // the segmented toggle into this slot (PR-6 moved it from footer to header).
  return makeRootEl({ class: "chrome-header__theme-switcher" });
}

function syntheticClickEvent(target) {
  return { type: "click", target, currentTarget: target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}

function findSegment(root, value) {
  // Segments are <button class="theme-switcher__segment" data-theme-value=...>.
  const all = root.querySelectorAll(".theme-switcher__segment");
  for (const b of all) {
    if (b.getAttribute && b.getAttribute("data-theme-value") === value) return b;
  }
  return null;
}

function isPressed(seg) {
  return seg && seg.getAttribute && seg.getAttribute("aria-pressed") === "true";
}

function setUp() {
  resetDocumentElement();
  resetLocalStorageSpy();
}

// ────────────────────────────────────────────────────────────────────────
// AC-10.a — init() with empty localStorage + no data-theme → silent
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.a: init() with empty localStorage performs ZERO setItem/removeItem calls, sets NO data-theme attribute", () => {
  assert.equal(importError, null, `theme.js failed to import: ${importError?.message}`);

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
// AC-10.d — System removed: only Light + Dark segments exist
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.d: renders exactly Light + Dark segments — no System segment (PR-6 removal)", () => {
  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  assert.equal(findSegment(slot, "system"), null, "System segment must NOT be rendered (removed)");
  assert.ok(findSegment(slot, "light"), "Light segment must exist");
  assert.ok(findSegment(slot, "dark"), "Dark segment must exist");
  assert.equal(slot.querySelectorAll(".theme-switcher__segment").length, 2, "exactly two segments (Light, Dark)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.e — Light segment click → setItem('theme','light') + data-theme='light'
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.e: activating the Light segment calls localStorage.setItem('theme','light') and sets data-theme='light'", () => {
  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  const lightSeg = findSegment(slot, "light");
  assert.ok(lightSeg, ".theme-switcher__segment[data-theme-value='light'] must exist (AC-8)");

  lightSeg.dispatchEvent(syntheticClickEvent(lightSeg));

  const lightWrites = setItemCalls.filter(([k, v]) => k === "theme" && v === "light");
  assert.equal(lightWrites.length, 1, "Light click must call localStorage.setItem('theme', 'light') exactly once (AC-8)");
  assert.equal(documentElementStub.getAttribute("data-theme"), "light", "Light click must set data-theme='light' on <html> (AC-8)");
  assert.equal(isPressed(lightSeg), true, "Light segment must reflect aria-pressed='true' after activation");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.f — Dark segment click → setItem('theme','dark') + data-theme='dark'
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.f: activating the Dark segment calls localStorage.setItem('theme','dark') and sets data-theme='dark'", () => {
  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  const darkSeg = findSegment(slot, "dark");
  assert.ok(darkSeg, ".theme-switcher__segment[data-theme-value='dark'] must exist (AC-8)");

  darkSeg.dispatchEvent(syntheticClickEvent(darkSeg));

  const darkWrites = setItemCalls.filter(([k, v]) => k === "theme" && v === "dark");
  assert.equal(darkWrites.length, 1, "Dark click must call localStorage.setItem('theme', 'dark') exactly once (AC-8)");
  assert.equal(documentElementStub.getAttribute("data-theme"), "dark", "Dark click must set data-theme='dark' on <html> (AC-8)");
  assert.equal(isPressed(darkSeg), true, "Dark segment must reflect aria-pressed='true' after activation");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.g — Initial pressed state mirrors current state
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.g: initial aria-pressed state — no key follows OS (light via stub); key present presses that segment", () => {
  // Case 1 — no key → follow OS. matchMedia stub matches:false → Light pressed.
  setUp();
  mqMatches = false;
  const slot1 = makeSlot();
  themeModule.init(slot1, STRINGS);
  assert.equal(isPressed(findSegment(slot1, "light")), true, "Light segment pressed when no key and OS prefers light (AC-8 follow-OS)");
  assert.equal(isPressed(findSegment(slot1, "dark")), false, "Dark segment NOT pressed when OS prefers light");
  assert.equal(documentElementStub.hasAttribute("data-theme"), false, "no data-theme when following the OS");

  // Case 1b — no key, OS prefers dark → Dark pressed (still no data-theme).
  setUp();
  mqMatches = true;
  const slot1b = makeSlot();
  themeModule.init(slot1b, STRINGS);
  assert.equal(isPressed(findSegment(slot1b, "dark")), true, "Dark segment pressed when no key and OS prefers dark");
  assert.equal(documentElementStub.hasAttribute("data-theme"), false, "still no data-theme (OS-follow) when no key");
  mqMatches = false;

  // Case 2 — key=light → Light pressed.
  setUp();
  storedTheme = "light";
  const slot2 = makeSlot();
  themeModule.init(slot2, STRINGS);
  assert.equal(isPressed(findSegment(slot2, "light")), true, "Light segment pressed when localStorage.theme === 'light'");

  // Case 3 — key=dark → Dark pressed.
  setUp();
  storedTheme = "dark";
  const slot3 = makeSlot();
  themeModule.init(slot3, STRINGS);
  assert.equal(isPressed(findSegment(slot3, "dark")), true, "Dark segment pressed when localStorage.theme === 'dark'");
});

// ────────────────────────────────────────────────────────────────────────
// AC-10.h — Post-detach() synthetic clicks do NOT mutate localStorage
// ────────────────────────────────────────────────────────────────────────

test("theme.js AC-10.h: after detach(), synthetic click events on segments do NOT mutate localStorage or data-theme", () => {
  setUp();
  const slot = makeSlot();
  themeModule.init(slot, STRINGS);

  assert.equal(typeof themeModule.detach, "function", "theme.js must export detach() for listener cleanup (AC-10.h)");

  const darkSeg = findSegment(slot, "dark");
  const lightSeg = findSegment(slot, "light");
  assert.ok(darkSeg && lightSeg, "precondition: dark + light segments rendered");

  themeModule.detach();

  resetLocalStorageSpy();
  resetDocumentElement();

  darkSeg.dispatchEvent(syntheticClickEvent(darkSeg));
  lightSeg.dispatchEvent(syntheticClickEvent(lightSeg));

  assert.equal(setItemCalls.length, 0, "post-detach segment events MUST NOT call localStorage.setItem (listener cleanup — AC-10.h)");
  assert.equal(removeItemCalls.length, 0, "post-detach segment events MUST NOT call localStorage.removeItem");
  assert.equal(documentElementStub.hasAttribute("data-theme"), false, "post-detach segment events MUST NOT mutate data-theme attribute");
});
