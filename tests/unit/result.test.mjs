// tests/unit/result.test.mjs
//
// Story 3.5 AC-9.1..9.15 — `src/assessment/result.js` (the #/result scene).
//
// FR13 pre-reveal beat + FR15/FR18/FR23 score panel + methodology-handoff click
// composer (per docs/adr/methodology-handoff-url-contract.md).
//
// node:test + node:assert/strict; no third-party deps (NFR33).
// Stubs follow Story 3.4 item-runner.test.mjs precedent for fetch + crypto,
// Story 3.3 consent-scene precedent for window.location, _dom-stub for DOM.
//
// === SPEC FINDING (test-review attention) ===
// AC-2 score-panel DOM ordering is described twice with different orderings:
//   - the CSS rule example lists selectors as `anchor, percentile, band`;
//   - AC-9.4 mandates DOM order `percentile, anchor, band` (the spec orderer
//     of intent — placing the percentile first as the headline).
// We pin the AC-9.4 DOM order (percentile, anchor, band) as the test contract.
//
// State precondition: tests pre-populate 16 binary responses via
// state.recordResponse to satisfy scoreSession()'s 16-item assumption.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "..", "..", "src", "assessment", "result.js");

// ─── globalThis stubs (must precede dynamic import) ──────────────────────

// crypto stub (some chains in state.js may consume it; defensive).
const cryptoFillByte = 0x42;
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  writable: true,
  value: {
    getRandomValues: (arr) => { arr.fill(cryptoFillByte); return arr; },
  },
});

// CustomEvent stub.
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

// document stub: createElement → makeElementStub; addEventListener +
// dispatchEvent backed by a listener map (so reveal-stage events on document
// can be observed by tests).
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

