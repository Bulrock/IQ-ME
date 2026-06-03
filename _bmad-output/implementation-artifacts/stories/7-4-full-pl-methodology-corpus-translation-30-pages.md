---
id: 7-4-full-pl-methodology-corpus-translation-30-pages
title: "Story 7.4: Full PL methodology corpus translation (30 pages)"
status: ready-for-dev
---

# Story 7.4: Full PL methodology corpus translation (30 pages)

## Story

As a **Polish-speaking reader / citer**,
I want **the full ~30-page methodology corpus mirrored in Polish with block-level content-key parity to EN enforced at build time, scaffolded now and authored in clinical-register-aware Polish by the Gate-9d reviewer-of-record when Gate 9d closes**,
so that **the same measurement-equivalence invariant holds for PL and Polish-language Wikipedia external-link citation (Journey 5: Karolina) is operational**.

## Acceptance Criteria

> **Epic-7 dev-phase decision (infra-now, content-gated-on-9c/9d).** Identical posture to Story 7.3 (RU), applied to Polish (independent failure isolation per Mary). Gate 9d (named PL clinical-register translator) is `backlog`. This story scaffolds the full PL file-tree mirror as parity-aware EN-placeholder pages (`translationStatus: "in-progress"`, `reviewerHandle: "@TBD-pl-reviewer"`); no human PL prose fabricated. The infra (generator, build wiring, lints, snapshots) is reused from Story 7.3 — `tools/scaffold-translation-mirror.mjs --langs=pl`.

1. **AC-1 (PL file-tree mirror with parity frontmatter):** Every EN methodology page under `src/content/methodology/en/**/*.md` has a counterpart at the identical relative path under `src/content/methodology/pl/**/*.md`, each with valid frontmatter (passing `lint-frontmatter.mjs`): `reviewer: "TBD"`, `reviewerHandle: "@TBD-pl-reviewer"`, `lastReviewed:` (scaffold date), `sourceHashEN:` = SHA256 of the EN counterpart body (the `build-methodology.mjs` `enSourceHashFor` contract), `translationStatus: "in-progress"`, identical `slug`. The `src/content/methodology/pl/.gitkeep` is removed. Produced by the Story-7.3 generator with `--langs=pl`.
2. **AC-2 (block-level parity, non-stale, in-progress render):** Every PL page has a matching EN page (no orphans/missing). Each PL `sourceHashEN` equals the current EN body SHA256 → `isStale=false` (no `data-translation-stale="true"`). `lint-translation-parity.mjs` passes. `make build` renders every PL page with `data-translation-status="in-progress"`; the already-wired `translation-in-progress-stub` CSS (Story 5.1, selects on `[data-translation-status="in-progress"]`) composes the stub affordance, and the always-emitted `stale-translation-hatnote` provides the "View source EN page" link (FR-discoverability of the EN source for unfinished PL pages). Full body-suppression rendering remains a deferred content-completion refinement (per `build-methodology.mjs` comment) — out of scope for the scaffold.
3. **AC-3 (CODEOWNERS + masthead — GATED, stays @TBD):** Gate 9d has not closed; `.github/CODEOWNERS` is NOT modified — `src/content/methodology/pl/**` stays owned by `@TBD-pl-reviewer`. Masthead renders `reviewer: TBD` / `@TBD-pl-reviewer`. The `@TBD-pl-reviewer → @<real-handle>` replacement is the Gate-9d-close deliverable, not this story's. Do NOT invent a handle.
4. **AC-4 (tests — PL mirror parity + build attr):** A test (`tests/unit/tools/translation-mirror-pl.test.mjs`, or extend the RU mirror test to cover both locales parametrically) asserts: (a) every EN page has a PL counterpart at the same relative path; (b) every PL `sourceHashEN` === SHA256(EN body) (non-stale); (c) every PL frontmatter carries `translationStatus: "in-progress"` + `reviewerHandle: "@TBD-pl-reviewer"` + `reviewer: "TBD"`; (d) `make build` output for a sampled PL page contains `data-translation-status="in-progress"` and not `data-translation-stale="true"`.
5. **AC-5 (no contract regression — Story-7.3 cross-story-fix pattern):** `make test` green; `make lint` green; `make build` deterministic. Landing PL content trips the SAME absence-asserting frozen tests as 7.3 did — apply the established Option-A fixes: (i) bump `methodology-pages-pl` budget 30→45 in BUDGETS.json (mirror EN) + the frozen pin (`tests/scaffold/cognitive-load-budget.test.mjs`); (ii) update the `lint-translation-parity-coverage.test.mjs` PL assertion from "PL not yet authored / Epic 7" to "PL: N page(s) found" (the no-non-EN-WARN assertion already removed by 7.3); (iii) run `make snapshot-update` and commit the ~35 new PL methodology snapshots (EN+RU snapshots verified byte-identical). Verify provenance with a baseline diff before labeling any failure pre-existing (lesson-2026-06-03-002 — PL content is net-new, failures are self-inflicted).

