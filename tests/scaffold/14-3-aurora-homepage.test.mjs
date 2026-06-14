// Story 14-3 — Acceptance guard for the Aurora homepage + primary CTAs (AC 1–6).
// Structural source-text checks only (no CSS parser; NFR33). Rendered baselines
// for the landing scene are committed centrally by Story 14.11 on ubuntu-latest.
//
// Authored in test-author phase (frozen during specialist impl).
// RED until the specialist migrates the decorative glow to semantic Aurora
// roles + adds the lit-from-within hero edge in landing.css.

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

test("AC1: hero keeps its glass depth + adds a lit-from-within inset edge (no px literal)", () => {
  const css = r("src", "css", "components", "landing.css");
  // Depth cues from Story 14.2 retuned roles stay wired.
  assert.match(css, /backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/, "hero must keep backdrop-filter blur from the semantic role");
  assert.match(css, /box-shadow:\s*var\(--surface-glass-shadow\)/, "hero box-shadow must consume the semantic shadow role");
  // Lit-from-within inset edge (matches .aurora-surface) via the hairline TOKEN, never a literal px.
  assert.match(css, /inset 0 var\(--border-width-hairline\) 0 var\(--surface-glass-edge\)/, "hero must add the inset lit edge via the hairline token");
});

test("AC2: decorative glow migrated to semantic Aurora roles; no --glass-tint primitive; two-layer clean", () => {
  const css = r("src", "css", "components", "landing.css");
  assert.match(css, /var\(--aurora-glow-accent\)/, "landing.css must consume the semantic --aurora-glow-accent role");
  assert.match(css, /var\(--backdrop-aurora-2\)/, "landing.css must consume the semantic --backdrop-aurora-2 role");
  assert.doesNotMatch(css, /var\(--glass-tint\)/, "landing.css must NOT consume the --glass-tint primitive (two-layer rule)");
});

test("AC2: no literal hex colour or font-family added to landing.css (token-only)", () => {
  const css = r("src", "css", "components", "landing.css");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "landing.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /font-family\s*:/, "landing.css must not contain a literal font-family declaration");
});

test("AC1/AC4: @supports solid fallback + dominant primary CTA + AA-clearing focus ring preserved", () => {
  const css = r("src", "css", "components", "landing.css");
  assert.match(css, /@supports not \(backdrop-filter/, "landing.css must keep the @supports solid fallback");
  // Primary CTA stays the dominant solid action affordance.
  assert.match(css, /\.landing__start-btn[\s\S]*background-color:\s*var\(--color-action-bg\)/, "primary CTA must keep the solid action background");
  // Focus-visible ring builds on the focus-ring token at offset.
  assert.match(css, /outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/, "CTA focus ring must consume --color-focus-ring");
  assert.match(css, /outline-offset:\s*var\(--space-1\)/, "CTA focus ring must keep its offset");
});

test("AC5: reduced-motion + responsive blocks intact", () => {
  const css = r("src", "css", "components", "landing.css");
  // Scene-level reduced-motion defense-in-depth zeroes animation.
  assert.ok(
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none/.test(css),
    "scene-level prefers-reduced-motion block must zero animation",
  );
  // Mobile down-scale media query preserved.
  assert.match(css, /@media \(max-width: 30rem\)/, "landing.css must keep the 30rem mobile down-scale media query");
});

test("AC3: frozen landing.js DOM contract preserved (restyle-only)", () => {
  const js = r("src", "assessment", "landing.js");
  assert.match(js, /start-test-btn/, "landing.js must keep the #start-test-btn id");
  assert.match(js, /landing__methodology-link/, "landing.js must keep the methodology link class");
  assert.match(js, /\/methodology\/v0\.1\.0\/en\//, "landing.js must keep the frozen methodology href");
  assert.match(js, /view-saved-btn/, "landing.js must keep the PR-14 saved-results entry point");
});
