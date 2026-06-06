// Story 9d-2 — Gate-closed guard for PL clinical-register sign-off.
//
// Asserts that the REAL PL reviewer has delivered and signed:
//   - pl-translator-signoff.md is finalized (no PENDING, real name/handle/date)
//   - .github/CODEOWNERS has no @TBD-pl-reviewer placeholder
//   - PL methodology pages carry non-placeholder reviewer fields
//
// RED until Story 9d-2 impl phase completes (real reviewer delivered + signed).
// Governing lesson lesson-2026-06-04-002: never fabricate reviewer identity.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readdirSync } from "node:fs";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const SIGNOFF = join(REPO_ROOT, "docs", "launch-readiness", "pl-translator-signoff.md");
const CODEOWNERS = join(REPO_ROOT, ".github", "CODEOWNERS");
const PL_METHODOLOGY = join(REPO_ROOT, "src", "content", "methodology", "pl");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

function walkMd(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMd(full));
    else if (entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

test("AC1: pl-translator-signoff.md is finalized — no longer reads PENDING", () => {
  const signoff = read(SIGNOFF);
  assert.ok(
    !/STATUS:\s*PENDING/i.test(signoff),
    "pl-translator-signoff.md must not carry 'STATUS: PENDING' when Gate 9d is closed",
  );
});

test("AC1: pl-translator-signoff.md has a real reviewer name (not 'pending' or 'TBD')", () => {
  const signoff = read(SIGNOFF);
  // Must contain "Reviewer name:" followed by something that isn't a placeholder
  assert.match(
    signoff,
    /Reviewer name:\s*(?!_pending_|\*pending\*|pending|TBD)\S/im,
    "pl-translator-signoff.md must have a real reviewer name (not 'pending' or 'TBD')",
  );
});

test("AC1: pl-translator-signoff.md has a real GitHub handle (not 'pending' or '@TBD')", () => {
  const signoff = read(SIGNOFF);
  assert.match(
    signoff,
    /GitHub handle:\s*@(?!TBD)\S/im,
    "pl-translator-signoff.md must have a real GitHub handle (not '@TBD-*' or 'pending')",
  );
});

test("AC1: pl-translator-signoff.md has a real sign-off date (ISO format)", () => {
  const signoff = read(SIGNOFF);
  assert.match(
    signoff,
    /Date of sign[- ]off:\s*\d{4}-\d{2}-\d{2}/im,
    "pl-translator-signoff.md must record a real ISO sign-off date (YYYY-MM-DD)",
  );
});

test("AC2: CODEOWNERS does not contain @TBD-pl-reviewer", () => {
  const codeowners = read(CODEOWNERS);
  assert.ok(
    !/@TBD-pl-reviewer/.test(codeowners),
    ".github/CODEOWNERS must not contain '@TBD-pl-reviewer' — replace with the real reviewer handle once Gate 9d closes",
  );
});

test("AC3: all PL methodology pages have non-placeholder reviewer fields", () => {
  const pages = walkMd(PL_METHODOLOGY);
  assert.ok(pages.length > 0, "expected PL methodology pages to exist");

  const violations = [];
  for (const p of pages) {
    const content = readFileSync(p, "utf8");
    // Only check files that have reviewer frontmatter at all
    if (!/^reviewer:/m.test(content) && !/^reviewerHandle:/m.test(content)) continue;
    if (/^reviewer:\s*["']?TBD["']?\s*$/m.test(content)) {
      violations.push(`${p.replace(REPO_ROOT + "/", "")}: reviewer: TBD`);
    }
    if (/^reviewerHandle:\s*["']?@TBD-pl-reviewer["']?\s*$/m.test(content)) {
      violations.push(`${p.replace(REPO_ROOT + "/", "")}: reviewerHandle: @TBD-pl-reviewer`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `PL methodology pages still have placeholder reviewer fields (Gate 9d not closed):\n${violations.join("\n")}`,
  );
});
