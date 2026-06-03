// tests/playwright/cropping-fuzzer.spec.mjs
//
// Story 6.6 AC-5 — cropping fuzzer. Generates N seeded synthetic crop windows
// over the rendered top-decile score-panel and asserts there is NO crop that
// captures the score while excluding BOTH the caveat and the tear-edge overlay
// (a clean decontextualized score-only crop). Such a crop = the tear-edge
// composition regressed → CI red (FR24, Murat's bank-frozen-flag discipline).
//
// GATE: the suite is conditionally enabled by corpus/manifest.json `bankFrozen`.
// While the item-bank is unfrozen the fuzzer stays dormant (avoids alert-fatigue
// from late content edits — per Murat). It becomes a hard PR gate only once the
// maintainer commits bankFrozen:true.

import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { start } from "../../tools/dev-server.mjs";
import { makeRng, generateCrops, assessCrop } from "../../tools/cropping-fuzzer.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const SEED = "0123456789abcdef0123456789abcdef";
const CROP_SEED = "cropping-fuzzer-6-6";
const N_CROPS = 64;

function bankFrozen() {
  try {
    const m = JSON.parse(readFileSync(resolve(REPO_ROOT, "corpus/manifest.json"), "utf8"));
    return m && m.bankFrozen === true;
  } catch {
    return false;
  }
}

// Whole-suite gate: dormant unless the bank is declared frozen.
test.skip(!bankFrozen(), "cropping-fuzzer gated: corpus/manifest.json bankFrozen !== true");

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

async function driveToTopDecile(page, origin) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(() => window.__IQME_TEST__.resetState());
  await page.evaluate(
    ({ seed }) => {
      window.__IQME_TEST__.setSeed(seed);
      for (let i = 0; i < 16; i++) window.__IQME_TEST__.recordResponse(i, 1);
      window.__IQME_TEST__.navigate("result");
    },
    { seed: SEED },
  );
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel.score-panel--top-decile")).toBeVisible();
}

test("AC-5: no synthetic crop yields a clean score-only window (caveat survives cropping)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await driveToTopDecile(page, origin);

  const panel = await page.locator(".score-panel--top-decile").boundingBox();
  const caveat = await page.locator(".score-panel--top-decile .score-panel__caveat").boundingBox();
  const tearEdge = await page.locator(".score-panel--top-decile .score-panel__tear-edge").boundingBox();
  const score = await page.locator(".score-panel--top-decile .score-panel__triplet").boundingBox();
  for (const [name, box] of [["panel", panel], ["caveat", caveat], ["tearEdge", tearEdge], ["score", score]]) {
    expect(box, `${name} must have a bounding box`).not.toBeNull();
  }

  const crops = generateCrops({ panel, n: N_CROPS, rng: makeRng(CROP_SEED) });
  const failures = [];
  for (const crop of crops) {
    const verdict = assessCrop(crop, { caveat, tearEdge, score });
    if (verdict.verdict === "fail") failures.push({ crop, verdict });
  }

  expect(
    failures,
    `found ${failures.length}/${N_CROPS} clean score-only crops (tear-edge composition regressed): ${JSON.stringify(failures.slice(0, 3))}`,
  ).toHaveLength(0);
});
