# Aurora Glass Observatory — Design Direction

> **Status:** Design direction (Story 14.1, Epic 14). **Gates the implementation stories 14.2+** (token foundation, homepage, methodology/selection, consent/chrome, assessment rendering, restrained test route, results, print, performance, and the rendered verification suite). It supersedes the *visual strategy* of Epic 13's [glassmorphism-motion-design-direction.md](glassmorphism-motion-design-direction.md) — Epic 13 stays `done`; this artifact reuses its two-layer token architecture but replaces the values and adds the deep-navy spatial backdrop. **This artifact does NOT mutate any Epic 13 token VALUE** in [primitives.css](../../src/css/primitives.css) or [semantic.css](../../src/css/semantic.css) — that is Story 14.2. It pins *design intent* only; it writes **no production CSS and no token VALUE** (those are Story 14.2) **and no product test** — the only accompanying artifact is a structural scaffold guard for this document — so the production build stays byte-stable (NFR21). Authored against the project's hard constraints: zero third-party (NFR6/NFR7), WCAG 2.2 AA, byte-stable build, `prefers-reduced-motion`.

## 1. Why this exists — the Epic 13 root failure

Epic 13 shipped technically complete but **visually imperceptible**. The dark glass role `--surface-glass` was `rgba(19, 24, 32, 0.72)` — the *exact RGB* of `--color-neutral-900` (`#131820`), the page background. Translucent glass composited over a flat same-color page yields the page color, and `backdrop-filter: blur()` over a uniform field produces no visible effect (see [epic-13-no-visible-changes-investigation.md](../implementation-artifacts/investigations/epic-13-no-visible-changes-investigation.md) Finding 4; Deduction 1, High confidence). A later 13-4 visual-fix patched dark glass up to a neutral-800 ink and added a faint accent-glow `body` backdrop, but the system was never *designed* to give glass real contrast to blur against.

The fix is **not more blur or more glow**. The fix is a deliberate **deep-navy spatial backdrop** with non-uniform, depth-bearing content, over which a *lighter* frosted panel reads as a raised layer. This artifact pins that backdrop, the layering model, and the bounded aurora/glass/grid treatment, so that every downstream story is a mechanical token-value and CSS edit that **cannot** reproduce the same-color-over-same-color failure.

**Architecture preserved (the contract this artifact must not break):** the established two-layer rule (UX-DR1) — component CSS and `base.css` reference ONLY semantic roles (`--surface-glass*`, `--color-*` semantic roles), never the `--glass-*`/`--color-neutral-*` primitives directly. This artifact changes design *intent*, not the indirection contract. The 25 component CSS files keep consuming the same semantic role names unchanged; Story 14.2 changes only the VALUES those roles resolve to.

## 2. The Aurora layering model

The system is four named layers with an explicit z-order. Body-text contrast is guaranteed by the **glass fill alpha**, never by the backdrop and never by the blur — so the contrast guarantee is independent of backdrop content (WCAG 2.2 AA, SC 1.4.3).

**Surface hierarchy — explicit ordering (deepest → highest):** **page backdrop → content region → glass panels → controls.** Expanded:

1. **Page backdrop** — the deep-navy spatial field. Painted gradient + faint aurora + optional thin luminous grid. Purely decorative; carries no text; sits below every contrast-bearing layer. **Uses no `backdrop-filter`** (it is a painted background, not a frosted surface).
2. **Content region** — the transparent layout container (max-width column, section padding). No fill of its own; lets the backdrop show through between panels.
3. **Glass panels** — frosted, raised surfaces (`--surface-glass` / `--surface-glass-strong`) that carry content and body text. This is where `backdrop-filter` blur lives, and where the luminance delta against the backdrop makes the blur perceptible.
4. **Controls** — buttons, inputs, toggles, links: the highest layer, using the strong fill and/or accent edges, always with a visible `:focus-visible` ring.

### 2.1 Deep-navy spatial backdrop (named decision — `--backdrop-*` roles)

