---
title: "The IRT 2-parameter logistic model"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts:
  - "irt-2pl-model"
glossaryRefs: []
sourceHashEN: "35f151c85951d1356f35cf8696c65e67da0a42a78cd466836fc80ba81f65b7db"
translationStatus: "in-progress"
---

# The IRT 2-parameter logistic model

IQ-ME scores responses using the 2-parameter logistic model from item response theory, or 2PL IRT for short. The model is one of the most widely used in psychometrics.

The model says the chance of a correct answer on an item depends on two things. The first is the test-taker's ability. The second is the item's properties.

The formula is: `P(correct | theta, a, b) = 1 / (1 + exp(-a(theta - b)))`.

Here `theta` is the test-taker's ability on a latent scale. The scale is centred at zero. Higher numbers mean higher ability. The parameter `a` is the item's discrimination. The parameter `b` is the item's difficulty. Both come from the calibration data for the ICAR-MR pool.

A higher `a` means the item separates abler test-takers from less able ones more sharply. A higher `b` means the item is harder. Two test-takers of equal ability still produce different answers because of response noise; the model accounts for that noise by predicting probabilities, not certainties.

The model is one of many possible scoring models. It was chosen because it is well-studied, has known limits, and produces estimates that align with the broader psychometric literature. The engine source at `src/scoring/irt/likelihood.js` implements the formula directly. A skeptic can read the source and verify the math in under ten minutes.
