// Story 14-9 — Acceptance / regression guard for the INK-ECONOMICAL Aurora
// print/PDF result document (PR-26). AC of epics.md §"Story 14.9", design §3.3.
//
// Source-text guard over src/css/print.css (the RENDERED print/PDF leg — that
// the document actually prints high-contrast ink on white with NO glass — is
// deferred to the dormant Playwright print leg / Story 14.11; the authoring host
// is darwin). The print path was LARGELY correct since Epic 13; this story (a)
// records the documented design decision (scientific-neutral, ink-economical,
// no Aurora token bleed) as a comment block at the head of the @media print
// section, and (b) adds the defensive Aurora-neutralization override
// (background-image: none on the printed surfaces) so the deep-navy spatial
// backdrop cannot survive into print even if the white-bg shorthand reset is
// later refactored to a longhand. The glass blur is NOT re-declared: the frozen
// Story 13-5 PR-17 invariant keeps the print block free of any backdrop-filter
// artifact (the forced-white surface makes the screen blur a visual no-op).
// Four families:
//
//   1. NO AURORA BLEED: the printed @media print surfaces carry NO surviving
//      backdrop-filter artifact / --surface-glass* translucency / --backdrop-*
//      deep-navy role; print forces color-scheme:light + #ffffff bg + #111111
//      ink + an explicit background-image:none; interactive chrome is
//      display:none; the print-only masthead/footer are shown.
//
//   2. HONEST-FRAMING INVARIANT: the full not-a-certificate /
//      not-a-clinical-assessment disclaimer is force-open in print (.disclaimer
//      + .disclaimer__summary shown, marker hidden) and
//      .score-panel__difficulty-sentence is forced display:block — no ink-saving
//      ever suppresses the caveat.
//
//   3. CO-EQUAL TRIPLET: .score-panel__percentile/.score-panel__anchor/
//      .score-panel__band print at uniform #111111 weight; 42rem reading
//      measure; break-inside:avoid on triplet/disclaimer/footer.
//
//   4. THE DOCUMENTED DECISION comment block exists at the head of the
//      @media print section, stating + justifying the chosen direction
//      (ink economy + grayscale-printer fidelity, no Aurora token bleed).

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

const PRINT_CSS = ["src", "css", "print.css"];
const RESULT_JS = ["src", "assessment", "result.js"];

// Comment-stripper so the documented-decision prose (which names the very
// tokens it forbids) is not a false positive for the "no glass token survives"
// declaration scans. Family (4) deliberately scans the WITH-comments source.
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, " ");

// The @media print block body (comments stripped) — every declaration the
// printed document actually applies.
const printBlock = (css) => {
  const stripped = stripCssComments(css);
  const i = stripped.indexOf("@media print");
  assert.ok(i >= 0, "print.css must contain an @media print block");
  return stripped.slice(i);
};

// ─── (1) NO AURORA BLEED — print is white-on-dark-ink, never glass ───────────

