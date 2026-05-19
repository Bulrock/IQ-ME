---
id: 3-4-implement-item-runner-progress-indicator-16-item-session-with-fr7-seed
title: "Story 3.4: Implement item-runner + progress-indicator (16-item session with FR7 seed)"
status: review
---

# Story 3.4: Implement item-runner + progress-indicator (16-item session with FR7 seed)

## Story

As an **English-speaking test-taker who has clicked Continue past consent**,
I want **to answer 16 matrix-reasoning items one at a time with keyboard navigation, a visible progress indicator, the ability to revise previous answers, and no time pressure (FR2, FR3, FR5)**,
so that **I can complete the test deliberately and the architecture's 128-bit-seed-deterministic subset selection (FR7) is exercised end-to-end**.

This is **Epic 3's first computational-runtime story** — Story 3.3 landed the SPA shell + landing + consent scenes; this story mounts the `#/test` route handler that consent's Continue flips to (per 3-3 AC-5.9). Story 3.5 will mount the score-panel + reveal-stage; Story 3.6 will populate the methodology stub pages. **This story owns the item-runner scene + the 128-bit seed plumbing + the deterministic item-subset PRNG + a stub item-pool (16 placeholder items deferred to Epic 9a-2 for real-ICAR replacement) sufficient to exercise the FR7 end-to-end contract**.

## Acceptance Criteria

