// tests/a11y/trust-a11y.spec.mjs
//
// Story 8.5 AC-4 — accessibility audit (NFR12 / UX-DR6, WCAG 2.2 AA). Runs
// axe-core (via @axe-core/playwright's AxeBuilder) against:
//   • every SPA surface — landing, consent, item-runner, result (+ revealed
//     score-panel), tail-scenes (top-decile and bottom-decile variants); and
//   • every built methodology corpus page (dist/methodology/v0.1.0/en/**).
//
// It asserts ZERO violations in the axe rule-tags that cover contrast, keyboard
// operability, landmark structure, and ARIA correctness (wcag2a / wcag2aa /
// wcag21a / wcag21aa / wcag22aa + the cat.keyboard / cat.aria / cat.color /
// cat.semantics / cat.structure category rules).
//
// pa11y is the documented FALLBACK runner: if @axe-core/playwright cannot be
// resolved in an environment (or for a second-opinion HTML_CodeSniffer pass over
// the same surfaces), run `npx --yes pa11y --standard WCAG2AA <url>` against the
// dev-server URLs below — pa11y reports the same WCAG 2.2 AA contrast / keyboard
// / landmark / aria failures from an independent engine.
//
// Driving mirrors full-slice.spec.mjs: window.__IQME_TEST__ via ?test=1 +
// tools/dev-server.mjs, deterministic seeded session (NOT physical click-through).
//
// Run locally:  `npx --yes playwright test tests/a11y/trust-a11y.spec.mjs`
// Run in CI:    via .github/workflows/pr-checks.yml `axe-core-pa11y` job
//               (needs `make build-methodology` first so the corpus pages exist).

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { start } from "../../tools/dev-server.mjs";

const SEED = "0123456789abcdef0123456789abcdef";

// axe rule-tags covering contrast, keyboard, landmark/structure, and aria — the
// four failure classes AC-4 enumerates (a subset of the full WCAG tag set).
const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "cat.color",
  "cat.keyboard",
  "cat.aria",
  "cat.structure",
  "cat.semantics",
];

// Every built EN methodology corpus page (dist/methodology/v0.1.0/en/**). The
// `make build-methodology` step in the CI job emits these before the run.
const METHODOLOGY_PAGES = [
  "/methodology/v0.1.0/en/scoring/overview/",
  "/methodology/v0.1.0/en/scoring/percentile-to-iq/",
  "/methodology/v0.1.0/en/scoring/uncertainty/",
  "/methodology/v0.1.0/en/constructs/g-factor/",
  "/methodology/v0.1.0/en/constructs/fluid-reasoning/",
  "/methodology/v0.1.0/en/constructs/matrix-reasoning/",
  "/methodology/v0.1.0/en/constructs/icar-mr/",
  "/methodology/v0.1.0/en/constructs/validity-envelope/",
  "/methodology/v0.1.0/en/norming/sapa-sample/",
  "/methodology/v0.1.0/en/norming/flynn-effects/",
  "/methodology/v0.1.0/en/norming/representativeness/",
  "/methodology/v0.1.0/en/tails/top-decile/",
  "/methodology/v0.1.0/en/tails/bottom-decile/",
  "/methodology/v0.1.0/en/ethics/non-clinical/",
  "/methodology/v0.1.0/en/ethics/anti-credentialization/",
  "/methodology/v0.1.0/en/ethics/apa-standards/",
  "/methodology/v0.1.0/en/provenance/iq-me-license/",
  "/methodology/v0.1.0/en/provenance/methodology-claims/",
  "/methodology/v0.1.0/en/limitations/what-this-does-not-measure/",
  "/methodology/v0.1.0/en/limitations/cultural-variance/",
  "/methodology/v0.1.0/en/limitations/anti-leakage/",
  "/methodology/v0.1.0/en/limitations/retest-effects/",
  "/methodology/v0.1.0/en/reference/citation/",
  "/methodology/v0.1.0/en/reference/bibliography/",
  "/methodology/v0.1.0/en/reference/changelog/",
  "/methodology/v0.1.0/en/reference/glossary/",
];

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

// Run axe against the live page and assert zero violations in the WCAG tag set.
// `label` names the audited surface in the failure message.
async function expectNoA11yViolations(page, label) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const violations = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
  }));
  expect(
    violations,
    `axe-core found ${violations.length} WCAG 2.2 AA violation(s) on "${label}" ` +
      `(contrast/keyboard/landmark/aria): ${JSON.stringify(violations, null, 2)}`,
  ).toEqual([]);
}

// Seed a 16-item session with the given response bias and land on `result`.
async function seedSession(page, bias) {
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

// ─── SPA surfaces: landing, consent, item-runner, result + tail-scenes ───

test("a11y (axe-core, pa11y fallback): SPA surfaces — landing / consent / item-runner / result / tail-scenes pass WCAG 2.2 AA", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;

  // landing
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);
  await expect(page.locator(".landing")).toBeVisible();
  await expectNoA11yViolations(page, "landing");

  // consent
  await page.evaluate(() => window.__IQME_TEST__.navigate("consent"));
  await expect(page.locator(".consent-scene")).toBeVisible();
  await expectNoA11yViolations(page, "consent");

  // item-runner
  await page.evaluate(() => window.__IQME_TEST__.navigate("test"));
  await expect(page.locator(".item-runner, .item-runner-scene")).toBeVisible();
  await expectNoA11yViolations(page, "item-runner");

  // result (pre-reveal beat)
  await seedSession(page, "alternate");
  await expectNoA11yViolations(page, "result-prereveal");

  // result revealed score-panel
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();
  await expectNoA11yViolations(page, "result-scorepanel");

  // tail-scenes — top-decile variant (tear-edge composition).
  await seedSession(page, "top");
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".tail-scene")).toBeVisible();
  await expectNoA11yViolations(page, "tail-scene-top-decile");

  // tail-scenes — bottom-decile variant (silent-companion-line + crisis-resources).
  await seedSession(page, "bottom");
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".tail-scene")).toBeVisible();
  await expectNoA11yViolations(page, "tail-scene-bottom-decile");
});

// ─── Methodology corpus pages: every built EN page ───────────────────────

test("a11y (axe-core, pa11y fallback): every methodology page passes WCAG 2.2 AA", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;
  for (const path of METHODOLOGY_PAGES) {
    await page.goto(`${origin}${path}`);
    await expectNoA11yViolations(page, `methodology ${path}`);
  }
});
