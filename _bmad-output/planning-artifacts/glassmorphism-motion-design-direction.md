# IQ-ME Glassmorphism + Motion Design Direction

> **Status:** Design direction (Story 13-1, Epic 13). Gates the implementation stories 13-2 (design system), 13-3 (homepage), 13-4 (surface rollout), 13-5 (print result). Pins concrete token values and motion principles so the implementation stories are mechanical. Authored against the project's hard constraints: zero third-party, WCAG 2.2 AA, byte-stable build, `prefers-reduced-motion`.

## 1. Intent

IQ-ME currently uses a flat "scientific-instrument" register (cool neutral scale, hairline rules, subtle shadows). Epic 13 layers a **restrained glassmorphism** on top of that register — not a marketing skin. The goal is a cohesive, modern surface language that reads as *crafted instrument*, not *consumer app gloss*. Glass is used to express **layering and focus** (which surface is foreground), never to decorate.

Three principles govern every glass decision:

1. **Honesty over spectacle.** Glass communicates depth/hierarchy. It never implies data it doesn't have (consistent with the anti-credentialization posture).
2. **Contrast is non-negotiable.** Text legibility never depends on what's behind the glass. Every glass surface carries a fill opaque enough that text over it clears WCAG 2.2 AA *regardless of backdrop*.
3. **Motion is optional.** Every motion has a `prefers-reduced-motion: reduce` collapse to a no-op or pure opacity change. Nothing essential is conveyed by motion alone.

## 2. Glass visual language — token vocabulary

These are **primitive** values (consumed by `src/css/primitives.css` in Story 13-2) and the **semantic** glass roles that map to them (`src/css/semantic.css`). Components reference only the semantic roles, never the primitives (existing UX-DR1 two-layer rule).

### 2.1 Blur scale (primitives)

`backdrop-filter: blur()` radii. Kept small — heavy blur is expensive to composite and muddies text legibility.

| Token | Value | Use |
| --- | --- | --- |
| `--glass-blur-sm` | `6px` | Inline controls (theme toggle, language dropdown), small chips |
| `--glass-blur-md` | `12px` | Cards, panels, the score panel, methodology sidebar |
| `--glass-blur-lg` | `20px` | Full-bleed hero / homepage feature surface only |

### 2.2 Glass surface fill (primitives — light + dark)

The fill is the **contrast guarantee**. It is opaque enough that AA holds even with `backdrop-filter` unsupported or disabled (graceful degradation: the fill alone is a valid solid surface).

| Token | Light value | Dark value | Notes |
| --- | --- | --- | --- |
| `--glass-fill` | `rgba(255, 255, 255, 0.72)` | `rgba(19, 24, 32, 0.72)` | Standard panel fill. ≥0.72 alpha keeps text contrast within AA against any backdrop. Dark value derives from `--color-neutral-900` (`#131820`). |
| `--glass-fill-strong` | `rgba(255, 255, 255, 0.85)` | `rgba(19, 24, 32, 0.86)` | Foreground/modal surfaces and anything carrying body text at length (methodology page, score panel). |
| `--glass-tint` | `rgba(47, 74, 120, 0.06)` | `rgba(109, 132, 168, 0.10)` | Optional accent tint (derives from `--color-accent-500` / `--color-accent-300`). Decorative only; never the contrast layer. |

### 2.3 Glass edge + elevation (primitives)

| Token | Light value | Dark value | Use |
| --- | --- | --- | --- |
| `--glass-edge` | `rgba(255, 255, 255, 0.55)` | `rgba(255, 255, 255, 0.10)` | 1px inner/top hairline that gives glass its "lit edge". |
| `--glass-shadow` | `0 4px 24px rgba(10, 13, 18, 0.10)` | `0 6px 28px rgba(0, 0, 0, 0.40)` | Soft drop shadow expressing float height. Reuses the existing neutral-1000 shadow ink. |

### 2.4 Semantic glass roles (semantic layer)

Components consume these, not the primitives above:

- `--surface-glass` → `--glass-fill`
- `--surface-glass-strong` → `--glass-fill-strong`
- `--surface-glass-blur` → `--glass-blur-md`
- `--surface-glass-edge` → `--glass-edge`
- `--surface-glass-shadow` → `--glass-shadow`

### 2.5 Reusable primitive class (Story 13-2 delivers)

A single `.glass-surface` utility (BEM-scoped component CSS, alphabetical link slot) so any surface adopts the look without bespoke CSS:

```css
.glass-surface {
  background-color: var(--surface-glass);
  backdrop-filter: blur(var(--surface-glass-blur));
  -webkit-backdrop-filter: blur(var(--surface-glass-blur));
  border: var(--border-width-hairline) solid var(--surface-glass-edge);
  border-radius: var(--radius-surface);
  box-shadow: var(--surface-glass-shadow);
}
.glass-surface--strong { background-color: var(--surface-glass-strong); }
@supports not (backdrop-filter: blur(1px)) {
  .glass-surface { background-color: var(--surface-glass-strong); } /* solid fallback */
}
```

The `@supports not` fallback is mandatory: where `backdrop-filter` is unavailable, the surface stays a valid opaque panel, so contrast and layout never break.

## 3. Light vs Dark behavior (PR-9 tie-in)

- The glass fills are **separately authored** for light and dark (not auto-inverted) — consistent with the existing UX-DR6 dark-mode rule.
- Dark glass derives from the neutral-900 surface ink at the same 0.72/0.85 alpha so dark glass reads as smoked rather than washed.
- The methodology surface must honor the theme (PR-9): glass roles resolve through the same `[data-theme]` / `prefers-color-scheme` cascade as the rest of semantic.css, so a methodology page in Light gets light glass automatically. 13-4 must verify the methodology page no longer stays dark under Light.
- Edge token alpha differs by theme (0.55 light "lit edge" vs 0.10 dark "subtle rim") because a bright hairline reads as a defect on dark surfaces.

## 4. Motion vocabulary

### 4.1 Duration scale (primitives)

| Token | Value | Use |
| --- | --- | --- |
| `--motion-instant` | `90ms` | Toggle/checkbox state, focus ring appearance |
| `--motion-quick` | `160ms` | Hover, small surface lift, dropdown open |
| `--motion-base` | `260ms` | Scene/panel entrance, item-to-item cross-fade |
| `--motion-slow` | `420ms` | Homepage hero reveal only |

### 4.2 Easing (primitives)

| Token | Value | Character |
| --- | --- | --- |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Decelerate-in; the default for entrances/most transitions (Material 3 "emphasized-decelerate" family). |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerate-out; for dismissals. |

### 4.3 `prefers-reduced-motion` policy (mandatory)

A single global block neutralizes motion at the source:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Rules:
- **No information is conveyed by motion alone.** A reduced-motion user sees the same content, same order, instantly.
- Parallax / continuous / looping motion is **forbidden** anywhere (it cannot be made reduced-motion-safe without becoming a no-op, so it adds nothing).
- The homepage hero (13-3) may animate, but only opacity/transform entrances that collapse cleanly under the reduce block.

## 5. Accessibility guardrails

- **SC 1.4.3 (text contrast ≥ 4.5:1 body, ≥ 3:1 large):** guaranteed by `--glass-fill`/`--glass-fill-strong` alpha (≥0.72), not by blur. Body-text surfaces (methodology, score panel) use `--surface-glass-strong`.
- **SC 1.4.11 (non-text contrast ≥ 3:1):** glass edges and control outlines keep the existing focus-ring/action-border tokens (already AA-tuned for dark in semantic.css). Glass does not weaken any focus indicator.
- **SC 2.3.x / motion:** covered by §4.3.
- **Keyboard + SR:** glass is purely presentational; no glass change alters tab order, roles, or names. The Epic-11 controls (theme toggle PR-6, language dropdown PR-7) keep their existing a11y semantics when restyled.
- **Verification hook:** 13-2's contrast lint / tokens-spec must stay green; 13-4 re-runs the existing Playwright computed-style assertions (score-panel co-equal triplet, reveal-stage) to prove no regression.

