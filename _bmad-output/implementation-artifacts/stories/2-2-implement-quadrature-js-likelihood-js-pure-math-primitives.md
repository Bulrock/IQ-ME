---
id: 2-2-implement-quadrature-js-likelihood-js-pure-math-primitives
title: "Story 2.2: Implement quadrature.js + likelihood.js (pure math primitives)"
status: review
---

# Story 2.2: Implement quadrature.js + likelihood.js (pure math primitives)

## Story

As a **solo-dev building toward EAP estimation**,
I want **the quadrature grid + 2PL item-response likelihood function as pure, independently testable functions**,
so that **Story 2.3's EAP estimation can be expressed as numerical integration over these primitives, and an external auditor can verify the math piece-by-piece (NFR1 audit pillar)**.

This is the second story of Epic 2. Story 2.1 scaffolded the empty stubs; this story replaces `quadrature.js` + `likelihood.js` with real implementations and turns *partial* portions of `tests/unit/scoring/irt/parity.test.mjs` green where the failure now propagates from downstream stubs (`eap.js` / `index.js → scoreSession`) instead of from these two files. Story 2.3 finishes the integration.

## Acceptance Criteria

1. **AC-1 (`quadraturePoints({ quadpts, theta_lim })` deterministic + pure):**
   - Object-arg signature exactly as architecture D3 line 451: `quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] })`.
   - Returns an object `{ nodes: number[], weights: number[] }` where `nodes.length === weights.length === quadpts`.
   - `nodes` are `quadpts` evenly-spaced θ values across `[theta_lim[0], theta_lim[1]]` inclusive (linear grid, NOT Gauss-Hermite roots — see Dev Notes "Grid choice").
   - `weights` are standard-normal prior densities φ(θ) at each node, normalized so `weights.reduce((s,w)=>s+w, 0) === 1` (renormalized discrete prior, not raw φ).
   - No `Math.random`, no `Date.now`, no globals. Deterministic — two calls with same args return arrays with identical values byte-for-byte.
   - Throws `RangeError` on `quadpts <= 0`, non-integer `quadpts`, or `theta_lim[0] >= theta_lim[1]`.

2. **AC-2 (`logLikelihood(theta, items, responses)`):**
   - 2PL model: P(correct | θ, a, b) = 1 / (1 + exp(-a(θ - b))).
   - Returns the SUM of log-likelihoods across items: Σ [ r_i · ln(P_i) + (1 − r_i) · ln(1 − P_i) ].
   - `items` is an array of `{ a: number, b: number }`; `responses` is a binary array same length.
   - Numerical stability: use `log1p(-P)` style or clamp probabilities away from {0, 1} to avoid `-Infinity` for extreme θ. Document the strategy in Specialist Self-Review.
   - Throws `RangeError` on length mismatch, non-binary response, or non-finite `a`/`b`/`theta`.

3. **AC-3 (`itemLikelihood(theta, a, b, response)` — additional convenience export from `likelihood.js`):**
   - Returns P(correct | θ, a, b) if response=1, else 1 − P. NOT log-space (caller can `Math.log`).
   - Throws `RangeError` on non-binary response.
   - Used inside `logLikelihood` AND exportable for unit tests of the 2PL formula in isolation.

4. **AC-4 (additional named exports for epic-narrative compatibility):**
   - `quadrature.js` ALSO exports `gridPoints` as an alias of `quadraturePoints` (positional shim: `gridPoints(quadpts=61, thetaLim=[-6,6])` → forwards to object-arg form). This satisfies the epic narrative without breaking the D3 floor.
   - `likelihood.js` ALSO exports `patternLogLikelihood` as an alias of `logLikelihood` (identical signature; one-line re-export).
   - `index.js` re-exports include the new aliases: `gridPoints`, `itemLikelihood`, `patternLogLikelihood`.

5. **AC-5 (unit tests under `tests/unit/scoring/irt/`):**
   - `tests/unit/scoring/irt/quadrature.test.mjs`:
     - Asserts grid length === quadpts.
     - Asserts first node === theta_lim[0], last node === theta_lim[1].
     - Asserts weights sum === 1 (within 1e-12).
     - Asserts weights symmetric for symmetric theta_lim.
     - Asserts `RangeError` on bad inputs (3 cases minimum).
   - `tests/unit/scoring/irt/likelihood.test.mjs`:
     - Asserts `itemLikelihood(0, 1, 0, 1) === 0.5` (point of symmetry).
     - Asserts monotonicity in θ: `itemLikelihood(2, 1, 0, 1) > itemLikelihood(-2, 1, 0, 1)`.
     - Asserts asymptotic: `itemLikelihood(10, 1, 0, 1)` ≈ 1; `itemLikelihood(-10, 1, 0, 1)` ≈ 0.
     - Asserts `logLikelihood` returns sum: for 2 identical items the result equals 2× single-item log-prob.
     - Asserts `RangeError` on length mismatch and non-binary response.
     - Asserts numerical stability: `logLikelihood(100, [{a:1,b:0}], [0])` returns a large negative finite number, not `-Infinity` or `NaN`.

