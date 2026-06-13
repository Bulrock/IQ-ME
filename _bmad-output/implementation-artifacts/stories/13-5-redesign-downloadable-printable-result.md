---
id: 13-5-redesign-downloadable-printable-result
title: "Story 13-5: Redesign the downloadable / printable result document"
status: in-progress
---

# Story 13-5: Redesign the downloadable / printable result document

## Story

As a user who downloads or prints their result (PR-17),
I want a clean, well-designed result document,
so that the saved/printed output looks intentional and legible rather than poor.

## Epic context

Redesigns the `@media print` view of `/#/result` (`src/css/print.css`, with the print-only masthead emitted by `src/assessment/result.js`). The glassmorphism-era *identity* is expressed **print-legibly** — print is ink-economical, high-contrast on white, with NO glass/blur/translucency (those don't print) and a clear typographic document layout. Hard invariants (preserved): the co-equal percentile/IQ-scale/range triplet, the band-by-difficulty line, the date, the not-a-certificate/not-a-clinical-assessment disclaimer; no interactive-only chrome (nav, toggles, buttons) leaks into print; renders across EN/RU/PL.

## Acceptance Criteria

**Given** the current print/export view looks poor (PR-17) (`print.css` / `result.js`),
**When** the result is printed or exported to PDF,
**Then** the document has an intentional layout — clear typographic hierarchy, balanced spacing, the co-equal triplet, the band-by-difficulty line, the date, and the not-a-certificate disclaimer — consistent with the glassmorphism-era identity but print-legible (ink-economical, high-contrast on white, no clipped content).
1. `print.css` `@media print` defines an intentional document layout: a print masthead (title + date) with clear typographic hierarchy, balanced spacing on white, the score triplet centered/co-equal, the difficulty sentence shown, the disclaimer/caveat printed in full (expanded, not collapsed), and a tidy print footer/identity line. No literal-glass artifacts (blur/translucency) are used in print — print forces `color-scheme: light`, white background, dark ink.
2. The co-equal triplet invariant is preserved in print: `.score-panel__anchor`, `.score-panel__percentile`, `.score-panel__band` remain visually co-equal (same print color/weight treatment; the existing `.score-panel__triplet` flex layout is not broken by print rules).
3. Interactive-only chrome does NOT leak into print: `.chrome-header`, `.chrome-footer`, `.result-print-btn`, `.score-panel__save-button`, `.score-panel__retest-note`, the reveal-stage buttons (`.rs-show`/`.rs-not`), and the tail scene are `display: none` in print. The disclaimer body (`<details>`) is forced open/visible in print (an expand/collapse toggle is meaningless on paper).
4. The difficulty sentence (`.score-panel__difficulty-sentence`, reveal-gated on screen) is forced visible in print, as today, and reads legibly.
5. The print document renders correctly across EN/RU/PL (no clipped content from the longer locales) — the layout uses wrapping/measure-constrained typography, not fixed widths that clip RU/PL.
6. A `tests/scaffold/` guard asserts AC 1–4 structurally over `print.css`: the print masthead is styled, the triplet stays co-equal in print, the listed interactive chrome is hidden, the disclaimer body + difficulty sentence are forced visible, and print forces white/dark-ink (no glass tokens / no blur in the print block). RED before impl, GREEN after.
7. `make lint` exit 0, `make build` exit 0, `make test` green (modulo pre-existing 9-series reds). Zero third-party; byte-stable preserved (print.css is not part of the tokens hash or methodology snapshots).

## Tasks / Subtasks

- [ ] **Task 1: author the guard** (`tests/scaffold/13-5-print-result.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [ ] **Task 2: redesign `print.css`** — intentional document layout: print masthead hierarchy, co-equal triplet, expanded disclaimer + difficulty line, tidy footer, white/dark-ink, no glass/blur, RU/PL-safe wrapping. (impl phase)
- [ ] **Task 3: ensure the disclaimer `<details>` body prints open** (CSS `details[open]`-agnostic: force the summary + body visible in print) and any print-only identity line is emitted/styled. (impl phase)
- [ ] **Task 4: verification** — guard GREEN, `make lint`/`make build` exit 0, `make test` green; confirm no screen behavior changed (only `@media print` + the quiet screen button rule). (integration phase)

## Dev Notes

- Print is the ONE place glass is intentionally dropped: blur/translucency don't print and waste ink. Print forces `color-scheme: light`, white bg, dark ink (already partially in place) — extend it into an intentional *document*, not just a de-styled screen.
- The disclaimer is a `<details>` (PR-13 collapse on screen). In print, force the summary + body visible (e.g. `.disclaimer[open]` is not guaranteed; target the summary and the body content with `display:block`/`visibility`), so the full not-a-certificate text prints.
- Preserve the co-equal triplet: do NOT give the three spans different print colors/sizes. They already share typography; just ensure print color is uniform dark ink.
- RU/PL: the title and disclaimer strings are longer; use `max-width` measure + wrapping, never fixed px widths that clip.
- print.css is NOT part of the tokens hash (only primitives+semantic are) and NOT part of methodology snapshots — so editing it does not require `make snapshot-update` and does not affect byte-stable build.

### Carry-forward lessons

- cross-story frozen-test UX replacement (project memory): print.css has no frozen computed-style test; the redesign is free to restructure the `@media print` block as long as the AC invariants (triplet, disclaimer, no-chrome-leak) hold.
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`. Apply: the new guard runs via `make test`.

### Project Structure Notes

- Modified: `src/css/print.css`. Possibly minimal `src/assessment/result.js` (only if a print-only identity line element is needed — prefer pure CSS).
- New: `tests/scaffold/13-5-print-result.test.mjs`.
- No tokens-hash change, no methodology snapshot change, no frozen-test edit.

### References

- [Source: _bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md §9 (13-5: glass identity expressed print-legibly)]
- [Source: src/css/print.css] (current print block to redesign)
- [Source: src/assessment/result.js] (PRINT_HEAD / score-panel / disclaimer structure)

## Dev Agent Record

### Agent Model Used

frontend (print/CSS; React/Vue-agnostic)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
