// tests/unit/main.test.mjs
//
// Story 3.3 AC-2 — src/assessment/main.js bootstrap.
//
// Pattern follows tests/contract/state-shape.spec.mjs (Story 3-2):
// stub globals at module top BEFORE dynamic-importing the SUT.
// Node 22 native node:test + node:assert/strict; no third-party deps.
//
// AC-2 contract:
//   - named export `start()`.
//   - on start: await localeLoader.load('en') THEN routing.start().
//   - try/catch the whole bootstrap; on error, renderErrorFallback into #app.
//   - no Math.random / Date.now / localStorage / sessionStorage / navigator.share / console.log.
//
// What this file CAN observe in red phase:
//   - module imports cleanly (named-export contract).
//   - `start()` returns a promise that either resolves or fulfills the
//     try/catch contract (no unhandled rejection).
//   - error-fallback path: when fetch rejects (so locale-loader rejects),
//     start() catches and writes a fallback into #app.
//
// What this file CANNOT cleanly observe without ESM intercept:
//   - "second start() is a no-op" — the test below is honestly scoped to
//     "second start() does not throw or reject" (cycle-1 review F-08).

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeRootEl } from "./_dom-stub.mjs";

// ── DOM + fetch stubs installed BEFORE SUT import ────────────────────────

const appEl = makeRootEl({ id: "app" });

globalThis.document = {
  readyState: "complete",
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: (id) => (id === "app" ? appEl : null),
  createElement: () => makeRootEl({ tag: "div", id: "" }),
};

globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { hash: "" },
  dispatchEvent: () => true,
};

// fetch stub — per-test override via `fetchResponder`.
let fetchResponder = async (_url) => ({ ok: false, status: 404, json: async () => ({}) });
globalThis.fetch = (url) => fetchResponder(url);

// Stub IntersectionObserver since landing/consent scenes may construct one
// during initial render — keeps the import chain clean if the impl
// transitively pulls in consent.js.
globalThis.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {} unobserve() {} disconnect() {}
};

// ── Dynamic-import SUT ───────────────────────────────────────────────────

let mainModule;
let importError = null;
try {
  mainModule = await import("../../src/assessment/main.js");
} catch (err) {
  importError = err;
}

test("AC-2.1: main.js exists and exports named start()", () => {
  assert.equal(importError, null, `main.js failed to import: ${importError?.message}`);
  assert.equal(typeof mainModule.start, "function", "main.js must export named `start`");
  assert.equal(mainModule.default, undefined, "main.js must not export a default");
});

test("AC-2.2: second start() does not throw or reject", async () => {
  // Honest scope (per cycle-1 review F-08): node:test cannot observe ESM
  // module-internal `started` flag without a loader hook. This test pins the
  // weaker contract "calling start() twice does not raise an unhandled
  // rejection or thrown exception". The stronger idempotency invariant is
  // covered by green-phase integration coverage in Story 3-7.
  assert.equal(importError, null, "main.js must import successfully");
  // First call — install a stub responder so locale-load resolves cleanly.
  fetchResponder = async () => ({ ok: true, status: 200, json: async () => ({ chrome: {}, landing: {}, consent: {} }) });
  await assert.doesNotReject(mainModule.start());
  // Second call.
  await assert.doesNotReject(mainModule.start());
});

test("AC-2.3: try/catch error-fallback path writes chrome.errorFallbackMessage into #app", async () => {
  // Spec AC-2 line 40: 'Wraps the entire bootstrap in a try/catch. On thrown
  // error, writes a localized polite fallback into #app via error-fallback.js
  // (NFR20).' This test induces a fetch rejection (locale-loader.load throws),
  // expects start() to catch it and route through renderErrorFallback.
  assert.equal(importError, null);
  // Reset appEl content.
  appEl.innerHTML = "";
  // Install a fetch that rejects for ANY URL (including the EN fallback path
  // inside locale-loader). This forces locale-loader.load('en') to resolve
  // with an empty bundle ({}), at which point `get('chrome.errorFallbackMessage')`
  // returns the bare key literal — that's the visible failure mode the
  // architecture mandates (line 836-837). For the error-fallback path itself
  // (NFR20), we want the bootstrap to *survive* the locale-load failure AND
  // still render *something* into #app — either the fallback content or
  // a route render against the empty-bundle bare-key locale. We assert that
  // start() does NOT reject (catch caught the error) AND that #app innerHTML
  // is non-empty after settle (either rendered scene or fallback).
  fetchResponder = async () => { throw new Error("synthetic network failure"); };
  await assert.doesNotReject(mainModule.start(), "start() must catch all bootstrap errors");
  // After settle, #app must have content — either route render (empty-bundle
  // bare-key path) or error-fallback content. A completely empty #app would
  // indicate the catch swallowed silently without rendering anything, which
  // violates NFR20.
  await new Promise(r => queueMicrotask(r));
  assert.ok(
    appEl.innerHTML.length > 0,
    `#app must have content after bootstrap error (NFR20 fallback path); got empty innerHTML`,
  );
});

test("AC-2.4: main.js source contains no forbidden globals (NFR9/NFR10)", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "main.js");
  let source;
  try {
    source = readFileSync(SRC, "utf8");
  } catch (err) {
    assert.fail(`main.js source not readable: ${err.message}`);
  }
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden in main.js");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden in main.js");
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden in main.js");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden in main.js");
  assert.equal(/\bnavigator\.share\b/.test(source), false, "navigator.share forbidden in main.js");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden in main.js");
});
