#!/usr/bin/env node
// tools/build-methodology.mjs — Story 4.1 corpus-build pipeline.
//
// Walks `src/content/methodology/en/` for *.md files, parses YAML frontmatter
// (mini-parser preserved from Story 3-6), runs the body through the
// markdown-subset strict-mode renderer, and emits one HTML file per page at
// `dist/methodology/<corpus-version>/en/<path>/index.html` plus a byte-copy
// companion at `dist/methodology/latest/en/<path>/index.html`.
//
// Corpus-version resolution (first match wins):
//   1. IQME_CORPUS_VERSION env (must match /^v\d+\.\d+\.\d+$/).
//   2. `git describe --tags --match 'corpus-v*' --abbrev=0` stripped of the
//      `corpus-` prefix.
//   3. Fallback literal `v0.1.0` (preserves Story 3-6 URL contract pre-tagging).
//
// Per-corpus-release re-emit (NFR25): every source page emits on every
// invocation regardless of whether content changed. No skip-if-unchanged logic.
//
// Stdlib-only (NFR33) + a single relative import of the in-repo renderer.
// Deterministic: no time-source or RNG calls in output.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { argv, env, cwd, exit, stderr, stdout } from "node:process";
import { execSync } from "node:child_process";

import { render, MarkdownSubsetError } from "./markdown-subset.mjs";

const CWD = cwd();
const SRC_ROOT = resolve(CWD, env.IQME_BUILD_METHODOLOGY_SRC || "src/content/methodology");
const OUT_ROOT = resolve(CWD, env.IQME_BUILD_METHODOLOGY_OUT || "dist/methodology");
const LANG = "en"; // Story 3-6 v1: EN only. Epic 7 adds RU/PL.
const SEMVER_RE = /^v\d+\.\d+\.\d+$/;
const FALLBACK_VERSION = "v0.1.0";

const REQUIRED_FRONTMATTER_KEYS = [
  "title", "version", "lastReviewed", "reviewer", "reviewerHandle",
  "asserts", "glossaryRefs", "sourceHashEN",
];

function die(msg) {
  stderr.write(`build-methodology: ERROR ${msg}\n`);
  exit(1);
}

// HTML-text escape for chrome strings (title, footer, masthead). Body is
// already escaped by the subset renderer.
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function resolveCorpusVersion() {
  const fromEnv = env.IQME_CORPUS_VERSION;
  if (fromEnv) {
    if (!SEMVER_RE.test(fromEnv)) {
      die(`IQME_CORPUS_VERSION=${JSON.stringify(fromEnv)} does not match /^v\\d+\\.\\d+\\.\\d+$/`);
    }
    return fromEnv;
  }
  try {
    const out = execSync("git describe --tags --match 'corpus-v*' --abbrev=0", {
      stdio: ["ignore", "pipe", "ignore"], encoding: "utf8",
    }).trim();
    const m = out.match(/^corpus-(v\d+\.\d+\.\d+)$/);
    if (m) return m[1];
  } catch {
    // No corpus-v* tag exists, or not a git repo. Fall through to literal.
  }
  return FALLBACK_VERSION;
}

