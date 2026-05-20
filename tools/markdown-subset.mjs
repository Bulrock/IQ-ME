// tools/markdown-subset.mjs
//
// Story 4.1 — strict-mode subset markdown renderer per corpus/markdown-subset-v1.md
// and architecture.md §D1 (hand-rolled, stdlib-only, auditable-at-a-glance).
//
// Pure function: render(source, { sourcePath? }) → HTML string. No FS, no
// time-source, no RNG. Any unrecognized construct throws MarkdownSubsetError
// carrying { line, column, sourcePath } for upstream diagnostics.
//
// Implements: ATX headings #-####, paragraphs, *em* / **strong**, code fences,
// inline backticks, inline + reference links, ordered/unordered lists up to
// depth 2. Rejects: setext headings, autolinks, image links, underscore
// emphasis, pipe tables, list depth ≥ 3, multiple/zero level-1 headings.

export class MarkdownSubsetError extends Error {
  constructor(message, { line, column, sourcePath } = {}) {
    super(message);
    this.name = "MarkdownSubsetError";
    this.line = line;
    this.column = column;
    this.sourcePath = sourcePath;
  }
}

const escAttr = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escText = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function fail(msg, lineNum, col, sourcePath) {
  throw new MarkdownSubsetError(
    `markdown-subset: ${msg}${sourcePath ? ` at ${sourcePath}:${lineNum}:${col}` : ` at line ${lineNum}:${col}`}`,
    { line: lineNum, column: col, sourcePath },
  );
}

// Inline rendering: emphasis, strong, code spans, links. References resolved
// from refMap; out-of-subset constructs throw.
function renderInline(text, lineNum, sourcePath, refMap) {
  // Reject forbidden inline constructs up front (column = 1-based offset).
  const forbidden = [
    { re: /!\[[^\]]*\]\([^)]*\)/, msg: "image links are not permitted" },
    { re: /<https?:[^>\s]+>/, msg: "autolinks are not permitted" },
    { re: /(^|[^\w*])_[^_\s][^_]*_(?!\w)/, msg: "underscore emphasis is not permitted" },
    { re: /__[^_\s][^_]*__/, msg: "underscore strong is not permitted" },
    { re: /\*\*\*[^*]+\*\*\*/, msg: "triple-nested emphasis (depth 3) is not permitted" },
  ];
  for (const { re, msg } of forbidden) {
    const m = text.match(re);
    if (m) fail(msg, lineNum, (m.index ?? 0) + 1, sourcePath);
  }

  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    // Inline code: `…`
    if (c === "`") {
      const end = text.indexOf("`", i + 1);
      if (end === -1) fail("unterminated inline code span", lineNum, i + 1, sourcePath);
      out += `<code>${escText(text.slice(i + 1, end))}</code>`;
      i = end + 1;
      continue;
    }
    // Inline link: [text](url) or reference [text][ref]
    if (c === "[") {
      const closeBracket = text.indexOf("]", i + 1);
      if (closeBracket === -1) fail("unterminated link text", lineNum, i + 1, sourcePath);
      const linkText = text.slice(i + 1, closeBracket);
      if (text[closeBracket + 1] === "(") {
        const closeParen = text.indexOf(")", closeBracket + 2);
        if (closeParen === -1) fail("unterminated link target", lineNum, closeBracket + 2, sourcePath);
        const url = text.slice(closeBracket + 2, closeParen);
        out += `<a href="${escAttr(url)}">${renderInline(linkText, lineNum, sourcePath, refMap)}</a>`;
        i = closeParen + 1;
        continue;
      }
      if (text[closeBracket + 1] === "[") {
        const closeRef = text.indexOf("]", closeBracket + 2);
        if (closeRef === -1) fail("unterminated reference link", lineNum, closeBracket + 2, sourcePath);
        const refKey = text.slice(closeBracket + 2, closeRef);
        const target = refMap.get(refKey);
        if (!target) fail(`undefined reference link [${refKey}]`, lineNum, i + 1, sourcePath);
        out += `<a href="${escAttr(target)}">${renderInline(linkText, lineNum, sourcePath, refMap)}</a>`;
        i = closeRef + 1;
        continue;
      }
      // Bracketed but no following ( or [ — treat as literal text.
      out += escText(text.slice(i, closeBracket + 1));
      i = closeBracket + 1;
      continue;
    }
    // Strong: **…**
    if (c === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end === -1) fail("unterminated strong emphasis", lineNum, i + 1, sourcePath);
      out += `<strong>${renderInline(text.slice(i + 2, end), lineNum, sourcePath, refMap)}</strong>`;
      i = end + 2;
      continue;
    }
    // Emphasis: *…*
    if (c === "*") {
      const end = text.indexOf("*", i + 1);
      if (end === -1) fail("unterminated emphasis", lineNum, i + 1, sourcePath);
      out += `<em>${renderInline(text.slice(i + 1, end), lineNum, sourcePath, refMap)}</em>`;
      i = end + 1;
      continue;
    }
    out += escText(c);
    i++;
  }
  return out;
}

