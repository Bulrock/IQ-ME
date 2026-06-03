// tests/playwright/asymmetric-tail-scenes.spec.mjs
//
// Story 6.5 AC-9 — Playwright assertion for the asymmetric tail-scene
// composition (UX-DR23/24/25/26; FR19 EN; FR20 EN; UX Innovation #5).
//
// Test cohort (5 + 2 skipped):
//   Test 1 — mid-band:    .tail-scene--mid-band rendered; no silent-companion-line; no crisis-resources.
//   Test 2 — bottom:      .tail-scene--bottom-decile + .silent-companion-line + .tail-scene__crisis-resources (≥3 entries).
//   Test 3 — top:         .tail-scene--top-decile; no silent-companion-line; no crisis-resources; no share-affordance.
//   Test 4 — reveal-stage gate: .tail-scene hidden pre-handoff, visible post-handoff.
//   Test 5 — zero-third-party: no non-same-origin request during bottom-decile render path.
//
// Driving pattern mirrors tests/playwright/difficulty-sentence.spec.mjs
// (Story 6.2). Deciles forced via deterministic response patterns:
//   - all 0s   → low theta → P ≤ 10  (bottom)
//   - all 1s   → high theta → P ≥ 90 (top)
//   - i%2      → ~half correct → P ≈ 50 (mid)
//
// EN only; RU/PL slots reserved via test.skip — Epic 7.

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

async function driveToResultScene(page, { origin, responseFn }) {
  await page.setViewportSize({ width: 1280, height: 800 });
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
}

// ── Test 1: mid-band ───────────────────────────────────────────────────
test("AC-9 Test 1: mid-band session renders .tail-scene--mid-band; no silent-companion-line; no crisis-resources", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin, responseFn: (i) => i % 2 });
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();

  await expect(page.locator(".score-panel.score-panel--mid-band")).toBeVisible();
  await expect(page.locator(".tail-scene.tail-scene--mid-band")).toBeVisible();

  // silent-companion-line is ABSENT from DOM (asymmetric-care marker on bottom only).
  expect(await page.locator(".silent-companion-line").count()).toBe(0);
  // crisis-resources NOT loaded for mid-band (per AC-7 lazy-fetch contract).
  expect(await page.locator(".tail-scene__crisis-resources").count()).toBe(0);
});

// ── Test 2: bottom-decile ──────────────────────────────────────────────
test("AC-9 Test 2: bottom-decile session renders .tail-scene--bottom-decile + .silent-companion-line + crisis-resources (≥3 entries)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin, responseFn: () => 0 });
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();

  await expect(page.locator(".score-panel.score-panel--bottom-decile")).toBeVisible();
  await expect(page.locator(".tail-scene.tail-scene--bottom-decile")).toBeVisible();

  // silent-companion-line is present in DOM (one <p>) and visible.
  const scl = page.locator(".silent-companion-line");
  await expect(scl).toBeVisible();
  expect(await scl.count()).toBe(1);

  // crisis-resources block present with ≥3 entries.
  const crisis = page.locator(".tail-scene__crisis-resources");
  await expect(crisis).toBeVisible();
  const links = page.locator(".tail-scene__crisis-resources .crisis-resource-link");
  const count = await links.count();
  expect(count, "must have ≥3 crisis-resource entries").toBeGreaterThanOrEqual(3);
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute("href");
    expect(href, `link ${i} href must be tel: or https:`).toMatch(/^(https?:|tel:)/);
  }
});

// ── Test 3: top-decile ─────────────────────────────────────────────────
test("AC-9 Test 3: top-decile session renders .tail-scene--top-decile; no silent-companion-line; no crisis-resources; no share-affordance", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin, responseFn: () => 1 });
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();

  await expect(page.locator(".score-panel.score-panel--top-decile")).toBeVisible();
  await expect(page.locator(".tail-scene.tail-scene--top-decile")).toBeVisible();

  expect(await page.locator(".silent-companion-line").count()).toBe(0);
  expect(await page.locator(".tail-scene__crisis-resources").count()).toBe(0);

  // FR25 negative-assertion narrow to top-decile composition.
  expect(await page.locator(".share-button, [data-share], .nav-share").count()).toBe(0);
});

// ── Test 4: reveal-stage visibility gate ───────────────────────────────
test("AC-9 Test 4: .tail-scene is hidden before Show-Me (pre-handoff) and visible after", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin, responseFn: (i) => i % 2 });

  // Before Show-Me click: .tail-scene element does not exist (the panel() template
  // renders only after Show-Me — same pattern as the difficulty sentence per
  // Story 6.2 precedent). count === 0 captures "unreachable" semantics.
  expect(await page.locator(".tail-scene").count()).toBe(0);

  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();
  // After Show-Me: .tail-scene is in DOM AND visible (the reveal-stage burst
  // fires anchor→band→interval→context→tail-scene→methodology-handoff in
  // result.js; CSS gate reveals at tail-scene + methodology-handoff stages).
  await expect(page.locator(".tail-scene")).toBeVisible();
});

// ── Test 5: zero-third-party invariant during bottom-decile render ─────
test("AC-9 Test 5 + AC-15: zero-third-party requests during bottom-decile render path", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  const sameOriginPrefix = origin;
  const thirdPartyRequests = [];

  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (!url.startsWith(sameOriginPrefix) && !url.startsWith("data:") && !url.startsWith("blob:")) {
      thirdPartyRequests.push(url);
    }
    return route.continue();
  });

  await driveToResultScene(page, { origin, responseFn: () => 0 });
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".tail-scene--bottom-decile")).toBeVisible();
  await expect(page.locator(".tail-scene__crisis-resources")).toBeVisible();

  expect(
    thirdPartyRequests,
    `bottom-decile render must not hit any third-party origin; got: ${JSON.stringify(thirdPartyRequests)}`,
  ).toHaveLength(0);
});

// ── Reserved RU/PL slots (Epic 7) ──────────────────────────────────────
test.skip("AC-9: asymmetric tail-scene — RU (added in Epic 7)", async () => {
  // Reserved — clinical-register RU tail-scene copy lands in Story 7.6.
});
test.skip("AC-9: asymmetric tail-scene — PL (added in Epic 7)", async () => {
  // Reserved — clinical-register PL tail-scene copy lands in Story 7.6.
});
