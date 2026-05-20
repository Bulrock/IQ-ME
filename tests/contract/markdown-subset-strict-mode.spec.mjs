// tests/contract/markdown-subset-strict-mode.spec.mjs
//
// Story 4.1 AC-5 + AC-10 — contract test: the strict-mode renderer must accept
// every methodology page currently in the repo, the subset spec doc itself, and
// the positive fixture.
//
// Pages under src/content/methodology/**/*.md include frontmatter; this spec
// strips the frontmatter (using the same `---\n…\n---\n` block convention as
// tools/build-methodology.mjs) before calling render(), since the renderer
// operates on the body only.
//
// Coverage:
//   - every *.md under src/content/methodology/en/ (4 Story-3-6 pages)
//   - corpus/markdown-subset-v1.md (the spec self-validates per its closing §)
//   - tests/fixtures/markdown-subset/all-permitted.md (positive fixture)
//   - fixture exercises every permitted construct (sanity-check the fixture)

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync } from "node:fs";

import { render } from "../../tools/markdown-subset.mjs";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const METHODOLOGY_ROOT = resolve(REPO_ROOT, "src/content/methodology");
const SUBSET_SPEC = resolve(REPO_ROOT, "corpus/markdown-subset-v1.md");
const FIXTURE = resolve(REPO_ROOT, "tests/fixtures/markdown-subset/all-permitted.md");

function walkMd(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return out;
    throw e;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(p));
    else if (e.isFile() && e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// Strip leading frontmatter --- … --- block; return the body (renderer's input).
function stripFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return text;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      return lines.slice(i + 1).join("\n");
    }
  }
  return text;
}

// ─── In-repo methodology pages must parse cleanly ───────────────────────────

const inRepoPages = walkMd(METHODOLOGY_ROOT);

for (const srcPath of inRepoPages) {
  const rel = relative(REPO_ROOT, srcPath);
  test(`AC-5/AC-10 contract: ${rel} parses through strict-mode renderer`, () => {
    const body = stripFrontmatter(readFileSync(srcPath, "utf8"));
    // Should not throw.
    const html = render(body, { sourcePath: srcPath });
    assert.equal(typeof html, "string");
    assert.ok(html.length > 0, `renderer returned empty string for ${rel}`);
  });
}

test("AC-10 contract: in-repo methodology tree contains at least one page", () => {
  assert.ok(inRepoPages.length >= 1, `expected ≥1 methodology page, found ${inRepoPages.length}`);
});

// ─── The subset spec doc itself self-validates ─────────────────────────────

test("AC-9/AC-10 contract: corpus/markdown-subset-v1.md self-validates through the renderer", () => {
  const body = stripFrontmatter(readFileSync(SUBSET_SPEC, "utf8"));
  const html = render(body, { sourcePath: SUBSET_SPEC });
  assert.equal(typeof html, "string");
  assert.ok(html.length > 0);
});

// ─── Positive fixture parses + exercises every permitted construct ─────────

test("AC-10 contract: tests/fixtures/markdown-subset/all-permitted.md parses cleanly", () => {
  const src = readFileSync(FIXTURE, "utf8");
  const html = render(src, { sourcePath: FIXTURE });
  assert.equal(typeof html, "string");
  assert.ok(html.length > 0);
});

test("AC-10 contract: positive fixture exercises every permitted construct (sanity check)", () => {
  const src = readFileSync(FIXTURE, "utf8");
  const html = render(src, { sourcePath: FIXTURE });
  // Sanity: confirm each permitted construct appears in the rendered HTML.
  // Headings 1-4
  assert.match(html, /<h1>/, "fixture missing <h1>");
  assert.match(html, /<h2>/, "fixture missing <h2>");
  assert.match(html, /<h3>/, "fixture missing <h3>");
  assert.match(html, /<h4>/, "fixture missing <h4>");
  // Paragraph
  assert.match(html, /<p>/, "fixture missing <p>");
  // Emphasis + strong
  assert.match(html, /<em>/, "fixture missing <em>");
  assert.match(html, /<strong>/, "fixture missing <strong>");
  // Inline code + code fence (with + without lang)
  assert.match(html, /<code>/, "fixture missing inline <code>");
  assert.match(html, /<pre><code>/, "fixture missing fence without language");
  assert.match(html, /<pre><code class="language-/, "fixture missing fence with language");
  // Inline link
  assert.match(html, /<a href="\/">/, "fixture missing inline link");
  // Reference link resolved
  assert.match(html, /<a href="\/corpus\/markdown-subset-v1">/, "fixture missing resolved reference link");
  // Lists (ordered + unordered) with at least one nested
  assert.match(html, /<ul>/, "fixture missing <ul>");
  assert.match(html, /<ol>/, "fixture missing <ol>");
  const ulCount = (html.match(/<ul>/g) || []).length;
  const olCount = (html.match(/<ol>/g) || []).length;
  assert.ok(ulCount >= 2, `fixture missing nested <ul> (got ${ulCount})`);
  assert.ok(olCount >= 2, `fixture missing nested <ol> (got ${olCount})`);
});

// ─── Determinism over the corpus ───────────────────────────────────────────

test("AC-7 contract: rendering the positive fixture twice produces byte-identical output", () => {
  const src = readFileSync(FIXTURE, "utf8");
  const a = render(src);
  const b = render(src);
  assert.equal(a, b, "renderer is not deterministic across two calls on same input");
});
