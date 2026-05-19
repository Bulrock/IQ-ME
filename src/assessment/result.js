import { renderErrorFallback } from "./error-fallback.js";
import * as state from "./state.js";
import { scoreSession } from "../scoring/irt/index.js";
import * as rs from "./reveal-stage.js";

const CV = "v0.1.0";
let m = null;

const E = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const F = (t, v) => String(t).replace(/\{(\w+)\}/g, (_x, k) => k in v ? String(v[k]) : `{${k}}`);
const SP = (n, p, l, x) => `<span class="score-panel__${n}" tabindex="0" data-methodology-target="scoring/${p}" aria-label="${E(l)}">${E(x)}</span>`;
const go = (t) => window.location.assign(`/methodology/${CV}/${state.getState().locale || "en"}/${t}/`);

const beat = (s) => `<section class="result-scene" data-reveal-stage="anchor"><h1>${E(s.prerevealHeading)}</h1><p>${E(s.prerevealSubcopy)}</p><button type="button" class="rs-show">${E(s.showMeButton)}</button><button type="button" class="rs-not">${E(s.notYetButton)}</button></section>`;

function panel(s, sc) {
  const p = Math.round(sc.percentile), a = sc.iqScale;
  const h = Math.round((sc.displayedBand.upper - sc.displayedBand.lower) / 2 * 15);
  return `<section class="result-scene" data-reveal-stage="handoff"><h2 id="score-panel-heading" class="visually-hidden">${E(s.scoreHeading)}</h2><section class="score-panel" aria-labelledby="score-panel-heading"><p class="score-panel__caveat" role="note">${E(s.caveat)}</p><div class="score-panel__triplet">${SP("percentile", "percentile-to-iq", F(s.percentileAriaTemplate, { N: p }), p)}${SP("anchor", "overview", F(s.anchorAriaTemplate, { N: a }), a)}${SP("band", "uncertainty", s.bandAriaTemplate, F(s.bandTemplate, { N: h }))}</div></section></section>`;
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
    const t = c.attrs && c.attrs["data-methodology-target"];
    if (!t) continue;
    on(c, "click", () => go(t));
    on(c, "keydown", (e) => { if (e && e.key === "Enter") go(t); });
  }
}

export async function render(rootEl, strings) {
  if (m) { detach(); m = null; }
  rs.resetRevealStage();
  let pool;
  try {
    const r = await fetch("/src/items/item-parameters.json");
    if (!r || !r.ok) throw new Error("fetch failed");
    pool = await r.json();
  } catch { renderErrorFallback(rootEl, strings); return; }
  const score = scoreSession({
    responses: state.getState().responses.map((x) => x.response),
    itemParameters: pool.items,
    normingStats: { se_norming: 0 },
  });
  rootEl.innerHTML = beat(strings.result);
  m = { ls: [] };
  on(rootEl.querySelector(".rs-show"), "click", () => {
    detach(); m.ls = [];
    rootEl.innerHTML = panel(strings.result, score);
    bindTriplet(rootEl);
    rs.dispatchStage("handoff");
  });
  on(rootEl.querySelector(".rs-not"), "click", () => {});
  rs.dispatchStage("anchor");
}

export function unmount(rootEl) {
  if (m) { detach(); m = null; }
  try { if (rootEl) rootEl.innerHTML = ""; } catch {}
  rs.resetRevealStage();
}
