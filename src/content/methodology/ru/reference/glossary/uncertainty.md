---
title: "Uncertainty"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-ru-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "e88b14310786190a6f6dc85e1bd7574b144aff7f7f617babb3158d0f79cd677e"
translationStatus: "in-progress"
---

# Uncertainty

Uncertainty in IQ-ME is the band around a score that captures what a single 16-item session can and cannot pin down.

The band combines two sources. The first is test noise, summarised by the SEM. The second is norming-sample noise, summarised by `SE_norming`. The full formula combines them as a root-sum-square: `SE_total = sqrt(SEM² + SE_norming²)`. The displayed band uses `SE_total` projected onto the IQ-scale.

For the v1 build of IQ-ME, `SE_norming` is set to zero. This is a placeholder pending psychometrician sign-off on the norming-sample SE values. The current band therefore reflects test noise only, not norming-sample noise. The band is narrower than the true band by an amount the project cannot yet quantify. The uncertainty page in the scoring section makes this caveat explicit; the page will be updated when the norming SE is finalised.

A score is never a point; it is a region. The band is the honest signal. A test-taker who treats the displayed number as exact is over-claiming the score.
