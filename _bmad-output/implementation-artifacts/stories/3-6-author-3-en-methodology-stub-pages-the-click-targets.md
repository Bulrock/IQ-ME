---
id: 3-6-author-3-en-methodology-stub-pages-the-click-targets
title: "Story 3.6: Author 3 EN methodology stub pages (the click targets)"
status: rework
---

# Story 3.6: Author 3 EN methodology stub pages (the click targets)

## Story

As an **English-speaking test-taker clicking from a number on the score panel**,
I want **to land on a real methodology stub page that explains what that number means**,
so that **the aha-click hypothesis is tester-testable end-to-end and the methodology-handoff URL contract from Story 3.1 is exercised against actual content**.

This is **Epic 3's content-handoff story** — Stories 3-1/3-2/3-3/3-4/3-5 landed the contract ADRs + state.js + landing + consent + item-runner + result scene with the click composer that resolves `data-methodology-target` paths via `CORPUS_VERSION="v0.1.0"`. This story owns:

1. Three EN methodology stub pages at `src/content/methodology/en/scoring/{percentile-to-iq,uncertainty,overview}/index.md` — the three click targets exercised by `result.js` (Story 3-5).
2. `tools/build-methodology.mjs` — an interim stub renderer that walks `src/content/methodology/en/**/*.md`, parses frontmatter + body, wraps in minimal HTML template, emits to `dist/methodology/v0.1.0/en/scoring/<slug>/index.html`. Explicitly documented as interim infrastructure that Epic 4 supersedes.
3. `make build-methodology` Make target wired to invoke the stub.
4. `docs/corpus-build-conventions.md` updated with a note marking the stub as interim and naming Epic 4's full renderer as the eventual replacement.
5. Naming-inconsistency reconciliation: `src/index.html` `<noscript>` + `<div id="fallback">` references `/methodology/v1.0.0/en/`; `src/assessment/landing.js` references `/methodology/v1.0.0/en/`. Both flip to `/methodology/v0.1.0/en/` to align with Story 3-5's `CORPUS_VERSION="v0.1.0"` hard-code and Story 3-8's planned `corpus-v0.1.0` initial-tag (per `docs/adr/release-tag-namespace-contract.md` line 61).
6. Tests: builder unit tests (walk + render correctness, frontmatter parse, output path composition) + an integration smoke that asserts the three target paths produce non-empty HTML at the expected `dist/` locations.

## Acceptance Criteria

1. **AC-1 (`src/content/methodology/en/scoring/percentile-to-iq/index.md` — percentile page):**
   - File at exact path: `src/content/methodology/en/scoring/percentile-to-iq/index.md`.
   - YAML frontmatter (per `corpus/schema.json` — required keys present; `sourceHashEN` field initialized to a 64-char placeholder `"0".repeat(64)` since Epic 4 lands the build-time self-hash injection):
     ```yaml
     ---
     title: "What a percentile means"
     version: "0.1.0"
     lastReviewed: "2026-05-19"
     reviewer: "TBD"
     reviewerHandle: "@TBD-en-reviewer"
     asserts:
       - "percentile-from-standard-normal-cdf"
     glossaryRefs:
       - "percentile"
     sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
     pending: true
     ---
     ```
   - Body: 200–400 word plain-language EN explanation of what a percentile is. Sentence-length cap ≤30 words (NFR31). Flesch-Kincaid grade ≤12 (NFR28 — manual check at Epic 3; CI lint activates in Epic 4). Concrete content scope: (i) defines "percentile" in lay terms; (ii) gives a worked example (e.g., "a percentile of 58 means roughly 58 out of every 100 similar test-takers scored at or below your score"); (iii) notes the SAPA-norming caveat in one sentence (norming sample skewed to literate-online English-speakers); (iv) a link back to `/` (the SPA root) via a CommonMark link.
   - Markdown-subset-v1 compliance (per `corpus/markdown-subset-v1.md`): only headings, paragraphs, lists, inline code, and links. No tables, no images, no HTML blocks for this stub.
   - Body contains NO idioms (NFR31 style invariants — "by and large", "all things considered", etc. forbidden).

