---
id: 14-4-aurora-methodology-selection-and-complete-methodology-v0-1-0-route
title: "Story 14.4: Aurora methodology selection and complete /methodology/v0.1.0 route"
status: done
---

# Story 14.4: Aurora methodology selection and complete /methodology/v0.1.0 route

## Story

As a **reader weighing whether to trust the IQ-ME assessment**,
I want **the pre-test methodology/variant selector and the entire /methodology/v0.1.0 reference route — masthead, sidebar, article bodies, and trust signals — rendered with the same Aurora glass-over-deep-navy system as the rest of the app**,
so that **the long-form evidence I am asked to trust reads as one coherent, depth-legible surface in both Light and Dark, not a flat afterthought**.

## Acceptance Criteria

1. **Perceptible glass over the deep-navy backdrop (PR-21).** The methodology masthead, the sidebar nav (`.methodology-sidebar`), and the index sections (`.methodology-index__section`) all composite their glass against the Story-14.2 deep-navy spatial backdrop so blur and edge depth are perceptible (the Epic 13 root failure — glass vanishing into `--color-neutral-900` — stays resolved). The masthead keeps its `--surface-glass-strong` fill + `blur(var(--surface-glass-blur))` and gains a float `box-shadow: var(--surface-glass-shadow)` plus a lit-from-within `inset 0 var(--border-width-hairline) 0 var(--surface-glass-edge)` edge (matching `.aurora-surface`), so it reads as a deliberately raised panel. The sidebar and the index sections — previously transparent regions over the backdrop — now sit on Aurora glass surfaces (the index sections use the STRONG fill for AA body text).

2. **Token-only, two-layer clean (PR-21).** No component CSS introduces a `--glass-*` / `--color-neutral-*` primitive or a literal hex/rgba/px glass value — the two-layer token architecture (UX-DR1) is preserved unchanged. `masthead.css` consumes ONLY the semantic glass roles (`--surface-glass`/`--surface-glass-strong`/`--surface-glass-edge`/`--surface-glass-blur`/`--surface-glass-shadow`) declared in `semantic.css:68` plus `--space-*`/`--radius-*`/`--border-width-*` roles. The selection scene stays in `selection-scene.css` + the frozen `.glass-surface` primitive applied in `selection.js` markup; both files were already two-layer clean, so this story adds no primitive or literal glass value to either. (Grandfathered `--glass-blur-*` radii: none are referenced by either file — the blur comes through the `--surface-glass-blur` semantic role.)

3. **Complete route, reading measure + scroll topology preserved (PR-21).** Aurora is applied to the COMPLETE route (masthead, sidebar nav, index sections, article bodies, trust signals) — not only the selector/masthead. The 46rem article reading measure (`masthead.css:64`), the 14rem app-shell sidebar grid, and the app-shell scroll topology (fixed masthead/sidebar, only the content column scrolls at the `min-width:48rem` breakpoint) are all preserved. The frozen Epic 11/13 DOM contracts (`.methodology-masthead`, `.methodology-sidebar__link`, `.methodology-index__section`, `cite-this-page-affordance`) emitted by `build-methodology.mjs` are untouched — the change is restyle-only.

4. **Theme-correct dark glass keeps the raised-panel ink (PR-21).** The dark glass roles resolve to the lighter `neutral-800`-band fill authored in Story 14.2 (`--surface-glass-strong: rgba(44, 56, 84, 0.90)`, `--surface-glass-edge: rgba(150, 180, 240, 0.22)`) under BOTH `[data-theme="dark"]` and the `prefers-color-scheme: dark` mirror — never the `neutral-900` page color — so the panel still reads as raised and satisfies WCAG 2.2 AA. The existing `pr9-methodology-theme.spec.mjs` assertions on `<html>[data-theme]` continue to pass for stored light, dark, and System (no stored key). No corpus prose is edited, so NFR27 parity (PL/RU mirror + `sourceHashEN` bump) is not triggered and the co-equal Percentile/IQ-scale/Range triplet + clinical disclaimer wording stays intact.

