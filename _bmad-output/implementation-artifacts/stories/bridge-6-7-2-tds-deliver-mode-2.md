# Story bridge-6-7-2-tds-deliver-mode-2: tds deliver Mode 2 idempotent recovery on re-run for partial OH-07 finalize

Status: backlog

## Story

Two consecutive epics (epic-4, epic-5) hit OH-07 partial-finalize; manual recovery via sprint_status_writer.py + commit 246bf95. Recurrence across consecutive epics is the bridge signal despite single completion-note source. Narrow scope to idempotent re-run completion (detect partial state on second invocation and finish it) — defer the more invasive atomic-transaction rewrite. Idempotent recovery is the smaller, lower- risk affordance that already matches the existing manual recovery shape. TDS-module bridge.

## Sources (deferred from)

- `epic-5` (kind=completion-note) — Recovers from tds-deliver OH-07 partial finalize: deliver flipped only epic-5 on its branch; stories 5-1..5-7 left at approved. Manual flip via sprint_status_writer.py on main per memory feedback_tds_deliver_oh07_partial.

## Acceptance Criteria

1. **Re-running `tds deliver` after a partial OH-07 finalize completes the finalize idempotently.** When the prior `tds deliver --epic=<id> --epic-branch=<branch>` left state in the OH-07-partial shape — epic-key flipped to `done` in `sprint-status.yaml` but child stories still at `approved`, AND the corresponding GitHub PR is `merged` on origin — a second invocation of the same `tds deliver` command detects that state and **completes the missing flips**: flips every child story `approved → done` in `sprint-status.yaml`, re-syncs each story-md frontmatter via the existing `tds state set` writeback, runs the existing post-merge sweep, and exits 0 with `stories_transitioned: N` matching the recovered count. **Does NOT open a new PR.** `PRs created on re-run: 0`. (Contrast: per memory `feedback_tds_deliver_oh07_partial`, current behavior on re-run opens a phantom empty PR.)
2. **Detection is conservative — only acts on confirmed prior-merge state.** The "partial finalize detected" branch fires ONLY when ALL of the following hold simultaneously: (a) the deliver epic-branch `<branch>` resolves to a PR in the host (via existing `findPRForBranch`) whose state is `merged` (not `open`, not `closed`); (b) `sprint-status.yaml` shows the epic key at `done`; (c) at least one child story under the epic (per the existing extension-registry `parents` map) is at `approved`. If any of (a)/(b)/(c) is missing, fall through to the existing deliver flow unchanged (no behavior change for the happy path or for genuinely-not-yet-merged epics).
3. **Spec-md frontmatter re-sync is part of the recovery.** Memory `feedback_tds_deliver_oh07_partial` documents that prior manual recoveries via `sprint_status_writer.py` left `_bmad-output/implementation-artifacts/stories/<id>.md` frontmatter stuck at `approved` — drift hides until someone opens a spec file weeks later. The idempotent-recovery branch MUST call `tds state set --story=<id> --status=done --as=engineer` (or equivalent in-process) per recovered story so the spec-md frontmatter writeback runs alongside the sprint-status flip. After re-run, `grep "^status: approved" _bmad-output/implementation-artifacts/stories/<epic-prefix>-*.md` returns zero hits for the affected epic.
4. **Telemetry envelope identifies the recovery path.** Each recovered story emits one event to `_bmad-output/_tds/runtime/integrity-events.jsonl` with `{kind: "deliver-resume", story: <id>, epic: <id>, pr: <number>}` (new kind, distinct from existing `kind: record / autorecord / verdict`). A single aggregate `{kind: "deliver-resume-summary", epic: <id>, stories_recovered: N, pr_state: "merged"}` event is emitted at the end. Future retros can grep `kind: deliver-resume` to count OH-07 recurrences without manually scanning commit history.
5. **Regression coverage in `bmad-tds-module`.** New unit tests in `src/cli/deliver/__tests__/deliver-resume.test.ts` cover: (a) golden path — fresh deliver still opens-and-merges PR + flips epic + stories atomically (no behavior change); (b) OH-07 recovery path — pre-seeded partial state + merged-PR fixture → re-run flips child stories, opens 0 PRs, emits `kind: deliver-resume` events; (c) conservative-detection — partial state but NO merged PR → fall-through to normal flow, NOT recovery; (d) no double-recovery — a second re-run after a successful recovery is a no-op (`stories_transitioned: 0`, `PRs created: 0`, exit 0). All previously green tests in `deliver.test.ts` continue to pass.
6. **Manual recovery sequence (per memory `feedback_tds_deliver_oh07_partial`) is documented as deprecated.** After this story lands, the recovery sequence in that memory note ("simpler recovery variant") becomes a manual fallback only used if the new automatic recovery path itself fails. Update the memory file with a "Superseded by bridge-6-7-2 (tds deliver Mode 2 idempotent recovery) for epics on the new bundle" note at the top — engineer commits this memory update as part of the story's File List.

