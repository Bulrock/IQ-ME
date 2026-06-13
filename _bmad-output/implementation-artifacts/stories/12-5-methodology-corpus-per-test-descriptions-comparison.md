---
id: 12-5-methodology-corpus-per-test-descriptions-comparison
title: "Story 12-5: Methodology corpus — per-test descriptions + accuracy/popularity comparison pages"
status: in-progress
---

# Story 12-5: Methodology corpus — per-test descriptions + accuracy/popularity comparison pages

## Story

As a reader of the methodology pages (PR-15),
I want a description of each available test plus a comparison of the tests by accuracy and popularity,
so that I understand what each methodology measures and how they relate before choosing one.

## Epic context

Authors the methodology-corpus content for the multi-test battery, sourced from Story 12-1. Adds a description page for the new ICAR Letter/Number Series methodology (the geometric matrix test already has corpus coverage) and an accuracy/popularity **comparison** page. Authored in EN and mirrored to PL/RU with `sourceHashEN` bumps per NFR27, keeping `lint-translation-parity`, `lint-claims-manifest`, and reading-level lints green. New pages auto-appear in the methodology sidebar (consistent with PR-11, via the build's section grouping) with no broken links (PR-12b). Touches the methodology corpus → the NFR27 parity cascade applies; snapshots refreshed via `make snapshot-update`.

## Acceptance Criteria

**Given** the sourced research from Story 12-1,
**When** the methodology corpus is updated,
**Then** new corpus pages describe each implemented methodology and present the accuracy/popularity comparison, authored in EN and mirrored to PL/RU with `sourceHashEN` bumps per NFR27, keeping `lint-translation-parity`, `lint-claims-manifest`, and reading-level lints green; the new pages are linked from the methodology sidebar (PR-11) with no broken links (PR-12b).
1. A new EN page `src/content/methodology/en/constructs/letter-number-series/index.md` describes the ICAR Letter/Number Series methodology: what it measures (inductive reasoning over sequences), its construct, its openness (ICAR / CC-BY-NC-SA basis), and its honest not-a-clinical-assessment framing. Required frontmatter present (title, version, lastReviewed, reviewer, reviewerHandle, asserts, glossaryRefs, sourceHashEN).
2. A new EN page `src/content/methodology/en/reference/methodology-comparison/index.md` compares the available methodologies (geometric matrix reasoning, letter/number series) by what each measures, relative recognizability, and openness, with the honest caveat that a short browser screen is a screen — not a diagnosis. Claims trace to the 12-1 research (no fabricated statistics). Required frontmatter present.
3. Both new EN pages pass the EN reading-level cap (FK grade within the project's EN limit) and `lint-frontmatter` (all required keys, valid shapes); `asserts` may be `[]` (or reference real claim ids if used) so `lint-claims-manifest` stays green.
4. Both pages are mirrored to RU and PL at the identical relative paths (`ru/constructs/letter-number-series/`, `pl/constructs/letter-number-series/`, and the comparison page), with `reviewer: TBD` / `reviewerHandle: @TBD-<lang>-reviewer`, agent-drafted bodies (consistent with the existing in-progress draft-translation posture), and `sourceHashEN` set to the SHA-256 of the EN body (so `lint-translation-parity` sees parity, not staleness). RU/PL pass their per-locale NFR31 reading-level caps.
5. The new pages auto-appear in the methodology sidebar (build's section grouping for `constructs` + `reference`), and all internal links resolve to real built pages (PR-12b — no "Cannot GET"/404; directory-style trailing-slash URLs).
6. `make build` regenerates the methodology output including the new pages; `make snapshot-update` refreshes the golden HTML snapshots (the codified D→E exception) so `methodology-snapshots` stays green. A scaffold guard (`tests/scaffold/12-5-methodology-comparison.test.mjs`) asserts both EN pages exist with required frontmatter + the comparison names both methodologies, the RU/PL mirrors exist with matching sourceHashEN, and the comparison carries the not-a-diagnosis caveat. RED before impl, GREEN after.
7. `make lint` exit 0, `make build` exit 0, `make test` green (modulo pre-existing 9-series reds): frontmatter, translation-parity, claims-manifest, reading-level, license-provenance, byte-stable snapshots all green.

## Tasks / Subtasks

- [ ] **Task 1: author the guard** (`tests/scaffold/12-5-methodology-comparison.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [ ] **Task 2: author the EN pages** — LN description + methodology comparison, plain reading-level, required frontmatter, sourced claims (no fabrication). (impl phase)
- [ ] **Task 3: mirror to RU + PL** — identical paths, agent-drafted bodies, TBD reviewer, sourceHashEN = SHA-256(EN body); pass per-locale reading-level caps. (impl phase)
- [ ] **Task 4: build + snapshot** — `make build` then `make snapshot-update` (D→E); verify sidebar grouping + link resolution. (impl phase)
- [ ] **Task 5: verification** — guard GREEN, `make lint`/`make build` exit 0, `make test` green (translation-parity, claims, reading-level, snapshots). (integration phase)

## Dev Notes

- **NFR27 parity cascade applies** (this story edits the methodology corpus): every EN body change must be mirrored to PL/RU with `sourceHashEN` = SHA-256 of the EN body-after-frontmatter (the build's exact contract, tools/build-methodology.mjs). Use the build's hash to set the mirror frontmatter, then re-run.
- **Sidebar is auto-generated** from top-level section dirs (constructs/reference/...); placing pages under existing sections makes them appear with no section-map edit. The build emits directory-style `index.html` so trailing-slash URLs resolve (PR-12b).
- **Reading-level**: EN uses FK grade (keep sentences short, like the existing icar-mr page, grade ~7-9); RU/PL use NFR31 sentence-length caps. Write plainly.
- **Claims discipline**: prefer `asserts: []` unless a real claim id from the manifest applies; do NOT invent claim ids or statistics. The comparison's claims trace to the 12-1 research narrative (ICAR openness, recognizability), stated qualitatively.
- **Snapshots**: new pages change the methodology golden HTML set → `make snapshot-update` is the codified D→E refresh (same as the tokens hash path). Commit the snapshot diff with the source.

### Carry-forward lessons

- Corpus-edit parity cascade (project memory): editing EN methodology bodies breaks lint-translation-parity unless mirrored to PL/RU + sourceHashEN bumped (sha256 of body-after-frontmatter). Apply: this is the core of Task 3.
- lesson-2026-06-04-002 (high): no fabricated specifics. Apply: comparison claims are qualitative + sourced to 12-1; no invented psychometric numbers.
- Draft RU/PL translations (project memory): RU/PL bodies are agent-drafted, gated (reviewer TBD). Apply: consistent posture for the new pages.
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`. Apply: guard runs via `make test`.

### Project Structure Notes

- New: `src/content/methodology/{en,ru,pl}/constructs/letter-number-series/index.md`, `src/content/methodology/{en,ru,pl}/reference/methodology-comparison/index.md`, refreshed `tests/snapshots/methodology/**`, `tests/scaffold/12-5-methodology-comparison.test.mjs`.
- Modified: golden methodology snapshots (via snapshot-update).
- NOT modified: scoring, item pools, the SPA.

### References

- [Source: _bmad-output/planning-artifacts/methodology-landscape-research.md §4 corpus content + §2 sourcing]
- [Source: src/content/methodology/en/constructs/icar-mr/index.md] (page + frontmatter convention)
- [Source: tools/build-methodology.mjs] (sourceHashEN contract + sidebar grouping)
- [Source: tools/lint-translation-parity.mjs] (the parity gate)

## Dev Agent Record

### Agent Model Used

writer/frontend (methodology corpus prose + NFR27 mirror; no code)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
