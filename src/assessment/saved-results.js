// fallow-ignore-file circular-dependencies
// routing<->scene cycle is by design (runtime navigate via `import * as`)
// src/assessment/saved-results.js
//
// Story 11-1 PR-14 (AC17) — saved-results management scene. Lists every
// opt-in-saved result (iqme:saved-result:<id>), opens an individual result,
// and supports "delete all" + per-result checkbox deletion. Entirely
// client-side (no server / telemetry); the only storage writes are removals
// performed on explicit user action (NFR9-consistent). Stdlib-only.

import * as routing from "./routing.js";
import * as state from "./state.js";
import * as persistence from "./session-persistence.js";
import { escapeText as escT, escapeAttr as escA, fmt as F } from "./html-util.js";

const KEY_PREFIX = "iqme:saved-result:";

let mounted = null; // { rootEl, strings, listeners }

function allKeys() {
  try {
    return Object.keys(window.localStorage).filter((k) => k.startsWith(KEY_PREFIX)).sort();
  } catch (_e) {
    return [];
  }
}

// Read-only — true iff ≥1 saved result exists. Used by the landing entry-point
// gate. Null-safe / quota-safe.
export function hasSaved() {
  return allKeys().length > 0;
}

function listSaved() {
  const out = [];
  for (const key of allKeys()) {
    let data = {};
    try {
      const raw = window.localStorage.getItem(key);
      data = raw ? JSON.parse(raw) : {};
    } catch (_e) { data = {}; }
    out.push({ key, data });
  }
  return out;
}

function removeKeys(keys) {
  for (const k of keys) {
    try { window.localStorage.removeItem(k); } catch (_e) { /* swallow */ }
  }
}

function detach() {
  if (!mounted) return;
  for (const { el, type, fn } of mounted.listeners) {
    if (el && typeof el.removeEventListener === "function") el.removeEventListener(type, fn);
  }
  mounted.listeners = [];
}

function on(el, type, fn) {
  if (el && typeof el.addEventListener === "function") {
    el.addEventListener(type, fn);
    mounted.listeners.push({ el, type, fn });
  }
}

function summaryLine(s, data) {
  // Best-effort human summary from whatever the saved artifact carried.
  const parts = [];
  if (data.iqScale != null || data.score != null) parts.push((s.scoreLabel ?? "IQ-scale") + " " + escT(String(data.iqScale ?? data.score)));
  if (data.percentile != null) parts.push(escT(String(Math.round(data.percentile))) + (s.percentileSuffix ?? "th pct"));
  if (data.date || data.savedAt) {
    const d = data.date || new Date(data.savedAt).toISOString().slice(0, 10);
    parts.push(escT(String(d)));
  }
  return parts.join(" · ") || escT(s.untitledResult ?? "Saved result");
}

// Story 11-1 — the "Unfinished tests" section: the in-progress session can be
// resumed (restore state + go to the item) or deleted.
function inProgressSectionHtml(s, list) {
  if (!list || list.length === 0) return "";
  const rows = list.map((ip) => {
    const n = (typeof ip.currentItem === "number" ? ip.currentItem : 0) + 1;
    const when = new Date(ip.savedAt || ip.startedAt || Date.now()).toLocaleString();
    const label = F(s.inProgressItemTemplate || "Unfinished — item {N} of 16", { N: n }) + " · " + when;
    return '<div class="saved-results__ip-item">' +
      '<span class="saved-results__ip-label">' + escT(label) + '</span>' +
      '<span class="saved-results__ip-actions">' +
        '<button type="button" class="saved-results__resume" data-resume-seed="' + escA(ip.seed) + '">' + escT(s.resume ?? "Resume") + '</button>' +
        '<button type="button" class="saved-results__delete-ip" data-delete-ip-seed="' + escA(ip.seed) + '">' + escT(s.deleteInProgress ?? "Delete") + '</button>' +
      '</span>' +
    '</div>';
  }).join("");
  return '<section class="saved-results__in-progress" aria-label="' + escA(s.inProgressHeading ?? "Unfinished tests") + '">' +
    '<h2 class="saved-results__subhead">' + escT(s.inProgressHeading ?? "Unfinished tests") + '</h2>' +
    rows +
  '</section>';
}

function resumeSession(ip) {
  state.resetState();
  // Story 12-3: restore the methodology + variant FIRST so the resumed session
  // rebuilds the same pool/size (item-runner + result resolve from these).
  try { if (ip.methodology) state.setMethodology(ip.methodology); } catch (_e) { /* unknown → registry default */ }
  try { if (ip.variant) state.setVariant(ip.variant); } catch (_e) { /* unknown → registry default */ }
  try { if (ip.seed) state.setSeed(ip.seed); } catch (_e) { /* invalid seed — start fresh */ }
  for (const r of (ip.responses || [])) {
    try { state.recordResponse(r.itemIndex, r.response); } catch (_e) { /* skip bad entry */ }
  }
  try { if (typeof ip.currentItem === "number") state.setItem(ip.currentItem); } catch (_e) { /* clamp */ }
  routing.navigate("test");
}

