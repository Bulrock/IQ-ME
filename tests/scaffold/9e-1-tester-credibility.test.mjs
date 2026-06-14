// Story 9e-1 — Acceptance guard for the tester recruitment DRAFT + LOG + CREDIBILITY REPORT SCAFFOLD (AC 5).
// Epic 9e is a no-code-write stakeholder-outreach gate; the doable half ships
// docs/launch-readiness/tester-recruitment-draft.md,
// tester-recruitment-log.md, and tester-credibility-report.md.
// Actual tester verdicts are blocked on real human testers (Task 5).
//
// Governing lesson lesson-2026-06-04-002: pending/trust-critical placeholder
// content must never fabricate testers, verdicts, handles, or a passing tally.
// Risk #12 explicitly forbids shipping below the 12/15 threshold.
//
// RED until the specialist writes all three artifacts per the ACs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const DRAFT = join(REPO_ROOT, "docs", "launch-readiness", "tester-recruitment-draft.md");
const LOG = join(REPO_ROOT, "docs", "launch-readiness", "tester-recruitment-log.md");
const REPORT = join(REPO_ROOT, "docs", "launch-readiness", "tester-credibility-report.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// Fabricated passing tally: claims a real count has been reached (e.g. "12 credible", "13/15 passed").
// Must NOT trigger on threshold definitions (≥12/15, "threshold is 12/15") or on "0/15" pending entries.
// Pattern: past-tense or verb forms asserting the count was reached.
const FABRICATED_TALLY =
  /\b(1[2-5]|[2-9]\d)\s*(\/|of)\s*15\s+(credible|passed|met|verified|approved)\b|\b(1[2-5]|[2-9]\d)\s*credible\s+(out|of|\/)\s*15\b/i;

test("AC1: recruitment draft names archetype balance, privacy, no compensation, and self-paced assessment", () => {
  const draft = read(DRAFT);
  assert.match(
    draft,
    /bottom[- ]decile|top[- ]decile|skeptic/i,
    "draft must name per-language archetype-balance target (bottom-decile, top-decile, skeptic)",
  );
  assert.match(
    draft,
    /no email|no telemetry|GitHub (handle|account)/i,
    "draft must name the privacy posture (no email, no telemetry — GitHub handle only)",
  );
  assert.match(
    draft,
    /no[- ]compensation|volunteer|unpaid/i,
    "draft must state the no-compensation posture",
  );
  assert.match(
    draft,
    /self[- ]paced|no time limit/i,
    "draft must describe the assessment as self-paced or having no time limit",
  );
  assert.doesNotMatch(
    draft,
    /\b(test|assessment|session)\b[^\n]{0,80}\b\d+\s*(minute|min|hour)s?\b|\b\d+\s*(minute|min|hour)s?\b[^\n]{0,80}\b(test|assessment|session)\b/i,
    "draft must not estimate assessment completion time",
  );
});

test("AC1: recruitment draft does not fabricate specifics (no tel:, no passing tally)", () => {
  const draft = read(DRAFT);
  assert.ok(!/\btel:/i.test(draft), "draft must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_TALLY.test(draft),
    "draft must not claim a passing credibility tally",
  );
});

test("AC2: recruitment log carries STATUS: PENDING banner and names recruitment channels", () => {
  const log = read(LOG);
  assert.match(
    log,
    /STATUS:\s*PENDING/i,
    "log must carry an explicit 'STATUS: PENDING' banner",
  );
  assert.match(
    log,
    /r\/cognitiveTesting|cognitive[- ]testing|psychology forum/i,
    "log must name recruitment channels (r/cognitiveTesting + psychology forums)",
  );
});

test("AC2: recruitment log does not fabricate specifics (no tel:, no passing tally)", () => {
  const log = read(LOG);
  assert.ok(!/\btel:/i.test(log), "log must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_TALLY.test(log),
    "log must not claim a passing credibility tally",
  );
});

test("AC3: credibility-report scaffold carries STATUS: PENDING, exact threshold string, no passing tally", () => {
  const report = read(REPORT);
  assert.match(
    report,
    /STATUS:\s*PENDING/i,
    "credibility report must carry an explicit 'STATUS: PENDING' banner",
  );
  assert.match(
    report,
    /12\s*\/\s*15|12 of 15|12\/15/i,
    "credibility report must state the explicit threshold (≥12/15 overall)",
  );
  assert.match(
    report,
    /4\s*\/\s*5|4 of 5|4\/5/i,
    "credibility report must state the per-language threshold (≥4/5 per language)",
  );
  assert.ok(
    !FABRICATED_TALLY.test(report),
    "credibility report must not contain a fabricated passing tally",
  );
});

test("AC3: credibility-report scaffold does not fabricate tester handles or verdicts", () => {
  const report = read(REPORT);
  assert.ok(!/\btel:/i.test(report), "report must not contain a fabricated tel: number");
  // An EN/RU/PL tally table should exist but all cells must be 'pending' or blank
  assert.match(
    report,
    /EN|RU|PL/i,
    "report must include a per-language tally section",
  );
  assert.match(
    report,
    /pending|TBD/i,
    "report tally must contain only pending entries — no real verdicts yet",
  );
});
