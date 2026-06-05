// tests/playwright/trust-verification.spec.mjs
//
// Story 8.5 — Consolidated full trust-verification suite (FR41 DevTools-verifiable
// surface). Three legs, all driven over the SAME full SPA happy-path
// (landing → consent → 16-item seeded session → reveal → result → methodology
// hand-off page), mirroring the full-slice.spec.mjs driving template
// (window.__IQME_TEST__ via ?test=1 + tools/dev-server.mjs, seeded session — NOT
// physical click-through — for the <90s CI budget):
//
//   (A) network-trace      — zero non-same-origin requests + zero FORBIDDEN_DOMAINS
//                            hits across the path, including >=1 methodology page
//                            (re-exercises the network-trace.spec.mjs contract).
//   (B) CSP-violation count — a page.on('pageerror') + page.on('console') collector
//                            asserts ZERO Content-Security-Policy violations across
//                            the full happy-path including methodology pages.
//   (C) viewport-overflow   — iterates widths 320/375/414/768/1024/1280/1440 and
//                            asserts no horizontal scroll
//                            (document.documentElement.scrollWidth <= clientWidth,
//                            1px tolerance) on every rendered surface (NFR1).
//
// Run locally:  `npx --yes playwright test tests/playwright/trust-verification.spec.mjs`
// Run in CI:    via .github/workflows/pr-checks.yml `trust-verification-full` job
//               (also referenced by csp-violation-count + viewport-overflow jobs).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

// Must match tests/playwright/network-trace.spec.mjs + full-slice.spec.mjs.
const FORBIDDEN_DOMAINS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
  "unpkg.com",
  "plausible.io",
  "goatcounter.com",
  "sentry.io",
  "mixpanel.com",
  "posthog.com",
  "googletagmanager.com",
  "google-analytics.com",
];

// At least one methodology corpus page is touched on the happy-path so the
// network + CSP legs cover a built corpus page (not just the SPA). This is the
// page the result-scene percentile hand-off navigates to.
const METHODOLOGY_PAGE = "/methodology/v0.1.0/en/scoring/percentile-to-iq/";

// Leg C — the seven viewport widths the no-horizontal-scroll invariant iterates.
const VIEWPORT_WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440];

// CSP-violation detection. A Content-Security-Policy violation surfaces either as
// a SecurityPolicyViolation (we listen via an init-script that forwards
// 'securitypolicyviolation' events to console.error) or as a CSP-flavoured
// console error / pageerror. We scope the collector to CSP lines so generic JS
// errors do not false-positive the count.
const CSP_RE = /Content-Security-Policy|\bCSP\b|securitypolicyviolation|Refused to (load|execute|apply|connect)/i;

const SEED = "0123456789abcdef0123456789abcdef";

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

// Install the CSP-violation collector + a same-origin request trace on a page,
// returning the collected arrays. Init-script forwards securitypolicyviolation
// DOM events (the canonical CSP signal) into console.error so the page.on
// listeners below capture them uniformly.
function instrument(page) {
  const requests = [];
  const cspViolations = [];

  page.on("request", (req) => {
    requests.push(req.url());
  });

  // pageerror — uncaught exceptions; a blocked inline/eval under CSP can surface
  // here. Scoped to CSP-flavoured messages.
  page.on("pageerror", (err) => {
    const msg = String(err && err.message ? err.message : err);
    if (CSP_RE.test(msg)) cspViolations.push(`pageerror: ${msg}`);
  });

  // console — the browser logs "Refused to … because it violates the following
  // Content-Security-Policy directive" as a console error; our init-script also
  // forwards securitypolicyviolation events here.
  page.on("console", (m) => {
    const text = m.text();
    if (CSP_RE.test(text)) cspViolations.push(`console.${m.type()}: ${text}`);
  });

  return { requests, cspViolations };
}

