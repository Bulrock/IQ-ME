// tests/unit/result-save-retest.test.mjs
//
// Story 6.7 AC-1/AC-3/AC-4/AC-5/AC-6 — Save button + retest-effect note wired
// into `src/assessment/result.js`'s score panel (the markup + click-handler
// half of the feature; the localStorage write itself lives in save-result.js).
//
// AC-1: .score-panel__save-button exists, focusable, unsaved default
//       (aria-pressed="false"), label from strings.result.saveButton, ZERO
//       writes at render time.
// AC-5/6: .score-panel__retest-note contains an anchor whose href is the
//       versioned+localed methodology URL /methodology/v0.1.0/en/limitations/retest-effects/.
// AC-4: clicking Save → EXACTLY one localStorage.setItem under
//       iqme:saved-result:*, button flips to saved (label → saveButtonSaved,
//       aria-pressed="true"); a SECOND click adds no further setItem.
// AC-3: first render with empty localStorage leaves the button unsaved and
//       performs zero setItem/removeItem (NFR9).
//
// node:test + node:assert/strict; no third-party deps (NFR33). Self-contained:
// the result.test.mjs scaffolding (crypto/CustomEvent/document/window/fetch
// stubs, dynamic import, seed16Responses, renderAndSettle, transitionToHandoff,
// synthetic events) is duplicated here, plus a localStorage spy so the save
// click path can write without throwing and writes can be asserted.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ─── globalThis stubs (must precede dynamic import) ──────────────────────

const cryptoFillByte = 0x42;
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  writable: true,
  value: {
    getRandomValues: (arr) => { arr.fill(cryptoFillByte); return arr; },
  },
});

class CustomEventStub {
  constructor(type, opts) {
    this.type = type;
    this.detail = opts?.detail;
    this.bubbles = opts?.bubbles ?? false;
    this.composed = opts?.composed ?? false;
    this.defaultPrevented = false;
  }
  preventDefault() { this.defaultPrevented = true; }
}
globalThis.CustomEvent = CustomEventStub;

