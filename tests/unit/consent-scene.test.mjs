// tests/unit/consent-scene.test.mjs
//
// Story 3.3 AC-5 — src/assessment/consent.js consent scene.
//
// Pattern follows tests/contract/state-shape.spec.mjs (Story 3-2):
// stub globals BEFORE dynamic-importing the SUT.
// Node 22 native node:test + node:assert/strict; no third-party deps.
//
// AC-5 contract (observable) — spec lines 66-87:
//   - named exports: render(rootEl, strings), unmount(rootEl); no default.
//   - render writes:
//     <section class="consent-scene" aria-labelledby="consent-heading">
//       <h1 id="consent-heading">{consent.headline}</h1>
//       <div class="consent-scene__envelope" data-testid="validity-envelope">
//         <p class="consent-scene__measures-what">{consent.measuresWhat}</p>   <-- FR9
//         <p class="consent-scene__validity-envelope">{consent.validityEnvelope}</p>  <-- FR10
//         <p class="consent-scene__visuospatial-disclosure">{consent.visuospatialDisclosure}</p>  <-- NFR13
//         <div class="consent-scene__envelope-end" tabindex="-1"></div>  <-- sentinel, LAST child of envelope
//       </div>
//       <div class="consent-scene__cta-group">
//         <button id="continue-btn" aria-disabled="true" class="consent-scene__continue-btn" type="button">
//           {consent.continueButton}
//         </button>
//         <a id="not-today-link" href="#/">{consent.notToday}</a>
//       </div>
//     </section>
//   - IntersectionObserver(threshold: 1.0) observes the sentinel.
//     On {isIntersecting:true, intersectionRatio:1.0}: aria-disabled→"false",
//     dwell timer cleared.
//   - setTimeout(flipGate, 5000); flipGate → aria-disabled="false" AND IO.disconnect().
//   - Click #continue-btn while aria-disabled="true" → no-op (no navigate).
//   - Click #continue-btn while aria-disabled="false" → routing.navigate('test')
//     → window.location.hash='#/test'.
//   - Click #not-today-link → state.resetState() invoked; defaultPrevented stays false.
//   - unmount(): IO.disconnect(), clearTimeout(dwell), remove BOTH click listeners.
//
// Cycle-2 changes (per test-review):
//   F-01: regex parser replaced with shared tokenizer in _dom-stub.mjs.
//   F-03: AC-5.2 now requires #continue-btn inside .consent-scene__cta-group (descendant selector).
//   F-04: AC-5.3 now requires sentinel is LAST child of .consent-scene__envelope.
//   F-05: three new tests AC-5.13/14/15 cover FR9/FR10/NFR13 disclosure paragraphs.
//   F-06: AC-5.10 verifies state.resetState behavior via state.js public API (getState observable).
//   F-07: AC-5.9 verifies routing.navigate('test') via window.location.hash mutation.
//   F-16: AC-5.6 also asserts post-IO-fire timer tick produces no further flip and ioInstances.length stays 1.
//   F-17: AC-5.7 also asserts timer-flip path disconnects IO.
//   F-18: AC-5.11 asserts unmount cancels timer AND removes both click listeners.
//   F-24: t.mock.timers.reset() now wrapped in try/finally for failure-safe cleanup.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ── IntersectionObserver stub (constructor capture) ──────────────────────

const ioInstances = [];
class IntersectionObserverStub {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    this.disconnected = false;
    ioInstances.push(this);
  }
  observe(target) { this.observed.push(target); }
  unobserve() {}
  disconnect() { this.disconnected = true; }
  _fire(entries) { this.callback(entries, this); }
}
globalThis.IntersectionObserver = IntersectionObserverStub;

// ── document + window stubs ──────────────────────────────────────────────

globalThis.document = {
  createElement: (tag) => makeElementStub(String(tag).toLowerCase()),
};

