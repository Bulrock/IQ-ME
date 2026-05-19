---
id: 1-7-implement-playwright-network-trace-infrastructure-with-strict-zero-third-party-assertion-from-day-1
title: "Story 1.7: Implement Playwright network-trace infrastructure with STRICT zero-third-party assertion from day 1"
status: ready-for-dev
---

# Story 1.7: Playwright network-trace infrastructure

## Story

As a **skeptic (Tomáš journey) verifying the zero-telemetry claim**,
I want **the Playwright network-trace infrastructure to ship at full strictness from day 1 — not "initial then tighten" (per Murat)**,
so that **no third-party-leak regression can sneak in during Epics 2-7 only to be discovered painfully in Epic 8 (40-55% probability over 6 months per Murat's risk calculation)**.

## Acceptance Criteria

1. **AC-1 (`tests/playwright/network-trace.spec.mjs` exists):** Playwright spec at this path that loads `tests/fixtures/network-trace-baseline.html` (or, if `IQME_NETWORK_TRACE_TARGET` env var is set, the URL/path it specifies), captures every outgoing request via Playwright's `page.on("request", …)` listener, and asserts the strict zero-third-party invariant.

2. **AC-2 (zero non-same-origin requests):** the test fails if any request URL's host is not equal to the loaded page's host (i.e. non-same-origin). For `file://` baseline the rule is "no `http(s)://` requests at all".

3. **AC-3 (forbidden-domain set):** even when scoping to same-origin only, the spec maintains a `FORBIDDEN_DOMAINS` array (Google Fonts, jsDelivr, unpkg, Plausible, GoatCounter, Sentry, Mixpanel, Posthog, etc.) and fails if any request URL's host matches. Redundant with AC-2 for the baseline but defends against future PRs that legitimately route to non-same-origin but should still reject known telemetry hosts. The array MUST contain at least: `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`, `unpkg.com`, `plausible.io`, `goatcounter.com`, `sentry.io`, `mixpanel.com`, `posthog.com`, `googletagmanager.com`, `google-analytics.com`.

4. **AC-4 (baseline fixture exists):** `tests/fixtures/network-trace-baseline.html` exists as a minimal HTML page (`<!doctype html><meta charset=utf-8><title>baseline</title>`) that imports nothing — no external CSS, no external JS, no external fonts, no images. Loading this page in a browser should generate exactly one network request (the page itself); zero requests if loaded via `file://`.

5. **AC-5 (CI integration — `network-trace` job activated):** `.github/workflows/pr-checks.yml` `network-trace` job is no longer stubbed with `if: false`. The job sets up Node 22 + installs Playwright + browser binaries via `npx playwright install --with-deps chromium`, then runs `npx playwright test tests/playwright/network-trace.spec.mjs`. The `# Activates in Story 1.7` comment is removed.

6. **AC-6 (zero runtime deps; Playwright is dev-only):** Playwright is invoked via `npx --yes playwright` (per NFR33). No `package.json` `dependencies` entry. If `package.json` does not exist, it's still acceptable to add a minimal `{"type": "module", "private": true, "devDependencies": {"@playwright/test": "^1.49.0"}}` — devDependencies are explicitly permitted by NFR33 dev-tool note. Playwright version pinned via caret-range or exact, not `latest`. **Implementer's choice — but recommend exact pin** for reproducibility.

7. **AC-7 (local-runnable smoke):** an acceptance test in `tests/scaffold/playwright-network-trace.test.mjs` asserts the spec file exists + parses + declares at minimum one `test(...)` call + references `FORBIDDEN_DOMAINS`. It does **NOT** actually run Playwright (which requires browser binary download — too heavy for `node --test`). CI runs the real Playwright; local tests assert structural correctness.

8. **AC-8 (Makefile target for the trace, opt-in):** `make test-network-trace` runs the Playwright spec (`npx --yes playwright test tests/playwright/network-trace.spec.mjs`). This is NOT chained into `make test` (which is `node --test`-based and runs on every dev iteration); browser binaries are too heavy to require for every test run. CI runs it via the dedicated `network-trace` workflow job per AC-5.

## Tasks / Subtasks

- [ ] **Task 1: Author `tests/fixtures/network-trace-baseline.html`** (AC: 4)
  - [ ] Minimal HTML with no external dependencies
- [ ] **Task 2: Author `tests/playwright/network-trace.spec.mjs`** (AC: 1, 2, 3)
  - [ ] Import `@playwright/test`
  - [ ] Resolve target URL/path from `IQME_NETWORK_TRACE_TARGET` env or baseline fixture
  - [ ] Listen on `page.on("request", …)` and accumulate every request URL
  - [ ] `FORBIDDEN_DOMAINS` array containing all listed hosts
  - [ ] Assertion: every captured URL is either same-origin (host matches page host) or for `file://` baseline, every captured URL must NOT start with `http`
  - [ ] Assertion: no captured URL's host appears in `FORBIDDEN_DOMAINS`
- [ ] **Task 3: Author `tests/scaffold/playwright-network-trace.test.mjs`** (AC: 7)
  - [ ] Asserts spec file exists
  - [ ] Asserts spec contains at least one `test(` call
  - [ ] Asserts spec references `FORBIDDEN_DOMAINS`
  - [ ] Asserts each forbidden host appears in the source
- [ ] **Task 4: Activate `network-trace` job in `.github/workflows/pr-checks.yml`** (AC: 5)
  - [ ] Remove `if: false` and `# Activates in Story 1.7` comment
  - [ ] Add `actions/setup-node@v4` step
  - [ ] Add `npx playwright install --with-deps chromium` step
  - [ ] Add `npx playwright test tests/playwright/network-trace.spec.mjs` step
- [ ] **Task 5: Add `make test-network-trace` target** (AC: 8)
  - [ ] Recipe: `npx --yes playwright test tests/playwright/network-trace.spec.mjs`
  - [ ] Documented in `make help` via `## <description>` comment
- [ ] **Task 6: Optional — author minimal `package.json`** (AC: 6)
  - [ ] Only if needed to scope dev-deps; not strictly required (npx --yes can fetch on-demand). Implementer chooses; document decision in Completion Notes.

## Dev Notes

### Playwright invocation pattern

Per NFR33, no runtime deps. Playwright is dev-only, invoked via:

```
npx --yes playwright test tests/playwright/network-trace.spec.mjs
```

The `--yes` flag auto-confirms package install. For CI, `npx playwright install --with-deps chromium` is required as a setup step to pre-download the chromium binary.

### Why not require `package.json`?

The Story 1.1 master tree lists `package.json` but the current repo doesn't have it. `npx --yes` fetches the package on-demand and caches under `~/.npm`. For Playwright (~100MB browser binary), the cache hit is meaningful — but each PR's fresh CI runner downloads fresh. **`package.json` not strictly required** for this story.

### Forbidden-domain list rationale

Each entry corresponds to a class of telemetry vector the project specifically rejects:
- `fonts.googleapis.com` + `fonts.gstatic.com` — Google Fonts (Story 1.6's `lint-no-external-font` already catches this in source; this is the runtime second line)
- `cdn.jsdelivr.net` + `unpkg.com` — CDN-hosted JS libs (NFR21 forbids them, but malicious paste-in regressions land here)
- `plausible.io`, `goatcounter.com`, `posthog.com`, `mixpanel.com`, `sentry.io`, `googletagmanager.com`, `google-analytics.com` — analytics + error reporting

### Loading via `file://` vs. `http://`

For the Epic-1 baseline (no dev server), Playwright loads `tests/fixtures/network-trace-baseline.html` via `file://`. Playwright's `page.on("request")` still fires for any HTTP request the loaded HTML attempts; the baseline imports nothing, so we expect zero `http(s)://` requests.

When Epic 3 lands the SPA, the spec target becomes `http://localhost:<port>` against a real dev server; the same spec runs unchanged (the `IQME_NETWORK_TRACE_TARGET` env var swaps the target).

### CI job — full Playwright runtime

```yaml
network-trace:
  name: network-trace
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "22"
    - run: npx --yes playwright install --with-deps chromium
    - run: npx --yes playwright test tests/playwright/network-trace.spec.mjs
```

### Local-test structural assertion

The acceptance test in `tests/scaffold/playwright-network-trace.test.mjs` must not actually invoke Playwright. Why: `make test` is a tight feedback loop; downloading a 300MB Chromium binary on every developer iteration is friction-hostile (NFR32 cognitive-load applies to tooling friction too). The structural test ensures the spec is well-formed; CI runs the real assertion.

### Project Structure Notes

- New files:
  - `tests/playwright/network-trace.spec.mjs`
  - `tests/fixtures/network-trace-baseline.html`
  - `tests/scaffold/playwright-network-trace.test.mjs`
- Modified files:
  - `.github/workflows/pr-checks.yml` — flip `network-trace` job from stub to real
  - `Makefile` — add `test-network-trace` target

### References

- Story spec — [epics.md#L637-L657](_bmad-output/planning-artifacts/epics.md#L637-L657)
- NFR8 (no telemetry) — see [epics.md](_bmad-output/planning-artifacts/epics.md)
- NFR33 (zero runtime deps, dev-deps permitted) — [epics.md#L166](_bmad-output/planning-artifacts/epics.md#L166)
- Architecture — `tests/playwright/` directory — [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Prior story 1.6 — established the stubbed `network-trace` CI job to flip.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
