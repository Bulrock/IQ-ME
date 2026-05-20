---
id: 4-6-masthead-component-cite-this-page-widget-apa-wikipedia-template
title: "Story 4.6: Masthead component + cite-this-page widget (APA + Wikipedia-template)"
status: done
tds:
  primary_specialist: engineer
  story_tags:
    - methodology-corpus
    - masthead
    - citation
    - css
    - widget
---

# Story 4.6: Masthead component + cite-this-page widget (APA + Wikipedia-template)

## Story

As a **citer (Karolina journey — PL Wikipedia editor)**,
I want **every methodology page to render a masthead (title + version + DOI + last-reviewed + named reviewer) AND a cite-this-page widget producing APA + Wikipedia-template citations with version + DOI pre-filled**,
so that **the citability vision (Journey 5) is operational from Epic 4 — a Wikipedia editor preparing an external link can copy a compliant citation in one click without needing to take the test or contact the maintainer**.

This story owns:

1. **`src/css/components/masthead.css`** — the load-bearing trust signal per UX-DR11. Renders: page title (at `--font-size-700`), version string, DOI placeholder, last-reviewed date, named reviewer + GitHub handle, bottom hairline rule.
2. **`src/css/components/cite-this-page-widget.css`** — visual styling for the cite affordance + the two cite-format `<pre>` blocks.
3. **`src/assessment/cite-this-page.js`** — pure-JS module (no framework). Renders the citation widget on each methodology page. Reads frontmatter values from `<meta>` tags emitted by the builder. **Note:** this is a slight scope expansion — the spec says "clicking it copies an APA citation". To implement copy-to-clipboard, we need `navigator.clipboard.writeText()` which requires JS. Pure-CSS-only is insufficient. The JS module is ~50 LOC + tests.
4. **`tools/build-methodology.mjs` HTML template extension** — replaces the minimal chrome from Story 4-1 with the full masthead per AC-1 + injects the cite-widget DOM container + injects `<meta name="iqme-*">` tags carrying frontmatter (title, version, doi, lastReviewed, reviewer, reviewerHandle, lang) for the cite JS to read.
5. **DOI handling** — DOI field rendered as `"DOI: pending v1.0.0 release"` placeholder text with a `<time>`-element data attribute that `release.yml` (Epic 8) will populate. Visible-fallback discipline (per Story 1.3 / John).
6. **Golden snapshot regeneration** — the 4 in-repo pages' snapshots from Story 4-2 will all change. Run `make snapshot-update` to refresh; commit the diff.
7. **Tests** — unit tests for the cite-this-page JS (APA + Wikipedia formats, copy-to-clipboard via mocked `navigator.clipboard`), builder template changes verified via new builder unit tests, scaffold smoke that masthead renders.

## Acceptance Criteria

1. **AC-1 (`src/css/components/masthead.css`):**
   - File at exact path: `src/css/components/masthead.css`.
   - Implements the masthead per UX-DR11 + Karolina-60s checklist item #1 ("See the page title, version, DOI, and license without scrolling"):
     - `header.methodology-masthead` selector
     - Page title at `--font-size-700` per UX-DR3 (from `src/css/primitives.css`)
     - Version string visible (e.g., "v0.1.0")
     - DOI placeholder line (visible even when DOI not yet minted — fulfills FR29 + Story 1-3 visible-fallback discipline)
     - Last-reviewed date from frontmatter
     - Named reviewer + GitHub handle
     - Bottom hairline rule (`border-bottom: 1px solid var(--color-line)`)
   - Pure CSS; uses CSS custom properties from `primitives.css` + `semantic.css` (Story 1.10).
   - No inline styles (NFR7 CSP enforcement).
   - Imported by `src/index.html` and by methodology pages (via `<link rel="stylesheet">` emitted by builder).

2. **AC-2 (`src/css/components/cite-this-page-widget.css`):**
   - File at exact path: `src/css/components/cite-this-page-widget.css`.
   - Implements visual styling for `.cite-this-page-widget` (the affordance) + `.cite-format-apa` + `.cite-format-wikipedia` (the two `<pre>` blocks).
   - Karolina-60s checklist item #3: "Find the cite-this-page affordance without searching." The widget MUST be visible above the fold (i.e., positioned within the page chrome, not at footer-only).
   - Pure CSS; no inline styles.

