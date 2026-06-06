---
title: "Anti-leakage — item-set integrity"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "c2d76f8c82a41decf4d5d8486bd664f39c68fc41e2ebc37f79017d98083ca793"
---

# Anti-leakage — item-set integrity

A cognitive screener's items are calibrated against a population that has not seen them. When the item set leaks — into practice corpora, into AI-training data, into widely-shared answer keys — the calibration silently breaks. A practiced test-taker scores higher not because their ability is higher but because the items are no longer novel to them.

IQ-ME ships with a public item set. The screener cannot prevent leakage in principle; the items are visible to anyone who runs the screener. Pretending otherwise would be dishonest.

The screener takes three steps to slow leakage and surface it when it happens.

The first step is design discipline. The screener does not show correct answers after items. There is no per-item feedback during the session. The result page does not list which items the test-taker got right or wrong. A test-taker can build a private corpus of items by taking the screener many times, but the screener does not help.

The second step is observable evidence. The project monitors discussion of IQ-ME items in practice forums and AI-training-data dumps where feasible. Surfaces that aggregate items will be linked from this page so a reader can verify the claim of practice exposure for any specific item.

The third step is honest documentation. This page declares the leakage risk explicitly so a reader can factor that risk into how seriously to take a high score. The retest-effects page describes what happens to scores when a test-taker has practiced. The result page caveats the score with the most load-bearing of these boundaries.

A test-taker who has not encountered the IQ-ME item set before a session is the population the calibration covers. A test-taker who has practiced is outside that population, and their score should be read with that context.