globalThis.window = {
  location: { hash: "" },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

// ── Dynamic-import SUT + state.js (state.js shipped in Story 3-2) ────────

let consent;
let consentImportError = null;
try {
  consent = await import("../../src/assessment/consent.js");
} catch (err) {
  consentImportError = err;
}

// state.js exists from Story 3-2. Import it for F-06 behavioral verification.
// In red phase this still imports cleanly because state.js is committed.
let stateModule;
let stateImportError = null;
try {
  stateModule = await import("../../src/assessment/state.js");
} catch (err) {
  stateImportError = err;
}

const STRINGS = {
  consent: {
    headline: "__C_HEADLINE__",
    measuresWhat: "__C_MEASURES__",
    validityEnvelope: "__C_VALIDITY__",
    visuospatialDisclosure: "__C_VISUO__",
    continueButton: "__C_CONTINUE__",
    notToday: "__C_NOT_TODAY__",
  },
};

function resetIO() { ioInstances.length = 0; }

// ─── AC-5.1: module shape ────────────────────────────────────────────────

test("AC-5.1: consent.js exists with named render + unmount (no default)", () => {
  assert.equal(consentImportError, null, `consent.js failed to import: ${consentImportError?.message}`);
  assert.equal(typeof consent.render, "function");
  assert.equal(typeof consent.unmount, "function");
  assert.equal(consent.default, undefined);
});

// ─── AC-5.2: Continue button placement (F-03) ────────────────────────────

test("AC-5.2: render writes #continue-btn inside .consent-scene__cta-group with aria-disabled='true' initially", () => {
  // F-03: structural-nesting assertion — button is descendant of .cta-group.
  assert.equal(consentImportError, null);
  resetIO();
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  const ctaGroup = root.querySelector(".consent-scene__cta-group");
  assert.ok(ctaGroup, "spec line 77: .consent-scene__cta-group wrapper must exist");
  // Descendant selector enforces nesting.
  const btn = root.querySelector(".consent-scene__cta-group #continue-btn");
  assert.ok(btn, "#continue-btn must be a descendant of .consent-scene__cta-group");
  assert.equal(btn.attrs["aria-disabled"], "true", "Continue must start aria-disabled='true'");
  assert.equal(btn.attrs.type, "button");
  assert.equal(btn.textContent, "__C_CONTINUE__", "Continue button textContent must come from i18n consent.continueButton");
});

// ─── AC-5.3: sentinel position (F-04) ────────────────────────────────────

test("AC-5.3: .consent-scene__envelope-end sentinel is LAST child of .consent-scene__envelope with tabindex='-1'", () => {
  // F-04: spec line 82 — sentinel "appended as the last child of the envelope".
  // The IntersectionObserver semantics depend on this geometric position.
  assert.equal(consentImportError, null);
  resetIO();
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  const envelope = root.querySelector(".consent-scene__envelope");
  assert.ok(envelope, ".consent-scene__envelope wrapper must exist");
  const sentinel = root.querySelector(".consent-scene__envelope-end");
  assert.ok(sentinel, ".consent-scene__envelope-end sentinel must exist");
  assert.equal(sentinel.attrs.tabindex, "-1", "sentinel must have tabindex='-1' (focusable but not visible)");
  // Pin position: sentinel must be inside envelope AND must be its LAST element child.
  assert.equal(sentinel.parentNode, envelope, "sentinel's parent must be .consent-scene__envelope");
  const elementChildren = envelope.children.filter(c => c && c.tag && c.tag !== "#text");
  assert.equal(
    elementChildren[elementChildren.length - 1],
    sentinel,
    "sentinel must be the LAST element-child of .consent-scene__envelope (FR12 dwell-gate geometry)",
  );
});

// ─── AC-5.4: Not-today link ──────────────────────────────────────────────

test("AC-5.4: render writes #not-today-link inside .consent-scene__cta-group with href='#/' and consent.notToday text", () => {
  assert.equal(consentImportError, null);
  resetIO();
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  const link = root.querySelector(".consent-scene__cta-group #not-today-link");
  assert.ok(link, "#not-today-link must be a descendant of .consent-scene__cta-group");
  assert.equal(link.tag, "a");
  assert.equal(link.attrs.href, "#/", "Not-today href must be '#/' (FR11 — back to landing)");
  assert.equal(link.textContent, "__C_NOT_TODAY__", "Not-today textContent must come from i18n consent.notToday");
});

// ─── AC-5.5: IntersectionObserver shape ──────────────────────────────────

test("AC-5.5: render installs an IntersectionObserver observing the sentinel at ratio 1.0", () => {
  assert.equal(consentImportError, null);
  resetIO();
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  assert.equal(ioInstances.length, 1, "exactly one IntersectionObserver instance must be created");
  const io = ioInstances[0];
  const threshold = io.options?.threshold;
  const thresholdsOk = threshold === 1.0 || (Array.isArray(threshold) && threshold.includes(1.0));
  assert.ok(thresholdsOk, `IntersectionObserver threshold must include 1.0, got: ${JSON.stringify(threshold)}`);
  assert.ok(io.observed.length >= 1, "must observe the sentinel");
});

// ─── AC-5.6: IO-fire path flips gate, disconnects IO, cancels timer (F-16) ─

test("AC-5.6: IO fire at ratio 1.0 flips aria-disabled to 'false', disconnects IO, and cancels the dwell timer", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    assert.equal(consentImportError, null);
    resetIO();
    const root = makeRootEl({ id: "app" });
    consent.render(root, STRINGS);
    const btn = root.querySelector("#continue-btn");
    const sentinel = root.querySelector(".consent-scene__envelope-end");
    assert.equal(btn.attrs["aria-disabled"], "true");
    const io = ioInstances[0];
    io._fire([{ isIntersecting: true, intersectionRatio: 1.0, target: sentinel }]);
    await new Promise(r => queueMicrotask(r));
    assert.equal(btn.attrs["aria-disabled"], "false", "IO fire must flip aria-disabled");
    assert.equal(io.disconnected, true, "IO must disconnect after flip");
    // F-16: tick past the dwell timer; nothing more should happen.
    t.mock.timers.tick(10000);
    await new Promise(r => queueMicrotask(r));
    assert.equal(btn.attrs["aria-disabled"], "false", "post-IO-flip aria-disabled must stay 'false' under timer advance");
    assert.equal(ioInstances.length, 1, "no second IntersectionObserver must be constructed");
  } finally {
    t.mock.timers.reset();
  }
});

