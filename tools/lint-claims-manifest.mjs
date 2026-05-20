#!/usr/bin/env node
// Story 2.7 + 4.3 — METHODOLOGY_CLAIMS.json lint.
//
// Default (warn-mode): warns on missing methodology pages / asserts, exits 0.
// --strict: errors on missing-page-asserts, exits 1; preserves WARN-only for
//           methodology-path not yet authored on disk (Epic-5 deferred).
//
// Engine-source missing on disk is ALWAYS a hard failure (exit 1) regardless
// of mode — the manifest's referenced JS file must exist.
//
// Story 4.3 added (strict-mode only):
//   - bidirectional check: every assert id declared by an in-repo methodology
//     page must be a known claim-id (orphan asserts → ERROR).
//   - methodology-path exists + assert missing → ERROR (was WARN).
//   - methodology-path NOT on disk → WARN (preserves Epic-5 deferral).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const CWD = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const manifestArg = args.find((a) => a.startsWith("--manifest="));
const MANIFEST_PATH = manifestArg
  ? resolve(CWD, manifestArg.slice("--manifest=".length))
  : resolve(CWD, "METHODOLOGY_CLAIMS.json");
const METHODOLOGY_ROOT = resolve(CWD, "src/content/methodology");

if (!existsSync(MANIFEST_PATH)) {
  process.stderr.write(
    `lint-claims-manifest: ERROR — manifest not found at ${MANIFEST_PATH}\n`,
  );
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
} catch (e) {
  process.stderr.write(
    `lint-claims-manifest: ERROR — failed to parse ${MANIFEST_PATH}: ${e.message}\n`,
  );
  process.exit(1);
}

if (!manifest || !Array.isArray(manifest.claims)) {
  process.stderr.write(
    `lint-claims-manifest: ERROR — manifest missing claims[] array\n`,
  );
  process.exit(1);
}

let hardFail = false;
let softWarn = false;

function emit(level, msg) {
  process.stderr.write(`${level} ${msg}\n`);
  if (level === "ERROR") hardFail = true;
  else if (level === "WARN") softWarn = true;
}

// Parse the `asserts:` entries from a frontmatter block. Returns array of
// claim-id strings. Best-effort regex parse — handles inline-array and
// block-list forms used in the corpus.
function parseAssertsFromPage(pageText) {
  const fmMatch = pageText.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  // Inline-array form: `asserts: [a, b]` or `asserts: []`.
  const inline = fm.match(/^asserts:\s*\[([^\]]*)\]\s*$/m);
  if (inline) {
    const inner = inline[1].trim();
    if (inner === "") return [];
    return inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }
  // Block-list form: `asserts:\n  - "foo"\n  - "bar"`.
  const block = fm.match(/^asserts:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (block) {
    return block[1]
      .split(/\n/)
      .map((l) => l.match(/^\s+-\s+(.+?)\s*$/))
      .filter(Boolean)
      .map((m) => m[1].replace(/^["']|["']$/g, ""));
  }
  // No `asserts:` at all.
  return null;
}

// Walk methodology tree and yield .md paths (deterministic order).
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

// Build the claim-id set for bidirectional checks.
const knownClaimIds = new Set(manifest.claims.map((c) => c["claim-id"]));

// ─── Forward direction: manifest claim → methodology page ───────────
for (const claim of manifest.claims) {
  const id = claim["claim-id"];
  const engineSource = resolve(CWD, claim["engine-source"]);
  const methodologyPath = resolve(CWD, claim["methodology-path"]);

  // Engine-source missing is always ERROR.
  if (!existsSync(engineSource)) {
    emit("ERROR", `${id}: engine-source missing on disk: ${claim["engine-source"]}`);
    continue;
  }

  // Methodology page not on disk → WARN (Epic-5 deferred); does NOT escalate
  // to ERROR in strict mode (Story 4.3 preserves the deferral semantics).
  if (!existsSync(methodologyPath)) {
    emit(
      "WARN",
      `lint-claims-manifest: ${claim["methodology-path"]} not yet authored (claim "${id}" deferred to Epic 5)`,
    );
    continue;
  }

  // Methodology page exists — verify the page's `asserts:` includes the claim-id.
  const pageText = readFileSync(methodologyPath, "utf8");
  const asserts = parseAssertsFromPage(pageText);
  if (asserts === null) {
    const level = strict ? "ERROR" : "WARN";
    emit(
      level,
      `lint-claims-manifest: ${claim["methodology-path"]}: missing 'asserts:' frontmatter (claim "${id}")`,
    );
    continue;
  }
  if (!asserts.includes(id)) {
    const level = strict ? "ERROR" : "WARN";
    emit(
      level,
      `lint-claims-manifest: ${claim["methodology-path"]}: missing assert "${id}" (engine-source: ${claim["engine-source"]})`,
    );
    continue;
  }
}

// ─── Reverse direction (strict-mode only): page → manifest ───────────
// Walk every in-repo methodology page; flag any `asserts:` entry that is not
// a known claim-id in the manifest.
if (strict && existsSync(METHODOLOGY_ROOT)) {
  for (const pagePath of walkMd(METHODOLOGY_ROOT)) {
    const text = readFileSync(pagePath, "utf8");
    const asserts = parseAssertsFromPage(text);
    if (!asserts || asserts.length === 0) continue;
    const relPath = pagePath.startsWith(CWD)
      ? pagePath.slice(CWD.length + 1)
      : pagePath;
    for (const a of asserts) {
      if (!knownClaimIds.has(a)) {
        emit(
          "ERROR",
          `lint-claims-manifest: ${relPath}: orphan assert "${a}" — either add this claim to METHODOLOGY_CLAIMS.json (if engine implements it) or remove the assert from the methodology page`,
        );
      }
    }
  }
}

if (hardFail) {
  process.exit(1);
}

const mode = strict ? "strict" : "warn";
process.stdout.write(
  `lint-claims-manifest: ok (${manifest.claims.length} claims; mode=${mode}${softWarn ? "; warnings emitted" : ""})\n`,
);
process.exit(0);
