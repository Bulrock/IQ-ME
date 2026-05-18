---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
filesIncluded:
  - "{output_folder}/planning-artifacts/prd.md"
  - "{output_folder}/planning-artifacts/architecture.md"
  - "{output_folder}/planning-artifacts/epics.md"
  - "{output_folder}/planning-artifacts/ux-design-specification.md"
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-18
**Project:** IQ-ME

## Document Inventory

| Type | File | Size | Modified |
|------|------|------|----------|
| PRD | `{output_folder}/planning-artifacts/prd.md` | 140 KB | 2026-05-15 |
| Architecture | `{output_folder}/planning-artifacts/architecture.md` | 124 KB | 2026-05-18 |
| Epics & Stories | `{output_folder}/planning-artifacts/epics.md` | 234 KB | 2026-05-18 |
| UX Design | `{output_folder}/planning-artifacts/ux-design-specification.md` | 184 KB | 2026-05-15 |

**Duplicates:** None.
**Missing required documents:** None.
**Sharded variants:** None.

**Reference (informational only):**
- `product-brief-IQ-ME.md`, `product-brief-IQ-ME-distillate.md` — product briefs (precede PRD; consulted for traceability where useful).
- `implementation-readiness-report-2026-05-15.md` — prior readiness report (predecessor of this run).

## PRD Analysis

PRD: [prd.md](../prd.md) — 956 lines, status `complete`, last edit 2026-05-15 (B1–B8 readiness-gap closure pass).

### Functional Requirements (53 total, FR1–FR53)

**Test Session (FR1–FR8)**
- FR1: Start in EN/RU/PL with no account, PII, or data-collection consent.
- FR2: Answer one matrix item at a time; revisable until final submission.
- FR3: Progress (items completed / total) visible at all times.
- FR4: Mid-session bail-out with explicit discard-or-continue choice; no silent partial scoring.
- FR5: No time pressure (no countdowns, no per-item timers, no time-based penalty).
- FR6: Browser-only session; same-origin static fetches only; no persistence absent opt-in.
- FR7: 16-item session drawn from full published ICAR-MR pool; 128-bit session seed from `crypto.getRandomValues()` held in memory only (never `localStorage`, URL, or bookmarkable); seed deterministically selects subset, order, and per-item rotation/reflection image augmentation; exact pool size and parameter set frozen in Epic 0 alongside ICAR-license artifact.
- FR8: Locale locked at consent — no mid-session language switch.

**Consent & Validity Disclosure (FR9–FR13)**
- FR9: Plain-language statement of what the instrument does and does not measure, per language, before test starts.
- FR10: Validity-envelope disclosure pre-test (incl. explicit visuospatial / screen-reader inequivalence).
- FR11: Explicit "Not today" decline path that exits the app.
- FR12: Continue control gated on the user having had the chance to read the validity envelope.
- FR13: Pre-result "are you ready" beat between final item and score render, with delay option.

**Score Computation (FR14–FR17)**
- FR14: Engine computes θ + SE via IRT 2PL EAP given response pattern + item parameters.
- FR15: Result expressed as Gf percentile + IQ-scale equivalent + **95% CI** uncertainty band; `SE_total = √(SEM² + SE_norming²)`; band = point ± 1.96·SE_total; rendered visually co-equal on both percentile and IQ-scale per FR18; derivation on `/methodology/scoring/uncertainty/`.
- FR16: Engine output is deterministic — no network, no DOM, no global mutable state.
- FR17: Engine invokable independently of UI (golden-vector testing, external audit, reproducibility).

**Result Delivery (FR18–FR27)**
- FR18: Percentile, IQ-scale, uncertainty band rendered as **visually co-equal** (no element dominates by size/color/position).
- FR19: Tail-specific copy (bottom-decile harm-mitigation; mid-band contextualization; top-decile anti-credentialization) authored by per-language clinical-register native speaker, not translated.
- FR20: Curated native-language mental-health / crisis-resource list, no geolocation, no account, no external service request.
- FR21: One-click navigation from every score-page number (percentile, IQ-scale value, uncertainty band) to the methodology page defining it, in active language.
- FR22: Per-item-difficulty breakdown — drawn items partitioned into **easy / medium / hard** by IRT b-parameter terciles within the v1 pool; result page shows fraction-correct per band; taxonomy on `/methodology/constructs/icar-mr/` and `/methodology/scoring/overview/`.
- FR23: Non-dismissible inline caveat above score disclaiming clinical, educational-placement, employment, and legal-decision applicability.
- FR24: Top-decile composition binds caveat + uncertainty band to the score such that a clean decontextualized screenshot requires deliberate editing.
- FR25: No share affordance whatsoever — no share button, no certificate, no badge, no `navigator.share()`, no auto-generated social card.
- FR26: Opt-in only result-save to `localStorage`; first render must work with storage empty.
- FR27: Per-language retest-implication explanation on the result page itself (not buried); **no technical retake cooldown** is enforced; full text on `/methodology/limitations/retest-effects/`.

**Methodology Corpus (FR28–FR36)**
- FR28: Every methodology page reachable via stable, versioned permalink that does not change across releases.
- FR29: Per-page citation block in at least APA + Wikipedia-citation-template format, version and DOI pre-filled.
- FR30: Zenodo DOI per release resolves to the canonical corpus version.
- FR31: One-click switching between language variants; `hreflang` declarations for cross-language SEO.
- FR32: Corpus reachable, navigable, indexable, citable **without taking the test**.
- FR33: Per-language reading-level discipline (Flesch-Kincaid EN; Oborneva-equivalent RU; Pisarek/Jasnopis PL) enforced pre-publication.
- FR34: Stale-translation banner on pages where translated content has drifted from EN source.
- FR35: Named reviewer-of-record per language per version on page footer or corpus changelog.
- FR36: A separately-maintained "what this instrument does not measure" page per language, protected from silent shortening or removal (🔒 marker).

**Localization & Language (FR37–FR40)**
- FR37: EN/RU/PL selection at landing; persisted to `localStorage` only on explicit opt-in.
- FR38: All UI surfaces (landing, consent, item instructions, options, progress, result, methodology corpus links) available in chosen language.
- FR39: Build-time block-level content-key parity enforcement across all three locales.
- FR40: Named reviewer-of-record per language signs off on every content-key change before publication.

**Trust Verification (FR41–FR46)**
- FR41: Skeptic can verify zero third-party requests in 30 s via browser DevTools — only same-origin GETs to static assets.
- FR42: Scoring engine source readable **as shipped** — no minification, bundling, or transpilation between repo and live site.
- FR43: `METHODOLOGY_CLAIMS` manifest visible in repo; CI lint blocks PRs whose engine and methodology corpus disagree.
- FR44: Committed golden-vector test set + CI workflow asserting ±0.001 logits parity vs R `mirt::fscores(method="EAP")` reference.
- FR45: Written ICAR license confirmation committed to repo root as a verifiable artifact (PDF or signed email export).
- FR46: For every tagged release, Internet Archive snapshot + Software Heritage archive + Zenodo DOI exist and are locatable.

**Contribution & Governance (FR47–FR53)**
- FR47: Documented PR workflow in `CONTRIBUTING.md`.
- FR48: CI blocks PRs that violate any of: translation parity, methodology-claims-manifest parity, license-provenance integrity, per-language reading-level, accessibility baseline, network-trace zero-third-party invariant, scoring-engine golden-vector accuracy.
- FR49: Dual approval — maintainer + per-language reviewer-of-record — required for non-EN content-key changes.
- FR50: `LICENSES.md` at root declares app MIT, items + translated content CC-BY-NC-SA (or upstream-author-specified).
- FR51: README forking-ethics ask: forkers preserve caveats + methodology corpus + anti-credentialization composition (request, not enforceable under MIT).
- FR52: Update subscriptions via GitHub Discussions threads + repo release notifications only; no email subscription mechanism.
- FR53: Contributors credited by GitHub handle in per-release changelog; no external tracking or social-graph integration.

**Total FRs: 53**

### Non-Functional Requirements (35 total, NFR1–NFR35)

**Performance (NFR1–NFR5)**
- NFR1 — Load time: FCP < 1.5 s, LCP < 2.5 s, TTI < 3.0 s, CLS < 0.05 on mid-tier Android (Moto G Power 2022 equivalent) under Lighthouse "Slow 4G"; CI-enforced.
- NFR2 — Page weight: initial-load ≤ 200 KB gz; methodology pages ≤ 100 KB gz each; items ≤ 50 KB each (SVG default, PNG fallback).
- NFR3 — Scoring latency: < 100 ms on mid-tier mobile; no spinner, no async-render pattern on score compute.
- NFR4 — Memory budget: ≤ 50 MB session memory via `performance.memory` in Playwright synthetic run.
- NFR5 — Browser footprint: last 24 months of evergreen Chrome / Chromium-derivatives (Edge, Brave, Opera, Yandex Browser, Samsung Internet) / Firefox / Safari (macOS + iOS); Yandex Browser specifically validated for launch; not supported: IE, pre-Chromium Edge, Safari < iOS 16 / macOS 12, Firefox ESR < 102.