## Tasks / Subtasks

- [ ] **Task 1 — write failing tests in `bmad-tds-module`** covering AC-5 (golden path unchanged + OH-07 recovery + conservative detection + no-double-recovery). Verify they fail against current sibling-repo `main`. Cross-repo Option-A pattern per [project_iqme_tds_module_split](../../../.claude/projects/-Users-maksim-git-IQ-ME/memory/project_iqme_tds_module_split.md).
- [ ] **Task 2 — implement detection branch** in `src/cli/deliver/deliver.ts` (or wherever the deliver entry-point lives). Add pre-check before the existing "create PR / push / merge" sequence: call `findPRForBranch({states: ["merged"]})`; if hit AND `sprint-status.yaml` shows epic=done AND any child story=approved → enter the recovery branch instead of the normal flow. Make Task 1's recovery + conservative-detection tests pass.
- [ ] **Task 3 — implement recovery flow.** Within the recovery branch: walk extension-registry `parents` to find all child stories under the epic; for each story still at `approved`, call the existing `tds state set` writeback (in-process, not via shell) to flip `approved → done` AND re-sync spec-md frontmatter (AC-3). Then call the existing post-merge sweep (`tds state-commit` in-process). Make Task 1's spec-md frontmatter re-sync test pass.
- [ ] **Task 4 — emit `kind: deliver-resume` telemetry** per recovered story + one `kind: deliver-resume-summary` at the end. Reuse the existing `emit()` helper; envelope shape per AC-4. Make Task 1's telemetry test pass.
- [ ] **Task 5 — bundle bump on epic branch in IQ-ME** (temporary, pre-release pattern per bridge-4-5-1 / bridge-5-6-1 Completion Notes). Copy refreshed `tds-runtime.bundle.js` + `.sha256` from sibling `payload/shared/` into `_bmad/tds/shared/`. Commit with explicit "temporary; superseded by next bmad-tds-module release" + Story-Id trailer.
- [ ] **Task 6 — update memory** `/Users/maksim/.claude/projects/-Users-maksim-git-IQ-ME/memory/feedback_tds_deliver_oh07_partial.md` with the "Superseded by bridge-6-7-2 for epics on the new bundle" note (AC-6). Include the new memory file in the story File List.
- [ ] **Task 7 — integration verification in IQ-ME.** Reproduce OH-07 partial state on a throwaway epic+story branch (manually set epic to `done` + stories to `approved` + push a merged PR fixture, or use a recorded fixture). Run `tds deliver` a second time and confirm: `stories_transitioned: N` (recovery), `PRs created: 0`, all spec-md frontmatter shows `done`, telemetry has 1 `deliver-resume-summary` + N `deliver-resume` events. Run `make test` in IQ-ME and sibling-repo full test suite to confirm no regression.

## Dev Agent Record

### Completion Notes List

_(populated during implementation)_

### File List

_(populated during implementation)_

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-6-7` (blocks `epic-7`).
