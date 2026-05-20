---
id: 5-1-methodology-page-chrome-css-additions-validity-envelope-diagram-asset
title: "Story 5.1: Methodology-page-chrome CSS additions + validity-envelope-diagram asset"
status: ready-for-dev
tds:
  primary_specialist: frontend
  story_tags:
    - methodology-chrome
    - css-component
    - svg-asset
    - i18n-content-keys
    - epic-3-coupling
    - epic-7-coupling
---

# Story 5.1: Methodology-page-chrome CSS additions + validity-envelope-diagram asset

## Story

As a **methodology corpus reader expecting visual coherence with the SPA**,
I want **the remaining methodology-page-chrome CSS components (`lede.css`, `translation-in-progress-stub.css`, `validity-envelope-diagram.svg` + `.css`) to land before content authoring begins**,
so that **the anchor-page authors (Story 5.2) render against a locked component set (per Sally — visual coherence is the medium, not late-binding) and the validity-envelope diagram is reusable in both the consent scene (Epic 3) and `/methodology/constructs/validity-envelope/` (Story 5.3)**.

This is **the load-bearing setup for Story 5.2**. Until these components ship, anchor-page authoring is blocked: the lede, the translation-in-progress fallback, and the validity-envelope diagram are all referenced from the anchor-pages contract.

This story owns:

1. **`src/css/components/lede.css`** — new. Renders the first body paragraph of any methodology page at `--font-size-300` (20px per UX-DR3) with `--space-masthead-to-lede` spacing above. Content sourced from the methodology page body (no per-page hardcoding).
2. **`src/css/components/translation-in-progress-stub.css`** — new. Stub-page composition for non-EN frontmatter flagged `translationStatus: in-progress`. Masthead present, "Translation in progress" message in active locale, contributor-recruitment CTA, fallback link to EN source.
3. **`src/content/diagrams/validity-envelope-diagram.svg`** — new. Reusable SVG asset rendering "valid for / partial validity / not valid for" populations as a labeled grid (or annotated overlap diagram). `<title>` + `<desc>` carry i18n content keys (NFR31).
4. **`src/css/components/validity-envelope-diagram.css`** — new. Layout/dark-mode adaptation of the SVG for both embedded surfaces.
5. **Build-pipeline extension (`tools/build-methodology.mjs`):** emit the translation-in-progress-stub composition for any non-EN frontmatter file flagged `translationStatus: in-progress`.
6. **Epic 3 consent-scene update:** `src/css/components/consent-scene.css` references the now-real `validity-envelope-diagram.svg` (replacing any placeholder).
7. **Frontmatter schema extension:** add `translationStatus` optional enum to `corpus/frontmatter.schema.json` (values: `complete | in-progress`). `lint-frontmatter` (Story 4-3) recognizes the field.

## Acceptance Criteria

1. **AC-1 (`src/css/components/lede.css`):**
   - File at exact path: `src/css/components/lede.css`.
   - Selector `.lede` (or `[data-component="lede"]`) applies:
     - `font-size: var(--font-size-300)` (20px per UX-DR3)
     - `line-height: 1.5` (per UX spec §1589)
     - `margin-block-start: var(--space-masthead-to-lede)` (per UX spec §863 — already defined in `primitives.css`)
   - CSS source is co-located with other component CSS; imported via the existing `src/css/components/_index.css` (or equivalent aggregator if present — confirm via repo scan).
   - **Content sourcing:** the lede has no hardcoded text; the build pipeline (build-methodology.mjs) wraps the first `<p>` of the methodology body in the lede class. Per UX-DR12 the lede is the body's first sentence — *route-aware* placement is deferred to Epic 6 (consent-scene); for methodology pages it's strictly first-paragraph.
   - **A11y:** no role override; lede is a normal paragraph that visually leads. Reading order unchanged.

