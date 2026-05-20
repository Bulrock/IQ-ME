#!/usr/bin/env node
// tools/lint-csp-source.mjs — Story 4.8.
//
// Out-of-band CSP-source check (NFR7 enforcement contract). Scans
// `src/index.html` and (if present) `dist/methodology/**/*.html` asserting:
//
//   - No <style> element (no inline stylesheets).
//   - No <script> element with inline body (script tags with `src=` are OK).
//   - No style="..." attribute on any element (no inline-style attributes).
//   - No on*="..." event-handler attributes (onclick, onload, etc.).
//
// Architectural exemption (architecture.md §D10 + line 749 — "lint-no-inline-script.mjs:
// only the <script nomodule> fallback toggle is permitted inline"):
//
//   - <script nomodule>…</script> with body limited to display-toggle is allowed.
//   - style="display:none" attribute on the #fallback element is allowed (the
//     D10 fallback container).
//
// Stdlib-only (NFR33). ESM. Regex-based HTML scanner — IQ-ME HTML is small
// and authored-as-shipped; we do not need a full parser.
//
// Invocation:
//   node tools/lint-csp-source.mjs
//   node tools/lint-csp-source.mjs --paths=<file-or-dir>[,<file-or-dir>...]
//
// Exit 0 with `lint-csp-source: N file(s) scanned`.
// Exit 1 with one `lint-csp-source: <file>: <violation>` line per violation.
//
// Degraded mode (AC-6 option b): if dist/ doesn't exist, scan src/index.html
// only and emit `lint-csp-source: WARN dist/methodology absent — full scan
// deferred to make test`.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { argv, cwd, stdout, stderr, exit } from "node:process";

const CWD = cwd();

// ─── arg parsing ─────────────────────────────────────────────────────────
const args = argv.slice(2);
let pathsArg = null;
for (const a of args) {
  if (a.startsWith("--paths=")) pathsArg = a.slice("--paths=".length);
}

// ─── default scope ───────────────────────────────────────────────────────
function defaultScope() {
  const files = [];
  const indexHtml = resolve(CWD, "src/index.html");
  if (existsSync(indexHtml)) files.push(indexHtml);
  const distMeth = resolve(CWD, "dist/methodology");
  if (existsSync(distMeth)) {
    files.push(...walkHtml(distMeth));
  } else {
    stderr.write(
      "lint-csp-source: WARN dist/methodology absent — full scan deferred to make test\n",
    );
  }
  return files;
}

function* walkHtmlGen(dir) {
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
    if (e.isDirectory()) yield* walkHtmlGen(p);
    else if (e.isFile() && e.name.endsWith(".html")) yield p;
  }
}
function walkHtml(dir) { return [...walkHtmlGen(dir)]; }

function resolveScope(pathsArg) {
  if (!pathsArg) return defaultScope();
  const out = [];
  for (const raw of pathsArg.split(",")) {
    const p = resolve(CWD, raw.trim());
    if (!existsSync(p)) {
      stderr.write(`lint-csp-source: ${raw}: path not found\n`);
      exit(1);
    }
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkHtml(p));
    else if (st.isFile()) {
      if (!p.endsWith(".html")) {
        stderr.write(`lint-csp-source: ${raw}: not an HTML file\n`);
        exit(1);
      }
      out.push(p);
    }
  }
  return out;
}

// ─── violation detection ─────────────────────────────────────────────────
//
// We treat HTML as a stream of element-tags + text. For the four classes:
//
//   1. <style> element — match any <style[\s>] start tag.
//   2. <script>…</script> with inline body — match <script…>BODY</script>
//      where BODY (trimmed) is non-empty AND the start tag has no `src=`.
//      Architectural exemption: <script nomodule>BODY</script> where BODY
//      consists only of display-toggle statements is allowed.
//   3. style="..." attribute — match style\s*=\s*"…" or style\s*=\s*'…'.
//      Exemption: style="display:none" on the #fallback element (D10).
//   4. on*="..." event-handler attribute — match \son[a-z]+\s*=.
//
// Line/column reporting: byte-offset → line+col via newline counting.

function offsetToLineCol(src, offset) {
  let line = 1, lastNl = -1;
  for (let i = 0; i < offset && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) { line++; lastNl = i; }
  }
  return { line, col: offset - lastNl };
}

const TAG_STYLE_OPEN = /<style\b[^>]*>/gi;
const TAG_SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const ATTR_STYLE = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const ATTR_EVENT_HANDLER = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi;

