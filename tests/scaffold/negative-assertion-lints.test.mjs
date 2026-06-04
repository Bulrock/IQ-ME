// Story 1.6 — Acceptance tests for the six negative-assertion lints.
//
// Authored in test-author phase (frozen during specialist impl).
// Each lint must exit 0 on the current src/ tree AND exit non-zero when
// pointed at its fixture (via IQME_LINT_TARGET env var).
//
// Run: `node --test tests/scaffold/negative-assertion-lints.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Story bridge-9a-1 — concurrency isolation. `make lint` spawns lint-csp-source
// (scans dist/methodology). Redirect that scan to a fresh per-invocation tmpdir
// via IQME_DIST_DIR so a concurrent `make build` rewriting the shared dist/
// cannot cross-contaminate the AC-5 `make lint` assertion (lesson-2026-05-19-014).
function makeLintEnv() {
  return { ...process.env, IQME_DIST_DIR: mkdtempSync(join(tmpdir(), "iqme-nal-lint-")) };
}

const REPO_ROOT = join(import.meta.dirname, "..", "..");

const LINTS = [
  {
    script: "tools/lint-no-role-alert.mjs",
    fixtureDir: "tests/fixtures/lint-negative-assertions/no-role-alert",
  },
  {
    script: "tools/lint-no-share.mjs",
    fixtureDir: "tests/fixtures/lint-negative-assertions/no-share",
  },
  {
    script: "tools/lint-no-cookie-banner.mjs",
    fixtureDir: "tests/fixtures/lint-negative-assertions/no-cookie-banner",
  },
  {
    script: "tools/lint-no-analytics-script.mjs",
    fixtureDir: "tests/fixtures/lint-negative-assertions/no-analytics-script",
  },
  {
    script: "tools/lint-no-external-font.mjs",
    fixtureDir: "tests/fixtures/lint-negative-assertions/no-external-font",
  },
  {
    script: "tools/lint-no-localStorage-without-consent.mjs",
    fixtureDir: "tests/fixtures/lint-negative-assertions/no-localStorage-without-consent",
  },
];

function runLint(scriptPath, env = {}) {
  return spawnSync("node", [scriptPath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

for (const { script, fixtureDir } of LINTS) {
  test(`AC-4: ${script} exists`, () => {
    assert.ok(existsSync(join(REPO_ROOT, script)), `${script} missing`);
  });

  test(`AC-4: ${script} is stdlib-only (NFR33)`, () => {
    const source = readFileSync(join(REPO_ROOT, script), "utf8");
    const importRegex = /\b(?:from|import\()\s*["']([^"']+)["']/g;
    let m;
    const violations = [];
    while ((m = importRegex.exec(source)) !== null) {
      if (!m[1].startsWith("node:")) violations.push(m[1]);
    }
    assert.deepEqual(violations, [], `${script} must import only from node: stdlib. Found: ${violations.join(", ")}`);
  });

  test(`AC-4: ${script} is ≤ 80 LOC (NFR32 — kept tight; spec says ≤50 ideal)`, () => {
    const source = readFileSync(join(REPO_ROOT, script), "utf8");
    const loc = source.split("\n").filter((l) => l.trim().length > 0 && !l.trim().startsWith("//")).length;
    assert.ok(loc <= 80, `${script}: ${loc} LOC exceeds 80. Tighten the implementation.`);
  });

  test(`AC-4: ${script} exits 0 on current src/ tree`, () => {
    const r = runLint(join(REPO_ROOT, script));
    assert.equal(
      r.status,
      0,
      `${script} exited ${r.status} on current src/ tree. stderr:\n${r.stderr}\nstdout:\n${r.stdout}`,
    );
  });

  test(`AC-4: ${script} exits non-zero against fixture ${fixtureDir}`, () => {
    assert.ok(
      existsSync(join(REPO_ROOT, fixtureDir)),
      `${fixtureDir} missing — must contain at least one violation file`,
    );
    const r = runLint(join(REPO_ROOT, script), { IQME_LINT_TARGET: fixtureDir });
    assert.notEqual(
      r.status,
      0,
      `${script} should exit non-zero when targeted at ${fixtureDir} (which contains a violation). Got ${r.status}. stdout:\n${r.stdout}\nstderr:\n${r.stderr}`,
    );
    // Stderr should mention BREACH and the offending path.
    assert.match(
      r.stderr,
      /BREACH/i,
      `${script} should emit "BREACH" on stderr when violations found. stderr:\n${r.stderr}`,
    );
  });
}

// ─────────────────────────────────────────────────────────────────────
// AC-5: make lint chains all active lints
// ─────────────────────────────────────────────────────────────────────

test("AC-5: `make lint` exits 0 and chains all 7 active negative-assertion + budget lints", () => {
  const r = spawnSync("make", ["lint"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: makeLintEnv(),
  });
  assert.equal(r.status, 0, `make lint exit ${r.status}. stderr:\n${r.stderr}\nstdout:\n${r.stdout}`);
  // Each active lint should leave some visible footprint — either an OK line, an ok message, or just running
  // without error. We assert the budget lint's signature (already proven from Story 1.5) is present.
  assert.match(
    r.stdout,
    /OK \S+: \d+\/\d+ (lines|bytes|files)/,
    `make lint output missing budget lint footprint. stdout:\n${r.stdout}`,
  );
});
