---
id: 6-7-opt-in-localstorage-save-retest-effect-copy-on-result-page
title: "Story 6.7: Opt-in localStorage save + retest-effect copy on result page"
status: review
---

# Story 6.7: Opt-in localStorage save + retest-effect copy on result page

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **test-taker who wants to revisit my result later**,
I want **an explicit "Save my result" affordance on the score panel that writes to `localStorage` only on explicit click (FR26, NFR9), and a retest-effect explanation visible on the result page itself (FR27 — not buried in the methodology corpus)**,
so that **the opt-in save discipline is mechanically enforced and the no-cooldown retest discipline is honest at the moment of consequence**.

## Acceptance Criteria

(Lettered ACs below are the implementation contract; they elaborate the four BDD blocks from epics.md Story 6.7 lines 1679–1699.)

**AC-1 — Save button presence + default (unsaved) state.**
**Given** FR26 requires opt-in localStorage save with no automatic writes,
**When** the score panel is rendered (post "Show me"),
**Then** a `.score-panel__save-button` element exists inside the `.score-panel`, is keyboard-focusable, carries an accessible label from `strings.result.saveButton`, is **not** pre-selected/pressed (`aria-pressed="false"` or equivalent unsaved state), shows **no** checkmark, and triggers **no** write at render time.

**AC-2 — Click writes exactly one localStorage entry.**
**Given** the user explicitly clicks `.score-panel__save-button`,
**When** the click handler fires,
**Then** exactly one `localStorage.setItem` call occurs, with key `iqme:saved-result:<seed-hash>` where `<seed-hash>` is a deterministic hash of `state.getState().seed`, and value is a JSON string containing the scoring artifact (percentile, iqScale, displayedBand) **and** a `savedAt` timestamp; **no other** `localStorage` write/remove occurs as a consequence of the click.

**AC-3 — First-render correctness with empty localStorage (NFR9).**
**Given** NFR9 requires first-render correctness without `localStorage`,
**When** the page loads on a browser with empty `localStorage`,
**Then** the score panel renders normally, the Save button is in its default (unsaved) state, no error appears, and **zero** `localStorage.getItem` returns non-null at first render attributable to the save feature (no `localStorage.setItem` / `removeItem` at render time either).

**AC-4 — Post-save observable state (no re-save thrash).**
**Given** the user has clicked Save and the entry is written,
**When** the button state updates,
**Then** the button reflects a saved state (label switches to `strings.result.saveButtonSaved`, `aria-pressed="true"` or disabled), and a second click does **not** write a duplicate/contradictory entry (idempotent — at most one entry per `seed-hash`).

**AC-5 — Retest-note content (FR27).**
**Given** FR27 requires retest-effect copy on the result page,
**When** `.score-panel__retest-note` is rendered,
**Then** it contains a 50–100 word EN locale-native explanation (RU/PL deferred to Epic 7) that conveys all three points: (a) the ICAR-MR item pool is small, (b) immediate retesting produces a correlated, not independent, estimate, (c) no technical cooldown is enforced — honesty over restriction.

