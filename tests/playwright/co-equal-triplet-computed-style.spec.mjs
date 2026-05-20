// tests/playwright/co-equal-triplet-computed-style.spec.mjs
//
// Story 6.1 AC-4 — co-equal-triplet computed-style runtime assertion
// (graduates Story 3.5 source-CSS lint per Murat's two-tier defense).
//
// Exercises the score-panel triplet (`.score-panel__anchor`,
// `.score-panel__percentile`, `.score-panel__band`) across the FR18 / UX-DR22
// axes:
//   - Themes: light + dark (via `[data-theme="light"|"dark"]` on <html>).
//   - Locales: EN only (RU/PL slots reserved via test.skip — Epic 7).
//   - Viewport widths: 320, 768, 1280.
//
// FR18 tolerances asserted pairwise across all 3 triplet elements:
//   - bounding-box area ratio within ±15%
//   - font-size delta ≤ 2px
//   - vertical baseline (bottom-of-bbox) delta ≤ 4px
//   - font-weight differential ≤ 100
//
// Spec drives the SPA via the existing test-hook surface (Story 3.7
// `src/assessment/test-hook.js` exposes `window.__IQME_TEST__` when loaded
// with `?test=1`). See tests/playwright/full-slice.spec.mjs for the
// canonical bootstrapping pattern this file follows.
//
// RED-PHASE NOTE: this spec is expected to fail today because (a) the
// score-panel percentile/band slots may not all render with parity yet,
// and (b) the reveal dispatcher only knows `anchor` + `handoff`, so the
// full sequence required to reach result-rendered state isn't available.
// Engineer impl (Tasks 1+3 of Story 6.1) closes both gaps.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const THEMES = ["light", "dark"];
const VIEWPORTS = [
  { width: 320, height: 800, name: "320" },
  { width: 768, height: 1024, name: "768" },
  { width: 1280, height: 800, name: "1280" },
];

// FR18 / UX-DR22 tolerances.
const TOLERANCE = {
  bboxAreaRatio: 0.15,   // pairwise ratio within ±15%
  fontSizePx: 2,         // ≤ 2px delta
  baselinePx: 4,         // ≤ 4px vertical baseline delta
  fontWeight: 100,       // ≤ 100 differential
};

const TRIPLET_SELECTORS = [
  ".score-panel__anchor",
  ".score-panel__percentile",
  ".score-panel__band",
];

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

/**
 * Drive the SPA from cold-start to result-rendered (score-panel visible)
 * for a given theme and viewport. Uses the test-hook deterministic-seed
 * path established in full-slice.spec.mjs to skip 16-item physical
 * click-through.
 *
 * PRECONDITION (engineer): the SPA must reach a state where the full
 * triplet (`.score-panel__anchor`, `.score-panel__percentile`,
 * `.score-panel__band`) is rendered after the 6-stage reveal sequence
 * completes. Story 6.1 Tasks 1+3 wire this up; until then this helper
 * waits for the score-panel and dispatches Show-Me to reach handoff.
 */
async function driveToScorePanel(page, { origin, theme, viewport }) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  // Apply theme via the data-attribute convention (architecture.md §609).
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);

  // Deterministic-seed path: bypass consent dwell + 16-item session.
  await page.evaluate(() => window.__IQME_TEST__.resetState());
  await page.evaluate(() => {
    window.__IQME_TEST__.setSeed("0123456789abcdef0123456789abcdef");
    for (let i = 0; i < 16; i++) {
      window.__IQME_TEST__.recordResponse(i, i % 2);
    }
    window.__IQME_TEST__.navigate("result");
  });

  // Pre-reveal anchor beat surfaces first; click Show-Me to advance to
  // the full reveal sequence (which, post Story 6.1, walks anchor → band →
  // interval → context → tail-scene → methodology-handoff and reveals
  // the score-panel triplet).
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();

  // All three triplet elements must be rendered before measurement.
  for (const sel of TRIPLET_SELECTORS) {
    await expect(page.locator(sel)).toBeVisible();
  }
}

/**
 * Capture bbox + computed-style measurements for one triplet element.
 * Runs in the page context.
 */
