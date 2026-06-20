---
id: 14-7-restrained-aurora-assessment-route-and-no-timer-ui
title: "Story 14.7: Restrained Aurora assessment route and no-timer UI"
status: done
---

# Story 14.7: Restrained Aurora assessment route and no-timer UI

> **Post-epic visual-alignment correction (2026-06-14):** the selected
> `01-aurora-glass-observatory.png` layout keeps the Observatory backdrop and a
> compact IQ-ME identity bar on the assessment screen. The working panel remains
> restrained and static, and the no-timer policy remains unchanged. This
> correction supersedes AC2's `background-image: none` requirement and the
> previous test-route header-hide gate.

## Story

As a **test-taker working through the assessment**,
I want **a calmer, restrained Aurora treatment on the question/progress/navigation/options surfaces with no timer or speed cues anywhere**,
so that **I can concentrate on pattern recognition at my own pace without depth effects, motion, or time-pressure signals competing for my attention**.

## Acceptance Criteria

1. **Restrained working-area glass (PR-23 / design §3.1).** The matrix card (`.item-runner__image`), the answer-option tiles (`.item-runner__option`), and the Previous nav button read at a deliberately LOWER glass intensity than the landing/result heroes: each uses the MUTED `--surface-glass` role (NOT `--surface-glass-strong`) as its working-area fill, with a `backdrop-filter: blur(var(--surface-glass-blur))` driven by the medium `--surface-glass-blur` SEMANTIC role (never a `--glass-blur-*`/`--glass-*` primitive). AA contrast comes from the fill alpha, never the blur, and an `@supports not (backdrop-filter: blur(1px))` opaque fallback drops the three surfaces to `--surface-glass-strong` so they stay AA-legible where the blur is unavailable. The Next button keeps its accent-fill forward affordance. No decorative aurora gradient/glow/grid is layered behind the working area. Components consume ONLY semantic roles (no literal hex/px, no inline `<style>`, zero third-party runtime per NFR6/NFR7 CSP).

2. **Route-scoped aurora suppression on the assessment route (PR-23 / design §3.1).** `base.css` adds an ADDITIVE, route-scoped `body[data-route="#/test"] { background-image: none; }` rule so the decorative aurora glows + grid are suppressed and the backdrop collapses toward a near-flat deep field — concentration protection, not spectacle. The suppression touches ONLY the decorative `background-image`; the page `background-color: var(--color-surface-base)` contract (asserted by the 14.2 chrome-components computed-style spec) is UNTOUCHED, so body-text contrast stays independent of the backdrop (WCAG 2.2 AA, SC 1.4.3). The global landing/result backdrop is undisturbed.

3. **No timer / countdown / elapsed / speed-score element anywhere on the assessment route (PR-28).** No timer, countdown, elapsed-time, stopwatch, speed-score, "time remaining", "X seconds left", or time-pressure / time-gamification element is present in the DOM or CSS of the assessment route (`item-runner.js` + `item-runner.css` + the `itemRunner` strings). Only self-paced / no-time-limit messaging is permitted. `.item-runner__progress` continues to render POSITION ONLY ("Item N of total") via the existing `progressTemplate` substitution with `{N, total}`, and the in-place update path mutates that same text with the same `{N, total}` substitution — never a duration string. No per-response timing is captured (`performance.now()` / `setInterval` absent), so the only `setTimeout` in the codebase remains the unrelated consent dwell-gate (no user-facing countdown). NFR6 (no telemetry of response timings) is preserved.

4. **No gamified/timer motion (design §3.1 / §4.2).** The restrained assessment route defines no `@keyframes` and no `animation:` declaration in `item-runner.css` — transitions stay confined to the existing short hover/focus border/shadow tweaks, which respect the global `prefers-reduced-motion` override in `base.css`. WCAG 2.2 AA is preserved (no motion that cannot be disabled) and the byte-stable deterministic build (NFR21) is unaffected.

