---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: 'complete'
completedAt: '2026-05-14'
releaseMode: 'single-release'
mvpPhilosophy: 'experience-mvp'
inputDocuments:
  - '{output_folder}/planning-artifacts/product-brief-IQ-ME.md'
  - '{output_folder}/planning-artifacts/product-brief-IQ-ME-distillate.md'
workflowType: 'prd'
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: 'web_app + content-product + experience-product'
  domain: 'psychometric_assessment (scientific + content-licensed + ethics-bound)'
  complexity: 'high'
  projectContext: 'greenfield'
  rationale: |
    Reclassified after Party Mode (Mary, John, Winston, Murat in round 1; Sally,
    Amelia, Paige in round 2). The bare "web_app + scientific + medium-high"
    framing under-weighted: (a) the methodology corpus as a first-class
    citable artifact, (b) the score-delivery moment as a ceremonial interaction
    not a feature, (c) IRT scoring math + tri-lingual psychometric equivalence
    + 5 external human-gate dependencies as combined complexity drivers, and
    (d) ICAR content-licensing obligations as a domain-level constraint.
partyModeRounds:
  - round: 1
    participants: [Mary, John, Winston, Murat]
    focus: 'classification stress-test'
  - round: 2
    participants: [Sally, Amelia, Paige]
    focus: 'score-delivery UX, IRT-in-vanilla-JS reality, methodology-corpus governance'
carryForwardRegister:
  # Candidate epics / NFRs / decisions surfaced by Party Mode. Feed these
  # into the appropriate downstream PRD steps (vision, NFRs, epics, stories).
  epicCandidates:
    - 'Epic 0: Scoring Spec Freeze (gate; precedes all scoring stories)'
    - 'Epic: Pre-test Consent Scene (3 languages, equal emotional weight)'
    - 'Epic: Score-delivery Ceremony (bottom-decile, mid-band, top-decile scenes, sequenced reveal)'
    - 'Epic: Methodology Corpus (CommonMark + frontmatter, EN source-of-truth, RU/PL conformant translations)'
    - 'Epic: Scoring Engine (pure DOM-free module; IRT 2PL EAP; ~250 LOC; golden vectors vs R mirt)'
    - 'Epic: Validity Envelope Documentation (who the instrument is and is not valid for, surfaced in consent)'
    - 'Epic: Prototype Removal (git rm iq-me.html on day one of new architecture)'
  nfrCandidates:
    - 'Zero telemetry is also a testability constraint — name it explicitly, including for internal QA'
    - 'Scoring engine: pure module, deterministic, no DOM, published test vectors, ±0.001 logits tolerance'
    - 'Runtime zero-build (browser loads source directly); dev tooling permitted via `make` targets, must not modify shipped files'
    - 'Methodology-claims manifest: scoring engine declares dependencies; CI lint blocks PRs on parity drift'
    - 'Translation parity: block-level content keys, EN source hash per RU/PL entry, named reviewer-of-record per language per version'
    - 'License-provenance test (compliance-as-code): every shipped item traces to ICAR attribution; LICENSES.md unmodified'
    - 'Reading-level discipline per language (Flesch-Kincaid EN, Oborneva RU, Pisarek/Jasnopis PL); glossary-first writing; no-idioms style guide'
    - 'DOI per release via Zenodo + CITATION.cff; Internet Archive + Software Heritage mirroring of methodology corpus'
    - 'Russia hosting contingency: mirror strategy (Codeberg / Cloudflare Pages / IPFS) as NFR, not post-launch surprise; relative asset paths from v1'
    - 'Pre-launch gate dependency graph as PRD artifact (ICAR confirmation, psychometrician sign-off, RU/PL native-speaker review, scoring spec freeze, 5×3 testers)'
    - 'Bottom-decile harm-mitigation review gate per language by native-clinical-register translator; no English-only crisis resources'
  openDecisions:
    - 'CTT vs IRT-EAP for v1 — party recommended IRT 2PL EAP; lock before epic-definition step'
    - 'Item delivery: fixed-form vs randomized order (drives PRNG fairness NFR)'
    - 'Bail-out mid-session: partial score? save-and-resume? discard? (interacts with localStorage-opt-in)'
    - 'Share/screenshot policy: no share button vs uncertainty-baked-in shareable image'
    - 'Retake cooldown: soft-block, hard-block, or show prior result (test-retest validity)'
    - 'Locale-switch mid-session: block or allow (measurement invariance)'
    - 'Russia mirror: single-origin v1 vs mirror-ready v1 (cost is now-vs-later)'
  scopeAdjustments:
    - 'Methodology corpus elevated to first-class artifact (not /docs); methodology page == falsifiability surface'
    - 'Accessibility re-framed: declare validity envelope honestly; visual a11y is table-stakes but NOT measurement-invariance for matrix items'
    - 'Score-delivery moment treated as a ceremonial scene with named owner + per-language clinical translator sign-off'
---

# Product Requirements Document - IQ-ME

**Author:** CEP
**Date:** 2026-05-14

## Executive Summary

IQ-ME is a free, open-source, ad-free, zero-telemetry web app delivering a fluid-reasoning (Gf) percentile and IQ-scale equivalent in English, Russian, and Polish, built on the ICAR Matrix Reasoning instrument — a peer-reviewed, IRT-calibrated, publicly licensed item pool. Every claim it makes is externally checkable: citations linked, source on GitHub, scoring as open code, uncertainty rendered as a primary visual asset rather than a footnote.

The product targets **Russian- and Polish-speaking curious adults** as its primary audience — a population the existing free-IQ-test market has structurally failed, currently choosing between translated paywall funnels (123test, Brain Metrics, FreeIQTest) and the lone honest competitor (Mensa Norway, EN/NO only, matrices-only, no methodology page). Secondary audiences include English-speaking skeptics of online IQ tests and educators or students of psychometrics, for whom the methodology corpus doubles as a plain-language primer.

The problem is not "no free IQ tests exist" — it is that **trustworthy free IQ tests with citations, no signup, and no ads do not exist outside English-speaking Norway**. The Reddit-consensus reflex *"all online IQ tests are bullshit except Mensa Norway"* names the gap. IQ-ME closes it for Slavic-language audiences and extends the genre with a methodology corpus citable to peer-reviewed sources.

The product ships as a single static site on GitHub Pages with a deliberate runtime-zero-build posture (browser loads source directly), zero analytics, and localStorage opt-in only. The personal north-star definition of success — explicit and non-commercial — is *shipping a real, honest cognitive-screening tool*; commercial metrics are out of scope by design.

### What Makes This Special

IQ-ME's differentiator is **trust through transparency** — a structural posture that funded incumbents cannot replicate without destroying their own business models. Three load-bearing pillars carry that posture:

- **Auditable claims end-to-end.** The scoring engine is a pure DOM-free module with published test vectors validated against the R `mirt` reference implementation to ±0.001 logits. The item pool is the publicly released ICAR Matrix Reasoning set with item parameters traceable to Condon & Revelle (2014). The methodology corpus declares, in machine-checkable form, the claims the scoring engine must satisfy — a CI lint blocks PRs on drift between code and methodology. There is no "trust us" surface.
- **The score-delivery moment is a designed ceremony, not a feature.** The result page is treated as a ritual with stakes — closer to a pregnancy-test result screen or a genetic-results portal than a web-app sub-route. Percentile and IQ-scale equivalent are rendered side-by-side with a visually co-equal uncertainty band; the reveal is sequenced; the bottom-decile, mid-band, and top-decile scenes are each designed and reviewed for harm (distress at the low end, status-signalling and item-leakage at the high end). Per-language clinical-register translators sign off on the result-page copy before launch.
- **The methodology corpus is a co-product, not docs.** A versioned, citable plain-language psychometrics primer in EN/RU/PL with stable permalinks, block-level content keys enforcing translation parity in CI, and a Zenodo DOI per release. In the 2–3 year horizon it is plausible the methodology corpus is more discoverable than the test itself — citable from Wikipedia, course syllabi, and Reddit explainers. Treated as the falsifiability surface of the entire project.

The core insight powering all three pillars: **honesty is the unfair advantage incumbents structurally cannot copy.** An ad-funded paywall site cannot ship "no telemetry, no signup, source on GitHub, citations on every claim" without burning its own funnel. The project's non-commercial, MIT-licensed, no-exit posture is itself the moat. Forks can strip caveats, but the canonical site preserves them — and the audience that seeks IQ-ME is the audience that checks.

A retest produces a different randomized subset of items from the same calibrated pool. Anti-leakage is acknowledged as architecturally unsolvable on a static site (items are in the client bundle) and addressed honestly — randomization, image-augmentation, and disclosure — rather than via security theatre.

## Project Classification

- **Project Type:** hybrid `web_app + content-product + experience-product` — three distinct artifacts under one repo: the interactive assessment app (stateful, scoring-coupled), the methodology corpus (versioned content publication with independent citation lifecycle), and the ceremonial score-delivery surface (designed and reviewed as a scene, not iterated as a feature).
- **Domain:** `psychometric_assessment` — primary tag — with three load-bearing sub-domains the bare "scientific" framing hides: *content-licensed instrument redistribution* (ICAR CC-BY-NC-SA constraints propagate to repo licensing, item handling, and methodology pages), *cross-cultural measurement equivalence* (EN/RU/PL is not localization; it is psychometric re-validation territory requiring named per-language reviewers), and *ethics-bound result delivery* (informed-consent-style framing, harm mitigation at the tails, no diagnostic claims).
- **Complexity:** **high**. Drivers: hand-rolled IRT 2PL EAP scoring in vanilla browser JS validated to ±0.001 logits against R `mirt`; tri-lingual psychometric equivalence with measurement-invariance implications per item translation; five external human gates on the critical path with no SLA (ICAR license confirmation, external psychometrician sign-off, RU/PL native-speaker review, scoring spec freeze, 5×3 end-to-end testers); anti-leakage as an architectural posture rather than a solvable feature; Russia GitHub Pages access risk forcing mirror-readiness decisions. Build complexity is low; coordination and validity complexity are high.
- **Project Context:** greenfield. The 310-line `iq-me.html` prototype is reference-only and explicitly to be superseded — its serif "paper" aesthetic, naive linear scoring (`iq = round(70 + (p*0.4 + v*0.3 + m*0.3) * 75)`), hardcoded 12-item structure, and lack of i18n / methodology / uncertainty discipline are all in-scope for replacement, not iteration.

## Success Criteria

### User Success

A user succeeds with IQ-ME when, in a single uninterrupted session in their native language (EN/RU/PL), they:

1. **Complete the full test from landing to result without encountering a paywall, signup prompt, ad, or telemetry consent dialog** — measurable as a network-trace check (zero third-party requests; only same-origin GET requests to static assets).
2. **See a result they can interrogate** — the result page renders the percentile and IQ-scale equivalent side-by-side, a co-equal uncertainty band, a qualitative band label, a per-item-type breakdown, and inline non-dismissible caveats above the score. The user can follow a one-click link from any displayed number to the methodology page that defines it.
3. **Report the experience as credible** — the launch-gate metric, lifted from the brief: ≥4 of 5 native-speaker testers per language (12 of 15 overall) report on the GitHub Discussions thread that the test felt honest and the result felt credible, with no participant flagging the result-page copy as harmful or culturally off in any of the three languages.
4. **At the result tails, encounter a designed scene rather than a number.** Bottom-decile testers (P ≤ 25) report the score was delivered with care, the uncertainty band was visible, and at least one path forward existed in their language that was not an English-only link. Top-decile testers (P ≥ 90) report the result did not feel like a credential to screenshot and share without context.

**The "aha" moment for IQ-ME is not the score itself — it is the user clicking from the score to the methodology page and reading, in their own language, the plain-language explanation of what the score does and does not mean.** That click is the conversion event for trust-through-transparency, and the methodology page must reward it.

### Business Success

IQ-ME is explicitly non-commercial; "business success" is reframed here as **project success**. There is no revenue, no funding, no acquisition path by design. The relevant metrics are reputation, adoption-by-community-of-practice, and sustainability:

1. **Launch gate met within target window** — v1 ships with all five pre-launch gates closed (ICAR license confirmation in writing, external psychometrician sign-off, RU/PL native-speaker reviews, scoring spec frozen, 12/15 tester credibility threshold).
2. **Reflexive-recommendation threshold in 12 months** — IQ-ME appears as a top-3 recommendation in at least three independent threads on r/cognitiveTesting, r/Mensa, or comparable native-language communities (Pikabu, Habr, Wykop, Polish-language Reddit equivalents) responding to "is there a real free IQ test?" — without solicitation by the maintainer.
3. **Methodology corpus citability proven in 24 months** — at least one Wikipedia external-links section, one academic course syllabus, or one peer-reviewed paper cites the methodology corpus via its versioned permalink or Zenodo DOI. This is the falsifiability-surface vision becoming load-bearing externally.
4. **Repository health, not user count** — sustained GitHub presence measured by: stars (a vanity metric but a real signal in this community; target ≥500 in 12 months as a directional indicator, not a gate), forks (≥10 in 12 months), translation pull-requests from community (≥1 new locale or 1 substantive RU/PL improvement PR in 12 months), and no abandoned-project signals (issues responded to within 14 days; security advisories addressed within 7).
5. **No-enshittification proof** — at every audit point (month 6, 12, 24), the live site continues to ship: zero analytics requests on the wire, zero third-party fetches, no signup wall, source matching `main` branch, LICENSES.md unmodified from launch. The structural posture survives.

Note: User-volume metrics ("10k users") are **explicitly out of scope** as success criteria. We have no telemetry; we cannot count users; counting users contradicts the trust premise. Adoption is inferred from community-recommendation signals and inbound PRs, never measured.

### Technical Success

Technical success means **the auditable claims are actually auditable and continue to be**. These are NFR-style success gates, several already named in the Party Mode carry-forward register:

1. **Scoring engine accuracy** — JS implementation of IRT 2PL EAP agrees with R `mirt::fscores(method="EAP")` reference output to within ±0.001 logits on the committed golden vector set (≥1,000 simulated response patterns). CI-enforced; PRs fail red on regression.
2. **Methodology-claims manifest parity** — the CI lint blocks any PR where the scoring engine's declared claims (`METHODOLOGY_CLAIMS` manifest) diverge from the methodology corpus's asserted values. No code-vs-doc drift can land.
3. **Translation parity** — for every block-level content key, all three language files are present and the RU/PL files carry the current EN source hash. Stale-translation banner renders automatically on drift. CI-enforced.
4. **License provenance** — every shipped item file traces to its ICAR attribution; LICENSES.md is unmodified from launch; license-provenance test passes in CI.
5. **Runtime zero-build invariant** — production deployment contains no compiled, bundled, or minified artifacts. Browser loads source files directly. CI verifies the deployed tree matches the source tree byte-for-byte (modulo stripped editor metadata).
6. **Zero-telemetry invariant** — automated test (Playwright or equivalent) loads the full app, completes a test session, and asserts the recorded network trace contains only same-origin GET requests to static assets. No analytics, no fonts from CDNs, no third-party fetches. Run in CI.
7. **Performance budget** — first contentful paint < 1.5s on a mid-tier Android device over 3G; full test session memory stays below 50MB; works on browsers ≥2 years old. Measured via Lighthouse-in-CI.
8. **Accessibility baseline** — WCAG 2.2 AA where psychometrically valid; documented validity envelope where it is not (matrix items are visuospatial; the consent scene declares this honestly). Keyboard navigation, focus management, and color-contrast pass automated checks.
9. **Reading-level discipline** — each methodology page passes the language-appropriate plain-language metric (Flesch-Kincaid grade ≤ 12 EN; Oborneva-equivalent RU; Jasnopis equivalent PL). CI-enforced.
10. **Archival redundancy** — every tagged release auto-mirrored to Internet Archive and Software Heritage; CITATION.cff present; Zenodo DOI minted per release.

### Measurable Outcomes

Compact gate summary — these are the binary or threshold metrics that decide "did v1 succeed":

| # | Outcome | Threshold | When | How measured |
|---|---|---|---|---|
| 1 | All 5 pre-launch gates closed | 5/5 | Pre-launch | Manual sign-off documented in repo |
| 2 | Tester credibility threshold | ≥12/15 testers report credible | Pre-launch | GitHub Discussions thread |
| 3 | Zero third-party network requests in live test | 0 | Pre-launch + ongoing | Playwright/CI trace |
| 4 | Scoring engine ±0.001 logits vs `mirt` | 100% of golden vectors | Pre-launch + every PR | `node --test` in CI |
| 5 | All three languages parity-linter green | green | Pre-launch + every PR | CI lint |
| 6 | Community recommendation surfaces | ≥3 unsolicited "top-3" mentions | T+12mo | Manual scan of named forums |
| 7 | External citation of methodology | ≥1 Wikipedia/syllabus/paper | T+24mo | Manual + Zenodo DOI tracking |
| 8 | No-enshittification audit | 100% pass | T+6, T+12, T+24mo | Documented re-audit |

## Product Scope

### MVP — Minimum Viable Product

The v1 launch scope, drawn from the frozen brief and extended with the Party Mode reclassifications. Anything not in this list is **out**.

- **One test:** ICAR Matrix Reasoning, restricted to the published IRT-calibrated item set. Randomization draws subsets from the calibrated pool.
- **Three full localizations:** EN (source-of-truth), RU, PL — UI, instructions, methodology corpus, result-page copy, glossary, citation widget. RU/PL conformant translations with named reviewer-of-record per language per version.
- **Scoring engine:** IRT 2PL EAP, pure DOM-free module, ~250 LOC, validated against R `mirt` golden vectors to ±0.001 logits, deterministic, no DOM imports.
- **Result page (the ceremony):** percentile + IQ-scale side-by-side and co-equal in visual weight with the uncertainty band; sequenced reveal; per-item-type breakdown; inline non-dismissible caveats above the score; distress-aware framing per language with native-language resource links (no English-only crisis fallbacks).
- **Methodology corpus:** explanation + reference quadrants (Diátaxis); constructs, scoring, norming, ethics, glossary, changelog, citation pages in all three languages; CommonMark + frontmatter; block-level content keys; stable permalinks; auto-mirror to Internet Archive and Software Heritage; Zenodo DOI on first release.
- **Pre-test consent scene:** in three languages with equal emotional weight; states the validity envelope ("this instrument is valid for these conditions and not these"); Continue / Not today path.
- **Responsive design** — phone, tablet, desktop.
- **Dark mode** — toggleable, respects `prefers-color-scheme`.
- **Modern visual design** — explicit departure from the prototype's warm-serif aesthetic.
- **Zero telemetry, zero analytics, zero third-party fetches, no signup, no upsell.** localStorage opt-in only, for language preference and (optionally) result save.
- **Licensing artifacts:** `LICENSES.md` (app MIT; items per ICAR upstream); `CITATION.cff`; written ICAR license confirmation committed to repo.
- **Feedback channel:** GitHub Discussions enabled.
- **Deployment posture:** GitHub Pages canonical; relative asset paths throughout; mirror-readiness designed in (Codeberg or Cloudflare Pages as a same-day failover target if Russia access degrades).
- **CI pipeline:** scoring golden-vector tests, methodology-claims manifest parity lint, translation parity lint, license-provenance test, reading-level lint, zero-network-trace test, Lighthouse perf budget.
- **Prototype removal:** `iq-me.html` deleted from the repo on day one of the new architecture; commit message names the rationale to deter resurrection.

### Growth Features (Post-MVP)

Ranked by likely sequence in the v1.x → v2 horizon:

- **Additional ICAR subtests** — Letter & Number Series (v1.1; language-light), 3D Rotation (v1.1; visuospatial). Each adds calibrated items to the random-draw pool and reduces leakage exposure per session.
- **Hagen Matrices Test (HMT-S)** — once the precise reuse-and-image license is documented in writing (currently blocked; not a v1.x gate).
- **Adaptive testing via IRT item-information functions** — v2; reduces session time at the tails without sacrificing precision; requires significant additional scoring-engine work and re-validation.
- **Additional languages** — community-PR-driven; each new locale must pass the same reviewer-of-record per-language discipline as RU/PL. German and Czech are plausible early candidates given community overlap.
- **Extracted scoring-engine library** (`@iq-me/psychometrics` or equivalent) — pure-JS reusable module, published with the same golden-vector tests; serves the broader open-psychometrics ecosystem.
- **Result export for audit** — user opts in to download their full response vector + scoring trace as JSON; an external auditor can reproduce the score independently. Strengthens the "auditable claims" pillar.
- **Glossary as a standalone publication** — per Party Mode round 2, the glossary is already a publication asset within the methodology corpus; a standalone "psychometrics terms in EN/RU/PL" page citable from Wikipedia is a small extra step that may exceed the test in citation value.

### Vision (Future)

In the 2–3 year horizon, IQ-ME is the reflexive answer in "is there a real free IQ test?" threads across Reddit, native-language Slavic communities, and Hacker News-adjacent technical forums. It is mentioned alongside Mensa Norway and increasingly cited as the multilingual, methodology-cited extension of that recommendation.

The methodology corpus has become a standalone plain-language psychometrics primer in EN/RU/PL, cited from Wikipedia external-links sections, university psychology and individual-differences course syllabi, and Reddit r/cognitiveTesting wiki pages. Some citers reach the corpus and never run the test — that is success, not failure.

The scoring engine has been extracted as a small reusable open library, used by at least one adjacent open-psychometric project. The repository serves as a reference implementation of an honest cognitive web tool for the broader humane-software community — cited as the worked example of "ad-free, telemetry-free, citation-backed claims" in conference talks and writeups on non-extractive software.

The project remains forever free, forever ad-free, forever non-commercial. The no-enshittification audit continues to pass. The structural posture survives funding attempts and acquisition offers because there is nothing to acquire — there is no entity, no LLC, no exit. **That permanence is the point.**

## User Journeys

### Journey 1 — Anna, the Underserved Primary User (Happy Path, Mid-Band)

**Opening Scene.** Anna is 29, lives in Kraków, works as a junior accountant. She is multilingual but reads most fluently in Polish. A friend in a Discord server about books mentioned "there's apparently a real free IQ test now — not the scam ones." Anna is skeptical but curious; she once tried 123test.pl and bailed at the paywall. She opens IQ-ME on her laptop in the evening with a glass of wine, expecting another waste of time.

**Rising Action.** The landing page renders instantly. Polish UI, no popup, no consent dialog, no cookie banner. She reads two short paragraphs explaining what IQ-ME is (a fluid-reasoning screener) and is not (a clinical assessment, a placement test, a credential). A "Continue / Not today" gate confirms she has read the validity envelope: this test is visual, takes ~25 minutes, and her result may not match what she expects. She clicks Continue.

The test itself is sober and uncluttered: one matrix item per screen, a progress indicator, clear keyboard navigation, no aggressive timers. She works through 16 items. The Polish instructions feel native, not translated — she does not notice them, which is the highest praise translation work can earn.

**Climax.** After the last item, a "Your result is ready" beat — not the score yet. *"Your result is a single number with a range around it. It's a screening estimate, not a verdict. Show me / Not yet."* She clicks Show me. Percentile 58, IQ-scale 103, uncertainty band ±9 — all three numbers rendered side-by-side in equal weight. Below: a "what does this mean" block, a per-item breakdown showing which matrix types she handled best, and three clearly-labeled links: *Methodology / Limits of this estimate / Cite this result.*

She clicks the methodology link out of curiosity, lands on a Polish-language plain-language page titled *"Co właściwie mierzy ten test"* (What this test actually measures). She reads for four minutes. She does not feel insulted. She does not feel flattered. She feels — for the first time on this kind of site — *informed.*

**Resolution.** Anna closes the tab. The next day she mentions the site in the Discord, attaches the link, and writes: "It's not a scam. The math is shown. I learned something." That sentence is the conversion event. Three Discord-server members visit the site over the following week. None of them are counted. There is no telemetry.

**Capabilities revealed:**
- Static landing with no preconditions (no consent dialog, no cookie banner, no analytics gate)
- Pre-test consent scene with validity-envelope statement, per-language
- Test runner: one item per view, keyboard-navigable, progress indicator, no time pressure
- Pre-reveal "are you ready" beat between final item and score render
- Result page: side-by-side equal-weight rendering of percentile + IQ + uncertainty
- Per-item-type breakdown
- One-click links from result page to (a) methodology corpus, (b) limits page, (c) citation widget
- Fully-localized methodology corpus discoverable as the natural next step

### Journey 2 — Mikhail, the Bottom-Decile Tester (The Hardest Scene to Get Right)

**Opening Scene.** Mikhail is 16, in Yekaterinburg. He found IQ-ME on a Russian-language Telegram channel about science. He has been told his whole life he is the smart one. He is not having a good week — there is a math test he is dreading, his parents are arguing, and he has been told that "smart" is the one identity that is his. He starts the test at 11pm in his bedroom.

**Rising Action.** The consent scene renders in Russian. *"Ты собираешься пройти тест на ~25 минут. Твой результат может оказаться неожиданным. Это оценка одной узкой способности — не приговор о тебе. Продолжить / Не сегодня."* He notices the "Не сегодня" option and feels mildly seen — most sites do not give him an out. He clicks Продолжить anyway.

The matrices get progressively harder. He gets the first six right. He gets the next ten wrong. He suspects he is bombing. He considers closing the tab; the mid-session bail-out path is visible (a small "Закончить раньше времени" button) — if clicked, it explains that an incomplete test cannot produce a meaningful score and offers Continue / Discard. He hesitates and continues to the end.

**Climax.** Pre-reveal beat: *"Твой результат готов. Это одна оценка с границами неопределённости. Показать / Не сейчас."* He pauses. He clicks Показать.

Percentile 12. IQ-scale 82. Uncertainty band ±8. The numbers render with deliberate visual restraint — no large fonts, no color drama. **The uncertainty band is rendered as visually equal to the number itself**, so he sees not "82" but "82 (range 74–90)" as a single visual unit. Below the score, *before* the methodology link, sits the bottom-decile scene — copy written and reviewed by a Russian-clinical-register native speaker, not translated from English:

> *"Этот результат может казаться плохим. Несколько вещей, которые стоит знать прямо сейчас, в этом порядке: (1) одна цифра не описывает тебя; (2) этот тест измеряет одно узкое умение — то, как ты справляешься с матрицами в этот вечер; (3) если ты сейчас расстроен — это нормально, и есть, к кому обратиться. [Кому позвонить в России (RUS) →] [Что эта цифра значит и не значит →]"*

The crisis-resource link is **Russia-specific and in Russian** — not an English APA link, not a US suicide hotline. It points to a curated list shipped with the app: regional Russian-language emotional-support hotlines, vetted by the per-language reviewer. The "what this number means" link goes to the Russian methodology page that explicitly addresses the bottom-tail framing.

**Resolution.** Mikhail does not close the tab in panic. He clicks the "что эта цифра значит" link, reads for two minutes, learns that the test is one visual-reasoning screener built on a sample that skews young-online-educated and known to mis-fit specific populations. He does not feel "officially stupid." He does not call the hotline. He does close the tab. The next day, he forgets about the test for a while, and on the math test he was actually dreading, he scores fine.

The product did its harm-mitigation job by **delivering bad news with care, in his language, with a path forward that wasn't a closed tab**.

**Capabilities revealed:**
- Sequenced score reveal (pre-reveal beat is non-skippable in the rendering pipeline)
- Bottom-decile scene treated as a designed, per-language, clinically-reviewed copy artifact — *not a translation of an English caveat*
- Per-language crisis-resource list shipped statically with the app (no IP geolocation, no telemetry); language picker or static list per locale
- Visual co-equal weight of point estimate and uncertainty band
- Methodology corpus pages explicitly addressing tail-result interpretation, per language
- Mid-session bail-out path with discard/continue choice (no silent partial scoring)

### Journey 3 — Daria, the Top-Decile User (Anti-Credentialization Scene)

**Opening Scene.** Daria is 24, postgrad in psychology in Warsaw, writing her thesis. She has taken many IQ tests for academic curiosity. She is testing IQ-ME because she suspects it's just another inflated-score site she can debunk in a Twitter thread.

**Rising Action.** Polish UI, consent scene, test, all fine. She takes it seriously — she is curious how this one calibrates. She finishes in 22 minutes.

**Climax.** Pre-reveal beat. Show me. Percentile 96. IQ-scale 126. Uncertainty band ±9.

The result-page composition is deliberately **un-screenshot-friendly**: percentile and IQ are large, but the uncertainty band ±9 is the same visual weight, and the inline non-dismissible caveat — *"Ten wynik nie jest świadectwem ani kwalifikacją; jest oszacowaniem narzędzia przesiewowego z otwartego zbioru pytań ICAR."* (This result is not a certificate or qualification; it is the estimate of a screening tool drawn from the open ICAR item pool.) — sits *between* the IQ number and any other visual element. Any screenshot of the score includes the caveat by visual necessity; cropping it requires editing.

