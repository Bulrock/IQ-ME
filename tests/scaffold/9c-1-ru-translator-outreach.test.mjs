// Story 9c-1 — Acceptance guard for the RU translator outreach DRAFT + LOG (AC 5).
// Epic 9c is a no-code-write stakeholder-outreach gate; the doable half ships
// docs/launch-readiness/ru-translator-outreach-draft.md and
// ru-translator-outreach-log.md. The existing ru-translator-signoff.md (Epic 7)
// is left PENDING.
//
// Governing lesson lesson-2026-06-04-002: pending/trust-critical placeholder
// content must never fabricate specifics — guard forbids a fabricated
// "signed off / approved by" claim, any tel: number, requires explicit
// PENDING status, the paid fallback, and the review scope in the draft.
// Specifically: RU copy must NOT be AI-translated; no fabricated reviewer name.
//
// RED until the specialist writes both artifacts per the ACs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const DRAFT = join(REPO_ROOT, "docs", "launch-readiness", "ru-translator-outreach-draft.md");
const LOG = join(REPO_ROOT, "docs", "launch-readiness", "ru-translator-outreach-log.md");
const SIGNOFF = join(REPO_ROOT, "docs", "launch-readiness", "ru-translator-signoff.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// Affirmative sign-off claims only — must NOT trigger on "not yet signed off"
const FABRICATED_SIGNOFF =
  /(?<!not yet )(^|[^-\w])(signed off by|approved by|sign[- ]off (has been |was )?(completed|received|granted)|reviewer[- ]of[- ]record:\s*(?!_pending_|\*pending\*|TBD))/im;

test("AC1: RU outreach draft exists, names recruitment pools and scope, states paid fallback", () => {
  const draft = read(DRAFT);
  assert.match(
    draft,
    /r\/cognitiveTesting|psychology.*Russian|Russian.*psychology|Russian.*translator|translator.*Russian/i,
    "draft must name a RU-speaker recruitment pool (r/cognitiveTesting Russian-speakers, psychology networks, etc.)",
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

test("AC1: RU outreach draft does not fabricate specifics (no tel:, no signed-off claim)", () => {
  const draft = read(DRAFT);
  assert.ok(!/\btel:/i.test(draft), "draft must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_SIGNOFF.test(draft),
    "draft must not claim a sign-off has been received",
  );
});

test("AC2: RU outreach log carries STATUS: PENDING banner and points to ru-translator-signoff.md", () => {
  const log = read(LOG);
  assert.match(
    log,
    /STATUS:\s*PENDING/i,
    "log must carry an explicit 'STATUS: PENDING' banner",
  );
  assert.match(
    log,
    /ru[- ]translator[- ]signoff\.md/i,
    "log must point to the existing ru-translator-signoff.md document",
  );
});

test("AC2: RU outreach log does not fabricate specifics (no tel:, no signed-off claim)", () => {
  const log = read(LOG);
  assert.ok(!/\btel:/i.test(log), "log must not contain a fabricated tel: number");
  assert.ok(
    !FABRICATED_SIGNOFF.test(log),
    "log must not claim a sign-off has been received",
  );
});

test("AC3: existing ru-translator-signoff.md still reads PENDING (not flipped to closed)", () => {
  const signoff = read(SIGNOFF);
  assert.match(
    signoff,
    /STATUS:\s*PENDING/i,
    "ru-translator-signoff.md must still carry STATUS: PENDING — must not be flipped closed",
  );
  assert.match(
    signoff,
    /TBD-ru|@TBD/i,
    "CODEOWNERS handle must still be @TBD-ru-clinical-register (not replaced with a real handle)",
  );
  assert.ok(
    !FABRICATED_SIGNOFF.test(signoff),
    "ru-translator-signoff.md must not contain a fabricated sign-off",
  );
});
