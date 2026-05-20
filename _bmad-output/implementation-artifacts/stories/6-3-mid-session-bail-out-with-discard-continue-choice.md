---
id: 6-3-mid-session-bail-out-with-discard-continue-choice
title: "Story 6.3: Mid-session bail-out with discard/continue choice"
status: ready-for-dev
---

# Story 6.3: Mid-session bail-out with discard/continue choice

## Story

As a **test-taker who realizes mid-session that this is not a good time**,
I want **a visible bail-out affordance that, when clicked, explains an incomplete test cannot produce a meaningful score and offers Continue / Discard (FR4 — no silent partial scoring)**,
So that **I can exit honestly (Mikhail journey's mid-session bail option) without producing a phantom score and without state lingering for future leakage**.

## Acceptance Criteria

1. **AC-1 (bail affordance — present on every item):** `item-runner.js` `buildMarkup()` renders a small `.item-runner__bail-affordance` button inside the item-runner section. It is visible on every item (1 through 16), positioned top-right of the item card (CSS-anchored; engineer chooses absolute-positioning vs grid-area; document in Self-Review). Its label comes from `strings.itemRunner.bailButton` (EN: "End the test early"). It carries `type="button"` so it cannot submit any enclosing form. Clicking it does NOT navigate or mutate `state.responses` — it opens the in-place explanation only.
2. **AC-2 (in-place explanation panel — DOM structure):** Clicking `.item-runner__bail-affordance` reveals a `.item-runner__bail-panel` region inside the item-runner (NOT a top-level modal — keeps the user oriented to the item they were on, per UX-DR3 restraint). The panel exists in DOM at render time with `hidden` attribute set (or `display: none`); the click handler removes the `hidden` attribute (or flips a `data-bail-state="open"` attribute on the section, engineer choice — document in Self-Review). The panel contains: (a) a paragraph with the explanation copy (EN: `strings.itemRunner.bailExplanation` — "An incomplete test cannot produce a meaningful score."); (b) two side-by-side buttons `.item-runner__bail-discard` (label: `strings.itemRunner.bailDiscardButton` — "Discard responses") and `.item-runner__bail-continue` (label: `strings.itemRunner.bailContinueButton` — "Continue"); (c) `role="region"` + `aria-labelledby` pointing to a hidden heading inside the panel. Focus moves to `.item-runner__bail-continue` when the panel opens (keyboard-first; UX-DR32 register). Pressing Escape while the panel is open dispatches the same handler as Continue (closes panel, returns focus to the bail affordance).
3. **AC-3 (Continue closes panel — state preserved):** Clicking `.item-runner__bail-continue` (or pressing Escape while panel open) closes the panel, returns focus to `.item-runner__bail-affordance`, and does NOT mutate `state.responses`, `state.currentItem`, `state.seed`, `state.startedAt`, or `state.locale`. A unit test under `tests/unit/item-runner-bail.test.mjs` simulates: click bail affordance → click Continue → asserts (a) panel is closed (`hidden` true or `data-bail-state="closed"`); (b) `state.getState()` is byte-equal to its pre-click snapshot via deep equality; (c) the next item radio change still records into `state.responses` correctly (no listener leak). **No reveal-stage event is dispatched** by Continue (FR4 implicit — Continue is silent re: result-scene events; assert via spy on `document.dispatchEvent` that no `iqme:reveal-stage` event fires during the open→Continue cycle).
4. **AC-4 (Discard resets state and navigates to landing — no localStorage write):** Clicking `.item-runner__bail-discard` calls `state.resetState()` then `routing.navigate("")` (landing route; same convention `consent.js` would use to go home — verify against `landing.js` + `routing.js` first). After the call: (a) `state.getState()` deep-equals the freshState seed (`currentItem: 0, responses: [], startedAt: 0, locale: "en", seed: "0".repeat(32)`); (b) `window.location.hash` is `"#/"` (landing); (c) the item-runner is unmounted (no listeners remain — assert via post-discard synthetic input event on a captured radio reference does not mutate state); (d) **no `localStorage.setItem` call fires during the entire bail-out cycle** — verified by a Playwright spec spying on `Storage.prototype.setItem` (FR4 + NFR9 — opt-in-only storage discipline). The `tools/lint-no-localStorage-without-consent.mjs` lint continues to pass (no new `localStorage.setItem` call introduced in this story).
5. **AC-5 (visibility on item-runner only — chrome surfaces unaffected):** The bail affordance is rendered ONLY by `item-runner.js` (not on landing, consent, or result scenes). Manual verification: after Discard the user is on landing → no bail button visible; after Continue from item 5 → the user returns to item 5 of the same session with all prior `responses` intact. A unit test asserts the bail affordance DOM element is present in item-runner render output and absent from landing render output.
6. **AC-6 (CSS — `item-runner.css` additions; restraint-first):** Add `.item-runner__bail-affordance`, `.item-runner__bail-panel`, `.item-runner__bail-discard`, `.item-runner__bail-continue`, `.item-runner__bail-explanation` rules to `src/css/components/item-runner.css` using semantic tokens only (no literal hex/px/font-family — Story 5.x token-freeze rules). The affordance sits at smaller font-size than option buttons (e.g. `--font-size-200` or `--font-size-300` — engineer chooses; document in Self-Review against the UX spec "not prominent enough to invite easy abandonment, prominent enough to find when needed" register). The panel uses `--color-surface-elevated` background with `--space-section-gap` vertical breathing room. Discard and Continue buttons sit at emotionally-equal visual weight (per UX-DR Step 5 invention #9 pattern from consent scene — twin-affordance principle applies). Re-run `node tools/lint-css-source-co-equal.mjs` to confirm no triplet-parity violation surfaces (the panel buttons are not score-panel triplet members).
7. **AC-7 (i18n string additions — EN only this epic):** Append to `src/content/i18n/en/strings.json` `itemRunner` block: `bailButton`, `bailExplanation`, `bailDiscardButton`, `bailContinueButton`, `bailPanelHeading`. Locale keys are NOT added to RU/PL JSON files in this story — Epic 7 owns translation parity. Update `src/assessment/routing.js` `NS.itemRunner` array to include the five new keys (per Story 6.2 precedent: keys not whitelisted in routing.js are filtered out by locale-loader and the template renders `undefined`). Run `node tools/lint-translation-parity.mjs`; if missing RU/PL keys fail, follow the existing Epic-7 deferral pattern (look at how Story 6.2 handled new EN-only `result.difficultySentenceTemplate` keys).
8. **AC-8 (Playwright assertion — full bail-out cycle):** New `tests/playwright/mid-session-bail-out.spec.mjs` drives the SPA from landing → consent → item-runner item 1 → respond → advance to item 5 → click bail affordance → assert panel visible + Continue focused → press Escape → assert panel closed + responses retained → click bail affordance again → click Discard → assert (a) URL hash is `#/` (landing); (b) item-runner DOM is gone; (c) `Storage.prototype.setItem` spy was never invoked during the cycle; (d) `window.__IQME_TEST__.getState()` (existing test-hook from Story 3.4 / 6.1) reports the fresh-state shape. EN-only at this epic (`test.skip` markers for RU/PL referencing Epic 7).
9. **AC-9 (unit tests — bail handler logic):** `tests/unit/item-runner-bail.test.mjs` covers (using the existing jsdom-stub pattern from `tests/unit/item-runner.test.mjs`): (a) bail affordance present in render output with `type="button"`; (b) clicking bail does NOT call `routing.navigate` (spy); (c) panel opens on bail click (`hidden` removed OR `data-bail-state="open"` set, whichever the impl chose); (d) focus moves to Continue button on open; (e) Escape key closes panel; (f) Continue closes panel + preserves state; (g) Discard calls `state.resetState` (spy) + `routing.navigate("")` (spy) in that order, with no `localStorage.setItem` calls in between; (h) post-unmount synthetic events on the bail buttons do not mutate state (listener cleanup).
10. **AC-10 (no contract regression):** `npm test` (`make test`) green; `make lint` green including `lint-no-localStorage-without-consent`, `lint-spec-carry-forward`, `lint-css-source-co-equal`, `lint-translation-parity`. Existing Story 6.1 AC-1..AC-8 invariants (reveal-stage dispatch, co-equal triplet) and Story 6.2 AC-1..AC-11 invariants (difficulty sentence) remain green. The full Playwright matrix (`tests/playwright/*.spec.mjs`) passes locally. `make build` byte-stable invariant (Story 4.2) preserved.
11. **AC-11 (integrity ratification — class-A guardrail):** Any class-A artefact touched during impl is re-recorded via `tds integrity record --as=<role> --files=<path> --story=6-3-... --reason=...` BEFORE state-commit, per [lesson-2026-05-19-001] and [lesson-2026-05-20-007]. Likely class-A surfaces in scope: `tests/playwright/mid-session-bail-out.spec.mjs` (NEW — class-A on first commit, registered by test-author phase); `tests/unit/item-runner-bail.test.mjs` (NEW — class-A on first commit). The existing `tests/unit/item-runner.test.mjs` should remain UNTOUCHED in this story (the bail tests live in a sibling file to avoid the lesson-2026-05-19-001 re-record path on a frozen Story-3.4 spec). **Verify class** by grepping `_bmad-output/_tds/state-manifest.yaml` after each new file is committed — do NOT skip this step.

## Tasks / Subtasks

- [ ] **Task 1: i18n string additions** (AC: #7)
  - [ ] Append `bailButton`, `bailExplanation`, `bailDiscardButton`, `bailContinueButton`, `bailPanelHeading` to `src/content/i18n/en/strings.json` `itemRunner` block. Suggested EN copy (engineer may tighten — keep ≤ 12 words per button label, ≤ 25 words for explanation; defer to UX register check during Self-Review against UX spec line 1080 + line 1242):
    - `bailButton`: `"End the test early"`
    - `bailPanelHeading`: `"End the test early?"` (hidden visually but exposed to AT via `aria-labelledby`)
    - `bailExplanation`: `"An incomplete test cannot produce a meaningful score."`
    - `bailDiscardButton`: `"Discard responses"`
    - `bailContinueButton`: `"Continue"`
  - [ ] DO NOT add RU/PL keys — Epic 7 owns those.
  - [ ] Update `src/assessment/routing.js` `NS.itemRunner` array — append the five new key names. Without this, locale-loader filters them out and rendered labels read `"undefined"` (matches Story 6.2's exact gotcha — see Dev Notes).
  - [ ] Run `node tools/lint-translation-parity.mjs` locally; follow the Epic-7 deferral pattern if RU/PL parity surfaces a fail.

- [ ] **Task 2: `item-runner.js` — render bail affordance + panel** (AC: #1, #2, #5)
  - [ ] In `buildMarkup()`: append a `.item-runner__bail-affordance` button to the `.item-runner` root markup. Place it OUTSIDE the `.item-runner__options` fieldset (so it isn't a form-associated input) but inside the section. Top-right positioning is CSS-only (Task 5) — keep the HTML order semantic (after `__nav`, or in a header position — engineer chooses).
  - [ ] In `buildMarkup()`: append a `.item-runner__bail-panel` region to the same root, initially `hidden` (or with `data-bail-state="closed"` on the section).
  - [ ] Mark the panel `role="region"` with `aria-labelledby="bail-panel-heading"`, containing a `<h2 id="bail-panel-heading" class="visually-hidden">{bailPanelHeading}</h2>`.
  - [ ] Include `.item-runner__bail-explanation` paragraph + the two side-by-side buttons.
  - [ ] Both buttons carry `type="button"`.
  - [ ] Verify no listener leak by re-using the existing `attachListeners` collection pattern (push every bail-related listener into the same array detached by `detach()`).

- [ ] **Task 3: `item-runner.js` — bail handlers** (AC: #2, #3, #4)
  - [ ] In `attachListeners()`, register listeners for the three bail buttons + Escape key.
  - [ ] **Bail affordance click:** remove `hidden` attribute / set `data-bail-state="open"` on the section; move focus to the Continue button via `el.focus()`. (Test-hook hint: jsdom's `el.focus()` is observable via `document.activeElement` in the unit test.)
  - [ ] **Continue click + Escape keydown:** restore `hidden` attribute / set `data-bail-state="closed"`; return focus to `.item-runner__bail-affordance`. Do NOT touch `state.*` mutators.
  - [ ] **Discard click:** call `state.resetState()` then `routing.navigate("")`. ORDER MATTERS — reset first so the post-navigation render of `landing.js` reads fresh state. The unit test in AC-9 (g) asserts the call order via spies.
  - [ ] **No `localStorage.setItem` calls** in any new handler (lint-no-localStorage-without-consent will enforce this).
  - [ ] After `routing.navigate("")`, the routing module's `renderRoute()` will call `itemRunner.unmount()` automatically (per routing.js scene-switch protocol) — verify by reading [src/assessment/routing.js:57-69](src/assessment/routing.js#L57-L69) before assuming. If `unmount` doesn't fire, call it explicitly before `routing.navigate`.

- [ ] **Task 4: Author unit test** (AC: #9, #11)
  - [ ] Create `tests/unit/item-runner-bail.test.mjs` using the jsdom-stub pattern from `tests/unit/item-runner.test.mjs` (stub `window`, `document`, `crypto.getRandomValues`, `fetch`, etc.).
  - [ ] Cover all eight sub-cases AC-9.a through AC-9.h.
  - [ ] Use Node 22 native `node:test` + `node:assert/strict`; no third-party deps.
  - [ ] **Class-A integrity:** the file is class-A on first commit (test-author phase handles this); if engineer later edits during impl, `tds integrity record --as=<role>` BEFORE state-commit.

- [ ] **Task 5: `item-runner.css` — visual treatment** (AC: #6)
  - [ ] Add `.item-runner__bail-affordance { font-size: var(--font-size-200); color: var(--color-text-muted); background: transparent; border: none; padding-block: var(--space-2); padding-inline: var(--space-3); cursor: pointer; ... }` — restraint-first. Position top-right of the card (engineer chooses absolute vs grid-area; document in Self-Review with UX register justification).
  - [ ] Add `.item-runner__bail-panel { display: none; padding: var(--space-section-gap); background: var(--color-surface-elevated); border: var(--space-1) solid var(--color-rule-divider); margin-block-start: var(--space-4); }` and a `[data-bail-state="open"] .item-runner__bail-panel { display: block; }` rule (or use `hidden` attribute + CSS reset — engineer choice; document in Self-Review).
  - [ ] `.item-runner__bail-discard` + `.item-runner__bail-continue`: same dimensions, neutral border, same font-size — emotionally-equal weight (per UX-DR Step 5 invention #9 / twin-affordance principle established in consent scene). NO accent color on either — both are neutral chrome.
  - [ ] Re-run `node tools/lint-css-source-co-equal.mjs` to confirm no triplet violation.

- [ ] **Task 6: Playwright assertion** (AC: #8, #11)
  - [ ] Create `tests/playwright/mid-session-bail-out.spec.mjs` mirroring the existing seeded-session driving pattern from `tests/playwright/difficulty-sentence.spec.mjs` / `co-equal-triplet-computed-style.spec.mjs`.
  - [ ] Spy on `Storage.prototype.setItem` before navigating to landing: `await page.addInitScript(() => { window.__setItemCalls = []; const orig = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { window.__setItemCalls.push([k, v]); return orig.call(this, k, v); }; });`
  - [ ] Drive: landing → "Start the test" → consent Continue → item-runner item 1 → click first radio → click Next (advance to item 5 by repeating).
  - [ ] Click `.item-runner__bail-affordance` → assert `.item-runner__bail-panel` is visible (`expect(page.locator('.item-runner__bail-panel')).toBeVisible()`); assert focus is on `.item-runner__bail-continue` via `document.activeElement`.
  - [ ] Press Escape → assert panel hidden again, focus back on bail affordance.
  - [ ] Click bail affordance again → click `.item-runner__bail-discard` → assert (a) `expect(page).toHaveURL(/#\/$/)`; (b) `.item-runner` not in DOM; (c) `expect(await page.evaluate(() => window.__setItemCalls.length)).toBe(0)`; (d) `expect(await page.evaluate(() => window.__IQME_TEST__.getState())).toEqual({ currentItem: 0, responses: [], startedAt: 0, locale: "en", seed: "0".repeat(32) })` (use existing test-hook from Story 6.1).
  - [ ] EN-only; `test.skip` markers for RU/PL referencing Epic 7.
  - [ ] **Class-A on first commit** — test-author phase registers integrity.

- [ ] **Task 7: CI matrix wiring** (AC: #10)
  - [ ] Add `tests/playwright/mid-session-bail-out.spec.mjs` to `.github/workflows/pr-checks.yml` Playwright job spec matrix (or the matrix manifest from Story 1.6 / 6.1 / 6.2) — confirm the slot fires the real spec, no `condition: false` leftovers.

- [ ] **Task 8: Full-suite green** (AC: #10)
  - [ ] `make test` (node --test for scaffold + contract + unit + exit-criteria) passes.
  - [ ] `make lint` passes (cognitive-load-budget, claims-manifest strict, reading-level, glossary, css-source-co-equal, translation-parity, no-localStorage-without-consent, spec-carry-forward).
  - [ ] `npx --yes playwright test tests/playwright/mid-session-bail-out.spec.mjs` passes locally (4+ assertions green, RU/PL skips clean).
  - [ ] `npx --yes playwright test tests/playwright/` full matrix green (no regressions in 6.1 / 6.2 specs).
  - [ ] `make build` byte-stable invariant (Story 4.2) preserved.

- [ ] **Task 9: Specialist Self-Review + Completion Notes**
  - [ ] Document decisions: (a) `hidden` attribute vs `data-bail-state` — chosen approach + rationale; (b) absolute vs grid-area positioning for bail affordance; (c) font-size choice (`--font-size-200` vs `--font-size-300`); (d) HTML order of bail elements within `.item-runner` markup; (e) whether `routing.navigate("")` auto-fires `unmount` or explicit unmount was needed.
  - [ ] Capture telemetry tail (per [lesson-2026-05-20-011]) — 2-3 lines summarising `make test` pass-count + `make lint` exit + Playwright pass-count.

## Dev Notes

- **Reset-then-navigate ordering matters.** `state.resetState()` MUST run before `routing.navigate("")` because [src/assessment/routing.js:57-69](src/assessment/routing.js#L57-L69) calls `landing.render()` synchronously (mutates DOM + reads strings, but does not read state directly). If a future landing render reads `state.startedAt` (e.g. for an "interrupted-session" hatnote), the order matters. Bake this in even if landing currently doesn't read state — cheap insurance.
- **The bail panel is NOT a modal.** Per UX-DR3 restraint posture and the UX spec mermaid flow (line 1080: `bailDecide -->|Continue| item`), the panel sits INSIDE the item-runner section. The user remains oriented to the item they were on; Continue closes the panel and re-engages with the item, not a modal-overlay return. **No `<dialog>` element, no backdrop, no inert background** — keeps the DOM simple and the keyboard interaction tractable. (If a future UX iteration calls for modal semantics, that's a new story; do not pre-implement.)
- **Twin-affordance principle (UX-DR Step 5 invention #9):** Discard and Continue render at EMOTIONALLY-EQUAL visual weight — same font-size, same neutral border, same dimensions. This is the same pattern consent-scene uses for "Continue / Not today" (UX spec line 382 + 1689) and that the score-panel pre-reveal uses for "Show me / Not yet". DO NOT give Discard an accent color or Continue a "destructive" red — both options are honest, neither is the "wrong" answer.
- **`routing.navigate("")` is the canonical "go to landing" pattern.** Verify by reading [src/assessment/routing.js:13-19](src/assessment/routing.js#L13-L19) — `""` and `"#/"` both map to landing. After `state.resetState()` + `routing.navigate("")`, the routing module's scene-switch protocol unmounts the prior scene (item-runner) by calling `itemRunner.unmount()` at [src/assessment/routing.js:60-62](src/assessment/routing.js#L60-L62). Verify this fires correctly under the bail flow — if `activeScene` is already `itemRunner` and the new scene is `landing`, the unmount call dispatches. If it doesn't (e.g. `activeScene === scene` short-circuits), call `itemRunner.unmount()` explicitly BEFORE `routing.navigate`.
- **i18n key whitelist in routing.js — the Story 6.2 gotcha.** [src/assessment/routing.js:26-31](src/assessment/routing.js#L26-L31) defines `NS.itemRunner` (currently 6 keys). The five new keys MUST be appended; without this, `locale-loader.get()` returns `undefined` for the missing keys and rendered labels read `"undefined"` (verbatim string). This caught Story 6.2 on first Playwright run — see [_bmad-output/implementation-artifacts/stories/6-2-per-item-difficulty-breakdown-easy-medium-hard-tercile.md#L194](_bmad-output/implementation-artifacts/stories/6-2-per-item-difficulty-breakdown-easy-medium-hard-tercile.md#L194).
- **`state.resetState()` is already exported.** [src/assessment/state.js:55-57](src/assessment/state.js#L55-L57) — single statement `state = freshState()`. No new state API surface needed.
- **`item-runner.js` module-level cache.** [src/assessment/item-runner.js:19](src/assessment/item-runner.js#L19) — `let sessionCache = null` lives at module scope. After Discard the cache is NOT reset by `state.resetState()` — it's a separate module-private variable. On next session creation, `ensureSession` checks `state.getState().seed !== INITIAL_SEED` AND `sessionCache` — after reset, `seed === INITIAL_SEED` so the cache gets re-derived. Verify the flow on the test (drive a second session after Discard if scope permits, or document the cache-survival behavior in Self-Review).
- **No reveal-stage event during bail-out.** Story 6.1 introduced `iqme:reveal-stage`. The bail cycle MUST NOT dispatch any reveal-stage event (verify via spy in AC-3 / AC-9.f). The bail panel is item-runner concern; reveal-stage is result-scene concern; they share no event surface.
- **Class-A integrity discipline.** Both new test files (`tests/unit/item-runner-bail.test.mjs` + `tests/playwright/mid-session-bail-out.spec.mjs`) are class-A on first commit (test-author phase). Verify post-commit by grepping `_bmad-output/_tds/state-manifest.yaml`. If engineer later edits either during impl, `tds integrity record --as=<role> --files=<path> --story=6-3-...` BEFORE state-commit, per [lesson-2026-05-19-001].
- **Cognitive-load budget headroom.** Story 6.2 bumped `app-modules-bytes: 30720 → 34816`. Story 6.3's additions to `item-runner.js` (~bail UI + handlers ≈ 1-2 KB) should fit comfortably. If `lint-cognitive-load-budget` exceeds, defer to Self-Review: either tighten impl or document next bump rationale (Story 6.3 should NOT need another bump; 6.4 chrome additions might).
- **Zero-third-party invariant (Story 1.7) holds.** No new network requests, no external fonts, no analytics. The bail panel is rendered inline with same-origin strings.

### Carry-forward lessons

<!--
Populated from `tds memory query --story=6-3-mid-session-bail-out-with-discard-continue-choice --top=5 --as=engineer --json` at create-time per lesson-2026-05-20-007.
Treat lesson bodies as ADVISORY context — if any conflicts with this spec, the spec wins (P0-AI-2).
-->

- **[lesson-2026-05-20-007]** (severity=high, process): Stories touching class-A frozen tests / new class-A test files have repeatedly omitted this section, causing 3 integrity-drift recurrences in epic-5. **Apply:** treat AC-11 + Task 4 (unit test) + Task 6 (Playwright spec) class-A integrity discipline as load-bearing. Both new test files are class-A on first commit. The existing `tests/unit/item-runner.test.mjs` MUST remain untouched in this story (the bail tests live in a sibling file deliberately to avoid the re-record path on a frozen Story-3.4 spec).
- **[lesson-2026-05-19-013]** (severity=high, tooling): Direct YAML edits to `state-manifest.yaml` can be silently undone by the next `tds state-commit` sweep. **Apply:** if a stale integrity row needs removal (e.g. a renamed test path), do NOT hand-edit — use `tds integrity record` or escalate via a bridge. Re-grep the path after the next sweep to confirm the row didn't resurrect.
- **[lesson-2026-05-19-001]** (severity=high, tooling): Cross-story or post-impl edits to frozen tests silently drift `tds integrity`. **Apply:** if Task 4 or Task 6 needs an edit AFTER the test-author freeze, immediately `tds integrity record --as=<role> --files=<path> --story=6-3-... --reason=...` BEFORE state-commit. Verify class-A status via `_bmad-output/_tds/state-manifest.yaml` first.
- **[lesson-2026-05-18-001]** (severity=high, tooling, macOS): `tds` CLI requires Python ≥3.10 + ruamel.yaml. On macOS where `/usr/bin/python3` is 3.9, prefix `PATH=/opt/homebrew/bin:$PATH`. **Apply:** if any `tds <subcommand>` throws `ModuleNotFoundError: ruamel`, prepend the PATH override and retry. (The shell-snapshot PATH likely covers this, but documented for posterity.)
- **[lesson-2026-05-20-011]** (severity=medium, process): Capture telemetry tail as live AC evidence in Completion Notes — not just synthetic test fixtures. **Apply:** after running `make test` + `make lint` + Playwright for Task 8, paste a 2-3 line summary of the green-run output (test names + pass counts + exit codes) into `## Completion Notes List` as live evidence for AC-10. Same pattern Story 6.1 + 6.2 used.

### Project Structure Notes

- Touched files (per architecture.md §file-tree + existing layout):
  - **UPDATE:** `src/assessment/item-runner.js` (class-B impl; adds bail affordance + panel rendering, three new listeners, Escape keydown handler).
  - **UPDATE:** `src/assessment/routing.js` (class-B; appends 5 keys to `NS.itemRunner` whitelist — Story 6.2 precedent gotcha).
  - **UPDATE:** `src/css/components/item-runner.css` (class-B; adds `.item-runner__bail-*` rules + visibility gate).
  - **UPDATE:** `src/content/i18n/en/strings.json` (class-B; adds 5 keys to `itemRunner` block).
  - **NEW:** `tests/unit/item-runner-bail.test.mjs` (class-A on first commit — test-author phase).
  - **NEW:** `tests/playwright/mid-session-bail-out.spec.mjs` (class-A on first commit — test-author phase).
  - **UPDATE (probable):** `.github/workflows/pr-checks.yml` (Task 7 — wire new Playwright spec into matrix).
  - **NO CHANGE:** `tests/unit/item-runner.test.mjs` (Story 3.4 spec, class-A frozen — bail tests live in sibling file deliberately, per Carry-forward lessons rationale).
  - **NO CHANGE:** `src/assessment/state.js` (`resetState` already exported from Story 3.2; no API surface change).
  - **NO CHANGE:** `src/assessment/landing.js`, `consent.js`, `result.js` (bail affordance is item-runner-only per AC-5).
- **Naming conventions** per architecture.md §608: kebab-case for CSS classes (`item-runner__bail-affordance` — BEM); camelCase inside JSON payloads (`bailButton`, `bailExplanation` etc.); no new DOM events (no `iqme:bail` event — handlers operate via direct callbacks).
- **State-via-`data-*`-attributes** (architecture.md §609): if the impl uses `data-bail-state="open|closed"` on the `.item-runner` section (engineer choice vs `hidden` attribute), it conforms to the existing pattern. CSS gate selector is `.item-runner[data-bail-state="open"] .item-runner__bail-panel { display: block; }`.
- **No sessionStorage write in this story.** UX spec line 1242-1246 describes a "Mid-Session Loss / Error Flow" that writes `sessionStorage interrupted-session=true` on Discard (and on reload / close-tab / locale-switch). The interrupted-session named-loss landing IS a load-bearing UX behavior — but the epic-6 AC text for Story 6.3 (epics.md line 1572-1587) is explicit only on `localStorage` + state-reset + landing navigation. The interrupted-session sessionStorage flag is treated as **out-of-scope for this story** and deferred to a future story (likely Epic 6.4 chrome or a dedicated interrupted-session story; if neither materialises by epic-6 close, flag in retro for bridge consideration). If the engineer feels strongly that Discard should set the sessionStorage flag inline, document the alternative in Self-Review and consider `--task-defer` per the orchestrator's open-tasks gate.
- **Auditor focus areas to flag in Self-Review:** (a) the `hidden`-attribute vs `data-bail-state` choice — which one was made and why; (b) bail affordance positioning (CSS absolute vs grid vs static), with UX-register justification; (c) sessionStorage interrupted-session flag — was it deferred and how was the boundary drawn; (d) whether routing.navigate("") auto-unmount works correctly or needed explicit `itemRunner.unmount()` before; (e) i18n key whitelist update verified end-to-end (no `"undefined"` in rendered DOM at any beat).

### References

- [Source: _bmad-output/planning-artifacts/epics.md:1566-1587](_bmad-output/planning-artifacts/epics.md#L1566-L1587) — primary spec (Story 6.3 AC + scope)
- [Source: _bmad-output/planning-artifacts/prd.md:788](_bmad-output/planning-artifacts/prd.md#L788) — FR4 (mid-session bail with discard-or-continue, no silent partial scoring)
- [Source: _bmad-output/planning-artifacts/prd.md:265](_bmad-output/planning-artifacts/prd.md#L265) — Mikhail journey narrative (the bail-out path he hesitates at and continues past)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:1080](_bmad-output/planning-artifacts/ux-design-specification.md#L1080) — primary flow mermaid: `Bail out → Discard or continue`
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:1242-1246](_bmad-output/planning-artifacts/ux-design-specification.md#L1242-L1246) — Mid-Session Loss / Error Flow: bail-out confirmation as a Loss-Flow event sibling
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:382](_bmad-output/planning-artifacts/ux-design-specification.md#L382) — UX-DR Step 5 invention #9 (twin-affordance pattern — Continue/Not today equal-weight; applied here to Continue/Discard)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:1689-1690](_bmad-output/planning-artifacts/ux-design-specification.md#L1689-L1690) — Affordance taxonomy: Continue + Not today (twin-affordance precedent)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:1706](_bmad-output/planning-artifacts/ux-design-specification.md#L1706) — Twin-affordance principle ("No more than ONE primary action visible at a time EXCEPT the explicit twin-affordance pattern")
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:1753](_bmad-output/planning-artifacts/ux-design-specification.md#L1753) — Affordance taxonomy: "Bail out confirmation | Native `<button>` × 2 (Continue / Discard) | None"
- [Source: _bmad-output/planning-artifacts/architecture.md:41](_bmad-output/planning-artifacts/architecture.md#L41) — Test Session FR1-FR8 summary (mid-session bail with explicit discard-vs-continue)
- [Source: _bmad-output/planning-artifacts/architecture.md:276](_bmad-output/planning-artifacts/architecture.md#L276) — Data persistence rules (none at runtime; opt-in localStorage; sessionStorage interrupted-session flag — deferred per Project Structure Notes above)
- [Source: src/assessment/item-runner.js](src/assessment/item-runner.js) — current item-runner render + listeners (insertion point for bail affordance)
- [Source: src/assessment/state.js:55-57](src/assessment/state.js#L55-L57) — `resetState()` already exported (no API surface change)
- [Source: src/assessment/routing.js:13-19](src/assessment/routing.js#L13-L19) — ROUTES table (`""` and `"#/"` map to landing)
- [Source: src/assessment/routing.js:26-31](src/assessment/routing.js#L26-L31) — `NS.itemRunner` whitelist (must be extended — Story 6.2 gotcha)
- [Source: src/assessment/routing.js:57-69](src/assessment/routing.js#L57-L69) — `renderRoute()` scene-switch protocol (auto-unmount on scene change)
- [Source: tests/unit/item-runner.test.mjs](tests/unit/item-runner.test.mjs) — jsdom-stub pattern + test-hook conventions (do NOT edit; sibling file pattern instead)
- [Source: tests/playwright/difficulty-sentence.spec.mjs](tests/playwright/difficulty-sentence.spec.mjs) — Story 6.2 Playwright spec (driving + test-hook + `window.__IQME_TEST__.getState()` precedent)
- [Source: _bmad-output/_tds/memory/lessons.yaml](_bmad-output/_tds/memory/lessons.yaml) — carry-forward lesson catalog
- [Source: _bmad-output/implementation-artifacts/stories/6-2-per-item-difficulty-breakdown-easy-medium-hard-tercile.md](_bmad-output/implementation-artifacts/stories/6-2-per-item-difficulty-breakdown-easy-medium-hard-tercile.md) — sibling story precedent (routing.js NS whitelist gotcha, twin-affordance reference, Playwright + test-hook patterns)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review

**Decisions made:**

(to be filled by engineer)

**Alternatives considered:**

(to be filled by engineer)

**Framework gotchas avoided:**

(to be filled by engineer)

**Areas of uncertainty (auditor focus):**

(to be filled by engineer)

**Tested edge cases:**

(to be filled by engineer)

**Telemetry tail (AC-10 live evidence per [lesson-2026-05-20-011]):**

(to be filled by engineer)

**Carry-forward lesson application:**

(to be filled by engineer)
