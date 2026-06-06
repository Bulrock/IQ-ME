// src/assessment/methodology-theme.js
//
// Story 11-1 PR-9 (AC11) — static methodology pages honour the SPA's persisted
// colour theme. Injected as a BLOCKING <script src> in the methodology <head>
// (classic script, not a module) so it runs before first paint — no
// flash-of-wrong-theme. CSP-clean (external src, no inline body — lint-csp-
// source). Reads the same localStorage "theme" key the SPA's theme.js writes;
// System default (absence of key) leaves <html> with no [data-theme] so
// prefers-color-scheme resolves. Stdlib-only, zero third-party (NFR6).
(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {
    /* storage disabled / unavailable — fall back to System (no attribute) */
  }
})();
