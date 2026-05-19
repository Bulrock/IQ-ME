---
id: 2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade
title: "Story 2.5: Public API in src/scoring/irt/index.js (scoreSession facade)"
status: ready-for-dev
---

# Story 2.5: Public API in src/scoring/irt/index.js (scoreSession facade)

## Story

As a **caller from the assessment SPA (Epic 3 vertical slice)**,
I want **a single public entry point `scoreSession({ responses, itemParameters, normingStats })` that composes `quadraturePoints → eapEstimate → standardError → combinedSE` into one stable contract**,
so that **the SPA result page consumes one frozen-shape object rather than orchestrating four primitives itself, and the Story 2.1 red-phase parity test finally turns green at the smoke-fixture tolerance (±0.001 logits)**.

This is the fifth story of Epic 2 and the keystone — it removes the last `Not implemented` stub. Stories 2.1–2.4 stood up the math primitives. This story replaces the body of `scoreSession` in `src/scoring/irt/index.js` with the canonical D3 composition. After 2.5 lands, `make test` STILL exits non-zero (because Epic 1's `parity.test.mjs` runs over the smoke fixture but only n=10 patterns), but ALL frozen tests including `parity.test.mjs` turn green for the first time. Story 2.6a will then add the R-in-CI harness to validate ±0.001 logits parity against R mirt 1.41.x.

## Acceptance Criteria

1. **AC-1 (`scoreSession({ responses, itemParameters, normingStats })` — D3 canonical signature):**
   - Architecture D3 (`architecture.md` §D3, line 450–462) pins the signature: object-arg `scoreSession({ responses, itemParameters, normingStats })`.
   - Returns an object with at minimum: `{ theta, sem, se_total, percentile, iqScale, displayedBand: { lower, upper } }` per D3.
   - Additionally exports epic-narrative aliases on the return object for downstream compat: `seTotal` (camelCase mirror of `se_total`), and `uncertaintyBand` (object with `{ lower, upper }` aliasing `displayedBand`). Future Epic-3 contract test may pin either name; supplying both costs ~10 bytes and avoids re-renaming.
   - Pure: no DOM imports, no global state, no async, no `Math.random`, no `Date.now` (NFR16, NFR17, FR16). Deterministic.

2. **AC-2 (composition pipeline):**
   - Internally:
     ```js
     const quad = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
     const theta = eapEstimate(responses, itemParameters, quad);
     const sem = standardError(theta, responses, itemParameters);
     const se_total = combinedSE(sem, normingStats.se_norming);
     const percentile = thetaToPercentile(theta, normingStats);
     const iqScale = thetaToIqScale(theta, normingStats);
     const displayedBand = {
       lower: theta - 1.96 * se_total,
       upper: theta + 1.96 * se_total,
     };
     ```
   - All four primitives invoked exactly once per `scoreSession` call.

3. **AC-3 (`thetaToPercentile` — standard-normal CDF):**
   - Helper export: `thetaToPercentile(theta, normingStats)` returns the percentile (0–100) corresponding to θ on the standard-normal CDF. For v1 (no norming-sample mean shift), `percentile = 100 · Φ(theta)` where Φ is the standard-normal CDF.
   - Use a pure-JS approximation (Abramowitz & Stegun 7.1.26 or equivalent) — no third-party deps (NFR33). Accuracy ≤ 1e-6 absolute error over θ ∈ [-6, 6].
   - `normingStats` parameter present for future use (Epic 6 may add `meanShift`); for v1 it is ignored.

4. **AC-4 (`thetaToIqScale` — IQ scaling):**
   - Helper export: `thetaToIqScale(theta, normingStats)` returns `Math.round(100 + 15 * theta)` per FR15 / epic narrative line 842.
   - `normingStats` reserved for future norming-sample adjustment; for v1, only `theta` is used.

5. **AC-5 (parity test turns green):**
   - `tests/unit/scoring/irt/parity.test.mjs` — frozen since Story 2.1 — all 6 entries in `tests/golden/vectors-smoke.json` PASS at ±0.001 logits tolerance for both `theta` and `sem`.
   - This is the FIRST story in Epic 2 where the parity test goes green.

6. **AC-6 (determinism):**
   - Two `scoreSession` calls with identical inputs return objects with byte-identical numeric fields (`assert.equal(a.theta, b.theta)`, etc.).

7. **AC-7 (unit tests in `tests/unit/scoring/irt/index.test.mjs`):**
   - File path `tests/unit/scoring/irt/index.test.mjs` (mirror of `src/scoring/irt/index.js`).
   - `node:test` + `node:assert/strict` only.
   - Asserts AT MINIMUM:
     1. **Shape:** return object has all required keys: `theta`, `sem`, `se_total`, `seTotal`, `percentile`, `iqScale`, `displayedBand`, `uncertaintyBand`.
     2. **`seTotal === se_total`** (alias correctness).
     3. **`uncertaintyBand` deep-equal to `displayedBand`** (alias correctness).
     4. **Default normingStats path:** `scoreSession({ responses: [1,1,1], itemParameters: [STD, STD, STD], normingStats: { se_norming: 0 } })` returns `theta` ≈ 1.215838 (smoke fixture entry 0).
     5. **`iqScale` is an integer** in `[55, 145]` for any in-grid theta.
     6. **`percentile` ∈ [0, 100]** for any in-grid theta; `percentile(0) ≈ 50`.
     7. **`displayedBand.lower < theta < displayedBand.upper`** when `se_total > 0`.
     8. **Determinism:** repeated calls produce `===`-equal numeric fields.
     9. **`thetaToPercentile(0, {}) ≈ 50`** (Φ(0) = 0.5).
     10. **`thetaToIqScale(0, {}) === 100`** (round(100 + 15·0) = 100).

8. **AC-8 (`make test` exit code):**
   - All scoring tests including `parity.test.mjs` and the new `index.test.mjs` turn green.
   - Tests outside the scoring domain (CI workflow tests, lint tests, etc. in other epics) may still produce non-zero exits from pre-existing unrelated reasons; this story's success criterion is **all scoring/IRT tests green**.
   - Pre-existing global non-scoring test failures (if any) are out of scope for Story 2-5 and documented as a halt-condition #7 surfaceable to user — not solved here.

9. **AC-9 (`make lint` exits 0 + budget honored):**
   - ESLint clean.
   - `node tools/lint-cognitive-load-budget.mjs` exits 0. Budget = 250; post-2.4 = 170 LOC; 2.5 adds ~50–70 LOC (scoreSession body + thetaToPercentile + thetaToIqScale). Total target ≤ 240, leaving headroom for emergency tweaks.

10. **AC-10 (frozen-test integrity):**
    - `tests/unit/scoring/irt/parity.test.mjs` — frozen, MUST NOT be modified (Story 2.6a will swap the fixture, not modify the test).
    - `tests/scaffold/scoring-irt-scaffold.test.mjs` — frozen.
    - `tests/golden/vectors-smoke.json` — frozen.
    - `tests/unit/scoring/irt/{quadrature,likelihood,eap,se}.test.mjs` — frozen (Stories 2.2–2.4).

## Tasks / Subtasks

- [ ] **Task 1 — Implement `scoreSession`** (AC: 1, 2, 6)
  - [ ] Replace stub body in `src/scoring/irt/index.js` `scoreSession` function with D3 composition.
  - [ ] Use destructured input `{ responses, itemParameters, normingStats }`.
  - [ ] Build `quad = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] })`.
  - [ ] Compute `theta = eapEstimate(responses, itemParameters, quad)`.
  - [ ] Compute `sem = standardError(theta, responses, itemParameters)`.
  - [ ] Compute `se_total = combinedSE(sem, normingStats.se_norming)`.
  - [ ] Compute `percentile`, `iqScale`, `displayedBand` per AC-2.
  - [ ] Return D3-shaped object + `seTotal` + `uncertaintyBand` aliases.

- [ ] **Task 2 — Implement `thetaToPercentile`** (AC: 3)
  - [ ] Export `thetaToPercentile(theta, normingStats)`.
  - [ ] Implement standard-normal CDF approximation (Abramowitz & Stegun 7.1.26 or `erfApprox`-based).
  - [ ] Return `100 * Φ(theta)`.
  - [ ] Validate `theta` finite; throw `RangeError` otherwise.

- [ ] **Task 3 — Implement `thetaToIqScale`** (AC: 4)
  - [ ] Export `thetaToIqScale(theta, normingStats) → Math.round(100 + 15 * theta)`.
  - [ ] Validate `theta` finite; throw `RangeError` otherwise.

- [ ] **Task 4 — Author unit tests** (AC: 7)
  - [ ] Create `tests/unit/scoring/irt/index.test.mjs` covering all 10 AC-7 assertions.
  - [ ] Use only `node:test`, `node:assert/strict`, sibling-relative imports.

- [ ] **Task 5 — Run full local pipeline** (AC: 5, 8, 9, 10)
  - [ ] `make lint` → 0.
  - [ ] `node tools/lint-cognitive-load-budget.mjs` → 0; record post-2.5 LOC.
  - [ ] `node --test tests/unit/scoring/irt/parity.test.mjs` → green (6/6 entries pass).
  - [ ] `node --test tests/unit/scoring/irt/index.test.mjs` → green.
  - [ ] All other scoring tests still green.
  - [ ] Confirm frozen tests + fixtures byte-identical.

## Dev Notes

### Standard-normal CDF approximation (Abramowitz & Stegun 7.1.26)

```js
// Φ(x) ≈ 1 - φ(x) * (a1*k + a2*k² + a3*k³ + a4*k⁴ + a5*k⁵)
// where k = 1 / (1 + 0.2316419 * |x|), φ(x) = exp(-x²/2)/√(2π).
// For x < 0, use symmetry: Φ(x) = 1 - Φ(-x).
function standardNormalCdf(x) {
  if (!Number.isFinite(x)) throw new RangeError(...);
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const k = 1 / (1 + 0.2316419 * ax);
  const phi = Math.exp(-0.5 * ax * ax) / Math.sqrt(2 * Math.PI);
  const poly = k * (0.319381530 + k * (-0.356563782 + k * (1.781477937 +
              k * (-1.821255978 + k * 1.330274429))));
  const cdf = 1 - phi * poly;
  return sign === 1 ? cdf : 1 - cdf;
}
```

Accuracy: ≤ 7.5e-8 absolute error over the real line (per A&S). Well under 1e-6 target.

### Why both `displayedBand` (D3) and `uncertaintyBand` (epic narrative)?

D3 line 459: `displayedBand: { lower: theta - 1.96 * se_total, upper: theta + 1.96 * se_total }`.

Epic narrative line 841: `uncertaintyBand: { percentileLow, percentileHigh, iqScaleLow, iqScaleHigh }`.

These describe DIFFERENT shapes — D3 is θ-space; epic narrative is percentile/iqScale-space. For Story 2.5 we honor D3 as the **structural anchor** (`displayedBand` with `{ lower, upper }` in θ-space), and add `uncertaintyBand` as an alias to the SAME `{ lower, upper }` object. Epic 6's score-panel can compute percentile/iqScale bands at render time by passing `displayedBand.lower` / `.upper` through `thetaToPercentile` / `thetaToIqScale`. This avoids hard-coding "what does displayed range mean" into Story 2.5 and lets Epic 6 decide the rendering contract.

### scoreSession redundant quad construction

`scoreSession` builds `quad` once and passes it to `eapEstimate` (which uses it). But `standardError` per Story 2.4 builds its OWN quad internally. So `scoreSession` runs `quadraturePoints` twice per call (once explicitly, once inside `standardError`). Story 2.4's self-review flagged this as a deferred optimization (~10μs cost, negligible). For Story 2.5 we accept the cost; Story 2.6b's parity test (n=1000) will surface a measurable cost if it matters.

### Frozen-test contract — what 2.5 does NOT do

- ❌ Modify `tests/unit/scoring/irt/parity.test.mjs` (frozen). Story 2.5 turns it green by implementing `scoreSession`, not by changing the test.
- ❌ Modify the smoke fixture.
- ❌ Add R-in-CI harness — Story 2.6a.
- ❌ Populate `METHODOLOGY_CLAIMS.json` — Story 2.7.

### Existing repo state (post-2.4)

- All four primitives real (`quadrature.js`, `likelihood.js`, `eap.js`, `se.js`).
- `src/scoring/irt/index.js` — re-exports + `scoreSession` stub at line 14 (`throw new TypeError("Not implemented")`).
- Parity test red, failing at `index.js:14`.
- Budget 170/250 post-2.4.

### Previous story (2.4) intelligence

- Engineer chose to build `quad` internally inside `standardError` (D3 signature-fidelity). Story 2.5 lives with the redundant build; documented as deferred opt.
- Memory lesson 2026-05-19-001 (frozen-test integrity) — still relevant. parity.test.mjs is FROZEN; turning it green is by implementing scoreSession, not editing the test.
- Engineer used `Math.sqrt(a*a + b*b)` directly in `combinedSE` (not `Math.hypot`) — keep style consistent in `scoreSession`'s `displayedBand` calc.

### Project Structure Notes

- **Modified files** (this story changes):
  - `src/scoring/irt/index.js` (stub → real impl + add 2 helper exports)

- **New files** (this story creates):
  - `tests/unit/scoring/irt/index.test.mjs`

- **Untouched** (must not modify):
  - All other `src/scoring/irt/*.js`.
  - All frozen test files (parity, scaffold, smoke fixture, quadrature/likelihood/eap/se test files).

### References

- Story 2.4 — [2-4-implement-se-js-standard-error-from-posterior-variance.md](2-4-implement-se-js-standard-error-from-posterior-variance.md)
- Epic 2 narrative §2.5 — [epics.md#L831-L852](../planning-artifacts/epics.md#L831-L852)
- Architecture D3 — [architecture.md#L438-L462](../planning-artifacts/architecture.md#L438-L462)
- FR15 (uncertainty-band, IQ scale, percentile) — [prd.md](../planning-artifacts/prd.md)
- NFR16/17 (pure functions) — [prd.md](../planning-artifacts/prd.md)
- NFR33 (zero runtime deps; standard-normal CDF pure JS) — [prd.md](../planning-artifacts/prd.md)
- Abramowitz & Stegun 7.1.26 — standard-normal CDF approximation (public domain).
- BUDGETS.json `scoring-irt-lines` (250 LOC cap) — [BUDGETS.json](../../BUDGETS.json)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
