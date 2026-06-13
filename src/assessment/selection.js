// fallow-ignore-file circular-dependencies
// routing<->scene cycle is by design (runtime navigate via `import * as`)
// src/assessment/selection.js
//
// Story 12-2 (PR-15) — pre-test methodology + variant selection scene. Inserted
// between landing and consent: landing → selection → consent → test. The user
// picks a methodology (the existing geometric matrix test is the default) and a
// variant (short = the current 16-item screen [default], or full). The choice is
// carried into session state via setMethodology/setVariant — which deliberately
// do NOT start the session clock, so the locale switcher stays unlocked here.
// Continue navigates to consent, preserving the dwell ceremony.

import * as routing from "./routing.js";
import { setMethodology, setVariant } from "./state.js";
import { escapeText, escapeAttr } from "./html-util.js";

let continueBtn = null;
let continueClickHandler = null;
let formEl = null;

// Methodology options. 'geometric' is the existing ICAR Matrix Reasoning test
// (default). 'letter-number' (ICAR Letter/Number Series) is implemented in
// Story 12-4; offered here so the selector is complete, defaulting to geometric.
const METHODOLOGY_OPTIONS = [
  { value: "geometric", labelKey: "geometricLabel", default: true },
  { value: "letter-number", labelKey: "letterNumberLabel", default: false },
];

const VARIANT_OPTIONS = [
  { value: "short", labelKey: "shortLabel", default: true },
  { value: "full", labelKey: "fullLabel", default: false },
];

function radio(name, opt, label, helpKey, help) {
  const id = `${name}-${opt.value}`;
  const checked = opt.default ? " checked" : "";
  const describedBy = help ? ` aria-describedby="${id}-help"` : "";
  const helpHtml = help
    ? `<span class="selection-scene__option-help" id="${id}-help">${escapeText(help)}</span>`
    : "";
  return (
    `<label class="selection-scene__option" for="${id}">` +
      `<input type="radio" id="${id}" name="${escapeAttr(name)}" value="${escapeAttr(opt.value)}"${checked}${describedBy}>` +
      `<span class="selection-scene__option-label">${escapeText(label)}</span>` +
      helpHtml +
    `</label>`
  );
}

export function render(rootEl, strings) {
  const s = (strings && strings.selection) || {};
  const get = (k) => escapeText(s[k] ?? "");

  const methodologyRadios = METHODOLOGY_OPTIONS.map((opt) =>
    radio("selection-methodology", opt, s[opt.labelKey] ?? "", `${opt.labelKey}Help`, s[`${opt.labelKey}Help`]),
  ).join("");
  const variantRadios = VARIANT_OPTIONS.map((opt) =>
    radio("selection-variant", opt, s[opt.labelKey] ?? "", `${opt.labelKey}Help`, s[`${opt.labelKey}Help`]),
  ).join("");

  rootEl.innerHTML =
    '<section class="selection-scene glass-surface" aria-labelledby="selection-heading">' +
      '<h1 id="selection-heading">' + get("heading") + '</h1>' +
      '<p class="selection-scene__intro">' + get("intro") + '</p>' +
      '<form class="selection-scene__form">' +
        '<fieldset class="selection-scene__group">' +
          '<legend class="selection-scene__legend">' + get("methodologyLegend") + '</legend>' +
          methodologyRadios +
        '</fieldset>' +
        '<fieldset class="selection-scene__group">' +
          '<legend class="selection-scene__legend">' + get("variantLegend") + '</legend>' +
          variantRadios +
        '</fieldset>' +
      '</form>' +
      '<div class="selection-scene__cta-group">' +
        '<button type="button" id="selection-continue-btn" class="selection-scene__continue-btn">' + get("continueButton") + '</button>' +
        '<a class="selection-scene__back-link" href="#/">' + get("backLink") + '</a>' +
      '</div>' +
    '</section>';

  // Seed state with the defaults so a one-click Continue carries a valid choice.
  setMethodology(METHODOLOGY_OPTIONS.find((o) => o.default).value);
  setVariant(VARIANT_OPTIONS.find((o) => o.default).value);

  formEl = rootEl.querySelector(".selection-scene__form");
  continueBtn = rootEl.querySelector("#selection-continue-btn");
  if (continueBtn) {
    continueClickHandler = () => {
      // Read the current radio selections at click time.
      const m = readChecked(rootEl, "selection-methodology");
      const v = readChecked(rootEl, "selection-variant");
      if (m) setMethodology(m);
      if (v) setVariant(v);
      routing.navigate("consent");
    };
    continueBtn.addEventListener("click", continueClickHandler);
  }
}

function readChecked(rootEl, name) {
  const radios = rootEl.querySelectorAll(`input[name="${name}"]`);
  for (const r of radios) {
    if (typeof r.checked === "boolean" ? r.checked : r.getAttribute("checked") !== null) {
      return r.getAttribute("value");
    }
  }
  return null;
}

export function unmount(rootEl) {
  if (continueBtn && continueClickHandler) {
    continueBtn.removeEventListener("click", continueClickHandler);
  }
  continueBtn = null;
  continueClickHandler = null;
  formEl = null;
  if (rootEl) rootEl.innerHTML = "";
}
