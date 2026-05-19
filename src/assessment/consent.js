// src/assessment/consent.js
//
// Story 3.3 AC-5 — consent scene with validity envelope, visuospatial
// disclosure (NFR13), dwell-gated Continue (FR12), and "Not today" exit (FR11).
// Gate flips on whichever fires first: IntersectionObserver entry at ratio
// 1.0 on the sentinel, or the 5000 ms dwell timer.

import * as routing from "./routing.js";
import { resetState } from "./state.js";

let observer = null;
let dwellTimer = null;
let continueBtn = null;
let notTodayLink = null;
let continueClickHandler = null;
let notTodayClickHandler = null;

function escapeText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function flipGate() {
  if (continueBtn) continueBtn.setAttribute("aria-disabled", "false");
  if (dwellTimer !== null) {
    clearTimeout(dwellTimer);
    dwellTimer = null;
  }
  if (observer) {
    observer.disconnect();
  }
}

export function render(rootEl, strings) {
  const s = (strings && strings.consent) || {};
  const headline = escapeText(s.headline ?? "");
  const measures = escapeText(s.measuresWhat ?? "");
  const validity = escapeText(s.validityEnvelope ?? "");
  const visuo = escapeText(s.visuospatialDisclosure ?? "");
  const continueLabel = escapeText(s.continueButton ?? "");
  const notTodayLabel = escapeText(s.notToday ?? "");
  rootEl.innerHTML =
    '<section class="consent-scene" aria-labelledby="consent-heading">' +
      '<h1 id="consent-heading">' + headline + '</h1>' +
      '<div class="consent-scene__envelope" data-testid="validity-envelope">' +
        '<p class="consent-scene__measures-what">' + measures + '</p>' +
        '<p class="consent-scene__validity-envelope">' + validity + '</p>' +
        '<p class="consent-scene__visuospatial-disclosure">' + visuo + '</p>' +
        '<div class="consent-scene__envelope-end" tabindex="-1"></div>' +
      '</div>' +
      '<div class="consent-scene__cta-group">' +
        '<button type="button" id="continue-btn" class="consent-scene__continue-btn" aria-disabled="true">' + continueLabel + '</button>' +
        '<a id="not-today-link" href="#/">' + notTodayLabel + '</a>' +
      '</div>' +
    '</section>';

  continueBtn = rootEl.querySelector("#continue-btn");
  notTodayLink = rootEl.querySelector("#not-today-link");
  const sentinel = rootEl.querySelector(".consent-scene__envelope-end");

  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry && entry.isIntersecting && entry.intersectionRatio >= 1.0) {
        flipGate();
        break;
      }
    }
  }, { threshold: 1.0 });
  if (sentinel) observer.observe(sentinel);

  dwellTimer = setTimeout(flipGate, 5000);

  continueClickHandler = () => {
    if (!continueBtn) return;
    if (continueBtn.getAttribute("aria-disabled") === "true") return;
    routing.navigate("test");
  };
  if (continueBtn) continueBtn.addEventListener("click", continueClickHandler);

  notTodayClickHandler = () => {
    resetState();
    // Do NOT preventDefault — native hash nav to "#/" fires hashchange.
  };
  if (notTodayLink) notTodayLink.addEventListener("click", notTodayClickHandler);
}

export function unmount(rootEl) {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (dwellTimer !== null) {
    clearTimeout(dwellTimer);
    dwellTimer = null;
  }
  if (continueBtn && continueClickHandler) {
    continueBtn.removeEventListener("click", continueClickHandler);
  }
  if (notTodayLink && notTodayClickHandler) {
    notTodayLink.removeEventListener("click", notTodayClickHandler);
  }
  continueBtn = null;
  notTodayLink = null;
  continueClickHandler = null;
  notTodayClickHandler = null;
  if (rootEl) rootEl.innerHTML = "";
}
