// Story 1.6 fixture: triggers lint-no-share.
export function shareResult(text) {
  return navigator.share({ text });
}