// Frontmatter mini-parser preserved from Story 3-6. Accepts flat key:value with
// quoted/bareword/bool scalars and one-level block lists of strings.
function parseFrontmatter(text, srcPath) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error(`missing frontmatter delimiter (first line must be "---") in ${srcPath}`);
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { endIdx = i; break; }
  }
  if (endIdx === -1) {
    throw new Error(`missing closing frontmatter delimiter "---" in ${srcPath}`);
  }
  const fm = {};
  let i = 1;
  while (i < endIdx) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) {
      throw new Error(`parsing frontmatter at ${srcPath}: cannot parse line ${i + 1}: ${JSON.stringify(line)}`);
    }
    const key = m[1];
    const rest = m[2];
    if (rest === "") {
      const items = [];
      i++;
      while (i < endIdx) {
        const lst = lines[i].match(/^\s+-\s+(.*)$/);
        if (!lst) break;
        items.push(parseScalar(lst[1].trim(), srcPath, i));
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

function validateRequiredFrontmatter(fm, srcPath) {
  for (const k of REQUIRED_FRONTMATTER_KEYS) {
    if (!(k in fm)) {
      throw new Error(`frontmatter missing required key '${k}' in ${srcPath}`);
    }
  }
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

// Story 4.6 AC-8: the masthead chrome owns the page <h1>. Strip the leading
// `# <title>` line from the body before passing to the renderer so the body
// has zero <h1>s. The renderer is invoked with allowZeroH1: true to honour
// the masthead-owned-title convention.
function stripBodyLeadingH1(bodySrc) {
  const lines = bodySrc.split(/\r?\n/);
  let i = 0;
  // Skip leading blank lines.
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && /^#\s+\S/.test(lines[i])) {
    // Drop this line + any immediately-following blank line so paragraph
    // spacing is preserved deterministically.
    lines.splice(i, 1);
    if (i < lines.length && lines[i].trim() === "") {
      lines.splice(i, 1);
    }
  }
  return lines.join("\n");
}

// Build the canonical URL for a methodology page. v0.1.0 contract: relative
// URL fallback rooted at the version + lang segments emitted by the builder.
// Epic 8 (release.yml) is expected to replace this with the absolute canonical
// URL once the corpus deploys under a known origin.
function canonicalUrlFor(srcPath, corpusVersion) {
  const enRoot = join(SRC_ROOT, LANG);
  const rel = relative(enRoot, srcPath).replace(/\\/g, "/");
  const noExt = rel.replace(/\.md$/, "");
  // Use the directory path (drop trailing /index → directory URL).
  const dirPath = noExt.endsWith("/index") ? noExt.slice(0, -"/index".length) : noExt;
  return `/methodology/${corpusVersion}/${LANG}/${dirPath}/`;
}

function renderPage(srcPath, fm, bodySrc, corpusVersion) {
  const title = esc(fm.title || "(untitled)");
  const reviewer = esc(fm.reviewer || "TBD");
  const reviewerHandle = esc(fm.reviewerHandle || "@TBD");
  const lastReviewed = esc(fm.lastReviewed || "0000-00-00");
  const version = esc(corpusVersion);
  const doi = esc(fm.doi || "");
  const url = esc(canonicalUrlFor(srcPath, corpusVersion));
  // Strip body's leading `# Title` line (masthead owns the page <h1>).
  const strippedBody = stripBodyLeadingH1(bodySrc);
  // Body rendered via subset renderer with allowZeroH1: true (Story 4.6 AC-8).
  const bodyHtml = render(strippedBody, { sourcePath: srcPath, allowZeroH1: true });
  // DOI text: visible-fallback when empty (Story 4.6 AC-5).
  const doiLine = doi
    ? `<p class="methodology-masthead__doi">DOI: ${doi}</p>`
    : `<p class="methodology-masthead__doi" data-doi-pending>DOI: pending v1.0.0 release</p>`;
  return (
    `<!doctype html>\n` +
    `<html lang="en">\n` +
    `<head>\n` +
    `<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    `<title>${title} — IQ-ME methodology ${version}</title>\n` +
    `<meta name="iqme-title" content="${title}">\n` +
    `<meta name="iqme-version" content="${version}">\n` +
    `<meta name="iqme-doi" content="${doi}">\n` +
    `<meta name="iqme-last-reviewed" content="${lastReviewed}">\n` +
    `<meta name="iqme-reviewer" content="${reviewer}">\n` +
    `<meta name="iqme-reviewer-handle" content="${reviewerHandle}">\n` +
    `<meta name="iqme-lang" content="${LANG}">\n` +
    `<meta name="iqme-url" content="${url}">\n` +
    `<link rel="stylesheet" href="/src/css/primitives.css">\n` +
    `<link rel="stylesheet" href="/src/css/semantic.css">\n` +
    `<link rel="stylesheet" href="/src/css/components/masthead.css">\n` +
    `<link rel="stylesheet" href="/src/css/components/cite-this-page-widget.css">\n` +
    `<script type="module" src="/src/assessment/cite-this-page.js" defer></script>\n` +
    `</head>\n` +
    `<body>\n` +
    `<header class="methodology-masthead">\n` +
    `<h1 class="methodology-masthead__title">${title}</h1>\n` +
    `<p class="methodology-masthead__version">${version}</p>\n` +
    doiLine + `\n` +
    `<p class="methodology-masthead__last-reviewed">Last reviewed: <time datetime="${lastReviewed}">${lastReviewed}</time></p>\n` +
    `<p class="methodology-masthead__reviewer">Reviewer: ${reviewer} (${reviewerHandle})</p>\n` +
    `</header>\n` +
    `<main>\n` +
    bodyHtml +
    `\n</main>\n` +
    `<aside class="cite-this-page-affordance"><div data-cite-widget></div></aside>\n` +
    `</body>\n` +
    `</html>\n`
  );
}

function outputPathFor(srcPath, corpusVersion, latest = false) {
  const enRoot = join(SRC_ROOT, LANG);
  const rel = relative(enRoot, srcPath);
  if (rel.startsWith("..")) return null;
  const htmlRel = rel.replace(/\.md$/, ".html");
  const versionSegment = latest ? "latest" : corpusVersion;
  return join(OUT_ROOT, versionSegment, LANG, htmlRel);
}

function main() {
  const corpusVersion = resolveCorpusVersion();
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
      validateRequiredFrontmatter(parsed.fm, srcPath);
    } catch (e) {
      die(e.message);
    }
    const bodySrc = parsed.lines.slice(parsed.bodyStart).join("\n");
    let html;
    try {
      html = renderPage(srcPath, parsed.fm, bodySrc, corpusVersion);
    } catch (e) {
      if (e instanceof MarkdownSubsetError) {
        die(`markdown-subset rejected page: ${e.message}`);
      }
      die(`rendering ${srcPath}: ${e.message}`);
    }
    const versionedOut = outputPathFor(srcPath, corpusVersion, false);
    const latestOut = outputPathFor(srcPath, corpusVersion, true);
    if (!versionedOut || !latestOut) {
      die(`source path ${srcPath} is outside SRC_ROOT/${LANG}`);
    }
    try {
      mkdirSync(dirname(versionedOut), { recursive: true });
      writeFileSync(versionedOut, html);
      mkdirSync(dirname(latestOut), { recursive: true });
      writeFileSync(latestOut, html);
    } catch (e) {
      die(`writing output: ${e.message}`);
    }
    count++;
  }
  stdout.write(`build-methodology: built ${count} pages → ${OUT_ROOT}/{${corpusVersion},latest}/${LANG}/\n`);
}

main();
