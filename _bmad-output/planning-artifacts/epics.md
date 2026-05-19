---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '{output_folder}/planning-artifacts/prd.md'
  - '{output_folder}/planning-artifacts/architecture.md'
  - '{output_folder}/planning-artifacts/ux-design-specification.md'
status: 'complete'
createdAt: '2026-05-18'
completedAt: '2026-05-18'
epicCount: 14
storyCount: 75
partyModeRounds:
  - round: 1
    participants: [John, Winston, Sally, Murat, Amelia, Mary]
    focus: 'epic structure stress-test'
    outcome: '8 → 14 epics (Epic 1 split; gate epics 9a–9e unfolded; Epic 10 release ceremony separated)'
  - round: 2
    participants: [John, Winston, Sally, Murat, Amelia]
    focus: 'story breakdown stress-test'
    outcome: '67 → 75 stories (Stories 1.9 + 1.10 + 2.6b + 3.8 + 7.5b + 9a.2 + 9d.2 + 10.3 added; Stories 2.6 + 7.5 + 9a + 9d split; numerous AC enrichments)'
---

# IQ-ME - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for IQ-ME, decomposing the requirements from the PRD, UX Design Specification, and Architecture document into implementable stories.

The implementation sequence is pre-shaped by the Architecture document's nine-development-epic plan (Epics 0–8) plus five parallel gate-outreach tracks (Epics 9a–9e). The vertical-slice-first ordering — Epic 2 proves the load-bearing UX hypothesis (the score→methodology click) before broader investment — is preserved.

## Requirements Inventory

### Functional Requirements

**Test Session (FR1–FR8)**

- **FR1:** Test-takers can begin a test session in their chosen language (EN/RU/PL) without creating an account, providing personal information, or consenting to any data collection beyond what is required to render the page.
- **FR2:** Test-takers can answer one matrix-reasoning item at a time, selecting from a defined option set, with the ability to revisit and change a previous answer until the final submission.
- **FR3:** Test-takers can observe their progress through the test (items completed vs total) at all times during the session.
- **FR4:** Test-takers can bail out of the test mid-session, with an explicit choice between discarding their responses and continuing — no silent partial scoring.
- **FR5:** Test-takers can take a test without time pressure (no countdowns, no per-item timers, no timing-based scoring penalties).
- **FR6:** Test-takers can complete a session entirely within the browser, with no server-side state, no network requests beyond same-origin static-asset fetches, and no persistence unless the user explicitly opts in.
- **FR7:** Test-takers can take a session of 16 items drawn from the full published ICAR Matrix Reasoning pool. A 128-bit session seed is generated at session start via `crypto.getRandomValues()` and held in memory only — never persisted to localStorage, never written to the URL hash, never bookmarkable across machines. The seed deterministically selects the item subset, item order, and per-item image augmentation. Each drawn item undergoes deterministic rotation and/or reflection augmentation as a structural anti-leakage measure.
- **FR8:** Test-takers cannot switch language mid-session once the consent scene is passed; the active locale is locked for the duration of measurement.

**Consent & Validity Disclosure (FR9–FR13)**

- **FR9:** Test-takers can read, before starting the test, a plain-language statement of what the instrument does and does not measure, in their chosen language.
- **FR10:** Test-takers can read, before starting the test, the validity envelope — the conditions under which the instrument is and is not psychometrically valid (including the explicit disclosure that the test is visuospatial and not equivalent for screen-reader users).
- **FR11:** Test-takers can decline the consent scene and exit the application without taking the test, with an explicit "Not today" path.
- **FR12:** Test-takers can confirm consent only after the validity envelope is displayed; the Continue control is not available until the user has had the opportunity to read the disclosure.
- **FR13:** Test-takers can encounter a pre-result "are you ready" beat between submitting the final item and viewing the score, with the option to delay viewing the result.

**Score Computation (FR14–FR17)**

- **FR14:** The scoring engine can compute, given a response pattern and the ICAR item parameters, an ability estimate (θ) and standard error using IRT 2PL EAP estimation.
- **FR15:** The scoring engine can express the ability estimate as both a Gf percentile and an IQ-scale equivalent, accompanied by an honest uncertainty band computed as a 95% confidence interval from a total standard error combining measurement error and norming-sample uncertainty in root-sum-square: `SE_total = √(SEM² + SE_norming²)` and `displayed band = point estimate ± 1.96 · SE_total`.
- **FR16:** The scoring engine can produce its output deterministically — without network access, without DOM dependencies, and without depending on any global mutable state.
- **FR17:** The scoring engine can be invoked independently of the user interface, enabling reproducibility, external audit, and golden-vector testing against a reference implementation.

**Result Delivery (FR18–FR27)**

- **FR18:** Test-takers can see their result rendered with the percentile, IQ-scale equivalent, and uncertainty band as visually co-equal elements (no element visually dominates the others through size, color, or position).
- **FR19:** Test-takers can read tail-specific result-page copy — bottom-decile harm-mitigation, mid-band contextualization, or top-decile anti-credentialization — authored and reviewed in their language by a clinical-register native speaker, not translated from English.
- **FR20:** Test-takers in any percentile range, particularly the bottom decile, can access a curated native-language list of mental-health and crisis-support resources without geolocation, account creation, or any external service request.
- **FR21:** Test-takers can navigate from any number on the result page (percentile, IQ-scale value, uncertainty band) to the methodology page that defines it, in one click, in the test-taker's active language.
- **FR22:** Test-takers can see a per-item-difficulty breakdown of their performance on the result page: drawn ICAR-MR items are partitioned into three difficulty bands (easy / medium / hard) by IRT b-parameter terciles within the v1 pool, and the result page shows fraction-correct within each band.
- **FR23:** Test-takers can read an inline, non-dismissible caveat above the score, in their chosen language, that disclaims clinical, educational-placement, employment, and legal-decision applicability.
- **FR24:** Test-takers in the top decile see a result composition in which the caveat and uncertainty band are visually bound to the score such that producing a clean, decontextualized screenshot of the score requires deliberate editing.
- **FR25:** Test-takers cannot share their result via any built-in affordance (no share button, no certificate, no badge, no `navigator.share()` call, no auto-generated social-card image).
- **FR26:** Test-takers can opt in to saving their result to local browser storage; saving never occurs automatically and the first render must work with storage empty.
- **FR27:** Test-takers can read, on the result page, a per-language explanation of what immediate retesting implies for the score's reliability. No technical retake cooldown is enforced.

**Methodology Corpus (FR28–FR36)**

- **FR28:** Citers can reach every methodology page via a stable, versioned permalink that does not change across future releases.
- **FR29:** Citers can obtain, on every methodology page, a citation block in at least APA format and Wikipedia citation-template format, with version and DOI pre-filled.
- **FR30:** Citers can resolve a Zenodo DOI per release to the canonical version of the methodology corpus at that release.
- **FR31:** Readers can switch between language variants of any methodology page in one click, with `hreflang` declarations enabling cross-language discoverability via search engines.
- **FR32:** Readers can reach, read, and cite the methodology corpus without taking the test — the corpus is independently navigable, indexed, and search-engine-discoverable.
- **FR33:** Readers can read every methodology page at a plain-language reading-level discipline appropriate to the language (Flesch-Kincaid for EN, Oborneva-equivalent for RU, Pisarek/Jasnopis for PL), with the discipline enforced before any page reaches the canonical site.
- **FR34:** Readers can see a "stale translation" banner on any methodology page whose translated content has drifted from the English source.
- **FR35:** Readers can see the named reviewer-of-record per language per version on the methodology page footer or in the corpus changelog.
- **FR36:** Readers can read a separately-maintained "what this instrument does not measure" methodology page, in their language, that is protected from silent shortening or removal.

**Localization & Language (FR37–FR40)**

- **FR37:** Test-takers can select among EN, RU, and PL locales at landing time; the selection is persisted to local browser storage only on explicit opt-in.
- **FR38:** Test-takers can read all UI surfaces (landing page, consent scene, item instructions, item-option labels, progress indicator, result-page copy, methodology corpus links) in their chosen language.
- **FR39:** The three language localizations can be kept in lockstep at the block-level content-key granularity, with build-time enforcement of parity across all three locales.
- **FR40:** Each language locale can be reviewed and signed off by a named reviewer-of-record before any content-key change in that locale reaches the canonical site.

**Trust Verification (FR41–FR46)**

- **FR41:** Skeptics can verify, in 30 seconds via browser DevTools, that the live site issues no third-party network requests during a full session — only same-origin GET requests to static assets.
- **FR42:** Skeptics can read the scoring engine source code as it is shipped to the browser, with no minification, bundling, or transpilation between the source repository and the live deployment.
- **FR43:** Skeptics can read the methodology-claims manifest in the source repository and verify that a CI lint blocks pull requests whose scoring engine and methodology corpus disagree on any declared claim.
- **FR44:** Skeptics can read the committed golden-vector test set and the CI workflow that runs the scoring engine against it, asserting agreement with the reference implementation (R `mirt`) to ±0.001 logits.
- **FR45:** Skeptics can read, in the repository root, the written ICAR license confirmation as a verifiable artifact.
- **FR46:** Skeptics can locate, for every tagged release, that release's archival snapshots on Internet Archive and Software Heritage and its Zenodo DOI.

**Contribution & Governance (FR47–FR53)**

- **FR47:** Contributors can submit a pull request proposing a content change to any locale, code change to the app, or methodology-corpus change, by following a documented workflow committed in `CONTRIBUTING.md`.
- **FR48:** The CI system can block any pull request that violates translation parity, methodology-claims-manifest parity, license-provenance integrity, per-language reading-level, accessibility baseline, network-trace zero-third-party invariant, or scoring-engine golden-vector accuracy.
- **FR49:** Maintainers can require both maintainer approval and per-language reviewer-of-record approval before merging any non-EN content-key change.
- **FR50:** Readers can see, in `LICENSES.md` at the repository root, the source license for the app (MIT) and for the item pool and translated content (CC-BY-NC-SA or upstream-author-specified).
- **FR51:** Readers can read, in the README, the forking-ethics statement asking forkers to preserve the caveats and the methodology corpus — with the understanding that this is a request, not enforceable under MIT.
- **FR52:** Readers can subscribe to project updates via GitHub Discussions threads and GitHub repository release notifications; no email-subscription mechanism exists.
- **FR53:** Contributors can see their contributions credited by GitHub handle in the per-release changelog without requiring any external tracking or social-graph integration.

### NonFunctional Requirements

**Performance (NFR1–NFR5)**

- **NFR1:** Load time on mid-tier Android over Slow 4G: FCP < 1.5s, LCP < 2.5s, TTI < 3.0s, CLS < 0.05. Lighthouse-in-CI enforced.
- **NFR2:** Page weight: initial-load assets ≤ 200 KB gzipped; methodology pages ≤ 100 KB gzipped each; matrix items ≤ 50 KB each (SVG preferred).
- **NFR3:** EAP scoring latency < 100 ms on mid-tier mobile; no spinner on score computation.
- **NFR4:** Full-session memory usage ≤ 50 MB (Playwright `performance.memory` snapshots).
- **NFR5:** Browser footprint: Chrome / Chromium-derived (Edge, Brave, Opera, Yandex Browser, Samsung Internet), Firefox, Safari (macOS+iOS) — last 24 months. Yandex Browser specifically validated.

**Security & Privacy (NFR6–NFR11)**

- **NFR6:** Zero-third-party invariant — only same-origin GET to static assets; Playwright network-trace asserts on every PR.
- **NFR7:** Strict CSP `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. No `eval`, no `new Function`, no inline `<script>`, no inline event handlers.
- **NFR8:** Zero PII collection — no cookies, no fingerprinting, no IP-based logging by IQ-ME. GDPR / 152-FZ / UODO controller obligations not triggered by design.
- **NFR9:** localStorage writes occur only as a direct synchronous consequence of explicit user action. First-render correctness must not depend on localStorage state.
- **NFR10:** Cryptographic randomness only — `crypto.getRandomValues`; `Math.random()` forbidden in scoring/selection code paths (repo-level grep CI).
- **NFR11:** Forking-ethics request in README (non-enforceable; documented as a request).

**Accessibility (NFR12–NFR15)**

- **NFR12:** WCAG 2.2 AA on all non-item surfaces; axe-core/pa11y in CI.
- **NFR13:** Validity-envelope honesty on items — visuospatial items disclosed in consent (FR10); no synthetic alt-text.
- **NFR14:** Manual screen-reader audit pre-launch on NVDA+Firefox, VoiceOver+Safari, TalkBack+Chrome; results documented in launch-readiness.
- **NFR15:** Dark mode as separately-designed palette; reveal-sequence has `prefers-reduced-motion: reduce` fallback.

**Reliability & Availability (NFR16–NFR20)**

- **NFR16:** GitHub Pages canonical uptime; effective uptime is the host's, documented as honest disclosure (no SLA promise).
- **NFR17:** Mirror-readiness — relative paths throughout, byte-identical to Codeberg / Cloudflare Pages; same-day failover.
- **NFR18:** Archival redundancy — every release mirrored to Internet Archive + Software Heritage (manual at launch; automation v1.0.1).
- **NFR19:** Stale-version banner renders on translation hash drift.
- **NFR20:** Graceful localized JS-error fallback; no automatic error reporting, no telemetry.

**Auditability & Verifiability (NFR21–NFR26)**

- **NFR21:** Runtime-zero-build invariant — deployed JS tree matches source JS tree byte-for-byte. Author-time `make build-methodology` is the only build; its output IS the shipped artifact.
- **NFR22:** Scoring engine golden-vector parity within ±0.001 logits vs R 4.4.x + `mirt` 1.41.x using `mirt::fscores(method="EAP", quadpts=61, theta_lim=c(-6,6))` with `set.seed(20260514)` over ≥1,000 simulated patterns. CI `node --test` blocks the build on regression.
- **NFR23:** Methodology-claims manifest parity — `METHODOLOGY_CLAIMS` manifest in scoring engine vs `asserts:` frontmatter in methodology pages; CI lint hard gate from v1.
- **NFR24:** License-provenance — every shipped item file traces to ICAR attribution; `LICENSES.md` unmodified except via changelog; committed ICAR license confirmation artifact. CI license-provenance test.
- **NFR25:** Citation infrastructure — per-corpus-release versioned permalinks `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` (every page re-emitted at every corpus version tag); JSON-LD `ScholarlyArticle`; hreflang; `CITATION.cff`; Zenodo DOI per release.
- **NFR26:** Verification time-to-confidence — ≤ 30 s DevTools zero-third-party verification; ≤ 10 min source read for scoring engine (~250 LOC); ≤ 5 min local golden-vector run with only `node` installed.

**Content Governance & Translation Equivalence (NFR27–NFR31)**

- **NFR27:** Block-level content-key parity — every methodology page structured as block-level content keys; EN source hash in RU/PL frontmatter; CI fails on missing keys, orphan keys, or stale source hashes.
- **NFR28:** Reading-level discipline — Flesch-Kincaid grade ≤12 for EN (target 9–10), Oborneva-equivalent for RU, Pisarek/Jasnopis for PL. CI-enforced from v1.
- **NFR29:** Reviewer-of-record per language per version; branch protection enforces maintainer + per-language-reviewer dual-approval on non-EN content-key changes; reviewer name + handle + sign-off date surfaced on page footer or changelog.
- **NFR30:** Glossary-first writing — every technical term exists in `/glossary/` in all three languages before appearing in body text; lint enforces.
- **NFR31:** Style guide invariants — no idioms; sentence-length caps (25 words EN; ~180 chars RU; ~160 chars PL); SVG diagrams with translated `<title>`/`<desc>` as content keys.

**Maintainability & Sustainability (NFR32–NFR35)**

- **NFR32:** Solo-dev cognitive-load budget — ~250 LOC scoring engine, ~30 KB app modules, ~15 KB i18n harness, ~1500 LOC CSS, ~30 methodology pages per locale. `BUDGETS.json` + `lint-cognitive-load-budget.mjs` enforce.
- **NFR33:** Zero npm runtime dependencies in production. Dev-time tooling permitted (`axe-core`/`pa11y`, Playwright, Lighthouse CLI, `node --test`, reading-level analyzers) invoked via `make` targets; vendored single-file tools (e.g. `marked`) permitted via `vendor/` with SHA-pinned `vendor/SHASUMS`.
- **NFR34:** License sustainability — App MIT; items + translations + methodology CC-BY-NC-SA (or ICAR-author-specified). All declared in `LICENSES.md`.
- **NFR35:** Outlast-the-maintainer — site, repo, methodology corpus, DOIs, archived snapshots remain readable/citable/reproducible even if the canonical maintainer abandons the project.

### Additional Requirements

These technical and infrastructure requirements derive from the Architecture document and shape implementation beyond what the FRs/NFRs alone capture.

**Bootstrap & Project Structure**

- Project is **greenfield with no off-the-shelf starter**; hand-authored bootstrap is the first epic. The prototype `iq-me.html` is deleted on day one (`git rm iq-me.html`) to prevent drift back to the rejected v0 aesthetic and scoring.
- **Five-Domain Boundary Model**: A (SPA `src/assessment/`) / B (Scoring `src/scoring/irt/`) / C (Content `src/content/`) / D (Tools `tools/`) / E (Test Fixtures `tests/`). Domain boundaries enforced by `no-restricted-paths` ESLint config. One exception: D → E snapshot writes via `make snapshot-update`, codified in lint config.
- Bootstrap commit lands: `Makefile`, `LICENSES.md`, `CITATION.cff`, `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `BUDGETS.json`, `corpus/schema.json`, `corpus/frontmatter.schema.json`, `corpus/markdown-subset-v1.md`, `corpus/build-cache-v1.schema.json`, `corpus/methodology-claims-v1.schema.json`, `docs/corpus-build-conventions.md`, `docs/branch-protection-config.md`, `docs/required-ci-checks.md`, `docs/scheduled-yml-failure-routing.md`, `vendor/SHASUMS`, `.github/CODEOWNERS`.
- ES2022 + CSS Custom Properties baseline. Native ES modules via `<script type="module">` with **relative paths only** (no `import map`).
- Hash-based routing for the assessment SPA (`#/test`, `#/result`); path-based URLs for the methodology corpus (`/methodology/v<X>.<Y>.<Z>/<lang>/<path>/index.html`).

**Corpus Build Pipeline**

