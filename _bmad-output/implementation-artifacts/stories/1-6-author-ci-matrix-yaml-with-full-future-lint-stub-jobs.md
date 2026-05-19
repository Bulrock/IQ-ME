---
id: 1-6-author-ci-matrix-yaml-with-full-future-lint-stub-jobs
title: "Story 1.6: Author CI matrix YAML with full future-lint stub jobs"
status: review
---

# Story 1.6: Author CI matrix YAML with full future-lint stub jobs

## Story

As a **solo-dev maintainer (CEP) avoiding per-epic CI-config drift**,
I want **the full `.github/workflows/pr-checks.yml` job matrix to exist at end-of-Epic-1 with every future lint as a stub job (initially `if: false` or `continue-on-error: true`)**,
so that **subsequent epics flip a stub job from inactive to active by editing one line, never by adding a new job (per Murat's fixture-architecture-first applied to CI)**.

## Acceptance Criteria

1. **AC-1 (`.github/workflows/pr-checks.yml` exists with all 28 jobs):** every job in the `jobs:` map below MUST be present by job-id (28 total): `lint-claims-manifest`, `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent`, `lint-cognitive-load-budget`, `lint-frontmatter`, `lint-glossary`, `lint-reading-level`, `lint-translation-parity`, `lint-license-provenance`, `lint-css-link-order`, `lint-fr36-protection`, `golden-vector-parity`, `byte-stable-build`, `network-trace`, `viewport-overflow`, `co-equal-triplet-computed-style`, `co-equal-triplet-css-source`, `cropping-fuzzer`, `lighthouse`, `axe-core-pa11y`, `reveal-stage-event-ordering`, `csp-violation-count`, `state-shape-contract`.

2. **AC-2 (Epic-1-active jobs run unconditionally):** these jobs DO NOT have `if: false` and run on every PR (they're real lints landed in Epic 1): `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent`, `lint-cognitive-load-budget`. Note: per the AC text "lints implemented in Epic 1 (claims-manifest, trust-artifacts, no-role-alert, no-share, cognitive-load-budget, network-trace)" — but Story 1.7 lands `network-trace`; Story 1.6 itself lands the six negative-assertion lints + `lint-trust-artifacts` is from Story 1.2/1.3 wiring + `lint-claims-manifest` lands in Story 2.7. **For this story, the Epic-1-active list is precisely:** `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent`, `lint-cognitive-load-budget`.

3. **AC-3 (deferred jobs gated by `if: false`):** every other job (20 total) carries `if: false` and a one-line comment in the form `# Activates in Epic <N>` directly above (or next to) the `if:` line, where `<N>` is the responsible epic per the epics map below (see Dev Notes).

4. **AC-4 (six negative-assertion lints exist and pass empty-tree):** `tools/lint-no-role-alert.mjs`, `tools/lint-no-share.mjs`, `tools/lint-no-cookie-banner.mjs`, `tools/lint-no-analytics-script.mjs`, `tools/lint-no-external-font.mjs`, `tools/lint-no-localStorage-without-consent.mjs` each exist, each is ≤ 50 LOC of Node-stdlib script, each grep/scans `src/` (plus `vendor/` where relevant — see Dev Notes), each exits 0 on the empty `src/` tree, each exits 1 (with a clear `BREACH:` line + offending path on stderr) when a fixture file under `tests/fixtures/lint-negative-assertions/<lint-name>/violation.html` (or equivalent) triggers it.

5. **AC-5 (Makefile `lint` chain extended):** `make lint` now invokes ALL active lints (`lint-cognitive-load-budget` from Story 1.5 + the six new negative-assertion lints), in any order, exits 0 on the empty tree, and surfaces each lint's success line (e.g. `OK <id>: …` or `lint-no-share: ok`).

6. **AC-6 (`release.yml` + `scheduled.yml` stubs):** `.github/workflows/release.yml` exists with a single `echo "Activates in Epic 8"` step AND inline YAML comments describing the orchestration plan: decoupled `app-v*` + `corpus-v*` tag namespaces. `.github/workflows/scheduled.yml` exists with the same one-line echo AND inline comments describing the mirror-parity + scheduled-check-failure → labeled GitHub Issue routing.

7. **AC-7 (`pr-checks.yml` triggers on PRs):** `pr-checks.yml` carries `on: pull_request:` (with `branches: [main]` filter acceptable) so the file is wired up — even though we cannot run it locally, the file must be syntactically valid GitHub Actions workflow YAML (no `make lint` step is required to validate this — see Dev Notes for the `js-yaml`-free YAML check).

## Tasks / Subtasks

- [x] **Task 1: Author `.github/workflows/pr-checks.yml`** (AC: 1, 2, 3, 7)
  - [x] All 28 jobs present with correct IDs
  - [x] 8 Epic-1-active jobs run unconditionally
  - [x] 20 deferred jobs have `if: false` + `# Activates in Epic <N>` comment
  - [x] Top-level `on: pull_request:`
- [x] **Task 2: Author the six negative-assertion lint scripts** (AC: 4)
  - [x] `tools/lint-no-role-alert.mjs` — rejects `role="alert"` on non-temporary elements (heuristic: `role="alert"` outside a `<div data-toast>` / `<output>` ancestor — for now, any occurrence in `src/`, since no toasts exist yet)
  - [x] `tools/lint-no-share.mjs` — rejects `navigator.share(` calls
  - [x] `tools/lint-no-cookie-banner.mjs` — rejects DOM patterns like `cookie-banner`, `cookie-consent`, `cookieBanner`, `cookieConsent` (id/class/var names)
  - [x] `tools/lint-no-analytics-script.mjs` — rejects script srcs / imports from known analytics hosts (`googletagmanager.com`, `google-analytics.com`, `plausible.io`, `mixpanel.com`, `segment.com`, `mixpanel`, `posthog`, `analytics`, `gtag`)
  - [x] `tools/lint-no-external-font.mjs` — rejects `<link rel="stylesheet" href="https://fonts.googleapis.com…">`, `@import url("https://fonts.…")`, and any `fonts.gstatic.com` reference
  - [x] `tools/lint-no-localStorage-without-consent.mjs` — rejects `localStorage.setItem(` calls that aren't in an `if (consent...)` block (heuristic: any unguarded `localStorage.setItem(` is a violation; future PR may refine)
  - [x] Each is stdlib-only (NFR33) and ≤ 50 LOC
  - [x] Each exits 0 on current `src/` tree
- [x] **Task 3: Author fixture files demonstrating each violation** (AC: 4)
  - [x] `tests/fixtures/lint-negative-assertions/no-role-alert/violation.html`
  - [x] `tests/fixtures/lint-negative-assertions/no-share/violation.js`
  - [x] `tests/fixtures/lint-negative-assertions/no-cookie-banner/violation.html`
  - [x] `tests/fixtures/lint-negative-assertions/no-analytics-script/violation.html`
  - [x] `tests/fixtures/lint-negative-assertions/no-external-font/violation.css`
  - [x] `tests/fixtures/lint-negative-assertions/no-localStorage-without-consent/violation.js`
- [x] **Task 4: Extend Makefile `lint` to chain all active lints** (AC: 5)
- [x] **Task 5: Author `.github/workflows/release.yml` and `scheduled.yml` stubs** (AC: 6)
- [x] **Task 6: Author and pass acceptance tests** verifying AC 1-7
  - [x] `tests/scaffold/ci-matrix.test.mjs` — workflow YAML structure + job list + per-job `if:` correctness
  - [x] `tests/scaffold/negative-assertion-lints.test.mjs` — each lint exits 0 on `src/`, exits non-zero when run against its fixture

## Dev Notes

### Epic → job mapping (for `# Activates in Epic <N>` comments)

| Job ID | Epic |
|---|---|
| lint-trust-artifacts | Epic 1 (active) |
| lint-no-role-alert | Epic 1 (active) |
| lint-no-share | Epic 1 (active) |
| lint-no-cookie-banner | Epic 1 (active) |
| lint-no-analytics-script | Epic 1 (active) |
| lint-no-external-font | Epic 1 (active) |
| lint-no-localStorage-without-consent | Epic 1 (active) |
| lint-cognitive-load-budget | Epic 1 (active, lands in Story 1.5) |
| lint-claims-manifest | Epic 2 |
| golden-vector-parity | Epic 2 |
| lint-frontmatter | Epic 4 |
| lint-glossary | Epic 4 |
| lint-reading-level | Epic 4 (EN); Epic 7 (RU, PL) |
| lint-translation-parity | Epic 7 |
| lint-license-provenance | Epic 4 |
| lint-css-link-order | Epic 3 |
| lint-fr36-protection | Epic 5 |
| byte-stable-build | Epic 4 |
| network-trace | Epic 1 (lands in Story 1.7 — for THIS story 1.6, keep `if: false # Activates in Story 1.7`) |
| viewport-overflow | Epic 6 |
| co-equal-triplet-computed-style | Epic 3 |
| co-equal-triplet-css-source | Epic 3 |
| cropping-fuzzer | Epic 6 |
| lighthouse | Epic 6 |
| axe-core-pa11y | Epic 6 |
| reveal-stage-event-ordering | Epic 3 |
| csp-violation-count | Epic 3 |
| state-shape-contract | Epic 3 |

**Special case — `network-trace`:** belongs to Epic 1 but lands in Story 1.7 (next story). At end-of-Story-1.6 it's still stubbed with `# Activates in Story 1.7`. Story 1.7 will flip the line.

**Special case — `lint-trust-artifacts` and `lint-cognitive-load-budget`:** these are Epic-1-active. They need a `run:` step that actually invokes the lint. For `lint-cognitive-load-budget` use `make lint` (it chains the budget lint) or `node tools/lint-cognitive-load-budget.mjs` directly.

**Special case — `lint-trust-artifacts`:** Stories 1.2/1.3 did NOT land an explicit `lint-trust-artifacts.mjs` script (the `tools/` dir only has `generate-icar-stub-pdf.mjs` so far). For this story, either: (a) add the lint script as a small grep that asserts `ICAR-CONFIRMATION.pdf` exists + `LICENSES.md` references it — preferred, ≤ 30 LOC; or (b) keep the job stubbed with `if: false # Activates in Story 1.2-followup` if scope-creep is a concern. **Prefer (a)** — keeping it stubbed contradicts AC-2 which says it's Epic-1-active. ~20 LOC of stdlib script.

### `if: false` placement in GitHub Actions YAML

In GitHub Actions, the conditional gate is `if: ${{ false }}` or just `if: false` at the **job** level (under each entry in `jobs:`). The comment goes above the `if:` line, e.g.:

```yaml
jobs:
  lint-frontmatter:
    name: lint-frontmatter
    runs-on: ubuntu-latest
    # Activates in Epic 4
    if: false
    steps:
      - run: echo "stub — Activates in Epic 4"
```

### `pr-checks.yml` top-level shape

```yaml
name: PR Checks
on:
  pull_request:
    branches: [main]
jobs:
  # … 28 jobs
```

### YAML structural test without a YAML parser dep

The acceptance test for `pr-checks.yml` must validate structure without bringing in `js-yaml` (NFR33). Strategy:
- read the file as text, split on `\n`, count occurrences of `^  <job-id>:$` (top-level inside `jobs:`)
- assert every required job-id appears exactly once
- for deferred jobs, assert `# Activates in Epic` (case-insensitive) comment + `if: false` line appears within ~10 lines of the job-id declaration

This is a coarse structural check, sufficient for the AC. CI itself validates the YAML syntactically (GitHub will reject malformed workflow files); we don't need to re-implement that.

### Heuristics for the six negative-assertion lints

Per AC-4, these are simple grep/scan tools. Make them **deliberately strict** at v1 (favor false-positives over false-negatives — the lint exists to PREVENT regressions, not to be friendly):

- **`lint-no-role-alert`:** scan `src/**/*.{html,js,mjs,ts}` for the literal substring `role="alert"`. Future false-positives (legit toast) get an inline `// IQME-LINT-OK: role="alert" — temporary toast (FR12)` allow-comment that the lint can skip. **For v1**, no allow-comment system — pure grep. Document in script header.
- **`lint-no-share`:** scan `src/**/*.{js,mjs,ts}` for `navigator.share(` (literal). Catches `navigator.share()` and `navigator.share({…})`.
- **`lint-no-cookie-banner`:** scan `src/**/*.{html,js,mjs,ts,css}` for `cookie-banner|cookieBanner|cookie-consent|cookieConsent|cookie_banner|cookie_consent` (case-insensitive).
- **`lint-no-analytics-script`:** scan `src/**/*.{html,js,mjs,ts}` for any of: `googletagmanager.com|google-analytics.com|plausible.io|mixpanel|segment.com|posthog|gtag\(`. Case-insensitive.
- **`lint-no-external-font`:** scan `src/**/*.{html,css,js,mjs}` for `fonts.googleapis.com|fonts.gstatic.com|fonts.bunny.net|use.typekit.net|cdn.jsdelivr.net/.*font` (case-insensitive).
- **`lint-no-localStorage-without-consent`:** scan `src/**/*.{js,mjs,ts}` for `localStorage.setItem(`. **v1 heuristic:** any occurrence is a violation. A future PR (likely Story 6.7) will refine to "any `setItem` NOT inside `if (consent)` block".

### Common lint helper

DO NOT factor a shared "lint-base.mjs" helper at v1. Each script is ≤ 30-50 LOC; abstraction adds complexity without payoff (NFR32). Each script has the same boilerplate: `globSync` → `for (file) { if (regex.test(content)) violations.push(...) }` → exit 0 or 1. Six tiny near-duplicates beats a premature DRY abstraction.

### Fixture file convention

Each fixture under `tests/fixtures/lint-negative-assertions/<lint-name>/` contains the **minimum** code that should trigger that specific lint. The lint test runs the lint against this fixture path (passed via env var `IQME_LINT_TARGET=<path>` so the lint accepts an alternate scan root) and asserts exit 1.

**Important:** each lint script accepts an optional env var `IQME_LINT_TARGET=<path>` that, if set, replaces the `src/` scan root. This is the test injection point. Document in each script's header comment.

### Project Structure Notes

- New files:
  - `.github/workflows/pr-checks.yml`
  - `.github/workflows/release.yml`
  - `.github/workflows/scheduled.yml`
  - `tools/lint-no-role-alert.mjs`
  - `tools/lint-no-share.mjs`
  - `tools/lint-no-cookie-banner.mjs`
  - `tools/lint-no-analytics-script.mjs`
  - `tools/lint-no-external-font.mjs`
  - `tools/lint-no-localStorage-without-consent.mjs`
  - `tools/lint-trust-artifacts.mjs` (optional — see "Special case" note above)
  - `tests/fixtures/lint-negative-assertions/<six-dirs>/violation.{html,js,css}`
  - `tests/scaffold/ci-matrix.test.mjs`
  - `tests/scaffold/negative-assertion-lints.test.mjs`
- Modified files:
  - `Makefile` — extend `lint` recipe to chain new lints

### References

- Story spec — [epics.md#L610-L635](_bmad-output/planning-artifacts/epics.md#L610-L635)
- NFR32-33 — [epics.md#L165-L166](_bmad-output/planning-artifacts/epics.md#L165-L166)
- Architecture — tools/ directory tree — [architecture.md#L1190-L1213](_bmad-output/planning-artifacts/architecture.md#L1190-L1213)
- Prior story 1.5 — established lint script + Makefile pattern.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- 37 frozen tests pass; full suite 85/85. CI matrix with 28 jobs (8 Epic-1-active, 20 stubbed with Activates-in comments). 6 negative-assertion lints + lint-trust-artifacts implemented, all stdlib-only (NFR33). release.yml + scheduled.yml stubs include inline-comment orchestration plans.

### File List

- .github/workflows/pr-checks.yml
- .github/workflows/release.yml
- .github/workflows/scheduled.yml
- Makefile
- tools/lint-trust-artifacts.mjs
- tools/lint-no-role-alert.mjs
- tools/lint-no-share.mjs
- tools/lint-no-cookie-banner.mjs
- tools/lint-no-analytics-script.mjs
- tools/lint-no-external-font.mjs
- tools/lint-no-localStorage-without-consent.mjs
- tests/scaffold/ci-matrix.test.mjs
- tests/scaffold/negative-assertion-lints.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **Six near-duplicate lint scripts instead of a shared `lint-base.mjs` helper.** Each script is 25-35 LOC of grep-style boilerplate. A shared helper would save ~50 lines net but adds an indirection layer to every lint — when one of these inevitably evolves (e.g. `lint-no-localStorage-without-consent` v2 with consent-block detection), the helper boundary would either become a bloated god-module or fork anyway. Six small files are easier to mind end-to-end (NFR32) and easier to special-case per-lint than a shared abstraction. Documented under "Common lint helper" in Dev Notes ahead of time.

2. **`lint-trust-artifacts` materialized as a real script in this story** (not stubbed). The story spec's AC-2 named it Epic-1-active; either it had to be real OR we'd violate the AC. Wrote a ~50-LOC script that asserts: ICAR-CONFIRMATION.pdf + LICENSES.md + CITATION.cff + README.md exist with non-trivial sizes, and LICENSES.md cross-references ICAR-CONFIRMATION.pdf.

3. **`IQME_LINT_TARGET` env var as the test-injection point.** Same pattern as Story 1.5's `IQME_BUDGET_OVERRIDE_*` — env-driven, no CLI-arg parsing needed (stays tiny). Each lint defaults its scan root to `src/` and replaces it with `IQME_LINT_TARGET` when set. Fixture tests use `IQME_LINT_TARGET=tests/fixtures/lint-negative-assertions/<lint-name>` to point the lint at a violating file.

4. **`network-trace` job stubbed with `# Activates in Story 1.7` rather than `Epic 1`.** Test regex accepts both forms (`# Activates in (Epic|Story) <N>`); chose `Story 1.7` for precision since `network-trace` literally lands next story.

**Alternatives considered:**

- *YAML parser dep (`js-yaml`) for structural test* — would land a runtime dep, violating NFR33. Text-based grep regex sufficient for AC checks; GitHub Actions itself validates the YAML syntax at PR time. AC-1 only needs to assert "every job-id appears at proper indent" — regex `/^  <job-id>:$/m` does this cleanly.
- *Single mega-lint scanning all six patterns* — would be slightly faster (one filesystem pass), but coupling all six rules into one script makes the failure-mode diagnostic worse (the breach message can't say "which check fired" without per-rule plumbing). Six small scripts keep each violation's error message native.
- *Activate `lint-trust-artifacts` only after writing tests for it* — would require shifting scope into Story 1.2/1.3 retro. Cleaner to land it here as part of Epic-1-active wiring; the existing trust artifacts (ICAR pdf, LICENSES.md, CITATION.cff, README.md) already satisfy the script's assertions, so no test failures.

**Framework gotchas avoided:**

- `node:fs.globSync` with brace-expansion like `**/*.{html,js,mjs}` works in Node 22, but only if the brace literal is in the pattern. Tested locally; confirmed working.
- AC-3 regex test accepted either `Epic <N>` or `Story <N>` after the `Activates in` prefix — needed because `network-trace` legitimately routes to a story, not an epic.
- The `lint-no-cookie-banner` regex uses `[-_]?` to match `cookie-banner`, `cookie_banner`, `cookieBanner`, and `cookieconsent` simultaneously (case-insensitive).
- `make lint` runs each lint sequentially with one `node` call per recipe line — the Makefile recipe-allowlist test from Story 1.1 only requires `node` (allowed) as the first token, no chain limit.
- `localStorage` regex needs `\b` boundary so it doesn't catch the literal string `"localStorage"` inside doc-strings. Used `\blocalStorage\.setItem\s*\(`.

**Areas of uncertainty:**

- The `lint-no-role-alert` v1 is deliberately too-strict (any `role="alert"` is a violation, regardless of context). FR12 mentions "polite localized fallback" which may legitimately use `role="alert"` for a transient error toast. When that lands (likely Epic 6), the lint will need an allow-comment system (`// IQME-LINT-OK: role="alert" — transient toast`). Documented in Dev Notes ahead of time.
- The `lint-no-analytics-script` regex catches the SDK names + hosts I could remember; this is **not** exhaustive. A future PR may want to add a "host allowlist" model instead — but that's a v2 problem when we have actual content to scan.
- `js-yaml` was rejected for the structural test, but if a future PR wants to parse and assert deeper structure (e.g. "every active job has actions/setup-node@v4"), the temptation will resurface. The right move at that point is a small vendor/SHASUMS-pinned YAML mini-parser — not a runtime dep.

**Tested edge cases:**

- All 37 frozen tests pass; full suite 85/85 — no regression.
- Each lint exits 0 on the current `src/` tree (which has 1 file: `src/content/methodology/en/provenance/icar-license.md` from Story 1.3, plus the .gitkeep'd domain dirs).
- Each lint exits 1 with `BREACH …` on stderr when targeted at its fixture (via `IQME_LINT_TARGET`).
- `make lint` chains all 8 active lints + exits 0, surfaces the budget-lint OK lines.
- All 28 jobs present in `pr-checks.yml` (regex-asserted); 8 Epic-1-active have no `if: false`; 20 deferred have `if: false` + Activates-in comment.
- `release.yml` + `scheduled.yml` contain "Activates in Epic 8" + the documented inline-comment orchestration plans (app-v*/corpus-v* namespaces + labeled-Issue routing).
