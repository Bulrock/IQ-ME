---
id: 3-5-implement-reveal-stage-event-score-panel-css-source-co-equal-triplet-lint
title: "Story 3.5: Implement reveal-stage event + score-panel + CSS-source co-equal triplet lint"
status: review
---

# Story 3.5: Implement reveal-stage event + score-panel + CSS-source co-equal triplet lint

## Story

As an **English-speaking test-taker who has just submitted the 16th item**,
I want **a pre-reveal "are you ready" beat (FR13) followed by a score panel showing percentile + IQ-scale + uncertainty band (FR15, FR18) with an inline non-dismissible caveat above the score (FR23) — and CSS-source-level co-equal triplet parity enforced from this epic forward**,
so that **the load-bearing aha-click is exercisable (the click into methodology lands in Story 3.6) and Epic 6's runtime computed-style assertion is *graduation*, not *introduction*, of the co-equal invariant (per Murat's two-tier defense)**.

This is **Epic 3's result scene** — Stories 3-1/3-2/3-3/3-4 landed the contract ADRs + state.js + landing + consent + item-runner. This story owns:
1. `src/assessment/reveal-stage.js` — dispatches `iqme:reveal-stage` events per the Story-3.1 ADR contract (stages `anchor` and `handoff` in v1).
2. `src/assessment/result.js` — the `#/result` scene that mounts after Next-on-item-15. Computes the score via the Story-2.5 `scoreSession()` facade, renders the pre-reveal "are you ready" beat (FR13), then the score panel (FR15, FR18, FR23).
3. `src/css/components/score-panel.css` — co-equal triplet (`.score-panel__anchor` / `.score-panel__percentile` / `.score-panel__band`) at the same `--font-size-600` per UX-DR3.
4. `tools/lint-css-source-co-equal.mjs` — CSS-AST lint asserting identical `font-size` / `font-weight` / `font-family` declarations across the three triplet selectors in the source CSS (graduates to Epic 6 Playwright computed-style assertion).
5. Wiring: `routing.js` extended with `#/result` → result; `strings.json` extended with `result` namespace; `index.html` extended with the new CSS link; `Makefile`/`pr-checks.yml` wired to run the new lint.

## Acceptance Criteria

1. **AC-1 (`src/assessment/reveal-stage.js` — `iqme:reveal-stage` dispatcher):**
   - File at exact path: `src/assessment/reveal-stage.js` (architecture line 384, 1076).
   - Named export: `dispatchStage(stage)`. No default export.
   - `dispatchStage(stage)` MUST construct a `CustomEvent` named `iqme:reveal-stage` with `{ bubbles: true, composed: false }` and `detail: { stage, t: performance.now() }`, then call `document.dispatchEvent(ev)`. Per `docs/adr/iqme-reveal-stage-event-contract.md`: dispatch target is `document` (NOT `window`); time source is `performance.now()` (NOT `Date.now()`); minimum payload shape is `{ stage, t }`.
   - `stage` parameter MUST be one of the v1 enum values `"anchor"` | `"handoff"`. Calls with any other value MUST throw `RangeError(\`unknown reveal stage: ${stage}\`)`. Reserved Epic-6 stages (`band`, `interval`, `context`, `tail-scene`, `methodology-handoff`) are NOT valid in Story 3-5 — they are declared in the ADR but their dispatchers land with Epic 6.
   - Per-session ordering enforced internally: a module-level set tracks fired stages; firing the same stage twice within a session throws `Error(\`reveal stage already fired this session: ${stage}\`)`; the declared order is `anchor` → `handoff` and firing `handoff` before `anchor` throws `Error("reveal stages must fire in declared order")`. Exported `resetRevealStage()` clears the set (consumed by `state.resetState` callers + tests).
   - **No `Math.random`, no `Date.now`, no `localStorage`, no `sessionStorage`, no `console.log`, no `setTimeout` / `setInterval`** (NFR10 — architecture line 346). `performance.now()` IS allowed (it is the contract-mandated time source).
   - Pure functional module: no side effects on import.

