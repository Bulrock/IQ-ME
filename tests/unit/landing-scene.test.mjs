// tests/unit/landing-scene.test.mjs
//
// Story 3.3 AC-4 — src/assessment/landing.js landing scene.
//
// Pattern follows tests/contract/state-shape.spec.mjs (Story 3-2):
// stub globals BEFORE dynamic-importing the SUT.
// Node 22 native node:test + node:assert/strict; no third-party deps.
//
// AC-4 contract (observable):
//   - named exports: render(rootEl, strings), unmount(rootEl); no default.
//   - render writes:
//     <section class="landing" aria-labelledby="landing-heading">
//       <h1 id="landing-heading">{landing.headline}</h1>
//       <p class="landing__paragraph">{landing.intro}</p>
//       <div class="landing__cta-group">
//         <button id="start-test-btn" class="landing__start-btn" type="button">
//           {landing.startTestButton}
//         </button>
//         <a class="landing__methodology-link" href="/methodology/v0.1.0/en/">
//           {landing.methodologyLink}
//         </a>
//       </div>
//     </section>
//   - clicking #start-test-btn invokes routing.navigate('selection') → window.location.hash='#/selection' (Story 12-2 flow).
//   - unmount() removes the click listener AND clears rootEl.innerHTML.
//   - no localStorage / sessionStorage / navigator.share / role="alert" /
//     Math.random / Date.now / console.log in shipped source.
//
// Cycle-2 changes (per test-review):
//   - F-02: regex parser replaced with shared tokenizer in _dom-stub.mjs (attribute-order-agnostic).
//   - F-14: AC-4.9 click test verifies start-btn → routing.navigate (Story 12-2 retargeted to 'selection') wires through (window.location.hash mutation).
//   - F-15: AC-4.7 expanded to verify click-listener removal post-unmount.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

// ── document.createElement support for impl-using-createElement paths ────

globalThis.document = {
  createElement: (tag) => makeElementStub(String(tag).toLowerCase()),
};

// ── window stub: instrumented location.hash for navigate observation ────

globalThis.window = {
  location: { hash: "" },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

// ── Dynamic-import SUT ───────────────────────────────────────────────────

let landing;
let importError = null;
try {
  landing = await import("../../src/assessment/landing.js");
} catch (err) {
  importError = err;
}

const STRINGS = {
  landing: {
    headline: "__H_HEADLINE__",
    intro: "__H_INTRO__",
    startTestButton: "__H_START__",
    methodologyLink: "__H_METHOD__",
  },
};

test("AC-4.1: landing.js exists and exports named render() + unmount() (no default)", () => {
  assert.equal(importError, null, `landing.js failed to import: ${importError?.message}`);
  assert.equal(typeof landing.render, "function");
  assert.equal(typeof landing.unmount, "function", "unmount must be exported");
  assert.equal(landing.default, undefined);
});

test("AC-4.2: render writes <section class='landing' aria-labelledby='landing-heading'>", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  landing.render(root, STRINGS);
  const section = root.querySelector(".landing");
  assert.ok(section, "section.landing must exist after render");
  assert.equal(section.tag, "section");
  assert.equal(section.attrs["aria-labelledby"], "landing-heading");
});

test("AC-4.3: render writes <h1 id='landing-heading'> with landing.headline string", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  landing.render(root, STRINGS);
  const h1 = root.querySelector("#landing-heading");
  assert.ok(h1, "h1#landing-heading must exist");
  assert.equal(h1.tag, "h1");
  assert.equal(h1.textContent, "__H_HEADLINE__", "h1 textContent must come from i18n landing.headline");
});

test("AC-4.4: render writes <p class='landing__paragraph'> with landing.intro string", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  landing.render(root, STRINGS);
  const p = root.querySelector(".landing__paragraph");
  assert.ok(p, "p.landing__paragraph must exist");
  assert.equal(p.tag, "p");
  assert.equal(p.textContent, "__H_INTRO__", "paragraph textContent must come from i18n landing.intro");
});

