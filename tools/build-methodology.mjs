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

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { argv, env, cwd, exit, stderr, stdout } from "node:process";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

import { render, MarkdownSubsetError } from "./markdown-subset.mjs";

const CWD = cwd();
const SRC_ROOT = resolve(CWD, env.IQME_BUILD_METHODOLOGY_SRC || "src/content/methodology");
// Output root precedence (Story bridge-9a-1 — concurrency isolation):
//   1. IQME_BUILD_METHODOLOGY_OUT — explicit per-test methodology override.
//   2. <IQME_DIST_DIR>/methodology — relocates the whole dist/ root (lets a
//      test redirect `make build` to a per-test tmpdir so a concurrent build
//      never cross-contaminates the shared dist/).
//   3. dist/methodology — shared default.
const OUT_ROOT = resolve(
  CWD,
  env.IQME_BUILD_METHODOLOGY_OUT || join(env.IQME_DIST_DIR || "dist", "methodology"),
);
// Story 3-6 launched with EN only; Story 4-7 extends the builder so it can
// walk RU/PL locale trees and apply the stale-translation hatnote hook. At
// Epic 4 close, only EN content exists in-repo — RU/PL trees are
// .gitkeep-only and produce zero pages.
const LOCALES = ["en", "ru", "pl"];

// PR-9 (AC11) — theme-bootstrap for static methodology pages. A BLOCKING
// external <script src> (classic, not module) in <head> applies the SPA's
// persisted <html>[data-theme] before paint (no flash). External src keeps it
// CSP-clean (lint-csp-source forbids inline script bodies); same-origin only
// (NFR6 zero-third-party). System default (no key) → no attribute.
const THEME_BOOT =
  `<script src="/src/assessment/methodology-theme.js"></script>\n`;
// Retained for callers that historically referenced LANG; canonical EN path.
const LANG = "en";
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
function canonicalUrlFor(srcPath, lang, corpusVersion) {
  const localeRoot = join(SRC_ROOT, lang);
  const rel = relative(localeRoot, srcPath).replace(/\\/g, "/");
  const noExt = rel.replace(/\.md$/, "");
  // Use the directory path (drop trailing /index → directory URL).
  const dirPath = noExt.endsWith("/index") ? noExt.slice(0, -"/index".length) : noExt;
  return `/methodology/${corpusVersion}/${lang}/${dirPath}/`;
}

// Story 4.7 AC-3 — compute SHA-256 of the body-only portion of an EN source
// file (everything after the second `---` line). Returns undefined when the
// EN counterpart does not exist on disk (graceful no-counterpart path).
function enSourceHashFor(srcPath, lang) {
  if (lang === "en") return undefined;
  const localeRoot = join(SRC_ROOT, lang);
  const rel = relative(localeRoot, srcPath);
  const enCounterpart = join(SRC_ROOT, "en", rel);
  if (!existsSync(enCounterpart)) {
    stderr.write(
      `build-methodology: WARN no EN counterpart for ${lang}/${rel} at ${enCounterpart}; ` +
        `stale-translation hatnote skipped\n`,
    );
    return undefined;
  }
  const text = readFileSync(enCounterpart, "utf8");
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return undefined;
  const body = lines.slice(end + 1).join("\n");
  return createHash("sha256").update(body, "utf8").digest("hex");
}

