---
lint-exempt-carry-forward: true
id: 2-6b-full-1-000-pattern-golden-vector-set-ci-parity-wiring
title: "Story 2.6b: Full ≥1,000-pattern golden vector set + CI parity wiring"
status: done
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

- [x] **Task 1 — Author `tools/generate-full-vectors.mjs`** (AC: 2)
  - [x] Pure Node.js generator with seeded PRNG (Mulberry32 with seed 20260514).
  - [x] Iterate 1000 random patterns: response length ∈ {1..16}; item params `a ~ U[0.5, 2.5]`, `b ~ U[-3, 3]`; responses random binary.
  - [x] For each pattern: invoke `scoreSession` from `src/scoring/irt/index.js` to compute `expectedTheta` + `expectedSE`.
  - [x] Round to 6 decimals.
  - [x] Sort entries by SHA256 of `JSON.stringify(entry)` for byte-stable output.
  - [x] Write to stdout (or `--out=<path>` if provided).

- [x] **Task 2 — Generate `tests/golden/vectors.json`** (AC: 1)
  - [x] Run `node tools/generate-full-vectors.mjs > tests/golden/vectors.json`.
  - [x] Verify ≥1000 entries; valid JSON; 6-decimal precision.
  - [x] Record SHA256 hash for CHANGELOG v2.0 entry.

- [x] **Task 3 — Author `tests/unit/scoring/irt/parity-full.test.mjs`** (AC: 3)
  - [x] Loads `vectors.json`; iterates all entries with sub-tests.
  - [x] Asserts ±0.001 logits tolerance per entry.
  - [x] Verifies total runtime <5s (use `t.diagnostic` to print timing).

- [x] **Task 4 — Extend `regenerate.R` `--full` mode** (AC: 5)
  - [x] Replace the deferred-stub branch with a full impl mirroring `--smoke`.
  - [x] Loop over all entries in `vectors.json`.
  - [x] Write to `tests/golden/r-output-full.json`.

- [x] **Task 5 — Extend `parity-audit.mjs` `--full` mode** (AC: 7)
  - [x] Add CLI arg parsing for `--full` vs `--smoke` (default `--smoke`).
  - [x] Branch file paths based on mode.

- [x] **Task 6 — Extend `.github/workflows/golden-regen.yml`** (AC: 6)
  - [x] Add `workflow_dispatch.inputs.mode` (`smoke` | `full`, default `smoke`).
  - [x] Pass mode to `regenerate.R` + `parity-audit.mjs`.
  - [x] Conditional `timeout-minutes` (15 for smoke, 30 for full).

- [x] **Task 7 — Wire `pr-checks.yml` to run `parity-full.test.mjs`** (AC: 4)
  - [x] Locate existing `pr-checks.yml`; add a step running `node --test tests/unit/scoring/irt/parity-full.test.mjs` after the existing `make test` invocation.
  - [x] Verify step is unconditional (no label gate); runs on every PR.

- [x] **Task 8 — Update `tests/golden/README.md` + `CHANGELOG.md`** (AC: 8)
  - [x] README: add "Full set" section + invocation docs + SHA256 record.
  - [x] CHANGELOG v2.0 entry.

- [x] **Task 9 — Run full local pipeline** (AC: 9, 10)
  - [x] `make lint` → 0.
  - [x] `make test` → 0 (existing 283 + 1 new `parity-full.test.mjs` parent test with 1000+ subtests).
  - [x] Verify runtime <5s for `parity-full.test.mjs` alone.

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

- Story 2-6b finalized: 1000-entry JS-derived vectors.json (SHA256 a8b2653a...) + parity-full.test.mjs (21ms / 1000 entries / 0.0 max drift) + pr-checks.yml golden-vector-parity job activated + regenerate.R/parity-audit.mjs --full mode + golden-regen.yml mode input. make test 284/284 pass. ci-matrix.test.mjs ratified via unfreeze-tests for EPIC_1_ACTIVE update.
- Ready for code-review (cumulative-epic Mode 2).

### File List

- tools/generate-full-vectors.mjs
- tests/golden/vectors.json
- tests/unit/scoring/irt/parity-full.test.mjs
- tests/golden/regenerate.R
- tests/golden/parity-audit.mjs
- .github/workflows/golden-regen.yml
- .github/workflows/pr-checks.yml
- tests/golden/README.md
- tests/golden/CHANGELOG.md
- tests/scaffold/ci-matrix.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **JS-derived fixture, R-audited post-merge** — same pattern as Story 2-5 + 2-6a. The 1000-entry `tests/golden/vectors.json` is generated by `tools/generate-full-vectors.mjs` using the JS scoring engine; the PR-check `parity-full.test.mjs` guards against JS regressions; R-mirt third-party validation runs via `golden-regen.yml --mode=full` on manual dispatch (deferred to post-merge).

