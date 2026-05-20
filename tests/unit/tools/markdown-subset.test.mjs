// tests/unit/tools/markdown-subset.test.mjs
//
// Story 4.1 AC-1 + AC-10 — unit tests for tools/markdown-subset.mjs.
//
// Mirror-rule path per architecture.md line 673: tests for tools/<name>.mjs
// live at tests/unit/tools/<name>.test.mjs.
//
// Renderer is a PURE function over input strings — no FS access in render().
// Tests pass strings and assert on the HTML string output.
//
// MarkdownSubsetError is a custom Error subclass with .line, .column,
// .sourcePath properties; rejection tests assert on those properties, not on
// message-string regex (more robust to wording tweaks).

import { test } from "node:test";
import assert from "node:assert/strict";

// Renderer module under test. Path: 3 levels up from tests/unit/tools/.
// Until Story 4.1 lands the impl, this import will fail with ERR_MODULE_NOT_FOUND.
import { render, MarkdownSubsetError } from "../../../tools/markdown-subset.mjs";

// Helper: render with a single required level-1 heading prefix so tests that
// focus on a downstream construct (e.g. paragraph emphasis) don't trip the
// "exactly one level-1 heading" rule.
function r(body, opts) {
  return render(`# T\n\n${body}`, opts);
}

// ─── Permitted constructs (positive cases) ──────────────────────────────────

test("AC-1 permitted: single level-1 heading renders to <h1>", () => {
  const html = render("# Hello");
  assert.match(html, /<h1>Hello<\/h1>/);
});

test("AC-1 permitted: level-2 heading renders to <h2>", () => {
  const html = render("# T\n\n## Sub");
  assert.match(html, /<h2>Sub<\/h2>/);
});

test("AC-1 permitted: level-3 heading renders to <h3>", () => {
  const html = render("# T\n\n### Sub");
  assert.match(html, /<h3>Sub<\/h3>/);
});

test("AC-1 permitted: level-4 heading renders to <h4>", () => {
  const html = render("# T\n\n#### Sub");
  assert.match(html, /<h4>Sub<\/h4>/);
});

test("AC-1 permitted: heading line with trailing whitespace still parses", () => {
  const html = render("# Title   ");
  assert.match(html, /<h1>Title<\/h1>/);
});

test("AC-1 permitted: single paragraph renders to one <p>", () => {
  const html = r("just a sentence.");
  const pCount = (html.match(/<p>/g) || []).length;
  assert.equal(pCount, 1, `expected 1 <p>, got ${pCount} in ${html}`);
  assert.match(html, /<p>just a sentence\.<\/p>/);
});

test("AC-1 permitted: two paragraphs separated by a blank line render to two <p>", () => {
  const html = r("first.\n\nsecond.");
  const pCount = (html.match(/<p>/g) || []).length;
  assert.equal(pCount, 2, `expected 2 <p>, got ${pCount} in ${html}`);
});

test("AC-1 permitted: consecutive non-blank lines collapse into one paragraph", () => {
  const html = r("line one\nline two\nline three");
  const pCount = (html.match(/<p>/g) || []).length;
  assert.equal(pCount, 1, `expected 1 <p> collapsed, got ${pCount} in ${html}`);
});

test("AC-1 permitted: *em* renders to <em>", () => {
  const html = r("This is *emphasised* text.");
  assert.match(html, /<em>emphasised<\/em>/);
});

test("AC-1 permitted: **strong** renders to <strong>", () => {
  const html = r("This is **strong** text.");
  assert.match(html, /<strong>strong<\/strong>/);
});

test("AC-1 permitted: code fence without language renders to <pre><code>", () => {
  const html = r("```\nplain\n```");
  assert.match(html, /<pre><code>plain\n?<\/code><\/pre>/);
});

test("AC-1 permitted: code fence with language renders <pre><code class=\"language-LANG\">", () => {
  const html = r("```js\nconst x = 1;\n```");
  assert.match(html, /<pre><code class="language-js">const x = 1;\n?<\/code><\/pre>/);
});

test("AC-1 permitted: inline backtick renders to <code>", () => {
  const html = r("call `fn(x)` here.");
  assert.match(html, /<code>fn\(x\)<\/code>/);
});

test("AC-1 permitted: inline link [text](url) renders to <a href=\"url\">text</a>", () => {
  const html = r("Click [here](/path).");
  assert.match(html, /<a href="\/path">here<\/a>/);
});

test("AC-1 permitted: reference-style link resolved at end of doc", () => {
  const src = "# T\n\nSee [the spec][s] for details.\n\n[s]: /spec/v1\n";
  const html = render(src);
  assert.match(html, /<a href="\/spec\/v1">the spec<\/a>/);
});

test("AC-1 permitted: unordered list (depth 1) renders to <ul><li>", () => {
  const html = r("- one\n- two\n- three");
  assert.match(html, /<ul>/);
  const liCount = (html.match(/<li>/g) || []).length;
  assert.equal(liCount, 3, `expected 3 <li>, got ${liCount}`);
});