2. **AC-2 (`src/css/components/translation-in-progress-stub.css` + build-pipeline emission):**
   - File at exact path: `src/css/components/translation-in-progress-stub.css`.
   - Selector group `[data-translation-status="in-progress"]` (per UX spec §1464) styles:
     - Masthead rendered normally; masthead title element shows "Translated: none yet" (or i18n key `methodology.masthead.translatedNoneYet`).
     - Body region replaced by stub composition: a clear "Translation in progress" message (i18n key `methodology.translationInProgress.heading`), a contributor-recruitment CTA (i18n key `methodology.translationInProgress.cta`, links to `CONTRIBUTING.md`), and a fallback link to the EN source (constructed from the methodology path).
     - Layout uses the same `consent-scene`-class spacing tokens (no new spacing tokens introduced).
   - **Build pipeline:** `tools/build-methodology.mjs` recognizes frontmatter field `translationStatus: in-progress` and:
     - For non-EN pages with this flag: render only the masthead + stub composition; suppress body rendering.
     - For EN pages with this flag: **fail with a build error** (`build-methodology: src/.../en/...: translationStatus=in-progress invalid for EN source`); EN is the source-of-truth language, cannot be in-progress.
     - Absence of the field: behave as before (no change to current 4-1 pipeline output).
   - **i18n strings:** new keys added to `src/content/i18n/en/strings.json` (and Russian/Polish stubs at `src/content/i18n/ru/strings.json` + `src/content/i18n/pl/strings.json` if those exist; else only EN — Epic 7 fills the rest).

3. **AC-3 (`src/content/diagrams/validity-envelope-diagram.svg`):**
   - File at exact path: `src/content/diagrams/validity-envelope-diagram.svg`.
   - Inline SVG (not a binary asset). Stdlib build pipeline reads the file and inlines into the rendered methodology HTML for `/methodology/constructs/validity-envelope/` (Story 5.3) and into the consent scene markup (Epic 3 `src/assessment/consent.js` — patched in this story per (6) below).
   - `<title data-i18n-key="diagrams.validityEnvelope.title">` and `<desc data-i18n-key="diagrams.validityEnvelope.desc">` (NFR31 — translated as content keys; values default to EN text inline).
   - Renders the three population zones: "valid for / partial validity / not valid for" with explicit text labels (not just colors — colorblind-safe per WCAG 2.2 AA + NFR12).
   - No raster fills. No filter effects. Pure shapes + text (CSP-safe: no inline `<style>` — colors via `class` attrs styled by `validity-envelope-diagram.css`).
   - File size ≤ 8KB uncompressed (NFR3 asset-budget guidance).

4. **AC-4 (`src/css/components/validity-envelope-diagram.css`):**
   - File at exact path: `src/css/components/validity-envelope-diagram.css`.
   - Styles the SVG's class-attributed shapes:
     - `.zone-valid` → semantic color via `--color-accent-success` (or token equivalent already defined in `primitives.css`)
     - `.zone-partial` → `--color-accent-warning` (or equivalent)
     - `.zone-invalid` → `--color-accent-danger` (or equivalent — surface the actual existing token names in dev-notes after reading `primitives.css`)
   - Two surface contexts via container query OR descendant selector:
     - Inside `.consent-scene` → diagram sizes to half-column width
     - Inside `.methodology-body` (or whatever the standard methodology-page body class is) → diagram sizes to full content width
   - Dark-mode adaptation: rely on existing `--color-*` token swap (per UX spec §494 — `primitives.css` already handles dark mode via custom-property cascade).
   - No `!important`. No inline styles. CSP-safe.

5. **AC-5 (frontmatter schema extension):**
   - `corpus/frontmatter.schema.json` adds:
     ```json
     "translationStatus": {
       "type": "string",
       "enum": ["complete", "in-progress"],
       "description": "Optional. Non-EN pages may declare 'in-progress' to render the translation-in-progress-stub composition. EN pages MUST NOT declare 'in-progress'.",
       "default": "complete"
     }
     ```
   - `tools/lint-frontmatter.mjs` (Story 4-3) recognizes the field. If `translationStatus=in-progress` AND path matches `**/en/**` → lint FAILS with explicit message.
   - Test: `tests/unit/tools/lint-frontmatter.test.mjs` extended with two cases (valid non-EN in-progress; invalid EN in-progress).

