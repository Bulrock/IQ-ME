// Story 8.6 — Acceptance tests for the full CONTRIBUTING.md + docs/required-ci-checks.md.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks (no markdown parser) — treat the docs as text and
// assert presence of the required sections, cross-links, and the real CI job
// enumeration. RED until Story 8.6 replaces the Epic-1 slim CONTRIBUTING stub
// and creates docs/required-ci-checks.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const CONTRIBUTING = join(REPO_ROOT, "CONTRIBUTING.md");
const REQUIRED_CI = join(REPO_ROOT, "docs", "required-ci-checks.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: full CONTRIBUTING.md has the required workflow sections
// ─────────────────────────────────────────────────────────────────────

test("AC-1: CONTRIBUTING.md documents fork/branch/PR + reviewer-of-record + translation + corpus-change workflow", () => {
  const txt = read(CONTRIBUTING);
  // Fork / branch / pull-request workflow.
  assert.match(txt, /\bfork\b/i, "CONTRIBUTING.md must explain how to fork");
  assert.match(txt, /\bbranch\b/i, "CONTRIBUTING.md must explain how to branch");
  assert.match(txt, /pull request|\bPR\b/i, "CONTRIBUTING.md must explain how to open a PR");
  // Dual-approval (FR49) for non-EN content-key changes.
  assert.match(txt, /dual[-\s]?approval/i, "CONTRIBUTING.md must document the dual-approval requirement (FR49)");
  // Per-language reviewer-of-record discipline.
  assert.match(txt, /reviewer[-\s]of[-\s]record/i, "CONTRIBUTING.md must document the per-language reviewer-of-record discipline");
  // How to propose translation improvements.
  assert.match(txt, /translat/i, "CONTRIBUTING.md must explain how to propose translation improvements");
  // How to propose methodology corpus changes (claims-manifest coupling).
  assert.match(txt, /claims[-\s]?manifest|methodology corpus/i, "CONTRIBUTING.md must explain how to propose methodology corpus changes (claims-manifest coupling)");
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: CONTRIBUTING.md cross-links the four targets
// ─────────────────────────────────────────────────────────────────────

test("AC-3: CONTRIBUTING.md cross-links required-ci-checks + branch-protection-config + scheduled-yml-failure-routing + CODEOWNERS", () => {
  const txt = read(CONTRIBUTING);
  assert.match(txt, /docs\/required-ci-checks\.md/, "CONTRIBUTING.md must link docs/required-ci-checks.md at the CI-checks step");
  assert.match(txt, /docs\/branch-protection-config\.md/, "CONTRIBUTING.md must link docs/branch-protection-config.md at the dual-approval step (Story 7.8)");
  assert.match(txt, /docs\/scheduled-yml-failure-routing\.md/, "CONTRIBUTING.md must link docs/scheduled-yml-failure-routing.md (Story 8.3)");
  assert.match(txt, /CODEOWNERS/, "CONTRIBUTING.md must link .github/CODEOWNERS (reviewer-of-record)");
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: docs/required-ci-checks.md enumerates the real CI job set + sources
// ─────────────────────────────────────────────────────────────────────

test("AC-2: docs/required-ci-checks.md enumerates the real pr-checks + scheduled jobs by name with source links", () => {
  const txt = read(REQUIRED_CI);
  // A representative set of REAL pr-checks.yml job names (incl. the Story-8.5
  // additions) — not a glob (lesson-2026-06-03-001). If any is renamed in the
  // workflow this must be updated in lockstep.
  for (const job of [
    "trust-verification-full",
    "byte-stable-build",
    "golden-vector-parity",
    "network-trace",
    "lint-trust-artifacts",
    "axe-core-pa11y",
    "lighthouse",
  ]) {
    assert.match(txt, new RegExp(job.replace(/-/g, "\\-")), `required-ci-checks.md must enumerate the "${job}" pr-checks job by name`);
  }
  // The 4 scheduled.yml health-check jobs (Story 8.3).
  for (const job of [
    "mirror-parity-check",
    "internet-archive-snapshot-health",
    "software-heritage-snapshot-health",
    "zenodo-doi-resolution",
  ]) {
    assert.match(txt, new RegExp(job.replace(/-/g, "\\-")), `required-ci-checks.md must enumerate the scheduled "${job}" job by name`);
  }
  // Each entry links a real source under tools/ or tests/.
  assert.match(txt, /tools\/lint-[a-z-]+\.mjs/, "required-ci-checks.md must link tools/lint-*.mjs sources");
  assert.match(txt, /tests\/[a-z0-9/-]+\.(spec|test)\.mjs/, "required-ci-checks.md must link tests/**/*.spec.mjs (or .test.mjs) sources");
});
