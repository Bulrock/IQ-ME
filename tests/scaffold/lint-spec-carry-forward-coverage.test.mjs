// Story bridge-6-7-3 — Acceptance tests for Phase A: restore Carry-forward
// lessons injection in story-create flow + lint enforcement.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one Acceptance Criterion in spec
// _bmad-output/implementation-artifacts/stories/bridge-6-7-3-restore-carry-forward-lessons.md.
//
// Run: `node --test tests/scaffold/lint-spec-carry-forward-coverage.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const LINT_TOOL = join(REPO_ROOT, "tools", "lint-spec-carry-forward.mjs");
const TEMPLATE_PATH = join(
  REPO_ROOT,
  ".claude",
  "skills",
  "bmad-create-story",
  "template.md",
);
const SKILL_PATH = join(
  REPO_ROOT,
  ".claude",
  "skills",
  "bmad-create-story",
  "SKILL.md",
);
const MAKEFILE_PATH = join(REPO_ROOT, "Makefile");

function runLint(args, cwd) {
  return spawnSync("node", [LINT_TOOL, ...args], {
    cwd: cwd ?? REPO_ROOT,
    encoding: "utf8",
  });
}

// ─── AC-1 diagnostic: addressed via Self-Review prose (no automated test). ─

// ─── AC-2 — injection restored: template + skill enforce section. ─────────

test("AC-2: bmad-create-story template.md contains '### Carry-forward lessons' heading", () => {
  assert.ok(
    existsSync(TEMPLATE_PATH),
    `template not found at ${TEMPLATE_PATH}`,
  );
  const body = readFileSync(TEMPLATE_PATH, "utf8");
  assert.match(
    body,
    /^### Carry-forward lessons\b/m,
    "template.md must include '### Carry-forward lessons' heading so every new spec carries the section",
  );
});

test("AC-2: bmad-create-story SKILL.md references Carry-forward lessons + tds memory query", () => {
  assert.ok(existsSync(SKILL_PATH), `SKILL.md not found at ${SKILL_PATH}`);
  const body = readFileSync(SKILL_PATH, "utf8");
  assert.match(
    body,
    /Carry-forward lessons/i,
    "SKILL.md must instruct author to populate '### Carry-forward lessons' section",
  );
  assert.match(
    body,
    /tds memory query/i,
    "SKILL.md must reference `tds memory query` as the source for populating the section",
  );
});

// ─── AC-3 — lint coverage. ─────────────────────────────────────────────────

test("AC-3: lint-spec-carry-forward.mjs exists and is executable as a node script", () => {
  assert.ok(
    existsSync(LINT_TOOL),
    `lint tool missing at ${LINT_TOOL}`,
  );
  // Smoke: --help or default invocation must not crash with syntax error.
  const r = spawnSync("node", ["--check", LINT_TOOL], { encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `lint-spec-carry-forward.mjs failed node --check (syntax error): ${r.stderr}`,
  );
});

test("AC-3: lint passes against a fixture spec WITH populated Carry-forward section", () => {
  const tmp = mkdtempSync(join(tmpdir(), "lint-cf-ok-"));
  const storiesDir = join(tmp, "stories");
  mkdirSync(storiesDir, { recursive: true });
  const spec = [
    "# Story sample-1: sample",
    "",
    "Status: ready-for-dev",
    "",
    "## Story",
    "",
    "As a dev, I want X, so that Y.",
    "",
    "## Dev Notes",
    "",
    "### Carry-forward lessons",
    "",
    "- lesson-2026-05-19-001: re-register integrity after frozen-test edits.",
    "",
  ].join("\n");
  writeFileSync(join(storiesDir, "sample-1.md"), spec);

  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.equal(
    r.status,
    0,
    `lint failed on populated spec — should pass. stderr=${r.stderr} stdout=${r.stdout}`,
  );
});

test("AC-3: lint passes when section present with explicit zero-hits sentinel", () => {
  const tmp = mkdtempSync(join(tmpdir(), "lint-cf-sentinel-"));
  const storiesDir = join(tmp, "stories");
  mkdirSync(storiesDir, { recursive: true });
  const spec = [
    "# Story sample-2: sample",
    "",
    "Status: ready-for-dev",
    "",
    "## Story",
    "",
    "As a dev, I want X, so that Y.",
    "",
    "## Dev Notes",
    "",
    "### Carry-forward lessons",
    "",
    "_(no relevant lessons — tds memory query returned zero hits)_",
    "",
  ].join("\n");
  writeFileSync(join(storiesDir, "sample-2.md"), spec);

  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.equal(
    r.status,
    0,
    `lint failed on sentinel-only spec — should pass. stderr=${r.stderr} stdout=${r.stdout}`,
  );
});

test("AC-3: lint flags spec MISSING the Carry-forward heading", () => {
  const tmp = mkdtempSync(join(tmpdir(), "lint-cf-fail-"));
  const storiesDir = join(tmp, "stories");
  mkdirSync(storiesDir, { recursive: true });
  const spec = [
    "# Story sample-3: sample",
    "",
    "Status: ready-for-dev",
    "",
    "## Story",
    "",
    "As a dev, I want X, so that Y.",
    "",
    "## Dev Notes",
    "",
    "- Some notes.",
    "",
  ].join("\n");
  writeFileSync(join(storiesDir, "sample-3.md"), spec);

  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.notEqual(
    r.status,
    0,
    `lint passed on spec missing the section — should have failed. stdout=${r.stdout}`,
  );
  assert.match(
    r.stdout + r.stderr,
    /Carry-forward/i,
    "lint failure output must mention 'Carry-forward'",
  );
});

test("AC-3: lint flags spec where Carry-forward section is empty (heading-only)", () => {
  const tmp = mkdtempSync(join(tmpdir(), "lint-cf-empty-"));
  const storiesDir = join(tmp, "stories");
  mkdirSync(storiesDir, { recursive: true });
  const spec = [
    "# Story sample-4: sample",
    "",
    "Status: ready-for-dev",
    "",
    "## Story",
    "",
    "As a dev, I want X, so that Y.",
    "",
    "## Dev Notes",
    "",
    "### Carry-forward lessons",
    "",
    "## Next Section",
    "",
  ].join("\n");
  writeFileSync(join(storiesDir, "sample-4.md"), spec);

  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.notEqual(
    r.status,
    0,
    `lint passed on spec with empty section — should have failed. stdout=${r.stdout}`,
  );
});

test("AC-3: Makefile `lint` recipe invokes lint-spec-carry-forward.mjs", () => {
  const mk = readFileSync(MAKEFILE_PATH, "utf8");
  assert.match(
    mk,
    /node tools\/lint-spec-carry-forward\.mjs/,
    "Makefile `lint` target must invoke `node tools/lint-spec-carry-forward.mjs`",
  );
});
