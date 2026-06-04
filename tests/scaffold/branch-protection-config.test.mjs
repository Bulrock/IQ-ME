// Story 7.8 — Acceptance tests for CODEOWNERS dual-ownership +
// docs/branch-protection-config.md (dual-approval enforcement, FR49).
//
// Red-phase: these MUST FAIL until impl lands —
//   - @Bulrock is added as a co-owner to every non-EN CODEOWNERS path,
//   - docs/branch-protection-config.md is created with the required
//     settings + synthetic-PR regression-recovery playbook + PENDING marker.
//
// The existing tests/scaffold/trust-artifacts.test.mjs AC-5 assertions
// (the @TBD-{lang}-reviewer token remains present per path) must stay green;
// these tests are additive and do not duplicate or break them.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const read = (p) => readFileSync(join(REPO_ROOT, p), "utf8");

const CODEOWNERS_PATH = ".github/CODEOWNERS";
const DOC_PATH = "docs/branch-protection-config.md";

// ─── CODEOWNERS robust parser ────────────────────────────────────────────
// Returns Map<pattern, owners[]>. Splits lines, ignores comments/blank,
// tokenizes on whitespace: first token is the pattern, the rest are owners.
function parseCodeowners(text) {
  const map = new Map();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (line === "") continue;
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) continue;
    const [pattern, ...owners] = tokens;
    map.set(pattern, owners);
  }
  return map;
}

// The 6 core non-EN content-key paths and their expected reviewer-of-record.
const CORE_PATHS = [
  { pattern: "src/content/methodology/ru/**", reviewer: "@TBD-ru-reviewer" },
  { pattern: "src/content/methodology/pl/**", reviewer: "@TBD-pl-reviewer" },
  { pattern: "src/content/i18n/ru/**", reviewer: "@TBD-ru-reviewer" },
  { pattern: "src/content/i18n/pl/**", reviewer: "@TBD-pl-reviewer" },
  { pattern: "src/content/crisis-resources/ru.json", reviewer: "@TBD-ru-reviewer" },
  { pattern: "src/content/crisis-resources/pl.json", reviewer: "@TBD-pl-reviewer" },
];

const MAINTAINER = "@Bulrock";

// ─── AC-1: CODEOWNERS dual-ownership per core non-EN path ────────────────
for (const { pattern, reviewer } of CORE_PATHS) {
  test(`AC-1: CODEOWNERS maps '${pattern}' to BOTH ${reviewer} AND ${MAINTAINER} on one line`, () => {
    const map = parseCodeowners(read(CODEOWNERS_PATH));
    const owners = map.get(pattern);
    assert.ok(
      owners,
      `CODEOWNERS must contain a line whose first token === '${pattern}'`,
    );
    assert.ok(
      owners.includes(reviewer),
      `'${pattern}' must retain the gated reviewer-of-record ${reviewer} (got: ${owners.join(" ")})`,
    );
    assert.ok(
      owners.includes(MAINTAINER),
      `'${pattern}' must add maintainer co-owner ${MAINTAINER} for dual-approval (got: ${owners.join(" ")})`,
    );
    assert.ok(
      owners.length >= 2,
      `'${pattern}' must list at least two co-owners (got: ${owners.join(" ")})`,
    );
  });
}

// ─── AC-4: gated @TBD handles retained (not replaced with real handles) ──
test("AC-4: CODEOWNERS still contains gated @TBD-ru-reviewer and @TBD-pl-reviewer", () => {
  const txt = read(CODEOWNERS_PATH);
  assert.match(
    txt,
    /@TBD-ru-reviewer\b/,
    "the RU reviewer-of-record handle must remain un-resolvable (@TBD-ru-reviewer), not replaced",
  );
  assert.match(
    txt,
    /@TBD-pl-reviewer\b/,
    "the PL reviewer-of-record handle must remain un-resolvable (@TBD-pl-reviewer), not replaced",
  );
});

// ─── AC-2: branch-protection-config.md exists + documents settings ───────
test("AC-2: docs/branch-protection-config.md exists", () => {
  assert.equal(
    existsSync(join(REPO_ROOT, DOC_PATH)),
    true,
    "docs/branch-protection-config.md must be created",
  );
});

test("AC-2: branch-protection-config.md documents require-PR-before-merging", () => {
  const txt = read(DOC_PATH);
  assert.match(
    txt,
    /require\s+(a\s+)?pull\s+request\s+before\s+merging/i,
    "doc must document 'require a pull request before merging'",
  );
});

test("AC-2: branch-protection-config.md documents require review from Code Owners", () => {
  const txt = read(DOC_PATH);
  assert.match(
    txt,
    /require\s+review\s+from\s+code\s*owners/i,
    "doc must document 'require review from Code Owners'",
  );
});

test("AC-2: branch-protection-config.md documents required status checks", () => {
  const txt = read(DOC_PATH);
  assert.match(
    txt,
    /required\s+status\s+checks/i,
    "doc must document 'required status checks'",
  );
});

test("AC-2: branch-protection-config.md documents disabling/blocking force pushes", () => {
  const txt = read(DOC_PATH);
  assert.match(
    txt,
    /(disable|block|disallow|no)\b[^\n]*force[-\s]?push/i,
    "doc must document disabling/blocking force pushes",
  );
});

test("AC-2: branch-protection-config.md documents a no-bypass clause (admin/maintainer cannot self-merge)", () => {
  const txt = read(DOC_PATH);
  assert.match(
    txt,
    /(do\s+not\s+allow\s+bypassing|no[-\s]bypass|cannot\s+bypass|even\s+an?\s+(admin|maintainer)|admins?\s+(included|cannot)|without\s+bypass)/i,
    "doc must document a no-bypass clause (admin/maintainer cannot self-merge a non-EN change)",
  );
});

// ─── AC-2: PENDING marker for the live rule export/screenshot ────────────
test("AC-2: branch-protection-config.md marks the live rule export/screenshot as PENDING", () => {
  const txt = read(DOC_PATH);
  // Find a PENDING/TBD marker near "export" or "screenshot".
  const m = txt.match(
    /(export|screenshot)[\s\S]{0,160}(pending|tbd)|(pending|tbd)[\s\S]{0,160}(export|screenshot)/i,
  );
  assert.ok(
    m,
    "doc must mark the live branch-protection rule export/screenshot as PENDING/TBD (not fabricated)",
  );
});

// ─── AC-3: synthetic-PR regression-recovery playbook ─────────────────────
test("AC-3: branch-protection-config.md references the pl/scoring/overview synthetic-PR change", () => {
  const txt = read(DOC_PATH);
  assert.match(
    txt,
    /src\/content\/methodology\/pl\/scoring\/overview\/index\.md/,
    "playbook must reference the synthetic single-line change to src/content/methodology/pl/scoring/overview/index.md",
  );
});

test("AC-3: branch-protection-config.md describes the PR blocked until dual-approval", () => {
  const txt = read(DOC_PATH);
  assert.match(
    txt,
    /blocked?/i,
    "playbook must describe the PR as blocked-from-merge",
  );
  assert.match(
    txt,
    /(until\s+both[\s\S]{0,80}approve|both[\s\S]{0,80}(maintainer|reviewer)[\s\S]{0,120}approve|dual[-\s]approval)/i,
    "playbook must describe dual-approval (blocked until BOTH maintainer and PL reviewer approve)",
  );
});
