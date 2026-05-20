// Story 5.2 — typographic-freeze contract spec.
//
// Reads tests/snapshots/typographic-freeze.json (selector → property → expected
// value) and asserts that the listed CSS files declare each pair verbatim.
// Static-analysis only — full Playwright computed-style assertion is Epic 6
// Story 6.1's graduation.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const SNAPSHOT = join(REPO_ROOT, "tests", "snapshots", "typographic-freeze.json");

test("Story 5.2: tests/snapshots/typographic-freeze.json exists", () => {
  assert.ok(existsSync(SNAPSHOT), `${SNAPSHOT} missing`);
});

test("Story 5.2: each snapshot entry's declared value appears in its source CSS", () => {
  if (!existsSync(SNAPSHOT)) return;
  const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  assert.ok(Array.isArray(snap.entries), "snapshot must have entries[]");
  assert.ok(snap.entries.length >= 10, `expected ≥10 entries, got ${snap.entries.length}`);

  // Read every referenced CSS file once.
  const sources = new Map();
  for (const entry of snap.entries) {
    if (!sources.has(entry.source)) {
      const p = join(REPO_ROOT, entry.source);
      assert.ok(existsSync(p), `entry.source ${entry.source} missing`);
      sources.set(entry.source, readFileSync(p, "utf8"));
    }
  }

  for (const entry of snap.entries) {
    const css = sources.get(entry.source);
    // Locate the selector block, allow whitespace around braces. Match the
    // selector then capture until the next closing brace at the same
    // nesting level (good enough for a flat component CSS file).
    const selectorRe = new RegExp(
      escapeRegex(entry.selector) + "\\s*\\{([\\s\\S]*?)\\}",
      "m",
    );
    const m = css.match(selectorRe);
    assert.ok(m, `selector ${entry.selector} not found in ${entry.source}`);
    const block = m[1];
    const declRe = new RegExp(
      escapeRegex(entry.property) + "\\s*:\\s*" + escapeRegex(entry.value),
    );
    assert.match(
      block,
      declRe,
      `${entry.selector} { ${entry.property}: ${entry.value} } not found in ${entry.source}`,
    );
  }
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
