// tests/playwright/pr2-mobile-layout.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-2 — AC2a, AC2b, AC2c (AC2, AC3, AC4):
//   AC2a: No element overlap between item header and nav controls on mobile.
//   AC2b: Answer-option buttons reduced in size; inner figure icons normalized.
//   AC2c: Sticky/fixed Previous+Next always reachable; answer-options region
//         scrolls independently; full item fits at common mobile sizes.
//
// Uses real browser viewport at documented mobile breakpoints: 375, 390, 428.
// Uses boundingBox() comparisons (no pixel-diff).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const MOBILE_VIEWPORTS = [
  { width: 375, height: 812, name: "iPhone SE/8" },
  { width: 390, height: 844, name: "iPhone 14" },
  { width: 428, height: 926, name: "iPhone 14 Plus" },
];

const SEED = "0123456789abcdef0123456789abcdef";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

async function driveToItemRunner(page, origin) {
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();
  await page.evaluate((s) => {
    window.__IQME_TEST__.resetState();
    window.__IQME_TEST__.setSeed(s);
    window.__IQME_TEST__.navigate("test");
  }, SEED);
  await expect(page.locator(".item-runner")).toBeVisible();
}

// ─── AC2a: no overlap between item header and nav controls ──────────────────

for (const vp of MOBILE_VIEWPORTS) {
  test(`AC2a [${vp.name} ${vp.width}x${vp.height}]: item header does not overlap Previous/Next/bail controls`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await driveToItemRunner(page, origin);

    // The item header region (e.g. .item-runner__header or [data-item-header])
    // must not visually collide with the nav buttons.
    // PR-2a implementation adds proper layout separation; currently absent → RED.
    const headerEl = page.locator(".item-runner__header, [data-item-header], .item-runner__progress").first();
    const nextBtn   = page.locator(".item-runner__next, [data-action='next'], button[aria-label*='Next']").first();

    await headerEl.waitFor({ state: "visible" });
    await nextBtn.waitFor({ state: "visible" });

    const headerBox = await headerEl.boundingBox();
    const nextBox   = await nextBtn.boundingBox();

    expect(headerBox, `item header bounding box must exist at ${vp.width}px`).not.toBeNull();
    expect(nextBox,   `Next button bounding box must exist at ${vp.width}px`).not.toBeNull();

    // No vertical overlap: header bottom must be ≤ next button top,
    // OR next button bottom must be ≤ header top (one is above the other).
    const headerBottom = headerBox.y + headerBox.height;
    const nextTop      = nextBox.y;
    const nextBottom   = nextBox.y + nextBox.height;
    const headerTop    = headerBox.y;

    const noOverlap = headerBottom <= nextTop || nextBottom <= headerTop;
    expect(
      noOverlap,
      `AC2a [${vp.width}px]: item header (y=${headerBox.y} h=${headerBox.height}) overlaps Next btn (y=${nextBox.y} h=${nextBox.height})`,
    ).toBe(true);
  });
}

// ─── AC2a: "End the test early" (bail) must not overlap the progress header ──

for (const vp of MOBILE_VIEWPORTS) {
  test(`AC2a [${vp.name} ${vp.width}px]: 'End the test early' bail control does not overlap the progress header`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await driveToItemRunner(page, origin);

    const bail = page.locator(".item-runner__bail-affordance").first();
    const progress = page.locator(".item-runner__progress, [data-testid='progress-indicator']").first();
    await bail.waitFor({ state: "visible" });
    await progress.waitFor({ state: "visible" });

    const b = await bail.boundingBox();
    const p = await progress.boundingBox();
    expect(b, "bail control must have a bounding box").not.toBeNull();
    expect(p, "progress must have a bounding box").not.toBeNull();

    const noOverlap = b.y + b.height <= p.y || p.y + p.height <= b.y || b.x + b.width <= p.x || p.x + p.width <= b.x;
    expect(
      noOverlap,
      `AC2a [${vp.width}px]: bail (y=${b.y} h=${b.height} x=${b.x} w=${b.width}) overlaps progress (y=${p.y} h=${p.height} x=${p.x} w=${p.width})`,
    ).toBe(true);
  });
}

// ─── AC2b: option buttons smaller; figure icons normalized ──────────────────

