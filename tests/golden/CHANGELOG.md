# Golden vectors changelog

Audit-trail for `tests/golden/vectors-smoke.json`, `tests/golden/vectors.json`, and their R-mirt counterparts `tests/golden/r-output-smoke.json` / `tests/golden/r-output-full.json` (produced by the `golden-regen` CI workflow).

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

## v1.0 — 2026-05-19 — R-mirt parity validation (smoke set)

**Outcome: MATCH.** Validated against R mirt 1.41.x on 2026-05-19, max θ drift 0.000000, max SE drift 0.000000 (6 decimal places of agreement on all 6 smoke entries), `set.seed(20260514)`, R 4.4.3 on Ubuntu 24.04 runner. v0.2 JS-engine fixture third-party-validated.

**Provenance:**
- First dispatch ([run 26109361027](https://github.com/Bulrock/IQ-ME/actions/runs/26109361027)) failed at the R regen step: `Too few degrees of freedom. There are only 1 degrees of freedom but 2 parameters were freely estimated.` Diagnosis: `tests/golden/regenerate.R` called `mirt()` once just to extract a parameter template via `mod2values()`, which triggered an EM fit. Smoke entries 2/3/5 (`nItems=1`) gave 1 DoF for 2 free 2PL params.
- Hotfix PR #5 (commit 4b0f51c) replaced the initial fit with `mirt(..., pars="values")` which returns the parameter data frame without estimation.
- Validation dispatch from main ([run 26110362511](https://github.com/Bulrock/IQ-ME/actions/runs/26110362511)) succeeded with bit-perfect parity.

**SHA256 of `r-output-smoke.json` (uploaded artifact):**
```
ff62bd5d98330c5fd2f8ebbb9985bca746035a13d765a857f46c029add0b3458
```

Reproduce: `Rscript tests/golden/regenerate.R --smoke && shasum -a 256 tests/golden/r-output-smoke.json` on R 4.4.x + mirt 1.41.x should print the same hash.

## v2.0 — 2026-05-19 — Story 2.6b: Full ≥1000-pattern golden set (JS-derived)

Story 2.6b landed:
- `tools/generate-full-vectors.mjs` — deterministic Mulberry32 PRNG (seed `20260514`) generating 1000 random response patterns.
- `tests/golden/vectors.json` — committed 1000-entry fixture, sorted by SHA256(entry) for byte-stable diffs.
- `tests/unit/scoring/irt/parity-full.test.mjs` — iterates all 1000 entries, asserts ±0.001 logits parity, completes in ≤21ms (well under NFR26's 5s budget).
- `pr-checks.yml` `golden-vector-parity` job activated — runs `parity-full.test.mjs` on every PR.
- `regenerate.R --full` + `parity-audit.mjs --full` + `golden-regen.yml` mode-switch landed for the R-side audit.

**Generation parameters:**
- Seed: 20260514 (Mulberry32, 32-bit)
- Pattern count: 1000
- Response length distribution: uniform [1, 16]
- Item parameter `a`: uniform [0.5, 2.5], rounded to 3 decimals
- Item parameter `b`: uniform [-3, 3], rounded to 3 decimals
- Response distribution: random binary (uniform [0, 1])
- `expectedTheta` / `expectedSE`: computed via `scoreSession` from the JS engine; 6-decimal precision.

**SHA256 of `tests/golden/vectors.json` (this version):**
```
a8b2653a82b9c3c121b6f4cd4d374375afc5df3ac10cda7b37f2564252d89f92
```

Reproduce locally: `node tools/generate-full-vectors.mjs --out=tests/golden/vectors.json && shasum -a 256 tests/golden/vectors.json` should print the same hash. If the hash differs, either:
- The JS engine changed (`src/scoring/irt/*.js` diff since 2026-05-19).
- The generator's PRNG or distribution parameters changed.
- Node's `Math.imul` or floating-point produced different results (extremely unlikely cross-platform on a modern Node 22.x runtime).

**Status:** JS-engine-derived, NOT yet third-party-validated. The PR-check `golden-vector-parity` guards against JS-engine regressions; R-mirt parity validation for the full set is deferred to the first post-merge `golden-regen --mode=full` dispatch.

## v2.1 — 2026-05-19 — R-mirt validation of full set

**Outcome: MATCH.** Validated against R mirt 1.41.x on 2026-05-19, max θ drift 0.000000, max SE drift 0.000000 (6 decimal places of agreement on all 1000 full-set entries), `set.seed(20260514)`, R 4.4.3 on Ubuntu 24.04 runner. v2.0 JS-engine fixture third-party-validated.

**Provenance:** Dispatched from main concurrently with the v1.0 smoke run ([run 26110365788](https://github.com/Bulrock/IQ-ME/actions/runs/26110365788)). Same hotfix (PR #5 / commit 4b0f51c) that fixed the smoke DoF error applied — the 1000-pattern set includes patterns of length 1 sampled from uniform [1, 16], so the same fix was required for full to succeed.

**SHA256 of `r-output-full.json` (uploaded artifact):**
```
fc1c43d0622818c78d51420c6afe2e216c687bbc75765ef4bb114db5229cc720
```

Reproduce: `Rscript tests/golden/regenerate.R --full && shasum -a 256 tests/golden/r-output-full.json` on R 4.4.x + mirt 1.41.x should print the same hash.

**Notes for future maintainers:** bit-perfect 6-decimal parity across 1000 randomized patterns is stronger than the ±0.001 logits claim in earlier docs. The actual JS-engine vs R-mirt 1.41.x agreement is at floating-point precision after the 6-decimal rounding applied by both sides. If a future regen produces drift > 0, investigate immediately — the expected baseline is identity, not approximate match.

## Reproducibility

For any v1.0+ entry, a third party with R 4.4.x + mirt 1.41.x installed should be able to:

```bash
Rscript tests/golden/regenerate.R --smoke
sha256sum tests/golden/r-output-smoke.json
```

And get the SHA256 recorded in the CHANGELOG entry for that version. If the SHA differs, either the R/mirt versions don't match or `set.seed` propagation is broken on the local R install.
