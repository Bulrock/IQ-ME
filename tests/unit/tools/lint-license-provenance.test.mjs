// Unit tests for tools/lint-license-provenance.mjs.
// Story 4-5 — red-phase failing tests authored pre-implementation.
//
// The lint performs two phases against a repo:
//   Phase 1 (orphan detection): every shipped source file under declared
//     scope roots must map to a license class via docs/license-scope-map.md.
//   Phase 2 (LICENSES.md hash discipline, NFR24): SHA-256 of LICENSES.md
//     body (excluding the `<!-- last-modified-hash: <X> -->` line) must
//     match the declared hash, unless the placeholder all-zeros sentinel
//     is still in place (WARN, exit 0). Drift without a CHANGELOG.md entry
//     naming `LICENSES.md` → exit 1.
//
// Fixtures use `mkdtempSync` per-test (NFR33 stdlib-only).

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-license-provenance.mjs");

const PLACEHOLDER = "0".repeat(64);

// ─── helpers ─────────────────────────────────────────────────────────────

function runLint(cwd, args = []) {
  return spawnSync("node", [SCRIPT, ...args], { cwd, encoding: "utf8" });
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-lp-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeFile(dir, relPath, content) {
  const full = join(dir, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

function bodyExcludingHashLine(text) {
  return text
    .split(/\r?\n/)
    .filter((l) => !/^<!--\s*last-modified-hash:/.test(l))
    .join("\n");
}

function sha256(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function writeLicensesMd(dir, declaredHash) {
  const body = [
    "# IQ-ME Licenses",
    "",
    `<!-- last-modified-hash: ${declaredHash} -->`,
    "",
    "## 1. App code — MIT",
    "",
    "Scope: src/assessment, src/scoring, tools/",
    "",
    "## 2. Item pool — CC-BY-NC-SA 4.0",
    "",
    "Scope: src/items/",
    "",
  ].join("\n");
  writeFile(dir, "LICENSES.md", body);
  return body;
}

function realHashOfFixtureLicensesMd(text) {
  return sha256(bodyExcludingHashLine(text));
}

function writeScopeMap(dir, body) {
  writeFile(dir, "docs/license-scope-map.md", body);
}

const DEFAULT_SCOPE_MAP = [
  "# License scope map",
  "",
  "```yaml",
  "classes:",
  "  mit:",
  '    globs: ["src/assessment/**", "tools/**"]',
  '    licenses-md-section: "1. App code — MIT"',
  "  item-pool:",
  '    globs: ["src/items/*.svg", "src/items/item-parameters.json"]',
  '    licenses-md-section: "2. Item pool"',
  "exclusions:",
  '  - "**/.gitkeep"',
  "```",
  "",
].join("\n");

function writeChangelog(dir, content) {
  writeFile(dir, "CHANGELOG.md", content);
}

// ─── AC-1 / AC-7 happy path ──────────────────────────────────────────────

test("happy path: all files covered + hash matches → exit 0", () => {
  withFixture((dir) => {
    // Compute the real hash from the placeholder skeleton, then re-write
    // with the real declared hash. Hash-line is excluded from the digest,
    // so the digest is identical pre- and post-flip.
    const placeholderBody = writeLicensesMd(dir, PLACEHOLDER);
    const real = realHashOfFixtureLicensesMd(placeholderBody);
    const realBody = placeholderBody.replace(PLACEHOLDER, real);
    writeFile(dir, "LICENSES.md", realBody);
    // Sanity: digest is stable across the hash-line rewrite.
    assert.equal(
      realHashOfFixtureLicensesMd(realBody),
      real,
      "hash must be stable across the rewrite (excluding hash line)",
    );

    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app code\n");
    writeFile(dir, "src/items/stub-001.svg", "<svg/>");
    writeFile(dir, "src/items/item-parameters.json", "[]");
    writeFile(dir, "tools/some-tool.mjs", "// tool\n");

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}\nstdout: ${r.stdout}`);
    assert.match(r.stdout + r.stderr, /lint-license-provenance/);
  });
});

// ─── orphan detection ────────────────────────────────────────────────────

test("orphan file → exit 1 with file path", () => {
  withFixture((dir) => {
    const body = writeLicensesMd(dir, PLACEHOLDER);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app code\n");
    // Orphan: a path inside a scanned root (src/items/) that no glob in
    // DEFAULT_SCOPE_MAP covers (item-pool only matches *.svg + item-parameters.json).
    writeFile(dir, "src/items/orphan.txt", "I am an orphan\n");

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(r.stderr + r.stdout, /orphan\.txt/);
    assert.match(r.stderr + r.stdout, /no LICENSES\.md scope entry found/);
    // body referenced to silence unused warning (declared hash is placeholder).
    void body;
  });
});

// Negative path: orphan outside scope-map's static prefixes is intentionally
// NOT walked — the lint only enforces over declared roots (see scope-map.md
// notes section). Adding a new shipped tree means adding it to scope-map.
test("file outside any scanned root is intentionally NOT flagged as orphan", () => {
  withFixture((dir) => {
    writeLicensesMd(dir, PLACEHOLDER);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");
    // Outside any scope-map prefix — by design, not scanned.
    writeFile(dir, "src/uncharted/file.txt", "untouched\n");

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}\nstdout=${r.stdout}`);
  });
});

// ─── hash drift + CHANGELOG → exit 0 ─────────────────────────────────────

test("hash drift + CHANGELOG entry referencing LICENSES.md → exit 0", () => {
  withFixture((dir) => {
    // Declared hash differs from real; declared != placeholder.
    const fakeDeclared = "a".repeat(64);
    writeLicensesMd(dir, fakeDeclared);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");
    writeChangelog(
      dir,
      "# Changelog\n\n## Unreleased\n\n### Changed\n- LICENSES.md updated to add ICAR confirmation.\n",
    );

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}\nstdout=${r.stdout}`);
  });
});

// ─── hash drift + no CHANGELOG entry → exit 1 ────────────────────────────

test("hash drift + missing CHANGELOG.md → exit 1 telling user to create CHANGELOG.md", () => {
  withFixture((dir) => {
    const fakeDeclared = "b".repeat(64);
    writeLicensesMd(dir, fakeDeclared);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");
    // No CHANGELOG at all.

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(r.stderr + r.stdout, /CHANGELOG\.md/);
  });
});

test("hash drift + CHANGELOG without LICENSES.md reference → exit 1", () => {
  withFixture((dir) => {
    const fakeDeclared = "c".repeat(64);
    writeLicensesMd(dir, fakeDeclared);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");
    writeChangelog(
      dir,
      "# Changelog\n\n## Unreleased\n\n### Changed\n- Some unrelated change.\n",
    );

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(r.stderr + r.stdout, /CHANGELOG/);
  });
});

// ─── placeholder hash → WARN, exit 0 ─────────────────────────────────────

test("placeholder hash → WARN, exit 0 (backward-compat with v0.0.1 state)", () => {
  withFixture((dir) => {
    writeLicensesMd(dir, PLACEHOLDER);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}\nstdout=${r.stdout}`);
    assert.match(r.stderr + r.stdout, /WARN.*placeholder/i);
  });
});