## 6. Performance guardrails

- `backdrop-filter` is GPU-composited; keep blurred surfaces **few and stable** (not per-list-item). Blur radii are capped at 20px (§2.1).
- Animate only `opacity` and `transform` (compositor-friendly); never animate `width`/`height`/`top`/`left`/`filter` in hot paths.
- No continuous animation (also a battery/perf win, not just a11y).
- Zero third-party: glass and motion are pure CSS + the existing system font stack. **No external font/CSS/JS CDN, no web-font download, no animation library** (NFR21/NFR33). This survives the existing `lint-no-external-font` / CSP source lints unchanged.

## 7. Zero-third-party + byte-stable note

- All glass is `background`/`backdrop-filter`/`box-shadow`/`border` — no images, no SVG filters fetched, no fonts.
- Adding glass primitives/semantic roles changes `src/css/primitives.css` and `src/css/semantic.css`, which alters the committed tokens hash. That is the **codified D→E exception**: 13-2 runs `make snapshot-update` to refresh `tests/snapshots/tokens.hash.json`. This is an intentional token change, not a contract violation — the tokens-spec test documents exactly this path.
- Component CSS additions keep the alphabetical `<link>` order in `src/index.html` (lint-css-link-order) and stay BEM-scoped.

## 8. Epic-11 surfaces this redesign restyles (sequencing)

13-x restyles surfaces already fixed in Epic 11; the restyle **must not regress** those fixes. Named surfaces:

| Epic-11 fix | Surface | 13-x must preserve |
| --- | --- | --- |
| PR-2 | Test screen mobile layout (item-runner) | No control/header overlap; sticky nav; option/matrix icon scale |
| PR-5 | Result page vertical centering | Balanced centering; co-equal percentile/IQ/range triplet |
| PR-6 | Theme toggle (top-right segmented) | Toggle position + keyboard op + persistence |
| PR-7 | Language dropdown (flags) | Dropdown a11y + locale persistence + FR8 in-test blocker |
| PR-11 | Methodology sidebar + anchors | Single-page sidebar nav; deep-linkable anchors |
| PR-13 | Result disclaimer collapse | Collapse-to-first-line toggle; default collapsed |

Recommended order (from epics.md): **Epic 11 → Epic 13** so the glass restyle absorbs the fixed layouts. Story 13-4 is the rollout that touches these surfaces and re-asserts the Epic-11 invariants.

## 9. Implementation handoff

- **13-2** implements §2 + §4 tokens in primitives/semantic, the `.glass-surface` primitive class, runs `make snapshot-update`, keeps contrast lint + tokens-spec green.
- **13-3** redesigns the homepage (`landing.js`/`landing.css`) with the §4 motion vocabulary, reduced-motion-safe, keeps "Start the test" + "View saved results" (PR-14) prominent and the anti-marketing tone.
- **13-4** rolls `.glass-surface` across test runner, result, methodology, chrome header/footer; re-asserts §8 Epic-11 invariants.
- **13-5** redesigns the print/export result (`print.css`/`result.js`): the glass-era *identity* expressed print-legibly (ink-economical, high-contrast on white, no glass/blur in print — print uses the solid-fallback document layout).

## 10. References (public, verifiable standards only)

- CSS Filter Effects Module Level 2 — `backdrop-filter`.
- CSS Backgrounds and Borders / CSS Color — `rgba()` surface fills.
- Media Queries Level 5 — `prefers-reduced-motion`, `prefers-color-scheme`.
- WCAG 2.2 — SC 1.4.3 (Contrast Minimum), SC 1.4.11 (Non-text Contrast), SC 2.3.3 (Animation from Interactions).
- Apple Human Interface Guidelines — "Materials" (vibrancy/legibility-over-translucency principle).
- Material Design 3 — Motion (duration/easing tokens, emphasized easing).
