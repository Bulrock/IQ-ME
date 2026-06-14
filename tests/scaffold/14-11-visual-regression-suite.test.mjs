// Story 14-11 — Acceptance / regression guard for the RENDERED visual-regression,
// CONTRAST, REDUCED-MOTION and PRINT verification suite (PR-30). AC of epics.md
// §"Story 14.11" (8 Given/When/Then clauses), design-direction §5 (verification
// handoff: approved viewports 320/375/414/768/1024/1280 + 1440 hero, light+dark,
// print/PDF leg, ±5% matrix-cell-to-option-icon parity).
//
// SOURCE-TEXT guard. Epic 14's verification is RENDERED (structural source-text
// guards alone missed the Epic 13 invisible-redesign — investigation Finding 5),
// so the rendered legs live in tests/playwright/aurora-visual-regression.spec.mjs
// and run under the dormant `visual-regression` pr-checks job. This guard, which
// RUNS in `make test`, asserts the rendered spec is CODE-COMPLETE (every AC leg /
// route / viewport / toHaveScreenshot / reduced-motion / print / axe-core / ±5%
// geometry / focus leg is present in the spec source) and that the CI wiring is
// in the agreed CODE-COMPLETE-but-DORMANT state.
//
// CODE-COMPLETE, JOB DORMANT (scope decision). The authoring host is darwin; CI
// is ubuntu-latest. Playwright names snapshots per-platform (`*-linux.png`), which
// cannot be produced on darwin, so NO PNG baselines and NO `*-snapshots/` dir are
// committed by this story. The `visual-regression` job therefore STAYS `if: false`
// (still a DEFERRED job in ci-matrix.test.mjs's ALL_JOBS, not EPIC_1_ACTIVE), and
// its `# Activates in Epic 14 (Story 14.11)` comment is updated to record that the
// spec is authored/complete and that final activation is pending the ubuntu-latest
// baseline bootstrap. Four families below.

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

const SPEC = ["tests", "playwright", "aurora-visual-regression.spec.mjs"];
const PR_CHECKS = [".github", "workflows", "pr-checks.yml"];
const CI_MATRIX = ["tests", "scaffold", "ci-matrix.test.mjs"];
const REQUIRED_CI = ["docs", "required-ci-checks.md"];

// The seven approved reference-viewport widths (design-direction §5: 320/360/414/
// 768/1024/1280 discrete + 1440 hero; the AC enumerates 320/375/414/768/1024/1280/
// 1440 as the screenshot set). The spec must reference each as a capture width.
const APPROVED_WIDTHS = ["320", "375", "414", "768", "1024", "1280", "1440"];

// ─── (1) RENDERED SPEC — every AC leg is authored in the spec source ─────────

test("PR-30/AC-1: the rendered spec drives the seeded ?test=1 / window.__IQME_TEST__ harness against tools/dev-server.mjs (trust-verification template)", () => {
  const spec = r(...SPEC);
  assert.match(spec, /from\s+["'][^"']*tools\/dev-server\.mjs["']/, "spec must import { start } from tools/dev-server.mjs");
  assert.match(spec, /__IQME_TEST__/, "spec must drive the seeded window.__IQME_TEST__ harness");
  assert.match(spec, /\?test=1/, "spec must activate the harness via the ?test=1 gate");
  assert.match(spec, /@playwright\/test/, "spec must use @playwright/test (zero-third-party at runtime — only installed at CI time)");
});

test("PR-30/AC-1: toHaveScreenshot baselines per route — landing, consent, item-runner, result pre-reveal, revealed score-panel, top-decile + bottom-decile tail-scenes, ≥1 methodology page", () => {
  const spec = r(...SPEC);
  assert.match(spec, /toHaveScreenshot/, "spec must capture toHaveScreenshot baselines");
  // Each AC-1 route must appear as a screenshot leg (the baseline name encodes the route).
  for (const route of [
    "landing",
    "consent",
    "item-runner",
    "result-prereveal",
    "score-panel",
    "top-decile",
    "bottom-decile",
    "methodology",
  ]) {
    assert.match(spec, new RegExp(route.replace(/-/g, "\\-")), `spec must capture a toHaveScreenshot leg for the "${route}" route`);
  }
});

test("PR-30/AC-1: screenshots are captured at the seven approved viewport widths in BOTH light + dark themes, at a documented maxDiffPixelRatio (~0.01-0.02)", () => {
  const spec = r(...SPEC);
  for (const w of APPROVED_WIDTHS) {
    assert.match(spec, new RegExp(`\\b${w}\\b`), `spec must capture at the approved viewport width ${w}`);
  }
  assert.match(spec, /\blight\b/, "spec must capture the light theme");
  assert.match(spec, /\bdark\b/, "spec must capture the dark theme");
  assert.match(spec, /colorScheme/, "spec must drive the theme via emulateMedia({ colorScheme })");
  // Tolerance in the documented ~1-2% band (0.01-0.02) — absorbs AA jitter without masking composition drift.
  const m = spec.match(/maxDiffPixelRatio\s*:\s*(0?\.0[12])\b/);
  assert.ok(m, "spec must document a maxDiffPixelRatio in the ~0.01-0.02 (1-2%) range");
});

