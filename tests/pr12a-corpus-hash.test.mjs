// tests/pr12a-corpus-hash.test.mjs
//
// NOTE FOR CI: Add this file to the `make test` invocation or a dedicated CI job.
// It is NOT picked up by the current `make test` glob (tests/unit/**/*.test.mjs)
// because it sits at tests/ root. The engineer must wire it at impl time.
//
// Story 11-1 PR-12a — AC14: EN corpus body hashes match sourceHashEN frontmatter.
//
// NFR27 mandates that whenever an EN methodology corpus page is edited the
// `sourceHashEN` frontmatter field in the EN file itself (and in its RU/PL mirrors)
// is bumped to the sha256 of the updated body.  This test reads every EN corpus
// file that carries a `sourceHashEN` field, computes the sha256 of the body
// (everything after the closing `---` frontmatter fence), and asserts it equals
// the stored value.
//
// Current state: all EN files carry the placeholder
// `sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"`.
// Real body content hashes are NOT `0000…0000` → tests FAIL (red phase).
//
// A correct implementation: run the hash-bump tooling (or manually compute hashes)
// and update every EN file's `sourceHashEN` to its real body sha256, then run
// `lint-translation-parity` to confirm parity across RU/PL mirrors.
//
// Node 22 native `node:test` + `node:assert/strict` + `node:crypto`. Zero deps (NFR33).
// Body + frontmatter parsing mirrors `tools/lint-translation-parity.mjs` exactly:
//   - body = lines after the second `---` fence, joined with "\n"
//   - hash = sha256(body, "utf8")
//   - sourceHashEN value matched at frontmatter key `sourceHashEN:` (stripped quotes)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..");
const EN_DIR = resolve(REPO_ROOT, "src/content/methodology/en");

// ─── helpers (mirrors lint-translation-parity.mjs) ──────────────────────────

/**
 * Walk a directory tree and yield absolute paths of every .md file.
 * @param {string} dir
 * @returns {Generator<string>}
 */
function* walkMd(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return;
    throw e;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkMd(p);
    else if (e.isFile() && e.name.endsWith(".md")) yield p;
  }
}

/**
 * Extract a top-level scalar frontmatter value by key.
 * Handles both quoted ("value") and bareword values.
 * Returns undefined if key not found or frontmatter absent.
 *
 * @param {string} text - full file content
 * @param {string} key  - frontmatter key to look up
 * @returns {string|undefined}
 */
function extractFrontmatterValue(text, key) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return undefined;
  const keyRe = new RegExp(`^${key}\\s*:\\s*(.*)$`);
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(keyRe);
    if (m) {
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return undefined;
}

/**
 * Extract the body (everything after the closing `---` fence).
 * Returns the whole text if no frontmatter found.
 *
 * @param {string} text
 * @returns {string}
 */
function pageBody(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return text;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return text;
  return lines.slice(end + 1).join("\n");
}

/**
 * Compute sha256 of the body as a lowercase hex string.
 * @param {string} text - full file content
 * @returns {string}    - 64-char lowercase hex
 */
function bodySha256(text) {
  return createHash("sha256").update(pageBody(text), "utf8").digest("hex");
}

// ─── AC14: build the test cases ─────────────────────────────────────────────

// Collect all EN corpus files that carry a sourceHashEN field.
const HEX64_RE = /^[0-9a-f]{64}$/;

// Guard: EN dir must exist (if corpus moves this test catches the drift).
test("AC14: EN corpus directory exists at src/content/methodology/en", () => {
  assert.ok(
    existsSync(EN_DIR),
    `EN corpus directory not found at ${EN_DIR} — corpus path may have changed`,
  );
});

// Main AC14 coverage: per-file hash assertion.
// Enumerate all EN corpus .md files at discovery time (synchronous, fast).
const enFiles = existsSync(EN_DIR) ? [...walkMd(EN_DIR)] : [];

// Assert at least 5 corpus files exist (sanity — guards against empty corpus).
test("AC14: EN corpus contains ≥5 .md files with sourceHashEN frontmatter", () => {
  const withHash = enFiles.filter((f) => {
    const text = readFileSync(f, "utf8");
    return extractFrontmatterValue(text, "sourceHashEN") !== undefined;
  });
  assert.ok(
    withHash.length >= 5,
    `Expected ≥5 EN corpus files with sourceHashEN; found ${withHash.length}. ` +
    `Files: ${enFiles.map((f) => relative(REPO_ROOT, f)).join(", ")}`,
  );
});

// Individual file tests: one per corpus file that carries sourceHashEN.
// These tests FAIL against the placeholder 0000…0000 hashes (red phase).
for (const absPath of enFiles) {
  const relPath = relative(REPO_ROOT, absPath);
  const text = readFileSync(absPath, "utf8");
  const storedHash = extractFrontmatterValue(text, "sourceHashEN");

  // Skip files that have no sourceHashEN frontmatter key at all (not a parity file).
  if (storedHash === undefined) continue;

  test(`AC14: ${relPath} — sourceHashEN matches sha256 of body (NFR27)`, () => {
    // The stored value must be a valid 64-char hex string (shape check first).
    assert.match(
      storedHash,
      HEX64_RE,
      `${relPath}: malformed sourceHashEN — must be 64-char lowercase hex; got: ${JSON.stringify(storedHash)}`,
    );

    // Compute the real body hash and compare.
    const actualHash = bodySha256(text);
    assert.equal(
      storedHash,
      actualHash,
      `${relPath}: sourceHashEN mismatch (NFR27 parity drift).\n` +
      `  stored : ${storedHash}\n` +
      `  actual : ${actualHash}\n` +
      `Run the hash-bump tooling and update sourceHashEN in the EN file (and its RU/PL mirrors).`,
    );
  });
}
