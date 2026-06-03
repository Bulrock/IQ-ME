---
id: 6-6-top-decile-tear-edge-overlay-cropping-fuzzer
title: "Story 6.6: Top-decile tear-edge overlay + cropping fuzzer"
status: review
tds:
  primary_specialist: frontend
---

# Story 6.6: Top-decile tear-edge overlay + cropping fuzzer

## Story

As a **top-decile test-taker (Daria journey)**,
I want **the score-panel composition to visually bind the caveat + uncertainty band to the score such that producing a clean decontextualized screenshot requires deliberate editing (FR24, UX Innovation #4)**,
So that **the anti-credentialization-by-composition is mechanically enforced — and a cropping fuzzer in CI catches future regressions of the tear-edge invariant (Murat's bank-frozen-flag discipline)**.

## Acceptance Criteria

1. **AC-1 (tear-edge markup — `result.js`, top-decile only):** Extend `panel()` in `src/assessment/result.js` so that when `variant === "top-decile"` the rendered `.score-panel--top-decile` contains a single `<svg class="score-panel__tear-edge" aria-hidden="true" focusable="false" …>` overlay element. The overlay is decorative (`aria-hidden="true"`, not a triplet member, no `tabindex`, no `data-methodology-target`) and is rendered **only** for the top-decile variant — `mid-band` and `bottom-decile` panels MUST NOT contain a `.score-panel__tear-edge` element (count === 0). The SVG draws a horizontal "torn paper" edge (a jagged path the full content width); no raster asset, no external file (zero-third-party invariant). The element is positioned in DOM so it straddles the seam between the `.score-panel__caveat` and the `.score-panel__triplet` (current `panel()` order: caveat `<p>` first, then triplet `<div>`). Recommended: render the `<svg>` as the last child of the `.score-panel__caveat` element (SVG is valid phrase content inside `<p>`), so it can be anchored to the caveat's own box in CSS (AC-2). All other `panel()` output (caveat text, triplet, difficulty sentence, tail-scene) is unchanged.

2. **AC-2 (tear-edge CSS — viewport-robust overlap 320px→1440px):** Implement the overlay under the existing reserved selector. The default `.score-panel__tear-edge { display: none; }` in `src/css/components/score-panel.css` (line 62-64) stays as the off-state; the top-decile activation lives in `src/css/components/tail-scene-top.css` (replacing the empty placeholder block at lines 17-20 — Story 6.5 reserved it for exactly this). Requirements:
   - `.score-panel--top-decile .score-panel__caveat { position: relative; }` (positioning context) and `.score-panel--top-decile .score-panel__tear-edge { display: block; position: absolute; left: 0; right: 0; height: var(--space-6); /* band */ bottom: calc(-0.5 * var(--space-6)); pointer-events: none; }` — anchoring the band to the caveat's **bottom edge** with a half-height negative offset so the band straddles the caveat↔triplet seam. Anchoring to the caveat box (not an absolute pixel `top`) is what makes the overlap hold at **every** viewport width from 320px to 1440px regardless of how the caveat text wraps. The exact tokens (`--space-6` band height, fill `--color-…`) are the specialist's call provided the geometric invariant below holds.
   - **Geometric invariant (load-bearing — the Playwright + fuzzer assertions depend on it):** at all widths 320–1440px the rendered `.score-panel__tear-edge` bounding box MUST (a) intersect the `.score-panel__caveat` bounding box, AND (b) extend downward past the top edge of the `.score-panel__triplet` bounding box (i.e. `tearEdge.bottom > triplet.top`). This is what makes a clean score-only crop impossible without also catching the tear-edge artifact.
   - No layout shift for `mid-band` / `bottom-decile` (their panels render no overlay and need no `position: relative`).

3. **AC-3 (Playwright tear-edge bbox-overlap test — NEW, runs unconditionally):** `tests/playwright/tear-edge-overlay.spec.mjs` is created, driving a top-decile session via the established harness pattern (mirror `tests/playwright/asymmetric-tail-scenes.spec.mjs`: `start(0)` dev-server, `window.__IQME_TEST__` seed + 16 all-`1` responses → P ≥ 90, click "Show me"). Tests:
   - **Test 1 (presence + decorative):** `.score-panel--top-decile .score-panel__tear-edge` exists exactly once, is an `<svg>`, carries `aria-hidden="true"`, and is NOT keyboard-focusable (not in tab order).
   - **Test 2 (bbox overlap at boundary):** read `.score-panel__tear-edge`, `.score-panel__caveat`, and `.score-panel__triplet` `boundingBox()`; assert the tear-edge box **intersects** the caveat box (x-ranges overlap AND y-ranges overlap) AND `tearEdge.y + tearEdge.height > triplet.y` (overlap invariant from AC-2).
   - **Test 3 (viewport sweep):** repeat the Test-2 overlap assertions at viewport widths **320, 768, 1440** (heights 800) — the overlap invariant must hold at each.
   - **Test 4 (absent for non-top variants):** for a mid-band session (`i % 2`) and a bottom-decile session (all `0`), assert `.score-panel__tear-edge` count === 0.
   - **Test 5 (screenshot evidence):** capture `.score-panel--top-decile` to a Playwright `toHaveScreenshot`-style snapshot OR attach the PNG to the report (the screenshot is the human-auditable artifact the AC calls for); a missing-baseline first run is acceptable (the CI gate is the bbox assertions in Tests 2-3, not pixel-diff).

4. **AC-4 (cropping-fuzzer tool — NEW, pure + deterministic):** `tools/cropping-fuzzer.mjs` is created as a stdlib-only ES module with NO DOM / Playwright import (so it is unit-testable in isolation and reusable from the spec). It exports:
   - `makeRng(seedHex)` — a small deterministic PRNG (seed string → `() => float in [0,1)`), so crop generation is reproducible across runs/PRs (no flakiness).
   - `generateCrops({ panel, n, rng })` → array of `n` crop rectangles `{ x, y, width, height }`, each fully inside the `panel` rect, with randomized window sizes/positions (include some deliberately tight windows around the score region).
   - `intersects(a, b)` and `overlapFraction(target, crop)` geometry helpers (fraction of `target`'s area covered by `crop`).
   - `assessCrop(crop, { caveat, tearEdge, score }, opts)` → `{ showsScore, showsCaveatOrTearEdge, verdict }` where:
     - `showsScore` = `overlapFraction(score, crop) >= opts.scoreThreshold` (default `0.5` — a crop "shows the score" only if it captures ≥50% of the score-numeral area, so trivial slivers don't count);
     - `showsCaveatOrTearEdge` = `intersects(caveat, crop) || intersects(tearEdge, crop)` (the tear-edge counts as the caveat surviving — it is the bound artifact);
     - `verdict`: `"pass"` if `!showsScore || showsCaveatOrTearEdge`; `"fail"` if `showsScore && !showsCaveatOrTearEdge` (a clean, decontextualized score-only crop — the regression the fuzzer exists to catch).
   - Document the contract in a file header comment (mirror the existing `tools/lint-*.mjs` header style).

5. **AC-5 (cropping-fuzzer Playwright spec — NEW, conditionally gated on `bankFrozen`):** `tests/playwright/cropping-fuzzer.spec.mjs` is created. **First action:** read `corpus/manifest.json`; if `bankFrozen !== true`, `test.skip()` the entire suite with a clear annotation (`"cropping-fuzzer gated: corpus/manifest.json bankFrozen !== true"`) — per Murat, the fuzzer must not fire while the bank is unfrozen (avoids alert-fatigue from late content edits). When `bankFrozen === true` it:
   - drives a top-decile session (as AC-3), reads `boundingBox()` of `.score-panel--top-decile` (panel), `.score-panel__triplet` (score), `.score-panel__caveat` (caveat), `.score-panel__tear-edge` (tearEdge);
   - calls `generateCrops({ panel, n: N, rng: makeRng(SEED) })` with a fixed seed and `N` ≥ 50 synthetic crops;
   - runs each crop through `assessCrop(crop, { caveat, tearEdge, score })` and asserts **no crop returns `verdict === "fail"`** — i.e. there is no crop window that captures ≥50% of the score area while excluding both the caveat and the tear-edge overlay. A `"fail"` verdict means the tear-edge composition regressed (a clean score-only screenshot became possible) and the spec turns the CI job red with the failing crop rectangle in the assertion message.
   - Optionally also unit-test the tool directly via `node --test` in `tests/unit/cropping-fuzzer.test.mjs` (pure-geometry fixtures: a known score-only crop → `"fail"`; a crop catching the tear-edge → `"pass"`; an empty-region crop → `"pass"`). This unit test runs unconditionally (no bankFrozen gate) and is the fast inner-loop check for the geometry logic.

6. **AC-6 (`corpus/manifest.json` — NEW, schema-valid, `bankFrozen: true`):** Create `corpus/manifest.json` conforming to `corpus/manifest.schema.json` (required: `corpusVersion`, `itemBankVersion`, `lockedAtCorpusVersion`, `bankFrozen`; `additionalProperties: false`). The item-bank is frozen at end-of-Epic-5, so **`bankFrozen: true`** (decision confirmed at story-creation: activate the gate now). Version fields use the existing corpus/item-bank version pin — verify against the in-repo source of truth (e.g. `CV` in `src/assessment/result.js` is `"v0.1.0"`; the schema wants bare semver `0.1.0`). Set `corpusVersion`, `itemBankVersion`, and `lockedAtCorpusVersion` to the same current pin (e.g. `"0.1.0"`) unless a more authoritative pin exists in the build pipeline. Omit the optional `releaseTagSha` / `archival` (Epic 8 populates) — `additionalProperties: false` means only commit fields you intend. Confirm `node tools/lint-frontmatter.mjs` (which validates `corpus/manifest.json` against the schema per Story 4.3 / epics.md line 580) passes on the new file.

7. **AC-7 (CI activation — `cropping-fuzzer` job goes live + tear-edge spec runs):** In `.github/workflows/pr-checks.yml`:
   - Replace the `cropping-fuzzer` stub job (currently `if: false`, lines 334-340) with a real job: `actions/checkout@v4` + `actions/setup-node@v4` (node 22) + `npx --yes playwright install --with-deps chromium` + `npx --yes playwright test tests/playwright/cropping-fuzzer.spec.mjs` (mirror the `chrome-components` job at lines 226-227). The spec self-gates on `bankFrozen`, so the job is green-by-skip when unfrozen and a real gate when frozen; with AC-6 committing `bankFrozen: true`, this job actively runs on every PR.
   - Add a sibling job (e.g. `tear-edge-overlay`) running `npx --yes playwright test tests/playwright/tear-edge-overlay.spec.mjs`, OR run both specs in the one job — either way the tear-edge bbox assertions (AC-3) execute in CI unconditionally.
   - Leave the separate `viewport-overflow` stub (lines 326-332) untouched — it is a distinct Epic-6 concern, out of scope for this story.

## Tasks / Subtasks

- [x] **Task 1: tear-edge markup in `result.js` (AC-1)**
  - [x] Extend `panel()` to render `<svg class="score-panel__tear-edge" aria-hidden="true" focusable="false">` (with the jagged `<path>`) as the last child of the caveat, top-decile variant only.
  - [x] Guard with `variant === "top-decile"` so mid/bottom panels emit no overlay element.
- [x] **Task 2: tear-edge CSS overlay (AC-2)**
  - [x] Add `.score-panel--top-decile .score-panel__caveat { position: relative; }` + the `.score-panel--top-decile .score-panel__tear-edge` block in `src/css/components/tail-scene-top.css` (replace the empty Story-6.5 placeholder).
  - [x] Verify the geometric invariant (tear-edge ∩ caveat AND tear-edge.bottom > triplet.top) holds at 320 / 768 / 1440px.
- [x] **Task 3: Playwright tear-edge overlap spec (AC-3)**
  - [x] Author `tests/playwright/tear-edge-overlay.spec.mjs` (Tests 1-5) mirroring the asymmetric-tail-scenes harness.
- [x] **Task 4: cropping-fuzzer tool (AC-4)**
  - [x] Author `tools/cropping-fuzzer.mjs` (`makeRng`, `generateCrops`, `intersects`, `overlapFraction`, `assessCrop`) — pure, deterministic, stdlib-only.
- [x] **Task 5: cropping-fuzzer spec + unit test (AC-5)**
  - [x] Author `tests/playwright/cropping-fuzzer.spec.mjs` with the `bankFrozen` self-gate + ≥50 seeded crops + no-`fail`-verdict assertion.
  - [x] Author `tests/unit/cropping-fuzzer.test.mjs` (`node --test`) for the geometry verdicts.
- [x] **Task 6: corpus manifest.json (AC-6)**
  - [x] Create the schema-valid manifest with `bankFrozen: true` and the current version pin; confirm `node tools/lint-frontmatter.mjs` passes.
- [x] **Task 7: CI activation (AC-7)**
  - [x] Replace the `cropping-fuzzer` stub job with a live Playwright job; add/extend a job so the tear-edge spec runs; leave `viewport-overflow` alone.

## Dev Notes

- **Render path (read before touching `result.js`):** `panel()` (src/assessment/result.js:53-57) builds the panel as a template literal: `<section class="score-panel score-panel--${variant}">` → `<p class="score-panel__caveat" role="note">` → `<div class="score-panel__triplet">…</div>` → difficulty sentence → `tailScene(...)`. The decile modifier `--${variant}` is already wired (Story 6.5 AC-5). The triplet members are built by `SP(n,p,l,x)` which adds `tabindex="0"` + `data-methodology-target` — your tear-edge SVG must do **neither** (it is decorative, `aria-hidden`). Keep using the `E()` escape helper for any text; the SVG path is static markup (no interpolation).
- **Why anchor the overlay to the caveat box (AC-2):** an absolute pixel `top` breaks when the caveat wraps to 2-3 lines at 320px. Anchoring `bottom: calc(-0.5 * <band>)` to the caveat (`position: relative`) makes the band track the caveat's actual bottom edge at every width, guaranteeing the overlap invariant the tests assert. `.score-panel { position: … }` is currently unset — set `position: relative` on the caveat (not the panel) to avoid affecting the triplet/difficulty layout.
- **Fuzzer is geometry, not OCR (AC-4/5):** the "does the caveat survive cropping?" assertion is evaluated from element bounding boxes, not pixel content — deterministic, fast, and CI-stable. The tear-edge counts as the caveat surviving because the overlay is the artifact that binds caveat→score. The `overlapFraction(score, crop) >= 0.5` threshold is what makes "score-only" meaningful (a 2px sliver of a numeral is not a usable decontextualized screenshot). Keep `makeRng` seeded so a failing crop is reproducible across PR re-runs.
- **`bankFrozen` gate (AC-5/6):** the spec reads `corpus/manifest.json` at module load and `test.skip()`s when `bankFrozen !== true`. This is Murat's discipline — the fuzzer stays dormant during content churn and only becomes a hard gate once the bank is declared frozen. We commit `bankFrozen: true` this story (Epic-5 corpus is done), so the gate is live immediately; the `cropping-fuzzer` CI job (AC-7) therefore actively runs rather than skip-passing.
- **Test harness pattern:** copy the driving scaffold from `tests/playwright/asymmetric-tail-scenes.spec.mjs` verbatim where possible — `import { start } from "../../tools/dev-server.mjs"`, `beforeAll`/`afterAll`, `driveToResultScene`, `window.__IQME_TEST__` seed+responses, `page.getByRole("button", { name: /show me/i }).click()`. All-`1` responses → top-decile (P ≥ 90); `i % 2` → mid; all-`0` → bottom. `@playwright/test` is run via `npx --yes playwright test <spec>` (no `playwright.config.*` in repo; each spec is self-contained with its own dev-server). Unit tests use `node --test` (see `tests/contract/*.spec.mjs`, `tests/exit-criteria/*.spec.mjs`).
- **Zero-third-party invariant:** the SVG is inline (no `<img src>`, no external sprite); the tear-edge must not introduce any network request. The bottom-decile zero-third-party Playwright assertion (asymmetric spec Test 5) is unaffected since the overlay is top-decile only.
- **Test-discipline note:** this story runs the TEA test-author phase first (the Playwright specs + the `node --test` fuzzer unit test are authored and frozen), then the frontend specialist implements the tear-edge markup/CSS + `cropping-fuzzer.mjs` tool + `manifest.json` + CI to turn them green. The fuzzer **tool** (`tools/cropping-fuzzer.mjs`) is production code (impl phase); its **unit test** is test-author scope.

### Carry-forward lessons

- lesson-2026-05-20-007 (severity=high): Stories that touch class-A frozen tests must carry a populated `### Carry-forward lessons` section, else the integrity-record ceremony gets skipped (fired 3× in epic-5). Apply: this section is populated from `tds memory query` before impl; if you edit any already-frozen test file during impl, re-register integrity immediately (see next lesson).
- lesson-2026-05-19-001 (severity=high): Cross-story / post-impl edits to frozen tests silently drift `tds integrity`; re-register via `tds integrity record --as=frontend --file=<path> --story=<id> --notes=…` is required and easy to skip. Apply: after any Edit to a path with `artefact_class=A` in `state-manifest.yaml`, run `tds integrity record` BEFORE `tds state-commit`, or revert the edit. The new specs this story authors are frozen in the test-author phase — do not edit them in the impl phase without re-recording.
- lesson-2026-05-19-013 (severity=high): Direct YAML edits to `state-manifest.yaml` can be silently undone by the next `tds state-commit` sweep re-recording the path. Apply: never hand-edit `state-manifest.yaml`; let the CLI manage integrity rows. Not expected to bite this story (no manifest surgery planned) but relevant if integrity drift appears.
- lesson-2026-05-18-001 (severity=high): `tds` CLI needs Python ≥3.10 + ruamel; on macOS prefix `PATH=/opt/homebrew/bin:$PATH` if `tds` resolves system python 3.9. Apply: `tds` already resolves correctly in this session (orient/preflight ran clean) — no action unless a `ModuleNotFoundError: ruamel` appears.

### Project Structure Notes

- One-component-per-file CSS rule (architecture §1610): the tear-edge activation lives in `tail-scene-top.css` (Story 6.5 reserved the selector there) — do **not** create a new CSS file for it; the off-state default stays in `score-panel.css`.
- New files: `tools/cropping-fuzzer.mjs`, `tests/playwright/tear-edge-overlay.spec.mjs`, `tests/playwright/cropping-fuzzer.spec.mjs`, `tests/unit/cropping-fuzzer.test.mjs`, `corpus/manifest.json`. Modified files: `src/assessment/result.js`, `src/css/components/tail-scene-top.css`, `.github/workflows/pr-checks.yml`. The base `.score-panel__tear-edge { display: none; }` in `score-panel.css` stays as-is (it is the off-state).
- `corpus/manifest.json` is validated by `tools/lint-frontmatter.mjs` against `corpus/manifest.schema.json` — keep `additionalProperties: false` in mind (commit only the four required fields unless you intend more).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.6] — ACs (tear-edge overlap 320-1440px; cropping-fuzzer + bank-frozen gate; manifest activation).
- [Source: _bmad-output/planning-artifacts/epics.md#UX-DR25] — top-decile anti-credentialization composition with tear-edge overlay active (line 289); FR24 caveat-bound-to-score.
- [Source: _bmad-output/planning-artifacts/epics.md#UX-DR22] — score-panel apex includes the tear-edge overlay (line 286).
- [Source: corpus/manifest.schema.json] — `bankFrozen` contract + required fields (lines 8, 25-29).
- [Source: src/assessment/result.js#panel] — render path the overlay hooks into (lines 53-57).
- [Source: src/css/components/tail-scene-top.css] — reserved `.score-panel--top-decile .score-panel__tear-edge` selector slot (lines 17-20, Story 6.5).
- [Source: src/css/components/score-panel.css] — off-state `.score-panel__tear-edge { display: none; }` (lines 61-64).
- [Source: tests/playwright/asymmetric-tail-scenes.spec.mjs] — driving harness pattern (decile forcing, dev-server, `__IQME_TEST__`).
- [Source: .github/workflows/pr-checks.yml] — `cropping-fuzzer` stub to activate (lines 334-340); `chrome-components` job as the Playwright-job template (lines 226-227).

## Dev Agent Record

### Agent Model Used

frontend (vanilla JS ES modules + CSS custom-properties/BEM + Playwright `@playwright/test` + `node --test`). primary specialist: frontend.

### Debug Log References

### Completion Notes List

- Top-decile tear-edge overlay (caveat-anchored SVG, viewport-robust 320-1440px) + pure-geometry cropping-fuzzer tool/spec gated on bankFrozen:true + corpus/manifest.json + CI activation. All tests green: cropping-fuzzer unit 16/16, tear-edge-overlay 7/7, fuzzer spec 1/1; no regression in score-panel specs.

### File List

- tools/cropping-fuzzer.mjs
- src/assessment/result.js
- src/css/components/tail-scene-top.css
- corpus/manifest.json
- .github/workflows/pr-checks.yml
- tests/unit/cropping-fuzzer.test.mjs
- tests/playwright/tear-edge-overlay.spec.mjs
- tests/playwright/cropping-fuzzer.spec.mjs

## Specialist Self-Review

**Decisions made:**

- **Tear-edge anchored to the caveat box, not an absolute pixel `top`.** `.score-panel--top-decile .score-panel__caveat { position: relative }` makes the overlay's containing block the caveat; the band is positioned by `bottom`/`height` relative to the caveat's bottom edge. This is the load-bearing choice — it makes the overlap invariant (tear∩caveat ∧ tear.bottom>triplet.top) hold at every viewport 320→1440px regardless of how the caveat text wraps (verified by the viewport sweep test).
- **Tall, mostly-transparent SVG box with the visible jagged stroke in its top sliver.** The element bounding box deliberately dips ~0.6 of the triplet height below the seam (`bottom:-60px`, `height:72px` from `--space-7/6/5/3` tokens) so no crop capturing ≥50% of the score area can avoid it; the *visible* torn line is a thin `stroke`-only path (viewBox y≈2–6 of 20, `vector-effect:non-scaling-stroke`) that renders near the seam, leaving the rest of the box a transparent binding zone. The fuzzer + AC-3 measure the element **bbox** (documented contract), so the binding zone is intentional, not a rendering artifact.
- **`bankFrozen: true` committed now** (per the create-time decision): the item-bank is frozen post-Epic-5, so the cropping-fuzzer CI job is a live gate on every PR immediately rather than dormant.
- **Fuzzer is pure geometry (bbox), not OCR/pixel-diff.** `assessCrop` classifies a crop from bounding-box intersection: a crop "shows the score" if it covers ≥`scoreThreshold` (0.5) of the triplet area; the tear-edge counts as the caveat surviving (it is the binding artifact). Deterministic (seeded `makeRng`) → CI-stable, reproducible failures.
- **Two CI jobs:** `tear-edge-overlay` runs the bbox invariant unconditionally; `cropping-fuzzer` runs the unit test (always) + the Playwright fuzzer (self-gated on `corpus/manifest.json bankFrozen`). The `viewport-overflow` stub was left untouched (distinct Epic-6 concern, out of scope).

**Alternatives considered:**

- *Absolute pixel `top` for the overlay* — rejected: breaks when the caveat wraps to 2–3 lines at 320px (the seam moves). Anchoring to the caveat box tracks it.
- *Filled "torn-paper" SVG body* — rejected: a filled box dipping into the triplet would obscure the numerals. Used a stroke-only path + transparent binding box instead.
- *Pixel-diff screenshot as the hard gate* — rejected: baseline flakiness across OS/font rendering. The hard gate is the bbox geometry (Tests 2–3) + the fuzzer; the screenshot is attached as human-auditable evidence (Test 5), not a pass/fail pixel comparison.
- *OCR "caveat text survives the crop"* — rejected: heavy + flaky. Geometric bbox intersection (tear-edge-counts-as-caveat) is the deterministic proxy.

**Framework gotchas avoided:**

- SVG is valid phrase content inside the `<p class="score-panel__caveat">`; markup is static (no interpolation) so the existing `E()` escape discipline is untouched.
- `preserveAspectRatio="none"` stretches the jagged edge to the panel width; `vector-effect="non-scaling-stroke"` keeps the stroke width constant despite the stretch.
- The overlay is `position:absolute` (out of flow) → no layout shift / no CLS, and it does not push the triplet — the co-equal-triplet computed-style invariants (Story 6.1) still pass (verified).
- `pointer-events:none` so the decorative overlay never intercepts clicks on the triplet's methodology targets; `aria-hidden="true"` + `focusable="false"` keep it out of the a11y tree and tab order.

**Areas of uncertainty (auditor, look here):**

- The fuzzer's robustness depends on the overlay box dipping ~0.6 into the triplet height. If a future `--font-size-600` / line-height change makes the triplet substantially taller, the 60px dip could need re-tuning. This fails *safe*: a regression surfaces as a fuzzer `fail` (CI red), never a silent pass. The unit test pins the *logic*; the Playwright spec validates *real geometry*.
- Using the SVG **bbox** (including the transparent binding zone) as the "tear-edge region" rather than the visible stroke is a deliberate, documented choice aligned with AC-3 ("tear-edge SVG bounding box overlaps the caveat element bounding box"). A reviewer who expected the *visible* stroke geometry should confirm they're comfortable with the bbox contract.

**Tested edge cases:**

- Viewport sweep 320 / 768 / 1440px — overlap invariant holds at each (tear-edge-overlay Test 3).
- Overlay absent (count===0) on mid-band + bottom-decile → no element, no possible layout shift (Test 4).
- Fuzzer verdict logic (unit test): score-only-below-tear crop at the 0.5 threshold with edge-touching-≠-intersect ⇒ `fail`; tear-catching / caveat-catching / sub-threshold / empty-region / configurable-threshold ⇒ `pass`; determinism + bounds + divide-by-zero guard pinned.
- Fuzzer on real DOM: 64 seeded crops over the rendered top-decile panel ⇒ zero `fail` verdicts.
- `bankFrozen` gate: suite runs when `true` (confirmed live), `test.skip()`s when the manifest is absent/false.
- Regression: asymmetric-tail-scenes, co-equal-triplet computed-style, difficulty-sentence, result.js unit (15) — all green; eslint, lint-frontmatter (manifest), lint-css-source-co-equal, cognitive-load-budget — all green.
