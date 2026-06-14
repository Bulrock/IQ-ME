// Story 14-10 — Acceptance / regression guard for the Aurora PERFORMANCE BUDGET
// + REDUCED-MOTION HARDENING (PR-29). AC of epics.md §"Story 14.10",
// design-direction §4.1 (bounded budgets) / §4.2 (reduced-motion) / §6
// (anti-patterns).
//
// Source-text guard over the Aurora component CSS + the token primitives that
// back the bounded budgets. The RENDERED perf/visual leg (Lighthouse FCP/LCP +
// the committed visual-regression baselines on ubuntu-latest, in light + dark)
// is the dormant Playwright leg / Story 14.11; the authoring host is darwin.
// This story is HARDENING: it locks the §4.1 composite caps and the §4.2
// per-scene reduced-motion contract into a source guard so a later story cannot
// silently regress them. Four families:
//
//   1. COMPOSITE BUDGET (§4.1): (a) no single rule stacks more than ONE logical
//      backdrop-filter layer (a standard `backdrop-filter` + its `-webkit-`
//      prefix of the SAME blur is one layer, not two); (b) the deep-blur
//      `--glass-blur-lg` (20px) is referenced by AT MOST ONE surface (the
//      full-bleed hero glow) — never sprinkled across panels; (c) the decorative
//      aurora glow alphas stay ≤0.18 and the grid alpha ≤0.06 in the primitives
//      that back the --backdrop-* roles.
//
//   2. TWO-LAYER RULE (UX-DR1): components consume only SEMANTIC roles for glass
//      (--surface-glass* + the --surface-glass-blur blur role); no literal hex /
//      rgba color is added to a component file, and the standard glass blur is
//      driven by the semantic --surface-glass-blur role (centralized negative
//      assertion).
//
//   3. PER-SCENE REDUCED-MOTION (§4.2): every Aurora surface that carries
//      ENTRANCE / DECORATIVE animation (a `@keyframes` + `animation:` with a
//      deliberate final frame) ships its OWN per-scene
//      `@media (prefers-reduced-motion: reduce)` static end-state — mirroring
//      `.landing` / `.landing__aurora`, which pin `animation:none` +
//      opacity/transform to the deliberate final frame rather than freezing a
//      mid-animation frame. The aurora itself stays STATIC by default — no
//      continuous / looping / parallax motion (iteration-count is never
//      infinite) anywhere (§4.2 hard prohibition / §6 anti-pattern 3).
//
//   4. DEGRADATION (§6 anti-pattern 6): every Aurora glass surface keeps its
//      `@supports not (backdrop-filter: blur(1px))` opaque-fill fallback so the
//      AA contrast guarantee is carried by the fill alpha, not the blur, on
//      every degradation path.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const r = (...p) => {
  const f = join(REPO_ROOT, ...p);
  assert.ok(existsSync(f), `missing file: ${f}`);
  return readFileSync(f, "utf8");
};

const COMPONENTS = ["src", "css", "components"];
const PRIMITIVES = ["src", "css", "primitives.css"];
const SEMANTIC = ["src", "css", "semantic.css"];

// Comment-stripper so prose that NAMES a token / property it forbids (the file
// headers explain the budgets they enforce) is not a false positive for the
// declaration scans.
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, " ");

// The Aurora glass-surface component files audited by this story (14.3-14.9).
// Each carries at least one frosted backdrop-filter surface.
const GLASS_SURFACE_FILES = [
  "landing.css",
  "aurora.css",
  "glass-surface.css",
  "masthead.css",
  "consent-scene.css",
  "chrome-header.css",
  "chrome-footer.css",
  "item-runner.css",
  "score-panel.css",
  "saved-results.css",
];

// All Aurora component CSS touched 14.3-14.9 (glass surfaces + the chrome
// controls + scenes that carry interaction/decorative motion).
const ALL_AURORA_FILES = [
  ...GLASS_SURFACE_FILES,
  "selection-scene.css",
  "theme-toggle.css",
  "language-switcher.css",
];

// Surfaces that carry ENTRANCE / DECORATIVE animation (a @keyframes + animation:
// with a deliberate final frame). These MUST each ship a per-scene reduce rule
// pinning the static end-state — freezing a mid-animation frame would be a
// defect. Audited 14.3-14.9: landing is the only Aurora component with
// @keyframes/animation; the transition-only interaction surfaces are covered by
// the global duration-zeroing net in base.css (§4.2).
const ANIMATION_BEARING_FILES = ["landing.css"];

// Split a CSS string into top-level declaration-bearing rule bodies ({...}). Good
// enough for the per-rule backdrop-filter-stacking check (no nested {} appear in
// these flat component files except @media/@supports, which we treat as wrappers
// whose inner rules are themselves scanned).
const ruleBodies = (css) => {
  const bodies = [];
  const re = /\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) bodies.push(m[1]);
  return bodies;
};

// ─── (1) COMPOSITE BUDGET — §4.1 caps ────────────────────────────────────────

