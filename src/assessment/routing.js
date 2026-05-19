// src/assessment/routing.js
//
// Story 3.3 AC-3 — hash-based router. Routes `''` / `'#/'` → landing,
// `'#/consent'` → consent. Unknown hashes fall back to landing without
// throwing. Dispatches `iqme:route-change` on document after each navigation.

import * as landing from "./landing.js";
import * as consent from "./consent.js";
import * as itemRunner from "./item-runner.js";
import * as localeLoader from "./i18n/locale-loader.js";

const ROUTES = {
  "": landing,
  "#/": landing,
  "#/consent": consent,
  "#/test": itemRunner,
};

let started = false;
let activeScene = null;
let activeHash = null;
let hashChangeHandler = null;

function getStrings() {
  return {
    landing: {
      headline: localeLoader.get("landing.headline"),
      intro: localeLoader.get("landing.intro"),
      startTestButton: localeLoader.get("landing.startTestButton"),
      methodologyLink: localeLoader.get("landing.methodologyLink"),
    },
    consent: {
      headline: localeLoader.get("consent.headline"),
      measuresWhat: localeLoader.get("consent.measuresWhat"),
      validityEnvelope: localeLoader.get("consent.validityEnvelope"),
      visuospatialDisclosure: localeLoader.get("consent.visuospatialDisclosure"),
      continueButton: localeLoader.get("consent.continueButton"),
      notToday: localeLoader.get("consent.notToday"),
    },
    chrome: {
      titleAppDefault: localeLoader.get("chrome.titleAppDefault"),
      appName: localeLoader.get("chrome.appName"),
      errorFallbackMessage: localeLoader.get("chrome.errorFallbackMessage"),
    },
  };
}

function resolveScene(hash) {
  if (Object.prototype.hasOwnProperty.call(ROUTES, hash)) return ROUTES[hash];
  return landing;
}

function dispatchRouteChange(hash) {
  const ev = new CustomEvent("iqme:route-change", {
    bubbles: true,
    composed: false,
    detail: { route: hash },
  });
  document.dispatchEvent(ev);
}

function renderRoute(hash) {
  const scene = resolveScene(hash);
  const appEl = document.getElementById("app");
  if (activeScene && activeScene !== scene && typeof activeScene.unmount === "function") {
    try { activeScene.unmount(appEl); } catch (_err) { /* swallow unmount errors */ }
  }
  activeScene = scene;
  activeHash = hash;
  if (appEl && typeof scene.render === "function") {
    scene.render(appEl, getStrings());
  }
  dispatchRouteChange(hash);
}

function onHashChange() {
  const hash = window.location.hash || "";
  if (hash === activeHash) return;
  renderRoute(hash);
}

export function start() {
  const hash = window.location.hash || "";
  if (started) {
    // Idempotent on same hash; re-render if the hash changed externally.
    if (hash !== activeHash) renderRoute(hash);
    return;
  }
  started = true;
  hashChangeHandler = onHashChange;
  window.addEventListener("hashchange", hashChangeHandler);
  renderRoute(hash);
}

export function navigate(route) {
  const slug = String(route).replace(/^#?\/?/, "");
  const newHash = "#/" + slug;
  if (window.location.hash === newHash) {
    // No native hashchange will fire — render + dispatch directly.
    renderRoute(newHash);
    return;
  }
  window.location.hash = newHash;
  // jsdom-ish environments don't always fire hashchange synchronously after
  // location.hash mutation; render directly to keep behavior observable.
  renderRoute(newHash);
}

export function getCurrentRoute() {
  return window.location.hash || "";
}
