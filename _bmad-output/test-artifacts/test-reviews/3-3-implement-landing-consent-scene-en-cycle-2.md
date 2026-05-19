# Test Review — Story 3-3-implement-landing-consent-scene-en (cycle 2)

**Date:** 2026-05-19
**Reviewer:** independent (clean-context test-review subagent, cycle-2)
**Files reviewed:** 5 test files + 1 new helper module — `tests/unit/{_dom-stub.mjs, main.test.mjs, routing.test.mjs, landing-scene.test.mjs, consent-scene.test.mjs, locale-loader.test.mjs}`.
**Red-phase status (re-verified):** 355 tests, 312 pass (baseline preserved, 0 regressions), 43 fail, exit 1. Cycle-1 baseline was 38 fail; +5 net from new tests AC-2.3 (NFR20), AC-4.9 (start-btn click), AC-5.13/14/15 (FR9/FR10/NFR13 disclosure paragraphs).

## Verdict: **approved**

Cycle-2 addresses every cycle-1 blocker and high-severity finding with concrete file-level evidence. The most consequential cycle-1 gap — F-05, missing coverage of the FR9/FR10/NFR13 disclosure paragraphs — is now closed by three dedicated tests (AC-5.13/14/15). All eleven cycle-1 mediums are also resolved. The two cycle-1 lows that remained "observation only" (F-23 long test names, F-25 "any dispatched event" semantics) are non-blocking.

The new `tests/unit/_dom-stub.mjs` tokenizer is well-built: attribute-order-agnostic, supports descendant selectors, correctly handles text content + element-children, and is shared by all four scene-touching test files. Minor latent quirks exist (see §Observations below) but none affect the spec-following impl path.

The bar for cycle-2 approval — "frontend specialist can implement against these tests without contract distortion, and the suite catches spec-substance violations" — is met.

## Cycle-1 finding disposition

| ID | Severity | Cycle-1 issue | Disposition | Evidence |
|---|---|---|---|---|
| F-01 | blocker | consent-scene regex parser forces attribute order | **FIXED** | `consent-scene.test.mjs:51` imports `makeRootEl` from `_dom-stub.mjs`; tokenizer at `_dom-stub.mjs:276-311` (`parseAttrs`) walks attributes left-to-right with no positional assumption |
| F-02 | blocker | landing-scene regex parser same problem | **FIXED** | `landing-scene.test.mjs:36` imports from `_dom-stub.mjs`; same tokenizer; AC-4.6 reads `a.attrs.href` regardless of attribute order |
| F-03 | high | Continue button placement unverified | **FIXED** | `consent-scene.test.mjs:137` uses descendant selector `".consent-scene__cta-group #continue-btn"` |
| F-04 | high | sentinel position unverified | **FIXED** | `consent-scene.test.mjs:160-165` filters element-children of envelope and asserts `[length-1] === sentinel` |
| F-05 | high (CRITICAL) | FR9/FR10/NFR13 disclosure paragraphs uncovered | **FIXED** | AC-5.13 (404-416), AC-5.14 (420-430), AC-5.15 (434-444). Each asserts paragraph class, descendant-of-envelope, and textContent equals the sentinel STRINGS value (proves i18n wiring) |
| F-06 | high | state.resetState behavior uncovered | **FIXED** | `consent-scene.test.mjs:99-102` imports state.js; AC-5.10:307-330 populates state pre-click via setSeed/setItem/recordResponse, sanity-checks pre-state, clicks Not-today, asserts `getState().currentItem === 0` and `responses.length === 0` |
| F-07 | high | routing.navigate('test') unverified | **FIXED** | AC-5.9:269-296 ticks timer to flip gate, clicks Continue, asserts `window.location.hash === '#/test'` |
| F-08 | high | idempotency test deceptive | **FIXED** | AC-2.2 renamed to "second start() does not throw or reject" (`main.test.mjs:77-89`); docstring explicitly acknowledges ESM-intercept limitation. Cycle-1 reviewer's recommended option (c). |
| F-09 | high | routing.test.mjs missing createElement stub | **FIXED** | `routing.test.mjs:70` adds `document.createElement`; lines 87-89 add `scrollTo`/`matchMedia`; lines 92-97 add IntersectionObserver |
| F-10 | medium | dispatch idempotency unchecked | **FIXED** | `routing.test.mjs:136-148` AC-3.3 asserts both listener count AND dispatch count stable |
| F-11 | medium | cumulative state ID-based ordering | **FIXED** | `locale-loader.test.mjs:29` imports beforeEach; lines 87-89 register `beforeEach(() => { resetFetch(); })`; each test installs its own EN responder explicitly (105, 120, 133, 148, 178) |
| F-12 | medium | retry result missing assertions | **FIXED** | AC-6.5:161-167 asserts `typeof result === "object"`, `result !== null`, `getCurrentLocale() === "en"` |
| F-13 | medium | bare-key fallback under empty cache uncovered | **FIXED** | AC-6.6:183-188 asserts `loader.get('landing.headline') === 'landing.headline'` after EN-fail-resolve |
| F-14 | medium | landing start-btn click→navigate unverified | **FIXED** | AC-4.9:177-197 clicks `#start-test-btn`, asserts `window.location.hash === '#/consent'` |
| F-15 | medium | landing unmount listener cleanup unverified | **FIXED** | AC-4.7:137-156 captures btn pre-unmount, unmounts, asserts post-unmount click does not navigate |
| F-16 | medium | IO-fire timer cancellation unchecked | **FIXED** | AC-5.6:215-218 ticks timer 10000ms after IO fire, asserts aria-disabled stays "false" AND `ioInstances.length === 1` |
| F-17 | medium | timer-flip IO disconnection unchecked | **FIXED** | AC-5.7:241 asserts `io.disconnected === true` after timer tick |
| F-18 | medium | unmount full cleanup unchecked | **FIXED** | AC-5.11:335-379 verifies (a) IO disconnected, (b) post-unmount timer tick produces no new IO, (c) post-unmount Continue click does not navigate, (d) post-unmount Not-today click does not reset state |
| F-19 | medium | manual hashchange firing over-specifies | **FIXED** | AC-3.5:158-180 no longer manually invokes captured hashchange handler; just `navigate('consent')` + filter `dispatchedEvents` |
| F-20 | high (was medium in cycle-1 listing; promoted given AC-2 line 40 explicit NFR20 mandate) | NFR20 error-fallback path uncovered | **FIXED** | AC-2.3:91-120 installs fetch-rejection responder, calls start(), asserts `doesNotReject` AND `appEl.innerHTML.length > 0` |
| F-21 | low | unused vars in main.test.mjs | **FIXED** | Dead code removed; cycle-2 `main.test.mjs` uses `fetchResponder` closure pattern only |
| F-22 | low | element-stub duplication | **FIXED** | All four scene-touching tests now import from `tests/unit/_dom-stub.mjs` |
| F-23 | low / observation | long test names | Deferred (acceptable — AC traceability outweighs TAP verbosity) |
| F-24 | low | failure-safe timer cleanup | **FIXED** | Every `t.mock.timers.enable(...)` block in consent-scene.test.mjs wrapped in `try { ... } finally { t.mock.timers.reset(); }` |
| F-25 | low / observation | "last event" assertion semantics | Partially addressed (AC-3.5 now uses `find(detail.route==='#/consent')` — semantics pinned as "some dispatched event with right detail"); further tightening deferred |

