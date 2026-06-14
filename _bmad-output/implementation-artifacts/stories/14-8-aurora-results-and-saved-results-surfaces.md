---
id: 14-8-aurora-results-and-saved-results-surfaces
title: "Story 14.8: Aurora results and saved-results surfaces"
status: done
---

# Story 14.8: Aurora results and saved-results surfaces

## Story

As a **person reading my completed-assessment result**,
I want **the result card and my saved-results list to sit on the Aurora spatial backdrop with legible, depth-bearing glass**,
so that **the Percentile / IQ-scale / Range estimate reads clearly without the flat, blur-imperceptible chrome that Epic 13 left on the dark theme**.

## Acceptance Criteria

1. **Perceptible Aurora glass on the result card (PR-25).** The revealed `.score-panel` (styled by `score-panel.css`) composites `--surface-glass-strong` + `backdrop-filter: blur(var(--surface-glass-blur))` over the Aurora backdrop introduced in Story 14.2, reading as a raised glass panel — perceptibly distinct from the deep-navy backdrop on both the explicit `[data-theme]` and `@media (prefers-color-scheme: dark)` paths — and adds the inset lit-edge highlight (`inset 0 1px 0 var(--surface-glass-edge)`, consistent with the `.aurora-surface` primitive) so the card reads "lit from within." It consumes ONLY semantic role tokens (no raw primitive or literal color added). The `@supports not (backdrop-filter: blur(1px))` opaque fallback is RETAINED so SC 1.4.3 (4.5:1) holds, and the zero-third-party / no-inline-`<style>` invariant (NFR6/NFR7) is preserved. AA contrast stays the fill alpha, never the blur.

2. **Co-equal triplet invariant preserved (FR18).** The co-equal triplet `.score-panel__percentile` / `.score-panel__anchor` / `.score-panel__band` keeps `flex: 1 1 0` and identical `--font-size-600` typography (font-size, font-weight, font-family), the `.score-panel__metric-label { min-block-size: 2lh }` reservation is untouched, and `tools/lint-css-source-co-equal.mjs` passes with NO diff. The FR18 co-equal Percentile/IQ-scale/Range bbox-area parity (the Epic-3 score-panel invariant) is preserved across 320–1440px. No triplet typography is touched.

3. **PR-5 reveal centering + PR-13 disclaimer survive (PR-25).** The revealed `.result-scene` still `justify-content: center`s its column (no top-hug) through the `band` → `interval` → `context` → `tail-scene` → `methodology-handoff` reveal stages, the `.score-panel__explainer` disclaimer still renders as a collapsed native `<details>` with only its first sentence visible and `.disclaimer__summary:focus-visible` outlined, and the frozen Epic 11/13 DOM contracts (`section.result-scene`, `#score-panel-heading`, the `.score-panel__triplet` markup) are unchanged (restyle-only; no `result.js` JS/markup edit). The global `prefers-reduced-motion` durations-zeroing block in `base.css` continues to govern any Aurora transition on this surface (WCAG 2.2 AA).

4. **Saved-result detail reuses the live Aurora glass (PR-25).** The saved-result detail view (rendered by `saved-results.js` under `data-reveal-stage="methodology-handoff"` / `data-saved-result-view`) reuses the SAME `.score-panel` + `.score-panel__triplet` as the live result, so it picks up the same Aurora glass score-panel with its own co-equal triplet intact, and `.saved-result-detail .score-panel { margin-inline: auto }` keeps it centered. The detail view does NOT bespoke-restyle the score-panel fill (the single `.score-panel` rule in `score-panel.css` is the source — the two result surfaces never diverge), and the saved-detail triplet stays a co-equal Percentile/IQ-scale/Range set with no per-member typography divergence (FR18 preserved on the saved surface too).