function renderPage(srcPath, lang, fm, bodySrc, corpusVersion) {
  const title = esc(fm.title || "(untitled)");
  const reviewer = esc(fm.reviewer || "TBD");
  const reviewerHandle = esc(fm.reviewerHandle || "@TBD");
  const lastReviewed = esc(fm.lastReviewed || "0000-00-00");
  const version = esc(corpusVersion);
  const doi = esc(fm.doi || "");
  const url = esc(canonicalUrlFor(srcPath, lang, corpusVersion));
  // Strip body's leading `# Title` line (masthead owns the page <h1>).
  const strippedBody = stripBodyLeadingH1(bodySrc);
  // Body rendered via subset renderer with allowZeroH1: true (Story 4.6 AC-8).
  const bodyHtml = render(strippedBody, { sourcePath: srcPath, allowZeroH1: true });
  // DOI text: visible-fallback when empty (Story 4.6 AC-5).
  const doiLine = doi
    ? `<p class="methodology-masthead__doi">DOI: ${doi}</p>`
    : `<p class="methodology-masthead__doi" data-doi-pending>DOI: pending v1.0.0 release</p>`;
  // Story 4.7 AC-3 — translation-stale detection. Only fires for non-EN pages
  // with an existing EN counterpart whose body-SHA disagrees with the page's
  // frontmatter sourceHashEN.
  const enHash = enSourceHashFor(srcPath, lang);
  const isStale = enHash !== undefined && enHash !== fm.sourceHashEN;
  // Story 5.1 — translationStatus body attr hook for the
  // translation-in-progress-stub composition. The CSS-side hook is wired
  // today; the full body-suppression render branch is deferred to Epic 7.
  const isInProgress = lang !== "en" && fm.translationStatus === "in-progress";
  const bodyAttrs =
    `data-lang="${lang}"` +
    (isStale ? ` data-translation-stale="true"` : "") +
    (isInProgress ? ` data-translation-status="in-progress"` : "");
  // Hatnote always rendered (uniform DOM across locales); CSS hides it unless
  // an ancestor carries data-translation-stale="true".
  const enUrl = esc(canonicalUrlFor(srcPath, "en", corpusVersion));
  const hatnote =
    `<aside class="stale-translation-hatnote" role="note">\n` +
    `<p>This page may be out of date relative to its English source. ` +
    `<a href="${enUrl}">View source EN page</a>.</p>\n` +
    `</aside>\n`;
  // Story 7.7 (FR31) — hreflang alternates pointing to the equivalent page in
  // every locale (same relative path, versioned-permalink contract). Derive the
  // locale-independent dir path once from the current page, then build the
  // per-locale permalink matching canonicalUrlFor's format.
  const relFromLocale = relative(join(SRC_ROOT, lang), srcPath).replace(/\\/g, "/").replace(/\.md$/, "");
  const hreflangDir = relFromLocale.endsWith("/index")
    ? relFromLocale.slice(0, -"/index".length)
    : relFromLocale;
  const hreflangLinks = LOCALES.map(
    (L) => `<link rel="alternate" hreflang="${L}" href="/methodology/${corpusVersion}/${L}/${hreflangDir}/">`,
  ).join("\n") + "\n";
  return (
    `<!doctype html>\n` +
    `<html lang="${lang}">\n` +
    `<head>\n` +
    `<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    THEME_BOOT +
    `<title>${title} — IQ-ME methodology ${version}</title>\n` +
    `<meta name="iqme-title" content="${title}">\n` +
    `<meta name="iqme-version" content="${version}">\n` +
    `<meta name="iqme-doi" content="${doi}">\n` +
    `<meta name="iqme-last-reviewed" content="${lastReviewed}">\n` +
    `<meta name="iqme-reviewer" content="${reviewer}">\n` +
    `<meta name="iqme-reviewer-handle" content="${reviewerHandle}">\n` +
    `<meta name="iqme-lang" content="${lang}">\n` +
    `<meta name="iqme-url" content="${url}">\n` +
    hreflangLinks +
    `<link rel="stylesheet" href="/src/css/reset.css">\n` +
    `<link rel="stylesheet" href="/src/css/primitives.css">\n` +
    `<link rel="stylesheet" href="/src/css/semantic.css">\n` +
    `<link rel="stylesheet" href="/src/css/base.css">\n` +
    `<link rel="stylesheet" href="/src/css/components/masthead.css">\n` +
    `<link rel="stylesheet" href="/src/css/components/cite-this-page-widget.css">\n` +
    `<link rel="stylesheet" href="/src/css/components/stale-translation-hatnote.css">\n` +
    `<script type="module" src="/src/assessment/cite-this-page.js" defer></script>\n` +
    `</head>\n` +
    `<body ${bodyAttrs}>\n` +
    `<header class="methodology-masthead">\n` +
    `<h1 class="methodology-masthead__title">${title}</h1>\n` +
    `<p class="methodology-masthead__version">${version}</p>\n` +
    doiLine + `\n` +
    `<p class="methodology-masthead__last-reviewed">Last reviewed: <time datetime="${lastReviewed}">${lastReviewed}</time></p>\n` +
    `<p class="methodology-masthead__reviewer">Reviewer: ${reviewer} (${reviewerHandle})</p>\n` +
    langSwitcherHtml(corpusVersion, hreflangDir, lang) + `\n` +
    `</header>\n` +
    hatnote +
    `<main>\n` +
    bodyHtml +
    `\n</main>\n` +
    `<aside class="cite-this-page-affordance"><div data-cite-widget></div></aside>\n` +
    `</body>\n` +
    `</html>\n`
  );
}

// PR-12b (AC15): emit every page as a directory-style index.html so its served
// URL carries the trailing slash that canonicalUrlFor()/hreflang already use
// (e.g. scoring/eap.md → scoring/eap/index.html → served at scoring/eap/).
// This removes the no-slash 404 class — a flat scoring/eap.html was linked as
// scoring/eap (no slash, no extension) and 404'd. `index.md` stays index.html.
function htmlRelFor(srcPath, lang) {
  const rel = relative(join(SRC_ROOT, lang), srcPath).replace(/\\/g, "/");
  if (rel.startsWith("..")) return null;
  const noExt = rel.replace(/\.md$/, "");
  return (noExt === "index" || noExt.endsWith("/index")) ? noExt + ".html" : noExt + "/index.html";
}

function outputPathFor(srcPath, lang, corpusVersion, latest = false) {
  const htmlRel = htmlRelFor(srcPath, lang);
  if (htmlRel === null) return null;
  const versionSegment = latest ? "latest" : corpusVersion;
  return join(OUT_ROOT, versionSegment, lang, htmlRel);
}

// Story interim-demo — auto-generated corpus table-of-contents. The footer's
// "Read the methodology" links to /methodology/<ver>/<lang>/, which had no
// page. This emits one index.html per lang (versioned + latest) listing every
// built page, grouped by top-level section. Generated artifact (not source
// markdown) → exempt from the frontmatter / reading-level / parity corpus lints.
const SECTION_ORDER = [
  "constructs", "scoring", "norming", "limitations",
  "ethics", "provenance", "reference", "tails",
];

function humanizeSection(seg) {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// PR-12 (Story 11-1): localized chrome for the static methodology pages — the
// index masthead title, lede, and section headings, plus the visible EN/RU/PL
// language switcher (the static pages have no SPA chrome, so without this there
// is no way to reach the translated locales).
const INDEX_I18N = {
  en: {
    mastheadTitle: "IQ-ME methodology",
    lede: "What IRT is, where the validity envelope ends, and why a 16-item screener is not a clinical evaluation.",
    langLabel: "Language",
    sections: { constructs: "Constructs", scoring: "Scoring", limitations: "Limitations", provenance: "Provenance", reference: "Reference", tails: "Tails" },
  },
  ru: {
    mastheadTitle: "Методология IQ-ME",
    lede: "Что такое IRT, где заканчивается рамка валидности и почему скринер из 16 заданий — не клиническое обследование.",
    langLabel: "Язык",
    sections: { constructs: "Конструкты", scoring: "Подсчёт баллов", limitations: "Ограничения", provenance: "Происхождение", reference: "Справочные материалы", tails: "Хвосты распределения" },
  },
  pl: {
    mastheadTitle: "Metodologia IQ-ME",
    lede: "Czym jest IRT, gdzie kończy się zakres ważności i dlaczego 16-zadaniowy przesiewacz nie jest oceną kliniczną.",
    langLabel: "Język",
    sections: { constructs: "Konstrukty", scoring: "Punktacja", limitations: "Ograniczenia", provenance: "Pochodzenie", reference: "Materiały źródłowe", tails: "Krańce rozkładu" },
  },
};

const LANG_LABEL = { en: "EN", ru: "RU", pl: "PL" };

// Visible EN/RU/PL switcher linking to the same page in every locale.
function langSwitcherHtml(version, dir, currentLang) {
  const aria = (INDEX_I18N[currentLang] || INDEX_I18N.en).langLabel;
  const links = LOCALES.map((L) => {
    const href = `/methodology/${version}/${L}/${dir ? dir + "/" : ""}`;
    const current = L === currentLang ? ' aria-current="true"' : "";
    return `<a class="methodology-lang-switcher__link" href="${href}"${current}>${LANG_LABEL[L]}</a>`;
  }).join("");
  return `<nav class="methodology-lang-switcher" aria-label="${esc(aria)}">${links}</nav>`;
}

function sectionLabel(lang, seg) {
  const map = (INDEX_I18N[lang] || INDEX_I18N.en).sections;
  return map[seg] || humanizeSection(seg);
}

function buildIndexHtml(lang, versionSegment, displayVersion, pages) {
  const bySection = new Map();
  for (const p of pages) {
    // PR-12b: htmlRel is now always <dir>/index.html → strip index.html for a
    // trailing-slash directory URL that resolves (no no-slash 404).
    const relDir = p.htmlRel.replace(/index\.html$/, "");
    const section = relDir.split("/")[0];
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push({ url: `/methodology/${versionSegment}/${lang}/${relDir}`, title: p.title });
  }
  const sections = [...bySection.keys()].sort((a, b) => {
    const ia = SECTION_ORDER.indexOf(a), ib = SECTION_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  // PR-11 (AC13): in-page anchor sidebar — each section gets an id and the
  // sidebar <nav> links to it. Single scrollable page, deep-linkable, native
  // keyboard-accessible (anchor activation scrolls to the id).
  const i18n = INDEX_I18N[lang] || INDEX_I18N.en;
  let sidebar = `<nav class="methodology-sidebar" aria-label="Methodology sections"><ul class="methodology-sidebar__list">`;
  for (const s of sections) {
    sidebar += `<li><a class="methodology-sidebar__link" href="#section-${esc(s)}">${esc(sectionLabel(lang, s))}</a></li>`;
  }
  sidebar += `</ul></nav>`;
  let body = "";
  for (const s of sections) {
    const items = bySection.get(s).sort((a, b) => a.title.localeCompare(b.title));
    body += `<section id="section-${esc(s)}" class="methodology-index__section"><h2 class="methodology-index__heading">${esc(sectionLabel(lang, s))}</h2><ul class="methodology-index__list">`;
    for (const it of items) body += `<li><a href="${esc(it.url)}">${esc(it.title)}</a></li>`;
    body += `</ul></section>`;
  }
  const hreflang = LOCALES.map(
    (L) => `<link rel="alternate" hreflang="${L}" href="/methodology/${versionSegment}/${L}/">`,
  ).join("\n");
  return (
    `<!doctype html>\n<html lang="${lang}">\n<head>\n` +
    `<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    THEME_BOOT +
    `<title>${esc(i18n.mastheadTitle)} ${esc(displayVersion)}</title>\n` +
    hreflang + `\n` +
    `<link rel="stylesheet" href="/src/css/reset.css">\n` +
    `<link rel="stylesheet" href="/src/css/primitives.css">\n` +
    `<link rel="stylesheet" href="/src/css/semantic.css">\n` +
    `<link rel="stylesheet" href="/src/css/base.css">\n` +
    `<link rel="stylesheet" href="/src/css/components/masthead.css">\n` +
    `</head>\n<body data-lang="${lang}" class="methodology-index-page">\n` +
    `<header class="methodology-masthead">\n` +
    `<h1 class="methodology-masthead__title">${esc(i18n.mastheadTitle)}</h1>\n` +
    `<p class="methodology-masthead__version">${esc(displayVersion)}</p>\n` +
    langSwitcherHtml(versionSegment, "", lang) + `\n` +
    `</header>\n` +
    `<div class="methodology-index__layout">\n` +
    sidebar + `\n` +
    `<main class="methodology-index">\n` +
    `<p class="methodology-index__lede">${esc(i18n.lede)}</p>\n` +
    body + `\n</main>\n</div>\n</body>\n</html>\n`
  );
}

