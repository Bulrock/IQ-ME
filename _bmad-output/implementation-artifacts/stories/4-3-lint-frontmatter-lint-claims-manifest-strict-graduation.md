---
id: 4-3-lint-frontmatter-lint-claims-manifest-strict-graduation
title: "Story 4.3: lint-frontmatter + lint-claims-manifest --strict graduation"
status: review
tds:
  primary_specialist: engineer
  story_tags:
    - lint
    - schema-validation
    - claims-manifest
---

# Story 4.3: lint-frontmatter + lint-claims-manifest --strict graduation

## Story

As a **maintainer enforcing innovation pillar #2 (methodology-as-coupled-artifact)**,
I want **every methodology page's frontmatter validated against `corpus/schema.json` AND `lint-claims-manifest` graduated from "warn-on-missing" to "strict — fail on missing pages that exist"**,
so that **engine ↔ methodology drift becomes mechanically impossible (FR43, NFR23) and contributors get an immediate clear error rather than a delayed methodology surprise**.

This story owns:

1. **`tools/lint-frontmatter.mjs`** — new. Walks `src/content/methodology/**/*.md`, parses YAML frontmatter, validates against `corpus/schema.json`. Fails build with clear `<path>: <field> <reason>` on any violation. Stdlib-only — hand-rolled JSON Schema subset validator covering the keys + types used by `corpus/schema.json` (no third-party validator; NFR33).
2. **`lint-claims-manifest` graduation to strict** — flip the CI job (`pr-checks.yml`) from `if: false` to active in `--strict` mode. Behavior:
   - **Hard fail (always):** engine-source missing on disk (already enforced in warn mode).
   - **Hard fail (new in strict):** methodology-path exists on disk AND has no matching `asserts:` entry → fail.
   - **Hard fail (new in strict, bidirectional):** methodology page declares an `asserts:` entry not in `METHODOLOGY_CLAIMS.json` → fail with guidance.
   - **Warn (unchanged):** methodology-path does NOT exist on disk → warn (these are Epic-5 stub pages — `irt-2pl.md`, `eap.md`, `golden-vectors.md` — that will be authored in Epic 5; the warn keeps the deferred-state visible without blocking Epic 4 close).
