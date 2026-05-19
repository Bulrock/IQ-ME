# Story bridge-1-2-1-add-tds-story-unfreeze: Add `tds story unfreeze-tests --story=<id>` CLI affordance

Status: backlog

## Story

Two auditor findings in epic-1 (story-1-6, story-1-7) explicitly recommended
this bridge. The Edit + manual `tds integrity record --as=engineer`
re-register pattern is friction-hostile and got skipped silently in both
cases. Memory feedback_tds_state_machine_quirks.md confirms CLI is missing.
Proposed shape: `tds story unfreeze-tests --story=<id> --files=<p,p,...>
--reason=<text> --as=<role>` — opens a controlled mutation window for the
named frozen test paths, requires --reason text, emits a state event, and
requires a matching `tds story refreeze-tests --story=<id>` (or
`--as=engineer` ratification commit) before the next state transition.
Time-box: 1 day.


## Sources (deferred from)

- `1-6-author-ci-matrix-yaml-with-full-future-lint-stub-jobs` (kind=auditor-finding, round=1, finding_index=1)
- `1-7-implement-playwright-network-trace-infrastructure-with-strict-zero-third-party-assertion-from-day-1` (kind=auditor-finding, round=1, finding_index=1)

## Acceptance Criteria

1. `tds story unfreeze-tests --story=<id> --files=<p1,p2,...> --reason=<text> --as=<role>` exists as a real subcommand of the project-local TDS runtime (`_bmad/tds/bin/tds` → bundle); `tds --help` lists it under the subcommands block; missing `--reason`, missing `--files`, or unknown `--story` exits non-zero with a deterministic error message; `--as=<role>` is required (matches the global mutating-subcommand contract).
2. Invoking `unfreeze-tests` opens a controlled mutation window for the named paths only: each path in `--files` must (a) resolve to an existing file under the workspace, (b) carry a current integrity record whose `story_id` matches `--story`, and (c) match a frozen-test pattern (i.e. live under `tests/`); any path failing one of these checks aborts the call with no state mutation (atomic-or-nothing).
3. Successful invocation emits one structured state event per file (kind=`unfreeze`, including `story`, `file`, `reason`, `role`, ISO timestamp, prior sha256) into the same event sink the rest of the runtime uses (cli-events / state-events JSONL — match whichever the existing `integrity record` path uses); the events are visible to `tds orient` / downstream review forensics.
4. Until a matching close action runs for every unfrozen file, the story is blocked from forward state transitions: `tds state set --story=<id> --status=<next>` and `tds story update --status=<next>` (any value beyond the unfreeze point) refuse with a clear error listing the still-open files and the close actions that would clear them. Close action = either `tds integrity record --as=engineer --files=<p> --notes=<text> --story=<id>` (ratify the post-edit sha256) OR a future `tds story refreeze-tests --story=<id>` shorthand if implemented in this scope; either path zeroes the open-unfreeze set for that file.
5. `tds integrity verify` continues to behave exactly as before for files NOT inside an open unfreeze window: drifted-without-unfreeze still fails. Files inside an open unfreeze window are reported as `unfrozen (open since <ts>, reason=<text>)` in verify output but do not contribute to `failed=` count — verify exits 0 if the only "drift" is open unfreeze entries, non-zero otherwise. This makes verify reflect intentional mutation windows without weakening the merge-precondition contract.
6. Behavior validated end-to-end against the two epic-1 failure scenarios (regression coverage): (a) post-impl test bug-fix within the same story (story-1-7 / playwright-network-trace.test.mjs pattern) — unfreeze → Edit → integrity record → verify=0; (b) cross-story frozen-test edit (story-1-7 specialist edits story-1-6's ci-matrix.test.mjs) — unfreeze under `--story=1-6-...` (since the registry entry belongs there) → Edit → integrity record → verify=0. Both flows are exercised by automated test(s) shipped with this story; the cross-story flow's test explicitly asserts that `--as=engineer` is sufficient (no privileged role escalation required for ratification).
7. Memory note `feedback_tds_state_machine_quirks.md` is updated (or superseded via `tds memory supersede`) to reflect the new affordance — the "`tds story unfreeze-tests` does NOT exist" bullet is replaced by a "use `tds story unfreeze-tests` for controlled mutation windows; manual Edit + integrity record is the fallback when CLI scope-checks reject the path" guidance. Update committed in the same story branch.
8. `tds story unfreeze-tests --help` documents the full flag set, the close-action contract (AC #4), and the verify-output semantics (AC #5).

## Tasks / Subtasks

- [ ] Task 1 — write failing tests for the new subcommand (TDD red phase) covering AC #1–#6. Place under `tests/scaffold/` or the existing TDS test surface; include CLI-shape tests (missing flags, unknown story, non-existent file, non-frozen path), event-emission tests (AC #3), forward-transition blocker tests (AC #4), verify-output tests (AC #5), and the two epic-1 regression scenarios (AC #6). Record integrity for each new test file as `test-author`.
- [ ] Task 2 — implement `unfreeze-tests` subcommand inside the TDS runtime bundle source (matching wherever `integrity record` / `state set` live) — flag parser, validation, atomic mutation, event emit. Make the existing dispatcher entries (bundle line ~12592 + descriptor at ~11173) point to a real handler. Run failing tests until green; no other behaviors touched.
- [ ] Task 3 — add the forward-transition blocker hook into the state-machine path (`tds state set` + `tds story update`): query open unfreeze windows for `--story`; refuse with the listed-files + close-actions error when non-empty.
- [ ] Task 4 — extend `tds integrity verify` output to distinguish `unfrozen (open since ...)` entries from real drift per AC #5; adjust exit-code logic.
- [ ] Task 5 — update `tds --help` / USAGE block to list the new subcommand and the `--help` text for it (AC #8).
- [ ] Task 6 — update memory note `feedback_tds_state_machine_quirks.md` per AC #7 (in-place edit OR `tds memory supersede` with new note; pick whichever matches current TDS memory conventions).
- [ ] Task 7 — integration verification: run the two epic-1 regression scenarios manually end-to-end (AC #6 flows) against a scratch story, confirm `tds integrity verify` exits 0 after close, confirm `tds orient` surfaces the unfreeze events in story timeline. Add concrete commands + observed exit codes to Completion Notes.
- [ ] Task 8 — refactor pass: deduplicate any copy-paste between `integrity record` and the new `unfreeze-tests` validation paths IF the duplication is real (not premature DRY). If nothing to consolidate, skip and note that explicitly in Completion Notes.

## Dev Agent Record

### Completion Notes List

_(populated during implementation)_

### File List

_(populated during implementation)_

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-1-2` (blocks `epic-2`).
