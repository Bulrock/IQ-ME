// tests/playwright/pr4-submit-finalizes.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-4 — AC6: On the final (16th) item the primary action button
// reads "Submit test"; activating it — including with unanswered items —
// finalizes the session, routes to /#/result, and never resets to the landing
// page. Unanswered items are handled deterministically by the scoring path.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

/**
 * Position the SPA on the final (16th) item by driving the real item-runner UI.
 *
 * The item-runner's Next control (#next-btn) is never disabled — an answer is
 * optional — so we reach the final item purely by clicking Next, leaving every
 * item unanswered. This is the exact "unanswered" path PR-4 must finalize.
 * (We deliberately do NOT depend on a setItem test-hook: it isn't part of the
 * window.__IQME_TEST__ surface, and driving the working UI keeps the test
 * failing for the right reason — the AC6 gap, not missing scaffolding.)
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} origin
 */
async function driveToFinalItem(page, origin) {
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  // Fresh session, then enter the item-runner at item 1.
  await page.evaluate(() => {
    window.__IQME_TEST__.resetState();
    window.__IQME_TEST__.navigate("test");
  });
  await expect(page.locator(".item-runner")).toBeVisible();

  const progress = page.locator('[data-testid="progress-indicator"]');
  await expect(progress).toHaveText("Item 1 of 16");

  // Advance items 1 → 16 via Next; await each transition by the progress text
  // (event-driven web-first assertion — no fixed waits).
  for (let n = 2; n <= 16; n++) {
    await page.locator("#next-btn").click();
    await expect(progress).toHaveText(`Item ${n} of 16`);
  }
}

test("AC6: final item primary action button reads 'Submit test'", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToFinalItem(page, origin);

  // On item 16 the primary action (#next-btn) must read "Submit test", not
  // "Next" and not the current "Submit". PR-4 changes the i18n submitButton
  // string across EN/RU/PL; before impl the EN string is "Submit" → RED.
  const submitBtn = page.locator("#next-btn");
  await expect(submitBtn, "AC6: primary action visible on final item").toBeVisible();
  await expect(submitBtn, "AC6: final-item button text must read 'Submit test'").toHaveText("Submit test");
});

test("AC6: Submit with an answer selected routes to /#/result (no landing reset)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToFinalItem(page, origin);

  // Answer the final item, then submit.
  const firstOption = page.locator(".item-runner__option").first();
  await firstOption.waitFor({ state: "visible" });
  await firstOption.click();

  await page.locator("#next-btn").click();

  // Must settle on /#/result — never bounce back to landing. (The current bug:
  // result.render() bounces to "#/" when responses.length !== 16, so this is
  // RED until PR-4 makes the scoring path handle unanswered items.)
  await expect(page, "AC6: Submit must route to /#/result").toHaveURL(/#\/result$/, { timeout: 7000 });
  await expect(
    page.locator('[data-reveal-stage="anchor"]'),
    "AC6: result scene (pre-reveal) must render after Submit",
  ).toBeVisible();
  await expect(page.locator(".landing"), "AC6: landing must NOT appear after Submit").toBeHidden();
});

test("AC6: Submit with an UNANSWERED final item still finalizes to /#/result", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToFinalItem(page, origin);

  // Do NOT select any option — submit a fully-unanswered session.
  // PR-4 spec: "activating it — including with unanswered items — finalizes".
  await page.locator("#next-btn").click();

  await expect(page, "AC6: unanswered Submit must route to /#/result").toHaveURL(/#\/result$/, { timeout: 7000 });
  await expect(
    page.locator('[data-reveal-stage="anchor"]'),
    "AC6: result scene must render even with unanswered items",
  ).toBeVisible();
  await expect(page.locator(".landing"), "AC6: landing must NOT appear after unanswered Submit").toBeHidden();
});

test("AC6: scoring path handles a fully-unanswered session deterministically", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await driveToFinalItem(page, origin);

  // Submit with zero answers, then reveal the score. The scoring path must
  // produce a result (not crash or bounce to landing) — AC6: "Unanswered items
  // are handled deterministically by the scoring path."
  await page.locator("#next-btn").click();
  await expect(page, "AC6: unanswered Submit must route to /#/result").toHaveURL(/#\/result$/, { timeout: 7000 });

  await page.getByRole("button", { name: /show me/i }).click();
  await expect(
    page.locator(".score-panel"),
    "AC6: score-panel must render for an all-unanswered session",
  ).toBeVisible();
  await expect(page.locator(".landing"), "AC6: must not reset to landing during scoring").toBeHidden();
});
