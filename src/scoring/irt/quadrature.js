// Story 2.2 — quadrature grid for EAP integration.
// Linear-spaced θ nodes + standard-normal density weights (renormalized to
// sum=1), matching R mirt::fscores default behavior at quadpts=61,
// theta_lim=[-6, 6]. See story 2-2 Dev Notes for grid-choice rationale.

const SQRT_2PI = Math.sqrt(2 * Math.PI);

function standardNormalPdf(x) {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

export function quadraturePoints({ quadpts, theta_lim }) {
  if (
    typeof quadpts !== "number" ||
    !Number.isInteger(quadpts) ||
    quadpts <= 0
  ) {
    throw new RangeError(
      `quadpts must be a positive integer (got ${quadpts})`,
    );
  }
  if (
    !Array.isArray(theta_lim) ||
    theta_lim.length !== 2 ||
    !Number.isFinite(theta_lim[0]) ||
    !Number.isFinite(theta_lim[1]) ||
    theta_lim[0] >= theta_lim[1]
  ) {
    throw new RangeError(
      `theta_lim must be [lo, hi] with lo < hi (got ${JSON.stringify(theta_lim)})`,
    );
  }

  const [lo, hi] = theta_lim;
  const nodes = new Array(quadpts);
  const rawWeights = new Array(quadpts);
  let sum = 0;
  const step = quadpts === 1 ? 0 : (hi - lo) / (quadpts - 1);
  for (let i = 0; i < quadpts; i++) {
    const theta = quadpts === 1 ? (lo + hi) / 2 : lo + i * step;
    nodes[i] = theta;
    rawWeights[i] = standardNormalPdf(theta);
    sum += rawWeights[i];
  }
  const weights = rawWeights.map((w) => w / sum);
  return { nodes, weights };
}

export function gridPoints(quadpts = 61, thetaLim = [-6, 6]) {
  return quadraturePoints({ quadpts, theta_lim: thetaLim });
}
