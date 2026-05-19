// tests/unit/item-selection.test.mjs
//
// Story 3.4 AC-10.3 / 10.3b / 10.3c / 10.8 — `src/assessment/item-selection.js`
// Fisher-Yates subset + augmentation assignment (FR7 contract).
//
// Pattern follows tests/unit/landing-scene.test.mjs (Story 3.3):
// pure-module SUT (no DOM/window globals needed); wrap dynamic import in
// try/catch so red-phase failure surfaces as a readable assertion.
//
// Node 22 native node:test + node:assert/strict; no third-party deps.
//
// AC-2 contract (observable):
//   - Named export: selectSession(pool, seed128, sessionSize) →
//       { items: <itemId[]>, augmentations: <augmentationCode[]> }.
//   - v1 stub-pool case (pool.length === sessionSize === 16):
//       items[] is a deterministic permutation of the pool item ids;
//       augmentations[i] ∈ ["none", "rot90", "rot180", "rot270", "flip-h", "flip-v"];
//       length === sessionSize === 16.
//   - Same seed → byte-identical { items, augmentations } (AC-10.3 / 10.3c).
//   - Different seed → ≥75% of positions differ in items[] (AC-10.3; tolerance
//     accounts for accidental fixed points in two independent permutations).
//   - No forbidden globals + no default export (AC-10.8).
//
// Avoids over-pinning Fisher-Yates direction: tests assert "same seed → same
// output" without prescribing a specific permutation (spec implementation
// note 5 calls out the backward-iteration convention, but AC-2 only requires
// reproducibility, not a particular ordering).

import { test } from "node:test";
import assert from "node:assert/strict";

// ── Dynamic-import SUT ───────────────────────────────────────────────────

let selection;
let importError = null;
try {
  selection = await import("../../src/assessment/item-selection.js");
} catch (err) {
  importError = err;
}

function fixedSeed(byte = 0x42) {
  const a = new Uint8Array(16);
  a.fill(byte);
  return a;
}

const AUG_CODES = ["none", "rot90", "rot180", "rot270", "flip-h", "flip-v"];

function makePool() {
  // 16-item synthetic pool matching the shape of the production stub
  // (Story 3.4 AC-0 + AC-10.5 schema). Tests are pool-shape-agnostic: only
  // `id` is observed; the rest is shape ballast for impl that might consult it.
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
  return items;
}

// ─── AC-10.3: permutation determinism (same seed → identical) ────────────

test("AC-10.3: selectSession(pool, seed, 16) returns 16 items in a deterministic permutation", () => {
  assert.equal(importError, null, `item-selection.js failed to import: ${importError?.message}`);
  assert.equal(typeof selection.selectSession, "function");
  assert.equal(selection.default, undefined, "no default export allowed");

  const pool = makePool();
  const r1 = selection.selectSession(pool, fixedSeed(), 16);
  const r2 = selection.selectSession(pool, fixedSeed(), 16);
  assert.ok(Array.isArray(r1.items), "result.items must be an array");
  assert.equal(r1.items.length, 16, "v1: items length must equal sessionSize=16");
  // Deterministic: same seed → identical permutation.
  assert.deepEqual(r1.items, r2.items, "same seed must produce identical items[] permutation");
  // Permutation (not slice): contains all 16 pool ids, no repeats.
  const sorted = [...r1.items].sort();
  const expected = pool.map((it) => it.id).sort();
  assert.deepEqual(sorted, expected, "items[] must be a permutation of pool ids (no drops/dupes)");
});

// ─── AC-10.3 divergence: different seeds → ≥12/16 positions differ ───────

test("AC-10.3 (divergence): different seeds produce ≥12/16 differing positions in items[]", () => {
  assert.equal(importError, null);
  const pool = makePool();
  const seedA = fixedSeed(0x42);
  const seedB = fixedSeed(0x99);
  const rA = selection.selectSession(pool, seedA, 16);
  const rB = selection.selectSession(pool, seedB, 16);
  let diffs = 0;
  for (let i = 0; i < 16; i++) if (rA.items[i] !== rB.items[i]) diffs++;
  assert.ok(diffs >= 12, `expected ≥12 differing positions (75%), got ${diffs} (tolerance accounts for accidental fixed points)`);
});

// ─── AC-10.3b: augmentations length + code-set ───────────────────────────

test("AC-10.3b: augmentations[] has length 16, each value ∈ 6-code set", () => {
  assert.equal(importError, null);
  const r = selection.selectSession(makePool(), fixedSeed(), 16);
  assert.ok(Array.isArray(r.augmentations), "result.augmentations must be an array");
  assert.equal(r.augmentations.length, 16, "augmentations[] length must equal sessionSize=16");
  for (let i = 0; i < r.augmentations.length; i++) {
    assert.ok(
      AUG_CODES.includes(r.augmentations[i]),
      `augmentations[${i}] = ${JSON.stringify(r.augmentations[i])} must be one of ${JSON.stringify(AUG_CODES)}`,
    );
  }
});

// ─── AC-10.3c: augmentation determinism (same seed → identical) ──────────

test("AC-10.3c: same seed produces identical augmentations[]", () => {
  assert.equal(importError, null);
  const pool = makePool();
  const r1 = selection.selectSession(pool, fixedSeed(), 16);
  const r2 = selection.selectSession(pool, fixedSeed(), 16);
  assert.deepEqual(r1.augmentations, r2.augmentations, "same seed must produce identical augmentations[]");
});

// ─── AC-10.8: source-grep forbidden globals + no default export ──────────

test("AC-10.8: item-selection.js source contains no forbidden globals or default export", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SRC = resolve(HERE, "..", "..", "src", "assessment", "item-selection.js");
  let source;
  try { source = readFileSync(SRC, "utf8"); }
  catch (err) { assert.fail(`item-selection.js source not readable: ${err.message}`); }
  assert.equal(/\bMath\.random\b/.test(source), false, "Math.random forbidden (NFR10)");
  assert.equal(/\bDate\.now\b/.test(source), false, "Date.now forbidden (NFR10)");
  assert.equal(/\blocalStorage\b/.test(source), false, "localStorage forbidden (NFR10)");
  assert.equal(/\bsessionStorage\b/.test(source), false, "sessionStorage forbidden (NFR10)");
  assert.equal(/\bconsole\.log\b/.test(source), false, "console.log forbidden (NFR10)");
  assert.equal(/^export\s+default\b/m.test(source), false, "default export forbidden (named exports only)");
});
