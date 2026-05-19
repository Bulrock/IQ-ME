# Test Review — Story 3-3-implement-landing-consent-scene-en (cycle 1)

**Date:** 2026-05-19
**Reviewer:** independent (clean-context test-review subagent)
**Files reviewed:** 5 (`tests/unit/main.test.mjs`, `routing.test.mjs`, `landing-scene.test.mjs`, `consent-scene.test.mjs`, `locale-loader.test.mjs`)
**Red-phase status:** 38 failing tests, 0 regressions in 312-baseline (verified via `make test`).

## Verdict: **needs-revision**

The test suite has substantial breadth and good hygiene on forbidden patterns, but it suffers from two structural blockers (regex-based HTML parsers that force non-spec attribute ordering on impl) and seven high-severity missing assertions — most consequentially, **none of the 12 consent-scene tests verify the three required disclosure paragraphs (FR9/FR10/NFR13)**, which are the actual informed-consent substance of AC-5.

## Findings summary

| Severity | Count | Categories |
|---|---|---|
| Blocker | 2 | regex-parser-brittleness, implementation-detail-leak |
| High | 7 | ac-coverage-gap, missing-assertion, mock-quality |
| Medium | 11 | fragility, missing-assertion, error-path-coverage, ID-based test ordering |
| Low / observation | 5 | non-blocking polish |

## Blocker findings

### F-01 — `consent-scene.test.mjs` regex parser forces attribute ordering not in the spec
- **Category:** regex-parser-brittleness / implementation-detail-leak
- **File:** `tests/unit/consent-scene.test.mjs:114-183`
- **Severity:** blocker
- **Issue:** The `makeRootEl` setter parses innerHTML via a chain of regexes, each of which assumes a *specific* attribute order. Line 159's button regex `<button[^>]*id="…"[^>]*aria-disabled="…"[^>]*class="…"[^>]*>` requires `id` before `aria-disabled` before `class`. Line 171's anchor regex requires `id` before `href`. Spec AC-5 does not mandate attribute order. The ATDD report at lines 99-100 explicitly tells impl to "write template literal exactly matching the regex shapes in the test files." That inverts the contract — tests are derived from the spec, not vice versa. This is the canonical "Testing Implementation Details" anti-pattern from `forbidden-patterns.md` ("refactor-fragile — internal change breaks test без behavior change"). A spec-compliant impl that writes `<button class="..." aria-disabled="true" id="continue-btn">` (alphabetical or natural authoring order) will fail every consent-scene test for a reason unrelated to spec compliance.
- **Additionally:** the test file's parser has no handler for the spec-mandated `<div class="consent-scene__cta-group">` wrapper (spec line 77). If impl renders the wrapper per spec, the button regex still scrapes the button (because regex flattens), but tests like AC-5.2 cannot verify the spec-required structural nesting.
- **Suggested fix:** Replace the regex chain with a tiny attribute-order-agnostic tokenizer (~40 lines) extracted to `tests/unit/_dom-stub.mjs`. Parse one element at a time via a generic `<tag\s+([^>]*)>` capture; then split the attribute string into `key="value"` pairs and store in a map. Both scene tests reuse the helper. Alternative path: change the impl contract to `document.createElement` + property assignment, which the stub can observe natively without parsing innerHTML at all — but that's an impl constraint that should be either explicit in the spec or invisible to it.

### F-02 — `landing-scene.test.mjs` regex parser has the same attribute-order problem
- **Category:** regex-parser-brittleness / implementation-detail-leak
- **File:** `tests/unit/landing-scene.test.mjs:104-150`
- **Severity:** blocker
- **Issue:** Identical structural issue as F-01. Lines 104, 111, 119, 127, 133, 143 — each regex bakes in a specific attribute order (`class` before `aria-labelledby`, `id` before `class` in the heading, `class` before `href` in the methodology anchor, `id` before `class` in the start button). Spec AC-4 does not pin attribute order. Impl writing `<a href="/methodology/v1.0.0/en/" class="landing__methodology-link">…</a>` (alphabetical) will fail AC-4.6 even though the methodology URL contract is satisfied character-exact.
- **Suggested fix:** same as F-01 — shared tokenizer helper.

