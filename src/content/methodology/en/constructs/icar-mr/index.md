---
title: "ICAR-MR — the item pool"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# ICAR-MR — the item pool

ICAR-MR is the public item pool IQ-ME draws from. ICAR stands for the International Cognitive Ability Resource. It was developed by an academic group at Northwestern University and Open Source Psychometrics.

The group built the pool to offer license-free items for cognitive research. Most cognitive items are licensed. Researchers cannot use them freely in open work. ICAR is the rare exception.

The pool has calibration data. The license permits reuse. The group maintains it.

IQ-ME uses 16 ICAR-MR items per session. The full pool is larger than 16. The screener draws items from the pool by a fixed rule.

Two test-takers who start at the same instant get the same items. Two sessions from one test-taker at different times get different draws.

The license attribution lives on the ICAR-license page. The license itself is pending the Gate-9a sign-off from the ICAR maintainers. The screener treats that gate as load-bearing for release.

The item-selection algorithm is described in the scoring section. The short version: items span a range of difficulty. A 16-item session pins ability with good precision in the middle of the range. The session has broader uncertainty at the tails. The full procedure lives in the scoring engine source.
