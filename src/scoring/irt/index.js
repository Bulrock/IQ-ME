// Story 2.5 — public surface for the IRT scoring engine.
// Architecture D3: named re-exports + scoreSession facade composing
// quadraturePoints → eapEstimate → standardError → combinedSE → percentile / iqScale.

export { quadraturePoints, gridPoints } from "./quadrature.js";
export {
  logLikelihood,
  itemLikelihood,
  patternLogLikelihood,
} from "./likelihood.js";
export { eapEstimate } from "./eap.js";
export { standardError, combinedSE, posteriorSE } from "./se.js";

import { quadraturePoints } from "./quadrature.js";
import { eapEstimate } from "./eap.js";
import { standardError, combinedSE } from "./se.js";

const SQRT_2PI = Math.sqrt(2 * Math.PI);

// Standard-normal CDF via Abramowitz & Stegun 7.1.26.
// Absolute error ≤ 7.5e-8 over the real line.
function standardNormalCdf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const k = 1 / (1 + 0.2316419 * ax);
  const phi = Math.exp(-0.5 * ax * ax) / SQRT_2PI;
  const poly =
    k *
    (0.319381530 +
      k *
        (-0.356563782 +
          k * (1.781477937 + k * (-1.821255978 + k * 1.330274429))));
  const cdf = 1 - phi * poly;
  return sign === 1 ? cdf : 1 - cdf;
}

export function thetaToPercentile(theta, _normingStats) {
  if (!Number.isFinite(theta)) {
    throw new RangeError(`theta must be finite (got ${theta})`);
  }
  return 100 * standardNormalCdf(theta);
}

export function thetaToIqScale(theta, _normingStats) {
  if (!Number.isFinite(theta)) {
    throw new RangeError(`theta must be finite (got ${theta})`);
  }
  return Math.round(100 + 15 * theta);
}

export function scoreSession({ responses, itemParameters, normingStats }) {
  const quad = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  const theta = eapEstimate(responses, itemParameters, quad);
  const sem = standardError(theta, responses, itemParameters);
  const se_total = combinedSE(sem, normingStats.se_norming);
  const percentile = thetaToPercentile(theta, normingStats);
  const iqScale = thetaToIqScale(theta, normingStats);
  const displayedBand = {
    lower: theta - 1.96 * se_total,
    upper: theta + 1.96 * se_total,
  };
  return {
    theta,
    sem,
    se_total,
    seTotal: se_total,
    percentile,
    iqScale,
    displayedBand,
    uncertaintyBand: displayedBand,
  };
}