6. **AC-6 (Epic-3 consent-scene update):**
   - `src/assessment/consent.js` (or `src/assessment/consent-scene.js` — whichever owns the consent DOM) is updated to inline the now-real `src/content/diagrams/validity-envelope-diagram.svg` content **instead of any prior placeholder** (the placeholder may be a `<div data-placeholder="validity-envelope-diagram">` or similar — confirm by reading the file).
   - `src/css/components/consent-scene.css` references the diagram via `.validity-envelope-diagram` class (no functional change to consent layout; just real diagram replaces stub).
   - Existing Epic 3 consent-scene contract tests in `tests/contract/state-shape.spec.mjs` + `tests/unit/consent-scene.test.mjs` continue to pass — no state-shape changes; only DOM content augmentation.
   - **Regression guard:** the strict-network-trace Playwright spec (Story 1.7 / 3.7) continues to pass — inline SVG is not a network request.

7. **AC-7 (build-pipeline integration tests):**
   - **`tests/unit/build-methodology-translation-stub.test.mjs`** (NEW) — ≥4 tests:
     - non-EN page with `translationStatus: in-progress` → stub composition emitted, EN fallback link present
     - EN page with `translationStatus: in-progress` → build fails with explicit error
     - non-EN page without the field → renders normally (no stub)
     - non-EN page with `translationStatus: complete` → renders normally
   - **`tests/unit/lint-frontmatter.test.mjs`** (EXTENDED) — 2 new tests per AC-5.
   - **`tests/scaffold/methodology-chrome-css.test.mjs`** (NEW) — scaffold tests asserting:
     - `src/css/components/lede.css` exists and contains `--font-size-300` reference
     - `src/css/components/translation-in-progress-stub.css` exists
     - `src/css/components/validity-envelope-diagram.css` exists
     - `src/content/diagrams/validity-envelope-diagram.svg` exists and contains both `<title>` + `<desc>` with `data-i18n-key`
   - **Playwright `tests/playwright/methodology-lede.spec.mjs`** (NEW) — drives the dev-server (already provisioned by Story 3.7 / `tools/dev-server.mjs`), renders `/methodology/v0.1.0/en/scoring/overview/`, asserts the first paragraph's computed font-size matches `--font-size-300` (20px) and the spacing above matches `--space-masthead-to-lede`.

8. **AC-8 (Makefile + CI):**
   - `Makefile` `build` target: no change (build-methodology already runs).
   - `Makefile` `test` target: no change (new tests covered by existing `tests/**/*.spec.mjs` + `tests/unit/**/*.test.mjs` globs).
   - `.github/workflows/pr-checks.yml`: no new job (existing `unit-tests` + `playwright-network-trace` + `lint-frontmatter` cover the new artifacts).
   - `tests/scaffold/ci-matrix.test.mjs`: no `EPIC_1_ACTIVE` extension (no new job names).
   - **Byte-stable Playwright:** `tests/playwright/byte-stable.spec.mjs` (Story 4-2) must continue to pass — the snapshot fixtures cover the existing methodology pages; new SVG inlining changes their rendered HTML, so `make snapshot-update` is part of this story's commit if AC-3/AC-6 alter rendered output for `/methodology/v0.1.0/en/scoring/overview/` etc.
   - **Byte-stable snapshot regen procedure:** when `make snapshot-update` runs, the engineer commits the regenerated golden HTML in the same commit as the source changes (no orphan snapshot drift).

