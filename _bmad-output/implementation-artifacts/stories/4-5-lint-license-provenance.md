---
id: 4-5-lint-license-provenance
title: "Story 4.5: lint-license-provenance"
status: done
tds:
  primary_specialist: engineer
  story_tags:
    - lint
    - license
    - provenance
    - trust-artifacts
---

# Story 4.5: lint-license-provenance

## Story

As a **maintainer protecting the load-bearing license chain (NFR24, FR45)**,
I want **every shipped item file (items, methodology pages, locale strings, crisis-resource lists, glossary entries) to trace to an attribution in `LICENSES.md` AND `LICENSES.md` itself to be unmodified between releases except via explicit CHANGELOG entries**,
so that **the ICAR license-chain integrity is mechanically auditable and Tomáš + Karolina can verify license provenance in repository inspection alone**.

This story owns:

1. **`tools/lint-license-provenance.mjs`** — new. Two-phase lint:
   - **Phase 1 (license enumeration):** walks shipped source trees (`src/items/`, `src/content/methodology/**/*.md`, `src/content/i18n/**/*.json` if it exists, `src/content/glossary/**/*.md` if it exists, `src/content/crisis-resources/**/*.json` if it exists). For each file, asserts there is a matching license-class section in `LICENSES.md` covering it. Orphan file → exit 1 with `lint-license-provenance: <file-path>: no LICENSES.md scope entry found`.
   - **Phase 2 (last-modified-hash discipline, NFR24):** computes SHA-256 of `LICENSES.md` body (excluding the `<!-- last-modified-hash: <X> -->` line itself), compares to the declared hash. If they mismatch AND there's no CHANGELOG entry referencing the change → exit 1. **Current state:** the declared hash is `"0".repeat(64)` (placeholder per Story 1-2 + the LICENSES.md comment block); CHANGELOG.md doesn't exist yet (Epic 8 ships it). Solution: this story **flips the placeholder hash to the real current hash** and the lint then enforces "if real hash drifts, fail unless CHANGELOG entry exists OR placeholder remains placeholder".
