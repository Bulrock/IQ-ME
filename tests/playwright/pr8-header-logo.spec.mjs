// tests/playwright/pr8-header-logo.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-8 — AC10: The app logo from src/assets/favicon_io/ appears
// beside the "IQ-ME" wordmark in the header without layout shift; the logo has
// a correct accessible name or is marked decorative.

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

test("AC10: chrome-header contains a logo image from the favicon_io asset path", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  // PR-8: adds <img> or <picture> for the logo in .chrome-header; before impl absent → RED.
  const logoImg = page.locator(
    ".chrome-header img[src*='favicon_io'], .chrome-header img[src*='favicon'], .chrome-header .chrome-header__logo img",
  ).first();
  await expect(logoImg, "AC10: logo image must be in .chrome-header").toHaveCount(1);
});

test("AC10: logo image resolves without 404", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const logoSrc = await page.locator(
    ".chrome-header img[src*='favicon_io'], .chrome-header img[src*='favicon'], .chrome-header .chrome-header__logo img",
  ).first().getAttribute("src");

  expect(logoSrc, "AC10: logo img must have a src attribute").toBeTruthy();

  const resp = await page.request.fetch(logoSrc.startsWith("http") ? logoSrc : `${origin}${logoSrc}`, {
    failOnStatusCode: false,
  });
  expect(resp.status(), `AC10: logo asset ${logoSrc} must not 404 (got ${resp.status()})`).toBeLessThan(400);
});

test("AC10: logo is accessible — has alt text or is marked decorative (alt='')", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const logoImg = page.locator(
    ".chrome-header img[src*='favicon_io'], .chrome-header img[src*='favicon'], .chrome-header .chrome-header__logo img",
  ).first();

  // Must have an alt attribute (empty = decorative, non-empty = informative).
  const alt = await logoImg.getAttribute("alt");
  expect(alt, "AC10: logo img must have an alt attribute (decorative='' or informative text)").not.toBeNull();
});

test("AC10: logo appears beside the IQ-ME wordmark (overlapping boundingBoxes within same row)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const logoImg = page.locator(
    ".chrome-header img[src*='favicon_io'], .chrome-header img[src*='favicon'], .chrome-header .chrome-header__logo img",
  ).first();
  const wordmark = page.locator(".chrome-header__name, .chrome-header__wordmark").first();

  await logoImg.waitFor({ state: "visible" });
  await wordmark.waitFor({ state: "visible" });

  const logoBox    = await logoImg.boundingBox();
  const wordmarkBox = await wordmark.boundingBox();

  expect(logoBox, "AC10: logo must have a bounding box").not.toBeNull();
  expect(wordmarkBox, "AC10: wordmark must have a bounding box").not.toBeNull();

  // They are "beside" each other: vertical centers are within 20px of each other
  // (same row), and the horizontal distance between them is ≤ 120px (adjacent).
  const logoCenterY    = logoBox.y + logoBox.height / 2;
  const wordmarkCenterY = wordmarkBox.y + wordmarkBox.height / 2;
  const verticalDelta   = Math.abs(logoCenterY - wordmarkCenterY);

  expect(
    verticalDelta,
    `AC10: logo and wordmark vertical centers must be within 20px (same row); delta=${verticalDelta}px`,
  ).toBeLessThanOrEqual(20);

  const logoRight = logoBox.x + logoBox.width;
  const wordmarkLeft = wordmarkBox.x;
  const gap = Math.abs(wordmarkLeft - logoRight);

  expect(
    gap,
    `AC10: horizontal gap between logo and wordmark must be ≤ 120px; gap=${gap}px`,
  ).toBeLessThanOrEqual(120);
});

test("AC10: no layout shift — logo bounding box is stable after page fully loads", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);
  await page.waitForLoadState("networkidle");

  const logoImg = page.locator(
    ".chrome-header img[src*='favicon_io'], .chrome-header img[src*='favicon'], .chrome-header .chrome-header__logo img",
  ).first();

  const box1 = await logoImg.boundingBox();

  // Wait a brief moment for any deferred layout work.
  await page.waitForFunction(() => document.readyState === "complete");
  const box2 = await logoImg.boundingBox();

  expect(box1, "AC10: logo bounding box must be stable (first read)").not.toBeNull();
  expect(box2, "AC10: logo bounding box must be stable (second read)").not.toBeNull();

  expect(box2.x, "AC10: logo X must not shift after load").toBe(box1.x);
  expect(box2.y, "AC10: logo Y must not shift after load").toBe(box1.y);
});