## Tasks / Subtasks

- [ ] **Task 1: PL file-tree mirror via generator** (AC: 1, 2)
  - [ ] Run `node tools/scaffold-translation-mirror.mjs --langs=pl --date=<today>`; remove `src/content/methodology/pl/.gitkeep`.
- [ ] **Task 2: verify parity + build wiring** (AC: 2)
  - [ ] `lint-translation-parity.mjs` + `make build`; confirm PL pages render `data-translation-status="in-progress"`, `isStale=false`, stub CSS composes.
- [ ] **Task 3: CODEOWNERS gate note** (AC: 3)
  - [ ] Confirm `.github/CODEOWNERS` PL entries stay `@TBD-pl-reviewer`; no real handle.
- [ ] **Task 4: tests** (AC: 4)
  - [ ] PL mirror parity test (new or parametric extension of the RU test).
- [ ] **Task 5: regression gate + cross-story fixes** (AC: 5)
  - [ ] PL budget 30→45 + pin; parity-coverage PL assertion; `make snapshot-update` + commit PL snapshots; `make test`/`make lint`/`make build` green.

## Dev Notes

- **Reuses Story 7.3 infra wholesale.** Generator `tools/scaffold-translation-mirror.mjs` already supports `--langs=pl` and emits `@TBD-pl-reviewer`. Build wiring (`isStale`/`isInProgress`), `lint-frontmatter` optional `translationStatus`, `lint-reading-level` RU/PL skip (calibration in 7.5a), and the `translation-in-progress-stub` CSS are all in place.
- **Cross-story-fix precedent (7.3):** landing non-EN content breaks the same frozen absence-asserting tests. 7.3 already removed the "no non-EN content yet" WARN assertion and bumped `methodology-pages-ru`. For PL, bump `methodology-pages-pl` (30→45) + its pin line, and update the parity-coverage PL summary assertion. The owning stories (1-5, 4-7) are done → `tds integrity record --as=engineer` accepted directly (no unfreeze ceremony).
- **`make snapshot-update`** now emits EN+RU+PL (105 pages once PL lands); commit the new PL snapshots. The `design-system.test.mjs` AC-6 idempotency check requires the committed snapshots match a fresh snapshot-update (byte-identical) — so commit them or the aggregate run dirties the tree.
- **Files:** `src/content/methodology/pl/**/*.md` (NEW ~35), `src/content/methodology/pl/.gitkeep` (REMOVE), `tests/unit/tools/translation-mirror-pl.test.mjs` (NEW or parametric), `tests/snapshots/methodology/pl/**/*.html` (NEW ~35), `BUDGETS.json` (pl budget), `tests/scaffold/cognitive-load-budget.test.mjs` (pin), `tests/scaffold/lint-translation-parity-coverage.test.mjs` (PL assertion). Do NOT touch EN/RU content, `.github/CODEOWNERS`.

### Carry-forward lessons

- lesson-2026-06-03-002 (high): verify regression provenance with a baseline diff. Apply: PL content is net-new; run `git stash`/`git diff main` before labeling any test failure pre-existing.
- lesson-2026-06-03-001 (high): pr-checks.yml wires tests per-job, not via greedy glob. Apply: if a new PL mirror test file is added, verify it's covered by an existing node-test job or add a dedicated `pr-checks.yml` job (`grep <filename> .github/workflows/pr-checks.yml`).
- lesson-2026-05-20-010 (medium): design-equivalent extensions OK when observable behavior matches AC intent. Apply: parametrically extending the RU mirror test to cover PL satisfies AC-4 intent without a duplicate file.
- lesson-2026-05-20-011 (medium): a story can self-exercise the affordance it ships. Apply: PL scaffold self-exercises the `translation-in-progress` build + stub-CSS path; capture a build-output sample in Completion Notes.
- lesson-2026-05-20-012 (low): keep emitted frontmatter ADR-0014 canonical (single-line scalars) so hooks parse sub-10ms. Apply: the generator already emits canonical scalars.

### Project Structure Notes

- PL mirrors the EN tree path-for-path under `src/content/methodology/pl/`. No structural variance from RU.

### References

- [Source: epics.md#Story-7.4] — AC source (PL 30-page corpus, parity, reviewer-of-record, in-progress stub).
- [Source: stories/7-3-full-ru-methodology-corpus-translation-30-pages.md] — RU precedent + generator + cross-story-fix pattern.
- [Source: tools/scaffold-translation-mirror.mjs] — generator (`--langs=pl`).
- [Source: src/css/components/translation-in-progress-stub.css] — Story-5.1 stub CSS, selects on `[data-translation-status="in-progress"]`.
- [Source: project memory project_iqme_epic7_infra_now_decision] — infra-now / stub-content decision.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
