// Story 14-1 — Acceptance guard for the Aurora Glass Observatory design-direction
// artifact (AC 1–6). Epic 14 is design-direction-first; this story ships only the
// design-direction Markdown spec under _bmad-output/planning-artifacts/ plus this
// structural guard. The decisions it pins (deep-navy backdrop, bounded aurora/glass/
// grid, restrained test route, ink-economical print, bounded budgets, reduced-motion,
// zero-third-party, verification viewports + ±5% scale tolerance, anti-patterns) are
// consumed by Stories 14-2..14-12.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks (no markdown parser) — treat the spec as text.
// RED until the specialist writes the artifact per the ACs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const SPEC = join(
  REPO_ROOT,
  "_bmad-output",
  "planning-artifacts",
  "aurora-glass-observatory-design-direction.md",
);

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

test("AC1: artifact exists, is the Story 14.1 gate for 14.2+, and does NOT mutate Epic 13 token values", () => {
  const spec = read(SPEC);
  assert.match(spec, /\*\*Status:\*\*/i, "must carry a Status line");
  assert.match(spec, /gate/i, "must declare itself the design-direction gate");
  assert.match(spec, /14\.2\+|14\.2/, "must state it gates Story 14.2+");
  // Explicitly non-mutating: pins intent, defers token VALUE edits to 14.2.
  assert.match(
    spec,
    /does NOT mutate.*token VALUE|no production CSS.*no token VALUE/i,
    "must state it does NOT change any Epic 13 token VALUE (that is Story 14.2)",
  );
  // Preserves the two-layer architecture contract.
  assert.match(spec, /two-layer/i, "must preserve the two-layer token architecture");
});

test("AC2: backdrop & layering — deep-navy backdrop distinct from glass + explicit surface hierarchy", () => {
  const spec = read(SPEC);
  assert.match(spec, /deep-navy/i, "must pin a deep-navy spatial backdrop");
  // The fix for the Epic 13 same-color failure: backdrop RGB distinct from glass fill.
  assert.match(
    spec,
    /distinct from glass|darker.*than.*--surface-glass|differ.*RGB|different RGB/i,
    "backdrop must be perceptibly distinct from the glass fill (Epic 13 root-cause fix)",
  );
  assert.match(spec, /aurora/i, "must pin a bounded blue-violet aurora gradient");
  assert.match(spec, /grid/i, "must pin a thin luminous-grid rule");
  // Explicit surface hierarchy ordering.
  assert.match(
    spec,
    /page backdrop\s*(→|->|>).*content.*(→|->|>).*(glass )?panels?.*(→|->|>).*controls/i,
    "must state the explicit surface hierarchy ordering",
  );
  assert.match(spec, /1\.4\.3/, "must keep body-text contrast independent of backdrop (SC 1.4.3)");
});

test("AC3: route treatment — restrained test route, light-vs-dark, ink-economical print, frozen DOM contracts", () => {
  const spec = read(SPEC);
  assert.match(spec, /restrained/i, "must specify a restrained assessment-route variant");
  assert.match(
    spec,
    /separately authored|not auto-inverted/i,
    "light vs dark must be separately authored (not auto-inverted)",
  );
  assert.match(spec, /ink-economical/i, "must specify an ink-economical print translation");
  assert.match(spec, /no aurora.*print|print.*no aurora|no.*blur.*print/i, "print must drop aurora/blur");
  // Frozen Epic 11/13 DOM contracts named.
  assert.match(spec, /#start-test-btn/, "must name the frozen #start-test-btn contract");
  assert.match(spec, /section\.landing/, "must name the frozen section.landing contract");
  assert.match(spec, /Percentile|IQ-scale|Range/i, "must preserve the co-equal result triplet");
});

test("AC4: guardrails — bounded budgets, reduced-motion, zero-third-party", () => {
  const spec = read(SPEC);
  // Bounded budgets: capped blur radius and a capped backdrop-filter layer count.
  assert.match(spec, /20px/, "must cap the blur radius (<=20px)");
  assert.match(
    spec,
    /backdrop-filter.*(layers?|surfaces?).*(per (screen|viewport))|(per (screen|viewport)).*backdrop-filter/i,
    "must pin a max composited backdrop-filter layer budget per screen",
  );
  // Reduced-motion: collapses to no-op / opacity; forbids continuous/parallax.
  assert.match(spec, /prefers-reduced-motion/i, "must tie motion to prefers-reduced-motion");
  assert.match(
    spec,
    /(no|forbid|never).*(continuous|looping|parallax)|(continuous|looping|parallax).*(forbidden|prohibit)/i,
    "must forbid continuous/looping/parallax motion",
  );
  // Zero third-party.
  assert.match(
    spec,
    /(zero[- ]third[- ]party|no images, no SVG|NFR6|NFR7)/i,
    "must state the zero-third-party invariant",
  );
});

test("AC5: verification handoff — viewport set, ±5% scale tolerance, documented CI exception, byte-stable", () => {
  const spec = read(SPEC);
  // Approved reference viewports.
  for (const w of ["320", "768", "1280"]) {
    assert.match(spec, new RegExp(`\\b${w}\\b`), `must name reference viewport ${w}`);
  }
  // Question-to-answer scale tolerance.
  assert.match(spec, /(\+\/-|±)\s*5%|5%/, "must name the ±5% question-to-answer scale tolerance");
  // The visual-regression CI job is the documented Epic 14 exception.
  assert.match(spec, /visual-regression/i, "must name the visual-regression verification");
  assert.match(spec, /exception/i, "must frame the new CI job as a documented exception");
  // Byte-stable, doc/spec only re production surface.
  assert.match(spec, /byte-stable|NFR21/i, "must keep the build byte-stable (NFR21)");
});

test("AC6: anti-patterns — bars Epic 13 failure modes + preserves graceful degradation", () => {
  const spec = read(SPEC);
  // Bar the exact Epic 13 failure: translucent over flat same-color backdrop.
  assert.match(
    spec,
    /same-color backdrop|same color.*backdrop|flat same-color/i,
    "must bar translucent surface over a flat same-color backdrop",
  );
  // Bounded (never unbounded) effects.
  assert.match(spec, /unbounded/i, "must bar unbounded blur/glow/shadow/grid/motion");
  // Graceful degradation rule preserved.
  assert.match(spec, /@supports not/i, "must preserve the @supports not(backdrop-filter) fallback");
  assert.match(
    spec,
    /alpha.*contrast guarantee|contrast guarantee.*(fill )?alpha|never.*blur/i,
    "contrast guarantee must remain the fill alpha + fallback, never blur",
  );
});

test("no fabricated citations: references are public/verifiable standards only", () => {
  const spec = read(SPEC);
  assert.match(spec, /WCAG\s*2\.2/i, "cites WCAG 2.2");
  assert.match(spec, /prefers-reduced-motion/i, "cites Media Queries reduced-motion");
  // Must not assert an empirical metric as if measured (claims-manifest discipline by analogy).
  assert.ok(
    !/\b\d+%\s+(faster|more legible|of users (preferred|chose))\b/i.test(spec),
    "spec must not assert fabricated empirical metrics",
  );
});
