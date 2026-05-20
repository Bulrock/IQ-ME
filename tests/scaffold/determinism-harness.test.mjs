// Story 1.8 — Acceptance tests for tools/determinism-harness.mjs.
//
// Authored in test-author phase (frozen during specialist impl).
// Run: `node --test tests/scaffold/determinism-harness.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const HARNESS_PATH = join(REPO_ROOT, "tools", "determinism-harness.mjs");
const MARKER_PATH = join(REPO_ROOT, "dist", ".build-determinism-check.json");
const BYTE_STABLE_STUB = join(REPO_ROOT, "tests", "playwright", "byte-stable.spec.mjs");

const HARNESS_URL = `file://${HARNESS_PATH}`;
const EMPTY_TREE_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// ─────────────────────────────────────────────────────────────────────
// AC-1, AC-4, AC-5: harness exists, exports, stdlib-only
// ─────────────────────────────────────────────────────────────────────

test("AC-1: tools/determinism-harness.mjs exists", () => {
  assert.ok(existsSync(HARNESS_PATH), `${HARNESS_PATH} missing`);
});

test("AC-4: harness is stdlib-only (NFR33)", () => {
  const source = readFileSync(HARNESS_PATH, "utf8");
  const importRegex = /\b(?:from|import\()\s*["']([^"']+)["']/g;
  let m;
  const violations = [];
  while ((m = importRegex.exec(source)) !== null) {
    if (!m[1].startsWith("node:")) violations.push(m[1]);
  }
  assert.deepEqual(violations, [], `harness must import only from node: stdlib. Found: ${violations.join(", ")}`);
});

test("AC-5: harness exports DETERMINISM + utility functions (named imports)", async () => {
  const mod = await import(HARNESS_URL);
  assert.ok(mod.DETERMINISM, `named export DETERMINISM missing`);
  assert.equal(typeof mod.sortedReaddir, "function", `named export sortedReaddir missing or not a function`);
  assert.equal(typeof mod.frozenStat, "function", `named export frozenStat missing or not a function`);
  assert.equal(typeof mod.hashTree, "function", `named export hashTree missing or not a function`);
});

test("AC-5: harness default-exports DETERMINISM", async () => {
  const mod = await import(HARNESS_URL);
  assert.equal(mod.default, mod.DETERMINISM, `default export must equal named DETERMINISM`);
});

// ─────────────────────────────────────────────────────────────────────
// AC-1: DETERMINISM constants
// ─────────────────────────────────────────────────────────────────────

test("AC-1: DETERMINISM.SOURCE_DATE_EPOCH === 0", async () => {
  const { DETERMINISM } = await import(HARNESS_URL);
  assert.equal(DETERMINISM.SOURCE_DATE_EPOCH, 0);
});

test("AC-1: DETERMINISM.FROZEN_TIMESTAMP_ISO === \"1970-01-01T00:00:00.000Z\"", async () => {
  const { DETERMINISM } = await import(HARNESS_URL);
  assert.equal(DETERMINISM.FROZEN_TIMESTAMP_ISO, "1970-01-01T00:00:00.000Z");
});

test("AC-1: DETERMINISM.HASH_LOCALE === \"C.UTF-8\"", async () => {
  const { DETERMINISM } = await import(HARNESS_URL);
  assert.equal(DETERMINISM.HASH_LOCALE, "C.UTF-8");
});

test("AC-1: DETERMINISM.R_SEED === 20260514", async () => {
  const { DETERMINISM } = await import(HARNESS_URL);
  assert.equal(DETERMINISM.R_SEED, 20260514);
});

test("AC-1: DETERMINISM.R_QUADPTS === 61", async () => {
  const { DETERMINISM } = await import(HARNESS_URL);
  assert.equal(DETERMINISM.R_QUADPTS, 61);
});

test("AC-1: DETERMINISM.R_THETA_LIM === [-6, 6]", async () => {
  const { DETERMINISM } = await import(HARNESS_URL);
  assert.deepEqual(DETERMINISM.R_THETA_LIM, [-6, 6]);
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: utility-function behavior
// ─────────────────────────────────────────────────────────────────────

test("AC-3: sortedReaddir returns sorted entries", async () => {
  const { sortedReaddir } = await import(HARNESS_URL);
  // tests/scaffold/ has many .test.mjs files — assert sort is alphabetical.
  const entries = sortedReaddir(join(REPO_ROOT, "tests", "scaffold"));
  const sortedCopy = [...entries].sort();
  assert.deepEqual(entries, sortedCopy, `sortedReaddir output should be alphabetical`);
});

test("AC-3: hashTree of empty directory returns documented sentinel hash", async () => {
  const { hashTree } = await import(HARNESS_URL);
  // Create a known-empty temp dir under tests/fixtures/ to avoid /tmp portability concerns.
  const emptyDir = join(REPO_ROOT, "tests", "fixtures", "_determinism-empty-dir-fixture");
  rmSync(emptyDir, { recursive: true, force: true });
  // Use sync mkdir via Node — we can't call harness functions to create it; use spawnSync mkdir.
  spawnSync("mkdir", ["-p", emptyDir]);
  try {
    const h1 = hashTree(emptyDir);
    const h2 = hashTree(emptyDir);
    assert.equal(h1, h2, `hashTree must be deterministic across calls`);
    assert.equal(h1, EMPTY_TREE_SHA256, `empty-tree hash should equal documented sentinel ${EMPTY_TREE_SHA256}; got ${h1}`);
  } finally {
    rmSync(emptyDir, { recursive: true, force: true });
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: make build produces deterministic marker
// ─────────────────────────────────────────────────────────────────────

test("AC-2: `make build` produces dist/.build-determinism-check.json", () => {
  spawnSync("make", ["clean"], { cwd: REPO_ROOT });
  const r = spawnSync("make", ["build"], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, `make build exited ${r.status}. stderr:\n${r.stderr}`);
  assert.ok(existsSync(MARKER_PATH), `${MARKER_PATH} missing after make build`);
  const marker = JSON.parse(readFileSync(MARKER_PATH, "utf8"));
  assert.equal(typeof marker.sha256, "string", `marker.sha256 must be string`);
  assert.equal(marker.frozen_epoch, 0, `marker.frozen_epoch must be 0`);
  assert.equal(typeof marker.harness_version, "string", `marker.harness_version must be string`);
});

test("AC-2: `make clean && make build` produces byte-identical marker across runs", () => {
  spawnSync("make", ["clean"], { cwd: REPO_ROOT });
  spawnSync("make", ["build"], { cwd: REPO_ROOT });
  const first = readFileSync(MARKER_PATH, "utf8");
  spawnSync("make", ["clean"], { cwd: REPO_ROOT });
  spawnSync("make", ["build"], { cwd: REPO_ROOT });
  const second = readFileSync(MARKER_PATH, "utf8");
  assert.equal(first, second, `marker drifted between two clean builds:\nfirst:\n${first}\nsecond:\n${second}`);
});

// ─────────────────────────────────────────────────────────────────────
// AC-6 (Story 1.8): byte-stable.spec.mjs
//
// Story 4.2 activated the stub into a real Playwright test. The harness-
// origin invariants below survive activation — the spec still imports
// DETERMINISM from determinism-harness.mjs and uses hashTree on dist/.
// ─────────────────────────────────────────────────────────────────────

test("AC-6: tests/playwright/byte-stable.spec.mjs exists", () => {
  assert.ok(existsSync(BYTE_STABLE_STUB), `byte-stable.spec.mjs missing at ${BYTE_STABLE_STUB}`);
});

test("AC-6: byte-stable spec references DETERMINISM from harness", () => {
  const source = readFileSync(BYTE_STABLE_STUB, "utf8");
  assert.match(source, /DETERMINISM/, `byte-stable spec must reference DETERMINISM`);
  assert.match(source, /determinism-harness/, `byte-stable spec must import the harness`);
});

test("AC-6 (Story 4.2): byte-stable spec is activated (no test.fixme) and imports hashTree", () => {
  const source = readFileSync(BYTE_STABLE_STUB, "utf8");
  assert.doesNotMatch(source, /test\.fixme\(/, `byte-stable spec must no longer be fixme'd (activated in Story 4.2)`);
  assert.match(source, /hashTree/, `byte-stable spec must import hashTree from determinism-harness`);
});
