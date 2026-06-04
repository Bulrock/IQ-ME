---
id: 7-6-ru-pl-tail-scene-clinical-register-copy-replaces-epic-6-placeholders
title: "Story 7.6: RU + PL tail-scene clinical-register copy (replaces Epic 6 placeholders)"
status: review
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

- [x] **Task 1: RU + PL tail-scenes.json placeholders** (AC: 1)
  - [x] Mirror en/tail-scenes.json structure; EN-placeholder copy; `_meta` in-progress; reviewer `@TBD-{ru,pl}-clinical-register`; `clinicalRegisterReviewed: false`.
- [x] **Task 2: per-locale loading in result.js** (AC: 2)
  - [x] Fetch `/src/content/i18n/${locale}/tail-scenes.json` with EN fallback; EN happy-path unchanged.
- [x] **Task 3: launch-readiness sign-off stubs** (AC: 4)
  - [x] `docs/launch-readiness/{ru,pl}-translator-signoff.md` enumerating all 7 deliverables as NOT-YET-SIGNED-OFF.
- [x] **Task 4: tests** (AC: 5)
  - [x] tail-scenes parity + clinicalRegisterReviewed false + _meta; result.js active-locale fetch + EN fallback; sign-off docs enumerate 7 deliverables.
- [x] **Task 5: regression gate** (AC: 5)
  - [x] `make test`/`make lint`/`make build` green; EN tail-scene path unaffected.

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

- RU/PL tail-scenes EN-placeholder scaffolds (clinicalRegisterReviewed:false, _meta in-progress, @TBD-{ru,pl}-clinical-register); per-locale loading via pure tailScenesUrl helper + result.js active-locale fetch w/ EN fallback; sign-off doc stubs enumerate 7 deliverables (block-launch). Test-review cycle-1 closed the AC-2 dead-string gap (behavioral helper + fetch-coupling). app-modules-bytes 57344→59392. 1185 tests pass, lint+build exit 0.

### File List

- src/assessment/tail-scenes-url.js
- src/content/i18n/ru/tail-scenes.json
- src/content/i18n/pl/tail-scenes.json
- src/assessment/result.js
- docs/launch-readiness/ru-translator-signoff.md
- docs/launch-readiness/pl-translator-signoff.md
- tests/unit/tail-scenes-i18n.test.mjs
- BUDGETS.json

## Specialist Self-Review

## Specialist Self-Review — Story 7-6 (RU/PL tail-scene clinical-register copy, infra-now)

**Decisions made:**
- Tail-scene copy is the load-bearing harm-mitigation HUMAN clinical-register content the AC forbids AI/maintainer from authoring (Gates 9c/9d, backlog). So 7-6 ships **infra + EN-placeholder scaffolds only**: `src/content/i18n/{ru,pl}/tail-scenes.json` mirror the EN structure, `clinicalRegisterReviewed: false`, `_meta.translationStatus: "in-progress"`, `reviewer: @TBD-{ru,pl}-clinical-register`, EN-placeholder copy. No RU/PL clinical prose fabricated.
- Per-locale loading infra: factored the URL into a pure, unit-testable helper `src/assessment/tail-scenes-url.js` (`tailScenesUrl(locale)`); `result.js` fetches `tailScenesUrl(state.getState().locale || "en")` and falls back to `tailScenesUrl("en")` when the active-locale file is missing/not-ok. EN happy-path unchanged.
- Launch-readiness sign-off stubs `docs/launch-readiness/{ru,pl}-translator-signoff.md` enumerate all 7 deliverables (tail-scene bottom/mid/top, silent-companion-line, locale-switch-blocker-hint, crisis-resources, retest-effect), each NOT-YET-SIGNED-OFF, stating un-signed deliverables block Epic 10 launch. CODEOWNERS unchanged (Gate-gated).

**Test-review interaction (1 revision cycle):** The independent reviewer flagged that the original AC-2 verification was 4 independent static substring checks — a broken loader (dead interpolated string + still-hardcoded EN fetch) would pass green. Addressed in cycle 1 by making the test require a pure `tailScenesUrl(locale)` helper (verified BEHAVIORALLY — ru→ru path, pl→pl, en→en) AND that result.js fetches tail-scenes THROUGH `fetch(tailScenesUrl(...))` (defeats the dead-string attack). Implemented the helper accordingly.

**Cross-story test impact:** `app-modules-bytes` nudged 57389/57344 from the result.js + helper additions (the spec anticipated this). Bumped 57344→59392 (56→58 KB) with documented rationale + the frozen pin (`cognitive-load-budget.test.mjs`), recorded as engineer.

**Framework gotchas avoided:**
- A literal EN-path fetch (even as a template literal with backticks) would trip the test's "no hardcoded EN fetch" matcher; routing BOTH the active and fallback fetch through `tailScenesUrl(...)` keeps it clean and behaviorally correct.
- `tailScenesUrl` is pure (no browser coupling) so it imports cleanly in node:test — the behavioral guarantee the static-source approach lacked.

**Areas of uncertainty:**
- A transient aggregate-only failure of `lint-csp-source-coverage` appeared once then cleared (2 consecutive clean full runs after; csp lint passes isolated + directly). Provenance: NOT 7-6 (no CSP-affecting change) — likely the same class of concurrent-`make`-against-shared-tree flake as the snapshot one fixed in 7.5b. Flagged for the auditor / a possible retro item (audit other coverage tests that spawn make/lint against the real tree under aggregate concurrency).

**Tested edge cases:** `tests/unit/tail-scenes-i18n.test.mjs` (frozen) — RU/PL parity (scene keys derived from EN) + clinicalRegisterReviewed:false + _meta in-progress + reviewer handle; `tailScenesUrl` behavioral mapping; result.js fetches via helper + EN fallback; sign-off docs enumerate 7 deliverables + blocks-launch marker. Full suite 1185 pass / 0 fail (2 consecutive runs); make lint + build exit 0.

## Auditor Findings (round-1)

### [info] Transient lint-csp-source-coverage aggregate-only failure observed once under concurrent make-against-shared-tree, then self-cleared (NOT caused by 7-6; no CSP change). Same flake class as the design-system AC-6 snapshot issue fixed in 7.5b.

- **Category:** test-infrastructure
- **Suggested bridge:** `Audit all coverage/lint tests that spawn make/lint against the real working tree under aggregate concurrency; isolate them to a tmpdir (as the design-system AC-6 tmpdir fix did) so concurrent make runs cannot cross- contaminate.`
- **Bridged to:** `bridge-9a-1-isolate-concurrency-sensitive-coverage`
