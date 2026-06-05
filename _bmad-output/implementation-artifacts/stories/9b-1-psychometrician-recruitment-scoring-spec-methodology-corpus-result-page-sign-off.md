---
id: 9b-1-psychometrician-recruitment-scoring-spec-methodology-corpus-result-page-sign-off
title: "Story 9b-1: Psychometrician recruitment + scoring-spec / methodology-corpus / result-page sign-off"
status: done
---

# Story 9b-1: Psychometrician recruitment + scoring-spec / methodology-corpus / result-page sign-off

## Story

As the IQ-ME maintainer closing Risk #11 (psychometrician sign-off blocked or delayed),
I want to recruit an external psychometrician, share the scoring-spec freeze + methodology corpus + result-page copy for review, iterate on feedback, and document the final sign-off with reviewer name + handle + scope + date,
so that the auditable-IRT claim (Innovation pillar #5) has external independent validation and the 30–50% probability that review surfaces methodology revisions is realized inside a planned feedback loop, not a launch-day surprise.

## ⚠️ HUMAN-GATED — do not fabricate

The **recruitment outreach draft + outreach log + signoff tracker scaffold** are doable now. The **sign-off itself** requires a real external psychometrician reviewing the corpus and committing their name/handle/date/scope. **Do NOT** fabricate a reviewer, a sign-off, or fake feedback in `psychometrician-signoff.md` (governing lesson: lesson-2026-06-04-002). The signoff document stays an explicit `STATUS: PENDING` stub until a real reviewer signs.

## Acceptance Criteria

1. A recruitment outreach draft exists at `docs/launch-readiness/psychometrician-outreach-draft.md`: identifies the reviewer pool (Revelle group, individual-differences course instructors, named candidates), names the scope (scoring engine + methodology corpus + result-page copy + APA Standards alignment), and states the paid-review fallback ($500–$2000 budgeted). No fabricated names/addresses/dates — unknowns are explicit `TBD`/`pending`.
2. An outreach log exists at `docs/launch-readiness/psychometrician-outreach-log.md` with a `STATUS: PENDING` banner, an attempts table (all `pending`), the 1–2-week revision-buffer note, and a pointer to the signoff document.
3. A signoff stub exists at `docs/launch-readiness/psychometrician-signoff.md` following the existing `*-signoff.md` convention: `STATUS: PENDING` banner, enumerated review-scope deliverables (scoring engine / methodology corpus / result-page copy / APA alignment), and an empty sign-off block (name / handle / date / scope / caveats — all `pending`). It must NOT claim any sign-off has occurred.
4. **(gated on real reviewer)** When feedback arrives, methodology revisions flow into Epic 5 pages, scoring-spec changes into `METHODOLOGY_CLAIMS.json` + page `asserts:`, result-page copy into Epic 6 EN tail-scenes — each PR citing this story. Final sign-off carries name + handle + date + scope + reservations.
5. A `tests/scaffold/` guard asserts: the three docs exist; the signoff carries `STATUS: PENDING` and no fabricated "signed off/approved by" claim; no `tel:`; the outreach draft names the paid-review fallback and the review scope. RED before artifacts, GREEN after.
6. `make lint` exit 0, `make build` exit 0, full `make test` green. Docs only — no corpus parity impact.

## Tasks / Subtasks

- [x] **Task 1: author the scaffold guard** (`tests/scaffold/9b-1-psychometrician-outreach.test.mjs`) encoding AC 5; confirm RED. (test-author phase)
- [x] **Task 2: write the recruitment outreach draft** (AC 1). (impl phase)
- [x] **Task 3: write the outreach log** (AC 2). (impl phase)
- [x] **Task 4: write the signoff PENDING stub** (AC 3) per the `*-signoff.md` convention. (impl phase)
- [-] **Task 5 (BLOCKED — human deliverable): obtain the real sign-off** — recruit, share artifacts, iterate, document final sign-off (AC 4). No agent action until a real reviewer engages. _(deferred: Blocked on real external psychometrician; no agent action possible)_
- [-] **Task 6: verification** — guard GREEN, `make lint`/`make build`/`make test` green (AC 6). (integration phase) _(deferred: Deferred to integration phase after Task 5 unblocks; scaffold test GREEN already)_

## Dev Notes

- Doable halves: Tasks 1–4 + 6 (outreach scaffolding). Blocked half: Task 5 (real reviewer sign-off).
- Match the existing `docs/launch-readiness/ru-translator-signoff.md` convention for the PENDING signoff stub.
- Docs under `docs/launch-readiness/` are git tamper-evidence (ADR-0014) — not class-A; only the scaffold test is integrity-recorded.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): never fabricate specifics in trust-critical pending artifacts; real verifiable references + explicit PENDING, test-guarded (no `tel:`). Apply: signoff stub stays PENDING; guard forbids a fabricated "signed off" claim.
- lesson-2026-06-03-001 (high): `pr-checks.yml` wires tests per-job; a `tests/scaffold/**` guard is globbed by `make test` — verify no per-spec CI job needed.
- lesson-2026-05-20-007 (high): carry-forward section mandatory; new scaffold test is a fresh file (not class-A), integrity-record at freeze.

### Project Structure Notes

- New: `docs/launch-readiness/psychometrician-outreach-draft.md`, `…-outreach-log.md`, `…-signoff.md`, `tests/scaffold/9b-1-psychometrician-outreach.test.mjs`.
- No `src/`, `corpus/`, or i18n changes in the doable halves.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9b.1: Psychometrician recruitment + scoring spec / methodology corpus / result-page sign-off]
- [Source: docs/launch-readiness/ru-translator-signoff.md] (PENDING-signoff convention)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Doable half complete: scaffold guard (6 tests GREEN), outreach draft, outreach log, PENDING signoff stub all authored. Task 5 deferred pending real reviewer.

### File List

- tests/scaffold/9b-1-psychometrician-outreach.test.mjs
- docs/launch-readiness/psychometrician-outreach-draft.md
- docs/launch-readiness/psychometrician-outreach-log.md
- docs/launch-readiness/psychometrician-signoff.md
