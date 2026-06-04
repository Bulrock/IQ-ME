// src/assessment/locale-switch-blocker-hint.js
//
// Story 7.2 AC-2 — teachable-moment FR8 hint (UX-DR27). Rendered into a slot
// adjacent to the language-switcher when an in-session locale-switch is
// blocked (via Story 7.1's onBlockedAttempt seam). Informational, NOT an
// error: it uses the status live-region role, never the assertive alert role
// (lint-no-role-alert). All copy resolves through the
// localeSwitchBlockerHint strings namespace.

import { escapeText as escT } from "./html-util.js";

const VALIDITY_HREF = "/methodology/v0.1.0/en/constructs/validity-envelope/";
const BAIL_HREF = "#/test";

export function render(slot, strings) {
  if (!slot) return;
  const s = (strings && strings.localeSwitchBlockerHint) || {};
  const message = escT(s.message ?? "");
  const bailLabel = escT(s.bailLinkLabel ?? "End the test early");
  const validityLabel = escT(s.validityLinkLabel ?? "Why language is locked");
  slot.innerHTML =
    '<aside class="locale-switch-blocker-hint" role="status">' +
      '<p class="locale-switch-blocker-hint__message">' + message + "</p>" +
      '<a class="locale-switch-blocker-hint__bail-link" href="' + BAIL_HREF + '">' + bailLabel + "</a>" +
      '<a class="locale-switch-blocker-hint__validity-link" href="' + VALIDITY_HREF + '">' + validityLabel + "</a>" +
    "</aside>";
}

export function clear(slot) {
  if (slot) slot.innerHTML = "";
}
