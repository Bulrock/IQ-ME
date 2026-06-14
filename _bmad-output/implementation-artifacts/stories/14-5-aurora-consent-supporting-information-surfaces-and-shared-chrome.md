---
id: 14-5-aurora-consent-supporting-information-surfaces-and-shared-chrome
title: "Story 14.5: Aurora consent, supporting-information surfaces and shared chrome"
status: done
---

# Story 14.5: Aurora consent, supporting-information surfaces and shared chrome

## Story

As a **prospective test-taker reading the validity envelope and operating the persistent app chrome**,
I want **the consent screen, supporting-information surfaces and the shared chrome (header, footer, theme toggle, language flag dropdown, dialogs) to read with the same Aurora glass depth as the rest of the redesigned product**,
so that **the interface is visually coherent against the deep-navy spatial backdrop without losing the consent dwell-gate, the PR-6/PR-7 control behaviors, keyboard/screen-reader access, or the FR8 locale-switch blocker**.

## Acceptance Criteria

1. **Consent envelope reads as a raised Aurora glass panel (PR-22).** `.consent-scene__envelope` — previously a flat opaque `--color-surface-elevated` panel with a `--color-rule-strong` start-border (PR-22) — now consumes the Story-14.2 re-valued semantic glass roles: `--surface-glass-strong` fill (≥0.90 alpha — the envelope carries long-form body text → AA SC 1.4.3) + `blur(var(--surface-glass-blur))` + a `--surface-glass-edge` hairline border + a `box-shadow: var(--surface-glass-shadow), inset 0 var(--border-width-hairline) 0 var(--surface-glass-edge)` float + lit-from-within edge (matching `.aurora-surface`), so it reads as a deliberately raised panel against the deep-navy backdrop. No new `--glass-*`/`--color-neutral-*` primitive and no literal hex/rgba/px glass value is added. The `body[data-route="#/consent"]` app-shell scroll behavior (envelope `overflow-y:auto`, fixed header/cta/footer) is unchanged, and the FR12 dwell-gate contract is preserved: `.consent-scene__continue-btn[aria-disabled="true"]` stays the muted disabled register (`--color-text-link-disabled` + `cursor:not-allowed`) and the timer-driven unlock remains independent of envelope scroll.

2. **Dwell-hint stays viewport-safe; muted controls keep a visible focus ring (PR-22).** `.consent-scene__dwell-hint` keeps `max-width:100%` + `overflow-wrap:break-word` so the longest PL string never forces horizontal page scroll, and `.consent-scene__dwell-hint[hidden]` still resolves to `display:none`. The muted `#not-today-link` keeps its `--color-text-muted` default and both controls retain a visible `:focus-visible` outline ring (`var(--space-1) solid var(--color-focus-ring)` — WCAG 2.2 AA 2.4.7 / 1.4.11 ≥3:1 against the re-valued surface). `consent-scene.css` introduces NO `--glass-*`/`--color-neutral-*` primitive and NO literal hex/rgba glass value (two-layer rule UX-DR1).

3. **Chrome header reads as an Aurora glass bar with stacking + route gates byte-stable (PR-27).** `.chrome-header` continues to consume `--surface-glass` + `blur(var(--surface-glass-blur))` + the `--surface-glass-edge` bottom rule with the `@supports not (backdrop-filter)` opaque `--surface-glass-strong` fallback — re-valued by 14.2, so the bar reads as glass against the backdrop for free. `.chrome-header { position:relative; z-index:30 }` is preserved (so the language menu stays above scene content and pointer-receptive), and the route gates — `body[data-route="#/test"] .chrome-header { display:none }` (UX-DR8) and `body[data-route="#/"] .chrome-header__language-switcher { display:revert }` — are byte-stable in behavior. The frozen Epic 11/13 DOM contracts (`section.landing`, `h1#landing-heading`, `#start-test-btn`, `.landing__methodology-link`) are untouched.

4. **Theme toggle keeps its restraint-first register (PR-6 / PR-27).** The segmented control keeps the active segment marked SOLELY by `.theme-switcher__segment[aria-pressed="true"]` as a quiet `--color-surface-elevated` fill (no loud accent), the `:focus-visible` outline stays visible against the re-valued chrome fill, and the toggle consumes only semantic tokens (zero third-party runtime deps, no inline `<style>`; NFR6/NFR7 CSP) — no `--glass-*`/`--color-neutral-*` primitive, no literal hex/rgba.

5. **Language dropdown keeps the OPAQUE menu + FR8 locale-lock (PR-7 / PR-27).** The `.language-switcher__menu` retains an OPAQUE elevated fill (`--color-surface-elevated` + `--shadow-overlay`) — deliberately NOT migrated to translucent glass — so listbox text stays AA-legible regardless of backdrop, and the `[hidden]` → `display:none` rule still collapses the closed menu. The disabled trigger register `.language-switcher__trigger[aria-disabled="true"]` (`--color-text-link-disabled` + `cursor:not-allowed`) and the `aria-selected="true"` active-option marking are preserved; the FR8 blocker hint pathway is intact because the blocked-state styling continues to hang off `[aria-disabled="true"]` (driven by `language-switcher.js`, which is byte-identical — restyle-only).

