---
id: 9a-2-icar-confirmation-arrival-licenses-md-reconciliation-slot-fulfillment
title: "Story 9a-2: ICAR confirmation arrival + LICENSES.md reconciliation + slot fulfillment"
status: ready-for-dev
---

# Story 9a-2: ICAR confirmation arrival + LICENSES.md reconciliation + slot fulfillment

## Story

As the IQ-ME maintainer closing Story 9a-1's outreach loop,
I want the written ICAR/SAPA confirmation (or constrained-permission letter) to arrive, commit as `ICAR-CONFIRMATION.pdf` at repo root (replacing the Epic-1 placeholder per Story 1.3), and any noted constraints to flow into `LICENSES.md` + the methodology provenance page,
so that the FR45 artifact slot is filled, the Epic-1 visible-fallback is removed, and downstream constraints (if any) are reflected in the canonical source-of-truth artifacts.

## ⚠️ HUMAN-GATED — do not fabricate

**This story cannot be completed by a coding agent.** Its load-bearing input is a **real external artifact**: a written reply from the ICAR/SAPA project (PDF or signed-email export). Until that reply physically exists, there is no honest deliverable. **Do NOT** generate a fake `ICAR-CONFIRMATION.pdf`, do **NOT** mark the gate closed, and do **NOT** edit `LICENSES.md` to assert constraints that were never communicated (governing lesson: lesson-2026-06-04-002). The doable precursor (outreach draft + log) shipped in Story 9a-1. This story executes **only when a real reply arrives**.

## Acceptance Criteria

1. **(gated on real reply)** When the ICAR/SAPA response is a confirmation (with or without constraints), the artifact (PDF or signed-email export) commits to repo root as `ICAR-CONFIRMATION.pdf`, replacing the Epic-1 pending placeholder.
2. `lint-trust-artifacts.mjs` (Epic 1) asserts the file exists, is non-empty, has a `last-modified` date in frontmatter, and is signed/verifiable.
3. **(gated on noted constraints)** If the confirmation carries constraints (attribution form, derivative restrictions), they flow into a single PR that updates: (a) `LICENSES.md` with the noted constraints, (b) `src/content/methodology/en/provenance/icar-license.md` (+ RU/PL parity per NFR27) with the constraint details, (c) the per-item rendering pipeline (Epic 4) if a specific attribution string must appear per item.
4. The Epic-1 visible-fallback ("pending — see methodology") in `/provenance/icar-license/` (set in Story 5.2) is replaced with the real confirmation summary, and the README's ICAR-confirmation reference resolves to the real artifact.
5. The outreach log `docs/launch-readiness/icar-outreach-log.md` (from Story 9a-1) attempts table is updated with the real date + outcome; Gate 9a is documented closed in `CHANGELOG.md`.
6. `make lint` exit 0, `make build` exit 0, full `make test` green; corpus parity (NFR27) holds for any provenance-page edit (mirror EN→RU/PL + bump `sourceHashEN`).

## Tasks / Subtasks

- [ ] **Task 1 (BLOCKED — human deliverable): receive the ICAR/SAPA written reply.** Send the Story 9a-1 draft, run the follow-up cadence (4wk reminder / 8wk secondary contact / 12wk fallback activation), and obtain a PDF or signed-email export. No agent action possible until this completes.
- [ ] **Task 2: author/extend the trust-artifact guard** asserting the committed `ICAR-CONFIRMATION.pdf` is non-empty, has a `last-modified` frontmatter date, and is not the placeholder; confirm RED against the placeholder. (test-author phase — executable once the reply exists)
- [ ] **Task 3: commit the real artifact** to repo root as `ICAR-CONFIRMATION.pdf`, replacing the placeholder (AC 1, AC 2). (impl phase)
- [ ] **Task 4: reconcile constraints** into `LICENSES.md` + `provenance/icar-license` (EN+RU+PL parity) + item pipeline if required (AC 3); replace the visible-fallback copy (AC 4). (impl phase)
- [ ] **Task 5: close-out** — update `icar-outreach-log.md` attempts table with the real outcome, add the `CHANGELOG.md` gate-close entry (AC 5). (impl phase)
- [ ] **Task 6: verification** — `lint-trust-artifacts` + `make lint` + `make build` + `make test` green; NFR27 parity verified (AC 6). (integration phase)

## Dev Notes

- **Blocked precondition:** Task 1 is an external-human deliverable. Do not start Tasks 2–6 until the real reply is in hand. If the fallback path fires instead (no reply by 12 weeks), scope shifts to the OpenPsychometrics-licensed subset — that is a separate scope-amendment touching Epic 2 engine + Epic 5 corpus and should be re-planned, not force-fit here.
- Editing any provenance corpus body triggers the NFR27 parity cascade: mirror EN change into PL/RU and bump `sourceHashEN` (sha256 of body-after-frontmatter).
- `ICAR-CONFIRMATION.pdf` is production source (git tamper-evidence, ADR-0014) — not a class-A integrity path; do not `tds integrity record` it.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): trust-critical placeholder content must never fabricate specifics. Apply: never synthesize a fake confirmation PDF or assert constraints that were not communicated; keep the slot as the visible-fallback placeholder until a real reply exists.
- lesson-2026-06-03-001 (high): `pr-checks.yml` wires tests per-job, not a greedy glob. Apply: if Task 2 adds a trust-artifact assertion, verify CI wiring (`grep` the spec/job in `.github/workflows/pr-checks.yml`).
- lesson-2026-05-20-007 (high): every story spec carries this section; stories touching class-A frozen tests re-register integrity. Apply: any edit to an existing frozen `lint-trust-artifacts` test requires `tds story unfreeze-tests` via the owning story + re-record.

### Project Structure Notes

- Touches (on execution): `ICAR-CONFIRMATION.pdf`, `LICENSES.md`, `src/content/methodology/{en,ru,pl}/provenance/icar-license*`, `README.md`, `CHANGELOG.md`, `docs/launch-readiness/icar-outreach-log.md`.
- Depends on Story 9a-1 (outreach draft + log) — done.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9a.2: ICAR confirmation arrival + LICENSES.md reconciliation + slot fulfillment]
- [Source: docs/launch-readiness/icar-outreach-draft.md] / [Source: docs/launch-readiness/icar-outreach-log.md] (Story 9a-1)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
