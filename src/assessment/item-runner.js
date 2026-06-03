// src/assessment/item-runner.js
//
// Story 3.4 AC-3 — item-runner scene (FR2/FR3/FR5/FR7; UX-DR20, UX-DR32).
// Module-level cache keyed by state.seed (FR7 reproducibility within a
// session). On-the-fly scoring at recordResponse: spec line 70 directs
// `recordResponse(idx, selectedOptionIndex)` but the Story 3-2 frozen
// state.schema constrains response to enum [0,1], so the radio-change
// handler scores against item.correct before calling.

import { renderErrorFallback } from "./error-fallback.js";
import * as state from "./state.js";
import * as routing from "./routing.js";
import { selectSession } from "./item-selection.js";
import { escapeAttr as esc, fmt } from "./html-util.js";

const SESSION_SIZE = 16;
const INITIAL_SEED = "0".repeat(32);
const ITEM_PARAMS_URL = "/src/items/item-parameters.json";

let sessionCache = null;
let mounted = null;

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}


async function ensureSession(rootEl, strings) {
  if (state.getState().seed !== INITIAL_SEED && sessionCache) return sessionCache;
  const seedBytes = crypto.getRandomValues(new Uint8Array(16));
  state.setSeed(bytesToHex(seedBytes));
  let pool;
  try {
    const res = await fetch(ITEM_PARAMS_URL);
    if (!res || !res.ok) throw new Error("fetch failed");
    pool = await res.json();
  } catch (_err) {
    renderErrorFallback(rootEl, strings);
    return null;
  }
  sessionCache = { pool, selection: selectSession(pool.items, seedBytes, SESSION_SIZE) };
  return sessionCache;
}

function buildMarkup(cache, currentItem, strings) {
  const selectedIds = cache.selection.items;
  const item = cache.pool.items.find((p) => p.id === selectedIds[currentItem]);
  const aug = cache.selection.augmentations[currentItem];
  const N = currentItem + 1;
  const heading = fmt(strings.itemRunner.headingTemplate, { N, total: SESSION_SIZE });
  const progress = fmt(strings.itemRunner.progressTemplate, { N, total: SESSION_SIZE });
  const responses = state.getState().responses;
  const recordedAt = responses.findIndex((r) => r.itemIndex === currentItem);
  const recorded = recordedAt >= 0 ? responses[recordedAt].response : null;
  const isFirst = currentItem === 0;
  const isLast = currentItem === SESSION_SIZE - 1;
  const nextLabel = isLast ? strings.itemRunner.submitButton : strings.itemRunner.nextButton;

  const optionsHtml = item.options
    .map((opt) => {
      const checked = recorded === 1 && opt === item.correct ? ' checked=""' : "";
      return '<label class="item-runner__option"><input type="radio" name="item-' + N
        + '" value="' + esc(opt) + '"' + checked + ' /><span>' + esc(opt) + '</span></label>';
    })
    .join("");

  return '<section class="item-runner" aria-labelledby="item-runner-heading" data-bail-state="closed">'
    + '<h1 id="item-runner-heading" class="visually-hidden">' + esc(heading) + '</h1>'
    + '<button type="button" class="item-runner__bail-affordance">' + esc(strings.itemRunner.bailButton) + '</button>'
    + '<div class="item-runner__progress" role="status" aria-live="polite" aria-current="step" data-testid="progress-indicator">'
    + esc(progress) + '</div>'
    + '<img class="item-runner__image" src="/src/items/' + esc(item.asset)
    + '" alt="" data-augmentation="' + esc(aug) + '" />'
    + '<fieldset class="item-runner__options"><legend class="visually-hidden">'
    + esc(strings.itemRunner.optionsLegend) + '</legend>' + optionsHtml + '</fieldset>'
    + '<div class="item-runner__nav">'
    + '<button type="button" class="item-runner__prev" id="prev-btn"'
    + (isFirst ? ' aria-disabled="true"' : '') + '>' + esc(strings.itemRunner.previousButton) + '</button>'
    + '<button type="button" class="item-runner__next" id="next-btn">' + esc(nextLabel) + '</button>'
    + '</div>'
    + '<div class="item-runner__bail-panel" role="region" aria-labelledby="bail-panel-heading">'
    + '<h2 id="bail-panel-heading" class="visually-hidden">' + esc(strings.itemRunner.bailPanelHeading) + '</h2>'
    + '<p class="item-runner__bail-explanation">' + esc(strings.itemRunner.bailExplanation) + '</p>'
    + '<div class="item-runner__bail-actions">'
    + '<button type="button" class="item-runner__bail-discard">' + esc(strings.itemRunner.bailDiscardButton) + '</button>'
    + '<button type="button" class="item-runner__bail-continue">' + esc(strings.itemRunner.bailContinueButton) + '</button>'
    + '</div></div></section>';
}

