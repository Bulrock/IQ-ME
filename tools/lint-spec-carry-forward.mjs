#!/usr/bin/env node
// tools/lint-spec-carry-forward.mjs — bridge-6-7-3 Phase A.
//
// Walks story-spec markdown files and validates each one carries a
// non-empty `### Carry-forward lessons` section. Per lesson-2026-05-20-007,
// the section is the load-bearing delivery mechanism for prior-story lessons;
// authors forgot to include it in 5-2..5-7, which directly caused the
// integrity-record ceremony to be skipped (lesson-2026-05-19-001 fired 3×).
//
// Acceptance:
//   - section heading present (case-sensitive `### Carry-forward lessons`).
//   - section is non-empty (at least one non-blank line OR an explicit
//     "no relevant lessons" sentinel — never silent omission).
//
// Exit 0 with a single summary line on full pass.
// Exit 1 with one `lint-spec-carry-forward: <path>: <reason>` line per
// violation.
//
// Per-spec exemption (bridge-7-8-3): a spec opts out of the check by setting
//   lint-exempt-carry-forward: true
// in its YAML frontmatter. This replaces the former central allow-list
// (removed in bridge-7-8-3) — exemption is now distributed per-file, no central-edit
// gate. Every exempt entry is still technical debt; trim flags as specs are
// remediated.
//
// Optional flags:
//   --paths=<dir>  override the stories root
//                  (default: _bmad-output/implementation-artifacts/stories)
//   --ignore-old   retained no-op (accepted for Makefile/CI compatibility);
//                  exemption is now frontmatter-driven, so this flag no longer
//                  changes behavior.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { argv, cwd, stdout, stderr, exit } from "node:process";

const CWD = cwd();

const args = argv.slice(2);
let pathsArg = null;
for (const a of args) {
  if (a.startsWith("--paths=")) pathsArg = a.slice("--paths=".length);
  // `--ignore-old` is accepted but a no-op (exemption is now frontmatter-driven).
}
const ROOT = resolve(
  CWD,
  pathsArg ?? "_bmad-output/implementation-artifacts/stories",
);

// Per-spec exemption (bridge-7-8-3) — replaces the former central
// allow-list (now removed). A spec opts out of the Carry-forward-section check
// by setting `lint-exempt-carry-forward: true` in its YAML frontmatter. The
// flag must be exactly `true`; any other value (or its absence) does not
// exempt, so NEW specs lacking both the flag and the section still fail.
const EXEMPT_FRONTMATTER_RE = /^lint-exempt-carry-forward:[ \t]*true[ \t]*$/im;

function isCarryForwardExempt(body) {
  if (!body.startsWith("---")) return false;
  // Frontmatter is the block between the leading `---` and the next `---`.
  const close = body.indexOf("\n---", 3);
  if (close < 0) return false;
  return EXEMPT_FRONTMATTER_RE.test(body.slice(0, close));
}

const CARRY_FORWARD_HEADING_RE = /^### Carry-forward lessons\b/m;
// Heading-line index, plus next H2/H3 (any "## " or "### ") as section end.
function findSectionRange(lines) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^### Carry-forward lessons\b/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^(#{2,3}) /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function sectionHasContent(lines, range) {
  // Any non-blank line BETWEEN start+1 and end counts.
  for (let i = range.start + 1; i < range.end; i++) {
    if (lines[i].trim().length > 0) return true;
  }
  return false;
}

function listMarkdownFiles(rootDir) {
  let entries;
  try {
    entries = readdirSync(rootDir);
  } catch (err) {
    return [];
  }
  const out = [];
  for (const name of entries) {
    const full = join(rootDir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isFile() && name.endsWith(".md")) out.push(full);
  }
  return out;
}

const files = listMarkdownFiles(ROOT);
const violations = [];
let exempted = 0;
let checked = 0;

for (const path of files) {
  const body = readFileSync(path, "utf8");
  if (isCarryForwardExempt(body)) {
    // Per-spec frontmatter opt-out (`lint-exempt-carry-forward: true`).
    exempted++;
    continue;
  }
  checked++;
  const lines = body.split("\n");
  const range = findSectionRange(lines);
  if (range === null) {
    violations.push(
      `${relative(CWD, path)}: missing '### Carry-forward lessons' heading (per lesson-2026-05-20-007 every new story spec must carry the section)`,
    );
    continue;
  }
  if (!sectionHasContent(lines, range)) {
    violations.push(
      `${relative(CWD, path)}: '### Carry-forward lessons' section is empty — populate from 'tds memory query --story=<id>' or insert explicit zero-hits sentinel`,
    );
  }
}

if (violations.length === 0) {
  stdout.write(
    `lint-spec-carry-forward: ${checked} spec(s) OK, ${exempted} frontmatter-exempt.\n`,
  );
  exit(0);
}

for (const v of violations) {
  stderr.write(`lint-spec-carry-forward: ${v}\n`);
}
exit(1);
