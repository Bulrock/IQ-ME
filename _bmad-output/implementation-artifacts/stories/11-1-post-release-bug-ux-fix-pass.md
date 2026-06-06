---
id: 11-1-post-release-bug-ux-fix-pass
title: "Story 11-1: Post-release bug & UX fix pass (PR-1 … PR-14)"
status: review
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

1. **(PR-1) Favicon.** `src/index.html` `<head>` references `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, and `site.webmanifest` from the deployed asset path (no 404 in the network trace). `src/assets/favicon_io/site.webmanifest` already has `name`/`short_name` = "IQ-ME" and root-absolute icon paths (`/src/assets/favicon_io/…`); the dev must confirm those paths resolve 404-free in the deployed build. The tab shows the IQ-ME mark on every route.
2. **(PR-2a) Mobile header overlap.** At mobile widths, Previous / Next / "Finish test early" controls do not overlap the "Item N of 16" header region — no element overlap at the documented mobile breakpoints.
3. **(PR-2b) Option sizing.** Answer-option buttons are reduced in size while their inner figure icons are enlarged/normalized to be size-consistent with the matrix-grid cells above, so each option is clearly distinguishable.
4. **(PR-2c) Sticky nav + scroll.** Previous/Next are sticky/fixed and always reachable; the answer-options region scrolls within its own container when content exceeds viewport height; at common mobile sizes the full item fits on screen without page scroll wherever layout allows.
5. **(PR-3) No flicker on Next.** Advancing items produces no full-screen flicker/repaint — next-item imagery is preloaded and the item container updates in place (stable keys, no unmount/remount flash).
6. **(PR-4) Submit finalizes.** On the final (16th) item the primary action reads "Submit test"; activating it — including with unanswered items — finalizes the session, routes to `/#/result`, and never resets to the landing page. Unanswered items are handled deterministically by the scoring path.
7. **(PR-5) Result centered.** The result page content is vertically centered/balanced (no top-hug with large empty space below); the co-equal triplet is preserved.
8. **(PR-6) Theme switcher.** The theme control is a classic toggle/segmented switcher (replacing the radio buttons), positioned top-right in the header, offering **Light/Dark** (System removed by maintainer decision during review — with no saved choice the app follows the OS `prefers-color-scheme`, and the active segment reflects the resolved theme), persisting selection via the existing `[data-theme]` mechanism, keyboard-operable.
9. **(PR-7) Language dropdown.** Language selection is a custom dropdown showing country flags for EN/RU/PL, keyboard- and screen-reader-accessible, preserving locale persistence, the FR8 in-test locale-switch blocker hint, and `hreflang` behavior.
10. **(PR-8) Header logo.** The app logo (from `src/assets/favicon_io/`, appropriately sized) appears beside the "IQ-ME" wordmark in the header without layout shift; the chrome-footer narrow-width wrap fix (PR #24) is not regressed; the logo has a correct accessible name / decorative marking.
11. **(PR-9) Methodology theme.** With Light theme selected, `/methodology` renders in Light (not Dark); theme selection round-trips between the SPA and the methodology surface for System/Light/Dark.
12. **(PR-10) No horizontal scroll.** With the "Continue" button locked, the helper caption beneath it (including the longest PL string) wraps/constrains within viewport width — no horizontal page scroll at any supported width/locale; the timed unlock behavior is unchanged.
13. **(PR-11) Methodology sidebar.** `/methodology` presents its section list in a sidebar with in-page anchor navigation — clicking scrolls to a section on a single scrollable page (no separate-page navigation); anchors are deep-linkable and keyboard-accessible.
14. **(PR-12a) Methodology condensed.** The `/methodology` content is analyzed and significantly condensed; EN body edits are mirrored to PL/RU with `sourceHashEN` bumped (NFR27), `lint-translation-parity` green.
15. **(PR-12b) No dead links.** Every methodology link across EN/RU/PL resolves to real content — no "Cannot GET"/404 — verified by an automated link-completeness check. Note the likely failure class is route-shape, not absent content: e.g. `scoring/eap.md` exists in all three locales and renders to `…/scoring/eap/` (trailing slash), so a link to `…/scoring/eap` (no slash) 404s while the page is present; the check must catch this.
16. **(PR-13) Disclaimer collapse.** The result-page explanatory disclaimer collapses to its first line with an expand/collapse toggle, defaulting collapsed, keyboard- and screen-reader-operable, without breaking PR-5 centering.
17. **(PR-14) Saved-results management.** With ≥1 saved result (`iqme:saved-result:<id>`), a "View saved results" entry point appears to the right of "Start the test", opening a screen that lists all saved results, lets the user open an individual result, and offers a "delete all" action plus per-result checkboxes to delete only selected ones — entirely client-side, no server/telemetry. The entry point is hidden when no results exist; deletions reflect immediately.
18. **Gates green.** `make lint` exit 0, `make build` exit 0, the Playwright/axe-core/network-trace suites pass, and the byte-stable build assertion holds on the branch.

## Tasks / Subtasks

- [x] **Task 1:** (PR-1) Wire favicon + manifest. (AC 1)
  - [x] Add icon/manifest `<link>`s to `src/index.html` head; resolve served asset path.
  - [x] Set `name`/`short_name` = "IQ-ME" + root-absolute icon paths in `src/assets/favicon_io/site.webmanifest`. _(done 2026-06-06 in the spec-fix pass)_
  - [x] Confirm no 404 for icon requests in the network trace (manifest icon paths included).
- [x] **Task 2:** (PR-2a/2b/2c) Fix mobile test-screen layout. (AC 2, 3, 4)
  - [x] Resolve nav/header overlap in `src/css/components/item-runner.css` / `progress-indicator.css`.
  - [x] Shrink option buttons; enlarge/normalize option icons to match matrix cells.
  - [x] Make Previous/Next sticky/fixed; make options scrollable; aim to fit on screen.
- [x] **Task 3:** (PR-3) Eliminate Next-transition flicker. (AC 5)
  - [x] Preload next-item imagery in `src/assessment/item-runner.js` / `item-selection.js`.
  - [x] Update item container in place (stable keys, no unmount/remount).
- [x] **Task 4:** (PR-4) Make final-item Submit finalize correctly. (AC 6)
  - [x] Label the last-item primary action "Submit test".
  - [x] Route to `/#/result` on submit (incl. unanswered); handle unanswered in scoring path; never reset to landing. (`item-runner.js` / `state.js` / `routing.js` / `result.js`)
- [x] **Task 5:** (PR-5) Vertically center the result page. (AC 7)
  - [x] Center/balance layout in `result.js` / `src/css/components/score-panel.css`; preserve the co-equal triplet.
- [x] **Task 6:** (PR-6) Replace theme radios with a header switcher. (AC 8)
  - [x] Build a toggle/segmented switcher in `theme.js` / `theme-toggle.css`; place top-right in `chrome-header.css`; keep `[data-theme]` persistence; keyboard-operable.
- [x] **Task 7:** (PR-7) Replace language radios with a flag dropdown. (AC 9)
  - [x] Build a custom accessible dropdown with flags in `language-switcher.js` / `language-switcher.css`; preserve locale persistence, FR8 blocker hint, `hreflang`.
- [x] **Task 8:** (PR-8) Add header logo. (AC 10)
  - [x] Place sized logo beside the wordmark in the header without layout shift; correct accessible name/decorative marking; don't regress the footer wrap fix.
- [x] **Task 9:** (PR-9) Make `/methodology` honor the selected theme. (AC 11)
  - [x] Propagate the `[data-theme]` selection to the methodology surface; verify System/Light/Dark round-trip.
- [x] **Task 10:** (PR-10) Fix horizontal scroll under the locked Continue button. (AC 12)
  - [x] Wrap/constrain the helper caption (incl. PL) in `consent.js` / `locale-switch-blocker-hint.js` / `consent-scene.css`; keep timed unlock.
- [x] **Task 11:** (PR-11) Methodology sidebar + anchor navigation. (AC 13)
  - [x] Render the section list as a sidebar; convert section links to in-page anchors on a single scrollable page; deep-linkable + keyboard-accessible. (methodology render/build path)
- [x] **Task 12:** (PR-12) Condense methodology content + fix dead links. (AC 14, 15)
  - [x] Analyze and significantly condense the corpus; mirror EN edits to PL/RU + bump `sourceHashEN` (NFR27).
  - [x] Audit all methodology links EN/RU/PL; eliminate 404 routes; add an automated link-completeness check.
- [x] **Task 13:** (PR-13) Collapse the result disclaimer. (AC 16)
  - [x] Collapse to first line with an accessible expand/collapse toggle (default collapsed) in `result.js`; don't break PR-5 centering.
- [x] **Task 14:** (PR-14) Saved-results view/list/delete. (AC 17)
  - [x] Add a "View saved results" entry point right of "Start the test" (shown only when results exist) in `landing.js` / `routing.js`.
  - [x] Build a saved-results list screen: list all, open one, "delete all", and per-result checkboxes to delete selected. (`save-result.js`)
  - [x] Keep everything client-side (no server/telemetry); reflect deletions immediately.
- [x] **Task 15:** Verify gates. (AC 18)
  - [x] `make lint` exit 0, `make build` exit 0; Playwright + axe-core + network-trace pass; byte-stable build assertion holds.

## Dev Notes

- **Theme model:** `src/assessment/theme.js` sets `<html>[data-theme]` (light/dark) or removes it (system → `prefers-color-scheme`). PR-6 reshapes the control, PR-9 must make the static methodology pages inherit the same attribute.
- **Methodology pages are versioned static HTML** built by the corpus/render pipeline — PR-9/11/12 touch that path, not just the SPA. PR-12a edits cascade per NFR27.
- **Scaffold/no-fabrication guards** run at release boundary (tag push), not on PRs — see project memory; this story is real code, no gate-fabrication concerns.
- **Sequencing:** Epic 13 (glassmorphism) will restyle several of these surfaces (PR-2/5/6/7/11/13); land this story first so the redesign absorbs the corrected layouts.

### Carry-forward lessons

- **Deliberately replacing UI locked by an earlier story's frozen tests:** when a story spec mandates replacing a control (PR-6 theme radios→toggle, PR-7 language radios→flag dropdown), the older done-story tests that assert the OLD shape must be rewritten to the new contract and their integrity re-recorded (`tds integrity record --as=<role>`), not deferred or worked around with duplicate controls. Updated `theme.test.mjs`, `chrome-components.spec.mjs`, `language-switcher.test.mjs`, `i18n-locale-switch.spec.mjs` here.
- **Methodology output must be directory-style:** `canonicalUrlFor()`/hreflang already emit trailing-slash URLs (`scoring/eap/`), but `outputPathFor()` emitted flat `scoring/eap.html` → the no-slash links 404 (PR-12b). Fix: emit `<name>/index.html` for every page so served URLs match the canonical convention. Regenerate golden snapshots (`make snapshot-update`) after any methodology build/template change.
- **No inline scripts (CSP):** `lint-csp-source` forbids inline `<script>` bodies (only `src=` scripts + the `<script nomodule>` fallback are allowed). The methodology theme-bootstrap (PR-9) had to be an external blocking `<script src="/src/assessment/methodology-theme.js">`, not an inline IIFE. Methodology-only modules are excluded from the `app-modules-bytes` budget (alongside `test-hook.js`/`cite-this-page.js`).
- **Cognitive-load budgets (`BUDGETS.json`) re-pin explicitly:** new features legitimately grow CSS/JS; raise `css-components-lines` and `app-modules-bytes` with a documented `EPIC-N BUMP (old → new): …` rationale and a tight (~2%) margin — never a silent stamp.
- **Frozen-test latent bugs surface only at GREEN:** pr11 (`CSS.escape` undefined in Node) and pr14 (`navigate()||history.back()` spurious fallback) passed test-review while RED (early assertion failed first) but threw once the impl made earlier assertions pass. Fix the test + re-record integrity.

## Dev Agent Record

### File List

_(to be populated during implementation)_
- src/index.html
- src/assessment/item-runner.js
- src/assessment/result.js
- src/content/i18n/en/strings.json
- src/content/i18n/ru/strings.json
- src/content/i18n/pl/strings.json
- src/css/components/score-panel.css
- src/css/components/item-runner.css
- src/css/components/consent-scene.css
- src/css/components/chrome-header.css
- src/assessment/main.js
- src/assessment/theme.js
- src/css/components/theme-toggle.css
- src/assessment/language-switcher.js
- src/css/components/language-switcher.css
- tools/build-methodology.mjs
- src/css/components/masthead.css
- src/assessment/saved-results.js
- src/assessment/landing.js
- src/assessment/routing.js
- src/css/components/landing.css
- src/css/components/saved-results.css

### Change Log
- 2026-06-06 — Story authored from maintainer post-release triage (PR-1 … PR-14).
- 2026-06-06 — Spec-fix pass (post adversarial review): `site.webmanifest` `name`/`short_name` set to "IQ-ME" + icon paths corrected to `/src/assets/favicon_io/…`; AC1/Task 1 updated to reflect that; AC15/PR-12b dead-link example corrected (source `eap.md` exists in all locales — failure class is trailing-slash route shape, not absent content).

## Specialist Self-Review

## Specialist Self-Review — 11-1-post-release-bug-ux-fix-pass (frontend)

**Decisions made:**
- **PR-1…PR-14** implemented against the frozen ATDD specs (16 `pr*.spec.mjs` + cross-story tests). Vanilla JS/CSS/HTML, zero third-party (NFR6), no inline scripts (lint-csp-source) — the methodology theme bootstrap is an external `<script src>`, not inline.
- **No-flicker (PR-3)** uses an in-place DOM update (`updateItemInPlace`) that mutates the existing `<img>`/options/progress/nav rather than re-rendering, plus `new Image()` cache-warming (not `<link rel=preload>`, which emitted a console "unused preload" warning).
- **Methodology dir-style output (PR-12b):** every page emits `<name>/index.html` so served URLs match `canonicalUrlFor()`'s trailing-slash convention (the dead-link root cause).

**Maintainer live-review deviations (disclose to auditor — these changed AC/scope):**
- **AC8 — System theme removed.** The switcher is now Light/Dark only; with no saved choice it follows the OS (`prefers-color-scheme`), active segment reflects the resolved scheme. Spec AC8 updated. Tests updated: theme.test.mjs, chrome-components, pr6.
- **AC14 — methodology cut to core.** Corpus reduced 35→19 pages/locale (dropped Norming, Ethics, glossary, bibliography, changelog, iq-me-license, methodology-claims). All app-linked/test/protected pages kept (Scoring core, Limitations, Constructs, both Tails, citation, icar-license) so nothing 404s. Cross-story tests updated (anchor-pages, lint-glossary-coverage, bridge-9b-1 changelog). lint-glossary degrades to defer-mode; claims-manifest to removed pages → WARN (exit 0).
- **NEW — resume interrupted tests (not in original ACs).** `session-persistence.js` auto-saves the in-progress session; saved-results page gained an "Unfinished tests" resume/delete section. **NFR9 relaxed** for the `iqme:in-progress` key (maintainer decision) — allowlisted in lint-no-localStorage-without-consent. full-slice's no-write assertion is unaffected (it drives via the hook, not the item-runner UI).
- **AC16 extended** — result crisis-resources collapse: first resource always visible (harm-safe), rest behind a fade-out + expand (default collapsed).
- App-shell / fit / mobile-scaling work across item-runner, consent, methodology (only-content-scrolls), result centering, saved-results styling, mobile font/button down-scaling.

**Alternatives considered:**
- Methodology cut: "trim each page" vs "drop sections" vs "tell me what to keep" — maintainer chose drop-sections; I kept every linked/tested page to avoid 404s + test breaks.
- Resume privacy: opt-in toggle vs always-on auto-save — maintainer chose always-on (NFR9 relaxed, documented).

**Framework gotchas avoided:**
- In-place item update keeps listeners attached (closures read state dynamically) — no detach/re-attach churn, no `<img>` recreation flash.
- Resume seed-restore: `ensureSession` rebuilds the SAME selection from the persisted seed via `hexToBytes` instead of regenerating.
- `#app` pinned to `100dvh` only on `#/test` and `#/consent` (scoped, base.css `min-height:100vh` neutralized) so options/envelope scroll, page doesn't.
- Frozen-test latent bugs surfaced at GREEN (pr11 `CSS.escape`, pr14 `navigate()||history.back()`) — fixed + re-recorded.

**Areas of uncertainty (auditor focus):**
- NFR9 relaxation for resume — confirm the always-on auto-save posture is acceptable product-wide (it's the one privacy-invariant change this story makes).
- Methodology cut — confirm the dropped Ethics/Norming content is acceptable to lose (transparency tradeoff); the 9c/9d translation gates now cover fewer pages.
- Cognitive-load budgets re-pinned several times during the live-review polish (css-components-lines 1500→1850; app-modules-bytes 62464→88064) — each with documented rationale, but the cumulative growth warrants an audit.

**Tested edge cases:**
- Item screen fit at 360–414 / 768 / 1280–1440 (pageOverflow 0, no options scroll, nav reachable).
- Resume: persist item 3 → leave → resume restores items + position + responses.
- Bottom-decile crisis collapse: 1 visible + 4 hidden, default collapsed.
- Methodology cut: 19 pages/locale, parity green, no dead links, snapshots regenerated.
- Gates (AC18): make lint 0, make build 0, full Playwright 145 passed/0 failed, byte-stable holds. (make test: 14 pre-existing 9-series human-deliverable gate guards remain RED by design.)
