#!/usr/bin/env node
// tools/lint-glossary.mjs — Story 4.4.
//
// Walks `src/content/methodology/**/*.md`, parses YAML frontmatter, validates
// `glossaryRefs:` structure (defense-in-depth with lint-frontmatter), and,
// when the per-language glossary tree exists at
// `src/content/methodology/<lang>/reference/glossary/`, asserts every
// `glossaryRefs:` entry has a matching `<entry>.md` or `<entry>/index.md`
// file. When the tree is absent (current Epic-4 state), emits a single
// deferred WARN per page and exits 0.
//
// Stdlib-only (NFR33). ESM.
//
// Optional flag:
//   --paths=<dir>   override the methodology root (default: src/content/methodology)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { argv, cwd, stdout, stderr, exit } from "node:process";

const CWD = cwd();

// ─── arg parsing ─────────────────────────────────────────────────────────
const args = argv.slice(2);
let pathsArg = null;
for (const a of args) {
  if (a.startsWith("--paths=")) pathsArg = a.slice("--paths=".length);
}
const ROOT = resolve(CWD, pathsArg ?? "src/content/methodology");

// ─── frontmatter mini-parser (adapted from tools/lint-frontmatter.mjs) ───
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error("missing frontmatter delimiter (first line must be '---')");
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { endIdx = i; break; }
  }
  if (endIdx === -1) throw new Error("missing closing frontmatter delimiter '---'");
  const fm = {};
  let i = 1;
  while (i < endIdx) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) throw new Error(`cannot parse frontmatter line ${i + 1}: ${JSON.stringify(line)}`);
    const key = m[1];
    const rest = m[2];
    if (rest === "") {
      const items = [];
      i++;
      while (i < endIdx) {
        const lst = lines[i].match(/^\s+-\s+(.*)$/);
        if (!lst) break;
        items.push(parseScalar(lst[1].trim()));
        i++;
      }
      fm[key] = items;
      continue;
    }
    if (rest.startsWith("[")) {
      const trimmed = rest.trim();
      if (!trimmed.endsWith("]")) {
        throw new Error(`inline array on line ${i + 1} not closed: ${JSON.stringify(rest)}`);
      }
      const inner = trimmed.slice(1, -1).trim();
      if (inner === "") fm[key] = [];
      else fm[key] = inner.split(",").map((x) => parseScalar(x.trim()));
      i++;
      continue;
    }
    fm[key] = parseScalar(rest);
    i++;
  }
  return fm;
}

function parseScalar(raw) {
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith('"')) {
    if (!v.endsWith('"') || v.length < 2) throw new Error(`unterminated quoted string: ${raw}`);
    return v.slice(1, -1);
  }
  if (v.startsWith("'")) {
    if (!v.endsWith("'") || v.length < 2) throw new Error(`unterminated quoted string: ${raw}`);
    return v.slice(1, -1);
  }
  return v;
}

// ─── walk methodology pages, deterministic order ─────────────────────────
// Excludes the per-locale `reference/glossary/` subtree — those are glossary
// entries, not methodology pages, and have their own (Epic-5) schema.
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
      // Skip the glossary subtree (entries inside have their own schema).
      const rel = relative(ROOT, p).split(/[\\/]/);
      if (rel.length >= 3 && rel[1] === "reference" && rel[2] === "glossary") continue;
      yield* walkMd(p);
    }
    else if (e.isFile() && e.name.endsWith(".md")) yield p;
  }
}

// Detect the locale segment from a path like
// .../src/content/methodology/<lang>/...
function detectLang(fullPath) {
  const rel = relative(ROOT, fullPath);
  const parts = rel.split(/[\\/]/);
  return parts[0] ?? null;
}

function glossaryTreeExistsFor(lang) {
  if (!lang) return false;
  return existsSync(join(ROOT, lang, "reference", "glossary"));
}

function glossaryEntryExists(lang, entry) {
  const base = join(ROOT, lang, "reference", "glossary");
  if (existsSync(join(base, `${entry}.md`))) return true;
  if (existsSync(join(base, entry, "index.md"))) return true;
  return false;
}

function emitErr(path, reason) {
  stderr.write(`lint-glossary: ${path}: ${reason}\n`);
}
function emitWarn(path, lang) {
  stderr.write(
    `lint-glossary: WARN ${path} — glossary tree at src/content/methodology/${lang}/reference/glossary/ not yet authored (deferred to Epic 5)\n`,
  );
}

function main() {
  let pages = 0;
  let deferred = 0;
  let failures = 0;

  for (const fullPath of walkMd(ROOT)) {
    const rel = relative(CWD, fullPath);
    pages++;
    let text;
    try {
      text = readFileSync(fullPath, "utf8");
    } catch (e) {
      emitErr(rel, `<file> read error: ${e.message}`);
      failures++;
      continue;
    }
    let fm;
    try {
      fm = parseFrontmatter(text);
    } catch (e) {
      emitErr(rel, `<frontmatter> ${e.message}`);
      failures++;
      continue;
    }

    // Phase 1: structural validation of glossaryRefs.
    if (!("glossaryRefs" in fm)) {
      emitErr(rel, "glossaryRefs missing required key");
      failures++;
      continue;
    }
    const refs = fm.glossaryRefs;
    if (!Array.isArray(refs)) {
      emitErr(rel, "glossaryRefs must be an array");
      failures++;
      continue;
    }
    let structOk = true;
    for (let i = 0; i < refs.length; i++) {
      if (typeof refs[i] !== "string" || refs[i].length < 1) {
        emitErr(rel, `glossaryRefs item ${i} must be a non-empty string`);
        failures++;
        structOk = false;
        break;
      }
    }
    if (!structOk) continue;

    // Phase 2: glossary tree presence per locale.
    const lang = detectLang(fullPath);
    if (!glossaryTreeExistsFor(lang)) {
      emitWarn(rel, lang ?? "<unknown>");
      deferred++;
      continue;
    }

    // Phase 2 (tree present): each entry must resolve to a file.
    for (const entry of refs) {
      if (!glossaryEntryExists(lang, entry)) {
        emitErr(
          rel,
          `glossaryRef "${entry}" — glossary entry not found at src/content/methodology/${lang}/reference/glossary/${entry}.md`,
        );
        failures++;
      }
    }
  }

  if (failures > 0) {
    stderr.write(`lint-glossary: ${failures} violation(s) across ${pages} page(s)\n`);
    exit(1);
  }
  stdout.write(
    `lint-glossary: ${pages} page(s) validated; ${deferred} page(s) deferred (glossary tree absent)\n`,
  );
  exit(0);
}

main();
