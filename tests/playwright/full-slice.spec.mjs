// tests/playwright/full-slice.spec.mjs
//
// Story 3.7 — STRICT zero-third-party network-trace against the FULL live
// vertical slice (landing → consent → 16-item session → reveal → handoff
// click → methodology stub page). Complements Story 1.7's baseline spec
// (network-trace.spec.mjs) which exercises the contract on a minimal fixture.
//
// Drives the SPA via window.__IQME_TEST__ (Story 3-7 test-hook surface)
// activated by ?test=1 query param. The 16-item session is seeded
// deterministically and responses are recorded directly via the hook —
// avoiding 30+s of physical click-through and Playwright race conditions.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

// Must match tests/playwright/network-trace.spec.mjs FORBIDDEN_DOMAINS.
const FORBIDDEN_DOMAINS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
  "unpkg.com",
  "plausible.io",
  "goatcounter.com",
  "sentry.io",
  "mixpanel.com",
  "posthog.com",
  "googletagmanager.com",
  "google-analytics.com",
];

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

test("full-slice: zero third-party requests across the full happy-path", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  const requests = [];
  page.on("request", (req) => {
    requests.push(req.url());
  });

  // Wrap localStorage.setItem so we can prove NFR9 (no writes pre-opt-in).
  await page.addInitScript(() => {
    window.__LS_CALLS__ = [];
    const orig = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = (...args) => {
      window.__LS_CALLS__.push(args);
      return orig(...args);
    };
  });

  // Landing scene.
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  // Skip consent dwell-gate via test-hook navigate; the gate is FR12
  // behavior (out of scope for network-trace).
  await page.evaluate(() => window.__IQME_TEST__.resetState());
  await page.evaluate(() => {
    window.__IQME_TEST__.setSeed("0123456789abcdef0123456789abcdef");
    for (let i = 0; i < 16; i++) {
      window.__IQME_TEST__.recordResponse(i, i % 2);
    }
    window.__IQME_TEST__.navigate("result");
  });

  // Result scene: pre-reveal beat, then click "Show me" for handoff.
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();
  await expect(page.locator(".score-panel__percentile")).toBeVisible();
  await expect(page.locator(".score-panel__anchor")).toBeVisible();
  await expect(page.locator(".score-panel__band")).toBeVisible();

  // Methodology-handoff click → real navigation to Story-3-6 emitted page.
  await Promise.all([
    page.waitForURL("**/methodology/v0.1.0/en/scoring/percentile-to-iq/**"),
    page.locator(".score-panel__percentile").click(),
  ]);
  await expect(page.locator("title")).toHaveText(/percentile/i);

  // ─── Assertions ──────────────────────────────────────────────────────

  const targetUrl = new URL(origin);
  const httpRequests = requests.filter((u) => /^https?:\/\//i.test(u));

  // Non-same-origin filter.
  const offOrigin = httpRequests.filter((u) => {
    try {
      return new URL(u).host !== targetUrl.host;
    } catch {
      return true;
    }
  });
  expect(
    offOrigin,
    `Non-same-origin requests detected (target host=${targetUrl.host}):\n  ${offOrigin.join("\n  ")}`,
  ).toEqual([]);

  // FORBIDDEN_DOMAINS filter.
  const forbiddenHits = requests.filter((u) => {
    try {
      const host = new URL(u).host.toLowerCase();
      return FORBIDDEN_DOMAINS.some((bad) => host === bad || host.endsWith("." + bad));
    } catch {
      return false;
    }
  });
  expect(
    forbiddenHits,
    `Requests to FORBIDDEN_DOMAINS detected:\n  ${forbiddenHits.join("\n  ")}`,
  ).toEqual([]);

  // localStorage.setItem must NOT have been called.
  const lsCalls = await page.evaluate(() => window.__LS_CALLS__);
  expect(
    lsCalls,
    `localStorage.setItem must not be called pre-opt-in; got: ${JSON.stringify(lsCalls)}`,
  ).toEqual([]);
});
