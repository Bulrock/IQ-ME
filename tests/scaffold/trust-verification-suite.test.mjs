// Story 8.5 — Structural acceptance tests for the consolidated full Playwright
// trust-verification suite (trust-verification.spec.mjs + lighthouserc.json +
// tests/a11y/*.spec.mjs) and the pr-checks.yml jobs that wire/activate them.
//
// Authored in test-author phase (frozen during specialist impl).
//
// Run: `node --test tests/scaffold/trust-verification-suite.test.mjs`
//
// RED PHASE: none of the deliverables exist yet —
//   - tests/playwright/trust-verification.spec.mjs              (ABSENT)
//   - tests/perf/lighthouserc.json                              (ABSENT — .gitkeep only)
//   - tests/a11y/*.spec.mjs                                     (ABSENT — .gitkeep only)
//   - pr-checks.yml `trust-verification-full` job               (ABSENT)
//   - pr-checks.yml `csp-violation-count`/`viewport-overflow`/
//     `axe-core-pa11y` jobs                                     (still `if: false`)
//   - pr-checks.yml lhci autorun perf leg                       (ABSENT)
// so these assertions describe the structural contract that does NOT yet exist
// and FAIL until Story 8.5 implements it.
//
// DEV-PHASE CONTRACT IS STRUCTURAL (story 8.5 dev-phase decision, mirror of
// Story 8.1): we assert the spec/config files EXIST, are WELL-FORMED, and assert
// the right things (network-trace + CSP + the seven viewport widths; the four
// Lighthouse budgets + Slow-4G/mobile profile; a11y specs wired). We do NOT run
// a live 90s Playwright pass / lhci autorun / full-page axe audit — those run in
// CI. So these are structural text/JSON checks (no Playwright launch, no network,
// no YAML parser dep — same approach as ci-matrix.test.mjs / release-workflow.test.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const PR_CHECKS = join(REPO_ROOT, ".github", "workflows", "pr-checks.yml");
const TV_SPEC = join(REPO_ROOT, "tests", "playwright", "trust-verification.spec.mjs");
const LIGHTHOUSERC = join(REPO_ROOT, "tests", "perf", "lighthouserc.json");
const A11Y_DIR = join(REPO_ROOT, "tests", "a11y");

// The seven viewport widths AC-1 leg (c) must iterate (NFR1 no-horizontal-scroll).
const VIEWPORT_WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440];

function loadPrChecks() {
  assert.ok(existsSync(PR_CHECKS), `pr-checks.yml missing at ${PR_CHECKS}`);
  return readFileSync(PR_CHECKS, "utf8");
}

// Slice a job body: find the `  <job>:` declaration line and return the next
// `window` lines joined (the job's steps/if/with block). Mirrors the
// ci-matrix.test.mjs AC-2/AC-3 + release-workflow.test.mjs job-body slicing.
function jobBody(text, job, window = 30) {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) =>
    l.match(new RegExp(`^  ${job.replace(/-/g, "\\-")}:\\s*$`)),
  );
  return {
    idx,
    body: idx === -1 ? "" : lines.slice(idx, Math.min(idx + window, lines.length)).join("\n"),
  };
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: consolidated trust-verification.spec.mjs — file exists + asserts the
// three legs (network-trace + CSP-violation + viewport-overflow over 7 widths).
// ─────────────────────────────────────────────────────────────────────

test("AC-1: tests/playwright/trust-verification.spec.mjs exists", () => {
  assert.ok(
    existsSync(TV_SPEC),
    `tests/playwright/trust-verification.spec.mjs must exist (consolidated network-trace + CSP + viewport-overflow spec). Missing at ${TV_SPEC}`,
  );
});

