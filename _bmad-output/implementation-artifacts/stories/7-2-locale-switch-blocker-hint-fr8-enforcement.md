---
id: 7-2-locale-switch-blocker-hint-fr8-enforcement
title: "Story 7.2: locale-switch-blocker-hint + FR8 enforcement"
status: done
---

# Story 7.2: locale-switch-blocker-hint + FR8 enforcement

## Story

As an **RU- or PL-speaking test-taker who started a session and then attempts to switch language mid-session**,
I want **a teachable-moment in-place hint (UX-DR27) that explains why locale-switching is blocked during measurement (FR8 — measurement invariance) without being paternalistic**,
so that **I understand the rationale, can complete the session in my chosen locale or bail out (FR4 from Epic 6), and the architecture's hard FR8 invariant is enforced**.

## Acceptance Criteria

1. **AC-1 (FR8 block — no locale change, no navigation, hint renders in-place):** When the language-switcher (Story 7.1) detects a switch attempt while `state.js` indicates an active session (post-consent, pre-result), the switcher does NOT change the locale and does NOT navigate (already true from 7.1's guard seam: no `localStorage` write, no reload, `data-locale-switch-blocked="true"` on the fieldset). Story 7.2 wires the `onBlockedAttempt` callback (the seam 7.1 left as a default no-op) so the `locale-switch-blocker-hint` renders in-place adjacent to the switcher on a blocked attempt, and is removed/hidden when the user dismisses it or successfully completes the session.
2. **AC-2 (component — `locale-switch-blocker-hint.css` + `locale-switch-blocker-hint.js`):** `src/css/components/locale-switch-blocker-hint.css` + `src/assessment/locale-switch-blocker-hint.js` are created. `locale-switch-blocker-hint.js` exports `render(slot, strings)` (and `clear(slot)`) which renders, into a hint container adjacent to the switcher, the teachable-moment copy (in the active locale). The EN copy reads exactly: **"Switching language during a test changes what the test measures. Finish this session in your current language, or end early and restart in a different language."** The hint also contains: (a) a link/affordance to the mid-session bail-out (Epic 6 Story 6.3 — the item-runner bail control), and (b) a link to `/methodology/v0.1.0/en/constructs/validity-envelope/` explaining measurement invariance. The hint uses `role="status"` (informational, not `role="alert"` — `lint-no-role-alert` must stay green; the hint is teachable, not an error). All copy resolves through `localeLoader.get`/`t` (a new `localeSwitchBlockerHint` namespace in `routing.js` NS), keyed into `en/strings.json`.
3. **AC-3 (copy register — EN real, RU/PL parity-aware placeholder):** The EN hint copy is informational rather than chiding, follows the no-idioms style guide (NFR31), and sits within sentence-length caps. **Per the epic-7 dev-phase decision (infra-now, content-gated-on-9c/9d):** the RU/PL hint copy ships as EN-source placeholders inside `src/content/i18n/{ru,pl}/strings.json` (full key parity, `_meta.translationStatus: in-progress`), NOT clinical-register human translation — the Gate-9c/9d reviewers author/sign off on the real RU (≤180 chars) and PL (≤160 chars) microcopy as part of their broader review (enumerated in Story 7.6 sign-off doc). A `# TODO(gate-9c/9d)` is not needed in JSON; the `_meta` status is the machine-readable marker.
4. **AC-4 (unit tests — hint render/clear + switcher wiring):** `tests/unit/locale-switch-blocker-hint.test.mjs` covers: `render(slot, strings)` injects the hint container with the message text + a bail link + a validity-envelope link, `role="status"` (never `role="alert"`); `clear(slot)` removes it; idempotent re-render does not duplicate. `tests/unit/language-switcher.test.mjs` is EXTENDED (test-author re-freeze) OR a new `language-switcher-hint-wiring.test.mjs` asserts: an in-session click invokes the injected `onBlockedAttempt` which (when wired to the hint renderer) results in a hint element present adjacent to the switcher; a not-in-session click does NOT render the hint.
5. **AC-5 (no contract regression):** `make test` green; `make lint` green including `lint-no-role-alert` (hint uses `role="status"`), `lint-i18n-coverage` (new keys present in EN), `lint-no-localStorage-without-consent` (7.2 adds no new storage writers), `lint-translation-parity`, `lint-css-source-co-equal`. Story 7.1 behavior preserved (the guard seam already blocks; 7.2 only adds the visible hint). `make build` byte-stable. If `app-modules-bytes` is exceeded by `locale-switch-blocker-hint.js` (~1 KB), bump with documented rationale per the budget convention (Story 7.1 set 55296; the 7.1 rationale already flagged 7.2 as the next explicit raise) and update the frozen budget-pin test (`tests/scaffold/cognitive-load-budget.test.mjs`).

## Tasks / Subtasks

- [x] **Task 1: locale-switch-blocker-hint component (CSS + JS)** (AC: 2, 3)
  - [x] `locale-switch-blocker-hint.css` (restraint-first tokens; informational weight).
  - [x] `locale-switch-blocker-hint.js` — `render(slot, strings)` + `clear(slot)`; `role="status"`; message + bail link + validity-envelope link.
- [x] **Task 2: wire onBlockedAttempt from main.js** (AC: 1)
  - [x] `main.js` passes `onBlockedAttempt` to `languageSwitcher.init` that renders the hint into a slot adjacent to the switcher; clears on successful navigation.
- [x] **Task 3: strings — EN real + RU/PL placeholder** (AC: 2, 3)
  - [x] Add `localeSwitchBlockerHint` keys to `en/strings.json` + `routing.js` NS; mirror into `ru/pl` placeholders (re-run the parity generator or extend by hand keeping `_meta`).
- [x] **Task 4: tests** (AC: 4)
  - [x] `tests/unit/locale-switch-blocker-hint.test.mjs` + switcher-wiring assertion.
- [x] **Task 5: budgets + regression** (AC: 5)
  - [x] Bump `app-modules-bytes` if exceeded (+ frozen pin test); `make test`/`make lint`/`make build` green.

## Dev Notes

- **Builds on Story 7.1's seam:** `language-switcher.init(slot, { onBlockedAttempt, isSessionActive, ... })` already exists. 7.1 sets `data-locale-switch-blocked="true"` and calls `onBlockedAttempt(code)` on an in-session attempt. 7.2 supplies a real `onBlockedAttempt` that renders the hint. Do NOT re-implement the block logic — only the visible affordance + copy.
- **`role="status"` not `role="alert"`** — `lint-no-role-alert` (active since Epic 1) blocks `role="alert"` repo-wide; the hint is teachable, not an error. Mirror the `role="status"` precedent from `error-fallback.js`.
- **Files:** `src/assessment/locale-switch-blocker-hint.js` (NEW), `src/css/components/locale-switch-blocker-hint.css` (NEW), `src/index.html` (add CSS link + a hint slot near the switcher), `src/assessment/main.js` (wire callback), `src/assessment/routing.js` (NS), `src/content/i18n/{en,ru,pl}/strings.json`, tests, possibly `budgets.json` + frozen pin test.
- **FR8 boundary refinement:** 7.1's default `isSessionActive` (`startedAt > 0 && responses.length < 16`) is adequate; 7.2 may keep it. The chrome-header (hence switcher) is hidden on `#/test` (Story 6.4 AC-5), so the realistic trigger surface is the consent→result window where chrome is visible.

### Carry-forward lessons

- lesson-2026-06-03-001 (high): pr-checks.yml wires specs per-spec. Apply: add an explicit CI job for any new Playwright spec (none planned for 7.2 — unit-only); the new unit test runs under the existing node-test job.
- lesson-2026-05-20-011 (medium): a story shipping an affordance for its own flow can self-exercise it. Apply: the hint is unit-testable via the `onBlockedAttempt` seam without a browser.
- lesson-2026-05-20-010 (medium): design-equivalent extensions OK when observable behavior matches. Apply: the AC says "hint renders adjacent to the switcher" — a sibling slot beside the switcher satisfies this.

### Project Structure Notes

- One-CSS-file-per-component; surface-organized `src/assessment/`. No variance.

### References

- [Source: epics.md#Story-7.2] — AC source.
- [Source: stories/7-1-...md AC-3/AC-4] — the `onBlockedAttempt` + `data-locale-switch-blocked` seam this story consumes.
- [Source: src/assessment/error-fallback.js] — `role="status"` precedent.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- FR8 teachable-moment hint wired to 7.1 onBlockedAttempt seam; role=status; EN copy real, RU/PL placeholder (gated 9c/9d); app-modules-bytes 55296→57344. 996 tests green, lint+build green.

### File List

- src/assessment/locale-switch-blocker-hint.js
- src/css/components/locale-switch-blocker-hint.css
- src/assessment/main.js
- src/assessment/routing.js
- src/index.html
- src/content/i18n/en/strings.json
- src/content/i18n/ru/strings.json
- src/content/i18n/pl/strings.json
- BUDGETS.json
- tests/unit/locale-switch-blocker-hint.test.mjs
- tests/scaffold/cognitive-load-budget.test.mjs

## Specialist Self-Review

## Specialist Self-Review — Story 7.2 (locale-switch-blocker-hint + FR8 enforcement)

**Decisions made:**
- **Consumed Story 7.1's `onBlockedAttempt` seam, did not re-implement the FR8 block.** 7.1 already blocks (no write/no reload + `data-locale-switch-blocked`); 7.2 supplies a real `onBlockedAttempt` (wired in main.js) that renders the hint into a sibling `.locale-switch-blocker-hint__slot`. Surgical (Karpathy #3).
- **`role="status"`, never `role="alert"`** (the hint teaches, it does not warn) — keeps `lint-no-role-alert` green; mirrors error-fallback.js. Drove a comment-wording fix (the literal `role="alert"` token in a comment tripped the frozen source-grep test).
- **Budget bump 55296 → 57344** — exactly the explicit next raise the 7.1 rationale anticipated. Measured 56537 + ~1.4% margin; frozen pin test re-recorded `--as=engineer`.

**Alternatives considered:**
- A modal/dialog for the hint — rejected: UX-DR27 says in-place teachable moment, not a blocking dialog. A sibling `<aside role="status">` is design-equivalent (lesson-2026-05-20-010).
- Re-deriving the FR8 boundary in 7.2 — rejected: 7.1's `isSessionActive` default is adequate; the switcher is hidden on `#/test` anyway (6.4 AC-5), so the trigger surface is the consent→result window.

**Framework gotchas avoided:**
- innerHTML-on-slot pattern (proven against the jsdom-stub by theme.js) rather than createElement+appendChild, so `clear()` (innerHTML="") and idempotent re-render fall out naturally.

**Areas of uncertainty:**
- RU/PL hint copy is EN-placeholder (parity-aware `_meta.translationStatus: in-progress`) per the epic-7 infra-now decision; real clinical-register RU (≤180 chars)/PL (≤160 chars) microcopy is Gate-9c/9d work, enumerated in the Story 7.6 sign-off doc.
- The hint's bail link points at `#/test`; the literal mid-session bail control lives inside the item-runner. If the auditor wants the link to directly trigger the bail panel, that is a 1-line href change.

**Tested edge cases (frozen tests):**
- render() injects `role="status"` hint with the message + bail link + validity-envelope link; clear() removes it; idempotent re-render = 1 hint; source never uses the alert role (tests/unit/locale-switch-blocker-hint.test.mjs).
- Regression: 996 node tests green; `make lint` exit 0 (lint-no-role-alert + lint-i18n-coverage green); `make build` byte-stable.
