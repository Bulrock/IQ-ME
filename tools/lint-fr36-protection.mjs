#!/usr/bin/env node
// tools/lint-fr36-protection.mjs — Story 5.2 AC-2.
//
// Asserts that the FR36-protected page at
//   src/content/methodology/en/limitations/what-this-does-not-measure/index.md
// exists, declares `protected: true` in its frontmatter, and has a body of at
// least MIN_CHARS characters (post-frontmatter, leading whitespace stripped).
//
// Exit 0 with a one-line summary on pass. Exit 1 with a per-violation
// diagnostic on fail.
//
// Stdlib-only (NFR33).

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { cwd, stderr, stdout, exit } from "node:process";

const CWD = cwd();
const PROTECTED_REL = "src/content/methodology/en/limitations/what-this-does-not-measure/index.md";
const MIN_CHARS = 2000;

function fail(msg) {
  stderr.write(`lint-fr36-protection: ${msg}\n`);
  exit(1);
}

function ok(msg) {
  stdout.write(`lint-fr36-protection: ${msg}\n`);
  exit(0);
}

const full = resolve(CWD, PROTECTED_REL);
if (!existsSync(full)) {
  fail(`missing FR36-protected page at ${PROTECTED_REL}`);
}

const text = readFileSync(full, "utf8");
const lines = text.split(/\r?\n/);
if (lines[0] !== "---") {
  fail(`${PROTECTED_REL}: missing frontmatter`);
}
let end = -1;
for (let i = 1; i < lines.length; i++) {
  if (lines[i] === "---") { end = i; break; }
}
if (end === -1) fail(`${PROTECTED_REL}: unterminated frontmatter`);

const fm = {};
for (let i = 1; i < end; i++) {
  const m = lines[i].match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
  if (m) fm[m[1]] = m[2].trim();
}

if (fm.protected !== "true") {
  fail(`${PROTECTED_REL}: frontmatter must declare protected: true (got ${JSON.stringify(fm.protected ?? "absent")})`);
}

const body = lines.slice(end + 1).join("\n").trim();
if (body.length < MIN_CHARS) {
  fail(`${PROTECTED_REL}: body length ${body.length} characters < MIN_CHARS=${MIN_CHARS} (FR36 protects against silent shortening)`);
}

ok(`ok — ${PROTECTED_REL} protected:true, body ${body.length} chars (≥ ${MIN_CHARS})`);