## High-severity findings

### F-03 — Missing structural-nesting assertion for Continue button placement
- **Category:** missing-assertion / ac-coverage-gap
- **File:** `tests/unit/consent-scene.test.mjs:231-240` (AC-5.2)
- **Severity:** high
- **Issue:** Spec AC-5 line 77-78 mandates the Continue button live inside `<div class="consent-scene__cta-group">`. Test asserts only that `#continue-btn` exists somewhere under the section subtree. Impl could place the button as a direct child of `<section>` and the test passes.
- **Suggested fix:** Add `assert.ok(root.querySelector(".consent-scene__cta-group > #continue-btn"))` once the parser supports descendant selectors, OR walk the children: `const ctaGroup = root.querySelector(".consent-scene__cta-group"); assert.ok(ctaGroup.children.find(c => c.attrs?.id === "continue-btn"))`.

### F-04 — Sentinel placement assertion does not pin spec-required position
- **Category:** missing-assertion / ac-coverage-gap
- **File:** `tests/unit/consent-scene.test.mjs:242-250` (AC-5.3)
- **Severity:** high
- **Issue:** Spec AC-5 line 82: sentinel "appended as the **last child of the envelope**." Test asserts sentinel exists anywhere in the tree. The IntersectionObserver FR12 semantics depend on the sentinel being at the envelope's geometric end — its position is the contract, not its mere existence.
- **Suggested fix:** Assert the sentinel's parent is `.consent-scene__envelope` AND it is that parent's last child element: `assert.equal(envelope.children[envelope.children.length - 1], sentinel)`.

### F-05 — **CRITICAL: zero coverage of the three FR9/FR10/NFR13 disclosure paragraphs**
- **Category:** ac-coverage-gap
- **File:** `tests/unit/consent-scene.test.mjs` (entire file)
- **Severity:** high
- **Issue:** Spec AC-5 line 73-75 enumerates three required `<p>` elements: `.consent-scene__measures-what` (FR9 — what the instrument measures), `.consent-scene__validity-envelope` (FR10 — validity envelope), `.consent-scene__visuospatial-disclosure` (NFR13 — screen-reader non-equivalence). None of the 12 tests assert that any of these three paragraphs are rendered. The ATDD report frames the consent-scene tests as covering "FR12 dwell-gate state machine — every transition covered," missing the substance entirely. Impl could render `<section class="consent-scene">` containing only the Continue button and Not-today link — passing every test — and ship a fully non-compliant consent scene with zero disclosure text. This is the most consequential gap in the suite.
- **Suggested fix:** Add three tests (AC-5.13, 5.14, 5.15) each asserting (a) the paragraph exists with the right class, (b) the paragraph's textContent comes from the correct i18n key (`consent.measuresWhat` / `consent.validityEnvelope` / `consent.visuospatialDisclosure`), (c) the paragraph is a descendant of `.consent-scene__envelope`. Stub `STRINGS.consent` with sentinel values like `"__C_MEASURES__"` and assert each appears in the corresponding `<p>` textContent.

### F-06 — AC-5.10 does not verify `state.resetState()` is actually called
- **Category:** missing-assertion / ac-coverage-gap
- **File:** `tests/unit/consent-scene.test.mjs:339-348`
- **Severity:** high
- **Issue:** Spec AC-5 line 85: "clicking #not-today-link calls state.resetState() from state.js." The test only asserts `ev.defaultPrevented === false`. The behavioral contract — resetState invocation — is unverified at the test layer. AC-5.12 source-greps for the string `resetState` in `consent.js`, which can be satisfied by an unreachable code path or a comment. **The FR11 "Not today" reset is the most user-visible privacy guarantee in the story** and it has zero behavioral coverage.
- **Suggested fix:** Import `state.js` at the top of `consent-scene.test.mjs` (state.js already exists from Story 3-2). Before each consent test, call `setSeed(...)`, `setItem(5)`, `recordResponse(5, 1)` to populate state. Click #not-today-link. Assert `getState().responses.length === 0` AND `getState().currentItem === 0` (the post-resetState invariant — observable via state.js's existing public API). No spy needed.