test("PR-29/§4.1: no single Aurora rule stacks more than ONE logical backdrop-filter layer (standard + -webkit- prefix of the same blur is one layer)", () => {
  for (const file of GLASS_SURFACE_FILES) {
    const css = stripCssComments(r(...COMPONENTS, file));
    for (const body of ruleBodies(css)) {
      // Count the standard (unprefixed) backdrop-filter declarations in this
      // rule. A `-webkit-backdrop-filter` is the SAME logical layer (vendor
      // prefix), so we count only the unprefixed property: ≤1 per rule.
      const standard = body.match(/(^|[;{\s])backdrop-filter\s*:/g) || [];
      assert.ok(
        standard.length <= 1,
        `${file}: a single rule stacks ${standard.length} backdrop-filter declarations — §4.1 caps composited filter layers at one per surface`,
      );
    }
  }
});

test("PR-29/§4.1: the deep-blur --glass-blur-lg (20px) is referenced by AT MOST ONE Aurora surface (full-bleed hero only — never sprinkled across panels)", () => {
  let total = 0;
  const where = [];
  for (const file of ALL_AURORA_FILES) {
    const css = stripCssComments(r(...COMPONENTS, file));
    const hits = css.match(/--glass-blur-lg\b/g) || [];
    if (hits.length) where.push(`${file}×${hits.length}`);
    total += hits.length;
  }
  assert.ok(
    total <= 1,
    `--glass-blur-lg must be reserved for a single full-bleed hero surface (primitives.css:111); found ${total} reference(s) across [${where.join(", ")}]`,
  );
});

test("PR-29/§4.1: the decorative aurora glow alphas stay ≤0.18 and the grid alpha ≤0.06 in the --backdrop-* token chain", () => {
  const prims = stripCssComments(r(...PRIMITIVES));
  // Pull the alpha (4th rgba channel) out of each Aurora glow/grid primitive.
  const alphaOf = (name) => {
    const m = prims.match(new RegExp(`${name}\\s*:\\s*rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*([0-9.]+)\\s*\\)`));
    assert.ok(m, `primitives.css must define ${name} as an rgba() with an explicit alpha`);
    return parseFloat(m[1]);
  };
  for (const glow of ["--aurora-blue-glow", "--aurora-violet-glow", "--aurora-blue-glow-light", "--aurora-violet-glow-light"]) {
    assert.ok(alphaOf(glow) <= 0.18, `${glow} alpha ${alphaOf(glow)} exceeds the §4.1 aurora-glow cap of 0.18`);
  }
  for (const grid of ["--aurora-grid-line", "--aurora-grid-line-light"]) {
    assert.ok(alphaOf(grid) <= 0.06, `${grid} alpha ${alphaOf(grid)} exceeds the §4.1 grid cap of 0.06`);
  }
  // The --backdrop-* aurora/grid semantic roles resolve only to these bounded
  // primitives (never to a brighter literal) — the two-layer indirection keeps
  // the cap centralized.
  const sem = stripCssComments(r(...SEMANTIC));
  for (const role of ["--backdrop-aurora-1", "--backdrop-aurora-2", "--backdrop-grid"]) {
    const decls = sem.match(new RegExp(`${role}\\s*:\\s*([^;]+);`, "g")) || [];
    assert.ok(decls.length > 0, `semantic.css must map ${role}`);
    for (const d of decls) {
      assert.match(d, /var\(--aurora-[a-z0-9-]+\)/, `${role} must resolve to a bounded --aurora-* primitive (not a literal), found: ${d.trim()}`);
    }
  }
});

// ─── (2) TWO-LAYER RULE — semantic roles only, no literal color, semantic blur ─

test("PR-29/UX-DR1: no Aurora component file introduces a literal hex / rgba color (two-layer rule — components consume only semantic roles)", () => {
  for (const file of ALL_AURORA_FILES) {
    const css = stripCssComments(r(...COMPONENTS, file));
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, `${file}: a literal hex color was added — components must consume only semantic --color-*/--surface-* roles`);
    assert.doesNotMatch(css, /\brgba?\(/, `${file}: a literal rgb/rgba color was added — components must consume only semantic roles`);
  }
});

test("PR-29/UX-DR1: every component frosted glass blur is driven by a CAPPED radius — the semantic --surface-glass-blur role or a grandfathered --glass-blur-{sm,md,lg} primitive — never an uncapped literal px", () => {
  // The standard panel blur uses the semantic --surface-glass-blur role; a small
  // chip (.landing__saved-btn) may use the grandfathered --glass-blur-sm radius
  // primitive (a capped 6px radius, NOT a color/contrast token). The guard
  // forbids an uncapped literal-px blur sneaking in — every blur radius must
  // come from a §4.1-capped token (6/12/20px).
  const CAPPED_BLUR = /var\(--surface-glass-blur\)|var\(--glass-blur-(?:sm|md|lg)\)/;
  for (const file of GLASS_SURFACE_FILES) {
    const css = stripCssComments(r(...COMPONENTS, file));
    const blurs = css.match(/(^|[;{\s])backdrop-filter\s*:\s*blur\(([^)]*)\)/g) || [];
    for (const decl of blurs) {
      assert.match(
        decl,
        CAPPED_BLUR,
        `${file}: a backdrop-filter blur must use a capped blur token (--surface-glass-blur or --glass-blur-{sm,md,lg}), never an uncapped literal px, found: ${decl.trim()}`,
      );
    }
  }
});

// ─── (3) PER-SCENE REDUCED-MOTION — §4.2 deliberate static end-state ─────────

test("PR-29/§4.2: every ENTRANCE/DECORATIVE-animation Aurora scene ships its own per-scene prefers-reduced-motion static end-state (animation:none pinned to the final frame — mirrors .landing__aurora)", () => {
  for (const file of ANIMATION_BEARING_FILES) {
    const css = stripCssComments(r(...COMPONENTS, file));
    // The scene declares entrance/decorative animation...
    assert.match(css, /\banimation\s*:/, `${file}: expected an entrance/decorative animation in an animation-bearing Aurora scene`);
    // ...so it MUST ship a per-scene reduce block...
    const reduceIdx = css.indexOf("@media (prefers-reduced-motion: reduce)");
    assert.ok(reduceIdx >= 0, `${file}: an animation-bearing Aurora scene must ship its OWN @media (prefers-reduced-motion: reduce) block (not rely only on the global net)`);
    const reduceBlock = css.slice(reduceIdx);
    // ...that pins the static end-state (animation:none + opacity/transform).
    assert.match(reduceBlock, /animation\s*:\s*none/, `${file}: the per-scene reduce block must pin animation:none (deliberate final frame, not a frozen mid-animation frame)`);
    assert.match(reduceBlock, /(opacity\s*:|transform\s*:\s*none)/, `${file}: the per-scene reduce block must pin the static opacity/transform end-state`);
  }
});

test("PR-29/§4.2/§6: no Aurora surface declares CONTINUOUS / looping / parallax motion — the aurora is static by default (no infinite animation-iteration-count anywhere)", () => {
  for (const file of ALL_AURORA_FILES) {
    const css = stripCssComments(r(...COMPONENTS, file));
    assert.doesNotMatch(css, /animation-iteration-count\s*:\s*infinite/, `${file}: continuous/looping motion is a §4.2 hard prohibition`);
    // An `animation:` shorthand may not carry the `infinite` keyword either.
    const shorthands = css.match(/\banimation\s*:[^;}]*/g) || [];
    for (const s of shorthands) {
      assert.doesNotMatch(s, /\binfinite\b/, `${file}: a looping animation shorthand (\`infinite\`) is forbidden (§4.2 / §6 anti-pattern 3)`);
    }
  }
});