5. **14.6 option rendering + frozen DOM contract + PR-2 layout preserved (PR-23).** The restrained glass is layered onto the working surfaces WITHOUT regressing 14.6: the `.item-runner__option-figure` width clamp, `aspect-ratio: 1 / 1` (matrix + figure + image), the `:has(input:checked)` heavier inline-start selected marker, the `input:focus-visible` token-only keyboard ring, and the additive `data-grid-rows`/`data-grid-cols` attributes all behave as specified. The frozen Epic 11/13 item-runner DOM contract (`section.item-runner`, `#item-runner-heading`, `.item-runner__progress`, `.item-runner__image`, `.item-runner__options`, `#prev-btn`, `#next-btn`) is preserved — restyle-only; no markup/JS DOM change. The PR-2 sticky `.item-runner__nav` (`position: sticky; inset-block-end: 0`), the `overflow-y: auto` options scroll region, and the `max-height` matrix sizing (42vh desktop / 30vh mobile / 32vh ≥48rem) all remain functionally intact. No scoring/result change; the co-equal Percentile/IQ-scale/Range triplet is untouched. NFR27 parity holds (no EN string touched → no PL/RU cascade, no `sourceHashEN` body altered).

6. **Node guard runs locally; rendered restraint verification deferred to 14.11 (PR-23 / PR-28).** A node guard (`tests/scaffold/14-7-restrained-assessment-no-timer.test.mjs`) RUNS in `make test` and asserts: (a) the no-timer FORBIDDING regexes (modeled on 9e-1's duration-regex) over the comment-stripped assessment-route source + the `itemRunner` strings (EN/PL/RU); (b) the progress indicator renders position only; (c) the muted `--surface-glass` working fill + the `--surface-glass-blur` semantic blur + the `@supports not` opaque fallback; (d) no decorative aurora behind the working area; (e) the `base.css` route-scoped suppression with the `--color-surface-base` contract untouched; (f) the frozen DOM contract + 14.6 option rendering + PR-2 layout + two-layer cleanliness. A DORMANT restrained-assessment-route leg is added to `tests/playwright/aurora-visual-regression.spec.mjs` (the parent `visual-regression` job stays `if: false`; Story 14.11 flips it on and commits baselines on `ubuntu-latest` — the authoring host is darwin). The `css-components-lines` budget (≤2600) is preserved.

**Requirements covered:** PR-23, PR-28
**Depends on:** 14.2, 14.6

## Tasks / Subtasks

- [x] **Task 1: Restrained working-area glass in item-runner.css (AC: 1, 4)**
  - [x] Repoint the matrix card (`.item-runner__image`), option tiles (`.item-runner__option`), and Previous nav (`.item-runner__prev`) from `--color-surface-elevated` to the MUTED `--surface-glass` fill + `backdrop-filter: blur(var(--surface-glass-blur))` + the `--surface-glass-edge` hairline (semantic roles only)
  - [x] Add an `@supports not (backdrop-filter: blur(1px))` opaque fallback dropping the three surfaces to `--surface-glass-strong` (AA where blur is unavailable)
  - [x] Confirm no `@keyframes`/`animation:` and no decorative aurora gradient/glow/grid on any item-runner surface

- [x] **Task 2: Route-scoped aurora suppression in base.css (AC: 2)**
  - [x] Add additive `body[data-route="#/test"] { background-image: none; }` so the decorative aurora collapses toward a near-flat deep field on the assessment route
  - [x] Leave the page `background-color: var(--color-surface-base)` contract untouched (the 14.2 chrome-components computed-style spec keeps passing); the global backdrop is undisturbed

- [x] **Task 3: No-timer + restraint node guard (AC: 3, 6)**
  - [x] Author `tests/scaffold/14-7-restrained-assessment-no-timer.test.mjs` — comment-stripped FORBIDDING regexes (timer/countdown/elapsed/speed-score/"X seconds left") over `item-runner.js` + `item-runner.css` + the `itemRunner` strings (EN/PL/RU); progress-position-only; muted-glass + semantic-blur + `@supports` fallback; no-decorative-aurora; base.css suppression + `--color-surface-base` untouched; frozen DOM + 14.6 rendering + PR-2 layout + two-layer cleanliness

- [x] **Task 4: Dormant restrained-assessment Playwright leg (AC: 6)**
  - [x] Add a Light + Dark restrained-assessment-route leg to `tests/playwright/aurora-visual-regression.spec.mjs` (`#/test` route); the parent job stays `if: false` until 14.11 — no pixel baselines committed here

- [x] **Task 5: Verify budgets + suite (AC: 6)**
  - [x] `node --test tests/scaffold/14-7-restrained-assessment-no-timer.test.mjs` green; full scaffold suite = the 14 pre-existing 9-series reds only (zero new); `make lint` exit 0; `css-components-lines` ≤ 2600; `src/assessment/item-runner.js` byte-identical

## Dev Notes

### Implementation strategy
- The restraint is a TOKEN choice, not new geometry: the matrix card / option tiles / Previous nav previously read at the `--color-surface-elevated` opaque elevation; this story repoints them to the MUTED `--surface-glass` role (alpha ≥0.74 dark / ≥0.72-class light) + the medium `--surface-glass-blur` semantic blur — the SAME muted role the landing hero uses, deliberately a step below the `--surface-glass-strong` consent/result intensity. AA contrast is carried by the fill alpha, never the blur (the Epic 13 lesson: blur is decorative, the fill is the contrast layer); the `@supports not (backdrop-filter)` fallback to `--surface-glass-strong` keeps the three surfaces opaque-AA where the browser can't blur.
- The Next button intentionally keeps its accent fill (`--color-action-bg`) — it is the forward affordance, not a working surface; only the neutral Previous, the matrix card, and the option tiles take the muted glass so the working area reads quietly.
- Aurora suppression is route-scoped + ADDITIVE in base.css. `body[data-route="#/test"] { background-image: none; }` zeroes ONLY the decorative gradient layers (the two glows + base linear) painted by the global `body` rule; it deliberately does NOT re-declare `background-color`, so the `--color-surface-base` theme contract the 14.2 chrome-components computed-style spec asserts on `#/test` stays exactly as 14.2 left it. base.css is not in the `css-components-lines` budget domain (`src/css/components/**`), so the +6 lines there don't count toward the cap.
- The no-timer guard strips CODE COMMENTS before scanning so the incidental word "seconds" in `item-runner.js`'s Chrome-preload dev-note ("preloaded but not used within a few seconds") is not a false positive — only real user-facing/runtime time semantics are forbidden. The progress indicator was already position-only (`progressTemplate` = "Item {N} of {total}" in all three locales); the guard pins that and that the in-place update keeps the same `{N, total}` substitution.
- No strings were touched — the existing `itemRunner.progressTemplate`/`headingTemplate` already carry no time/duration token in EN/PL/RU, so NFR27 needs no cascade and the build stays byte-stable.

### Verification
- `node --test tests/scaffold/14-7-restrained-assessment-no-timer.test.mjs` → green (14 tests).
- Full scaffold suite (`tests/scaffold/**/*.test.mjs`) → 692 tests, 678 pass / 14 fail; the 14 fails are ALL the pre-existing 9-series human-gated guards (ICAR-CONFIRMATION.pdf / PL translator sign-off / CODEOWNERS @TBD / PL methodology reviewer fields) — zero new failures attributable to this story.
- `node tools/lint-cognitive-load-budget.mjs` → `css-components-lines` 2313/2600 (was 2281; +32 for the restrained-glass repoint on the matrix/option/prev surfaces + the `@supports` fallback block); `app-modules-bytes` 104198/110592 (unchanged — no JS touched).
- `make lint` → exits 0.
- `src/assessment/item-runner.js` is byte-identical (`git diff --stat` empty) — this is a restyle-only story; the renderer already emitted position-only progress and the frozen DOM contract.

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): every new story spec must carry this section. Apply: present on 14.7; the `make lint` carry-forward gate (`lint-spec-carry-forward`) depends on the case-sensitive `### Carry-forward lessons` heading with non-empty content.
- lesson-2026-06-03-002 (severity=high): back any "pre-existing red" claim with a baseline. Apply: the 14 node fails are the 9-series human-gated guards (ICAR PDF / outreach log / PL translator sign-off / CODEOWNERS @TBD / PL methodology reviewer fields) — they assert on real human deliverables this restyle story does not touch; the only Epic-14-attributable additions here are the item-runner.css glass repoint + `@supports` fallback, the base.css route-scoped suppression, the new guard, and the dormant Playwright leg.
- Restraint is a token step DOWN, never a geometry change (PR-23 / design §3.1). Apply: the assessment route reads quieter purely by consuming `--surface-glass` (muted) instead of `--surface-glass-strong`, plus the medium `--surface-glass-blur` semantic blur — no new layout, no decorative aurora behind the working area; the heavy intensity stays on landing/consent/result.
- AA contrast is the fill alpha, never the blur (Epic 13 invisible-redesign lesson). Apply: the muted glass keeps a ≥0.72-class fill and an `@supports not (backdrop-filter)` opaque fallback to `--surface-glass-strong`, so the working surfaces stay legible whether or not the browser composites the blur.
- Suppress decoration route-scoped + ADDITIVE; never touch the backdrop-color contract. Apply: `body[data-route="#/test"] { background-image: none; }` zeroes only the decorative gradient and leaves `background-color: var(--color-surface-base)` exactly as 14.2 set it, so the chrome-components computed-style spec stays green and body-text contrast is independent of the backdrop (SC 1.4.3).
- The no-timer guard must strip comments before forbidding "seconds" (false-positive trap). Apply: `item-runner.js` carries the legitimate Chrome dev-note "preloaded but not used within a few seconds"; the FORBIDDING regex scans comment-stripped source so only real time-pressure semantics fail, modeling 9e-1's duration-regex discipline.
- Epic-14 verification is RENDERED, deferred to 14.11 (structural source-text guards alone missed the Epic 13 invisible redesign). Apply: this story ships the node source-text + no-timer + restraint guard for `make test`; the rendered restraint/contrast comparison (assessment quieter than landing, light + dark) is the dormant Playwright leg whose baselines 14.11 commits on ubuntu-latest, never on the darwin authoring host.