5. **Selection scene + native controls untouched (PR-21).** The Aurora system reaches the selection + variant surfaces purely through the `.glass-surface` token swap from 14.2; `selection.js` markup is byte-identical — the `selection-scene`, `selection-scene__group`, `selection-scene__option`, `selection-scene__continue-btn`, and `selection-scene__back-link` hooks plus the native `<input type="radio">` (system focus ring + keyboard semantics) are preserved. Zero third-party runtime deps / zero inline `<style>` (NFR6/NFR7 CSP); alphabetical CSS `<link>` chain preserved; build remains byte-stable (NFR21).

6. **Reduced-motion + graceful degradation intact (PR-21).** No new motion or transition is added to the static methodology route or the selection scene that survives reduced-motion — `masthead.css` adds no `transition`/`animation`, and the scene-level `@media (prefers-reduced-motion: reduce)` block in `selection-scene.css` keeps dropping the Continue-btn transition. A new `@supports not (backdrop-filter: blur(1px))` fallback in `masthead.css` drops the route's glass surfaces to the opaque strong fill so contrast + layout never break (matching `glass-surface.css` / `aurora.css`). The `css-components-lines` budget (limit 2300) is not exceeded.

7. **Rendered verification deferred to 14.11 (PR-21).** A DORMANT methodology-index visual-regression leg (Light + Dark, glass-on-navy) is wired into `tests/playwright/aurora-visual-regression.spec.mjs`, reusing the existing `visual-regression` harness job (still `if: false` — no new `pr-checks.yml` job, no greedy glob). Story 14.11 flips the job on and commits the baselines on `ubuntu-latest` (~1–2% `maxDiffPixelRatio`) — no pixel baselines are generated or committed here (they must be produced on `ubuntu-latest` CI; authoring host is darwin). The source-text acceptance guard `tests/scaffold/14-4-aurora-methodology.test.mjs` is this story's verification deliverable.

**Requirements covered:** PR-21
**Depends on:** 14.2

## Tasks / Subtasks

- [x] **Task 1: Raise the masthead panel (AC: 1, 2, 6)**
  - [x] Add `box-shadow: var(--surface-glass-shadow), inset 0 var(--border-width-hairline) 0 var(--surface-glass-edge)` to `.methodology-masthead` (token-only, no literal px)
- [x] **Task 2: Glass the sidebar nav + index sections (AC: 1, 2, 3)**
  - [x] Add an Aurora glass surface to `.methodology-sidebar` (standard `--surface-glass` fill — short nav labels)
  - [x] Add a STRONG Aurora glass surface to `.methodology-index__section` (`--surface-glass-strong` — carries body-text links → AA)
  - [x] Both blur via `--surface-glass-blur`, edge via `--surface-glass-edge`, radius via `--radius-surface`, float via `--surface-glass-shadow`
- [x] **Task 3: Solid fallback for the new glass surfaces (AC: 6)**
  - [x] Add `@supports not (backdrop-filter: blur(1px))` dropping `.methodology-masthead`/`.methodology-sidebar`/`.methodology-index__section` to `--surface-glass-strong`
- [x] **Task 4: Verify preservation (AC: 3, 4, 5)**
  - [x] Confirm `selection.js` + `build-methodology.mjs` byte-identical (frozen DOM); 46rem measure + 48rem app-shell topology + 14rem sidebar grid intact; selection-scene reduced-motion block intact; no corpus prose edited
- [x] **Task 5: Dormant visual-regression leg + acceptance guard + budget (AC: 6, 7)**
  - [x] Wire a dormant methodology-index Light/Dark leg into `aurora-visual-regression.spec.mjs` (no new pr-checks job; baselines deferred to 14.11)
  - [x] Author `tests/scaffold/14-4-aurora-methodology.test.mjs` (source-text guard); confirm `css-components-lines` ≤ 2300 and node suite green (modulo pre-existing 9-series reds)

## Dev Notes

