# Story bridge-5-6-1-extend-sweep-auto-record: Extend sweep auto-record to sprint-status.yaml + emit autorecord telemetry event

Status: backlog

## Story

Both info findings from bridge-4-5-1 land in the same handler (autoRecordDriftedSpecs in sibling commit-sweep.ts). (a) Extend scope to also cover the well-known path `_bmad-output/implementation-artifacts/sprint-status.yaml` (or a small allowlist of workflow-mutated state-yaml files), keeping retros/archive frozen per current decision; (b) emit `kind autorecord` (or equivalent) integrity event from autoRecordDriftedSpecs so JSONL mirrors manifest mutation, aligning with existing `kind record` / `kind remove` pattern. Low coupling — single file, single epic-branch session. Time-box 1 day. Closes the only remaining sweep-scope drift class observed in this retro.

## Sources (deferred from)

- `bridge-4-5-1-tds-integrity-remove-cli` (kind=auditor-finding, round=1, finding_index=1)
- `bridge-4-5-1-tds-integrity-remove-cli` (kind=auditor-finding, round=2, finding_index=1)

## Acceptance Criteria

1. **Sweep auto-records `sprint-status.yaml`.** `autoRecordDriftedSpecs` (in sibling `bmad-tds-module`, `src/state/commit-sweep.ts`) detects byte-drift on `_bmad-output/implementation-artifacts/sprint-status.yaml` and re-records it in the same aggregate commit produced by `tds state-commit`. After any workflow that flips a status (e.g. `tds state set --story=<id> --status=<x>` or `tds epic bridge resolve`), `tds integrity verify --as=auditor` returns `failed=N` not `failed=N+1` attributable to `sprint-status.yaml`. Scope is implemented as an explicit allowlist of well-known mutated state-yaml paths (initially this one entry) — NOT a glob — so retros/`, `_archive/`, and `_tds/` remain frozen per the bridge-4-5-1 AC-2 design intent (Specialist Self-Review decision #3).
2. **Sweep auto-record emits a telemetry event per mutation.** Each time `autoRecordDriftedSpecs` re-records a drifted file (whether the existing `stories/**.md` scope or the new `sprint-status.yaml` allowlist scope), it appends one event to `_bmad-output/_tds/runtime/integrity-events.jsonl` with `kind: "autorecord"` (new kind, distinct from `record` and `remove`), `file:` set to the re-recorded path, `recorded_by: "state-commit-autorecord"` (or equivalent attribution string already used in the manifest), and the post-update `sha256`. Event envelope matches existing `{stream, schema_version, ts, seq, event: {kind, ...}}` shape per `emit()` semantics. After a `tds story add-finding` + sweep cycle, the JSONL tail contains one `kind: autorecord` event per spec-md that was re-recorded; the manifest mutation and JSONL event agree on file + sha256.
3. **Regression coverage in `bmad-tds-module`.** New unit tests in `src/state/__tests__/commit-sweep-autorecord.test.ts` cover: (a) `sprint-status.yaml` drift re-recorded by sweep (mutate bytes mid-test, assert manifest entry updated); (b) one `kind: autorecord` JSONL event emitted per re-recorded file (assert via reading the events.jsonl fixture, using `e.event.kind` per the bridge-4-5-1 framework-gotcha note); (c) no JSONL event emitted when no drift detected (negative case); (d) paths outside the allowlist (e.g. `_bmad-output/implementation-artifacts/retros/foo.md`) are still NOT touched, asserting allowlist semantics not a glob. All previously green tests in this file continue to pass.
4. **IQ-ME drift inventory shrinks.** After this story lands and the bundle is bumped in IQ-ME, `tds integrity verify --as=auditor` in IQ-ME returns `failed=0` for `sprint-status.yaml` drift specifically (the `tests/golden/regenerate.R` carry-over remains and is out-of-scope per bridge-4-5-1 AC-6). A throwaway `tds state set` + `tds state-commit` cycle on a dummy story confirms the sweep auto-records `sprint-status.yaml` in-band.

## Tasks / Subtasks

- [ ] **Task 1 — write failing tests in `bmad-tds-module`** covering AC-3 (sprint-status drift re-record; `kind: autorecord` JSONL emission; negative case no-drift no-event; allowlist not glob). Verify they fail against current sibling-repo `main`. (Cross-repo Option-A pattern per bridge-4-5-1 / [project_iqme_tds_module_split](../../../.claude/projects/-Users-maksim-git-IQ-ME/memory/project_iqme_tds_module_split.md).)
- [ ] **Task 2 — extend `autoRecordDriftedSpecs`** in `src/state/commit-sweep.ts` with an explicit allowlist of well-known mutated state-yaml paths (initially `_bmad-output/implementation-artifacts/sprint-status.yaml`). Same drift-detection semantics as the existing `stories/**.md` scope: compare on-disk sha256 to the most recent `recorded_at` entry; re-record on mismatch in the same aggregate commit. Make Task 1's allowlist + sprint-status tests pass.
- [ ] **Task 3 — emit `kind: autorecord` event** from `autoRecordDriftedSpecs` for each re-recorded file. Use the existing `emit()` helper; envelope shape `{kind: "autorecord", file, sha256, recorded_by}`. Make Task 1's JSONL emission tests pass.
- [ ] **Task 4 — bundle bump on epic branch in IQ-ME** (temporary, pre-release pattern per bridge-4-5-1 Completion Note "Bundle bump"). Copy refreshed `tds-runtime.bundle.js` + `.sha256` from sibling `payload/shared/` into `_bmad/tds/shared/`. Commit with explicit "temporary; superseded by next bmad-tds-module release" + Story-Id trailer.
- [ ] **Task 5 — integration verification.** In IQ-ME: run `tds state set --story=<throwaway-id> --status=...` + `tds state-commit`, then `tds integrity verify --as=auditor` to confirm sprint-status.yaml is auto-re-recorded in-band (AC-1). Tail `_bmad-output/_tds/runtime/integrity-events.jsonl` and confirm the matching `kind: autorecord` event (AC-2). Run `make test` in IQ-ME to confirm no regression. Run sibling-repo full test suite (`pnpm test` or equivalent) to confirm no regression.

## Dev Agent Record

### Completion Notes List

_(populated during implementation)_

### File List

_(populated during implementation)_

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-5-6` (blocks `epic-6`).
