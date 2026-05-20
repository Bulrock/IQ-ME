#!/usr/bin/env node
// tools/lint-translation-parity.mjs — Story 4.7 AC-2 no-op stub.
//
// At Epic 4 close, src/content/methodology/ contains EN content only; RU + PL
// dirs are .gitkeep-only. Phase 1 (always): if no non-EN content exists →
// emit one WARN line and exit 0. Phase 2 (defensive, in case Epic 7
// partial-content lands during Epic 4): for any non-EN page, validate that
// frontmatter `sourceHashEN` is a 64-char lowercase-hex string. Deeper
// EN-hash diff comparison defers to Epic 7 (Story 7.5b).
//
// The lint contract is stable — same script runs at Epic 7 with full-coverage
// logic flipped on; this story plants the affordance.
//
// Stdlib-only (NFR33). Pure ESM (.mjs).
//
// Env contract:
//   IQME_METHODOLOGY_ROOT  override the methodology content root (default:
//                          src/content/methodology). Used by unit tests.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { argv, env, cwd, exit, stderr, stdout } from "node:process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const ROOT = resolve(REPO_ROOT, env.IQME_METHODOLOGY_ROOT || "src/content/methodology");

const LOCALES = ["en", "ru", "pl"];
const NON_EN = ["ru", "pl"];
const HEX64_RE = /^[0-9a-f]{64}$/;

function die(msg) {
  stderr.write(`lint-translation-parity: ERROR ${msg}\n`);
  exit(1);
}

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
    if (e.isDirectory()) yield* walkMd(p);
    else if (e.isFile() && e.name.endsWith(".md")) yield p;
  }
}

// Minimal frontmatter parser — extracts top-level scalar values (quoted or
// bareword). Sufficient for sourceHashEN; we don't need block lists here.
function extractFrontmatterValue(text, key) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return undefined;
  const keyRe = new RegExp(`^${key}\\s*:\\s*(.*)$`);
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(keyRe);
    if (m) {
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return undefined;
}

function countMdPages(localeDir) {
  let n = 0;
  for (const _ of walkMd(localeDir)) n++;
  return n;
}

function main() {
  const violations = [];
  const nonEnPages = [];

  for (const locale of NON_EN) {
    const localeDir = join(ROOT, locale);
    if (!existsSync(localeDir)) continue;
    for (const srcPath of walkMd(localeDir)) {
      nonEnPages.push({ locale, srcPath });
    }
  }

  if (nonEnPages.length === 0) {
    stdout.write(
      "lint-translation-parity: WARN no non-EN content yet (Epic 7 wires full coverage); skipped\n",
    );
  } else {
    // Phase 2 defensive validation: sourceHashEN is present and 64-hex.
    for (const { locale, srcPath } of nonEnPages) {
      let text;
      try {
        text = readFileSync(srcPath, "utf8");
      } catch (e) {
        die(`reading ${srcPath}: ${e.message}`);
      }
      const v = extractFrontmatterValue(text, "sourceHashEN");
      const rel = relative(REPO_ROOT, srcPath);
      if (v === undefined) {
        violations.push(`${rel}: missing frontmatter key 'sourceHashEN'`);
        continue;
      }
      if (!HEX64_RE.test(v)) {
        violations.push(
          `${rel}: malformed sourceHashEN — must be 64-char lowercase hex (got length ${v.length})`,
        );
      }
    }
  }

  // Per-locale summary (always emitted).
  const enDir = join(ROOT, "en");
  const enCount = existsSync(enDir) ? countMdPages(enDir) : 0;
  stdout.write(`lint-translation-parity: EN: source-of-truth (${enCount} page(s))\n`);
  for (const locale of NON_EN) {
    const localeDir = join(ROOT, locale);
    const count = existsSync(localeDir) ? countMdPages(localeDir) : 0;
    if (count === 0) {
      stdout.write(
        `lint-translation-parity: ${locale.toUpperCase()}: not yet authored (Epic 7)\n`,
      );
    } else {
      stdout.write(
        `lint-translation-parity: ${locale.toUpperCase()}: ${count} page(s) found (deep parity check deferred to Epic 7)\n`,
      );
    }
  }

  if (violations.length > 0) {
    for (const v of violations) stderr.write(`BREACH lint-translation-parity: ${v}\n`);
    exit(1);
  }
  exit(0);
}

main();
