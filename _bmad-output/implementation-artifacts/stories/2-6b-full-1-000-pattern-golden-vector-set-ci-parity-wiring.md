---
id: 2-6b-full-1-000-pattern-golden-vector-set-ci-parity-wiring
title: "Story 2.6b: Full ≥1,000-pattern golden vector set + CI parity wiring"
status: ready-for-dev
---

# Story 2.6b: Full ≥1,000-pattern golden vector set + CI parity wiring

## Story

As a **skeptic running `make test` to verify the parity claim (Tomáš journey)**,
I want **≥1,000 simulated response patterns with their expected θ + SE values committed at `tests/golden/vectors.json`, plus the full parity assertion wired into `pr-checks.yml` so any PR that regresses ±0.001 logits parity fails the build**,
so that **I can independently regenerate them (with the pinned seed) and confirm the JS engine matches to ±0.001 logits without trusting the maintainer's word**.

This is the seventh story of Epic 2. Story 2.6a landed the R-in-CI harness for the n=6 smoke set; this story scales to n≥1000.

**Same asymmetry as 2-6a:** R + mirt is not available on the dev box. Per the JS-derived-then-R-audited narrative established by Stories 2.5 + 2.6a, this story:
1. **Generates the full set against the JS engine** (committed as `tests/golden/vectors.json`).
2. **Extends `regenerate.R` `--full` mode** to produce `r-output-full.json` for R-mirt parity audit.
3. **Wires the parity assertion into `pr-checks.yml`** (the JS-side full-set parity test runs on every PR; the R-side audit fires on manual dispatch + `regen-goldens` label).
4. **Defers first R audit dispatch to post-merge** per the same AC-6 pattern as 2-6a.

## Acceptance Criteria

1. **AC-1 (`tests/golden/vectors.json` committed with ≥1,000 entries):**
   - File at `tests/golden/vectors.json`.
   - Contains ≥1,000 entries, each `{ responses: [...], itemParameters: [...], expectedTheta: <num>, expectedSE: <num> }` — same camelCase shape as `vectors-smoke.json`.
   - **Generation source:** the JS scoring engine (Stories 2.2–2.5), invoked via a one-time generator script `tools/generate-full-vectors.mjs` (committed in this story).
   - Pattern distribution: response vectors of length 1–16 (ICAR-MR session length per FR7); item-parameter `a` ∈ [0.5, 2.5], `b` ∈ [-3, 3] (matching ICAR-MR calibration range); random response patterns under `set.seed(20260514)` analog (Node's `crypto.randomInt`-seeded via a pinned 128-bit hex string, OR JS's deterministic Mulberry32 PRNG with seed 20260514).
   - Entries sorted lexicographically by SHA256 hash of `JSON.stringify(entry)` for byte-stable diffs.
   - 6-decimal precision for `expectedTheta` / `expectedSE`.
   - JSON validates against `corpus/methodology-claims-v1.schema.json` if applicable (no — this is a test fixture, not a methodology claim file; skip).

2. **AC-2 (`tools/generate-full-vectors.mjs` — one-time generator):**
   - File path `tools/generate-full-vectors.mjs`.
   - Pure Node.js, no third-party deps (NFR33).
   - Deterministic: same seed → same output (verified by SHA256 in `tests/golden/README.md`).
   - Generates ≥1,000 patterns per AC-1 distribution rules.
   - Invocation: `node tools/generate-full-vectors.mjs > tests/golden/vectors.json` (or with `--out=<path>` flag).
   - Documented in `tests/golden/README.md` as the canonical regen-from-JS pipeline.

3. **AC-3 (`tests/unit/scoring/irt/parity-full.test.mjs` — JS-side full-set parity test):**
   - File at `tests/unit/scoring/irt/parity-full.test.mjs` (separate from `parity.test.mjs` which iterates the smoke set).
   - Loads `tests/golden/vectors.json` and iterates ALL entries.
   - For each entry: invokes `scoreSession({ responses, itemParameters, normingStats: { se_norming: 0 } })` and asserts `Math.abs(r.theta - expectedTheta) <= 0.001` AND `Math.abs(r.sem - expectedSE) <= 0.001`.
   - Uses only `node:test` + `node:assert/strict` (NFR33).
   - Total runtime <5s on dev laptop (per epic spec line 903 / NFR26).
   - Lands GREEN on first run (since `vectors.json` is JS-engine-generated — by construction).

4. **AC-4 (`pr-checks.yml` runs `parity-full.test.mjs` on every PR):**
   - The existing `pr-checks.yml` workflow gains a new step or new job that runs `node --test tests/unit/scoring/irt/parity-full.test.mjs` after the existing `make test` step.
   - PR check fails if parity is broken — any change to the scoring engine that drifts > 0.001 logits on any of 1000+ patterns is caught at PR time.
   - Step is unconditional (not behind a label), since the full-set test is JS-only (no R required) and runs in <5s.

