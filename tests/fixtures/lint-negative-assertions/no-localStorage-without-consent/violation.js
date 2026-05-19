// Story 1.6 fixture: triggers lint-no-localStorage-without-consent.
export function persistSeed(seed) {
  localStorage.setItem("iqme-seed", seed);
}
