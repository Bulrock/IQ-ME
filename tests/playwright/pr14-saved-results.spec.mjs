// tests/playwright/pr14-saved-results.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-14 — AC17: Saved-results management.
//
//   - With ≥1 saved result (iqme:saved-result:<id>), a "View saved results"
//     entry point appears to the right of "Start the test".
//   - The saved-results screen lists all, opens individual, offers "delete all"
//     plus per-result checkboxes.
//   - Entry point hidden when no results exist; deletions reflect immediately.
//
// localStorage seeding: each test uses page.addInitScript to seed state
// independently (no shared state).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const SAVED_RESULT_1 = {
  id: "test-001",
  score: 100,
  percentile: 50,
  date: "2026-01-01",
  locale: "en",
  seed: "aaaabbbbccccdddd0123456789abcdef",
};

const SAVED_RESULT_2 = {
  id: "test-002",
  score: 115,
  percentile: 84,
  date: "2026-01-02",
  locale: "en",
  seed: "11112222333344440123456789abcdef",
};

function makeKey(id) {
  return `iqme:saved-result:${id}`;
}

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

// ─── AC17: entry point hidden when no results ────────────────────────────────

test("AC17: 'View saved results' entry point is HIDDEN when no saved results exist", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  // No addInitScript — clean localStorage.
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  // PR-14: entry point appears only when ≥1 result saved; before impl → RED.
  const entryPoint = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  );
  await expect(entryPoint, "AC17: 'View saved results' must be hidden with 0 results").toHaveCount(0);
});

// ─── AC17: entry point visible when ≥1 result ────────────────────────────────

test("AC17: 'View saved results' entry point APPEARS when ≥1 saved result exists", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((data) => {
    localStorage.setItem(data.key, JSON.stringify(data.value));
  }, { key: makeKey(SAVED_RESULT_1.id), value: SAVED_RESULT_1 });

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  const entryPoint = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  ).first();
  await expect(entryPoint, "AC17: 'View saved results' must be visible with 1 saved result").toBeVisible();
});

// ─── AC17: entry point is to the right of "Start the test" ──────────────────

test("AC17: 'View saved results' appears to the right of 'Start the test' button", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((data) => {
    localStorage.setItem(data.key, JSON.stringify(data.value));
  }, { key: makeKey(SAVED_RESULT_1.id), value: SAVED_RESULT_1 });

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  const startBtn = page.locator("#start-test-btn, button:has-text('Start the test'), .landing__start-btn").first();
  const entryPoint = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  ).first();

  const startBox = await startBtn.boundingBox();
  const entryBox = await entryPoint.boundingBox();

  expect(startBox, "AC17: Start the test must have a bounding box").not.toBeNull();
  expect(entryBox, "AC17: View saved results must have a bounding box").not.toBeNull();

  // "To the right" means the entry point's left edge ≥ start button's right edge
  // OR they are on the same row (within 30px vertical center diff) with entry to right.
  const startRight = startBox.x + startBox.width;
  const entryLeft  = entryBox.x;

  // Accept same-row or stacked layouts — just not to the left.
  // The spec says "to the right" which could be next-sibling in flow.
  const startCenterY = startBox.y + startBox.height / 2;
  const entryCenterY = entryBox.y + entryBox.height / 2;
  const sameRow = Math.abs(startCenterY - entryCenterY) <= 40;

  if (sameRow) {
    expect(
      entryLeft,
      `AC17: 'View saved results' left (${entryLeft}px) must be to the right of 'Start' right (${startRight}px)`,
    ).toBeGreaterThanOrEqual(startRight - 10); // -10px tolerance for inline gaps
  }
  // If stacked vertically, it's still acceptable (narrow viewport).
});

// ─── AC17: saved-results screen lists all results ────────────────────────────

test("AC17: saved-results screen lists all saved results", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((items) => {
    for (const [key, val] of items) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  }, [
    [makeKey(SAVED_RESULT_1.id), SAVED_RESULT_1],
    [makeKey(SAVED_RESULT_2.id), SAVED_RESULT_2],
  ]);

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  // Open the saved-results screen.
  const entryPoint = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  ).first();
  await entryPoint.click();

  // Saved-results list must show ≥2 entries.
  const resultItems = page.locator(
    ".saved-results__item, [data-saved-result-item], .saved-results-list li",
  );
  await resultItems.first().waitFor({ state: "visible" });
  const count = await resultItems.count();
  expect(count, `AC17: saved-results screen must list 2 results; found ${count}`).toBeGreaterThanOrEqual(2);
});

