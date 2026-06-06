// fallow-ignore-file circular-dependencies
// routing<->scene cycle is by design (runtime navigate via `import * as`)
// src/assessment/landing.js
//
// Story 3.3 AC-4 — EN-only landing scene with "Start the test" CTA and a
// "Read the methodology" link to /methodology/v0.1.0/en/.

import * as routing from "./routing.js";
import { escapeText, escapeAttr } from "./html-util.js";

let startBtn = null;
let startClickHandler = null;

export function render(rootEl, strings) {
  const s = (strings && strings.landing) || {};
  const headline = escapeText(s.headline ?? "");
  const intro = escapeText(s.intro ?? "");
  const startLabel = escapeText(s.startTestButton ?? "");
  const methodLabel = escapeText(s.methodologyLink ?? "");
  rootEl.innerHTML =
    '<section class="landing" aria-labelledby="landing-heading">' +
      '<h1 id="landing-heading">' + headline + '</h1>' +
      '<p class="landing__paragraph">' + intro + '</p>' +
      '<div class="landing__cta-group">' +
        '<button type="button" id="start-test-btn" class="landing__start-btn">' + startLabel + '</button>' +
        '<a class="landing__methodology-link" href="/methodology/v0.1.0/en/">' + methodLabel + '</a>' +
      '</div>' +
    '</section>';
  startBtn = rootEl.querySelector("#start-test-btn");
  if (startBtn) {
    startClickHandler = () => { routing.navigate("consent"); };
    startBtn.addEventListener("click", startClickHandler);
  }
}

export function unmount(rootEl) {
  if (startBtn && startClickHandler) {
    startBtn.removeEventListener("click", startClickHandler);
  }
  startBtn = null;
  startClickHandler = null;
  if (rootEl) rootEl.innerHTML = "";
}
