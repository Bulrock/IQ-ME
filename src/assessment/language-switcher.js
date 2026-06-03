// src/assessment/language-switcher.js
//
// Story 7.1 AC-3 + AC-4 — keyboard-first locale radio group (EN/RU/PL)
// rendered into the chrome-header language-switcher slot (replacing the
// Story 6.4 placeholder span). Mirrors the theme.js radio-group + NFR9
// opt-in-storage discipline:
//
//   - init(slot, opts) renders one radio per SUPPORTED locale; the radio
//     matching opts.currentLocale is checked. NEVER writes storage on render.
//   - A locale radio change OUTSIDE an active session writes
//     localStorage.setItem("locale", code) once, then reloads (opts.reload).
//   - A change DURING an active session (opts.isSessionActive() → true) is
//     the FR8 measurement-invariance block: no write, no reload, sets
//     data-locale-switch-blocked="true" on the fieldset, invokes
//     opts.onBlockedAttempt(code). The teachable-moment hint + FR8 copy are
//     Story 7.2 — this is only the guard seam.

import { escapeText as escT, escapeAttr as escA } from "./html-util.js";
import { SUPPORTED } from "./i18n/locale-loader.js";
import { getState } from "./state.js";

let listeners = [];

// Default in-session detector. FR8 locks the locale once measurement is
// underway. Heuristic for the 7.1 seam: a session has started (startedAt > 0)
// and is not yet complete. Story 7.2 refines the post-consent/pre-result
// boundary precisely. Swallows errors → treats "no detectable session" as
// not-active so a fresh page never false-blocks (AC-4.b).
function defaultIsSessionActive() {
  try {
    const s = getState();
    return s.startedAt > 0 && s.responses.length < 16;
  } catch (_e) {
    return false;
  }
}

function persistLocale(code) {
  try { window.localStorage.setItem("locale", code); } catch (_e) { /* swallow — quota/disabled */ }
}

// Story 7.1 AC-2 — the persisted-locale READ lives here (not in main.js,
// whose frozen Story 3.3 source-invariant forbids the storage token). Returns
// the opt-in stored locale or null. main.js feeds this to
// localeLoader.resolveInitialLocale() at bootstrap.
export function readPersistedLocale() {
  try {
    const v = window.localStorage.getItem("locale");
    return v || null;
  } catch (_e) {
    return null;
  }
}

function renderMarkup(slot, strings, current) {
  const s = (strings && strings.chrome) || {};
  const legend = escT(s.languageSwitcherLegend ?? "Language");
  const checked = (code) => (code === current ? ' checked="checked"' : "");
  const radio = (code) =>
    '<label class="language-switcher__label">' +
      '<input class="language-switcher__radio" type="radio" name="locale" value="' + escA(code) + '"' + checked(code) + '>' +
      '<span class="language-switcher__label-text">' + escT(code.toUpperCase()) + '</span>' +
    '</label>';
  slot.innerHTML =
    '<fieldset class="language-switcher">' +
      '<legend class="visually-hidden">' + legend + '</legend>' +
      SUPPORTED.map(radio).join("") +
    '</fieldset>';
}

function attach(slot, { isSessionActive, onBlockedAttempt, reload }) {
  const fieldset = slot.querySelector(".language-switcher") || slot.querySelector("fieldset");
  const radios = slot.querySelectorAll(".language-switcher__radio");
  for (const r of radios) {
    const handler = (ev) => {
      const target = ev.target || ev.currentTarget || r;
      const code = target.value ?? (typeof target.getAttribute === "function" ? target.getAttribute("value") : null);
      if (!code) return;
      if (isSessionActive()) {
        // FR8 — measurement invariance: do not switch mid-session.
        if (fieldset && typeof fieldset.setAttribute === "function") {
          fieldset.setAttribute("data-locale-switch-blocked", "true");
        }
        onBlockedAttempt(code);
        return;
      }
      persistLocale(code);
      reload();
    };
    if (typeof r.addEventListener === "function") r.addEventListener("change", handler);
    listeners.push({ el: r, type: "change", fn: handler });
  }
}

export function init(slot, opts = {}) {
  if (!slot) return;
  const current = opts.currentLocale ?? "en";
  const isSessionActive = opts.isSessionActive ?? defaultIsSessionActive;
  const onBlockedAttempt = opts.onBlockedAttempt ?? (() => {});
  const reload = opts.reload ?? (() => { window.location.reload(); });
  renderMarkup(slot, opts.strings, current);
  attach(slot, { isSessionActive, onBlockedAttempt, reload });
}

export function detach() {
  for (const { el, type, fn } of listeners) {
    if (el && typeof el.removeEventListener === "function") el.removeEventListener(type, fn);
  }
  listeners = [];
}
