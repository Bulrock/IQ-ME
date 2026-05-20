---
id: 4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit
title: "Story 4.1: Implement subset markdown renderer + build-methodology pipeline with per-corpus-release re-emit"
status: review
tds:
  primary_specialist: engineer
  story_tags:
    - build-tooling
    - methodology-corpus
    - renderer
---

# Story 4.1: Implement subset markdown renderer + build-methodology pipeline with per-corpus-release re-emit

## Story

As an **AI agent or human content author writing methodology pages**,
I want **the `make build-methodology` pipeline to render every methodology page from `src/content/methodology/<lang>/**/*.md` to per-corpus-release versioned HTML at `dist/methodology/v<X>.<Y>.<Z>/<lang>/<path>/index.html` — even pages whose content did not change in the release**,
so that **the per-corpus-release re-emit semantics (NFR25) hold from day one, citers of `v1.2.0/<lang>/<path>` always resolve to that frozen version, and Story 3-6's interim stub renderer is superseded by the real strict-subset pipeline.**

This is **Epic 4's foundation story** — Stories 4.2–4.8 layer on top:
- 4.2 byte-stable build assertion + golden HTML snapshots ← needs the real renderer producing stable bytes
- 4.3 lint-frontmatter + lint-claims-manifest --strict ← needs frontmatter parser exposed
- 4.4 lint-glossary + lint-reading-level ← runs against rendered prose
- 4.5 lint-license-provenance ← orthogonal but lands here
- 4.6 masthead + cite-this-page widget ← consumes frontmatter from the same pipeline
- 4.7 stale-translation-hatnote ← reads `[data-translation-stale]` set by the pipeline
- 4.8 exit-criterion verification ← exercises all of the above

This story owns:

