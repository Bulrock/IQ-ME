# RU translator-of-record sign-off (Gate 9c)

> **STATUS: PENDING — not yet signed off.** This is a launch-readiness stub.
> Reviewer: **TBD** (`@TBD-ru-clinical-register`) · Date: **pending** · Gate: **9c (RU clinical-register translator) — backlog**

Per the Epic-7 dev-phase decision (infra-now), the RU clinical-register copy is authored by the named Gate-9c reviewer-of-record — **not** translated from EN by AI or the maintainer. Until Gate 9c closes, every deliverable below is **NOT YET SIGNED OFF**.

## Enumerated deliverables (Sally's belt-and-suspenders — all required)

Each item must be authored/curated in clinical-register Russian by the reviewer-of-record and explicitly signed off here. **Any deliverable not enumerated and signed off below is treated as not-yet-signed-off and BLOCKS Epic 10 launch.**

1. [ ] **tail-scene-bottom copy** — bottom-decile result copy (`src/content/i18n/ru/tail-scenes.json` → `scenes.bottom-decile.copy`). _Not yet signed off._
2. [ ] **tail-scene-mid copy** — mid-band result copy (`scenes.mid-band.copy`). _Not yet signed off._
3. [ ] **tail-scene-top copy** — top-decile result copy (`scenes.top-decile.copy`). _Not yet signed off._
4. [ ] **silent-companion-line copy** (UX-DR26) — `scenes.bottom-decile.silentCompanionLine`. _Not yet signed off._
5. [ ] **locale-switch-blocker-hint copy** (UX-DR27 — Story 7.2) — the FR8 teachable-moment hint microcopy in RU. _Not yet signed off._
6. [ ] **crisis-resources list curation** (Story 7.7) — `src/content/crisis-resources/ru.json`, vetted native-language resources. _Not yet signed off._
7. [ ] **retest-effect copy on the result page** (Story 6.7) — the RU retest-note replacing the EN placeholder. _Not yet signed off._

## Sign-off block (to be completed by the reviewer-of-record at Gate-9c close)

- Reviewer name: _pending_
- GitHub handle: _pending_ (replaces `@TBD-ru-clinical-register` in `.github/CODEOWNERS` once Gate 9c is documented closed in `CHANGELOG.md`)
- Date of sign-off: _pending_
- Scope of sign-off: _pending — must enumerate items 1–7 above_

When this gate closes: overwrite the RU placeholder copy with the reviewer's clinical-register Russian, flip `clinicalRegisterReviewed` to `true` and `_meta.translationStatus` to `complete` in `ru/tail-scenes.json`, replace the CODEOWNERS handle, and check off every box above.
