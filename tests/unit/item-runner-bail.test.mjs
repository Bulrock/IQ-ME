// tests/unit/item-runner-bail.test.mjs
//
// Story 6.3 AC-9.a..AC-9.h — `src/assessment/item-runner.js` bail-out
// affordance + in-place explanation panel + Continue/Discard handlers.
//
// FR4 (no silent partial scoring; mid-session bail with explicit
// discard-or-continue choice) + NFR9 (opt-in storage discipline — no
// localStorage write during the bail cycle).
//
// Node 22 native `node:test` + `node:assert/strict`. No third-party deps.
// Mirrors the jsdom-stub pattern from `tests/unit/item-runner.test.mjs`
// (Story 3.4) and the document-listener pattern from
// `tests/unit/result.test.mjs` (Story 3.5 / 6.2) for `iqme:reveal-stage`
// spying.
//
// Engineer choice (`hidden` attribute vs `data-bail-state="open|closed"`
// on the `.item-runner` section) is opaque to these tests: the helper
// `isPanelOpen()` accepts EITHER convention so the contract describes
// observable behavior rather than how the open/closed state is encoded.
// Spec §AC-2 explicitly authorizes both encodings.
//
// Story 3.4 frozen-spec invariant: `tests/unit/item-runner.test.mjs`
// remains UNTOUCHED. Bail tests live in this sibling file deliberately —
// see Carry-forward lessons in the spec (lesson-2026-05-19-001).

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ── globalThis stubs (must precede dynamic import) ───────────────────────

const cryptoFillByte = 0x42;
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  writable: true,
  value: {
    getRandomValues: (arr) => { arr.fill(cryptoFillByte); return arr; },
  },
});

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

// document stub — backs an internal listener registry so tests can observe
// document.dispatchEvent (needed for AC-3 no-reveal-stage spy + AC-2
// Escape keydown handler routing).
const documentListeners = Object.create(null);
const dispatchedEvents = [];
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
    dispatchedEvents.push(ev);
    const arr = documentListeners[ev.type] || [];
    for (const h of arr) { try { h(ev); } catch (_e) { /* swallow */ } }
    return !ev.defaultPrevented;
  },
  // Mutable activeElement; the SUT's `el.focus()` calls assign through
  // the makeElementStub's focus() (added below).
  activeElement: null,
};

// CustomEvent stub (for completeness — bail logic may not need it, but
// reveal-stage from sibling modules might bubble through document).
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

// Storage spy — `Storage.prototype.setItem` (if reached at all) records
// into this array. AC-4 (d) asserts zero invocations across the cycle.
const setItemCalls = [];

// window stub. `window.localStorage.setItem` is intentionally a spy that
// records and otherwise no-ops (we MUST NOT write to disk in unit tests).
globalThis.window = {
  location: { hash: "" },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  localStorage: {
    setItem(k, v) { setItemCalls.push([k, v]); },
    getItem() { return null; },
    removeItem() { /* noop */ },
    clear() { /* noop */ },
  },
};

// Patch makeElementStub-instance focus() so `el.focus()` updates
// document.activeElement (jsdom semantics) — required by AC-2 / AC-9.d.
// We monkey-patch at the helper level by wrapping makeElementStub's
// returned object via a Proxy-like helper. Simpler: post-process when we
// observe focus calls; since the SUT calls `el.focus()` directly, we
// install the focus method on every element produced by the DOM-stub
// parser by walking makeRootEl's children after innerHTML assignment.
function installFocus(el) {
  if (!el || el._focusInstalled) return;
  el.focus = function () { globalThis.document.activeElement = el; };
  el._focusInstalled = true;
  for (const c of el.children ?? []) installFocus(c);
}

// ── Dynamic-import SUT + state.js (live, not stubbed) ────────────────────

let itemRunner;
let importError = null;
try {
  itemRunner = await import("../../src/assessment/item-runner.js");
} catch (err) { importError = err; }

