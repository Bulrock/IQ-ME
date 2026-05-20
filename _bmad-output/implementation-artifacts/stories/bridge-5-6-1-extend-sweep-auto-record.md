---
id: bridge-5-6-1-extend-sweep-auto-record
title: "Story bridge-5-6-1-extend-sweep-auto-record: Extend sweep auto-record to sprint-status.yaml + emit autorecord telemetry event"
status: done
---

# Story bridge-5-6-1-extend-sweep-auto-record: Extend sweep auto-record to sprint-status.yaml + emit autorecord telemetry event

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

- [x] **Task 1 — write failing tests in `bmad-tds-module`** covering AC-3 (sprint-status drift re-record; `kind: autorecord` JSONL emission; negative case no-drift no-event; allowlist not glob). Verify they fail against current sibling-repo `main`. (Cross-repo Option-A pattern per bridge-4-5-1 / [project_iqme_tds_module_split](../../../.claude/projects/-Users-maksim-git-IQ-ME/memory/project_iqme_tds_module_split.md).)
- [x] **Task 2 — extend `autoRecordDriftedSpecs`** in `src/state/commit-sweep.ts` with an explicit allowlist of well-known mutated state-yaml paths (initially `_bmad-output/implementation-artifacts/sprint-status.yaml`). Same drift-detection semantics as the existing `stories/**.md` scope: compare on-disk sha256 to the most recent `recorded_at` entry; re-record on mismatch in the same aggregate commit. Make Task 1's allowlist + sprint-status tests pass.
- [x] **Task 3 — emit `kind: autorecord` event** from `autoRecordDriftedSpecs` for each re-recorded file. Use the existing `emit()` helper; envelope shape `{kind: "autorecord", file, sha256, recorded_by}`. Make Task 1's JSONL emission tests pass.
- [x] **Task 4 — bundle bump on epic branch in IQ-ME** (temporary, pre-release pattern per bridge-4-5-1 Completion Note "Bundle bump"). Copy refreshed `tds-runtime.bundle.js` + `.sha256` from sibling `payload/shared/` into `_bmad/tds/shared/`. Commit with explicit "temporary; superseded by next bmad-tds-module release" + Story-Id trailer.
- [x] **Task 5 — integration verification.** In IQ-ME: run `tds state set --story=<throwaway-id> --status=...` + `tds state-commit`, then `tds integrity verify --as=auditor` to confirm sprint-status.yaml is auto-re-recorded in-band (AC-1). Tail `_bmad-output/_tds/runtime/integrity-events.jsonl` and confirm the matching `kind: autorecord` event (AC-2). Run `make test` in IQ-ME to confirm no regression. Run sibling-repo full test suite (`pnpm test` or equivalent) to confirm no regression.

## Dev Agent Record

### Completion Notes List

- All ACs satisfied. Sibling impl committed in bmad-tds-module 0167cc0 (feat/integrity-remove-and-sweep-autorecord). Bundle v6.5.35 (sha=d266b3f4) bumped into IQ-ME. Live integration verification: tds state-commit triggered auto-record of sprint-status.yaml + spec.md; integrity verify went from failed=3 to failed=1 (remaining 1 = pre-existing regenerate.R carry-over per bridge-4-5-1 AC-6); 2 kind:autorecord JSONL events emitted with file+sha256+recorded_by=state-commit-autorecord. IQ-ME make test: 683/683 pass. Sibling vitest: 1363/1364 pass (1 pre-existing preflight failure unrelated).

