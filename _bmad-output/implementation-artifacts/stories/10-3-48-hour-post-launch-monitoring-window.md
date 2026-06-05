---
id: 10-3-48-hour-post-launch-monitoring-window
title: "Story 10-3: 48-hour post-launch monitoring window"
status: review
---

# Story 10-3: 48-hour post-launch monitoring window

## Story

As the **maintainer responsible for catching launch-day surprises within the first 48 hours**,
I want a documented 48-hour post-launch monitoring window with check-in points at T+1h, T+6h, T+24h, and T+48h, plus a pre-validated rollback runbook,
so that any launch-day surprise (DNS issue, mirror sync failure, broken methodology link, scoring engine regression that slipped past CI) is caught at the earliest possible moment rather than discovered by an unhappy user days later.

## ⚠️ HUMAN-GATED — do not fabricate

**This story executes during and after actual v1.0.0 launch.** The monitoring checkpoints require the maintainer to be online at T+1h, T+6h, T+24h, T+48h from the tag push. No agent can simulate these.

**The agent-executable deliverables** for this story are:
- `docs/launch-readiness/v1.0.0-post-launch-monitoring.md` — monitoring log scaffold (check-in rows filled at each checkpoint)
- Dry-run validation of `docs/launch-readiness/v1.0.0-rollback-runbook.md` (from Story 10-1): walk each step, fill the dry-run table, no actual rollback executed

The monitoring checkpoints themselves (T+1h, T+6h, T+24h, T+48h) require human presence at actual launch time.

## Acceptance Criteria

1. `docs/launch-readiness/v1.0.0-post-launch-monitoring.md` is authored: check-in template at T+1h, T+6h, T+24h, T+48h with per-checkpoint checklist (canonical URL responding, mirror URL responding, Zenodo DOI resolving, IA snapshots live, SH archive live, zero GitHub Discussions issues flagged by users, `scheduled.yml` health-check green).
2. Each checkpoint log entry includes: timestamp (UTC), verified-checks list, any anomalies found, action taken (if any).
3. The rollback runbook (`docs/launch-readiness/v1.0.0-rollback-runbook.md`) is dry-run validated per Story 10.1 AC3: every step in the dry-run validation checklist table is executed (non-destructively) and signed off.
4. At T+48h closure: post-launch report is committed: verified-stable state, any hotfixes applied (v1.0.1+ scope), final "steady-state maintenance posture" declaration.
5. The monitoring log explicitly notes zero analytics (NFR6 compliance): "No Sentry, no LogRocket, no telemetry — user reports via GitHub Discussions only."
6. `make lint` exit 0, `make build` exit 0 on the branch containing these documents.

## Tasks / Subtasks

- [x] **Task 1:** Author `docs/launch-readiness/v1.0.0-post-launch-monitoring.md` scaffold (AC 1, AC 2, AC 5).
  - [x] **Subtask 1.1:** Header with launch date field + "48-hour window closes at" field.
  - [x] **Subtask 1.2:** Per-checkpoint log table (T+1h / T+6h / T+24h / T+48h) — each row: timestamp (UTC), checks (canonical URL / mirror / Zenodo / IA / SH / Discussions / scheduled.yml), anomalies, action taken.
  - [x] **Subtask 1.3:** Zero-analytics notice section (NFR6 compliance).
  - [x] **Subtask 1.4:** T+48h closure section: post-launch report fields + steady-state declaration.
- [x] **Task 2:** Dry-run validate `docs/launch-readiness/v1.0.0-rollback-runbook.md` (AC 3).
  - [x] **Subtask 2.1:** Execute each dry-run-safe command from the rollback runbook (Step 1a local tag check, Step 1b remote tag check, Step 2a log check, Step 2b build check, Step 3c Zenodo dashboard access, Step 4a IA access).
  - [x] **Subtask 2.2:** Fill in the dry-run validation table in the runbook with results.
  - [x] **Subtask 2.3:** Sign off the dry-run validation block.
- [x] **Task 3:** Verify `make lint` exit 0 and `make build` exit 0 (AC 6).
  - [x] **Subtask 3.1:** Run `make lint` — confirm exit 0.
  - [x] **Subtask 3.2:** Run `make build` — confirm exit 0.

## Dev Notes

- **Zero-analytics constraint (NFR6):** The monitoring approach is explicitly manual + zero-telemetry. Do NOT add Sentry, LogRocket, analytics scripts, or automated error-reporting. User issues are discovered only via GitHub Discussions. The monitoring log is the sole artifact.
- **Rollback runbook dry-run:** The dry-run executes commands that are safe to run pre-launch (tag existence checks, build checks, access checks) WITHOUT executing the actual destructive operations (tag deletion, force-push, Zenodo withdrawal). The goal is to confirm every command is runnable and produces expected output.
- **T+48h closure:** After Story 10.3 completes, the project moves to steady-state. The "no-enshittification audit clock" starts from the launch date in the postscript. T+6/T+12/T+24 month audits are future maintainer actions against `v1.0.0-no-enshittification-baseline.md`.
- **Monitoring checks:** The canonical URL is `https://iq-me.org/`, mirror is `https://iq-me.pages.dev/`. The `scheduled.yml` health-check runs weekly (Story 8.3 — checks mirror parity + archival health). Manual smoke test = same steps as Story 10.1 Section D.
- **No new CI jobs:** This story does not add Playwright specs or lints. The scaffold test guards document structure only.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): Harm-critical placeholder content must never fabricate specifics. Apply: monitoring log check-in entries must be placeholder with `[FILL IN AT T+Nh]` markers — do not pre-fill with fabricated checkpoint dates or anomaly descriptions.
- lesson-2026-06-03-001 (high): pr-checks.yml wires Playwright specs per-spec, NOT via greedy glob. Apply: this story adds no new test files requiring CI wiring (documentation-only).
- lesson-2026-05-20-007 (high): Every story spec carries `### Carry-forward lessons` populated from `tds memory query`. Apply: this section is present; it is the last story in epic-10.
- lesson-2026-06-03-002 (high): Before labeling a failing test pre-existing, verify provenance with a baseline diff. Apply: if `make lint` fails, run `git diff epic/10 -- <file>` to confirm the issue is introduced by this story before attributing it.
- lesson-2026-05-19-013 (high): Direct YAML edits to state-manifest.yaml can be silently undone by next sweep. Apply: no state-manifest edits in this story.

### Project Structure Notes

- **New files:** `docs/launch-readiness/v1.0.0-post-launch-monitoring.md`
- **Updated files:** `docs/launch-readiness/v1.0.0-rollback-runbook.md` (dry-run table filled in Task 2)
- **No source code changes** — documentation-only.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.3]
- [Source: docs/launch-readiness/v1.0.0-rollback-runbook.md — rollback runbook dry-run table (Task 2)]
- [Source: docs/launch-readiness/v1.0.0-checklist.md — smoke test steps for monitoring checkpoints]
- [Source: docs/launch-readiness/v1.0.0-launch-postscript.md — launch date for T+Nh calculations]
- [Source: .github/workflows/scheduled.yml — weekly health-check (referenced in monitoring)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Monitoring log scaffold + rollback runbook dry-run complete; 8/8 tests green; make lint + build exit 0

### File List

- docs/launch-readiness/v1.0.0-post-launch-monitoring.md
- docs/launch-readiness/v1.0.0-rollback-runbook.md
- tests/scaffold/10-3-post-launch-monitoring.test.mjs