- Author-time `make build-methodology` is the **only** build step. Walks `src/content/methodology/{en,ru,pl}/**.md`, parses + validates frontmatter, renders body via a subset renderer, injects masthead/lede/trail/JSON-LD/citation/hatnote chrome, emits per-locale per-version HTML to `dist/methodology/v<corpus-version>/<lang>/<path>/`.
- **Markdown renderer strategy** (D1): vendored `marked` (single-file, ~2 KB, MIT, zero transitive deps) into `vendor/marked.js` with SHA pinned in `vendor/SHASUMS`, OR a hand-rolled strict-mode renderer (~200 LOC) against a declared markdown subset published in `corpus/markdown-subset-v1.md`. Decision deferred to implementation per Architecture §D1.
- **`corpus/schema.json`** is the methodology-corpus frontmatter contract. Required fields: `title`, `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `asserts[]`, `glossaryRefs[]`, `sourceHashEN`.
- **Byte-stable build** CI assertion: `make build && hash dist/; make clean && make build && hash dist/; diff` — fails on non-deterministic output.
- **Per-corpus-release re-emit** (NFR25): every page re-emits at every corpus version tag, regardless of content change.
- **Golden HTML snapshots** in `tests/snapshots/methodology/`; drift requires a PR touching `src/content/**` AND `tests/snapshots/**` in the same commit, gated by methodology-claims-manifest review.
- Two-tier build cache **deferred** until full-build wall-clock exceeds 30 s OR third corpus version tag, whichever first.

**Scoring Engine Module Decomposition**

- Modules at `src/scoring/irt/`: `quadrature.js`, `likelihood.js`, `eap.js`, `se.js`, `index.js`. Pure functions, no DOM imports, no global state, no async.
- Throw `TypeError`/`RangeError` from scoring functions; never return `NaN` or error objects.
- `METHODOLOGY_CLAIMS.json` co-located with the scoring engine; declares engine's methodology dependencies that the claims-parity lint validates against `asserts:` in methodology pages.
- Golden vectors committed at `tests/golden/vectors.json` with `tests/golden/CHANGELOG.md` for re-pin events and `tests/golden/README.md` reproducibility runbook.

**CI Pipeline & Branch Protection**

- v1 workflow set is **3 files**: `pr-checks.yml`, `release.yml`, `scheduled.yml`. Meta-CI workflow and per-directory gate matrix deferred until second sustained external contributor.
- Every lint runs on every PR at v1 (gate-matrix-collapsed posture).
- `release.yml` triggers: `app-v<X>.<Y>.<Z>` tag → build + deploy to GitHub Pages + mirror. `corpus-v<X>.<Y>.<Z>` tag → build + deploy + mint Zenodo DOI + archive to Internet Archive + Software Heritage. v1.0.0 launch = coordinated double-tag.
- `scheduled.yml` failures auto-open a GitHub Issue labeled `area:scheduled-check` + the specific check name (e.g. `area:mirror-health`). Maintainer triages weekly; no email/Slack notification (NFR6).
- **CI lint suite** (must all be green from v1 except where noted): `lint-claims-manifest`, `lint-frontmatter`, `lint-glossary`, `lint-reading-level`, `lint-translation-parity`, `lint-license-provenance`, `lint-cognitive-load-budget`, `lint-trust-artifacts`, `lint-no-role-alert`, `lint-css-link-order`, `lint-cropping-fuzzer`, `lint-no-share`, `lint-no-third-party`, byte-stable-build assertion, golden-vector parity, axe-core/pa11y, Lighthouse-in-CI, network-trace, viewport-overflow, co-equal-triplet computed-style, CSP-violation count, `iqme:reveal-stage` event ordering.
- **Branch protection** enforces dual-approval (maintainer + per-language reviewer-of-record) on non-EN content-key PRs; `.github/CODEOWNERS` and `docs/branch-protection-config.md` codify ownership.

**Naming & Code Conventions**

- CSS BEM: `.block`, `.block__element`, `.block--modifier`. State via `data-*` attributes only (never stateful classes): `[data-reveal-stage="anchor"]`, `[data-theme="dark"]`, `[data-locale="ru"]`, `[data-translation-stale="true"]`.
- One component CSS file per component at `src/css/components/<block-name>.css`; file name matches block selector.
- JSON field naming: **camelCase** project-wide (per Step 5 architectural decision; Party Mode held).
- HTML IDs and URL fragments: **kebab-case** (mixed-by-domain intentional — kebab required for HTML; camelCase chosen for JS-callable data).
- In-page DOM events follow `iqme:<verb-or-state>` (e.g. `iqme:reveal-stage`) with `t:` from `performance.now()`.
- Inline `debug()` helper replaces any `src/lib/log.mjs` precedent (avoids "shared module precedent" failure mode).
- Conventional Commits with project scopes (`feat(scoring): ...`, `fix(corpus): ...`).

**Deployment & Mirror**

- Canonical: GitHub Pages. Same-day failover: Codeberg Pages OR Cloudflare Pages (whichever wins, byte-identical artifact).
- Relative asset paths throughout — no GitHub-Pages-specific path tricks.
- Mirror parity verification: response-body check (headers legitimately differ between hosts), documented in `docs/scheduled-yml-failure-routing.md`.
- `dist/` is gitignored; built artifact lives in GitHub Pages deployment branch.

**Tag Namespaces & Versioning**

- Decoupled app and corpus version tags. `app-v<X>.<Y>.<Z>` and `corpus-v<X>.<Y>.<Z>` are independent.
- App shell footer link to the methodology corpus uses the most-recently-tagged corpus version (`git describe --tags --match 'corpus-v*' --abbrev=0`).
- Browser-too-old fallback HTML links to `/methodology/v<X>.<Y>.<Z>/<lang>/`; the version string is substituted by `release.yml` at build time (the only build-time version substitution touching the SPA shell).

**Five Parallel Gate-Outreach Tracks (Epics 9a–9e)**

- These are **not code-write epics** — they are document/outreach tracks running in parallel from Epic 1 completion. They produce artifacts under `docs/launch-readiness/`. Each gate is independently clocked.
  - **9a:** ICAR / SAPA project written license confirmation (pre-launch gate #1)
  - **9b:** External psychometrician recruitment + sign-off
  - **9c:** RU clinical-register translator recruitment + ongoing translation review
  - **9d:** PL clinical-register translator recruitment + ongoing translation review
  - **9e:** 5 × 3 native-speaker tester recruitment + credibility validation (≥12/15 launch gate)

**Phase-2 Deferrals (Tagged Inline)**

- Service worker for offline assessment (NFR23 cache-invalidation conflict).
- Version-mismatch hatnote component (only triggers on cited-old-version traffic, empty at launch).
- Tail-aware-trail component if budget slips.
- EAP-shrinkage diagram (validity-envelope diagram ships v1; EAP-shrinkage may slip to v1.0.1).
- BibTeX format in `cite-this-page-widget` (APA + Wikipedia-template are launch-required).
- High-contrast theme adaptations (UX Phase 3).
- RTL layout adaptations (no RTL target in v1).

### UX Design Requirements

The UX Design Specification reveals **25 components across 4 domains** plus a complete design-system foundation. Each item below is specific enough to produce a story with testable acceptance criteria.

**Design System Foundation**

- **UX-DR1:** Two-layer CSS token architecture — `src/css/primitives.css` (raw tokens) → `src/css/semantic.css` (role-mapped tokens). Hand-rolled CSS Custom Properties; no preprocessor, no Tailwind, no styled-components.
- **UX-DR2:** Three-token semantic color palette — Neutral scale (11 steps cool gray `--color-neutral-0` … `--color-neutral-1000`), Accent (3 steps muted deep ink-blue `--color-accent-300/500/700`), Attention (3 steps muted amber `--color-attention-300/500/700`). No success-green, no warning-orange, no error-red. Single signal hue.
- **UX-DR3:** Major-Third type scale (1.250) anchored at 16px body — `--font-size-100` through `--font-size-800`. Score triplet at `--font-size-600` (39px). System-stack-only font families (`--font-family-sans`, `--font-family-mono`).
- **UX-DR4:** 8px spacing scale `--space-1` through `--space-9` with semantic spacing tokens (`--space-prose-paragraph-gap`, `--space-section-gap`, `--space-score-triplet-gap`, etc.). Single-column content-driven layouts; no formal grid system. Prose max-measure 65ch.
- **UX-DR5:** Two-breakpoint responsive — `--bp-tablet` (≥600px), `--bp-desktop` (≥1024px). Mobile-first. Container queries where supported; `@media` fallback.
- **UX-DR6:** Dark mode as separately-designed palette (not auto-inverted). Theme switching via `[data-theme="dark"]` attribute + `prefers-color-scheme` fallback. Tri-state theme toggle: System / Light / Dark.

**Shared Chrome Components (4)**

- **UX-DR7:** `chrome-header` — project name + language switcher; persistent across landing, consent, result, methodology pages.
- **UX-DR8:** `chrome-footer` — methodology corpus link, dark-mode toggle, GitHub Discussions link, citation reference; hidden on item-runner.
- **UX-DR9:** `language-switcher` — keyboard-first dropdown or tab-list for EN/RU/PL; persists to localStorage on explicit click only (NFR9).
- **UX-DR10:** `theme-toggle` — keyboard-first tri-state toggle (System / Light / Dark).

**Methodology Corpus Components (7)**

- **UX-DR11:** `masthead` (load-bearing) — title + version + DOI + last-reviewed date + named reviewer-of-record + Cite-this-page widget access; bottom hairline rule. First thing every methodology page renders.
- **UX-DR12:** `lede` — one plain-language sentence below the masthead; surface-aware (addresses the specific click that brought the user).
- **UX-DR13:** `tail-aware-trail` — 2-step curated reading path, tail-asymmetric. May slip to v1.0.1 if budget tight.
- **UX-DR14:** `cite-this-page-widget` — APA + Wikipedia-template + BibTeX + Zenodo DOI; three terminal exits. (BibTeX nice-to-have; APA + Wikipedia-template launch-required.)
- **UX-DR15:** `stale-translation-hatnote` (load-bearing trust signal) — dated, per-page, role-marked drift signal at page top (NOT a footer/CI artifact).
- **UX-DR16:** `translation-in-progress-stub` — replaces silent EN/RU fallback for missing PL pages; contributor recruitment CTA inline.
- **UX-DR17:** `version-mismatch-hatnote` — "You are reading v1.0.0. Current version: v1.4.0 (diff)." Deferred until first cited-old-version arrival.

**Assessment SPA Components (10)**

- **UX-DR18:** `landing` — twin-CTA: "Start the test" / "Read the methodology"; language switcher; named-loss copy if interrupted-session flag detected.
- **UX-DR19:** `consent-scene` (load-bearing) — validity-envelope-first composition; validity-envelope diagram placement; Continue / Not today at emotionally equal visual weight. Continue is gated until validity envelope is displayed (FR12).
- **UX-DR20:** `progress-indicator` — `aria-live="polite"`; `aria-current="step"`; "Item N of 16". NO gamification, NO XP, NO streaks.
- **UX-DR21:** `item-runner` — matrix item card with subtle elevation; native `<input type="radio">` group; keyboard arrow-key navigation; Previous + Next; Bail-out affordance with explicit discard/continue choice (FR4).
- **UX-DR22:** `score-panel` (load-bearing apex) — co-equal triplet typography (percentile + IQ-scale + uncertainty band rendered at `--font-size-600`, bounding-box area ratio within ±15% pairwise, font-size delta within 2px, baseline alignment within 4px, font-weight differential ≤100) + qualitative band label + difficulty-breakdown sentence + inline non-dismissible caveat (`role="note"`, NOT `role="alert"`) + tear-edge overlay. Five reveal stages: `[data-reveal-stage="anchor|band|interval|context|tail-scene|methodology-handoff"]`.
- **UX-DR23:** `tail-scene-bottom` (load-bearing) — asymmetric composition for bottom-decile (Mikhail journey); spare, present-tense, second-person copy; crisis-resource link spatially privileged. Per-language clinical-register-reviewed, NOT translated from English.
- **UX-DR24:** `tail-scene-mid` — mid-band quiet contextualization.
- **UX-DR25:** `tail-scene-top` — top-decile anti-credentialization composition with tear-edge overlay active; caveat visually bound to score such that decontextualized screenshot requires deliberate editing (FR24).
- **UX-DR26:** `silent-companion-line` — non-interactive locale-native single line accompanying bottom-decile tail-scene. Operationalizes "held."
- **UX-DR27:** `locale-switch-blocker-hint` — teachable-moment in-place hint when user attempts to switch language mid-session (FR8).

**Shared Diagrams (2)**

- **UX-DR28:** `validity-envelope-diagram` (SVG + CSS) — reusable in consent scene + `/methodology/constructs/validity-envelope/`. Translated `<title>`/`<desc>` as content keys (NFR31). Ships v1.
- **UX-DR29:** `eap-shrinkage-diagram` (SVG + CSS) — reusable in `/methodology/scoring/eap/`. May slip to v1.0.1 (UX Phase 2).

**Score-Delivery Ceremony (`iqme:reveal-stage` event)**

- **UX-DR30:** In-page DOM event `iqme:reveal-stage` dispatched by `src/assessment/reveal-stage.js`; consumed by `src/assessment/result.js` + `src/css/components/score-panel.css` `[data-reveal-stage]`. Per-band beat sequence + dwell timings pinned during SPA hardening epic. Reveal motion respects `prefers-reduced-motion: reduce` (NFR15) with instant-render fallback.

**Accessibility & Interaction Patterns**

- **UX-DR31:** Color is never the sole carrier of information — links carry underline + accent; focus carries `:focus-visible` ring + accent color; stale-translation hatnote carries icon + label + attention color.
- **UX-DR32:** Native `<input type="radio">` with `<label>` for item options (no custom-div widgets); keyboard arrow-key navigation native to radio-group.
- **UX-DR33:** Landmark regions (`<main>`, `<nav>`, `<footer>`); `<html lang="en|ru|pl">` per page; `dir="ltr"`; no RTL support v1.
- **UX-DR34:** Pre-launch manual screen-reader pass on NVDA+Firefox (Windows), VoiceOver+Safari (macOS), TalkBack+Chrome (Android) on non-item surfaces (NFR14).
- **UX-DR35:** Print stylesheet for methodology corpus; assessment app explicitly does not support print (`@media print { ... display: none; }` for test surface).

**Inventory Caps & Budgets**

- **UX-DR36:** Total CSS budget ~1500 LOC across all 25 components (NFR32). Enforced by `BUDGETS.json` + `tools/lint-cognitive-load-budget.mjs`.

### FR Coverage Map

**Note on multi-epic FRs (Mary's clue, party-mode 2026-05-18):** Several FRs have an *artifact* facet (code/content shipped to the repo) and a *process* facet (external human engagement). Where this applies, the artifact lands in a dev epic and the process lands in a gate epic. The split is annotated below.

**Note on second-pass party-mode revisions (2026-05-18):** Story breakdown was stress-tested by John / Winston / Sally / Murat / Amelia after initial drafting; revisions were applied as a second pass. Notable: Epic 1 grew from 8 to 10 stories (added Story 1.9 ESLint+domain-map, Story 1.10 Design System Foundation per Sally's UX-DR1-6 orphan finding); Story 2.6 split into 2.6a R-in-CI smoke + 2.6b full ≥1,000 vectors (per Amelia's R-bridge AC fix); Story 3.8 added (aha-click hallway test per John+Sally); Story 7.5 split into 7.5a reading-level + 7.5b parity (per Murat's highest-risk-story split); Gates 9a + 9d split into outreach + reconciliation sub-stories (per John's gate-granularity); Story 10.3 added (48-hour post-launch monitoring per John); negative-assertion lints (`lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent`) hoisted to Epic 1 Story 1.6 (per Murat's negative-invariant discipline); `bankFrozen` schema authored in Story 1.4 (per Murat's orphan-fixture fix).

- **FR1** (begin session in chosen language, no account): Epic 3 — vertical-slice landing → consent → test
- **FR2** (one item at a time; revise answer): Epic 3 — item-runner with Previous + Next
- **FR3** (progress indicator): Epic 3 — progress-indicator component
- **FR4** (mid-session bail-out with discard/continue): Epic 6 — full ceremony hardening
- **FR5** (no time pressure): Epic 3 — design decision baked into item-runner
- **FR6** (browser-only session, no server state): Epic 3 — state.js in-memory module
- **FR7** (16 items, 128-bit crypto seed, deterministic subset/order/augmentation): Epic 3 — item-prng + item-selection
- **FR8** (locale-switch mid-session blocked): Epic 7 — locale-switch-blocker-hint teachable moment
- **FR9** (plain-language statement of what test measures): Epic 3 — EN consent scene
- **FR10** (validity envelope including visuospatial disclosure): Epic 3 — consent-scene + validity-envelope-diagram (chrome CSS moves to Epic 5 per Sally + Amelia)
- **FR11** (decline consent with "Not today" exit): Epic 3 — consent-scene
- **FR12** (Continue gated until envelope displayed): Epic 3 — consent-scene
- **FR13** (pre-result "are you ready" beat): Epic 3 — reveal-stage event (anchor stage)
- **FR14** (IRT 2PL EAP θ + SE): Epic 2 — scoring engine
- **FR15** (percentile + IQ-scale + 95% CI band, RSS uncertainty): Epic 2 (engine emission contract); FR18 (visual co-equal) carries the rendering responsibility — see FR18
- **FR16** (deterministic, no network, no DOM, no globals): Epic 2 — scoring engine module discipline
- **FR17** (scoring independently invocable for audit): Epic 2 — `node --test` golden-vector parity
- **FR18** (co-equal triplet visual rendering): Epic 3 (initial CSS-source lint enforcement) + Epic 6 (Playwright ±15% area / 2px / 4px / weight 100 computed-style assertion)
- **FR19** (tail-specific clinical-register copy per language): Epic 6 (EN placeholder with reviewer-of-record TBD) + Epic 7 (RU/PL clinical-register copy; depends on Gates 9c/9d)
- **FR20** (per-language crisis-resource list, no geolocation): Epic 6 (EN list) + Epic 7 (RU/PL lists)
- **FR21** (one-click number → methodology page): Epic 3 — methodology-handoff URL contract + reveal-stage hookpoint
- **FR22** (per-item-difficulty breakdown easy/medium/hard): Epic 6 — score-panel difficulty-sentence
- **FR23** (inline non-dismissible caveat): Epic 3 — score-panel `[role="note"]` (lint-no-role-alert enforced from Epic 1 per Murat)
- **FR24** (top-decile anti-screenshot composition): Epic 6 — tail-scene-top + tear-edge + cropping fuzzer (cropping fuzzer gated on item-bank-frozen flag per Murat)
- **FR25** (no share / certificate / badge / navigator.share): Epic 1 — lint-no-share negative-assertion enforced from day 1 per Murat (was Epic 5 in v1 of plan)
- **FR26** (opt-in localStorage save): Epic 3 (storage-empty first render) + Epic 6 (full opt-in save UI)
- **FR27** (retest-effect copy on result page): Epic 6 — score-panel retest-note
- **FR28** (stable versioned permalinks): Epic 4 — corpus build pipeline + per-corpus-release re-emit
- **FR29** (APA + Wikipedia-template citation block per page): Epic 4 — cite-this-page-widget infrastructure (APA + Wikipedia-template; BibTeX nice-to-have)
- **FR30** (Zenodo DOI per release): Epic 4 (scheme + CITATION.cff) + Epic 8 (actual minting via release.yml)
- **FR31** (hreflang cross-language linking): Epic 7 — RU + PL methodology corpus
- **FR32** (corpus reachable without taking test): Epic 3 (3 stub pages) + Epic 5 (full 30 EN pages with anchor-pages-first sequencing per Sally)
- **FR33** (per-language reading-level discipline): Epic 4 — lint-reading-level (corpus prose) + Epic 6 calibration for SPA microcopy per Winston
- **FR34** (stale-translation banner on drift): Epic 4 — stale-translation-hatnote component + lint-translation-parity stub (full lint coverage in Epic 7)
- **FR35** (named reviewer-of-record per language per version on page footer): Epic 4 — masthead component + frontmatter contract
- **FR36** (protected "what this instrument does not measure" page): Epic 5 — FR36-protected page content + protection lint
- **FR37** (EN/RU/PL locale selection at landing): Epic 7 — language-switcher component
- **FR38** (all UI surfaces in chosen language): Epic 7 — i18n harness
- **FR39** (block-level content-key parity build-time enforced): Epic 7 — lint-translation-parity full coverage (no-op stub in Epic 4 per Amelia)
- **FR40** (reviewer-of-record sign-off before content-key change): split — Epic 7 (CODEOWNERS + branch-protection config artifact) + Epics 9c/9d (process: actual reviewer engagement)
- **FR41** (30-second DevTools zero-third-party verification): Epic 1 — network-trace Playwright infra + STRICT assertion from day 1 per Murat (not "initial then tightened later"); Epic 3 exercises it on the vertical slice; Epic 8 adds the full DevTools-readable verification surface
- **FR42** (scoring source readable as shipped, no minification): Epic 1 — runtime-zero-build invariant established by repo conventions
- **FR43** (methodology-claims manifest with CI parity lint): Epic 1 (lint shipped green on empty manifest per Winston) + Epic 4 (manifest populated as corpus claims land)
- **FR44** (committed golden vectors + visible CI workflow): Epic 2 — tests/golden/vectors.json + pr-checks.yml `node --test`
- **FR45** (ICAR license confirmation as repo artifact): split — Epic 1 (FR45a: artifact slot in repo root with "pending — see methodology" fallback per John) + Epic 9a (FR45b: actual confirmation arrival)
- **FR46** (per-release Internet Archive + Software Heritage snapshots + Zenodo DOI): Epic 8 — release.yml archival triggers
- **FR47** (PR workflow in CONTRIBUTING.md): Epic 8 — CONTRIBUTING.md full version (slim CONTRIBUTING.md stub lands in Epic 1)
- **FR48** (CI blocks PRs on parity / lint / network / golden-vector failures): Epic 1 (CI matrix YAML scaffold + first lints) + Epic 4 (corpus lints) + Epic 8 (full consolidation)
- **FR49** (dual-approval for non-EN content-key changes): Epic 7 — CODEOWNERS + branch-protection-config artifact (process in Epics 9c/9d)
- **FR50** (LICENSES.md app MIT + content CC-BY-NC-SA): Epic 1 — LICENSES.md authored
- **FR51** (README forking-ethics statement): Epic 1 — README authored
- **FR52** (GitHub Discussions subscribe path; no email signup): Epic 8 — discussions link in chrome-footer
- **FR53** (contributor credit in per-release changelog): Epic 8 — CHANGELOG.md format + release.yml automation

## Epic List

> **Revisions from Party Mode (2026-05-18):** The original 8-epic proposal was stress-tested by John (PM), Winston (Architect), Sally (UX), Murat (TEA), Amelia (Dev), and Mary (Analyst). Consensus moves applied: (1) Epic 1 split into Epic 1 (Trust + CI Skeleton) and Epic 2 (Scoring Engine) per Amelia's cognitive-load count; (2) methodology-page-chrome CSS reseamed from SPA epic into corpus epic per Sally + Amelia; (3) `lint-no-share` and `lint-no-role-alert` hoisted to Epic 1 as negative-assertion invariants per Murat; (4) `state.schema.json` + `iqme:reveal-stage` event-contract ADR + methodology-URL pattern added as written contracts to the vertical-slice epic per John + Winston + Amelia; (5) strict network-trace from day 1 per Murat (not "initial then tighten"); (6) methodology corpus epic internally sequenced anchor-pages-first per Sally; (7) Epic 8 (Launch Gate Closure) unfolded into five separate gate-epics (9a–9e) per Mary's accountability-surface argument, with Epic 10 as the final release-milestone marker; (8) FR45 (ICAR confirmation) split into artifact-slot (Epic 1) and outreach-process (Epic 9a) per Mary's FR-factoring clue.
>
> **Sequence rationale:** Epics 1–8 are dev work (sequenced). Epics 9a–9e are stakeholder-outreach tracks that **start at Epic 2 completion** and run in parallel through Epics 3–8 with independent lead-time clocks. Epic 10 is the coordinated release ceremony — fires when all dev epics merge AND all five gates close.

### Epic 1: Repo Trust Artifacts + CI Skeleton + Negative-Assertion Lints

A skeptic (per PRD Journey 4 — Tomáš) can clone the repository at its very first commit and see the full trust posture mechanically enforced: `LICENSES.md` (MIT app + CC-BY-NC-SA content), `CITATION.cff` at root, `README.md` with the forking-ethics statement and the project's no-telemetry / no-signup / source-on-GitHub claims, a slim `CONTRIBUTING.md` placeholder, an `ICAR-CONFIRMATION.pdf` slot with a "pending — see methodology" visible-fallback (per John, not a silent null), `CODEOWNERS`, `BUDGETS.json` enforced by `tools/lint-cognitive-load-budget.mjs`, the full corpus schema set (`corpus/schema.json`, `corpus/frontmatter.schema.json`, `corpus/markdown-subset-v1.md`, `corpus/methodology-claims-v1.schema.json`), `docs/corpus-build-conventions.md`, and a `Makefile` with `make test` / `make lint` / `make build` targets. Critically: the full CI job matrix YAML ships with every future lint as a stub-job (per Murat — fixture-architecture-first applied to CI itself); the strict zero-third-party network-trace Playwright infrastructure ships at full strictness from day one; `lint-claims-manifest`, `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, and `lint-cognitive-load-budget` are all green on the empty-repo state (per Winston's sequencing constraint — trust artifacts before any scoring code). A deterministic-build harness (frozen timestamps, sorted file ordering, locale-independent hashing) is in place to support the golden-vector parity test that lands in Epic 2 (per Murat). No scoring code, no SPA code, no methodology content — just the verifiable trust surface and the CI gates that police everything that follows.

**FRs covered:** FR25 (lint-no-share enforced from day 1), FR41 (strict network-trace infra + assertion), FR42 (runtime-zero-build invariant), FR43 (claims-manifest lint green on empty manifest), FR45 (artifact slot with visible-fallback copy), FR48 (CI matrix scaffold + first lints), FR50, FR51

### Epic 2: Auditable Scoring Engine + Golden Vectors

A skeptic can read the entire IRT 2PL EAP implementation in `src/scoring/irt/` (`quadrature.js`, `likelihood.js`, `eap.js`, `se.js`, `index.js`; ~250 LOC of pure functions, no DOM, no async, no globals; `TypeError`/`RangeError` thrown — never `NaN`) in under 10 minutes, run `node --test tests/unit/scoring/irt/*.test.mjs` locally, and confirm ±0.001 logits parity against R 4.4.x + mirt 1.41.x golden vectors over ≥1,000 simulated patterns (with `set.seed(20260514)`, `quadpts=61`, `theta_lim=c(-6,6)`). `METHODOLOGY_CLAIMS.json` is populated with the engine's claims; `tests/golden/vectors.json` + `tests/golden/CHANGELOG.md` + `tests/golden/README.md` are committed. Innovation pillar #5 (no-build auditable IRT) is verifiable in ≤5 minutes with only `node` installed (per NFR26). The deterministic-build harness from Epic 1 supports byte-stable golden-vector regeneration. **Outreach for Gate Epics 9a–9e starts at Epic 2 completion** — the scoring spec is now frozen enough to send to ICAR/SAPA for license confirmation and to the external psychometrician for review.

**FRs covered:** FR14, FR15 (engine emission), FR16, FR17, FR44

### Epic 3: Vertical Slice — EN Happy-Path Score → Methodology Handoff + Contract Artifacts

A tester can complete an English-language session end-to-end on a build that is honestly minimal but contract-stable: landing → consent (with validity envelope and "Not today" path) → 16 ICAR-MR items (one at a time, keyboard-navigable, no time pressure, no telemetry) → pre-reveal "are you ready" beat → score panel (percentile + IQ-scale + uncertainty band, with a CSS-source-level co-equal triplet lint enforcing parity per Murat) → click from any number to a stub methodology page that defines it. This is the load-bearing UX hypothesis (PRD Journey 1: Anna's "aha" click) validated tester-testable before broader investment. **Critically, this epic ships three written contract artifacts that Epic 6 cannot renegotiate** (per John + Winston + Amelia): (a) `src/assessment/state.schema.json` + `tests/contract/state-shape.spec.mjs` — pinning the session-state shape so Epic 6's hardening is additive-only; (b) `docs/adr/iqme-reveal-stage-event-contract.md` — defining event names + ordering invariant + minimum payload for `iqme:reveal-stage` (Epic 6 expands beats but cannot rename or remove existing ones); (c) `docs/adr/methodology-handoff-url-contract.md` — defining the `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` URL pattern + click-target binding so Epic 4 cannot reinvent the scheme. Only 3 EN methodology stub pages exist (the click-targets behind percentile / IQ-scale / uncertainty band). The strict network-trace from Epic 1 is exercised against the live slice.

**FRs covered:** FR1, FR2, FR3, FR5, FR6, FR7, FR9, FR10, FR11, FR12, FR13, FR18 (initial CSS-source co-equal lint), FR21 (URL contract), FR23, FR26 (storage-empty first render), FR32 (3 stub pages)

### Epic 4: Methodology Corpus Build Pipeline + Versioned Citation Infrastructure

A citer (per PRD Journey 5 — Karolina) can resolve a stable versioned permalink (`/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` per the URL contract frozen in Epic 3), see a citation block (APA + Wikipedia-template) with the version and DOI pre-filled, and trust that CI mechanically enforces every claim-parity / frontmatter / glossary / reading-level / license-provenance invariant on every PR. Innovation pillar #2 (methodology-as-coupled-artifact) becomes mechanical: `tools/lint-claims-manifest.mjs` (already green from Epic 1) now blocks PRs where the scoring engine's `METHODOLOGY_CLAIMS.json` and the methodology pages' `asserts:` frontmatter disagree. The corpus build pipeline (`make build-methodology`) — vendored-marked OR hand-rolled subset markdown renderer (D1 decision deferred to implementation) — is the single author-time build step in the project, and its output IS the shipped artifact. Byte-stable build assertion via the deterministic-build harness from Epic 1. Per-corpus-release re-emit semantics established. Golden HTML snapshots at `tests/snapshots/methodology/`. `lint-translation-parity.mjs` ships as a no-op stub (per Amelia — there are no non-EN locales yet; full coverage in Epic 7). **Exit criterion** (per Winston): all linters demonstrated against both a corpus page and an SPA fragment — proves the parallelism claim for Epics 5/6.

**FRs covered:** FR28, FR29, FR30 (scheme + CITATION.cff), FR33 (corpus prose), FR34 (hatnote + stub lint), FR35 (masthead + frontmatter contract), FR43 (full populated manifest gate), FR48 (corpus lints)

### Epic 5: Methodology Visual System + Full English Methodology Corpus (30 Pages)

An English reader (including citers who never take the test) can navigate the complete methodology corpus at the plain-language reading level CI enforces. **Sequenced internally per Sally** — anchor pages first (5–8 pages chosen to anchor tone and lock the typographic / tonal system), then a content-freeze checkpoint, then the remaining 22–25 pages. The anchor-pages-frozen checkpoint is what unblocks Epic 6's content-coupled tests. The methodology-page-chrome CSS lives here (per Amelia's seam fix — these components render *into* methodology pages, not assessment surfaces): `masthead.css`, `lede.css`, `cite-this-page-widget.css`, `validity-envelope-diagram.css` + SVG (also reused in consent scene in Epic 6), `eap-shrinkage-diagram.css` + SVG (may slip to v1.0.1 per UX Phase 2), `tail-aware-trail.css` (may slip to v1.0.1 if budget tight), `stale-translation-hatnote.css`, `translation-in-progress-stub.css`, `version-mismatch-hatnote.css` (deferred per UX). All 30 pages per the PRD's Methodology Corpus Inventory exist in EN: Constructs (5), Scoring (6), Norming (3), Limitations (4), Ethics (3), Tail Scenes (2), Provenance (3), Reference (4). The FR36-protected "what this instrument does not measure" page is in place and lint-protected.

**FRs covered:** FR32 (full), FR36

### Epic 6: Assessment SPA Hardening — Full Ceremony, Asymmetric Tail-Scenes, Anti-Credentialization

A test-taker experiences the complete score-delivery ceremony designed in the UX spec. The `iqme:reveal-stage` event from Epic 3's ADR expands to its full 5-beat sequence (anchor → band → interval → context → tail-scene → methodology-handoff). The score-panel renders the co-equal triplet at Playwright-enforced ±15% bounding-box / 2px font-size / 4px baseline / 100-weight tolerance (graduating Epic 3's CSS-source lint to runtime computed-style assertion per Murat's two-tier-defense). Per-item-difficulty breakdown surfaces in a single declarative sentence. Mid-session bail-out offers explicit discard-or-continue choice. **Asymmetric tail-scenes render bottom-decile (Mikhail journey: harm-mitigation copy, crisis-resource link spatially privileged, silent-companion-line), mid-band, and top-decile (Daria journey: tear-edge overlay, anti-credentialization).** Bottom-decile and top-decile EN copy is a placeholder with `reviewer-of-record: TBD` (per Sally — the real clinical-register copy lands in Epic 7 alongside RU/PL, depending on Gates 9c/9d; EN placeholder exists so testers can exercise the structural surface and so Gate 9e can collect tester-credibility signal). EN crisis-resource list ships statically. The remaining assessment-SPA-only CSS components live here: `landing.css`, `consent-scene.css`, `progress-indicator.css`, `item-runner.css`, `score-panel.css`, `tail-scene-{top,mid,bottom}.css`, `silent-companion-line.css`, `locale-switch-blocker-hint.css`, `chrome-header.css`, `chrome-footer.css`, `theme-toggle.css`, `language-switcher.css`. The cropping fuzzer ships but is gated on an item-bank-frozen manifest flag (per Murat — avoids alert-fatigue from late content edits). `lint-no-role-alert` + `lint-no-share` (already enforced since Epic 1) continue to block regressions.

**FRs covered:** FR4, FR18 (full Playwright runtime assertion), FR19 (EN placeholder), FR20 (EN crisis list), FR22, FR24, FR25 (continues to enforce from Epic 1), FR26 (full opt-in save), FR27

### Epic 7: RU + PL Localization + Per-Language Reviewer Discipline

Russian- and Polish-speaking users (PRD's primary underserved audience per the brief and the Reddit-consensus reflex *"all online IQ tests are bullshit except Mensa Norway"*) can complete the full test in their language, read the full methodology corpus, and receive tail-scene copy authored in clinical register by a named reviewer-of-record — not translated from English. `lint-translation-parity.mjs` reaches full coverage. Block-level content-key parity is build-time enforced across all three locales. Non-EN content-key changes require maintainer + per-language-reviewer dual-approval via `CODEOWNERS` + `docs/branch-protection-config.md` (the config artifact lands here — the *process* of those reviewers' work is Gates 9c/9d). The `locale-switch-blocker-hint` teachable moment lands. `hreflang` declarations enable cross-language search-engine discoverability (Journey 5: Russian Wikipedia citation arrives later via this path). EN tail-scene placeholders from Epic 6 are replaced with native-clinical-register RU and PL copy from the Gate-9c/9d translators. RU + PL crisis-resource lists ship statically per language.

**FRs covered:** FR8, FR19 (RU/PL clinical-register copy), FR20 (RU/PL crisis lists), FR31, FR37, FR38, FR39, FR40 (artifact: CODEOWNERS + branch-protection-config), FR49

### Epic 8: Trust-Verification Surface + Mirror Failover + Archival Permanence

A skeptic verifies zero-third-party network trace in ≤30 seconds via browser DevTools — the full Playwright + CSP + viewport-overflow + Lighthouse + axe-core/pa11y suite is consolidated and enforces the invariant on every PR and the live deployment (the strict network-trace from Epic 1 is now joined by the full sister suite). Every tagged release auto-mirrors via `release.yml`: `app-v*` deploys to GitHub Pages canonical + byte-identical Codeberg/Cloudflare Pages mirror; `corpus-v*` deploys + mints a Zenodo DOI + archives to Internet Archive Save Page Now + Software Heritage `save` endpoint. `scheduled.yml` runs weekly mirror-parity (response-body check, headers exempted per `docs/scheduled-yml-failure-routing.md`) + archival-snapshot health checks and auto-opens labeled GitHub Issues on failure (no email/Slack per NFR6). The full `CONTRIBUTING.md` lands here (slim stub was Epic 1). `docs/branch-protection-config.md` + `docs/required-ci-checks.md` land here (per Amelia — they document gates that don't *exist* until now). Readers can subscribe to project updates only via GitHub Discussions + repo release notifications (no email signup). Per-release `CHANGELOG.md` credits contributors by GitHub handle with no external tracking.

**FRs covered:** FR30 (actual DOI minting), FR41 (full DevTools-verifiable surface), FR46, FR47, FR48 (full consolidation), FR52, FR53

---

> **Gate Epics 9a–9e (Mary's accountability-surface restoration):** Five independent stakeholder-outreach tracks. Each has a distinct stakeholder, distinct lead-time clock, distinct failure mode, and distinct mitigation playbook. **All five start at Epic 2 completion** (scoring spec frozen) and run in parallel through Epics 3–8 with the wall-clock bounded by the slowest external respondent. No code-write. Artifacts live under `docs/launch-readiness/`. Each gate-epic has one story.

### Epic 9a: ICAR License Confirmation (Gate)

The ICAR / SAPA project (William Revelle's group, Northwestern) provides written confirmation that public free-self-assessment redistribution of the ICAR Matrix Reasoning item pool is permitted under the published CC BY-NC-SA terms, with any noted constraints. The confirmation (PDF or signed-email export) commits to repo root as `ICAR-CONFIRMATION.pdf`, fulfilling the FR45 artifact slot established in Epic 1. **This is pre-launch gate #1 (Risk #1 in the PRD risk register — existential).** Outreach starts at Epic 2 completion; latency is high (academic email response times are unbounded). Fallback: launch with the explicitly-public OpenPsychometrics-licensed subset (smaller item pool, also documented in the methodology corpus).

**FRs covered:** FR45 (artifact arrival, fulfills slot from Epic 1)

### Epic 9b: External Psychometrician Sign-off (Gate)

An external psychometrician (volunteer or paid) reviews and signs off on (a) the methodology corpus (with particular attention to FR36-protected validity-envelope page and the EAP/uncertainty derivation per FR15), (b) the result-page copy (including the inline non-dismissible caveat per FR23 and tail-scene framing per FR19), and (c) the scoring spec freeze (the `METHODOLOGY_CLAIMS.json` ↔ methodology-page-`asserts:` coupling, the golden-vector regeneration runbook, and the no-cooldown discipline per FR27). Sign-off is documented in `docs/launch-readiness/psychometrician-signoff.md` with name + handle + date + scope. Risks #11 + I5 (the auditable-IRT claim attracting adversarial inspection — explicitly desired per innovation-risk register). Mitigation: pre-launch outreach to identifiable candidates (Revelle group, individual-differences course instructors); paid review budgeted ($500–$2000) as fallback. **Probability 30–50% that this surfaces methodology corpus revisions** (per Murat) — reserve 1–2 weeks buffer.

**FRs covered:** (process gate — surfaces revisions to Epic 5 corpus / Epic 6 result-page if reviewer flags)

### Epic 9c: RU Clinical-Register Translator (Gate)

A Russian-language clinical-register translator (bilingual psychometrically-aware Russian native, ideally a working translator or clinical psychologist) authors and reviews the Russian-language tail-scene copy for bottom-decile harm-mitigation (Mikhail's scene), mid-band, and top-decile anti-credentialization (Daria's scene). The copy is authored in clinical register *in Russian*, not translated from English. The translator is also reviewer-of-record for the Russian methodology corpus through v1. Their name + GitHub handle + sign-off date are committed to `CODEOWNERS` and surfaced in the masthead frontmatter (`reviewer:` + `reviewerHandle:`). Risks #5 (bottom-decile harm) + I3 (paternalistic register in Russian — particularly hard to calibrate). Mitigation: community outreach via r/cognitiveTesting Russian-speakers + psychology academic networks; paid as fallback ($300–$800).

**FRs covered:** FR19 (RU process), FR20 (RU process), FR40 (RU process)

### Epic 9d: PL Clinical-Register Translator (Gate)

Same posture as Gate 9c, for Polish. A Polish-language clinical-register translator (bilingual psychometrically-aware Polish native, e.g. a working translator with a degree in Polish philology or a clinical psychologist) authors and reviews Polish-language tail-scene copy + methodology corpus translation. Reviewer-of-record committed to `CODEOWNERS` + masthead. **Independent failure isolation from Gate 9c** (per Mary): if PL reviewer ghosts and RU lands clean, that is a binary launch-blocker in PL and zero blocker in RU — five separate gate-epics make that asymmetry visible. Risks #5 + I7 (tri-lingual measurement-equivalence translation drift).

**FRs covered:** FR19 (PL process), FR20 (PL process), FR40 (PL process)

### Epic 9e: 12-of-15 Native-Speaker Tester Credibility (Gate)

A cohort of 5 native-speaker testers per language (5 × EN/RU/PL = 15 total) completes the test on a representative pre-launch build and reports on a GitHub Discussions thread whether the test felt honest and the result felt credible — with the launch-gate threshold being **≥12 of 15** overall AND **≥4 of 5 per language** (no single-language credibility failure can be masked by aggregation). Testers span the four user archetypes: Anna (mid-band), Mikhail (bottom-decile potential), Daria (top-decile potential), Tomáš (skeptic). Recruitment begins at Epic 6 testable-build-ready and intensifies at Epic 7 full-locale-build. Iterate copy on tester feedback until threshold met; do not ship below threshold even if v1 launch slips. Risk #12 (credibility threshold not met → kills launch). PRD's "the result feels honest" gate.

**FRs covered:** (process gate — surfaces revisions to Epics 6/7 result-page / corpus / tail-scenes if feedback warrants)

---

### Epic 10: v1.0.0 Coordinated Release

All eight dev epics merge to main. All five gates close (`ICAR-CONFIRMATION.pdf` committed; psychometrician sign-off in `docs/launch-readiness/`; RU + PL reviewer-of-record names in CODEOWNERS + masthead; 12-of-15 tester credibility report in `docs/launch-readiness/`). Coordinated `app-v1.0.0` + `corpus-v1.0.0` double-tag fires `release.yml` from Epic 8 — deploys to GitHub Pages canonical + Codeberg/Cloudflare mirror, mints the v1.0.0 Zenodo DOI, archives to Internet Archive Save Page Now + Software Heritage. Release announcement posts to GitHub Discussions (no email blast, no PR pitch, no telemetry — per the project's structural posture). Repository is *as-described* on launch day: zero analytics on the wire, zero third-party fetches, no signup, source matching `main`, LICENSES.md unmodified. The no-enshittification audit clock starts at this moment.

**FRs covered:** (milestone — closes the project)

---

## Epic 1: Repo Trust Artifacts + CI Skeleton + Negative-Assertion Lints

A skeptic (per PRD Journey 4 — Tomáš) can clone the repository at its very first commit and see the full trust posture mechanically enforced: trust artifacts (LICENSES, CITATION, README forking-ethics, ICAR slot with visible fallback), the full CI job-matrix scaffold with strict network-trace and all negative-assertion lints already green on the empty-repo state, cognitive-load budgets enforced by lint, and the deterministic-build harness in place for Epic 2's golden vectors. No scoring code. No SPA. No methodology content. Just the verifiable trust surface and the CI gates that police everything that follows.

### Story 1.1: Bootstrap repo skeleton + Makefile

As a **solo-dev maintainer (CEP)**,
I want **the project's runtime-zero-build scaffolding to exist as a Makefile-driven repository**,
So that **every subsequent epic has a `make test` / `make lint` / `make build` target to wire into and no contributor needs to learn project-specific tooling conventions from scratch**.

**Acceptance Criteria:**

**Given** the repository is at its first commit,
**When** a developer runs `make help`,
**Then** the output lists `test`, `lint`, `build`, `build-methodology`, `dev`, `clean`, `snapshot-update` as documented targets
**And** each target's one-line description matches the convention in `docs/corpus-build-conventions.md`.

**Given** the repository is freshly cloned,
**When** a developer runs `make lint && make test`,
**Then** both commands exit 0 against an empty source tree
**And** no errors related to missing tools or dependencies are emitted (`npx --yes` resolves dev-tools on demand per NFR33).

**Given** the deployment posture requires byte-identical mirror builds (NFR17),
**When** the `Makefile` is inspected,
**Then** no absolute paths or environment-specific assumptions exist
**And** all referenced tools are documented in either `vendor/` (with SHA pin) or invoked via `npx --yes`.

### Story 1.2: Author LICENSES.md + CITATION.cff + README forking-ethics + slim CONTRIBUTING.md + CODEOWNERS

As a **skeptic (Tomáš journey) arriving from a Hacker News submission**,
I want **to see the project's licensing, citation, forking-ethics, and contribution posture in the repository root within 60 seconds**,
So that **I can verify the trust-through-transparency claim without loading the live site or asking the maintainer questions**.

**Acceptance Criteria:**

**Given** I land on the repository root on GitHub,
**When** I read `LICENSES.md`,
**Then** the file enumerates: app code under MIT, item pool under CC-BY-NC-SA (or ICAR-author-specified), translated content + methodology corpus under CC-BY-NC-SA, with explicit attribution strings per shipped item file (FR50, NFR24, NFR34)
**And** `LICENSES.md` carries a `last-modified-hash` field in a comment that the license-provenance lint reads (NFR24).

**Given** I am a Wikipedia editor preparing an external-link citation (Karolina journey),
**When** I open `CITATION.cff`,
**Then** the file is YAML-valid per the CFF v1.2.0 schema with `title`, `authors`, `version: 0.0.1`, `date-released`, and `doi` (empty at v0.0.1; populated by `release.yml` in Epic 8)
**And** the citation widget in Epic 4 will be able to render this file without parsing errors.

**Given** I am a forker considering removing the caveats and adding ads,
**When** I read the `README.md`,
**Then** a clearly-titled "Forking ethics" section asks me to preserve the caveats and methodology corpus while acknowledging this is a request, not enforceable under MIT (FR51, NFR11)
**And** the README's first 200 words establish the project's no-telemetry / no-signup / source-on-GitHub claims.

**Given** future contributors will submit PRs,
**When** they open `CONTRIBUTING.md`,
**Then** it contains a stub explaining the slim-at-Epic-1, full-in-Epic-8 timing
**And** points to `CODEOWNERS` for the eventual reviewer-of-record discipline.

**Given** the per-language reviewer-of-record discipline (FR49, NFR29) will be enforced via branch protection in Epic 7,
**When** the `.github/CODEOWNERS` file is inspected,
**Then** it contains an entry mapping `src/content/methodology/ru/**` and `src/content/i18n/ru/**` to a placeholder reviewer (commented `@TBD-ru-reviewer` per the Gate 9c outreach process)
**And** the same posture exists for PL.

### Story 1.3: Commit ICAR-CONFIRMATION.pdf slot with visible-fallback copy

As a **skeptic (Tomáš journey) verifying license-chain integrity**,
I want **the ICAR license confirmation artifact slot to exist in the repository root with a visible-fallback explanation rather than a silent null**,
So that **I know the gate's status at a glance and the affordance isn't broken-looking while Gate 9a's outreach runs**.

**Acceptance Criteria:**

**Given** Gate 9a's outreach is in flight,
**When** the repository root contains an `ICAR-CONFIRMATION.pdf` slot,
**Then** the slot is fulfilled by a one-page PDF titled "ICAR License Confirmation — Pending"
**And** the PDF body states: "Pre-launch gate #1: the ICAR / SAPA project has been contacted for written confirmation that public free-self-assessment redistribution is permitted under CC BY-NC-SA. This page is replaced by the actual signed confirmation when it arrives. See `/methodology/v0.0.1/en/provenance/icar-license/` for current status."

**Given** the README points at this artifact,
**When** I follow the link to `ICAR-CONFIRMATION.pdf` from the README's license section,
**Then** the linked PDF resolves to either the pending stub OR (post-Gate-9a) the real confirmation
**And** the `lint-trust-artifacts.mjs` lint asserts the file exists (regardless of which version).

**Given** the methodology page at `/provenance/icar-license/` does not yet exist (Epic 5 lands it),
**When** I follow the link to it,
**Then** the link resolves to a temporary stub during Epics 1-4 that points back to the slot PDF
**And** Epic 5 replaces this stub with the real methodology page (the slot PDF and methodology page reference each other bidirectionally from launch).

### Story 1.4: Commit corpus schema set + docs/corpus-build-conventions.md

As a **AI agent or human contributor authoring methodology content (anticipated in Epic 5)**,
I want **the methodology corpus's frontmatter contract, markdown subset, and authoring conventions to be documented and schema-validated from day 1**,
So that **content authoring follows a single source of truth, the claims-manifest lint has a schema to validate against, and Epic 5's content work doesn't reinvent conventions**.

**Acceptance Criteria:**

**Given** the corpus build pipeline lands in Epic 4,
**When** the repository at end-of-Epic-1 contains `corpus/schema.json`,
**Then** it is valid JSON Schema 2020-12 defining required frontmatter fields: `title`, `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `asserts[]`, `glossaryRefs[]`, `sourceHashEN` (per NFR27, NFR29)
**And** the schema permits the optional `protected: true` flag for FR36-protected pages.

**Given** the markdown renderer decision (D1) is deferred to implementation in Epic 4,
**When** `corpus/markdown-subset-v1.md` is inspected,
**Then** it enumerates the declared markdown subset: headings, paragraphs, emphasis, code fences, links, ordered/unordered lists capped at depth 2 (no HTML passthrough, no autolinks)
**And** the document is itself written in that subset.

**Given** the methodology-claims manifest schema is needed by `lint-claims-manifest.mjs`,
**When** `corpus/methodology-claims-v1.schema.json` is inspected,
**Then** it defines the shape of `METHODOLOGY_CLAIMS.json` entries with at minimum: `claim-id`, `engine-source` (e.g. `src/scoring/irt/eap.js`), `methodology-path` (the corpus page declaring the matching `assert`), `value-or-formula` field (NFR23, FR43).

**Given** Story 6.6's cropping-fuzzer gate (per Murat's bank-frozen-flag discipline) requires a manifest contract,
**When** `corpus/manifest.schema.json` is inspected,
**Then** it defines `bankFrozen: { type: boolean, default: false }` along with related manifest fields (item-bank version pin, locked-at-corpus-version)
**And** `lint-frontmatter` (Story 4.3) validates `corpus/manifest.json` against this schema.

**Given** the corpus build pipeline must be cross-AI-agent-coherent (per architecture),
**When** an AI agent or contributor opens `docs/corpus-build-conventions.md`,
**Then** the document explains: per-corpus-release re-emit semantics (NFR25), block-level content-key parity (NFR27), the EN-source-hash rule for RU/PL frontmatter, the glossary-first writing rule (NFR30), the style invariants (NFR31 — no idioms, sentence-length caps)
**And** the document explicitly notes which pipeline pieces land in Epic 4 vs Epic 5 (so an agent doesn't try to invoke not-yet-implemented tooling).

### Story 1.5: Commit BUDGETS.json + lint-cognitive-load-budget.mjs

As a **solo-dev maintainer (CEP) protecting NFR32-NFR35 from contributor pressure**,
I want **the project's cognitive-load budgets to be machine-enforced from commit #1**,
So that **any future PR that materially exceeds a budget (e.g. scoring engine LOC, CSS total, methodology-page count) fails CI and forces an explicit budget conversation rather than drift**.

**Acceptance Criteria:**

**Given** the architecture pins ~250 LOC scoring, ~30 KB app modules, ~15 KB i18n harness, ~1500 LOC CSS, ~30 methodology pages/locale (NFR32),
**When** `BUDGETS.json` is inspected,
**Then** it contains those budgets keyed by domain (e.g. `"src/scoring/irt": { "lines": 250 }`, `"src/css/components": { "lines": 1500 }`, `"src/content/methodology/en": { "files": 30 }`)
**And** each entry carries a `rationale` field linking to the relevant NFR.

**Given** `BUDGETS.json` exists,
**When** the repository is empty (no scoring code, no CSS, no methodology pages),
**Then** `tools/lint-cognitive-load-budget.mjs` exits 0 (every budget reads as 0/limit, which is within budget)
**And** the lint emits a friendly summary line per budget showing current/limit even in green state.

**Given** a hypothetical future PR adds a 3000-LOC dependency,
**When** `tools/lint-cognitive-load-budget.mjs` runs in CI,
**Then** it exits non-zero with a clear error pointing at the offending budget entry and the proposed-exceeding value
**And** the lint output includes the rationale link so the contributor sees *why* the budget exists.

### Story 1.6: Author CI matrix YAML with full future-lint stub jobs

As a **solo-dev maintainer (CEP) avoiding per-epic CI-config drift**,
I want **the full `.github/workflows/pr-checks.yml` job matrix to exist at end-of-Epic-1 with every future lint as a stub job (initially `if: false` or `continue-on-error: true`)**,
So that **subsequent epics flip a stub job from inactive to active by editing one line, never by adding a new job (per Murat's fixture-architecture-first applied to CI)**.

**Acceptance Criteria:**

**Given** `.github/workflows/pr-checks.yml` is inspected,
**When** the job list is enumerated,
**Then** every future lint has a corresponding job entry: `lint-claims-manifest`, `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent`, `lint-cognitive-load-budget`, `lint-frontmatter`, `lint-glossary`, `lint-reading-level`, `lint-translation-parity`, `lint-license-provenance`, `lint-css-link-order`, `lint-fr36-protection`, `golden-vector-parity`, `byte-stable-build`, `network-trace`, `viewport-overflow`, `co-equal-triplet-computed-style`, `co-equal-triplet-css-source`, `cropping-fuzzer`, `lighthouse`, `axe-core-pa11y`, `reveal-stage-event-ordering`, `csp-violation-count`, `state-shape-contract`.

**Given** the negative-assertion lints are project-identity-defining (per Murat — `lint-no-share`, `lint-no-role-alert`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-no-localStorage-without-consent` all reject things that must NEVER appear),
**When** these lints are implemented in Epic 1,
**Then** all are ~20-line regex/AST checks, all are active (not stubbed) from commit #1, and all are green on the empty repo state
**And** they fail the build immediately if any subsequent epic introduces a forbidden pattern (`role="alert"` on permanent informational text, `navigator.share()` call, cookie-banner DOM, analytics SDK reference, external font import, automatic localStorage write).

**Given** most future lints are not yet implemented at end-of-Epic-1,
**When** a PR is opened against the empty repo state,
**Then** the jobs corresponding to lints implemented in Epic 1 (claims-manifest, trust-artifacts, no-role-alert, no-share, cognitive-load-budget, network-trace) run and pass
**And** all other jobs are conditionally skipped via `if: false` with a comment `# Activates in Epic <N>` pointing at the responsible epic.

**Given** the v1 workflow set per architecture is 3 files (pr-checks.yml + release.yml + scheduled.yml),
**When** `.github/workflows/` is listed at end-of-Epic-1,
**Then** `release.yml` and `scheduled.yml` exist as stubs with a single `echo "Activates in Epic 8"` step
**And** the orchestration architecture (decoupled `app-v*` + `corpus-v*` tag namespaces, scheduled-check failure → labeled GitHub Issue routing) is commented inline as a non-functional placeholder.

### Story 1.7: Implement Playwright network-trace infrastructure with STRICT zero-third-party assertion from day 1

As a **skeptic (Tomáš journey) verifying the zero-telemetry claim**,
I want **the Playwright network-trace infrastructure to ship at full strictness from day 1 — not "initial then tighten" (per Murat)**,
So that **no third-party-leak regression can sneak in during Epics 2-7 only to be discovered painfully in Epic 8 (40-55% probability over 6 months per Murat's risk calculation)**.

**Acceptance Criteria:**

**Given** the Playwright dev dependency is installed via `npx --yes` (NFR33),
**When** `tests/playwright/network-trace.spec.mjs` is inspected,
**Then** it loads the canonical entry point of the deployed artifact, records the full HAR trace via Playwright's `route` + `request` events, and asserts: zero non-same-origin requests, no requests to domains in a forbidden-domain set (Google Fonts, jsDelivr, Plausible, GoatCounter, Sentry, etc.), no `Math.random` references in scoring/selection paths (cross-cuts via grep — but lint-handled separately).

**Given** Epic 1 has no SPA yet (Epic 3 ships the vertical slice),
**When** the network-trace spec runs against the end-of-Epic-1 repo state,
**Then** it executes against a minimal `tests/fixtures/network-trace-baseline.html` that imports nothing and asserts the strict invariant passes (proves the *infrastructure* works)
**And** when Epic 3 lands the vertical slice, the same spec executes against the slice with no allowlist-relaxation.

**Given** the test must run on every PR (NFR6 Playwright assertion),
**When** the `pr-checks.yml` `network-trace` job runs,
**Then** it sets up Playwright headless Chromium + Firefox + WebKit via `npx playwright install --with-deps`, runs the spec, and fails the build on any allowed-domain-list violation
**And** the failure message names the specific domain + URL that violated the invariant.

### Story 1.8: Ship deterministic-build harness ready for Epic 2's golden vectors

As a **AI agent or solo-dev building Epic 2's golden-vector parity test**,
I want **the deterministic-build harness (frozen timestamps, sorted file ordering, locale-independent hashing) to exist at end-of-Epic-1 (per Murat — golden vectors already require deterministic numerical output, so the 80%-shared harness should be hoisted)**,
So that **Epic 2 can land golden-vector regeneration with a known-good determinism foundation, and Epic 4's byte-stable build assertion can build on the same harness rather than reinventing it**.

**Acceptance Criteria:**

**Given** the deterministic-build harness is at `tools/determinism-harness.mjs`,
**When** the harness is invoked with `make build`,
**Then** every emitted file in `dist/` has a frozen timestamp (e.g. `1970-01-01T00:00:00Z` or the corresponding `SOURCE_DATE_EPOCH`-equivalent)
**And** file ordering in any walked directory is sorted lexicographically (no FS-dependent traversal order)
**And** every hash computation uses `C.UTF-8` locale.

**Given** the harness will support golden-vector regeneration in Epic 2,
**When** `make build` is run on an empty source tree at end-of-Epic-1,
**Then** the harness emits a deterministic empty-build marker (e.g. `dist/.build-determinism-check.json` containing the SHA256 of the empty dist tree)
**And** running `make clean && make build` twice produces byte-identical `dist/` trees (verified by `tests/playwright/byte-stable.spec.mjs` stub — full assertion activates in Epic 4).

**Given** the R + mirt 1.41.x golden-vector regeneration pipeline (architecturally pinned at `quadpts=61, theta_lim=c(-6,6), set.seed(20260514)`) lands in Epic 2,
**When** Epic 2 invokes the determinism harness,
**Then** the harness exposes the seed pinning + quadrature pinning as constants the Epic 2 R-bridge can consume
**And** `tests/golden/README.md` (authored in Epic 2) can reference the harness as the canonical determinism contract.

### Story 1.9: ESLint config + no-restricted-paths + docs/domain-map.md

As a **future contributor or AI agent working within the five-domain boundary model**,
I want **the `.eslintrc.json` (or `eslint.config.js`) configured with `no-restricted-paths` enforcing the A-SPA / B-Scoring / C-Content / D-Tools / E-Test-Fixtures boundaries, plus `docs/domain-map.md` enumerating which paths belong to which domain**,
So that **the architecture's domain-boundary discipline is mechanically enforced from commit #1 (per Winston — "infrastructure, not lint feature") rather than discovered the day someone adds a cross-domain import**.

**Acceptance Criteria:**

**Given** the five-domain boundary model per architecture,
**When** `.eslintrc.json` is committed,
**Then** it contains a `no-restricted-paths` rule with zones mapping: `src/assessment/**` (domain A — SPA), `src/scoring/**` (domain B — Scoring, importable from A but not vice-versa), `src/content/**` (domain C — Content, read-only from A and D), `tools/**` (domain D — Tools, may write to E only via `make snapshot-update`), `tests/**` (domain E — Test Fixtures)
**And** the single codified D→E exception is the `make snapshot-update` target's path; all other cross-domain writes fail lint.

**Given** the domain map must be human-readable,
**When** `docs/domain-map.md` is committed,
**Then** it enumerates every path under `src/` and `tools/` and `tests/` with its domain assignment and rationale
**And** the document is the single source of truth that `.eslintrc.json` mechanizes.

**Given** the ESLint config must also enforce the negative-assertion lints from Story 1.6 are wired,
**When** `eslint --max-warnings 0` runs against the empty-repo source tree,
**Then** it passes (no violations)
**And** the `pr-checks.yml` `eslint` job is active from Epic 1.

### Story 1.10: Design System Foundation — primitives.css + semantic.css + dark-mode overrides + tokens.spec.ts

As a **future Epic 3 / 5 / 6 / 7 author rendering UI components**,
I want **the two-layer CSS token architecture (UX-DR1), color palette (UX-DR2), Major-Third type scale (UX-DR3), 8px spacing scale (UX-DR4), responsive breakpoints (UX-DR5), and dark-mode overrides (UX-DR6) to be authored and locked at end-of-Epic-1 BEFORE any component CSS lands in Epic 3**,
So that **components consume tokens (not reverse-engineer them from happy-path needs per Sally's load-bearing finding) and Mikhail's tail-scene in Epic 6 doesn't discover the semantic palette has no `--color-care-warm` because nobody knew to pin it**.

**Acceptance Criteria:**

**Given** UX-DR1 specifies two-layer architecture,
**When** `src/css/primitives.css` is inspected,
**Then** it defines all UX-DR2 color primitives (`--color-neutral-0` through `-1000`, `--color-accent-300/500/700`, `--color-attention-300/500/700`), UX-DR3 type-scale primitives (`--font-size-100` through `-800`), UX-DR4 spacing primitives (`--space-1` through `-9`), and UX-DR5 breakpoint custom-media declarations (`--bp-tablet`, `--bp-desktop`)
**And** all values match the UX spec's pinned palette (the v1 starting palette per UX §Color System).

**Given** UX-DR1 specifies semantic.css as the role-mapped layer,
**When** `src/css/semantic.css` is inspected,
**Then** it maps primitives to roles per the UX spec's semantic mapping (`--color-text-body`, `--color-text-muted`, `--color-text-link`, `--color-text-link-hover`, `--color-surface-base`, `--color-surface-elevated`, `--color-rule-divider`, `--color-focus-ring`, `--color-text-attention-body`, etc.) and includes the semantic spacing tokens (`--space-prose-paragraph-gap`, `--space-section-gap`, `--space-score-triplet-gap`, etc.)
**And** the file uses CSS Custom Properties only — no preprocessor (NFR21).

**Given** UX-DR6 specifies dark mode as a separately-designed palette,
**When** the dark-mode override block in `semantic.css` is inspected,
**Then** it carries `[data-theme="dark"]` + `@media (prefers-color-scheme: dark)` selectors with re-mapped roles (per UX spec: `--color-text-body: var(--color-neutral-100)`, `--color-surface-base: var(--color-neutral-900)`, etc.)
**And** axe-core / pa11y verify WCAG 2.2 AA contrast in both themes against a fixture page.

**Given** the token contract must not drift silently,
**When** `tests/contract/tokens.spec.mjs` is implemented,
**Then** it computes the SHA256 hash of `primitives.css` + `semantic.css` at HEAD, compares to a committed `tests/snapshots/tokens.hash.json`, and fails the build if drift is unintended
**And** drift updates require regenerating the snapshot via `make snapshot-update` (the codified D→E exception from Story 1.9).

**Given** Story 3.3 will land `landing.css` + `consent-scene.css` consuming these tokens,
**When** any Epic 3+ component CSS file is inspected,
**Then** it imports `semantic.css` at the top (or relies on cascade from `<link>` order) and uses ONLY semantic tokens (never primitive tokens directly)
**And** a `lint-component-token-discipline.mjs` (vendored as a future-stub for now; activated when Epic 3 lands components) enforces this.

---

## Epic 2: Auditable Scoring Engine + Golden Vectors

A skeptic can read the entire IRT 2PL EAP implementation in ≤10 minutes, run the golden-vector parity tests locally in ≤5 minutes with only `node` installed, and confirm ±0.001 logits parity against R 4.4.x + mirt 1.41.x. Outreach for Gate Epics 9a–9e unblocks at this epic's completion.

### Story 2.1: Scaffold src/scoring/irt/ module + write red-phase parity test

As a **TDD-disciplined solo-dev**,
I want **the scoring module's directory structure and a failing red-phase parity test to exist before any implementation lands**,
So that **every subsequent scoring story is implemented green-against-test rather than retrofitted with tests after the fact (per Amelia's red-green-refactor discipline)**.

**Acceptance Criteria:**

**Given** Epic 1's deterministic-build harness is available,
**When** `src/scoring/irt/` is created,
**Then** the directory contains stub files `quadrature.js`, `likelihood.js`, `eap.js`, `se.js`, `index.js`, each exporting a single named function that throws `TypeError("Not implemented")` (no `NaN`, no error objects per architecture convention).

**Given** the red-phase test must fail before any implementation lands,
**When** `tests/unit/scoring/irt/parity.test.mjs` is inspected,
**Then** it imports `scoreSession` from `src/scoring/irt/index.js`, loads a tiny fixture (5–10 hand-verified response patterns with expected θ + SE values), invokes the scoring engine, and asserts each output is within ±0.001 logits of the expected value
**And** running `make test` exits non-zero with a clear "TypeError: Not implemented" trace pointing at the stub.

**Given** the unit-test harness must use `node --test` (no third-party test framework per NFR33),
**When** the test file is inspected,
**Then** it uses only `node:test` and `node:assert/strict` imports
**And** the test runs in <1 second on a developer laptop.

### Story 2.2: Implement quadrature.js + likelihood.js (pure math primitives)

As a **solo-dev building toward EAP estimation**,
I want **the Gauss-Hermite-equivalent quadrature grid and the 2PL item-response likelihood function to exist as pure, independently testable functions**,
So that **EAP estimation in the next story can be expressed as a numerical integration over these primitives, and an external auditor can verify the math piece-by-piece**.

**Acceptance Criteria:**

**Given** the architecture pins `quadpts=61, theta_lim=c(-6,6)`,
**When** `quadrature.js` exports `gridPoints(quadpts = 61, thetaLim = [-6, 6])`,
**Then** the function returns an array of 61 evenly-spaced theta values in [-6, 6] paired with their normal prior densities (or Gauss-Hermite weights — the choice is documented in `/methodology/scoring/eap/`)
**And** the function is deterministic, pure, throws `RangeError` on invalid input, and has unit tests verifying grid spacing + weight normalization.

**Given** the 2PL item-response model is canonical (P(correct | θ, a, b) = 1 / (1 + exp(-a(θ - b)))),
**When** `likelihood.js` exports `itemLikelihood(theta, a, b, response)`,
**Then** the function returns the probability of the observed response given θ and item parameters (a discrimination, b difficulty), `response ∈ {0, 1}`
**And** unit tests cover: monotonicity in θ, symmetry at θ=b, asymptotic behavior at θ=±∞, and `RangeError` on non-binary response.

**Given** both primitives must support the full likelihood across a response pattern,
**When** `likelihood.js` exports `patternLogLikelihood(theta, items, responses)` where `items` is the item-parameter array and `responses` is the binary response vector,
**Then** the function returns the sum of log-likelihoods across all items at the given θ
**And** unit tests verify additivity, numerical stability for extreme θ, and consistency with single-item `itemLikelihood`.

### Story 2.3: Implement eap.js (EAP estimation)

As a **solo-dev building the central scoring computation**,
I want **EAP (Expected A Posteriori) estimation to exist as a single pure function that integrates the likelihood × prior over the quadrature grid**,
So that **the scoring claim "IRT 2PL EAP, ~250 LOC, validated against R mirt to ±0.001 logits" becomes verifiable**.

**Acceptance Criteria:**

**Given** quadrature.js and likelihood.js are implemented,
**When** `eap.js` exports `estimateTheta(items, responses, options = { quadpts: 61, thetaLim: [-6, 6] })`,
**Then** the function returns the EAP θ estimate as a Number, computed as the posterior-weighted mean: ∑_i θ_i · L(θ_i | responses) · π(θ_i) / ∑_i L(θ_i | responses) · π(θ_i)
**And** the function has no DOM imports, no global state, no async, no `Math.random` (NFR10).

**Given** the parity test from Story 2.1 fails until this story lands,
**When** the implementation is complete,
**Then** the parity test passes for the 5–10 hand-verified fixture patterns at ±0.001 logits
**And** unit tests cover: all-correct pattern (θ near +6), all-wrong pattern (θ near -6), mixed pattern (θ near 0), single-item edge cases.

**Given** the EAP estimator must handle the all-correct / all-wrong patterns gracefully (per architecture: "EAP is chosen over MLE specifically because it has no convergence loop and handles all-correct / all-wrong patterns gracefully"),
**When** the function is invoked with an all-correct response pattern,
**Then** it returns a θ near +6 (bounded by `thetaLim`) without throwing
**And** documentation in `/methodology/scoring/eap/` (Epic 5) will explain why EAP shrinks toward the prior at the tails.

### Story 2.4: Implement se.js (standard error from posterior variance)

As a **skeptic verifying the uncertainty-band claim (FR15)**,
I want **the standard error of the EAP estimate to be computed from the posterior variance, separately from the EAP estimate itself**,
So that **the uncertainty band shown to users (Epic 6's score-panel) is anchored in the published mathematics rather than a fudge factor**.

**Acceptance Criteria:**

**Given** eap.js is implemented,
**When** `se.js` exports `posteriorSE(items, responses, options = { quadpts: 61, thetaLim: [-6, 6] })`,
**Then** the function returns the posterior SE as a Number, computed as √(∑_i (θ_i - θ_EAP)² · L_i · π_i / ∑_i L_i · π_i)
**And** unit tests verify: SE decreases monotonically with number of items (information accumulates), SE is bounded above by the prior SD, SE is bounded below by 0.

**Given** FR15 requires SE_total = √(SEM² + SE_norming²) for the displayed uncertainty band,
**When** `se.js` also exports `combinedSE(sem, seNorming)`,
**Then** the function returns the root-sum-square combination
**And** documentation in `/methodology/scoring/uncertainty/` (Epic 5) explains the SE_norming derivation from the ICAR-published SAPA-norming-sample mean.

### Story 2.5: Public API in src/scoring/irt/index.js (scoreSession facade)

As a **caller from the assessment SPA (Epic 3 vertical slice)**,
I want **a single public entry point `scoreSession(responses, items, options)` that returns the complete scoring artifact in one call**,
So that **the SPA result page consumes one stable contract rather than orchestrating quadrature + likelihood + eap + se itself**.

**Acceptance Criteria:**

**Given** Stories 2.1–2.4 are complete,
**When** `src/scoring/irt/index.js` exports `scoreSession(responses, items, options = { quadpts: 61, thetaLim: [-6, 6], seNorming: <value-from-NORMING_CONSTANTS> })`,
**Then** the function returns an object: `{ theta, sem, seTotal, percentile, iqScale, uncertaintyBand: { percentileLow, percentileHigh, iqScaleLow, iqScaleHigh } }`
**And** the percentile is derived from θ via the standard-normal CDF; iqScale = round(100 + 15·θ); uncertaintyBand uses point estimate ± 1.96 · seTotal (FR15).

**Given** Epic 3's `state.schema.json` will pin the consumed shape,
**When** the schema exists in Epic 3,
**Then** the `scoreSession` return value validates against it
**And** changes to the return shape require a coordinated PR touching both schema + scoring index + Epic 3's contract test.

**Given** the engine must be deterministic (FR16, NFR10),
**When** `scoreSession` is invoked twice with identical inputs,
**Then** the two outputs are byte-identical
**And** a unit test asserts this.

### Story 2.6a: R-in-CI harness + smoke golden vector set (n=10)

As a **AI agent or maintainer implementing the JS scoring engine (Stories 2.1–2.5)**,
I want **a working R-in-CI harness that can generate a small smoke golden-vector set (n=10) BEFORE the full ≥1,000-pattern set lands (per Amelia — Story 2.1's red-phase needs a real fixture to test against)**,
So that **the scoring engine has a real parity-check target from Story 2.2 onward and the R-in-CI tooling is validated separately from the volume of vectors**.

**Acceptance Criteria:**

**Given** R + mirt 1.41.x is not a JS dependency (and GitHub Actions runners don't ship it by default),
**When** `.github/workflows/golden-regen.yml` is implemented,
**Then** it uses `r-lib/actions/setup-r@v2` with `r-version: "4.4.x"` + `r-lib/actions/setup-r-dependencies@v2` to install mirt 1.41.x with cache hits between runs
**And** the workflow is manually-dispatch-triggered (not on every PR — too slow); a `regen-goldens` label-triggered alternative is documented.

**Given** Story 2.1's red-phase parity test needs a real fixture,
**When** `tests/golden/regenerate.R` is committed,
**Then** it generates n=10 simulated response patterns with the pinned setup (`mirt::fscores(method="EAP", quadpts=61, theta_lim=c(-6,6))`, `set.seed(20260514)`)
**And** the smoke set commits to `tests/golden/vectors-smoke.json`; Story 2.1's parity test points at this file (not the full set, which lands in 2.6b).

**Given** the determinism harness from Story 1.8 supports this,
**When** the smoke set is regenerated locally and in CI,
**Then** both produce a byte-identical `vectors-smoke.json`
**And** the byte-stable invariant (extended in Story 4.2) holds.

### Story 2.6b: Full ≥1,000-pattern golden vector set + CI parity wiring

As a **skeptic running `make test` to verify the parity claim (Tomáš journey)**,
I want **≥1,000 simulated response patterns with their R-mirt-computed θ and SE values committed to the repository, with the full parity assertion wired into `pr-checks.yml`**,
So that **I can independently regenerate them (with the pinned seed) and confirm the JS engine matches to ±0.001 logits without trusting the maintainer's word — and any future PR that regresses parity fails the build**.

**Acceptance Criteria:**

**Given** the architecture pins R 4.4.x + mirt 1.41.x with `set.seed(20260514)` (NFR22),
**When** `tests/golden/vectors.json` is inspected,
**Then** it contains ≥1,000 entries: each `{ responses: [...], itemParams: [...], expectedTheta: <num>, expectedSE: <num> }`
**And** the file is valid JSON, sorted lexicographically by an entry hash for byte-stable diffing.

**Given** the regeneration must be reproducible by any third party (NFR22),
**When** `tests/golden/README.md` is inspected,
**Then** it documents: R version pin, mirt version pin, `set.seed(20260514)`, `quadpts=61`, `theta_lim=c(-6,6)`, the exact R script used (`tests/golden/regenerate.R`), and the expected SHA256 of `vectors.json` after regeneration
**And** a third party can run `Rscript tests/golden/regenerate.R` and get a byte-identical `vectors.json`.

**Given** changes to the pinned reference implementation require explicit review,
**When** `tests/golden/CHANGELOG.md` is inspected,
**Then** it carries an initial v1 entry naming the pinned versions and any tolerance-impact notes
**And** the file is referenced from `/methodology/scoring/golden-vectors/` (Epic 5).

**Given** the parity test from Story 2.1 must scale to the full set,
**When** `tests/unit/scoring/irt/parity.test.mjs` is updated to iterate over all `vectors.json` entries,
**Then** it passes for 100% of patterns at ±0.001 logits tolerance
**And** the test completes in <5 seconds on a developer laptop (NFR26).

### Story 2.7: Populate METHODOLOGY_CLAIMS.json + activate lint-claims-manifest

As a **Tomáš-the-skeptic verifying the claims-as-coupled-artifact innovation pillar #2**,
I want **the scoring engine's declared methodology dependencies to land in `METHODOLOGY_CLAIMS.json` and the claims-manifest lint to graduate from "green on empty" to "green on populated"**,
So that **subsequent epics' methodology pages must declare matching `asserts:` frontmatter or CI fails — drift is mechanically impossible from this point forward**.

**Acceptance Criteria:**

**Given** Stories 2.1–2.6 are complete,
**When** `METHODOLOGY_CLAIMS.json` is inspected,
**Then** it contains entries for every load-bearing scoring claim: `claim-id: irt-2pl-model`, `claim-id: eap-estimation-method`, `claim-id: quadpts-61`, `claim-id: theta-lim-pm-6`, `claim-id: prior-standard-normal`, `claim-id: percentile-from-standard-normal-cdf`, `claim-id: iq-scale-mean-100-sd-15`, `claim-id: se-total-rss`, `claim-id: golden-vector-parity-0.001-logits`
**And** each entry validates against `corpus/methodology-claims-v1.schema.json` from Epic 1.

**Given** corresponding methodology pages do not yet exist (Epic 5 lands them),
**When** `tools/lint-claims-manifest.mjs` runs at end-of-Epic-2,
**Then** it emits a *warning* (not error) for every claim that lacks a matching methodology-page `asserts:` entry — listing the expected page paths under `src/content/methodology/en/`
**And** the lint exits 0 (warnings allowed until **Story 4.3** graduates the flag; this story does NOT flip the strict flag — per Murat's duplicate-gate-trap finding, Story 4.3 is the canonical graduation point).

**Given** the lint must catch engine-doc drift once methodology pages exist (FR43, NFR23),
**When** **Story 4.3** flips the lint to `--strict` mode (Epic 4 — corpus pipeline lands),
**Then** the flip happens exactly once and is documented as a one-line change in `pr-checks.yml`
**And** this story (2.7) explicitly defers the flag-flip to avoid the duplicate-graduation confusion Murat flagged.

---

## Epic 3: Vertical Slice — EN Happy-Path Score → Methodology Handoff + Contract Artifacts

A tester (per PRD Journey 1 — Anna) can complete an English-language session end-to-end on a build that is honestly minimal but contract-stable: landing → consent (with validity envelope + "Not today") → 16-item ICAR-MR session → pre-reveal beat → score panel → one-click handoff to a stub methodology page that defines whichever number was clicked. **The load-bearing UX hypothesis is validated tester-testable.** Epic 6 cannot renegotiate the three written contracts shipped here.

### Story 3.1: Author the three contract ADRs (state shape, reveal-stage event, methodology-handoff URL)

As a **future-self maintaining Epic 6's SPA hardening**,
I want **the three load-bearing contracts (session state shape, `iqme:reveal-stage` event surface, methodology-handoff URL pattern) to be written down as ADRs in Epic 3 BEFORE any vertical-slice code is implemented**,
So that **Epic 6 is forced to expand additively rather than rename/restructure (per John + Winston + Amelia — "provisional contracts" markers prevent the cargo-culted-Epic-2 retrofit failure mode)**.

**Acceptance Criteria:**

**Given** session state will be persisted via `localStorage` opt-in (FR26) in Epic 6,
**When** `src/assessment/state.schema.json` is inspected at end-of-Story-3.1,
**Then** it is a JSON Schema 2020-12 document defining the session-state object: `{ currentItem: integer, responses: array, startedAt: integer (Unix ms), locale: enum["en","ru","pl"], seed: string (128-bit hex) }`
**And** the schema permits additional fields under `additionalProperties: false` only with explicit `version: 1` bump.

**Given** Epic 6 will expand the `iqme:reveal-stage` event to 5 beats,
**When** `docs/adr/iqme-reveal-stage-event-contract.md` is inspected,
**Then** it documents: event name (`iqme:reveal-stage`), bubble semantics (`{ bubbles: true, composed: false }`), minimum payload shape (`detail: { stage: enum, t: <performance.now()> }`), the enumerated stage values for v1 (`anchor`, `handoff` — full set `anchor|band|interval|context|tail-scene|methodology-handoff` reserved for Epic 6), and the ordering invariant (stages fire in declared order, never repeat, never skip)
**And** the ADR explicitly states: Epic 6 may add stages between the declared v1 stages but may not rename, reorder, or remove them.

**Given** Epic 4 will land the per-corpus-release versioned permalink scheme (FR28, NFR25),
**When** `docs/adr/methodology-handoff-url-contract.md` is inspected,
**Then** it pins the URL pattern: `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` (path is kebab-case, slash-terminated, no trailing index.html)
**And** the ADR specifies the click-binding contract: each score-panel number has `data-methodology-target="<path>"` and the SPA resolves to `/methodology/<latest-corpus-version>/<active-locale>/<path>/`
**And** the ADR is consumed by both Epic 4's build-pipeline (URL emission) and Epic 6's score-panel (click-binding) — neither may diverge.

**Given** Epic 8 will fire `release.yml` on `app-v*` and `corpus-v*` tags (decoupled tag namespaces per architecture D7),
**When** `docs/adr/release-tag-namespace-contract.md` is inspected,
**Then** it pins the tag schema: `app-v<X>.<Y>.<Z>` (SemVer for the SPA) and `corpus-v<X>.<Y>.<Z>` (SemVer for the methodology corpus), the two are independent; the SPA shell's footer-link to methodology uses the most-recent `corpus-v*` tag via `git describe --tags --match 'corpus-v*' --abbrev=0`
**And** the ADR specifies the v0.1.0 initial-tag discipline: Epic 3 SHOULD tag `corpus-v0.1.0` at end-of-Epic-3 (per Winston) so the SPA shell's footer link resolves correctly in dev environments before Epic 8 lands.

### Story 3.2: Implement state.js + contract test

As a **caller from anywhere in the SPA needing session state**,
I want **a single in-memory `state.js` module that owns session state and is contract-validated against `state.schema.json`**,
So that **state mutations in Epic 6 (opt-in save, locale-lock, bail-out) cannot silently break the schema and saved state from Epic 3 testers still deserializes on Epic 6 builds**.

**Acceptance Criteria:**

**Given** `state.schema.json` is committed (Story 3.1),
**When** `src/assessment/state.js` is implemented,
**Then** it exports `getState()`, `setItem(itemIndex)`, `recordResponse(itemIndex, response)`, `setSeed(seed)`, `setLocale(locale)` — all pure-ish functions operating on a single module-scope state object
**And** the state object is initialized empty (per NFR9 — first render correctness without localStorage).

**Given** the FR7 session-seed requirement (128-bit `crypto.getRandomValues()`, in memory only),
**When** `setSeed(seed)` is invoked,
**Then** the seed is stored in module-scope state, never to localStorage, never to URL hash
**And** a test asserts no `localStorage.setItem` calls during seed lifecycle.

**Given** Epic 6 must not silently break the state schema,
**When** `tests/contract/state-shape.spec.mjs` runs,
**Then** it exercises the full state lifecycle (init → seed → record 16 responses → score) and validates the final state object against `state.schema.json` via `ajv` or equivalent (vendored dev-dep)
**And** the test is wired into the `pr-checks.yml` matrix as the `state-shape-contract` job (the slot from Epic 1's stub).

### Story 3.3: Implement landing + consent-scene (EN)

As an **English-speaking visitor arriving at the canonical URL**,
I want **a landing page that explains what IQ-ME is, links to the methodology corpus, and offers a "Start the test" CTA — followed by a consent scene that presents the validity envelope before the Continue control becomes available**,
So that **I cannot start a measurement session without having read the disclosure (FR12) and I can decline with "Not today" (FR11) at any pre-test point**.

**Acceptance Criteria:**

**Given** I land at `/` (or `/en/`),
**When** the landing page renders,
**Then** I see: project name in chrome-header, one-paragraph EN explanation of what IQ-ME is, a "Start the test" button, a "Read the methodology" link to `/methodology/<latest>/en/` (FR32 stubs from Story 3.6)
**And** zero third-party requests fire (FR41 — strict network-trace from Epic 1).

**Given** the landing page has zero preconditions (FR1),
**When** the page renders,
**Then** no cookie banner appears, no consent dialog appears, no analytics-gate appears, no signup prompt appears, no localStorage write occurs (NFR9)
**And** a test asserts these absences via the existing `lint-no-share` + `lint-no-role-alert` infrastructure from Epic 1 plus an additional `lint-no-cookie-banner` assertion.

**Given** I click "Start the test",
**When** the consent scene renders,
**Then** I see (FR9, FR10): a plain-language EN statement of what the instrument measures, the validity-envelope disclosure (including the visuospatial / screen-reader-non-equivalence statement per NFR13), the "Not today" exit, and a Continue control
**And** the Continue control's `aria-disabled` flips to `false` only after the validity envelope text has been scrolled past or after 5 seconds of dwell (per FR12 — "Continue is not available until the user has had the opportunity to read the disclosure").

**Given** I click "Not today",
**When** the consent scene exits,
**Then** I land back at the landing page with no state retained, no telemetry fired (FR11)
**And** a test asserts the `state.js` session-state object is empty after a "Not today" exit.

### Story 3.4: Implement item-runner + progress-indicator (16-item session with FR7 seed)

As an **English-speaking test-taker who has clicked Continue past consent**,
I want **to answer 16 matrix-reasoning items one at a time with keyboard navigation, a visible progress indicator, the ability to revise previous answers, and no time pressure (FR2, FR3, FR5)**,
So that **I can complete the test deliberately and the architecture's 128-bit-seed-deterministic subset selection (FR7) is exercised end-to-end**.

**Acceptance Criteria:**

**Given** I have passed the consent scene,
**When** the session begins,
**Then** `setSeed()` is called with a 128-bit value from `crypto.getRandomValues()` (FR7, NFR10) — never `Math.random`
**And** `src/assessment/item-prng.js` derives a deterministic 16-item subset + ordering from the seed
**And** the seed is in memory only (no localStorage, no URL hash — verified by test).

**Given** the item-runner renders one item at a time (FR2),
**When** I view an item,
**Then** I see (FR3): the item image (SVG or PNG at ≤50 KB per item per NFR2), the option set as native `<input type="radio">` with associated `<label>` (per UX-DR32 — no custom-div widgets), Previous + Next buttons, and a progress indicator with `aria-live="polite"` + `aria-current="step"` showing "Item N of 16" (UX-DR20).

**Given** FR5 forbids time pressure,
**When** I look at the item-runner,
**Then** no countdown is visible, no per-item timer is visible, no timing-based scoring affordance exists
**And** a test asserts the rendered DOM contains no `[data-timer]` or `aria-timer` attributes.

**Given** I want to revise a previous answer (FR2),
**When** I click Previous and change an answer,
**Then** the change is recorded via `recordResponse()` and overwrites the prior response in `state.js`
**And** Next remains available with my new answer.

**Given** the strict zero-third-party invariant must hold during a session (FR41),
**When** I complete the 16-item session,
**Then** the network trace shows only same-origin GET requests for the 16 item assets
**And** the Playwright `network-trace.spec.mjs` from Epic 1 asserts this on the full vertical slice.

### Story 3.5: Implement reveal-stage event + score-panel + CSS-source co-equal triplet lint

As an **English-speaking test-taker who has just submitted the 16th item**,
I want **a pre-reveal "are you ready" beat (FR13) followed by a score panel showing percentile + IQ-scale + uncertainty band (FR15, FR18) with an inline non-dismissible caveat above the score (FR23) — and CSS-source-level co-equal triplet parity enforced from this epic forward**,
So that **the load-bearing aha-click is exercisable (the click into methodology lands in Story 3.6) and Epic 6's runtime computed-style assertion is *graduation*, not *introduction*, of the co-equal invariant (per Murat's two-tier defense)**.

**Acceptance Criteria:**

**Given** all 16 items have been answered,
**When** the user reaches the result step,
**Then** `src/assessment/reveal-stage.js` dispatches `iqme:reveal-stage` events per the Story-3.1 ADR contract: first `{ stage: "anchor", t: ... }` (the pre-reveal beat — FR13), then `{ stage: "handoff", t: ... }` after the user clicks "Show me"
**And** the event-ordering test (`tests/playwright/reveal-stage-event-ordering.spec.mjs` — the slot from Epic 1's CI matrix) asserts the order with `anchor` strictly before `handoff`, with `t_handoff - t_anchor ≥ 400ms ± 50ms tolerance` (per Murat — pin the tolerance; "feels paced" is unfalsifiable).

**Given** the score panel renders the co-equal triplet (FR18),
**When** the result is displayed,
**Then** `src/css/components/score-panel.css` renders `.score-panel__anchor` (IQ-scale numeral), `.score-panel__percentile`, and `.score-panel__band` at the same `--font-size-600` (39px per UX-DR3), with no visual hierarchy via color or weight differentiation
**And** `tools/lint-css-source-co-equal.mjs` (a CSS-AST lint authored in this story) asserts: identical font-size, font-weight, font-family declarations across the three selectors in the source CSS — flagging any modifier rule that breaks parity.

**Given** FR23 requires an inline non-dismissible caveat above the score,
**When** the score panel renders,
**Then** `.score-panel__caveat` exists in the DOM above the triplet with `role="note"` (not `role="alert"` per UX-DR22) — the `lint-no-role-alert` from Epic 1 asserts this on every PR
**And** the caveat text in EN reads: a single sentence disclaiming clinical, educational-placement, employment, and legal-decision applicability.

**Given** Epic 1's `scoreSession()` returns the full triplet + uncertainty (Story 2.5),
**When** the score-panel renders,
**Then** the percentile, IQ-scale, and uncertaintyBand values are read from `scoreSession()` output (no SPA-side math)
**And** a test asserts the rendered values match the engine output byte-identically.

### Story 3.6: Author 3 EN methodology stub pages (the click targets)

As a **English-speaking test-taker clicking from a number on the score panel**,
I want **to land on a real methodology stub page that explains what that number means**,
So that **the aha-click hypothesis is tester-testable end-to-end and the methodology-handoff URL contract from Story 3.1 is exercised against actual content**.

**Acceptance Criteria:**

**Given** the methodology-handoff URL ADR pins `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/`,
**When** the repository is inspected at end-of-Story-3.6,
**Then** three EN methodology stub pages exist under `src/content/methodology/en/`: `scoring/percentile-to-iq/`, `scoring/uncertainty/`, `scoring/overview/` (the click-targets for percentile, uncertainty band, and IQ-scale respectively)
**And** each is a CommonMark + YAML-frontmatter source that — when rendered by the Epic 4 pipeline — emits at `/methodology/v0.1.0/en/scoring/<slug>/index.html`.

**Given** Epic 4's build pipeline has not landed yet,
**When** Epic 3 needs to ship runnable methodology pages,
**Then** a minimal `tools/build-methodology.mjs` stub exists that walks `src/content/methodology/en/**.md`, renders body via the simplest possible markdown invocation (vendored `marked.js` or `<pre>`-wrapped source if D1 still unresolved), wraps in a minimal HTML template with the masthead pinned-version "v0.1.0", and emits to `dist/methodology/v0.1.0/en/...`
**And** the stub explicitly documents (in `docs/corpus-build-conventions.md` updated to note "Epic 4 supersedes this stub") that it is interim infrastructure.

**Given** each stub page is a real handoff target for a tester,
**When** I click from `.score-panel__percentile` on the live slice,
**Then** I land on `/methodology/v0.1.0/en/scoring/percentile-to-iq/` and read a 200–400 word plain-language EN explanation of what a percentile is, written at Flesch-Kincaid grade ≤12 (NFR28 — checked manually at Epic 3; CI lint activates in Epic 4)
**And** the page contains a link back to the result page that round-trips state correctly (per FR21).

**Given** Epic 5 will replace these stubs with the full corpus,
**When** Epic 5 lands,
**Then** these three pages are *expanded* (not replaced wholesale) — their URLs remain stable as a permalink commitment from the moment Epic 3 ships
**And** the `lint-claims-manifest` (now graduating to `--strict` per Story 2.7's contract) sees matching `asserts:` frontmatter from these stubs corresponding to the populated `METHODOLOGY_CLAIMS.json`.

### Story 3.7: Exercise the strict network-trace assertion against the full live slice

As a **skeptic (Tomáš journey) running the verification harness**,
I want **the Epic 1 strict zero-third-party network-trace Playwright spec to now run against the full vertical slice (landing → consent → 16-item session → result → handoff click) and pass with zero allowlist relaxation**,
So that **the project's load-bearing zero-telemetry claim is *exercised* end-to-end from Epic 3 onward, not deferred to Epic 8 (per Murat — 40-55% probability of silent regression over 6 months otherwise)**.

**Acceptance Criteria:**

**Given** the live slice exists (Stories 3.2–3.6) and the network-trace infra exists from Epic 1 Story 1.7,
**When** `tests/playwright/network-trace.spec.mjs` is updated to drive the full happy-path,
**Then** it executes: navigate to `/`, click Start, dismiss consent past dwell-gate, click Continue, answer 16 items (deterministic responses driven by a fixed seed via `setSeed()` test hook), click through the pre-reveal beat, view the result panel, click each of the three number-targets to verify handoff navigation
**And** asserts: zero non-same-origin requests fired across the entire flow, zero requests to the forbidden-domain set, zero `localStorage.setItem` calls (until the user explicitly opts in — not exercised in this happy-path).

**Given** the spec must run in <60 seconds on a developer laptop (CI feedback budget),
**When** the spec is profiled,
**Then** the total wall-clock is bounded — if it exceeds 60 s, the spec is split into smaller specs that run in parallel.

**Given** any future PR that breaks the invariant must fail loudly,
**When** a hypothetical PR adds a CDN-hosted font import,
**Then** the spec fails with a message naming the violating domain + URL + the spec step that triggered it
**And** `pr-checks.yml` blocks the merge.

### Story 3.8: Aha-click hallway test — 3-5 outside-team comprehension recording

As a **maintainer (CEP) validating the LOAD-BEARING UX HYPOTHESIS that the score→methodology click triggers "aha"**,
I want **3-5 outside-team English-speaking users to run the Epic-3 vertical slice on a local build, complete the score→methodology click, and self-report comprehension in a documented `_evidence/` artifact (per John + Sally — Gate 9e is too late, the hypothesis dies or lives at Epic 3)**,
So that **the epic-goal "tester-testable" is *actually tested* (not aspirational), and any tonal-handoff or comprehension failure surfaces NOW — before Epic 4 commits to the corpus pipeline and Epic 5 commits to 30 pages of prose**.

**Acceptance Criteria:**

**Given** the vertical slice (Stories 3.1–3.7) is complete and runnable,
**When** the maintainer recruits 3-5 outside-team English-speaking users (mix of skeptic + general curious — NOT the Gate-9e cohort; this is the *early* validation),
**Then** each user is asked to complete the full happy-path on a local build, then describe in their own words: (a) what their score meant, (b) what they learned by clicking through to methodology, (c) whether they would trust this site to a friend, (d) whether anything felt off
**And** each session is recorded as a single-paragraph note in `_evidence/3.8-hallway-test-<user-handle>.md` (with user consent; handle redacted if they prefer pseudonym).

**Given** the hypothesis is "the click triggers aha — a moment of informed comprehension",
**When** the aggregate hallway-test results are reviewed,
**Then** ≥3 of 5 users report comprehension of what the percentile/IQ/uncertainty mean after the click, and ≥3 of 5 click the methodology link voluntarily (not prompted)
**And** any user who reports the click felt confusing, the page was incomprehensible, or the score-to-methodology handoff felt jarring triggers a *Story 3.8b* (defer to retro) — the v1 hypothesis is provisionally validated and Epic 4 can proceed.

**Given** the hallway test is informal but documented,
**When** the maintainer captures the results,
**Then** `_evidence/3.8-hallway-test-summary.md` is committed with the aggregate verdict, the qualitative pain points, and the maintainer's go/no-go decision on advancing to Epic 4
**And** the document is referenced from Epic 4's first PR description as the evidence the hypothesis is validated.

**Given** "outside-team" means people who didn't author the project,
**When** recruitment proceeds,
**Then** sources include: friends/family without psychometric background, online communities (r/cognitiveTesting low-key DM, Mastodon), an HN-comment-equivalent recruitment if maintainer is comfortable
**And** the test runs on a build that is *visibly pre-release* — no marketing, no signup, just "I'm building something, would you try it for 20 minutes and tell me what you think?"

---

## Epic 4: Methodology Corpus Build Pipeline + Versioned Citation Infrastructure

A citer (Karolina) can resolve a stable versioned permalink, see a citation block (APA + Wikipedia-template) with version and DOI pre-filled, and trust that CI mechanically enforces every claim-parity / frontmatter / glossary / reading-level / license-provenance invariant on every PR. The corpus build pipeline (`make build-methodology`) is the single author-time build step, and its output IS the shipped artifact. **Exit criterion (per Winston):** all linters demonstrated against both a corpus page and an SPA fragment.

### Story 4.1: Implement subset markdown renderer + build-methodology pipeline with per-corpus-release re-emit

As an **AI agent or human content author writing methodology pages**,
I want **the `make build-methodology` pipeline to render every methodology page from `src/content/methodology/<lang>/**/*.md` to per-corpus-release versioned HTML at `dist/methodology/v<X>.<Y>.<Z>/<lang>/<path>/index.html` — even pages whose content did not change in the release**,
So that **the per-corpus-release re-emit semantics (NFR25) hold from day one, citers of `v1.2.0/<lang>/<path>` always resolve to that frozen version, and Story 3.6's interim stub is superseded by the real pipeline**.

**Acceptance Criteria:**

**Given** the D1 decision (vendored marked vs hand-rolled subset renderer) must be made,
**When** the implementation lands,
**Then** `tools/markdown-subset.mjs` exports a `render(source, options)` function that parses the declared markdown subset from `corpus/markdown-subset-v1.md` (Epic 1) in strict mode — unknown construct → throw
**And** the renderer's vendored dependency (if any) is committed under `vendor/` with SHA pinned in `vendor/SHASUMS`, OR is a hand-rolled ~200 LOC module — the choice is documented inline.

**Given** the pipeline must implement per-corpus-release re-emit (NFR25),
**When** `tools/build-methodology.mjs` is invoked with `--corpus-version v1.2.0`,
**Then** every source page under `src/content/methodology/<lang>/**.md` emits to `dist/methodology/v1.2.0/<lang>/<path>/index.html` regardless of whether its content changed
**And** a separate `dist/methodology/latest/<lang>/<path>/index.html` is a `<meta refresh>`-redirect or build-time-copy of the current corpus-version page (per architecture's hreflang strategy).

**Given** Story 3.6's stub at `tools/build-methodology.mjs` is interim,
**When** Epic 4 lands,
**Then** the stub is replaced by the full pipeline with no breakage to the three Epic-3 stub pages (their URLs remain stable per the FR28 permalink commitment)
**And** the pages now render through the full pipeline (masthead, lede placeholder, body, footer with reviewer line) per the architectural chrome design.

### Story 4.2: Byte-stable build assertion + golden HTML snapshots

As a **skeptic (Tomáš) verifying the runtime-zero-build invariant (NFR21)**,
I want **the corpus build to emit byte-identical `dist/` output on repeated invocations and golden HTML snapshots committed to detect unintended drift**,
So that **the "deployed JS tree = source tree byte-for-byte" claim is mechanically enforceable and any methodology-page rendering change requires an explicit PR touching both source AND snapshot**.

**Acceptance Criteria:**

**Given** Epic 1 shipped the deterministic-build harness,
**When** `tests/playwright/byte-stable.spec.mjs` (slot from Epic 1) is activated in this story,
**Then** the spec runs `make clean && make build`, hashes every file in `dist/`, runs `make clean && make build` again, hashes again, and asserts byte-identical output
**And** any non-determinism (locale-dependent date format, FS traversal order) fails the build with a clear diff.

**Given** golden HTML snapshots prevent unintended rendering drift,
**When** `tests/snapshots/methodology/` is inspected,
**Then** every Epic-3 stub page (`scoring/percentile-to-iq/`, `scoring/uncertainty/`, `scoring/overview/`) has a committed golden HTML snapshot at `tests/snapshots/methodology/en/<path>.html`
**And** the snapshot is regenerated only via `make snapshot-update` — the cross-domain D→E exception codified in Epic 1's `no-restricted-paths` lint config.

**Given** snapshot drift requires deliberate review,
**When** a PR changes a methodology source page without updating the snapshot,
**Then** CI fails with a clear diff between expected and actual HTML
**And** the contributor is instructed to run `make snapshot-update` and commit both files together.

### Story 4.3: lint-frontmatter + lint-claims-manifest --strict graduation

As a **maintainer enforcing innovation pillar #2 (methodology-as-coupled-artifact)**,
I want **every methodology page's frontmatter validated against `corpus/schema.json` and the `lint-claims-manifest` graduated from "green on empty" (Epic 1) and "warn on missing" (Epic 2) to "strict — fail on missing"**,
So that **engine ↔ methodology drift becomes mechanically impossible (FR43, NFR23) and contributors get an immediate clear error rather than a delayed methodology surprise**.

**Acceptance Criteria:**

**Given** `corpus/schema.json` (Epic 1) defines the required frontmatter fields,
**When** `tools/lint-frontmatter.mjs` runs against `src/content/methodology/**/*.md`,
**Then** every page's frontmatter parses as YAML, validates against the schema (required fields present + correctly typed), and fails the build with a clear path + field name on any violation
**And** the Epic-3 stub pages are updated to carry compliant frontmatter (title, version "v0.1.0", lastReviewed, reviewer "@TBD", reviewerHandle "@TBD", asserts:[], glossaryRefs:[]).

**Given** `lint-claims-manifest` was warn-only in Epic 2 (Story 2.7),
**When** the `pr-checks.yml` job is flipped to `--strict` mode in this story,
**Then** any `METHODOLOGY_CLAIMS.json` entry without a matching methodology-page `asserts:` entry fails the build
**And** the Epic-3 stub pages declare matching `asserts:` for the engine claims they document (e.g. `scoring/overview/` asserts `irt-2pl-model`, `eap-estimation-method`).

**Given** the claims-parity is bidirectional (FR43, NFR23),
**When** a methodology page declares an `assert:` with no matching `METHODOLOGY_CLAIMS.json` entry,
**Then** the lint also fails (orphan assert)
**And** the failure message guides the contributor: "either add this claim to METHODOLOGY_CLAIMS.json (if engine implements it) or remove the assert from the methodology page".

### Story 4.4: lint-glossary + lint-reading-level (EN)

As a **methodology corpus reader expecting plain-language discipline (NFR28, NFR30)**,
I want **every technical term in any methodology body page to exist in `/glossary/` before it appears in body text, and every page to pass an EN reading-level lint at Flesch-Kincaid grade ≤12**,
So that **the glossary-first writing discipline is mechanically enforced and the corpus stays readable to non-specialist citers from Wikipedia / course syllabi (Karolina journey)**.

**Acceptance Criteria:**

**Given** glossary-first writing (NFR30) requires all technical terms to be in `/glossary/` before body use,
**When** `tools/lint-glossary.mjs` runs against `src/content/methodology/<lang>/**/*.md`,
**Then** the lint extracts all bolded or capitalized-first-use technical terms, cross-references them against `src/content/methodology/<lang>/reference/glossary/index.md`, and fails the build if any body-text term is absent from the glossary
**And** the failure message lists the offending term + page path + suggested glossary entry skeleton.

**Given** EN reading-level discipline (NFR28) targets Flesch-Kincaid grade ≤12 (target 9–10),
**When** `tools/lint-reading-level.mjs` runs on every EN methodology page,
**Then** the lint computes FK grade using a committed pure-JS implementation (no third-party FK library to avoid runtime dep churn) and fails the build for any page exceeding grade 12
**And** the lint emits a per-page summary showing current grade vs target (so authors see the trend).

**Given** RU + PL reading-level calibrations land in Epic 7 (Oborneva-equivalent + Pisarek/Jasnopis),
**When** the lint is invoked at end-of-Epic-4,
**Then** it processes EN pages only and emits a no-op pass for RU/PL paths (Epic 7 wires those calibrations)
**And** the AC explicitly notes this is "no-op on single-locale corpus until Epic 7" per Amelia.

### Story 4.5: lint-license-provenance

As a **maintainer protecting the load-bearing license chain (NFR24, FR45)**,
I want **every shipped item file (matrix-reasoning items, methodology pages, locale strings, crisis-resource lists, glossary entries) to trace to an attribution in `LICENSES.md` (Epic 1) and `LICENSES.md` itself to be unmodified between releases except via explicit changelog entries**,
So that **the ICAR license-chain integrity is mechanically auditable and Tomáš + Karolina can verify license provenance in repository inspection alone**.

**Acceptance Criteria:**

**Given** `LICENSES.md` (Epic 1) enumerates licensed item files with their attribution strings,
**When** `tools/lint-license-provenance.mjs` runs against the source tree,
**Then** every file under `src/items/`, `src/content/methodology/**/*.md`, `src/content/i18n/**/*.json`, `src/content/glossary/**/*.md`, `src/content/crisis-resources/**/*.json` has a corresponding `LICENSES.md` entry
**And** any orphan file (no LICENSES entry) fails the build with a clear path + recommended LICENSES.md addition.

**Given** `LICENSES.md` immutability between releases is part of the trust posture (NFR24),
**When** the file's `last-modified-hash` (from Epic 1 Story 1.2) drifts without a corresponding `CHANGELOG.md` entry referencing it,
**Then** the lint fails the build
**And** the failure message instructs: "add a CHANGELOG.md entry naming the license change before merging".

**Given** the lint must work against the empty Epic-3-stub state and the post-Epic-5 full-corpus state,
**When** the lint runs at end-of-Epic-4,
**Then** Epic-3's three stub pages have `LICENSES.md` entries (added in this story)
**And** the lint passes against the current source tree.

### Story 4.6: Masthead component + cite-this-page widget (APA + Wikipedia-template)

As a **citer (Karolina journey)**,
I want **every methodology page to render a masthead with title + version + DOI + last-reviewed date + named reviewer-of-record, plus a Cite-this-page widget producing APA and Wikipedia-citation-template formats with version + DOI pre-filled**,
So that **the citability vision (Journey 5) is operational from Epic 4 forward — a Wikipedia editor preparing an external link can copy a compliant citation in one click**.

**Acceptance Criteria:**

**Given** FR35 requires the named reviewer-of-record per language per version on the masthead,
**When** any methodology page renders,
**Then** `src/css/components/masthead.css` (the load-bearing trust signal per UX-DR11) renders: page title (at `--font-size-700` per UX-DR3), version string (e.g. "v0.1.0"), DOI placeholder (empty until Epic 8 mints; field present), last-reviewed date from frontmatter, named reviewer + GitHub handle from frontmatter, with a bottom hairline rule
**And** the masthead reads frontmatter fields exclusively — no per-page hardcoded values.

**Given** FR29 requires APA + Wikipedia-template citation formats,
**When** the cite-this-page widget renders,
**Then** clicking it copies (a) an APA citation: `Author. (YYYY). Title. *IQ-ME Methodology Corpus*, v<X>.<Y>.<Z>. https://doi.org/<doi>` and (b) a Wikipedia-template citation: `{{cite web | title=... | website=IQ-ME Methodology Corpus | date=... | version=v<X>.<Y>.<Z> | url=... | doi=...}}`
**And** BibTeX is **deferred** to Epic 8 or v1.0.1 per scoping (PRD nice-to-have).