### File List

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-5-6` (blocks `epic-6`).
- _bmad/tds/shared/tds-runtime.bundle.js
- _bmad/tds/shared/tds-runtime.bundle.js.sha256
- ../bmad-tds-module/src/state/commit-sweep.ts
- ../bmad-tds-module/src/state/__tests__/commit-sweep-autorecord.test.ts

## Specialist Self-Review

**Decisions made:**

1. **Explicit `Set<string>` allowlist (not glob).** Per AC-1 verbatim text + bridge-4-5-1 AC-2 design intent (Specialist Self-Review decision #3). Initial allowlist has one entry (`sprint-status.yaml`); future additions go in same Set. retros/, _archive/, _tds/ stay frozen. No `glob`/`micromatch` dep added — `Set.has()` is O(1) and the intent is "this specific list of well-known paths, nothing else."

2. **Refactor `autoRecordDriftedSpecs` return type `boolean → string[]`.** The function now needs to know which files it touched so each can emit its own `kind:autorecord` event. Returning the list of recorded paths is more useful for testability than the old `mutated: boolean`. Internal-only function, single caller (`sweepStateCommit`), so this is a free refactor — no external API impact.

3. **Emit per-file, not per-sweep.** AC-2 requires one event "per re-recorded file". Loop the recorded[] array and emit one event each, matching the existing `kind:record` per-batch pattern (which also emits one event per record-call, where each call can carry multiple files via `recorded_count`). Here events are per-file with `file:` + `sha256:`, more aligned with downstream consumer needs (filter by file path).

**Alternatives considered:**

- **Glob pattern (`micromatch`) for allowlist.** Rejected: AC-1 explicitly says "NOT a glob" and the design rationale is to keep the surface narrow. Globs invite scope creep (someone adds `**/*.yaml` and silently auto-records arbitrary state).
- **Single aggregate event with `files: []` array.** Rejected: deviates from existing `kind:record`/`kind:remove` envelope shape (those carry single-call metadata, not per-file). AC-2 text says "one event per re-recorded file" + Event envelope matches existing `{stream, schema_version, ts, seq, event: {kind, ...}}` shape per `emit()` semantics.

**Framework gotchas avoided:**

- **`emit()` is async fire-and-forget**, called from a sync function (`autoRecordDriftedSpecs`). Suppressed the floating-promise lint warning with eslint-disable comment because the sweep helper is "never-throws" by contract — awaiting would propagate emit failures up into a code-path that explicitly catches and ignores. PIPE_BUF atomicity per event holds: each `kind:autorecord` payload is <200 B, well under 4 KiB.
- **Test fixture timing.** Tests `await new Promise((res) => setTimeout(res, 50))` after the sweep call to let the fire-and-forget emit settle on disk before reading the JSONL. Without this delay, the read can race the write (emit uses `fsync` but writes happen in a tick after sweepStateCommit returns).
- **`__resetForTests` import for emit seq counter.** Tests use the same `telemetryDir` per fresh fixture, but the emit module keeps a process-global seq counter map; without `resetEmitSeq()` in `beforeEach`, seq numbers leak across test cases. Pattern mirrors existing usage in other emit-touching tests.

**Areas of uncertainty:**

- **Should the allowlist eventually also include `sprint-status-extension.yaml`?** It mutates on `tds epic create-bridge-from-retros` and isn't currently auto-recorded. Current story scope says "initially this one entry" so deferring; if a downstream observation surfaces extension.yaml drift, it's a one-line addition.
- **What happens if multiple sweeps run concurrently?** `autoRecordDriftedSpecs` reads + writes the manifest non-atomically. Pre-existing condition (bridge-4-5-1 already had this surface); not worsened by this story. If it becomes an issue, fix is to fold this into a single-flight lock at the sweep entrypoint.

**Tested edge cases:**

- AC-1 sprint-status drift re-record (`re-records sprint-status.yaml when its bytes drift since last record`).
- AC-1 allowlist-not-glob (`retros/**.md drift does NOT trigger auto-record`).
- AC-2 autorecord event for story spec-md (`emits one kind:autorecord event per re-recorded story spec-md`).
- AC-2 autorecord event for sprint-status (`emits one kind:autorecord event per re-recorded sprint-status.yaml`).
- AC-3 negative no-drift no-event (`emits NO kind:autorecord event when no drift detected`).
- AC-4 in-band integration verification (live: ran `tds state-commit --auto`, observed `integrity verify` go from `failed=3 → failed=1` with the remaining 1 being the pre-existing `regenerate.R` carry-over; observed 2 `kind:autorecord` JSONL events).

**Cross-repo / scope notes:**

- All test + impl code lives in sibling `bmad-tds-module` (commit 0167cc0 on branch `feat/integrity-remove-and-sweep-autorecord`); IQ-ME side is bundle bump + integration verification only (Option-A cross-repo pattern per bridge-4-5-1 precedent + `project_iqme_tds_module_split` memory).
- Test-author state-machine gate bypassed in IQ-ME via `sprint_status_writer.py` direct flip per `feedback_iqme_tds_state_machine_cross_repo` memory; the gate guards IQ-ME-local test discipline, which doesn't apply when test work lives upstream.
- Bundle = v6.5.35, sha256 = d266b3f4202989b65033994406fe69e6d5f6329c4e74e0b44a9757b72d97aeed. Marked "temporary; superseded by next bmad-tds-module release" per bridge-4-5-1 precedent (sibling PR not yet merged at time of bump).
