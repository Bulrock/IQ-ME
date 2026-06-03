#!/usr/bin/env node
// tools/scaffold-translation-mirror.mjs — Story 7.3 (RU) / 7.4 (PL).
//
// Mirrors the EN methodology corpus (src/content/methodology/en/**/*.md) into a
// target non-EN locale as a PARITY-AWARE EN-PLACEHOLDER scaffold. Per the
// Epic-7 dev-phase decision (infra-now, content-gated-on-9c/9d): the real
// clinical-register human translation is authored later by the Gate-9c/9d
// reviewer-of-record. This script does NOT translate — it lays down the full
// file-tree + frontmatter parity so the build-time measurement-equivalence
// invariant (Innovation #7) holds, while the placeholder nature is machine-
// observable via `translationStatus: "in-progress"`.
//
// For each EN page it writes a counterpart at the identical relative path under
// the target locale, with frontmatter:
//   - reviewer: "TBD"
//   - reviewerHandle: "@TBD-<lang>-reviewer"
//   - lastReviewed: <scaffold date>  (override; default today, --date= to pin)
//   - sourceHashEN: SHA256(EN body)  (the exact build-methodology.mjs contract)
//   - translationStatus: "in-progress"
//   - all other EN frontmatter keys preserved verbatim (title, version,
//     asserts, glossaryRefs, slug, ...)
// and the EN body verbatim as placeholder content.
//
// Idempotent: re-running against an unchanged EN tree produces byte-identical
// output. Removes the locale's `.gitkeep` once real pages exist.
//
// Stdlib-only (NFR33). Pure ESM (.mjs).
//
// Usage:
//   node tools/scaffold-translation-mirror.mjs --langs=ru
//   node tools/scaffold-translation-mirror.mjs --langs=ru,pl --date=2026-06-03
//
// Env: IQME_METHODOLOGY_ROOT overrides the methodology root (tests).

import { createHash } from "node:crypto";
import {
  readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync,
} from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { argv, env, exit, stdout, stderr } from "node:process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const ROOT = resolve(REPO_ROOT, env.IQME_METHODOLOGY_ROOT || "src/content/methodology");

function parseArgs() {
  let langs = ["ru"];
  let date = new Date().toISOString().slice(0, 10);
  for (const a of argv.slice(2)) {
    if (a.startsWith("--langs=")) langs = a.slice(8).split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("--date=")) date = a.slice(7).trim();
  }
  return { langs, date };
}

function* walkMd(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch (e) { if (e.code === "ENOENT") return; throw e; }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkMd(p);
    else if (e.isFile() && e.name.endsWith(".md")) yield p;
  }
}

// Split a page into [frontmatterLines, body]. Mirrors build-methodology.mjs:
// body = everything after the closing `---`, split on /\r?\n/, joined with \n.
function splitPage(text, srcPath) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") throw new Error(`${srcPath}: missing frontmatter delimiter`);
  let end = -1;
  for (let i = 1; i < lines.length; i++) { if (lines[i] === "---") { end = i; break; } }
  if (end === -1) throw new Error(`${srcPath}: unterminated frontmatter`);
  const fm = lines.slice(1, end);
  const body = lines.slice(end + 1).join("\n");
  return { fm, body };
}

function bodyHash(body) {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

// Rebuild frontmatter for the target locale: override scalar keys by line
// surgery (preserves block-list keys like asserts/glossaryRefs), then ensure
// translationStatus is present.
function localizeFrontmatter(fm, { lang, date, hash }) {
  const out = [];
  let hasTranslationStatus = false;
  let sawSourceHash = false;
  for (const line of fm) {
    if (/^reviewer:/.test(line)) { out.push(`reviewer: "TBD"`); continue; }
    if (/^reviewerHandle:/.test(line)) { out.push(`reviewerHandle: "@TBD-${lang}-reviewer"`); continue; }
    if (/^lastReviewed:/.test(line)) { out.push(`lastReviewed: "${date}"`); continue; }
    if (/^sourceHashEN:/.test(line)) {
      out.push(`sourceHashEN: "${hash}"`);
      out.push(`translationStatus: "in-progress"`);
      hasTranslationStatus = true;
      sawSourceHash = true;
      continue;
    }
    if (/^translationStatus:/.test(line)) { out.push(`translationStatus: "in-progress"`); hasTranslationStatus = true; continue; }
    out.push(line);
  }
  if (!sawSourceHash) out.push(`sourceHashEN: "${hash}"`);
  if (!hasTranslationStatus) out.push(`translationStatus: "in-progress"`);
  return out;
}

function main() {
  const { langs, date } = parseArgs();
  const enDir = join(ROOT, "en");
  if (!existsSync(enDir)) { stderr.write(`scaffold-translation-mirror: no EN root at ${enDir}\n`); exit(1); }

  let written = 0;
  for (const lang of langs) {
    const langDir = join(ROOT, lang);
    let count = 0;
    for (const enPath of walkMd(enDir)) {
      const rel = relative(enDir, enPath);
      const text = readFileSync(enPath, "utf8");
      const { fm, body } = splitPage(text, enPath);
      const hash = bodyHash(body);
      const localizedFm = localizeFrontmatter(fm, { lang, date, hash });
      const out = `---\n${localizedFm.join("\n")}\n---\n${body}`;
      const destPath = join(langDir, rel);
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, out);
      count++;
      written++;
    }
    // Remove the placeholder .gitkeep now that real pages exist.
    const gitkeep = join(langDir, ".gitkeep");
    if (existsSync(gitkeep)) rmSync(gitkeep);
    stdout.write(`scaffold-translation-mirror: ${lang.toUpperCase()}: scaffolded ${count} page(s)\n`);
  }
  stdout.write(`scaffold-translation-mirror: ${written} page(s) total\n`);
  exit(0);
}

main();