// window stub: location with mutable assign + hash. Each test may replace
// `window.location.assign` to capture calls.
function freshWindowLocation() {
  return {
    hash: "",
    assign(_url) { /* default no-op; tests override per-call */ },
  };
}
globalThis.window = {
  location: freshWindowLocation(),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

// fetch stub returning a synthetic 16-item pool (mirrors item-runner.test.mjs).
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

// ─── Dynamic import: SUT + live state.js (no stubbing) ───────────────────

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

// ─── STRINGS sentinel (synthetic — decoupled from real strings.json) ─────

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
  },
  chrome: { errorFallbackMessage: "__CH_ERR_FALLBACK__" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function resetState() { if (stateModule) stateModule.resetState(); }

// Seed 16 binary responses so scoreSession() has a full session to score.
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

function captureRevealStageEvents() {
  const captured = [];
  const handler = (ev) => captured.push(ev);
  globalThis.document.addEventListener("iqme:reveal-stage", handler);
  return { events: captured, handler };
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
function syntheticEnterKeydown(target) {
  return {
    type: "keydown",
    key: "Enter",
    target,
    currentTarget: target,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
  };
}

// After render, click the "Show me" button to transition to handoff stage.
function transitionToHandoff(root) {
  // The Show-me button — selectors used by impl are not pinned at the test
  // level, but conventionally either #show-me-btn or .result-scene__show-me;
  // assert presence via a data-action sentinel OR by scanning the prereveal
  // section for a button whose textContent matches the STRINGS sentinel.
  const buttons = root.querySelectorAll("button");
  const showMe = buttons.find((b) => b.textContent === "__R_SHOW_ME__");
  assert.ok(showMe, "Show-me button must exist (textContent === STRINGS.result.showMeButton)");
  showMe.dispatchEvent(syntheticClickEvent(showMe));
  return showMe;
}

// ─── AC-9.1: pre-reveal beat DOM ─────────────────────────────────────────

test("AC-9.1: render writes pre-reveal beat DOM with data-reveal-stage='anchor' + heading + subcopy + Show-me + Not-yet", async () => {
  assert.equal(importError, null, `result.js failed to import: ${importError?.message}`);
  assert.equal(stateImportError, null, `state.js failed to import: ${stateImportError?.message}`);
  assert.equal(resultModule.default, undefined, "no default export allowed");
  assert.equal(typeof resultModule.render, "function", "render must be exported");
  assert.equal(typeof resultModule.unmount, "function", "unmount must be exported");
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  const scene = root.querySelector(".result-scene");
  assert.ok(scene, ".result-scene must exist");
  assert.equal(scene.attrs["data-reveal-stage"], "anchor", "scene must start at data-reveal-stage='anchor'");
  const text = scene.textContent;
  assert.ok(text.includes("__R_PREREVEAL_HEADING__"), `prereveal heading text must render; got: ${text}`);
  assert.ok(text.includes("__R_PREREVEAL_SUBCOPY__"), `prereveal subcopy text must render; got: ${text}`);
  const buttons = root.querySelectorAll("button");
  const showMe = buttons.find((b) => b.textContent === "__R_SHOW_ME__");
  const notYet = buttons.find((b) => b.textContent === "__R_NOT_YET__");
  assert.ok(showMe, "Show-me button must exist");
  assert.ok(notYet, "Not-yet button must exist");
});

// ─── AC-9.2: anchor reveal-stage event fires on render ───────────────────

test("AC-9.2: render dispatches iqme:reveal-stage with detail.stage='anchor' on document", async () => {
  assert.equal(importError, null);
  // Capture must be installed BEFORE render — but renderAndSettle clears
  // listeners. Reimplement the order locally.
  seed16Responses();
  resetWindowLocation();
  resetDocumentListeners();
  const { events } = captureRevealStageEvents();
  const root = makeRootEl({ id: "app" });
  await resultModule.render(root, STRINGS);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.ok(events.length >= 1, `at least one iqme:reveal-stage event expected; got ${events.length}`);
  assert.equal(events[0].detail.stage, "anchor", "first event must be detail.stage='anchor'");
});

// ─── AC-9.3: Show-me transitions to handoff + replaces DOM + dispatches event ──

test("AC-9.3: clicking Show-me transitions data-reveal-stage='methodology-handoff', renders score panel, dispatches remaining 5 reveal-stage events [graduated 6.1]", async () => {
  assert.equal(importError, null);
  seed16Responses();
  resetWindowLocation();
  resetDocumentListeners();
  const { events } = captureRevealStageEvents();
  const root = makeRootEl({ id: "app" });
  await resultModule.render(root, STRINGS);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  transitionToHandoff(root);
  const scene = root.querySelector(".result-scene");
  assert.ok(scene, ".result-scene must still exist post-transition");
  assert.equal(scene.attrs["data-reveal-stage"], "methodology-handoff", "scene must be at data-reveal-stage='methodology-handoff' (graduated 6.1)");
  const panel = root.querySelector(".score-panel");
  assert.ok(panel, ".score-panel must exist post-Show-me");
  assert.equal(events.length, 6, `exactly six reveal-stage events expected (anchor + band + interval + context + tail-scene + methodology-handoff); got ${events.length}`);
  assert.deepEqual(
    events.map((e) => e.detail.stage),
    ["anchor", "band", "interval", "context", "tail-scene", "methodology-handoff"],
    "full ADR-3-1 6-stage sequence expected",
  );
});

// ─── AC-9.4: score-panel DOM structure + ordering ────────────────────────

test("AC-9.4: score panel contains .score-panel__caveat[role=note] above .score-panel__triplet; triplet children ordered percentile, anchor, band", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
  const panel = root.querySelector(".score-panel");
  assert.ok(panel, ".score-panel must exist");
  const caveat = root.querySelector(".score-panel__caveat");
  assert.ok(caveat, ".score-panel__caveat must exist");
  assert.equal(caveat.attrs.role, "note", "caveat must have role='note' (UX-DR22)");
  const triplet = root.querySelector(".score-panel__triplet");
  assert.ok(triplet, ".score-panel__triplet must exist");
  // Find DOM-order positions of caveat and triplet under .score-panel.
  function depthFirstIndex(root, target) {
    let idx = -1, n = 0;
    function walk(node) {
      for (const c of node.children ?? []) {
        n++;
        if (c === target) { idx = n; return true; }
        if (walk(c)) return true;
      }
      return false;
    }
    walk(root);
    return idx;
  }
  const caveatIdx = depthFirstIndex(panel, caveat);
  const tripletIdx = depthFirstIndex(panel, triplet);
  assert.ok(
    caveatIdx >= 0 && tripletIdx >= 0 && caveatIdx < tripletIdx,
    `caveat (idx=${caveatIdx}) must DOM-precede triplet (idx=${tripletIdx})`,
  );
  // Triplet child ordering: percentile, anchor, band.
  const tripletChildren = (triplet.children ?? []).filter(
    (c) => c && c.tag && c.tag !== "#text",
  );
  assert.equal(tripletChildren.length, 3, `triplet must have exactly 3 element children; got ${tripletChildren.length}`);
  const classes = tripletChildren.map((c) => (c.attrs?.class ?? "").split(/\s+/));
  function hasClass(arr, c) { return arr.includes(c); }
  assert.ok(hasClass(classes[0], "score-panel__percentile"), `first triplet child must be .score-panel__percentile; got class='${classes[0].join(" ")}'`);
  assert.ok(hasClass(classes[1], "score-panel__anchor"), `second triplet child must be .score-panel__anchor; got class='${classes[1].join(" ")}'`);
  assert.ok(hasClass(classes[2], "score-panel__band"), `third triplet child must be .score-panel__band; got class='${classes[2].join(" ")}'`);
});

// ─── AC-9.5: triplet numeral content ranges + band format ────────────────

test("AC-9.5: percentile ∈ [0,100], anchor ∈ [40,200], band matches /^±\\d+$/", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
  const percentile = root.querySelector(".score-panel__percentile");
  const anchor = root.querySelector(".score-panel__anchor");
  const band = root.querySelector(".score-panel__band");
  assert.ok(percentile && anchor && band, "all three triplet elements must exist");
  const p = parseInt(percentile.textContent, 10);
  const a = parseInt(anchor.textContent, 10);
  assert.ok(Number.isInteger(p) && p >= 0 && p <= 100, `percentile must be integer in [0,100]; got '${percentile.textContent}' → ${p}`);
  assert.ok(Number.isInteger(a) && a >= 40 && a <= 200, `anchor must be integer in [40,200]; got '${anchor.textContent}' → ${a}`);
  // The metric value leads the span; a visible (aria-hidden) under-label may
  // follow it, so the format is anchored at the start, not the end.
  assert.ok(/^±\d+/.test(band.textContent), `band must start with ±\\d+; got '${band.textContent}'`);
});

