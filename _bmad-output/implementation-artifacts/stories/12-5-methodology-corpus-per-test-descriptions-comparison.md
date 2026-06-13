---
id: 12-5-methodology-corpus-per-test-descriptions-comparison
title: "Story 12-5: Methodology corpus — per-test descriptions + accuracy/popularity comparison pages"
status: review
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

- [x] **Task 1: author the guard** (`tests/scaffold/12-5-methodology-comparison.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [x] **Task 2: author the EN pages** — LN description + methodology comparison, plain reading-level, required frontmatter, sourced claims (no fabrication). (impl phase)
- [x] **Task 3: mirror to RU + PL** — identical paths, agent-drafted bodies, TBD reviewer, sourceHashEN = SHA-256(EN body); pass per-locale reading-level caps. (impl phase)
- [x] **Task 4: build + snapshot** — `make build` then `make snapshot-update` (D→E); verify sidebar grouping + link resolution. (impl phase)
- [x] **Task 5: verification** — guard GREEN, `make lint`/`make build` exit 0, `make test` green (translation-parity, claims, reading-level, snapshots). (integration phase)

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

- Methodology corpus: LN description + methodology comparison pages, EN authored (reading-level 5.8/6.3) + RU/PL mirrored with sourceHashEN=SHA256(EN body) (NFR27 parity: RU 21/21, PL 21/21). Comparison is qualitative+sourced (no fabricated stats), carries not-a-diagnosis caveat, auto-sidebar via constructs/reference sections, links resolve (PR-12b). snapshot-update refreshed 60->66 pages. Guard 3/3, full lint 0, build 0, full test = only 14 pre-existing 9-series reds (zero regressions).

### File List

- src/content/methodology/en/constructs/letter-number-series/index.md
- src/content/methodology/en/reference/methodology-comparison/index.md
- src/content/methodology/ru/constructs/letter-number-series/index.md
- src/content/methodology/ru/reference/methodology-comparison/index.md
- src/content/methodology/pl/constructs/letter-number-series/index.md
- src/content/methodology/pl/reference/methodology-comparison/index.md
- tests/scaffold/12-5-methodology-comparison.test.mjs

## Specialist Self-Review

**Decisions made:**
- Authored two EN methodology pages under EXISTING sections so they auto-appear in the sidebar without touching the build's hardcoded section map: the LN description under `constructs/letter-number-series/` and the comparison under `reference/methodology-comparison/`. The build emits directory-style `index.html`, so the internal trailing-slash links resolve (PR-12b).
- Kept the comparison **qualitative + sourced**: it names what each test measures, relative recognizability, and openness (ICAR vs proprietary Wechsler), and explicitly REFUSES to publish a single accuracy figure ("a figure without its study and sample would mislead") — honoring the claims-manifest no-fabrication discipline. `asserts: []` on both pages keeps `lint-claims-manifest` green without inventing claim ids.
- Mirrored both pages to RU + PL as agent-drafted real translations (not EN-stubs), consistent with the existing in-progress draft-translation posture (`reviewer: TBD`, `translationStatus: "in-progress"`), with `sourceHashEN` set to the SHA-256 of the EN body-after-frontmatter — the build's exact parity contract.

**Alternatives considered:**
- Putting the comparison under a NEW top-level section: rejected — the sidebar section map is hardcoded per-locale in build-methodology.mjs; a new section would need a build edit + per-locale section labels. `reference/` already exists and fits a comparison page.
- EN-stub RU/PL bodies (copy EN verbatim): rejected — the repo's RU/PL corpus carries real agent-drafted translations; matching that posture is more honest and useful, and the parity lint only needs `sourceHashEN` to equal the EN body hash regardless of the translated body.
- Citing specific g-loadings / correlation coefficients to look authoritative: refused per lesson-2026-06-04-002 — the comparison states the qualitative, sourced claim and shows a range, not invented numbers (the guard also forbids `r = 0.xx` patterns).

**Framework gotchas avoided:**
- NFR27 parity cascade: every EN body change must be mirrored with `sourceHashEN` = SHA-256(EN body-after-frontmatter). Computed each EN page's body hash with the build's exact algorithm (lines after the closing `---`, joined by `\n`), set it on both the EN page (self-hash) and the RU/PL mirrors. `lint-translation-parity` → RU 21/21, PL 21/21 green (was 19/19).
- Reading-level: EN pages graded 5.8 and 6.3 (cap 12); RU/PL within the per-locale NFR31 caps — all 21 pages green. Wrote in short, plain sentences matching the existing icar-mr page style.
- New methodology golden HTML: `make snapshot-update` refreshed the methodology snapshots (60 → 66 pages) — the codified D→E exception; `methodology-snapshots` test green. The tokens hash is unchanged (no primitives/semantic touched).
- License-provenance: the `en/**/*.md` corpus glob + the RU/PL corpus globs already cover the new pages (CC-BY-NC-SA project-authored derivative content) — lint green, no scope-map edit needed.

**Areas of uncertainty:**
- RU/PL bodies are agent-drafted, not native-reviewer clinical-register copy — the established gated posture (reviewer TBD, translationStatus in-progress). A native reviewer should confirm at the 9c/9d gate; the markers make that machine-observable.
- The comparison page deliberately omits per-test accuracy numbers. If the maintainer later wants a sourced quantitative table, that's a follow-up that should cite the source studies directly in the claims manifest, not inline-invented here.

**Tested edge cases:**
- 12-5 guard (3): both EN pages exist with all 8 required frontmatter keys; the comparison names both methodologies + carries the not-a-diagnosis caveat + no fabricated correlation; RU + PL mirrors exist at identical paths with `sourceHashEN === SHA-256(EN body)` and `reviewer: TBD`.
- Full corpus pipeline GREEN: `lint-frontmatter`, `lint-translation-parity` (RU 21/21, PL 21/21), `lint-reading-level` (21 pages within caps), `lint-claims-manifest`, `lint-license-provenance`; `make build` 0; `make snapshot-update` refreshed + `methodology-snapshots` 72/72; full `make test` shows only the 14 pre-existing 9-series human-gate reds (zero regressions).
