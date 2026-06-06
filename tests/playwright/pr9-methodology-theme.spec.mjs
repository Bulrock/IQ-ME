// tests/playwright/pr9-methodology-theme.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-9 — AC11: With Light theme selected, /methodology renders in
// Light (not Dark); theme selection round-trips between the SPA and the
// methodology surface for System / Light / Dark.
//
// The methodology pages are static HTML served from dist/methodology/.
// Theme propagation must work for all three values.
//
// Approach: set theme via the SPA chrome, then navigate to the methodology
// index page and assert that the theme attribute propagates.
// The methodology pages may read the theme from localStorage (same key "theme")
// and apply [data-theme] on their own <html>.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

const METHODOLOGY_PATHS = [
  "/methodology/v0.1.0/en/",
  "/methodology/v0.1.0/ru/",
  "/methodology/v0.1.0/pl/",
];

// ─── Helper: seed localStorage theme before navigation ──────────────────────

async function gotoMethodologyWithTheme(page, origin, theme, langPath) {
  if (theme === "system") {
    await page.addInitScript(() => { localStorage.removeItem("theme"); });
  } else {
    await page.addInitScript((t) => { localStorage.setItem("theme", t); }, theme);
  }
  await page.goto(`${origin}${langPath}`);
  await page.waitForLoadState("domcontentloaded");
}

// ─── AC11: Light theme → methodology shows Light ────────────────────────────

test("AC11: methodology EN index renders in Light theme when localStorage.theme='light'", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoMethodologyWithTheme(page, origin, "light", "/methodology/v0.1.0/en/");

  // PR-9: methodology pages must apply [data-theme] from stored preference.
  // Currently methodology pages have no theme script → RED.
  const dataTheme = await page.locator("html").getAttribute("data-theme");
  expect(dataTheme, "AC11: methodology <html>[data-theme] must be 'light' when theme pref is light").toBe("light");
});

test("AC11: methodology EN index renders in Dark theme when localStorage.theme='dark'", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoMethodologyWithTheme(page, origin, "dark", "/methodology/v0.1.0/en/");

  const dataTheme = await page.locator("html").getAttribute("data-theme");
  expect(dataTheme, "AC11: methodology <html>[data-theme] must be 'dark' when theme pref is dark").toBe("dark");
});

test("AC11: methodology EN index has no [data-theme] under System (no stored pref)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoMethodologyWithTheme(page, origin, "system", "/methodology/v0.1.0/en/");

  const hasDataTheme = await page.evaluate(() => document.documentElement.hasAttribute("data-theme"));
  expect(hasDataTheme, "AC11: methodology <html> must not have [data-theme] under System (no pref)").toBe(false);
});

// ─── AC11: theme round-trip — set in SPA then methodology picks it up ───────

test("AC11: setting Light in SPA → then visiting methodology → methodology reflects Light", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  // Set Light theme via the new theme switcher (PR-6).
  const lightSeg = page.locator(
    ".chrome-header .theme-switcher button:has-text('Light'), .chrome-header [data-theme-value='light']",
  ).first();
  await lightSeg.click();

  // Verify localStorage was written.
  const stored = await page.evaluate(() => localStorage.getItem("theme"));
  expect(stored, "AC11: localStorage.theme must be 'light' after switching").toBe("light");

  // Now open methodology in the same browser context (shared localStorage).
  await page.goto(`${origin}/methodology/v0.1.0/en/`);
  await page.waitForLoadState("domcontentloaded");

  const dataTheme = await page.locator("html").getAttribute("data-theme");
  expect(dataTheme, "AC11: methodology must pick up light theme from localStorage after SPA set").toBe("light");
});

// ─── AC11: all three locales pick up the theme ──────────────────────────────

for (const theme of ["light", "dark"]) {
  for (const path of METHODOLOGY_PATHS) {
    const locale = path.split("/").filter(Boolean).pop();
    test(`AC11 [${locale}/${theme}]: methodology ${locale} index renders with data-theme='${theme}'`, async ({ page }) => {
      const origin = `http://127.0.0.1:${server.port}`;
      await gotoMethodologyWithTheme(page, origin, theme, path);

      const dataTheme = await page.locator("html").getAttribute("data-theme");
      expect(
        dataTheme,
        `AC11 [${locale}/${theme}]: <html>[data-theme] must be '${theme}'`,
      ).toBe(theme);
    });
  }
}
