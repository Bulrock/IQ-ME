// Story 14-8 — Acceptance / regression guard for the Aurora RESULTS +
// SAVED-RESULTS surfaces (PR-25). AC of epics.md §"Story 14.8", design §3.x.
//
// Source-text guard (the RENDERED perceptible-glass / contrast verification —
// that the result card + saved-results rows + saved-detail read as raised glass
// over the deep-navy backdrop in light + dark — is deferred to the dormant
// Playwright leg / Story 14.11; the authoring host is darwin). Three families:
//
//   1. AURORA GLASS on the result + saved surfaces: score-panel.css composites
//      --surface-glass-strong + blur(--surface-glass-blur) + the lit edge over
//      the backdrop, with the @supports-not opaque AA fallback retained; the
//      saved-results LIST ROWS + the saved-detail score-panel sit on Aurora
//      glass consuming ONLY semantic roles (two-layer rule).
//
//   2. CO-EQUAL TRIPLET INVARIANT preserved (FR18): the three
//      .score-panel__percentile/.score-panel__anchor/.score-panel__band members
//      keep flex:1 1 0 + identical --font-size-600 typography, and the
//      .score-panel__metric-label { min-block-size: 2lh } reservation is intact.
//      (tools/lint-css-source-co-equal.mjs is the AST enforcer; this guard pins
//      the source shape so a future edit that breaks it fails here too.)
//
//   3. PRESERVATION: every interactive saved-results control keeps a
//      :focus-visible outline; the frozen Epic 11/13 DOM contracts in
//      result.js / saved-results.js are unchanged (restyle-only — no JS/markup
//      edit); the local-only render path (save-result.js localStorage, no fetch)
//      is untouched; PR-5 reveal centering + PR-13 disclaimer survive.

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

const SCORE_PANEL_CSS = ["src", "css", "components", "score-panel.css"];
const SAVED_RESULTS_CSS = ["src", "css", "components", "saved-results.css"];
const RESULT_JS = ["src", "assessment", "result.js"];
const SAVED_RESULTS_JS = ["src", "assessment", "saved-results.js"];
const SAVE_RESULT_JS = ["src", "assessment", "save-result.js"];

// CSS comment-stripper so an incidental px/hex mention inside a /* … */ note is
// not a false positive for the two-layer literal scan.
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, " ");

// ─── (1) AURORA GLASS — the result card composites perceptible glass ─────────

