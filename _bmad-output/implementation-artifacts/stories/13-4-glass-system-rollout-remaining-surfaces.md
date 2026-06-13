---
id: 13-4-glass-system-rollout-remaining-surfaces
title: "Story 13-4: Roll out the glass system across remaining surfaces"
status: in-progress
---

# Story 13-4: Roll out the glass system across remaining surfaces

## Story

As a user moving through the app (PR-16),
I want the test runner, result page, methodology pages, and header/footer controls to share the new cohesive look,
so that the experience feels like one designed product end-to-end.

## Epic context

Applies the glass design system (Story 13-2) to the remaining surfaces, using only the theme-aware semantic glass roles so Light/Dark stay correct (PR-9). **Hard constraint:** must not regress the Epic-11 fixes — mobile test layout (PR-2), result vertical centering (PR-5), methodology sidebar/anchors (PR-11), disclaimer collapse (PR-13), theme toggle (PR-6), language dropdown (PR-7). The restyle is **surgical**: glass-ify surface *containers* (panels/cards/chrome bars) without changing the layout structure those fixes depend on. All NFRs (zero third-party, WCAG 2.2 AA, byte-stable) survive.

## Acceptance Criteria

**Given** the glass system (13-2) and the completed Epic-11 fixes,
**When** the remaining surfaces are restyled,
**Then** the test runner, result/score panel, methodology pages, and the header/footer (incl. theme/language controls PR-6/PR-7) adopt the glass look without regressing the Epic-11 fixes, and all surfaces remain WCAG 2.2 AA, zero third-party, byte-stable, and theme-correct.
1. The chrome header and footer adopt glass: their container background uses the `--surface-glass*` roles + blur + glass edge (replacing the flat `--color-surface-elevated` fill), staying theme-correct in Light/Dark. The header still hides on `#/test` (UX-DR8); the theme toggle (PR-6) and language dropdown (PR-7) keep their behavior/position/a11y.
2. The score/result panel adopts a glass card surface using `--surface-glass-strong` (body-text surface → strong fill for AA), without changing the PR-5 vertical-centering layout or the co-equal percentile/IQ/range triplet structure (the frozen co-equal-triplet computed-style invariant must be preservable), and without breaking the PR-13 disclaimer collapse.
3. The methodology page surfaces (masthead/sidebar/content) adopt glass consistent with PR-11 (sidebar + in-page anchors) and honor the theme (PR-9) — the methodology page must not stay dark under Light. Glass uses the strong fill behind long-form body text.
4. The restyle introduces NO literal hex/px colors in component CSS (semantic/glass roles only), keeps the `index.html` link order alphabetical, and adds no third-party asset. The CSS-components LOC budget stays within the Epic-13 ceiling (2300) or is bumped with rationale if exceeded.
5. The Epic-11 unit/scaffold contracts that run under `make test` stay green (e.g. saved-results, item-runner-bail, consent-scene, score-panel-related unit tests). The Playwright PR-2/5/9/11/13 specs (release-gated, not in `make test`) are noted for re-verification at the release boundary; no change here is expected to regress them by construction (container-only restyle).
6. A `tests/scaffold/` guard asserts AC 1–4 structurally: chrome header/footer reference the glass roles; score-panel references the strong glass role; methodology chrome references the glass roles; no literal hex added to the touched component files; index.html link order alphabetical. RED before impl, GREEN after.
7. `make lint` exit 0, `make build` exit 0, `make test` green (modulo pre-existing 9-series reds).

## Tasks / Subtasks

- [ ] **Task 1: author the guard** (`tests/scaffold/13-4-glass-rollout.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [ ] **Task 2: glass-ify chrome** — header + footer container surfaces use the glass roles; preserve hide-on-test, toggle/dropdown behavior. (impl phase)
- [ ] **Task 3: glass-ify the score/result panel** — strong glass card; preserve PR-5 centering + co-equal triplet + PR-13 collapse. (impl phase)
- [ ] **Task 4: glass-ify methodology chrome** — masthead/sidebar/content surfaces; preserve PR-11 sidebar + PR-9 theme honoring. (impl phase)
- [ ] **Task 5: verification** — guard GREEN, `make lint`/`make build` exit 0, `make test` green; budget within ceiling; confirm no layout-structure change to the Epic-11 surfaces. (integration phase)

## Dev Notes

- Surgical: glass-ify *surface containers* (the panel/card/bar backgrounds), not the layout. The PR-2/5/11/13 layout rules (flex/grid/sticky/centering) are untouched.
- Use `--surface-glass-strong` for body-text surfaces (score panel, methodology content) per 13-1 §5 so SC 1.4.3 holds; `--surface-glass` for chrome bars (short text).
- The chrome-components Playwright spec checks the `--color-surface-base` token swap + visibility, NOT the chrome bar's literal computed bg — so a glass `rgba()` fill on the bar is safe.
- Methodology chrome lives in `src/css/components/masthead.css` and the methodology-chrome CSS; confirm the page already honors theme post-Epic-11 (PR-9) and only restyle the surface fills.
- Do NOT edit any frozen class-A test. If a glass change would force a computed-style assertion change, stop and reconsider (container-only restyle should never need it).

### Carry-forward lessons

- cross-story frozen-test UX replacement (project memory): preserve the Epic-11 layouts; this is additive restyle, no `tds integrity accept` needed.
- Corpus-edit parity cascade (project memory): touch NO methodology corpus *body* (only CSS chrome); NFR27 does not fire. (If a `.md` body were edited, parity cascade applies — avoid it.)
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`; Playwright specs are release-gated. Apply: verify via unit/scaffold + lint + build; note Playwright PR-specs for the release gate honestly.

### Project Structure Notes

- Modified: `src/css/components/chrome-header.css`, `chrome-footer.css`, `score-panel.css`, `masthead.css` (+ methodology-chrome CSS if separate). Possibly `budgets.json` (if LOC ceiling exceeded).
- New: `tests/scaffold/13-4-glass-rollout.test.mjs`.
- No `src/scoring/`, no methodology `.md` corpus body, no frozen-test edits.

### References

- [Source: _bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md §5 a11y, §8 Epic-11 surfaces]
- [Source: src/css/components/glass-surface.css] (the primitive + roles to apply)
- [Source: tests/playwright/chrome-components.spec.mjs] (token-swap assertion; container bg not pinned)

## Dev Agent Record

### Agent Model Used

frontend (vanilla CSS surface restyle; React/Vue-agnostic)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