There is no "Share your result" button. There is no certificate. There is no badge.

A small block at the bottom of the result page addresses Daria's psychology-postgrad self directly: *"You may be tempted to retake to see if the score holds. The ICAR-MR item pool is small; retesting soon will produce a correlated, not independent, estimate. The methodology page explains why."* It links to the retest section of the methodology corpus.

**Resolution.** Daria does *not* write the debunking Twitter thread. She writes a different thread: *"Found a free IQ test that isn't lying. Polish-language methodology page is actually good. Source is on GitHub. Two stars."* She becomes a credibility multiplier for the project in a community (Polish-speaking psychology students) that the maintainer cannot reach directly. She also opens a GitHub Discussion suggesting a wording improvement in the methodology page; the maintainer accepts the PR with the per-language reviewer's sign-off.

**Capabilities revealed:**
- Result-page visual composition designed so the caveat is screenshot-bound to the number (no clean crop)
- Absence of share / certificate / badge UI as a designed product decision, not an oversight
- Inline tail-specific copy (top-decile: anti-credentialization; bottom-decile: harm-mitigation) per language
- Retest-cooldown / retest-implication copy on the result page itself, not buried
- GitHub Discussions discoverable as the feedback channel from the result page

### Journey 4 — Tomáš, the Skeptic Who Verifies Before Trusting

**Opening Scene.** Tomáš is 38, software engineer in Prague, German-speaking and English-fluent. He reads Hacker News every morning. He has a low tolerance for online IQ tests — has called several of them "fraud" in HN comments. A submission to HN with the title *"IQ-ME: a free, open-source IQ-screener with no telemetry"* catches his eye. He intends to read the code before he ever runs the test.

**Rising Action.** He clicks the GitHub link first, not the live site. He skims the README in two minutes: MIT license for code, CC-BY-NC-SA for items, written ICAR license confirmation committed to the repo as a PDF, `CITATION.cff` at the root, methodology corpus mirrored to Zenodo with a DOI on the latest release. He opens `src/scoring/irt/eap.js` and reads the ~60-line EAP implementation. He clicks through to `tests/golden/vectors.json` — a 1,000-case file generated by R `mirt` — and reads the CI workflow that runs `node --test` against it on every PR.

He opens the live site in a browser DevTools session, hits Record on the Network tab, completes a full test run. He confirms in the trace: only same-origin GET requests to static assets. No analytics. No CDN font. No anything. The site does what the README says.

**Climax.** He reads the methodology corpus next — not for himself (he knows what fluid reasoning is) but to check the framing. He finds the *"What this test does not measure"* page and reads it carefully. The page is signed by a named external psychometrician with their handle and a date, and the prior versions are linked from the changelog. He notices the methodology-claims manifest in the repo and the CI lint that prevents the scoring engine from diverging from the methodology pages. He posts an HN comment:

> *"I read the code. The math is right. The methodology page says what the code does. The CI prevents drift. There's no analytics. This is the first online IQ test in twenty years that isn't a fraud. Two reservations: the ICAR norming sample skews young and educated, which they disclose; and items are in the JS bundle, which they also disclose. Use it as a screener, not a credential."*

**Resolution.** That comment becomes the top-rated reply on a Hacker News thread that reaches the front page. The project gains 600 stars in 48 hours, all from skeptics who came to verify and stayed because they could.

Tomáš himself eventually takes the test out of curiosity. The score is fine; the experience matters more than the number to him.

**Capabilities revealed:**
- README is itself a load-bearing artifact: license summary, scoring spec link, methodology link, CITATION.cff, Zenodo badge
- ICAR license confirmation committed to repo as a verifiable artifact, not a claim in prose
- Scoring engine is a pure module readable in isolation; tests are visible and runnable
- Golden vectors committed; CI workflow visible
- Methodology corpus signed by named reviewer; versioned with changelog
- Methodology-claims manifest visible in the repo; CI parity lint visible
- Live site passes a DevTools network-trace check by construction
- Zero-third-party-fetches invariant verifiable in 30 seconds by any developer

### Journey 5 — Karolina, the Citer Who Never Takes the Test

**Opening Scene.** Karolina is a Polish-language Wikipedia editor specializing in psychology articles. She is rewriting the Polish Wikipedia article *"Test inteligencji"* (Intelligence test) and looking for a recent, plain-language, native-Polish-language reference to use as an external link in the "Online tests" section. The Polish Wikipedia external-links guidelines are strict; the link must be a primary or scholarly source, not a commercial product.

**Rising Action.** She searches Polish-language sources. Most online IQ-test sites in Polish fail Wikipedia's external-links policy outright (commercial, paywalled). She finds IQ-ME via a citation in a Polish psychology student forum and lands directly on `/methodology/v1.2.0/pl/constructs/gf/` — the Polish methodology page about fluid reasoning. The URL is a stable permalink with a version. The page footer shows a "Cite this page" widget that produces an APA citation, a BibTeX entry, and a Wikipedia-formatted `{{cytuj stronę}}` template with the date and version pre-filled.

She copies the Wikipedia-formatted citation. She also copies the Zenodo DOI from the citation widget, because Wikipedia external links benefit from DOI permanence. She does not run the test. She closes the tab.

**Climax.** Three weeks later, the Polish Wikipedia *Test inteligencji* article goes live with an external link to the IQ-ME methodology corpus, citing the versioned permalink and DOI. Six weeks after that, the Russian Wikipedia article on cognitive testing adds a similar link to the Russian-language version of the same methodology page.

The maintainer notices the inbound traffic only because GitHub stars tick up slightly; there is no analytics on the methodology corpus itself. But the citation is permanent, the DOI resolves, and the methodology corpus has done its job *as a publication*, not as a marketing surface.

**Resolution.** A semester later, a psychology lecturer at the University of Warsaw includes the Polish methodology page in a course syllabus for an undergraduate psychometrics course. A year after that, a peer-reviewed paper in *Polish Psychological Bulletin* cites the methodology corpus when introducing fluid reasoning to a non-specialist audience. The methodology corpus has begun to outlive the test, exactly as the vision predicted.

**Capabilities revealed:**
- Methodology corpus URLs are stable, versioned permalinks (`/methodology/v1.2.0/<lang>/<path>/`)
- "Cite this page" widget per page producing APA, BibTeX, and Wikipedia-template-formatted citations
- Zenodo DOI per release, surfaced in the citation widget
- The methodology corpus is reachable, readable, and citable **without taking the test** — it has its own information architecture, sitemap, and SEO posture
- Plain-language reading level enforced per page so that non-specialist citers (Wikipedia editors, course instructors) find the prose usable
- No tracking on the methodology corpus either — Wikipedia editors notoriously block analytics; a tracking pixel would get the site delisted from external-links sections

### Journey 6 — Marek, the Contributor (Translation PR Workflow)

**Opening Scene.** Marek is a bilingual Polish-Czech translator who used IQ-ME in Polish and noticed a phrasing issue in the bottom-decile harm-mitigation copy that reads slightly clinical in a way Polish speakers would find cold rather than caring. He has never contributed to an open-source project before but writes good Polish. He opens a GitHub issue.

**Rising Action.** The issue template (committed to the repo) asks: which language, which page, which content key, what's wrong, what would you suggest, and *who you are* (not name — qualifications, in two sentences). Marek answers, including that he is a working translator with a degree in Polish philology. The maintainer responds within a day, points him at the `CONTRIBUTING.md` and the per-language reviewer-of-record (a named bilingual psychologist who signed off on the original Polish translation), and asks him to open a PR with the proposed change.

Marek opens his first GitHub PR. The CI runs the parity linter automatically — checks block-level content keys, EN source hash, no orphan keys. His change passes. The CI also runs the reading-level lint — passes. The methodology-claims manifest is untouched (this is a copy-tone change, not a methodology change) so the manifest lint passes too.

**Climax.** The per-language reviewer reviews the change in GitHub. She comments with a small refinement — Marek's phrasing is warmer, hers is also warmer but uses a slightly different register that pairs better with the existing methodology page tone. They iterate twice in PR comments. The maintainer approves once the per-language reviewer signs off (the PR template requires both approvals for any per-language content change). The PR merges. A new patch release is tagged. Zenodo mints a new DOI. The Internet Archive snapshots the release. The methodology corpus is now versioned forward by one patch.

**Resolution.** Marek's GitHub handle appears in the changelog of the new release. He receives no money, no badge, no credential — but he becomes the second-most-active contributor to the Polish translation over the following year, gradually proposing improvements to other pages. He never takes the test again; he has read it too thoroughly to be a naive test-taker. He becomes, quietly, part of the project's quality moat.

**Capabilities revealed:**
- `CONTRIBUTING.md` clearly specifies the translation-PR workflow, parity-linter requirements, and reviewer-of-record structure
- Per-language reviewer-of-record is a named, visible role in the repo
- PR template requires both maintainer and per-language-reviewer approval for content-key changes in non-EN locales
- All three CI lints (translation parity, methodology-claims manifest parity, reading-level) run automatically on every PR
- Changelog and Zenodo DOI workflow is automated on release tag
- Internet Archive and Software Heritage mirroring triggers on release tag
- Contributors are visible and credited in the changelog without requiring social-platform telemetry

### Journey Requirements Summary

The six journeys above collectively reveal the following capability areas the PRD must address:

| Capability area | Journeys revealing it |
|---|---|
| Static-site landing with zero preconditions (no consent dialog, no cookie banner, no analytics gate) | 1, 2, 4 |
| Pre-test consent scene with validity-envelope statement, per language | 1, 2, 3 |
| Test runner: one item per view, keyboard-nav, progress indicator, no time pressure | 1, 2, 3 |
| Mid-session bail-out with explicit discard/continue choice (no silent partial scoring) | 2 |
| Pre-reveal "are you ready" beat between final item and score render | 1, 2, 3 |
| Result page composition: percentile + IQ + uncertainty rendered side-by-side, visually co-equal | 1, 2, 3 |
| Per-item-type breakdown | 1 |
| Tail-specific result-page copy (bottom-decile harm-mitigation; top-decile anti-credentialization) — per language, clinical-register-reviewed | 2, 3 |
| Per-language crisis-resource list shipped statically (no IP geolocation, no telemetry) | 2 |
| Anti-screenshot-cropping composition (caveat bound to number visually) | 3 |
| No share / certificate / badge UI by design | 3 |
| Retest-cooldown / retest-implication copy on result page | 3 |
| GitHub Discussions discoverable from the result page | 3, 6 |
| Methodology corpus as a standalone reachable artifact, reachable without taking the test | 4, 5 |
| Stable versioned permalinks for methodology pages (`/methodology/v<X>/<lang>/<path>`) | 5 |
| "Cite this page" widget producing APA + BibTeX + Wikipedia template + DOI per page | 5 |
| Zenodo DOI per release; `CITATION.cff` at repo root | 4, 5 |
| Methodology corpus signed by named external reviewer per version | 4, 6 |
| Methodology-claims manifest in repo; CI lint enforcing scoring↔methodology parity | 4, 6 |
| Block-level translation-parity linter in CI | 6 |
| Reading-level lint per language in CI | 6 |
| `CONTRIBUTING.md` + PR template specifying reviewer-of-record per language | 6 |
| Internet Archive + Software Heritage mirroring on release tag | 5, 6 |
| Live-site zero-third-party-fetch invariant verifiable in 30 seconds via browser DevTools | 4 |
| README as load-bearing trust artifact: license summary, scoring spec link, ICAR license confirmation committed | 4 |
| Changelog with version-versioned attributions including contributor handles | 6 |

These capabilities will feed directly into the Functional Requirements (Step 6) and NFRs (Step 8) sections. They also confirm the Party Mode-derived classification: the methodology corpus is a co-product (Journey 5 stands alone with no app interaction); the result page is a designed ceremony (Journeys 2 and 3 fail catastrophically without it); the trust posture is verified at the repo level, not just the live site (Journey 4).

## Domain-Specific Requirements

This is a **psychometric-assessment instrument with content-licensed redistribution and ethics-bound result delivery**. It sits adjacent to several regulated domains (clinical assessment, education) but **explicitly disclaims clinical applicability** in product copy and methodology — both as an honest framing and as the regulatory-avoidance strategy. Requirements below operate at three levels: hard legal obligations triggered by jurisdictions IQ-ME serves; soft-but-load-bearing professional/ethical obligations (APA testing standards, ICAR license terms); and product-specific risk mitigations the Party Mode rounds surfaced.

### Compliance & Regulatory

#### ICAR Content License (load-bearing, gates v1)

- **Written confirmation in repo before launch.** Use of the ICAR Matrix Reasoning item pool requires written confirmation from the ICAR / SAPA project (William Revelle, Northwestern) that public free-self-assessment redistribution is permitted under the published CC BY-NC-SA terms. The confirmation, including any noted constraints, must be committed to the repository as a verifiable artifact (PDF or signed email export) before v1 ships. This is gate #1 in the pre-launch checklist.
- **License chain integrity.** App code ships under **MIT**; ICAR items and any derivative translations of instructions ship under **CC BY-NC-SA 4.0** (or the upstream-author-specified equivalent). `LICENSES.md` enumerates: source license of each item file, attribution string to render in the methodology corpus, restrictions on commercial use. A CI license-provenance test verifies every shipped item file traces to its ICAR attribution and that `LICENSES.md` has not been modified between releases without an accompanying changelog entry.
- **Non-commercial discipline.** CC BY-NC-SA propagates a non-commercial constraint to the methodology corpus when it discusses or excerpts items. This aligns with IQ-ME's structural non-commercial posture (no entity, no revenue, no ads); the README and `LICENSES.md` make this explicit so that downstream forkers cannot innocently violate the upstream license by attempting to monetize.

#### No Clinical / Medical-Device Status (regulatory avoidance, by design)

- **No diagnostic claims.** IQ-ME makes no clinical, medical, educational-placement, employment, or legal-decision claim anywhere — landing page, consent scene, result page, methodology corpus, README. The result-page caveat is non-dismissible and reviewed by the external psychometrician before launch.
- **No SaMD trigger.** Software-as-Medical-Device classification (FDA 21 CFR Part 820 in the US; EU MDR 2017/745 in the EU; Russian Roszdravnadzor reg.; Polish URPL) is avoided by *not making* any intended-use claim that would trigger it. The intended-use statement, surfaced in the consent scene and methodology corpus, is *self-exploration and curiosity; not clinical assessment*.
- **APA Standards alignment (advisory).** Score reporting follows the *Standards for Educational and Psychological Testing* (APA, AERA, NCME 2014) on transparency, score interpretation, and disclosure of norming-sample limits — but as an honest professional alignment, not a regulatory submission. The external psychometrician reviewer is asked to spot-check Standards alignment as part of pre-launch sign-off.