**Given** the DOI is not yet minted until Epic 8 release,
**When** the widget is inspected at end-of-Epic-4,
**Then** the DOI field is shown as "DOI: pending v1.0.0 release" with a `<time>`-element placeholder that gets populated by `release.yml` (Epic 8)
**And** the visible-fallback discipline (per John, Story 1.3) holds — no silent empty field.

### Story 4.7: stale-translation-hatnote component + lint-translation-parity no-op stub

As a **methodology corpus reader on a Russian or Polish page that has drifted from the EN source**,
I want **the stale-translation hatnote to be a rendered component on the page (not a footer CI artifact) that visually signals drift the moment it occurs**,
So that **translation drift visibility is part of the design language (UX-DR15 — "load-bearing trust signal") and is mechanically caught by `lint-translation-parity` once non-EN locales exist in Epic 7**.

**Acceptance Criteria:**

**Given** UX-DR15 designates the stale-translation hatnote as a load-bearing trust signal,
**When** `src/css/components/stale-translation-hatnote.css` is implemented,
**Then** the component renders at page top (above the lede, below the masthead) with `role="note"` (not `role="alert"` — already lint-enforced), `--color-surface-attention` background, dated message, and a "view source EN hash" link
**And** the component reads `[data-translation-stale="true"]` on the methodology page wrapper — set by the build pipeline only when EN-source-hash drift is detected.

