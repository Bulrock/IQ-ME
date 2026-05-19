// Story 1.7 — Acceptance test for tests/playwright/network-trace.spec.mjs structure.
//
// Local node --test cannot invoke Playwright (too heavy: ~300MB browser binary
// download). This test asserts structural correctness of the spec; CI runs the
// real Playwright via the `network-trace` workflow job.
//
// Run: `node --test tests/scaffold/playwright-network-trace.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const SPEC_PATH = join(REPO_ROOT, "tests", "playwright", "network-trace.spec.mjs");
const BASELINE_PATH = join(REPO_ROOT, "tests", "fixtures", "network-trace-baseline.html");
const WORKFLOW_PATH = join(REPO_ROOT, ".github", "workflows", "pr-checks.yml");
const MAKEFILE_PATH = join(REPO_ROOT, "Makefile");

const REQUIRED_FORBIDDEN_HOSTS = [
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

// ─────────────────────────────────────────────────────────────────────
// AC-1 / AC-7: spec exists, parses, declares tests
// ─────────────────────────────────────────────────────────────────────

test("AC-1: network-trace.spec.mjs exists at canonical path", () => {
  assert.ok(existsSync(SPEC_PATH), `tests/playwright/network-trace.spec.mjs missing`);
});

test("AC-7: spec declares at least one test(...) call", () => {
  const source = readFileSync(SPEC_PATH, "utf8");
  assert.match(
    source,
    /\btest\s*\(/,
    `spec must contain at least one test(...) call. Source:\n${source.slice(0, 300)}`,
  );
});

test("AC-7: spec imports from @playwright/test", () => {
  const source = readFileSync(SPEC_PATH, "utf8");
  assert.match(
    source,
    /from\s+['"]@playwright\/test['"]/,
    `spec must import from @playwright/test.`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: FORBIDDEN_DOMAINS array exists + names every required host
// ─────────────────────────────────────────────────────────────────────

test("AC-3: spec references FORBIDDEN_DOMAINS", () => {
  const source = readFileSync(SPEC_PATH, "utf8");
  assert.match(
    source,
    /FORBIDDEN_DOMAINS/,
    `spec must declare/reference FORBIDDEN_DOMAINS array.`,
  );
});

for (const host of REQUIRED_FORBIDDEN_HOSTS) {
  test(`AC-3: spec lists "${host}" in forbidden domains`, () => {
    const source = readFileSync(SPEC_PATH, "utf8");
    assert.ok(
      source.includes(host),
      `spec must include forbidden host "${host}" in its FORBIDDEN_DOMAINS list.`,
    );
  });
}

// ─────────────────────────────────────────────────────────────────────
// AC-4: baseline fixture exists
// ─────────────────────────────────────────────────────────────────────

test("AC-4: baseline fixture exists at tests/fixtures/network-trace-baseline.html", () => {
  assert.ok(existsSync(BASELINE_PATH), `baseline fixture missing at ${BASELINE_PATH}`);
});

test("AC-4: baseline fixture has no external resource references", () => {
  const text = readFileSync(BASELINE_PATH, "utf8");
  // Must not include any http(s) URL, any src/href starting with //, any @import, or external font.
  const externalPatterns = [
    /https?:\/\//,
    /\bsrc\s*=\s*["']\/\//,
    /\bhref\s*=\s*["']\/\//,
    /@import\s+url/i,
  ];
  for (const re of externalPatterns) {
    assert.doesNotMatch(
      text,
      re,
      `baseline fixture contains external resource reference matching ${re}. Contents:\n${text}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-2 / AC-3: spec asserts the strict invariant
// ─────────────────────────────────────────────────────────────────────

test("AC-2: spec listens on page request events (`page.on(\"request\"`)", () => {
  const source = readFileSync(SPEC_PATH, "utf8");
  assert.match(
    source,
    /page\.on\s*\(\s*["']request["']/,
    `spec must register a page.on("request", …) handler to capture every request.`,
  );
});

test("AC-2: spec asserts same-origin / no-http rule", () => {
  const source = readFileSync(SPEC_PATH, "utf8");
  // The spec MUST contain an assertion validating the captured-requests
  // collection. Accept either Playwright `expect(...).toEqual([])` style
  // (multi-line) or `assert.equal`/`assert.deepEqual` style.
  assert.ok(
    /expect\(/s.test(source) || /assert\.(equal|deepEqual)\b/.test(source),
    `spec must contain an assertion validating the captured requests collection.`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-5: CI workflow `network-trace` job is activated (no `if: false`)
// ─────────────────────────────────────────────────────────────────────

test("AC-5: network-trace job is no longer stubbed with `if: false`", () => {
  const text = readFileSync(WORKFLOW_PATH, "utf8");
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => /^  network-trace:\s*$/.test(l));
  assert.notEqual(idx, -1, `network-trace job declaration not found in pr-checks.yml`);
  // Scan until the next top-level job declaration (line beginning with two spaces + identifier + colon)
  // so we don't bleed into a neighboring job's `if: false`.
  let endIdx = lines.length;
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^  [\w-]+:\s*$/.test(lines[i])) { endIdx = i; break; }
  }
  const body = lines.slice(idx, endIdx).join("\n");
  assert.doesNotMatch(
    body,
    /^\s*if:\s*false/m,
    `network-trace job must NOT carry "if: false" — Story 1.7 activates it. Body:\n${body}`,
  );
  assert.match(
    body,
    /npx --yes playwright|npx playwright/,
    `network-trace job body must invoke playwright (via npx). Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-8: make test-network-trace target exists
// ─────────────────────────────────────────────────────────────────────

test("AC-8: Makefile declares `test-network-trace` target", () => {
  const text = readFileSync(MAKEFILE_PATH, "utf8");
  assert.match(
    text,
    /^test-network-trace:.*##/m,
    `Makefile must declare test-network-trace target with ## self-doc comment.`,
  );
});
