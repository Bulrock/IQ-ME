// tests/playwright/reveal-stage.spec.mjs
//
// Story 6.1 AC-5 — reveal-stage Playwright event-ordering spec.
//
// Drives the SPA from session-complete through the full reveal sequence
// and asserts every stage of the ADR-3-1 enumeration fires EXACTLY ONCE,
// IN ORDER, with monotonically non-decreasing `t`. Contract violations
// (stage skip / repeat / out-of-order) fail with a stage-name diagnostic.
//
// Uses the existing test-hook surface (`window.__IQME_TEST__`) for
// deterministic-seed bootstrap per the full-slice.spec.mjs pattern.
//
// RED-PHASE NOTE: this spec is expected to fail today because the
// dispatcher in `src/assessment/reveal-stage.js` only knows the v1
// enumeration `["anchor", "handoff"]`. Story 6.1 Task 1 graduates the
// `O` array to the full 6-stage list; until then the recorder will
// capture fewer than 6 events (or events with the wrong stage names).

import { test, expect } from "@playwright/test";
import { start } from "../../tools/dev-server.mjs";

const EXPECTED_SEQUENCE = [
  "anchor",
  "band",
  "interval",
  "context",
  "tail-scene",
  "methodology-handoff",
];

let server;

test.beforeAll(async () => {
  server = await start(0);
});

test.afterAll(async () => {
  if (server) await server.close();
});

/**
 * Install an `iqme:reveal-stage` recorder on the page BEFORE any reveal
 * sequence runs. The recorder writes captured `event.detail` snapshots
 * into `window.__IQME_REVEAL_EVENTS__` for post-hoc assertion.
 *
 * Must be added via `addInitScript` so it lands before any module that
 * dispatches the event evaluates.
 */
async function installRecorder(page) {
  await page.addInitScript(() => {
    window.__IQME_REVEAL_EVENTS__ = [];
    document.addEventListener("iqme:reveal-stage", (ev) => {
      // Defensive snapshot — copy primitives only.
      const detail = ev.detail || {};
      window.__IQME_REVEAL_EVENTS__.push({
        stage: detail.stage,
        t: typeof detail.t === "number" ? detail.t : null,
      });
    });
  });
}

/**
 * Drive the SPA from cold-start through to the end of the reveal sequence,
 * using the test-hook deterministic-seed path.
 */
async function driveFullReveal(page, origin) {
  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  // Deterministic-seed shortcut: bypass consent + 16-item session, jump to result.
  await page.evaluate(() => window.__IQME_TEST__.resetState());
  await page.evaluate(() => {
    window.__IQME_TEST__.setSeed("0123456789abcdef0123456789abcdef");
    for (let i = 0; i < 16; i++) {
      window.__IQME_TEST__.recordResponse(i, i % 2);
    }
    window.__IQME_TEST__.navigate("result");
  });

  // Anchor beat surfaces first — the rest of the sequence is driven by
  // Show-Me click + scheduled dwell from reveal-stage-timings.json.
  await expect(page.locator('[data-reveal-stage="anchor"]')).toBeVisible();
  await page.getByRole("button", { name: /show me/i }).click();
  await expect(page.locator(".score-panel")).toBeVisible();

  // Wait until the recorder has captured the full expected sequence
  // (or a timeout-bounded failure-mode bound — never sleep-loop).
  await page.waitForFunction(
    (expectedLen) => (window.__IQME_REVEAL_EVENTS__?.length ?? 0) >= expectedLen,
    EXPECTED_SEQUENCE.length,
    { timeout: 10_000 },
  );
}

// ─── AC-5: full 6-stage sequence fires exactly once, in order ────────────

test("AC-5: full 6-stage iqme:reveal-stage sequence fires exactly once each, in declared order", async ({ page }) => {
  await installRecorder(page);
  const origin = `http://127.0.0.1:${server.port}`;
  await driveFullReveal(page, origin);

  const captured = await page.evaluate(() => window.__IQME_REVEAL_EVENTS__);

  // Exactly 6 events.
  expect(
    captured.length,
    `expected exactly ${EXPECTED_SEQUENCE.length} reveal-stage events; got ${captured.length}: ${JSON.stringify(captured)}`,
  ).toBe(EXPECTED_SEQUENCE.length);

  // Stages in declared order.
  const stages = captured.map((e) => e.stage);
  expect(
    stages,
    `stages must fire in declared order; expected ${JSON.stringify(EXPECTED_SEQUENCE)}, got ${JSON.stringify(stages)}`,
  ).toEqual(EXPECTED_SEQUENCE);

  // No stage repeats (redundant with order check but pinpoint diagnostic on failure).
  const unique = new Set(stages);
  expect(
    unique.size,
    `no stage may repeat; got duplicates in ${JSON.stringify(stages)}`,
  ).toBe(EXPECTED_SEQUENCE.length);
});

