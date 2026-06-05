---
id: 7-7-ru-pl-crisis-resource-lists-hreflang-declarations
title: "Story 7.7: RU + PL crisis-resource lists + hreflang declarations"
status: done
---

# Story 7.7: RU + PL crisis-resource lists + hreflang declarations

## Story

As a **bottom-decile Russian- or Polish-speaking test-taker following the spatially-privileged link from the tail-scene to a crisis-resource list**,
I want **the resources to be language-native (vetted by the per-language reviewer-of-record), shipped statically with no geolocation or third-party fetch, AND every methodology page to declare `hreflang` so search engines surface the right-language page**,
so that **FR20 (per-language crisis resources, no geolocation, no English-only fallback) holds for RU/PL — and FR31 (cross-language `hreflang` discoverability) enables organic Russian/Polish-Wikipedia citation paths**.

## Acceptance Criteria

> **Epic-7 dev-phase decision (infra-now, content-gated) + safety (user decision).** The curated, reviewer-of-record-vetted RU/PL crisis-resource CONTENT is gated on Gates 9c/9d (backlog). Fabricating specific hotline numbers for distressed users is a safety risk, and an EN-only fallback violates FR20. Per a user decision: ship **honest pending-placeholders** — `ru.json`/`pl.json` carry ≥3 schema-valid entries that do NOT invent specific national hotline numbers; instead they point to real internationally-recognized crisis-line directories (e.g. Find A Helpline, IASP crisis-centre directory) + an explicit "curated [language] list pending Gate-9c/9d reviewer-of-record vetting" entry, with a `_doc` marking the file pending. The per-locale loading + hreflang INFRASTRUCTURE is built fully now. The reviewer-of-record replaces the placeholders with the curated vetted list at gate close.

1. **AC-1 (RU + PL crisis-resources honest placeholders):** `src/content/crisis-resources/ru.json` and `pl.json` are committed, schema-valid against `crisis-resources.schema.json` (`locale` enum, `lastUpdated` date, ≥3 `resources` each with `name`/`description`/`url` (`https:`|`tel:`)/`lastVerified` date). Entries do NOT fabricate specific national hotline numbers; they reference real international crisis-line directories + an explicit pending-vetting entry. A `_doc` states the list is a pending placeholder awaiting the Gate-9c/9d reviewer-of-record. `lastVerified`/`lastUpdated` use real ISO dates (the directories referenced are real + verified at scaffold time). NOT a curated clinical sign-off.
2. **AC-2 (per-locale crisis loading, NO EN fallback — FR20):** crisis-resource loading is factored into a pure helper `src/assessment/crisis-resources-url.js` (`crisisResourcesUrl(locale)` → `/src/content/crisis-resources/${locale}.json`). `src/assessment/result.js` (bottom-decile path, currently hardcoded `fetch("/src/content/crisis-resources/en.json")`) fetches the ACTIVE locale's crisis file. Per FR20 there is **no English fallback** for RU/PL sessions — an RU/PL session loads its own (placeholder) list, never EN. (Placeholders exist for ru/pl, so the list is always present.)
3. **AC-3 (hreflang on every methodology page — FR31):** `tools/build-methodology.mjs` emits, in every rendered methodology page `<head>`, `<link rel="alternate" hreflang="en" href="...">`, `hreflang="ru"`, `hreflang="pl"` pointing to the equivalent page in each locale (same relative path, per the `canonicalUrlFor` versioned-permalink contract). The set is emitted for every page in every locale (uniform cross-locale linking).
4. **AC-4 (no geolocation / no third-party fetch):** the crisis lists are shipped statically; no IP geolocation, no runtime third-party fetch to populate them (the referenced directory URLs are links the user clicks, not fetched by the SPA). `lint-no-analytics-script` / `lint-csp-source` / `lint-no-external-font` stay green.
5. **AC-5 (tests + no regression):** Tests cover: ru.json/pl.json exist + schema-valid + `_doc` pending marker + no fabricated `tel:` national numbers (the placeholder entries use `https:` directory links + the pending entry); `crisisResourcesUrl(locale)` maps each locale to its own path; result.js fetches crisis THROUGH `crisisResourcesUrl` with NO en fallback for non-EN (assert the bottom-decile crisis fetch is locale-driven + that an RU/PL path is used, not a hardcoded en literal); build emits hreflang en/ru/pl on a sampled built page. `make test` green; `make lint` green (incl. lint-frontmatter crisis-schema validation); `make build` deterministic. If result.js grows past `app-modules-bytes`, bump with rationale + frozen pin.

## Tasks / Subtasks

- [x] **Task 1: RU + PL crisis-resources honest placeholders** (AC: 1, 4)
  - [x] ru.json/pl.json: ≥3 schema-valid entries (international directories + pending-vetting entry), `_doc` pending marker, no fabricated national hotline numbers.
