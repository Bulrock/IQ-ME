#!/usr/bin/env node
// tools/snapshot-update.mjs
//
// Story 1.10 — recomputes tests/snapshots/tokens.hash.json from the current
// state of src/css/primitives.css + src/css/semantic.css.
//
// Story 4.2 — extended to also emit golden HTML snapshots of every
// methodology page at tests/snapshots/methodology/<lang>/<path>/index.html
// (version segment stripped — snapshot asserts content invariance, not
// path-versioning, which build-methodology covers separately).
//
// This is the codified D→E write exception (per docs/domain-map.md): tools/
// writes into tests/snapshots/ via this single, target-gated script.
//
// Idempotent: running twice in a row produces byte-identical output files.
// Stdlib-only per NFR33.
//
// Env contract:
//   IQME_SNAPSHOT_DIR        Override snapshot root (default: tests/snapshots).
//                            Used by tests/unit/tools/snapshot-update.test.mjs.
//   IQME_SNAPSHOT_SRC_BUILD  Use pre-built methodology output dir instead of
//                            invoking the builder. Used by tests for speed +
//                            for the AC-2 missing-source failure path.

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { exit, stderr, stdout, env } from "node:process";
import { DETERMINISM } from "./determinism-harness.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const SNAPSHOT_DIR = resolve(REPO_ROOT, env.IQME_SNAPSHOT_DIR || "tests/snapshots");
const SNAPSHOT_PATH = resolve(SNAPSHOT_DIR, "tokens.hash.json");
const METHODOLOGY_SNAPSHOT_DIR = resolve(SNAPSHOT_DIR, "methodology");
const BUILD_METHODOLOGY = resolve(REPO_ROOT, "tools/build-methodology.mjs");

function die(msg) {
  stderr.write(`snapshot-update: ERROR ${msg}\n`);
  exit(1);
}

// ─── tokens.hash.json (Story 1.10) ───────────────────────────────────────────

function writeTokensHash() {
  const files = [
    resolve(REPO_ROOT, "src/css/primitives.css"),
    resolve(REPO_ROOT, "src/css/semantic.css"),
  ].sort();
  const hash = createHash("sha256");
  for (const f of files) hash.update(readFileSync(f));
  const sha = hash.digest("hex");
  const snapshot = {
    primitives_semantic_sha256: sha,
    generated_at: DETERMINISM.FROZEN_TIMESTAMP_ISO,
  };
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
  stdout.write(`snapshot-update: tests/snapshots/tokens.hash.json sha256=${sha}\n`);
}

// ─── methodology snapshots (Story 4.2) ───────────────────────────────────────

// Sorted directory walk — deterministic across filesystems with arbitrary
// readdir order. Returns relative paths to *.html under root.
function walkHtml(root, rel = "") {
  const acc = [];
  const here = rel ? join(root, rel) : root;
  let entries;
  try {
    entries = readdirSync(here, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return acc;
    throw e;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    const childRel = rel ? join(rel, e.name) : e.name;
    if (e.isDirectory()) {
      acc.push(...walkHtml(root, childRel));
    } else if (e.isFile() && e.name.endsWith(".html")) {
      acc.push(childRel);
    }
  }
  return acc;
}

// Resolve the methodology build output dir. Either:
//   1. IQME_SNAPSHOT_SRC_BUILD points at an existing dir → use it.
//   2. invoke tools/build-methodology.mjs into a mkdtempSync tmpdir.
// Returns { dir, ownedTmp } — caller must rmSync(ownedTmp) when done.
function resolveMethodologyBuild() {
  const fromEnv = env.IQME_SNAPSHOT_SRC_BUILD;
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      die(`IQME_SNAPSHOT_SRC_BUILD points at non-existent dir: ${fromEnv}`);
    }
    return { dir: resolve(fromEnv), ownedTmp: null };
  }
  const tmp = mkdtempSync(join(tmpdir(), "iqme-snap-build-"));
  const r = spawnSync("node", [BUILD_METHODOLOGY], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...env, IQME_BUILD_METHODOLOGY_OUT: tmp },
  });
  if (r.status !== 0) {
    rmSync(tmp, { recursive: true, force: true });
    die(`build-methodology failed (status=${r.status}): ${r.stderr || r.stdout}`);
  }
  return { dir: tmp, ownedTmp: tmp };
}

// Identify the version segment to strip. build-methodology emits two parallel
// trees: `<corpus-version>/<lang>/...` and `latest/<lang>/...` (byte-identical
// per Story 4.1 AC-4). We snapshot the versioned tree and drop the version
// segment.
function pickVersionedRoot(buildDir) {
  let entries;
  try {
    entries = readdirSync(buildDir, { withFileTypes: true });
  } catch (e) {
    die(`reading methodology build dir ${buildDir}: ${e.message}`);
  }
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const versioned = dirs.find((d) => /^v\d+\.\d+\.\d+$/.test(d));
  if (!versioned) {
    die(`methodology build dir ${buildDir} contains no v<semver> subdir (found: ${dirs.join(", ") || "(empty)"})`);
  }
  return { versionSegment: versioned, root: join(buildDir, versioned) };
}

function writeMethodologySnapshots() {
  const { dir: buildDir, ownedTmp } = resolveMethodologyBuild();
  try {
    const { versionSegment, root } = pickVersionedRoot(buildDir);
    // Clean the methodology snapshot tree first so a removed source page
    // doesn't leave an orphan snapshot. Idempotency holds either way (we
    // re-create the same files), but explicit clean keeps the tree honest.
    if (existsSync(METHODOLOGY_SNAPSHOT_DIR)) {
      rmSync(METHODOLOGY_SNAPSHOT_DIR, { recursive: true, force: true });
    }
    mkdirSync(METHODOLOGY_SNAPSHOT_DIR, { recursive: true });

    const files = walkHtml(root);
    if (files.length === 0) {
      die(`no *.html files under ${root}; refusing to write an empty snapshot tree`);
    }
    for (const rel of files) {
      const src = join(root, rel);
      const dest = join(METHODOLOGY_SNAPSHOT_DIR, rel);
      mkdirSync(dirname(dest), { recursive: true });
      // copyFileSync preserves bytes exactly; no transformation.
      copyFileSync(src, dest);
    }
    stdout.write(
      `snapshot-update: tests/snapshots/methodology/ ${files.length} page(s) (version segment ${versionSegment} stripped)\n`,
    );
  } finally {
    if (ownedTmp) rmSync(ownedTmp, { recursive: true, force: true });
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  writeTokensHash();
  writeMethodologySnapshots();
}

main();
