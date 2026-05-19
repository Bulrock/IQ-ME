// Story 2.2 — 2PL item-response model + pattern log-likelihood.
// Numerical-stability strategy: log-sum-exp identity (Option B from spec
// Dev Notes) avoids clamping bias at extreme θ.

export function itemLikelihood(theta, a, b, response) {
  if (response !== 0 && response !== 1) {
    throw new RangeError(`response must be 0 or 1 (got ${response})`);
  }
  if (!Number.isFinite(theta) || !Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError(
      `theta, a, b must all be finite (got ${theta}, ${a}, ${b})`,
    );
  }
  const p = 1 / (1 + Math.exp(-a * (theta - b)));
  return response === 1 ? p : 1 - p;
}

// log(1 + exp(x)) — numerically stable via the log-sum-exp shift trick.
function log1pExp(x) {
  if (x > 0) {
    return x + Math.log1p(Math.exp(-x));
  }
  return Math.log1p(Math.exp(x));
}

export function logLikelihood(theta, items, responses) {
  if (!Number.isFinite(theta)) {
    throw new RangeError(`theta must be finite (got ${theta})`);
  }
  if (!Array.isArray(items) || !Array.isArray(responses)) {
    throw new RangeError("items and responses must both be arrays");
  }
  if (items.length !== responses.length) {
    throw new RangeError(
      `items.length (${items.length}) !== responses.length (${responses.length})`,
    );
  }
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const r = responses[i];
    if (r !== 0 && r !== 1) {
      throw new RangeError(`responses[${i}] must be 0 or 1 (got ${r})`);
    }
    const { a, b } = items[i];
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      throw new RangeError(`items[${i}] has non-finite a or b`);
    }
    // log(P) = -log(1 + exp(-z)),  log(1-P) = -z - log(1 + exp(-z))
    const z = a * (theta - b);
    const logOnePlusExpNegZ = log1pExp(-z);
    total += r === 1 ? -logOnePlusExpNegZ : -z - logOnePlusExpNegZ;
  }
  return total;
}

export { logLikelihood as patternLogLikelihood };
