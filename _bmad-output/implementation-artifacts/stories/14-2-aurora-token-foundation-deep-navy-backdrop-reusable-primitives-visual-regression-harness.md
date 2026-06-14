---
id: 14-2-aurora-token-foundation-deep-navy-backdrop-reusable-primitives-visual-regression-harness
title: "Story 14.2: Aurora token foundation, deep-navy backdrop, reusable primitives & visual-regression harness"
status: in-progress
---

# Story 14.2: Aurora token foundation, deep-navy backdrop, reusable primitives & visual-regression harness

## Story

As a **front-end engineer implementing the Aurora redesign**,
I want **a deep-navy spatial backdrop, replaced Aurora token values plus new semantic glow/accent roles, reusable Aurora surface/focus/interaction primitives, and a Playwright visual-regression + print/PDF harness wired (but pre-stubbed off) in CI**,
so that **glass surfaces have real contrast to blur against (fixing the Epic 13 root failure), and every later Aurora story has a rendered-verification safety net it can flip on without re-pinning architecture or budgets**.

## Acceptance Criteria

1. **Deep-navy backdrop layer (PR-18).** Introduce the deep-navy spatial backdrop as page-level CSS in `base.css` driven by NEW semantic role tokens (`--backdrop-base`, aurora glow/grid roles) in `semantic.css` resolving to NEW Aurora primitive VALUES in `primitives.css`, dark authored separately (not auto-inverted) for both `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`. Two-layer architecture preserved (`base.css`/components reference ONLY semantic roles, never `--glass-*`/`--color-*` primitives). The backdrop stays decorative below any text-contrast layer (WCAG 2.2 AA unaffected) — the `html`/`body` `background-color: var(--color-surface-base)` theme contract is left intact (asserted by the chrome-components spec).

2. **Replaced glass VALUES, names intact (PR-18).** Replace the dark `--surface-glass*` values (and retune `--glass-edge`/`--glass-shadow`) with Aurora values tuned to read against the deep-navy backdrop — only VALUES change; token NAMES and the `semantic.css` role-token indirection stay intact so all component CSS keeps consuming the same semantic roles unchanged. The contrast guarantee remains the fill alpha (≥0.72 standard / ≥0.88 strong) + solid fallback — never the blur (SC 1.4.3 independent of backdrop).

3. **Reusable Aurora primitives (PR-19).** Add reusable Aurora surface/focus/interaction primitives (new `src/css/components/aurora.css`) consuming ONLY semantic Aurora roles; the `@supports not (backdrop-filter)` solid fallback path stays valid; focus styling builds on the existing `:focus-visible` token contract (`base.css:126-129`); motion gated by the global `prefers-reduced-motion` net (`base.css:140-149`).

4. **CSS budget + byte-stable (PR-18).** New `src/css/components/**` lines stay within the `css-components-lines` 2300 limit (measured + accounted in File List). Deterministic byte-stable build (NFR21) and the alphabetical CSS `<link>` chain in `index.html` preserved (aurora.css inserted alphabetically; zero inline `<style>`; NFR6/NFR7 CSP). Token VALUE change refreshed via the codified `make snapshot-update` D→E exception (tokens.hash.json).

5. **Visual-regression + print/PDF harness (PR-19).** Add a Playwright spec scaffold under `tests/playwright/` capturing backdrop+glass surfaces across the 320→1440 width band in light+dark plus a print/PDF render leg, and add a `make snapshot-update-visual` target (registered in `.PHONY`) to regenerate committed baselines on `ubuntu-latest`. Harness runs against the local SPA only (NFR6); documented `maxDiffPixelRatio` tolerance (~1–2%).

6. **Deferred CI job + discipline (PR-19).** Pre-stub a single `visual-regression` job in `pr-checks.yml` with `if: false` + a `# Activates in Epic 14` comment running the new spec on `ubuntu-latest` (dormant; Story 14.11 flips it on — the documented exception). Register the new job name in the `ALL_JOBS` list in `ci-matrix.test.mjs` so the discipline test governs it; the stub satisfies the ci-matrix scaffold contract (2-space indent, `if: false`, `# Activates in` comment) and disturbs no Epic-1-active job.

**Requirements covered:** PR-18, PR-19
**Depends on:** 14.1

## Tasks / Subtasks

- [ ] **Task 1: Aurora primitives + backdrop/glass token VALUES (AC: 1, 2)**
  - [ ] Add Aurora backdrop/aurora/grid primitive VALUES to `primitives.css` (deep-navy + light pale analogs + bounded glows ≤0.18 + grid ≤0.06)
  - [ ] Add new `--backdrop-*` semantic roles in `semantic.css` :root (light) + both dark blocks; retune dark `--surface-glass*`/`--glass-edge`/`--glass-shadow` values (lighter band) so a panel reads as raised over the navy
  - [ ] Paint the deep-navy + aurora backdrop in `base.css` `body` via `background-image` layers, leaving `background-color: var(--color-surface-base)` intact
