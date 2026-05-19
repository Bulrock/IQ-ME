#!/usr/bin/env node
// tools/build-methodology.mjs — Epic 3 interim stub renderer.
//
// Walks `src/content/methodology/en/` for *.md files, parses YAML frontmatter,
// wraps the raw markdown body in <pre class="methodology-stub-source">, and
// emits one HTML file per page at `dist/methodology/v0.1.0/en/<path>/index.html`.
//
// This is INTERIM infrastructure. Epic 4 (Story 4.1) lands the real renderer
// with markdown-subset-v1 parsing, glossary-link rewriting, hatnote injection,
// per-corpus-release re-emit, and build-time `git describe --tags --match
// 'corpus-v*' --abbrev=0` version baking. The hard-coded "v0.1.0" here matches
// Story 3-5's CORPUS_VERSION + Story 3-8's planned `corpus-v0.1.0` initial tag
// (per docs/adr/release-tag-namespace-contract.md).
//
// Stdlib-only (NFR33). Deterministic: no time-source or RNG calls in output.
// Env overrides for tests: IQME_BUILD_METHODOLOGY_SRC, IQME_BUILD_METHODOLOGY_OUT.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { argv, env, cwd, exit, stderr, stdout } from "node:process";

const CWD = cwd();
const SRC_ROOT = resolve(CWD, env.IQME_BUILD_METHODOLOGY_SRC || "src/content/methodology");
const OUT_ROOT = resolve(CWD, env.IQME_BUILD_METHODOLOGY_OUT || "dist/methodology");
const VERSION = "v0.1.0"; // Epic 4: replace with `git describe --tags --match 'corpus-v*' --abbrev=0`
const LANG = "en"; // Story 3-6 v1: EN only. Epic 7 adds RU/PL.

function die(msg) {
  stderr.write(`build-methodology: ERROR ${msg}\n`);
  exit(1);
}

// HTML-text escape for <pre> bodies + <title>. Order matters: & first.
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minimal frontmatter parser: flat key:value with string / bool / list-of-strings.
// Supports:
//   key: "quoted"
//   key: bareword
//   key: true / false
//   key:
//     - item1
//     - item2
// Throws on parse failure.
function parseFrontmatter(text, srcPath) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error(`missing frontmatter delimiter (first line must be "---") in ${srcPath}`);
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) {
    throw new Error(`missing closing frontmatter delimiter "---" in ${srcPath}`);
  }
  const fm = {};
  let i = 1;
  while (i < endIdx) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) {
      throw new Error(`parsing frontmatter at ${srcPath}: cannot parse line ${i + 1}: ${JSON.stringify(line)}`);
    }
    const key = m[1];
    const rest = m[2];
    if (rest === "") {
      // Block list follows
      const items = [];
      i++;
      while (i < endIdx) {
        const lst = lines[i].match(/^\s+-\s+(.*)$/);
        if (!lst) break;
        const v = lst[1].trim();
        items.push(parseScalar(v, srcPath, i));
        i++;
      }
      fm[key] = items;
      continue;
    }
    fm[key] = parseScalar(rest, srcPath, i);
    i++;
  }
  return { fm, bodyStart: endIdx + 1, lines };
}

function parseScalar(raw, srcPath, lineNum) {
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith('"')) {
    if (!v.endsWith('"') || v.length < 2) {
      throw new Error(`parsing frontmatter at ${srcPath}:${lineNum + 1}: unterminated quoted string: ${raw}`);
    }
    return v.slice(1, -1);
  }
  if (v.startsWith("'")) {
    if (!v.endsWith("'") || v.length < 2) {
      throw new Error(`parsing frontmatter at ${srcPath}:${lineNum + 1}: unterminated quoted string: ${raw}`);
    }
    return v.slice(1, -1);
  }
  return v;
}

function* walkMd(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return;
    throw e;
  }
  // Sort for deterministic iteration order.
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkMd(p);
    } else if (e.isFile() && e.name.endsWith(".md")) {
      yield p;
    }
  }
}

function renderPage(srcPath, fm, bodySrc) {
  const title = esc(fm.title || "(untitled)");
  const reviewer = esc(fm.reviewer || "TBD");
  const reviewerHandle = esc(fm.reviewerHandle || "@TBD");
  const lastReviewed = esc(fm.lastReviewed || "0000-00-00");
  const body = esc(bodySrc);
  return (
    `<!doctype html>\n` +
    `<html lang="en">\n` +
    `<head>\n` +
    `<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    `<title>${title} — IQ-ME methodology v0.1.0</title>\n` +
    `</head>\n` +
    `<body>\n` +
    `<header class="methodology-masthead">\n` +
    `<a href="/">IQ-ME</a> · methodology corpus · <span class="methodology-masthead__version">v0.1.0</span>\n` +
    `</header>\n` +
    `<main>\n` +
    `<h1>${title}</h1>\n` +
    `<pre class="methodology-stub-source">${body}</pre>\n` +
    `</main>\n` +
    `<footer class="methodology-footer">\n` +
    `<p>Reviewer: ${reviewer} (${reviewerHandle}). Last reviewed: ${lastReviewed}.</p>\n` +
    `<p>This page is a v0.1.0 stub. Epic 5 lands the full corpus prose. The page URL is the permanent commitment.</p>\n` +
    `</footer>\n` +
    `</body>\n` +
    `</html>\n`
  );
}

function outputPathFor(srcPath) {
  const enRoot = join(SRC_ROOT, LANG);
  const rel = relative(enRoot, srcPath);
  if (rel.startsWith("..")) return null;
  // src/content/methodology/en/scoring/percentile-to-iq/index.md
  //   → dist/methodology/v0.1.0/en/scoring/percentile-to-iq/index.html
  const htmlRel = rel.replace(/\.md$/, ".html");
  return join(OUT_ROOT, VERSION, LANG, htmlRel);
}

function main() {
  const enRoot = join(SRC_ROOT, LANG);
  let count = 0;
  for (const srcPath of walkMd(enRoot)) {
    let text;
    try {
      text = readFileSync(srcPath, "utf8");
    } catch (e) {
      die(`reading ${srcPath}: ${e.message}`);
    }
    let parsed;
    try {
      parsed = parseFrontmatter(text, srcPath);
    } catch (e) {
      die(e.message);
    }
    const bodySrc = parsed.lines.slice(parsed.bodyStart).join("\n");
    const html = renderPage(srcPath, parsed.fm, bodySrc);
    const outPath = outputPathFor(srcPath);
    if (!outPath) {
      die(`source path ${srcPath} is outside SRC_ROOT/${LANG}`);
    }
    try {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, html);
    } catch (e) {
      die(`writing ${outPath}: ${e.message}`);
    }
    count++;
  }
  stdout.write(`build-methodology: built ${count} pages → ${OUT_ROOT}/${VERSION}/${LANG}/\n`);
}

main();
