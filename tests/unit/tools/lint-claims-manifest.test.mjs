// Unit tests for tools/lint-claims-manifest.mjs.
// Story 2-7: red-phase failing tests authored pre-implementation.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-claims-manifest.mjs");

function runLint(args, cwd) {
  return spawnSync("node", [SCRIPT, ...args], {
    cwd: cwd ?? REPO_ROOT,
    encoding: "utf8",
  });
}

// AC-4.1 — Default invocation in warn-mode against real manifest exits 0.
test("lint-claims-manifest: warn-mode exits 0 on real manifest (no methodology pages yet)", () => {
  const result = runLint([]);
  assert.equal(
    result.status,
    0,
    `expected exit 0; got ${result.status}; stderr: ${result.stderr}`,
  );
  // Should emit WARN lines but not exit 1.
  assert.ok(
    result.stderr.includes("WARN") || result.stdout.includes("WARN"),
    "expected WARN lines in output when methodology pages missing",
  );
});

// AC-4.2 — --strict invocation exits 1 against real manifest (methodology pages missing).
test("lint-claims-manifest: --strict exits 1 when methodology pages missing", () => {
  const result = runLint(["--strict"]);
  assert.equal(result.status, 1, `expected exit 1; got ${result.status}`);
  assert.ok(
    result.stderr.includes("ERROR") || result.stdout.includes("ERROR"),
    "expected ERROR lines in --strict mode",
  );
});

// AC-4.3 — Mock methodology page with correct asserts → that claim emits no warning.
test("lint-claims-manifest: claim with matching methodology page emits no warning for that claim", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-"));
  try {
    // Build a minimal fixture with 1 claim + a matching methodology page.
    const manifest = {
      version: "1.0.0",
      claims: [
        {
          "claim-id": "test-claim",
          "engine-source": "src/scoring/irt/eap.js",
          "methodology-path": "src/content/methodology/en/test/page.md",
          "value-or-formula": "test = 1",
        },
      ],
    };
    writeFileSync(join(dir, "METHODOLOGY_CLAIMS.json"), JSON.stringify(manifest));
    mkdirSync(join(dir, "src/scoring/irt"), { recursive: true });
    writeFileSync(join(dir, "src/scoring/irt/eap.js"), "// stub\n");
    mkdirSync(join(dir, "src/content/methodology/en/test"), { recursive: true });
    writeFileSync(
      join(dir, "src/content/methodology/en/test/page.md"),
      "---\ntitle: test\nasserts: [test-claim]\n---\n\nbody\n",
    );

    const result = runLint([], dir);
    assert.equal(result.status, 0, `expected exit 0; got ${result.status}; stderr: ${result.stderr}`);
    assert.ok(
      !result.stderr.includes("test-claim") || !result.stderr.includes("WARN"),
      `test-claim should not WARN when page asserts it; stderr: ${result.stderr}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-4.4 — Broken JSON exits 1.
test("lint-claims-manifest: broken JSON manifest exits 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-"));
  try {
    writeFileSync(join(dir, "METHODOLOGY_CLAIMS.json"), "{ not valid json");
    const result = runLint([], dir);
    assert.equal(result.status, 1, `expected exit 1; got ${result.status}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-4.5 — Missing manifest file exits 1.
test("lint-claims-manifest: missing manifest exits 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-"));
  try {
    const result = runLint([], dir);
    assert.equal(result.status, 1, `expected exit 1; got ${result.status}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