test("PR-30/AC-1: the frozen Epic 11/13 DOM contracts are exercised-but-unmodified (.landing / #start-test-btn-class / methodology-link / co-equal .score-panel triplet)", () => {
  const spec = r(...SPEC);
  assert.match(spec, /\.landing\b/, "spec must exercise the frozen .landing contract");
  assert.match(spec, /\.score-panel\b/, "spec must exercise the frozen co-equal .score-panel triplet");
});

// ─── (2) ±5% COMPUTED-GEOMETRY SCALE PARITY (AC-2) ───────────────────────────

test("PR-30/AC-2: ±5% matrix-cell-to-option-icon parity from LIVE getBoundingClientRect — matrix cell = image width ÷ data-grid-cols vs option figure, both aspect-ratio:1/1", () => {
  const spec = r(...SPEC);
  assert.match(spec, /getBoundingClientRect/, "spec must read LIVE rendered geometry via getBoundingClientRect (not CSS source)");
  assert.match(spec, /data-grid-cols/, "spec must divide the matrix image width by the data-grid-cols attribute (Story 14.6) to get the cell size");
  assert.match(spec, /item-runner__image/, "spec must measure the rendered matrix image");
  assert.match(spec, /item-runner__option-(figure|image)/, "spec must measure the rendered option figure/image");
  // ±5% tolerance and the aspect-ratio:1/1 (no-distortion) assertion.
  assert.match(spec, /0\.05\b/, "spec must assert option-icon width within ±5% (0.05) of the matrix-cell size");
  assert.match(spec, /aspect[- ]?ratio|aspectRatio/i, "spec must assert both retain aspect-ratio 1/1 (no distortion)");
});

// ─── (3) NO-CLIPPING ACROSS THE 7 WIDTHS (AC-3) ──────────────────────────────

test("PR-30/AC-3: no-clipping across the seven widths — image bbox within container + viewport, mirroring scrollWidth <= clientWidth + 1 (NFR1)", () => {
  const spec = r(...SPEC);
  assert.match(spec, /scrollWidth/, "spec must assert no horizontal overflow (scrollWidth <= clientWidth + 1) — NFR1");
  assert.match(spec, /clientWidth/, "spec must compare against clientWidth (the trust-verification overflow check)");
  // The clipping assertion iterates the approved widths.
  assert.match(spec, /setViewportSize/, "spec must iterate the approved viewport widths via setViewportSize");
});

// ─── (4) FOCUS-VISIBLE + :checked OVER THE AURORA BACKDROP (AC-4) ────────────

