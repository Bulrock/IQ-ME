---
id: 12-4-first-additional-non-geometric-methodology-vertical-slice
title: "Story 12-4: First additional (non-geometric) methodology — end-to-end vertical slice"
status: in-progress
---

# Story 12-4: First additional (non-geometric) methodology — end-to-end vertical slice

## Story

As a user wanting a non-geometric option (PR-15),
I want at least one researched non-geometric methodology fully playable end-to-end (select → items → score → result),
so that IQ-ME is no longer limited to matrix reasoning.

## Epic context

Implements the top-recommended non-geometric methodology from Story 12-1: **ICAR Letter & Number Series (ICAR-LN)** — an inductive-reasoning task over digit/letter sequences, chosen for locale-robustness (language-neutral content) and lowest implementation cost. It runs end-to-end through the EXISTING flow because Story 12-3 already made item-runner + result variant-aware via the methodology-registry (the `letter-number` entries already point at the pool URLs this story creates). This story ships the **item pools** (short + full), their **SVG assets** (language-neutral series rendered as SVG, reusing the existing `<img>` pipeline — no schema change), a **difficulty-bands** file, and the **selection-scene wiring** so picking "letter-number" plays end-to-end. It carries the same anti-credentialization / not-a-clinical-assessment posture.

## Acceptance Criteria

**Given** the top-recommended non-geometric methodology from Story 12-1,
**When** it is implemented,
**Then** it runs end-to-end through the existing flow (selection → item runner → scoring → result) in short and full variants, with sourced items and a scoring approach appropriate to its construct, carrying the same anti-credentialization posture.
1. Two schema-valid item pools exist: `src/items/item-parameters-letter-number.json` (short, 12 items) and `src/items/item-parameters-letter-number-full.json` (full, 20 items), each validating against `corpus/item-parameters.schema.json` (id/a/b/asset/options/correct; b∈[-10,10]; a≥0; poolSize===items.length). The full pool is a superset spread of the short with a wider difficulty range.
2. Every referenced SVG asset exists on disk under `src/items/`: a prompt SVG per item showing a digit/letter series with a missing term (language-neutral), and 6 option SVGs per item, with `correct` ∈ `options`. Assets are pure inline SVG (no third-party, byte-stable, deterministic).
3. The methodology is scored by the SAME dichotomous IRT engine (`scoreSession`) — no scoring-engine change. Selecting `letter-number` + short/full in the selection scene (Story 12-2) plays end-to-end: item-runner fetches the LN pool (via the registry, Story 12-3), presents the items, scores 0/1 against `correct`, and the result page renders with the LN methodology/variant line.
4. A difficulty-bands file for the LN short pool (`src/items/item-difficulty-bands-letter-number.json`) is provided OR the result path degrades gracefully (per-difficulty line shows only mapped ids) — the score triplet + SE are correct regardless. (Bands are derived deterministically from the pool's b-values, byte-stable.)
5. Anti-credentialization posture preserved: the LN methodology carries the same caveat/disclaimer/not-a-clinical-assessment framing as geometric (the result panel + caveat strings are methodology-agnostic; the methodology/variant line names "Letter and number series" honestly, no credential implication).
6. Guards: a scaffold guard (`tests/scaffold/12-4-letter-number.test.mjs`) asserting both LN pools are schema-valid with correct sizes + all assets exist + correct∈options + wider full spread, the registry routes letter-number to these pools, and the LN result-line keys exist (added in 12-3). RED before impl, GREEN after.
7. `make lint` exit 0, `make build` exit 0, `make test` green (modulo pre-existing 9-series reds). The geometric pools + golden parity stay green (the LN pool is additive).

## Tasks / Subtasks

- [ ] **Task 1: author the guard** (`tests/scaffold/12-4-letter-number.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [ ] **Task 2: generate LN SVG assets** — prompt SVGs (series with a blank) + option SVGs (candidate terms), language-neutral, byte-stable, under src/items/. (impl phase)
- [ ] **Task 3: author the LN pools** — short (12) + full (20) `item-parameters-letter-number*.json`, schema-valid, calibrated b-spread, correct∈options. (impl phase)
- [ ] **Task 4: difficulty bands** — derive `item-difficulty-bands-letter-number.json` from the short pool (deterministic) OR confirm graceful degradation; register in license-scope-map. (impl phase)
- [ ] **Task 5: verify end-to-end** — selecting letter-number short/full plays select→items→score→result; registry routing exercised; result LN line renders. (impl phase)
- [ ] **Task 6: verification** — guard GREEN, geometric + golden parity GREEN, `make lint`/`make build` exit 0, `make test` green. (integration phase)

## Dev Notes

- **No scoring-engine change** — `scoreSession` is parameterized; the LN pool flows through it. **No item-runner/result change** — Story 12-3 already routes pool+sessionSize by methodology+variant via the registry; the registry's `letter-number` entries already name these pool URLs.
- **SVG-rendered series, not text items** — keeps the EXISTING `item-parameters.schema.json` (which requires an `.svg` asset) unchanged and reuses the item-runner `<img>` rendering. The series CONTENT is language-neutral (digits/letters), satisfying the 12-1 locale-robustness rationale without a schema migration.
- **b-spread**: short LN pool spans a moderate range; full LN spans wider (for tighter SE), analogous to the geometric short/full relationship.
- **License scope**: the LN pools are ICAR-derived → covered by the `item-parameters*.json` glob already widened in Story 12-3 (CC-BY-NC-SA). The new bands file matches `item-difficulty-bands*.json`. SVG assets match `src/items/*.svg`.
- **Anti-credentialization**: do not add any LN-specific copy implying a credential; reuse the methodology-agnostic caveat/disclaimer. The honest methodology name comes from the 12-3 `method_letter-number` i18n key.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): no fabricated specifics. Apply: LN items are clearly marked stub/illustrative series (real calibrated ICAR-LN items land at the license gate, like the geometric stub pool); the pool `_note` states this.
- Corpus-edit parity cascade (project memory): no methodology corpus body touched here (12-5 authors the LN description page); NFR27 doesn't fire in 12-4.
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`. Apply: guard runs via `make test`.

### Project Structure Notes

- New: `src/items/item-parameters-letter-number.json`, `src/items/item-parameters-letter-number-full.json`, `src/items/item-difficulty-bands-letter-number.json`, LN SVG assets under `src/items/`, `tests/scaffold/12-4-letter-number.test.mjs`.
- Modified (if needed): `docs/license-scope-map.md` (already glob-widened in 12-3 — verify), possibly nothing else (registry + flow already variant-aware).
- NOT modified: `src/scoring/irt/*`, geometric pools, frozen contracts.

### References

- [Source: _bmad-output/planning-artifacts/methodology-landscape-research.md §3 (ICAR-LN = P1 first slice)]
- [Source: src/assessment/methodology-registry.js] (letter-number entries → these pool URLs)
- [Source: corpus/item-parameters.schema.json] (the schema the LN pools satisfy)
- [Source: src/items/stub-001.svg] (SVG asset convention)

## Dev Agent Record

### Agent Model Used

frontend (item pools + SVG assets; scoring + flow unchanged from 12-3)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