2. **AC-2 (`src/assessment/result.js` — the `#/result` scene; FR13 / FR15 / FR18 / FR23):**
   - File at exact path: `src/assessment/result.js` (architecture line 1074).
   - Named exports: `render(rootEl, strings)`, `unmount(rootEl)`. No default export.
   - **On render:**
     - Read `state.getState().responses` (Story 3-2). Responses are stored as `{ itemIndex, response: 0|1 }` (per Story 3-2 frozen schema + Story 3-4 F-A on-the-fly scoring). Convert to the shape `scoreSession` expects (per `tests/unit/scoring/irt/index.test.mjs`: an array of `{ itemIndex, response }` objects).
     - Fetch `/src/items/item-parameters.json` via `fetch()` (or reuse the module-level cache if `item-runner.js` exposed it — for Story 3-5 v1, prefer a fresh fetch to keep `result.js` self-contained). On fetch failure: render error fallback via `error-fallback.js` (Story 3-3).
     - Call `scoreSession({ responses, itemParameters: pool.items, normingStats: { se_norming: 0 } })` from `src/scoring/irt/index.js` (Story 2-5). The `se_norming: 0` v1 stub matches the placeholder posture from Story 3-4 (real norming-sample SE lands with Epic 9b-1 psychometrician sign-off).
     - Render the **pre-reveal beat (FR13)** FIRST: `<section class="result-scene" data-reveal-stage="anchor">` containing a heading + the "Your result is ready" + "Show me" button + "Not yet" button (UX spec line 227). Call `revealStage.dispatchStage("anchor")` AFTER the DOM is in place (so listeners attached on `document` for tests can observe the event fired against a rendered scene).
   - **On "Show me" click:** transition the `data-reveal-stage` attribute to `"handoff"`, render the score panel inside the `.result-scene` (replace the pre-reveal beat copy + buttons with the score-panel DOM), then call `revealStage.dispatchStage("handoff")`.
   - **On "Not yet" click:** the scene remains in `data-reveal-stage="anchor"`. The pre-reveal beat is non-skippable but the user MAY linger; the "Not yet" button is a deferral, not an exit. Clicking "Not yet" is a no-op DOM-wise (per UX spec line 227 — "the only deliberate pause") but the click handler MUST exist and be reattached on unmount/remount (to satisfy the listener-cleanup pattern from Story 3-3 AC-5.11).
   - **Score-panel DOM (FR15, FR18, FR23):**
     - `<section class="score-panel" aria-labelledby="score-panel-heading">`
       - `<h2 id="score-panel-heading" class="visually-hidden">{strings.result.scoreHeading}</h2>` ("Your result").
       - `<p class="score-panel__caveat" role="note">{strings.result.caveat}</p>` — FR23 inline non-dismissible caveat ABOVE the triplet. `role="note"` (NOT `role="alert"` — UX-DR22; existing `lint-no-role-alert` asserts).
       - `<div class="score-panel__triplet">`
         - `<span class="score-panel__percentile" aria-label="{strings.result.percentileAriaTemplate}" data-methodology-target="scoring/percentile-to-iq">{percentile-rounded-to-integer}</span>` — the percentile numeral. The `aria-label` is "Your percentile, {N}." per UX spec line 1399.
         - `<span class="score-panel__anchor" aria-label="{strings.result.anchorAriaTemplate}" data-methodology-target="scoring/overview">{iqScale}</span>` — the IQ-scale numeral.
         - `<span class="score-panel__band" aria-label="{strings.result.bandAriaTemplate}" data-methodology-target="scoring/uncertainty">{strings.result.bandTemplate}</span>` — the uncertainty band string, formatted as "±N" where N is `Math.round((displayedBand.upper - displayedBand.lower) / 2 * 15)` (the half-width on the IQ-scale, NOT theta — UX spec line 1379). For Story 3-5 the simplest correct rendering is the symmetric `±half-IQ-width`; future stories (Epic 5, Epic 6) may extend to "range L–H" form.
       - `</div>` (`.score-panel__triplet`)
       - `</section>`
   - **`data-methodology-target` values are path-only** (per `docs/adr/methodology-handoff-url-contract.md`): `"scoring/percentile-to-iq"`, `"scoring/overview"`, `"scoring/uncertainty"`. NO version prefix, NO locale prefix, NO leading slash. Story 3-6 lands the matching stub pages; Story 3-7's full-slice network-trace test will exercise the click → navigation path; the actual click-to-navigate handler (URL composition + `window.location.href = ...`) is ALSO landed in this story per the ADR resolution rule (AC-3 below) — but the actual stub pages only land in Story 3-6, so navigation in this story's tests asserts only the composed URL string, not page existence.
   - **Click-binding contract** (`docs/adr/methodology-handoff-url-contract.md` — "Resolution rule"): clicking any element with `data-methodology-target` MUST compose `/methodology/<latest-corpus-version>/<active-locale>/<path>/` and navigate. Implementation:
     - Read `data-methodology-target` from the clicked element (`event.currentTarget.dataset.methodologyTarget`).
     - Read active locale from `state.getState().locale` (Story 3-2 — defaults to `"en"`).
     - Read the baked-in corpus version constant. **For Story 3-5 v1, hard-code `"v0.1.0"` as a module-level `const CORPUS_VERSION = "v0.1.0"`** with an inline comment naming Epic 4's `tools/build-methodology.mjs` as the eventual injection site. Epic 4 will replace the hard-code with a build-time `git describe --tags --match 'corpus-v*' --abbrev=0` injection.
     - Compose `\`/methodology/${CORPUS_VERSION}/${locale}/${path}/\`` (note leading slash, three internal slashes, trailing slash — see ADR "Resolution rule").
     - Navigate via `window.location.assign(url)` (testable via stubbed `window.location`).
   - **Keyboard activation:** triplet elements MUST be in the tab order (`tabindex="0"`) and Enter activates the click handler (UX spec line 1411 — "Keyboard: Tab through anchor → percentile → band → qualitative; Enter activates each"). Use `keydown` listener checking `event.key === "Enter"`; ignore Space (no double-fire with click).
   - **No `localStorage`, no `sessionStorage`, no `navigator.share`, no `role="alert"`, no `Math.random`, no `Date.now`, no `console.log`** (NFR9, NFR10). `performance.now()` is allowed only via `revealStage.dispatchStage` (not directly in result.js).
   - **On unmount:** remove all click + keydown listeners, clear `rootEl.innerHTML`, call `revealStage.resetRevealStage()` so re-entering the scene in the same SPA session (e.g. via direct hash navigation) starts the stage tracker fresh. (In v1 the only path to `#/result` is from item-runner's Next-on-item-15, which is a fresh session; the reset is defensive for test re-entry + future bail-out flows.)

3. **AC-3 (routing.js integration — register `#/result` route):**
   - Story 3-3's `routing.js` registers routes `''` / `'#/'` → landing; `'#/consent'` → consent; Story 3-4 added `'#/test'` → item-runner. Unknown hashes fall back to landing.
   - This story extends the route table: `'#/result'` → result. `routing.js` MUST be modified to:
     - Add `import * as result from "./result.js"` near the existing scene imports.
     - Add `"#/result": result` to the `ROUTES` table.
   - The existing 8 routing unit tests (`tests/unit/routing.test.mjs`, frozen from Story 3-3) continue to pass — confirm with `make test` post-edit.
   - **No new exports from routing.js**; only the route table grows.
   - Story 3-4's contract for Next-on-item-15: the button dispatches `routing.navigate('result')` which sets `window.location.hash = '#/result'`. This story's route registration converts that from a fallback-to-landing into the actual result scene mount.

4. **AC-4 (state.js integration — read-only consumer):**
   - Story 3-2/3-3/3-4 export `getState()` / `recordResponse()` / `setItem()` / `resetState()` / `setSeed()` / `getSeed()`. Story 3-5 consumes `getState().responses` and `getState().locale`; **does NOT modify `state.js` or its schema**. The frozen `tests/contract/state-shape.spec.mjs` continues to pass.

5. **AC-5 (`src/content/i18n/en/strings.json` — extend with `result` namespace):**
   - Modify `src/content/i18n/en/strings.json` (Story 3-3/3-4 maintain it) to add a top-level `result` namespace with the following keys (concrete EN copy below; dev agent MAY refine wording within the same length budget):
     - `result.scoreHeading`: `"Your result"` (SR-only h2)
     - `result.prerevealHeading`: `"Your result is ready."` (visible — UX spec line 227)
     - `result.prerevealSubcopy`: `"It is one estimate with a range around it."` (visible — UX spec line 227)
     - `result.showMeButton`: `"Show me"` (FR13)
     - `result.notYetButton`: `"Not yet"` (FR13)
     - `result.caveat`: a single sentence ≤25 words EN disclaiming clinical, educational-placement, employment, and legal-decision applicability (FR23). Concrete v1 text: `"This screener is not a clinical assessment, not a credential, not an educational-placement tool, and not a basis for employment or legal decisions."` (23 words — within UX spec line 1406's ≤25-word budget).
     - `result.percentileAriaTemplate`: `"Your percentile, {N}."` (UX spec line 1399 — `{N}` substituted at render with the rounded percentile)
     - `result.anchorAriaTemplate`: `"Your IQ-scale equivalent, {N}."` (UX spec line 1399)
     - `result.bandAriaTemplate`: `"Uncertainty band, 95 percent confidence."` (UX spec line 1399)
     - `result.bandTemplate`: `"±{N}"` (visible — `{N}` substituted with the IQ-scale half-width integer)
     - `result.fetchErrorMessage`: `"Could not load the item set. Try reloading."` (reuse pattern from Story 3-4 `itemRunner.fetchErrorMessage`)
   - Existing namespaces (`chrome`, `landing`, `consent`, `itemRunner`) unchanged.
   - JSON validity preserved (`python3 -c "import json; json.load(open('src/content/i18n/en/strings.json'))"` exits 0).

6. **AC-6 (`src/css/components/score-panel.css` — co-equal triplet + caveat + tear-edge slot):**
   - File at exact path: `src/css/components/score-panel.css` (architecture line 1138, UX spec line 1031).
   - **Co-equal triplet rule** — the three selectors MUST share identical `font-size`, `font-weight`, and `font-family` declarations. Concrete v1 form:
     ```
     .score-panel__anchor,
     .score-panel__percentile,
     .score-panel__band {
       font-size: var(--font-size-600);
       font-weight: var(--font-weight-regular);
       font-family: var(--font-family-sans);
     }
     ```
   - Per UX-DR3 (epics.md line 1062 — "all three at the same `--font-size-600` (39px per UX-DR3), with no visual hierarchy via color or weight differentiation"). `--font-size-600` resolves to `2.441rem` (39px) per `src/css/primitives.css:43`.
   - **NO modifier rules** in this story that break the triplet parity. For example, `.score-panel__anchor--emphasized` is forbidden if it overrides `font-size` / `font-weight` / `font-family`. The lint (AC-7) catches this at the source.
   - `.score-panel__triplet` is the flex container holding the three numerals. Use `display: flex; gap: var(--space-5); align-items: baseline; justify-content: center;` per UX spec line 1373 ("apex surface").
   - `.score-panel__caveat[role="note"]` uses `font-size: var(--font-size-100)` (smaller than the triplet — the caveat is permanent but NOT visually dominant; UX spec line 1376 — "above the score triplet"). Margin-block-end of `var(--space-5)` to separate from the triplet visually.
   - `.score-panel` block: `padding: var(--space-5); background-color: var(--color-surface-elevated); border-radius: var(--border-radius-md); border: var(--border-hairline) solid var(--color-rule-subtle);` per UX spec line 1383 ("Hairline border + `--color-surface-elevated` background + border-radius 8px"). If any of these semantic tokens are missing from `src/css/semantic.css`, the dev agent SHOULD use the closest existing token (e.g., `--space-5` for padding is confirmed present); document any token additions in `src/css/semantic.css` with a one-line comment naming Story 3-5 as the introducer.
   - **`.score-panel__tear-edge` slot** — UX spec line 1382 names it (Step 5 invention #2); for Story 3-5 v1, this slot is **declared but unused** (no `--top-decile` variant in v1; Epic 6 lands the tear-edge cropping-fuzzer composition). Add a placeholder rule with `display: none;` and an inline comment "// Epic 6 tear-edge composition slot — currently unused" so future authors know the selector is reserved.
   - **Semantic tokens only**: no literal hex / px / font-family declarations except via `var(--*)` lookups. Same self-check pattern from Story 3-3 AC-9 and Story 3-4 AC-7.
   - **Combined LOC budget** for this file: ≤ 100 LOC.
   - Update `src/index.html` (Stories 3-3/3-4 maintain) to add `<link rel="stylesheet" href="/src/css/components/score-panel.css">` to the components block — alphabetical position: insert between `progress-indicator.css` and the closing of the components block (i.e., AFTER `progress-indicator.css`).

7. **AC-7 (`tools/lint-css-source-co-equal.mjs` — CSS-AST source lint):**
   - File at exact path: `tools/lint-css-source-co-equal.mjs` (epics.md line 1063).
   - Stdlib-only (NFR33 — no third-party deps). Hand-rolled CSS parser sufficient for the narrow contract: tokenize on `{` / `}` / `;` / `,`, extract selectors + property/value pairs per rule.
   - Test injection: `process.env.IQME_LINT_TARGET` overrides the default scan path (`src/css/components/score-panel.css`). Mirrors the pattern in `tools/lint-no-role-alert.mjs`.
   - **Lint contract:**
     - Parses `src/css/components/score-panel.css` (or the env override).
     - Finds ALL rules whose selector-list contains any of `.score-panel__anchor`, `.score-panel__percentile`, `.score-panel__band` (as standalone class selectors, optionally with pseudo-class / attribute-selector suffixes like `:hover` or `[data-reveal-stage="..."]` — but the lint's scope is the BASE rule that sets typography).
     - For each of the three selectors, computes the **effective declarations** of `font-size`, `font-weight`, `font-family` across all rules in the file (last-write-wins per CSS cascade order within the file).
     - Asserts: `font-size` of all three selectors is identical; `font-weight` of all three is identical; `font-family` of all three is identical.
     - Asserts: at least one rule in the file sets each of `font-size`, `font-weight`, `font-family` for each of the three selectors (no implicit-inheritance escape — the parity must be explicit at the source).
     - Exit 0 on parity; exit 1 with a BREACH message naming each diverging property + selector + file location.
   - **`make lint` integration:** add a new lint target `lint-css-source-co-equal` to `Makefile` (mirroring the structure of `lint-no-role-alert`, `lint-no-share`, etc.) and wire it into the top-level `lint:` target so `make lint` runs it. After this story: `make lint` exits 0 with 11 lints passing (10 from Epic 1 + this new one).
   - **`.github/workflows/pr-checks.yml` integration:** the existing `lint-budget` / `lint-trust-artifacts` job pattern is the model. Add a step (or extend the existing lint job) to invoke `make lint-css-source-co-equal` — verify the workflow YAML syntactically valid via `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/pr-checks.yml'))"`. If `yaml` is not stdlib, the dev agent MAY skip the YAML-validate check at story scope and instead run `make lint` locally as the smoke test (the workflow runs `make lint` per Epic 1's `ci-matrix.yaml` convention, so wiring at the Makefile level is sufficient).

8. **AC-8 (`tests/unit/reveal-stage.test.mjs` — event dispatcher unit tests):**
   - File at exact path: `tests/unit/reveal-stage.test.mjs`.
   - Uses `node:test` + `node:assert/strict` + the shared DOM stub from `tests/unit/_dom-stub.mjs` (Story 3-3 — supports `document.dispatchEvent` + `CustomEvent`). The DOM stub MAY need a one-line extension to model `performance.now()` returning a monotonic counter (e.g., a module-level integer that increments on each call); document the extension at the file top in the test file (NOT in `_dom-stub.mjs` itself unless reusable across multiple test files — for now, scope it to the reveal-stage test).
   - **Tests:**
     - AC-8.1: `dispatchStage("anchor")` fires a `CustomEvent` named `iqme:reveal-stage` on `document` with `detail.stage === "anchor"` and `detail.t` a finite number.
     - AC-8.2: `dispatchStage("handoff")` fires the event with `detail.stage === "handoff"`.
     - AC-8.3: `dispatchStage("anchor")` then `dispatchStage("handoff")` fires both events in order; `t_handoff > t_anchor` (monotonic time source).
     - AC-8.4: `dispatchStage("handoff")` BEFORE `dispatchStage("anchor")` throws an Error with message matching `/declared order/i`.
     - AC-8.5: `dispatchStage("anchor")` then `dispatchStage("anchor")` again throws an Error with message matching `/already fired/i`.
     - AC-8.6: `dispatchStage("band")` (a reserved Epic-6 stage) throws `RangeError` with message matching `/unknown reveal stage/i`.
     - AC-8.7: `dispatchStage("unknown-garbage")` throws `RangeError`.
     - AC-8.8: After `resetRevealStage()`, calling `dispatchStage("anchor")` again succeeds (per-session state reset).
     - AC-8.9: The event's `bubbles === true`, `composed === false` (per ADR).
     - AC-8.10: Source-grep on `src/assessment/reveal-stage.js` — no `Math.random`, no `Date.now`, no `localStorage`, no `sessionStorage`, no `console.log`, no `setTimeout`, no `setInterval`, no default export.

9. **AC-9 (`tests/unit/result.test.mjs` — result scene unit tests):**
   - File at exact path: `tests/unit/result.test.mjs`.
   - Uses `node:test` + `node:assert/strict` + `_dom-stub.mjs` (Story 3-3 baseline, plus the per-file extensions used in `item-runner.test.mjs` for `fetch` stubbing).
   - **Test setup**: stub `globalThis.fetch` to return a synthetic `item-parameters.json` (mirror Story 3-4's pattern); pre-populate `state.js` via `state.recordResponse(0, 1)` × N to seed the responses array; stub `globalThis.crypto.getRandomValues` if `state.setSeed` is called transitively (it is not — `result.js` does NOT call `setSeed`).
   - **Tests:**
     - AC-9.1: `render(rootEl, strings)` writes the pre-reveal beat DOM first: `.result-scene[data-reveal-stage="anchor"]` containing the prereveal heading, subcopy, "Show me" button, "Not yet" button.
     - AC-9.2: After `render`, a `iqme:reveal-stage` event with `detail.stage === "anchor"` is observable on `document` (attach a listener BEFORE calling render, capture the event).
     - AC-9.3: Clicking "Show me" transitions `data-reveal-stage` to `"handoff"`, replaces the pre-reveal beat with the score-panel DOM, and dispatches a second `iqme:reveal-stage` event with `detail.stage === "handoff"`.
     - AC-9.4: The score panel DOM contains `.score-panel`, `.score-panel__caveat[role="note"]`, `.score-panel__triplet`, `.score-panel__percentile`, `.score-panel__anchor`, `.score-panel__band` in that DOM order. `.score-panel__caveat` is ABOVE (DOM-precedes) `.score-panel__triplet`.
     - AC-9.5: `.score-panel__percentile.textContent` parses as an integer in `[0, 100]`. `.score-panel__anchor.textContent` parses as an integer in `[40, 200]` (the IQ-scale range — `Math.round(100 + 15*theta)` for `theta ∈ [-4, +6.67]` realistically `[55, 145]`; the assertion uses a generous envelope). `.score-panel__band.textContent` matches `/^±\d+$/`.
     - AC-9.6: Each triplet `<span>` has `data-methodology-target` set to one of `"scoring/percentile-to-iq"`, `"scoring/overview"`, `"scoring/uncertainty"` (the percentile / anchor / band mapping per AC-2 above).
     - AC-9.7: Clicking `.score-panel__percentile` (after Show-me) navigates: stub `window.location.assign` and assert it was called with `"/methodology/v0.1.0/en/scoring/percentile-to-iq/"` (exact string).
     - AC-9.8: Clicking `.score-panel__anchor` navigates to `"/methodology/v0.1.0/en/scoring/overview/"`. Clicking `.score-panel__band` navigates to `"/methodology/v0.1.0/en/scoring/uncertainty/"`.
     - AC-9.9: Pressing Enter on a focused triplet element (synthetic keydown with `key: "Enter"`) triggers the same navigation as a click.
     - AC-9.10: Clicking "Not yet" leaves `data-reveal-stage="anchor"` unchanged; the score panel is NOT rendered; no second reveal-stage event fires.
     - AC-9.11: Each triplet `<span>` has `aria-label` matching the templates from `result.percentileAriaTemplate` / `anchorAriaTemplate` / `bandAriaTemplate` (with `{N}` substituted for the integers).
     - AC-9.12: `unmount(rootEl)` removes all click + keydown listeners; subsequent synthetic click on the captured "Show me" button reference produces no state change (mirror Story 3-4 AC-10.4g pattern).
     - AC-9.13: After `unmount`, calling `render` again succeeds (the reveal-stage tracker was reset).
     - AC-9.14: No `[role="alert"]`, no `[data-timer]`, no `[aria-timer]` anywhere in the rendered DOM.
     - AC-9.15: Source-grep on `src/assessment/result.js` — no `Math.random`, no `Date.now`, no `localStorage`, no `sessionStorage`, no `console.log`, no `navigator.share`, no `setTimeout`, no `setInterval`, no default export. (`performance.now()` is allowed only indirectly via `reveal-stage.js`; result.js itself must not call it.)

10. **AC-10 (`tests/unit/lint-css-source-co-equal.test.mjs` — lint unit tests):**
    - File at exact path: `tests/unit/lint-css-source-co-equal.test.mjs`.
    - Uses `node:test` + `node:assert/strict` + `child_process.spawnSync` to invoke the lint with `IQME_LINT_TARGET` overrides pointing at synthetic CSS fixtures. Pattern mirrors `tests/unit/lint-no-role-alert.test.mjs` from Epic 1 (if it exists; if not, this story establishes the pattern for source-CSS lints).
    - Fixtures live at `tests/fixtures/lint-css-source-co-equal/`:
      - `parity-ok.css` — three selectors with identical font-size / font-weight / font-family.
      - `font-size-divergent.css` — `.score-panel__anchor { font-size: var(--font-size-600); }` vs `.score-panel__percentile { font-size: var(--font-size-500); }`.
      - `font-weight-divergent.css` — divergent font-weight.
      - `font-family-divergent.css` — divergent font-family.
      - `missing-declaration.css` — `.score-panel__band` rule does not set font-family.
    - **Tests:**
      - AC-10.1: `parity-ok.css` → exit 0, stdout contains "ok".
      - AC-10.2: `font-size-divergent.css` → exit 1, stderr names `font-size` + the diverging selector.
      - AC-10.3: `font-weight-divergent.css` → exit 1, stderr names `font-weight`.
      - AC-10.4: `font-family-divergent.css` → exit 1, stderr names `font-family`.
      - AC-10.5: `missing-declaration.css` → exit 1, stderr indicates the missing property + selector.

11. **AC-11 (`tests/contract/reveal-stage-event-contract.spec.mjs` — ADR contract test):**
    - File at exact path: `tests/contract/reveal-stage-event-contract.spec.mjs`.
    - Uses `node:test` + `node:assert/strict` + `_dom-stub.mjs`.
    - **Tests** (assert the ADR shape directly — orthogonal to AC-8 which tests dispatcher correctness):
      - AC-11.1: The event name is exactly `"iqme:reveal-stage"` (not `"iqme:reveal_stage"` / `"iqme-reveal-stage"` / etc.).
      - AC-11.2: The event's `detail` payload always has properties `stage` (string) and `t` (number). Additional properties allowed; ADR says minimum shape.
      - AC-11.3: `detail.t` is a finite, monotonically non-decreasing value across multiple `dispatchStage` calls in the same session (per ADR — `performance.now()` semantics).
      - AC-11.4: `event.bubbles === true`, `event.composed === false`.
      - AC-11.5: Reserved Epic-6 stages (`band`, `interval`, `context`, `tail-scene`, `methodology-handoff`) throw when dispatched from Story-3-5 code (proves v1 enum-tightening — the dispatcher does not accept reserved stages prematurely).

12. **AC-12 (`make test` + `make test-contract` + `make lint`):**
    - Run `make test` — exit 0; pass count = end-of-3-4 baseline (`376`) + at least 28 new unit tests (10 reveal-stage + 15 result + 5 lint-source — adjustable per dev's grouping; target ≥ `404`); `fail=0`.
    - Run `make test-contract` — exit 0; pass count = end-of-3-4 baseline (`20`) + at least 5 new contract tests (reveal-stage-event-contract); target ≥ `25`.
    - Run `make lint` — exit 0; all 10 existing lints continue to pass + the new `lint-css-source-co-equal` passes against `src/css/components/score-panel.css` (target: 11 green lints).

13. **AC-13 (no-regression: 3-3 / 3-4 tests stay green):**
    - All unit-test files from Stories 3-3 + 3-4 (`landing-scene.test.mjs`, `consent-scene.test.mjs`, `locale-loader.test.mjs`, `routing.test.mjs`, `main.test.mjs`, `item-prng.test.mjs`, `item-selection.test.mjs`, `item-runner.test.mjs`) continue to pass after `routing.js` mod + `strings.json` extension + `index.html` link extension.
    - All contract tests from Stories 3-2 + 3-4 (`state-shape.spec.mjs`, `item-parameters-schema.spec.mjs`) continue to pass.
    - The `app-modules-bytes` budget (`30720`) is NOT breached. End-of-3-4 baseline was `26877/30720` (3843 bytes free). Story 3-5 adds `reveal-stage.js` (~1.2 KB target) + `result.js` (~3.5 KB target). Total target ≤ `4.5 KB` of new bytes → final budget should land near `31300/30720` if NOT carefully managed — **the dev agent MUST keep total ≤ 30720**. If the initial implementation breaches, follow Story 3-4 self-review Decision 3 pattern: collapse comments, inline helpers, remove defensive branches not exercised by tests. As a fallback, the dev MAY split `result.js` into `result.js` (scene) + `score-panel.js` (DOM construction helper) only if the byte total still fits; the architecture line 1074 names `result.js` as a single file but does not forbid extraction. Document any byte-saving moves in the self-review.

## Tasks / Subtasks

- [x] **Task 1: Implement `src/assessment/reveal-stage.js` (AC-1)**
  - [x] 1.1 Module skeleton with `firedStages` Set + per-session declared-order array `["anchor", "handoff"]`.
  - [x] 1.2 `dispatchStage(stage)`: validate enum membership → throw `RangeError` on miss; validate order against `firedStages` → throw on out-of-order / repeat; construct `CustomEvent` with `bubbles: true, composed: false, detail: { stage, t: performance.now() }`; dispatch on `document`; record in `firedStages`.
  - [x] 1.3 Export `resetRevealStage()` that clears `firedStages`.
  - [x] 1.4 Source-grep self-check.

- [x] **Task 2: Implement `src/assessment/result.js` (AC-2)**
  - [x] 2.1 `render(rootEl, strings)`: fetch `/src/items/item-parameters.json`; on success, compute `scoreSession({ responses: state.getState().responses, itemParameters: pool.items, normingStats: { se_norming: 0 } })`. On failure, call `renderErrorFallback`.
  - [x] 2.2 Render pre-reveal beat DOM with `data-reveal-stage="anchor"`; dispatch `revealStage.dispatchStage("anchor")` AFTER the DOM is mounted.
  - [x] 2.3 Wire "Show me" click → transition to handoff: rewrite `.result-scene` inner DOM to the score panel; set `data-reveal-stage="handoff"`; dispatch `revealStage.dispatchStage("handoff")`; re-attach triplet click + keydown listeners.
  - [x] 2.4 Wire "Not yet" click → no-op DOM-wise; listener exists for unmount cleanup symmetry.
  - [x] 2.5 Score-panel DOM construction: caveat (role=note, ARIA template substitutions for triplet ARIA labels, `data-methodology-target` per the three paths), triplet (`.score-panel__percentile` / `.score-panel__anchor` / `.score-panel__band` in that order).
  - [x] 2.6 Triplet click handler: read `data-methodology-target`; compose `/methodology/${CORPUS_VERSION}/${locale}/${path}/`; call `window.location.assign(url)`.
  - [x] 2.7 Triplet keydown handler: on `key === "Enter"`, call the same composer.
  - [x] 2.8 `unmount(rootEl)`: remove all click + keydown listeners; clear `rootEl.innerHTML`; call `revealStage.resetRevealStage()`.
  - [x] 2.9 Source-grep self-check.

- [x] **Task 3: Wire routing.js to register `#/result` → result (AC-3)**
  - [x] 3.1 Add `import * as result from "./result.js"` to `src/assessment/routing.js`.
  - [x] 3.2 Extend `ROUTES` table with `"#/result": result`.
  - [x] 3.3 Run existing 8 routing unit tests (AC-13); confirm 100% pass.

- [x] **Task 4: Extend EN strings.json with `result` namespace (AC-5)**
  - [x] 4.1 Add 11 new keys under `result` namespace (`scoreHeading`, `prerevealHeading`, `prerevealSubcopy`, `showMeButton`, `notYetButton`, `caveat`, `percentileAriaTemplate`, `anchorAriaTemplate`, `bandAriaTemplate`, `bandTemplate`, `fetchErrorMessage`).
  - [x] 4.2 Validate JSON parses.
  - [x] 4.3 Update routing.js `getStrings()` to surface the new namespace to result.js's render.

- [x] **Task 5: Author `src/css/components/score-panel.css` (AC-6)**
  - [x] 5.1 Triplet rule with combined `font-size: var(--font-size-600); font-weight: var(--font-weight-regular); font-family: var(--font-family-sans);` (single rule, three selectors).
  - [x] 5.2 `.score-panel__triplet` flex container + spacing.
  - [x] 5.3 `.score-panel__caveat[role="note"]` styling with `var(--font-size-100)` + margin-block-end.
  - [x] 5.4 `.score-panel` block styling per UX spec line 1383.
  - [x] 5.5 `.score-panel__tear-edge { display: none; }` reserved-slot placeholder.
  - [x] 5.6 Self-check: no literal hex / px / font-family.
  - [x] 5.7 Update `src/index.html` to add the new component CSS link (alphabetical position after `progress-indicator.css`).

- [x] **Task 6: Author `tools/lint-css-source-co-equal.mjs` (AC-7)**
  - [x] 6.1 Hand-rolled CSS tokenizer (block/rule/declaration extraction).
  - [x] 6.2 Selector-list parser; identify rules touching any of the three triplet selectors.
  - [x] 6.3 Effective-declaration computation (last-write-wins) for `font-size` / `font-weight` / `font-family`.
  - [x] 6.4 Parity check; exit 0 / 1 + BREACH messages.
  - [x] 6.5 Wire into `Makefile` `lint:` target.
  - [x] 6.6 Verify `make lint` exits 0 with the new lint passing.

- [x] **Task 7: Author unit + contract tests (AC-8 through AC-11)**
  - [x] 7.1 `tests/unit/reveal-stage.test.mjs` — 10 tests (AC-8.1 through AC-8.10).
  - [x] 7.2 `tests/unit/result.test.mjs` — 15 tests (AC-9.1 through AC-9.15).
  - [x] 7.3 `tests/unit/lint-css-source-co-equal.test.mjs` + `tests/fixtures/lint-css-source-co-equal/` — 5 tests (AC-10.1 through AC-10.5).
  - [x] 7.4 `tests/contract/reveal-stage-event-contract.spec.mjs` — 5 tests (AC-11.1 through AC-11.5).

- [x] **Task 8: Verify (AC-12, AC-13)**
  - [x] 8.1 `make test` — exit 0; ≥ 404 pass; 0 fail.
  - [x] 8.2 `make test-contract` — exit 0; ≥ 25 pass.
  - [x] 8.3 `make lint` — exit 0; 11 lints green.
  - [x] 8.4 Confirm `app-modules-bytes` budget ≤ 30720.
  - [x] 8.5 Stories 3-3 + 3-4 unit + contract tests all stay green.

## Dev Notes

### What this story is and is NOT

**IS:**
1. `src/assessment/reveal-stage.js` — `iqme:reveal-stage` dispatcher with v1 enum (`anchor`, `handoff`) + per-session ordering invariant per ADR.
2. `src/assessment/result.js` — `#/result` scene: pre-reveal beat (FR13) + score panel (FR15, FR18, FR23) + methodology-handoff click composer (per `methodology-handoff-url-contract.md`).
3. `src/css/components/score-panel.css` — co-equal triplet typography + caveat + tear-edge slot reservation.
4. `tools/lint-css-source-co-equal.mjs` — CSS-AST source lint asserting triplet parity.
5. Extension of `routing.js` (`#/result` route), `strings.json` (`result` namespace), `index.html` (CSS link), `Makefile` (new lint target).
6. 4 test files: `reveal-stage.test.mjs` (unit), `result.test.mjs` (unit), `lint-css-source-co-equal.test.mjs` (unit) + fixtures, `reveal-stage-event-contract.spec.mjs` (contract).

**IS NOT:**
- Epic 6 reserved stages (`band`, `interval`, `context`, `tail-scene`, `methodology-handoff`) — declared in the ADR but not dispatched in Story 3-5. The reveal-stage.js enum tightly rejects them.
- Tail-scene composition (`tail-scene.css` + per-decile variants) — Epic 5/6 lands them.
- Cropping-fuzzer runtime test — Epic 6 (Story 6.6).
- Playwright computed-style co-equal-triplet assertion — Epic 6 (Story 6.1). This story's source-CSS lint is the Epic-3 tier of Murat's two-tier defense; Epic 6 graduates to runtime.
- Methodology stub pages — Story 3.6 lands `scoring/percentile-to-iq/`, `scoring/uncertainty/`, `scoring/overview/`. This story's click composer navigates to those URLs; until Story 3.6, navigation lands on a 404 (acceptable for Story 3-5's test scope — the test stubs `window.location.assign` and asserts the URL string).
- Strict full-vertical-slice network-trace — Story 3.7.
- Aha-click hallway test — Story 3.8.
- Difficulty-breakdown sentence (`.score-panel__difficulty-sentence`) + qualitative band label (`.score-panel__qualitative`) — UX spec lines 1380-1381 reserve them; Epic 6 (Story 6.2) lands them. This story's score panel is the **minimum viable load-bearing surface** (triplet + caveat); future enrichment is additive.
- Norming-stats real values (`se_norming`) — `0` placeholder per Story 3-4 precedent; Epic 9b lands real values.
- Tear-edge overlay composition — UX spec line 1382 reserves `.score-panel__tear-edge`; Story 3-5 ships an empty placeholder rule.
- Top-decile / bottom-decile composition variants (`.score-panel--top-decile` etc.) — Epic 6.
- Localized RU/PL copy — Epic 7.

### Critical decisions encoded here

**Decision 1: Pre-reveal beat (FR13) and reveal-stage event are fired from `result.js`, not from `item-runner.js`.** The architecture line 1074 names `result.js` as the FR18-FR27 + reveal-beat orchestration site. Story 3-4 (item-runner) intentionally ended with Next-on-item-15 dispatching `routing.navigate('result')` — control crosses the route boundary BEFORE the reveal ceremony begins. This keeps each scene self-contained and matches the UX spec mental model ("the result page is a scene, not a route" — line 242 — which means the scene IS the route handler, not a fragment within item-runner).

**Decision 2: `data-reveal-stage` attribute lifts from JS to a single root element.** UX spec lines 1316-1318 + 609 + architecture line 609 explicitly pin the pattern: JS lifts `data-reveal-stage` on the `.result-scene` root; CSS attribute selectors do the visual work (no JS-driven class toggling). The Story 3-5 v1 has two stage values exposed (`anchor`, `handoff`); Epic 6 adds intermediate stages (`band`, `interval`, etc.) — when those arrive, CSS attribute selectors will key off them without JS changes beyond an enum extension in `reveal-stage.js` (additive per ADR Extension Rules).

**Decision 3: Hard-code `CORPUS_VERSION = "v0.1.0"` in `result.js` for v1.** The methodology-handoff URL ADR mandates a build-time-baked corpus version constant via `git describe --tags --match 'corpus-v*' --abbrev=0`. Epic 4 lands the build-time injection. For Story 3-5 v1, hard-coding `"v0.1.0"` matches the Story 3.6 stub-page emission target (`/methodology/v0.1.0/en/...`) and the `src/index.html` `<noscript>` reference to `/methodology/v1.0.0/en/`. **NB:** there's a subtle naming inconsistency in the existing `index.html` (`v1.0.0`) vs the Story 3.6 plan (`v0.1.0`); the dev agent should NOT attempt to reconcile that here — flag it in self-review for a follow-up bridge. Story 3-5's hard-code aligns with Story 3.6's plan (`v0.1.0`) since 3-6 is the story that lands the actual files.

**Decision 4: Triplet click + keydown handlers attached per-element after Show-me transition.** Per Story 3-4's UX-DR32 precedent (native HTML widgets) and Story 3-3's listener-cleanup discipline (AC-5.11), each triplet `<span>` gets `addEventListener("click", ...)` and `addEventListener("keydown", ...)` registered at score-panel mount time; `unmount(rootEl)` walks the captured listener references and detaches them. Event-delegation on `.score-panel__triplet` was rejected because the AC-9.12 test asserts post-unmount synthetic events are no-ops at the element level (delegation would still respond if the parent listener remained — a different testing surface).

**Decision 5: `tabindex="0"` + Enter activation on triplet `<span>` (UX spec line 1411).** `<span>` is not natively focusable; `tabindex="0"` enrolls it in the tab order. The Enter-keydown handler is necessary because `<span>` does not synthesize a click on Enter (unlike `<button>` / `<a>` / form inputs). Space is intentionally NOT handled (avoid double-fire with click on `<button>`-styled span; the keyboard interaction is Enter-only per UX spec).

**Decision 6: `role="note"` on the caveat (NOT `role="alert"`).** UX-DR22 + Story 3-3 + Story 3-4 all pin this. `role="note"` is the WAI-ARIA semantic for "permanent informational content" — the caveat is non-dismissible AND not transient (the alert role's defining property is transient announcement, which would also create a fresh SR announcement on every reveal, polluting the SR experience). The existing `tools/lint-no-role-alert.mjs` from Epic 1 asserts `role="alert"` is absent across `src/`.

**Decision 7: Source-CSS lint, not runtime computed-style.** Murat's two-tier defense (epics.md line 1063 + line 1408): source-level catches violations BEFORE PR merge (fast feedback, blocks the source-time error class); runtime computed-style (Epic 6, Story 6.1) catches violations from cascade unrolling, third-party CSS injection, or build-pipeline drift. Story 3-5 ships the source tier. The runtime tier is graduation, not introduction — meaning Epic 6's Playwright test will assert against the live HTML, which by then has accumulated multiple components' CSS + the build pipeline's bundling. Catching divergence at the source first means Epic 6's runtime test is a backstop, not the only line of defense.

**Decision 8: Module-level `firedStages` Set in `reveal-stage.js` for per-session ordering.** Per the ADR ordering invariant ("never repeats", "never skips", "fires in declared order"). The Set is reset by `resetRevealStage()` on scene unmount + on test re-entry. This is module-level state — acceptable here because the dispatcher's contract is *intrinsically* per-session (the ADR's "single session" scope is the SPA load lifetime, which matches a single module instance in the browser; tests reset via the explicit hook).

### Architecture compliance — references

| Topic | Source |
|---|---|
| `src/assessment/reveal-stage.js` dispatcher | architecture.md line 384, 1076 |
| `src/assessment/result.js` (FR18-FR27 + reveal-beat orchestration) | architecture.md line 1074 |
| `src/css/components/score-panel.css` (load-bearing apex) | architecture.md line 1138, UX spec line 1031, 1371 |
| Co-equal triplet at `--font-size-600` (39px per UX-DR3) | epics.md line 1062, UX spec line 1377-1379, primitives.css line 43 |
| FR23 caveat with `role="note"` | epics.md line 1067, UX spec line 1400, prd.md line 823 |
| FR15 uncertainty band from `scoreSession()` | prd.md line 805-812, architecture.md line 1391, `src/scoring/irt/index.js` |
| FR13 pre-reveal "are you ready" beat | prd.md line 800, UX spec line 227 |
| `iqme:reveal-stage` event contract | `docs/adr/iqme-reveal-stage-event-contract.md` (Story 3-1) |
| methodology-handoff URL contract | `docs/adr/methodology-handoff-url-contract.md` (Story 3-1) |
| `data-reveal-stage` attribute pattern | architecture.md line 609, UX spec line 1316-1318, 609 |
| `tools/lint-css-source-co-equal.mjs` (Murat tier 1) | epics.md line 1063, 1408 |
| Native input/widget posture (UX-DR32) | UX spec line 1411 (keyboard activation) |
| `crypto.getRandomValues` mandatory; `Math.random` forbidden (NFR10) | architecture.md line 346, line 812 |
| `app-modules-bytes` budget (30720) | budgets.json |
| `performance.now()` mandatory; `Date.now()` forbidden (NFR10) | architecture.md line 720, ADR |
| `tools/lint-no-role-alert.mjs` (existing) | tools/lint-no-role-alert.mjs (Story 1-9) |

### Previous story intelligence (from Stories 3-1, 3-2, 3-3, 3-4, 1-9, 1-10)

- **Story 3-1** authored `docs/adr/iqme-reveal-stage-event-contract.md` (this story's primary contract). Read the ADR before implementing `reveal-stage.js`; the dispatcher's tests MUST assert the ADR shape (`bubbles: true, composed: false`, `detail: { stage, t }`, `t` from `performance.now()`, dispatch target = `document`, stage enum tight to `["anchor", "handoff"]` in v1).
- **Story 3-1** also authored `docs/adr/methodology-handoff-url-contract.md`. The click composer in `result.js` MUST follow the "Resolution rule" exactly: leading slash, version segment, locale segment, path, trailing slash.
- **Story 3-2** landed `src/assessment/state.js` + `state.schema.json` + the contract test. `result.js` reads `state.getState().responses` and `state.getState().locale`; does NOT mutate state. The frozen contract test continues to pass.
- **Story 3-3** landed `routing.js` + `error-fallback.js` + `_dom-stub.mjs` + the EN `strings.json` baseline. The Story-3-3 lesson on comments tripping source-grep lints (e.g., comment text `localStorage` triggering `lint-no-localStorage-without-consent`) applies: avoid mentioning forbidden tokens in `reveal-stage.js` / `result.js` comments. Use circumlocutions ("the storage primitives Story 1-9 forbids" not "no localStorage").
- **Story 3-4** landed `item-runner.js` + the item-pool + `scoring/irt` integration pattern. The `scoreSession({ responses, itemParameters, normingStats })` call signature in `result.js` mirrors Story 3-4's pattern (`responses` is `state.getState().responses` shaped per the frozen schema; `itemParameters` is `pool.items` from `item-parameters.json`; `normingStats: { se_norming: 0 }` is the v1 placeholder).
- **Story 3-4 byte budget lesson:** the `app-modules-bytes` budget is now 3843 bytes free. Story 3-5 adds two new modules. **Plan for slim-down**: avoid multi-paragraph block comments (single-line `//` only where non-obvious); avoid defensive code paths not exercised by AC-9 tests; inline tiny helpers (the `esc()` pattern from Story 3-4); reuse Story 3-4's `escapeAttr`/`escapeText` if exported (they were inlined as `esc()` per the slim-down).
- **Story 3-3 lesson on `crypto` global stub** (Object.defineProperty pattern): not directly applicable here — `result.js` does not call `crypto.getRandomValues`. But the **fetch stub pattern** from Story 3-4 (`globalThis.fetch = async () => ({ ok: true, json: async () => synthetic })`) DOES apply for the result.test.mjs setup.
- **Story 3-3 / 3-4 frozen-test discipline (lesson-2026-05-19-001)**: once test-author phase completes for Story 3-5, the four test files become integrity-tracked. Edits after that point require `tds integrity record --as=<role> --files=<path> --reason=<text>` BEFORE state-commit. Plan testing carefully; minimize churn in the test files.
- **Story 1-9** shipped `tools/lint-no-share.mjs`, `lint-no-role-alert.mjs`, `lint-no-cookie-banner.mjs`, `lint-no-localStorage-without-consent.mjs`. Story 3-5 adds `lint-css-source-co-equal.mjs` to the same `tools/` directory following the same pattern (stdlib-only, `IQME_LINT_TARGET` env override, exit 0/1, BREACH stderr messages).
- **Story 1-10** locked the two-layer CSS token architecture. `score-panel.css` uses ONLY semantic tokens — `var(--font-size-600)`, `var(--space-5)`, `var(--color-surface-elevated)` etc. NO literal hex / px / font-family declarations except via `var(--*)` lookups.

### Files added / modified summary (anticipated)

**New (8 files):**
- `src/assessment/reveal-stage.js`
- `src/assessment/result.js`
- `src/css/components/score-panel.css`
- `tools/lint-css-source-co-equal.mjs`
- `tests/unit/reveal-stage.test.mjs`
- `tests/unit/result.test.mjs`
- `tests/unit/lint-css-source-co-equal.test.mjs`
- `tests/contract/reveal-stage-event-contract.spec.mjs`

**New (5 fixture files):**
- `tests/fixtures/lint-css-source-co-equal/parity-ok.css`
- `tests/fixtures/lint-css-source-co-equal/font-size-divergent.css`
- `tests/fixtures/lint-css-source-co-equal/font-weight-divergent.css`
- `tests/fixtures/lint-css-source-co-equal/font-family-divergent.css`
- `tests/fixtures/lint-css-source-co-equal/missing-declaration.css`

**Modified (4 files):**
- `src/assessment/routing.js` — add `#/result` route entry + `result` namespace to `getStrings()`.
- `src/content/i18n/en/strings.json` — add `result` namespace (11 keys).
- `src/index.html` — add `score-panel.css` link (alphabetical, after `progress-indicator.css`).
- `Makefile` — wire `lint-css-source-co-equal` into the `lint:` target.

**Deleted (0 files):** None.

### Testing standards summary

- All four test files use `node:test` + `node:assert/strict` (matching Story 3-3 / 3-4 precedent).
- DOM stubs are scope-limited per file. The `performance.now()` extension is local to the reveal-stage test (a small per-test counter); document the extension at the file top.
- `globalThis.fetch` stubbed in `result.test.mjs` (Story 3-4 pattern).
- `globalThis.window` / `globalThis.window.location.assign` stubbed in `result.test.mjs` for navigation assertions.
- `state.js` is imported live (no stubbing); pre-populate via `state.resetState()` + `state.recordResponse(i, 0|1)` × N. The `state.getState().locale` defaults to `"en"` per Story 3-2 — no extra setup needed for the URL composer test.
- Test count delta: ~30 new unit tests + 5 new contract tests = ~35 net-new (target: ≥ 28 new unit; ≥ 5 new contract).

### Project Structure Notes

- `src/css/components/` currently contains 5 files. This story adds 1 (`score-panel.css`); the CSS LOC budget is `css-components-lines: 1500`. Verify post-author with `wc -l src/css/components/*.css | tail -1`.
- `tools/` currently contains 10+ lint scripts. This story adds 1 (`lint-css-source-co-equal.mjs`); no budget impact (lint scripts are not in any LOC budget).
- `tests/fixtures/` is a new subdirectory (`lint-css-source-co-equal/`); 5 CSS files added.

### Implementation Notes — gotchas to avoid

1. **`performance.now()` in the test environment.** Node's `node:test` has access to `performance.now()` via the `node:perf_hooks` global (`performance` is globally available in Node 22+). If the DOM stub re-shadows `performance`, the dispatcher will break — keep the stub limited to `document` / `window` / `CustomEvent` and let `performance` flow through from the real Node runtime.
2. **`CustomEvent` constructor in the DOM stub.** `_dom-stub.mjs` from Story 3-3 already models `CustomEvent` (used by `routing.js`'s `iqme:route-change` dispatch). Reuse; no extension needed.
3. **`document.dispatchEvent` listener attachment order in tests.** Attach the listener BEFORE calling `render()` — Story 3-3's `consent.test.mjs` precedent. Otherwise the `anchor` stage fires before the test can observe it.
4. **`window.location.assign` stub MUST be a function, not a value.** `window.location` is typically read-only; use `Object.defineProperty(window.location, "assign", { value: fn, configurable: true })` or stub the whole `window.location` object via `Object.defineProperty(window, "location", { value: { assign: fn, hash: "", ... }, configurable: true })`. Story 3-3's main.test.mjs has a precedent for `window.location` stubbing.
5. **CSS-AST hand-roll is non-trivial.** The lint MUST handle: nested selectors not used here but possible (skip), comments inside rules (strip), declarations with `var(--token)` values (preserve as opaque strings — string equality is sufficient since we're comparing source-level equality, not resolved values), multi-line declarations (handle `\n` inside a declaration body), and the trailing semicolon being optional in the last declaration. **Suggested approach**: regex-based tokenizer with a state machine — `IN_SELECTOR`, `IN_BLOCK`, `IN_VALUE`. Test the parser against the 5 fixture files PLUS the real `src/css/components/score-panel.css`.
6. **The `bandTemplate` substitution edge case.** `"±{N}"` with `N=0` renders `"±0"` which is technically uninformative but mathematically correct for a hypothetical zero-uncertainty session. AC-9.5 asserts the format `/^±\d+$/`; `±0` matches. No special-case needed.
7. **`scoreSession()` consumes `responses` as an array of `{ itemIndex, response }` objects** (Story 2-5 + Story 3-4 confirmed). `state.getState().responses` already returns this shape. The conversion in `result.js` is a no-op pass-through. **Gotcha**: if the user submitted with fewer than 16 items (theoretically impossible via the UI — Next-on-item-15 only fires after all 16 are answered — but possible via direct hash navigation to `#/result`), `scoreSession` may throw or produce a degenerate score. Story 3-5 v1 does NOT defend against this (defer to a future bail-out story); the test setup pre-populates 16 responses to avoid the edge case.
8. **The "Not yet" button is a real button, not visual-only.** Per UX spec line 227 it's part of the FR13 ceremony. Wire the click listener even though the handler is a no-op; the listener-cleanup test (AC-9.12) verifies both Show-me AND Not-yet are detached on unmount.
9. **`role="note"` is NOT focusable by default.** Don't add `tabindex` to the caveat — it's read by SRs as part of the natural reading flow when the region is announced; making it focusable would create a redundant tab stop.
10. **The `aria-label` on triplet `<span>`s overrides the visible text for SRs.** Per UX spec line 1399, the SR experience is "Your percentile, 58." rather than just "58". The visible text remains the numeral; `aria-label` provides the SR-only context. Test: a focused `.score-panel__percentile` reports its `aria-label` (mocked via DOM stub assertions on the attribute).
11. **CSS `font-family: var(--font-family-sans)` is the architecture-mandated value** (UX spec line 1405 — "Numbers render in `--font-family-sans`, NOT in a serif or display font"). Verify `--font-family-sans` exists in `src/css/primitives.css` or `semantic.css` before referencing. If absent, add it (one-line `--font-family-sans: system-ui, sans-serif;` in primitives) and document in self-review as a token-introduction.
12. **`--font-weight-regular` may not yet exist.** Check `src/css/primitives.css`; if absent, add `--font-weight-regular: 400;`. UX spec line 1405 implies a weight token system but doesn't pin the names; using `--font-weight-regular` aligns with the BEM-attribute discipline.
13. **The `Makefile` `lint:` target structure** (from Epic 1): each lint is a separate phony target (e.g., `lint-no-role-alert`, `lint-cognitive-load-budget`), and `lint:` depends on all of them. Follow the same pattern — add `lint-css-source-co-equal:` as a phony target invoking `node tools/lint-css-source-co-equal.mjs`, then add it to `lint:`'s dependencies.
14. **Story 3-4 byte-budget headroom is 3843 bytes.** Be aggressive about slim-down in `reveal-stage.js` (~1.2 KB target) and `result.js` (~3.5 KB target). Don't introduce a `score-panel.js` helper unless the totals breach (architecture line 1074 names `result.js` as a single file).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.5](../planning-artifacts/epics.md) — Original AC formulation (lines 1047-1073).
- [Source: _bmad-output/planning-artifacts/architecture.md] lines 384, 609, 720, 873-877, 977, 1074, 1076, 1138, 1300, 1302, 1316, 1323, 1391-1395 — reveal-stage / result.js / score-panel / event contract / co-equal triplet.
- [Source: _bmad-output/planning-artifacts/prd.md] lines 800 (FR13), 805-812 (FR15), 818 (FR18), 823 (FR23), 904 (NFR13).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] lines 227 (pre-reveal beat), 1031, 1371-1417 (score-panel anatomy + states + accessibility).
- [Source: docs/adr/iqme-reveal-stage-event-contract.md](../../../docs/adr/iqme-reveal-stage-event-contract.md) — primary contract for `reveal-stage.js`.
- [Source: docs/adr/methodology-handoff-url-contract.md](../../../docs/adr/methodology-handoff-url-contract.md) — primary contract for the click composer in `result.js`.
- [Source: _bmad-output/implementation-artifacts/stories/3-2-implement-state-js-contract-test.md] — `getState()` / `setSeed` / `recordResponse` contracts.
- [Source: _bmad-output/implementation-artifacts/stories/3-3-implement-landing-consent-scene-en.md] — `routing.js`, `error-fallback.js`, `_dom-stub.mjs`.
- [Source: _bmad-output/implementation-artifacts/stories/3-4-implement-item-runner-progress-indicator-16-item-session-with-fr7-seed.md] — byte-budget posture + `scoreSession` integration pattern.
- [Source: src/scoring/irt/index.js] — `scoreSession({ responses, itemParameters, normingStats })`.
- [Source: src/css/primitives.css line 38-45] — font-size token scale.
- [Source: budgets.json] — `app-modules-bytes: 30720`.
- [Source: tools/lint-no-role-alert.mjs] — exemplar source-lint pattern.

## Dev Agent Record

### Agent Model Used

(populated by execute-story)

### Debug Log References

### Completion Notes List

- All 8 tasks complete. 35 new tests green (10 reveal-stage + 15 result + 5 lint + 5 contract). app-modules-bytes 30715/30720 (5 bytes free; aggressive slim per spec impl-note 14). --font-weight-regular added to primitives.css with tokens snapshot regen.
- All 8 tasks complete; 35 new tests green; lint exit 0 (11 green); app-modules-bytes 30715/30720 (5 bytes free)

### File List

- src/assessment/reveal-stage.js
- src/assessment/result.js
- src/css/components/score-panel.css
- tools/lint-css-source-co-equal.mjs
- src/assessment/routing.js
- src/content/i18n/en/strings.json
- src/index.html
- Makefile
- src/css/primitives.css
- tests/snapshots/tokens.hash.json
- tests/unit/reveal-stage.test.mjs
- tests/unit/result.test.mjs
- tests/unit/lint-css-source-co-equal.test.mjs
- tests/contract/reveal-stage-event-contract.spec.mjs
- tests/fixtures/lint-css-source-co-equal/parity-ok.css
- tests/fixtures/lint-css-source-co-equal/font-size-divergent.css
- tests/fixtures/lint-css-source-co-equal/font-weight-divergent.css
- tests/fixtures/lint-css-source-co-equal/font-family-divergent.css
- tests/fixtures/lint-css-source-co-equal/missing-declaration.css

## Specialist Self-Review

**Decisions made:**

1. **Triplet click + keydown handlers attached per-element after Show-me transition** — per Decision 4 in spec (lines 293-296) + AC-9.12 post-unmount no-op requirement. Event-delegation on `.score-panel__triplet` was the obvious alternative but would still respond when only the parent listener detached, breaking AC-9.12's observable post-unmount silence. The two `addEventListener` calls per triplet element (click + keydown) plus an iterator-friendly `m.ls` listener registry made unmount provably clean.

2. **`m` (module-level mount state) holds only `{ ls: [] }`** — collapsed from earlier `{ rootEl, listeners }` shape after the Show-me transition path stopped needing the original rootEl reference (the `root` closure variable in `listenBeat` suffices). Single-letter naming was driven by Karpathy #2 simplicity *under hard byte-budget pressure* (see Decision 6).

3. **`bandTemplate` uses `F()` (template substitution) for `±{N}`** — the AC-5 string is `"±{N}"`, which means the impl must run the `{N}` substitution through the localizable template channel rather than hard-coding `"±"` + number. Keeps Epic 7 (RU/PL) free to localize the symbol if any locale needs `"±N"` without the symbol, or `"+/- N"`, etc.

**Alternatives considered:**

1. **Score-panel as a separate module `score-panel.js`** (spec impl-note 14 escape hatch). Initial impl was a single result.js of 5798 bytes (well over the available 3843-byte headroom). I chose aggressive in-file slimdown over module split because (a) the architecture (line 1074) names `result.js` as a single file by intent, (b) the file fits the brain end-to-end at ~85 LOC compact, (c) extracting score-panel.js adds module-overhead (import + 2 export decls + import line) for marginal LOC gain.

2. **Event delegation on `.score-panel__triplet`** — rejected per Decision 4 above.

3. **Hardcoded ARIA strings for triplet elements instead of template-fmt** — would save ~120 bytes (no `F()` calls in panel rendering for ARIA labels), but breaks i18n: AC-9.11 templates contain `{N}` for percentile/anchor substitution. Hardcoded would force every locale's translator to also know to substitute `{N}` outside the i18n bundle.

4. **`Object.defineProperty` for the `m.ls` push pattern** — explored briefly to avoid `el && el.addEventListener` null-guarding in `on(el, type, fn)`. Net was longer.

**Framework gotchas avoided:**

- **`performance.now()` only in reveal-stage.js, not result.js** — AC-9.15 forbids `performance.now` in result.js. The dispatcher in reveal-stage.js is the only sanctioned timestamp source.
- **`window.location.assign(url)` as a function call, not property reassignment** — tests stub `window.location.assign` via `Object.defineProperty` per main.test.mjs precedent. Reassigning `window.location.hash = ...` would have worked for navigation in browsers but would have bypassed the test's URL capture.
- **`fetch` failure path renders `renderErrorFallback`** — mirrors item-runner.js Story 3-4 pattern. AC-9 tests don't exercise the error path explicitly but the contract holds.
- **`document.addEventListener` is on `document` (not `window`)** — per the ADR; AC-11.1 explicitly tests against `document.dispatchEvent`.
- **Per-session `firedStages` Set reset on every render + unmount** — AC-9.13's "render again after unmount succeeds" works because both `render()` and `unmount()` call `rs.resetRevealStage()`.

**Areas of uncertainty:**

1. **Byte-budget headroom is now 5 bytes** (30715/30720). This is functional but knife-edge. Any new `src/assessment/*.js` byte in Epic 4+ will breach. Auditor should consider whether this story should bump the budget limit (NFR32 was sized for a v1 minimal SPA; we're already at 99.98% of capacity). Alternatively: extract a shared `_html-escape.js` utility (factor `esc()` out of 5 modules; net savings ~250 bytes after import-line overhead).

2. **`responses.map((x) => x.response)` shape conversion** — AC-2 wording says "Convert to the shape `scoreSession` expects" but doesn't pin the helper's location. The conversion lives inline in result.js's render. If Epic 5 introduces a 2nd consumer of `scoreSession` from a state-shaped responses array, factor into state.js as `getState().scoredResponses` (or similar).

3. **Spec AC-2 vs AC-9.4 DOM-order tension flagged by test-author** — test-author chose AC-9.4 (percentile, anchor, band) as the DOM contract. My impl follows AC-9.4. If the auditor reads the AC-2 CSS-rule grouping (anchor, percentile, band) as DOM-intent, this would be a re-implement. Recommendation: bridge the ambiguity in a follow-up doc edit, NOT a story re-do.

4. **`CV = "v0.1.0"` hard-code** — per Decision 3, Epic 4 (`tools/build-methodology.mjs`) replaces with build-time `git describe`. Also: `src/index.html` `<noscript>` still references `/methodology/v1.0.0/en/` (different version literal). The naming inconsistency is **out-of-scope for this story** per Decision 3 — flag for a bridge.

5. **`--font-weight-regular` token addition** — required for the score-panel.css triplet rule (UX spec line 1405). Added to primitives.css and tokens snapshot regenerated. The change ripples into Epic 6/7 if more tokens are needed. Consider whether `--font-weight-medium`, `--font-weight-bold` are imminent and should land together.

**Tested edge cases:**

- AC-8.4: out-of-order dispatch (`handoff` before `anchor`) → Error matching `/declared order/i`. Anchored by index check `for (let j = 0; j < i; j++) if (!fired.has(O[j])) throw`.
- AC-8.5: repeat dispatch of same stage → Error matching `/already fired/i`.
- AC-8.6: reserved Epic-6 stage (`band`) throws RangeError — proves v1 enum tightening.
- AC-9.10: "Not yet" click is observably a no-op — `data-reveal-stage` stays "anchor", no second reveal-stage event, no score-panel rendered. The empty `() => {}` handler IS attached + tracked in `m.ls` so unmount still detaches it correctly.
- AC-9.12: post-unmount synthetic click on captured Show-me reference produces no score panel.
- AC-9.13: re-render after unmount succeeds (the reveal-stage tracker is reset).
- AC-9.14: rendered DOM contains no `[role="alert"]`, no `[data-timer]`, no `[aria-timer]` — UX-DR22 + FR5 compliance.
- AC-9.15: result.js source has no forbidden globals, no `performance.now` (only via reveal-stage.js indirection).
- AC-10.5: missing-declaration fixture → lint exits 1 with stderr naming both the missing property (`font-family`) and the selector (`score-panel__band`).
- All 376 prior-story tests stay green (no regressions); budget under limit; lint 11/11 green.

## Auditor Findings (round-1)

### [info] Specialist Self-Review §Areas of uncertainty #4 disclosed: `src/index.html` `<noscript>` references `/methodology/v1.0.0/en/` while reveal-stage / score-panel code paths use `v0.1.0` (per Story 3-1 ADR `release-tag-namespace-contract`). Documented out-of-scope; not introduced as a regression in 3-5 (the `v1.0.0` literal pre-dates this epic). No code path follows the noscript link at runtime since noscript renders only when JS is disabled. Recording for retro aggregation so the inconsistency is fixed in a focused follow-up (likely Epic 4 build-methodology generator territory or a one-line index.html edit).


- **Category:** scope / cross-epic-debt
- **Suggested bridge:** `"Reconcile noscript/SPA methodology version literal: replace `v1.0.0` in `src/index.html` <noscript> with the same build-time resolved corpus version that the SPA bundle uses (per Story 3-1 ADR-3 click-binding contract)."
`

## Auditor Findings (round-2)

### [info] Specialist Self-Review §Areas of uncertainty #1 disclosed `app-modules-bytes` landed at 30715/30720 in story 3-5 (5-byte headroom). 3-7 later recovered to 30623/30720 (97 bytes free) via main.js comment-collapse + test-hook.js exclude. Pattern of brushing the budget twice in one epic is a signal that NFR32 was sized too tight for v1 or that the assessment domain is approaching a refactor (extract `_html-escape.js` shared util per 3-5 self-review). Not blocking; retro topic.


- **Category:** budget / cognitive-load
- **Suggested bridge:** `"Re-evaluate `app-modules-bytes` 30720 budget or extract shared utilities (`_html-escape.js` factor across 5+ modules) ahead of Epic 4. Recommend tracking byte-budget trend in retro SLI alongside test count + lint count."
`