2. **AC-2 (`src/content/methodology/en/scoring/uncertainty/index.md` — uncertainty page):**
   - File at exact path: `src/content/methodology/en/scoring/uncertainty/index.md`.
   - Frontmatter (same structure as AC-1) with:
     ```yaml
     title: "What the uncertainty band means"
     asserts:
       - "se-total-rss"
     glossaryRefs:
       - "uncertainty"
       - "sem"
     ```
     Plus the same `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `sourceHashEN`, `pending` keys as AC-1.
   - Body: 200–400 word plain-language EN explanation. Concrete scope: (i) defines the `±N` notation as "your score is one estimate; the true score is plausibly within roughly ±N points either way at 95% confidence"; (ii) one-sentence explanation that the band combines two sources — measurement error from the test items themselves (SEM) and norming-sample uncertainty (SE_norming); (iii) explicit note that the v1 build uses `SE_norming = 0` (placeholder until Gate 9b psychometrician sign-off — defer to retro for follow-up); (iv) link back to `/`.
   - Same markdown-subset + sentence-cap + no-idioms constraints as AC-1.

3. **AC-3 (`src/content/methodology/en/scoring/overview/index.md` — IQ-scale anchor page):**
   - File at exact path: `src/content/methodology/en/scoring/overview/index.md`.
   - Frontmatter (same structure) with:
     ```yaml
     title: "What the IQ-scale number means"
     asserts:
       - "iq-scale-mean-100-sd-15"
     glossaryRefs:
       - "iqScale"
       - "gFactor"
     ```
     Plus the standard required keys.
   - Body: 200–400 word plain-language EN explanation. Concrete scope: (i) defines the IQ scale as a transform of the underlying latent ability estimate (`theta`) using the IQ scaling constants mean=100, SD=15; (ii) emphasizes the scale is a *convention*, not a measurement of "intelligence" as a unified construct (anti-credentialization framing — FR25); (iii) one-sentence link to the limitations page family ("This number does not tell you what you can do" — pointer concept, not a literal link since `/limitations/*/` lands in Epic 5); (iv) link back to `/`.
   - Same constraints as AC-1.

4. **AC-4 (`tools/build-methodology.mjs` — interim stub renderer):**
   - File at exact path: `tools/build-methodology.mjs`.
   - Stdlib-only (NFR33 — no third-party deps). Pure ESM module (`.mjs`); top-of-file comment names this as Epic 3 interim infrastructure superseded by Epic 4.
   - Invocation: `node tools/build-methodology.mjs` (no args). Optional env override `IQME_BUILD_METHODOLOGY_OUT` for tests (defaults to `dist/methodology/`). Optional env override `IQME_BUILD_METHODOLOGY_SRC` for tests (defaults to `src/content/methodology/`).
   - **Walk:** recursively walk `src/content/methodology/en/` for `*.md` files (locale-scoped to `en` for Story 3-6 v1; Epic 7 adds RU/PL). Skip non-`.md` files. Skip dotfiles.
   - **Frontmatter parse:** read the file, split on the first two `^---\s*$` delimiters; parse the YAML block as a flat mapping (hand-rolled mini-parser — handles `key: "string"`, `key: bareword`, `key:\n  - item` lists, `key: true|false`; no nested mappings beyond list-of-strings; sufficient for the corpus schema fields used). On parse failure: print `build-methodology: ERROR parsing frontmatter at <path>: <msg>` to stderr and exit 1.
   - **Body render:** the remainder after the second `---` delimiter. For Story 3-6 v1, **no markdown-to-HTML transformation**: wrap the raw markdown source verbatim inside a `<pre class="methodology-stub-source">` element. This is the simplest correct rendering — the Epic 4 `tools/markdown-subset.mjs` lands the real subset parser. Document this `<pre>`-wrap in the file's top comment.
   - **HTML template (per page):**
     ```
     <!doctype html>
     <html lang="en">
     <head>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>{frontmatter.title} — IQ-ME methodology v0.1.0</title>
     </head>
     <body>
     <header class="methodology-masthead">
       <a href="/">IQ-ME</a> · methodology corpus · <span class="methodology-masthead__version">v0.1.0</span>
     </header>
     <main>
     <h1>{frontmatter.title}</h1>
     <pre class="methodology-stub-source">{escaped-raw-markdown-body}</pre>
     </main>
     <footer class="methodology-footer">
       <p>Reviewer: {frontmatter.reviewer} ({frontmatter.reviewerHandle}). Last reviewed: {frontmatter.lastReviewed}.</p>
       <p>This page is a v0.1.0 stub. Epic 5 lands the full corpus prose. The page URL is the permanent commitment.</p>
     </footer>
     </body>
     </html>
     ```
     - `{escaped-raw-markdown-body}` escapes `&`, `<`, `>` (and only those) per the minimal HTML-text-escape rule. No attribute-escaping needed because the body sits inside `<pre>` text.
     - `{frontmatter.title}` is similarly text-escaped.
     - The CSS classes (`methodology-masthead`, `methodology-stub-source`, `methodology-footer`) are NAMED but no CSS file is shipped in Story 3-6 — Epic 4/5 lands the corpus stylesheet. The class names are a forward commitment to the future stylesheet's selectors.
   - **Output path composition:**
     - Source: `src/content/methodology/en/scoring/percentile-to-iq/index.md`
     - Output: `dist/methodology/v0.1.0/en/scoring/percentile-to-iq/index.html`
     - Mapping: replace prefix `src/content/methodology/` with `dist/methodology/v0.1.0/`; replace trailing `.md` with `.html`. The version segment (`v0.1.0`) is **hard-coded** in this stub (matches Story 3-5's CORPUS_VERSION + Story 3-8's planned `corpus-v0.1.0` tag); Epic 4 replaces with `git describe --tags --match 'corpus-v*' --abbrev=0` derived value.
   - **Directory creation:** uses `fs.mkdirSync(dir, { recursive: true })`.
   - **Determinism:** no `Date.now()`, no `Math.random()`, no env-time-dependent values inside the emitted HTML. The frontmatter's `lastReviewed` is the only date in the output (sourced from the author's pin, not the build time). Re-running the builder twice in a row produces byte-identical output (verified by AC-7).
   - **Exit codes:** 0 on success, 1 on any parse/IO error with a useful stderr message.
   - **No `console.log` for normal-path output**; a single `process.stdout.write` line at the end summarizing `built N pages → dist/methodology/v0.1.0/en/` is acceptable (the existing Makefile pattern uses `@echo` for friendly messages — keep the stdout line terse).

5. **AC-5 (`Makefile` — wire `build-methodology` target):**
   - Modify the existing `build-methodology:` target in `Makefile`. Replace the current placeholder `@echo "build-methodology: no corpus content to render..."` line with `node tools/build-methodology.mjs`.
   - The `.PHONY` declaration already lists `build-methodology`; no change there.
   - `make build` (the umbrella) already chains `build-methodology` + `build-determinism-marker`; no change needed.
   - After this story: `make build-methodology` exits 0 and writes 3 HTML files to `dist/methodology/v0.1.0/en/scoring/<slug>/index.html`.

6. **AC-6 (`docs/corpus-build-conventions.md` — note the interim stub):**
   - Modify `docs/corpus-build-conventions.md`. Add a new section titled `## Epic 3 interim stub builder` (or extend the existing `## Pipeline land schedule` section) with:
     - A one-paragraph note: "Epic 3 ships `tools/build-methodology.mjs` as an interim stub that renders markdown via `<pre>`-wrap and emits to `dist/methodology/v0.1.0/en/` for three scoring pages. Epic 4 (Story 4.1) replaces this stub with the full subset-parsing renderer + per-corpus-release re-emit semantics. The output URL pattern is the permanent commitment (per the methodology-handoff URL ADR); the rendering quality is interim."
   - Existing sections unchanged.

7. **AC-7 (index.html + landing.js version literal reconciliation):**
   - Modify `src/index.html` lines 25 and 31: replace `/methodology/v1.0.0/en/` with `/methodology/v0.1.0/en/` (two occurrences). This aligns the `<noscript>` + non-modular-browser fallback links with the Story-3-5 `CORPUS_VERSION="v0.1.0"` hard-code and the Story-3-6 emitted-pages location.
   - Modify `src/assessment/landing.js` line 31 (or wherever the `landing__methodology-link` `href` is composed): replace `/methodology/v1.0.0/en/` with `/methodology/v0.1.0/en/`. Confirm the change does not regress the `landing-scene.test.mjs` unit tests; if the test pins the literal string, update the test fixture to match `v0.1.0` (the test asserts the link is composed correctly, not the version literal — but verify).
   - No other source files reference `/methodology/v1.0.0/`; verify via `grep -rn "/methodology/v1.0.0" src/ tests/ docs/` returning zero hits after this change.

8. **AC-8 (`tests/unit/build-methodology.test.mjs` — builder unit tests):**
   - File at exact path: `tests/unit/build-methodology.test.mjs`.
   - Uses `node:test` + `node:assert/strict` + `child_process.spawnSync` to invoke the builder with `IQME_BUILD_METHODOLOGY_SRC` + `IQME_BUILD_METHODOLOGY_OUT` overrides pointing at synthetic fixtures + a temp output directory (`os.tmpdir()` + a unique subdir; cleaned up via `fs.rmSync(dir, { recursive: true, force: true })` in test teardown).
   - Fixtures live at `tests/fixtures/build-methodology/`:
     - `fixture-ok/en/scoring/sample-page/index.md` — valid frontmatter + body.
     - `fixture-malformed-yaml/en/sample/index.md` — frontmatter that fails the hand-rolled parser (e.g., unterminated string).
     - `fixture-no-frontmatter/en/sample/index.md` — file missing the `---` delimiters entirely.
     - `fixture-multi/en/scoring/page-a/index.md` + `fixture-multi/en/scoring/page-b/index.md` — two pages to assert the walk visits both.
   - **Tests:**
     - AC-8.1: `fixture-ok` → exit 0, `dist/.../sample-page/index.html` exists, content includes `<title>` from frontmatter, body wrapped in `<pre class="methodology-stub-source">`.
     - AC-8.2: `fixture-malformed-yaml` → exit 1, stderr names the file + an indication of parse failure.
     - AC-8.3: `fixture-no-frontmatter` → exit 1, stderr indicates missing frontmatter (acceptable: same code path as malformed YAML; the message must be informative).
     - AC-8.4: `fixture-multi` → exit 0, BOTH output files exist at `dist/.../page-a/index.html` and `dist/.../page-b/index.html`.
     - AC-8.5: HTML-text-escape correctness — a fixture with `<`, `>`, `&` in the body produces `&lt;`, `&gt;`, `&amp;` in the `<pre>` content (no double-escape, no attribute-escape — `&quot;`/`&#39;` not required inside `<pre>` text).
     - AC-8.6: Idempotence — run the builder twice against `fixture-ok`; the second run produces byte-identical output (`fs.readFileSync(path1)` equals `fs.readFileSync(path2)` after both runs, OR via SHA-256 comparison).
     - AC-8.7: Non-md files in the source tree are skipped (fixture includes a `.txt` and a `.json` file — both ignored).
     - AC-8.8: Source-grep — no `Math.random`, no `Date.now`, no `setTimeout`, no `localStorage`, no third-party imports in `tools/build-methodology.mjs`.

9. **AC-9 (`tests/scaffold/build-methodology-output.test.mjs` — integration smoke for the real corpus):**
   - File at exact path: `tests/scaffold/build-methodology-output.test.mjs`.
   - Uses `node:test` + `node:assert/strict` + `child_process.spawnSync` to invoke `make build-methodology` (or `node tools/build-methodology.mjs` directly for environment-portability), then asserts the three real output files exist:
     - `dist/methodology/v0.1.0/en/scoring/percentile-to-iq/index.html`
     - `dist/methodology/v0.1.0/en/scoring/uncertainty/index.html`
     - `dist/methodology/v0.1.0/en/scoring/overview/index.html`
   - For each, assert: file is non-empty, contains the frontmatter `title` in `<title>`, contains `<pre class="methodology-stub-source">`, contains the masthead `v0.1.0` span.
   - Use `fs.rmSync("dist", { recursive: true, force: true })` to clean up at test teardown.
   - This test runs as part of the `tests/scaffold/` suite (already discovered by `node --test 'tests/scaffold/**/*.test.mjs'` per Makefile line 17).