#### Data Protection (GDPR, Russian 152-FZ, Polish UODO, by-design non-applicability)

- **No personal data collection — by design.** IQ-ME collects **zero** personally identifiable information. No name, no email, no IP logging beyond GitHub Pages' own server logs (which the maintainer does not access; mitigated by mirror-readiness for the Russia case). No cookies. No localStorage writes without explicit per-action opt-in. No analytics. No fingerprinting.
- **GDPR (EU): no controller obligations triggered.** Because no personal data is processed, IQ-ME has no GDPR controller obligations to discharge — no privacy notice required, no DPO, no DPIA, no SCCs. The README and methodology corpus state this plainly so users and downstream forkers understand the posture.
- **Russian Federation Law 152-FZ (Personal Data Law):** same posture — no personal data processed by IQ-ME itself. The GitHub Pages host may log IP addresses under its own jurisdiction; the mirror-readiness for a Russia-hosted alternative (Codeberg, Cloudflare Pages) is a deployment-topology mitigation specifically for the Russian user population.
- **Polish UODO (Polish DPA):** same posture; no triggering processing.
- **Localized resource lists are static, not geo-routed.** The bottom-decile harm-mitigation crisis-resource lists per language (Russia, Poland, generic English-speaking world) are shipped as static curated content in the bundle; no IP geolocation, no consent dialog, no third-party fetch.

#### Accessibility Legal Baselines

- **EU European Accessibility Act (EAA) (in force June 2025).** While IQ-ME is not a commercial service obligated under EAA, the spirit of EAA — accessibility as a default for digital products serving EU populations — is honored as a baseline: WCAG 2.2 AA for navigation, contrast, keyboard control, screen-reader semantics on all non-item content. **The matrix items themselves are visuospatial by construction** and not accessible to screen-reader users — this is disclosed in the consent scene as part of the validity envelope rather than pretended away.
- **WCAG 2.2 AA targeted by default.** Automated checks (axe-core or equivalent) run in CI on the methodology corpus and non-item app surfaces. Manual screen-reader review by a contributor before v1 launch.

### Technical Constraints

#### Security Posture (verifiability is the security model)

- **Content-Security-Policy: zero third-party.** `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` — committed as a static header file (or `<meta http-equiv>` for GitHub Pages where header config is limited). No CDN scripts, no Google Fonts, no third-party analytics, no external image hosting. Verified by Playwright in CI.
- **Subresource Integrity (SRI):** moot under the strict CSP above (no third-party scripts), but documented as the fallback if any external resource is ever added.
- **No runtime mutation, no eval, no inline scripts.** Application source loads as ES modules from same origin; no `eval`, no `new Function`, no inline event handlers, no inline `<script>` blocks. Verified by Playwright CSP-violation trace and by repo-level grep in CI.
- **Cryptographic primitives:** if random item-order selection is used, `crypto.getRandomValues` is the only acceptable source (per Party Mode round 2 / Amelia). `Math.random()` is forbidden in the scoring or item-selection path. The decision between fixed-form vs randomized item order is parked as an open decision; whichever wins, the PRNG constraint stands if randomization is in scope.
- **Forking-ethics-as-security.** MIT permits a fork to strip caveats and add ads. The README explicitly *asks* (does not require, cannot require under MIT) forkers to preserve caveats, methodology corpus, and the trust-posture name. The canonical site, DOI, and Zenodo permanence are the only structural defense; honesty is the unfair advantage.

#### Privacy Posture (verifiability)

- **Network-trace audit, every PR.** Playwright run in CI loads the full app, completes a test session, and asserts the recorded network trace contains only same-origin GET requests to static assets. Any drift fails the PR. This is the technical contract that backs the "zero telemetry" claim.
- **localStorage usage rules.** The browser may write to `localStorage` **only** for: (a) language preference (one key, one value, set by user clicking a language switcher), (b) opt-in result save (one key per saved result, set only after user explicitly clicks Save). No automatic writes. No write on page load. No write on test completion. The first render must work with `localStorage` empty.
- **No third-party fonts.** All typefaces are either web-safe system stacks or self-hosted from the repo. No Google Fonts. No Typekit.
- **No source maps in production** unless they reference repo-internal source only. (With runtime-zero-build, source maps are unnecessary; the source IS the source.)

#### Performance Constraints (assessment validity depends on it)

- **First Contentful Paint < 1.5s on a mid-tier Android over 3G.** Slow loads create selection bias — users on poor connections (overlapping with the underserved RU/PL audience the project most cares about) bail before the consent scene. Measured by Lighthouse-in-CI on every PR.
- **Test-session memory budget < 50MB.** Matrix items are ~100KB each as SVG or optimized PNG; a 16-item session stays well under budget. Verified by a synthetic Playwright run with `performance.memory` snapshots at key beats.
- **Browser support: last 2 years of evergreen browsers.** Chrome / Edge / Firefox / Safari. No IE. ES modules and CSS Custom Properties are baseline; no transpilation needed.
- **No client-side IRT estimation timeout.** The EAP score computation runs in <100ms on a mid-tier mobile device by construction (~250 LOC of pure math on ~16 items × ~40 quadrature nodes); no spinner or progress indicator on score computation is required, which itself is a UX win — the score appears as if it were already there.

#### Measurement-Invariance as a Technical Constraint

- **Translation parity enforced by CI lint.** Block-level content keys are versioned with an EN source hash per RU/PL entry; CI fails any PR where a content key exists in EN but not in RU/PL, where RU/PL carries a stale source hash, or where orphan keys exist in non-EN files. (Carry-forward register NFR.)
- **Stale-translation banner renders automatically** on any methodology page whose EN source hash has drifted from the translated locale's hash. The banner is part of the page template, not the content; cannot be suppressed by editorial choice.
- **Reading-level lint per language.** Each methodology page passes a language-appropriate plain-language metric (Flesch-Kincaid grade ≤12 for EN; Oborneva-equivalent grade for RU; Jasnopis equivalent for PL). CI-enforced.
- **Test-item translation is *not* in scope.** Matrix items themselves are non-verbal; only the surrounding *instructions* are translated. This reduces but does not eliminate cross-cultural variance — the methodology page discloses cultural-familiarity variance for matrix puzzle formats and disavows correction for it.

### Integration Requirements

This is a fundamentally **anti-integration** product — every external integration is a potential trust violation. The only sanctioned external dependencies are:

- **GitHub Pages** — canonical hosting. Static files only. No GitHub Actions secrets in client code. GitHub Actions used only for CI (build-less; runs lints and tests), release tagging, and triggering archive mirrors.
- **Zenodo** — DOI minting per release via GitHub-Zenodo integration. Triggered by tagged release. Required for the citability vision (Journey 5).
- **Internet Archive** — automatic snapshot per tagged release via the Save Page Now API or a simple `curl` from a GitHub Action. Required for archival permanence.
- **Software Heritage** — repository archive on tagged release via the SH `save` endpoint. Required for source-code permanence beyond GitHub.
- **GitHub Discussions** — the no-telemetry feedback channel. Linked from the result page and methodology corpus footer. The link is to the public Discussions area; reading a Discussion does not require a GitHub account, though posting does.

**Explicitly forbidden integrations** (anything in this list breaks the trust premise):

- Google Analytics, Plausible, Fathom, GoatCounter, or any analytics — anonymous or otherwise. The user CEP rejected GoatCounter explicitly during brief discovery; that rejection stands.
- Sentry, LogRocket, FullStory, Hotjar, or any error / session monitoring. If a user encounters a JS error, they may report it via GitHub Issues; nothing is auto-collected.
- Google Fonts, jsDelivr, Cloudflare-CDN'd JS libraries, or any third-party static-asset CDN. All assets self-hosted.
- Social-media share endpoints (Twitter, VK, Facebook). The result page has no share button by design (Journey 3 / Party Mode).
- Email collection, newsletter signup, "save your result to your email" prompts. No email is ever requested.
- Geo-IP services. Crisis-resource lists are static per language; no geolocation.

#### Mirror Strategy for Russia Hosting Risk

- **Canonical:** GitHub Pages.
- **Same-day failover:** Codeberg Pages (EU-hosted Forgejo with static-site serving) **or** Cloudflare Pages (multi-region edge). Whichever wins, the deployment posture for v1 must produce a build that works identically on both: relative asset paths throughout, no Pages-specific path tricks, no GitHub-CDN-bound resources.
- **Long-term:** the methodology corpus is mirrored to Software Heritage and the Internet Archive on every release, so the *content* remains permanently reachable even if the canonical site is blocked or removed.
- **The mirror domain, if needed, will be announced via GitHub Discussions and the canonical README.** No automatic redirect, no JS-based detection ("we noticed you can't reach us"). The user's ISP block is the user's problem to route around; we make it routable, we do not actively work around state censorship in code.

### Risk Mitigations (Domain-Specific)

These risks are enumerated because they are specific to a psychometric instrument shipped as an open-source static site with three-language localization and an ethics-bound result-delivery surface. Each has a named mitigation, several of which are already in the carry-forward register or the brief.

