// tests/playwright/pr1-favicon.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-1 — AC1: Favicon / manifest assets linked and served without 404.
//
// Asserts that src/index.html <head> contains <link> tags for:
//   favicon.ico, favicon-16x16.png, favicon-32x32.png,
//   apple-touch-icon.png, site.webmanifest
// …and that all referenced asset URLs resolve with HTTP status < 400.
//
// The tab-icon affordance (link[rel*='icon']) must be present on every
// routable surface (landing, consent, result) — it lives in <head> so it
// persists across hash-routing, but we assert the DOM entry once.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

const ICON_FILENAMES = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
];
const MANIFEST_FILENAME = "site.webmanifest";

test("AC1: <head> contains link[rel*=icon] for favicon.ico", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/`);
  await page.waitForLoadState("domcontentloaded");

  // The implementation must add favicon links; currently they are absent → RED.
  const faviconLink = page.locator('link[rel~="icon"][href*="favicon.ico"]');
  await expect(faviconLink, "favicon.ico link must be present in <head>").toHaveCount(1);
});

test("AC1: <head> contains link for favicon-16x16.png", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/`);
  await page.waitForLoadState("domcontentloaded");

  const link = page.locator('link[href*="favicon-16x16.png"]');
  await expect(link, "favicon-16x16.png link must be in <head>").toHaveCount(1);
});

test("AC1: <head> contains link for favicon-32x32.png", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/`);
  await page.waitForLoadState("domcontentloaded");

  const link = page.locator('link[href*="favicon-32x32.png"]');
  await expect(link, "favicon-32x32.png link must be in <head>").toHaveCount(1);
});

test("AC1: <head> contains link for apple-touch-icon.png", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/`);
  await page.waitForLoadState("domcontentloaded");

  const link = page.locator('link[rel="apple-touch-icon"]');
  await expect(link, "apple-touch-icon link must be in <head>").toHaveCount(1);
});

test("AC1: <head> contains link[rel=manifest] for site.webmanifest", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/`);
  await page.waitForLoadState("domcontentloaded");

  const link = page.locator('link[rel="manifest"]');
  await expect(link, "site.webmanifest link[rel=manifest] must be in <head>").toHaveCount(1);
  const href = await link.getAttribute("href");
  expect(href, "manifest href must reference site.webmanifest").toMatch(/site\.webmanifest/);
});

test("AC1: favicon icon assets resolve with HTTP 200 (no 404)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;

  // Collect all link hrefs from <head> on load, then fetch each.
  await page.goto(`${origin}/`);
  await page.waitForLoadState("domcontentloaded");

  const iconHrefs = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]'),
    ).map((el) => el.href);
  });

  // Must find at least the 5 expected resources; implementation not yet done → RED.
  expect(
    iconHrefs.length,
    `Expected ≥5 icon/manifest links in <head>; found ${iconHrefs.length}: ${JSON.stringify(iconHrefs)}`,
  ).toBeGreaterThanOrEqual(5);

  for (const href of iconHrefs) {
    if (!href) continue;
    const resp = await page.request.fetch(href, { failOnStatusCode: false });
    expect(
      resp.status(),
      `Icon/manifest asset ${href} returned HTTP ${resp.status()} — expected < 400`,
    ).toBeLessThan(400);
  }
});

test("AC1: favicon link present on #/consent route (hash routing does not strip <head>)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
  await expect(page.locator(".consent-scene")).toBeVisible();

  // <head> is static — link survives hash route change.
  const faviconLink = page.locator('link[rel~="icon"][href*="favicon.ico"]');
  await expect(faviconLink, "favicon link survives hash navigation to #/consent").toHaveCount(1);
});
