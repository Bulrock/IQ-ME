---
id: 7-1-i18n-harness-locale-loading-language-switcher
title: "Story 7.1: i18n harness + locale loading + language-switcher"
status: review
---

# Story 7.1: i18n harness + locale loading + language-switcher

## Story

As an **EN/RU/PL-speaking visitor**,
I want **to select my locale at landing time (FR37) and have the entire UI render in my language (FR38) — landing, consent, item instructions, item-option labels, progress indicator, result-page copy, methodology corpus links**,
so that **the primary underserved audience (Russian- and Polish-speaking adults) is fully served and the language-switcher in the chrome-header (UX-DR9) works end-to-end**.

## Acceptance Criteria

1. **AC-1 (locale-loader EXTEND — `t()` alias + `SUPPORTED` guard, NOT a rewrite):** `src/assessment/i18n/locale-loader.js` keeps its Story 3.3 single-eager-bundle `load(localeCode)` / `get(key)` / `getCurrentLocale()` contract verbatim (architecture D4 — `src/...i18n/<lang>/strings.json`, one fetch per locale, FR8 locks locale mid-session so no late-binding namespace files are needed; the epic AC's "namespace files" requirement is satisfied by the existing top-level namespace keys *inside* `strings.json` — `chrome`/`landing`/`consent`/`itemRunner`/`result`/`tailScenes`). It ADDS:
   - `export const SUPPORTED = ["en", "ru", "pl"];` — the canonical supported-locale list (Architecture gap #2).
   - `export function normalizeLocale(code)` — lowercases, takes the primary subtag (`ru-RU` → `ru`), and returns the code if in `SUPPORTED`, else `"en"` (the documented fallback). Pure, no I/O.
   - `export function t(key) { return get(key); }` — the translator alias named in the epic AC. `get()` remains the implementation; `t()` is the public name components import going forward. No behavior change: missing key still resolves active-locale → `en` → bare-key literal (architecture line 836-837 highly-visible-failure pattern).
   - `load()` is wrapped so a non-supported `localeCode` is normalized through `normalizeLocale()` before the fetch (an unsupported code fetches EN directly rather than 404-then-fallback).
2. **AC-2 (active-locale resolution at bootstrap — `localStorage` opt-in only, NFR9; locale-loader stays storage-free):** A new `export function resolveInitialLocale({ stored, navigatorLang })` in `locale-loader.js` is a PURE function (no global reads — preserves the Story 3.3 frozen invariant AC-6.7 that `locale-loader.js` contains NO `localStorage`/`sessionStorage`). It returns the boot locale with this precedence: (a) `stored` if truthy AND in `SUPPORTED`; (b) else `normalizeLocale(navigatorLang)` if that primary subtag is in `SUPPORTED`; (c) else `"en"`. The `localStorage` READ lives in `src/assessment/main.js` bootstrap (`const stored = localStorage.getItem("locale")`), which then calls `resolveInitialLocale({ stored, navigatorLang: navigator.language })` and passes the result to `load()`, replacing any hardcoded `"en"` boot locale. **No `localStorage` WRITE occurs during bootstrap** (NFR9 — first render must not mutate storage; writes happen only on explicit switcher click, AC-3). The resolved locale is reflected on `<html data-locale="...">` (architecture BEM state-attribute convention, line 210) so CSS `[data-locale="ru"]` hooks work. Keeping it pure mirrors how `theme.js` (not the shared core) owns the theme `localStorage` while the core stays storage-free.
3. **AC-3 (language-switcher component — keyboard-first, replaces Epic 6 placeholder, UX-DR9):** `src/css/components/language-switcher.css` + `src/assessment/language-switcher.js` are created. `language-switcher.js`:
   - Exports `init(rootEl?)` which renders, into the `.chrome-header__language-switcher` slot (the non-interactive placeholder span from Story 6.4 AC-1), a keyboard-first **radio group** (`<fieldset class="language-switcher">` with a visually-hidden `<legend>` and one `<input type="radio" name="locale">` per `SUPPORTED` locale, each with a visible `<label>`: `EN` / `RU` / `PL`). The radio matching the current active locale is `checked`. Rationale for radio-group over `<select>`: matches the tri-state `theme-toggle` pattern from Story 6.4 AC-3 (consistency + the same `:focus-visible` keyboard affordance), and the SUPPORTED set is fixed at three.
   - On a radio click **outside an active session** (see AC-4 for the in-session block — Story 7.2 owns the blocker hint; 7.1 only needs the not-in-session happy path): `localStorage.setItem("locale", code)` (NFR9 — write ONLY on explicit user click, never on `init()`), then reload the page (`window.location.reload()`) so the new locale's bundle loads cleanly from bootstrap. A unit test spies on `Storage.prototype.setItem` across `init()` to assert ZERO writes during render.
   - The fieldset legend label key is `chrome.languageSwitcherLegend` (EN: `"Language"`); the three radio labels are the literal locale codes `EN`/`RU`/`PL` (not translated — they are endonym-neutral ISO labels, consistent across all three bundles).
   - `:focus-visible` styling in `language-switcher.css` mirrors `theme-toggle.css` (`outline: var(--space-1) solid var(--color-focus-ring); outline-offset: var(--space-1);`). Restraint-first chrome weight (no accent color).
4. **AC-4 (in-session guard stub — defers full hint to Story 7.2):** `language-switcher.js` checks `state.js` for an active session (post-consent, pre-result) before applying a switch. When a session is active, `init()`'s click handler does NOT write `localStorage`, does NOT reload, and instead sets `data-locale-switch-blocked="true"` on the fieldset and calls an injected `onBlockedAttempt()` callback (default no-op). **Story 7.2 wires `onBlockedAttempt` to the `locale-switch-blocker-hint` and owns FR8 enforcement copy.** 7.1 ships only the guard seam + the `data-locale-switch-blocked` attribute hook and a unit test asserting no `localStorage.setItem` / no reload fires when a session is active.
5. **AC-5 (no hardcoded English in `src/assessment/**` — every UI string via `t()`/`get()`):** Audit every `.js` in `src/assessment/` for string literals rendered to the DOM (`textContent =`, `innerHTML =`, `setAttribute("aria-label", ...)`, `.placeholder =`, template-literal interpolations into rendered markup). Every such user-visible string MUST resolve through `localeLoader.get(ns + "." + key)` (or the new `t()`), keyed into the `NS` map in `src/assessment/routing.js` and present in `src/content/i18n/en/strings.json`. The `NS` map gains a `languageSwitcher` namespace (`["legend"]`) and any keys discovered un-routed during the audit. **Out of scope:** developer-facing `console.*` strings, `Error` messages thrown for programmer errors, `data-test-*` hooks, and the locale radio labels (`EN`/`RU`/`PL`, AC-3). A new lint task (AC-8) mechanizes this audit so it cannot regress.
6. **AC-6 (RU + PL bundle scaffolding — parity-aware, NOT human-translated content):** `src/content/i18n/ru/strings.json` and `src/content/i18n/pl/strings.json` are created mirroring the EN `strings.json` key tree exactly (full block-level key parity — every namespace, every key present). **Per the epic-7 dev-phase decision (infra-now, content-gated-on-9c/9d): the RU/PL string VALUES are EN-source placeholders carrying a machine-readable stale marker, NOT clinical-register human translations.** Each non-EN bundle gets a top-level `"_meta"` block: `{ "locale": "ru", "translationStatus": "in-progress", "reviewer": "TBD", "reviewerHandle": "@TBD-ru-reviewer", "sourceHashEN": "<sha256 of en/strings.json at this commit>" }`. The placeholder string values equal the EN value prefixed with no visible marker (so the harness renders *something* readable) — the `translationStatus: in-progress` + `sourceHashEN` are what the parity lint (Story 7.5b) reads to flag drift. This keeps `lint-translation-parity` meaningful (full key parity passes; stale-content surfaces via status) without faking human authorship (ACs of 7.3/7.4/7.6 forbid AI translation). Document this explicitly in Dev Notes for the Mode-2 auditor.
7. **AC-7 (`<html data-locale>` + 3-locale Playwright happy path):** New `tests/playwright/i18n-locale-switch.spec.mjs` drives the SPA and asserts:
   - **Switcher DOM:** `.language-switcher` fieldset present in `chrome-header`; three radios (EN/RU/PL) with the boot locale checked; visually-hidden legend reads the EN `chrome.languageSwitcherLegend` value when EN-active.
   - **Persist-on-click + reload (not-in-session):** from landing (`#/`), spy `Storage.prototype.setItem` via `page.addInitScript`; assert ZERO `["locale", *]` writes after first render; click the `RU` radio; assert exactly one `["locale","ru"]` write and that the page reloaded with `<html data-locale="ru">`.
   - **First-render correctness with empty `localStorage`:** fresh context (no storage), assert boot locale resolves to EN (CI default `navigator.language` is `en-US`) and renders without `undefined` labels.
   - **3-locale full happy-path:** for each of `["en","ru","pl"]`, set `localStorage.locale` before navigation, run landing → consent → (skip the 25-min item loop via the `?test=1` test-hook fast-path used by existing specs) → result, and assert no element with `textContent` matching an English-only stopword set (`\b(the|and|your|score|continue|start)\b`) appears while `data-locale` is `ru` or `pl` **in surfaces backed by translated keys** (placeholder bundles will currently echo EN — see AC-6; the spec asserts the *mechanism* by stubbing the RU/PL bundle with a sentinel value `"⟦ru⟧"` fixture for the namespaces under test, proving `t()` resolves to the active-locale bundle, not EN). EN leg asserts real copy.
8. **AC-8 (lint-i18n-coverage — mechanize AC-5 so hardcoded strings cannot regress):** Create `tools/lint-i18n-coverage.mjs` (architecture line 838 — the documented optional v1 lint, now activated for Epic 7). It greps `src/assessment/**/*.js` for DOM-rendered string literals not flowing through `get`/`t`, and asserts every `get(ns + "." + key)` / `t("ns.key")` reference resolves to a key present in `src/content/i18n/en/strings.json`. It fails the build on (a) a DOM-rendered hardcoded English literal outside the AC-5 allowlist, or (b) a referenced key missing from the EN bundle. Wire it into `Makefile` `lint` target and add a dedicated `lint-i18n-coverage` job to `.github/workflows/pr-checks.yml` (per lesson-2026-06-03-001 — CI wires lints/specs explicitly, never via greedy glob). Budget: ~50 LOC (architecture line 838).
9. **AC-9 (cognitive-load budget — `app-modules-bytes` + `i18n-harness-bytes`):** `language-switcher.js` (~1.5 KB) + locale-loader additions (~0.5 KB) add to `src/assessment/**`. If `budgets.json` `app-modules-bytes` is exceeded, bump to the next reasonable ceiling and document the rationale in the budget `rationale` string ("Story 7.1 bump to accommodate language-switcher.js init + radio handlers + locale-loader t()/SUPPORTED/resolveInitialLocale additions"). If a distinct `i18n-harness-bytes` budget exists (~15 KB target per NFR32 / architecture line 58), verify locale-loader stays within it. Bumps are justified by epic scope (i18n harness was always the Epic-7 must-have) — document for the Mode-2 auditor.
10. **AC-10 (unit tests — locale-loader + language-switcher logic):** `tests/unit/locale-loader.test.mjs` (EXTEND if it exists, else create) covers: `normalizeLocale("ru-RU") === "ru"`, `normalizeLocale("de") === "en"`, `SUPPORTED` exact membership, `t()` delegates to `get()` (same return for present + missing keys incl. bare-key literal), `resolveInitialLocale()` precedence (localStorage > navigator.language > en) with NO `setItem` during resolution (spy). `tests/unit/language-switcher.test.mjs` (new, jsdom-stub pattern from `tests/unit/theme.test.mjs`) covers: `init()` renders three radios with current locale checked + ZERO `setItem` on render; not-in-session click writes `["locale", code]` once and triggers reload (stub `window.location.reload`); in-session click writes NOTHING, no reload, sets `data-locale-switch-blocked="true"`, invokes `onBlockedAttempt`.
11. **AC-11 (no contract regression):** `make test` green; `make lint` green including `lint-i18n-coverage` (new), `lint-translation-parity` (full key parity now present for RU/PL — partial/in-progress content status is expected and must not fail the build on `translationStatus: in-progress`; coordinate with Story 7.5b's graduation — if parity lint is still the 4.7 no-op stub at this story's execution time, it stays green trivially), `lint-no-localStorage-without-consent` (the new switcher click is an opt-in event — verify the lint allowlist accepts the `language-switcher.js` setItem path, mirroring `theme.js` from Story 6.4), `lint-css-source-co-equal`, `lint-spec-carry-forward`. Existing Story 3.3 / 6.4 chrome-header behavior preserved (placeholder span replaced cleanly; `aria-label="Site chrome"` on `<header>` retained). `make build` byte-stable invariant (Story 4.2) preserved.
12. **AC-12 (integrity ratification — class-A guardrail):** Any class-A frozen surface touched (frozen tests, `state.schema.json`, `budgets.json`) is integrity-recorded per the TDS ceremony before the state transition. New files (`language-switcher.js/.css`, RU/PL `strings.json`, `lint-i18n-coverage.mjs`, new test files) are recorded as they are written. Cite the touched class-A list in Dev Notes.

## Tasks / Subtasks

- [x] **Task 1: locale-loader extend — `SUPPORTED`, `normalizeLocale`, `t()`, `resolveInitialLocale`** (AC: 1, 2)
  - [x] Add `SUPPORTED`, `normalizeLocale`, `t` (alias of `get`), `resolveInitialLocale` exports; wrap `load()` to normalize unsupported codes; no behavior change to `get()`/`getCurrentLocale()`.
  - [x] `main.js` bootstrap: call `resolveInitialLocale()` → `load(locale)`; set `<html data-locale>`.
- [x] **Task 2: language-switcher component (CSS + JS)** (AC: 3, 4)
  - [x] `language-switcher.css` — radio-group, keyboard `:focus-visible`, restraint-first tokens only.
  - [x] `language-switcher.js` — `init()` render radios (current checked), not-in-session click → setItem+reload; in-session guard seam (`onBlockedAttempt`, `data-locale-switch-blocked`); zero setItem on render.
  - [x] Replace Story 6.4 placeholder span in `index.html` / chrome render path with the switcher mount; init from `main.js`.
- [x] **Task 3: string audit + NS map + EN bundle keys** (AC: 5)
  - [x] Grep `src/assessment/**` for DOM-rendered literals; route each through `get`/`t`; add `languageSwitcher` namespace to `routing.js` `NS`; add `chrome.languageSwitcherLegend` + any discovered keys to `en/strings.json`.
- [x] **Task 4: RU + PL bundle scaffolding (parity-aware placeholders)** (AC: 6)
  - [x] Mirror EN key tree into `ru/strings.json` + `pl/strings.json` with `_meta` (translationStatus in-progress, reviewer TBD, sourceHashEN). Placeholder values = EN values. NO human translation.
- [x] **Task 5: lint-i18n-coverage tool + CI wiring** (AC: 8)
  - [x] `tools/lint-i18n-coverage.mjs` (~50 LOC); Makefile `lint` target; dedicated `pr-checks.yml` job (explicit, not glob).
- [x] **Task 6: tests — unit + Playwright (3-locale)** (AC: 7, 10)
  - [x] `tests/unit/locale-loader.test.mjs` + `tests/unit/language-switcher.test.mjs`.
  - [x] `tests/playwright/i18n-locale-switch.spec.mjs` (switcher DOM, persist+reload, empty-storage first render, 3-locale happy path with `⟦ru⟧` sentinel fixture proving active-bundle resolution); add explicit `pr-checks.yml` job for the new spec (lesson-2026-06-03-001).
- [x] **Task 7: budgets + full regression + integrity** (AC: 9, 11, 12)
  - [x] Bump `app-modules-bytes` (+ `i18n-harness-bytes` if present) with documented rationale if exceeded; `make test` + `make lint` + `make build` green; integrity-record class-A touches before state transition.

## Dev Notes

- **Surgical-changes-first (Karpathy #3):** The i18n harness already EXISTS (Story 3.3 `locale-loader.js`; `NS` map + `getStrings()` in `routing.js`; `main.js` uses `get()`). 7.1 is an EXTENSION + the language-switcher UI + the hardcoded-string sweep, NOT a rewrite. Do not invent a per-namespace-file loader — architecture D4 (lines 356, 495-500) deliberately chose single-eager-bundle because FR8 locks the locale mid-session, so late-binding namespaces buy nothing. The epic AC's "namespace files on demand" is reconciled to the existing top-level-namespace-keys-in-`strings.json` structure; flag this reconciliation for the Mode-2 auditor (it is a deliberate spec↔arch reconciliation, not scope drift).
- **Files to touch:** `src/assessment/i18n/locale-loader.js` (EXTEND), `src/assessment/main.js` (EXTEND — bootstrap locale resolution + `data-locale`), `src/assessment/routing.js` (EXTEND — `NS` map), `src/assessment/language-switcher.js` (NEW), `src/css/components/language-switcher.css` (NEW), `src/index.html` (EXTEND — switcher mount), `src/content/i18n/en/strings.json` (EXTEND), `src/content/i18n/{ru,pl}/strings.json` (NEW), `tools/lint-i18n-coverage.mjs` (NEW), `Makefile` (EXTEND), `.github/workflows/pr-checks.yml` (EXTEND — two new jobs), `budgets.json` (maybe bump), test files.
- **Read-before-touch (per checklist):** read `theme.js` (Story 6.4) for the radio-group + `localStorage`-discipline pattern to mirror; read `routing.js getStrings()` for how `NS` flows to components; read `chrome-header.css` for the placeholder slot 7.1 replaces.
- **FR8 boundary:** 7.1 ships only the in-session guard SEAM (`onBlockedAttempt` no-op default + `data-locale-switch-blocked` attribute). Full FR8 enforcement copy + the teachable-moment hint is Story 7.2 — do not duplicate it here.
- **Testing standards:** unit tests jsdom-stub pattern (`tests/unit/theme.test.mjs`); Playwright uses the existing `?test=1` fast-path test-hook to skip the 25-min item loop; every new Playwright spec needs its own explicit `pr-checks.yml` job (lesson-2026-06-03-001).

### Carry-forward lessons

- lesson-2026-06-03-001 (severity=high): pr-checks.yml wires Playwright specs per-spec (one job each), NOT via a greedy glob. Apply: add explicit `pr-checks.yml` jobs for `i18n-locale-switch.spec.mjs` AND `lint-i18n-coverage` — they are uncovered in CI until named.
- lesson-2026-06-03-002 (severity=high): before labeling a failing test pre-existing-on-main vs introduced-by-this-story, verify provenance with a baseline diff (`git stash` / `git diff main`). Apply: the hardcoded-string sweep (AC-5) will touch many components; if a component test goes red, baseline-diff before attributing.
- lesson-2026-05-20-010 (severity=medium): an AC that literally names an internal function may target the wrong surface; design-equivalent extensions are OK when observable behavior matches. Apply: the epic AC names "namespace files on demand" — the design-equivalent single-bundle-with-namespace-keys satisfies observable behavior (FR38 all-surfaces-translated); reconcile, don't reinvent.
- lesson-2026-05-20-011 (severity=medium): a story that ships an affordance for its own flow can self-exercise it. Apply: the language-switcher's persist-on-click is directly Playwright-exercisable — assert the reload + `data-locale` flip end-to-end.
- lesson-2026-05-20-012 (severity=low): lints/hooks must be fast + degrade gracefully. Apply: `lint-i18n-coverage.mjs` should be a fast single-pass grep+JSON-parse, exit-0-clean on an empty/missing bundle rather than throwing.

### Project Structure Notes

- Aligns with `src/assessment/` (surface-organized) + one-CSS-file-per-component conventions (architecture §1130, line 265). `language-switcher.{js,css}` slot into the existing pattern. No structural variance.
- Spec↔arch reconciliation (single-bundle vs namespace-files) documented above — the only intentional variance, justified by FR8 + arch D4.

### References

- [Source: epics.md#Story-7.1] — AC source.
- [Source: architecture.md#D4-i18n-loading-strategy (lines 356, 495-500)] — single-eager-bundle decision + `SUPPORTED` fallback (gap #2).
- [Source: architecture.md line 210] — `data-locale` BEM state-attribute convention.
- [Source: architecture.md line 836-838] — missing-key bare-literal pattern + `lint-i18n-coverage.mjs`.
- [Source: stories/6-4-...md AC-1, AC-3] — chrome-header placeholder slot + theme-toggle radio/`localStorage` pattern to mirror.
- [Source: src/assessment/routing.js] — `NS` map + `getStrings()`.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- i18n harness complete: locale-loader extended (SUPPORTED/normalizeLocale/resolveInitialLocale/t, storage-free), language-switcher EN/RU/PL keyboard-first w/ NFR9 persist + FR8 guard seam, RU/PL parity-aware placeholder bundles (in-progress, gated on 9c/9d), lint-i18n-coverage + CI jobs. app-modules-bytes 48128→55296 (anticipated). 992 tests green; make lint+build green. Playwright spec CI-deferred.

### File List

- src/assessment/i18n/locale-loader.js
- src/assessment/main.js
- src/assessment/routing.js
- src/assessment/language-switcher.js
- src/css/components/language-switcher.css
- src/index.html
- src/content/i18n/en/strings.json
- src/content/i18n/ru/strings.json
- src/content/i18n/pl/strings.json
- tools/lint-i18n-coverage.mjs
- tools/lint-no-localStorage-without-consent.mjs
- Makefile
- .github/workflows/pr-checks.yml
- budgets.json
- tests/unit/i18n-harness.test.mjs
- tests/unit/language-switcher.test.mjs
- tests/playwright/i18n-locale-switch.spec.mjs
- tests/scaffold/cognitive-load-budget.test.mjs

## Specialist Self-Review

## Specialist Self-Review — Story 7.1 (i18n harness + locale loading + language-switcher)

**Decisions made:**
- **Extended, did not rewrite, the Story 3.3 locale-loader** (Karpathy #3 + lesson-2026-05-20-010). Added `SUPPORTED`, `normalizeLocale`, `resolveInitialLocale`, `t` (alias of `get`) as pure functions; `load()` now normalizes its arg. The epic AC's "namespace files on demand" was reconciled to the existing single-bundle-with-namespace-keys structure — architecture D4 deliberately chose single-eager-bundle because FR8 locks locale mid-session (so late-binding buys nothing). Flagged as a deliberate spec↔arch reconciliation, not scope drift.
- **Kept locale-loader.js storage-free** (Story 3.3 frozen invariant AC-6.7). `resolveInitialLocale({stored, navigatorLang})` is pure; the `localStorage` READ lives in language-switcher.`readPersistedLocale()`, the WRITE in the switcher's change handler. main.js reads `navigator.language` (only `navigator.share` is forbidden there) and stays free of the storage token. This also drove a comment-wording fix (the literal tokens `localStorage`/`navigator.share` in comments tripped the frozen source-grep tests).
- **Budget bump 48128 → 55296** for `app-modules-bytes`, exactly as the budget's own rationale anticipated ("Epic-7 i18n weight raises this ceiling WITH justification, not pre-emptively"). Measured 54326 B + ~1.8% margin, keeping the tight per-story discipline. Required updating the frozen cross-cutting budget-pin test (tests/scaffold/cognitive-load-budget.test.mjs) — re-recorded `--as=engineer` per the bridge-7-8-5 precedent visible in the manifest.

**Alternatives considered:**
- A per-namespace-file loader (literal AC reading) — rejected per arch D4 + FR8 (no late-binding needed) and Karpathy simplicity.
- Trimming code to stay under 48128 instead of bumping — rejected: the budget rationale explicitly endorses the Epic-7 bump; artificially shrinking would fight the documented intent.
- Putting `resolveInitialLocale` in main.js reading localStorage directly — rejected: breaks main.test AC-2.4 (no-localStorage source invariant) and the 3.3 locale-loader storage-free invariant.

**Framework gotchas avoided:**
- Bare `checked` HTML attribute parses to empty string under the jsdom-stub; rendered `checked="checked"` so the frozen test's `=== "checked"` holds (and it is valid HTML).
- The language-switcher unit-test `document` stub initially lacked `createElement`/listeners (caught in the test-review pass, fixed before freeze) — would have forced an unnatural innerHTML-only impl.

**Areas of uncertainty:**
- **Playwright spec (tests/playwright/i18n-locale-switch.spec.mjs) was authored + frozen + CI-wired but NOT executed locally** (chromium download cost; repo convention excludes Playwright from `make test`; mirrors 6.4 AC-11's CI-plumbing deferral). The new `i18n-locale-switch` CI job + `make test-i18n-locale` target run it. Auditor may want to confirm the browser-level reload + `data-locale` flip in CI.
- The default in-session detector (`startedAt > 0 && responses.length < 16`) is a 7.1 seam; Story 7.2 owns the precise post-consent/pre-result FR8 boundary. The `16` mirrors the item count; not extracted to a constant here (7.2 will formalize).
- RU/PL bundles are parity-aware EN-placeholder scaffolds with `_meta.translationStatus: in-progress` + `sourceHashEN` — per the epic-7 dev-phase decision (infra-now; clinical-register content gated on Gates 9c/9d, whose ACs forbid AI translation). No human translation faked.

**Tested edge cases (frozen tests):**
- locale-loader: normalizeLocale primary-subtag + unsupported→en + junk input; resolveInitialLocale precedence (stored>nav>en); t/get agreement incl. bare-key literal; no-globals source invariant (tests/unit/i18n-harness.test.mjs).
- language-switcher: render with current checked + zero setItem on init; not-in-session click → one setItem + reload; in-session click → no write/no reload + data-locale-switch-blocked + onBlockedAttempt; default-guard no-false-block (tests/unit/language-switcher.test.mjs).
- Regression: all 992 node tests green; full `make lint` exit 0 (incl. new lint-i18n-coverage + localStorage-consent allowlist); `make build` byte-stable.

## Auditor Findings (round-1)

### [info] Playwright spec tests/playwright/i18n-locale-switch.spec.mjs was authored, frozen, and CI-wired (i18n-locale-switch job + make test-i18n-locale) but not executed locally (chromium download cost; repo convention excludes Playwright from make test — consistent with 6.4 AC-11). Browser-level reload + data-locale flip is unverified outside CI.

- **Category:** test-coverage
- **Suggested bridge:** `Confirm the i18n-locale-switch Playwright job passes on its first CI run (browser-level reload + data-locale attribute flip + persist).`
