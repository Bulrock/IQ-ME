// tests/playwright/network-trace.spec.mjs
//
// Story 1.7 — STRICT zero-third-party network-trace assertion (full strictness
// from day 1 per Murat). Loads tests/fixtures/network-trace-baseline.html
// (or IQME_NETWORK_TRACE_TARGET if set) and asserts:
//   - zero non-same-origin requests (for file:// baseline, zero http(s) requests)
//   - no request URL host matches any entry in FORBIDDEN_DOMAINS
//
// Run locally:    `npx --yes playwright test tests/playwright/network-trace.spec.mjs`
// Run in CI:      via .github/workflows/pr-checks.yml `network-trace` job.

import { test, expect } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const BASELINE = pathToFileURL(resolve(REPO_ROOT, "tests/fixtures/network-trace-baseline.html")).href;

const TARGET = process.env.IQME_NETWORK_TRACE_TARGET || BASELINE;

// Forbidden hosts — known telemetry / external-CDN vectors the project
// specifically rejects. Even if a future PR introduces a legitimate
// same-origin route, these hosts MUST NOT appear in any request trace.
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

test("network-trace: zero third-party requests on " + TARGET, async ({ page }) => {
  const requests = [];
  page.on("request", (req) => {
    requests.push(req.url());
  });

  await page.goto(TARGET);
  // Allow microtasks + post-load network to flush.
  await page.waitForLoadState("networkidle");

  // Strict rule for file:// baseline: NO http(s) URLs at all.
  const httpRequests = requests.filter((u) => /^https?:\/\//i.test(u));

  if (TARGET.startsWith("file://")) {
    expect(
      httpRequests,
      `file:// baseline must produce zero http(s) requests; got:\n  ${httpRequests.join("\n  ")}`,
    ).toEqual([]);
  } else {
    // Real-page rule: same-origin only.
    const targetUrl = new URL(TARGET);
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
  }

  // Forbidden-host rule applies to ALL captured URLs.
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
});
