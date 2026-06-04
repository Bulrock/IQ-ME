// tests/scaffold/lint-coverage-isolation.test.mjs
//
// Story bridge-9a-1 — isolate concurrency-sensitive coverage/lint tests.
//
// Story 7-6 observed a transient `lint-csp-source-coverage` aggregate-only
// failure: under `make test` file-parallelism, `determinism-harness.test.mjs`
// AC-2 runs `make clean && make build` (writing/removing the shared
// REPO_ROOT/dist tree) while `lint-csp-source-coverage.test.mjs` runs
// `lint-csp-source` at its DEFAULT scope, which scans `dist/methodology`. The
// reader observed partial `dist/` state mid-rewrite → spurious red, then
// self-cleared. Same flake class as the design-system AC-6 snapshot race fixed
// in 7.5b via tmpdir isolation (lesson-2026-05-19-014).
//
// This file is the permanent guard. It encodes the invariant directly:
//
//   A coverage/lint test must not read the shared REPO_ROOT/dist tree. It
//   scopes the linter to a controlled surface — `src/index.html` and/or a
//   per-test tmpdir build — so a concurrent `make build` can never
//   cross-contaminate it.
//
// Test A (structural): the coverage test never invokes lint-csp-source at
//   default scope (which reads shared dist/). RED against pre-fix source.
// Test B (behavioral): the hermetic invocation ignores a poisoned shared
//   dist/, while the default-scope invocation does observe it — proving the
//   shared-dist read is the real contamination vector.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const LINT = resolve(REPO_ROOT, "tools/lint-csp-source.mjs");
const INDEX_HTML = resolve(REPO_ROOT, "src/index.html");
const COVERAGE_TEST = resolve(REPO_ROOT, "tests/scaffold/lint-csp-source-coverage.test.mjs");

// A CSP-violating HTML body (inline <style> — class 1 violation per
// tools/lint-csp-source.mjs). Used to "poison" the shared dist/ the way a
// concurrent, partially-written `make build-methodology` could.
const POISON_HTML = "<!doctype html><html><head><style>body{color:red}</style></head><body></body></html>";

function runLint(args = []) {
  return spawnSync("node", [LINT, ...args], { cwd: REPO_ROOT, encoding: "utf8" });
}

// ─── Test A — structural invariant (RED against pre-fix coverage source) ───
//
// The coverage test must scope every lint-csp-source spawn (via --paths= or an
// explicit dist override env). A bare `spawnSync("node", [SCRIPT], …)` with no
// --paths falls through to defaultScope() → scans shared dist/methodology.

test("bridge-9a-1: lint-csp-source-coverage never scans the shared dist/ (hermetic invocation)", () => {
  assert.ok(existsSync(COVERAGE_TEST), `missing coverage test at ${COVERAGE_TEST}`);
  const src = readFileSync(COVERAGE_TEST, "utf8");

  // Every spawn of the lint must carry a --paths= scope. We detect un-scoped
  // spawns: a spawnSync whose argv array is just [SCRIPT] with no "--paths".
  // Heuristic mirrors the actual invocation shape used in this repo's coverage
  // tests: `spawnSync("node", [SCRIPT], { … })` (default scope) vs
  // `spawnSync("node", [SCRIPT, "--paths=…"], …)` (scoped).
  const spawnsLint = /spawnSync\(\s*["']node["']\s*,\s*\[\s*SCRIPT\s*\]/.test(src);
  assert.ok(
    !spawnsLint,
    "lint-csp-source-coverage.test.mjs invokes lint-csp-source at DEFAULT scope " +
      "(spawnSync(\"node\", [SCRIPT], …) with no --paths), which scans the shared " +
      "REPO_ROOT/dist tree and races a concurrent `make build`. Scope it to " +
      "src/index.html + a per-test tmpdir build via --paths= (lesson-2026-05-19-014).",
  );

  // Positive form: the test must reference --paths= (the scoping affordance).
  assert.match(
    src,
    /--paths=/,
    "coverage test must scope lint-csp-source via --paths= to a controlled surface",
  );
});

// ─── Test B — behavioral hermeticity under a poisoned shared dist/ ─────────

test("bridge-9a-1: scoped lint ignores a poisoned shared dist/, default scope does not", () => {
  // Build a clean controlled surface in a per-test tmpdir (stand-in for the
  // coverage test's tmpdir build output).
  const tmpOut = mkdtempSync(join(tmpdir(), "iqme-csp-iso-"));
  const cleanHtml = join(tmpOut, "clean.html");
  writeFileSync(cleanHtml, "<!doctype html><html><head></head><body><main></main></body></html>");

  // Poison the SHARED dist/ the way a concurrent partial `make build` would —
  // into a dedicated subdir we fully own, so we never disturb a real build.
  const poisonDir = resolve(REPO_ROOT, "dist/methodology/_bridge-9a-race-poison");
  mkdirSync(poisonDir, { recursive: true });
  const poisonFile = join(poisonDir, "index.html");
  writeFileSync(poisonFile, POISON_HTML);

  try {
    // Hermetic invocation (the FIXED coverage approach): scope to a controlled
    // surface — never the shared dist/. Must pass despite the poison.
    const scoped = runLint([`--paths=${INDEX_HTML},${cleanHtml}`]);
    assert.equal(
      scoped.status,
      0,
      `scoped lint must be hermetic against poisoned shared dist/; got exit ${scoped.status}\n` +
        `stdout: ${scoped.stdout}\nstderr: ${scoped.stderr}`,
    );

    // Vector proof: the DEFAULT-scope invocation (the pre-fix coverage path)
    // DOES read the shared dist/ and so observes the poison → exit 1. This is
    // exactly the cross-contamination the structural guard above forbids.
    const unscoped = runLint();
    assert.equal(
      unscoped.status,
      1,
      "default-scope lint-csp-source should scan the poisoned shared dist/ and fail " +
        "(exit 1) — demonstrating that reading shared dist/ is the contamination vector. " +
        `got exit ${unscoped.status}\nstdout: ${unscoped.stdout}\nstderr: ${unscoped.stderr}`,
    );
  } finally {
    rmSync(poisonDir, { recursive: true, force: true });
    rmSync(tmpOut, { recursive: true, force: true });
  }
});