// ─── AC-9.6: data-methodology-target on each triplet span ────────────────

test("AC-9.6: each triplet span has correct data-methodology-target value", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
  const percentile = root.querySelector(".score-panel__percentile");
  const anchor = root.querySelector(".score-panel__anchor");
  const band = root.querySelector(".score-panel__band");
  assert.equal(percentile.attrs["data-methodology-target"], "scoring/percentile-to-iq");
  assert.equal(anchor.attrs["data-methodology-target"], "scoring/overview");
  assert.equal(band.attrs["data-methodology-target"], "scoring/uncertainty");
});

// ─── AC-9.7: click .score-panel__percentile → window.location.assign(URL) ──

test("AC-9.7: clicking .score-panel__percentile navigates to /methodology/v0.1.0/en/scoring/percentile-to-iq/", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
  const percentile = root.querySelector(".score-panel__percentile");
  assert.ok(percentile);
  const calls = [];
  Object.defineProperty(globalThis.window.location, "assign", {
    configurable: true,
    value: (url) => calls.push(url),
  });
  percentile.dispatchEvent(syntheticClickEvent(percentile));
  assert.equal(calls.length, 1, `expected exactly 1 navigate call; got ${calls.length}`);
  assert.equal(
    calls[0],
    "/methodology/v0.1.0/en/scoring/percentile-to-iq/",
    `URL must match exactly; got '${calls[0]}'`,
  );
});

// ─── AC-9.8: click .score-panel__anchor + .score-panel__band ─────────────

test("AC-9.8: click .score-panel__anchor → overview URL; click .score-panel__band → uncertainty URL", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
  const anchor = root.querySelector(".score-panel__anchor");
  const band = root.querySelector(".score-panel__band");
  const calls = [];
  Object.defineProperty(globalThis.window.location, "assign", {
    configurable: true,
    value: (url) => calls.push(url),
  });
  anchor.dispatchEvent(syntheticClickEvent(anchor));
  band.dispatchEvent(syntheticClickEvent(band));
  assert.equal(calls.length, 2);
  assert.equal(calls[0], "/methodology/v0.1.0/en/scoring/overview/");
  assert.equal(calls[1], "/methodology/v0.1.0/en/scoring/uncertainty/");
});

// ─── AC-9.9: Enter keydown triggers navigation ───────────────────────────

test("AC-9.9: Enter keydown on a focused triplet element triggers the same navigation as click", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
  const percentile = root.querySelector(".score-panel__percentile");
  assert.ok(percentile);
  // tabindex='0' must be present (UX-DR32 keyboard activation).
  assert.equal(percentile.attrs.tabindex, "0", "triplet element must be tab-focusable");
  const calls = [];
  Object.defineProperty(globalThis.window.location, "assign", {
    configurable: true,
    value: (url) => calls.push(url),
  });
  percentile.dispatchEvent(syntheticEnterKeydown(percentile));
  assert.equal(calls.length, 1, `expected exactly 1 navigate call from Enter; got ${calls.length}`);
  assert.equal(calls[0], "/methodology/v0.1.0/en/scoring/percentile-to-iq/");
});

// ─── AC-9.10: Not-yet is no-op (no transition, no second event) ──────────

