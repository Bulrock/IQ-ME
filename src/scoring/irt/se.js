// Story 2.4 — posterior SE (standard error of EAP) + RSS combiner.
// Architecture D3 canonical name: standardError(theta, responses, itemParameters).
// SE_total = √(SEM² + SE_norming²) per FR15 — combinedSE.
// Numerical stability: log-domain M-shift, identical to Story 2.3 eap.js.

import { logLikelihood } from "./likelihood.js";
import { quadraturePoints } from "./quadrature.js";

export function standardError(theta, responses, itemParameters) {
  const { nodes, weights } = quadraturePoints({
    quadpts: 61,
    theta_lim: [-6, 6],
  });
  const n = nodes.length;

  // logLikelihood validates responses/items + theta + throws RangeError.
  const logL = new Array(n);
  let M = -Infinity;
  for (let i = 0; i < n; i++) {
    const l = logLikelihood(nodes[i], itemParameters, responses);
    logL[i] = l;
    if (l > M) M = l;
  }

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const post = Math.exp(logL[i] - M) * weights[i];
    const diff = nodes[i] - theta;
    num += diff * diff * post;
    den += post;
  }

  return Math.sqrt(num / den);
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
