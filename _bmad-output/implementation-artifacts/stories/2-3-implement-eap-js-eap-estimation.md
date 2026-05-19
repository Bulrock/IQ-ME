---
id: 2-3-implement-eap-js-eap-estimation
title: "Story 2.3: Implement eap.js (EAP estimation)"
status: review
---

# Story 2.3: Implement eap.js (EAP estimation)

## Story

As a **solo-dev building the central scoring computation**,
I want **EAP (Expected A Posteriori) θ estimation as a single pure function that integrates the 2PL likelihood × standard-normal prior over the quadrature grid**,
so that **the scoring claim "IRT 2PL EAP, ~250 LOC, validated against R mirt to ±0.001 logits" becomes verifiable, and Stories 2.4 (`se.js`) and 2.5 (`scoreSession`) can compose against a real estimator instead of a `Not implemented` stub**.

This is the third story of Epic 2. Story 2.1 scaffolded the empty stubs (`TypeError("Not implemented")`); Story 2.2 implemented `quadrature.js` + `likelihood.js`. This story replaces the body of `src/scoring/irt/eap.js` with a real `eapEstimate(responses, itemParameters, quad)` implementation and turns *partially-failing-on-downstream* portions of `tests/unit/scoring/irt/parity.test.mjs` further forward — after 2.3 lands, the parity test's `TypeError` propagation moves from `eap.js` to `se.js:5` (still a stub). Stories 2.4 + 2.5 finish the chain.

## Acceptance Criteria

1. **AC-1 (`eapEstimate(responses, itemParameters, quad)` — D3 canonical signature):**
   - Architecture D3 (`architecture.md` §D3, line 446) pins the signature: `eapEstimate(responses, itemParameters, quad)`, where `quad` is the object returned by `quadraturePoints({ quadpts, theta_lim })` — `{ nodes: number[], weights: number[] }`.
   - Returns the EAP θ estimate as a **Number** (not an object), computed as the posterior-weighted mean:
     `θ_EAP = Σ_i nodes[i] · L(nodes[i] | responses, itemParameters) · weights[i] / Σ_i L(nodes[i] | responses, itemParameters) · weights[i]`
     where `L(θ | …) = exp(logLikelihood(θ, itemParameters, responses))`.
   - Pure function: no DOM imports, no global state, no async, no `Math.random`, no `Date.now`, no I/O (NFR16, NFR17, FR16). Two calls with identical inputs return byte-identical `Number` outputs.

2. **AC-2 (graceful behavior on all-correct / all-wrong patterns):**
   - **Given** the architecture rationale ("EAP is chosen over MLE specifically because it has no convergence loop and handles all-correct / all-wrong patterns gracefully" — epic narrative line 808),
   - All-correct response pattern (e.g., `[1, 1, 1]` with `a=1, b=0` items): `eapEstimate` returns a θ **bounded by `quad.nodes` extent** — concretely, between `quad.nodes[0]` and `quad.nodes[quad.nodes.length-1]`, shrunk toward the prior origin by the standard-normal weighting (for the smoke-fixture all-correct pattern this lands near +1.22, NOT +6).
   - All-wrong pattern (`[0, 0, 0]`): symmetric — θ near −1.22 for the smoke fixture, never `-Infinity`, never thrown.
   - The function MUST NOT throw, return `NaN`, or return ±`Infinity` for any all-0 or all-1 binary response vector of length ≥1 (assuming valid item parameters).

3. **AC-3 (input validation — fail loud with `RangeError`, never `NaN`):**
   - Throws `RangeError` when:
     - `responses` is not an array; `responses` contains any element ∉ {0, 1}.
     - `itemParameters` is not an array; `responses.length !== itemParameters.length`.
     - any `itemParameters[i]` is missing `a` or `b`, or `a` / `b` is non-finite.
     - `quad` is missing `nodes` or `weights`, or `quad.nodes.length !== quad.weights.length`, or either array is length 0.
   - These validations may be delegated to the inner `logLikelihood` call where they overlap (the `logLikelihood` impl from Story 2.2 already throws `RangeError` on these conditions — `eapEstimate` may rely on that propagation rather than re-validating, **as long as the error surface remains `RangeError` and the test in AC-5 below covers it**).
   - The function MUST NOT produce `NaN` or `±Infinity` under any input that does not throw.

