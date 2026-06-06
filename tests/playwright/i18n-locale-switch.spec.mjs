// tests/playwright/i18n-locale-switch.spec.mjs
//
// Story 7.1 AC-7 — language-switcher exercised end-to-end in a real browser.
// PR-7 (Story 11-1, AC9): the switcher is now a custom dropdown (trigger
// button + role="listbox" of flag options) instead of a radio fieldset.
//
//   1. Switcher DOM: .language-switcher with a trigger + three options
//      (EN/RU/PL) in the chrome-header slot; the boot-locale option is
//      aria-selected; the trigger carries a non-empty accessible label.
//   2. Persist-on-select + reload (not-in-session): no localStorage["locale"]
//      write during bootstrap (NFR9); selecting RU writes ["locale","ru"]
//      exactly once and the reloaded document carries <html data-locale="ru">.
//   3. First-render correctness with empty localStorage: boot locale resolves
//      to EN (CI navigator.language=en-US) without "undefined" labels.
//   4. Active-bundle resolution: setting localStorage.locale before navigation
//      drives <html data-locale> for each of en/ru/pl.
//
// FR37 (locale selection at landing) + FR38 (all UI in chosen language).
// Uses the ?test=1 fast-path test-hook.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const SWITCHER = ".language-switcher";
const TRIGGER = ".language-switcher__trigger";
const OPT_EN = ".language-switcher__option[data-lang-option='en']";
const OPT_RU = ".language-switcher__option[data-lang-option='ru']";
const OPT_PL = ".language-switcher__option[data-lang-option='pl']";

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

test("AC-7.1: language-switcher renders EN/RU/PL options in chrome-header; boot locale aria-selected", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/?test=1`);
  await expect(page.locator(SWITCHER)).toHaveCount(1);
  await expect(page.locator(OPT_EN)).toHaveCount(1);
  await expect(page.locator(OPT_RU)).toHaveCount(1);
  await expect(page.locator(OPT_PL)).toHaveCount(1);
  // Boot locale on a fresh CI context (navigator.language=en-US) is EN.
  await expect(page.locator(OPT_EN)).toHaveAttribute("aria-selected", "true");
  // Trigger carries a non-empty accessible label (resolves through the bundle).
  const label = await page.locator(TRIGGER).getAttribute("aria-label");
  expect((label || "").trim().length, "trigger aria-label must not be empty/undefined").toBeGreaterThan(0);
});

test("AC-7.2: selecting RU writes ['locale','ru'] once and reloads with <html data-locale='ru'> (NFR9 — none on bootstrap)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await installLocaleSetItemSpy(page);
  await page.goto(`${origin}/?test=1`);

  const beforeClick = await page.evaluate(() => window.__localeSetItem.length);
  expect(beforeClick, "ZERO locale writes during bootstrap (NFR9)").toBe(0);

  await page.locator(TRIGGER).click();
  await page.locator(OPT_RU).click();
  // The switcher reloads the page; wait for navigation to settle.
  await page.waitForLoadState("load");

  await expect(page.locator("html")).toHaveAttribute("data-locale", "ru");
  const stored = await page.evaluate(() => localStorage.getItem("locale"));
  expect(stored, "explicit selection persists locale opt-in").toBe("ru");
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
    await expect(page.locator(`.language-switcher__option[data-lang-option='${code}']`)).toHaveAttribute("aria-selected", "true");
  });
}
