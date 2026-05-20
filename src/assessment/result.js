import { renderErrorFallback } from "./error-fallback.js";
import * as state from "./state.js";
import { scoreSession } from "../scoring/irt/index.js";
import * as rs from "./reveal-stage.js";
import { selectSession } from "./item-selection.js";
import { selectTailScene } from "./tail-scene-router.js";

const CV = "v0.1.0";
const SS = 16;
let m = null;

const E = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const F = (t, v) => String(t).replace(/\{(\w+)\}/g, (_x, k) => k in v ? String(v[k]) : `{${k}}`);
const SP = (n, p, l, x) => `<span class="score-panel__${n}" tabindex="0" data-methodology-target="scoring/${p}" aria-label="${E(l)}">${E(x)}</span>`;
const go = (t) => window.location.assign(`/methodology/${CV}/${state.getState().locale || "en"}/${t}/`);
const HB = (h) => { const o = new Uint8Array(h.length / 2); for (let i = 0; i < o.length; i++) o[i] = parseInt(h.substr(i * 2, 2), 16); return o; };

// FR22 — per-band fraction-correct. Re-derives the session permutation from
// state.seed so response.itemIndex maps to the item-id presented at that slot.
export function computeDifficultyCounts(pool, bands, responses, seedHex) {
  const t = { easy: 0, medium: 0, hard: 0 }, c = { easy: 0, medium: 0, hard: 0 };
  if (!pool || !bands || !Array.isArray(responses) || typeof seedHex !== "string") return { totals: t, correct: c };
  let sel;
  try { sel = selectSession(pool.items, HB(seedHex), SS); } catch { return { totals: t, correct: c }; }
  const bb = new Map(bands.items.map((x) => [x.id, x.band]));
  for (const r of responses) {
    const id = sel.items[r.itemIndex]; if (!id) continue;
    const b = bb.get(id); if (!b) continue;
    t[b] += 1; if (r.response === 1) c[b] += 1;
  }
  return { totals: t, correct: c };
}

const beat = (s) => `<section class="result-scene" data-reveal-stage="anchor"><h1>${E(s.prerevealHeading)}</h1><p>${E(s.prerevealSubcopy)}</p><button type="button" class="rs-show">${E(s.showMeButton)}</button><button type="button" class="rs-not">${E(s.notYetButton)}</button></section>`;

const DS = (s, c) => `<p class="score-panel__difficulty-sentence" aria-label="${E(s.difficultySentenceAria)}">${E(F(s.difficultySentenceTemplate, { hardN: c.totals.hard, medN: c.totals.medium, easyN: c.totals.easy, hardCorrect: c.correct.hard, medCorrect: c.correct.medium, easyCorrect: c.correct.easy }))}</p>`;

function crisisList(crisis) {
  if (!crisis || !Array.isArray(crisis.resources)) return "";
  const items = crisis.resources.map((r) => `<li><a class="crisis-resource-link" href="${E(r.url)}" aria-label="${E(r.name)} — ${E(r.description)}">${E(r.name)}</a><span class="crisis-resource-description">${E(r.description)}</span></li>`).join("");
  return `<div class="tail-scene__crisis-resources" aria-label="Crisis resources"><h4 class="visually-hidden">Crisis resources</h4><ul>${items}</ul></div>`;
}

function tailScene(variant, tailScenes, crisis) {
  const scene = (tailScenes && tailScenes.scenes && tailScenes.scenes[variant]) || { heading: "", copy: "", silentCompanionLine: "" };
  const heading = `<h3 id="tail-scene-heading" class="visually-hidden">${E(scene.heading)}</h3>`;
  const copy = `<p class="tail-scene__copy">${E(scene.copy)}</p>`;
  const scl = variant === "bottom-decile" && scene.silentCompanionLine ? `<p class="silent-companion-line" role="note" aria-live="off">${E(scene.silentCompanionLine)}</p>` : "";
  const cr = variant === "bottom-decile" ? crisisList(crisis) : "";
  return `<aside class="tail-scene tail-scene--${variant}" role="region" aria-labelledby="tail-scene-heading">${heading}${copy}${scl}${cr}</aside>`;
}

function panel(s, sc, c, variant, tailScenes, crisis) {
  const p = Math.round(sc.percentile), a = sc.iqScale;
  const h = Math.round((sc.displayedBand.upper - sc.displayedBand.lower) / 2 * 15);
  return `<section class="result-scene" data-reveal-stage="methodology-handoff"><h2 id="score-panel-heading" class="visually-hidden">${E(s.scoreHeading)}</h2><section class="score-panel score-panel--${variant}" aria-labelledby="score-panel-heading"><p class="score-panel__caveat" role="note">${E(s.caveat)}</p><div class="score-panel__triplet">${SP("percentile", "percentile-to-iq", F(s.percentileAriaTemplate, { N: p }), p)}${SP("anchor", "overview", F(s.anchorAriaTemplate, { N: a }), a)}${SP("band", "uncertainty", s.bandAriaTemplate, F(s.bandTemplate, { N: h }))}</div>${DS(s, c)}</section>${tailScene(variant, tailScenes, crisis)}</section>`;
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

const Z = { totals: { easy: 0, medium: 0, hard: 0 }, correct: { easy: 0, medium: 0, hard: 0 } };

export async function render(rootEl, strings) {
  if (m) { detach(); m = null; }
  rs.resetRevealStage();
  let pool, bands = null, tailScenes = null;
  try {
    const [pr, br, tr] = await Promise.all([
      fetch("/src/items/item-parameters.json"),
      fetch("/src/items/item-difficulty-bands.json"),
      fetch("/src/content/i18n/en/tail-scenes.json"),
    ]);
    if (!pr || !pr.ok) throw new Error("fetch failed");
    pool = await pr.json();
    if (br && br.ok) bands = await br.json();
    if (tr && tr.ok) tailScenes = await tr.json();
  } catch { renderErrorFallback(rootEl, strings); return; }
  const score = scoreSession({
    responses: state.getState().responses.map((x) => x.response),
    itemParameters: pool.items,
    normingStats: { se_norming: 0 },
  });
  const counts = bands ? computeDifficultyCounts(pool, bands, state.getState().responses, state.getState().seed) : Z;
  const variant = selectTailScene(Math.round(score.percentile));
  let crisis = null;
  if (variant === "bottom-decile") {
    try {
      const cr = await fetch("/src/content/crisis-resources/en.json");
      if (cr && cr.ok) crisis = await cr.json();
    } catch {}
  }
  rootEl.innerHTML = beat(strings.result);
  m = { ls: [] };
  on(rootEl.querySelector(".rs-show"), "click", () => {
    detach(); m.ls = [];
    rootEl.innerHTML = panel(strings.result, score, counts, variant, tailScenes, crisis);
    bindTriplet(rootEl);
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
