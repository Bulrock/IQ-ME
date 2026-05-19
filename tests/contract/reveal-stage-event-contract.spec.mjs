// tests/contract/reveal-stage-event-contract.spec.mjs
//
// Story 3.5 AC-11.1..11.5 — direct ADR-shape assertions for the iqme:reveal-stage
// event. Orthogonal to AC-8 (which tests dispatcher correctness); these tests
// pin the wire-format described in docs/adr/iqme-reveal-stage-event-contract.md.
//
//   AC-11.1: event name is exactly "iqme:reveal-stage".
//   AC-11.2: detail has properties `stage` (string) and `t` (number); extras allowed.
//   AC-11.3: detail.t is finite + monotonically non-decreasing across calls.
//   AC-11.4: bubbles===true, composed===false.
//   AC-11.5: reserved Epic-6 stages all throw RangeError when dispatched in v1.
//
// node:test + node:assert/strict only. Stub document + CustomEvent locally
// (parallel to tests/unit/reveal-stage.test.mjs but scoped to contract slice).

import { test } from "node:test";
import assert from "node:assert/strict";

// ─── globalThis stubs (must precede dynamic import) ──────────────────────

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

const documentListeners = Object.create(null);
globalThis.document = {
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

let revealStage;
let importError = null;
try {
  revealStage = await import("../../src/assessment/reveal-stage.js");
} catch (err) { importError = err; }

function resetIfPossible() {
  if (revealStage && typeof revealStage.resetRevealStage === "function") {
    revealStage.resetRevealStage();
  }
}

function captureAll(fn) {
  const captured = [];
  // Listen to the contract-mandated event name AND a permissive wildcard via
  // any-type listener — we want to detect mis-named events too.
  const namedHandler = (ev) => captured.push({ type: "iqme:reveal-stage", ev });
  globalThis.document.addEventListener("iqme:reveal-stage", namedHandler);
  try { fn(); }
  finally { globalThis.document.removeEventListener("iqme:reveal-stage", namedHandler); }
  return captured;
}

// ─── AC-11.1 ─────────────────────────────────────────────────────────────

test("AC-11.1: event name is exactly 'iqme:reveal-stage' (no variants)", () => {
  assert.equal(importError, null, `reveal-stage.js failed to import: ${importError?.message}`);
  resetIfPossible();
  // Attach listeners for plausible misspellings; assert ONLY the contract name fires.
  const misnames = ["iqme:reveal_stage", "iqme-reveal-stage", "reveal-stage", "iqme:revealstage"];
  const misCaptured = misnames.map((n) => {
    const arr = [];
    const h = (ev) => arr.push(ev);
    globalThis.document.addEventListener(n, h);
    return { n, arr, h };
  });
  const got = captureAll(() => revealStage.dispatchStage("anchor"));
  for (const { n, arr, h } of misCaptured) {
    globalThis.document.removeEventListener(n, h);
    assert.equal(arr.length, 0, `no event should fire on misname '${n}'`);
  }
  assert.equal(got.length, 1, "exactly one 'iqme:reveal-stage' event must fire");
  assert.equal(got[0].ev.type, "iqme:reveal-stage", "event.type must be exactly 'iqme:reveal-stage'");
});

// ─── AC-11.2 ─────────────────────────────────────────────────────────────

test("AC-11.2: detail has `stage` (string) and `t` (number); additional properties allowed", () => {
  assert.equal(importError, null);
  resetIfPossible();
  const got = captureAll(() => revealStage.dispatchStage("anchor"));
  assert.equal(got.length, 1);
  const detail = got[0].ev.detail;
  assert.ok(detail && typeof detail === "object", "detail must be an object");
  assert.equal(typeof detail.stage, "string", "detail.stage must be a string");
  assert.equal(typeof detail.t, "number", "detail.t must be a number");
  // Additional properties allowed per ADR — no assertion on absence of extras.
});

// ─── AC-11.3 ─────────────────────────────────────────────────────────────

test("AC-11.3: detail.t is finite and monotonically non-decreasing across calls", () => {
  assert.equal(importError, null);
  resetIfPossible();
  const got = captureAll(() => {
    revealStage.dispatchStage("anchor");
    revealStage.dispatchStage("handoff");
  });
  assert.equal(got.length, 2, "two events expected");
  const t0 = got[0].ev.detail.t;
  const t1 = got[1].ev.detail.t;
  assert.ok(Number.isFinite(t0), `t0 (${t0}) must be finite`);
  assert.ok(Number.isFinite(t1), `t1 (${t1}) must be finite`);
  assert.ok(t1 >= t0, `t1 (${t1}) must be >= t0 (${t0}) — monotonic non-decreasing`);
});

// ─── AC-11.4 ─────────────────────────────────────────────────────────────

test("AC-11.4: event.bubbles === true, event.composed === false (per ADR)", () => {
  assert.equal(importError, null);
  resetIfPossible();
  const got = captureAll(() => revealStage.dispatchStage("anchor"));
  assert.equal(got.length, 1);
  assert.equal(got[0].ev.bubbles, true, "bubbles must be true");
  assert.equal(got[0].ev.composed, false, "composed must be false");
});

// ─── AC-11.5 ─────────────────────────────────────────────────────────────

test("AC-11.5: reserved Epic-6 stages (band/interval/context/tail-scene/methodology-handoff) all throw RangeError in v1", () => {
  assert.equal(importError, null);
  const reserved = ["band", "interval", "context", "tail-scene", "methodology-handoff"];
  for (const stage of reserved) {
    resetIfPossible();
    assert.throws(
      () => revealStage.dispatchStage(stage),
      (err) => err instanceof RangeError,
      `reserved stage '${stage}' must throw RangeError in Story 3-5 v1`,
    );
  }
});