**Given** `lint-translation-parity.mjs` is in Epic 1's CI matrix as a stub,
**When** the lint runs against the EN-only corpus at end-of-Epic-4,
**Then** it executes as a no-op pass (no non-EN content to compare per Amelia — explicit AC: "no-op on single-locale corpus until Epic 7")
**And** the lint emits a per-locale summary "EN: source-of-truth; RU/PL: not yet authored (Epic 7)" so contributors see the deferred state.

**Given** Epic 7 will activate full coverage,
**When** Epic 7 lands RU + PL,
**Then** the same lint script (no rewrite) processes RU/PL frontmatter `sourceHashEN` fields, compares to the EN source hash, sets `[data-translation-stale="true"]` on drift, and fails the build if hash is missing or if orphan keys exist
**And** the path from Epic 4's no-op to Epic 7's full coverage is one configuration change, not a re-architecture.

### Story 4.8: Exit-criterion verification — linters exercised against corpus + SPA fragment

As a **future Epic 5 / Epic 6 author proceeding under the claim "Epic 4 and Epic 5/6 can run in parallel" (per Winston)**,
I want **every lint shipped in Epic 4 to be demonstrated against both a corpus page AND an SPA fragment before Epic 4 closes**,
So that **the parallelism claim is not paper-only — linters are calibrated for both surfaces and won't surprise Epic 5 or Epic 6 with asymmetric failures (per Winston's Q4 critique)**.

