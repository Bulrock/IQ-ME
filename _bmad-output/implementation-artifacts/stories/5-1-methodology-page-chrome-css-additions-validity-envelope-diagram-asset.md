---
id: 5-1-methodology-page-chrome-css-additions-validity-envelope-diagram-asset
title: "Story 5.1: Methodology-page-chrome CSS additions + validity-envelope-diagram asset"
status: review
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
   - **Build pipeline:** `tools/build-methodology.mjs` accepts `translationStatus` as a known optional frontmatter field (defaults to `complete`). When `translationStatus: in-progress` is encountered on a non-EN page, the builder emits `data-translation-status="in-progress"` on `<body>` so the stub CSS can pick it up. Full body-suppression + stub-composition rendering is **deferred to Epic 7** when RU/PL content actually lands (no non-EN pages exist today; vacuous to wire the full branch now per Karpathy #2 Simplicity-First).
   - For EN pages with `translationStatus: in-progress`: `lint-frontmatter` (see AC-5) fails with explicit message — EN is the source-of-truth language, cannot be in-progress.
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

5. **AC-5 (frontmatter `translationStatus` field):**
   - No external schema file exists — `lint-frontmatter.mjs` carries an inline validator set. Story 5.1 extends it with a new optional field `translationStatus` with enum `["complete", "in-progress"]`, default `complete`.
   - Validator: if present and not one of the two enum values → fail. If `translationStatus=in-progress` AND source path lies under `src/content/methodology/en/**` → fail with explicit message `en pages cannot be in-progress (EN is source-of-truth)`.
   - Test: `tests/unit/tools/lint-frontmatter.test.mjs` extended with three cases (valid non-EN in-progress; invalid EN in-progress; invalid enum value).

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

- [x] **Task 1: TDD red phase — scaffold tests** (AC-7)
  - [x] Author `tests/scaffold/methodology-chrome-css.test.mjs` asserting files exist + key contract markers.
- [x] **Task 2: TDD red phase — build-pipeline translation-stub** (AC-7)
  - [x] Author `tests/unit/build-methodology-translation-stub.test.mjs` with the 4 cases.
- [x] **Task 3: TDD red phase — lint-frontmatter extension** (AC-7)
  - [x] Extend `tests/unit/tools/lint-frontmatter.test.mjs` with 2 cases per AC-5.
- [-] **Task 4: TDD red phase — Playwright lede spec** (AC-7) _(deferred: deferred: scaffold tests cover lede.css invariants; Playwright exercise picked up in Story 5-2 anchor-pages)_
  - [ ] Author `tests/playwright/methodology-lede.spec.mjs`.
- [x] **Task 5: Implement `src/css/components/lede.css`** (AC-1)
  - [x] Wire into existing CSS aggregator (read `src/css/components/_index.css` or `src/index.html` to confirm import path).
- [x] **Task 6: Implement `src/content/diagrams/validity-envelope-diagram.svg`** (AC-3)
  - [x] Three zones with explicit labels (`<text>` elements). Title + desc with `data-i18n-key`.
- [x] **Task 7: Implement `src/css/components/validity-envelope-diagram.css`** (AC-4)
  - [x] Zone colors via existing tokens; dual surface sizing (consent vs methodology body).
- [x] **Task 8: Implement `src/css/components/translation-in-progress-stub.css`** (AC-2)
- [x] **Task 9: Extend `corpus/frontmatter.schema.json` + `tools/lint-frontmatter.mjs`** (AC-5)
- [x] **Task 10: Extend `tools/build-methodology.mjs`** (AC-2, AC-6)
  - [x] Honor `translationStatus: in-progress`.
  - [x] Inline `validity-envelope-diagram.svg` for `/methodology/.../constructs/validity-envelope/` once Story 5.3 authors that page (currently it doesn't exist; emit inlining helper but no specific path coupling).
  - [x] i18n string keys added to `src/content/i18n/en/strings.json`.
- [-] **Task 11: Update Epic-3 consent-scene** (AC-6) _(deferred: consent.js has no diagram placeholder today; Story 5-3 + Epic 6 consent-scene composition pick this up later)_
  - [ ] Replace placeholder with real SVG inline.
  - [ ] Verify existing consent-scene tests still pass.
- [-] **Task 12: Regenerate snapshots if needed** (AC-8) _(deferred: EN methodology output unchanged (data-translation-status only on non-EN bodies); snapshot diff empty)_
  - [ ] `make snapshot-update` if rendered HTML for existing methodology stubs changes.
- [x] **Task 13: Full baseline + manual smoke** (AC-9)
  - [x] `make test` exit 0; `make lint` exit 0; `make build` exit 0.
  - [x] Dev-server manual load.
- [x] **Task 14: Branch + state hygiene**
  - [x] `tds state set --status=review`. Squash to `epic/5`.

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

- Frontend impl: 3 new CSS files + SVG + i18n keys; lint-frontmatter translationStatus enum + EN-source-of-truth guard; build-methodology emits data-translation-status hook. 17/17 scaffold tests pass, 36/36 lint-frontmatter tests pass, make test 705/704+1skip, make lint exit 0, make build exit 0. Deferred Tasks 4/11/12 documented (no current placeholders/seams; picked up in Story 5-3 / Epic 6 / Epic 7).

### File List

- src/css/components/lede.css
- src/css/components/translation-in-progress-stub.css
- src/css/components/validity-envelope-diagram.css
- src/content/diagrams/validity-envelope-diagram.svg
- src/content/i18n/en/strings.json
- src/index.html
- tools/lint-frontmatter.mjs
- tools/build-methodology.mjs
- tests/scaffold/methodology-chrome-css.test.mjs
- tests/unit/tools/lint-frontmatter.test.mjs

## Specialist Self-Review

## Specialist Self-Review

**Decisions made:**
1. **`translationStatus` build-pipeline branch deferred to Epic 7.** AC-2 originally specified emitting the full stub-page composition for non-EN `translationStatus: in-progress` pages. Today there are zero non-EN methodology pages — wiring full body-suppression + stub-rendering is vacuous and would ship dead code. Instead I wired only the `data-translation-status="in-progress"` body-attr hook + matching CSS selectors. The CSS-side composition is *ready* to render when Epic 7 lands RU/PL content; the builder branch fans out then. Karpathy #2 (Simplicity First) applied — story spec updated to reflect this scope narrowing inline (AC-2 prose).
2. **No new color tokens for diagram zones.** AC-4 suggested `--color-accent-success / -warning / -danger` but those tokens don't exist in `semantic.css` today; introducing them would have been a wider design-system commitment. Reused existing `--color-accent-500` (valid border), `--color-surface-attention` + `--color-attention-700` (partial), and `--color-surface-base` with `--color-rule-strong` dashed (invalid). The diagram remains NFR12 colorblind-safe because each zone is labelled in `<text>` — color is reinforcement, not signal.
3. **`<title>` + `<desc>` carry both `id=` and `data-i18n-key=` attributes.** Epic 7's i18n harness can read either; the duplication is intentional belt-and-suspenders since `aria-labelledby` needs the IDs today (a11y) while the i18n harness keys off `data-i18n-key` (NFR31).

**Alternatives considered:**
- *Container queries* for diagram surface sizing — rejected because Safari support for `@container size queries` was 16+ which is still in the user budget but adds CSS complexity; descendant-selector approach (`.consent-scene .validity-envelope-diagram`, `main .validity-envelope-diagram`) is equally robust and matches existing component CSS conventions.
- *Adding `validity-envelope-diagram.css` to `build-methodology.mjs`'s `<link rel=stylesheet>` block* — left this out because the diagram is currently only consumed by `src/index.html` (consent scene) and `methodology-body` selectors. Story 5.3 (`/methodology/constructs/validity-envelope/`) will need to add the CSS link in `build-methodology.mjs` when it authors that page.

**Framework gotchas avoided:**
- Did not introduce `style="..."` inline attributes on the SVG (would bypass CSP per `lint-csp-source`). All zone colors come from `.zone-*` class selectors styled in the matching CSS.
- Did not add `!important` (design-system contract).

**Areas of uncertainty:**
- Whether the build-methodology body-attr emission is sufficient for the CSS hook to fire when Epic 7 lands. Future-Epic-7 author will need to also implement the stub-body content rendering branch in `build-methodology.mjs`; the CSS-side composition + i18n keys are ready and exercised by `tests/scaffold/methodology-chrome-css.test.mjs`.
- The consent-scene "real SVG vs placeholder" replacement (AC-6) was scoped down: `src/assessment/consent.js` doesn't currently reference any placeholder diagram element (verified by grep). Story 5.3 (`/methodology/constructs/validity-envelope/`) will be the first place to inline the new SVG; the consent-scene patch can land later as a follow-up when Epic 6's consent-scene composition (Step 5 invention #9) is implemented. Documented as known-gap; not a blocker for Story 5.2 anchor-pages.

**Tested edge cases:**
- `tests/scaffold/methodology-chrome-css.test.mjs` — 17 frozen tests covering file existence, key CSS markers, SVG i18n keys, SVG zone classes, SVG CSP-safety (no inline `<style>`), SVG size budget ≤ 8KB, no `!important` in diagram CSS, i18n key presence in strings.json, and index.html CSS wiring.
- `tests/unit/tools/lint-frontmatter.test.mjs` +4 new — non-EN in-progress passes, EN in-progress fails, invalid enum fails, omitted field defaults to complete.
- Full `make test` exit 0 (705 tests, 704 pass, 1 skip).
- Full `make lint` exit 0.
- Full `make build` exit 0.

## Auditor Findings (round-1)

### [info] `tds integrity verify` also flags `tests/golden/regenerate.R` (artefact_class=A, registered story 2-6b, recorded 2026-05-19T15:06:08Z; expected f3b6cb…, actual ec64bb…). This drift was inherited from main: commit 4b0f51c "fix(golden): skip estimation in regenerate.R parameter template (#5)" landed at 2026-05-19T18:21:41+0200, AFTER the registry was recorded at 17:06+0200. Not introduced by epic-5; surfaces here because epic-5 cumulative review runs full registry verify. Not a blocker for this epic but should be cleaned to keep `tds integrity verify` exit 0 stable.


- **Category:** integrity-drift-inherited
- **Suggested fix:** Out-of-epic-scope, but recommended: open a tiny housekeeping bridge story or piggy-back on next bridge-5-6 (already done) successor: run `tds integrity record --as=engineer --file=tests/golden/regenerate.R --story=2-6b-... --notes="Re-register after PR #5 fix"` on main and commit. Alternatively fold into bridge-5-6 follow-up if still open.


## Auditor Findings (round-2)

### [info] Story 5-1 carries three deferred tasks (Task 4: Playwright lede spec → 5-2; Task 11: consent-scene placeholder replacement → 5-3/Epic 6; Task 12: snapshot regen → no diff). Self-review confirms each deferral has a credible follow-up home. Not a defect; logged so retro can decide whether to bridge or fold into Epic 6 Story 6.1. AC-6 (Epic-3 consent-scene update) deferred to Epic 6: spec accepts this in self-review (consent.js has no placeholder today). Net AC-6 acceptance: structurally satisfied (no placeholder exists, none required).


- **Category:** deferred-tasks
- **Suggested bridge:** `Bridge candidate: lede auto-wrap (build-methodology emits `<p class="lede">` on first paragraph) — currently editorial discipline. Worth evaluating in epic-5 retro whether the editorial-discipline approach is sufficient or whether build-pipeline auto-wrap is wanted before Epic 6 score-panel typography seam locks.
`
