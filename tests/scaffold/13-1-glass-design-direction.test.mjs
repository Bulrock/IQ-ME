// Story 13-1 — Acceptance guard for the glassmorphism + motion design-direction
// research/spec artifact (AC 1–5). Epic 13 is research/design-first; this story
// ships only the design-direction Markdown spec under
// _bmad-output/planning-artifacts/ plus this structural guard. The token values
// and motion principles it pins are consumed by Stories 13-2..13-5.
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
  "glassmorphism-motion-design-direction.md",
);

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

test("AC1: design direction defines a glass token vocabulary with concrete values (blur scale + glass fill)", () => {
  const spec = read(SPEC);
  assert.match(spec, /--glass-blur-(sm|md|lg)/, "must define a named glass blur scale token");
  assert.match(spec, /--glass-fill\b/, "must define a glass surface fill token");
  // Light + dark fills present (the contrast guarantee, not blur).
  assert.match(spec, /rgba\(\s*255,\s*255,\s*255/i, "must pin a concrete light glass fill value");
  assert.match(spec, /backdrop-filter/i, "must name backdrop-filter as the glass technique");
});

test("AC2: design direction defines a motion vocabulary + a prefers-reduced-motion policy", () => {
  const spec = read(SPEC);
  assert.match(spec, /--motion-(instant|quick|base|slow)/, "must define a named motion duration scale");
  assert.match(spec, /cubic-bezier\(/, "must define at least one easing curve");
  assert.match(
    spec,
    /prefers-reduced-motion:\s*reduce/i,
    "must state an explicit prefers-reduced-motion: reduce policy",
  );
});

test("AC3: design direction states a concrete WCAG 2.2 AA contrast guardrail", () => {
  const spec = read(SPEC);
  assert.match(spec, /WCAG\s*2\.2/i, "must reference WCAG 2.2");
  assert.match(spec, /4\.5:1/, "must state the 4.5:1 body-text contrast requirement");
  // The guarantee comes from an opaque fill, not from blur alone.
  assert.match(
    spec,
    /(opaque|opacity|alpha|solid fallback|@supports)/i,
    "contrast must be guaranteed by an opaque fill / solid fallback, not blur alone",
  );
});

test("AC4: design direction states the zero-third-party + byte-stable (snapshot-update) guardrails", () => {
  const spec = read(SPEC);
  assert.match(
    spec,
    /(zero[- ]third[- ]party|no external (font|css|js)|NFR21|NFR33)/i,
    "must state the zero-third-party constraint",
  );
  assert.match(
    spec,
    /snapshot-update/i,
    "must state that primitives/semantic changes use the codified make snapshot-update D→E exception",
  );
});

test("AC5: design direction names the Epic-11 surfaces the redesign must not regress", () => {
  const spec = read(SPEC);
  for (const pr of ["PR-2", "PR-5", "PR-6", "PR-7", "PR-11", "PR-13"]) {
    assert.match(spec, new RegExp(pr.replace("-", "[- ]?")), `must name Epic-11 surface ${pr}`);
  }
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
