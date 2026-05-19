---
title: "What a percentile means"
version: "0.1.0"
lastReviewed: "2026-05-19"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts:
  - "percentile-from-standard-normal-cdf"
glossaryRefs:
  - "percentile"
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
pending: true
---

# What a percentile means

Your percentile is a ranking. It places your score relative to a reference group of test-takers, on a scale from 0 to 100.

A percentile of 58 means roughly 58 out of every 100 similar test-takers scored at or below your score. A percentile of 5 places your score near the bottom of the reference group. A percentile of 95 places it near the top.

Percentiles compress a continuous score onto a familiar ranking scale. The underlying score is a latent-ability estimate from item response theory; the percentile is a transform of that estimate through the standard-normal cumulative distribution function. The formula is `percentile = 100 × Φ(theta)`, where `theta` is your ability estimate and `Φ` is the standard-normal CDF.

The reference group matters. This percentile is computed against a norming sample drawn from the SAPA project, which over-represents literate, online, English-speaking adults. If your background differs from that sample, your percentile estimate is less precise than the same score from a closer-matching sample.

A percentile is not a verdict. It is a ranking against one specific group, computed with one specific method, on one short screening test. Two test-takers who differ by one percentile point are not meaningfully different in ability; the measurement noise is wider than that.

You can read about how the underlying ability score is computed, and how it is converted to an IQ-scale anchor, on the other scoring pages in this corpus.

[Back to IQ-ME](/)