### F-07 — AC-5.9 does not verify `routing.navigate('test')` is called after gate flip
- **Category:** missing-assertion / tautology
- **File:** `tests/unit/consent-scene.test.mjs:322-337`
- **Severity:** high
- **Issue:** The test calls `t.mock.timers.tick(5000)` to flip the gate, then clicks the Continue button, and asserts only `assert.doesNotThrow(...)`. The actual contract (`routing.navigate('test')` is invoked) is not tested. AC-5.12 source-greps for `navigate\(['"]test['"]\)` in the source, but source presence does not prove wire-up to the click handler.
- **Suggested fix:** Replace `globalThis.window.location.hash` setter with an instrumented stub that captures all hash mutations. Assert after the post-flip click that `window.location.hash === '#/test'`. Alternative: if consent.js imports `navigate` as a named import, the SUT-side import can be observed via the location.hash side effect (which `navigate` produces per AC-3.4).

### F-08 — `main.test.mjs` AC-2.2 idempotency test passes when impl is non-idempotent
- **Category:** missing-assertion / mock-quality
- **File:** `tests/unit/main.test.mjs:97-106`
- **Severity:** high
- **Issue:** Test calls `start()` twice and asserts the second call doesn't reject. A non-idempotent impl that re-bootstraps every call but doesn't error passes the test. The contract is "second call is a no-op" (spec line 38). Test does not distinguish "no-op" from "re-bootstraps cleanly." Test-author defers to "integration coverage in Story 3-7" — but the local AC has zero local coverage. This matches the deferred-validation hotfix-risk pattern from `lesson-2026-05-19-009`.
- **Suggested fix:** Expose an observable side effect. Options: (a) introduce a stub for `routing.start` via a sibling test-helper that counts invocations — requires ESM intercept (rejected by test-author for good reason); (b) add a test-internal counter via `globalThis.__test_routing_start_count` that the impl increments at its routing-start callsite, then asserts the count is exactly 1 after two `start()` calls (test-only contamination, defensible if marked `// @internal — test-only counter`); (c) accept the limitation and rename the test to "AC-2.2: second start() does not throw or reject" — honest about what's being asserted. Recommend (c) for cycle 2 — F-08 is downgraded from "deceptive test" to "honest narrow test."

### F-09 — `routing.test.mjs` does not stub `landing.js` dependency
- **Category:** mock-quality / fragility
- **File:** `tests/unit/routing.test.mjs:63-97`
- **Severity:** high
- **Issue:** The router per spec line 47 dispatches scene renders. `routing.js` must import `landing.js` (which the spec requires it to call `.render()` on for the `#/` route). In red phase the test "works" because `landing.js` doesn't exist and the SUT import throws — every test fails on the import error. In green phase, when impl is correct, `routing.start()` calls `landing.render(appEl, strings)`. There is no `document.createElement` stub in `routing.test.mjs` (line 63-80 only defines `getElementById`). Whatever landing's `render` does — either `appEl.innerHTML = template` (works against the plain setter) or `appEl.appendChild(createElement(...))` (errors on undefined `createElement`) — will affect this test in non-obvious ways. If landing.js uses `createElement`, every routing test will fail at the green-phase transition with "document.createElement is not a function."
- **Suggested fix:** Make routing tests stub landing.js dependency injection-style — either by exposing a routing-internal `_setRenderers({ landing, consent })` test-only setter, OR by ensuring `routing.test.mjs` has full document stubs that satisfy landing-scene's needs. Recommended: extract the route table to an export `routes` that tests can mutate — `routing.start({ routes: { '#/': mockLandingRender } })` — but that's an impl shape constraint. Cleaner: routing tests should provide a complete `document` stub including `createElement` returning element stubs (same as landing-scene.test.mjs uses), then test what `landing.render` would do indirectly. Or just give landing.js a trivial stub-test mode.

## Medium-severity findings

### F-10 — Idempotency check is listener-count-only; doesn't cover dispatch idempotency
- **Category:** missing-assertion
- **File:** `tests/unit/routing.test.mjs:136-144` (AC-3.3)
- **Severity:** medium
- **Issue:** A second `start()` could refire the initial-render event (calling `onHashChange()` again unconditionally) without adding a listener. Test would pass; observable behavior is wrong.
- **Suggested fix:** Also assert that the second `start()` does not dispatch a second `iqme:route-change` event when the route has not changed.

