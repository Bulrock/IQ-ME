---
id: 8-7-changelog-md-format-release-yml-automation-contributor-credit-by-handle
title: "Story 8.7: CHANGELOG.md format + release.yml automation + contributor credit by handle"
status: ready-for-dev
---

# Story 8.7: CHANGELOG.md format + release.yml contributor-credit automation

## Story

As a **contributor whose PR landed (Marek journey)**,
I want **my GitHub handle credited in the per-release `CHANGELOG.md` entry, with no external tracking or social-graph integration (FR53)**,
so that **contribution is visible and recognized in the project's permanent record without contaminating the zero-telemetry posture**.

## Acceptance Criteria

> **Scope note — two distinct changelogs + infra-now.** The root `CHANGELOG.md` (Keep-a-Changelog) is the DEV/release changelog this story finalizes. The corpus `/reference/changelog/` page (Epic 5, hand-authored) is the citation-facing CORPUS-version changelog — a different artifact. The epics' "build renders root CHANGELOG into the corpus page" (AC group 3) conflates the two and would replace hand-authored citation content + risk byte-stable; this story instead **cross-references** them (the corpus changelog page notes the root CHANGELOG as the release record) and leaves auto-render out of scope. The release.yml contributor-credit step is authored structurally but gated INERT in dev (no live `git log` extraction / no PR opened until launch, Epic 10).

