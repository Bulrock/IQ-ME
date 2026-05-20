// Story 5.1 — Acceptance tests for methodology-page-chrome CSS additions:
// lede.css + translation-in-progress-stub.css + validity-envelope-diagram (SVG + CSS).
//
// Authored in test-author phase (frozen during specialist impl).
// Run: `node --test tests/scaffold/methodology-chrome-css.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const LEDE_CSS = join(REPO_ROOT, "src", "css", "components", "lede.css");
const STUB_CSS = join(REPO_ROOT, "src", "css", "components", "translation-in-progress-stub.css");
const DIAGRAM_CSS = join(REPO_ROOT, "src", "css", "components", "validity-envelope-diagram.css");
const DIAGRAM_SVG = join(REPO_ROOT, "src", "content", "diagrams", "validity-envelope-diagram.svg");
const INDEX_HTML = join(REPO_ROOT, "src", "index.html");
const STRINGS_EN = join(REPO_ROOT, "src", "content", "i18n", "en", "strings.json");

// ─── AC-1: lede.css ──────────────────────────────────────────────────────

test("AC-1: src/css/components/lede.css exists", () => {
  assert.ok(existsSync(LEDE_CSS), `${LEDE_CSS} missing`);
});

test("AC-1: lede.css references --font-size-300 (UX-DR3)", () => {
  const css = readFileSync(LEDE_CSS, "utf8");
  assert.match(css, /var\(\s*--font-size-300\s*\)/, "lede must size at --font-size-300");
});

test("AC-1: lede.css references --space-masthead-to-lede", () => {
  const css = readFileSync(LEDE_CSS, "utf8");
  assert.match(css, /var\(\s*--space-masthead-to-lede\s*\)/);
});

test("AC-1: lede.css selector targets .lede class", () => {
  const css = readFileSync(LEDE_CSS, "utf8");
  assert.match(css, /\.lede\b/, "must define rules for .lede selector");
});

// ─── AC-2: translation-in-progress-stub.css ──────────────────────────────

test("AC-2: src/css/components/translation-in-progress-stub.css exists", () => {
  assert.ok(existsSync(STUB_CSS), `${STUB_CSS} missing`);
});

test("AC-2: translation-in-progress-stub.css targets [data-translation-status='in-progress']", () => {
  const css = readFileSync(STUB_CSS, "utf8");
  assert.match(
    css,
    /\[data-translation-status\s*=\s*["']in-progress["']\]/,
    "must select on [data-translation-status='in-progress'] (UX spec §1464)",
  );
});

// ─── AC-3: validity-envelope-diagram.svg ─────────────────────────────────

test("AC-3: src/content/diagrams/validity-envelope-diagram.svg exists", () => {
  assert.ok(existsSync(DIAGRAM_SVG), `${DIAGRAM_SVG} missing`);
});

test("AC-3: SVG has <title> with data-i18n-key", () => {
  const svg = readFileSync(DIAGRAM_SVG, "utf8");
  assert.match(svg, /<title[^>]*data-i18n-key=["']diagrams\.validityEnvelope\.title["']/);
});

test("AC-3: SVG has <desc> with data-i18n-key", () => {
  const svg = readFileSync(DIAGRAM_SVG, "utf8");
  assert.match(svg, /<desc[^>]*data-i18n-key=["']diagrams\.validityEnvelope\.desc["']/);
});

test("AC-3: SVG has three zone labels (valid / partial / invalid)", () => {
  const svg = readFileSync(DIAGRAM_SVG, "utf8");
  assert.match(svg, /class=["']zone-valid["']/);
  assert.match(svg, /class=["']zone-partial["']/);
  assert.match(svg, /class=["']zone-invalid["']/);
});

test("AC-3: SVG contains no <style> block (CSP-safe inline)", () => {
  const svg = readFileSync(DIAGRAM_SVG, "utf8");
  assert.doesNotMatch(svg, /<style\b/i, "inline <style> would bypass CSP — colors must come from .css");
});

test("AC-3: SVG file size ≤ 8KB (NFR3 asset-budget)", () => {
  const { size } = statSync(DIAGRAM_SVG);
  assert.ok(size <= 8 * 1024, `validity-envelope-diagram.svg = ${size}B > 8192B budget`);
});

// ─── AC-4: validity-envelope-diagram.css ─────────────────────────────────

test("AC-4: src/css/components/validity-envelope-diagram.css exists", () => {
  assert.ok(existsSync(DIAGRAM_CSS), `${DIAGRAM_CSS} missing`);
});

test("AC-4: diagram CSS styles all three zones", () => {
  const css = readFileSync(DIAGRAM_CSS, "utf8");
  assert.match(css, /\.zone-valid\b/);
  assert.match(css, /\.zone-partial\b/);
  assert.match(css, /\.zone-invalid\b/);
});

test("AC-4: diagram CSS has no !important", () => {
  const css = readFileSync(DIAGRAM_CSS, "utf8");
  assert.doesNotMatch(css, /!important\b/i, "no !important per design-system contract");
});

// ─── i18n strings for Story 5.1 ──────────────────────────────────────────

test("AC-2+AC-3: strings.json carries Story 5.1 i18n keys", () => {
  const json = JSON.parse(readFileSync(STRINGS_EN, "utf8"));
  // 5 new keys
  const expectedKeys = [
    "methodology.translationInProgress.heading",
    "methodology.translationInProgress.cta",
    "methodology.masthead.translatedNoneYet",
    "diagrams.validityEnvelope.title",
    "diagrams.validityEnvelope.desc",
  ];
  // resolve nested key path (e.g. "a.b.c" → json.a.b.c)
  for (const path of expectedKeys) {
    let cur = json;
    for (const part of path.split(".")) {
      assert.ok(
        cur && Object.prototype.hasOwnProperty.call(cur, part),
        `strings.json missing key path: ${path} (stopped at "${part}")`,
      );
      cur = cur[part];
    }
    assert.equal(typeof cur, "string", `${path} must resolve to a string`);
    assert.ok(cur.length > 0, `${path} must be non-empty`);
  }
});

// ─── CSS aggregator wiring (linked from src/index.html or _index.css) ────

test("Story 5.1 CSS components are loaded by src/index.html (directly or transitively)", () => {
  // Convention from src/css/components/*: all are <link rel="stylesheet"> or
  // imported via the existing aggregator. This test asserts the new files are
  // discoverable from src/index.html via at least one chain.
  const indexHtml = readFileSync(INDEX_HTML, "utf8");
  // Either: src/index.html links each component CSS file directly, OR there is
  // a known aggregator referenced by index.html that imports them. We assert
  // the *file name* token appears somewhere in the chain.
  const aggregators = [INDEX_HTML];
  const candidateAggregator = join(REPO_ROOT, "src", "css", "components", "_index.css");
  if (existsSync(candidateAggregator)) aggregators.push(candidateAggregator);
  const corpus = aggregators.map((p) => readFileSync(p, "utf8")).join("\n");
  for (const name of ["lede.css", "translation-in-progress-stub.css", "validity-envelope-diagram.css"]) {
    assert.match(
      corpus,
      new RegExp(name.replace(".", "\\.")),
      `${name} must be referenced from index.html or components/_index.css`,
    );
  }
});
