# PL clinical-register translator outreach draft — IQ-ME (Gate 9d)

> **STATUS: PENDING — outreach not yet sent.** This is a recruitment draft template.
> Actual dispatch and follow-up are tracked in `pl-translator-outreach-log.md`.
> Sign-off document: [`pl-translator-signoff.md`](pl-translator-signoff.md)

---

## Purpose

IQ-ME requires a Polish-language, clinical-register-aware translator to:

1. **Author PL tail-scene copy** — Bottom-decile, mid-band, and top-decile result copy (`src/content/i18n/pl/tail-scenes.json`) in clinical Polish, not translated from EN. This includes the silent-companion-line (UX-DR26) and locale-switch-blocker-hint (UX-DR27, FR8 teachable-moment microcopy).
2. **Review PL methodology-corpus translation** — Check that the Epic 7 PL methodology pages (`src/content/methodology/pl/`) accurately convey the EN source in clinical-register Polish.
3. **Serve as reviewer-of-record** — Commit their name + GitHub handle (or verifiable pseudonym) as the documented PL clinical-register reviewer through v1.0.0.

This engagement closes Risks #5 (bottom-decile distress messaging) + I7 (translation drift) for the Polish-speaking primary audience. The PL reviewer is independent of the RU reviewer (Gate 9c) — per-language independent-failure-isolation ensures that one gate can close without waiting for the other.

---

## Candidate profile

- **Native Polish speaker** — natural clinical register, not book-translated.
- **Background in clinical/counselling psychology or psychometrics** — able to evaluate harm-mitigation framing for bottom-decile users (distress context).
- **Working bilingual translator** — can review EN→PL methodology corpus for accuracy and register.
- **GitHub account** — for reviewer-of-record commit and CODEOWNERS entry.
- **Independent of the RU translator** — per Mary's accountability-surface argument, PL and RU gates must not share a single point of failure.

---

## Recruitment pools

Primary targets (in priority order):

1. **Polish psychology academic networks** — Faculty or graduate students in clinical/counselling psychology programs at Polish universities (Warsaw, Kraków, Wrocław, Gdańsk — TBD per actual contacts).
2. **Wykop / Polish-language Reddit** — Post a volunteer recruitment thread naming the scope and the clinical-register requirement on relevant Polish-language communities.
3. **Polish-philology translator networks** — Members of Polish translator associations or communities with clinical/psychology specialisation.
4. **Direct individual outreach** — TBD pending identification of named candidates through the networks above.
5. **Paid-review fallback** — If volunteer recruitment yields no commitment within 8 weeks, engage a paid bilingual clinical-psychology translator. Budget: **$300–$800** depending on scope and turnaround.

All candidates are listed as `TBD` until actual outreach identifies a willing reviewer. **Do not substitute fabricated names or handles.**

---

## Outreach message template

**Subject:** Volunteer translator request — IQ-ME open-source cognitive test (Polish clinical-register copy + methodology review)

---

Dzień dobry / Hi [Name],

I'm the maintainer of **IQ-ME** ([repository URL TBD after public launch]), an open-source, browser-based cognitive-ability test. We have a Polish-language build serving Polish-speaking users and need a native Polish speaker with a clinical psychology background to author and review specific copy.

**What we need:**

1. **PL tail-scene authoring** — bottom-decile, mid-band, and top-decile result copy in clinical-register Polish (≈800–1 200 words total). This copy must be authored in Polish, not translated from English — the register and harm-mitigation framing must be native.
2. **Methodology-corpus translation review** — review the existing EN→PL pages (≈10 pages) for accuracy and clinical-register appropriateness.
3. **Reviewer-of-record commitment** — document your name + GitHub handle in `docs/launch-readiness/pl-translator-signoff.md` as the PL clinical-register reviewer through v1.0.0.

**Time commitment:** estimated 4–8 hours; asynchronous via GitHub PR review.
**Compensation:** volunteer (no compensation at this stage); the paid fallback ($300–$800) is available if scheduling requires it.
**Timeline:** ideally complete within 6 weeks.
**Privacy:** your GitHub handle is the only identity information committed to the repo; no email, no telemetry, no personal data beyond what you choose to share on GitHub.

If you're interested, I can share the current draft copy and EN source for an initial look. If this falls outside your bandwidth, I'd welcome suggestions for colleagues with the right background.

Thank you / Dziękuję,

[Maintainer name — TBD]
[Project URL — TBD after public launch]

---

## Fallback path

If no volunteer commits within 8 weeks of first outreach:

- Escalate to paid-review track ($300–$800 budget; scope as above).
- If paid review also fails (12 weeks total), document the constraint in `CHANGELOG.md` and surface as known risk in the launch-readiness checklist. Gate 9d remains open.

**Do NOT** AI-translate PL tail-scene copy as a fallback. The epic spec requires native-authored clinical-register Polish; AI translation does not satisfy that requirement.

---

_No reviewer has been contacted yet. All names above are `TBD` or candidate pools. This draft must not be treated as evidence that outreach has been sent or that any reply has been received._