### Implementation strategy
- Story 14.2 already retuned `--surface-glass*` so a panel reads as raised over the navy `--backdrop-base`; the masthead consumed `--surface-glass-strong`/`--surface-glass-blur`/`--surface-glass-edge` unchanged, so its perceptibility came from token VALUES. 14.4 is mostly the COMPLETE-route gap: the sidebar nav and the index sections were transparent regions floating directly on the backdrop — they get Aurora glass surfaces so the whole route reads as one coherent depth-legible system.
- **Audit result:** both `masthead.css` and `selection-scene.css` were ALREADY two-layer clean — no `--glass-*` primitive ref, no literal hex/rgba/px glass value in either. So there was nothing to migrate; the change is purely additive glass surfaces on the masthead/sidebar/index, consuming semantic roles only. No `--glass-blur-*` grandfathered radius is referenced by either file (blur flows through the `--surface-glass-blur` role).
- The masthead's lit-from-within inset edge uses `--border-width-hairline` (the 1px hairline token) — NOT a literal `1px` — matching the 14.3 hero and `.aurora-surface`.
- The index sections use `--surface-glass-strong` (≥0.90 alpha) because they carry body-text links; the sidebar uses the standard `--surface-glass` (it carries short nav labels). The `@supports` fallback drops both to the opaque strong fill where backdrop-filter is unavailable.
- The methodology route loads `masthead.css` on both the article and index pages (`build-methodology.mjs:322,453`), so every restyle lands route-wide via that one file — no markup change to `build-methodology.mjs`, no new CSS file, alphabetical `<link>` chain unchanged.
- `selection.js` + `build-methodology.mjs` are byte-identical: no markup, id, class, or DOM-contract change. No corpus markdown edited → NFR27 parity not triggered.

### Verification
- `node --test tests/scaffold/14-4-aurora-methodology.test.mjs` → green (12 tests).
- `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` ≤ 2300.
- `make lint` → exits 0 (the `lint-spec-carry-forward` gate depends on the section below).
- Visual-regression baselines are DEFERRED to Story 14.11 (must be produced on `ubuntu-latest`; authoring host is darwin). The dormant methodology-index leg in `aurora-visual-regression.spec.mjs` reuses the existing `if: false` harness job — no new pr-checks job.
- Pre-existing reds: the 9-series human-gated guards (ICAR PDF / PL translator sign-off) — NOT introduced by this story.

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): every new story spec must carry this section. Apply: present on 14.4; the `make lint` carry-forward gate (`lint-spec-carry-forward`) depends on it.
- lesson-2026-06-03-002 (severity=high): back any "pre-existing red" claim with a baseline `git diff`. Apply: the only Epic-14-attributable changes here are the additive `masthead.css` glass surfaces, the new scaffold guard, and the dormant Playwright leg; the 9-series human-gated reds (ICAR PDF / PL translator sign-off) predate this story.
- UX-DR1 two-layer rule (component CSS consumes semantic roles, never `--glass-*`/`--color-neutral-*` primitives). Apply: both `masthead.css` and `selection-scene.css` audited clean before the change; all new masthead glass surfaces consume only `--surface-glass*` + `--space-*`/`--radius-*`/`--border-width-*` roles — zero primitives, zero literal glass values added.
- Epic-14 framing (14.2 retuned glass VALUES → perceptibility is free for any role-consuming surface). Apply: the COMPLETE-route fix was surgical/additive (glass the previously-transparent sidebar + index sections, raise the masthead) rather than a re-architecture; kept the `css-components-lines` budget well under 2300 so remaining Epic-14 stories keep their runway.
- Epic-14 verification is RENDERED, deferred to 14.11 (structural source-text guards alone missed the Epic 13 invisible-redesign — investigation Finding 5). Apply: this story ships the source-text guard + a DORMANT methodology-index leg; pixel baselines are produced on `ubuntu-latest` CI by 14.11, never on the darwin authoring host.

## Dev Agent Record

### File List
- `src/css/components/masthead.css` (restyle: masthead lit-from-within edge + float shadow; Aurora glass surfaces on `.methodology-sidebar` + `.methodology-index__section`; `@supports` solid fallback — semantic roles only)
- `tests/scaffold/14-4-aurora-methodology.test.mjs` (new — source-text acceptance guard, AC 1–7)
- `tests/playwright/aurora-visual-regression.spec.mjs` (dormant methodology-index Light/Dark leg; baselines deferred to 14.11)
- `_bmad-output/implementation-artifacts/stories/14-4-aurora-methodology-selection-and-complete-methodology-v0-1-0-route.md` (this spec)