// Parse list items into an HTML <ul>/<ol> tree, up to depth 2. Each item
// is (indent, marker, body, lineNum). Lines have already been validated as
// matching a list marker pattern.
function renderList(items, sourcePath) {
  // Top-level marker determines outer tag.
  const outerMarker = items[0].ordered ? "ol" : "ul";
  let html = `<${outerMarker}>`;
  let i = 0;
  while (i < items.length) {
    const it = items[i];
    if (it.depth !== 0) {
      // depth 1 (nested) belongs inside previous item; depth ≥ 2 forbidden.
      fail(`list depth ${it.depth + 1} exceeds maximum 2`, it.lineNum, 1, sourcePath);
    }
    let body = `<li>${renderInline(it.body, it.lineNum, sourcePath, it.refMap)}`;
    // Collect nested items belonging to this top-level item.
    const nested = [];
    while (i + 1 < items.length && items[i + 1].depth === 1) {
      nested.push(items[i + 1]);
      i++;
    }
    if (nested.length > 0) {
      const innerMarker = nested[0].ordered ? "ol" : "ul";
      body += `<${innerMarker}>`;
      for (const n of nested) {
        body += `<li>${renderInline(n.body, n.lineNum, sourcePath, n.refMap)}</li>`;
      }
      body += `</${innerMarker}>`;
    }
    body += "</li>";
    html += body;
    i++;
  }
  html += `</${outerMarker}>`;
  return html;
}

export function render(source, options = {}) {
  const sourcePath = options.sourcePath;
  // Story 4.6: callers that own the page <h1> in chrome (e.g. the methodology
  // builder's masthead template) opt in with allowZeroH1: true. Default keeps
  // the Story-4.1 strict-mode invariant (exactly one level-1 heading).
  const allowZeroH1 = options.allowZeroH1 === true;
  const lines = String(source).split(/\r?\n/);

  // Phase 1: extract trailing reference-link definitions `[ref]: url`.
  // They may appear only at end-of-document; scan from bottom skipping blanks.
  const refMap = new Map();
  let endIdx = lines.length;
  while (endIdx > 0) {
    const ln = lines[endIdx - 1];
    if (ln.trim() === "") { endIdx--; continue; }
    const m = ln.match(/^\[([^\]]+)\]:\s+(\S+)\s*$/);
    if (m) { refMap.set(m[1], m[2]); endIdx--; continue; }
    break;
  }
  // Effective lines = body without trailing refs.
  const body = lines.slice(0, endIdx);

  // Phase 2: count level-1 headings + reject setext.
  let h1Count = 0;
  for (let i = 0; i < body.length; i++) {
    if (/^#\s+\S/.test(body[i])) h1Count++;
    // Setext detection: a non-blank line followed by ==== or ----.
    if (i + 1 < body.length && body[i].trim() !== "" && /^(={3,}|-{3,})\s*$/.test(body[i + 1])) {
      // Allow `---` only if preceded by blank (could be frontmatter remnant), but
      // here the contract is body-only post-stripping. Treat as setext heading reject.
      fail("setext-style headings are not permitted; use ATX (# / ## / …)", i + 2, 1, sourcePath);
    }
  }
  if (h1Count > 1) {
    fail(
      `page must declare exactly one level-1 heading; found ${h1Count}`,
      1, 1, sourcePath,
    );
  }
  if (h1Count === 0 && !allowZeroH1) {
    fail(
      `page must declare exactly one level-1 heading; found 0`,
      1, 1, sourcePath,
    );
  }

  // Phase 3: block-level walk.
  let out = "";
  let i = 0;
  while (i < body.length) {
    const lineNum = i + 1;
    const ln = body[i];

    // Blank line → skip.
    if (ln.trim() === "") { i++; continue; }

    // Code fence.
    const fence = ln.match(/^```([A-Za-z0-9_+-]*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf = [];
      i++;
      while (i < body.length && !/^```\s*$/.test(body[i])) {
        buf.push(body[i]);
        i++;
      }
      if (i >= body.length) fail("unterminated code fence", lineNum, 1, sourcePath);
      const cls = lang ? ` class="language-${escAttr(lang)}"` : "";
      out += `<pre><code${cls}>${escText(buf.join("\n"))}\n</code></pre>`;
      i++;
      continue;
    }

    // ATX heading.
    const h = ln.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      out += `<h${level}>${renderInline(text, lineNum, sourcePath, refMap)}</h${level}>`;
      i++;
      continue;
    }
    if (/^#{5,}\s/.test(ln)) {
      fail("heading levels 5+ are not permitted (subset allows #-####)", lineNum, 1, sourcePath);
    }

    // Pipe table reject.
    if (/^\s*\|.*\|/.test(ln)) fail("pipe tables are not permitted", lineNum, 1, sourcePath);

    // List item.
    const listMatch = ln.match(/^(\s*)(-|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const items = [];
      while (i < body.length) {
        const cur = body[i];
        if (cur.trim() === "") break;
        const lm = cur.match(/^(\s*)(-|\d+\.)\s+(.*)$/);
        if (!lm) break;
        const indent = lm[1].length;
        // Depth 0: indent 0-1; depth 1: indent 2-3; depth ≥ 2: reject.
        let depth;
        if (indent <= 1) depth = 0;
        else if (indent <= 3) depth = 1;
        else depth = Math.floor(indent / 2);
        items.push({
          depth, ordered: /^\d+\./.test(lm[2]),
          body: lm[3], lineNum: i + 1, refMap,
        });
        i++;
      }
      out += renderList(items, sourcePath);
      continue;
    }

    // Paragraph: collect consecutive non-blank, non-special lines.
    const buf = [];
    while (i < body.length) {
      const cur = body[i];
      if (cur.trim() === "") break;
      if (/^#{1,6}\s/.test(cur)) break;
      if (/^```/.test(cur)) break;
      if (/^(\s*)(-|\d+\.)\s+/.test(cur)) break;
      if (/^\s*\|.*\|/.test(cur)) {
        fail("pipe tables are not permitted", i + 1, 1, sourcePath);
      }
      buf.push(cur);
      i++;
    }
    const joined = buf.join("\n");
    out += `<p>${renderInline(joined, lineNum, sourcePath, refMap)}</p>`;
  }
  return out;
}
