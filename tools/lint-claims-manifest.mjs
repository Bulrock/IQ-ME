#!/usr/bin/env node
// Story 2.7 — METHODOLOGY_CLAIMS.json lint.
//
// Default (warn-mode): warns on missing methodology pages, exits 0.
// --strict: errors on missing methodology pages / asserts, exits 1.
//
// Engine-source missing on disk is ALWAYS a hard failure (exit 1) regardless
// of mode — the manifest's referenced JS file must exist.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CWD = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const manifestArg = args.find((a) => a.startsWith("--manifest="));
const MANIFEST_PATH = manifestArg
  ? resolve(CWD, manifestArg.slice("--manifest=".length))
  : resolve(CWD, "METHODOLOGY_CLAIMS.json");

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

for (const claim of manifest.claims) {
  const id = claim["claim-id"];
  const engineSource = resolve(CWD, claim["engine-source"]);
  const methodologyPath = resolve(CWD, claim["methodology-path"]);

  // Engine-source missing is always ERROR.
  if (!existsSync(engineSource)) {
    emit("ERROR", `${id}: engine-source missing on disk: ${claim["engine-source"]}`);
    continue;
  }

  // Methodology page missing.
  if (!existsSync(methodologyPath)) {
    const level = strict ? "ERROR" : "WARN";
    emit(
      level,
      `${id}: expected methodology page at ${claim["methodology-path"]} not yet created (Epic 5)`,
    );
    continue;
  }

  // Methodology page exists — check asserts: frontmatter contains the claim-id.
  const pageText = readFileSync(methodologyPath, "utf8");
  const fmMatch = pageText.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) {
    const level = strict ? "ERROR" : "WARN";
    emit(level, `${id}: methodology page ${claim["methodology-path"]} has no YAML frontmatter`);
    continue;
  }
  const fm = fmMatch[1];
  // Match `asserts:` line(s); supports inline-array `asserts: [a, b]` and block-list forms.
  const assertsMatch = fm.match(/^asserts:\s*(.+?)(?:\n[a-zA-Z]|\n*$)/ms);
  if (!assertsMatch) {
    const level = strict ? "ERROR" : "WARN";
    emit(level, `${id}: methodology page ${claim["methodology-path"]} missing 'asserts:' frontmatter`);
    continue;
  }
  if (!assertsMatch[1].includes(id)) {
    const level = strict ? "ERROR" : "WARN";
    emit(
      level,
      `${id}: methodology page ${claim["methodology-path"]} 'asserts:' does not list claim-id`,
    );
    continue;
  }
}

if (hardFail) {
  process.exit(1);
}

if (strict && softWarn) {
  // In strict mode, warns also fail. (Not currently reached since strict converts WARN→ERROR; defensive.)
  process.exit(1);
}

const mode = strict ? "strict" : "warn";
process.stdout.write(
  `lint-claims-manifest: ok (${manifest.claims.length} claims; mode=${mode})\n`,
);
process.exit(0);
