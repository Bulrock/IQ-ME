// Story 1.3 — Acceptance tests for ICAR-CONFIRMATION.pdf slot.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const PDF_PATH = join(REPO_ROOT, "ICAR-CONFIRMATION.pdf");
const README_PATH = join(REPO_ROOT, "README.md");
const STUB_PATH = join(
  REPO_ROOT,
  "src/content/methodology/en/provenance/icar-license.md",
);

test("AC-1: ICAR-CONFIRMATION.pdf exists at repo root", () => {
  assert.equal(existsSync(PDF_PATH), true);
  assert.ok(statSync(PDF_PATH).size > 200, "PDF should not be empty");
});

test("AC-1: ICAR-CONFIRMATION.pdf has the prescribed title and body strings", () => {
  // Read as latin1 — PDF is a text-with-binary container; required prose lives
  // in literal string objects, which are byte-preserving for ASCII content.
  const pdf = readFileSync(PDF_PATH, "latin1");
  assert.match(
    pdf,
    /%PDF-1\.[0-9]/,
    "must be a well-formed PDF (PDF-1.x header)",
  );
  assert.match(
    pdf,
    /ICAR License Confirmation\s*[—\-]\s*Pending/,
    "must contain the title 'ICAR License Confirmation — Pending'",
  );
  assert.match(
    pdf,
    /Pre-launch gate #1/,
    "must contain the prescribed body 'Pre-launch gate #1: ...'",
  );
  assert.match(
    pdf,
    /ICAR ?\/ ?SAPA project/,
    "must reference 'ICAR / SAPA project'",
  );
  assert.match(
    pdf,
    /CC ?BY-NC-SA/,
    "must reference CC BY-NC-SA license",
  );
  assert.match(
    pdf,
    /provenance\/icar-license/,
    "must reference the bidirectional methodology page path",
  );
});

test("AC-2: README links to ICAR-CONFIRMATION.pdf", () => {
  const readme = readFileSync(README_PATH, "utf8");
  assert.match(
    readme,
    /ICAR-CONFIRMATION\.pdf/,
    "README must reference ICAR-CONFIRMATION.pdf (link or mention)",
  );
});

test("AC-3: methodology stub at src/content/methodology/en/provenance/icar-license.md exists", () => {
  assert.equal(existsSync(STUB_PATH), true);
});

test("AC-3: methodology stub references back to ICAR-CONFIRMATION.pdf (bidirectional)", () => {
  const stub = readFileSync(STUB_PATH, "utf8");
  assert.match(
    stub,
    /ICAR-CONFIRMATION\.pdf/,
    "stub must reference ICAR-CONFIRMATION.pdf",
  );
  assert.match(
    stub,
    /(pending|temporary|stub|gate 9a)/i,
    "stub must declare its temporary/pending nature",
  );
});

test("AC-3: methodology stub has minimal frontmatter (title + pending flag)", () => {
  const stub = readFileSync(STUB_PATH, "utf8");
  assert.match(
    stub,
    /^---\s*\n([\s\S]*?\n)?title:\s*.+\n/m,
    "stub frontmatter must declare a title",
  );
  assert.match(
    stub,
    /^pending:\s*true\s*$/m,
    "stub frontmatter must declare pending: true",
  );
});