10. **AC-10 (lint-claims-manifest compatibility — page existence assertion):**
    - The existing `tools/lint-claims-manifest.mjs` (Story 2.7) checks that `methodology-path` files exist on disk. `METHODOLOGY_CLAIMS.json` references:
      - `src/content/methodology/en/scoring/percentile-to-iq.md` (claim `percentile-from-standard-normal-cdf` and `iq-scale-mean-100-sd-15`)
      - `src/content/methodology/en/scoring/uncertainty.md` (claim `se-total-rss`)
    - **Path-shape note:** the manifest uses *flat-file* paths (`...scoring/percentile-to-iq.md`); this story creates *folder/index.md* paths (`...scoring/percentile-to-iq/index.md`). Update `METHODOLOGY_CLAIMS.json` to use the folder/index.md form so the lint finds the files. This is the durable form (matches the URL `<slug>/index.html` shape; Epic 4/5 will all use folder-index form per `docs/corpus-build-conventions.md`).
    - After this update: `make lint` continues to pass (warn-mode), and the manifest references resolve to existing files. **NO strict-mode toggle** in this story — Story 2.7 keeps warn-mode default; the `--strict` graduation lands per Story 4.3 / Story 5.x.
    - Three claims (`irt-2pl-model`, `eap-estimation-method`, `quadpts-61`, `theta-lim-pm-6`, `prior-standard-normal`, `golden-vector-parity-0001-logits`) reference pages NOT created by this story (`irt-2pl.md`, `eap.md`, `golden-vectors.md`). The lint already warns on these (warn-mode allows missing methodology pages); no change needed in Story 3-6. They land in Epic 5.

11. **AC-11 (no-regression: prior tests + lints stay green):**
    - All unit tests from Stories 3-3 + 3-4 + 3-5 + Epic 1/2 (`landing-scene.test.mjs`, `consent-scene.test.mjs`, `routing.test.mjs`, `item-runner.test.mjs`, `result.test.mjs`, `reveal-stage.test.mjs`, `lint-css-source-co-equal.test.mjs`, scoring tests) continue to pass.
    - All contract tests (`state-shape.spec.mjs`, `item-parameters-schema.spec.mjs`, `reveal-stage-event-contract.spec.mjs`) continue to pass.
    - `make lint` exit 0 — all existing lints + the unchanged `lint-claims-manifest` (warn-mode) pass after the `METHODOLOGY_CLAIMS.json` path-shape update.
    - The `app-modules-bytes` budget is NOT touched by this story (build-methodology lives in `tools/`, not in the SPA bundle). The CSS LOC budget (1500) is NOT touched (no CSS authored).
    - `landing-scene.test.mjs` continues to pass after the `landing.js` href update; if it pins the literal version string, update the assertion to match `v0.1.0`.

12. **AC-12 (`make test` + `make test-contract` + `make lint` + `make build-methodology` exit-0 verification):**
    - `make test` exits 0 with `~ 8 new unit tests + 1 new scaffold test = ~9 net-new`. Previous baseline (end-of-3-5): unit ≥ 404, contract ≥ 25. New target: unit ≥ 412, contract ≥ 25, scaffold count increases by 1.
    - `make test-contract` exits 0; no new contract tests in this story.
    - `make lint` exits 0; all lints green.
    - `make build-methodology` exits 0; produces 3 HTML files at the expected `dist/` paths.
    - `make build` exits 0 (chains build-methodology + build-determinism-marker; the determinism-marker tool from Epic 1 should continue to work — the marker is content-agnostic).

## Tasks / Subtasks

- [x] **Task 1: Author the 3 EN methodology stub pages (AC-1, AC-2, AC-3)**
  - [x] 1.1 Create `src/content/methodology/en/scoring/percentile-to-iq/index.md` with frontmatter + 200–400 word body.
  - [x] 1.2 Create `src/content/methodology/en/scoring/uncertainty/index.md` with frontmatter + body.
  - [x] 1.3 Create `src/content/methodology/en/scoring/overview/index.md` with frontmatter + body.
  - [x] 1.4 Manual reading-level + sentence-cap check (no automated lint until Epic 4 — eyeball each body, count sentences > 30 words, replace any idioms).

- [x] **Task 2: Implement `tools/build-methodology.mjs` (AC-4)**
  - [x] 2.1 ESM module skeleton with stdlib imports (`node:fs`, `node:path`, `node:url`, `node:process`).
  - [x] 2.2 Hand-rolled frontmatter parser (split on `---` delimiters; flat key:value + list-of-strings YAML).
  - [x] 2.3 Recursive walker over `src/content/methodology/en/`; collect `*.md` paths.
  - [x] 2.4 Per-file render: parse frontmatter, escape body text, compose HTML from template, compute output path.
  - [x] 2.5 `mkdirSync(dir, { recursive: true })` + `writeFileSync(out, html)`.
  - [x] 2.6 Error handling: stderr message + exit 1 on parse / IO failure.
  - [x] 2.7 Source-grep self-check (no Math.random / Date.now / setTimeout / localStorage / third-party imports).