5. **Saved-results list rows + controls on Aurora glass, local-only (PR-25 / PR-14 / NFR6).** The saved-results list rows (`.saved-results__item`) and the unfinished-test resume rows (`.saved-results__ip-item`) are repointed from the flat opaque `--color-surface-elevated` to the Aurora `--surface-glass` fill + `backdrop-filter: blur(var(--surface-glass-blur))` + `--surface-glass-edge`, with an `@supports not (backdrop-filter: blur(1px))` opaque fallback dropping them to `--surface-glass-strong` for AA. Every interactive control (`.saved-results__actions button`, `.saved-results__open`, `.saved-results__back`, `.saved-results__resume`, `.saved-results__delete-ip`) retains a token-only `:focus-visible` outline. List rendering, opening a saved result, delete-selected, and delete-all keep functioning client-side only with no network request — `save-result.js` continues to read/write key-scoped `window.localStorage` and no fetch/XHR/sendBeacon is introduced — so the local-only / no-telemetry invariant (NFR6) is preserved (restyle adds CSS only, changes no storage or fetch behavior). Components consume ONLY semantic roles (no `--glass-*`/`--color-neutral-*` primitive, no literal hex/px added — two-layer rule).

6. **Print stays light/opaque (PR-25) + Node guard runs locally; rendered verification deferred to 14.11.** `print.css` is UNTOUCHED — the printed view still drops the Aurora backdrop and glass, keeps the co-equal triplet + difficulty band + forced-open disclaimer at the 42rem reading measure, and the byte-stable double-build diff stays clean (NFR21). A node guard (`tests/scaffold/14-8-aurora-results.test.mjs`) RUNS in `make test` and asserts: (a) the result card's strong-glass fill + semantic blur + lit edge + retained `@supports`-not fallback; (b) the saved-results rows on Aurora glass + `@supports`-not fallback; (c) the saved-detail reuse-not-redefine; (d) the FR18 co-equal triplet + `2lh` reservation; (e) PR-5 centering + PR-13 disclaimer; (f) every saved-results control's `:focus-visible`; (g) the frozen Epic 11/13 DOM contracts in `result.js`/`saved-results.js`; (h) the NFR6 local-only path in `save-result.js`; (i) two-layer cleanliness on both restyled CSS files. A DORMANT result + saved-result-detail leg (Light + Dark) is added to `tests/playwright/aurora-visual-regression.spec.mjs` (the parent `visual-regression` job stays `if: false`; Story 14.11 flips it on and commits baselines on `ubuntu-latest` — the authoring host is darwin). The `css-components-lines` budget (≤2600) is preserved.

**Requirements covered:** PR-25
**Depends on:** 14.2

## Tasks / Subtasks

- [x] **Task 1: Lit-edge refinement on the result card (AC: 1)**
  - [x] Add the inset lit-edge highlight (`inset 0 1px 0 var(--surface-glass-edge)`, matching `.aurora-surface`) to the `.score-panel` `box-shadow` so the result card reads as raised glass "lit from within"; keep the existing `--surface-glass-strong` fill + `--surface-glass-blur` blur + `--surface-glass-edge` border + the retained `@supports not (backdrop-filter)` opaque AA fallback (semantic roles only)

- [x] **Task 2: Saved-results list rows on Aurora glass (AC: 5)**
  - [x] Repoint `.saved-results__item` + `.saved-results__ip-item` from `--color-surface-elevated` to the Aurora `--surface-glass` fill + `backdrop-filter: blur(var(--surface-glass-blur))` + `--surface-glass-edge` hairline (semantic roles only)
  - [x] Add an `@supports not (backdrop-filter: blur(1px))` opaque fallback dropping both row types to `--surface-glass-strong` for AA where the blur is unavailable
  - [x] Confirm every interactive control keeps its token-only `:focus-visible` outline (unchanged) and the saved-detail `.score-panel` stays centered (`margin-inline: auto`) reusing the live glass (no fill redefinition)

- [x] **Task 3: Aurora results + saved-results node guard (AC: 6)**
  - [x] Author `tests/scaffold/14-8-aurora-results.test.mjs` — result-card glass + lit edge + retained `@supports` fallback; saved-rows glass + `@supports` fallback; saved-detail reuse-not-redefine; FR18 co-equal triplet + `2lh`; PR-5 centering + PR-13 disclaimer; every saved control `:focus-visible`; frozen Epic 11/13 DOM contracts (`result.js`/`saved-results.js`); NFR6 local-only path (`save-result.js`); two-layer cleanliness on both CSS files