The page background must be a **deep navy that is perceptibly darker and bluer than the glass fill** so blur and elevation read. Story 14.2 introduces NEW semantic backdrop roles (e.g. `--backdrop-base`, `--backdrop-aurora`, `--backdrop-grid`) in `semantic.css`, resolving to NEW/replaced Aurora primitive VALUES in `primitives.css`, and authors them as page-level CSS in `base.css` (replacing the `body` accent-glow block at [base.css:25-37](../../src/css/base.css#L25)).

- **Dark theme (default Aurora identity):** a deep-navy base in the `#070b16`–`#0b1022` range (proposal — 14.2 tunes), i.e. *darker and more saturated-blue* than the current `#131820` neutral-900. The glass fill stays in the neutral-800 luminance band (rgb ≈ 45–56) so panel-over-backdrop has a clear, intentional luminance delta (target ΔL ≳ 12–16 in sRGB luminance terms — enough that a blurred edge is visible, verified by the rendered suite, not asserted in source).
- **Light theme (separately authored, NOT auto-inverted — UX-DR6):** a cool, luminous **pale** canvas (off-white with a faint blue-violet wash), with glass panels a hair off pure white so a panel still reads as a distinct raised layer (mirrors the existing `--glass-fill: rgba(248,250,252,0.72)` intent). The "deep-navy" is a dark-theme treatment; light theme gets its luminous analog with the *same layering discipline*.

### 2.2 Bounded blue-violet aurora gradient (named decision — `--backdrop-aurora`)

A small number of **fixed** (non-animated) radial/linear gradient glows in the blue-violet family, layered onto the backdrop base:

- Hue family: blue (≈ accent-500, hue ~219) → violet (~265). Reuse/extend the existing `--color-accent-*` ramp; no new third-party palette.
- **Bounded:** at most **2–3 gradient stops** painted on the backdrop; each glow alpha ≤ **0.18**; total aurora must never raise body-text-region luminance enough to threaten AA (the text lives on glass, above the aurora).
- **Static by default** — no parallax, no looping, no continuous motion (see §4). The aurora is a *painted scene*, not an animation.

### 2.3 Frosted surface + edge definition (named decision — reuse `--surface-glass*`, retune values)

- Glass fill remains the **contrast guarantee**: dark fill in the neutral-800 band (lighter than the navy backdrop), light fill a hair off white; alpha **≥ 0.72 standard / ≥ 0.88 strong** so AA holds with `backdrop-filter` unsupported or disabled.
- **Edge definition is mandatory** (it is what makes a panel boundary visible against a busy backdrop): a 1px lit hairline (`--surface-glass-edge`) — brighter rim on dark (`rgba(255,255,255,0.14–0.18)`), soft tinted rim on light. A frosted panel with no edge dissolves into the aurora; the edge is non-negotiable.
- Blur radii stay on the existing capped scale (§4): 6 / 12 / 20px. **No blur value above 20px.**

### 2.4 Thin luminous grid + accent usage (named decision — `--backdrop-grid`, `--accent-glow`)

- A **thin** scientific grid (1px lines, low-alpha accent ≤ **0.06**, large cell **≥ 48px**) may appear on the **page backdrop of landing and results only** — it evokes the "observatory / instrument" identity. It is **forbidden on the assessment route** (§3.1) and must never reduce text or control contrast.
- Blue-violet accent is used for: focus glows, links, key result numerals, and the lit panel edge. Accent is an *emphasis* layer, never a contrast crutch — body text contrast always comes from the glass fill + ink color.

## 3. Route treatment & surface-specific behavior

### 3.1 Restrained assessment-route variant (mandatory)

The test route is **visually quieter** than landing/results (Cross-Surface constraint, [epic-13-redesign-concepts.md](../implementation-artifacts/investigations/epic-13-redesign-concepts.md) concept 01 risk note). On assessment routes (questions, progress, navigation, answer options):

- **Reduced or zero aurora** behind matrix items; **no luminous grid**; the backdrop collapses toward a near-flat deep field so nothing competes with the puzzle.
- Panels stay legible frosted surfaces, but decorative glow is suppressed. The goal is **concentration protection**, not spectacle.
- **No timer-like UI, no gamification, no speed framing** (this is pinned here and enforced visually by Stories 14.7/14.10 and the no-timer policy PR-28). Where timing is mentioned at all, only self-paced / no-time-limit / no-time-pressure language is allowed.

### 3.2 Light vs dark (separately authored — UX-DR6)

Light and dark Aurora treatments are **authored independently**, not auto-inverted, resolved through the same `[data-theme]` / `@media (prefers-color-scheme)` cascade as the rest of `semantic.css`. Dark is the deep-navy observatory; light is the luminous pale analog. Both honor the theme on every surface (including the methodology route — fixing the historical "methodology stays dark under Light" class of bug).

### 3.3 Ink-economical print/PDF translation

The print/PDF result (Story 14.9, PR-26) is a **deliberate document layout, not a screenshot of the glass UI**: **no aurora, no blur, no glow, no grid, no dark backdrop** in print. Print uses the solid-fallback document treatment (high-contrast ink on white, economical with toner), expressing the Aurora *identity* through type, rule, and spacing — exactly as the `@supports not(backdrop-filter)` fallback already degrades glass to a solid panel.

### 3.4 Frozen DOM contracts that downstream styling must preserve

Any Aurora restyle is **presentational only** and must NOT alter these frozen Epic 11/13 DOM contracts (no class-A unfreeze):

- `section.landing`, `h1#landing-heading`, `#start-test-btn`, `.landing__methodology-link`
- The co-equal **Percentile / IQ-scale equivalent / Range** result triplet (equal visual weight preserved)
- Tab order, ARIA roles/names, theme-toggle and language-dropdown a11y semantics, and the in-test FR8 locale-lock behavior

## 4. Guardrails — bounded budgets, motion, zero-third-party

### 4.1 Bounded budgets (each is a reviewer-checkable cap against a 14.2 token diff)

| Budget | Cap | Rationale |
| --- | --- | --- |
| Blur radius | ≤ **20px** (existing `--glass-blur-lg`); hero only | Heavy blur is expensive to composite and muddies legibility |
| Aurora glow alpha | ≤ **0.18** per glow; ≤ 3 glows on backdrop | Keeps the scene a backdrop, never a foreground wash |
| Grid line alpha / density | alpha ≤ **0.06**; cell ≥ **48px**; landing+results only | Thin instrument grid, never decorative noise |
| Shadow | ≤ existing `0 6px 28px rgba(0,0,0,0.45)` (dark) / `0 4px 24px rgba(10,13,18,0.10)` (light) | Float height, not drama |
| **Concurrently-composited `backdrop-filter` surfaces per viewport** | ≤ **3** | The page backdrop is painted (no filter); only panels/controls blur. Caps GPU composite cost on mobile |

### 4.2 Reduced-motion behavior (mandatory)

- The aurora is **static by default** — there is no continuous, looping, or parallax motion anywhere (it cannot be made reduced-motion-safe without becoming a no-op, so it adds nothing). This is a hard prohibition.
- Any *entrance* motion (e.g. a homepage hero reveal) is opacity/transform only and **collapses to a no-op or pure opacity change** under the existing global `prefers-reduced-motion: reduce` block at [base.css:140-149](../../src/css/base.css#L140). **No information is ever conveyed by motion alone** — a reduced-motion user sees the same content, same order, instantly.

### 4.3 Zero-third-party invariant (NFR6/NFR7)

All Aurora visuals are **pure CSS**: `background`/`background-image` gradients, `backdrop-filter`, `box-shadow`, `border`. **No images, no SVG filters fetched, no web fonts, no animation library, no inline `<style>`, no external CDN.** This survives the existing CSP/`lint-no-external-font` source lints unchanged. The alphabetical CSS `<link>` chain in [index.html](../../src/index.html) is preserved (lint-css-link-order).

## 5. Verification handoff (rendered, not structural)

Epic 13's regression went undetected because its guards were **structural source-text checks only** — they proved token names and `backdrop-filter` appeared in CSS, not that anything was perceptible (investigation Finding 5). Epic 14's verification is therefore **rendered**, handed to Story 14.11 (PR-30):

- **Approved reference-viewport set:** **320, 360, 414, 768, 1024, 1280** (the discrete screenshot widths); the hero/wide leg additionally captures **1440**. Each route is reviewed in **light + dark**, plus a **print/PDF render** leg.
- **Question-to-answer visual-scale tolerance:** an answer option-icon's rendered width must be within **±5%** of the computed matrix-cell size (matrix-cell-to-option-icon parity). This is the *correctness* tolerance Story 14.6/14.11 enforce so the intended answer can be evaluated fairly.
- **Committed-baseline visual-regression + print/PDF CI job** is the **documented Epic 14 exception** to the "no new CI jobs post-Epic-1" discipline (alongside the existing eslint exception, per epics.md Decision 4). Baselines are generated on `ubuntu-latest` with a documented `maxDiffPixelRatio` (~1–2%) so platform jitter does not flake the gate.
- **Per-spec CI wiring note (for 14.2/14.11):** `pr-checks.yml` wires Playwright specs **per-spec — one job each, no greedy glob**. The new visual-regression spec(s) must get their own dedicated job(s); a spec is uncovered until explicitly added (verify with `grep <spec-filename> .github/workflows/pr-checks.yml`).
- **This story (14.1) writes no production CSS and no token VALUE** (those are Story 14.2) **and no product/rendered test.** The only artifact besides this document is a structural scaffold guard (`tests/scaffold/14-1-aurora-design-direction.test.mjs`) that asserts the sections above exist — it touches no shipping code. The production build stays byte-stable (NFR21); no `make snapshot-update` is run here.

## 6. Anti-patterns — explicitly barred

Each is a prohibition a reviewer can check against a Story 14.2 token diff or a rendered screenshot:

1. **No translucent surface composited over a flat same-color backdrop.** The dark glass fill RGB must differ measurably from the page backdrop RGB. (The exact Epic 13 failure — never again.)
2. **No unbounded blur, glow, shadow, grid-density, or motion.** Every effect has a cap in §4.1; an effect with no cap is a defect.
3. **No continuous / looping / parallax motion** anywhere.
4. **No aurora or grid behind matrix items** on the assessment route (§3.1).
5. **Blur is never the contrast guarantee.** Text legibility never depends on what is behind the glass.
6. **Graceful degradation preserved:** the opaque `@supports not (backdrop-filter: blur(1px))` fallback in [glass-surface.css](../../src/css/components/glass-surface.css) and the AA-clearing fill alpha (≥0.72 / ≥0.88) remain the contrast guarantee on every new surface variant. Where `backdrop-filter` is unavailable, the surface stays a valid opaque panel — contrast and layout never break.

## 7. Implementation handoff (story map)

- **14.2** — implement §2 backdrop + retuned token VALUES in `primitives.css`/`semantic.css`, new backdrop/aurora semantic roles, reusable Aurora surface/focus/interaction primitives, and stand up the Playwright visual-regression + print/PDF harness (pre-stubbed off). Runs `make snapshot-update` for the intended token-hash change; stays within the `css-components-lines` budget (2300).
- **14.3** — homepage + primary CTAs with the dramatic Aurora treatment (§2), reduced-motion-safe.
- **14.4** — methodology selection + the complete `/methodology/v0.1.0` route (all sections, not just the selector).
- **14.5** — consent + supporting-information surfaces + shared chrome (header/footer/nav/language/dialogs).
- **14.6** — assessment question→answer rendering *correctness* (§5 ±5% scale parity; states distinct; keyboard selection; no mobile clipping/distortion).
- **14.7** — restrained Aurora assessment route + no-timer UI (§3.1).
- **14.8** — results + saved-results surfaces (co-equal triplet preserved, §3.4).
- **14.9** — ink-economical print/PDF document (§3.3).
- **14.10** — performance budget + reduced-motion hardening (§4.1/§4.2); progressive simplification on small/low-power devices.
- **14.11** — rendered visual-regression / contrast / reduced-motion / print verification suite (§5); flips the harness on.
- **14.12** — commit-and-guard the assessment-duration copy cleanup (PR-31; substantially landed in commit `00ea3ea`).

## 8. References (public, verifiable standards only)

- CSS Filter Effects Module Level 2 — `backdrop-filter`.
- CSS Backgrounds and Borders / CSS Color — gradient `background-image`, `rgba()` surface fills.
- CSS Images Module Level 3 — `radial-gradient()` / `linear-gradient()`.
- Media Queries Level 5 — `prefers-reduced-motion`, `prefers-color-scheme`.
- WCAG 2.2 — SC 1.4.3 (Contrast Minimum), SC 1.4.11 (Non-text Contrast), SC 2.3.3 (Animation from Interactions).
- Apple Human Interface Guidelines — "Materials" (legibility-over-translucency principle).
- Material Design 3 — Motion (duration/easing tokens, emphasized easing).
- Internal: [glassmorphism-motion-design-direction.md](glassmorphism-motion-design-direction.md) (Story 13.1 — superseded visual strategy, reused architecture); [epic-13-no-visible-changes-investigation.md](../implementation-artifacts/investigations/epic-13-no-visible-changes-investigation.md) (root cause); [epic-13-redesign-concepts.md](../implementation-artifacts/investigations/epic-13-redesign-concepts.md) concept 01 (Aurora Glass Observatory direction).