// D10 narrow exemption — display-toggle body only. We're permissive about
// whitespace and trailing semicolons; restrictive about anything else.
//
// Pattern: a sequence of `document.getElementById('X').style.display='V';`
// statements (single OR double quotes around id + value), separated by
// whitespace. Anything outside that grammar → fail.
const DISPLAY_TOGGLE_STMT =
  /document\.getElementById\((?:'[^']+'|"[^"]+")\)\.style\.display\s*=\s*(?:'[^']*'|"[^"]*")\s*;?/g;

function isDisplayToggleOnly(body) {
  const trimmed = body.trim();
  if (trimmed.length === 0) return true; // empty body — also allowed
  // Match all display-toggle statements; sum their lengths against the body
  // (modulo whitespace). If everything is consumed, the body is exemption-eligible.
  let remaining = trimmed;
  remaining = remaining.replace(DISPLAY_TOGGLE_STMT, "").trim();
  return remaining.length === 0;
}

// D10 narrow exemption: style="display:none" on element with id="fallback".
function isFallbackInlineStyle(html, attrOffset) {
  // Walk backwards from attrOffset to the nearest `<` (tag start).
  let i = attrOffset;
  while (i > 0 && html[i] !== "<") i--;
  if (html[i] !== "<") return false;
  // Read forward to `>` to capture the start-tag span.
  let j = i;
  while (j < html.length && html[j] !== ">") j++;
  const tag = html.slice(i, j + 1);
  // Must contain id="fallback" AND the style value is display:none (with
  // optional whitespace).
  const idOK = /\sid\s*=\s*['"]fallback['"]/.test(tag);
  const styleVal = tag.match(/\sstyle\s*=\s*['"]([^'"]*)['"]/);
  const valOK = styleVal && /^\s*display\s*:\s*none\s*;?\s*$/i.test(styleVal[1]);
  return idOK && valOK;
}

function lintFile(rel, src) {
  const violations = [];

  // 1. <style> element
  for (const m of src.matchAll(TAG_STYLE_OPEN)) {
    const { line, col } = offsetToLineCol(src, m.index);
    violations.push(`${rel}:${line}:${col}: inline <style> element forbidden (NFR7 CSP)`);
  }

  // 2. <script>…</script> with inline body
  for (const m of src.matchAll(TAG_SCRIPT_BLOCK)) {
    const attrs = m[1];
    const body = m[2];
    const hasSrc = /\bsrc\s*=/.test(attrs);
    const trimmed = body.trim();
    if (hasSrc) {
      // External script — body should be empty (browsers ignore body of src-set
      // scripts, but a non-empty body is still a smell).
      continue;
    }
    if (trimmed.length === 0) continue; // empty inline body is harmless
    // Architectural exemption: <script nomodule> with display-toggle body.
    const isNomodule = /\bnomodule\b/.test(attrs);
    if (isNomodule && isDisplayToggleOnly(body)) continue;
    const { line, col } = offsetToLineCol(src, m.index);
    violations.push(
      `${rel}:${line}:${col}: inline script element forbidden (NFR7 CSP — only <script nomodule> display-toggle exempt per D10)`,
    );
  }

  // 3. style="..." attribute
  for (const m of src.matchAll(ATTR_STYLE)) {
    if (isFallbackInlineStyle(src, m.index)) continue;
    const { line, col } = offsetToLineCol(src, m.index);
    violations.push(
      `${rel}:${line}:${col}: inline style="..." attribute forbidden (NFR7 CSP)`,
    );
  }

  // 4. on*="..." event-handler attribute
  for (const m of src.matchAll(ATTR_EVENT_HANDLER)) {
    const { line, col } = offsetToLineCol(src, m.index);
    violations.push(
      `${rel}:${line}:${col}: inline event-handler attribute forbidden (NFR7 CSP)`,
    );
  }

  return violations;
}

// ─── main ────────────────────────────────────────────────────────────────
function main() {
  const files = resolveScope(pathsArg);
  if (files.length === 0) {
    stdout.write("lint-csp-source: 0 file(s) scanned\n");
    exit(0);
  }
  let total = 0;
  for (const f of files) {
    const rel = relative(CWD, f);
    let text;
    try {
      text = readFileSync(f, "utf8");
    } catch (e) {
      stderr.write(`lint-csp-source: ${rel}: read error: ${e.message}\n`);
      total++;
      continue;
    }
    const vs = lintFile(rel, text);
    for (const v of vs) stderr.write(`lint-csp-source: ${v}\n`);
    total += vs.length;
  }
  if (total > 0) {
    stderr.write(`lint-csp-source: ${total} violation(s) across ${files.length} file(s)\n`);
    exit(1);
  }
  stdout.write(`lint-csp-source: ${files.length} file(s) scanned\n`);
  exit(0);
}

main();
