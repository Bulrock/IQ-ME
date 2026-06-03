// tests/playwright/tear-edge-overlay.spec.mjs
//
// Story 6.6 AC-1/AC-2/AC-3 — the top-decile score-panel renders a decorative
// `.score-panel__tear-edge` SVG overlay whose bounding box straddles the seam
// between the caveat and the score triplet (UX-DR25, FR24, UX Innovation #4).
// The overlap invariant must hold at every viewport width 320→1440px so a clean
// decontextualized score-only screenshot is impossible without catching the tear.
//
// Driving harness mirrors tests/playwright/asymmetric-tail-scenes.spec.mjs:
//   all-1 responses → P ≥ 90 → top-decile; i%2 → mid; all-0 → bottom.

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

async function driveToResultScene(page, { origin, responseFn, width = 1280, height = 800 }) {
  await page.setViewportSize({ width, height });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(() => window.__IQME_TEST__.resetState());
  await page.evaluate(
    ({ seed, responses }) => {
      window.__IQME_TEST__.setSeed(seed);
      for (let i = 0; i < 16; i++) {
        window.__IQME_TEST__.recordResponse(i, responses[i]);
      }
      window.__IQME_TEST__.navigate("result");
    },
    { seed: SEED, responses: Array.from({ length: 16 }, (_, i) => responseFn(i)) },
  );
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();
}

// AABB intersection: ranges overlap on both axes (touching edges do not count).
function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// ── Test 1: presence + decorative ──────────────────────────────────────────
test("AC-1 Test 1: top-decile renders exactly one decorative .score-panel__tear-edge <svg>", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin, responseFn: () => 1 });

  await expect(page.locator(".score-panel.score-panel--top-decile")).toBeVisible();
  const tear = page.locator(".score-panel--top-decile .score-panel__tear-edge");
  expect(await tear.count()).toBe(1);

  // It is an <svg> and decorative (aria-hidden, not focusable, not in tab order).
  const tag = await tear.evaluate((el) => el.tagName.toLowerCase());
  expect(tag).toBe("svg");
  expect(await tear.getAttribute("aria-hidden")).toBe("true");
  const tabindex = await tear.getAttribute("tabindex");
  expect(tabindex === null || tabindex === undefined).toBeTruthy();
});

// ── Test 2: bbox overlap at the caveat↔score seam ──────────────────────────
test("AC-3 Test 2: tear-edge bbox overlaps the caveat bbox AND dips past the triplet top", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin, responseFn: () => 1 });

  const tear = await page.locator(".score-panel--top-decile .score-panel__tear-edge").boundingBox();
  const caveat = await page.locator(".score-panel--top-decile .score-panel__caveat").boundingBox();
  const triplet = await page.locator(".score-panel--top-decile .score-panel__triplet").boundingBox();
  expect(tear, "tear-edge has a bounding box").not.toBeNull();
  expect(caveat).not.toBeNull();
  expect(triplet).not.toBeNull();

  expect(intersects(tear, caveat), "tear-edge bbox intersects caveat bbox").toBeTruthy();
  expect(tear.y + tear.height, "tear-edge dips below the triplet top edge").toBeGreaterThan(triplet.y);
});

// ── Test 3: invariant holds across the 320→1440 viewport sweep ──────────────
for (const width of [320, 768, 1440]) {
  test(`AC-3 Test 3: overlap invariant holds at viewport width ${width}px`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await driveToResultScene(page, { origin, responseFn: () => 1, width, height: 800 });

    const tear = await page.locator(".score-panel--top-decile .score-panel__tear-edge").boundingBox();
    const caveat = await page.locator(".score-panel--top-decile .score-panel__caveat").boundingBox();
    const triplet = await page.locator(".score-panel--top-decile .score-panel__triplet").boundingBox();

    expect(intersects(tear, caveat), `tear∩caveat @${width}px`).toBeTruthy();
    expect(tear.y + tear.height, `tear dips past triplet top @${width}px`).toBeGreaterThan(triplet.y);
  });
}

// ── Test 4: absent for non-top variants ────────────────────────────────────
test("AC-1 Test 4: mid-band and bottom-decile panels render NO tear-edge overlay", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;

  await driveToResultScene(page, { origin, responseFn: (i) => i % 2 });
  await expect(page.locator(".score-panel.score-panel--mid-band")).toBeVisible();
  expect(await page.locator(".score-panel__tear-edge").count()).toBe(0);

  await driveToResultScene(page, { origin, responseFn: () => 0 });
  await expect(page.locator(".score-panel.score-panel--bottom-decile")).toBeVisible();
  expect(await page.locator(".score-panel__tear-edge").count()).toBe(0);
});

// ── Test 5: screenshot evidence (human-auditable artifact) ──────────────────
test("AC-3 Test 5: top-decile composition screenshot captured for review", async ({ page }, testInfo) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin, responseFn: () => 1 });
  const png = await page.locator(".score-panel--top-decile").screenshot();
  await testInfo.attach("top-decile-tear-edge", { body: png, contentType: "image/png" });
  expect(png.length).toBeGreaterThan(0);
});
