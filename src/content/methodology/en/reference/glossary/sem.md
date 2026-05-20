---
title: "SEM (standard error of measurement)"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# SEM (standard error of measurement)

The standard error of measurement, or SEM, is the part of a score's noise that comes from the test itself. A 16-item screening session leaves room for response noise; the SEM summarises how wide that noise is.

In IQ-ME, the SEM is computed from the posterior variance of the ability estimate produced by the scoring model. A small SEM means the responses pin the estimate tightly; a large SEM means the responses leave the estimate more uncertain.

The SEM is one half of the uncertainty band shown on the result page. The other half is the norming-sample uncertainty. The two combine as a root-sum-square: `SE_total = sqrt(SEM² + SE_norming²)`. The displayed band uses `SE_total` projected onto the IQ-scale.

A test-taker who sees `124 ± 7` should read the band as: the true latent score is plausibly somewhere between 117 and 131 at roughly 95 percent confidence. The midpoint is the best single estimate; the range is the honest signal.
