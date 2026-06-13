// fallow-ignore-file circular-dependencies
// routing<->scene cycle is by design (runtime navigate via `import * as`)
// src/assessment/landing.js
//
// Story 3.3 AC-4 — EN-only landing scene with "Start the test" CTA and a
// "Read the methodology" link to /methodology/v0.1.0/en/.

import * as routing from "./routing.js";
import * as savedResults from "./saved-results.js";
import * as persistence from "./session-persistence.js";
import { escapeText, escapeAttr } from "./html-util.js";

let startBtn = null;
let startClickHandler = null;
let savedBtn = null;
let savedClickHandler = null;

export function render(rootEl, strings) {
  const s = (strings && strings.landing) || {};
  const sr = (strings && strings.savedResults) || {};
  const headline = escapeText(s.headline ?? "");
  const intro = escapeText(s.intro ?? "");
  const startLabel = escapeText(s.startTestButton ?? "");
  const methodLabel = escapeText(s.methodologyLink ?? "");
  // PR-14 (AC17): a "View saved results" entry point appears to the right of
  // "Start the test" only when ≥1 result is saved (hidden otherwise).
  const savedLabel = escapeText(sr.viewSavedResults ?? "View saved results");
  // Show the entry point when there is something to view — a saved result OR an
  // in-progress (resumable) test (Story 11-1 resume feature).
  const savedEntry = (savedResults.hasSaved() || persistence.hasProgress())
    ? '<button type="button" id="view-saved-btn" class="landing__saved-btn" data-saved-results-entry>' + savedLabel + '</button>'
    : '';
  // Story 13-3: the landing scene is wrapped in a decorative glass stage with
  // an aria-hidden aurora glow behind the hero. The frozen Story-3.3 contract
  // (section.landing › h1#landing-heading + p.landing__paragraph +
  // div.landing__cta-group › #start-test-btn + .landing__methodology-link) is
  // preserved verbatim inside the stage — the wrapper/glow are additive and
  // purely decorative (announced to no screen reader).
  rootEl.innerHTML =
    '<div class="landing-stage">' +
      '<div class="landing__aurora" aria-hidden="true"></div>' +
      '<section class="landing" aria-labelledby="landing-heading">' +
        '<h1 id="landing-heading">' + headline + '</h1>' +
        '<p class="landing__paragraph">' + intro + '</p>' +
        '<div class="landing__cta-group">' +
          '<button type="button" id="start-test-btn" class="landing__start-btn">' + startLabel + '</button>' +
          savedEntry +
          '<a class="landing__methodology-link" href="/methodology/v0.1.0/en/">' + methodLabel + '</a>' +
        '</div>' +
      '</section>' +
    '</div>';
  startBtn = rootEl.querySelector("#start-test-btn");
  if (startBtn) {
    startClickHandler = () => { routing.navigate("consent"); };
    startBtn.addEventListener("click", startClickHandler);
  }
  savedBtn = rootEl.querySelector("#view-saved-btn");
  if (savedBtn) {
    savedClickHandler = () => { routing.navigate("saved"); };
    savedBtn.addEventListener("click", savedClickHandler);
  }
}

export function unmount(rootEl) {
  if (startBtn && startClickHandler) {
    startBtn.removeEventListener("click", startClickHandler);
  }
  if (savedBtn && savedClickHandler) {
    savedBtn.removeEventListener("click", savedClickHandler);
  }
  startBtn = null;
  startClickHandler = null;
  savedBtn = null;
  savedClickHandler = null;
  if (rootEl) rootEl.innerHTML = "";
}
