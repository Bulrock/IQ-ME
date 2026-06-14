---
id: 14-6-assessment-question-to-answer-rendering-correctness
title: "Story 14.6: Assessment question-to-answer rendering correctness"
status: done
---

# Story 14.6: Assessment question-to-answer rendering correctness

## Story

As a **test-taker comparing a matrix question against its candidate answers**,
I want **the answer options rendered at the same visual scale and fidelity as a cell of the question grid, with clearly distinguished selection states**,
so that **I judge each candidate on its merits rather than fighting size mismatch, clipping, or ambiguous selection feedback that could distort my response and therefore my score**.

## Acceptance Criteria

1. **Grid dimensions are a per-item source of truth, surfaced to the DOM (PR-24).** The matrix grid is no longer a CSS-only assumption: `corpus/item-parameters.schema.json` gains OPTIONAL integer `gridRows`/`gridCols` item properties; `methodology-registry.js` exposes `resolveGrid(item)` as the single place that reads them and DEFAULTS to 3×3 when absent; and `item-runner.js` reads the grid through `resolveGrid` (never re-assuming 3×3 inline) and exposes the column count additively as `data-grid-cols` (with `data-grid-rows`) on `section.item-runner`, so the rendered-scale verification can compute the matrix-cell edge as `.item-runner__image` bbox width ÷ the column count. The frozen Epic 11/13 DOM contracts (`section.item-runner`, `#item-runner-heading`, `fieldset.item-runner__options`, the radio group `name`/`value`) are preserved — names and values unchanged, the grid attributes are additive only.

2. **The four stub pools keep validating; NFR27 parity holds (PR-24).** Because `gridRows`/`gridCols` are OPTIONAL (not in the item `required` array), the four existing stub pools — `item-parameters.json`, `item-parameters-geometric-full.json`, `item-parameters-letter-number.json`, `item-parameters-letter-number-full.json`, which all omit them — keep validating under `additionalProperties: false` and exercise the 3×3 default path. The new fields are language-neutral numeric metadata (no EN stem/explanation prose introduced, no schema-default prose), so no `sourceHashEN` cascade is triggered (NFR27) and the build stays byte-stable (NFR21).

3. **±5% rendered-scale parity verification (PR-24).** `tests/playwright/pr2-mobile-layout.spec.mjs` is tightened from the Epic-11 PR-2b ±10% (60–110%) tolerance to a ±5% target and superseded: a rendered-scale leg asserts each `.item-runner__option-figure` rendered width is within ±5% of the matrix-cell edge (= `.item-runner__image` bbox width ÷ the `data-grid-cols` column count) across the 320/600/1024/1440 breakpoints. This is a VERIFICATION assertion (a same-origin geometry check), not a production runtime throw — no third-party runtime is introduced (NFR6/NFR7). No pixel baselines are produced here; the RENDERED visual-regression baselines run on `ubuntu-latest` CI / Story 14.11.

4. **Aspect-ratio fidelity + explicit keyboard focus indicator, state-distinct registers (PR-24).** `item-runner.css` keeps `aspect-ratio: 1 / 1` on the matrix image, option figure, and option image (no stretch/squash/letterbox), and adds an explicit `.item-runner__option input:focus-visible` keyboard focus indicator using only the semantic `--color-focus-ring` token (not the browser default outline), clearing WCAG 2.2 AA 2.4.7 / 2.4.11 (non-obscured) and 1.4.11 (≥3:1 non-text contrast). The selected / focused / hovered / disabled / unselected registers are each visually distinct without relying on colour alone (WCAG 1.4.1): selection carries a heavier inline-start shape marker (`--space-2` vs the idle `--space-1`), disabled carries a `cursor:not-allowed` affordance cue. `item-runner.css` consumes only semantic roles — no `--glass-*`/`--color-neutral-*` primitive, no literal hex (two-layer rule UX-DR1).

5. **Augmentation transforms the matrix only; scoring stays filename-keyed (PR-24).** Augmentation (`rot90`/`rot180`/`flip-h`/...) applies via CSS `transform` to the matrix `.item-runner__image` ONLY — option images and figures never receive a transform — and the correct answer stays matched by raw filename (`value === item.correct`). A regression guard asserts the transform set targets the matrix image exclusively and that the scoring match is the raw filename comparison, so if options ever DO receive augmentation without a scoring re-key the guard fails loudly. No change to `item.correct` keying, the seed/PRNG selection, or the recorded 0/1 response semantics; `src/scoring/**` is untouched.

