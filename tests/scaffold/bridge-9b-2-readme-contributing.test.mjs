// Story bridge-9b-2 — Acceptance test guarding the README '## Contributing'
// section against the stale "expanded in Epic 8" framing (AC 1, AC 2).
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks (no markdown parser) — treat the README as text.
// RED until the specialist drops the "expanded in Epic 8" framing and states
// that CONTRIBUTING.md is now the full contribution guide.
//
// Context: Story 8.6 rewrote CONTRIBUTING.md into the full guide; Story 8.8
// disclosed that README's '## Contributing' line still claimed the surface is
// slim and "expanded in Epic 8". No test covered the line, so it was left for a
// controlled owner — this story.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const README = join(REPO_ROOT, "README.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// Extract the body of the '## Contributing' section (up to the next H2 or EOF).
function contributingSection(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Contributing\b/.test(l));
  assert.ok(start !== -1, "README is missing a '## Contributing' section");
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

test("AC1: README '## Contributing' drops the stale 'expanded in Epic 8' framing", () => {
  const section = contributingSection(read(README));
  assert.ok(
    !/expanded in Epic 8/i.test(section),
    "README '## Contributing' must no longer claim the surface is 'expanded in Epic 8' (Story 8.6 already shipped the full CONTRIBUTING.md)",
  );
  assert.ok(
    !/surface is slim/i.test(section),
    "README '## Contributing' must no longer describe the contribution surface as slim",
  );
});

test("AC2: README '## Contributing' preserves the relative link to CONTRIBUTING.md", () => {
  const section = contributingSection(read(README));
  assert.ok(
    /\]\(CONTRIBUTING\.md\)/.test(section),
    "README '## Contributing' must keep the repo-relative link to CONTRIBUTING.md",
  );
  // The link must stay repo-relative, not an absolute/external URL.
  assert.ok(
    !/\]\((?:https?:)?\/\/[^)]*CONTRIBUTING\.md\)/i.test(section),
    "link to CONTRIBUTING.md must be repo-relative, not an absolute/external URL",
  );
});
