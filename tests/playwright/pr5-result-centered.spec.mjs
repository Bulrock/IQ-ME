// tests/playwright/pr5-result-centered.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-5 — AC7: Result page content is vertically centered/balanced
// (no top-hug with large empty space below); the co-equal triplet
// (percentile / IQ-scale / range) is preserved.
//
// "Vertically balanced" is defined as: the midpoint of the result content block
// is within ±25% of the viewport midpoint. The triplet selectors must each be
// visible and co-equal per FR18.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const SEED = "0123456789abcdef0123456789abcdef";
const VIEWPORTS = [
  { width: 1280, height: 800, name: "desktop-1280" },
  { width: 768, height: 1024, name: "tablet-768" },
  { width: 375, height: 812, name: "mobile-375" },
];

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

async function driveToResult(page, origin) {
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate((s) => {
    window.__IQME_TEST__.resetState();
    window.__IQME_TEST__.setSeed(s);
    for (let i = 0; i < 16; i++) {
      window.__IQME_TEST__.recordResponse(i, i % 2);
    }
    window.__IQME_TEST__.navigate("result");
  }, SEED);
  // Advance past the pre-reveal beat if needed.
  const showMeBtn = page.getByRole("button", { name: /show me/i });
  if (await showMeBtn.count() > 0) {
    await showMeBtn.click();
  }
  await expect(page.locator(".score-panel"), "score-panel must be visible").toBeVisible({ timeout: 10000 });
}

for (const vp of VIEWPORTS) {
  test(`AC7 [${vp.name}]: result page content is vertically centered — midpoint within ±25% of viewport center`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await driveToResult(page, origin);

    // The main result content wrapper: .score-panel or .result-scene.
    const resultContent = page.locator(".score-panel, .result-scene").first();
    await resultContent.waitFor({ state: "visible" });

    const box = await resultContent.boundingBox();
    expect(box, `AC7 [${vp.name}]: result content must have a bounding box`).not.toBeNull();

    const contentMidY = box.y + box.height / 2;
    const viewportMidY = vp.height / 2;
    const tolerance = vp.height * 0.25; // ±25% of viewport height

    // PR-5: vertical centering; before fix content is top-hugged → midpoint is near top → RED.
    expect(
      Math.abs(contentMidY - viewportMidY),
      `AC7 [${vp.name}]: result content midY (${contentMidY}px) vs viewport midY (${viewportMidY}px); delta must be ≤ ${tolerance}px`,
    ).toBeLessThanOrEqual(tolerance);
  });

  test(`AC7 [${vp.name}]: co-equal triplet (percentile / anchor / band) all visible`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await driveToResult(page, origin);

    await expect(page.locator(".score-panel__percentile"), `AC7 [${vp.name}]: percentile visible`).toBeVisible();
    await expect(page.locator(".score-panel__anchor"), `AC7 [${vp.name}]: anchor visible`).toBeVisible();
    await expect(page.locator(".score-panel__band"), `AC7 [${vp.name}]: band visible`).toBeVisible();
  });
}