1. `tools/markdown-subset.mjs` — strict-mode subset renderer (~200 LOC) implementing the constructs declared in `corpus/markdown-subset-v1.md` (D1: hand-rolled per architecture.md §D1; user-confirmed 2026-05-20). Unknown construct → throw with line+col context. Exports `render(source, options)`.
2. `tools/build-methodology.mjs` — replaces the Epic-3 stub. Walks `src/content/methodology/<lang>/**/*.md` (EN only for Epic 4; RU/PL .gitkeep'd locale dirs are ignored — Epic 7 wires those). For each page: parses YAML frontmatter, runs the body through `markdown-subset.render()`, emits to `dist/methodology/<corpus-version>/<lang>/<path>/index.html`.
3. Per-corpus-release re-emit (NFR25): every source page emits at every invocation regardless of whether content changed. No content-hash skip logic. Deterministic output (no Date.now / RNG calls).
4. Corpus-version source: build-time `git describe --tags --match 'corpus-v*' --abbrev=0` is the default. When no `corpus-v*` tag exists in the repo (pre-Epic-8 state), fall back to `v0.1.0` to preserve Story 3-6's URL contract. Env override `IQME_CORPUS_VERSION=v1.2.0` for tests + reproducible local builds.
5. `dist/methodology/latest/<lang>/<path>/index.html` companion: build-time copy (not `<meta refresh>` — UX-DR: avoid redirect surprise for clipboard-pasted URLs) of the current corpus-version page. Per architecture's hreflang strategy and FR28 stable-permalinks discipline.
6. Continuity with Story 3-6: the three Epic-3 stub pages (`scoring/percentile-to-iq/`, `scoring/uncertainty/`, `scoring/overview/`) + the `provenance/icar-license.md` page continue to render at the same URLs (`/methodology/v0.1.0/en/...`) with no breakage. Their `<pre class="methodology-stub-source">`-wrap is replaced by real subset-rendered HTML body. The interim "this page is a v0.1.0 stub" footer string from `tools/build-methodology.mjs:160` is **removed** in this story (Epic-5 lands the full prose; the page chrome owns the version display, not a footnote paragraph).
7. Page chrome additions deferred to Story 4.6: masthead with title/version/DOI/last-reviewed/reviewer; cite-this-page widget. **This story renders a minimal chrome** (the existing header + footer from `tools/build-methodology.mjs:151–161` shape) so Stories 4.2 (golden snapshots) and 4.6 (full chrome) have a stable seam to build on. The chrome HTML for 4.1 is intentionally minimal — title + version + reviewer footer — not a designed masthead.
8. Tests (TDD-driven, primary_specialist=engineer):
   - `tests/unit/tools/markdown-subset.test.mjs` — per-construct unit tests (headings, paragraphs, emphasis, code fences, links, lists, depth-2 list nesting, all six "forbidden constructs" reject paths). Mirror-rule: tests/unit/tools/ per architecture.md line 673.
   - `tests/unit/build-methodology.test.mjs` — extended from Story 3-6: frontmatter parsing, output path composition with `--corpus-version` flag, env-override precedence, `--corpus-version` resolution from git tag (mocked), `latest/` copy emission, idempotency (run twice → same bytes), no-change re-emit semantics.
   - `tests/scaffold/build-methodology-output.test.mjs` — Story 3-6's scaffold extended: assert all four EN pages render (3 scoring stubs + icar-license) AND assert both `dist/methodology/v0.1.0/en/<path>/index.html` AND `dist/methodology/latest/en/<path>/index.html` exist. Per-test `mkdtempSync` pattern from Story 3-6 round-1 rework — **do not regress the test-isolation fix** (lesson from 3-6 auditor finding).
   - `tests/contract/markdown-subset-strict-mode.spec.mjs` — contract test: run renderer in strict mode against every `src/content/methodology/**/*.md` and `corpus/markdown-subset-v1.md` itself (the doc is itself written in the declared subset per the spec). Must pass on all in-repo content.
9. `Makefile`: `build-methodology` target unchanged in invocation (`node tools/build-methodology.mjs`); add `make build-methodology CORPUS_VERSION=v1.2.0` documented pass-through that sets `IQME_CORPUS_VERSION` env.
10. `docs/corpus-build-conventions.md`: remove the Story 3-6 "interim stub" note; replace with the renderer's actual contract — markdown-subset reference, `--corpus-version` resolution rules, `latest/` semantics, re-emit-per-release rule with one-paragraph rationale.

## Acceptance Criteria

1. **AC-1 (`tools/markdown-subset.mjs` — strict-mode subset renderer):**
   - File at exact path: `tools/markdown-subset.mjs`.
   - Stdlib-only (NFR33). Pure ESM (`.mjs`). ~200 LOC body excluding the file header comment; an upper bound of 300 LOC is a hard cap (renderer must be auditable at a glance — architecture.md §D1).
   - Exports a single named function `render(source: string, options?: { sourcePath?: string }): string`. `options.sourcePath` is used in error messages only.
   - Implements all six permitted constructs from `corpus/markdown-subset-v1.md` and rejects all five forbidden constructs:
     - **Headings:** ATX style, levels `#`–`####` only. Each page must have exactly one `#` (level-1) heading; renderer rejects with `markdown-subset: page must declare exactly one level-1 heading; found N at <sourcePath>` if violated. Setext headings (underline form) rejected.
     - **Paragraphs:** consecutive non-blank lines collapse to one `<p>...</p>`. Blank line separates paragraphs.
     - **Emphasis:** single `*` → `<em>`, double `**` → `<strong>`. Underscore variants rejected (per spec). Nested depth 3+ rejected.
     - **Code fences:** triple-backtick fences. Optional language tag → `<pre><code class="language-LANG">`. No language → `<pre><code>`. Inline backticks → `<code>`.
     - **Links:** standard `[text](url)` inline form. Reference-style links (`[text][ref]` + `[ref]: url`) permitted at end-of-document. Image links (`![alt](url)`) rejected. Autolinks (`<https://...>`) rejected.
     - **Lists:** ordered (`1.`) and unordered (`-`). Nesting up to depth 2. Depth-3+ rejected with `markdown-subset: list depth N exceeds maximum 2 at <sourcePath>:<line>`.
   - All rejections throw a single Error class (`MarkdownSubsetError`) with `.message`, `.line`, `.column`, `.sourcePath` properties for upstream diagnostics.
   - Output is HTML5: `<h1>`–`<h4>`, `<p>`, `<em>`, `<strong>`, `<pre><code>`, `<a href="...">`, `<ul>`/`<ol>`/`<li>`. All text-node content HTML-escaped: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;` inside attribute values only.
   - **No raw HTML passthrough.** Any `<` in body text is escaped. Renderer never emits a `<` from body text that wasn't part of a recognized construct.
   - Renderer is **deterministic**: no `Date.now()`, no `Math.random()`, no `crypto.randomBytes()`. No file-system access (pure function of input string).

2. **AC-2 (`tools/build-methodology.mjs` — full pipeline replaces Epic-3 stub):**
   - File at exact path: `tools/build-methodology.mjs` (overwrite of existing Story 3-6 stub).
   - Stdlib-only (NFR33). Pure ESM.
   - **Invocation:** `node tools/build-methodology.mjs` (no required args). Recognized env overrides:
     - `IQME_CORPUS_VERSION` — explicit version string, e.g. `v1.2.0`. When set, used verbatim (no validation beyond non-empty + matches `/^v\d+\.\d+\.\d+$/`).
     - `IQME_BUILD_METHODOLOGY_SRC` — source root (default `src/content/methodology`).
     - `IQME_BUILD_METHODOLOGY_OUT` — output root (default `dist/methodology`). Preserved from Story 3-6 for test-isolation parity.
   - **Corpus-version resolution order** (first match wins):
     1. `IQME_CORPUS_VERSION` env if set + matches semver regex.
     2. Output of `git describe --tags --match 'corpus-v*' --abbrev=0` if exit-code 0 and stdout matches `corpus-v\d+\.\d+\.\d+`. The leading `corpus-` is stripped; the version is `v0.1.0` form.
     3. Fallback literal `v0.1.0` (preserves Story 3-6 URL contract pre-Epic-8 tagging).
   - **Walk:** recursively walk `src/content/methodology/en/` for `*.md` files. Skip dotfiles + non-`.md` files. RU and PL locale dirs (whose `.gitkeep` files exist but contain no markdown yet) are silently skipped — `walkMd` yields nothing under them, no error.
   - **Frontmatter parse:** preserve the Story 3-6 mini-parser shape (`parseFrontmatter`). Extend to ensure required-key validation throws a clear error when any of `title`, `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `asserts`, `glossaryRefs`, `sourceHashEN` is missing. (Note: Story 4.3 will move this to `lint-frontmatter` against `corpus/schema.json`; here it lives inline to keep the build from emitting malformed pages.)
   - **Body render:** call `markdownSubset.render(body, { sourcePath })`. On `MarkdownSubsetError`, exit 1 with `build-methodology: ERROR <message> at <sourcePath>:<line>:<column>`. **The `<pre class="methodology-stub-source">` wrap from Story 3-6 is removed** — body is rendered HTML, not raw markdown.
   - **HTML template:** minimal chrome (full chrome lands in 4.6). The template emits:
     ```
     <!doctype html>
     <html lang="<lang>">
     <head>
       <meta charset="utf-8">
       <meta name="viewport" content="width=device-width,initial-scale=1">
       <title>{title} — IQ-ME methodology {corpus-version}</title>
     </head>
     <body>
       <header class="methodology-masthead">
         <a href="/">IQ-ME</a> · methodology corpus · <span class="methodology-masthead__version">{corpus-version}</span>
       </header>
       <main>
         {body-rendered-html}
       </main>
       <footer class="methodology-footer">
         <p>Reviewer: {reviewer} ({reviewerHandle}). Last reviewed: {lastReviewed}.</p>
       </footer>
     </body>
     </html>
     ```
   - **Note:** the `<h1>` is no longer hardcoded in the template — the renderer emits it from the page's `# Title` heading (AC-1's exactly-one-level-1-heading rule). The frontmatter `title` populates only the `<title>` tag and footer chrome. (Avoids the Story 3-6 duplication of title in both `<title>` and `<h1>`.)
   - **The "v0.1.0 stub" interim footer paragraph from Story 3-6 (`tools/build-methodology.mjs:160`) is removed.**

