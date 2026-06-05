// Story 8.7 — Acceptance tests for the finalized CHANGELOG.md + release.yml
// contributor-credit automation.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks (no markdown/YAML parser) — treat the files as text.
// RED until Story 8.7 finalizes the Keep-a-Changelog format + adds the
// contributor-credit step to release.yml.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const CHANGELOG = join(REPO_ROOT, "CHANGELOG.md");
const RELEASE = join(REPO_ROOT, ".github", "workflows", "release.yml");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

function releaseJob(text, job) {
  // Slice from the `  <job>:` declaration (or any step block keyed by name) to
  // the next 2-space-indented job key, or EOF.
  const lines = text.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^  ${job}:\\s*$`).test(l));
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: CHANGELOG.md Keep-a-Changelog format + Contributors + entries
// ─────────────────────────────────────────────────────────────────────

test("AC-1: CHANGELOG.md follows Keep-a-Changelog with [Unreleased] + the six categories", () => {
  const txt = read(CHANGELOG);
  assert.match(txt, /keep\s*a\s*changelog|keepachangelog\.com/i, "CHANGELOG.md must reference the Keep-a-Changelog convention");
  assert.match(txt, /^##\s*\[Unreleased\]/im, "CHANGELOG.md must have an ## [Unreleased] section (bracket form)");
  for (const cat of ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"]) {
    assert.match(txt, new RegExp(`^###\\s+${cat}\\b`, "im"), `CHANGELOG.md must use the "${cat}" change category`);
  }
});

test("AC-1: CHANGELOG.md has a Contributors subsection + the preserved 4.5 entry + a v0.1.0 entry", () => {
  const txt = read(CHANGELOG);
  assert.match(txt, /^###\s+Contributors/im, "CHANGELOG.md must list contributors by handle in a ### Contributors subsection");
  assert.match(txt, /@[A-Za-z0-9-]+/, "the Contributors subsection must list at least one real GitHub handle");
  assert.match(txt, /lint-license-provenance|LICENSES\.md/, "CHANGELOG.md must preserve the Story-4.5 lint-license-provenance entry");
  assert.match(txt, /v?0\.1\.0/, "CHANGELOG.md must record the v0.1.0 release entry");
});

// ─────────────────────────────────────────────────────────────────────
// AC-2 / AC-3: release.yml contributor-credit step (git log, no 3rd-party)
// ─────────────────────────────────────────────────────────────────────

test("AC-2: release.yml has a contributor-credit step using git log + a release-prep PR gate, inert in dev", () => {
  const txt = read(RELEASE);
  // The contributor-credit work appears (as a job or a named step).
  assert.match(txt, /contributor-credit|contributor[-\s]credit/i, "release.yml must declare a contributor-credit step/job");
  // Extracts handles from the commit log between tags.
  assert.match(txt, /git log/, "contributor-credit must extract contributors via `git log` between release tags");
  // Opens a release-prep PR for maintainer review (does not silently rewrite).
  assert.match(txt, /gh pr create|release-prep|peter-evans\/create-pull-request|create-pull-request/i, "contributor-credit must open a release-prep PR for maintainer review");
  // Gated inert behind a launch repo var (no live run in dev).
  assert.match(txt, /vars\.IQME_LIVE/i, "the contributor-credit live run must be gated behind a vars.IQME_LIVE* repo var (inert in dev)");
});

test("AC-3: contributor-credit uses no third-party API / no social-graph (FR53)", () => {
  const txt = read(RELEASE);
  // No third-party contributor/social-graph API hosts in the workflow.
  // Anchor to real third-party API/script signatures (a host or script ref) —
  // NOT the bare word "analytics", which legitimately appears in FR53-disclaiming
  // comments ("no analytics, no social-graph").
  assert.doesNotMatch(
    txt,
    /all-contributors\.|contrib\.rocks|api\.github\.com\/search\/users|google-analytics|analytics\.(js|com|google)|plausible\.io|mixpanel|segment\.(io|com)|socialgraph\./i,
    "contributor-credit must not call a third-party contributor/analytics/social-graph API (FR53) — git log + Actions context only",
  );
});
