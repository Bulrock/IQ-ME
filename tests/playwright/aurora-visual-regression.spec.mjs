// tests/playwright/aurora-visual-regression.spec.mjs
//
// Story 14-2 (Epic 14) — Aurora rendered visual-regression + print/PDF harness;
// EXTENDED to full coverage in Story 14-11 (PR-30).
//
// This is the RENDERED safety net the Epic 13 redesign lacked: Epic 13 shipped
// with structural source-text guards only, so the "invisible redesign" (glass
// composited to the page color) went undetected (investigation Finding 5).
// Structural CSS tests provably cannot catch that failure — only pixels can.
//
// CODE-COMPLETE, JOB DORMANT: the matching pr-checks.yml `visual-regression` job
// carries `if: false` + `# Activates in Epic 14 (Story 14.11)`. Story 14-11 AUTHORS
// the full rendered suite below (every AC leg) but does NOT commit PNG baselines:
// Playwright names snapshots per-platform (`*-linux.png`), and the authoring host
// is darwin — the ubuntu-latest baselines must be bootstrapped on CI. So the job
// stays `if: false`; final activation happens once the `*-linux.png` baselines are
// generated on ubuntu-latest (via `make snapshot-update-visual`) and committed.
// Runs against the LOCAL SPA only (tools/dev-server.mjs) — zero third-party, zero
// telemetry (NFR6). @playwright/test + @axe-core/playwright are installed only at
// CI time, never bundled into the shipped app.
//
// Tolerance: maxDiffPixelRatio ~1-2% absorbs sub-pixel AA jitter without masking
// a real regression (a vanished backdrop/glass moves far more than 2% of pixels).
//
// AC legs (epics.md §"Story 14.11"):
//   1. toHaveScreenshot per route × 7 viewports × light/dark (the seeded harness).
//   2. ±5% computed-geometry matrix-cell-to-option-icon parity (getBoundingClientRect).
//   3. no-clipping / no-distortion across the 7 widths (scrollWidth <= clientWidth+1).
//   4. focus-visible + :checked over the Aurora backdrop (keyboard-only) + screenshot.
//   5. reduced-motion stable static end-state (landing + result), two-pass stable.
//   6. print/PDF document leg — co-equal triplet + difficulty band + open disclaimer,
//      glass/CTAs dropped.
//   7. axe-core AA contrast over the rendered gradient backdrop, both themes.

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { start } from "../../tools/dev-server.mjs";

// Approved reference-viewport set (design-direction §5 / AC). The discrete capture
// widths plus the 1440 hero/wide leg.
const VIEWPORTS = [
  { w: 320, h: 720 },
  { w: 375, h: 760 },
  { w: 414, h: 896 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
];

// The seven approved widths as a flat list (the geometry-parity + no-clipping legs
// iterate these without needing a paired height).
const APPROVED_WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440];

const THEMES = ["light", "dark"];

// ~1-2% tolerance for cross-platform AA jitter; documented per design-direction §5.
const SCREENSHOT_OPTS = { maxDiffPixelRatio: 0.02, animations: "disabled" };

// Deterministic seed for the harness — matches trust-verification / trust-a11y.
const SEED = "0123456789abcdef0123456789abcdef";

// axe rule-tags covering contrast over the gradient (mirrors trust-a11y.spec.mjs's
// AA-only scoping — the AAA `color-contrast-enhanced` rule is disabled so the audit
// enforces exactly the WCAG 2.2 AA 4.5:1 / non-text bar over the rendered gradient).
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "cat.color"];

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

// Drive the seeded happy-path to the pre-reveal result beat. `bias` picks the tail
// variant: "top" → top-decile, "bottom" → bottom-decile, "alternate" → mid band.
async function seedToResult(page, origin, bias) {
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(
    ({ seed, bias }) => {
      window.__IQME_TEST__.resetState();
      window.__IQME_TEST__.setSeed(seed);
      for (let i = 0; i < 16; i++) {
        const r = bias === "top" ? 1 : bias === "bottom" ? 0 : i % 2;
        window.__IQME_TEST__.recordResponse(i, r);
      }
      window.__IQME_TEST__.navigate("result");
    },
    { seed: SEED, bias },
  );
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
}

// Reveal the score-panel from the pre-reveal beat (clicks "Show me").
async function reveal(page) {
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();
}

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

