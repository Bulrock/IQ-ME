// src/assessment/main.js
//
// Story 3.3 AC-2 — SPA bootstrap. On start: load EN locale bundle, then start
// the router. Wraps the whole bootstrap in try/catch; on failure, renders the
// NFR20 polite fallback into #app via error-fallback.js.

import * as localeLoader from "./i18n/locale-loader.js";
import * as routing from "./routing.js";
import * as theme from "./theme.js";
import * as languageSwitcher from "./language-switcher.js";
import * as localeSwitchBlockerHint from "./locale-switch-blocker-hint.js";
import { renderErrorFallback } from "./error-fallback.js";
import "./test-hook.js";

// Story 7.1 AC-2 — pure resolution of the boot locale. The persisted read is
// delegated to language-switcher.readPersistedLocale() (keeps main.js free of
// the storage token per the Story 3.3 source-invariant); the navigator
// language primary subtag is read here (the Web Share API is not used).
function resolveBootLocale() {
  const stored = languageSwitcher.readPersistedLocale();
  const navLang = (typeof navigator !== "undefined" && navigator.language) ? navigator.language : "en";
  return localeLoader.resolveInitialLocale({ stored, navigatorLang: navLang });
}

function applyDocumentLocale(locale) {
  const root = (typeof document !== "undefined" && document.documentElement) || null;
  if (root && typeof root.setAttribute === "function") root.setAttribute("data-locale", locale);
}

function applyChromeStrings() {
  const set = (sel, key) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = localeLoader.get(key);
  };
  set(".chrome-header__name", "chrome.appName");
  set(".chrome-footer__methodology-link", "chrome.footerMethodologyLink");
  set(".chrome-footer__discussions-link", "chrome.footerDiscussionsLink");
}

let inFlight = null;

function buildStrings() {
  return {
    chrome: {
      titleAppDefault: localeLoader.get("chrome.titleAppDefault"),
      appName: localeLoader.get("chrome.appName"),
      errorFallbackMessage: localeLoader.get("chrome.errorFallbackMessage"),
      themeToggleLegend: localeLoader.get("chrome.themeToggleLegend"),
      themeSystemLabel: localeLoader.get("chrome.themeSystemLabel"),
      themeLightLabel: localeLoader.get("chrome.themeLightLabel"),
      themeDarkLabel: localeLoader.get("chrome.themeDarkLabel"),
      languageSwitcherLegend: localeLoader.get("chrome.languageSwitcherLegend"),
    },
    localeSwitchBlockerHint: {
      message: localeLoader.get("localeSwitchBlockerHint.message"),
      bailLinkLabel: localeLoader.get("localeSwitchBlockerHint.bailLinkLabel"),
      validityLinkLabel: localeLoader.get("localeSwitchBlockerHint.validityLinkLabel"),
    },
  };
}

async function bootstrap() {
  try {
    const locale = resolveBootLocale();
    applyDocumentLocale(locale);
    await localeLoader.load(locale);
    // Apply theme BEFORE routing.start() so no flash-of-light-theme occurs.
    // PR-6 (AC8): the theme switcher now lives top-right in the chrome-header.
    const themeSlot = document.querySelector(".chrome-header__theme-switcher");
    if (themeSlot) theme.init(themeSlot, buildStrings());
    // Story 7.1 — render the keyboard-first locale switcher into the
    // chrome-header slot (replaces the Story 6.4 placeholder span).
    const switcherSlot = document.querySelector(".chrome-header__language-switcher");
    if (switcherSlot) {
      const hintSlot = document.querySelector(".locale-switch-blocker-hint__slot");
      languageSwitcher.init(switcherSlot, {
        strings: buildStrings(),
        currentLocale: locale,
        // Story 7.2 — render the FR8 teachable-moment hint on a blocked
        // in-session switch attempt (7.1 left this seam as a no-op default).
        onBlockedAttempt: () => { if (hintSlot) localeSwitchBlockerHint.render(hintSlot, buildStrings()); },
      });
    }
    applyChromeStrings();
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
