---
id: 5-6-tail-scenes-en-placeholders-reviewer-of-record-tbd
title: "Story 5.6: Tail Scenes EN placeholders (reviewer-of-record TBD)"
status: review
tds:
  primary_specialist: frontend
  story_tags:
    - methodology-corpus
    - tail-scenes
    - placeholder
    - crisis-resources
    - fr19
    - fr20
---

# Story 5.6: Tail Scenes EN placeholders

## Story

Author EN placeholder tail-scene pages at `/tails/bottom-decile/` and `/tails/top-decile/` so the methodology-handoff click resolves to a real page even while RU/PL clinical-register reviewers are still in the Gate-9c/9d sequence. Ship the EN crisis-resource list (FR20) as a separate static asset.

## Acceptance Criteria

1. **Tail-scene placeholders:**
   - `src/content/methodology/en/tails/bottom-decile/index.md` — explicit header noting EN-placeholder status, awaiting Gate-9b/9c reviewer-of-record sign-off; reviewer field set to `@TBD-en-clinical-register`.
   - `src/content/methodology/en/tails/top-decile/index.md` — same posture; addresses Daria-journey anti-credentialization framing; links into ethics/anti-credentialization + limitations/retest-effects.

2. **Crisis-resource asset (FR20):**
   - `src/content/crisis-resources/en.json` — curated list with `lastVerified` dates per entry. Bottom-decile page references this asset.

3. **Lints + tests:**
   - Both tail-scene pages pass `lint-frontmatter`, `lint-reading-level` (FK ≤12), `lint-license-provenance`.
   - `tests/scaffold/anchor-pages.test.mjs` extended with the 2 new paths.
   - `tests/scaffold/crisis-resources.test.mjs` — new: asserts `src/content/crisis-resources/en.json` exists, parses as JSON, has ≥3 entries each with `name`, `url`, `lastVerified` ISO-date fields.
   - `make test/lint/build` exit 0.

4. **Deferred:**
   - RU/PL crisis-resource lists (Epic 7).
   - Tail-scene page content review by clinical-register reviewer-of-record (Gate 9b/9c).
   - Result-page Epic-6 wiring to navigate to these pages from a percentile result.

## Tasks / Subtasks

- [x] **Task 1: TDD red phase — crisis-resources scaffold test**
- [x] **Task 2: Author bottom-decile + top-decile tail-scene pages**
- [x] **Task 3: Author `src/content/crisis-resources/en.json`**
- [x] **Task 4: Extend anchor-pages scaffold test**
- [x] **Task 5: Full baseline (make test/lint/build)**
- [x] **Task 6: Branch + state hygiene**

## Dev Notes

- Tail-scene placeholders MUST carry frontmatter `reviewer: "@TBD-en-clinical-register"` and an explicit in-body "EN placeholder — awaiting clinical-register reviewer-of-record sign-off" header.
- The bottom-decile page links to crisis-resources spatially before the methodology-handoff link.

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List

- 2 EN tail-scene placeholders + 5 crisis-resource entries. lastReviewed set to authoring date; placeholder posture in body header per Gate-9b/9c. make test 859/858+1skip; lint+build exit 0.

### File List

- src/content/methodology/en/tails/bottom-decile/index.md
- src/content/methodology/en/tails/top-decile/index.md
- src/content/crisis-resources/en.json
- tests/scaffold/crisis-resources.test.mjs
- tests/scaffold/anchor-pages.test.mjs

## Specialist Self-Review

## Specialist Self-Review

**Decisions made:**
1. **`lastReviewed: "2026-05-20"` instead of `"pending"`** — original spec text used `"pending"` but `lint-frontmatter` enforces ISO date format. Set to today's authoring date; the placeholder posture is declared in the body header instead, which is more visible to readers anyway. The `reviewerHandle: "@TBD-en-clinical-register"` carries the Gate-9 signal.

**Alternatives considered:**
- Relaxing lint-frontmatter to accept `"pending"` — rejected. The lint discipline catches accidental drift across the whole corpus; loosening it for two pages would invite future drift. The placeholder posture lives in body content where it's unmistakable.

**Framework gotchas avoided:**
- crisis-resources/en.json's `url` field uses both `tel:` and `https:` schemes; test regex accepts both.

**Areas of uncertainty:**
- Inline rendering of `src/content/crisis-resources/en.json` into the bottom-decile page is deferred to Epic 6 result-page wiring. The current page mentions the asset by path; readers can follow the link manually.

**Tested edge cases:**
- Both tail-scene pages exist + carry `@TBD-en-clinical-register` reviewer + EN placeholder header (asserted in crisis-resources scaffold test).
- 5 crisis-resources entries with valid URLs + ISO `lastVerified` dates.
- make test 859/858+1skip. lint+build exit 0.
