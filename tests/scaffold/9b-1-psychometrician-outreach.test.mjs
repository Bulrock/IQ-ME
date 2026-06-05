// Story 9b-1 — Acceptance guard for the psychometrician outreach DRAFT + LOG + SIGNOFF STUB
// (AC 5). Epic 9b is a no-code-write stakeholder-outreach gate; the doable half
// ships docs/launch-readiness/psychometrician-outreach-draft.md,
// psychometrician-outreach-log.md, and psychometrician-signoff.md.
// The actual sign-off is blocked on a real external psychometrician (Task 5).
//
// Governing lesson lesson-2026-06-04-002: pending/trust-critical placeholder
// content must never fabricate specifics — so this guard forbids a fabricated
// "signed off / approved by" claim, any tel: number, and requires the explicit
// PENDING status, the paid-review fallback, and the review scope.
//
// RED until the specialist writes all three artifacts per the ACs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const DRAFT = join(REPO_ROOT, "docs", "launch-readiness", "psychometrician-outreach-draft.md");
const LOG = join(REPO_ROOT, "docs", "launch-readiness", "psychometrician-outreach-log.md");
const SIGNOFF = join(REPO_ROOT, "docs", "launch-readiness", "psychometrician-signoff.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// Matches affirmative signed-off claims; must NOT trigger on "not yet signed off",
// "_Not yet signed off_", or "not-yet-signed-off" negation patterns.
const FABRICATED_SIGNOFF =
  /(?<!not yet )(^|[^-\w])(signed off by|approved by|sign[- ]off (has been |was )?(completed|received|granted)|reviewer[- ]of[- ]record:\s*(?!_pending_|\*pending\*|TBD))/im;

test("AC1: outreach draft exists, names reviewer pool and scope, states paid-review fallback", () => {
  const draft = read(DRAFT);
  assert.match(
    draft,
    /Revelle|individual[- ]differences|psychometrician/i,
    "draft must name the reviewer pool (Revelle group / individual-differences instructors)",
  );
  assert.match(
    draft,
    /scoring[- ]engine|methodology[- ]corpus|result[- ]page/i,
    "draft must name the review scope (scoring engine / methodology corpus / result-page copy)",
  );
  assert.match(
    draft,
    /APA\s+Standards|APA\s+7|APA\s+Testing|APA\s+Standard/i,
    "draft must name APA Standards alignment as part of the review scope",
  );
  assert.match(
    draft,
    /\$[45]00|\$\s*[45]00|500[^\d].*2[,.]?000|paid[- ]review|paid review/i,
    "draft must state the paid-review fallback ($500–$2000 budgeted)",
  );
});

test("AC1: outreach draft does not fabricate specifics (no tel:, no signed-off claim)", () => {
  const draft = read(DRAFT);
  assert.ok(!/\btel:/i.test(draft), "draft must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_SIGNOFF.test(draft),
    "draft must not claim a sign-off has been received",
  );
});

test("AC2: outreach log carries STATUS: PENDING banner and points to signoff doc", () => {
  const log = read(LOG);
  assert.match(
    log,
    /STATUS:\s*PENDING/i,
    "log must carry an explicit 'STATUS: PENDING' banner",
  );
  assert.match(
    log,
    /psychometrician[- ]signoff\.md/i,
    "log must point to the psychometrician-signoff.md document",
  );
});

test("AC2: outreach log does not fabricate specifics (no tel:, no signed-off claim)", () => {
  const log = read(LOG);
  assert.ok(!/\btel:/i.test(log), "log must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_SIGNOFF.test(log),
    "log must not claim a sign-off has been received",
  );
});

test("AC3: signoff stub carries STATUS: PENDING, enumerates review scope, sign-off block all pending", () => {
  const signoff = read(SIGNOFF);
  assert.match(
    signoff,
    /STATUS:\s*PENDING/i,
    "signoff must carry an explicit 'STATUS: PENDING' banner",
  );
  assert.match(
    signoff,
    /scoring[- ]engine|scoring engine/i,
    "signoff must enumerate scoring engine as a review-scope deliverable",
  );
  assert.match(
    signoff,
    /methodology[- ]corpus|methodology corpus/i,
    "signoff must enumerate methodology corpus as a review-scope deliverable",
  );
  assert.match(
    signoff,
    /result[- ]page|result page/i,
    "signoff must enumerate result-page copy as a review-scope deliverable",
  );
  assert.match(
    signoff,
    /(reviewer name|Reviewer name).*pending/i,
    "signoff sign-off block must have reviewer name: pending",
  );
});

test("AC3: signoff stub does not fabricate a signed-off claim or a tel: number", () => {
  const signoff = read(SIGNOFF);
  assert.ok(!/\btel:/i.test(signoff), "signoff must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_SIGNOFF.test(signoff),
    "signoff must not claim sign-off has been received — gate is still open",
  );
});