// ─── exclusions honored ──────────────────────────────────────────────────

test("exclusions honored: .gitkeep not flagged as orphan", () => {
  withFixture((dir) => {
    const body = writeLicensesMd(dir, PLACEHOLDER);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/items/.gitkeep", "");
    writeFile(dir, "src/assessment/.gitkeep", "");
    writeFile(dir, "src/assessment/main.js", "// app\n");

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}\nstdout=${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, /\.gitkeep.*no LICENSES\.md scope entry/);
    void body;
  });
});

// ─── missing scope-map ───────────────────────────────────────────────────

test("missing docs/license-scope-map.md → exit 1 with helpful message", () => {
  withFixture((dir) => {
    writeLicensesMd(dir, PLACEHOLDER);
    // no scope map authored
    writeFile(dir, "src/assessment/main.js", "// app\n");

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(r.stderr + r.stdout, /license-scope-map\.md/);
  });
});

// ─── malformed scope-map ─────────────────────────────────────────────────

test("malformed YAML in scope-map → exit 1", () => {
  withFixture((dir) => {
    writeLicensesMd(dir, PLACEHOLDER);
    writeScopeMap(
      dir,
      "# Scope map\n\n```yaml\nclasses:\n  mit:\n    globs: [src/assessment/**\n```\n",
    );
    writeFile(dir, "src/assessment/main.js", "// app\n");

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(r.stderr + r.stdout, /license-scope-map\.md/);
  });
});

// ─── no-drift baseline without CHANGELOG.md → exit 0 ─────────────────────

test("no hash drift AND no CHANGELOG.md present → exit 0", () => {
  withFixture((dir) => {
    // Author with real hash so no drift.
    const skeleton = [
      "# IQ-ME Licenses",
      "",
      `<!-- last-modified-hash: ${PLACEHOLDER} -->`, // placeholder
      "",
      "## 1. App code — MIT",
      "",
    ].join("\n");
    const real = sha256(bodyExcludingHashLine(skeleton));
    const real_body = skeleton.replace(PLACEHOLDER, real);
    writeFile(dir, "LICENSES.md", real_body);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");
    // No CHANGELOG.md.

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}\nstdout=${r.stdout}`);
  });
});

// ─── summary line on success ─────────────────────────────────────────────

test("success mode prints summary line: N file(s) attributed; hash <verified|warned>", () => {
  withFixture((dir) => {
    writeLicensesMd(dir, PLACEHOLDER);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");
    writeFile(dir, "src/items/stub-001.svg", "<svg/>");
    writeFile(dir, "src/items/item-parameters.json", "[]");

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(
      r.stdout + r.stderr,
      /lint-license-provenance:.*\d+ file\(s\) attributed.*hash (verified|warned)/i,
    );
  });
});

// ─── glob coverage smoke ─────────────────────────────────────────────────

test("nested src/assessment/sub/foo.js covered by src/assessment/** glob", () => {
  withFixture((dir) => {
    writeLicensesMd(dir, PLACEHOLDER);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// top\n");
    writeFile(dir, "src/assessment/nested/deep/foo.js", "// deep\n");

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}\nstdout=${r.stdout}`);
  });
});

// ─── hash line removal is exact ─────────────────────────────────────────

test("hash computation excludes the hash comment line itself (only)", () => {
  withFixture((dir) => {
    // Two valid declared hashes — one for skeleton-A and one with extra prose.
    const skeleton = [
      "# IQ-ME Licenses",
      "",
      `<!-- last-modified-hash: ${PLACEHOLDER} -->`,
      "",
      "## 1. App code — MIT",
      "",
      "More prose here.",
      "",
    ].join("\n");
    const real = sha256(bodyExcludingHashLine(skeleton));
    const final_body = skeleton.replace(PLACEHOLDER, real);
    writeFile(dir, "LICENSES.md", final_body);
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}\nstdout=${r.stdout}`);
  });
});

// ─── missing LICENSES.md → exit 1 ────────────────────────────────────────

test("missing LICENSES.md → exit 1", () => {
  withFixture((dir) => {
    writeScopeMap(dir, DEFAULT_SCOPE_MAP);
    writeFile(dir, "src/assessment/main.js", "// app\n");

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(r.stderr + r.stdout, /LICENSES\.md/);
  });
});