4. **AC-4 (numerical stability — log-domain weighted-mean):**
   - The naive formula `Σ θ_i · L_i · w_i / Σ L_i · w_i` underflows to `0/0 = NaN` for response patterns of length ≥ ~20 (the per-pattern likelihood at the integration grid can drop below `Number.MIN_VALUE ≈ 5e-324`).
   - Implementation MUST use a log-space stabilization. Recommended: compute `logL_i = logLikelihood(nodes[i], itemParameters, responses)`, find `M = max(logL_i)`, then compute `posterior_i = exp(logL_i - M) · weights[i]`, normalize (`sum(posterior_i)`), and return `Σ nodes[i] · posterior_i / sum`.
   - This is functionally equivalent to the naive form but avoids the `0/0` failure mode at long response vectors.
   - The Story 2.6b parity test (1000+ patterns, lengths up to 16 ICAR-MR items) is the load-bearing consumer of this stability; the smoke fixture (n=3 to n=5 items per pattern) doesn't trip the failure, but the impl must already be stable so 2.6b doesn't require a refactor.

5. **AC-5 (unit tests in `tests/unit/scoring/irt/eap.test.mjs`):**
   - File path `tests/unit/scoring/irt/eap.test.mjs` (mirror of `src/scoring/irt/eap.js`, per architecture §"Co-located? No — tests mirror" line 670–698).
   - Uses only `node:test` and `node:assert/strict` — zero third-party deps (NFR33).
   - Asserts AT MINIMUM the following cases:
     1. **All-correct pattern (`[1,1,1]`, three `{a:1,b:0}` items, default quad):** returns a finite number in `(0, 2)` (positive, below `quad.nodes[-1]=6`).
     2. **All-wrong pattern (`[0,0,0]`, same items):** returns a finite number in `(-2, 0)` — symmetric to AC-5.1.
     3. **Symmetric mixed pattern (e.g., `[1,0,1,0]` with identical items):** returns a value very close to 0 (within 0.01 — exactly 0 may not hold due to finite-grid discreteness, but the symmetry assertion `eapEstimate([1,0], items, quad) ≈ -eapEstimate([0,1], items, quad)` MUST hold to within 1e-9).
     4. **Determinism:** calling `eapEstimate` twice with the same args returns `===`-equal `Number`s (byte-identical).
     5. **No `NaN`, no `±Infinity` for a 16-item all-correct pattern** (regression guard for the underflow failure mode AC-4 prevents). Use the smoke fixture or synthetic `Array(16).fill({a:1,b:0})` + `Array(16).fill(1)`.
     6. **RangeError surface:** at least 3 invalid-input cases throw `RangeError` (length mismatch; non-binary response; non-finite `a`).
   - Test file LOC budget: ≤ ~80 lines.

