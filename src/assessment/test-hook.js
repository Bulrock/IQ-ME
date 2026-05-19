// src/assessment/test-hook.js — Story 3.7 AC-2.
//
// Activated only when the SPA loads with ?test=1 in the URL. Assigns a thin
// re-export surface to window.__IQME_TEST__ for Playwright deterministic
// control (full-slice.spec.mjs). No production effect when the gate is off.

import * as state from "./state.js";
import * as routing from "./routing.js";

function isActivated() {
  if (typeof window === "undefined" || !window.location) return false;
  try {
    return new URL(window.location.href).searchParams.get("test") === "1";
  } catch {
    return false;
  }
}

if (isActivated()) {
  window.__IQME_TEST__ = {
    setSeed: (hex) => state.setSeed(hex),
    getState: () => state.getState(),
    recordResponse: (i, r) => state.recordResponse(i, r),
    navigate: (route) => routing.navigate(route),
    resetState: () => state.resetState(),
  };
}
