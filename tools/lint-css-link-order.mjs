#!/usr/bin/env node
// tools/lint-css-link-order.mjs
//
// Asserts that the per-component CSS <link rel="stylesheet"> chain in the SPA
// shell (src/index.html) is kept in ALPHABETICAL order by filename within the
// `/src/css/components/` block (Story 3.4 / Story 3.5 convention). The
// foundational prelude (reset → primitives → semantic → base) and the trailing
// print.css are CASCADE-ordered, not alphabetical, so they are intentionally
// excluded; only the component block is order-checked. Alphabetical ordering is
// safe here because component stylesheets are BEM-scoped (no cross-file selector
// property conflicts), so link order does not affect the cascade — the lint
// guards reviewability/merge-conflict hygiene, not cascade correctness.
//
// Test injection: env IQME_LINT_TARGET=<path> overrides the scanned HTML file.
// Stdlib-only per NFR33.

import { readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const TARGET = process.env.IQME_LINT_TARGET || resolve(REPO_ROOT, "src/index.html");

const html = readFileSync(TARGET, "utf8");

// Component stylesheet hrefs, in document order.
const LINK_RE = /<link\b[^>]*\bhref="(\/src\/css\/components\/[^"]+\.css)"/g;
const components = [];
for (const m of html.matchAll(LINK_RE)) {
  components.push(basename(m[1], ".css"));
}

if (components.length === 0) {
  process.stderr.write(
    `lint-css-link-order: no /src/css/components/*.css <link> tags found in ${TARGET}\n`,
  );
  process.exit(1);
}

const sorted = [...components].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const violations = [];
for (let i = 0; i < components.length; i++) {
  if (components[i] !== sorted[i]) {
    violations.push(`  position ${i + 1}: found "${components[i]}.css", expected "${sorted[i]}.css"`);
  }
}

if (violations.length === 0) {
  process.stdout.write(
    `lint-css-link-order: ok (${components.length} component stylesheets in alphabetical order)\n`,
  );
  process.exit(0);
}

process.stderr.write(
  `lint-css-link-order: component CSS <link> chain in ${TARGET} is not alphabetical by filename.\n` +
    `Sort the /src/css/components/ <link> block (component stylesheets are BEM-scoped, so reordering is cascade-safe):\n` +
    violations.join("\n") +
    `\n\nExpected order:\n  ${sorted.map((c) => `${c}.css`).join("\n  ")}\n`,
);
process.exit(1);
