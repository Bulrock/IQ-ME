// Story 2.4 — posterior SE (standard error of EAP) + RSS combiner.
// Architecture D3 canonical name: standardError(theta, responses, itemParameters).
// SE_total = √(SEM² + SE_norming²) per FR15 — combinedSE.
// Numerical stability: log-domain M-shift, identical to Story 2.3 eap.js.

import { posteriorExpectation } from "./posterior.js";
import { quadraturePoints } from "./quadrature.js";

export function standardError(theta, responses, itemParameters) {
  const quad = quadraturePoints({
    quadpts: 61,
    theta_lim: [-6, 6],
  });
  const variance = posteriorExpectation(
    responses,
    itemParameters,
    quad,
    (node) => (node - theta) ** 2,
  );
  return Math.sqrt(variance);
}

export function combinedSE(sem, seNorming) {
  if (
    !Number.isFinite(sem) ||
    !Number.isFinite(seNorming) ||
    sem < 0 ||
    seNorming < 0
  ) {
    throw new RangeError(
      `combinedSE requires non-negative finite numbers (got sem=${sem}, seNorming=${seNorming})`,
    );
  }
  return Math.sqrt(sem * sem + seNorming * seNorming);
}

export { standardError as posteriorSE };
