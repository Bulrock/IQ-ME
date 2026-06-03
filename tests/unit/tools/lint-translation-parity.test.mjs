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
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// EN body SHA256 (matches build-methodology.mjs enSourceHashFor): body =
// everything after the closing frontmatter `---`, /\r?\n/-split, \n-joined.
function bodySha256(pageText) {
  const lines = pageText.split(/\r?\n/);
  let end = -1;
  for (let i = 1; i < lines.length; i++) { if (lines[i] === "---") { end = i; break; } }
  const body = end === -1 ? pageText : lines.slice(end + 1).join("\n");
  return createHash("sha256").update(body, "utf8").digest("hex");
}

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

// ─── Story 7.5b graduation — EN-only now fails parity (missing counterparts) ─

test("7.5b: EN-only tree fails parity (EN pages missing RU/PL counterparts)", () => {
  withFixture((dir) => {
    enOnlyFixture(dir);
    const r = runLint(dir);
    assert.equal(r.status, 1, `expected exit 1; stdout=${r.stdout}; stderr=${r.stderr}`);
    assert.match(
      r.stdout + r.stderr,
      /missing/i,
      `expected a missing-counterpart violation; got:\n${r.stdout + r.stderr}`,
    );
  });
});

// ─── Story 7.5b graduation — complete tri-locale with matching hash → exit 0 ─

test("7.5b: complete tri-locale with matching sourceHashEN → exit 0", () => {
  withFixture((dir) => {
    const en = enPage("Overview");
    const h = bodySha256(en);
    writeFile(dir, "en/scoring/overview/index.md", en);
    writeFile(dir, "ru/scoring/overview/index.md", ruPage("Обзор", h));
    writeFile(dir, "pl/scoring/overview/index.md", ruPage("Przegląd", h));
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
    assert.match(r.stdout + r.stderr, /RU:\s*1\s*\/\s*1\s*pages parity-green/i);
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

test("7.5b: per-locale summary emits EN source-of-truth + RU/PL parity-green", () => {
  withFixture((dir) => {
    const en = enPage("Overview");
    const h = bodySha256(en);
    writeFile(dir, "en/scoring/overview/index.md", en);
    writeFile(dir, "ru/scoring/overview/index.md", ruPage("Обзор", h));
    writeFile(dir, "pl/scoring/overview/index.md", ruPage("Przegląd", h));
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const out = r.stdout + r.stderr;
    assert.match(out, /EN:\s*source-of-truth/i, `expected EN: source-of-truth; got:\n${out}`);
    assert.match(out, /RU:\s*\d+\s*\/\s*\d+\s*pages parity-green/i, `expected RU parity-green; got:\n${out}`);
    assert.match(out, /PL:\s*\d+\s*\/\s*\d+\s*pages parity-green/i, `expected PL parity-green; got:\n${out}`);
  });
});

// ─── Story 7.5b — a half-mirrored locale is reported with its green count ───

test("7.5b: per-locale summary reports the green/total count per locale", () => {
  withFixture((dir) => {
    const en = enPage("Overview");
    const h = bodySha256(en);
    writeFile(dir, "en/scoring/overview/index.md", en);
    writeFile(dir, "ru/scoring/overview/index.md", ruPage("Обзор", h));
    writeFile(dir, "pl/scoring/overview/index.md", ruPage("Przegląd", h));
    const r = runLint(dir);
    assert.equal(r.status, 0);
    const out = r.stdout + r.stderr;
    assert.match(out, /RU:\s*1\s*\/\s*1/i, `expected RU 1/1; got:\n${out}`);
    assert.match(out, /PL:\s*1\s*\/\s*1/i, `expected PL 1/1; got:\n${out}`);
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