**Summary:** 2 blockers FIXED, 7 highs FIXED, 11 mediums FIXED, 5 lows (3 FIXED, 2 deferred as observation-only). Zero cycle-1 findings remain in NOT-FIXED state.

## Tokenizer review (`tests/unit/_dom-stub.mjs`)

Reviewed all 345 lines. Notable design choices:

- **`parseHTML`** walks the input character-by-character with quote-aware tag-end detection (`findTagEnd:246-266`), so attribute values containing `>` parse correctly.
- **`parseAttrs`** captures `name="value"`, `name='value'`, and boolean (no `=`) attributes regardless of position (lines 281-310).
- **Void-tag handling** (`VOID_TAGS:138-141`) — knows HTML5 void set; does not expect closing tag.
- **Lenient malformed-nesting handling** (lines 189-194) — pop-to-match closing tags rather than throw. Defensible for a test stub.
- **`querySelector`** supports `#id`, `.class`, `tag` (case-insensitive), and space-separated descendant combinator (lines 85-127). Sufficient for all AC tests; correctly enforces `.consent-scene__envelope .consent-scene__measures-what` style nesting.
- **`makeRootEl`** installs an `innerHTML` setter that runs `parseHTML` on assignment (lines 325-344). Configurable property — overwriteable by tests if needed.

Out-of-scope deliberately documented in source (lines 158-159): nested-quote attributes, unquoted values, CDATA, `<script>/<style>` body parsing. None affect Story 3-3.

Tokenizer sanity-checked by test-author out-of-band (per cycle-2 ATDD report § Tokenizer design notes). I did not re-run the sanity script, but the source-level review confirms the design is sound.

## Observations (non-blocking; impl-phase or future maintenance)

These are surface-level quirks that do not affect cycle-2 approval but should be visible to the frontend specialist and to whoever maintains the tests next.

### N-01 — Whitespace sensitivity in element textContent

The tokenizer assigns the raw text between tags to `parent._text` (line 234) without trimming. If impl writes `<h1 id="landing-heading">\n  __H_HEADLINE__\n</h1>` (newlines + indent around text content for readability), then `h1.textContent === "\n  __H_HEADLINE__\n"` and AC-4.3 fails for that reason. Real browser DOM `textContent` is also whitespace-preserving, so impl-write style matters.

