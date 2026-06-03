---
id: 7-6-ru-pl-tail-scene-clinical-register-copy-replaces-epic-6-placeholders
title: "Story 7.6: RU + PL tail-scene clinical-register copy (replaces Epic 6 placeholders)"
status: ready-for-dev
---

# Story 7.6: RU + PL tail-scene clinical-register copy (replaces Epic 6 placeholders)

## Story

As a **Russian- or Polish-speaking test-taker reaching a bottom-decile or top-decile result**,
I want **the tail-scene copy authored in clinical register IN MY LANGUAGE by the Gate-9c/9d reviewer-of-record (Risk #5 — distress + paternalism), with the per-locale loading infrastructure in place now**,
so that **the harm-mitigation surface is real for the primary underserved audience, not a translated approximation — and the project's trust-with-vulnerable-users posture holds**.

## Acceptance Criteria

> **Epic-7 dev-phase decision (infra-now, content-gated-on-9c/9d) — load-bearing.** Tail-scene copy is the load-bearing harm-mitigation **human clinical-register content** the ACs explicitly forbid AI/maintainer from authoring ("authored by the named reviewer — not translated from EN"). Gates 9c/9d are `backlog`. This story builds the **per-locale loading infrastructure** + ships **parity-aware EN-placeholder** RU/PL tail-scene scaffolds (`clinicalRegisterReviewed: false`, `_meta.translationStatus: "in-progress"`, reviewer `@TBD-{ru,pl}-clinical-register`). No RU/PL clinical prose is fabricated. The named reviewer later overwrites the copy + flips `clinicalRegisterReviewed`/`translationStatus` with zero structural change. Sign-off docs are stubbed with TBD + the full enumerated deliverable checklist (Sally's belt-and-suspenders) so launch-readiness visibly tracks the gate.

1. **AC-1 (RU + PL tail-scenes.json EN-placeholder scaffolds):** `src/content/i18n/ru/tail-scenes.json` and `src/content/i18n/pl/tail-scenes.json` are committed mirroring the EN structure (Story 6.5): same `scenes` keys (`bottom-decile` with `heading`/`copy`/`silentCompanionLine`, `mid-band`, `top-decile`), EN-placeholder `copy` values, `_meta.translationStatus: "in-progress"`, `locale`, `reviewer: "@TBD-{ru,pl}-clinical-register"`, `lastReviewed: "pending"`, `clinicalRegisterReviewed: false`. NOT clinical-register human translation (Gate 9c/9d).
2. **AC-2 (per-locale loading infra — result.js):** `src/assessment/result.js` is wired to fetch the ACTIVE locale's tail-scenes (`/src/content/i18n/${locale}/tail-scenes.json` where `locale = state.getState().locale || "en"`), falling back to `en/tail-scenes.json` if the active-locale file is missing/not-ok. The EN happy-path is unchanged (locale=en → en file). An RU/PL session now loads its own (placeholder) tail-scenes, not EN.
3. **AC-3 (no faked clinical sign-off; CODEOWNERS unchanged):** `clinicalRegisterReviewed` stays `false` for RU/PL (and EN). `.github/CODEOWNERS` is NOT modified (`src/content/i18n/{ru,pl}/**` already owned by `@TBD-{ru,pl}-reviewer`). No real reviewer handle invented.
4. **AC-4 (launch-readiness sign-off stubs — belt-and-suspenders enumeration):** `docs/launch-readiness/ru-translator-signoff.md` and `docs/launch-readiness/pl-translator-signoff.md` are created as stubs (reviewer: TBD, date: pending) that enumerate ALL deliverables the reviewer must sign off on, each marked NOT-YET-SIGNED-OFF: (1) tail-scene-bottom copy, (2) tail-scene-mid copy, (3) tail-scene-top copy, (4) silent-companion-line copy (UX-DR26), (5) locale-switch-blocker-hint copy (UX-DR27 — Story 7.2), (6) crisis-resources list curation (Story 7.7), (7) retest-effect copy on result page (Story 6.7). Each doc states that any un-enumerated/un-signed deliverable blocks Epic 10 launch.
5. **AC-5 (tests + no regression):** Tests cover: RU+PL tail-scenes.json exist with full key-parity to EN + `clinicalRegisterReviewed: false` + `_meta.translationStatus: "in-progress"`; `result.js` constructs the active-locale tail-scenes URL with EN fallback (assert the source/behavior); the two sign-off docs exist and enumerate all 7 deliverables. `make test` green; `make lint` green; `make build` deterministic. The existing EN tail-scene Playwright path is unaffected (EN session still loads en/tail-scenes.json). Per lesson-2026-06-03-001, wire any new Playwright spec into pr-checks (prefer unit/contract tests to avoid a new browser job unless necessary).

## Tasks / Subtasks

- [ ] **Task 1: RU + PL tail-scenes.json placeholders** (AC: 1)
  - [ ] Mirror en/tail-scenes.json structure; EN-placeholder copy; `_meta` in-progress; reviewer `@TBD-{ru,pl}-clinical-register`; `clinicalRegisterReviewed: false`.
- [ ] **Task 2: per-locale loading in result.js** (AC: 2)
  - [ ] Fetch `/src/content/i18n/${locale}/tail-scenes.json` with EN fallback; EN happy-path unchanged.
- [ ] **Task 3: launch-readiness sign-off stubs** (AC: 4)
  - [ ] `docs/launch-readiness/{ru,pl}-translator-signoff.md` enumerating all 7 deliverables as NOT-YET-SIGNED-OFF.
- [ ] **Task 4: tests** (AC: 5)
  - [ ] tail-scenes parity + clinicalRegisterReviewed false + _meta; result.js active-locale fetch + EN fallback; sign-off docs enumerate 7 deliverables.
- [ ] **Task 5: regression gate** (AC: 5)
  - [ ] `make test`/`make lint`/`make build` green; EN tail-scene path unaffected.

## Dev Notes

- **EN tail-scenes (`src/content/i18n/en/tail-scenes.json`)** is the structural template: `{ _doc, locale, reviewer, lastReviewed, clinicalRegisterReviewed:false, scenes:{ bottom-decile:{heading,copy,silentCompanionLine}, mid-band:{heading,copy}, top-decile:{heading,copy} } }`. Mirror keys; placeholder copy; flip `locale` + reviewer handle.
- **result.js loading:** `render()` currently hardcodes `fetch("/src/content/i18n/en/tail-scenes.json")` (line ~134). Change to active-locale with EN fallback: `const locale = state.getState().locale || "en"; try active-locale fetch; if !ok → fetch en`. `tailScene()` consumes `tailScenes.scenes[variant]` — unchanged.
- **Crisis-resources (line ~151) is hardcoded EN too — that is Story 7.7's scope, NOT this one.** Do not touch crisis loading here.
- **No clinical prose authored.** The placeholder copy is explicitly EN; `clinicalRegisterReviewed:false` + `_meta.translationStatus:in-progress` make the placeholder nature machine-observable. Gate-9c/9d reviewer overwrites later.
- **Files:** `src/content/i18n/ru/tail-scenes.json` (NEW), `src/content/i18n/pl/tail-scenes.json` (NEW), `src/assessment/result.js` (locale-aware fetch), `docs/launch-readiness/ru-translator-signoff.md` + `pl-translator-signoff.md` (NEW stubs), tests. Do NOT touch en/tail-scenes.json, CODEOWNERS, crisis-resources.
- **app-modules-bytes budget:** the result.js change is tiny (~a few lines); if it nudges `app-modules-bytes`, bump with documented rationale + the frozen pin (per the budget convention).

### Carry-forward lessons

- lesson-2026-06-03-001 (high): pr-checks wires specs per-job. Apply: if a new Playwright spec is added for RU/PL tail-scene loading, add a dedicated pr-checks job; prefer unit/contract tests (no new browser job needed for JSON parity + URL construction).
- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: new JSON/docs are net-new; baseline-diff before labeling any failure pre-existing.
- lesson-2026-05-20-010 (medium): match observable AC intent. Apply: per-locale loading + placeholder parity satisfies the AC's intent; the named-reviewer prose is the Gate-9c/9d deliverable, not this story's.
- lesson-2026-05-20-011 (medium): a story can self-exercise its affordance. Apply: the per-locale loader self-exercises against the RU/PL placeholder files; capture in Completion Notes.

### Project Structure Notes

- i18n JSON under `src/content/i18n/<locale>/`; launch-readiness docs under `docs/launch-readiness/`. No variance.

### References

- [Source: epics.md#Story-7.6] — AC source (RU/PL clinical-register copy, sign-off enumeration, replaces Epic-6 placeholders).
- [Source: src/content/i18n/en/tail-scenes.json] — Story-6.5 EN placeholder template.
- [Source: src/assessment/result.js#126-159] — render() tail-scenes fetch (hardcoded EN → active-locale).
- [Source: project memory project_iqme_epic7_infra_now_decision] — infra-now; tail-scene copy is gated human content.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
