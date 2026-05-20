// tests/playwright/difficulty-sentence.spec.mjs
//
// Story 6.2 AC-8 — Playwright assertion for the FR22 per-item-difficulty
// breakdown sentence on the score panel.
//
// Asserts:
//   - .score-panel__difficulty-sentence exists in the DOM after Show-Me
//     burst (post-Story-6.1 5-beat dispatch).
//   - It is HIDDEN (display=none) at the anchor beat (pre-Show-Me).
//   - It is VISIBLE (display=block) after Show-Me reaches the context beat.
//   - Computed font-size is 16px (= --font-size-200 per UX-DR3).
//   - The rendered text matches the expected template shape:
//     "Of the {hardN} hard, {medN} medium, and {easyN} easy items,
//      you answered {hardCorrect} / {hardN}, {medCorrect} / {medN},
//      and {easyCorrect} / {easyN} correctly."
//   - For the v1 stub pool the band totals sum to 16 (5/6/5) and each
//     correct-count is bounded by its band total.
//
// EN only; RU/PL slots reserved via test.skip — Epic 7 Story 7.x.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const DIFFICULTY_SENTENCE_SELECTOR = ".score-panel__difficulty-sentence";
const EXPECTED_FONT_SIZE_PX = 16;
const SEED = "0123456789abcdef0123456789abcdef";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

async function driveToResultScene(page, { origin }) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(() => window.__IQME_TEST__.resetState());
  await page.evaluate((seed) => {
    window.__IQME_TEST__.setSeed(seed);
    for (let i = 0; i < 16; i++) {
      window.__IQME_TEST__.recordResponse(i, i % 2);
    }
    window.__IQME_TEST__.navigate("result");
  }, SEED);
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
}

test("AC-8: difficulty sentence is hidden at the anchor beat (pre-Show-Me)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin });
  // The element does not exist yet at the anchor beat (the panel() template
  // renders only after Show-Me). Asserting count===0 captures the "hidden
  // from the test-taker" semantics directly — the sentence is unreachable.
  const count = await page.locator(DIFFICULTY_SENTENCE_SELECTOR).count();
  expect(count, "difficulty sentence must not be reachable before Show-Me").toBe(0);
});

test("AC-8: difficulty sentence is visible after Show-Me + has --font-size-200 (16px)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin });
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();
  const sentence = page.locator(DIFFICULTY_SENTENCE_SELECTOR);
  await expect(sentence).toBeVisible();
  const fontSize = await sentence.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
  expect(fontSize, "difficulty sentence font-size must be 16px (--font-size-200)").toBe(EXPECTED_FONT_SIZE_PX);
});

test("AC-8: difficulty sentence text matches the FR22 template + counts are coherent", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin });
  await page.getByRole("button", { name: /show me/i }).click();
  const sentence = page.locator(DIFFICULTY_SENTENCE_SELECTOR);
  await expect(sentence).toBeVisible();
  const text = (await sentence.textContent()) ?? "";
  // Match the template's literal anchors + capture the 6 numbers.
  const re = /Of the (\d+) hard, (\d+) medium, and (\d+) easy items, you answered (\d+) \/ (\d+), (\d+) \/ (\d+), and (\d+) \/ (\d+) correctly\./;
  const m = text.match(re);
  expect(m, `difficulty sentence text must match FR22 template; got: ${JSON.stringify(text)}`).not.toBeNull();
  const [, hardN, medN, easyN, hardCorrect, hardN2, medCorrect, medN2, easyCorrect, easyN2] = m.map((x) => Number(x));
  // Template self-consistency: the {hardN} mentions are the same number.
  expect(hardN, "hardN appears twice and must be consistent").toBe(hardN2);
  expect(medN, "medN appears twice and must be consistent").toBe(medN2);
  expect(easyN, "easyN appears twice and must be consistent").toBe(easyN2);
  // v1 stub pool partitions into 5 easy / 6 medium / 5 hard. We answered
  // all 16 items, so totals must equal the band sizes exactly.
  expect(hardN, "v1 pool has exactly 5 hard items").toBe(5);
  expect(medN, "v1 pool has exactly 6 medium items").toBe(6);
  expect(easyN, "v1 pool has exactly 5 easy items").toBe(5);
  // Correct counts must be in [0, total] per band.
  expect(hardCorrect).toBeGreaterThanOrEqual(0);
  expect(hardCorrect).toBeLessThanOrEqual(hardN);
  expect(medCorrect).toBeGreaterThanOrEqual(0);
  expect(medCorrect).toBeLessThanOrEqual(medN);
  expect(easyCorrect).toBeGreaterThanOrEqual(0);
  expect(easyCorrect).toBeLessThanOrEqual(easyN);
  // We responded with `i % 2` for i=0..15 → exactly 8 correct overall.
  expect(hardCorrect + medCorrect + easyCorrect, "alternating 0/1 responses produce exactly 8 'correct' across all bands").toBe(8);
});

test("AC-8: difficulty sentence carries an aria-label (a11y)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToResultScene(page, { origin });
  await page.getByRole("button", { name: /show me/i }).click();
  const sentence = page.locator(DIFFICULTY_SENTENCE_SELECTOR);
  await expect(sentence).toBeVisible();
  const ariaLabel = await sentence.getAttribute("aria-label");
  expect(ariaLabel, "difficulty sentence must expose an aria-label for screen readers").toBeTruthy();
});

// ─── RU/PL reserved slots (Epic 7) ─────────────────────────────────────────

test.skip("AC-8: difficulty sentence — RU (added in Epic 7)", async () => {
  // Reserved — locale parity slot lands in Epic 7.
});
test.skip("AC-8: difficulty sentence — PL (added in Epic 7)", async () => {
  // Reserved — locale parity slot lands in Epic 7.
});