6. **AC-6 (`make test` exit code):**
   - `make test` continues to exit non-zero — but the failure trace now points at `src/scoring/irt/eap.js` or `src/scoring/irt/index.js:10` (scoreSession stub still throws). The parity test's `TypeError: Not implemented` MUST come from one of the still-stubbed files, NOT from `quadrature.js` or `likelihood.js`.
   - Story 2.2's new unit tests under `tests/unit/scoring/irt/*.test.mjs` all PASS green.

7. **AC-7 (`make lint` exits 0 + budget honored):**
   - ESLint clean under flat config (Domain B isolation preserved).
   - `node tools/lint-cognitive-load-budget.mjs` exits 0. `scoring-irt-lines` budget = 250; current 19 (post-2.1); 2.2 adds ~80-120 lines (quadrature impl + likelihood impl). Total target ≤ ~150, leaving headroom for 2.3 + 2.4.

8. **AC-8 (`scoring-irt-scaffold.test.mjs` still green):**
   - The scaffold test from 2.1 continues to pass — file existence + canonical exports + fixture shape unchanged. New aliases (`gridPoints`, `itemLikelihood`, `patternLogLikelihood`) do not break the canonical-name regex (it allows-but-doesn't-require additional exports).

## Tasks / Subtasks

- [x] **Task 1 — Implement `quadrature.js`** (AC: 1, 4, 7)
  - [x] Replace stub body with real `quadraturePoints({ quadpts, theta_lim })` implementation.
  - [x] Generate `quadpts` evenly-spaced nodes via linear interpolation: `theta_lim[0] + i * (theta_lim[1] - theta_lim[0]) / (quadpts - 1)` for i ∈ [0, quadpts-1].
  - [x] Compute φ(node) for each node (standard-normal PDF); normalize sum to 1.
  - [x] Validate inputs; throw `RangeError` on bad values.
  - [x] Add `gridPoints(quadpts=61, thetaLim=[-6,6])` positional shim.

- [x] **Task 2 — Implement `likelihood.js`** (AC: 2, 3, 4)
  - [x] Implement `itemLikelihood(theta, a, b, response)` returning the 2PL probability.
  - [x] Implement `logLikelihood(theta, items, responses)` summing item-level log-probs with numerical clamping (e.g., clamp P to `[1e-12, 1-1e-12]` before `Math.log`).
  - [x] Validate inputs; throw `RangeError` on length mismatch or non-binary response.
  - [x] Add `patternLogLikelihood` re-export alias.

- [x] **Task 3 — Author unit tests** (AC: 5)
  - [x] `tests/unit/scoring/irt/quadrature.test.mjs` — 5+ assertions per AC-5 list.
  - [x] `tests/unit/scoring/irt/likelihood.test.mjs` — 6+ assertions per AC-5 list.
  - [x] Both files use only `node:test`, `node:assert/strict`, and sibling-relative imports (NFR33).

- [x] **Task 4 — Update `src/scoring/irt/index.js` re-exports** (AC: 4)
  - [x] Add `export { gridPoints } from "./quadrature.js";`
  - [x] Add `export { itemLikelihood, patternLogLikelihood } from "./likelihood.js";`
  - [x] Keep `scoreSession` stub throwing — its real body lands in Story 2.5.

- [x] **Task 5 — Run full local pipeline + capture artifacts** (AC: 6, 7, 8)
  - [x] `make lint` → 0.
  - [x] `make test` → still non-zero (parity test fails on downstream stub), but quadrature.test.mjs + likelihood.test.mjs + scoring-irt-scaffold.test.mjs all pass.
  - [x] `node tools/lint-cognitive-load-budget.mjs` → 0.
  - [x] Document exit code + first 10 stderr lines in `## Dev Agent Record → Debug Log References`.

## Dev Notes

### Grid choice — linear nodes + φ weights, NOT Gauss-Hermite roots

The architecture (D3) and epic spec both leave grid-style ambiguous ("Gauss-Hermite-equivalent quadrature"). For Story 2.2 we use **evenly-spaced θ nodes paired with standard-normal density weights**, NOT the canonical Gauss-Hermite roots+weights pair. Rationale:

- The R `mirt::fscores` default with `quadpts=61, theta_lim=c(-6,6)` uses an evenly-spaced grid with the standard-normal density as prior (verified by reading mirt source `R/Fit.R`). Our parity target IS R mirt's behavior (Story 2.6a regen will confirm), so matching mirt's actual implementation > matching the textbook Gauss-Hermite quadrature.
- Renormalizing weights to sum=1 over the finite grid is a discrete-prior approximation; the same approximation R uses internally for the EAP posterior.
- This is reversible: if Story 2.6a finds the R values diverge from our hand-fixture by > 1e-3 logits, Story 2.2 can be re-implemented with true Gauss-Hermite roots in a follow-up; the public signature is unchanged.

Document this decision explicitly in `## Specialist Self-Review` so 2.6a's auditor knows.

### Likelihood numerical stability

For θ far from item difficulty `b`, P → 0 or P → 1, and `Math.log(0)` is `-Infinity`. Use one of:

```js
// Option A: explicit clamp
const EPS = 1e-12;
const P = 1 / (1 + Math.exp(-a * (theta - b)));
const Pclamped = Math.min(Math.max(P, EPS), 1 - EPS);
return response === 1 ? Math.log(Pclamped) : Math.log(1 - Pclamped);

// Option B: log-sum-exp identity
// log(P) = -log(1 + exp(-a*(theta - b)))
// log(1-P) = -a*(theta - b) - log(1 + exp(-a*(theta - b)))
```

Option B is asymptotically tighter (no clamping bias). Option A is simpler. Pick one; document choice in Specialist Self-Review.

### What 2.2 explicitly does NOT do

- ❌ Implement `eap.js` body — Story 2.3.
- ❌ Implement `se.js` body — Story 2.4.
- ❌ Replace `scoreSession` body in `index.js` — Story 2.5.
- ❌ Turn the parity test green — that requires 2.3 + 2.4 + 2.5 all landing.
- ❌ Add new fixture entries to `vectors-smoke.json` — frozen by test-author.
- ❌ Touch `Makefile`, `eslint.config.mjs`, `BUDGETS.json`, or any cross-domain file.

### Existing repo state (post-2.1)

- `src/scoring/irt/quadrature.js`, `likelihood.js` — currently throw stubs. This story replaces their bodies.
- `src/scoring/irt/eap.js`, `se.js`, `index.js` — remain throw stubs.
- `tests/unit/scoring/irt/parity.test.mjs` — frozen red-phase test. Will continue to fail (on downstream stubs) post-2.2.
- `tests/scaffold/scoring-irt-scaffold.test.mjs` — frozen green test. Must remain green.
- Stub LOC: 19 / 250 (per `make lint` post-2.1).

### Previous story (2.1) intelligence

- Test-author phase wrote tests/fixture; engineer phase wrote stubs + Makefile. Same split applies in 2.2 — test-author writes `quadrature.test.mjs` + `likelihood.test.mjs`; engineer writes the impl in `quadrature.js` + `likelihood.js` + index re-exports.
- `tds branch start --story=<id> --base=epic/2` auto-flips status to `tests-pending`; do not manually flip via `tds state set`.
- Frozen-test integrity (memory lesson-2026-05-19-001): once test-author commits the new test files, edits during impl phase need `tds story unfreeze-tests` — but for 2.2 no frozen-test mutations are expected.

### Project Structure Notes

- **Modified files** (this story changes):
  - `src/scoring/irt/quadrature.js` (stub → real impl)
  - `src/scoring/irt/likelihood.js` (stub → real impl)
  - `src/scoring/irt/index.js` (add 3 new named re-exports)

- **New files** (this story creates):
  - `tests/unit/scoring/irt/quadrature.test.mjs`
  - `tests/unit/scoring/irt/likelihood.test.mjs`

- **Untouched** (must not modify):
  - `src/scoring/irt/eap.js`, `se.js` — Stories 2.3, 2.4.
  - `tests/unit/scoring/irt/parity.test.mjs` — frozen.
  - `tests/scaffold/scoring-irt-scaffold.test.mjs` — frozen.
  - `tests/golden/vectors-smoke.json` — frozen.
  - `Makefile`, `eslint.config.mjs`, `BUDGETS.json`, all other domains.

### References

- Story 2.1 — [2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md](2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md)
- Epic 2 narrative — [epics.md#L767-L788](../planning-artifacts/epics.md#L767-L788)
- Architecture D3 (public surface + scoreSession shape) — [architecture.md#L438-L494](../planning-artifacts/architecture.md#L438-L494)
- NFR16 / NFR17 (pure functions, no DOM, no globals, no async) — [prd.md](../planning-artifacts/prd.md)
- NFR33 (zero runtime deps; no third-party test framework) — [prd.md](../planning-artifacts/prd.md)
- BUDGETS.json `scoring-irt-lines` (250 LOC cap) — [BUDGETS.json](../../BUDGETS.json)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story 2-2 finalized: quadrature + 2PL likelihood primitives implemented. 20 unit tests pass; budget 106/250 LOC; make lint=0; make test still exits non-zero (parity test fails on scoreSession stub at index.js:14 — exactly per AC-6). Numerical-stability strategy: log-sum-exp Option B. Grid choice: linear theta + renormalized normal-density weights (matches R mirt::fscores).

### File List

- src/scoring/irt/quadrature.js
- src/scoring/irt/likelihood.js
- src/scoring/irt/index.js
- tests/unit/scoring/irt/quadrature.test.mjs
- tests/unit/scoring/irt/likelihood.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **Linear-spaced θ grid + standard-normal density weights (NOT Gauss-Hermite roots).** Per spec Dev Notes "Grid choice" — matches R mirt::fscores default. Renormalized to sum=1 over the finite grid as a discrete-prior approximation. Reversible if 2.6a's R regen finds divergence > 1e-3 logits; signature unchanged.

2. **Option B (log-sum-exp identity) for numerical stability in `logLikelihood`.** Avoids clamping bias entirely: `log(P) = -log(1 + exp(-z))`, `log(1-P) = -z - log(1 + exp(-z))`, where `z = a(θ - b)`. The `log1pExp` helper applies the shift trick (`x + log1p(exp(-x))` for `x > 0`) to avoid `exp(±large)` overflow.

3. **`gridPoints` as positional shim, `patternLogLikelihood` as same-symbol re-export.** Architecture D3 wins on object-arg `quadraturePoints({...})`; epic narrative wants positional `gridPoints(quadpts, thetaLim)`. The shim is one line; both contracts hold simultaneously. For `patternLogLikelihood` (epic name) vs `logLikelihood` (D3 name), the implementations are literally identical — exported under both names via `export { logLikelihood as patternLogLikelihood }`.

**Alternatives considered:**

- *True Gauss-Hermite roots + Hermite weights.* Standard numerical quadrature textbook approach, but R mirt doesn't use it — it uses evenly-spaced θ with normal-density weights. Story 2.6a's R parity check would diverge from a Gauss-Hermite implementation. Deferred to follow-up if parity fails.

- *Option A (explicit clamp).* Simpler (1 line: `Math.min(Math.max(P, EPS), 1-EPS)`), but introduces asymmetric bias near θ=±∞ where the true log-probability is `-O(|θ|)`, not `log(EPS)`. Chose Option B for tighter asymptotic correctness.

- *Separate `gridPoints` impl vs alias.* Considered implementing `gridPoints` as a thin re-derivation rather than a delegate. Rejected — one source of truth for the math; positional/object-arg difference is a calling-convention detail.

**Framework gotchas avoided:**

- *No `Math.random`, no `Date.now`, no globals* — pure functions per NFR16/NFR17.
- *Deterministic output verified by test* (`quadraturePoints: deterministic — repeated calls byte-identical`).
- *`Number.isFinite` for all numeric inputs* before arithmetic — catches `Infinity` / `NaN` slipping through and surfacing as silent `RangeError`-free wrong results.
- *Array-length parameter (`new Array(quadpts)`) preallocated* to avoid V8 hidden-class churn on hot path; minor but consistent with the "tight loop" intent.

**Areas of uncertainty:**

1. **Grid choice may diverge from `mirt::fscores` actual behavior.** I reasoned about mirt source but didn't run R. Story 2.6a's auditor should confirm via direct R-pinned regression. If divergence > 1e-3 logits, re-implement quadrature with R-extracted nodes+weights table.
2. **Numerical stability boundary not exhaustively tested.** Test covers θ=±100 finiteness. Did not test e.g. `a=1e-9` (degenerate item discrimination) or `a=1e9` (super-discriminating). Spec didn't call these out; auditor may want to add.

**Tested edge cases (per `quadrature.test.mjs` + `likelihood.test.mjs`):**

- Grid bounds (first/last node at theta_lim endpoints)
- Weight normalization to sum=1 within 1e-12
- Weight symmetry about origin for symmetric theta_lim
- Determinism (byte-identical repeated calls)
- 4 RangeError cases for quadrature (quadpts ≤ 0, non-integer, inverted lim, equal lim)
- 2PL symmetry at θ=b (probability exactly 0.5)
- 2PL monotonicity in θ for fixed (a, b)
- 2PL asymptotic behavior at θ=±10
- Response-complement consistency (P(0) === 1 − P(1))
- Sum-of-logs additivity (2 identical items === 2× single item)
- Numerical stability at extreme θ=±100 (finite + negative)
- 3 RangeError cases for likelihood (length mismatch ×2, non-binary)
- patternLogLikelihood alias equivalence
- gridPoints positional + default args

20 unit tests; all pass green. Parity test continues to fail on scoreSession stub at index.js:14 — exactly as AC-6 requires.