test("PR-25: .score-panel composites the strong glass fill + the semantic blur + lit edge over the Aurora backdrop (semantic roles only)", () => {
  const css = r(...SCORE_PANEL_CSS);
  assert.match(
    css,
    /\.score-panel\s*\{[\s\S]*?background-color:\s*var\(--surface-glass-strong\)/,
    "the result card must fill with the strong glass role (body-text surface → SC 1.4.3 4.5:1)",
  );
  assert.match(
    css,
    /\.score-panel\s*\{[\s\S]*?backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/,
    "the result card must blur via the semantic --surface-glass-blur role",
  );
  assert.match(
    css,
    /\.score-panel\s*\{[\s\S]*?-webkit-backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/,
    "the -webkit- prefix must mirror the semantic --surface-glass-blur role",
  );
  assert.match(
    css,
    /\.score-panel\s*\{[\s\S]*?border:\s*var\(--border-width-hairline\) solid var\(--surface-glass-edge\)/,
    "the result card edge must use the --surface-glass-edge role hairline",
  );
  // Lit-edge inset highlight consistent with the .aurora-surface primitive so
  // the result card reads as "lit from within" against the deep-navy backdrop.
  assert.match(
    css,
    /\.score-panel\s*\{[\s\S]*?box-shadow:[\s\S]*?var\(--surface-glass-shadow\)[\s\S]*?inset 0 1px 0 var\(--surface-glass-edge\)/,
    "the result card must add the inset lit-edge highlight (consistent with .aurora-surface)",
  );
});

test("PR-25: the @supports not(backdrop-filter) opaque fallback on .score-panel is RETAINED (SC 1.4.3 4.5:1)", () => {
  const css = r(...SCORE_PANEL_CSS);
  assert.match(
    css,
    /@supports not \(backdrop-filter:\s*blur\(1px\)\)\s*\{[\s\S]*?\.score-panel\s*\{[\s\S]*?background-color:\s*var\(--surface-glass-strong\)/,
    "the @supports-not opaque AA fallback must drop the result card to the strong glass role",
  );
});

// ─── (1) AURORA GLASS — the saved-results LIST ROWS sit on Aurora glass ──────

test("PR-25: the saved-results list rows (.saved-results__item) sit on the Aurora --surface-glass fill + semantic blur + edge (not the old opaque elevation)", () => {
  const css = r(...SAVED_RESULTS_CSS);
  assert.match(
    css,
    /\.saved-results__item\s*\{[\s\S]*?background-color:\s*var\(--surface-glass\)/,
    "the saved-result list rows must fill with the Aurora --surface-glass role (glass-on-navy, not --color-surface-elevated)",
  );
  assert.match(
    css,
    /\.saved-results__item\s*\{[\s\S]*?backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/,
    "the list rows must blur via the semantic --surface-glass-blur role",
  );
  assert.match(
    css,
    /\.saved-results__item\s*\{[\s\S]*?border:\s*var\(--border-width-hairline\) solid var\(--surface-glass-edge\)/,
    "the list rows must use the --surface-glass-edge role hairline",
  );
});

test("PR-25: the unfinished-test (resume) rows (.saved-results__ip-item) also sit on the Aurora glass surface", () => {
  const css = r(...SAVED_RESULTS_CSS);
  assert.match(
    css,
    /\.saved-results__ip-item\s*\{[\s\S]*?background-color:\s*var\(--surface-glass\)/,
    "the in-progress rows must also fill with the Aurora --surface-glass role",
  );
  assert.match(
    css,
    /\.saved-results__ip-item\s*\{[\s\S]*?backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/,
    "the in-progress rows must blur via the semantic --surface-glass-blur role",
  );
});

test("PR-25: saved-results.css keeps an @supports not(backdrop-filter) opaque AA fallback for the glass list rows", () => {
  const css = r(...SAVED_RESULTS_CSS);
  assert.match(
    css,
    /@supports not \(backdrop-filter:\s*blur\(1px\)\)/,
    "an @supports-not opaque AA fallback must exist for the saved-results glass rows",
  );
  // The fallback drops the glass rows to the strong opaque role so they stay
  // AA-legible where the browser can't composite the blur.
  assert.match(
    css,
    /@supports not \(backdrop-filter:\s*blur\(1px\)\)\s*\{[\s\S]*?var\(--surface-glass-strong\)/,
    "the saved-results @supports-not fallback must use the --surface-glass-strong opaque role",
  );
});

test("PR-25: the saved-result detail reuses the SAME .score-panel Aurora glass as the live result, centered (margin-inline:auto)", () => {
  const css = r(...SAVED_RESULTS_CSS);
  // The detail view does not re-declare the score-panel glass — it inherits the
  // single .score-panel rule from score-panel.css, and only centers it.
  assert.match(
    css,
    /\.saved-result-detail \.score-panel\s*\{[\s\S]*?margin-inline:\s*auto/,
    "the saved-result detail score-panel must stay centered (margin-inline:auto) — reusing the live result glass",
  );
  // It must NOT bespoke-restyle the score-panel fill (that would diverge the two
  // result surfaces); the live .score-panel rule is the single source.
  assert.doesNotMatch(
    css,
    /\.saved-result-detail \.score-panel\s*\{[^}]*background-color:/,
    "the saved-result detail must not redefine the score-panel fill — it reuses the live Aurora glass",
  );
});

// ─── (2) CO-EQUAL TRIPLET INVARIANT preserved (FR18) ─────────────────────────

test("FR18: the co-equal triplet keeps flex:1 1 0 + identical --font-size-600 typography (percentile/anchor/band)", () => {
  const css = r(...SCORE_PANEL_CSS);
  // The three members share one rule with flex:1 1 0 and equal font axes.
  assert.match(
    css,
    /\.score-panel__anchor,\s*\.score-panel__percentile,\s*\.score-panel__band\s*\{[\s\S]*?flex:\s*1 1 0[\s\S]*?font-size:\s*var\(--font-size-600\)[\s\S]*?font-weight:\s*var\(--font-weight-regular\)[\s\S]*?font-family:\s*var\(--font-family-sans\)/,
    "the triplet members must keep flex:1 1 0 + identical font-size/weight/family (co-equal bbox parity)",
  );
});

test("FR18: the .score-panel__metric-label { min-block-size: 2lh } reservation is untouched", () => {
  const css = r(...SCORE_PANEL_CSS);
  assert.match(
    css,
    /\.score-panel__metric-label\s*\{[\s\S]*?min-block-size:\s*2lh/,
    "the metric-label 2lh reservation (keeps narrow-width triplet cells co-equal) must remain",
  );
});

// ─── (2) PR-5 reveal centering + PR-13 disclaimer survive ────────────────────

test("PR-5: the revealed result-scene stages still justify-content:center the column (no top-hug)", () => {
  const css = r(...SCORE_PANEL_CSS);
  assert.match(
    css,
    /\.result-scene\[data-reveal-stage="band"\][\s\S]*?\.result-scene\[data-reveal-stage="methodology-handoff"\]\s*\{[\s\S]*?justify-content:\s*center/,
    "the PR-5 reveal-stage rules must keep justify-content:center (vertically centered, no top-hug)",
  );
});

test("PR-13: the disclaimer stays a collapsed <details> with a :focus-visible outlined summary", () => {
  const css = r(...SCORE_PANEL_CSS);
  assert.match(
    css,
    /\.disclaimer__summary:focus-visible\s*\{[\s\S]*?outline:\s*var\(--border-width-hairline\) solid var\(--color-focus-ring\)/,
    "the disclaimer summary must keep its token-only :focus-visible outline (PR-13)",
  );
  const js = r(...RESULT_JS);
  assert.match(
    js,
    /<details class="disclaimer score-panel__explainer">/,
    "the disclaimer must stay a native collapsed <details> (PR-13, restyle-only)",
  );
});

// ─── (3) PRESERVATION — every saved-results control keeps :focus-visible ─────

test("PR-25: every interactive saved-results control retains a :focus-visible outline", () => {
  const css = r(...SAVED_RESULTS_CSS);
  // Actions (back/delete-selected/delete-all), open, back-from-detail.
  assert.match(
    css,
    /\.saved-results__actions button:focus-visible,\s*\.saved-results__open:focus-visible,\s*\.saved-results__back:focus-visible\s*\{[\s\S]*?outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/,
    "the actions/open/back controls must keep a token-only :focus-visible outline",
  );
  // Resume + delete-in-progress controls.
  assert.match(
    css,
    /\.saved-results__resume:focus-visible,\s*\.saved-results__delete-ip:focus-visible\s*\{[\s\S]*?outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/,
    "the resume/delete-in-progress controls must keep a token-only :focus-visible outline",
  );
});

// ─── (3) PRESERVATION — frozen Epic 11/13 DOM contracts (restyle-only) ───────

test("PR-25: the frozen Epic 11/13 saved-results DOM contract is unchanged (restyle-only; no JS/markup edit)", () => {
  const js = r(...SAVED_RESULTS_JS);
  assert.match(js, /<section class="saved-results" aria-labelledby="saved-results-heading">/, "section.saved-results must be unchanged");
  assert.match(js, /id="saved-results-heading"/, "#saved-results-heading must be unchanged");
  assert.match(js, /class="saved-results__item"/, ".saved-results__item must be unchanged");
  assert.match(js, /class="saved-results__open"/, ".saved-results__open must be unchanged");
  assert.match(js, /data-delete-selected/, "the delete-selected hook must be unchanged");
  assert.match(js, /data-delete-all/, "the delete-all hook must be unchanged");
  // The saved-result detail reuses .score-panel + .score-panel__triplet under
  // data-reveal-stage="methodology-handoff" / data-saved-result-view.
  assert.match(
    js,
    /<section class="result-scene saved-result-detail" data-reveal-stage="methodology-handoff" data-saved-result-view/,
    "the saved-result detail must keep its result-scene/methodology-handoff/data-saved-result-view contract",
  );
  assert.match(js, /<section class="score-panel">/, "the saved detail must reuse the .score-panel container");
  assert.match(js, /<div class="score-panel__triplet">/, "the saved detail must reuse the .score-panel__triplet markup");
});

test("PR-25: the frozen Epic 11/13 result-scene DOM contract is unchanged (restyle-only)", () => {
  const js = r(...RESULT_JS);
  assert.match(js, /id="score-panel-heading"/, "#score-panel-heading must be unchanged");
  assert.match(js, /class="score-panel__triplet"/, ".score-panel__triplet markup must be unchanged");
});

// ─── (3) PRESERVATION — local-only render path (NFR6) untouched ──────────────

test("NFR6: the saved-result read/list path stays client-only (localStorage, no fetch) — restyle adds no storage/fetch behavior", () => {
  const save = r(...SAVE_RESULT_JS);
  // The persistence read is key-scoped window.localStorage — never network.
  assert.match(save, /window\.localStorage\.getItem\(keyFor\(seed\)\)/, "isSaved() must read key-scoped window.localStorage");
  assert.match(save, /window\.localStorage\.setItem\(keyFor\(seed\)/, "saveResult() must write key-scoped window.localStorage");
  // No network primitive anywhere in the save/list path (NFR6 no-telemetry).
  for (const src of [save, r(...SAVED_RESULTS_JS)]) {
    assert.doesNotMatch(src, /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/, "the saved-results path must make no network request (NFR6 local-only)");
  }
});

// ─── (3) TWO-LAYER cleanliness on both restyled CSS files ────────────────────

test("PR-25: score-panel.css + saved-results.css consume ONLY semantic roles — no --glass-*/--color-neutral-* primitive, no literal hex (two-layer rule)", () => {
  for (const f of [SCORE_PANEL_CSS, SAVED_RESULTS_CSS]) {
    const css = stripCssComments(r(...f));
    assert.doesNotMatch(css, /var\(--glass-[a-z-]+\)|var\(--color-neutral-[0-9]+\)/, `${f.at(-1)} must not reference a --glass-*/--color-neutral-* primitive`);
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, `${f.at(-1)} must not contain a literal hex colour`);
  }
});
