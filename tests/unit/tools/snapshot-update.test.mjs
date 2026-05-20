// tests/unit/tools/snapshot-update.test.mjs
//
// Story 4.2 (TDD red phase) — unit tests for the extended
// tools/snapshot-update.mjs. The Story 1.10 behavior (tokens.hash.json) is
// preserved as a regression guard; the new methodology-snapshot writer is
// driven by these tests.
//
// Env contract used by these tests (engineer wires it in Phase B):
//   - IQME_SNAPSHOT_DIR      — overrides the default `tests/snapshots/` dir.
//   - IQME_SNAPSHOT_SRC_BUILD — points the methodology-snapshot phase at a
//     pre-built tmpdir output (skips invoking the builder again). When unset,
//     snapshot-update builds methodology to a mkdtempSync tmpdir internally.
//
// Per-test mkdtempSync per Story 3-6 carry-forward.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SNAPSHOT_UPDATE = resolve(REPO_ROOT, "tools/snapshot-update.mjs");
const BUILD_METHODOLOGY = resolve(REPO_ROOT, "tools/build-methodology.mjs");

function runSnapshotUpdate(snapshotDir, extraEnv = {}) {
  return spawnSync("node", [SNAPSHOT_UPDATE], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      IQME_SNAPSHOT_DIR: snapshotDir,
      ...extraEnv,
    },
  });
}

function buildMethodologyToTmp() {
  const out = mkdtempSync(join(tmpdir(), "iqme-snap-src-"));
  const r = spawnSync("node", [BUILD_METHODOLOGY], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: out },
  });
  if (r.status !== 0) {
    rmSync(out, { recursive: true, force: true });
    throw new Error(`build-methodology failed: ${r.stderr}`);
  }
  return out;
}