3. **AC-3 (`src/assessment/cite-this-page.js`):**
   - File at exact path: `src/assessment/cite-this-page.js`.
   - Pure-JS ES module. Stdlib browser API only (no third-party).
   - **Reads page metadata** from `<meta>` tags injected by the builder:
     - `<meta name="iqme-title" content="...">`
     - `<meta name="iqme-version" content="v0.1.0">`
     - `<meta name="iqme-doi" content="">` (empty until Epic 8 mints)
     - `<meta name="iqme-last-reviewed" content="2026-05-19">`
     - `<meta name="iqme-reviewer" content="TBD">`
     - `<meta name="iqme-reviewer-handle" content="@TBD-en-reviewer">`
     - `<meta name="iqme-lang" content="en">`
     - `<meta name="iqme-url" content="https://...">` (page's canonical URL; for v0.1.0 use relative URL fallback — Epic 8 ships canonical URL injection)
   - **Renders two `<pre>` blocks** inside `<div class="cite-this-page-widget">`:
     - **APA citation:** `<reviewer>. (<lastReviewed-year>). <title>. *IQ-ME Methodology Corpus*, <version>. <url|doi>`
       - DOI empty → use URL fallback `<url>` (the canonical page URL)
       - DOI populated → use `https://doi.org/<doi>`
     - **Wikipedia-template citation:** `{{cite web | title=<title> | website=IQ-ME Methodology Corpus | date=<lastReviewed> | version=<version> | url=<url> | doi=<doi-or-empty> | reviewer=<reviewer> }}`
   - **Click handler:** clicking the widget button copies the focused/displayed citation (APA by default; toggle via tab/button to Wikipedia-template) to clipboard via `navigator.clipboard.writeText()`.
   - **Initialization:** auto-init on DOMContentLoaded — find `<div data-cite-widget>` placeholder injected by builder, replace with full widget DOM.
   - **No inline styles, no inline scripts** (NFR7 CSP).
   - **Size budget:** ~80–120 LOC. Lives in `src/assessment/` per existing convention (Domain A per docs/domain-map.md). Currently `src/assessment/` is for assessment-SPA modules; the cite widget is methodology-corpus, but since methodology pages are rendered as static HTML they need a script tag pointing somewhere — `src/assessment/cite-this-page.js` is acceptable per existing Domain-A convention OR move to `src/scripts/cite-this-page.js` if engineer prefers a new top-level dir (architecture.md doesn't pin this; engineer choice).
     - **Recommended:** put it in `src/assessment/cite-this-page.js` — domain-map allows D→A reads (tools can read from assessment), and assessment-SPA pages will not load this script (it's only injected by methodology pages via builder). Simpler than creating a new top-level dir.

4. **AC-4 (`tools/build-methodology.mjs` HTML template extension):**
   - **Header** in the emitted HTML extends the Story 4-1 minimal chrome to a full masthead:
     ```html
     <header class="methodology-masthead">
       <h1 class="methodology-masthead__title">{title}</h1>
       <p class="methodology-masthead__version">{version}</p>
       <p class="methodology-masthead__doi" data-doi-pending>DOI: pending v1.0.0 release</p>
       <p class="methodology-masthead__last-reviewed">Last reviewed: <time datetime="{lastReviewed}">{lastReviewed}</time></p>
       <p class="methodology-masthead__reviewer">Reviewer: {reviewer} ({reviewerHandle})</p>
     </header>
     ```
   - **The renderer-emitted `<h1>` is now redundant with the masthead `<h1>`**. Decision: the masthead `<h1>` carries the title; the renderer's body should not emit a `<h1>` (Story 4-1 renderer rejected zero level-1 headings — this story needs to relax that OR the methodology source files should drop their `# Title` line OR the builder strips it before passing to the renderer).
     - **Recommended:** builder strips the leading `# <title>` heading line from the markdown body before passing to renderer, OR the renderer gains an `allowZeroH1: true` option. Engineer chooses. Either way, the source `.md` files retain their `# Title` line (consistent with markdown norms).
   - **Cite widget placeholder** injected after `<main>`:
     ```html
     <aside class="cite-this-page-affordance"><div data-cite-widget></div></aside>
     ```
   - **`<head>` meta tags** for the cite-this-page JS to consume — emit one `<meta name="iqme-*">` per AC-3 field.
   - **Script tag** in `<head>`:
     ```html
     <script type="module" src="/src/assessment/cite-this-page.js" defer></script>
     ```
     (Relative URL discipline per NFR17 — the leading `/` is OK because the corpus deploys under a path-prefix-aware host; engineer should verify the existing pattern.)
   - **CSS links** in `<head>`:
     ```html
     <link rel="stylesheet" href="/src/css/components/masthead.css">
     <link rel="stylesheet" href="/src/css/components/cite-this-page-widget.css">
     ```

5. **AC-5 (DOI placeholder discipline):**
   - DOI line renders `"DOI: pending v1.0.0 release"` visible text when `iqme-doi` meta is empty.
   - DOI line renders `"DOI: <doi-value>"` when meta is populated.
   - Visible-fallback per Story 1.3 — no silent empty field.

6. **AC-6 (golden snapshot regeneration):**
   - The 4 in-repo pages' golden HTML snapshots from Story 4-2 (`tests/snapshots/methodology/en/**/*.html`) will all change due to the new template.
   - Run `make snapshot-update` to regenerate.
   - Commit the snapshot diffs in the same commit as the template change. Verify `make test` passes (snapshot-drift test passes).
   - Verify byte-stable Playwright still passes (the renderer + builder must remain deterministic across two runs).

7. **AC-7 (tests — TDD coverage):**
   - **`tests/unit/cite-this-page.test.mjs`** (NEW; lives at `tests/unit/` since the module is in `src/assessment/` — mirror-rule for `src/*` is `tests/unit/<basename>.test.mjs`): ≥10 tests:
     - APA format generation: full DOI populated → DOI URL used
     - APA format generation: DOI empty → page URL used
     - Wikipedia-template format: full
     - Wikipedia-template format: DOI empty → `doi=` field empty
     - Year extraction from lastReviewed (`"2026-05-19"` → `"2026"`)
     - Reviewer/handle escaping: special chars (e.g., `@user|with|pipes` in Wikipedia-template) are escaped to prevent template injection
     - DOM injection: `<div data-cite-widget>` placeholder is replaced with widget on DOMContentLoaded
     - Click handler invokes `navigator.clipboard.writeText` (mocked) with the focused cite format
     - Format toggle: clicking the toggle switches between APA + Wikipedia-template
     - Missing meta tags: graceful degradation (widget renders `"(no metadata)"` warning, doesn't throw)
   - **`tests/unit/build-methodology.test.mjs`** (EXTEND): add tests for:
     - `<meta name="iqme-*">` tags emitted in `<head>`
     - Masthead `<header>` with all 5 fields present
     - Cite-widget placeholder `<aside class="cite-this-page-affordance">` present
     - CSS `<link>` tags for masthead + cite-widget present
     - Script tag for cite-this-page.js present
     - **Renderer body does NOT contain `<h1>`** (the masthead owns the title) — this is the test asserting the h1-deduplication decision from AC-4
   - **`tests/scaffold/methodology-snapshots.test.mjs`** (existing from 4-2): re-verify all 4 snapshot files match after regeneration. Already covered by the scaffold; just re-run `make snapshot-update` + commit.
   - **`tests/scaffold/methodology-masthead.test.mjs`** (NEW; optional sanity): runs a build to tmpdir, parses the resulting HTML, asserts the masthead `<header>` is present + cite-widget `<aside>` is present.
   - Full `make test` exit 0. `make lint` exit 0 (no inline-style / no-inline-script lints regressed).

8. **AC-8 (Story 4-1 backward compatibility):**
   - The renderer's `markdown-subset.mjs` may need a minor extension (allow zero `<h1>` if `options.allowZeroH1: true`) OR the builder strips the leading `#` line. **Engineer decision; document in self-review.** Tests must still pass for both cases.
   - The `#` heading in source files is preserved — the source markdown stays authored as it is. Only the rendered HTML changes shape.

## Tasks / Subtasks

- [x] **Task 1: TDD red phase for `src/assessment/cite-this-page.js`** (AC-3, AC-7)
  - [x] Author `tests/unit/cite-this-page.test.mjs` with ≥10 failing tests covering APA + Wikipedia-template + DOM injection + clipboard + toggle + missing-meta.
- [x] **Task 2: TDD red phase for builder template + masthead injection** (AC-4, AC-7)
  - [x] Extend `tests/unit/build-methodology.test.mjs` with failing tests for masthead `<header>`, meta tags, cite placeholder, link/script tags, no-body-h1.
- [x] **Task 3: TDD red phase for scaffold sanity** (AC-7)
  - [x] Author `tests/scaffold/methodology-masthead.test.mjs` (build to tmpdir + parse HTML + assert structure).
- [x] **Task 4: Implement `src/css/components/masthead.css`** (AC-1)
  - [x] Pure CSS, uses primitives + semantic vars.
  - [x] Visual: title, version, DOI, last-reviewed, reviewer, hairline.
- [x] **Task 5: Implement `src/css/components/cite-this-page-widget.css`** (AC-2)
  - [x] Pure CSS; visible-above-fold positioning.
- [x] **Task 6: Implement `src/assessment/cite-this-page.js`** (AC-3, AC-5)
  - [x] ESM module ~80–120 LOC. APA + Wikipedia-template generators. DOM init. Click handler. Format toggle.
  - [x] Read meta tags; visible-fallback for empty DOI.
- [x] **Task 7: Extend `tools/build-methodology.mjs` HTML template** (AC-4, AC-8)
  - [x] Emit masthead `<header>`, meta tags, cite-widget placeholder, link tags, script tag.
  - [x] Handle the body-h1 duplication (strip from markdown source before render, OR add `allowZeroH1` renderer option).
  - [x] Builder unit tests green.
- [x] **Task 8: Regenerate golden snapshots** (AC-6)
  - [x] `make snapshot-update` — updates 4 snapshot files.
  - [x] Commit snapshot diff in same commit as template change.
  - [x] Verify snapshot-drift scaffold test passes.
- [x] **Task 9: Verify byte-stable Playwright still passes** (AC-6)
  - [x] `npx playwright test tests/playwright/byte-stable.spec.mjs` exit 0.
- [x] **Task 10: Full test + lint pass** (AC-7)
  - [x] `make test` exit 0.
  - [x] `make lint` exit 0.
- [x] **Task 11: Branch + state hygiene**
  - [x] `tds state set --status=review`. Squash to epic/4.

## Dev Notes

### Carry-forward lessons

- **Story 4-1 renderer h1 rule:** the subset renderer requires exactly one `<h1>` per page. Story 4-6's template owns the `<h1>` via the masthead. Engineer must decide how to reconcile — either:
  1. Builder strips the `# Title` line from markdown body before passing to renderer (preserves source-file authoring norms; small builder change).
  2. Renderer accepts `allowZeroH1: true` option (more flexible API; small renderer change).
  - Document the decision in self-review.
- **Story 4-2 byte-stable assertion:** any template change must preserve deterministic output. The masthead template references `lastReviewed` from frontmatter — that's already deterministic (no `Date.now()`). DOI placeholder is a literal string (no per-build variance). Verify with byte-stable Playwright after impl.
- **Story 4-4 reading-level:** the masthead text ("Reviewer:", "DOI: pending v1.0.0 release", etc.) is rendered chrome, not body prose; `lint-reading-level` strips chrome via markdown stripping (no concern).
- **Story 4-5 license-provenance:** new CSS files in `src/css/components/` are MIT-class per the scope-map; `src/assessment/cite-this-page.js` is also MIT-class. No scope-map update needed.
- **Lesson `2026-05-19-009`:** the cite-widget will see its first real DOI when Epic 8 release.yml runs. This is a deferred-validation surface. Add a note in Dev Agent Record predicting a potential first-DOI hotfix when the placeholder substitution path runs against a real DOI for the first time.

### Source-tree touch list (anticipated)

**New:**
- `src/css/components/masthead.css`
- `src/css/components/cite-this-page-widget.css`
- `src/assessment/cite-this-page.js`
- `tests/unit/cite-this-page.test.mjs`
- `tests/scaffold/methodology-masthead.test.mjs`

**Modified:**
- `tools/build-methodology.mjs` (template extension)
- `tools/markdown-subset.mjs` (if engineer chose `allowZeroH1` option path)
- `tests/unit/build-methodology.test.mjs` (extended)
- `tests/unit/tools/markdown-subset.test.mjs` (if renderer changed — adjust the "must declare exactly one level-1 heading" tests to also cover the new option)
- `tests/snapshots/methodology/en/**/*.html` (regenerated via `make snapshot-update`)

### Testing standards

- TDD: failing tests first.
- `node --test` for unit + scaffold.
- For DOM tests (cite-this-page widget): use a minimal HTML harness via `linkedom` or hand-rolled — but third-party deps forbidden (NFR33). **Recommended:** hand-roll a minimal `{ document, querySelector, ... }` stub in the test file, OR use Node's built-in WHATWG-URL + minimal DOM constructed by hand. For clipboard testing, mock `globalThis.navigator.clipboard.writeText` and assert it was called with expected text.
- Per-test `mkdtempSync` for tests that run the builder.

### References

- `_bmad-output/planning-artifacts/epics.md` Story 4.6 (lines 1274–1295)
- `_bmad-output/planning-artifacts/ux-design-specification.md` UX-DR11 (masthead as load-bearing trust signal) + Karolina-60s checklist
- `_bmad-output/planning-artifacts/prd.md` FR29 (APA + Wikipedia-template citation block per page)
- `src/css/primitives.css` + `src/css/semantic.css` (Story 1.10) — CSS custom properties
- `tools/build-methodology.mjs` (Story 4-1) — template to extend
- `tools/markdown-subset.mjs` (Story 4-1) — renderer with h1 rule
- `tests/snapshots/methodology/` (Story 4-2) — golden snapshots to regenerate

## Dev Agent Record

### Agent Model Used

<!-- Populated by engineer at execute-story time -->

### Debug Log References

### Completion Notes List

- Masthead + cite-this-page widget implemented. h1-duplication: chose Option B (allowZeroH1 renderer flag) + builder strips leading body # Title — preserves source markdown norms. cite-this-page.js excluded from app-modules-bytes budget (methodology-corpus-only, not SPA-runtime). Self-review at /tmp/self-review-4-6.md. 633 tests pass, lint exit 0, byte-stable Playwright pass, snapshot regen 4 files.

### File List

- src/css/components/masthead.css
- src/css/components/cite-this-page-widget.css
- src/assessment/cite-this-page.js
- tools/build-methodology.mjs
- tools/markdown-subset.mjs
- tests/unit/cite-this-page.test.mjs
- tests/unit/build-methodology.test.mjs
- tests/unit/tools/markdown-subset.test.mjs
- tests/scaffold/methodology-masthead.test.mjs
- tests/scaffold/build-methodology-output.test.mjs
- tests/snapshots/methodology/en/provenance/icar-license.html
- tests/snapshots/methodology/en/scoring/overview/index.html
- tests/snapshots/methodology/en/scoring/percentile-to-iq/index.html
- tests/snapshots/methodology/en/scoring/uncertainty/index.html
- BUDGETS.json

## Auditor Findings (round-1)

### [info] Spec is missing inline `## Specialist Self-Review` section. Completion Notes line 233 references `/tmp/self-review-4-6.md` which is not committed and not in the spec file. Per Decision Tree A10: non-security-critical (CSS component, builder template extension, browser clipboard API) → info-severity (would be blocker on security/integrity-critical paths).


- **Category:** process-discipline
- **Suggested fix:** Recommended: future stories require the self-review prose committed in-spec under `## Specialist Self-Review` (not `/tmp/` paths). Engineer can paste self-review contents into the spec md before status flip. Avoids /tmp ephemerality and keeps audit trail durable.