test("PR-29/§4.2: a transition-bearing Aurora surface that already ships a per-scene reduce fallback keeps it (existing defense-in-depth precedent preserved)", () => {
  // landing.css + selection-scene.css set the precedent of a per-scene reduce
  // rule even for transition-bearing controls; the hardening story must not let
  // a later edit remove them.
  for (const file of ["landing.css", "selection-scene.css"]) {
    const css = stripCssComments(r(...COMPONENTS, file));
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${file}: the existing per-scene reduced-motion fallback must be preserved`);
  }
});

// ─── (4) DEGRADATION — §6 anti-pattern 6: opaque-fill fallback on every glass ─

test("PR-29/§6: every Aurora glass surface keeps its @supports not(backdrop-filter) opaque-fill fallback (AA carried by the fill alpha, never the blur)", () => {
  for (const file of GLASS_SURFACE_FILES) {
    const css = stripCssComments(r(...COMPONENTS, file));
    const supIdx = css.indexOf("@supports not (backdrop-filter: blur(1px))");
    assert.ok(supIdx >= 0, `${file}: must keep its @supports not (backdrop-filter: blur(1px)) opaque-fill fallback`);
    // The fallback drops to a STRONG opaque glass fill (the contrast guarantee).
    const supBlock = css.slice(supIdx, supIdx + 600);
    assert.match(
      supBlock,
      /background-color\s*:\s*var\(--surface-glass-strong\)/,
      `${file}: the @supports fallback must drop to the strong opaque fill (--surface-glass-strong) so AA holds without blur`,
    );
  }
});

// ─── PRESERVATION — frozen Epic 11/13 DOM contract selectors (restyle-only) ──

test("PR-29: the frozen Epic 11/13 DOM-contract selectors are still styled (restyle-only — no markup/contract removed)", () => {
  const landing = r(...COMPONENTS, "landing.css");
  // section.landing + #start-test-btn (.landing__start-btn) + the methodology
  // link contract are still present as styled selectors (hardening is CSS-only).
  assert.match(landing, /\.landing\b/, "section.landing must still be styled");
  assert.match(landing, /\.landing__methodology-link\b/, ".landing__methodology-link must still be styled");
  // The co-equal result triplet members stay styled in score-panel.css.
  const score = r(...COMPONENTS, "score-panel.css");
  for (const sel of [".score-panel__percentile", ".score-panel__anchor", ".score-panel__band"]) {
    assert.ok(score.includes(sel), `${sel} (co-equal triplet member) must remain styled`);
  }
});