- [x] **Task 4: Dormant result + saved-detail Playwright leg (AC: 6)**
  - [x] Add a Light + Dark result-card + saved-result-detail leg to `tests/playwright/aurora-visual-regression.spec.mjs`; the parent `visual-regression` job stays `if: false` until 14.11 — no pixel baselines committed here

- [x] **Task 5: Verify budgets + suite (AC: 6)**
  - [x] `node --test tests/scaffold/14-8-aurora-results.test.mjs` green; `node tools/lint-css-source-co-equal.mjs` passes with no diff; full scaffold suite = the 14 pre-existing 9-series reds only (zero new); `make lint` exit 0; `css-components-lines` ≤ 2600; `result.js`/`saved-results.js`/`save-result.js`/`print.css` byte-identical

## Dev Notes

### Implementation strategy
- **score-panel.css was already 90% there.** Story 14.2 retuned `--surface-glass*` to read as raised glass over the deep-navy backdrop, and `score-panel.css` already consumed `--surface-glass-strong` + `blur(var(--surface-glass-blur))` + `--surface-glass-edge` + `--surface-glass-shadow` + the `@supports not (backdrop-filter)` fallback. The ONLY change to the result card is the surgical lit-edge refinement: add `inset 0 1px 0 var(--surface-glass-edge)` to the `box-shadow` so it reads consistently with the `.aurora-surface` primitive (which carries the same inset highlight). No fill, blur, border, or triplet typography touched — the FR18 co-equal lint stays no-diff because the triplet rule was not edited.
- **The real work was the saved-results list rows.** `.saved-results__item` and `.saved-results__ip-item` were the only surfaces in either file still on the flat opaque `--color-surface-elevated` elevation (the Epic 13 chrome). They are repointed to the Aurora `--surface-glass` fill (the muted role, consistent with the working-area surfaces) + the semantic blur + the lit edge, with a single shared `@supports not (backdrop-filter)` fallback to `--surface-glass-strong`. AA contrast is the fill alpha, never the blur — the Epic 13 invisible-redesign lesson.
- **The saved-result detail needs NO bespoke CSS for the glass.** `saved-results.js` already renders the detail with `<section class="score-panel">`, so it inherits the single `.score-panel` rule from `score-panel.css` (including the new lit edge) for free; `saved-results.css` only centers it (`margin-inline: auto`, already present). The guard asserts the detail does NOT redefine `background-color` on `.saved-result-detail .score-panel` so the live + saved result surfaces can never diverge.
- **No JS / markup / print touched.** This is a restyle-only token/value swap. `result.js`, `saved-results.js`, `save-result.js`, and `print.css` are byte-identical; the frozen Epic 11/13 DOM contracts and the NFR6 local-only localStorage path are unchanged. No EN string touched → no NFR27 PL/RU cascade.