**Acceptance Criteria:**

**Given** the lint suite is implemented (Stories 4.2–4.7),
**When** `tests/exit-criteria/epic-04-lint-coverage.spec.mjs` runs,
**Then** each lint (`lint-frontmatter`, `lint-claims-manifest`, `lint-glossary`, `lint-reading-level`, `lint-license-provenance`, `lint-translation-parity`, byte-stable-build) is exercised against (a) at least one methodology corpus page (`scoring/overview/` or equivalent), and (b) at least one SPA-side content fragment (`landing.md` shipped as a corpus-managed string OR a fixture `tests/fixtures/spa-fragment.md`)
**And** the spec asserts each lint produces a useful output (pass or fail with diagnostics) on both surface types — not a "not applicable" skip.

**Given** SPA microcopy (consent-scene strings, score-panel captions) needs the same prose discipline as corpus prose (per Winston Q4 #3),
**When** `lint-reading-level` runs against `src/content/i18n/en/*.json` (the locale string source),
**Then** it computes FK grade on the rendered prose values (not the JSON keys) and applies the grade-12 cap
**And** Epic 6 inherits this lint coverage when it ships full SPA i18n strings.

**Given** the CSP enforcement contract (NFR7) applies to both corpus pages and SPA pages,
**When** an out-of-band check is run — `lint-csp-source` — against both a generated methodology HTML and the SPA `index.html`,
**Then** both pass with no inline styles, no inline scripts, no inline event handlers
**And** this AC is the demonstration that the strict CSP from Epic 1 holds across both surfaces (Winston's bullet 1 in Q4).

---

## Epic 5: Methodology Visual System + Full English Methodology Corpus

An English reader (including citers who never take the test) can navigate the complete 30-page methodology corpus end-to-end at the plain-language reading level CI enforces. **Sequenced internally per Sally:** anchor pages first (Story 5.2) → content-freeze typographic-system checkpoint → remaining 23 pages (Stories 5.3–5.6). The methodology-page-chrome CSS additions live here (Story 5.1).

### Story 5.1: Methodology-page-chrome CSS additions + validity-envelope-diagram asset

As a **methodology corpus reader expecting visual coherence with the SPA**,
I want **the remaining methodology-page-chrome CSS components (`lede.css`, `translation-in-progress-stub.css`, `validity-envelope-diagram.svg` + `.css`) to land before content authoring begins**,
So that **anchor-page authors render against the locked component set (per Sally — visual coherence is the medium, not late-binding) and the validity-envelope diagram is reusable in both the consent scene (Epic 3) and `/methodology/constructs/validity-envelope/`**.

**Acceptance Criteria:**

**Given** the lede component is described in UX-DR12 as "one plain-language sentence below the masthead; surface-aware",
**When** `src/css/components/lede.css` is implemented,
**Then** it renders the first body paragraph of any methodology page at `--font-size-300` (20px per UX-DR3) with `--space-masthead-to-lede` spacing above
**And** the lede component reads its content from the methodology source body — no per-page hardcoding.

**Given** Epic 7 will land RU + PL pages and some will be untranslated at first commit,
**When** `src/css/components/translation-in-progress-stub.css` is implemented,
**Then** it renders a stub page composition with the masthead present, a clear "Translation in progress" message in the active locale, a contributor recruitment CTA, and a fallback link to the EN source per UX-DR16
**And** Epic 4's build pipeline (Story 4.1) is updated to emit this stub for any non-EN frontmatter file flagged `translationStatus: in-progress`.

**Given** UX-DR28 designates `validity-envelope-diagram` as a reusable asset in both the consent scene (Epic 3) and the methodology corpus,
**When** `src/css/components/validity-envelope-diagram.svg` and `.css` are committed,
**Then** the SVG carries `<title>` and `<desc>` as content keys (NFR31) that the i18n harness in Epic 7 will translate; the CSS adapts the diagram for embedded use in both surfaces
**And** the Epic 3 consent scene is updated to reference the now-real SVG (replacing any placeholder).

### Story 5.2: Anchor pages (7) + FR36-protection lint + content-freeze typographic-system checkpoint

As a **future Epic 6 SPA-hardening author**,
I want **the methodology corpus's typographic and tonal system to be locked by 7 anchor pages BEFORE I start hardening tail-scenes (per Sally — Epic 5 needs anchor pages frozen so Epic 6 lands against a stable visual world)**,
So that **the score-panel triplet typography and tail-scene composition feel like they belong to the same publication as the methodology pages and the seam doesn't show at the aha-click**.

**Acceptance Criteria:**

**Given** anchor pages are the 7 that establish tone + density variety,
**When** the following pages are authored in EN: `/constructs/fluid-reasoning/`, `/scoring/overview/`, `/scoring/uncertainty/`, `/limitations/what-this-does-not-measure/`, `/ethics/non-clinical/`, `/provenance/icar-license/`, `/reference/glossary/`,
**Then** each carries valid frontmatter (lints from Epic 4.3 enforce), passes `lint-glossary` + `lint-reading-level` (Epic 4.4), and renders through the Epic 4.1 pipeline with masthead + lede + body + footer
**And** the three Epic-3 stub pages (`scoring/percentile-to-iq/`, `scoring/uncertainty/`, `scoring/overview/`) are *expanded in place* (URLs unchanged per the FR28 permalink commitment) — the `uncertainty` and `overview` stubs become the real anchor pages.

**Given** Sally's tonal-handoff seam risk (Anna clicks her score-panel link and lands on a page that does or does not sound like the same project),
**When** the maintainer walks Anna's happy-path E2E using the now-frozen anchor-page tone,
**Then** the score-panel result copy from Epic 3 + the lede.css copy + the anchor-page prose all share register (careful, plain-language, neither chiding nor cheerleading); any tonal mismatch is logged as a P0 in `_evidence/5.2-tonal-handoff-check.md` and resolved before the typographic-freeze tag fires
**And** the document is referenced from Epic 6's first PR description.

**Given** the typographic-freeze must be mechanically detectable, not vibes-based (per Murat),
**When** `tests/snapshots/typographic-freeze.json` is committed,
**Then** it lists N (~20) selector → computed-style pairs covering: masthead h1, lede paragraph, body paragraph, score-panel triplet, glossary term, hatnote — with locked values for font-family, font-size, font-weight, line-height, letter-spacing, color (in both themes)
**And** a Playwright snapshot test diffs current computed styles against the snapshot on every PR; diff > 0 fails the build unless `make snapshot-update` is run as part of an explicit typography PR.

**Given** FR36 protects the "what this instrument does not measure" page from silent shortening,
**When** `/limitations/what-this-does-not-measure/` is authored with frontmatter `protected: true`,
**Then** `tools/lint-fr36-protection.mjs` (authored in this story) asserts: the page exists in every locale; the page is not removed, renamed, or reduced below a committed minimum-character-count without an explicit `CHANGELOG.md` entry referencing the change and reviewer-of-record sign-off
**And** the lint is wired into the Epic-1 CI matrix's `lint-fr36-protection` slot.

**Given** the anchor-pages-frozen checkpoint unblocks Epic 6 (per Sally),
**When** these 7 pages are merged to main,
**Then** a tag `corpus-v0.5.0-anchor-pages-frozen` is applied
**And** Epic 6 stories that depend on the methodology visual system reference this tag as their prerequisite.

### Story 5.3: Constructs (4 remaining) + Limitations (3 remaining)

As an **English reader exploring the conceptual underpinning of fluid reasoning and the explicit limitations of the IQ-ME instrument**,
I want **the remaining Constructs pages (`matrix-reasoning`, `icar-mr`, `g-factor`, `validity-envelope`) and Limitations pages (`cultural-variance`, `anti-leakage`, `retest-effects`) to be authored at the same plain-language discipline as the anchor pages**,
So that **the validity envelope is fully explored, the anti-leakage acknowledgment is honest (Risk #2), and the retest-effects discipline (FR27) has its full methodology home (referenced from the result page)**.

**Acceptance Criteria:**

**Given** the 7 pages above are authored in EN with valid frontmatter,
**When** each page is rendered through the Epic 4 pipeline,
**Then** all Epic-4 lints pass: `lint-frontmatter`, `lint-glossary`, `lint-reading-level` (FK ≤12), `lint-license-provenance`, `lint-claims-manifest` (each page's `asserts:` entries reference at least one engine claim from `METHODOLOGY_CLAIMS.json` where applicable)
**And** the validity-envelope diagram from Story 5.1 is embedded in `/constructs/validity-envelope/`.

**Given** `/limitations/retest-effects/` houses the no-cooldown discipline (FR27),
**When** the page is authored,
**Then** it contains an explicit "no technical cooldown enforced" section explaining why a static telemetry-free app cannot reliably enforce one and what retest practice effects mean for the score
**And** the result page (Epic 6) will link to this page from its retest-note section.

### Story 5.4: Scoring (4 remaining) + Norming (3)

As a **skeptic (Tomáš journey) or psychometrician (Gate 9b) verifying the scoring claims**,
I want **the remaining Scoring pages (`irt-2pl`, `eap`, `percentile-to-iq`, `golden-vectors`) and all Norming pages (`sapa-sample`, `representativeness`, `flynn-effects`) to be authored with `asserts:` frontmatter that maps to every load-bearing claim in `METHODOLOGY_CLAIMS.json`**,
So that **the engine ↔ methodology coupling (Innovation #2) becomes auditable in CI — `lint-claims-manifest --strict` now finds matching pages for every claim and any future drift fails the build**.

**Acceptance Criteria:**

**Given** Story 2.7 populated `METHODOLOGY_CLAIMS.json` with claim IDs,
**When** the Scoring pages are authored,
**Then** each page's frontmatter `asserts:` lists the matching claim IDs: `/scoring/irt-2pl/` asserts `irt-2pl-model`; `/scoring/eap/` asserts `eap-estimation-method`, `quadpts-61`, `theta-lim-pm-6`, `prior-standard-normal`; `/scoring/percentile-to-iq/` asserts `percentile-from-standard-normal-cdf`, `iq-scale-mean-100-sd-15`; `/scoring/golden-vectors/` asserts `golden-vector-parity-0.001-logits` and pins the R 4.4.x + mirt 1.41.x + `set.seed(20260514)` reference implementation per NFR22
**And** `lint-claims-manifest --strict` passes with zero unmatched claims after all 6 Scoring pages exist.

**Given** Norming pages disclose the SAPA-sample bias openly (Risk #3),
**When** `/norming/sapa-sample/`, `/norming/representativeness/`, `/norming/flynn-effects/` are authored,
**Then** each is at FK ≤12; `/norming/representativeness/` explicitly discloses the young-online-educated skew and its measurement implications; `/norming/flynn-effects/` addresses the cohort-effect honestly
**And** the result-page caveat (Epic 6, FR23) links into these pages.

### Story 5.5: Ethics (2 remaining) + Provenance (2 remaining) + Reference (3 remaining)

As a **reader, contributor, or citer needing institutional/governance context**,
I want **the remaining Ethics (`apa-standards`, `anti-credentialization`), Provenance (`iq-me-license`, `methodology-claims`), and Reference (`citation`, `changelog`, `bibliography`) pages authored**,
So that **the full Diátaxis reference quadrant is in place, the changelog is the authoritative drift-tracking surface, and the Reference/citation page is the canonical home for the Cite-this-page widget's full expansion**.

**Acceptance Criteria:**

**Given** Ethics pages align IQ-ME with APA testing standards (advisory, not regulatory),
**When** `/ethics/apa-standards/` is authored,
**Then** it cites the APA, AERA, NCME *Standards for Educational and Psychological Testing* (2014) and explains how IQ-ME aligns with score-transparency / norming-disclosure provisions without claiming regulatory submission
**And** `/ethics/anti-credentialization/` documents the design choices that make the result page un-screenshot-friendly (FR24) and the absence of share/certificate/badge UI (FR25).

**Given** `/provenance/methodology-claims/` is the canonical reader-facing surface for the `METHODOLOGY_CLAIMS.json` ↔ methodology-page coupling,
**When** the page is authored,
**Then** it renders the current snapshot of `METHODOLOGY_CLAIMS.json` as a human-readable table with engine source path + matching methodology page link per claim
**And** the page auto-updates via the build pipeline when claims change (no manual sync).

**Given** `/reference/changelog/` is referenced from FR45 (artifact slot) and from every version-mismatch hatnote,
**When** the page is authored,
**Then** it carries an initial v0.1.0 entry listing the Epic-3-stub-page set, a v0.5.0-anchor-pages-frozen entry, and the v1.0.0 release placeholder
**And** the changelog is structured for `release.yml` (Epic 8) to append entries automatically on tag.

**Given** `/reference/citation/` is the full APA + Wikipedia-template + BibTeX home (BibTeX deferred per scoping),
**When** the page is authored,
**Then** it explains the per-corpus-release versioning policy (NFR25), the DOI permanence guarantee (NFR25), and the Internet Archive + Software Heritage archival redundancy commitment (NFR18)
**And** the page is FK ≤12 and exercises every `lint-` from Epic 4.

### Story 5.6: Tail Scenes EN placeholders (reviewer-of-record TBD)

As a **tester from the Gate 9e cohort who reaches a bottom-decile or top-decile result on the Epic 6 build**,
I want **EN placeholder tail-scene pages at `/tails/bottom-decile/` and `/tails/top-decile/` to exist so the methodology-handoff click resolves to a real page**,
So that **the structural surface is exercised by EN testers even while the RU/PL clinical-register copy is in flight via Gates 9c/9d — and the real clinical-register-reviewed versions replace these placeholders in Epic 7**.

**Acceptance Criteria:**

**Given** Gates 9c/9d for clinical-register translators are post-Epic-2-outreach and may close after Epic 5,
**When** `/tails/bottom-decile/` is authored in EN,
**Then** the page carries frontmatter `reviewer: "@TBD-en-clinical-register"`, `reviewerHandle: "@TBD-en-clinical-register"`, `lastReviewed: "pending"`, and an explicit content header: "**EN placeholder — awaiting clinical-register-reviewer-of-record sign-off via Gate 9b/9c**"
**And** the page's body is a careful EN draft that exercises the methodology handoff but is *explicitly* not the canonical version.

**Given** `/tails/top-decile/` follows the same posture,
**When** the page is authored,
**Then** it addresses the anti-credentialization framing (Daria journey) at FK ≤12
**And** the page links to `/ethics/anti-credentialization/` (Story 5.5) and to `/limitations/retest-effects/` (Story 5.3).

**Given** the per-language native-language resource list (FR20) is shipped as a separate static asset per architecture,
**When** `src/content/crisis-resources/en.json` is committed,
**Then** it contains a curated list of English-language mental-health and crisis-support resources with `lastVerified` dates (per architecture)
**And** the bottom-decile tail-scene page references this asset's data via the i18n harness.

### Story 5.7: Phase-2 components (eap-shrinkage-diagram + tail-aware-trail) — ship-if-budget-allows

As a **methodology corpus reader who would benefit from a visual aid for EAP shrinkage at the tails, or from a curated 2-step reading trail per Diátaxis**,
I want **the eap-shrinkage diagram and the tail-aware-trail component to ship in v1 if the budget allows — otherwise to slip to v1.0.1 with explicit deferral notes**,
So that **the Phase-2 UX nice-to-haves are tracked and don't get silently dropped or silently included**.

**Acceptance Criteria:**

**Given** UX-DR29 designates `eap-shrinkage-diagram` as a Phase-2 component,
**When** the maintainer evaluates the cognitive-load budget at end-of-Story-5.6,
**Then** before implementation, the maintainer runs `wc -l src/css/**/*.css` (per Sally — mechanical, not vibes); if total > 1200 LOC, defer to v1.0.1 with `CHANGELOG.md` deferred-feature entry; if ≤ 1200 LOC, proceed with implementation in `/methodology/scoring/eap/`
**And** the decision is recorded as a single line in this story file: "Decision: SHIP (date) — current LOC: N/1500" or "Decision: DEFER (date) — current LOC: M/1500".

**Given** UX-DR13 designates `tail-aware-trail` as a Phase-2 component,
**When** the same budget evaluation runs,
**Then** the same ship-or-defer logic applies; if shipped, the component renders a 2-step curated reading path on each methodology page; if deferred, the page renders without the trail and the deferral is documented.

**Given** v1.0.1 is the explicit escape valve for Phase-2 work,
**When** v1.0.1 work begins post-launch,
**Then** the deferred components are the first stories of the v1.0.1 backlog
**And** the deferral does not block v1.0.0 launch.

---

## Epic 6: Assessment SPA Hardening — Full Ceremony, Asymmetric Tail-Scenes, Anti-Credentialization

A test-taker experiences the complete score-delivery ceremony designed in the UX spec. Epic 3's contract artifacts (state schema, reveal-stage event, methodology-URL) are *graduated* additively. Epic 5's methodology visual system is locked, so SPA hardening lands into a stable visual world (Sally's "land into" requirement). EN clinical-register copy is placeholder until Gates 9c/9d translators close. The cropping fuzzer is gated on item-bank-frozen flag per Murat.

### Story 6.1: Full 5-beat iqme:reveal-stage event + score-panel computed-style Playwright assertion

As a **test-taker experiencing the score-delivery ceremony**,
I want **the reveal sequence to unfold in five named beats (anchor → band → interval → context → tail-scene → methodology-handoff) per the UX spec, with the co-equal-triplet invariant enforced at runtime via computed-style assertion (graduating Epic 3's CSS-source lint per Murat's two-tier defense)**,
So that **the designed ceremony (PRD Innovation #3) is real and the triplet visual equity is bulletproof across themes / locales / device pixel ratios**.

**Acceptance Criteria:**

**Given** Story 3.1 ADR pinned the v1 stage enumeration as `anchor|band|interval|context|tail-scene|methodology-handoff`,
**When** `src/assessment/reveal-stage.js` is expanded,
**Then** it dispatches all 5 stages in the declared order on the result page, each with `{ detail: { stage, t: performance.now() } }`, with dwell timings sourced from `src/assessment/reveal-stage-timings.json` (configurable per per-band variant)
**And** the contract from Story 3.1 (no rename / no reorder / no remove) is preserved — Epic 3's 2-beat behavior is a strict subset.

**Given** the score-panel CSS-source co-equal lint from Story 3.5 catches source-level violations only,
**When** `tests/playwright/co-equal-triplet-computed-style.spec.mjs` is activated (the slot from Epic 1's CI matrix),
**Then** the Playwright spec renders the score panel across (a) light + dark themes, (b) all three locales (EN-only at this epic; RU/PL added in Epic 7), (c) viewport widths 320, 768, 1280,
**And** asserts (FR18, UX-DR22): bounding-box area ratios within ±15% pairwise across `.score-panel__anchor`, `.score-panel__percentile`, `.score-panel__band`; font-size delta within 2px; vertical baseline alignment within 4px; font-weight differential ≤100.

**Given** the reveal-stage Playwright event-ordering spec already exists (Epic 1 matrix slot),
**When** the spec is updated to assert the full 5-beat sequence,
**Then** the test drives the SPA from session-complete through the full reveal and verifies every stage fires exactly once, in order, with monotonically increasing `t` values
**And** any contract violation (stage skip, stage repeat, out-of-order) fails the build with a clear stage-name diagnostic.

### Story 6.2: Per-item-difficulty breakdown (easy/medium/hard tercile)

As a **test-taker who completed the 16-item session**,
I want **a single declarative sentence on the score panel reporting my fraction-correct within easy / medium / hard difficulty bands**,
So that **I can interpret the score in context (a low score with all-hard-items-attempted reads differently than a low score with all-easy-items-missed per FR22)**.

**Acceptance Criteria:**

**Given** FR22 partitions items into easy/medium/hard bands by IRT b-parameter terciles within the v1 pool,
**When** `src/items/item-parameters.json` is committed (per architecture gap #1),
**Then** the file contains the full ICAR-MR item set with `b` parameters, and `tools/compute-difficulty-bands.mjs` derives the tercile cutoffs and assigns each item to a band
**And** the band assignments are emitted as `src/items/item-difficulty-bands.json` (build-time, deterministic, gitignored regenerable file).

**Given** the score panel renders the difficulty-sentence (UX-DR22),
**When** `.score-panel__difficulty-sentence` is rendered,
**Then** the sentence reads (EN; locale-keys for RU/PL in Epic 7): "Of the {N} hard, {M} medium, and {K} easy items, you answered {hardCorrect} / {N}, {medCorrect} / {M}, and {easyCorrect} / {K} correctly."
**And** the sentence sits at `--font-size-200` (16px per UX-DR3) below the triplet — visually subordinate, "reads as a footnote that earns attention" per UX spec.

**Given** the band taxonomy must be documented (per FR22),
**When** `/methodology/constructs/icar-mr/` and `/methodology/scoring/overview/` are inspected,
**Then** both pages describe the easy/medium/hard band derivation methodology and explicitly distinguish it from the qualitative ability band on the score itself
**And** Epic 5 Stories 5.3 + 5.4 authored these descriptions; Story 6.2 verifies the cross-links resolve correctly.

### Story 6.3: Mid-session bail-out with discard/continue choice

As a **test-taker who realizes mid-session that this is not a good time**,
I want **a visible bail-out affordance that, when clicked, explains an incomplete test cannot produce a meaningful score and offers Continue / Discard (FR4 — no silent partial scoring)**,
So that **I can exit honestly (Mikhail journey's mid-session bail option) without producing a phantom score and without state lingering for future leakage**.

**Acceptance Criteria:**

**Given** FR4 forbids silent partial scoring,
**When** the item-runner renders,
**Then** a small "End the test early" affordance is visible (top-right of the item card; not prominent enough to invite easy abandonment, prominent enough to find when needed)
**And** clicking it does NOT exit — it opens an in-place explanation: "An incomplete test cannot produce a meaningful score. Discard responses / Continue."

**Given** the user clicks Discard,
**When** the action fires,
**Then** `state.js` is reset to initial (no responses retained), no `localStorage` is written, the user lands back at the landing page
**And** a test asserts the session-state object is empty after discard.

**Given** the user clicks Continue,
**When** the action fires,
**Then** the in-place explanation closes and the user resumes the item they were on with all prior responses intact
**And** the reveal-stage event is not affected — no spurious beat fires.

### Story 6.4: Chrome components (chrome-header + chrome-footer + theme-toggle)

As a **test-taker or reader on any persistent surface (landing, consent, result, methodology page)**,
I want **a chrome header with project name + language switcher and a chrome footer with methodology link + dark-mode toggle + GitHub Discussions link + citation reference**,
So that **UX-DR7 + UX-DR8 + UX-DR10 components exist as visually coherent persistent chrome — and the dark-mode toggle honors `prefers-color-scheme` while permitting explicit user override**.

**Acceptance Criteria:**

**Given** UX-DR7 designates `chrome-header` as persistent across landing, consent, result, methodology pages,
**When** `src/css/components/chrome-header.css` is implemented,
**Then** it renders project name on the left, language switcher placeholder on the right (EN-only at this epic; RU/PL switching activates in Epic 7), with `--space-page-padding-y` top spacing
**And** the chrome header is *hidden on item-runner* (per UX-DR8) — the item-runner is a focus surface.

**Given** UX-DR8 designates `chrome-footer` similarly,
**When** `src/css/components/chrome-footer.css` is implemented,
**Then** it renders a methodology corpus link, a tri-state dark-mode toggle, a GitHub Discussions link (FR52), and a citation reference link to `/reference/citation/`
**And** the chrome footer is also hidden on item-runner.

**Given** UX-DR6 designates dark mode as a separately-designed palette and UX-DR10 designates a tri-state toggle (System / Light / Dark),
**When** `src/css/components/theme-toggle.css` + `src/assessment/theme.js` are implemented,
**Then** the toggle is keyboard-first, sets `[data-theme="dark|light"]` on `<html>` for explicit overrides, falls back to `@media (prefers-color-scheme: dark)` when set to System (default), and persists the choice to `localStorage` only on explicit click (NFR9)
**And** Lighthouse-in-CI verifies both themes meet WCAG 2.2 AA contrast (NFR12).

### Story 6.5: Asymmetric tail-scenes EN (bottom + mid + top) + silent-companion-line + EN crisis-resource list

As a **test-taker reaching a bottom-decile (Mikhail), mid-band (Anna), or top-decile (Daria) result**,
I want **the score panel to render a tail-scene composition matched to my decile, with EN clinical-register placeholder copy (real reviewer-TBD until Gates 9c/9d/equivalent EN reviewer closes) and an EN crisis-resource list spatially privileged for the bottom-decile scene**,
So that **the asymmetric scene composition (UX Innovation #5; FR19, FR20 EN; UX-DR23/24/25/26) is real for the tester cohort while RU/PL clinical-register copy is in flight**.

**Acceptance Criteria:**

**Given** UX-DR23/24/25/26 designate three tail-scene variants + a silent-companion-line,
**When** `src/css/components/tail-scene-{bottom,mid,top}.css` + `silent-companion-line.css` are implemented,
**Then** each is a distinct CSS file per the one-component-per-file rule, each adapts the score-panel via `.score-panel--bottom-decile / --mid-band / --top-decile` modifier classes per UX-DR22 variants
**And** the bottom-decile composition renders `silent-companion-line` immediately below the score with locale-native non-interactive copy (EN at this epic — placeholder; clinical-register RU/PL replace in Epic 7).

**Given** FR19 forbids translation of tail-scene copy from English (clinical-register-authored per language),
**When** `src/content/i18n/en/tail-scenes.json` is committed,
**Then** the file contains EN copy for bottom-decile, mid-band, top-decile tail scenes with frontmatter-equivalent metadata `reviewer: "@TBD-en-clinical-register"`, `lastReviewed: "pending"`, `clinicalRegisterReviewed: false`
**And** the result-page wiring reads from this file (no hardcoded strings).

**Given** FR20 requires per-language crisis-resource lists shipped statically (no geolocation, no third-party fetch),
**When** `src/content/crisis-resources/en.json` is committed,
**Then** it contains a curated list of English-language mental-health and crisis-support resources with `name`, `description`, `url`, `phone` (if applicable), `lastVerified` fields
**And** the bottom-decile tail-scene renders these resources via `src/assessment/crisis-resources.js` which loads only the active locale's file (no cross-locale loading).

**Given** the tail-scene composition selection is driven by the scoring result,
**When** `scoreSession()` returns a percentile,
**Then** `src/assessment/tail-scene-router.js` selects bottom (P ≤ 10), top (P ≥ 90), or mid composition per the PRD threshold definitions
**And** a unit test asserts the threshold cutoffs round-trip correctly.

**Given** the crisis-resources file shape must be schema-stable across Epic 6 (EN) and Epic 7 (RU + PL) per Amelia,
**When** `src/content/crisis-resources/crisis-resources.schema.json` is committed alongside `crisis-resources/en.json`,
**Then** the schema defines: `{ resources: array of { name: string, description: string, url: string, phone: string?, lastVerified: date } }`
**And** `lint-frontmatter` (Story 4.3, extended) validates all locale crisis-resource files against this schema.

**Given** Sally's bottom-decile self-walkthrough discipline (recruiting vulnerable testers to do QA is ethically expensive),
**When** Story 6.5 is implemented,
**Then** the maintainer personally walks Mikhail's path on the build BEFORE any tester (Gate 9e) sees it: low-score happy-path → bottom-decile tail-scene → silent-companion-line presence verified → crisis-resources link liveness verified → tonal register checked against anchor-page register from Epic 5
**And** the maintainer's walkthrough notes are committed as `_evidence/6.5-self-walkthrough.md` with explicit pass/fail per checkpoint.

### Story 6.6: Top-decile tear-edge overlay + cropping fuzzer

As a **top-decile test-taker (Daria journey)**,
I want **the score-panel composition to visually bind the caveat + uncertainty band to the score such that producing a clean decontextualized screenshot requires deliberate editing (FR24, Innovation #4)**,
So that **the anti-credentialization-by-composition is mechanically enforced — and the cropping fuzzer in CI catches future regressions of the tear-edge invariant**.

**Acceptance Criteria:**

**Given** UX-DR25 designates the top-decile composition with active tear-edge overlay,
**When** `.score-panel--top-decile .score-panel__tear-edge` is implemented,
**Then** the tear-edge overlay visually overlaps the boundary between the score numerals and the caveat at all viewport widths from 320px to 1440px
**And** a Playwright test screenshots the rendered top-decile composition and verifies the tear-edge SVG bounding box overlaps the caveat element bounding box.

**Given** Murat's cropping-fuzzer + bank-frozen-flag gating,
**When** `tools/cropping-fuzzer.mjs` is implemented and `tests/playwright/cropping-fuzzer.spec.mjs` activated,
**Then** the fuzzer generates N synthetic crops of the rendered top-decile score panel at random crop windows, runs each through a "does the caveat survive cropping?" assertion (the caveat text must appear in the cropped image OR the crop must include neither the score nor the caveat — partial crops that show score-only fail)
**And** the spec is conditionally enabled by the `data-bank-frozen="true"` manifest flag (per Murat — avoids alert-fatigue from late content edits during Epic 5).

**Given** the item-bank is frozen at end-of-Epic-5,
**When** the maintainer flips `corpus/manifest.json` `bankFrozen: true`,
**Then** the cropping fuzzer spec activates on every PR
**And** any PR that breaks the tear-edge composition fails CI with a labeled image diff.

### Story 6.7: Opt-in localStorage save + retest-effect copy on result page

As a **test-taker who wants to revisit my result later**,
I want **an explicit "Save my result" affordance on the score panel that writes to `localStorage` only on explicit click (FR26, NFR9), and a retest-effect explanation visible on the result page itself (FR27 — not buried in the methodology corpus)**,
So that **the opt-in save discipline is mechanically enforced and the no-cooldown retest discipline is honest at the moment of consequence**.

**Acceptance Criteria:**

**Given** FR26 requires opt-in localStorage save with no automatic writes,
**When** `.score-panel__save-button` is implemented,
**Then** the button is visible but not pre-selected, no checkmark, no auto-save
**And** clicking it writes a single `localStorage` entry (`iqme:saved-result:<seed-hash>`) with the scoring artifact + timestamp; no other `localStorage` operations occur.

**Given** NFR9 requires first-render correctness without `localStorage`,
**When** the page loads on a browser with empty `localStorage`,
**Then** the score panel renders normally, the Save button is in its default state, no error appears
**And** a test asserts no `localStorage.getItem` returns non-null at first render.

**Given** FR27 requires retest-effect copy on the result page,
**When** the `.score-panel__retest-note` is rendered,
**Then** it contains a 50–100 word locale-native explanation (EN at this epic; RU/PL in Epic 7) that (a) the ICAR-MR item pool is small, (b) immediate retesting produces a correlated not independent estimate, (c) no technical cooldown is enforced — honesty over restriction
**And** the note links to `/methodology/limitations/retest-effects/` (from Epic 5 Story 5.3).

**Given** the opt-in save must not contaminate the zero-third-party invariant,
**When** the user clicks Save,
**Then** the network trace from Epic 1's Playwright spec shows zero additional requests
**And** the integration is purely local.

---

## Epic 7: RU + PL Localization + Per-Language Reviewer Discipline

Russian- and Polish-speaking users (PRD's primary underserved audience) can complete the full test and read the full methodology corpus in their language. Tail-scene copy is clinical-register-authored per language (depends on Gates 9c/9d closing). Block-level content-key parity is build-time enforced across all three locales. Non-EN content-key changes require dual-approval.

### Story 7.1: i18n harness + locale loading + language-switcher

As an **EN/RU/PL-speaking visitor**,
I want **to select my locale at landing time (FR37) and have the entire UI render in my language (FR38) — landing, consent, item instructions, item-option labels, progress indicator, result-page copy, methodology corpus links**,
So that **the primary underserved audience (Russian- and Polish-speaking adults) is fully served and the language-switcher in the chrome-header (UX-DR9) works end-to-end**.

**Acceptance Criteria:**

**Given** the architecture pins locale files at `src/content/i18n/{lang}/{namespace}.json`,
**When** `src/assessment/i18n/locale-loader.js` is implemented,
**Then** it loads only the active locale's namespace files (`landing`, `consent`, `item-runner`, `result`, `tail-scenes`, `chrome`) on demand, falls back to `'en'` for unsupported locales (per Architecture gap #2 — `const SUPPORTED = ['en', 'ru', 'pl']`), and exposes a `t(key)` translator function
**And** every UI string in every Epic-3 + Epic-6 component is replaced with a `t(key)` call (no hardcoded English strings remain in `src/assessment/**`).

**Given** UX-DR9 designates a keyboard-first language switcher,
**When** `src/css/components/language-switcher.css` + `src/assessment/language-switcher.js` are implemented,
**Then** the switcher renders in `chrome-header` (Epic 6 Story 6.4) as a keyboard-first dropdown or tab-list, persists the choice to `localStorage` ONLY on explicit user click (NFR9), and reloads the page with the new active locale
**And** first-render correctness with empty `localStorage` is preserved.

**Given** FR38 requires all UI surfaces in the chosen language,
**When** a user selects RU or PL at landing,
**Then** every component (landing, consent-scene, item-runner, progress-indicator, score-panel, tail-scenes, chrome-header, chrome-footer) renders in the active locale
**And** a Playwright test runs the full happy-path in each of the three locales and asserts no untranslated English strings appear (regex-based detection of English-only stopwords in RU/PL contexts).

### Story 7.2: locale-switch-blocker-hint + FR8 enforcement

As an **RU- or PL-speaking test-taker who started a session and then attempts to switch language mid-session**,
I want **a teachable-moment in-place hint (UX-DR27) that explains why locale-switching is blocked during measurement (FR8 — measurement invariance) without being paternalistic**,
So that **I understand the rationale, can complete the session in my chosen locale or bail out (FR4 from Epic 6), and the architecture's hard FR8 invariant is enforced**.

**Acceptance Criteria:**

**Given** FR8 forbids locale switch mid-session,
**When** the language-switcher detects a switch attempt while `state.js` indicates an active session (post-consent, pre-result),
**Then** the switcher does NOT change the locale and does NOT navigate
**And** the locale-switch-blocker-hint renders in-place adjacent to the switcher.

**Given** UX-DR27 describes the hint as a teachable-moment, in-place, locale-native,
**When** `src/css/components/locale-switch-blocker-hint.css` + `src/assessment/locale-switch-blocker-hint.js` are implemented,
**Then** the hint reads (in the user's active locale): "Switching language during a test changes what the test measures. Finish this session in your current language, or end early and restart in a different language."
**And** the hint contains a link to the mid-session bail-out (Epic 6 Story 6.3) and a link to `/methodology/constructs/validity-envelope/` explaining measurement invariance.

**Given** the hint copy is per-language clinical-register-light (informational, not warning),
**When** the hint copy in RU and PL is reviewed,
**Then** it reads as informational rather than chiding, follows the no-idioms style guide (NFR31), and has sentence-length within caps (180 chars RU; 160 chars PL)
**And** the Gate 9c/9d reviewers sign off on this microcopy as part of their broader review.

### Story 7.3: Full RU methodology corpus translation (30 pages)

As a **Russian-speaking reader / citer**,
I want **the full 30-page methodology corpus in Russian, authored by a named reviewer-of-record (Gate 9c clinical-register-translator), with block-level content-key parity to EN enforced at build time**,
So that **measurement equivalence as a build-time invariant (Innovation #7) holds for RU and Russian-language Wikipedia / academic / community citations become possible (Journey 5)**.

**Acceptance Criteria:**

**Given** the EN corpus is complete from Epic 5 with 30 pages,
**When** the RU translation pass completes,
**Then** `src/content/methodology/ru/**/*.md` mirrors the EN file tree (30 RU pages), each carrying frontmatter with `reviewer:`, `reviewerHandle:`, `lastReviewed:`, and `sourceHashEN:` (the SHA256 hash of the EN source at translation time)
**And** the RU pages are authored in clinical-register-aware Russian by the Gate-9c translator (not translated from EN by AI or maintainer).

**Given** NFR27 requires block-level content-key parity with EN source-hash tracking,
**When** `tools/lint-translation-parity.mjs` runs in full-coverage mode (graduating from Epic 4 Story 4.7's no-op),
**Then** every RU page has a matching EN page (no orphans), every content key in RU has a non-stale `sourceHashEN` matching the current EN source SHA256, and any drift sets `[data-translation-stale="true"]` triggering the stale-translation hatnote (Epic 4 Story 4.7)
**And** the lint fails the build on missing keys, orphan keys, or unrecoverable drift (drift without a corresponding `sourceHashEN` bump).

**Given** Gate 9c's reviewer-of-record commits sign-off,
**When** the RU pages merge,
**Then** `.github/CODEOWNERS` is updated to replace `@TBD-ru-reviewer` (from Epic 1 Story 1.2) with the actual reviewer's GitHub handle
**And** the masthead component (Epic 4 Story 4.6) now displays the named reviewer on every RU methodology page.

### Story 7.4: Full PL methodology corpus translation (30 pages)

As a **Polish-speaking reader / citer**,
I want **the full 30-page methodology corpus in Polish, authored by a named reviewer-of-record (Gate 9d clinical-register-translator), with block-level content-key parity to EN enforced at build time**,
So that **the same measurement-equivalence invariant holds for PL and Polish-language Wikipedia external-link citation (Journey 5: Karolina) is operational**.

**Acceptance Criteria:**

**Given** the same posture as Story 7.3 applies for Polish (independent failure isolation from RU per Mary),
**When** the PL translation pass completes,
**Then** `src/content/methodology/pl/**/*.md` mirrors the EN file tree, each carrying valid frontmatter with `reviewer:`, `reviewerHandle:`, `lastReviewed:`, `sourceHashEN:`
**And** `lint-translation-parity --strict` passes for PL.

**Given** PL reviewer is separate from RU,
**When** the PL pages merge,
**Then** `.github/CODEOWNERS` is updated to replace `@TBD-pl-reviewer` with the actual reviewer's GitHub handle
**And** the masthead displays the named reviewer per PL page.

**Given** the PL/RU translation status may differ at any point,
**When** RU is fully landed but PL is partial,
**Then** `[data-translation-status="in-progress"]` is set on incomplete PL pages and the `translation-in-progress-stub` component (Epic 5 Story 5.1) renders them
**And** the language-switcher in chrome-header surfaces a "PL translation in progress — view the EN source" link for unfinished PL pages.

### Story 7.5a: Per-language reading-level calibration (RU Oborneva + PL Pisarek/Jasnopis)

As a **maintainer extending the EN reading-level lint to support RU and PL**,
I want **`lint-reading-level` calibrated for RU (Oborneva-equivalent grade) and PL (Pisarek/Jasnopis-equivalent grade), as a separate gate from translation-parity activation (per Murat — single highest-risk story split into two independent debug surfaces)**,
So that **a reading-level failure in RU or PL is debuggable on its own without entanglement with translation-parity issues**.

**Acceptance Criteria:**

**Given** NFR28 specifies per-language metrics: FK ≤12 for EN (Epic 4 Story 4.4); Oborneva-equivalent for RU; Pisarek/Jasnopis-equivalent for PL,
**When** `tools/lint-reading-level.mjs` is extended with RU + PL calibrations,
**Then** it computes the appropriate metric per locale using a committed pure-JS implementation (or vendored with SHA pin per NFR33), fails the build on any methodology page exceeding the language-appropriate cap
**And** the lint reports per-page grade against the per-language target.

**Given** SPA microcopy also needs reading-level discipline (Winston's Q4 #3),
**When** the lint runs against `src/content/i18n/**/*.json` (Story 7.1 locale strings),
**Then** it computes the per-language metric on each translated string value and fails on overlong / over-complex sentences
**And** sentence-length caps from NFR31 (25 words EN; ~180 chars RU; ~160 chars PL) are enforced as part of the same lint.

### Story 7.5b: lint-translation-parity full-coverage graduation

As a **maintainer enforcing measurement equivalence as a CI invariant (Innovation #7)**,
I want **`lint-translation-parity` (no-op stub from Story 4.7) graduated to full coverage as a separate, independent gate from reading-level (Story 7.5a)**,
So that **a parity failure in RU or PL is debuggable on its own and the simultaneous-graduation risk (Murat's highest-risk-story flag) is mitigated**.

**Acceptance Criteria:**

**Given** Story 4.7 left `lint-translation-parity` as a no-op stub,
**When** the lint is activated in full-coverage mode in this story,
**Then** it processes RU and PL frontmatter `sourceHashEN` fields, asserts every content key exists in all three locales, asserts EN-source hashes match the current EN source SHA256 in RU and PL, fails on orphans or stale hashes
**And** the lint emits a clear per-locale per-page status: "EN: source-of-truth; RU: 28/30 pages parity-green; PL: 30/30 pages parity-green".

**Given** Story 7.5a (reading-level) and Story 7.5b (parity) are independent gates,
**When** both are activated,
**Then** a failure in one does not block debugging of the other; each has its own `pr-checks.yml` job slot
**And** the maintainer can isolate the cause of any RU/PL CI failure to one of the two domains.

### Story 7.6: RU + PL tail-scene clinical-register copy (replaces Epic 6 placeholders)

As a **Russian- or Polish-speaking test-taker reaching a bottom-decile or top-decile result (Mikhail / Daria journeys in their respective languages)**,
I want **the tail-scene copy to be authored in clinical register IN MY LANGUAGE by the Gate-9c/9d reviewer-of-record (Risk #5, I3 — distress + paternalism risks), replacing the EN placeholders from Epic 6 Story 6.5**,
So that **the harm-mitigation surface is *real* for the primary underserved audience, not a translated approximation, and the project's load-bearing trust-with-vulnerable-users posture holds**.

**Acceptance Criteria:**

**Given** Epic 6 Story 6.5 committed `src/content/i18n/en/tail-scenes.json` with placeholder reviewer-TBD,
**When** Gate 9c completes Story 7.3 and the RU reviewer-of-record is named,
**Then** `src/content/i18n/ru/tail-scenes.json` is committed with full RU tail-scene copy authored by the named reviewer (not translated from EN — clinical-register-authored), frontmatter `reviewer:` and `reviewerHandle:` populated, `clinicalRegisterReviewed: true`
**And** the EN placeholder is upgraded with reviewer-of-record fields populated (an EN clinical-register reviewer also signs off; per PRD this is an Epic-8-adjacent step).

**Given** Gate 9d closes for PL,
**When** the same posture is applied for PL,
**Then** `src/content/i18n/pl/tail-scenes.json` is committed with PL clinical-register-authored tail-scene copy
**And** all three locales pass the reading-level + parity lints (Story 7.5).

**Given** the bottom-decile copy specifically must address harm-mitigation per Risk #5,
**When** the RU and PL bottom-decile copy is reviewed,
**Then** it contains: (a) acknowledgment that the result may feel difficult, (b) the spare second-person present-tense voice from UX-DR23, (c) a spatially-privileged link to the language-native crisis-resource list (Story 7.7), (d) a "what this number means" link to `/methodology/limitations/what-this-does-not-measure/`
**And** the silent-companion-line copy (UX-DR26) is also clinical-register-reviewed per language.

**Given** Sally's belt-and-suspenders enumeration (silent-companion-line + locale-switch-blocker-hint must be explicit in this story's AC),
**When** the RU and PL clinical-register sign-off is documented in `docs/launch-readiness/{ru,pl}-translator-signoff.md`,
**Then** it enumerates ALL deliverables the reviewer signed off on: (1) tail-scene-bottom copy, (2) tail-scene-mid copy, (3) tail-scene-top copy, (4) silent-companion-line copy (UX-DR26), (5) locale-switch-blocker-hint copy (UX-DR27 — Story 7.2), (6) crisis-resources list curation (Story 7.7), (7) retest-effect copy on result page (Story 6.7 — replacing EN placeholder)
**And** any deliverable not enumerated is treated as not-yet-signed-off and blocks Epic 10 launch.

### Story 7.7: RU + PL crisis-resource lists + hreflang declarations

As a **bottom-decile Russian- or Polish-speaking test-taker following the spatially-privileged link from the tail-scene to a crisis-resource list (Mikhail journey)**,
I want **the resources to be language-native (vetted by the per-language reviewer-of-record), shipped statically with no geolocation or third-party fetch, AND every methodology page to declare `hreflang` so search engines surface the right-language page on language-aware queries**,
So that **FR20 (per-language crisis resources, no geolocation) holds for RU and PL — no English-only fallback for a Russian-speaking distressed user — and FR31 (cross-language `hreflang` discoverability) enables organic Russian-Wikipedia / Polish-Wikipedia citation paths (Journey 5)**.

**Acceptance Criteria:**

**Given** FR20 requires curated native-language lists with no IP geolocation,
**When** `src/content/crisis-resources/ru.json` and `src/content/crisis-resources/pl.json` are committed,
**Then** each contains regional mental-health and crisis-support resources native to the language community (Russia + Russian-speaking diaspora for RU; Poland + Polish-speaking diaspora for PL), with `name`, `description`, `url`, `phone`, `lastVerified` fields
**And** the per-language reviewer-of-record (Gate 9c/9d) has vetted the list as part of their broader review.

**Given** the bottom-decile tail-scene renders these resources via `src/assessment/crisis-resources.js` from Epic 6 Story 6.5,
**When** an RU or PL user reaches the bottom-decile scene,
**Then** the resource list shown is from their active locale's file (no cross-locale loading, no English fallback)
**And** a test asserts the EN list is not loaded for RU/PL sessions.

**Given** FR31 requires `hreflang` declarations on every methodology page,
**When** the Epic 4 build pipeline (Story 4.1) is updated to emit `<link rel="alternate" hreflang="<lang>">` for every methodology page,
**Then** each rendered methodology page contains `hreflang="en"`, `hreflang="ru"`, `hreflang="pl"` declarations pointing to the equivalent pages in the other locales
**And** the canonical URL pattern from Story 3.1's URL contract is preserved (versioned permalinks).

### Story 7.8: CODEOWNERS + branch-protection-config artifact for dual-approval

As a **maintainer protecting against translation drift after launch (Innovation Risk I7)**,
I want **`.github/CODEOWNERS` to fully encode per-language reviewer-of-record ownership and `docs/branch-protection-config.md` to document the GitHub branch protection settings that enforce maintainer + per-language-reviewer dual-approval on non-EN content-key changes (FR49)**,
So that **the dual-approval discipline is mechanical (not cultural) — even a maintainer cannot override a missing PL-reviewer sign-off for a PL content-key change**.

**Acceptance Criteria:**

**Given** Stories 7.3 + 7.4 named the actual RU and PL reviewers,
**When** `.github/CODEOWNERS` is finalized,
**Then** it contains entries: `src/content/methodology/ru/** @<ru-reviewer-handle>`, `src/content/methodology/pl/** @<pl-reviewer-handle>`, `src/content/i18n/ru/** @<ru-reviewer-handle>`, `src/content/i18n/pl/** @<pl-reviewer-handle>`, `src/content/crisis-resources/ru.json @<ru-reviewer-handle>`, `src/content/crisis-resources/pl.json @<pl-reviewer-handle>`
**And** the maintainer is listed as a co-owner for all paths.

**Given** FR49 requires dual-approval and NFR29 specifies branch-protection enforcement,
**When** `docs/branch-protection-config.md` (Epic 1 stub) is finalized,
**Then** it documents the exact GitHub branch protection settings: require pull request reviews before merging; require review from CODEOWNERS; require status checks (all Epic-1/3/4/7 lints) to pass; disable force pushes to main; disable bypass for maintainer on non-EN content-key paths
**And** the document includes a screenshot or YAML/JSON export of the actual GitHub branch-protection rules.

**Given** the dual-approval must be tested without contaminating the live repo,
**When** a synthetic PR is opened proposing a single-line change to `src/content/methodology/pl/scoring/overview/index.md`,
**Then** GitHub shows the PR as blocked-from-merge until both the maintainer and the PL reviewer-of-record approve
**And** the test scenario is documented in `docs/branch-protection-config.md` as a regression-recovery playbook.

---

## Epic 8: Trust-Verification Surface + Mirror Failover + Archival Permanence

A skeptic verifies zero-third-party network trace in ≤30 seconds via DevTools — the full Playwright + CSP + viewport-overflow + Lighthouse + axe-core/pa11y suite is consolidated. Every tagged release auto-mirrors (Codeberg/Cloudflare byte-identical + Internet Archive + Software Heritage + Zenodo DOI). Contributors find the full PR workflow + reviewer-of-record discipline in `CONTRIBUTING.md`. Per-release `CHANGELOG.md` credits contributors by handle.

### Story 8.1: release.yml workflow — app-v* + corpus-v* tag triggers + deployment

As a **maintainer cutting v1.0.0**,
I want **the `release.yml` GitHub Actions workflow (stub from Epic 1) to be fully implemented with separate triggers for `app-v*` tags (deploys SPA to GitHub Pages + mirror) and `corpus-v*` tags (deploys methodology corpus + mints Zenodo DOI + archives to IA + SH)**,
So that **the decoupled app and corpus version namespaces (architecture decision D7) operate independently and v1.0.0 launch is a coordinated double-tag**.

**Acceptance Criteria:**

**Given** Epic 1 shipped `release.yml` as a stub `echo "Activates in Epic 8"`,
**When** the workflow is fully implemented,
**Then** it has two distinct jobs gated by tag pattern: `app-release` (triggered by `app-v*` tags) and `corpus-release` (triggered by `corpus-v*` tags), each with its own steps
**And** the `app-release` job builds the SPA artifact (no-op since runtime-zero-build per NFR21), runs the full lint + test suite from `pr-checks.yml`, and deploys to GitHub Pages.

**Given** the `corpus-release` job orchestrates per-corpus-release re-emit (NFR25),
**When** a `corpus-v<X>.<Y>.<Z>` tag is pushed,
**Then** the job invokes `make build-methodology --corpus-version v<X>.<Y>.<Z>`, deploys the resulting `dist/methodology/` tree to GitHub Pages canonical path
**And** the per-corpus-release re-emit semantics (every page re-emits regardless of content change) are exercised end-to-end.

**Given** the v1.0.0 launch requires coordinated app-v1.0.0 + corpus-v1.0.0 (Architecture's "coordinated double-tag"),
**When** both tags are pushed,
**Then** both jobs run, both deploy successfully, and the app shell's footer link to methodology resolves to the just-deployed corpus version (via `git describe --tags --match 'corpus-v*' --abbrev=0` substituted into the SPA shell at build time)
**And** the byte-stable build assertion (Epic 4) passes against the deployed artifact.

### Story 8.2: Zenodo DOI minting + Internet Archive + Software Heritage on corpus-v*

As a **citer (Karolina journey) resolving a Zenodo DOI two years post-launch**,
I want **every tagged corpus release to mint a Zenodo DOI, snapshot to Internet Archive Save Page Now, and archive to Software Heritage's `save` endpoint — automatically, triggered by the `corpus-v*` release tag (FR30, FR46, NFR18)**,
So that **the citability vision (Journey 5) operates at scale (Wikipedia editors, course instructors, paper authors don't need maintainer intervention to get a stable citation) and Internet-Archive-level permanence holds**.

**Acceptance Criteria:**

**Given** the GitHub-Zenodo integration is configured (one-time setup outside CI),
**When** a `corpus-v*` tag is pushed and `release.yml` runs,
**Then** Zenodo mints a DOI for the release, the DOI is fetched via Zenodo API, written to `corpus/doi.json` (or `CITATION.cff` directly), and the cite-this-page widget (Epic 4 Story 4.6) on every page now resolves with a real DOI rather than "DOI: pending" (per John's visible-fallback)
**And** the next build emits methodology pages with the populated DOI.

**Given** FR46 requires per-release Internet Archive snapshots,
**When** the `corpus-release` job step "snapshot-to-internet-archive" runs,
**Then** it invokes the Save Page Now API (`https://web.archive.org/save/<url>`) for the corpus root + key pages (the FR36-protected page, the citation page, every reference page), waits for confirmation, and records the IA snapshot URLs in `docs/launch-readiness/internet-archive-snapshots.md`
**And** failure to snapshot does NOT fail the build (mirror is best-effort) but DOES open a labeled GitHub Issue per the `scheduled.yml` failure-routing pattern (Story 8.3).

**Given** Software Heritage requires the `save` endpoint per Architecture's external integrations,
**When** the same release job invokes `https://archive.softwareheritage.org/api/1/origin/save/git/url/<repo-url>`,
**Then** the response is recorded in `docs/launch-readiness/software-heritage-snapshots.md`
**And** the SH-archived repo provides a permanent source-code mirror beyond GitHub.

**Given** scoping designated IA + SH auto-mirror as "v1.0.1 nice-to-have" (per PRD scoping),
**When** the maintainer assesses whether to ship in v1 vs slip,
**Then** this story can split: 8.2a (Zenodo, must-ship for citability) + 8.2b (IA + SH, may slip to v1.0.1 with manual fallback at launch)
**And** the deferral decision is documented in `CHANGELOG.md` per the explicit-deferral discipline.

### Story 8.3: scheduled.yml workflow — mirror parity + archival health + failure routing

As a **maintainer running a solo project with no email/Slack integrations (NFR6)**,
I want **the `scheduled.yml` workflow (stub from Epic 1) to run weekly mirror-parity + archival-snapshot health checks and route failures to labeled GitHub Issues (per Architecture's John gap #6)**,
So that **silent drift is caught (canonical and mirror diverging, IA snapshot 404ing, Zenodo DOI not resolving) and the maintainer's weekly triage has a single dashboard (no third-party monitoring SaaS)**.

**Acceptance Criteria:**

**Given** the workflow runs weekly via cron,
**When** `scheduled.yml` is fully implemented,
**Then** it has jobs for: `mirror-parity-check` (compares response body of canonical GitHub Pages URL vs Codeberg/Cloudflare mirror URL for key pages — headers exempted per architecture); `internet-archive-snapshot-health` (HEAD-requests recorded IA snapshot URLs and asserts 200); `software-heritage-snapshot-health` (similar); `zenodo-doi-resolution` (HEAD-requests recorded DOIs and asserts resolution to a real Zenodo record)
**And** each job has a per-job `area:<check-name>` label.

**Given** any check failure must open a GitHub Issue (per Architecture's failure routing),
**When** a job fails,
**Then** the workflow's failure handler (using `gh` CLI or actions/github-script) opens an Issue labeled `area:scheduled-check` + `area:<specific-check>` (e.g. `area:mirror-health`, `area:archive-health`, `area:doi-health`), with the failure context, the broken URL(s), and a link to the action run
**And** if an Issue with the same label set is already open, the new failure appends a comment rather than opening a duplicate.

**Given** `docs/scheduled-yml-failure-routing.md` (Epic 1 stub) documents this contract,
**When** the document is finalized in this story,
**Then** it explains the weekly cadence, the per-check labels, the triage discipline ("maintainer triages weekly; no email/Slack notification"), the per-check mitigation playbooks, the mirror-parity response-body-only check (headers exempted)
**And** the `docs/scheduled-yml-failure-routing.md` is referenced from `CONTRIBUTING.md`.

**Given** Winston's intra-epic sequencing concern (if 8.3 mirror-parity check fires before 8.4 mirror-deploy exists, the first scheduled run fails comparing-to-nothing),
**When** `scheduled.yml`'s `mirror-parity-check` job is implemented,
**Then** the job is self-gating: it first HEAD-requests the mirror URL, and if the response is non-200 (e.g. mirror not yet deployed), it skips the parity comparison and logs a "mirror not reachable — first deploy pending" notice rather than failing
**And** the AC asserts this self-gating: Story 8.3 can land before Story 8.4 without producing spurious failures.

### Story 8.4: Mirror failover deployment to Codeberg/Cloudflare (byte-identical artifact verification)

As a **Russia-based user whose ISP has blocked GitHub Pages (Risk #8)**,
I want **the Codeberg Pages (or Cloudflare Pages) mirror to host a byte-identical artifact accessible at a documented secondary domain — and the mirror to be triggered by the same `release.yml` workflow as the canonical**,
So that **the Russia hosting block (Risk #8 / NFR17 mirror-readiness) is mitigated without a JS-based detection redirect (PRD §Mirror Strategy — "no automatic redirect, no JS-based detection")**.

**Acceptance Criteria:**

**Given** NFR17 requires mirror-readiness with byte-identical artifact,
**When** the mirror is set up (one-time outside CI — manual repo creation on Codeberg, DNS setup, secrets in GitHub Actions),
**Then** `release.yml` includes a `deploy-to-mirror` job that pushes the same `dist/` artifact to the Codeberg/Cloudflare endpoint
**And** a byte-identical-artifact assertion runs post-deploy: fetches the same path from canonical + mirror, compares SHA256 hashes for the SPA index + at least one methodology page + the LICENSES.md + the CITATION.cff, fails the build on any mismatch.

**Given** the mirror domain is announced via GitHub Discussions and README (per PRD §Mirror Strategy),
**When** the README is updated in this story,
**Then** it documents the canonical URL, the mirror URL, the trigger-policy ("manual failover within one day of sustained outage or regional block detection"), and explicitly states no automatic redirect
**And** the `chrome-footer` (Epic 6 Story 6.4) does NOT include a mirror-link — discoverability is via README/Discussions only.

**Given** the same artifact must run on both hosts (mirror-readiness as architectural property per NFR17),
**When** the artifact is tested on the mirror,
**Then** the full Playwright happy-path (Epic 3 Story 3.7) runs against the mirror URL and passes — no GitHub-Pages-specific path tricks, all relative asset paths resolve correctly
**And** any mirror-specific failure is a release-blocker.

### Story 8.5: Full Playwright trust-verification suite consolidation

As a **skeptic running the full verification pass before recommending the project**,
I want **the complete Playwright + CSP + viewport-overflow + Lighthouse + axe-core/pa11y suite running on every PR and on the live deployment (FR41 full DevTools-verifiable surface)**,
So that **every PR mechanically asserts the project remains *as-described*: zero third-party, strict CSP, no horizontal scroll at any viewport, performance budgets met, WCAG 2.2 AA contrast**.

**Acceptance Criteria:**

**Given** Epic 1 shipped the strict network-trace and Epic 3 exercised it on the vertical slice,
**When** Epic 8 consolidates the full suite,
**Then** `tests/playwright/trust-verification.spec.mjs` runs: network-trace (already in place), CSP-violation count (uses `page.on('pageerror')` and asserts zero CSP violations across the full happy-path including methodology corpus pages), viewport-overflow (iterates 320 / 375 / 414 / 768 / 1024 / 1280 / 1440 widths and asserts no horizontal scroll on any rendered surface per architecture's NFR1 implication), and is gated in `pr-checks.yml` as the `trust-verification-full` job (the slot from Epic 1)
**And** the spec runs in <90 seconds end-to-end on CI.

**Given** Lighthouse-in-CI enforces performance budgets (NFR1),
**When** `tests/perf/lighthouserc.json` is fully populated and `npx lhci autorun tests/perf/lighthouserc.json` runs in `pr-checks.yml`,
**Then** the assertions enforce: FCP < 1.5s, LCP < 2.5s, TTI < 3.0s, CLS < 0.05, all on mid-tier Android Slow 4G emulation
**And** any PR that regresses below threshold fails the build.

**Given** axe-core/pa11y enforces WCAG 2.2 AA (NFR12),
**When** `tests/a11y/*.spec.mjs` is wired into `pr-checks.yml`,
**Then** axe-core runs against every methodology page + every SPA surface (landing, consent, item-runner, result, tail-scenes); pa11y is the fallback runner
**And** any contrast / keyboard / landmark / aria violation fails the build.

**Given** the `cropping-fuzzer` (Epic 6 Story 6.6) is gated on `bankFrozen: true`,
**When** the item-bank-frozen manifest flag is set at end-of-Epic-6,
**Then** the fuzzer runs on every PR in this epic forward
**And** the consolidated trust-verification suite includes the fuzzer's pass/fail.

### Story 8.6: Full CONTRIBUTING.md + branch-protection-config + required-ci-checks + scheduled-yml-failure-routing docs

As a **future contributor (Marek journey from PRD) opening their first PR**,
I want **the full `CONTRIBUTING.md` to document the PR workflow, the per-language reviewer-of-record discipline, the linter expectations, and the failure-routing for scheduled checks — replacing Epic 1's slim stub (FR47)**,
So that **a translator like Marek can find the workflow, see who the reviewer-of-record is, and understand what their PR will be checked against without asking the maintainer**.

**Acceptance Criteria:**

**Given** Epic 1 shipped a slim `CONTRIBUTING.md` stub,
**When** the full version is authored in this story,
**Then** it documents: how to fork, branch, and open a PR; the CI checks that will run (linking to `docs/required-ci-checks.md`); the dual-approval requirement for non-EN content-key changes (FR49, linking to `docs/branch-protection-config.md`); the per-language reviewer-of-record discipline (linking to `CODEOWNERS`); how to propose translation improvements; how to propose methodology corpus changes (claims-manifest manifest coupling)
**And** the document is in the corpus's plain-language style — passes `lint-reading-level` if it were a corpus page.

**Given** `docs/required-ci-checks.md` (Epic 1 stub) needs full enumeration,
**When** the document is finalized,
**Then** it lists every CI check from `pr-checks.yml` + `scheduled.yml`, what each enforces, what triggers it, what failure looks like, and how to fix
**And** every entry links to the corresponding lint source file under `tools/` or the relevant test spec.

**Given** `docs/branch-protection-config.md` (Epic 7 Story 7.8) was finalized with CODEOWNERS,
**When** the document is cross-linked from `CONTRIBUTING.md`,
**Then** a contributor reading CONTRIBUTING learns about dual-approval at the right moment in the flow
**And** the regression-recovery playbook from Story 7.8 is accessible.

**Given** `docs/scheduled-yml-failure-routing.md` (Story 8.3) documents the scheduled-check failure flow,
**When** the document is cross-linked,
**Then** any contributor who sees a scheduled-check Issue can find the playbook
**And** the maintainer's weekly triage discipline is institutionalized in writing.

### Story 8.7: CHANGELOG.md format + release.yml automation + contributor credit by handle

As a **contributor whose PR landed (Marek journey)**,
I want **my GitHub handle credited in the per-release `CHANGELOG.md` entry, with no external tracking or social-graph integration (FR53)**,
So that **contribution is visible and recognized in the project's permanent record without contaminating the zero-telemetry posture**.

**Acceptance Criteria:**

**Given** Epic 5 Story 5.5 authored an initial `/reference/changelog/` page,
**When** `CHANGELOG.md` at the repo root is finalized in this story,
**Then** it follows the Keep-a-Changelog format with sections: Added, Changed, Deprecated, Removed, Fixed, Security; each release entry carries the release date, the corpus-version + app-version (if separate), and a "Contributors" subsection listing GitHub handles for that release
**And** the initial v0.1.0 entry from Epic 5 is preserved.

**Given** `release.yml` (Story 8.1) should automate the contributor-credit population,
**When** a release runs,
**Then** the workflow extracts contributor handles from the merge-commit log between the previous release tag and the current one, deduplicates, alphabetizes, and appends them to the new `CHANGELOG.md` entry
**And** the maintainer reviews the auto-generated entry in a release-prep PR before tagging.

**Given** the `/reference/changelog/` page (Epic 5) is the user-facing surface,
**When** the corpus build pipeline runs,
**Then** it reads `CHANGELOG.md` at repo root and renders it into `/methodology/<corpus-version>/<lang>/reference/changelog/index.html`
**And** the per-language pages mirror the same entry list (Markdown-translated where the entries contain prose; release-metadata lines are locale-invariant).

**Given** no external tracking is permitted (FR53),
**When** the CHANGELOG-generation flow is inspected,
**Then** it uses only `git log` and the GitHub Actions context (no third-party APIs, no analytics, no social-graph)
**And** the per-release email-notification path is explicitly absent — only GitHub Discussions + repo release notifications are supported (Story 8.8).

### Story 8.8: GitHub Discussions link in chrome-footer + release-notification subscription path

As a **user wanting to follow project updates without giving an email address (FR52)**,
I want **a GitHub Discussions link in the chrome-footer (UX-DR8) and a documented path to subscribe to repo release notifications via GitHub — no email-subscription mechanism**,
So that **the structural no-signup / no-email posture holds and updates reach interested users via channels they already control**.

**Acceptance Criteria:**

**Given** UX-DR8 specified the chrome-footer's contents,
**When** Epic 6 Story 6.4 implemented the footer with a GitHub Discussions placeholder,
**Then** this story finalizes the link to the actual repository Discussions URL
**And** the link is to the public Discussions area (no GitHub account required for reading).

**Given** FR52 forbids email subscription,
**When** the `CONTRIBUTING.md` and `README.md` are inspected,
**Then** neither contains an email-signup CTA, neither references a newsletter, neither asks for any user identifier
**And** the only documented update-subscription mechanisms are: GitHub Discussions thread subscription (per-thread "Subscribe" via GitHub UI) and GitHub repository release notifications (per-repo "Watch → Releases only").

**Given** the link must not contaminate the zero-third-party invariant,
**When** the Playwright network-trace runs against the chrome-footer-bearing pages,
**Then** the GitHub Discussions URL appears as an `<a href>` only (no prefetch hint, no preconnect, no third-party fetch on hover)
**And** the strict CSP from Epic 1 holds.

---

## Epic 9a: ICAR License Confirmation (Gate)

The ICAR / SAPA project provides written confirmation that public free-self-assessment redistribution of the ICAR Matrix Reasoning item pool is permitted under the published CC BY-NC-SA terms. The confirmation commits to `ICAR-CONFIRMATION.pdf` and fulfills the FR45 artifact slot established in Epic 1. **Pre-launch gate #1 (Risk #1 — existential). Outreach starts at Epic 2 completion (scoring spec frozen).**

### Story 9a.1: ICAR / SAPA outreach drafting + initial contact + outreach log

As a **maintainer (CEP) closing the existential Risk #1**,
I want **to conduct the outreach to William Revelle's SAPA group at Northwestern, receive written confirmation (PDF or signed email export) that public free-self-assessment redistribution under CC BY-NC-SA is permitted with any noted constraints, and commit the artifact to `ICAR-CONFIRMATION.pdf`**,
So that **FR45's artifact slot from Epic 1 is fulfilled, the pre-launch gate #1 closes, and the project ships v1.0.0 with a verifiable license-chain artifact (Tomáš journey + Risk register #1)**.

**Acceptance Criteria:**

**Given** the outreach starts at Epic 2 completion (scoring spec frozen — providing context for the SAPA group on what's being redistributed),
**When** the maintainer drafts the initial outreach email,
**Then** the email includes: project description (link to README), the canonical URL, the scope of redistribution (the ICAR-MR calibrated item set used in v1, with item-augmentation discipline per FR7), the specific permission being requested (free public self-assessment redistribution under CC BY-NC-SA), the project's MIT-app + CC-BY-NC-SA-content license posture (LICENSES.md committed in Epic 1)
**And** the outreach is logged in `docs/launch-readiness/icar-outreach-log.md` with date + recipient + content summary.

**Given** academic email response times are unbounded (per PRD resource-risk table),
**When** the maintainer pursues follow-up,
**Then** at 4 weeks no-response, a polite reminder is sent (logged); at 8 weeks no-response, escalation to a secondary contact (e.g. course instructor in individual-differences) is attempted (logged); at 12 weeks no-response, the OpenPsychometrics-licensed-subset fallback (per Risk #1 mitigation) is activated and scope changes
**And** every escalation step is documented in the log with rationale.

**Given** the confirmation arrives in writing,
**When** the maintainer receives the PDF or signed email export,
**Then** the artifact commits to `ICAR-CONFIRMATION.pdf` at repo root (replacing the Epic-1 pending placeholder per Story 1.3), with any noted constraints reflected in `LICENSES.md` and `/methodology/provenance/icar-license/`
**And** the placeholder fallback copy from Story 1.3 is removed from the methodology page.

**Given** alternative outcomes must be planned for,
**When** the confirmation arrives constrained (e.g. specific attribution forms required, derivative restrictions),
**Then** the constraints flow into the item-rendering pipeline + LICENSES.md + methodology page within one PR
**And** Epic 10's release-readiness checklist gates on this being reconciled.

**Given** the fallback is the OpenPsychometrics-licensed subset (per Risk #1 mitigation),
**When** the SAPA confirmation is refused or unrecoverable,
**Then** Epic 2's scoring engine + Epic 5's methodology corpus are updated to use the smaller open-licensed item set, the methodology corpus pages reflect the reduced item pool, and the launch-posture shift is documented in `docs/launch-readiness/icar-outreach-log.md` + `CHANGELOG.md`
**And** the change scope is treated as a v1-scope-amendment, not a v1.x-deferral.

### Story 9a.2: ICAR confirmation arrival + LICENSES.md reconciliation + slot fulfillment

As a **maintainer (CEP) closing Story 9a.1's outreach loop**,
I want **the written confirmation (or constrained-permission letter) to arrive, commit as `ICAR-CONFIRMATION.pdf` to repo root (replacing the Epic-1 placeholder per Story 1.3), and any noted constraints to flow into `LICENSES.md` + the methodology provenance page**,
So that **the FR45 artifact slot is filled, the Epic-1 visible-fallback is removed, and downstream constraints (if any) are reflected in the canonical source-of-truth artifacts**.

**Acceptance Criteria:**

**Given** Story 9a.1's outreach has produced a response,
**When** the response is a confirmation (with or without constraints),
**Then** the artifact (PDF or signed-email export) commits to repo root as `ICAR-CONFIRMATION.pdf` replacing the Epic-1 pending placeholder
**And** `lint-trust-artifacts.mjs` (Epic 1) asserts the file exists, is non-empty, has a `last-modified` date in frontmatter, and is signed/verifiable.

**Given** the confirmation may carry constraints (attribution form, derivative restrictions),
**When** the constraints are inspected,
**Then** they flow into a PR that updates: (a) `LICENSES.md` with the noted constraints, (b) `/methodology/provenance/icar-license/` (Story 5.2 anchor page) with the constraint details, (c) the item rendering pipeline (Epic 4) if a specific attribution string must appear per item
**And** the PR is merged before Epic 10 release-readiness checklist signs.

**Given** the Epic-1 visible-fallback ("pending — see methodology") is now obsolete,
**When** this story closes,
**Then** the placeholder copy in `/provenance/icar-license/` (set in Story 5.2) is replaced with the real confirmation summary
**And** the README's ICAR-confirmation reference resolves to the real artifact.

---

## Epic 9b: External Psychometrician Sign-off (Gate)

An external psychometrician (volunteer or paid) signs off on the methodology corpus + result-page copy + scoring spec freeze. Sign-off documented in `docs/launch-readiness/psychometrician-signoff.md`. Risks #11 + I5 (auditable-IRT adversarial inspection — explicitly desired per innovation-risk register).

### Story 9b.1: Psychometrician recruitment + scoring spec / methodology corpus / result-page sign-off

As a **maintainer (CEP) closing Risk #11 (psychometrician sign-off blocked or delayed)**,
I want **to recruit an external psychometrician, share the scoring spec freeze + methodology corpus + result-page copy for review, iterate on feedback, and document the final sign-off with reviewer name + handle + scope + date**,
So that **the auditable-IRT claim (Innovation pillar #5) has external independent validation and Murat's probability assessment that this surfaces methodology corpus revisions (30-50%) is realized inside a planned feedback loop, not a launch-day surprise**.

**Acceptance Criteria:**

**Given** outreach begins at Epic 2 completion (scoring spec freeze is now reviewable),
**When** the maintainer drafts the recruitment message,
**Then** the message identifies the reviewer pool (Revelle group, individual-differences course instructors, named candidates from PRD's carry-forward register), names the scope of review (scoring engine + methodology corpus + result-page copy + APA Standards alignment per PRD §Domain-Specific Requirements), and offers the paid review fallback ($500-$2000 budgeted per PRD)
**And** outreach is logged in `docs/launch-readiness/psychometrician-outreach-log.md`.

**Given** the reviewer reads the scoring engine + methodology corpus + result-page copy,
**When** the reviewer's feedback is received,
**Then** any methodology revisions required flow into Epic 5 pages via PR with the reviewer named as the sign-off authority on those specific pages; any scoring-spec changes flow into Epic 2's `METHODOLOGY_CLAIMS.json` + corresponding methodology page `asserts:`; any result-page copy adjustments flow into Epic 6 EN tail-scenes
**And** every feedback-driven PR cites this story in its description.

**Given** Murat's 30-50% probability of methodology revisions,
**When** revisions land,
**Then** a buffer of 1-2 weeks is held in the v1.0.0 launch schedule (per Murat's recommendation)
**And** revisions are tracked in the outreach log.

**Given** the reviewer commits to a final sign-off,
**When** `docs/launch-readiness/psychometrician-signoff.md` is finalized,
**Then** it carries the reviewer's name, GitHub handle (if applicable), date, scope of sign-off, and any noted reservations or caveats
**And** the document is committed to the repo as a verifiable artifact (Tomáš can see who signed off on what).

**Given** Innovation Risk I5 names adversarial inspection as DESIRED,
**When** the reviewer raises a defensible-but-disputable methodology choice or numerical error,
**Then** the response is documented (correction landed pre-launch, or methodology page updated with the disputed-choice rationale), and the resolution is treated as project-strengthening rather than launch-blocking
**And** the post-launch correction discipline (errors as opportunity to demonstrate correction) is documented in `/methodology/reference/changelog/` style.

---

## Epic 9c: RU Clinical-Register Translator (Gate)

A Russian-language clinical-register translator (bilingual psychometrically-aware Russian native) authors and reviews RU tail-scene copy and the RU methodology corpus, becoming the named reviewer-of-record. Risks #5 (distress) + I3 (paternalistic register in Russian).

### Story 9c.1: RU clinical-register translator recruitment + tail-scene + methodology corpus sign-off

As a **maintainer (CEP) closing Risks #5 + I3 for the Russian-speaking primary audience**,
I want **to recruit a Russian-language clinical-register-aware translator (bilingual psychometrically-aware Russian native, ideally working translator with clinical or psychology background), engage them for RU tail-scene authoring + RU methodology corpus translation review (Epic 7 Story 7.3 + 7.6), and document their reviewer-of-record commitment**,
So that **the Russian-speaking Mikhail-journey users receive harm-mitigation copy authored in clinical register IN RUSSIAN (not translated from English), Risk #5 (bottom-decile distress) is mitigated, and Innovation Risk I3 (paternalistic register in Russian) is prevented by native-language authorship**.

**Acceptance Criteria:**

**Given** outreach begins at Epic 2 completion (parallel with Gate 9a/9b),
**When** the maintainer drafts the recruitment message,
**Then** the message identifies the recruitment pools: r/cognitiveTesting Russian-speakers, psychology academic networks, Russian-language translator communities; names the scope (tail-scene authoring + methodology corpus translation review + reviewer-of-record commitment through v1); offers the paid fallback ($300-$800 per PRD)
**And** outreach is logged in `docs/launch-readiness/ru-translator-outreach-log.md`.

**Given** the translator accepts the engagement,
**When** their commitment is documented,
**Then** their name + GitHub handle (or pseudonym + verifiable signature mechanism if they prefer) are recorded; their scope (which pages, which copy), their compensation arrangement (volunteer or paid), and their availability window are documented in the outreach log
**And** `.github/CODEOWNERS` and the masthead component (Epic 4 Story 4.6) display their handle on RU methodology pages per FR35.

**Given** the translator drafts RU tail-scene copy (bottom-decile + mid-band + top-decile + silent-companion-line) for Epic 7 Story 7.6,
**When** the copy is reviewed by tester cohort from Gate 9e on a working build,
**Then** any required revisions iterate with the translator until ≥4/5 RU testers report the copy feels right (not paternalistic, not cold, not heavy-handed per Innovation Risk I3 mitigation)
**And** the revision loop is documented in the outreach log.

**Given** the translator finalizes their work,
**When** `docs/launch-readiness/ru-translator-signoff.md` is committed,
**Then** it carries the translator's name + handle + date + scope of sign-off (which pages, which copy), with explicit confirmation: "the RU tail-scene copy is authored in clinical register, not translated from EN; the RU methodology corpus translation is parity-reviewed against the EN source"
**And** the document is a verifiable artifact Tomáš can inspect.

---

## Epic 9d: PL Clinical-Register Translator (Gate)

A Polish-language clinical-register translator commits to the same scope as Gate 9c, for Polish. Independent failure isolation from Gate 9c per Mary. Risks #5 + I7 (tri-lingual measurement-equivalence translation drift).

### Story 9d.1: PL clinical-register translator recruitment + initial engagement

As a **maintainer (CEP) closing Risks #5 + I7 for the Polish-speaking primary audience (Marek journey via PRD Journey 6 for Polish-philology-trained translator role)**,
I want **to recruit a Polish-language clinical-register-aware translator (independent of the RU translator — per Mary's independent-failure-isolation argument), engage them for PL tail-scene authoring + PL methodology corpus translation review (Epic 7 Story 7.4 + 7.6), and document their reviewer-of-record commitment**,
So that **the Polish-speaking users receive harm-mitigation copy authored in clinical register IN POLISH (not translated from English), Risk #5 holds for PL, and Innovation Risk I7 (translation drift) is mitigated by an independent-of-RU per-language reviewer**.

**Acceptance Criteria:**

**Given** outreach begins at Epic 2 completion (parallel with Gates 9a/9b/9c),
**When** the maintainer drafts the recruitment message,
**Then** the message identifies the recruitment pools: Polish psychology academic networks, Wykop / Polish-language Reddit communities, Polish-philology translator networks; names the same scope as Gate 9c (tail-scene authoring + methodology corpus translation review + reviewer-of-record commitment through v1); offers the same paid fallback ($300-$800)
**And** outreach is logged in `docs/launch-readiness/pl-translator-outreach-log.md`.

**Given** the translator accepts the engagement (independently of RU; either may close first),
**When** their commitment is documented,
**Then** their name + GitHub handle are recorded in `.github/CODEOWNERS`, the masthead component displays their handle on PL methodology pages, and the same scope/compensation/availability discipline as Gate 9c applies
**And** the independent-failure-isolation property (PL can close while RU is in progress, or vice versa) is preserved.

**Given** the PL translator drafts PL tail-scene copy for Epic 7 Story 7.6,
**When** the copy is reviewed by tester cohort from Gate 9e on a working build,
**Then** any required revisions iterate until ≥4/5 PL testers report the copy feels right
**And** the revision loop is documented in the outreach log.

**Given** the translator finalizes their work,
**When** `docs/launch-readiness/pl-translator-signoff.md` is committed,
**Then** it carries the translator's name + handle + date + scope of sign-off
**And** the document is a verifiable artifact.

**Given** Mary's independent-failure-isolation argument predicts asymmetric outcomes (RU closed, PL pending OR vice versa),
**When** one language closes and the other lingers,
**Then** Epic 7's `[data-translation-status="in-progress"]` flag (Story 7.4) is set on the unfinished locale's pages, the `translation-in-progress-stub` component renders them, and the v1.0.0 launch decision is made with full visibility of the per-language gate status
**And** Epic 10 (coordinated release) does not fire until both close OR an explicit single-locale launch is documented as a v1.x-deferral scope-change.

### Story 9d.2: PL clinical-register sign-off + CODEOWNERS finalization + masthead reviewer fields

As a **maintainer closing Story 9d.1's recruitment loop**,
I want **the PL clinical-register translator to complete their work (tail-scene copy + methodology translation + reviewer-of-record commitment), and the artifacts (CODEOWNERS update + masthead reviewer-fields) to commit to main**,
So that **the PL Gate visibly closes (separate from the RU Gate per Mary's accountability-surface argument) and the v1.0.0 launch readiness checklist sees a green PL gate**.

**Acceptance Criteria:**

**Given** Story 9d.1 named and engaged the PL reviewer,
**When** the work completes,
**Then** `docs/launch-readiness/pl-translator-signoff.md` is finalized with the reviewer's name + handle + date + scope of sign-off + enumerated deliverables (per Story 7.6 belt-and-suspenders: tail-scenes + silent-companion-line + locale-switch-blocker-hint + crisis-resources + retest-effect copy)
**And** the document is a verifiable artifact.

**Given** the reviewer-of-record discipline (Story 7.8) requires `CODEOWNERS` + masthead reviewer-fields,
**When** Story 9d.2 closes,
**Then** `.github/CODEOWNERS` is updated to replace `@TBD-pl-reviewer` with the actual reviewer handle, the masthead component (Epic 4 Story 4.6) renders the named reviewer on every PL methodology page, and Epic 10's pre-launch checklist confirms both
**And** the PL gate visibly transitions from "open" to "closed" in the Epic 10 dashboard.

---

## Epic 9e: 12-of-15 Native-Speaker Tester Credibility (Gate)

A cohort of 5 native-speaker testers per language (5 × EN/RU/PL = 15) completes the test on a representative pre-launch build and reports credibility on a GitHub Discussions thread. Launch gate threshold: ≥12 of 15 overall AND ≥4 of 5 per language. Risk #12.

### Story 9e.1: Native-speaker tester recruitment + credibility validation + iteration loop

As a **maintainer (CEP) closing Risk #12 (credibility threshold not met → kills launch)**,
I want **to recruit a 5×3 tester cohort spanning the four user archetypes (Anna mid-band, Mikhail bottom-decile, Daria top-decile, Tomáš skeptic) per language, run them through the Epic-6-or-Epic-7 build, collect their credibility verdicts on the GitHub Discussions thread, iterate on copy based on feedback until the launch-gate threshold is met, and document the final credibility report**,
So that **the experiential launch gate (12/15 overall AND 4/5 per language — no single-language failure can be masked by aggregation) is closed and v1.0.0 ships with externally-validated tester credibility signal**.

**Acceptance Criteria:**

**Given** recruitment begins at Epic 6 testable-build-ready (cohort 1 trickle) and intensifies at Epic 7 full-locale-build (full cohort),
**When** the maintainer drafts recruitment posts to r/cognitiveTesting + native-language psychology forums + Russian/Polish cognitive-testing communities,
**Then** the post explains the volunteer ask (run the test, post a credibility verdict in a GitHub Discussions thread), the time commitment (~30 minutes), the no-compensation posture (in keeping with the project's non-commercial structural posture), the privacy posture (no email collection, no telemetry — testers identify themselves only by GitHub handle on the Discussions thread)
**And** outreach is logged in `docs/launch-readiness/tester-recruitment-log.md`.

**Given** the cohort must span archetypes,
**When** tester recruitment proceeds,
**Then** efforts are made to balance: at least 1 expected-bottom-decile tester per language (Mikhail archetype — recruited specifically for the harm-mitigation surface test), at least 1 expected-top-decile tester per language (Daria archetype), at least 1 skeptic per language (Tomáš archetype, recruited from technical communities), with remainders distributed across mid-band
**And** the cohort composition is documented (without violating the no-telemetry posture — only what testers themselves disclose).

**Given** testers run the test and post on the GitHub Discussions thread,
**When** their feedback is collected,
**Then** the maintainer aggregates verdicts: "credible" vs "not credible" per tester per language; collects qualitative feedback on tail-scenes, methodology pages, result-page composition; identifies any "this is paternalistic" / "this is cold" / "this felt wrong" flags
**And** verdicts are tabulated in `docs/launch-readiness/tester-credibility-report.md`.

**Given** the launch-gate threshold is ≥12 of 15 overall AND ≥4 of 5 per language,
**When** the first round of feedback comes in below threshold,
**Then** the maintainer + relevant per-language reviewer-of-record (Gate 9c/9d) iterate on the offending copy / surface; a new build deploys; the cohort (or a refreshed cohort) re-tests; the loop continues until threshold met OR the maintainer decides to slip the launch
**And** each iteration round is documented with the changes made and the resulting verdict change.

**Given** Risk #12 explicitly says "do not ship below threshold even if launch slips",
**When** the threshold cannot be reached within the planned v1 window,
**Then** the launch slips rather than ships sub-threshold; the slip is documented in `CHANGELOG.md` and the outreach log; alternative paths (single-language launch + RU-or-PL deferral) are considered
**And** the maintainer's decision is explicitly documented to prevent silent-slip-then-ship-anyway failure mode.

**Given** the threshold is finally met,
**When** `docs/launch-readiness/tester-credibility-report.md` is finalized,
**Then** it documents: the final tester count + language breakdown (e.g. "5 EN: 5 credible; 5 RU: 4 credible; 5 PL: 5 credible — total 14/15, all per-language thresholds met"), the iteration history (round 1 verdict / changes / round 2 verdict / ...), the named handles of testers (only those who consented to be named on the Discussions thread)
**And** the report is a verifiable artifact that Tomáš can read post-launch to verify the gate closed honestly.

---

## Epic 10: v1.0.0 Coordinated Release

All eight dev epics merge to main. All five gates close. Coordinated `app-v1.0.0` + `corpus-v1.0.0` double-tag fires `release.yml` from Epic 8. Repository is *as-described* on launch day. The no-enshittification audit clock starts.

### Story 10.1: Pre-launch readiness checklist + final smoke test

As a **maintainer (CEP) about to push the v1.0.0 tag pair**,
I want **a final pre-launch readiness checklist that verifies all eight dev epics merged, all five gates closed with their committed artifacts, all CI checks green on main, the full Playwright + Lighthouse + axe-core suite passing, the byte-stable build assertion green, the network-trace assertion green, and a manual smoke test of the canonical + mirror URLs complete**,
So that **the launch-day tag-push is mechanical and any surprise is caught one hour before tagging, not one minute after deployment**.

**Acceptance Criteria:**

**Given** `docs/launch-readiness/v1.0.0-checklist.md` is authored as the master checklist,
**When** the checklist is finalized,
**Then** it enumerates: (a) Dev-epic merges: Epics 1-8 all merged to main + each epic's exit-criterion satisfied (e.g. Epic 4 Story 4.8 linters demonstrated on corpus + SPA); (b) Gate-epic closures: `ICAR-CONFIRMATION.pdf` committed (9a), `docs/launch-readiness/psychometrician-signoff.md` finalized (9b), `docs/launch-readiness/ru-translator-signoff.md` finalized (9c), `docs/launch-readiness/pl-translator-signoff.md` finalized (9d), `docs/launch-readiness/tester-credibility-report.md` showing ≥12/15 + ≥4/5 per language (9e); (c) CI gates: all `pr-checks.yml` jobs green on main (no `if: false` stubs remaining for v1-scope lints); (d) Smoke test: manual happy-path on canonical GitHub Pages URL + mirror URL in EN/RU/PL; (e) Browser matrix: manual Yandex Browser QA pass per NFR5
**And** every checklist item has a verification step + a sign-off field.

**Given** the manual smoke test catches issues no CI can,
**When** the smoke test runs,
**Then** the maintainer completes the full happy-path in each of the three locales on at least Chrome + Firefox + Safari (+ Yandex Browser per NFR5), confirms zero third-party requests via DevTools (the FR41 30-second verification), confirms the score panel renders the co-equal triplet correctly, confirms the bottom-decile + top-decile tail-scenes render in each language, confirms the methodology corpus is navigable in each language with `hreflang` working, confirms the cite-this-page widget produces a valid citation
**And** any anomaly is documented in the checklist and resolved before tag-push.

**Given** the no-enshittification audit clock starts at launch,
**When** the checklist is signed,
**Then** the baseline `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md` is captured: zero analytics on the wire (network-trace snapshot), zero third-party fetches (CSP-violation-count snapshot), no signup, source matching `main` (deployed-tree SHA matches main-branch source-tree SHA per byte-stable assertion), LICENSES.md unmodified hash recorded for future audit (T+6, T+12, T+24 month audits per PRD Success Criteria gate #8)
**And** the baseline document is committed.

### Story 10.2: Coordinated double-tag push + release.yml fires + post-launch verification

As a **maintainer (CEP) firing v1.0.0**,
I want **to push the `app-v1.0.0` and `corpus-v1.0.0` tags in coordinated fashion, observe `release.yml` execute both jobs successfully, verify Zenodo DOI minting, verify Internet Archive + Software Heritage snapshots, verify mirror deployment byte-identical, post the launch announcement to GitHub Discussions (no email blast, no PR pitch, no telemetry per the project's structural posture)**,
So that **v1.0.0 ships with the full archival + citation infrastructure operational and the project becomes the reflexive answer for "is there a real free IQ test in Russian or Polish?"**.

**Acceptance Criteria:**

**Given** Story 10.1's checklist is fully signed,
**When** the tags are pushed (`git tag app-v1.0.0 && git tag corpus-v1.0.0 && git push --tags`),
**Then** `release.yml` from Epic 8 Story 8.1 fires both jobs in parallel; the `app-release` job deploys SPA to GitHub Pages + mirror; the `corpus-release` job deploys corpus, mints Zenodo DOI, snapshots to IA + SH
**And** all jobs complete green within 30 minutes.

**Given** Zenodo + IA + SH actions complete,
**When** the maintainer verifies the artifacts,
**Then** the Zenodo DOI resolves to a real Zenodo record for v1.0.0; the IA snapshot URLs in `docs/launch-readiness/internet-archive-snapshots.md` HEAD-respond 200; the SH archive contains the source tree at the v1.0.0 commit
**And** `CITATION.cff` is updated with the resolved DOI for citers (Karolina) to reference.

**Given** the mirror deployment must be byte-identical (NFR17),
**When** the byte-identical-artifact assertion from Epic 8 Story 8.4 runs against the deployed canonical + mirror,
**Then** the SHA256 hashes match for the SPA index + at least one methodology page + LICENSES.md + CITATION.cff
**And** the mirror URL is independently navigable.

**Given** the launch announcement is posted to GitHub Discussions,
**When** the announcement text is drafted,
**Then** it follows the project's tone: no marketing language, no growth-hack invitations, no calls-to-action beyond "feedback welcome on this thread"; it names the canonical URL, the mirror URL, the Zenodo DOI, the named reviewers-of-record (per PRD's anti-marketing posture); it explicitly thanks the testers (Gate 9e) and translators (Gates 9c/9d) by GitHub handle (only those who consented to be named)
**And** the post does NOT solicit shares, retweets, upvotes, or HackerNews submissions — the project's reach is organic-only per the structural posture.

**Given** the no-enshittification audit clock now runs,
**When** the launch completes,
**Then** the baseline from Story 10.1 is the reference against which T+6, T+12, T+24 month audits (per PRD Success Criteria gate #8) will compare
**And** `docs/launch-readiness/v1.0.0-launch-postscript.md` is committed with the launch date, the actual time-to-each-gate-closure, and the tester-credibility-report summary as a permanent project record.

### Story 10.3: 48-hour post-launch monitoring window

As a **maintainer responsible for catching launch-day surprises within the first 48 hours (per John — "the site works for the first 100 visitors and we know within 2 hours if it doesn't")**,
I want **a documented 48-hour post-launch monitoring window with check-in points at T+1h, T+6h, T+24h, and T+48h, plus a pre-validated rollback runbook**,
So that **any launch-day surprise (DNS issue, mirror sync failure, broken methodology link, scoring engine regression that slipped past CI) is caught at the earliest possible moment rather than discovered by an unhappy user days later**.

**Acceptance Criteria:**

**Given** the project has zero analytics by design (NFR6),
**When** post-launch monitoring proceeds,
**Then** monitoring is *manual and zero-telemetry*: at T+1h, T+6h, T+24h, T+48h the maintainer manually re-runs the smoke test (Story 10.1) on canonical + mirror, manually verifies Zenodo DOI resolution + IA snapshots + SH archive, manually scans GitHub Discussions for posted user reports
**And** each checkpoint is logged in `docs/launch-readiness/v1.0.0-post-launch-monitoring.md` with timestamp + verified-checks + any anomalies.

**Given** the rollback runbook must exist BEFORE launch (not be improvised),
**When** `docs/launch-readiness/v1.0.0-rollback-runbook.md` is authored as part of Story 10.1's checklist phase,
**Then** it documents: how to revert the `app-v1.0.0` tag (`git tag -d` locally + force-push reversion is allowed for emergency rollback only), how to redeploy a prior known-good version, how to mark the Zenodo DOI as withdrawn (Zenodo permits this), how to issue an Internet Archive correction notice
**And** the runbook is *validated* in Story 10.3 by walking through it dry-run (no actual rollback) and confirming every step is executable.

**Given** the no-enshittification audit clock starts at launch,
**When** the 48-hour window closes,
**Then** the post-launch report is committed: any surprises, any iterations made (within the 48h window only — anything later is v1.0.1+ territory), the verified-stable state at T+48h
**And** the project transitions from "launch-active monitoring" to "steady-state maintenance posture" with the no-enshittification audit clock running.

**Given** the structural posture forbids reactive analytics,
**When** a user reports an issue via GitHub Discussions in the 48h window,
**Then** the maintainer engages, diagnoses (with the user's voluntary participation), and decides: hotfix immediately + tag v1.0.1, OR document as known-issue + queue for v1.1
**And** no automated error reporting, no Sentry/LogRocket/etc., no telemetry — per the project's load-bearing trust posture.
