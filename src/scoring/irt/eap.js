// Story 2.3 — EAP (Expected A Posteriori) θ estimation.
// Posterior-weighted mean over the quadrature grid using log-domain
// stabilization to avoid underflow at long response vectors (16+ items).
// Architecture D3 canonical signature: eapEstimate(responses, itemParameters, quad).

import { posteriorExpectation } from "./posterior.js";

export function eapEstimate(responses, itemParameters, quad) {
  return posteriorExpectation(responses, itemParameters, quad, (node) => node);
}