test("AC-1 permitted: ordered list (depth 1) renders to <ol><li>", () => {
  const html = r("1. one\n2. two\n3. three");
  assert.match(html, /<ol>/);
  const liCount = (html.match(/<li>/g) || []).length;
  assert.equal(liCount, 3, `expected 3 <li>, got ${liCount}`);
});

test("AC-1 permitted: nested unordered list depth 2 renders nested <ul>", () => {
  const html = r("- a\n  - a1\n  - a2\n- b");
  // Count nested <ul> (one outer plus one nested).
  const ulCount = (html.match(/<ul>/g) || []).length;
  assert.equal(ulCount, 2, `expected 2 <ul> (outer + nested), got ${ulCount} in ${html}`);
});

test("AC-1 permitted: nested ordered list depth 2 renders nested <ol>", () => {
  const html = r("1. a\n   1. a1\n   2. a2\n2. b");
  const olCount = (html.match(/<ol>/g) || []).length;
  assert.equal(olCount, 2, `expected 2 <ol> (outer + nested), got ${olCount} in ${html}`);
});

test("AC-1 permitted: HTML special char '<' in body text is escaped to &lt;", () => {
  const html = r("The token <foo> is escaped.");
  assert.match(html, /&lt;foo&gt;/);
  // Confirm no raw < passes through where the text token started.
  assert.ok(!/<foo>/.test(html), `raw <foo> leaked: ${html}`);
});

test("AC-1 permitted: '&' in body text is escaped to &amp;", () => {
  const html = r("Salt & pepper.");
  assert.match(html, /Salt &amp; pepper\./);
});

test("AC-1 permitted: link URL containing '&' is preserved in href (not double-escaped)", () => {
  const html = r("Link to [x](/a?b=1&c=2).");
  // The href attribute value contains the raw URL; & may be HTML-escaped to
  // &amp; per HTML attribute escaping rules, but it must NOT be double-escaped.
  assert.ok(/<a href="\/a\?b=1&(amp;)?c=2">x<\/a>/.test(html), `unexpected href escaping: ${html}`);
});

test("AC-1 permitted: link text containing '<' is escaped", () => {
  const html = r("See [<tag>](/x).");
  assert.match(html, /<a href="\/x">&lt;tag&gt;<\/a>/);
});

test("AC-1 deterministic: same input rendered twice yields byte-identical output", () => {
  const src = "# Title\n\nA *paragraph* with `code` and [link](/u).\n";
  const a = render(src);
  const b = render(src);
  assert.equal(a, b, "renderer is not deterministic across calls");
});

// ─── Forbidden constructs (reject cases) ────────────────────────────────────

test("AC-1 forbidden: setext heading (=== underline) throws MarkdownSubsetError", () => {
  assert.throws(
    () => render("Title\n=====\n\nbody"),
    (err) => {
      assert.ok(err instanceof MarkdownSubsetError, `expected MarkdownSubsetError, got ${err.constructor.name}`);
      return true;
    },
  );
});

