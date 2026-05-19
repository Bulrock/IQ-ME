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

const files = globSync(FILES_GLOB);
const violations = [];
for (const f of files) {
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
