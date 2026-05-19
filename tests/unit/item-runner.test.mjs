// tests/unit/item-runner.test.mjs
//
// Story 3.4 AC-10.4 (a-g) + 10.9 — `src/assessment/item-runner.js`
// FR2 (answer revision) / FR3 (progress visible) / FR5 (no timer) /
// FR7 (16-item seeded session) / UX-DR20 (aria-current=step progress) /
// UX-DR32 (native input type=radio).
//
// Node 22 native node:test + node:assert/strict; no third-party deps.
// Stubs follow Story 3.3 precedent (tests/unit/consent-scene.test.mjs lines 70-83
// for window/document/IO; tests/unit/landing-scene.test.mjs lines 40-51 for the
// window.location.hash → routing-navigate observation pattern).
//
// AC-3 contract (observable; ordered by test below):
//   - named exports render(rootEl, strings), unmount(); no default.
//   - render computes seed via crypto.getRandomValues(new Uint8Array(16)),
//     hex-encodes it (32 lowercase chars), calls state.setSeed(hex).
//   - render fetches /src/items/item-parameters.json and on success caches the
//     selection module-level for FR7 reproducibility.
//   - render writes the FR3 / UX-DR20 / UX-DR32 DOM (section / progress /
//     img / fieldset of radios / Previous / Next).
//   - Radio change → state.recordResponse(currentItem, scoredResponse).
//   - Previous on item 0 has aria-disabled='true' and click is a no-op
//     (currentItem stays at 0).
//   - Next on item 15 changes button textContent to strings.itemRunner.submitButton
//     and click mutates window.location.hash from '#/test' → '#/result'.
//   - No [data-timer] / [aria-timer] in rendered DOM.
//   - unmount() removes all listeners (post-unmount synthetic events do not
//     mutate observable state).
//   - No forbidden globals in source (AC-10.9).
//
// === SPEC FINDING surfaced to test-review (do NOT silently resolve in impl) ===
// Spec AC-3 line 70 says `state.recordResponse(currentItem, selectedOptionIndex)`
// where selectedOptionIndex is the option-index 0-5 (6 options per item).
// BUT live state.js (Story 3-2) + state.schema.json constrain
//   `responses[].response: enum [0, 1]` — binary scored value.
// Calling recordResponse(0, 2) on the live state.js throws RangeError. The only
// self-consistent reading of "no state.js modifications in this story" (AC-4)
// + "responses[i] schema enum [0,1]" (Story 3-2 frozen contract) is that
// item-runner.js MUST score on-the-fly:
//
//     const scored = (selectedOptionValue === pool.items[idx].correct) ? 1 : 0;
//     state.recordResponse(currentItem, scored);
//
// Tests below pin this OBSERVABLE contract: after a radio click,
// state.getState().responses[currentItem].response ∈ {0, 1}. The spec text
// (line 70 + impl-note 7) is therefore ambiguous/inconsistent with frozen
// state-shape; flagging for test-review verdict.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ── globalThis stubs (must precede dynamic import) ───────────────────────

const cryptoFillByte = 0x42;
// Node 22 exposes globalThis.crypto as a read-only getter (Web Crypto).
// Replace the entire property descriptor so the SUT's getRandomValues call
// hits our deterministic stub (mutates the passed TypedArray in place per
// Web Crypto spec).
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  writable: true,
  value: {
    getRandomValues: (arr) => {
      arr.fill(cryptoFillByte);
      return arr;
    },
  },
});

// Default fetch stub: success path returning the synthetic pool. Individual
// tests that need the error path replace globalThis.fetch locally.
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

globalThis.document = {
  createElement: (tag) => makeElementStub(String(tag).toLowerCase()),
};