| # | Risk | Mitigation | Owner artifact |
|---|---|---|---|
| 1 | ICAR license confirmation never arrives or arrives constrained | Pre-launch gate #1; cannot ship v1 without it; fallback is to launch with the explicitly-public OpenPsychometrics subset and absorb the resulting reduced item pool | Repo-committed confirmation PDF; `LICENSES.md` |
| 2 | Item pool exposure (items in client bundle) | Acknowledge openly; mitigate via randomized subset draws + image-augmentation (rotation/reflection on draw) + transparent disclosure on methodology page; do **not** claim test security cannot be provided | Methodology / anti-leakage page; randomization story |
| 3 | Norming-sample bias (ICAR sample skews young, online, educated) | Disclose in methodology + result-page caveat + widen the displayed uncertainty band to include norming-sample uncertainty, not just SEM (per Party Mode + integrity review) | Methodology / norming page; result-page uncertainty band |
| 4 | Translation introduces measurement-invariance violation | Per-language reviewer-of-record + parity linter + reading-level lint + bilingual psychometrician review on initial translation + ongoing PR review for non-EN content-key changes | `CONTRIBUTING.md`; CI lints; reviewer-of-record registry |
| 5 | Result-page distress (bottom-decile harm to user) | Pre-test consent + sequenced reveal + per-language clinical-register-reviewed harm-mitigation copy + native-language crisis-resource lists + per-language clinical translator sign-off as a launch gate | Result-page bottom-decile epic; pre-launch checklist |
| 6 | Result misuse (top-decile credentialization, social sharing of inflated meaning) | No share button; no certificate; no badge; anti-screenshot-cropping result-page composition; explicit anti-credentialization copy | Result-page top-decile epic; design decision register |
| 7 | Retest gaming (memorize items, retake for inflated score) | Randomized subset draws per session; documented test-retest caveat on result page; methodology-page retest section; explicit acknowledgement that gaming is possible on a static site | Result-page retest copy; methodology page; randomization story |
| 8 | Russia hosting block by state | Mirror-readiness from v1 (relative paths, multi-host-compatible build); Codeberg or Cloudflare Pages as failover; Software Heritage / Internet Archive for content permanence | Deployment NFR; mirror playbook |
| 9 | Methodology-engine drift (scoring code says one thing, methodology page says another) | Methodology-claims manifest in code; CI lint blocks PR on parity drift; named reviewer-of-record per language re-signs methodology changes | Methodology manifest; CI lint |
| 10 | Fork-and-strip-caveats (a downstream fork removes ethics framing and re-ships) | Cannot prevent under MIT; mitigate via canonical-site discoverability + DOI permanence + community recommendation + README ask that forkers preserve caveats + naming | README forking-ethics section; community recommendation thread |
| 11 | Psychometrician sign-off blocked or delayed (critical-path human gate) | Pre-launch outreach starts before code-complete; named candidates from carry-forward register (Revelle group, individual-differences course instructors); paid review as fallback if volunteer not available within window | Pre-launch checklist; outreach playbook |
| 12 | Tester-credibility threshold not met (≥12/15 native-speaker testers reporting credible) | Iterate result-page copy and consent scene with the same testers until threshold met; do not ship below threshold even if it slips v1 launch | Launch-gate definition; tester recruitment from cognitive-testing community + native-speaker outreach |
| 13 | A user is harmed (bottom-decile distress event, with or without IQ-ME causal role) | No way to detect telemetry-free; mitigation is structural (Risk #5 set) rather than reactive; if a harm report surfaces via GitHub Discussions or external channel, copy review and reviewer-of-record process is triggered for re-review | Incident-response process; GitHub Discussions monitoring |
| 14 | Item-pool license is later revoked by ICAR upstream | Methodology corpus survives independently (CC BY-NC-SA license held by IQ-ME on its own derivative content); app would replace items with another open-licensed pool or sunset; no acquired-rights problem because nothing is acquired | License-revocation contingency note in methodology corpus |

## Innovation & Novel Patterns

### Detected Innovation Areas

IQ-ME's innovation is not "a new technology" — it is **a coherent set of structural, governance, and disclosure decisions that, taken together, are novel for the free-IQ-test genre**. The technology stack (vanilla JS, static site, CommonMark content) is deliberately boring; the innovation lives in *what is refused* and *what is mechanically coupled*. Seven patterns:

#### 1. Honesty-as-Structural-Moat

The category-defining innovation. Existing free-IQ-test sites are advertising or paywall funnels whose business model directly opposes transparency. IQ-ME's structural posture — non-commercial, MIT-licensed, no entity, no revenue, no exit path — is itself the competitive advantage, not a constraint to overcome. **No funded incumbent can copy "no telemetry, no signup, source on GitHub, citations on every claim" without burning their own funnel.** The category novelty is that *honesty is the moat*; it cannot be acquired, defended-against, or replicated by a competitor whose viability depends on extraction.

#### 2. Methodology-as-Coupled-Artifact (CI-Enforced)

Most psychometric tools and most documentation systems both promise "the docs match the code." IQ-ME mechanically enforces it: the scoring engine declares its methodology dependencies in a `METHODOLOGY_CLAIMS` manifest; the methodology pages declare what they `assert` in frontmatter; a CI lint blocks any PR where the two diverge. When the scoring spec changes, the methodology page must update in the same commit or the build is red. **The result is that the published methodology corpus is provably current.** This pattern — *machine-checkable claims/code coupling in a CI workflow* — is novel for the assessment-tool genre and applicable to other "the docs are load-bearing" domains.

#### 3. Score-Delivery-as-Designed-Ceremony

The result page is treated as a ritual with stakes — closer to a pregnancy-test or genetic-results portal than a sub-route of a web app. Per-language clinical-register translators sign off on the bottom-decile and top-decile copy as a launch gate, not a polish pass. Reveal is sequenced (a non-skippable "are you ready" beat sits between final item and score render). The uncertainty band is rendered visually co-equal to the point estimate. **This treats the score-delivery surface as the product, not as the rendering layer of the product.** Novel for the genre, where competitor result pages are universally optimized for share-friendliness and inflated affect.

#### 4. Anti-Credentialization-by-Composition

The top-decile result-page design is **un-screenshot-friendly by visual composition**: the inline non-dismissible caveat sits visually between the IQ number and any other element, such that any screenshot of the number includes the caveat — cropping it requires editing. There is no share button. There is no certificate. There is no badge. The product *refuses* to be turned into a status credential, and the refusal is enforced at the pixel layout, not in copy alone. **Pattern: design the artifact such that its misuse requires extra work**, the inverse of dark-pattern design.

#### 5. No-Build Auditable IRT in Browser JS

Per Party Mode round 2 (Amelia): hand-rolled IRT 2PL EAP scoring in vanilla browser JS, runtime-zero-build, ~250 LOC of pure functions across `likelihood.js`, `eap.js`, `se.js`, `quadrature.js`, validated against R `mirt::fscores(method="EAP")` to ±0.001 logits on a committed golden-vector set. **No other free-IQ-test site I'm aware of ships an auditable IRT scoring engine at all, let alone one that loads as readable source in the browser with no bundler between the user and the math.** The innovation is the combination of *psychometric rigor* + *auditability surface* — competitors that ship IRT (rare) bury it behind opaque API endpoints; competitors that ship transparency (rarer) use naive CTT formulas.

#### 6. Static-Site Psychometric Instrument as Citable Scientific Artifact

Per Party Mode round 2 (Paige): the methodology corpus carries stable versioned permalinks, block-level content keys, a Zenodo DOI per release via `CITATION.cff` and the GitHub-Zenodo integration, Internet Archive + Software Heritage mirroring on release tag, and a "Cite this page" widget producing APA, BibTeX, and Wikipedia-template-formatted citations. **The methodology corpus is a citable scholarly artifact in its own right, independent of the test it documents.** The pattern — *static-site content as DOI-anchored academic publication* — is novel for the free-assessment genre and may exceed the test itself in long-term reach (Journey 5).

#### 7. Tri-Lingual Measurement Equivalence as a CI-Enforced Property

Translation-parity is treated as a measurement-validity property, not a localization checkbox. Block-level content keys are versioned with EN source hashes per RU/PL entry; CI fails on any drift, missing key, or orphan key. A stale-translation banner renders automatically on hash drift. Reading-level lints per language (Flesch-Kincaid EN, Oborneva-equivalent RU, Jasnopis equivalent PL) enforce plain-language discipline. Named per-language reviewer-of-record per version. **The combination — measurement-invariance as a build-time invariant rather than a translator-review checklist — is novel for OSS content projects and load-bearing for psychometric ethics.**

### Market Context & Competitive Landscape

(Drawn from the brief; condensed here for innovation-validation context, not re-deriving the full competitive landscape already in the brief.)

- **Mensa Norway (test.mensa.no)** — the only honest competitor in the free-IQ-test category. Single-language pair (EN/NO), matrices-only, no methodology page, no citation discipline. Sets the *trustworthiness floor* IQ-ME must equal; sets the *coverage ceiling* IQ-ME exceeds via tri-lingual support and the methodology corpus. Innovation pattern #1 (honesty-as-moat) and pattern #2 (coupled methodology) are both genuine deltas vs. Mensa Norway.
- **123test, Brain Metrics Initiative, FreeIQTest, iq-test.cc family** — paywall-funnel scam genre. Innovation patterns #1, #4, and #6 are differentiated against them by structure, not by feature.
- **Lumosity, Elevate, CogniFit, BrainHQ** — adjacent cognitive-training subscriptions that *explicitly disclaim IQ measurement*. They are not competitors; they are the negative-space evidence that the IQ-measurement category has been ceded entirely to scams and paywalls.
- **Mensa national-chapter practice tests** — funnel to paid proctored exams; not a real free-test category.
- **Open-Psychometrics (openpsychometrics.org)** — community-content host for mixed-license psychometric tests. A *reference* for the genre but with neither IRT rigor nor citation discipline; instructive as a "this is how the OSS-psychometrics scene currently looks" baseline.
- **Academic instruments (ICAR, HMT-S)** — the source pool, not competitors. The innovation is the *deployment surface* (static-site + citation + multi-lingual ethics) wrapped around an existing instrument.

**Net:** IQ-ME's positioning is *"the only free IQ test in Russian or Polish that you can audit"*. That sentence is empty in 2026 for both languages. Innovation #1 (structural-honesty), #6 (methodology citability), and #7 (tri-lingual measurement equivalence) are jointly load-bearing for this positioning.

### Validation Approach

Each innovation pattern requires a different validation method. Validations below tie back to the Success Criteria gates rather than introducing new metrics.

| # | Innovation pattern | Validation method | Gate / signal |
|---|---|---|---|
| 1 | Honesty-as-structural-moat | The no-enshittification audit at T+6, T+12, T+24 months passes 100% (zero analytics on the wire, zero third-party fetches, no signup, source matches `main`, LICENSES.md unmodified). The product remains structurally as-described. | Success-criteria audit #8 (Measurable Outcomes) |
| 2 | Methodology-as-coupled-artifact | CI methodology-claims manifest parity lint stays green across the v1 → v1.x cycle; no PRs land that violate parity. External skeptic (Journey 4) verifies the lint exists and runs. | Technical-success gate #2; tester credibility gate |
| 3 | Score-delivery ceremony | Tester-credibility launch gate: ≥12/15 native-speaker testers across EN/RU/PL report the experience felt honest and the result felt credible, including bottom-decile testers reporting the score was delivered with care. | Launch gate; Success criteria #2 + #4 |
| 4 | Anti-credentialization composition | Top-decile testers (P ≥ 90) report the result did not feel like a credential to share without context (User Success criterion #4). Pre-launch design review by external psychometrician asks: would a top-decile screenshot mislead a third party? | User Success criterion #4 |
| 5 | No-build auditable IRT in browser | 100% of golden vectors pass the ±0.001 logits parity test against R `mirt::fscores(method="EAP")` on a ≥1,000-pattern committed test set. External skeptic (Journey 4) reads the code, runs the tests, and posts a public verification. | Technical-success gate #1 |
| 6 | Methodology corpus as citable scientific artifact | Within 24 months: ≥1 Wikipedia external-links section, course syllabus, or peer-reviewed paper cites the methodology corpus via its versioned permalink or Zenodo DOI. (Business-success metric #3.) | Project-success / business-success #3 |
| 7 | Tri-lingual measurement equivalence as build-time invariant | CI translation-parity lint stays green across the v1 cycle; reading-level lints green; no production drift. Per-language tester credibility ≥4/5 in each of EN/RU/PL. | Tester credibility gate; Technical-success gate #3 |

### Risk Mitigation (Innovation-Specific)

These are risks specific to the innovation patterns above, beyond the domain-specific risk register already enumerated in Step 5. They are the failure modes most likely to compromise IQ-ME's *novelty claims* even if every individual feature ships.

| # | Innovation risk | Mitigation |
|---|---|---|
| I1 | The structural-moat claim is rhetorically strong but legally porous — a forker strips the caveats, adds ads, and re-ships under a renamed copy, eroding the brand and the trust posture | Cannot prevent under MIT. Mitigations: README explicit ask that forkers preserve caveats and methodology corpus; canonical DOI and Zenodo permanence as the citable record; community-recommendation thread (e.g., r/cognitiveTesting) anchored to the canonical site; license-revocation contingency note in methodology corpus. Accept that this is unfixable in code and addressable only through community and citation gravity. |
| I2 | Methodology-claims-manifest discipline collapses under contributor pressure — someone proposes a "small" scoring tweak with promise to update docs "in a follow-up" | Hard CI lint, no exceptions. Branch protection forbids merging with red CI. The discipline is mechanical, not cultural. Documented in `CONTRIBUTING.md` as a non-negotiable. |
| I3 | Score-delivery ceremony reads as overwrought, paternalistic, or culturally off in one of the languages — particularly Russian, where clinical register is hard to calibrate | Per-language clinical translator review as launch gate (not a polish pass); ≥4/5 native-speaker testers per language report the copy feels right, not heavy-handed; iteration loop on tester feedback until threshold met; do not ship at <12/15 even if it slips launch. |
| I4 | Anti-credentialization composition is defeated by a single Twitter screenshot crop or by browser-extension cropping tools | The composition raises the cost, it does not eliminate the possibility. Mitigation: accept the residual risk; the design intent is to discourage low-effort sharing, not to prevent determined misuse; the methodology corpus and DOI-anchored citation create the authoritative interpretation that screenshot crops cannot. |
| I5 | The auditable-IRT claim attracts adversarial inspection from psychometricians who find a numerical error or a defensible-but-disputable methodology choice | This is the desired outcome, not a risk. Adversarial inspection is the validation method. Process: pre-launch psychometrician review surfaces issues before launch; post-launch issues are handled via GitHub Issues + methodology corpus updates with reviewer re-sign + Zenodo new release + Internet Archive snapshot. Errors are an opportunity to demonstrate the correction discipline. |
| I6 | The methodology corpus citation discipline is not picked up by Wikipedia editors / course instructors / paper authors within the 24-month window | Distribution risk, not design risk. Mitigations: proactive outreach to ICAR / SAPA group; methodology corpus designed for Wikipedia external-links policy compliance (no commercial markers, named reviewer, versioned permalinks, DOI); long horizon — extend the validation window rather than narrow the validation. |
| I7 | Tri-lingual measurement-equivalence discipline is eroded by translation drift after launch — the maintainer accepts an RU PR without re-running the reviewer-of-record process because the reviewer is unresponsive | `CONTRIBUTING.md` and branch protection require reviewer-of-record sign-off on non-EN content-key changes. Maintainer cannot override. Stale-translation banner on the methodology pages enforces visible honesty if drift persists. Acceptable failure mode: a stale-banner is visible, not invisible drift. |
| I8 | The boring-technology choice (vanilla JS, no build) becomes a hidden complexity tax later — e.g., a contributor patches IRT with a subtle numerical bug because the math is hand-rolled rather than imported from a battle-tested library | Mitigation: golden-vector ±0.001 logits parity test catches numerical regressions in CI; the math is small enough (~250 LOC pure functions) that the surface area is auditable in a single PR review; if pressure increases for a library import, the trade-off is re-evaluated explicitly rather than drifted into. |

## Web App — Specific Requirements

### Project-Type Overview

IQ-ME is a **hybrid SPA + multi-page static site** running on a runtime-zero-build vanilla-JS substrate. The assessment surface is an SPA — session state lives in memory during the test; routes are client-controlled; no full-page reloads between items. The methodology corpus is a multi-page static site — each page has its own stable URL, its own SEO-discoverable HTML, its own citable permalink. Both surfaces ship from the same canonical origin (`/` for the app, `/methodology/v<X>/<lang>/...` for the corpus), share the same CSS design tokens and i18n machinery, and are deployed together as one static artifact. The hybrid is deliberate: the test wants SPA continuity, the corpus wants per-URL discoverability and citability.

### Technical Architecture Considerations

- **Module loading.** ES modules loaded via `<script type="module" src="...">` with relative paths only. No bundler. No `import map` (avoids a moving target across browsers); paths are explicit and relative. Module graph is small enough that no code-splitting is needed for the v1 item count.
- **Routing.** Hash-based routing for the assessment SPA (e.g., `#/test`, `#/result`) — works without server config on GitHub Pages, plays well with mirror deployments, and avoids the 404-redirect dance required for History API routing on Pages. Methodology corpus uses **path-based URLs** with each page as its own `index.html` — necessary for SEO, citability, and Wikipedia external-link compliance.
- **State management.** No framework, no state library. The assessment session state is a single `state.js` module holding `{ currentItem, responses, startedAt, locale }` in memory; result derivation is a pure function from that state plus the scoring engine. No reactive system; explicit re-render on state transitions.
- **Internationalization.** Locale files as `locales/{lang}/{namespace}.json` loaded on demand. Locale-switching during a session is **blocked** by design (measurement invariance — Journey 1 / 2). The active locale is set at landing time, persisted to `localStorage` only on explicit user toggle, and is part of the session-state lock once the consent scene is passed.
- **Scoring engine isolation.** Located at `src/scoring/irt/` as a pure-function module with no DOM imports, no global state, no async. Importable by `node --test` in CI for golden-vector parity. (See Innovation #5, Domain technical-constraints, Carry-forward register.)
- **Methodology renderer.** Each methodology page is authored in CommonMark + YAML frontmatter; rendered at **author time** (one-time `make build-methodology`) into static HTML committed to the repo. Critically: this is the *only* part of the system that uses a build step, and the build output is **the shipped artifact**, not a transformation of it. Browsers load the rendered HTML directly. No client-side markdown rendering. (Resolves the no-build tension Paige raised in Party Mode: HTML-per-locale is what ships; the markdown source is the authoring convenience.)

### Browser Matrix

- **Targeted:** evergreen Chrome (incl. Chromium-derived browsers — Edge, Brave, Opera, Yandex Browser, Samsung Internet), Firefox, Safari (macOS + iOS) — last 24 months of releases.
- **ES baseline:** ES2022. Native ES modules, dynamic `import()`, optional chaining, nullish coalescing, top-level `await`, `URL` API, `crypto.getRandomValues`, `localStorage`, `requestAnimationFrame`. No transpilation; if it does not run unmodified in target browsers, it does not ship.
- **CSS baseline:** CSS Custom Properties (for theming and dark mode); `prefers-color-scheme` media query; `@media` for responsive breakpoints; `:focus-visible`; logical properties (`margin-inline`, `padding-block`) for typography that needs to behave across scripts. No CSS preprocessor.
- **Not supported:** Internet Explorer (any version); pre-Chromium Edge; Safari < iOS 16 / macOS 12; Firefox ESR < 102. Documented in README; a friendly browser-too-old fallback page renders if `<script type="module">` is unsupported.
- **Yandex Browser is explicitly tested.** It is the most-used browser among the Russian-speaking audience and has occasionally lagged on standards adoption; the v1 launch QA includes a manual session in Yandex Browser on both desktop and mobile.

### Responsive Design

- **Breakpoints:** mobile-first, content-driven rather than device-driven.
  - Base (≤ 599px): single-column layout, one matrix item per screen, full-width options, large touch targets (≥ 44 × 44 px).
  - Tablet (600 – 1023px): single-column with wider gutters; matrix items rendered larger.
  - Desktop (≥ 1024px): single-column constrained to a max content width (~640px for prose, ~720px for matrix items) for legibility; methodology corpus pages flow at ~660px max with a side-margin TOC for desktop only.
  - The prototype's `900px` breakpoint is replaced; the v1 grid uses container queries where supported and `@media` breakpoints as fallback.
- **No horizontal scroll at any viewport** — a CI check (Playwright + viewport iteration) asserts the absence of horizontal overflow at 320, 375, 414, 768, 1024, 1280, and 1440px widths.
- **Touch-first interactions on mobile.** Item selection is tap-to-select with a clear "Next" button rather than swipe-to-advance (swipe gestures conflict with accessibility expectations and increase accidental-input rate on a test that demands deliberation).
- **Orientation:** portrait and landscape supported. The pre-test consent scene warns mobile users that landscape is recommended for matrix-item legibility; the app does not force orientation.
- **Print stylesheet** for the methodology corpus (citers print pages for offline reference); the assessment app explicitly does not support print (`@media print { ... display: none; }` for the test surface).

### Performance Targets

- **First Contentful Paint:** < 1.5s on a mid-tier Android (e.g., Moto G Power 2022 equivalent) over 3G (Lighthouse "Slow 4G" profile). CI-enforced.
- **Largest Contentful Paint:** < 2.5s under same conditions.
- **Cumulative Layout Shift:** < 0.05. Methodology pages and the result page must not reflow on font load; system-stack typography is the baseline and any web fonts are self-hosted with `font-display: optional`.
- **Time to Interactive:** < 3.0s on mid-tier mobile.
- **Total page weight:** < 200 KB transferred (gzipped) for the landing + consent + first test item; methodology pages < 100 KB each.
- **Matrix item assets:** SVG by default (vector, accessible to high-DPI displays without separate assets, gzip-friendly); PNG fallback only if an item is genuinely raster. Each item < 50 KB.
- **Scoring computation:** < 100ms on a mid-tier mobile, by construction (small math surface; pure functions; no DOM during compute). No spinner on score render.
- **No JS bundles, no minification artifacts.** The total uncompressed JS shipped is small enough (~30 KB for the assessment app modules, ~15 KB for the scoring engine, ~10 KB for the i18n harness) that minification would offer little win in exchange for losing the auditability surface (Innovation #5).

### SEO Strategy

The assessment app itself has **minimal SEO needs** — it is a destination people arrive at by reputation and recommendation, not by Google query. The methodology corpus is the opposite — it is **highly SEO-critical** because Journey 5 (citers, Wikipedia editors, course instructors) finds it by search, not by recommendation.

- **Title and meta per page.** Every methodology page has a unique localized `<title>`, `<meta name="description">`, and `<meta property="og:*">` block. The assessment app has a single canonical title per locale; sub-routes (`#/test`, `#/result`) do not have unique titles by design (the test is one session, not a browsable set of pages).
- **Structured data (JSON-LD).** Methodology pages carry `ScholarlyArticle` JSON-LD with author (named reviewer-of-record), date, version, DOI, and citation block. This makes them Wikipedia-citable and academic-search-discoverable. The landing page carries `WebApplication` JSON-LD with `applicationCategory: "EducationalApplication"` and `isAccessibleForFree: true`.
- **Canonical URLs.** Versioned methodology permalinks (`/methodology/v1.2.0/<lang>/...`) carry `<link rel="canonical">` pointing to themselves; a separate `/methodology/latest/<lang>/...` redirects (via static HTML `<meta refresh>` or a build-time copy) to the current version's permalinks, both flavors carry mutually consistent `canonical` declarations to avoid duplicate-content penalties.
- **hreflang.** Each methodology page carries `<link rel="alternate" hreflang="<lang>">` pointing to the equivalent page in the other two languages. Google and Yandex use this for query-language matching.
- **Sitemap.** Static `sitemap.xml` at the root listing the canonical methodology permalinks per language and the app landing page per language. Updated on release-tag.
- **`robots.txt`.** `Allow: /` with one explicit `Disallow: /api/` (no API exists, but the directive prevents future drift). No restriction on the methodology corpus.
- **No SEO tracking, no Search Console submission via the canonical site** — the site does not authenticate to Google services. The repo maintainer may register the site to Google Search Console with the maintainer's own credentials *outside* the site (DNS-TXT verification) if desired, but no script or pixel is added to the site. Crawl-stats are inferred from public ranking, not from instrumentation.
- **Wikipedia external-link compliance.** Methodology pages meet the Polish, Russian, and English Wikipedia external-link policies by being non-commercial, primary/scholarly in framing, free, ad-free, and DOI-anchored. No marketing language, no calls-to-action, no email captures. The landing-page link to the test is one sentence at the bottom of each methodology page, formatted as a plain link.

### Accessibility Level

- **Target: WCAG 2.2 AA** on all non-item surfaces (landing, consent scene, item presentation chrome, result page, methodology corpus, navigation, language switcher).
- **Validity envelope on items.** As discussed in Domain Requirements and Journey 2 follow-up: the matrix items themselves are visuospatial by construction and cannot be made screen-reader-equivalent without becoming a different test. The consent scene declares this honestly — *"This test is visual. Users who cannot perceive 2D visual matrices will not receive a meaningful score from this instrument. We are not aware of an open-licensed, validated, non-visual fluid-reasoning instrument we could substitute; if you know of one, please open a GitHub Discussion."*
- **Keyboard navigation.** Every interactive element (language switcher, consent buttons, item options, result-page links) is reachable and operable via keyboard. Tab order is logical and verified manually. `:focus-visible` styles are present and high-contrast.
- **Color contrast.** Text content meets WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text and UI components) in both light and dark themes. Dark mode is not just "invert the colors" — it is a separately-designed palette.
- **Motion.** `prefers-reduced-motion: reduce` honored; the only motion in the assessment is the score-reveal sequence, which has both a default animated form and a reduced-motion instant-render form.
- **Screen-reader semantics on non-item content.** Landmark regions (`<main>`, `<nav>`, `<footer>`), accessible labels on all form controls, `aria-live="polite"` on the progress indicator, `aria-current="step"` on the active item in the progress bar.
- **Form-input affordances.** The item-option radio buttons (typical UI for a multiple-choice item) use native `<input type="radio">` with associated `<label>` elements, not custom-div widgets. Keyboard arrow-key navigation within an item's options is native to the radio-group.
- **Language and direction.** `<html lang="en|ru|pl">` set per page; `dir="ltr"` (all three target languages are LTR). No RTL support needed for v1; adding it later is non-breaking.
- **Automated checks in CI.** `axe-core` (or `pa11y`) runs against the methodology corpus and the assessment app's non-item surfaces. Failures block PRs.
- **Manual review pre-launch.** A contributor or volunteer performs a screen-reader pass (NVDA + Firefox on Windows, VoiceOver + Safari on macOS, TalkBack + Chrome on Android) on the non-item surfaces before v1 launch; results are documented in the launch-readiness section of the repo.

### Implementation Considerations

- **No real-time anything.** The test is single-user, single-session, single-device, no live multi-user state, no websockets, no Server-Sent Events. The score appears the moment the last item is submitted; nothing pulls from a server. Reactivity is local to the page.
- **No service worker for v1.** A service worker would enable offline-first behavior (load once, then take the test on a plane) and is genuinely attractive given the audience (intermittent connectivity in Russia is a real concern). But it adds a layer of cache-invalidation complexity that conflicts with the runtime-zero-build, source-IS-the-artifact posture: a stale service worker can serve an old methodology page after the scoring engine updated, breaking the methodology-claims manifest property. **Service worker is deferred to v1.x** when a CI test exists that verifies service-worker cache invalidation triggers on methodology-corpus version change.
- **Result-page sharing posture is enforced at code level, not just design.** No `navigator.share()` call exists in the source. No `<meta property="og:image">` is generated for the result URL (the result URL is not a stable URL — the hash route is local to the session and not navigable from outside). Both are by design.
- **Item asset preloading.** The full item subset for the session is preloaded after the consent scene confirms — by the time the user begins the test, all items are cached locally. This avoids per-item network round-trips that would (a) leak item access patterns and (b) introduce per-item latency that varies by network.
- **Error handling is silent and local.** If a JS error occurs mid-session, the app renders a polite localized fallback page with a "If this happens repeatedly, please report it on GitHub Discussions" line — no automatic telemetry, no error reporting, no stack-trace upload. The user's session state may be lost; the design accepts this rather than introducing crash-reporting infrastructure.
- **No analytics-style page-event tracking, but local UX state is allowed.** The app may use `IntersectionObserver` or similar APIs to support its own UI (e.g., to know when the user has scrolled past the consent text to enable the Continue button). No data leaves the page.
- **CSP enforcement is verified per PR.** The `Content-Security-Policy` from Domain Requirements is asserted by a Playwright test that loads the live deployment and confirms no CSP violations fire during a full session.

## Project Scoping Strategy

### Strategy & Philosophy

**Approach: Experience MVP — prove the ceremony is right.**

The v1 of IQ-ME exists to validate that the score-delivery ceremony, the methodology corpus, and the tri-lingual measurement-equivalence discipline work *as designed* — not as concepts but as a user experience that native-speaker testers in three languages report as honest and credible. The IRT scoring engine, the static-site architecture, and the CI parity lints are **technical floors** that must hold; they are necessary but not sufficient. The product *is* the moment a Russian-speaking 16-year-old reads a bottom-decile result and does not close the tab in panic. Everything else is plumbing for that moment.

This framing has three consequences for v1 scope:

1. **The launch gate is experiential, not engineering.** Twelve of fifteen native-speaker testers reporting the experience felt honest and the result felt credible is the binary v1-or-not-v1 gate. Engineering must clear ±0.001 logits parity and zero-network-trace before testers even see the build — those are floor conditions, not the launch gate.
2. **Per-language clinical-register review of the result-page copy is a launch-critical artifact**, not a polish pass. The bottom-decile and top-decile scenes are designed and reviewed in Russian, Polish, and English before any tester sees them.
3. **Coverage breadth is deferred; ceremony depth is not.** Adding ICAR Letter-and-Number-Series or 3D-Rotation subtests to v1 would broaden coverage but dilute the per-test polish budget. The decision is: ship one test, beautifully, with the ceremony validated — not three tests, hastily, with the ceremony unproven.

**Release mode: single release (v1 only).** This PRD scopes v1; v1.1+ and v2 thinking is roadmap context (carried in Step 3's Growth Features and Vision sections) but not scoped here.

### Resource Requirements

**Team:** solo dev, AI-assisted (as declared in the brief and confirmed throughout discovery). No engineering team; no design team; no QA team. AI is a force-multiplier on code, copy drafts, and review, not a replacement for the human gates below.

**External human dependencies on the critical path (the real binding constraint):**

| Role | Required for | Latency risk | Mitigation |
|---|---|---|---|
| ICAR / SAPA project (William Revelle's group) | Written license confirmation for free public self-assessment redistribution | High — academic email response times are unbounded; the request may surface unanticipated constraints | Outreach starts before v1 code-complete; paid review fallback if volunteer path stalls; willingness to launch with reduced item set if confirmation is constrained |
| External psychometrician (volunteer or paid) | Methodology corpus + result-page copy + scoring spec review and sign-off | Medium-high — finding the right person is itself work; one round of revision is expected | Pre-launch outreach to identifiable candidates (ICAR group, individual-differences course instructors); paid option budgeted; ≥ 4 weeks lead time before launch target |
| Russian-language clinical-register translator | Result-page tail copy review; methodology corpus translation review | Medium — bilingual psychometrically-aware Russian native is a small pool | Community outreach via r/cognitiveTesting Russian-speakers + psychology academic networks; paid as fallback |
| Polish-language clinical-register translator | Same as RU, for Polish | Medium | Same posture |
| 15 native-speaker testers (5 × EN/RU/PL) | Launch-gate credibility validation | Low individually, medium collectively — recruitment takes time | Recruit via cognitive-testing communities + native-language psychology forums; multiple test rounds budgeted; ≥ 2 weeks for full credibility cycle |

The binding constraint on v1 launch date is **not** code-complete — it is the slowest external human gate. The scoping decision implied: do not commit to a launch date until all five outreach paths are in flight; treat v1 as launch-gated by validation, not by feature-complete.

**Maintainer time:** part-time personal time, AI-assisted; no employment dependency, no funding clock. The structural advantage is that **the project cannot be pressured by a runway**, so the scope-compromise pressure is unusually low. The structural disadvantage is that personal-time slippage is hard to recover.

**Budget:** functionally zero ongoing costs by design (GitHub Pages is free; Zenodo is free for academic open-source; Internet Archive is free). Potential discretionary spend on paid psychometrician review (~$500–$2000 if volunteer path stalls) and on translator review for RU/PL (~$300–$800 per language if volunteer path stalls). These are one-time costs at v1 launch, not recurring. No subscriptions, no SaaS, no domain registration (uses the default `*.github.io` or a free `*.codeberg.page` mirror).

### Complete Feature Set

The full v1 scope is enumerated in the **Product Scope → MVP** section of this PRD (Step 3). It is *not* re-listed here. Step 8 adds a must-have vs nice-to-have analysis *within* v1 — recognizing that "single release" means all of v1 ships, but within v1 some items can absorb slippage and some cannot.

#### Must-Have Capabilities (v1 cannot ship without these)

Items where slippage forces a launch delay rather than a launch with reduced scope:

- **Written ICAR license confirmation committed to repo** (gate #1; if it does not arrive or arrives constrained, the launch posture changes fundamentally — the carry-forward register names the fallback of an OpenPsychometrics-licensed subset, which is itself a scope change)
- **The single ICAR Matrix Reasoning test with calibrated items** (the entire product)
- **EN / RU / PL UI + methodology corpus** (the wedge; without all three, the underserved-audience positioning is empty)
- **Scoring engine: IRT 2PL EAP, ±0.001 logits parity vs R `mirt`** (innovation pillar #5; the auditable scoring claim is load-bearing)
- **Result page composition: percentile + IQ + uncertainty side-by-side, visually co-equal; sequenced reveal; inline non-dismissible caveat** (the ceremony)
- **Bottom-decile and top-decile result-page copy, per-language clinical-register-reviewed** (the harm-mitigation surface)
- **Per-language native-language crisis-resource lists shipped statically** (the harm-mitigation backstop; no English-fallback is acceptable for an RU/PL user)
- **Pre-test consent scene with validity-envelope statement, per language** (the entry-point ethics surface)
- **Methodology corpus: explanation + reference quadrants, all three languages, stable versioned permalinks, named reviewer-of-record per language** (corpus as co-product; falsifiability surface)
- **Methodology-claims manifest in repo with CI lint enforcing parity** (innovation pillar #2; the no-drift guarantee — confirmed must-have during scoping rather than deferred to v1.0.1)
- **Per-page reading-level lint in CI** (the discipline is mechanized from day one rather than relying on manual review; confirmed must-have during scoping despite higher tooling-setup cost for RU/PL)
- **License-provenance test, translation-parity lint, network-trace audit, accessibility lint all green in CI** (the trust-posture verifiability gates)
- **Zero third-party fetches, zero analytics, no signup, no upsell** (the no-enshittification floor; any violation invalidates the project's positioning)
- **External psychometrician sign-off documented in repo** (gate)
- **12/15 native-speaker tester credibility threshold met** (launch gate)
- **Mirror-readiness designed in: relative asset paths throughout, multi-host-compatible build** (the Russia access contingency)
- **CITATION.cff at root; Zenodo DOI on first release** (citability discipline)
- **Prototype `iq-me.html` removed from repo** (carry-forward register; prevents drift back to the rejected v0 aesthetic and scoring)

#### Nice-to-Have Capabilities Within v1

Items that *should* ship in v1 but where slippage to a v1.0.1 patch release within weeks of launch is acceptable rather than launch-blocking. **These are still in scope** — they are not deferred to v2 — but they absorb slippage if a hard date arrives before they are done:

- **Internet Archive + Software Heritage auto-mirror on release tag** (confirmed nice-to-have during scoping: manual mirror snapshot at launch is acceptable; automation via GitHub Action lands in v1.0.1 within weeks)
- **"Cite this page" widget producing all three citation formats** (ship with at least APA + Wikipedia-template; BibTeX in v1.0.1 if needed)
- **Print stylesheet for methodology corpus** (corpus is readable without it; landing it in v1.0.1 is acceptable)
- **JSON-LD structured data for methodology pages (ScholarlyArticle)** (a discoverability win; not a trust-premise win; v1.0.1 is acceptable)
- **`sitemap.xml`** (auto-discovered by major engines without it; nice-to-have but not blocking)
- **Manual Yandex Browser QA pass on launch day** (if discovered as broken post-launch, hotfix within days is acceptable since Russian-language audience usage tail is meaningful but the Chrome/Chromium overlap means most users won't be blocked)

Anything not in either list above is **out of v1 scope** and lives in the Growth Features section of Step 3. The user explicitly chose "single release (v1 only)" for this PRD — so v1.1+ and v2 are roadmap context, not scoped commitments.

### Risk Mitigation Strategy

The risk register from Steps 5 and 6 enumerates 14 domain risks and 8 innovation risks. Step 8 captures the **scoping-time** mitigation posture — how the v1 scope itself is shaped to manage those risks, rather than re-listing them.

#### Technical Risks (Mitigated by Scope Discipline)

- **The most technically challenging aspect is the IRT 2PL EAP scoring engine** — hand-rolled in vanilla browser JS, validated to ±0.001 logits against R `mirt`, cross-browser-deterministic at the ULP. Mitigation by scope: the math surface is kept *deliberately small* (~250 LOC across `likelihood.js`, `eap.js`, `se.js`, `quadrature.js`); EAP is chosen over MLE specifically because it has no convergence loop and handles all-correct / all-wrong patterns gracefully; golden vectors are committed and CI-enforced from day one. The math is small enough that an external auditor can read it in one sitting (Journey 4).
- **The riskiest technical assumption is cross-browser floating-point determinism.** Mitigation: the ±0.001 tolerance is large enough to absorb ULP-level drift; if a browser-specific divergence appears, the fallback is to bump quadrature-grid size from ~40 to 61 nodes, which is documented in the scoring spec as the accepted remedy. We do not promise IEEE-bit-exact reproducibility across browsers.
- **i18n architecture risk:** locale switching across measurement boundaries is blocked by design (Journey 1/2), removing the most expensive failure mode. The build-time HTML-per-locale model for the methodology corpus (the one concession to a build step, per Step 7) is the architectural decision that absorbs the otherwise-thorny "three parallel content trees" problem Winston flagged.
- **Anti-leakage is *acknowledged as unsolvable* on a static site and addressed by disclosure + randomization-as-mitigation, not by scope.** This is a scope-shaping decision: we explicitly do not invest v1 effort in "test security" theatre (obfuscation, integrity tokens, etc.) because that effort buys nothing on a public static site. The honesty about this is itself the trust posture.

#### Market Risks (Mitigated by Validation Sequencing)

- **The biggest market risk is that the Russian/Polish-speaking audience does not discover the product** — distribution into VK, Habr, Wykop, Pikabu, and Polish-language Reddit equivalents is harder than the English-speaking r/cognitiveTesting recommendation thread. Mitigation by scope: the methodology corpus is built for Wikipedia external-link compliance from day one (Step 7 SEO Strategy), creating *passive* discoverability via Wikipedia editors who never need to be solicited. Active distribution is not a v1 scope item; passive citability is.
- **Adjacent market risk: the result-page ceremony reads paternalistic or culturally off in Russian.** Mitigation by scope: per-language clinical-register translator review is a must-have launch gate; the 12/15 tester credibility threshold per-language (≥4/5 in each of EN/RU/PL) cannot be aggregated to mask a single-language failure; iteration with testers continues until threshold met *or launch slips*.
- **The "what if no one cares" risk** — the personal-north-star definition of success is *shipping a real honest tool*, not user volume. Mitigation by *definition*: success criteria explicitly exclude user-volume metrics. The market risk is not about absolute volume but about whether the right people (citers, recommenders, contributors) find the project — measured indirectly via the success-criteria signals at T+12 and T+24 months.

#### Resource Risks (Mitigated by Solo-Dev Posture)

- **What if maintainer time slips?** Mitigation: no employment dependency, no funding runway, no team to keep busy. Slippage costs nothing but time. The scope-pressure equilibrium is unusually favorable — there is no incentive to launch before the gates close.
- **What if a critical external gate (psychometrician sign-off, native-speaker review) cannot be closed?** Mitigation: paid-review fallback is budgeted (~$500–$2000 for psychometrician, ~$300–$800 per language); the paid path is acceptable and does not compromise the non-commercial posture (paying for review is not paying for endorsement). If even paid review cannot be secured for a language, that language slips to v1.1 — explicitly broken out as a "what could change" decision that the user retains.
- **What if a third-party dependency (Zenodo, Internet Archive, GitHub Pages) becomes unavailable mid-launch?** Mitigation: the mirror-strategy is must-have (Codeberg Pages as same-day failover); Software Heritage as third-tier archival redundancy; the project's permanence promise survives any single dependency outage by design.
- **Absolute minimum solo-dev v1 launch posture:** if all external gates collapse simultaneously, the v1 launch posture degrades to: English-only launch with full methodology corpus + scoring engine + ceremony, with RU/PL slipping to v1.1 when reviewers are secured. This is the worst case the user retains the option of accepting; it is not the recommended outcome and is included here only so the scope analysis is complete. The recommended outcome is to wait for the gates to close.

## Functional Requirements

### Test Session

- **FR1:** Test-takers can begin a test session in their chosen language (EN/RU/PL) without creating an account, providing personal information, or consenting to any data collection beyond what is required to render the page.
- **FR2:** Test-takers can answer one matrix-reasoning item at a time, selecting from a defined option set, with the ability to revisit and change a previous answer until the final submission.
- **FR3:** Test-takers can observe their progress through the test (items completed vs total) at all times during the session.
- **FR4:** Test-takers can bail out of the test mid-session, with an explicit choice between discarding their responses and continuing — no silent partial scoring.
- **FR5:** Test-takers can take a test without time pressure (no countdowns, no per-item timers, no timing-based scoring penalties).
- **FR6:** Test-takers can complete a session entirely within the browser, with no server-side state, no network requests beyond same-origin static-asset fetches, and no persistence unless the user explicitly opts in.
- **FR7:** Test-takers can take a session whose items are drawn from the calibrated ICAR Matrix Reasoning pool; the item subset for a given session is reproducible given the session and not pre-predictable across independent sessions.
- **FR8:** Test-takers cannot switch language mid-session once the consent scene is passed; the active locale is locked for the duration of measurement.

### Consent & Validity Disclosure

- **FR9:** Test-takers can read, before starting the test, a plain-language statement of what the instrument does and does not measure, in their chosen language.
- **FR10:** Test-takers can read, before starting the test, the validity envelope — the conditions under which the instrument is and is not psychometrically valid (including the explicit disclosure that the test is visuospatial and not equivalent for screen-reader users).
- **FR11:** Test-takers can decline the consent scene and exit the application without taking the test, with an explicit "Not today" path.
- **FR12:** Test-takers can confirm consent only after the validity envelope is displayed; the Continue control is not available until the user has had the opportunity to read the disclosure.
- **FR13:** Test-takers can encounter a pre-result "are you ready" beat between submitting the final item and viewing the score, with the option to delay viewing the result.

### Score Computation

- **FR14:** The scoring engine can compute, given a response pattern and the ICAR item parameters, an ability estimate (θ) and standard error using IRT 2PL EAP estimation.
- **FR15:** The scoring engine can express the ability estimate as both a Gf percentile and an IQ-scale equivalent, accompanied by an honest uncertainty band that includes measurement error *and* norming-sample uncertainty.
- **FR16:** The scoring engine can produce its output deterministically — without network access, without DOM dependencies, and without depending on any global mutable state.
- **FR17:** The scoring engine can be invoked independently of the user interface, enabling reproducibility, external audit, and golden-vector testing against a reference implementation.

### Result Delivery

- **FR18:** Test-takers can see their result rendered with the percentile, IQ-scale equivalent, and uncertainty band as **visually co-equal elements** (no element visually dominates the others through size, color, or position).
- **FR19:** Test-takers can read tail-specific result-page copy — bottom-decile harm-mitigation, mid-band contextualization, or top-decile anti-credentialization — that has been authored and reviewed in their language by a clinical-register native speaker, not translated from English.
- **FR20:** Test-takers in any percentile range, particularly the bottom decile, can access a curated native-language list of mental-health and crisis-support resources without geolocation, account creation, or any external service request.
- **FR21:** Test-takers can navigate from any number on the result page (percentile, IQ-scale value, uncertainty band) to the methodology page that defines it, in one click, in the test-taker's active language.
- **FR22:** Test-takers can see a per-item-type breakdown of their performance on the result page.
- **FR23:** Test-takers can read an inline, non-dismissible caveat above the score, in their chosen language, that disclaims clinical, educational-placement, employment, and legal-decision applicability.
- **FR24:** Test-takers in the top decile see a result composition in which the caveat and uncertainty band are visually bound to the score such that producing a clean, decontextualized screenshot of the score requires deliberate editing.
- **FR25:** Test-takers cannot share their result via any built-in affordance (no share button, no certificate, no badge, no `navigator.share()` call, no auto-generated social-card image).
- **FR26:** Test-takers can opt in to saving their result to local browser storage; saving never occurs automatically and the first render must work with storage empty.
- **FR27:** Test-takers can read, on the result page, a per-language explanation of what immediate retesting implies for the score's reliability — the test-retest discipline is on the result page itself, not buried in the methodology corpus.

### Methodology Corpus

- **FR28:** Citers can reach every methodology page via a stable, versioned permalink that does not change across future releases.
- **FR29:** Citers can obtain, on every methodology page, a citation block in at least APA format and Wikipedia citation-template format, with version and DOI pre-filled.
- **FR30:** Citers can resolve a Zenodo DOI per release to the canonical version of the methodology corpus at that release.
- **FR31:** Readers can switch between language variants of any methodology page in one click, with `hreflang` declarations enabling cross-language discoverability via search engines.
- **FR32:** Readers can reach, read, and cite the methodology corpus **without taking the test** — the corpus is independently navigable, indexed, and search-engine-discoverable.
- **FR33:** Readers can read every methodology page at a plain-language reading-level discipline appropriate to the language (Flesch-Kincaid for EN, Oborneva-equivalent for RU, Pisarek/Jasnopis for PL), with the discipline enforced before any page reaches the canonical site.
- **FR34:** Readers can see a "stale translation" banner on any methodology page whose translated content has drifted from the English source.
- **FR35:** Readers can see the named reviewer-of-record per language per version on the methodology page footer or in the corpus changelog.
- **FR36:** Readers can read a separately-maintained "what this instrument does not measure" methodology page, in their language, that is protected from silent shortening or removal.

### Localization & Language

- **FR37:** Test-takers can select among EN, RU, and PL locales at landing time; the selection is persisted to local browser storage only on explicit opt-in.
- **FR38:** Test-takers can read all UI surfaces (landing page, consent scene, item instructions, item-option labels, progress indicator, result-page copy, methodology corpus links) in their chosen language.
- **FR39:** The three language localizations can be kept in lockstep at the block-level content-key granularity, with build-time enforcement of parity across all three locales.
- **FR40:** Each language locale can be reviewed and signed off by a named reviewer-of-record before any content-key change in that locale reaches the canonical site.

### Trust Verification

- **FR41:** Skeptics can verify, in 30 seconds via browser DevTools, that the live site issues no third-party network requests during a full session — only same-origin GET requests to static assets.
- **FR42:** Skeptics can read the scoring engine source code *as it is shipped to the browser*, with no minification, bundling, or transpilation between the source repository and the live deployment.
- **FR43:** Skeptics can read the methodology-claims manifest in the source repository and verify that a CI lint blocks pull requests whose scoring engine and methodology corpus disagree on any declared claim.
- **FR44:** Skeptics can read the committed golden-vector test set and the CI workflow that runs the scoring engine against it, asserting agreement with the reference implementation (R `mirt`) to ±0.001 logits.
- **FR45:** Skeptics can read, in the repository root, the written ICAR license confirmation as a verifiable artifact.
- **FR46:** Skeptics can locate, for every tagged release, that release's archival snapshots on Internet Archive and Software Heritage and its Zenodo DOI.

### Contribution & Governance

- **FR47:** Contributors can submit a pull request proposing a content change to any locale, code change to the app, or methodology-corpus change, by following a documented workflow committed in `CONTRIBUTING.md`.
- **FR48:** The CI system can block any pull request that violates translation parity, methodology-claims-manifest parity, license-provenance integrity, per-language reading-level, accessibility baseline, network-trace zero-third-party invariant, or scoring-engine golden-vector accuracy.
- **FR49:** Maintainers can require both maintainer approval *and* per-language reviewer-of-record approval before merging any non-EN content-key change.
- **FR50:** Readers can see, in `LICENSES.md` at the repository root, the source license for the app (MIT) and for the item pool and translated content (CC-BY-NC-SA or upstream-author-specified).
- **FR51:** Readers can read, in the README, the forking-ethics statement asking forkers to preserve the caveats and the methodology corpus — with the understanding that this is a request, not enforceable under MIT.
- **FR52:** Readers can subscribe to project updates via GitHub Discussions threads and GitHub repository release notifications; no email-subscription mechanism exists.
- **FR53:** Contributors can see their contributions credited by GitHub handle in the per-release changelog without requiring any external tracking or social-graph integration.

### Self-Validation Summary

The 53 FRs above cover the capability surface revealed by every prior step:

- **Executive Summary differentiator pillars** → FR23 (caveats), FR41–FR42 (auditability), FR18–FR19 (ceremony), FR28–FR32 (corpus as co-product)
- **Success Criteria** → FR1 (no preconditions), FR41 (zero-third-party verifiability), FR14–FR17 (scoring accuracy), FR39–FR40 (translation discipline), FR28–FR30 (citability)
- **All six User Journeys** → cross-referenced in the Journey Requirements Summary table; every "capability revealed" entry maps to one or more FR above
- **Domain Requirements** → FR1 / FR6 (no PII), FR41 (zero third-party), FR50 (licenses), FR45 (ICAR confirmation), FR10 (validity envelope including a11y honesty)
- **Innovation Patterns** → FR42 (auditable IRT), FR43 (manifest), FR24–FR25 (anti-credentialization), FR28–FR30 (DOI/citation), FR39 (tri-lingual measurement equivalence)
- **Web App Specifics** → FR31 (hreflang), FR28 (permalinks), FR41 (CSP/network-trace), accessibility coverage in FR10 + FR48
- **Scoping (MVP must-haves)** → all FRs prefixed by Step 3 MVP items are covered; nice-to-have items (Internet Archive auto-mirror, BibTeX citation format) are encoded as part of FR46 / FR29 with the understanding that the *capability* is in scope and the *automation* is permitted to slip per Step 8

**Capability contract reminder:** any feature not derivable from the FRs above will not exist in the final product unless added explicitly in a future revision of this PRD.

## Non-Functional Requirements

### Performance

- **NFR1 — Load time (mobile, constrained network).** First Contentful Paint < 1.5s, Largest Contentful Paint < 2.5s, Time to Interactive < 3.0s, Cumulative Layout Shift < 0.05, measured on a mid-tier Android (Moto G Power 2022 equivalent or weaker) under Lighthouse "Slow 4G" emulation. Lighthouse-in-CI fails any PR that regresses below threshold.
- **NFR2 — Page weight.** Initial-load assets (HTML + critical CSS + critical JS + the first test item) transferred ≤ 200 KB gzipped. Methodology pages ≤ 100 KB gzipped each. Matrix items ≤ 50 KB each (SVG preferred, optimized PNG fallback).
- **NFR3 — Scoring latency.** EAP scoring completes in < 100 ms on a mid-tier mobile, by construction. No spinner, no progress indicator, no async-rendering pattern on score computation.
- **NFR4 — Memory budget.** Full-session memory usage ≤ 50 MB, measured via `performance.memory` snapshots in a Playwright synthetic run.
- **NFR5 — Browser footprint.** Targeted browsers: Chrome / Chromium-derived (Edge, Brave, Opera, Yandex Browser, Samsung Internet), Firefox, Safari (macOS + iOS) — last 24 months of evergreen releases. Yandex Browser specifically validated for v1 launch. No support for IE, pre-Chromium Edge, Safari < iOS 16 / macOS 12, Firefox ESR < 102.

### Security & Privacy

- **NFR6 — Zero-third-party invariant.** The deployed site issues only same-origin GET requests to static assets during any session. No third-party scripts, fonts, analytics, error reporting, telemetry, geo-IP, or social embeds. Verified by Playwright network-trace assertion on every PR.
- **NFR7 — Content-Security-Policy.** A strict CSP (`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`) is enforced. No `eval`, no `new Function`, no inline `<script>` blocks, no inline event handlers. CSP-violation count during a full Playwright session = 0.
- **NFR8 — No personal data collection.** Zero PII is collected, processed, transmitted, or stored anywhere except the user's own `localStorage` on explicit opt-in. No IP-based logging by IQ-ME (host-level GitHub Pages logs are out of IQ-ME's control and are not accessed by the maintainer). No cookies. No fingerprinting. GDPR / 152-FZ / UODO controller obligations are not triggered by design.
- **NFR9 — localStorage discipline.** `localStorage` writes occur only as a direct synchronous consequence of an explicit user action (language switcher toggle, "Save my result" click). No writes on page load. No writes on test completion absent explicit opt-in. First-render correctness must not depend on `localStorage` state. Enforced by Playwright assertion.
- **NFR10 — Cryptographic randomness only.** Any randomization in item selection or item ordering uses `crypto.getRandomValues`; `Math.random()` is forbidden in the scoring or item-selection code paths. Enforced by repo-level grep in CI.
- **NFR11 — Forking-ethics request.** README contains the explicit (non-enforceable) request that forkers preserve the caveats, the methodology corpus, and the anti-credentialization composition. Documented as a request because MIT permits stripping; the structural defenses are canonical-site discoverability + DOI permanence (NFR21) + community recommendation.

### Accessibility

- **NFR12 — WCAG 2.2 AA on non-item surfaces.** Landing page, consent scene, item presentation chrome, result page, methodology corpus, navigation, language switcher all meet WCAG 2.2 AA: keyboard operability, focus visibility, color contrast (4.5:1 body / 3:1 large + UI), landmark regions, accessible form labels, `aria-live="polite"` on progress, `aria-current="step"` on active item, `prefers-reduced-motion` honored. Verified by `axe-core` (or `pa11y`) in CI on every PR.
- **NFR13 — Validity envelope honesty on items.** Matrix items are visuospatial by construction and not screen-reader-equivalent; this is disclosed in the pre-test consent scene per FR10 rather than papered over with synthetic alt-text. The disclosure is per-language and reviewed by the per-language reviewer-of-record.
- **NFR14 — Manual screen-reader audit pre-launch.** Before v1 ships, a contributor performs a manual screen-reader pass on the non-item surfaces with NVDA + Firefox on Windows, VoiceOver + Safari on macOS, and TalkBack + Chrome on Android. Results documented in the launch-readiness section of the repo.
- **NFR15 — Color and motion.** Dark mode is a separately-designed palette (not auto-inverted); both light and dark themes meet contrast thresholds. The result-page reveal sequence has both an animated form and a `prefers-reduced-motion: reduce` instant-render fallback.

### Reliability & Availability

- **NFR16 — Canonical uptime.** GitHub Pages is the canonical host; effective uptime is whatever GitHub Pages provides (no SLA — IQ-ME does not guarantee what its host does not guarantee). Documented in README as a transparent honesty rather than a promise of 99.9%.
- **NFR17 — Mirror-readiness.** v1 ships with relative asset paths throughout and a build that deploys identically to GitHub Pages and to Codeberg Pages (or Cloudflare Pages); a manually-triggered failover to the mirror can be live within one day of detecting a sustained outage or regional block.
- **NFR18 — Archival redundancy.** Every tagged release is mirrored to Internet Archive (Save Page Now) and Software Heritage (`save` endpoint). At v1 launch the mirror is manual (per scoping); automation lands in v1.0.1. If both canonical and mirror are lost, the methodology corpus remains reachable via archive.org and Software Heritage permanently.
- **NFR19 — Stale-version banner.** Methodology pages whose translated content has drifted from the EN source render an automatic banner advising readers that the EN source has updated and translation review is pending (FR34). Drift visibility is the reliability mechanism for translation equivalence.
- **NFR20 — Graceful error fallback.** If a JS error occurs mid-session, the app renders a localized fallback page directing the user to GitHub Discussions; no automatic error reporting, no session-resume attempt, no stack-trace upload.

### Auditability & Verifiability (IQ-ME-Specific NFR Class)

These NFRs are the load-bearing trust-premise specifications. They are unique to IQ-ME among free-IQ-test products and gate the project's positioning.

- **NFR21 — Runtime-zero-build invariant.** The deployed production artifact contains no compiled, bundled, minified, or transpiled JS — browsers load source files directly. The only build step is the author-time `make build-methodology` that renders CommonMark methodology source into per-locale HTML; that build output **is** the shipped artifact. CI verifies the deployed JS tree matches the source JS tree byte-for-byte.
- **NFR22 — Scoring engine golden-vector parity.** The JS scoring engine agrees with R `mirt::fscores(method="EAP")` to within ±0.001 logits on a committed test set of ≥ 1,000 simulated response patterns. CI runs `node --test` against `tests/golden/vectors.json` on every PR; any case failing tolerance fails the build.
- **NFR23 — Methodology-claims manifest parity.** The scoring engine declares its methodology dependencies in a `METHODOLOGY_CLAIMS` manifest; methodology pages declare their `asserts` in YAML frontmatter; a CI lint blocks any PR where engine declarations and methodology assertions disagree. The lint is a hard gate from v1 (per scoping confirmation).
- **NFR24 — License-provenance verifiability.** Every shipped item file carries an attribution traceable to its ICAR source; `LICENSES.md` is unmodified between releases except via changelog entries; the written ICAR license confirmation is committed as a verifiable artifact in the repository root. A CI license-provenance test asserts these invariants on every PR.
- **NFR25 — Citation infrastructure.** Methodology pages carry stable versioned permalinks (`/methodology/v<X>.<Y>.<Z>/<lang>/<path>/`), JSON-LD `ScholarlyArticle` structured data, and `hreflang` declarations; `CITATION.cff` is present at the repository root; Zenodo DOI is minted per tagged release.
- **NFR26 — Verification time-to-confidence.** A skeptic with browser DevTools knowledge can verify the zero-third-party-fetch invariant in ≤ 30 seconds; can read the entire scoring engine source (~250 LOC) in ≤ 10 minutes; can run the golden-vector test suite locally in ≤ 5 minutes with only `node` installed. The auditability surface is small by design (Innovation pillars #2 and #5).

### Content Governance & Translation Equivalence

- **NFR27 — Block-level content-key parity.** Every methodology page is structured as block-level content keys with stable IDs. For each key, all three language locales (EN/RU/PL) are present, and the RU/PL files carry the current EN source hash in frontmatter. CI fails on missing keys, orphan keys, or stale source hashes.
- **NFR28 — Reading-level discipline.** Every methodology page passes a language-appropriate plain-language metric — Flesch-Kincaid grade ≤ 12 for EN (target 9–10), Oborneva-equivalent grade for RU, Pisarek-equivalent (Jasnopis) grade for PL. CI-enforced from v1 (per scoping confirmation; user upgraded this from nice-to-have to must-have).
- **NFR29 — Reviewer-of-record per language per version.** Every content-key change in a non-EN locale requires sign-off from the named reviewer-of-record for that language at that version. Branch protection enforces dual-approval (maintainer + per-language reviewer). The reviewer name, GitHub handle, and sign-off date are surfaced on the page footer or in the corpus changelog.
- **NFR30 — Glossary-first writing.** Every technical term used in any methodology body page exists in the `/glossary/` in all three languages before it can appear in body text. Lint enforces. Forces precision and translation parity.
- **NFR31 — Style guide invariants.** No idioms (idioms do not translate cleanly and tank reading-level scores). Sentence-length caps per language (25 words EN; ~180 chars RU; ~160 chars PL). Diagrams over prose for distributional concepts; SVG diagrams with `<title>` and `<desc>` translated as content keys themselves.

### Maintainability & Sustainability

- **NFR32 — Solo-dev cognitive load budget.** The codebase is sized so a single maintainer can hold the entire system in mind: ~250 LOC scoring engine, ~30 KB app modules, ~15 KB i18n harness, ~30 methodology pages per locale. Any addition that materially increases cognitive load (e.g., a framework migration, a state-management library, a bundler) is subject to explicit re-evaluation against the runtime-zero-build invariant.
- **NFR33 — No external runtime dependencies.** Zero npm runtime dependencies in production. Dev-time tooling is permitted (e.g., `node --test`, `axe-core`, Playwright, Lighthouse CLI, language-specific reading-level analyzers) and is invoked via `make` targets; it must not modify shipped files. Dev dependencies are isolated under `devDependencies` in `package.json` if a `package.json` exists at all (it can be optional — `make` targets can invoke tools via `npx --yes`).
- **NFR34 — License sustainability.** App code: MIT. Item pool: CC-BY-NC-SA (or ICAR-author-specified). Methodology corpus: CC-BY-NC-SA (the project's own derivative content). Translations: CC-BY-NC-SA. All declared in `LICENSES.md`. The non-commercial constraint is honored in perpetuity by the project's structural posture (no entity, no revenue, no exit).
- **NFR35 — Outlast-the-maintainer property.** Even if the canonical maintainer abandons the project, the live site, the source repository, the methodology corpus, the DOIs, and the archived snapshots remain readable, citable, and reproducible. The runtime-zero-build invariant + license sustainability + archival redundancy + DOI permanence are jointly the maintainer-independence mechanism.

### Self-Validation

The 35 NFRs above cover every quality attribute that prior sections established as load-bearing for v1:

- **Performance & web-app technical** (Step 7) → NFR1–NFR5
- **Security & data-protection posture** (Step 5 + Step 7) → NFR6–NFR11
- **Accessibility envelope** (Step 5 + Step 7 + Sally's reframe in Party Mode) → NFR12–NFR15
- **Reliability + Russia mirror-readiness + archival redundancy** (Step 5 + Step 8) → NFR16–NFR20
- **Auditability — IQ-ME's load-bearing trust premise** (Innovation pillars #2, #5; Step 5; Journey 4) → NFR21–NFR26
- **Content governance & translation equivalence** (Paige's reframe; Innovation #7; Step 7) → NFR27–NFR31
- **Maintainability for solo-dev posture** (Step 8) → NFR32–NFR35

The NFRs are jointly *the testable contract for HOW WELL the FRs must be delivered.* FRs define what capabilities exist; NFRs define the quality thresholds those capabilities must meet.
