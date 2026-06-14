// Shared log-domain posterior expectation used by EAP and posterior SE.

import { logLikelihood } from "./likelihood.js";

export function posteriorExpectation(responses, itemParameters, quad, transform) {
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
  const logLikelihoods = nodes.map((node) => logLikelihood(node, itemParameters, responses));
  const maxLogLikelihood = Math.max(...logLikelihoods);
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < nodes.length; i++) {
    const posterior = Math.exp(logLikelihoods[i] - maxLogLikelihood) * weights[i];
    numerator += transform(nodes[i]) * posterior;
    denominator += posterior;
  }

  return numerator / denominator;
}
