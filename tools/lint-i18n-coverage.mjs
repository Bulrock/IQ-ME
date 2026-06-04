#!/usr/bin/env node
// tools/lint-i18n-coverage.mjs — Story 7.1 AC-8.
//
// Mechanizes the AC-5 "no hardcoded English" rule + key-coverage so it cannot
// regress (architecture line 838 — the documented optional v1 lint, activated
// for Epic 7). Two checks over src/assessment/**/*.js:
//
//   (A) KEY COVERAGE (fail): every STATIC string-literal key passed to
//       get("ns.key") / t("ns.key") / localeLoader.get("ns.key") must resolve
//       to a key present in src/content/i18n/en/strings.json. Dynamic
//       references (e.g. get(ns + "." + k) in routing.js) are skipped — they
//       are covered by the NS-map round-trip.
//   (B) HARDCODED PROSE (fail): a quoted string literal assigned directly to
//       `.textContent` / `.innerText` that contains a 4+ letter word is a
//       hardcoded UI string — it must come from get()/t()/fmt() instead.
//       innerHTML is exempt (legitimately holds component markup); the locale
//       radio labels EN/RU/PL and dev-facing strings are out of scope per AC-5.
//
// Stdlib-only (NFR33). Pure ESM (.mjs).
// Env: IQME_LINT_TARGET overrides the scan dir (tests); IQME_I18N_EN overrides
// the EN bundle path.

import { readFileSync, globSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const SCAN_DIR = resolve(REPO_ROOT, process.env.IQME_LINT_TARGET || "src/assessment");
const EN_PATH = resolve(REPO_ROOT, process.env.IQME_I18N_EN || "src/content/i18n/en/strings.json");

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === "_meta") continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out.add(key);
  }
}

let enKeys;
try {
  const en = JSON.parse(readFileSync(EN_PATH, "utf8"));
  enKeys = new Set();
  flatten(en, "", enKeys);
} catch (e) {
  process.stderr.write(`lint-i18n-coverage: ERROR cannot read EN bundle ${EN_PATH}: ${e.message}\n`);
  process.exit(1);
}

// Static key references: get("x.y") | t("x.y") | localeLoader.get("x.y")
const KEY_REF = /(?:\b(?:localeLoader\.)?get|\bt)\(\s*(["'])([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)\1\s*\)/g;
// Hardcoded prose assigned straight to textContent/innerText.
const HARDCODED = /\.(?:textContent|innerText)\s*=\s*(["'])((?:(?!\1).)*[A-Za-z]{4,}(?:(?!\1).)*)\1/g;

const files = globSync(`${SCAN_DIR}/**/*.{js,mjs}`).sort();
const missingKeys = [];
const hardcoded = [];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  let m;
  KEY_REF.lastIndex = 0;
  while ((m = KEY_REF.exec(src)) !== null) {
    const key = m[2];
    if (!enKeys.has(key)) missingKeys.push({ f, key });
  }
  HARDCODED.lastIndex = 0;
  while ((m = HARDCODED.exec(src)) !== null) {
    hardcoded.push({ f, text: m[2] });
  }
}

if (missingKeys.length === 0 && hardcoded.length === 0) {
  process.stdout.write(`lint-i18n-coverage: ok (${files.length} files; ${enKeys.size} EN keys)\n`);
  process.exit(0);
}
for (const { f, key } of missingKeys) {
  process.stderr.write(`BREACH lint-i18n-coverage: ${f} references i18n key "${key}" absent from EN bundle\n`);
}
for (const { f, text } of hardcoded) {
  process.stderr.write(`BREACH lint-i18n-coverage: ${f} assigns hardcoded prose to textContent ("${text.slice(0, 40)}…") — route via get()/t()\n`);
}
process.exit(1);
