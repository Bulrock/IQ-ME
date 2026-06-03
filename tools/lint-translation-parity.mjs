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
import { createHash } from "node:crypto";
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

// Body = everything after the closing frontmatter `---` (matches
// build-methodology.mjs enSourceHashFor + the 7.3/7.4 mirror generator).
function pageBody(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return text;
  let end = -1;
  for (let i = 1; i < lines.length; i++) { if (lines[i] === "---") { end = i; break; } }
  if (end === -1) return text;
  return lines.slice(end + 1).join("\n");
}
function bodySha256(text) {
  return createHash("sha256").update(pageBody(text), "utf8").digest("hex");
}

// Map relative-path → absolute for every .md under a locale dir.
function localePageMap(localeDir) {
  const m = new Map();
  if (!existsSync(localeDir)) return m;
  for (const abs of walkMd(localeDir)) m.set(relative(localeDir, abs), abs);
  return m;
}

// Story 7.5b — full-coverage parity. Asserts tri-locale completeness (no
// missing / no orphan) + EN-source-hash match (no stale), per Innovation #7.
function main() {
  const violations = [];
  const enDir = join(ROOT, "en");
  const enMap = localePageMap(enDir);
  const enHash = new Map();
  for (const [rel, abs] of enMap) enHash.set(rel, bodySha256(readFileSync(abs, "utf8")));

  const summaries = [`EN: source-of-truth (${enMap.size} page(s))`];

  for (const locale of NON_EN) {
    const locDir = join(ROOT, locale);
    const locMap = localePageMap(locDir);
    const LU = locale.toUpperCase();
    let green = 0;

    // (b) orphan + sourceHashEN shape + (c) stale hash.
    for (const [rel, abs] of locMap) {
      const relRepo = relative(REPO_ROOT, abs);
      if (!enMap.has(rel)) {
        violations.push(`${relRepo}: orphan — no EN counterpart at en/${rel}`);
        continue;
      }
      const text = readFileSync(abs, "utf8");
      const v = extractFrontmatterValue(text, "sourceHashEN");
      if (v === undefined) {
        violations.push(`${relRepo}: missing frontmatter key 'sourceHashEN'`);
        continue;
      }
      if (!HEX64_RE.test(v)) {
        violations.push(`${relRepo}: malformed sourceHashEN — must be 64-char lowercase hex (got length ${v.length})`);
        continue;
      }
      if (v !== enHash.get(rel)) {
        violations.push(`${relRepo}: stale sourceHashEN — does not match current EN body hash for en/${rel} (drift: re-translate + bump sourceHashEN)`);
        continue;
      }
      green++;
    }

    // (a) missing — every EN page must have a counterpart in this locale.
    let missing = 0;
    for (const rel of enMap.keys()) {
      if (!locMap.has(rel)) {
        violations.push(`${locale}/${rel}: missing — EN page en/${rel} has no ${LU} counterpart`);
        missing++;
      }
    }
    summaries.push(
      `${LU}: ${green}/${enMap.size} pages parity-green` + (missing ? ` (${missing} missing)` : ""),
    );
  }

  for (const s of summaries) stdout.write(`lint-translation-parity: ${s}\n`);

  if (violations.length > 0) {
    for (const v of violations) stderr.write(`BREACH lint-translation-parity: ${v}\n`);
    stderr.write(`lint-translation-parity: ${violations.length} parity violation(s) — measurement-equivalence invariant broken (NFR27)\n`);
    exit(1);
  }
  exit(0);
}

main();
