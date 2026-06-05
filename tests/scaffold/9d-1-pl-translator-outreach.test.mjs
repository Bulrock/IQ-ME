// Story 9d-1 — Acceptance guard for the PL translator outreach DRAFT + LOG (AC 5).
// Epic 9d is a no-code-write stakeholder-outreach gate; the doable half ships
// docs/launch-readiness/pl-translator-outreach-draft.md and
// pl-translator-outreach-log.md. The existing pl-translator-signoff.md (Epic 7)
// is left PENDING; @TBD-pl-reviewer stays in .github/CODEOWNERS.
//
// Governing lesson lesson-2026-06-04-002: pending/trust-critical placeholder
// content must never fabricate specifics — guard forbids a fabricated
// "signed off / approved by" claim, any tel: number, requires explicit
// PENDING status, the paid fallback, the review scope, and the
// independent-failure-isolation note in the log.
//
// RED until the specialist writes both artifacts per the ACs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const DRAFT = join(REPO_ROOT, "docs", "launch-readiness", "pl-translator-outreach-draft.md");
const LOG = join(REPO_ROOT, "docs", "launch-readiness", "pl-translator-outreach-log.md");
const SIGNOFF = join(REPO_ROOT, "docs", "launch-readiness", "pl-translator-signoff.md");
const CODEOWNERS = join(REPO_ROOT, ".github", "CODEOWNERS");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// Affirmative sign-off claims only — must NOT trigger on "not yet signed off"
const FABRICATED_SIGNOFF =
  /(?<!not yet )(^|[^-\w])(signed off by|approved by|sign[- ]off (has been |was )?(completed|received|granted)|reviewer[- ]of[- ]record:\s*(?!_pending_|\*pending\*|TBD))/im;

test("AC1: PL outreach draft exists, names recruitment pools and scope, states paid fallback", () => {
  const draft = read(DRAFT);
  assert.match(
    draft,
    /Polish psychology|Wykop|Polish[- ]philology|Polish.*translator|translator.*Polish/i,
    "draft must name PL recruitment pools (Polish psychology networks, Wykop, philology/translator networks)",
  );
  assert.match(
    draft,
    /tail[- ]scene|methodology[- ]corpus|translation review/i,
    "draft must name the review scope (tail-scene authoring + methodology-corpus translation review)",
  );
  assert.match(
    draft,
    /reviewer[- ]of[- ]record|reviewer of record/i,
    "draft must name the reviewer-of-record commitment through v1",
  );
  assert.match(
    draft,
    /\$300|\$\s*300|300[^\d].*800|\$800|paid[- ](review|fallback)|paid (review|fallback)/i,
    "draft must state the paid fallback ($300–$800)",
  );
});

test("AC1: PL outreach draft does not fabricate specifics (no tel:, no signed-off claim)", () => {
  const draft = read(DRAFT);
  assert.ok(!/\btel:/i.test(draft), "draft must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_SIGNOFF.test(draft),
    "draft must not claim a sign-off has been received",
  );
});

test("AC2: PL outreach log carries STATUS: PENDING and independent-isolation note", () => {
  const log = read(LOG);
  assert.match(
    log,
    /STATUS:\s*PENDING/i,
    "log must carry an explicit 'STATUS: PENDING' banner",
  );
  assert.match(
    log,
    /independen|isolation|separate.*RU|RU.*separate/i,
    "log must carry the independent-failure-isolation note (PL and RU gates are deliberately separate)",
  );
  assert.match(
    log,
    /9d-2|pl[- ]translator[- ]signoff\.md/i,
    "log must point to Story 9d-2 and/or the pl-translator-signoff.md",
  );
});

test("AC2: PL outreach log does not fabricate specifics (no tel:, no signed-off claim)", () => {
  const log = read(LOG);
  assert.ok(!/\btel:/i.test(log), "log must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_SIGNOFF.test(log),
    "log must not claim a sign-off has been received",
  );
});

test("AC3: existing pl-translator-signoff.md still reads PENDING and CODEOWNERS has @TBD-pl-reviewer", () => {
  const signoff = read(SIGNOFF);
  assert.match(
    signoff,
    /STATUS:\s*PENDING/i,
    "pl-translator-signoff.md must still carry STATUS: PENDING",
  );
  assert.ok(
    !FABRICATED_SIGNOFF.test(signoff),
    "pl-translator-signoff.md must not contain a fabricated sign-off",
  );
  const codeowners = read(CODEOWNERS);
  assert.match(
    codeowners,
    /@TBD-pl-reviewer/,
    "CODEOWNERS must still contain @TBD-pl-reviewer (must not be replaced before Gate 9d-2 closes)",
  );
});
