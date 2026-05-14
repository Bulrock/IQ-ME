---
title: "Product Brief Distillate: IQ-ME"
type: llm-distillate
source: "product-brief-IQ-ME.md"
created: "2026-05-14"
purpose: "Token-efficient context for downstream PRD creation, architecture, and story breakdown"
---

# IQ-ME — Detail Pack

## Product identity

- **Name (final):** IQ-ME — confirmed by user; matches repo name and existing prototype `<title>`
- **Type:** Free, open-source, non-commercial web app — single-page static site
- **Primary deliverable:** Gf (fluid reasoning) percentile + IQ-scale equivalent (shown side-by-side, equally prominent) with honest uncertainty band
- **North-star definition of success (user's own words):** "Shipping a real, honest IQ tool" — personal-satisfaction metric, not commercial
- **Solo dev, AI-assisted** — argues against any complex toolchain or maintainer-heavy stack

## Technical constraints (hard requirements)

- **Static HTML/CSS/JS only** — no backend, no build server, no API endpoint at runtime
- **Deployment target:** GitHub Pages (free hosting)
- **Existing prototype is zero-dependency vanilla JS** (`iq-me.html`, ~310 lines, single file) — likely template for the v1 architecture
- **No package.json, no framework, no build step** to date — user is comfortable with this; if a build step is added later, output must still be static and ad-free
- **Zero telemetry** — no analytics, no cookies, no tracking pixels. Anonymous hit counter (e.g., GoatCounter) was offered and **rejected**.
- **localStorage** — allowed only for user-opt-in result saving and language preference. Not for anything resembling tracking.
- **Responsive design** required from v1 (phone / tablet / desktop)
- **Dark mode** required from v1 (toggleable + respects `prefers-color-scheme`)

## Existing prototype (`/Users/maksim/git/IQ-ME/iq-me.html`)

- Single self-contained HTML file with inline CSS + JS
- Current palette (to be **replaced** with modern light scheme): `--bg #efe7d7, --paper #fffdf8, --ink #201c17, --teal #0f766e, --rust #b45309, --gold #f4d35e`
- Current font: Georgia / Times New Roman serif (warm-paper aesthetic) — **explicitly rejected** by user as "old-style"; new design must be modern + light
- Existing scoring formula (to be **replaced**): `iq = round(70 + (p*0.4 + v*0.3 + m*0.3) * 75)` — yields 70–145, naive, not psychometric
- Current items: 12 hardcoded (4 pattern + 4 verbal + 4 memory) — must be replaced with calibrated ICAR-MR pool subset
- Current item types drafted in prototype: number-series, syllogism, rotation, analogy, synonym, odd-one-out, digit-span-reverse, letter-pair series, sequence recall, mental arithmetic countdown — none citation-backed; treat as illustrative only
- State is in-memory only (`state = {i:0, a:{}}`) — no persistence
- Current layout responsive at 900px breakpoint
- Current copy includes good disclaimer language worth keeping in spirit: *"real IQ measurement depends on standardized timing, age norms, reliable scoring, and professional interpretation. This page is for self-exploration only."*

## v1 scope (frozen)

**In scope:**
- One test: **ICAR Matrix Reasoning** — published, IRT-calibrated item set only
- Randomization: draw a subset (size TBD — see open questions) from the calibrated published pool
- Three full UI + methodology localizations: **EN, RU, PL**
- Result page: side-by-side Gf percentile + IQ-scale equivalent, honest uncertainty band (measurement + norming sample), qualitative band, per-item-type breakdown, inline non-dismissible caveats above the score, distress-aware framing line + link
- Methodology page: ICAR attribution, validating paper citations, plain-language "what this is / isn't"
- License: **MIT** for app code; **CC-BY-NC-SA** (or upstream-author-specified) for test content; documented in `LICENSES.md`
- GitHub Discussions enabled as no-telemetry feedback channel

**Out of v1 (deferred / explicitly not pursued):**
- Additional subtests: ICAR Letter & Number Series, ICAR 3D Rotation, Hagen Matrices Test → v1.1+
- Verbal reasoning subtests → v2 (English-only, due to translation/norming complexity)
- IRT-based adaptive testing → v2
- Newly authored matrix items in scored pool → never until externally calibrated (would silently invalidate norms)
- Result history, accounts, syncing → likely never (conflicts with zero-telemetry)
- Social sharing, certificates, badges → explicitly rejected (encourages misuse, inflates perceived meaning)
- Opt-in score donation to a community norming sample → v2 consideration (requires backend, breaks static constraint)
- Age-banded norms, child-specific norms → v2+
- Native mobile apps → never (responsive web handles it)
- Anonymous hit counters or aggregate-usage telemetry → rejected by user

## Rejected ideas (don't re-propose)

- **Warm serif "paper" aesthetic** of current prototype — explicit reject; user wants modern + light
- **Single fixed 12-item quiz** of current prototype — must be larger randomized pool
- **Naive linear 70–145 scoring** of current prototype — must be norm-referenced from published ICAR norms
- **Per-item correctness feedback during test** (present in prototype) — conflicts with standard psychometric admin; default-off in v1
- **Anonymous aggregate hit counter** — user rejected when offered
- **Opt-in score donation** to build community norms — breaks static-site constraint; deferred
- **Score paywall / certificate upsell** — would invalidate the entire trust premise
- **Social sharing / certificates / badges** — explicitly rejected on ethical grounds

## Methodology research (citations marked "needs verification" — re-check URLs before publishing)

- **ICAR (International Cognitive Ability Resource)** — Condon & Revelle, *Intelligence* 43 (2014) — the load-bearing instrument for IQ-ME. Items released for non-commercial research and educational use; **must obtain written confirmation from Revelle / SAPA project that "free public self-assessment" redistribution is permitted** before launch.
- **ICAR-MR (Matrix Reasoning)** — ~11 items in the canonical public set; recommended core for v1
- **ICAR-LNS (Letter & Number Series)** — 16 items, language-light (number-only variant viable for RU/PL) — v1.1 candidate
- **ICAR-R3D (3D Rotation)** — 24 items, purely visuospatial, harder to reverse-image-search — v1.1 candidate
- **ICAR-16** — published short form, correlates ~0.80 with full-scale IQ in Condon & Revelle's validation
- **Norming sample:** SAPA web sample, n > 97,000 in 2014 — skews young, online, educated (must be disclosed)
- **Hagen Matrices Test (HMT-S)** — Heydasch / Renner / Haubrich; open access; **blocked on documenting precise reuse license + image-license** before inclusion. Validates against Raven's APM.
- **Proprietary instruments (do NOT use items from):** Raven's Progressive Matrices (Pearson), WAIS / WISC (Pearson), Stanford-Binet (Riverside / Houghton-Mifflin), Cattell CFIT (IPAT), Kaufman KABC/KBIT (Pearson), **Mensa Norway items** (not openly licensed despite being free to take)
- **Scoring approach options for v1:** (a) CTT — raw sum → z-score against published ICAR mean/SD → IQ = 100+15z (simplest, defensible for screening); (b) IRT 2PL/3PL using ICAR's published item parameters → θ → IQ (more defensible at extremes, more code). **Open question: which for v1.**
- **Uncertainty band must include** measurement error (SEM) *and* norming-sample bias — true uncertainty is wider than typical SEM-only display. Integrity reviewer flagged ±10 as too narrow; honest ±13–15 may be appropriate.

## Competitive intelligence (deep-dive worth preserving)

- **Mensa Norway (test.mensa.no)** — de-facto trusted free IQ test for the Reddit / r/cognitiveTesting / r/Mensa community. Matrices-only, ~35 items, no signup, instant score. **The "gold standard" IQ-ME must equal or exceed in trustworthiness, with the wedge being multilingual support and methodology citations.**
- **123test.com** — multilingual (EN/NL/DE/ES/FR — but no RU/PL), cites CFIT/Cattell, but ad-heavy, partial-results-free + upsell-for-full-PDF, signup nudges
- **iq-test.cc / Brain Metrics Initiative (BMI) / iq-test.net family** — classic dark pattern: free test → paywall $15–30 before showing score/certificate. Frequently flagged as scams on Reddit.
- **IQexams / FreeIQTest.net / IQTest.com** — ad-saturated, inflated scores, no science
- **Mensa national chapter practice tests** — funnel toward paid proctored admission test; no real score
- **Lumosity / CogniFit / Elevate / BrainHQ** — adjacent cognitive-training subscriptions; **explicitly disclaim IQ measurement** → leave a gap IQ-ME fills
- **User sentiment (Reddit reflex):** *"All online IQ tests are bullshit except Mensa Norway"* — IQ-ME's job is to become the multilingual + methodology-cited extension of that recommendation

## Underserved audience (load-bearing positioning)

- **Russian and Polish speakers** are the sharpest underserved segment — most localized IQ sites are translations of the same paywalled BMI-style funnels
- **Distribution risk:** RU/PL users live in different ecosystem (VK, Habr, Wykop) than Reddit/HN; native-language SEO and community presence are different. Brief flags this but does not solve it.
- **Russia-specific access risk:** GitHub Pages is intermittently blocked/throttled in Russia. v1 should consider a mirror or alternative host before claiming serves Russian-speaking audience.

## Pre-launch checklist (gates before v1 ships)

1. ICAR license use-case confirmed in writing (email Revelle / SAPA)
2. `LICENSES.md` drafted (app MIT, items per upstream)
3. Methodology page reviewed by one external psychometrician (volunteer ideally — outreach via r/cognitiveTesting, academic networks; paid otherwise)
4. RU + PL UI translations reviewed by native speakers (ideally one bilingual researcher per language)
5. Scoring spec frozen: which raw→percentile table, which SEM, which uncertainty-band formula (CTT vs IRT — see open questions)
6. 5 end-to-end testers per language complete v1 flow and report credibility-wise via GitHub Discussions

## Open questions (unresolved during discovery — for PRD / architecture phase)

- **Scoring algorithm for v1:** CTT (raw → z → IQ) vs IRT 2PL/3PL? Trade-off: simplicity vs. defensibility at score extremes
- **Item-pool size for randomization:** ICAR-MR has ~11 published items; if a test draws ~8 per session, retest item-set differentiation is limited. Larger pool requires either including ICAR-LNS / R3D earlier or adding non-scored practice items.
- **External psychometrician:** specific person / outreach plan? Volunteer or paid? Latency on this is the v1-launch critical path.
- **i18n architecture:** JSON locale bundles loaded client-side? Inline data? Build-time substitution? (Must remain static-hostable.)
- **Test instructions translation:** matrix items are non-verbal, but instructions are not — Polish/Russian familiarity with matrix-puzzle format varies and is not corrected for. Plan?
- **Anti-leakage mitigation:** items + answer keys are in client bundle (unavoidable on static site). Plan: large-pool randomization, image-rotation/reflection augmentation, plus honest disclosure. Sufficient?
- **Russia GitHub Pages blocking:** mirror strategy? Alternative deploy target?

## Reviewer-surfaced strategic ideas (worth carrying into roadmap thinking)

- **Methodology pages as a standalone resource** — EN/RU/PL plain-language psychometrics primer, citable from Wikipedia / Reddit explainers. Could become more discoverable than the test itself.
- **Extracted scoring engine library** — open JS package (`@iq-me/psychometrics` or similar) for raw → percentile, IRT, honest uncertainty bands. Reusable by other open psychometric projects.
- **Anti-dark-pattern reference implementation** — repo doubles as a worked example of an honest web app (no telemetry, source-readable claims, citations on every assertion) for the broader "humane software" community.
- **Distribution channels worth seeding:** r/cognitiveTesting, r/Mensa, r/slavlangs, language-specific subs, Hacker News, awesome-lists, F-Droid-equivalent web directories, Framasoft / European digital-commons catalogues, Wikipedia external-links sections
- **Partnership candidates (academic legitimacy lever):** ICAR / SAPA project authors (Revelle group, Northwestern); university psychology / individual-differences course instructors; psychometric OSS authors
- **Forking-ethics note for README:** MIT means a fork can strip caveats and add ads. Brief notes this is a risk; consider asking (not requiring) forkers to preserve caveats and naming.

## Unverified citations to re-check live before publishing

1. Condon, D. M., & Revelle, W. (2014). *The International Cognitive Ability Resource: Development and initial validation of a public-domain measure.* Intelligence, 43, 52–64. (needs verification)
2. Dworak, Revelle, & Condon (2021) — *Flynn effects in a recent online U.S. adult sample.* Intelligence, 87. (needs verification)
3. Young & Keith (2020) — *Convergent validity of the ICAR-16.* Frontiers in Psychology. (needs verification)
4. Heydasch, Haubrich, & Renner (2013–2017) — *Short version of the Hagen Matrices Test (HMT-S).* (needs verification)
5. McGrew, K. S. (2009) — *CHC theory and the human cognitive abilities project.* Intelligence, 37(1), 1–10. (needs verification)
6. SAPA Project — https://www.sapa-project.org (needs verification)
7. Open-Psychometrics — https://openpsychometrics.org (live host of mixed-license community tests)
8. APA *Standards for Educational and Psychological Testing* (2014) — for ethical disclosure framing (needs verification)

## Repo state at brief completion

- `iq-me.html` — existing prototype; reference only, will be superseded by v1 build
- `_bmad/`, `_bmad-output/`, `.claude/` — BMAD + TDS tooling installed; no product planning artifacts authored yet outside this brief
- `docs/` — empty
- `{output_folder}/planning-artifacts/` — literal directory created by unresolved installer variable; this brief and distillate live here. Consider renaming on next BMAD config pass.
- Recent commits: `feat: add tds module`, `init: bmad-tds-module into project` — no product code yet