// Story 14-8 (PR-25): Aurora RESULT + SAVED-RESULT-DETAIL leg (Light + Dark).
// The revealed result card (.score-panel) and the saved-result detail must
// render as perceptible raised glass over the deep-navy backdrop — the same
// Aurora glass on both surfaces — with the co-equal Percentile/IQ-scale/Range
// triplet bbox parity holding in the rendered pixels (FR18). Driven via the
// seeded window.__IQME_TEST__ harness so the top-tail / mid / bottom-tail
// variants are reproducible. DORMANT: the parent `visual-regression` job is
// still `if: false`; Story 14.11 flips it on + commits these baselines on
// ubuntu-latest (no baselines committed here; the authoring host is darwin).
for (const theme of THEMES) {
  test(`aurora result card — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`http://127.0.0.1:${server.port}/src/index.html#/result`);
    await expect(page).toHaveScreenshot(`result-card-${theme}-1024.png`, SCREENSHOT_OPTS);
  });

  test(`aurora saved-result detail — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`http://127.0.0.1:${server.port}/src/index.html#/saved`);
    await expect(page).toHaveScreenshot(`saved-result-detail-${theme}-1024.png`, SCREENSHOT_OPTS);
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

// ═══════════════════════════════════════════════════════════════════════════
// Story 14-11 (PR-30) — FULL rendered-verification coverage extending the above.
// ═══════════════════════════════════════════════════════════════════════════

// ─── AC-1: toHaveScreenshot per SEEDED route × 7 viewports × light/dark ──────
// The landing leg above already covers landing at all 7 widths in both themes.
// These legs add the SEEDED-harness routes (consent, item-runner, result pre-
// reveal, revealed score-panel, top/bottom-decile tail-scenes, ≥1 methodology
// page) so every AC-1 route has a committed baseline. The baseline NAME encodes
// the route + theme + width; the pixels encode the actual Aurora composition, so
// a same-color/flat regression fails (the Epic 13 failure stays caught).

for (const theme of THEMES) {
  for (const { w, h } of VIEWPORTS) {
    test(`aurora consent — ${theme} @ ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(`http://127.0.0.1:${server.port}/?test=1`);
      await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
      await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
      await expect(page.locator(".consent-scene")).toBeVisible();
      await expect(page).toHaveScreenshot(`consent-${theme}-${w}.png`, SCREENSHOT_OPTS);
    });

    test(`aurora item-runner — ${theme} @ ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(`http://127.0.0.1:${server.port}/?test=1`);
      await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
      await page.evaluate(() => window.__IQME_TEST__.navigate("test"));
      await expect(page.locator(".item-runner, .item-runner-scene")).toBeVisible();
      await expect(page).toHaveScreenshot(`item-runner-${theme}-${w}.png`, SCREENSHOT_OPTS);
    });

    test(`aurora result pre-reveal — ${theme} @ ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: theme });
      const origin = `http://127.0.0.1:${server.port}`;
      await seedToResult(page, origin, "alternate");
      await expect(page).toHaveScreenshot(`result-prereveal-${theme}-${w}.png`, SCREENSHOT_OPTS);
    });

    test(`aurora revealed score-panel — ${theme} @ ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: theme });
      const origin = `http://127.0.0.1:${server.port}`;
      await seedToResult(page, origin, "alternate");
      await reveal(page);
      // Frozen co-equal triplet contract exercised-but-unmodified.
      await expect(page.locator(".score-panel__triplet")).toBeVisible();
      await expect(page).toHaveScreenshot(`score-panel-${theme}-${w}.png`, SCREENSHOT_OPTS);
    });

    test(`aurora tail-scene top-decile — ${theme} @ ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: theme });
      const origin = `http://127.0.0.1:${server.port}`;
      await seedToResult(page, origin, "top");
      await reveal(page);
      await expect(page.locator(".score-panel--top-decile")).toBeVisible();
      await expect(page).toHaveScreenshot(`tail-scene-top-decile-${theme}-${w}.png`, SCREENSHOT_OPTS);
    });

    test(`aurora tail-scene bottom-decile — ${theme} @ ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: theme });
      const origin = `http://127.0.0.1:${server.port}`;
      await seedToResult(page, origin, "bottom");
      await reveal(page);
      await expect(page.locator(".score-panel--bottom-decile")).toBeVisible();
      await expect(page).toHaveScreenshot(`tail-scene-bottom-decile-${theme}-${w}.png`, SCREENSHOT_OPTS);
    });
  }
}

