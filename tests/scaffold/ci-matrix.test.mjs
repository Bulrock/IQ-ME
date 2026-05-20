// Story 1.6 — Acceptance tests for .github/workflows/pr-checks.yml + release.yml + scheduled.yml.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one AC in spec
// _bmad-output/implementation-artifacts/stories/1-6-author-ci-matrix-yaml-with-full-future-lint-stub-jobs.md.
//
// Run: `node --test tests/scaffold/ci-matrix.test.mjs`
//
// Structural-only checks — no YAML parser dep (NFR33). We treat the
// workflow files as text and assert presence/proximity of expected lines.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const PR_CHECKS = join(REPO_ROOT, ".github", "workflows", "pr-checks.yml");
const RELEASE = join(REPO_ROOT, ".github", "workflows", "release.yml");
const SCHEDULED = join(REPO_ROOT, ".github", "workflows", "scheduled.yml");

const ALL_JOBS = [
  "lint-claims-manifest",
  "lint-trust-artifacts",
  "lint-no-role-alert",
  "lint-no-share",
  "lint-no-cookie-banner",
  "lint-no-analytics-script",
  "lint-no-external-font",
  "lint-no-localStorage-without-consent",
  "lint-cognitive-load-budget",
  "lint-frontmatter",
  "lint-glossary",
  "lint-reading-level",
  "lint-translation-parity",
  "lint-license-provenance",
  "lint-css-link-order",
  "lint-fr36-protection",
  "golden-vector-parity",
  "byte-stable-build",
  "network-trace",
  "viewport-overflow",
  "co-equal-triplet-computed-style",
  "co-equal-triplet-css-source",
  "cropping-fuzzer",
  "lighthouse",
  "axe-core-pa11y",
  "reveal-stage-event-ordering",
  "csp-violation-count",
  "state-shape-contract",
  // Story 4.8 — Epic-4 exit-criterion jobs.
  "lint-csp-source",
  "exit-criterion-spec",
];

const EPIC_1_ACTIVE = new Set([
  "lint-trust-artifacts",
  "lint-no-role-alert",
  "lint-no-share",
  "lint-no-cookie-banner",
  "lint-no-analytics-script",
  "lint-no-external-font",
  "lint-no-localStorage-without-consent",
  "lint-cognitive-load-budget",
  // network-trace becomes active in Story 1.7.
  "network-trace",
  // golden-vector-parity activated in Story 2.6b (full-set parity test).
  "golden-vector-parity",
  // byte-stable-build activated in Story 4.2 — runs `make test-byte-stable`.
  "byte-stable-build",
  // state-shape-contract: contract test runs every PR (Story 3.x — runs
  // `node --test tests/contract/state-shape.spec.mjs`; no `if: false`).
  "state-shape-contract",
  // lint-claims-manifest activated in Story 4.3 (strict-mode graduation).
  "lint-claims-manifest",
  // lint-frontmatter activated in Story 4.3 (corpus/schema.json subset validator).
  "lint-frontmatter",
  // lint-glossary activated in Story 4.4 (glossaryRefs structural validation +
  // Epic-5-deferred WARN until the per-locale glossary tree is authored).
  "lint-glossary",
  // lint-reading-level activated in Story 4.4 (EN Flesch-Kincaid ≤ 12 per NFR28;
  // RU/PL deferred to Epic 7).
  "lint-reading-level",
  // lint-license-provenance activated in Story 4.5 (Phase 1 LICENSES.md scope
  // coverage via docs/license-scope-map.md + Phase 2 NFR24 hash-drift discipline).
  "lint-license-provenance",
  // lint-translation-parity activated in Story 4.7 (Epic-4-close no-op stub;
  // Epic 7 / Story 7.5b flips on full per-locale parity coverage).
  "lint-translation-parity",
  // lint-csp-source activated in Story 4.8 — NFR7 source-level CSP-source check
  // (no inline <style>/<script>/style=/on*=). D10 <script nomodule> exempt.
  "lint-csp-source",
  // exit-criterion-spec activated in Story 4.8 — Epic-4 exit criterion proof:
  // every shipped lint demonstrated against both corpus AND SPA surfaces.
  "exit-criterion-spec",
  // lint-fr36-protection activated in Story 5.2 — FR36 protects the
  // "what this instrument does not measure" page from silent shortening.
  "lint-fr36-protection",
  // co-equal-triplet-computed-style activated in Story 6.1 — runtime computed-style
  // assertion graduates Story 3.5 CSS-source lint per Murat two-tier defense.
  "co-equal-triplet-computed-style",
  // reveal-stage-event-ordering activated in Story 6.1 — full 6-stage ADR-3-1
  // sequence event-ordering Playwright spec.
  "reveal-stage-event-ordering",
]);

