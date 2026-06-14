// Story 14-7 — Acceptance / regression guard for the RESTRAINED Aurora
// assessment route + the NO-TIMER UI policy. AC of epics.md §"Story 14.7"
// (PR-23 / PR-28), design-direction §3.1.
//
// Two guard families, both source-text (the RENDERED restraint/contrast
// verification — that the assessment surfaces read at a LOWER glass intensity
// than landing/result, in light + dark — is deferred to the dormant Playwright
// leg / Story 14.11; the authoring host is darwin):
//
//   1. NO-TIMER FORBIDDING guard (modeled on 9e-1-tester-credibility's
//      duration-regex): the assessment-route source — item-runner.js +
//      item-runner.css + the itemRunner strings — must contain NO timer,
//      countdown, elapsed-time, stopwatch, speed-score, "time remaining",
//      "X seconds left", or any time-pressure / time-gamification element.
//      Only self-paced / no-time-limit messaging is permitted. The progress
//      indicator renders POSITION ONLY ("Item N of total"), never a duration.
//
//   2. RESTRAINT + PRESERVATION guard: item-runner.css uses the MUTED
//      --surface-glass role (NOT --surface-glass-strong) for the working-area
//      surfaces, with a backdrop-blur driven by the --surface-glass-blur
//      SEMANTIC role (never a --glass-* primitive); the test-route aurora
//      suppression rule exists in base.css (background-color stays
//      --color-surface-base — untouched); and 14.6's option rendering + the
//      frozen Epic 11/13 DOM contract + the PR-2 sticky-nav/scroll/max-height
//      layout all remain intact.

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
const readJson = (...p) => JSON.parse(r(...p));

const ITEM_RUNNER_JS = ["src", "assessment", "item-runner.js"];
const ITEM_RUNNER_CSS = ["src", "css", "components", "item-runner.css"];
const BASE_CSS = ["src", "css", "base.css"];
const STRINGS = (lang) => ["src", "content", "i18n", lang, "strings.json"];

// ─── No-timer forbidding regexes (modeled on 9e-1's FABRICATED_TALLY /
//     duration-regex style). Each names a distinct time-pressure surface. We
//     scan the source as CODE-COMMENT-STRIPPED text so an incidental word in a
//     comment (e.g. Chrome's "preloaded but not used within a few seconds"
//     dev-warning note in item-runner.js) is not a false positive — only real
//     user-facing/runtime time semantics on the assessment route are forbidden.
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ") // block comments (JS + CSS)
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 "); // line comments (JS), keep http(s)://

// A countdown / elapsed / stopwatch / speed-score timer element or framing.
const TIMER_ELEMENT_RE =
  /\b(countdown|stopwatch|elapsed[- ]?time|time[- ]?remaining|time[- ]?left|seconds?[- ]?left|speed[- ]?(score|bonus|run)|time[- ]?(pressure|bonus|limit|attack)|setInterval)\b/i;

// A user-facing "X seconds/minutes left/remaining" or per-item timing string.
const TIME_STRING_RE =
  /\b\d+\s*(second|sec|minute|min|hour)s?\b[^\n]{0,40}\b(left|remaining|elapsed|to (go|answer|finish)|per (item|question))\b/i;

// ─── (1) NO-TIMER — item-runner.js source carries no timer semantics ─────────

