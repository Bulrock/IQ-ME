// Story 1.9 — Acceptance tests for docs/domain-map.md.
//
// Authored in test-author phase (frozen during specialist impl).
// Run: `node --test tests/scaffold/domain-map.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const DOC = join(REPO_ROOT, "docs", "domain-map.md");

const REQUIRED_SECTIONS = [
  /^## Domain A — SPA/m,
  /^## Domain B — Scoring Engine/m,
  /^## Domain C — Content/m,
  /^## Domain D — Tools/m,
  /^## Domain E — Test Fixtures/m,
  /^## Codified Exceptions/m,
];

test("AC-2: docs/domain-map.md exists", () => {
  assert.ok(existsSync(DOC), `${DOC} missing`);
});

for (const re of REQUIRED_SECTIONS) {
  test(`AC-2: docs/domain-map.md contains section ${re}`, () => {
    const text = readFileSync(DOC, "utf8");
    assert.match(text, re, `docs/domain-map.md missing required section matching ${re}`);
  });
}

test("AC-2: domain-map.md mentions the D→E `make snapshot-update` codified exception", () => {
  const text = readFileSync(DOC, "utf8");
  assert.match(
    text,
    /make snapshot-update/,
    `domain-map.md must explicitly mention the D→E "make snapshot-update" exception`,
  );
});

test("AC-2: domain-map.md enumerates concrete path examples for each domain", () => {
  const text = readFileSync(DOC, "utf8");
  // For each domain we expect at least one concrete path-token to appear.
  for (const token of ["src/assessment", "src/scoring", "src/content", "tools", "tests"]) {
    assert.ok(
      text.includes(token),
      `domain-map.md must include concrete path token "${token}"`,
    );
  }
});