// ─── AC-5: monotonic-non-decreasing t across the full sequence ───────────

test("AC-5: detail.t is monotonically non-decreasing across the full 6-stage sequence", async ({ page }) => {
  await installRecorder(page);
  const origin = `http://127.0.0.1:${server.port}`;
  await driveFullReveal(page, origin);

  const captured = await page.evaluate(() => window.__IQME_REVEAL_EVENTS__);
  expect(captured.length, `need ${EXPECTED_SEQUENCE.length} events for t-monotonicity check`).toBe(EXPECTED_SEQUENCE.length);

  for (let i = 1; i < captured.length; i++) {
    const prev = captured[i - 1];
    const curr = captured[i];
    expect(
      typeof prev.t === "number" && Number.isFinite(prev.t),
      `event[${i - 1}] (stage='${prev.stage}') detail.t must be a finite number; got ${prev.t}`,
    ).toBe(true);
    expect(
      typeof curr.t === "number" && Number.isFinite(curr.t),
      `event[${i}] (stage='${curr.stage}') detail.t must be a finite number; got ${curr.t}`,
    ).toBe(true);
    expect(
      curr.t,
      `event[${i}] (stage='${curr.stage}', t=${curr.t}) must have t >= event[${i - 1}] (stage='${prev.stage}', t=${prev.t}) — monotonic non-decreasing`,
    ).toBeGreaterThanOrEqual(prev.t);
  }
});

// ─── AC-5 negative: forced out-of-order dispatch surfaces error ──────────
//
// PRECONDITION (engineer): for this negative case to be deterministic,
// the SPA must expose either (a) a test-hook affordance to force a
// dispatchStage() call from the page (e.g. `window.__IQME_TEST__.forceRevealStage(stage)`)
// or (b) accept that the dispatcher's Story-3.5 ordering invariant
// already throws synchronously when an out-of-order stage is dispatched
// via the imported module. This spec drives the assertion via dynamic
// module import inside the page context, which works because the SPA
// loads `src/assessment/reveal-stage.js` as part of its module graph
// and the export `dispatchStage` is the same singleton.
//
// If this approach proves brittle (e.g. due to module-graph isolation),
// engineer should expose `window.__IQME_TEST__.forceRevealStage(stage)`
// and this test will be updated accordingly. Flagged in story File List
// notes for engineer attention.

test("AC-5 negative: out-of-order dispatch throws (band before anchor)", async ({ page }) => {
  await installRecorder(page);
  const origin = `http://127.0.0.1:${server.port}`;

  await page.goto(`${origin}/?test=1`);
  await page.waitForFunction(() => window.__IQME_TEST__ !== undefined);

  // Reset state so no stage has fired yet for this session.
  await page.evaluate(() => window.__IQME_TEST__.resetState());

  // Attempt out-of-order dispatch via dynamic module import. The
  // dispatcher's Story-3.5 invariant (preserved in Story 6.1 Task 1) is
  // that any stage other than the first non-fired stage in declared
  // order throws Error matching /declared order/i.
  const result = await page.evaluate(async () => {
    try {
      const mod = await import("/src/assessment/reveal-stage.js");
      mod.resetRevealStage();
      mod.dispatchStage("band"); // out-of-order: band before anchor.
      return { threw: false, message: null, errorName: null };
    } catch (err) {
      return {
        threw: true,
        message: err && err.message,
        errorName: err && err.constructor && err.constructor.name,
      };
    }
  });

  expect(
    result.threw,
    `out-of-order dispatch (band before anchor) must throw; instead resolved cleanly: ${JSON.stringify(result)}`,
  ).toBe(true);
  expect(
    /declared order/i.test(result.message || ""),
    `out-of-order error message must match /declared order/i; got: ${result.message}`,
  ).toBe(true);
});