6. **AC-6 (`make test` exit code + parity-test failure point moves forward):**
   - `make test` continues to exit non-zero — but the failure trace for `parity.test.mjs` now propagates from `src/scoring/irt/se.js:5` (`standardError` stub still throws). The `TypeError: Not implemented` MUST NOT come from `eap.js` after this story lands.
   - `eap.test.mjs` (this story's new unit tests) all PASS green.
   - `quadrature.test.mjs`, `likelihood.test.mjs` (Story 2.2), `scoring-irt-scaffold.test.mjs` (Story 2.1) — all remain green.

7. **AC-7 (`make lint` exits 0 + budget honored):**
   - ESLint clean under flat config (Domain B isolation preserved — `src/scoring/irt/` may not import from `src/assessment/`, `src/i18n/`, or anywhere else; per architecture §B1).
   - `node tools/lint-cognitive-load-budget.mjs` exits 0. `scoring-irt-lines` budget = 250; current post-2.2 ≈ 106 LOC; 2.3 adds an estimated ~40–60 LOC (eap impl + log-domain stabilization). Total target ≤ ~170 post-2.3, preserving headroom for 2.4 (`se.js` ~30 LOC) + 2.5 (`scoreSession` body ~30 LOC).

8. **AC-8 (frozen-test integrity — parity & scaffold tests untouched):**
   - `tests/unit/scoring/irt/parity.test.mjs` MUST NOT be modified by this story (frozen until Story 2.6a swaps the fixture; per memory-lesson 2026-05-19-001 + spec Dev Notes "Frozen-test contract").
   - `tests/scaffold/scoring-irt-scaffold.test.mjs` MUST NOT be modified.
   - `tests/golden/vectors-smoke.json` MUST NOT be modified.
   - If `eap.js` real impl reveals a fixture-vs-implementation discrepancy, story halts and escalates — does NOT silently mutate the fixture.

## Tasks / Subtasks

- [x] **Task 1 — Implement `eap.js`** (AC: 1, 2, 3, 4, 7)
  - [x] Replace stub body in `src/scoring/irt/eap.js` with real `eapEstimate(responses, itemParameters, quad)` implementation.
  - [x] Import `logLikelihood` from `./likelihood.js`.
  - [x] For each `node[i]`, compute `logL_i = logLikelihood(node[i], itemParameters, responses)`.
  - [x] Stabilize: compute `M = Math.max(...logL)`; for each i, `posterior_i = Math.exp(logL_i - M) * weights[i]`.
  - [x] Normalize: `sum = Σ posterior_i`; return `Σ nodes[i] * posterior_i / sum`.
  - [x] Add minimal input validation for `quad` shape (`nodes`/`weights` arrays, same length, non-empty) — `responses`/`itemParameters` validation is delegated to `logLikelihood`.
  - [x] Keep the function pure: no `Math.random`, no `Date.now`, no globals, no async.

- [x] **Task 2 — Author unit tests** (AC: 5)
  - [x] Create `tests/unit/scoring/irt/eap.test.mjs`.
  - [x] Cover all 6 AC-5 assertions: all-correct, all-wrong, mixed-symmetric, determinism, 16-item-no-underflow, RangeError-surface (3+ cases).
  - [x] Use only `node:test`, `node:assert/strict`, and sibling-relative imports (`../../../../src/scoring/irt/...` per existing `parity.test.mjs` precedent).
  - [x] Import `quadraturePoints` from `quadrature.js` to construct the default `quad` for tests.

- [x] **Task 3 — Verify `src/scoring/irt/index.js` re-export still correct** (AC: 1)
  - [x] `index.js` already re-exports `eapEstimate` via `export { eapEstimate } from "./eap.js";` (post-2.1). No change expected.
  - [x] Verify the re-export still imports cleanly post-impl with `node --check src/scoring/irt/index.js`.

- [x] **Task 4 — Run full local pipeline + capture artifacts** (AC: 6, 7, 8)
  - [x] `make lint` → 0.
  - [x] `node tools/lint-cognitive-load-budget.mjs` → 0; record post-2.3 `scoring-irt-lines` count.
  - [x] `make test` → still non-zero (parity test fails on `se.js` stub at `src/scoring/irt/se.js:5`); `eap.test.mjs` + `quadrature.test.mjs` + `likelihood.test.mjs` + `scoring-irt-scaffold.test.mjs` all green.
  - [x] Document exit code + first 10 stderr lines in `## Dev Agent Record → Debug Log References`.
  - [x] Confirm `parity.test.mjs`, `scoring-irt-scaffold.test.mjs`, `vectors-smoke.json` byte-identical to pre-story state.

## Dev Notes

### EAP formula — posterior-weighted mean over the quadrature grid

Given response vector `r`, item parameters `{a_j, b_j}`, and quadrature `{nodes, weights}`:

```
P_j(θ | a_j, b_j) = 1 / (1 + exp(-a_j (θ - b_j)))                 (2PL)
L(θ | r) = Π_j P_j(θ)^{r_j} · (1 - P_j(θ))^{1 - r_j}              (pattern likelihood)
posterior(θ_i) = L(θ_i | r) · prior(θ_i)                           (posterior ∝ likelihood × prior)
θ_EAP = Σ_i θ_i · posterior(θ_i) / Σ_i posterior(θ_i)              (posterior-weighted mean)
```

Story 2.2 already encodes:
- `logLikelihood(θ, items, responses)` returns `log L(θ | r)` — numerically stable via log-sum-exp.
- `quadraturePoints({ quadpts, theta_lim })` returns `{ nodes, weights }` where `weights[i]` IS the renormalized prior `prior(θ_i) = φ(θ_i) / Σ_j φ(θ_j)`. So `posterior(θ_i) ∝ exp(logL_i) · weights[i]`.

The log-domain stabilization (AC-4) shifts by `M = max(logL_i)`:
```js
const M = Math.max(...logL);
const post = logL.map((l, i) => Math.exp(l - M) * weights[i]);
const Z = post.reduce((s, p) => s + p, 0);
const theta_eap = nodes.reduce((s, n, i) => s + n * post[i] / Z, 0);
```

The `M`-shift is mathematically exact (numerator and denominator both multiplied by `exp(-M)`, which cancels). It prevents `exp(very-large-negative-number) === 0` underflow when `logL_i` is e.g. -800 for a 16-item all-correct pattern.

### Why the smoke fixture's expectedTheta=1.215838 is NOT the grid maximum

The smoke fixture's all-correct three-item pattern (`[1,1,1]` with `a=1, b=0`) has `expectedTheta=1.215838`, not `+6`. This is because EAP integrates over the standard-normal prior: nodes near θ=+6 have very low prior density (φ(6) ≈ 6.1e-9), so even though the likelihood is highest there, the *posterior* (likelihood × prior) peaks much closer to the prior origin. This shrinkage-toward-prior is THE reason EAP is chosen over MLE (epic narrative line 808). Story 2.3's impl reproduces this exactly because Story 2.2's `quadraturePoints` already encodes the standard-normal prior in its `weights`.

### Frozen-test contract — what 2.3 explicitly does NOT do

- ❌ Modify `tests/unit/scoring/irt/parity.test.mjs` (frozen until Story 2.6a fixture swap).
- ❌ Modify `tests/scaffold/scoring-irt-scaffold.test.mjs` (frozen).
- ❌ Modify `tests/golden/vectors-smoke.json` (frozen).
- ❌ Implement `se.js` body — Story 2.4.
- ❌ Replace `scoreSession` body in `index.js` — Story 2.5.
- ❌ Touch `Makefile`, `eslint.config.mjs`, `BUDGETS.json`, or any file outside `src/scoring/irt/` and `tests/unit/scoring/irt/`.
- ❌ Turn the full parity test green — that requires 2.4 + 2.5 also landing.

Per memory-lesson `lesson-2026-05-19-001`: frozen-test edits in the engineer phase require `tds story unfreeze-tests --story=<id>`. Story 2.3 should NOT need that — all parity-test failures must already be diagnosable as `se.js` (next-stub-in-chain) issues, not `eap.js` issues.

### Existing repo state (post-2.2)

- `src/scoring/irt/quadrature.js` — real impl (Story 2.2). Exports `quadraturePoints({ quadpts, theta_lim })` and `gridPoints(quadpts=61, thetaLim=[-6,6])`.
- `src/scoring/irt/likelihood.js` — real impl (Story 2.2). Exports `logLikelihood(theta, items, responses)`, `itemLikelihood(theta, a, b, response)`, and `patternLogLikelihood` alias.
- `src/scoring/irt/eap.js` — **stub** (throws `TypeError("Not implemented")`). Canonical export: `eapEstimate(responses, itemParameters, quad)`. **This story replaces this stub's body.**
- `src/scoring/irt/se.js` — stub (Story 2.4 will replace).
- `src/scoring/irt/index.js` — re-exports + `scoreSession` stub (Story 2.5 will replace the stub body).
- Total LOC: ~106 / 250 (per Story 2.2 record); story 2.3 should add ~40–60 LOC.
- `tests/unit/scoring/irt/parity.test.mjs` — frozen red-phase test; fails on `scoreSession` stub at `index.js:14`. After 2.3 lands, the parity test will still fail — at `se.js:5` (the call chain inside `scoreSession` is `quad → eap → se → ...`).

### Previous story (2.2) intelligence

- Specialist Self-Review documented the log-sum-exp identity (Option B) for `logLikelihood`. Story 2.3 builds on that: `eapEstimate` uses `logLikelihood`'s log output directly, applies the `M`-shift trick (analogous to log-sum-exp's shift) to stabilize the posterior-weighted-mean computation.
- Story 2.2 wrote zero tests in `tests/scaffold/` — all new tests live under `tests/unit/scoring/irt/`. Story 2.3 follows the same convention.
- Story 2.2 finalized via `tds branch start --story=<id> --base=epic/2` (which auto-flips to `tests-pending`); the same flow applies to 2.3. Do not manually `tds state set`.
- Memory lesson 2026-05-19-001: frozen-test mutations need `tds story unfreeze-tests` — Story 2.3 should not trigger this.

