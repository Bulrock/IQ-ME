// Story bridge-9b-1 — Acceptance test for cross-linking the en corpus
// changelog page to the root CHANGELOG.md (AC 2).
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks (no markdown parser) — treat the page as text.
// RED until the specialist adds the two-changelog distinguishing note + a
// repo-relative link to root CHANGELOG.md on the en corpus changelog page.
//
// Context: Story 8.7 deferred (Task 3, marked [-]) this cross-reference because
// it forces a golden-snapshot regen and risks the link-policy lint + byte-stable
// build for optional polish. This story owns those consequences end to end.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const CORPUS_CHANGELOG = join(
  REPO_ROOT,
  "src",
  "content",
  "methodology",
  "en",
  "reference",
  "changelog",
  "index.md",
);

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// Strip YAML frontmatter so prose/link assertions only see the body.
function body(text) {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) return text.slice(text.indexOf("\n", end + 1) + 1);
  }
  return text;
}

// Story 11-1: the reference/changelog corpus page was removed in the
// methodology cut (maintainer decision). With the page intentionally absent the
// cross-link requirement is moot — these checks no-op rather than fail.
test("AC2: en corpus changelog carries a repo-relative link to root CHANGELOG.md", () => {
  if (!existsSync(CORPUS_CHANGELOG)) return; // page removed in Story 11-1 cut
  const md = body(read(CORPUS_CHANGELOG));

  // An inline markdown link whose target resolves to the root CHANGELOG.md via
  // a relative (`../`-prefixed) path — repo-relative, so the link-policy lint
  // stays green and no external URL is introduced.
  const relLink = /\]\(((?:\.\.\/)+)CHANGELOG\.md\)/;
  const m = md.match(relLink);
  assert.ok(
    m,
    "expected an inline markdown link to a relative `../…/CHANGELOG.md` target on the corpus changelog page",
  );

  // The link must NOT be an absolute or external (http/https) URL — AC 1 forbids
  // it so the external-link/link-policy lint stays green.
  assert.ok(
    !/\]\((?:https?:)?\/\/[^)]*CHANGELOG\.md\)/i.test(md),
    "link to root CHANGELOG.md must be repo-relative, not an absolute/external URL",
  );
});

test("AC2: en corpus changelog distinguishes the two changelogs (citation vs dev/release)", () => {
  if (!existsSync(CORPUS_CHANGELOG)) return; // page removed in Story 11-1 cut
  const md = body(read(CORPUS_CHANGELOG)).toLowerCase();

  // A note must frame the root CHANGELOG.md as the development/release log,
  // distinct from this page (the corpus = citation/version history). This is
  // the gap Story 8.7 deferred — without it the cross-reference is bare.
  assert.ok(
    /root\b[^.]*changelog/.test(md),
    "expected the note to reference the root CHANGELOG explicitly",
  );
  assert.ok(
    /(release|development|dev\b)/.test(md),
    "expected the note to frame the root CHANGELOG as the development/release log",
  );
  assert.ok(
    md.includes("citation"),
    "expected the note to frame this corpus page as the citation/version history",
  );
});
