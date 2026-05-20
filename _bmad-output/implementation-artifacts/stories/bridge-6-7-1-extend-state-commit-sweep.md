# Story bridge-6-7-1-extend-state-commit-sweep: Extend state-commit sweep auto-record to spec-md touched by add-finding

Status: backlog

## Story

Confirmed via telemetry kind=record at 2026-05-20T11:41:59Z naming the gap. After any batch of add-finding calls, every touched spec-md fails tds integrity verify until a manual integrity record. bridge-5-6-1 already shipped sweep auto-record for sprint-status.yaml in the same state-commit path; this is the mechanically-symmetric extension to spec-md whose bytes changed in the auto-commit chain. Prefer the sweep-extension branch over a parallel handler change inside add-finding — one code path, one invariant, no duplication. TDS-module bridge.

## Sources (deferred from)

- `5-2-anchor-pages-7-fr36-protection-lint-content-freeze-typographic-system-checkpoint` (kind=completion-note) — Re-registered all three files via tds integrity record --as=engineer ... Sweep commits 849ca95, bf9980f
- `5-4-scoring-4-remaining-norming-3` (kind=completion-note) — Re-registered via tds integrity record --as=engineer --files=tests/unit/tools/lint-claims-manifest.test.mjs at 2026-05-20T11:41:12Z
- `5-5-ethics-2-remaining-provenance-2-remaining-reference-3-remaining` (kind=completion-note) — Re-registered via tds integrity record --as=engineer --files=tests/scaffold/cognitive-load-budget.test.mjs at 2026-05-20T11:41:13Z

## Acceptance Criteria

1. **`tds story add-finding` no longer leaves a drift behind.** After ANY single or batched `tds story add-finding --story=<id> ... --as=auditor` call (which auto-commits the touched `_bmad-output/implementation-artifacts/stories/<id>.md`), the immediately-following `tds state-commit` aggregate sweep detects the byte-drift on every spec-md whose sha256 no longer matches its `state-manifest.yaml` entry and re-records it in the same aggregate commit. A subsequent `tds integrity verify --as=auditor` returns `failed=N` not `failed=N+K` attributable to the K touched spec-md files. Pattern is mechanically symmetric to bridge-5-6-1 AC-1 (sprint-status.yaml auto-record); the only diff is the path scope.
2. **Spec-md scope re-uses the existing `stories/**.md` drift detection path.** The implementation extends `autoRecordDriftedSpecs` in sibling `bmad-tds-module` `src/state/commit-sweep.ts`. Spec-md drift was *already* in scope per the original `stories/**.md` glob — but only fired when the engineer themselves edited a spec via `Edit`. The gap is that `tds story add-finding`'s internal auto-commit step writes the file AND commits in the same transaction, so sweep's "compare on-disk sha256 vs manifest" check sees no further drift afterwards. Fix: have `add-finding`'s auto-commit either (a) skip integrity-record (current behavior) but emit a marker that sweep's next pass treats as eligible drift, OR (b) call `recordIntegrity` directly in the same transaction so sweep finds no drift to fix (preferred — same-transaction is simpler than cross-call marker handoff). Pick (b).
3. **`kind: autorecord` telemetry envelope reused.** Each re-recorded spec-md emits one event to `_bmad-output/_tds/runtime/integrity-events.jsonl` with the existing bridge-5-6-1 envelope: `{kind: "autorecord", file: <relpath>, sha256: <post>, recorded_by: "story-add-finding-autorecord"}` (or the closest existing attribution token already used by the manifest writer). No new event-kind; only new `recorded_by` discriminator so retros can grep autorecord-events by source path.
4. **Regression coverage in `bmad-tds-module`.** New unit tests in `src/state/__tests__/add-finding-autorecord.test.ts` (parallel to bridge-5-6-1's `commit-sweep-autorecord.test.ts`) cover: (a) single `add-finding` call → spec-md re-recorded in same transaction, `tds integrity verify` exit 0; (b) batched `add-findings --findings-file=…` call → every touched spec-md re-recorded, one `kind: autorecord` event per file; (c) negative case — non-add-finding spec edit still goes through the existing sweep path unchanged; (d) `recorded_by` discriminator is `story-add-finding-autorecord` (or chosen token), distinct from `state-commit-autorecord` from bridge-5-6-1. All previously green tests in `commit-sweep-autorecord.test.ts` continue to pass.
5. **IQ-ME drift inventory shrinks.** Post-bundle-bump, simulate a cumulative-review batch (`tds story add-findings --findings-file=<fixture> --as=auditor` against 3 throwaway story specs), then `tds integrity verify --as=auditor` returns `failed=0` for the touched spec-md files (not `failed=3`). Telemetry tail shows 3 matching `kind: autorecord` events with `recorded_by: story-add-finding-autorecord`.

## Tasks / Subtasks

- [ ] **Task 1 — write failing tests in `bmad-tds-module`** covering AC-4 (single + batch + negative + `recorded_by` discriminator). Verify they fail against current sibling-repo `main`. Cross-repo Option-A pattern per [project_iqme_tds_module_split](../../../.claude/projects/-Users-maksim-git-IQ-ME/memory/project_iqme_tds_module_split.md).
- [ ] **Task 2 — extend `add-finding` handler** in sibling `src/cli/story/add-finding.ts` (and `add-findings.ts` batch variant) to call the existing `recordIntegrity({file, recordedBy: "story-add-finding-autorecord"})` immediately after the spec-md write, inside the same auto-commit transaction. Same drift-detection semantics as bridge-5-6-1; only the call site is new. Make Task 1's same-transaction tests pass.
- [ ] **Task 3 — extend `autorecord` emit attribution** so the existing `emit()` call in `recordIntegrity` accepts `recorded_by` as a parameter (currently hard-coded to `state-commit-autorecord` per bridge-5-6-1). Pass `"story-add-finding-autorecord"` from add-finding handler; keep `"state-commit-autorecord"` default for sweep callers. Make Task 1's `recorded_by` discriminator test pass.
- [ ] **Task 4 — bundle bump on epic branch in IQ-ME** (temporary, pre-release pattern per bridge-4-5-1 / bridge-5-6-1 Completion Notes). Copy refreshed `tds-runtime.bundle.js` + `.sha256` from sibling `payload/shared/` into `_bmad/tds/shared/`. Commit with explicit "temporary; superseded by next bmad-tds-module release" + Story-Id trailer.
- [ ] **Task 5 — integration verification in IQ-ME.** Use a throwaway story id; run `tds story add-finding --story=<throwaway> --severity=info --category=test --finding=test --as=auditor`, then `tds integrity verify --as=auditor` to confirm spec-md is auto-re-recorded in-band (AC-1). Tail `_bmad-output/_tds/runtime/integrity-events.jsonl` and confirm the matching `kind: autorecord` event with `recorded_by: story-add-finding-autorecord` (AC-3). Run `make test` in IQ-ME and sibling-repo full test suite (`pnpm test`) to confirm no regression.

## Dev Agent Record

### Completion Notes List

_(populated during implementation)_

### File List

_(populated during implementation)_

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-6-7` (blocks `epic-7`).