### F-11 — Cumulative test-state across test() blocks (ID-based ordering anti-pattern)
- **Category:** fragility / forbidden-pattern
- **File:** `tests/unit/locale-loader.test.mjs:56-61`
- **Severity:** medium
- **Issue:** Comment at line 56-61 explicitly says "tests are ordered to compose cumulatively." AC-6.3 and AC-6.4 depend on AC-6.2 having previously loaded EN_BUNDLE into the loader's module cache. `forbidden-patterns.md` ID-based-test-ordering: "Parallel runners, randomised order (vitest --shuffle, pytest-randomly) break." Today's `node --test` is sequential within a file, but the project may add `--test-concurrency` or shuffle in the future, and the contract becomes fragile.
- **Suggested fix:** Use `beforeEach()` to (a) `resetFetch()`, (b) install the EN responder, (c) `await loader.load('en')`. Each test starts from a known cache state. The locale-loader's module-cache won't reset cleanly without a `_clear()` test export, but that's acceptable — what matters is that every test populates the cache it needs rather than relying on the previous test's residue.

### F-12 — `load('ru')` retry test doesn't assert the result of the retry
- **Category:** missing-assertion
- **File:** `tests/unit/locale-loader.test.mjs:106-123` (AC-6.5)
- **Severity:** medium
- **Issue:** Verifies URL sequence (RU first, then EN) but doesn't verify the resolved bundle. Also doesn't pin what `getCurrentLocale()` should be after RU→EN retry. Spec is silent; test should pick one design and pin it.
- **Suggested fix:** Add assertions: `assert.equal(typeof result, "object")` (it resolved with something), and pin `getCurrentLocale()` value — recommend `'en'` since that's the bundle actually served, with the rationale that `get(key)` will read from the served namespace and the locale literal should match.

### F-13 — EN-failure test doesn't verify empty-bundle behavior
- **Category:** missing-assertion / error-path-coverage
- **File:** `tests/unit/locale-loader.test.mjs:125-135` (AC-6.6)
- **Severity:** medium
- **Issue:** Asserts only `doesNotReject`. Doesn't verify that after EN-fail-resolve, `get('landing.headline')` returns the bare key `"landing.headline"` (spec line 92: "highly-visible failure mode"). The architecture-line-837 contract — bare-key fallback under empty cache — is the literal "loud failure" the architecture mandates and is the most important thing this test could check.
- **Suggested fix:** After `loader.load('en')` fails-resolves-with-{}, assert `loader.get('landing.headline') === 'landing.headline'`.

