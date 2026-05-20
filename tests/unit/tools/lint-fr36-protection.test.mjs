// Unit tests for tools/lint-fr36-protection.mjs (Story 5.2 AC-2).

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-fr36-protection.mjs");

const PROTECTED_REL = "src/content/methodology/en/limitations/what-this-does-not-measure/index.md";

function writeProtected(dir, opts = {}) {
  const protectedFlag = "protected" in opts ? opts.protected : true;
  const body = opts.body ?? "x".repeat(2200);
  const fm = [
    "---",
    'title: "What this instrument does not measure"',
    'version: "0.1.0"',
    'lastReviewed: "2026-05-20"',
    'reviewer: "TBD"',
    'reviewerHandle: "@TBD-en-reviewer"',
    "asserts: []",
    "glossaryRefs: []",
    'sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"',
    `protected: ${protectedFlag}`,
    "---",
    "",
    "# Body",
    "",
    body,
    "",
  ].join("\n");
  const full = join(dir, PROTECTED_REL);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, fm);
}

function run(cwd) {
  return spawnSync("node", [SCRIPT], { cwd, encoding: "utf8" });
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-fr36-"));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("lint-fr36: protected:true + body ≥2000 chars exits 0", () => {
  withFixture((dir) => {
    writeProtected(dir);
    const r = run(dir);
    assert.equal(r.status, 0, `expected 0; stderr=${r.stderr}; stdout=${r.stdout}`);
    assert.match(r.stdout, /ok/i);
  });
});

test("lint-fr36: missing protected:true exits 1", () => {
  withFixture((dir) => {
    writeProtected(dir, { protected: false });
    const r = run(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /protected/i);
  });
});

test("lint-fr36: body shorter than 2000 chars exits 1", () => {
  withFixture((dir) => {
    writeProtected(dir, { body: "short body" });
    const r = run(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /character|length|2000/i);
  });
});

test("lint-fr36: missing protected file exits 1", () => {
  withFixture((dir) => {
    // Don't create the file.
    const r = run(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /missing|not found|what-this-does-not-measure/i);
  });
});