function walkFiles(root, rel = "") {
  const acc = [];
  for (const e of readdirSync(join(root, rel), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const r = rel ? join(rel, e.name) : e.name;
    if (e.isDirectory()) acc.push(...walkFiles(root, r));
    else if (e.isFile()) acc.push(r);
  }
  return acc;
}

function sha256OfFile(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

test("AC-2 regression: tokens.hash.json still emitted at <IQME_SNAPSHOT_DIR>/tokens.hash.json", () => {
  const snapDir = mkdtempSync(join(tmpdir(), "iqme-snap-tokens-"));
  try {
    const r = runSnapshotUpdate(snapDir);
    assert.equal(r.status, 0, `stdout=${r.stdout} stderr=${r.stderr}`);
    const tokensPath = join(snapDir, "tokens.hash.json");
    assert.ok(existsSync(tokensPath), `expected tokens.hash.json at ${tokensPath}`);
    const j = JSON.parse(readFileSync(tokensPath, "utf8"));
    assert.match(j.primitives_semantic_sha256, /^[0-9a-f]{64}$/, "expected sha256 hex string");
    assert.equal(j.generated_at, "1970-01-01T00:00:00.000Z", "expected frozen timestamp");
  } finally {
    rmSync(snapDir, { recursive: true, force: true });
  }
});

test("AC-2: methodology snapshots emitted at <snap>/methodology/en/<path>/index.html mirroring build output minus version segment", () => {
  const snapDir = mkdtempSync(join(tmpdir(), "iqme-snap-meth-"));
  const srcBuild = buildMethodologyToTmp();
  try {
    const r = runSnapshotUpdate(snapDir, { IQME_SNAPSHOT_SRC_BUILD: srcBuild });
    assert.equal(r.status, 0, `stdout=${r.stdout} stderr=${r.stderr}`);

    const expected = [
      "methodology/en/scoring/percentile-to-iq/index.html",
      "methodology/en/scoring/uncertainty/index.html",
      "methodology/en/scoring/overview/index.html",
      "methodology/en/provenance/icar-license.html",
    ];
    for (const rel of expected) {
      const p = join(snapDir, rel);
      assert.ok(existsSync(p), `expected snapshot at ${p}`);
      const html = readFileSync(p, "utf8");
      assert.ok(html.length > 0, `${p} is empty`);
      assert.ok(/<!doctype html>/i.test(html), `${p} missing doctype`);
      assert.ok(/<main>/.test(html), `${p} missing <main>`);
    }
  } finally {
    rmSync(snapDir, { recursive: true, force: true });
    rmSync(srcBuild, { recursive: true, force: true });
  }
});

test("AC-2: snapshot bytes byte-identical to source build (no transformation)", () => {
  const snapDir = mkdtempSync(join(tmpdir(), "iqme-snap-bytes-"));
  const srcBuild = buildMethodologyToTmp();
  try {
    const r = runSnapshotUpdate(snapDir, { IQME_SNAPSHOT_SRC_BUILD: srcBuild });
    assert.equal(r.status, 0, `stdout=${r.stdout} stderr=${r.stderr}`);

    const pairs = [
      ["v0.1.0/en/scoring/percentile-to-iq/index.html", "methodology/en/scoring/percentile-to-iq/index.html"],
      ["v0.1.0/en/scoring/uncertainty/index.html", "methodology/en/scoring/uncertainty/index.html"],
      ["v0.1.0/en/scoring/overview/index.html", "methodology/en/scoring/overview/index.html"],
      ["v0.1.0/en/provenance/icar-license.html", "methodology/en/provenance/icar-license.html"],
    ];
    for (const [srcRel, snapRel] of pairs) {
      const a = readFileSync(join(srcBuild, srcRel));
      const b = readFileSync(join(snapDir, snapRel));
      assert.equal(
        createHash("sha256").update(a).digest("hex"),
        createHash("sha256").update(b).digest("hex"),
        `byte mismatch for ${snapRel}`,
      );
    }
  } finally {
    rmSync(snapDir, { recursive: true, force: true });
    rmSync(srcBuild, { recursive: true, force: true });
  }
});

test("AC-2 idempotency: running snapshot-update twice produces byte-identical files (no timestamp/tmpdir leakage)", () => {
  const snapDir = mkdtempSync(join(tmpdir(), "iqme-snap-idem-"));
  const srcBuild = buildMethodologyToTmp();
  try {
    const r1 = runSnapshotUpdate(snapDir, { IQME_SNAPSHOT_SRC_BUILD: srcBuild });
    assert.equal(r1.status, 0, `run1 stderr=${r1.stderr}`);
    const files1 = walkFiles(snapDir).sort();
    const hashes1 = files1.map((f) => [f, sha256OfFile(join(snapDir, f))]);

    const r2 = runSnapshotUpdate(snapDir, { IQME_SNAPSHOT_SRC_BUILD: srcBuild });
    assert.equal(r2.status, 0, `run2 stderr=${r2.stderr}`);
    const files2 = walkFiles(snapDir).sort();
    const hashes2 = files2.map((f) => [f, sha256OfFile(join(snapDir, f))]);

    assert.deepEqual(files2, files1, "file list differs between runs");
    assert.deepEqual(hashes2, hashes1, "byte content differs between runs");
  } finally {
    rmSync(snapDir, { recursive: true, force: true });
    rmSync(srcBuild, { recursive: true, force: true });
  }
});

test("AC-2: missing-source build dir → snapshot-update fails with clear message and emits no methodology snapshots", () => {
  const snapDir = mkdtempSync(join(tmpdir(), "iqme-snap-missing-"));
  const bogusSrc = join(tmpdir(), "iqme-does-not-exist-" + Math.random().toString(36).slice(2));
  try {
    const r = runSnapshotUpdate(snapDir, { IQME_SNAPSHOT_SRC_BUILD: bogusSrc });
    assert.notEqual(r.status, 0, `expected non-zero exit; stdout=${r.stdout} stderr=${r.stderr}`);
    // No partial-write of methodology snapshots — only tokens may exist.
    const methDir = join(snapDir, "methodology", "en");
    if (existsSync(methDir)) {
      const orphans = walkFiles(methDir);
      assert.deepEqual(orphans, [], `partial methodology snapshots leaked: ${orphans.join(", ")}`);
    }
  } finally {
    rmSync(snapDir, { recursive: true, force: true });
  }
});

test("AC-2: snapshot tree mirror is version-agnostic — no v0.1.0/ or latest/ segment appears under <snap>/methodology/", () => {
  const snapDir = mkdtempSync(join(tmpdir(), "iqme-snap-versionless-"));
  const srcBuild = buildMethodologyToTmp();
  try {
    const r = runSnapshotUpdate(snapDir, { IQME_SNAPSHOT_SRC_BUILD: srcBuild });
    assert.equal(r.status, 0, `stderr=${r.stderr}`);

    const methRoot = join(snapDir, "methodology");
    assert.ok(existsSync(methRoot), `expected methodology/ dir at ${methRoot}`);
    const files = walkFiles(methRoot);
    for (const f of files) {
      assert.ok(!/^v\d+\.\d+\.\d+\//.test(f), `version segment leaked into snapshot path: ${f}`);
      assert.ok(!/^latest\//.test(f), `'latest' segment leaked into snapshot path: ${f}`);
      // First segment must be a language code.
      const first = f.split("/")[0];
      assert.match(first, /^[a-z]{2}$/, `unexpected top-level segment under methodology/: ${first}`);
    }
  } finally {
    rmSync(snapDir, { recursive: true, force: true });
    rmSync(srcBuild, { recursive: true, force: true });
  }
});
