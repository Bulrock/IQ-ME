// tests/scaffold/methodology-masthead.test.mjs
//
// Story 4.6 AC-7 — scaffold sanity: build a methodology page to a tmpdir and
// assert the new template surfaces are present:
//   - <header class="methodology-masthead"> with title/version/doi/last-reviewed/reviewer
//   - <aside class="cite-this-page-affordance"><div data-cite-widget></div></aside>
//   - <link> tags for masthead.css and cite-this-page-widget.css
//   - <script type="module"> for cite-this-page.js
//   - <meta name="iqme-*"> tags in <head>
//   - exactly one <h1> on the page (the masthead title)

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/build-methodology.mjs");
const FIXTURE = resolve(REPO_ROOT, "tests/fixtures/build-methodology/fixture-ok");

function runBuild(outDir) {
  return spawnSync("node", [SCRIPT], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      IQME_BUILD_METHODOLOGY_SRC: FIXTURE,
      IQME_BUILD_METHODOLOGY_OUT: outDir,
      IQME_CORPUS_VERSION: "v1.2.0",
    },
  });
}

test("Story 4-6 scaffold: emitted page contains methodology-masthead with all 5 chrome fields", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-4-6-mm-"));
  try {
    const r = runBuild(out);
    assert.equal(r.status, 0, `build failed; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<header class="methodology-masthead">/);
    assert.match(html, /class="methodology-masthead__title"/);
    assert.match(html, /class="methodology-masthead__version"/);
    assert.match(html, /class="methodology-masthead__doi"/);
    assert.match(html, /class="methodology-masthead__last-reviewed"/);
    assert.match(html, /class="methodology-masthead__reviewer"/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("Story 4-6 scaffold: emitted page contains the cite-this-page placeholder aside", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-4-6-cite-"));
  try {
    const r = runBuild(out);
    assert.equal(r.status, 0, `build failed; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<aside class="cite-this-page-affordance">/);
    assert.match(html, /<div data-cite-widget>\s*<\/div>/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("Story 4-6 scaffold: emitted page contains link + script tags for the widget bundle", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-4-6-bundle-"));
  try {
    const r = runBuild(out);
    assert.equal(r.status, 0, `build failed; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<link rel="stylesheet" href="[^"]*masthead\.css">/);
    assert.match(html, /<link rel="stylesheet" href="[^"]*cite-this-page-widget\.css">/);
    assert.match(html, /<script type="module" src="[^"]*cite-this-page\.js"[^>]*>\s*<\/script>/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("Story 4-6 scaffold: emitted page contains all iqme-* meta tags in <head>", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-4-6-meta-"));
  try {
    const r = runBuild(out);
    assert.equal(r.status, 0, `build failed; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
    assert.ok(headMatch, "expected a <head> block");
    const head = headMatch[1];
    for (const name of [
      "iqme-title", "iqme-version", "iqme-doi",
      "iqme-last-reviewed", "iqme-reviewer", "iqme-reviewer-handle",
      "iqme-lang", "iqme-url",
    ]) {
      assert.ok(
        new RegExp(`<meta name="${name}" content="`).test(head),
        `missing <meta name="${name}"> in <head>; got: ${head}`,
      );
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("Story 4-6 scaffold: emitted page has exactly one <h1> (masthead-owned)", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-4-6-h1-"));
  try {
    const r = runBuild(out);
    assert.equal(r.status, 0, `build failed; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    const h1Count = (html.match(/<h1\b/g) || []).length;
    assert.equal(h1Count, 1, `expected exactly one <h1>, found ${h1Count}; html=${html.slice(0, 600)}`);
    // The <h1> belongs to the masthead.
    assert.match(html, /<h1 class="methodology-masthead__title">/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
