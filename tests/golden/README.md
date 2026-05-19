# Golden vectors — IRT 2PL EAP parity reference

This directory holds the IRT 2PL EAP θ + SE reference values that anchor the parity claim "JS scoring engine validated against R mirt 1.41.x to ±0.001 logits" (FR14, NFR22, NFR26).

## Files

| File | Source | Purpose |
|---|---|---|
| `vectors-smoke.json` | JS engine (Story 2.5) | The smoke-set fixture. 6 hand-picked response patterns. The "expected" side of the parity test. |
| `r-output-smoke.json` | R mirt (Story 2.6a CI) | R-derived θ + SE for the same 6 patterns. The "actual" side of the parity test. Generated on demand by the `golden-regen` workflow. |
| `regenerate.R` | R script | Generates `r-output-smoke.json` from `vectors-smoke.json` using `mirt::fscores(method="EAP", quadpts=61, theta_lim=c(-6,6))` with `set.seed(20260514)`. |
| `parity-audit.mjs` | Node script | Compares `vectors-smoke.json` (JS) vs `r-output-smoke.json` (R) at ±0.001 logits tolerance. Exits non-zero on divergence. |
| `CHANGELOG.md` | Markdown log | Audit history of `vectors-smoke.json` value evolution (placeholder → JS regen → R audit). |

## Pinned versions (NFR22)

- **R:** 4.4.x
- **mirt:** 1.41.x
- **Seed:** `set.seed(20260514)`
- **Quadrature:** `quadpts = 61`, `theta_lim = c(-6, 6)`

## How to run the parity audit locally

Requires R 4.4.x + mirt 1.41.x + Node 22.x installed.

```bash
Rscript tests/golden/regenerate.R --smoke
node tests/golden/parity-audit.mjs
```

Pass → audit prints `parity-audit: ok (6 entries; max θ drift X; max SE drift Y)` to stdout, exit 0.

Fail → per-entry drift report to stderr, exit 1.

## How to run via CI

The `golden-regen` workflow at `.github/workflows/golden-regen.yml` fires on:

1. **Manual dispatch** — GitHub UI → Actions → `golden-regen` → "Run workflow". Use for periodic audits or after any change to `src/scoring/irt/*.js`.
2. **`regen-goldens` PR label** — add the `regen-goldens` label to a PR; the workflow runs and posts the result. Use when reviewing a PR that touches scoring math or quadrature.

The workflow uploads `r-output-smoke.json` as a build artifact so PR reviewers can inspect the R-derived values directly.

## Audit history (see CHANGELOG.md for full timeline)

| Version | Date | Story | Status |
|---|---|---|---|
| v0.1 | 2026-05-19 | Story 2.1 | Hand-authored placeholder values; not numerically authoritative. Story 2.1 spec line 290 explicitly admitted this and deferred R regen to this story (2.6a). |
| v0.2 | 2026-05-19 | Story 2.5 | Regenerated against the JS scoring engine post fixture-audit (`/tmp/check-eap*.mjs` traces; N=10000 independent integration confirmed JS engine correctness; original placeholders did not match any standard EAP method). Self-consistent, but not third-party-validated. |
| v1.0 | (Story 2.6a CI run) | Story 2.6a | R-mirt parity audit. First CI dispatch lands here. Outcomes: |
|  |  |  | **Match (≤1e-3 logits):** v0.2 confirmed; parity claim holds. |
|  |  |  | **Small drift (>1e-3, ≤1e-2):** rounding artifact or grid-method nuance; defer to 2.6b full set. |
|  |  |  | **Large drift (>1e-2):** material divergence; audit-win per Story 2.1 spec line 153; investigate quadrature method. |

If `parity-audit.mjs` ever fails on a PR after v1.0, it indicates one of:
- A JS-engine drift (recent change to `src/scoring/irt/*.js`).
- A mirt version drift (CI cache invalidation pulled a different mirt build).
- A `set.seed` propagation bug (mirt internals dispatched on RNG state differently).

Investigate before merging. Do NOT update `vectors-smoke.json` to make the audit pass — that masks the signal.

## References

- Story 2.1 — original spec + placeholder admission: [_bmad-output/implementation-artifacts/stories/2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md](../../_bmad-output/implementation-artifacts/stories/2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md) (see line 290)
- Story 2.5 — JS-engine regen + audit pointer: [_bmad-output/implementation-artifacts/stories/2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade.md](../../_bmad-output/implementation-artifacts/stories/2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade.md)
- Story 2.6a — this story (harness landing): [_bmad-output/implementation-artifacts/stories/2-6a-r-in-ci-harness-smoke-golden-vector-set-n-10.md](../../_bmad-output/implementation-artifacts/stories/2-6a-r-in-ci-harness-smoke-golden-vector-set-n-10.md)
- Architecture NFR22 — R mirt pin canon
- Architecture D7 — `r-lib/actions/setup-r@v2` + `setup-r-dependencies@v2` pin pattern
