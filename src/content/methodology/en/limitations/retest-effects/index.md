---
title: "Retest effects — what taking the test again means"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# Retest effects — what taking the test again means

A test-taker who takes IQ-ME more than once will typically see their score rise on the second session. This is a retest effect: the same person, with the same underlying ability, scores higher because they have learned the matrix-item format and possibly remembered some of the specific items.

The retest effect is not a feature of the screener. It is a property of human pattern recognition: people get faster and more accurate at a task they have seen before. The first session is the cleanest measurement; subsequent sessions are progressively contaminated by practice.

The honest path is to take the screener once and trust the first result. A test-taker who is unsatisfied with a first result has several better options than retesting: read the methodology more carefully (the result is one estimate, not a measurement of worth); consult a clinician if there is a concern about cognitive functioning; treat the score as one small signal and weight it accordingly.

## No technical cooldown enforced

IQ-ME does not enforce a technical cooldown between sessions. There is no server-side history, no per-IP throttle, no localStorage gate that prevents a same-day retake.

The design choice is deliberate. A static, telemetry-free app cannot reliably enforce a cooldown. A localStorage flag is cleared by clearing browser data. An IP-based check is defeated by switching networks. Enforcing a cooldown technically would be theatre; the screener does not pretend.

What the screener does instead is document the retest effect honestly on this page, link this page from the result page's retest-note section, and trust the test-taker to act on the information. The screener is a methodology surface, not a compliance system.

A test-taker who has taken the screener before and is taking it again should weight the new score against the practice effect. A test-taker who has taken it many times before should treat any new score as an upper-bound estimate of their ability, not a measurement.
