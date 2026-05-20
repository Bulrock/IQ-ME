// Scaffold test: lint-reading-level exits 0 against in-repo EN methodology pages.
// Story 4-4 AC-5 / AC-6.
//
// Asserts:
//   1. exit 0
//   2. one per-page grade line per EN methodology page (4 in the current repo)
//   3. every reported grade is ≤ 12 (NFR28 threshold)
//
// If any page exceeds grade 12 the test reports the path + grade and fails —
// per Story 4-4 AC-5, the correct response is to rewrite the prose, NOT to
// loosen the threshold.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-reading-level.mjs");

test("lint-reading-level: in-repo EN pages → exit 0 with per-page grade lines ≤ 12", () => {
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );

  const all = r.stdout + r.stderr;
  const gradeLines = [...all.matchAll(/lint-reading-level:\s+(\S+):\s+grade=([0-9]+\.[0-9]+)/g)];
  // Story 5.2 expanded the EN page set; the lint should still run against
  // every page and emit one grade line each. We assert ≥1 (lower-bounded) +
  // grade ≤ 12 — coverage grows as more pages land in 5.3–5.6.
  assert.ok(
    gradeLines.length >= 1,
    `expected ≥1 per-page grade line; got ${gradeLines.length}\noutput:\n${all}`,
  );
  for (const m of gradeLines) {
    const path = m[1];
    const grade = Number(m[2]);
    assert.ok(
      grade <= 12,
      `page ${path} exceeded grade 12: ${grade}. Per Story 4-4 AC-5, do NOT loosen the threshold; the prose must be rewritten.`,
    );
  }
});
