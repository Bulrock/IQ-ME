// tests/unit/routing.test.mjs
//
// Story 3.3 AC-3 — src/assessment/routing.js hash-based router.
//
// Pattern follows tests/contract/state-shape.spec.mjs (Story 3-2):
// stub globals at module top BEFORE dynamic-importing the SUT.
// Node 22 native node:test + node:assert/strict; no third-party deps.
//
// AC-3 contract:
//   - named exports: start(), navigate(route), getCurrentRoute().
//   - route table at module scope ({} '#/' '#/consent' minimum); unknown
//     hash falls back to landing without throwing.
//   - start() attaches window.addEventListener('hashchange', ...) and
//     calls onHashChange() once for initial render.
//   - navigate(route) sets window.location.hash = '#/' + slug.
//   - getCurrentRoute() returns window.location.hash.
//   - on every navigation, dispatches CustomEvent('iqme:route-change',
//     {bubbles:true, composed:false, detail:{route:<hash>}}) on document.
//   - start() is idempotent: calling twice does not double-register the
//     hashchange listener AND does not re-dispatch the initial-render event
//     when the route has not changed.
//   - no default export; no module-level mutable singletons exposed.
//
// Note (cycle-1 review F-25): AC-3.5 reads the dispatched route-change events
// after navigate('consent') and verifies *some* event has detail.route='#/consent'.
// Impl may dispatch directly from navigate or via hashchange — both paths are
// spec-compliant; the test does not over-specify dispatch ordering (F-19).

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ── Stubs installed BEFORE SUT import ────────────────────────────────────

const windowListeners = { hashchange: [] };
const documentListeners = {};

class CustomEventStub {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = !!init.bubbles;
    this.composed = !!init.composed;
    this.detail = init.detail;
    this.defaultPrevented = false;
  }
  preventDefault() { this.defaultPrevented = true; }
}
globalThis.CustomEvent = CustomEventStub;

const appEl = makeRootEl({ id: "app" });
const dispatchedEvents = [];

globalThis.document = {
  readyState: "complete",
  addEventListener: (type, handler) => { (documentListeners[type] ||= []).push(handler); },
  removeEventListener: (type, handler) => {
    const arr = documentListeners[type] || [];
    const i = arr.indexOf(handler);
    if (i >= 0) arr.splice(i, 1);
  },
  dispatchEvent: (ev) => {
    dispatchedEvents.push({ type: ev.type, detail: ev.detail, bubbles: ev.bubbles, composed: ev.composed });
    const arr = documentListeners[ev.type] || [];
    for (const h of arr) h(ev);
    return !ev.defaultPrevented;
  },
  getElementById: (id) => (id === "app" ? appEl : null),
  // F-09: provide a real createElement so that when routing.start() → landing.render()
  // runs in green phase, the impl can manufacture child nodes without TypeError.
  createElement: (tag) => makeElementStub(String(tag).toLowerCase()),
};

// F-09: window also has scrollTo / matchMedia stubs in case landing/consent reach for them.
globalThis.window = {
  location: { hash: "" },
  addEventListener: (type, handler) => { (windowListeners[type] ||= []).push(handler); },
  removeEventListener: (type, handler) => {
    const arr = windowListeners[type] || [];
    const i = arr.indexOf(handler);
    if (i >= 0) arr.splice(i, 1);
  },
  dispatchEvent: (ev) => {
    const arr = windowListeners[ev.type] || [];
    for (const h of arr) h(ev);
    return true;
  },
  scrollTo: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
};

// F-09: IntersectionObserver stub for consent-scene transitive imports.
globalThis.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; this.observed = []; this.disconnected = false; }
  observe(t) { this.observed.push(t); }
  unobserve() {}
  disconnect() { this.disconnected = true; }
};

// Helper: reset stub state between tests.
function resetStubState() {
  windowListeners.hashchange.length = 0;
  for (const k of Object.keys(documentListeners)) documentListeners[k].length = 0;
  dispatchedEvents.length = 0;
  globalThis.window.location.hash = "";
  appEl.innerHTML = "";
}

// ── Dynamic-import SUT ───────────────────────────────────────────────────

let routing;
let importError = null;
try {
  routing = await import("../../src/assessment/routing.js");
} catch (err) {
  importError = err;
}