**Security & Privacy (NFR6–NFR11)**
- NFR6 — Zero-third-party invariant: only same-origin GETs to static assets; Playwright network-trace assertion per PR.
- NFR7 — Strict CSP: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`; no `eval`, no `new Function`, no inline scripts, no inline event handlers; CSP-violations = 0 in Playwright session.
- NFR8 — No PII collection — zero anywhere except user's `localStorage` on opt-in; no IP-based logging by IQ-ME; no cookies; no fingerprinting; GDPR / 152-FZ / UODO controller obligations not triggered by design.
- NFR9 — `localStorage` discipline: writes only on explicit user action (language toggle, "Save my result" click); first-render correctness independent of storage state; Playwright-enforced.
- NFR10 — Crypto randomness only: `crypto.getRandomValues` for all selection/ordering; `Math.random()` forbidden in scoring/selection; CI grep-enforced.
- NFR11 — Forking-ethics request in README (non-enforceable under MIT; structural defenses are canonical-site discoverability + DOI permanence + community recommendation).

**Accessibility (NFR12–NFR15)**
- NFR12 — WCAG 2.2 AA on all non-item surfaces; `axe-core` (or `pa11y`) in CI on every PR.
- NFR13 — Validity-envelope honesty on items: matrix items visuospatial by construction, not screen-reader-equivalent; disclosed in pre-test consent per FR10 (not papered over with synthetic alt-text).
- NFR14 — Manual screen-reader audit pre-launch: NVDA + Firefox (Windows), VoiceOver + Safari (macOS), TalkBack + Chrome (Android); documented in launch-readiness section.
- NFR15 — Dark mode is a separately-designed palette (not auto-inverted); both themes meet contrast thresholds; reveal sequence has animated + `prefers-reduced-motion: reduce` instant-render fallback.

**Reliability & Availability (NFR16–NFR20)**
- NFR16 — Canonical uptime = whatever GitHub Pages provides; no SLA promised by IQ-ME (transparent honesty in README).
- NFR17 — Mirror-readiness: relative asset paths throughout; build deploys identically to GitHub Pages + Codeberg Pages (or Cloudflare Pages); 1-day manual failover.
- NFR18 — Archival redundancy: per-release Internet Archive (Save Page Now) + Software Heritage `save` endpoint mirroring; manual at v1, automated in v1.0.1.
- NFR19 — Stale-version banner: methodology pages whose translated content has drifted render an automatic advisory banner (drift visibility = reliability mechanism for translation equivalence).
- NFR20 — Graceful error fallback: localized fallback page directing to GitHub Discussions; no auto error reporting, no resume attempt, no stack-trace upload.

**Auditability & Verifiability (NFR21–NFR26) — IQ-ME-specific trust-premise class**
- NFR21 — Runtime-zero-build invariant: no compiled / bundled / minified / transpiled JS; only build step is author-time `make build-methodology` (CommonMark→HTML); CI verifies deployed JS tree matches source JS tree byte-for-byte.
- NFR22 — Scoring engine golden-vector parity: ±0.001 logits vs reference on ≥ 1,000 simulated patterns. **Reference pinned**: R 4.4.x + mirt 1.41.x with `mirt::fscores(method="EAP", quadpts=61, theta_lim=c(-6,6))` and `set.seed(20260514)`; re-generation requires explicit `tests/golden/CHANGELOG.md` entry + reproducibility note + reviewer-of-record sign-off; rerun runbook on `/methodology/scoring/golden-vectors/`.
- NFR23 — Methodology-claims manifest parity: engine `METHODOLOGY_CLAIMS` ↔ methodology-page `asserts` checked by CI lint; hard gate from v1.
- NFR24 — License-provenance verifiability: every shipped item file traces to ICAR attribution; `LICENSES.md` immutable between releases except via changelog; written ICAR license confirmation committed in repo root; CI license-provenance test per PR.
- NFR25 — Citation infrastructure: stable versioned permalinks (`/methodology/v<X>.<Y>.<Z>/<lang>/<path>/`) under **per-corpus-release versioning** — every page re-emits at every corpus version tag regardless of content change; JSON-LD `ScholarlyArticle` + `hreflang` on every page; `CITATION.cff` at root; Zenodo DOI per tagged release.
- NFR26 — Verification time-to-confidence: zero-third-party-fetch verifiable in ≤ 30 s; full engine source readable in ≤ 10 min (~250 LOC); golden-vector test suite locally runnable in ≤ 5 min with only `node`.

**Content Governance & Translation Equivalence (NFR27–NFR31)**
- NFR27 — Block-level content-key parity: every page has stable-ID keys; all three locales present per key; RU/PL files carry current EN source hash in frontmatter; CI fails on missing keys, orphan keys, stale source hashes.
- NFR28 — Reading-level discipline: Flesch-Kincaid grade ≤ 12 (target 9–10) for EN; Oborneva-equivalent for RU; Pisarek-equivalent (Jasnopis) for PL; CI-enforced from v1.
- NFR29 — Reviewer-of-record per language per version: branch protection enforces dual approval (maintainer + per-language reviewer) on non-EN content-key changes; reviewer name + handle + sign-off date surfaced on page footer or corpus changelog.
- NFR30 — Glossary-first writing: every technical term used in any methodology page exists in `/glossary/` in all three languages before appearing in body text; lint-enforced.
- NFR31 — Style-guide invariants: no idioms; sentence-length caps (25 words EN, ~180 chars RU, ~160 chars PL); diagrams over prose for distributional concepts; SVG `<title>` and `<desc>` translated as content keys.

**Maintainability & Sustainability (NFR32–NFR35)**
- NFR32 — Solo-dev cognitive-load budget: ~250 LOC scoring engine, ~30 KB app modules, ~15 KB i18n harness, ~30 methodology pages per locale; any addition that materially increases load (framework migration, state library, bundler) re-evaluated against the runtime-zero-build invariant.
- NFR33 — Zero npm runtime deps in prod; dev tooling permitted via `make` targets (must not modify shipped files); `package.json` optional.
- NFR34 — License sustainability: app MIT; items + corpus + translations CC-BY-NC-SA; non-commercial constraint honored in perpetuity by structural posture (no entity, no revenue, no exit).
- NFR35 — Outlast-the-maintainer property: zero-build + license sustainability + archival redundancy + DOI permanence jointly = maintainer-independence mechanism.

**Total NFRs: 35**

### Additional Requirements & Constraints

**Pre-launch gates (5; binary blocking; named in Step 8 / Risk Mitigation #1, #11, #12)**
1. Written ICAR license confirmation committed to repo (Risk #1; FR45).
2. External psychometrician sign-off on methodology + result-page copy + scoring spec (Risk #11).
3. RU/PL native-speaker (clinical-register) review sign-off (Risks #4 + #5 + #12; FR19 / NFR29).
4. Scoring spec frozen — handled by **Epic 0: Scoring Spec Freeze** (carry-forward register).
5. **≥12 of 15 native-speaker testers** (≥4/5 in each of EN/RU/PL) report the experience felt honest and the result felt credible; no harm flags (User Success criterion #3 + #4).

**Methodology Corpus Inventory (frozen; FR36-protected ceiling enforced)**
- 30 pages per locale × 3 locales = 90 authored + translated pages at v1.
- Path scheme: `/methodology/v<X>.<Y>.<Z>/<lang>/<section>/<page>/` under NFR25 per-corpus-release versioning.
- Sections: Constructs (5) · Scoring (6) · Norming (3) · Limitations & Caveats (4, incl. one 🔒 FR36-protected) · Ethics (3) · Tail Scenes (2, clinical-register-reviewed) · Provenance (3) · Reference (4).
- Specific anchored pages: `/scoring/uncertainty/` (FR15 SEM + norming-sample formula); `/scoring/golden-vectors/` (NFR22 R/mirt/quadpts/seed pin); `/limitations/retest-effects/` (FR27 no-cooldown discipline); `/limitations/what-this-does-not-measure/` 🔒 (FR36).

**Anti-integration list (explicit forbidden integrations — anything here breaks the trust premise)**
- All analytics (GA, Plausible, Fathom, GoatCounter, etc.); all error/session monitoring (Sentry, LogRocket, etc.); third-party CDNs (Google Fonts, jsDelivr, Cloudflare-CDN'd JS); social-media share endpoints; email collection / newsletter; geo-IP services.
- Sanctioned external dependencies only: GitHub Pages, Zenodo, Internet Archive, Software Heritage, GitHub Discussions.

**Resolved decisions ledger (closed 2026-05-15; openDecisions = [])**
- CTT vs IRT-EAP → IRT 2PL EAP (FR14; NFR22).
- Item delivery → randomized 16-item subset + crypto-seeded ordering + image augmentation (FR7).
- Mid-session bail-out → discard-or-continue; no resume; no silent partial (FR4).
- Share/screenshot policy → no share UI + anti-screenshot composition (FR24, FR25).
- Retake cooldown → no technical cooldown; FR27 + `/methodology/limitations/retest-effects/` explain implications.
- Locale switch mid-session → blocked (FR8).
- Russia mirror → mirror-ready from v1 (NFR17).

**Innovation pillars (must remain audible in epics/stories)**
- #1 Honesty-as-structural-moat · #2 Methodology-as-coupled-artifact (CI-enforced) · #3 Score-delivery-as-designed-ceremony · #4 Anti-credentialization-by-composition · #5 No-build auditable IRT in browser JS · #6 Static-site psychometric instrument as citable scientific artifact · #7 Tri-lingual measurement equivalence as CI-enforced property.

**Capability-contract reminder (PRD §self-validation):** any feature not derivable from FR1–FR53 will not exist in the final product unless added via a PRD revision.

### PRD Completeness Assessment (initial)

| Dimension | Assessment |
|---|---|
| Structure & coverage | Strong. 12 numbered PRD steps + 3 edit-pass steps complete; status=`complete`; FRs and NFRs both self-validated against journeys / domain / innovation / scoping. |
| Decision ledger | Clean. `openDecisions: []`; all 7 prior open decisions resolved by 2026-05-15 reconciliation. |
| Traceability | High. PRD self-cross-references journeys → capabilities → FRs/NFRs explicitly (Journey Requirements Summary table; Self-Validation Summaries on both FR and NFR sections). |
| Gate definitions | Crisp. 5 pre-launch gates named with named-owner artifacts; success-criteria measurable-outcomes table is 8 binary/threshold rows. |
| Quantitative pinning | Excellent for tools: R 4.4.x + mirt 1.41.x + quadpts=61 + θ-lim ±6 + seed `20260514` for golden vectors; ±0.001 logits tolerance; 95% CI via `√(SEM² + SE_norming²)`; 16-item session; 30 pages × 3 locales. |
| Open risks against epics | One latent ambiguity: the **exact ICAR-MR pool size and item-parameter set** are explicitly frozen *in Epic 0* (FR7) — meaning the PRD intentionally defers a value to the epics layer. This is a planned cross-doc dependency; the epics analysis must confirm Epic 0 carries it. |
| Stale-translation / parity vs reality | NFR27–NFR29 + FR34 + FR39 form an internally consistent contract. Epics + stories must operationalize the `EN source hash` mechanism and `reviewer-of-record` registry concretely. |
| Item-pool license dependency | All FR/NFR coverage routes through ICAR license arriving in writing; if it does not arrive or arrives constrained, Risk #1 fallback (OpenPsychometrics subset) is a scope change not currently re-derived in FRs. Acceptable as a *named exception path*. |

**No PRD-internal gaps blocking implementation.** All capability surface is enumerated; all NFR thresholds are quantitative or named-process-bound; gates are explicit. The PRD is implementation-ready *on its own*; remaining readiness work is cross-document — does the epic plan cover every FR and address every NFR class?

## Epic Coverage Validation

Epics: [epics.md](../epics.md) — 2,448 lines, status `complete`, 14 epics, 75 stories (matches frontmatter counts). Stress-tested by two Party-Mode rounds (John, Winston, Sally, Murat, Amelia, Mary) on 2026-05-18.

### Structure Overview

| Epic | Title | Stories | Type |
|------|-------|---------|------|
| 1 | Repo Trust Artifacts + CI Skeleton + Negative-Assertion Lints | 10 | Dev |
| 2 | Auditable Scoring Engine + Golden Vectors | 8 | Dev |
| 3 | Vertical Slice — EN Happy-Path Score → Methodology Handoff + Contract Artifacts | 8 | Dev |
| 4 | Methodology Corpus Build Pipeline + Versioned Citation Infrastructure | 8 | Dev |
| 5 | Methodology Visual System + Full English Methodology Corpus (30 Pages) | 7 | Dev |
| 6 | Assessment SPA Hardening — Full Ceremony, Asymmetric Tail-Scenes, Anti-Credentialization | 7 | Dev |
| 7 | RU + PL Localization + Per-Language Reviewer Discipline | 9 | Dev |
| 8 | Trust-Verification Surface + Mirror Failover + Archival Permanence | 8 | Dev |
| 9a | ICAR License Confirmation (Gate) | 2 | Outreach |
| 9b | External Psychometrician Sign-off (Gate) | 1 | Outreach |
| 9c | RU Clinical-Register Translator (Gate) | 1 | Outreach |
| 9d | PL Clinical-Register Translator (Gate) | 2 | Outreach |
| 9e | 12-of-15 Native-Speaker Tester Credibility (Gate) | 1 | Outreach |
| 10 | v1.0.0 Coordinated Release | 3 | Release |

**Sequencing:** Epics 1→8 are dev (sequential dependencies). Epics 9a–9e are parallel outreach tracks that start at Epic 2 completion (scoring spec frozen) and run alongside Epics 3–8. Epic 10 fires only when all dev epics merge AND all five gates close. Vertical-slice-first ordering (Epic 3 proves Anna's aha-click hypothesis before broader investment) is preserved.

### FR Coverage Matrix

The epics document carries an explicit FR Coverage Map at [epics.md lines 314-372](../epics.md). Every PRD FR is named and assigned to one or more epics. Multi-epic FRs are split intentionally — *artifact* (dev epic) vs *process* (gate epic), or *initial* vs *graduated* enforcement (e.g. lint shipped green on empty in Epic 1, populated in Epic 2, strict in Epic 4).

| FR | PRD Requirement (abridged) | Epic Coverage | Status |
|----|----------------------------|---------------|--------|
| FR1 | Begin session no account/PII | Epic 3 (vertical slice) | ✓ Covered |
| FR2 | One item at a time, revisable | Epic 3 (item-runner) | ✓ Covered |
| FR3 | Progress visible | Epic 3 (progress-indicator) | ✓ Covered |
| FR4 | Mid-session bail-out discard/continue | Epic 6 (Story 6.3) | ✓ Covered |
| FR5 | No time pressure | Epic 3 (item-runner design) | ✓ Covered |
| FR6 | Browser-only, no server state | Epic 3 (state.js in-memory) | ✓ Covered |
| FR7 | 16 items, 128-bit crypto seed, image-augmentation | Epic 3 (item-prng + item-selection) | ✓ Covered |
| FR8 | Locale lock mid-session | Epic 7 (locale-switch-blocker-hint) | ✓ Covered |
| FR9 | Plain-language statement | Epic 3 (EN consent) | ✓ Covered |
| FR10 | Validity-envelope incl. visuospatial | Epic 3 (consent + diagram); chrome CSS Epic 5 | ✓ Covered |
| FR11 | "Not today" exit | Epic 3 (consent-scene) | ✓ Covered |
| FR12 | Continue gated on envelope display | Epic 3 (Story 3.3 dwell-gate AC) | ✓ Covered |
| FR13 | Pre-result "are you ready" beat | Epic 3 (reveal-stage anchor) | ✓ Covered |
| FR14 | IRT 2PL EAP θ + SE | Epic 2 (scoring engine) | ✓ Covered |
| FR15 | Percentile+IQ+95% CI band RSS | Epic 2 (emission); render in FR18 | ✓ Covered |
| FR16 | Deterministic, no network/DOM/globals | Epic 2 (module discipline) | ✓ Covered |
| FR17 | Independently invocable for audit | Epic 2 (`node --test` golden parity) | ✓ Covered |
| FR18 | Co-equal triplet visual rendering | Epic 3 (CSS-source lint) + Epic 6 (Playwright computed-style) | ✓ Covered (two-tier) |
| FR19 | Tail-specific clinical-register copy | Epic 6 (EN placeholder) + Epic 7 (RU/PL via Gates 9c/9d) | ✓ Covered |
| FR20 | Per-language crisis-resource lists | Epic 6 (EN) + Epic 7 (RU/PL) | ✓ Covered |
| FR21 | One-click number → methodology page | Epic 3 (URL contract + handoff binding) | ✓ Covered |
| FR22 | Per-item-difficulty breakdown | Epic 6 (Story 6.2 difficulty-sentence) | ✓ Covered |
| FR23 | Inline non-dismissible caveat | Epic 3 (`role="note"`; lint-no-role-alert from Epic 1) | ✓ Covered |
| FR24 | Top-decile anti-screenshot composition | Epic 6 (tear-edge + cropping fuzzer, bank-frozen-gated) | ✓ Covered |
| FR25 | No share/cert/badge/navigator.share | Epic 1 (lint-no-share from day 1) | ✓ Covered |
| FR26 | Opt-in localStorage save | Epic 3 (storage-empty first render) + Epic 6 (full save UI) | ✓ Covered |
| FR27 | Retest-effect copy on result page | Epic 6 (Story 6.7 retest-note + Epic 5 limitations page) | ✓ Covered |
| FR28 | Stable versioned permalinks | Epic 4 (corpus pipeline + per-corpus-release re-emit) | ✓ Covered |
| FR29 | APA + Wikipedia-template citation | Epic 4 (cite-this-page widget); BibTeX deferred | ✓ Covered |
| FR30 | Zenodo DOI per release | Epic 4 (scheme + CITATION.cff) + Epic 8 (minting) | ✓ Covered |
| FR31 | hreflang cross-language | Epic 7 (Story 7.7 hreflang emission) | ✓ Covered |
| FR32 | Corpus reachable w/o test | Epic 3 (3 stubs) + Epic 5 (full 30 pages, anchor-first) | ✓ Covered |
| FR33 | Per-language reading-level discipline | Epic 4 (EN lint) + Epic 7 (RU/PL calibration via Story 7.5a) + Epic 4 Story 4.8 SPA microcopy coverage | ✓ Covered |
| FR34 | Stale-translation banner | Epic 4 (hatnote component + stub lint) + Epic 7 (full coverage) | ✓ Covered |
| FR35 | Named reviewer-of-record on footer | Epic 4 (masthead + frontmatter contract) | ✓ Covered |
| FR36 | Protected "does-not-measure" page | Epic 5 (FR36-protected content + lint-fr36-protection) | ✓ Covered |
| FR37 | EN/RU/PL selection at landing | Epic 7 (language-switcher) | ✓ Covered |
| FR38 | All UI in chosen language | Epic 7 (i18n harness) | ✓ Covered |
| FR39 | Block-level content-key parity build-time | Epic 7 (lint-translation-parity full) | ✓ Covered |
| FR40 | Reviewer sign-off before content change | Epic 7 (artifact: CODEOWNERS + branch-protection) + Epics 9c/9d (process) | ✓ Covered |
| FR41 | 30-sec DevTools zero-third-party | Epic 1 (strict from day 1) + Epic 3 (exercises slice) + Epic 8 (full surface) | ✓ Covered |
| FR42 | Source readable as shipped | Epic 1 (runtime-zero-build invariant) | ✓ Covered |
| FR43 | Methodology-claims manifest + CI lint | Epic 1 (lint green on empty) + Epic 4 (manifest populated, --strict graduation) | ✓ Covered (multi-stage) |
| FR44 | Committed golden vectors + CI workflow | Epic 2 (tests/golden/ + pr-checks `node --test`) | ✓ Covered |
| FR45 | ICAR license confirmation in repo | Epic 1 (artifact slot + pending fallback) + Epic 9a (arrival) | ✓ Covered (split) |
| FR46 | Per-release IA + SH + Zenodo | Epic 8 (release.yml archival triggers) | ✓ Covered |
| FR47 | PR workflow in CONTRIBUTING.md | Epic 1 (slim stub) + Epic 8 (full version) | ✓ Covered |
| FR48 | CI blocks PRs on parity/lint/network/golden | Epic 1 (matrix + first lints) + Epic 4 (corpus lints) + Epic 8 (full consolidation) | ✓ Covered |
| FR49 | Dual-approval for non-EN changes | Epic 7 (CODEOWNERS + branch-protection-config) + Epics 9c/9d (process) | ✓ Covered |
| FR50 | LICENSES.md app MIT + content CC-BY-NC-SA | Epic 1 (Story 1.2) | ✓ Covered |
| FR51 | README forking-ethics statement | Epic 1 (Story 1.2) | ✓ Covered |
| FR52 | GH Discussions subscribe; no email | Epic 8 (chrome-footer Discussions link, Story 8.8) | ✓ Covered |
| FR53 | Contributor credit by handle in changelog | Epic 8 (CHANGELOG format + release.yml automation) | ✓ Covered |

**FR coverage: 53 / 53 = 100%.**

### NFR Coverage Survey

Epics document restates all 35 NFRs in its Requirements Inventory section but does not provide an explicit per-NFR coverage map. Survey of story ACs shows the following:

| Class | NFRs | Coverage |
|-------|------|----------|
| Performance (NFR1–NFR5) | Load time, page weight, scoring latency, memory, browser footprint | ✓ Covered — Lighthouse-in-CI (Story 8.5), page-weight implicit via cognitive-load budget (Story 1.5) + per-asset caps in NFR, scoring latency by construction (Story 2.3), memory (Story 8.5 Playwright `performance.memory`), browser matrix (Story 10.1 manual incl. Yandex) |
| Security & Privacy (NFR6–NFR11) | Zero-third-party, strict CSP, no PII, localStorage discipline, crypto.getRandomValues only, forking-ethics ask | ✓ Covered — Stories 1.7 (Playwright network-trace strict from day 1), 8.5 (full CSP + network-trace consolidation), 1.6 (negative-assertion lints incl. no-cookie-banner / no-analytics-script / no-external-font / no-localStorage-without-consent), 3.4 (`crypto.getRandomValues` enforcement), 1.2 (README forking-ethics) |
| Accessibility (NFR12–NFR15) | WCAG 2.2 AA, validity-envelope honesty, manual screen-reader audit, dark mode + reduced-motion | ⚠ Mostly covered — 8.5 (axe-core/pa11y CI), 3.3 (validity-envelope per FR10), 6.4 (theme-toggle with both palettes + reduced-motion fallback). **Gap (minor): NFR14 — manual NVDA/VoiceOver/TalkBack pre-launch audit** is restated in requirements + UX-DR34 but not enumerated as an AC item in Story 10.1's pre-launch checklist (which lists Yandex Browser matrix but does not enumerate the three-platform screen-reader pass). |
| Reliability (NFR16–NFR20) | Canonical uptime, mirror-readiness, archival redundancy, stale banner, graceful error fallback | ⚠ Mostly covered — 8.4 (mirror), 8.2 (IA + SH + Zenodo), 4.7 (stale-translation hatnote). **Gap (minor): NFR20 — graceful localized JS-error fallback page** is declared in the requirements but no story has an explicit AC implementing "fallback page directing to GitHub Discussions" — likely implicit in Epic 6/3 but should be explicit. |
| Auditability (NFR21–NFR26) | Runtime-zero-build, golden-vector parity, claims-manifest parity, license-provenance, citation infrastructure, verification time-to-confidence | ✓ Covered — 4.2 (byte-stable build) + 2.6a/b (golden vectors with full R/mirt pin) + 4.3 (claims-manifest `--strict` graduation) + 4.5 (license-provenance lint) + 4.1/4.6/7.7 (citation infrastructure) + 8.2 (DOI). NFR26 verification times implicit in scoring engine size (Story 2.x cognitive-load budget) and Playwright timing budgets. |
| Content Governance (NFR27–NFR31) | Content-key parity, reading-level (EN/RU/PL), reviewer-of-record per language per version, glossary-first, style invariants | ✓ Covered — 7.5b (parity full), 4.4 + 7.5a (reading-level EN + RU/PL), 7.8 (CODEOWNERS + branch-protection), 4.4 (glossary-first), 7.5a (sentence-length caps), 5.1 (SVG translated `<title>`/`<desc>`) |
| Maintainability (NFR32–NFR35) | Cognitive-load budget, no runtime deps, license sustainability, outlast-the-maintainer | ✓ Covered — 1.5 (BUDGETS.json + lint), NFR33 enforced by Makefile + `npx --yes` pattern through every dev-tool story, 1.2 (LICENSES.md), NFR35 emerges structurally from NFR17 + NFR18 + NFR25 + NFR34 composition |

**NFR coverage: 33 / 35 fully covered; 2 minor gaps (NFR14, NFR20) — not blocking but worth surfacing as explicit AC additions during execution.**

### UX-DR (UX Design Requirement) Coverage Survey

The epics document also extracts 36 UX-DRs from the UX spec. Survey:

| UX-DR | Coverage |
|-------|----------|
| UX-DR1–UX-DR6 (design system foundation) | ✓ Story 1.10 (primitives + semantic + dark-mode + tokens.spec) |
| UX-DR7–UX-DR10 (chrome) | ✓ Story 6.4 + 7.1 (language-switcher) + 8.8 (Discussions link finalize) |
| UX-DR11–UX-DR16 (corpus components) | ✓ Stories 4.6 (masthead + cite-widget), 5.1 (lede + translation-in-progress-stub + validity-envelope diagram), 4.7 (stale-translation hatnote) |
| UX-DR17 (version-mismatch hatnote) | ✓ Explicitly deferred (Phase-2; not v1) — documented in Phase-2 deferrals list |
| UX-DR18–UX-DR27 (SPA components) | ✓ Stories 3.3 (landing + consent), 3.4 (item-runner + progress), 3.5 + 6.1 (score-panel + reveal), 6.5 + 7.6 (tail-scenes + silent-companion-line), 7.2 (locale-switch-blocker-hint) |
| UX-DR28 (validity-envelope-diagram) | ✓ Story 5.1 + 3.3 reuse |
| UX-DR29 (eap-shrinkage diagram) | ✓ Story 5.7 (ship-if-budget; explicit v1.0.1 deferral path) |
| UX-DR30 (iqme:reveal-stage event) | ✓ Story 3.1 ADR + 3.5 + 6.1 expansion |
| UX-DR31 (color discipline) | ⚠ Implicit — token discipline (Story 1.10) plus axe-core (8.5); no dedicated lint asserts "color never sole carrier" but `:focus-visible` ring + accent underline are token-driven |
| UX-DR32 (native radio for items) | ✓ Story 3.4 AC explicitly |
| UX-DR33 (landmarks + html lang + LTR) | ⚠ Implicit — story ACs reference `<main>`/`<nav>`/`<footer>` + `<html lang>` but no single story names UX-DR33 |
| UX-DR34 (manual screen-reader audit pre-launch) | ⚠ **Same gap as NFR14** — restated in requirements but not in Story 10.1's pre-launch checklist enumeration |
| UX-DR35 (print stylesheet for corpus) | ⚠ **Gap (minor): no explicit story** — Architecture & PRD both call for a methodology-corpus print stylesheet with the assessment app explicitly NOT supporting print; this is not enumerated in any story. Should likely be added to Epic 5 (corpus) or Epic 8 (consolidation). |
| UX-DR36 (CSS budget) | ✓ Story 1.5 (BUDGETS.json) |

**UX-DR coverage: 33 / 36 fully or explicitly-deferred-covered; 3 minor gaps (UX-DR31 partial, UX-DR34 same as NFR14, UX-DR35 print stylesheet).**

### Coverage Statistics

- **Total PRD FRs:** 53
- **FRs explicitly mapped to epics:** 53
- **FR coverage percentage:** **100%**
- **Total PRD NFRs:** 35
- **NFRs fully covered by story ACs:** 33
- **NFR coverage percentage:** ~94% (2 minor implicit-only items)
- **Total UX-DRs (epics-derived):** 36
- **UX-DRs fully or explicitly-deferred-covered:** 33
- **UX-DR coverage percentage:** ~92% (3 minor items)

### Missing or Implicit-Only Coverage (non-blocking)

These are not FR-level gaps and do not block dev start; however, they should be made explicit ACs during sprint execution so they don't slip through the pre-launch checklist:

1. **NFR14 + UX-DR34 — Manual screen-reader audit on NVDA+Firefox / VoiceOver+Safari / TalkBack+Chrome.** Restated in requirements but not enumerated in Story 10.1's pre-launch checklist (which lists Yandex Browser matrix only). **Recommendation:** add an explicit checklist line in Story 10.1 (or a dedicated sub-story) for the three-platform manual pass with results landing in `docs/launch-readiness/screen-reader-audit.md`.
2. **NFR20 — Graceful localized JS-error fallback page.** Declared in requirements but no story has an explicit AC. **Recommendation:** add an AC under Story 6.5 or Story 3.4 (or a new mini-story in Epic 6) implementing the localized fallback that directs to GitHub Discussions.
3. **UX-DR35 — Print stylesheet for methodology corpus** (with assessment-app `@media print { display: none }`). No explicit story. **Recommendation:** add to Story 5.1 (chrome additions) or Story 8.5 (trust-verification consolidation).

All three are *additive* implementation work that can land during execution without disturbing the epic structure.

### Cross-Document Coherence Notes

- **Innovation pillars (PRD)** are all named in epic narratives — pillar #2 (methodology-coupled artifact) is the load-bearing thread of Epic 4's exit criterion; pillar #5 (no-build auditable IRT) is the load-bearing thread of Epic 2; pillar #3 (ceremony) is Epic 6's apex; pillar #6 (citable scientific artifact) is Epic 5 + 8. None orphaned.
- **All 5 pre-launch gates** map cleanly onto Epics 9a–9e, with Epic 10.1's checklist gating on each gate's named artifact file (`ICAR-CONFIRMATION.pdf`, `psychometrician-signoff.md`, `ru-translator-signoff.md`, `pl-translator-signoff.md`, `tester-credibility-report.md`).
- **Belt-and-suspenders enumeration of deliverables per gate translator** (Story 7.6 + Story 9d.2): explicit enumeration of 7 deliverables per language reviewer (tail-scenes × 3, silent-companion-line, locale-switch-blocker-hint, crisis-resources, retest-effect copy) — protects against partial-sign-off failure mode.
- **Resolved decisions ledger from PRD** is honored: IRT 2PL EAP (Epic 2), 16-item randomized + augmented (Epic 3 FR7), discard-or-continue bail-out (Epic 6.3), no share UI (lint-no-share from Epic 1.6), no retake cooldown (Epic 6.7 honest retest-note), locale-switch blocked (Epic 7.2), mirror-ready v1 (Epic 8.4) — all storied.
- **D1 decision (markdown renderer choice)** is correctly deferred to Epic 4 implementation per Architecture's explicit deferral — not a planning gap.
- **`bankFrozen` manifest flag** (Murat's cropping-fuzzer gating) is authored in Story 1.4 (schema) and consumed by Story 6.6 (fuzzer activation) — orphan-fixture failure mode is closed.
- **Story 3.8 hallway test** validates the aha-click hypothesis *before* committing to 30 pages of corpus prose in Epic 5 — risk-prudent sequencing.

## UX Alignment Assessment

### UX Document Status

**Found.** [ux-design-specification.md](../ux-design-specification.md) — 2,015 lines, 14 steps complete, status `complete`, last edit 2026-05-15. Inputs include the PRD, both product briefs, and the prior readiness report. Stress-tested through the same Party-Mode pattern as PRD and Architecture.

### UX ↔ PRD Alignment

| Dimension | Assessment |
|---|---|
| User journey coverage | ✓ UX restates PRD's 6 journeys as 6 pass/fail "capability tests" — Anna/Mikhail/Daria/Tomáš/Karolina/Marek. The reframing is operationalization, not divergence. |
| Innovation pillars | ✓ UX's "Three coupled artifacts" framing maps directly to PRD's three load-bearing differentiator pillars (ceremony / methodology corpus / auditable claims). |
| Score-delivery ceremony | ✓ UX commits a named 8-beat sequence (`landing → pre-reveal → anchor → band → interval → context → tail-scene → methodology-handoff`) that operationalizes PRD's FR13 + FR18 + FR19 + FR24. PRD did not name the beat vocabulary; UX does — a *strengthening* commitment. |
| Anti-credentialization | ✓ UX commits a *declarative composition rule* ("no viewport surfacing IQ-scale numeral surfaces it without uncertainty band + caveat substring") + a tear-edge overlay — operationalizes PRD FR24. |
| Co-equal triplet | ✓ UX gives 4 numeric thresholds (±15% area, ±2px font-size, ±4px baseline, ≤100 weight delta) — operationalizes PRD FR18. Architecture adds a 5th (contrast ratio ±0.5). |
| Validity envelope honesty | ✓ UX commits to forbidding synthetic alt-text on matrix items — aligns with PRD NFR13 + FR10 visuospatial disclosure. |
| Tri-lingual measurement equivalence | ✓ UX commits stale-translation hatnote as *load-bearing trust signal in the design language*, not a CI artifact — operationalizes PRD FR34 + NFR27/NFR28. |
| Negative-space absences | ✓ UX enumerates the 3 absences as enforced negative space (no share UI / no certificate / no badge) — operationalizes PRD FR25. |
| Karolina-60s checklist | ✓ UX adds a 6-item one-glance pass/fail per methodology page (title+version+DOI+license / lede / cite-affordance / glossary by hover / stale-flag visibility / primary-source citation) — operationalizes PRD's citability vision. |
| Methodology-click hypothesis | ⚠ UX names the load-bearing hypothesis ("score-delivery generates methodology curiosity") and proposes operational thresholds with X/Y/Z "to be calibrated in pilot." The hypothesis is *named as falsifiable* — Epic 3 Story 3.8 (hallway test) provides a concrete early-validation path (≥3/5 voluntary clicks). The numeric thresholds remain deferred to pilot. Not a planning gap, but a known-deferred operational gate. |
| Aesthetic departure from prototype | ✓ UX commits "Quiet Document" direction; PRD `epicCandidates` already includes "Prototype Removal" (delete `iq-me.html` on day one). Aligned. |

**Net:** UX adds 10 PRD-compatible commitments (named in UX § "Notes on Framing"). No contradictions with PRD; UX is consistently a tightening of the PRD spec into operationally testable form.

### UX ↔ Architecture Alignment

The architecture document explicitly lists UX-Step coverage as the focus of Party Mode round 4 (Winston + John + Sally, 2026-05-18) and its Step 7 self-validation declares: *"all 25 UX components have file-tree locations."* Spot-check:

| UX Commitment | Architecture Support | Status |
|---|---|---|
| `iqme:reveal-stage` event with `{stage, t}` payload | Integration Points enumerate dispatcher (`src/assessment/reveal-stage.js`) and consumers (`src/assessment/result.js` + `src/css/components/score-panel.css [data-reveal-stage]`); `tests/playwright/reveal-stage.spec.mjs` enumerated | ✓ Covered |
| Anti-screenshot composition rule | `tests/playwright/cropping-fuzzer.spec.mjs` enumerated (~1,800 crops/scene/release); score-panel tear-edge CSS block | ✓ Covered |
| Co-equal triplet 4-threshold rule | Playwright computed-style assertion enumerated in `pr-checks.yml` job set; CSS-source lint authored at Epic 3 Story 3.5 | ✓ Covered |
| Beat vocabulary (8 named beats) | Architecture lists `iqme:reveal-stage` as load-bearing event; Epic 6 Story 6.1 expands the v1 stage enumeration to 5 stages, with the ADR (Story 3.1) committing to additive-only expansion. **Minor mismatch**: UX lists 8 beats (`landing / pre-reveal / anchor / band / interval / context / tail-scene / methodology-handoff`); Epics ADR enumerates 6 (`anchor / band / interval / context / tail-scene / methodology-handoff`) with `landing` and `pre-reveal` framed as prior states rather than reveal-event stages. Functionally equivalent (the `landing` and `pre-reveal` work happens before the reveal-stage event begins firing) but worth noting the labeling discrepancy. | ⚠ Minor labeling drift — semantically aligned |
| Karolina-60s checklist (6 one-glance items) | Masthead component (architecture's `templates/`); cite-this-page widget (Epic 4 Story 4.6); glossary affordance (Epic 4 Story 4.4 lint-glossary); stale-translation hatnote (Epic 4 Story 4.7); primary-source citation in masthead | ✓ Covered structurally; ⚠ no explicit "Karolina-60s manual review" gate enumerated in Epic 10.1's pre-launch checklist (UX Step 13 names it as a pre-launch manual review) |
| Faded-then-active link affordance pre-handoff | Architecture: `data-reveal-stage` driving CSS attribute selectors; reveal-stage.js dispatcher | ✓ Covered (mechanism); no story explicitly implements the disabled-link CSS state |
| Hairline-border family | Tokens (Story 1.10) define `--color-rule-divider`; component CSS files referenced | ✓ Covered |
| Masthead-first composition | Architecture's `templates/` directory hosts the masthead emission template; Epic 4 Story 4.6 implements | ✓ Covered |
| Keyboard-first affordance / `:focus-visible` | Architecture: `src/css/base.css (:focus-visible)`; tokens; `lint-no-outline-none` not enumerated but axe-core (NFR12) catches | ✓ Covered |
| 2 breakpoints only (`--bp-tablet`, `--bp-desktop`) | Story 1.10 ACs explicitly enumerate the two custom-media declarations | ✓ Covered |
| Container queries with `@media` fallback | Architecture states the substrate; PRD §Responsive Design confirms | ✓ Covered |
| Tail-scene asymmetry as compositionally distinct (not copy-key variants) | Architecture: separate `tail-scene-{bottom,mid,top}.css` files; modifier classes on score panel; Epic 6 Story 6.5 + 6.6 implement compositionally | ✓ Covered |
| Silent companion line | `silent-companion-line.css` enumerated; Story 6.5 + 7.6 implement | ✓ Covered |
| Locale-switch teachable hint (no modal) | `locale-switch-blocker-hint.css`; Story 7.2 implements | ✓ Covered |
| Skip-to-content link | UX Step 13 names it as "standard pattern" | ⚠ **Gap (minor): no story explicitly implements the skip-to-content link.** Likely safe to add to Story 6.4 (chrome-header) or Story 1.10 (base layout). |
| `role="status"` on stale-translation hatnote (UX Step 13) | Epic 4 Story 4.7 explicitly uses `role="note"` instead | ⚠ **Inconsistency: UX vs Epic spec divergence on ARIA role.** UX Success Test #7 asserts: *"banner renders with `role='status'` and a dated label"*; Epic 4 Story 4.7 AC: *"`role='note'` (not `role='alert'` — already lint-enforced)."* This is a real semantic difference — `role="status"` implies `aria-live="polite"` (politely announced on drift); `role="note"` is silent. The UX intent (drift is *visible* trust signal *announced by AT*) is served by `status`. Action: reconcile in implementation; recommend honoring UX (use `role="status"`). |
| Glossary by hover/tap (Karolina-60s item #4) | Architecture build envelope mentions "Glossary-link rewriter (tokenizer-aware) 150–220 LOC"; Epic 4 Story 4.4 enforces glossary existence | ⚠ **Gap (minor): no story explicitly implements a hover/tap tooltip UI for glossary terms.** The lint asserts terms exist in the glossary, but the per-page in-line glossary affordance UX described is not enumerated. Likely an inline `<a href="/glossary/#term">` is the minimum; a richer hover tooltip is implied by UX but not pinned. |
| Cite-this-page via `<details>` or `<dialog>` | Story 4.6 implements; UX Step 13 mentions "may use `<details>` instead" | ⚠ Implementation detail deferred; not a planning gap |
| No `alert`/`confirm`/`prompt`, no `<dialog open>` modals, no toasts | Architecture's `tools/lint-no-alert-confirm-prompt.mjs` + `lint-no-role-alert.mjs`; Epic 1 negative-assertion lint set | ✓ Covered |
| Print stylesheet for methodology corpus + assessment `@media print { display: none }` | UX Step 13 implementation guideline | ⚠ **Same gap as flagged in Epic Coverage (UX-DR35): no explicit story.** |
| Manual screen-reader pass (NVDA/VoiceOver/TalkBack) | UX Step 13 implementation guideline + NFR14 | ⚠ **Same gap as flagged in Epic Coverage (NFR14): not enumerated in Story 10.1's pre-launch checklist.** |
| Cross-browser smoke (Chrome + Firefox + WebKit) + Yandex manual | Architecture: `tests/playwright/cross-browser-smoke.spec.mjs` + `yandex-browser.spec.mjs`; Story 10.1 checklist | ✓ Covered |
| Color-blindness simulation pass pre-launch | UX Step 13 names it | ⚠ **Gap (minor): not enumerated in Story 10.1's pre-launch checklist.** |
| Per-locale design-tokens reference page (`/methodology/<lang>/reference/design-tokens/`) | UX Step 13 references it; PRD's Methodology Corpus Inventory does NOT enumerate this page (Reference quadrant lists 4 pages: glossary, citation, changelog, bibliography) | ⚠ **Cross-doc inconsistency.** UX names a design-tokens reference page; PRD's frozen 30-page corpus inventory does not include it. Either: (a) the design-tokens page is implicit under `/reference/` (a 5th Reference page not enumerated in PRD's 30-count), or (b) it lives outside the methodology corpus (e.g. in `docs/`), or (c) UX is over-committing. Action: clarify with the maintainer whether a 31st reference page is in scope or whether the page lives elsewhere. |
| Pattern library page (`/methodology/<lang>/reference/design-patterns/`) | Similar — UX names it; PRD inventory does not enumerate | ⚠ **Same cross-doc inconsistency as above.** UX commits to both a design-tokens reference page AND a design-patterns reference page; PRD's Reference quadrant is 4 pages. If both UX-named pages are intended, the corpus inventory is +2 pages = 32 pages × 3 locales = 96 authored pages, not the PRD's 30 × 3 = 90. |

### UX-only commitments worth noting (not in PRD)

- **EAP-shrinkage diagram** named as a v1 corpus artifact (UX Step 5 Opportunity #5). Epic 5 Story 5.7 treats this as ship-if-budget — explicit deferral path documented. Aligned (UX names it; Epic gives the v1-versus-v1.0.1 decision rule).
- **Tail-aware-trail component** as a 2-step curated reading path per page. Epic 5 Story 5.7 same posture.
- **Diátaxis + Narrative (5th bin)** for tail-scenes and museum-placard pages. PRD's 30-page inventory does not explicitly carve out a Narrative quadrant; the tail-scenes section (2 pages) maps to it implicitly. Consistent.
- **Honest-disappointment register** as the only feedback pattern; refused as a category: celebratory primary buttons, "Are you sure?" modals, retention patterns, error overlays. Architecture covers via negative-assertion lints; aligned.
- **Sober scientific-instrument aesthetic** (anti-reference: the prototype's warm-serif "paper" aesthetic). PRD MVP scope already commits to deletion of `iq-me.html` on day one.

### UX Alignment — Issues to Reconcile

**Actionable cross-document items (none of which block dev start; all are surfaced for execution-time reconciliation):**

1. **ARIA role for stale-translation hatnote: `role="status"` vs `role="note"`.** UX says `status`; Epic 4 Story 4.7 says `note`. Recommend honoring UX's intent (drift is announced) — update Epic 4 Story 4.7's AC to `role="status"`. Alternatively, add an explicit reconciliation note in the story file.
2. **Methodology corpus page count: 30 (PRD) vs ~32 (UX-implied).** UX names `/reference/design-tokens/` and `/reference/design-patterns/` as corpus-housed pages; PRD's Reference quadrant is 4 pages. Recommend deciding: (a) add the 2 pages to the corpus inventory (and re-stamp PRD §Methodology Corpus Inventory); (b) host them outside the corpus (in `docs/`); (c) drop them from v1.
3. **Karolina-60s manual review pre-launch gate.** UX names this as a pre-launch manual review per methodology page template per language. Not enumerated in Story 10.1's checklist. Recommend adding as an explicit checklist line.
4. **Skip-to-content link.** UX Step 13 names as standard pattern. Recommend adding to Story 6.4 (chrome) or Story 1.10 (base) AC.
5. **Glossary hover/tap tooltip affordance.** UX names but no story implements beyond glossary-link rewriting (whose UX is implicitly "link to glossary entry"). Recommend deciding at Epic 4: minimal (link only) or rich (hover popover). Pin in Story 4.4 AC or open as Story 5.x.
6. **Color-blindness simulation pre-launch.** UX names; add to Story 10.1 checklist.
7. **Beat-vocabulary labeling drift** (UX 8 beats vs Epic ADR 6 reveal-stage values). Semantically aligned; recommend a one-line note in `docs/adr/iqme-reveal-stage-event-contract.md` clarifying that `landing` and `pre-reveal` are SPA states preceding `iqme:reveal-stage` event-firing, not stages of the event.
8. **Methodology-click hypothesis numeric thresholds** (X% click within Y seconds, Z% articulate validity envelope unprompted). UX leaves X/Y/Z to pilot calibration; Story 3.8 hallway test gives early-validation ≥3/5 voluntary clicks. Recommend ratifying the Story 3.8 thresholds as the v1 operational gate so the hypothesis is mechanically falsifiable in CI/hallway, not deferred to Gate 9e.

None of items 1–8 block implementation start; all are *additive AC refinements* that should land during sprint execution rather than as a PRD/UX/Epic revision pass.

### Alignment Statistics

- **PRD ↔ UX:** UX is a strict-and-compatible operationalization of PRD; 10 named UX-only commitments are all PRD-strengthening, not PRD-contradicting.
- **UX ↔ Architecture:** Architecture's Party Mode round 4 explicitly stress-tested UX-component coverage; 25 UX components have file-tree homes; reveal-stage event + cropping fuzzer + co-equal triplet + masthead + stale-translation hatnote all architecturally landed.
- **UX ↔ Epics:** Epic-level coverage map (see prior step) covers 33/36 UX-DRs explicitly; 3 minor implicit gaps (skip-to-content, glossary affordance UI, print stylesheet) are non-blocking.
- **Cross-doc inconsistencies surfaced:** 2 substantive (ARIA role for stale-translation hatnote; corpus page count 30 vs ~32), 6 minor (additive AC refinements).

**Net UX assessment: alignment is HIGH.** UX is a maturely-iterated downstream of the PRD with explicit pass/fail capability tests; Architecture has stress-tested UX-component coverage; Epics carry the 25 UX components with named CSS files and story-level acceptance criteria. The 2 substantive cross-doc inconsistencies and 6 minor refinement items are surface-area-of-execution issues, not foundational planning gaps.

## Epic Quality Review

Applying BMad create-epics-and-stories best-practices standards to the 14 epics / 75 stories.

### 1. User Value Focus (per epic)

| Epic | Title | User-Centric Framing | Verdict |
|------|-------|----------------------|---------|
| 1 | Repo Trust Artifacts + CI Skeleton + Negative-Assertion Lints | "A skeptic (Tomáš journey) can clone the repository at its very first commit and see the full trust posture mechanically enforced…" | ✓ Defensible — framed for Tomáš (PRD Journey 4). Trust-infrastructure-as-UX is Innovation Pillar #2. |
| 2 | Auditable Scoring Engine + Golden Vectors | "A skeptic can read the entire IRT 2PL EAP implementation in ≤10 min, run the golden-vector parity tests locally in ≤5 min with only `node` installed…" | ✓ Defensible — framed for Tomáš. NFR26 verification-time-to-confidence is a first-class user property. |
| 3 | Vertical Slice — EN Happy-Path Score → Methodology Handoff + Contract Artifacts | "A tester can complete an English-language session end-to-end…" + Anna's aha-click | ✓ Strong — load-bearing UX hypothesis exercisable. |
| 4 | Methodology Corpus Build Pipeline + Versioned Citation Infrastructure | "A citer (Karolina) can resolve a stable versioned permalink, see a citation block…" | ✓ Strong — directly serves PRD Journey 5. |
| 5 | Methodology Visual System + Full English Methodology Corpus (30 Pages) | "An English reader can navigate the complete methodology corpus end-to-end at plain-language reading level…" | ✓ Strong — serves both Tomáš + Karolina. |
| 6 | Assessment SPA Hardening — Full Ceremony, Asymmetric Tail-Scenes, Anti-Credentialization | "A test-taker experiences the complete score-delivery ceremony…" (Anna, Mikhail, Daria) | ✓ Strong — Innovation Pillars #3 + #4. |
| 7 | RU + PL Localization + Per-Language Reviewer Discipline | "Russian- and Polish-speaking users can complete the full test in their language, read the full methodology corpus…" | ✓ Strong — serves PRD's primary underserved audience. |
| 8 | Trust-Verification Surface + Mirror Failover + Archival Permanence | "A skeptic verifies zero-third-party network trace in ≤30s via DevTools…" | ✓ Defensible — Tomáš + Russia-blocked-user (Risk #8) + Karolina (NFR18 archival permanence). |
| 9a | ICAR License Confirmation (Gate) | Single outreach gate; user = the existential-risk-resolution stakeholder (CEP + ICAR group) | ✓ Outreach-epic style; appropriate. |
| 9b | External Psychometrician Sign-off (Gate) | Single outreach gate; user = the auditable-claim verifier | ✓ Outreach-epic style. |
| 9c | RU Clinical-Register Translator (Gate) | Single outreach gate; user = Mikhail (RU bottom-decile harm-mitigation owner) | ✓ Outreach-epic style. |
| 9d | PL Clinical-Register Translator (Gate) | Same posture, PL; independent-failure-isolation per Mary | ✓ Outreach-epic style. |
| 9e | 12-of-15 Native-Speaker Tester Credibility (Gate) | Single outreach gate; users = the test cohort whose verdicts gate the launch | ✓ Outreach-epic style. |
| 10 | v1.0.0 Coordinated Release | Launch milestone; users = all of the above | ✓ Release-ceremony epic; appropriate. |

**Net user-value verdict:** No epic is a pure technical milestone with no user-facing framing. Epics 1, 2, and 8 are infrastructure-heavy; their narratives anchor in the Tomáš skeptic journey, which is explicitly named in PRD as a primary user. Under a strict BMad reading (epics must deliver user-facing capability), Epics 1+2+8 are borderline; under the project's specific Innovation Pillar #2 framing (trust infrastructure IS a UX surface), they are first-class. The project's PRD ratifies the latter framing; no defect.

### 2. Epic Independence (Epic N cannot depend on Epic N+1)

**Sequenced dev epics (1 → 8) — strict no-forward-dependency check:**

| Dependency line | Forward? | Verdict |
|---|---|---|
| Epic 1 Story 1.4 authors `corpus/manifest.schema.json` with `bankFrozen` field consumed in Epic 6 Story 6.6 | Schema slot, not feature dep | ✓ Forward-AWARENESS, not forward-DEPENDENCY — Story 1.4 completes standalone |
| Epic 1 Story 1.8 determinism harness used by Epic 2 Stories 2.6a/b | Backward (Epic 2 uses Epic 1) | ✓ |
| Epic 2 Story 2.7 emits warnings; Epic 4 Story 4.3 flips to `--strict` | Graduation; backward | ✓ Story 2.7 completes with warnings green; flag-flip is independent |
| Epic 3 Story 3.6 ships methodology stub pages; Epic 4 + 5 expand them in place | Backward extension; URLs stable | ✓ |
| Epic 4 Story 4.1 builds pipeline; Story 4.7 + Epic 5 Story 5.1 extend the pipeline (translation-in-progress stub emission) | Backward extension; pipeline composable | ⚠ Slightly awkward — Story 5.1 amends Story 4.1's pipeline. Recommend a one-line note in 5.1 making explicit that the build-pipeline `translationStatus: in-progress` handling is *added* in 5.1, not inherited. Not a forward dependency. |
| Epic 4 Story 4.7 ships `lint-translation-parity` as no-op stub; Epic 7 Story 7.5b graduates to full | Graduation; backward | ✓ |
| Epic 6 Story 6.5 EN tail-scene placeholders; Epic 7 Story 7.6 replaces with clinical-register copy | Backward replacement | ✓ EN placeholder is fully functional at Epic 6 close |
| Epic 6 Story 6.6 cropping fuzzer gated on `bankFrozen` flag (set at end-of-Epic-5) | Backward (Epic 5 unblocks Epic 6) | ✓ |
| Epic 8 Story 8.3 scheduled-mirror-parity-check; Story 8.4 mirror-deploy | Intra-epic; 8.3 self-gates if mirror unreachable | ✓ Self-gating documented in 8.3 AC |
| Outreach Epics 9a–9e all start at Epic 2 completion, run in parallel with Epics 3–8 | Parallel-track; explicitly independent | ✓ |
| Epic 10 fires only when Epics 1–8 merged AND gates 9a–9e closed | Strict backward dependency | ✓ |

**Net independence verdict:** No forward dependencies. The project's "graduation pattern" (lint shipped green-on-empty in early epic → graduates to strict in later epic) is internally consistent and BMAD-compatible. The minor pipeline-extension awkwardness at 4.1 ↔ 5.1 should be made explicit in the story files.

### 3. Story Sizing

| Pattern | Examples | Verdict |
|---|---|---|
| One vertical surface or pure-function module per story | 2.1–2.5, 3.2–3.7, 6.1–6.7 | ✓ Properly sized |
| Bundled content authoring (multiple methodology pages per story) | 5.3 (Constructs 4 + Limitations 3 = 7 pages), 5.4 (Scoring 4 + Norming 3 = 7 pages), 5.5 (Ethics 2 + Provenance 2 + Reference 3 = 7 pages) | ⚠ Borderline — 7 pages per story is large, but topical groupings + single per-language reviewer pass make this PR-sized. Acceptable. Could be split if execution proves friction-bound. |
| Two-substory split for clear failure-isolation | Stories 2.6a/2.6b (R-bridge smoke vs full vectors), 7.5a/7.5b (reading-level vs parity), 9a.1/9a.2 (outreach vs commit), 9d.1/9d.2 (outreach vs commit) | ✓ Deliberate splitting for accountability surface (per Mary) and debug-isolation (per Murat). |
| Story 5.7 deliberately ship-if-budget | EAP-shrinkage diagram + tail-aware-trail | ✓ Explicit deferral path codified; not a sizing issue. |
| Story 3.8 hallway test | 3-5 outside testers; documented `_evidence/` directory | ⚠ Recommend confirming `_evidence/` is committed to repo or gitignored — currently implicit. |

**Net sizing verdict:** Generally well-sized. The two minor concerns (bundled-page stories at 5.3-5.5; `_evidence/` directory convention) are not violations.

### 4. Acceptance Criteria Quality

Spot-check across 14 epics, 75 stories:

- ✓ **Given/When/Then format**: Universal — every story uses the BDD structure rigorously.
- ✓ **Testable / verifiable**: Most ACs name specific values (16 items, ±0.001 logits, FK ≤ 12, FCP < 1.5s, ≥12/15 testers, ±15% triplet area, 128-bit seed, etc.).
- ✓ **Specific outcomes**: ACs name file paths, function signatures, lint IDs, and CI job slots — implementation guidance is unambiguous.
- ✓ **Error / negative scenarios**: Many ACs include negative cases (e.g. "asserts no `localStorage.setItem` calls", "asserts no English-only stopwords appear in RU/PL", "fails the build on missing keys").
- ✓ **Linked to FRs/NFRs**: ACs cite specific FR/NFR numbers throughout — traceability is preserved at the story level, not just the epic level.

**Notable AC patterns worth highlighting:**

- **Mechanical-not-cultural enforcement.** Stories 1.6 + 4.3 + 7.5b graduate lints rather than rely on review discipline. The maintainer cannot override (branch protection) for non-EN content changes per Story 7.8.
- **Two-tier defense.** CSS-source-level lint (Story 3.5) graduates to Playwright runtime computed-style assertion (Story 6.1) — defense in depth.
- **Pinned tolerances over "feels paced".** Story 3.5 pins `t_handoff - t_anchor ≥ 400ms ± 50ms tolerance` (per Murat — "feels paced is unfalsifiable").
- **Visible-fallback discipline (per John).** Story 1.3 (ICAR slot pending PDF), Story 4.6 (DOI placeholder "pending v1.0.0 release"), Story 5.6 (`reviewer: "@TBD-…"`) — no silent nulls.
- **Self-gating where intra-epic ordering matters.** Story 8.3 mirror-parity-check skips parity-comparison if mirror unreachable — handles the case where 8.3 lands before 8.4.

### 5. Special Implementation Checks

- ✓ **Starter Template**: Architecture explicitly chose "no starter; hand-author"; Epic 1 Story 1.1 is the bootstrap. PRD `epicCandidates` includes "Prototype Removal (`git rm iq-me.html`)" — addressed implicitly via Story 1.1's clean-slate bootstrap.
- ✓ **Greenfield indicators**: Initial setup (1.1), license/citation/README (1.2), CI scaffold from day 1 (1.6), determinism harness for downstream (1.8), domain-boundary ESLint config (1.9), design system foundation (1.10) — all proper greenfield first-epic patterns.
- N/A **Database creation timing**: No database in this project (static site; in-memory session state; opt-in `localStorage`).

### 6. Best Practices Compliance — Per Epic

| Epic | User value | Independent | Story sizing | No forward deps | Clear ACs | FR traceability |
|------|------------|-------------|--------------|-----------------|-----------|-----------------|
| 1 | ⚠ Defensible (Tomáš) | ✓ | ✓ | ✓ | ✓ | ✓ FR25/41/42/43/45/48/50/51 |
| 2 | ⚠ Defensible (Tomáš) | ✓ | ✓ | ✓ | ✓ | ✓ FR14/15/16/17/44 |
| 3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ FR1/2/3/5/6/7/9/10/11/12/13/18/21/23/26/32 |
| 4 | ✓ | ✓ | ✓ | ⚠ 4.1↔5.1 extension | ✓ | ✓ FR28/29/30/33/34/35/43/48 |
| 5 | ✓ | ✓ | ⚠ Bundled (5.3/5.4/5.5) | ✓ | ✓ | ✓ FR32/36 |
| 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ FR4/18/19/20/22/24/25/26/27 |
| 7 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ FR8/19/20/31/37/38/39/40/49 |
| 8 | ⚠ Defensible (Tomáš + Karolina + Russia-blocked) | ✓ | ✓ | ✓ | ✓ | ✓ FR30/41/46/47/48/52/53 |
| 9a | ✓ Outreach | ✓ | ✓ | ✓ | ✓ | ✓ FR45 |
| 9b | ✓ Outreach | ✓ | ✓ | ✓ | ✓ | ✓ (process) |
| 9c | ✓ Outreach | ✓ | ✓ | ✓ | ✓ | ✓ FR19/20/40 |
| 9d | ✓ Outreach | ✓ | ✓ | ✓ | ✓ | ✓ FR19/20/40 |
| 9e | ✓ Outreach | ✓ | ✓ | ✓ | ✓ | ✓ (process) |
| 10 | ✓ Release | ✓ (terminal) | ✓ | ✓ | ✓ | ✓ (milestone) |

### 7. Quality Findings By Severity

#### 🔴 Critical Violations

**None.** No technical-only epics without user framing; no forward dependencies; no oversized stories that cannot be completed.

#### 🟠 Major Issues

**None.** The two borderline cases (Epics 1+2+8 framing; Story 5.3-5.5 bundling) are defensible under the project's explicit design philosophy and content-authoring pragmatics.

#### 🟡 Minor Concerns

1. **Epic 4 Story 4.1 ↔ Epic 5 Story 5.1 pipeline extension.** Story 5.1 amends Story 4.1's build pipeline (adds `translation-in-progress-stub` emission). Recommend a one-line clarification in Story 5.1's preamble: "extends the Story 4.1 pipeline to handle non-EN frontmatter with `translationStatus: in-progress`."
2. **Bundled methodology-page stories (5.3, 5.4, 5.5)** each carry 7 pages of authoring. Acceptable for content-authoring work; flagged for awareness only. If execution friction emerges, splitting is a one-PR per topical group is a clean refactor.
3. **Hallway-test `_evidence/` directory convention** (Story 3.8 + 5.2 + 6.5) — not currently named in the architecture's directory tree. Recommend deciding: (a) commit `_evidence/` as a first-class repo directory with an `_evidence/README.md` explaining its purpose, or (b) gitignore it and treat as ephemeral. Without a decision, contributors may not know whether evidence artifacts should land in PRs.
4. **Story 5.1's pipeline-extension awkwardness** (see #1) plus the implicit "Epic 4's pipeline gets extended later" theme could be made explicit in `docs/corpus-build-conventions.md` (a Story 1.4 deliverable) so the contributor sees the staged-extension intent.
5. **Story 10.1's pre-launch checklist** is dense but does not enumerate: (a) NFR14 / UX-DR34 three-platform manual screen-reader audit; (b) UX Step 13 color-blindness simulation pass; (c) Karolina-60s checklist manual review per methodology page per language. Recommend extending the checklist to enumerate these (the items are restated in NFRs / UX spec but a checklist item makes them explicit).
6. **UX vs Epic divergence on `role="status"` vs `role="note"`** for the stale-translation hatnote (flagged in prior step's UX Alignment section, repeated here for visibility — this is a *story AC change*, not a planning gap).

### 8. Remediation Recommendations

All concerns are *additive AC refinements* and explicit-clarification items that can land during sprint execution without disturbing the epic structure. Specifically:

- **No epic or story needs to be split, merged, removed, or restructured** based on this review.
- **Story 5.1's preamble** should explicitly state the Story 4.1 pipeline extension.
- **`docs/corpus-build-conventions.md`** (Story 1.4) should mention the staged-extension pattern (4.1 → 4.7 → 5.1 → 7.1 each add pipeline behavior).
- **`_evidence/` directory** should be decided and documented (likely first-class with `_evidence/README.md`).
- **Story 10.1's pre-launch checklist** should enumerate the three additional manual reviews (screen-reader, color-blindness, Karolina-60s).
- **Story 4.7 / 5.1** should update the stale-translation hatnote AC to `role="status"` per UX Step 13.

### Compliance Summary

| Standard | Pass / Concern / Violation |
|---|---|
| Epics deliver user value | ✓ Pass (with the Innovation #2 framing caveat for Epics 1+2+8) |
| Epic independence | ✓ Pass — no forward dependencies; graduation-pattern backward-only |
| Story sizing | ✓ Pass — appropriate for the work type |
| Acceptance criteria quality | ✓ Pass — Given/When/Then rigor; quantitative thresholds; FR/NFR traceability |
| No forward dependencies | ✓ Pass |
| Database tables created when needed | N/A (no database) |
| Starter template handling | ✓ Pass (no-starter chosen explicitly; bootstrap is Story 1.1) |
| Greenfield indicators | ✓ Pass — initial setup + dev env + CI from day 1 |

**Net Epic Quality verdict: HIGH.** The epic plan demonstrates rigorous BMad methodology: explicit user-journey anchoring per epic, named two-tier graduation patterns, deliberate two-substory splits for accountability/debug-isolation, mechanically-enforced invariants over cultural ones, visible-fallback discipline, and quantitative AC thresholds throughout. The 6 minor concerns are all execution-time refinements.

## Summary and Recommendations

### Overall Readiness Status

**READY for implementation.**

The PRD, Architecture, UX Specification, and Epic Breakdown form a maturely-iterated, internally-consistent planning bundle. Every PRD Functional Requirement is mapped to one or more epics with story-level acceptance criteria. The Architecture document's own Step 7 self-validation (4 Party Mode rounds, 7 expert perspectives) reached "READY FOR IMPLEMENTATION — Confidence Level: HIGH" independently of this assessment, and that conclusion holds under this external review.

### Coverage Summary

| Dimension | Metric | Status |
|---|---|---|
| PRD Functional Requirements covered by epics | 53 / 53 (100%) | ✓ |
| PRD Non-Functional Requirements covered by stories | 33 / 35 (~94%) | ✓ (2 minor implicit-only) |
| UX Design Requirements (epic-derived) covered | 33 / 36 (~92%) | ✓ (3 minor) |
| PRD open decisions | 0 (all 7 resolved by 2026-05-15) | ✓ |
| Pre-launch gates (PRD) → Epic landing | 5 / 5 (Epics 9a–9e) | ✓ |
| Innovation pillars architecturally supported | 7 / 7 | ✓ |
| Epic Quality — Critical Violations | 0 | ✓ |
| Epic Quality — Major Issues | 0 | ✓ |
| Epic Quality — Minor Concerns | 6 (all execution-time refinements) | ⚠ |
| Cross-document inconsistencies (UX vs Epic / PRD vs UX) | 2 substantive + 6 minor | ⚠ |

### Critical Issues Requiring Immediate Action

**None.**

There are no critical findings that block dev start. Every concern surfaced is an execution-time refinement that lands as a small AC addition or clarification during sprint work — none requires re-architecting, re-scoping, or revising the PRD.

### Substantive Items to Reconcile Before / During Execution

These two items are *substantive cross-document inconsistencies* that should be deliberately reconciled rather than discovered mid-implementation:

1. **Stale-translation hatnote ARIA role.** UX Step 13 specifies `role="status"` (politely announced to AT); Epic 4 Story 4.7 implements `role="note"` (silent). Semantically different. Recommend honoring UX — update Story 4.7 AC to `role="status"`. (Affects: NFR12, UX Success Test #7, FR34.)
2. **Methodology corpus page count: 30 (PRD) vs ~32 (UX-implied).** UX names `/reference/design-tokens/` and `/reference/design-patterns/` as corpus-housed pages; PRD's Methodology Corpus Inventory is frozen at 30 pages × 3 locales. Decide: (a) extend the corpus inventory to 32 pages (PRD revision), (b) host these pages outside the corpus (e.g. under `docs/`), or (c) drop them from v1 scope.

### Minor Execution-Time Refinements (non-blocking)

Surface these in sprint planning as additive AC items; they should not require PRD/Architecture/UX revisions:

3. **NFR14 + UX-DR34**: Manual screen-reader audit (NVDA+Firefox / VoiceOver+Safari / TalkBack+Chrome) — add as enumerated line in Story 10.1 pre-launch checklist.
4. **NFR20**: Graceful localized JS-error fallback page — add explicit AC under Story 6.5 or new mini-story in Epic 6.
5. **UX-DR35**: Print stylesheet for methodology corpus + `@media print { display: none }` on assessment — add to Story 5.1 or Story 8.5.
6. **UX skip-to-content link** — add to Story 1.10 (base) or Story 6.4 (chrome-header).
7. **Glossary hover/tap affordance** — decide minimal-vs-rich at Epic 4 Story 4.4 and pin AC.
8. **Color-blindness simulation pre-launch** — add to Story 10.1 checklist.
9. **Beat-vocabulary labeling clarification** — add one-line note in `docs/adr/iqme-reveal-stage-event-contract.md` (Story 3.1) clarifying that UX's `landing` and `pre-reveal` are SPA states preceding the first `iqme:reveal-stage` event dispatch.
10. **`_evidence/` directory convention** — decide whether `_evidence/` (used by Stories 3.8, 5.2, 6.5) is first-class repo-committed or gitignored; document in `docs/corpus-build-conventions.md`.
11. **Story 5.1 ↔ Story 4.1 pipeline extension** — add a one-line preamble in Story 5.1 stating the Story 4.1 build pipeline is extended (not just consumed).
12. **Story 10.1 pre-launch checklist** — add enumerated lines for: Karolina-60s manual review per methodology page per language; screen-reader audit; color-blindness simulation.
13. **Methodology-click hypothesis numeric thresholds (X/Y/Z)** — UX defers to "pilot calibration"; Story 3.8 hallway test (≥3/5 voluntary clicks) is a concrete v1 operational gate. Recommend ratifying 3.8's thresholds as the v1 mechanical falsifiability test.

### Recommended Next Steps

1. **Reconcile the two substantive cross-doc inconsistencies (items 1 and 2)** with the maintainer before Epic 4 / Epic 5 begin authoring. Items 3-13 can be reconciled in-sprint as AC refinements without blocking.
2. **Begin Epic 1 (Repo Trust Artifacts + CI Skeleton + Negative-Assertion Lints).** All prerequisites are in place; Architecture's Bootstrap Sequence is concrete; 10 Epic-1 stories are story-ready.
3. **Initiate parallel outreach for Gate Epics 9a–9e at Epic 2 completion** (scoring spec frozen). The external-human-gate clocks are the binding launch constraint, not code-complete. ICAR / SAPA outreach in particular has unbounded latency (Risk #1, existential — Epic 9a).
4. **Maintain the no-enshittification posture from day 1.** Every commit lands with the full negative-assertion lint suite green (Story 1.6). Any drift on the trust premise is a launch-blocker, not a polish issue.
5. **Plan for the 1–2 week buffer after Epic 9b** (external psychometrician sign-off) — Murat's 30-50% probability of methodology corpus revisions is a real schedule item.
6. **Capture this readiness report as a verifiable artifact.** Cite from Epic 1 Story 1.2's README (alongside ICAR confirmation, methodology corpus, etc.) so future contributors can see the project's planning rigor.

### Final Note

This assessment identified **0 critical, 0 major, 6 minor + 2 substantive cross-doc** issues across 5 categories (PRD completeness, Epic coverage, NFR coverage, UX alignment, Epic quality). Every issue is an execution-time refinement. **No issues block implementation start.**

The planning bundle is among the most rigorous I have seen for a solo-developer non-commercial OSS project — comparable to enterprise specs with the discipline reframed for solo-dev cognitive-load. The combination of Party-Mode stress-testing (4 rounds for Architecture, 2 each for PRD / UX / Epics), explicit graduation patterns (warn → strict; stub → full coverage), visible-fallback discipline, and mechanically-enforced invariants gives the project a defensible "ready" verdict that is itself auditable.

Address the two substantive cross-doc items (ARIA role + corpus page count) before Epic 4 begins; everything else lands during sprint execution. Epic 1 is unblocked.

---

**Assessment Date:** 2026-05-18
**Assessor:** Implementation Readiness Workflow (bmad-check-implementation-readiness)
**Predecessor Report:** [implementation-readiness-report-2026-05-15.md](../planning-artifacts/implementation-readiness-report-2026-05-15.md)
**Files assessed:**
- [prd.md](../prd.md) (956 lines, status `complete`, 2026-05-15)
- [architecture.md](../architecture.md) (1,485 lines, status `complete`, 2026-05-18)
- [ux-design-specification.md](../ux-design-specification.md) (2,015 lines, status `complete`, 2026-05-15)
- [epics.md](../epics.md) (2,448 lines, status `complete`, 2026-05-18; 14 epics, 75 stories)
