#!/usr/bin/env node
// tools/compute-difficulty-bands.mjs — Story 6.2.
//
// Reads src/items/item-parameters.json, partitions items[] into three
// difficulty bands by IRT b-parameter terciles (low-third → "easy",
// mid-third → "medium", top-third → "hard"), and emits a deterministic
// mapping to src/items/item-difficulty-bands.json.
//
// Tercile rule (16-item v1 pool):
//   floor(N/3) = 5 → 5/6/5 split (lower / middle / upper).
//   Remainder lands in the middle bucket (skews capacity toward "medium").
//   Generalises: lower = floor(N/3); upper = floor(N/3); middle = N - 2*floor(N/3).
//
// Tie-on-cutoff rule:
//   easyMax = b of the LAST item in the lower bucket (after sorting ascending).
//   mediumMax = b of the LAST item in the middle bucket.
//   Any item with b == easyMax goes to "easy"; b == mediumMax goes to "medium".
//   Equivalent to the natural-reading "easy items are those with b ≤ easyMax".
//
// Deterministic output:
//   - Items in output are sorted by id ascending (stable across pool reorderings).
//   - JSON keys are written in a fixed order.
//   - Numbers are not re-formatted; the b values flow straight through.
//   - Re-running with unchanged input produces byte-identical output.
//
// Regenerate via: make build-difficulty-bands
//
// Stdlib-only (NFR33). ESM.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "node:process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const INPUT_PATH = resolve(REPO_ROOT, "src", "items", "item-parameters.json");
// IQME_DIFFICULTY_BANDS_OUT relocates the output file (Story bridge-9a-1 —
// concurrency isolation). Lets a test redirect `make build` to a per-test
// tmpdir so it never rewrites the shared src/items artefact that
// item-difficulty-bands-contract.spec.mjs reads concurrently.
const OUTPUT_PATH = env.IQME_DIFFICULTY_BANDS_OUT
  ? resolve(REPO_ROOT, env.IQME_DIFFICULTY_BANDS_OUT)
  : resolve(REPO_ROOT, "src", "items", "item-difficulty-bands.json");
const SCHEMA_VERSION = "1.0";

export function computeBands(pool) {
  if (!pool || typeof pool !== "object" || !Array.isArray(pool.items)) {
    throw new Error("compute-difficulty-bands: input pool must be an object with items[] array");
  }
  const N = pool.items.length;
  if (N < 3) {
    throw new Error(`compute-difficulty-bands: items[] must have at least 3 entries (got ${N})`);
  }
  for (const it of pool.items) {
    if (!it || typeof it.id !== "string" || typeof it.b !== "number" || !Number.isFinite(it.b)) {
      throw new Error(`compute-difficulty-bands: every item needs string id + finite numeric b (offending: ${JSON.stringify(it)})`);
    }
  }
  const sorted = pool.items.slice().sort((a, b) => a.b - b.b);
  const lowerSize = Math.floor(N / 3);
  const upperSize = Math.floor(N / 3);
  const easyMax = sorted[lowerSize - 1].b;
  const mediumMax = sorted[N - upperSize - 1].b;
  const bandFor = (b) => (b <= easyMax ? "easy" : b <= mediumMax ? "medium" : "hard");
  const items = pool.items
    .map((it) => ({ id: it.id, band: bandFor(it.b) }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    schemaVersion: SCHEMA_VERSION,
    cutoffs: { easyMax, mediumMax },
    items,
  };
}

export function serializeBands(bands) {
  return JSON.stringify(bands, null, 2) + "\n";
}

function main() {
  const raw = readFileSync(INPUT_PATH, "utf8");
  const pool = JSON.parse(raw);
  const bands = computeBands(pool);
  writeFileSync(OUTPUT_PATH, serializeBands(bands));
  process.stdout.write(`compute-difficulty-bands: wrote ${OUTPUT_PATH} (easyMax=${bands.cutoffs.easyMax}, mediumMax=${bands.cutoffs.mediumMax}, ${bands.items.length} items)\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
