---
id: bridge-9a-1-isolate-concurrency-sensitive-coverage
title: "Story bridge-9a-1-isolate-concurrency-sensitive-coverage: Isolate concurrency-sensitive coverage/lint tests to tmpdir"
status: approved
---

# Story bridge-9a-1-isolate-concurrency-sensitive-coverage: Isolate concurrency-sensitive coverage/lint tests to tmpdir

## Story

Story 7-6 observed a transient lint-csp-source-coverage aggregate-only failure when make/lint ran against the shared working tree under concurrency, then self-cleared (no CSP change; not caused by 7-6). It is the same flake class as the design-system AC-6 snapshot issue already fixed in 7.5b via tmpdir isolation. The recurring surface is coverage/lint tests that spawn make/lint against the REAL working tree and can be cross-contaminated by a concurrent make run. Scope: audit all such tests, isolate each to a per-test tmpdir + env-var output override (the same fix the design-system AC-6 and the epic-3 dist/ race already used), so concurrent make runs cannot cross-contaminate. Bounded, non-gate-gated, and the only actionable tech-debt this epic surfaced. Pairs with the existing filesystem-fixture-isolation lesson (per-test mkdtempSync + env-var output override).

## Sources (deferred from)

- `7-6-ru-pl-tail-scene-clinical-register-copy-replaces-epic-6-placeholders` (kind=auditor-finding, round=1, finding_index=1)

## Acceptance Criteria

1. **Audit is complete and recorded.** Every test under `tests/` that spawns `make`/`lint`/a build tool against the real working tree (`REPO_ROOT`) *and* reads or writes a shared, mutable repo-root artifact (`dist/`, snapshot dirs, etc.) is enumerated and each entry classified `isolated` or `needs-isolation`. The list is captured in the story File List / a short audit note (ground truth: the suite includes `tests/scaffold/lint-csp-source-coverage.test.mjs`, `tests/scaffold/lint-*-coverage.test.mjs`, `tests/scaffold/build-methodology-output.test.mjs`, `tests/scaffold/design-system.test.mjs`, `tests/exit-criteria/epic-04-lint-coverage.spec.mjs`, `tests/playwright/byte-stable.spec.mjs`).
2. **Each `needs-isolation` test is hermetic.** Every such test is converted to a per-invocation temp dir (`mkdtempSync(join(tmpdir(), "<prefix>-"))`) + env-var output override consumed by the spawned tool (the `IQME_BUILD_METHODOLOGY_OUT` / `IQME_SNAPSHOT_DIR` pattern; add a new override where the tool lacks one), following lesson-2026-05-19-014. No test reads or writes a shared `REPO_ROOT` artifact a concurrent `make` could mutate, and no test `rmSync`s a shared fixture directory.
3. **The reported flake is closed.** The story-7-6 finding (transient `lint-csp-source-coverage` aggregate-only failure caused by a concurrent `make build-methodology` rewriting `dist/`) no longer depends on concurrent `dist/` state — the coverage test asserts against a controlled/stable surface (`src/index.html`) or a linter pointed at a tmpdir build, never partial shared `dist/`.
4. **No regression in enforcement or determinism.** `make test` is green across N (≥10) consecutive/parallel runs with no transient coverage/lint aggregate failure, and existing lint/coverage assertions retain full strength (negative cases still fail — isolation must not weaken enforcement).

## Tasks / Subtasks

