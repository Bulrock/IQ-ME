# Retro — Bridge 1→2 (tds story unfreeze-tests CLI affordance)

- **Date:** 2026-05-19
- **Scope:** bridge-1-2 (1 story: bridge-1-2-1-add-tds-story-unfreeze)
- **Status:** story `approved`; bridge squash-merged to `main` via PR #2 (commit 036f1e5)
- **Aggregate metrics:** 1/1 delivered; 8 auditor review rounds (4 unique findings replayed 2×); 0 blockers; 4 info-severity deferred findings; cross-repo split (upstream `bmad-tds-module` + IQ-ME bundle install)

## What went well

- **Bridge fulfilled its precise scope and unblocked epic-2.** The original epic-1 retro identified one explicit pain point (frozen-test edit friction caught twice). One bridge story, one CLI subcommand (`tds story unfreeze-tests`), one bundle drop. No scope creep. Memory note `feedback_tds_state_machine_quirks.md` updated in-flight (AC #7) so the affordance is discoverable from day one.
- **TDD discipline held under cross-repo split.** Failing-test scaffold authored upstream (22 vitest cases covering AC #1–#6), then impl, then bundle rebuild — even though the test files physically live outside IQ-ME's working tree. The state-manifest audit-trail entry was made deliberately as "audit-trail-only" with explicit acknowledgement that upstream git owns the bytes. Clean handling of an awkward boundary.
- **State-machine seed bugs caught at test-review stage, not in prod.** Cycle 1 of test-review caught two test-design errors: AC #4 targeting unreachable forward transitions (`tests-needs-revision → in-progress`), and AC #6 seeding states the auto-flip path can't reach `tests-needs-revision` from. Both corrected in cycle 2. Confirms the value of dedicated test-review before impl.
- **Atomic-or-nothing rigor in CLI design.** AC #2 partial-failure tests assert NOT just non-zero exit but ALSO that no events leak to state-transitions.jsonl AND integrity-events.jsonl AND no sprint-status mutation. Easy to ship a "passing" test that silently leaks side-effects on the failing path; this one didn't.
- **Backward-compat preserved without compromising new contract.** Auto-flip on tests-approved/tests-drafting kept as ergonomic shortcut; forward-transition blocker enforces correctness regardless. Legacy v1 callers (kind="unfreeze-tests") still accepted alongside new kind="unfreeze". Both contracts pinned by tests.

## What broke / what's friction-hostile

- **Auditor review-loop replayed identical findings without convergence.** 8 review rounds; rounds 5-8 are byte-identical replays of 1-4. All 4 unique findings are severity=info, none blocked merge. Pattern signals auditor lacked an "approved-with-deferred-findings" verdict path and kept re-emitting. **See L1.**
- **Cross-repo bundle install scope-gap.** Bridge spec implemented in upstream `bmad-tds-module` (TypeScript source) and IQ-ME bridge branch only received the rebuilt bundle. Upstream commit + push + release tag + IQ-ME re-pin were treated as "out of scope, user handles separately" — leaving 8 uncommitted upstream modifications + 2 untracked files. Next `bmad install` would silently regress the feature. **See L2.**
- **Pre-existing integrity drift surfaces post-retro.** Epic-1 retrospective post-edited stories/1-6 and stories/1-7 specs without re-ratifying integrity. `tds integrity verify` reports `failed=2` on those paths. Non-blocking for bridge-1-2 itself but will trip preflight on the very next story's PR-create. **See L3.**
- **TS-strict warning stuck in a frozen test file.** `noUncheckedIndexedAccess` at `src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts:492`. Cannot patch in-place because tests were frozen post-test-author. Mild but real bootstrap problem; perfect dogfood case for the new CLI. **See B2.**

## Lessons captured

- [lesson-2026-05-19-005](../../_tds/memory/lessons.yaml) — **L1 (process, medium):** Auditor review-loop on info-only findings should converge after round 1; re-emit signals missing `approved-with-deferred` exit.
- [lesson-2026-05-19-006](../../_tds/memory/lessons.yaml) — **L2 (process, medium):** Cross-repo CLI bridges (upstream impl + downstream bundle install) must scope "upstream commit + release + downstream re-pin" explicitly, or downstream regresses on next `bmad install`.
- [lesson-2026-05-19-007](../../_tds/memory/lessons.yaml) — **L3 (tooling, low):** Retro that edits story specs post-epic-merge silently drifts `tds integrity`; retro orchestrator should self-verify before final sprint-status flip.

## Bridge Plan

```yaml
proposed_at: 2026-05-19
type: tech-debt
candidates:
  - title: Commit + push upstream bmad-tds-module + cut release tag + re-pin IQ-ME bundle
    justification: |
      Bridge-1-2-1 impl lives in upstream bmad-tds-module as 8 uncommitted modifications + 2 untracked files
      (src/state/unfreeze-windows.ts, src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts). IQ-ME ships
      the rebuilt bundle (_bmad/tds/shared/tds-runtime.bundle.js 761673 bytes) but the upstream tree from
      which it was built has no commit anchor. Next `bmad install` against upstream main would silently
      regress unfreeze-tests in IQ-ME. Plan: (a) commit upstream changes with tests, (b) push to procksha/
      bmad-tds-module main, (c) cut a release tag for the new module version, (d) re-run `bmad install`
      OR pin module version in `_bmad/_config/manifest.yaml`, (e) re-record IQ-ME bundle integrity against
      the released version. Time-box: 0.5 day.
    sources:
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 5
        finding_index: 1
  - title: Dogfood `tds story unfreeze-tests` on its own TS-strict warning
    justification: |
      Frozen test file src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts:492 fails
      `noUncheckedIndexedAccess` typecheck. Cannot patch in-place because tests were frozen
      post-test-author phase. The new CLI shipped by bridge-1-2-1 is exactly the affordance to fix this —
      perfect dogfood case. Flow: `tds story unfreeze-tests --story=bridge-1-2-1-... --files=...
      --reason="resolve noUncheckedIndexedAccess strict warning" --as=engineer` → add
      `// @ts-expect-error` or refactor index access → `tds integrity record --as=engineer` close.
      Time-box: 1h.
    sources:
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 2
        finding_index: 1
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 6
        finding_index: 1
  - title: Pin `halted`-bypass forward-blocker contract via dedicated test
    justification: |
      Current impl treats any non-`halted` target as "forward" and lets `halted` bypass the open-window
      blocker. Reasonable default for emergency-exit semantics but NOT pinned by AC #4 tests — story spec
      is silent on the case. If a future user invokes `state set --status=halted` from an open unfreeze
      window, current behavior is implicit. Add upstream test: seed open-window + state=in-progress,
      target=halted, assert blocker DOES NOT fire. Time-box: 30min.
    sources:
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 3
        finding_index: 1
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 7
        finding_index: 1
  - title: Ratify epic-1 retrospective drift on stories/1-6 + stories/1-7
    justification: |
      Epic-1 retrospective post-edited two story specs after integrity was recorded. `tds integrity verify`
      reports `failed=2` on those paths. Non-blocking for bridge-1-2 but will trip preflight on every
      subsequent story's PR-create (Mode 1) and epic-execute preflight. Single command:
      `tds integrity record --as=engineer --files=_bmad-output/implementation-artifacts/stories/1-6-...md,
      _bmad-output/implementation-artifacts/stories/1-7-...md --story=epic-1-retrospective
      --notes="retrospective post-edit drift ratification"`. Time-box: 30s. RECOMMENDED before
      merging next bridge / epic.
    sources:
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 4
        finding_index: 1
      - story: bridge-1-2-1-add-tds-story-unfreeze
        kind: auditor-finding
        round: 8
        finding_index: 1
```

## Action items (not bridge-scope)

- **Auditor skill maintainer:** add `approved-with-deferred-findings` to the verdict envelope output path so review-loop converges on round 1 when all unique findings are severity=info and specialist ack'd. Source: L1.
- **TDS orchestration:** consider adding `tds integrity verify` as automatic pre-step in retro orchestrator's final sweep, gating on failed=0 (or explicit user-confirmed defer). Source: L3.
- **Phase-2 archival owner:** when bridge-1-2 is included in phase archive, capture both retro-epic-1.md and retro-bridge-1-2.md together — the bridge is the realization of retro-epic-1.md's bridge plan, and the two docs read in sequence.

## References

- Bridge story: [_bmad-output/implementation-artifacts/stories/bridge-1-2-1-add-tds-story-unfreeze.md](../stories/bridge-1-2-1-add-tds-story-unfreeze.md)
- Source retro (planted the bridge candidate): [retro-epic-1.md](retro-epic-1.md)
- Lessons: [_bmad-output/_tds/memory/lessons.yaml](../../_tds/memory/lessons.yaml)
- Integrity manifest: [_bmad-output/_tds/state-manifest.yaml](../../_tds/state-manifest.yaml)
- Branch registry: [_bmad-output/_tds/branch-registry.yaml](../../_tds/branch-registry.yaml)
- Bridge merge commit: 036f1e5 (PR #2, squash → main)
- Upstream impl repo (uncommitted at retro time): /Users/maksim/git/bmad-tds-module/