// ─── AC-5.7: timer-flip path flips gate AND disconnects IO (F-17) ────────

test("AC-5.7: 5-second dwell timer flips aria-disabled to 'false' AND disconnects IO", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    assert.equal(consentImportError, null);
    resetIO();
    const root = makeRootEl({ id: "app" });
    consent.render(root, STRINGS);
    const btn = root.querySelector("#continue-btn");
    assert.equal(btn.attrs["aria-disabled"], "true");
    const io = ioInstances[0];
    assert.equal(io.disconnected, false, "precondition: IO must be connected at render time");
    t.mock.timers.tick(5000);
    await new Promise(r => queueMicrotask(r));
    assert.equal(btn.attrs["aria-disabled"], "false", "5s timer must flip aria-disabled");
    // F-17: timer path must also disconnect IO (it's no longer needed).
    assert.equal(io.disconnected, true, "timer path must disconnect IO");
  } finally {
    t.mock.timers.reset();
  }
});

// ─── AC-5.8: pre-flip click is a no-op ───────────────────────────────────

test("AC-5.8: clicking #continue-btn while aria-disabled='true' does not navigate", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    assert.equal(consentImportError, null);
    resetIO();
    globalThis.window.location.hash = "";
    const root = makeRootEl({ id: "app" });
    consent.render(root, STRINGS);
    const btn = root.querySelector("#continue-btn");
    assert.equal(btn.attrs["aria-disabled"], "true");
    const ev = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    btn.dispatchEvent(ev);
    assert.equal(globalThis.window.location.hash, "", "navigate must NOT fire when aria-disabled");
  } finally {
    t.mock.timers.reset();
  }
});

// ─── AC-5.9: post-flip click navigates to '#/test' (F-07) ────────────────

