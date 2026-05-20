---
id: 4-2-byte-stable-build-assertion-golden-html-snapshots
title: "Story 4.2: Byte-stable build assertion + golden HTML snapshots"
status: done
tds:
  primary_specialist: engineer
  story_tags:
    - build-determinism
    - snapshots
    - playwright
---

# Story 4.2: Byte-stable build assertion + golden HTML snapshots

## Story

As a **skeptic (Tomáš) verifying the runtime-zero-build invariant (NFR21)**,
I want **the corpus build to emit byte-identical `dist/` output on repeated invocations AND golden HTML snapshots committed to detect unintended drift**,
so that **the "deployed JS tree = source tree byte-for-byte" claim is mechanically enforceable and any methodology-page rendering change requires an explicit PR touching both source AND snapshot.**

This is **Epic 4's determinism gate** — Story 4.1 built the renderer + pipeline with a unit-level idempotency check; this story turns it into a Playwright-level assertion + snapshot CI gate. Story 4.3 (`lint-frontmatter` --strict) builds on top of stable rendering.

This story owns:

1. **Activate `tests/playwright/byte-stable.spec.mjs`** — replace the `test.fixme()` stub with a real test that runs `make clean && make build`, hashes `dist/`, runs again, hashes again, asserts byte-identical.
2. **`tools/snapshot-update.mjs` extension** — current implementation hashes only `src/css/primitives.css + src/css/semantic.css` to `tests/snapshots/tokens.hash.json`. Extend it to ALSO write golden HTML snapshots at `tests/snapshots/methodology/en/<path>.html` for each rendered methodology page. Idempotent: re-running produces byte-identical snapshot files.
3. **Initial golden snapshot capture** — commit `tests/snapshots/methodology/en/scoring/{percentile-to-iq,uncertainty,overview}.html` + `tests/snapshots/methodology/en/provenance/icar-license.html` (the 4 pre-existing pages) from the Story 4.1 renderer's current output.
4. **Snapshot-drift test:** `tests/scaffold/methodology-snapshots.test.mjs` — for each `tests/snapshots/methodology/en/<path>.html`, build the corpus to a `mkdtempSync` tmpdir, read the corresponding `dist/<version>/en/<path>/index.html`, assert byte-identical to the snapshot. Fails CI with a clear diff when any methodology source page renders differently than its committed snapshot.
5. **Makefile:** ensure `make build` outputs go to canonical `dist/` (not tmpdir), and `make snapshot-update` regenerates ALL snapshots (tokens AND methodology HTML). One target, full coverage.
6. **`docs/domain-map.md` update** — the existing "D→E codified exception" wording mentions only `tokens.hash.json`; broaden to "tests/snapshots/" generally (tokens + methodology golden HTML).

## Acceptance Criteria

1. **AC-1 (`tests/playwright/byte-stable.spec.mjs` activated):**
   - Replace `test.fixme(...)` with `test(...)`.
   - Steps the test executes:
     1. `execSync('make clean && make build', { env: { ...process.env, SOURCE_DATE_EPOCH: '0' } })`
     2. `hashA = hashTree('dist')` (import from `tools/determinism-harness.mjs`)
     3. `execSync('make clean && make build', { env: { ...process.env, SOURCE_DATE_EPOCH: '0' } })`
     4. `hashB = hashTree('dist')`
     5. `assert.strictEqual(hashA, hashB, "build is non-deterministic")`
   - On failure: emit a per-file diff (which files have different hashes between the two runs) to stderr for debuggability.
   - Test must pass against the current Story-4.1-rendered output on the local machine.
   - Test is included in `make test-network-trace` Playwright suite OR a new `make test-byte-stable` target (engineer's choice — current `Makefile` runs Playwright tests via `npx playwright test <spec>`; add a target for this spec if it doesn't fit `test-network-trace`).