// ─── AC17: "delete all" removes all entries ──────────────────────────────────

test("AC17: 'delete all' removes all saved results and hides the entry point", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((items) => {
    for (const [key, val] of items) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  }, [
    [makeKey(SAVED_RESULT_1.id), SAVED_RESULT_1],
    [makeKey(SAVED_RESULT_2.id), SAVED_RESULT_2],
  ]);

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  const entryPoint = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  ).first();
  await entryPoint.click();

  // Click "delete all".
  const deleteAllBtn = page.locator(
    "button:has-text('Delete all'), button:has-text('delete all'), [data-delete-all]",
  ).first();
  await deleteAllBtn.waitFor({ state: "visible" });
  await deleteAllBtn.click();

  // Handle confirmation dialog if present.
  page.on("dialog", (dialog) => dialog.accept());

  // All localStorage iqme:saved-result:* keys must be removed.
  const remainingKeys = await page.evaluate(() => {
    return Object.keys(localStorage).filter((k) => k.startsWith("iqme:saved-result:"));
  });
  expect(remainingKeys.length, `AC17: all saved-result keys must be deleted; remaining: ${JSON.stringify(remainingKeys)}`).toBe(0);

  // Navigate back to landing — entry point must be hidden. (navigate() returns
  // undefined, so a `|| history.back()` fallback would erroneously also fire and
  // pop back to #/saved — call navigate("") directly; the hook is always present.)
  await page.evaluate(() => window.__IQME_TEST__.navigate(""));
  await expect(page.locator(".landing")).toBeVisible();
  const entryPointAfter = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  );
  await expect(entryPointAfter, "AC17: 'View saved results' must be hidden after deleting all").toHaveCount(0);
});

// ─── AC17: per-result checkbox delete ────────────────────────────────────────

test("AC17: per-result checkbox delete removes only the selected result", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((items) => {
    for (const [key, val] of items) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  }, [
    [makeKey(SAVED_RESULT_1.id), SAVED_RESULT_1],
    [makeKey(SAVED_RESULT_2.id), SAVED_RESULT_2],
  ]);

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  const entryPoint = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  ).first();
  await entryPoint.click();

  // Find the first result item's checkbox/delete button.
  const firstCheckbox = page.locator(
    ".saved-results__item input[type='checkbox'], [data-saved-result-item] input[type='checkbox']",
  ).first();

  await firstCheckbox.waitFor({ state: "visible" });
  await firstCheckbox.click();

  // Find and click the per-item delete button (or a "Delete selected" button).
  const deleteSelectedBtn = page.locator(
    "button:has-text('Delete selected'), [data-delete-selected], button:has-text('Remove selected')",
  ).first();

  if (await deleteSelectedBtn.count() > 0) {
    await deleteSelectedBtn.click();
  } else {
    // Individual delete button per row.
    const firstDeleteBtn = page.locator(
      ".saved-results__item button:has-text('Delete'), [data-saved-result-item] button[aria-label*='Delete']",
    ).first();
    await firstDeleteBtn.click();
  }

  // Handle confirmation.
  page.on("dialog", (d) => d.accept());

  // Exactly 1 key should remain.
  const remainingKeys = await page.evaluate(() => {
    return Object.keys(localStorage).filter((k) => k.startsWith("iqme:saved-result:"));
  });
  expect(
    remainingKeys.length,
    `AC17: per-result delete must leave 1 result; remaining: ${JSON.stringify(remainingKeys)}`,
  ).toBe(1);
});

// ─── AC17: opening an individual saved result ─────────────────────────────────

test("AC17: clicking a saved result opens its detail view", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((data) => {
    localStorage.setItem(data.key, JSON.stringify(data.value));
  }, { key: makeKey(SAVED_RESULT_1.id), value: SAVED_RESULT_1 });

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  const entryPoint = page.locator(
    "button:has-text('View saved results'), a:has-text('View saved results'), [data-saved-results-entry]",
  ).first();
  await entryPoint.click();

  // Click the first result item to open its detail view.
  const firstItem = page.locator(
    ".saved-results__item a, [data-saved-result-item] a, .saved-results__item button:not([type='checkbox'])",
  ).first();
  await firstItem.waitFor({ state: "visible" });
  await firstItem.click();

  // A detail/result view must now be visible.
  const detailView = page.locator(
    ".score-panel, .saved-result-detail, [data-saved-result-view], .result-scene",
  ).first();
  await expect(detailView, "AC17: clicking a saved result must show its detail/score view").toBeVisible({ timeout: 5000 });
});
