# Required CI checks

This document enumerates every check that runs on a pull request ([`pr-checks.yml`](../.github/workflows/pr-checks.yml)), on the weekly schedule ([`scheduled.yml`](../.github/workflows/scheduled.yml)), and on a release tag ([`release.yml`](../.github/workflows/release.yml)). For each check it states what it enforces, what triggers it, what a failure looks like, and how to fix it — with a link to the lint source under `tools/` or the test spec under `tests/`.

Run the local gate before pushing:

```sh
make lint && make test && make build
```

`make lint` runs every `tools/lint-*.mjs` plus `eslint`; `make test` runs the Node test suites; `make build` re-emits the corpus and the determinism marker. The pr-checks jobs are these same checks, wired one job per check (no greedy glob — a new spec is uncovered until it has its own job).

> If a job is renamed in the workflow, update this document in lockstep — `tests/scaffold/contributing-docs.test.mjs` asserts these names appear here.

## Negative-assertion lints (zero-third-party / no-dark-pattern invariants)

| Job | Enforces | Source |
| --- | --- | --- |
| `lint-no-share` | No social-share widgets / share intents in shipped HTML/JS | [`tools/lint-no-share.mjs`](../tools/lint-no-share.mjs) |
| `lint-no-role-alert` | No coercive `role="alert"` urgency patterns | [`tools/lint-no-role-alert.mjs`](../tools/lint-no-role-alert.mjs) |
| `lint-no-cookie-banner` | No cookie-consent banner (there are no cookies) | [`tools/lint-no-cookie-banner.mjs`](../tools/lint-no-cookie-banner.mjs) |
| `lint-no-analytics-script` | No analytics / tracking script tags | [`tools/lint-no-analytics-script.mjs`](../tools/lint-no-analytics-script.mjs) |
| `lint-no-external-font` | No external font fetches (fonts are self-hosted/system) | [`tools/lint-no-external-font.mjs`](../tools/lint-no-external-font.mjs) |
| `lint-no-localStorage-without-consent` | No `localStorage` write without explicit opt-in | `tools/lint-no-localstorage-without-consent.mjs` |

**Trigger:** every PR. **Failure:** the lint prints the offending file + line and exits non-zero. **Fix:** remove the offending construct; these are load-bearing trust invariants, not style nits.

## Corpus + content lints

| Job | Enforces | Source |
| --- | --- | --- |
| `lint-claims-manifest` | Methodology claims stay coupled to `corpus/METHODOLOGY_CLAIMS.json` | [`tools/lint-claims-manifest.mjs`](../tools/lint-claims-manifest.mjs) |
| `lint-frontmatter` | Methodology frontmatter validates against `corpus/schema.json` | [`tools/lint-frontmatter.mjs`](../tools/lint-frontmatter.mjs) |
| `lint-glossary` | Glossary references resolve per locale | [`tools/lint-glossary.mjs`](../tools/lint-glossary.mjs) |
| `lint-reading-level` | EN Flesch-Kincaid ≤ 12; RU (Oborneva) / PL (Pisarek/Jasnopis) calibrated | [`tools/lint-reading-level.mjs`](../tools/lint-reading-level.mjs) |
| `lint-translation-parity` | RU/PL parity vs EN (no missing/orphan/stale pages) | [`tools/lint-translation-parity.mjs`](../tools/lint-translation-parity.mjs) |
| `lint-i18n-coverage` | Every i18n key present in every locale | [`tools/lint-i18n-coverage.mjs`](../tools/lint-i18n-coverage.mjs) |
| `lint-license-provenance` | License/provenance fields present + hash-stable (NFR24) | [`tools/lint-license-provenance.mjs`](../tools/lint-license-provenance.mjs) |
| `lint-fr36-protection` | The "what this does not measure" page cannot be silently shortened (FR36) | [`tools/lint-fr36-protection.mjs`](../tools/lint-fr36-protection.mjs) |
| `lint-csp-source` | No inline `<style>`/`<script>`/`style=`/`on*=` at source (NFR7) | [`tools/lint-csp-source.mjs`](../tools/lint-csp-source.mjs) |
| `lint-css-link-order` | Deterministic CSS link order | `tools/lint-css-link-order.mjs` |
| `lint-cognitive-load-budget` | App-module byte budgets (`budgets.json`) | [`tools/lint-cognitive-load-budget.mjs`](../tools/lint-cognitive-load-budget.mjs) |
| `lint-trust-artifacts` | LICENSES.md / CITATION.cff / CODEOWNERS / CONTRIBUTING present + well-formed | [`tools/lint-trust-artifacts.mjs`](../tools/lint-trust-artifacts.mjs) |
| `eslint` | ES2022 lint, `--max-warnings 0` | `eslint.config.mjs` |

**Trigger:** every PR. **Failure:** the named lint prints the offending file + reason. **Fix:** correct the content; for claims-manifest, update `corpus/METHODOLOGY_CLAIMS.json` alongside the claim.

## Scoring + build integrity