test("AC-3.1: routing.js exists with named exports start/navigate/getCurrentRoute (no default)", () => {
  assert.equal(importError, null, `routing.js failed to import: ${importError?.message}`);
  assert.equal(typeof routing.start, "function", "must export start");
  assert.equal(typeof routing.navigate, "function", "must export navigate");
  assert.equal(typeof routing.getCurrentRoute, "function", "must export getCurrentRoute");
  assert.equal(routing.default, undefined, "must not export a default");
});

test("AC-3.2: start() attaches hashchange listener and renders initial landing", () => {
  assert.equal(importError, null);
  resetStubState();
  globalThis.window.location.hash = "";
  routing.start();
  assert.equal(windowListeners.hashchange.length >= 1, true, "must register hashchange listener");
  const routeChanges = dispatchedEvents.filter(e => e.type === "iqme:route-change");
  assert.equal(routeChanges.length >= 1, true, "must dispatch iqme:route-change on initial render");
});

test("AC-3.3: start() is idempotent — second call does not double-register hashchange AND does not re-dispatch initial-render event", () => {
  // F-10: stronger idempotency check — both listener count AND dispatch count must be stable.
  assert.equal(importError, null);
  resetStubState();
  routing.start();
  const firstListenerCount = windowListeners.hashchange.length;
  const firstDispatchCount = dispatchedEvents.filter(e => e.type === "iqme:route-change").length;
  routing.start();
  const secondListenerCount = windowListeners.hashchange.length;
  const secondDispatchCount = dispatchedEvents.filter(e => e.type === "iqme:route-change").length;
  assert.equal(secondListenerCount, firstListenerCount, "second start() must not add another hashchange listener");
  assert.equal(secondDispatchCount, firstDispatchCount, "second start() must not re-dispatch the initial-render route-change event");
});

test("AC-3.4: navigate('consent') sets window.location.hash to '#/consent'", () => {
  assert.equal(importError, null);
  resetStubState();
  routing.start();
  routing.navigate("consent");
  assert.equal(globalThis.window.location.hash, "#/consent");
});

test("AC-3.5: navigate('consent') dispatches iqme:route-change with detail.route='#/consent', bubbles=true, composed=false", () => {
  // F-19: do not manually fire hashchange. Impl may dispatch directly from
  // navigate or via hashchange — both paths are spec-compliant.
  assert.equal(importError, null);
  resetStubState();
  routing.start();
  const baselineDispatches = dispatchedEvents.filter(e => e.type === "iqme:route-change").length;
  routing.navigate("consent");
  // Allow microtasks to flush (in case impl dispatches async).
  // (Synchronous dispatch is also fine; the loop completes immediately.)
  const allDispatches = dispatchedEvents.filter(e => e.type === "iqme:route-change");
  assert.ok(
    allDispatches.length > baselineDispatches,
    `navigate('consent') must dispatch a new iqme:route-change event (baseline=${baselineDispatches}, total=${allDispatches.length})`,
  );
  const consentDispatch = allDispatches.find(e => e.detail?.route === "#/consent");
  assert.ok(
    consentDispatch,
    `at least one iqme:route-change event must have detail.route='#/consent'; got: ${JSON.stringify(allDispatches.map(e => e.detail))}`,
  );
  assert.equal(consentDispatch.bubbles, true, "event must bubble");
  assert.equal(consentDispatch.composed, false, "event must NOT cross shadow DOM");
});

test("AC-3.6: getCurrentRoute() returns the current window.location.hash", () => {
  assert.equal(importError, null);
  resetStubState();
  globalThis.window.location.hash = "#/consent";
  routing.start();
  assert.equal(routing.getCurrentRoute(), "#/consent");
});

test("AC-3.7: unknown hash falls back to landing without throwing", () => {
  assert.equal(importError, null);
  resetStubState();
  globalThis.window.location.hash = "#/garbage";
  assert.doesNotThrow(() => routing.start());
  assert.equal(dispatchedEvents.some(e => e.type === "iqme:route-change"), true);
});

test("AC-3.8: routing.js source contains no forbidden globals", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "routing.js");
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`routing.js source not readable: ${err.message}`); }
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden");
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden");
  assert.equal(/\bnavigator\.share\b/.test(source), false, "navigator.share forbidden");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden");
});