function loadPrChecks() {
  assert.ok(existsSync(PR_CHECKS), `pr-checks.yml missing at ${PR_CHECKS}`);
  return readFileSync(PR_CHECKS, "utf8");
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: every job present (28 total)
// ─────────────────────────────────────────────────────────────────────

test("AC-1: pr-checks.yml exists and declares all 28 expected jobs", () => {
  const text = loadPrChecks();
  for (const job of ALL_JOBS) {
    // Each job declared as a top-level key under `jobs:` — two-space indent + `<job-id>:`
    const pattern = new RegExp(`^  ${job.replace(/-/g, "\\-")}:\\s*$`, "m");
    assert.match(
      text,
      pattern,
      `pr-checks.yml missing job declaration "  ${job}:" (must appear at jobs: top level with 2-space indent).`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: Epic-1-active jobs have NO `if: false` near them
// ─────────────────────────────────────────────────────────────────────

test("AC-2: Epic-1-active jobs do NOT carry `if: false`", () => {
  const text = loadPrChecks();
  const lines = text.split("\n");
  for (const job of EPIC_1_ACTIVE) {
    // Find the job's declaration line.
    const idx = lines.findIndex((l) => l.match(new RegExp(`^  ${job.replace(/-/g, "\\-")}:\\s*$`)));
    assert.notEqual(idx, -1, `job "${job}" declaration not found`);
    // Scan the next 15 lines (the job body) for an `if: false` (or `if: ${{ false }}`).
    const body = lines.slice(idx, Math.min(idx + 15, lines.length)).join("\n");
    assert.doesNotMatch(
      body,
      /^\s*if:\s*(false|\$\{\{\s*false\s*\}\})/m,
      `Epic-1-active job "${job}" must NOT carry "if: false". Body:\n${body}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: deferred jobs have `if: false` + Activates-in comment
// ─────────────────────────────────────────────────────────────────────

test("AC-3: deferred jobs carry `if: false` + `# Activates in (Epic <N>|Story <N>)` comment", () => {
  const text = loadPrChecks();
  const lines = text.split("\n");
  const deferred = ALL_JOBS.filter((j) => !EPIC_1_ACTIVE.has(j));
  for (const job of deferred) {
    const idx = lines.findIndex((l) => l.match(new RegExp(`^  ${job.replace(/-/g, "\\-")}:\\s*$`)));
    assert.notEqual(idx, -1, `deferred job "${job}" declaration not found`);
    const body = lines.slice(idx, Math.min(idx + 15, lines.length)).join("\n");
    assert.match(
      body,
      /^\s*if:\s*(false|\$\{\{\s*false\s*\}\})/m,
      `deferred job "${job}" must carry "if: false". Body:\n${body}`,
    );
    assert.match(
      body,
      /#\s*Activates in (Epic|Story)\s+\S+/i,
      `deferred job "${job}" must have "# Activates in Epic <N>" or "# Activates in Story <N>" comment. Body:\n${body}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-7: pr-checks.yml triggers on pull_request
// ─────────────────────────────────────────────────────────────────────

test("AC-7: pr-checks.yml has top-level `on: pull_request:`", () => {
  const text = loadPrChecks();
  // The `on:` key is at column 0; under it `pull_request:` must appear.
  assert.match(
    text,
    /^on:\s*\n(?:[ \t]+[^\n]*\n)*[ \t]+pull_request:/m,
    `pr-checks.yml must declare on: pull_request: at top level. Got:\n${text.slice(0, 400)}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-6: release.yml + scheduled.yml stubs exist
// ─────────────────────────────────────────────────────────────────────

test("AC-6: release.yml stub exists with `echo \"Activates in Epic 8\"`", () => {
  assert.ok(existsSync(RELEASE), `release.yml missing at ${RELEASE}`);
  const text = readFileSync(RELEASE, "utf8");
  assert.match(
    text,
    /Activates in Epic 8/,
    `release.yml must contain "Activates in Epic 8" placeholder.`,
  );
  // Inline-comment mention of app-v* + corpus-v* tag namespaces.
  assert.match(
    text,
    /app-v\*/,
    `release.yml must document app-v* tag namespace inline.`,
  );
  assert.match(
    text,
    /corpus-v\*/,
    `release.yml must document corpus-v* tag namespace inline.`,
  );
});

test("AC-6: scheduled.yml stub exists with `echo \"Activates in Epic 8\"`", () => {
  assert.ok(existsSync(SCHEDULED), `scheduled.yml missing at ${SCHEDULED}`);
  const text = readFileSync(SCHEDULED, "utf8");
  assert.match(
    text,
    /Activates in Epic 8/,
    `scheduled.yml must contain "Activates in Epic 8" placeholder.`,
  );
  // Inline-comment mention of scheduled-check failure → labeled GitHub Issue routing.
  assert.match(
    text,
    /labeled.*Issue|GitHub Issue/i,
    `scheduled.yml must document failure → labeled GitHub Issue routing inline.`,
  );
});