test("PR-28: item-runner.js (assessment-route logic) contains NO timer/countdown/elapsed/speed-score element", () => {
  const js = stripComments(r(...ITEM_RUNNER_JS));
  assert.doesNotMatch(js, TIMER_ELEMENT_RE, "item-runner.js must not introduce a countdown/stopwatch/elapsed/speed-score/setInterval timer");
  assert.doesNotMatch(js, TIME_STRING_RE, "item-runner.js must not render an 'X seconds/minutes left/remaining' time string");
  // No per-response timing capture (NFR6 — no telemetry of response timings):
  // the runner must not stamp Date.now()/performance.now() onto a response or
  // start an interval-driven clock.
  assert.doesNotMatch(js, /performance\.now\(\)/, "item-runner.js must not capture response timings via performance.now() (NFR6)");
  assert.doesNotMatch(js, /setInterval\s*\(/, "item-runner.js must start no interval clock");
});

test("PR-28: the .item-runner__progress indicator renders POSITION ONLY (Item N of total) — never a time/duration string", () => {
  const js = r(...ITEM_RUNNER_JS);
  // The progress div is fed by strings.itemRunner.progressTemplate with {N,total}
  // ONLY — no time token is interpolated.
  assert.match(
    js,
    /const progress = fmt\(strings\.itemRunner\.progressTemplate, \{ N, total: sessionSize \}\)/,
    "progress must be built from progressTemplate with {N,total} only (position, not time)",
  );
  // The in-place update path mutates the SAME progress text with the same
  // {N,total} substitution and introduces no duration.
  assert.match(
    js,
    /progress\.textContent = fmt\(strings\.itemRunner\.progressTemplate, \{ N, total: sessionSize \}\)/,
    "the in-place update must keep progress as position only ({N,total})",
  );
  // The progress div element markup is unchanged (role=status, position only).
  assert.match(js, /<div class="item-runner__progress"[^>]*role="status"/, "the progress element must stay role=status (announces position)");
});

test("PR-28: the itemRunner progress/heading templates carry NO time/duration token in any locale (EN/PL/RU)", () => {
  for (const lang of ["en", "pl", "ru"]) {
    const strings = readJson(...STRINGS(lang));
    const ir = strings.itemRunner;
    assert.ok(ir, `${lang} strings must carry an itemRunner block`);
    for (const key of ["progressTemplate", "headingTemplate"]) {
      const v = ir[key];
      assert.equal(typeof v, "string", `${lang} itemRunner.${key} must be a string`);
      // Position template tokens only: {N} and {total}. No {time}/{seconds}/{elapsed}.
      assert.doesNotMatch(v, /\{(time|seconds?|minutes?|elapsed|remaining|countdown)\}/i, `${lang} itemRunner.${key} must not interpolate a time token`);
      assert.doesNotMatch(v, TIMER_ELEMENT_RE, `${lang} itemRunner.${key} must carry no timer/countdown/elapsed wording`);
      assert.doesNotMatch(v, TIME_STRING_RE, `${lang} itemRunner.${key} must carry no 'X seconds left' wording`);
    }
  }
});

// ─── (1) NO-TIMER — item-runner.css carries no timer/gamification chrome ─────

test("PR-28/§3.1: item-runner.css carries NO timer/countdown/progress-bar-fill/speed-score chrome class or animation", () => {
  const css = stripComments(r(...ITEM_RUNNER_CSS));
  assert.doesNotMatch(css, TIMER_ELEMENT_RE, "item-runner.css must define no timer/countdown/elapsed/speed chrome");
  // No gamified countdown progress-FILL bar (a position label is fine; an
  // animated depleting bar reads as time pressure). No keyframes anim at all on
  // this restrained route (design §3.1/§4.2 — no gamified motion).
  assert.doesNotMatch(css, /@keyframes/, "the restrained assessment route must define no @keyframes animation (no gamified/timer motion — design §4.2)");
  assert.doesNotMatch(css, /animation:/, "item-runner.css must declare no animation (the restrained route stays static — design §3.1)");
});

// ─── (2) RESTRAINT — muted glass role on the working-area surfaces ───────────

test("PR-23/§3.1: the matrix card + option tiles + nav use the MUTED --surface-glass role (NOT --surface-glass-strong) as their working-area fill", () => {
  const css = r(...ITEM_RUNNER_CSS);
  // The matrix card and the option tiles read at a deliberately LOWER glass
  // intensity than landing/result — the muted --surface-glass fill, not the
  // strong one. We assert each working surface picks up the muted role and that
  // none of them uses --surface-glass-strong as its primary fill.
  for (const sel of [
    /\.item-runner__image\s*\{[\s\S]*?background-color:\s*var\(--surface-glass\)/,
    /\.item-runner__option\s*\{[\s\S]*?background-color:\s*var\(--surface-glass\)/,
  ]) {
    assert.match(css, sel, "the matrix card + option tiles must use the muted --surface-glass fill (lower intensity than landing/result)");
  }
  // --surface-glass-strong is permitted ONLY as the @supports-not opaque
  // fallback (AA when backdrop-filter is unavailable), never as the primary
  // working-surface fill. Assert it appears only inside an @supports block.
  const strongUses = css.match(/var\(--surface-glass-strong\)/g) || [];
  if (strongUses.length > 0) {
    // every occurrence must sit under an `@supports not (backdrop-filter…)` guard
    assert.match(
      css,
      /@supports not \(backdrop-filter[\s\S]*?var\(--surface-glass-strong\)/,
      "any --surface-glass-strong use must be the @supports-not opaque AA fallback, not the primary restrained fill",
    );
  }
});

test("PR-23/§3.1: the restrained backdrop-blur consumes the --surface-glass-blur SEMANTIC role (no stronger step; no --glass-* primitive)", () => {
  const css = r(...ITEM_RUNNER_CSS);
  assert.match(css, /backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/, "the working-area blur must use the semantic --surface-glass-blur role");
  assert.match(css, /-webkit-backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/, "the -webkit- prefix must mirror the semantic --surface-glass-blur role");
  // Two-layer rule: NEVER a --glass-* / --color-neutral-* primitive, NEVER a
  // raw blur step like --glass-blur-lg/sm; the medium step is the SEMANTIC role.
  assert.doesNotMatch(css, /backdrop-filter:\s*blur\(var\(--glass-blur-(sm|lg|md)\)\)/, "the blur must use the --surface-glass-blur semantic role, not a --glass-blur-* primitive");
});

test("PR-23/§3.1: there is an @supports not(backdrop-filter) opaque fallback so the restrained glass stays AA-legible", () => {
  const css = r(...ITEM_RUNNER_CSS);
  assert.match(css, /@supports not \(backdrop-filter:\s*blur\(1px\)\)/, "an @supports not(backdrop-filter) opaque fallback must exist for AA");
});

// ─── (2) RESTRAINT — NO decorative aurora layered behind the working area ────

test("§3.1: item-runner.css layers NO decorative aurora gradient / glow / grid behind the working area", () => {
  const css = r(...ITEM_RUNNER_CSS);
  // No backdrop aurora glow / grid roles consumed by the item-runner surfaces.
  assert.doesNotMatch(css, /var\(--backdrop-aurora-1\)|var\(--backdrop-aurora-2\)|var\(--backdrop-grid\)|var\(--aurora-glow-accent\)/, "the restrained assessment route must layer no decorative aurora glow/grid behind the working area");
  // No radial/linear decorative background-image on the item-runner surfaces.
  assert.doesNotMatch(css, /background-image:\s*radial-gradient|background-image:\s*linear-gradient/, "the assessment surfaces must carry no decorative background-image gradient");
});

// ─── (2) RESTRAINT — the test-route aurora is SUPPRESSED in base.css ─────────

test("§3.1: base.css collapses the assessment-route backdrop toward a near-flat deep field (route-scoped aurora suppression)", () => {
  const css = r(...BASE_CSS);
  // A route-scoped rule for the assessment route exists and zeroes the aurora.
  assert.match(css, /body\[data-route="#\/test"\]\s*\{[\s\S]*?background-image:\s*none/, "base.css must add a body[data-route=\"#/test\"] rule that suppresses the decorative aurora (background-image:none → near-flat deep field)");
});

test("§3.1: the global page backdrop-color contract (--color-surface-base) is UNTOUCHED on the test route (14.2 chrome-components spec)", () => {
  const css = r(...BASE_CSS);
  // The global body still paints background-color: var(--color-surface-base)…
  assert.match(css, /body\s*\{[\s\S]*?background-color:\s*var\(--color-surface-base\)/, "the global body background-color contract must stay --color-surface-base");
  // …and the route-scoped suppression must NOT re-declare background-color (it
  // only zeroes the decorative image), so the 14.2 chrome-components
  // computed-style spec keeps asserting --color-surface-base on the test route.
  const routeBlock = (css.match(/body\[data-route="#\/test"\]\s*\{[^}]*background-image:\s*none[^}]*\}/) || [""])[0];
  assert.ok(routeBlock.length > 0, "the test-route suppression block must exist");
  assert.doesNotMatch(routeBlock, /background-color:/, "the test-route suppression must NOT change background-color (the --color-surface-base contract is untouched)");
});

// ─── (2) PRESERVATION — frozen Epic 11/13 item-runner DOM contract ───────────

test("PR-23: the frozen Epic 11/13 item-runner DOM contract is preserved (restyle-only; no markup/JS DOM change)", () => {
  const js = r(...ITEM_RUNNER_JS);
  assert.match(js, /<section class="item-runner" aria-labelledby="item-runner-heading"/, "section.item-runner must be unchanged");
  assert.match(js, /id="item-runner-heading"/, "#item-runner-heading must be unchanged");
  assert.match(js, /class="item-runner__progress"/, ".item-runner__progress must be unchanged");
  assert.match(js, /class="item-runner__image"/, ".item-runner__image must be unchanged");
  assert.match(js, /<fieldset class="item-runner__options">/, "fieldset.item-runner__options must be unchanged");
  assert.match(js, /id="prev-btn"/, "#prev-btn must be unchanged");
  assert.match(js, /id="next-btn"/, "#next-btn must be unchanged");
});

// ─── (2) PRESERVATION — 14.6 option rendering must not regress ───────────────

test("PR-23: 14.6 option rendering preserved — figure clamp, aspect-ratio 1/1, :has(input:checked) selection, input:focus-visible ring, data-grid-* attributes", () => {
  const css = r(...ITEM_RUNNER_CSS);
  const js = r(...ITEM_RUNNER_JS);
  // 14.6 figure clamp sizing + aspect-ratio fidelity (matrix + figure + image).
  assert.match(css, /\.item-runner__option-figure\s*\{[\s\S]*?width:\s*clamp\(/, "the option-figure width clamp (14.6 cell-parity sizing) must remain");
  assert.match(css, /\.item-runner__option-figure\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1/, "the option figure must keep aspect-ratio 1/1 (14.6)");
  assert.match(css, /\.item-runner__option-image\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1/, "the option image must keep aspect-ratio 1/1 (14.6)");
  assert.match(css, /\.item-runner__image\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1/, "the matrix image must keep aspect-ratio 1/1 (14.6)");
  // 14.6 selected-state SHAPE marker + keyboard focus ring (token-only).
  assert.match(css, /\.item-runner__option:has\(input:checked\)\s*\{[\s\S]*?border-inline-start-width:\s*var\(--space-2\)/, "the 14.6 selected-state heavier inline-start marker (shape cue) must remain");
  assert.match(css, /\.item-runner__option input:focus-visible\s*\{[\s\S]*?outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/, "the 14.6 token-only keyboard focus ring must remain");
  // 14.6 data-grid-rows/cols attributes still emitted by the renderer.
  assert.match(js, /data-grid-cols="/, "the renderer must still expose data-grid-cols (14.6)");
  assert.match(js, /data-grid-rows="/, "the renderer must still expose data-grid-rows (14.6)");
});

// ─── (2) PRESERVATION — PR-2 sticky nav / scroll region / matrix max-height ──

test("PR-23: the PR-2 sticky nav + scrollable options + matrix max-height + option clamps remain functionally intact", () => {
  const css = r(...ITEM_RUNNER_CSS);
  // Sticky bottom nav (always reachable without page scroll).
  assert.match(css, /\.item-runner__nav\s*\{[\s\S]*?position:\s*sticky/, "the sticky .item-runner__nav (inset-block-end:0) must remain");
  assert.match(css, /inset-block-end:\s*0/, "the sticky nav must keep inset-block-end:0");
  // Scrollable options region (never clips).
  assert.match(css, /\.item-runner__options\s*\{[\s\S]*?overflow-y:\s*auto/, "the .item-runner__options scroll region (overflow-y:auto) must remain");
  // Matrix max-height sizing (42vh desktop / 30vh mobile / 32vh ≥48rem).
  assert.match(css, /\.item-runner__image\s*\{[\s\S]*?max-height:\s*42vh/, "the matrix base max-height (42vh) must remain");
  assert.match(css, /max-height:\s*30vh/, "the mobile matrix max-height (30vh) must remain");
  assert.match(css, /max-height:\s*32vh/, "the ≥48rem matrix max-height (32vh) must remain");
});

// ─── Two-layer cleanliness on item-runner.css (no primitives / hex added) ────

test("PR-23: item-runner.css consumes ONLY semantic roles — no --glass-*/--color-neutral-* primitive, no literal hex (two-layer rule)", () => {
  const css = r(...ITEM_RUNNER_CSS);
  assert.doesNotMatch(css, /var\(--glass-[a-z-]+\)|var\(--color-neutral-[0-9]+\)/, "item-runner.css must not reference a --glass-*/--color-neutral-* primitive");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "item-runner.css must not contain a literal hex colour");
});
