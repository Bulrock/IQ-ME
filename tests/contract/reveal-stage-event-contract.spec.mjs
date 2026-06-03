// tests/contract/reveal-stage-event-contract.spec.mjs
//
// Story 3.5 AC-11.1..11.4 — direct ADR-shape assertions for the iqme:reveal-stage
// event. Orthogonal to AC-8 (which tests dispatcher correctness); these tests
// pin the wire-format described in docs/adr/iqme-reveal-stage-event-contract.md.
//
// Story 6.1 AC-2 — AC-11.5 INVERTS (per spec graduation): the 5 reserved Epic-6
// stages now dispatch successfully instead of throwing. Additional invariants
// AC-11.6..AC-11.8 are added to lock the full 6-stage ADR-3-1 enumeration:
//
//   AC-11.1 (3.5):       event name is exactly "iqme:reveal-stage".
//   AC-11.2 (3.5):       detail has properties `stage` (string) and `t` (number); extras allowed.
//   AC-11.3 (3.5):       detail.t is finite + monotonically non-decreasing across calls.
//   AC-11.4 (3.5):       bubbles===true, composed===false.
//   AC-11.5 (6.1 invert): each of band/interval/context/tail-scene/methodology-handoff
//                         dispatches successfully (no throw) with correct stage payload.
//   AC-11.6 (6.1 new):   full 6-stage sequence anchor → band → interval → context →
//                         tail-scene → methodology-handoff fires once each, in order,
//                         with monotonic-non-decreasing t.
//   AC-11.7 (6.1 new):   out-of-order dispatch (e.g. band before anchor) throws Error.
//   AC-11.8 (6.1 new):   repeat dispatch within a session throws Error.
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

// Full ADR-3-1 enumeration (Story 6.1 graduation target).
const FULL_SEQUENCE = ["anchor", "band", "interval", "context", "tail-scene", "methodology-handoff"];

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
  // Use the first two stages of the graduated sequence (anchor → band).
  // Pre-6.1 v1 only had anchor → handoff; the contract assertion is the same:
  // any two consecutive successful dispatches must have t1 >= t0.
  const got = captureAll(() => {
    revealStage.dispatchStage("anchor");
    revealStage.dispatchStage("band");
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

// ─── AC-11.5 (Story 6.1 INVERSION) ───────────────────────────────────────
//
// Pre-6.1 (Story 3.5 v1): the 5 reserved stages threw RangeError.
// Post-6.1 (graduation per spec AC-2 / ADR-3-1): each reserved stage now
// dispatches successfully when reached in declared order, producing an event
// with detail.stage matching the dispatched name. We test each stage in
// isolation by replaying the prefix of FULL_SEQUENCE up to (but not including)
// the target stage, then asserting the target dispatch fires correctly.

test("AC-11.5: each reserved Epic-6 stage (band/interval/context/tail-scene/methodology-handoff) dispatches successfully with correct stage payload", () => {
  assert.equal(importError, null);
  const reserved = ["band", "interval", "context", "tail-scene", "methodology-handoff"];
  for (const stage of reserved) {
    resetIfPossible();
    // Replay prefix: all stages preceding `stage` in FULL_SEQUENCE.
    const idx = FULL_SEQUENCE.indexOf(stage);
    assert.ok(idx > 0, `reserved stage '${stage}' must appear in FULL_SEQUENCE after anchor`);
    for (let j = 0; j < idx; j++) {
      revealStage.dispatchStage(FULL_SEQUENCE[j]);
    }
    // Now dispatch the target stage and capture only that one.
    const got = captureAll(() => revealStage.dispatchStage(stage));
    assert.equal(got.length, 1, `exactly one event must fire for stage '${stage}'`);
    assert.equal(got[0].ev.type, "iqme:reveal-stage", `stage '${stage}' must emit iqme:reveal-stage`);
    assert.equal(got[0].ev.detail.stage, stage, `detail.stage must equal '${stage}'`);
    assert.equal(typeof got[0].ev.detail.t, "number", `detail.t must be a number for '${stage}'`);
    assert.ok(Number.isFinite(got[0].ev.detail.t), `detail.t must be finite for '${stage}'`);
  }
});

// ─── AC-11.6 (Story 6.1 NEW) ─────────────────────────────────────────────

test("AC-11.6: full 6-stage sequence anchor→band→interval→context→tail-scene→methodology-handoff fires once each, in order, with monotonic-non-decreasing t", () => {
  assert.equal(importError, null);
  resetIfPossible();
  const got = captureAll(() => {
    for (const stage of FULL_SEQUENCE) revealStage.dispatchStage(stage);
  });
  assert.equal(got.length, FULL_SEQUENCE.length, `exactly ${FULL_SEQUENCE.length} events expected; got ${got.length}`);
  // Stages in declared order, no repeats.
  const stagesSeen = got.map((e) => e.ev.detail.stage);
  assert.deepEqual(stagesSeen, FULL_SEQUENCE, `stages must fire in declared order; got: ${JSON.stringify(stagesSeen)}`);
  // Monotonic-non-decreasing t.
  for (let i = 1; i < got.length; i++) {
    const prev = got[i - 1].ev.detail.t;
    const curr = got[i].ev.detail.t;
    assert.ok(
      curr >= prev,
      `t at index ${i} (stage '${stagesSeen[i]}', t=${curr}) must be >= predecessor t (stage '${stagesSeen[i - 1]}', t=${prev})`,
    );
  }
});

// ─── AC-11.7 (Story 6.1 NEW) ─────────────────────────────────────────────

test("AC-11.7: out-of-order dispatch (band before anchor) throws Error matching /declared order/i", () => {
  assert.equal(importError, null);
  resetIfPossible();
  assert.throws(
    () => revealStage.dispatchStage("band"),
    (err) => err instanceof Error && /declared order/i.test(err.message),
    "band before anchor must throw Error matching /declared order/i",
  );
});

test("AC-11.7: out-of-order dispatch (methodology-handoff before tail-scene) throws Error matching /declared order/i", () => {
  assert.equal(importError, null);
  resetIfPossible();
  // Walk up to but skipping tail-scene.
  for (const stage of ["anchor", "band", "interval", "context"]) {
    revealStage.dispatchStage(stage);
  }
  assert.throws(
    () => revealStage.dispatchStage("methodology-handoff"),
    (err) => err instanceof Error && /declared order/i.test(err.message),
    "skipping tail-scene must throw Error matching /declared order/i",
  );
});

// ─── AC-11.8 (Story 6.1 NEW) ─────────────────────────────────────────────

test("AC-11.8: repeat dispatch within a session throws Error matching /already fired/i", () => {
  assert.equal(importError, null);
  resetIfPossible();
  revealStage.dispatchStage("anchor");
  assert.throws(
    () => revealStage.dispatchStage("anchor"),
    (err) => err instanceof Error && /already fired/i.test(err.message),
    "repeated anchor must throw Error matching /already fired/i",
  );
});

test("AC-11.8: repeat dispatch of a mid-sequence stage (band) throws Error matching /already fired/i", () => {
  assert.equal(importError, null);
  resetIfPossible();
  revealStage.dispatchStage("anchor");
  revealStage.dispatchStage("band");
  assert.throws(
    () => revealStage.dispatchStage("band"),
    (err) => err instanceof Error && /already fired/i.test(err.message),
    "repeated band must throw Error matching /already fired/i",
  );
});
