// tests/playwright/pr10-no-horizontal-scroll.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-10 — AC12: No horizontal page scroll at any supported
// width/locale. The "Continue" button helper caption (including longest PL
// string) wraps/constrains within viewport width.
//
// Tested on EN and PL (widest i18n strings); 375, 390, 428, 768, 1280px.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const LOCALES = ["en", "pl"];
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 428, height: 926 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];
const SEED = "0123456789abcdef0123456789abcdef";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

async function checkNoHorizontalScroll(page, origin, locale, viewport) {
  if (locale !== "en") {
    await page.addInitScript((loc) => { localStorage.setItem("locale", loc); }, locale);
  }
  await page.setViewportSize(viewport);
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  // Check document-level scrollWidth vs viewport width.
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(
    scrollWidth,
    `AC12 [${locale} ${viewport.width}px]: document scrollWidth ${scrollWidth}px must be ≤ viewport width ${viewport.width}px (no horizontal scroll)`,
  ).toBeLessThanOrEqual(viewport.width);
}

for (const locale of LOCALES) {
  for (const vp of VIEWPORTS) {
    test(`AC12 [${locale} ${vp.width}px]: landing — no horizontal scroll (scrollWidth ≤ viewport)`, async ({ page }) => {
      const origin = `http://127.0.0.1:${server.port}`;
      await checkNoHorizontalScroll(page, origin, locale, vp);
    });
  }
}

// Also check during the consent step (which has a "Continue" button with caption).
for (const locale of LOCALES) {
  for (const vp of [{ width: 375, height: 812 }, { width: 428, height: 926 }]) {
    test(`AC12 [${locale} ${vp.width}px]: consent — no horizontal scroll (Continue caption wraps)`, async ({ page }) => {
      const origin = `http://127.0.0.1:${server.port}`;
      if (locale !== "en") {
        await page.addInitScript((loc) => { localStorage.setItem("locale", loc); }, locale);
      }
      await page.setViewportSize(vp);
      await page.goto(`${origin}/?test=1`);
      await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
      await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
      await expect(page.locator(".consent-scene")).toBeVisible();

      // PR-10: before fix the Continue button caption may overflow → RED.
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(
        scrollWidth,
        `AC12 [${locale} ${vp.width}px consent]: scrollWidth ${scrollWidth}px must be ≤ ${vp.width}px`,
      ).toBeLessThanOrEqual(vp.width);
    });
  }
}

// Body overflow-x must be hidden or the content must not exceed viewport.
test("AC12 [EN 375px]: body/html does not have overflow-x that creates horizontal scroll", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  const overflowState = await page.evaluate(() => ({
    htmlOverflowX: getComputedStyle(document.documentElement).overflowX,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  // Either overflowX is 'hidden'/'clip' OR scrollWidth ≤ viewport.
  const noHScroll =
    overflowState.scrollWidth <= overflowState.viewportWidth ||
    ["hidden", "clip"].includes(overflowState.htmlOverflowX) ||
    ["hidden", "clip"].includes(overflowState.bodyOverflowX);

  expect(
    noHScroll,
    `AC12: horizontal scroll detected at 375px. scrollWidth=${overflowState.scrollWidth} viewport=${overflowState.viewportWidth} htmlOverflowX=${overflowState.htmlOverflowX}`,
  ).toBe(true);
});

test("Aurora chrome [EN 375px]: footer remains visible at a narrow CSS viewport (high browser zoom equivalent)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  const footerBox = await page.locator(".chrome-footer").boundingBox();
  expect(footerBox, "footer must remain rendered").not.toBeNull();
  expect(footerBox.y, "footer top must remain inside the viewport").toBeGreaterThanOrEqual(0);
  expect(footerBox.y + footerBox.height, "footer bottom must remain inside the viewport").toBeLessThanOrEqual(812);
});
