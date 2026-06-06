// tests/playwright/chrome-components.spec.mjs
//
// Story 6.4 AC-9 — chrome-header + chrome-footer + theme-toggle exercised
// end-to-end in a real browser.
//
//   1. Visibility matrix: chrome visible on landing/consent/result; hidden
//      on item-runner (UX-DR8 — item-runner is a focus surface).
//   2. Theme toggle DOM: <fieldset.theme-toggle> with three radios
//      (system/light/dark) rendered into .chrome-footer__theme-toggle slot;
//      System initially checked when no localStorage key present.
//   3. localStorage discipline (NFR9): no setItem during page load;
//      explicit radio clicks are the ONLY writers; System click uses
//      removeItem, not setItem.
//   4. <html>[data-theme] attribute reflects the active explicit override
//      (Light/Dark) or absent under System.
//   5. prefers-color-scheme honored at System default (no data-theme,
//      no localStorage key) — body background resolves to the dark vs
//      light palette surface based on emulated media.
//
// FR52-related Discussions link wiring is verified by checking
// chrome-footer DOM contains an anchor pointing at the canonical
// GitHub Discussions URL.
//
// EN only at this epic; RU/PL reserved via test.skip (Epic 7).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const CHROME_HEADER = ".chrome-header";
const CHROME_FOOTER = ".chrome-footer";
// PR-6 (Story 11-1, AC8): theme control is a segmented <button> toggle in the
// chrome-header (Light/Dark only; System removed; OS-follow default).
const THEME_SWITCHER = ".chrome-header .theme-switcher";
const THEME_SEG_LIGHT = ".chrome-header .theme-switcher__segment[data-theme-value='light']";
const THEME_SEG_DARK = ".chrome-header .theme-switcher__segment[data-theme-value='dark']";
const METHODOLOGY_LINK = ".chrome-footer__methodology-link";
const DISCUSSIONS_LINK = ".chrome-footer__discussions-link";
const CITATION_LINK = ".chrome-footer__citation-link";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

/**
 * Install Storage.prototype.setItem spy BEFORE first navigation so AC-9
 * localStorage-discipline assertions have a complete write log across the
 * whole page lifetime. Mirrors the spy precedent from
 * `tests/playwright/mid-session-bail-out.spec.mjs` (Story 6.3).
 */
async function installSetItemSpy(page) {
  await page.addInitScript(() => {
    window.__setItemCalls = [];
    const proto = Storage.prototype;
    const orig = proto.setItem;
    proto.setItem = function (k, v) {
      window.__setItemCalls.push([k, v]);
      return orig.call(this, k, v);
    };
  });
}

async function gotoLanding(page, origin) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await installSetItemSpy(page);
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();
}

// ────────────────────────────────────────────────────────────────────────
// Test 1 — Visibility matrix: chrome visible on landing/consent/result,
// hidden on item-runner.
// ────────────────────────────────────────────────────────────────────────

test("AC-9: chrome-header + chrome-footer visible on landing/consent/result; hidden on item-runner (#/test)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  // Landing (#/)
  await expect(page.locator(CHROME_HEADER), "chrome-header visible on landing").toBeVisible();
  await expect(page.locator(CHROME_FOOTER), "chrome-footer visible on landing").toBeVisible();

  // Consent (#/consent)
  await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
  await expect(page.locator(".consent-scene")).toBeVisible();
  await expect(page.locator(CHROME_HEADER), "chrome-header visible on consent").toBeVisible();
  await expect(page.locator(CHROME_FOOTER), "chrome-footer visible on consent").toBeVisible();

  // Item-runner (#/test) — chrome must be hidden (UX-DR8).
  await page.evaluate(() => window.__IQME_TEST__.navigate("test"));
  await expect(page.locator(".item-runner")).toBeVisible();
  await expect(page.locator(CHROME_HEADER), "chrome-header HIDDEN on item-runner (UX-DR8)").toBeHidden();
  await expect(page.locator(CHROME_FOOTER), "chrome-footer HIDDEN on item-runner (UX-DR8)").toBeHidden();

  // Result (#/result) — chrome visible again.
  await page.evaluate(() => window.__IQME_TEST__.navigate("result"));
  // Result scene is gated; if the route doesn't reach .score-panel within
  // the test-hook driving (no scoreSession side-effects available here),
  // just assert chrome surfaces are visible after the route change.
  await expect(page.locator(CHROME_HEADER), "chrome-header visible on result route").toBeVisible();
  await expect(page.locator(CHROME_FOOTER), "chrome-footer visible on result route").toBeVisible();

  // Return to landing — sanity that the gate is route-driven, not one-shot.
  await page.evaluate(() => window.__IQME_TEST__.navigate(""));
  await expect(page.locator(CHROME_HEADER), "chrome-header visible after returning to landing").toBeVisible();
});

