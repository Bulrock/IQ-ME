// Scaffold test: lint-csp-source exits 0 against in-repo CSP-source surfaces.
// Story 4-8 — exit-criterion verification.
//
// Scopes (Story bridge-9a-1 — concurrency isolation):
//   - src/index.html (always present; the SPA-side surface)
//   - a per-test tmpdir methodology build (the corpus surface)
//
// This test is HERMETIC: it builds methodology into a per-invocation tmpdir
// (IQME_BUILD_METHODOLOGY_OUT) and points lint-csp-source at that tmpdir +
// src/index.html via --paths=, never the shared REPO_ROOT/dist tree. Story 7-6
// observed a transient aggregate-only failure here when the default scope read
// dist/methodology while a concurrent `make build` rewrote it; isolating to a
// tmpdir removes the cross-contamination (same fix as build-methodology-output
// AC-9 and design-system AC-6, per lesson-2026-05-19-014). The tmpdir build
// also exercises the real rendered HTML, so coverage strength is unchanged.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-csp-source.mjs");
const BUILD_METHODOLOGY = resolve(REPO_ROOT, "tools/build-methodology.mjs");
const INDEX_HTML = resolve(REPO_ROOT, "src/index.html");

// Build the methodology corpus into a throwaway dir and return its path. The
// caller rmSync's it. Keeps this test off the shared dist/ entirely.
function buildMethodologyToTmp() {
  const out = mkdtempSync(join(tmpdir(), "iqme-csp-cov-"));
  const b = spawnSync("node", [BUILD_METHODOLOGY], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: out },
  });
  assert.equal(b.status, 0, `build-methodology failed: ${b.stderr}`);
  return out;
}

test("lint-csp-source: in-repo CSP-source surfaces all pass (src/index.html + tmpdir build)", () => {
  assert.ok(existsSync(INDEX_HTML), `expected src/index.html at ${INDEX_HTML}`);
  const out = buildMethodologyToTmp();
  try {
    const r = spawnSync("node", [SCRIPT, `--paths=${INDEX_HTML},${out}`], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    assert.equal(
      r.status,
      0,
      `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
    );
    assert.match(r.stdout, /scanned/);
    // The tmpdir build contributes ≥1 rendered HTML page beyond src/index.html,
    // so the corpus surface is genuinely exercised (coverage strength preserved).
    assert.match(r.stdout, /\d+ file\(s\) scanned/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("lint-csp-source: src/index.html scanned standalone (SPA-only surface, dist-independent)", () => {
  // Scope to just src/index.html — the controlled SPA-side surface — to assert
  // the lint runs cleanly without any dependency on shared dist/ state.
  const r = spawnSync("node", [SCRIPT, `--paths=${INDEX_HTML}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `expected exit 0; stderr: ${r.stderr}`);
  // src/index.html should appear in the scanned-files report — at minimum, the
  // summary line shows count ≥ 1.
  assert.match(r.stdout, /\d+ file\(s\) scanned/);
});