| Job | Enforces | Source |
| --- | --- | --- |
| `golden-vector-parity` | IRT engine matches R `mirt` within ±0.001 logits (n≥1000) | [`tests/golden/parity-audit.mjs`](../tests/golden/parity-audit.mjs) |
| `byte-stable-build` | `make clean && make build` twice is byte-identical (NFR17) | [`tests/playwright/byte-stable.spec.mjs`](../tests/playwright/byte-stable.spec.mjs) |
| `state-shape-contract` | `state.schema.json` contract holds | [`tests/contract/state-shape.spec.mjs`](../tests/contract/state-shape.spec.mjs) |
| `exit-criterion-spec` | Every shipped lint exercised against corpus + SPA surfaces | `tests/exit-criteria/` |

## Playwright trust + UI specs (one job per spec)

| Job | Enforces | Source |
| --- | --- | --- |
| `trust-verification-full` | Network-trace + CSP-violation count + viewport-overflow (320–1440) consolidated | [`tests/playwright/trust-verification.spec.mjs`](../tests/playwright/trust-verification.spec.mjs) |
| `network-trace` | Zero third-party requests (strict, from day 1) | [`tests/playwright/network-trace.spec.mjs`](../tests/playwright/network-trace.spec.mjs) |
| `full-slice-network-trace` | Strict network trace against the full live slice | [`tests/playwright/full-slice.spec.mjs`](../tests/playwright/full-slice.spec.mjs) |
| `csp-violation-count` | Zero CSP violations across the happy-path | [`tests/playwright/trust-verification.spec.mjs`](../tests/playwright/trust-verification.spec.mjs) |
| `viewport-overflow` | No horizontal scroll at 7 viewport widths | [`tests/playwright/trust-verification.spec.mjs`](../tests/playwright/trust-verification.spec.mjs) |
| `co-equal-triplet-computed-style` | Source/score/methodology co-equal at runtime | `tests/playwright/` |
| `co-equal-triplet-css-source` | Co-equal triplet at the CSS-source level | `tests/unit/lint-css-source-co-equal.test.mjs` |
| `reveal-stage-event-ordering` | The 6-stage reveal event sequence (ADR-3-1) | `tests/playwright/` |
| `difficulty-sentence` | Per-item difficulty breakdown sentence (FR22) | `tests/playwright/` |
| `mid-session-bail-out` | Mid-session bail-out preserves zero-localStorage privacy | `tests/playwright/` |
| `chrome-components` | chrome-header/footer + theme-toggle visibility matrix | `tests/playwright/chrome-components.spec.mjs` |
| `tear-edge-overlay` | Top-decile tear-edge overlay invariant (FR24) | `tests/playwright/` |
| `cropping-fuzzer` | No clean score-only screenshot (gated on `bankFrozen`) | `tests/playwright/` |
| `asymmetric-tail-scenes` | Bottom/mid/top tail-scene copy + crisis resources | `tests/playwright/` |
| `i18n-locale-switch` | EN/RU/PL switcher + persist + reload | [`tests/playwright/i18n-locale-switch.spec.mjs`](../tests/playwright/i18n-locale-switch.spec.mjs) |

## Accessibility + performance

| Job | Enforces | Source |
| --- | --- | --- |
| `axe-core-pa11y` | WCAG 2.2 AA (contrast/keyboard/landmark/aria); pa11y fallback | [`tests/a11y/trust-a11y.spec.mjs`](../tests/a11y/trust-a11y.spec.mjs) |
| `lighthouse` | Light/dark a11y audit + perf budgets (FCP/LCP/TTI/CLS, Slow-4G) | [`tests/perf/lighthouserc.json`](../tests/perf/lighthouserc.json) |

**Trigger:** every PR. **Failure:** the spec reports the failing surface/violation. **Fix:** resolve the violation; do not weaken the assertion.

## Scheduled health checks (weekly)

[`scheduled.yml`](../.github/workflows/scheduled.yml) runs every Monday 06:00 UTC. Each job carries an `area:<check>` label; on failure it opens or appends a GitHub Issue labeled `area:scheduled-check` + a per-check label. Triage discipline + per-check playbooks are in [`docs/scheduled-yml-failure-routing.md`](scheduled-yml-failure-routing.md).

| Job | Enforces | Failure routing |
| --- | --- | --- |
| `internet-archive-snapshot-health` | Recorded IA snapshot URLs return 200 | `area:archive-health` |
| `software-heritage-snapshot-health` | Recorded Software Heritage snapshots resolve | `area:archive-health` |
| `zenodo-doi-resolution` | The minted Zenodo DOI resolves to a real record | `area:doi-health` |

## Release jobs (on tag)

[`release.yml`](../.github/workflows/release.yml) runs on `app-v*` / `corpus-v*` tags.

| Job | Enforces |
| --- | --- |
| `app-release` | Build + full gate + byte-stable; deploy SPA to GitHub Pages |
| `corpus-release` | Per-corpus re-emit + deploy; Zenodo DOI + Internet Archive + Software Heritage archival |
