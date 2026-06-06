// tests/pr18-gates.test.mjs
//
// NOTE FOR CI: Add this file to a dedicated CI job (e.g. `make lint && make build`).
// It is NOT picked up by the current `make test` glob (tests/unit/**/*.test.mjs)
// because it sits at tests/ root. The engineer must wire it at impl time.
//
// Story 11-1 — AC18: Gates green.
//   `make lint` exit 0
//   `make build` exit 0
//   Playwright/axe-core/network-trace suites pass (covered by individual specs)
//   Byte-stable build assertion holds (covered by byte-stable.spec.mjs)
//
// This vitest/node:test file covers the two non-Playwright gates:
//   - `make lint` — all registered lints pass (exit 0)
//   - `make build` — build pipeline produces output (exit 0)
//
// Both use Node stdlib `child_process.execSync` (NFR33 — no third-party deps).
// Each gate has its own test so failures are independently identifiable.
//
// IMPORTANT: These tests exercise the full `make lint` and `make build` pipeline.
// They will FAIL in the red phase if any PR-12a parity or any other lint fails,
// or if any build step is broken. They pass only once the implementation is complete
// and all lints + build steps are green.
//
// Timeout: 120 s each (full build can take up to 60 s on cold cache).
//
// Node 22 native `node:test` + `node:assert/strict`. Stdlib `child_process` only.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..");

/**
 * Run a shell command synchronously in the repo root.
 * Returns { exitCode, stdout, stderr }.
 * Never throws — captures exit code instead.
 *
 * @param {string} cmd
 * @param {number} [timeoutMs]
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function runCommand(cmd, timeoutMs = 120_000) {
  try {
    const stdout = execSync(cmd, {
      cwd: REPO_ROOT,
      stdio: "pipe",
      encoding: "utf8",
      timeout: timeoutMs,
    });
    return { exitCode: 0, stdout: String(stdout ?? ""), stderr: "" };
  } catch (err) {
    return {
      exitCode: typeof err.status === "number" ? err.status : 1,
      stdout: String(err.stdout ?? ""),
      stderr: String(err.stderr ?? ""),
    };
  }
}

// ─── AC18: make lint ─────────────────────────────────────────────────────────

test(
  "AC18: `make lint` exits 0 — all registered lint gates pass",
  { timeout: 120_000 },
  () => {
    const { exitCode, stdout, stderr } = runCommand("make lint", 120_000);
    assert.equal(
      exitCode,
      0,
      `AC18: \`make lint\` failed with exit code ${exitCode}.\n` +
      `stdout:\n${stdout.slice(0, 4000)}\n` +
      `stderr:\n${stderr.slice(0, 4000)}\n\n` +
      "Fix all lint failures before this gate can turn green. " +
      "Common causes after PR-12a: stale sourceHashEN in EN/RU/PL corpus files; " +
      "run the hash-bump tooling and bump sourceHashEN in every affected file.",
    );
  },
);

// ─── AC18: make build ────────────────────────────────────────────────────────

test(
  "AC18: `make build` exits 0 — full build pipeline succeeds",
  { timeout: 120_000 },
  () => {
    const { exitCode, stdout, stderr } = runCommand("make build", 120_000);
    assert.equal(
      exitCode,
      0,
      `AC18: \`make build\` failed with exit code ${exitCode}.\n` +
      `stdout:\n${stdout.slice(0, 4000)}\n` +
      `stderr:\n${stderr.slice(0, 4000)}\n\n` +
      "Fix all build failures. build-methodology and build-difficulty-bands " +
      "must both succeed and build-determinism-marker must emit cleanly.",
    );
  },
);

// ─── AC18: byte-stable build (two-run hash comparison) ───────────────────────
//
// The full byte-stable gate is covered by tests/playwright/byte-stable.spec.mjs.
// Here we add a lightweight node:test companion that verifies the
// build-determinism-marker tool exits 0 (it writes dist/determinism-marker.json).
// If the file is missing after `make build`, the marker tool exits non-zero → gate fails.

test(
  "AC18: build-determinism-marker exits 0 — deterministic build marker present after build",
  { timeout: 120_000 },
  () => {
    // Ensure build has run (run a clean build first to guarantee dist/ state).
    // We re-use the build output from the `make build` test above if in the same run;
    // but since node:test runs tests in parallel-ish order, we do a targeted invocation.
    const { exitCode, stdout, stderr } = runCommand(
      "node tools/build-determinism-marker.mjs",
      60_000,
    );
    assert.equal(
      exitCode,
      0,
      `AC18: build-determinism-marker.mjs failed with exit code ${exitCode}.\n` +
      `stdout:\n${stdout.slice(0, 2000)}\n` +
      `stderr:\n${stderr.slice(0, 2000)}\n\n` +
      "This script must exit 0 after `make build`. Check that dist/ exists and " +
      "build-methodology + build-difficulty-bands have both completed.",
    );
  },
);
