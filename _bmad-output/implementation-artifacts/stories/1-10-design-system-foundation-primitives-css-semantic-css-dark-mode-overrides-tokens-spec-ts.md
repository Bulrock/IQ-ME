---
id: 1-10-design-system-foundation-primitives-css-semantic-css-dark-mode-overrides-tokens-spec-ts
title: "Story 1.10: Design System Foundation — primitives.css + semantic.css + dark-mode overrides + tokens.spec.ts"
status: ready-for-dev
---

# Story 1.10: Design System Foundation

## Story

As a **future Epic 3 / 5 / 6 / 7 author rendering UI components**,
I want **the two-layer CSS token architecture (UX-DR1), color palette (UX-DR2), Major-Third type scale (UX-DR3), 8px spacing scale (UX-DR4), responsive breakpoints (UX-DR5), and dark-mode overrides (UX-DR6) to be authored and locked at end-of-Epic-1 BEFORE any component CSS lands in Epic 3**,
so that **components consume tokens (not reverse-engineer them from happy-path needs per Sally's load-bearing finding) and Mikhail's tail-scene in Epic 6 doesn't discover the semantic palette has no `--color-care-warm` because nobody knew to pin it**.

## Acceptance Criteria

1. **AC-1 (`src/css/primitives.css` exists with the UX-DR2/3/4/5 primitives):** authored at this path, declares (literal values from UX spec):
   - **Neutral scale** `--color-neutral-0` (`#ffffff`) through `--color-neutral-1000` (`#0a0d12`) — 12 steps (0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)
   - **Accent** `--color-accent-300` (`#6d84a8`), `-500` (`#2f4a78`), `-700` (`#1e2e4a`)
   - **Attention** `--color-attention-300` (`#d6b06c`), `-500` (`#a87925`), `-700` (`#6e4c10`)
   - **Type scale** `--font-size-100` (`0.8rem`) through `--font-size-800` (`3.815rem`)
   - **Spacing** `--space-1` (`0.25rem`) through `--space-9` (`6rem`)
   - **Breakpoints** as `@custom-media --bp-tablet (min-width: 600px)` + `--bp-desktop (min-width: 1024px)`
   - **Font families** `--font-family-sans` + `--font-family-mono` (system stack only — per UX spec, no external fonts; reinforced by Story 1.6's `lint-no-external-font`)
   - **Line heights** `--line-height-tight: 1.15`, `--line-height-base: 1.5`, `--line-height-prose: 1.65`

2. **AC-2 (`src/css/semantic.css` exists with role-mapped tokens):** authored at this path; light-mode mappings at `:root`. MUST include at minimum:
   - `--color-text-body: var(--color-neutral-900)`
   - `--color-text-muted: var(--color-neutral-600)`
   - `--color-text-link: var(--color-accent-500)`
   - `--color-text-link-hover: var(--color-accent-300)`
   - `--color-text-link-active: var(--color-accent-700)`
   - `--color-text-link-disabled: var(--color-neutral-400)`
   - `--color-surface-base: var(--color-neutral-0)`
   - `--color-surface-elevated: var(--color-neutral-50)`
   - `--color-surface-attention: var(--color-attention-300)`
   - `--color-rule-divider: var(--color-neutral-200)`
   - `--color-rule-strong: var(--color-neutral-400)`
   - `--color-focus-ring: var(--color-accent-500)`
   - `--color-text-attention-body: var(--color-attention-700)`
   - `--space-prose-paragraph-gap: var(--space-4)`
   - `--space-section-gap: var(--space-7)`
   - `--space-score-triplet-gap: var(--space-5)`
   - Uses CSS Custom Properties only (no preprocessor) — already implicit per NFR21.

3. **AC-3 (dark-mode overrides):** `semantic.css` includes BOTH `[data-theme="dark"]` AND `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` selectors with re-mapped roles (at minimum):
   - `--color-text-body: var(--color-neutral-100)`
   - `--color-text-muted: var(--color-neutral-400)`
   - `--color-surface-base: var(--color-neutral-900)`
   - `--color-surface-elevated: var(--color-neutral-800)`
   - `--color-rule-divider: var(--color-neutral-700)`
   - `--color-text-link: var(--color-accent-300)`

4. **AC-4 (`tests/contract/tokens.spec.mjs` exists):** computes SHA-256 over `primitives.css` + `semantic.css` (concatenated, sorted by path for determinism), compares to `tests/snapshots/tokens.hash.json`. On hash mismatch → test fails with a message including BOTH hashes and a hint about `make snapshot-update`.

5. **AC-5 (initial snapshot committed):** `tests/snapshots/tokens.hash.json` is committed with shape `{ "primitives_semantic_sha256": "<64-hex>", "generated_at": "1970-01-01T00:00:00.000Z" }`. The `generated_at` is frozen (uses Story 1.8's `DETERMINISM.FROZEN_TIMESTAMP_ISO`). The hash equals the actual SHA-256 at HEAD — produced by `make snapshot-update`.

6. **AC-6 (`make snapshot-update` target):** updates `tests/snapshots/tokens.hash.json` (and is the codified D→E exception from Story 1.9's domain map). Recipe runs `node tools/snapshot-update.mjs`. The script recomputes the hash + rewrites the snapshot. Idempotent — running twice in a row produces the same file.

7. **AC-7 (acceptance tests):** `tests/scaffold/design-system.test.mjs` verifies:
   - both CSS files exist
   - primitives.css contains every required token name (regex grep)
   - semantic.css contains every required light-mode mapping
   - semantic.css contains both dark-mode selectors with required overrides
   - `tokens.spec.mjs` exists at the contract path + parses
   - `tests/snapshots/tokens.hash.json` exists and matches current files' SHA-256
   - `make snapshot-update` is idempotent

## Tasks / Subtasks

- [ ] **Task 1: Author `src/css/primitives.css`** (AC: 1)
- [ ] **Task 2: Author `src/css/semantic.css`** (AC: 2, 3)
- [ ] **Task 3: Author `tools/snapshot-update.mjs`** (AC: 6)
  - [ ] Stdlib-only (NFR33)
  - [ ] Uses Story 1.8's determinism harness for the frozen `generated_at`
  - [ ] Sorts file paths before hashing (determinism)
- [ ] **Task 4: Author `tests/contract/tokens.spec.mjs`** (AC: 4)
  - [ ] Uses `node:test` (not Playwright — this is a contract test, runs in `make test`)
  - [ ] Reads `tokens.hash.json` + computes current hash + compares
- [ ] **Task 5: Generate `tests/snapshots/tokens.hash.json` via `make snapshot-update`** (AC: 5)
- [ ] **Task 6: Add `make snapshot-update` recipe to `Makefile`** (AC: 6)
- [ ] **Task 7: Author acceptance tests** (AC: 7)

## Dev Notes

### CSS file structure

Both files belong to **Domain A** (per Story 1.9's domain map — `src/css/**` is part of the SPA bundle). They're CSS, not JS, so ESLint's `no-restricted-imports` doesn't see them. They're consumed by `src/index.html` via `<link rel="stylesheet">` chains (deferred until Epic 3 lands the SPA scaffold).

### `tokens.spec.mjs` location: `tests/contract/`, not `tests/scaffold/`

The story-spec uses `tests/contract/tokens.spec.mjs` (per the UX-DR / snapshot-test convention). Create that dir if it doesn't exist. The test runs under `make test` via `node --test 'tests/**/*.test.mjs'` or similar — adjust the Makefile `test` target if needed (it currently scans `tests/scaffold` + `tests/unit`).

Actually — the Makefile `test` target was updated in Story 1.7 to scan only `tests/scaffold` + `tests/unit`. To include `tests/contract`, we need to update the target. Alternatively, the `tokens.spec.mjs` can be moved to `tests/scaffold/tokens.spec.mjs`. **Choose:** keep it at `tests/contract/tokens.spec.mjs` per the story's intent AND update the Makefile `test` to scan `tests/{scaffold,unit,contract}`. Documents the contract location.

### `make snapshot-update` is THE codified D→E exception

From Story 1.9: `tools/snapshot-update.mjs` writes into `tests/snapshots/`. This is the project's single D→E write boundary; documented in `docs/domain-map.md` as the codified exception. Don't add other D→E writes without an ADR.

### `tokens.hash.json` shape

```json
{
  "primitives_semantic_sha256": "<64-hex>",
  "generated_at": "1970-01-01T00:00:00.000Z"
}
```

The `generated_at` is frozen at Story 1.8's `DETERMINISM.FROZEN_TIMESTAMP_ISO`. Real timestamps would create unnecessary churn in snapshot diffs.

### How the hash is computed

```js
// snapshot-update.mjs + tokens.spec.mjs share this:
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const files = [
  resolve(REPO_ROOT, "src/css/primitives.css"),
  resolve(REPO_ROOT, "src/css/semantic.css"),
].sort();   // path-sorted for determinism
const hash = createHash("sha256");
for (const f of files) hash.update(readFileSync(f));
const sha = hash.digest("hex");
```

Note: this differs from Story 1.8's `hashTree` because we want a hash of just these two files, not a recursive tree walk. Story 1.10's `tokens.spec.mjs` can call this inline.

### `axe-core / pa11y` for AC contrast verification — DEFER

AC-3 mentions "axe-core / pa11y verify WCAG 2.2 AA contrast in both themes against a fixture page". That requires a real DOM + browser — too heavy for this story. **Defer the axe-core check to Epic 6's `axe-core-pa11y` job** (already stubbed in pr-checks.yml from Story 1.6). For Story 1.10, AC-3 is satisfied by the structural check (selectors + token mappings present). Document this explicitly in `## Specialist Self-Review`.

### Project Structure Notes

- New files:
  - `src/css/primitives.css`
  - `src/css/semantic.css`
  - `tests/contract/tokens.spec.mjs`
  - `tests/snapshots/tokens.hash.json`
  - `tools/snapshot-update.mjs`
  - `tests/scaffold/design-system.test.mjs`
- Modified files:
  - `Makefile` — add `snapshot-update` recipe; extend `test` target to include `tests/contract/`

### References

- Story spec — [epics.md#L706-L741](_bmad-output/planning-artifacts/epics.md#L706-L741)
- UX design — [ux-design-specification.md#L490-L900](_bmad-output/planning-artifacts/ux-design-specification.md#L490-L900)
- Story 1.8 determinism harness — `tools/determinism-harness.mjs`
- Story 1.9 domain-map — `docs/domain-map.md` (codifies the D→E `make snapshot-update` exception)
- NFR21 (no preprocessors) — see [epics.md](_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