9. **AC-9 (baseline runs — current state):**
   - `make test` → exit 0 with new tests passing.
   - `make lint` → exit 0.
   - `make build` → emits the consent scene with real validity-envelope-diagram inlined; `dist/methodology/v0.1.0/en/scoring/overview/index.html` shows a `.lede` class on the first paragraph.
   - The Playwright network-trace spec continues to assert zero third-party requests against the live slice.
   - Manual smoke: load `/methodology/v0.1.0/en/scoring/overview/` in dev-server, confirm lede is visually distinct from body (larger size, spacing above).

## Tasks / Subtasks

- [ ] **Task 1: TDD red phase — scaffold tests** (AC-7)
  - [ ] Author `tests/scaffold/methodology-chrome-css.test.mjs` asserting files exist + key contract markers.
- [ ] **Task 2: TDD red phase — build-pipeline translation-stub** (AC-7)
  - [ ] Author `tests/unit/build-methodology-translation-stub.test.mjs` with the 4 cases.
- [ ] **Task 3: TDD red phase — lint-frontmatter extension** (AC-7)
  - [ ] Extend `tests/unit/tools/lint-frontmatter.test.mjs` with 2 cases per AC-5.
- [ ] **Task 4: TDD red phase — Playwright lede spec** (AC-7)
  - [ ] Author `tests/playwright/methodology-lede.spec.mjs`.
- [ ] **Task 5: Implement `src/css/components/lede.css`** (AC-1)
  - [ ] Wire into existing CSS aggregator (read `src/css/components/_index.css` or `src/index.html` to confirm import path).
- [ ] **Task 6: Implement `src/content/diagrams/validity-envelope-diagram.svg`** (AC-3)
  - [ ] Three zones with explicit labels (`<text>` elements). Title + desc with `data-i18n-key`.
- [ ] **Task 7: Implement `src/css/components/validity-envelope-diagram.css`** (AC-4)
  - [ ] Zone colors via existing tokens; dual surface sizing (consent vs methodology body).
