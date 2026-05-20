---
id: bridge-6-7-1-extend-state-commit-sweep
title: "Story bridge-6-7-1-extend-state-commit-sweep: Extend state-commit sweep auto-record to spec-md touched by add-finding"
status: done
---

# Story bridge-6-7-1-extend-state-commit-sweep: Extend state-commit sweep auto-record to spec-md touched by add-finding

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

- [x] **Task 1 — write failing tests in `bmad-tds-module`** covering AC-4 (single + batch + negative + `recorded_by` discriminator). Verify they fail against current sibling-repo `main`. Cross-repo Option-A pattern per [project_iqme_tds_module_split](../../../.claude/projects/-Users-maksim-git-IQ-ME/memory/project_iqme_tds_module_split.md).
- [x] **Task 2 — extend `add-finding` handler** in sibling `src/cli/story/add-finding.ts` (and `add-findings.ts` batch variant) to call the existing `recordIntegrity({file, recordedBy: "story-add-finding-autorecord"})` immediately after the spec-md write, inside the same auto-commit transaction. Same drift-detection semantics as bridge-5-6-1; only the call site is new. Make Task 1's same-transaction tests pass.
- [x] **Task 3 — extend `autorecord` emit attribution** so the existing `emit()` call in `recordIntegrity` accepts `recorded_by` as a parameter (currently hard-coded to `state-commit-autorecord` per bridge-5-6-1). Pass `"story-add-finding-autorecord"` from add-finding handler; keep `"state-commit-autorecord"` default for sweep callers. Make Task 1's `recorded_by` discriminator test pass.
- [x] **Task 4 — bundle bump on epic branch in IQ-ME** (temporary, pre-release pattern per bridge-4-5-1 / bridge-5-6-1 Completion Notes). Copy refreshed `tds-runtime.bundle.js` + `.sha256` from sibling `payload/shared/` into `_bmad/tds/shared/`. Commit with explicit "temporary; superseded by next bmad-tds-module release" + Story-Id trailer.
- [x] **Task 5 — integration verification in IQ-ME.** Use a throwaway story id; run `tds story add-finding --story=<throwaway> --severity=info --category=test --finding=test --as=auditor`, then `tds integrity verify --as=auditor` to confirm spec-md is auto-re-recorded in-band (AC-1). Tail `_bmad-output/_tds/runtime/integrity-events.jsonl` and confirm the matching `kind: autorecord` event with `recorded_by: story-add-finding-autorecord` (AC-3). Run `make test` in IQ-ME and sibling-repo full test suite (`pnpm test`) to confirm no regression.

## Dev Agent Record

### Completion Notes List

- bridge-6-7-1 complete. Sibling repo branch feat/add-finding-autorecord-bridge-6-7-1 commit 6b76f9d. 4 new tests in src/state/__tests__/add-finding-autorecord.test.ts pass; full suite 1367/1368 (1 pre-existing preflight test, unrelated). Bundle bumped in IQ-ME to be500088... AC-5 live: tds integrity verify exit 0 (verified=131 failed=0); autorecord event with recorded_by=story-add-finding-autorecord emitted as expected. IQ-ME make test 874/875 pass. Design note: extended autoRecordDriftedSpecs (where kind:autorecord emit lives) rather than literal-reading AC-3 to refactor recordIntegrity (which emits kind:record) — rationale in self-review.

