// Story 13-4 — Acceptance guard for the glass rollout across the remaining
// surfaces: chrome header/footer, score/result panel, methodology chrome. Each
// surface container adopts the theme-aware semantic glass roles (no literal hex),
// and index.html link order stays alphabetical.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks over source text. RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const C = (f) => join(REPO_ROOT, "src", "css", "components", f);
const HEADER = C("chrome-header.css");
const FOOTER = C("chrome-footer.css");
const PANEL = C("score-panel.css");
const MASTHEAD = C("masthead.css");
const INDEX = join(REPO_ROOT, "src", "index.html");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// A 3/6-digit hex literal in a CSS *value* (not a comment) would violate the
// semantic-token-only rule. We scan declaration lines only.
function hasLiteralHexInValue(css) {
  return css
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("/*") && !l.trimStart().startsWith("*"))
    .some((l) => /:\s*[^;]*#[0-9a-fA-F]{3,8}\b/.test(l));
}

test("AC1: chrome-header adopts the glass surface roles", () => {
  const css = read(HEADER);
  assert.match(css, /var\(--surface-glass(\b|-)/, "chrome-header must use a --surface-glass* role");
  assert.match(css, /backdrop-filter/, "chrome-header glass must use backdrop-filter");
  // hide-on-test preserved
  assert.match(css, /body\[data-route="#\/test"\]\s*\.chrome-header[\s\S]*display:\s*none/, "header must still hide on #/test (UX-DR8)");
});

test("AC1: chrome-footer adopts the glass surface roles", () => {
  const css = read(FOOTER);
  assert.match(css, /var\(--surface-glass(\b|-)/, "chrome-footer must use a --surface-glass* role");
  assert.match(css, /backdrop-filter/, "chrome-footer glass must use backdrop-filter");
});

test("AC2: score panel adopts the STRONG glass role (body-text surface → AA)", () => {
  const css = read(PANEL);
  assert.match(css, /var\(--surface-glass-strong\)/, "score-panel must use --surface-glass-strong (body-text fill)");
  // co-equal triplet block must still be present (PR-5 / Story 6.1 invariant)
  assert.match(css, /\.score-panel__triplet/, "co-equal triplet block must remain");
});

test("AC3: methodology masthead adopts the glass roles and stays sticky", () => {
  const css = read(MASTHEAD);
  assert.match(css, /var\(--surface-glass(\b|-)/, "methodology masthead must use a --surface-glass* role");
  assert.match(css, /position:\s*sticky/, "masthead must stay sticky (PR-2/PR-11 app-shell)");
});

test("AC4: no literal hex added to the touched component files (semantic roles only)", () => {
  for (const f of [HEADER, FOOTER, PANEL, MASTHEAD]) {
    assert.ok(!hasLiteralHexInValue(read(f)), `${basename(f)} must not introduce a literal hex in a CSS value`);
  }
});

test("AC4: index.html component CSS link block stays alphabetical", () => {
  const html = read(INDEX);
  const re = /<link\b[^>]*\bhref="(\/src\/css\/components\/[^"]+\.css)"/g;
  const names = [];
  for (const m of html.matchAll(re)) names.push(basename(m[1], ".css"));
  const sorted = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  assert.deepEqual(names, sorted, "component CSS <link> block must stay alphabetical");
});
