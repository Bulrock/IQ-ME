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
import { resolveFromState, resolveGrid } from "./methodology-registry.js";
import * as persistence from "./session-persistence.js";
import { escapeAttr as esc, fmt } from "./html-util.js";

const INITIAL_SEED = "0".repeat(32);
// Story 12-3: pool URL + session size are resolved per-session from the chosen
// (methodology, variant) via the registry — see ensureSession. Defaults to the
// geometric short pool (16) when no selection was made.

let sessionCache = null;
let mounted = null;
// Story 11-1: the user's actual pick per item (itemIndex → option value). Scored
// state keeps only 0/1; this re-displays the real choice on Previous/resume.
let selectedOptions = {};

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function responseSelection(currentItem) {
  const responses = state.getState().responses;
  const recordedAt = responses.findIndex((response) => response.itemIndex === currentItem);
  return {
    recorded: recordedAt >= 0 ? responses[recordedAt].response : null,
    selected: selectedOptions[currentItem],
  };
}

function isDarkTheme() {
  if (typeof document === "undefined") return false;
  const explicit = document.documentElement?.getAttribute?.("data-theme");
  if (explicit === "dark") return true;
  if (explicit === "light") return false;
  try {
    return typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (_err) {
    return false;
  }
}

function itemAssetSrc(filename) {
  return "/src/" + (isDarkTheme() ? "items-dark" : "items") + "/" + filename;
}

// Progress fill fraction → the --p custom property (CSS track bar). Position
// only, never a duration (14-7). CSSOM write, guarded for the fake-DOM tests.
function syncProgressFill(rootEl, currentItem, sessionSize) {
  const el = rootEl.querySelector(".item-runner__progress");
  if (!el || !el.style || typeof el.style.setProperty !== "function") return;
  const frac = sessionSize > 0 ? (currentItem + 1) / sessionSize : 0;
  el.style.setProperty("--p", String(Math.min(1, Math.max(0, frac))));
}

// Item SVGs ship in light/dark mirrors (src/items vs src/items-dark). On a
// mid-item theme change, re-point every rendered image at the right mirror.
function syncAssetTheme(rootEl) {
  for (const img of rootEl.querySelectorAll(".item-runner__image, .item-runner__option-image")) {
    const src = typeof img.getAttribute === "function" ? img.getAttribute("src") : null;
    if (!src) continue;
    const filename = src.split("/").pop();
    const next = itemAssetSrc(filename);
    if (next !== src) img.setAttribute("src", next);
  }
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
  // Story 12-3: resolve the pool + session size for the chosen methodology +
  // variant (defaults to geometric short → the existing 16-item pool).
  const { poolUrl, sessionSize } = resolveFromState(state.getState());
  let pool;
  try {
    const res = await fetch(poolUrl);
    if (!res || !res.ok) throw new Error("fetch failed");
    pool = await res.json();
  } catch (_err) {
    renderErrorFallback(rootEl, strings);
    return null;
  }
  sessionCache = { pool, sessionSize, selection: selectSession(pool.items, seedBytes, sessionSize) };
  return sessionCache;
}

function buildMarkup(cache, currentItem, strings) {
  const selectedIds = cache.selection.items;
  const item = cache.pool.items.find((p) => p.id === selectedIds[currentItem]);
  // Stub pool: don't render augmentation (still computed+tested); re-enables at 9a-2.
  const isStubPool = typeof cache.pool._note === "string";
  const aug = isStubPool ? "none" : cache.selection.augmentations[currentItem];
  const sessionSize = cache.sessionSize;
  const N = currentItem + 1;
  const heading = fmt(strings.itemRunner.headingTemplate, { N, total: sessionSize });
  const progress = fmt(strings.itemRunner.progressTemplate, { N, total: sessionSize });
  const { recorded, selected: sel } = responseSelection(currentItem);
  const isFirst = currentItem === 0;
  const isLast = currentItem === sessionSize - 1;
  const nextLabel = isLast ? strings.itemRunner.submitButton : strings.itemRunner.nextButton;
  // Story 14-6 (PR-24): read the matrix grid from the item (default 3x3 via the
  // registry — never re-assumed inline) and expose the column count on the
  // section so the rendered-scale verification can compute the matrix-cell edge
  // (image width / cols) without re-hardcoding 3. Additive attribute only — the
  // frozen Epic 11/13 DOM contract names/values are unchanged.
  const grid = resolveGrid(item);

  const optionLabel = strings.itemRunner.optionLabelTemplate || "Option {N}";
  const optionsHtml = item.options
    .map((opt, i) => {
      const checked = (sel != null ? opt === sel : recorded === 1 && opt === item.correct) ? ' checked=""' : "";
      // .svg value → image-tile option; plain string → text (back-compatible).
      const isAsset = /\.svg$/.test(opt);
      const visible = isAsset
        ? '<figure class="item-runner__option-figure"><img class="item-runner__option-image" src="' + esc(itemAssetSrc(opt)) + '" alt="" /></figure>'
          + '<span class="visually-hidden">' + esc(fmt(optionLabel, { N: i + 1 })) + '</span>'
        : '<span>' + esc(opt) + '</span>';
      return '<label class="item-runner__option"><input type="radio" name="item-' + N
        + '" value="' + esc(opt) + '"' + checked + ' />' + visible + '</label>';
    })
    .join("");

  return '<section class="item-runner" aria-labelledby="item-runner-heading" data-bail-state="closed"'
    + ' data-grid-rows="' + grid.rows + '" data-grid-cols="' + grid.cols + '">'
    + '<h1 id="item-runner-heading" class="visually-hidden">' + esc(heading) + '</h1>'
    + '<button type="button" class="item-runner__bail-affordance">' + esc(strings.itemRunner.bailButton) + '</button>'
    + '<div class="item-runner__progress" role="status" aria-live="polite" aria-current="step" data-testid="progress-indicator">'
    + esc(progress) + '</div>'
    + '<div class="item-runner__matrix-frame">'
    + '<img class="item-runner__image" src="' + esc(itemAssetSrc(item.asset))
    + '" alt="" data-augmentation="' + esc(aug) + '" />'
    + '</div>'
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
      selectedOptions[currentItem] = value; // remember the actual pick (Story 11-1)
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
    const sessionSize = cache.sessionSize;
    if (cur >= sessionSize - 1) {
      // PR-4 (AC6): Submit finalizes the session. Pad any unanswered items as
      // incorrect (0) so the scoring path handles them deterministically and
      // result.render() doesn't bounce to landing; then route to the result.
      const answered = new Set(state.getState().responses.map((r) => r.itemIndex));
      for (let i = 0; i < sessionSize; i++) {
        if (!answered.has(i)) state.recordResponse(i, 0);
      }
      // Finalized → no longer resumable; clear THIS session's saved progress.
      persistence.clearProgress(state.getState().seed);
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
  add(disc, "click", () => { persistence.clearProgress(state.getState().seed); selectedOptions = {}; state.resetState(); routing.navigate(""); });
  add(document, "keydown", (ev) => {
    if (!sec || sec.getAttribute("data-bail-state") !== "open") return;
    if (ev && ev.key === "Escape") { ev.preventDefault?.(); close(); }
  });

  // Theme flips mid-test (OS scheme OR the header toggle's data-theme write)
  // → re-sync the rendered SVG mirrors. Guarded for the fake-DOM tests.
  try {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      add(mq, "change", () => syncAssetTheme(rootEl));
    }
  } catch (_err) { /* no OS scheme tracking available */ }
  try {
    if (typeof MutationObserver === "function" && typeof document !== "undefined" && document.documentElement) {
      const mo = new MutationObserver(() => syncAssetTheme(rootEl));
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      listeners.push({ el: { removeEventListener: () => mo.disconnect() }, type: "disconnect", handler: null });
    }
  } catch (_err) { /* no attribute observation available */ }

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
  if (nextIdx >= cache.sessionSize) return;
  const nextItem = cache.pool.items.find((p) => p.id === cache.selection.items[nextIdx]);
  if (!nextItem) return;
  // Warm the next item's matrix image AND its option images so the in-place
  // src swap on Next paints from cache with no flash.
  if (nextItem.asset) warmImage(itemAssetSrc(nextItem.asset));
  if (Array.isArray(nextItem.options)) {
    for (const opt of nextItem.options) {
      if (/\.svg$/.test(opt)) warmImage(itemAssetSrc(opt));
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
  const sessionSize = cache.sessionSize;
  const N = currentItem + 1;
  const isFirst = currentItem === 0;
  const isLast = currentItem === sessionSize - 1;
  const { recorded, selected: sel } = responseSelection(currentItem);

  const heading = rootEl.querySelector("#item-runner-heading");
  if (heading) heading.textContent = fmt(strings.itemRunner.headingTemplate, { N, total: sessionSize });
  const progress = rootEl.querySelector(".item-runner__progress");
  if (progress) progress.textContent = fmt(strings.itemRunner.progressTemplate, { N, total: sessionSize });
  const img = rootEl.querySelector(".item-runner__image");
  if (img) {
    img.setAttribute("src", itemAssetSrc(item.asset));
    img.setAttribute("data-augmentation", aug);
  }

  // Story 11-1: two passes — interleaving name+checked on the reused radio group
  // (PR-3) leaves it inconsistent (pick shows only sometimes). Clear all, then check one.
  const want = sel != null ? sel : (recorded === 1 ? item.correct : null);
  const optionEls = rootEl.querySelectorAll(".item-runner__option");
  item.options.forEach((opt, i) => {
    const labelEl = optionEls[i];
    if (!labelEl) return;
    const radio = labelEl.querySelector("input");
    if (radio) {
      radio.setAttribute("name", "item-" + N);
      radio.setAttribute("value", opt);
      radio.checked = false;
      radio.removeAttribute("checked");
    }
    const optImg = labelEl.querySelector(".item-runner__option-image");
    if (optImg && /\.svg$/.test(opt)) optImg.setAttribute("src", itemAssetSrc(opt));
  });
  if (want != null) {
    const idx = item.options.indexOf(want);
    const radio = idx >= 0 && optionEls[idx] ? optionEls[idx].querySelector("input") : null;
    if (radio) { radio.checked = true; radio.setAttribute("checked", ""); }
  }

  const prev = rootEl.querySelector("#prev-btn");
  if (prev) { if (isFirst) prev.setAttribute("aria-disabled", "true"); else prev.removeAttribute("aria-disabled"); }
  const next = rootEl.querySelector("#next-btn");
  if (next) next.textContent = isLast ? strings.itemRunner.submitButton : strings.itemRunner.nextButton;

  const sec = rootEl.querySelector(".item-runner");
  if (sec) {
    sec.setAttribute("data-bail-state", "closed");
    // Story 14-6: keep the exposed grid in sync as items advance (each item
    // carries its own grid; default 3x3 via the registry — never re-assumed here).
    const grid = resolveGrid(item);
    sec.setAttribute("data-grid-rows", String(grid.rows));
    sec.setAttribute("data-grid-cols", String(grid.cols));
  }
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
  syncProgressFill(rootEl, currentItem, sessionCache.sessionSize);
  preloadNext(sessionCache, currentItem);
}

export async function render(rootEl, strings) {
  if (mounted) { detach(mounted.listeners); mounted = null; }
  const cache = await ensureSession(rootEl, strings);
  if (!cache) return;
  // Story 11-1: restore this session's persisted picks (keyed by seed).
  const ip = persistence.loadProgress(state.getState().seed);
  selectedOptions = ip && ip.selectedOptions ? { ...ip.selectedOptions } : {};
  rootEl.innerHTML = buildMarkup(cache, state.getState().currentItem, strings);
  mounted = { rootEl, listeners: attachListeners(rootEl, cache, strings) };
  syncProgressFill(rootEl, state.getState().currentItem, cache.sessionSize);
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