async function measureTriplet(page) {
  return page.evaluate((selectors) => {
    return selectors.map((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { sel, missing: true };
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        sel,
        missing: false,
        bbox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom, // baseline proxy (bottom of bbox)
          area: rect.width * rect.height,
        },
        fontSize: parseFloat(cs.fontSize),
        fontWeight: parseInt(cs.fontWeight, 10),
      };
    });
  }, TRIPLET_SELECTORS);
}

function assertPairwiseInvariants(measurements, ctx) {
  // Every element must have been measured.
  for (const m of measurements) {
    expect(m.missing, `${ctx}: triplet element '${m.sel}' must be present in DOM`).toBe(false);
  }

  // Pairwise comparisons across the 3 triplet elements: (0,1), (0,2), (1,2).
  for (let i = 0; i < measurements.length; i++) {
    for (let j = i + 1; j < measurements.length; j++) {
      const a = measurements[i];
      const b = measurements[j];
      const pair = `${a.sel} ↔ ${b.sel}`;

      // bbox area ratio within ±15%.
      const minArea = Math.min(a.bbox.area, b.bbox.area);
      const maxArea = Math.max(a.bbox.area, b.bbox.area);
      // Guard against zero area (would otherwise hide a real bug).
      expect(minArea, `${ctx} / ${pair}: bbox area must be > 0 (a=${a.bbox.area}, b=${b.bbox.area})`).toBeGreaterThan(0);
      const ratio = (maxArea - minArea) / minArea;
      expect(
        ratio,
        `${ctx} / ${pair}: bbox area ratio ${(ratio * 100).toFixed(1)}% must be within ±${TOLERANCE.bboxAreaRatio * 100}% (a.area=${a.bbox.area}, b.area=${b.bbox.area})`,
      ).toBeLessThanOrEqual(TOLERANCE.bboxAreaRatio);

      // font-size delta ≤ 2px.
      const fsDelta = Math.abs(a.fontSize - b.fontSize);
      expect(
        fsDelta,
        `${ctx} / ${pair}: font-size delta ${fsDelta.toFixed(2)}px must be ≤ ${TOLERANCE.fontSizePx}px (a=${a.fontSize}, b=${b.fontSize})`,
      ).toBeLessThanOrEqual(TOLERANCE.fontSizePx);

      // Vertical baseline delta ≤ 4px (using bbox.bottom as baseline proxy).
      const baselineDelta = Math.abs(a.bbox.bottom - b.bbox.bottom);
      expect(
        baselineDelta,
        `${ctx} / ${pair}: vertical baseline delta ${baselineDelta.toFixed(2)}px must be ≤ ${TOLERANCE.baselinePx}px (a.bottom=${a.bbox.bottom}, b.bottom=${b.bbox.bottom})`,
      ).toBeLessThanOrEqual(TOLERANCE.baselinePx);

      // font-weight differential ≤ 100.
      const fwDelta = Math.abs(a.fontWeight - b.fontWeight);
      expect(
        fwDelta,
        `${ctx} / ${pair}: font-weight delta ${fwDelta} must be ≤ ${TOLERANCE.fontWeight} (a=${a.fontWeight}, b=${b.fontWeight})`,
      ).toBeLessThanOrEqual(TOLERANCE.fontWeight);
    }
  }
}

// ─── EN matrix: theme × viewport ─────────────────────────────────────────

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test(`AC-4: co-equal triplet pairwise invariants — EN × ${theme} × ${viewport.name}`, async ({ page }) => {
      const origin = `http://127.0.0.1:${server.port}`;
      await driveToScorePanel(page, { origin, theme, viewport });
      const measurements = await measureTriplet(page);
      assertPairwiseInvariants(measurements, `EN × ${theme} × ${viewport.name}`);
    });
  }
}

// ─── RU/PL reserved slots (Epic 7 Story 7.1) ─────────────────────────────
//
// Per AC-4: EN only at this epic; RU/PL slots reserved so the matrix shape
// is visible. `test.skip` markers cite the reservation rationale.

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test.skip(`AC-4: co-equal triplet pairwise invariants — RU × ${theme} × ${viewport.name} (RU added in Epic 7 Story 7.1)`, async () => {
      // Reserved — locale parity slot lands in Epic 7.
    });
    test.skip(`AC-4: co-equal triplet pairwise invariants — PL × ${theme} × ${viewport.name} (PL added in Epic 7 Story 7.1)`, async () => {
      // Reserved — locale parity slot lands in Epic 7.
    });
  }
}