// ≥1 methodology page across light + dark (a built corpus page over the deep-navy
// backdrop). The methodology-index leg above covers the index; this adds an inner
// content page so a body-text-over-gradient regression is caught.
for (const theme of THEMES) {
  test(`aurora methodology page — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`http://127.0.0.1:${server.port}/methodology/v0.1.0/en/scoring/percentile-to-iq/`);
    await expect(page).toHaveTitle(/percentile/i);
    await expect(page).toHaveScreenshot(`methodology-page-${theme}-1280.png`, SCREENSHOT_OPTS);
  });
}

// ─── AC-2: ±5% computed-geometry matrix-cell-to-option-icon parity ───────────
// The matrix renders img.item-runner__image (height-bound, aspect-ratio:1/1) and
// the option figures render img.item-runner__option-image, with NO runtime link
// between matrix-cell size and option size. The matrix CELL size is the rendered
// image width ÷ the grid columns (the data-grid-cols attribute Story 14.6 added).
// At each approved viewport, the computed option-icon width must be within ±5% of
// the computed matrix-cell size, and both must retain aspect-ratio 1/1. This reads
// LIVE rendered geometry (getBoundingClientRect), NOT CSS source.

test("aurora ±5% matrix-cell-to-option-icon scale parity at every approved viewport (live getBoundingClientRect, both aspect-ratio:1/1)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(() => window.__IQME_TEST__.navigate("test"));
  await expect(page.locator(".item-runner, .item-runner-scene")).toBeVisible();

  for (const width of APPROVED_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    // Let layout/reflow settle before measuring.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));

    const geom = await page.evaluate(() => {
      const matrix = document.querySelector("img.item-runner__image");
      const cols = parseInt(
        document.querySelector(".item-runner")?.getAttribute("data-grid-cols") || "0",
        10,
      );
      const option =
        document.querySelector("img.item-runner__option-image") ||
        document.querySelector(".item-runner__option-figure");
      if (!matrix || !option || !cols) return null;
      const m = matrix.getBoundingClientRect();
      const o = option.getBoundingClientRect();
      return {
        cols,
        matrixW: m.width,
        matrixH: m.height,
        cellW: m.width / cols,
        optionW: o.width,
        optionH: o.height,
      };
    });

    expect(geom, `could not read item-runner geometry at width ${width}`).not.toBeNull();

    // Matrix cell stays square (aspect-ratio:1/1) — the whole matrix is square so
    // per-cell width == per-cell height to sub-pixel tolerance.
    expect(
      Math.abs(geom.matrixW - geom.matrixH),
      `matrix lost its aspect-ratio:1/1 at width ${width} (${geom.matrixW}×${geom.matrixH})`,
    ).toBeLessThanOrEqual(Math.max(2, geom.matrixW * 0.02));

    // Option figure stays square (aspect-ratio:1/1 — no distortion).
    expect(
      Math.abs(geom.optionW - geom.optionH),
      `option icon lost its aspect-ratio:1/1 at width ${width} (${geom.optionW}×${geom.optionH})`,
    ).toBeLessThanOrEqual(Math.max(2, geom.optionW * 0.02));

    // ±5% parity: |optionW - cellW| / cellW <= 0.05.
    const ratioDelta = Math.abs(geom.optionW - geom.cellW) / geom.cellW;
    expect(
      ratioDelta,
      `option-icon width (${geom.optionW.toFixed(1)}px) diverged ${(ratioDelta * 100).toFixed(1)}% from the ` +
        `matrix-cell size (${geom.cellW.toFixed(1)}px = image ${geom.matrixW.toFixed(1)}px ÷ ${geom.cols} cols) ` +
        `at viewport width ${width} — exceeds the ±5% scale-parity tolerance (design §5)`,
    ).toBeLessThanOrEqual(0.05);
  }
});

// ─── AC-3: no clipping / no distortion across the seven widths ───────────────
// Each rendered matrix + option image bbox must stay within its container AND
// within the viewport, and no horizontal scroll appears (scrollWidth <= clientWidth
// + 1, mirroring trust-verification.spec.mjs) — across the desktop/mobile branch.

