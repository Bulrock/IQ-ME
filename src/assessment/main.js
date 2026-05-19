// src/assessment/main.js
//
// Story 3.3 AC-2 — SPA bootstrap. On start: load EN locale bundle, then start
// the router. Wraps the whole bootstrap in try/catch; on failure, renders the
// NFR20 polite fallback into #app via error-fallback.js.

import * as localeLoader from "./i18n/locale-loader.js";
import * as routing from "./routing.js";
import { renderErrorFallback } from "./error-fallback.js";
import "./test-hook.js";

let inFlight = null;

function buildStrings() {
  return {
    chrome: {
      titleAppDefault: localeLoader.get("chrome.titleAppDefault"),
      appName: localeLoader.get("chrome.appName"),
      errorFallbackMessage: localeLoader.get("chrome.errorFallbackMessage"),
    },
  };
}

async function bootstrap() {
  try {
    await localeLoader.load("en");
    routing.start();
    // Re-render if router was started in a prior boot (idempotent-guard hop).
    const appEl = document.getElementById("app");
    if (appEl && (!appEl.innerHTML || appEl.innerHTML.length === 0)) {
      routing.navigate(routing.getCurrentRoute().replace(/^#?\/?/, "") || "");
    }
  } catch (_err) {
    const appEl = document.getElementById("app");
    try {
      renderErrorFallback(appEl, buildStrings());
    } catch (_renderErr) {
      // Last-resort fallback to satisfy NFR20 visibility — never leave #app empty.
      if (appEl) appEl.innerHTML = '<section class="error-fallback" role="status"><p>Something went wrong loading the page.</p></section>';
    }
  }
}

export async function start() {
  // Coalesce concurrent calls to one in-flight bootstrap. Successive calls
  // after settlement re-enter — useful when locale fetch state changed
  // (e.g. dev hot-reload or post-error retry). Production callers issue
  // start() exactly once via DOMContentLoaded.
  if (inFlight) return inFlight;
  inFlight = bootstrap().finally(() => { inFlight = null; });
  return inFlight;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}
