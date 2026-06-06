// tests/playwright/pr12b-dead-links.spec.mjs
//
// NOTE FOR CI: This spec must be added to pr-checks.yml individually (no glob).
//
// Story 11-1 PR-12b — AC15: Every methodology link across EN/RU/PL resolves
// to real content — no "Cannot GET"/404. Trailing-slash vs no-slash is the
// documented failure class.
//
// Strategy: load each locale's index page, collect all <a href> values that
// are relative or same-origin methodology links, then fetch each and assert
// HTTP status < 400.
//
// NOTE: This test requires `make build-methodology` to have run so that
// dist/methodology/ is populated. The dev-server serves dist/methodology/ under
// /methodology/.

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const LOCALE_ROOTS = [
  "/methodology/v0.1.0/en/",
  "/methodology/v0.1.0/ru/",
  "/methodology/v0.1.0/pl/",
];

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

/**
 * Collect all href values from <a> elements on the given page that are:
 *   - relative paths (starting with /)
 *   - same-origin absolute URLs
 * Excludes: external URLs (different origin), mailto:, #anchor-only.
 */
async function collectMethodologyLinks(page, origin, url) {
  await page.goto(`${origin}${url}`);
  await page.waitForLoadState("domcontentloaded");

  const links = await page.evaluate((pageOrigin) => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => {
        try {
          const href = a.getAttribute("href") || "";
          if (!href || href.startsWith("#") || href.startsWith("mailto:")) return null;
          // Resolve relative to current page.
          const resolved = new URL(href, window.location.href);
          // Only same-origin links.
          if (resolved.origin !== pageOrigin) return null;
          return resolved.pathname + resolved.hash;
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);
  }, origin);

  return [...new Set(links)];
}

for (const locale of ["en", "ru", "pl"]) {
  test(`AC15 [${locale}]: all links on /methodology/v0.1.0/${locale}/ index resolve without 404`, async ({ page }) => {
    const origin = `http://127.0.0.1:${server.port}`;
    const rootPath = `/methodology/v0.1.0/${locale}/`;

    const links = await collectMethodologyLinks(page, origin, rootPath);

    expect(
      links.length,
      `AC15 [${locale}]: at least 5 links must exist on the methodology ${locale} index; found ${links.length}`,
    ).toBeGreaterThanOrEqual(5);

    const failed = [];
    for (const linkPath of links) {
      // Strip hash fragment for fetch.
      const fetchPath = linkPath.split("#")[0] || "/";
      const url = `${origin}${fetchPath}`;
      const resp = await page.request.fetch(url, { failOnStatusCode: false });
      if (resp.status() >= 400) {
        failed.push({ path: fetchPath, status: resp.status() });
      }
    }

    // PR-12b: trailing-slash vs no-slash failures; before fix some return 404 → RED.
    expect(
      failed,
      `AC15 [${locale}]: ${failed.length} dead link(s) found:\n${failed.map((f) => `  ${f.path} → HTTP ${f.status}`).join("\n")}`,
    ).toEqual([]);
  });
}

// Also crawl individual methodology article pages (one level deep) from the EN index.
test("AC15 [deep-crawl/en]: links within methodology article pages resolve without 404", async ({ page }) => {
  const origin = `http://127.0.0.1:${server.port}`;

  // Get index links first.
  const indexLinks = await collectMethodologyLinks(page, origin, "/methodology/v0.1.0/en/");
  const methodologyLinks = indexLinks.filter((l) => l.startsWith("/methodology/"));

  // For each linked article page, collect its internal links and verify them.
  const failed = [];

  // Limit to 15 pages to keep test duration reasonable.
  const pagesToCheck = methodologyLinks.slice(0, 15);

  for (const link of pagesToCheck) {
    const pageLinks = await collectMethodologyLinks(page, origin, link);
    for (const subLink of pageLinks) {
      const fetchPath = subLink.split("#")[0] || "/";
      const url = `${origin}${fetchPath}`;
      const resp = await page.request.fetch(url, { failOnStatusCode: false });
      if (resp.status() >= 400) {
        failed.push({ from: link, path: fetchPath, status: resp.status() });
      }
    }
  }

  expect(
    failed,
    `AC15 [deep-crawl]: dead links found in article pages:\n${failed.map((f) => `  ${f.from} → ${f.path} HTTP ${f.status}`).join("\n")}`,
  ).toEqual([]);
});