- [x] **Task 3: Wire `make build-methodology` (AC-5)**
  - [x] 3.1 Edit `Makefile` line for `build-methodology:` target; replace `@echo` placeholder with `node tools/build-methodology.mjs`.
  - [x] 3.2 Verify `make build-methodology` exits 0 and writes the 3 expected files.

- [x] **Task 4: Update `docs/corpus-build-conventions.md` (AC-6)**
  - [x] 4.1 Insert the interim-stub note in the `## Pipeline land schedule` section (or as a new sibling section).

- [x] **Task 5: Reconcile version literals (AC-7)**
  - [x] 5.1 Edit `src/index.html` — flip two occurrences of `v1.0.0` → `v0.1.0` in the `<noscript>` + fallback `<article>` blocks.
  - [x] 5.2 Edit `src/assessment/landing.js` — flip the `landing__methodology-link` href to `/methodology/v0.1.0/en/`.
  - [x] 5.3 Update `tests/unit/landing-scene.test.mjs` if it pins the literal `v1.0.0`.
  - [x] 5.4 Verify `grep -rn "/methodology/v1.0.0" src/ tests/ docs/` returns zero hits.

- [x] **Task 6: Update `METHODOLOGY_CLAIMS.json` paths (AC-10)**
  - [x] 6.1 Edit `methodology-path` fields for the three claim entries that resolve to files this story creates:
    - `percentile-from-standard-normal-cdf` and `iq-scale-mean-100-sd-15`: → `src/content/methodology/en/scoring/percentile-to-iq/index.md`
    - `se-total-rss`: → `src/content/methodology/en/scoring/uncertainty/index.md`
  - [x] 6.2 Run `make lint` and confirm `lint-claims-manifest` no longer warns on these specific paths.

- [x] **Task 7: Author tests (AC-8, AC-9)**
  - [x] 7.1 Create `tests/fixtures/build-methodology/` fixtures (4 sub-trees: fixture-ok, fixture-malformed-yaml, fixture-no-frontmatter, fixture-multi).
  - [x] 7.2 Author `tests/unit/build-methodology.test.mjs` — 8 tests (AC-8.1 through AC-8.8).
  - [x] 7.3 Author `tests/scaffold/build-methodology-output.test.mjs` — single integration smoke that runs the real builder and asserts the 3 outputs.

- [x] **Task 8: Verify (AC-11, AC-12)**
  - [x] 8.1 `make test` exit 0; ≥ 412 unit pass + new scaffold test pass.
  - [x] 8.2 `make test-contract` exit 0 (no change expected).
  - [x] 8.3 `make lint` exit 0; all lints green.
  - [x] 8.4 `make build-methodology` exit 0; 3 HTML files present at expected paths.
  - [x] 8.5 Re-run `make build-methodology` and assert byte-identical re-output (determinism smoke; can be a manual `diff` or as part of AC-8.6 inside the test).
  - [x] 8.6 Stories 3-3 / 3-4 / 3-5 unit + contract tests all stay green; result.js click-to-navigate composes URLs that now resolve to existing files (manual smoke: `python3 -m http.server 8000 --directory dist/` and click through — optional but recommended).

## Dev Notes

### What this story is and is NOT

**IS:**
1. Three EN methodology stub pages at folder/index.md form (`src/content/methodology/en/scoring/{percentile-to-iq,uncertainty,overview}/index.md`).
2. `tools/build-methodology.mjs` — an interim stub renderer (markdown → `<pre>`-wrapped HTML; no subset parsing).
3. Wiring: `Makefile` `build-methodology:` target; `METHODOLOGY_CLAIMS.json` path updates; `docs/corpus-build-conventions.md` note; `index.html` + `landing.js` version-literal reconciliation.
4. Tests: 8 unit + 1 scaffold integration.

