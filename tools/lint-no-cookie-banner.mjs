#!/usr/bin/env node
// tools/lint-no-cookie-banner.mjs
//
// Negative-assertion lint: forbids cookie-banner / cookie-consent DOM/var names.
// No cookies are set by this site → no banner ever needed; presence in code
// indicates regression toward third-party consent-management drift.
// Test injection: env IQME_LINT_TARGET=<path> overrides the scan root.
// Stdlib-only per NFR33.

import { readFileSync, globSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const TARGET = process.env.IQME_LINT_TARGET || "src";
const SCAN_DIR = resolve(REPO_ROOT, TARGET);
const FORBIDDEN = /cookie[-_]?(banner|consent)/i;
const FILES_GLOB = `${SCAN_DIR}/**/*.{html,js,mjs,ts,tsx,jsx,css}`;

const files = globSync(FILES_GLOB);
const violations = [];
for (const f of files) {
  if (FORBIDDEN.test(readFileSync(f, "utf8"))) violations.push(f);
}

if (violations.length === 0) {
  process.stdout.write(`lint-no-cookie-banner: ok (${files.length} files scanned)\n`);
  process.exit(0);
}
for (const f of violations) {
  process.stderr.write(`BREACH lint-no-cookie-banner: ${f} references cookie-banner/cookie-consent\n`);
}
process.exit(1);
