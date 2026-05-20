// src/assessment/theme.js
//
// Story 6.4 AC-3 — tri-state theme toggle (System / Light / Dark) with
// NFR9 opt-in localStorage discipline:
//
//   - init() reads localStorage.theme ONCE; if present, applies
//     <html>[data-theme] accordingly; NEVER writes to localStorage on init.
//   - Radio change handlers are the ONLY localStorage writers:
//       system → removeItem("theme") + remove data-theme attribute
//       light  → setItem("theme", "light") + data-theme="light"
//       dark   → setItem("theme", "dark")  + data-theme="dark"
//   - System default = ABSENCE of key + ABSENCE of data-theme attribute.
//     `prefers-color-scheme: dark` then resolves via semantic.css line 55.

let listeners = [];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readPersisted() {
  try {
    const v = window.localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : null;
  } catch (_e) { return null; }
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
    else window.localStorage.removeItem("theme");
  } catch (_e) { /* swallow — quota / disabled storage */ }
}

function renderMarkup(slot, strings, current) {
  const s = (strings && strings.chrome) || {};
  const legend = esc(s.themeToggleLegend ?? "Color theme");
  const labelSys = esc(s.themeSystemLabel ?? "System");
  const labelLight = esc(s.themeLightLabel ?? "Light");
  const labelDark = esc(s.themeDarkLabel ?? "Dark");
  const c = (v) => (current === v || (current === null && v === "system") ? " checked" : "");
  slot.innerHTML =
    '<fieldset class="theme-toggle">' +
      '<legend class="visually-hidden">' + legend + '</legend>' +
      '<label class="theme-toggle__label"><input class="theme-toggle__radio" type="radio" name="theme" value="system"' + c("system") + '><span class="theme-toggle__label-text">' + labelSys + '</span></label>' +
      '<label class="theme-toggle__label"><input class="theme-toggle__radio" type="radio" name="theme" value="light"' + c("light") + '><span class="theme-toggle__label-text">' + labelLight + '</span></label>' +
      '<label class="theme-toggle__label"><input class="theme-toggle__radio" type="radio" name="theme" value="dark"' + c("dark") + '><span class="theme-toggle__label-text">' + labelDark + '</span></label>' +
    '</fieldset>';
}

function attach(slot) {
  const radios = slot.querySelectorAll(".theme-toggle__radio");
  for (const radio of radios) {
    const handler = (ev) => {
      const t = ev.target || ev.currentTarget || radio;
      const v = t.value ?? (typeof t.getAttribute === "function" ? t.getAttribute("value") : null);
      if (v === "system") { persist(null); applyTheme(null); }
      else if (v === "light") { persist("light"); applyTheme("light"); }
      else if (v === "dark") { persist("dark"); applyTheme("dark"); }
    };
    if (typeof radio.addEventListener === "function") radio.addEventListener("change", handler);
    listeners.push({ el: radio, type: "change", fn: handler });
  }
}

export function init(slot, strings) {
  if (!slot) return;
  const persisted = readPersisted();
  applyTheme(persisted);
  renderMarkup(slot, strings, persisted);
  attach(slot);
}

export function detach() {
  for (const { el, type, fn } of listeners) {
    if (el && typeof el.removeEventListener === "function") el.removeEventListener(type, fn);
  }
  listeners = [];
}
