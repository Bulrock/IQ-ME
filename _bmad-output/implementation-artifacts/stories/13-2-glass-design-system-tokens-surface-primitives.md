---
id: 13-2-glass-design-system-tokens-surface-primitives
title: "Story 13-2: Glass design system — tokens + reusable glass surface primitives"
status: review
---

# Story 13-2: Glass design system — tokens + reusable glass surface primitives

## Story

As a developer applying the new look consistently (PR-16),
I want glass tokens and reusable glass-surface primitives in the design system,
so that every surface can adopt the look without bespoke CSS.

## Epic context

Implements the token vocabulary and the `.glass-surface` primitive pinned by Story 13-1's design direction (`_bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md`). Touches only the design-system layer: `src/css/primitives.css` (glass + motion primitives), `src/css/semantic.css` (glass + motion semantic roles), and a new BEM-scoped component stylesheet `src/css/components/glass-surface.css` for the reusable primitive class. This changes the committed tokens hash — the codified D→E `make snapshot-update` exception applies. No homepage/runner/result restyle here (those are 13-3 / 13-4 / 13-5).

## Acceptance Criteria

**Given** the direction from Story 13-1 (`primitives.css` / `semantic.css`),
**When** the design-system layer is implemented,
**Then** glass tokens and primitive classes exist, work in Light and Dark, and are documented for reuse.
1. `src/css/primitives.css` declares the glass primitives from 13-1 §2: a blur scale (`--glass-blur-sm` `6px`, `--glass-blur-md` `12px`, `--glass-blur-lg` `20px`), glass fills (`--glass-fill`, `--glass-fill-strong`) with light values and a tint (`--glass-tint`), and glass edge + shadow (`--glass-edge`, `--glass-shadow`), plus the motion primitives (`--motion-instant` `90ms`, `--motion-quick` `160ms`, `--motion-base` `260ms`, `--motion-slow` `420ms`, `--ease-standard`, `--ease-exit`).
2. `src/css/semantic.css` maps semantic glass roles (`--surface-glass`, `--surface-glass-strong`, `--surface-glass-blur`, `--surface-glass-edge`, `--surface-glass-shadow`) to the primitives, and declares **dark-mode overrides** for the glass fills/edge/shadow under BOTH `[data-theme="dark"]` and `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` — separately authored dark values (not auto-inverted), per UX-DR6.
3. A new component stylesheet `src/css/components/glass-surface.css` defines a reusable `.glass-surface` class (background = `--surface-glass`, `backdrop-filter`/`-webkit-backdrop-filter` = blur(`--surface-glass-blur`), hairline border = `--surface-glass-edge`, radius = `--radius-surface`, shadow = `--surface-glass-shadow`), a `.glass-surface--strong` modifier (uses `--surface-glass-strong`), and an `@supports not (backdrop-filter: blur(1px))` solid fallback so the surface stays a valid opaque panel where `backdrop-filter` is unavailable.
4. `src/index.html` links the new `glass-surface.css` in the component block in alphabetical order (lint-css-link-order green).
5. The tokens-contract snapshot is refreshed via `make snapshot-update` so `tests/contract/tokens.spec.mjs` and the design-system hash assertion pass (intentional D→E token change, not a contract violation). The existing primitive/semantic tokens are unchanged (only additions).
6. A `tests/scaffold/` guard asserts AC 1–4 structurally: the named glass + motion tokens exist in primitives, the semantic glass roles + dark overrides exist, the `.glass-surface` class + `--strong` modifier + `@supports` fallback exist, and `index.html` links `glass-surface.css` alphabetically. RED before impl, GREEN after.
7. `make lint` exit 0, `make build` exit 0, `make test` green (modulo the pre-existing 9-series human-gate reds). Zero third-party: glass is pure CSS, no external asset.

## Tasks / Subtasks

- [x] **Task 1: author the scaffold guard** (`tests/scaffold/13-2-glass-design-system.test.mjs`) encoding AC 6 — glass + motion primitives present; semantic glass roles + dark overrides present; `.glass-surface` + `--strong` + `@supports` fallback present; alphabetical `glass-surface.css` link in index.html. Confirm RED. (test-author phase)
- [x] **Task 2: add glass + motion primitives** to `src/css/primitives.css` per 13-1 §2.1–2.3 + §4.1–4.2. (impl phase)
- [x] **Task 3: add semantic glass roles + dark-mode overrides** to `src/css/semantic.css` per 13-1 §2.4 + §3. (impl phase)
- [x] **Task 4: add the `.glass-surface` component** (`src/css/components/glass-surface.css`) per 13-1 §2.5 + link it alphabetically in `src/index.html`. (impl phase)
- [x] **Task 5: refresh tokens snapshot** — `make snapshot-update` (D→E exception); verify tokens-spec + design-system hash green. (impl phase)
- [x] **Task 6: verification** — guard GREEN, `make lint`/`make build` exit 0, `make test` green; confirm only additions to primitives/semantic. (integration phase)

## Dev Notes

