// src/assessment/reveal-stage.js — Story 3.5 AC-1 (ADR-3-1).
const O = ["anchor", "handoff"];
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