2. **License-class → file-scope mapping** in `LICENSES.md` itself (Phase 1 inputs):
   - **MIT class** covers: `src/assessment/**`, `src/scoring/**`, `src/css/**`, `src/index.html`, `tools/**`.
   - **Item-pool class (CC-BY-NC-SA):** `src/items/*.svg`, `src/items/item-parameters.json`.
   - **Methodology corpus class (CC-BY-NC-SA):** `src/content/methodology/**/*.md`.
   - **Translated content class (CC-BY-NC-SA):** any non-EN locale content (`src/content/methodology/{ru,pl}/**` — currently `.gitkeep`d, lint handles gracefully).
   - **Glossary class:** `src/content/glossary/**` (currently `.gitkeep`'d).
   - **Locale strings class:** `src/content/i18n/**` (does not yet exist).
   - **Crisis resources class:** `src/content/crisis-resources/**` (does not yet exist).
3. **`docs/license-scope-map.md`** — new. Authoritative machine-readable + human-readable mapping from file-glob → license-class section in `LICENSES.md`. The lint reads this file as its config; LICENSES.md is the human-facing doc.
4. **Real hash population** — replace the `"0".repeat(64)` placeholder in `LICENSES.md` with the real SHA-256.
5. **CHANGELOG.md stub** — create `CHANGELOG.md` with a one-paragraph header explaining its purpose + an empty `## Unreleased` section. Required by the lint's drift discipline. Full CHANGELOG format lands in Epic 8 Story 8.7; this story creates the slot.
6. **Tests** — unit + scaffold tests covering Phase 1 orphan-detection + Phase 2 hash-drift + CHANGELOG-reference behavior.

## Acceptance Criteria

1. **AC-1 (`tools/lint-license-provenance.mjs`):**
   - File at exact path: `tools/lint-license-provenance.mjs`.
   - Stdlib-only (NFR33). Pure ESM (`.mjs`).
   - **Invocation:** `node tools/lint-license-provenance.mjs`.
   - **Phase 1 — orphan file detection:**
     - Load `docs/license-scope-map.md` (parse a YAML or fenced-yaml block defining `class -> [globs]` mapping).
     - For each declared file-glob, expand via stdlib + check all matches are covered.
     - For each shipped path in the repo NOT matching any declared glob → orphan, exit 1 with `lint-license-provenance: <path>: no LICENSES.md scope entry found; either add to docs/license-scope-map.md and LICENSES.md, OR exclude from the lint via docs/license-scope-map.md exclusions`.
     - **Exclusions:** the scope-map has an `exclusions:` list (e.g., `**/.gitkeep`, `**/*.md` if doc files are explicitly out-of-scope). Use sparingly.
   - **Phase 2 — `LICENSES.md` last-modified-hash discipline:**
     - Compute SHA-256 of `LICENSES.md` content with the `<!-- last-modified-hash: <X> -->` line **excluded**.
     - Read the declared hash from the `last-modified-hash:` comment line.
     - If declared == placeholder `"0".repeat(64)`: emit a one-line WARN `lint-license-provenance: WARN LICENSES.md hash placeholder; real hash should be flipped to <actual>`. Exit 0 (don't block — backward-compat with v0.0.1 state).
     - **In this story we flip the placeholder to the real hash** — so after the story, declared == actual, the warn goes away.
     - If declared ≠ actual AND declared ≠ placeholder: check `CHANGELOG.md` for a line referencing `LICENSES.md`. If found → exit 0 (legitimate update). If not → exit 1 with `lint-license-provenance: LICENSES.md hash drift without CHANGELOG.md entry; add a CHANGELOG.md line naming the change before merging`.
   - **Success mode:** exit 0 with summary line `lint-license-provenance: N file(s) attributed; LICENSES.md hash <verified|warned>`.
   - Stdlib-only, ~150 LOC.

2. **AC-2 (`docs/license-scope-map.md`):**
   - File at exact path: `docs/license-scope-map.md`.
   - Contains a fenced YAML block with structure:
     ```yaml
     ---
     classes:
       mit:
         globs: ["src/assessment/**", "src/scoring/**", "src/css/**", "src/index.html", "tools/**"]
         licenses-md-section: "1. App code — MIT"
       item-pool:
         globs: ["src/items/*.svg", "src/items/item-parameters.json"]
         licenses-md-section: "2. Item pool (matrix-reasoning items) — CC-BY-NC-SA 4.0 (or ICAR-author-specified)"
       methodology-corpus:
         globs: ["src/content/methodology/en/**/*.md"]
         licenses-md-section: "3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0"
       translated-content:
         globs: ["src/content/methodology/ru/**", "src/content/methodology/pl/**"]
         licenses-md-section: "4. Translated content — CC-BY-NC-SA 4.0"
       glossary:
         globs: ["src/content/glossary/**"]
         licenses-md-section: "3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0"
     exclusions:
       - "**/.gitkeep"
     ---
     ```
   - The doc body contains explanatory prose describing the contract: glob → class, exclusions, when to add an entry.

3. **AC-3 (`LICENSES.md` hash flip):**
   - Replace the placeholder `last-modified-hash: 0000000000000000000000000000000000000000000000000000000000000000` with the current real SHA-256 of LICENSES.md body (excluding the hash line).
   - The flip is part of this story's commits; the lint runs against the flipped hash and exits 0.

4. **AC-4 (`CHANGELOG.md` stub):**
   - File at exact path: `CHANGELOG.md`.
   - Content:
     ```markdown
     # Changelog

     IQ-ME tracks user-facing changes here per release. Format follows Keep a Changelog conventions
     (additive, removed, fixed, security categories). Full release-tagging discipline + `release.yml`
     automation land in Epic 8 (Story 8.7). This file's slot exists from Epic 4 (Story 4.5) so that
     `lint-license-provenance` has a drift-reference target.

     ## Unreleased

     ### Changed
     - (Story 4.5) `lint-license-provenance` activated; `LICENSES.md` last-modified-hash flipped from placeholder to real SHA-256.
     ```
   - The lint's Phase 2 reads this file to verify hash drift has an accompanying changelog entry.

5. **AC-5 (Makefile + CI integration):**
   - `Makefile` `lint` target adds `node tools/lint-license-provenance.mjs` (after `lint-reading-level` from Story 4-4).
   - `pr-checks.yml`: add `lint-license-provenance` job (mirror Story 4-3 / 4-4 pattern).
   - Update `tests/scaffold/ci-matrix.test.mjs` `EPIC_1_ACTIVE` set to include the new job.

6. **AC-6 (current-state baselines):**
   - Phase 1 against the current repo: 16 items (`src/items/stub-*.svg` × 16) + `src/items/item-parameters.json` + 4 methodology pages + 6 tooling files + dozens of src/scoring/css/assessment files = all covered by the scope map. Exit 0.
   - Phase 2 after hash flip: exit 0.
   - If any orphan file surfaces during baseline, fix `docs/license-scope-map.md` to cover it (not the lint to relax).

7. **AC-7 (tests — TDD coverage):**
   - **`tests/unit/tools/lint-license-provenance.test.mjs`** (NEW): ≥10 tests:
     - happy path: all files covered + hash matches → exit 0
     - orphan file → exit 1 with file path
     - hash drift + CHANGELOG entry → exit 0
     - hash drift + no CHANGELOG entry → exit 1
     - placeholder hash → WARN, exit 0 (backward-compat)
     - exclusions honored (e.g., `.gitkeep` not flagged as orphan)
     - missing `docs/license-scope-map.md` → exit 1 with helpful message
     - malformed YAML in scope-map → exit 1
     - missing `CHANGELOG.md` AND hash drift → exit 1 with "create CHANGELOG.md"
     - missing `CHANGELOG.md` AND no drift → exit 0
   - **`tests/scaffold/lint-license-provenance-coverage.test.mjs`** (NEW): runs lint against in-repo state → exit 0 (after AC-3 hash flip + AC-4 CHANGELOG stub creation).
   - Full `make test` exit 0. `make lint` exit 0.

## Tasks / Subtasks

- [x] **Task 1: TDD red phase for `tools/lint-license-provenance.mjs`** (AC-1, AC-7)
  - [x] Author unit tests with ≥10 failing tests using `mkdtempSync` fixture repos.
- [x] **Task 2: TDD red phase for scaffold coverage** (AC-6, AC-7)
  - [x] Author scaffold test that asserts the in-repo lint passes exit 0 once impl + scope-map + CHANGELOG land.
- [x] **Task 3: Author `docs/license-scope-map.md`** (AC-2)
  - [x] Fenced YAML block + prose. Glob list per AC-2.
- [x] **Task 4: Implement `tools/lint-license-provenance.mjs`** (AC-1)
  - [x] Phase 1 orphan detection + Phase 2 hash discipline. ~150 LOC stdlib-only.
- [x] **Task 5: Author `CHANGELOG.md` stub** (AC-4)
  - [x] One-paragraph header + `## Unreleased` section + Story 4.5 entry.
- [x] **Task 6: Flip `LICENSES.md` hash** (AC-3)
  - [x] Compute SHA-256 of LICENSES.md body (excluding hash line); replace placeholder.
  - [x] Verify lint exits 0 against the flipped state.
- [x] **Task 7: Baseline lint run** (AC-6)
  - [x] `node tools/lint-license-provenance.mjs` exit 0 with no orphans + hash verified.
  - [x] If any orphan surfaces, extend `docs/license-scope-map.md` (not the lint).
- [x] **Task 8: Makefile + CI** (AC-5)
  - [x] Add to `make lint`; activate `pr-checks.yml` job; update `ci-matrix.test.mjs` EPIC_1_ACTIVE.
- [x] **Task 9: Full test + lint pass** (AC-7)
  - [x] `make test` exit 0.
  - [x] `make lint` exit 0.
- [x] **Task 10: Branch + state hygiene**
  - [x] `tds state set --status=review`. Squash to epic/4.

## Dev Notes

### Carry-forward lessons

- **Story 4-3 deferred-state WARN pattern:** placeholder hash → WARN not FAIL. Same shape.
- **Story 4-4 scope-map.md as lint config:** authoring a separate config file for globs keeps the lint code small and the policy auditable.
- **Story 4-1 frontmatter parser:** the scope-map YAML is simpler (no nested mappings beyond list-of-strings); reuse `parseFrontmatter` or write a tiny inline parser.
- **CHANGELOG.md slot:** explicitly Epic-8-deferred per Story 1.6 / Story 8.7. This story creates the FILE only — the format + automation comes later.
- **Lesson `2026-05-19-009`:** activating a CI job is a deferred-validation surface. Verify locally via `make lint` (already covered) and consider workflow-dispatching the PR-checks job from this unmerged ref before story close.

### Source-tree touch list (anticipated)

**New:**
- `tools/lint-license-provenance.mjs`
- `docs/license-scope-map.md`
- `CHANGELOG.md`
- `tests/unit/tools/lint-license-provenance.test.mjs`
- `tests/scaffold/lint-license-provenance-coverage.test.mjs`

**Modified:**
- `LICENSES.md` (hash placeholder → real SHA-256)
- `Makefile` (`lint` target)
- `.github/workflows/pr-checks.yml` (activate job)
- `tests/scaffold/ci-matrix.test.mjs` (EPIC_1_ACTIVE)

### Testing standards

- TDD: failing tests first.
- `node --test` for unit + scaffold.
- Per-test `mkdtempSync` for fixture repos (fake LICENSES.md, fake CHANGELOG, fake scope-map).
- Stdlib-only (NFR33).

### References

- `_bmad-output/planning-artifacts/epics.md` Story 4.5 (lines 1251–1272)
- `LICENSES.md` — current state, placeholder hash
- `tools/lint-trust-artifacts.mjs` — existing related lint that already cross-refs LICENSES.md
- Story 4-3 `tools/lint-frontmatter.mjs` — schema-validator pattern
- Story 4-4 `tools/lint-reading-level.mjs` — markdown-stripping pattern (not needed here but tooling style reference)

## Dev Agent Record

### Agent Model Used

<!-- Populated by engineer at execute-story time -->

### Debug Log References

### Completion Notes List

- lint-license-provenance Phase 1 orphan + Phase 2 NFR24 hash discipline shipped; LICENSES.md placeholder flipped; CHANGELOG.md slot created; 73 files attributed; full make test + make lint green

### File List

- tools/lint-license-provenance.mjs
- docs/license-scope-map.md
- CHANGELOG.md
- tests/unit/tools/lint-license-provenance.test.mjs
- tests/scaffold/lint-license-provenance-coverage.test.mjs
- LICENSES.md
- Makefile
- .github/workflows/pr-checks.yml
- tests/scaffold/ci-matrix.test.mjs

## Specialist Self-Review

# Self-review — Story 4-5 lint-license-provenance

## Scope delivered

- `tools/lint-license-provenance.mjs` (~270 LOC, stdlib-only, ESM)
- `docs/license-scope-map.md` (YAML class→glob mapping + prose contract)
- `CHANGELOG.md` (stub per AC-4)
- `LICENSES.md` placeholder hash flipped → `515ffe6f8a8c977eba47c8624269ee3432a67909c6089f0bea55cbdc461be56e`
- `Makefile` `lint` target wired
- `.github/workflows/pr-checks.yml` `lint-license-provenance` job activated
- `tests/scaffold/ci-matrix.test.mjs` `EPIC_1_ACTIVE` extended
- 15 unit tests (`tests/unit/tools/lint-license-provenance.test.mjs`)
- 1 scaffold coverage test (`tests/scaffold/lint-license-provenance-coverage.test.mjs`)

## AC traceability

- **AC-1 (`tools/lint-license-provenance.mjs`):** Phase 1 orphan detection, Phase 2 hash discipline, placeholder WARN, drift+CHANGELOG path, summary line. Stdlib-only. PASS.
- **AC-2 (`docs/license-scope-map.md`):** fenced YAML block + prose. Hand-rolled YAML subset parser inside the lint to honor NFR33. PASS.
- **AC-3 (hash flip):** placeholder `0…0` → real SHA-256. Determinism verified (two consecutive runs identical). PASS.
- **AC-4 (`CHANGELOG.md`):** stub with `## Unreleased` + Story 4.5 entry. PASS.
- **AC-5 (Makefile + CI):** lint target line added after `lint-reading-level`; pr-checks job activated; ci-matrix test updated. PASS.
- **AC-6 (current-state baselines):** 73 files attributed, exit 0, hash verified. No orphans surfaced. PASS.
- **AC-7 (tests):** 15 unit tests pass (covers all enumerated cases: happy / orphan / drift+changelog / drift+no-changelog / placeholder WARN / exclusions / missing scope-map / malformed YAML / no-drift+no-CHANGELOG / summary / nested glob / hash-line exclusion / missing LICENSES.md). 1 scaffold test passes against in-repo state. `make test` 606 pass / 1 skipped. `make lint` exit 0.

## Design notes

- **Scope-map drives the walk.** Rather than walking the whole repo, the lint derives scan roots from the static prefixes of each class's globs. This keeps `tests/`, `_bmad-output/`, `.github/`, `node_modules/`, `dist/` outside the licensing surface (the `notes` section of `docs/license-scope-map.md` documents this).
- **Hand-rolled YAML subset parser.** NFR33 stdlib-only. Supports `classes:` map of `globs:` (block-list or inline-array) + `licenses-md-section: <string>`, and top-level `exclusions:` list. Errors are clear (line number + raw line on parse failure).
- **Glob matcher.** Hand-written `globToRegex` supporting `**` (any depth, including zero segments via `(?:.*/)?` for `**/x` and `(/.*)?` for `x/**`), `*` (no slash), `?`, literals. Verified by the nested-deep test case.
- **Hash discipline.** SHA-256 of body excluding ANY line matching `^<!-- last-modified-hash:`. The placeholder all-zeros path is the v0.0.1 backward-compat WARN-not-FAIL surface; once flipped (this story), the lint enforces strict drift+CHANGELOG.

## Lessons applied

- **Story 4-3 deferred-state WARN pattern** — placeholder hash emits WARN, never blocks. The flip is part of the same story.
- **Story 4-4 scope-map.md as lint config** — separating the policy data (`docs/license-scope-map.md`) from the lint code (`tools/lint-license-provenance.mjs`) keeps both readable and auditable.
- **Lesson 2026-05-19-009** — activating a CI job is a deferred-validation surface; verified locally via `make lint` exit 0 against the post-flip state.

## Risks / follow-ups

- **CHANGELOG.md format graduation.** This story creates the file; Epic 8 Story 8.7 wires release-tag automation. The lint only checks for a line referencing `LICENSES.md`; full Keep-a-Changelog discipline is out of scope.
- **Future locale additions** require both a class entry in `docs/license-scope-map.md` AND a `## N. Translated content` reference in `LICENSES.md`. The lint surfaces orphans loudly; the scope-map's `notes` section documents the playbook.
- **Drift surface area.** Any LICENSES.md edit changes the body hash, requiring a CHANGELOG entry. Documented inline in `docs/license-scope-map.md`.

## Halt conditions hit

None. Baseline lint produced zero orphans on first run; hash computation deterministic across two consecutive runs.
