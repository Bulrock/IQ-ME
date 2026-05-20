# Story bridge-4-5-1-tds-integrity-remove-cli: tds integrity-remove CLI + sweep auto-clean + cross-repo entry policy decision

Status: backlog

## Story

Consolidates epic-3 B1, epic-4 B1, epic-4 B2 — all three target integrity-manifest hygiene and the same state-manifest.yaml + sweep heuristic surface. Pattern established across three consecutive retros (bridge-1-2, epic-3, epic-4). Scope: (1) add `tds integrity remove --files=<path> --reason=<text>` subcommand; (2) teach state-sweep to auto-record spec-md whose bytes changed since last record AND skip re-recording paths whose on-disk file is absent; (3) commit cross-repo entry policy decision and apply it to `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` (three options: remove via new CLI / formalize external/ prefix policy / explicit carry-until-upstream-PR). Must land BEFORE Epic-5 — sweep noise S/N degrading.

## Sources (deferred from)

- `3-2-implement-state-js-contract-test` (kind=auditor-finding, round=1, finding_index=1)
- `3-2-implement-state-js-contract-test` (kind=auditor-finding, round=2, finding_index=1)
- `4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit` (kind=auditor-finding, round=1, finding_index=1)
- `4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit` (kind=completion-note) — Two legacy tests (AC-8.1 / scaffold AC-9) unfrozen + assertions updated to Story-4-1 HTML shape; integrity=88 verified / 3 pre-existing failures

## Acceptance Criteria

1. **CLI affordance — `tds integrity remove`.** A new subcommand `tds integrity remove --files=<path>[,<path>...] --reason=<text> --as=engineer` exists in the `bmad-tds-module` repo. It removes the named entries from `_bmad-output/_tds/state-manifest.yaml`'s `entries:` array (matched by `file:` field), prints a one-line confirmation per removed entry, and exit-0 on success. Unknown paths exit non-zero with a usage error listing the unmatched paths. Reason text is appended to the JSONL event log (same shape as other mutating CLI calls).
2. **Sweep auto-records changed spec-md.** `tds state-commit` (workflow-level sweep handler) detects any `_bmad-output/implementation-artifacts/stories/**.md` whose on-disk sha256 differs from the most recent `recorded_at` entry in `state-manifest.yaml` and re-records it in the same aggregate commit. After a `tds story add-finding` + sweep round, `tds integrity verify --as=auditor` returns `failed=N` not `failed=N+1` for that spec.
3. **Sweep skips absent files.** Same sweep handler also detects any entry in `state-manifest.yaml` whose `file:` no longer exists on disk and leaves it alone (does NOT auto-remove — explicit `tds integrity remove --reason=...` is the only removal path, preserving auditability). However, `tds integrity verify` continues to surface the missing entry as a failure so the operator knows recovery is required.
4. **Cross-repo entry policy decided + applied.** A short policy note (1-3 paragraphs) lands in `bmad-tds-module/docs/cross-repo-integrity-policy.md` (or the closest existing docs surface in that repo) committing to one of three options for sibling-project entries: (a) remove the offending entry via the new `tds integrity remove --reason=cross-repo-cleanup` and forbid future cross-repo records; (b) formalize an `external/` prefix convention; (c) "carry until upstream PR" with an explicit checklist item. The chosen policy is applied to the existing IQ-ME drift entry `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` so that `tds integrity verify --as=auditor` in `IQ-ME` returns at most 1 remaining out-of-scope failure (`tests/golden/regenerate.R`, which is its own re-record concern not covered by this story).
5. **Regression coverage in `bmad-tds-module`.** New unit + scaffold tests in `bmad-tds-module` cover: (a) `tds integrity remove` removes one entry, leaves others; (b) `tds integrity remove` errors on unknown path; (c) sweep-handler re-records a spec-md after byte-change (uses fixture story-md whose bytes are mutated mid-test); (d) sweep-handler does NOT silently remove a missing-file entry (asserts the entry still present + `integrity verify` still reports it).
6. **IQ-ME drift inventory shrinks.** After the policy from AC-4 is applied, `tds integrity verify --as=auditor` in IQ-ME returns either `failed=0` or `failed=1` (only `tests/golden/regenerate.R` remaining; addressing that is out-of-scope and tracked separately as an Epic-5 action item). Pre-existing entry for `tests/scaffold/story-3-1-marker.test.mjs` already resolved by 3-2/round-1 direct-edit; this story does not need to re-do that work.

## Tasks / Subtasks

- [ ] **Task 1 — write failing tests in `bmad-tds-module`** covering AC-5 (CLI happy-path + error path; sweep re-record + sweep keeps missing entry). Verify they fail against current `main`.
- [ ] **Task 2 — implement `tds integrity remove` subcommand** in `bmad-tds-module` (CLI dispatch + state-manifest entry removal + JSONL event emission + `--reason` propagation). Make Task 1's CLI tests pass.
- [ ] **Task 3 — extend `tds state-commit` sweep handler** to (a) auto-re-record spec-md byte-changes since last record, (b) leave missing-file entries untouched. Make Task 1's sweep tests pass.
- [ ] **Task 4 — author cross-repo policy doc** in `bmad-tds-module/docs/` (or chosen surface). Decide between options (a)/(b)/(c) — recommend (a) "remove + forbid" for simplicity unless inventory shows recurring need. Record the decision in the doc.
- [ ] **Task 5 — apply policy to IQ-ME drift entry** for `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` via the new `tds integrity remove --reason=cross-repo-cleanup-policy` (or whatever the chosen option dictates). Verify IQ-ME `tds integrity verify --as=auditor` reports the smaller failure set (AC-6).
- [ ] **Task 6 — integration verification.** Run `tds integrity verify` in both repos post-change. Run a `tds story add-finding` + `tds state-commit` cycle on a throwaway IQ-ME spec to confirm sweep re-records bytes (AC-2). Confirm no test regressions in either repo (`make test` IQ-ME side; `bmad-tds-module` test suite).

## Dev Agent Record

### Completion Notes List

_(populated during implementation)_

### File List

_(populated during implementation)_

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-4-5` (blocks `epic-5`).
