// fallow-ignore-file circular-dependencies
// routing<->scene cycle is by design (runtime navigate via `import * as`)
import { renderErrorFallback } from "./error-fallback.js";
import * as state from "./state.js";
import * as routing from "./routing.js";
import { scoreSession } from "../scoring/irt/index.js";
import * as rs from "./reveal-stage.js";
import { selectSession } from "./item-selection.js";
import { resolveFromState } from "./methodology-registry.js";
import { selectTailScene } from "./tail-scene-router.js";
import { saveResult, isSaved } from "./save-result.js";
import { escapeAttr as E, fmt as F } from "./html-util.js";
import { tailScenesUrl } from "./tail-scenes-url.js";
import { crisisResourcesUrl } from "./crisis-resources-url.js";

const CV = "v0.1.0";
// Story 12-3: the session size is resolved per (methodology, variant) via the
// registry (default geometric short = 16). SS is the back-compatible default
// used where no variant context is threaded (e.g. legacy callers of the
// exported computeDifficultyCounts).
const SS = 16;
let m = null;
const SP = (n, p, l, x, vis) => `<span class="score-panel__${n}" tabindex="0" data-methodology-target="scoring/${p}" aria-label="${E(l)}"><span class="score-panel__metric-value">${E(x)}</span><span class="score-panel__metric-label" aria-hidden="true">${E(vis)}</span><span class="score-panel__metric-viz score-panel__metric-viz--${n}" aria-hidden="true"><span></span></span></span>`;
const go = (t) => window.location.assign(`/methodology/${CV}/${state.getState().locale || "en"}/${t}/`);
const HB = (h) => { const o = new Uint8Array(h.length / 2); for (let i = 0; i < o.length; i++) o[i] = parseInt(h.substr(i * 2, 2), 16); return o; };

// FR22 — per-band fraction-correct. Re-derives the session permutation from
// state.seed so response.itemIndex maps to the item-id presented at that slot.
export function computeDifficultyCounts(pool, bands, responses, seedHex, sessionSize = SS) {
  const t = { easy: 0, medium: 0, hard: 0 }, c = { easy: 0, medium: 0, hard: 0 };
  if (!pool || !bands || !Array.isArray(responses) || typeof seedHex !== "string") return { totals: t, correct: c };
  let sel;
  try { sel = selectSession(pool.items, HB(seedHex), sessionSize); } catch { return { totals: t, correct: c }; }
  const bb = new Map(bands.items.map((x) => [x.id, x.band]));
  for (const r of responses) {
    const id = sel.items[r.itemIndex]; if (!id) continue;
    const b = bb.get(id); if (!b) continue;
    t[b] += 1; if (r.response === 1) c[b] += 1;
  }
  return { totals: t, correct: c };
}

const beat = (s) => `<section class="result-scene" data-reveal-stage="anchor"><h1>${E(s.prerevealHeading)}</h1><p>${E(s.prerevealSubcopy)}</p><button type="button" class="rs-show">${E(s.showMeButton)}</button><button type="button" class="rs-not">${E(s.notYetButton)}</button></section>`;

