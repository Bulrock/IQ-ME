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

// ─── Story 7.5a: per-language calibration ──────────────────────────────────
// RU — Oborneva (2006) adaptation of Flesch-Kincaid for Russian:
//   grade = 0.5·(words/sentences) + 8.4·(syllables/words) − 15.59
// Russian syllable count = number of vowels (each vowel ≈ one syllable, which
// is accurate for Russian, more so than the EN vowel-group heuristic).
const RU_VOWEL_RE = /[аеёиоуыэюя]/gi;
const RU_WORD_RE = /[А-Яа-яЁё][А-Яа-яЁё'’-]*/g;
function tokenizeRu(text) { return text.match(RU_WORD_RE) ?? []; }
function countRuSyllables(w) {
  const m = w.match(RU_VOWEL_RE);
  return Math.max(1, m ? m.length : 0);
}
function obornevaGrade({ words, sentences, syllables }) {
  if (sentences === 0 || words === 0) return null;
  return 0.5 * (words / sentences) + 8.4 * (syllables / words) - 15.59;
}

// PL — Pisarek/Jasnopis-equivalent grade. We use a Gunning-FOG-style index
// (the Jasnopis family weighs avg sentence length + the share of long words),
// pure-JS, deterministic:
//   grade = 0.4·( words/sentences + 100·(hardWords/words) )
// where a "hard" word has ≥4 Polish syllables. Polish syllable count = vowels
// (incl. ą ę ó), each vowel ≈ one syllable.
const PL_VOWEL_RE = /[aeiouyąęó]/gi;
const PL_WORD_RE = /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż'’-]*/g;
function tokenizePl(text) { return text.match(PL_WORD_RE) ?? []; }
function countPlSyllables(w) {
  const m = w.match(PL_VOWEL_RE);
  return Math.max(1, m ? m.length : 0);
}
function pisarekGrade({ words, sentences, tokens }) {
  if (sentences === 0 || words === 0) return null;
  let hard = 0;
  for (const t of tokens) if (countPlSyllables(t) >= 4) hard++;
  return 0.4 * (words / sentences + 100 * (hard / words));
}

// Per-locale reading-level config. EN keeps the FK ≤12 contract (Story 4.4).
const RL_THRESHOLD = THRESHOLD; // 12 — EN FK convention, reused per-locale (NFR28).
const LOCALE_RL = {
  en: { tokenize: tokenizeWords, syll: countSyllablesInWord, grade: fleschKincaidGrade, cap: RL_THRESHOLD, usesTokens: false },
  ru: { tokenize: tokenizeRu, syll: countRuSyllables, grade: obornevaGrade, cap: RL_THRESHOLD, usesTokens: false },
  pl: { tokenize: tokenizePl, syll: countPlSyllables, grade: pisarekGrade, cap: RL_THRESHOLD, usesTokens: true },
};
// NFR31 i18n sentence-length caps. EN keeps FK grading (Story 4.8); RU/PL use
// per-string character caps.
const I18N_CHAR_CAP = { ru: 180, pl: 160 };

// Extract the frontmatter `translationStatus` scalar (or undefined).
function frontmatterTranslationStatus(text) {
  if (!text.startsWith("---")) return undefined;
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  let end = -1;
  for (let i = 1; i < lines.length; i++) { if (lines[i] === "---") { end = i; break; } }
  if (end === -1) return undefined;
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(/^translationStatus\s*:\s*(.*)$/);
    if (m) {
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return v;
    }
  }
  return undefined;
}

// Extract string values EXCLUDING the top-level `_meta` object (never graded).
function extractStringsExcludingMeta(obj, out) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      if (k === "_meta") continue;
      extractStringsRecursive(obj[k], out);
    }
  } else {
    extractStringsRecursive(obj, out);
  }
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

function gradePage({ lang, body }) {
  const cfg = LOCALE_RL[lang];
  const sentences = countSentences(body);
  const tokens = cfg.tokenize(body);
  if (sentences === 0 || tokens.length === 0) return { empty: true };
  let syllables = 0;
  for (const w of tokens) syllables += cfg.syll(w);
  const grade = cfg.grade({ words: tokens.length, sentences, syllables, tokens });
  if (grade === null) return { empty: true };
  return { grade, cap: cfg.cap };
}

