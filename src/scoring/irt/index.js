// Story 2.1 — public surface for the IRT scoring engine.
// Architecture D3: named re-exports only; scoreSession facade lands in Story 2.5.

export { quadraturePoints } from "./quadrature.js";
export { logLikelihood } from "./likelihood.js";
export { eapEstimate } from "./eap.js";
export { standardError } from "./se.js";

export function scoreSession({ responses, itemParameters, normingStats }) {
  throw new TypeError("Not implemented");
}