**IS NOT:**
- The full markdown-subset parser (`tools/markdown-subset.mjs`) — Epic 4, Story 4.1.
- The full corpus stylesheet (CSS for `.methodology-masthead`, `.methodology-stub-source`, `.methodology-footer`) — Epic 5.
- `tools/lint-frontmatter.mjs` (corpus/schema.json validator) — Epic 4, Story 4.3.
- `tools/lint-reading-level-en.mjs` (NFR28 FK grade ≤12 CI lint) — Epic 4, Story 4.4.
- `tools/lint-glossary.mjs` (NFR30 glossary-first) — Epic 4, Story 4.4.
- `tools/lint-translation-parity.mjs` (NFR27 block-level parity) — Epic 7, Story 4.7 (no-op stub at v0.0.1 — see corpus-build-conventions.md).
- RU/PL stub pages — Epic 7.
- The remaining ~27 EN methodology pages per the corpus inventory — Epic 5.
- The `--strict` graduation of `lint-claims-manifest` — Story 4.3 / Story 5.x.
- Per-corpus-release re-emit semantics (NFR25) — Epic 4 (`tools/build-methodology.mjs` real renderer).
- The `corpus-v0.1.0` git tag — Story 3-8 (epic-3 closeout) per `docs/adr/release-tag-namespace-contract.md` line 61.
- The full `<masthead>` component with version-mismatch hatnote, Cite-this-page widget, stale-translation banner — Epic 4 (`src/css/components/methodology-masthead.css`) / Epic 4 Story 4.6.
- Real `sourceHashEN` self-hash computation in EN pages — Epic 4 (the build sets it; Story 3-6's stub leaves a 64-char zero placeholder).

### Critical decisions encoded here

**Decision 1: Folder/index.md form (not flat `.md`).** The methodology URL pattern (`/methodology/<v>/<lang>/<path>/`) is slash-terminated per the methodology-handoff URL ADR. The natural source-to-URL mapping is `src/content/methodology/<lang>/<path>/index.md` → `dist/methodology/<v>/<lang>/<path>/index.html`. This matches the URL trailing-slash semantic exactly and is the form Epic 4/5 will use for ~30 EN pages. Story 3-6 lands this convention now (instead of flat `.md` + post-build renaming) so the path discipline is established before Epic 4 inherits 30 files.

**Decision 2: `<pre>`-wrap raw markdown, no subset parsing.** The simplest correct rendering. Epic 4's `tools/markdown-subset.mjs` lands the strict-subset parser with the contract guarantees (no out-of-subset HTML, glossary-link rewriting, etc.). For Story 3-6's three pages, a `<pre>`-wrap shows the source text verbatim — a tester clicking from the score panel sees real content, not a 404, and the page makes the aha-click work. The reading experience is interim-ugly but the URL contract and the navigability are real. Story 3-8's hallway test will surface whether the `<pre>`-wrap is *too* ugly to trigger the hypothesis; the interim posture is intentional.

**Decision 3: Hard-code `v0.1.0` in the builder.** Per the methodology-handoff URL ADR's "Build-time baking" rule, Epic 4's real renderer derives the version from `git describe --tags --match 'corpus-v*' --abbrev=0`. For Story 3-6 v1, the tag does not yet exist (Story 3-8 creates it); hard-coding `v0.1.0` keeps the build runnable. Document the hard-code at the top of `tools/build-methodology.mjs` with an inline comment naming Story 3-8's tag and Epic 4's `git describe` injection as the eventual replacement.

**Decision 4: Reconcile `v1.0.0` → `v0.1.0` in index.html + landing.js NOW, not in Story 3-8.** Story 3-5 self-review (Decision 3 / Areas of uncertainty 4) flagged this inconsistency for a future bridge. Story 3-6 owns the methodology content, so the version literals in its consumer surfaces (index.html `<noscript>`, landing.js link) should align with the actually-emitted pages. Story 3-8 will still tag `corpus-v0.1.0` per the release-tag ADR; the source literals already match by then. Keeping the change in Story 3-6 prevents Story 3-8 from doing both an epic-closeout hallway test AND a code change (separation of concerns).

**Decision 5: `pending: true` in the frontmatter.** Per the corpus schema, `pending: true` lets `lint-frontmatter.mjs` (when it lands in Epic 4 Story 4.3) skip strict validation. The Story-3-6 stubs are explicitly placeholder content; marking them pending makes the v0.0.1 → v0.1.0 → ... promotion explicit. Epic 5 flips `pending: false` when the page content reaches reviewer-of-record sign-off.

**Decision 6: `sourceHashEN` placeholder is 64 zeros, not omitted.** The schema requires `sourceHashEN` for every page (the EN pages' field will be self-hash after Epic 4's build sets it). Story 3-6 cannot compute the self-hash deterministically without running the Epic 4 builder; using a 64-char zero placeholder satisfies the schema's pattern (`^[0-9a-f]{64}$`) and is a recognizable sentinel for the build to overwrite. Epic 4's real renderer will write the actual SHA-256 of the EN body.

**Decision 7: Manual reading-level + style checks in this story (no automated lints).** NFR28 (Flesch-Kincaid ≤12) and NFR30 (glossary-first) lints land in Epic 4. For Story 3-6's three pages, the dev/author does manual checks: count sentence lengths, eyeball the FK grade (Hemingway-style — short sentences, common words), avoid idioms. Document the manual check in the self-review.

**Decision 8: Update `METHODOLOGY_CLAIMS.json` paths to folder/index.md.** The manifest was authored in Story 2.7 with flat-file paths assumed. This story creates folder/index.md paths; updating the manifest now (instead of post-Epic-4) keeps `lint-claims-manifest` warning-counts honest from this story forward and locks in the URL-shape-aligned source-path convention.

### Architecture compliance — references

| Topic | Source |
|---|---|
| Methodology corpus URL pattern | `docs/adr/methodology-handoff-url-contract.md` (Story 3-1) |
| Per-corpus-release re-emit semantics | `docs/corpus-build-conventions.md` NFR25 section, prd.md NFR25 |
| Corpus frontmatter schema | `corpus/schema.json` (Story 1.4) |
| Markdown subset v1 | `corpus/markdown-subset-v1.md` (Story 1.4) |
| `tools/build-methodology.mjs` (full renderer, Epic 4) | architecture.md line 196 |
| Methodology-claims manifest (NFR23 parity) | `METHODOLOGY_CLAIMS.json` + `tools/lint-claims-manifest.mjs` |
| Style invariants (NFR31) | `docs/corpus-build-conventions.md` Style invariants section |
| Reading-level discipline (NFR28) | prd.md NFR28 (FK grade for EN — CI lint in Epic 4) |
| Glossary-first rule (NFR30) | `docs/corpus-build-conventions.md` Glossary-first section |
| Score-panel click composer (consumer) | `src/assessment/result.js` (Story 3-5) — composes `/methodology/v0.1.0/en/scoring/<path>/` |
| `CORPUS_VERSION = "v0.1.0"` (Story 3-5 hard-code) | `src/assessment/result.js` |
| Release-tag namespace | `docs/adr/release-tag-namespace-contract.md` — `corpus-v0.1.0` lands in Story 3-8 |
| Stdlib-only NFR | NFR33 architecture.md |
| `app-modules-bytes` budget — NOT touched | `budgets.json` (build-methodology lives outside SPA bundle) |

### Previous story intelligence (from Stories 3-1, 3-5, 1-4, 2-7)

- **Story 3-1** authored `docs/adr/methodology-handoff-url-contract.md`. Story 3-6 emits pages at the exact URL pattern that ADR pins (slash-terminated, version-segmented, locale-segmented). Re-read the ADR before authoring the builder; the output-path composition rule is the contract.
- **Story 3-5** hard-coded `CORPUS_VERSION = "v0.1.0"` in `src/assessment/result.js`. Story 3-6's emitted pages MUST live at `/methodology/v0.1.0/en/scoring/<path>/` to match the click composer's URLs. Verify post-build by manually clicking through the live slice (or via the Story 3-7 full-slice Playwright spec when it lands).
- **Story 3-5 byte-budget lesson** does NOT apply to this story — `tools/build-methodology.mjs` lives outside the SPA bundle (`app-modules-bytes` only counts `src/assessment/**.js` + `src/scoring/**.js`).
- **Story 3-3 / 3-4 / 3-5 frozen-test discipline** (lesson-2026-05-19-001): once test-author phase completes for Story 3-6, the two test files become integrity-tracked. Edits after that point require `tds integrity record --as=<role> --files=<path> --reason=<text>` BEFORE state-commit. Plan testing carefully.
- **Story 1-4** authored `corpus/schema.json` + `corpus/markdown-subset-v1.md` + `corpus/methodology-claims-v1.schema.json` + `corpus/manifest.schema.json` at v0.0.1. Story 3-6's frontmatter MUST validate against `corpus/schema.json` (manually — `lint-frontmatter.mjs` lands in Epic 4). The `pending: true` field is the escape hatch.
- **Story 2-7** authored `METHODOLOGY_CLAIMS.json` + `tools/lint-claims-manifest.mjs`. The lint is in warn-mode default; Story 3-6 keeps it that way. Strict mode graduates per Story 4.3 / Story 5.x.
- **Story 1-9 lint precedents** (`tools/lint-no-*.mjs`): stdlib-only, env-var test injection (`IQME_LINT_TARGET`), exit 0/1 with stderr BREACH messages. `tools/build-methodology.mjs` follows the same stdlib-only + env-injection (`IQME_BUILD_METHODOLOGY_SRC`, `IQME_BUILD_METHODOLOGY_OUT`) pattern.
- **Story 1-10** locked the two-layer CSS architecture (semantic tokens). Story 3-6 does NOT author CSS; the masthead/footer CSS classes named in the HTML template are forward commitments to Epic 5's stylesheet.

### Files added / modified summary (anticipated)

**New (3 content files):**
- `src/content/methodology/en/scoring/percentile-to-iq/index.md`
- `src/content/methodology/en/scoring/uncertainty/index.md`
- `src/content/methodology/en/scoring/overview/index.md`

**New (1 tool file):**
- `tools/build-methodology.mjs`

**New (2 test files):**
- `tests/unit/build-methodology.test.mjs`
- `tests/scaffold/build-methodology-output.test.mjs`

**New (~5 fixture files):**
- `tests/fixtures/build-methodology/fixture-ok/en/scoring/sample-page/index.md`
- `tests/fixtures/build-methodology/fixture-malformed-yaml/en/sample/index.md`
- `tests/fixtures/build-methodology/fixture-no-frontmatter/en/sample/index.md`
- `tests/fixtures/build-methodology/fixture-multi/en/scoring/page-a/index.md`
- `tests/fixtures/build-methodology/fixture-multi/en/scoring/page-b/index.md`
- (optional, AC-8.7) `tests/fixtures/build-methodology/fixture-non-md/en/sample.txt` + `sample.json`

**Modified (4 files):**
- `Makefile` — wire `build-methodology` target.
- `docs/corpus-build-conventions.md` — interim-stub note.
- `src/index.html` — flip `v1.0.0` → `v0.1.0` (two locations).
- `src/assessment/landing.js` — flip methodology link to `v0.1.0`.
- `METHODOLOGY_CLAIMS.json` — three `methodology-path` entries flipped to folder/index.md form.
- Possibly: `tests/unit/landing-scene.test.mjs` if it pins the literal `v1.0.0` (verify; update if needed).

**Deleted (0 files):** None.

### Testing standards summary

- All test files use `node:test` + `node:assert/strict` (matching Story 3-3 / 3-4 / 3-5 precedent).
- The unit test uses `child_process.spawnSync` to invoke the builder; fixtures live under `tests/fixtures/build-methodology/`.
- The scaffold test runs against the real corpus content (the 3 stub pages from AC-1/2/3); it asserts both the build runs AND the outputs are well-formed.
- Test count delta: ~8 new unit tests + 1 scaffold test = ~9 net-new. Previous baseline (end-of-3-5): unit ≥ 404. Target: ≥ 412 unit; scaffold count +1.
- The scaffold test must be order-independent (cleans `dist/` at start; re-runs the build) so `make test` ordering does not matter.

### Project Structure Notes

- `src/content/methodology/en/` currently empty (the directory exists per the architecture mkdir scaffold). This story adds the first 3 EN methodology pages — establishing the folder/index.md form for Epic 4/5.
- `dist/` is in `.gitignore` (presumably — verify); the builder's output is build-artifact, not source. The scaffold test produces and cleans `dist/`; do not commit it.
- `tools/` currently contains 11+ scripts. This story adds 1 (`build-methodology.mjs`); no budget impact.
- `tests/fixtures/` already contains subdirs from prior stories (`network-trace-baseline.html`, `lint-css-source-co-equal/`, etc.); this story adds `build-methodology/`.

### Implementation Notes — gotchas to avoid

1. **Hand-rolled YAML parser scope.** The corpus frontmatter is intentionally flat — no nested mappings beyond list-of-strings. Implement the parser narrowly: support `key: value` (string, true, false, bareword), `key: "quoted string"`, `key: ['a', 'b']` inline list, and `key:\n  - item1\n  - item2` block list. Document the supported subset at the top of the parser function; everything else throws a parse error. Epic 4's real `lint-frontmatter.mjs` uses a real YAML parser; the stub's limitation is acceptable for the 3 stub pages.
2. **Trailing-slash + index.html convention.** The output path is `dist/methodology/v0.1.0/en/scoring/<slug>/index.html`. Static-server URL resolution: a request to `/methodology/v0.1.0/en/scoring/percentile-to-iq/` (trailing slash, no `index.html`) serves the `index.html` file inside. This matches GitHub Pages behavior. Story 3-7's full-slice Playwright spec will verify the click composer's URL navigates correctly — but only if the dev server serves `index.html` on trailing-slash request (verify with `python3 -m http.server` against `dist/`).
3. **HTML escape correctness.** Inside `<pre>`, only `&`, `<`, `>` need escape. NOT `"`, NOT `'` (those are only attribute-context). Escape order matters: escape `&` first, then `<` and `>` (otherwise the `&` of `&lt;` gets re-escaped).
4. **Determinism.** No `Date.now()` in the emitted HTML. No `Math.random()` in path generation or HTML attributes. The frontmatter's `lastReviewed` is the only date that appears in the output, and it's sourced from the author's pin (not the build time). Re-running the build must produce byte-identical output (AC-8.6 asserts this).
5. **Frontmatter version-string discipline.** The corpus schema requires `version: <X>.<Y>.<Z>` (no leading `v`). The URL-segment version DOES have a leading `v` (per the ADR). Don't conflate: the frontmatter is `"0.1.0"`, the URL segment is `v0.1.0`.
6. **Page-back link in body.** Each page body links back to `/` (the SPA root). Use a CommonMark link: `[Back to IQ-ME](/)`. Inside the `<pre>`-wrap, this is rendered verbatim as text (not as a clickable link) — that's a known limitation of the stub renderer. The link becomes clickable in Epic 4 when the real subset parser runs. The page still satisfies the "link back" AC because the source contains it; the test asserts the source string presence, not the rendered click.
7. **NFR31 style invariants — manual check.** Read each body aloud. If a sentence has more than 30 words, split it. If an idiom appears ("by and large", "at the end of the day", etc.), rewrite. No metaphors stronger than the literal claim ("the IRT model is the engine under the hood" — rejected; just say "the IRT model"). Avoid 2nd-person imperatives in claims ("we compute" not "you can see we compute"). Document the manual check in the self-review.
8. **The `landing-scene.test.mjs` assertion.** If the test pins the literal href string, the version flip in `landing.js` will break it. Fix forward: update the test assertion to match `v0.1.0`. This is a one-line change; flag it as a frozen-test edit per lesson-2026-05-19-001 if the test was integrity-recorded by Story 3-3's test-author phase.
9. **`METHODOLOGY_CLAIMS.json` path-shape ripple.** Verify after Task 6: `tools/lint-claims-manifest.mjs` warn-mode pass. The lint reports warnings (existing) for the 5+ pages NOT created by this story; that's correct (warn-mode tolerates missing pages). The lint MUST NOT error on the 3 pages this story creates.
10. **`dist/` cleanup in tests.** The scaffold test must clean `dist/` at start (or use a temp dir). Otherwise a developer running `make test` after a manual `make build-methodology` would see stale outputs. Use `fs.rmSync("dist", { recursive: true, force: true })` at test setup.
11. **The `make build` chain.** `make build` chains `build-methodology` + `build-determinism-marker`. The latter (Epic 1) scans build outputs; verify it still passes after the 3 new HTML files appear. If it asserts something specific about file count or content, may need a one-line tweak — but the Epic 1 tool's contract is about scoring engine determinism, not corpus content, so likely no impact.
12. **Frontmatter `asserts:` cross-reference.** Each `assert` key in the frontmatter must appear in `METHODOLOGY_CLAIMS.json` as a `claim-id`. Verify:
    - `percentile-to-iq/index.md` asserts `"percentile-from-standard-normal-cdf"` — present in manifest ✓
    - `uncertainty/index.md` asserts `"se-total-rss"` — present in manifest ✓
    - `overview/index.md` asserts `"iq-scale-mean-100-sd-15"` — present in manifest ✓
    
    All three asserts resolve to existing manifest entries. `lint-claims-manifest` warn-mode does NOT yet enforce this direction (it goes manifest → pages); but Story 4.3's `--strict` graduation will. Pinning correct asserts now avoids future churn.
13. **`overview` page's `asserts` claim.** The IQ-scale claim is `iq-scale-mean-100-sd-15`. Manifest currently maps it to `percentile-to-iq.md` — this story should EITHER (a) keep that manifest entry and have `overview/index.md` separately assert it (frontmatter assertion does not require manifest uniqueness — the `asserts:` array on the page just lists what the page covers), OR (b) reroute the manifest's `iq-scale-mean-100-sd-15` entry to `overview/index.md` since that's where the IQ-scale explanation lives. Option (b) is the more honest split (the percentile page is about percentiles; the overview page is about the IQ scale). Implement option (b) in Task 6.2: split the manifest's two claims (`percentile-from-standard-normal-cdf` → percentile-to-iq; `iq-scale-mean-100-sd-15` → overview).

### References

- [Source: _bmad-output/planning-artifacts/epics.md] lines 1075-1098 — Story 3.6 ACs.
- [Source: _bmad-output/planning-artifacts/architecture.md] line 196 (build-methodology renderer scope), line 226-228 (mkdir scaffold), line 158 (corpus build framing), line 196-199 (Epic 4 LOC budget).
- [Source: _bmad-output/planning-artifacts/prd.md] FR28-FR36 (Methodology Corpus), NFR25 (per-corpus-release), NFR28 (reading-level), NFR30 (glossary-first), NFR31 (style invariants), NFR23 (claims manifest parity), NFR33 (stdlib-only).
- [Source: docs/adr/methodology-handoff-url-contract.md](../../../docs/adr/methodology-handoff-url-contract.md) — URL pattern contract.
- [Source: docs/adr/release-tag-namespace-contract.md](../../../docs/adr/release-tag-namespace-contract.md) — `corpus-v0.1.0` initial-tag discipline (Story 3-8).
- [Source: docs/corpus-build-conventions.md](../../../docs/corpus-build-conventions.md) — corpus build conventions.
- [Source: corpus/schema.json](../../../corpus/schema.json) — frontmatter schema.
- [Source: corpus/markdown-subset-v1.md](../../../corpus/markdown-subset-v1.md) — markdown subset.
- [Source: METHODOLOGY_CLAIMS.json](../../../METHODOLOGY_CLAIMS.json) — claims manifest.
- [Source: _bmad-output/implementation-artifacts/stories/3-5-implement-reveal-stage-event-score-panel-css-source-co-equal-triplet-lint.md] — score-panel click composer (consumer).
- [Source: src/assessment/result.js, src/assessment/landing.js, src/index.html] — version-literal consumer sites.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7) via Claude Code, orchestrator role: bmad-tds-execute-epic delegating engineer + test-author phases inline.

