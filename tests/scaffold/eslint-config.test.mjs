// Story 1.9 — Acceptance tests for eslint.config.mjs.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only — we don't invoke `eslint` locally (~50MB download).
// CI runs `eslint --max-warnings 0 .` via the pr-checks.yml `eslint` job.
//
// Run: `node --test tests/scaffold/eslint-config.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const ESLINT_CONFIG = join(REPO_ROOT, "eslint.config.mjs");
const WORKFLOW = join(REPO_ROOT, ".github", "workflows", "pr-checks.yml");

test("AC-1: eslint.config.mjs exists at repo root", () => {
  assert.ok(existsSync(ESLINT_CONFIG), `${ESLINT_CONFIG} missing`);
});

test("AC-1: eslint.config.mjs is loadable as an ES module (dynamic import succeeds)", async () => {
  // Use dynamic import — config files are ES modules.
  const mod = await import(`file://${ESLINT_CONFIG}`);
  assert.ok(Array.isArray(mod.default), `default export must be an array (flat-config); got ${typeof mod.default}`);
  assert.ok(mod.default.length > 0, `flat-config array must have at least one entry`);
});

test("AC-1: eslint.config.mjs declares no-restricted-imports with all five domain zones", () => {
  const source = readFileSync(ESLINT_CONFIG, "utf8");
  // Asserts the rule appears.
  assert.match(source, /no-restricted-imports/, `must declare no-restricted-imports rule`);
  // Asserts each domain path glob appears.
  for (const path of ["src/assessment", "src/scoring", "src/content", "tools", "tests"]) {
    assert.ok(
      source.includes(path),
      `eslint.config.mjs must reference path "${path}" in domain zones`,
    );
  }
});

test("AC-1: config sets ecmaVersion 2025 and sourceType module", () => {
  const source = readFileSync(ESLINT_CONFIG, "utf8");
  // Story 6.2 raised ecmaVersion from 2022 to 2025 — import-attributes
  // (`import x with { type: "json" }`) require ES2025-aware parser.
  // Allow either string or number form for ecmaVersion.
  assert.match(
    source,
    /ecmaVersion\s*:\s*(2025|"2025"|'2025')/,
    `must declare ecmaVersion: 2025`,
  );
  assert.match(
    source,
    /sourceType\s*:\s*["']module["']/,
    `must declare sourceType: "module"`,
  );
});

test("AC-4: pr-checks.yml has an active `eslint` job", () => {
  const text = readFileSync(WORKFLOW, "utf8");
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => /^  eslint:\s*$/.test(l));
  assert.notEqual(idx, -1, `pr-checks.yml must declare an "eslint:" job at top-level under jobs:`);
  let endIdx = lines.length;
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^  [\w-]+:\s*$/.test(lines[i])) { endIdx = i; break; }
  }
  const body = lines.slice(idx, endIdx).join("\n");
  assert.doesNotMatch(
    body,
    /^\s*if:\s*false/m,
    `eslint job must NOT carry "if: false" — Story 1.9 activates it. Body:\n${body}`,
  );
  assert.match(body, /eslint/, `eslint job body must invoke eslint. Body:\n${body}`);
});

test("AC-5: Makefile `lint` recipe invokes eslint via npx", () => {
  const text = readFileSync(join(REPO_ROOT, "Makefile"), "utf8");
  // Find the lint: recipe and assert eslint appears in its body.
  const m = text.match(/^lint:[^\n]*\n((?:\t[^\n]*\n)+)/m);
  assert.ok(m, `Makefile must have a lint: recipe with at least one indented body line`);
  assert.match(
    m[1],
    /npx --yes eslint/,
    `Makefile lint recipe must include "npx --yes eslint ...". Got:\n${m[1]}`,
  );
});
