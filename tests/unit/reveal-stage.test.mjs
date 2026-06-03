// tests/unit/reveal-stage.test.mjs
//
// Story 3.5 AC-8.1..8.10 — `src/assessment/reveal-stage.js` event dispatcher.
// Story 6.1 graduated the v1 enum from ["anchor","handoff"] to the full
// ADR-3-1 sequence ["anchor","band","interval","context","tail-scene",
// "methodology-handoff"]. Tests AC-8.2/8.3/8.4/8.6 retargeted to use
// graduated stage names while preserving the original behavioral intent
// (sequence dispatch + order enforcement + per-session one-shot).
//
// Contract under test (per docs/adr/iqme-reveal-stage-event-contract.md):
//   - Named export `dispatchStage(stage)` constructs a CustomEvent named
//     "iqme:reveal-stage" with { bubbles:true, composed:false } and
//     detail { stage, t: performance.now() }, dispatched on `document`.
//   - Stage enum is exactly the ADR-3-1 6-stage sequence; declared order
//     anchor → band → interval → context → tail-scene → methodology-handoff.
//   - Arbitrary unknown strings (e.g. legacy "handoff") throw RangeError.
//   - Repeat or out-of-order calls throw Error matching /declared order/i
//     or /already fired/i.
//   - Named export `resetRevealStage()` clears the per-session fired-set.
//   - Source-grep: no Math.random / Date.now / localStorage / sessionStorage /
//     console.log / setTimeout / setInterval / default export.
//
// node:test + node:assert/strict; no third-party deps (NFR33).
// Document stub is local (we only need addEventListener + dispatchEvent on
// `document`); CustomEvent is also a local class so we control the shape we
// assert on. Node 22's global performance.now() is reused (no shadow).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "..", "..", "src", "assessment", "reveal-stage.js");

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
  addEventListener(type, fn) {
    (documentListeners[type] ||= []).push(fn);
  },
  removeEventListener(type, fn) {
    const arr = documentListeners[type];
    if (!arr) return;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  },
  dispatchEvent(ev) {
    const arr = documentListeners[ev.type] || [];
    for (const h of arr) {
      try { h(ev); } catch (_e) { /* swallow */ }
    }
    return !ev.defaultPrevented;
  },
};

// ─── Dynamic import (SUT does not exist yet — red-phase) ─────────────────

let revealStage;
let importError = null;
try {
  revealStage = await import("../../src/assessment/reveal-stage.js");
} catch (err) { importError = err; }

// Helper: capture all events of the given type fired on document during fn().
function captureEvents(type, fn) {
  const captured = [];
  const handler = (ev) => captured.push(ev);
  globalThis.document.addEventListener(type, handler);
  try { fn(); }
  finally { globalThis.document.removeEventListener(type, handler); }
  return captured;
}

function resetIfPossible() {
  if (revealStage && typeof revealStage.resetRevealStage === "function") {
    revealStage.resetRevealStage();
  }
}

// ─── AC-8.1 ──────────────────────────────────────────────────────────────

test("AC-8.1: dispatchStage('anchor') fires iqme:reveal-stage on document with detail.stage='anchor' + finite detail.t", () => {
  assert.equal(importError, null, `reveal-stage.js failed to import: ${importError?.message}`);
  resetIfPossible();
  const events = captureEvents("iqme:reveal-stage", () => {
    revealStage.dispatchStage("anchor");
  });
  assert.equal(events.length, 1, "exactly one iqme:reveal-stage event must fire");
  assert.equal(events[0].type, "iqme:reveal-stage");
  assert.equal(events[0].detail.stage, "anchor");
  assert.equal(typeof events[0].detail.t, "number", "detail.t must be a number");
  assert.ok(Number.isFinite(events[0].detail.t), "detail.t must be finite");
});

// ─── AC-8.2 ──────────────────────────────────────────────────────────────

