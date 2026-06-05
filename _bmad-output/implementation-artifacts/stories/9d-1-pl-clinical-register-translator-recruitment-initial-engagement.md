---
id: 9d-1-pl-clinical-register-translator-recruitment-initial-engagement
title: "Story 9d-1: PL clinical-register translator recruitment + initial engagement"
status: ready-for-dev
---

# Story 9d-1: PL clinical-register translator recruitment + initial engagement

## Story

As the IQ-ME maintainer closing Risks #5 + I7 for the Polish-speaking primary audience,
I want to recruit a Polish-language clinical-register-aware translator (independent of the RU translator, per Mary's independent-failure-isolation argument), engage them for PL tail-scene authoring + PL methodology-corpus translation review (Epic 7 Stories 7.4 + 7.6), and document their reviewer-of-record commitment,
so that Polish-speaking users receive harm-mitigation copy authored in clinical register **in Polish** (not translated from English), Risk #5 holds for PL, and Innovation Risk I7 (translation drift) is mitigated by an independent per-language reviewer.

## ⚠️ HUMAN-GATED — do not fabricate

The **recruitment outreach draft + outreach log** are doable now. The **PL clinical-register copy, reviewer identity, acceptance, and CODEOWNERS/masthead update** require a real bilingual translator. A PENDING signoff stub already exists at `docs/launch-readiness/pl-translator-signoff.md` (Epic 7). **Do NOT** AI-translate PL copy, fabricate a reviewer, or replace `@TBD-pl-reviewer` in CODEOWNERS (governing lesson: lesson-2026-06-04-002). Sign-off + CODEOWNERS finalization is Story 9d-2 and stays blocked until a real reviewer commits.

## Acceptance Criteria

1. A recruitment outreach draft exists at `docs/launch-readiness/pl-translator-outreach-draft.md`: names the recruitment pools (Polish psychology academic networks, Wykop / Polish-language Reddit, Polish-philology translator networks), the scope (same as Gate 9c — tail-scene authoring + methodology-corpus translation review + reviewer-of-record through v1), and the paid fallback ($300–$800). No fabricated specifics — unknowns are explicit `TBD`/`pending`.
2. An outreach log exists at `docs/launch-readiness/pl-translator-outreach-log.md` with a `STATUS: PENDING` banner, an attempts table (all `pending`), an explicit note on the independent-failure-isolation property (PL may close before/after RU), and a pointer to Story 9d-2 + the existing `pl-translator-signoff.md`.
3. The existing `docs/launch-readiness/pl-translator-signoff.md` stub stays **PENDING**; `@TBD-pl-reviewer` stays in `.github/CODEOWNERS`; no reviewer identity invented.
4. **(gated on real translator)** When the translator accepts: name + handle recorded; scope/compensation/availability documented; the `[data-translation-status="in-progress"]` flag remains set on PL pages until copy lands. Finalization (CODEOWNERS replace + masthead reviewer-fields + sign-off) is Story 9d-2.
5. A `tests/scaffold/` guard asserts: the outreach draft + log exist; the log carries `STATUS: PENDING` and the independent-isolation note; no `tel:`; no fabricated "signed off" claim; the draft names the paid fallback and scope; `pl-translator-signoff.md` still reads PENDING and `@TBD-pl-reviewer` still present in CODEOWNERS. RED before, GREEN after.
6. `make lint` exit 0, `make build` exit 0, full `make test` green.

## Tasks / Subtasks

- [ ] **Task 1: author the scaffold guard** (`tests/scaffold/9d-1-pl-translator-outreach.test.mjs`) encoding AC 5; confirm RED. (test-author phase)
- [ ] **Task 2: write the recruitment outreach draft** (AC 1). (impl phase)
- [ ] **Task 3: write the outreach log** (AC 2), back-link from `pl-translator-signoff.md` if appropriate (AC 3). (impl phase)
- [ ] **Task 4 (BLOCKED — human deliverable): engage the translator** (AC 4). No agent action; finalization is Story 9d-2.
- [ ] **Task 5: verification** — guard GREEN, `make lint`/`make build`/`make test` green (AC 6). (integration phase)

## Dev Notes

- Doable halves: Tasks 1–3 + 5 (outreach scaffolding). Blocked half: Task 4 (real translator engagement).
- Independent-failure-isolation: PL and RU gates are deliberately separate; do not couple their status.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): never fabricate; PL copy native-authored, signoff + CODEOWNERS stay PENDING/TBD until real reviewer.
- lesson-2026-06-03-001 (high): `pr-checks.yml` per-job wiring; verify `tests/scaffold/**` glob coverage.
- lesson-2026-05-20-007 (high): carry-forward mandatory; new scaffold test integrity-recorded at freeze.

### Project Structure Notes

- New: `docs/launch-readiness/pl-translator-outreach-draft.md`, `…-outreach-log.md`, `tests/scaffold/9d-1-pl-translator-outreach.test.mjs`.
- Existing PENDING stub: `docs/launch-readiness/pl-translator-signoff.md` (Epic 7) — leave PENDING.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9d.1: PL clinical-register translator recruitment + initial engagement]
- [Source: docs/launch-readiness/pl-translator-signoff.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