test("aurora no-clipping / no-distortion across 320/375/414/768/1024/1280/1440 (image bbox within container + viewport; NFR1 no horizontal scroll)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(() => window.__IQME_TEST__.navigate("test"));
  await expect(page.locator(".item-runner, .item-runner-scene")).toBeVisible();

  for (const width of APPROVED_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));

    const report = await page.evaluate(() => {
      const root = document.documentElement;
      const matrix = document.querySelector("img.item-runner__image");
      const options = Array.from(document.querySelectorAll(".item-runner__option-figure, img.item-runner__option-image"));
      const vw = root.clientWidth;
      const within = (el) => {
        if (!el) return true;
        const r = el.getBoundingClientRect();
        // Bbox must fit inside the viewport (1px sub-pixel tolerance both edges).
        return r.left >= -1 && r.right <= vw + 1;
      };
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        matrixWithin: within(matrix),
        optionsWithin: options.every(within),
      };
    });

    expect(
      report.scrollWidth - report.clientWidth,
      `horizontal overflow on item-runner at width ${width} (scrollWidth=${report.scrollWidth} > clientWidth=${report.clientWidth})`,
    ).toBeLessThanOrEqual(1);
    expect(report.matrixWithin, `matrix image clipped outside the viewport at width ${width}`).toBe(true);
    expect(report.optionsWithin, `an option image clipped outside the viewport at width ${width}`).toBe(true);
  }
});

// ─── AC-4: focus-visible + :checked over the Aurora backdrop ─────────────────
// Tab keyboard-only onto a radio option; assert the focused control's computed
// outline differs measurably from its unfocused state (a visible focus indicator
// over the deep-navy backdrop), the :checked selected-answer border renders, and
// capture a toHaveScreenshot of the focused/selected option.

test("aurora focus-visible + :checked over the Aurora backdrop (keyboard-only; computed outline differs from unfocused; selected-answer border; focused-option screenshot)", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await page.evaluate(() => window.__IQME_TEST__.navigate("test"));
  await expect(page.locator(".item-runner, .item-runner-scene")).toBeVisible();

  const firstRadio = page.locator('.item-runner__options input[type="radio"]').first();
  await expect(firstRadio).toBeVisible();

  // Unfocused computed outline (baseline).
  const unfocused = await firstRadio.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, width: cs.outlineWidth };
  });

  // Keyboard-only focus: tab until the first radio is the active element. (Each
  // option is a native input[type=radio] — keyboard-reachable, WCAG 2.2 AA.)
  let reached = false;
  for (let i = 0; i < 40 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await firstRadio.evaluate((el) => el === document.activeElement);
  }
  expect(reached, "keyboard Tab did not reach the first radio option (keyboard reachability broken)").toBe(true);

  // Focused computed outline — :focus-visible paints --color-focus-ring.
  const focused = await firstRadio.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, width: cs.outlineWidth };
  });
  expect(
    focused.outline !== unfocused.outline,
    `focused control's computed outline (${focused.outline}) did not differ measurably from unfocused (${unfocused.outline}) — focus indicator not visible over the Aurora backdrop`,
  ).toBe(true);

  // Select the focused option (Space) → :checked selected-answer border renders.
  await page.keyboard.press("Space");
  await expect(firstRadio).toBeChecked();
  const selectedLabel = page.locator(".item-runner__option").first();
  const border = await selectedLabel.evaluate((el) => getComputedStyle(el).borderColor);
  expect(border, "selected-answer label rendered no border color over the Aurora backdrop").toBeTruthy();

  // Screenshot of the focused + selected option (focus leg baseline).
  await expect(selectedLabel).toHaveScreenshot("focused-checked-option.png", SCREENSHOT_OPTS);
});

// ─── AC-5: reduced-motion stable static end-state (landing + result) ─────────
// Under prefers-reduced-motion:reduce, the Aurora-animated surfaces must settle to
// a deliberate STATIC end-state (not a frozen mid-animation frame). A stable
// toHaveScreenshot that matches across two passes proves the reduced-motion branch
// renders rather than animating, without breaking the backdrop contrast / triplet.

for (const surface of ["landing", "result"]) {
  test(`aurora reduced-motion stable static end-state — ${surface}`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    if (surface === "landing") {
      await page.goto(`${origin}/?test=1`);
      await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
      await expect(page.locator(".landing")).toBeVisible();
    } else {
      await seedToResult(page, origin, "alternate");
      await reveal(page);
      await expect(page.locator(".score-panel__triplet")).toBeVisible();
    }

    // Pass 1 establishes/compares the baseline; pass 2 re-captures to prove the
    // surface is STATIC (no continuous motion) under reduced-motion.
    await expect(page).toHaveScreenshot(`reduced-motion-${surface}.png`, SCREENSHOT_OPTS);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    await expect(page).toHaveScreenshot(`reduced-motion-${surface}.png`, SCREENSHOT_OPTS);
  });
}

