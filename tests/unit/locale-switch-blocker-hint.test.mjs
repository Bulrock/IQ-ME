// tests/unit/locale-switch-blocker-hint.test.mjs
//
// Story 7.2 AC-2 + AC-4 — src/assessment/locale-switch-blocker-hint.js.
//
// Teachable-moment FR8 hint (UX-DR27). Rendered into a slot adjacent to the
// language-switcher when an in-session locale-switch is blocked (via Story
// 7.1's onBlockedAttempt seam). Contract:
//
//   - render(slot, strings) injects a hint container with: the active-locale
//     message text, a link to the mid-session bail-out, and a link to the
//     validity-envelope methodology page. role="status" (NEVER role="alert" —
//     informational, not an error; lint-no-role-alert must stay green).
//   - clear(slot) removes the hint.
//   - re-render is idempotent (no duplicate hint elements).
//
// Node 22 native node:test + node:assert/strict. No third-party deps.
// jsdom-stub pattern (tests/unit/theme.test.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeElementStub, makeRootEl } from "./_dom-stub.mjs";

globalThis.document = {
  createElement: (tag) => makeElementStub(String(tag).toLowerCase()),
};

const STRINGS = {
  localeSwitchBlockerHint: {
    message: "Switching language during a test changes what the test measures. Finish this session in your current language, or end early and restart in a different language.",
    bailLinkLabel: "End the test early",
    validityLinkLabel: "Why language is locked",
  },
};

function makeSlot() {
  return makeRootEl({ class: "locale-switch-blocker-hint__slot" });
}

let mod;
let importError = null;
try {
  mod = await import("../../src/assessment/locale-switch-blocker-hint.js");
} catch (err) { importError = err; }

test("locale-switch-blocker-hint AC-2.a: render() injects a role='status' hint with the message text", () => {
  assert.equal(importError, null, `locale-switch-blocker-hint.js failed to import (RED expected until impl): ${importError?.message}`);
  const slot = makeSlot();
  mod.render(slot, STRINGS);
  const hint = slot.querySelector(".locale-switch-blocker-hint");
  assert.ok(hint, ".locale-switch-blocker-hint must be rendered");
  assert.equal(hint.getAttribute("role"), "status", "hint must be role='status', never role='alert' (lint-no-role-alert)");
  assert.notEqual(hint.getAttribute("role"), "alert");
  assert.ok((slot.textContent || "").includes("changes what the test measures"), "hint must contain the FR8 message copy");
});

test("locale-switch-blocker-hint AC-2.b: render() includes a bail link and a validity-envelope link", () => {
  const slot = makeSlot();
  mod.render(slot, STRINGS);
  const links = slot.querySelectorAll("a");
  assert.ok(links.length >= 2, "hint must contain at least two links (bail + validity-envelope)");
  const hrefs = links.map((a) => a.getAttribute("href") || "");
  assert.ok(hrefs.some((h) => /validity-envelope/.test(h)), "one link must point at the validity-envelope methodology page");
});

test("locale-switch-blocker-hint AC-4.a: clear() removes the hint", () => {
  const slot = makeSlot();
  mod.render(slot, STRINGS);
  assert.ok(slot.querySelector(".locale-switch-blocker-hint"), "precondition: hint rendered");
  mod.clear(slot);
  assert.equal(slot.querySelector(".locale-switch-blocker-hint"), null, "clear() must remove the hint");
});

test("locale-switch-blocker-hint AC-4.b: re-render is idempotent (no duplicate hints)", () => {
  const slot = makeSlot();
  mod.render(slot, STRINGS);
  mod.render(slot, STRINGS);
  assert.equal(slot.querySelectorAll(".locale-switch-blocker-hint").length, 1, "re-render must not duplicate the hint");
});

test("locale-switch-blocker-hint AC-2.c: source uses role=status, never role=alert", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "locale-switch-blocker-hint.js");
  const source = readFileSync(SRC, "utf8");
  assert.equal(/role\s*=\s*["']?alert/.test(source), false, "role='alert' forbidden (lint-no-role-alert) — use role='status'");
});
