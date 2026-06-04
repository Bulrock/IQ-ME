// src/assessment/crisis-resources-url.js — Story 7.7.
//
// Pure helper: map an active locale to its crisis-resources content path.
// Factored out of result.js so the per-locale URL construction is unit-testable
// without the browser-coupled render() path. Per FR20 there is NO English
// fallback for RU/PL sessions — each locale loads its own list (RU/PL ship
// honest pending-placeholders, infra-now; the curated reviewer-of-record-vetted
// lists land at Gates 9c/9d).
export function crisisResourcesUrl(locale) {
  const loc = locale || "en";
  return `/src/content/crisis-resources/${loc}.json`;
}