// Drive the seeded happy-path: landing → reset → seed 16 responses → result →
// reveal → methodology hand-off. `bias` picks the tail variant (1 → top-decile,
// 0 → bottom-decile); alternating exercises the mid band.
async function driveHappyPath(page, origin, { bias = "alternate" } = {}) {
  await page.addInitScript(() => {
    // Forward CSP DOM events to console.error so the page.on('console') collector
    // captures them. (No production effect — only runs in the test context.)
    window.addEventListener("securitypolicyviolation", (e) => {
      console.error(
        `securitypolicyviolation: violatedDirective=${e.violatedDirective} blockedURI=${e.blockedURI} (Content-Security-Policy)`,
      );
    });
  });

  // Landing scene.
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();

  // Consent scene (visit it so the surface is exercised by the trace).
  await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
  await expect(page.locator(".consent-scene")).toBeVisible();

  // Seed a deterministic 16-item session and jump to the result beat.
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

  // Pre-reveal beat → click "Show me" to reveal the score-panel.
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();

  // Methodology hand-off: real navigation to a built corpus page (>=1 methodology
  // page on the happy-path for the network + CSP legs).
  await Promise.all([
    page.waitForURL(`**${METHODOLOGY_PAGE}**`),
    page.locator(".score-panel__percentile").click(),
  ]);
  await expect(page).toHaveTitle(/percentile/i);
}

// ─── Leg A + Leg B: network-trace + CSP-violation count ──────────────────
// Both legs share one happy-path pass (one server hit, well under the 90s budget).

test("trust-verification (leg A network-trace + leg B CSP): zero third-party requests and zero Content-Security-Policy violations across the full happy-path", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  const { requests, cspViolations } = instrument(page);

  await driveHappyPath(page, origin, { bias: "alternate" });
  await page.waitForLoadState("networkidle");

  // ── Leg A: network-trace (same-origin only + no FORBIDDEN_DOMAINS) ──
  const targetUrl = new URL(origin);
  const httpRequests = requests.filter((u) => /^https?:\/\//i.test(u));

  const offOrigin = httpRequests.filter((u) => {
    try {
      return new URL(u).host !== targetUrl.host;
    } catch {
      return true;
    }
  });
  expect(
    offOrigin,
    `Non-same-origin requests detected (target host=${targetUrl.host}):\n  ${offOrigin.join("\n  ")}`,
  ).toEqual([]);

  const forbiddenHits = requests.filter((u) => {
    try {
      const host = new URL(u).host.toLowerCase();
      return FORBIDDEN_DOMAINS.some((bad) => host === bad || host.endsWith("." + bad));
    } catch {
      return false;
    }
  });
  expect(
    forbiddenHits,
    `Requests to FORBIDDEN_DOMAINS detected:\n  ${forbiddenHits.join("\n  ")}`,
  ).toEqual([]);

  // ── Leg B: CSP-violation count (zero across the happy-path) ──
  expect(
    cspViolations,
    `Content-Security-Policy violations detected across the happy-path:\n  ${cspViolations.join("\n  ")}`,
  ).toEqual([]);
});

// ─── Leg C: viewport-overflow (no horizontal scroll at any of the 7 widths) ──

test("trust-verification (leg C viewport-overflow): no horizontal scroll at widths 320/375/414/768/1024/1280/1440 across rendered surfaces", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;

  // Assert no horizontal overflow on the currently-rendered surface at every
  // width. 1px tolerance for sub-pixel rounding.
  async function assertNoHorizontalScroll(surface) {
    for (const width of VIEWPORT_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      // Let layout/reflow settle.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });
      expect(
        overflow.scrollWidth - overflow.clientWidth,
        `horizontal overflow on "${surface}" at viewport width ${width}px ` +
          `(scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth})`,
      ).toBeLessThanOrEqual(1);
    }
  }

  // Surface 1: landing.
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();
  await assertNoHorizontalScroll("landing");

  // Surface 2: consent.
  await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
  await expect(page.locator(".consent-scene")).toBeVisible();
  await assertNoHorizontalScroll("consent");

  // Surface 3: result + revealed score-panel (top-decile, the widest composition —
  // includes the tear-edge overlay).
  await page.evaluate(
    ({ seed }) => {
      window.__IQME_TEST__.resetState();
      window.__IQME_TEST__.setSeed(seed);
      for (let i = 0; i < 16; i++) window.__IQME_TEST__.recordResponse(i, 1);
      window.__IQME_TEST__.navigate("result");
    },
    { seed: SEED },
  );
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
  await assertNoHorizontalScroll("result-prereveal");
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();
  await assertNoHorizontalScroll("result-scorepanel");

  // Surface 4: a built methodology corpus page.
  await page.goto(`${origin}${METHODOLOGY_PAGE}`);
  await expect(page).toHaveTitle(/percentile/i);
  await assertNoHorizontalScroll("methodology-percentile-to-iq");
});
