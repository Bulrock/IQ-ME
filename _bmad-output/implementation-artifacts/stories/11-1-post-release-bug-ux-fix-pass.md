---
id: 11-1-post-release-bug-ux-fix-pass
title: "Story 11-1: Post-release bug & UX fix pass (PR-1 … PR-14)"
status: ready-for-dev
---

# Story 11-1: Post-release bug & UX fix pass (PR-1 … PR-14)

## Story

As a **first-time visitor arriving at IQ-ME just after the v1.0.0 release**,
I want **the brand, mobile layout, test flow, controls, methodology pages, and saved-result handling to all behave correctly**,
so that **the screener feels finished and trustworthy rather than rough around the edges**.

> Single-story epic by maintainer decision: all fourteen post-release fixes (PR-1 … PR-14) ship in this one story. Source: maintainer post-release triage, 2026-06-06. Epic: `epic-11`.

## Constraints (load-bearing — do not regress)

- **Zero third-party (NFR6):** no external CDNs, fonts, analytics, or error reporting. The 30-second DevTools network-trace must stay zero-third-party.
- **WCAG 2.2 AA:** every new/changed control (theme switcher, language dropdown, saved-results screen, collapse toggle) must be keyboard-operable and screen-reader-correct.
- **Byte-stable build:** `make build` must remain deterministic; methodology output must stay byte-stable.
- **NFR27 parity cascade:** any edit to an EN methodology corpus body (PR-12a) must be mirrored into PL/RU with `sourceHashEN` bumped, keeping `lint-translation-parity` green.
- **Co-equal triplet invariant (Epic 3):** the percentile / IQ-scale / range triplet on the result page stays visually co-equal.
- **i18n:** all changes work across EN / RU / PL.

## Acceptance Criteria

