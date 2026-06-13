---
id: 12-3-short-full-variant-engine-geometric-test
title: "Story 12-3: Short/Full variant engine for the geometric matrix-reasoning test"
status: in-progress
---

# Story 12-3: Short/Full variant engine for the geometric matrix-reasoning test

## Story

As a user who picked the geometric test (PR-15),
I want a longer "full" variant in addition to the existing short 16-item screen,
so that I can get a more thorough estimate when I want one.

## Epic context

Implements the variant ENGINE for the geometric methodology selected in Story 12-2. Introduces a small `methodology-registry.js` mapping `(methodology, variant) → {poolUrl, sessionSize}`, consumed by both `item-runner.js` (session start) and `result.js` (scoring + completeness guard). The existing 16-item `item-parameters.json` stays the geometric **short** pool (its frozen contracts — `items.length===16`, 5/6/5 bands — are untouched). A new `item-parameters-geometric-full.json` (24 items, wider difficulty spread) is the **full** pool, scored through the SAME deterministic `scoreSession` + `selectSession` (FR7 seeding preserved; golden-vector parity holds per variant because the engine is parameterized by the item set). The result page communicates which methodology + variant produced the estimate.

## Acceptance Criteria

**Given** the selection from Story 12-2 (`item-selection.js` / `item-runner.js` / `src/scoring/irt/*`),
**When** the user picks short vs full,
**Then** the item set, item-count, progress indicator, and scoring adapt to the chosen variant while preserving the deterministic seeding (FR7) and the auditable scoring path (golden-vector parity still holds for each variant), and the result page communicates which methodology + variant produced the estimate.
1. A new `src/assessment/methodology-registry.js` exports a pure resolver `resolveVariant(methodology, variant)` → `{ poolUrl, sessionSize, methodology, variant }`, defaulting to geometric+short (`/src/items/item-parameters.json`, 16) when methodology/variant are absent (so existing behavior + frozen contracts are unchanged).
2. `item-runner.js` resolves `{poolUrl, sessionSize}` from `getState().methodology/variant` via the registry, fetches that pool, runs `selectSession(pool.items, seed, sessionSize)`, and uses the resolved sessionSize for the heading/progress templates, isLast, and the Submit-finalize unanswered-pad loop (no hardcoded 16).
3. `result.js` resolves the same `{poolUrl, sessionSize}` from state, fetches that pool for scoring + difficulty counts, and uses the resolved sessionSize in the completeness guard (`responses.length !== sessionSize`) instead of a hardcoded 16. Scoring still flows through `scoreSession({responses, itemParameters: pool.items, normingStats})` unchanged.
4. A new `src/items/item-parameters-geometric-full.json` provides the full geometric variant: 24 items (schema-valid per `corpus/item-parameters.schema.json`), wider difficulty spread than the 16-item short pool, with SVG assets that exist (reuse the existing stub SVGs where ids map, add new ones if needed). The existing `item-parameters.json` (short, 16 items, frozen 5/6/5 contract) is NOT modified.
5. The result page communicates the methodology + variant that produced the estimate (a small, localized line on the result/score panel), via a new i18n key (mirrored EN/RU/PL).
6. Deterministic seeding (FR7) and golden-vector parity are preserved: `selectSession`/`scoreSession` are unchanged (parameterized by the item set); the existing 16-item golden + parity tests stay green (they are not pinned to a single pool / are synthetic-fixture-based). A new contract guard validates the full pool against the schema. The `item-selection.js` `pool.length > sessionSize` subset path is exercised by the full variant.
7. Guards: a scaffold guard (`tests/scaffold/12-3-variant-engine.test.mjs`) asserting the registry resolver defaults + variant mapping, the full pool's schema validity + size, item-runner/result reading sessionSize from the registry (no remaining hardcoded `SESSION_SIZE = 16` literal that ignores the variant), and the result methodology/variant line. RED before impl, GREEN after.
8. `make lint` exit 0, `make build` exit 0, `make test` green (modulo pre-existing 9-series reds). The frozen 16-item contracts + golden parity stay green.