- [ ] **Task 8: Implement `src/css/components/translation-in-progress-stub.css`** (AC-2)
- [ ] **Task 9: Extend `corpus/frontmatter.schema.json` + `tools/lint-frontmatter.mjs`** (AC-5)
- [ ] **Task 10: Extend `tools/build-methodology.mjs`** (AC-2, AC-6)
  - [ ] Honor `translationStatus: in-progress`.
  - [ ] Inline `validity-envelope-diagram.svg` for `/methodology/.../constructs/validity-envelope/` once Story 5.3 authors that page (currently it doesn't exist; emit inlining helper but no specific path coupling).
  - [ ] i18n string keys added to `src/content/i18n/en/strings.json`.
- [ ] **Task 11: Update Epic-3 consent-scene** (AC-6)
  - [ ] Replace placeholder with real SVG inline.
  - [ ] Verify existing consent-scene tests still pass.
- [ ] **Task 12: Regenerate snapshots if needed** (AC-8)
  - [ ] `make snapshot-update` if rendered HTML for existing methodology stubs changes.
- [ ] **Task 13: Full baseline + manual smoke** (AC-9)
  - [ ] `make test` exit 0; `make lint` exit 0; `make build` exit 0.
  - [ ] Dev-server manual load.
- [ ] **Task 14: Branch + state hygiene**
  - [ ] `tds state set --status=review`. Squash to `epic/5`.

## Dev Notes

### Carry-forward lessons

- **Story 4-1 build-pipeline pattern:** `tools/build-methodology.mjs` is the single owner of methodology HTML emission. New frontmatter fields go through its frontmatter parser. Translation-stub composition is a *new render branch*, not a separate tool.
- **Story 4-2 byte-stable snapshots:** any change to rendered methodology HTML (and the existing 3 EN stub pages from Story 3.6 are *real* methodology pages now: `scoring/overview/`, `scoring/uncertainty/`, `scoring/percentile-to-iq/`) requires `make snapshot-update`. Verify the snapshots cover them and regenerate.
- **Story 3-6 consent-scene state:** the consent scene already loads — confirm whether `validity-envelope-diagram` exists as a placeholder element today before patching (read `src/assessment/consent.js` and `src/css/components/consent-scene.css`).
- **Story 4-3 lint-frontmatter pattern:** the lint already iterates frontmatter keys; adding `translationStatus` enum + the EN-cannot-be-in-progress assertion follows the same per-field validator pattern.
- **Story 3-7 dev-server + Playwright:** `tools/dev-server.mjs` is the programmatic dev-server used by Playwright. New `tests/playwright/methodology-lede.spec.mjs` follows the existing `tests/playwright/full-slice.spec.mjs` shape.
- **Story 4-2 cite-this-page-widget + masthead.css already exist** — confirmed via `ls src/css/components/`. This story does NOT touch them.
- **NFR31 i18n content keys:** the SVG `<title>`/`<desc>` use `data-i18n-key` attributes; Epic 7's i18n harness will resolve them. For v1 single-locale, inline EN text is the rendered default.
- **Lesson `2026-05-19-009`:** CI activations are deferred-validation surfaces — no new CI job needed for this story (no new lint script), so no activation hazard.

### Source-tree touch list (anticipated)

**New:**
- `src/css/components/lede.css`
- `src/css/components/translation-in-progress-stub.css`
- `src/css/components/validity-envelope-diagram.css`
- `src/content/diagrams/validity-envelope-diagram.svg`
- `tests/unit/build-methodology-translation-stub.test.mjs`
- `tests/scaffold/methodology-chrome-css.test.mjs`
- `tests/playwright/methodology-lede.spec.mjs`

**Modified:**
- `tools/build-methodology.mjs` (translationStatus branch + SVG-inlining helper + first-paragraph-lede wrap)
- `tools/lint-frontmatter.mjs` (translationStatus enum + EN-cannot-be-in-progress)
- `corpus/frontmatter.schema.json` (translationStatus field)
- `src/assessment/consent.js` (or whichever file owns the consent-scene DOM — replace placeholder with real SVG)
- `src/css/components/consent-scene.css` (reference real diagram)
- `src/content/i18n/en/strings.json` (3 new keys: `methodology.translationInProgress.heading`, `methodology.translationInProgress.cta`, `methodology.masthead.translatedNoneYet`; plus `diagrams.validityEnvelope.title` + `diagrams.validityEnvelope.desc`)
- `tests/unit/tools/lint-frontmatter.test.mjs` (2 new tests)
- Possibly: `tests/snapshots/methodology/*` (regenerated if rendering changes)

### Testing standards

- TDD: failing tests first via test-author phase.
- `node --test` for unit + scaffold.
- Playwright for the methodology-lede spec.
- Stdlib-only build-pipeline extension (NFR33).
- Existing strict network-trace Playwright must continue to pass.

### References

- `_bmad-output/planning-artifacts/epics.md` Story 5.1 (lines 1349–1370)
- `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR3 (font-size-300), UX-DR12 (lede), UX-DR16 (translation-in-progress-stub), UX-DR28 (validity-envelope-diagram reusability), §494 (component file convention), §863 (--space-masthead-to-lede), §1338+§1343 (component table)
- `_bmad-output/planning-artifacts/architecture.md` §1094 (constructs/validity-envelope path), §1120 (SVG content-keys), §1144–§1151 (CSS component list), §1182 (template path)
- Story 4.1 spec — build-methodology pipeline
- Story 4.3 spec — lint-frontmatter pattern
- Story 3.6 spec — existing EN methodology stub pages (now expanded)
- NFR31 (i18n content keys for SVG), NFR12 (a11y/colorblind-safe), NFR3 (asset budget)
- FR45 (artifact-slot pattern — same shape as fallback-copy for missing artifacts)

## Dev Agent Record

### Agent Model Used

<!-- Populated by engineer at execute-story time -->

### Debug Log References

### Completion Notes List

### File List
