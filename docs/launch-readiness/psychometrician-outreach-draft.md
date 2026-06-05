# Psychometrician outreach draft — IQ-ME scoring-spec / methodology review (Gate 9b)

> **STATUS: PENDING — outreach not yet sent.** This is a recruitment draft template.
> Actual dispatch and follow-up are tracked in `psychometrician-outreach-log.md`.

---

## Purpose

IQ-ME requires an independent psychometrician to review:

1. **Scoring engine** — IRT-based θ estimation logic (`src/scoring/`, `METHODOLOGY_CLAIMS.json`), the IRT parameter assumptions, and the scoring-spec freeze.
2. **Methodology corpus** — Explanation pages (`src/content/methodology/en/`) for accuracy, APA Standards alignment, and appropriate claims.
3. **Result-page copy** — Tail-scene copy (`src/content/i18n/en/tail-scenes.json`) for clinical-register appropriateness, harm-mitigation framing, and bottom-decile messaging.
4. **APA Standards alignment** — Cross-cutting check that claims and score-report framing conform to *APA Standards for Educational and Psychological Testing* (2014).

This review closes Risk #11 (psychometrician sign-off blocked or delayed) and substantiates the "auditable IRT" claim in the project's Innovation pillar.

---

## Reviewer pool

Primary targets (in priority order):

1. **William Revelle and the Revelle lab** — IPIP/individual-differences researchers at Northwestern who have published on IRT scoring and personality measurement; directly relevant to ICAR-adjacent methodology.
2. **Individual-differences course instructors** — Faculty teaching psychometrics or psychological measurement at research universities (TBD — identify 3–5 candidates via course listings).
3. **Psychometrics / quantitative-psychology practitioners** — Working psychometricians with IRT experience, identified via the National Council on Measurement in Education (NCME) member directory or professional networks.
4. **Paid-review fallback** — If volunteer recruitment yields no commitment within 8 weeks, engage a paid reviewer via an established psychometrics consulting firm or freelance practitioner. Budget: **$500–$2 000** depending on scope and turnaround.

All candidates are listed as `TBD` until actual outreach identifies a willing reviewer. **Do not substitute fabricated names.**

---

## Outreach message template

**Subject:** Volunteer psychometric review request — open-source IQ-ME adaptive test (IRT scoring + methodology corpus)

---

Hi [Name],

I'm the maintainer of **IQ-ME** ([repository URL TBD after public launch]), an open-source, browser-based cognitive-ability test built on ICAR Matrix Reasoning items (CC BY-NC-SA) with a 3PL IRT scoring engine.

I'm seeking an independent psychometrician to review three interconnected artifacts before v1.0.0 launches:

1. The **IRT scoring spec** (θ estimation, parameter assumptions, calibration approach) — approximately 800 words + code references.
2. The **methodology corpus** — 8–10 explanation pages aimed at informed lay readers, covering what IQ-ME measures, what it doesn't, and how scores are interpreted.
3. The **result-page copy** — harm-mitigation framing for bottom-decile users (clinical-register appropriateness, no pathologising language).
4. **APA Standards alignment check** — that claims and score-report framing are consistent with *APA Standards for Educational and Psychological Testing* (2014).

**Time commitment:** approximately 3–5 hours; asynchronous via GitHub PR review.
**Compensation:** volunteer (no compensation at this stage); the paid-review fallback ($500–$2 000) is available if scheduling requires it.
**Timeline:** I'd like to complete the review loop within 4–6 weeks.
**Output:** Your name + GitHub handle (or verifiable pseudonym) documented as reviewer-of-record in `docs/launch-readiness/psychometrician-signoff.md`, with your sign-off date, scope, and any stated reservations.

If you're open to this, I can share the current artifacts for an initial look. If this falls outside your bandwidth or interests, I'd appreciate any suggestions for colleagues who work with IRT-based adaptive tests.

Thank you for your time.

[Maintainer name — TBD]
[Project URL — TBD after public launch]

---

## Fallback path

If no volunteer commits within 8 weeks of first outreach:

- Escalate to paid-review track ($500–$2 000 budget; scope as above).
- If paid review also fails (12 weeks total), document the constraint in `CHANGELOG.md` and surface as a known risk in the launch-readiness checklist. Gate 9b remains open until a real reviewer signs.

The `ICAR-CONFIRMATION.pdf` slot and scoring-spec claims **must not be altered** to paper over an absent reviewer.

---

## What will be committed when the reviewer signs

When a real reviewer commits:

- Their name + handle (or verifiable pseudonym) documented in `psychometrician-signoff.md`.
- Any methodology revisions they require flow into Epic 5 pages and `METHODOLOGY_CLAIMS.json + page asserts:`.
- Any result-page copy revisions flow into Epic 6 EN tail-scenes.
- Each revision PR cites this story (9b-1) and the reviewer's stated requirement.
- Final sign-off committed to `psychometrician-signoff.md` with name / handle / date / scope / reservations.

---

_No reviewer has been contacted yet. All names above are `TBD` or candidate pools. This draft must not be treated as evidence that outreach has been sent or that any reply has been received._
