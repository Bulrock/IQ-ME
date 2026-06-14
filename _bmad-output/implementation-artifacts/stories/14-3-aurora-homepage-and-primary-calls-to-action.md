---
id: 14-3-aurora-homepage-and-primary-calls-to-action
title: "Story 14.3: Aurora homepage and primary calls-to-action"
status: done
---

# Story 14.3: Aurora homepage and primary calls-to-action

## Story

As a **first-time visitor landing on the IQ-ME homepage**,
I want **the hero card and its calls-to-action to read as a deliberate, layered glass surface floating over the deep-navy spatial backdrop**,
so that **the depth and blur introduced in Epic 14 are perceptible at the first impression without altering the sober, anti-marketing copy or the keyboard/affordance behaviour I rely on**.

## Acceptance Criteria

1. **Perceptible layered hero (PR-20).** The `section.landing` hero, declared at `landing.css:46` and consuming only the semantic glass roles (`--surface-glass`, `--surface-glass-blur`, `--surface-glass-edge`, `--surface-glass-shadow`), reads as a raised glass panel over the Story-14.2 deep-navy backdrop. Its `backdrop-filter: blur(var(--surface-glass-blur))` and `box-shadow: var(--surface-glass-shadow)` produce visible separation between card and background (the Epic 13 same-colour failure stays resolved). A "lit-from-within" inset top edge (matching the reusable `.aurora-surface` primitive) is added via the hairline border-width token so the panel reads as deliberately elevated.

2. **Token-only, two-layer clean (PR-20).** No literal hex / px / font-family is added to `landing.css`; it continues to consume semantic tokens only. The decorative `.landing__aurora` glow is migrated off the `--glass-tint` *primitive* to the semantic Aurora roles `--aurora-glow-accent` + `--backdrop-aurora-2`, so the homepage decoration uses the same blue→violet Aurora identity as the page backdrop and the two-layer rule (UX-DR1) holds for the glow. (Grandfathered `--glass-blur-*` radii are left as-is — no semantic blur role exists yet; that is token-foundation scope.)

3. **Frozen DOM contract preserved (PR-20).** `landing.js` markup, element ids/classes, the conditional `#view-saved-btn` render, and the `a.landing__methodology-link[href="/methodology/v0.1.0/en/"]` are left byte-identical. The change is restyle-only; the frozen Story-3.3 / Epic-11 / Epic-13 DOM contract and the existing Playwright contract assertions (`pr14-saved-results`) keep passing.

4. **CTA hierarchy + AA contrast (PR-20).** The primary `.landing__start-btn` keeps its dominant solid action treatment (`--color-action-bg` / `--color-action-text`) and elevated shadow; the secondary `.landing__saved-btn` stays a quiet glass-outline affordance; the methodology link stays an underlined tertiary affordance. The `:focus-visible` ring (`var(--space-1) solid var(--color-focus-ring)`, `outline-offset: var(--space-1)`) clears WCAG 2.2 AA against the new backdrop and glass fill. Single-most-prominent-affordance hierarchy preserved; no marketing language added.

5. **Reduced-motion + responsive intact (PR-20).** The scene-level `@media (prefers-reduced-motion: reduce)` block keeps zeroing `.landing` / `.landing__aurora` animation and CTA transitions; the global `base.css` neutralizer is unchanged. The mobile `@media (max-width: 30rem)` down-scale keeps `#start-test-btn`, `#view-saved-btn`, and `.landing__methodology-link` within the viewport (no horizontal overflow). Motion is opt-out-respecting at two layers; local-only invariant (zero telemetry) holds.

6. **Budget + byte-stable (PR-20).** The `css-components-lines` budget (limit 2300) is not exceeded (this story is value-change-only, net ≈0 lines). Deterministic byte-stable build (NFR21) unaffected; zero inline `<style>` / zero third-party (NFR6/NFR7 CSP); alphabetical CSS `<link>` chain preserved. The rendered visual-regression baselines for the landing scene are committed centrally by Story 14.11 on `ubuntu-latest` (this story ships the source-text acceptance guard).

**Requirements covered:** PR-20
**Depends on:** 14.2

## Tasks / Subtasks

- [x] **Task 1: Migrate the decorative glow to semantic Aurora roles (AC: 2)**
  - [x] Replace `var(--glass-tint)` in `.landing__aurora` with `var(--aurora-glow-accent)`
  - [x] Replace the second radial stop (`var(--color-option-hover-accent)`) with `var(--backdrop-aurora-2)` for the blue→violet Aurora identity
- [x] **Task 2: Lit-from-within hero edge (AC: 1)**
  - [x] Extend `.landing` `box-shadow` with `inset 0 var(--border-width-hairline) 0 var(--surface-glass-edge)` (no px literal), matching `.aurora-surface`
- [x] **Task 3: Verify preservation (AC: 3, 4, 5)**
  - [x] Confirm `landing.js` untouched (frozen DOM); CTA hierarchy + focus rings unchanged; reduced-motion + 30rem blocks intact
- [x] **Task 4: Acceptance guard + budget (AC: 6)**
  - [x] Author `tests/scaffold/14-3-aurora-homepage.test.mjs` (source-text guard); confirm `css-components-lines` ≤ 2300 and node suite green (modulo pre-existing 9-series + integrity drifts)

## Dev Notes

### Implementation strategy
- Story 14.2 already retuned `--surface-glass*` so a panel reads as raised over the navy `--backdrop-base`; `landing.css` consumes those roles unchanged, so the hero's perceptibility is delivered by token VALUES — 14.3 is a thin refinement, not a re-architecture.
- Two-layer fix is scoped to the glow tint/color (clean semantic replacements exist). `--glass-blur-lg` / `--glass-blur-sm` references stay (no semantic blur role; introducing one is token-foundation/14.2 scope and would touch `semantic.css`).
- The inset lit edge uses `--border-width-hairline` (the 1px hairline token) — NOT a literal `1px` — keeping the "no literal px added" guarantee.
- `landing.js` is byte-identical: no markup, id, class, href, or conditional-render change.

### Verification
- `node --test tests/scaffold/14-3-aurora-homepage.test.mjs` → green.
- `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` ≤ 2300.
- Pre-existing reds: the 9-series human-gated guards + the 2 pre-existing integrity drifts (`9e-1-tester-credibility`, `pr7-language-dropdown`) — NOT introduced by this story.

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): every new story spec must carry this section. Apply: present on 14.3; the `make lint` carry-forward gate (`lint-spec-carry-forward`) depends on it.
- lesson-2026-06-03-002 (severity=high): back any "pre-existing red" claim with a baseline `git diff`. Apply: the only Epic-14-attributable change here is `landing.css` value swaps + the new guard; the 9-series human-gated reds (ICAR PDF / PL translator) and the 2 known integrity drifts (`9e-1`, `pr7`) predate this story.
- UX-DR1 two-layer rule (component CSS consumes semantic roles, never `--glass-*`/`--color-neutral-*` primitives). Apply: `.landing__aurora` migrated off the `--glass-tint` primitive to the semantic `--aurora-glow-accent` + `--backdrop-aurora-2` roles; grandfathered `--glass-blur-*` radii left for a future token-foundation pass.

## Dev Agent Record

### File List
- `src/css/components/landing.css` (restyle: semantic Aurora glow roles + lit-from-within hero edge)
- `tests/scaffold/14-3-aurora-homepage.test.mjs` (new — acceptance guard)
- `_bmad-output/implementation-artifacts/stories/14-3-aurora-homepage-and-primary-calls-to-action.md` (this spec)