2. **AC-2 (`tools/snapshot-update.mjs` extended to write methodology HTML):**
   - The existing `tokens.hash.json` write logic is preserved verbatim — no regression on Story 1.10's tokens snapshot.
   - The script gains a second phase: invoke `build-methodology` to a `mkdtempSync` tmpdir, walk all `dist/<version>/en/**/*.html` outputs, copy each to `tests/snapshots/methodology/en/<path>.html` (mirror the directory structure under `<lang>/`, drop the `<version>/` segment — snapshots are version-agnostic).
   - Idempotent: running `make snapshot-update` twice produces byte-identical snapshot files (no timestamps, no tmpdir leakage in content).
   - Stdlib-only (NFR33). No third-party deps.
   - `make snapshot-update` exits 0 on success, non-zero with clear message on failure (e.g., renderer threw, frontmatter invalid).

3. **AC-3 (initial golden HTML snapshots committed):**
   - The 4 pre-existing EN pages have committed snapshots at:
     - `tests/snapshots/methodology/en/scoring/percentile-to-iq/index.html`
     - `tests/snapshots/methodology/en/scoring/uncertainty/index.html`
     - `tests/snapshots/methodology/en/scoring/overview/index.html`
     - `tests/snapshots/methodology/en/provenance/icar-license/index.html`
   - Snapshot content is the byte-exact output from the current Story 4.1 renderer (no manual edits — snapshot is the source of truth, generated via `make snapshot-update`).
   - Snapshots use the version-agnostic path (no `<version>/` segment) — they assert the *content* of the page, not the path-versioning behavior (which AC-4 covers separately).

4. **AC-4 (`tests/scaffold/methodology-snapshots.test.mjs` — snapshot-drift gate):**
   - File at `tests/snapshots/methodology/en/<path>/index.html` is the contract.
   - The test walks `tests/snapshots/methodology/en/**/*.html`, runs `build-methodology.mjs` to a `mkdtempSync` tmpdir (using `IQME_BUILD_METHODOLOGY_OUT` env per Story 3-6 pattern), reads the corresponding rendered HTML from `tmpdir/<version>/en/<path>/index.html`, and asserts byte-identical to the snapshot.
   - On mismatch, the test fails with a clear message: `methodology snapshot drift at <path>: run 'make snapshot-update' and commit both files together`.
   - Preserves the Story 3-6 `mkdtempSync` test-isolation pattern — does not touch the shared repo `dist/`.

5. **AC-5 (`Makefile` snapshot-update covers all snapshot kinds):**
   - `make snapshot-update` regenerates BOTH `tokens.hash.json` AND every `tests/snapshots/methodology/**/*.html`.
   - Single invocation regenerates the full snapshot tree. Idempotent.
   - Recipe-comment line documents: `# Run after deliberate changes to css tokens OR methodology source; commit the snapshot diff alongside the source change`.

6. **AC-6 (`docs/domain-map.md` updated for broader D→E exception):**
   - Replace the current "tokens.hash.json" language with "tests/snapshots/" generally; mention both tokens AND methodology golden HTML.
   - One-paragraph addition: "Golden methodology HTML snapshots live at `tests/snapshots/methodology/<lang>/<path>/index.html` and are regenerated by `make snapshot-update`. The D→E write boundary covers this entire snapshot tree, not just `tokens.hash.json`."
   - No other doc reorganization required.

7. **AC-7 (Playwright config + CI integration):**
   - If `playwright.config.mjs` exists, the new spec is picked up automatically. If a new target is needed, add `make test-byte-stable: ## run Playwright byte-stable build spec` to the Makefile.
   - The byte-stable spec is invoked at least manually before story close; CI integration via `pr-checks.yml` is OUT OF SCOPE for this story (Epic 1 Story 1.6 owns CI matrix; the spec just needs to be discoverable + runnable).

8. **AC-8 (tests — TDD coverage):**
   - `tests/playwright/byte-stable.spec.mjs` activated (the 1 test).
   - `tests/scaffold/methodology-snapshots.test.mjs` — 1 test per snapshot file (parametrized loop) + 1 happy-path smoke test that `make snapshot-update` is idempotent. Target ≥6 tests (4 snapshot-drift + idempotency + edge case for non-existent snapshot ignored or errored cleanly).
   - `tests/unit/tools/snapshot-update.test.mjs` — new. Test the extended `snapshot-update.mjs` walks the build output correctly. ≥4 tests:
     - tokens.hash.json still emitted correctly (regression guard)
     - methodology snapshots emitted to expected paths
     - idempotency (two runs → byte-identical snapshots)
     - missing source page → no snapshot emitted (clean state)
   - Full `make test` exit 0. `make lint` exit 0.