1. **AC-1 (CHANGELOG.md Keep-a-Changelog format):** the root `CHANGELOG.md` is finalized to the Keep-a-Changelog format — a header linking the convention, an `## [Unreleased]` section, and the six change categories (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`) used as the entry template. Each released entry carries the release date and the corpus-version + app-version (when separate) and a `### Contributors` subsection listing GitHub handles for that release. The existing Story-4.5 `lint-license-provenance` entry is preserved, and the initial `v0.1.0` release entry is recorded (date + the existing Epic-3/5 substance + a Contributors subsection).
2. **AC-2 (release.yml contributor-credit step):** `release.yml` gains a `contributor-credit` step that extracts contributor GitHub handles from the merge-commit log between the previous release tag and the current tag (`git log <prev>..<cur>`), deduplicates, alphabetizes, and appends them to the new `CHANGELOG.md` entry's `### Contributors` subsection. The step opens a release-prep PR for the maintainer to review the auto-generated entry BEFORE tagging (it does NOT silently rewrite CHANGELOG.md on the release runner). Gated INERT behind a launch repo var (mirror the 8.2/8.3 `vars.IQME_LIVE_*` pattern).
3. **AC-3 (no external tracking — FR53):** the contributor-credit flow uses ONLY `git log` + the GitHub Actions context — no third-party API, no analytics, no social-graph lookup. No per-release email-notification path is added (updates reach users via GitHub Discussions + repo release notifications — Story 8.8); CHANGELOG.md states this explicitly.
4. **AC-4 (cross-reference + test + no regression):** the corpus `/reference/changelog/` page (en, at least) cross-references the root `CHANGELOG.md` as the canonical release record (a short note + relative link), so a reader of the citation-facing changelog can find the dev/release changelog. A NEW `tests/scaffold/changelog-release.test.mjs` asserts: CHANGELOG.md has the Keep-a-Changelog header + `[Unreleased]` + the six categories + a `### Contributors` subsection + the preserved Story-4.5 entry + a `v0.1.0` entry; `release.yml` has the `contributor-credit` step using `git log` (no third-party API token) + the release-prep-PR review gate + the `vars.IQME_LIVE_*` inert gate. `make test`/`make lint`/`make build` green.

## Tasks / Subtasks

- [ ] **Task 1: Finalize CHANGELOG.md Keep-a-Changelog format** (AC: 1, 3)
  - [ ] Header (Keep-a-Changelog link) + `## [Unreleased]` + the six categories template; record the `v0.1.0` release entry (date + corpus-version/app-version + the existing Epic-3/5 substance) with a `### Contributors` subsection; preserve the Story-4.5 lint-license-provenance entry; state the no-email/no-tracking posture (FR53).
- [ ] **Task 2: release.yml contributor-credit step** (AC: 2, 3)
  - [ ] Add a `contributor-credit` step: `git log <prev-tag>..<cur-tag>` → extract handles → dedup → alphabetize → append to the new CHANGELOG.md entry's `### Contributors`; open a release-prep PR for maintainer review before tagging; gate live extraction INERT behind `vars.IQME_LIVE_*`; use only git log + Actions context (no third-party API).
- [ ] **Task 3: Cross-reference the corpus changelog page to root CHANGELOG.md** (AC: 4)
  - [ ] Add a short note + relative link from `src/content/methodology/en/reference/changelog/index.md` to the root `CHANGELOG.md` (release record), keeping the page's markdown-subset + byte-stable build intact.
- [ ] **Task 4 (test-author phase): Add changelog-release structural test** (AC: 4)
  - [ ] `tests/scaffold/changelog-release.test.mjs`: CHANGELOG.md format (header + Unreleased + 6 categories + Contributors + preserved + v0.1.0); release.yml contributor-credit step (git log, release-prep-PR gate, no third-party token, inert gate).
- [ ] **Task 5: Regression gate** (AC: 4)
  - [ ] `make test`/`make lint`/`make build` green + deterministic; baseline-diff any ambiguous failure (lesson-2026-06-03-002).

## Dev Notes

- **CHANGELOG.md today** (Epic-4 slot, ~510B): has a header, `## Unreleased`, `### Changed` with the Story-4.5 entry. Finalize to full Keep-a-Changelog: keep the header (expand the convention link), keep `## [Unreleased]` (bracket form is conventional), add the six categories as the template, add the `v0.1.0` release entry (date `2026-05`, the Epic-3 stub-pages + Epic-5 substance, `### Contributors` listing the maintainer handle `@Bulrock` as the v0.1.0 contributor — real, not fabricated), preserve the 4.5 entry under Unreleased/Changed. **Do NOT invent contributor handles** (lesson-2026-06-04-002 spirit) — only real handles (the maintainer); the auto-extraction populates real handles at launch.
- **release.yml contributor-credit:** append a step to (or after) the release jobs that runs `git log --format='%an <%ae>' <prev>..<cur>` style extraction mapped to GitHub handles (via the commit author / the GitHub Actions `github` context), dedup + sort, and writes the `### Contributors` block into the new CHANGELOG entry, then opens a release-prep PR (`gh pr create`) for review. Gate the live run behind `vars.IQME_LIVE_*` (inert in dev). FR53: no third-party API — `git log` + Actions context only. Production source — committed (git tamper-evidence), NOT `tds integrity record`'d.
- **Two-changelog distinction (AC-3/AC-4):** root `CHANGELOG.md` = dev/release changelog (Keep-a-Changelog, contributor credit). Corpus `/reference/changelog/index.md` = citation-facing corpus-version changelog (hand-authored, Epic 5). Do NOT auto-render root into the corpus page (would replace citation content + risk byte-stable); cross-reference instead.
- **Files:** `CHANGELOG.md` (finalize), `.github/workflows/release.yml` (contributor-credit step), `src/content/methodology/en/reference/changelog/index.md` (cross-ref note), `tests/scaffold/changelog-release.test.mjs` (NEW, test-author). The corpus-page edit must keep the markdown-subset + byte-stable build green (run `make build`).
- **No frozen-test graduation** — no existing test asserts CHANGELOG.md format (lint-license-provenance only uses it as a hash drift-reference target, which this story doesn't disturb).

### Carry-forward lessons

- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: CHANGELOG/release.yml/corpus-page edits are net-new; baseline-diff before labeling any failure pre-existing (esp. byte-stable after the corpus-page edit).
- lesson-2026-06-04-002 (high): never fabricate specifics in placeholder content. Apply: the `### Contributors` subsection lists ONLY real handles (the maintainer `@Bulrock`); the auto-extraction fills real handles at launch — do not invent contributor names.
- lesson-2026-06-03-001 (medium here): CI wires per-spec. Apply: the new `changelog-release.test.mjs` is a `tests/scaffold/` test auto-discovered by `make test` — no pr-checks job needed.

### Project Structure Notes

- `CHANGELOG.md` at repo root; release workflow under `.github/workflows/`; corpus changelog page under `src/content/methodology/en/reference/changelog/`. No structural variance.

### References

- [Source: epics.md#Story-8.7] — AC source (CHANGELOG format, release.yml automation, contributor credit, FR53).
- [Source: CHANGELOG.md] — current Epic-4 slot.
- [Source: src/content/methodology/en/reference/changelog/index.md] — the citation-facing corpus changelog (distinct artifact).
- [Source: .github/workflows/release.yml] — the workflow gaining the contributor-credit step.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
