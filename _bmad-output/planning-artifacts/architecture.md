---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
inputDocuments:
  - '{output_folder}/planning-artifacts/prd.md'
  - '{output_folder}/planning-artifacts/product-brief-IQ-ME.md'
  - '{output_folder}/planning-artifacts/product-brief-IQ-ME-distillate.md'
  - '{output_folder}/planning-artifacts/implementation-readiness-report-2026-05-15.md'
  - '{output_folder}/planning-artifacts/ux-design-specification.md'
workflowType: 'architecture'
project_name: 'IQ-ME'
user_name: 'CEP'
date: '2026-05-15'
lastStep: 'step-08-complete'
status: 'complete'
completedAt: '2026-05-18'
partyModeRounds:
  - round: 1
    participants: [Winston, Amelia, Paige, Murat]
    focus: 'Step 3 no-starter decision stress-test'
  - round: 2
    participants: [Mary, John, Sally]
    focus: 'Step 4 consolidated decisions + implementation sequence'
  - round: 3
    participants: [Amelia, Murat, Paige]
    focus: 'Step 5 patterns + lint architecture + JSON-casing'
  - round: 4
    participants: [Winston, John, Sally]
    focus: 'Step 6 boundary integrity + requirements-mapping completeness + UX-component coverage'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (53 FRs across 8 capability areas):**

- **Test Session (FR1–FR8):** in-browser 16-item ICAR-MR session, no account, no PII, no server state; 128-bit `crypto.getRandomValues()` session seed in memory only; deterministic subset/order/image-augmentation selection; mid-session bail with explicit discard-vs-continue, no silent partial; mid-session locale switch blocked.
- **Consent & Validity Disclosure (FR9–FR13):** pre-test plain-language validity-envelope, visuospatial disclosure, explicit "Not today" exit; pre-reveal "are you ready" beat.
- **Score Computation (FR14–FR17):** IRT 2PL EAP estimation producing percentile + IQ-scale + 95% CI uncertainty band combining SEM + norming-sample uncertainty via root-sum-square; pure deterministic function, no DOM, no network, no globals — independently invocable for audit and golden-vector parity.
- **Result Delivery (FR18–FR27):** co-equal triplet typography, asymmetric tail-scenes (bottom-decile harm-mitigation / mid-band / top-decile anti-credentialization), per-language clinical-register-reviewed copy, in-bundle native-language crisis resources, one-click portal from any displayed number to its methodology page, no share/certificate/badge UI, opt-in localStorage save, retest-effect explanation surfaced on result page (no technical cooldown).
- **Methodology Corpus (FR28–FR36):** stable versioned permalinks (`/methodology/v<X>.<Y>.<Z>/<lang>/<path>/`) under per-corpus-release versioning, "Cite this page" widget (APA + Wikipedia-template + BibTeX) with Zenodo DOI, hreflang cross-language, independent navigability, per-language reading-level lints, stale-translation hatnote, named reviewer-of-record per language per version.
- **Localization (FR37–FR40):** EN/RU/PL locales at landing, block-level content-key parity enforced at build, locale persisted only on explicit user toggle.
- **Trust Verification (FR41–FR46):** 30-second DevTools verifiability of zero-third-party invariant, source readable as shipped (no minification/bundling/transpilation between repo and browser), methodology-claims manifest with CI lint, committed golden vectors, repo-committed ICAR license confirmation, per-release Internet Archive + Software Heritage + Zenodo DOI.
- **Contribution & Governance (FR47–FR53):** documented PR workflow, CI gating on parity/lints/network/golden-vectors, dual-approval (maintainer + per-language reviewer-of-record) for non-EN content-key changes, `LICENSES.md`, forking-ethics statement, GitHub Discussions as no-telemetry feedback channel.

**Non-Functional Requirements (35 NFRs across 7 classes) — the load-bearing architectural drivers:**

- **Performance (NFR1–NFR5):** FCP < 1.5s, LCP < 2.5s, TTI < 3.0s, CLS < 0.05 on mid-tier Android over Slow 4G; ≤ 200 KB gzipped initial load; ≤ 100 KB per methodology page; ≤ 50 KB per matrix item; scoring < 100ms; ≤ 50 MB session memory; Yandex Browser specifically validated.
- **Security & Privacy (NFR6–NFR11):** zero-third-party invariant (Playwright network-trace assertion), strict CSP, zero PII / no cookies / no fingerprinting, localStorage only on explicit user action, `crypto.getRandomValues` mandatory (`Math.random` forbidden in scoring/selection).
- **Accessibility (NFR12–NFR15):** WCAG 2.2 AA on non-item surfaces (axe-core/pa11y in CI), honest validity-envelope on items (synthetic alt-text forbidden), pre-launch manual screen-reader pass (NVDA+Firefox, VoiceOver+Safari, TalkBack+Chrome), `prefers-reduced-motion` honored, dark mode as separately-designed palette.
- **Reliability & Availability (NFR16–NFR20):** GitHub Pages canonical + Codeberg/Cloudflare same-day mirror failover, Internet Archive + Software Heritage per-release archival, stale-version banner on drift, graceful localized JS-error fallback with no telemetry.
- **Auditability & Verifiability (NFR21–NFR26) — IQ-ME-specific class:** runtime-zero-build invariant (deployed JS = source JS byte-for-byte), scoring engine golden-vector parity (±0.001 logits vs R `mirt 1.41.x`, pinned seed/quadpts/theta_lim), methodology-claims manifest CI parity lint, license-provenance test, citation infrastructure (per-corpus-release permalinks, `CITATION.cff`, JSON-LD `ScholarlyArticle`, hreflang), verification time-to-confidence ≤ 30s DevTools / ≤ 10 min source read / ≤ 5 min local golden-vector run.
- **Content Governance & Translation Equivalence (NFR27–NFR31):** block-level content-key parity with EN source-hash, reading-level discipline per language enforced in CI, reviewer-of-record sign-off enforced via branch protection, glossary-first lint, no-idioms style + per-language sentence-length caps.
- **Maintainability & Sustainability (NFR32–NFR35):** solo-dev cognitive-load budget (~250 LOC scoring, ~30 KB app modules, ~15 KB i18n harness, ~1500 LOC CSS, ~30 methodology pages/locale), zero npm runtime deps in production, license sustainability (MIT app + CC-BY-NC-SA content/translations), outlast-the-maintainer property via DOI + archival redundancy + structural non-commercial posture.

**Scale & Complexity:**

- Project complexity: **high** (PRD-classified: web_app + content-product + experience-product; psychometric_assessment domain; scientific + content-licensed + ethics-bound)
- Primary technical domain: **hybrid static web app + scholarly corpus + auditable scoring engine** on a runtime-zero-build vanilla-JS substrate
- Estimated architectural components:
  - 1 scoring engine module (4 pure-function files, ~250 LOC)
  - 1 i18n harness (~15 KB)
  - ~30 assessment-SPA modules (~30 KB total) across landing / consent / item-runner / result / methodology-shell
  - 25 custom CSS components in 4 domains (chrome / methodology / assessment / diagrams), capped at ~1500 LOC total CSS
  - ~30 methodology source pages × 3 locales = ~90 CommonMark+frontmatter inputs → static HTML output
  - 2 SVG diagrams (validity-envelope, EAP-shrinkage) with translated `<title>`/`<desc>`
  - ≥ 1,000-pattern golden-vector test set (committed JSON)
  - CI workflows: network-trace, axe-core, Lighthouse, viewport-overflow, cropping fuzzer, reveal-stage event ordering, parity lints, golden-vector parity, license-provenance, meta-CI

### Technical Constraints & Dependencies

**Hard substrate constraints (foreclose the architectural menu):**

- Static-site only, no backend, no server runtime, no API endpoint at runtime
- Runtime-zero-build: no compiled/bundled/minified/transpiled JS in production; the `make build-methodology` author-time step is the *only* build, and its output IS the shipped artifact
- Zero npm runtime dependencies in production
- ES2022 + CSS Custom Properties baseline; native ES modules via `<script type="module">` with relative paths (no `import map`)
- No CSS preprocessor; no `tailwind`/`postcss`/`sass`/`less` in production
- Strict CSP forbids `eval`, `new Function`, inline scripts, inline event handlers, third-party scripts/fonts/styles/images
- Mirror-compatible deployment: relative asset paths only; no GitHub-Pages-specific path tricks

**Pinned external reference dependencies (golden-vector reproducibility):**

- R 4.4.x + `mirt` 1.41.x
- `mirt::fscores(method="EAP", quadpts=61, theta_lim=c(-6,6))`
- `set.seed(20260514)` for simulated patterns
- Re-pinning across version bumps requires `tests/golden/CHANGELOG.md` entry + repro README + methodology reviewer-of-record sign-off

**Sanctioned external integrations (whitelist; everything else explicitly forbidden):**

- **GitHub Pages** — canonical hosting (static only)
- **Codeberg Pages or Cloudflare Pages** — same-day failover mirror, byte-identical artifact
- **Zenodo** — DOI minting via GitHub-Zenodo integration on tagged release
- **Internet Archive** — Save Page Now snapshot per tagged release
- **Software Heritage** — `save` endpoint per tagged release
- **GitHub Discussions** — no-telemetry feedback channel
- **GitHub Actions** — CI only (lints + tests + release tagging + mirror triggers); no secrets in client code

**Forbidden by PRD (architectural constraint, not preference):**

- All analytics (Google Analytics, Plausible, Fathom, GoatCounter, even anonymous hit counters — CEP rejected GoatCounter explicitly)
- All error/session monitoring (Sentry, LogRocket, FullStory, Hotjar)
- All third-party static-asset CDNs (Google Fonts, jsDelivr, Cloudflare CDN)
- All social-share endpoints; `navigator.share()` is itself forbidden by FR25 and the negative-assertion CI suite
- Email collection / newsletter signup
- Geo-IP services (crisis-resource lists are static per language)

**External human gates on the critical path (the real binding constraint on v1 launch):**

| Gate | Required artifact | Latency posture |
|---|---|---|
| ICAR / SAPA project (Revelle group) | Written license confirmation for free public self-assessment redistribution | High; pre-launch gate #1; fallback is OpenPsychometrics-licensed subset |
| External psychometrician | Methodology corpus + result-page copy + scoring spec sign-off | Medium-high; outreach pre-launch; paid fallback budgeted |
| Russian clinical-register translator | Result-page tail copy + methodology RU review | Medium; community + paid fallback |
| Polish clinical-register translator | Same, PL | Medium; same posture |
| 15 native-speaker testers (5×EN/RU/PL) | Credibility launch gate (≥12/15) | Medium collectively; recruit pre-code-complete |

Architecture must produce **audit surfaces** to support these gates (readable source, scoring engine isolation, methodology-claims manifest, named-reviewer fields in masthead, contributor workflow), not just clear them.

### Cross-Cutting Concerns Identified

1. **i18n / measurement invariance.** Block-level content-key parity with EN source-hashing, stale-translation hatnote, per-language reading-level + glossary-first + no-idioms lints, reviewer-of-record dual-approval on non-EN content-key changes. Affects: methodology corpus build pipeline, locale JSON harness, content authoring workflow, CI lints, masthead component, hatnote component.

2. **Accessibility envelope.** WCAG 2.2 AA on every non-item surface; honest validity-envelope declaration on items (no synthetic alt-text). Affects: every component, consent scene composition, all CSS focus styles, automated axe-core/pa11y CI, manual screen-reader pre-launch.

3. **Performance & assessment validity.** Performance budgets are not polish — slow loads create selection bias against the underserved RU/PL audience. Lighthouse-in-CI is a binding gate. Affects: asset budgets, no-bundle posture, SVG-first item assets, system-font typography, scoring engine size budget, methodology-page weight cap.

4. **Auditability surface.** Source-readable-as-shipped, CSP-strict, network-trace-zero-third-party, methodology-claims manifest, golden vectors, repo-visible ICAR confirmation, README masthead, named-reviewer fields. This is itself a UX surface (Tomáš journey) and a cross-cutting architectural property. Affects: build pipeline, deploy pipeline, repo structure, CI, README, masthead.

5. **License provenance & content chain.** Every shipped item file traces to ICAR attribution; `LICENSES.md` unmodified between releases except via changelog; CC-BY-NC-SA propagates to methodology corpus; per-locale translated content is project's own CC-BY-NC-SA derivative. Affects: item-pool storage layout, build pipeline, CI license-provenance lint, `LICENSES.md`, `CITATION.cff`.

6. **Reveal-beat ceremony coordination.** Named beats with `iqme:reveal-stage` DOM event hook; JS lifts `data-reveal-stage` on the score panel, CSS does the visual work via attribute selectors and motion tokens. Affects: result-page module, score-panel component, tail-scene components, motion token primitives, Playwright event-ordering test.

7. **Mirror-readiness as architectural property.** Relative paths everywhere; same artifact runs on GitHub Pages / Codeberg / Cloudflare Pages; Internet Archive + Software Heritage permanence. Affects: asset URL strategy, methodology permalink scheme, CI archival triggers, deployment runbook.

8. **Per-language clinical-register governance.** Reviewer-of-record per language per version, dual-approval on non-EN content-key PRs, named reviewer surfaced in masthead, copy authored in clinical register (not translated from EN). Affects: branch-protection config, `CONTRIBUTING.md`, masthead component, content-authoring workflow.

9. **Negative-assertion CI suite as architectural surface.** No share UI, no `navigator.share`, no `og:image` per result, no `role="alert"`, no `alert/confirm/prompt`, no analytics SDK, no third-party fetch, no inline script. The *absences* are part of the architecture and tested as such.

## Starter Template Evaluation

### Primary Technology Domain

**Hybrid static web app + scholarly corpus + auditable scoring engine** on a runtime-zero-build vanilla-JS substrate. Assessment surface is a hash-routed SPA (in-memory session state, ~30 KB modules); methodology corpus is a path-based multi-page static site (~30 pages × 3 locales, per-corpus-release versioning); scoring engine is a pure-function DOM-free module (~250 LOC) auditable as shipped.

### Technical Preferences (already pinned by PRD; not re-elicited)

| Concern | Value | PRD source |
|---|---|---|
| Language | Vanilla ES2022 JavaScript | NFR21 (no transpilation) |
| UI framework | None (no React / Vue / Svelte / Solid / Lit) | NFR21 + NFR33 |
| Styling | Hand-rolled CSS Custom Properties; 2-layer tokens (primitives → semantic); ~1500 LOC budget | UX Step 6; NFR21 (no preprocessor) |
| JS build | None — deployed JS tree matches source JS tree byte-for-byte | NFR21 |
| Methodology corpus build | Author-time `make build-methodology` (CommonMark + YAML frontmatter → static HTML per locale per version); output IS the shipped artifact | PRD §Web App Specifics |
| Runtime npm dependencies | Zero | NFR33 |
| Dev npm dependencies | Permitted (`axe-core`/`pa11y`, Playwright, Lighthouse CLI, `node --test`, reading-level analyzers); invoked via `make` targets. Vendored single-file dev tools (e.g. `marked`) permitted via `vendor/` directory with SHA-pinned `vendor/SHASUMS`. | NFR33 |
| Test runner | `node --test` for scoring + unit; Playwright for integration / CI assertions | PRD §Trust Verification |
| Module system | Native ES modules via `<script type="module">` with relative paths only (no `import map`) | PRD §Technical Architecture |
| Deployment | GitHub Pages canonical + Codeberg or Cloudflare Pages mirror, byte-identical | NFR17 |