function renderList(rootEl, strings) {
  const s = (strings && strings.savedResults) || {};
  const inProgress = persistence.listProgress();
  const items = listSaved();

  if (inProgress.length === 0 && items.length === 0) {
    rootEl.innerHTML =
      '<section class="saved-results" aria-labelledby="saved-results-heading">' +
        '<h1 id="saved-results-heading">' + escT(s.heading ?? "Saved results") + '</h1>' +
        '<p class="saved-results__empty">' + escT(s.empty ?? "No saved results yet.") + '</p>' +
        '<button type="button" class="saved-results__back" data-saved-back>' + escT(s.back ?? "Back") + '</button>' +
      '</section>';
    on(rootEl.querySelector("[data-saved-back]"), "click", () => routing.navigate(""));
    return;
  }

  const rows = items.map((it) => {
    const label = summaryLine(s, it.data);
    return '<li class="saved-results__item" data-saved-result-item data-key="' + escA(it.key) + '">' +
      '<input type="checkbox" class="saved-results__checkbox" data-key="' + escA(it.key) + '" aria-label="' + escA((s.selectLabel ?? "Select") + " " + label) + '">' +
      '<button type="button" class="saved-results__open" data-open-key="' + escA(it.key) + '">' + label + '</button>' +
    '</li>';
  }).join("");

  const actions = '<div class="saved-results__actions">' +
    '<button type="button" class="saved-results__back" data-saved-back>' + escT(s.back ?? "Back") + '</button>' +
    (items.length ? '<button type="button" class="saved-results__delete-selected" data-delete-selected>' + escT(s.deleteSelected ?? "Delete selected") + '</button>' +
      '<button type="button" class="saved-results__delete-all" data-delete-all>' + escT(s.deleteAll ?? "Delete all") + '</button>' : "") +
    '</div>';

  const savedSection = items.length
    ? '<ul class="saved-results__list">' + rows + '</ul>'
    : "";

  rootEl.innerHTML =
    '<section class="saved-results" aria-labelledby="saved-results-heading">' +
      '<h1 id="saved-results-heading">' + escT(s.heading ?? "Saved results") + '</h1>' +
      actions +
      inProgressSectionHtml(s, inProgress) +
      savedSection +
    '</section>';

  on(rootEl.querySelector("[data-saved-back]"), "click", () => routing.navigate(""));

  for (const btn of rootEl.querySelectorAll("[data-resume-seed]")) {
    on(btn, "click", () => {
      const seed = btn.getAttribute("data-resume-seed");
      const entry = persistence.listProgress().find((x) => x.seed === seed);
      if (entry) resumeSession(entry);
    });
  }
  for (const btn of rootEl.querySelectorAll("[data-delete-ip-seed]")) {
    on(btn, "click", () => {
      persistence.clearProgress(btn.getAttribute("data-delete-ip-seed"));
      if (hasSaved() || persistence.hasProgress()) renderList(rootEl, strings);
      else routing.navigate("");
    });
  }

  on(rootEl.querySelector("[data-delete-all]"), "click", () => {
    removeKeys(allKeys());
    if (persistence.hasProgress()) renderList(rootEl, strings);
    else routing.navigate("");
  });

  on(rootEl.querySelector("[data-delete-selected]"), "click", () => {
    const checked = Array.from(rootEl.querySelectorAll(".saved-results__checkbox"))
      .filter((c) => c.checked)
      .map((c) => c.getAttribute("data-key"));
    if (checked.length) removeKeys(checked);
    if (hasSaved() || persistence.hasProgress()) renderList(rootEl, strings);
    else routing.navigate("");
  });

  for (const openBtn of rootEl.querySelectorAll(".saved-results__open")) {
    on(openBtn, "click", () => {
      const key = openBtn.getAttribute("data-open-key");
      const found = listSaved().find((x) => x.key === key);
      renderDetail(rootEl, strings, found || { key, data: {} });
    });
  }
}

