// tests/playwright/mid-session-bail-out.spec.mjs
//
// Story 6.3 AC-8 — Full mid-session bail-out cycle exercised end-to-end
// in a real browser. Drives the SPA from landing → consent → item-runner,
// advances to item 5 via the test-hook seed-and-record-response surface
// established in Story 3.7 (`window.__IQME_TEST__`), and exercises the
// three observable bail-out paths:
//
//   1. open → Escape → state preserved (panel hidden, focus restored,
//      responses retained).
//   2. open → Discard → state reset + landing route + ZERO localStorage
//      writes during the entire cycle.
//   3. open → Continue → panel closed, focus restored, session intact.
//
// FR4 (mid-session bail with discard-or-continue, no silent partial
// scoring) + NFR9 (opt-in storage discipline — no localStorage writes
// during the bail cycle).
//
// Engineer choice (`hidden` attribute vs `data-bail-state="open|closed"`
// on the `.item-runner` section) is verified through Playwright's
// `toBeVisible()` / `toBeHidden()` predicates which observe computed
// style — both encodings produce the same observable outcome.
//
// EN only at this epic; RU/PL slots reserved via test.skip (Epic 7).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const SEED = "0123456789abcdef0123456789abcdef";
const ITEM_RUNNER_SELECTOR = ".item-runner";
const BAIL_AFFORDANCE_SELECTOR = ".item-runner__bail-affordance";
const BAIL_PANEL_SELECTOR = ".item-runner__bail-panel";
const BAIL_DISCARD_SELECTOR = ".item-runner__bail-discard";
const BAIL_CONTINUE_SELECTOR = ".item-runner__bail-continue";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

/**
 * Drive to item-runner with 4 responses recorded (so we are at item 5
 * with prior responses, mirroring the spec text "advance to item 5"). We
 * use the deterministic test-hook surface — physical 16-click navigation
 * is out of scope for this assertion and slows the test by 30+s. The
 * test-hook surface itself is exercised by the seeded session driving
 * pattern from `tests/playwright/difficulty-sentence.spec.mjs`.
 *
 * Also installs a `Storage.prototype.setItem` spy BEFORE navigation so
 * the AC-4 (d) no-write assertion has a complete call log.
 */
async function driveToItemRunnerAt5(page, { origin }) {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Install Storage.prototype.setItem spy BEFORE first navigation. This
  // way every setItem call across the whole test page lifetime is
  // recorded — the FR4 / NFR9 invariant is global, not just for the bail
  // cycle. The bail-out cycle assertion compares the spy's length pre vs
  // post.
  await page.addInitScript(() => {
    window.__setItemCalls = [];
    const proto = Storage.prototype;
    const orig = proto.setItem;
    proto.setItem = function (k, v) {
      window.__setItemCalls.push([k, v]);
      return orig.call(this, k, v);
    };
  });

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  // Seed + record 4 responses + set currentItem=4 (zero-indexed item-5)
  // + navigate to #/test. This mirrors the driving pattern in
  // tests/playwright/difficulty-sentence.spec.mjs.
  await page.evaluate(() => window.__IQME_TEST__.resetState());
  await page.evaluate((seed) => {
    window.__IQME_TEST__.setSeed(seed);
    for (let i = 0; i < 4; i++) {
      window.__IQME_TEST__.recordResponse(i, i % 2);
    }
    window.__IQME_TEST__.navigate("test");
  }, SEED);

  await expect(page.locator(ITEM_RUNNER_SELECTOR)).toBeVisible();
  await expect(page.locator(BAIL_AFFORDANCE_SELECTOR)).toBeVisible();
}

// ────────────────────────────────────────────────────────────────────────
// Test 1 — open + Escape preserves session state
// ────────────────────────────────────────────────────────────────────────

test("AC-8: bail affordance opens panel, focuses Continue, Escape closes + restores focus + preserves responses", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToItemRunnerAt5(page, { origin });

  const responsesBefore = await page.evaluate(() => window.__IQME_TEST__.getState().responses.length);
  expect(responsesBefore, "precondition: 4 responses recorded before bail").toBe(4);

  // Open the panel.
  await page.locator(BAIL_AFFORDANCE_SELECTOR).click();
  await expect(page.locator(BAIL_PANEL_SELECTOR)).toBeVisible();
  // Continue should be focused on open (AC-2 / AC-9.d).
  const continueIsFocused = await page.locator(BAIL_CONTINUE_SELECTOR).evaluate((el) => el === document.activeElement);
  expect(continueIsFocused, "Continue button must receive focus when panel opens").toBe(true);

  // Press Escape → panel closes + focus returns to affordance.
  await page.keyboard.press("Escape");
  await expect(page.locator(BAIL_PANEL_SELECTOR)).toBeHidden();
  const affordanceIsFocused = await page.locator(BAIL_AFFORDANCE_SELECTOR).evaluate((el) => el === document.activeElement);
  expect(affordanceIsFocused, "Focus must return to bail affordance after Escape").toBe(true);

  // State preserved — 4 responses still recorded.
  const responsesAfter = await page.evaluate(() => window.__IQME_TEST__.getState().responses.length);
  expect(responsesAfter, "Escape must preserve responses (state unchanged)").toBe(4);

  // Item-runner still visible.
  await expect(page.locator(ITEM_RUNNER_SELECTOR)).toBeVisible();
});