const documentListeners = Object.create(null);
globalThis.document = {
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

function freshWindowLocation() {
  return {
    hash: "",
    assign(_url) { /* default no-op; tests override per-call */ },
  };
}

// ─── localStorage spy (mirror save-result.test.mjs / theme.test.mjs) ─────
// The save click writes localStorage, so install a spy so the handler does not
// throw and writes can be asserted.

const setItemCalls = [];
const removeItemCalls = [];
let store = new Map();

const localStorageStub = {
  setItem(k, v) { setItemCalls.push([k, v]); store.set(String(k), String(v)); },
  removeItem(k) { removeItemCalls.push(k); store.delete(String(k)); },
  getItem(k) { return store.has(String(k)) ? store.get(String(k)) : null; },
  clear() { store.clear(); },
};

globalThis.window = {
  location: freshWindowLocation(),
  localStorage: localStorageStub,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};
globalThis.localStorage = localStorageStub;

function resetLocalStorageSpy() {
  setItemCalls.length = 0;
  removeItemCalls.length = 0;
  store = new Map();
}

// fetch stub returning a synthetic 16-item pool (mirrors result.test.mjs).
function makeSyntheticPool() {
  const items = [];
  for (let i = 0; i < 16; i++) {
    items.push({
      id: `stub-${String(i + 1).padStart(3, "0")}`,
      a: 1.0,
      b: -2.0 + i * 0.25,
      asset: `stub-${String(i + 1).padStart(3, "0")}.svg`,
      options: ["A", "B", "C", "D", "E", "F"],
      correct: "A",
    });
  }
  return { schemaVersion: "1.0", poolSize: 16, items };
}
globalThis.fetch = async (_url) => ({
  ok: true,
  json: async () => makeSyntheticPool(),
});

// ─── Dynamic import: SUT + live state.js ─────────────────────────────────

let resultModule;
let importError = null;
try {
  resultModule = await import("../../src/assessment/result.js");
} catch (err) { importError = err; }

let stateModule;
let stateImportError = null;
try {
  stateModule = await import("../../src/assessment/state.js");
} catch (err) { stateImportError = err; }

// ─── STRINGS sentinel — includes the new 6.7 keys + all keys render() needs ─

const STRINGS = {
  result: {
    scoreHeading: "__R_SCORE_HEADING__",
    prerevealHeading: "__R_PREREVEAL_HEADING__",
    prerevealSubcopy: "__R_PREREVEAL_SUBCOPY__",
    showMeButton: "__R_SHOW_ME__",
    notYetButton: "__R_NOT_YET__",
    caveat: "__R_CAVEAT__",
    percentileAriaTemplate: "Your percentile, {N}.",
    anchorAriaTemplate: "Your IQ-scale equivalent, {N}.",
    bandAriaTemplate: "Uncertainty band, 95 percent confidence.",
    bandTemplate: "±{N}",
    fetchErrorMessage: "__R_FETCH_ERR__",
    // ─── Story 6.7 new keys ───
    saveButton: "__R_SAVE__",
    saveButtonSaved: "__R_SAVED__",
    retestNote: "__R_RETEST_NOTE__",
    retestNoteLinkLabel: "__R_RETEST_LINK__",
  },
  chrome: { errorFallbackMessage: "__CH_ERR_FALLBACK__" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function resetState() { if (stateModule) stateModule.resetState(); }

function seed16Responses() {
  resetState();
  for (let i = 0; i < 16; i++) {
    stateModule.recordResponse(i, i % 2);
  }
}

function resetWindowLocation() {
  globalThis.window.location = freshWindowLocation();
}

function resetDocumentListeners() {
  for (const k of Object.keys(documentListeners)) delete documentListeners[k];
}

async function renderAndSettle(root) {
  seed16Responses();
  resetWindowLocation();
  resetDocumentListeners();
  await resultModule.render(root, STRINGS);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
}

function syntheticClickEvent(target) {
  return {
    type: "click",
    target,
    currentTarget: target,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
  };
}

function transitionToHandoff(root) {
  const buttons = root.querySelectorAll("button");
  const showMe = buttons.find((b) => b.textContent === "__R_SHOW_ME__");
  assert.ok(showMe, "Show-me button must exist (textContent === STRINGS.result.showMeButton)");
  showMe.dispatchEvent(syntheticClickEvent(showMe));
  return showMe;
}

// Recursive descendant search for an element carrying a given attribute
// (mirrors result.test.mjs's findAttr). Returns the first match or null.
function findAttr(node, attr, value) {
  if (!node) return null;
  if (node.attrs && Object.prototype.hasOwnProperty.call(node.attrs, attr)) {
    if (value === undefined || node.attrs[attr] === value) return node;
  }
  for (const c of node.children ?? []) {
    const hit = findAttr(c, attr, value);
    if (hit) return hit;
  }
  return null;
}

// The save button's accessible label / text may be rendered as textContent OR
// as an aria-label attribute — accept either encoding for the label assertion.
function buttonLabel(btn) {
  const text = (btn.textContent || "").trim();
  const aria = btn.attrs?.["aria-label"] ?? "";
  return { text, aria, has: (s) => text.includes(s) || aria.includes(s) };
}

// ─── AC-1: save button presence + unsaved default + zero render writes ────

test("AC-1: post-handoff .score-panel contains a focusable .score-panel__save-button in unsaved state (aria-pressed='false', label from saveButton), with ZERO setItem at render", async () => {
  assert.equal(importError, null, `result.js failed to import: ${importError?.message}`);
  assert.equal(stateImportError, null, `state.js failed to import: ${stateImportError?.message}`);

  resetLocalStorageSpy();
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);

  const panel = root.querySelector(".score-panel");
  assert.ok(panel, ".score-panel must exist post-Show-me");

  const saveBtn = root.querySelector(".score-panel__save-button");
  assert.ok(saveBtn, ".score-panel__save-button must exist inside the score panel (AC-1)");

  // Keyboard-focusable: a <button> is focusable by default; otherwise tabindex.
  const focusable = (saveBtn.tag || "").toLowerCase() === "button"
    || saveBtn.attrs?.tabindex === "0";
  assert.ok(focusable, "save button must be keyboard-focusable (button element or tabindex='0')");

  // Unsaved default state.
  assert.equal(saveBtn.attrs["aria-pressed"], "false", "save button must default to aria-pressed='false' (unsaved)");

  // Accessible label derives from STRINGS.result.saveButton.
  assert.ok(buttonLabel(saveBtn).has("__R_SAVE__"), `save button label/text must derive from strings.result.saveButton ('__R_SAVE__'); text='${saveBtn.textContent}' aria-label='${saveBtn.attrs?.["aria-label"]}'`);

  // No write at render time (NFR9).
  assert.equal(setItemCalls.length, 0, "rendering the save button MUST NOT call localStorage.setItem (NFR9 — opt-in only)");
  assert.equal(removeItemCalls.length, 0, "rendering the save button MUST NOT call localStorage.removeItem");
});

// ─── AC-5/AC-6: retest-note + versioned methodology anchor ────────────────

test("AC-5/AC-6: .score-panel__retest-note exists and contains an anchor whose href === /methodology/v0.1.0/en/limitations/retest-effects/", async () => {
  assert.equal(importError, null);

  resetLocalStorageSpy();
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);

  const note = root.querySelector(".score-panel__retest-note");
  assert.ok(note, ".score-panel__retest-note must exist inside the score panel (AC-5)");

  // Walk the note's descendants for an element carrying an href attribute.
  const anchor = findAttr(note, "href");
  assert.ok(anchor, "retest-note must contain an element with an href attribute (the methodology link) (AC-6)");
  assert.equal(
    anchor.attrs.href,
    "/methodology/v0.1.0/en/limitations/retest-effects/",
    `retest-note link href must be the versioned+localed methodology URL; got '${anchor.attrs.href}'`,
  );
});

// ─── AC-4: save click writes exactly one entry + flips button to saved ────

test("AC-4: clicking the save button writes EXACTLY one iqme:saved-result:* setItem and flips the button to saved (label → saveButtonSaved, aria-pressed='true')", async () => {
  assert.equal(importError, null);

  resetLocalStorageSpy();
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);

  const saveBtn = root.querySelector(".score-panel__save-button");
  assert.ok(saveBtn, ".score-panel__save-button must exist before clicking");
  assert.equal(setItemCalls.length, 0, "precondition: no writes before the click");

  saveBtn.dispatchEvent(syntheticClickEvent(saveBtn));

  assert.equal(setItemCalls.length, 1, `save click must produce EXACTLY one localStorage.setItem; got ${setItemCalls.length}`);
  assert.ok(
    setItemCalls[0][0].startsWith("iqme:saved-result:"),
    `setItem key must start with 'iqme:saved-result:'; got '${setItemCalls[0][0]}'`,
  );

  // Button flips to saved state — re-resolve in case the handler re-rendered.
  const savedBtn = root.querySelector(".score-panel__save-button") || saveBtn;
  assert.equal(savedBtn.attrs["aria-pressed"], "true", "after save, button must reflect aria-pressed='true'");
  assert.ok(
    buttonLabel(savedBtn).has("__R_SAVED__"),
    `after save, button label/text must switch to strings.result.saveButtonSaved ('__R_SAVED__'); text='${savedBtn.textContent}' aria-label='${savedBtn.attrs?.["aria-label"]}'`,
  );
});