function renderDetail(rootEl, strings, item) {
  const s = (strings && strings.savedResults) || {};
  const r = (strings && strings.result) || {};
  const d = item.data || {};
  const p = d.percentile != null ? Math.round(d.percentile) : null;
  const a = d.iqScale != null ? d.iqScale : (d.score != null ? d.score : null);
  const h = d.displayedBand && typeof d.displayedBand.upper === "number"
    ? Math.round((d.displayedBand.upper - d.displayedBand.lower) / 2 * 15) : null;
  const date = d.date || (d.savedAt ? new Date(d.savedAt).toISOString().slice(0, 10) : null);
  // PR-14 (Story 11-1): render the saved result with the SAME score-panel
  // co-equal triplet + result-scene centering as the live result page. The
  // metric-viz spans mirror the live result cards (Aurora reference) — pure
  // decoration, aria-hidden.
  const cell = (n, value, label) =>
    value == null ? "" :
    '<span class="score-panel__' + n + '" tabindex="0"><span class="score-panel__metric-value">' + escT(String(value)) + '</span>' +
    '<span class="score-panel__metric-label">' + escT(label) + '</span>' +
    '<span class="score-panel__metric-viz score-panel__metric-viz--' + n + '" aria-hidden="true"><span></span></span></span>';
  const triplet =
    cell("percentile", p, r.percentileLabel ?? "Percentile") +
    cell("anchor", a, r.anchorLabel ?? "IQ-scale") +
    cell("band", h != null ? F(r.bandTemplate || "±{N}", { N: h }) : null, r.bandLabel ?? "Range");
  // Heading context = save date; the methodology line renders in support.
  const method = d.methodology ? (r["method_" + d.methodology] || d.methodology) : null;
  const variantName = d.variant ? (r["variant_" + d.variant] || d.variant) : null;
  const context = date ? (s.dateLabel ?? "Date") + " " + date : "";
  // Print parity: same printable blocks as the live result → identical PDFs.
  const printHead =
    '<div class="result-print-only"><p class="result-print-only__title">' + escT(r.printTitle ?? "") + '</p>' +
    (date ? '<p class="result-print-only__date">' + escT(date) + '</p>' : '') + '</div>';
  const printFooter = '<p class="result-print-footer" aria-hidden="true">IQ-ME · /methodology/v0.1.0/</p>';
  const caveat = r.caveat ? '<p class="score-panel__caveat" role="note">' + escT(r.caveat) + '</p>' : '';
  const methodLine = method && r.methodologyVariantLine
    ? '<p class="score-panel__method-variant">' + escT(F(r.methodologyVariantLine, { methodology: method, variant: variantName ?? "" })) + '</p>'
    : '';
  // Collapsed disclaimer, same shape as the live result (opens in print).
  let disclaimer = '';
  if (r.resultExplainer) {
    const parts = String(r.resultExplainer).split(/(?<=[.!?])\s+/);
    const summary = parts[0] || String(r.resultExplainer);
    const rest = parts.slice(1).join(" ");
    disclaimer = '<details class="disclaimer score-panel__explainer"><summary class="disclaimer__summary">' + escT(summary) + '</summary>'
      + (rest ? '<p class="disclaimer__body">' + escT(rest) + '</p>' : '') + '</details>';
  }
  const c = d.difficulty;
  const difficulty = c && c.totals && c.correct && r.difficultySentenceTemplate
    ? '<p class="score-panel__difficulty-sentence" aria-label="' + escA(r.difficultySentenceAria ?? "") + '">'
      + escT(F(r.difficultySentenceTemplate, {
          hardN: c.totals.hard, medN: c.totals.medium, easyN: c.totals.easy,
          hardCorrect: c.correct.hard, medCorrect: c.correct.medium, easyCorrect: c.correct.easy,
        })) + '</p>'
    : '';
  const support = (methodLine || disclaimer || difficulty)
    ? '<div class="score-panel__support">' + methodLine + disclaimer + difficulty + '</div>'
    : '';
  rootEl.innerHTML =
    '<section class="result-scene saved-result-detail" data-reveal-stage="methodology-handoff" data-saved-result-view aria-labelledby="saved-result-detail-heading">' +
      '<section class="score-panel">' +
        printHead +
        caveat +
        '<header class="score-panel__header">' +
          '<h1 id="saved-result-detail-heading">' + escT(s.detailHeading ?? "Saved result") + '</h1>' +
          (context ? '<p class="saved-result-detail__date">' + escT(context) + '</p>' : '') +
        '</header>' +
        '<div class="score-panel__triplet">' + triplet + '</div>' +
        support +
        '<div class="saved-result-detail__actions">' +
          '<button type="button" class="saved-results__back" data-saved-back>' + escT(s.backToList ?? "Back to list") + '</button>' +
          (r.printButton ? '<button type="button" class="result-print-btn" data-saved-print>' + escT(r.printButton) + '</button>' : '') +
        '</div>' +
        printFooter +
      '</section>' +
    '</section>';
  on(rootEl.querySelector("[data-saved-back]"), "click", () => renderList(rootEl, strings));
  on(rootEl.querySelector("[data-saved-print]"), "click", () => {
    if (typeof window !== "undefined" && typeof window.print === "function") window.print();
  });
}

export function render(rootEl, strings) {
  if (mounted) detach();
  mounted = { rootEl, strings, listeners: [] };
  renderList(rootEl, strings);
}

export function unmount(rootEl) {
  detach();
  mounted = null;
  if (rootEl) rootEl.innerHTML = "";
}
