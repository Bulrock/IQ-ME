// Story 10-1 — Acceptance guard for the pre-launch readiness checklist,
// rollback runbook, and no-enshittification baseline template
// (AC 1–5). Epic 10 is the v1.0.0 coordinated release; this story
// ships only scaffold documentation under docs/launch-readiness/.
// The actual sign-offs are human-gated (real gate closures at launch time).
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks — no markdown parser, treat as text.
// RED until the specialist writes all three artifacts per the ACs.
//
// Governing lesson lesson-2026-06-04-002: pending/trust-critical content
// must never fabricate specifics. The checklist sign-off fields must not
// contain made-up dates, gate-closed claims, or fabricated verdicts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const CHECKLIST = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "v1.0.0-checklist.md",
);
const RUNBOOK = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "v1.0.0-rollback-runbook.md",
);
const BASELINE = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "v1.0.0-no-enshittification-baseline.md",
);

function read(p) {
  assert.ok(existsSync(p), `missing required file: ${p}`);
  return readFileSync(p, "utf8");
}

// A fabricated gate-closed claim would misrepresent real human deliverables.
// Pattern matches past-tense verbs asserting a gate has been completed with a specific
// date that looks real (YYYY-MM-DD or "signed" + a real-looking date context).
// We allow "FILL IN AT LAUNCH" and "pending" placeholders — those are expected.
const FABRICATED_SIGNOFF =
  /sign[- ]?off\s*:\s*[A-Za-z]{3,}\s+\d{1,2},?\s+\d{4}|signed\s+off\s+on\s+\d{4}-\d{2}-\d{2}|\bgate[- ]?9[a-e]\s*:\s*closed\b/i;

// Fabricated "all epics merged" claim — this would only be true after real merge
const FABRICATED_EPICS_MERGED =
  /epics?\s+1[–-]8\s+(all\s+)?(merged|complete|done)\s*✓|all\s+8\s+dev\s+epics?\s+merged\s*✓/i;

// AC1 + AC2: checklist exists with required sections and sign-off fields
test("AC1: v1.0.0-checklist.md exists and covers dev-epic merges section (AC1a)", () => {
  const checklist = read(CHECKLIST);
  // Section A: dev-epic merges
  assert.match(
    checklist,
    /epic[s]?\s*1[–\-–]?8|dev[- ]epic\s+merge|epics?\s+1\s*[–\-–]\s*8/i,
    "checklist must enumerate dev-epic merges (Epics 1–8)",
  );
  // Individual epics 1 through 8 must appear
  for (let i = 1; i <= 8; i++) {
    assert.match(
      checklist,
      new RegExp(`epic[- ]?${i}|epic\\s+${i}\\b`, "i"),
      `checklist must reference Epic ${i}`,
    );
  }
});

test("AC1: checklist covers gate-epic closures section (AC1b)", () => {
  const checklist = read(CHECKLIST);
  // Gate artifacts: all five must be referenced
  assert.match(
    checklist,
    /ICAR[- ]CONFIRMATION\.pdf/,
    "checklist must reference ICAR-CONFIRMATION.pdf (Gate 9a)",
  );
  assert.match(
    checklist,
    /psychometrician[- ]signoff\.md/i,
    "checklist must reference psychometrician-signoff.md (Gate 9b)",
  );
  assert.match(
    checklist,
    /ru[- ]translator[- ]signoff\.md/i,
    "checklist must reference ru-translator-signoff.md (Gate 9c)",
  );
  assert.match(
    checklist,
    /pl[- ]translator[- ]signoff\.md/i,
    "checklist must reference pl-translator-signoff.md (Gate 9d)",
  );
  assert.match(
    checklist,
    /tester[- ]credibility[- ]report\.md/i,
    "checklist must reference tester-credibility-report.md (Gate 9e)",
  );
  // 9e threshold
  assert.match(
    checklist,
    /12\s*\/\s*15|≥\s*12|at least 12/i,
    "checklist must reference the 9e ≥12/15 threshold",
  );
});

test("AC1: checklist covers CI gates section (AC1c)", () => {
  const checklist = read(CHECKLIST);
  assert.match(
    checklist,
    /pr[- ]checks\.yml|CI\s+gate/i,
    "checklist must reference pr-checks.yml CI gates",
  );
  assert.match(
    checklist,
    /if:\s*false|no.*if.*false stub/i,
    "checklist must assert no 'if: false' stubs remaining",
  );
});

test("AC1 + AC2: checklist covers manual smoke test matrix with browser matrix and sign-off fields (AC1d)", () => {
  const checklist = read(CHECKLIST);
  // Browser matrix
  assert.match(
    checklist,
    /Chrome|Firefox|Safari/i,
    "checklist must cover browser matrix (Chrome, Firefox, Safari)",
  );
  assert.match(
    checklist,
    /Yandex/i,
    "checklist must include Yandex Browser per NFR5",
  );
  // Language coverage
  for (const lang of ["EN", "RU", "PL"]) {
    assert.match(
      checklist,
      new RegExp(`\\b${lang}\\b`),
      `checklist must reference locale ${lang} in smoke test`,
    );
  }
  // Sign-off structure (some field for sign-off)
  assert.match(
    checklist,
    /sign[- ]?off|signed\s+by|verification\s+step/i,
    "checklist must include sign-off fields",
  );
});

