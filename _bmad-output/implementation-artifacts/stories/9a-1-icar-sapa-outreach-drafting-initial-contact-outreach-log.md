---
id: 9a-1-icar-sapa-outreach-drafting-initial-contact-outreach-log
title: "Story 9a-1: ICAR/SAPA outreach drafting — initial contact + outreach log"
status: review
---

# Story 9a-1: ICAR/SAPA outreach drafting — initial contact + outreach log

## Story

As the IQ-ME maintainer preparing pre-launch gate #1 (ICAR license confirmation — Risk #1, existential),
I want a drafted initial-contact message to the ICAR/SAPA project (William Revelle's group, Northwestern) plus a tracking outreach log committed under `docs/launch-readiness/`,
so that the outreach that closes Gate 9a can be sent and audited with a paper trail, without fabricating a confirmation that has not yet arrived.

## Epic context

Epic 9a is a **stakeholder-outreach gate epic — no code-write of product surfaces**. Its deliverables live under `docs/launch-readiness/`. The eventual gate artifact is `ICAR-CONFIRMATION.pdf` at repo root (the visible-fallback slot already shipped in Epic 1 / FR45). **This story (9a-1) covers only the outreach DRAFTING + LOG** — the actual confirmation arrival, `LICENSES.md` reconciliation, and slot fulfillment are Story 9a-2 and are gated on a real external response that does not yet exist.

## Acceptance Criteria

1. A drafted initial-contact outreach message exists at `docs/launch-readiness/icar-outreach-draft.md`. It requests written confirmation that public free-self-assessment redistribution of the ICAR Matrix Reasoning item pool is permitted under the published CC BY-NC-SA terms, and asks the respondent to note any constraints. It references the real, verifiable basis (the ICAR project / `International Cognitive Ability Resource`, the published CC BY-NC-SA license) and states where the response will be committed (`ICAR-CONFIRMATION.pdf` slot).
2. The draft does **not** fabricate respondent names, email addresses, phone numbers, dates, or any claim that confirmation has been received. Any not-yet-known specific (e.g., exact recipient address, send date) is an explicit `TBD`/`pending` placeholder — mirroring the existing `docs/launch-readiness/*-signoff.md` stub convention.
3. An outreach log exists at `docs/launch-readiness/icar-outreach-log.md` with a clear `STATUS: PENDING` banner, an attempts table (date / channel / recipient / outcome — all `pending` until a real send happens), the documented fallback (launch with the explicitly-public OpenPsychometrics-licensed subset, smaller item pool, also documented in the methodology corpus), and a pointer to Story 9a-2 for arrival/reconciliation.
4. A `tests/scaffold/` guard asserts: both artifacts exist; the log carries the `STATUS: PENDING` marker; neither artifact contains a `tel:` number or a fabricated "confirmation received/granted" claim; the draft references the CC BY-NC-SA basis and the `ICAR-CONFIRMATION.pdf` slot; the fallback (OpenPsychometrics subset) is named in the log. The guard is RED before the artifacts exist and GREEN after.
5. `make lint` exit 0 and `make build` exit 0 — no regression. These are docs under `docs/launch-readiness/` (not corpus pages), so golden snapshots and byte-stable hashes are unaffected.

## Tasks / Subtasks

- [x] **Task 1: author the scaffold guard** (`tests/scaffold/9a-1-icar-outreach.test.mjs`) encoding AC 4 — existence of both artifacts, PENDING marker, no `tel:`, no fabricated-confirmation phrase, CC BY-NC-SA + slot reference in the draft, OpenPsychometrics fallback named in the log; confirm it fails against the current tree. (test-author phase)
- [x] **Task 2: write the outreach draft** (`docs/launch-readiness/icar-outreach-draft.md`) satisfying AC 1 + AC 2 — real verifiable basis, TBD placeholders for unknown specifics, no fabricated confirmation. (impl phase)
- [x] **Task 3: write the outreach log** (`docs/launch-readiness/icar-outreach-log.md`) satisfying AC 3 — PENDING banner, attempts table (all pending), OpenPsychometrics fallback, pointer to Story 9a-2. (impl phase)
- [x] **Task 4: verification** — guard GREEN, `make lint` exit 0, `make build` exit 0, full suite passes; confirm no product/corpus surface touched. (integration phase)

## Dev Notes

- This is a **no-code-write gate story**: deliverables are Markdown docs + a structural guard. There is no product/runtime code, no corpus page, no i18n surface to modify.
- Match the existing pending-artifact convention in `docs/launch-readiness/ru-translator-signoff.md` / `pl-translator-signoff.md`: explicit `STATUS: PENDING` banner, `TBD`/`pending` for unknowns, enumerated next-steps for when the gate closes.
- FR45 slot is already shipped: `ICAR-CONFIRMATION.pdf` at repo root is a visible-fallback placeholder. Do **not** modify it here — arrival/replacement is Story 9a-2.
- Fallback of record (from epics.md Epic 9a): launch with the explicitly-public OpenPsychometrics-licensed subset if ICAR confirmation never lands.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): harm-/trust-critical placeholder content must never fabricate specifics — ship real verifiable references + an explicit pending marker, test-guarded against fabricated specifics (no `tel:`). Apply: the outreach draft/log must reference the real CC BY-NC-SA basis and an explicit PENDING status; the guard (Task 1) forbids a fabricated "confirmation received" claim and any `tel:` number.
- lesson-2026-06-03-001 (high): `pr-checks.yml` wires tests per-job, not via a greedy glob. Apply (verify, likely non-applicable): a `tests/scaffold/**` guard is globbed directly by `make test`; confirm no per-spec CI job is needed (grep the filename in `.github/workflows/pr-checks.yml` if in doubt).
- lesson-2026-05-20-007 (high): every story spec must carry this section; stories touching a class-A frozen test must re-register integrity. Apply: the new scaffold guard is a fresh test file (not a class-A artefact_class surface), integrity-record it as test-author at freeze; no existing frozen test is modified.