- Two-layer rule (UX-DR1): components reference only semantic roles; primitives carry pure values. The glass tokens follow this — `.glass-surface` consumes `--surface-glass-*`, never the `--glass-*` primitives directly.
- Dark glass is separately authored (UX-DR6), not filter-inverted. Light fill `rgba(255,255,255,0.72/0.85)`; dark fill `rgba(19,24,32,0.72/0.86)` (derived from `--color-neutral-900` `#131820`).
- The contrast guarantee is the ≥0.72 fill alpha + the `@supports not` solid fallback, NOT the blur. Body-text surfaces will use `--surface-glass-strong` in 13-4.
- `make snapshot-update` is the codified D→E write boundary for token changes — run it after editing primitives/semantic, then the tokens-spec passes.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): no fabricated specifics. Apply (non-applicable to CSS tokens, but): token values trace to the 13-1 spec, not invented per-file.
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`, not per-job in pr-checks.yml. Apply: the new guard runs via `make test`; no CI job change needed.
- Corpus-edit parity cascade (project memory): touches no methodology corpus body, so NFR27 does not fire.

### Project Structure Notes

- Modified: `src/css/primitives.css`, `src/css/semantic.css`, `src/index.html`, `tests/snapshots/tokens.hash.json` (via snapshot-update).
- New: `src/css/components/glass-surface.css`, `tests/scaffold/13-2-glass-design-system.test.mjs`.
- No `src/scoring/`, `corpus/`, or methodology corpus change.

### References

- [Source: _bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md] (the gate; token values)
- [Source: src/css/primitives.css] (existing primitive layer)
- [Source: src/css/semantic.css] (existing semantic layer + UX-DR6 dark mode)
- [Source: tests/contract/tokens.spec.mjs] (hash contract + snapshot-update path)

## Dev Agent Record

### Agent Model Used

frontend (CSS design-system; React/Vue-agnostic vanilla CSS tokens)

### Debug Log References

### Completion Notes List

- Glass + motion tokens added additively to primitives/semantic; semantic glass roles + dark overrides (both blocks); reusable .glass-surface primitive with -webkit- prefix + @supports solid fallback; alphabetical index.html link; tokens hash refreshed via snapshot-update (D->E). Guard 4/4 green, tokens-contract + design-system green, lint 0.

### File List

- src/css/primitives.css
- src/css/semantic.css
- src/css/components/glass-surface.css
- src/index.html
- tests/snapshots/tokens.hash.json
- tests/scaffold/13-2-glass-design-system.test.mjs

## Specialist Self-Review

**Decisions made:**
- Implemented the glass + motion tokens **additively** in primitives.css and semantic.css (no existing token touched), then refreshed the tokens hash via `make snapshot-update` — the codified D→E exception. This keeps the tokens-contract green while introducing the new vocabulary.
- Authored dark glass **separately** (smoked neutral-900 ink at matching alpha, subtle 0.10 rim) in BOTH the `[data-theme="dark"]` block and the `prefers-color-scheme: dark` system-pref block, mirroring the existing UX-DR6 pattern exactly. Dark glass is not filter-inverted.
- Made `.glass-surface` consume only the `--surface-glass-*` semantic roles, never the `--glass-*` primitives — enforced by a guard assertion (`!/var\(--glass-fill/`), preserving the UX-DR1 two-layer contract.

**Alternatives considered:**
- Inlining glass into existing component CSS rather than a standalone `.glass-surface` primitive: rejected — the epic's value is a *reusable* primitive so 13-3/13-4 add a class, not bespoke CSS. A single component file keeps the look DRY and the alphabetical link-order check simple.
- Skipping the `@supports not` fallback: rejected — without it, a browser without `backdrop-filter` renders a fully-transparent panel (text on raw background, contrast unknowable). The fallback drops to the strong opaque fill so AA holds everywhere.
- Animating `filter`/blur for entrances: rejected per 13-1 §6 — only opacity/transform are compositor-friendly; blur animation is a paint-hot path.

**Framework gotchas avoided:**
- Safari still needs `-webkit-backdrop-filter` alongside the unprefixed property; included both (guard asserts the prefix).
- `make snapshot-update` also re-emits the 60 methodology golden HTML snapshots; confirmed the only token-hash change is the intended one and the methodology snapshots are byte-identical (no corpus body changed), so build stays byte-stable.

**Areas of uncertainty:**
- The fill alphas (0.72/0.85 light, 0.72/0.86 dark) are 13-1's starting values. They clear AA by construction (opaque-enough fill), but 13-4 should re-verify against the actual score-panel/methodology backdrops with the real computed-style assertions and nudge up (never down) if any specific surface is marginal.

**Tested edge cases:**
- Guard (4 assertions, all RED pre-impl → GREEN post-impl): glass+motion primitives with concrete values (12px blur, 260ms base, cubic-bezier easing); semantic glass roles + dark overrides in both dark blocks; `.glass-surface` + `--strong` + `-webkit-` prefix + `@supports not` fallback + two-layer compliance; alphabetical `glass-surface.css` link in index.html.
- Tokens contract (`tokens.spec.mjs`) + design-system hash assertion GREEN after snapshot-update; `lint-css-link-order` GREEN (21 stylesheets alphabetical); `make lint` exit 0.
