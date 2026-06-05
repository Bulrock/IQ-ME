---
id: 9d-2-pl-clinical-register-sign-off-codeowners-finalization-masthead-reviewer-fields
title: "Story 9d-2: PL clinical-register sign-off + CODEOWNERS finalization + masthead reviewer fields"
status: tests-approved
---

# Story 9d-2: PL clinical-register sign-off + CODEOWNERS finalization + masthead reviewer fields

## Story

As the IQ-ME maintainer closing Story 9d-1's recruitment loop,
I want the PL clinical-register translator to complete their work (tail-scene copy + methodology translation + reviewer-of-record commitment), and the artifacts (CODEOWNERS update + masthead reviewer-fields + finalized sign-off) to commit to main,
so that the PL gate visibly closes (separately from the RU gate, per Mary's accountability-surface argument) and the v1.0.0 launch-readiness checklist sees a green PL gate.

## ⚠️ HUMAN-GATED — do not fabricate

**This story cannot be completed by a coding agent.** Its inputs are a **real reviewer's finished work and identity**: native-authored PL copy, a real name + GitHub handle, and a real sign-off. **Do NOT** fabricate the reviewer, **do NOT** replace `@TBD-pl-reviewer` in `.github/CODEOWNERS` with an invented handle, **do NOT** populate masthead `reviewer:`/`reviewerHandle:` fields with fake data, and **do NOT** flip the PL gate to closed (governing lesson: lesson-2026-06-04-002). This story executes **only when the real reviewer has delivered and signed**.

## Acceptance Criteria

1. **(gated on real reviewer)** When the work completes, `docs/launch-readiness/pl-translator-signoff.md` is finalized with the reviewer's name + handle + date + scope + the enumerated belt-and-suspenders deliverables (tail-scenes + silent-companion-line + locale-switch-blocker-hint + crisis-resources + retest-effect copy).
2. **(gated)** `.github/CODEOWNERS` replaces `@TBD-pl-reviewer` with the actual reviewer handle.
3. **(gated)** The masthead component (Epic 4 Story 4.6) renders the named reviewer on every PL methodology page (`reviewer:` + `reviewerHandle:` frontmatter populated, NFR27 parity preserved).
4. **(gated)** The PL gate visibly transitions from "open" to "closed" in the Epic 10 readiness dashboard / checklist, and the close is recorded in `CHANGELOG.md`.
5. A `tests/scaffold/` guard (authored at execution time) asserts: once finalized, `pl-translator-signoff.md` no longer reads PENDING, CODEOWNERS contains no `@TBD-pl-reviewer`, and PL masthead frontmatter has non-placeholder reviewer fields. Until then the gate-closed assertions stay RED (and the story stays blocked).
6. `make lint` exit 0, `make build` exit 0, full `make test` green; NFR27 parity holds for any masthead/frontmatter edit.

## Tasks / Subtasks

- [ ] **Task 1 (BLOCKED — human deliverable): receive finished PL copy + reviewer identity + sign-off** from Story 9d-1's engagement. No agent action until this exists.
- [x] **Task 2: author the gate-closed guard** (`tests/scaffold/9d-2-pl-gate-closed.test.mjs`) encoding AC 5; confirm it is RED while the gate is open. (test-author phase — executable once the reviewer delivers)
- [ ] **Task 3: finalize the signoff** with real name/handle/date/scope/deliverables (AC 1). (impl phase)
- [ ] **Task 4: finalize CODEOWNERS + masthead** — replace `@TBD-pl-reviewer`, populate masthead reviewer fields on PL pages (AC 2, AC 3). (impl phase)
- [ ] **Task 5: gate close-out** — flip the Epic 10 dashboard PL gate to closed, add `CHANGELOG.md` entry (AC 4). (impl phase)
- [ ] **Task 6: verification** — guard GREEN, `make lint`/`make build`/`make test` green, NFR27 parity (AC 6). (integration phase)

## Dev Notes

- **Fully blocked** until Story 9d-1's real reviewer delivers — there is no doable precursor half here (9d-1 owns the outreach scaffolding). Do not author any scaffolding that implies the gate is progressing.
- CODEOWNERS + branch-protection are governance artifacts (Epic 7 Story 7.8); the handle replacement must be a real, verifiable GitHub account.
- Masthead frontmatter edits trigger NFR27 corpus parity discipline.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): never fabricate reviewer identity, handle, or sign-off; keep `@TBD-pl-reviewer` and PENDING until a real reviewer commits.
- lesson-2026-06-03-001 (high): `pr-checks.yml` per-job wiring; verify `tests/scaffold/**` glob coverage for the gate-closed guard.
- lesson-2026-05-20-007 (high): carry-forward mandatory; editing existing frozen masthead/CODEOWNERS guards requires `tds story unfreeze-tests` via the owning story + re-record.

### Project Structure Notes

- Touches (on execution): `docs/launch-readiness/pl-translator-signoff.md`, `.github/CODEOWNERS`, PL methodology page frontmatter (masthead reviewer fields), `CHANGELOG.md`, Epic-10 readiness checklist, `tests/scaffold/9d-2-pl-gate-closed.test.mjs`.
- Depends on Story 9d-1 (recruitment + engagement).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9d.2: PL clinical-register sign-off + CODEOWNERS finalization + masthead reviewer fields]
- [Source: docs/launch-readiness/pl-translator-signoff.md] / [Source: docs/branch-protection-config.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Task 2 done: guard RED 6/6 against current state — fails on PENDING signoff, missing reviewer name/handle/date, @TBD-pl-reviewer in CODEOWNERS, and 35 PL methodology pages with TBD reviewer fields. Will flip green when real reviewer delivers and Story 9d-2 impl runs.

### File List

- tests/scaffold/9d-2-pl-gate-closed.test.mjs
