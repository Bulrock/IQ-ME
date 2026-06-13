---
id: 12-2-pre-test-methodology-variant-selection
title: "Story 12-2: Pre-test methodology + variant (short/full) selection"
status: in-progress
---

# Story 12-2: Pre-test methodology + variant (short/full) selection

## Story

As a user about to start the screener (PR-15),
I want to choose which methodology to take and whether to take the short or full variant before the test begins,
so that I can pick the depth and type of reasoning task that suits me.

## Epic context

Builds on the Story-12-1 shortlist. Inserts a new `#/selection` scene between landing and consent: `landing → selection → consent → test`. The selection is carried into session state (a v1→v2 state-schema migration adds `version`, `methodology`, `variant`). Fully localized EN/RU/PL (new `selection` i18n namespace mirrored to all three) and WCAG 2.2 AA (native radio fieldsets). The consent ceremony is preserved (selection → consent keeps the dwell gate). The existing geometric matrix test is offered as one methodology, its current 16-item form as its "short" variant. The variant ENGINE (full item set) is Story 12-3; the additional non-geometric methodology is 12-4 — this story ships the SELECTOR + the state plumbing, defaulting sensibly so a user can proceed quickly.

## Acceptance Criteria

**Given** the approved shortlist from Story 12-1,
**When** the user starts a test,
**Then** a pre-test selection step lets them choose a methodology and a variant (short/full), with the existing geometric matrix-reasoning test offered as one methodology and its current 16-item form as its "short" variant, and the selection is carried into the session state and reflected in scoring/result.
1. A new `#/selection` scene (`src/assessment/selection.js`, registered in routing.js ROUTES + NS map) renders a methodology radio group and a variant (short/full) radio group, with the geometric matrix test selected by default and "short" selected by default — so a user can proceed in one click.
2. The state schema is migrated v1→v2 (the documented path in `state.schema.json`'s `$comment`): a required `version: "v2"` field plus optional `methodology` (string enum incl. the geometric default) and `variant` (enum `short|full`); `additionalProperties:false` is preserved. `state.js` adds `setMethodology`/`setVariant` mutators (validated against the enums) and includes them in `getState()`. The frozen `state-shape.spec.mjs` is updated for v2 (base now carries `version`; new enum + version tests added) and integrity re-recorded.
3. The selection scene carries the choice into state via `setMethodology`/`setVariant` (NOT touching `startedAt`, so the locale switcher stays unlocked pre-test). "Continue" navigates to `#/consent`, preserving the dwell ceremony. The landing "Start the test" button now navigates to `#/selection` (the frozen landing-scene AC-4.9 is updated to expect `#/selection` and integrity re-recorded — cross-story frozen-test update for the new flow).
4. The scene is fully localized: a new `selection` namespace in `src/content/i18n/en/strings.json` (heading, intro, methodology/variant group labels + option labels + helper text, continue button), mirrored into `ru/strings.json` and `pl/strings.json` so `lint-i18n-coverage` (EN key coverage) and any SPA-strings parity stay green. All UI text routed via `get()`/`fmt()` (no hardcoded `.textContent` prose). RU/PL use agent-drafted strings consistent with the existing draft-translation posture (gated, not human-reviewed).
4b. The scene is WCAG 2.2 AA: native `<fieldset>`/`<legend>` radio groups, each option a real `<input type="radio">` with a `<label>`, keyboard-operable, with an accessible name on each group; the "Continue" button is a real button.
5. A scene CSS file `src/css/components/selection-scene.css` (BEM-scoped, semantic + glass tokens only, alphabetical index.html link) styles the selector consistent with the Epic-13 glass identity, theme-correct Light/Dark.
6. Guards: a unit test (`tests/unit/selection-scene.test.mjs`) asserting the render contract (radio groups, defaults, continue→consent nav, no forbidden globals, escape-helper use) + a scaffold guard (`tests/scaffold/12-2-selection.test.mjs`) asserting routing registration, the selection namespace in all three locales, state v2 fields/mutators, and the index.html link. RED before impl, GREEN after.
7. `make lint` exit 0, `make build` exit 0, `make test` green (modulo pre-existing 9-series reds). The state-v2 contract test + the updated landing test pass; the full lifecycle still yields schema-valid state with zero storage writes.

## Tasks / Subtasks

- [ ] **Task 1: author the guards** (`tests/unit/selection-scene.test.mjs` + `tests/scaffold/12-2-selection.test.mjs`) encoding AC 1-6. Confirm RED. (test-author phase)
- [ ] **Task 2: migrate state v1 to v2** — schema (`version` required + methodology/variant optional enums, additionalProperties:false), `state.js` (freshState version, getState snapshot, setMethodology/setVariant mutators), and update the frozen state-shape contract test for v2 + re-record integrity. (impl phase)
- [ ] **Task 3: build the selection scene** (`src/assessment/selection.js`) — radio groups, defaults, state writes, continue→consent; register in routing.js ROUTES + NS. (impl phase)
- [ ] **Task 4: localize** — add the `selection` namespace to en/ru/pl strings.json (mirrored), route all text via get(). (impl phase)
- [ ] **Task 5: style + wire flow** — `selection-scene.css` (glass tokens, alphabetical link in index.html); update landing nav to `#/selection` + update the frozen landing AC-4.9 + re-record integrity. (impl phase)
- [ ] **Task 6: verification** — guards GREEN, frozen state + landing tests GREEN, `make lint`/`make build` exit 0, `make test` green. (integration phase)

## Dev Notes

- **State v2 is the documented migration** (`state.schema.json` `$comment`: "v2 will make `version` itself required"). Keep `additionalProperties:false`; the `{...base, foo:"bar"}` negative test still holds (foo undeclared). `base` in the contract test must now include `version: "v2"`.
- **Frozen-test updates (sanctioned):** landing-scene AC-4.9 (nav target → `#/selection`) and state-shape.spec.mjs (v2 base) are deliberately changed by this story's new flow → update + `tds integrity record` (cross-story frozen-test pattern). Do NOT change any OTHER landing assertion.
- **Locale-lock guard:** the language switcher locks when `startedAt > 0 && responses < 16`. The selection scene must NOT set startedAt (don't call setSeed/setItem/recordResponse) — only setMethodology/setVariant — so locale stays switchable pre-test.
- **Default fast-path:** geometric + short are pre-selected so "Continue" works in one click (epic AC: "defaults sensibly").
- **i18n:** add `selection` to en first; mirror keys into ru/pl (agent-drafted, consistent with the existing in-progress draft-translation posture — see project memory). Route every string via `get("selection.x")` static literals (the coverage lint only catches static refs).

### Carry-forward lessons

- cross-story frozen-test UX replacement (project memory): a story that changes UI locked by an earlier done story's frozen tests should update those tests + `tds integrity record`, not ship duplicate controls. Apply: landing AC-4.9 + state-shape v2 updates.
- Draft RU/PL translations (project memory): agent-drafted SPA strings are interim/gated. Apply: selection ru/pl strings are agent-drafted, consistent posture.
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`. Apply: both new guards run via `make test`.

### Project Structure Notes

- New: `src/assessment/selection.js`, `src/css/components/selection-scene.css`, `tests/unit/selection-scene.test.mjs`, `tests/scaffold/12-2-selection.test.mjs`.
- Modified: `src/assessment/state.js`, `src/assessment/state.schema.json`, `src/assessment/routing.js`, `src/assessment/landing.js`, `src/index.html`, `src/content/i18n/{en,ru,pl}/strings.json`, `tests/contract/state-shape.spec.mjs` (frozen, v2), `tests/unit/landing-scene.test.mjs` (frozen, nav target).
- No scoring change (12-3/12-4 consume methodology+variant).

### References

- [Source: _bmad-output/planning-artifacts/methodology-landscape-research.md §6 gating contract]
- [Source: src/assessment/state.schema.json] (v1→v2 documented path)
- [Source: src/assessment/routing.js] (ROUTES + NS registration)
- [Source: src/assessment/consent.js] (the ceremony the flow preserves)

## Dev Agent Record

### Agent Model Used

frontend (vanilla JS SPA scene + state migration + i18n; React/Vue-agnostic)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
