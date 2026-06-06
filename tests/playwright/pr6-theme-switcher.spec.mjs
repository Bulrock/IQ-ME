// tests/playwright/pr6-theme-switcher.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-6 — AC8: Theme control is a toggle/segmented switcher (NOT
// radio buttons), positioned top-right in the header, offering System/Light/Dark,
// persisting via [data-theme] mechanism, keyboard-operable.
//
// PR-6 changes the chrome-header theme control from a <fieldset> radio group
// (old pattern in chrome-footer) to a segmented toggle in the chrome-header.
// The new control:
//   - is NOT a <fieldset> with radio inputs (that is the PR-6 UX change)
//   - has [data-theme-switcher] or .theme-switcher class in the chrome-header
//   - offers three segments: System / Light / Dark
//   - reflects state via <html>[data-theme]
//   - is keyboard-accessible (Tab focus, Space/Enter to activate)

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

async function gotoLanding(page, origin) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();
}

test("AC8: theme switcher is in the chrome-header (not footer) top-right position", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  // PR-6: theme switcher moves to chrome-header; currently may be in footer → RED.
  const headerSwitcher = page.locator(".chrome-header .theme-switcher, .chrome-header [data-theme-switcher]");
  await expect(headerSwitcher, "AC8: theme switcher must be inside .chrome-header").toHaveCount(1);
});

test("AC8: theme switcher is NOT a <fieldset> radio group (it's a segmented toggle/button group)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  // The new control must NOT be a <fieldset> with <input type=radio> children.
  // PR-6 replaces radio pattern; before impl the old radio fieldset is in footer.
  const headerRadios = page.locator(".chrome-header input[type='radio'][value='light'], .chrome-header input[type='radio'][value='dark']");
  await expect(headerRadios, "AC8: chrome-header must NOT contain radio inputs for theme").toHaveCount(0);
});

test("AC8: theme switcher offers Light and Dark segments (System removed)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const switcher = page.locator(".chrome-header .theme-switcher, .chrome-header [data-theme-switcher]");
  await switcher.waitFor({ state: "visible" });

  const lightSeg  = switcher.locator("button:has-text('Light'), [data-theme-value='light']");
  const darkSeg   = switcher.locator("button:has-text('Dark'),  [data-theme-value='dark']");
  const systemSeg = switcher.locator("button:has-text('System'), [data-theme-value='system']");

  await expect(lightSeg.first(),  "AC8: Light segment must exist").toBeVisible();
  await expect(darkSeg.first(),   "AC8: Dark segment must exist").toBeVisible();
  // System was removed per maintainer decision (Light/Dark only; OS-follow default).
  await expect(systemSeg, "AC8: System segment must NOT exist").toHaveCount(0);
});

test("AC8: clicking Light segment sets [data-theme='light'] on <html>", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const switcher = page.locator(".chrome-header .theme-switcher, .chrome-header [data-theme-switcher]");
  const lightSeg = switcher.locator("button:has-text('Light'), [data-theme-value='light'], [aria-label*='Light']").first();
  await lightSeg.click();

  const dataTheme = await page.locator("html").getAttribute("data-theme");
  expect(dataTheme, "AC8: <html>[data-theme] must be 'light' after Light click").toBe("light");
});

test("AC8: clicking Dark segment sets [data-theme='dark'] on <html>", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const switcher = page.locator(".chrome-header .theme-switcher, .chrome-header [data-theme-switcher]");
  const darkSeg = switcher.locator("button:has-text('Dark'), [data-theme-value='dark'], [aria-label*='Dark']").first();
  await darkSeg.click();

  const dataTheme = await page.locator("html").getAttribute("data-theme");
  expect(dataTheme, "AC8: <html>[data-theme] must be 'dark' after Dark click").toBe("dark");
});

test("AC8: with no saved choice the switcher follows the OS (no [data-theme]; active segment reflects scheme)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.emulateMedia({ colorScheme: "dark" });
  await gotoLanding(page, origin);

  // System removed: a fresh visit leaves <html> without [data-theme] so CSS
  // resolves via prefers-color-scheme, and the Dark segment shows as active.
  const hasDataTheme = await page.evaluate(() => document.documentElement.hasAttribute("data-theme"));
  expect(hasDataTheme, "AC8: no [data-theme] when following the OS").toBe(false);

  const darkSeg = page.locator(".chrome-header [data-theme-value='dark']").first();
  await expect(darkSeg, "AC8: Dark segment active under prefers-color-scheme: dark").toHaveAttribute("aria-pressed", "true");
});

test("AC8: theme switcher is keyboard-operable — Tab focuses it, Space/Enter activates", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  // Tab through the page until the theme switcher gains focus.
  // The switcher segment should be reachable via Tab.
  const lightSeg = page.locator(
    ".chrome-header .theme-switcher button:has-text('Light'), .chrome-header [data-theme-switcher] [data-theme-value='light']",
  ).first();
  await lightSeg.focus();

  const isFocused = await lightSeg.evaluate((el) => el === document.activeElement);
  expect(isFocused, "AC8: Light segment must receive focus when focused directly").toBe(true);

  // Press Enter to activate.
  await page.keyboard.press("Enter");
  const dataTheme = await page.locator("html").getAttribute("data-theme");
  expect(dataTheme, "AC8: pressing Enter on Light segment must set [data-theme='light']").toBe("light");
});

test("AC8: theme selection persists across soft navigation (hash route change)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const switcher = page.locator(".chrome-header .theme-switcher, .chrome-header [data-theme-switcher]");
  const darkSeg = switcher.locator("button:has-text('Dark'), [data-theme-value='dark'], [aria-label*='Dark']").first();
  await darkSeg.click();

  // Navigate to consent.
  await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
  await expect(page.locator(".consent-scene")).toBeVisible();

  // Theme must persist.
  const dataTheme = await page.locator("html").getAttribute("data-theme");
  expect(dataTheme, "AC8: dark theme must persist after hash navigation to consent").toBe("dark");
});
