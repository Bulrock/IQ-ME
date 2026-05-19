# Golden vectors — IRT 2PL EAP parity reference

This directory holds the IRT 2PL EAP θ + SE reference values that anchor the parity claim "JS scoring engine validated against R mirt 1.41.x to ±0.001 logits" (FR14, NFR22, NFR26).

## Files

| File | Source | Purpose |
|---|---|---|
| `vectors-smoke.json` | JS engine (Story 2.5) | Smoke-set fixture. 6 hand-picked response patterns. |
| `vectors.json` | JS engine (Story 2.6b) | Full-set fixture. ≥1000 deterministic random patterns. |
| `r-output-smoke.json` | R mirt (CI smoke mode) | R-derived θ + SE for the 6 smoke patterns. |
| `r-output-full.json` | R mirt (CI full mode) | R-derived θ + SE for ≥1000 full patterns. |
| `regenerate.R` | R script | Generates `r-output-{smoke,full}.json` from the corresponding JS fixture. Modes: `--smoke`, `--full`. |
| `parity-audit.mjs` | Node script | Compares JS vs R at ±0.001 logits tolerance. Modes: `--smoke` (default), `--full`. |
| `CHANGELOG.md` | Markdown log | Audit history of fixture evolution (placeholder → JS regen → full set → R audits). |

## Pinned versions (NFR22)

- **R:** 4.4.x
- **mirt:** 1.41.x
- **Seed:** `set.seed(20260514)`
- **Quadrature:** `quadpts = 61`, `theta_lim = c(-6, 6)`

## How to run the parity audit locally

Requires R 4.4.x + mirt 1.41.x + Node 22.x installed.

### Smoke mode (n=6, fast)

```bash
Rscript tests/golden/regenerate.R --smoke
node tests/golden/parity-audit.mjs --smoke   # --smoke is default
```

### Full mode (n≥1000, slow)

```bash
Rscript tests/golden/regenerate.R --full
node tests/golden/parity-audit.mjs --full
```

Pass → audit prints `parity-audit: ok (N entries; max θ drift X; max SE drift Y)` to stdout, exit 0.

Fail → per-entry drift report to stderr, exit 1.

## Regenerating the JS-derived fixtures

If the JS scoring engine intentionally changes (rare — quadrature method change, prior swap, etc.), regenerate the fixtures locally:

```bash
node tools/generate-full-vectors.mjs --out=tests/golden/vectors.json
# vectors-smoke.json is hand-picked patterns; see CHANGELOG for regen procedure.
```

Then re-run `golden-regen` workflow → CI captures the new R-side audit values. Record the new SHA256 in `CHANGELOG.md`.

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
