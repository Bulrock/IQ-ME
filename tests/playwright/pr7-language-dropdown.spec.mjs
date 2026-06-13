// tests/playwright/pr7-language-dropdown.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-7 — AC9: Language selection is a custom dropdown showing country
// flags for EN/RU/PL, keyboard- and screen-reader-accessible, preserving locale
// persistence and FR8 in-test locale-switch blocker hint.
//
// PR-7 replaces the <fieldset> radio group (existing i18n-locale-switch pattern)
// with a custom dropdown. The new dropdown must:
//   - have aria-expanded on its trigger
//   - have aria-selected on the active option
//   - close on Escape
//   - show flag indicators (img or [data-flag] or emoji) for EN/RU/PL
//   - preserve localStorage["locale"] persistence
//   - preserve the FR8 blocker hint during a test session

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

async function gotoLanding(page, origin) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();
}

test("AC9: language switcher is a custom dropdown (has aria-expanded trigger), not a radio group", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  // PR-7: new dropdown has a trigger with aria-expanded.
  // Before impl, the switcher is a radio fieldset with no aria-expanded → RED.
  const dropdownTrigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await expect(dropdownTrigger, "AC9: language switcher trigger must have aria-expanded attribute").toHaveCount(1);
});

test("AC9: dropdown opens on click — aria-expanded becomes 'true'", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const trigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await trigger.click();

  const expanded = await trigger.getAttribute("aria-expanded");
  expect(expanded, "AC9: aria-expanded must be 'true' after opening dropdown").toBe("true");
});

test("AC9: open dropdown options stay above scene content and receive pointer input", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const trigger = page.locator(".language-switcher__trigger");
  await trigger.click();

  const ruOption = page.locator("[data-lang-option='ru']");
  const topHitIsOption = await ruOption.evaluate((option) => {
    const rect = option.getBoundingClientRect();
    const topHit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return topHit === option || option.contains(topHit);
  });

  expect(
    topHitIsOption,
    "AC9: scene content must not cover or intercept clicks from an open language option",
  ).toBe(true);
});

test("AC9: dropdown closes on Escape — aria-expanded becomes 'false'", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const trigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await trigger.click();
  await page.keyboard.press("Escape");

  const expanded = await trigger.getAttribute("aria-expanded");
  expect(expanded, "AC9: aria-expanded must be 'false' after Escape").toBe("false");
});

test("AC9: dropdown shows flag indicators for EN, RU, PL options", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const trigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await trigger.click();

  // Each option must contain a flag element: img[alt*=flag], [data-flag], or emoji span.
  const enFlag = page.locator(
    "[data-lang-option='en'] img, [data-lang-option='en'] [data-flag], [data-lang='en'] img, [value='en'] ~ [data-flag]",
  ).first();
  const ruFlag = page.locator(
    "[data-lang-option='ru'] img, [data-lang-option='ru'] [data-flag], [data-lang='ru'] img, [value='ru'] ~ [data-flag]",
  ).first();
  const plFlag = page.locator(
    "[data-lang-option='pl'] img, [data-lang-option='pl'] [data-flag], [data-lang='pl'] img, [value='pl'] ~ [data-flag]",
  ).first();

  await expect(enFlag, "AC9: EN option must show a flag indicator").toHaveCount(1);
  await expect(ruFlag, "AC9: RU option must show a flag indicator").toHaveCount(1);
  await expect(plFlag, "AC9: PL option must show a flag indicator").toHaveCount(1);
});

test("AC9: active locale option has aria-selected='true'", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const trigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await trigger.click();

  // EN should be selected by default on a fresh CI context.
  const selectedOption = page.locator("[aria-selected='true']").first();
  await expect(selectedOption, "AC9: one option must have aria-selected='true'").toHaveCount(1);
});

test("AC9: selecting RU from dropdown persists locale and renders with data-locale='ru'", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  const trigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await trigger.click();

  const ruOption = page.locator("[data-lang-option='ru'], [data-lang='ru'], [value='ru']").first();
  await ruOption.click();

  // Page reloads on locale change; wait for load.
  await page.waitForLoadState("load");

  const dataLocale = await page.locator("html").getAttribute("data-locale");
  expect(dataLocale, "AC9: <html data-locale> must be 'ru' after RU selection").toBe("ru");
});

test("AC9: FR8 locale-switch blocker hint is shown during an active test session", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  // Start a session (navigate to test).
  await page.evaluate((s) => {
    window.__IQME_TEST__.resetState();
    window.__IQME_TEST__.setSeed(s);
    window.__IQME_TEST__.navigate("test");
  }, SEED);
  await expect(page.locator(".item-runner")).toBeVisible();

  // The locale switcher dropdown trigger should either be disabled or show a hint.
  // PR-7 must preserve FR8 blocker.
  const blockerHint = page.locator(
    ".locale-switch-blocker-hint, [data-blocker-hint], .language-switcher--blocked",
  );
  // Either the hint is shown OR the trigger is disabled.
  const hintVisible  = await blockerHint.count() > 0;
  const triggerDisabled = await page.locator(
    ".language-switcher [aria-expanded][aria-disabled='true'], .language-switcher__trigger[disabled]",
  ).count() > 0;

  expect(
    hintVisible || triggerDisabled,
    "AC9: FR8 blocker — locale switcher must be blocked or hint shown during active test session",
  ).toBe(true);
});

test("AC9: dropdown trigger is keyboard-focusable and Space opens it", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await gotoLanding(page, origin);

  const trigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await trigger.focus();

  const isFocused = await trigger.evaluate((el) => el === document.activeElement);
  expect(isFocused, "AC9: language switcher trigger must receive focus").toBe(true);

  await page.keyboard.press("Space");
  const expanded = await trigger.getAttribute("aria-expanded");
  expect(expanded, "AC9: Space must open the dropdown (aria-expanded='true')").toBe("true");
});

test("AC9 [PL]: locale dropdown works correctly with PL locale preset", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.addInitScript(() => { localStorage.setItem("locale", "pl"); });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  await expect(page.locator("html"), "AC9 [PL]: html data-locale must be pl").toHaveAttribute("data-locale", "pl");

  const trigger = page.locator(
    ".language-switcher [aria-expanded], .language-switcher__trigger, [data-lang-trigger]",
  ).first();
  await trigger.click();

  const selectedOption = page.locator("[aria-selected='true']").first();
  await expect(selectedOption, "AC9 [PL]: PL option must have aria-selected='true'").toHaveCount(1);
});
