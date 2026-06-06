// src/assessment/theme.js
//
// Story 6.4 / PR-6 (Story 11-1, AC8) — Light/Dark theme switcher with NFR9
// opt-in localStorage discipline. The "System" option was removed per
// maintainer decision: only Light and Dark segments are offered, and with NO
// saved choice the app follows the OS (prefers-color-scheme) — the active
// segment reflects the resolved theme.
//
//   - init() reads localStorage.theme ONCE; if present, applies
//     <html>[data-theme] accordingly; NEVER writes to localStorage on init.
//     With no key, data-theme is left ABSENT so semantic.css resolves via
//     prefers-color-scheme; the segment matching the resolved scheme is pressed.
//   - Segment click handlers are the ONLY localStorage writers:
//       light → setItem("theme","light") + data-theme="light"
//       dark  → setItem("theme","dark")  + data-theme="dark"

import { escapeAttr as esc } from "./html-util.js";

let listeners = [];

function readPersisted() {
  try {
    const v = window.localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : null;
  } catch (_e) { return null; }
}

// The scheme the OS prefers (used to show the active segment when there is no
// saved choice). Defaults to light when matchMedia is unavailable.
function osPrefersDark() {
  try {
    return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (_e) { return false; }
}

// The theme currently shown: the saved choice, else the OS-resolved scheme.
function resolveActive(persisted) {
  if (persisted === "light" || persisted === "dark") return persisted;
  return osPrefersDark() ? "dark" : "light";
}

function applyTheme(value) {
  if (value === "light" || value === "dark") {
    document.documentElement.setAttribute("data-theme", value);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function persist(value) {
  try {
    if (value === "light" || value === "dark") window.localStorage.setItem("theme", value);
  } catch (_e) { /* swallow — quota / disabled storage */ }
}

function renderMarkup(slot, strings, active) {
  const s = (strings && strings.chrome) || {};
  const legend = esc(s.themeToggleLegend ?? "Color theme");
  const labelLight = esc(s.themeLightLabel ?? "Light");
  const labelDark = esc(s.themeDarkLabel ?? "Dark");
  const seg = (v, label) =>
    '<button type="button" class="theme-switcher__segment" data-theme-value="' + v + '" aria-pressed="' + (active === v ? "true" : "false") + '">' +
      '<span class="theme-switcher__label-text">' + label + '</span>' +
    '</button>';
  slot.innerHTML =
    '<div class="theme-switcher" role="group" aria-label="' + legend + '">' +
      seg("light", labelLight) +
      seg("dark", labelDark) +
    '</div>';
}

function reflectPressed(slot, value) {
  const segs = slot.querySelectorAll(".theme-switcher__segment");
  for (const b of segs) {
    const bv = typeof b.getAttribute === "function" ? b.getAttribute("data-theme-value") : null;
    if (typeof b.setAttribute === "function") b.setAttribute("aria-pressed", bv === value ? "true" : "false");
  }
}

function attach(slot) {
  const segs = slot.querySelectorAll(".theme-switcher__segment");
  for (const btn of segs) {
    const handler = () => {
      const v = typeof btn.getAttribute === "function" ? btn.getAttribute("data-theme-value") : null;
      if (v === "light") { persist("light"); applyTheme("light"); reflectPressed(slot, "light"); }
      else if (v === "dark") { persist("dark"); applyTheme("dark"); reflectPressed(slot, "dark"); }
    };
    if (typeof btn.addEventListener === "function") btn.addEventListener("click", handler);
    listeners.push({ el: btn, type: "click", fn: handler });
  }

  // When there's no saved choice, track OS changes so the pressed segment stays
  // accurate (data-theme remains absent → CSS follows the OS automatically).
  try {
    if (typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (readPersisted() === null) reflectPressed(slot, osPrefersDark() ? "dark" : "light");
      };
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", onChange);
        listeners.push({ el: mq, type: "change", fn: onChange });
      }
    }
  } catch (_e) { /* matchMedia unavailable — no OS tracking */ }
}

export function init(slot, strings) {
  if (!slot) return;
  const persisted = readPersisted();
  applyTheme(persisted);
  renderMarkup(slot, strings, resolveActive(persisted));
  attach(slot);
}

export function detach() {
  for (const { el, type, fn } of listeners) {
    if (el && typeof el.removeEventListener === "function") el.removeEventListener(type, fn);
  }
  listeners = [];
}
