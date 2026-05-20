// tests/contract/item-difficulty-bands-contract.spec.mjs
//
// Story 6.2 AC-2 — contract test asserting the v1 stub-pool tercile
// partition holds (5/6/5, documented cutoffs, tie-rule). Surfaces visibly
// when the pool grows in Story 9a-2.
//
// Reads the live src/items/item-difficulty-bands.json (produced by
// `make build-difficulty-bands`) so the contract pins the on-disk artefact
// the SPA actually consumes, not just the in-memory function output.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const POOL_PATH = resolve(REPO_ROOT, "src", "items", "item-parameters.json");
const BANDS_PATH = resolve(REPO_ROOT, "src", "items", "item-difficulty-bands.json");

function readJsonOrFail(p, label) {
  if (!existsSync(p)) {
    assert.fail(`${label} must exist at ${p} — run \`make build-difficulty-bands\` to regenerate`);
  }
  return JSON.parse(readFileSync(p, "utf8"));
}

test("AC-2.a: item-difficulty-bands.json is present and parses (regenerable; ensure `make build-difficulty-bands` ran)", () => {
  const bands = readJsonOrFail(BANDS_PATH, "item-difficulty-bands.json");
  assert.equal(bands.schemaVersion, "1.0", "schemaVersion must be v1.0");
  assert.equal(typeof bands.cutoffs, "object", "cutoffs block must exist");
  assert.equal(Array.isArray(bands.items), true, "items[] must be an array");
});

test("AC-2.b: v1 16-item stub pool partitions into 5 easy / 6 medium / 5 hard", () => {
  const bands = readJsonOrFail(BANDS_PATH, "item-difficulty-bands.json");
  const counts = bands.items.reduce((acc, it) => {
    acc[it.band] = (acc[it.band] || 0) + 1;
    return acc;
  }, {});
  assert.equal(counts.easy, 5, "v1 pool yields 5 easy items");
  assert.equal(counts.medium, 6, "v1 pool yields 6 medium items (floor(16/3)=5 ea side, remainder=1 lands in middle)");
  assert.equal(counts.hard, 5, "v1 pool yields 5 hard items");
});

test("AC-2.c: documented cutoffs match (easyMax=-1.0, mediumMax=0.5)", () => {
  const bands = readJsonOrFail(BANDS_PATH, "item-difficulty-bands.json");
  assert.equal(bands.cutoffs.easyMax, -1.0, "easyMax pinned to b of last easy item (stub-005)");
  assert.equal(bands.cutoffs.mediumMax, 0.5, "mediumMax pinned to b of last medium item (stub-011)");
});

test("AC-2.d: every item-parameters.json id has a matching band entry", () => {
  const pool = readJsonOrFail(POOL_PATH, "item-parameters.json");
  const bands = readJsonOrFail(BANDS_PATH, "item-difficulty-bands.json");
  const poolIds = new Set(pool.items.map((it) => it.id));
  const bandIds = new Set(bands.items.map((it) => it.id));
  assert.equal(poolIds.size, bandIds.size, "pool and bands must enumerate the same item set");
  for (const id of poolIds) {
    assert.equal(bandIds.has(id), true, `band assignment missing for ${id} — regenerate via \`make build-difficulty-bands\``);
  }
});

test("AC-2.e: tie-on-cutoff rule documented — b == easyMax goes to 'easy', b == mediumMax goes to 'medium'", () => {
  const pool = readJsonOrFail(POOL_PATH, "item-parameters.json");
  const bands = readJsonOrFail(BANDS_PATH, "item-difficulty-bands.json");
  const bandOf = (id) => bands.items.find((it) => it.id === id)?.band;
  const itemAt = (b) => pool.items.find((it) => it.b === b);
  const lastEasy = itemAt(bands.cutoffs.easyMax);
  const lastMedium = itemAt(bands.cutoffs.mediumMax);
  assert.ok(lastEasy, `pool must contain item with b == easyMax (${bands.cutoffs.easyMax})`);
  assert.ok(lastMedium, `pool must contain item with b == mediumMax (${bands.cutoffs.mediumMax})`);
  assert.equal(bandOf(lastEasy.id), "easy", "item at easyMax cutoff stays in easy bucket (≤ semantics)");
  assert.equal(bandOf(lastMedium.id), "medium", "item at mediumMax cutoff stays in medium bucket");
});
