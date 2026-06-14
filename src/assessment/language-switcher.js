// src/assessment/language-switcher.js
//
// Story 7.1 AC-3 + AC-4 — locale selector (EN/RU/PL) rendered into the
// chrome-header language-switcher slot. PR-7 (Story 11-1, AC9) reshapes it
// from a radio <fieldset> into a custom accessible dropdown with country
// flags, preserving NFR9 opt-in-storage + the FR8 measurement-invariance
// block:
//
//   - init(slot, opts) renders a trigger button (aria-haspopup="listbox",
//     aria-expanded) + a role="listbox" of options, one per SUPPORTED locale;
//     the option matching opts.currentLocale gets aria-selected="true". NEVER
//     writes storage on render.
//   - Selecting an option OUTSIDE an active session writes
//     localStorage.setItem("locale", code) once, then reloads (opts.reload).
//   - During an active session (opts.isSessionActive() → true) the switcher is
//     the FR8 block: no write, no reload; the container is marked
//     data-locale-switch-blocked="true", the trigger aria-disabled="true", and
//     opts.onBlockedAttempt(code) fires the teachable-moment hint (Story 7.2).
//     The blocked state is also reflected passively on iqme:route-change so it
//     holds the moment a session begins (entering #/test), not only on click.

import { escapeText as escT, escapeAttr as escA } from "./html-util.js";
import { SUPPORTED } from "./i18n/locale-loader.js";
import { getState } from "./state.js";

let listeners = [];

// Country-flag glyphs (Unicode regional indicators — zero third-party, NFR6).
const FLAG = { en: "🇬🇧", ru: "🇷🇺", pl: "🇵🇱" };

// Default in-session detector. FR8 locks the locale once measurement is
// underway: a session has started (startedAt > 0) and is not yet complete.
// Swallows errors → "no detectable session" so a fresh page never false-blocks.
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

// Story 7.1 AC-2 — the persisted-locale READ lives here (not in main.js, whose
// frozen Story 3.3 source-invariant forbids the storage token). Returns the
// opt-in stored locale or null.
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
  const legend = escA(s.languageSwitcherLegend ?? "Language");
  const flag = (code) =>
    '<span class="language-switcher__flag" data-flag aria-hidden="true">' + (FLAG[code] || "") + '</span>';
  const option = (code) =>
    '<li class="language-switcher__option" role="option" data-lang-option="' + escA(code) + '" tabindex="-1" aria-selected="' + (code === current ? "true" : "false") + '">' +
      flag(code) +
      '<span class="language-switcher__option-label">' + escT(code.toUpperCase()) + '</span>' +
    '</li>';
  slot.innerHTML =
    '<div class="language-switcher" data-locale-switch-blocked="false">' +
      '<button type="button" class="language-switcher__trigger" aria-haspopup="listbox" aria-expanded="false" aria-disabled="false" aria-label="' + legend + '">' +
        flag(current) +
        '<span class="language-switcher__current">' + escT(current.toUpperCase()) + '</span>' +
      '</button>' +
      '<ul class="language-switcher__menu" role="listbox" aria-label="' + legend + '" hidden>' +
        SUPPORTED.map(option).join("") +
      '</ul>' +
    '</div>';
}

function attach(slot, { isSessionActive, onBlockedAttempt, reload }) {
  const container = slot.querySelector(".language-switcher");
  const trigger = slot.querySelector(".language-switcher__trigger");
  const menu = slot.querySelector(".language-switcher__menu");
  const options = slot.querySelectorAll(".language-switcher__option");

  const add = (el, type, fn) => {
    if (el && typeof el.addEventListener === "function") {
      el.addEventListener(type, fn);
      listeners.push({ el, type, fn });
    }
  };

  const setOpen = (open) => {
    if (trigger && trigger.setAttribute) trigger.setAttribute("aria-expanded", open ? "true" : "false");
    if (menu) {
      if (open) menu.removeAttribute("hidden");
      else menu.setAttribute("hidden", "");
    }
  };

  add(trigger, "click", () => {
    if (isSessionActive()) {
      // FR8 — blocked attempt: do not open; fire the teachable-moment hint.
      if (container && container.setAttribute) container.setAttribute("data-locale-switch-blocked", "true");
      onBlockedAttempt(getState ? (getState().locale || "") : "");
      return;
    }
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    setOpen(!expanded);
  });

  add(typeof document !== "undefined" ? document : null, "keydown", (ev) => {
    if (ev && ev.key === "Escape") setOpen(false);
  });

  for (const opt of options) {
    add(opt, "click", () => {
      const code = typeof opt.getAttribute === "function" ? opt.getAttribute("data-lang-option") : null;
      if (!code) return;
      if (isSessionActive()) {
        // FR8 — measurement invariance: do not switch mid-session.
        if (container && container.setAttribute) container.setAttribute("data-locale-switch-blocked", "true");
        setOpen(false);
        onBlockedAttempt(code);
        return;
      }
      persistLocale(code);
      reload();
    });
  }

  // FR8 — passively reflect the blocked state on route change so it holds the
  // moment a session begins (entering #/test), not only on an explicit click.
  add(typeof document !== "undefined" ? document : null, "iqme:route-change", () => {
    const blocked = isSessionActive();
    if (trigger && trigger.setAttribute) trigger.setAttribute("aria-disabled", blocked ? "true" : "false");
    if (container && container.setAttribute) container.setAttribute("data-locale-switch-blocked", blocked ? "true" : "false");
    if (blocked) setOpen(false);
  });
}

export function init(slot, opts = {}) {
  if (!slot) return;
  detach();
  const current = opts.currentLocale ?? "en";
  const isSessionActive = opts.isSessionActive ?? defaultIsSessionActive;
  const onBlockedAttempt = opts.onBlockedAttempt ?? (() => {});
  const reload = opts.reload ?? (() => { window.location.reload(); });
  renderMarkup(slot, opts.strings, current);
  attach(slot, { isSessionActive, onBlockedAttempt, reload });
}

function detach() {
  for (const { el, type, fn } of listeners) {
    if (el && typeof el.removeEventListener === "function") el.removeEventListener(type, fn);
  }
  listeners = [];
}