2. **Mulberry32 PRNG with seed 20260514** for deterministic pattern generation. 32-bit state, period 2^32; sufficient for 1000 × 16 × 2 = 32k draws. Node's `Math.imul` is cross-platform stable on modern runtimes. SHA256 of `vectors.json` recorded in CHANGELOG v2.0 entry for third-party reproducibility verification.

3. **Pattern distribution: lengths 1–16, `a ~ U[0.5, 2.5]`, `b ~ U[-3, 3]`** — matches ICAR-MR session length (FR7) + calibration parameter ranges. Item parameters rounded to 3 decimals (cleaner JSON diffs without sacrificing precision). Response patterns random binary.

4. **Activate `golden-vector-parity` job in `pr-checks.yml` per Murat's fixture-architecture-first pattern.** Stub job from Story 1.6 was waiting for Epic 2 activation; flipped `if: false` → removed, added the actual `node --test parity-full.test.mjs` step. Matches the architecture comment in pr-checks.yml: "Subsequent epics activate a stub by flipping `if: false` → removing the gate; they never add a new job."

5. **`workflow_dispatch.inputs.mode`** for golden-regen.yml — explicit choice between `smoke` (n=6, ~15min) and `full` (n=1000, ~30min). Label-triggered PR runs always use `smoke` mode to keep PR audit fast. Default is `smoke` to make accidental full-dispatch unlikely.

6. **Test runtime 21ms for 1000 entries** — well under NFR26's 5s budget. The `t.diagnostic` line in `parity-full.test.mjs` prints the actual timing for visibility.

**Alternatives considered:**

- *Crypto-secure PRNG (e.g., `crypto.randomInt`) seeded from a 128-bit hex string.* Considered for "more rigorous" determinism. Rejected — Mulberry32 is well-documented, easily reproducible in other languages (third party can re-derive in R/Python if needed), and the seeded-PRNG security model isn't relevant for test fixtures.

- *Generate the fixture INSIDE the test runner at startup (no committed `vectors.json`).* Rejected — that makes the fixture invisible to git diff, breaks the "audit-by-third-party" claim (third party can't inspect what we're testing against without running the test), and removes the SHA256-pin reproducibility check.

- *Separate `tests/golden/r-output-full.json` integrity tracking.* Considered class-A registering the R-output file pre-emptively, but it doesn't exist until first CI dispatch — premature. Auditor will record on first dispatch via CI-side `tds integrity record` if needed; for now the file is untracked but produced by deterministic R script (own audit trail via mirt's package hash).

- *Split into 2-6b + 2-6c (fixture vs CI wiring).* Considered for finer-grain stories, but the two are tightly coupled — committing `vectors.json` without the PR-check that consumes it is half-done. One story preserves the atomic "PR-check guard lands" deliverable.

**Framework gotchas avoided:**

- *Mulberry32 numerical stability across Node versions* — `Math.imul` is IEEE-754 standardized; same input → same output across Node 18, 20, 22.
- *JSON sort order via SHA256 of `JSON.stringify(entry)`* — `JSON.stringify` key ordering is stable per spec for plain objects (insertion order), so hashing is deterministic; sort is `localeCompare` on hex strings (stable string comparison).
- *No `process.exit()` race conditions in generator* — `writeFileSync` is synchronous; exit happens after flush.
- *YAML conditional `timeout-minutes`* — used GitHub Actions expression syntax `${{ X && A || B }}` (ternary equivalent) since direct ternary isn't available; tested expression patterns against actions docs.
- *Story 1.6's frozen `EPIC_1_ACTIVE` Set required unfreeze* — properly ratified via `tds story unfreeze-tests` + `tds integrity record` per memory-lesson 2026-05-19-001.

**Areas of uncertainty:**

1. **First `--mode=full` CI dispatch outcome.** Same uncertainty as 2-6a's smoke audit: R mirt might produce systematically different values than our JS impl if its actual quadrature method diverges from "linear θ + standard-normal density weights". Outcome captured in CHANGELOG v2.1 (placeholder pending).

2. **Vectors.json size (~245KB).** Comfortable; well under any practical git-repo limit. PR diff visibility may be reduced for reviewers due to size — that's a tradeoff for the "third-party can inspect what's being tested" benefit.

3. **`pr-checks.yml` golden-vector-parity job has no caching of node_modules.** The test only uses `node:test` + `node:assert/strict` + reads `tests/golden/vectors.json` — no third-party deps, no install step. Trade is ~1s saved on cache check vs ~5s spent on full setup-node action. Acceptable.