function main() {
  const corpusVersion = resolveCorpusVersion();
  let count = 0;
  for (const lang of LOCALES) {
    const localeRoot = join(SRC_ROOT, lang);
    const pages = [];
    for (const srcPath of walkMd(localeRoot)) {
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
        html = renderPage(srcPath, lang, parsed.fm, bodySrc, corpusVersion);
      } catch (e) {
        if (e instanceof MarkdownSubsetError) {
          die(`markdown-subset rejected page: ${e.message}`);
        }
        die(`rendering ${srcPath}: ${e.message}`);
      }
      const versionedOut = outputPathFor(srcPath, lang, corpusVersion, false);
      const latestOut = outputPathFor(srcPath, lang, corpusVersion, true);
      if (!versionedOut || !latestOut) {
        die(`source path ${srcPath} is outside SRC_ROOT/${lang}`);
      }
      try {
        mkdirSync(dirname(versionedOut), { recursive: true });
        writeFileSync(versionedOut, html);
        mkdirSync(dirname(latestOut), { recursive: true });
        writeFileSync(latestOut, html);
      } catch (e) {
        die(`writing output: ${e.message}`);
      }
      pages.push({ htmlRel: htmlRelFor(srcPath, lang), title: parsed.fm.title });
      count++;
    }
    // Emit the per-locale table-of-contents index (versioned + latest).
    if (pages.length) {
      for (const seg of [corpusVersion, "latest"]) {
        const idxOut = join(OUT_ROOT, seg, lang, "index.html");
        try {
          mkdirSync(dirname(idxOut), { recursive: true });
          writeFileSync(idxOut, buildIndexHtml(lang, seg, corpusVersion, pages));
        } catch (e) {
          die(`writing index: ${e.message}`);
        }
      }
    }
  }
  stdout.write(`build-methodology: built ${count} pages + ${LOCALES.length} indexes → ${OUT_ROOT}/{${corpusVersion},latest}/<lang>/\n`);
}

main();