test("AC5: checklist references FR41 network-trace assertion and byte-stable build assertion", () => {
  const checklist = read(CHECKLIST);
  assert.match(
    checklist,
    /network[- ]trace|FR41|DevTools|third[- ]party/i,
    "checklist must reference network-trace assertion (FR41 / DevTools check)",
  );
  assert.match(
    checklist,
    /byte[- ]stable|test[- ]byte[- ]stable|make.*byte/i,
    "checklist must reference byte-stable build assertion",
  );
});

test("AC1 + lesson-2026-06-04-002: checklist must not fabricate gate-closed claims or sign-off dates", () => {
  const checklist = read(CHECKLIST);
  assert.ok(
    !FABRICATED_SIGNOFF.test(checklist),
    "checklist must not contain fabricated sign-off dates — sign-off fields must be placeholders",
  );
  assert.ok(
    !FABRICATED_EPICS_MERGED.test(checklist),
    "checklist must not claim all dev epics are merged — that claim is human-verified at launch",
  );
});

// AC3: rollback runbook
test("AC3: v1.0.0-rollback-runbook.md exists with tag deletion and redeployment steps", () => {
  const runbook = read(RUNBOOK);
  // Tag rollback
  assert.match(
    runbook,
    /git\s+tag\s+-d\s+app-v1\.0\.0|git\s+push.*--delete.*app-v/i,
    "runbook must document the app-v1.0.0 tag deletion command",
  );
  // Prior version redeployment
  assert.match(
    runbook,
    /redeploy|known[- ]good|prior.*(version|artifact)/i,
    "runbook must describe how to redeploy a prior known-good version",
  );
});

test("AC3: rollback runbook covers Zenodo DOI withdrawal", () => {
  const runbook = read(RUNBOOK);
  assert.match(
    runbook,
    /Zenodo/i,
    "runbook must address Zenodo DOI withdrawal",
  );
  assert.match(
    runbook,
    /withdraw|retract|mark.*withdrawn/i,
    "runbook must describe Zenodo withdrawal process",
  );
});

test("AC3: rollback runbook covers Internet Archive correction notice", () => {
  const runbook = read(RUNBOOK);
  assert.match(
    runbook,
    /Internet Archive|web\.archive\.org/i,
    "runbook must address Internet Archive correction",
  );
});

test("AC3: rollback runbook includes dry-run validation checklist for Story 10.3", () => {
  const runbook = read(RUNBOOK);
  assert.match(
    runbook,
    /dry[- ]run|validation|10\.3|Story\s+10[.-]3/i,
    "runbook must include dry-run validation steps or Story 10.3 reference",
  );
});

// AC4: no-enshittification baseline template
test("AC4: v1.0.0-no-enshittification-baseline.md exists with zero-analytics and CSP fields", () => {
  const baseline = read(BASELINE);
  assert.match(
    baseline,
    /zero[- ]analytics|no[- ]analytics|network[- ]trace/i,
    "baseline must include zero-analytics / network-trace snapshot field",
  );
  assert.match(
    baseline,
    /CSP|third[- ]party\s+fetch|violation[- ]count/i,
    "baseline must include zero-third-party CSP violation count field",
  );
  assert.match(
    baseline,
    /no[- ]signup|no signup/i,
    "baseline must include no-signup assertion field",
  );
});

test("AC4: baseline template includes deployed-tree SHA and LICENSES.md hash for audit schedule", () => {
  const baseline = read(BASELINE);
  assert.match(
    baseline,
    /deployed[- ]tree\s*SHA|SHA.*main\s*branch|source[- ]tree\s*SHA/i,
    "baseline must include deployed-tree SHA vs main SHA field",
  );
  assert.match(
    baseline,
    /LICENSES\.md.*sha256|sha256.*LICENSES\.md|hash.*LICENSES/i,
    "baseline must include LICENSES.md sha256 hash field",
  );
  // Audit schedule
  assert.match(
    baseline,
    /T\+6|6\s+month|six\s+month/i,
    "baseline must include T+6 month audit schedule",
  );
  assert.match(
    baseline,
    /T\+12|12\s+month|twelve\s+month/i,
    "baseline must include T+12 month audit schedule",
  );
});

test("AC4: baseline template fields are placeholders (FILL IN AT LAUNCH), not fabricated values", () => {
  const baseline = read(BASELINE);
  assert.match(
    baseline,
    /FILL\s+IN\s+AT\s+LAUNCH|\[fill|pending.*launch/i,
    "baseline must mark fill-in fields as '[FILL IN AT LAUNCH]' placeholders, not real values",
  );
  // Must not have a real SHA256 hash value (64 hex chars) as a committed baseline
  const sha256Pattern = /\b[0-9a-f]{64}\b/i;
  assert.ok(
    !sha256Pattern.test(baseline),
    "baseline template must not contain a pre-filled SHA256 hash — values are filled at launch time",
  );
});

// Cross-reference: checklist references rollback runbook (AC1/AC3 integration)
test("AC1 + AC3: checklist cross-references the rollback runbook", () => {
  const checklist = read(CHECKLIST);
  assert.match(
    checklist,
    /rollback[- ]runbook|v1\.0\.0[- ]rollback/i,
    "checklist must cross-reference the rollback runbook document",
  );
});
