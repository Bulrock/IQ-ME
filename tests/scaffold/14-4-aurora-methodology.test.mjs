// Story 14-4 — Acceptance guard for the Aurora methodology selection scene +
// the COMPLETE /methodology/v0.1.0 route (masthead, sidebar nav, index sections,
// article bodies, trust signals). AC 1–7.
//
// Structural source-text checks only (no CSS parser; NFR33). The RENDERED
// visual-regression baselines for the methodology-index surface (Light + Dark)
// are committed centrally by Story 14.11 on ubuntu-latest — this story ships the
// source-text acceptance guard + a DORMANT methodology-index leg in the harness.
//
// Authored in test-author phase (frozen during specialist impl). RED until the
// specialist lands the masthead lit-edge + sidebar/index glass surfaces.

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

// The two semantic-role allow-lists. Component CSS for the methodology route may
// consume ONLY these glass + chrome roles — never a --glass-* / --color-neutral-*
// primitive, never a literal hex/rgba glass value (two-layer rule UX-DR1).
const FORBIDDEN_PRIMITIVE_RE = /var\(--glass-[a-z-]+\)|var\(--color-neutral-[0-9]+\)/;

test("AC1: methodology masthead composites glass against the deep-navy backdrop via semantic roles only", () => {
  const css = r("src", "css", "components", "masthead.css");
  // Strong fill behind the long-form trust signals (title/DOI/reviewer) for AA.
  assert.match(css, /background-color:\s*var\(--surface-glass-strong\)/, "masthead must consume the --surface-glass-strong role");
  assert.match(css, /backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/, "masthead must blur via the --surface-glass-blur role");
  assert.match(css, /-webkit-backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/, "masthead must keep the -webkit- prefixed blur");
  assert.match(css, /var\(--surface-glass-edge\)/, "masthead edge must consume the --surface-glass-edge role");
});

test("AC1: masthead reads as a deliberately raised panel (float shadow + lit-from-within inset edge, token-only)", () => {
  const css = r("src", "css", "components", "masthead.css");
  // Float depth from the semantic shadow role + a hairline inset top highlight
  // (matching .aurora-surface / the 14.3 hero), so the panel reads as elevated
  // over the busy navy backdrop. No literal px — the hairline TOKEN only.
  assert.match(css, /box-shadow:[\s\S]*var\(--surface-glass-shadow\)/, "masthead must float via the --surface-glass-shadow role");
  assert.match(css, /inset 0 var\(--border-width-hairline\) 0 var\(--surface-glass-edge\)/, "masthead must add the lit-from-within inset edge via the hairline token");
});