// Story 6.6 — top-decile tear-edge overlay (UX-DR25, FR24, UX Innovation #4).
// Decorative SVG (aria-hidden, not focusable, no methodology target). Rendered
// only inside .score-panel--top-decile, as the last child of the caveat so the
// CSS in tail-scene-top.css can anchor it to the caveat box and straddle the
// caveat↔triplet seam. Static markup — no interpolation, no external asset
// (zero-third-party invariant). preserveAspectRatio="none" stretches the jagged
// torn edge across the panel width; the stroke sits in the top sliver of the
// (taller) element box so it renders at the seam while the box binds downward.
const TEAR = `<svg class="score-panel__tear-edge" aria-hidden="true" focusable="false" preserveAspectRatio="none" viewBox="0 0 100 20"><path d="M0,3 L6,6 L12,2 L18,6 L24,3 L30,6 L36,2 L42,6 L48,3 L54,6 L60,2 L66,6 L72,3 L78,6 L84,2 L90,6 L96,3 L100,5" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;

const DS = (s, c) => `<p class="score-panel__difficulty-sentence" aria-label="${E(s.difficultySentenceAria)}">${E(F(s.difficultySentenceTemplate, { hardN: c.totals.hard, medN: c.totals.medium, easyN: c.totals.easy, hardCorrect: c.correct.hard, medCorrect: c.correct.medium, easyCorrect: c.correct.easy }))}</p>`;

// PR-13 (Story 11-1): the crisis-resources block collapses by default —
// the FIRST resource (988 Lifeline) stays visible for a potentially distressed
// reader (harm-safe), and the rest hide behind a fade-out + "Show more"
// <details> toggle. Native <details> keeps it keyboard/screen-reader-operable.
function crisisResourceLi(r) {
  return `<li><a class="crisis-resource-link" href="${E(r.url)}" aria-label="${E(r.name)} — ${E(r.description)}">${E(r.name)}</a><span class="crisis-resource-description">${E(r.description)}</span></li>`;
}

function crisisList(crisis, s) {
  if (!crisis || !Array.isArray(crisis.resources) || crisis.resources.length === 0) return "";
  const [first, ...rest] = crisis.resources;
  const more = rest.length
    ? `<details class="crisis-resources__more"><summary class="crisis-resources__more-toggle">${E((s && s.crisisShowMore) || "Show more resources")}</summary><ul>${rest.map(crisisResourceLi).join("")}</ul></details>`
    : "";
  return `<div class="tail-scene__crisis-resources" aria-label="Crisis resources"><h3 class="visually-hidden">Crisis resources</h3><ul>${crisisResourceLi(first)}</ul>${more}</div>`;
}

function tailScene(variant, tailScenes, crisis, s) {
  const scene = (tailScenes && tailScenes.scenes && tailScenes.scenes[variant]) || { heading: "", copy: "", silentCompanionLine: "" };
  const heading = `<h2 id="tail-scene-heading" class="visually-hidden">${E(scene.heading)}</h2>`;
  const copy = `<p class="tail-scene__copy">${E(scene.copy)}</p>`;
  const scl = variant === "bottom-decile" && scene.silentCompanionLine ? `<p class="silent-companion-line" role="note" aria-live="off">${E(scene.silentCompanionLine)}</p>` : "";
  const cr = variant === "bottom-decile" ? crisisList(crisis, s) : "";
  return `<aside class="tail-scene tail-scene--${variant}" role="complementary" aria-labelledby="tail-scene-heading">${heading}${copy}${scl}${cr}</aside>`;
}

// Story 6.7 — opt-in "Save my result" button (FR26, NFR9) + retest-effect note
// (FR27). The button renders in its unsaved default (aria-pressed="false", no
// auto-save); bindSave() wires the click → save-result.js. The retest-note links
// to the retest-effects methodology page via the same versioned+localed URL
// convention as go() (NOT a bare /methodology/limitations/... path).
const SAVE = (s) => `<button type="button" class="score-panel__save-button" aria-pressed="false">${E(s.saveButton)}</button>`;
// Honest print-to-PDF summary (NOT a certificate — the panel's caveat prints
// with it). Zero-dep: opens the browser print dialog over a print-styled view.
const PRINT = (s) => `<button type="button" class="result-print-btn">${E(s.printButton)}</button>`;
const PRINT_HEAD = (s) => `<div class="result-print-only"><p class="result-print-only__title">${E(s.printTitle)}</p><p class="result-print-only__date">${E(new Date().toISOString().slice(0, 10))}</p></div>`;
// PR-17 (Story 13-5): a tidy print-only document identity line at the foot of
// the printed page. Locale-agnostic structural identity (no translatable prose
// → no NFR27 cascade): the project mark + the methodology corpus path.
const PRINT_FOOTER = () => `<p class="result-print-footer" aria-hidden="true">IQ-ME · /methodology/${CV}/</p>`;
const RETEST = (s, locale) => `<div class="score-panel__retest-note"><p class="score-panel__retest-copy">${E(s.retestNote)}</p><a class="score-panel__retest-link" href="/methodology/${CV}/${locale}/limitations/retest-effects/">${E(s.retestNoteLinkLabel)}</a></div>`;

// PR-13 (AC16) — the explanatory disclaimer collapses to its first line via a
// native <details>/<summary> (keyboard- and screen-reader-operable, default
// collapsed). The first sentence is the always-visible summary; the rest is
// the expandable body. Native <details> means no JS toggle wiring is needed.
const DISCLAIMER = (s) => {
  const full = String(s.resultExplainer || "");
  const parts = full.split(/(?<=[.!?])\s+/);
  const summary = parts[0] || full;
  const rest = parts.slice(1).join(" ");
  const body = rest ? `<p class="disclaimer__body">${E(rest)}</p>` : "";
  return `<details class="disclaimer score-panel__explainer"><summary class="disclaimer__summary">${E(summary)}</summary>${body}</details>`;
};

// Story 12-3: a short, honest line naming the methodology + variant that
// produced the estimate. Localized via result.methodologyVariantLine +
// result.method_<methodology> / result.variant_<variant> display names.
const METHOD_VARIANT_LINE = (s, mv) => {
  const tmpl = s.methodologyVariantLine;
  if (!tmpl) return "";
  const methodName = s[`method_${mv.methodology}`] || mv.methodology;
  const variantName = s[`variant_${mv.variant}`] || mv.variant;
  return `<p class="score-panel__method-variant">${E(F(tmpl, { methodology: methodName, variant: variantName }))}</p>`;
};

function panel(s, sc, c, variant, tailScenes, crisis, mv) {
  const p = Math.round(sc.percentile), a = sc.iqScale;
  const h = Math.round((sc.displayedBand.upper - sc.displayedBand.lower) / 2 * 15);
  const locale = state.getState().locale || "en";
  const methodVariant = mv ? METHOD_VARIANT_LINE(s, mv) : "";
  return `<section class="result-scene" data-reveal-stage="methodology-handoff"><section class="score-panel score-panel--${variant}" aria-labelledby="score-panel-heading">${PRINT_HEAD(s)}<p class="score-panel__caveat" role="note">${E(s.caveat)}${variant === "top-decile" ? TEAR : ""}</p><header class="score-panel__header"><h1 id="score-panel-heading">${E(s.scoreHeading)}</h1><p>${E(s.prerevealSubcopy)}</p></header><div class="score-panel__triplet">${SP("percentile", "percentile-to-iq", F(s.percentileAriaTemplate, { N: p }), p, s.percentileLabel)}${SP("anchor", "overview", F(s.anchorAriaTemplate, { N: a }), a, s.anchorLabel)}${SP("band", "uncertainty", s.bandAriaTemplate, F(s.bandTemplate, { N: h }), s.bandLabel)}</div><div class="score-panel__support">${methodVariant}${DISCLAIMER(s)}${DS(s, c)}</div><div class="score-panel__action-buttons">${SAVE(s)}${PRINT(s)}</div>${RETEST(s, locale)}${PRINT_FOOTER()}</section>${tailScene(variant, tailScenes, crisis, s)}</section>`;
}

// Wire the opt-in Save button. The browser-storage write lives entirely in
// save-result.js (keeping this module grep-clean per result.test.mjs AC-9.15);
// this only reflects state + guards against re-save (a second click is a no-op,
// so exactly one write occurs per session). On render it reflects an
// already-saved session (returning user) via the read-only isSaved() — no write
// at render time (NFR9).
function bindSave(root, sc, s) {
  const btn = root.querySelector(".score-panel__save-button");
  if (!btn) return;
  const seed = state.getState().seed;
  let saved = isSaved(seed);
  const reflect = () => {
    btn.setAttribute("aria-pressed", saved ? "true" : "false");
    btn.textContent = saved ? s.saveButtonSaved : s.saveButton;
  };
  if (saved) reflect();
  on(btn, "click", () => {
    if (saved) return;
    saveResult(seed, { percentile: Math.round(sc.percentile), iqScale: sc.iqScale, displayedBand: sc.displayedBand });
    saved = true;
    reflect();
  });
}

function bindPrint(root) {
  const btn = root.querySelector(".result-print-btn");
  if (!btn) return;
  on(btn, "click", () => { if (typeof window !== "undefined" && window.print) window.print(); });
}

function on(el, type, fn) {
  if (!el) return;
  el.addEventListener(type, fn);
  m.ls.push({ el, type, fn });
}

const detach = () => {
  for (const { el, type, fn } of (m && m.ls) || []) {
    try { el.removeEventListener(type, fn); } catch {}
  }
};

function bindTriplet(root) {
  const trip = root.querySelector(".score-panel__triplet");
  if (!trip) return;
  for (const c of trip.children) {
    const t = c.getAttribute && c.getAttribute("data-methodology-target");
    if (!t) continue;
    on(c, "click", () => go(t));
    on(c, "keydown", (e) => { if (e && e.key === "Enter") go(t); });
  }
}

const Z = { totals: { easy: 0, medium: 0, hard: 0 }, correct: { easy: 0, medium: 0, hard: 0 } };

export async function render(rootEl, strings) {
  if (m) { detach(); m = null; }
  rs.resetRevealStage();
  // Story 12-3: resolve the chosen methodology + variant (default geometric
  // short = 16) so the completeness guard, pool fetch, scoring, and difficulty
  // counts all use the variant's session size.
  const mv = resolveFromState(state.getState());
  // No completed session (direct nav / reload) → nothing to score; go home.
  if (state.getState().responses.length !== mv.sessionSize) {
    routing.navigate("");
    return;
  }
  let pool, bands = null, tailScenes = null;
  const locale = state.getState().locale || "en";
  try {
    const [pr, br, tr] = await Promise.all([
      fetch(mv.poolUrl),
      fetch("/src/items/item-difficulty-bands.json"),
      fetch(tailScenesUrl(locale)),
    ]);
    if (!pr || !pr.ok) throw new Error("fetch failed");
    pool = await pr.json();
    if (br && br.ok) bands = await br.json();
    if (tr && tr.ok) {
      tailScenes = await tr.json();
    } else if (locale !== "en") {
      // Active-locale tail-scenes missing → fall back to the EN file.
      const enTr = await fetch(tailScenesUrl("en"));
      if (enTr && enTr.ok) tailScenes = await enTr.json();
    }
  } catch { renderErrorFallback(rootEl, strings); return; }
  // PR-4 (AC6): order responses by session position (itemIndex) and treat any
  // gap as incorrect (0). Submit pads unanswered items, but ordering here keeps
  // scoring correct regardless of the order responses were recorded in.
  const respByIndex = new Map(state.getState().responses.map((x) => [x.itemIndex, x.response]));
  const orderedResponses = Array.from({ length: mv.sessionSize }, (_, i) => respByIndex.has(i) ? respByIndex.get(i) : 0);
  const score = scoreSession({
    responses: orderedResponses,
    itemParameters: pool.items,
    normingStats: { se_norming: 0 },
  });
  const counts = bands ? computeDifficultyCounts(pool, bands, state.getState().responses, state.getState().seed, mv.sessionSize) : Z;
  const variant = selectTailScene(Math.round(score.percentile));
  let crisis = null;
  if (variant === "bottom-decile") {
    try {
      // FR20: load the active locale's crisis list; NO English fallback for
      // RU/PL sessions (a distressed non-EN user must not get an EN-only list).
      const cr = await fetch(crisisResourcesUrl(locale));
      if (cr && cr.ok) crisis = await cr.json();
    } catch {}
  }
  rootEl.innerHTML = beat(strings.result);
  m = { ls: [] };
  on(rootEl.querySelector(".rs-show"), "click", () => {
    detach(); m.ls = [];
    rootEl.innerHTML = panel(strings.result, score, counts, variant, tailScenes, crisis, mv);
    bindTriplet(rootEl);
    bindSave(rootEl, score, strings.result);
    bindPrint(rootEl);
    rs.dispatchStage("band");
    rs.dispatchStage("interval");
    rs.dispatchStage("context");
    rs.dispatchStage("tail-scene");
    rs.dispatchStage("methodology-handoff");
  });
  on(rootEl.querySelector(".rs-not"), "click", () => {});
  rs.dispatchStage("anchor");
}

export function unmount(rootEl) {
  if (m) { detach(); m = null; }
  try { if (rootEl) rootEl.innerHTML = ""; } catch {}
  rs.resetRevealStage();
}
