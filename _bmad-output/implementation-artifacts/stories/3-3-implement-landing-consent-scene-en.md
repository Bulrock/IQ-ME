---
lint-exempt-carry-forward: true
id: 3-3-implement-landing-consent-scene-en
title: "Story 3.3: Implement landing + consent-scene (EN)"
status: done
---

# Story 3.3: Implement landing + consent-scene (EN)

## Story

As an **English-speaking visitor arriving at the canonical URL**,
I want **a landing page that explains what IQ-ME is, links to the methodology corpus, and offers a "Start the test" CTA — followed by a consent scene that presents the validity envelope before the Continue control becomes available**,
so that **I cannot start a measurement session without having read the disclosure (FR12), and I can decline with "Not today" (FR11) at any pre-test point**.

This is **Epic 3's first UI story** — Story 3.1 froze the contract artifacts (state schema + three ADRs); Story 3.2 landed `state.js` as the runtime state module. Story 3.3 ships the SPA shell (`src/index.html`), the hash-based router (`src/assessment/routing.js`), the EN-only landing scene (`src/assessment/landing.js`), the EN-only consent scene (`src/assessment/consent.js` — including the validity-envelope text, the visuospatial / screen-reader-non-equivalence disclosure per NFR13, the "Continue is dwell-gated" affordance per FR12, and the "Not today" exit per FR11), and the i18n harness (`src/assessment/i18n/locale-loader.js` + `src/content/i18n/en/strings.json`). Story 3.4 will mount the item-runner scene on `#/test`; Story 3.5 will mount the score-panel on `#/result`; Story 3.6 will populate the 3 methodology stub pages the landing "Read the methodology" link points to. **This story owns the SPA entry point + the two pre-test scenes + the routing seam + the EN i18n harness**.

## Acceptance Criteria

1. **AC-1 (`src/index.html` — SPA entry point):**
   - File at exact path: `src/index.html` (Domain A per architecture line 1062).
   - Single `<!doctype html>` document. `<html lang="en">` initially (locale switcher in Story 7-1 will mutate this).
   - `<head>` contains:
     - `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width,initial-scale=1">`.
     - `<title>` populated from i18n key `chrome.titleAppDefault` (rendered server-static-string here at "IQ-ME — a fluid-reasoning screener" — no JS templating; the same key is what `locale-loader.js` swaps on locale change in later stories).
     - **Parallel `<link rel="stylesheet">` chain (D5)** in declared cascade order: `reset.css` → `primitives.css` → `semantic.css` → `base.css` → `components/*.css` (alphabetical: `chrome-header.css`, `consent-scene.css`, `landing.css`) → `utilities.css`. Order MUST be enforceable later by `tools/lint-css-link-order.mjs` (not landed this story — Story 3.5 lands it per Story-3.5 narrative; this story just emits the order so the future lint will pass).
   - `<body>` contains, in this order:
     - `<header class="chrome-header">` with project name + (Story 7 will add language switcher; this story leaves it absent).
     - `<main id="app" role="main">` — SPA mount point. Empty at parse time; scenes render here.
     - `<div id="fallback" style="display:none">` — D10 nomodule fallback container. Contains a single `<article lang="en">` with one-paragraph EN upgrade message + browser-upgrade links (Chrome / Firefox / Safari / Yandex Browser) + a link to `/methodology/v1.0.0/en/` (corpus is path-routed, reads without ES modules). Reading-level-lint compliance deferred to Story 7 (per-language reading-level calibration); EN passes NFR28 EN-side at v1 because the message is short, plain, and uses the project glossary.
     - `<script nomodule>` toggle: `document.getElementById('fallback').style.display='block'; document.getElementById('app').style.display='none';`
     - `<noscript>` element containing the same EN upgrade message (no JS = same fallback content).
     - `<script type="module" src="/src/assessment/main.js"></script>` — the SPA entry script (created in AC-2 below).
   - **Zero inline `<script>` content other than the `nomodule` toggle.** No inline styles. No external CDN references (FR41). No analytics. No fonts loaded via `<link>` (lint-no-external-font from Epic 1 already enforces this).
   - File has LF / UTF-8 / no BOM / trailing newline.

2. **AC-2 (`src/assessment/main.js` — SPA bootstrap):**
   - File at exact path: `src/assessment/main.js`.
   - Named exports: `start()` (idempotent — second call is a no-op). Default-export forbidden (architecture line 887).
   - Body: on DOMContentLoaded, calls `localeLoader.load('en')` (from `./i18n/locale-loader.js`) → on resolve, calls `routing.start()` (from `./routing.js`). No event-listener attached when `document.readyState === 'loading'` is already false (the script tag is at end-of-body so this is the common case).
   - Wraps the entire bootstrap in a `try/catch`. On thrown error, writes a localized polite fallback into `#app` via `error-fallback.js` (NFR20). For this story, `error-fallback.js` exposes a single named export `renderErrorFallback(rootEl, localeStrings)` that writes one paragraph derived from i18n key `chrome.errorFallbackMessage` plus a "Reload" link.
   - **No `Math.random`, no `Date.now()` in shipped code, no `localStorage.*`, no `sessionStorage.*`, no `navigator.share`, no `console.log`** (NFR9, NFR10, architecture line 912 enforcement guidelines). `Date.now()` in `state.js` from Story 3.2 remains permitted under the Story 3.1 ADR exception — this story does NOT introduce new `Date.now` callsites.

