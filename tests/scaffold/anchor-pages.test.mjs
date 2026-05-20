// Story 5.2 — anchor pages scaffold tests.
//
// Asserts the 7 EN anchor pages exist, parse via the strict-mode subset
// renderer, and carry valid frontmatter (8 required keys) without
// `pending: true`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "../../tools/markdown-subset.mjs";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const METH_ROOT = join(REPO_ROOT, "src", "content", "methodology", "en");

const ANCHOR_PAGES = [
  "constructs/fluid-reasoning/index.md",
  "scoring/overview/index.md",
  "scoring/uncertainty/index.md",
  "limitations/what-this-does-not-measure/index.md",
  "ethics/non-clinical/index.md",
  "provenance/icar-license.md",
  "reference/glossary/index.md",
];

const REQUIRED_FM_KEYS = [
  "title", "version", "lastReviewed", "reviewer", "reviewerHandle",
  "asserts", "glossaryRefs", "sourceHashEN",
];

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return null;
  const fm = {};
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (m) fm[m[1]] = m[2];
  }
  const body = lines.slice(end + 1).join("\n");
  return { fm, body };
}

for (const rel of ANCHOR_PAGES) {
  test(`Story 5.2: anchor page exists — ${rel}`, () => {
    const p = join(METH_ROOT, rel);
    assert.ok(existsSync(p), `${p} missing`);
  });
}

for (const rel of ANCHOR_PAGES) {
  test(`Story 5.2: ${rel} has all required frontmatter keys`, () => {
    const p = join(METH_ROOT, rel);
    if (!existsSync(p)) return; // covered by the existence test
    const text = readFileSync(p, "utf8");
    const parsed = parseFrontmatter(text);
    assert.ok(parsed, `${rel}: malformed frontmatter`);
    for (const k of REQUIRED_FM_KEYS) {
      assert.ok(k in parsed.fm, `${rel}: missing required key ${k}`);
    }
    // No leftover stub markers — exception: icar-license is verify-only
    // (already exists from Story 1.3; pending until Gate 9a clears).
    if (rel !== "provenance/icar-license.md") {
      assert.ok(
        !("pending" in parsed.fm) || parsed.fm.pending === "false",
        `${rel}: anchor page must not have pending: true`,
      );
    }
  });
}

for (const rel of ANCHOR_PAGES) {
  test(`Story 5.2: ${rel} body parses through strict-mode renderer`, () => {
    const p = join(METH_ROOT, rel);
    if (!existsSync(p)) return;
    const text = readFileSync(p, "utf8");
    const parsed = parseFrontmatter(text);
    if (!parsed) return;
    // Strict-mode rendering passes (no thrown error).
    assert.doesNotThrow(() =>
      render(parsed.body, { sourcePath: p, allowZeroH1: true }),
    );
  });
}
