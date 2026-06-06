// src/assessment/methodology-locale.js
//
// Story 11-1 PR-12 — static methodology pages follow the SPA's chosen locale.
// Reads the same localStorage "locale" key the SPA's language-switcher writes;
// if it names a supported locale that differs from THIS page's locale, redirect
// to the same page in that locale (swap the `/<lang>/` path segment). A blocking
// external <script src> in <head> (classic, not module) so it runs before paint
// — no flash of the wrong language. CSP-clean (external src), same-origin only
// (NFR6). No saved locale (or storage disabled) → stay on the current locale.
(function () {
  try {
    var saved = localStorage.getItem("locale");
    if (saved !== "en" && saved !== "ru" && saved !== "pl") return;
    // /methodology/<version>/<lang>/<rest...> — swap the 2-letter lang segment.
    var re = /^(\/methodology\/[^/]+\/)([a-z]{2})(\/|$)/;
    var m = location.pathname.match(re);
    if (!m || m[2] === saved) return;
    var target = location.pathname.replace(re, "$1" + saved + "$3");
    location.replace(target + location.search + location.hash);
  } catch (e) {
    /* storage disabled / unavailable — stay on the current locale */
  }
})();