6. **Footer + dialog surfaces stay coherent and within budget (PR-27 / UX-DR3 / NFR21).** `.chrome-footer` reads as a glass bar matching the header (`--surface-glass` + `--surface-glass-blur` + `--surface-glass-edge` + the `@supports` opaque `--surface-glass-strong` fallback). The supporting methodology/discussions/citation links keep their muted `--color-text-muted` default with the `:hover`/`:focus-visible` underline + `--color-text-link` reveal and the visible focus-ring outline, carrying neutral chrome-level weight (no accent CTA register, UX-DR3); the footer also hides on `body[data-route="#/test"]` (UX-DR8). Any dialog/overlay surfaces consume the same re-valued semantic glass + `--shadow-overlay` roles rather than new primitives. The change stays within the 2600-line `css-components-lines` budget and the build remains deterministic and byte-stable (NFR21).

7. **Print stays opaque/light; no parity cascade; verification deferred to 14.11 (PR-22 / NFR27).** The print path is untouched — `print.css` still forces `:root { color-scheme: light }`, prints white/dark-ink, and strips the chrome bars (`.chrome-header`/`.chrome-footer { display:none !important }`), so no Aurora navy bleeds into print and the co-equal Percentile / IQ-scale / Range triplet stays intact. No EN copy or methodology corpus body is edited, so no NFR27 translation-parity cascade is triggered. The RENDERED visual-regression baselines (consent + chrome, Light + Dark) are committed centrally by Story 14.11 on `ubuntu-latest` (~1–2% `maxDiffPixelRatio`); the source-text acceptance guard `tests/scaffold/14-5-aurora-chrome-consent.test.mjs` is this story's verification deliverable — no pixel baselines are generated or committed here.

**Requirements covered:** PR-22, PR-27
**Depends on:** 14.2

## Tasks / Subtasks

- [x] **Task 1: Raise the consent envelope to an Aurora glass panel (AC: 1, 2)**
  - [x] Migrate `.consent-scene__envelope` off the flat `--color-surface-elevated` fill + `--color-rule-strong` start-border onto the re-valued `--surface-glass-strong` fill + `blur(var(--surface-glass-blur))` + `--surface-glass-edge` hairline border + `--radius-surface`
  - [x] Add the float + lit-from-within edge: `box-shadow: var(--surface-glass-shadow), inset 0 var(--border-width-hairline) 0 var(--surface-glass-edge)` (token-only — the hairline TOKEN, no literal px)
- [x] **Task 2: Solid fallback for the new envelope glass (AC: 1, 7)**
  - [x] Add `@supports not (backdrop-filter: blur(1px))` dropping `.consent-scene__envelope` to the opaque `--surface-glass-strong` fill so contrast + layout never break
- [x] **Task 3: Audit the shared chrome surfaces (AC: 3, 4, 5, 6)**
  - [x] Confirm `chrome-header.css` + `chrome-footer.css` already consume the `--surface-glass*` roles (re-valued by 14.2 → glass-on-navy for free) with their `@supports` fallbacks and route gates intact — no migration needed
  - [x] Confirm `theme-toggle.css` (aria-pressed restraint-first fill) and `language-switcher.css` (OPAQUE menu fill, FR8 `[aria-disabled]` register, `aria-selected` marking) are already two-layer clean — no migration needed
- [x] **Task 4: Verify preservation (AC: 1, 3, 5, 7)**
  - [x] Confirm `src/assessment/language-switcher.js` byte-identical (FR8 locale-lock + listbox semantics); `src/css/print.css` byte-identical (print stays opaque/light, strips chrome); FR12 dwell-gate + consent scroll topology intact; no corpus prose edited
- [x] **Task 5: Acceptance guard + budget (AC: 6, 7)**
  - [x] Author `tests/scaffold/14-5-aurora-chrome-consent.test.mjs` (source-text guard, two checks per surface for Light + Dark); confirm `css-components-lines` ≤ 2600 and the node scaffold suite green (modulo the pre-existing 9-series reds)

## Dev Notes