test("AC-1 forbidden: setext heading (--- underline) throws MarkdownSubsetError", () => {
  assert.throws(
    () => render("Title\n-----\n\nbody"),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: autolink <https://example.com> throws MarkdownSubsetError", () => {
  assert.throws(
    () => r("Visit <https://example.com> today."),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: image link ![alt](url) throws MarkdownSubsetError", () => {
  assert.throws(
    () => r("Inline image ![alt](/x.png) is bad."),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: pipe table throws MarkdownSubsetError", () => {
  assert.throws(
    () => r("| col1 | col2 |\n| ---- | ---- |\n| a    | b    |"),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: underscore emphasis _foo_ throws MarkdownSubsetError", () => {
  assert.throws(
    () => r("This is _underscore_ emphasis."),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: underscore strong __foo__ throws MarkdownSubsetError", () => {
  assert.throws(
    () => r("This is __underscore-strong__."),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: triple-nested emphasis ***foo*** throws (depth 3)", () => {
  assert.throws(
    () => r("This is ***triple*** emphasis."),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: list depth 3 throws MarkdownSubsetError with line info", () => {
  const src = "# T\n\n- a\n  - a1\n    - a1-1\n";
  assert.throws(
    () => render(src),
    (err) => {
      assert.ok(err instanceof MarkdownSubsetError);
      assert.ok(typeof err.line === "number" && err.line > 0, `expected err.line to be set, got ${err.line}`);
      return true;
    },
  );
});

test("AC-1 forbidden: zero level-1 headings throws (e.g. only ## sub)", () => {
  assert.throws(
    () => render("## Only a sub\n\nbody"),
    (err) => {
      assert.ok(err instanceof MarkdownSubsetError);
      // Message should mention 0 / zero / found 0 — but we assert on count via the
      // message substring rather than full regex to remain wording-tolerant.
      assert.ok(/0|zero/i.test(err.message), `error message should mention zero/0; got: ${err.message}`);
      return true;
    },
  );
});

test("AC-1 forbidden: empty source throws (zero level-1 headings)", () => {
  assert.throws(
    () => render(""),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("AC-1 forbidden: multiple level-1 headings throws", () => {
  assert.throws(
    () => render("# One\n\nbody\n\n# Two\n\nmore"),
    (err) => {
      assert.ok(err instanceof MarkdownSubsetError);
      assert.ok(/2|two|multiple/i.test(err.message), `error message should mention 2/multiple; got: ${err.message}`);
      return true;
    },
  );
});

test("AC-1 forbidden: raw HTML angle bracket in body is ESCAPED (not thrown)", () => {
  // Per AC-1: "No raw HTML passthrough. Any `<` in body text is escaped."
  // The renderer's discipline is to escape, not throw, for raw-HTML-looking tokens.
  const html = r("A <div>raw</div> token.");
  assert.match(html, /&lt;div&gt;/);
  assert.ok(!/<div>/.test(html), "raw <div> must not pass through");
});

// ─── MarkdownSubsetError properties ─────────────────────────────────────────

test("MarkdownSubsetError: instanceof Error and MarkdownSubsetError", () => {
  let caught = null;
  try {
    render("## only sub");
  } catch (err) {
    caught = err;
  }
  assert.ok(caught !== null, "expected render() to throw");
  assert.ok(caught instanceof Error, "must be instanceof Error");
  assert.ok(caught instanceof MarkdownSubsetError, "must be instanceof MarkdownSubsetError");
});

test("MarkdownSubsetError: .line is a 1-based positive integer", () => {
  let caught = null;
  try {
    render("# T\n\n- a\n  - b\n    - c\n");
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof MarkdownSubsetError);
  assert.equal(typeof caught.line, "number");
  assert.ok(caught.line >= 1, `expected .line >= 1, got ${caught.line}`);
});

test("MarkdownSubsetError: .column is a 1-based positive integer", () => {
  let caught = null;
  try {
    render("# T\n\nThis has _underscore_ emphasis.");
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof MarkdownSubsetError);
  assert.equal(typeof caught.column, "number");
  assert.ok(caught.column >= 1, `expected .column >= 1, got ${caught.column}`);
});

test("MarkdownSubsetError: .sourcePath set when options.sourcePath provided", () => {
  let caught = null;
  try {
    render("## only sub", { sourcePath: "/tmp/foo.md" });
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof MarkdownSubsetError);
  assert.equal(caught.sourcePath, "/tmp/foo.md");
});

test("MarkdownSubsetError: .sourcePath undefined or empty when not provided", () => {
  let caught = null;
  try {
    render("## only sub");
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof MarkdownSubsetError);
  assert.ok(
    caught.sourcePath === undefined || caught.sourcePath === null || caught.sourcePath === "",
    `expected sourcePath unset when not provided; got ${JSON.stringify(caught.sourcePath)}`,
  );
});

// ─── Determinism / purity (AC-1, AC-7 supporting) ──────────────────────────

test("AC-1 pure: render() does not throw on minimal valid input (just a heading)", () => {
  // Sanity: ensure the smallest possible valid doc renders without error.
  const html = render("# Just a heading");
  assert.match(html, /<h1>Just a heading<\/h1>/);
});

test("AC-1 escape: '>' in body is escaped to &gt;", () => {
  const html = r("Compare 2 > 1.");
  assert.match(html, /2 &gt; 1/);
});

test("AC-1 escape: no double-escape — &amp; in source becomes &amp; once", () => {
  // Source contains a literal '&'; output should escape to &amp; exactly once,
  // not produce &amp;amp;.
  const html = r("A & B");
  assert.match(html, /A &amp; B/);
  assert.ok(!/&amp;amp;/.test(html), `double-escape detected: ${html}`);
});

// ─── Story 4.6: allowZeroH1 option ─────────────────────────────────────────

test("Story 4.6: render() with allowZeroH1: true permits body with zero <h1>", () => {
  const html = render("## Subsection\n\nbody paragraph.", { allowZeroH1: true });
  assert.match(html, /<h2>Subsection<\/h2>/);
  assert.match(html, /<p>body paragraph\.<\/p>/);
  // No <h1> in output.
  assert.ok(!/<h1\b/.test(html), `expected no <h1> when allowZeroH1: true; got: ${html}`);
});

test("Story 4.6: render() with allowZeroH1: true still rejects multiple <h1>", () => {
  assert.throws(
    () => render("# One\n\nbody\n\n# Two", { allowZeroH1: true }),
    (err) => err instanceof MarkdownSubsetError,
  );
});

test("Story 4.6: render() default (no option) still rejects zero <h1>", () => {
  assert.throws(
    () => render("## Only sub\n\nbody"),
    (err) => err instanceof MarkdownSubsetError,
  );
});