### Debug Log References

- TDD red phase: `node --test 'tests/unit/build-methodology.test.mjs'` → 8 failing (ENOENT on tools/build-methodology.mjs).
- After authoring `tools/build-methodology.mjs`: 7/8 passing. AC-8.8 failed because the comment string "no Date.now / Math.random in output" tripped the source-grep self-check (re-encountered the 3-3 lesson — `lesson-2026-05-19-001` — comment text containing forbidden tokens trips source-grep lints).
- Comment circumlocution applied ("no time-source or RNG calls in output"); 8/8 unit tests pass.
- Scaffold smoke initially red (3 EN methodology pages absent); green after authoring `percentile-to-iq`, `uncertainty`, `overview` index.md pages.
- `tests/unit/landing-scene.test.mjs` pinned literal `/methodology/v1.0.0/en/`; integrity record under engineer role required (test was frozen by Story 3-3 test-author phase). Recorded with reason citing Story 3-5 self-review areas-of-uncertainty 4.
- Full suite: 420/420 tests pass. Lint: 11 lints green (lint-claims-manifest emits 6 expected WARNs for Epic 5 stub pages — irt-2pl/eap/golden-vectors).

### Completion Notes List

- All 8 tasks complete. 8 unit tests + 1 scaffold test green (target: ≥412 unit; achieved 420 total, +9 net-new vs end-of-3-5).
- `make build-methodology` produces 4 HTML pages (the 3 Story-3-6 scoring stubs + the pre-existing `provenance/icar-license.md` from earlier work — both render via the same stub renderer). The scaffold test asserts the 3 Story-3-6 paths exclusively.
- `make build` (full chain) exits 0; `build-determinism-marker.mjs` produces a stable SHA over the build output.
- `app-modules-bytes` budget unchanged (build-methodology lives outside SPA bundle).
- Version-literal reconciliation `v1.0.0 → v0.1.0` complete across `src/index.html`, `src/assessment/landing.js`, `tests/unit/landing-scene.test.mjs` (frozen-test edit per lesson-2026-05-19-001 — integrity recorded). `grep -rn "/methodology/v1.0.0"` returns no hits across src/tests/docs/tools/.
- `METHODOLOGY_CLAIMS.json` paths updated to folder/index.md form. The `iq-scale-mean-100-sd-15` claim rerouted from percentile-to-iq.md → overview/index.md per spec impl-note 13 (the more honest split — overview owns the IQ-scale prose).
- All three frontmatter `asserts:` cross-reference existing manifest `claim-id`s; manifest no longer warns on the 3 Story-3-6 pages (still warns on 6 Epic-5 stub pages as expected, warn-mode default).

