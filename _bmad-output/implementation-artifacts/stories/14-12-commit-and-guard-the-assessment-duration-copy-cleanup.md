---
id: 14-12-commit-and-guard-the-assessment-duration-copy-cleanup
title: "Story 14.12: Commit and guard the assessment-duration copy cleanup"
status: done
---

# Story 14.12: Commit and guard the assessment-duration copy cleanup

## Story

As a **skeptical reader auditing IQ-ME's anti-credentialization posture**,
I want **every assessment-duration estimate removed from user-facing and project copy, with a permanent guard that fails the build if one reappears**,
so that **the project never re-implies a fixed completion time for a self-paced, no-time-limit screener — neither in shipped strings nor in trust documents — and the removal cannot silently regress**.

## Acceptance Criteria

1. **Exhaustive verification — zero leftovers (PR-31).** An exhaustive grep for duration-estimate language (`\b\d+\s*(minute|min|hour)s?\b` near `test|assessment|session`, `about \d+ minutes`, `~\d+\s*min`, `takes about`, `\d+\s*min\b`) over user-facing + project copy (`src/content/**`, `README.md`, `docs/launch-readiness/**`, `src/assessment/state.schema.json`) returns ZERO remaining assessment-completion-time matches. The co-equal Percentile/IQ-scale/Range triplet, frozen Epic 11/13 DOM contracts (`section.landing`, `h1#landing-heading`, `#start-test-btn`, `.landing__methodology-link`), and the NFR21 byte-stable build are preserved unchanged.

2. **Allowed self-paced vocabulary present in all three locales (PR-31).** The only time-related copy that remains is the allowed vocabulary — `self-paced`, `no time limit`, `no time pressure` — present in EN/PL/RU (`self-paced` + `under no time pressure` in EN; `we własnym tempie` + `bez presji czasu` in PL; `в собственном темпе` + `без ограничения по времени` in RU), with the `25 minutes` / `~30min` / `about 25 minutes` phrasings absent everywhere. NFR27 translation parity holds; no methodology-corpus body edit is required (PR-31 already cascaded EN→PL/RU and the `sourceHashEN` values are current), so no `sourceHashEN` re-bump occurs in this story.

3. **The permanent guard lint (PR-31).** A dedicated `tools/lint-no-duration-estimate.mjs` scans user-facing + project copy (`src/content/**`, `README.md`, `docs/launch-readiness/**`, schema `description` strings), flags any duration-estimate regex match while exempting the allowed self-paced/no-time-limit vocabulary, exits 0 on the current tree, exits non-zero on an injected `"takes about 25 minutes"` fixture (`IQME_LINT_TARGET` override), is wired into the `Makefile` `lint` target, and a new entry in `tests/scaffold/negative-assertion-lints.test.mjs` asserts the script exists and is registered. The lint is stdlib-only (NFR33/NFR6) and adds no new CI job — it runs inside the existing eslint/lint job.

4. **No over-matching legitimate duration language (PR-31).** The lint's allowlist/scope skips performance/benchmark files, release-schedule docs (`v1.0.0-*`, monitoring/runbook/checklist/snapshots), reviewer-outreach drafts/logs/sign-offs, and methodology passages describing retest timing (`test-retest interval`, `retest interval`) and reader-verification time (`verify in under ten minutes`), while still catching assessment-completion-time claims. The lint passes against the current corpus (which legitimately discusses retest-interval methodology) yet fails against a synthetic `"the test takes 20 minutes"`. The validity-envelope and bottom-decile-care methodology pages remain byte-stable.

5. **9e-1 stays green (PR-31).** `tests/scaffold/9e-1-tester-credibility.test.mjs` (updated by PR-31 to require `self-paced|no time limit` and to forbid a duration estimate in the recruitment draft via `doesNotMatch`) is NOT edited by this story and stays green, alongside the new duration-lint scaffold test. No fabricated tester tally, telephone number, or duration estimate is introduced into any launch-readiness artifact.

6. **Suites stay green (PR-31).** `make lint` (now including `lint-no-duration-estimate`), the new scaffold guard, and the negative-assertion registry test pass with no regression to the IRT parity tests, methodology snapshots, or translation-parity lint. The deterministic byte-identical build (NFR21), WCAG 2.2 AA surfaces, zero-telemetry local-only posture, and the co-equal Percentile/IQ/Range result triplet are all preserved. `css-components-lines` stays 2336/2600 (the new lint lives in `tools/`, not `src/css/components/**`).

