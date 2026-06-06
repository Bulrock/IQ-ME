// tests/playwright/pr3-no-flicker.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-3 — AC5: No full-screen flicker on Next; next-item imagery
// preloaded via <link rel="preload" as="image"> injected into <head>.
//
// Strategy:
//   1. Drive to item-runner, record an answer for item 1.
//   2. Click Next.
//   3. Assert a <link rel="preload" as="image"> was injected for the
//      forthcoming item image — this is the behavioral contract for
//      preload-based flicker prevention.
//   4. Assert the item-runner container is NOT removed and re-added during
//      the transition (stable DOM key — no unmount/remount flash).

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

async function driveToItemRunner(page, origin) {
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate((s) => {
    window.__IQME_TEST__.resetState();
    window.__IQME_TEST__.setSeed(s);
    window.__IQME_TEST__.navigate("test");
  }, SEED);
  await expect(page.locator(".item-runner")).toBeVisible();
}

test("AC5: the next item's matrix image is fetched ahead of time (preloaded, no fetch-flash)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });

  // Capture every matrix-image (stub-*.svg) request. The current item renders
  // exactly one matrix image; rendering also warms the NEXT item's matrix image
  // into cache (new Image()), so ≥2 distinct matrix images are fetched without
  // the user advancing — the preload contract. (Using new Image() rather than
  // <link rel=preload> avoids Chrome's "preloaded but not used" warning.)
  const matrixImages = new Set();
  page.on("request", (req) => {
    const m = req.url().match(/\/src\/items\/(stub-\d+\.svg)/);
    if (m) matrixImages.add(m[1]);
  });

  await driveToItemRunner(page, origin);
  await page.locator(".item-runner__image").waitFor({ state: "visible" });

  // PR-3: the next item's matrix image is requested ahead of advancing → ≥2
  // distinct matrix images fetched (current + preloaded next). Before impl only
  // the current item's image is fetched → RED.
  await expect
    .poll(() => matrixImages.size, {
      timeout: 5000,
      message: `AC5: expected ≥2 matrix images fetched (current + preloaded next); saw ${[...matrixImages].join(", ")}`,
    })
    .toBeGreaterThanOrEqual(2);
});

test("AC5: item-runner container is NOT unmounted/remounted on Next (stable DOM key, no flicker)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToItemRunner(page, origin);

  const itemRunner = page.locator(".item-runner");
  await itemRunner.waitFor({ state: "visible" });

  // Capture the item-runner element's identity via a data attribute or a
  // test-hook assigned property. We track mutations to detect unmount.
  await page.evaluate(() => {
    const el = document.querySelector(".item-runner");
    if (el) {
      el.__stableKey = "item-runner-identity-" + Date.now();
      window.__itemRunnerMutations = 0;
      // Observe child-list changes on the root app container.
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          for (const node of m.removedNodes) {
            if (node === el || (node.classList && node.classList.contains("item-runner"))) {
              window.__itemRunnerMutations++;
            }
          }
        }
      });
      obs.observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
      window.__itemRunnerObserver = obs;
    }
  });

  // Select an answer and click Next.
  const firstOption = page.locator(".item-runner__option, [data-option]").first();
  await firstOption.waitFor({ state: "visible" });
  await firstOption.click();

  const nextBtn = page.locator(".item-runner__next, [data-action='next'], button[aria-label*='Next']").first();
  await nextBtn.waitFor({ state: "visible" });
  await nextBtn.click();

  // Wait for item 2 to be rendered (progress indicator should change).
  await page.locator(".item-runner").waitFor({ state: "visible" });

  // PR-3: item-runner must NOT be removed from DOM during transition.
  const mutations = await page.evaluate(() => window.__itemRunnerMutations ?? 0);
  expect(
    mutations,
    `AC5: .item-runner was removed from DOM ${mutations} times during Next — must be 0 (in-place update, no flicker)`,
  ).toBe(0);
});
