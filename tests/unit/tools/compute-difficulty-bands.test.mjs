// tests/unit/tools/compute-difficulty-bands.test.mjs
//
// Story 6.2 AC-9 — unit tests for tools/compute-difficulty-bands.mjs.
//
// Mirror-rule path per architecture.md §608: tests for tools/<name>.mjs
// live at tests/unit/tools/<name>.test.mjs.
//
// computeBands() is a PURE function over input objects — no FS access.
// Tests pass objects in-memory and assert on the returned shape.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { computeBands, serializeBands } from "../../../tools/compute-difficulty-bands.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const POOL_PATH = resolve(REPO_ROOT, "src", "items", "item-parameters.json");

function v1Pool() {
  return JSON.parse(readFileSync(POOL_PATH, "utf8"));
}

test("AC-9.a: v1 16-item stub pool produces the documented 5/6/5 split", () => {
  const bands = computeBands(v1Pool());
  const counts = bands.items.reduce((acc, it) => {
    acc[it.band] = (acc[it.band] || 0) + 1;
    return acc;
  }, {});
  assert.equal(counts.easy, 5, "easy bucket must hold 5 items");
  assert.equal(counts.medium, 6, "medium bucket must hold 6 items (floor(16/3)=5 each side, remainder in middle)");
  assert.equal(counts.hard, 5, "hard bucket must hold 5 items");
});

test("AC-9.a: cutoffs match documented v1 values (easyMax=-1.0, mediumMax=0.5)", () => {
  const bands = computeBands(v1Pool());
  assert.equal(bands.cutoffs.easyMax, -1.0, "easyMax must be b of the last easy item (stub-005 b=-1.0)");
  assert.equal(bands.cutoffs.mediumMax, 0.5, "mediumMax must be b of the last medium item (stub-011 b=0.5)");
});

test("AC-9.b: tie-on-cutoff goes to the LOWER band (semantic ≤ rule)", () => {
  const synth = {
    items: [
      { id: "a", b: -2.0 }, { id: "b", b: -1.5 }, { id: "c", b: -1.0 },
      { id: "d", b: -1.0 }, { id: "e", b: 0.0 }, { id: "f", b: 0.5 },
      { id: "g", b: 0.5 }, { id: "h", b: 1.0 }, { id: "i", b: 2.0 },
    ],
  };
  // N=9 → floor(9/3)=3. lower bucket: 3 items by ascending b; upper bucket: 3 items.
  // sorted b: [-2, -1.5, -1, -1, 0, 0.5, 0.5, 1, 2]
  // lower bucket indices [0,1,2] → b=[-2,-1.5,-1]; easyMax = -1
  // upper bucket indices [6,7,8] → b=[0.5,1,2]; mediumMax = sorted[N-upperSize-1] = sorted[5] = 0.5
  // So b == easyMax (-1) → easy; b == mediumMax (0.5) → medium.
  const bands = computeBands(synth);
  assert.equal(bands.cutoffs.easyMax, -1, "easyMax must equal -1 (sorted[2].b)");
  assert.equal(bands.cutoffs.mediumMax, 0.5, "mediumMax must equal 0.5 (sorted[5].b)");
  const bandOf = (id) => bands.items.find((it) => it.id === id).band;
  assert.equal(bandOf("c"), "easy", "b=-1 ties easyMax → lower band (easy)");
  assert.equal(bandOf("d"), "easy", "b=-1 duplicate also ties easyMax → easy");
  assert.equal(bandOf("e"), "medium", "b=0 between cutoffs → medium");
  assert.equal(bandOf("f"), "medium", "b=0.5 ties mediumMax → lower band (medium)");
  assert.equal(bandOf("g"), "medium", "b=0.5 duplicate also ties mediumMax → medium");
  assert.equal(bandOf("h"), "hard", "b=1.0 > mediumMax → hard");
});

test("AC-9.c: deterministic output — same input produces byte-identical serialization", () => {
  const a = serializeBands(computeBands(v1Pool()));
  const b = serializeBands(computeBands(v1Pool()));
  assert.equal(a, b, "compute+serialize must be byte-stable across runs");
});

test("AC-9.c: items are sorted by id ascending in output (stable across input reorderings)", () => {
  const pool = v1Pool();
  const shuffled = { ...pool, items: pool.items.slice().reverse() };
  const original = serializeBands(computeBands(pool));
  const reordered = serializeBands(computeBands(shuffled));
  assert.equal(original, reordered, "input order must not affect output bytes — output items[] sorted by id");
});

test("AC-9.d: malformed input (missing b) throws a clear error", () => {
  assert.throws(
    () => computeBands({ items: [{ id: "x" }, { id: "y", b: 0 }, { id: "z", b: 1 }] }),
    /finite numeric b/,
    "missing b should throw with mention of the b-field requirement",
  );
  assert.throws(
    () => computeBands({ items: [{ id: "x", b: NaN }, { id: "y", b: 0 }, { id: "z", b: 1 }] }),
    /finite numeric b/,
    "NaN b should throw — Number.isFinite catches it",
  );
  assert.throws(
    () => computeBands({ items: [] }),
    /at least 3 entries/,
    "empty items[] should throw",
  );
  assert.throws(
    () => computeBands(null),
    /items\[\] array/,
    "null pool should throw",
  );
});