### Starter Options Considered

**Off-the-shelf full-stack starters surveyed and rejected:**

- **Next.js / Remix / SvelteKit / Nuxt / T3 / Gatsby / Blitz / RedwoodJS / `create-react-app`** — all require a framework runtime + bundler; violate NFR21 and NFR33.
- **Vite + (any framework)** — bundler in the production path; violates NFR21 (the deployed JS tree must equal the source JS tree byte-for-byte).
- **Astro 6.x (May 2026)** — even with "zero JS by default" Islands, Astro's build *transforms* output JS and ships a hydration layer; violates NFR21. Astro's Cloudflare-runtime-coupled dev server also adds unnecessary surface for a solo-dev cognitive-load budget (NFR32).
- **Hugo / Jekyll** — templating engines outside the JS+Node+Make toolchain (Go / Ruby), increasing the maintainer-language footprint; weak fit for the methodology-claims-manifest parity lint that must be co-located with the JS scoring engine.

**Two compliant options evaluated and stress-tested in Party Mode (Winston / Amelia / Paige / Murat):**

- **Option A (selected): No starter; hand-author SPA + author-time-only Node corpus build script.** Vendored dependencies via `vendor/` with SHA-pinned hashes permitted (zero npm runtime deps either way).
- **Option B (rejected): Eleventy 3.x as author-time-only methodology corpus SSG (devDependency).** Rejected because: (i) Eleventy's incremental-rebuild model — its headline feature — *fights* NFR25's per-corpus-release re-emit requirement (every page must re-emit at every version tag, even unchanged; we'd be writing config to defeat the optimization); (ii) the hard parts of the corpus build (stale-translation hatnote on EN-source-hash drift, version-mismatch hatnote on cited-old-version arrival, Wikipedia-external-link-policy lint, glossary-link rewriting, per-language reading-level lints, claims-manifest parity vs the scoring engine) are not Eleventy primitives — they would be authored either way; (iii) at ~90 corpus files, Eleventy's collections + permalinks abstractions don't earn their cognitive-load cost; (iv) Eleventy's plugin ecosystem pulls hundreds of transitive devDeps, expanding the CI vetting surface and introducing minor-version permalink/transform-semantics drift (Murat's risk math).

### Selected Starter: None — Hand-Authored Bootstrap

**Rationale (revised per Party Mode):**

1. **Per-corpus-release re-emit is the architectural fit decisive factor.** NFR25 requires every page to re-emit at every version tag. Eleventy's incremental rebuild is exactly the wrong default. A hand-authored script with explicit `--version <tag>` re-stamps every page unconditionally — simple, intentional, auditable.
2. **The corpus build's hard parts are bespoke regardless.** Hatnotes, glossary rewriting, locale-specific reading-level lints, methodology-claims-manifest parity, JSON-LD `ScholarlyArticle` injection, citation-widget composition: all hand-authored in either world. The SSG is doing the easy 30% (walk-and-render); we write the hard 70% either way.
3. **Substrate scale stays inside the cognitive-load envelope (NFR32).** Total tooling tree (build + lints + cache + dev-server harness) is ~1,400–2,000 LOC of author-time Node — a real implementation slice, but mindable end-to-end. A starter would compete with that mindfulness, not extend it.
4. **Existing prototype `iq-me.html` is not a starter** — it is a reference for scope and copy register, scheduled for removal per the PRD `epicCandidates` ("Epic: Prototype Removal — `git rm iq-me.html` on day one of new architecture").

**A note on auditability framing (Winston):** NFR21 (no-build-runtime) is a *runtime* auditability claim about the shipped JS, not a dev-time supply-chain purity claim about the build. The choice to vendor a SHA-pinned `marked` (or to author a strict-subset renderer instead — see "Pending Decision" below) does not weaken NFR21. Innovation #5 (no-build auditable IRT in browser JS) lives in `src/scoring/irt/`, not in `tools/build-methodology.mjs`.

**A note on server-side rendering:** the methodology corpus is **SSG** (build-time prerender via `make build-methodology` — every page is fully-rendered static HTML at deploy); the assessment SPA relies on **progressive enhancement** (semantically meaningful HTML in source + JS hydration for interactivity, per UX Step 11). **Runtime SSR is impossible on GitHub Pages** (strict static hosting, no server runtime) and would be forbidden on the Cloudflare Pages mirror anyway by NFR8 (no IP-based logging), NFR17 (byte-identical artifact across hosts), and NFR35 (outlast-the-maintainer — no host-account-binding runtime dependencies). The static-only commitment IS NFR21; SSG covers every legitimate "HTML in the source response" use case the project has.

### Realistic Build-Tooling Envelope (revised per Amelia)

The earlier "~200–400 LOC build script" estimate was the happy-path render loop in isolation. Honest bottoms-up:

**`tools/build-methodology.mjs`: ~900–1,400 LOC**

- Frontmatter parser (YAML subset, zero-dep): 80–120
- Walker + path→permalink resolver + per-version re-emit loop: 120–180
- Masthead / lede / trail / hreflang / JSON-LD / citation-widget injection (six templates × three locales): 250–350
- Source-hash drift (SHA-256 of EN normalized body, stored in `dist/.hashes/v<X>/<path>.json`): 80–120
- Version-mismatch hatnote logic: 40–60
- Glossary-link rewriter (tokenizer-aware; must NOT rewrite inside code / links / headings): 150–220 (the hidden cost most underestimate)
- Sitemap + robots + build manifest emission: 60–100
- Error reporting + dry-run + `--version` CLI: 80–120

**`tools/lint-*.mjs` (four scripts): ~330–490 LOC**

- Reading-level (Flesch-Kincaid EN, Oborneva-equivalent RU, Pisarek/Jasnopis-equivalent PL): 120–180
- Translation parity (EN source-hash diff vs RU/PL): 60–90
- Claims-manifest parity (build manifest vs scoring-engine `METHODOLOGY_CLAIMS`): 100–140
- Glossary coverage (every `asserts:` term defined in locale glossary): 50–80

**Cache skeleton (budgeted at v1 to avoid v2 retrofit): ~150 LOC** for `dist/.build-cache.json` incremental-emit-when-safe layer. The cliff is at v2: re-emitting N versions × M pages × 3 locales becomes 180 → 450 → 900 HTML files as the corpus accretes versions; build time crosses 10s by v3 without caching.

**Dev-server harness: ~70 LOC** (`chokidar` + `node:http` static server) — author-time live-reload while editing the corpus.

**Total tooling envelope: ~1,450–2,110 LOC** of author-time Node. This is a non-trivial implementation slice — surface it as a first-class epic, not a side project.

### Bootstrap Sequence

No `npx create-*` command. The first implementation epic scaffolds the empty repository structure and tooling Makefile, replacing the prototype:

```bash
git rm iq-me.html                                 # PRD epicCandidate: prototype removal
mkdir -p src/{scoring/irt,assessment,i18n,locales,content/methodology,content/locales,content/trails,css/{components,utilities}}
mkdir -p tests/{golden,playwright,a11y,perf,snapshots/methodology}
mkdir -p tools vendor                             # build-methodology.mjs, lints, fuzzers; vendor/marked.js or in-tree subset renderer
mkdir -p .github/workflows
touch Makefile LICENSES.md CITATION.cff README.md CONTRIBUTING.md
touch corpus/schema.json                          # frontmatter contract (Paige); a first-class architectural artifact
touch docs/corpus-build-conventions.md            # AI-assisted iteration guide (Winston); loaded on every session
```

The exact directory layout, build-script architecture, CI workflow set, and component file naming are addressed in Steps 4–7.

### First-Class Architectural Artifacts Adopted (Party-Mode-Surfaced)

1. **`corpus/schema.json`** — the methodology-corpus frontmatter contract. Enforces required fields (`title`, `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `asserts[]`, `glossaryRefs[]`, `sourceHashEN`). Validated by a `tools/lint-frontmatter.mjs` pre-build check. Schema is the contract; the renderer is the implementation. (Paige.)
2. **`docs/corpus-build-conventions.md`** — codified directory layout, frontmatter schema, slug-normalization rules, hreflang emission rules, glossary contract, per-corpus-release re-emit semantics, build-cache invalidation policy. Loaded by AI agents on every iteration. *This document IS the framework substitute.* (Winston's mitigation for the no-conventions tax.)
3. **CI assertions added to the cross-cutting list (Murat):**
   - **`byte-stable build`** — `make build && hash dist/; make clean && make build && hash dist/; diff`. Fails on non-deterministic output.
   - **`markdown-subset strict-mode lint`** — parse every `src/content/**/*.md` with the project's renderer in strict mode (unknown construct → fail); only the declared subset is permitted.
   - **`golden HTML snapshots`** — per content file, snapshot in `tests/snapshots/methodology/`. Drift requires a PR touching `src/content/**` AND `tests/snapshots/**` in the same commit, gated by `methodology-claims` manifest review.

### Pending Decision (carried to Step 4)

**Markdown renderer strategy:**

- **A.1 (Amelia):** Vendor `marked` (single-file, ~2 KB, MIT, zero transitive deps) into `vendor/marked.js` with SHA pinned in `vendor/SHASUMS`. Full CommonMark coverage; no spec parity risk.
- **A.2 (Murat):** Hand-roll a strict-mode renderer (~200 LOC) against a *declared markdown subset* (headings, paragraphs, emphasis, code fences, links, ordered/unordered lists capped at depth 2; no HTML passthrough; no autolinks). The subset itself becomes an auditable artifact published in the methodology manifest. Converts "did we implement CommonMark correctly" (unbounded) into "does our corpus stay inside the declared subset" (bounded, lintable, CI-enforceable). Slightly stronger auditability alignment; small risk that the declared subset proves too narrow as the corpus grows.

Both compliant with NFR21/NFR33; both fit the panel's hold-(A) verdict. Decided in Step 4 (Architectural Decisions).

### Epic Candidate Surfaced

Add to the carry-forward `epicCandidates` register: **"Epic: Corpus Build Pipeline"** — author `tools/build-methodology.mjs` + four lint scripts + cache skeleton + dev-server harness + golden-snapshot fixtures (~1,450–2,110 LOC tooling envelope). Sequenced before the first methodology content lands.

### Architectural Decisions Inherited from "No Starter" Choice

- **Language & Runtime:** ES2022 vanilla JavaScript, no TypeScript, no transpilation. Native ES modules served directly to evergreen browsers.
- **Styling Solution:** Custom hand-rolled CSS design system, two-layer token architecture (`/css/primitives.css` → `/css/semantic.css`), one component CSS file per component, kebab-BEM, state via `data-*` attributes; no preprocessor, no Tailwind, no styled-components, no CSS-in-JS. (UX Step 6 commitment.)
- **Build Tooling:** Single `Makefile`. Targets: `make build-methodology`, `make test`, `make lint`, `make dev` (live-reload static server for corpus authoring), `make clean`. Dev tools invoked via `npx --yes` for binary-only tools, or vendored under `vendor/` with SHA pin for renderers/parsers; pinned `devDependencies` permitted in `package.json` for tools requiring node-resolution.
- **Testing Framework:** `node --test` for scoring engine + pure-function modules (committed golden-vector parity vs R `mirt 1.41.x` to ±0.001 logits, ≥1,000 patterns) + corpus build snapshot tests; Playwright for integration / CI assertions (network-trace, viewport-overflow, co-equal-triplet computed-style, `iqme:reveal-stage` event ordering, cropping fuzzer, CSP-violation count, negative-assertion suite).
- **Code Organization:** Source organized by surface (`src/assessment/`, `src/scoring/irt/`, `src/i18n/`, `src/css/components/`, `src/content/methodology/<lang>/`) rather than by file-type. Each UI component is one CSS file (Step 11 commitment) + optional sibling JS. The whole tree is `grep`-able by a contributor in under 5 minutes (NFR26 auditability).
- **Development Experience:** Static file server (`make dev` runs a ~70 LOC chokidar + `node:http` harness) for corpus authoring with live-reload; the assessment SPA dev loop is browser reload (the runtime-zero-build invariant means dev and prod are byte-identical, so there is no "build for production" step to drift from the dev experience).

**Note:** Project initialization (prototype removal + directory scaffolding + Makefile + license/citation/readme stubs + `corpus/schema.json` + `docs/corpus-build-conventions.md`) is the first implementation story. The Corpus Build Pipeline epic follows immediately.

## Core Architectural Decisions

### Decision Priority Analysis

**Already decided by PRD / Step 3 (not re-litigated):**

- **Data — persistence:** None at runtime. In-memory session state; static JSON for content/locales/glossary/trails; opt-in `localStorage` for `theme` and "Save my result"; `sessionStorage` flag for interrupted-session detection. (FR1, FR6, FR26, NFR8, NFR9)
- **Data — database:** None (architectural impossibility on GitHub Pages).
- **Data — caching:** Browser HTTP cache only; no service worker for v1 (deferred per NFR23 cache-invalidation conflict). Author-time `dist/.build-cache.json` is internal tooling (see D8, deferred-with-trigger).
- **Auth — authentication:** None. No accounts, no email, no login, no SSO. (FR1, NFR8)
- **Auth — authorization:** None at app level. Repository-level: maintainer + per-language reviewer-of-record dual-approval on non-EN content-key PRs (branch protection). (FR49, NFR29)
- **Auth — encryption:** None at runtime (no PII, no secrets). HTTPS-in-transit via host TLS. `crypto.getRandomValues` for session seed (unpredictability, not secrecy). (NFR6, NFR10)
- **API:** None. No REST, no GraphQL, no WebSocket, no SSE. Only same-origin GET to static assets. (NFR6)
- **Frontend — framework:** None (vanilla ES2022). (NFR21, NFR33)
- **Frontend — state mgmt:** Single `src/assessment/state.js` module holding `{ currentItem, responses, startedAt, locale, seed }` in memory; explicit re-render on transitions. (PRD §Technical Architecture)
- **Frontend — routing:** Assessment SPA — hash-based (`#/test`, `#/result`). Methodology corpus — path-based (`/methodology/v<X>.<Y>.<Z>/<lang>/<path>/index.html`).
- **Infra — hosting:** GitHub Pages canonical + Codeberg / Cloudflare Pages mirror, byte-identical. Relative paths throughout. (NFR17)
- **Infra — env config:** None at runtime. No environment variables. No `.env` files.
- **Infra — monitoring/logging:** None. Zero telemetry, zero analytics, zero error reporting. Graceful localized JS-error fallback page. (NFR6, NFR20)
- **Infra — archival:** Zenodo (DOI per corpus release) + Internet Archive (Save Page Now per corpus release) + Software Heritage (`save` per corpus release). (NFR18, NFR25)

**Critical decisions (block implementation; resolved in this step):**

- D1 Markdown renderer strategy
- D2 Repository structure
- D3 Scoring engine module decomposition + public API
- D6 GitHub Actions workflow taxonomy
- D7 Per-corpus-release version-tag scheme
- D9 Methodology authoring layout

**Important decisions (shape architecture; resolved in this step):**

- D4 i18n loading strategy
- D5 CSS asset loading
- D10 Browser-too-old fallback

**Deferred (post-MVP, with explicit triggers — Party Mode round 2 revisions):**

- **D8 — Two-tier build cache.** Architecture commits to the *invariant* (cache-when-needed must follow the two-tier model; epoch hash + per-page entries; contract test). The implementation itself is deferred until empirical full-build time exceeds **30 seconds**. At v1 with ~90 corpus files on vanilla Node, full builds run in 1–3 seconds; cache infrastructure is YAGNI at v1 (Mary's analysis). Trigger: build wall-clock > 30s OR third corpus version tag, whichever first.
- **Meta-CI workflow.** Defends against workflow-bypass — an org-scale adversarial failure mode that does not apply to a solo dev with 0–1 contributors. Deferred until **second sustained external contributor** is active. v1 workflow set is 3 files (pr-checks + release + scheduled), not 4.
- **CI gate matrix.** Collapsed to "all lints all PRs" at v1. The matrix abstraction (per-directory routing of which lints fire) assumes a contributor population that doesn't yet exist. Reintroduce when contributor count ≥ 3.
- **Service worker for offline assessment** (deferred to v1.x per NFR23 cache-invalidation conflict).
- **Version-mismatch hatnote component.** Only triggers on cited-old-version traffic, which is empty at launch. Defer to v1.0.x or until first cited-old-version arrival.
- **Tail-aware-trail component.** UX Phase 2 (Step 11). Ship if budget allows in v1; otherwise v1.0.1.
- **EAP-shrinkage diagram.** UX Phase 2. Validity-envelope diagram ships at v1; EAP-shrinkage may slip to v1.0.1.
- **BibTeX format in `cite-this-page-widget`.** Nice-to-have within v1 per PRD scoping; APA + Wikipedia-template are launch-required.
- **High-contrast theme adaptations** (UX Phase 3).
- **RTL layout adaptations** (no RTL target in v1; non-breaking to add).
- **Adaptive testing UI variants** (v2 territory per PRD growth-features).

---

### Data Architecture

**Methodology corpus authoring layout (D9 — Layout 1)**

- **Per-locale tree** at `src/content/methodology/{en,ru,pl}/<path>.md`. Each locale's tree mirrors EN structure.
- **CODEOWNERS:** `src/content/methodology/ru/** @ru-reviewer-of-record` (and `pl/` equivalent). Single-line per locale; branch protection enforces dual approval (maintainer + reviewer-of-record) on non-EN content-key PRs.
- **Block-level content keys (per NFR27):** inline annotations on block-level Markdown elements (`## Norming sample bias {#block-norming-sample-bias}`). RU/PL files carry `block_hashes:` frontmatter mapping block IDs to the corresponding EN-source SHA-256 at last review. CI parity lint extracts block IDs per locale; fails on missing keys, orphan keys, or stale source hashes.
- **Glossary:** `src/content/glossary/<lang>.json` — flat `{ term: { definition: "...", glossaryRefs: [...] } }` map. Glossary page auto-rendered from JSON at build time. Glossary-link rewriter reads from the same JSON.
- **Crisis-resources:** `src/content/crisis-resources/<lang>.json`. In-bundle per FR20, lazy-loaded only on the bottom-decile tail-scene render path.

**Build cache (D8 — deferred with trigger)**

Architecture commits to the invariant. Implementation deferred per Mary's YAGNI analysis: ~90 files × vanilla Node rebuild in 1–3s on a MacBook; cache infrastructure costs ~200 LOC + contract test + cognitive load that doesn't earn its keep at v1. Trigger: full build wall-clock > 30s OR third corpus version tag.

When triggered, implement as: two-tier cache at `dist/.build-cache.json` — global epoch hash from concatenated SHAs of all global build inputs + per-page entries keyed by `(corpus-version, source-path)` storing source-hash, frontmatter-hash, output path, output hash. Epoch change → invalidate all; per-page hash change → re-render that page only. Add `tools/lint-build-cache.mjs` (~40 LOC) as contract test. Schema in `corpus/build-cache-v1.schema.json`.

---

### Authentication & Security

No additional decisions beyond the already-pinned baseline. Confirming the absences as architectural surface:

- **No auth UI exists at code level.** No `<form>` posting credentials. No localStorage write for "logged-in" state. No cookies.
- **CSP enforcement** via static `<meta http-equiv="Content-Security-Policy">` in every shipped HTML. Playwright CI test asserts CSP-violation count = 0 during a full session (NFR7).
- **`crypto.getRandomValues` is the only source of randomness in scoring/selection paths.** `tools/lint-no-math-random.mjs` (~30 LOC, repo-grep) blocks PRs that introduce `Math.random` under `src/scoring/` or `src/assessment/` (NFR10).
- **Reviewer-of-record per language per version surfaces in the methodology masthead** (NFR29, UX Step 11). `corpus/schema.json` frontmatter contract requires `reviewer` and `reviewerHandle`; missing → frontmatter lint fail.

---

### API & Communication Patterns

No additional decisions beyond the already-pinned baseline. Confirming the surface:

- **No runtime API surface.** All "data fetching" is browser `fetch()` of static JSON assets from the same origin.
- **i18n loading mechanism (D4):** browser `fetch('/src/i18n/locales/<lang>/strings.json')` at landing. Single eager bundle per locale, ~10–15 KB. Locale-switch blocked mid-session (FR8) means no late-binding namespaces needed.
- **Crisis-resources loading:** browser `fetch('/src/content/crisis-resources/<lang>.json')` lazy-loaded only when bottom-decile tail-scene is about to render. Pre-loaded via `<link rel="prefetch">` from the result-page render.
- **Methodology corpus from SPA:** browser navigation (`<a href="/methodology/v<X>/<lang>/<path>/">`) — full-page nav, not in-app fetch. The four result-page methodology-target pages are `<link rel="prefetch">` from the result-page render (per UX Step 7).
- **Item asset preloading:** the full 16-item session subset is preloaded after consent confirms — batched same-origin `fetch` per item. Avoids per-item network round-trips that would leak access patterns and introduce per-item latency variance.

---

### Frontend Architecture

**D1 — Markdown renderer strategy (declared subset, expanded per Sally)**

- **Decision:** Declared-subset strict-mode renderer at `tools/markdown-subset.mjs` (~200 LOC). Subset published at `corpus/markdown-subset-v1.md` as a methodology artifact, versioned with the corpus.
- **v1 declared subset:**
  - Block: H1–H4 headings (with optional `{#block-id}` suffix for NFR27 content-key annotation); paragraphs; ordered and unordered lists (depth ≤ 2); fenced code blocks (` ``` `); basic tables (header row + body, no alignment specifiers); **blockquotes** (single-level `> ` prefix, nestable to depth 2 — *added per Sally for scholarly-prose voice-shift signaling*); **footnotes** (`[^id]` inline reference + `[^id]: definition` block; rendered as superscript inline + footer block at end of page — *added per Sally for source-citation scholarly trust*).
  - Inline: emphasis (`*` and `**`); inline code (`` ` ``); links (`[text](url)`); image references (`![alt](url)` — required for SVG diagram references per Sally).
- **Explicitly NOT supported:** HTML passthrough; autolinks; reference-style links; HTML entities beyond named-character; nested lists beyond depth 2; setext-style headings; thematic breaks; definition lists; strikethrough; task lists.
- **CI gate:** `tools/lint-markdown-subset.mjs` parses every `src/content/**/*.md` with the renderer in strict mode (unknown construct → fail). Combined with the golden HTML snapshot suite per content file (Murat): drift requires a PR touching `src/content/**` AND `tests/snapshots/**` in the same commit, gated by `methodology-claims` manifest review.
- **Diagrams:** Validity-envelope and EAP-shrinkage SVG diagrams are referenced via `![alt](path/to/diagram.svg)`. The SVG file owns its translated `<title>`/`<desc>` (NFR31). Markdown stays clean; diagrams remain first-class assets.
- **Subset evolution:** future need for an unsupported construct → PR adds to `corpus/markdown-subset-v<N+1>.md` + extends `tools/markdown-subset.mjs` + bumps corpus MINOR version (additive). Tracked in corpus changelog.

**D2 — Repository structure (Layout A)**

```
.
├── src/
│   ├── assessment/                        # SPA modules: landing, consent, item-runner, result, methodology-shell
│   │   ├── state.js                       # single in-memory session state module
│   │   ├── landing.js, consent.js, item-runner.js, result.js, methodology-shell.js
│   │   ├── reveal-stage.js                # iqme:reveal-stage DOM event dispatcher
│   │   └── locale-switch.js               # FR8 mid-session blocker
│   ├── scoring/irt/
│   │   ├── index.js                       # named-export public surface + scoreSession() (D3)
│   │   ├── likelihood.js, eap.js, se.js, quadrature.js
│   │   └── METHODOLOGY_CLAIMS.json        # claims manifest (D3)
│   ├── i18n/
│   │   ├── locale-loader.js               # fetch() single-bundle loader (D4)
│   │   └── locales/{en,ru,pl}/strings.json
│   ├── content/
│   │   ├── methodology/{en,ru,pl}/<path>.md   # per-locale tree (D9)
│   │   ├── glossary/<lang>.json
│   │   ├── trails/<lang>.json
│   │   └── crisis-resources/<lang>.json
│   ├── css/
│   │   ├── reset.css, primitives.css, semantic.css, base.css
│   │   ├── components/<component>.css     # 25 component files per UX Step 11
│   │   └── utilities.css
│   ├── items/                             # ICAR-MR matrix item SVG + item-parameters.json
│   └── index.html                         # SPA entry (parallel <link> chain — D5; <script nomodule> fallback — D10)
├── corpus/
│   ├── schema.json                        # frontmatter contract (Paige)
│   └── markdown-subset-v1.md              # declared subset artifact (D1, includes blockquotes + footnotes)
├── templates/                             # build-time HTML templates for methodology corpus
│   ├── masthead.html.tmpl, lede.html.tmpl
│   ├── citation-widget.html.tmpl, jsonld-scholarlyarticle.html.tmpl
│   ├── stale-translation-hatnote.html.tmpl
│   └── translation-in-progress-stub.html.tmpl
├── tools/                                 # author-time Node tooling (~1,200–1,800 LOC at v1 — cache deferred)
│   ├── build-methodology.mjs              # ~900–1,400 LOC (Amelia)
│   ├── markdown-subset.mjs                # ~200 LOC (D1)
│   ├── lint-{frontmatter,markdown-subset,translation-parity,reading-level,glossary-coverage,claims-manifest,license-provenance,css-link-order,no-math-random}.mjs
│   └── dev-server.mjs                     # ~70 LOC chokidar + node:http live-reload
├── tests/
│   ├── golden/vectors.json                # ≥ 1000 IRT response patterns (NFR22)
│   ├── snapshots/methodology/             # golden HTML per content file (Murat)
│   ├── playwright/                        # e2e: network-trace, viewport, cropping fuzzer, event ordering, CSP, negative-assertions, cross-browser smoke
│   ├── a11y/                              # axe-core / pa11y configs
│   ├── perf/                              # Lighthouse-in-CI configs
│   └── unit/                              # node --test non-scoring units
├── docs/                                  # internal contributor docs
│   └── corpus-build-conventions.md        # Winston's framework substitute
├── vendor/                                # SHA-pinned single-file dev tools (initially empty per A.2 choice)
│   └── SHASUMS
├── dist/                                  # build output (gitignored; CI emits; deploy artifact)
├── .github/
│   ├── workflows/{pr-checks,release,scheduled}.yml   # 3 workflows at v1 (meta-ci deferred)
│   └── CODEOWNERS                         # per-locale reviewer-of-record (D9)
├── Makefile                               # targets: build-methodology, test, lint, dev, clean
├── LICENSES.md, CITATION.cff
├── CONTRIBUTING.md, README.md
└── package.json                           # devDependencies only (axe-core, Playwright, Lighthouse, etc.)
```

**D3 — Scoring engine public API (Option α + JSON manifest)**

- **Module decomposition** (PRD-committed): `src/scoring/irt/{likelihood.js, quadrature.js, eap.js, se.js, index.js}`. Pure functions, no DOM, no globals, no async (FR16, FR17).
- **Public API surface** (D3):
  ```js
  // src/scoring/irt/index.js — public surface
  export { logLikelihood }    from './likelihood.js';
  export { quadraturePoints } from './quadrature.js';
  export { eapEstimate }      from './eap.js';
  export { standardError }    from './se.js';

  // High-level convenience for assessment SPA
  export function scoreSession({ responses, itemParameters, normingStats }) {
    const quad = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
    const theta = eapEstimate(responses, itemParameters, quad);
    const sem = standardError(theta, responses, itemParameters);
    const se_total = Math.sqrt(sem ** 2 + normingStats.se_norming ** 2);
    return {
      theta, sem, se_total,
      percentile: thetaToPercentile(theta, normingStats),
      iqScale:    thetaToIqScale(theta, normingStats),
      displayedBand: { lower: theta - 1.96 * se_total, upper: theta + 1.96 * se_total },
    };
  }
  ```
- **METHODOLOGY_CLAIMS.json format:**
  ```json
  {
    "$schema": "corpus/methodology-claims-v1.schema.json",
    "version": "1.0.0",
    "claims": [
      {
        "id": "irt-model",
        "asserts": "IRT 2PL EAP estimation",
        "method": "eapEstimate",
        "methodology_page": "/methodology/v<X>/<lang>/scoring/eap/",
        "reference": "Embretson & Reise (2000)"
      },
      {
        "id": "quadrature",
        "asserts": "61 Gauss-Hermite quadrature nodes over θ ∈ [-6, 6]",
        "method": "quadraturePoints",
        "methodology_page": "/methodology/v<X>/<lang>/scoring/eap/",
        "reference": "mirt::fscores quadpts=61 default"
      },
      {
        "id": "uncertainty-band",
        "asserts": "95% CI from root-sum-square of SEM and norming-sample SE",
        "method": "scoreSession.displayedBand",
        "methodology_page": "/methodology/v<X>/<lang>/scoring/uncertainty/",
        "reference": "FR15"
      }
    ]
  }
  ```
- **CI parity lint** (`tools/lint-claims-manifest.mjs`): for each claim in `METHODOLOGY_CLAIMS.json`, parse the referenced methodology page's frontmatter `asserts:` field; assert exact match. Missing assertion on the corresponding methodology page → fail. Asserting a claim with no `methodology_page` → fail. (Innovation #2, NFR23.)

**D4 — i18n loading strategy (single eager bundle per locale)**

- `src/i18n/locale-loader.js` — at landing, reads detected/preferred locale, `fetch('/src/i18n/locales/<lang>/strings.json')`, parses, stores in module-level `strings` map.
- Locale chosen by: (1) explicit user click on language switcher → persisted in `localStorage`; (2) on first visit absent localStorage: `Accept-Language`-based detection client-side via `navigator.languages`; (3) fallback EN.
- Locale switching during session is blocked (FR8) by `src/assessment/locale-switch.js`, which checks session state and renders the locale-switch-blocker hint component instead.
- Bundle structure: `{ namespace: { key: "string" } }`. ~5 namespaces (landing, consent, item-runner, result, chrome). ~10–15 KB per locale total.
- Crisis-resources: separate `src/content/crisis-resources/<lang>.json`, lazy `fetch()` only on bottom-decile tail-scene render. Pre-loaded via `<link rel="prefetch">` from the result-page render.

**D5 — CSS asset loading (parallel `<link>` chain)**

- `<head>` contains ~15–20 `<link rel="stylesheet" href="/src/css/...">` tags in declared cascade order: `reset.css` → `primitives.css` → `semantic.css` → `base.css` → `components/*.css` (alphabetical or specified) → `utilities.css`.
- HTTP/2 multiplexing fetches all in parallel.
- `tools/lint-css-link-order.mjs` (~30 LOC) parses each HTML entry-point and asserts the link order matches the declared cascade — CI gate.
- Revisits UX Step 6's "single `<link>`" commitment in favor of avoiding the `@import` waterfall on Slow 4G. Sally confirmed (Party Mode round 2): "single `<link>`" was implementation-detail dressed as UX-substantive; the substantive UX commitment (audit-friendly authored files preserved as-shipped) is honored either way.

**D10 — Browser-too-old fallback**

- Single URL (`/index.html`). No redirect. `<div id="fallback" style="display:none">` follows the SPA mount point.
- Tri-lingual stacked content (EN/RU/PL sections, each `<article lang="...">`), each with: a one-paragraph upgrade message + browser-upgrade links (Chrome / Firefox / Safari / Yandex Browser) + a link to `/methodology/v<X>.<Y>.<Z>/<lang>/` (corpus reads without ES modules — substantial usability win for citers on older browsers).
- Toggle:
  ```html
  <script nomodule>
    document.getElementById('fallback').style.display='block';
    document.getElementById('app').style.display='none';
  </script>
  ```
- Fallback copy passes per-language reading-level lint (NFR28). Reviewer-of-record per language signs off on launch.
- Same `<noscript>` content as the fallback so JS-disabled users see the same message.

---

### Infrastructure & Deployment

**D6 — GitHub Actions workflow taxonomy (3 files at v1; meta-ci deferred per Mary)**

- **`.github/workflows/pr-checks.yml`** — `on: pull_request: [main]` + `on: push: [main]`. Parallel jobs (v1 posture: "all lints, all PRs" — gate-matrix collapsed per Party Mode round 2):
  - `lint-frontmatter` · `lint-markdown-subset` · `lint-translation-parity` · `lint-reading-level` · `lint-glossary-coverage` · `lint-claims-manifest` · `lint-license-provenance` · `lint-css-link-order` · `lint-no-math-random`
  - `unit-scoring-golden-vectors` (node --test; ±0.001 logits vs R mirt 1.41.x) · `unit-markdown-subset-renderer` · `unit-misc`
  - `snapshot-methodology` (golden HTML diff per content file) · `snapshot-byte-stable-build` (two-clean-runs hash equality)
  - `a11y-axe-core` (landing + consent + result + sample methodology in 3 locales)
  - `perf-lighthouse` (landing + result + sample methodology — FCP/LCP/CLS/TTI/page-weight budgets)
  - `e2e-network-trace` (zero-third-party) · `e2e-viewport-overflow` (7 widths) · `e2e-cropping-fuzzer` (~1800 crops/scene) · `e2e-reveal-stage` (event ordering) · `e2e-csp-violations` · `e2e-negative-assertions` (no navigator.share, no og:image per result, no role=alert, no alert/confirm/prompt, no inline script)
  - `e2e-cross-browser` (Chromium / Firefox / WebKit Playwright smoke)
  - `e2e-yandex-browser` (manual or via Yandex Browser-compatible Playwright; pre-launch validation gate per PRD §Browser Matrix)
- **`.github/workflows/release.yml`** — `on: push: { tags: ['app-v*.*.*', 'corpus-v*.*.*'] }`. Per D7 dual-namespace:
  - On `app-v*`: build `dist/` (app modules only — corpus version unchanged); deploy to GitHub Pages + mirror; open GitHub Release with app changelog.
  - On `corpus-v*`: build `dist/methodology/v<new>/{en,ru,pl}/...` for all locales; deploy; trigger Zenodo DOI mint via GitHub-Zenodo integration; trigger Internet Archive Save Page Now for new permalinks; trigger Software Heritage `save`; open GitHub Release with corpus changelog + DOI.
- **`.github/workflows/scheduled.yml`** — `on: schedule: { cron: '0 6 * * 1' }` (Monday 06:00 UTC) + `on: workflow_dispatch:`:
  - `mirror-health` (Codeberg + Cloudflare Pages serve byte-identical artifact)
  - `methodology-link-rot` (external links from methodology corpus still resolve)
  - `archival-snapshot-freshness` (latest tagged release present on IA + SH)
  - Note (per John): scheduled checks may themselves slip to v1.0.x if launch timeline tightens; pr-checks + release are the launch-required pair.
- **Meta-CI workflow — DEFERRED.** Per Mary's analysis: workflow-bypass is an org-scale adversarial failure mode that does not apply to a solo dev with 0–1 contributors. Reintroduce when second sustained external contributor is active.

**D7 — Per-corpus-release version-tag scheme (decoupled, standard semver)**

- **Two tag namespaces:**
  - `app-v<X>.<Y>.<Z>` — application code releases (gates GitHub Pages deploy).
  - `corpus-v<X>.<Y>.<Z>` — methodology corpus releases (gates Zenodo DOI mint + per-corpus-release re-emit at new permalinks + IA + SH archival).
- **Semver semantics (corpus):** MAJOR reserved for citation-contract breakage (permalink scheme change; manifest schema breakage; removal of cited pages). MINOR for additive changes (new pages, new locale, glossary expansion, METHODOLOGY_CLAIMS additions, expanded declared subset). PATCH for corrections preserving cited content (typos, reading-level rewrites within the same claim, broken-link repairs, frontmatter metadata updates).
- **Semver semantics (app):** standard semver — MAJOR for breaking UX / accessibility / API surface changes; MINOR for additive features; PATCH for fixes.
- **v1.0.0 launch:** `app-v1.0.0` and `corpus-v1.0.0` tagged same-day. Subsequent cadence is independent.
- **Per-corpus-release re-emit (NFR25):** on `corpus-v<new>` tag, every methodology page is re-emitted under `/methodology/v<new>/<lang>/<path>/index.html`, even unchanged pages. Prior `/methodology/v<prior>/` permalinks remain — citations are archaeological artifacts that must keep resolving.

---

### Decision Impact Analysis

**Implementation sequence — revised per Party Mode round 2 (John's vertical-slice resequence + 5 parallel gate-outreach tracks):**

The original 10-epic linear sequence buried the load-bearing UX hypothesis (the methodology-handoff click) under ~1,450 LOC of tooling and a full translation pass. The revised sequence puts a tester-testable vertical slice early and runs external-human-gate outreach in parallel from the moment the scoring engine is real.

| # | Epic | Sequence |
|---|---|---|
| 0 | Bootstrap & Prototype Removal | First (`git rm iq-me.html`; scaffold Layout A; commit `Makefile`, `LICENSES.md`, `CITATION.cff`, `CODEOWNERS`, `README.md`, `CONTRIBUTING.md`, `corpus/schema.json`, `corpus/markdown-subset-v1.md`, `docs/corpus-build-conventions.md`) |
| 1 | Scoring Engine + golden vectors (~250 LOC + ≥1,000 patterns vs R mirt) | After 0; small and unblocking |
| 2 | **Vertical Slice** — minimal SPA shell + result page + 3 EN methodology stub pages + handoff click | After 1; **tester-testable** — proves the load-bearing UX hypothesis before broader investment |
| 3 | Corpus Build Pipeline (`tools/build-methodology.mjs` + `markdown-subset.mjs` + core lint scripts + dev-server harness) | After 2 vertical-slice validates the approach |
| 4 | Methodology Corpus v1 EN (full 30 pages) | After 3; can run in parallel with 5 |
| 5 | Assessment SPA hardening (item-runner, consent, full ceremony, asymmetric tail-scenes, fallback, full i18n harness, 25 CSS components) | Parallel with 4 (share only the URL contract) |
| 6 | RU + PL Translation (gated by per-language reviewer-of-record sign-off from Gate Epics 9c/9d) | After 4 EN-stable and 9c/9d translator engaged |
| 7 | CI Pipeline (pr-checks.yml + release.yml; scheduled.yml may slip to v1.0.x) | Can land incrementally throughout 1–6 |
| 8 | v1.0.0 Launch — coordinated `app-v1.0.0` + `corpus-v1.0.0` | After Gate Epics 9a–9e all clear |

**Gate Epics 9a–9e — five parallel outreach tracks, started at Epic 1 completion (NOT Epic 8):**

| Gate | Epic | Outreach start |
|---|---|---|
| 9a | ICAR / SAPA project written license confirmation | At Epic 1 completion |
| 9b | External psychometrician recruitment + sign-off | At Epic 1 completion |
| 9c | RU clinical-register translator recruitment + ongoing translation review | At Epic 1 completion |
| 9d | PL clinical-register translator recruitment + ongoing translation review | At Epic 1 completion |
| 9e | 5 × 3 native-speaker tester recruitment + credibility validation (≥12/15 launch gate) | At Epic 2 vertical-slice testability; full cohort by Epic 5 |

Each gate is its own outreach clock with independent lead time. Per John: "Five humans with independent lead times collapsed into one epic = one blocked critical path masquerading as one task. Each gate needs its own outreach clock starting NOW, not at code-complete."

**Cross-component dependencies:**

- **Scoring Engine ↔ Methodology Corpus:** `METHODOLOGY_CLAIMS.json` declarations must each have a corresponding methodology page with matching `asserts:` frontmatter — enforced by `lint-claims-manifest` (Innovation #2). Adding a new claim or methodology page requires updating both in the same PR.
- **Corpus build pipeline ↔ CI workflows:** golden HTML snapshots are authored once and updated only via deliberate PRs touching `tests/snapshots/methodology/` alongside `src/content/methodology/`. The byte-stable build assertion gates non-deterministic output.
- **i18n harness ↔ assessment SPA components:** every UI string in any component must exist in the locale `strings.json` namespace.
- **Browser-too-old fallback ↔ methodology corpus:** the fallback HTML links to `/methodology/v<X>.<Y>.<Z>/<lang>/`; the version string must be valid at deploy time. `release.yml` substitutes the current corpus version into the fallback link as part of the build (the only build-time version substitution touching the SPA shell).
- **App release ↔ corpus version:** when `app-v*` is released, the app shell's footer link to the methodology corpus uses the most-recently-tagged corpus version (`git describe --tags --match 'corpus-v*' --abbrev=0`).

**CI execution at v1 (gate-matrix-collapsed posture per Mary):** every lint runs on every PR. The selective gating matrix (which lints fire per touched directory) is a Phase-2 contributor-experience optimization, reintroduced when contributor count ≥ 3. v1 wall-clock cost: ~10–30 seconds of unnecessary lint runs on small PRs, vs ~50 LOC of matrix-routing logic the solo dev must maintain. The trade is obviously in favor of "run all lints" at v1.

## Implementation Patterns & Consistency Rules

This section consolidates the conventions every AI agent and human contributor must follow. Most patterns are pinned upstream (PRD, UX, Steps 2–4); decisions resolved in Step 5 are marked. Party Mode round 3 (Amelia + Murat + Paige) tightened the lint architecture, added 10 pattern-coverage gaps, and stress-tested the camelCase JSON decision. **Rule of thumb: if a pattern is documented here, follow it; don't invent a parallel convention.**

### Naming Patterns

**CSS (UX Step 11):**
- Block: `.score-panel`. Element: `.score-panel__anchor`. Modifier (variants): `.score-panel--bottom-decile`.
- **State via `data-*` attributes, NEVER stateful classes.** `[data-reveal-stage="anchor"]`, `[data-theme="dark"]`, `[data-locale="ru"]`, `[data-translation-stale="true"]`.
- One component CSS file per component in `src/css/components/<block-name>.css`; file name matches block selector.

**JavaScript:**
- Identifiers: **camelCase** (variables, functions, methods).
- Module file names: **kebab-case** (`locale-loader.js`, `reveal-stage.js`).
- Constants (true module-level): **UPPER_SNAKE_CASE** (`MAX_QUADPTS`, `DEFAULT_LOCALE`).
- Exports: **named exports only**; default exports forbidden (named-export surface preserves grep-ability; Tomáš's audit-friendly read).
- File extensions: `.mjs` for Node author-time scripts (`tools/**`, `tests/**`); `.js` for browser-loaded ES modules (`src/**`).
- **No PascalCase classes** — vanilla ES2022 has no class-based components here; factory functions if construction needed.

**File / directory:** all paths **kebab-case**. One concept per file; file name matches concept.

**DOM events:** namespace `iqme:<verb-or-state>` (`iqme:reveal-stage`). Payload shape minimum `{ stage, t }`; additional fields camelCase. Dispatch via `document.dispatchEvent(new CustomEvent(...))`.

**HTML ids:** kebab-case. Used sparingly — prefer `data-*` for JS hooks.

**Block-level content keys (NFR27):** `block-<kebab-descriptor>` (`{#block-norming-sample-bias}`). Stable across versions; renamed only via citation-contract-breaking corpus MAJOR bump.

**Tags / releases (D7):** `app-v<X>.<Y>.<Z>` and `corpus-v<X>.<Y>.<Z>`; pre-release suffix `-pre.N`.

**Workflow files (D6):** kebab-case (`.github/workflows/pr-checks.yml`).

### JSON Field Naming Convention (Step 5 D-A — camelCase, Party Mode held)

**All JSON files use camelCase** for field names. This includes:
- Methodology frontmatter: `lastReviewed`, `reviewer`, `reviewerHandle`, `sourceHashEn`, `blockHashes`, `asserts`, `glossaryRefs`
- `src/scoring/irt/METHODOLOGY_CLAIMS.json`: `methodologyPage`, `reference`, `method`, `asserts`
- `corpus/schema.json` validates camelCase frontmatter
- `src/i18n/locales/<lang>/strings.json`: `namespace.key` (both camelCase: `result.bandLabelAverage`, `consent.continueButton`)
- `src/content/glossary/<lang>.json`: term keys are **camelCase** (`irt`, `eap`, `flynnEffect`, `sapaProject`, `gfReasoning`) — Paige's `flynnEffect` slip is ratified as the rule, not a slip
- `src/content/trails/<lang>.json`, `src/content/crisis-resources/<lang>.json`: camelCase fields
- `dist/.build-cache.json` (when implemented): camelCase

**Frontmatter example (RU methodology page):**

```yaml
---
title: "Шкала перцентилей и эквивалент IQ"
version: "1.0.0"
lastReviewed: "2026-05-15"
reviewer: "Anna Petrova"
reviewerHandle: "@apetrova"
sourceHashEn: "sha256:abc123..."
blockHashes:
  block-percentile-definition: "sha256:..."
  block-iq-scale-mapping: "sha256:..."
asserts:
  - "Percentiles derived from ICAR-MR SAPA norming sample"
  - "IQ scale = 100 + 15 × z(theta)"
glossaryRefs: ["percentile", "iqScale", "z"]
---
```

**Acknowledged trade-off** (Paige's stress-test): camelCase diverges from common Pandoc/Jekyll/Hugo frontmatter convention (which often uses snake_case). Translators may experience a small read-stumble on `lastReviewed` vs the more familiar `last_reviewed`. The decision favors one-convention-across-codebase ergonomics for JS callers + AI-agent consistency over editorial-tool convention alignment. Documented as a known cost; revisit if translator feedback during the 5×3 tester round flags it as friction.

### Structure Patterns

**Repository layout (D2 — Layout A):** see Step 4 Frontend Architecture.

**Test file naming and location (Step 5 D-C):**
- **Mirrored tree under `tests/`** matching `src/`:
  - `src/scoring/irt/eap.js` → `tests/unit/scoring/irt/eap.test.mjs`
  - `src/assessment/state.js` → `tests/unit/assessment/state.test.mjs`
  - **`tools/markdown-subset.mjs` → `tests/unit/tools/markdown-subset.test.mjs`** (Amelia's mirror-rule edge case: tools tests live at `tests/unit/tools/`, preserving the literal mirror rule)
- **Suffix:** `.test.mjs` (matches `node --test` default discovery).
- **Co-located tests forbidden.** `src/**` contains only shipped artifacts.
- **Subtree contracts:**
  - `tests/unit/**` — pure-function unit tests (`node --test`)
  - `tests/golden/vectors.json` — golden vector set for scoring parity
  - `tests/snapshots/methodology/**` — golden HTML per content file (Murat)
  - `tests/playwright/**` — e2e and CI assertion specs
  - `tests/a11y/**` — axe-core / pa11y configs and pages
  - `tests/perf/**` — Lighthouse-in-CI configs

**Component / module structure:**
- One CSS file per component in `src/css/components/<component-name>.css`.
- One source-of-truth JS module per assessment screen in `src/assessment/<screen>.js`.
- Scoring engine: 4 pure-function modules + `index.js` aggregator (D3).
- Methodology corpus: per-locale tree (D9); block-level content keys per NFR27.

**Inline-copy rule for shared utilities (Amelia gap #3):**
- **No `src/utils/`, no `src/shared/`, no `src/common/`.** If a six-line `clamp(x, lo, hi)` is needed in both `src/scoring/` and `src/assessment/`, write it twice.
- **Rationale:** the auditor must be able to read `src/scoring/irt/eap.js` top-to-bottom without chasing imports. NFR26 (verification time-to-confidence ≤10 min source read) requires this discipline.
- **Mechanically enforced:** `no-restricted-imports` (see eslint config below) blocks `src/utils/*`, `src/shared/*`, `src/common/*` paths.
- **Exception:** `src/lib/log.mjs` (~20 LOC, see "Process Patterns") is the *only* shared module, and only because it's a no-op debug wrapper that callers use uniformly.

### Format Patterns

**Source formatting / linting (Step 5 D-B + Murat hardening):**

- **Prettier with default config** + **hardened eslint** as `devDependencies`. Pinned to specific minor versions; bumped only via explicit PR.
- `.prettierrc` = `{}` (locks defaults explicitly). `.prettierignore` ignores `dist/`, `vendor/`, `tests/snapshots/**` (golden HTML must not be reformatted).
- **`.eslintrc.json` (Murat-hardened):**
  ```json
  {
    "parserOptions": { "ecmaVersion": 2022, "sourceType": "module" },
    "env": { "browser": true, "node": true },
    "rules": {
      "no-unused-vars": "error",
      "no-undef": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "no-shadow": "error",
      "no-implicit-globals": "error",
      "strict": ["error", "never"],
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "no-restricted-syntax": [
        "error",
        { "selector": "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          "message": "Use performance.now() — monotonic, NTP-safe (iqme:reveal-stage ordering)." },
        { "selector": "WithStatement", "message": "with is forbidden." },
        { "selector": "CallExpression[callee.name='eval']", "message": "eval forbidden (CSP + lint)." },
        { "selector": "NewExpression[callee.name='Function']", "message": "Function constructor forbidden." }
      ],
      "no-restricted-imports": ["error", {
        "patterns": ["src/utils/*", "src/shared/*", "src/common/*", "../vendor/*"]
      }]
    },
    "overrides": [
      {
        "files": ["tests/playwright/**"],
        "extends": ["plugin:playwright/recommended"]
      },
      {
        "files": ["src/scoring/irt/markdown-subset-renderer.js", "tools/markdown-subset.mjs"],
        "rules": { "no-restricted-imports": ["error", { "patterns": ["src/utils/*", "src/shared/*", "src/common/*"] }] }
      }
    ]
  }
  ```
- **`devDependencies` whitelist:** `prettier`, `eslint`, `eslint-plugin-playwright`. Pinned versions.
- **`no-console` escape hatch:** Murat's chosen pattern — `no-console: ['error', { allow: ['warn', 'error'] }]` (the two semantically-meaningful console methods stay; `console.log/info/debug` are blocked) PLUS a single `src/lib/log.mjs` (~20 LOC) exporting a no-op `debug()` wrapper. Dev uses `import { debug } from '../lib/log.mjs'; debug(...)`; production no-ops; eslint stays strict; NFR21 honored (no transformation; the no-op is the shipped behavior).
- **Custom repo-grep lints in `tools/lint-*.mjs` (no eslint plugins):**
  - `lint-no-math-random.mjs` — Math.random forbidden in `src/scoring/**` + `src/assessment/**`
  - `lint-no-navigator-share.mjs` — `navigator.share` forbidden everywhere
  - `lint-no-og-image-per-result.mjs` — no `og:image` meta on result-page render
  - `lint-no-role-alert.mjs` — `role="alert"` forbidden
  - `lint-no-alert-confirm-prompt.mjs` — `alert/confirm/prompt` forbidden
  - `lint-no-inline-script.mjs` — only the `<script nomodule>` fallback toggle is permitted inline
  - `lint-no-third-party-fetch.mjs` — fetch() URL must start with `/` or `./`
  - `lint-css-link-order.mjs` (~30 LOC) — HTML entry-point `<link>` order matches declared cascade
  - **`lint-import-order.mjs`** (~30 LOC, Murat's replacement for `eslint-plugin-import`) — import statements sorted: stdlib first, then `vendor/`, then `src/` siblings, then `src/` peers
- Both `prettier --check` and `eslint` run as `lint-prettier` and `lint-eslint` jobs in `pr-checks.yml`.

**Dates (Amelia gap #4):**
- **Frontmatter (date-only):** ISO 8601 `YYYY-MM-DD` strings (`lastReviewed: "2026-05-15"`).
- **Non-frontmatter (full timestamp):** ISO 8601 UTC `YYYY-MM-DDTHH:mm:ssZ` — **always Z-suffix, never offsets**. Applies to: Zenodo metadata payload, Internet Archive Save Page Now trigger, Software Heritage `save` endpoint, `CHANGELOG.md` release date lines.
- **`CITATION.cff` exception:** uses date-only `YYYY-MM-DD` per spec; documented inline.
- **GitHub release tag:** `app-vX.Y.Z` or `corpus-vX.Y.Z` only — date lives in `CHANGELOG.md`.
- **No `toLocaleDateString()` anywhere in `src/**` or `tools/**`.** All locale-aware date display happens at render time via `new Intl.DateTimeFormat(<locale>).format(<date>)`.
- **JavaScript time source:** `performance.now()` for monotonic durations (event ordering, dwell timing). `Date.now()` forbidden by eslint `no-restricted-syntax`. `new Date()` permitted only for ISO-string construction at known beats (session-start record, etc.).

**Numeric formatting:** scores, percentiles, IQ-scale, uncertainty bounds — locale-aware formatting via `Intl.NumberFormat(<locale>)` at render time. JSON files store raw numbers (`12.5`, not `"12,5"`).

**File extensions:** `.mjs` (Node tools); `.js` (browser modules); `.json` (data with camelCase fields); `.md` (corpus + repo docs); `.html.tmpl` (build templates); `.yml` (workflows + CITATION.cff-like); `.svg` (diagrams + items).

**Conventional Commits (Amelia gap #10):**
- Required prefix on every commit: `<type>(<scope>): <subject>`.
- Types: `feat`, `fix`, `docs`, `build`, `chore`, `refactor`, `test`, `perf`, `style`, `ci`.
- Scopes (project-specific): `app`, `corpus`, `scoring`, `i18n`, `css`, `a11y`, `perf`, `ci`, `tools`, `deps`.
- Examples: `feat(scoring): add quadrature node count parameter`, `fix(corpus): correct EN source hash for eap.md`, `docs(corpus): expand uncertainty methodology page`, `build(tools): add lint-import-order.mjs`.
- Enables automated changelog generation per `app-v*` and `corpus-v*` tag namespace.
- Commit-message lint can be added later (commitlint) but is **not** required at v1; PR-review discipline is sufficient at solo-dev scale.

### Process Patterns

**Error handling — application code (NFR20):**
- **Localized polite fallback page** for JS errors. Renders `"Something went wrong. If this happens repeatedly, please report it on GitHub Discussions."` in active locale. No stack trace, no error reporting, no auto-resume.
- **No `alert()`, `confirm()`, `prompt()`** — forbidden by negative-assertion lint suite.
- **No `role="alert"`** anywhere. `role="status"` for non-transient informational signals; `role="note"` for inline non-dismissible caveats.
- **In-place hint copy** for predictable blocked actions (e.g., locale-switch mid-session — Step 5 invention #10).

**Error handling — corpus build script (Amelia gap #1):**
- **Three error classes**, each with distinct exit code and atomic-write contract:
  - **`ERR_SCHEMA`** (exit 2) — malformed frontmatter, missing required field, invalid YAML. **Fail-fast**, no partial output. Atomic write: build to `dist/.tmp-build-<pid>/`, `rename()` to `dist/` only on success.
  - **`ERR_REF`** (exit 3) — `glossaryRefs` referencing missing glossary term, `asserts` referencing nonexistent methodology page, trail reference to nonexistent page. **Collect-all**, full-tree scan, report all violations at end. (Prevents fix-one-rerun-loop pattern.)
  - **`ERR_HASH`** (exit 4) — `sourceHashEn` in RU/PL frontmatter ≠ recomputed SHA-256 of EN source. **`--dev` mode: warn-and-continue** (allows iteration during translation review); **`--ci` mode: fail**. CI sets `BUILD_STRICT=1` env var; `tools/build-methodology.mjs` reads it and dispatches.
- **Default mode:** strict in CI, `--dev` permitted via `make dev`.
- **Output:** structured error report to stderr (`{ code, severity, file, line, message }` per error, one JSON object per line for machine parsing).

**Scoring failure contract (Amelia gap #2):**
- **Pure functions throw on contract violation; never return error objects, never return `NaN`.**
- **`TypeError`** for shape violation: `eapEstimate(responses, itemParameters)` where `responses` is not an array of integers in `{0, 1}`, or `itemParameters` is not an array of `{a, b}` objects.
- **`RangeError`** for out-of-domain values: θ outside `[-6, 6]`, response value outside item's defined response set, `quadpts` outside `[15, 121]`.
- **Pure functions assert preconditions at entry** (one assertion block per function); no defensive try/catch in scoring modules.
- **Caller (SPA result.js)** wraps `scoreSession()` in try/catch and renders the polite localized fallback if any error escapes.
- **Rationale:** auditability = "read function, see preconditions, see math, done." Returning error-objects or `NaN` poisons downstream math and obscures the failure-mode contract.

**Loading states:**
- **No spinners.** Scoring runs <100ms by construction (NFR3); score appears "as if it had already been there."
- **Item asset preloading** after consent confirms.
- **Methodology page prefetching** via `<link rel="prefetch">` from result-page render.
- **No `aria-busy`, no skeleton screens, no progress bars** beyond the item-progress indicator (`aria-current="step"`, FR3).

**Async patterns:**
- ES2022 baseline: top-level `await` in modules; `async`/`await` everywhere.
- `fetch()` for all data loading; no `XMLHttpRequest`.
- **No `Promise.then` chains** when `await` is clearer.
- **No callback patterns** in new code (event listeners and `requestAnimationFrame` excepted).

**Randomness (NFR10):**
- `crypto.getRandomValues(new Uint8Array(16))` for the 128-bit session seed (FR7).
- Deterministic PRNG seeded from session seed for item-subset selection, item ordering, image augmentation (a small inline xoshiro128 in `src/assessment/` — written twice if needed per inline-copy rule).
- **`Math.random()` forbidden** in `src/scoring/**` and `src/assessment/**` — enforced by `tools/lint-no-math-random.mjs`.

**Console output:**
- **`no-console` eslint rule** with `allow: ['warn', 'error']` — `console.warn` and `console.error` permitted for semantically-meaningful runtime messages; `console.log/info/debug` blocked.
- **`src/lib/log.mjs`** (~20 LOC) exports a no-op `debug()` wrapper:
  ```js
  // src/lib/log.mjs — only shared module, only exception to inline-copy rule
  // debug() is a no-op in production by construction (the no-op IS the shipped behavior).
  // Dev console wrapping via DevTools breakpoints, not via runtime gating (NFR21).
  export const debug = (..._args) => {};
  ```
  Callers `import { debug } from '../lib/log.mjs'; debug(...)`; eslint stays strict; production ships inert.
- Author-time tools (`tools/**`) may use `console.log` freely for build output.

**Code comments:**
- **Default: no comments.** Named identifiers carry the meaning.
- Comment only for **non-obvious WHY**: hidden constraint, subtle invariant, workaround for a specific bug, surprising behavior.
- **Never** restate what the code does. **Never** reference task/PR/caller.
- **No multi-paragraph docstrings.** No JSDoc unless type-checking is added later (not in v1).
- JSON files have no comments (JSON disallows them); schema docs live in companion `.md` files.

**Locale fallback chain (Amelia gap #6):**
- When an i18n key is missing in the active locale: `<active-lang>` → `en` → **bare-key literal**.
- Bare-key fallback (e.g., rendering `consent.continueButton` literally in the UI) is **highly visible** — designed as a "this should never happen, fix it" signal, not a graceful degradation.
- `tools/lint-i18n-coverage.mjs` (~50 LOC, optional v1 addition) asserts every string key referenced in `src/**/*.js` exists in every locale's `strings.json`. If added, missing-key bare-literal renders should never reach production.

**Crisis-resources freshness (Amelia gap #8):**
- Each entry in `src/content/crisis-resources/<lang>.json` carries a `lastVerified` field (ISO 8601 `YYYY-MM-DD`):
  ```json
  {
    "resources": [
      {
        "name": "Telefon Zaufania dla Dzieci i Młodzieży",
        "phone": "116 111",
        "url": "https://116111.pl",
        "scope": "youth-crisis",
        "lastVerified": "2026-05-01"
      }
    ]
  }
  ```
- `tools/lint-crisis-resources-freshness.mjs` (~30 LOC) warns on entries with `lastVerified` older than 90 days.
- `scheduled.yml` Monday job runs the freshness lint and surfaces stale entries via GitHub Issue (manual follow-up, not auto-update).

**Build artifact directory contract (Amelia gap #7):**
- `dist/` is **gitignored** (added to `.gitignore` from Epic 0).
- CI emits `dist/` on every PR (for snapshot tests) and on every tag push (for deploy).
- **Deployment:** `release.yml` builds `dist/`, then pushes to the `gh-pages` branch (standard GitHub Pages pattern) on `app-v*` tags. On `corpus-v*` tags, only `dist/methodology/v<new>/` is rebuilt and pushed (prior `dist/methodology/v<prior>/` already in `gh-pages` history is preserved by the per-corpus-release re-emit semantics).
- **Mirror deploy:** the same `dist/` artifact is force-pushed to the Codeberg / Cloudflare Pages branches by `release.yml`.

**Frontmatter validator (Amelia gap #5):**
- **Validator location:** inline in `tools/build-methodology.mjs` (~80–120 LOC handwritten validator).
- **Schema location:** `corpus/frontmatter.schema.json` (camelCase JSON, validated by the inline validator).
- **No `ajv`, no `joi`, no schema library.** Stays zero-runtime-dep (NFR33) and zero-vendored-dep at v1. Handwritten validator is ~120 LOC; aligned with NFR32 cognitive-load budget.
- Schema versioned with `corpus/` artifacts: any frontmatter contract change bumps `corpus/frontmatter.schema.json` `$id` field and is recorded in the corpus changelog.

### Communication Patterns

**DOM events (UX Step 7, Step 11):**
- Namespace: `iqme:<verb-or-state>`. Current event: `iqme:reveal-stage`.
- Payload shape: `{ stage: <named-beat>, t: <DOMHighResTimeStamp from performance.now()> }`. Additional fields camelCase.
- Dispatch via `document.dispatchEvent(new CustomEvent('iqme:reveal-stage', { detail: {...} }))`.
- Subscribe via `document.addEventListener('iqme:reveal-stage', e => ...)`.
- Tested via Playwright event-trace ordering in `tests/playwright/reveal-stage.spec.mjs`.
- **`t:` uses `performance.now()` (monotonic) NOT `Date.now()`** — eslint `no-restricted-syntax` enforces.

**State management (D3, PRD §Technical Architecture):**
- Single `src/assessment/state.js` module exports session-state shape and mutator functions.
- State shape: `{ currentItem, responses, startedAt, locale, seed }`.
- Mutators are explicit named functions.
- No reactive system, no proxies, no virtual DOM.

**Inter-module communication:**
- ES module `import`/`export`; **explicit named imports only**. No `import *`.
- No global namespace pollution. No `window.iqme`.
- No event-bus pattern beyond in-page DOM events for ceremony beats.

### Documentation Patterns

**License / SPDX (Step 5 D-D):**
- **No per-file SPDX headers** on shipped `src/**` or `tools/**` files.
- License contract lives in: `LICENSES.md` (per-file-class licenses) + `CITATION.cff` (citation metadata) + the committed ICAR confirmation artifact (NFR24).
- **License-provenance CI lint** (`tools/lint-license-provenance.mjs`) verifies every shipped item file traces to its ICAR attribution and that `LICENSES.md` is unmodified between releases except via changelog.
- **Forking-ethics note in README** (NFR11): explicit non-enforceable request that forkers preserve caveats and methodology corpus.

**File-level docs:** none required. Module purpose communicated by file name + named exports + named functions.

**Repository-level docs:** `README.md`, `CONTRIBUTING.md`, `LICENSES.md`, `CITATION.cff`, `docs/corpus-build-conventions.md`, `CHANGELOG.md` (per Conventional Commits).

### Enforcement Guidelines

**All AI agents and human contributors MUST:**

1. **Use camelCase for every JSON field** across all data files (including glossary keys — `flynnEffect`, `sapaProject`).
2. **Author tests at `tests/<concern>/<mirrored-source-path>.test.mjs`** — never co-located. Tests for `tools/**` live at `tests/unit/tools/**`.
3. **Add `data-*` attributes for state**, never stateful classes.
4. **Use `iqme:<verb-or-state>` namespace** for any new in-page DOM events; use `performance.now()` for the `t:` field.
5. **Pass `prettier --check`** and `eslint` (with Murat-hardened config) before opening a PR.
6. **Never introduce `Math.random`, `console.log/info/debug`, `eval`, `new Function`, `with`, `Date.now`, `navigator.share`, `alert/confirm/prompt`, `role="alert"`, third-party network requests, or imports from `src/utils|shared|common|vendor`** in shipped `src/**` code.
7. **Use camelCase for JS identifiers**, kebab-case for files, kebab-BEM for CSS, `block-<kebab>` for content-key IDs.
8. **Throw `TypeError`/`RangeError` from scoring engine pure functions** on contract violation; never return error objects or `NaN`.
9. **Follow the Conventional Commits convention** (`<type>(<scope>): <subject>`).
10. **Write tests first** for any new scoring engine function (TDD red-green-refactor); other modules: test after implementation acceptable but encouraged before.
11. **Add a `lastVerified` field** to every new crisis-resource entry.
12. **Use `import { debug } from '../lib/log.mjs'`** for development-only diagnostic output; `debug()` ships inert.

**Pattern enforcement:** lint scripts in `tools/lint-*.mjs` + eslint + prettier mechanically enforce where automation is possible. Pattern violations not caught by automation surface in PR review.

### Pattern Examples

**Good (frontmatter):**
```yaml
---
title: "EAP scoring"
version: "1.0.0"
lastReviewed: "2026-05-15"
reviewer: "William Revelle"
reviewerHandle: "@revelle"
asserts: ["IRT 2PL EAP estimation"]
glossaryRefs: ["irt", "eap", "theta"]
---
```

**Anti-pattern (frontmatter):**
```yaml
---
Title: EAP scoring                          # ❌ PascalCase field
last_reviewed: 2026-05-15                   # ❌ snake_case (Step 5 D-A is camelCase)
reviewer_handle: revelle                    # ❌ snake_case
asserts: "IRT 2PL EAP estimation"           # ❌ string, expected array
GLOSSARYREFS: ["IRT", "EAP"]               # ❌ UPPER_CASE field + value
---
```

**Good (scoring function with assertion):**
```js
// src/scoring/irt/eap.js
import { quadraturePoints } from './quadrature.js';
import { logLikelihood } from './likelihood.js';

export function eapEstimate(responses, itemParameters, quad) {
  if (!Array.isArray(responses)) throw new TypeError('responses must be array');
  if (responses.some(r => r !== 0 && r !== 1)) throw new RangeError('responses must be 0|1');
  if (!Array.isArray(itemParameters) || itemParameters.length !== responses.length) {
    throw new TypeError('itemParameters length must match responses length');
  }
  // math here, returns scalar theta
}
```

**Anti-pattern (scoring function):**
```js
// ❌ returns error object, returns NaN
export function eapEstimate(responses, itemParameters, quad) {
  if (!responses) return { error: 'no responses', theta: null };
  let theta = 0;
  // ... math ...
  return isNaN(theta) ? { error: 'failed', theta: NaN } : theta;
}
```

**Good (DOM event):**
```js
document.dispatchEvent(new CustomEvent('iqme:reveal-stage', {
  detail: { stage: 'anchor', t: performance.now() }
}));
```

**Anti-pattern:**
```js
window.dispatchEvent(new CustomEvent('revealStage', {     // ❌ wrong target, wrong namespace
  detail: { Stage: 'Anchor', timestamp: Date.now() }      // ❌ PascalCase field, wall-clock time
}));
```

**Good (test file path):**
```
src/scoring/irt/eap.js              → tests/unit/scoring/irt/eap.test.mjs
src/assessment/state.js             → tests/unit/assessment/state.test.mjs
tools/markdown-subset.mjs           → tests/unit/tools/markdown-subset.test.mjs
```

**Anti-pattern:**
```
src/scoring/irt/eap.js → src/scoring/irt/eap.test.js   # ❌ co-located, pollutes src/
src/scoring/irt/eap.js → tests/eap.spec.js             # ❌ flat, wrong suffix, no mirror
```

**Good (commit message):**
```
feat(scoring): add quadrature node count parameter
fix(corpus): correct EN source hash for eap.md after typo fix
build(tools): add lint-import-order.mjs
chore(deps): pin eslint to 9.X.Y
```

**Anti-pattern (commit message):**
```
update stuff                              # ❌ no type, no scope, no subject discipline
WIP                                       # ❌ no information
Fixed bug                                 # ❌ no type, no scope
feat: lots of changes across scoring, css, build, tests   # ❌ too broad; split into multiple commits
```

## Project Structure & Boundaries

This section consolidates the master project tree (all decisions from Steps 3–5 baked in + Party Mode round 4 revisions applied), defines the **five-domain boundary model** (Domain E — Test Fixtures promoted per Winston), enumerates concrete boundary contracts, maps every PRD FR-category and epic to a location in the tree, and documents the three primary data flows.

### Five-Domain Boundary Model (Winston revision)

| Domain | Owns | Boundary contract |
|---|---|---|
| **A — Assessment SPA** | `src/assessment/` + `src/index.html` + `src/assessment/i18n/` + `src/css/components/` + `src/items/` | Runtime UX. Imports from Domain B (scoring); reads from Domain C (content). Boundary lint: `no-restricted-imports` blocks `src/utils|shared|common`. |
| **B — Scoring Engine** | `src/scoring/irt/` (~250 LOC pure functions + `METHODOLOGY_CLAIMS.json`) | Pure-function math. No DOM, no async, no globals. Throws `TypeError`/`RangeError` on contract violation; outputs camelCase JS objects. Public surface via `src/scoring/irt/index.js`. |
| **C — Methodology Corpus** | `src/content/` (methodology, i18n strings, glossary, trails, crisis-resources, diagrams) + `corpus/` (contracts) + `templates/` + `dist/methodology/` | Authored content + frontmatter contracts + build templates + emitted static HTML. Boundary via `corpus/schema.json`, `corpus/markdown-subset-v1.md`, `corpus/methodology-claims-v1.schema.json`. |
| **D — Tools** | `tools/` + `.github/workflows/` + `Makefile` | Author-time pipeline. Reads Domains A/B/C. Writes only to `dist/` (deploy artifact) and `tests/snapshots/**` (via explicit `snapshot-update` Makefile target, exempted in `no-restricted-imports` lint config). |
| **E — Test Fixtures** (Winston-promoted) | `tests/` | Test specs + golden vectors + HTML snapshots + a11y/perf configs. Owned by Domain D for snapshot-write via `make snapshot-update`; read by D for assertion. Boundary: `no-restricted-paths` lint exempts Domain D's writes to `tests/snapshots/**` and forbids all other write paths. |

**Cross-domain rules:**

1. **No `src/utils/`, `src/shared/`, `src/common/` directories** — enforced by `no-restricted-imports` eslint rule. (Step 5 inline-copy rule.)
2. **No shared-module category** (Winston revision): `src/lib/log.mjs` is deleted. Each file that wants a debug-logging escape hatch inlines `const debug = (..._args) => {};` (five lines, no shared module). The eslint `no-console: ['error', { allow: ['warn', 'error'] }]` rule + inline no-op debug is the v1 console policy.
3. **`vendor/` is import-blocked** except via explicit override in `.eslintrc.json` — at v1 there is no override (Step 3 chose the subset renderer over vendoring `marked`).
4. **Domain D writes to Domain E (`tests/snapshots/**`)** only via `make snapshot-update` target; this is the single permitted exception to D's read-only rule, codified in lint config (`no-restricted-paths` allowlist), not in prose.
5. **SVG diagrams** are inert presentation assets owned by Domain C; rendered by Domain A via static URL (no import, no boundary crossed).
6. **i18n locale-loader (runtime harness)** lives in Domain A at `src/assessment/i18n/`; the strings.json data lives in Domain C at `src/content/i18n/`. This split — Winston's revision — separates runtime logic from authored content.

### Complete Project Directory Structure (Master Tree — Party Mode round 4 revisions applied)

```
.
├── README.md                              # masthead-style trust artifact
├── LICENSES.md                            # per-file-class license declarations (NFR24, NFR34)
├── CITATION.cff                           # academic citation metadata (NFR25)
├── CONTRIBUTING.md                        # PR workflow, reviewer-of-record register (FR47-49)
├── CHANGELOG.md                           # auto-generated from Conventional Commits per app-v* + corpus-v*
├── BUDGETS.json                           # NFR32-NFR35 cognitive-load thresholds (John gap #3)
├── ICAR-CONFIRMATION.pdf                  # committed once received from ICAR/SAPA (NFR24, FR45)
├── Makefile                               # targets: build-methodology, test, lint, dev, snapshot-update, clean
├── package.json                           # devDependencies only
├── .editorconfig
├── .gitignore                             # dist/, node_modules/, .DS_Store, *.log
├── .prettierrc                            # {}
├── .prettierignore                        # dist/, vendor/, tests/snapshots/**
├── .eslintrc.json                         # Murat-hardened (Step 5)
│
├── src/                                   # all shipped source — browsers load directly (NFR21)
│   │
│   ├── index.html                         # SPA entry (parallel <link> chain D5; <script nomodule> fallback D10)
│   │
│   ├── assessment/                        # Domain A — runtime SPA
│   │   ├── main.js
│   │   ├── state.js
│   │   ├── routing.js                     # hash-router for #/test, #/result
│   │   ├── landing.js
│   │   ├── resume-prompt.js               # /* Surfaced per Sally — was silently folded; restored as own scene */
│   │   ├── consent.js                     # FR9-FR13
│   │   ├── item-runner.js                 # FR2-FR5
│   │   ├── item-prng.js                   # xoshiro128 seeded from session seed
│   │   ├── item-selection.js              # FR7
│   │   ├── result.js                      # FR18-FR27 + reveal-beat orchestration
│   │   ├── methodology-shell.js           # FR21 in-SPA shell for methodology links
│   │   ├── reveal-stage.js                # iqme:reveal-stage dispatcher
│   │   ├── locale-switch.js               # FR8 mid-session blocker
│   │   ├── error-fallback.js              # NFR20 localized polite fallback
│   │   └── i18n/                          # Winston revision: locale-loader is runtime harness (Domain A)
│   │       └── locale-loader.js           # fetch() loader (D4)
│   │
│   ├── scoring/irt/                       # Domain B — auditable scoring engine (~250 LOC)
│   │   ├── index.js                       # public surface (D3): named exports + scoreSession()
│   │   ├── likelihood.js
│   │   ├── quadrature.js
│   │   ├── eap.js
│   │   ├── se.js
│   │   └── METHODOLOGY_CLAIMS.json        # claims manifest (D3, NFR23)
│   │
│   ├── content/                           # Domain C — all authored content
│   │   ├── methodology/                   # per-locale tree (D9, Layout 1)
│   │   │   ├── en/                        # ~30 markdown pages, EN source-of-truth
│   │   │   │   ├── scoring/{eap,uncertainty,percentile-to-iq,golden-vectors}.md
│   │   │   │   ├── constructs/{validity-envelope,icar-mr,gf-reasoning}.md
│   │   │   │   ├── norming/{sample,limitations}.md
│   │   │   │   ├── limitations/{retest-effects,visuospatial-only,test-takers-not-clinical}.md
│   │   │   │   ├── ethics/{anti-credentialization,bottom-decile-care,top-decile-misuse}.md
│   │   │   │   ├── reference/{changelog,glossary,design-tokens,matrix-item-authoring}.md
│   │   │   │   │                          # /* matrix-item-authoring.md added per Sally — translator contract for <title>/<desc>, never invent alt */
│   │   │   │   └── intro.md
│   │   │   ├── ru/                        # mirrored RU tree
│   │   │   └── pl/                        # mirrored PL tree
│   │   ├── i18n/                          # Winston revision: strings.json moved from src/i18n/locales/ to here
│   │   │   ├── en/strings.json            # ~5 namespaces: landing, consent, item-runner, result, chrome
│   │   │   ├── ru/strings.json
│   │   │   └── pl/strings.json
│   │   ├── glossary/
│   │   │   ├── en.json                    # camelCase term keys: irt, eap, theta, flynnEffect, sapaProject, gfReasoning
│   │   │   ├── ru.json
│   │   │   └── pl.json
│   │   ├── trails/                        # tail-aware-trail definitions  /* Phase 2 — corpus emits trails-aware behavior deferred */
│   │   │   ├── en.json
│   │   │   ├── ru.json
│   │   │   └── pl.json
│   │   ├── crisis-resources/              # FR20: in-bundle native-language, lastVerified per entry (Step 5)
│   │   │   ├── en.json
│   │   │   ├── ru.json
│   │   │   └── pl.json
│   │   └── diagrams/                      # Winston revision: moved from src/diagrams/ — authored visual assets owned by Domain C
│   │       ├── validity-envelope.svg      # <title> and <desc> translated as content keys (NFR31)
│   │       └── eap-shrinkage.svg          # /* Phase 2 — deferred per Step 4 */
│   │
│   ├── css/                               # custom hand-rolled design system (UX Step 6; ~1500 LOC budget)
│   │   ├── reset.css                      # ~30 LOC
│   │   ├── primitives.css                 # raw token values
│   │   ├── semantic.css                   # semantic tokens
│   │   ├── base.css                       # body, typography defaults, :focus-visible
│   │   ├── components/                    # one CSS file per component (UX Step 11; 25 components)
│   │   │   ├── chrome-header.css
│   │   │   ├── chrome-footer.css
│   │   │   ├── language-switcher.css
│   │   │   ├── theme-toggle.css
│   │   │   ├── landing.css
│   │   │   ├── resume-prompt.css          # /* Surfaced per Sally — was silently folded */
│   │   │   ├── consent-scene.css
│   │   │   ├── progress-indicator.css
│   │   │   ├── item-runner.css
│   │   │   ├── score-panel.css            # load-bearing apex — includes tear-edge overlay as nested block per Sally (Step 5 invention #2 folded in, not separate)
│   │   │   ├── tail-scene-bottom.css      # load-bearing
│   │   │   ├── tail-scene-mid.css
│   │   │   ├── tail-scene-top.css
│   │   │   ├── silent-companion-line.css  # load-bearing (Mikhail's "held")
│   │   │   ├── locale-switch-blocker-hint.css
│   │   │   ├── masthead.css               # load-bearing methodology chrome
│   │   │   ├── lede.css
│   │   │   ├── tail-aware-trail.css       # /* Phase 2 — deferred per Step 4 */
│   │   │   ├── cite-this-page-widget.css
│   │   │   ├── stale-translation-hatnote.css  # load-bearing trust signal
│   │   │   ├── version-mismatch-hatnote.css   # /* Phase 2 — deferred per Step 4 */
│   │   │   ├── translation-in-progress-stub.css
│   │   │   ├── validity-envelope-diagram.css  # SVG asset adaptation
│   │   │   ├── eap-shrinkage-diagram.css      # /* Phase 2 — deferred per Step 4 */
│   │   │   └── error-fallback.css         # /* per Sally: in UX scope, back-name into Step 11 v1.1 */
│   │   └── utilities.css                  # .cluster, .stack, .center only
│   │   # (no /css/index.css per D5; HTML uses parallel <link> chain)
│   │
│   └── items/                             # ICAR-MR matrix item assets
│       ├── icar-mr-01.svg                 # ~16+ items finalized in Epic 0 alongside ICAR confirmation
│       ├── icar-mr-02.svg
│       ├── ...
│       ├── item-parameters.json           # camelCase: a, b parameters; difficulty band (FR14, FR22)
│       └── README.md                      # /* per Sally: pointer to /methodology/<lang>/reference/matrix-item-authoring/ */
│
│   # (src/diagrams/ removed per Winston — moved to src/content/diagrams/)
│   # (src/i18n/ removed per Winston — split into src/assessment/i18n/ + src/content/i18n/)
│   # (src/lib/ removed per Winston — no shared-module category; inline debug() per file as needed)
│
├── corpus/                                # Domain C contracts
│   ├── schema.json                        # frontmatter contract
│   ├── frontmatter.schema.json            # JSON schema for frontmatter validation
│   ├── markdown-subset-v1.md              # declared subset artifact (D1) — H1-H4, paragraphs, emphasis, code fences, links, lists≤2, basic tables, blockquotes, footnotes
│   ├── build-cache-v1.schema.json         # cache file schema (D8 deferred-with-trigger)
│   └── methodology-claims-v1.schema.json
│
├── templates/                             # Domain C — build-time HTML templates
│   ├── masthead.html.tmpl
│   ├── lede.html.tmpl
│   ├── citation-widget.html.tmpl
│   ├── jsonld-scholarlyarticle.html.tmpl
│   ├── stale-translation-hatnote.html.tmpl
│   ├── translation-in-progress-stub.html.tmpl
│   └── methodology-page.html.tmpl
│
├── tools/                                 # Domain D — author-time Node tooling
│   │
│   │   # Build pipeline
│   ├── build-methodology.mjs              # ~900-1,400 LOC (Amelia) — error taxonomy ERR_SCHEMA/ERR_REF/ERR_HASH, atomic write
│   ├── markdown-subset.mjs                # ~200 LOC (D1) — strict-mode renderer including blockquotes + footnotes
│   ├── dev-server.mjs                     # ~70 LOC — chokidar + node:http live-reload
│   │
│   │   # Lint scripts
│   ├── lint-frontmatter.mjs               # validates against corpus/frontmatter.schema.json
│   ├── lint-markdown-subset.mjs
│   ├── lint-translation-parity.mjs
│   ├── lint-reading-level.mjs             # Flesch-Kincaid EN, Oborneva RU, Pisarek/Jasnopis PL
│   ├── lint-glossary-coverage.mjs
│   ├── lint-claims-manifest.mjs           # METHODOLOGY_CLAIMS.json vs page asserts: parity (NFR23)
│   ├── lint-license-provenance.mjs        # NFR24
│   ├── lint-trust-artifacts.mjs           # /* John gap #5: asserts ICAR-CONFIRMATION.pdf exists + non-empty + sha-checksum recorded in LICENSES.md */
│   ├── lint-cognitive-load-budget.mjs     # /* John gap #3: reads BUDGETS.json; fails PR on threshold breach (NFR32-NFR35) */
│   ├── lint-crisis-resources-freshness.mjs # warns on lastVerified > 90 days
│   ├── lint-css-link-order.mjs            # ~30 LOC
│   ├── lint-no-math-random.mjs            # ~30 LOC repo-grep
│   ├── lint-no-navigator-share.mjs
│   ├── lint-no-og-image-per-result.mjs
│   ├── lint-no-role-alert.mjs
│   ├── lint-no-alert-confirm-prompt.mjs
│   ├── lint-no-inline-script.mjs
│   ├── lint-no-third-party-fetch.mjs
│   └── lint-import-order.mjs              # ~30 LOC (Murat replacement for eslint-plugin-import)
│
├── vendor/                                # SHA-pinned vendored single-file dev tools
│   └── SHASUMS                            # initially empty per A.2
│
├── tests/                                 # Domain E — Test Fixtures (Winston-promoted)
│   ├── unit/                              # node --test pure-function unit tests
│   │   ├── scoring/irt/                   # mirrors src/scoring/irt/
│   │   │   ├── eap.test.mjs
│   │   │   ├── likelihood.test.mjs
│   │   │   ├── quadrature.test.mjs
│   │   │   ├── se.test.mjs
│   │   │   └── scoreSession.test.mjs
│   │   ├── assessment/                    # mirrors src/assessment/
│   │   │   ├── state.test.mjs
│   │   │   ├── item-prng.test.mjs
│   │   │   ├── item-selection.test.mjs
│   │   │   ├── locale-switch.test.mjs
│   │   │   └── i18n/locale-loader.test.mjs
│   │   └── tools/                         # mirrors tools/ (Amelia mirror-rule edge case)
│   │       ├── markdown-subset.test.mjs
│   │       ├── build-methodology.test.mjs # error taxonomy contract test
│   │       └── lint-*.test.mjs            # per-lint smoke tests
│   │
│   ├── golden/                            # scoring engine golden-vector parity (NFR22)
│   │   ├── vectors.json                   # ≥ 1000 simulated response patterns
│   │   ├── CHANGELOG.md                   # pinning history per R/mirt version bump
│   │   └── README.md                      # reproducibility note
│   │
│   ├── snapshots/                         # golden HTML snapshot per content file (Murat) — Domain D write target
│   │   └── methodology/                   # mirrors src/content/methodology/
│   │       └── (per-file *.snap.html)
│   │
│   ├── playwright/                        # e2e + CI assertions
│   │   ├── network-trace.spec.mjs         # NFR6, FR41
│   │   ├── viewport-overflow.spec.mjs
│   │   ├── cropping-fuzzer.spec.mjs
│   │   ├── reveal-stage.spec.mjs
│   │   ├── csp-violations.spec.mjs
│   │   ├── negative-assertions.spec.mjs
│   │   ├── cross-browser-smoke.spec.mjs
│   │   ├── byte-stable-build.spec.mjs
│   │   └── yandex-browser.spec.mjs
│   │
│   ├── a11y/
│   │   ├── axe-config.json
│   │   └── pages.json
│   │
│   └── perf/
│       ├── lighthouserc.json
│       ├── budgets.json                   # FCP/LCP/CLS/TTI/page-weight
│       └── memory-budget.spec.mjs         # /* John gap #2: NFR4 contract — performance.memory snapshots at 3 checkpoints */
│
├── docs/                                  # internal contributor docs (NOT shipped)
│   ├── corpus-build-conventions.md        # Winston's framework substitute
│   ├── branch-protection-config.md        # /* John gap #1: exact GitHub branch-protection settings (FR47-FR53) */
│   ├── required-ci-checks.md              # /* John gap #2: each CI job mapped to FR/NFR it gates + launch-blocking flag */
│   ├── scheduled-yml-failure-routing.md   # /* John gap #6: scheduled.yml failures auto-open GitHub Issue with `area:scheduled-check` label (NFR16-NFR20) */
│   └── launch-readiness/                  # populated as pre-launch gates clear
│       ├── psychometrician-sign-off-{name}-{date}.md
│       ├── ru-translator-sign-off-{name}-{date}.md
│       ├── pl-translator-sign-off-{name}-{date}.md
│       └── testers-credibility-round-{date}.md
│
├── dist/                                  # build output (gitignored; CI emits; deploys to gh-pages)
│   ├── index.html                         # copy of src/index.html
│   ├── (... src/ tree copied as-is for SPA — runtime-zero-build)
│   ├── methodology/                       # ONLY transformed artifact: CommonMark → HTML per version per locale
│   │   ├── v1.0.0/{en,ru,pl}/<path>/index.html
│   │   ├── latest/                        # copy or symlink to current corpus version
│   │   └── sitemap.xml
│   ├── robots.txt                         # Allow: / + Disallow: /api/
│   ├── CITATION.cff                       # mirrored from root
│   └── .build-cache.json                  # only present once D8 cache is triggered (currently deferred)
│
└── .github/
    ├── CODEOWNERS                         # per-locale reviewer-of-record routing (D9, FR49, NFR29)
    └── workflows/
        ├── pr-checks.yml                  # all-lints-all-PRs (gate-matrix collapsed per Mary)
        ├── release.yml                    # app-v* and corpus-v* tag triggers (D7)
        └── scheduled.yml                  # Monday cron: mirror health, link rot, archival, crisis-resources freshness
        # meta-ci.yml deferred per Mary
```

### Requirements-to-Structure Mapping (revised — Party Mode round 4)

| PRD requirement / cluster | Primary location | Supporting files |
|---|---|---|
| **FR1, FR6, FR8, FR37 — Test session start, locale, no PII** | `src/assessment/landing.js` + `src/assessment/i18n/locale-loader.js` | `src/content/i18n/<lang>/strings.json` |
| **FR2-FR5, FR7 — Item runner, progress, bail, no timer, seeded subset** | `src/assessment/{item-runner, item-selection, item-prng}.js` | `src/items/*.svg`, `src/items/item-parameters.json`, `src/assessment/state.js` |
| **FR9-FR13 — Consent, validity envelope, pre-reveal beat** | `src/assessment/consent.js` + `src/css/components/consent-scene.css` | `src/content/diagrams/validity-envelope.svg`, `src/content/i18n/<lang>/strings.json` (consent ns) |
| **FR14-FR17 — Scoring (IRT 2PL EAP, uncertainty, pure)** | `src/scoring/irt/**` | `src/scoring/irt/METHODOLOGY_CLAIMS.json`, `tests/golden/vectors.json`, `tests/unit/scoring/irt/**` |
| **FR18-FR27 — Result delivery, ceremony, tail-scenes** | `src/assessment/{result, reveal-stage}.js` + score-panel + tail-scene + silent-companion-line CSS | `src/content/trails/<lang>.json`, `src/content/crisis-resources/<lang>.json`, `src/content/i18n/<lang>/strings.json` (result ns) |
| **FR28-FR36 — Methodology corpus** | `src/content/methodology/<lang>/**.md` + `corpus/schema.json` + `templates/**` + `tools/build-methodology.mjs` | `dist/methodology/v<X>/<lang>/<path>/`, related lint scripts |
| **FR37-FR40 — Localization** | `src/content/i18n/<lang>/strings.json` + `src/content/methodology/<lang>/**` + `src/content/glossary/<lang>.json` | `.github/CODEOWNERS`, `tools/lint-translation-parity.mjs` |
| **FR41-FR46 — Trust verification** | `src/scoring/irt/METHODOLOGY_CLAIMS.json` + `tests/playwright/network-trace.spec.mjs` + `tests/golden/**` + `ICAR-CONFIRMATION.pdf` + `tools/lint-trust-artifacts.mjs` (John gap #5) | `tests/playwright/byte-stable-build.spec.mjs`, `.github/workflows/release.yml` |
| **FR47-FR53 — Contribution & governance** | `CONTRIBUTING.md` + `LICENSES.md` + `.github/CODEOWNERS` + `.github/workflows/pr-checks.yml` + **`docs/branch-protection-config.md`** (John gap #1) + **`docs/required-ci-checks.md`** (John gap #2) | branch-protection settings (configured per `docs/branch-protection-config.md`) |
| **NFR1-NFR3, NFR5 — Performance budgets** | `tests/perf/lighthouserc.json` + `tests/perf/budgets.json` | Lighthouse-in-CI job in `pr-checks.yml` |
| **NFR4 — Memory budget < 50 MB** | **`tests/perf/memory-budget.spec.mjs`** (John gap #2 — performance.memory at 3 checkpoints) | Playwright `e2e-perf-memory` job in `pr-checks.yml` |
| **NFR6-NFR11 — Security & privacy** | `src/index.html` (CSP meta) + `src/assessment/item-selection.js` (crypto.getRandomValues) | tests/playwright + tools/lint-no-* family |
| **NFR12-NFR15 — Accessibility** | `src/css/base.css` (:focus-visible) + all component CSS + `src/assessment/consent.js` | `tests/a11y/**` + pre-launch manual review log in `docs/launch-readiness/` |
| **NFR16-NFR20 — Reliability + scheduled checks** | `src/assessment/error-fallback.js` + relative paths everywhere + `.github/workflows/release.yml` archival + `.github/workflows/scheduled.yml` + **`docs/scheduled-yml-failure-routing.md`** (John gap #6) | `templates/stale-translation-hatnote.html.tmpl` |
| **NFR21-NFR26 — Auditability & verifiability** | `src/scoring/irt/**` + `METHODOLOGY_CLAIMS.json` + `tools/lint-{claims-manifest,license-provenance,trust-artifacts}.mjs` + `CITATION.cff` + `tests/golden/**` | `README.md`, `tests/playwright/byte-stable-build.spec.mjs` |
| **NFR27-NFR31 — Content governance & translation equivalence** | `src/content/methodology/**` (block-level keys) + `src/content/glossary/<lang>.json` + `corpus/schema.json` + tools/lint-{translation-parity,reading-level,glossary-coverage}.mjs | `.github/CODEOWNERS`, `corpus/markdown-subset-v1.md` |
| **NFR32-NFR35 — Maintainability budgets** | **`BUDGETS.json`** at repo root (John gap #3) + **`tools/lint-cognitive-load-budget.mjs`** (asserts NFR32 numbers: scoring ≤ 300 LOC, CSS ≤ 1700, methodology pages ≤ 35/locale, i18n ≤ 18 KB) | `pr-checks.yml` `lint-budget` job |

### Epic-to-Structure Mapping (9-epic sequence + 5 parallel gate-outreach tracks per Step 4)

Unchanged from Step 4; see Step 4 §Decision Impact Analysis for the full table.

### Integration Points

**Internal communication (in-page DOM events):**
- `iqme:reveal-stage` — dispatcher `src/assessment/reveal-stage.js`; consumers `src/assessment/result.js` + `src/css/components/score-panel.css` `[data-reveal-stage]`.

**External integrations (whitelisted; NFR6):**
- GitHub Pages canonical + Codeberg/Cloudflare Pages mirror (byte-identical artifact).
- Zenodo (DOI mint on `corpus-v*` tag).
- Internet Archive Save Page Now (corpus permalinks).
- Software Heritage `save` endpoint.
- GitHub Discussions (no-telemetry feedback channel).

**Scheduled-check failure routing (John gap #6):**
- `.github/workflows/scheduled.yml` failures auto-open a GitHub Issue labeled `area:scheduled-check` + the specific check name (e.g. `area:mirror-health`).
- Maintainer triages weekly; no email/slack notification (no third-party integrations per NFR6).
- Documented in `docs/scheduled-yml-failure-routing.md`.

### Data Flow Narratives

**1. Test session flow (FR1 → FR27):** unchanged from prior draft — see Step 6 Data Flow Narratives subsection for the full trace.

**2. Corpus build flow:** unchanged — `make build-methodology` walks `src/content/methodology/{en,ru,pl}/**.md`, parses + validates frontmatter, renders body via subset renderer, injects masthead/lede/trail/JSON-LD/citation/hatnote chrome, emits per-locale per-version HTML to `dist/methodology/v<corpus-version>/<lang>/<path>/`.

**3. Release flow:** unchanged — `release.yml` fires on tag push; `app-v*` builds dist + deploys; `corpus-v*` builds + deploys + mints Zenodo DOI + archives to IA + SH.

### Development Workflow Integration

**Local development:**
- `make dev` → starts `tools/dev-server.mjs` on `http://localhost:8080`; watches `src/content/methodology/**`; rebuilds corpus on save in `--dev` mode (ERR_HASH warns, doesn't fail); serves SPA without any build step.
- Edit `src/assessment/*.js` or `src/css/components/*.css` → browser reload picks up the change (runtime-zero-build means dev == prod byte-identically).

**Pre-commit workflow:**
- `make lint` → runs all `tools/lint-*.mjs` (including `lint-cognitive-load-budget.mjs` and `lint-trust-artifacts.mjs`) + `prettier --check` + `eslint`.
- `make test` → `node --test tests/unit/**` + `npx playwright test tests/playwright/** tests/perf/memory-budget.spec.mjs` + `npx pa11y tests/a11y/**` + `npx lhci autorun tests/perf/lighthouserc.json`.
- `make snapshot-update` → updates `tests/snapshots/methodology/**` after a deliberate content change (Domain D's only write into Domain E, exempted in lint config).

**Deployment workflow:**
- `app-v<X>.<Y>.<Z>` tag → `release.yml` builds + deploys to GitHub Pages + mirror.
- `corpus-v<X>.<Y>.<Z>` tag → `release.yml` builds + deploys + mints Zenodo DOI + archives to IA + SH.
- v1.0.0 launch = coordinated double-tag.

## Architecture Validation Results

This section is an adversarial pass over the consolidated architecture (Steps 2–6 + four Party Mode rounds). Validation runs on three tracks (coherence, requirements coverage, implementation readiness); residual gaps are surfaced honestly; an implementation-handoff package is assembled.

### Coherence Validation

All Step 4 decisions cohere with the upstream substrate constraints and with each other; all Step 5 patterns are derivable from the decisions; all Step 6 structural placements honor the patterns. Specifically:

- D1 declared-subset renderer + Sally's blockquotes/footnotes additions cohere with NFR27 block-level keys (subset is sufficient for methodology prose + footnoted citations + scholarly blockquotes; diagrams ride through as `![](svg)` image syntax).
- D2 Layout A + Winston's revisions (diagrams→content; i18n split; no src/lib; Domain E promoted) cohere with the inline-copy rule + the Domain D snapshot-write exception (both codified in lint config, not prose).
- D3 named-export scoring API + JSON manifest cohere with Step 5 throw-only failure contract + NFR23 claims-parity lint.
- D4 single eager bundle + Winston's i18n split cohere with FR8 locale-switch-mid-session blocked.
- D5 parallel `<link>` chain coheres with Step 5 lint-css-link-order.
- D6 3 workflows + meta-CI deferred cohere with Mary's solo-dev cognitive-load analysis.
- D7 decoupled tag namespaces cohere with NFR25 per-corpus-release re-emit.
- D8 cache deferred-with-trigger coheres with Step 5 build error taxonomy (atomic write) + NFR25.
- D10 inline tri-lingual fallback coheres with negative-assertion lint (the only permitted inline script is the `<script nomodule>` toggle, explicitly exempted).
- Step 5 camelCase JSON coheres across all data files; Paige's editorial-friction concern logged as known cost.
- Step 5 Murat-hardened eslint + inline `debug()` (replacing src/lib/log.mjs per Winston) preserves NFR21 + avoids "shared module precedent" failure mode.
- Step 6 BUDGETS.json + lint-cognitive-load-budget coheres with NFR32-NFR35.

**Pattern consistency:** all naming conventions cohere. Mixed-by-domain inconsistencies (kebab block IDs + camelCase frontmatter in same `.md` file) are principled: kebab is *required* for HTML ids and URL fragments; camelCase is *chosen* for JSON-uniform JS-callable data.

**Structure alignment:** five-domain model (A SPA / B Scoring / C Content / D Tools / E Test Fixtures) is reflected in the directory tree with one explicit cross-domain exception (D → E snapshot writes via `make snapshot-update`), codified in `no-restricted-paths` lint config.

### Requirements Coverage Validation

**FRs:** 53/53 mapped. Load-bearing FRs spot-checked:
- FR7 (16 items, 128-bit crypto seed, deterministic subset/order/augmentation) → `src/assessment/{item-prng, item-selection}.js` + `src/items/item-parameters.json` ✅
- FR14 (IRT 2PL EAP) → `src/scoring/irt/eap.js` + `tests/golden/vectors.json` ✅
- FR15 (uncertainty band, RSS) → `src/scoring/irt/index.js::scoreSession()` ✅
- FR18 (co-equal triplet) → `src/css/components/score-panel.css` + Playwright computed-style assertion ✅
- FR19 (per-language clinical-register copy) → `src/content/methodology/<lang>/ethics/**.md` + CODEOWNERS ✅
- FR20 (in-bundle native-language crisis resources) → `src/content/crisis-resources/<lang>.json` + lastVerified ✅
- FR23 (inline non-dismissible caveat) → `score-panel.css` `.score-panel__caveat[role=note]` + lint-no-role-alert ✅
- FR24 (tear-edge anti-screenshot composition) → score-panel.css nested tear-edge block + cropping fuzzer ✅
- FR41 (zero-third-party 30s DevTools) → `tests/playwright/network-trace.spec.mjs` ✅
- FR45 (committed ICAR confirmation) → `ICAR-CONFIRMATION.pdf` + `tools/lint-trust-artifacts.mjs` ✅

**NFRs:** 35/35 mapped. Previously orphaned NFR4 (memory < 50 MB) closed by `tests/perf/memory-budget.spec.mjs`. Previously hand-waved NFR32-NFR35 (maintainability budgets) closed by `BUDGETS.json` + `tools/lint-cognitive-load-budget.mjs`.

**Cross-cutting concerns (9/9):** all 9 concerns from Step 2 have file-level homes (i18n parity, accessibility, performance budgets, auditability surface, license provenance, reveal-beat coordination, mirror-readiness, per-language governance, negative-assertion CI suite).

**Innovation pillars (7/7):** all 7 PRD Innovation pillars architecturally supported with concrete file-level coverage.

**Epics (9 dev + 5 gates):** all 9 development epics have file-tree landing points; all 5 gate-outreach tracks have document homes in `docs/launch-readiness/`.

### Implementation Readiness Validation

- **Decision completeness:** every Step 4 decision documented with rationale + acknowledged trade-off. Pending decisions explicitly named with triggers (D8 build cache; meta-CI workflow; Phase 2 deferrals tagged inline in the tree).
- **Structure completeness:** every UX component has a CSS file path; every tool/lint script enumerated; every test subtree specified; every internal doc enumerated.
- **Pattern completeness:** all 53 FRs + 35 NFRs file-mapped; all naming/format/process/communication patterns specified with good/anti-pattern examples; mechanical enforcement specified for every pattern where automation is possible.

### Gap Analysis

**Critical gaps (block implementation):** None.

**Important gaps (Phase 1 attention; do not block start):**

1. **`src/items/item-parameters.json` schema** — author in Epic 1 alongside ICAR confirmation; add `corpus/item-parameters.schema.json` for symmetry with other corpus contracts.
2. **Locale-loader fallback for unsupported active locales** — pin `const SUPPORTED = ['en', 'ru', 'pl']; const active = SUPPORTED.includes(detected) ? detected : 'en';` in `src/assessment/i18n/locale-loader.js`.
3. **`dist/` size budget at year N** — per-corpus-release accumulation reaches ~30 MB at v5; add a `scheduled.yml` alert at 250 MB.
4. **Mirror parity verification details** — parity check is on response body, not headers (which legitimately differ between hosts); document in `docs/scheduled-yml-failure-routing.md`.
5. **Outlast-the-maintainer runbook (NFR35)** — author `docs/maintainer-handoff.md` post-launch; structural support is already in place via DOI + IA + SH + OSS license.
6. **`iqme:reveal-stage` per-band beat sequence + dwell timings** — pin in Epic 5 (SPA hardening) implementation; UX Step 7 + Step 11 carry the substantive specifications.

**Nice-to-have gaps (Phase 2+):** Storybook-equivalent token cheat sheet, `lint-i18n-coverage.mjs`, per-component visual regression beyond cropping-fuzzer, service worker for offline assessment.

### Validation Issues Addressed

All issues surfaced during four Party Mode rounds + this validation pass are resolved or explicitly deferred-with-trigger. The 6 "important" gaps are flagged for Phase 1 attention but do not block implementation start. Nothing in the gap list compromises any FR, NFR, Innovation pillar, or cross-cutting concern.

### Architecture Completeness Checklist

**✅ Requirements Analysis** (Step 2) — context, scale, constraints, cross-cutting concerns
**✅ Starter Selection** (Step 3) — no-starter hand-author committed with honest LOC envelope
**✅ Architectural Decisions** (Step 4) — 10 decisions resolved; vertical-slice-first 9-epic sequence + 5 parallel gates
**✅ Implementation Patterns** (Step 5) — camelCase JSON, Murat-hardened eslint, mirrored tests, LICENSES.md contract
**✅ Project Structure** (Step 6) — 5-domain boundary model, complete master tree, full requirements mapping
**✅ Validation** (Step 7) — coherence + coverage + readiness verified; 6 important gaps surfaced

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: HIGH** — four Party Mode rounds stress-tested decisions from 7 distinct agent perspectives; every PRD FR/NFR mapped; 8 pre-architecture readiness-gap blockers (B1–B8) closed; 5-domain boundary model with lint enforcement; 6 important gaps surfaced as known residuals.

**Key strengths:** comprehensive auditability surface (Innovation #5); mechanically-enforced trust posture (8+ negative-assertion lints + CSP + network-trace); build-time invariant translation-equivalence (Innovation #7); enforceable solo-dev cognitive-load budget; vertical-slice-first implementation sequence proving the load-bearing UX hypothesis early (Epic 2).

**Areas for future enhancement (deferred-with-trigger):** build cache (trigger: build > 30s); meta-CI workflow (trigger: 2nd external contributor); CI gate matrix (trigger: contributor count ≥ 3); service worker for offline (deferred per NFR23); high-contrast + RTL theme adaptations (UX Phase 3); maintainer-handoff runbook.

### Implementation Handoff

**AI Agent Guidelines:**

1. Follow architectural decisions exactly per Step 4 §Core Architectural Decisions.
2. Use implementation patterns consistently per Step 5; the CI lint suite mechanically enforces.
3. Respect domain boundaries per Step 6 §Five-Domain Boundary Model.
4. Follow the revised 9-epic sequence per Step 4 §Decision Impact Analysis; Epic 2 (Vertical Slice) is the load-bearing early-validation milestone.
5. Load `docs/corpus-build-conventions.md` first when working on corpus build or methodology content.
6. Check `docs/required-ci-checks.md` to understand which lints/tests gate which surfaces.
7. Follow Conventional Commits with project scopes (`feat(scoring): ...`, `fix(corpus): ...`).
8. Throw `TypeError`/`RangeError` from scoring functions; never return `NaN` or error objects.
9. Use `data-*` attributes for state, never stateful classes.
10. Use `iqme:<verb-or-state>` for any new in-page DOM events, with `t:` from `performance.now()`.

**First implementation priority (Epic 0 — Bootstrap):**

```bash
git rm iq-me.html
mkdir -p src/{assessment/i18n,scoring/irt,content/{methodology/{en,ru,pl},i18n/{en,ru,pl},glossary,trails,crisis-resources,diagrams},css/components,items}
mkdir -p corpus templates tools vendor tests/{unit,golden,snapshots/methodology,playwright,a11y,perf} docs/launch-readiness .github/workflows
touch Makefile LICENSES.md CITATION.cff README.md CONTRIBUTING.md CHANGELOG.md BUDGETS.json
touch .editorconfig .gitignore .prettierrc .prettierignore .eslintrc.json package.json
touch corpus/{schema.json,frontmatter.schema.json,markdown-subset-v1.md,build-cache-v1.schema.json,methodology-claims-v1.schema.json}
touch docs/{corpus-build-conventions.md,branch-protection-config.md,required-ci-checks.md,scheduled-yml-failure-routing.md}
touch vendor/SHASUMS .github/CODEOWNERS
git add -A && git commit -m "feat(bootstrap): scaffold v1 architecture per docs/architecture.md (Epic 0)"
```

**Second implementation priority (Epic 1 — Scoring Engine):** author `src/scoring/irt/{quadrature, likelihood, eap, se, index}.js` + `METHODOLOGY_CLAIMS.json` + `tests/golden/vectors.json` (≥ 1,000 patterns vs R `mirt 1.41.x` with pinned `quadpts=61, theta_lim=c(-6,6), set.seed(20260514)`). Land unit tests at `tests/unit/scoring/irt/*.test.mjs`. Land `tools/lint-claims-manifest.mjs` from day 1 to enforce manifest parity.

**Parallel: Gate Epic outreach begins** at Epic 1 completion. Initiate ICAR confirmation, external psychometrician, RU/PL clinical-register translators, and 5×3 native-speaker tester recruitment — 5 independent lead-time tracks that must not block at the end of development.

**Definition of done for the architecture phase:** this document is the canonical reference. Subsequent updates require a versioned amendment recorded in the `editLog` frontmatter.