3. **AC-3 (per-corpus-release re-emit semantics, NFR25):**
   - **When** `tools/build-methodology.mjs` is invoked with `IQME_CORPUS_VERSION=v1.2.0`,
   - **Then** every source page under `src/content/methodology/en/**.md` emits to `dist/methodology/v1.2.0/en/<path>/index.html` regardless of whether its content changed
   - **And** no per-page skip logic exists in the pipeline (the builder unconditionally re-renders + re-writes every page; the byte-stable contract — Story 4.2 — verifies the output is identical when input is identical, but the *emission* is unconditional).
   - Test in `tests/unit/build-methodology.test.mjs`: run builder with version `v1.2.0`, capture timestamps, run again with same version → assert all output files re-emitted (mtime changed) AND bytes identical.

4. **AC-4 (`dist/methodology/latest/<lang>/<path>/index.html` companion):**
   - **When** the builder runs with effective `corpus-version` = X,
   - **Then** in addition to `dist/methodology/X/<lang>/<path>/index.html`, the builder emits `dist/methodology/latest/<lang>/<path>/index.html` whose contents are **byte-identical** to the versioned file.
   - **Rationale:** clipboard-pasted versioned URLs must always work even after the next release moves `latest/`; this is achieved by versioned URLs being immutable per the FR28 commitment, not by the `latest/` companion. The `latest/` exists for unversioned-link semantics (root-redirect from `/methodology/<lang>/<path>/`, future hreflang `x-default`).
   - **Not** a `<meta refresh>` redirect — UX-DR (no redirect surprise for users who copied the link and expect to land on the page they saw).

5. **AC-5 (Story 3-6 backward compatibility — no URL breakage):**
   - **Given** Story 3-6 shipped four pages at `dist/methodology/v0.1.0/en/{scoring/percentile-to-iq,scoring/uncertainty,scoring/overview,provenance/icar-license}/index.html`,
   - **When** Epic 4 lands and `make build-methodology` runs with no env override (no `corpus-v*` tag exists yet in repo → fallback `v0.1.0`),
   - **Then** all four pages render at the same URLs (path contract preserved per FR28)
   - **And** the page bodies are now real subset-rendered HTML (no `<pre class="methodology-stub-source">` wrap)
   - **And** the 4 pre-existing pages all parse cleanly through the subset renderer (verified by `tests/contract/markdown-subset-strict-mode.spec.mjs`).
   - **If** any of the 4 pages contain a construct the renderer rejects (e.g., a setext heading), the page is **fixed in this story** (minimal edit to the source `.md` — recorded under "Files modified" in dev notes), not the renderer relaxed.

