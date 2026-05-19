// Story 1.2 — Acceptance tests for trust artifacts.
// Frozen during specialist impl per ADR-0013.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const read = (p) => readFileSync(join(REPO_ROOT, p), "utf8");

test("AC-1: LICENSES.md exists at repo root", () => {
  assert.equal(existsSync(join(REPO_ROOT, "LICENSES.md")), true);
});

test("AC-1: LICENSES.md enumerates all four license classes", () => {
  const txt = read("LICENSES.md");
  assert.match(txt, /\bMIT\b/, "must declare MIT for app code");
  assert.match(txt, /\bCC-BY-NC-SA\b/, "must declare CC-BY-NC-SA");
  assert.match(txt, /item\s*pool/i, "must mention 'item pool' class");
  assert.match(
    txt,
    /(methodology\s*corpus|methodology[-_\s]content)/i,
    "must mention methodology corpus class",
  );
  assert.match(
    txt,
    /(translated|translation)/i,
    "must mention translated content class",
  );
});

test("AC-1: LICENSES.md carries a `last-modified-hash` comment field", () => {
  const txt = read("LICENSES.md");
  // HTML comment, since LICENSES.md is markdown
  assert.match(
    txt,
    /<!--[^>]*last-modified-hash\s*[:=][^>]*-->/i,
    "LICENSES.md must contain a `<!-- last-modified-hash: ... -->` comment for the license-provenance lint (NFR24)",
  );
});

test("AC-2: CITATION.cff exists at repo root", () => {
  assert.equal(existsSync(join(REPO_ROOT, "CITATION.cff")), true);
});

test("AC-2: CITATION.cff is YAML-valid with required CFF v1.2.0 fields", () => {
  const txt = read("CITATION.cff");
  // Minimal parser: line-by-line key extraction.
  const fields = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*?)\s*$/);
    if (m && !line.startsWith(" ")) fields[m[1]] = m[2];
  }
  assert.equal(fields["cff-version"], "1.2.0", "must declare cff-version 1.2.0");
  assert.ok(fields["title"], "must have title field");
  assert.equal(fields["version"], "0.0.1", "must have version 0.0.1");
  assert.ok(fields["date-released"], "must have date-released field");
  assert.ok("doi" in fields, "must have doi key (empty OK at v0.0.1)");
  // authors is a list — just assert the key appears
  assert.match(txt, /^authors:\s*$/m, "must have authors list");
});

test("AC-3: README.md exists at repo root", () => {
  assert.equal(existsSync(join(REPO_ROOT, "README.md")), true);
});

test("AC-3: README.md has a 'Forking ethics' titled section", () => {
  const txt = read("README.md");
  assert.match(
    txt,
    /^#{1,6}\s+forking\s+ethics\b/im,
    "README.md must contain a 'Forking ethics' header",
  );
});

test("AC-3: README.md Forking ethics section asks to preserve caveats + methodology + acknowledges MIT non-enforcement", () => {
  const txt = read("README.md");
  // Extract from "Forking ethics" header to next H2 or EOF.
  const m = txt.match(/^#{1,6}\s+forking\s+ethics\b[\s\S]*?(?=^#{1,6}\s|\Z)/im);
  assert.ok(m, "could not locate Forking ethics section");
  const section = m[0];
  assert.match(section, /caveats?/i, "section must mention caveats");
  assert.match(section, /methodology/i, "section must mention methodology");
  assert.match(
    section,
    /(request|not\s+enforceable|MIT\s+permits|cannot\s+enforce)/i,
    "section must acknowledge this is a request, not enforceable under MIT",
  );
});

test("AC-3: README.md first 200 words mention no-telemetry, no-signup, source-on-GitHub", () => {
  const txt = read("README.md");
  // First 200 words of body (strip leading whitespace).
  const words = txt.split(/\s+/).filter(Boolean).slice(0, 200).join(" ");
  assert.match(
    words,
    /(no[-\s]?telemetry|zero\s+telemetry)/i,
    "first 200 words must establish no-telemetry claim",
  );
  assert.match(
    words,
    /(no[-\s]?signup|no\s+accounts?|no\s+login)/i,
    "first 200 words must establish no-signup claim",
  );
  assert.match(
    words,
    /(source[-\s]on[-\s]GitHub|open\s+source|github\.com)/i,
    "first 200 words must establish source-on-GitHub claim",
  );
});

test("AC-4: CONTRIBUTING.md exists with slim/Epic-8 timing note + CODEOWNERS pointer", () => {
  assert.equal(existsSync(join(REPO_ROOT, "CONTRIBUTING.md")), true);
  const txt = read("CONTRIBUTING.md");
  assert.match(
    txt,
    /(epic\s*8|epic-8|full\s+contributing|expanded\s+in)/i,
    "CONTRIBUTING.md must reference Epic 8 expansion timing",
  );
  assert.match(
    txt,
    /CODEOWNERS/,
    "CONTRIBUTING.md must point to CODEOWNERS",
  );
});

test("AC-5: .github/CODEOWNERS exists with RU + PL placeholder reviewers", () => {
  assert.equal(existsSync(join(REPO_ROOT, ".github/CODEOWNERS")), true);
  const txt = read(".github/CODEOWNERS");
  // RU mappings
  assert.match(
    txt,
    /src\/content\/methodology\/ru\/\*\*\s+@TBD-ru-reviewer/,
    "CODEOWNERS must map src/content/methodology/ru/** to @TBD-ru-reviewer",
  );
  assert.match(
    txt,
    /src\/content\/i18n\/ru\/\*\*\s+@TBD-ru-reviewer/,
    "CODEOWNERS must map src/content/i18n/ru/** to @TBD-ru-reviewer",
  );
  // PL mappings
  assert.match(
    txt,
    /src\/content\/methodology\/pl\/\*\*\s+@TBD-pl-reviewer/,
    "CODEOWNERS must map src/content/methodology/pl/** to @TBD-pl-reviewer",
  );
  assert.match(
    txt,
    /src\/content\/i18n\/pl\/\*\*\s+@TBD-pl-reviewer/,
    "CODEOWNERS must map src/content/i18n/pl/** to @TBD-pl-reviewer",
  );
});
