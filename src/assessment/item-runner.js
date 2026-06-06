// fallow-ignore-file circular-dependencies
// routing<->scene cycle is by design (runtime navigate via `import * as`)
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
import * as persistence from "./session-persistence.js";
import { escapeAttr as esc, fmt } from "./html-util.js";

const SESSION_SIZE = 16;
const INITIAL_SEED = "0".repeat(32);
const ITEM_PARAMS_URL = "/src/items/item-parameters.json";

let sessionCache = null;
let mounted = null;
// Story 11-1 fix: the scored session state keeps only correctness (0/1), never
// which option the user picked. Track the actual choice per item (itemIndex →
// option value) so Previous/resume re-displays the real selection until it's
// changed. Mirrored into the iqme:in-progress payload; restored on mount by seed.
let selectedOptions = {};

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}


async function ensureSession(rootEl, strings) {
  if (state.getState().seed !== INITIAL_SEED && sessionCache) return sessionCache;
  // Story 11-1 resume: when the seed is already set (mid-session or a resumed
  // session), rebuild the SAME item selection from it rather than regenerating.
  const existingSeed = state.getState().seed;
  let seedBytes;
  if (existingSeed !== INITIAL_SEED) {
    seedBytes = hexToBytes(existingSeed);
  } else {
    seedBytes = crypto.getRandomValues(new Uint8Array(16));
    state.setSeed(bytesToHex(seedBytes));
  }
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
  // Stub pool: don't render augmentation (still computed+tested); re-enables at 9a-2.
  const isStubPool = typeof cache.pool._note === "string";
  const aug = isStubPool ? "none" : cache.selection.augmentations[currentItem];
  const N = currentItem + 1;
  const heading = fmt(strings.itemRunner.headingTemplate, { N, total: SESSION_SIZE });
  const progress = fmt(strings.itemRunner.progressTemplate, { N, total: SESSION_SIZE });
  const responses = state.getState().responses;
  const recordedAt = responses.findIndex((r) => r.itemIndex === currentItem);
  const recorded = recordedAt >= 0 ? responses[recordedAt].response : null;
  // Prefer the actual recorded choice; fall back to the correct-answer heuristic
  // only for legacy payloads saved before selections were persisted.
  const sel = selectedOptions[currentItem];
  const isFirst = currentItem === 0;
  const isLast = currentItem === SESSION_SIZE - 1;
  const nextLabel = isLast ? strings.itemRunner.submitButton : strings.itemRunner.nextButton;

  const optionLabel = strings.itemRunner.optionLabelTemplate || "Option {N}";
  const optionsHtml = item.options
    .map((opt, i) => {
      const checked = (sel != null ? opt === sel : recorded === 1 && opt === item.correct) ? ' checked=""' : "";
      // .svg value → image-tile option; plain string → text (back-compatible).
      const isAsset = /\.svg$/.test(opt);
      const visible = isAsset
        ? '<figure class="item-runner__option-figure"><img class="item-runner__option-image" src="/src/items/' + esc(opt) + '" alt="" /></figure>'
          + '<span class="visually-hidden">' + esc(fmt(optionLabel, { N: i + 1 })) + '</span>'
        : '<span>' + esc(opt) + '</span>';
      return '<label class="item-runner__option"><input type="radio" name="item-' + N
        + '" value="' + esc(opt) + '"' + checked + ' />' + visible + '</label>';
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
      // Story 11-1 fix: remember the actual choice (not just correctness) so it
      // re-displays on Previous/resume until the user picks a different option.
      selectedOptions[currentItem] = value;
      // Story 11-1 resume: persist progress on every answer.
      persistence.saveProgress(state.getState(), selectedOptions);
    });
  }
  add(rootEl.querySelector("#prev-btn"), "click", () => {
    const cur = state.getState().currentItem;
    if (cur <= 0) return;
    state.setItem(cur - 1);
    persistence.saveProgress(state.getState(), selectedOptions);
    rerender(rootEl, strings);
  });
  add(rootEl.querySelector("#next-btn"), "click", () => {
    const cur = state.getState().currentItem;
    if (cur >= SESSION_SIZE - 1) {
      // PR-4 (AC6): Submit finalizes the session. Pad any unanswered items as
      // incorrect (0) so the scoring path handles them deterministically and
      // result.render() doesn't bounce to landing; then route to the result.
      const answered = new Set(state.getState().responses.map((r) => r.itemIndex));
      for (let i = 0; i < SESSION_SIZE; i++) {
        if (!answered.has(i)) state.recordResponse(i, 0);
      }
      // Finalized → no longer resumable; clear the saved progress.
      persistence.clearProgress();
      selectedOptions = {};
      routing.navigate("result");
      return;
    }
    state.setItem(cur + 1);
    persistence.saveProgress(state.getState(), selectedOptions);
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
  add(disc, "click", () => { persistence.clearProgress(); selectedOptions = {}; state.resetState(); routing.navigate(""); });
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

// PR-3 (AC5): warm the next item's matrix image into the browser cache so
// advancing shows it without a fetch-flash. Uses new Image() (HTTP cache +
// decode) rather than <link rel=preload> — the latter triggers Chrome's
// "preloaded but not used within a few seconds" console warning when the user
// dwells on an item. Idempotent per href. Zero-third-party: same-origin asset.
const preloadedHrefs = new Set();
function warmImage(href) {
  if (!href || preloadedHrefs.has(href) || typeof Image === "undefined") return;
  preloadedHrefs.add(href);
  const img = new Image();
  img.decoding = "async";
  img.src = href;
}
function preloadNext(cache, currentItem) {
  if (!cache) return;
  const nextIdx = currentItem + 1;
  if (nextIdx >= SESSION_SIZE) return;
  const nextItem = cache.pool.items.find((p) => p.id === cache.selection.items[nextIdx]);
  if (!nextItem) return;
  // Warm the next item's matrix image AND its option images so the in-place
  // src swap on Next paints from cache with no flash.
  if (nextItem.asset) warmImage("/src/items/" + nextItem.asset);
  if (Array.isArray(nextItem.options)) {
    for (const opt of nextItem.options) {
      if (/\.svg$/.test(opt)) warmImage("/src/items/" + opt);
    }
  }
}

// PR-3 (AC5): advance/retreat by updating the EXISTING DOM in place — the
// matrix <img>, option images, radios, progress, heading, and nav labels are
// mutated, never recreated. The image element persists (its src swaps to the
// already-warmed next image), so there is no unmount/remount flash on Next /
// Previous. Listeners stay attached (their closures read state dynamically), so
// no detach/re-attach churn either.
function updateItemInPlace(rootEl, cache, strings) {
  const currentItem = state.getState().currentItem;
  const item = cache.pool.items.find((p) => p.id === cache.selection.items[currentItem]);
  if (!item) return;
  const isStubPool = typeof cache.pool._note === "string";
  const aug = isStubPool ? "none" : cache.selection.augmentations[currentItem];
  const N = currentItem + 1;
  const isFirst = currentItem === 0;
  const isLast = currentItem === SESSION_SIZE - 1;
  const responses = state.getState().responses;
  const recordedAt = responses.findIndex((r) => r.itemIndex === currentItem);
  const recorded = recordedAt >= 0 ? responses[recordedAt].response : null;
  const sel = selectedOptions[currentItem];

  const heading = rootEl.querySelector("#item-runner-heading");
  if (heading) heading.textContent = fmt(strings.itemRunner.headingTemplate, { N, total: SESSION_SIZE });
  const progress = rootEl.querySelector(".item-runner__progress");
  if (progress) progress.textContent = fmt(strings.itemRunner.progressTemplate, { N, total: SESSION_SIZE });
  const img = rootEl.querySelector(".item-runner__image");
  if (img) {
    img.setAttribute("src", "/src/items/" + item.asset);
    img.setAttribute("data-augmentation", aug);
  }

  const optionEls = rootEl.querySelectorAll(".item-runner__option");
  item.options.forEach((opt, i) => {
    const labelEl = optionEls[i];
    if (!labelEl) return;
    const radio = labelEl.querySelector("input");
    if (radio) {
      radio.setAttribute("name", "item-" + N);
      radio.setAttribute("value", opt);
      const checked = sel != null ? opt === sel : recorded === 1 && opt === item.correct;
      radio.checked = checked;
      if (checked) radio.setAttribute("checked", ""); else radio.removeAttribute("checked");
    }
    const optImg = labelEl.querySelector(".item-runner__option-image");
    if (optImg && /\.svg$/.test(opt)) optImg.setAttribute("src", "/src/items/" + opt);
  });

  const prev = rootEl.querySelector("#prev-btn");
  if (prev) { if (isFirst) prev.setAttribute("aria-disabled", "true"); else prev.removeAttribute("aria-disabled"); }
  const next = rootEl.querySelector("#next-btn");
  if (next) next.textContent = isLast ? strings.itemRunner.submitButton : strings.itemRunner.nextButton;

  const sec = rootEl.querySelector(".item-runner");
  if (sec) sec.setAttribute("data-bail-state", "closed");
}

function rerender(rootEl, strings) {
  if (!sessionCache) return;
  const currentItem = state.getState().currentItem;
  const existing = rootEl.querySelector(".item-runner");
  if (existing && mounted) {
    updateItemInPlace(rootEl, sessionCache, strings);
  } else {
    if (mounted) detach(mounted.listeners);
    rootEl.innerHTML = buildMarkup(sessionCache, currentItem, strings);
    mounted = { rootEl, listeners: attachListeners(rootEl, sessionCache, strings) };
  }
  preloadNext(sessionCache, currentItem);
}

export async function render(rootEl, strings) {
  if (mounted) { detach(mounted.listeners); mounted = null; }
  const cache = await ensureSession(rootEl, strings);
  if (!cache) return;
  // Story 11-1 fix: adopt persisted per-item selections only when they belong to
  // the current session's seed (resume); a fresh session (new seed) starts clean.
  const ip = persistence.loadProgress();
  selectedOptions = ip && ip.seed === state.getState().seed && ip.selectedOptions
    ? { ...ip.selectedOptions }
    : {};
  rootEl.innerHTML = buildMarkup(cache, state.getState().currentItem, strings);
  mounted = { rootEl, listeners: attachListeners(rootEl, cache, strings) };
  // Story 11-1 resume: the session is now under way — persist it so an
  // interrupted test can be resumed from the saved-results page.
  persistence.saveProgress(state.getState(), selectedOptions);
  preloadNext(cache, state.getState().currentItem);
}

export function unmount() {
  if (!mounted) return;
  detach(mounted.listeners);
  try { mounted.rootEl.innerHTML = ""; } catch (_e) { /* noop */ }
  mounted = null;
}