// ─── AC-6: print / PDF document leg ──────────────────────────────────────────
// Seed a result session, emulate print media (+ exercise page.pdf()), and assert
// the printed result keeps the co-equal Percentile/IQ-scale/Range triplet, the
// difficulty band, and the disclaimer rendered OPEN, with glass surfaces + CTAs
// dropped. The committed print baseline is bootstrapped on ubuntu-latest per scope.

test("aurora print result document — co-equal triplet + difficulty band + open disclaimer present, glass/CTAs dropped (print media + page.pdf())", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  await page.setViewportSize({ width: 1024, height: 1280 });
  await seedToResult(page, origin, "alternate");
  await reveal(page);

  await page.emulateMedia({ media: "print" });

  // Co-equal Percentile/IQ-scale/Range triplet survives in print (FR18 invariant).
  await expect(page.locator(".score-panel__triplet")).toBeVisible();
  expect(await page.locator(".score-panel__triplet > *").count(), "the co-equal triplet must keep all three members in print").toBeGreaterThanOrEqual(3);

  // The disclaimer (<details>) renders OPEN in print (print.css forces it open).
  const disclaimerOpen = await page.locator(".score-panel__explainer, .disclaimer").first().evaluate((el) => {
    // Either the <details open> attribute or a computed visible body.
    if (el.tagName.toLowerCase() === "details") return el.open || getComputedStyle(el).display !== "none";
    return getComputedStyle(el).display !== "none";
  });
  expect(disclaimerOpen, "the disclaimer must render open in the print document").toBe(true);

  // CTAs (save/print/retest buttons) are dropped in print (print.css display:none).
  const ctaVisible = await page.locator(".score-panel__save-button, .result-print-btn").evaluateAll(
    (els) => els.some((el) => getComputedStyle(el).display !== "none"),
  );
  expect(ctaVisible, "interactive CTAs (save/print) must be dropped in the print document").toBe(false);

  // Committed print baseline (bootstrapped on ubuntu-latest per scope).
  await expect(page).toHaveScreenshot("result-print.png", SCREENSHOT_OPTS);

  // Exercise the page.pdf() path so the print rendering is generated as a document
  // (PDF bytes are produced locally — NFR6 no telemetry; not committed as a baseline).
  const pdf = await page.pdf({ format: "A4", printBackground: false });
  expect(pdf.length, "page.pdf() must produce a non-empty print document").toBeGreaterThan(0);
});

// ─── AC-7: axe-core AA contrast over the rendered GRADIENT backdrop ──────────
// Extend the trust-a11y AA-only axe scoping (disableRules color-contrast-enhanced)
// to assert body text, action controls, focus indicators, and selected-answer
// borders clear the WCAG 2.2 AA bar specifically OVER the rendered deep-navy
// gradient — in BOTH [data-theme] palettes via prefers-color-scheme. Zero
// contrast violations against the rendered gradient (not a flat token).

async function expectNoContrastViolations(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .disableRules(["color-contrast-enhanced"])
    .analyze();
  const violations = results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }));
  expect(
    violations,
    `axe-core found ${violations.length} WCAG 2.2 AA contrast violation(s) over the Aurora gradient on "${label}": ${JSON.stringify(violations, null, 2)}`,
  ).toEqual([]);
}

for (const theme of THEMES) {
  test(`aurora AA contrast over the gradient backdrop — ${theme} (body text / controls / focus rings / selected-answer borders)`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: theme });

    // landing — body text + CTAs over the gradient.
    await page.goto(`${origin}/?test=1`);
    await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
    await expect(page.locator(".landing")).toBeVisible();
    await expectNoContrastViolations(page, `landing (${theme})`);

    // item-runner — option controls + selected-answer borders over the field.
    await page.evaluate(() => window.__IQME_TEST__.navigate("test"));
    await expect(page.locator(".item-runner, .item-runner-scene")).toBeVisible();
    await expectNoContrastViolations(page, `item-runner (${theme})`);

    // revealed result — the co-equal triplet + glass panels over the gradient.
    await seedToResult(page, origin, "alternate");
    await reveal(page);
    await expect(page.locator(".score-panel")).toBeVisible();
    await expectNoContrastViolations(page, `result score-panel (${theme})`);
  });
}