### File List

- src/content/methodology/en/scoring/percentile-to-iq/index.md (new)
- src/content/methodology/en/scoring/uncertainty/index.md (new)
- src/content/methodology/en/scoring/overview/index.md (new)
- tools/build-methodology.mjs (new)
- tests/unit/build-methodology.test.mjs (new)
- tests/scaffold/build-methodology-output.test.mjs (new)
- tests/fixtures/build-methodology/fixture-ok/en/scoring/sample-page/index.md (new)
- tests/fixtures/build-methodology/fixture-malformed-yaml/en/sample/index.md (new)
- tests/fixtures/build-methodology/fixture-no-frontmatter/en/sample/index.md (new)
- tests/fixtures/build-methodology/fixture-multi/en/scoring/page-a/index.md (new)
- tests/fixtures/build-methodology/fixture-multi/en/scoring/page-b/index.md (new)
- tests/fixtures/build-methodology/fixture-non-md/en/sample/index.md (new)
- tests/fixtures/build-methodology/fixture-non-md/en/sample/extra.txt (new)
- tests/fixtures/build-methodology/fixture-non-md/en/sample/extra.json (new)
- Makefile (modified — build-methodology target wired)
- docs/corpus-build-conventions.md (modified — Epic 3 interim stub note added)
- src/index.html (modified — version literals)
- src/assessment/landing.js (modified — version literal)
- tests/unit/landing-scene.test.mjs (modified — frozen-test edit; integrity-recorded)
- METHODOLOGY_CLAIMS.json (modified — folder/index.md paths; iq-scale claim rerouted to overview)

## Specialist Self-Review

**Decisions made:**

1. **`iq-scale-mean-100-sd-15` claim rerouted to overview/index.md** (per spec impl-note 13 Option B). The percentile page is about percentiles; the IQ-scale prose lives in overview. This is the honest split. Confirmed `lint-claims-manifest` warn-count drops by 1 on this entry after the route.

