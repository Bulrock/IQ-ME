---
id: 4-7-stale-translation-hatnote-component-lint-translation-parity-no-op-stub
title: "Story 4.7: stale-translation-hatnote component + lint-translation-parity no-op stub"
status: review
tds:
  primary_specialist: engineer
  story_tags:
    - methodology-corpus
    - hatnote
    - lint
    - translation-parity
    - i18n
---

# Story 4.7: stale-translation-hatnote component + lint-translation-parity no-op stub

## Story

As a **methodology corpus reader on a Russian or Polish page that has drifted from the EN source**,
I want **the stale-translation hatnote to be a rendered component on the page (not a footer CI artifact) that visually signals drift the moment it occurs**,
so that **translation drift visibility is part of the design language (UX-DR15 — "load-bearing trust signal") and is mechanically caught by `lint-translation-parity` once non-EN locales exist in Epic 7**.

This story ships the **infrastructure** for stale-translation detection at Epic 4 close, in advance of Epic 7's RU/PL content. The hatnote component renders on any methodology page that has `[data-translation-stale="true"]` on the page wrapper. The builder sets that attribute when frontmatter `sourceHashEN` ≠ current EN-source SHA. The `lint-translation-parity` lint is a no-op stub at Epic 4 (no non-EN content yet — Epic 7 wires per-locale parity).

This story owns:

1. **`src/css/components/stale-translation-hatnote.css`** — UX-DR15 load-bearing trust signal:
   - Renders at page top (above the lede, below the masthead)
   - `role="note"` (NOT `role="alert"` — that's lint-blocked by Story 1.x `lint-no-role-alert`)
   - `--color-surface-attention` background, dated message text
   - Visible only when wrapper has `[data-translation-stale="true"]`
2. **`tools/lint-translation-parity.mjs`** — no-op stub. Walks `src/content/methodology/`. If no non-EN content exists (`src/content/methodology/ru/` and `pl/` are `.gitkeep`-only) → emit `lint-translation-parity: WARN no non-EN content yet (Epic 7 wires full coverage); skipped`. Exit 0. If non-EN pages exist, run a placeholder check that just verifies frontmatter `sourceHashEN` is set and is 64-hex; deeper EN-hash diff comparison defers to Epic 7. **The lint contract is stable** — same script runs at Epic 7 with full coverage logic flipped on; this story plants the affordance.
3. **`tools/build-methodology.mjs`** — for each page, compute the page's actual EN source hash; if the page is a non-EN locale AND its frontmatter `sourceHashEN` ≠ current EN source SHA → set `data-translation-stale="true"` on the page wrapper. Currently a no-op because there are no non-EN pages. Implement the hook so Epic 7 doesn't need to refactor.
4. **HTML template extension** — add `<aside class="stale-translation-hatnote" hidden>` placeholder in the rendered output between masthead and main. When `data-translation-stale="true"` is set on `<body>` (or wrapper), CSS reveals the hatnote.
5. **Tests** — CSS file exists + correct selectors; lint no-op WARN behavior; builder sets/doesn't-set the data attribute correctly across locales.

## Acceptance Criteria

1. **AC-1 (`src/css/components/stale-translation-hatnote.css`):**
   - File at exact path: `src/css/components/stale-translation-hatnote.css`.
   - Selectors:
     - `.stale-translation-hatnote { display: none; }`
     - `[data-translation-stale="true"] .stale-translation-hatnote { display: block; }`
   - Visual: `--color-surface-attention` background (from `semantic.css`), padding, hairline border-bottom matching masthead.
   - `role="note"` is set in the HTML template (CSS doesn't set it); CSS just owns the visual layer.
   - **NOT `role="alert"`** — `lint-no-role-alert` would block. The note role per UX-DR15 + Story 1-x lints.
   - Pure CSS, no inline styles (NFR7).
   - Imported by builder via `<link rel="stylesheet" href="/src/css/components/stale-translation-hatnote.css">`.

2. **AC-2 (`tools/lint-translation-parity.mjs`):**
   - File at exact path: `tools/lint-translation-parity.mjs`.
   - Stdlib-only (NFR33). Pure ESM (`.mjs`).
   - **Invocation:** `node tools/lint-translation-parity.mjs` walks `src/content/methodology/`.
   - **Phase 1 (always):** check for non-EN methodology content (`src/content/methodology/{ru,pl}/**/*.md`). If none found → emit one WARN line:
     `lint-translation-parity: WARN no non-EN content yet (Epic 7 wires full coverage); skipped`
     Exit 0.
   - **Phase 2 (when non-EN content exists — defensive, in case Epic 7 partial-content arrives during Epic 4):**
     For each non-EN page, validate frontmatter `sourceHashEN` is a 64-char hex string (defense-in-depth with `lint-frontmatter`). If absent or malformed → fail with clear message.
     Full EN-hash diff comparison is OUT OF SCOPE for this story; deferred to Epic 7.
   - **Per-locale summary:** emit one line per locale `lint-translation-parity: EN: source-of-truth; RU/PL: not yet authored (Epic 7)` so contributors see the deferred state.
   - **Success mode:** exit 0.
   - Stdlib-only, ~80 LOC.

3. **AC-3 (`tools/build-methodology.mjs` translation-stale hook):**
   - For each page being rendered, compute `currentEnSourceHash` per the locale:
     - If `page.lang === "en"`: skip — EN pages can't be stale relative to themselves.
     - If `page.lang ∈ {"ru", "pl"}`: look up the matching EN source path `src/content/methodology/en/<relative-path>`. If the EN source file does NOT exist → no diff possible, no hatnote (or emit a WARN to stderr). If it exists, compute SHA-256 of its body (frontmatter-stripped).
   - Compare `currentEnSourceHash` to `page.frontmatter.sourceHashEN`. If mismatch → set `data-translation-stale="true"` on the rendered page's body (or root wrapper).
   - **Currently** (no non-EN pages exist), this hook never fires — but the implementation is in place. Test it via a fixture-based unit test (fake non-EN page in tmpdir with mismatched hash → assert data attribute set).
   - The template emits:
     ```html
     <body data-lang="{lang}" {data-translation-stale-attr}>
       <header class="methodology-masthead">...</header>
       <aside class="stale-translation-hatnote" role="note">
         <p>This page may be out of date relative to its English source. <a href="<en-page-url>">View source EN page</a>.</p>
       </aside>
       <main>...</main>
       ...
     </body>
     ```
     where `{data-translation-stale-attr}` is `data-translation-stale="true"` when drift detected, else empty.

4. **AC-4 (HTML template — hatnote placeholder):**
   - `<aside class="stale-translation-hatnote" role="note">` rendered between masthead and main on every page.
   - CSS hides it by default; visible only when `[data-translation-stale="true"]` is on an ancestor.
   - The hatnote contains a `<p>` element with text "This page may be out of date relative to its English source." + a link to the EN source path.
   - For EN pages, the hatnote is still in the DOM (hidden by CSS) — keeps the template uniform across locales; no per-locale template branching needed.

5. **AC-5 (current-state baselines):**
   - `node tools/lint-translation-parity.mjs` against current repo → exit 0, one WARN line emitted (no non-EN content yet).
   - `make build-methodology` against current repo → 4 pages render with hatnote `<aside>` present-but-hidden; no `data-translation-stale` attribute on any page (no drift detectable).
   - Golden snapshots regenerate via `make snapshot-update` to reflect the new hatnote DOM (small diff per page).

6. **AC-6 (Makefile + CI):**
   - `Makefile` `lint` adds `node tools/lint-translation-parity.mjs` after `lint-license-provenance` from Story 4-5.
   - `pr-checks.yml`: add `lint-translation-parity` job (mirror Story 4-3/4/5 patterns).
   - `tests/scaffold/ci-matrix.test.mjs` `EPIC_1_ACTIVE` set extended.

7. **AC-7 (tests — TDD coverage):**
   - **`tests/unit/tools/lint-translation-parity.test.mjs`** (NEW, mirror-rule): ≥6 tests:
     - no non-EN content → exit 0 with WARN
     - non-EN page exists with valid `sourceHashEN` → exit 0
     - non-EN page exists with missing `sourceHashEN` → exit 1
     - non-EN page exists with malformed `sourceHashEN` (not 64-hex) → exit 1
     - per-locale summary line emitted in all cases
     - per-locale summary correctly reports "RU not yet authored" if RU dir is `.gitkeep`-only
   - **`tests/unit/build-methodology.test.mjs`** (EXTEND): add tests for:
     - `<aside class="stale-translation-hatnote" role="note">` present in every rendered page
     - For an EN page: no `data-translation-stale` attribute on `<body>`
     - For a fixture RU page with matching `sourceHashEN` and an existing EN counterpart → no `data-translation-stale` attribute
     - For a fixture RU page with mismatched `sourceHashEN` and an existing EN counterpart → `data-translation-stale="true"` on `<body>`
     - For a fixture RU page without an EN counterpart → no attribute (graceful)
   - **`tests/scaffold/lint-translation-parity-coverage.test.mjs`** (NEW): runs lint against current repo → exit 0, single WARN.
   - **`tests/snapshots/methodology/en/**/*.html`** regenerated via `make snapshot-update` — small diff (hatnote `<aside>` added per page).
   - Full `make test` exit 0. `make lint` exit 0. Playwright byte-stable still passes.

## Tasks / Subtasks

- [x] **Task 1: TDD red phase for `tools/lint-translation-parity.mjs`** (AC-2, AC-7)
  - [x] Unit tests with ≥6 failing tests using `mkdtempSync` fixture repos.
- [x] **Task 2: TDD red phase for builder hatnote + data-stale hook** (AC-3, AC-4, AC-7)
  - [x] Extend `tests/unit/build-methodology.test.mjs` with failing tests for hatnote presence + data-attribute behavior under different fixture configurations.
- [x] **Task 3: TDD red phase for scaffold coverage** (AC-5, AC-7)
  - [x] Author `tests/scaffold/lint-translation-parity-coverage.test.mjs`.
- [x] **Task 4: Implement `src/css/components/stale-translation-hatnote.css`** (AC-1)
  - [x] CSS-only; uses semantic vars.
- [x] **Task 5: Implement `tools/lint-translation-parity.mjs`** (AC-2)
  - [x] No-op stub for current single-locale state; defensive `sourceHashEN` check for any non-EN page that may arrive.
- [x] **Task 6: Extend `tools/build-methodology.mjs`** (AC-3, AC-4)
  - [x] Add EN-source-hash computation hook.
  - [x] Render `<aside class="stale-translation-hatnote" role="note">` placeholder.
  - [x] Set `data-translation-stale="true"` on `<body>` when drift detected.
  - [x] Add `<link>` for the new CSS file.
- [x] **Task 7: Regenerate golden snapshots** (AC-5)
  - [x] `make snapshot-update` → diff 4 files (hatnote added per page).
- [x] **Task 8: Verify byte-stable Playwright still passes** (AC-5)
  - [x] `npx playwright test tests/playwright/byte-stable.spec.mjs` exit 0.
- [x] **Task 9: Makefile + CI** (AC-6)
  - [x] Add lint to `make lint`; activate `pr-checks.yml` job; update `ci-matrix.test.mjs`.
- [x] **Task 10: Full test + lint pass** (AC-7)
  - [x] `make test` exit 0.
  - [x] `make lint` exit 0.
- [x] **Task 11: Branch + state hygiene**
  - [x] `tds state set --status=review`. Squash to epic/4.

## Dev Notes

### Carry-forward lessons

- **Story 4-1 frontmatter parser:** reuse `parseFrontmatter` for the lint + builder hash computation.
- **Story 4-2 byte-stable:** any template change must preserve determinism. The EN-source-hash is a deterministic computation (SHA-256 of EN page body); same inputs → same output. Verify with byte-stable Playwright after impl.
- **Story 4-6 cite-widget pattern:** template extension + golden snapshot regen is a known pattern. Same approach here.
- **Story 1-x `lint-no-role-alert`:** the hatnote uses `role="note"`, NOT `role="alert"`. Test that the lint doesn't flag the hatnote.

### Source-tree touch list (anticipated)

**New:**
- `src/css/components/stale-translation-hatnote.css`
- `tools/lint-translation-parity.mjs`
- `tests/unit/tools/lint-translation-parity.test.mjs`
- `tests/scaffold/lint-translation-parity-coverage.test.mjs`

**Modified:**
- `tools/build-methodology.mjs` (hatnote placeholder + data-stale hook + new CSS link)
- `tests/unit/build-methodology.test.mjs` (extended)
- `tests/snapshots/methodology/en/**/*.html` (4 files regenerated)
- `Makefile` (`lint` target)
- `.github/workflows/pr-checks.yml` (activate `lint-translation-parity` job)
- `tests/scaffold/ci-matrix.test.mjs` (`EPIC_1_ACTIVE`)

### Testing standards

- TDD: failing tests first.
- `node --test` for unit + scaffold.
- Per-test `mkdtempSync` for fixture-tree tests (especially for the data-stale hook tests — need fake RU + EN counterparts).
- Stdlib-only (NFR33).

### References

- `_bmad-output/planning-artifacts/epics.md` Story 4.7 (lines 1297–1318)
- `_bmad-output/planning-artifacts/ux-design-specification.md` UX-DR15 (stale-translation hatnote as load-bearing trust signal)
- `tools/lint-no-role-alert.mjs` — existing lint; verify hatnote `role="note"` doesn't trip it
- `src/css/components/masthead.css` (Story 4-6) — adjacent component pattern reference
- Story 4-1 `parseFrontmatter` + body-extraction patterns

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (bmad-tds-execute-story → engineer + test-author roles).

### Debug Log References

- Phase A red-phase confirm: `node --test tests/unit/tools/lint-translation-parity.test.mjs tests/scaffold/lint-translation-parity-coverage.test.mjs` → 8/8 fail (no script yet).
- Phase A red-phase confirm: builder extensions → 5/5 fail (no hatnote yet).
- Phase B green: full `make test` → 646 pass / 0 fail / 1 pre-existing skip.
- Phase B green: `make lint` → exit 0.
- Phase B green: byte-stable Playwright → 1 passed (557ms).
- `lint-no-role-alert` against the new hatnote `role="note"` → ok (20 files scanned). Confirms strict `role="alert"` regex is unaffected.
- Self-review: `/tmp/self-review-4-7.md`.

### Completion Notes List

- The builder was previously hardcoded to walk only `src/content/methodology/en/` via a `LANG` constant. Story 4-7 lifts this restriction to iterate `LOCALES = ["en", "ru", "pl"]` so the EN-source-hash hook can fire on non-EN pages. EN-only behaviour at Epic 4 close is preserved because RU/PL trees are `.gitkeep`-only.
- The hatnote is rendered uniformly on every page (no per-locale template branching) so EN pages retain the same DOM shape; CSS hides it unless `[data-translation-stale="true"]` is on an ancestor. EN pages never carry the attribute.
- `enSourceHashFor` is graceful: missing EN counterpart → WARN to stderr + no hatnote reveal. The fixture test "RU without EN counterpart" covers this path.
- Body-only SHA-256 (frontmatter-stripped) is the parity contract — same algorithm at Epic 7 when full coverage flips on.
- `lint-translation-parity` is a no-op stub at Epic 4 close; the per-locale summary lines (`EN: source-of-truth`, `RU/PL: not yet authored (Epic 7)`) are emitted both in WARN mode and Phase-2 mode to keep the contributor signal stable.
- Snapshot diff: 4 EN snapshot files each gained a stylesheet link, a `data-lang="en"` attribute on `<body>`, and the hatnote `<aside>` block (6 added lines per file).

### File List

**New:**
- `src/css/components/stale-translation-hatnote.css`
- `tools/lint-translation-parity.mjs`
- `tests/unit/tools/lint-translation-parity.test.mjs`
- `tests/scaffold/lint-translation-parity-coverage.test.mjs`

**Modified:**
- `tools/build-methodology.mjs` (multi-locale walk; EN-source-hash hook; hatnote template; new CSS link; `LANG` constant superseded by `LOCALES` iteration with `lang`-parameterised render/output helpers)
- `tests/unit/build-methodology.test.mjs` (+5 Story-4-7 tests covering hatnote presence, EN-no-attr, RU mismatched-hash, RU matching-hash, RU no-counterpart graceful)
- `tests/snapshots/methodology/en/provenance/icar-license.html`
- `tests/snapshots/methodology/en/scoring/overview/index.html`
- `tests/snapshots/methodology/en/scoring/percentile-to-iq/index.html`
- `tests/snapshots/methodology/en/scoring/uncertainty/index.html`
- `Makefile` (`lint-translation-parity` added after `lint-license-provenance` in `lint` target)
- `.github/workflows/pr-checks.yml` (`lint-translation-parity` job activated — Story-4.7 comment + checkout + setup-node + run)
- `tests/scaffold/ci-matrix.test.mjs` (`EPIC_1_ACTIVE` extended with `lint-translation-parity`)
