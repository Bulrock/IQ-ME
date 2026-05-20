---
id: 5-7-phase-2-components-eap-shrinkage-diagram-tail-aware-trail-ship-if-budget-allows
title: "Story 5.7: Phase-2 components (eap-shrinkage-diagram + tail-aware-trail) — ship-if-budget-allows"
status: done
tds:
  primary_specialist: frontend
  story_tags:
    - methodology-corpus
    - svg-asset
    - css-component
    - phase-2
---

# Story 5.7: Phase-2 components

## Story

Ship the two Phase-2 designed visual assets: `eap-shrinkage-diagram` (visual aid for EAP shrinkage at tails, referenced from `scoring/eap.md`) and `tail-aware-trail` (a curated 2-step reading trail per Diátaxis, helping a reader move from a tail-scene to a deeper page). Marked **ship-if-budget-allows** in the epic spec — landing both because epic-5 budget allows.

## Acceptance Criteria

1. **eap-shrinkage-diagram:**
   - `src/content/diagrams/eap-shrinkage-diagram.svg` — illustrates EAP shrinkage at the tails (extreme theta estimates pulled toward 0 by the standard-normal prior). NFR12 colorblind-safe; `<title>` + `<desc>` with `data-i18n-key`.
   - `src/css/components/eap-shrinkage-diagram.css` — styles the SVG's class-attributed shapes; same pattern as `validity-envelope-diagram.css` from Story 5.1.
   - `src/index.html` links the new CSS.
   - i18n strings: `diagrams.eapShrinkage.title` + `diagrams.eapShrinkage.desc` in `src/content/i18n/en/strings.json`.

2. **tail-aware-trail:**
   - `src/css/components/tail-aware-trail.css` — styles a 2-step reading-trail composition (per Diátaxis "trail" pattern: tail-scene → methodology page → next page).
   - `src/index.html` links the new CSS.
   - The trail itself (HTML composition + the per-page next-step data) is **deferred to Epic 6's result-page work** — this story ships the CSS surface so Epic 6 can render against locked styles.

3. **Tests + lints:**
   - `tests/scaffold/methodology-chrome-css.test.mjs` extended with the 2 new files (mirror Story 5.1 pattern).
   - `make test/lint/build` exit 0.

4. **Deferred:**
   - tail-aware-trail HTML composition: Epic 6 result-page result-to-trail rendering.
   - Inline rendering of eap-shrinkage-diagram in `scoring/eap.md`: deferred per Story 5.3 AC-5 (markdown-subset image-inline support out of scope).

## Tasks / Subtasks

- [x] **Task 1: Extend scaffold tests for new files**
- [x] **Task 2: Implement eap-shrinkage-diagram SVG + CSS + i18n keys**
- [x] **Task 3: Implement tail-aware-trail CSS (styling surface only)**
- [x] **Task 4: Wire CSS into src/index.html**
- [x] **Task 5: Full baseline (make test/lint/build)**
- [x] **Task 6: Branch + state hygiene**

## Dev Notes

- Mirrors Story 5.1 pattern for validity-envelope-diagram.
- The eap-shrinkage diagram doesn't need to be quantitatively precise; it is a teachable visual.

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List

- Phase-2 components shipped: eap-shrinkage SVG + CSS + tail-aware-trail CSS surface + i18n keys + index.html wiring + 9 scaffold tests. make test 875/874+1skip; lint+build exit 0.

### File List

- src/content/diagrams/eap-shrinkage-diagram.svg
- src/css/components/eap-shrinkage-diagram.css
- src/css/components/tail-aware-trail.css
- src/index.html
- src/content/i18n/en/strings.json
- tests/scaffold/methodology-chrome-css.test.mjs

## Specialist Self-Review

## Specialist Self-Review

**Decisions made:**
1. **Mirrored the Story 5.1 pattern exactly** for the eap-shrinkage-diagram (SVG with class-attributed shapes + matching CSS file + i18n content keys). The validity-envelope-diagram was the load-bearing precedent; consistency across the diagram component set keeps future maintenance simple.
2. **Tail-aware-trail ships CSS only.** The Story 5.1 / 5.3 deferral pattern: ship the styling surface so Epic 6's result-page composition can render against locked styles; HTML composition is the Epic 6 result-page work. This matches the spec AC-2 explicit deferral.

**Alternatives considered:**
- Embedding the eap-shrinkage SVG inline in `scoring/eap.md` body — deferred per Story 5.3 AC-5 (markdown-subset image-inline support out of scope). The diagram is available as a static asset; Epic 7+ can wire body-inline emission.

**Framework gotchas avoided:**
- No `!important` in either CSS file. CSP-safe — no inline `<style>` in the SVG; all colours come from `.class` selectors styled in the CSS files.
- Token names reused from semantic.css; no new token introductions.

**Areas of uncertainty:**
- The eap-shrinkage diagram is qualitative not quantitative — three pairs of MLE/EAP points at the centre and the two tails. A reviewer with a stronger statistical-visualization opinion may want a more rigorous quantitative rendering. The current version is teachable; rigorous follow-ups land in Epic 6+ if reviewer requests.

**Tested edge cases:**
- 9 new scaffold tests for the Phase-2 surfaces (SVG existence + i18n keys + CSP-safety + size budget + CSS files + index.html wiring + strings.json keys).
- All 21 Story-5.1 tests continue to pass.
- make test 875/874+1skip. lint+build exit 0.

## Auditor Findings (round-1)

### [info] Two deferrals declared in AC-4: tail-aware-trail HTML composition → Epic 6; inline rendering of eap-shrinkage SVG in scoring/eap.md → tracked by Story 5-3 AC-5 (markdown-subset image-inline support). Self-Review correctly notes the qualitative-not-quantitative nature of the eap-shrinkage diagram. Land-as-CSS-surface decision (Karpathy #2 simplicity) properly bounded.


- **Category:** deferred-rendering
