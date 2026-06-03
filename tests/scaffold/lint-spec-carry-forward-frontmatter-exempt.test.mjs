// Story bridge-7-8-3 — Acceptance tests: replace the central LEGACY_EXEMPT
// list with a per-spec frontmatter flag `lint-exempt-carry-forward: true`.
//
// Authored in test-author phase (frozen during specialist impl).
// Maps to ACs in
// _bmad-output/implementation-artifacts/stories/bridge-7-8-3-replace-legacy-exempt-central.md
//
// Run: `node --test tests/scaffold/lint-spec-carry-forward-frontmatter-exempt.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const LINT_TOOL = join(REPO_ROOT, "tools", "lint-spec-carry-forward.mjs");

function runLint(args, cwd) {
  return spawnSync("node", [LINT_TOOL, ...args], {
    cwd: cwd ?? REPO_ROOT,
    encoding: "utf8",
  });
}

function withStory(name, body) {
  const tmp = mkdtempSync(join(tmpdir(), "lint-cf-fm-"));
  const storiesDir = join(tmp, "stories");
  mkdirSync(storiesDir, { recursive: true });
  writeFileSync(join(storiesDir, name), body);
  return { tmp, storiesDir };
}

// AC 1 — a spec carrying `lint-exempt-carry-forward: true` and NO Carry-forward
// section PASSES lint (frontmatter flag drives exemption).
test("AC-1: spec with `lint-exempt-carry-forward: true` frontmatter + no section → passes", () => {
  const spec = [
    "---",
    "id: legacy-sample",
    "lint-exempt-carry-forward: true",
    "---",
    "# Story legacy-sample: a pre-convention spec",
    "",
    "## Story",
    "",
    "As a dev, I want X, so that Y.",
    "",
  ].join("\n");
  const { tmp, storiesDir } = withStory("legacy-sample.md", spec);
  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.equal(
    r.status,
    0,
    `lint should exempt a spec with lint-exempt-carry-forward:true. stderr=${r.stderr} stdout=${r.stdout}`,
  );
});

// AC 4 — a NEW spec WITHOUT the flag AND WITHOUT the section still FAILS.
test("AC-4: spec without flag and without section → fails", () => {
  const spec = [
    "---",
    "id: new-sample",
    "---",
    "# Story new-sample: a new spec missing the section",
    "",
    "## Story",
    "",
    "As a dev, I want X, so that Y.",
    "",
  ].join("\n");
  const { tmp, storiesDir } = withStory("new-sample.md", spec);
  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.notEqual(
    r.status,
    0,
    `lint must still fail a new spec lacking both section and flag. stdout=${r.stdout}`,
  );
  assert.match(r.stdout + r.stderr, /Carry-forward/i);
});

// AC 4 — the flag must be `true`; a falsey/absent value does not exempt.
test("AC-4: `lint-exempt-carry-forward: false` does not exempt", () => {
  const spec = [
    "---",
    "id: false-sample",
    "lint-exempt-carry-forward: false",
    "---",
    "# Story false-sample",
    "",
    "## Story",
    "",
    "body",
    "",
  ].join("\n");
  const { tmp, storiesDir } = withStory("false-sample.md", spec);
  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.notEqual(
    r.status,
    0,
    `lint must not exempt when flag is false. stdout=${r.stdout}`,
  );
});

// AC 1 / AC 3 — the central LEGACY_EXEMPT array is removed from the source.
test("AC-1/3: LEGACY_EXEMPT central array is removed from the lint source", () => {
  const src = readFileSync(LINT_TOOL, "utf8");
  assert.doesNotMatch(
    src,
    /LEGACY_EXEMPT/,
    "the central LEGACY_EXEMPT list must be removed — exemption is now per-spec frontmatter",
  );
  assert.match(
    src,
    /lint-exempt-carry-forward/,
    "the lint must read the per-spec `lint-exempt-carry-forward` frontmatter flag",
  );
});

// AC 1 — a spec WITH the flag AND a populated section also passes (flag is a
// superset short-circuit, never a false-negative on already-valid specs).
test("AC-1: spec with flag AND populated section → passes", () => {
  const spec = [
    "---",
    "id: both-sample",
    "lint-exempt-carry-forward: true",
    "---",
    "# Story both-sample",
    "",
    "## Dev Notes",
    "",
    "### Carry-forward lessons",
    "",
    "- lesson-x: something.",
    "",
  ].join("\n");
  const { tmp, storiesDir } = withStory("both-sample.md", spec);
  const r = runLint([`--paths=${storiesDir}`], tmp);
  rmSync(tmp, { recursive: true, force: true });
  assert.equal(r.status, 0, `stderr=${r.stderr} stdout=${r.stdout}`);
});