test("AC2b [375px]: option figure icons are sized consistently with the matrix-grid cells above (not shrunk to thumbnails)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 375, height: 812 });
  await driveToItemRunner(page, origin);

  // A matrix-grid cell is ~1/3 of the puzzle image's width. The candidate-option
  // icons must read at roughly the same visual scale as a cell — not a tiny
  // thumbnail (the pre-fix bug: 40px icons against ~92px cells).
  const imgBox = await page.locator(".item-runner__image").boundingBox();
  expect(imgBox, "matrix image must be visible").not.toBeNull();
  const cell = imgBox.width / 3;

  const figure = page.locator(".item-runner__option-figure, .item-runner__option figure").first();
  await figure.waitFor({ state: "visible" });
  const figBox = await figure.boundingBox();
  expect(figBox, "option figure must be visible").not.toBeNull();

  // Consistent scale: the icon is at least ~60% of a cell and no larger than a
  // cell — i.e. comparable, not a thumbnail and not oversized.
  expect(
    figBox.width,
    `AC2b: option icon ${figBox.width.toFixed(0)}px must be ≥ 60% of a matrix cell (${(cell * 0.6).toFixed(0)}px) — consistent scale, not a thumbnail`,
  ).toBeGreaterThanOrEqual(cell * 0.6);
  expect(
    figBox.width,
    `AC2b: option icon ${figBox.width.toFixed(0)}px must be ≤ a matrix cell (${cell.toFixed(0)}px)`,
  ).toBeLessThanOrEqual(cell * 1.1);
});

test("AC2b [375px]: figure icons inside option buttons have consistent sizes (width delta ≤ 4px)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 375, height: 812 });
  await driveToItemRunner(page, origin);

  const figures = page.locator(".item-runner__option figure, [data-option] figure");
  const count = await figures.count();
  // Expect at least 4 figure icons (one per option).
  expect(count, "AC2b: at least 4 option figure icons must exist").toBeGreaterThanOrEqual(4);

  const widths = [];
  for (let i = 0; i < count; i++) {
    const box = await figures.nth(i).boundingBox();
    if (box) widths.push(box.width);
  }

  const minW = Math.min(...widths);
  const maxW = Math.max(...widths);
  expect(
    maxW - minW,
    `AC2b: figure icon width spread ${maxW - minW}px must be ≤ 4px (consistent sizing)`,
  ).toBeLessThanOrEqual(4);
});

// ─── AC2c: sticky nav + scrollable options container ────────────────────────

test("AC2c [390px]: Previous/Next buttons are sticky/fixed — remain in viewport while scrolled", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await driveToItemRunner(page, origin);

  const nextBtn = page.locator(".item-runner__next, [data-action='next'], button[aria-label*='Next']").first();
  await nextBtn.waitFor({ state: "visible" });

  // Scroll the page down to see if the button stays visible (sticky/fixed).
  await page.evaluate(() => window.scrollTo(0, 500));

  // After scroll, next button must still be visible (not scrolled away).
  // PR-2c: sticky nav implementation; currently may scroll away → RED.
  await expect(nextBtn, "AC2c: Next button must remain visible after page scroll (sticky/fixed)").toBeVisible();

  // And the button must still be within the viewport bounding box.
  const box = await nextBtn.boundingBox();
  expect(box, "Next button must have a bounding box after scroll").not.toBeNull();
  expect(
    box.y + box.height,
    `AC2c: Next button bottom (${box.y + box.height}px) must be within viewport height (844px)`,
  ).toBeLessThanOrEqual(844);
});

test("AC2c [375px]: answer-options container has overflow-y scroll (not the page)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 375, height: 812 });
  await driveToItemRunner(page, origin);

  // The options container should have overflow-y: auto or scroll (not the page).
  const optionsContainer = page.locator(
    ".item-runner__options, .item-runner__choices, [data-options-container]",
  ).first();
  await optionsContainer.waitFor({ state: "visible" });

  const overflowY = await optionsContainer.evaluate((el) =>
    getComputedStyle(el).overflowY,
  );

  // PR-2c: options region must scroll independently; before impl may be 'visible' → RED.
  expect(
    ["auto", "scroll"].includes(overflowY),
    `AC2c: options container overflow-y must be 'auto' or 'scroll'; got '${overflowY}'`,
  ).toBe(true);
});
