// src/assessment/tail-scenes-url.js — Story 7.6.
//
// Pure helper: map an active locale to its tail-scenes content path. Factored
// out of result.js so the per-locale URL construction is unit-testable without
// the browser-coupled render() path. RU/PL ship EN-placeholder tail-scenes
// (infra-now, gated on Gates 9c/9d); result.js falls back to the EN file when
// the active-locale file is missing.
export function tailScenesUrl(locale) {
  const loc = locale || "en";
  return `/src/content/i18n/${loc}/tail-scenes.json`;
}
