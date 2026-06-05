---
id: 9c-1-ru-clinical-register-translator-recruitment-tail-scene-methodology-corpus-sign-off
title: "Story 9c-1: RU clinical-register translator recruitment + tail-scene + methodology-corpus sign-off"
status: ready-for-dev
---

# Story 9c-1: RU clinical-register translator recruitment + tail-scene + methodology-corpus sign-off

## Story

As the IQ-ME maintainer closing Risks #5 + I3 for the Russian-speaking primary audience,
I want to recruit a Russian-language clinical-register-aware translator (bilingual psychometrically-aware Russian native, ideally a working translator with a clinical/psychology background), engage them for RU tail-scene authoring + RU methodology-corpus translation review (Epic 7 Stories 7.3 + 7.6), and document their reviewer-of-record commitment,
so that Russian-speaking Mikhail-journey users receive harm-mitigation copy authored in clinical register **in Russian** (not translated from English), Risk #5 (bottom-decile distress) is mitigated, and Innovation Risk I3 (paternalistic register in Russian) is prevented by native-language authorship.

## ⚠️ HUMAN-GATED — do not fabricate

The **recruitment outreach draft + outreach log** are doable now. The **RU clinical-register copy, the reviewer-of-record identity, and the sign-off** require a real bilingual translator. A PENDING signoff stub already exists at `docs/launch-readiness/ru-translator-signoff.md` (shipped in Epic 7). **Do NOT** author RU tail-scene copy by AI translation, **do NOT** fabricate a reviewer name/handle, **do NOT** flip the signoff to closed (governing lesson: lesson-2026-06-04-002; epic spec explicitly requires native-authored, not EN-translated, copy).

## Acceptance Criteria

1. A recruitment outreach draft exists at `docs/launch-readiness/ru-translator-outreach-draft.md`: names the recruitment pools (r/cognitiveTesting Russian-speakers, psychology academic networks, Russian-language translator communities), the scope (tail-scene authoring + methodology-corpus translation review + reviewer-of-record through v1), and the paid fallback ($300–$800). No fabricated specifics — unknowns are explicit `TBD`/`pending`.
2. An outreach log exists at `docs/launch-readiness/ru-translator-outreach-log.md` with a `STATUS: PENDING` banner, an attempts table (all `pending`), and a pointer to the existing `ru-translator-signoff.md`.
3. The existing `docs/launch-readiness/ru-translator-signoff.md` stub is left **PENDING** (or, if touched, only to add a back-link to the outreach log) — its sign-off block stays `pending`; no reviewer name/handle/date is invented; `@TBD-ru-clinical-register` stays in `.github/CODEOWNERS` until a real reviewer commits.
4. **(gated on real translator)** When the translator accepts: name + handle (or verifiable-signature pseudonym) recorded; scope/compensation/availability documented; CODEOWNERS + masthead updated; RU tail-scene copy authored in clinical register, iterated against Gate-9e RU testers (≥4/5), and signed off in `ru-translator-signoff.md`.
5. A `tests/scaffold/` guard asserts: the outreach draft + log exist; the log carries `STATUS: PENDING`; no `tel:`; no fabricated "signed off" claim; the draft names the paid fallback and scope; the `ru-translator-signoff.md` stub still reads PENDING. RED before, GREEN after.
6. `make lint` exit 0, `make build` exit 0, full `make test` green.

## Tasks / Subtasks

- [x] **Task 1: author the scaffold guard** (`tests/scaffold/9c-1-ru-translator-outreach.test.mjs`) encoding AC 5; confirm RED. (test-author phase)
- [x] **Task 2: write the recruitment outreach draft** (AC 1). (impl phase)
- [x] **Task 3: write the outreach log** (AC 2) and add a back-link from `ru-translator-signoff.md` if appropriate (AC 3). (impl phase)
- [-] **Task 4 (BLOCKED — human deliverable): engage the translator, author native RU copy, obtain sign-off** (AC 4). No agent action; copy must be native-authored, not AI-translated. _(deferred: Blocked on real external RU bilingual translator; no agent action possible)_
- [-] **Task 5: verification** — guard GREEN, `make lint`/`make build`/`make test` green (AC 6). (integration phase) _(deferred: Deferred to integration phase after Task 4 unblocks; scaffold test GREEN already)_

## Dev Notes

- Doable halves: Tasks 1–3 + 5 (outreach scaffolding). Blocked half: Task 4 (native-authored RU copy + reviewer sign-off).
- Editing RU corpus bodies later triggers NFR27 parity (the RU side IS the translation; coordinate with EN source-hash discipline) — but that is the translator's authored work, not this story's doable scope.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): never fabricate trust-/harm-critical specifics; the RU copy must be native-authored, the signoff stays PENDING until a real reviewer signs.
- lesson-2026-06-03-001 (high): `pr-checks.yml` per-job wiring; `tests/scaffold/**` globbed by `make test` — verify.
- lesson-2026-05-20-007 (high): carry-forward section mandatory; new scaffold test integrity-recorded at freeze.

### Project Structure Notes

- New: `docs/launch-readiness/ru-translator-outreach-draft.md`, `…-outreach-log.md`, `tests/scaffold/9c-1-ru-translator-outreach.test.mjs`.
- Existing PENDING stub: `docs/launch-readiness/ru-translator-signoff.md` (Epic 7) — leave PENDING.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9c.1: RU clinical-register translator recruitment + tail-scene + methodology corpus sign-off]
- [Source: docs/launch-readiness/ru-translator-signoff.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Doable half complete: scaffold guard (5 tests GREEN), outreach draft, outreach log authored. Existing ru-translator-signoff.md left PENDING. Task 4 deferred pending real reviewer.

### File List

- tests/scaffold/9c-1-ru-translator-outreach.test.mjs
- docs/launch-readiness/ru-translator-outreach-draft.md
- docs/launch-readiness/ru-translator-outreach-log.md