test("PR-30/AC-4: keyboard-only focus + :checked — visible focus indicator (computed outline differs from unfocused), selected-answer border over Aurora, + a toHaveScreenshot of the focused option", () => {
  const spec = r(...SPEC);
  assert.match(spec, /\.keyboard\b|press\(\s*["']Tab["']\s*\)|["']Tab["']/i, "spec must tab keyboard-only to drive focus-visible");
  assert.match(spec, /outline/i, "spec must assert the computed outline (focus indicator) differs measurably from the unfocused state");
  assert.match(spec, /:checked|checked/i, "spec must capture the :checked selected-answer state");
  assert.match(spec, /focus/i, "spec must capture a toHaveScreenshot of the focused option (the focus leg)");
});

// ─── (5) REDUCED-MOTION STABLE STATIC END-STATE (AC-5) ───────────────────────

test("PR-30/AC-5: reduced-motion re-runs route screenshots under emulateMedia({ reducedMotion: 'reduce' }) and asserts a STABLE static end-state (landing + result)", () => {
  const spec = r(...SPEC);
  assert.match(spec, /reducedMotion\s*:\s*["']reduce["']/, "spec must re-run under emulateMedia({ reducedMotion: 'reduce' })");
  // The stable-end-state legs must name the landing + result surfaces.
  assert.match(spec, /reduced-?motion/i, "spec must label the reduced-motion legs");
});

// ─── (6) PRINT / PDF DOCUMENT LEG (AC-6) ─────────────────────────────────────

test("PR-30/AC-6: print leg seeds a result session, emulates print media (and/or page.pdf()) and asserts the co-equal triplet + difficulty band + open disclaimer present, glass/CTAs dropped", () => {
  const spec = r(...SPEC);
  assert.match(spec, /emulateMedia\(\s*\{\s*media\s*:\s*["']print["']/, "spec must emulate print media (emulateMedia({ media: 'print' }))");
  assert.match(spec, /page\.pdf\(|\.pdf\(/, "spec must exercise the page.pdf() print path (and/or print-media screenshot)");
  assert.match(spec, /score-panel__triplet|co-equal|percentile/i, "spec print leg must assert the co-equal Percentile/IQ-scale/Range triplet survives");
  assert.match(spec, /disclaimer|details|summary/i, "spec print leg must assert the disclaimer renders open in print");
});

// ─── (7) axe-core AA CONTRAST OVER THE GRADIENT BACKDROP (AC-7) ──────────────

test("PR-30/AC-7: axe-core AA-only contrast over the rendered gradient backdrop — disableRules(color-contrast-enhanced), both themes, zero violations", () => {
  const spec = r(...SPEC);
  assert.match(spec, /AxeBuilder|axe-core/i, "spec must run axe-core (AxeBuilder) for the contrast leg");
  assert.match(spec, /color-contrast-enhanced/, "spec must scope axe to AA only (disableRules(['color-contrast-enhanced'])) — mirrors trust-a11y.spec.mjs");
  assert.match(spec, /wcag2aa/, "spec must assert the WCAG 2.2 AA contrast tag set over the gradient");
  // Both themes audited over the gradient.
  assert.match(spec, /colorScheme/, "spec must audit contrast in both [data-theme] palettes via emulateMedia({ colorScheme })");
});

// ─── (8) CI WIRING — DORMANT (if: false) + UPDATED ACTIVATES COMMENT ─────────

test("PR-30/AC-8: the pr-checks.yml visual-regression job is PRESENT, STILL dormant (if: false), and runs the aurora spec", () => {
  const yml = r(...PR_CHECKS);
  assert.match(yml, /^  visual-regression:\s*$/m, "pr-checks.yml must declare the visual-regression job");
  // Locate the job body and assert it keeps `if: false` (CODE-COMPLETE, job DORMANT).
  const idx = yml.indexOf("\n  visual-regression:");
  assert.ok(idx >= 0, "visual-regression job declaration not found");
  const body = yml.slice(idx, idx + 900);
  assert.match(body, /^\s*if:\s*false\s*$/m, "the visual-regression job MUST stay `if: false` (no ubuntu-latest baselines committed yet)");
  assert.match(body, /aurora-visual-regression\.spec\.mjs/, "the job must run tests/playwright/aurora-visual-regression.spec.mjs");
});

test("PR-30/AC-8: the visual-regression job keeps a `# Activates in Epic 14` comment, updated to record the spec is authored/complete + activation pending the ubuntu-latest baseline bootstrap", () => {
  const yml = r(...PR_CHECKS);
  const idx = yml.indexOf("\n  visual-regression:");
  const body = yml.slice(idx, idx + 900);
  assert.match(body, /#\s*Activates in (Epic|Story)\s+\S+/i, "the deferred job must keep its `# Activates in Epic <N>` comment (ci-matrix AC-3 discipline)");
  // The comment must record the code-complete-but-dormant state.
  assert.match(body, /authored|code-complete|complete/i, "the comment must record that the rendered spec is authored/code-complete");
  assert.match(body, /ubuntu-latest|baseline/i, "the comment must record that activation is pending the ubuntu-latest baseline bootstrap");
});

test("PR-30/AC-8: ci-matrix still lists visual-regression in ALL_JOBS and KEEPS it DEFERRED (not in EPIC_1_ACTIVE) — discipline intact", () => {
  const ci = r(...CI_MATRIX);
  assert.match(ci, /"visual-regression"/, "ci-matrix.test.mjs ALL_JOBS must still register visual-regression");
  // It must NOT be promoted into EPIC_1_ACTIVE while it stays dormant (no baselines).
  const activeStart = ci.indexOf("const EPIC_1_ACTIVE");
  const activeEnd = ci.indexOf("]);", activeStart);
  const activeBlock = ci.slice(activeStart, activeEnd);
  assert.doesNotMatch(activeBlock, /"visual-regression"/, "visual-regression must stay DEFERRED (NOT in EPIC_1_ACTIVE) until ubuntu-latest baselines are committed");
});

test("PR-30/AC-8: docs/required-ci-checks.md gains a deferred/dormant visual-regression row under the Accessibility/Playwright section", () => {
  const doc = r(...REQUIRED_CI);
  assert.match(doc, /visual-regression/, "required-ci-checks.md must enumerate the visual-regression job by name");
  assert.match(doc, /aurora-visual-regression\.spec\.mjs/, "the row must link the aurora-visual-regression.spec.mjs source");
  // Marked deferred/dormant (not asserted as a currently-required check).
  assert.match(doc, /deferred|dormant|ubuntu-latest/i, "the row must mark the job deferred/dormant (activates once ubuntu-latest baselines are committed)");
});

// ─── NO STRAY BASELINES — no committed PNG / *-snapshots dir from this story ──

test("PR-30: no PNG baselines and no *-snapshots/ directory are committed by this story (baselines are bootstrapped on ubuntu-latest)", () => {
  const snapDir = join(REPO_ROOT, "tests", "playwright", "aurora-visual-regression.spec.mjs-snapshots");
  assert.ok(!existsSync(snapDir), `no committed snapshot directory expected (found ${snapDir}); baselines are generated on ubuntu-latest in CI`);
});