test("AC-9.10: clicking Not-yet leaves data-reveal-stage='anchor' unchanged; no score panel; no 2nd reveal-stage event", async () => {
  assert.equal(importError, null);
  seed16Responses();
  resetWindowLocation();
  resetDocumentListeners();
  const { events } = captureRevealStageEvents();
  const root = makeRootEl({ id: "app" });
  await resultModule.render(root, STRINGS);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  const eventsAfterRender = events.length;
  const buttons = root.querySelectorAll("button");
  const notYet = buttons.find((b) => b.textContent === "__R_NOT_YET__");
  assert.ok(notYet, "Not-yet button must exist");
  notYet.dispatchEvent(syntheticClickEvent(notYet));
  const scene = root.querySelector(".result-scene");
  assert.equal(scene.attrs["data-reveal-stage"], "anchor", "data-reveal-stage must remain 'anchor' after Not-yet click");
  assert.equal(root.querySelector(".score-panel"), null, ".score-panel must NOT exist after Not-yet click");
  assert.equal(events.length, eventsAfterRender, "no additional reveal-stage event after Not-yet click");
});

// ─── AC-9.11: aria-label substitutions on triplet spans ──────────────────

test("AC-9.11: each triplet span has aria-label matching the ARIA template with {N} substituted", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
  const percentile = root.querySelector(".score-panel__percentile");
  const anchor = root.querySelector(".score-panel__anchor");
  const band = root.querySelector(".score-panel__band");
  const pN = parseInt(percentile.textContent, 10);
  const aN = parseInt(anchor.textContent, 10);
  assert.equal(percentile.attrs["aria-label"], `Your percentile, ${pN}.`,
    `percentile aria-label must match template with N=${pN}; got '${percentile.attrs["aria-label"]}'`);
  assert.equal(anchor.attrs["aria-label"], `Your IQ-scale equivalent, ${aN}.`,
    `anchor aria-label must match template with N=${aN}; got '${anchor.attrs["aria-label"]}'`);
  assert.equal(anchor.attrs["aria-label"], `Your IQ-scale equivalent, ${aN}.`);
  assert.equal(band.attrs["aria-label"], "Uncertainty band, 95 percent confidence.",
    `band aria-label must match template; got '${band.attrs["aria-label"]}'`);
});

// ─── AC-9.12: unmount removes listeners — post-unmount click is a no-op ──

test("AC-9.12: unmount removes click + keydown listeners (post-unmount Show-me click does not transition)", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  const buttons = root.querySelectorAll("button");
  const showMe = buttons.find((b) => b.textContent === "__R_SHOW_ME__");
  assert.ok(showMe);
  resultModule.unmount(root);
  // After unmount, dispatching click on the previously-captured button reference
  // must NOT mutate scene state (listeners detached). The scene DOM may have
  // been cleared (rootEl.innerHTML = '' per AC-2); just assert no score panel.
  showMe.dispatchEvent(syntheticClickEvent(showMe));
  assert.equal(root.querySelector(".score-panel"), null, ".score-panel must NOT exist post-unmount click");
});

// ─── AC-9.13: re-render after unmount succeeds ───────────────────────────

test("AC-9.13: render again after unmount succeeds (reveal-stage tracker reset)", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  resultModule.unmount(root);
  // Render again — must not throw "already fired" from leftover stage tracker.
  await assert.doesNotReject(async () => {
    seed16Responses();
    resetWindowLocation();
    resetDocumentListeners();
    await resultModule.render(root, STRINGS);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  });
  const scene = root.querySelector(".result-scene");
  assert.ok(scene, ".result-scene must exist on second render");
  assert.equal(scene.attrs["data-reveal-stage"], "anchor", "second render must start at anchor stage");
});

// ─── AC-9.14: forbidden a11y/timer attrs absent ──────────────────────────

test("AC-9.14: rendered DOM contains no [role='alert'], no [data-timer], no [aria-timer]", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  transitionToHandoff(root);
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
  assert.equal(findAttr(root, "role", "alert"), null, "no element may carry role='alert' (UX-DR22)");
  assert.equal(findAttr(root, "data-timer"), null, "no element may carry [data-timer] (FR5)");
  assert.equal(findAttr(root, "aria-timer"), null, "no element may carry [aria-timer] (FR5)");
});

// ─── AC-9.15: source-grep forbidden globals + no default export ──────────

test("AC-9.15: result.js source contains no forbidden globals + no default export + no performance.now", () => {
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`result.js source not readable: ${err.message}`); }
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden (NFR10)");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden (NFR10)");
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden (NFR10)");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden (NFR10)");
  assert.equal(/\bnavigator\.share\b/.test(source), false, "navigator.share forbidden (NFR9)");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden (NFR10)");
  assert.equal(/\bsetTimeout\b/.test(source), false, "setTimeout forbidden (FR5)");
  assert.equal(/\bsetInterval\b/.test(source), false, "setInterval forbidden (FR5)");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden");
  assert.equal(/\bperformance\.now\b/.test(source), false, "performance.now() forbidden in result.js (use only via reveal-stage.js)");
});
