// tests/scaffold/story-3-8-evidence-scaffold.test.mjs
//
// Story 3.8 (scaffold-only posture) — asserts the documentation scaffold
// the maintainer needs to actually run the hallway test exists at the
// committed paths. The hallway test ITSELF is run by the maintainer with
// outside-team participants AFTER epic-3 ships; this test confirms only
// the scaffolding (templates + protocol + local-build instructions).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");

const SCAFFOLD_FILES = [
  "_evidence/.gitkeep",
  "_evidence/3.8-hallway-test-template.md",
  "_evidence/3.8-hallway-test-summary-template.md",
  "_evidence/3.8-recruitment-and-protocol.md",
  "docs/local-build-instructions.md",
];

test("Story 3.8 scaffold: all 5 evidence + protocol + instructions files exist", () => {
  for (const rel of SCAFFOLD_FILES) {
    const full = resolve(REPO_ROOT, rel);
    assert.ok(existsSync(full), `expected scaffold file at ${rel}`);
  }
});

test("Story 3.8 scaffold: per-user template contains the 4 verbatim hypothesis questions", () => {
  const body = readFileSync(resolve(REPO_ROOT, "_evidence/3.8-hallway-test-template.md"), "utf8");
  assert.ok(/Q1 — What did your score mean\?/.test(body), "Q1 must be present verbatim");
  assert.ok(/Q2 — What did you learn by clicking through to methodology\?/.test(body), "Q2 must be present verbatim");
  assert.ok(/Q3 — Would you trust this site enough to share it with a friend\?/.test(body), "Q3 must be present verbatim");
  assert.ok(/Q4 — Did anything feel off\?/.test(body), "Q4 must be present verbatim");
});

test("Story 3.8 scaffold: recruitment protocol documents the ≥3-of-N go/no-go threshold", () => {
  const body = readFileSync(resolve(REPO_ROOT, "_evidence/3.8-recruitment-and-protocol.md"), "utf8");
  assert.ok(/≥3 of N|3 of N/.test(body), "go/no-go threshold (≥3 of N) must be documented");
  assert.ok(/GO|NO-GO|GO-WITH-BRIDGE/.test(body), "go/no-go decision keywords must be documented");
});

test("Story 3.8 scaffold: aggregate summary template documents Epic-4-gate link", () => {
  const body = readFileSync(resolve(REPO_ROOT, "_evidence/3.8-hallway-test-summary-template.md"), "utf8");
  assert.ok(/Epic 4|Bridge Plan/.test(body), "aggregate summary must reference Epic 4 gate or Bridge Plan");
});

test("Story 3.8 scaffold: local-build instructions document corpus-v0.1.0 tag step", () => {
  const body = readFileSync(resolve(REPO_ROOT, "docs/local-build-instructions.md"), "utf8");
  assert.ok(/corpus-v0\.1\.0/.test(body), "local-build doc must document the corpus-v0.1.0 tag step (Story 3.8 initial-tag discipline)");
  assert.ok(/make build-methodology|make dev/.test(body), "local-build doc must document the one-command build");
});
