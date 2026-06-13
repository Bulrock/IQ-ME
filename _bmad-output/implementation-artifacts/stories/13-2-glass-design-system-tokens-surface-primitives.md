---
id: 13-2-glass-design-system-tokens-surface-primitives
title: "Story 13-2: Glass design system — tokens + reusable glass surface primitives"
status: in-progress
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

- [ ] **Task 1: author the scaffold guard** (`tests/scaffold/13-2-glass-design-system.test.mjs`) encoding AC 6 — glass + motion primitives present; semantic glass roles + dark overrides present; `.glass-surface` + `--strong` + `@supports` fallback present; alphabetical `glass-surface.css` link in index.html. Confirm RED. (test-author phase)
- [ ] **Task 2: add glass + motion primitives** to `src/css/primitives.css` per 13-1 §2.1–2.3 + §4.1–4.2. (impl phase)
- [ ] **Task 3: add semantic glass roles + dark-mode overrides** to `src/css/semantic.css` per 13-1 §2.4 + §3. (impl phase)
- [ ] **Task 4: add the `.glass-surface` component** (`src/css/components/glass-surface.css`) per 13-1 §2.5 + link it alphabetically in `src/index.html`. (impl phase)
- [ ] **Task 5: refresh tokens snapshot** — `make snapshot-update` (D→E exception); verify tokens-spec + design-system hash green. (impl phase)
- [ ] **Task 6: verification** — guard GREEN, `make lint`/`make build` exit 0, `make test` green; confirm only additions to primitives/semantic. (integration phase)

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

### File List

## Specialist Self-Review