### F-14 — Landing-scene start-button click does not verify navigate is called
- **Category:** missing-assertion / ac-coverage-gap
- **File:** `tests/unit/landing-scene.test.mjs` (entire file)
- **Severity:** medium
- **Issue:** Spec AC-4 line 62: "render attaches a click listener to #start-test-btn that calls routing.navigate('consent')." None of the 8 tests click the button. The frontend consult guidance flagged this as a critical pattern.
- **Suggested fix:** Add AC-4.9 test: render, fire a click event on `#start-test-btn`, assert `window.location.hash === '#/consent'` (works because navigate's contract — verified in routing tests — is to mutate the hash). Same window-stub instrumentation as F-07.

### F-15 — Landing-scene unmount doesn't verify click listener removal
- **Category:** missing-assertion
- **File:** `tests/unit/landing-scene.test.mjs:244-255` (AC-4.7)
- **Severity:** medium
- **Issue:** Spec line 64: "removes the click listener AND clears rootEl.innerHTML." Only the innerHTML half is verified.
- **Suggested fix:** Before unmount, capture the start button reference. After unmount, attempt to click it (or inspect its `listeners.click` array — possible because our stub exposes `listeners`); assert no handler fires.

### F-16 — IO-fire path doesn't verify timer cancellation
- **Category:** missing-assertion
- **File:** `tests/unit/consent-scene.test.mjs:276-291` (AC-5.6)
- **Severity:** medium
- **Issue:** Spec line 81-83: "Whichever fires first wins; the other is cancelled." After IO fires and disconnects, the test does NOT advance the timer to confirm no further state change. Idempotent flipping is the contract; a buggy impl that re-flips aria-disabled or re-runs side effects would pass.
- **Suggested fix:** After IO fire + microtask yield, `t.mock.timers.tick(10000)` (advance past dwell), then assert aria-disabled is still `"false"` (idempotent — not flipping back, not throwing) AND that no second IO was created (`ioInstances.length === 1`).

### F-17 — Timer-flip path doesn't verify IO disconnection
- **Category:** missing-assertion
- **File:** `tests/unit/consent-scene.test.mjs:293-305` (AC-5.7)
- **Severity:** medium
- **Issue:** Symmetric to F-16. After timer flips, IO should disconnect (it's no longer needed). Test doesn't assert this.
- **Suggested fix:** Add `assert.equal(ioInstances[0].disconnected, true, "timer path must disconnect IO")` after the timer tick.

### F-18 — Unmount test only verifies IO disconnection, not timer or listener cleanup
- **Category:** missing-assertion
- **File:** `tests/unit/consent-scene.test.mjs:350-363` (AC-5.11)
- **Severity:** medium
- **Issue:** Spec line 86 mandates: IO disconnect + clearTimeout + remove BOTH click listeners (continue + not-today). Test asserts only IO.
- **Suggested fix:** After unmount: (a) capture the timer ID by instrumenting `globalThis.setTimeout` to track active timer ids — or use `t.mock.timers.tick(5000)` after unmount and assert aria-disabled remained `"true"` (proves the timer was cleared); (b) try-click both `#continue-btn` and `#not-today-link` post-unmount and assert no side effects (listener arrays empty).

### F-19 — Manual hashchange firing in AC-3.5 over-specifies dispatch ordering
- **Category:** fragility
- **File:** `tests/unit/routing.test.mjs:154-169`
- **Severity:** medium
- **Issue:** The test calls `routing.navigate('consent')`, then manually fires the captured hashchange handler. Whether dispatch is "on hashchange" or "directly from navigate" is an impl choice — spec line 47 only says navigation dispatches the event. The test assumes the hashchange-triggered path.
- **Suggested fix:** Two options. (a) Make `globalThis.window.dispatchEvent({type:'hashchange'})` actually call captured handlers (already does — `windowListeners.hashchange`). Then after `navigate`, fire `window.dispatchEvent({type:'hashchange'})` and assert dispatch. Or (b) drop the manual fire entirely; just `navigate('consent')`, then check `dispatchedEvents` regardless of whether impl chose hashchange-driven or direct dispatch. Recommend (b) — less brittle.

### F-20 — `main.test.mjs` doesn't test error-fallback path (NFR20)
- **Category:** error-path-coverage / ac-coverage-gap
- **File:** `tests/unit/main.test.mjs` (entire file)
- **Severity:** medium
- **Issue:** Spec AC-2 line 40 mandates try/catch + `renderErrorFallback` on bootstrap error. Test file has no test that induces an error and verifies fallback content appears. NFR20 path is uncovered.
- **Suggested fix:** Add a test where `globalThis.fetch` (or the locale-loader's fetch path indirectly) throws, then call `start()` and assert that after the promise resolves (or rejects-and-is-handled), `appEl.innerHTML` contains the chrome.errorFallbackMessage string. Requires stubbing locale-loader's fetch to reject. May require shared stub-helper since this is the same fetch surface `locale-loader.test.mjs` instruments.

## Low-severity findings (non-blocking)

### F-21 — Unused variables in `main.test.mjs`
- **File:** `tests/unit/main.test.mjs:21-28`
- **Severity:** low
- **Issue:** `callLog`, `localeLoadShouldReject`, `routingStartShouldThrow` are declared, never read.
- **Suggested fix:** Delete (or use in F-08 / F-20 follow-up tests).

### F-22 — Element-stub helper duplication
- **File:** `tests/unit/landing-scene.test.mjs:31-89` and `tests/unit/consent-scene.test.mjs:55-112`
- **Severity:** low
- **Issue:** ~70 lines of identical helper code duplicated.
- **Suggested fix:** Extract to `tests/unit/_dom-stub.mjs` (leading-underscore precedent from `tests/contract/_state-schema-check.mjs`). Both files import from it. Bonus: the tokenizer fix for F-01/F-02 lives there too.

### F-23 — Long test names
- **Severity:** low
- **Issue:** TAP output is cluttered. Acceptable tradeoff for AC traceability — observation only.
- **Suggested fix:** None required.

### F-24 — `t.mock.timers.reset()` cleanup not failure-safe
- **File:** All `t.mock.timers`-using tests in `tests/unit/consent-scene.test.mjs`
- **Severity:** low
- **Issue:** If an earlier `assert.equal(...)` throws, the cleanup line is not reached and subsequent tests inherit polluted timer state.
- **Suggested fix:** Use `t.after(() => t.mock.timers.reset())` or `try { ... } finally { t.mock.timers.reset(); }`.

### F-25 — Routing test 3.5 "last event" assertion could mask multi-dispatch bugs
- **File:** `tests/unit/routing.test.mjs:163-168`
- **Severity:** low / observation
- **Issue:** Reading only the last dispatched event is fine if the contract is "at least one with the right detail." If impl dispatches `route:''` first then `route:'#/consent'`, test passes. The ADR-3-1 contract may want stricter semantics.
- **Suggested fix:** Document the choice in the test docstring. Optionally tighten: "the event most-recently-after navigate('consent') has detail.route === '#/consent'."

## Non-finding observations

- **Forbidden-pattern hygiene:** all 5 files comply with `forbidden-patterns.md` core rules. No real `fetch`, no real `setTimeout` waits, no JSDOM, no `Date.now`/`Math.random`/`console.log` in test bodies.
- **AC-2 file decision:** the test-author's choice to add a 5th `main.test.mjs` (per consult recommendation) is correct — folding AC-2 into routing.test would conflate two contracts.
- **Methodology URL contract:** AC-4.6 asserts `/methodology/v1.0.0/en/` character-exact. This is right — it's the ADR-3-1 contract and tests are the right place to lock it.
- **State.js integration potential:** the test files do not import state.js, but state.js is shipped from Story 3-2 and exports a clean public API. F-06 leverages this for FR11 verification at low cost.

## What cycle 2 should change

**Mandatory (blocker + high):**
1. Replace regex parsing in both scene tests with a shared attribute-order-agnostic tokenizer in `tests/unit/_dom-stub.mjs` (F-01, F-02).
2. Add three tests for the FR9/FR10/NFR13 disclosure paragraphs in consent-scene.test.mjs (F-05).
3. Pin sentinel-in-envelope placement (F-04).
4. Pin Continue-button-in-cta-group placement (F-03).
5. Verify state.resetState behavior via state.js's public API in the Not-today click test (F-06).
6. Verify routing.navigate('test') via window.location.hash mutation in the post-flip Continue click test (F-07).
7. Rename or strengthen main.test.mjs's idempotency test (F-08).
8. Provide full document stubs in routing.test.mjs to survive green-phase landing.render integration (F-09).

**Recommended (medium):**
9. F-11 (beforeEach in locale-loader.test.mjs), F-13 (bare-key fallback under empty bundle), F-14 (landing start-btn click→navigate), F-15 (landing unmount listener cleanup), F-16/F-17/F-18 (consent-scene cleanup/cancellation assertions), F-19 (less brittle hashchange firing), F-20 (main.test.mjs error-fallback path).

**Optional (low):** F-21 (delete dead code), F-22 (DRY DOM stub), F-24 (`t.after` cleanup), F-25 (document the "last event" assertion semantics).

## Re-review handoff

When test-author cycle 2 completes:
- Re-run `make test` and confirm: tests still all-red (since impl is not landed), and the failure count remains in roughly the same magnitude (the structural fixes should not gut coverage).
- Provide an updated ATDD report at `/tmp/atdd-report-3-3-cycle-2.md` covering: (a) which findings were addressed and how, (b) any findings explicitly deferred with rationale per the closed-list halt-conditions in `bmad-tds-test-author` (caps F-08 honesty as acceptable per Karpathy #2 simplicity; otherwise full fix expected).
- Re-invoke `/bmad-testarch-test-review` (different clean-context subagent if available) for cycle-2 verdict.
