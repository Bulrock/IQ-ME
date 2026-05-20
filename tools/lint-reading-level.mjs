#!/usr/bin/env node
// tools/lint-reading-level.mjs — Story 4.4.
//
// Computes Flesch-Kincaid grade for every EN methodology page body (frontmatter
// + markdown constructs stripped) and fails if any page exceeds grade 12
// (NFR28). RU/PL paths skipped with a single per-locale WARN; Epic 7 will
// wire Oborneva (RU) and Pisarek/Jasnopis (PL) calibrations.
//
// Stdlib-only (NFR33). ESM.
//
// FK formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) − 15.59
//
// Markdown stripping (in order):
//   1. strip frontmatter between leading `^---$` delimiters
//   2. strip fenced code blocks ``` ... ```
//   3. strip ATX headings (lines beginning with `#`)
//   4. strip blockquote / list markers (`>`, `-`, `*`, `+`, ordered)
//   5. strip inline backticks
//   6. unwrap link syntax: [text](url) → text
//   7. unwrap emphasis: **bold** / *em* / __bold__ / _em_ → inner text
//   8. drop raw HTML tags (defensive — corpus is plain-text but be safe)
//
// Syllable heuristic: count vowel groups per word; subtract trailing silent
// `e`; minimum 1. Acceptable for CI gating.
//
// Optional flags:
//   --paths=<dir>     override the methodology root (default: src/content/methodology)
//   --include-i18n    ALSO walk src/content/i18n/<lang>/*.json, extract every
//                     string value (recursively, nested objects supported),
//                     concatenate per file, and grade against NFR28 threshold.
//                     EN-only enforcement; RU/PL → per-locale deferred WARN
//                     (matches Story 4-4 AC-3 locale gating). Story 4-8 AC-2.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { argv, cwd, stdout, stderr, exit } from "node:process";

const CWD = cwd();
const THRESHOLD = 12;

// ─── arg parsing ─────────────────────────────────────────────────────────
const args = argv.slice(2);
let pathsArg = null;
let includeI18n = false;
for (const a of args) {
  if (a.startsWith("--paths=")) pathsArg = a.slice("--paths=".length);
  else if (a === "--include-i18n") includeI18n = true;
}
const ROOT = resolve(CWD, pathsArg ?? "src/content/methodology");
// i18n root is derived from the methodology root's parent (../i18n) so that
// --paths= overrides cooperate naturally in test fixtures.
const I18N_ROOT = resolve(ROOT, "..", "i18n");

// ─── markdown stripping ──────────────────────────────────────────────────
function stripFrontmatter(text) {
  if (!text.startsWith("---")) return text;
  // Find the closing --- on its own line after line 0.
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return text;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return text;
  return lines.slice(end + 1).join("\n");
}