test("AC1/AC3: sidebar nav + index sections sit on semantic Aurora glass (no longer transparent over the backdrop)", () => {
  const css = r("src", "css", "components", "masthead.css");
  // The sidebar nav panel — a raised glass surface over the navy backdrop.
  assert.match(css, /\.methodology-sidebar\s*\{[\s\S]*?var\(--surface-glass\b[\s\S]*?\}/, "the .methodology-sidebar panel must consume a --surface-glass* role");
  // The index sections carry body-text links → the STRONG fill for AA (SC 1.4.3).
  assert.match(css, /\.methodology-index__section\s*\{[\s\S]*?var\(--surface-glass-strong\)[\s\S]*?\}/, "the .methodology-index__section panels must consume --surface-glass-strong for AA body text");
  // Both blur against the backdrop via the semantic blur role.
  const blurCount = (css.match(/backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/g) || []).length;
  assert.ok(blurCount >= 3, `masthead.css must blur the masthead + sidebar + index sections via --surface-glass-blur (found ${blurCount})`);
});

test("AC1/AC7: opaque @supports fallback keeps the new glass surfaces legible without backdrop-filter", () => {
  const css = r("src", "css", "components", "masthead.css");
  assert.match(css, /@supports not \(backdrop-filter:\s*blur\(1px\)\)/, "masthead.css must add the @supports not(backdrop-filter) solid fallback for its glass surfaces");
});

test("AC1/AC2: masthead.css introduces NO --glass-* / --color-neutral-* primitive and NO literal hex/rgba glass value (two-layer rule)", () => {
  const css = r("src", "css", "components", "masthead.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "masthead.css must not reference a --glass-* or --color-neutral-* primitive (consume semantic roles)");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "masthead.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /\brgba?\(/, "masthead.css must not contain a literal rgb/rgba glass value");
});

test("AC3: 46rem reading measure + app-shell scroll topology preserved on the methodology route", () => {
  const css = r("src", "css", "components", "masthead.css");
  // Comfortable reading measure for the article + masthead.
  assert.match(css, /max-width:\s*46rem/, "masthead.css must keep the 46rem article reading measure");
  // App-shell: on wide viewports the page is pinned and ONLY the content scrolls.
  assert.match(css, /@media \(min-width: 48rem\)/, "masthead.css must keep the 48rem app-shell breakpoint");
  assert.match(css, /\.methodology-index-page\s*\{[\s\S]*?overflow:\s*hidden/, "the index app-shell must pin the page (overflow hidden) so only the content column scrolls");
  assert.match(css, /\.methodology-index\s*\{[\s\S]*?overflow-y:\s*auto/, "the content column must remain the scroll region");
  // 14rem sidebar grid preserved.
  assert.match(css, /grid-template-columns:\s*14rem 1fr/, "masthead.css must keep the 14rem app-shell sidebar column");
});

test("AC2: selection scene stays in semantic roles only (glass via the frozen .glass-surface primitive in markup)", () => {
  const css = r("src", "css", "components", "selection-scene.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "selection-scene.css must not reference a --glass-* or --color-neutral-* primitive");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "selection-scene.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /font-family\s*:/, "selection-scene.css must not contain a literal font-family declaration");
  // Native radio control semantics + focus ring preserved.
  assert.match(css, /input\[type="radio"\]/, "selection-scene.css must keep the native radio control styling hook");
  assert.match(css, /outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/, "selection-scene.css must keep the AA-clearing focus ring token");
});

test("AC6: reduced-motion contract — no new surviving motion on the methodology route or selection scene", () => {
  const masthead = r("src", "css", "components", "masthead.css");
  const selection = r("src", "css", "components", "selection-scene.css");
  // The methodology route stays motion-free (no animation/transition added by Aurora).
  assert.doesNotMatch(masthead, /\btransition\s*:/, "masthead.css must not introduce a transition (the route is static; Aurora is a painted scene)");
  assert.doesNotMatch(masthead, /\banimation\s*:/, "masthead.css must not introduce an animation");
  // Selection scene keeps its reduced-motion defense-in-depth on the Continue btn.
  assert.match(selection, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition:\s*none/, "selection-scene.css must keep dropping the Continue-btn transition under prefers-reduced-motion");
});

test("AC6: frozen Epic 11/13 DOM contracts preserved — selection.js (restyle-only)", () => {
  const js = r("src", "assessment", "selection.js");
  assert.match(js, /selection-scene glass-surface/, "selection.js must keep composing glass via the .glass-surface primitive on the scene element");
  assert.match(js, /selection-scene__group/, "selection.js must keep the radio fieldset hook");
  assert.match(js, /selection-scene__continue-btn/, "selection.js must keep the Continue-btn hook");
  assert.match(js, /selection-scene__back-link/, "selection.js must keep the back-link hook");
  assert.match(js, /type="radio"/, "selection.js must keep native <input type=radio> semantics");
});

test("AC3/AC6: frozen Epic 11/13 DOM contracts preserved — build-methodology.mjs markup (restyle-only)", () => {
  const mjs = r("tools", "build-methodology.mjs");
  assert.match(mjs, /class="methodology-masthead"/, "build-methodology.mjs must keep the .methodology-masthead contract");
  assert.match(mjs, /class="methodology-sidebar"/, "build-methodology.mjs must keep the .methodology-sidebar contract");
  assert.match(mjs, /class="methodology-sidebar__link"/, "build-methodology.mjs must keep the .methodology-sidebar__link contract");
  assert.match(mjs, /class="methodology-index__section"/, "build-methodology.mjs must keep the .methodology-index__section contract");
  assert.match(mjs, /class="cite-this-page-affordance"/, "build-methodology.mjs must keep the cite-this-page trust-signal contract");
  // The route still loads masthead.css (where the Aurora glass for the whole route lives).
  assert.match(mjs, /href="\/src\/css\/components\/masthead\.css"/, "build-methodology.mjs must keep loading masthead.css on the route");
});

test("AC4: dark glass keeps the lighter neutral-800-band ink (raised panel), never the page color (semantic.css)", () => {
  const css = r("src", "css", "semantic.css");
  // Dark fill must differ from the neutral-900 page color so the panel reads as raised
  // (the Epic 13 same-color failure stays resolved). The fill is the AA contrast guarantee.
  assert.match(css, /\[data-theme="dark"\][\s\S]*--surface-glass-strong:\s*rgba\(44, 56, 84, 0\.90\)/, "dark --surface-glass-strong must keep the lighter raised-panel fill (≥0.90 alpha)");
  assert.match(css, /--surface-glass-edge:\s*rgba\(150, 180, 240, 0\.22\)/, "dark glass edge must keep the lit rim that defines the panel against the backdrop");
});

test("AC7: dormant methodology-index visual-regression leg wired into the harness (baselines deferred to 14.11)", () => {
  const spec = r("tests", "playwright", "aurora-visual-regression.spec.mjs");
  // The methodology-index route must be captured in Light + Dark (Aurora glass-on-navy).
  assert.match(spec, /methodology[\/-]/i, "the harness must include a methodology-index capture leg");
  assert.match(spec, /\/methodology\/v0\.1\.0\//, "the methodology leg must target the /methodology/v0.1.0/ route");
});
