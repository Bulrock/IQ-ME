// tests/unit/selection-scene.test.mjs
//
// Story 12-2 — src/assessment/selection.js pre-test selection scene.
// Pattern follows landing-scene.test.mjs: stub globals before dynamic import.
//
// Observable contract:
//   - named exports render(rootEl, strings) + unmount(rootEl); no default.
//   - render writes <section class="selection-scene" aria-labelledby="selection-heading">
//     with an h1#selection-heading, a methodology radio fieldset, a variant
//     radio fieldset (short|full), and a #selection-continue-btn button.
//   - geometric methodology + short variant are checked by default.
//   - clicking #selection-continue-btn navigates to consent (hash → #/consent).
//   - unmount clears innerHTML + removes the listener.
//   - source has no forbidden globals / default export; text via escape helpers.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

globalThis.document = { createElement: (tag) => makeElementStub(String(tag).toLowerCase()) };
globalThis.window = {
  location: { hash: "" },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

let selection;
let importError = null;
try {
  selection = await import("../../src/assessment/selection.js");
} catch (err) {
  importError = err;
}

const STRINGS = {
  selection: {
    heading: "__H_HEADING__",
    intro: "__H_INTRO__",
    methodologyLegend: "__H_METHLEG__",
    variantLegend: "__H_VARLEG__",
    geometricLabel: "__H_GEO__",
    shortLabel: "__H_SHORT__",
    fullLabel: "__H_FULL__",
    continueButton: "__H_CONTINUE__",
  },
};

test("AC1: selection.js exports named render + unmount (no default)", () => {
  assert.equal(importError, null, `selection.js failed to import: ${importError?.message}`);
  assert.equal(typeof selection.render, "function");
  assert.equal(typeof selection.unmount, "function");
  assert.equal(selection.default, undefined);
});

test("AC1: render writes <section class='selection-scene'> with the heading", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  selection.render(root, STRINGS);
  const section = root.querySelector(".selection-scene");
  assert.ok(section, "section.selection-scene must exist");
  const h1 = root.querySelector("#selection-heading");
  assert.ok(h1, "h1#selection-heading must exist");
  assert.equal(h1.textContent, "__H_HEADING__");
});

test("AC1: render writes a methodology radio fieldset and a variant radio fieldset", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  selection.render(root, STRINGS);
  const radios = root.querySelectorAll("input");
  assert.ok(radios.length >= 3, "must render >=3 radio inputs (>=1 methodology + short + full)");
  const types = radios.map(r => r.getAttribute("type"));
  assert.ok(types.every(t => t === "radio"), "all selection inputs must be radios");
  // variant group must offer short + full
  const values = radios.map(r => r.getAttribute("value"));
  assert.ok(values.includes("short"), "must offer a short variant radio");
  assert.ok(values.includes("full"), "must offer a full variant radio");
});

test("AC1: geometric methodology + short variant are checked by default", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  selection.render(root, STRINGS);
  const radios = root.querySelectorAll("input");
  const shortRadio = radios.find(r => r.getAttribute("value") === "short");
  assert.ok(shortRadio && shortRadio.hasAttribute("checked"), "short variant must be checked by default");
  // a methodology radio (value 'geometric') must be checked
  const geo = radios.find(r => r.getAttribute("value") === "geometric");
  assert.ok(geo && geo.hasAttribute("checked"), "geometric methodology must be checked by default");
});

test("AC3: clicking the continue button navigates to consent", () => {
  assert.equal(importError, null);
  globalThis.window.location.hash = "";
  const root = makeRootEl({ id: "app" });
  selection.render(root, STRINGS);
  const btn = root.querySelector("#selection-continue-btn");
  assert.ok(btn, "#selection-continue-btn must exist");
  const ev = { type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  btn.dispatchEvent(ev);
  assert.equal(globalThis.window.location.hash, "#/consent", "continue must navigate to consent (preserves the dwell ceremony)");
});

test("AC3: unmount clears innerHTML and removes the continue listener", () => {
  assert.equal(importError, null);
  const root = makeRootEl({ id: "app" });
  selection.render(root, STRINGS);
  const btn = root.querySelector("#selection-continue-btn");
  selection.unmount(root);
  assert.equal(root.innerHTML, "", "unmount must clear innerHTML");
  globalThis.window.location.hash = "";
  const ev = { type: "click", defaultPrevented: false, preventDefault() {} };
  btn.dispatchEvent(ev);
  assert.equal(globalThis.window.location.hash, "", "post-unmount click must not navigate (listener removed)");
});

test("AC4: selection.js source has no forbidden globals / default export / hardcoded prose", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "selection.js");
  const src = readFileSync(SRC, "utf8");
  assert.ok(!/\blocalStorage\b/.test(src), "localStorage forbidden");
  assert.ok(!/\bsessionStorage\b/.test(src), "sessionStorage forbidden");
  assert.ok(!/\bMath\.random\b/.test(src), "Math.random forbidden");
  assert.ok(!/\bDate\.now\b/.test(src), "Date.now forbidden");
  assert.ok(!/\bconsole\.log\b/.test(src), "console.log forbidden");
  assert.ok(!/^export\s+default\b/m.test(src), "default export forbidden");
  assert.match(src, /escapeText|escapeAttr/, "must use the escape helpers");
});