function stripMarkdown(body) {
  // 1. Remove fenced code blocks.
  body = body.replace(/```[\s\S]*?```/g, "");
  body = body.replace(/~~~[\s\S]*?~~~/g, "");
  // 2. Split into lines for line-oriented stripping.
  const out = [];
  for (const raw of body.split(/\r?\n/)) {
    let l = raw;
    // Strip ATX heading lines entirely (they are titles, not prose
    // sentences — they have no terminal punctuation and would otherwise
    // muddle sentence boundaries).
    if (/^\s*#{1,6}\s+/.test(l)) continue;
    // Strip leading blockquote markers.
    l = l.replace(/^\s*>\s?/, "");
    // Strip leading list markers.
    l = l.replace(/^\s*[-*+]\s+/, "");
    l = l.replace(/^\s*\d+\.\s+/, "");
    out.push(l);
  }
  let text = out.join("\n");
  // 3. Inline backticks: drop the backtick-wrapped content. Drop the whole
  // span so polysyllabic identifiers (`fooBarBaz`) do not skew the count.
  text = text.replace(/`[^`\n]*`/g, "");
  // 4. Links: [text](url) → text  (also reference-style [text][ref] → text).
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");
  // 5. Images: ![alt](url) → drop entirely (alt is metadata, not prose).
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  // 6. Emphasis: **x** / __x__ / *x* / _x_ → x.
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:!?]|$)/g, "$1$2");
  // 7. Strip raw HTML tags.
  text = text.replace(/<[^>]+>/g, "");
  return text;
}

// ─── FK calc ─────────────────────────────────────────────────────────────
function countSentences(text) {
  // Sentence boundary: `[.!?]` followed by whitespace OR EOL.
  // Collapse to a count by splitting on terminal punctuation and counting
  // non-empty pieces.
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  const pieces = trimmed.split(/[.!?]+(?=\s|$)/).map((s) => s.trim()).filter(Boolean);
  return pieces.length;
}

function tokenizeWords(text) {
  // Apostrophe-aware: "don't" is one word.
  const tokens = text.match(/[A-Za-z][A-Za-z'']*/g);
  return tokens ?? [];
}

function countSyllablesInWord(w) {
  if (!w) return 0;
  const lower = w.toLowerCase().replace(/['']/g, "");
  if (lower.length === 0) return 0;
  // Count vowel groups.
  const groups = lower.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 0;
  // Trailing silent 'e'.
  if (lower.length > 2 && lower.endsWith("e") && !lower.endsWith("le")) {
    // Subtract one only if removing the e still leaves a vowel group.
    const trimmedGroups = lower.slice(0, -1).match(/[aeiouy]+/g);
    if (trimmedGroups && trimmedGroups.length >= 1) n -= 1;
  }
  // Specifically, words like "the" → 1 (groups=1, no silent-e adjust given
  // the .length>2 guard above keeps it). Words like "make" → 1 (groups=2
  // 'a','e'; silent-e trims to 1).
  return Math.max(1, n);
}

function fleschKincaidGrade({ words, sentences, syllables }) {
  if (sentences === 0 || words === 0) return null;
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

// ─── walk pages ──────────────────────────────────────────────────────────
function* walkMd(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return;
    throw e;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      // Skip the per-locale glossary subtree (Epic-5 entries are not prose).
      const rel = relative(ROOT, p).split(/[\\/]/);
      if (rel.length >= 3 && rel[1] === "reference" && rel[2] === "glossary") continue;
      yield* walkMd(p);
    }
    else if (e.isFile() && e.name.endsWith(".md")) yield p;
  }
}

function detectLang(fullPath) {
  const rel = relative(ROOT, fullPath);
  const parts = rel.split(/[\\/]/);
  return parts[0] ?? null;
}

// ─── i18n walker (Story 4-8 --include-i18n) ─────────────────────────────
function* walkI18nJson(root) {
  let langs;
  try {
    langs = readdirSync(root, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return;
    throw e;
  }
  langs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const langEntry of langs) {
    if (langEntry.name.startsWith(".") || !langEntry.isDirectory()) continue;
    const langDir = join(root, langEntry.name);
    let files;
    try {
      files = readdirSync(langDir, { withFileTypes: true });
    } catch { continue; }
    files.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const f of files) {
      if (f.isFile() && f.name.endsWith(".json")) {
        yield { lang: langEntry.name, path: join(langDir, f.name) };
      }
    }
  }
}

function extractStringsRecursive(value, out) {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) extractStringsRecursive(v, out);
  } else if (value && typeof value === "object") {
    for (const k of Object.keys(value)) extractStringsRecursive(value[k], out);
  }
}

function main() {
  let failures = 0;
  let enPages = 0;
  const deferredLocales = new Set();

  // Two passes: locale-deferred WARNs (one per locale present), and
  // FK grading for EN pages.
  const allPages = [...walkMd(ROOT)];
  for (const fullPath of allPages) {
    const lang = detectLang(fullPath);
    if (lang !== "en") {
      if (lang) deferredLocales.add(lang);
      continue;
    }
  }
  for (const lang of [...deferredLocales].sort()) {
    stderr.write(
      `lint-reading-level: WARN ${lang} reading-level calibration not yet wired (Epic 7)\n`,
    );
  }

  for (const fullPath of allPages) {
    const lang = detectLang(fullPath);
    if (lang !== "en") continue;
    enPages++;
    const rel = relative(CWD, fullPath);
    let text;
    try {
      text = readFileSync(fullPath, "utf8");
    } catch (e) {
      stderr.write(`lint-reading-level: ${rel}: read error: ${e.message}\n`);
      failures++;
      continue;
    }
    const body = stripMarkdown(stripFrontmatter(text));
    const sentences = countSentences(body);
    const words = tokenizeWords(body);
    if (sentences === 0 || words.length === 0) {
      stderr.write(`lint-reading-level: WARN ${rel} — empty body (no readable prose)\n`);
      continue;
    }
    let syllables = 0;
    for (const w of words) syllables += countSyllablesInWord(w);
    const grade = fleschKincaidGrade({
      words: words.length,
      sentences,
      syllables,
    });
    if (grade === null) {
      stderr.write(`lint-reading-level: WARN ${rel} — empty body (no readable prose)\n`);
      continue;
    }
    const rounded = grade.toFixed(1);
    stdout.write(`lint-reading-level: ${rel}: grade=${rounded}\n`);
    if (grade > THRESHOLD) {
      stderr.write(
        `lint-reading-level: ${rel}: grade ${rounded} exceeds threshold ${THRESHOLD.toFixed(1)} (NFR28)\n`,
      );
      failures++;
    }
  }

  // ─── --include-i18n pass (Story 4-8 AC-2) ──────────────────────────
  let i18nFiles = 0;
  if (includeI18n && existsSync(I18N_ROOT)) {
    const i18nDeferred = new Set();
    for (const { lang, path: fullPath } of walkI18nJson(I18N_ROOT)) {
      if (lang !== "en") {
        i18nDeferred.add(lang);
        continue;
      }
    }
    for (const lang of [...i18nDeferred].sort()) {
      stderr.write(
        `lint-reading-level: WARN ${lang} reading-level calibration not yet wired (Epic 7)\n`,
      );
    }
    for (const { lang, path: fullPath } of walkI18nJson(I18N_ROOT)) {
      if (lang !== "en") continue;
      i18nFiles++;
      const rel = relative(CWD, fullPath);
      let parsed;
      try {
        parsed = JSON.parse(readFileSync(fullPath, "utf8"));
      } catch (e) {
        stderr.write(`lint-reading-level: ${rel}: JSON parse error: ${e.message}\n`);
        failures++;
        continue;
      }
      const strings = [];
      extractStringsRecursive(parsed, strings);
      // Treat each string as a separate sentence (append period if absent —
      // many UI strings omit terminal punctuation).
      const body = strings
        .map((s) => (s.trim().match(/[.!?]$/) ? s.trim() : `${s.trim()}.`))
        .join(" ");
      const sentences = countSentences(body);
      const words = tokenizeWords(body);
      if (sentences === 0 || words.length === 0) {
        stderr.write(`lint-reading-level: WARN ${rel} — no readable prose\n`);
        continue;
      }
      let syllables = 0;
      for (const w of words) syllables += countSyllablesInWord(w);
      const grade = fleschKincaidGrade({
        words: words.length,
        sentences,
        syllables,
      });
      if (grade === null) {
        stderr.write(`lint-reading-level: WARN ${rel} — no readable prose\n`);
        continue;
      }
      const rounded = grade.toFixed(1);
      stdout.write(`lint-reading-level: ${rel}: grade=${rounded}\n`);
      if (grade > THRESHOLD) {
        stderr.write(
          `lint-reading-level: ${rel}: grade ${rounded} exceeds threshold ${THRESHOLD.toFixed(1)} (NFR28)\n`,
        );
        failures++;
      }
    }
  }

  if (failures > 0) {
    stderr.write(
      `lint-reading-level: ${failures} surface(s) exceeded grade ${THRESHOLD} across ${enPages} EN page(s)` +
        (includeI18n ? ` + ${i18nFiles} EN i18n file(s)` : "") +
        "\n",
    );
    exit(1);
  }
  stdout.write(
    `lint-reading-level: ${enPages} EN page(s) within grade ${THRESHOLD}` +
      (includeI18n ? ` (+ ${i18nFiles} EN i18n file(s))` : "") +
      "\n",
  );
  exit(0);
}

main();
