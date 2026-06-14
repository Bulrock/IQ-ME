// Story 14-2 — Acceptance guard for the Aurora token foundation, deep-navy
// backdrop, reusable Aurora primitives, and the visual-regression harness
// (AC 1–6). Structural source-text checks only (no CSS/YAML parser; NFR33).
//
// Authored in test-author phase (frozen during specialist impl).
// RED until the specialist lands the token VALUES + backdrop + aurora.css +
// harness + the deferred CI job.

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

test("AC1: deep-navy backdrop — new primitive VALUES + semantic --backdrop-* roles (light + both dark blocks)", () => {
  const prim = r("src", "css", "primitives.css");
  const sem = r("src", "css", "semantic.css");
  const base = r("src", "css", "base.css");
  // New Aurora primitive values (deep navy + bounded aurora glows).
  assert.match(prim, /--aurora-navy-900\b/, "primitives.css must define the deep-navy backdrop primitive");
  assert.match(prim, /--aurora-(blue|violet)-glow\b/, "primitives.css must define a bounded aurora glow primitive");
  // New semantic backdrop roles.
  assert.match(sem, /--backdrop-base\b/, "semantic.css must define a --backdrop-base role");
  assert.match(sem, /--backdrop-aurora-1\b/, "semantic.css must define an aurora glow role");
  // Dark authored separately for BOTH the explicit opt-in and the system-pref block.
  assert.ok(
    /\[data-theme="dark"\][\s\S]*--backdrop-base/.test(sem),
    "dark [data-theme] block must author --backdrop-base separately",
  );
  assert.ok(
    /prefers-color-scheme:\s*dark[\s\S]*--backdrop-base/.test(sem),
    "system-pref dark block must author --backdrop-base separately",
  );
  // base.css paints the backdrop via background-image referencing the roles,
  // and keeps the --color-surface-base background-color contract intact.
  assert.match(base, /background-image:[\s\S]*var\(--backdrop-/, "base.css must paint the backdrop from --backdrop-* roles");
  assert.match(base, /background-color:\s*var\(--color-surface-base\)/, "base.css must keep the --color-surface-base contract");
});

test("AC2: replaced dark glass VALUES, names + indirection intact", () => {
  const sem = r("src", "css", "semantic.css");
  // The semantic glass role NAMES + their primitive indirection are unchanged.
  assert.match(sem, /--surface-glass:\s*var\(--glass-fill\)/, "light --surface-glass indirection preserved");
  assert.match(sem, /--surface-glass-strong:\s*var\(--glass-fill-strong\)/, "light --surface-glass-strong indirection preserved");
  // The OLD invisible dark fill (rgba(45, 52, 64, ...)) must be gone — replaced.
  assert.doesNotMatch(sem, /rgba\(\s*45,\s*52,\s*64/, "the Epic-13 dark glass value must be replaced with an Aurora value");
  // Dark glass still present (retuned) as a separately-authored value.
  assert.ok(
    /\[data-theme="dark"\][\s\S]*--surface-glass:\s*rgba\(/.test(sem),
    "dark --surface-glass must still be authored as a concrete (retuned) value",
  );
});

test("AC3: reusable Aurora primitives component consumes only semantic roles + has @supports fallback", () => {
  const aurora = r("src", "css", "components", "aurora.css");
  // Two-layer rule: no direct primitive refs (--glass-* / --color-neutral-* / --aurora-* primitives).
  assert.doesNotMatch(aurora, /var\(--glass-(blur|fill|edge|shadow|tint)/, "aurora.css must not consume --glass-* primitives directly");
  assert.doesNotMatch(aurora, /var\(--color-neutral-/, "aurora.css must not consume --color-neutral-* primitives directly");
  assert.doesNotMatch(aurora, /var\(--aurora-(navy|blue|violet|grid|pale)/, "aurora.css must not consume Aurora primitives directly (semantic roles only)");
  // Consumes semantic roles.
  assert.match(aurora, /var\(--surface-glass/, "aurora.css must consume semantic glass roles");
  // Mandatory solid fallback for any new surface variant.
  assert.match(aurora, /@supports not \(backdrop-filter/, "aurora.css must keep the @supports solid fallback");
});

test("AC4: aurora.css wired alphabetically in the link chain", () => {
  const html = r("src", "index.html");
  assert.match(html, /href="\/src\/css\/components\/aurora\.css"/, "index.html must link aurora.css");
  // Alphabetical: aurora.css must appear BEFORE chrome-footer.css in the chain.
  const ai = html.indexOf("components/aurora.css");
  const ci = html.indexOf("components/chrome-footer.css");
  assert.ok(ai !== -1 && ci !== -1 && ai < ci, "aurora.css <link> must precede chrome-footer.css (alphabetical)");
});

test("AC5: visual-regression + print/PDF harness spec + make snapshot-update-visual target", () => {
  const spec = r("tests", "playwright", "aurora-visual-regression.spec.mjs");
  assert.match(spec, /toHaveScreenshot/, "harness must use toHaveScreenshot (pixel baselines)");
  assert.match(spec, /\b320\b/, "harness must capture the 320 width");
  assert.match(spec, /\b1440\b/, "harness must capture the 1440 width");
  assert.match(spec, /print|\.pdf|emulateMedia/i, "harness must include a print/PDF render leg");
  assert.match(spec, /maxDiffPixelRatio/, "harness must document a maxDiffPixelRatio tolerance");
  const mk = r("Makefile");
  assert.match(mk, /^snapshot-update-visual:/m, "Makefile must define snapshot-update-visual target");
  assert.match(mk, /^\.PHONY:.*snapshot-update-visual/m, "snapshot-update-visual must be registered in .PHONY");
});

test("AC6: dormant visual-regression CI job (if: false + Activates-in) registered in ci-matrix ALL_JOBS", () => {
  const pr = r(".github", "workflows", "pr-checks.yml");
  // Job declared at 2-space indent.
  assert.match(pr, /^  visual-regression:\s*$/m, "pr-checks.yml must declare the visual-regression job");
  // Within the job body: if: false + Activates-in comment.
  const lines = pr.split("\n");
  const idx = lines.findIndex((l) => /^  visual-regression:\s*$/.test(l));
  const body = lines.slice(idx, idx + 15).join("\n");
  assert.match(body, /^\s*if:\s*false/m, "visual-regression must carry if: false (dormant)");
  assert.match(body, /#\s*Activates in (Epic|Story)\s+\S+/i, "visual-regression must carry the Activates-in comment");
  // Registered in the discipline test's ALL_JOBS.
  const cim = r("tests", "scaffold", "ci-matrix.test.mjs");
  assert.match(cim, /"visual-regression"/, "ci-matrix.test.mjs ALL_JOBS must register visual-regression");
});
