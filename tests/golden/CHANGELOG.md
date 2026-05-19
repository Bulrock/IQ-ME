# Golden vectors changelog

Audit-trail for `tests/golden/vectors-smoke.json` and (post-2.6a CI dispatch) `tests/golden/r-output-smoke.json`.

## v0.1 — 2026-05-19 — Story 2.1: hand-authored placeholders

Initial commit of `vectors-smoke.json` with 6 entries (all-correct, all-wrong, single-correct, single-wrong, symmetric-mixed, high-discrimination). Per Story 2.1 spec line 290:

> Numeric values are placeholders; R-mirt regen deferred to story 2.6a per spec.

The hand-picked patterns are structurally sound (give 2.2–2.5 a real assertion shape) but their `expectedTheta` / `expectedSE` values were **never** numerically verified against R mirt or paper arithmetic. Story 2.1 spec lines 150–153 + 233 explicitly defer numeric verification to this changelog's v1.0 entry.

## v0.2 — 2026-05-19 — Story 2.5: regenerated against JS engine post fixture-audit

During Story 2.5 implementation (`scoreSession` facade), the parity test failed on 4 of 6 smoke entries with systematic θ drift ~30% smaller than expected. Investigation (`/tmp/check-eap*.mjs` traces):

1. Entry 4 (`[1,1,0,0]` with symmetric items b=[-1,-0.5,0.5,1]) produced θ ≈ -1.85e-17 — effectively 0.0, matching expected within machine epsilon. **Story 2.2's quadrature is correct.**
2. N=10000 independent high-resolution numerical integration produced the SAME values our quadpts=61 impl did (0.923 for entry 0, not 1.216). The 1.216 expected value is NOT EAP with standard-normal prior at any grid resolution.

Conclusion: the v0.1 placeholder values were inconsistent (entry 4 looked EAP-derived, entries 0/1/5 did not). Per Story 2.1's deferred-to-2.6a design, the fixture was regenerated against the JS scoring engine to unblock Story 2.5 dev:

```bash
node /tmp/regen-smoke.mjs   # generates fresh JS-derived θ + SE for the 6 entries
```

Story 2.5 also unfroze + ratified `tests/unit/scoring/irt/index.test.mjs` AC-7.4 (which hardcoded the placeholder 1.215838 → updated to 0.922944) via `tds story unfreeze-tests` + `tds integrity record`.

**v0.2 status:** self-consistent, NOT third-party-validated. The parity claim "JS engine validated against R mirt to ±0.001 logits" is NOT yet anchored — it requires Story 2.6a's R-in-CI audit.

## v1.0 — (pending Story 2.6a first CI dispatch) — R-mirt parity validation

Story 2.6a lands `.github/workflows/golden-regen.yml` + `tests/golden/regenerate.R` + `tests/golden/parity-audit.mjs`. The first CI dispatch will produce `tests/golden/r-output-smoke.json` (R mirt 1.41.x output for the same 6 patterns) and run `parity-audit.mjs` against `vectors-smoke.json`.

**Outcomes** (this entry updated by a follow-up commit after first dispatch):

- **Match (max drift ≤ 1e-3 logits):** v0.2 fixture confirmed by R mirt 1.41.x. Parity claim third-party-validated. Record: `validated against R mirt 1.41.x on <date>, max θ drift X, max SE drift Y, set.seed(20260514)`.
- **Small divergence (1e-3 < max drift ≤ 1e-2):** likely 6-decimal rounding or minor grid-method nuance. Document specifics; defer resolution to Story 2.6b's full 1000-pattern set (will surface whether systematic).
- **Large divergence (max drift > 1e-2):** material methodology difference. Story 2.1 spec line 153 anticipated this as an audit-win. File a bridge story to investigate quadrature method choice (linear-grid + φ-weights vs true Gauss-Hermite roots+weights).

**The v1.0 stamp lands when the first CI dispatch completes**, not when Story 2.6a merges.

## v2.0 — (pending Story 2.6b) — Full ≥1000-pattern golden set

Story 2.6b will expand `vectors-smoke.json` (or replace with `vectors-full.json` of equivalent shape) to ≥1,000 R-mirt-generated patterns. CHANGELOG entry will record:

- Generation seed + R/mirt versions + quadrature pins.
- Pattern distribution (item-count histogram, discrimination/difficulty coverage).
- SHA256 hash of the regenerated file for reproducibility.

## Reproducibility

For any v1.0+ entry, a third party with R 4.4.x + mirt 1.41.x installed should be able to:

```bash
Rscript tests/golden/regenerate.R --smoke
sha256sum tests/golden/r-output-smoke.json
```

And get the SHA256 recorded in the CHANGELOG entry for that version. If the SHA differs, either the R/mirt versions don't match or `set.seed` propagation is broken on the local R install.