- [x] **Task 2: per-locale crisis loading (no EN fallback)** (AC: 2)
  - [x] `crisis-resources-url.js` helper; result.js bottom-decile fetch via `crisisResourcesUrl(locale)`, no en fallback for non-EN.
- [x] **Task 3: hreflang emission in build** (AC: 3)
  - [x] build-methodology emits `<link rel="alternate" hreflang="{en,ru,pl}">` per page from the per-locale `canonicalUrlFor`.
- [x] **Task 4: tests** (AC: 5)
  - [x] crisis schema + pending marker + no-fake-tel; crisisResourcesUrl mapping; result.js locale crisis fetch (no en fallback); build hreflang on a sampled page.
- [x] **Task 5: regression gate** (AC: 5)
  - [x] `make test`/`make lint`/`make build` green; budget bump + pin if needed.

## Dev Notes

- **Schema (`src/content/crisis-resources/crisis-resources.schema.json`):** requires `locale` (enum en/ru/pl), `lastUpdated` (YYYY-MM-DD), `resources` (minItems 3; each `name`/`description`/`url` matching `^(https?:|tel:)`/`lastVerified` YYYY-MM-DD). `lint-frontmatter.mjs` validates EVERY crisis JSON present (Story 6.5 AC-8), so ru/pl MUST be schema-valid.
- **Honest placeholder content (safety):** do NOT invent specific RU/PL national hotline numbers (`tel:` entries) — a wrong number is catastrophic for a distressed user. Use real international directories (Find A Helpline `https://findahelpline.com/`, IASP crisis-centre directory) the user can navigate to their country/language, plus an explicit "curated [Russian/Polish] list pending Gate-9c/9d reviewer-of-record vetting" entry. `_doc` documents the pending state. Reviewer-of-record replaces with the curated vetted list at gate close.
- **FR20 no-EN-fallback:** result.js bottom-decile currently does `fetch("/src/content/crisis-resources/en.json")` (line ~159). Change to `fetch(crisisResourcesUrl(state.getState().locale || "en"))` — an RU/PL session loads ru/pl, EN loads en, never cross-loading EN for non-EN. (Mirror the 7.6 tailScenesUrl helper pattern for testability.)
- **hreflang (FR31):** in `renderPage`'s `<head>`, after the existing `<meta>`/`<link>` block, emit for `L in ["en","ru","pl"]` a `<link rel="alternate" hreflang="${L}" href="${canonicalUrlFor-for-L}">`. Compute the locale-independent dir path once (relative to the current page's locale root) and build `/methodology/${corpusVersion}/${L}/${dirPath}/` per locale (do NOT call canonicalUrlFor with a mismatched srcPath/lang — derive dirPath directly).
- **No new methodology snapshots needed?** hreflang changes the built `<head>` of EVERY methodology page → the committed `tests/snapshots/methodology/**` will drift. Run `make snapshot-update` and commit ALL regenerated snapshots (105 pages) — verify the only diff is the added hreflang links. (Same snapshot-discipline as 7.3/7.4.)
- **Files:** `src/content/crisis-resources/ru.json` + `pl.json` (NEW), `src/assessment/crisis-resources-url.js` (NEW), `src/assessment/result.js` (locale crisis fetch), `tools/build-methodology.mjs` (hreflang), `tests/snapshots/methodology/**` (regenerated), tests, possibly BUDGETS.json + pin. Do NOT touch en crisis, CODEOWNERS, tail-scenes.

### Carry-forward lessons

- lesson-2026-06-03-001 (high): pr-checks wires jobs explicitly; prefer unit/contract tests; wire any new Playwright spec.
- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: hreflang changes ALL snapshots — confirm via `git diff` the only snapshot change is the hreflang links before committing.
- lesson (7.3/7.4): landing snapshot-affecting changes requires `make snapshot-update` + committing the regenerated snapshots, else the design-system AC-6 idempotency check dirties the tree. (AC-6 now writes to a tmpdir per 7.5b, but the committed snapshots must still match a fresh build.)
- lesson-2026-05-20-010 (medium): match observable AC intent. Apply: honest placeholders + infra satisfy the AC's intent; the curated vetted list is the Gate-9c/9d deliverable.

### Project Structure Notes

- Crisis JSON under `src/content/crisis-resources/<locale>.json`; pure URL helper under `src/assessment/`. hreflang in the corpus build. No variance.

### References