test("AC-4.5: render writes #start-test-btn inside .landing__cta-group with landing.startTestButton string", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  landing.render(root, STRINGS);
  const ctaGroup = root.querySelector(".landing__cta-group");
  assert.ok(ctaGroup, ".landing__cta-group wrapper must exist");
  // Descendant selector finds button under the cta-group ancestor.
  const btn = root.querySelector(".landing__cta-group #start-test-btn");
  assert.ok(btn, "#start-test-btn must be a descendant of .landing__cta-group");
  assert.equal(btn.tag, "button");
  assert.equal(btn.attrs.type, "button", "button must have type='button'");
  assert.equal(btn.textContent, "__H_START__", "button textContent must come from i18n landing.startTestButton");
});

test("AC-4.6: render writes methodology link with exact href='/methodology/v0.1.0/en/' inside .landing__cta-group", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  landing.render(root, STRINGS);
  const a = root.querySelector(".landing__methodology-link");
  assert.ok(a, "a.landing__methodology-link must exist");
  assert.equal(a.tag, "a");
  assert.equal(a.attrs.href, "/methodology/v0.1.0/en/", "methodology URL is hard contract (ADR Story 3-1)");
  assert.equal(a.textContent, "__H_METHOD__", "link textContent must come from i18n landing.methodologyLink");
  // Structural: must live inside .landing__cta-group.
  const aInCta = root.querySelector(".landing__cta-group .landing__methodology-link");
  assert.ok(aInCta, ".landing__methodology-link must be a descendant of .landing__cta-group");
});

test("AC-4.7: unmount() clears rootEl.innerHTML AND removes the start-btn click listener", () => {
  // F-15: cycle-1 only verified innerHTML clearing. Spec line 64 requires
  // BOTH listener removal AND innerHTML clear.
  assert.equal(importError, null);
  globalThis.window.location.hash = "";
  const root = makeRootEl({ id: "app" });
  landing.render(root, STRINGS);
  const btn = root.querySelector("#start-test-btn");
  assert.ok(btn, "precondition: #start-test-btn must exist before unmount");
  // Sanity: click should work pre-unmount (proven by AC-4.9 below).
  // Now unmount.
  landing.unmount(root);
  assert.equal(root.innerHTML, "", "unmount must clear innerHTML");
  // After unmount, clicking the captured-pre-unmount button should NOT
  // mutate window.location.hash (listener was removed).
  globalThis.window.location.hash = "";
  const ev = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  btn.dispatchEvent(ev);
  assert.equal(globalThis.window.location.hash, "", "post-unmount click must NOT navigate (listener removed)");
});

test("AC-4.8: landing.js source contains no forbidden globals or default export", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "landing.js");
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`landing.js source not readable: ${err.message}`); }
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden");
  assert.equal(/\bnavigator\.share\b/.test(source), false, "navigator.share forbidden");
  assert.equal(/role=["']alert["']/.test(source), false, "role='alert' forbidden");
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden");
});

test("AC-4.9: clicking #start-test-btn invokes routing.navigate('selection') → window.location.hash='#/selection'", () => {
  // Story 12-2 (PR-15) updated the flow: landing → SELECTION → consent → test.
  // The "Start the test" button now navigates to the pre-test methodology +
  // variant selection scene (#/selection) rather than straight to consent.
  // Verified via the observable side effect: routing.navigate mutates
  // window.location.hash. (Cross-story frozen-test update: the new selection
  // step is the deliberate flow change for the multi-test battery.)
  assert.equal(importError, null);
  globalThis.window.location.hash = "";
  const root = makeRootEl({ id: "app" });
  landing.render(root, STRINGS);
  const btn = root.querySelector("#start-test-btn");
  assert.ok(btn);
  const ev = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  btn.dispatchEvent(ev);
  assert.equal(
    globalThis.window.location.hash,
    "#/selection",
    `start-btn click must trigger routing.navigate('selection') → hash mutation; got hash=${globalThis.window.location.hash}`,
  );
});