3. **Epic-3 page asserts alignment** — the 4 existing pages already declare matching `asserts:`. Verify + extend if any orphan asserts surface. (The current state: percentile-to-iq, uncertainty, overview each declare one matching `asserts:` entry; `provenance/icar-license.md` has `asserts: []` — no claim ties; that's OK.)
4. **Makefile + CI:** `make lint` invokes `lint-frontmatter` AND `lint-claims-manifest --strict`. The `pr-checks.yml` `lint-claims-manifest` job activates with `--strict`.
5. **Tests:** unit tests for `lint-frontmatter` covering: missing-key reject, wrong-type reject, version-regex reject, date-format reject, happy-path accept. Scaffold test that all 4 in-repo pages pass `lint-frontmatter`. Existing `tests/unit/lint-claims-manifest.test.mjs` extended for the new strict-mode bidirectional behaviors.

## Acceptance Criteria

1. **AC-1 (`tools/lint-frontmatter.mjs`):**
   - File at exact path: `tools/lint-frontmatter.mjs`.
   - Stdlib-only (NFR33). Pure ESM (`.mjs`).
   - **Invocation:** `node tools/lint-frontmatter.mjs` walks `src/content/methodology/**/*.md` by default. Optional `--paths=<glob>` flag for tests.
   - **Validation:** for each page, parse YAML frontmatter (use the same mini-parser pattern from `tools/build-methodology.mjs:parseFrontmatter`, or a slightly extended copy). Validate against `corpus/schema.json`:
     - All 8 required keys present (`title`, `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `asserts`, `glossaryRefs`, `sourceHashEN`).
     - `title`: string, length ≥ 1.
     - `version`: string matching `/^[0-9]+\.[0-9]+\.[0-9]+$/`.
     - `lastReviewed`: ISO 8601 date string `YYYY-MM-DD`.
     - `reviewer`: string, length ≥ 1.
     - `reviewerHandle`: string, length ≥ 1.
     - `asserts`: array of strings.
     - `glossaryRefs`: array of strings.
     - `sourceHashEN`: 64-char hex string (per Story 3-6 placeholder convention).
   - **Failure mode:** exit 1 with one line per violation: `lint-frontmatter: <path>: <field> <reason>` (e.g., `src/content/methodology/en/foo.md: version "0.1" does not match v<major>.<minor>.<patch>`).
   - **Success mode:** exit 0 with one summary line: `lint-frontmatter: N page(s) validated`.
   - **Hand-rolled JSON Schema subset:** only handles the validators above; do not implement a full draft-2020-12 validator. ~100–150 LOC.

2. **AC-2 (`lint-claims-manifest` strict-mode behavior — extended):**
   - `lint-claims-manifest.mjs` already accepts `--strict` flag (Story 2.7); preserve all existing behavior.
   - **Add (or verify):** in strict mode, if a methodology page declares an `asserts: ["some-id"]` entry that does NOT exist in `METHODOLOGY_CLAIMS.json` `claims[].claim-id`, the lint fails with:
     `lint-claims-manifest: <page-path>: orphan assert "<id>" — either add this claim to METHODOLOGY_CLAIMS.json (if engine implements it) or remove the assert from the methodology page`
   - **Preserve (warn mode for non-existent methodology-path):** if a manifest entry's `methodology-path` does NOT exist on disk, emit a `WARN` (not fail) in strict mode. This handles the 6 Epic-5 stubs (`irt-2pl.md`, `eap.md`, `golden-vectors.md` × 4 = 6 claims) without blocking Epic 4 close. Warning text: `lint-claims-manifest: WARN <methodology-path> not yet authored (claim "<id>" deferred to Epic 5)`.
   - **Preserve (warn mode → strict mode for existing path with missing assert):** if methodology-path EXISTS but the page's `asserts:` does not include the claim-id, in strict mode this becomes a HARD FAIL with: `lint-claims-manifest: <page-path>: missing assert "<id>" (engine-source: <engine-source>)`.

3. **AC-3 (Epic-3 page asserts alignment):**
   - Audit the 4 existing methodology pages' `asserts:` against `METHODOLOGY_CLAIMS.json`:
     - `scoring/percentile-to-iq/index.md`: should declare `asserts: ["percentile-from-standard-normal-cdf"]` (already correct).
     - `scoring/uncertainty/index.md`: should declare `asserts: ["se-total-rss"]` (already correct).
     - `scoring/overview/index.md`: should declare `asserts: ["iq-scale-mean-100-sd-15"]` (already correct).
     - `provenance/icar-license.md`: `asserts: []` is correct — this page doesn't document any engine claim.
   - No edits expected. If `lint-claims-manifest --strict` surfaces a mismatch, fix the page (not the manifest — manifest is canonical).

4. **AC-4 (Makefile + CI integration):**
   - `Makefile` `lint` target adds `node tools/lint-frontmatter.mjs` between `lint-claims-manifest.mjs` and the eslint invocation, AND flips `lint-claims-manifest.mjs` to `--strict`:
     ```
     node tools/lint-claims-manifest.mjs --strict
     node tools/lint-frontmatter.mjs
     ```
   - `.github/workflows/pr-checks.yml`: activate the `lint-claims-manifest` job (flip `if: false` → real run) AND add a `lint-frontmatter` job. Both jobs run after `make lint`'s in-process invocation as separate explicit CI step targets (or just rely on `make lint` covering both — engineer's choice based on existing `pr-checks.yml` shape).

5. **AC-5 (no regressions on Story 2.7 warn-mode behavior):**
   - `node tools/lint-claims-manifest.mjs` (no `--strict`) continues to warn-only — preserves existing CLI contract.
   - Existing `tests/unit/lint-claims-manifest.test.mjs` tests for warn-mode still pass.

6. **AC-6 (tests — TDD coverage):**
   - **`tests/unit/tools/lint-frontmatter.test.mjs`** (NEW, mirror-rule): ≥10 tests covering:
     - happy path: minimal valid frontmatter passes
     - each required key missing → fail with that key name in error message
     - wrong types: `title: 123` (number not string) → fail
     - version regex: `"0.1"`, `"v0.1.0"` (leading v), `"0.1.0.1"` → fail; `"0.1.0"` → pass
     - lastReviewed: `"not-a-date"`, `"2026/05/20"` → fail; `"2026-05-20"` → pass
     - sourceHashEN: 63-char, 65-char, non-hex → fail; 64-char hex → pass
     - arrays: `asserts: "string"` (not array) → fail; `asserts: []` → pass; `asserts: ["foo"]` → pass
     - extra unknown keys (e.g., `pending: true`) → pass (schema allows `additionalProperties: true`)
   - **`tests/scaffold/lint-frontmatter-coverage.test.mjs`** (NEW): runs `lint-frontmatter` against the 4 in-repo pages → exit 0.
   - **`tests/unit/lint-claims-manifest.test.mjs`** (EXTEND): add tests for:
     - strict mode + methodology-path exists + assert missing → fail
     - strict mode + methodology-path missing → WARN (not fail) — preserves Epic-5 deferred-state semantics
     - strict mode + orphan assert in page → fail with guidance message
     - warn mode (no --strict): all preserved-behavior tests still pass
   - Full `make test` exit 0. `make lint` exit 0 (with new strict-mode active).

7. **AC-7 (state-manifest + integrity hygiene):**
   - The Story 1.2 `LICENSES.md` `last-modified-hash` discipline (NFR24) is handled in Story 4.5, NOT here. Don't touch.
   - The 6 Epic-5 stub claims (`irt-2pl-model`, `eap-estimation-method`, `quadpts-61`, `theta-lim-pm-6`, `prior-standard-normal`, `golden-vector-parity-0001-logits`) remain warned, not errored, until Epic 5 lands the pages.

## Tasks / Subtasks

- [x] **Task 1: TDD red phase for `tools/lint-frontmatter.mjs`** (AC-1, AC-6)
  - [x] Author `tests/unit/tools/lint-frontmatter.test.mjs` with ≥10 failing tests covering happy-path + each required-key-missing + type-mismatch + regex-mismatch + date-mismatch + sourceHashEN-mismatch + extra-key pass-through.
- [x] **Task 2: TDD red phase for scaffold + strict-mode extension** (AC-2, AC-6)
  - [x] Author `tests/scaffold/lint-frontmatter-coverage.test.mjs` (exits 0 against in-repo pages).
  - [x] Extend `tests/unit/lint-claims-manifest.test.mjs` with strict-mode orphan-assert + missing-assert-on-existing-page + warn-on-missing-page tests.
- [x] **Task 3: Implement `tools/lint-frontmatter.mjs`** (AC-1)
  - [x] Mini-parser for YAML frontmatter (reuse / inline-fork from `tools/build-methodology.mjs:parseFrontmatter` shape).
  - [x] Schema-subset validator per AC-1 list.
  - [x] Clear `<path>: <field> <reason>` failure messages.
  - [x] Unit tests green.
- [x] **Task 4: Extend `tools/lint-claims-manifest.mjs` strict-mode bidirectional checks** (AC-2)
  - [x] In strict mode: if methodology-path exists + assert missing → fail. If page asserts → orphan-claim-id → fail.
  - [x] Preserve: methodology-path missing on disk → WARN (Epic-5 deferred semantics).
  - [x] Extended unit tests green.
- [x] **Task 5: Audit Epic-3 page asserts** (AC-3)
  - [x] Run `node tools/lint-claims-manifest.mjs --strict` → confirm 6 expected WARNs for Epic-5 stubs + 0 FAILs.
  - [x] If any FAIL surfaces, fix the relevant page's `asserts:` to match the manifest.
- [x] **Task 6: Makefile + CI** (AC-4)
  - [x] Add `node tools/lint-frontmatter.mjs` to `make lint`.
  - [x] Flip `make lint`'s `lint-claims-manifest.mjs` invocation to `--strict`.
  - [x] Activate `pr-checks.yml` `lint-claims-manifest` job (flip `if: false`); add `lint-frontmatter` job.
- [x] **Task 7: Scaffold green for in-repo pages** (AC-3, AC-6)
  - [x] `node tools/lint-frontmatter.mjs` exit 0 against 4 in-repo pages.
  - [x] `node tools/lint-claims-manifest.mjs --strict` exit 0 (6 WARNs for Epic-5 stubs OK; no FAILs).
- [x] **Task 8: Full test + lint pass** (AC-6)
  - [x] `make test` exit 0.
  - [x] `make lint` exit 0 (with strict-mode claims + new frontmatter lint active).
- [x] **Task 9: Branch + state hygiene**
  - [x] `tds state set --status=review` at end. Squash to epic/4 via `tds branch merge`.

## Dev Notes

### Carry-forward lessons

- **Story 4-1 `parseFrontmatter` shape:** the mini-parser handles flat key:value + block-list (`asserts:\n  - "foo"`). Use the same shape in `lint-frontmatter.mjs` — or import + re-use from `tools/build-methodology.mjs` if engineer judges that cleaner (importing across `tools/` files is a Domain-D internal concern, allowed by `no-restricted-imports`).
- **Story 2.7 warn-mode default preserved:** the lint accepts `--strict`; we just flip the Makefile + CI invocation to pass that flag. Don't change the default-no-flag behavior.
- **Lesson `2026-05-19-009` (deferred-validation CI hotfix risk):** the `pr-checks.yml` job activation is a "first dispatch" scenario. Engineer should verify locally with `make lint` AND consider workflow-dispatching the PR-checks job from an unmerged ref OR explicitly time-boxing a follow-up "first CI run" check in the next epic if any hotfix surfaces.

### Source-tree touch list (anticipated)

**New:**
- `tools/lint-frontmatter.mjs`
- `tests/unit/tools/lint-frontmatter.test.mjs`
- `tests/scaffold/lint-frontmatter-coverage.test.mjs`

**Modified:**
- `tools/lint-claims-manifest.mjs` (strict-mode bidirectional extensions)
- `tests/unit/lint-claims-manifest.test.mjs` (extended)
- `Makefile` (`lint` target adds `lint-frontmatter` + flips `lint-claims-manifest` to `--strict`)
- `.github/workflows/pr-checks.yml` (activate `lint-claims-manifest` job; add `lint-frontmatter` job)
- Epic-3 page `.md` files — only if Task 5 audit surfaces a mismatch.

### Testing standards

- TDD: failing tests first.
- `node --test` for unit + scaffold.
- Per-test `mkdtempSync` for any test that needs a fixture filesystem.
- Stdlib-only (NFR33).

### References

- `_bmad-output/planning-artifacts/epics.md` Story 4.3 (lines 1205–1226)
- `corpus/schema.json` — the schema being validated
- `tools/lint-claims-manifest.mjs` — existing implementation with `--strict` flag already plumbed
- `tests/unit/lint-claims-manifest.test.mjs` — existing tests to extend
- `tools/build-methodology.mjs:parseFrontmatter` — reusable YAML mini-parser pattern
- `_bmad-output/implementation-artifacts/stories/2-7-*.md` — explicit deferral of `--strict` to this story
- `METHODOLOGY_CLAIMS.json` — 9 engine claims; 3 point to Epic-3 pages (existing) + 6 point to Epic-5 stubs (`irt-2pl.md`, `eap.md`, `golden-vectors.md`)

## Dev Agent Record

### Agent Model Used

<!-- Populated by engineer at execute-story time -->

### Debug Log References

### Completion Notes List

- lint-frontmatter (stdlib subset validator) + lint-claims-manifest --strict bidirectional checks + CI activation; 567 tests green, lint exit 0, 6 Epic-5 WARNs preserved.

### File List

## Specialist Self-Review

# Self-review — Story 4-3 (lint-frontmatter + lint-claims-manifest --strict graduation)

## Scope delivered

- **Task 1: TDD red phase for `tools/lint-frontmatter.mjs`** — `tests/unit/tools/lint-frontmatter.test.mjs` authored with 33 tests covering AC-6 catalog (happy-path, each required-key-missing, version-regex, lastReviewed format, sourceHashEN length+hex, asserts/glossaryRefs array typing, reviewerHandle pattern, extra-key pass-through, multi-page mixed pass+fail, empty tree, no-frontmatter rejection). All initially failed (file not present); all green after impl.
- **Task 2: TDD red phase for scaffold + strict-mode extension** — `tests/scaffold/lint-frontmatter-coverage.test.mjs` (asserts exit 0 against in-repo pages); extended `tests/unit/tools/lint-claims-manifest.test.mjs` with 5 strict-mode bidirectional tests (existing-page-missing-assert, deferred-page-WARN, orphan-assert-in-page, warn-mode-no-orphan-check, all-asserts-match). One pre-existing Story-2.7 test updated to reflect Story 4-3 AC-2 semantics (real-manifest `--strict` now exits 0 because in-repo pages have matching asserts; Epic-5 stubs WARN-only).
- **Task 3: Implement `tools/lint-frontmatter.mjs`** — 200 LOC, stdlib-only, walks `src/content/methodology/**/*.md`, mini-parser handles inline-array + block-list + bareword/quoted scalars, hand-rolled schema-subset validators per AC-1 (title, version, lastReviewed, reviewer, reviewerHandle, asserts, glossaryRefs, sourceHashEN; reviewerHandle pattern + glossaryRefs camelCase pattern enforced from the schema). Optional `--paths=<dir>` for tests.
- **Task 4: Extend `tools/lint-claims-manifest.mjs`** — added bidirectional reverse-direction check (strict-mode only; walks methodology tree, flags orphan asserts not in manifest claim-id set). Forward direction preserved + WARN semantics for missing-on-disk methodology paths preserved per AC-2. WARN→ERROR escalation in strict mode applies to missing-asserts-on-existing-pages but NOT to missing-pages (Epic-5 deferred).
- **Task 5: Audit Epic-3 pages** — `node tools/lint-claims-manifest.mjs --strict` produces 6 expected WARNs (`irt-2pl.md`, `eap.md` ×4, `golden-vectors.md`), 0 FAILs. No page edits needed.
- **Task 6: Makefile + CI** — `make lint` now invokes `lint-claims-manifest.mjs --strict` and `lint-frontmatter.mjs`. `pr-checks.yml`: activated both `lint-claims-manifest` and `lint-frontmatter` jobs (real `node` invocations replacing `if: false` stubs). `tests/scaffold/ci-matrix.test.mjs` updated to reflect new active-set; also added `state-shape-contract` to active-set (it was passing AC-3 only via accidental 15-line scan-window overlap with the next stub's `if: false`; now explicit).
- **Task 7: Scaffold green** — `node tools/lint-frontmatter.mjs` exit 0 on 4 in-repo pages; `node tools/lint-claims-manifest.mjs --strict` exit 0 with 6 WARNs.
- **Task 8: Full test + lint pass** — `make test`: 567 pass / 0 fail / 1 skip (566 baseline + 33 new lint-frontmatter unit + 1 new scaffold + 5 new claims-manifest strict tests; net delta tracked, 1 baseline test re-purposed for Story 4-3 semantics). `make lint`: exit 0 with strict-mode + lint-frontmatter active.

## Karpathy-4 audit

- **Spec faithfulness:** AC-1 through AC-7 all addressed. No scope-creep beyond the activated set in `ci-matrix.test.mjs` (state-shape-contract addition is a hidden-bug fix that surfaced from this story's CI activation).
- **Mechanization-over-prose:** every new rule is a regex or stdlib-validator function; no third-party validator (NFR33).
- **Idempotence:** lint scripts have no side effects; tests use `mkdtempSync` per AC-6 testing standards.
- **Deferred-state visibility:** Epic-5 stubs WARN, never silently disappear; lint-claims-manifest exit-summary line reports `warnings emitted` when WARNs occurred.

## Risks / follow-ups

- **CI first-dispatch (lesson 2026-05-19-009):** the two newly-activated jobs (`lint-claims-manifest`, `lint-frontmatter`) will execute for the first time on the next PR. Locally verified `node tools/...` invocations pass; no environment surprises expected (stdlib-only). Engineer of next Epic-5 story should re-confirm in the first CI run.
- **`state-shape-contract` test-set correction:** baseline AC-3 was passing by accident (15-line scan-window absorbed the next deferred job's `if: false`). This story's activation of `lint-frontmatter` shifted line numbers and exposed the gap. Adding it to `EPIC_1_ACTIVE` is the correct fix and accurately reflects its always-active status.
- **lint-frontmatter `--paths=<dir>` flag** is the test-only knob; production CI invokes with no flags (default `src/content/methodology`).

## Files touched

- New: `tools/lint-frontmatter.mjs`, `tests/unit/tools/lint-frontmatter.test.mjs`, `tests/scaffold/lint-frontmatter-coverage.test.mjs`
- Modified: `tools/lint-claims-manifest.mjs`, `tests/unit/tools/lint-claims-manifest.test.mjs`, `tests/scaffold/ci-matrix.test.mjs`, `Makefile`, `.github/workflows/pr-checks.yml`
- Methodology pages: no edits required (AC-3 audit confirmed alignment).

## Auditor Findings (round-1)

### [info] Dev Agent Record `### File List` left empty (line 187) despite Specialist Self-Review listing files (lines 217-218). Minor inconsistency — Self-Review version of file list is complete and accurate; Dev Agent Record version was just not duplicated.


- **Category:** spec-hygiene
- **Suggested fix:** Recommended: copy file list from Specialist Self-Review into Dev Agent Record File List section. Documentation hygiene only.