test("AC-8.2: dispatchStage('band') (after anchor) fires with detail.stage='band' [graduated 6.1]", () => {
  assert.equal(importError, null);
  resetIfPossible();
  revealStage.dispatchStage("anchor");
  const events = captureEvents("iqme:reveal-stage", () => {
    revealStage.dispatchStage("band");
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.stage, "band");
});

// ─── AC-8.3 ──────────────────────────────────────────────────────────────

test("AC-8.3: anchor then band produces two events in order with t_band >= t_anchor [graduated 6.1]", () => {
  assert.equal(importError, null);
  resetIfPossible();
  const events = captureEvents("iqme:reveal-stage", () => {
    revealStage.dispatchStage("anchor");
    revealStage.dispatchStage("band");
  });
  assert.equal(events.length, 2, "two events expected");
  assert.equal(events[0].detail.stage, "anchor");
  assert.equal(events[1].detail.stage, "band");
  assert.ok(
    events[1].detail.t >= events[0].detail.t,
    `t_band (${events[1].detail.t}) must be >= t_anchor (${events[0].detail.t})`,
  );
});

// ─── AC-8.4 ──────────────────────────────────────────────────────────────

test("AC-8.4: dispatchStage('methodology-handoff') before anchor throws Error matching /declared order/i [graduated 6.1]", () => {
  assert.equal(importError, null);
  resetIfPossible();
  assert.throws(
    () => revealStage.dispatchStage("methodology-handoff"),
    (err) => err instanceof Error && /declared order/i.test(err.message),
    "methodology-handoff before anchor must throw Error matching /declared order/i",
  );
});

// ─── AC-8.5 ──────────────────────────────────────────────────────────────

test("AC-8.5: dispatchStage('anchor') twice in a session throws Error matching /already fired/i", () => {
  assert.equal(importError, null);
  resetIfPossible();
  revealStage.dispatchStage("anchor");
  assert.throws(
    () => revealStage.dispatchStage("anchor"),
    (err) => err instanceof Error && /already fired/i.test(err.message),
    "repeated anchor must throw Error matching /already fired/i",
  );
});

// ─── AC-8.6 ──────────────────────────────────────────────────────────────

test("AC-8.6: legacy stage 'handoff' (removed in 6.1 graduation) throws RangeError [graduated 6.1]", () => {
  assert.equal(importError, null);
  resetIfPossible();
  assert.throws(
    () => revealStage.dispatchStage("handoff"),
    (err) => err instanceof RangeError && /unknown reveal stage/i.test(err.message),
    "legacy 'handoff' token (not in graduated ADR-3-1 enum) must throw RangeError",
  );
});

// ─── AC-8.7 ──────────────────────────────────────────────────────────────

test("AC-8.7: dispatchStage('unknown-garbage') throws RangeError", () => {
  assert.equal(importError, null);
  resetIfPossible();
  assert.throws(
    () => revealStage.dispatchStage("unknown-garbage"),
    (err) => err instanceof RangeError,
    "arbitrary string must throw RangeError",
  );
});

// ─── AC-8.8 ──────────────────────────────────────────────────────────────

test("AC-8.8: after resetRevealStage(), anchor again succeeds", () => {
  assert.equal(importError, null);
  resetIfPossible();
  revealStage.dispatchStage("anchor");
  revealStage.resetRevealStage();
  const events = captureEvents("iqme:reveal-stage", () => {
    revealStage.dispatchStage("anchor");
  });
  assert.equal(events.length, 1, "post-reset anchor must dispatch normally");
  assert.equal(events[0].detail.stage, "anchor");
});

// ─── AC-8.9 ──────────────────────────────────────────────────────────────

test("AC-8.9: event.bubbles === true and event.composed === false (per ADR)", () => {
  assert.equal(importError, null);
  resetIfPossible();
  const events = captureEvents("iqme:reveal-stage", () => {
    revealStage.dispatchStage("anchor");
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].bubbles, true, "bubbles must be true");
  assert.equal(events[0].composed, false, "composed must be false");
});

// ─── AC-8.10 ─────────────────────────────────────────────────────────────

test("AC-8.10: reveal-stage.js source contains no forbidden globals or default export", () => {
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`reveal-stage.js source not readable: ${err.message}`); }
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden (NFR10)");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden (NFR10)");
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden (NFR10)");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden (NFR10)");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden (NFR10)");
  assert.equal(/\bsetTimeout\b/.test(source), false, "setTimeout forbidden (NFR10)");
  assert.equal(/\bsetInterval\b/.test(source), false, "setInterval forbidden (NFR10)");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden");
});
