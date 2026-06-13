---
id: 13-3-creative-homepage-redesign-motion
title: "Story 13-3: Creative homepage redesign with modern motion"
status: in-progress
---

# Story 13-3: Creative homepage redesign with modern motion

## Story

As a first-time visitor (PR-16),
I want a creative, modern homepage that feels current,
so that my first impression of IQ-ME is strong while staying honest and non-marketing in tone.

## Epic context

Applies the glass design system (Story 13-2) and the motion vocabulary (13-1 §4) to the landing scene (`src/assessment/landing.js` / `src/css/components/landing.css`). **Hard constraint:** the frozen Story-3.3 landing-scene contract (`tests/unit/landing-scene.test.mjs`, class-A) pins the exact DOM — `section.landing` › `h1#landing-heading` + `p.landing__paragraph` + `div.landing__cta-group` › `#start-test-btn` + `.landing__methodology-link`, plus the no-forbidden-globals source check. The redesign must **preserve every one of those** (additive DOM only) and keep "Start the test" + the PR-14 "View saved results" entry prominent. Motion respects `prefers-reduced-motion`; tone stays anti-marketing.

## Acceptance Criteria

**Given** the glass design system from Story 13-2 (`landing.js` / `landing.css`),
**When** the homepage is redesigned,
**Then** it applies the researched motion/visual trends, respects `prefers-reduced-motion`, keeps "Start the test" (and the PR-14 "View saved results" entry) prominent, and preserves the anti-marketing copy tone.
1. The landing scene adopts the glass look: the hero/CTA region uses the `.glass-surface` primitive (or the `--surface-glass-*` roles), reads correctly in Light and Dark, and the primary "Start the test" CTA remains the single most prominent affordance.
2. The redesign is **additive** to the frozen DOM: `section.landing`, `h1#landing-heading`, `p.landing__paragraph`, `div.landing__cta-group`, `#start-test-btn` (type=button), and `.landing__methodology-link` (href `/methodology/v0.1.0/en/`) all still exist with the same classes/IDs — decorative wrappers/layers may be added around/inside but must not remove or rename the asserted nodes. The existing `tests/unit/landing-scene.test.mjs` passes unchanged.
3. A modern entrance motion is applied (hero/CTA fade-and-rise using the 13-1 motion tokens `--motion-base`/`--motion-slow` + `--ease-standard`), implemented in CSS (no JS animation, no library). Under `@media (prefers-reduced-motion: reduce)` all entrance motion collapses to a no-op (content appears instantly, same order) — verified by the existing global reduce block (13-2) and a scene-level check.
4. No forbidden globals introduced in `landing.js` (no `localStorage`/`sessionStorage`/`navigator.share`/`role="alert"`/`Math.random`/`Date.now`/`console.log`/default export) — the frozen source check stays green. Any added DOM uses the existing `escapeText`/`escapeAttr` helpers.
5. Anti-marketing tone preserved: no superlatives/hype copy added; the existing honest intro string is unchanged (no new marketing strings). Decorative-only additions carry `aria-hidden="true"` and are not announced to screen readers.
6. A `tests/scaffold/` (or unit) guard asserts AC 1–5 structurally: landing.css references the glass roles + a reduced-motion-safe entrance; landing.js stays additive (asserted nodes present, no forbidden globals, decorative layers aria-hidden). RED before impl, GREEN after.
7. `make lint` exit 0, `make build` exit 0, `make test` green (modulo pre-existing 9-series reds). WCAG 2.2 AA, zero third-party, byte-stable preserved.

## Tasks / Subtasks

- [ ] **Task 1: author the guard** (`tests/scaffold/13-3-homepage-redesign.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [x] **Task 2: restyle `landing.css`** — glass hero/CTA surface, prominent primary CTA, Light/Dark correct, entrance keyframes using motion tokens, reduced-motion no-op, mobile-correct. (impl phase)
- [x] **Task 3: additive `landing.js`** — wrap the hero in a decorative glass shell (aria-hidden decorative layer if any), keep all frozen-contract nodes intact, use escape helpers, no forbidden globals. (impl phase)
- [ ] **Task 4: verification** — frozen `landing-scene.test.mjs` GREEN, new guard GREEN, `make lint`/`make build` exit 0, `make test` green. (integration phase)

## Dev Notes

- The frozen landing-scene test is class-A and from a done story — do NOT edit it. The redesign adapts to it (correct TDS direction). Descendant selectors (`.landing__cta-group #start-test-btn`) tolerate added nesting.
- Glass on the landing hero should use `--surface-glass` (not `--strong`) — the landing has short copy; the strong fill is for long body text. Verify Dark reads well.
- Motion: CSS `@keyframes` + `animation` on the hero/CTA with `--motion-slow`/`--ease-standard`. The global reduce block from 13-2 neutralizes `animation-duration`; add an explicit scene-level `@media (prefers-reduced-motion: reduce)` opacity:1/transform:none as defense-in-depth.
- Tone: do not add marketing copy. Visual polish only; the intro string stays the honest "one calibrated screen of one narrow ability" copy.

### Carry-forward lessons

- cross-story frozen-test UX replacement (project memory): when a redesign touches UI locked by a done story's frozen tests — here the play is *additive preservation*, not replacement: the frozen landing contract still holds, so no `tds integrity accept` is needed. Apply: keep all asserted nodes; only add decorative layers + restyle.
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`. Apply: new guard runs via `make test`.

### Project Structure Notes

- Modified: `src/css/components/landing.css`, `src/assessment/landing.js`.
- New: `tests/scaffold/13-3-homepage-redesign.test.mjs`.
- Unchanged: `tests/unit/landing-scene.test.mjs` (frozen contract), i18n strings (no new copy).

### References

- [Source: _bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md §4 motion, §9 handoff]
- [Source: tests/unit/landing-scene.test.mjs] (frozen DOM contract to preserve)
- [Source: src/css/components/glass-surface.css] (the primitive to apply)

## Dev Agent Record

### Agent Model Used

frontend (vanilla JS SPA scene + CSS; React/Vue-agnostic)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
