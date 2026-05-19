// tests/unit/lint-css-source-co-equal.test.mjs
//
// Story 3.5 AC-10.1..10.5 — tools/lint-css-source-co-equal.mjs.
//
// Drives the lint via spawnSync with IQME_LINT_TARGET pointing at fixture
// CSS files. Pattern mirrors tests/unit/tools/lint-claims-manifest.test.mjs.
//
//   AC-10.1: parity-ok.css       → exit 0, stdout contains "ok".
//   AC-10.2: font-size-divergent → exit 1, stderr names "font-size".
//   AC-10.3: font-weight-divergent → exit 1, stderr names "font-weight".
//   AC-10.4: font-family-divergent → exit 1, stderr names "font-family".
//   AC-10.5: missing-declaration   → exit 1, stderr indicates missing property + selector.
//
// node:test + node:assert/strict + child_process.spawnSync.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-css-source-co-equal.mjs");
const FIXTURES = resolve(REPO_ROOT, "tests/fixtures/lint-css-source-co-equal");

function runLint(fixtureFile) {
  return spawnSync("node", [SCRIPT], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, IQME_LINT_TARGET: resolve(FIXTURES, fixtureFile) },
  });
}

// ─── AC-10.1 ─────────────────────────────────────────────────────────────

test("AC-10.1: parity-ok.css exits 0 and stdout contains 'ok'", () => {
  const r = runLint("parity-ok.css");
  assert.equal(
    r.status, 0,
    `expected exit 0 on parity-ok; got ${r.status}; stdout=${r.stdout}; stderr=${r.stderr}`,
  );
  assert.ok(/ok/i.test(r.stdout), `stdout must include 'ok'; got: ${r.stdout}`);
});

// ─── AC-10.2 ─────────────────────────────────────────────────────────────

test("AC-10.2: font-size-divergent.css exits 1 and stderr names 'font-size'", () => {
  const r = runLint("font-size-divergent.css");
  assert.equal(r.status, 1, `expected exit 1; got ${r.status}; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.ok(/font-size/i.test(r.stderr), `stderr must mention 'font-size'; got: ${r.stderr}`);
});

// ─── AC-10.3 ─────────────────────────────────────────────────────────────

test("AC-10.3: font-weight-divergent.css exits 1 and stderr names 'font-weight'", () => {
  const r = runLint("font-weight-divergent.css");
  assert.equal(r.status, 1, `expected exit 1; got ${r.status}; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.ok(/font-weight/i.test(r.stderr), `stderr must mention 'font-weight'; got: ${r.stderr}`);
});

// ─── AC-10.4 ─────────────────────────────────────────────────────────────

test("AC-10.4: font-family-divergent.css exits 1 and stderr names 'font-family'", () => {
  const r = runLint("font-family-divergent.css");
  assert.equal(r.status, 1, `expected exit 1; got ${r.status}; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.ok(/font-family/i.test(r.stderr), `stderr must mention 'font-family'; got: ${r.stderr}`);
});

// ─── AC-10.5 ─────────────────────────────────────────────────────────────

test("AC-10.5: missing-declaration.css exits 1 and stderr indicates the missing property + selector", () => {
  const r = runLint("missing-declaration.css");
  assert.equal(r.status, 1, `expected exit 1; got ${r.status}; stdout=${r.stdout}; stderr=${r.stderr}`);
  // The missing property in the fixture is font-family on .score-panel__band.
  assert.ok(
    /font-family/i.test(r.stderr),
    `stderr must mention the missing property 'font-family'; got: ${r.stderr}`,
  );
  assert.ok(
    /score-panel__band/.test(r.stderr),
    `stderr must mention the selector '.score-panel__band'; got: ${r.stderr}`,
  );
});