globalThis.window = {
  location: { hash: "" },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

// ── Dynamic-import SUT + state.js (live, not stubbed) ────────────────────

let itemRunner;
let importError = null;
try {
  itemRunner = await import("../../src/assessment/item-runner.js");
} catch (err) {
  importError = err;
}

let stateModule;
let stateImportError = null;
try {
  stateModule = await import("../../src/assessment/state.js");
} catch (err) {
  stateImportError = err;
}

const STRINGS = {
  itemRunner: {
    headingTemplate: "Item {N} of {total}",
    progressTemplate: "Item {N} of {total}",
    optionsLegend: "__IR_LEGEND__",
    previousButton: "__IR_PREV__",
    nextButton: "__IR_NEXT__",
    submitButton: "__IR_SUBMIT__",
    fetchErrorMessage: "__IR_FETCH_ERR__",
  },
  chrome: {
    errorFallbackMessage: "__CH_ERR_FALLBACK__",
  },
};

function resetWindowHash() { globalThis.window.location.hash = ""; }
function resetState() { if (stateModule) stateModule.resetState(); }
function syntheticClickEvent() {
  return { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}

// Helper: render and wait for any in-flight fetch microtasks to settle.
async function renderAndSettle(root) {
  resetState();
  resetWindowHash();
  await itemRunner.render(root, STRINGS);
  // Drain microtasks for any async paths inside render (fetch().then()).
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// ─── AC-10.4 (shape): section / heading / progress / img / fieldset / nav ─

test("AC-10.4: render writes FR3/UX-DR20/UX-DR32 DOM (section + progress + img + fieldset radios + Previous + Next)", async () => {
  assert.equal(importError, null, `item-runner.js failed to import: ${importError?.message}`);
  assert.equal(itemRunner.default, undefined, "no default export allowed");
  assert.equal(typeof itemRunner.render, "function", "render must be exported");
  assert.equal(typeof itemRunner.unmount, "function", "unmount must be exported");
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  const section = root.querySelector(".item-runner");
  assert.ok(section, "section.item-runner must exist");
  assert.equal(section.tag, "section");
  assert.equal(section.attrs["aria-labelledby"], "item-runner-heading");

  const heading = root.querySelector("#item-runner-heading");
  assert.ok(heading, "h1#item-runner-heading must exist");
  assert.equal(heading.tag, "h1");

  const progress = root.querySelector(".item-runner__progress");
  assert.ok(progress, ".item-runner__progress must exist");

  const img = root.querySelector(".item-runner__image");
  assert.ok(img, "img.item-runner__image must exist");
  assert.equal(img.tag, "img");

  const fieldset = root.querySelector(".item-runner__options");
  assert.ok(fieldset, "fieldset.item-runner__options must exist");
  assert.equal(fieldset.tag, "fieldset");

  const radios = root.querySelectorAll("input");
  assert.equal(radios.length, 6, "exactly 6 native <input type=radio> must be rendered for first item");
  for (const r of radios) {
    assert.equal(r.attrs.type, "radio", "every option input must be type=radio (UX-DR32)");
  }

  const prev = root.querySelector("#prev-btn");
  assert.ok(prev, "#prev-btn must exist");
  assert.equal(prev.tag, "button");
  assert.equal(prev.attrs.type, "button");

  const next = root.querySelector("#next-btn");
  assert.ok(next, "#next-btn must exist");
  assert.equal(next.tag, "button");
  assert.equal(next.attrs.type, "button");
});

// ─── AC-10.4b: progress indicator triple-attribute (UX-DR20) ─────────────

test("AC-10.4b: progress indicator carries role='status', aria-live='polite', aria-current='step' (UX-DR20)", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  const progress = root.querySelector(".item-runner__progress");
  assert.ok(progress, ".item-runner__progress must exist");
  assert.equal(progress.attrs.role, "status", "UX-DR20 requires role='status'");
  assert.equal(progress.attrs["aria-live"], "polite", "UX-DR20 requires aria-live='polite'");
  assert.equal(progress.attrs["aria-current"], "step", "UX-DR20 requires aria-current='step'");
  assert.equal(progress.attrs["data-testid"], "progress-indicator", "progress must carry data-testid for stable selection");
});

// ─── AC-10.4c: radio change → state.recordResponse via state.getState() ──

test("AC-10.4c: radio change records a 0|1 response for currentItem (observable via state.getState())", async () => {
  // SEE FILE-HEADER FINDING: state.schema.json frozen-contract (Story 3-2) constrains
  // responses[].response to enum [0,1]. item-runner MUST score on-the-fly
  // (option === item.correct → 1; else 0) — passing raw option-index would
  // throw RangeError from state.recordResponse. Test pins the OBSERVABLE
  // contract: after click, state has one response entry with response ∈ {0,1}.
  assert.equal(importError, null);
  assert.equal(stateImportError, null, `state.js failed to import: ${stateImportError?.message}`);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);

  const radios = root.querySelectorAll("input");
  assert.equal(radios.length, 6, "precondition: 6 radio inputs rendered");
  // Dispatch a synthetic 'change' event on the first radio.
  const target = radios[0];
  const ev = { type: "change", target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  target.dispatchEvent(ev);

  const snap = stateModule.getState();
  assert.equal(snap.responses.length, 1, "exactly one response must be recorded after first radio change");
  const entry = snap.responses[0];
  assert.equal(entry.itemIndex, 0, "first response itemIndex must be 0 (currentItem on first mount)");
  assert.ok(entry.response === 0 || entry.response === 1, `response must be 0 or 1 (scored); got ${JSON.stringify(entry.response)}`);
});

// ─── AC-10.4d: Previous on item 0 is aria-disabled='true' and no-op ──────

test("AC-10.4d: Previous on item 0 has aria-disabled='true' and click is a no-op", async () => {
  assert.equal(importError, null);
  assert.equal(stateImportError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  const prev = root.querySelector("#prev-btn");
  assert.ok(prev);
  assert.equal(prev.attrs["aria-disabled"], "true", "Previous must start aria-disabled='true' on item 0");
  // Click should not advance currentItem below 0 and not navigate.
  prev.dispatchEvent(syntheticClickEvent());
  const snap = stateModule.getState();
  assert.equal(snap.currentItem, 0, "Previous-on-item-0 click must NOT mutate currentItem");
  assert.equal(globalThis.window.location.hash, "", "Previous-on-item-0 click must NOT navigate");
});

// ─── AC-10.4e: Next on item 15 changes label + navigates to #/result ─────

test("AC-10.4e: Next on item 15 sets label to strings.itemRunner.submitButton and click navigates to '#/result'", async () => {
  assert.equal(importError, null);
  assert.equal(stateImportError, null);
  resetState();
  // Pre-set currentItem to 15 BEFORE first render so render observes the
  // last-item state on its first paint. This avoids stepping the runner
  // through 15 Next clicks (which would require valid scoring + selection
  // determinism — outside this test's scope).
  stateModule.setItem(15);

  const root = makeRootEl({ id: "app" });
  resetWindowHash();
  // Pre-set hash to '#/test' so the AC-10.4e mutation '#/test' → '#/result' is observable.
  globalThis.window.location.hash = "#/test";
  await itemRunner.render(root, STRINGS);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

  const next = root.querySelector("#next-btn");
  assert.ok(next, "#next-btn must exist on item 15");
  assert.equal(next.textContent, "__IR_SUBMIT__", "Next on item 15 must show strings.itemRunner.submitButton");

  next.dispatchEvent(syntheticClickEvent());
  assert.equal(
    globalThis.window.location.hash,
    "#/result",
    `Next-on-item-15 click must navigate to '#/result'; got hash=${globalThis.window.location.hash}`,
  );
});

// ─── AC-10.4f: no [data-timer] / [aria-timer] anywhere in rendered DOM ───

test("AC-10.4f: rendered DOM contains no [data-timer] or [aria-timer] attributes (FR5)", async () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  // The DOM stub's queryAll only matches by tag/class/id; walk descendants
  // manually for arbitrary attribute names.
  function findAttr(node, attr) {
    if (!node) return null;
    if (node.attrs && Object.prototype.hasOwnProperty.call(node.attrs, attr)) return node;
    for (const c of node.children ?? []) {
      const hit = findAttr(c, attr);
      if (hit) return hit;
    }
    return null;
  }
  assert.equal(findAttr(root, "data-timer"), null, "FR5: no element may carry [data-timer]");
  assert.equal(findAttr(root, "aria-timer"), null, "FR5: no element may carry [aria-timer]");
});

// ─── AC-10.4g: unmount() removes listeners (post-unmount events are no-ops) ─

test("AC-10.4g: unmount() removes listeners — post-unmount radio change does not mutate state", async () => {
  assert.equal(importError, null);
  assert.equal(stateImportError, null);
  const root = makeRootEl({ id: "app" });
  await renderAndSettle(root);
  const radios = root.querySelectorAll("input");
  assert.equal(radios.length, 6, "precondition: 6 radio inputs rendered");
  const target = radios[0];

  // Pre-condition sanity: state has no responses yet.
  assert.equal(stateModule.getState().responses.length, 0, "precondition: responses empty before any change");

  itemRunner.unmount();

  // Dispatch change on the previously-mounted radio.
  const ev = { type: "change", target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  target.dispatchEvent(ev);

  const after = stateModule.getState();
  assert.equal(after.responses.length, 0, "post-unmount radio change must NOT mutate responses (listener removed)");
});

// ─── AC-10.9: source-grep forbidden globals + no default export ──────────

test("AC-10.9: item-runner.js source contains no forbidden globals or default export", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "item-runner.js");
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`item-runner.js source not readable: ${err.message}`); }
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden (NFR10)");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden (NFR10)");
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden (NFR10)");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden (NFR10)");
  assert.equal(/\bnavigator\.share\b/.test(source), false, "navigator.share forbidden (NFR9)");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden (NFR10)");
  assert.equal(/\bsetTimeout\b/.test(source), false, "setTimeout forbidden (FR5 — no per-item timer)");
  assert.equal(/\bsetInterval\b/.test(source), false, "setInterval forbidden (FR5 — no per-item timer)");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden (named exports only)");
});
