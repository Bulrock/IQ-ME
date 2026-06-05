# RU clinical-register translator outreach draft — IQ-ME (Gate 9c)

> **STATUS: PENDING — outreach not yet sent.** This is a recruitment draft template.
> Actual dispatch and follow-up are tracked in `ru-translator-outreach-log.md`.
> Sign-off document: [`ru-translator-signoff.md`](ru-translator-signoff.md)

---

## Purpose

IQ-ME requires a Russian-language, clinical-register-aware translator to:

1. **Author RU tail-scene copy** — Bottom-decile, mid-band, and top-decile result copy (`src/content/i18n/ru/tail-scenes.json`) in clinical Russian, not translated from EN. This includes the silent-companion-line (UX-DR26) and locale-switch-blocker-hint (UX-DR27, FR8 teachable-moment microcopy).
2. **Review RU methodology-corpus translation** — Check that the Epic 7 RU methodology pages (`src/content/methodology/ru/`) accurately convey the EN source in clinical-register Russian.
3. **Serve as reviewer-of-record** — Commit their name + GitHub handle (or verifiable pseudonym) as the documented RU clinical-register reviewer through v1.0.0.

This engagement closes Risks #5 (bottom-decile distress messaging) + I3 (paternalistic register in Russian) for the Russian-speaking primary audience.

---

## Candidate profile

- **Native Russian speaker** — natural clinical register, not book-translated.
- **Background in clinical/counselling psychology or psychometrics** — able to evaluate harm-mitigation framing for bottom-decile users (distress context).
- **Working bilingual translator** — can review EN→RU methodology corpus for accuracy and register.
- **GitHub account** — for reviewer-of-record commit and CODEOWNERS entry.

---

## Recruitment pools

Primary targets (in priority order):

1. **r/cognitiveTesting Russian-speakers** — Post a volunteer recruitment thread naming the scope and the clinical-register requirement.
2. **Russian-language psychology academic networks** — Faculty or graduate students in clinical/counselling psychology programs at Russian-language universities (Moscow, Saint Petersburg, Kyiv diaspora, Minsk — TBD per actual contacts).
3. **Russian-language translator communities** — Members of ProZ.ru or Russian-translator Telegram/Discord communities with clinical/psychology specialisation.
4. **Direct individual outreach** — TBD pending identification of named candidates through the networks above.
5. **Paid-review fallback** — If volunteer recruitment yields no commitment within 8 weeks, engage a paid bilingual clinical-psychology translator. Budget: **$300–$800** depending on scope and turnaround.

All candidates are listed as `TBD` until actual outreach identifies a willing reviewer. **Do not substitute fabricated names or handles.**

---

## Outreach message template

**Subject:** Volunteer translator request — IQ-ME open-source cognitive test (Russian clinical-register copy + methodology review)

---

Здравствуйте / Hi [Name],

I'm the maintainer of **IQ-ME** ([repository URL TBD after public launch]), an open-source, browser-based cognitive-ability test. We have a Russian-language build serving Russian-speaking users and need a native Russian speaker with a clinical psychology background to author and review specific copy.

**What we need:**

1. **RU tail-scene authoring** — bottom-decile, mid-band, and top-decile result copy in clinical-register Russian (≈800–1 200 words total). This copy must be authored in Russian, not translated from English — the register and harm-mitigation framing must be native.
2. **Methodology-corpus translation review** — review the existing EN→RU pages (≈10 pages) for accuracy and clinical-register appropriateness.
3. **Reviewer-of-record commitment** — document your name + GitHub handle in `docs/launch-readiness/ru-translator-signoff.md` as the RU clinical-register reviewer through v1.0.0.

**Time commitment:** estimated 4–8 hours; asynchronous via GitHub PR review.
**Compensation:** volunteer (no compensation at this stage); the paid fallback ($300–$800) is available if scheduling requires it.
**Timeline:** ideally complete within 6 weeks.
**Privacy:** your GitHub handle is the only identity information committed to the repo; no email, no telemetry, no personal data beyond what you choose to share on GitHub.

If you're interested, I can share the current draft copy and EN source for an initial look. If this falls outside your bandwidth, I'd welcome suggestions for colleagues with the right background.

Thank you / Спасибо,

[Maintainer name — TBD]
[Project URL — TBD after public launch]

---

## Fallback path

If no volunteer commits within 8 weeks of first outreach:

- Escalate to paid-review track ($300–$800 budget; scope as above).
- If paid review also fails (12 weeks total), document the constraint in `CHANGELOG.md` and surface as known risk in the launch-readiness checklist. Gate 9c remains open.

**Do NOT** AI-translate RU tail-scene copy as a fallback. The epic spec requires native-authored clinical-register Russian; AI translation does not satisfy that requirement.

---

_No reviewer has been contacted yet. All names above are `TBD` or candidate pools. This draft must not be treated as evidence that outreach has been sent or that any reply has been received._
