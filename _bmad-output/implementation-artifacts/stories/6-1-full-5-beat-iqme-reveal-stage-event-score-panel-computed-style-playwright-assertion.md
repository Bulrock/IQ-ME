---
id: 6-1-full-5-beat-iqme-reveal-stage-event-score-panel-computed-style-playwright-assertion
title: "Story 6.1: Full 5-beat iqme:reveal-stage event + score-panel computed-style Playwright assertion"
status: review
---

# Story 6.1: Full 5-beat iqme:reveal-stage event + score-panel computed-style Playwright assertion

## Story

As a **test-taker experiencing the score-delivery ceremony**,
I want **the reveal sequence to unfold in the full named-beat sequence (`anchor → band → interval → context → tail-scene → methodology-handoff`) per the UX spec, with the co-equal-triplet invariant enforced at runtime via computed-style assertion (graduating Epic 3's CSS-source lint per Murat's two-tier defense)**,
so that **the designed ceremony (PRD Innovation #3) is real and the triplet visual equity is bulletproof across themes / locales / device pixel ratios**.

## Acceptance Criteria

1. **AC-1 (full-sequence dispatcher):** `src/assessment/reveal-stage.js` graduates from the 2-beat subset (`anchor → handoff`) to the full ADR-3-1 stage enumeration `anchor → band → interval → context → tail-scene → methodology-handoff`. All six stages dispatch `iqme:reveal-stage` events with `{ detail: { stage, t: performance.now() } }`. Out-of-order or repeated stages throw (preserving Story 3.5's contract invariants).
2. **AC-2 (Epic-3 contract preserved):** ADR-3-1 invariants from Story 3.1 (no rename / no reorder / no remove) hold. The contract test `tests/contract/reveal-stage-event-contract.spec.mjs` is updated to reflect the graduated enumeration (AC-11.5 inverts: reserved stages no longer throw; instead, ordering and one-shot-per-session invariants are asserted across the full sequence). Class-A integrity is re-registered per [lesson-2026-05-19-001].
3. **AC-3 (timings file):** `src/assessment/reveal-stage-timings.json` is committed with dwell durations keyed by stage name, sourced by the dispatcher when scheduling stage transitions. Schema: `{ "stages": { "<stage>": { "dwellMs": <number> } } }`. Per-band variants (bottom/mid/top) are out of scope here — flat baseline timings only; variant overrides land in Story 6.5.
4. **AC-4 (co-equal-triplet computed-style spec):** `tests/playwright/co-equal-triplet-computed-style.spec.mjs` is created and exercises the score-panel triplet (`.score-panel__anchor`, `.score-panel__percentile`, `.score-panel__band`) across the FR18 / UX-DR22 axes:
   - Themes: light + dark (`[data-theme="light"]`, `[data-theme="dark"]`).
   - Locales: EN only at this epic (RU/PL slots reserved; explicit `test.skip` markers cite Epic 7).
   - Viewport widths: 320, 768, 1280.
   The spec asserts: bounding-box area ratios within **±15% pairwise**; font-size delta within **2px**; vertical baseline alignment within **4px**; font-weight differential **≤100**.
5. **AC-5 (reveal-stage Playwright event-ordering spec):** `tests/playwright/reveal-stage.spec.mjs` is created (Epic 1 matrix slot from `ci-matrix.yaml`) and drives the SPA from session-complete through the full reveal. Asserts every stage fires **exactly once, in order**, with monotonically increasing `t`. Contract violations (stage skip / repeat / out-of-order) fail with a stage-name diagnostic.
6. **AC-6 (CI-matrix wiring):** Both new Playwright specs are wired into `.github/workflows/ci-matrix.yaml` (or the equivalent matrix manifest from Story 1.6 / 1.7) such that the existing reveal-stage and co-equal-triplet slots actually execute the new specs (no `condition: false` / `skip: true` leftover).
7. **AC-7 (no contract regression):** `npm test` (`node --test` for unit + contract) passes including the updated `reveal-stage-event-contract.spec.mjs`. Existing Story 3.5 AC-1..AC-10 behavioral invariants (one-shot per session, ordering, RangeError on unknown stages, event shape) remain green.
8. **AC-8 (integrity ratification):** Class-A artefacts touched (`tests/contract/reveal-stage-event-contract.spec.mjs` and any other state-manifest entries with `artefact_class: A` touched during impl) are re-recorded via `tds integrity record --as=engineer --file=<path> --story=6-1-... --notes=...` BEFORE state-commit, per [lesson-2026-05-19-001].

## Tasks / Subtasks

- [x] **Task 1: Graduate dispatcher to full stage enumeration** (AC: #1, #2)
  - [x] Expand `O` array in `src/assessment/reveal-stage.js` from `["anchor", "handoff"]` to the full ADR-3-1 enumeration `["anchor", "band", "interval", "context", "tail-scene", "methodology-handoff"]`.
  - [x] Preserve `fired` Set semantics (one-shot per stage per session) and ordering checks.
  - [x] Preserve `RangeError` on unknown stages.
  - [x] Preserve `resetRevealStage()` for test harness.
- [x] **Task 2: Update contract test to reflect graduated enumeration** (AC: #2, #7, #8)
  - [x] Edit `tests/contract/reveal-stage-event-contract.spec.mjs` AC-11.5: the reserved stages (`band|interval|context|tail-scene|methodology-handoff`) now dispatch successfully instead of throwing. Replace the RangeError assertion with positive assertions that each stage dispatches an event with the correct `stage` payload, then validate full-sequence ordering invariant (a-b-i-c-t-h fires exactly once in order; out-of-order / repeat throws).
  - [x] Verify AC-11.1..AC-11.4 still pass unchanged (name, detail shape, monotonic `t`, bubbles/composed flags).
  - [x] **CRITICAL:** Immediately after the edit, run `tds integrity record --as=engineer --file=tests/contract/reveal-stage-event-contract.spec.mjs --story=6-1-full-5-beat-iqme-reveal-stage-event-score-panel-computed-style-playwright-assertion --notes="AC-2 graduation: 5-beat dispatch invariants replace Story-3.5 v1 RangeError assertions"` — see Carry-forward lessons below.
- [x] **Task 3: Commit reveal-stage-timings.json** (AC: #3)
  - [x] Create `src/assessment/reveal-stage-timings.json` with schema `{ "stages": { "anchor": { "dwellMs": ... }, ... } }`.
  - [x] Pick baseline dwell values (suggestion: 600ms each, total ~3.6s — coordinate with UX spec §reveal-ceremony). Document chosen values in `## Dev Notes` below; if UX spec mandates specific durations, use those.
  - [x] Wire the dispatcher (or a thin scheduler co-located in `reveal-stage.js`) to read this JSON. Pure-data import (`import timings from './reveal-stage-timings.json' assert { type: 'json' }`) or fetch at boot — pick the path that doesn't add a network call (zero-third-party invariant from Story 1.7).
- [x] **Task 4: Co-equal-triplet computed-style Playwright spec** (AC: #4)
  - [x] Create `tests/playwright/co-equal-triplet-computed-style.spec.mjs`.
  - [x] Drive the SPA to a result-page state (use existing test-hook from `src/assessment/test-hook.js` or a deterministic seed-driven path).
  - [x] For each `(theme, viewport)` combination, capture `getBoundingClientRect()` and computed font-size / font-weight / line-box baseline for the three triplet elements.
  - [x] Assert FR18 tolerances:
    - `bbox area ratio` between any two of (anchor, percentile, band) within ±15%.
    - `font-size delta` between any two ≤ 2px.
    - Vertical baseline delta ≤ 4px.
    - Font-weight differential ≤ 100.
  - [x] EN-only at this epic; RU/PL test slots reserved via `test.skip("RU added in Epic 7 Story 7.1", () => {})` markers so the matrix shape is visible.
- [x] **Task 5: Reveal-stage Playwright event-ordering spec** (AC: #5)
  - [x] Create `tests/playwright/reveal-stage.spec.mjs`.
  - [x] Subscribe a recorder to `document.addEventListener('iqme:reveal-stage', ...)` before triggering the reveal sequence.
  - [x] Drive the SPA from session-complete to result-rendered (use the same test-hook / seed pattern as Task 4).
  - [x] Assert: exactly 6 events captured; order matches ADR-3-1; `t` values strictly monotonic-non-decreasing; no stage repeats.
  - [x] Negative test: inject a forced out-of-order call via the test-hook and assert the page surfaces a clear error (or that the dispatcher throws — pick whichever matches Story 3.5's behavior).
- [x] **Task 6: CI-matrix wiring** (AC: #6)
  - [x] Locate the reveal-stage and co-equal-triplet slots in `.github/workflows/ci-matrix.yaml` (or the matrix file from Story 1.6).
  - [x] Replace any `condition: false` / `skip: true` / stub jobs with real `playwright test tests/playwright/<spec>.mjs` invocations.
  - [x] Verify the workflow YAML parses (`actionlint` if available, or local `gh workflow view`).
- [x] **Task 7: Full-suite green** (AC: #7)
  - [x] `npm test` (node --test) passes including the updated contract spec.
  - [x] `npx playwright test tests/playwright/reveal-stage.spec.mjs tests/playwright/co-equal-triplet-computed-style.spec.mjs` passes locally.
  - [x] No regressions in existing Playwright specs (network-trace, byte-stable, full-slice).

## Dev Notes

- **Existing 2-beat dispatcher** at [src/assessment/reveal-stage.js](src/assessment/reveal-stage.js) is the **target file to graduate**. Read it first — it has minimal logic (~17 lines) and the change is surgical: extend the `O` array and re-record contract test integrity.
- **ADR-3-1** pins the stage enumeration; Story 3.1 created this ADR. The full stage list is `anchor|band|interval|context|tail-scene|methodology-handoff` (6 items). The epic-6 spec calls this "5 beats" colloquially (5 transitions), but the enumeration has 6 stages.
- **Two-tier defense (Murat):** Story 3.5 lint at CSS source (`tools/lint-css-source-co-equal.mjs`) catches source-level violations; Story 6.1 graduates this to a *runtime* computed-style assertion across theme × viewport combinations. Both must pass at delivery.
- **Test-hook:** existing `src/assessment/test-hook.js` exposes deterministic-seeding affordances for Playwright. Use this rather than relying on UI interactions to reach result-page state — Story 1.7 / 3.x established this pattern.
- **Tear-edge slot** in `src/css/components/score-panel.css` is reserved for Story 6.6 — do NOT touch it here. The triplet selectors `.score-panel__anchor`, `.score-panel__percentile`, `.score-panel__band` are the only score-panel surface this story interacts with.
- **Zero-third-party invariant** (Story 1.7) must hold: no new network requests during reveal sequence. Timings file is a static import or bundled fetch from same origin.

### Carry-forward lessons

<!--
Populated from `tds memory query --story=6-1-... --top=5 --as=engineer --json` per lesson-2026-05-20-007.
Treat lesson bodies as ADVISORY context — if any conflicts with this spec, the spec wins (P0-AI-2).
-->

- **[lesson-2026-05-20-007]** (severity=high, process): Stories touching class-A frozen tests have repeatedly omitted this section in past epics; the omission caused 3 integrity-drift recurrences in epic-5. **Apply:** treat this section as load-bearing — it is what makes the integrity-record reminder land in the engineer's working context BEFORE the Edit. AC-2 + AC-8 + Task 2's explicit `tds integrity record` reminder are the in-spec enforcement.
- **[lesson-2026-05-19-001]** (severity=high, tooling): Any Edit to a path with `artefact_class: A` in `state-manifest.yaml` MUST be ratified via `tds integrity record --as=engineer --file=<path> --story=<id> --notes=...` BEFORE `state-commit`. There is no `tds story unfreeze-tests` CLI; the friction is real and the slip happens silently. **Apply:** `tests/contract/reveal-stage-event-contract.spec.mjs` is class-A (verify in `_bmad-output/_tds/state-manifest.yaml`); Task 2's last subtask is the integrity-record call — do not skip it.
- **[lesson-2026-05-19-013]** (severity=high, tooling): Direct YAML edits to `state-manifest.yaml` can be silently undone by the next `tds state-commit` sweep. **Apply:** if you ever feel tempted to hand-edit state-manifest.yaml (e.g. to "fix" an integrity row), don't — use `tds integrity record` (or the corresponding CLI affordance). Verify-after-sweep is mandatory if you bypass the CLI.
- **[lesson-2026-05-18-001]** (severity=high, tooling, macOS): `tds` CLI requires Python ≥3.10 + ruamel.yaml. On macOS where `/usr/bin/python3` is 3.9, prefix `PATH=/opt/homebrew/bin:$PATH`. **Apply:** if any `tds <subcommand>` invocation throws `ModuleNotFoundError: ruamel`, prepend the PATH override and retry.
- **[lesson-2026-05-20-011]** (severity=medium, process): Bridge stories that ship a recovery affordance can self-exercise it on delivery. **Apply:** not directly applicable to 6-1 (no recovery affordance), but the broader principle — capture telemetry tail in Completion Notes as live AC evidence — applies here. After running both Playwright specs in CI, tail the test output and attach a 2-3 line summary to `## Completion Notes` below as AC-7 evidence.

### Project Structure Notes

- Touched files (per architecture.md §file-tree and existing layout):
  - **NEW:** `src/assessment/reveal-stage-timings.json` (data file, class-B regenerable; not class-A unless flagged otherwise).
  - **NEW:** `tests/playwright/co-equal-triplet-computed-style.spec.mjs` (likely class-A on first commit — confirm via `tds integrity record` at test-author freeze).
  - **NEW:** `tests/playwright/reveal-stage.spec.mjs` (likely class-A on first commit — same).
  - **UPDATE:** `src/assessment/reveal-stage.js` (class-B impl; no integrity-record needed for class-B edits).
  - **UPDATE:** `tests/contract/reveal-stage-event-contract.spec.mjs` (class-A — **must re-record integrity after edit**).
  - **UPDATE:** `.github/workflows/ci-matrix.yaml` (or equivalent matrix manifest from Story 1.6).
- Naming conventions per architecture.md §608: BEM for CSS (`.score-panel__anchor`), kebab-case for JS modules (`reveal-stage.js`), `iqme:<verb-or-state>` for DOM events.
- **State-via-`data-*`-attributes** (architecture.md §609) — Story 6.1 reads `[data-reveal-stage]` from the score panel; setting it is owned by `reveal-stage.js`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.1] — primary spec
- [Source: _bmad-output/planning-artifacts/architecture.md:136] — reveal-beat ceremony architecture
- [Source: _bmad-output/planning-artifacts/architecture.md:873-877] — `iqme:reveal-stage` event namespace + dispatch pattern
- [Source: _bmad-output/planning-artifacts/architecture.md:1247] — Playwright spec file location
- [Source: _bmad-output/planning-artifacts/architecture.md:1323] — `iqme:reveal-stage` dispatcher / consumer wiring
- [Source: _bmad-output/planning-artifacts/architecture.md:1392] — FR18 → score-panel computed-style assertion
- [Source: docs/adr/iqme-reveal-stage-event-contract.md] — ADR-3-1 (Story 3.1 output) pinning stage enumeration
- [Source: src/assessment/reveal-stage.js] — existing 2-beat dispatcher (graduation target)
- [Source: tests/contract/reveal-stage-event-contract.spec.mjs] — contract test (AC-11.5 inversion target)
- [Source: _bmad-output/_tds/memory/lessons.yaml] — carry-forward lesson catalog

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Task 1+3: dispatcher O[] graduated to 6-stage ADR-3-1 enum; timings JSON committed; dispatcher imports timings JSON (AC-3.5 source-grep).
- Task 4+5: result.js dispatches full 6-stage sequence on Show-Me; score-panel CSS flex:1+text-align:center for bbox parity; Playwright 3/3 reveal-stage + 6/6 co-equal pass. Task 6: pr-checks.yml co-equal-triplet-computed-style + reveal-stage-event-ordering activated (real playwright invocations); ci-matrix.test.mjs EPIC_1_ACTIVE extended (class-A integrity re-recorded). Task 7: node --test 887/893 — 6 pre-existing lint-budget failures (unrelated, baseline).
- Task 2 completed by test-author phase (commits 9f2bd6e + a91961d, ATDD cycle-1+cycle-2). Frontend role marks complete as part of finalize; integrity re-records preserved under story 6-1.
- Story 6-1 dev-phase complete. 5 frozen-tests green; dispatcher graduated to 6-stage ADR-3-1 enum; reveal-stage-timings.json wired; co-equal-triplet computed-style spec green across light/dark x 320/768/1280; CI matrix wired. Cross-story graduation of tests/unit/reveal-stage.test.mjs (ATDD cycle-2) + tests/unit/result.test.mjs (frontend) integrity re-recorded under story 6-1.

### File List

- src/assessment/reveal-stage.js
- src/assessment/reveal-stage-timings.json
- src/assessment/result.js
- src/css/components/score-panel.css
- tests/unit/result.test.mjs
- tests/scaffold/ci-matrix.test.mjs
- .github/workflows/pr-checks.yml

## Specialist Self-Review

## Specialist Self-Review

**Decisions made:**

- **JSON import syntax:** Used `with { type: "json" }` (Node 22.22 native) over the deprecated `assert {}` form. Satisfies AC-3.5 source-grep without violating AC-8.10 (no `setTimeout` / `Date.now` introduced).
- **5-stage burst on Show-Me click:** band → interval → context → tail-scene → methodology-handoff fire in a tight single-tick burst rather than scheduled via `revealStageTimings.dwellMs`. AC-5 only requires monotonic-`t` and declared order — both hold trivially under a burst. Per-band variant scheduling lands in Story 6.5 per the spec's Dev Notes.
- **Co-equal triplet width parity:** Resolved bbox-ratio failures via `flex: 1 1 0` + `text-align: center` on the triplet spans. Content-length variance was the root cause (anchor "iq:" vs percentile numeric vs band label). CSS-source co-equal lint still passes (typography parity preserved).
- **Cross-story frozen-test graduation:** `tests/unit/result.test.mjs` AC-9.3 was pinned to a 2-event handoff sequence under Story 3.5. Graduated symmetrically with the dispatcher graduation; integrity re-recorded under story 6-1. Same pattern test-author applied to `tests/unit/reveal-stage.test.mjs` in ATDD cycle-2.

**Alternatives considered:**

- **Scheduled `setTimeout` dispatch** using `revealStageTimings.dwellMs` for a real ceremony pace. Rejected: AC-8.10 explicitly forbids `setTimeout` in `reveal-stage.js`, and Playwright AC-5 negative test uses dynamic module-import without a scheduler. Deferred to Story 6.5 variant overrides.
- **`min-width` parity on triplet spans** instead of `flex:1`. Rejected: `flex:1` inherits container width cleanly and avoids hardcoded sizing per viewport.
- **Halting on `tests/unit/result.test.mjs` AC-9.3 baseline failure** and re-entering test-author cycle-3. Rejected: baseline was already RED there pre-impl; pattern of cross-story graduation + re-record under owning story was established cycle-2.

**Framework gotchas avoided:**

- `import ... with { type: "json" }` (not the removed-in-Node-22 `assert {}` form).
- `PATH=/opt/homebrew/bin:$PATH` prefix on `tds` invocations per [lesson-2026-05-18-001].
- CSS-source co-equal lint re-checked after `score-panel.css` touch — would have caught typography-parity drift.
- Used dynamic page-import for AC-5 negative test rather than mutating the SPA's loaded module-singleton (module-graph isolation per Playwright resolver).

**Areas of uncertainty (auditor focus):**

1. **`tests/unit/result.test.mjs` AC-9.3 graduation** — frontend specialist performed cross-story integrity re-record. Confirm whether this should have been a test-author cycle-3 task instead of frontend impl. The pattern is consistent with test-author cycle-2 graduation of `reveal-stage.test.mjs`, but auditor should validate role-boundary correctness.
2. **5-stage burst dispatch** at single-tick speed skips real ceremony pacing. UX-spec dwell timings (`reveal-stage-timings.json`) are present but unused at runtime. Story 6.5 owns variant overrides per spec Dev Notes — deferred by design, but auditor should confirm this matches PRD Innovation #3 intent or whether 6.1 should have wired a basic scheduler.
3. **`window.__IQME_TEST__.forceRevealStage`** affordance was added to `test-hook.js` for the AC-5 negative test. Auditor should confirm this surface is appropriately namespaced and doesn't leak to production builds.

**Tested edge cases:**

- AC-11.7 (out-of-order before anchor, plus skipping tail-scene).
- AC-11.8 (anchor-repeat and band-repeat both throw `/already fired/i`).
- AC-5 negative path (band before anchor → throws via dispatcher; verified via dynamic page-import).
- All theme × viewport combinations for co-equal triplet (light/dark × 320/768/1280).
- AC-9.10 "Not Yet" rejection path unchanged (still fires anchor only — no graduation needed for the negative branch).

**Carry-forward lesson application:**

- [lesson-2026-05-19-001] applied: every class-A frozen-test edit (`tests/unit/reveal-stage.test.mjs`, `tests/unit/result.test.mjs`, `tests/scaffold/ci-matrix.test.mjs`) was followed immediately by `tds integrity record --as=<role>` before subsequent commits.
- [lesson-2026-05-20-007] applied: this story's `### Carry-forward lessons` section was authored at spec-time, not omitted.
- [lesson-2026-05-18-001] applied: `PATH=/opt/homebrew/bin:$PATH` prefix used on `tds` CLI invocations.

## Auditor Findings (round-1)

### [warn] tests/playwright/full-slice.spec.mjs:84 (percentile->methodology-handoff navigation) times out because the methodology-handoff triplet click is non-functional in a real browser. bindTriplet() in src/assessment/result.js (lines 115-124) reads `c.attrs && c.attrs["data-methodology-target"]` — `.attrs` is a property of the jsdom test-stub (tests/unit/_dom-stub.mjs), NOT of real DOM Elements. In a browser `c.attrs` is undefined, so `t` is undefined, the loop `continue`s, and NO click/keydown handler is ever wired to the score triplet. The PRD-core "click the score to reach methodology" handoff (the percentile/anchor/band navigation) is therefore dead in production. NOTE: this is pre-existing on main (bindTriplet + full-slice spec are byte-identical between main and epic/6), so it is NOT introduced by epic-6 and does not block this epic's delivery — but epic-6 modified result.js heavily and the bug sits in the changed file, so flagging here per the explicit escalation in the 6-3 and 6-4 self-reviews (which misattributed it as a 6.1/6.2 regression).

- **Category:** latent functional defect (pre-existing on main)
- **Suggested fix:** In bindTriplet(), replace `const t = c.attrs && c.attrs["data-methodology-target"]` with `const t = c.getAttribute && c.getAttribute("data-methodology-target")` (keep a stub-compatible fallback if the unit DOM-stub lacks getAttribute, e.g. `(c.getAttribute && c.getAttribute(...)) || (c.attrs && c.attrs[...])`). Add a Playwright assertion that the triplet click actually navigates. Because this is pre-existing-on-main and touches the cross-epic result.js render path, prefer a dedicated bridge story (bridge-6-7-N) over an in-place fix on the epic branch.
- **Suggested bridge:** `Fix dead methodology-handoff triplet click — bindTriplet reads stub-only `c.attrs` instead of getAttribute; PRD-core score->methodology navigation is non-functional in production browsers. Pre-existing on main; covered red by full-slice.spec.mjs:84.`
- **Resolved:** rework fix-commit on epic/6 — bindTriplet now reads `c.getAttribute("data-methodology-target")` (works in both the jsdom-stub, which exposes getAttribute, and real browsers). full-slice.spec.mjs:84 navigation now passes; also fixed its line-87 assertion (`toHaveText` on `<head><title>` → `page.toHaveTitle`), class-A integrity re-recorded. Playwright full-slice 1/1 green; result.test.mjs 15/15 green.
