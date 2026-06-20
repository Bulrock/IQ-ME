// Story 14-5 — Acceptance guard for the Aurora consent envelope, the
// supporting-information surfaces and the shared chrome (header, footer, theme
// toggle, language flag dropdown, dialog/overlay surfaces). AC 1–7 of
// epics.md §"Story 14.5" (PR-22, PR-27).
//
// Structural source-text checks only (no CSS parser; NFR33). The RENDERED
// visual-regression baselines (consent + chrome, Light + Dark) are committed
// centrally by Story 14.11 on ubuntu-latest — this story ships the source-text
// acceptance guard. Two checks per surface (Light + Dark resolve through the
// same semantic roles authored in semantic.css §14.2, so the role-consuming
// component CSS is theme-correct for free).
//
// Authored in test-author phase (frozen during specialist impl). The consent
// envelope assertions are RED until the specialist migrates
// .consent-scene__envelope off the flat --color-surface-elevated/--color-rule-strong
// onto the re-valued Aurora glass roles.

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

// Two-layer rule (UX-DR1): component CSS consumes ONLY semantic roles — never a
// --glass-* / --color-neutral-* primitive, never a literal hex/rgba glass value.
const FORBIDDEN_PRIMITIVE_RE = /var\(--glass-[a-z-]+\)|var\(--color-neutral-[0-9]+\)/;

// ─── Consent envelope (PR-22) ──────────────────────────────────────────────