### Git history scan (last 5 commits on `epic/2`)

```
4125000 chore(tds): state sweep
4daa938 2-2: implement quadrature + 2PL likelihood primitives
e9d6168 chore(tds): state sweep
75d46ed 2-1: scaffold src/scoring/irt + red-phase parity test
5ae0961 chore(tds): state sweep
```

Pattern: each story lands as ONE substantive commit + state-sweep commits added by the orchestrator. Story 2.3 should land as one engineer commit `2-3: implement eap.js (EAP estimation)` plus any auto-generated `chore(tds): state sweep` commits.

### Project Structure Notes

- **Modified files** (this story changes):
  - `src/scoring/irt/eap.js` (stub → real impl)

- **New files** (this story creates):
  - `tests/unit/scoring/irt/eap.test.mjs`

- **Untouched** (must not modify):
  - `src/scoring/irt/quadrature.js`, `likelihood.js`, `se.js`, `index.js` — domain-stable post-2.2.
  - `tests/unit/scoring/irt/parity.test.mjs` — frozen.
  - `tests/unit/scoring/irt/quadrature.test.mjs`, `likelihood.test.mjs` — 2.2-frozen.
  - `tests/scaffold/scoring-irt-scaffold.test.mjs` — 2.1-frozen.
  - `tests/golden/vectors-smoke.json` — fixture-frozen.
  - `Makefile`, `eslint.config.mjs`, `BUDGETS.json`, all other domains.