// ────────────────────────────────────────────────────────────────────────
// Test 2 — Theme toggle DOM + initial state (System checked, no
// localStorage writes on bootstrap).
// ────────────────────────────────────────────────────────────────────────

test("AC-9/AC-8: theme switcher renders Light/Dark segments in header (no System); active follows OS; ZERO setItem during bootstrap (NFR9)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.emulateMedia({ colorScheme: "dark" });
  await gotoLanding(page, origin);

  await expect(page.locator(THEME_SWITCHER), "theme-switcher rendered into chrome-header slot").toBeVisible();
  await expect(page.locator(THEME_SEG_LIGHT), "light segment rendered").toHaveCount(1);
  await expect(page.locator(THEME_SEG_DARK), "dark segment rendered").toHaveCount(1);
  await expect(page.locator(".chrome-header .theme-switcher__segment[data-theme-value='system']"), "no System segment").toHaveCount(0);

  const groupLabel = await page.locator(THEME_SWITCHER).getAttribute("aria-label");
  expect(groupLabel?.trim(), "theme switcher group aria-label matches strings.chrome.themeToggleLegend").toBe("Color theme");

  // No saved choice → follow OS: no [data-theme], active segment = resolved scheme (dark).
  const initialDataTheme = await page.evaluate(() => document.documentElement.hasAttribute("data-theme"));
  expect(initialDataTheme, "no data-theme attribute when following the OS").toBe(false);
  await expect(page.locator(THEME_SEG_DARK)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(THEME_SEG_LIGHT)).toHaveAttribute("aria-pressed", "false");

  // NFR9 — zero setItem calls during page load.
  const setItemCount = await page.evaluate(() => window.__setItemCalls.length);
  expect(setItemCount, "ZERO localStorage.setItem calls during bootstrap (NFR9)").toBe(0);
});

// ────────────────────────────────────────────────────────────────────────
// Test 3 — Light/Dark toggle: data-theme flips; one setItem per explicit click.
// ────────────────────────────────────────────────────────────────────────

test("AC-9/AC-8: activating Light then Dark flips data-theme; setItem fires exactly once per click", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  // Activate Light.
  await page.locator(THEME_SEG_LIGHT).click();
  await expect(page.locator(THEME_SEG_LIGHT)).toHaveAttribute("aria-pressed", "true");
  const afterLight = await page.evaluate(() => ({
    dataTheme: document.documentElement.getAttribute("data-theme"),
    setItems: window.__setItemCalls.slice(),
  }));
  expect(afterLight.dataTheme, "data-theme='light' after Light click").toBe("light");
  expect(
    afterLight.setItems.filter((c) => c[0] === "theme" && c[1] === "light").length,
    "exactly one setItem('theme','light') after Light click",
  ).toBe(1);

  // Activate Dark.
  await page.locator(THEME_SEG_DARK).click();
  await expect(page.locator(THEME_SEG_DARK)).toHaveAttribute("aria-pressed", "true");
  const afterDark = await page.evaluate(() => ({
    dataTheme: document.documentElement.getAttribute("data-theme"),
    setItems: window.__setItemCalls.slice(),
    storedTheme: localStorage.getItem("theme"),
  }));
  expect(afterDark.dataTheme, "data-theme='dark' after Dark click").toBe("dark");
  expect(afterDark.storedTheme, "localStorage.theme persisted as dark").toBe("dark");
  expect(
    afterDark.setItems.filter((c) => c[0] === "theme" && c[1] === "dark").length,
    "exactly one setItem('theme','dark') after Dark click",
  ).toBe(1);
});

// ────────────────────────────────────────────────────────────────────────
// Test 4 — prefers-color-scheme honored at System default
// ────────────────────────────────────────────────────────────────────────

/**
 * Helper — read the resolved value of a CSS custom property at :root.
 * Browsers resolve var() chains in getComputedStyle, so the returned
 * string is the final primitive (e.g. "#ffffff" or "#131820"). The body
 * element itself has no background-color rule in base.css / semantic.css
 * (transparent by design — page background is the html surface-base);
 * the canonical theme contract is the --color-surface-base token swap at
 * :root, which is what we assert.
 */
function parseHexSum(hexOrEmpty) {
  const m = (hexOrEmpty || "").trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const h = m[1];
  return parseInt(h.slice(0, 2), 16) + parseInt(h.slice(2, 4), 16) + parseInt(h.slice(4, 6), 16);
}