5. **AC-5 (`tests/golden/regenerate.R --full` mode lands):**
   - The deferred-stub from Story 2.6a is replaced with a full implementation: for each entry in `tests/golden/vectors.json`, compute R-mirt EAP θ + SE and write to `tests/golden/r-output-full.json`.
   - Same mirt parameterization translation (`d = -a * b`) and the same `mod2values` + `est=FALSE` pattern as the `--smoke` mode.
   - Same pinned versions and seed.

6. **AC-6 (`.github/workflows/golden-regen.yml` extended to handle `--full`):**
   - Workflow gains a job-input `mode: { smoke | full }` (default `smoke`).
   - When `mode=full`, the workflow runs `Rscript tests/golden/regenerate.R --full` + `node tests/golden/parity-audit.mjs --full` (audit script extended per AC-7).
   - `mode=full` runs may take ≤30 min (vs 15 for smoke); job `timeout-minutes: 30` for full mode.

7. **AC-7 (`tests/golden/parity-audit.mjs --full` mode):**
   - The existing parity-audit script gains a `--full` flag.
   - When `--full`: loads `tests/golden/vectors.json` and `tests/golden/r-output-full.json` (instead of the smoke variants); same comparison logic; same ±0.001 logits tolerance; same exit-code semantics.

8. **AC-8 (`tests/golden/README.md` + `CHANGELOG.md` updated):**
   - README adds "Full set" section documenting the `tests/golden/vectors.json` + `tools/generate-full-vectors.mjs` + `regenerate.R --full` + `parity-audit.mjs --full` pipeline.
   - CHANGELOG adds v2.0 entry per the v2.0 placeholder Story 2.6a left:
     - Date, seed, pattern count, item-parameter distribution.
     - SHA256 of `tests/golden/vectors.json` for reproducibility.
     - Status: "JS-engine-derived (Story 2.6b); R-mirt audit deferred to first post-merge dispatch."

9. **AC-9 (`make test` exit 0 + budget):**
   - `make test` runs `parity-full.test.mjs` (via the existing `tests/unit/` glob); all 1000+ entries pass; total runtime <5s per NFR26.
   - All prior tests remain green.
   - ESLint clean.
   - `lint-cognitive-load-budget.mjs` — generator + full-mode logic is outside the `scoring-irt-lines` budget. New JS LOC is in `tools/` (counted separately).

