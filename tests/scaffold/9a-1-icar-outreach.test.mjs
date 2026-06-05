// Story 9a-1 — Acceptance guard for the ICAR/SAPA outreach DRAFT + LOG
// (AC 1–4). Epic 9a is a no-code-write stakeholder-outreach gate epic; this
// story ships only the outreach drafting + tracking log under
// docs/launch-readiness/. The actual confirmation arrival is Story 9a-2.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks (no markdown parser) — treat the docs as text.
// RED until the specialist writes both artifacts per the ACs.
//
// Governing lesson lesson-2026-06-04-002: pending/trust-critical placeholder
// content must never fabricate specifics — so this guard forbids a fabricated
// "confirmation received/granted" claim and any tel: number, and requires the
// real CC BY-NC-SA basis + an explicit PENDING status + the documented fallback.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const DRAFT = join(REPO_ROOT, "docs", "launch-readiness", "icar-outreach-draft.md");
const LOG = join(REPO_ROOT, "docs", "launch-readiness", "icar-outreach-log.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// A "confirmation received" claim would be a fabrication — the gate is still
// open. Match present/past-tense assertions that the license has been granted.
const FABRICATED_CONFIRMATION =
  /\b(confirmation (has been |was )?(received|granted|obtained)|license (has been |was )?(granted|confirmed)|permission (has been |was )?granted)\b/i;

test("AC1: outreach draft exists and references the CC BY-NC-SA basis + the ICAR-CONFIRMATION.pdf slot", () => {
  const draft = read(DRAFT);
  assert.match(
    draft,
    /CC[ -]BY[ -]NC[ -]SA/i,
    "draft must reference the published CC BY-NC-SA license basis",
  );
  assert.match(
    draft,
    /ICAR[- ]CONFIRMATION\.pdf/i,
    "draft must state where the response will be committed (ICAR-CONFIRMATION.pdf slot)",
  );
  assert.match(
    draft,
    /matrix[- ]reasoning|ICAR/i,
    "draft must name the ICAR Matrix Reasoning item pool / ICAR project",
  );
});

test("AC2: outreach draft does not fabricate a confirmation or a tel: number", () => {
  const draft = read(DRAFT);
  assert.ok(
    !FABRICATED_CONFIRMATION.test(draft),
    "draft must not claim confirmation has been received/granted — the gate is still open",
  );
  assert.ok(!/\btel:/i.test(draft), "draft must not contain a fabricated tel: number");
});

test("AC3: outreach log carries a PENDING banner, names the OpenPsychometrics fallback, and points to Story 9a-2", () => {
  const log = read(LOG);
  assert.match(
    log,
    /STATUS:\s*PENDING/i,
    "log must carry an explicit 'STATUS: PENDING' banner",
  );
  assert.match(
    log,
    /OpenPsychometrics/i,
    "log must name the OpenPsychometrics-licensed subset fallback",
  );
  assert.match(log, /9a-2/i, "log must point to Story 9a-2 for arrival/reconciliation");
});

test("AC2/AC3: log does not fabricate a confirmation or a tel: number", () => {
  const log = read(LOG);
  assert.ok(
    !FABRICATED_CONFIRMATION.test(log),
    "log must not claim confirmation has been received/granted while the gate is open",
  );
  assert.ok(!/\btel:/i.test(log), "log must not contain a fabricated tel: number");
});
