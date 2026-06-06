// tests/playwright/pr11-methodology-sidebar.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-11 — AC13: /methodology presents its section list in a sidebar
// with in-page anchor navigation — clicking scrolls to a section on a single
// scrollable page; anchors are deep-linkable and keyboard-accessible.
//
// Methodology pages are static HTML served from dist/methodology/.
// The sidebar must be a <nav> element with <a href="#section-id"> links.
// Deep-linking via hash should scroll to the right section.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

const METHODOLOGY_EN = "/methodology/v0.1.0/en/";

test("AC13: methodology index page has a <nav> sidebar element", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}${METHODOLOGY_EN}`);
  await page.waitForLoadState("domcontentloaded");

  // PR-11: adds a sidebar nav; before impl only a flat list → RED.
  const sidebar = page.locator("nav.methodology-sidebar, aside nav, nav[aria-label*='methodology'], [data-sidebar]").first();
  await expect(sidebar, "AC13: methodology page must have a sidebar <nav> element").toHaveCount(1);
});

test("AC13: sidebar contains anchor links (<a href='#...'>)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}${METHODOLOGY_EN}`);
  await page.waitForLoadState("domcontentloaded");

  const sidebarLinks = page.locator("nav.methodology-sidebar a[href^='#'], aside nav a[href^='#'], [data-sidebar] a[href^='#']");
  const count = await sidebarLinks.count();
  expect(count, `AC13: sidebar must contain ≥3 in-page anchor links; found ${count}`).toBeGreaterThanOrEqual(3);
});

test("AC13: clicking a sidebar link scrolls to the corresponding section (section is in viewport after click)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}${METHODOLOGY_EN}`);
  await page.waitForLoadState("domcontentloaded");

  // Get the first sidebar anchor link and its target.
  const firstLink = page.locator("nav.methodology-sidebar a[href^='#'], aside nav a[href^='#'], [data-sidebar] a[href^='#']").first();
  await firstLink.waitFor({ state: "visible" });

  const href = await firstLink.getAttribute("href");
  expect(href, "AC13: first sidebar link must have an href starting with #").toMatch(/^#/);

  const targetId = href.slice(1); // Remove the #

  // Scroll to top first.
  await page.evaluate(() => window.scrollTo(0, 0));

  // Click the sidebar link.
  await firstLink.click();

  // The target section should now be visible/in-viewport. (Use an [id="..."]
  // attribute selector — CSS.escape is a browser global, not available here in
  // the Node test context.)
  const targetSection = page.locator(`[id="${targetId}"]`);

  // Verify target element exists.
  await expect(targetSection, `AC13: target section #${targetId} must exist in the DOM`).toHaveCount(1);

  // The section should be scrolled into view.
  const isInViewport = await targetSection.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(isInViewport, `AC13: section #${targetId} must be in viewport after clicking sidebar link`).toBe(true);
});

test("AC13: sections have matching id attributes for deep-linking", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}${METHODOLOGY_EN}`);
  await page.waitForLoadState("domcontentloaded");

  const anchors = page.locator("nav.methodology-sidebar a[href^='#'], aside nav a[href^='#'], [data-sidebar] a[href^='#']");
  const hrefs = await anchors.evaluateAll((links) => links.map((a) => a.getAttribute("href")));

  for (const href of hrefs) {
    const id = href.slice(1);
    const target = page.locator(`#${id}`);
    const count = await target.count();
    expect(count, `AC13: no element with id='${id}' found for sidebar link ${href}`).toBeGreaterThanOrEqual(1);
  }
});

test("AC13: sidebar anchor links are keyboard-accessible (Tab + Enter scrolls to section)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}${METHODOLOGY_EN}`);
  await page.waitForLoadState("domcontentloaded");

  const firstLink = page.locator("nav.methodology-sidebar a[href^='#'], aside nav a[href^='#'], [data-sidebar] a[href^='#']").first();
  await firstLink.focus();

  const isFocused = await firstLink.evaluate((el) => el === document.activeElement);
  expect(isFocused, "AC13: sidebar link must receive focus").toBe(true);

  const href = await firstLink.getAttribute("href");
  const targetId = href.slice(1);

  await page.keyboard.press("Enter");

  const targetSection = page.locator(`#${targetId}`);
  const isInViewport = await targetSection.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(isInViewport, `AC13: Enter on focused sidebar link must scroll #${targetId} into viewport`).toBe(true);
});

test("AC13: deep-linking via URL hash navigates to the right section on load", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });

  // Load the methodology index page first to find a valid anchor id.
  await page.goto(`${origin}${METHODOLOGY_EN}`);
  await page.waitForLoadState("domcontentloaded");

  const firstLink = page.locator("nav.methodology-sidebar a[href^='#'], aside nav a[href^='#'], [data-sidebar] a[href^='#']").first();
  const href = await firstLink.getAttribute("href");
  const targetId = href.slice(1);

  // Now reload with the hash in the URL.
  await page.goto(`${origin}${METHODOLOGY_EN}${href}`);
  await page.waitForLoadState("domcontentloaded");

  const targetSection = page.locator(`#${targetId}`);
  const isInViewport = await targetSection.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(
    isInViewport,
    `AC13: loading with URL hash ${href} must scroll #${targetId} into viewport`,
  ).toBe(true);
});
