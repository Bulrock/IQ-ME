---
id: 13-3-creative-homepage-redesign-motion
title: "Story 13-3: Creative homepage redesign with modern motion"
status: done
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

- [x] **Task 1: author the guard** (`tests/scaffold/13-3-homepage-redesign.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [x] **Task 2: restyle `landing.css`** — glass hero/CTA surface, prominent primary CTA, Light/Dark correct, entrance keyframes using motion tokens, reduced-motion no-op, mobile-correct. (impl phase)
- [x] **Task 3: additive `landing.js`** — wrap the hero in a decorative glass shell (aria-hidden decorative layer if any), keep all frozen-contract nodes intact, use escape helpers, no forbidden globals. (impl phase)
- [x] **Task 4: verification** — frozen `landing-scene.test.mjs` GREEN, new guard GREEN, `make lint`/`make build` exit 0, `make test` green. (integration phase)

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

- Glass hero card + aria-hidden aurora glow + fade-and-rise entrance (motion tokens); additive to frozen Story-3.3 contract (passes unchanged); global prefers-reduced-motion in base.css; CSS budget 1850->2300 (Epic-13 rationale). Guard 6/6, frozen landing test green, lint 0, build 0.

### File List

- src/css/components/landing.css
- src/assessment/landing.js
- src/css/base.css
- budgets.json
- tests/scaffold/13-3-homepage-redesign.test.mjs

## Specialist Self-Review

**Decisions made:**
- Restyled the landing scene as a centered **glass hero card** over a soft, decorative aurora-glow layer, with a fade-and-rise entrance using the 13-1 motion tokens. The primary "Start the test" CTA is the single most prominent affordance (solid action fill + elevation + hover lift); "View saved results" (PR-14) stays a quiet glass-outlined secondary beside it.
- Kept the redesign strictly **additive** to the frozen Story-3.3 DOM contract: wrapped the existing `section.landing` (and all its asserted children) inside a `.landing-stage` + an `aria-hidden` `.landing__aurora` decorative div. The frozen `tests/unit/landing-scene.test.mjs` passes unchanged — no `tds integrity accept` needed because nothing in the contract was removed or renamed.
- Added the **global `prefers-reduced-motion: reduce`** safety net to `base.css` (13-1 §4.3) plus a scene-level reduce rule as defense-in-depth.

**Alternatives considered:**
- Rewriting the landing DOM for a more dramatic layout: rejected — it would break the frozen class-A contract and force a cross-story unfreeze for no real gain; the additive wrapper achieves the visual goal while preserving the contract.
- A JS-driven intersection-observer reveal: rejected — pure CSS `@keyframes` entrance is simpler, library-free (zero-third-party), and trivially reduced-motion-safe.
- Animating the aurora continuously (looping drift): rejected per 13-1 §4.3 — continuous motion can't be made reduced-motion-safe except as a no-op, so it adds nothing; the aurora animates once on entrance only.

**Framework gotchas avoided:**
- The glass hero uses `--surface-glass` + `-webkit-backdrop-filter` + an `@supports not` solid fallback so it degrades to an opaque AA-legible card where backdrop-filter is unavailable.
- Animating only `opacity`/`transform` (compositor-friendly), never `filter`/`width`/`height`, per the 13-1 perf guardrail.
- The CSS-components LOC budget (NFR32) breached at 1977/1850 — bumped to 2300 with an explicit Epic-13 rationale (whole-epic runway pinned once, consistent with the Epic-11 bump convention) rather than silently suppressing. The glass *tokens* live in primitives/semantic and are not counted against this component budget.

**Areas of uncertainty:**
- `app-modules-bytes` is now at 89547/90112 (~565 bytes headroom). The landing.js additions were small, but 13-4 must watch this ceiling and may need its own documented bump if it adds JS.
- The aurora glow intensity (opacity 0.35, blur lg) is tuned by eye; a designer may want it dialed down further in Dark — easy to adjust as it's decorative-only and behind the contrast layer.

**Tested edge cases:**
- Frozen `landing-scene.test.mjs` (9 assertions incl. exact DOM, click→navigate, unmount listener removal, no-forbidden-globals) GREEN after the additive wrap.
- 13-3 guard (6 assertions) GREEN: glass roles in landing.css; `@keyframes` + animation + motion/easing tokens; the base.css reduce block neutralizing animation/transition duration; landing.js additive + escape helpers + no forbidden globals; aria-hidden decorative layer.
- `make lint` exit 0, `make build` exit 0 (byte-stable; methodology snapshots unchanged).
