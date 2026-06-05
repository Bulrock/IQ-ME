---
id: 7-3-full-ru-methodology-corpus-translation-30-pages
title: "Story 7.3: Full RU methodology corpus translation (30 pages)"
status: done
---

# Story 7.3: Full RU methodology corpus translation (30 pages)

## Story

As a **Russian-speaking reader / citer**,
I want **the full ~30-page methodology corpus mirrored in Russian with block-level content-key parity to EN enforced at build time, scaffolded now and authored in clinical-register-aware Russian by the Gate-9c reviewer-of-record when Gate 9c closes**,
so that **measurement equivalence as a build-time invariant (Innovation #7) holds for RU and Russian-language Wikipedia / academic / community citations become possible (Journey 5)**.

## Acceptance Criteria

> **Epic-7 dev-phase decision (infra-now, content-gated-on-9c/9d) — load-bearing for every AC below.** Gate 9c (the named RU clinical-register translator) is still `backlog`. Per the user-approved decision, this story builds **all mechanically-buildable infrastructure** (the full RU file-tree mirror, parity frontmatter, build-pipeline wiring, lints, tests) but DOES NOT fabricate human clinical-register Russian prose. RU pages ship as **parity-aware EN-placeholder scaffolds** carrying machine-readable `translationStatus: "in-progress"` + `reviewerHandle: "@TBD-ru-reviewer"`; full key/file parity passes lints while the placeholder nature surfaces via `translationStatus` and the `data-translation-status="in-progress"` body attr. No human authorship is faked. The Gate-9c reviewer later overwrites bodies + flips `translationStatus`/`reviewer`/`reviewerHandle` without any structural change.

1. **AC-1 (RU file-tree mirror with parity frontmatter):** Every EN methodology page under `src/content/methodology/en/**/*.md` (the current ~30-page corpus from Epic 5) has a counterpart at the identical relative path under `src/content/methodology/ru/**/*.md`. Each RU page carries valid frontmatter (passing `lint-frontmatter.mjs`) with: `reviewer: "TBD"`, `reviewerHandle: "@TBD-ru-reviewer"`, `lastReviewed:` (the scaffold date), `sourceHashEN:` set to the SHA256 of the EN counterpart's **body** (the markdown after the closing frontmatter `---`, `\n`-joined, UTF-8 — the exact contract `tools/build-methodology.mjs` `enSourceHashFor()` computes), `slug:` identical to the EN page, and `translationStatus: "in-progress"`. The `src/content/methodology/ru/.gitkeep` placeholder is removed once real pages exist.
2. **AC-2 (block-level parity, non-stale at landing):** Every RU page has a matching EN page (no orphan RU pages, no missing RU counterparts for EN pages). Because each RU `sourceHashEN` equals the current EN body SHA256, the build computes `isStale=false` at landing (no `data-translation-stale="true"`, hatnote stays CSS-hidden). `tools/lint-translation-parity.mjs` passes (its existing defensive Phase-2 check — `sourceHashEN` present + 64-hex — now exercises real RU content; the *full-coverage* parity graduation with orphan/stale enforcement is Story 7.5b, which this scaffold must be clean against in advance). `make build` renders every RU page with `data-translation-status="in-progress"` on the body (via the already-wired `isInProgress` branch in `build-methodology.mjs`).
3. **AC-3 (CODEOWNERS + masthead reviewer — GATED, stays @TBD):** Because Gate 9c has not closed and no real RU reviewer-of-record is named, `.github/CODEOWNERS` is **NOT** modified — `src/content/methodology/ru/**` stays owned by `@TBD-ru-reviewer` (the intentional un-resolvable handle that signals reviewer-of-record is still open, per the CODEOWNERS header contract). The masthead (Story 4.6) renders `reviewer: TBD` / `@TBD-ru-reviewer` on every RU page. A clear note in Dev Notes + the future Story 7.6 sign-off doc records that the `@TBD-ru-reviewer → @<real-handle>` replacement is the Gate-9c close deliverable, not this story's. Do NOT invent a GitHub handle.
4. **AC-4 (tests — RU mirror parity + build attr):** A test (`tests/unit/tools/translation-mirror-ru.test.mjs` or equivalent under the project's test convention) asserts: (a) every EN methodology page has a RU counterpart at the same relative path; (b) every RU page's `sourceHashEN` equals `SHA256(EN body)` for its counterpart (non-stale); (c) every RU page frontmatter carries `translationStatus: "in-progress"` + `reviewerHandle: "@TBD-ru-reviewer"`; (d) `make build` output for a sampled RU page contains `data-translation-status="in-progress"` and does NOT contain `data-translation-stale="true"`. If a generator script is used to produce the mirror, it is committed under `tools/` and is idempotent (re-running produces byte-identical output).
5. **AC-5 (no contract regression):** `make test` green; `make lint` green including `lint-frontmatter`, `lint-translation-parity`, `lint-reading-level` (RU calibration is Story 7.5a — until then the reading-level lint must remain green for RU pages, which it is while RU bodies are EN placeholders measured under the EN metric, OR RU pages are excluded from reading-level until 7.5a; pick the option that keeps the gate green and document it), `lint-glossary`, `lint-claims-manifest`. `make build` succeeds and is deterministic (re-run byte-stable). No EN page, i18n bundle, or app-module byte budget is disturbed. If any new CI job is needed for the new test, add a dedicated job to `.github/workflows/pr-checks.yml` (per lesson-2026-06-03-001 — the matrix does NOT greedy-glob).

## Tasks / Subtasks

- [x] **Task 1: RU file-tree mirror generator + scaffold** (AC: 1, 2)
  - [x] Author an idempotent generator (`tools/scaffold-translation-mirror.mjs` or inline) that, for each EN page, writes the RU counterpart with adjusted frontmatter (`reviewer: "TBD"`, `reviewerHandle: "@TBD-ru-reviewer"`, `lastReviewed`, `sourceHashEN = SHA256(EN body)`, `translationStatus: "in-progress"`, identical `slug`) and the EN body as placeholder content.
  - [x] Remove `src/content/methodology/ru/.gitkeep`; commit the generated RU tree.
- [x] **Task 2: verify parity + build wiring** (AC: 2)
  - [x] Run `tools/lint-translation-parity.mjs` and `make build`; confirm RU pages render `data-translation-status="in-progress"`, `isStale=false`.
- [x] **Task 3: CODEOWNERS gate note (no mutation)** (AC: 3)
  - [x] Confirm `.github/CODEOWNERS` RU entries remain `@TBD-ru-reviewer`; add no real handle. Record the Gate-9c-close deliverable in Dev Notes.
- [x] **Task 4: tests** (AC: 4)
  - [x] `tests/unit/tools/translation-mirror-ru.test.mjs` — parity + sourceHashEN match + translationStatus + build-attr assertions. Wire a `pr-checks.yml` job if not covered by an existing node-test job.
- [x] **Task 5: regression gate** (AC: 5)
  - [x] `make test` / `make lint` / `make build` green + deterministic; reading-level gate green for RU (document the chosen approach).

## Dev Notes

- **Infra is already wired — do not rebuild it.** `tools/build-methodology.mjs` already computes `enSourceHashFor()` (SHA256 of EN body), sets `data-translation-stale="true"` when `enHash !== fm.sourceHashEN`, and sets `data-translation-status="in-progress"` when `lang !== "en" && fm.translationStatus === "in-progress"`. This story only *populates content* that exercises those branches. The stale-translation hatnote DOM is always emitted (CSS-hidden unless stale).
- **`sourceHashEN` canonicalization (load-bearing):** `SHA256` over the EN page **body** = everything after the closing `---` of frontmatter, split on `/\r?\n/` and re-joined with `\n`, UTF-8. Match `build-methodology.mjs:218-227` exactly so `isStale=false` at landing and Story 7.5b's full-coverage parity check stays green.
- **Why EN-placeholder bodies, not machine translation:** Epic-7 AC says RU pages are "authored in clinical-register-aware Russian by the Gate-9c translator (not translated from EN by AI or maintainer)." Gate 9c is `backlog`. The dev-phase decision forbids fabricating that prose. EN-placeholder bodies + `translationStatus: "in-progress"` give full structural/key parity (build-time invariant holds) while the `translationStatus` marker + `data-translation-status` attr make the placeholder nature machine-observable. The Gate-9c reviewer later overwrites bodies and flips `translationStatus`/`reviewer`/`reviewerHandle` — zero structural churn.
- **CODEOWNERS stays @TBD (AC-3):** The CODEOWNERS header explicitly says `@TBD-*` handles are intentionally un-resolvable and must NOT be replaced until the Gate is documented closed in CHANGELOG.md. Gate 9c is open → no change here. The replacement is Story 7.6 / Gate-9c-close work.
- **Parity-graduation split:** Full-coverage `lint-translation-parity` (orphan + stale enforcement) graduates in Story 7.5b; reading-level RU calibration is Story 7.5a. 7.3 ships the *content scaffold* those two gates will police. 7.3 must therefore leave the scaffold parity-clean and reading-level-green in advance.
- **Files:** `src/content/methodology/ru/**/*.md` (NEW, ~30 pages), `src/content/methodology/ru/.gitkeep` (REMOVE), `tools/scaffold-translation-mirror.mjs` (NEW, optional but recommended — idempotent), `tests/unit/tools/translation-mirror-ru.test.mjs` (NEW), possibly `.github/workflows/pr-checks.yml` (new job). Do NOT touch `src/content/methodology/en/**`, `.github/CODEOWNERS`, i18n bundles.

### Carry-forward lessons

- lesson-2026-06-03-001 (high): pr-checks.yml wires specs/tests per-job, NOT via greedy glob. Apply: if the new RU-mirror test isn't picked up by an existing node-test job, add a dedicated `pr-checks.yml` job and verify with `grep <test-filename> .github/workflows/pr-checks.yml` before marking the task done.
- lesson-2026-06-03-002 (high): verify regression provenance with a baseline diff before labeling pre-existing vs introduced. Apply: if any lint/test is red after scaffolding, run `git diff main -- <file>` / baseline checkout before claiming it's pre-existing — RU content is net-new so most failures will be self-inflicted.
- lesson-2026-05-20-010 (medium): design-equivalent extensions OK when observable behavior matches the AC intent. Apply: the AC names `tools/lint-translation-parity.mjs` "full-coverage mode" but the actual graduation is Story 7.5b — 7.3 satisfies the AC's *observable intent* (RU scaffold present, parity-clean, build attrs correct), documenting the split here, not by prematurely flipping 7.5b's lint logic.
- lesson-2026-05-20-012 (low): pre-commit/commit-msg hooks must run sub-10ms (bash+awk on canonical YAML). Apply: not directly in scope (no hook changes), but any frontmatter the generator emits must stay ADR-0014 canonical (single-line scalars) so existing hooks parse it.
- lesson-2026-05-20-011 (medium): a story shipping an affordance for its own flow can self-exercise it. Apply: the RU scaffold self-exercises the `translation-in-progress` build branch that Epic-5/Story-5.1 planted — capture a build-output sample showing `data-translation-status="in-progress"` as live evidence in Completion Notes.

### Project Structure Notes

- Methodology corpus is surface-organized under `src/content/methodology/<lang>/`; RU mirrors the EN tree path-for-path. No structural variance. Generator (if used) lives in `tools/` alongside the other corpus tools.

### References

- [Source: epics.md#Story-7.3] — AC source (RU 30-page corpus, parity, reviewer-of-record).
- [Source: tools/build-methodology.mjs#218-258] — `enSourceHashFor` / `isStale` / `isInProgress` contract (already wired).
- [Source: tools/lint-translation-parity.mjs] — Phase-2 defensive `sourceHashEN` validation; full coverage graduates in 7.5b.
- [Source: .github/CODEOWNERS] — `@TBD-ru-reviewer` un-resolvable-handle contract (do not replace pre-Gate-9c).
- [Source: project memory project_iqme_epic7_infra_now_decision] — infra-now / stub-content decision.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- RU corpus mirror scaffolded (35 pages, EN-placeholder bodies + translationStatus:in-progress + sourceHashEN parity); idempotent generator tools/scaffold-translation-mirror.mjs (reused by 7.4). CODEOWNERS left @TBD-ru-reviewer (Gate-9c-gated). Cross-story fixes (Option A): methodology-pages-ru budget 30 to 45 + pin; parity-coverage assertion post-RU; 35 RU snapshots committed (EN byte-identical). make test 1069 pass 0 fail 1 skip; make lint + make build exit 0.

### File List

- tools/scaffold-translation-mirror.mjs
- BUDGETS.json
- tests/unit/tools/translation-mirror-ru.test.mjs
- tests/scaffold/cognitive-load-budget.test.mjs
- tests/scaffold/lint-translation-parity-coverage.test.mjs
- src/content/methodology/ru/**/*.md (35 RU mirror pages)
- tests/snapshots/methodology/ru/**/*.html (35 RU snapshots)

## Specialist Self-Review

## Specialist Self-Review — Story 7-3 (RU methodology corpus mirror, infra-now scaffold)

**Decisions made:**
- Implemented the RU corpus as a parity-aware EN-placeholder scaffold via a committed idempotent generator (`tools/scaffold-translation-mirror.mjs`), NOT machine translation — honoring the Epic-7 infra-now decision (human RU clinical-register prose is gated on Gate 9c, still backlog). Each RU page mirrors its EN counterpart path-for-path with frontmatter `reviewer:"TBD"`, `reviewerHandle:"@TBD-ru-reviewer"`, `translationStatus:"in-progress"`, and `sourceHashEN`=SHA256(EN body) computed byte-identically to `build-methodology.mjs` `enSourceHashFor`. Bodies are the EN source verbatim (placeholder) so block-level parity holds; the Gate-9c reviewer later overwrites bodies + flips status with zero structural churn.
- The generator is parameterized by `--langs` so Story 7.4 (PL) reuses it unchanged.
- `.github/CODEOWNERS` deliberately left at `@TBD-ru-reviewer` (AC-3) — the real-handle replacement is gated on Gate 9c close per the CODEOWNERS un-resolvable-handle contract; no handle invented.

**Alternatives considered:**
- Machine-translating the corpus to Russian — rejected: violates the AC ("not translated from EN by AI or maintainer") and the infra-now decision.
- Committing only a subset of RU pages — rejected: full file/key parity is the build-time measurement-equivalence invariant (Innovation #7); a partial mirror would fail orphan/parity checks.

**Cross-story test impact (the load-bearing part of this story):** Landing net-new RU content broke 8 tests frozen by earlier epics — all self-inflicted (provenance verified by baseline `git stash` run: clean epic/7 = 0 failures; RU content present = the 8). Per a user decision (Option A: "7-3 owns the fixes"), 7-3:
- bumped `methodology-pages-ru` budget 30→45 in BUDGETS.json to mirror the EN budget (45) — RU corpus is 35 pages (30 + glossary sub-pages); updated the frozen pin (`tests/scaffold/cognitive-load-budget.test.mjs:26`).
- updated Story-4.7's `lint-translation-parity-coverage.test.mjs` in-repo assertion: the "no non-EN content yet" WARN no longer fires (RU landed); now asserts the EN source-of-truth line + "RU: N page(s) found" + PL-still-deferred.
- ran `make snapshot-update` and committed the 35 new RU methodology snapshots (drift baselines); EN snapshots verified byte-identical (no diff). This also resolves the `design-system.test.mjs` AC-6 `make snapshot-update`-idempotency polluting the tree mid-aggregate (the originally-confusing aggregate-only failure).
- The frozen-test edits required NO `unfreeze-tests` ceremony: the owning stories (1-5, 4-7) are done, so `tds integrity record --as=engineer` was accepted directly (no active frozen window).

**Framework gotchas avoided:**
- `sourceHashEN` is SHA256 of the page BODY only (after the closing `---`, `\n`-joined) — matched `build-methodology.mjs:218-227` exactly so `isStale=false` at landing (no false stale-hatnote).
- `lint-reading-level` skips RU/PL with a WARN (calibration deferred to Story 7.5a) — EN-placeholder RU bodies don't trip it.
- `lint-frontmatter` tolerates the optional `translationStatus` key (enum complete|in-progress; EN forbidden from in-progress) — RU pages are valid.

**Areas of uncertainty:**
- Whether committing 35 RU HTML snapshots is desired bloat vs. acceptable parity discipline — chose parity (every EN page already has a committed snapshot; consistency + clean-tree on snapshot-update). Auditor may weigh in.
- The parity-coverage test assertion update arguably overlaps Story 7.5b's full-coverage graduation; I limited the change to the in-repo content assertion (not the lint logic), leaving the orphan/stale enforcement graduation to 7.5b.

**Tested edge cases:**
- `tests/unit/tools/translation-mirror-ru.test.mjs` (frozen, test-author): path parity (no missing/orphans), sourceHashEN non-stale, scaffold-marker frontmatter, and a real `build-methodology.mjs` invocation asserting `data-translation-status="in-progress"` + absence of `data-translation-stale="true"`.
- Generator idempotency: re-run produces byte-identical output (EN-source-driven).
