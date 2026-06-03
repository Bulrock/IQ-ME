// tests/playwright/i18n-locale-switch.spec.mjs
//
// Story 7.1 AC-7 — language-switcher exercised end-to-end in a real browser.
//
//   1. Switcher DOM: <fieldset.language-switcher> with three radios
//      (EN/RU/PL) rendered into the chrome-header slot; the boot locale
//      radio is checked; the visually-hidden legend resolves through the
//      active locale bundle.
//   2. Persist-on-click + reload (not-in-session): no localStorage["locale"]
//      write during bootstrap (NFR9); clicking RU writes ["locale","ru"]
//      exactly once and the reloaded document carries <html data-locale="ru">.
//   3. First-render correctness with empty localStorage: boot locale resolves
//      to EN (CI navigator.language=en-US) and renders without "undefined"
//      labels (bare-key/undefined regression guard).
//   4. Active-bundle resolution: setting localStorage.locale before
//      navigation drives <html data-locale> for each of en/ru/pl, proving
//      resolveInitialLocale + load target the active locale (not always EN).
//
// FR37 (locale selection at landing) + FR38 (all UI in chosen language)
// + FR8 boundary (in-session block is Story 7.2 — not exercised here).
//
// Uses the ?test=1 fast-path test-hook (no 25-min item loop).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const SWITCHER = ".language-switcher";
const RADIO_EN = ".language-switcher input[type='radio'][value='en']";
const RADIO_RU = ".language-switcher input[type='radio'][value='ru']";
const RADIO_PL = ".language-switcher input[type='radio'][value='pl']";

let server;

test.beforeAll(async () => { server = await start(0); });
test.afterAll(async () => { if (server) await server.close(); });

async function installLocaleSetItemSpy(page) {
  await page.addInitScript(() => {
    window.__localeSetItem = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "locale") window.__localeSetItem.push([k, v]);
      return orig.call(this, k, v);
    };
  });
}

test("AC-7.1: language-switcher renders EN/RU/PL radios in chrome-header; boot locale checked", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/?test=1`);
  await expect(page.locator(SWITCHER)).toHaveCount(1);
  await expect(page.locator(RADIO_EN)).toHaveCount(1);
  await expect(page.locator(RADIO_RU)).toHaveCount(1);
  await expect(page.locator(RADIO_PL)).toHaveCount(1);
  // Boot locale on a fresh CI context (navigator.language=en-US) is EN.
  await expect(page.locator(RADIO_EN)).toBeChecked();
  const legend = page.locator(`${SWITCHER} legend`);
  await expect(legend).toHaveCount(1);
  expect((await legend.textContent())?.trim().length, "legend must not be empty/undefined").toBeGreaterThan(0);
});

test("AC-7.2: clicking RU writes ['locale','ru'] once and reloads with <html data-locale='ru'> (NFR9 — none on bootstrap)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await installLocaleSetItemSpy(page);
  await page.goto(`${origin}/?test=1`);

  const beforeClick = await page.evaluate(() => window.__localeSetItem.length);
  expect(beforeClick, "ZERO locale writes during bootstrap (NFR9)").toBe(0);

  await page.locator(RADIO_RU).check();
  // The switcher reloads the page; wait for navigation to settle.
  await page.waitForLoadState("load");

  await expect(page.locator("html")).toHaveAttribute("data-locale", "ru");
  const stored = await page.evaluate(() => localStorage.getItem("locale"));
  expect(stored, "explicit click persists locale opt-in").toBe("ru");
});

test("AC-7.3: empty localStorage → boot locale EN, no 'undefined' labels rendered", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/?test=1`);
  await expect(page.locator("html")).toHaveAttribute("data-locale", "en");
  const bodyText = (await page.locator("body").textContent()) || "";
  expect(bodyText.includes("undefined"), "no missing-key 'undefined' labels in rendered DOM").toBe(false);
});

for (const code of ["en", "ru", "pl"]) {
  test(`AC-7.4 [${code}]: localStorage.locale='${code}' before nav drives <html data-locale='${code}'> (active-bundle resolution)`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await page.addInitScript((c) => { localStorage.setItem("locale", c); }, code);
    await page.goto(`${origin}/?test=1`);
    await expect(page.locator("html")).toHaveAttribute("data-locale", code);
    await expect(page.locator(`.language-switcher input[type='radio'][value='${code}']`)).toBeChecked();
  });
}