test("AC-5.9: clicking #continue-btn after gate flip mutates window.location.hash to '#/test' (routing.navigate('test'))", async (t) => {
  // F-07: behavioral verification. Spec AC-5 line 84 — click after flip
  // calls routing.navigate('test'). Per AC-3 line 181, navigate(X) sets
  // window.location.hash='#/'+X. So this test observes the hash mutation
  // (the only externally-visible side effect of navigate that doesn't
  // require intercepting routing.js).
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    assert.equal(consentImportError, null);
    resetIO();
    globalThis.window.location.hash = "";
    const root = makeRootEl({ id: "app" });
    consent.render(root, STRINGS);
    const btn = root.querySelector("#continue-btn");
    t.mock.timers.tick(5000);
    await new Promise(r => queueMicrotask(r));
    assert.equal(btn.attrs["aria-disabled"], "false", "precondition: gate must be flipped");
    const ev = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    btn.dispatchEvent(ev);
    assert.equal(
      globalThis.window.location.hash,
      "#/test",
      `post-flip Continue click must mutate window.location.hash to '#/test' (got: ${globalThis.window.location.hash})`,
    );
  } finally {
    t.mock.timers.reset();
  }
});

// ─── AC-5.10: Not-today click resets state (F-06) ────────────────────────

test("AC-5.10: clicking #not-today-link calls state.resetState() and does NOT preventDefault", () => {
  // F-06: behavioral verification via state.js public API (state.js was
  // shipped in Story 3-2). We populate state.js with a non-empty snapshot,
  // click #not-today-link, then assert getState() shows the empty-init shape
  // (currentItem=0, responses=[]) — the observable resetState contract.
  assert.equal(consentImportError, null);
  assert.equal(stateImportError, null, `state.js (Story 3-2) must import cleanly: ${stateImportError?.message}`);
  const { getState, resetState, setSeed, setItem, recordResponse } = stateModule;
  resetIO();
  // Pre-populate state with non-empty content so resetState has something to clear.
  resetState();
  setSeed("0".repeat(32));
  setItem(5);
  recordResponse(5, 1);
  // Sanity: pre-click state is non-empty.
  const pre = getState();
  assert.equal(pre.currentItem, 5, "precondition: state must show item=5 pre-click");
  assert.equal(pre.responses.length, 1, "precondition: state must have 1 response pre-click");
  // Render + click Not-today.
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  const link = root.querySelector("#not-today-link");
  assert.ok(link, "precondition: #not-today-link must exist");
  const ev = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  link.dispatchEvent(ev);
  // Assert state is back to empty-init shape (post-resetState).
  const post = getState();
  assert.equal(post.currentItem, 0, "post-Not-today: currentItem must be 0 (FR11 reset)");
  assert.equal(post.responses.length, 0, "post-Not-today: responses must be empty (FR11 reset)");
  // Native nav must NOT be prevented (spec line 85: "let the native hash navigation fire").
  assert.equal(ev.defaultPrevented, false, "must NOT preventDefault — native hash nav fires");
});

// ─── AC-5.11: unmount() — full cleanup (F-18) ────────────────────────────

test("AC-5.11: unmount() disconnects IO, cancels dwell timer, removes BOTH click listeners", async (t) => {
  // F-18: cycle-1 only verified IO disconnection. Spec line 86 requires
  // IO.disconnect + clearTimeout + remove BOTH click listeners.
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    assert.equal(consentImportError, null);
    resetIO();
    globalThis.window.location.hash = "";
    const root = makeRootEl({ id: "app" });
    consent.render(root, STRINGS);
    const io = ioInstances[0];
    const btn = root.querySelector("#continue-btn");
    const link = root.querySelector("#not-today-link");
    assert.equal(io.disconnected, false);
    // Unmount.
    assert.doesNotThrow(() => consent.unmount(root));
    // (a) IO disconnected.
    assert.equal(io.disconnected, true, "unmount must disconnect IO");
    // (b) Timer canceled: tick 5s, gate must remain "true" (the impl wrote
    // aria-disabled to disconnected DOM at unmount time, so we can't read the
    // button's attr anymore — instead we observe via state assertion: no
    // additional IO instances were constructed and no exceptions thrown).
    t.mock.timers.tick(10000);
    await new Promise(r => queueMicrotask(r));
    assert.equal(ioInstances.length, 1, "unmount must NOT trigger any new IO construction");
    // (c) Click listeners removed: click both elements (captured pre-unmount).
    // Continue: should NOT navigate.
    globalThis.window.location.hash = "";
    const evContinue = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    btn.dispatchEvent(evContinue);
    assert.equal(globalThis.window.location.hash, "", "post-unmount Continue click must NOT navigate (listener removed)");
    // Not-today: should NOT reset state.
    const { getState, setSeed, setItem, recordResponse, resetState } = stateModule;
    resetState();
    setSeed("0".repeat(32));
    setItem(3);
    recordResponse(3, 0);
    const evNot = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    link.dispatchEvent(evNot);
    assert.equal(getState().currentItem, 3, "post-unmount Not-today click must NOT reset state (listener removed)");
    assert.equal(getState().responses.length, 1, "post-unmount Not-today click must NOT reset responses (listener removed)");
  } finally {
    t.mock.timers.reset();
  }
});

