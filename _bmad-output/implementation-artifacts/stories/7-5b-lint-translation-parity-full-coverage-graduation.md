---
id: 7-5b-lint-translation-parity-full-coverage-graduation
title: "Story 7.5b: lint-translation-parity full-coverage graduation"
status: ready-for-dev
---

# Story 7.5b: lint-translation-parity full-coverage graduation

## Story

As a **maintainer enforcing measurement equivalence as a CI invariant (Innovation #7)**,
I want **`lint-translation-parity` (defensive stub from Story 4.7) graduated to full coverage as a separate, independent gate from reading-level (Story 7.5a)**,
so that **a parity failure in RU or PL is debuggable on its own and the simultaneous-graduation risk (Murat's highest-risk-story flag) is mitigated**.

## Acceptance Criteria

1. **AC-1 (full tri-locale parity coverage):** `tools/lint-translation-parity.mjs` graduates from its Story-4.7 defensive stub (which only WARN'd on empty + 64-hex-validated `sourceHashEN`) to full coverage: it asserts (a) **no missing** — every EN methodology page has a counterpart at the identical relative path in RU and PL; (b) **no orphans** — every RU/PL page has a matching EN page; (c) **EN-source hash match** — every RU/PL page's frontmatter `sourceHashEN` equals the SHA256 of its EN counterpart's current body (the `build-methodology.mjs` `enSourceHashFor` contract: body after closing `---`, `\r?\n`-split, `\n`-joined, utf8). The lint **fails the build** (exit 1) on any missing page, orphan page, or stale hash (a `sourceHashEN` that does not match the current EN body = unrecoverable drift).
2. **AC-2 (per-locale per-page status output):** On every run the lint emits a clear per-locale summary, e.g. `EN: source-of-truth (35 pages)`, `RU: 35/35 pages parity-green`, `PL: 35/35 pages parity-green`. On drift it names the specific page(s) and the EN counterpart whose hash diverged.
3. **AC-3 (stale → build hatnote alignment):** The lint's stale detection uses the SAME `sourceHashEN` vs EN-body-SHA256 comparison the build (`build-methodology.mjs`) uses to set `data-translation-stale="true"` + render the stale-translation-hatnote. A page the lint flags stale is exactly a page the build renders with the hatnote (no divergence between gate and renderer).
4. **AC-4 (independent gate, separate from reading-level):** `lint-translation-parity` remains its own `pr-checks.yml` job, independent from `lint-reading-level` (Story 7.5a) — a failure in one does not mask the other (Murat's two-debug-surfaces requirement). Verify/retain the separate job (per lesson-2026-06-03-001).
5. **AC-5 (tests + no regression):** The Story-4.7 unit test (`tests/unit/tools/lint-translation-parity.test.mjs`) and scaffold coverage test (`tests/scaffold/lint-translation-parity-coverage.test.mjs`) are updated for the graduated behavior (the "no non-EN content / deferred to Epic 7" assertions are obsolete — RU+PL landed in 7.3/7.4). New unit tests cover, against **synthetic fixtures** (tmpdir): missing-counterpart → fail; orphan → fail; stale `sourceHashEN` → fail; full-parity tri-locale tree → pass + parity-green summary. `make test` green (the in-repo RU+PL mirrors are byte-parity with EN → parity-green); `make lint` green; `make build` deterministic.

## Tasks / Subtasks

- [ ] **Task 1: full-coverage parity logic** (AC: 1, 3)
  - [ ] EN body-SHA256 (`enSourceHashFor` contract); per non-EN page: counterpart-exists + hash-match; collect missing/orphan/stale.
- [ ] **Task 2: per-locale status output** (AC: 2)
  - [ ] `EN: source-of-truth (N)`, `<LANG>: x/y pages parity-green`; name divergent pages on failure.
- [ ] **Task 3: independent gate** (AC: 4)
  - [ ] Confirm/retain the separate `pr-checks.yml` lint-translation-parity job.
- [ ] **Task 4: update Story-4.7 tests + new coverage** (AC: 5)
  - [ ] Update `lint-translation-parity.test.mjs` + `lint-translation-parity-coverage.test.mjs` for graduated behavior; add synthetic missing/orphan/stale/full-parity tests.
- [ ] **Task 5: regression gate** (AC: 5)
  - [ ] `make test`/`make lint`/`make build` green; in-repo RU+PL parity-green.

## Dev Notes

- **Current stub (`tools/lint-translation-parity.mjs`):** Phase-1 WARN if no non-EN content (now obsolete — RU+PL landed); Phase-2 validates `sourceHashEN` is 64-hex for non-EN pages; per-locale summary "N page(s) found (deep parity check deferred to Epic 7)". 7.5b replaces the deferred summary with the real deep check.
- **Hash contract (load-bearing):** `SHA256` of EN page **body** (after closing `---`, `\r?\n`-split, `\n`-joined, utf8) — identical to `build-methodology.mjs` `enSourceHashFor` (lines 218-227) and the 7.3/7.4 mirror generator. The in-repo RU/PL pages were scaffolded with exactly this hash → parity-green.
- **Independence:** keep separate from `lint-reading-level` (7.5a is its own gate). Do NOT merge the two lints.
- **Tri-locale completeness:** the 7.3/7.4 generator mirrored ALL 35 EN pages (incl. the glossary subtree) into RU + PL → no missing, no orphans. Full parity holds today.
- **Files:** `tools/lint-translation-parity.mjs` (GRADUATE), `tests/unit/tools/lint-translation-parity.test.mjs` (UPDATE — Story 4.7, frozen; record as engineer), `tests/scaffold/lint-translation-parity-coverage.test.mjs` (UPDATE — same one touched by 7.3/7.4), possibly a new `tests/unit/tools/lint-translation-parity-graduation.test.mjs`. Do NOT modify methodology content.

### Carry-forward lessons

- lesson-2026-06-03-001 (high): pr-checks wires jobs explicitly. Apply: verify lint-translation-parity job exists + independent; cover any new test file.
- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: graduation is net-new behavior; baseline-diff before labeling failures pre-existing.
- lesson-2026-05-20-010 (medium): match observable AC intent. Apply: missing/orphan/stale enforcement + parity-green summary is the intent; the exact message wording is free.
- lesson-2026-05-20-012 (low): stdlib-only, fast. Apply: reuse the existing minimal frontmatter extractor; no deps.

### Project Structure Notes

- Single lint `tools/lint-translation-parity.mjs`; tests under `tests/unit/tools/` + `tests/scaffold/`.

### References

- [Source: epics.md#Story-7.5b] — AC source (full coverage, orphan/stale, per-locale status, independent gate).
- [Source: tools/lint-translation-parity.mjs] — Story-4.7 defensive stub to graduate.
- [Source: tools/build-methodology.mjs#218-258] — `enSourceHashFor` + isStale contract to mirror.
- [Source: stories/7-3..., 7-4...] — RU/PL mirrors with parity sourceHashEN.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
