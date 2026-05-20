---
title: "Golden vectors — reference-implementation parity"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts:
  - "golden-vector-parity-0001-logits"
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# Golden vectors — reference-implementation parity

A scoring engine is only as good as a skeptic can verify. IQ-ME's scoring engine is checked against an independent reference implementation on every CI run. The check is called golden-vector parity.

The reference implementation lives in R. It uses the `mirt` package version 1.41.x running on R 4.4.x. The package is the most widely used IRT implementation in academic psychometrics. The mirt source is open and peer-reviewed.

The check works by simulating 1000 response patterns through both engines. The JavaScript engine in IQ-ME and the R reference engine both compute theta estimates for the same input. The two sets of estimates are compared element-wise. The parity tolerance is `0.001 logits`. A larger drift fails CI.

The seed for the simulated patterns is fixed: `set.seed(20260514)`. The seed pins the input data. Two runs of CI compute the same theta estimates from the same input. The byte-stable build harness (Story 1.8 / Story 4.2) extends this to the rendered methodology corpus.

The golden-vector data lives at `tests/golden/vectors.json`. The R regeneration script is at `tests/golden/regenerate.R`. A skeptic can install R, install mirt, run `Rscript tests/golden/regenerate.R`, and produce byte-identical golden vectors. The byte-identicality is a property of the seed and the deterministic-build discipline, not of the host machine.

Innovation pillar #5 of the project — no-build auditable IRT — is verifiable through this gate. A reader with only `node` installed can run `node --test tests/unit/scoring/irt/*.test.mjs` and confirm parity in under five minutes. A reader with `R` installed can run the regeneration script and confirm the reference data has not drifted.
