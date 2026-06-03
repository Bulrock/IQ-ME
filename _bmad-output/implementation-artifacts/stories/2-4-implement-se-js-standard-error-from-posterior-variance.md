---
lint-exempt-carry-forward: true
id: 2-4-implement-se-js-standard-error-from-posterior-variance
title: "Story 2.4: Implement se.js (standard error from posterior variance)"
status: done
---

# Story 2.4: Implement se.js (standard error from posterior variance)

## Story

As a **skeptic verifying the uncertainty-band claim (FR15)**,
I want **the standard error of the EAP estimate to be computed from the posterior variance, separately from the EAP estimate itself, plus a root-sum-square combiner for SE_total = √(SEM² + SE_norming²)**,
so that **the uncertainty band shown to users (Epic 6's score-panel) is anchored in the published mathematics rather than a fudge factor, and Story 2.5's `scoreSession` facade can compose `sem` + `seNorming` → `seTotal` from this primitive**.

This is the fourth story of Epic 2. Stories 2.1–2.3 stood up the math primitives (`quadrature.js`, `likelihood.js`, `eap.js`). This story replaces the body of `src/scoring/irt/se.js` with real `standardError(theta, responses, itemParameters)` (D3 canonical, posterior-variance SE) and `combinedSE(sem, seNorming)` (FR15 RSS combiner). After 2.4 lands, the parity test's `TypeError` propagation moves from `scoreSession` stub at `index.js:14` directly to itself — Story 2.5 replaces the facade body and turns parity test green.

## Acceptance Criteria

1. **AC-1 (`standardError(theta, responses, itemParameters)` — D3 canonical signature):**
   - Architecture D3 (`architecture.md` §D3, line 447) pins the signature: `standardError(theta, responses, itemParameters)`. Returns the posterior SE as a **Number**.
   - Computed as `√(Σ_i (nodes[i] − theta)² · L(nodes[i]) · weights[i] / Σ_i L(nodes[i]) · weights[i])`, integrating over the default quadrature grid (`quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] })`).
   - The function constructs the quadrature internally (matches D3's existing `scoreSession` composition where `quad` is built once and reused across `eapEstimate` + `standardError`; the public `standardError` signature does NOT take `quad` per D3).
   - Pure: no DOM imports, no global state, no async, no `Math.random`, no `Date.now` (NFR16, NFR17, FR16). Deterministic.

2. **AC-2 (`combinedSE(sem, seNorming)` — FR15 RSS combiner):**
   - Exports `combinedSE(sem, seNorming)` returning `√(sem² + seNorming²)` — root-sum-square combination per FR15.
   - Throws `RangeError` on negative or non-finite `sem` or `seNorming` (SE values are non-negative by definition).
   - Pure, deterministic.

3. **AC-3 (epic-narrative compatibility alias `posteriorSE`):**
   - Epic narrative line 822 names the function `posteriorSE(items, responses, options)`. Architecture D3 wins on the canonical name + signature, but to satisfy the epic narrative's call sites (none yet — Story 2.5's `scoreSession` uses canonical `standardError`), `se.js` ALSO exports `posteriorSE` as an alias:
     - `posteriorSE` is a same-symbol re-export: `export { standardError as posteriorSE };`. Identical signature `(theta, responses, itemParameters)` — does NOT take `options` because D3's composition pattern hard-codes the quadrature pin.
   - This mirrors Story 2.2's `gridPoints` / `quadraturePoints` and `patternLogLikelihood` / `logLikelihood` dual-naming pattern.

4. **AC-4 (input validation):**
   - `standardError` may delegate `responses` / `itemParameters` / `theta` validation to inner `logLikelihood` calls (which throw `RangeError` on length mismatch, non-binary, non-finite — same delegation pattern as Story 2.3's `eapEstimate`).
   - `combinedSE` throws `RangeError` on `sem < 0`, `seNorming < 0`, or either non-finite.
   - The function MUST NOT produce `NaN` or `±Infinity` for any input that does not throw.

5. **AC-5 (numerical stability):**
   - Uses the same log-domain `M`-shift stabilization as `eapEstimate` (Story 2.3 AC-4). The formula `Σ (θ_i − θ)² · exp(logL_i) · w_i / Σ exp(logL_i) · w_i` underflows identically for long response vectors; M-shift cancels through numerator and denominator.
   - 16-item all-correct/all-wrong patterns produce finite SE values, never `NaN`/`±Infinity`.

6. **AC-6 (unit tests in `tests/unit/scoring/irt/se.test.mjs`):**
   - File path `tests/unit/scoring/irt/se.test.mjs` (mirror of `src/scoring/irt/se.js`).
   - Uses only `node:test` + `node:assert/strict` — zero third-party deps (NFR33).
   - Asserts AT MINIMUM:
     1. **SE is non-negative for any valid input** (mathematical property: `√(non-negative quantity) ≥ 0`).
     2. **SE bounded above by prior SD ≈ 1** (standard-normal prior; finite-grid renormalization keeps the discrete SD very close to 1; assert SE ≤ 1.01 for any in-range theta + valid pattern).
     3. **SE decreases monotonically with number of items** — given identical items + all-correct pattern: `se(n=3) > se(n=10) > se(n=16)` strictly. Information accumulates → posterior tightens.
     4. **Determinism** — repeated calls return `===`-equal Numbers.
     5. **16-item pattern: finite SE** (no underflow regression; AC-5 stabilization).
     6. **`combinedSE` RSS contract:** `combinedSE(3, 4) === 5` (Pythagorean), `combinedSE(0, 5) === 5`, `combinedSE(5, 0) === 5`.
     7. **`combinedSE` validation:** throws `RangeError` on negative or non-finite inputs (3 cases minimum).
     8. **`posteriorSE` alias** is `===`-equal to `standardError` (same function reference).
   - Test file LOC budget: ≤ ~90 lines.

7. **AC-7 (`make test` exit code):**
   - `make test` continues to exit non-zero — parity test still fails on `scoreSession` stub at `index.js:14`. The `TypeError: Not implemented` MUST NOT come from `se.js` after this story lands. Story 2.5 is the final stub-removal.
   - `se.test.mjs` (10+ new unit tests) all PASS green.
   - All prior tests (`quadrature.test.mjs`, `likelihood.test.mjs`, `eap.test.mjs`, `scoring-irt-scaffold.test.mjs`) remain green.

8. **AC-8 (`make lint` exits 0 + budget honored):**
   - ESLint clean.
   - `node tools/lint-cognitive-load-budget.mjs` exits 0. `scoring-irt-lines` budget = 250; current post-2.3 = 134 LOC; 2.4 adds ~30-40 LOC (standardError + combinedSE + alias). Total target ≤ ~175 post-2.4, preserving headroom for 2.5 (`scoreSession` body ~50 LOC).

9. **AC-9 (frozen-test integrity):**
   - `tests/unit/scoring/irt/parity.test.mjs` — frozen, MUST NOT be modified.
   - `tests/scaffold/scoring-irt-scaffold.test.mjs` — frozen.
   - `tests/golden/vectors-smoke.json` — frozen.
   - `tests/unit/scoring/irt/quadrature.test.mjs`, `likelihood.test.mjs`, `eap.test.mjs` — frozen (Stories 2.2, 2.3).

## Tasks / Subtasks

- [x] **Task 1 — Implement `standardError`** (AC: 1, 4, 5)
  - [x] Replace stub body in `src/scoring/irt/se.js` with real `standardError(theta, responses, itemParameters)` implementation.
  - [x] Import `logLikelihood` from `./likelihood.js` and `quadraturePoints` from `./quadrature.js`.
  - [x] Build `quad = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] })` internally.
  - [x] Compute `logL_i = logLikelihood(nodes[i], itemParameters, responses)` for each node.
  - [x] Apply M-shift stabilization: `M = max(logL_i)`; `post_i = exp(logL_i - M) * weights[i]`.
  - [x] Numerator = `Σ (nodes[i] - theta)² · post_i`; denominator = `Σ post_i`.
  - [x] Return `Math.sqrt(numerator / denominator)`.
  - [x] Inputs validation delegated to `logLikelihood`.

- [x] **Task 2 — Implement `combinedSE`** (AC: 2, 4)
  - [x] Export `combinedSE(sem, seNorming) → Math.sqrt(sem ** 2 + seNorming ** 2)`.
  - [x] Validate: both non-negative finite Numbers; throw `RangeError` otherwise.

- [x] **Task 3 — Add `posteriorSE` alias** (AC: 3)
  - [x] `export { standardError as posteriorSE };` — single-line re-export for epic-narrative compatibility.

- [x] **Task 4 — Author unit tests** (AC: 6)
  - [x] Create `tests/unit/scoring/irt/se.test.mjs` covering all 8 AC-6 assertions.
  - [x] Use only `node:test`, `node:assert/strict`, sibling-relative imports.

- [x] **Task 5 — Run full local pipeline** (AC: 7, 8, 9)
  - [x] `make lint` → 0.
  - [x] `node tools/lint-cognitive-load-budget.mjs` → 0; record post-2.4 LOC count.
  - [x] `make test` → non-zero (parity still red on `scoreSession` stub at `index.js:14`); `se.test.mjs` green; all prior tests green.
  - [x] Confirm frozen tests + fixtures byte-identical.

## Dev Notes

### SE formula — posterior variance over the quadrature grid

Given `theta = θ_EAP` (already computed by `eapEstimate` upstream), and the same `(nodes, weights)` quadrature + `(items, responses)` likelihood:

```
posterior_i ∝ L(nodes[i] | r) · weights[i]   = exp(logL_i) · weights[i]
Var(θ) = Σ_i (nodes[i] − θ_EAP)² · posterior_i / Σ_i posterior_i
SE(θ) = √Var(θ)
```

The M-shift stabilization is identical to Story 2.3's: numerator and denominator both multiplied by `exp(−M)`, which cancels. Without M-shift, `exp(-800)` rounds to 0 for 16-item all-correct patterns, yielding `0/0 = NaN`.

### Why `standardError` builds quadrature internally (D3 composition pattern)

Architecture D3 line 450–462 shows `scoreSession` composing `quad = quadraturePoints(...)` once and passing it to `eapEstimate(responses, itemParameters, quad)`. But `standardError(theta, responses, itemParameters)` does NOT take `quad` in the public signature — it builds it internally. Why?

- **Audit-reading clarity (NFR26):** the auditor reading `se.js` top-to-bottom sees the quadrature pin (`quadpts: 61, theta_lim: [-6, 6]`) baked in, matching the methodology claim. No risk of an upstream caller passing a divergent quad.
- **`scoreSession` already builds quad once; passing it to `standardError` is an optimization for free.** Story 2.5 can choose to either rebuild quad in each `standardError` call (D3's literal signature) or pass through an internal `_quad` parameter for performance. Either approach satisfies D3 because the public signature is unchanged.

For 2.4, build quad internally (correctness first; Story 2.5 may add an internal optimization parameter or accept the duplicate quad construction — both n=61 grids, negligible cost).

### `combinedSE` — Pythagorean composition

`SE_total = √(SEM² + SE_norming²)` per FR15. Story 2.5 will consume this:

```js
// In Story 2.5's scoreSession:
const sem = standardError(theta, responses, itemParameters);
const seTotal = combinedSE(sem, normingStats.seNorming);
```

For Story 2.4 itself, `combinedSE` is a 4-line pure function with explicit validation.

### Frozen-test contract — what 2.4 does NOT do

- ❌ Modify `tests/unit/scoring/irt/parity.test.mjs` (frozen until 2.6a fixture swap).
- ❌ Modify any of the existing frozen test files.
- ❌ Implement `scoreSession` body — Story 2.5.
- ❌ Touch `Makefile`, `eslint.config.mjs`, `BUDGETS.json`, cross-domain files.

### Existing repo state (post-2.3)

- `src/scoring/irt/quadrature.js` — real (Story 2.2).
- `src/scoring/irt/likelihood.js` — real (Story 2.2).
- `src/scoring/irt/eap.js` — real (Story 2.3); 134/250 LOC after 2.3.
- `src/scoring/irt/se.js` — **stub** (throws `TypeError("Not implemented")`). This story replaces.
- `src/scoring/irt/index.js` — re-exports + `scoreSession` stub (Story 2.5 replaces body).
- Parity test currently fails at `scoreSession` stub line 14 in `index.js`. After 2.4 lands, parity test STILL fails at `index.js:14` (not `se.js:5`) because `scoreSession` is the OUTER stub and short-circuits before reaching `standardError`. Story 2.5 unblocks parity.

### Previous story (2.3) intelligence

- Engineer chose log-domain M-shift stabilization in `eap.js`. Story 2.4 follows the same pattern in `standardError` — same numerical regime, same n=16 underflow risk if naive.
- Engineer used `new Array(n)` pre-allocation in `eap.js` for V8 monomorphic stability. Story 2.4 should match the style for consistency.
- Engineer delegated `responses`/`itemParameters`/`theta` validation to `logLikelihood`'s internal checks. Story 2.4 follows the same pattern; same `RangeError` surface.
- Memory lesson 2026-05-19-001 (frozen tests): production source like `se.js` is NOT class A (git-tamper-evident only). `tds integrity record` is skipped — verified during 2-3.

### Project Structure Notes

- **Modified files** (this story changes):
  - `src/scoring/irt/se.js` (stub → real impl)

- **New files** (this story creates):
  - `tests/unit/scoring/irt/se.test.mjs`

- **Untouched** (must not modify):
  - All other `src/scoring/irt/*.js`.
  - All frozen test files.
  - `Makefile`, `eslint.config.mjs`, `BUDGETS.json`, all other domains.

### References

- Story 2.3 — [2-3-implement-eap-js-eap-estimation.md](2-3-implement-eap-js-eap-estimation.md)
- Epic 2 narrative §2.4 — [epics.md#L813-L829](../planning-artifacts/epics.md#L813-L829)
- Architecture D3 (canonical `standardError` signature) — [architecture.md#L438-L462](../planning-artifacts/architecture.md#L438-L462)
- FR15 (uncertainty-band, RSS combination) — [prd.md](../planning-artifacts/prd.md)
- NFR16/17 (pure functions) — [prd.md](../planning-artifacts/prd.md)
- NFR33 (zero runtime deps) — [prd.md](../planning-artifacts/prd.md)
- BUDGETS.json `scoring-irt-lines` (250 LOC cap) — [BUDGETS.json](../../BUDGETS.json)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story 2-4 finalized: standardError + combinedSE + posteriorSE alias landed; 12 frozen tests green; budget 170/250 LOC; parity-test still red downstream (scoreSession stub at index.js:14).
- Story 2-4 ready for code-review (cumulative-epic mode 2).

### File List

- src/scoring/irt/se.js
- tests/unit/scoring/irt/se.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **Build `quadraturePoints` internally inside `standardError`.** D3 line 447 pins the signature as `standardError(theta, responses, itemParameters)` — no `quad` parameter. Construct it inside the function. Story 2.5's `scoreSession` will pay a redundant quad build (n=61 grid) per call; negligible cost (~10μs) for current request volume, and the canonical-signature win is clarity for the auditor reading top-to-bottom (NFR26).

2. **Log-domain M-shift stabilization mirrors Story 2.3 `eapEstimate`.** Same numerical regime (n=16 underflow at θ=−6 for all-correct), same fix (`exp(logL_i − M) · weights[i]`). Code structure deliberately matches eap.js for ease of review — both files are a 2-loop pattern with `M` tracked in the first loop.

3. **`combinedSE` validation throws `RangeError` on negative inputs.** SE is non-negative by definition (`√(non-neg)`). Accepting `combinedSE(-1, 2) → √5` would silently produce a valid-looking number from invalid input; fail-loud preferred.

4. **`posteriorSE` as same-reference alias.** `export { standardError as posteriorSE }` exports the same function object — `assert.equal(posteriorSE, standardError)` passes by identity. No wrapper, no cost.

**Alternatives considered:**

- *Take `quad` as optional param `standardError(theta, responses, items, quad?)` to avoid double-construction in `scoreSession`.* Rejected for now — D3 signature wins; Story 2.5 can profile and add an internal `_quad` parameter if measurement shows it matters. Premature optimization (Karpathy #2 Simplicity).

- *Validate `theta` explicitly before delegating to `logLikelihood`.* Considered. Rejected — `logLikelihood` already throws `RangeError` on non-finite `theta` (Story 2.2 impl). Re-validating in `standardError` would duplicate the check.

- *Use `Math.hypot(sem, seNorming)` instead of `√(sem² + seNorming²)` for `combinedSE`.* `Math.hypot` is the canonical, overflow-safe Pythagorean. Briefly considered. Rejected because the AC-6.6 test asserts `combinedSE(3, 4) === 5` (strict equality). `Math.hypot(3, 4)` returns `5` exactly — same value, but `Math.hypot` is implementation-defined and may differ on edge cases. Direct `√(a² + b²)` is what the FR15 formula reads literally. For our SE magnitudes (typically 0..1), overflow protection from `Math.hypot` isn't needed.

**Framework gotchas avoided:**

- *No `Math.random`, no `Date.now`, no globals* — pure per NFR16/NFR17.
- *Deterministic verified by test* (AC-6.4 — repeated calls return `===`-equal).
- *No `Math.max(...arr)`* — `M` tracked inline during first loop, avoiding stack-overflow risk for hypothetical larger grids.

**Areas of uncertainty:**

1. **`posteriorSE` signature alias departs from epic narrative.** Epic line 822: `posteriorSE(items, responses, options = {...})`. The alias I created is `(theta, responses, items)` — same as `standardError`, since they share an export. The epic narrative's `(items, responses, options)` order would require a wrapper transforming args. Decision: stay D3-canonical; if any future caller needs the epic-narrative argument order, they can add a wrapper at that call site. Documented in story spec AC-3.

2. **Internal quad construction cost in `scoreSession`.** Story 2.5 will call both `eapEstimate(responses, items, quad)` (taking quad) and `standardError(theta, responses, items)` (building quad). The duplicate n=61 grid build is ~10μs. Not measured under load; acceptable for v1.

**Tested edge cases:**

- All 12 frozen tests in `tests/unit/scoring/irt/se.test.mjs` pass green:
  - AC-6.1 non-negative SE for 3-item all-correct
  - AC-6.2 SE bounded by prior SD ≈ 1
  - AC-6.3 SE monotonically decreases with item count (n=3 → n=10 → n=16)
  - AC-6.4 determinism
  - AC-6.5 16-item all-correct/all-wrong, finite SE (M-shift regression guard)
  - AC-6.6 `combinedSE(3, 4) === 5` + identity-when-zero
  - AC-6.7 `combinedSE` RangeError on negative + non-finite (4 cases)
  - AC-6.8 `posteriorSE` === `standardError`

- All prior frozen tests (`quadrature.test.mjs`, `likelihood.test.mjs`, `eap.test.mjs`, `scoring-irt-scaffold.test.mjs`) still green.
- `make lint` clean.
- Budget 170/250 (+36 LOC from 2-3's 134; budget projection accurate).
- Parity test still red (correctly — fails at `scoreSession` stub `index.js:14`; Story 2.5 finishes the chain).
