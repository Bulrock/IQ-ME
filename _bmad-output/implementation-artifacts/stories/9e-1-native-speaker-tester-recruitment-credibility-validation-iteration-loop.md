---
id: 9e-1-native-speaker-tester-recruitment-credibility-validation-iteration-loop
title: "Story 9e-1: Native-speaker tester recruitment + credibility validation + iteration loop"
status: ready-for-dev
---

# Story 9e-1: Native-speaker tester recruitment + credibility validation + iteration loop

## Story

As the IQ-ME maintainer closing Risk #12 (credibility threshold not met → kills launch),
I want to recruit a 5×3 tester cohort spanning the four user archetypes (Anna mid-band, Mikhail bottom-decile, Daria top-decile, Tomáš skeptic) per language, run them through the Epic-6/Epic-7 build, collect credibility verdicts on a GitHub Discussions thread, iterate on copy until the launch-gate threshold is met, and document the final credibility report,
so that the experiential launch gate (≥12/15 overall AND ≥4/5 per language — no single-language failure masked by aggregation) is closed and v1.0.0 ships with externally-validated tester-credibility signal.

## ⚠️ HUMAN-GATED — do not fabricate

The **recruitment-post draft + recruitment log + credibility-report scaffold** are doable now. The **actual tester verdicts and the 12-of-15 credibility report** require real human testers running the test and posting on GitHub Discussions. **Do NOT** fabricate testers, verdicts, handles, or a passing credibility tally; **do NOT** mark the gate closed (governing lesson: lesson-2026-06-04-002; Risk #12 explicitly forbids shipping below threshold). The report stays an explicit PENDING scaffold until real verdicts arrive.

## Acceptance Criteria

1. A recruitment-post draft exists at `docs/launch-readiness/tester-recruitment-draft.md`: explains the volunteer ask (run the test, post a credibility verdict on a GitHub Discussions thread), the ~30-minute time commitment, the no-compensation posture, and the privacy posture (no email, no telemetry — testers identify only by GitHub handle). Names the per-language archetype-balance target (≥1 bottom-decile, ≥1 top-decile, ≥1 skeptic per language). No fabricated specifics.
2. A recruitment log exists at `docs/launch-readiness/tester-recruitment-log.md` with a `STATUS: PENDING` banner, an attempts/cohort table (all `pending`), and the recruitment-channel list (r/cognitiveTesting + native-language psychology forums + RU/PL cognitive-testing communities).
3. A credibility-report scaffold exists at `docs/launch-readiness/tester-credibility-report.md` with: a `STATUS: PENDING` banner, the explicit threshold (≥12/15 overall AND ≥4/5 per language), an empty per-language tally table (EN/RU/PL — all `pending`), an iteration-history section (empty), and the Risk #12 "do not ship below threshold even if launch slips" note. It must NOT report any passing tally.
4. **(gated on real testers)** When verdicts arrive: tabulate credible/not-credible per tester per language; iterate offending copy with the relevant Gate-9c/9d reviewer; redeploy; re-test until threshold met OR document a launch slip. Finalize the report with the real tally + iteration history + consented handles.
5. A `tests/scaffold/` guard asserts: the three docs exist; the report carries `STATUS: PENDING`, the exact threshold string, and no fabricated passing tally; recruitment docs name the privacy/no-compensation posture and the archetype balance; no `tel:`. RED before, GREEN after.
6. `make lint` exit 0, `make build` exit 0, full `make test` green.

## Tasks / Subtasks

- [ ] **Task 1: author the scaffold guard** (`tests/scaffold/9e-1-tester-credibility.test.mjs`) encoding AC 5; confirm RED. (test-author phase)
- [ ] **Task 2: write the recruitment-post draft** (AC 1). (impl phase)
- [ ] **Task 3: write the recruitment log** (AC 2). (impl phase)
- [ ] **Task 4: write the credibility-report PENDING scaffold** (AC 3). (impl phase)
- [ ] **Task 5 (BLOCKED — human deliverable): collect real tester verdicts + iterate + finalize report** (AC 4). No agent action until real testers respond.
- [ ] **Task 6: verification** — guard GREEN, `make lint`/`make build`/`make test` green (AC 6). (integration phase)

## Dev Notes

- Doable halves: Tasks 1–4 + 6 (recruitment + report scaffolding). Blocked half: Task 5 (real human tester verdicts).
- The credibility-report scaffold must make the threshold mechanically visible so the gate cannot be silently closed below it.
- Docs under `docs/launch-readiness/` are git tamper-evidence (ADR-0014) — not class-A; only the scaffold test is integrity-recorded.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): never fabricate testers/verdicts/tally; report stays PENDING, guard forbids a fabricated passing tally.
- lesson-2026-06-03-001 (high): `pr-checks.yml` per-job wiring; verify `tests/scaffold/**` glob coverage.
- lesson-2026-05-20-007 (high): carry-forward mandatory; new scaffold test integrity-recorded at freeze.

### Project Structure Notes

- New: `docs/launch-readiness/tester-recruitment-draft.md`, `…tester-recruitment-log.md`, `…tester-credibility-report.md`, `tests/scaffold/9e-1-tester-credibility.test.mjs`.
- No `src/`, `corpus/`, or i18n changes in the doable halves.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9e.1: Native-speaker tester recruitment + credibility validation + iteration loop]
- [Source: docs/launch-readiness/ru-translator-signoff.md] (PENDING-artifact convention)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