**Requirements covered:** PR-31
**Depends on:** 14.11 (final Epic 14 story)

## Tasks / Subtasks

- [x] **Task 1: Exhaustively verify the cleanup (AC: 1, 2)**
  - [x] Grep `src/content/**`, `README.md`, `docs/launch-readiness/**`, `src/assessment/state.schema.json` for the duration-estimate regex family. Confirm ZERO assessment-completion-time leftovers. (Result: zero — PR-31's cleanup is exhaustive; no NFR27 corpus cascade triggered.)
  - [x] Confirm the allowed self-paced/no-time vocabulary is present in EN/PL/RU `strings.json`.

- [x] **Task 2: Author the permanent guard lint (AC: 3, 4)**
  - [x] Create `tools/lint-no-duration-estimate.mjs` modeled on `tools/lint-no-cookie-banner.mjs`: stdlib-only, honors `IQME_LINT_TARGET`, scans the copy surfaces, flags duration-estimate matches, exempts `self-paced`/`no time limit`/`no time pressure` + retest-timing + reader-verification windows, and excludes release-schedule/outreach/benchmark files by name. Exits 0 clean / non-zero on a fixture with a `BREACH` message.

- [x] **Task 3: Wire + register (AC: 3, 6)**
  - [x] Add `node tools/lint-no-duration-estimate.mjs` to the `Makefile` `lint` target alongside the other negative-assertion lints.
  - [x] Add the entry (script + fixture dir) to `tests/scaffold/negative-assertion-lints.test.mjs`; create `tests/fixtures/lint-negative-assertions/no-duration-estimate/violation.md` with a single duration-estimate violation.

- [x] **Task 4: Author the story guard (AC: 1-4)**
  - [x] Create `tests/scaffold/14-12-duration-copy-guard.test.mjs`: asserts zero duration-estimate matches in shipped copy via the same regex; asserts the lint exists + stdlib + wired in Makefile + registered; asserts exit-0-on-tree + non-zero-on-injected-fixture (temp `IQME_LINT_TARGET`); asserts the allowed self-paced vocabulary is present in EN/PL/RU.

- [x] **Task 5: Verify (AC: 1-6)**
  - [x] `node tools/lint-no-duration-estimate.mjs` → exit 0; injected fixture → exit 1 with `BREACH`. `node --test tests/scaffold/14-12-duration-copy-guard.test.mjs` → green (8/8). `node --test tests/scaffold/negative-assertion-lints.test.mjs` → green (36/36, registry recognizes the new lint). `node --test tests/scaffold/9e-1-tester-credibility.test.mjs` → green, unchanged. `make lint` → exit 0. Full scaffold suite → 756 tests / 742 pass / 14 pre-existing 9-series fails / zero new. `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` 2336/2600.

## Dev Notes

### Implementation strategy
- **This story is verification + a permanent guard — no production SPA edit.** The duration-estimate copy cleanup already landed in commit `00ea3ea` (PR-31, 27 files: i18n EN/PL/RU, the fluid-reasoning + letter-number-series construct corpus EN/PL/RU + their built `dist` mirrors, `state.schema.json`, `README.md`, `tester-recruitment-draft.md`, `CITATION.cff`). The exhaustive grep over the copy surfaces returns ZERO remaining assessment-completion-time matches, so no leftover cleanup — and therefore no NFR27 corpus cascade / `sourceHashEN` re-bump — was needed.
- **The lint follows the established negative-assertion convention.** `tools/lint-no-duration-estimate.mjs` mirrors `tools/lint-no-cookie-banner.mjs`: stdlib-only (`node:fs`/`node:path`/`node:url`), `IQME_LINT_TARGET` override, `BREACH ...` on stderr + exit 1 on violation, `ok (N files scanned)` + exit 0 clean. It is 48 LOC (under the registry test's ≤80-LOC bar). It is registered in the `Makefile` `lint` target and in `tests/scaffold/negative-assertion-lints.test.mjs` (a new `LINTS` entry → drives the exists / stdlib-only / ≤80-LOC / exits-0 / exits-non-zero-on-fixture assertions).

### The lint's regex + allowlist/exclusions
- **Match (`FORBIDDEN`):** `(?:about \d+ ...|~\d+ ...|takes about \d+ ...) | ((test|assessment|session|screener|quiz|exam|completed?) within ~80 chars of \d+\s*(minute|min|hour)s?, either ordering)`. This is the AC's regex family generalized to both orderings + the explicit phrasings.
- **Exempt (`ALLOWED`, applied to a ±60-char window around each match):** `self-paced`, `no time limit`, `no time pressure`, `test-retest`, `retest interval`, `retest`, `verify/confirm ... in under`, `under (five|ten|N) minutes`. This lets the methodology corpus keep its retest-timing discussion ("taking the test again", "later sessions") and its reader-verification claims ("confirm parity in under five minutes", "verify the math in under ten minutes") — which are NOT completion-time claims.
- **File-scope exclusions (`EXCLUDED_FILE`):** release-schedule / launch-ops docs (`v\d+\.\d+\.\d+`, `*monitoring*`, `*runbook*`, `*checklist*`, `*snapshots*`, `*post-launch*`, `*launch-postscript*`), reviewer-outreach drafts/logs/sign-offs (`*outreach*`, `*signoff*`/`*sign-off*`), and performance/benchmark files (`perf`, `benchmark`). These carry legitimate non-assessment duration language: "1 hour after tag push" (monitoring), "estimated 4-8 hours" reviewer time-commitment (outreach), the "Quick smoke test (5 minutes per checkpoint)" ops line. `tester-recruitment-draft.md` is deliberately NOT excluded — it is the file PR-31 cleaned and 9e-1 guards, so the lint scans it to catch a regression.
- **Scope:** `src/content/**` (covers i18n + the methodology corpus under `src/content/methodology`), `README.md`, `docs/launch-readiness/**`, and `src/assessment/state.schema.json` (its `description` strings). 96 files scanned on the current tree → 0 violations.

### Budget / invariants
- **No `src/css/components/**` or production SPA JS/CSS/markup is modified** → `css-components-lines` stays 2336/2600 and the byte-stable build (NFR21) is unaffected. The new artifacts are `tools/`, `tests/scaffold/`, `tests/fixtures/`, a Makefile line, and this spec.
- **NFR27:** no i18n / corpus / EN-string body edit → no PL/RU parity cascade, no `sourceHashEN` re-bump.
- **The frozen Epic 11/13 DOM contracts and the co-equal triplet are untouched** — this story adds no DOM, no SPA logic.
- **No new CI job** — the lint runs inside the existing `make lint` job (post-Epic-1 "no new jobs" discipline preserved).

### Verification
- `node tools/lint-no-duration-estimate.mjs` → `ok (96 files scanned)`, exit 0.
- `IQME_LINT_TARGET=<tmp containing "the test takes 20 minutes">` → exit 1, `BREACH lint-no-duration-estimate: ...`.
- `node --test tests/scaffold/14-12-duration-copy-guard.test.mjs` → 8/8 green.
- `node --test tests/scaffold/negative-assertion-lints.test.mjs` → 36/36 green (registry recognizes the new lint + fixture).
- `node --test tests/scaffold/9e-1-tester-credibility.test.mjs` → 6/6 green, unedited.
- `make lint` → exit 0 (includes `lint-no-duration-estimate: ok`).
- Full scaffold suite (`tests/scaffold/**/*.test.mjs`) → 756 tests / 742 pass / 14 fail — the SAME 14 pre-existing human-gated 9-series reds (8 in `9a-2-icar-gate-closed.test.mjs` — ICAR-CONFIRMATION.pdf + icar-license `pending`; 6 in `9d-2-pl-gate-closed.test.mjs` — PL translator sign-off), zero new. The delta vs Story 14.11's 728/714/14 baseline is this story's 28 new passing tests (8 guard + 20 registry-loop assertions for the new lint).
- `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` 2336/2600 (unchanged).

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): every new story spec must carry this `### Carry-forward lessons` section with non-empty content. Apply: present on 14.12; the `make lint` carry-forward gate (`lint-spec-carry-forward`) depends on this case-sensitive heading.
- lesson-2026-06-03-002 (severity=high): back any "pre-existing red" claim with a baseline. Apply: the 14 reds here are the SAME human-gated 9-series guards (8 `9a-2` ICAR PDF + 6 `9d-2` PL sign-off) recorded against Story 14.11's 728/714/14 baseline; this story adds only passing tests (28), so the count moves to 756/742/14 with zero new reds.
- Corpus-edit parity cascade (project lesson): editing ANY EN methodology-corpus body breaks `lint-translation-parity` (NFR27) and requires a mirrored PL/RU edit plus a `sourceHashEN` re-bump (sha256 of the body after frontmatter). Apply: this story found ZERO leftovers, so it makes NO corpus edit and triggers NO cascade — the preferred outcome the spec calls for. Had a leftover existed in an EN construct body, the fix would have had to mirror to PL+RU and re-bump that file's `sourceHashEN`.
- Negative-assertion-lint convention (Epic-1 / Story 1.6): a guard lint is a single-purpose `tools/lint-no-*.mjs`, stdlib-only, honoring `IQME_LINT_TARGET`, exiting 0 clean / non-zero with a `BREACH` stderr line, kept ≤80 non-comment LOC, wired into the `Makefile` `lint` target, and registered in `tests/scaffold/negative-assertion-lints.test.mjs` with a matching `tests/fixtures/lint-negative-assertions/<name>/` violation file. Apply: the registry test's per-entry loop REQUIRES the fixture dir to exist and contain a violation — adding the `LINTS` entry without the fixture file would fail the "exits non-zero against fixture" assertion. The fixture must use a non-excluded filename (`violation.md`) so the lint's `EXCLUDED_FILE` scope does not skip it.
- A duration-estimate guard must distinguish assessment-completion-time claims from legitimate operational/methodological duration language. Apply: the discriminators are (a) proximity to assessment words for completion claims, (b) a ±60-char window allowlist for retest-timing + reader-verification, and (c) a filename exclusion for release-schedule/outreach/benchmark docs ("1 hour after tag push", "estimated 4-8 hours reviewer commitment", "smoke test 5 minutes per checkpoint" are all NOT assessment-completion claims). `tester-recruitment-draft.md` stays IN scope because PR-31 cleaned it and 9e-1 guards it.

## Dev Agent Record

### File List
- `tools/lint-no-duration-estimate.mjs` (new — negative-assertion lint: scans `src/content/**`, `README.md`, `docs/launch-readiness/**`, and `src/assessment/state.schema.json` for assessment-completion duration estimates; exempts the allowed self-paced/no-time-limit vocabulary + retest-timing + reader-verification windows; excludes release-schedule/outreach/benchmark files; stdlib-only, honors `IQME_LINT_TARGET`, 48 LOC; exit 0 clean / non-zero + `BREACH` on violation).
- `Makefile` (modified — added `node tools/lint-no-duration-estimate.mjs` to the `lint` target after `lint-no-localStorage-without-consent.mjs`).
- `tests/scaffold/negative-assertion-lints.test.mjs` (modified, class-A frozen — added the `tools/lint-no-duration-estimate.mjs` + `tests/fixtures/lint-negative-assertions/no-duration-estimate` entry to the `LINTS` registry array, driving the exists/stdlib-only/≤80-LOC/exit-0/exit-non-zero-on-fixture assertions; updated the AC-5 comment count from "all 7 active" to "all active"; integrity to be re-recorded by the orchestrator).
- `tests/fixtures/lint-negative-assertions/no-duration-estimate/violation.md` (new — the registry fixture: a single `"takes about 25 minutes"` duration-estimate violation so the lint exits non-zero when `IQME_LINT_TARGET` points at it).
- `tests/scaffold/14-12-duration-copy-guard.test.mjs` (new — the story guard: zero duration-estimate matches in shipped copy via the AC regex; lint exists + stdlib + Makefile-wired + registered; lint exits 0 on the tree + non-zero on a temp injected fixture; allowed self-paced vocabulary present in EN/PL/RU; 8 tests).
- `_bmad-output/implementation-artifacts/stories/14-12-commit-and-guard-the-assessment-duration-copy-cleanup.md` (this spec).
