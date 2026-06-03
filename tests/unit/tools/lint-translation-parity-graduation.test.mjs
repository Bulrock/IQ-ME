// Unit tests for tools/lint-translation-parity.mjs — Story 7.5b graduation.
//
// Red-phase failing tests authored pre-implementation. The Story-4.7 stub only
// WARNs on empty + 64-hex-validates sourceHashEN and emits a "deferred to Epic 7"
// summary. Story 7.5b graduates the lint to FULL tri-locale parity coverage:
//   (a) missing counterpart  → exit 1
//   (b) orphan (no EN match)  → exit 1
//   (c) stale sourceHashEN    → exit 1  (valid 64-hex but != SHA256(en body))
//   (d) full parity tree      → exit 0  + per-locale "parity-green" / N/N summary
//
// Fixtures are SYNTHETIC and built in a mkdtemp tmpdir. The lint is pointed at
// the tmp tree via env IQME_METHODOLOGY_ROOT (resolved relative to repo root by
// the script; an absolute path passes through resolve() unchanged → exercises
// the fixtures, not the real corpus).
//
// Hash contract mirrors build-methodology.mjs enSourceHashFor exactly:
//   text → split(/\r?\n/) → body = lines after the closing "---" joined by "\n"
//   → sha256(body, utf8).digest("hex").

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-translation-parity.mjs");

// Mirror of build-methodology.mjs enSourceHashFor body extraction + hash.
function enSourceHash(fullPageText) {
  const lines = fullPageText.split(/\r?\n/);
  if (lines[0] !== "---") throw new Error("fixture missing frontmatter");
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) throw new Error("fixture missing closing ---");
  const body = lines.slice(end + 1).join("\n");
  return createHash("sha256").update(body, "utf8").digest("hex");
}

// Minimal valid frontmatter for the stub's parser: it only needs sourceHashEN
// (+ translationStatus is the other field the lint may inspect).
function enPage(body) {
  return [
    "---",
    'title: "EN page"',
    "---",
    "",
    body,
    "",
  ].join("\n");
}

function nonEnPage(sourceHashEN, body) {
  return [
    "---",
    'title: "Translated page"',
    'translationStatus: "complete"',
    `sourceHashEN: "${sourceHashEN}"`,
    "---",
    "",
    body,
    "",
  ].join("\n");
}

function writePage(dir, locale, relPath, content) {
  const full = join(dir, locale, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

// Run the lint with the methodology root overridden to the tmp fixture tree.
// Absolute path → resolve(REPO_ROOT, abs) === abs, so the script reads the tmp
// en/ ru/ pl/ subtrees rather than the real src/content/methodology corpus.
function runLint(methodologyRoot) {
  return spawnSync("node", [SCRIPT], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, IQME_METHODOLOGY_ROOT: methodologyRoot },
  });
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-parity-grad-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// AC-1 / AC-2 — full tri-locale parity → exit 0 + per-locale parity-green summary.
test("lint-translation-parity (7.5b): full parity tri-locale tree exits 0 with parity-green summary", () => {
  withFixture((dir) => {
    const bodyA = "# Alpha\n\nAlpha body line.";
    const bodyB = "# Beta\n\nBeta body line.";
    writePage(dir, "en", "alpha/index.md", enPage(bodyA));
    writePage(dir, "en", "beta/index.md", enPage(bodyB));
    const hashA = enSourceHash(enPage(bodyA));
    const hashB = enSourceHash(enPage(bodyB));
    for (const locale of ["ru", "pl"]) {
      writePage(dir, locale, "alpha/index.md", nonEnPage(hashA, bodyA));
      writePage(dir, locale, "beta/index.md", nonEnPage(hashB, bodyB));
    }

    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}\nstdout: ${r.stdout}`);
    const out = r.stdout + r.stderr;
    // Per-locale parity-green summary for both non-EN locales (2/2 or parity-green).
    assert.match(out, /RU.*(parity-green|2\s*\/\s*2)/i, "RU parity-green summary missing");
    assert.match(out, /PL.*(parity-green|2\s*\/\s*2)/i, "PL parity-green summary missing");
    // Must NOT still emit the deferred-to-Epic-7 stub line.
    assert.doesNotMatch(out, /deferred to Epic 7/i, "stub deferral line must be gone");
  });
});

// AC-1(a) — missing counterpart: EN page with no RU counterpart → exit 1.
test("lint-translation-parity (7.5b): EN page missing RU counterpart exits 1", () => {
  withFixture((dir) => {
    const bodyA = "# Alpha\n\nAlpha body.";
    writePage(dir, "en", "alpha/index.md", enPage(bodyA));
    const hashA = enSourceHash(enPage(bodyA));
    // PL present, RU absent → RU is missing a counterpart.
    writePage(dir, "pl", "alpha/index.md", nonEnPage(hashA, bodyA));

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}\nstdout: ${r.stdout}`);
    const out = r.stdout + r.stderr;
    assert.match(out, /missing/i, "should report a missing counterpart");
    assert.match(out, /alpha\/index\.md/, "should name the missing page path");
    assert.match(out, /\bRU\b|\bru\b/, "should name the RU locale as the missing one");
  });
});