test.describe("AC-9: prefers-color-scheme honored at System default", () => {
  test.use({ colorScheme: "dark" });
  test("emulated dark-OS preference resolves --color-surface-base to dark-palette primitive; no data-theme attribute", async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await gotoLanding(page, origin);

    const state = await page.evaluate(() => ({
      hasDataTheme: document.documentElement.hasAttribute("data-theme"),
      storedTheme: localStorage.getItem("theme"),
      surfaceBase: getComputedStyle(document.documentElement).getPropertyValue("--color-surface-base").trim(),
    }));
    expect(state.hasDataTheme, "no data-theme attribute under System default").toBe(false);
    expect(state.storedTheme, "no localStorage.theme key under System default (NFR9)").toBe(null);
    const sum = parseHexSum(state.surfaceBase);
    expect(sum, `--color-surface-base must resolve to a dark-palette hex (low RGB sum) under prefers-color-scheme: dark; resolved=${state.surfaceBase}`).not.toBeNull();
    // Dark-palette surface-base is neutral-900 (#131820 → sum ~75); light is
    // neutral-0 (#ffffff → sum 765). Threshold at 384 = roughly half-bright.
    expect(sum, `--color-surface-base RGB sum < 384 under prefers-color-scheme: dark (light=765, dark=~75); resolved=${state.surfaceBase} sum=${sum}`).toBeLessThan(384);
  });
});

test.describe("AC-9: prefers-color-scheme honored — light counterpart", () => {
  test.use({ colorScheme: "light" });
  test("emulated light-OS preference resolves --color-surface-base to light-palette primitive; no data-theme attribute", async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await gotoLanding(page, origin);

    const state = await page.evaluate(() => ({
      hasDataTheme: document.documentElement.hasAttribute("data-theme"),
      storedTheme: localStorage.getItem("theme"),
      surfaceBase: getComputedStyle(document.documentElement).getPropertyValue("--color-surface-base").trim(),
    }));
    expect(state.hasDataTheme, "no data-theme attribute under System default").toBe(false);
    expect(state.storedTheme, "no localStorage.theme key under System default").toBe(null);
    const sum = parseHexSum(state.surfaceBase);
    expect(sum, `--color-surface-base must resolve to a light-palette hex; resolved=${state.surfaceBase}`).not.toBeNull();
    expect(sum, `--color-surface-base RGB sum > 384 under prefers-color-scheme: light (light=765, dark=~75); resolved=${state.surfaceBase} sum=${sum}`).toBeGreaterThan(384);
  });
});

// ────────────────────────────────────────────────────────────────────────
// Test 5 — chrome-footer link affordances present + canonical URLs
// ────────────────────────────────────────────────────────────────────────

test("AC-2: chrome-footer renders methodology + Discussions + citation links with canonical hrefs", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  await expect(page.locator(METHODOLOGY_LINK), "methodology link present in chrome-footer").toHaveCount(1);
  const methodologyHref = await page.locator(METHODOLOGY_LINK).getAttribute("href");
  expect(methodologyHref, "methodology link points to /methodology/v0.1.0/en/").toBe("/methodology/v0.1.0/en/");

  await expect(page.locator(DISCUSSIONS_LINK), "Discussions link present (FR52)").toHaveCount(1);
  const discussionsHref = await page.locator(DISCUSSIONS_LINK).getAttribute("href");
  expect(discussionsHref, "Discussions link points to canonical repo Discussions").toBe("https://github.com/Bulrock/IQ-ME/discussions");
  const discussionsRel = await page.locator(DISCUSSIONS_LINK).getAttribute("rel");
  expect(discussionsRel, "Discussions link carries rel='noopener' for security").toMatch(/noopener/);

  await expect(page.locator(CITATION_LINK), "citation link present in chrome-footer").toHaveCount(1);
  const citationHref = await page.locator(CITATION_LINK).getAttribute("href");
  expect(citationHref, "citation link points to /methodology/v0.1.0/en/reference/citation/").toBe("/methodology/v0.1.0/en/reference/citation/");
});

// ────────────────────────────────────────────────────────────────────────
// RU/PL reserved slots — Epic 7 owns locale parity
// ────────────────────────────────────────────────────────────────────────

test.skip("AC-9: chrome-components — RU (added in Epic 7)", async () => {
  // Reserved — locale parity slot lands in Epic 7.
});
test.skip("AC-9: chrome-components — PL (added in Epic 7)", async () => {
  // Reserved — locale parity slot lands in Epic 7.
});
