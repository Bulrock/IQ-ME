// Story 13-3 — Acceptance guard for the creative homepage redesign + motion.
// Asserts the landing scene adopts the glass look + a reduced-motion-safe
// entrance, stays additive to the frozen Story-3.3 DOM contract, and introduces
// no forbidden globals or marketing copy.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks over the source text. RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const LANDING_CSS = join(REPO_ROOT, "src", "css", "components", "landing.css");
const LANDING_JS = join(REPO_ROOT, "src", "assessment", "landing.js");
const BASE_CSS = join(REPO_ROOT, "src", "css", "base.css");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

test("AC1: landing.css adopts the glass look via the semantic glass roles", () => {
  const css = read(LANDING_CSS);
  assert.match(
    css,
    /var\(--surface-glass(\b|-)/,
    "landing.css must reference a --surface-glass* semantic role (glass hero/CTA)",
  );
});

test("AC3: landing.css defines an entrance animation using the motion tokens", () => {
  const css = read(LANDING_CSS);
  assert.match(css, /@keyframes/, "must define an @keyframes entrance");
  assert.match(css, /animation/, "must apply an animation to the hero/CTA");
  assert.match(
    css,
    /var\(--motion-(base|slow)\)/,
    "entrance must use a 13-1 motion duration token (--motion-base/--motion-slow)",
  );
  assert.match(
    css,
    /var\(--ease-standard\)/,
    "entrance must use the --ease-standard easing token",
  );
});

test("AC3: entrance motion collapses under prefers-reduced-motion (global block in base.css)", () => {
  const base = read(BASE_CSS);
  assert.match(
    base,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
    "base.css must carry the global prefers-reduced-motion: reduce block",
  );
  assert.match(
    base,
    /animation-duration\s*:\s*0\.01ms\s*!important/,
    "the reduce block must neutralize animation-duration",
  );
  assert.match(
    base,
    /transition-duration\s*:\s*0\.01ms\s*!important/,
    "the reduce block must neutralize transition-duration",
  );
});

test("AC2/AC4: landing.js stays additive to the frozen DOM contract and uses escape helpers", () => {
  const js = read(LANDING_JS);
  // Frozen Story-3.3 asserted nodes must still be emitted.
  for (const needle of [
    'class="landing"',
    'id="landing-heading"',
    'landing__paragraph',
    'landing__cta-group',
    'id="start-test-btn"',
    'landing__methodology-link',
    '/methodology/v0.1.0/en/',
  ]) {
    assert.ok(js.includes(needle), `landing.js must still emit ${needle} (frozen contract)`);
  }
  assert.match(js, /escapeText|escapeAttr/, "landing.js must use the escape helpers for any added text/attrs");
});

test("AC4: landing.js introduces no forbidden globals and no default export", () => {
  const js = read(LANDING_JS);
  assert.ok(!/\blocalStorage\b/.test(js), "localStorage forbidden");
  assert.ok(!/\bsessionStorage\b/.test(js), "sessionStorage forbidden");
  assert.ok(!/\bnavigator\.share\b/.test(js), "navigator.share forbidden");
  assert.ok(!/role=["']alert["']/.test(js), "role='alert' forbidden");
  assert.ok(!/\bMath\.random\b/.test(js), "Math.random forbidden");
  assert.ok(!/\bDate\.now\b/.test(js), "Date.now forbidden");
  assert.ok(!/\bconsole\.log\b/.test(js), "console.log forbidden");
  assert.ok(!/^export\s+default\b/m.test(js), "default export forbidden");
});

test("AC5: any decorative-only layer added to landing.js is aria-hidden", () => {
  const js = read(LANDING_JS);
  // If the redesign adds a decorative class (e.g. landing__hero-deco), it must
  // be marked aria-hidden. We assert the decorative-layer convention is present
  // OR no extra decorative div was added (both are acceptable; what's forbidden
  // is an announced decorative layer). We require that IF a *-deco class exists,
  // an aria-hidden attribute also exists in the file.
  if (/landing__[a-z-]*deco/.test(js) || /landing__glow|landing__aurora|landing__hero-bg/.test(js)) {
    assert.match(js, /aria-hidden="true"/, "decorative layers must be aria-hidden=\"true\"");
  } else {
    assert.ok(true, "no decorative layer added — nothing to hide from SR");
  }
});
