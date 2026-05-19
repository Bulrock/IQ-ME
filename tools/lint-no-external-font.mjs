#!/usr/bin/env node
// tools/lint-no-external-font.mjs
//
// Negative-assertion lint: forbids external font CDN references (Google Fonts,
// Bunny Fonts, Adobe Typekit, etc.). All fonts must be system-stack or
// self-hosted under vendor/ to preserve zero-third-party-fetch posture (NFR8).
// Test injection: env IQME_LINT_TARGET=<path> overrides the scan root.
// Stdlib-only per NFR33.

import { readFileSync, globSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const TARGET = process.env.IQME_LINT_TARGET || "src";
const SCAN_DIR = resolve(REPO_ROOT, TARGET);
const FORBIDDEN = /(fonts\.googleapis\.com|fonts\.gstatic\.com|fonts\.bunny\.net|use\.typekit\.net|use\.fontawesome\.com)/i;
const FILES_GLOB = `${SCAN_DIR}/**/*.{html,css,js,mjs,ts}`;

const files = globSync(FILES_GLOB);
const violations = [];
for (const f of files) {
  if (FORBIDDEN.test(readFileSync(f, "utf8"))) violations.push(f);
}

if (violations.length === 0) {
  process.stdout.write(`lint-no-external-font: ok (${files.length} files scanned)\n`);
  process.exit(0);
}
for (const f of violations) {
  process.stderr.write(`BREACH lint-no-external-font: ${f} references external font CDN\n`);
}
process.exit(1);