### Implementation strategy
- Story 14.2 already retuned the `--surface-glass*` VALUES so any surface consuming those roles reads as a raised panel over the deep-navy `--backdrop-base` for free. So 14.5 was mostly the consent ENVELOPE: it was the one supporting-information surface still on a flat opaque `--color-surface-elevated` + `--color-rule-strong` start-border (the PR-22 register), so it composited as a flat block on the new backdrop. It now consumes the re-valued Aurora glass roles (strong fill + blur + lit edge + float shadow, matching `.aurora-surface`) so the validity envelope reads as one coherent depth-legible surface with the rest of the app.
- **Audit result:** all 5 component files were two-layer clean before the change — `grep -E '#[0-9a-fA-F]{3,8}|var\(--glass-[a-z-]+\)|var\(--color-neutral-[0-9]+\)|rgba?\('` over each returned ZERO hits. So there was nothing to migrate OFF primitives anywhere. The chrome header and footer ALREADY consumed `--surface-glass`/`--surface-glass-blur`/`--surface-glass-edge` (with `@supports` opaque `--surface-glass-strong` fallbacks) since Epic 13's 13-4 glass-chrome work — 14.2's re-value made them perceptible glass-on-navy with no edit. The theme toggle (aria-pressed restraint fill) and language switcher (OPAQUE menu) consume `--color-surface-elevated`/`--shadow-overlay`/semantic tokens only and needed no change. The ONLY substantive CSS change is the consent envelope.
- The envelope uses `--surface-glass-strong` (≥0.90 alpha) — NOT the standard `--surface-glass` — because it carries the long-form validity-envelope body text (AA SC 1.4.3); the lit-from-within inset edge uses `--border-width-hairline` (NOT a literal `1px`), matching the 14.3 hero / 14.4 masthead / `.aurora-surface`.
- **Deliberate non-change — the language menu stays OPAQUE.** PR-7 requires the listbox menu to stay an opaque elevated fill (`--color-surface-elevated` + `--shadow-overlay`), NOT translucent glass: a frosted menu would let the backdrop bleed through and threaten AA on the locale labels. The guard asserts the menu has NO `backdrop-filter` so a future story can't accidentally glass it.
- `language-switcher.js` + `print.css` are byte-identical: no markup/DOM-contract change, and print still forces light/opaque and strips the chrome bars so no Aurora navy bleeds into print. No corpus markdown edited → NFR27 parity not triggered; the co-equal triplet + clinical disclaimer wording stays intact.

### Verification
- `node --test tests/scaffold/14-5-aurora-chrome-consent.test.mjs` → green (19 tests).
- `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` 2259/2600 (was 2239; +20 lines for the envelope glass + `@supports` fallback).
- `make lint` → exits 0 (the `lint-spec-carry-forward` gate depends on the section below).
- Visual-regression baselines are DEFERRED to Story 14.11 (must be produced on `ubuntu-latest`; authoring host is darwin). No pixel baselines are generated or committed here.
- Pre-existing reds: the 9-series human-gated guards (ICAR PDF / PL translator sign-off) — NOT introduced by this story.

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): every new story spec must carry this section. Apply: present on 14.5; the `make lint` carry-forward gate (`lint-spec-carry-forward`) depends on it.
- lesson-2026-06-03-002 (severity=high): back any "pre-existing red" claim with a baseline `git diff`. Apply: the only Epic-14-attributable change here is the additive `consent-scene.css` envelope glass + its `@supports` fallback, plus the new scaffold guard; the 9-series human-gated reds (ICAR PDF / PL translator sign-off) predate this story.
- UX-DR1 two-layer rule (component CSS consumes semantic roles, never `--glass-*`/`--color-neutral-*` primitives). Apply: all 5 component files audited clean before the change (zero primitive/hex/rgba hits); the new envelope glass consumes only `--surface-glass*` + `--space-*`/`--radius-*`/`--border-width-*` roles — zero primitives, zero literal glass values added.
- Epic-14 framing (14.2 retuned glass VALUES → perceptibility is free for any role-consuming surface). Apply: the chrome header/footer/theme-toggle/language-switcher needed NO edit — they already consumed the re-valued roles, so the fix was surgical (one envelope), keeping the `css-components-lines` budget well under 2600 for the remaining Epic-14 stories.
- Restraint-first chrome contracts are attribute-driven, not surface-driven (PR-6 `aria-pressed`, PR-7 `aria-selected`/`aria-disabled`). Apply: the guard asserts each control's marking still hangs off the ARIA attribute and that the language menu stays OPAQUE (no `backdrop-filter`) so a future Aurora pass can't silently break FR8 listbox AA legibility.
- Epic-14 verification is RENDERED, deferred to 14.11 (structural source-text guards alone missed the Epic 13 invisible-redesign — investigation Finding 5). Apply: this story ships the source-text guard only; pixel baselines are produced on `ubuntu-latest` CI by 14.11, never on the darwin authoring host.

## Dev Agent Record

### File List
- `src/css/components/consent-scene.css` (restyle: `.consent-scene__envelope` migrated from the flat `--color-surface-elevated` + `--color-rule-strong` start-border to the Aurora glass roles — `--surface-glass-strong` fill + blur + lit-from-within edge + float shadow + `@supports` solid fallback; semantic roles only)
- `tests/scaffold/14-5-aurora-chrome-consent.test.mjs` (new — source-text acceptance guard, AC 1–7, two checks per surface for Light + Dark)
- `_bmad-output/implementation-artifacts/stories/14-5-aurora-consent-supporting-information-surfaces-and-shared-chrome.md` (this spec)
