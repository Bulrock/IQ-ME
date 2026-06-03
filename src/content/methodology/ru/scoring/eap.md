---
title: "EAP estimation — turning responses into a score"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-ru-reviewer"
asserts:
  - "eap-estimation-method"
  - "quadpts-61"
  - "theta-lim-pm-6"
  - "prior-standard-normal"
glossaryRefs: []
sourceHashEN: "c2a8dd3b6f6385874ab1eb7642c620b734324658229ee142ecd72c81fa120a69"
translationStatus: "in-progress"
---

# EAP estimation — turning responses into a score

After a session of 16 responses, IQ-ME computes the test-taker's ability with expected a posteriori estimation, or EAP. EAP is a Bayesian method. It produces a point estimate and a measure of how uncertain that estimate is.

The formula is: `theta_EAP = sum_i nodes[i] * L(nodes[i] | r) * weights[i] / sum_i L(nodes[i] | r) * weights[i]`.

The intuition: the engine considers a set of candidate ability values along the theta scale. For each candidate, it computes the likelihood that the test-taker's pattern of responses came from someone at that ability. It then takes a weighted average of the candidates. The weights combine the likelihood with a prior on what ability values are plausible at all.

Three numerical choices pin the implementation down. The first is the number of candidate ability values, called quadrature points. IQ-ME uses `quadpts = 61`. The second is the range those candidates span. IQ-ME uses `theta_lim = [-6, 6]` — six standard deviations either side of the mean covers the full plausible ability range. The third is the prior. IQ-ME uses the standard normal: `weights[i] = phi(nodes[i]) / sum_j phi(nodes[j])`, where `phi` is the standard-normal PDF.

The standard-normal prior assumes the population's ability is distributed normally around the mean. That assumption is approximately true for the SAPA reference sample. It is exactly true on the scale the model defines.

The engine source at `src/scoring/irt/eap.js` and `src/scoring/irt/quadrature.js` implements EAP and the supporting quadrature. A skeptic can run the unit tests at `tests/unit/scoring/irt/eap.test.mjs` and confirm the implementation matches the math.