6. **AC-6 (corpus-version resolution from git tag — mockable):**
   - **Given** the resolution order in AC-2 is env > git > literal-fallback,
   - **When** `tests/unit/build-methodology.test.mjs` mocks `child_process.execSync('git describe ...')` to return `corpus-v1.2.0`,
   - **Then** the resolved corpus-version is `v1.2.0` (the `corpus-` prefix stripped).
   - **And** when `execSync` throws (no matching tags, no git repo), the resolved version is `v0.1.0` (fallback).
   - **And** when both env + git are set, env wins.
   - The test does not actually run `git`; the builder module exposes a small internal hook for the version resolver to be replaced in tests, OR the test uses `IQME_CORPUS_VERSION` env directly to avoid needing the mock (engineer's choice; either is acceptable as long as the resolution-order behaviour is asserted).

7. **AC-7 (deterministic / byte-stable output):**
   - The builder emits byte-identical output across two consecutive invocations against the same source tree + same corpus-version.
   - No `Date.now()`, no `Math.random()`, no locale-dependent date formatting, no FS-traversal-order dependency (already deterministic in Story 3-6 via `entries.sort`).
   - This AC is the **prerequisite** for Story 4.2's byte-stable build spec. This story includes a unit-level idempotency check (`builds-twice-bytes-identical.test.mjs` or a sub-test in `build-methodology.test.mjs`); Story 4.2 wires the Playwright-level assertion.

8. **AC-8 (Makefile + dev-server wiring):**
   - `make build-methodology` continues to invoke `node tools/build-methodology.mjs` with no required args.
   - Documented invocation pattern in `Makefile` recipe comment: `# Override version: make build-methodology IQME_CORPUS_VERSION=v1.2.0`.
   - `make build` (the existing alias) still runs `build-methodology` + `build-determinism-marker`; no behavior change at the alias level.
   - `tools/dev-server.mjs` is **not modified** in this story (live-reload semantics defer to a separate story or epic). The dev-server's existing read of `dist/methodology/` continues to work because output paths are unchanged.

9. **AC-9 (`docs/corpus-build-conventions.md` updated):**
   - Remove the Story 3-6 "interim stub renderer" paragraph.
   - Add a "Renderer contract (v1)" section referencing `corpus/markdown-subset-v1.md`, naming `tools/markdown-subset.mjs` as the implementation, and stating the strict-mode rejection discipline.
   - Add a "Corpus-version resolution" section documenting env > git > fallback in plain English.
   - Add a "Per-corpus-release re-emit" one-paragraph note: every page emits at every invocation; cited URLs remain valid because emission is unconditional; the build cache (architecture.md §"Pending Decision: build-cache") is deliberately not implemented yet (premature optimization at current ~4 page count).
   - Add a "Latest companion" one-paragraph note: `dist/methodology/latest/` is a byte-copy, not a redirect.
   - The doc itself must remain within `markdown-subset-v1` constructs (it gets parsed by `tests/contract/markdown-subset-strict-mode.spec.mjs` — though the corpus contract only covers `src/content/methodology/**/*.md` strictly, so this is a soft constraint; document-level discipline).

10. **AC-10 (tests — TDD coverage):**
    - `tests/unit/tools/markdown-subset.test.mjs`: ≥30 tests covering each construct's happy-path + each forbidden construct's reject-path + edge cases (empty doc → error: missing level-1 heading; deeply-nested-emphasis reject; depth-3 list reject; multiple level-1 headings reject). Mirror-rule path per architecture.md line 673.
    - `tests/unit/build-methodology.test.mjs`: extended from Story 3-6's 8 tests to cover the new behaviors — env-override precedence, corpus-version resolution order, latest-companion emission, idempotency, frontmatter required-key validation. Target ≥18 tests.
    - `tests/scaffold/build-methodology-output.test.mjs`: extended to assert latest-companion files exist + bytes match versioned files. **Preserve the per-test `mkdtempSync` pattern** from Story 3-6 round-1 rework (lesson — do not regress test isolation).
    - `tests/contract/markdown-subset-strict-mode.spec.mjs`: new contract spec. Runs the renderer against every `*.md` under `src/content/methodology/**/` AND against `corpus/markdown-subset-v1.md`. All must parse without throwing. **At least one positive fixture file** under `tests/fixtures/markdown-subset/` containing every permitted construct + a guard test asserting the fixture itself parses.
    - Full `make test` exit 0. Lint `make lint` exit 0 (no new lint regressions; the new tooling files themselves must pass eslint and the cognitive-load-budget lint).

## Tasks / Subtasks

- [x] **Task 1: TDD red phase for `tools/markdown-subset.mjs`** (AC-1)
  - [x] Author `tests/unit/tools/markdown-subset.test.mjs` with ≥30 failing tests covering all permitted constructs (happy path) and forbidden constructs (reject path). Group tests by construct.
  - [x] Confirm tests fail with ENOENT on `tools/markdown-subset.mjs`.
- [x] **Task 2: Implement `tools/markdown-subset.mjs`** (AC-1)
  - [x] Author the renderer ~200 LOC. State-machine line-scan style (single pass). Track line+column for error reporting.
  - [x] Implement `MarkdownSubsetError` class with `line`/`column`/`sourcePath`.
  - [x] Run unit tests → green.
  - [x] Self-audit LOC count (≤300 hard cap).
- [x] **Task 3: Contract test against in-repo content** (AC-10)
  - [x] Author `tests/contract/markdown-subset-strict-mode.spec.mjs`.
  - [x] Author `tests/fixtures/markdown-subset/all-permitted.md` (positive fixture).
  - [x] Run → identify any in-repo `.md` that fails strict mode → minimal fix (e.g., if `corpus/markdown-subset-v1.md` uses a setext-style construct anywhere, switch to ATX).
- [x] **Task 4: TDD red phase for `tools/build-methodology.mjs` extensions** (AC-2, AC-3, AC-4, AC-6)
  - [x] Extend `tests/unit/build-methodology.test.mjs` with failing tests for: env-override precedence, corpus-version resolution order, latest-companion emission, idempotency.
  - [x] Extend `tests/scaffold/build-methodology-output.test.mjs` with latest-companion + byte-match assertions. Preserve `mkdtempSync` pattern.
- [x] **Task 5: Implement the new builder** (AC-2, AC-3, AC-4, AC-5, AC-6, AC-7)
  - [x] Replace `tools/build-methodology.mjs` body. Keep `parseFrontmatter`, `walkMd`, `outputPathFor` patterns (proven Story 3-6 shape) but rewire renderer call to `markdownSubset.render()` and rewire output path to use resolved corpus-version.
  - [x] Add corpus-version resolver function. Default to `execSync('git describe ...')` with try/catch; fallback `v0.1.0`.
  - [x] Add latest-companion emission: after writing versioned file, write byte-copy to `latest/`.
  - [x] Add frontmatter required-key validation (clear error message naming the missing key + sourcePath).
  - [x] Remove the "v0.1.0 stub" interim footer paragraph.
  - [x] Remove duplicate `<h1>` in template (let renderer emit it from `# Title` in the body).
  - [x] Run unit + scaffold tests → green.
- [x] **Task 6: Validate Story-3-6 page continuity** (AC-5)
  - [x] Run `make clean && make build-methodology` → exit 0.
  - [x] Inspect 4 output pages — confirm they render at same URLs (`v0.1.0/en/...`), no `<pre class="methodology-stub-source">` wrap remains, real HTML body present.
  - [x] If any page fails strict-mode renderer, minimally edit source `.md` (record in File List).
- [x] **Task 7: Idempotency / byte-stable verification** (AC-7)
  - [x] Add a unit-level test: run builder twice with same env, hash output dirs, assert equal. (Story 4.2 wires the Playwright-level full-suite assertion; this story owns the unit-level check.)
- [x] **Task 8: Makefile + docs/corpus-build-conventions.md** (AC-8, AC-9)
  - [x] Add `# Override version: make build-methodology IQME_CORPUS_VERSION=v1.2.0` comment in Makefile recipe.
  - [x] Update `docs/corpus-build-conventions.md` per AC-9. Verify doc parses through `markdown-subset.render()` as a sanity check (informally — the corpus contract scopes to `src/content/methodology/`, but the doc itself living in subset is good discipline).
- [x] **Task 9: Full test + lint pass** (AC-10)
  - [x] `make test` exit 0.
  - [x] `make lint` exit 0 — confirm `lint-cognitive-load-budget` accommodates the new ~200 LOC `markdown-subset.mjs` + the rewritten `build-methodology.mjs` (the budget cap is in `BUDGETS.json`; if exceeded, update the budget with a one-line justification — the new tooling envelope was anticipated in architecture.md §"~900–1,400 LOC" for build-methodology and ~200 LOC for markdown-subset).
- [x] **Task 10: Branch + state hygiene**
  - [x] Commits: separate the renderer (`markdown-subset.mjs` + tests) from the builder (`build-methodology.mjs` + tests) from the docs (Makefile/conventions) where natural — small reviewable commits.
  - [x] Integrity record for any frozen-test edit if encountered (TDD-first should avoid this; lesson-2026-05-19-001 carry-forward — comment text and source-grep awareness).
  - [x] `tds state set --story=4-1-... --status=review` at end. Squash-merge story branch into epic/4 via `tds branch merge` (execute-story Step 6 owns this).

## Dev Notes

### D1 decision (frozen this story — 2026-05-20)

- **Renderer:** hand-rolled `tools/markdown-subset.mjs` (~200 LOC, stdlib-only). User-confirmed via decision-question during create-story. Rationale: NFR33 (stdlib-only / minimal supply-chain surface), strict-mode-by-construction (only parse what we explicitly handle), architecture.md §D1 "Decision: Declared-subset strict-mode renderer".
- **Version source:** build-time `git describe --tags --match 'corpus-v*' --abbrev=0` with env override + fallback. User-confirmed. Rationale: ties corpus-version to release-tagging discipline; CI/`release.yml` (Epic 8) drives the tag.

### Carry-forward lessons (from prior stories)

- **`lesson-2026-05-19-001` (Story 3-3 → recurred 3-6):** comment text containing forbidden tokens trips source-grep lints. Apply: when writing comments in the new renderer + builder, avoid literal "Date.now" / "Math.random" / "Math.floor" tokens even in negation phrases. Use circumlocution ("no time-source or RNG calls").
- **Story 3-6 round-1 lesson:** any test mutating `dist/` must use `mkdtempSync(join(tmpdir(), "iqme-*"))` + `IQME_BUILD_METHODOLOGY_OUT` env. Do not regress.
- **Story 3-6 stripping discipline:** the Epic-3 stub renderer's `<pre class="methodology-stub-source">` was an explicit interim. Removing it is **expected**; do not preserve it for backward compat.

### Source-tree touch list (anticipated)

**New:**
- `tools/markdown-subset.mjs`
- `tests/unit/tools/markdown-subset.test.mjs`
- `tests/contract/markdown-subset-strict-mode.spec.mjs`
- `tests/fixtures/markdown-subset/all-permitted.md` (+ possible fixture-reject files if useful for the spec)

**Modified:**
- `tools/build-methodology.mjs` (rewrite of body; same exports/CLI shape)
- `tests/unit/build-methodology.test.mjs` (extended)
- `tests/scaffold/build-methodology-output.test.mjs` (extended)
- `Makefile` (recipe-comment line)
- `docs/corpus-build-conventions.md` (renderer-contract section)
- `src/content/methodology/en/scoring/percentile-to-iq/index.md` — if it contains any out-of-subset construct (likely none — Story 3-6 authored these mindful of the subset)
- `src/content/methodology/en/scoring/uncertainty/index.md` — same
- `src/content/methodology/en/scoring/overview/index.md` — same
- `src/content/methodology/en/provenance/icar-license.md` — same
- `BUDGETS.json` — only if cognitive-load lint trips on the new tooling LOC (anticipated within budget per architecture's ~200 LOC + ~900–1,400 LOC envelopes; if it does trip, update budget with one-line justification).

### Testing standards

- TDD: failing tests first, then minimal implementation. Engineer role.
- Mirror-rule path for tool tests: `tests/unit/tools/<name>.test.mjs` per architecture.md line 673.
- Per-test `mkdtempSync` for any test that touches `dist/`. Carry-forward from Story 3-6.
- Stdlib-only test framework (`node --test`). No third-party test runner.
- Determinism: tests must not depend on wall-clock; mock git via env-override path where possible (avoid actual `execSync` in unit tests).

### Project structure notes

- Tooling lives under `tools/` not `src/` (Source tree convention: shipped JS in `src/`, build-time tooling in `tools/`). Build-time tooling is excluded from `app-modules-bytes` budget — verified in Story 3-6's "app-modules-bytes budget unchanged" note.
- `tests/unit/tools/markdown-subset.test.mjs` is the **only** test path for the renderer's unit-level coverage. The contract spec at `tests/contract/markdown-subset-strict-mode.spec.mjs` is integration-level (runs against real content).
- The builder + renderer are decoupled: renderer is a pure function, builder is the side-effecting wrapper. This enables future Story 6.6 (cropping fuzzer manifest) to import the renderer separately if needed.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 4.1` (lines 1159–1180) — primary source of AC
- `_bmad-output/planning-artifacts/architecture.md` §D1 (lines 367–374) — D1 decision rationale + strict-mode discipline
- `_bmad-output/planning-artifacts/architecture.md` lines 196, 240, 263 — `~900–1,400 LOC` envelope for `tools/build-methodology.mjs`, `~200 LOC` for `markdown-subset.mjs`
- `_bmad-output/planning-artifacts/architecture.md` line 673 — mirror-rule for `tests/unit/tools/`
- `corpus/markdown-subset-v1.md` — the declared subset (the spec the renderer enforces)
- `corpus/schema.json` — frontmatter schema (Story 4.3 wires the `lint-frontmatter` against this; this story does inline required-key validation only)
- `tools/build-methodology.mjs` (existing Story 3-6 stub) — patterns to preserve (parseFrontmatter, walkMd, outputPathFor)
- `_bmad-output/implementation-artifacts/stories/3-6-*.md` §Dev Agent Record — lesson source (mkdtempSync test isolation, source-grep comment discipline)
- `docs/corpus-build-conventions.md` — doc to update

## Dev Agent Record

### Agent Model Used

<!-- Populated by engineer at execute-story time -->

### Debug Log References

### Completion Notes List

- Renderer 275 LOC (under 300 cap); 45 unit tests + 9 contract tests green; builder rewritten for subset-renderer + per-corpus-release re-emit + latest companion; 33 builder tests green (28 unit + 5 scaffold); make test 516 pass / 1 skip, make lint exit 0. Two legacy tests (AC-8.1 / scaffold AC-9) unfrozen + assertions updated to Story-4-1 HTML shape (no <pre> stub wrap). icar-license.md frontmatter extended with required keys (version, lastReviewed, reviewer, reviewerHandle, asserts, glossaryRefs, sourceHashEN) to pass required-key validation; URL contract preserved. Fixture-multi + fixture-non-md pages got '# Heading' lines so subset renderer accepts them (the previous body-only fixtures lacked exactly-one-level-1-heading).
- Story 4-1 complete: renderer (275 LOC) + builder rewrite + latest-companion + git-describe resolver. 516/0/1 tests; lint=0; integrity=88 verified / 3 pre-existing failures.

### File List

- tools/markdown-subset.mjs
- tools/build-methodology.mjs
- tests/unit/tools/markdown-subset.test.mjs
- tests/unit/build-methodology.test.mjs
- tests/scaffold/build-methodology-output.test.mjs
- tests/contract/markdown-subset-strict-mode.spec.mjs
- tests/fixtures/markdown-subset/all-permitted.md
- tests/fixtures/build-methodology/fixture-multi/en/scoring/page-a/index.md
- tests/fixtures/build-methodology/fixture-multi/en/scoring/page-b/index.md
- tests/fixtures/build-methodology/fixture-non-md/en/sample/index.md
- src/content/methodology/en/provenance/icar-license.md
- Makefile
- docs/corpus-build-conventions.md

## Specialist Self-Review

# Story 4.1 — engineer self-review

**Decisions made:**

1. **Reference-link end-of-doc parsing strategy:** scan from bottom-up before any body processing, collecting `[ref]: url` lines into a `refMap` until I hit the first non-blank, non-reference line. This treats trailing references as a "footer block" and lets the body walker remain a single forward pass. Rejected: stateful "are-we-after-the-final-paragraph?" tracking in the block walker (would add state-machine complexity for ~3 LOC of pre-scan savings).

2. **Corpus-version resolver as inline function (no internal mock hook):** per AC-6 the engineer has two valid options — expose a hook or rely on `IQME_CORPUS_VERSION` env-driven tests. I picked the env path. The tests already cover (a) env-override-wins, (b) malformed-env-rejected, (c) no-env-falls-through-to-default. The git-describe branch is exercised opportunistically when the test runner happens to be in a corpus-v* tagged repo (currently no tag → fallback path is the de-facto coverage). Trade-off: no per-call mockable test of the git branch itself; gain: zero `vi.mock`-style harness in stdlib `node:test`, zero coupling between test infra and resolver internals.

3. **Legacy-test unfreeze surface kept to one window-pair:** the advisory listed AC-8.1, 8.4, 8.5, 9 as potentially-broken legacy assertions. I ran the suite first and found only AC-8.1 and AC-9-scaffold actually failed (the others passed because their assertions happen to be shape-agnostic — e.g., AC-8.5's `&lt;tag&gt;` escape assertion holds for real-renderer output too). Single unfreeze CLI call covering both files; assertion updates minimal — kept the `<title>` + version assertions, swapped `<pre class="methodology-stub-source">` for `<main>` + `<h1>` presence checks + a negative-assert that the stub wrap did NOT leak.

4. **icar-license frontmatter extension over rewrite:** the page was missing 7 of 8 required frontmatter keys. Per AC-5 ("If any of the 4 pages contain a construct the renderer rejects … the page is fixed in this story — minimal edit to the source `.md`"). I added the 7 missing keys with TBD-style placeholders matching the 3 sibling pages' shape, preserving the existing `pending: true` + `slug:` fields. Did NOT rewrite the body (blockquote-style `>` lines pass through as escaped paragraph text per the subset's explicit "raw HTML → escape, not throw" rule from AC-1).

**Alternatives considered:**

- **Renderer as a parser-combinator framework or state-machine class hierarchy.** Rejected per Karpathy/simplicity principle and the 200-LOC envelope. Final renderer is one module with one exported function + one exported error class; the inline-parse helper recurses but doesn't escape ~50 LOC.
- **Exposing `__resolveCorpusVersion__` as a test seam.** Rejected (option-B in AC-6). Env-override path is sufficient + simpler.
- **Removing the `>` blockquote lines from icar-license.md by rewriting them as plain paragraphs.** Rejected — the subset explicitly escapes raw HTML/angle-brackets rather than rejecting them; `>` at line-start renders as `&gt;` in a paragraph, which is semantically OK and matches the existing source-text intent. Avoids gratuitous content edit.
- **Two separate fixes for fixture-multi page-a/page-b/non-md.** Combined into the builder commit since they're build-pipeline-test fixtures, not production content.

**Framework gotchas avoided:**

- `assert.throws` with custom Error matcher requires returning `true` (truthy) from the predicate; I structured the predicate as `(err) => { assert.ok(err instanceof MarkdownSubsetError); return true; }` — the existing test code does this correctly; my impl preserved the error class identity so `instanceof` works across module boundaries.
- `node --test` file parallelism — preserved per-test `mkdtempSync` pattern from Story 3-6; no shared `dist/` write. Verified by running unit + scaffold builds in same suite without flake.
- The `parseFrontmatter` mini-parser treats `asserts: []` as the literal scalar string `"[]"` because it only handles block-list form (`asserts:\n  - "foo"`). Validation just checks key-presence, so this is benign — but it's a sharp edge worth flagging for Story 4.3 (real schema validator). I added a comment to the icar-license fixture commit, but if Story 4.3 lands `lint-frontmatter`, it must handle empty-list syntax.
- `execSync` with no matching tag returns non-zero exit + stderr; the try/catch absorbs it and the catch block silently falls through to literal fallback — verified by running on the current repo (no `corpus-v*` tag → `v0.1.0` is the resolved version, matching Story 3-6 URL contract).

**Areas of uncertainty:**

- **List-depth detection heuristic:** I treat indents 0–1 as depth 0, 2–3 as depth 1, ≥4 as depth ≥2 (rejected). This works for `-` (depth-2 needs 2 spaces) and `1.` (depth-2 needs 3 spaces; `1.` plus space takes 3 columns). The architecture spec doesn't pin exact indent semantics; the all-permitted fixture uses 2-space `-` nesting + 3-space `1.` nesting and both pass. **Auditor should look harder** at: do we handle 4-space-indented nested ordered lists (which some authors might use)? Current impl rejects them as depth ≥ 2.
- **Heading-with-trailing-hash:** ATX heading regex allows optional trailing `#`s (CommonMark "closing sequence"). Not exercised by any test; harmless if author uses it; out-of-spec if author over-indents. Auditor: validate the regex doesn't accidentally accept `#### text ####extra` as a heading with mangled content.
- **Reference-link URL parsing:** I use `\S+` for the URL (no quoted-URL form, no title-attribute form). The all-permitted fixture uses a plain `/corpus/markdown-subset-v1` URL. Auditor: if any in-repo content adds a CommonMark-style `[ref]: <url> "title"`, the regex won't match and the build will fail. Currently no such content exists.
- **Inline link in nested-list body:** the `renderList` calls `renderInline` per-item; inline links inside nested items should work but aren't explicitly tested. The all-permitted fixture exercises this only at depth-0.

**Tested edge cases:**

- `tests/unit/tools/markdown-subset.test.mjs` — 45 tests covering each AC-1 construct happy-path + each forbidden-construct reject + MarkdownSubsetError `.line` / `.column` / `.sourcePath` properties + double-escape avoidance.
- `tests/contract/markdown-subset-strict-mode.spec.mjs` — 9 tests parametrized over (a) every `src/content/methodology/en/**/*.md` (4 pages), (b) `corpus/markdown-subset-v1.md` itself, (c) the positive fixture exercising every permitted construct + a determinism assert.
- `tests/unit/build-methodology.test.mjs` — 28 tests covering legacy AC-8.1..8.8 (preserved with one updated assertion) + 12 Story-4.1 ACs (env-override, fallback resolution, malformed-version-rejected, latest companion exists/byte-matches, idempotency, re-emit-into-same-outDir, no-stub-pre-wrap, no-stub-footer, body-h1-origin, version-in-masthead-and-title, 8× required-key-missing parametrized, autolink-in-body-rejected).
- `tests/scaffold/build-methodology-output.test.mjs` — 5 tests (1 updated AC-9 + 4 Story-4.1: all-4-pages-render-at-v0.1.0, latest-companion-exists, latest-bytes-equal-versioned-bytes, no-stub-pre-wrap).
- Full `make test` = 517 tests, 516 pass, 1 skipped (pre-existing skip, unrelated).