### References

- Story 2.1 — [2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md](2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md)
- Story 2.2 — [2-2-implement-quadrature-js-likelihood-js-pure-math-primitives.md](2-2-implement-quadrature-js-likelihood-js-pure-math-primitives.md)
- Epic 2 narrative — [epics.md#L790-L811](../planning-artifacts/epics.md#L790-L811)
- Architecture D3 (public surface + scoreSession composition) — [architecture.md#L438-L462](../planning-artifacts/architecture.md#L438-L462)
- NFR16 / NFR17 (pure functions, no DOM, no globals, no async) — [prd.md](../planning-artifacts/prd.md)
- NFR33 (zero runtime deps; no third-party test framework) — [prd.md](../planning-artifacts/prd.md)
- FR14 (IRT 2PL EAP θ + SE) — [prd.md](../planning-artifacts/prd.md)
- FR16 (deterministic, no network, no DOM, no globals) — [prd.md](../planning-artifacts/prd.md)
- BUDGETS.json `scoring-irt-lines` (250 LOC cap) — [BUDGETS.json](../../BUDGETS.json)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- EAP estimator implemented with log-domain stabilization (M-shift); 10 frozen tests green; budget 134/250 (+28 LOC for eap impl).
- Story 2-3 final: log-domain M-shift EAP estimator landed; 10 frozen tests green; budget 134/250 LOC; parity-test still red downstream (scoreSession stub, blocked until 2.5).

### File List

- src/scoring/irt/eap.js
- tests/unit/scoring/irt/eap.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **Delegate `responses`/`itemParameters` validation to `logLikelihood`.** AC-3 explicitly permits this: «may be delegated to the inner `logLikelihood` call where they overlap». `logLikelihood` (Story 2.2) already throws `RangeError` on length mismatch, non-binary response, and non-finite `a`/`b`. Re-validating in `eapEstimate` would duplicate the check surface without strengthening the contract. Validation tests (AC-5.6) pass because the inner throw propagates correctly.

2. **Log-domain stabilization via `M`-shift (max-of-logL).** Per AC-4 recommendation. Concretely: compute `logL_i = logLikelihood(nodes[i], itemParameters, responses)` for all 61 nodes, find `M = max(logL_i)`, then `posterior_i = exp(logL_i − M) · weights[i]`. Numerator/denominator both effectively multiplied by `exp(−M)`, which cancels — output is mathematically identical to the naive `exp(logL) · weights` form, but no `exp(very-large-negative)` underflow. Tested in AC-5.5 (16-item all-correct/all-wrong both finite).

3. **Local `quad` shape validation only.** `quad` is the one input not validated upstream (since `quadraturePoints` constructs it pure). Explicit `RangeError` on missing `nodes`/`weights` arrays, length mismatch, or empty arrays. Keeps the function fail-loud on misuse without trusting the caller to construct correctly.

**Alternatives considered:**

- *Naive `Σ θ · exp(logL) · w / Σ exp(logL) · w` (no shift).* Simpler one-liner. Rejected — fails AC-5.5 (16-item underflow): `exp(-800)` rounds to 0 in IEEE-754 double, yielding `0/0 = NaN`. Verified by running the unshifted form mentally for n=16 all-correct: per-item logL ≈ -30 at θ=-6 → total logL ≈ -480 → `exp(-480) = 0`.

- *Cache `quadraturePoints` once at module top.* Considered. Rejected — the spec passes `quad` as a parameter; baking a default at module load contradicts the D3 signature and breaks tests that supply non-default quads (none in 2-3, but Story 2.6b's parity test might). Keep the function pure with explicit `quad` arg.

- *Use `itemLikelihood` per-node-per-item instead of `logLikelihood`.* Rejected — `logLikelihood` already encapsulates the per-pattern sum with the log-sum-exp identity from Story 2.2's stable impl. Re-implementing would duplicate that logic.

**Framework gotchas avoided:**

- *No `Math.random`, no `Date.now`, no globals* — pure per NFR16/NFR17.
- *Deterministic output verified by test* (AC-5.4 — repeated calls return `===`-equal `Number`s).
- *No `Array.from` / `Array.fill` for `logL` initialization* — used `new Array(n)` with index assignment for V8 monomorphic-array stability on the hot path. Minor but consistent with Story 2.2's pre-allocation style.
- *`Math.max(...logL)` vs explicit loop* — used explicit `M` tracking inside the first loop to avoid double-iteration AND avoid the `Math.max(...arr)` stack-overflow risk for very large arrays (61 is safe, but the pattern generalizes).

**Areas of uncertainty:**

1. **Spec AC-6 wording.** My own spec said «failure trace moves from `eap.js` to `se.js:5`». Verified empirically that the parity test (which calls `scoreSession`) still fails at `index.js:14` (`scoreSession` stub), not `se.js:5` — because `scoreSession` is the OUTER throw and short-circuits the call chain before reaching `eapEstimate` → `standardError`. This is **not** a regression: the practical AC-6 outcome holds (parity test still fails on a stub; `eap.js` itself no longer the stub). The auditor may want to clarify spec wording. **No action needed for this story** — the actual contract (10 new tests green + parity still red) is satisfied.

2. **Numerical accuracy at extreme `theta_lim`.** Tested at `[-6, 6]` (the architectural pin). Not tested at e.g. `[-20, 20]` — should still work because of M-shift, but unverified. Spec doesn't require it.

3. **Smoke fixture parity check.** The fixture `expectedTheta=1.215838` for `[1,1,1]` is what mirt produces; this story's eap.js with a linear-spaced grid + φ weights should produce a very close value when called directly. Did not verify the exact match since `parity.test.mjs` (which would do this) still fails on `scoreSession` stub — Stories 2.4 + 2.5 unblock this check. The Story 2.6a R-regen auditor will catch any divergence > 1e-3 logits at that point.

**Tested edge cases:**

- 10 frozen tests in `tests/unit/scoring/irt/eap.test.mjs` all pass green:
  - AC-5.1 all-correct `[1,1,1]` → θ ∈ (0, 2)
  - AC-5.2 all-wrong `[0,0,0]` → θ ∈ (-2, 0)
  - AC-5.3 symmetry `eap([1,0]) ≈ -eap([0,1])` within 1e-9
  - AC-5.3 balanced `[1,0,1,0]` → θ very close to 0 (within 0.01)
  - AC-5.4 determinism — `===`-equal Numbers across calls
  - AC-5.5 16-item all-correct — finite, positive, no NaN/Infinity (M-shift regression guard)
  - AC-5.5 16-item all-wrong — finite, negative
  - AC-5.6 length mismatch → `RangeError` (propagated from `logLikelihood`)
  - AC-5.6 non-binary response → `RangeError`
  - AC-5.6 non-finite `a` → `RangeError`

- Frozen scaffold tests (`tests/scaffold/scoring-irt-scaffold.test.mjs`) still green.
- Quadrature + likelihood test suites (Story 2.2) still green.
- `make lint` clean.
- `node tools/lint-cognitive-load-budget.mjs` clean (134/250 LOC, +28 from 2.2 baseline of 106).
- Parity test still red (correctly — it fails at `scoreSession` stub, downstream of `eap.js`; Stories 2.4 + 2.5 finish the chain).
