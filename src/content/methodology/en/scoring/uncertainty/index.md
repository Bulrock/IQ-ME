---
title: "What the uncertainty band means"
version: "0.1.0"
lastReviewed: "2026-05-19"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts:
  - "se-total-rss"
glossaryRefs:
  - "uncertainty"
  - "sem"
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
pending: true
---

# What the uncertainty band means

Your score is one estimate. The uncertainty band around it shows the range of plausible scores given the precision of the measurement.

We display the band as `±N`. Read it this way: your true latent score is plausibly within roughly N points either way of the displayed number, at approximately 95% confidence.

The band combines two sources of uncertainty. The first is the test itself: a 16-item screening session leaves room for response noise. We summarize this with the standard error of measurement, or SEM, computed from the posterior variance of the ability estimate. The second is the norming sample: the percentile-to-IQ-scale conversion was calibrated against one finite reference group, and that sample has its own uncertainty, called SE_norming.

The full formula combines them: `SE_total = sqrt(SEM² + SE_norming²)`. The band you see on the result panel uses `SE_total` projected onto the IQ scale.

For the v1 build of this screener, `SE_norming` is set to 0. This is a placeholder pending psychometrician sign-off on the norming-sample SE values. The current band therefore reflects test noise only, not norming-sample noise. The displayed band is narrower than the true band by an amount we cannot yet quantify. We will update this page when the norming SE is finalized.

The uncertainty band is the honest signal. A score is never a point; it is a region. A test-taker who sees `124 ± 7` should think of the score as somewhere between 117 and 131, with the displayed value as a midpoint estimate.

[Back to IQ-ME](/)