### Project Structure Notes

- New docs: `docs/launch-readiness/icar-outreach-draft.md`, `docs/launch-readiness/icar-outreach-log.md`.
- New test: `tests/scaffold/9a-1-icar-outreach.test.mjs`.
- No changes to `src/`, `corpus/`, `tests/golden/`, `tests/snapshots/`, or `ICAR-CONFIRMATION.pdf`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 9a: ICAR License Confirmation (Gate)]
- [Source: docs/launch-readiness/ru-translator-signoff.md] (pending-artifact convention)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR45 artifact slot, Risk #1)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- No-code-write gate story: ICAR outreach draft + log under docs/launch-readiness/ + scaffold guard. lint 0, build 0, test 0. Reworded to satisfy frozen no-fabrication guard. Arrival/reconciliation deferred to 9a-2.

### File List

- tests/scaffold/9a-1-icar-outreach.test.mjs
- docs/launch-readiness/icar-outreach-draft.md
- docs/launch-readiness/icar-outreach-log.md

## Specialist Self-Review

**Decisions made:**
- Treated Epic 9a as a no-code-write stakeholder-outreach gate: deliverables are two Markdown artifacts under `docs/launch-readiness/` (outreach draft + tracking log) plus a structural scaffold guard. No product/runtime/corpus surface touched.
- Followed the existing pending-artifact convention (`docs/launch-readiness/*-signoff.md`): explicit STATUS banner, `TBD`/`pending` for every unknown specific, no fabricated names/addresses/dates.
- Scoped strictly to drafting + logging; arrival, `LICENSES.md` reconciliation, and `ICAR-CONFIRMATION.pdf` slot fulfillment are explicitly deferred to Story 9a-2 (the human-gated half).

**Alternatives considered:**
- Inventing a concrete recipient email for William Revelle / the ICAR project: rejected per lesson-2026-06-04-002 — fabricating contact specifics in a trust-critical pending artifact. Used `TBD / pending` and pointed to the project's published contact channel instead.
- Full TEA clean-context ATDD/test-review subagent pair: judged disproportionate for a 4-assertion structural doc-existence guard with no hidden implementation to over-fit; authored + reviewed the frozen guard in-phase.

**Framework gotchas avoided:**
- The frozen guard's `FABRICATED_CONFIRMATION` regex matches the literal substring "confirmation … received/granted" regardless of negation, so honest pending phrasing like "no confirmation has been received" tripped it. Reworded the docs to "no reply has arrived" — satisfies both the letter and intent of the frozen test without unfreezing it (correct TDS direction: adapt impl to frozen tests).
- `tds integrity record` rejects `docs/**` (CLASS_NOT_ALLOWED, ADR-0014) — production source is git-tamper-evidence, not class-A. Only the test file is integrity-recorded.

**Areas of uncertainty:**
- The exact ICAR project contact channel/address is intentionally left `TBD` — it must be confirmed from the project's published contact page at actual send time, not guessed here.

**Tested edge cases:**
- AC1 (CC BY-NC-SA + ICAR-CONFIRMATION.pdf slot + ICAR-MR named in draft), AC2 (no fabricated confirmation, no `tel:`), AC3 (PENDING banner + OpenPsychometrics fallback + 9a-2 pointer in log), AC2/AC3 (same no-fabrication checks on the log) — all RED before impl, GREEN after. `make lint` 0, `make build` 0, full `make test` 0.
