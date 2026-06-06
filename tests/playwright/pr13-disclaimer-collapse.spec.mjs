// tests/playwright/pr13-disclaimer-collapse.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-13 — AC16: The result-page explanatory disclaimer collapses to
// its first line with an expand/collapse toggle, defaulting collapsed,
// keyboard- and screen-reader-operable, without breaking PR-5 centering.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const SEED = "0123456789abcdef0123456789abcdef";

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
  const showMeBtn = page.getByRole("button", { name: /show me/i });
  if (await showMeBtn.count() > 0) {
    await showMeBtn.click();
  }
  await expect(page.locator(".score-panel"), "score-panel must be visible").toBeVisible({ timeout: 10000 });
}

test("AC16: result page has a disclaimer element", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToResult(page, origin);

  // PR-13: disclaimer element must exist; before impl may be absent → RED.
  const disclaimer = page.locator(
    ".disclaimer, .result__disclaimer, [data-disclaimer], details.disclaimer",
  ).first();
  await expect(disclaimer, "AC16: disclaimer element must be on the result page").toHaveCount(1);
});

test("AC16: disclaimer defaults to collapsed state", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToResult(page, origin);

  // Implementation options:
  //   a) <details> element — collapsed = no `open` attribute
  //   b) aria-expanded="false" on toggle button
  //   c) custom data-collapsed attribute

  // Check for <details> pattern first.
  const details = page.locator("details.disclaimer, .result__disclaimer details, [data-disclaimer] details").first();
  const detailsCount = await details.count();

  if (detailsCount > 0) {
    // <details> without `open` is collapsed.
    const isOpen = await details.evaluate((el) => el.open);
    expect(isOpen, "AC16: <details> disclaimer must default to collapsed (no 'open' attribute)").toBe(false);
  } else {
    // Non-details pattern: toggle button must have aria-expanded="false".
    const toggleBtn = page.locator(
      ".disclaimer__toggle, [data-disclaimer-toggle], button[aria-controls*='disclaimer']",
    ).first();
    await expect(toggleBtn, "AC16: disclaimer toggle button must exist").toHaveCount(1);

    const expanded = await toggleBtn.getAttribute("aria-expanded");
    expect(expanded, "AC16: disclaimer toggle must default to aria-expanded='false'").toBe("false");
  }
});

test("AC16: clicking the expand toggle reveals the full disclaimer content", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToResult(page, origin);

  // Expand: click the toggle.
  const details = page.locator("details.disclaimer, .result__disclaimer details, [data-disclaimer] details").first();
  const detailsCount = await details.count();

  if (detailsCount > 0) {
    await details.locator("summary").click();
    const isOpen = await details.evaluate((el) => el.open);
    expect(isOpen, "AC16: clicking summary must open <details>").toBe(true);

    // The content region must now be visible.
    const content = details.locator("p, .disclaimer__body, .disclaimer__content");
    await expect(content.first(), "AC16: disclaimer content must be visible when expanded").toBeVisible();
  } else {
    const toggleBtn = page.locator(
      ".disclaimer__toggle, [data-disclaimer-toggle], button[aria-controls*='disclaimer']",
    ).first();
    await toggleBtn.click();

    const expanded = await toggleBtn.getAttribute("aria-expanded");
    expect(expanded, "AC16: toggle must be aria-expanded='true' after click").toBe("true");

    // Content must be visible.
    const content = page.locator(".disclaimer__body, .disclaimer__content, [data-disclaimer-content]").first();
    await expect(content, "AC16: disclaimer body must be visible after expanding").toBeVisible();
  }
});

test("AC16: collapse works — clicking toggle again collapses the disclaimer", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToResult(page, origin);

  const details = page.locator("details.disclaimer, .result__disclaimer details, [data-disclaimer] details").first();
  const detailsCount = await details.count();

  if (detailsCount > 0) {
    const summary = details.locator("summary");
    await summary.click(); // expand
    await summary.click(); // collapse
    const isOpen = await details.evaluate((el) => el.open);
    expect(isOpen, "AC16: second click on summary must collapse <details>").toBe(false);
  } else {
    const toggleBtn = page.locator(
      ".disclaimer__toggle, [data-disclaimer-toggle], button[aria-controls*='disclaimer']",
    ).first();
    await toggleBtn.click(); // expand
    await toggleBtn.click(); // collapse
    const expanded = await toggleBtn.getAttribute("aria-expanded");
    expect(expanded, "AC16: second toggle click must set aria-expanded='false'").toBe("false");
  }
});

test("AC16: disclaimer toggle is keyboard-operable — focus + Enter toggles", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToResult(page, origin);

  // For <details>, the <summary> is natively keyboard-accessible.
  const details = page.locator("details.disclaimer, .result__disclaimer details, [data-disclaimer] details").first();
  const detailsCount = await details.count();

  if (detailsCount > 0) {
    const summary = details.locator("summary");
    await summary.focus();
    const isFocused = await summary.evaluate((el) => el === document.activeElement);
    expect(isFocused, "AC16: <summary> must receive focus").toBe(true);

    await page.keyboard.press("Enter");
    const isOpen = await details.evaluate((el) => el.open);
    expect(isOpen, "AC16: Enter on <summary> must open <details>").toBe(true);
  } else {
    const toggleBtn = page.locator(
      ".disclaimer__toggle, [data-disclaimer-toggle], button[aria-controls*='disclaimer']",
    ).first();
    await toggleBtn.focus();
    const isFocused = await toggleBtn.evaluate((el) => el === document.activeElement);
    expect(isFocused, "AC16: disclaimer toggle button must receive focus").toBe(true);

    await page.keyboard.press("Enter");
    const expanded = await toggleBtn.getAttribute("aria-expanded");
    expect(expanded, "AC16: Enter on toggle button must set aria-expanded='true'").toBe("true");
  }
});

test("AC16: expanding disclaimer does not break PR-5 vertical centering of score-panel", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToResult(page, origin);

  const scorePanel = page.locator(".score-panel");
  const boxBefore = await scorePanel.boundingBox();

  // Expand the disclaimer.
  const details = page.locator("details.disclaimer, .result__disclaimer details, [data-disclaimer] details").first();
  const detailsCount = await details.count();

  if (detailsCount > 0) {
    await details.locator("summary").click();
  } else {
    const toggleBtn = page.locator(
      ".disclaimer__toggle, [data-disclaimer-toggle], button[aria-controls*='disclaimer']",
    ).first();
    if (await toggleBtn.count() > 0) await toggleBtn.click();
  }

  const boxAfter = await scorePanel.boundingBox();

  // Score panel must still be visible and not displaced massively.
  expect(boxAfter, "AC16: score-panel bounding box must exist after expanding disclaimer").not.toBeNull();

  // The score-panel vertical position must not shift by more than 100px.
  // (Some shift is expected because the disclaimer content pushes things;
  //  but the centering must be preserved in spirit.)
  const shift = Math.abs(boxAfter.y - (boxBefore ? boxBefore.y : 0));
  expect(
    shift,
    `AC16: score-panel Y shifted by ${shift}px after expanding disclaimer — must be ≤ 100px`,
  ).toBeLessThanOrEqual(100);
});