// AC-1(b) — orphan: RU page with no EN counterpart → exit 1.
test("lint-translation-parity (7.5b): RU orphan with no EN counterpart exits 1", () => {
  withFixture((dir) => {
    // EN tree has only alpha; RU has an extra orphan page.
    const bodyA = "# Alpha\n\nAlpha body.";
    writePage(dir, "en", "alpha/index.md", enPage(bodyA));
    const hashA = enSourceHash(enPage(bodyA));
    writePage(dir, "ru", "alpha/index.md", nonEnPage(hashA, bodyA));
    writePage(dir, "pl", "alpha/index.md", nonEnPage(hashA, bodyA));
    // Orphan: RU page whose relative path has no EN counterpart.
    const orphanHash = "a".repeat(64);
    writePage(dir, "ru", "ghost/index.md", nonEnPage(orphanHash, "# Ghost\n\nbody"));

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}\nstdout: ${r.stdout}`);
    const out = r.stdout + r.stderr;
    assert.match(out, /orphan/i, "should report an orphan");
    assert.match(out, /ghost\/index\.md/, "should name the orphan page path");
  });
});

// AC-1(c) / AC-3 — stale hash: RU sourceHashEN is valid 64-hex but != EN body SHA256.
test("lint-translation-parity (7.5b): stale sourceHashEN (valid hex, wrong value) exits 1", () => {
  withFixture((dir) => {
    const bodyA = "# Alpha\n\nAuthentic alpha body.";
    writePage(dir, "en", "alpha/index.md", enPage(bodyA));
    const correctHash = enSourceHash(enPage(bodyA));
    // Valid 64-hex but deliberately different from the true EN body hash.
    const staleHash = correctHash === "b".repeat(64) ? "c".repeat(64) : "b".repeat(64);
    assert.notEqual(staleHash, correctHash);
    writePage(dir, "ru", "alpha/index.md", nonEnPage(staleHash, bodyA));
    // PL is correct so the only failure is the RU stale hash.
    writePage(dir, "pl", "alpha/index.md", nonEnPage(correctHash, bodyA));

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}\nstdout: ${r.stdout}`);
    const out = r.stdout + r.stderr;
    assert.match(out, /stale|drift|mismatch|does not match/i, "should report stale/drift");
    assert.match(out, /alpha\/index\.md/, "should name the stale page path");
  });
});

// AC-1 (defensive retained) — malformed sourceHashEN (not 64-hex) → exit 1.
test("lint-translation-parity (7.5b): malformed sourceHashEN exits 1", () => {
  withFixture((dir) => {
    const bodyA = "# Alpha\n\nbody.";
    writePage(dir, "en", "alpha/index.md", enPage(bodyA));
    const hashA = enSourceHash(enPage(bodyA));
    // RU malformed (63 hex chars), PL correct.
    writePage(dir, "ru", "alpha/index.md", nonEnPage("0".repeat(63), bodyA));
    writePage(dir, "pl", "alpha/index.md", nonEnPage(hashA, bodyA));

    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}\nstdout: ${r.stdout}`);
    assert.match(r.stdout + r.stderr, /sourceHashEN|hex/i, "should report the malformed hash");
  });
});