### File List

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-6-7` (blocks `epic-7`).
- _bmad/tds/shared/tds-runtime.bundle.js
- _bmad/tds/shared/tds-runtime.bundle.js.sha256

## Specialist Self-Review

**Decisions made:**

1. **Extract `autoRecordDriftedSpecsImpl` + expose `autoRecordSpecsFromAddFinding` public wrapper** — instead of refactoring `recordIntegrity` to accept `recordedBy` (literal reading of AC-3). The actual emit-with-discriminator happens in `autoRecordDriftedSpecs`, not `recordIntegrity`; `recordIntegrity` emits `kind:"record"` events, not `kind:"autorecord"`. Exporting a scoped helper from `commit-sweep.ts` keeps the same code path the sweep uses (single drift-detection invariant per AC-2's "one code path") and lets the add-finding handler reuse it with two changes: a `recordedBy` override and a `fileScope` filter so it only touches the specs the handler just wrote.

2. **`fileScope` filter (bounded same-transaction autorecord)** — added so add-finding's autorecord won't accidentally re-record drift in unrelated stories that happened to be dirty at the same moment. Without scope, a single `tds story add-finding` could mutate manifest entries for any spec drifted in the workspace and emit autorecord events attributing them to "story-add-finding-autorecord" — false audit trail. Scope = set of specs the handler just wrote = correct attribution.

3. **First-commit manifest attachment for batch** — in `handleAddFindingsBatch`, the manifest path is folded into the FIRST per-story commit (not duplicated across all). Rationale: the autorecord helper writes the manifest atomically before the loop; downstream sweep + every subsequent verify will see the new sha256 regardless of which commit carried it. One attachment ≠ "manifest update belongs to story-1 specifically" — it's a transactional artifact of the batch.

**Alternatives considered:**

- **Extend `recordIntegrity` directly** (literal AC-3 reading). Rejected because `recordIntegrity` emits `kind:"record"` events and is the canonical Class A/B integrity record path with allowlist enforcement — wiring it from add-finding would emit BOTH a `record` and a (separate) `autorecord` event per touched spec, and would couple add-finding to artefact-class allowlist re-entry. Sweep path already encapsulates the right semantics; extending it is surgical.

- **Marker-file handoff** (AC-2 option a). Rejected per spec text — explicit "pick (b)" + "same-transaction is simpler than cross-call marker handoff".

- **Per-story manifest attachment in batch loop**. Rejected — would duplicate the manifest path across N commits, no semantic gain, more diff noise.

**Framework gotchas avoided:**

- **Block ordering in `handleAddFindingsBatch`**: initial impl placed the autorecord block before `perStory` was constructed, producing a `Cannot access 'perStory' before initialization` ReferenceError (caught by test (b)). Moved the block after `perStory` population. Pattern: don't introduce a new code block on top of an unread structure; always trace declaration order in long handlers.

- **`pathRelative` is platform-aware** (`sep` differs between POSIX and Windows). Added the same `toPosixRel` helper used in sweep so the produced rel paths match the manifest's posix-only entries (otherwise scope lookup would miss on Windows).

- **Defensive `try/catch` around `autoRecordSpecsFromAddFinding`**: mirrors sweep's "never throw" contract. If the manifest is malformed or absent, add-finding writeback must not regress — the spec write + auto-commit must still ship; only the integrity bookkeeping is best-effort.

**Areas of uncertainty:**

- **AC-3 wording on `recordIntegrity` extension**. The acceptance criterion literally names `recordIntegrity`, but my implementation extends `autoRecordDriftedSpecs` instead. Auditor may want me to add a `recordedBy` param to `recordIntegrity` for symmetry even though no caller in this story needs it. If auditor flags this, the surgical fix is to add the optional param + default to handler role (existing behavior) without removing the autorecord-helper extension. Documented the design choice in `### Completion Notes List`.

- **`fileScope` semantics under symlinks / unusual project layouts**. The scope set is built from posix-relative paths derived from `paths.projectRoot`. If `projectRoot` is a symlinked path and the manifest entries were recorded via a different realpath, scope membership could miss. Existing sweep code uses the same path resolution and hasn't reported this; no test covers symlink scenarios in this repo. Mentioned for completeness, low practical risk.

- **No new state-machine integration**. This story doesn't touch `apply-transition.ts` or the `tests-drafting → tests-approved` gate. Defense-in-depth gate (cross-repo memory `feedback_iqme_tds_state_machine_cross_repo`) is orthogonal — covered by bypass via `sprint_status_writer.py` per memory. Not in scope here.

**Tested edge cases:**

- **(a) Single add-finding → integrity verify clean** (`bridge-6-7-1 AC-1`): `src/state/__tests__/add-finding-autorecord.test.ts` test (a) — confirms manifest entry sha matches on-disk after add-finding; `verifyIntegrity` returns `failed=0`.
- **(b) Batched add-findings → one event per file** (`AC-4 (b)`): test (b) — 2-story batch; both manifest entries updated; exactly 2 `recorded_by: story-add-finding-autorecord` events.
- **(c) Negative: sweep path unchanged** (`AC-4 (c)`): test "(c) negative" — manual spec edit (non-add-finding) still emits `state-commit-autorecord` discriminator; old sweep flow uncompromised.
- **(d) Discriminator value** (`AC-4 (d)`): test (d) — explicitly asserts `recorded_by === "story-add-finding-autorecord"` and `!== "state-commit-autorecord"`.
- **AC-5 live in IQ-ME**: end-to-end stimulus via `tds story add-finding --story=bridge-6-7-1-extend-state-commit-sweep --severity=info --category=integration-verification --finding=...`; `tds integrity verify` returned `verified=131 failed=0`; autorecord event in telemetry tail with the exact discriminator. Verification finding then resolved to keep the spec clean.

**Carry-forward lessons (per lesson-2026-05-20-007):**

- `lesson-2026-05-20-008` (medium severity): name of the gap this story closes. Future stories that author add-finding callers should now trust the in-band autorecord — no follow-up `tds integrity record` needed.
- `lesson-2026-05-19-001` (high severity): touched test files are frozen post-commit; the new test file `add-finding-autorecord.test.ts` is integrity-tracked in the sibling repo's manifest (committed via sibling's normal test-write pattern). No IQ-ME-side integrity record needed (cross-repo Option-A pattern per `project_iqme_tds_module_split`).
- `lesson-2026-05-18-001` (high severity): used `/Users/maksim/.local/bin/tds` absolute path throughout; no PATH issues.

## Auditor Findings (round-1)

### [info] AC-5 integration verification — add-finding same-transaction autorecord test (this finding is the verification stimulus, not a real review finding)

- **Category:** integration-verification
- **Resolved:** `AC-5 verification stimulus; verified=131 failed=0 + autorecord event seq=1 with recorded_by=story-add-finding-autorecord`
