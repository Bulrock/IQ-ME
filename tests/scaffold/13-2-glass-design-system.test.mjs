// Story 13-2 — Acceptance guard for the glass design-system layer:
// glass + motion tokens in primitives, semantic glass roles + dark overrides,
// the reusable .glass-surface primitive, and the alphabetical index.html link.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks — treat the CSS/HTML as text. RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const PRIMITIVES = join(REPO_ROOT, "src", "css", "primitives.css");
const SEMANTIC = join(REPO_ROOT, "src", "css", "semantic.css");
const GLASS = join(REPO_ROOT, "src", "css", "components", "glass-surface.css");
const INDEX = join(REPO_ROOT, "src", "index.html");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

const GLASS_PRIMITIVES = [
  "--glass-blur-sm", "--glass-blur-md", "--glass-blur-lg",
  "--glass-fill", "--glass-fill-strong", "--glass-tint",
  "--glass-edge", "--glass-shadow",
];
const MOTION_PRIMITIVES = [
  "--motion-instant", "--motion-quick", "--motion-base", "--motion-slow",
  "--ease-standard", "--ease-exit",
];
const SEMANTIC_GLASS_ROLES = [
  "--surface-glass", "--surface-glass-strong", "--surface-glass-blur",
  "--surface-glass-edge", "--surface-glass-shadow",
];

test("AC1: primitives.css declares the glass + motion primitives with concrete values", () => {
  const css = read(PRIMITIVES);
  for (const t of GLASS_PRIMITIVES) {
    assert.match(css, new RegExp(`${t.replace(/-/g, "\\-")}\\s*:`), `primitives.css missing ${t}`);
  }
  for (const t of MOTION_PRIMITIVES) {
    assert.match(css, new RegExp(`${t.replace(/-/g, "\\-")}\\s*:`), `primitives.css missing ${t}`);
  }
  assert.match(css, /--glass-blur-md\s*:\s*12px/, "--glass-blur-md must be 12px per 13-1 §2.1");
  assert.match(css, /--motion-base\s*:\s*260ms/, "--motion-base must be 260ms per 13-1 §4.1");
  assert.match(css, /cubic-bezier\(/, "--ease-* must be a cubic-bezier curve");
});

test("AC2: semantic.css maps glass roles and declares dark-mode overrides for them", () => {
  const css = read(SEMANTIC);
  for (const r of SEMANTIC_GLASS_ROLES) {
    assert.match(css, new RegExp(`${r.replace(/-/g, "\\-")}\\s*:`), `semantic.css missing role ${r}`);
  }
  // dark override under explicit opt-in
  assert.match(
    css,
    /\[data-theme="dark"\][\s\S]*--surface-glass\s*:/,
    "semantic.css must override --surface-glass under [data-theme=\"dark\"]",
  );
  // dark override under system pref
  assert.match(
    css,
    /prefers-color-scheme:\s*dark[\s\S]*:root:not\(\[data-theme="light"\]\)[\s\S]*--surface-glass\s*:/,
    "semantic.css must override --surface-glass under the system-pref dark block",
  );
});

test("AC3: glass-surface.css defines .glass-surface, the --strong modifier, and the @supports fallback", () => {
  const css = read(GLASS);
  assert.match(css, /\.glass-surface\s*\{/, "must define .glass-surface");
  assert.match(css, /\.glass-surface--strong\b/, "must define .glass-surface--strong modifier");
  assert.match(css, /backdrop-filter\s*:\s*blur\(/, "must use backdrop-filter: blur()");
  assert.match(css, /-webkit-backdrop-filter\s*:\s*blur\(/, "must include the -webkit- prefix for Safari");
  assert.match(
    css,
    /@supports\s+not\s*\(backdrop-filter:\s*blur\(1px\)\)/,
    "must include an @supports not solid fallback",
  );
  // consumes semantic roles, not raw primitives
  assert.match(css, /var\(--surface-glass\b/, ".glass-surface must consume the --surface-glass semantic role");
  assert.ok(
    !/var\(--glass-fill\b/.test(css),
    "component must NOT reference the --glass-* primitives directly (two-layer rule)",
  );
});

test("AC4: index.html links glass-surface.css in the component block in alphabetical order", () => {
  const html = read(INDEX);
  assert.match(html, /href="\/src\/css\/components\/glass-surface\.css"/, "index.html must link glass-surface.css");
  const re = /<link\b[^>]*\bhref="(\/src\/css\/components\/[^"]+\.css)"/g;
  const names = [];
  for (const m of html.matchAll(re)) names.push(basename(m[1], ".css"));
  const sorted = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  assert.deepEqual(names, sorted, "component CSS <link> block must stay alphabetical (lint-css-link-order)");
});
