// tests/contract/reveal-stage-timings.spec.mjs
//
// Story 6.1 AC-3 — contract for src/assessment/reveal-stage-timings.json.
//
// Locks the schema BEFORE engineer impl writes the file:
//   { "stages": { "<stage>": { "dwellMs": <positive finite number> } } }
//
// All six ADR-3-1 stages must be present. Dispatcher must consume this file
// (verified indirectly: the file is importable as JSON).
//
// This spec is RED today because src/assessment/reveal-stage-timings.json
// does not yet exist (engineer Task 3).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TIMINGS_PATH = resolve(__dirname, "../../src/assessment/reveal-stage-timings.json");

const ADR_3_1_STAGES = [
  "anchor",
  "band",
  "interval",
  "context",
  "tail-scene",
  "methodology-handoff",
];

test("AC-3.1: reveal-stage-timings.json exists at the canonical path", () => {
  assert.equal(
    existsSync(TIMINGS_PATH),
    true,
    `expected ${TIMINGS_PATH} to exist; engineer Task 3 must create it`,
  );
});

test("AC-3.2: file parses as JSON with a top-level `stages` object", () => {
  const raw = readFileSync(TIMINGS_PATH, "utf8");
  let parsed;
  assert.doesNotThrow(() => { parsed = JSON.parse(raw); }, "must parse as JSON");
  assert.ok(parsed && typeof parsed === "object", "top-level must be an object");
  assert.ok(parsed.stages && typeof parsed.stages === "object", "must have `stages` object");
});

test("AC-3.3: all six ADR-3-1 stages are present in stages map", () => {
  const parsed = JSON.parse(readFileSync(TIMINGS_PATH, "utf8"));
  const keys = Object.keys(parsed.stages).sort();
  const expected = [...ADR_3_1_STAGES].sort();
  assert.deepEqual(
    keys,
    expected,
    `stages keys must equal ADR-3-1 enumeration (no extras, no missing); got ${JSON.stringify(keys)}`,
  );
});

test("AC-3.4: every stage entry has `dwellMs` as a positive finite number", () => {
  const parsed = JSON.parse(readFileSync(TIMINGS_PATH, "utf8"));
  for (const stage of ADR_3_1_STAGES) {
    const entry = parsed.stages[stage];
    assert.ok(entry && typeof entry === "object", `stages[${stage}] must be an object`);
    assert.equal(
      typeof entry.dwellMs,
      "number",
      `stages[${stage}].dwellMs must be a number; got ${typeof entry.dwellMs}`,
    );
    assert.ok(
      Number.isFinite(entry.dwellMs),
      `stages[${stage}].dwellMs must be finite; got ${entry.dwellMs}`,
    );
    assert.ok(
      entry.dwellMs > 0,
      `stages[${stage}].dwellMs must be > 0; got ${entry.dwellMs}`,
    );
  }
});

test("AC-3.5: dispatcher source references the timings file (engineer must wire it)", () => {
  const dispatcherPath = resolve(__dirname, "../../src/assessment/reveal-stage.js");
  const src = readFileSync(dispatcherPath, "utf8");
  assert.match(
    src,
    /reveal-stage-timings\.json/,
    "src/assessment/reveal-stage.js must reference reveal-stage-timings.json (import or fetch) — AC-3 wiring requirement",
  );
});
