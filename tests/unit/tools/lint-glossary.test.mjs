// Unit tests for tools/lint-glossary.mjs.
// Story 4-4 — red-phase failing tests authored pre-implementation.
//
// The lint validates `glossaryRefs:` frontmatter structure on every
// src/content/methodology/**.md page (defense-in-depth with Story 4-3's
// lint-frontmatter), and, when the per-language glossary tree exists at
// src/content/methodology/<lang>/reference/glossary/, asserts each
// glossaryRef has a matching entry file.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-glossary.mjs");

const HASH64 = "0".repeat(64);

function buildFrontmatter({ glossaryRefs = "[]", omitGlossaryRefs = false } = {}) {
  const lines = ["---"];
  lines.push('title: "Test page"');
  lines.push('version: "0.1.0"');
  lines.push('lastReviewed: "2026-05-19"');
  lines.push('reviewer: "Rev"');
  lines.push('reviewerHandle: "@TBD-en-reviewer"');
  lines.push("asserts: []");
  if (!omitGlossaryRefs) {
    if (Array.isArray(glossaryRefs)) {
      lines.push("glossaryRefs:");
      for (const r of glossaryRefs) lines.push(`  - "${r}"`);
    } else if (typeof glossaryRefs === "string" && glossaryRefs.startsWith("[")) {
      lines.push(`glossaryRefs: ${glossaryRefs}`);
    } else {
      // bareword scalar
      lines.push(`glossaryRefs: ${glossaryRefs}`);
    }
  }
  lines.push(`sourceHashEN: "${HASH64}"`);
  lines.push("---");
  lines.push("");
  lines.push("# Body");
  lines.push("");
  return lines.join("\n");
}

function writePage(dir, lang, relPath, content) {
  const full = join(dir, "src/content/methodology", lang, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

function writeGlossaryEntry(dir, lang, entryKey) {
  const full = join(dir, "src/content/methodology", lang, "reference/glossary", `${entryKey}.md`);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, "---\ntitle: stub\n---\n");
  return full;
}

function runLint(args = [], cwd = REPO_ROOT) {
  return spawnSync("node", [SCRIPT, ...args], { cwd, encoding: "utf8" });
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-gloss-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// AC-6.1 — happy path: page with valid glossaryRefs + glossary tree absent → WARN, exit 0.
test("lint-glossary: valid glossaryRefs + glossary tree absent → deferred WARN, exit 0", () => {
  withFixture((dir) => {
    writePage(dir, "en", "ok/index.md", buildFrontmatter({ glossaryRefs: ["alpha", "beta"] }));
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(
      r.stderr + r.stdout,
      /WARN.*ok\/index\.md.*glossary tree.*not yet authored.*Epic 5/,
      `expected deferred WARN; got stderr=${r.stderr} stdout=${r.stdout}`,
    );
  });
});

// AC-6.2 — empty glossaryRefs + glossary tree absent → silent pass, exit 0.
// (Note: per AC-1 the WARN is one per page, not per ref — so even empty
// glossaryRefs gets a deferred WARN. The summary line counts deferred pages.)
test("lint-glossary: empty glossaryRefs + glossary tree absent → exit 0 with deferred summary", () => {
  withFixture((dir) => {
    writePage(dir, "en", "ok/index.md", buildFrontmatter({ glossaryRefs: "[]" }));
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stdout, /deferred|validated/);
  });
});

// AC-6.3 — page with valid glossaryRefs + glossary tree present + entries present → pass, exit 0.
test("lint-glossary: glossary tree present + all entries present → exit 0", () => {
  withFixture((dir) => {
    writePage(dir, "en", "ok/index.md", buildFrontmatter({ glossaryRefs: ["alpha", "beta"] }));
    writeGlossaryEntry(dir, "en", "alpha");
    writeGlossaryEntry(dir, "en", "beta");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    // No deferred-tree WARN should be emitted when the tree is present.
    assert.doesNotMatch(r.stderr, /WARN/);
  });
});

// AC-6.4 — page with valid glossaryRefs + glossary tree present + entry missing → FAIL.
test("lint-glossary: glossary tree present + entry missing → exit 1 with specific entry path", () => {
  withFixture((dir) => {
    writePage(dir, "en", "bad/index.md", buildFrontmatter({ glossaryRefs: ["alpha", "missingEntry"] }));
    writeGlossaryEntry(dir, "en", "alpha");
    // Force tree existence via the one present file; missingEntry has no file.
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(
      r.stderr + r.stdout,
      /missingEntry/,
      `expected mention of missingEntry; got: ${r.stderr}${r.stdout}`,
    );
    assert.match(
      r.stderr + r.stdout,
      /reference\/glossary/,
      `expected the glossary path in the error`,
    );
  });
});

// AC-6.5 — glossaryRefs is wrong type (bareword string not array) → FAIL.
test("lint-glossary: glossaryRefs as bareword string → exit 1", () => {
  withFixture((dir) => {
    writePage(dir, "en", "bad/index.md", buildFrontmatter({ glossaryRefs: "notAnArray" }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /glossaryRefs/);
  });
});

// AC-6.6 — missing glossaryRefs key entirely → FAIL (defense-in-depth).
test("lint-glossary: missing glossaryRefs key entirely → exit 1", () => {
  withFixture((dir) => {
    writePage(dir, "en", "bad/index.md", buildFrontmatter({ omitGlossaryRefs: true }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /glossaryRefs/);
  });
});

// AC-6.7 — index/index.md alternate layout: glossary entry at <entry>/index.md still resolves.
test("lint-glossary: glossary entry as <entry>/index.md form resolves", () => {
  withFixture((dir) => {
    writePage(dir, "en", "ok/index.md", buildFrontmatter({ glossaryRefs: ["alpha"] }));
    // Write entry as alpha/index.md not alpha.md.
    const entryDir = join(dir, "src/content/methodology/en/reference/glossary/alpha");
    mkdirSync(entryDir, { recursive: true });
    writeFileSync(join(entryDir, "index.md"), "---\ntitle: alpha\n---\n");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
  });
});

// AC-6.8 — multi-locale: RU page with present RU glossary tree validated independently
// of EN tree absence. EN page still emits deferred WARN.
test("lint-glossary: per-locale tree existence is independent", () => {
  withFixture((dir) => {
    writePage(dir, "en", "ok/index.md", buildFrontmatter({ glossaryRefs: ["alpha"] }));
    writePage(dir, "ru", "ok/index.md", buildFrontmatter({ glossaryRefs: ["alpha"] }));
    // Only RU glossary tree present.
    writeGlossaryEntry(dir, "ru", "alpha");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    // EN page should be deferred (its tree absent); RU page should not.
    assert.match(r.stderr + r.stdout, /WARN.*en\/ok\/index\.md/);
    assert.doesNotMatch(r.stderr + r.stdout, /WARN.*ru\/ok\/index\.md/);
  });
});
