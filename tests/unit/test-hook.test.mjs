// tests/unit/test-hook.test.mjs
//
// Story 3.7 AC-9 — src/assessment/test-hook.js activation gate + delegations.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SRC = resolve(REPO_ROOT, "src/assessment/test-hook.js");

// Helpers to stub globalThis.window / location for an import cycle. Each test
// resets the global + re-imports the module via a fresh URL with a cache-bust
// query so the module-level activation gate re-runs.
async function importFresh(href) {
  globalThis.window = {
    location: { href, search: href.includes("?") ? "?" + href.split("?")[1] : "" },
  };
  // Use _dom-stub-style minimal stubs for the modules test-hook imports.
  // state.js + routing.js import from main code; allow them to be imported as-is.
  const mod = await import(`../../src/assessment/test-hook.js?t=${Math.random()}`);
  return mod;
}

// ─── AC-9.1 ─────────────────────────────────────────────────────────────

test("AC-9.1: without ?test=1, window.__IQME_TEST__ is undefined", async () => {
  globalThis.window = { location: { href: "http://localhost/", search: "" } };
  await import(`../../src/assessment/test-hook.js?t=ac9_1_${Date.now()}`).catch(() => {});
  assert.equal(globalThis.window.__IQME_TEST__, undefined, "hook must not activate without ?test=1");
});

// ─── AC-9.2 ─────────────────────────────────────────────────────────────

test("AC-9.2: with ?test=1, window.__IQME_TEST__ is an object with 5 documented methods", async () => {
  globalThis.window = { location: { href: "http://localhost/?test=1", search: "?test=1" } };
  await import(`../../src/assessment/test-hook.js?t=ac9_2_${Date.now()}`);
  const hook = globalThis.window.__IQME_TEST__;
  assert.ok(hook, "__IQME_TEST__ must be assigned");
  for (const m of ["setSeed", "getState", "recordResponse", "navigate", "resetState"]) {
    assert.equal(typeof hook[m], "function", `method ${m} must exist`);
  }
});

// ─── AC-9.3 ─────────────────────────────────────────────────────────────

test("AC-9.3: setSeed with valid 32-char hex does not throw", async () => {
  globalThis.window = { location: { href: "http://localhost/?test=1", search: "?test=1" } };
  await import(`../../src/assessment/test-hook.js?t=ac9_3_${Date.now()}`);
  const hook = globalThis.window.__IQME_TEST__;
  assert.doesNotThrow(() => hook.setSeed("0".repeat(32)));
});

// ─── AC-9.4 ─────────────────────────────────────────────────────────────

test("AC-9.4: setSeed with invalid arg throws", async () => {
  globalThis.window = { location: { href: "http://localhost/?test=1", search: "?test=1" } };
  await import(`../../src/assessment/test-hook.js?t=ac9_4_${Date.now()}`);
  const hook = globalThis.window.__IQME_TEST__;
  assert.throws(() => hook.setSeed("invalid"));
});

// ─── AC-9.5 ─────────────────────────────────────────────────────────────

test("AC-9.5: getState returns an object with the documented schema keys", async () => {
  globalThis.window = { location: { href: "http://localhost/?test=1", search: "?test=1" } };
  await import(`../../src/assessment/test-hook.js?t=ac9_5_${Date.now()}`);
  const hook = globalThis.window.__IQME_TEST__;
  hook.resetState();
  const s = hook.getState();
  for (const k of ["responses", "currentItem", "locale", "seed", "startedAt"]) {
    assert.ok(k in s, `state must have key ${k}; got keys: ${Object.keys(s).join(",")}`);
  }
});

// ─── AC-9.6 ─────────────────────────────────────────────────────────────

test("AC-9.6: recordResponse mutates state; getState reflects it", async () => {
  globalThis.window = { location: { href: "http://localhost/?test=1", search: "?test=1" } };
  await import(`../../src/assessment/test-hook.js?t=ac9_6_${Date.now()}`);
  const hook = globalThis.window.__IQME_TEST__;
  hook.resetState();
  hook.recordResponse(0, 1);
  const s = hook.getState();
  assert.ok(Array.isArray(s.responses), "responses must be array");
  assert.ok(s.responses.some((r) => r.itemIndex === 0 && r.response === 1), `expected (0,1) recorded; got: ${JSON.stringify(s.responses)}`);
});

// ─── AC-9.7 ─────────────────────────────────────────────────────────────

test("AC-9.7: src/assessment/test-hook.js has no forbidden globals / default export", () => {
  const src = readFileSync(SRC, "utf8");
  assert.ok(!/Math\.random/.test(src), "must not use Math.random");
  assert.ok(!/setTimeout|setInterval/.test(src), "must not use setTimeout/setInterval");
  assert.ok(!/console\.log/.test(src), "must not use console.log");
  assert.ok(!/export\s+default/.test(src), "must not have default export");
});