6. **Node guard/contract verification runs locally; rendered verification deferred to 14.11 (PR-24).** A node guard (`tests/scaffold/14-6-assessment-rendering-correctness.test.mjs`) RUNS in `make test` and asserts: (a) the schema has the optional `gridRows`/`gridCols` integer fields; (b) the four stub pools still validate; (c) the `resolveGrid` 3×3 default + explicit-read behavior; (d) the renderer exposes `data-grid-cols`/`data-grid-rows` without inline 3×3 re-assumption; (e) the frozen DOM markers; (f) the augmentation regression guard; (g) the `item-runner.css` `:focus-visible` rule, state-distinct registers, aspect-ratio fidelity, and two-layer cleanliness. The ±5% rendered-scale Playwright leg + visual-regression baselines run on `ubuntu-latest` CI / Story 14.11 (authoring host is darwin). The `css-components-lines` budget (≤2600) and `app-modules-bytes` budget (≤110592) are preserved.

**Requirements covered:** PR-24
**Depends on:** 14.2

## Tasks / Subtasks

- [x] **Task 1: Grid dimensions as data (AC: 1, 2)**
  - [x] Add OPTIONAL integer `gridRows`/`gridCols` (minimum 1) to the item schema in `corpus/item-parameters.schema.json` — NOT added to `required`, so the four omitting stub pools keep validating under `additionalProperties: false`
  - [x] Add `resolveGrid(item)` to `methodology-registry.js` — reads `item.gridRows`/`gridCols`, defaults to 3×3 (and falls back to 3 on non-integer / <1)
- [x] **Task 2: Renderer reads + exposes the grid (AC: 1)**
  - [x] `item-runner.js` imports `resolveGrid`, computes `grid` in `buildMarkup`, and emits `data-grid-rows`/`data-grid-cols` on `section.item-runner` (additive — frozen contract names/values unchanged); `updateItemInPlace` keeps the attributes in sync as items advance
- [x] **Task 3: CSS — focus-visible + state-distinct + aspect-ratio (AC: 4)**
  - [x] Add `.item-runner__option input:focus-visible` keyboard indicator (`outline: var(--space-1) solid var(--color-focus-ring)`, token-only)
  - [x] Make selection distinct by SHAPE (`border-inline-start-width: var(--space-2)`) and disabled distinct by `cursor:not-allowed` — not colour alone (WCAG 1.4.1); keep `aspect-ratio: 1/1` on matrix/figure/option image
- [x] **Task 4: ±5% scale-parity Playwright verification (AC: 3)**
  - [x] Tighten `pr2-mobile-layout.spec.mjs` from ±10% to ±5% and add a rendered-scale leg reading `data-grid-cols` across 320/600/1024/1440; no pixel baselines (deferred to 14.11)
- [x] **Task 5: Node guard + budgets (AC: 5, 6)**
  - [x] Author `tests/scaffold/14-6-assessment-rendering-correctness.test.mjs` (schema optional fields, 4 pools validate, `resolveGrid` default, `data-grid-cols` exposure, frozen DOM markers, augmentation guard, focus-visible/state/aspect/two-layer); confirm both budgets and the node suite (modulo pre-existing 9-series reds)

## Dev Notes

### Implementation strategy
- The grid is a PER-ITEM source of truth, not a per-variant one, so the registry's `resolveGrid(item)` reads the item directly and defaults to 3×3; `resolveVariant` (pool URL + session size) is unchanged. Centralising the read in the registry is what lets `item-runner.js` stop re-assuming 3×3 inline — the renderer just calls `resolveGrid(item)` and forwards `grid.cols`/`grid.rows` to the DOM.
- The four stub pools omit `gridRows`/`gridCols`, so the schema fields MUST be optional — they are added to the item `properties` but NOT to `required`. The hand-rolled draft-07 validator (`tests/contract/_item-parameters-schema-check.mjs`) only flags additional/missing-required keys, so an OPTIONAL field that is present-in-schema-but-absent-in-data validates cleanly. Verified: all four pools still pass `validateItemParameters`.
- `data-grid-cols`/`data-grid-rows` are ADDITIVE attributes on the existing `section.item-runner` — the frozen Epic 11/13 contract (`section.item-runner`/`#item-runner-heading`/`fieldset.item-runner__options`/radio `name="item-<N>"`/`value="<filename>"`) is byte-stable in names + values. The in-place renderer (`updateItemInPlace`, PR-3) re-derives the grid per item so a future mixed-grid pool stays correct on Next/Previous.
- CSS: the selected register previously differed from focus/hover by the `--color-focus-ring` hue alone. To clear WCAG 1.4.1 it now also carries a heavier inline-start marker (`--space-2` vs the idle `--space-1`) — a shape cue legible without colour. The new `.item-runner__option input:focus-visible` ring is keyboard-only (the label-level `:focus-within` fires for any focus), token-only, and does not rely on the browser default outline. The option-figure sizing (`clamp(3rem, 11vh, 6rem)`, `aspect-ratio: 1/1`) is unchanged, so the ±5% cell parity is preserved; the +4px selected-border is on the label, not the measured figure.
- Augmentation stays matrix-only: every `[data-augmentation="…"] { transform … }` rule is keyed on `.item-runner__image`, options carry no `data-augmentation` attribute, and scoring is the raw `value === item.correct` filename comparison. The guard fails loudly if an option ever receives a transform or the scoring match is re-keyed — the regression tripwire the AC requires.

