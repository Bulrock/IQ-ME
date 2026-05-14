---
title: "Product Brief: IQ-ME"
status: "complete"
created: "2026-05-14"
updated: "2026-05-14"
inputs:
  - /Users/maksim/git/IQ-ME/iq-me.html
  - subagent: artifact analyzer
  - subagent: competitive landscape research
  - subagent: IQ methodology survey (citations marked "needs verification" pending live web check)
  - review: skeptic
  - review: opportunity
  - review: scientific-integrity-and-ethics
---

# Product Brief: IQ-ME

## Executive Summary

**IQ-ME is a free, open-source, ad-free web app that lets anyone — especially Russian and Polish speakers underserved by the current market — take a scientifically-grounded fluid-reasoning test and trust the result.**

The free online IQ-test landscape is dominated by ad-tech funnels and freemium scams. A typical user invests 20+ minutes only to hit a paywall before seeing their score. The few honest options — Mensa Norway's matrix test most notably — are matrices-only, English-or-Norwegian-only, and offer no link to the methodology behind the score. Russian- and Polish-speaking users are particularly underserved: their localized options are largely translations of the same dark-pattern funnels.

IQ-ME closes that gap. Built on **publicly licensed, peer-reviewed item pools** (ICAR Matrix Reasoning, with its published IRT parameters and norms), shipped as a **single static site on GitHub Pages**, with **zero telemetry, zero signup, and every result linked to the methodology that grounds it**, IQ-ME is the cognitive screener you'd actually trust a friend to take. It is not a clinical IQ test — and it says so plainly, on the result page itself, not in a footnote.

## The Problem

A curious person — student, professional, parent, autodidact — wants to know roughly where their cognitive abilities sit. They search "free IQ test." What they find:

- **123test, iq-test.cc, Brain Metrics, FreeIQTest** — show questions, then demand $15–30 to "unlock your certificate"
- **Mensa national chapters** — short practice tests that upsell a paid proctored exam
- **Mensa Norway** — actually free, actually honest, but matrices-only, no Russian/Polish, no methodology page
- **Lumosity, Elevate, CogniFit** — subscription cognitive-training apps that explicitly disclaim IQ measurement

The Reddit consensus (r/cognitiveTesting, r/Mensa) is blunt: *"All online IQ tests are bullshit — except Mensa Norway, and even that's just matrices."*

People either pay for results they cannot verify, settle for inflated flattery scores from ad-funded sites, or give up. Non-English-speaking users in Eastern Europe simply have no good option in their native language.

## The Solution

IQ-ME is a single-page web app that delivers a **Gf (fluid reasoning) percentile estimate** drawn from a peer-reviewed, openly licensed instrument, in the user's chosen language. Users:

1. Open the page — no signup, no popups, no consent walls
2. Pick their language (EN / RU / PL) and start
3. Work through a randomized subset of the published ICAR Matrix Reasoning item set (calibrated items only)
4. See the result page, which presents:
   - **Gf percentile and IQ-scale equivalent side-by-side**, equally prominent (e.g., "Gf percentile: 82nd | IQ-scale: 118 ±10") — neither number stands alone without the other, so the user sees both the percentile context and the conventional IQ value at the same time
   - **An honest uncertainty band** that includes measurement *and* norming-sample uncertainty
   - A **qualitative band** label (e.g., "above average")
   - A **per-item-type breakdown**
   - Direct links to the **methodology page** and the peer-reviewed paper behind the items
   - An inline, non-dismissible **honest-caveats block** above the score

A retest produces a different item subset from the same calibrated pool, so a casual second attempt is not a perfect-recall exercise. (Full anti-gaming is impossible in an open-source static site — see caveats.)

## What Makes This Different

| Most "free" IQ tests | IQ-ME |
|---|---|
| Score paywalled | Free, forever |
| Sign up to see results | No account, no email |
| Ads and tracking | Zero telemetry |
| English (and maybe one other) | English, Russian, Polish from v1 |
| "Trust us, it's scientific" | Citations on every claim; source on GitHub |
| Inflated single number | Percentile + IQ-scale side-by-side, honest uncertainty band, per-item-type breakdown |
| Closed source, opaque scoring | MIT-licensed app, calibrated published items, scoring is open code |

The differentiator is **trust through transparency** — and a structural guarantee that incumbents cannot replicate: *no investors, no exit, no path to enshittification.* Every claim IQ-ME makes can be checked by reading the cited paper or the source code. The confidence band itself is a credibility asset — *"we'd rather show you a range than sell you a fake decimal."*

## Who This Serves

**Primary user, with a sharper focus:** **the Russian- and Polish-speaking curious adult** — the audience the existing free-IQ-test market has structurally failed. They are a substantial population, internet-native, currently choosing between translated paywall funnels and broken-Google-Translate'd English tests. A native-language, methodology-cited, signup-free option is genuinely absent. *The Mensa Norway of the Slavic web.*

**Secondary user: the English-speaking curious adult, worldwide.** Anyone who has Googled "free IQ test" in the last decade. They are skeptical of online tests and will reward a tool that respects their intelligence.

**Adjacent: students preparing for Mensa-style admission tests, and educators teaching psychometrics.** The methodology pages double as a short, plain-language primer on what fluid-reasoning testing actually is — a teaching resource in itself.

## Success Criteria

Success is defined narrowly and personally: **shipping a real, honest cognitive-screening tool.** Concretely:

