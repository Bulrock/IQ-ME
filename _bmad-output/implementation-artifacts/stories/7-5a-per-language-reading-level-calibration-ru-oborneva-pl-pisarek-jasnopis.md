---
id: 7-5a-per-language-reading-level-calibration-ru-oborneva-pl-pisarek-jasnopis
title: "Story 7.5a: Per-language reading-level calibration (RU Oborneva + PL Pisarek/Jasnopis)"
status: ready-for-dev
---

# Story 7.5a: Per-language reading-level calibration (RU Oborneva + PL Pisarek/Jasnopis)

## Story

As a **maintainer extending the EN reading-level lint to support RU and PL**,
I want **`lint-reading-level` calibrated for RU (Oborneva-equivalent grade) and PL (Pisarek/Jasnopis-equivalent grade), as a separate gate from translation-parity (per Murat — highest-risk story split into two independent debug surfaces)**,
so that **a reading-level failure in RU or PL is debuggable on its own without entanglement with translation-parity issues**.

## Acceptance Criteria

> **Epic-7 dev-phase decision (infra-now) — confirmed scope (user decision):** Implement + unit-test the RU/PL calibration infrastructure fully, but the gate **enforces only on `translationStatus: "complete"` (or unset) non-EN content**. RU/PL methodology pages and i18n locales currently carry `translationStatus: "in-progress"` (EN-placeholder, gated on Gates 9c/9d) — grading English placeholder text under a Russian/Polish metric is a category error, so in-progress content is **skipped with a per-locale WARN**. The gate activates automatically (grading + failing) when Gate-9c/9d real prose lands and `translationStatus` flips to `complete`. EN enforcement (FK ≤12) is unchanged.