3. **AC-3 (`src/assessment/routing.js` — hash-based router):**
   - File at exact path: `src/assessment/routing.js`.
   - Hash-based routing per architecture line 285: `''` or `'#/'` → landing; `'#/consent'` → consent; `'#/test'` → item-runner (Story 3.4); `'#/result'` → result (Story 3.5); `'#/methodology'` → methodology-shell (later epic). For this story, only landing + consent route handlers are registered; any other hash falls back to landing without throwing.
   - Named exports: `start()`, `navigate(route)`, `getCurrentRoute()`. **No global mutable singletons exposed**; the route table is module-scope.
   - Listens to `window.addEventListener('hashchange', …)`. Dispatches a CustomEvent `iqme:route-change` (`bubbles: true, composed: false`) on `document` after each navigation. (This is the v1 of an event surface that Story 3.5 will reuse for reveal-stage; it is named distinctly (`iqme:route-change` vs `iqme:reveal-stage`) so the two contracts cannot collide — see `docs/adr/iqme-reveal-stage-event-contract.md` for the reveal-stage shape.)
   - `navigate(route)` sets `window.location.hash` (not `history.pushState` — hash-based is the chosen pattern). `getCurrentRoute()` parses `window.location.hash`.
   - **`navigate('consent')` is only callable from the landing-scene CTA**; the function itself is unrestricted (it's a normal hash mutation), but the landing-scene listener attaches to the "Start the test" button. (i.e. there is no programmatic guard preventing manual `window.location.hash = '#/consent'`; the contract is enforced by UI, not by code.) This matches the FR1 "begin session in chosen language, no account" zero-precondition posture.

4. **AC-4 (`src/assessment/landing.js` — landing scene):**
   - File at exact path: `src/assessment/landing.js`.
   - Named exports: `render(rootEl, strings)`. No default export.
   - On render, writes the following DOM into `rootEl` (the `#app` element):
     - `<section class="landing" aria-labelledby="landing-heading">`
       - `<h1 id="landing-heading">` from i18n key `landing.headline`
       - `<p class="landing__paragraph">` from i18n key `landing.intro` — one-paragraph plain-language description of what IQ-ME is and is not. EN copy at v1: a single ~60-word paragraph stating "IQ-ME is a fluid-reasoning screener using ICAR-MR matrix items, takes about 25 minutes, runs entirely in your browser, stores nothing on a server, and is not a clinical assessment or credential."
       - `<div class="landing__cta-group">`
         - `<button type="button" class="landing__start-btn" id="start-test-btn">` text from `landing.startTestButton` ("Start the test")
         - `<a class="landing__methodology-link" href="/methodology/v1.0.0/en/">` text from `landing.methodologyLink` ("Read the methodology")
     - `</section>`
   - On render, attaches a `click` listener to `#start-test-btn` that calls `routing.navigate('consent')` (imported from `./routing.js`).
   - **No `localStorage` access. No `sessionStorage` access. No cookie reads. No analytics calls. No `navigator.share`. No `<dialog>`, no `<aside role="alert">`, no `role="alert"` anywhere.** All asserted via the existing Epic 1 lints + a new `tests/unit/landing-scene.test.mjs` (see AC-9).
   - On unmount (called by router when navigating away), removes the `click` listener and clears `rootEl.innerHTML`.

5. **AC-5 (`src/assessment/consent.js` — consent scene with validity envelope + dwell gate + "Not today"):**
   - File at exact path: `src/assessment/consent.js`.
   - Named exports: `render(rootEl, strings)`, `unmount()`. No default export.
   - On render, writes the following DOM into `rootEl`:
     - `<section class="consent-scene" aria-labelledby="consent-heading">`
       - `<h1 id="consent-heading">` from `consent.headline` ("Before you begin")
       - `<div class="consent-scene__envelope" data-testid="validity-envelope">`
         - `<p class="consent-scene__measures-what">` from `consent.measuresWhat` (plain-language EN statement of what the instrument measures — FR9)
         - `<p class="consent-scene__validity-envelope">` from `consent.validityEnvelope` (the validity-envelope disclosure — FR10)
         - `<p class="consent-scene__visuospatial-disclosure">` from `consent.visuospatialDisclosure` (the visuospatial / screen-reader-non-equivalence disclosure — NFR13)
       - `</div>`
       - `<div class="consent-scene__cta-group">`
         - `<button type="button" class="consent-scene__continue-btn" id="continue-btn" aria-disabled="true">` text from `consent.continueButton` ("Continue")
         - `<a class="consent-scene__not-today" href="#/" id="not-today-link">` text from `consent.notToday` ("Not today")
     - `</section>`
   - **Dwell gate behavior (FR12):** the Continue button's `aria-disabled` attribute is `"true"` at render time. It flips to `"false"` when EITHER of the following has happened first:
     - **(a) Scroll-past:** the bottom of the `.consent-scene__envelope` element has scrolled into the viewport (use `IntersectionObserver` with `threshold: 1.0` observing a sentinel `<div class="consent-scene__envelope-end" tabindex="-1"></div>` appended as the last child of the envelope — the sentinel is a focusable but visually-invisible 1px element so screen-reader users hit it on Tab traversal too); OR
     - **(b) 5-second dwell:** a `setTimeout` of 5000 ms set on render fires and the gate flips. Whichever fires first wins; the other is cancelled.
   - When `aria-disabled` is `"true"`, the `click` listener on `#continue-btn` is a no-op (it checks `getAttribute('aria-disabled') === 'true'` and returns early — defense-in-depth, since `aria-disabled` alone does NOT prevent click events from firing the listener, only assistive tech treats the control as disabled). When `aria-disabled` flips to `"false"`, clicking calls `routing.navigate('test')` (Story 3.4 wires up the actual test scene; for this story, `#/test` falls back to landing).
   - **"Not today" behavior (FR11):** clicking `#not-today-link` (or any control that navigates to `#/` from the consent route) calls `state.resetState()` from `state.js` (Story 3.2 exported this) BEFORE the navigation. The router's hashchange handler then unmounts consent-scene and renders the landing-scene. A test asserts `getState()` after this transition equals `freshState` (empty-init shape).
   - On unmount (called by router when navigating away from consent), the `IntersectionObserver` is `.disconnect()`'d, the `setTimeout` is `clearTimeout`'d, and all event listeners are removed.
   - **No `localStorage`, no `sessionStorage`, no analytics, no third-party requests** — same negative-assertion bar as landing.

6. **AC-6 (`src/assessment/i18n/locale-loader.js` — single-eager-bundle loader, EN-only at v1 in this story):**
   - File at exact path: `src/assessment/i18n/locale-loader.js` (Domain A per architecture line 1079).
   - Named exports: `load(localeCode)` (returns a Promise resolving to the strings object), `get(key)` (synchronous key lookup with bare-key fallback per architecture line 836), `getCurrentLocale()`. No default export.
   - `load(localeCode)` performs `fetch('/src/content/i18n/<localeCode>/strings.json')` (path per architecture line 391/1104). On success, parses JSON, stores in module-level `strings` map, sets module-level `currentLocale`, resolves with the strings object. On failure, falls back to `'en'` once (re-fetches `/src/content/i18n/en/strings.json`); if that also fails, resolves with an empty object (the `get()` bare-key fallback then renders raw keys, which is the architecture-line-837 "highly visible — fix it" failure mode).
   - `get(key)` accepts dot-separated namespace.key (e.g., `'consent.continueButton'`). Walks the `strings` map. **If the active-locale lookup fails, falls back to the `'en'` strings (if cached), then to the bare-key literal** per architecture line 836.
   - **No `localStorage` reads or writes** (locale persistence is Story 7's job; this loader is in-memory only at v1).
   - **Cache:** the loaded strings map is held in a `Map` (`Map<localeCode, namespace-object>`); locale-loader stays a small singleton.
   - **Bundle path is same-origin** (`/src/content/i18n/...`); no third-party fetch (FR41). Verified by `e2e-network-trace` later.

7. **AC-7 (`src/content/i18n/en/strings.json` — EN i18n bundle, landing + consent + chrome namespaces):**
   - File at exact path: `src/content/i18n/en/strings.json` (Domain C per architecture line 1103).
   - JSON structure: `{ namespace: { key: "string", ... }, ... }`. Namespaces required at v1 for this story:
     - `chrome`: `titleAppDefault`, `errorFallbackMessage`, `appName`
     - `landing`: `headline`, `intro`, `startTestButton`, `methodologyLink`
     - `consent`: `headline`, `measuresWhat`, `validityEnvelope`, `visuospatialDisclosure`, `continueButton`, `notToday`
   - Concrete EN copy lives in this file — exact text approved at story authoring time. Sample (the dev agent MAY refine wording within the same one-paragraph length budget, but the key set is contractual):
     - `chrome.titleAppDefault`: `"IQ-ME — a fluid-reasoning screener"`
     - `chrome.appName`: `"IQ-ME"`
     - `chrome.errorFallbackMessage`: `"Something went wrong loading the page. Try reloading."`
     - `landing.headline`: `"IQ-ME"`
     - `landing.intro`: `"IQ-ME is a fluid-reasoning screener that uses 16 visual matrix-reasoning items (ICAR-MR), takes about 25 minutes, runs entirely in your browser, and stores nothing on a server. It is not a clinical assessment, a credential, or a placement test — it is one calibrated screen of one narrow ability."`
     - `landing.startTestButton`: `"Start the test"`
     - `landing.methodologyLink`: `"Read the methodology"`
     - `consent.headline`: `"Before you begin"`
     - `consent.measuresWhat`: `"This instrument measures fluid reasoning — your ability to identify visual-spatial patterns under no time pressure. It does not measure verbal reasoning, processing speed, working memory in isolation, or any clinical condition."`
     - `consent.validityEnvelope`: `"IQ-ME is valid as a screener for fluid reasoning in adults who can complete a 16-item visual session unimpaired by acute distress, sleep deprivation, or substances. It is not valid as a diagnostic, as a measure under time pressure, or as a stand-in for a multi-domain IQ battery."`
     - `consent.visuospatialDisclosure`: `"The matrix items are visual by construction. Screen-reader users cannot take this test equivalently — there is no synthetic alt-text that captures the patterns honestly. We disclose this rather than pretend otherwise."`
     - `consent.continueButton`: `"Continue"`
     - `consent.notToday`: `"Not today"`
   - **Reading-level constraint:** all EN copy at v1 passes a relaxed reading-level threshold (NFR28 full enforcement is Story 7-5a). For this story, the dev agent should keep sentences under 25 words and prefer common words; no formal lint check enforces it in CI yet.
   - File has LF / UTF-8 / no BOM / trailing newline.

8. **AC-8 (`src/assessment/error-fallback.js` — localized polite fallback for NFR20):**
   - File at exact path: `src/assessment/error-fallback.js`.
   - Named export: `renderErrorFallback(rootEl, localeStrings)`. No default export.
   - Writes a single `<section class="error-fallback" role="status">` into `rootEl` with one paragraph (from `localeStrings.chrome.errorFallbackMessage`) and a "Reload" link (`<a href="">` — empty href triggers same-URL reload on click, no JS needed; alternative `href="/"` would discard the hash unnecessarily for this v1 use).
   - **No `role="alert"`** — Epic 1 lint-no-role-alert continues to enforce this (a `role="alert"` polluting the page would trip the lint).
   - **No JS that throws** in this file's body (it's the error handler — it MUST be import-safe).

9. **AC-9 (`src/css/components/landing.css`, `consent-scene.css`, `chrome-header.css` — minimal hand-rolled CSS):**
   - Three new files in `src/css/components/`:
     - `landing.css` — layout for `.landing`, `.landing__cta-group`, `.landing__start-btn`, `.landing__methodology-link`, `.landing__paragraph`. Uses semantic-token variables from `src/css/semantic.css` (Story 1-10 landed those). Focus-visible ring on the CTA per WCAG 2.2 AA + `base.css` defaults.
     - `consent-scene.css` — layout for `.consent-scene`, `.consent-scene__envelope`, `.consent-scene__cta-group`, `.consent-scene__continue-btn`, `.consent-scene__not-today`. Continue button's disabled state styled via `[aria-disabled="true"]` selector (NOT `:disabled` — the contract is `aria-disabled`, not the native attribute). Sentinel `.consent-scene__envelope-end` rendered as `position:absolute; width:1px; height:1px; clip:rect(0 0 0 0);` (visually-hidden technique, focusable, screen-reader-equivalent).
     - `chrome-header.css` — layout for `.chrome-header`. Minimal v1: project name centered/left, height set, semantic-color tokens.
   - All three files use ONLY `var(--*)` tokens from `primitives.css` / `semantic.css`. No literal hex colors, no `px` values for spacing (use the 8px-scale token chain established Story 1-10).
   - **Combined LOC budget** for these three files: ≤ 250 LOC total at v1 (per architecture line 397 — CSS budget ~1500 LOC total across 25 components; this story claims 3 of 25 at proportionate budget). The cognitive-load-budget lint (Story 1-5) does NOT track these specific files at v1 — they're additive; Story 6 would tune budgets once the full 25 are in place.
   - **No `@import` waterfall**; the parallel `<link>` chain from AC-1 is the loading mechanism (D5).
   - **No external font, no third-party CSS** — Epic 1 `lint-no-external-font.mjs` continues to enforce.

10. **AC-10 (`tests/unit/landing-scene.test.mjs`, `consent-scene.test.mjs`, `locale-loader.test.mjs`, `routing.test.mjs` — Domain A unit tests using `node:test`):**
    - All four files in `tests/unit/`, suffix `.test.mjs` per architecture line 908.
    - Use `node:test` + `node:assert/strict` + stubbed DOM. Since `node:test` does not ship a DOM, install a minimal stub via:
      - `globalThis.document = { … }` with the methods used by the modules under test: `createElement`, `getElementById`, `querySelector`, `addEventListener`, `removeEventListener`, `dispatchEvent`, plus stub `IntersectionObserver` and a stub `setTimeout` (use Node's built-in `setTimeout` — no stub needed for that one).
      - The DOM stub is **scope-limited** (covers ONLY the surface used by Story 3-3 modules). Document this at the top of each test file (mirrors the `_state-schema-check.mjs` precedent from Story 3-2).
    - Tests required (one or two per file, totalling ≥ 8 new `test()` blocks across the four files):
      - `landing-scene.test.mjs`: renders without throwing; the start-button click handler calls `routing.navigate('consent')`; rendered DOM contains zero `role="alert"` attributes and zero `localStorage`-style identifiers.
      - `consent-scene.test.mjs`: Continue button starts with `aria-disabled="true"`; flips to `"false"` after the 5-second timer fires (use `node:test`'s built-in `t.mock.timers.tick(5000)` — Node 22+ supports this); flips to `"false"` after the IntersectionObserver entry signals (manually invoke the callback in the test); clicking "Not today" calls `state.resetState()` and dispatches navigation to `#/`.
      - `locale-loader.test.mjs`: `load('en')` resolves to a strings object containing `landing.headline`, `consent.continueButton`, `chrome.titleAppDefault` (stub `globalThis.fetch` to return the file contents); `get('consent.continueButton')` returns the EN string; `get('nonexistent.key')` returns the bare-key literal.
      - `routing.test.mjs`: `start()` is idempotent (calling twice does not double-register listeners); `navigate('consent')` mutates `window.location.hash` to `'#/consent'`; `getCurrentRoute()` parses the hash correctly; unknown hash falls back to landing without throwing.
    - All four files: `import` the SUT modules, install stubs in module-top-of-file body (per `state-shape.spec.mjs` precedent — stub BEFORE dynamic import), exercise behaviors, assert outcomes. The total `make test` count must increase by ≥ 8.

11. **AC-11 (`tools/lint-no-cookie-banner.mjs` is already shipped — Story 3.3 exercises it):**
    - The Story 3-3 acceptance criterion (AC line: "a test asserts these absences via the existing `lint-no-share` + `lint-no-role-alert` infrastructure from Epic 1 plus an additional `lint-no-cookie-banner` assertion") is **already partially satisfied** — `tools/lint-no-cookie-banner.mjs` exists from Epic 1 (Story 1-9). This story:
      - Confirms the lint passes against the new `src/index.html` + new SPA modules + new CSS (no `cookie-banner` / `cookie-consent` strings introduced).
      - No new lint code added; `make lint` continues to exit 0.
    - Defense-in-depth: the consent-scene HTML must NOT include strings matching the lint's forbidden regex (`/cookie[-_]?(banner|consent)/i`). The closest near-miss in the EN copy is the word "consent" alone, which is NOT matched (the regex requires `cookie-` or `cookie_` prefix). **Verified by running `make lint` post-implementation.**

12. **AC-12 (integration smoke check via `tests/contract/state-shape.spec.mjs` — already shipped):**
    - Story 3-2's existing `tests/contract/state-shape.spec.mjs` continues to pass unchanged. This story does NOT modify `state.js`, `state.schema.json`, or `_state-schema-check.mjs`. The contract test suite stays at the same pass count it had at end-of-3-2.
    - Verified by running `make test-contract` post-implementation — exit 0, same pass count as end-of-3-2.

## Tasks / Subtasks

- [x] **Task 1: Create `src/index.html` SPA shell (AC-1)**
  - [x] 1.1 Write `<!doctype html>` document with `<html lang="en">`, `<meta charset="utf-8">`, viewport meta, `<title>` literal (i18n key swap happens via `locale-loader.js` in later stories).
  - [x] 1.2 Emit the parallel `<link rel="stylesheet">` chain in declared cascade order: reset → primitives → semantic → base → components alphabetical (chrome-header, consent-scene, landing) → utilities.
  - [x] 1.3 Add `<header class="chrome-header">` shell (project name only at v1).
  - [x] 1.4 Add `<main id="app" role="main">` mount point + `<div id="fallback" style="display:none">` with one EN article (~3 sentences) + 4 browser-upgrade links + methodology corpus link.
  - [x] 1.5 Add `<script nomodule>` fallback toggle (single line, no inline JS otherwise) + `<noscript>` mirror of the fallback content.
  - [x] 1.6 Add `<script type="module" src="/src/assessment/main.js"></script>` at end-of-body.
  - [x] 1.7 Verify file is LF / UTF-8 / no BOM / trailing newline.

- [x] **Task 2: Implement `src/assessment/main.js` bootstrap (AC-2)**
  - [x] 2.1 Add `export async function start()` — idempotent via module-level `started` flag.
  - [x] 2.2 In `start()`: `await localeLoader.load('en')` (or fall back to bare-keys on resolved-empty per AC-6); then `routing.start()`.
  - [x] 2.3 Wrap entire body in `try/catch`; on catch, `renderErrorFallback(document.getElementById('app'), localeStrings)`.
  - [x] 2.4 At module bottom: `if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();` — common case (end-of-body script tag) is the else branch.
  - [x] 2.5 Verify no `Math.random`, no `Date.now`, no `localStorage`, no `sessionStorage`, no `navigator.share`, no `console.log` in this file (grep self-check).

- [x] **Task 3: Implement `src/assessment/routing.js` (AC-3)**
  - [x] 3.1 Module-level route table: `{ '': landingScene, '#/': landingScene, '#/consent': consentScene }`. Other routes fall back to landing.
  - [x] 3.2 `export function start()`: idempotent; attaches `window.addEventListener('hashchange', onHashChange)`, then calls `onHashChange()` once to render the initial scene.
  - [x] 3.3 `export function navigate(route)`: sets `window.location.hash = '#/' + route.replace(/^#?\/?/, '')`. (e.g., `navigate('consent')` → `#/consent`.)
  - [x] 3.4 `export function getCurrentRoute()`: returns the lowercase hash (`window.location.hash`).
  - [x] 3.5 `onHashChange()`: looks up the scene for the current hash, calls `previousScene.unmount?.()` if present, then `currentScene.render(appEl, localeStrings)`, then dispatches `new CustomEvent('iqme:route-change', { bubbles: true, composed: false, detail: { route: currentHash } })` on `document`.

- [x] **Task 4: Implement `src/assessment/landing.js` (AC-4)**
  - [x] 4.1 `export function render(rootEl, strings)`: write the section HTML via `rootEl.innerHTML = ...` (template literal) or via `document.createElement` chains — both acceptable; the template-literal approach is shorter for static markup.
  - [x] 4.2 After write, `rootEl.querySelector('#start-test-btn').addEventListener('click', () => routing.navigate('consent'))`.
  - [x] 4.3 `export function unmount()`: remove the click listener (use a named handler reference), clear `rootEl.innerHTML`.
  - [x] 4.4 Grep self-check: no `localStorage`, no `sessionStorage`, no `navigator.share`, no `role="alert"`, no `Math.random`, no `Date.now`, no `console.log`.

- [x] **Task 5: Implement `src/assessment/consent.js` (AC-5)**
  - [x] 5.1 `export function render(rootEl, strings)`: write section HTML (validity envelope + dwell-gated Continue + "Not today" link) including the sentinel `<div class="consent-scene__envelope-end" tabindex="-1">`.
  - [x] 5.2 Install `IntersectionObserver` observing the sentinel; on `entry.isIntersecting && entry.intersectionRatio === 1.0`, flip `#continue-btn[aria-disabled]` to `"false"` AND cancel the dwell-timer.
  - [x] 5.3 Install `setTimeout(flipGate, 5000)`; `flipGate()` flips `aria-disabled` to `"false"` AND disconnects the IntersectionObserver.
  - [x] 5.4 Attach `click` listener on `#continue-btn`: if `aria-disabled === 'true'`, no-op; else `routing.navigate('test')`.
  - [x] 5.5 Attach `click` listener on `#not-today-link`: call `state.resetState()` from `../assessment/state.js`, then let the native `<a href="#/">` navigation fire (do NOT `preventDefault` — the hashchange will route to landing).
  - [x] 5.6 `export function unmount()`: `IntersectionObserver.disconnect()`, `clearTimeout(dwellTimer)`, remove the two click listeners.
  - [x] 5.7 Grep self-check: same negatives as landing.js (Task 4.4).

- [x] **Task 6: Implement `src/assessment/i18n/locale-loader.js` (AC-6)**
  - [x] 6.1 Module-level `currentLocale = null`, `strings = new Map()`.
  - [x] 6.2 `export async function load(localeCode)`: `fetch('/src/content/i18n/' + localeCode + '/strings.json')`, parse JSON, store in `strings`, set `currentLocale = localeCode`, return the parsed namespace object. On error: if `localeCode !== 'en'`, retry once with `'en'`; else resolve with `{}` (empty bundle).
  - [x] 6.3 `export function get(key)`: split on `'.'`, walk the current-locale's namespace; if undefined, walk the `'en'` cache (if not the current locale); if still undefined, return the bare `key` literal.
  - [x] 6.4 `export function getCurrentLocale()`: return `currentLocale`.
  - [x] 6.5 Grep self-check: no `localStorage`, no `sessionStorage`.

- [x] **Task 7: Author `src/content/i18n/en/strings.json` (AC-7)**
  - [x] 7.1 Create file with the 3 namespaces (`chrome`, `landing`, `consent`) and the 13 keys listed in AC-7. EN copy as specified there.
  - [x] 7.2 Validate via `python3 -c "import json; json.load(open('src/content/i18n/en/strings.json'))"` exits 0.
  - [x] 7.3 LF / UTF-8 / no BOM / trailing newline.

- [x] **Task 8: Implement `src/assessment/error-fallback.js` (AC-8)**
  - [x] 8.1 `export function renderErrorFallback(rootEl, strings)`: write a `<section role="status">` (NOT `role="alert"`) with the chrome.errorFallbackMessage + a Reload link.
  - [x] 8.2 No imports beyond standard (no Date, no Math.random, no storage).

- [x] **Task 9: Author `src/css/components/{landing,consent-scene,chrome-header}.css` (AC-9)**
  - [x] 9.1 `landing.css` (~80 LOC max) — `.landing` layout + `.landing__paragraph` typography + `.landing__cta-group` flex + `.landing__start-btn` button styling (semantic tokens only) + `.landing__methodology-link` link styling.
  - [x] 9.2 `consent-scene.css` (~100 LOC max) — `.consent-scene` layout + `.consent-scene__envelope` blockquote-like emphasis + `.consent-scene__continue-btn` button styling with `[aria-disabled="true"]` muted state + `.consent-scene__envelope-end` visually-hidden sentinel.
  - [x] 9.3 `chrome-header.css` (~50 LOC max) — `.chrome-header` row layout, project name typography, semantic background/foreground.
  - [x] 9.4 No literal hex / px / font-family in any of the three files — semantic tokens only. Grep self-check: `grep -E '#[0-9a-fA-F]{3,6}\b|\b[0-9]+px\b|font-family:[^v]' src/css/components/{landing,consent-scene,chrome-header}.css` returns no matches (except token-name references — `var(--*)` is allowed).

- [x] **Task 10: Author `tests/unit/{landing-scene,consent-scene,locale-loader,routing}.test.mjs` (AC-10)**
  - [x] 10.1 `landing-scene.test.mjs` — install minimal `document` / `window` stubs at file top BEFORE dynamic import; assert render → DOM shape contains the start-button + methodology link + headline; assert start-button click invokes routing.navigate('consent') (mock routing module via dynamic-import override).
  - [x] 10.2 `consent-scene.test.mjs` — install `IntersectionObserver` stub + `node:test`-mock-timers; assert aria-disabled flips after 5s tick; assert aria-disabled flips after IO entry fires; assert "Not today" calls state.resetState.
  - [x] 10.3 `locale-loader.test.mjs` — stub `globalThis.fetch` to return the EN strings.json content; assert `load('en')` resolves with the expected namespace shape; assert `get('consent.continueButton')` returns the EN string; assert `get('garbage.key')` returns `'garbage.key'`.
  - [x] 10.4 `routing.test.mjs` — stub `window`, `document`, and the route handlers; assert `start()` idempotency, `navigate('consent')` hash mutation, `getCurrentRoute()` parsing, unknown-hash fallback.

- [x] **Task 11: Verify `make test` + `make lint` + contract test count (AC-10, AC-11, AC-12)**
  - [x] 11.1 Run `make test` — exit 0; `pass` count = end-of-3-2 baseline (`312`) + at least 8 new tests (target ≥ `320`); `todo=0`.
  - [x] 11.2 Run `make test-contract` — exit 0; pass count unchanged from end-of-3-2 (contract suite is not modified).
  - [x] 11.3 Run `make lint` — exit 0; `lint-no-cookie-banner` passes against the new SPA modules + CSS + HTML (no false-positive on the consent-scene copy).
  - [x] 11.4 Run `node tools/lint-no-share.mjs` and `node tools/lint-no-role-alert.mjs` standalone to triple-verify (these are part of `make lint` but worth a direct run for this story's defense-in-depth — same exit 0 expected).
  - [x] 11.5 Spot-check `src/index.html` parses as HTML via `python3 -c "from html.parser import HTMLParser; p=HTMLParser(); p.feed(open('src/index.html').read())"` — no exception.
  - [x] 11.6 Spot-check `src/content/i18n/en/strings.json` parses as JSON — done in Task 7.2.

## Dev Notes

### What this story is and is NOT

**IS:**
1. `src/index.html` — SPA entry point + parallel `<link>` chain + nomodule fallback + noscript mirror.
2. `src/assessment/main.js` — bootstrap (locale load + routing start, with error-fallback safety net).
3. `src/assessment/routing.js` — hash-based router with a v1 scene table (landing + consent only; #/test and #/result fall back).
4. `src/assessment/landing.js` — landing scene with twin CTA (Start the test / Read the methodology).
5. `src/assessment/consent.js` — consent scene with validity envelope, visuospatial disclosure, dwell-gated Continue, "Not today" exit.
6. `src/assessment/i18n/locale-loader.js` — single-eager-bundle EN loader with bare-key fallback.
7. `src/assessment/error-fallback.js` — NFR20 polite fallback (not `role="alert"`).
8. `src/content/i18n/en/strings.json` — 3 namespaces (chrome, landing, consent), 13 keys.
9. `src/css/components/landing.css`, `consent-scene.css`, `chrome-header.css` — minimal hand-rolled CSS using semantic tokens only.
10. `tests/unit/landing-scene.test.mjs`, `consent-scene.test.mjs`, `locale-loader.test.mjs`, `routing.test.mjs` — Domain A unit tests.

**IS NOT:**
- The item-runner scene (Story 3-4 — `#/test` route handler).
- The score-panel / reveal-stage event firing (Story 3-5).
- The 3 methodology stub pages the "Read the methodology" link points to (Story 3-6).
- Language switcher / locale selector UI (Story 7-1).
- RU/PL `strings.json` bundles (Stories 7-3, 7-4).
- Mid-session locale-switch blocker (Story 7-2).
- `tools/lint-css-link-order.mjs` (Story 3-5 lands it — but this story emits the order so the future lint passes).
- Resume-prompt scene (deferred; Sally added it to architecture but no story claims it before Epic 6).
- `tools/lint-i18n-coverage.mjs` (architecture line 838 — "optional v1 addition" — explicitly out of scope; bare-key fallback is the live-failure signal).
- Playwright e2e against the live slice (Story 3-7 owns that — this story does NOT touch `tests/playwright/`).
- `tests/a11y/**` axe-core integration (not in v1 lint loop yet; pre-launch manual review).
- Style: full visual polish of CSS — minimal tokenized layout is sufficient at v1. Sally + UX team will iterate in Epic 6.

### Critical decisions encoded here

**Decision 1: hash-based router, not History API.** Architecture line 285 explicitly chose hash-based routing for the SPA (path-based is the methodology corpus, served as flat HTML). Hash routing requires zero server config (the only `/` URL the browser ever fetches is `/`; everything else is `#/`-suffixed and never round-trips to the server). This is exactly what the FR6 "no server state" + FR41 "zero third-party" posture demands. Forward path: if Epic 6 needs deep-linkable URLs for SEO (it doesn't — the methodology corpus owns SEO; the SPA is intentionally undiscoverable beyond `/`), the router can switch to History API additively; the route table shape stays the same.

**Decision 2: IntersectionObserver + 5-second dwell as the FR12 Continue gate, not a hard scroll-past requirement.** FR12 says "Continue is not available until the user has had the opportunity to read the disclosure" — that's "opportunity," not "proof." A pure scroll-past requirement breaks for screen-reader users who navigate by landmarks (they might never trigger a scroll event); a pure dwell-timer breaks for skim-readers who legitimately read fast. The compromise (whichever fires first) handles both: SR users hit the sentinel `<div tabindex="-1">` on Tab traversal which counts as "scrolled to bottom"; skim-readers wait 5 seconds. The disclosure has been seen by both populations. The 5-second value is the architecture's chosen FR12 dwell heuristic at v1; if user-testing in Story 3-8 reveals it's too short or too long, Epic 6 can tune (this is exactly the kind of UX-hypothesis-tuning the hallway test is for).

**Decision 3: `aria-disabled` instead of native `disabled` on the Continue button.** Native `disabled` removes the button from the focus tab order (architecture line 504 favors WCAG 2.2 AA; SR users would not be told the button exists at all if it were native-disabled). `aria-disabled="true"` keeps it focusable and announces "dimmed" / "disabled" semantically — the SR user knows the Continue exists, knows it's not yet available, and Tab-traverses to it (which itself triggers the sentinel and flips the gate). The CSS `[aria-disabled="true"]` selector handles the visual muted-state.

**Decision 4: EN strings.json owns the actual copy, not the JS files.** Architecture line 836 mandates the bare-key fallback. If copy lived in JS template literals, every component would need its own EN fallback hardcoded, and a missing-key bug would render the empty string (a silent failure). With copy in `strings.json`, a missing key renders the bare literal (e.g., `consent.continueButton`) in the UI — a loud failure that no reviewer will miss. This story bakes the EN copy as content, not code.

**Decision 5: `IntersectionObserver` with sentinel + threshold 1.0, NOT scroll event polling.** Scroll listeners fire dozens of times per second and would burn battery + serialize main-thread work. A single `IntersectionObserver` callback fires once when the sentinel enters the viewport at 100% — zero per-frame work otherwise. Sentinel is `tabindex="-1"` + visually-hidden so it's keyboard-traversable but not visible (a screen-reader user Tab-stops at it on the way down, which flips the gate). Architecture line 503 (parallel `<link>` chain to avoid render blocking) is the same philosophy — favor browser-native concurrency over hand-rolled polling.

**Decision 6: `tests/unit/*.test.mjs` (not `tests/contract/*.spec.mjs`) for these scene tests.** Architecture line 908 distinguishes contract specs (`*.spec.mjs` — schema/event-shape contracts the system upholds) from unit tests (`*.test.mjs` — behavior of individual modules). Landing-scene / consent-scene / routing / locale-loader are module-behavior tests, not contracts; they belong in `tests/unit/`. The `state-shape.spec.mjs` from Story 3-2 is appropriately `.spec.mjs` because it pins a JSON Schema contract.

**Decision 7: `Date.now` and `IntersectionObserver` posture relative to architecture line 912.** Architecture line 912 (enforcement list) forbids `Date.now` in shipped code paths in some contexts. Story 3-1 ADR cleared `state.js`'s use of `Date.now()` for `startedAt` (serialization timestamp ≠ event payload). This story does NOT introduce new `Date.now` callsites — `setTimeout` is the dwell mechanism, not a timestamp. `IntersectionObserver` is a stable Web API (Baseline 2019); no polyfill required for the supported browser matrix (Chromium 88+ / Firefox 78+ / Safari 12.1+ / WebKit-equivalent Yandex). Architecture line 912 does not forbid `IntersectionObserver`.

### Architecture compliance — references

| Topic | Source |
|---|---|
| SPA entry `src/index.html`, mount point `#app`, fallback `#fallback`, `<script nomodule>` toggle | architecture.md line 403, line 512, line 1062 |
| Parallel `<link rel="stylesheet">` chain (D5) | architecture.md line 505 |
| Hash-based router (`#/test`, `#/result`) | architecture.md line 285, line 1067 |
| `src/assessment/` Domain A boundaries (no imports from `utils`/`shared`/`common`) | architecture.md line 1026 |
| Named-export discipline; no default export, no `import *` | architecture.md line 887 |
| `kebab-case` for files, `camelCase` for JS identifiers, `namespace.key` camelCase for i18n keys | architecture.md line 614, line 638, line 907, line 913 |
| `tests/unit/<name>.test.mjs` vs `tests/contract/<name>.spec.mjs` | architecture.md line 908, line 992 |
| Forbidden: `Math.random`, `Date.now` (in event payloads), `console.log`, `localStorage` (without explicit user action), `navigator.share`, `<dialog>`, `role="alert"` | architecture.md line 912; prd.md NFR9, NFR10 |
| Bare-key fallback for missing i18n keys (architecture-line-837 highly-visible failure mode) | architecture.md line 836 |
| `<script nomodule>` fallback + `<noscript>` mirror (D10) | architecture.md line 513 |
| i18n bundle path `/src/content/i18n/<lang>/strings.json` | architecture.md line 391, line 1104 |
| Locale-loader as runtime harness in `src/assessment/i18n/` (Winston revision) | architecture.md line 1039, line 1079 |
| Consent + validity envelope (FR9, FR10, NFR13) | prd.md line 796, line 797, line 904 |
| FR11 "Not today" exit | prd.md line 798 |
| FR12 Continue gated until disclosure displayed | prd.md line 799 |
| FR41 zero third-party (network-trace from Epic 1) | epic.md line 651 |
| Cognitive-load budget — Domain A modules ~30 KB total | architecture.md line 58, line 67 |
| Two-layer CSS token architecture (Story 1-10 lock-in) — semantic tokens only at component level | epic.md line 708 |
| Lint-no-cookie-banner shipped Epic 1 (Story 1-9) | tools/lint-no-cookie-banner.mjs (existing) |
| Lint-no-role-alert shipped Epic 1 | tools/lint-no-role-alert.mjs (existing) |
| Lint-no-share shipped Epic 1 | tools/lint-no-share.mjs (existing) |

### Previous story intelligence (from Stories 3-1, 3-2, 1-9, 1-10, retro patterns)

- **Story 3-1** authored `docs/adr/methodology-handoff-url-contract.md` defining `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` URL pattern. Landing's "Read the methodology" link MUST use this pattern: `/methodology/v1.0.0/en/`. Hardcoding `v1.0.0` at v1 is acceptable — Story 3-6 will land the 3 EN stub pages at that path; Story 4-1 will deploy `v1.0.0` as the first corpus version. If `v1.0.0` ever changes, the landing's link target updates with it (the URL is path-canonical, not a redirect).
- **Story 3-2** established the `tests/contract/state-shape.spec.mjs` pattern for storage-stub installs before dynamic import. Story 3-3 follows that pattern in `tests/unit/*.test.mjs` — install `document`/`window`/`IntersectionObserver` stubs at file top, then dynamic-import the SUT. The pattern is: stub first, import second.
- **Story 3-2** added `resetState()` to `state.js`. Story 3-3 calls it from the "Not today" handler in consent-scene. The function signature is `resetState() → void`; it sets module state back to `freshState()`. Verified via existing contract test.
- **Story 1-9** (`lint-no-cookie-banner.mjs`) is already shipped and is part of `make lint`. Story 3-3 must NOT introduce strings matching the forbidden regex. The forbidden regex is `/cookie[-_]?(banner|consent)/i`. The word "consent" alone does NOT match (it requires `cookie-` or `cookie_` prefix). The EN copy uses "consent" alone (in URL paths, in copy) — safe.
- **Story 1-10** locked the two-layer CSS token architecture: `primitives.css` (raw token values) + `semantic.css` (semantic tokens that reference primitives). Component CSS must use ONLY semantic-token variables. Story 3-3's three new CSS files comply: no literal hex/px/font-family.
- **Recent commits** (`8231130 3-2: implement state.js + contract test`, `42faeb1 chore(tds): state sweep`) confirm Story 3-2 finalized as `status=review`. Story 3-3 builds directly on top: imports `state.js` + `state.schema.json` are not modified.
- **Epic 1 lint posture** is "all lints, all PRs" — every change to `src/**` (including HTML, JS, CSS, JSON) triggers the full lint suite per architecture line 599. Story 3-3 must keep ALL existing lints exit 0 (`lint-cognitive-load-budget`, `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent`, `lint-claims-manifest`, `eslint`).
- **`lint-no-localStorage-without-consent.mjs`** (Epic 1) — Story 3-3 must NOT introduce a `localStorage.setItem` or `localStorage.getItem` in `src/**`. The locale-loader explicitly does NOT touch storage at v1; locale persistence is Story 7-1's domain.

### Files added / modified summary (anticipated)

**New (10 files):**
- `src/index.html`
- `src/assessment/main.js`
- `src/assessment/routing.js`
- `src/assessment/landing.js`
- `src/assessment/consent.js`
- `src/assessment/i18n/locale-loader.js`
- `src/assessment/error-fallback.js`
- `src/content/i18n/en/strings.json`
- `src/css/components/landing.css`
- `src/css/components/consent-scene.css`
- `src/css/components/chrome-header.css`
- `tests/unit/landing-scene.test.mjs`
- `tests/unit/consent-scene.test.mjs`
- `tests/unit/locale-loader.test.mjs`
- `tests/unit/routing.test.mjs`

(Note: 15 new files including tests + CSS. Total LOC budget ~600–800 LOC including tests. The `src/assessment/*.js` modules together stay under ~300 LOC at v1, comfortably within the ~30 KB Domain A budget.)

**Modified (0 files):** No existing files touched. `state.js`, `state.schema.json`, `Makefile`, `BUDGETS.json`, `.github/workflows/pr-checks.yml`, the three ADRs — all unmodified.

**Deleted (0 files):** None.

### Testing standards summary

- All four unit-test files use `node:test` + `node:assert/strict` (matching Story 1-10 / 3-2 precedent).
- DOM stubs are scope-limited per file (only the methods/properties the SUT actually touches). Documented at file top.
- `node:test` mock timers (`t.mock.timers.tick(...)`) used for the dwell-gate assertion. Node 22+ supports this; the project's Node version (22.22.2 per preflight) is compatible.
- `globalThis.fetch` stubbed in `locale-loader.test.mjs` — return a `Response`-like object with `.ok`, `.json()`. Use a small helper at file top.
- Tests run via `make test` (existing glob picks them up). No CI workflow change required — the `state-shape-contract` job from Story 3-2 already runs the contract suite; the new unit tests run inside `make test` which is already exercised by existing CI lint/test jobs.
- The `test` count delta (≥ +8) is verified in Task 11.1.

### Project Structure Notes

- `src/index.html` is the **first HTML file** in the repo (Story 3-3 lands it; earlier epics had no shipped HTML).
- `src/assessment/i18n/` is currently empty (per `ls src/assessment/i18n/`); Story 3-3 lands `locale-loader.js` there.
- `src/content/i18n/en/` is currently empty; Story 3-3 lands `strings.json` there. The `ru/` and `pl/` siblings remain empty until Story 7-3/7-4.
- `src/css/components/` currently only has `.gitkeep`; Story 3-3 lands the first three component CSS files. The remaining 22 components are scoped to Epics 3-5/3-6/6.
- `tests/unit/` is currently empty (Story 1-10 used `tests/contract/`); Story 3-3 lands the first unit tests.
- **No `BUDGETS.json` updates required** — the cognitive-load-budget lint doesn't yet track `src/assessment/` (Story 3-4 / 3-5 will tune budgets once the full assessment SPA is in place). Architecture line 67 anticipates ~30 KB across the full assessment SPA; Story 3-3's contribution (~10 KB JS + ~5 KB CSS at v1) stays under proportionate share.

### Implementation Notes — gotchas to avoid

1. **`<script nomodule>` MUST be parseable by old browsers.** The inline JS in the nomodule script tag (e.g., `document.getElementById('fallback').style.display='block'`) MUST be ES5-compatible — no arrow functions, no `const`/`let`, no template literals. Use `var` + traditional function syntax. (The nomodule tag itself is ES5-era browsers' fallback; if its body uses ES6+ syntax, those browsers crash and show neither the SPA nor the fallback.)
2. **`<noscript>` content is parsed even when JS is enabled** — but it's not rendered. A test asserting "no `role="alert"` in `<noscript>`" still hits the lint. Keep the `<noscript>` content semantically clean (no `role="alert"`, no inline scripts).
3. **`IntersectionObserver` callback fires asynchronously.** Tests must `await` (e.g., `await new Promise(r => queueMicrotask(r))`) after manually invoking the observer callback to let the post-callback DOM mutation settle. Mirror the pattern used by `state-shape.spec.mjs` for async assertions.
4. **`window.location.hash` mutation in tests.** Node's `window` stub must support `location.hash` reads + writes. A minimal stub: `globalThis.window = { location: { hash: '' }, addEventListener: () => {}, dispatchEvent: () => {} }`. The test's "navigate" assertion reads `window.location.hash` after the mutation.
5. **`fetch` in the locale-loader returns a Response object.** Stub returns `{ ok: true, status: 200, json: async () => parsedBundle }`. If the test stubs `{ ok: false }`, the loader's fallback logic engages (retry with `'en'`, then empty).
6. **`document.title` mutation.** Story 3-3 leaves `<title>` static at v1 (literal "IQ-ME — a fluid-reasoning screener"). The future locale-switch story will need `document.title = localeLoader.get('chrome.titleAppDefault')`. Don't pre-introduce that logic in this story.
7. **CSS cascade order matters for the parallel `<link>` chain.** `reset.css` must come first (resets defaults); `primitives.css` before `semantic.css` (semantic references primitives); `base.css` before components (components reference base typography); `utilities.css` last (utility classes override component classes per the BEM-utility pattern). Spelled out in Task 1.2. If `tools/lint-css-link-order.mjs` lands in Story 3-5, the `<link>` chain order is asserted by lint — emit it correctly now.
8. **`#start-test-btn` and `#continue-btn` IDs.** Tests rely on these IDs. Do NOT rename them. If the dev agent prefers BEM-class-only DOM (avoiding IDs), the test selectors break — keep the IDs.
9. **`<a href="/methodology/v1.0.0/en/">` link target.** Story 3-6 will land the 3 stub pages at that exact path. The hardcoded path is the URL contract. Story 4-1 will replace `v1.0.0` with the first corpus version on release; until then, `v1.0.0` IS the target (architecture line 1278 anticipates `dist/methodology/v1.0.0/en/...`).
10. **`fetch('/src/content/i18n/en/strings.json')` URL.** This is the deployment path — `src/` is served as `/src/` at the SPA. In development (Story 4-2 lands `tools/dev-server.mjs`), `src/` is the document root; in production the SPA is deployed to GitHub Pages so the path remains valid. Don't introduce a build-time path rewrite.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3] — Original AC formulation (epic narrative lines 986–1013).
- [Source: _bmad-output/planning-artifacts/architecture.md#L285, L391, L403, L495-512, L599, L614, L638, L836-838, L907-913, L1026, L1062-1080, L1104] — Routing, SPA shell, i18n loading, fallback, naming conventions, bare-key fallback, Domain boundaries, file layout.
- [Source: _bmad-output/planning-artifacts/prd.md#FR1, FR9-FR13, FR41, NFR9, NFR10, NFR12-NFR13, NFR20, NFR21, NFR28] — User-facing FRs + a11y + zero-third-party + reading-level.
- [Source: _bmad-output/implementation-artifacts/stories/3-2-implement-state-js-contract-test.md] — state.js exports (incl. resetState), test-stubbing precedent.
- [Source: _bmad-output/implementation-artifacts/stories/3-1-author-the-three-contract-adrs-state-shape-reveal-stage-event-methodology-handoff-url.md] — methodology URL contract, reveal-stage event ADR (Story 3-3 does NOT touch reveal-stage; Story 3-5 owns that wire-up).
- [Source: _bmad-output/implementation-artifacts/stories/1-9-eslint-config-no-restricted-paths-docs-domain-map-md.md] — lint-no-cookie-banner / lint-no-share / lint-no-role-alert posture.
- [Source: _bmad-output/implementation-artifacts/stories/1-10-design-system-foundation-primitives-css-semantic-css-dark-mode-overrides-tokens-spec-ts.md] — Two-layer CSS token architecture.
- [Source: tools/lint-no-cookie-banner.mjs] — Forbidden regex `/cookie[-_]?(banner|consent)/i`.
- [Source: src/assessment/state.js, src/assessment/state.schema.json] — Imports for the consent-scene "Not today" handler.
- [Source: docs/adr/methodology-handoff-url-contract.md] — `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` URL pattern.

## Dev Agent Record

### Agent Model Used

(populated by execute-story)

### Debug Log References

### Completion Notes List

- JS modules + EN i18n bundle landed; all 8 frozen unit tests green (43 → 0 failures); contract suite unchanged (16 pass); make lint exit 0.
- HTML shell + 3 component CSS files landed. 355 tests pass (+43 from baseline 312), 0 fail; contract suite 16 pass; make lint exit 0; standalone lint-no-share/lint-no-role-alert/lint-no-cookie-banner clean. Story 3-3 impl phase complete.
- Story 3-3 review-ready: 11 tasks complete, 8 unit-test files (37 frozen tests) green, lint chain clean, contract suite intact, full suite 355 pass / 0 fail (was 312/43).

### File List

- src/assessment/main.js
- src/assessment/routing.js
- src/assessment/landing.js
- src/assessment/consent.js
- src/assessment/i18n/locale-loader.js
- src/assessment/error-fallback.js
- src/content/i18n/en/strings.json
- src/index.html
- src/css/components/landing.css
- src/css/components/consent-scene.css
- src/css/components/chrome-header.css

## Specialist Self-Review

**Decisions made:**

1. **Module-level `inFlight` promise (not `started` boolean) for `main.js` idempotency.** The frozen test `AC-2.3` clears `#app` then re-invokes `start()` against a now-throwing `fetch` responder; a hard `started=true` flag would block the re-attempt and leave `#app` empty (NFR20 violation). Coalescing only while a bootstrap is *in flight* keeps the practical idempotency contract (concurrent callers see one bootstrap) without locking out a legitimate retry path. Production callers still hit `start()` exactly once via `DOMContentLoaded`, so this is observable only in test/dev hot-reload.

2. **Routing `start()` re-renders when `hash !== activeHash`, idempotent otherwise.** AC-3.3 requires "second `start()` does not double-register listener or re-dispatch initial-render", while AC-3.7 changes `window.location.hash` then calls `start()` and expects a route-change to fire. The split is `started && hash === activeHash` → no-op; `started && hash !== activeHash` → re-render. AC-3.3 stays green because the hash never changes between its two calls.

3. **`locale-loader.load()` clears `cache.delete('en')` on EN-fetch failure.** AC-6.6 expects that after `load('en')` against a 500 responder, subsequent `get('landing.headline')` returns the bare-key literal — the architecture-line-836 "highly-visible failure" mode. Without the cache-delete, EN strings from a prior successful `load('en')` would survive and `get()` would return the cached string, masking the failure. The cache-delete makes the failure observable as the architecture intends.

4. **Routing always renders after `navigate()` (does not rely on synchronous `hashchange`).** Node test stubs do not dispatch `hashchange` synchronously after `window.location.hash =`, and a real browser fires it asynchronously after the current task. Direct `renderRoute(newHash)` after the hash mutation satisfies AC-3.5 (`navigate('consent')` dispatches `iqme:route-change` with `detail.route='#/consent'`) without depending on event-loop ordering. Duplicate dispatch via the hashchange listener is prevented by the `hash === activeHash` guard.

**Alternatives considered:**

- *Make `start()` strictly idempotent and require callers to `stop()` first.* Adds an export not in the AC contract and breaks AC-2.3 which doesn't call any teardown between attempts.
- *Mock `routing.navigate` in `landing.js`/`consent.js` via dependency injection.* The frozen `landing-scene.test.mjs:AC-4.9` and `consent-scene.test.mjs:AC-5.9` deliberately observe `window.location.hash` mutation — they want the real wiring chain `landing → routing → window.location`. Direct import-based wiring is what the tests check.
- *Implement scenes as classes / closures.* The named-export module-level state (`continueBtn`, `dwellTimer`, `observer`) is the simplest shape that satisfies AC-5.11 "unmount() removes both click listeners" — the references survive between render and unmount as long as render/unmount are called as a pair, which the router enforces.

**Framework gotchas avoided:**

- `localStorage`/`sessionStorage`/`Math.random`/`Date.now`/`console.log` strings forbidden in the `lint-no-localStorage-without-consent` + per-file `AC-*.7/8/12/4` source-greps. Wrote a comment about "forbidden globals" that included the word `localStorage`; the regex `\blocalStorage\b` matched the comment and failed `AC-6.7`. Removed the comment.
- `role="alert"` substring in the `error-fallback.js` header comment tripped `lint-no-role-alert.mjs` (`/role\s*=\s*["']alert["']/`). Reworded the comment.
- `font-family: inherit;` in component CSS tripped the spec's CSS self-check regex `font-family:[^v]` (which expects the next char to be `v` for `var(--*)`). Removed the line; buttons inherit `font-family` from `<body>` by default.
- `escapeText()` helpers on all i18n strings written into `innerHTML`. The strings come from `localeLoader.get()` which currently sources from a vetted JSON bundle, but defense-in-depth against future copy that contains `<` or `&`.
- `<a href="#/" id="not-today-link">` — the AC-5 spec explicitly says "do NOT `preventDefault` — the hashchange will route to landing". The click listener calls `state.resetState()` and lets the native hash navigation fire. AC-5.10 verifies `defaultPrevented === false`.

**Areas of uncertainty:**

- **Hash navigation in jsdom.** My `routing.navigate()` calls `renderRoute()` directly after mutating `window.location.hash` to avoid relying on the browser's async `hashchange` dispatch. In a real browser, this means `navigate()` triggers two renders (once from the direct call, once from the hashchange event) — but the second is guarded out by `hash === activeHash`. I have not exercised this in a real browser; Playwright e2e (Story 3-7) will catch any drift. *Auditor should focus here.*
- **`__pycache__` directory** under `_bmad/tds/shared/__pycache__/` was created during this session by transitive Python execution; not gitignored. Did not stage it. May need a `.gitignore` rule in a future story.
- **`role="status"` on the error-fallback `<section>`.** `role="status"` is an ARIA live region (polite by default) that announces additions. This is the right semantic for "something went wrong, here's a fallback" per WAI-ARIA. The lint forbids only `role="alert"`. Not certain whether the future `lint-no-role-status` would object — none exists currently.
- **The `__H_*` / `__C_*` sentinel strings** in test files prove that text content flows from the i18n bundle (not hardcoded in JS). My escapeText() runs on these too — `__H_HEADLINE__` is ASCII-safe so escape is a no-op. Confirmed via local test run.

**Tested edge cases:**

- AC-2.3: fetch throws → bootstrap catches → fallback renders (NFR20). Verified.
- AC-3.7: unknown hash `#/garbage` → falls back to landing without throwing → route-change dispatches. Verified.
- AC-5.6 / AC-5.7: IO-fire path AND timer-flip path both flip the gate AND disconnect IO AND cancel the other timer. Verified both directions.
- AC-5.8 / AC-5.9: click before flip = no nav; click after flip = `#/test`. Verified.
- AC-5.10: Not-today click calls `state.resetState()` AND lets native nav fire (`defaultPrevented === false`). Verified via state.js public API observation.
- AC-5.11: unmount disconnects IO + cancels timer + removes both click listeners; post-unmount clicks neither navigate nor reset state. Verified.
- AC-6.5: `load('ru')` with RU fetch 404 → retries with EN → `getCurrentLocale() === 'en'`. Verified.
- AC-6.6: `load('en')` with EN fetch 500 → resolves with `{}` AND `get('landing.headline')` returns `'landing.headline'` literal. Verified (required the cache-delete fix).
- `make lint` exit 0 against full src/ tree (13 scanned files including new HTML + 6 JS modules + 3 CSS + EN strings.json).
- `make test-contract` exit 0 with pass count unchanged from end-of-3-2 (16 pass).
- HTML parses via `python3 html.parser` (AC-11.5). Verified.
- JSON parses (AC-11.6). Verified.
