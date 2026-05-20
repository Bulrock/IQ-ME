# Retro — Bridge 4→5 (tds integrity-remove CLI + sweep auto-record + test-isolation convention doc)

- **Date:** 2026-05-20
- **Scope:** bridge-4-5 (2 stories: bridge-4-5-1, bridge-4-5-2)
- **Status:** both stories `done`; bridge squash-merged to `main` as commit `440db00` (PR #9), followed by manual finalization commit `61dbc7b` (OH-07 recovery)
- **Aggregate metrics:** 2/2 delivered; 0 abandoned; 0 blockers across the cumulative epic review; 1 story carried 2 round-N `[info]`-only findings (bridge-4-5-1); avg review rounds = 1; 114 verified integrity entries / 2 failed (1 = sprint-status.yaml sweep-scope class — bridges to B1; 1 = `tests/golden/regenerate.R` carry-over declared Epic-5 follow-up per bridge-4-5-1 AC-6); 0 forbidden-quadrant violations; 18 new tests in sibling `bmad-tds-module` + cross-repo policy doc landed

## What went well

- **Bridge-from-retros assembly worked first-time across three consecutive retros.** Epic-3 retro proposed `tds integrity-remove` CLI; epic-4 retro re-confirmed (B1) and added the filesystem-isolation convention (B2); `tds epic create-bridge-from-retros` assembled both into this bridge with no manual merging. The "propose → defer → re-propose → forcing-function pull" pattern played out cleanly when the bridge tool was available.
- **Cross-repo Option-A scope partition shipped without friction.** Tasks 1-4 of bridge-4-5-1 landed in sibling `bmad-tds-module` on its own feature branch (`feat/integrity-remove-and-sweep-autorecord`); Tasks 5-6 ran in IQ-ME consuming a temporary bundle bump on the epic branch. Commit message marked the bump as temporary + Story-Id trailer kept audit trail. Validates the cross-repo pattern memorialized in [project_iqme_tds_module_split](../../../.claude/projects/-Users-maksim-git-IQ-ME/memory/project_iqme_tds_module_split.md). **See [L2](#lessons-captured).**
- **Specialist Self-Review "Areas of uncertainty" subsection actively fed the auditor.** Bridge-4-5-1's self-review surfaced three uncertainty items; two of the three became bridge candidates (sweep-scope expansion + autorecord telemetry — both in B1 below). Honest pre-emptive disclosure shortened the auditor pass to a single round. **See [L3](#lessons-captured).**
- **AC-2 sweep auto-record closed the spec-md drift class.** After bridge-4-5-1 landed, `tds story add-finding` cycles no longer cause subsequent `tds integrity verify` failures on `stories/**.md` paths — the sweep handler re-records them in-band. Removes the "noise budget" that epic-3 and epic-4 retros both flagged.
- **Convention doc (bridge-4-5-2) shipped lean.** 88 lines (under the 100-line budget), `docs/test-isolation.md` covers the writable pattern (`mkdtempSync` + `IQME_<SCOPE>_OUT`) and the read-only counter-pattern (`t.skip()`), plus a bonus "Why not `process.chdir`" section. Cross-link in `docs/corpus-build-conventions.md` makes it discoverable for Epic-5 corpus-emit tests.
- **Atomic-fail design for `tds integrity remove` matched operator audit-trail intent.** Specialist Self-Review decision #1 chose atomic-fail over soft-fail on unknown paths. Operator can retry idempotently after fixing a typo; soft-fail would have left the manifest in a half-modified state requiring a manual read-before-retry cycle. Right design call.

## What broke / what's friction-hostile

- **`tds deliver` Mode 2 hit OH-07 partial finalize — third documented occurrence.** PR #9 squash-merged successfully on remote, but locally: (a) deliver did not switch to main, (b) only the epic key flipped `approved → done` (stories left at `approved`), (c) post-merge sprint-status flips landed as uncommitted working-tree dirt on epic_branch instead of an auto-finalization commit on main. Pattern stable across epic-2 (different mode), epic-3, and now bridge-4-5. Manual recovery cost: ~5 min (flip stories via `sprint_status_writer.py`, `git reset --hard origin/main` because squash replaced SHAs, apply stashed state flips, commit `61dbc7b`, push, delete epic branch). **See [L1](#lessons-captured)** and existing memory [feedback_tds_deliver_oh07_partial](../../../.claude/projects/-Users-maksim-git-IQ-ME/memory/feedback_tds_deliver_oh07_partial.md).
- **Sweep auto-record (AC-2) scope deliberately narrow — leaves `sprint-status.yaml` drift uncovered.** Specialist Self-Review decision #3 scoped auto-record to `_bmad-output/implementation-artifacts/stories/**.md` only. Correct decision for retros/archive (which must stay frozen), but the immediate observable consequence is that every story status flip leaves `sprint-status.yaml` drift surfacing as `integrity verify` failure. Auditor info-finding #1 → bridge candidate B1.
- **No telemetry event for sweep autorecord mutations.** When `autoRecordDriftedSpecs` re-records a drifted spec-md, it uses synthesized `recorded_by: "state-commit-autorecord"` in the manifest but emits no matching `kind: record` (or `kind: autorecord`) event in `integrity-events.jsonl`. Future auditor reading JSONL won't see the mutation; only the manifest carries the attribution. Observability gap. Auditor info-finding #2 → bridge candidate B1.
- **`tests/golden/regenerate.R` integrity drift carry-over** declared out-of-scope per bridge-4-5-1 AC-6 ("Epic-5 follow-up"). Now the lone remaining `failed=1` entry. Decision was correct (sprawl avoidance) but the drift persists into Epic-5.

## Lessons captured

- [lesson-2026-05-20-004](../../_tds/memory/lessons.yaml) — **L1 (process, medium):** After `/bmad-tds-code-review --epic=<id>` auto-deliver completes, ALWAYS verify on `origin/main` that every story key AND the epic key show `done` in `sprint-status.yaml`. If any story is still at `approved`, DO NOT re-run `tds deliver` — it does not detect the merged PR reliably (squash SHAs diverge from local) and may open a phantom second PR. Use manual recovery: flip stories via `sprint_status_writer.py`, hard-reset local main to `origin/main`, commit finalization on main, delete epic branch. Third documented occurrence of the OH-07 partial-finalize pattern.
- [lesson-2026-05-20-005](../../_tds/memory/lessons.yaml) — **L2 (process, low):** Cross-repo Option-A scope partition + temporary bundle bump on epic branch is the canonical pattern when a story spans IQ-ME + sibling `bmad-tds-module` repo. Implement+test in sibling-repo on its own feature branch; consume in IQ-ME via temporary bundle bump committed on the epic branch with explicit "temporary; superseded by next release" + Story-Id trailer. Avoids blocking on full npm release cycle; superseded naturally on next formal sibling release.
- [lesson-2026-05-20-006](../../_tds/memory/lessons.yaml) — **L3 (process, low):** Treat the Specialist Self-Review "Areas of uncertainty" subsection as a non-penalty disclosure channel. Auditor uses it both as deep-scrutiny prompt AND bridge-candidate source. In bridge-4-5-1, two of three self-disclosed uncertainties (sweep-scope expansion + autorecord telemetry) became bridge proposals directly. Honest disclosure → better verdicts, faster review rounds.

## Bridge Plan

```yaml
proposed_at: 2026-05-20
type: tech-debt
candidates:
  - title: Extend sweep auto-record to sprint-status.yaml + emit autorecord telemetry event
    justification: >-
      Both info findings from bridge-4-5-1 land in the same handler
      (autoRecordDriftedSpecs in sibling commit-sweep.ts).
      (a) Extend scope to also cover the well-known path
      `_bmad-output/implementation-artifacts/sprint-status.yaml`
      (or a small allowlist of workflow-mutated state-yaml files),
      keeping retros/archive frozen per current decision;
      (b) emit `kind autorecord` (or equivalent) integrity event from
      autoRecordDriftedSpecs so JSONL mirrors manifest mutation, aligning
      with existing `kind record` / `kind remove` pattern.
      Low coupling — single file, single epic-branch session.
      Time-box 1 day. Closes the only remaining sweep-scope drift class
      observed in this retro.
    sources:
      - story: bridge-4-5-1-tds-integrity-remove-cli
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: bridge-4-5-1-tds-integrity-remove-cli
        kind: auditor-finding
        round: 2
        finding_index: 1
```

## Applied to bridge: bridge-5-6 @ 2026-05-20T09:59:33.244Z