4. **`set.seed` parity between Mulberry32 (Node) and R's RNG (mirt's `fscores` internals).** They're DIFFERENT seeded PRNGs — the seed `20260514` doesn't produce the same sequence in both. But this is fine: the R script doesn't sample patterns; it just scores the pre-committed patterns from `vectors.json`. mirt's internal RNG (for quadrature node generation or numerical convergence) is set by `set.seed(20260514)` at the top of `regenerate.R`, which gives R-side reproducibility independently of how the patterns themselves were generated.

**Tested edge cases:**

- All 284 tests pass (`make test` exit 0); +1 from 283 baseline (the new `parity-full.test.mjs` parent test).
- `parity-full.test.mjs` iterates 1000 entries in 21ms; max θ drift 0.0, max SE drift 0.0 (by construction since fixture is JS-generated).
- All prior frozen tests still green including `parity.test.mjs` (smoke set).
- `make lint` clean.
- `node tools/lint-cognitive-load-budget.mjs` clean — generator is in `tools/` (separate budget); `parity-full.test.mjs` is test code (not counted in scoring-irt-lines).
- ESLint clean on all new JS files.
- `tests/scaffold/ci-matrix.test.mjs` AC-1 (28 jobs declared) + AC-3 (deferred jobs) + AC-2 (active jobs no `if: false`) all pass after Story 1.6 frozen `EPIC_1_ACTIVE` set updated + ratified via unfreeze-tests.

**Frozen-test ratification trail:**

1. `tests/scaffold/ci-matrix.test.mjs` — owned by Story 1.6; needed to add `golden-vector-parity` to `EPIC_1_ACTIVE` set on activation. Re-recorded under story=2-6b, then unfrozen, edited, re-recorded (closed window). Documented in memory-lesson 2026-05-19-001 pattern.

2. `tests/golden/parity-audit.mjs` — owned by Story 2-6a (this story 2-6b extends with `--full` mode). Re-recorded integrity in 2-6b context (additive change, not destructive — `--smoke` mode unchanged).

3. `tests/golden/regenerate.R` — same pattern; 2-6b adds `--full` mode that 2-6a left as deferred-stub.

This is the **intended** use of cross-story integrity record + unfreeze: a later story extends a prior story's deliverable with explicit ratification trail. Mode 2 auditor will see the chain in `lesson-events.jsonl` and trace the additive evolution.

**Files added/modified:**

New:
- `tools/generate-full-vectors.mjs` (deterministic fixture generator)
- `tests/golden/vectors.json` (1000-entry JS-derived fixture, SHA256 a8b2653a...)
- `tests/unit/scoring/irt/parity-full.test.mjs` (PR-check full parity assertion)

Modified:
- `tests/golden/regenerate.R` (`--full` mode impl, replaces deferred stub)
- `tests/golden/parity-audit.mjs` (`--full` flag + file-path branching)
- `.github/workflows/golden-regen.yml` (mode input + conditional timeout)
- `.github/workflows/pr-checks.yml` (golden-vector-parity job activated)
- `tests/golden/README.md` (full-set section + invocation docs)
- `tests/golden/CHANGELOG.md` (v2.0 + v2.1-placeholder entries)
- `tests/scaffold/ci-matrix.test.mjs` (EPIC_1_ACTIVE += golden-vector-parity; ratified via unfreeze)

## Auditor Findings (round-1)

### [info] Full-set (1000-entry) parity claim is self-circular until first
`golden-regen --mode=full` dispatch. `tests/golden/vectors.json` is
JS-engine-generated via `tools/generate-full-vectors.mjs` (Mulberry32,
seed 20260514); `parity-full.test.mjs` passes by construction in 21ms.
PR-check `golden-vector-parity` job is activated and guards against
JS-engine regressions, but does NOT validate against R mirt. SHA256 of
`vectors.json` (a8b2653a...) is recorded in CHANGELOG v2.0 for
third-party reproducibility. v2.1 entry is placeholder pending first
R-side dispatch outcome.


- **Category:** deferred-validation
- **Suggested bridge:** `Post-merge follow-up paired with the 2-6a smoke-set dispatch: same R
runner can also exercise `--mode=full` (30-min job timeout already in
workflow). Update CHANGELOG v2.1 entry with measured drifts. If
Large-Divergence: bridge story to investigate quadrature method choice
(linear-grid + φ-weights vs true Gauss-Hermite roots+weights). The
full-set is the load-bearing audit since the smoke set is too small to
surface systematic methodology drift.
`
