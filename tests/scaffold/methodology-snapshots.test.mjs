// tests/scaffold/methodology-snapshots.test.mjs
//
// Story 4.2 AC-4 — snapshot-drift gate. For every committed
// tests/snapshots/methodology/<lang>/<path>/index.html, build the corpus to a
// mkdtempSync tmpdir (Story 3-6 isolation pattern) and assert byte-identical
// to the snapshot. On mismatch the test fails with the AC-4 contract message:
//   `methodology snapshot drift at <path>: run 'make snapshot-update' and
//   commit both files together`.
//
// Story 4-2 red phase: at test-author time, the snapshots don't exist yet, so
// this scaffold either reports "no snapshots found" (engineer's signal to run
// snapshot-update) or the per-snapshot drift test fails because the snapshot
// is absent. Both failure modes are expected.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const BUILD_METHODOLOGY = resolve(REPO_ROOT, "tools/build-methodology.mjs");
const SNAPSHOT_ROOT = resolve(REPO_ROOT, "tests/snapshots/methodology");

// Story 4-2 corpus-version contract: snapshots strip the version segment, but
// the build output still emits at <version>/<lang>/<path>. The scaffold reads
// IQME_CORPUS_VERSION when set (matches build-methodology.mjs:54-58) or
// defaults to v0.1.0 (the fallback the builder itself uses).
const CORPUS_VERSION = process.env.IQME_CORPUS_VERSION || "v0.1.0";

function walkHtml(root, rel = "") {
  const acc = [];
  if (!existsSync(join(root, rel))) return acc;
  for (const e of readdirSync(join(root, rel), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const r = rel ? join(rel, e.name) : e.name;
    if (e.isDirectory()) acc.push(...walkHtml(root, r));
    else if (e.isFile() && e.name.endsWith(".html")) acc.push(r);
  }
  return acc;
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// Single shared build per file: amortizes the ~hundreds-of-ms build across the
// per-snapshot tests. Each invocation creates its own tmpdir; the scaffold is
// a read-only consumer of the build output, so sharing the dir within one
// test file is safe (no parallel mutation).
let SHARED_BUILD_DIR = null;
function ensureBuild() {
  if (SHARED_BUILD_DIR) return SHARED_BUILD_DIR;
  const out = mkdtempSync(join(tmpdir(), "iqme-snap-drift-"));
  const r = spawnSync("node", [BUILD_METHODOLOGY], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: out },
  });
  assert.equal(r.status, 0, `build-methodology failed: ${r.stderr}`);
  SHARED_BUILD_DIR = out;
  return out;
}

process.on("exit", () => {
  if (SHARED_BUILD_DIR) {
    try { rmSync(SHARED_BUILD_DIR, { recursive: true, force: true }); } catch {}
  }
});

const SNAPSHOT_FILES = walkHtml(SNAPSHOT_ROOT);

test("AC-4: snapshot tree exists with at least one committed snapshot file", () => {
  assert.ok(
    SNAPSHOT_FILES.length > 0,
    `expected ≥1 snapshot under ${relative(REPO_ROOT, SNAPSHOT_ROOT)}; got 0. Run 'make snapshot-update' and commit.`,
  );
});

test("AC-4: expected 4 EN methodology snapshots are committed (per Story 4-2 AC-3)", () => {
  const expected = [
    // PR-12b (Story 11-1): all pages now emit directory-style index.html so the
    // served URL carries the trailing slash canonicalUrlFor() already uses
    // (icar-license.html → icar-license/index.html — fixes the no-slash 404).
    "en/provenance/icar-license/index.html",
    "en/scoring/overview/index.html",
    "en/scoring/percentile-to-iq/index.html",
    "en/scoring/uncertainty/index.html",
  ];
  const actualSorted = [...SNAPSHOT_FILES].sort();
  const expectedSet = new Set(expected);
  const missing = expected.filter((e) => !SNAPSHOT_FILES.includes(e));
  assert.deepEqual(missing, [], `missing snapshots: ${missing.join(", ")}; actual: ${actualSorted.join(", ")}`);
});

if (SNAPSHOT_FILES.length === 0) {
  test("AC-4: per-snapshot drift gate (skipped — no snapshots committed yet)", { skip: "no snapshots committed" }, () => {});
} else {
  for (const snapRel of SNAPSHOT_FILES) {
    test(`AC-4: methodology snapshot byte-match for ${snapRel}`, () => {
      const snapPath = join(SNAPSHOT_ROOT, snapRel);
      const buildDir = ensureBuild();
      // snapRel is `<lang>/<path>/index.html` (or `<lang>/<path>.html` for the
      // one non-folder page). Build emits at `<version>/<lang>/<path>...`.
      const buildPath = join(buildDir, CORPUS_VERSION, snapRel);
      assert.ok(
        existsSync(buildPath),
        `methodology snapshot drift at ${snapRel}: build did not emit ${relative(REPO_ROOT, buildPath)}. Run 'make snapshot-update' and commit both files together.`,
      );
      const snapBytes = readFileSync(snapPath);
      const buildBytes = readFileSync(buildPath);
      assert.equal(
        sha256(snapBytes),
        sha256(buildBytes),
        `methodology snapshot drift at ${snapRel}: run 'make snapshot-update' and commit both files together`,
      );
    });
  }
}

test("AC-2/AC-5: `make snapshot-update` is idempotent — second invocation produces byte-identical snapshot files", () => {
  // This is a smoke test against the *committed* snapshots. It does NOT
  // mutate them — instead, it regenerates into a tmpdir via IQME_SNAPSHOT_DIR
  // override and compares to the on-disk committed bytes.
  if (SNAPSHOT_FILES.length === 0) {
    assert.ok(true, "no committed snapshots to compare against — gate covered by the existence test above");
    return;
  }
  const tmpSnap = mkdtempSync(join(tmpdir(), "iqme-snap-idem-scaffold-"));
  try {
    const r = spawnSync("node", [resolve(REPO_ROOT, "tools/snapshot-update.mjs")], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, IQME_SNAPSHOT_DIR: tmpSnap },
    });
    assert.equal(r.status, 0, `snapshot-update failed: ${r.stderr}`);
    for (const rel of SNAPSHOT_FILES) {
      const committed = readFileSync(join(SNAPSHOT_ROOT, rel));
      const regenerated = readFileSync(join(tmpSnap, "methodology", rel));
      assert.equal(
        sha256(committed),
        sha256(regenerated),
        `idempotency drift for ${rel}: committed snapshot differs from fresh 'make snapshot-update' output. Re-run and re-commit.`,
      );
    }
  } finally {
    rmSync(tmpSnap, { recursive: true, force: true });
  }
});