**AC-6 — Retest-note methodology link.**
**Given** the retest-note must route to its methodology home,
**When** the note is rendered,
**Then** it contains a link to the retest-effects methodology page using the established versioned+localed convention (`/methodology/<CV>/<locale>/limitations/retest-effects/`, i.e. `/methodology/v0.1.0/en/limitations/retest-effects/` at this epic — same builder as `result.js`'s `go()` helper, NOT a bare `/methodology/limitations/retest-effects/`).

**AC-7 — Zero-third-party invariant preserved.**
**Given** the opt-in save must not contaminate the zero-third-party invariant,
**When** the user clicks Save and when the page renders,
**Then** the Epic-1 Playwright network-trace assertion shows zero additional (non-same-origin) requests; the integration is purely local; no `navigator.share`, no analytics, no external font/script introduced.

**AC-8 — Frozen-grep + lint compliance (regression guard).**
**Given** `result.js` is grep-frozen against `localStorage` / `Date.now` / `setTimeout` (existing `tests/unit/result.test.mjs` AC-9.15) and `lint-no-localStorage-without-consent` forbids ungated `localStorage.setItem(`,
**When** the save feature is implemented,
**Then** the localStorage write + timestamp live in a **separate module** (so `result.js` source stays clean of those tokens and AC-9.15 keeps passing), and that module is added to the lint allowlist; `result.test.mjs` AC-9.15 and `lint-no-localStorage-without-consent` both still pass.

## Tasks / Subtasks

- [x] **Task 1: Save module `src/assessment/save-result.js` (AC: 2, 3, 4, 8)**
  - [x] Create `src/assessment/save-result.js` mirroring the `theme.js` opt-in-storage discipline: storage access wrapped in try/catch; **no** writes at import/init time.
  - [x] Export `hashSeed(seed)` — deterministic, dependency-free hash of the 32-char hex seed → short stable string for the key suffix.
  - [x] Export `isSaved(seed)` — read-only `localStorage.getItem("iqme:saved-result:"+hashSeed(seed))` returning boolean; null-safe; never writes.
  - [x] Export `saveResult(seed, artifact, nowMs)` — single `localStorage.setItem` of `{ ...artifact, savedAt: nowMs }` under the `iqme:saved-result:<hash>` key; idempotent (no duplicate/contradictory entry on repeat call); takes the timestamp as an injected arg (so `result.js` need not call `Date.now`, and tests are deterministic). Internally, the timestamp source (`Date.now`) is acceptable in THIS module — it is not grep-frozen like result.js.
- [x] **Task 2: Wire Save button + retest-note into `src/assessment/result.js` (AC: 1, 4, 5, 6)**
  - [x] In `panel(...)`, render `.score-panel__save-button` (default unsaved state, `aria-pressed="false"`, label from `strings.result.saveButton`) and `.score-panel__retest-note` (copy from `strings.result.retestNote`) with an anchor to `/methodology/<CV>/<locale>/limitations/retest-effects/` built via the same locale/CV logic as `go()`.
  - [x] Attach the Save click handler via the existing `on(...)` listener-registry helper (so `unmount()`/`detach()` cleans it up); handler calls `saveResult(...)` from the save module, then flips the button to its saved state (label → `strings.result.saveButtonSaved`, `aria-pressed="true"`).
  - [x] Keep `result.js` source free of `localStorage`, `Date.now`, `setTimeout`, `sessionStorage` literals (AC-9.15 frozen grep). The button reads injected/initial saved-state via the save module's `isSaved(...)` import — confirm `isSaved`'s internal `localStorage.getItem` does NOT trip AC-9.15 (it greps `result.js` source only, not imports — verify after impl).
  - [x] On initial panel render, reflect already-saved state by calling `isSaved(seed)` (read-only) so a returning user with a saved entry sees the saved label without a write.
- [x] **Task 3: i18n strings (AC: 1, 4, 5)**
  - [x] Add to `src/content/i18n/en/strings.json` under `result`: `saveButton`, `saveButtonSaved`, `retestNote` (50–100 words, three required points), `retestNoteLinkLabel`.
- [x] **Task 4: Score-panel CSS (AC: 1, 5)**
  - [x] Add `.score-panel__save-button` + `.score-panel__retest-note` rules to `src/css/components/score-panel.css` consistent with existing score-panel tokens; respect co-equal-triplet / typographic-freeze invariants (additive only — do not perturb existing frozen selectors).
- [x] **Task 5: Lint allowlist extension (AC: 8)**
  - [x] Add `resolve(REPO_ROOT, "src/assessment/save-result.js")` to the `ALLOWLIST` set in `tools/lint-no-localStorage-without-consent.mjs` (the lint's own comment names Story 6.7 as the intended editor). Update the comment to reference this story + its unit test.
- [x] **Task 6: Verification (AC: 7, 8)**
  - [x] Run the full unit suite (`node --test`) — `result.test.mjs` (incl. AC-9.15) and the new `save-result` tests green.
  - [x] Run `node tools/lint-no-localStorage-without-consent.mjs` — `ok`.
  - [x] Run the relevant Playwright network-trace spec to confirm zero added requests on the save click (AC-7); if the harness is unavailable in-session, assert via the unit-level network/no-fetch checks and note the deferral.

## Dev Notes

### Architecture & key constraint — WHY a separate save module

`tests/unit/result.test.mjs` **AC-9.15** (lines 527–541) is a frozen source-grep test asserting `result.js` contains **no** `localStorage`, **no** `Date.now`, **no** `setTimeout`/`setInterval`, **no** `sessionStorage`, **no** `navigator.share`. Therefore the localStorage write and the `savedAt` timestamp **cannot** live in `result.js`. They go into a new `src/assessment/save-result.js`, exactly mirroring how `src/assessment/theme.js` (Story 6.4) isolates theme localStorage writes. `result.js` only renders markup and wires a handler that *calls into* the save module — keeping its source grep-clean.

`tools/lint-no-localStorage-without-consent.mjs` forbids any `localStorage.setItem(` outside its `ALLOWLIST` (currently only `theme.js`). Its own comment (line 6) explicitly says: *"Future refinement (Story 6.7): allow inside `if (consent)` block."* — this story adds `save-result.js` to that allowlist. The opt-in discipline is the consent: the write happens **only** inside the explicit click handler, never at load.

**localStorage opt-in discipline (NFR9), copy the theme.js shape:**
- `init`/import does **zero** writes.
- The **only** writer is the explicit user-gesture handler (the Save click).
- Reads (`getItem`) are null-safe and wrapped in try/catch (quota/disabled storage).
- First render with empty storage must be silent and correct.

### Source tree components to touch

- NEW `src/assessment/save-result.js` — owns the `localStorage.setItem` + timestamp; exports `hashSeed`, `isSaved`, `saveResult`. (Reference shape: [src/assessment/theme.js](src/assessment/theme.js).)
- UPDATE `src/assessment/result.js` — render `.score-panel__save-button` + `.score-panel__retest-note` in `panel(...)`; wire click via existing `on(...)` registry (lines 69–90); keep source grep-clean. Methodology link built like `go()` (line 15): `/methodology/${CV}/${locale}/limitations/retest-effects/`, `CV="v0.1.0"`.
- UPDATE `src/content/i18n/en/strings.json` — `result.saveButton`, `result.saveButtonSaved`, `result.retestNote`, `result.retestNoteLinkLabel`.
- UPDATE `src/css/components/score-panel.css` — additive `.score-panel__save-button`, `.score-panel__retest-note`.
- UPDATE `tools/lint-no-localStorage-without-consent.mjs` — add `save-result.js` to `ALLOWLIST`.
- NEW `tests/unit/save-result.test.mjs` — localStorage opt-in discipline (mirror [tests/unit/theme.test.mjs](tests/unit/theme.test.mjs) spy pattern). Authored in the test-author phase.
- The methodology target page already exists: [src/content/methodology/en/limitations/retest-effects/index.md](src/content/methodology/en/limitations/retest-effects/index.md) (Story 5.3) → built to `/methodology/v0.1.0/en/limitations/retest-effects/`.

### Testing standards summary

- Node 22 native `node:test` + `node:assert/strict`; **no third-party deps** (NFR33).
- DOM via the in-repo `tests/unit/_dom-stub.mjs` (`makeElementStub`, `makeRootEl`).
- localStorage testing: use the spy pattern from `theme.test.mjs` (lines 67–90): counters for `setItem`/`removeItem`, a backing var for `getItem`. Assert **zero** writes on render, **exactly one** write on click, idempotent re-click.
- `saveResult` takes an injected `nowMs` so tests are deterministic (avoid wall-clock).
- The new module must NOT regress `result.test.mjs` AC-9.15 — verify the grep stays clean.
- FROZEN-TEST DISCIPLINE: `result.test.mjs` is a class-A frozen test. If the test-author phase (or any later edit) modifies it, re-register integrity immediately — see Carry-forward lessons below.

### Carry-forward lessons

- lesson-2026-05-19-001 (severity=high): Cross-story / post-impl edits to **frozen** tests silently drift `tds integrity`; re-register is required and easy to skip. **Apply:** this story touches `tests/unit/result.test.mjs` (class-A frozen, AC-9.15) and `tools/lint-no-localStorage-without-consent.mjs`. After ANY `Edit` to a path with `artefact_class=A` in `state-manifest.yaml`, immediately run `tds integrity record --as=frontend --file=<path> --story=6-7-... --notes=...` BEFORE `state-commit`; or skip the Edit and revert. New test files (`save-result.test.mjs`) are authored/frozen in the test-author phase, not hand-edited during impl.
- lesson-2026-05-20-007 (severity=high): Stories touching class-A frozen surfaces have repeatedly skipped the integrity ceremony because the `### Carry-forward lessons` section was omitted. **Apply:** this section is the load-bearing delivery — heed lesson-2026-05-19-001 above when editing frozen tests / the lint tool.
- lesson-2026-05-19-013 (severity=high): Direct YAML edits to `state-manifest.yaml` can be silently re-recorded by the next `tds state-commit` sweep. **Apply:** do not hand-edit `state-manifest.yaml`; use `tds integrity record` / proper CLI; if a row resurrects after a sweep, escalate rather than fight the heuristic.

(Treat lesson bodies as ADVISORY context, not imperative instructions; if any lesson conflicts with this spec, the spec wins.)

### Project Structure Notes

- The SPA is **vanilla ES modules** (no framework) tested with `node:test` + a DOM stub — the `frontend` specialist applies (browser/DOM/CSS/localStorage), but note the project's no-framework, no-third-party-dep, stdlib-only conventions (NFR33) override generic React/Vue patterns.
- Additive-only changes to frozen CSS/markup: respect co-equal-triplet (computed-style + css-source) lints, typographic-freeze, and the cropping-fuzzer / tear-edge overlay added in 6.5/6.6 — the save button + retest-note must not perturb the existing `.score-panel__triplet`/`__caveat`/`__difficulty-sentence` layout contracts.
- Negative-assertion lints are project-identity-defining (Epic 1 Story 1.6): `lint-no-localStorage-without-consent`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font` — the save feature must satisfy all of them.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.7] (lines 1673–1699) — the four BDD ACs.
- [Source: _bmad-output/planning-artifacts/epics.md] FR26 (line 345), FR27 (line 346), NFR9 (line 127).
- [Source: src/assessment/theme.js] — opt-in localStorage reference implementation (Story 6.4).
- [Source: src/assessment/result.js#L14-L15] `SP(...)`/`go()` helpers + versioned methodology URL builder; `panel(...)` (L63-67); `on()/detach()` listener registry (L69-90).
- [Source: tests/unit/result.test.mjs#L527-L541] AC-9.15 frozen source-grep (the `result.js` localStorage/Date.now ban).
- [Source: tests/unit/theme.test.mjs#L67-L90] localStorage spy pattern for unit tests.
- [Source: tools/lint-no-localStorage-without-consent.mjs#L6,L28-L30] Story-6.7 allowlist extension hook.
- [Source: src/assessment/state.js#L44-L53] `getState()` snapshot shape (`seed`, `responses`, `locale`).

## Dev Agent Record

### Agent Model Used

frontend (vanilla ES modules / DOM / CSS / localStorage; node:test; stdlib-only per NFR33). primary specialist: frontend.

### Debug Log References

### Completion Notes List

- Opt-in save (separate save-result.js keeps result.js grep-clean per AC-9.15) + FR27 retest-note with versioned methodology link. 972/974 unit pass (1 pre-existing ci-matrix AC-3), make lint exit 0, integrity 158/0. Budget 44KB->48KB. AC-7 Playwright network-trace deferred — satisfied by construction (save = localStorage-only, retest link = static same-origin anchor).

### File List

- src/assessment/save-result.js
- src/assessment/result.js
- src/content/i18n/en/strings.json
- src/css/components/score-panel.css
- tools/lint-no-localStorage-without-consent.mjs
- BUDGETS.json
- tests/unit/save-result.test.mjs
- tests/unit/result-save-retest.test.mjs
- tests/scaffold/cognitive-load-budget.test.mjs

## Specialist Self-Review

## Specialist Self-Review — Story 6.7 (frontend)

**Decisions made:**
- **Separate `save-result.js` module** for the localStorage write + `savedAt` timestamp, rather than inlining into `result.js`. Forced by the frozen `result.test.mjs` AC-9.15 source-grep (bans `localStorage`/`Date.now` tokens in result.js) and consistent with the Story-6.4 `theme.js` precedent. `result.js` calls `saveResult()`/`isSaved()` and never references storage primitives directly (verified: 0 forbidden tokens).
- **`Date.now` default inside `saveResult(seed, artifact, nowMs)`**: `nowMs` is injected for deterministic tests; production omits it and the module defaults to `Date.now()`. `Date.now` is confined to `save-result.js` (allowed there; banned only in `result.js`).
- **Idempotency guarded in the click handler** (closure `saved` flag), not by remove+rewrite. A second click is a no-op, so exactly one `setItem` per session — satisfies result-save-retest AC-4 (`setItemCalls.length` stays 1) and the module stays a plain overwrite at the key level.
- **Retest-note link uses the versioned+localed URL** `/methodology/${CV}/${locale}/limitations/retest-effects/` (same builder as `go()`), not the AC's shorthand `/methodology/limitations/retest-effects/` — that matches the actually-served `dist/methodology/v0.1.0/en/...` tree and the frozen triplet-link convention.
- **Budget raise 44KB→48KB** (`app-modules-bytes` 45056→49152) with appended rationale, mirroring the documented 6.2/6.4/6.5 per-story raise pattern; the AC-2 budget-pin scaffold test was updated in lockstep via a cross-story unfreeze window (owner = 6-5).

**Alternatives considered:**
- Inlining the write into `result.js` and editing AC-9.15 to carve out an exception — rejected: AC-9.15 is a project-identity invariant (NFR10) and the `theme.js` precedent already establishes the separate-module pattern.
- Trimming comments aggressively to stay under the 44KB budget instead of raising it — rejected: peer modules carry rich comments; the budget rationale explicitly accommodates real features by raising. Did a light trim to peer density, then raised.
- A real-DOM `<a>` vs JS-`assign` for the retest link — chose a native `<a href>` (accessible, no handler needed); the triplet uses spans+assign only because they aren't anchors.

**Framework gotchas avoided:**
- AC-9.15 caught the literal word "localStorage" in a *code comment* in result.js (grep is `\blocalStorage\b`, comment-blind) — reworded the comment to "browser-storage".
- The ATDD-authored `save-result.test.mjs` had an **unused `eslint-disable no-control-regex`** directive (rule not enabled in the flat config) → `eslint --max-warnings 0` failed `make lint`. Removed the directive; the assertion's control-char regex (`/[\0-\037]/`) is correct and stays. Required a per-file unfreeze window (closed via integrity record).
- `node --test <dir>` doesn't recurse on this Node version — used the Makefile glob form.

**Areas of uncertainty:**
- **AC-7 (zero-third-party) Playwright network-trace** was not executed in-session (no browser/dev-server harness). It is satisfied by construction — the save path makes only `localStorage` calls (asserted at unit level in result-save-retest AC-4) and the retest-note is a static same-origin `<a href>`; no `fetch`/script/font added. Auditor may want to run `tests/playwright/network-trace.spec.mjs` against the live save click to confirm.
- **Pre-existing failure**: `tests/scaffold/ci-matrix.test.mjs` AC-3 (deferred CI jobs `if:false` + activation comment) fails on clean `epic/6` tip too — NOT introduced by this story; out of scope for 6.7.

**Tested edge cases:**
- save-result.test.mjs: zero writes at import; exactly-one `setItem`; key = `iqme:saved-result:`+hashSeed; payload carries artifact + savedAt; hashSeed determinism + distinctness + key-safety; isSaved read-only; idempotent re-save (one key, no remove).
- result-save-retest.test.mjs: button unsaved default + zero render writes; retest anchor exact href; click → one write + flip to saved; second click no extra write; empty-storage first render.
- Full suite: 972/974 pass (1 pre-existing ci-matrix), `make lint` exit 0, `integrity verify` 158/0.