1. **v1 ships** as a static site on GitHub Pages with one full ICAR Matrix Reasoning test, EN/RU/PL UI + methodology, responsive layout, dark mode, citations, and randomized draws from the calibrated item pool.
2. **Every claim is externally defensible** — one external psychometrician (paid or volunteer) reviews the methodology page and result-page copy before launch; their sign-off (or noted disagreements) ships with the app.
3. **Zero dark patterns** — no ads, no signup, no upsell, no telemetry; auditable from the source.
4. **Real users complete the v1 flow and find it credible** — five end-to-end testers in each of EN/RU/PL (15 total) take the test, read the result, and report (via a GitHub Discussions thread or direct outreach) whether the experience felt honest and the result felt credible. This is the launch gate.

Secondary signals if the project gains traction: GitHub stars, community pull requests (translations, new subtests), favorable mentions in the cognitive-testing communities that currently recommend Mensa Norway.

## Scope

### In scope for v1

- **One test**: ICAR Matrix Reasoning — restricted to the published, IRT-calibrated item set. No newly authored items in v1's scored pool. Randomization draws subsets of the published set.
- **Three languages**: EN, RU, PL — full UI + methodology page localization. Test instructions translated; matrix items themselves are non-verbal.
- **Responsive design** — phone, tablet, desktop.
- **Dark mode** — toggleable, respects system preference.
- **Modern, light visual design** — explicit departure from the warm-serif prototype aesthetic.
- **Result presentation**: Gf percentile and IQ-scale equivalent shown side-by-side, equally prominent, with a shared honest uncertainty band (including measurement *and* norming-sample uncertainty), a qualitative band, and per-item-type breakdown.
- **Inline honest-caveats block** on the result page, above the score, non-dismissible.
- **Distress-aware framing**: a line on the result page acknowledging that IQ is one narrow construct and does not determine worth, plus a link to a credible explainer (e.g., APA's IQ FAQ).
- **Methodology page** with citations, ICAR license attribution, explicit "what this is / isn't" statement.
- **Zero telemetry** — no analytics, no cookies. Results may be saved to user's localStorage if they opt in.
- **MIT-licensed app code** + **CC-BY-NC-SA (or item-author-specified) license for test content**, documented in `LICENSES.md`.
- **Pre-launch license confirmation** — written confirmation from the ICAR project (William Revelle / SAPA) that public free-self-assessment redistribution is permitted; documented in the repo.
- **GitHub Discussions enabled** as the no-telemetry feedback channel.

### Out of scope for v1 (deferred)

- Additional subtests: ICAR Letter & Number Series, ICAR 3D Rotation, Hagen Matrices Test — v1.1+ (HMT specifically blocked on documenting its exact open-access reuse license).
- Verbal reasoning subtests — v2 (English-only, due to translation/norming complexity).
- IRT-based adaptive testing — v2.
- Newly authored matrix items to enlarge the pool — out until they're independently calibrated (would otherwise silently invalidate scoring).
- Result history, accounts, syncing — likely never (conflicts with zero-telemetry posture).
- Social sharing, certificates, badges — explicitly not pursued (encourages misuse and inflates the score's perceived meaning).
- Opt-in score donation to a community norming sample — v2 consideration (requires backend, breaks pure-static constraint).
- Age-banded norms, child-specific norms — v2+.
- Native mobile apps — out of scope; the responsive web app handles this.

### Pre-launch checklist

- [ ] ICAR license use-case confirmed in writing
- [ ] LICENSES.md drafted (app MIT, items per upstream)
- [ ] Methodology page reviewed by one external psychometrician
- [ ] RU + PL translations reviewed by native-speaker volunteers (ideally one bilingual researcher per language)
- [ ] Scoring spec frozen: which raw→percentile table, which SEM, which uncertainty band formula
- [ ] 5 end-to-end testers per language complete v1 flow and respond credibility-wise

## Vision

In 2–3 years, IQ-ME is the reflexive answer in any forum thread that asks *"is there a real free IQ test online?"* — multilingual, broader in subtest coverage, openly auditable. A small community of contributors maintains translations and adds open subtests. Two adjacent artifacts emerge naturally:

- **The methodology pages** become a standalone plain-language psychometrics primer in EN/RU/PL, citable from Wikipedia and Reddit explainers — quietly raising public literacy on what IQ testing actually is and is not.
- **The scoring engine** (raw→percentile, IRT, honest uncertainty bands) can be extracted as a small reusable JS library that other open psychometric projects build on.

IQ-ME itself remains forever free, forever ad-free, forever non-commercial. *No investors, no exit, no enshittification path.* That is the entire ambition.

## Honest Caveats (carried verbatim into product copy)

- A single-session, unproctored web test cannot match clinical-grade IQ measurement. IQ-ME estimates **Gf (fluid reasoning) only**; it does not measure the full WAIS-style cognitive profile.
- The ICAR norming sample skews young, online, and educated. IQ-ME's raw percentiles inherit this bias; the score is best read as a **screening estimate**, with the displayed uncertainty band reflecting measurement error *and* norming-sample uncertainty.
- IQ is a contested construct. The methodology page links to mainstream critiques alongside foundational papers.
- An open-source, static-site item pool is **discoverable in the page source** — anyone who pre-memorizes items can game their own retest. Randomization reduces but cannot eliminate this. IQ-ME does not pretend otherwise.
- Translation of test instructions and UI into RU/PL is done in good faith. Matrix items themselves are non-verbal, but cultural familiarity with this puzzle format does vary across populations and is not corrected for.
- IQ-ME is for self-exploration and curiosity. It is **not** a clinical assessment and must not be used for medical, legal, employment, or educational placement decisions.