1. **AC-1 (RU + PL grade formulas, committed pure-JS, NFR33):** `tools/lint-reading-level.mjs` is extended with per-locale grade computation: **RU** via an Oborneva-equivalent adaptation of Flesch-Kincaid for Russian (`0.5·(words/sentences) + 8.4·(syllables/words) − 15.59`, with Cyrillic-aware word tokenization + Russian-vowel syllable counting `[аеёиоуыэюя]`); **PL** via a Pisarek/Jasnopis-equivalent grade (committed pure-JS implementation, with Polish-aware tokenization + Polish-vowel syllable counting `[aeiouyąęó]`). No new runtime deps; vendored constants carry a source comment. Per-locale target caps are defined per NFR28 (RU Oborneva-equivalent grade cap; PL Pisarek/Jasnopis-equivalent cap) as named constants.
2. **AC-2 (enforcement gated on translationStatus):** For non-EN methodology pages, the lint reads frontmatter `translationStatus`. Pages with `translationStatus: "in-progress"` (all RU/PL pages today) are **skipped with one per-locale WARN** (`<LANG> reading-level: N in-progress page(s) skipped (calibration active; enforcement awaits Gate-9c/9d completion)`). Pages with `translationStatus: "complete"` (or unset, for a hypothetical completed non-EN page) are graded against the per-language cap and **fail the build** on exceedance. EN pages keep FK ≤12 enforcement unchanged.
3. **AC-3 (i18n SPA microcopy sentence-length caps, NFR31):** With `--include-i18n`, the lint applies NFR31 sentence-length caps per locale to each translated string value: EN ≤25 words; RU ≤180 chars; PL ≤160 chars. RU/PL i18n bundles carrying `_meta.translationStatus: "in-progress"` are **skipped with a per-locale WARN** (placeholder strings); complete locales are enforced (fail on overlong/over-complex strings). The `_meta` object itself is never graded.
4. **AC-4 (independent gate slot, separate from parity):** Reading-level is a distinct `pr-checks.yml` job from translation-parity (Story 7.5b) — a failure in one does not mask the other (Murat's two-debug-surfaces requirement). Verify the reading-level job exists and is independent; add/adjust the job if needed (per lesson-2026-06-03-001 — the matrix wires jobs explicitly, no greedy glob).
5. **AC-5 (tests + no regression):** Unit tests (`tests/unit/tools/lint-reading-level-i18n-calibration.test.mjs` or extension of the existing reading-level test) cover, against **synthetic RU/PL fixtures** (via `--paths=` tmpdir override, NOT the real placeholder corpus): RU Oborneva grade on a known-hard Russian passage exceeds the cap (fails); RU within-cap passage passes; PL Pisarek/Jasnopis analogous pass/fail; an `in-progress` non-EN page is skipped (WARN, no failure); i18n char-cap fail/pass per RU(180)/PL(160); `_meta` ignored. `make test` green; `make lint` green (in-repo RU/PL placeholder pages are skipped → no false failures); `make build` deterministic.

## Tasks / Subtasks

- [ ] **Task 1: RU + PL grade formulas** (AC: 1)
  - [ ] Oborneva RU grade (Cyrillic tokenizer + Russian-vowel syllables) + named cap constant.
  - [ ] Pisarek/Jasnopis PL grade (Polish tokenizer + Polish-vowel syllables) + named cap constant; source-comment the constants.
- [ ] **Task 2: translationStatus-gated enforcement** (AC: 2)
  - [ ] Read non-EN frontmatter `translationStatus`; in-progress → per-locale WARN skip; complete/unset → grade + fail on exceedance. EN FK unchanged.
- [ ] **Task 3: i18n char-caps** (AC: 3)
  - [ ] NFR31 caps EN 25 words / RU 180 chars / PL 160 chars; skip `_meta.translationStatus:in-progress` locales with WARN; never grade `_meta`.
- [ ] **Task 4: independent CI gate slot** (AC: 4)
  - [ ] Confirm/adjust the `pr-checks.yml` reading-level job is separate from parity.
- [ ] **Task 5: tests + regression** (AC: 5)
  - [ ] Synthetic-fixture unit tests (RU/PL pass+fail, in-progress skip, i18n caps, _meta ignored); `make test`/`make lint`/`make build` green.

## Dev Notes

- **Gate-on-translationStatus is the load-bearing design (user decision).** Today every RU/PL page is `translationStatus: "in-progress"` (EN placeholder), so the in-repo `make lint` must skip them → no false reading-level failures. Implement the calibration + unit-test it against SYNTHETIC RU/PL fixtures (tmpdir via `--paths=`), not the placeholder corpus.
- **Current lint shape:** `tools/lint-reading-level.mjs` already has `detectLang`, `stripFrontmatter`, `stripMarkdown`, FK calc, the `--include-i18n` pass, and emits per-locale "calibration not yet wired (Epic 7)" WARNs for non-EN — replace those WARNs with real calibration + the in-progress skip WARN. The glossary subtree is already skipped.
- **Oborneva (RU):** Flesch-Kincaid adapted for Russian (Oborneva 2006): `0.5·ASL + 8.4·ASW − 15.59` (ASL = words/sentence, ASW = syllables/word). Russian syllable = vowel count `[аеёиоуыэюя]` (each vowel ≈ one syllable; simpler + more accurate for Russian than the EN vowel-group heuristic).
- **Pisarek/Jasnopis (PL):** use a committed pure-JS Pisarek-style grade (avg sentence length + share of long ≥4-syllable words), source-commented; Polish vowels `[aeiouyąęó]`. Pick a deterministic formula and pin the cap constant; the test-author fixtures define the contract.
- **Independence from parity (7.5b):** keep reading-level its own lint + its own CI job. Do NOT couple to `lint-translation-parity`.
- **Files:** `tools/lint-reading-level.mjs` (EXTEND), `tests/unit/tools/lint-reading-level-*.test.mjs` (NEW/extend), possibly `.github/workflows/pr-checks.yml` (job). Do NOT modify methodology content or budgets.

### Carry-forward lessons

- lesson-2026-06-03-001 (high): pr-checks.yml wires jobs explicitly, no greedy glob. Apply: verify the reading-level job is present + independent (`grep` the job in pr-checks.yml); add if missing.
- lesson-2026-06-03-002 (high): verify regression provenance with a baseline diff. Apply: if a lint/test goes red, baseline-diff before labeling pre-existing — the calibration is net-new.
- lesson-2026-05-20-010 (medium): match the AC's observable intent, not a literal symbol. Apply: AC names "Oborneva/Pisarek" — a documented design-equivalent pure-JS adaptation that produces the per-language grade + cap behavior satisfies the intent; record the formula choice under Decisions made.
- lesson-2026-05-20-012 (low): keep tooling stdlib-only + fast. Apply: vendored formula constants, no deps (NFR33).

### Project Structure Notes

- Single lint tool `tools/lint-reading-level.mjs` handles all three locales; no new tool file. Tests under `tests/unit/tools/`.

### References

- [Source: epics.md#Story-7.5a] — AC source (Oborneva RU, Pisarek/Jasnopis PL, i18n caps, independent gate).
- [Source: tools/lint-reading-level.mjs] — current EN FK lint + `--include-i18n` + non-EN deferred WARNs to replace.
- [Source: project memory project_iqme_epic7_infra_now_decision] — infra-now; enforcement gated on translationStatus.
- [Source: NFR28 (per-language reading metrics), NFR31 (sentence-length caps EN25w/RU180c/PL160c)].

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