// ─── AC-4 idempotent: second click adds no further setItem ────────────────

test("AC-4 idempotent: a SECOND click on the now-saved button does NOT add another setItem (still exactly one total)", async () => {
  assert.equal(importError, null);

  resetLocalStorageSpy();
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);

  const saveBtn = root.querySelector(".score-panel__save-button");
  assert.ok(saveBtn, ".score-panel__save-button must exist");

  saveBtn.dispatchEvent(syntheticClickEvent(saveBtn));
  assert.equal(setItemCalls.length, 1, "first click must produce exactly one setItem");

  // A second click on the (possibly re-rendered) save button must not re-write.
  const savedBtn = root.querySelector(".score-panel__save-button") || saveBtn;
  savedBtn.dispatchEvent(syntheticClickEvent(savedBtn));
  assert.equal(setItemCalls.length, 1, `second click MUST NOT add another setItem (idempotent); total now ${setItemCalls.length}`);
});

// ─── AC-3: first render with empty localStorage → unsaved, zero writes ────

test("AC-3 first-render: with empty localStorage, render→handoff leaves the save button unsaved and performs ZERO setItem/removeItem (NFR9)", async () => {
  assert.equal(importError, null);

  resetLocalStorageSpy(); // empty store, empty counters
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);

  const saveBtn = root.querySelector(".score-panel__save-button");
  assert.ok(saveBtn, ".score-panel__save-button must exist on first render");
  assert.equal(saveBtn.attrs["aria-pressed"], "false", "first render with empty storage must leave button unsaved (aria-pressed='false')");
  assert.ok(buttonLabel(saveBtn).has("__R_SAVE__"), "first render must show the unsaved label (saveButton), not the saved label");

  assert.equal(setItemCalls.length, 0, "first render MUST NOT call localStorage.setItem (NFR9)");
  assert.equal(removeItemCalls.length, 0, "first render MUST NOT call localStorage.removeItem (NFR9)");
});
