---
lint-exempt-carry-forward: true
id: 1-10-design-system-foundation-primitives-css-semantic-css-dark-mode-overrides-tokens-spec-ts
title: "Story 1.10: Design System Foundation — primitives.css + semantic.css + dark-mode overrides + tokens.spec.ts"
status: done
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

- [x] **Task 1: Author `src/css/primitives.css`** (AC: 1)
- [x] **Task 2: Author `src/css/semantic.css`** (AC: 2, 3)
- [x] **Task 3: Author `tools/snapshot-update.mjs`** (AC: 6)
  - [x] Stdlib-only (NFR33)
  - [x] Uses Story 1.8's determinism harness for the frozen `generated_at`
  - [x] Sorts file paths before hashing (determinism)
- [x] **Task 4: Author `tests/contract/tokens.spec.mjs`** (AC: 4)
  - [x] Uses `node:test` (not Playwright — this is a contract test, runs in `make test`)
  - [x] Reads `tokens.hash.json` + computes current hash + compares
- [x] **Task 5: Generate `tests/snapshots/tokens.hash.json` via `make snapshot-update`** (AC: 5)
- [x] **Task 6: Add `make snapshot-update` recipe to `Makefile`** (AC: 6)
- [x] **Task 7: Author acceptance tests** (AC: 7)

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

- 74 frozen tests pass; full suite 213/213. Two-layer CSS token architecture (primitives + semantic with dark-mode overrides). tokens.spec.mjs contract test in tests/contract/. make snapshot-update codified D->E exception, idempotent. axe-core contrast verification deferred to Epic 6 (job already stubbed).

### File List

- src/css/primitives.css
- src/css/semantic.css
- tools/snapshot-update.mjs
- tests/contract/tokens.spec.mjs
- tests/snapshots/tokens.hash.json
- tests/scaffold/design-system.test.mjs
- Makefile

## Specialist Self-Review

**Decisions made:**

1. **Token values match the UX spec verbatim** (12 neutral steps, 3 accent + 3 attention, Major-Third type scale anchored at 16px body, 8px spacing scale 1-9, custom-media breakpoints at 600px/1024px). No interpretation — the UX spec is the canonical source and these tokens are the foundation Epics 3/5/6/7 will consume.

2. **Dark-mode declared in BOTH selector forms.** `[data-theme="dark"]` (explicit opt-in for user preference toggle) AND `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` (system pref, when no explicit light opt-out). This matches UX-DR6's "explicit opt-in OR system pref with light opt-out" interaction model.

3. **`tokens.spec.mjs` lives in `tests/contract/`, not `tests/scaffold/`.** Per the story spec convention. Updated `make test` to scan both directories. `tests/scaffold/` is for story-acceptance scaffolding; `tests/contract/` is for contract assertions that protect ongoing invariants.

4. **`make snapshot-update` is the codified D→E exception.** Per Story 1.9's domain map: `tools/snapshot-update.mjs` writes into `tests/snapshots/`. This is the project's single sanctioned D→E write boundary, target-gated and idempotent.

5. **AC-3's axe-core / pa11y contrast assertion is DEFERRED to Epic 6.** Running axe-core / pa11y requires a real browser and a fixture page. Both are scope-creep for Story 1.10. The `axe-core-pa11y` job is already stubbed in `pr-checks.yml` (from Story 1.6) with `# Activates in Epic 6`. AC-3 structural check (selectors + token mappings present) is satisfied; the runtime contrast verification fires in Epic 6.

**Alternatives considered:**

- *Inline `:root` dark overrides via `light-dark()` CSS function* — would collapse the two selector forms into one. But `light-dark()` is Baseline 2024, not yet universal; the explicit two-selector form has zero compatibility risk and matches UX-DR6's interaction model precisely.
- *Single combined `tokens.css` instead of `primitives.css` + `semantic.css`* — would lose the two-layer-architecture discipline (UX-DR1). Components could reference primitives directly. The split is **the** load-bearing structural choice; merging the files would silently re-enable that footgun.
- *Compute hash over more files (e.g. `src/css/**/*.css`)* — would couple component CSS (not yet authored, lands in Epic 3) to the token contract. The snapshot specifically captures the **token foundation**; component CSS evolves independently.

**Framework gotchas avoided:**

- `JSON.stringify(snapshot, null, 2) + "\n"` — without the trailing newline, the file would not match POSIX text-file convention; editors might silently add one and break byte-identical determinism. With it, `make snapshot-update` twice produces identical output.
- The hash is over **content bytes** of the two CSS files concatenated in **path-sorted** order. If a future PR adds a third file to the contract, the sort order keeps the hash deterministic across filesystems.
- `@custom-media` rules are CSS Working Draft (level 5); not all CSS parsers accept them. Used because UX-DR5 calls for them; future ESLint/CSSLint passes may need to whitelist. Not enforced by the spec test (only structural-presence check).
- The dark-mode override block uses `var(--color-neutral-100)` etc., which references the primitive layer — the cascade reads primitives → light semantics → dark semantics override. CSS spec guarantees this works.

**Areas of uncertainty:**

- The UX spec lists "Spacing scale 1-12" in its narrative (`--space-12`); the v1 starting palette excerpt shows only `--space-1` through `--space-9`. Kept the 9-step set per the canonical excerpt; if Epic 6's tail-scene needs `--space-10/11/12`, a follow-up PR can extend the scale without breaking the hash contract (until `make snapshot-update` is rerun).
- The `[data-theme="dark"]` selector requires a runtime mechanism to set `data-theme` on the `<html>` element. That mechanism (theme toggle component) lands in Epic 6. Pre-Epic-6 behavior: `@media (prefers-color-scheme: dark)` runs unconditionally (since `:root:not([data-theme="light"])` matches when no `data-theme` is set at all).
- The hash `2f30f4d1f2ecf6fe032ade735322d23977e0e8add765086d6caa1fc57f0facd8` is locked in; any unintentional whitespace edit in the CSS files breaks the contract. Drift requires explicit `make snapshot-update`. This is the **intent** — accidental edits are caught.

**Tested edge cases:**

- All 74 frozen tests pass (12 neutral + 3 accent + 3 attention color tokens × 1 check + 8 type-scale + 9 spacing + 2 font-families + 3 line-heights + breakpoints + 16 light semantic mappings + 6 dark mappings + dark-mode selectors + snapshot shape + snapshot hash match + `make snapshot-update` idempotency); full suite 213/213.
- `make snapshot-update` twice produces byte-identical `tests/snapshots/tokens.hash.json` (verified by AC-6 test).
- Snapshot hash equals the SHA-256 of the actual files at HEAD (AC-5 test).
- Both `[data-theme="dark"]` AND `@media (prefers-color-scheme: dark)` selectors present in `semantic.css`.
- All 16 required light-mode semantic mappings present + all 6 required dark-mode re-mappings.
- Contract test in `tests/contract/tokens.spec.mjs` runs under `make test` (after target was extended to scan `tests/contract/**/*.spec.mjs`).