function attachListeners(rootEl, cache, strings) {
  const listeners = [];
  const add = (el, type, handler) => {
    if (!el || typeof el.addEventListener !== "function") return;
    el.addEventListener(type, handler);
    listeners.push({ el, type, handler });
  };

  for (const radio of rootEl.querySelectorAll("input")) {
    add(radio, "change", (ev) => {
      const currentItem = state.getState().currentItem;
      const item = cache.pool.items.find((p) => p.id === cache.selection.items[currentItem]);
      const value = ev && ev.target ? (ev.target.attrs ? ev.target.attrs.value : ev.target.value) : null;
      // F-A: score on-the-fly (state.schema enum [0,1]).
      state.recordResponse(currentItem, value === item.correct ? 1 : 0);
    });
  }
  add(rootEl.querySelector("#prev-btn"), "click", () => {
    const cur = state.getState().currentItem;
    if (cur <= 0) return;
    state.setItem(cur - 1);
    rerender(rootEl, strings);
  });
  add(rootEl.querySelector("#next-btn"), "click", () => {
    const cur = state.getState().currentItem;
    if (cur >= SESSION_SIZE - 1) { routing.navigate("result"); return; }
    state.setItem(cur + 1);
    rerender(rootEl, strings);
  });

  // Story 6.3 — bail-out: data-bail-state attribute gates panel visibility.
  const sec = rootEl.querySelector(".item-runner");
  const aff = rootEl.querySelector(".item-runner__bail-affordance");
  const cont = rootEl.querySelector(".item-runner__bail-continue");
  const disc = rootEl.querySelector(".item-runner__bail-discard");
  const setBail = (s) => sec && sec.setAttribute("data-bail-state", s);
  const focusEl = (el) => { if (el && typeof el.focus === "function") el.focus(); };
  const close = () => { setBail("closed"); focusEl(aff); };
  add(aff, "click", () => { setBail("open"); focusEl(cont); });
  add(cont, "click", close);
  add(disc, "click", () => { state.resetState(); routing.navigate(""); });
  add(document, "keydown", (ev) => {
    if (!sec || sec.getAttribute("data-bail-state") !== "open") return;
    if (ev && ev.key === "Escape") { ev.preventDefault?.(); close(); }
  });

  return listeners;
}

function detach(listeners) {
  if (!listeners) return;
  for (const { el, type, handler } of listeners) {
    try { el.removeEventListener(type, handler); } catch (_e) { /* noop */ }
  }
}

function rerender(rootEl, strings) {
  if (mounted) detach(mounted.listeners);
  if (!sessionCache) return;
  rootEl.innerHTML = buildMarkup(sessionCache, state.getState().currentItem, strings);
  mounted = { rootEl, listeners: attachListeners(rootEl, sessionCache, strings) };
}

export async function render(rootEl, strings) {
  if (mounted) { detach(mounted.listeners); mounted = null; }
  const cache = await ensureSession(rootEl, strings);
  if (!cache) return;
  rootEl.innerHTML = buildMarkup(cache, state.getState().currentItem, strings);
  mounted = { rootEl, listeners: attachListeners(rootEl, cache, strings) };
}

export function unmount() {
  if (!mounted) return;
  detach(mounted.listeners);
  try { mounted.rootEl.innerHTML = ""; } catch (_e) { /* noop */ }
  mounted = null;
}