- [Source: epics.md#Story-7.7] — AC source (per-language crisis resources, no geolocation, hreflang FR31).
- [Source: src/content/crisis-resources/crisis-resources.schema.json] — schema contract (≥3 entries).
- [Source: src/content/crisis-resources/en.json] — EN list structure (Story 6.5).
- [Source: src/assessment/result.js#159] — hardcoded EN crisis fetch → active-locale.
- [Source: tools/build-methodology.mjs#194-201] — canonicalUrlFor versioned-permalink contract for hreflang.
- [Source: project memory project_iqme_epic7_infra_now_decision] — infra-now; crisis content reviewer-vetted-gated.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- RU/PL crisis honest placeholders (real intl directories + pending-vetting entry, NO fabricated tel numbers, _doc pending); per-locale crisis loading via crisisResourcesUrl helper, FR20 no-EN-fallback; hreflang en/ru/pl on every methodology page (FR31). Snapshots regenerated (105 pages, hreflang-only diff verified). 1197 pass, lint+build exit 0.

### File List

- src/assessment/crisis-resources-url.js
- src/content/crisis-resources/ru.json
- src/content/crisis-resources/pl.json
- src/assessment/result.js
- tools/build-methodology.mjs
- tests/snapshots/methodology/**/*.html (105 pages, hreflang)
- tests/unit/crisis-resources-hreflang.test.mjs

## Specialist Self-Review

## Specialist Self-Review — Story 7-7 (RU/PL crisis-resources + hreflang, infra-now)

**Decisions made:**
- **Crisis content (safety, user decision):** RU/PL crisis lists ship as honest pending-placeholders — `ru.json`/`pl.json` carry 3 schema-valid entries that do NOT fabricate specific national hotline numbers (a wrong number is catastrophic for a distressed user). They reference real internationally-recognized directories (Find A Helpline `findahelpline.com`, IASP crisis-centre directory) + an explicit "curated list pending Gate-9c/9d reviewer-of-record vetting" entry linking to the launch-readiness sign-off doc. `_doc` marks the file pending. `lastVerified`/`lastUpdated` = 2026-06-04 (the referenced directories are real + verified at scaffold time). The reviewer-of-record replaces these with the curated vetted list at gate close.
- **FR20 no-EN-fallback:** factored crisis URL into a pure helper `src/assessment/crisis-resources-url.js` (`crisisResourcesUrl(locale)`); result.js bottom-decile path fetches `crisisResourcesUrl(locale)` (the `locale` const already declared for 7.6's tailScenesUrl) — an RU/PL session loads its own list, never EN. No cross-locale EN fallback.
- **hreflang (FR31):** `build-methodology.mjs renderPage` emits `<link rel="alternate" hreflang="{en,ru,pl}">` per page, derived from a locale-independent dir path + the `canonicalUrlFor` versioned-permalink format (`/methodology/<version>/<L>/<dir>/`). Uniform across all locales.

**Cross-story / snapshot impact:** hreflang changes every methodology page `<head>` → all 105 committed snapshots drift. Ran `make snapshot-update` and committed the regenerated snapshots; verified via `git diff` the ONLY change is the 3 hreflang links per page (105 files, 315 insertions, zero other lines) — provenance confirmed hreflang-only (lesson-2026-06-03-002). No budget bump needed (lint green; the small helper + import stayed under app-modules-bytes 59392, which 7.6 had already raised).

**Test-review:** approved (cycle 0). The independent reviewer confirmed the helper-coupling rigor (dead-string attack closed, per the 7.6 lesson) and that the FR20 assertion does not false-reject the `|| "en"` locale-default idiom. Noted a minor brittleness (the test wants the bare `crisisResourcesUrl(locale)` token) — naturally satisfied because result.js already declares `const locale = state.getState().locale || "en"` (added in 7.6) and uses the same form for tailScenesUrl.

**Framework gotchas avoided:**
- Did NOT fabricate `tel:` hotline numbers (the test's safety assertion forbids `tel:` in RU/PL placeholders + requires ≥1 https directory) — the right call for a distressed-user surface.
- hreflang URL built by deriving the dir path directly (NOT by calling `canonicalUrlFor` with a mismatched srcPath/lang, which would produce `../en/...` garbage).

**Areas of uncertainty:**
- The interim directories (Find A Helpline, IASP) are real and reputable but the reviewer-of-record should confirm they're the best interim pointer for RU vs PL audiences specifically; flagged in the sign-off docs as part of deliverable #6.
- Whether the GitHub-blob link in the pending entry is the ideal "pending" target vs an on-site page — chose the launch-readiness sign-off doc as the honest source of truth for the pending state. Auditor may weigh in.

**Tested edge cases:** `tests/unit/crisis-resources-hreflang.test.mjs` (frozen) — ru/pl schema-valid + _doc pending + no-fabricated-tel; `crisisResourcesUrl` behavioral mapping; result.js fetches crisis THROUGH the helper with no EN fallback (FR20); build emits hreflang en/ru/pl on a sampled built page (tmpdir build). Full suite 1197 pass / 0 fail / 1 skip; make lint + build exit 0.

## Auditor Findings (round-1)

### [info] Interim RU/PL crisis directories (Find A Helpline, IASP) and the pending- entry GitHub-blob link are reputable but should be confirmed by the reviewer-of-record as the best interim pointers for RU vs PL audiences specifically. Tracked in the launch-readiness sign-off docs (Gate 9c/9d).

- **Category:** content-vetting
- **Suggested bridge:** `Gate-9c/9d reviewer-of-record validates the interim crisis directories per locale and replaces them with the curated, vetted RU/PL lists.`
