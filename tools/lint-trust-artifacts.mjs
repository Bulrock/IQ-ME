#!/usr/bin/env node
// tools/lint-trust-artifacts.mjs
//
// Asserts the repo's trust artifacts exist + cross-reference each other:
//   - ICAR-CONFIRMATION.pdf exists + is non-empty
//   - LICENSES.md exists + mentions ICAR-CONFIRMATION.pdf
//   - CITATION.cff exists
//   - README.md exists
// Stdlib-only per NFR33.

import { readFileSync, statSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

const REQUIRED = [
  { path: "ICAR-CONFIRMATION.pdf", minBytes: 100 },
  { path: "LICENSES.md", minBytes: 100 },
  { path: "CITATION.cff", minBytes: 50 },
  { path: "README.md", minBytes: 100 },
];

const violations = [];
for (const { path, minBytes } of REQUIRED) {
  const full = resolve(REPO_ROOT, path);
  if (!existsSync(full)) {
    violations.push(`${path}: missing`);
    continue;
  }
  const size = statSync(full).size;
  if (size < minBytes) {
    violations.push(`${path}: too small (${size} bytes; minimum ${minBytes})`);
  }
}

// Cross-reference: LICENSES.md should mention ICAR-CONFIRMATION.pdf.
const licensesPath = resolve(REPO_ROOT, "LICENSES.md");
if (existsSync(licensesPath)) {
  const text = readFileSync(licensesPath, "utf8");
  if (!/ICAR-CONFIRMATION\.pdf/i.test(text)) {
    violations.push(`LICENSES.md: does not reference ICAR-CONFIRMATION.pdf`);
  }
}

if (violations.length === 0) {
  process.stdout.write(`lint-trust-artifacts: ok (${REQUIRED.length} artifacts verified)\n`);
  process.exit(0);
}
for (const v of violations) {
  process.stderr.write(`BREACH lint-trust-artifacts: ${v}\n`);
}
process.exit(1);