10. **AC-10 (no fixture mutation in non-2.6b scopes):**
    - `tests/golden/vectors-smoke.json` MUST NOT be modified by this story (Story 2.5 baseline; Story 2.6a's smoke parity uses it).
    - All scoring-irt source files MUST NOT be modified.
    - All prior frozen tests MUST NOT be modified.

## Tasks / Subtasks

- [ ] **Task 1 — Author `tools/generate-full-vectors.mjs`** (AC: 2)
  - [ ] Pure Node.js generator with seeded PRNG (Mulberry32 with seed 20260514).
  - [ ] Iterate 1000 random patterns: response length ∈ {1..16}; item params `a ~ U[0.5, 2.5]`, `b ~ U[-3, 3]`; responses random binary.
  - [ ] For each pattern: invoke `scoreSession` from `src/scoring/irt/index.js` to compute `expectedTheta` + `expectedSE`.
  - [ ] Round to 6 decimals.
  - [ ] Sort entries by SHA256 of `JSON.stringify(entry)` for byte-stable output.
  - [ ] Write to stdout (or `--out=<path>` if provided).

- [ ] **Task 2 — Generate `tests/golden/vectors.json`** (AC: 1)
  - [ ] Run `node tools/generate-full-vectors.mjs > tests/golden/vectors.json`.
  - [ ] Verify ≥1000 entries; valid JSON; 6-decimal precision.
  - [ ] Record SHA256 hash for CHANGELOG v2.0 entry.

- [ ] **Task 3 — Author `tests/unit/scoring/irt/parity-full.test.mjs`** (AC: 3)
  - [ ] Loads `vectors.json`; iterates all entries with sub-tests.
  - [ ] Asserts ±0.001 logits tolerance per entry.
  - [ ] Verifies total runtime <5s (use `t.diagnostic` to print timing).

- [ ] **Task 4 — Extend `regenerate.R` `--full` mode** (AC: 5)
  - [ ] Replace the deferred-stub branch with a full impl mirroring `--smoke`.
  - [ ] Loop over all entries in `vectors.json`.
  - [ ] Write to `tests/golden/r-output-full.json`.

- [ ] **Task 5 — Extend `parity-audit.mjs` `--full` mode** (AC: 7)
  - [ ] Add CLI arg parsing for `--full` vs `--smoke` (default `--smoke`).
  - [ ] Branch file paths based on mode.

- [ ] **Task 6 — Extend `.github/workflows/golden-regen.yml`** (AC: 6)
  - [ ] Add `workflow_dispatch.inputs.mode` (`smoke` | `full`, default `smoke`).
  - [ ] Pass mode to `regenerate.R` + `parity-audit.mjs`.
  - [ ] Conditional `timeout-minutes` (15 for smoke, 30 for full).

- [ ] **Task 7 — Wire `pr-checks.yml` to run `parity-full.test.mjs`** (AC: 4)
  - [ ] Locate existing `pr-checks.yml`; add a step running `node --test tests/unit/scoring/irt/parity-full.test.mjs` after the existing `make test` invocation.
  - [ ] Verify step is unconditional (no label gate); runs on every PR.

- [ ] **Task 8 — Update `tests/golden/README.md` + `CHANGELOG.md`** (AC: 8)
  - [ ] README: add "Full set" section + invocation docs + SHA256 record.
  - [ ] CHANGELOG v2.0 entry.

- [ ] **Task 9 — Run full local pipeline** (AC: 9, 10)
  - [ ] `make lint` → 0.
  - [ ] `make test` → 0 (existing 283 + 1 new `parity-full.test.mjs` parent test with 1000+ subtests).
  - [ ] Verify runtime <5s for `parity-full.test.mjs` alone.

## Dev Notes

### Mulberry32 PRNG (pure JS, seedable, deterministic)

```js
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Single 32-bit seed, period 2^32. For 1000 patterns × max 16 responses × 2 item params each, we draw ~32k random numbers — well within period. Deterministic byte-for-byte across Node versions.

### Pattern distribution rationale

ICAR-MR session length per FR7: 16 items (full session). For golden vectors, sampling lengths 1..16 covers:
- **Short patterns (length 1–3):** test extremes of the SE bound + symmetric cases.
- **Medium (length 4–10):** typical mid-session state.
- **Long (length 11–16):** full-session parity (the load-bearing claim).

Item parameter ranges (`a ∈ [0.5, 2.5]`, `b ∈ [-3, 3]`) match ICAR-MR calibration distribution per architecture references.

### JS-derived fixture is circular for parity claim

Same caveat as Story 2.5 self-review applies: `vectors.json` is generated by the JS engine, so `parity-full.test.mjs` passes by construction. The third-party validation comes from `golden-regen.yml --mode=full` post-merge, which compares against R-mirt-derived `r-output-full.json` via `parity-audit.mjs --full`.

This is the same scaffold-now-audit-later pattern as 2.6a, just scaled to n=1000. The PR-check `parity-full.test.mjs` guards against **JS-engine regressions** (any change to `src/scoring/irt/*.js` that drifts the engine's output from the committed fixture → PR fails). The post-merge `golden-regen --full` audit guards against **methodology drift** between JS engine and R mirt.

### Why `pr-checks.yml` runs the JS-side full parity, not the R-side

R + mirt install on every PR is ~5 min of CI time + cache invalidation churn. The label-trigger is the documented opt-in (per AC-1 of Story 2.6a's workflow). JS-side full parity is sub-second per entry × 1000 entries = <5s total — fits the per-PR budget.

### What 2.6b explicitly does NOT do

- ❌ Modify `vectors-smoke.json` or any 2-5/2-6a artifact.
- ❌ Run the first `--full` R audit dispatch (deferred to post-merge per AC-6/Task pattern).
- ❌ Populate `METHODOLOGY_CLAIMS.json` — Story 2.7.

### Project Structure Notes

- **New files:**
  - `tools/generate-full-vectors.mjs`
  - `tests/golden/vectors.json`
  - `tests/unit/scoring/irt/parity-full.test.mjs`

- **Modified files:**
  - `tests/golden/regenerate.R` (`--full` mode impl)
  - `tests/golden/parity-audit.mjs` (`--full` flag + file-path branching)
  - `.github/workflows/golden-regen.yml` (mode input + conditional timeout)
  - `.github/workflows/pr-checks.yml` (add `parity-full.test.mjs` step)
  - `tests/golden/README.md` (full-set section + invocation)
  - `tests/golden/CHANGELOG.md` (v2.0 entry)

- **Untouched (frozen):** all scoring-irt source + tests; vectors-smoke.json; CI workflow for trust-artifacts; everything outside `tools/`, `tests/golden/`, `tests/unit/scoring/irt/`, `.github/workflows/`.

### References

- Story 2.5 — JS-derived fixture pattern: [2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade.md](2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade.md)
- Story 2.6a — smoke harness landing: [2-6a-r-in-ci-harness-smoke-golden-vector-set-n-10.md](2-6a-r-in-ci-harness-smoke-golden-vector-set-n-10.md)
- Epic 2 narrative §2.6b — [epics.md#L877-L903](../planning-artifacts/epics.md#L877-L903)
- Architecture NFR22 (R mirt pin canon)
- NFR26 (verification time-to-confidence ≤10 min; parity-full <5s per spec)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