test("PR-26: @media print forces color-scheme:light + #ffffff background + #111111 ink (theme-independent document)", () => {
  const css = printBlock(r(...PRINT_CSS));
  assert.match(css, /:root\s*\{\s*color-scheme:\s*light\s*;?\s*\}/, "print must force color-scheme:light regardless of the chosen theme");
  assert.match(css, /html,\s*body\s*\{[\s\S]*?background:\s*#ffffff\s*!important/, "print must paint html/body white");
  assert.match(css, /html,\s*body\s*\{[\s\S]*?color:\s*#111111\s*!important/, "print must set the body ink to #111111");
});

test("PR-26: the printed .result-scene/.score-panel surfaces carry NO surviving Aurora glass — explicit background-image:none + white fill, box-shadow:none, border:none, 42rem measure", () => {
  const css = printBlock(r(...PRINT_CSS));
  // The printed document column rule must reset every glass/backdrop property.
  const surfaceRule = css.match(/\.result-scene,\s*\.score-panel\s*\{[\s\S]*?\}/);
  assert.ok(surfaceRule, ".result-scene/.score-panel print rule must exist");
  const rule = surfaceRule[0];
  assert.match(rule, /background:\s*#ffffff\s*!important/, "printed surfaces fill white (drops the --surface-glass* translucency)");
  assert.match(rule, /box-shadow:\s*none\s*!important/, "printed surfaces drop the glass shadow + inset lit-edge");
  assert.match(rule, /border:\s*none\s*!important/, "printed surfaces drop the lit hairline edge");
  assert.match(rule, /max-width:\s*42rem\s*!important/, "printed surfaces keep the 42rem reading measure (RU/PL-safe wrap)");
  // Defensive Aurora-neutralization (this story): the deep-navy aurora
  // background-image must be explicitly dropped so the spatial backdrop cannot
  // bleed into print even if the white-bg `background:` shorthand is later
  // refactored to a longhand. (The glass blur is NOT re-declared — the Story
  // 13-5 PR-17 invariant keeps the print block free of any backdrop-filter
  // artifact; on the forced-white surface the blur composites over white, a
  // visual no-op — see the no-backdrop-filter assertion below.)
  assert.match(rule, /background-image:\s*none\s*!important/, "the deep-navy aurora background-image must be explicitly dropped in print");
});

test("PR-26: no glass/backdrop role token + no backdrop-filter artifact survives into the printed @media print block (Story 13-5 PR-17 invariant)", () => {
  const css = printBlock(r(...PRINT_CSS));
  assert.doesNotMatch(css, /var\(--surface-glass[a-z-]*\)/, "no --surface-glass* translucency role may apply in print");
  assert.doesNotMatch(css, /var\(--backdrop-[a-z0-9-]+\)/, "no --backdrop-* deep-navy role may apply in print");
  // The print block stays entirely free of any backdrop-filter artifact (the
  // forced-white surface makes the screen glass blur moot) — this aligns with,
  // and reinforces, the frozen Story 13-5 guard (13-5-print-result.test.mjs).
  assert.doesNotMatch(css, /backdrop-filter/i, "no backdrop-filter artifact (incl. :none) may appear in the print block — the white surface makes glass moot (Story 13-5 PR-17 invariant)");
});

test("PR-26: interactive chrome is display:none in print; the print-only masthead + footer are shown", () => {
  const css = printBlock(r(...PRINT_CSS));
  // Chrome / buttons / reveal-stage controls / tail scene all suppressed.
  const hideRule = css.match(/\.chrome-header,[\s\S]*?display:\s*none\s*!important/);
  assert.ok(hideRule, "the chrome/buttons/reveal/tail hide rule must exist");
  for (const sel of [".chrome-header", ".chrome-footer", ".result-print-btn", ".score-panel__save-button", ".score-panel__retest-note", ".rs-show", ".rs-not", ".tail-scene"]) {
    assert.ok(css.includes(sel), `${sel} must be present in the print-hide rule`);
  }
  // The print-only masthead + footer (display:none on screen) become visible.
  assert.match(css, /\.result-print-only\s*\{[\s\S]*?display:\s*block\s*!important/, "the print masthead must be shown in print");
  assert.match(css, /\.result-print-footer\s*\{[\s\S]*?display:\s*block\s*!important/, "the print footer must be shown in print");
});

// ─── (2) HONEST-FRAMING INVARIANT — caveat never suppressed ──────────────────

test("PR-26: the disclaimer is forced fully open in print (details + summary shown, marker hidden) — the not-a-certificate caveat always prints", () => {
  const css = printBlock(r(...PRINT_CSS));
  assert.match(css, /\.disclaimer,\s*\.score-panel__explainer\s*\{[\s\S]*?display:\s*block\s*!important/, "the collapsed <details> disclaimer must be forced display:block in print");
  assert.match(css, /\.disclaimer__summary\s*\{[\s\S]*?display:\s*block\s*!important/, "the disclaimer summary must be shown in print");
  assert.match(css, /::marker[\s\S]*?display:\s*none|::-webkit-details-marker\s*\{[\s\S]*?display:\s*none/, "the <details> marker must be hidden in print");
});

test("PR-26: the reveal-gated difficulty sentence is forced display:block in print (no reveal-gating suppresses the caveat)", () => {
  const css = printBlock(r(...PRINT_CSS));
  assert.match(css, /\.score-panel__difficulty-sentence\s*\{[\s\S]*?display:\s*block\s*!important/, ".score-panel__difficulty-sentence must print display:block");
});

// ─── (3) CO-EQUAL TRIPLET — uniform #111111, preserved layout, no orphans ────

test("PR-26: the co-equal triplet prints at uniform #111111 weight (percentile/anchor/band), flex layout preserved", () => {
  const css = printBlock(r(...PRINT_CSS));
  // The three members share one print rule forcing the uniform dark ink.
  assert.match(
    css,
    /\.score-panel__anchor,\s*\.score-panel__percentile,\s*\.score-panel__band\s*\{[\s\S]*?color:\s*#111111\s*!important/,
    "the triplet members must print at uniform #111111 (co-equal, no member emphasized over another)",
  );
  // The triplet flex layout is preserved (gap/margin tuned, never collapsed).
  assert.match(css, /\.score-panel__triplet\s*\{/, "the triplet print rule must exist (layout preserved, not removed)");
});

test("PR-26: break-inside:avoid keeps the triplet/disclaimer/footer from orphaning across page breaks", () => {
  const css = printBlock(r(...PRINT_CSS));
  assert.match(
    css,
    /\.score-panel__triplet,\s*\.disclaimer,\s*\.result-print-footer\s*\{[\s\S]*?break-inside:\s*avoid/,
    "the triplet/disclaimer/footer must keep break-inside:avoid",
  );
});

// ─── (4) THE DOCUMENTED DESIGN DECISION — recorded as a comment block ────────

test("PR-26: a documented design-decision comment block at the head of the @media print section states + justifies the scientific-neutral, ink-economical, no-Aurora-bleed direction", () => {
  const css = r(...PRINT_CSS); // WITH comments — this scans the decision prose.
  // The decision block must reference Story 14-9 / PR-26 and the chosen direction.
  assert.match(css, /Story 14-9|PR-26/, "the decision block must cite the Story 14-9 / PR-26 origin");
  assert.match(css, /scientific-neutral/i, "the decision must name the chosen direction: scientific-neutral");
  assert.match(css, /ink[ -]econom/i, "the decision must justify by ink economy");
  assert.match(css, /grayscale|greyscale/i, "the decision must justify by grayscale-printer fidelity");
  // It must state NO Aurora color token bleeds into print.
  assert.match(css, /no Aurora[\s\S]{0,80}(token|color|colour)[\s\S]{0,40}(bleed|print)|Aurora[\s\S]{0,40}(does not|never)[\s\S]{0,40}(bleed|print)/i, "the decision must state no Aurora color token bleeds into print");
  // The decision block sits at the head of the @media print section: the
  // Story-14-9 marker must appear AFTER the screen rules and BEFORE the first
  // print declaration (the color-scheme:light reset).
  const stripped = css;
  const decisionAt = stripped.search(/Story 14-9|PR-26/);
  const printAt = stripped.indexOf("@media print");
  const colorSchemeAt = stripped.indexOf("color-scheme: light");
  assert.ok(decisionAt >= 0 && printAt >= 0, "both the decision marker and @media print must exist");
  assert.ok(decisionAt < colorSchemeAt, "the decision comment block must sit at the head of the print section, before the color-scheme:light reset");
});

test("PR-26: the printed document uses only the dark-ink ramp (#111111/#333333/#555555/#777777) + #cccccc hairline — no Aurora color hex bleeds in", () => {
  const css = printBlock(r(...PRINT_CSS));
  // Collect every hex literal that survives into the printed block.
  const hexes = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).map((h) => h.toLowerCase());
  const allowed = new Set(["#ffffff", "#111111", "#333333", "#555555", "#777777", "#cccccc"]);
  for (const h of hexes) {
    assert.ok(allowed.has(h), `printed document may only use the neutral ink/hairline ramp; found disallowed hex ${h}`);
  }
});

// ─── PRESERVATION — frozen Epic 11/13 print-only DOM contract (restyle-only) ─

test("PR-26: result.js print-only markup (masthead/footer/disclaimer) is unchanged — restyle-only, no JS/markup edit", () => {
  const js = r(...RESULT_JS);
  assert.match(js, /class="result-print-only"/, "the print-only masthead markup must be unchanged");
  assert.match(js, /class="result-print-footer" aria-hidden="true">IQ-ME · \/methodology\//, "the locale-agnostic print footer identity line must be unchanged");
  assert.match(js, /<details class="disclaimer score-panel__explainer">/, "the disclaimer must stay a native collapsed <details> (restyle-only)");
  assert.match(js, /class="score-panel__triplet"/, "the co-equal triplet markup must be unchanged");
});