1. **AC-0 (`src/items/item-parameters.json` + 16 placeholder SVG items — stub-pool deferred to Epic 9a-2):**
   - **Context:** Architecture gap #1 (`architecture.md` line 1420) placed `item-parameters.json` authoring "in Epic 1 alongside ICAR confirmation". Epic 1 shipped no items story; real ICAR-MR confirmation lands in Epic 9a-1/9a-2 (post-launch gate). To unblock Story 3-4's FR7 contract without depending on the gated ICAR pool, this story ships a **stub item-pool** that satisfies the shape contract; Story 9a-2 will swap in the real ICAR items behind the same schema.
   - File at exact path: `src/items/item-parameters.json`.
   - JSON structure: `{ "schemaVersion": "1.0", "poolSize": 16, "items": [ { "id": "stub-001", "a": <number>, "b": <number>, "asset": "stub-001.svg", "options": ["A", "B", "C", "D", "E", "F"], "correct": "<one-of-options>" }, … ×16 ] }`. Exactly 16 items at v1 (pool == session size since real pool isn't here yet; Story 9a-2 expands `poolSize` so FR7's subset-selection becomes non-trivial).
   - IRT `a` parameter: fixed at `1.0` for all 16 stub items (no discrimination variation — the stub is shape-only, not calibrated).
   - IRT `b` parameter: spans `[-2.0, +2.0]` in even 0.25-step increments across the 16 items (16 × 0.25 = 4.0 logits range). The values are deterministic placeholders; Story 9a-2 replaces with real ICAR `b` parameters.
   - 16 files at `src/items/stub-001.svg` … `src/items/stub-016.svg` — minimal valid SVG (one `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="50" text-anchor="middle">Item N</text></svg>` ≤ 200 bytes per file, well under the NFR2 50 KB-per-item budget). LF / UTF-8 / no BOM / trailing newline.
   - File header comment in `item-parameters.json` (as JSON cannot carry comments, embed in a `_note` top-level key, removed by Epic 4 build pipeline ignoring underscore-prefixed keys): `"_note": "STUB POOL — placeholder items + IRT params authored in Story 3-4 for FR7 contract exercise. Real ICAR-MR items + calibrated parameters land in Story 9a-2 (ICAR license confirmation gate). DO NOT SHIP TO PRODUCTION without Epic 9a-2 completion. Schema is forward-compatible."`
   - **Schema file:** also create `corpus/item-parameters.schema.json` (per architecture gap #1 line 1420 — "add `corpus/item-parameters.schema.json` for symmetry with other corpus contracts") — minimal JSON Schema draft-07 pinning the shape above. Validated by a new contract test (see AC-10.5).

2. **AC-1 (`src/assessment/item-prng.js` — xoshiro128 deterministic PRNG):**
   - File at exact path: `src/assessment/item-prng.js` (architecture line 1072: "xoshiro128 seeded from session seed").
   - Named exports: `createPrng(seed128)` → returns `{ next() }` where `next()` produces a `Uint32` deterministically.
   - `seed128` is a `Uint8Array(16)` (16 bytes = 128 bits — the output of `crypto.getRandomValues(new Uint8Array(16))`).
   - Internal state: four `Uint32`s derived from the 16-byte seed (the standard xoshiro128++ state layout; little-endian word reads from the byte array).
   - `next()` implements **xoshiro128++** per Sebastiano Vigna's reference (`https://prng.di.unimi.it/xoshiro128plusplus.c`): `result = rotl(state[0] + state[3], 7) + state[0]` then the standard four-word LCG-mix-and-rotate. The result is `>>> 0` to coerce to `Uint32`.
   - **No `Math.random`, no `Date.now`, no `localStorage`, no `sessionStorage`, no `console.log`** (NFR10 — architecture line 346).
   - Pure function module: no side effects on import, no module-level mutable singletons. Multiple `createPrng()` calls with the same seed produce byte-identical sequences (asserted by AC-10.2).
   - **Inline-copy posture:** architecture line 813 explicitly says "a small inline xoshiro128 in `src/assessment/` — written twice if needed per inline-copy rule". This story writes it once; if Story 3-5 or later needs a separate PRNG instance (e.g. for image-augmentation), it copies rather than imports across cohort boundaries.

3. **AC-2 (`src/assessment/item-selection.js` — FR7 subset + ordering):**
   - File at exact path: `src/assessment/item-selection.js`.
   - Named exports: `selectSession(pool, seed128, sessionSize)` → returns `{ items: [<itemId>, ...], augmentations: [<augmentationCode>, ...] }`.
   - `pool` is the parsed `item-parameters.json` `items[]` array; `seed128` is a `Uint8Array(16)`; `sessionSize` is `16` (the v1 default per FR7).
   - At v1 (stub-pool == session size): `selectSession` returns all 16 pool items in a **deterministic permutation** of `[0..15]` derived from the seed (Fisher-Yates shuffle using the xoshiro128++ stream). For Story 9a-2 (when `poolSize > sessionSize`), the function must also pick which `sessionSize` items from the pool — at that point, do a uniform-random subset selection first, then permute. The v1 stub MUST work correctly when those two steps collapse (subset == pool) — i.e., the shuffle is the only randomized step.
   - `augmentations[i]` is one of `["none", "rot90", "rot180", "rot270", "flip-h", "flip-v"]` (6 augmentation codes per architecture line 813 — "per-item image augmentation, deterministic from seed"). The augmentation code for position `i` is `aug_codes[ next() % 6 ]` where `next()` is drawn after the shuffle completes. Order matters: shuffle exhausts N draws, then augmentations exhaust sessionSize more draws.
   - **No `Math.random`, no `Date.now`, no `localStorage`, no `sessionStorage`, no `console.log`** (NFR10).
   - Pure function: byte-identical input → byte-identical output (asserted by AC-10.3).

4. **AC-3 (`src/assessment/item-runner.js` — the scene; FR2 / FR3 / FR5):**
   - File at exact path: `src/assessment/item-runner.js` (architecture line 1071: "FR2-FR5").
   - Named exports: `render(rootEl, strings)`, `unmount()`. No default export.
   - **On render (first mount per session):**
     - Call `crypto.getRandomValues(new Uint8Array(16))` to generate the session seed (FR7, NFR10). Store via `state.setSeed(hexString)` from `state.js` (Story 3-2 exported this; `setSeed` accepts a 32-character lowercase hex string — convert the Uint8Array to hex via `Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`).
     - Fetch `/src/items/item-parameters.json` via `fetch()`. On failure, render an error fallback via `error-fallback.js` (Story 3-3 shipped this).
     - Call `selectSession(pool.items, seed128, 16)` → `{ items, augmentations }`. Cache the result module-level for the session's lifetime; subsequent re-renders (e.g. after Previous/Next) reuse the same selection (FR7 requirement: "subset is reproducible within the same session to support FR2 answer revision").
     - Render the current item (`state.getState().currentItem` → 0 on first mount).
   - **Per-item DOM (FR3, UX-DR20, UX-DR32):**
     - `<section class="item-runner" aria-labelledby="item-runner-heading">`
       - `<h1 id="item-runner-heading" class="visually-hidden">{strings.itemRunner.headingTemplate}</h1>` — headingTemplate is `"Item {N} of {total}"` with `{N}` and `{total}` substituted at render. Visually-hidden for SR users; the visible progress indicator carries the visual cue.
       - `<div class="item-runner__progress" role="status" aria-live="polite" aria-current="step" data-testid="progress-indicator">{strings.itemRunner.progressTemplate}</div>` (UX-DR20 — progress indicator with `aria-live="polite"` + `aria-current="step"`). `progressTemplate` is `"Item {N} of {total}"` (visible text, mirrors heading). Progress text updates on every navigation.
       - `<img class="item-runner__image" src="/src/items/{itemAsset}" alt="" data-augmentation="{augmentationCode}" />` — SVG/PNG matrix item. `alt=""` because the item is a visual reasoning task; meaningful alt-text would constitute test compromise (per NFR13 visuospatial disclosure landed in 3-3 consent scene — there is no synthetic alt-text that captures the patterns honestly). Apply the augmentation via CSS `transform` (see AC-9).
       - `<fieldset class="item-runner__options">`
         - `<legend class="visually-hidden">{strings.itemRunner.optionsLegend}</legend>` ("Select one option")
         - For each option in the item: `<label class="item-runner__option"><input type="radio" name="item-{N}" value="{option}" /><span>{option}</span></label>` (UX-DR32: "native `<input type="radio">` with associated `<label>` — no custom-div widgets"). The `name` attribute scopes the radio group to the current item.
       - `<div class="item-runner__nav">`
         - `<button type="button" class="item-runner__prev" id="prev-btn" {N === 0 ? 'aria-disabled="true"' : ''}>{strings.itemRunner.previousButton}</button>` ("Previous" — disabled on item 0).
         - `<button type="button" class="item-runner__next" id="next-btn" {N === 15 ? '' : ''}>{strings.itemRunner.nextButton}</button>` ("Next"). On item 15 (the last), the button label changes to `strings.itemRunner.submitButton` ("Submit").
       - `</section>`
   - **No countdown, no per-item timer, no `[data-timer]` attribute, no `aria-timer` attribute anywhere in the DOM** (FR5; AC-10.6 asserts this via source grep).
   - **Event handlers:**
     - Radio change: `state.recordResponse(currentItem, selectedOptionIndex)` (Story 3-2 exported this; `selectedOptionIndex` is the integer index of the option in the item's options array — convert from `event.target.value` via `pool.items[currentItem].options.indexOf(value)`).
     - Previous click: if `currentItem > 0`, `state.setItem(currentItem - 1)`, re-render. If `aria-disabled="true"`, no-op.
     - Next click: if `currentItem < 15`, `state.setItem(currentItem + 1)`, re-render. If `currentItem === 15`, dispatch `routing.navigate('result')` (Story 3.5 mounts the `#/result` route).
     - On re-render: if `state.getState().responses[currentItem]` exists, pre-check the corresponding radio (FR2 — answer revision).
   - **On unmount:** remove all radio change listeners, remove Previous/Next click listeners, clear `rootEl.innerHTML`.
   - **No `localStorage`, no `sessionStorage`, no `navigator.share`, no `role="alert"`, no `Math.random`, no `console.log`** (NFR9, NFR10).

5. **AC-4 (state.js integration — `setSeed`, `setItem`, `recordResponse`, `getState`):**
   - Story 3-2 already exports `setSeed(hexString)`, `setItem(n)`, `recordResponse(itemIndex, optionIndex)`, `resetState()`, `getState()`. Story 3-4 consumes them; does NOT modify `state.js`.
   - **`setSeed` contract reminder (Story 3-2 ADR):** accepts a 32-char lowercase hex string. `item-runner.js` MUST convert the Uint8Array(16) to hex before calling. The contract test (`tests/contract/state-shape.spec.mjs`) continues to pass.
   - **`recordResponse` contract reminder:** stores `{itemIndex: <int>, response: <int>}` in `getState().responses[itemIndex]`. Overwrites on re-record (FR2 answer revision). Existing contract test covers this.

6. **AC-5 (routing.js integration — register `#/test` route):**
   - Story 3-3's `routing.js` registers routes `''`, `'#/'` → landing; `'#/consent'` → consent. Unknown hashes fall back to landing.
   - Story 3-4 extends the route table: `'#/test'` → item-runner. `routing.js` MUST be modified to:
     - Import `* as itemRunner from "./item-runner.js"`.
     - Add `"#/test": itemRunner` to the `ROUTES` table.
     - The integrity of routing.js MUST be re-recorded after edit (see Story 3-3 self-review's Decision 4 / lesson-2026-05-19-001 — frozen test files; routing.js itself is production source, not artefact_class=A, but the integrity record discipline applies to spec drift).
   - **No new exports from routing.js**; only the route table grows.
   - The existing 8 routing unit tests (`tests/unit/routing.test.mjs`, frozen from Story 3-3) continue to pass.

7. **AC-6 (`src/assessment/i18n/en/strings.json` — extend with `itemRunner` namespace):**
   - Modify `src/content/i18n/en/strings.json` (Story 3-3 shipped this) to add a top-level `itemRunner` namespace with the following keys (concrete EN copy below; the dev agent MAY refine wording within the same length budget):
     - `itemRunner.headingTemplate`: `"Item {N} of {total}"` (SR heading)
     - `itemRunner.progressTemplate`: `"Item {N} of {total}"` (visible progress)
     - `itemRunner.optionsLegend`: `"Select the option that best completes the pattern"`
     - `itemRunner.previousButton`: `"Previous"`
     - `itemRunner.nextButton`: `"Next"`
     - `itemRunner.submitButton`: `"Submit"`
     - `itemRunner.fetchErrorMessage`: `"Could not load the item set. Try reloading."`
   - Existing namespaces (`chrome`, `landing`, `consent`) unchanged.
   - JSON validity preserved (`python3 -c "import json; json.load(open('src/content/i18n/en/strings.json'))"` exits 0).

8. **AC-7 (`src/css/components/item-runner.css` + `progress-indicator.css` — minimal hand-rolled CSS):**
   - Two new files in `src/css/components/`:
     - `item-runner.css` — layout for `.item-runner`, `.item-runner__image`, `.item-runner__options`, `.item-runner__option`, `.item-runner__nav`, `.item-runner__prev`, `.item-runner__next`. Image augmentation via CSS attribute selectors: `[data-augmentation="rot90"] { transform: rotate(90deg); }`, etc. (6 cases). Use semantic tokens only; no literal hex / px / font-family (same self-check as Story 3-3 AC-9).
     - `progress-indicator.css` — layout for `.item-runner__progress`. Semantic tokens only.
   - **`visually-hidden` utility:** add to `src/css/utilities/visually-hidden.css` (new file — utilities directory is empty per Story 3-3 baseline). Standard visually-hidden pattern: `position: absolute; width: 1px; height: 1px; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap;`. Cover the heading + legend uses. (The consent-scene sentinel from Story 3-3 used the same pattern inline; this story extracts it to a utility for reuse here AND retroactively for consent-scene.css in a follow-up refactor — NOT in this story's scope.)
   - **Combined LOC budget** for these three CSS files: ≤ 200 LOC total (each individually under ~100 LOC).
   - Update `src/index.html` (Story 3-3 shipped this) to add the new component CSS files to the parallel `<link rel="stylesheet">` chain in alphabetical order: insert `item-runner.css` and `progress-indicator.css` into the `components/` block (between `consent-scene.css` and `landing.css`), and add `<link rel="stylesheet" href="/src/css/utilities/visually-hidden.css">` in the `utilities/` block.

9. **AC-8 (`src/assessment/error-fallback.js` reuse for fetch errors):**
   - On `fetch('/src/items/item-parameters.json')` failure, item-runner.js calls `renderErrorFallback(rootEl, strings)` from `error-fallback.js` (Story 3-3 shipped this). The fallback's `chrome.errorFallbackMessage` key is reused — no new error-fallback i18n key for this story.
   - **No new code** in `error-fallback.js` for this story.

10. **AC-9 (Image augmentation via CSS `transform`, not server-side asset variants):**
    - Each rendered item `<img>` carries `data-augmentation="{code}"` where code ∈ `["none", "rot90", "rot180", "rot270", "flip-h", "flip-v"]`.
    - `item-runner.css` defines: `[data-augmentation="rot90"] { transform: rotate(90deg); transform-origin: center; }` and analogous rules for the other 5 codes (`none` is a no-op rule for completeness — `transform: none;`).
    - **Rationale:** server-side augmentation variants would require 6× the item assets (96 files for 16 items); CSS `transform` is browser-native, zero-cost at runtime (NFR2 — preserves the per-item ≤50 KB budget), and the `data-augmentation` attribute survives in the DOM for test inspection.
    - Augmentation does NOT alter the item's psychometric properties (FR7 architecture line 813 — "structural anti-leakage measure that does not alter item psychometrics"); the test asserts that `selectSession` produces consistent augmentations for the same seed.

11. **AC-10 (`tests/unit/item-prng.test.mjs`, `item-selection.test.mjs`, `item-runner.test.mjs` + `tests/contract/item-parameters-schema.spec.mjs`):**
    - All four files use `node:test` + `node:assert/strict` + the shared DOM stub from `tests/unit/_dom-stub.mjs` (Story 3-3 landed this).
    - **`tests/unit/item-prng.test.mjs`:**
      - AC-10.1: `createPrng(seed)` returns an object with a `next()` method that returns a `Uint32`.
      - AC-10.2: Two PRNGs with the same `seed128` produce byte-identical 1000-draw sequences (determinism).
      - AC-10.2b: Two PRNGs with one-byte-different seeds produce divergent sequences within the first 100 draws (avalanche).
      - AC-10.7: `item-prng.js` source contains no `Math.random`, no `Date.now`, no `localStorage`, no `sessionStorage`, no `console.log`, no default export.
    - **`tests/unit/item-selection.test.mjs`:**
      - AC-10.3: `selectSession(pool, seed, 16)` returns 16 items in a deterministic permutation; same seed → identical permutation; different seed → different permutation in ≥75% of positions (probabilistic; tolerance accounts for accidental fixed points).
      - AC-10.3b: returned `augmentations[]` has length 16, each value ∈ the 6-code set.
      - AC-10.3c: same seed → identical `augmentations[]`.
      - AC-10.8: `item-selection.js` source contains no forbidden globals or default export.
    - **`tests/unit/item-runner.test.mjs`:**
      - AC-10.4: `render(rootEl, strings)` writes the FR3 / UX-DR20 / UX-DR32 DOM (section / progress indicator / image / fieldset of radios / Previous + Next buttons). Stub `fetch` to return a synthetic item-parameters.json + `crypto.getRandomValues` to return a fixed seed.
      - AC-10.4b: Progress indicator has `role="status"`, `aria-live="polite"`, `aria-current="step"` (UX-DR20).
      - AC-10.4c: Radio change calls `state.recordResponse(0, <optionIndex>)` (verified via state.js public API observation, mirrors Story 3-3 AC-5.10 pattern).
      - AC-10.4d: Previous on item 0 is `aria-disabled="true"` and click is a no-op.
      - AC-10.4e: Next on item 15 changes button label to "Submit" and click triggers `routing.navigate('result')` → `window.location.hash === '#/test'` mutates to `'#/result'`.
      - AC-10.4f: No `[data-timer]`, no `aria-timer` in the rendered DOM (FR5 — assert via `root.querySelector('[data-timer]') === null` and `[aria-timer]` similarly).
      - AC-10.4g: `unmount()` removes all change/click listeners (mirror of Story 3-3 AC-5.11 pattern).
      - AC-10.9: `item-runner.js` source contains no forbidden globals or default export.
    - **`tests/contract/item-parameters-schema.spec.mjs`:**
      - AC-10.5: `item-parameters.json` parses as JSON.
      - AC-10.5b: validates against `corpus/item-parameters.schema.json` using a minimal hand-rolled validator (project pattern — `tests/contract/state-shape.spec.mjs` from Story 3-2 established the "no third-party JSON-Schema deps; hand-roll" precedent for `required` + `type` checks).
      - AC-10.5c: every item's `asset` filename exists at `src/items/{asset}` (filesystem check).
      - AC-10.5d: exactly 16 items at v1; `poolSize` matches `items.length`.

12. **AC-11 (`make test` + `make lint` + contract count):**
    - Run `make test` — exit 0; pass count = end-of-3-3 baseline (`355`) + at least 17 new tests (target ≥ `372`); `fail=0`.
    - Run `make test-contract` — exit 0; pass count = end-of-3-3 baseline (`16`) + at least 4 new tests (`item-parameters-schema.spec.mjs`) (target ≥ `20`).
    - Run `make lint` — exit 0; all 10 lints from Epic 1 continue to pass (`lint-cognitive-load-budget`, `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent`, `lint-claims-manifest`, `eslint`).

13. **AC-12 (no-regression: 3-3 unit tests stay green):**
    - All 8 unit-test files from Story 3-3 (`landing-scene.test.mjs`, `consent-scene.test.mjs`, `locale-loader.test.mjs`, `routing.test.mjs`, `main.test.mjs`, plus `_dom-stub.mjs`) continue to pass after the routing.js mod + strings.json extension.

## Tasks / Subtasks

- [x] **Task 0: Author stub item-pool (AC-0) — Epic 9a-2 deferred**
  - [x] 0.1 Create `src/items/item-parameters.json` with 16 stub items (`id`, `a=1.0`, `b ∈ [-2, +2]` in 0.25 steps, 6-option array, `correct`, `asset` filename, `_note` deferral marker).
  - [x] 0.2 Create 16 minimal SVG files at `src/items/stub-001.svg` … `src/items/stub-016.svg` (`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="50" text-anchor="middle">Item N</text></svg>` — ≤ 200 bytes each).
  - [x] 0.3 Create `corpus/item-parameters.schema.json` (JSON Schema draft-07 pinning shape).
  - [x] 0.4 Validate JSON parsing.

- [x] **Task 1: Implement `src/assessment/item-prng.js` (AC-1)**
  - [x] 1.1 Implement xoshiro128++ per `https://prng.di.unimi.it/xoshiro128plusplus.c`.
  - [x] 1.2 Internal state initialization from `Uint8Array(16)` (4 little-endian Uint32 reads).
  - [x] 1.3 `next()` returns `Uint32` (`>>> 0` to coerce).
  - [x] 1.4 Grep self-check for forbidden globals + default export.

- [x] **Task 2: Implement `src/assessment/item-selection.js` (AC-2)**
  - [x] 2.1 `selectSession(pool, seed128, sessionSize)`: Fisher-Yates shuffle of `[0..N-1]` indices.
  - [x] 2.2 Augmentation assignment: draw `sessionSize` codes from `["none", "rot90", "rot180", "rot270", "flip-h", "flip-v"]`.
  - [x] 2.3 Grep self-check.

- [x] **Task 3: Implement `src/assessment/item-runner.js` (AC-3)**
  - [x] 3.1 `render(rootEl, strings)`: on first mount, generate session seed via `crypto.getRandomValues(new Uint8Array(16))`, convert to hex, call `state.setSeed(hex)`.
  - [x] 3.2 Fetch `/src/items/item-parameters.json`; on failure call `renderErrorFallback(rootEl, strings)`.
  - [x] 3.3 Cache `selectSession()` result module-level for the session lifetime.
  - [x] 3.4 Render current item: SR heading + visible progress indicator + image + fieldset of native radio options + Previous + Next buttons.
  - [x] 3.5 Wire event handlers: radio change → `state.recordResponse`; Previous → `state.setItem(N-1)` + re-render (no-op on item 0); Next → `state.setItem(N+1)` + re-render OR `routing.navigate('result')` on item 15.
  - [x] 3.6 On re-render, pre-check the radio matching `state.getState().responses[currentItem]`.
  - [x] 3.7 `unmount()`: remove all listeners, clear `rootEl.innerHTML`.
  - [x] 3.8 Grep self-check.

- [x] **Task 4: Wire routing.js to register `#/test` → item-runner (AC-5)**
  - [x] 4.1 Add `import * as itemRunner from "./item-runner.js"` to `src/assessment/routing.js`.
  - [x] 4.2 Extend `ROUTES` table with `"#/test": itemRunner`.
  - [x] 4.3 Run existing 8 routing unit tests (AC-12); confirm 100% pass.

- [x] **Task 5: Extend EN strings.json with `itemRunner` namespace (AC-6)**
  - [x] 5.1 Add 7 new keys under `itemRunner` namespace (`headingTemplate`, `progressTemplate`, `optionsLegend`, `previousButton`, `nextButton`, `submitButton`, `fetchErrorMessage`).
  - [x] 5.2 Validate JSON parses.

- [x] **Task 6: Author component CSS + utility (AC-7, AC-9)**
  - [x] 6.1 `src/css/components/item-runner.css` (~80 LOC) — layout, semantic tokens, 6 augmentation rules via `[data-augmentation="..."]`.
  - [x] 6.2 `src/css/components/progress-indicator.css` (~30 LOC) — layout, semantic tokens.
  - [x] 6.3 `src/css/utilities/visually-hidden.css` (~10 LOC) — standard visually-hidden pattern.
  - [x] 6.4 Self-check: no literal hex / px / font-family.
  - [x] 6.5 Update `src/index.html` to add 2 new component CSS links (alphabetical within `components/`) + 1 utility link.

- [x] **Task 7: Author unit + contract tests (AC-10)**
  - [x] 7.1 `tests/unit/item-prng.test.mjs` — determinism, avalanche, source-grep.
  - [x] 7.2 `tests/unit/item-selection.test.mjs` — permutation determinism, augmentation determinism, source-grep.
  - [x] 7.3 `tests/unit/item-runner.test.mjs` — DOM shape, ARIA attrs, radio change → `recordResponse`, Previous disabled on item 0, Next on item 15 navigates to `#/result`, no-timer assertions, unmount listener cleanup, source-grep.
  - [x] 7.4 `tests/contract/item-parameters-schema.spec.mjs` — JSON parse, schema validation, asset filesystem check, 16-item count.

- [x] **Task 8: Verify (AC-11, AC-12)**
  - [x] 8.1 `make test` — exit 0; ≥372 pass; 0 fail.
  - [x] 8.2 `make test-contract` — exit 0; ≥20 pass.
  - [x] 8.3 `make lint` — exit 0.
  - [x] 8.4 Story 3-3's 8 unit-test files all stay green.

## Dev Notes

### What this story is and is NOT

**IS:**
1. `src/items/item-parameters.json` — STUB pool with 16 placeholder items + IRT params (deferred to Epic 9a-2 for real ICAR replacement).
2. 16 × `src/items/stub-*.svg` — minimal placeholder SVGs (≤ 200 bytes each).
3. `corpus/item-parameters.schema.json` — JSON Schema draft-07.
4. `src/assessment/item-prng.js` — xoshiro128++ deterministic PRNG, pure module.
5. `src/assessment/item-selection.js` — seeded Fisher-Yates subset + augmentation assignment.
6. `src/assessment/item-runner.js` — scene with FR2 (revision) / FR3 (progress) / FR5 (no timer) / FR7 (16-item seeded session) / UX-DR20 (`aria-current="step"` progress) / UX-DR32 (native `<input type="radio">`).
7. Extension of `src/assessment/routing.js` to register `#/test` → item-runner.
8. Extension of `src/content/i18n/en/strings.json` with `itemRunner` namespace.
9. `src/css/components/item-runner.css` + `progress-indicator.css` + `src/css/utilities/visually-hidden.css`.
10. Update to `src/index.html` for the new CSS links.
11. 3 unit-test files + 1 contract-test file.

**IS NOT:**
- Real ICAR-MR item assets (Story 9a-2 lands them).
- Real ICAR calibrated IRT parameters (Story 9a-2 lands them; `a=1.0`, `b ∈ [-2,+2]` stub is placeholder).
- Mid-session bail-out scene with discard-vs-continue (Story 6.3 lands it; this story has no bail; the only exit is "Not today" from consent scene which is a different upstream contract).
- Mid-session locale-switch blocker (Story 7-2).
- The `#/result` route handler (Story 3.5 lands it; this story's Next-on-item-15 dispatches `routing.navigate('result')`, which currently falls back to landing per routing.js's unknown-hash policy — Story 3.5 changes the route table).
- The reveal-stage event / score-panel (Story 3.5).
- The Playwright full-vertical-slice network-trace assertion (Story 3.7).
- Performance budgets enforcement (Story 8-5 — Lighthouse-in-CI). Manual NFR2 ≤50 KB-per-item assertion: stub SVGs are ≤200 bytes each, well under budget.
- Image-augmentation-as-server-side-variants (rejected per AC-9 in favor of CSS `transform`).
- `tools/lint-no-math-random.mjs` enforcement on `src/scoring/` (architecture line 346 — that's a separate story's lint authorship; this story just compiles clean against existing repo lints).
- Difficulty-band assignment (Story 6.2 — derives terciles from `b` parameters after Epic 9a-2 lands real items).

### Critical decisions encoded here

**Decision 1: Stub item-pool deferred to Epic 9a-2 (option (b) from create-story dependency-gap escalation).** Architecture gap #1 placed `item-parameters.json` authoring in Epic 1, but Epic 1 shipped no items story and real ICAR confirmation gates to Epic 9a-1 (post-launch). To unblock Story 3-4's FR7 contract end-to-end without external dependencies, this story ships a stub pool (16 placeholder items + dummy IRT params + minimal SVGs) sufficient to exercise the seed-determinism + subset-selection + per-item-rendering shape. The `_note` field in `item-parameters.json` flags this as deferred; Story 9a-2 swaps in real ICAR items behind the same schema (schema-stable swap). **Trade-off:** the v1 stub-pool has `poolSize == sessionSize == 16`, so the FR7 subset-selection step is trivially "all items" — Story 9a-2 will exercise the non-trivial subset path. Acceptable: shape is preserved; the determinism contract is the load-bearing surface here, not the selection-from-larger-pool surface.

**Decision 2: xoshiro128++ for the PRNG (architecture-mandated).** Architecture line 1072 + line 813 explicitly pin xoshiro128 ("a small inline xoshiro128 in `src/assessment/`"). xoshiro128++ is the modern 2026-standard variant (faster than xorshift, better statistical properties than splitmix). The reference impl is ~30 LOC in vanilla JS — under the per-module cognitive budget. The inline-copy posture (per Vigna's recommendation + architecture line 813) means: write once in `item-prng.js` for this story; if Story 3.5 needs a separate PRNG (e.g., for reveal-stage timing jitter), copy rather than import — keeps Story 3.5 self-contained in its testing.

**Decision 3: Image augmentation via CSS `transform`, not server-side variants.** Server-side variants would balloon `src/items/` from 16 to 96 SVGs (6× per-item). CSS `transform` is browser-native, zero-cost (does not invalidate the per-item NFR2 ≤50 KB budget). The `data-augmentation` attribute on `<img>` survives in the DOM, allowing tests to assert that the augmentation code matches the seed-determined value. The augmentation does NOT alter psychometric properties (architecture line 813 — "structural anti-leakage measure"); the geometric rotation/reflection preserves the matrix-reasoning task's solution.

**Decision 4: `alt=""` on the item `<img>` (visuospatial disclosure precedent from Story 3-3 consent scene).** Story 3-3's `consent.visuospatialDisclosure` paragraph explicitly states "there is no synthetic alt-text that captures the patterns honestly". Following that disclosure, the item `<img>` ships with `alt=""` (treated as decorative by SRs) rather than fake alt-text. Screen-reader users were warned at consent; the SR-equivalent path is the "Not today" exit. This is the architecture's deliberate posture — alt-text honesty over compliance theater.

**Decision 5: Native `<input type="radio">` with associated `<label>` (UX-DR32).** No custom-div widgets, no `role="radio"` ARIA. Native radio inputs come with keyboard nav (arrow keys), focus management, and SR semantics for free. UX-DR32 explicitly pins this; the test (`item-runner.test.mjs`) asserts presence of `<input type="radio">` elements.

**Decision 6: Progress indicator with `role="status" aria-live="polite" aria-current="step"` (UX-DR20).** `role="status"` is the polite live region; `aria-live="polite"` reinforces it; `aria-current="step"` is the WAI-ARIA-1.2 idiom for indicating position in a sequence. Tests assert all three attributes.

**Decision 7: Module-level session-selection cache for FR7 reproducibility.** Architecture FR7 requires "the subset is thus reproducible within the same session (e.g., to support FR2 answer revision) but not pre-predictable across independent sessions". The implementation: on first mount of item-runner per session, compute `selectSession()` once; cache the result as module-level state; subsequent re-renders (Previous/Next navigation) reuse it. The cache is cleared when the session ends (`resetState()` from "Not today" or a future bail-out scene resets `currentItem` and `responses`; the seed in state is also reset, so the next session generates a new seed via `crypto.getRandomValues`).

### Architecture compliance — references

| Topic | Source |
|---|---|
| `src/assessment/item-runner.js` (FR2-FR5) | architecture.md line 1071 |
| `src/assessment/item-prng.js` (xoshiro128) | architecture.md line 1072, line 813 |
| `src/assessment/item-selection.js` (FR7) | architecture.md line 1073, line 812-813 |
| `src/items/item-parameters.json` (camelCase a, b parameters) | architecture.md line 1161 |
| Item-pool authoring deferral to Epic 9a-2 (gap #1) | architecture.md line 1420 |
| ICAR license confirmation gate | epics.md line 434, line 2128, Story 9a.2 |
| `crypto.getRandomValues` mandatory; `Math.random` forbidden (NFR10) | architecture.md line 346, line 812 |
| Progress indicator `aria-live="polite"` + `aria-current="step"` (UX-DR20) | architecture.md line 803 |
| Native `<input type="radio">` with `<label>` (UX-DR32) | epics.md line 1030 |
| FR2 (revise answer), FR3 (progress visible), FR5 (no timer), FR7 (16-item seeded session) | prd.md lines 786-791 |
| NFR2 (matrix items ≤50 KB) | prd.md line 887 |
| NFR9, NFR10, NFR13 (no `Math.random`, no `localStorage`, visuospatial disclosure) | prd.md lines 895-907 |
| `corpus/item-parameters.schema.json` for symmetry | architecture.md line 1420 (gap #1 second bullet) |
| Inline-copy posture for PRNG | architecture.md line 813 |

### Previous story intelligence (from Stories 3-1, 3-2, 3-3, 1-9, 1-10)

- **Story 3-1** authored `docs/adr/state-shape.md` — the state.js contract this story extends via `setSeed`, `setItem`, `recordResponse`. No state.js modifications in this story.
- **Story 3-2** landed `src/assessment/state.js` + `tests/contract/state-shape.spec.mjs`. The contract test asserts `setSeed` accepts a 32-char hex string; this story converts the `Uint8Array(16)` to hex before calling. The test-stubbing precedent (stub globals at file top BEFORE dynamic import) carries over for the new unit tests in this story.
- **Story 3-3** landed `src/index.html` + the parallel `<link>` chain. Adding `item-runner.css` + `progress-indicator.css` + `utilities/visually-hidden.css` requires updating `src/index.html`'s link chain. Story 3-3 frozen tests assert source-greps for forbidden globals (Math.random, Date.now, etc.); this story's new modules follow the same discipline. **Critical reuse:** `_dom-stub.mjs` from Story 3-3 supports the new tests directly — no new tokenizer code needed.
- **Story 3-3 lesson:** comment text matters for source-grep lints. Story 3-3 had a comment with `localStorage` that tripped `lint-no-localStorage-without-consent` test (and a `role="alert"` comment tripped `lint-no-role-alert`). Avoid mentioning these tokens in comments.
- **Story 1-9** shipped `tools/lint-no-share.mjs`, `lint-no-role-alert.mjs`, `lint-no-cookie-banner.mjs`, `lint-no-localStorage-without-consent.mjs`. All scan `src/**`. New files must keep these green.
- **Story 1-10** locked the two-layer CSS token architecture. New CSS files use ONLY semantic tokens (`var(--*)` from `semantic.css`); no literal hex / px / font-family.
- **lesson-2026-05-19-001 (high; injected from memory):** Once a test is frozen (test-author phase) any subsequent edit MUST be ratified by `tds integrity record --as=<role> --files=<path> --reason=<text>` BEFORE state-commit. The frozen test files from THIS story (Story 3-4) — once test-author phase completes — will be class-A integrity-tracked. Edit-and-skip-record is the silent-drift trap.

### Files added / modified summary (anticipated)

**New (24 files):**
- `src/items/item-parameters.json`
- `src/items/stub-001.svg` … `src/items/stub-016.svg` (16 files)
- `corpus/item-parameters.schema.json`
- `src/assessment/item-prng.js`
- `src/assessment/item-selection.js`
- `src/assessment/item-runner.js`
- `src/css/components/item-runner.css`
- `src/css/components/progress-indicator.css`
- `src/css/utilities/visually-hidden.css`
- `tests/unit/item-prng.test.mjs`
- `tests/unit/item-selection.test.mjs`
- `tests/unit/item-runner.test.mjs`
- `tests/contract/item-parameters-schema.spec.mjs`

**Modified (3 files):**
- `src/assessment/routing.js` — add `#/test` route entry.
- `src/content/i18n/en/strings.json` — add `itemRunner` namespace.
- `src/index.html` — add 2 new component CSS links + 1 utility link.

**Deleted (0 files):** None.

### Testing standards summary

- All three unit-test files use `node:test` + `node:assert/strict` (matching Story 3-3 precedent).
- DOM stubs are scope-limited per file (only the methods/properties the SUT actually touches). Document at file top.
- `globalThis.crypto = { getRandomValues: (arr) => { arr.fill(0x42); return arr; } }` stub for tests that need a deterministic seed.
- `globalThis.fetch` stubbed in `item-runner.test.mjs` to return a synthetic `item-parameters.json`.
- The `state.js` module is imported live (no stubbing); tests observe state via `getState()` after triggering events, per Story 3-3's AC-5.10 / AC-5.11 precedent.
- Test count delta: 17 new unit tests + 4 new contract tests = 21 net-new (target ≥ 17 unit + 4 contract).

### Project Structure Notes

- `src/items/` currently contains only `.gitkeep`. This story is the first to populate it.
- `corpus/` is currently empty (per `ls corpus/`). This story lands the first schema file there. `corpus/` is intentionally separate from `src/`; build-time validators read it.
- `src/css/utilities/` is currently empty. This story lands the first utility file (`visually-hidden.css`).
- **No `BUDGETS.json` updates required** — Story 3-4's contribution stays within the architecture's anticipated 30 KB Domain A budget (item-prng ~30 LOC, item-selection ~40 LOC, item-runner ~150 LOC; total ~220 LOC ≈ ~8 KB JS).

### Implementation Notes — gotchas to avoid

1. **`crypto.getRandomValues` returns the same `Uint8Array` it was passed.** Don't assume it returns a new array; use the passed reference.
2. **Hex conversion endianness.** `Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')` is the standard pattern. Avoid `Buffer` (Node-only).
3. **xoshiro128++ state init MUST not be all zeros.** Vigna's reference says the state must be initialized so that not all four words are zero. The stub seed (16 bytes from `getRandomValues`) is effectively random with overwhelming probability; for tests, use a non-zero seed (e.g., `Uint8Array.from([0x42, 0x42, ...])`).
4. **`>>> 0` to coerce to Uint32.** JS bitwise ops produce Int32. The PRNG output must be cast `(... ) >>> 0` to get the unsigned value tests expect.
5. **Fisher-Yates direction matters for reproducibility.** Use the standard backward iteration (`for (let i = N-1; i > 0; i--)`); reverse order changes the permutation produced from the same seed.
6. **Augmentation draw count = `sessionSize`.** Drawing too few breaks AC-10.3b (length check); drawing too many wastes PRNG output without breaking anything but is sloppy.
7. **`recordResponse(itemIndex, optionIndex)` takes integers, not strings.** Convert from `event.target.value` (which is the option *label*, e.g., "A") to the integer index via `pool.items[currentItem].options.indexOf(value)`.
8. **Re-render must pre-check the existing response.** On Previous → render, the radio matching `state.getState().responses[currentItem]?.response` MUST have `checked` attribute. Otherwise FR2 (revise answer) breaks the UX.
9. **The `name` attribute on radio inputs scopes the group.** Use `name="item-{N}"` to ensure that selecting one radio deselects others within the same item; the name must differ per item to prevent cross-item radio state contamination.
10. **`#/test` route navigates to landing if route table doesn't register it.** Story 3-3's routing.js falls back to landing for unknown hashes. Forgetting Task 4 (route registration) means the consent → Continue → `#/test` flow silently re-renders landing. Test the integration path manually with `python3 -m http.server` if uncertain.
11. **JSON Schema validator MUST be hand-rolled.** Architecture forbids third-party dev-deps (NFR33); use a minimal `required` + `type` check (50-100 LOC). Story 3-2's `_state-schema-check.mjs` is the precedent.
12. **`src/index.html` link chain order matters.** Per Story 3-3 AC-1 and the future `tools/lint-css-link-order.mjs` (Story 3-5), components are alphabetical: existing `chrome-header.css`, `consent-scene.css`, `landing.css` — insert new `item-runner.css` between `consent-scene.css` and `landing.css`, then `progress-indicator.css` after `landing.css`. Utility file goes in the utilities block at end.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.4] — Original AC formulation (lines 1014-1045).
- [Source: _bmad-output/planning-artifacts/architecture.md#L52, L67, L346, L381-383, L500, L800-813, L1026, L1071-1073, L1098, L1136-1137, L1161, L1225-1226, L1299, L1309, L1389, L1420] — Item-runner / PRNG / selection / item-parameters / NFR10 / inline-copy posture / file layout / gap #1.
- [Source: _bmad-output/planning-artifacts/prd.md#FR2, FR3, FR5, FR7, NFR2, NFR5, NFR9, NFR10, NFR13] — User-facing FRs + a11y + performance + visuospatial disclosure.
- [Source: _bmad-output/planning-artifacts/epics.md#Story-9a.2] — Real ICAR item arrival + LICENSES.md reconciliation; the swap target for the stub pool.
- [Source: _bmad-output/implementation-artifacts/stories/3-2-implement-state-js-contract-test.md] — `setSeed`/`setItem`/`recordResponse`/`getState` contracts.
- [Source: _bmad-output/implementation-artifacts/stories/3-3-implement-landing-consent-scene-en.md] — `src/index.html`, `routing.js`, `error-fallback.js`, `_dom-stub.mjs`, lint-no-* posture.
- [Source: src/assessment/state.js, src/assessment/state.schema.json] — Live contract.
- [Source: src/assessment/routing.js] — Route table to extend.
- [Source: src/content/i18n/en/strings.json] — Namespace bundle to extend.
- [Source: src/index.html] — Link chain to extend.
- [Source: https://prng.di.unimi.it/xoshiro128plusplus.c] — xoshiro128++ reference implementation.

## Dev Agent Record

### Agent Model Used

(populated by execute-story)

### Debug Log References

### Completion Notes List

- Task 0 done — stub item-pool (16 items, IRT a=1.0, b ∈ [-2,+1.75] in 0.25 steps), 16 SVGs (123-124 bytes each, well under NFR2 50KB), schema with _note deferral marker. Contract tests AC-10.5/5b/5c/5d green.
- Task 1 done — xoshiro128++ per Vigna reference; 4 PRNG tests green (determinism + avalanche + source-grep).
- Task 2 done — Fisher-Yates backward iteration + 6-code augmentation draw; 5 selection tests green.
- Task 3 done — item-runner scene with module-level session cache, on-the-fly scoring (resolves spec-vs-frozen-contract per F-A), unmount listener cleanup. 8/8 runner tests green.
- Task 4 done — routing.js imports item-runner + registers #/test in ROUTES; 8/8 Story 3-3 routing tests stay green.
- Task 5 done — itemRunner namespace with 7 keys; JSON validity preserved.
- Task 6 done — item-runner.css, progress-indicator.css, visually-hidden.css; index.html link chain updated alphabetically. Semantic tokens only.
- Verification gates green — make test 376/376, make test-contract 20/20, make lint exit 0. item-runner.js slimmed from 10.8 KB → 6.0 KB to fit NFR32 app-modules-bytes budget (26877/30720).
- Story 3-4 done. 376/376 tests pass, 20/20 contract, lint exit 0. F-A spec-vs-frozen-contract reconciled via on-the-fly scoring at recordResponse call site. NFR32 budget green (26877/30720). Self-review attached.

### File List

- corpus/item-parameters.schema.json
- src/items/item-parameters.json
- src/items/stub-001.svg
- src/items/stub-002.svg
- src/items/stub-003.svg
- src/items/stub-004.svg
- src/items/stub-005.svg
- src/items/stub-006.svg
- src/items/stub-007.svg
- src/items/stub-008.svg
- src/items/stub-009.svg
- src/items/stub-010.svg
- src/items/stub-011.svg
- src/items/stub-012.svg
- src/items/stub-013.svg
- src/items/stub-014.svg
- src/items/stub-015.svg
- src/items/stub-016.svg
- src/assessment/item-prng.js
- src/assessment/item-selection.js
- src/assessment/item-runner.js
- src/assessment/routing.js
- src/content/i18n/en/strings.json
- src/css/components/item-runner.css
- src/css/components/progress-indicator.css
- src/css/utilities/visually-hidden.css
- src/index.html

## Specialist Self-Review

**Decisions made:**

1. **F-A reconciliation — on-the-fly scoring at `state.recordResponse` call site.** Spec AC-3 line 70 directs `state.recordResponse(currentItem, selectedOptionIndex)` with `selectedOptionIndex ∈ {0..5}`, but `state.js:93-95` throws `RangeError` if `response ∉ {0, 1}` and `state.schema.json` constrains `responses[].response: enum [0, 1]` (Story 3-2 frozen ADR). AC-4 explicitly forbids modifying `state.js`. The only self-consistent reading is that `item-runner.js` must score before calling: `state.recordResponse(idx, selectedOptionValue === item.correct ? 1 : 0)`. Encoded in [item-runner.js:103](src/assessment/item-runner.js#L103) with an inline `// F-A: score on-the-fly` comment. The test-review cycle-1 report independently validated this interpretation; spec line 70 should be amended in a follow-up bridge or the next iteration of the Story 3-1 state-shape ADR.

2. **Module-level session cache keyed by `state.seed`.** FR7 requires the seed-derived selection to be reproducible within the session to support FR2 (answer revision via Previous/Next navigation). Cache invalidates only when `state.seed === INITIAL_SEED` ("0".repeat(32)) — i.e., after `resetState()`. Pool fetch + xoshiro128++ derive happen exactly once per session; subsequent renders read from cache. See [item-runner.js:34-49](src/assessment/item-runner.js#L34-L49).

3. **NFR32 slim-down of `item-runner.js` (10.8 KB → 6.0 KB).** Initial implementation breached the `app-modules-bytes` budget (31638/30720). Slimmed via three surgical cuts: collapsed multi-line block comments (kept only the F-A explanation per impl-brief mandate), inlined the `escapeAttr` / `escapeText` helpers into a single `esc()` function, removed a defensive cache-miss fall-through branch (re-fetching pool from stored hex seed) that no test exercises and no real-runtime path reaches. Final budget: 26877/30720 (87% utilized; 3843 bytes remaining for Story 3.5). All 8 item-runner tests still green after slim.

4. **CSS augmentation via attribute selectors, not server-side variants** (AC-9). Six rules: `[data-augmentation="rot90"] { transform: rotate(90deg); transform-origin: center; }` and analogs for `rot180`, `rot270`, `flip-h`, `flip-v`, plus a `none` no-op rule for completeness. Server-side variants would expand `src/items/` from 16 SVGs to 96; CSS transforms preserve psychometric properties (architecture line 813 — "structural anti-leakage measure that does not alter item psychometrics") and the `data-augmentation` attribute survives in the DOM for test inspection.

**Alternatives considered:**

- **Modifying `state.js` to relax the `response: enum [0,1]` constraint** (rejected — violates AC-4 and Story 3-2 frozen ADR; would break the existing `tests/contract/state-shape.spec.mjs`).
- **Storing the original option label alongside the scored response** in a separate item-runner-local map (rejected — adds complexity not in spec scope; FR2 revision UX still works at the navigation level since the radio change handler always overwrites the scored value with the latest selection).
- **Per-item radio-group event delegation on a parent `<fieldset>`** instead of per-radio `addEventListener` (rejected — `AC-10.4g` asserts that post-`unmount()` dispatching `change` on a captured radio reference must not mutate state; delegation would require an explicit `unmount` of the parent listener and would couple the test to event bubbling semantics the DOM stub doesn't model).
- **`utilities.css` (existing single-file pattern) vs `utilities/visually-hidden.css` (new directory pattern)** (chose new dir per spec line 109 — `src/css/utilities/` was empty per Story 3-3 baseline; first utility file establishes the per-utility convention for future extraction).
- **Sub-pixel `1px` literal for `.visually-hidden`** vs `var(--space-1)` (4px) (chose semantic token to match consent-scene sentinel precedent — 4px is still SR-only and avoids the cognitive-load-budget warn surface for literal pixel values).

**Framework gotchas avoided:**

- **`crypto.getRandomValues` mutates in place AND returns the same reference** (Web Crypto spec). Used the returned reference both to compute the hex string (for `state.setSeed`) and to pass to `selectSession` as `seedBytes` — no double allocation; spec implementation note 1 honored.
- **`>>> 0` Uint32 coercion in `xoshiro128++`.** All bitwise ops in JS produce Int32; `((s[0] + s[3]) >>> 0)` before `rotl`, and `>>> 0` at every state-mutation step prevents accidental sign-extension that would diverge from Vigna's reference. PRNG determinism test (AC-10.2, 1000-draw byte-identical) would catch any drift.
- **Fisher-Yates backward iteration** (`for (let i = N-1; i > 0; i--)`) per spec implementation note 5. Forward iteration would still produce a deterministic permutation, but a different one — reviewers re-deriving the permutation from the seed would get an off-by-one mismatch. Reproducibility regression protection.
- **Augmentation draws consume PRNG state AFTER the shuffle, not interleaved.** Order matters for byte-identical reproducibility: shuffle exhausts (N-1) draws, then augmentations draw exactly `sessionSize` more. See [item-selection.js:40-48](src/assessment/item-selection.js#L40-L48).
- **Radio `name="item-{N}"` per-item scoping** (impl note 9) prevents cross-item radio state contamination when navigating Previous/Next. Used 1-indexed `N` (display value) so the attribute matches the heading's `{N}` substitution; tests do not pin the exact `name` value, only structural assertions.
- **`crypto` global is read-only getter on Node 22.** The test file uses `Object.defineProperty` to replace it; the SUT uses the standard `crypto.getRandomValues(arr)` call which works against both real Web Crypto and the test stub. No SUT-side change needed.
- **Story 3-3 lesson on comments tripping source-grep lints.** Initial draft of `item-runner.js` had a comment `// No console.log` that failed the AC-10.9 source-grep on `\bconsole\.log\b`. Rewrote to "Silent on errors." Lesson re-validated; consult-brief warned about this exact class of bug (Story 1-9 lint-no-* family scans comments too).
- **Idempotent `render()` on remount.** If `mounted` already exists, detach prior listeners first to avoid duplicate handler registration on re-render after Previous/Next. See [item-runner.js:143-148](src/assessment/item-runner.js#L143-L148).

**Areas of uncertainty:**

1. **Pre-check fidelity on re-render (FR2 answer revision UX).** State stores only the SCORED response (0|1), not the original option label. On re-render we pre-check the `correct` option iff `response === 1` ([item-runner.js:64-65](src/assessment/item-runner.js#L64-L65)). If the user originally picked an incorrect option, no radio gets pre-checked on revisit — they see an empty selection and can re-submit (which overwrites the scored value). Spec implementation note 8 says "Re-render must pre-check the existing response", which I read as "pre-check IF data is available"; the frozen state-schema doesn't expose the option label so partial-fidelity is the only path. No AC-10 sub-bullet explicitly tests re-render pre-check, so this is a documented limitation, not a violation. Reviewer focus area: should we surface a bridge to extend state-shape with `selectedOption` field for full FR2 fidelity?

2. **NFR32 30 KB hard cap remaining headroom for Story 3.5+.** Currently 26877/30720 (87%); 3843 bytes free. Story 3.5 will add `result.js` for the reveal-stage + score-panel. If that module exceeds ~3.8 KB the budget breaches; architecture decision needed (split into separate budget per Domain B/C, or raise the cap with documented rationale). Out of Story 3.4 scope but worth flagging for sprint planning.

3. **Fetch error path not exercised by AC-10 tests.** AC-3 mandates `renderErrorFallback` invocation on fetch failure; I implemented it ([item-runner.js:38-43](src/assessment/item-runner.js#L38-L43)) but no AC-10 sub-bullet covers it. If the test-review cycle had flagged this as a gap, it would have been a non-blocking finding; I added the code-path because spec AC-3 explicitly directs it, not because tests require it.

4. **`unmount()` exported signature `()` vs `(rootEl)`.** Spec AC-3 line 50 says `unmount()` (no arg); landing/consent unmount accept `(rootEl)` per their AC-4/AC-5 contracts. AC-10.4g calls `itemRunner.unmount()` with zero args. I export `unmount()` with zero args, using the module-level `mounted.rootEl` for the innerHTML clear. Routing.js's `activeScene.unmount(appEl)` will pass the arg, which my function ignores — harmless. If a reviewer wants signature uniformity across all three scenes, this is a polish item for a follow-up.

**Tested edge cases (per AC-10 inventory + spec verification gates):**

- **PRNG determinism — 1000-draw byte-equal** (AC-10.2): two `createPrng()` instances with identical `Uint8Array(16)` seeds produce identical 1000-element `Uint32Array` sequences via `assert.deepEqual`. Byte-exact.
- **PRNG avalanche — one-byte-flipped seed ≥80/100 diverge** (AC-10.2b): flipping `seed[0]` from `0x42` to `0x43` produces ≥80 of 100 different uint32 draws. Statistical tolerance generous (xoshiro128++ guarantees ~50% bit-difference; realistic flake bound ~10^-32).
- **Selection — 16-item deterministic permutation; ≥12/16 divergence between seeds** (AC-10.3): same seed → identical permutation; different seeds → ≥12 of 16 positions differ (derangement-theory bound puts realistic flake at ~10^-8).
- **Selection — augmentations[] length 16, codes ∈ 6-set** (AC-10.3b); **same-seed augmentation determinism** (AC-10.3c).
- **Item-runner DOM shape** (AC-10.4): section + h1 + progress + img + fieldset + 6 radios + Previous + Next, all with required attributes (aria-labelledby, role/aria-live/aria-current/data-testid on progress, alt="" + data-augmentation on img, type="radio" on inputs).
- **Item-runner ARIA triple-attribute on progress indicator** (AC-10.4b).
- **Radio change → response ∈ {0, 1} observable via `state.getState()`** (AC-10.4c) — F-A resolution verified.
- **Previous on item 0 = `aria-disabled="true"` + click is no-op** (AC-10.4d) — both `state.currentItem` and `window.location.hash` unchanged after click.
- **Next on item 15 = "Submit" label + click navigates `#/test → #/result`** (AC-10.4e).
- **No `[data-timer]` / `[aria-timer]` anywhere in rendered DOM** (AC-10.4f) — FR5 verified.
- **`unmount()` removes all listeners** (AC-10.4g) — post-unmount synthetic change event on captured radio reference produces no `state.responses` mutation.
- **Source-grep on all 3 modules** (AC-10.7 / 10.8 / 10.9): no `Math.random`, `Date.now`, `localStorage`, `sessionStorage`, `console.log`, `navigator.share`, `setTimeout`, `setInterval`, or default export.
- **Contract — `item-parameters.json` parses + validates against schema + every asset filename exists on disk + poolSize === items.length === 16** (AC-10.5 / 10.5b / 10.5c / 10.5d).
- **No-regression** (AC-12): all 8 Story 3-3 unit-test files stay green after `routing.js` modification + `strings.json` extension. Verified by running `make test` and observing pre-existing Story 3-3 test ids in the pass list.
- **Verification gates** (AC-11): `make test` 376/376 (target ≥372), `make test-contract` 20/20 (target ≥20), `make lint` exit 0 (all 10 lints green; only Epic-5 informational WARNs from claims-manifest).