function main() {
  let failures = 0;
  let gradedPages = 0;
  const inProgressSkips = {}; // lang -> count (translationStatus: in-progress)

  const allPages = [...walkMd(ROOT)];
  for (const fullPath of allPages) {
    const lang = detectLang(fullPath);
    if (!lang || !LOCALE_RL[lang]) continue; // unknown locale dir — ignore
    const rel = relative(CWD, fullPath);
    let text;
    try {
      text = readFileSync(fullPath, "utf8");
    } catch (e) {
      stderr.write(`lint-reading-level: ${rel}: read error: ${e.message}\n`);
      failures++;
      continue;
    }
    // Story 7.5a — enforcement gated on translationStatus for non-EN pages.
    if (lang !== "en") {
      const ts = frontmatterTranslationStatus(text);
      if (ts === "in-progress") {
        inProgressSkips[lang] = (inProgressSkips[lang] ?? 0) + 1;
        continue;
      }
      // complete | unset → graded with the per-locale formula below.
    }
    const body = stripMarkdown(stripFrontmatter(text));
    const res = gradePage({ lang, body });
    if (res.empty) {
      stderr.write(`lint-reading-level: WARN ${rel} — empty body (no readable prose)\n`);
      continue;
    }
    gradedPages++;
    const rounded = res.grade.toFixed(1);
    stdout.write(`lint-reading-level: ${rel}: grade=${rounded} (${lang})\n`);
    if (res.grade > res.cap) {
      stderr.write(
        `lint-reading-level: ${rel}: ${lang.toUpperCase()} grade ${rounded} exceeds ${lang.toUpperCase()} cap ${res.cap.toFixed(1)} (NFR28)\n`,
      );
      failures++;
    }
  }
  // One per-locale WARN for in-progress (placeholder) pages skipped (Story 7.5a).
  for (const lang of Object.keys(inProgressSkips).sort()) {
    stderr.write(
      `lint-reading-level: WARN ${lang} reading-level: ${inProgressSkips[lang]} in-progress page(s) skipped — calibration active; enforcement awaits Gate-9c/9d completion\n`,
    );
  }

  // ─── --include-i18n pass (Story 4-8 AC-2 + Story 7.5a NFR31 caps) ──────────
  let i18nFiles = 0;
  if (includeI18n && existsSync(I18N_ROOT)) {
    const i18nInProgress = {}; // lang -> count
    for (const { lang, path: fullPath } of walkI18nJson(I18N_ROOT)) {
      const rel = relative(CWD, fullPath);
      let parsed;
      try {
        parsed = JSON.parse(readFileSync(fullPath, "utf8"));
      } catch (e) {
        stderr.write(`lint-reading-level: ${rel}: JSON parse error: ${e.message}\n`);
        failures++;
        continue;
      }
      if (lang === "en") {
        // EN — unchanged FK grading on concatenated string values (Story 4.8).
        i18nFiles++;
        const strings = [];
        extractStringsRecursive(parsed, strings);
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
        const grade = fleschKincaidGrade({ words: words.length, sentences, syllables });
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
        continue;
      }
      // Non-EN — Story 7.5a. Skip in-progress bundles; else per-string char cap.
      const ts = parsed && parsed._meta ? parsed._meta.translationStatus : undefined;
      if (ts === "in-progress") {
        i18nInProgress[lang] = (i18nInProgress[lang] ?? 0) + 1;
        continue;
      }
      const cap = I18N_CHAR_CAP[lang];
      if (cap === undefined) continue; // unknown non-EN locale — ignore
      i18nFiles++;
      const strings = [];
      extractStringsExcludingMeta(parsed, strings); // _meta never graded
      for (const s of strings) {
        if (typeof s === "string" && s.length > cap) {
          stderr.write(
            `lint-reading-level: ${rel}: ${lang.toUpperCase()} i18n string (${s.length} chars) exceeds ${lang.toUpperCase()} ${cap}-char cap (NFR31)\n`,
          );
          failures++;
        }
      }
    }
    for (const lang of Object.keys(i18nInProgress).sort()) {
      stderr.write(
        `lint-reading-level: WARN ${lang} reading-level: ${i18nInProgress[lang]} in-progress i18n bundle(s) skipped — enforcement awaits Gate-9c/9d completion\n`,
      );
    }
  }

  if (failures > 0) {
    stderr.write(
      `lint-reading-level: ${failures} surface(s) exceeded the per-locale cap across ${gradedPages} graded page(s)` +
        (includeI18n ? ` + ${i18nFiles} i18n file(s)` : "") +
        "\n",
    );
    exit(1);
  }
  stdout.write(
    `lint-reading-level: ${gradedPages} page(s) within per-locale reading-level limits` +
      (includeI18n ? ` (+ ${i18nFiles} i18n file(s))` : "") +
      "\n",
  );
  exit(0);
}

main();
