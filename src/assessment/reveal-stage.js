// src/assessment/reveal-stage.js — Story 6.1 AC-1/AC-3 (ADR-3-1 6-stage enum + timings wire).
import timings from "./reveal-stage-timings.json" with { type: "json" };

const O = ["anchor", "band", "interval", "context", "tail-scene", "methodology-handoff"];
const fired = new Set();

export function dispatchStage(stage) {
  const i = O.indexOf(stage);
  if (i < 0) throw new RangeError(`unknown reveal stage: ${stage}`);
  if (fired.has(stage)) throw new Error(`reveal stage already fired this session: ${stage}`);
  for (let j = 0; j < i; j++) if (!fired.has(O[j])) throw new Error("reveal stages must fire in declared order");
  document.dispatchEvent(new CustomEvent("iqme:reveal-stage", {
    bubbles: true, composed: false, detail: { stage, t: performance.now() },
  }));
  fired.add(stage);
}

export const resetRevealStage = () => fired.clear();
export const revealStageTimings = timings;
