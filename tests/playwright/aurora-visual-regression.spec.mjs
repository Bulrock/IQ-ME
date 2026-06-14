// tests/playwright/aurora-visual-regression.spec.mjs
//
// Story 14-2 (Epic 14) — Aurora rendered visual-regression + print/PDF harness.
//
// This is the RENDERED safety net the Epic 13 redesign lacked: Epic 13 shipped
// with structural source-text guards only, so the "invisible redesign" (glass
// composited to the page color) went undetected (investigation Finding 5).
// Structural CSS tests provably cannot catch that failure — only pixels can.
//
// SCAFFOLD / DORMANT: the matching pr-checks.yml `visual-regression` job carries
// `if: false` + `# Activates in Epic 14`; Story 14-11 flips it on and commits the
// baselines. Baselines are generated on ubuntu-latest via `make snapshot-update-visual`
// so platform font/AA jitter does not flake the gate. Runs against the LOCAL SPA
// only (tools/dev-server.mjs) — zero third-party, zero telemetry (NFR6).
//
// Tolerance: maxDiffPixelRatio ~1-2% absorbs sub-pixel AA jitter without masking
// a real regression (a vanished backdrop/glass moves far more than 2% of pixels).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

// Approved reference-viewport set (design-direction §5). The wide/hero leg adds
// 1440 on top of the discrete capture widths.
const VIEWPORTS = [
  { w: 320, h: 720 },
  { w: 360, h: 760 },
  { w: 414, h: 896 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
];

const THEMES = ["light", "dark"];

// ~1-2% tolerance for cross-platform AA jitter; documented per design-direction §5.
const SCREENSHOT_OPTS = { maxDiffPixelRatio: 0.02, animations: "disabled" };

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

for (const theme of THEMES) {
  for (const { w, h } of VIEWPORTS) {
    test(`aurora backdrop+glass — ${theme} @ ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(`http://127.0.0.1:${server.port}/src/index.html`);
      // The deep-navy backdrop + glass surfaces must render perceptibly — the
      // baseline encodes the actual pixels, so a same-color regression fails.
      await expect(page).toHaveScreenshot(`landing-${theme}-${w}.png`, SCREENSHOT_OPTS);
    });
  }
}

// Story 14-4: methodology-index Aurora glass-on-navy leg (Light + Dark). The
// COMPLETE /methodology/v0.1.0 route — masthead, sidebar nav, and index sections
// — must render as raised glass panels over the deep-navy backdrop, not flat
// transparent regions (the Epic 13 same-color failure stays resolved). DORMANT:
// the parent `visual-regression` job is still `if: false`; Story 14.11 flips it
// on and commits these baselines on ubuntu-latest (no baselines committed here).
for (const theme of THEMES) {
  test(`aurora methodology-index — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`http://127.0.0.1:${server.port}/methodology/v0.1.0/en/`);
    await expect(page).toHaveScreenshot(`methodology-index-${theme}-1280.png`, SCREENSHOT_OPTS);
  });
}

// Story 14-7 (PR-23/§3.1): RESTRAINED assessment-route leg (Light + Dark). The
// item-runner route must render the matrix card + option tiles + nav at a LOWER
// glass intensity than the landing/result heroes, over a near-flat deep field
// (the decorative aurora glows/grid are suppressed on #/test — no spectacle).
// The baseline therefore encodes both the restraint (quieter than landing) and
// the no-timer policy (no countdown/elapsed/speed chrome in the rendered DOM).
// DORMANT: the parent `visual-regression` job is still `if: false`; Story 14.11
// flips it on and commits these baselines on ubuntu-latest (no baselines here).
for (const theme of THEMES) {
  test(`aurora restrained assessment route — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`http://127.0.0.1:${server.port}/src/index.html#/test`);
    await expect(page).toHaveScreenshot(`assessment-restrained-${theme}-1024.png`, SCREENSHOT_OPTS);
  });
}

test("aurora print/PDF — ink-economical document leg (no aurora/blur)", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1280 });
  await page.goto(`http://127.0.0.1:${server.port}/src/index.html`);
  // The print translation drops aurora/blur/glow for an economical document
  // (design-direction §3.3). Capture under print emulation.
  await page.emulateMedia({ media: "print" });
  await expect(page).toHaveScreenshot("landing-print.png", SCREENSHOT_OPTS);
});