1. **(PR-1) Favicon.** `src/index.html` `<head>` references `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, and `site.webmanifest` from the deployed asset path (no 404 in the network trace); `src/assets/favicon_io/site.webmanifest` has `name` and `short_name` set to "IQ-ME". The tab shows the IQ-ME mark on every route.
2. **(PR-2a) Mobile header overlap.** At mobile widths, Previous / Next / "Finish test early" controls do not overlap the "Item N of 16" header region — no element overlap at the documented mobile breakpoints.
3. **(PR-2b) Option sizing.** Answer-option buttons are reduced in size while their inner figure icons are enlarged/normalized to be size-consistent with the matrix-grid cells above, so each option is clearly distinguishable.
4. **(PR-2c) Sticky nav + scroll.** Previous/Next are sticky/fixed and always reachable; the answer-options region scrolls within its own container when content exceeds viewport height; at common mobile sizes the full item fits on screen without page scroll wherever layout allows.
5. **(PR-3) No flicker on Next.** Advancing items produces no full-screen flicker/repaint — next-item imagery is preloaded and the item container updates in place (stable keys, no unmount/remount flash).
6. **(PR-4) Submit finalizes.** On the final (16th) item the primary action reads "Submit test"; activating it — including with unanswered items — finalizes the session, routes to `/#/result`, and never resets to the landing page. Unanswered items are handled deterministically by the scoring path.
7. **(PR-5) Result centered.** The result page content is vertically centered/balanced (no top-hug with large empty space below); the co-equal triplet is preserved.
8. **(PR-6) Theme switcher.** The theme control is a classic toggle/segmented switcher (replacing the radio buttons), positioned top-right in the header, still offering System/Light/Dark, persisting selection via the existing `[data-theme]` mechanism, keyboard-operable.
9. **(PR-7) Language dropdown.** Language selection is a custom dropdown showing country flags for EN/RU/PL, keyboard- and screen-reader-accessible, preserving locale persistence, the FR8 in-test locale-switch blocker hint, and `hreflang` behavior.
10. **(PR-8) Header logo.** The app logo (from `src/assets/favicon_io/`, appropriately sized) appears beside the "IQ-ME" wordmark in the header without layout shift; the chrome-footer narrow-width wrap fix (PR #24) is not regressed; the logo has a correct accessible name / decorative marking.
11. **(PR-9) Methodology theme.** With Light theme selected, `/methodology` renders in Light (not Dark); theme selection round-trips between the SPA and the methodology surface for System/Light/Dark.
12. **(PR-10) No horizontal scroll.** With the "Continue" button locked, the helper caption beneath it (including the longest PL string) wraps/constrains within viewport width — no horizontal page scroll at any supported width/locale; the timed unlock behavior is unchanged.
13. **(PR-11) Methodology sidebar.** `/methodology` presents its section list in a sidebar with in-page anchor navigation — clicking scrolls to a section on a single scrollable page (no separate-page navigation); anchors are deep-linkable and keyboard-accessible.
14. **(PR-12a) Methodology condensed.** The `/methodology` content is analyzed and significantly condensed; EN body edits are mirrored to PL/RU with `sourceHashEN` bumped (NFR27), `lint-translation-parity` green.
15. **(PR-12b) No dead links.** Every methodology link across EN/RU/PL resolves to real content — no "Cannot GET"/404 routes (e.g. `/methodology/v0.1.0/en/scoring/eap`) — verified by an automated link-completeness check.
16. **(PR-13) Disclaimer collapse.** The result-page explanatory disclaimer collapses to its first line with an expand/collapse toggle, defaulting collapsed, keyboard- and screen-reader-operable, without breaking PR-5 centering.
17. **(PR-14) Saved-results management.** With ≥1 saved result (`iqme:saved-result:<id>`), a "View saved results" entry point appears to the right of "Start the test", opening a screen that lists all saved results, lets the user open an individual result, and offers a "delete all" action plus per-result checkboxes to delete only selected ones — entirely client-side, no server/telemetry. The entry point is hidden when no results exist; deletions reflect immediately.
18. **Gates green.** `make lint` exit 0, `make build` exit 0, the Playwright/axe-core/network-trace suites pass, and the byte-stable build assertion holds on the branch.

## Tasks / Subtasks

- [ ] **Task 1:** (PR-1) Wire favicon + manifest. (AC 1)
  - [ ] Add icon/manifest `<link>`s to `src/index.html` head; resolve served asset path.
  - [ ] Set `name`/`short_name` = "IQ-ME" in `src/assets/favicon_io/site.webmanifest`.
  - [ ] Confirm no 404 for icon requests in the network trace.
- [ ] **Task 2:** (PR-2a/2b/2c) Fix mobile test-screen layout. (AC 2, 3, 4)
  - [ ] Resolve nav/header overlap in `src/css/components/item-runner.css` / `progress-indicator.css`.
  - [ ] Shrink option buttons; enlarge/normalize option icons to match matrix cells.
  - [ ] Make Previous/Next sticky/fixed; make options scrollable; aim to fit on screen.
- [ ] **Task 3:** (PR-3) Eliminate Next-transition flicker. (AC 5)
  - [ ] Preload next-item imagery in `src/assessment/item-runner.js` / `item-selection.js`.
  - [ ] Update item container in place (stable keys, no unmount/remount).
- [ ] **Task 4:** (PR-4) Make final-item Submit finalize correctly. (AC 6)
  - [ ] Label the last-item primary action "Submit test".
  - [ ] Route to `/#/result` on submit (incl. unanswered); handle unanswered in scoring path; never reset to landing. (`item-runner.js` / `state.js` / `routing.js` / `result.js`)
- [ ] **Task 5:** (PR-5) Vertically center the result page. (AC 7)
  - [ ] Center/balance layout in `result.js` / `src/css/components/score-panel.css`; preserve the co-equal triplet.
- [ ] **Task 6:** (PR-6) Replace theme radios with a header switcher. (AC 8)
  - [ ] Build a toggle/segmented switcher in `theme.js` / `theme-toggle.css`; place top-right in `chrome-header.css`; keep `[data-theme]` persistence; keyboard-operable.
- [ ] **Task 7:** (PR-7) Replace language radios with a flag dropdown. (AC 9)
  - [ ] Build a custom accessible dropdown with flags in `language-switcher.js` / `language-switcher.css`; preserve locale persistence, FR8 blocker hint, `hreflang`.
- [ ] **Task 8:** (PR-8) Add header logo. (AC 10)
  - [ ] Place sized logo beside the wordmark in the header without layout shift; correct accessible name/decorative marking; don't regress the footer wrap fix.
- [ ] **Task 9:** (PR-9) Make `/methodology` honor the selected theme. (AC 11)
  - [ ] Propagate the `[data-theme]` selection to the methodology surface; verify System/Light/Dark round-trip.
- [ ] **Task 10:** (PR-10) Fix horizontal scroll under the locked Continue button. (AC 12)
  - [ ] Wrap/constrain the helper caption (incl. PL) in `consent.js` / `locale-switch-blocker-hint.js` / `consent-scene.css`; keep timed unlock.
- [ ] **Task 11:** (PR-11) Methodology sidebar + anchor navigation. (AC 13)
  - [ ] Render the section list as a sidebar; convert section links to in-page anchors on a single scrollable page; deep-linkable + keyboard-accessible. (methodology render/build path)
- [ ] **Task 12:** (PR-12) Condense methodology content + fix dead links. (AC 14, 15)
  - [ ] Analyze and significantly condense the corpus; mirror EN edits to PL/RU + bump `sourceHashEN` (NFR27).
  - [ ] Audit all methodology links EN/RU/PL; eliminate 404 routes; add an automated link-completeness check.
- [ ] **Task 13:** (PR-13) Collapse the result disclaimer. (AC 16)
  - [ ] Collapse to first line with an accessible expand/collapse toggle (default collapsed) in `result.js`; don't break PR-5 centering.
- [ ] **Task 14:** (PR-14) Saved-results view/list/delete. (AC 17)
  - [ ] Add a "View saved results" entry point right of "Start the test" (shown only when results exist) in `landing.js` / `routing.js`.
  - [ ] Build a saved-results list screen: list all, open one, "delete all", and per-result checkboxes to delete selected. (`save-result.js`)
  - [ ] Keep everything client-side (no server/telemetry); reflect deletions immediately.
- [ ] **Task 15:** Verify gates. (AC 18)
  - [ ] `make lint` exit 0, `make build` exit 0; Playwright + axe-core + network-trace pass; byte-stable build assertion holds.

## Dev Notes

- **Theme model:** `src/assessment/theme.js` sets `<html>[data-theme]` (light/dark) or removes it (system → `prefers-color-scheme`). PR-6 reshapes the control, PR-9 must make the static methodology pages inherit the same attribute.
- **Methodology pages are versioned static HTML** built by the corpus/render pipeline — PR-9/11/12 touch that path, not just the SPA. PR-12a edits cascade per NFR27.
- **Scaffold/no-fabrication guards** run at release boundary (tag push), not on PRs — see project memory; this story is real code, no gate-fabrication concerns.
- **Sequencing:** Epic 13 (glassmorphism) will restyle several of these surfaces (PR-2/5/6/7/11/13); land this story first so the redesign absorbs the corrected layouts.

## Dev Agent Record

### File List
_(to be populated during implementation)_

### Change Log
- 2026-06-06 — Story authored from maintainer post-release triage (PR-1 … PR-14).
