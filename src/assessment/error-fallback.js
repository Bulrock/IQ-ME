// src/assessment/error-fallback.js
//
// Story 3.3 AC-8 — polite NFR20 fallback when bootstrap throws. Uses
// the status role (the alert role is forbidden by lint-no-role-alert).

import { escapeText } from "./html-util.js";

export function renderErrorFallback(rootEl, strings) {
  const msg = (strings && strings.chrome && strings.chrome.errorFallbackMessage)
    || "chrome.errorFallbackMessage";
  if (!rootEl) return;
  rootEl.innerHTML =
    '<section class="error-fallback" role="status">' +
      '<p>' + escapeText(msg) + '</p>' +
      '<a href="">Reload</a>' +
    '</section>';
}