- [x] **Task 1 — write the failing reproduction (red).** Add a test/harness that deterministically exercises the race: run a coverage/lint test (e.g. `lint-csp-source-coverage`) while a concurrent `make build-methodology` mutates `dist/`, asserting the lint test is hermetic (never observes partial `dist/` state). Confirm it fails against current code. Covers AC #3.
- [x] **Task 2 — audit & enumerate (AC #1).** Walk `tests/` for every spawn of `make`/`lint`/build tool against `REPO_ROOT` that touches a shared mutable artifact; classify each `isolated` / `needs-isolation`; record the list in the audit note / File List.
- [x] **Task 3 — implement isolation (green, AC #2 & #3).** For each `needs-isolation` test, redirect to per-test `mkdtempSync(tmpdir())` + env-var output override (`IQME_BUILD_METHODOLOGY_OUT` / `IQME_SNAPSHOT_DIR` / new override as needed); ensure the spawned tool honors the override. Make the Task 1 test pass. Remove any shared-fixture `rmSync`/writes.
- [x] **Task 4 — refactor & verify (AC #4).** Run `make test` ≥10× (and under parallelism) to confirm no transient flake; verify lint enforcement is unweakened (negative cases still fail); finalize the audit note.

## Dev Notes

### Carry-forward lessons

Populated from `tds memory query --story=bridge-9a-1-isolate-concurrency-sensitive-coverage` before impl (per lesson-2026-05-20-007 — every new story spec carries this section; backfilled here because the `bridge-from-retros` stub omitted it):

- **lesson-2026-05-19-014 (the canonical fix, named in the Story brief):** isolate a test that spawns a build/lint tool against a shared, mutable repo-root artifact via a per-invocation `mkdtempSync(join(tmpdir(), "<prefix>-"))` + an env-var output override the spawned tool honors. Applied: added `IQME_DIST_DIR` (relocates the whole `dist/` root across `build-methodology` + `build-determinism-marker` + `make clean`) and `IQME_DIFFICULTY_BANDS_OUT` (relocates the `src/items` artifact), so `make build` can target a per-test tmpdir.
- **lesson-2026-06-03-001 (CI per-spec, not glob):** verified before adding a new test file. The workflows run tests per-spec/per-lint + Playwright; **no job runs the `tests/scaffold` glob or `make test`**, so the scaffold coverage suite (incl. the existing flaky `lint-csp-source-coverage.test.mjs`) is `make test`-local by design. The reported flake is a local race; the new `lint-coverage-isolation.test.mjs` follows the same scaffold-local convention, so no new CI job is warranted. (The broader "scaffold suite has zero CI coverage" observation is out of scope here.)
- **lesson-2026-05-19-013 (sweep resurrection):** class-A frozen tests + state files re-recorded via the CLI, never hand-edited. Cross-story frozen tests touched here (`lint-csp-source-coverage` owner 4-8; `determinism-harness` + `byte-stable` owner 4-2) were opened with `tds story unfreeze-tests --story=<owner>` and closed with `tds integrity record --story=<owner>`.

## Dev Agent Record

### Completion Notes List

- Audit: needs-isolation = lint-csp-source-coverage (reader of shared dist/), determinism-harness AC-2 + byte-stable (writers via make build). Already-isolated = build-methodology-output, design-system AC-6, methodology-snapshots/masthead, lint-spec-carry-forward-*. Source-only readers (no dist/) = lint-glossary/reading-level/frontmatter/license-provenance/translation-parity-coverage. make-lint readers (cognitive-load-budget, negative-assertion-lints) race-free once writer isolated.
- Added IQME_DIST_DIR (build-methodology + build-determinism-marker + Makefile clean) and IQME_DIFFICULTY_BANDS_OUT (compute-difficulty-bands) so make build can target a per-test tmpdir, never shared dist/ or src/items. Cross-story frozen tests edited via unfreeze-tests under owning stories 4-8 (coverage) and 4-2 (determinism-harness + byte-stable).
- Task 4: make test 10x consecutive (intra-suite parallel) fail=0; 6x under concurrent external make build/clean churn fail=0 (was 3/5 flaky before reader isolation); make lint exit 0; enforcement intact (lint-csp-source on CSP-violating file exits 1). Expanded reader isolation: makefile AC-2, cognitive-load-budget AC-8, negative-assertion-lints AC-5 now run make lint with IQME_DIST_DIR=tmpdir. lint-csp-source default scope honors IQME_DIST_DIR.

### File List

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-9a` (blocks `epic-9a`).
- tests/scaffold/lint-coverage-isolation.test.mjs
- tests/scaffold/lint-csp-source-coverage.test.mjs
- tests/scaffold/determinism-harness.test.mjs
- tests/playwright/byte-stable.spec.mjs
- tools/build-methodology.mjs
- tools/build-determinism-marker.mjs
- tools/compute-difficulty-bands.mjs
- Makefile
- tools/lint-csp-source.mjs
- tests/scaffold/cognitive-load-budget.test.mjs
- tests/scaffold/negative-assertion-lints.test.mjs
- tests/scaffold/makefile.test.mjs

## Specialist Self-Review

**Decisions made:**

- **Isolate the *writer*, not just the reader.** The reported flake surfaced in `lint-csp-source-coverage` (a reader of shared `dist/`), but root-cause is `determinism-harness` AC-2 running `make clean && make build` against the shared tree *inside* `make test` (node:test file-parallelism). I isolated both: the reader now builds methodology to its own tmpdir and scopes the lint there; the writer (`determinism-harness` AC-2 + Playwright `byte-stable`) builds into a fresh per-test tmpdir. Once nothing in `make test` mutates shared `dist/`, every reader is race-free.
- **Three output overrides, mirroring the existing `IQME_BUILD_METHODOLOGY_OUT` pattern (lesson-2026-05-19-014):** `IQME_DIST_DIR` relocates the whole `dist/` root (consumed by `build-methodology`, `build-determinism-marker`, `lint-csp-source`'s default scope, and `make clean`); `IQME_DIFFICULTY_BANDS_OUT` relocates the `src/items/item-difficulty-bands.json` artifact. Together they let `make build`/`make lint` target a tmpdir with zero shared-artifact touch.
- **Also isolated the three `make lint` readers** (`makefile` AC-2, `cognitive-load-budget` AC-8, `negative-assertion-lints` AC-5). They invoke the full `make lint`, whose `lint-csp-source` step scans `dist/methodology`. Per AC #1/#2 ("audit *every* test that reads a shared mutable artifact via a spawned tool; convert each"), these are `needs-isolation`. Each `make lint` spawn now sets `IQME_DIST_DIR=<fresh tmpdir>` → degraded-mode scan of `src/index.html` only, exit 0, hermetic.

**Alternatives considered:**

- *Fix only the reported reader and stop.* Rejected: a stress test (background `make build`/`make clean` loop on shared `dist/` during `make test`) reproduced the same flake in the `make lint` readers — so reader-only would leave AC #4 ("no transient flake under concurrent make") unmet for a concurrent external build.
- *Narrow `lint-csp-source-coverage` to `src/index.html` only.* Rejected: AC #4 requires coverage strength preserved. Building methodology to a tmpdir and linting that keeps the rendered-HTML corpus surface in the assertion.
- *Have `determinism-harness` AC-2 skip `build-difficulty-bands`.* Rejected: AC-2's contract is that `make build` (the real target) emits the marker; redirecting via `IQME_DIFFICULTY_BANDS_OUT` keeps full `make build` coverage while staying hermetic (and closes a second race: `item-difficulty-bands-contract.spec.mjs` reads that same `src/items` file a concurrent build rewrites).

**Framework gotchas avoided:**

- `node --test` parallelizes test *files* (not tests within a file), so AC-2's three serial sub-tests don't race each other — but they DO race other files' readers. The fix targets cross-file contention.
- `lint-csp-source` default scope resolves `dist/methodology` against `cwd()`; I routed the override through the same `resolve(CWD, env.IQME_DIST_DIR || "dist", "methodology")` so an absolute tmpdir path works and the unset default is byte-identical to before.
- `writeFileSync` of the small deterministic `item-difficulty-bands.json` is effectively atomic, so the external-build stress test stayed green even though the loop rewrote the shared file — but intra-`make test` that write is now fully eliminated via the override.

**Areas of uncertainty (auditor please look here):**

- **Cross-story frozen-test blast radius.** This bridge edited frozen tests owned by 5 prior stories — `4-8` (lint-csp-source-coverage), `4-2` (determinism-harness + byte-stable), `7-6` (cognitive-load-budget), `1-6` (negative-assertion-lints), `1-1` (makefile). Each was opened via `tds story unfreeze-tests --story=<owner>` and closed via `tds integrity record --story=<owner>`; all owners stayed `done` (no status flip). Confirm this is acceptable for a bridge and that re-recording under the owning story (vs bridge-9a-1) is the intended ledger semantics.
- **Two pre-existing integrity failures** (`_tds/sprint-status-extension.yaml`, `stories/7-6-…md`) flagged by `tds integrity verify` (verified=184 failed=2). Provenance verified per lesson-2026-06-03-002: `git diff HEAD --` for both is EMPTY → recorded-sha-vs-committed drift from today's earlier bridge setup (08:27–08:29), NOT introduced by this story. Left untouched per lesson-2026-05-19-013 (don't fight the sweep).

**Tested edge cases:**

- Red→green anchor: `lint-coverage-isolation.test.mjs` Test A (structural guard — coverage test must not invoke the lint at default scope) was confirmed RED pre-fix, GREEN post-fix.
- Enforcement unweakened: `lint-csp-source --paths=<CSP-violating-file>` → exit 1 (verified); `lint-coverage-isolation` Test B proves default-scope lint observes a poisoned shared `dist/` (exit 1) while the scoped invocation ignores it (exit 0).
- Determinism preserved: `byte-stable` (two fresh tmpdir builds) green; `determinism-harness` 17/17 green.
- Flake closure: `make test` 10× consecutive (intra-suite parallel) → fail=0; `make test` 6× under a concurrent external `make build`/`make clean` churn loop on shared `dist/` → fail=0 (vs 3/5 flaky before the reader isolation).

## Auditor Findings (round-1)

### [info] The scaffold suite (tests/scaffold/*, incl. the new permanent guard lint-coverage-isolation.test.mjs) and `make test` are not exercised by any CI job (confirmed via lesson-2026-06-03-001: workflows run per-spec/per-lint + Playwright only). The concurrency-isolation invariant this story enforces is therefore validated locally only; a future regression that re-introduces a shared-dist read would not be caught by CI. Explicitly scoped out of this bridge, recorded as deferred for retro aggregation.

- **Category:** ci-coverage
- **Suggested bridge:** `Add a CI job that runs the tests/scaffold glob (or `make test`) so the concurrency-isolation guard and other scaffold-local invariants gain CI coverage.`