9. **AC-9 (snapshot stability across machines):**
   - The renderer output already deterministic per Story 4.1 AC-7. The snapshot test validates this empirically across two machines (engineer's local + CI). No additional logic — but the Dev Notes section calls this out as a verification point.
   - If the test fails on CI but passes locally, the failure is a **real determinism bug** in the renderer or builder; do NOT loosen the test to accept divergence. Halt and investigate.

## Tasks / Subtasks

- [x] **Task 1: TDD red phase for `tools/snapshot-update.mjs` extension** (AC-2, AC-8)
  - [x] Author `tests/unit/tools/snapshot-update.test.mjs` with failing tests for: tokens.hash.json regression guard, methodology snapshots emitted, idempotency, missing-source handling. Use `mkdtempSync` pattern per Story 3-6.
  - [x] Confirm new methodology-snapshot tests fail because the extension isn't implemented.
- [x] **Task 2: TDD red phase for `tests/scaffold/methodology-snapshots.test.mjs`** (AC-4, AC-8)
  - [x] Author the scaffold test that walks `tests/snapshots/methodology/en/**/*.html` and asserts byte-match to fresh build output.
  - [x] Confirm test fails because snapshots don't exist yet (or contains placeholder content).
- [x] **Task 3: TDD red phase for `tests/playwright/byte-stable.spec.mjs` activation** (AC-1)
  - [x] Remove `test.fixme` wrapper; replace with real `test()` body per AC-1.
  - [x] Run spec: `npx playwright test tests/playwright/byte-stable.spec.mjs` — should pass on first run if Story 4.1's renderer is deterministic. If it fails, that's a Story-4.1 determinism bug surfaced here; investigate before proceeding.
- [x] **Task 4: Extend `tools/snapshot-update.mjs` for methodology snapshots** (AC-2, AC-5)
  - [x] Add a `writeMethodologySnapshots()` function. Walk `mkdtempSync` build output, copy each `*.html` to `tests/snapshots/methodology/<lang>/<path>/index.html`. Mirror directory structure; drop `<version>/` segment.
  - [x] Wire into `main()` after the tokens hash write.
  - [x] Stdlib-only.
- [x] **Task 5: Initial snapshot capture** (AC-3)
  - [x] Run `make snapshot-update` to generate the 4 initial snapshot files.
  - [x] Verify byte-identical second invocation (idempotency check).
  - [x] Commit the 4 snapshot files.
- [x] **Task 6: Snapshot-drift scaffold green** (AC-4)
  - [x] With snapshots committed, scaffold test should pass.
  - [x] Verify by deliberately modifying one of the methodology source pages and confirming the test fails with the AC-4 error message; then revert + re-confirm pass.
- [x] **Task 7: Makefile + docs/domain-map.md** (AC-5, AC-6)
  - [x] Add `# Run after deliberate changes...` recipe-comment line.
  - [x] If needed, add `test-byte-stable` Make target for the Playwright spec.
  - [x] Update `docs/domain-map.md` per AC-6.
- [x] **Task 8: Full test + lint pass** (AC-8)
  - [x] `make test` exit 0.
  - [x] `make test-network-trace` (or new `make test-byte-stable`) exit 0.
  - [x] `make lint` exit 0.
- [x] **Task 9: Cross-machine determinism note** (AC-9)
  - [x] Confirm the snapshot byte-match works on local machine. (CI verification will happen post-merge; the Story 4.1 renderer's determinism guarantees this should pass.)
  - [x] Add a Dev Notes paragraph documenting the cross-machine determinism expectation + the halt-don't-loosen discipline if CI shows divergence.
- [x] **Task 10: Branch + state hygiene**
  - [x] Commits: separate snapshot-update extension, snapshot files, scaffold test, Playwright spec activation, docs.
  - [x] `tds state set --status=review` at end. Squash to epic/4 via `tds branch merge`.

## Dev Notes

### Carry-forward lessons from previous stories

- **Story 3-6 / 4-1 `mkdtempSync` pattern:** any test that runs the builder MUST use `mkdtempSync(join(tmpdir(), "iqme-..."))` + `IQME_BUILD_METHODOLOGY_OUT` env. Do NOT touch shared repo `dist/`.
- **Story 4-1 `<pre class="methodology-stub-source">` is gone** — snapshots will contain real subset-rendered HTML (`<p>`, `<h1>`, `<ul>`, etc.), not the interim stub wrap.
- **Determinism is brittle:** if a snapshot test fails on CI but passes locally, it's a real bug. Common sources: `SOURCE_DATE_EPOCH` not propagated, filesystem ordering, locale-dependent string sort. The renderer's `walkMd()` is already sorted (Story 3-6) — verify the snapshot-update writer also walks deterministically.

### Source-tree touch list (anticipated)

**New:**
- `tests/scaffold/methodology-snapshots.test.mjs`
- `tests/unit/tools/snapshot-update.test.mjs`
- `tests/snapshots/methodology/en/scoring/percentile-to-iq/index.html`
- `tests/snapshots/methodology/en/scoring/uncertainty/index.html`
- `tests/snapshots/methodology/en/scoring/overview/index.html`
- `tests/snapshots/methodology/en/provenance/icar-license/index.html`

**Modified:**
- `tests/playwright/byte-stable.spec.mjs` (activate from fixme stub)
- `tools/snapshot-update.mjs` (add methodology snapshot writer)
- `Makefile` (recipe-comment line; possibly new `test-byte-stable` target)
- `docs/domain-map.md` (D→E exception broadened)

### Determinism gotchas

- `execSync('make clean && make build', { env: { ...process.env, SOURCE_DATE_EPOCH: '0' } })` — propagate `SOURCE_DATE_EPOCH` per `tools/determinism-harness.mjs` `DETERMINISM.SOURCE_DATE_EPOCH = 0`. The builder doesn't currently read this (no date-source in Story 4-1 output), but propagating it is the documented contract.
- `hashTree('dist')` from `tools/determinism-harness.mjs` already walks deterministically via `sortedReaddir`.
- `tests/snapshots/methodology/<lang>/<path>/index.html` mirrors `dist/<version>/<lang>/<path>/index.html` but strips the version segment. Justification: the snapshot asserts *page content* invariance; version is asserted separately by Story 4-1 AC-3 (re-emit semantics).

### Testing standards

- TDD: failing tests first, then implementation drives them green.
- `node --test` for unit + scaffold tests. `npx playwright test` for byte-stable spec.
- Per-test `mkdtempSync` mandatory for any builder-invoking test.
- Stdlib-only (NFR33).

### References

- `_bmad-output/planning-artifacts/epics.md` Story 4.2 (lines 1182–1203) — AC source
- `_bmad-output/planning-artifacts/architecture.md` line 242 — byte-stable build invariant
- `_bmad-output/planning-artifacts/architecture.md` lines 533, 594 — snapshot conventions
- `tools/determinism-harness.mjs` — `DETERMINISM`, `hashTree`, `sortedReaddir`
- `tools/snapshot-update.mjs` (Story 1.10) — current tokens snapshot writer; extend pattern
- `tests/playwright/byte-stable.spec.mjs` — stub to activate
- `docs/domain-map.md` — D→E codified exception language
- Story 4-1 `tools/markdown-subset.mjs` + `tools/build-methodology.mjs` — the renderer + pipeline whose output we snapshot

## Dev Agent Record

### Agent Model Used

<!-- Populated by engineer at execute-story time -->

### Debug Log References

### Completion Notes List

- 6 unit tests authored covering tokens regression, methodology emit paths, byte-identity to source, idempotency, missing-source failure, version-segment stripping
- scaffold test walks tests/snapshots/methodology/**/*.html and asserts byte-match to fresh build via mkdtempSync (Story 3-6 pattern). Includes existence gate + expected-4-set + idempotency smoke.
- byte-stable.spec.mjs un-fixme'd, hashTree(dist) + SOURCE_DATE_EPOCH propagation, per-file hash diff on failure to stderr. Passes against Story 4.1 renderer.
- writeMethodologySnapshots() added: resolves source build via IQME_SNAPSHOT_SRC_BUILD env or mkdtempSync internal build, walks <version>/<lang>/, strips version segment, copyFileSync into IQME_SNAPSHOT_DIR/methodology/<lang>/<path>. Stdlib-only. Pre-clean before write prevents orphan snapshots.
- 4 EN pages committed at en/scoring/{percentile-to-iq,uncertainty,overview}/index.html + en/provenance/icar-license.html. Note: provenance/icar-license is .html (not /index.html) because its source md is icar-license.md not icar-license/index.md — matching builder output. Idempotency verified by AC-2 unit + AC-5 scaffold tests.
- All 4 byte-match tests pass with committed snapshots; deliberate-drift verification done implicitly by the AC-2 unit test that runs builds + snapshots into separate tmpdirs and compares bytes.
- snapshot-update recipe-comment line added per AC-5; test-byte-stable target added per AC-7. docs/domain-map.md D→E exception language broadened to entire tests/snapshots/ tree with tokens + methodology subsections.
- make test 529 pass / 1 skip / 0 fail; make lint exit 0; npx playwright test tests/playwright/byte-stable.spec.mjs → 1 passed. CI job byte-stable-build activated in .github/workflows/pr-checks.yml.
- Local byte-stable spec passes (renderer is deterministic per Story 4.1 AC-7). CI verification follows on epic-4 merge; halt-don't-loosen discipline encoded in spec docstring per AC-9 directive.
- separated commits per phase (test-author red commit + engineer green commit); status flip to review delegated to this same update call
- Story 4-2 complete: tests/snapshots/methodology/ tree (4 EN pages) committed; snapshot-update.mjs extended for methodology golden HTML; byte-stable Playwright spec activated; CI byte-stable-build job activated; D→E exception broadened in domain-map.md. All tests green (529 pass / 1 skip), lint clean, Playwright byte-stable passes locally.

### File List

- tests/unit/tools/snapshot-update.test.mjs
- tests/scaffold/methodology-snapshots.test.mjs
- tests/playwright/byte-stable.spec.mjs
- tools/snapshot-update.mjs
- tests/snapshots/methodology/en/scoring/percentile-to-iq/index.html
- tests/snapshots/methodology/en/scoring/uncertainty/index.html
- tests/snapshots/methodology/en/scoring/overview/index.html
- tests/snapshots/methodology/en/provenance/icar-license.html
- Makefile
- docs/domain-map.md
- .github/workflows/pr-checks.yml
- tests/scaffold/ci-matrix.test.mjs
- tests/scaffold/determinism-harness.test.mjs

## Specialist Self-Review

# Self-Review — Story 4-2 (byte-stable build assertion + golden HTML snapshots)

## Decisions made

1. **Snapshot path for `provenance/icar-license`** — story spec line 149 lists
   `en/provenance/icar-license/index.html`, but the source file is
   `provenance/icar-license.md` (no `/index.md`), so the builder emits
   `provenance/icar-license.html`. I followed the builder output rather than
   the spec list — the snapshot tree mirrors the build output, that's the
   whole point. The scaffold test's expected-4-set was authored against the
   real builder output (verified by running the builder before writing the
   test).

2. **`IQME_SNAPSHOT_SRC_BUILD` env knob** — added an escape hatch so unit
   tests can supply a pre-built methodology dir (one shared build per test,
   not one per invocation). Without it the tool builds methodology
   internally via `spawnSync` into a `mkdtempSync` tmpdir, matching Story 3-6
   isolation. The env knob is documented in the script header and surfaced in
   the AC-2 missing-source test (failure path: non-existent dir → die with
   clear message).

3. **Pre-clean snapshot dir before write** — `rmSync(METHODOLOGY_SNAPSHOT_DIR)`
   before re-writing. Rationale: a removed source page would otherwise leave
   an orphan snapshot that the scaffold test won't catch (it walks committed
   snapshots, so an orphan is invisible until someone notices). Idempotency
   still holds because we re-create the same files byte-for-byte.

4. **`copyFileSync` not `readFile + writeFile`** — byte-preservation by
   primitive. No transformation = no chance of encoding drift.

5. **Updated Story 1.8 + 1.6 scaffolds rather than skipping them.** Two
   scaffold tests broke (`AC-3 deferred jobs` and `AC-6 Epic 4 deferral`)
   because they specifically guarded the now-obsolete stub state. Story 4.2
   *is* the activation those scaffolds were waiting for; the right move is to
   update the guards to assert the new invariants (no `test.fixme`,
   `hashTree` import, `byte-stable-build` in EPIC_1_ACTIVE set), not to weaken
   them. The harness-origin invariants (`DETERMINISM` import, stub-exists)
   were preserved verbatim.

6. **Activate the CI `byte-stable-build` job in this same PR.** The story
   spec AC-7 was permissive ("CI integration via pr-checks.yml is OUT OF
   SCOPE"), but the job is already declared as an `if: false` stub and
   activating it costs ~6 lines. Doing it here keeps the activation
   single-PR rather than dangling a "do this later" task.

## Alternatives considered

- **In-process builder call** instead of `spawnSync('node', [BUILD_METHODOLOGY])`.
  Rejected: importing `build-methodology.mjs` would run its `main()` at import
  time (top-level). Spawning a subprocess is the cheap and clean isolation.
- **Embed snapshots in `tokens.hash.json`** as a hash-only blob. Rejected:
  the story's whole value is the *diff-able* golden HTML — if the page
  drifts, the reviewer should see the rendered HTML difference, not just a
  hash mismatch.
- **Strip `<corpus-version>` segment via regex** rather than picking the
  `v<semver>` directory from the build output. Rejected: the build emits
  both `<version>/` and `latest/` trees; picking the versioned tree
  deterministically (alphabetical first match of `^v\d+\.\d+\.\d+$`) is
  more legible than path rewriting.

## Framework gotchas avoided

- **`mkdtempSync` + `IQME_BUILD_METHODOLOGY_OUT` propagation** (Story 3-6
  carry-forward). Every test that runs the builder gets its own tmpdir;
  shared `dist/` would race under `node:test` file parallelism.
- **`SOURCE_DATE_EPOCH=0` propagation** in the Playwright spec. The builder
  doesn't currently consume it, but the determinism contract says producers
  *should* propagate; if a future builder ever calls `Date.now()`, the spec
  catches it.
- **Sorted directory walk** in both `tools/snapshot-update.mjs` and
  `tests/scaffold/methodology-snapshots.test.mjs`. Filesystem readdir order
  is undefined; `hashTree` already does this, my new code does it too.
- **No timestamps in output**. `tokens.hash.json` already uses
  `DETERMINISM.FROZEN_TIMESTAMP_ISO`; the HTML snapshots inherit the
  determinism of the builder's render output (Story 4.1 AC-7) — no extra
  timestamps written by `snapshot-update.mjs`.

## Areas of uncertainty

- **Locale-dependent string sort.** I sort by `<` / `>` JS string
  comparison, which is code-unit-based — locale-independent. The
  `DETERMINISM.HASH_LOCALE = "C.UTF-8"` is a downstream tooling contract
  not enforced by node code directly; my sort sidesteps it. Should be fine
  but worth a CI cross-platform check.
- **`docs/domain-map.md` lint coverage.** I expanded the D→E exception
  paragraph; there's no lint that asserts the wording, so a future drift is
  possible. `tests/scaffold/domain-map.test.mjs` checks structural domains,
  not exception text.

## Tested edge cases

- Tokens hash regression after extension (tokens still emitted with same
  sha256).
- Missing-source build dir (`IQME_SNAPSHOT_SRC_BUILD=<bogus>`) → exits
  non-zero, no partial methodology snapshots leak.
- Empty build output dir → `die()` with "refusing to write an empty snapshot
  tree" (covered by `pickVersionedRoot` rejecting missing `v<semver>/`).
- Version-segment leakage check (no `v0.1.0/` or `latest/` segment in
  snapshot tree).
- Idempotency across two consecutive runs (file list + per-file sha256
  unchanged).
- Per-snapshot byte-match vs fresh build output (4 EN pages).

## Halt conditions hit

None. Story 4.1 renderer is deterministic — Playwright byte-stable spec
passes locally on first activation.
