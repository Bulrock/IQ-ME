# Investigation: Epic 13 appears visually unchanged

## Hand-off Brief

1. **What happened.** Epic 13 product CSS/JS is present and served locally, but its glass treatment is visually weak because translucent surfaces are composited over a flat backdrop with the same base color.
2. **Where the case stands.** Concluded with high confidence after verifying served-file hashes and comparing headless-browser screenshots before and after Epic 13.
3. **What's needed next.** Treat this as a visual-design implementation gap: add a meaningful backdrop/layer contrast and a rendered visual acceptance test before calling the redesign complete.

## Case Info

| Field | Value |
| --- | --- |
| Ticket | N/A |
| Date opened | 2026-06-13 |
| Status | Concluded |
| System | Local repository dev server, Chrome headless, dark system theme |
| Evidence sources | Source code, git history, local HTTP responses, before/after screenshots |

## Problem Statement

User reports that running the local server after Epic 13 completion shows no visual changes.

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| Git history | Available | Epic 13 implementation commit is `09860a5` |
| Local dev server | Available | Current source files were served byte-for-byte |
| Rendered before/after | Available | Captured from pre-Epic commit and current `main` |
| Visual regression tests | Missing | Epic 13 guards are structural source-text checks |

## Timeline of Events

| Time | Event | Source | Confidence |
| --- | --- | --- | --- |
| 2026-06-13 13:40 +0200 | Epic 13 feature commit created | `09860a5` | Confirmed |
| 2026-06-13 | Current and pre-Epic pages rendered locally | Chrome screenshots | Confirmed |

## Confirmed Findings

### Finding 1: Epic 13 changed product code

**Evidence:** Commit `09860a5` changes landing JS, landing/chrome/result/methodology CSS, tokens, and print output.

**Detail:** The landing now emits `.landing-stage` and `.landing__aurora`; the landing hero, chrome, score panel, and methodology masthead reference glass roles.

### Finding 2: The local dev server serves the Epic 13 files

**Evidence:** HTTP response hashes for `src/index.html`, `src/css/components/landing.css`, and `src/assessment/landing.js` matched their workspace-file hashes.

**Detail:** Stale browser/server output is not the cause in the verified `make dev` reproduction.

### Finding 3: The visible redesign is very small

**Evidence:** Before/after headless Chrome screenshots show the same content, typography, and general composition. The primary visible additions are a centered card outline/shadow and revised button styling.

**Detail:** This is a conservative surface restyle, not a substantial homepage redesign.

### Finding 4: Dark glass composites to the same page color

**Evidence:** `src/css/base.css` puts `--color-surface-base` on `html`; dark mode maps that role to neutral-900 (`#131820`). Dark `--surface-glass` is `rgba(19, 24, 32, 0.72)`, which has the exact same RGB as neutral-900.

**Detail:** Compositing the glass fill over the flat page yields the same visible color. Backdrop blur also has no useful effect over a uniform background.

### Finding 5: Epic 13 acceptance guards do not validate visible output

**Evidence:** `tests/scaffold/13-3-homepage-redesign.test.mjs` and `tests/scaffold/13-4-glass-rollout.test.mjs` explicitly describe themselves as structural-only source-text checks.

**Detail:** They prove that glass token names and `backdrop-filter` appear in CSS, not that users can perceive a redesign.

## Deduced Conclusions

### Deduction 1: The user's observation is accurate

**Based on:** Findings 2, 3, and 4.

**Reasoning:** The correct new code is loaded, but its main visual mechanism collapses over the selected backdrop and preserves nearly all previous layout/content.

**Conclusion:** Epic 13 was implemented technically, but it did not deliver a clearly perceptible visual redesign.

## Hypothesized Paths

### Hypothesis 1: Local server is stale

**Status:** Refuted

**Resolution:** Served-file hashes match current Epic 13 workspace files.

### Hypothesis 2: Epic 13 is primarily a structural/token implementation with insufficient visual validation

**Status:** Confirmed

**Resolution:** Source inspection and before/after rendering show weak visual delta; tests only check source patterns.

## Source Code Trace

| Element | Detail |
| --- | --- |
| Visual origin | `src/css/components/landing.css` glass hero and aurora |
| Trigger | Landing route rendered by `src/assessment/landing.js` |
| Condition | Glass surfaces placed over uniform same-color page backdrop |
| Related files | `src/css/base.css`, `src/css/primitives.css`, `src/css/semantic.css`, chrome/result/masthead component CSS |

## Conclusion

**Confidence:** High

Epic 13 did change source and rendered output, but the redesign is visually ineffective. The central mechanism, translucent glass plus backdrop blur, is applied over a flat backdrop that is identical or nearly identical to the glass RGB, while acceptance tests verify CSS structure rather than perceptible visual change.

## Recommended Next Steps

### Fix direction

Introduce a deliberate page backdrop/layer system that gives glass something visible to blur, increase the decorative contrast within accessibility constraints, and revisit the homepage composition rather than only wrapping the old content in a card.

### Diagnostic

Add before/after screenshots or visual-regression assertions in both light and dark modes, including a minimum perceptual-difference review gate.

## Reproduction Plan

1. Run `make dev`.
2. Render `/` in dark mode.
3. Compare against commit `09860a5^`.
4. Observe that the primary delta is a faint card and button styling while the overall visual composition remains unchanged.
