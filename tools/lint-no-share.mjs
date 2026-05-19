#!/usr/bin/env node
// tools/lint-no-share.mjs
//
// Negative-assertion lint: forbids `navigator.share(` (Web Share API) — would
// leak result content to OS share-sheet, violating zero-telemetry posture.
// Test injection: env IQME_LINT_TARGET=<path> overrides the scan root.
// Stdlib-only per NFR33.

import { readFileSync, globSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const TARGET = process.env.IQME_LINT_TARGET || "src";
const SCAN_DIR = resolve(REPO_ROOT, TARGET);
const FORBIDDEN = /\bnavigator\.share\s*\(/;
const FILES_GLOB = `${SCAN_DIR}/**/*.{html,js,mjs,ts,tsx,jsx}`;

const files = globSync(FILES_GLOB);
const violations = [];
for (const f of files) {
  if (FORBIDDEN.test(readFileSync(f, "utf8"))) violations.push(f);
}

if (violations.length === 0) {
  process.stdout.write(`lint-no-share: ok (${files.length} files scanned)\n`);
  process.exit(0);
}
for (const f of violations) {
  process.stderr.write(`BREACH lint-no-share: ${f} calls navigator.share()\n`);
}
process.exit(1);