// ────────────────────────────────────────────────────────────────────────
// Test 2 — Discard resets state + navigates to landing + zero localStorage
// ────────────────────────────────────────────────────────────────────────

test("AC-8: Discard resets state, unmounts item-runner, lands on landing, calls localStorage.setItem ZERO times during the cycle", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToItemRunnerAt5(page, { origin });

  // Sample the setItem call-count just before opening the bail panel —
  // any setItem calls fired BEFORE bail (e.g. by the test-hook init) are
  // out of scope for the AC-4 (d) invariant. We assert the bail-cycle
  // delta is exactly zero.
  const setItemCountBeforeBail = await page.evaluate(() => window.__setItemCalls.length);

  // Open panel.
  await page.locator(BAIL_AFFORDANCE_SELECTOR).click();
  await expect(page.locator(BAIL_PANEL_SELECTOR)).toBeVisible();

  // Click Discard.
  await page.locator(BAIL_DISCARD_SELECTOR).click();

  // Item-runner removed; landing visible.
  await expect(page.locator(ITEM_RUNNER_SELECTOR)).toHaveCount(0);
  await expect(page.locator(".landing")).toBeVisible();

  // URL hash is the landing route. routing.navigate("") normalises to
  // "#/" per routing.js — we accept either.
  await expect(page).toHaveURL(/#\/?$|\?test=1$/);

  // No localStorage write during the bail cycle.
  const setItemCountAfter = await page.evaluate(() => window.__setItemCalls.length);
  expect(
    setItemCountAfter - setItemCountBeforeBail,
    `bail-out cycle must call Storage.prototype.setItem ZERO times; observed ${setItemCountAfter - setItemCountBeforeBail} calls: ${JSON.stringify(await page.evaluate(() => window.__setItemCalls))}`,
  ).toBe(0);

  // Fresh state shape via test-hook (Story 6.1 precedent).
  const post = await page.evaluate(() => window.__IQME_TEST__.getState());
  expect(post.currentItem, "post-Discard currentItem must be 0").toBe(0);
  expect(post.responses, "post-Discard responses must be empty").toEqual([]);
  expect(post.startedAt, "post-Discard startedAt must be 0 (freshState seed)").toBe(0);
  expect(post.locale, "post-Discard locale must be 'en'").toBe("en");
  expect(post.seed, "post-Discard seed must be 32-zeros (INITIAL_SEED)").toBe("0".repeat(32));
});

// ────────────────────────────────────────────────────────────────────────
// Test 3 — Continue resumes session on the same item with responses intact
// ────────────────────────────────────────────────────────────────────────

test("AC-8: Continue closes panel and resumes the session on the same item with prior responses intact", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToItemRunnerAt5(page, { origin });

  const currentItemBefore = await page.evaluate(() => window.__IQME_TEST__.getState().currentItem);
  const responsesBefore = await page.evaluate(() => window.__IQME_TEST__.getState().responses);

  await page.locator(BAIL_AFFORDANCE_SELECTOR).click();
  await expect(page.locator(BAIL_PANEL_SELECTOR)).toBeVisible();

  await page.locator(BAIL_CONTINUE_SELECTOR).click();
  await expect(page.locator(BAIL_PANEL_SELECTOR)).toBeHidden();

  // Item-runner still visible on the same item.
  await expect(page.locator(ITEM_RUNNER_SELECTOR)).toBeVisible();

  const currentItemAfter = await page.evaluate(() => window.__IQME_TEST__.getState().currentItem);
  const responsesAfter = await page.evaluate(() => window.__IQME_TEST__.getState().responses);
  expect(currentItemAfter, "Continue must NOT change currentItem").toBe(currentItemBefore);
  expect(responsesAfter, "Continue must NOT mutate responses").toEqual(responsesBefore);

  // Focus restored to the affordance (same contract as Escape per AC-3).
  const affordanceIsFocused = await page.locator(BAIL_AFFORDANCE_SELECTOR).evaluate((el) => el === document.activeElement);
  expect(affordanceIsFocused, "Focus must return to bail affordance after Continue").toBe(true);
});

// ────────────────────────────────────────────────────────────────────────
// RU/PL reserved slots — Epic 7 owns locale parity (per spec AC-7/AC-8)
// ────────────────────────────────────────────────────────────────────────

// Symbolic Epic-7 marker — RU/PL translation parity deferred.
test.skip("AC-8: mid-session bail-out — RU (added in Epic 7)", async () => {
  // Reserved — locale parity slot lands in Epic 7.
});
test.skip("AC-8: mid-session bail-out — PL (added in Epic 7)", async () => {
  // Reserved — locale parity slot lands in Epic 7.
});