### Verification
- `node --test tests/scaffold/14-8-aurora-results.test.mjs` → green (15 tests).
- `node tools/lint-css-source-co-equal.mjs` → ok, NO diff (the triplet rule was untouched).
- Full scaffold suite (`tests/scaffold/**/*.test.mjs`) → 707 tests, 693 pass / 14 fail; the 14 fails are ALL the pre-existing 9-series human-gated guards (ICAR-CONFIRMATION.pdf / PL translator sign-off / CODEOWNERS @TBD / PL methodology reviewer fields) — zero new failures attributable to this story (+15 = this story's new guard).
- `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` 2336/2600 (was 2313; +23 for the score-panel lit-edge + the saved-results glass repoint + the shared `@supports` fallback block).
- `make lint` → exits 0.
- `git status` shows ONLY: `src/css/components/score-panel.css`, `src/css/components/saved-results.css`, `tests/playwright/aurora-visual-regression.spec.mjs` (modified) + `tests/scaffold/14-8-aurora-results.test.mjs` (new) + this spec. `result.js`, `saved-results.js`, `save-result.js`, `print.css` are NOT in the diff.

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): every new story spec must carry this section. Apply: present on 14.8; the `make lint` carry-forward gate (`lint-spec-carry-forward`) depends on the case-sensitive `### Carry-forward lessons` heading with non-empty content.
- lesson-2026-06-03-002 (severity=high): back any "pre-existing red" claim with a baseline. Apply: the baseline scaffold suite before this story was 692 tests / 678 pass / 14 fail; after it is 707 / 693 / 14 — the SAME 14 fails (the 9-series human-gated guards asserting real human deliverables this restyle does not touch), +15 net all from this story's new guard, zero regressions.
- AA contrast is the fill alpha, never the blur (Epic 13 invisible-redesign lesson). Apply: the saved-result rows take the `--surface-glass` fill + an `@supports not (backdrop-filter)` opaque fallback to `--surface-glass-strong`, so they stay AA-legible whether or not the browser composites the blur; the lit-edge highlight is decorative and never the contrast layer.
- Prefer a token/value swap over new geometry (PR-25 surgical restyle). Apply: the result card needed only a one-line `box-shadow` lit-edge addition (score-panel.css was already on the glass roles after 14.2); the only structural change was repointing two saved-row fills from `--color-surface-elevated` to `--surface-glass` + adding one shared `@supports` block — no layout, no markup, no JS.
- Reuse the single source surface, never redefine it on the secondary surface (FR18 / divergence trap). Apply: the saved-result detail inherits the one `.score-panel` rule from score-panel.css (so the live + saved glass can't drift); the guard forbids a `background-color` redefinition on `.saved-result-detail .score-panel`, and the co-equal triplet rule is never touched so `lint-css-source-co-equal.mjs` stays no-diff.
- Epic-14 verification is RENDERED, deferred to 14.11 (structural source-text guards alone missed the Epic 13 invisible redesign). Apply: this story ships the node source-text guard for `make test`; the rendered perceptible-glass + co-equal bbox-parity comparison (result card + saved-detail, light + dark) is the dormant Playwright leg whose baselines 14.11 commits on ubuntu-latest, never on the darwin authoring host.

## Dev Agent Record

### File List
- `src/css/components/score-panel.css` (Aurora result card: added the inset lit-edge highlight `inset 0 1px 0 var(--surface-glass-edge)` to the `.score-panel` `box-shadow` so the card reads as raised glass "lit from within" — consistent with the `.aurora-surface` primitive; the `--surface-glass-strong` fill + `--surface-glass-blur` blur + `--surface-glass-edge` border + the retained `@supports not (backdrop-filter)` opaque AA fallback are unchanged; the co-equal triplet typography + `2lh` reservation are untouched so the co-equal source lint stays no-diff)
- `src/css/components/saved-results.css` (saved-results rows on Aurora glass: repointed `.saved-results__item` + `.saved-results__ip-item` from `--color-surface-elevated` to the `--surface-glass` fill + `backdrop-filter: blur(var(--surface-glass-blur))` + `--surface-glass-edge` hairline; added a shared `@supports not (backdrop-filter)` opaque fallback to `--surface-glass-strong` for AA; the interactive controls' `:focus-visible` outlines and the centered `.saved-result-detail .score-panel { margin-inline: auto }` reuse are unchanged; two-layer clean, no literal hex/px)
- `tests/scaffold/14-8-aurora-results.test.mjs` (new — node guard: result-card strong-glass fill + semantic blur + lit edge + retained `@supports` fallback; saved-rows Aurora glass + `@supports` fallback; saved-detail reuse-not-redefine; FR18 co-equal triplet + `2lh`; PR-5 centering + PR-13 disclaimer; every saved control `:focus-visible`; frozen Epic 11/13 DOM contracts in result.js/saved-results.js; NFR6 local-only path in save-result.js; two-layer cleanliness on both restyled CSS files)
- `tests/playwright/aurora-visual-regression.spec.mjs` (added a DORMANT Light + Dark result-card + saved-result-detail leg; the parent `visual-regression` job stays `if: false` until Story 14.11 — no pixel baselines committed here)
- `_bmad-output/implementation-artifacts/stories/14-8-aurora-results-and-saved-results-surfaces.md` (this spec)