2. **Frontmatter parser kept narrow** — supports only `key: value`, `key: "quoted"`, `key: true|false`, and block `key:\n  - item` lists. The hand-rolled state machine fits in ~70 LOC. Inline-list (`key: [a, b]`) is NOT supported because the 3 Story-3-6 pages all use block-list form. Epic 4's real `lint-frontmatter.mjs` validates against `corpus/schema.json` properly; the stub parser is intentionally narrow.

3. **HTML escape only inside `<pre>` body + `<title>`** — `& < >` only; not `"` or `'`. Inside `<pre>`, attribute-context escapes are not needed. The HTML template embeds frontmatter strings (`reviewer`, `reviewerHandle`, `lastReviewed`) as `<p>` text content where the same minimal escape suffices.

4. **Walker uses sorted iteration** for deterministic output order. Without sorting, `readdirSync` order is platform-dependent and AC-8.6 (idempotence) would silently regress on different filesystems.

5. **Builder error path uses `die()` helper that writes to stderr + `exit(1)`** — single-message single-exit pattern matches the Epic 1 lint scripts. No partial output on parse failure (the build fails fast).

**Alternatives considered:**

1. **Inline-list YAML support in the parser** — rejected. None of the 3 Story-3-6 frontmatter blocks use inline lists; adding support would expand the parser's surface for zero current callers. Epic 4 will use a real YAML parser anyway.

2. **Bundle the `<pre>`-wrapped body inside `<article>` instead of `<main>`** — neutral choice; `<main>` is the WAI-ARIA landmark for primary content, matching the SPA's `<main id="app">`. Kept `<main>` for landmark consistency.

3. **Use `import.meta.dirname` (Node 22+) instead of `fileURLToPath`** — preferred for new code, but the existing tools/ scripts use `fileURLToPath`; matched convention.

4. **Generate the HTML via template literals vs explicit string concatenation** — chose concatenation for clarity; the template is small and the explicit form makes the escape-points obvious for review.

**Framework gotchas avoided:**

- **Source-grep comment lesson (lesson-2026-05-19-001)** caught immediately when AC-8.8 failed; comment text "no Date.now / Math.random" rewritten as "no time-source or RNG calls".
- **Sort the walker entries** for cross-platform determinism (AC-8.6 byte-identity).
- **HTML escape order**: `&` first, then `<` `>`. Reverse order double-escapes.
- **`mkdirSync({ recursive: true })`** instead of manual parent-traversal — handles deep paths.
- **`make build-determinism-marker.mjs`** still works after the build-methodology stub starts producing real output; the marker is content-agnostic (SHA over the dist tree).

**Areas of uncertainty:**

1. **The pre-existing `src/content/methodology/en/provenance/icar-license.md`** (from earlier story work — Story 1-3?) is picked up by the walker and renders into `dist/methodology/v0.1.0/en/provenance/icar-license.html`. This was NOT in scope for Story 3-6 but is a natural side-effect of the walker. The page renders cleanly (frontmatter parses, body wraps in `<pre>`). Auditor may want to flag whether this page's frontmatter is up-to-date or whether it should be excluded from the Epic-3-stub walker. I left it in because excluding it would require an exclusion list, which is more code than letting the walker pick everything up.

2. **The `pending: true` frontmatter** is set on all 3 Story-3-6 pages because they are interim. Epic 4's `lint-frontmatter.mjs` will respect this flag (skip strict validation). Epic 5's content authors will flip `pending: false` when reviewer sign-off lands. This is a forward commitment.

3. **The `sourceHashEN` 64-zero placeholder** matches the schema pattern but is not a real hash. Epic 4's build will compute and write the real self-hash. If Epic 4 lands a schema check that requires non-zero `sourceHashEN`, the placeholder will need migration; for now it satisfies the schema and is recognizable.

4. **`asserts:` parity is one-directional** at this story scope. The manifest's 3 Story-3-6 claims (`percentile-from-standard-normal-cdf`, `iq-scale-mean-100-sd-15`, `se-total-rss`) each appear in exactly one page's `asserts:` list. Strict-mode graduation (Story 4.3) will validate both directions; warn-mode default tolerates the one-direction state.

5. **Manual reading-level + style check on the 3 pages** — eyeballed each body; sentences ≤30 words; no idioms; no metaphors stronger than the literal claim; second-person only in the "Back to IQ-ME" link text (acceptable per Style invariants — 2nd-person is restricted in claims, not in navigation). Flesch-Kincaid grade ≤12 estimated by inspection (short sentences, common words); Epic 4's CI lint will measure precisely.

**Tested edge cases:**

- AC-8.2: malformed YAML (unterminated quoted string) → exit 1, stderr matches `/parsing|parse|frontmatter|yaml/i`. ✓
- AC-8.3: missing frontmatter delimiters → exit 1, stderr matches `/frontmatter|missing|delimiter|---/i`. ✓
- AC-8.5: body with `<tag> & "quotes"` → produces `&lt;tag&gt;`, `&amp;`, with no double-escape (`&amp;lt;` absent). ✓
- AC-8.6: idempotent byte-identical re-run (SHA-256 equality across two runs of fixture-ok). ✓
- AC-8.7: `.txt` + `.json` siblings in the source tree skipped by walker. ✓
- AC-8.8: source-grep self-check (no Math.random / Date.now / setTimeout / localStorage / non-stdlib imports). ✓
- All 419 prior-story tests stay green; budget under limit; lint 11/11 green.

## Auditor Findings (round-1)

### [blocker] `tests/scaffold/build-methodology-output.test.mjs` shares the `dist/` directory with `tests/unit/dev-server.test.mjs:91` (`AC-8.5: GET methodology stub page`) and unconditionally calls `rmSync(DIST, { recursive: true, force: true })` in both setup (line 33) and the `finally` block (line 54). Under default node:test file-parallelism this races: the build-methodology test wipes `dist/` while the dev-server test (or a subsequent build-methodology invocation) is reading it. Reproducible: 3 of 4 sequential `make test` runs failed with `ERR_ASSERTION: expected output at /Users/maksim/git/IQ-ME/dist/methodology/v0.1.0/en/scoring/percentile-to-iq/index.html`. Per Decision Tree A7 (existing tests broken / flakiness > 2% — observed ~75%) this is a blocker before epic-3 squashes into main, because CI will inherit the same flakiness and start failing pr-checks on unrelated PRs.


- **Category:** test-quality / flakiness
- **Suggested fix:** Recommended: isolate the build-methodology test's output directory by using a per-test temp dir (e.g. `mkdtempSync(join(tmpdir(), "iqme-build-meth-"))`) and passing it to `build-methodology.mjs` via an env var (`BUILD_METHODOLOGY_OUT`) or CLI flag. Symmetrically gate `dev-server.test.mjs:91` against the shared `dist/` (read-only, no rm) — it already `t.skip()` if absent, which is correct behavior. Net: no test ever rm's the shared `dist/` directory.
Alternative: serialize the offending tests with `test.before`/`test.after` orchestration into a single suite that locks the dist directory. Simpler but less isolating.

- **Suggested bridge:** `"Adopt per-test temp dirs for any dist-touching test (and any future test that mutates a shared sibling-test artefact). One-paragraph convention note added to docs/local-build-instructions.md or a new docs/test-isolation.md."
`
