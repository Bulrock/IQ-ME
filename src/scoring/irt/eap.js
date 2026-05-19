// Story 2.3 — EAP (Expected A Posteriori) θ estimation.
// Posterior-weighted mean over the quadrature grid using log-domain
// stabilization to avoid underflow at long response vectors (16+ items).
// Architecture D3 canonical signature: eapEstimate(responses, itemParameters, quad).

import { logLikelihood } from "./likelihood.js";

export function eapEstimate(responses, itemParameters, quad) {
  if (
    !quad ||
    !Array.isArray(quad.nodes) ||
    !Array.isArray(quad.weights) ||
    quad.nodes.length === 0 ||
    quad.nodes.length !== quad.weights.length
  ) {
    throw new RangeError(
      "quad must be { nodes: [], weights: [] } with same non-zero length",
    );
  }

  const { nodes, weights } = quad;
  const n = nodes.length;

  // Compute logL at each node (logLikelihood validates responses/items + throws RangeError).
  const logL = new Array(n);
  let M = -Infinity;
  for (let i = 0; i < n; i++) {
    const l = logLikelihood(nodes[i], itemParameters, responses);
    logL[i] = l;
    if (l > M) M = l;
  }

  // posterior_i = exp(logL_i - M) * weights[i]; numerator = Σ nodes[i] * posterior_i.
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const post = Math.exp(logL[i] - M) * weights[i];
    num += nodes[i] * post;
    den += post;
  }

  return num / den;
}