test("AC-1 (leg A — network-trace): trust-verification.spec.mjs re-exercises the same-origin / FORBIDDEN_DOMAINS network contract", () => {
  assert.ok(existsSync(TV_SPEC), `trust-verification.spec.mjs missing at ${TV_SPEC}`);
  const src = readFileSync(TV_SPEC, "utf8");

  // The network-trace leg listens for requests (page.on('request', ...)) so it can
  // assert zero off-origin / forbidden-domain hits (the full-slice.spec.mjs contract).
  assert.match(
    src,
    /page\.on\(\s*['"]request['"]/,
    `trust-verification.spec.mjs (leg A) must register a page.on('request', ...) listener to capture the network trace (mirror full-slice.spec.mjs). Source:\n${src.slice(0, 600)}`,
  );
  // The FORBIDDEN_DOMAINS list (or an off-origin host comparison) anchors the
  // zero-third-party assertion — reuse of the network-trace.spec.mjs contract.
  assert.match(
    src,
    /FORBIDDEN_DOMAINS|same-?origin|\.host\b/i,
    `trust-verification.spec.mjs (leg A) must assert zero non-same-origin / FORBIDDEN_DOMAINS requests (reuse the full-slice.spec.mjs network contract). Source:\n${src.slice(0, 600)}`,
  );
});

test("AC-1 (leg B — CSP-violation count): trust-verification.spec.mjs collects pageerror / CSP-violation events and asserts zero", () => {
  assert.ok(existsSync(TV_SPEC), `trust-verification.spec.mjs missing at ${TV_SPEC}`);
  const src = readFileSync(TV_SPEC, "utf8");

  // A page.on('pageerror') (and/or console / securitypolicyviolation) collector
  // is the CSP-violation-count mechanism the AC mandates.
  assert.match(
    src,
    /page\.on\(\s*['"](pageerror|console)['"]|securitypolicyviolation/i,
    `trust-verification.spec.mjs (leg B) must register a page.on('pageerror') (and/or console / securitypolicyviolation) collector for CSP violations. Source:\n${src.slice(0, 800)}`,
  );
  // It must reference Content-Security-Policy / CSP so the collector is scoped to
  // CSP-violation lines (not generic JS errors only).
  assert.match(
    src,
    /Content-Security-Policy|\bCSP\b/i,
    `trust-verification.spec.mjs (leg B) must reference Content-Security-Policy / CSP (the violation-count assertion targets CSP violations). Source:\n${src.slice(0, 800)}`,
  );
});

test("AC-1 (leg C — viewport-overflow): trust-verification.spec.mjs iterates the seven widths and asserts no horizontal scroll", () => {
  assert.ok(existsSync(TV_SPEC), `trust-verification.spec.mjs missing at ${TV_SPEC}`);
  const src = readFileSync(TV_SPEC, "utf8");

  // All seven literal widths must appear in the source (the iterated viewport set).
  for (const w of VIEWPORT_WIDTHS) {
    assert.match(
      src,
      new RegExp(`\\b${w}\\b`),
      `trust-verification.spec.mjs (leg C) must iterate viewport width ${w} (the seven widths are 320/375/414/768/1024/1280/1440). Source:\n${src}`,
    );
  }
  // The no-horizontal-scroll assertion compares scrollWidth vs clientWidth (or an
  // explicit overflow check).
  assert.match(
    src,
    /scrollWidth|clientWidth|overflow/i,
    `trust-verification.spec.mjs (leg C) must assert no horizontal scroll via scrollWidth <= clientWidth (or an overflow check). Source:\n${src.slice(0, 1200)}`,
  );
  // setViewportSize is how Playwright iterates widths — anchor the iteration.
  assert.match(
    src,
    /setViewportSize|viewport/i,
    `trust-verification.spec.mjs (leg C) must set the viewport per width (page.setViewportSize). Source:\n${src.slice(0, 1200)}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: tests/perf/lighthouserc.json exists, parses, and encodes the four
// budgets (FCP<1.5s, LCP<2.5s, TTI<3.0s, CLS<0.05) + a mobile/Slow-4G/mid-tier
// throttle profile.
// ─────────────────────────────────────────────────────────────────────

test("AC-3: tests/perf/lighthouserc.json exists and is valid JSON", () => {
  assert.ok(
    existsSync(LIGHTHOUSERC),
    `tests/perf/lighthouserc.json must exist (currently tests/perf/ holds only .gitkeep). Missing at ${LIGHTHOUSERC}`,
  );
  const raw = readFileSync(LIGHTHOUSERC, "utf8");
  assert.doesNotThrow(
    () => JSON.parse(raw),
    `tests/perf/lighthouserc.json must be valid JSON.`,
  );
});

test("AC-3: lighthouserc.json encodes the four perf budgets (FCP<1.5s/1500, LCP<2.5s/2500, TTI<3.0s/3000, CLS<0.05)", () => {
  assert.ok(existsSync(LIGHTHOUSERC), `lighthouserc.json missing at ${LIGHTHOUSERC}`);
  const raw = readFileSync(LIGHTHOUSERC, "utf8");
  // Parse to ensure validity, but assert on the raw text so the budget numbers /
  // metric ids are anchored regardless of nesting shape (ci.assert.assertions).
  JSON.parse(raw);

  // The four metric audits LHCI uses for these budgets.
  assert.match(
    raw,
    /first-contentful-paint/,
    `lighthouserc.json must assert the first-contentful-paint (FCP) budget. Source:\n${raw}`,
  );
  assert.match(
    raw,
    /largest-contentful-paint/,
    `lighthouserc.json must assert the largest-contentful-paint (LCP) budget. Source:\n${raw}`,
  );
  assert.match(
    raw,
    /interactive/,
    `lighthouserc.json must assert the interactive (TTI) budget. Source:\n${raw}`,
  );
  assert.match(
    raw,
    /cumulative-layout-shift/,
    `lighthouserc.json must assert the cumulative-layout-shift (CLS) budget. Source:\n${raw}`,
  );

  // The literal threshold values (LHCI maxNumericValue is in ms for timings).
  assert.match(
    raw,
    /\b1500\b/,
    `lighthouserc.json must encode the FCP < 1.5s budget as 1500 (ms). Source:\n${raw}`,
  );
  assert.match(
    raw,
    /\b2500\b/,
    `lighthouserc.json must encode the LCP < 2.5s budget as 2500 (ms). Source:\n${raw}`,
  );
  assert.match(
    raw,
    /\b3000\b/,
    `lighthouserc.json must encode the TTI < 3.0s budget as 3000 (ms). Source:\n${raw}`,
  );
  assert.match(
    raw,
    /0\.05\b/,
    `lighthouserc.json must encode the CLS < 0.05 budget as 0.05. Source:\n${raw}`,
  );
});

test("AC-3: lighthouserc.json sets a mobile / Slow-4G / mid-tier throttle profile", () => {
  assert.ok(existsSync(LIGHTHOUSERC), `lighthouserc.json missing at ${LIGHTHOUSERC}`);
  const raw = readFileSync(LIGHTHOUSERC, "utf8");
  JSON.parse(raw);

  // Mobile form-factor (mid-tier Android emulation).
  assert.match(
    raw,
    /mobile/i,
    `lighthouserc.json (ci.collect.settings) must use a mobile form-factor (mid-tier Android emulation). Source:\n${raw}`,
  );
  // Slow-4G throttling — either the named preset or an explicit throttling block.
  assert.match(
    raw,
    /Slow.?4G|slow4g|throttl/i,
    `lighthouserc.json must encode a Slow-4G throttle profile (e.g. preset "desktop"→no; mobile Slow-4G via throttling/--preset). Source:\n${raw}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-4: at least one tests/a11y/*.spec.mjs exists + references axe-core (pa11y
// fallback) run against methodology + SPA surfaces.
// ─────────────────────────────────────────────────────────────────────

function a11ySpecs() {
  if (!existsSync(A11Y_DIR)) return [];
  return readdirSync(A11Y_DIR).filter((f) => f.endsWith(".spec.mjs"));
}

test("AC-4: at least one tests/a11y/*.spec.mjs exists", () => {
  const specs = a11ySpecs();
  assert.ok(
    specs.length >= 1,
    `tests/a11y/ must contain at least one *.spec.mjs (currently holds only .gitkeep). Found: ${JSON.stringify(specs)}`,
  );
});

test("AC-4: an a11y spec references axe-core (pa11y documented as fallback) against methodology + SPA surfaces", () => {
  const specs = a11ySpecs();
  assert.ok(specs.length >= 1, `no tests/a11y/*.spec.mjs found (see prior assertion).`);

  // Concatenate the a11y spec sources; the contract may be split across files.
  const sources = specs.map((f) => readFileSync(join(A11Y_DIR, f), "utf8"));
  const joined = sources.join("\n\n");

  // axe-core is the primary runner.
  assert.match(
    joined,
    /axe-?core|@axe-core|AxeBuilder|\baxe\b/i,
    `a tests/a11y/*.spec.mjs must reference axe-core (the primary a11y runner). Sources:\n${joined.slice(0, 1000)}`,
  );
  // pa11y is documented as the fallback runner.
  assert.match(
    joined,
    /pa11y/i,
    `a tests/a11y/*.spec.mjs must document pa11y as the fallback runner. Sources:\n${joined.slice(0, 1000)}`,
  );
  // Methodology pages are an audited surface.
  assert.match(
    joined,
    /methodology/i,
    `a tests/a11y/*.spec.mjs must run axe against the methodology page surface. Sources:\n${joined.slice(0, 1500)}`,
  );
  // SPA surfaces are audited — anchor on at least one SPA scene name.
  assert.match(
    joined,
    /landing|consent|item-?runner|result|tail-?scene/i,
    `a tests/a11y/*.spec.mjs must run axe against the SPA surfaces (landing/consent/item-runner/result/tail-scenes). Sources:\n${joined.slice(0, 1500)}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-2 / AC-3 / AC-4 / AC-5 (wiring): pr-checks.yml declares the active jobs,
// each per-spec wired (lesson-2026-06-03-001: the spec FILENAME must appear in
// pr-checks.yml — no greedy glob).
// ─────────────────────────────────────────────────────────────────────

test("AC-2: pr-checks.yml declares an ACTIVE trust-verification-full job running trust-verification.spec.mjs", () => {
  const text = loadPrChecks();
  const { idx, body } = jobBody(text, "trust-verification-full", 20);
  assert.notEqual(
    idx,
    -1,
    `pr-checks.yml must declare a "  trust-verification-full:" job at the jobs: top level (net-new in Story 8.5). Got pr-checks.yml head:\n${text.slice(0, 200)}`,
  );
  // ACTIVE — no `if: false` in the job body.
  assert.doesNotMatch(
    body,
    /^\s*if:\s*(false|\$\{\{\s*false\s*\}\})/m,
    `trust-verification-full must be ACTIVE (no "if: false"). Body:\n${body}`,
  );
  // Per-spec wired (lesson-2026-06-03-001): the spec filename appears in the body
  // via an explicit `npx playwright test tests/playwright/trust-verification.spec.mjs`.
  assert.match(
    body,
    /tests\/playwright\/trust-verification\.spec\.mjs/,
    `trust-verification-full must run tests/playwright/trust-verification.spec.mjs explicitly (per-spec, not a glob — lesson-2026-06-03-001). Body:\n${body}`,
  );
});

test("AC-3 (wiring): pr-checks.yml runs `lhci autorun` referencing tests/perf/lighthouserc.json inside the (already-active) lighthouse job", () => {
  const text = loadPrChecks();
  const { idx, body } = jobBody(text, "lighthouse", 60);
  assert.notEqual(idx, -1, `pr-checks.yml must declare the "  lighthouse:" job (already active, Story 6.4).`);

  // lhci autorun is the perf-budget leg Story 8.5 ADDS (not a new job, not an if: flip).
  assert.match(
    body,
    /lhci\s+autorun/,
    `the lighthouse job must run "lhci autorun" (the Story-8.5 perf-budget leg). Body:\n${body}`,
  );
  // It must reference the lighthouserc.json config path so the budgets are loaded.
  assert.match(
    body,
    /tests\/perf\/lighthouserc\.json/,
    `the lhci autorun leg must reference tests/perf/lighthouserc.json (config path). Body:\n${body}`,
  );
  // The Story-6.4 accessibility legs are preserved (lhci ADDS, does not replace).
  assert.match(
    body,
    /accessibility/i,
    `the lighthouse job must PRESERVE its Story-6.4 accessibility legs (lhci is added, not a replacement). Body:\n${body}`,
  );
});

test("AC-4 (wiring): pr-checks.yml axe-core-pa11y job is ACTIVE and runs a tests/a11y/*.spec.mjs per-spec", () => {
  const text = loadPrChecks();
  const { idx, body } = jobBody(text, "axe-core-pa11y", 20);
  assert.notEqual(idx, -1, `pr-checks.yml must declare the "  axe-core-pa11y:" job.`);

  // ACTIVE — no `if: false`.
  assert.doesNotMatch(
    body,
    /^\s*if:\s*(false|\$\{\{\s*false\s*\}\})/m,
    `axe-core-pa11y must be ACTIVATED (no "if: false"; was deferred "Activates in Epic 6"). Body:\n${body}`,
  );
  // Must run a real Playwright a11y spec — not the echo stub.
  assert.doesNotMatch(
    body,
    /echo\s+["']?stub/i,
    `axe-core-pa11y must run a real a11y spec, not the "echo stub" placeholder. Body:\n${body}`,
  );
  // Per-spec wired: an explicit tests/a11y/<name>.spec.mjs reference in the body.
  assert.match(
    body,
    /tests\/a11y\/[^\s'"]+\.spec\.mjs/,
    `axe-core-pa11y must run an explicit tests/a11y/<name>.spec.mjs (per-spec — the a11y spec filename must appear in pr-checks.yml, lesson-2026-06-03-001). Body:\n${body}`,
  );
});

test("AC-5 (wiring): csp-violation-count + viewport-overflow jobs are ACTIVE (no `if: false`, no echo stub)", () => {
  const text = loadPrChecks();
  for (const job of ["csp-violation-count", "viewport-overflow"]) {
    const { idx, body } = jobBody(text, job, 20);
    assert.notEqual(idx, -1, `pr-checks.yml must declare the "  ${job}:" job.`);
    assert.doesNotMatch(
      body,
      /^\s*if:\s*(false|\$\{\{\s*false\s*\}\})/m,
      `${job} must be ACTIVATED (no "if: false"). Body:\n${body}`,
    );
    assert.doesNotMatch(
      body,
      /echo\s+["']?stub/i,
      `${job} must run a real Playwright assertion, not the "echo stub" placeholder. Body:\n${body}`,
    );
    // The activated job must run a real Playwright spec (consolidated trust-verification
    // spec or a dedicated one — engineer's choice — but a real .spec.mjs run).
    assert.match(
      body,
      /playwright test [^\n]*\.spec\.mjs/,
      `${job} must run a real "npx playwright test <...>.spec.mjs" (consolidated trust-verification.spec.mjs or a dedicated spec). Body:\n${body}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-6: cropping-fuzzer confirmed active + bankFrozen-gated (no flip needed).
// Structural confirmation only — no code edit to cropping-fuzzer.spec.mjs.
// ─────────────────────────────────────────────────────────────────────

test("AC-6: cropping-fuzzer is present + active (no `if: false`) + bankFrozen-gated", () => {
  const text = loadPrChecks();
  const { idx, body } = jobBody(text, "cropping-fuzzer", 20);
  assert.notEqual(idx, -1, `pr-checks.yml must declare the "  cropping-fuzzer:" job (already active, Story 6.6).`);
  assert.doesNotMatch(
    body,
    /^\s*if:\s*(false|\$\{\{\s*false\s*\}\})/m,
    `cropping-fuzzer must remain ACTIVE (no "if: false"). Body:\n${body}`,
  );
  assert.match(
    body,
    /tests\/playwright\/cropping-fuzzer\.spec\.mjs/,
    `cropping-fuzzer must run tests/playwright/cropping-fuzzer.spec.mjs. Body:\n${body}`,
  );

  // The self-gate on corpus/manifest.json bankFrozen lives in the spec; confirm
  // the spec still self-gates and the corpus is frozen (forward-running on PRs).
  const fuzzerSpec = join(REPO_ROOT, "tests", "playwright", "cropping-fuzzer.spec.mjs");
  assert.ok(existsSync(fuzzerSpec), `cropping-fuzzer.spec.mjs missing at ${fuzzerSpec}`);
  const spec = readFileSync(fuzzerSpec, "utf8");
  assert.match(
    spec,
    /bankFrozen/,
    `cropping-fuzzer.spec.mjs must self-gate on corpus bankFrozen. Source:\n${spec.slice(0, 600)}`,
  );
  const manifest = join(REPO_ROOT, "corpus", "manifest.json");
  assert.ok(existsSync(manifest), `corpus/manifest.json missing at ${manifest}`);
  const m = JSON.parse(readFileSync(manifest, "utf8"));
  assert.equal(
    m.bankFrozen,
    true,
    `corpus/manifest.json bankFrozen must be true so cropping-fuzzer runs live forward (AC-6). Got: ${JSON.stringify(m.bankFrozen)}`,
  );
});