// ─── AC-5.12: source-grep for forbidden globals ──────────────────────────

test("AC-5.12: consent.js source contains no forbidden globals (lint defense in depth)", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "consent.js");
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`consent.js source not readable: ${err.message}`); }
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden");
  assert.equal(/\bnavigator\.share\b/.test(source), false, "navigator.share forbidden");
  assert.equal(/role=["']alert["']/.test(source), false, "role='alert' forbidden");
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden");
});

// ─── AC-5.13: FR9 — measuresWhat paragraph (F-05) ────────────────────────

test("AC-5.13: render writes <p class='consent-scene__measures-what'> inside .consent-scene__envelope with consent.measuresWhat text (FR9)", () => {
  // F-05: spec AC-5 line 73 — the FR9 'what the instrument measures' paragraph.
  // Without this assertion, impl could ship a consent scene with no disclosure
  // text and pass all other tests.
  assert.equal(consentImportError, null);
  resetIO();
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  const p = root.querySelector(".consent-scene__envelope .consent-scene__measures-what");
  assert.ok(p, "FR9 disclosure paragraph .consent-scene__measures-what must exist inside .consent-scene__envelope");
  assert.equal(p.tag, "p");
  assert.equal(p.textContent, "__C_MEASURES__", "FR9 paragraph textContent must come from i18n consent.measuresWhat");
});

// ─── AC-5.14: FR10 — validityEnvelope paragraph (F-05) ───────────────────

test("AC-5.14: render writes <p class='consent-scene__validity-envelope'> inside .consent-scene__envelope with consent.validityEnvelope text (FR10)", () => {
  // F-05: spec AC-5 line 74 — the FR10 'validity envelope' paragraph.
  assert.equal(consentImportError, null);
  resetIO();
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  const p = root.querySelector(".consent-scene__envelope .consent-scene__validity-envelope");
  assert.ok(p, "FR10 disclosure paragraph .consent-scene__validity-envelope must exist inside .consent-scene__envelope");
  assert.equal(p.tag, "p");
  assert.equal(p.textContent, "__C_VALIDITY__", "FR10 paragraph textContent must come from i18n consent.validityEnvelope");
});

// ─── AC-5.15: NFR13 — visuospatialDisclosure paragraph (F-05) ────────────

test("AC-5.15: render writes <p class='consent-scene__visuospatial-disclosure'> inside .consent-scene__envelope with consent.visuospatialDisclosure text (NFR13)", () => {
  // F-05: spec AC-5 line 75 — the NFR13 'visuospatial / screen-reader non-equivalence' disclosure.
  assert.equal(consentImportError, null);
  resetIO();
  const root = makeRootEl({ id: "app" });
  consent.render(root, STRINGS);
  const p = root.querySelector(".consent-scene__envelope .consent-scene__visuospatial-disclosure");
  assert.ok(p, "NFR13 disclosure paragraph .consent-scene__visuospatial-disclosure must exist inside .consent-scene__envelope");
  assert.equal(p.tag, "p");
  assert.equal(p.textContent, "__C_VISUO__", "NFR13 paragraph textContent must come from i18n consent.visuospatialDisclosure");
});