test("AC1: consent envelope reads as a raised Aurora glass panel via semantic roles only (Light + Dark)", () => {
  const css = r("src", "css", "components", "consent-scene.css");
  // The validity envelope was a flat opaque --color-surface-elevated panel with a
  // --color-rule-strong start-border (PR-22). 14.2 re-valued the glass roles, so
  // consuming --surface-glass* makes it read as a raised panel against the deep
  // navy backdrop — in BOTH themes, because both resolve through the same roles.
  assert.match(css, /\.consent-scene__envelope\s*\{[\s\S]*?background-color:\s*var\(--surface-glass-strong\)/, "the consent envelope must consume the --surface-glass-strong role (strong fill — it carries long-form body text → AA SC 1.4.3)");
  assert.match(css, /\.consent-scene__envelope\s*\{[\s\S]*?backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/, "the consent envelope must blur via the --surface-glass-blur role");
  assert.match(css, /\.consent-scene__envelope\s*\{[\s\S]*?-webkit-backdrop-filter:\s*blur\(var\(--surface-glass-blur\)\)/, "the consent envelope must keep the -webkit- prefixed blur");
  assert.match(css, /\.consent-scene__envelope\s*\{[\s\S]*?var\(--surface-glass-edge\)/, "the consent envelope must define its panel boundary with the --surface-glass-edge lit-rim role");
});

test("AC1: consent envelope floats with the semantic shadow + lit-from-within inset edge (token-only, no literal px)", () => {
  const css = r("src", "css", "components", "consent-scene.css");
  assert.match(css, /box-shadow:[\s\S]*var\(--surface-glass-shadow\)/, "the consent envelope must float via the --surface-glass-shadow role");
  assert.match(css, /inset 0 var\(--border-width-hairline\) 0 var\(--surface-glass-edge\)/, "the consent envelope must add the lit-from-within inset edge via the hairline token (no literal px)");
});

test("AC1/AC7: consent envelope keeps an opaque @supports fallback so it stays AA-legible without backdrop-filter", () => {
  const css = r("src", "css", "components", "consent-scene.css");
  assert.match(css, /@supports not \(backdrop-filter:\s*blur\(1px\)\)/, "consent-scene.css must add the @supports not(backdrop-filter) solid fallback dropping the envelope to the opaque strong fill");
});

test("AC1: FR12 dwell-gate disabled register + app-shell scroll topology preserved (consent)", () => {
  const css = r("src", "css", "components", "consent-scene.css");
  // The disabled Continue stays the muted register — timer-driven, independent of scroll.
  assert.match(css, /\.consent-scene__continue-btn\[aria-disabled="true"\]\s*\{[\s\S]*?color:\s*var\(--color-text-link-disabled\)/, "the [aria-disabled] Continue button must keep its muted disabled register (FR12 dwell-gate)");
  assert.match(css, /\.consent-scene__continue-btn\[aria-disabled="true"\]\s*\{[\s\S]*?cursor:\s*not-allowed/, "the disabled Continue must keep cursor:not-allowed");
  // App-shell scroll topology: fixed header/cta/footer; only the envelope scrolls.
  assert.match(css, /body\[data-route="#\/consent"\][\s\S]*?overflow:\s*hidden/, "the consent app-shell must keep the page pinned (overflow hidden)");
  assert.match(css, /body\[data-route="#\/consent"\] \.consent-scene__envelope\s*\{[\s\S]*?overflow-y:\s*auto/, "the consent envelope must remain the only scroll region (overflow-y:auto)");
});

test("AC2: dwell-hint stays viewport-safe + collapses when hidden; muted controls keep a visible focus ring", () => {
  const css = r("src", "css", "components", "consent-scene.css");
  assert.match(css, /\.consent-scene__dwell-hint\s*\{[\s\S]*?max-width:\s*100%/, "the dwell-hint must keep max-width:100% (longest PL string must not force horizontal page scroll)");
  assert.match(css, /\.consent-scene__dwell-hint\s*\{[\s\S]*?overflow-wrap:\s*break-word/, "the dwell-hint must keep overflow-wrap:break-word");
  assert.match(css, /\.consent-scene__dwell-hint\[hidden\]\s*\{\s*display:\s*none/, "the dwell-hint must collapse to display:none when [hidden]");
  // The muted #not-today-link + the :focus-visible outline rings on both controls.
  assert.match(css, /#not-today-link\s*\{[\s\S]*?color:\s*var\(--color-text-muted\)/, "#not-today-link must stay the muted register");
  const focusRings = (css.match(/outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/g) || []).length;
  assert.ok(focusRings >= 2, `the consent controls must keep AA-clearing :focus-visible rings (Continue + #not-today-link; found ${focusRings})`);
});

test("AC2: consent-scene.css introduces NO --glass-*/--color-neutral-* primitive and NO literal hex/rgba glass value (two-layer rule)", () => {
  const css = r("src", "css", "components", "consent-scene.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "consent-scene.css must not reference a --glass-*/--color-neutral-* primitive (consume semantic roles)");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "consent-scene.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /\brgba?\(/, "consent-scene.css must not contain a literal rgb/rgba glass value");
});

// ─── Shared chrome — header (PR-27) ─────────────────────────────────────────

test("AC3: chrome header is a transparent overlay with stacking + route gates preserved", () => {
  const css = r("src", "css", "components", "chrome-header.css");
  assert.match(css, /\.chrome-header\s*\{[\s\S]*?background-color:\s*transparent/, "the chrome header must expose the Observatory scene");
  assert.match(css, /\.chrome-header\s*\{[\s\S]*?border:\s*none/, "the chrome header must carry no enclosing boundary");
  assert.match(css, /\.chrome-header\s*\{[\s\S]*?box-shadow:\s*none/, "the chrome header must carry no surface shadow");
  // The stacking context that keeps the language menu above scene content.
  assert.match(css, /\.chrome-header\s*\{[\s\S]*?position:\s*relative/, "the chrome header must keep position:relative");
  assert.match(css, /\.chrome-header\s*\{[\s\S]*?z-index:\s*30/, "the chrome header must keep z-index:30 (language menu stays pointer-receptive above the scene)");
});

test("AC3: chrome route gates match the selected Observatory layout (test identity visible + pre-test language-switcher reveal)", () => {
  const css = r("src", "css", "components", "chrome-header.css");
  assert.match(css, /body\[data-route="#\/test"\] \.chrome-header\s*\{\s*display:\s*flex/, "the assessment route must keep the compact IQ-ME identity bar visible like the selected Observatory layout");
  assert.match(css, /body\[data-route="#\/test"\] \.chrome-header__controls[\s\S]*?display:\s*none/, "assessment chrome must hide non-essential controls");
  assert.match(css, /body\[data-route="#\/"\] \.chrome-header__language-switcher/, "the language switcher must reveal on the landing route");
  assert.match(css, /body\[data-route="#\/selection"\] \.chrome-header__language-switcher/, "the language switcher must remain available during pre-test selection");
  assert.match(css, /body\[data-route="#\/consent"\] \.chrome-header__language-switcher/, "the language switcher must remain available during consent");
  assert.match(css, /body\[data-route="#\/consent"\] \.chrome-header__language-switcher\s*\{\s*display:\s*revert/, "all pre-test language-switcher route selectors must resolve to display:revert");
});

test("AC2/AC3: chrome-header.css introduces NO --glass-*/--color-neutral-* primitive and NO literal hex/rgba glass value", () => {
  const css = r("src", "css", "components", "chrome-header.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "chrome-header.css must not reference a --glass-*/--color-neutral-* primitive");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "chrome-header.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /\brgba?\(/, "chrome-header.css must not contain a literal rgb/rgba glass value");
});

// ─── Shared chrome — footer (PR-27, UX-DR3) ─────────────────────────────────

test("AC6: chrome footer is a transparent overlay matching the header", () => {
  const css = r("src", "css", "components", "chrome-footer.css");
  assert.match(css, /\.chrome-footer\s*\{[\s\S]*?background-color:\s*transparent/, "the chrome footer must expose the Observatory scene");
  assert.match(css, /\.chrome-footer\s*\{[\s\S]*?border:\s*none/, "the chrome footer must carry no enclosing boundary");
  assert.match(css, /\.chrome-footer\s*\{[\s\S]*?box-shadow:\s*none/, "the chrome footer must carry no surface shadow");
});

test("AC6: footer supporting links keep a readable neutral weight + reveal-on-hover/focus + visible focus ring (UX-DR3)", () => {
  const css = r("src", "css", "components", "chrome-footer.css");
  // Neutral chrome-level weight with readable contrast over either landscape.
  assert.match(css, /\.chrome-footer__methodology-link[\s\S]*?color:\s*var\(--color-text-body\)/, "the footer links must remain readable over the light and dark landscapes");
  // Hover/focus reveals link-color + underline.
  assert.match(css, /:focus-visible[\s\S]*?\{[\s\S]*?color:\s*var\(--color-text-link\)[\s\S]*?text-decoration:\s*underline/, "the footer links must reveal link-color + underline on hover/focus");
  // Visible focus ring.
  assert.match(css, /:focus-visible\s*\{[\s\S]*?outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/, "the footer links must keep an AA-clearing visible focus ring");
  assert.match(css, /body\[data-route="#\/test"\] \.chrome-footer\s*\{\s*display:\s*none/, "UX-DR8: the chrome footer must hide on the assessment route");
});

test("AC6: chrome-footer.css introduces NO --glass-*/--color-neutral-* primitive and NO literal hex/rgba glass value", () => {
  const css = r("src", "css", "components", "chrome-footer.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "chrome-footer.css must not reference a --glass-*/--color-neutral-* primitive");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "chrome-footer.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /\brgba?\(/, "chrome-footer.css must not contain a literal rgb/rgba glass value");
});

// ─── Theme toggle (PR-6 / PR-27) ────────────────────────────────────────────

test("AC4: theme toggle keeps the restraint-first register — active segment = quiet --color-surface-elevated fill driven by aria-pressed", () => {
  const css = r("src", "css", "components", "theme-toggle.css");
  // Active segment marked SOLELY by aria-pressed="true" — a subtle elevated fill, no loud accent.
  assert.match(css, /\.theme-switcher__segment\[aria-pressed="true"\]\s*\{[\s\S]*?background-color:\s*var\(--color-surface-elevated\)/, "the active segment must be a quiet --color-surface-elevated fill (restraint-first, no accent), driven by aria-pressed='true' (PR-6)");
  // Visible focus ring against the re-valued chrome.
  assert.match(css, /\.theme-switcher__segment:focus-visible\s*\{[\s\S]*?outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/, "the theme-switcher segment must keep its visible :focus-visible ring");
});

test("AC4: theme-toggle.css consumes only semantic tokens — NO --glass-*/--color-neutral-* primitive, NO literal hex/rgba", () => {
  const css = r("src", "css", "components", "theme-toggle.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "theme-toggle.css must not reference a --glass-*/--color-neutral-* primitive (NFR6/NFR7 token-only)");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "theme-toggle.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /\brgba?\(/, "theme-toggle.css must not contain a literal rgb/rgba value");
});

// ─── Language flag dropdown (PR-7 / FR8 / PR-27) ────────────────────────────

test("AC5: language menu stays an OPAQUE elevated fill so listbox text is AA-legible regardless of backdrop (NOT translucent glass)", () => {
  const css = r("src", "css", "components", "language-switcher.css");
  // The menu MUST stay opaque elevated + overlay shadow — not translucent glass —
  // so listbox text clears AA against any backdrop (PR-7).
  assert.match(css, /\.language-switcher__menu\s*\{[\s\S]*?background-color:\s*var\(--color-surface-elevated\)/, "the language menu must keep the OPAQUE --color-surface-elevated fill (listbox text must be AA-legible regardless of backdrop)");
  assert.match(css, /\.language-switcher__menu\s*\{[\s\S]*?box-shadow:\s*var\(--shadow-overlay\)/, "the language menu must keep --shadow-overlay (it is an overlay, not a glass panel)");
  // The menu must NOT be migrated to translucent glass (no backdrop-filter on the menu).
  assert.doesNotMatch(css, /\.language-switcher__menu\s*\{[\s\S]*?backdrop-filter/, "the language menu must NOT become translucent glass (it would break listbox AA legibility)");
  // Closed menu collapses.
  assert.match(css, /\.language-switcher__menu\[hidden\]\s*\{\s*display:\s*none/, "the closed language menu must collapse to display:none");
});

test("AC5: FR8 locale-lock disabled trigger register + aria-selected active-option marking preserved", () => {
  const css = r("src", "css", "components", "language-switcher.css");
  // FR8 blocker hint hangs off [aria-disabled="true"] — the disabled trigger register.
  assert.match(css, /\.language-switcher__trigger\[aria-disabled="true"\]\s*\{[\s\S]*?color:\s*var\(--color-text-link-disabled\)/, "the [aria-disabled] trigger must keep its disabled register (FR8 locale-lock blocker hangs off this)");
  assert.match(css, /\.language-switcher__trigger\[aria-disabled="true"\]\s*\{[\s\S]*?cursor:\s*not-allowed/, "the disabled trigger must keep cursor:not-allowed");
  // Active option marked by aria-selected="true".
  assert.match(css, /\.language-switcher__option\[aria-selected="true"\]\s*\{[\s\S]*?font-weight:\s*var\(--font-weight-medium\)/, "the active option must be marked by aria-selected='true'");
});

test("AC5: language-switcher.css consumes only semantic tokens — NO --glass-*/--color-neutral-* primitive, NO literal hex/rgba", () => {
  const css = r("src", "css", "components", "language-switcher.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "language-switcher.css must not reference a --glass-*/--color-neutral-* primitive");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "language-switcher.css must not contain a literal hex colour");
  assert.doesNotMatch(css, /\brgba?\(/, "language-switcher.css must not contain a literal rgb/rgba value");
});

// ─── Frozen JS / print contracts (restyle-only) ─────────────────────────────

test("AC5: language-switcher.js is restyle-only — FR8 aria-disabled locale-lock + listbox semantics untouched", () => {
  const js = r("src", "assessment", "language-switcher.js");
  // The FR8 blocker that sets the trigger aria-disabled — the styling hook this story preserves.
  assert.match(js, /aria-disabled/, "language-switcher.js must keep driving the FR8 aria-disabled locale-lock");
  assert.match(js, /aria-haspopup/, "language-switcher.js must keep the listbox trigger semantics");
});

test("AC7: print path stays opaque/light — no Aurora navy bleeds into print (print.css strips glass)", () => {
  const css = r("src", "css", "print.css");
  // Print forces light + white/dark-ink and drops chrome — Aurora navy never prints.
  assert.match(css, /@media print/, "print.css must keep the @media print document block");
  assert.match(css, /:root\s*\{\s*color-scheme:\s*light/, "print must force color-scheme:light (no Aurora navy in print)");
  assert.match(css, /\.chrome-header,[\s\S]*?\.chrome-footer,[\s\S]*?display:\s*none\s*!important/, "print must strip the chrome bars (no glass in print)");
});
