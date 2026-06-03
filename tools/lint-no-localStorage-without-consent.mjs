#!/usr/bin/env node
// tools/lint-no-localStorage-without-consent.mjs
//
// Negative-assertion lint: forbids `localStorage.setItem(` without an
// explicit consent guard. v1 heuristic: any occurrence is a violation.
// Future refinement (Story 6.7): allow inside `if (consent)` block.
// Test injection: env IQME_LINT_TARGET=<path> overrides the scan root.
// Stdlib-only per NFR33.

import { readFileSync, globSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const TARGET = process.env.IQME_LINT_TARGET || "src";
const SCAN_DIR = resolve(REPO_ROOT, TARGET);
const FORBIDDEN = /\blocalStorage\.setItem\s*\(/;
const FILES_GLOB = `${SCAN_DIR}/**/*.{js,mjs,ts,tsx,jsx,html}`;

// Allowlist: files whose localStorage.setItem calls are gated by an
// explicit user gesture (per NFR9). Each entry must point at a file that
// only writes localStorage inside a user-event handler — never on load.
// Story 6.4 AC-3: theme.js writes only inside radio-change handlers; the
// unit test (tests/unit/theme.test.mjs AC-10.a) + Playwright spec
// (tests/playwright/chrome-components.spec.mjs Test 2) assert zero writes
// during bootstrap.
// Story 6.7: save-result.js writes only inside the score-panel Save-button
// click handler (an explicit user gesture, per NFR9 / FR26); the unit tests
// (tests/unit/save-result.test.mjs AC-3 + tests/unit/result-save-retest.test.mjs
// AC-3) assert zero writes at import/render time.
const ALLOWLIST = new Set([
  resolve(REPO_ROOT, "src/assessment/theme.js"),
  resolve(REPO_ROOT, "src/assessment/save-result.js"),
]);

const files = globSync(FILES_GLOB);
const violations = [];
for (const f of files) {
  if (ALLOWLIST.has(f)) continue;
  if (FORBIDDEN.test(readFileSync(f, "utf8"))) violations.push(f);
}

if (violations.length === 0) {
  process.stdout.write(`lint-no-localStorage-without-consent: ok (${files.length} files scanned)\n`);
  process.exit(0);
}
for (const f of violations) {
  process.stderr.write(`BREACH lint-no-localStorage-without-consent: ${f} calls localStorage.setItem() without consent guard\n`);
}
process.exit(1);