## Dev Agent Record

### File List
- `src/css/components/item-runner.css` (restrained Aurora glass: repointed `.item-runner__image`, `.item-runner__option`, and `.item-runner__prev` from `--color-surface-elevated` to the MUTED `--surface-glass` fill + `backdrop-filter: blur(var(--surface-glass-blur))` + `--surface-glass-edge`; added an `@supports not (backdrop-filter)` opaque fallback to `--surface-glass-strong`; no decorative aurora, no `@keyframes`/`animation`; 14.6 option rendering + PR-2 layout untouched)
- `src/css/base.css` (additive route-scoped `body[data-route="#/test"] { background-image: none; }` — suppresses the decorative aurora on the assessment route toward a near-flat deep field; the `background-color: var(--color-surface-base)` contract is untouched; the global backdrop is undisturbed)
- `tests/scaffold/14-7-restrained-assessment-no-timer.test.mjs` (new — node guard: comment-stripped no-timer FORBIDDING regexes over item-runner.js + item-runner.css + the itemRunner strings EN/PL/RU; progress-position-only; muted `--surface-glass` + `--surface-glass-blur` semantic blur + `@supports` fallback; no-decorative-aurora; base.css route suppression + `--color-surface-base` untouched; frozen DOM contract + 14.6 option rendering + PR-2 sticky-nav/scroll/max-height + two-layer cleanliness)
- `tests/playwright/aurora-visual-regression.spec.mjs` (added a DORMANT Light + Dark restrained-assessment-route leg on `#/test`; the parent `visual-regression` job stays `if: false` until Story 14.11 — no pixel baselines committed here)
- `_bmad-output/implementation-artifacts/stories/14-7-restrained-aurora-assessment-route-and-no-timer-ui.md` (this spec)