let stateModule;
let stateImportError = null;
try {
  stateModule = await import("../../src/assessment/state.js");
} catch (err) { stateImportError = err; }

let routingModule;
let routingImportError = null;
try {
  routingModule = await import("../../src/assessment/routing.js");
} catch (err) { routingImportError = err; }

let landingModule;
try {
  landingModule = await import("../../src/assessment/landing.js");
} catch (_err) { /* landing optional for AC-5 reach */ }

const STRINGS = {
  itemRunner: {
    headingTemplate: "Item {N} of {total}",
    progressTemplate: "Item {N} of {total}",
    optionsLegend: "__IR_LEGEND__",
    previousButton: "__IR_PREV__",
    nextButton: "__IR_NEXT__",
    submitButton: "__IR_SUBMIT__",
    fetchErrorMessage: "__IR_FETCH_ERR__",
    bailButton: "__IR_BAIL__",
    bailPanelHeading: "__IR_BAIL_HEADING__",
    bailExplanation: "__IR_BAIL_EXPLAIN__",
    bailDiscardButton: "__IR_BAIL_DISCARD__",
    bailContinueButton: "__IR_BAIL_CONTINUE__",
  },
  landing: {
    headline: "__L_HEAD__",
    intro: "__L_INTRO__",
    startTestButton: "__L_START__",
    methodologyLink: "__L_METHOD__",
  },
  chrome: {
    errorFallbackMessage: "__CH_ERR_FALLBACK__",
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────

function resetWindowHash() { globalThis.window.location.hash = ""; }
function resetState() { if (stateModule) stateModule.resetState(); }
function resetSetItemSpy() { setItemCalls.length = 0; }
function resetDispatchedEvents() { dispatchedEvents.length = 0; }
function syntheticClickEvent() {
  return { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}
function syntheticKeydown(key) {
  return { type: "keydown", key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}

async function renderAndSettle(root) {
  resetState();
  resetWindowHash();
  resetSetItemSpy();
  resetDispatchedEvents();
  globalThis.document.activeElement = null;
  await itemRunner.render(root, STRINGS);
  // Drain microtasks from any internal fetch().then() chains.
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  installFocus(root);
}

/**
 * isPanelOpen — accepts BOTH engineer-choice encodings:
 *   - `hidden` attribute on `.item-runner__bail-panel` (removed when open)
 *   - `data-bail-state="open"` on the `.item-runner` section ancestor
 *
 * Returns true iff the panel is OPEN, false otherwise. Spec AC-2 explicitly
 * authorizes either encoding — tests must NOT pin one over the other.
 */
function isPanelOpen(root) {
  const panel = root.querySelector(".item-runner__bail-panel");
  if (!panel) return false;
  // hidden-attribute encoding
  if (panel.hasAttribute && panel.hasAttribute("hidden")) return false;
  // data-bail-state encoding (look at panel itself, ancestor section, or root)
  const section = root.querySelector(".item-runner");
  const sectionState = section?.getAttribute?.("data-bail-state");
  const panelState = panel.getAttribute?.("data-bail-state");
  if (sectionState === "closed" || panelState === "closed") return false;
  if (sectionState === "open" || panelState === "open") return true;
  // No hidden + no data-bail-state → treat as open (impl chose "no
  // initial gate"); we still report based on attribute presence.
  return !panel.hasAttribute?.("hidden");
}

// ────────────────────────────────────────────────────────────────────────
// AC-9.a — bail affordance present in render output with type="button"
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC1: affordance present in render output as type='button' with bailButton label", async () => {
  assert.equal(importError, null, `item-runner.js failed to import: ${importError?.message}`);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  const affordance = root.querySelector(".item-runner__bail-affordance");
  assert.ok(affordance, ".item-runner__bail-affordance must be present in render output (AC-1)");
  assert.equal(affordance.tag, "button", "bail affordance must be a <button> element (AC-1)");
  assert.equal(affordance.attrs.type, "button", "bail affordance must carry type='button' so it cannot submit any enclosing form (AC-1)");
  assert.equal(affordance.textContent, "__IR_BAIL__", "bail affordance label must come from strings.itemRunner.bailButton (AC-1)");

  // AC-1 final clause: clicking does NOT mutate state.responses and does
  // NOT navigate. (Covered concretely by AC-3 below; here we just ensure
  // a click does not throw and does not call routing.navigate.)
  assert.equal(stateImportError, null, `state.js failed to import: ${stateImportError?.message}`);
  const prevHash = globalThis.window.location.hash;
  affordance.dispatchEvent(syntheticClickEvent());
  assert.equal(globalThis.window.location.hash, prevHash, "bail-affordance click must NOT navigate (AC-1)");
  assert.equal(stateModule.getState().responses.length, 0, "bail-affordance click must NOT mutate state.responses (AC-1)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-9.c — panel exists at render time and is initially closed
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC2: panel present in render output, initially closed (hidden OR data-bail-state='closed')", async () => {
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  const panel = root.querySelector(".item-runner__bail-panel");
  assert.ok(panel, ".item-runner__bail-panel must be present in render output (AC-2)");
  assert.equal(isPanelOpen(root), false, "panel must be initially CLOSED — hidden attr set OR data-bail-state='closed' (AC-2)");

  // Panel must contain the two buttons.
  const discard = root.querySelector(".item-runner__bail-discard");
  const cont = root.querySelector(".item-runner__bail-continue");
  assert.ok(discard, ".item-runner__bail-discard must exist inside panel (AC-2)");
  assert.ok(cont, ".item-runner__bail-continue must exist inside panel (AC-2)");
  assert.equal(discard.tag, "button", "discard must be a <button> (AC-2)");
  assert.equal(cont.tag, "button", "continue must be a <button> (AC-2)");
  assert.equal(discard.attrs.type, "button", "discard must carry type='button' (AC-2)");
  assert.equal(cont.attrs.type, "button", "continue must carry type='button' (AC-2)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-9.c + AC-9.d — clicking affordance opens panel + moves focus
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC2: clicking affordance opens panel and focuses .item-runner__bail-continue", async () => {
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  const affordance = root.querySelector(".item-runner__bail-affordance");
  const cont = root.querySelector(".item-runner__bail-continue");
  assert.ok(affordance && cont, "precondition: affordance + Continue button rendered");

  affordance.dispatchEvent(syntheticClickEvent());

  assert.equal(isPanelOpen(root), true, "panel must be OPEN after clicking affordance (AC-2/AC-9.c)");
  assert.equal(globalThis.document.activeElement, cont, "focus must move to .item-runner__bail-continue on panel open (AC-2/AC-9.d)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-9.e — Escape key closes panel and returns focus to affordance
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC2: pressing Escape while panel open closes panel and returns focus to affordance", async () => {
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  const affordance = root.querySelector(".item-runner__bail-affordance");
  affordance.dispatchEvent(syntheticClickEvent());
  assert.equal(isPanelOpen(root), true, "precondition: panel open after affordance click");

  // Escape can be dispatched on document (global keydown) or on the panel
  // — Spec AC-2 says "document while panel open dispatches the same
  // handler as Continue". Try document first; if that doesn't close, try
  // panel; either is acceptable.
  const before = isPanelOpen(root);
  assert.equal(before, true);

  const ev = syntheticKeydown("Escape");
  globalThis.document.dispatchEvent(ev);

  // Allow either document-level OR panel-level handler — assert observable
  // outcome: panel is closed AND focus returned to affordance.
  if (isPanelOpen(root)) {
    // Try panel-targeted Escape dispatch as fallback.
    const panel = root.querySelector(".item-runner__bail-panel");
    panel.dispatchEvent(syntheticKeydown("Escape"));
  }

  assert.equal(isPanelOpen(root), false, "panel must be CLOSED after Escape (AC-2/AC-9.e)");
  assert.equal(globalThis.document.activeElement, affordance, "focus must return to .item-runner__bail-affordance after Escape (AC-2/AC-9.e)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-9.f — Continue closes panel and preserves state (deep-equal snapshot)
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC3: Continue closes panel; state snapshot byte-equal pre→post via deepStrictEqual", async () => {
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  // Record one response so the snapshot is non-trivial.
  const radios = root.querySelectorAll("input");
  assert.ok(radios.length >= 1, "precondition: at least one radio rendered");
  const target = radios[0];
  target.dispatchEvent({ type: "change", target, defaultPrevented: false, preventDefault() {} });

  const snapBefore = stateModule.getState();

  const affordance = root.querySelector(".item-runner__bail-affordance");
  const cont = root.querySelector(".item-runner__bail-continue");
  affordance.dispatchEvent(syntheticClickEvent());
  cont.dispatchEvent(syntheticClickEvent());

  assert.equal(isPanelOpen(root), false, "panel must be CLOSED after Continue (AC-3/AC-9.f)");
  assert.equal(globalThis.document.activeElement, affordance, "focus must return to affordance after Continue (AC-3)");

  const snapAfter = stateModule.getState();
  // getState() returns deep-frozen snapshots — structural equality only.
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(snapAfter)),
    JSON.parse(JSON.stringify(snapBefore)),
    "Continue must NOT mutate state.responses / currentItem / seed / startedAt / locale (AC-3/AC-9.f)",
  );
});

// ────────────────────────────────────────────────────────────────────────
// AC-3 implicit — NO iqme:reveal-stage event dispatched during open→Continue
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC3: open→Continue cycle dispatches ZERO 'iqme:reveal-stage' events on document", async () => {
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  const affordance = root.querySelector(".item-runner__bail-affordance");
  const cont = root.querySelector(".item-runner__bail-continue");

  resetDispatchedEvents();
  affordance.dispatchEvent(syntheticClickEvent());
  cont.dispatchEvent(syntheticClickEvent());

  const revealEvents = dispatchedEvents.filter((e) => e && e.type === "iqme:reveal-stage");
  assert.equal(revealEvents.length, 0, "bail-out cycle MUST NOT fire any iqme:reveal-stage event (AC-3 — FR4 implicit)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-9.g — Discard calls resetState before navigate("") with no localStorage
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC4: Discard resets state then navigates to landing in that order", async () => {
  assert.equal(routingImportError, null, `routing.js failed to import: ${routingImportError?.message}`);

  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  // Pre-pollute state so reset is observable.
  stateModule.recordResponse(0, 1);
  stateModule.setItem(3);
  assert.equal(stateModule.getState().responses.length, 1, "precondition: one response recorded");
  assert.equal(stateModule.getState().currentItem, 3, "precondition: currentItem advanced");

  // ES module exports are read-only bindings — cannot monkey-patch
  // stateModule.resetState / routingModule.navigate. Instead we record
  // observable side-effects: hash mutation order vs state-snapshot order.
  // routing.navigate writes to window.location.hash; state.resetState
  // clears state.responses. We snapshot at each detectable point.
  const trace = [];
  let tick = 0;
  const origHash = "";
  globalThis.window.location.hash = origHash;
  // Tap window.location.hash assignment via a setter on the location proxy.
  let _hash = origHash;
  Object.defineProperty(globalThis.window.location, "hash", {
    configurable: true,
    get() { return _hash; },
    set(v) {
      _hash = String(v);
      trace.push({ event: "navigate", value: _hash, ts: ++tick, responses: stateModule.getState().responses.length, currentItem: stateModule.getState().currentItem });
    },
  });

  // Snapshot state immediately before discard (baseline).
  trace.push({ event: "pre-discard", value: null, ts: ++tick, responses: stateModule.getState().responses.length, currentItem: stateModule.getState().currentItem });

  const affordance = root.querySelector(".item-runner__bail-affordance");
  const discard = root.querySelector(".item-runner__bail-discard");
  affordance.dispatchEvent(syntheticClickEvent());
  discard.dispatchEvent(syntheticClickEvent());

  // Snapshot after discard (final).
  trace.push({ event: "post-discard", value: null, ts: ++tick, responses: stateModule.getState().responses.length, currentItem: stateModule.getState().currentItem });

  // Restore plain hash property to avoid leaking across tests.
  delete globalThis.window.location.hash;
  globalThis.window.location.hash = "";

  // Order assertions: navigate must have fired AFTER state was already
  // reset (responses=0 + currentItem=0 at the moment of the navigate event).
  const navEvent = trace.find((t) => t.event === "navigate");
  assert.ok(navEvent, "Discard must trigger a hash mutation (routing.navigate call) (AC-4)");
  assert.equal(navEvent.value, "#/", "Discard must navigate to landing — hash should be '#/' (routing.navigate('') normalises) (AC-4)");
  assert.equal(navEvent.responses, 0, "state.resetState must run BEFORE routing.navigate — at navigate time, responses must already be empty (AC-4/AC-9.g)");
  assert.equal(navEvent.currentItem, 0, "state.resetState must run BEFORE routing.navigate — at navigate time, currentItem must already be 0 (AC-4/AC-9.g)");
  const post = trace.find((t) => t.event === "post-discard");
  assert.equal(post.responses, 0, "post-Discard responses must be empty (AC-4)");
  assert.equal(post.currentItem, 0, "post-Discard currentItem must be 0 (AC-4)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-4 (d) — no localStorage.setItem call during the bail-out cycle
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC4: Discard never calls localStorage.setItem during the entire bail-out cycle", async () => {
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  resetSetItemSpy();

  // Allow routing.navigate to run — it only mutates window.location.hash
  // in the unit-test stub world; no DOM mount cascades. We're asserting
  // that NO localStorage.setItem call escapes during the cycle.
  const affordance = root.querySelector(".item-runner__bail-affordance");
  const discard = root.querySelector(".item-runner__bail-discard");
  affordance.dispatchEvent(syntheticClickEvent());
  discard.dispatchEvent(syntheticClickEvent());

  assert.equal(setItemCalls.length, 0, `bail-out cycle MUST NOT call window.localStorage.setItem (NFR9/FR4); calls=${JSON.stringify(setItemCalls)}`);
});

// ────────────────────────────────────────────────────────────────────────
// AC-5 — bail affordance absent from landing render output
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC5: landing.js render output contains NO .item-runner__bail-affordance", () => {
  assert.ok(landingModule, "precondition: landing.js imported");
  const root = makeRootEl({ id: "app" });
  landingModule.render(root, STRINGS);
  const affordance = root.querySelector(".item-runner__bail-affordance");
  assert.equal(affordance, null, "landing scene MUST NOT render a bail affordance (AC-5 — item-runner-only)");
});

// ────────────────────────────────────────────────────────────────────────
// AC-9.h — listener cleanup: post-unmount synthetic clicks are no-ops
// ────────────────────────────────────────────────────────────────────────

test("item-runner bail-out AC9.h: after unmount(), synthetic click on bail affordance does NOT mutate state or open panel", async () => {
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  // Pre-pollute state so any post-unmount Discard handler leak would be
  // observable as a reset of these values.
  stateModule.recordResponse(0, 1);
  stateModule.setItem(2);

  const affordance = root.querySelector(".item-runner__bail-affordance");
  const discard = root.querySelector(".item-runner__bail-discard");
  assert.ok(affordance && discard, "precondition: bail buttons rendered");

  const snapBefore = stateModule.getState();

  itemRunner.unmount();

  affordance.dispatchEvent(syntheticClickEvent());
  discard.dispatchEvent(syntheticClickEvent());

  const snapAfter = stateModule.getState();
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(snapAfter)),
    JSON.parse(JSON.stringify(snapBefore)),
    "Post-unmount synthetic clicks on bail buttons MUST NOT mutate state (AC-9.h — listener cleanup)",
  );
});
