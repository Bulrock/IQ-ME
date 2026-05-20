// tests/unit/tools/lint-translation-parity.test.mjs
//
// Story 4-7 AC-2, AC-7 — unit tests for tools/lint-translation-parity.mjs.
//
// The lint is a no-op stub at Epic 4 (no non-EN content yet). Phase 1: if no
// non-EN methodology content exists → emit a single WARN line + exit 0.
// Phase 2 (defensive, in case Epic 7 partial-content lands during Epic 4):
// for any non-EN page, validate that frontmatter `sourceHashEN` is a 64-char
// hex string. Full EN-source diff comparison is deferred to Epic 7.
//
// Fixtures use mkdtempSync (NFR33 stdlib-only). The script accepts an env
// override IQME_METHODOLOGY_ROOT so each test points at its own fixture tree.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-translation-parity.mjs");

function runLint(methodologyRoot) {
  return spawnSync("node", [SCRIPT], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      IQME_METHODOLOGY_ROOT: methodologyRoot,
    },
  });
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-tp-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeFile(dir, rel, content) {
  const full = join(dir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function enOnlyFixture(dir) {
  // EN content; RU + PL are .gitkeep-only.
  writeFile(dir, "en/scoring/overview/index.md", enPage("Overview"));
  writeFile(dir, "ru/.gitkeep", "");
  writeFile(dir, "pl/.gitkeep", "");
}

const VALID_HASH = "a".repeat(64);

function enPage(title) {
  return [
    "---",
    `title: "${title}"`,
    'version: "0.1.0"',
    'lastReviewed: "2026-05-19"',
    'reviewer: "R"',
    'reviewerHandle: "@r"',
    "asserts:",
    '  - "a"',
    "glossaryRefs:",
    '  - "g"',
    `sourceHashEN: "${VALID_HASH}"`,
    "---",
    "",
    `# ${title}`,
    "",
    "Body.",
    "",
  ].join("\n");
}

function ruPage(title, hash) {
  return [
    "---",
    `title: "${title}"`,
    'version: "0.1.0"',
    'lastReviewed: "2026-05-19"',
    'reviewer: "R"',
    'reviewerHandle: "@r"',
    "asserts:",
    '  - "a"',
    "glossaryRefs:",
    '  - "g"',
    `sourceHashEN: "${hash}"`,
    "---",
    "",
    `# ${title}`,
    "",
    "Body.",
    "",
  ].join("\n");
}

// ─── AC-2 Phase 1: no non-EN content → WARN + exit 0 ───────────────────────

test("AC-2 4-7: no non-EN content → exit 0 with single WARN line", () => {
  withFixture((dir) => {
    enOnlyFixture(dir);
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.match(
      out,
      /lint-translation-parity:\s*WARN\s+no non-EN content yet[^\n]*Epic 7/i,
      `expected single WARN line referencing Epic 7; got:\n${out}`,
    );
  });
});

// ─── AC-2 Phase 2: non-EN page with valid sourceHashEN → exit 0 ────────────

test("AC-2 4-7: non-EN page (RU) with valid 64-hex sourceHashEN → exit 0", () => {
  withFixture((dir) => {
    writeFile(dir, "en/scoring/overview/index.md", enPage("Overview"));
    writeFile(dir, "ru/scoring/overview/index.md", ruPage("Обзор", "b".repeat(64)));
    writeFile(dir, "pl/.gitkeep", "");
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
  });
});

// ─── AC-2 Phase 2: non-EN page with missing sourceHashEN → exit 1 ─────────

test("AC-2 4-7: non-EN page (RU) with missing sourceHashEN → exit 1", () => {
  withFixture((dir) => {
    writeFile(dir, "en/scoring/overview/index.md", enPage("Overview"));
    // Hand-craft a RU page missing sourceHashEN entirely.
    const body = [
      "---",
      'title: "Обзор"',
      'version: "0.1.0"',
      'lastReviewed: "2026-05-19"',
      'reviewer: "R"',
      'reviewerHandle: "@r"',
      "asserts:",
      '  - "a"',
      "glossaryRefs:",
      '  - "g"',
      "---",
      "",
      "# Обзор",
      "",
      "Body.",
      "",
    ].join("\n");
    writeFile(dir, "ru/scoring/overview/index.md", body);
    writeFile(dir, "pl/.gitkeep", "");
    const r = runLint(dir);
    assert.notEqual(r.status, 0, `expected non-zero exit; stdout=${r.stdout}; stderr=${r.stderr}`);
    assert.match(
      r.stdout + r.stderr,
      /sourceHashEN|missing|frontmatter/i,
      `stderr must reference missing key; got:\n${r.stderr}`,
    );
  });
});

// ─── AC-2 Phase 2: non-EN page with malformed sourceHashEN → exit 1 ───────

test("AC-2 4-7: non-EN page (RU) with malformed sourceHashEN (not 64-hex) → exit 1", () => {
  withFixture((dir) => {
    writeFile(dir, "en/scoring/overview/index.md", enPage("Overview"));
    writeFile(dir, "ru/scoring/overview/index.md", ruPage("Обзор", "not-a-64-char-hex"));
    writeFile(dir, "pl/.gitkeep", "");
    const r = runLint(dir);
    assert.notEqual(r.status, 0, `expected non-zero exit; stdout=${r.stdout}; stderr=${r.stderr}`);
    assert.match(
      r.stdout + r.stderr,
      /sourceHashEN|64.?(char|hex)|malformed|hex/i,
      `stderr must reference malformed hash; got:\n${r.stderr}`,
    );
  });
});

// ─── AC-2: per-locale summary line emitted ────────────────────────────────

test("AC-2 4-7: per-locale summary line emitted (EN source-of-truth; RU/PL deferred)", () => {
  withFixture((dir) => {
    enOnlyFixture(dir);
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.match(
      out,
      /EN:\s*source-of-truth/i,
      `expected EN: source-of-truth in summary; got:\n${out}`,
    );
    assert.match(
      out,
      /RU.*not yet authored|RU.*Epic 7|RU\/PL.*not yet authored/i,
      `expected RU/PL deferred summary; got:\n${out}`,
    );
  });
});

// ─── AC-2: per-locale summary correctly reports "RU not yet authored"
// when RU dir is .gitkeep-only ─────────────────────────────────────────────

test("AC-2 4-7: per-locale summary reports 'RU not yet authored' when RU is .gitkeep-only", () => {
  withFixture((dir) => {
    enOnlyFixture(dir);
    const r = runLint(dir);
    assert.equal(r.status, 0);
    const out = r.stdout + r.stderr;
    // Both RU and PL should be flagged as not-yet-authored / Epic 7.
    assert.match(out, /RU/i, `expected RU mentioned in summary; got:\n${out}`);
    assert.match(out, /PL/i, `expected PL mentioned in summary; got:\n${out}`);
    assert.match(out, /Epic 7|not yet authored/i, `expected Epic 7 deferral; got:\n${out}`);
  });
});

// ─── NFR33: stdlib-only + ~80 LOC discipline ─────────────────────────────

test("AC-2 4-7: tools/lint-translation-parity.mjs is stdlib-only (NFR33)", () => {
  const src = readFileSync(SCRIPT, "utf8");
  const importLines = src.match(/^import .*$/gm) || [];
  for (const line of importLines) {
    assert.match(line, /from\s+["']node:/, `non-stdlib import detected: ${line}`);
  }
});
