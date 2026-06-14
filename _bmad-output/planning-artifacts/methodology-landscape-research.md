# IQ-ME Methodology Landscape Research

> **Status:** Research gate (Story 12-1, Epic 12). Gates the implementation stories 12-2 (pre-test selector), 12-3 (short/full variant engine), 12-4 (first non-geometric vertical slice), 12-5 (corpus comparison pages). Every accuracy/popularity claim cites a public, verifiable source. No psychometric statistics are invented for effect; where a specific figure is not independently verifiable here, it is described qualitatively and flagged.

## 1. Purpose & constraints

IQ-ME today ships **one** test: a geometric matrix-reasoning screen built on the ICAR (International Cognitive Ability Resource) Matrix Reasoning item pool, scored with an auditable IRT/EAP engine (`src/scoring/irt/*`). PR-15 asks to go beyond geometric matrix reasoning: the current test becomes the "short" variant of one methodology; additional methodologies and full/short variants are added; the user chooses methodology + variant before starting; and the methodology corpus describes and compares the tests by accuracy and popularity.

Hard constraints that shape the shortlist:

- **Licensing/openness.** IQ-ME redistributes a free self-assessment publicly. Only **openly-licensed** item pools are usable. Proprietary clinical batteries (WAIS, Stanford–Binet, commercial Raven's APM/SPM forms) are copyrighted and licensed — **not redistributable** — so they can be *referenced for context* but **not implemented**.
- **Browser-feasibility & zero-third-party.** Items must render client-side with no third-party assets (NFR21/NFR33): text, inline SVG, or simple interaction. No audio/video, no proctoring, no server scoring.
- **Auditable scoring.** New methodologies must score through (or parallel) the existing deterministic IRT path so golden-vector parity is achievable per variant (Story 12-3 constraint).
- **Anti-credentialization.** Every methodology carries the same not-a-clinical-assessment / not-a-credential posture as the existing test.

## 2. Candidate methodologies

The most defensible expansion path is **other ICAR subscales**, because IQ-ME already depends on the ICAR license and tooling — adding ICAR Verbal Reasoning, Letter/Number Series, or Three-Dimensional Rotation introduces **no new licensing risk** and reuses the SVG/text item pipeline.

| # | Methodology | Construct measured | Validity/accuracy basis (cited) | Popularity / recognition | Licensing / openness | Browser-feasible? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **ICAR Matrix Reasoning (ICAR-MR)** — *the existing IQ-ME test* | Fluid reasoning (Gf); nonverbal pattern completion | Matrix-reasoning tasks are a canonical marker of fluid intelligence and load strongly on g; ICAR-MR is a published, validated open pool [ICAR project; Condon & Revelle 2014]. | High — matrix reasoning is the most recognized nonverbal IQ format (Raven's family). | **Open** — ICAR CC BY-NC-SA (already used by IQ-ME). | ✅ Inline SVG (already shipped). |
| 2 | **ICAR Verbal Reasoning (ICAR-VR)** | Verbal/crystallized + reasoning; analogies, logic, vocabulary-in-context | Part of the published ICAR public-domain-style item set; verbal reasoning is a standard broad-ability marker (Gc/Gf blend) [ICAR project; Condon & Revelle 2014]. | High — verbal reasoning is a familiar test format. | **Open** — ICAR CC BY-NC-SA. | ✅ Pure text (localization-sensitive — see §5). |
| 3 | **ICAR Letter & Number Series (ICAR-LN)** | Inductive reasoning over sequences | Series-completion is a classic inductive-reasoning marker; ICAR-LN is part of the published open pool [ICAR project; Condon & Revelle 2014]. | Medium-high — series tasks are common in aptitude tests. | **Open** — ICAR CC BY-NC-SA. | ✅ Pure text (locale-robust: letters/digits). |
| 4 | **ICAR Three-Dimensional Rotation (ICAR-R3D)** | Spatial visualization / mental rotation | Mental rotation is a well-established spatial-ability marker; ICAR-R3D is part of the published open pool [ICAR project; Condon & Revelle 2014]. | Medium — spatial tests are recognized but less ubiquitous than matrices. | **Open** — ICAR CC BY-NC-SA. | ✅ Inline SVG (cube nets / rotations). |
| 5 | **Wechsler Adult Intelligence Scale (WAIS)** — *reference only* | Full-scale IQ across multiple indices | The most widely used individually-administered adult IQ battery; clinical gold-standard reference [Wechsler / Pearson, published test manuals]. | Very high — the best-known clinical IQ battery. | **Proprietary / licensed** — NOT redistributable. | ❌ Clinician-administered; not a browser self-test. |
| 6 | **Stanford–Binet Intelligence Scales** — *reference only* | Full-scale IQ; historical g measure | One of the oldest standardized IQ instruments; historical reference for the IQ scale [Roid / published manuals]. | Very high (historical recognition). | **Proprietary / licensed** — NOT redistributable. | ❌ Clinician-administered. |

**Sourcing note.** The primary, verifiable basis for candidates 1–4 is the **ICAR project (International Cognitive Ability Resource)** and its foundational paper (Condon, D. M., & Revelle, W., 2014, *The International Cognitive Ability Resource: Development and initial validation of a public-domain measure*, Intelligence). ICAR pools are openly published for research/self-assessment reuse. Candidates 5–6 are named only as recognizability/validity *context*; their manuals are proprietary and they are explicitly excluded from implementation. No specific correlation coefficient or norm figure is asserted here that is not traceable to those public sources; where a precise figure would be needed (e.g. exact g-loading), it is left for the corpus author (12-5) to cite directly from the source rather than invented here.

## 3. Recommended shortlist (implement these)

Implement the **openly-licensed ICAR subscales**, reusing the existing engine. Priority order balances recognizability, browser-feasibility, and localization robustness (EN/RU/PL):

| Priority | Methodology | Short variant | Full variant | Notes |
| --- | --- | --- | --- | --- |
| P0 (exists) | ICAR-MR (geometric matrix) | **16 items** (current) | **~24–32 items**, wider difficulty spread | The current 16-item screen is the short variant (12-3 adds the full variant). |
| P1 | ICAR-LN (letter/number series) | **12 items** | **~20 items** | Best first non-geometric slice (12-4): locale-robust (digits/letters), pure text, simplest to localize, reuses dichotomous IRT scoring. |
| P2 | ICAR-R3D (3-D rotation) | **10 items** | **~16 items** | SVG-renderable; spatial construct diversifies the battery. |
| P3 | ICAR-VR (verbal reasoning) | **12 items** | **~20 items** | Highest localization cost (verbal content must be carefully translated EN/RU/PL); schedule after P1/P2. |

**Variant design principle.** Short = fewer items with a calibrated spread; Full = more items with broader difficulty coverage for tighter standard error. Both score through the existing deterministic IRT/EAP path so golden-vector parity holds per variant (12-3).

**Excluded (flagged unsuitable):** WAIS, Stanford–Binet, commercial Raven's APM/SPM — proprietary/licensed, not redistributable, and clinician-administered; referenced in the corpus for context only.

## 4. Corpus content required for PR-15 (input to Story 12-5)

Story 12-5 must author (EN, mirrored to PL/RU per NFR27):

1. **A description page per implemented methodology** (ICAR-MR, ICAR-LN, ICAR-R3D, ICAR-VR as shipped): what it measures, how to read the result, the construct's place in the fluid/crystallized/spatial map, and its openness/licensing.
2. **An accuracy/popularity comparison page** placing the tests side by side — what each measures, relative recognizability, and the honest caveat that a short browser screener is a *screen*, not a clinical diagnosis. Every comparative claim cites a source (claims-manifest discipline).
3. **Sidebar links** for the new pages (consistent with PR-11) with no broken links (PR-12b).

## 5. Browser-feasibility & localization notes

- **ICAR-LN / ICAR-VR are text** → the item *content* is localization-sensitive. ICAR-LN (letters/digits) is largely locale-robust; **ICAR-VR requires careful EN/RU/PL translation** of verbal items (highest cost, lowest priority). Matrix/spatial items are language-neutral SVG.
- All items render as inline SVG or text — **no third-party asset, no CDN** — preserving the zero-third-party network-trace assertion.
- Scoring reuses the dichotomous (0/1) response model already in `state.js` / the IRT engine; each methodology needs its own calibrated `item-parameters` set (difficulty/discrimination) sourced from the ICAR pool, analogous to the existing `src/items/item-parameters.json`.

## 6. Gating contract (downstream stories)

This research gates implementation. The follow-on stories proceed **only** from this shortlist, and **no implementation story proceeds on an unsourced methodology**:

| Story | Scope | Methodology input from this artifact |
| --- | --- | --- |
| 12-2 | Pre-test methodology + variant (short/full) selection step | The shortlist (§3) populates the selector; ICAR-MR is the default. |
| 12-3 | Short/full variant engine for ICAR-MR | The ICAR-MR short (16) / full (~24–32) variant design (§3). |
| 12-4 | First non-geometric methodology — end-to-end vertical slice | **ICAR-LN** (P1) — chosen for locale-robustness + lowest implementation cost. |
| 12-5 | Methodology corpus per-test descriptions + comparison | The corpus content list (§4), sourced per §2. |

> Additional per-methodology stories (ICAR-R3D, ICAR-VR) are created from this shortlist after 12-4 lands, each with its own sourced item-parameter set.

## 7. References (public, verifiable)

- **ICAR project** — International Cognitive Ability Resource (openly-published cognitive-ability item pools; the licensing basis IQ-ME already uses for ICAR-MR).
- **Condon, D. M., & Revelle, W. (2014).** *The International Cognitive Ability Resource: Development and initial validation of a public-domain measure.* Intelligence, 43, 52–64. (Foundational ICAR validation; the cited basis for candidates 1–4.)
- **Wechsler Adult Intelligence Scale (WAIS)** — Pearson published test manuals (proprietary; referenced as recognizability/validity context only, excluded from implementation).
- **Stanford–Binet Intelligence Scales** — published manuals (proprietary; context only).
- IQ-ME existing baseline: `src/items/item-parameters.json` (ICAR-MR calibrated pool), `src/scoring/irt/*` (auditable EAP engine), `corpus/` methodology descriptions.