### Verification
- `node --test tests/scaffold/14-6-assessment-rendering-correctness.test.mjs` → green (13 tests).
- Full node suite (`tests/scaffold/**`, `tests/contract/**/*.spec.mjs`, `tests/unit/**`) → 1338 pass / 14 fail; the 14 fails are ALL the pre-existing 9-series human-gated guards (ICAR PDF / PL translator sign-off / CODEOWNERS) — zero new failures attributable to this story.
- `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` 2281/2600 (was 2259; +22 for the focus-visible + selected-shape + disabled rules); `app-modules-bytes` 104198/110592 (was 102452; +1746 for the `resolveGrid` helper + the renderer grid read/expose).
- `make lint` → exits 0.
- `src/scoring/**` is UNMODIFIED (`git diff --stat` empty). The ±5% rendered-scale Playwright leg + visual-regression baselines run on `ubuntu-latest` CI / Story 14.11 — never on the darwin authoring host.

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): every new story spec must carry this section. Apply: present on 14.6; the `make lint` carry-forward gate (`lint-spec-carry-forward`) depends on it.
- lesson-2026-06-03-002 (severity=high): back any "pre-existing red" claim with a baseline. Apply: the 14 node fails are the 9-series human-gated guards (ICAR PDF / PL translator sign-off / CODEOWNERS @TBD) — they assert on real human deliverables this code story does not touch; the only Epic-14-attributable additions here are the optional schema fields, the `resolveGrid` helper, the additive `data-grid-*` attributes, the `item-runner.css` focus/state rules, the tightened Playwright spec, and the new guard.
- Grid as data, not assumption (PR-24 finding). Apply: the registry's `resolveGrid` is the SINGLE place that reads + defaults the grid, so the renderer never re-assumes 3×3 inline and the option/cell scale parity can be computed against a real column count exposed as `data-grid-cols` — the runtime link the prior CSS-only assumption lacked.
- Optional schema fields keep `additionalProperties:false` pools green. Apply: `gridRows`/`gridCols` are added to item `properties` but NOT `required`, so the four omitting stub pools validate unchanged; a contract assertion pins this so a future story can't silently make them required and break the stubs.
- WCAG 1.4.1 is shape, not just colour (UX-DR a11y). Apply: selection is distinguished by a heavier inline-start marker and disabled by `cursor:not-allowed`, so the registers stay legible where hue is imperceptible; the new keyboard focus ring is token-only and does not lean on the browser default outline.
- Epic-14 verification is RENDERED, deferred to 14.11 (structural source-text guards alone missed the Epic 13 invisible-redesign). Apply: this story ships the node source-text + schema + live-default guard for `make test`; the ±5% rendered-scale parity leg + pixel baselines are produced on `ubuntu-latest` CI by 14.11, never on the darwin authoring host.
- Never touch the IRT scoring core (Epic-12/13 guardrail). Apply: `src/scoring/**` is byte-identical (empty `git diff --stat`); scoring stays the raw `value === item.correct` filename match, the augmentation regression guard fails loudly if that invariant is ever broken.

## Dev Agent Record

### File List
- `corpus/item-parameters.schema.json` (schema: added OPTIONAL integer `gridRows`/`gridCols` item properties — not in `required`, so the four stub pools keep validating under `additionalProperties:false`)
- `src/assessment/methodology-registry.js` (added `resolveGrid(item)` + `DEFAULT_GRID_ROWS`/`DEFAULT_GRID_COLS` + `gridDimension` helper — single place that reads the per-item grid and defaults to 3×3; `resolveVariant`/`resolveFromState` unchanged)
- `src/assessment/item-runner.js` (imports `resolveGrid`; `buildMarkup` computes `grid` and emits additive `data-grid-rows`/`data-grid-cols` on `section.item-runner`; `updateItemInPlace` keeps them in sync per item — frozen DOM contract names/values and scoring untouched)
- `src/css/components/item-runner.css` (added `.item-runner__option input:focus-visible` token-only keyboard ring; selected register made shape-distinct via `border-inline-start-width: var(--space-2)`; added disabled `:has(input:disabled)` `cursor:not-allowed` register; aspect-ratio fidelity preserved; semantic roles only)
- `tests/playwright/pr2-mobile-layout.spec.mjs` (tightened ±10%→±5%; added the rendered-scale leg reading `data-grid-cols` across 320/600/1024/1440 — verification assertion, no pixel baselines)
- `tests/scaffold/14-6-assessment-rendering-correctness.test.mjs` (new — node guard/contract: optional schema fields, 4 pools validate, `resolveGrid` default, `data-grid-cols` exposure, frozen DOM markers, augmentation regression guard, focus-visible/state/aspect/two-layer)
- `_bmad-output/implementation-artifacts/stories/14-6-assessment-question-to-answer-rendering-correctness.md` (this spec)