## Tasks / Subtasks

- [ ] **Task 1: author the guard** (`tests/scaffold/12-3-variant-engine.test.mjs`) encoding AC 7. Confirm RED. (test-author phase)
- [ ] **Task 2: methodology-registry** — `src/assessment/methodology-registry.js` pure `resolveVariant()` with geometric short/full (+ letter-number entries reserved for 12-4), default geometric+short. (impl phase)
- [ ] **Task 3: full geometric pool** — `src/items/item-parameters-geometric-full.json` (24 schema-valid items, wider spread, existing SVG assets). (impl phase)
- [ ] **Task 4: variant-aware item-runner** — resolve poolUrl + sessionSize from state via the registry; remove hardcoded 16 in heading/progress/isLast/finalize. (impl phase)
- [ ] **Task 5: variant-aware result** — resolve poolUrl + sessionSize from state; completeness guard uses sessionSize; add the localized methodology/variant line (i18n EN/RU/PL). (impl phase)
- [ ] **Task 6: verification** — guard GREEN, frozen 16-item + golden parity GREEN, `make lint`/`make build` exit 0, `make test` green. (integration phase)

## Dev Notes

- **`scoreSession` is already parameterized** by `itemParameters` — no scoring-engine change. `selectSession` already documents the `pool.length > sessionSize` subset path (item-selection.js lines 22-23/37) — the full pool (24) with sessionSize 24 exercises permute-all; a future adaptive subset would slot here. For 12-3 the full variant uses sessionSize === pool size (24) so it's a permute-all like short.
- **Do NOT modify `item-parameters.json`** (16 items) — its `items.length===16` + 5/6/5 band contracts are frozen. Add the full pool as a sibling file.
- **Default-safe:** when state has no methodology/variant (e.g. a user who never hit the selection scene, or a resumed pre-12-2 session), `resolveVariant` returns geometric+short — identical to today. This keeps every existing test green.
- **Golden parity:** `tests/unit/golden/parity-audit.test.mjs` uses synthetic temp fixtures; `tests/golden/vectors.json` is θ-range based, not pool-pinned. New pool ⇒ no parity regression. (A dedicated full-pool golden set is optional future work, not required here.)
- **Result line:** keep it short + honest ("Geometric matrix reasoning · Full"), localized; do not imply a credential.

### Carry-forward lessons

- Corpus-edit parity cascade (project memory): no methodology corpus body touched (the registry + pool are src/items + src/assessment); NFR27 does not fire here (12-5 handles corpus).
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`. Apply: new guard runs via `make test`.
- Draft RU/PL translations (project memory): the new methodology/variant result line's RU/PL are agent-drafted (gated posture).

### Project Structure Notes

- New: `src/assessment/methodology-registry.js`, `src/items/item-parameters-geometric-full.json`, `tests/scaffold/12-3-variant-engine.test.mjs`, possibly new SVG assets under `src/items/`.
- Modified: `src/assessment/item-runner.js`, `src/assessment/result.js`, `src/content/i18n/{en,ru,pl}/strings.json` (result methodology/variant line). Possibly `BUDGETS.json` (app-modules within the Epic-12 ceiling).
- NOT modified: `src/items/item-parameters.json`, `src/scoring/irt/*`, frozen contracts on the 16-item pool.

### References

- [Source: _bmad-output/planning-artifacts/methodology-landscape-research.md §3 variant design]
- [Source: src/scoring/irt/index.js] (scoreSession parameterized by itemParameters)
- [Source: src/assessment/item-selection.js] (pool.length > sessionSize subset path)
- [Source: corpus/item-parameters.schema.json] (the pool schema the full variant must satisfy)

## Dev Agent Record

### Agent Model Used

frontend (vanilla JS SPA + item pool; scoring engine unchanged)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