- [ ] **Task 2: Reusable Aurora primitives component (AC: 3, 4)**
  - [ ] Create `src/css/components/aurora.css` (aurora surface variant + shared visible-focus class + interaction hook; semantic-roles-only; `@supports not` fallback; reduced-motion-gated)
  - [ ] Insert the `aurora.css` `<link>` in `index.html` alphabetically (first in the components chain) — keep lint-css-link-order green
  - [ ] Measure `src/css/components/**` LOC; confirm ≤2300; record in File List
- [ ] **Task 3: Visual-regression + print/PDF harness (AC: 5)**
  - [ ] Add `tests/playwright/aurora-visual-regression.spec.mjs` (toHaveScreenshot across 320→1440, light+dark, + print leg; local SPA only; documented maxDiffPixelRatio)
  - [ ] Add `make snapshot-update-visual` target + register in `.PHONY`
- [ ] **Task 4: Deferred CI job + ci-matrix registration (AC: 6)**
  - [ ] Add the dormant `visual-regression` job to `pr-checks.yml` (`if: false` + `# Activates in Epic 14`)
  - [ ] Register `visual-regression` in `ALL_JOBS` in `tests/scaffold/ci-matrix.test.mjs` (cross-story frozen-test edit owned by 1-6 → re-record/accept integrity)
- [ ] **Task 5: Snapshot refresh + verification (AC: 4)**
  - [ ] Run `make snapshot-update` (tokens.hash.json D→E refresh); commit the snapshot diff
  - [ ] Run the node-based frozen guards green (tokens contract, ci-matrix discipline, cognitive-load-budget, byte-stable) + the new 14-2 scaffold guard

## Dev Notes

### Implementation strategy (risk-minimizing)
- **Do NOT change `--color-surface-base` or the `html`/`body` `background-color` bindings** — the chrome-components Playwright spec asserts the `--color-surface-base` swap is the theme contract. Paint the deep-navy + aurora via `body { background-image: ... }` layers (a solid `--backdrop-base` linear-gradient as the bottom layer + bounded radial aurora glows on top). In dark `--backdrop-base` resolves to the deep navy (opaque); in light to a cool pale. Computed `background-color` is unchanged → frozen computed-style tests stay green.
- Token NAMES + the `semantic.css` indirection are unchanged; only VALUES change + NEW roles added. The 13-x frozen DOM/computed-style tests (co-equal triplet, reveal-stage, chrome) read NAMES/DOM, not token VALUES → safe. The only sanctioned snapshot change is `tokens.hash.json` via `make snapshot-update`.
- `aurora.css` is alphabetically FIRST in the components chain (a < chrome) — insert right after `base.css`, before `chrome-footer.css`.

### Current state (cite, change only VALUES/new roles)
- Glass primitives: `primitives.css:104-128` (blur 6/12/20; light fills). Motion primitives 121-128.
- Semantic glass roles: `semantic.css:66-72`; dark overrides `semantic.css:99-103` + system-pref `120-124` (raw rgba inline — retune these).
- Backdrop today: `base.css:25-37` accent-glow `body` block (REPLACE with the Aurora backdrop).
- `.glass-surface` + `@supports` fallback: `src/css/components/glass-surface.css`.
- ci-matrix: `ALL_JOBS` `ci-matrix.test.mjs:22-64`; AC-3 deferred-job contract `202-221`. Currently all ALL_JOBS are active, so `visual-regression` becomes the sole deferred job (must carry `if: false` + `# Activates in Epic 14`).
- Snapshot: `make snapshot-update` → `tools/snapshot-update.mjs` recomputes `tests/snapshots/tokens.hash.json` from primitives+semantic. Contract: `tests/contract/tokens.spec.mjs`.
- CSS budget: `BUDGETS.json css-components-lines` = 2300 (measured ~1805 at Epic 11); aurora.css must fit.

### Carry-forward lessons
- lesson-2026-05-20-007 (severity=high): stories touching class-A frozen tests must carry this section + re-record integrity. Apply: editing `ci-matrix.test.mjs` (class-A, owned by 1-6) drifts its hash — re-record via `tds integrity record`/`accept` and re-verify after the session sweep.
- lesson-2026-05-19-013 (severity=high): direct state-manifest edits get re-recorded by the sweep. Apply: never hand-edit the manifest; use `tds integrity record`; re-grep after sweep.
- lesson-2026-06-03-001 (severity=high): `pr-checks.yml` wires Playwright specs per-spec, no greedy glob. Apply: the `visual-regression` job explicitly runs `tests/playwright/aurora-visual-regression.spec.mjs`; it stays `if: false` until 14.11.
- lesson-2026-06-03-002 (severity=high): verify provenance with a baseline diff. Apply: any "pre-existing red" claim must be backed by `git diff main`; the 2 known pre-existing integrity drifts (9e-1, pr7) are out of scope.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-14.2] (lines ~2909-2948)
- [Source: _bmad-output/planning-artifacts/aurora-glass-observatory-design-direction.md] — §2 backdrop/layering, §4 budgets (the values this story implements)

## Dev Agent Record

### Agent Model Used

frontend

### Debug Log References

### Completion Notes List

### File List