**Mitigation for frontend specialist:** when populating textContent, use the tight pattern `<h1 id="...">${strings.landing.headline}</h1>` (no surrounding whitespace inside the tag), OR set `textContent` via the property after creating the element. The spec doesn't pin this either way; both compile to valid DOM. The test prefers the tight pattern.

### N-02 — Mixed text-before-and-after-children at parent level

`parseHTML` text-handling (lines 232-238): the first text content seen by a parent is stored in `_text`. Subsequent texts (after element children) are stored as synthetic `#text` children. The `textContent` getter (line 47): `if (this._text) return this._text;` — short-circuits to `_text` and ignores children. If a parent has BOTH `_text` (text before first child element) AND element children, textContent returns only `_text`.

**Story 3-3 impact:** none. Every spec-required structure in story 3-3 either (a) has text directly inside a leaf element (h1, p, button, a) with no element children, or (b) has element children with no leading bare text. The quirk does not affect any AC test.

**Future-impl observation:** if a later story writes markup like `<div>Lead text <span>highlighted</span> trailing text</div>`, the tokenizer would mis-report textContent. Helper should be extended at that point to always materialize first-text as a synthetic `#text` child.

### N-03 — AC-2.3 (NFR20) is permissive

`main.test.mjs:116-118` asserts `appEl.innerHTML.length > 0` rather than `appEl.innerHTML.includes("chrome.errorFallbackMessage")` (which was the cycle-1 reviewer's literal suggestion). The cycle-2 choice is defensible: under the synthetic fetch-throws setup, locale-loader resolves with `{}`, so `get('chrome.errorFallbackMessage')` returns the bare-key literal — error-fallback-content would still satisfy `innerHTML.length > 0`, AND impl could legitimately render the empty-bundle landing scene as a fallback path that also satisfies `length > 0`. Either path is NFR20-compliant.

**Cost:** slightly weaker than the original suggestion; impl could write `appEl.innerHTML = " "` (single space) and pass. **Benefit:** impl is free to choose fallback strategy without the test pinning a specific message string. Acceptable engineering tradeoff for cycle 2.

### N-04 — `globalThis.IntersectionObserver` defined in multiple test files

`main.test.mjs:56-59`, `routing.test.mjs:92-97`, and `consent-scene.test.mjs:56-69` each install their own IO stub at module top-level. Since each test file is its own Node module, this is harmless under sequential execution but inconsistent — the three IO stubs have different shapes (different methods captured, different state tracking).

**Mitigation:** if cycle-2 has time, extract a canonical `makeIntersectionObserverStub()` helper into `_dom-stub.mjs`. Not a defect, just a style observation.

### N-05 — `consent-scene.test.mjs` cross-test state.js residue

AC-5.10 and AC-5.11 both write to state.js via the module's public API. Each test calls `resetState()` at its start, so within-file isolation is preserved. **No defect** — flagged only because state.js is a module singleton across test files (a single Node process), and future maintainers should remember to reset it.

### N-06 — Tokenizer is lenient with malformed nesting

`parseHTML` (lines 189-194) pops-to-match closing tags rather than throwing on mismatched tags. This means a malformed impl like `<div><p>text</div></p>` would parse without error, and tests might silently pass against malformed HTML. Real `make lint` and the existing `tools/lint-css-link-order.mjs` (lands later per spec) would catch some of this; `python3 html.parser` via Task 11.5 catches the rest. Acceptable layered defense.

## Approval rationale

**Reading the test files end-to-end, every cycle-1 finding has a corresponding fix backed by file-line evidence.** The most important one — F-05 disclosure paragraphs — is now triply covered (AC-5.13/14/15) and uses sentinel STRINGS values that prove the i18n wiring is not hardcoded text. The tokenizer is well-built and supports descendant selectors that enforce structural-nesting requirements (F-03/F-04).

The two remaining cycle-1 lows (F-23 long test names, F-25 dispatch-semantics) are observation-only and acceptable. The cycle-2 additions introduce no new defects; the quirks I noted (N-01 through N-06) are either out-of-scope or non-blocking for green-phase impl.

**Red phase intact:** 312-baseline pass set preserved, 43 fail (was 38 — +5 from net-new tests). All failures are module-not-found in the new test files.

The frontend specialist can now implement against these tests with confidence that (a) attribute order is theirs to choose, (b) structural-nesting requirements are spec-driven (not test-driven), and (c) every spec-substance requirement (including the three disclosure paragraphs that are the core of informed consent) is checked.

**Handoff to test-author orchestrator (Step 7):** flip story status `tests-drafting → tests-approved` and emit the success terminal output. Then re-invoke `bmad-tds-execute-story` for frontend impl phase.
