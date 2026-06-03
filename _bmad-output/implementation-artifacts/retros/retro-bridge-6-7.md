# Retro — Bridge 6→7 (state-commit sweep + tds deliver Mode 2 + Carry-forward injection)

- **Date:** 2026-05-20
- **Scope:** bridge-6-7 (3 stories: bridge-6-7-1, bridge-6-7-2, bridge-6-7-3)
- **Status:** 3/3 stories `done`; bridge squash-merged to `main` as commit `7770295` (PR #12); finalize-and-flip auto-completed via the new Mode 2 OH-07 recovery (delivered by bridge-6-7-2 itself), see [What went well](#what-went-well).
- **Aggregate metrics:** 3/3 delivered; 0 abandoned; 0 blockers; 2 round-1 `[info]`-only findings (1 verification-stimulus self-resolved on bridge-6-7-1; 1 release-engineering deferral on bridge-6-7-3 → B1 below); avg review rounds = 1; 0 forbidden-quadrant violations; 22 tasks across 3 stories; 19 new tests (bridge-6-7-1: 4 unit + cross-repo integration; bridge-6-7-2: 4 deliver-resume unit; bridge-6-7-3: 8 Phase A + 7 Phase B); 3 sibling-repo `bmad-tds-module` branches + 3 bundle bumps on the epic branch (Option-A pattern, lesson-2026-05-20-005 reused 3×).

## What went well

- **Mode 2 OH-07 recovery self-exercised on its own PR.** bridge-6-7-2 closed the third documented OH-07 partial-finalize occurrence (after epic-3, epic-4, epic-5). The very next `tds deliver` invocation — finalizing this bridge's own PR #12 — triggered the new recovery branch automatically: `_bmad-output/_tds/runtime/telemetry/integrity-events.jsonl` carries 3 `kind: deliver-resume` events (one per child story) plus 1 `kind: deliver-resume-summary` (`stories_recovered: 3, pr_state: merged, pr_number: 12`). Zero manual operator steps; the `sprint_status_writer.py` fallback documented in memory `feedback_tds_deliver_oh07_partial` was not needed. **See [L2](#lessons-captured).**
- **Cross-repo Option-A pattern reused 3× without friction.** All three stories spanned IQ-ME + sibling `bmad-tds-module`; each used a sibling feature branch for upstream impl + temporary bundle bump committed on the epic branch with "temporary; superseded by next release" + Story-Id trailer. Validates lesson-2026-05-20-005 and `project_iqme_tds_module_split` memory at higher cadence (1 use/epic → 3 uses/bridge).
- **Single-round auditor convergence across all three stories.** No story carried a round-2 review; the two surfaced findings were honest `[info]`-only (one was the verification stimulus itself; one was an explicit deferral with `suggestedBridge`). Specialist Self-Review "Areas of uncertainty" subsections (lesson-2026-05-20-006) absorbed three uncertainty items in bridge-6-7-3 — two went straight to bridge candidates (B2, B3 below), the third was a non-blocking documentation deferral (B1).
- **Phase A diagnostic root-caused the actual regression, not a symptom.** bridge-6-7-3 Task 1 traced the missing `### Carry-forward lessons` section across epic-1..5 specs and discovered: the section was **never tooling-enforced**. Authors wrote it convention-style up through 5-1, then silently dropped it in 5-2..5-7. The fix is enforcement (template heading + skill workflow step 4b memory-query + lint gate) — not "backfill the missing files." Correct scoping under Karpathy Simplicity-First; smallest-surface 4-file change (lint + template + SKILL.md + Makefile) versus a CLI-side regression hunt that would have found nothing.
- **bridge-6-7-1 design-deviation was honest, documented, and accepted.** AC-3 literally named `recordIntegrity`, but the actual event-discriminator surface lives in `autoRecordDriftedSpecs` (kind:autorecord, not kind:record). The engineer extended `autoRecordDriftedSpecs` instead of refactoring `recordIntegrity`, documented the choice under `## Specialist Self-Review → Decisions made`, and the auditor accepted it as design-equivalent (info-only verification stimulus). **See [L1](#lessons-captured).**

## What broke / what's friction-hostile

- **`bridge-6-7-retrospective` key was never seeded into `sprint-status.yaml`.** `bmad-create-epic` seeds `epic-N-retrospective: optional` for canonical epics but `tds epic create-bridge-from-retros` does not seed a sibling key for bridges. As a result Step 5 of `/bmad-tds-retro` falls through silently (the orchestrator's documented `skip silently` branch) — fine for now, but bridges are accumulating without a tracked `done` marker beyond the retro-md existing. Possible future tightening: have the bridge applier seed `bridge-N-N+1-retrospective: optional` parallel to BMAD's epic convention. Not a blocker; recording for visibility.
- **Hook-count contract bump is invisible to downstream pilots.** bridge-6-7-3 Phase B added a third hook (`pre-commit`) to `tds setup init --profile=full` (was: `commit-msg` + `prepare-commit-msg`; now: + `pre-commit`). Downstream pilots (callisto, alcosi per memory notes) that pin hook count in their own setup tests will break on the next `bmad-tds-module` release. Sibling `init.test.ts` was updated from "2 hooks" to "3 hooks" but there is no CHANGELOG channel that signals this to pilots beyond commit logs. Auditor [info] finding round-1 → bridge candidate **B1**.
- **Pre-commit hook awk parser is brittle against schema drift.** The hook parses `_bmad-output/_tds/state-manifest.yaml` (for class-A path matching) and `_bmad-output/_tds/unfreeze-windows.yaml` (for active-window probes) via bash+awk regex on canonical-form YAML — single-line scalars per ADR-0014. If a future story emits a multi-line scalar or flow-style entry, the awk script silently exits 0 (treats as no-window) → false-positive warning OR false-negative miss. Decision was correct (sub-10ms vs ~150-300ms Node fork; see [L3](#lessons-captured)), but the schema-lock side is informal. Self-Review "Areas of uncertainty" #1 → bridge candidate **B2**.
- **`LEGACY_EXEMPT` allow-list in `lint-spec-carry-forward.mjs` is centrally maintained.** Each retroactive remediation of a legacy spec (epic-1..3 historical, plus 5-2..5-7 if anyone backfills) requires editing a single Node array, not a per-spec frontmatter flag. Acceptable today (bounded set), brittle long-term. Self-Review "Areas of uncertainty" #3 → bridge candidate **B3**.

## Lessons captured

- [lesson-2026-05-20-010](../../_tds/memory/lessons.yaml) — **L1 (process, medium):** When an Acceptance Criterion literally names an internal symbol (e.g. `recordIntegrity`), the actual observable surface (event kind, discriminator, drift behavior) may live in a sibling helper (e.g. `autoRecordDriftedSpecs`). Implementation should match the AC's *intent* (observable telemetry + invariants), not the literal symbol name. Self-Review under `## Specialist Self-Review → Decisions made` documents the deviation; auditor accepts design-equivalent extensions as info-only. Pattern from bridge-6-7-1 AC-3.
- [lesson-2026-05-20-011](../../_tds/memory/lessons.yaml) — **L2 (process, medium):** A bridge story that ships a recovery / resume affordance for an operation running at delivery time (e.g. `tds deliver` Mode 2 OH-07) can self-exercise that affordance on the bridge's own PR finalize. bridge-6-7-2 closed the third OH-07 occurrence; PR #12 finalize auto-triggered the new recovery branch and emitted 3 `kind: deliver-resume` + 1 `kind: deliver-resume-summary` with zero manual operator step. Tail the telemetry JSONL as live AC-7 evidence in Completion Notes / retro.
- [lesson-2026-05-20-012](../../_tds/memory/lessons.yaml) — **L3 (technical, low):** Pre-commit hooks must run sub-10ms. bash+awk on canonical-form YAML (ADR-0014 single-line scalars, no flow style) parses cleanly with no external runtime dependency; Node/Python fork costs ~150-300ms cold-start on macOS — unacceptable interactive latency for chore commits. Graceful exit-0 on schema drift (multi-line scalars, flow-style) is the right degradation: false-negative warning beats false-positive crash. Same tradeoff applies to `commit-msg` and `prepare-commit-msg` hooks.

## Bridge Plan

```yaml
proposed_at: 2026-05-20
type: tech-debt
candidates:
  - title: CHANGELOG discipline for sibling installer-contract bumps
    justification: >-
      bmad-tds-module ships a new git hook in setup init/full
      (bridge-6-7-3 added pre-commit; sibling init.test.ts now
      asserts 3 hooks instead of 2). Downstream pilots (callisto,
      alcosi) that pin hook count in their setup tests will break
      on the next release with no deterministic signal beyond the
      commit log. Standardize a CHANGELOG entry on every hook-count
      or installer-contract bump (with bypass-mechanism callout —
      TDS_BYPASS=1 parity). One-file release process change,
      no code in IQ-ME. Time-box half a day; ship as a
      bmad-tds-module-side discipline note + initial CHANGELOG row
      covering the bridge-6-7-3 hook addition.
    sources:
      - story: bridge-6-7-3-restore-carry-forward-lessons
        kind: auditor-finding
        round: 1
        finding_index: 1
  - title: Tighten unfreeze-windows.yaml schema lock
    justification: >-
      Pre-commit hook (bridge-6-7-3 Phase B) parses
      unfreeze-windows.yaml via bash+awk on the canonical
      single-line scalar form (ADR-0014). If a future story
      writes a multi-line scalar or flow-style entry, the
      hook silently exits 0 and treats it as no-window —
      false-positive warning on class-A edits that ARE
      under an active unfreeze. Either add a sibling
      schema-validator that runs alongside writes
      (preferred — same code path as state-manifest's
      Class I lock) or amend ADR-0014 to enumerate
      unfreeze-windows.yaml explicitly in the canonical-form
      requirement. Low coupling; one ADR amendment OR
      one ~50-line validator. Time-box 1 day.
    sources:
      - story: bridge-6-7-3-restore-carry-forward-lessons
        kind: completion-note
        ref: >-
          Specialist Self-Review Areas-of-uncertainty bullet 1 —
          hooks unfreeze-windows.yaml parser handles only the
          canonical schema observed in state today
  - title: Replace LEGACY_EXEMPT central list with per-spec frontmatter flag
    justification: >-
      lint-spec-carry-forward.mjs LEGACY_EXEMPT array (tools side)
      flags legacy specs that pre-date the Carry-forward enforcement.
      Each retroactive remediation requires editing the array
      centrally — brittle as new stragglers surface. Replace with
      a per-spec frontmatter field lint-exempt-carry-forward set
      to true; lint reads the frontmatter and skips the spec if set.
      Migration: one-time pass converts current LEGACY_EXEMPT
      entries to frontmatter flags + removes the array. Same lint
      behavior, distributed maintenance, no central-edit gate.
      Time-box half a day.
    sources:
      - story: bridge-6-7-3-restore-carry-forward-lessons
        kind: completion-note
        ref: >-
          Specialist Self-Review Areas-of-uncertainty bullet 3 —
          Carry-forward section lint exempt-list LEGACY_EXEMPT
          is brittle, requires manual maintenance
```

## Applied to bridge: bridge-7-8 @ 2026-06-03T13:42:03.865Z
