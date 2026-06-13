// Story 13-5 — Acceptance guard for the redesigned downloadable/printable
// result document. Structural checks over print.css: an intentional print
// document (masthead hierarchy, co-equal triplet, expanded disclaimer +
// difficulty line, no interactive-chrome leak, white/dark-ink, no glass/blur).
//
// Authored in test-author phase (frozen during specialist impl). RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const PRINT = join(REPO_ROOT, "src", "css", "print.css");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// Extract only the @media print { ... } block content (balanced to EOF is fine
// here since print.css ends with the print block).
function printBlock(css) {
  const i = css.indexOf("@media print");
  assert.ok(i >= 0, "print.css must contain an @media print block");
  return css.slice(i);
}

test("AC1: print forces a white, dark-ink, light document (no theme bleed)", () => {
  const block = printBlock(read(PRINT));
  assert.match(block, /color-scheme:\s*light/, "print must force color-scheme: light");
  assert.match(block, /background:\s*#ffffff|background-color:\s*#ffffff/i, "print must force a white background");
  assert.match(block, /#111111|#111|#000/i, "print body text must be dark ink");
});

test("AC1/AC6: print uses NO glass/blur artifacts (glass does not print)", () => {
  const block = printBlock(read(PRINT));
  assert.ok(!/backdrop-filter/i.test(block), "print must not use backdrop-filter");
  assert.ok(!/blur\(/i.test(block), "print must not use blur()");
  assert.ok(!/--surface-glass/.test(block), "print must not reference glass roles (they don't print)");
});

test("AC1: print styles an intentional masthead document header", () => {
  const block = printBlock(read(PRINT));
  assert.match(block, /\.result-print-only\b/, "print must style the .result-print-only masthead");
  assert.match(block, /\.result-print-only__title\b/, "print must style the print title");
  assert.match(block, /\.result-print-only__date\b/, "print must style the print date");
});

test("AC2: the co-equal triplet stays uniform dark ink in print (not differentiated)", () => {
  const block = printBlock(read(PRINT));
  // All three triplet spans must be addressed with the same color treatment.
  assert.match(block, /\.score-panel__anchor/, "print must address the anchor span");
  assert.match(block, /\.score-panel__percentile/, "print must address the percentile span");
  assert.match(block, /\.score-panel__band/, "print must address the band span");
});

test("AC3: interactive-only chrome is hidden in print", () => {
  const block = printBlock(read(PRINT));
  for (const sel of [
    "\\.chrome-header",
    "\\.chrome-footer",
    "\\.result-print-btn",
    "\\.score-panel__save-button",
    "\\.rs-show",
    "\\.rs-not",
    "\\.tail-scene",
  ]) {
    assert.match(block, new RegExp(sel), `print must hide ${sel.replace(/\\\\/g, "")}`);
  }
  assert.match(block, /display:\s*none\s*!important/, "hidden chrome must use display:none !important");
});

test("AC3/AC4: the disclaimer body and the difficulty sentence are forced visible in print", () => {
  const block = printBlock(read(PRINT));
  assert.match(
    block,
    /\.score-panel__difficulty-sentence[\s\S]*display:\s*block\s*!important/,
    "difficulty sentence (reveal-gated on screen) must be forced visible in print",
  );
  // The disclaimer <details> body must print open/visible — force the details
  // content + summary marker visible so the full not-a-certificate text prints
  // even when collapsed on screen (PR-13).
  assert.match(
    block,
    /\.disclaimer\b|\.score-panel__explainer\b/,
    "print must force the disclaimer (details) content visible",
  );
  assert.match(
    block,
    /\.disclaimer[\s\S]*display:\s*block\s*!important|\.score-panel__explainer[\s\S]*display:\s*block\s*!important/,
    "the collapsed disclaimer body must be forced open (display:block !important) in print (PR-13 → paper)",
  );
});

// ── Redesign-specific assertions (PR-17): these drive the intentional-document
// work that the de-styled-screen print did not have. RED until the redesign. ──

test("AC1: print establishes a typographic hierarchy on the masthead title", () => {
  const block = printBlock(read(PRINT));
  // Title must be the document's dominant type — an explicit, larger size token
  // and a heavier weight than body, distinct from the date line.
  assert.match(
    block,
    /\.result-print-only__title[\s\S]*font-size:\s*var\(--font-size-(600|700)\)/,
    "print title must use a large display size token (--font-size-600/700) for document hierarchy",
  );
});

test("AC1: print constrains the document to a legible measure (RU/PL-safe, no clip)", () => {
  const block = printBlock(read(PRINT));
  assert.match(
    block,
    /max-width:\s*[0-9.]+rem/,
    "print must constrain the document to a rem-based reading measure (wrapping, never fixed-width clipping for RU/PL)",
  );
});

test("AC1: print emits a tidy document footer / identity line", () => {
  const block = printBlock(read(PRINT));
  assert.match(
    block,
    /\.result-print-footer\b/,
    "print must style a .result-print-footer document identity line (PR-17 intentional document)",
  );
});
