# Retro — Epic 5 (Methodology corpus: 29 EN pages + FR36-protection lint + typographic-freeze + Phase-2 diagrams)

- **Date:** 2026-05-20
- **Scope:** epic-5 (7 stories: 5-1, 5-2, 5-3, 5-4, 5-5, 5-6, 5-7)
- **Status:** all stories `done`; epic squash-merged to `main` as commit `5484185` (PR #11); finalization recovery via `246bf95` (post-merge OH-07 patch)
- **Aggregate metrics:** 7/7 delivered; 0 abandoned; 0 unresolved blockers (3 blockers raised at cumulative review, all resolved in-loop with `Resolved:` markers in 5-2 / 5-4 / 5-5); 4 `[info]` findings (deferrals + inherited drift in 5-1, 5-2, 5-7); test count 705 → 875 (+170 across the epic); 29 EN methodology pages authored (target met for the anchor-pages-frozen tag); 0 forbidden-quadrant denials in the epic-5 window; 0 new lints (one new: `lint-fr36-protection`); 1 OH-07 partial-finalize incident recovered manually; integrity verify at retro open: 129 verified / 1 failed (`sprint-status.yaml` post-sweep auto-record lag — same class as epic-4 §What broke item 1)

## What went well

- **Epic-4 lessons applied cleanly.** No `/tmp/self-review-N.md` paths anywhere in epic-5 (lesson-2026-05-20-001 honored); no empty `### File List` sections (lesson-2026-05-20-002 honored). Both new-process lessons captured at the epic-4 retro carried into the very next epic without further coaching.
- **Forward-design pattern paid off twice.** Story 5-1's translation-stub CSS-side composition + `data-translation-status` body-attr hook is **wired and tested** today; Epic 7 content lights up against a frozen contract with zero rename churn. Same pattern repeated in 5-7 (`tail-aware-trail.css` ships as CSS-only surface; HTML composition lands in Epic 6 result-page). Counter-pattern to lesson-2026-05-19-010 — validates lesson-2026-05-20-003 in production.
- **All 3 cumulative-review blockers resolved in-loop, not deferred.** Each of 5-2 / 5-4 / 5-5 carries a `**Resolved:**` line under its blocker finding pointing at `tds integrity record` + sweep commits (`849ca95`, `bf9980f`). `tds integrity verify` went from 125 verified / 5 failed at 11:41:29 to 130 verified / 0 failed by 11:44:47 — fully clean for the auditor's verdict step (verdict never emitted because remediation happened first, then `tds deliver` ran).
- **Karpathy #2 (Simplicity First) explicit in story decisions.** Story 5-1 deferred `translationStatus` full build branch to Epic 7 (no non-EN content yet); story 5-2 deferred lede auto-wrap (editorial discipline sufficient); story 5-5 bumped `methodology-pages-en` budget 30→45 with documented rationale (glossary + tail-scene placeholders); story 5-6 set `lastReviewed` to ISO date + carried placeholder posture in body header (rather than relaxing `lint-frontmatter`); story 5-7 shipped eap-shrinkage diagram as qualitative-not-quantitative SVG. Each decision documented inline in Self-Review §1; reviewer can audit the bounded scope.
- **lesson-2026-05-19-009 (deferred-validation CI surfaces) applied prophylactically.** Every story confirmed `make test`, `make lint`, `make build` exit 0 locally before status flip. Zero post-merge hotfix PRs in epic-5 (epic-2 / epic-3 each had one). The 7 lints newly activated in epic-4 ran clean against the growing corpus the entire epic.
- **Methodology corpus exit criterion hit.** 29 EN pages, 9/9 claims authored (`lint-claims-manifest --strict` exit 0 with zero deferred WARNs by Story 5-4), 5 glossary entries, 5 crisis-resource entries, 2 tail-scene placeholders, 2 Phase-2 diagram surfaces (validity-envelope, eap-shrinkage). FK ≤12 invariant held across all 29 pages.

## What broke / what's friction-hostile

- **`lesson-2026-05-19-001` fired 3× despite being captured in epic-1.** Stories 5-2, 5-4, 5-5 each modified a class-A artefact_class test (`ci-matrix.test.mjs`, `lint-glossary-coverage.test.mjs`, `lint-reading-level-coverage.test.mjs`, `lint-claims-manifest.test.mjs`, `cognitive-load-budget.test.mjs`) without re-registering integrity. The Self-Review §2-3 in each story disclosed the modification honestly (intent transparent) — the failure mode is the registry update step, not authorial dishonesty. Root cause: **only story 5-1 carried a `### Carry-forward lessons` section in its spec; stories 5-2..5-7 omitted the section entirely**. Lesson capture worked; lesson DELIVERY regressed. **See [L1](#lessons-captured) and [B4](#bridge-plan).**
- **`tds story add-finding` does not re-record state-manifest after its auto-commit.** Telemetry `integrity-events.jsonl` at `2026-05-20T11:41:59Z` shows `kind=record recorded_count=5` with reason: *"Re-register spec files after auditor add-findings appended round-1/round-2 sections (auto-commit shipped but integrity registry not bumped by add-findings handler)"*. Engineer had to manually issue `tds integrity record --files=<5 spec-mds>` to clear the drift the add-findings handler itself created. Same root-cause family as bridge-5-6 but on a different code path. **See [L2](#lessons-captured) and [B1](#bridge-plan).**
- **`tds deliver` OH-07 partial-finalize recurred** (already-captured lesson-2026-05-20-004 hit again). On epic-5 `tds deliver` flipped only `epic-5 → done` on the epic branch; stories 5-1..5-7 stayed at `approved`, and the working copy did not switch to `main`. Recovery via `python3 sprint_status_writer.py` directly + manual commit `246bf95` ("chore(epic-5): post-merge finalization — flip 7 stories + epic-5 → done") landed after the PR-#11 squash-merge. Two consecutive epics (epic-4, epic-5) recovered manually — the pattern is now a forcing-function signal. **See [B2](#bridge-plan).**
- **Frozen-test edit ergonomics is a recurring friction surface.** The three-step ceremony (unfreeze window → Edit → integrity record) is easy to forget under a state=tests-pending invariant. Auditor's own bridge candidate in story 5-2 named the affordance: *"`tds story modify-frozen-test --story=<id> --file=<path>` that bundles unfreeze-window + Edit + integrity record into one ceremony; OR pre-commit hook that warns on edit-to-class-A path without surrounding unfreeze window."* Surfaces every time the corpus matures and a previously frozen test needs a small structural update. **See [L3](#lessons-captured) and [B3](#bridge-plan).**
- **Inherited `sprint-status.yaml` post-sweep drift (same as epic-4).** `tds integrity verify` reports 1 failed at retro open: `sprint-status.yaml` (expected sha2 6ab2931… from 2026-05-20T11:46:54Z, actual sha2 fafbdc98…). This is the auto-record-from-state-commit lag pattern that bridge-5-6-1 (sweep auto-record extension) already shipped for. The remaining noise is the gap between commit close and next-session verify; clears mechanically on next sweep. Not bridged again — covered by existing infrastructure.
- **`tests/golden/regenerate.R` inherited drift carries one more retro.** Same artefact called out in story 5-1's `[info]` finding (commit 4b0f51c landed after registry record on main). Resolved via `tds integrity record` at `2026-05-20T11:41:13Z` (telemetry record event with reason *"Re-register after main commit 4b0f51c 'fix(golden): skip estimation in regenerate.R parameter template (#5)' which landed AFTER prior registration; inherited drift cleanup during epic-5 review"*). Now clean — no longer cross-retro.

## Lessons captured

- [lesson-2026-05-20-007](../../_tds/memory/lessons.yaml) — **L1 (process, high):** Story specs must carry a populated `### Carry-forward lessons` section listing memory hits relevant to the touched surfaces. In epic-5 only story 5-1 included the section; stories 5-2..5-7 omitted it entirely. lesson-2026-05-19-001 (already captured in epic-1) fired 3× as a direct consequence. The lesson capture pipeline worked; the lesson DELIVERY pipeline regressed. The injection mechanism (`tds memory query` → spec section) is the load-bearing affordance, not the lesson catalog itself.
- [lesson-2026-05-20-008](../../_tds/memory/lessons.yaml) — **L2 (tooling, medium):** `tds story add-finding` auto-commits the touched spec-md but does not re-record state-manifest; touched specs immediately fail `tds integrity verify` until a manual `tds integrity record`. In epic-5 cumulative review, 5 specs (5-1, 5-2, 5-4, 5-5, 5-7) were touched by add-finding → all 5 drifted → engineer remediated with a single batched `record --files=<5>` call. Same root-cause family as bridge-5-6 but on a different code path.
- [lesson-2026-05-20-009](../../_tds/memory/lessons.yaml) — **L3 (tooling, low):** Editing a class-A frozen test cross-epic requires the three-step ceremony (unfreeze-window → Edit → integrity record); the friction surface is recurring. Origin lesson-2026-05-19-001 captures the failure mode; this lesson captures the ergonomics. Auditor in story 5-2 proposed two viable affordances: bundled CLI subcommand OR pre-commit warning hook. Bridge B3 will pick one.

## Bridge Plan

```yaml
proposed_at: 2026-05-20
type: tech-debt
candidates:
  - title: tds story add-finding must re-record integrity for touched spec-md
    justification: >-
      Confirmed via telemetry kind=record at 2026-05-20T11:41:59Z with reason
      explicitly naming the gap. After any batch of add-finding calls, every
      touched spec-md fails tds integrity verify until a manual integrity
      record. Same root-cause family as bridge-5-6-1 (sweep auto-record for
      sprint-status.yaml) but on a different code path. Scope: extend
      add-finding handler to call integrity record inside the same
      transaction OR teach state-commit sweep to auto-record spec-md whose
      bytes changed in the auto-commit chain. TDS-module bridge.
    sources:
      - story: 5-2-anchor-pages-7-fr36-protection-lint-content-freeze-typographic-system-checkpoint
        kind: completion-note
        ref: "Re-registered all three files via tds integrity record --as=engineer ... Sweep commits 849ca95, bf9980f"
      - story: 5-4-scoring-4-remaining-norming-3
        kind: completion-note
        ref: "Re-registered via tds integrity record --as=engineer --files=tests/unit/tools/lint-claims-manifest.test.mjs at 2026-05-20T11:41:12Z"
      - story: 5-5-ethics-2-remaining-provenance-2-remaining-reference-3-remaining
        kind: completion-note
        ref: "Re-registered via tds integrity record --as=engineer --files=tests/scaffold/cognitive-load-budget.test.mjs at 2026-05-20T11:41:13Z"
  - title: tds deliver Mode 2 atomic finalize OR idempotent recovery on re-run
    justification: >-
      Two consecutive epics (epic-4, epic-5) hit OH-07 partial-finalize. On
      epic-5 deliver flipped only epic-5 to done on the epic branch; stories
      5-1..5-7 stayed at approved; working copy never switched to main. Manual
      recovery via sprint_status_writer.py + commit 246bf95. lesson-2026-05-20-004
      already names the bug; the persistence is the bridge signal. Scope:
      either make deliver flip child stories in same transaction as the epic
      key, or auto-detect partial state on re-run and complete it
      idempotently. TDS-module bridge.
    sources:
      - story: epic-5
        kind: completion-note
        ref: "Recovers from tds-deliver OH-07 partial finalize: deliver flipped only epic-5 on its branch; stories 5-1..5-7 left at approved. Manual flip via sprint_status_writer.py on main per memory feedback_tds_deliver_oh07_partial."
  - title: modify-frozen-test affordance OR pre-commit warning on class-A edits
    justification: >-
      Cross-epic frozen-test edits are a recurring friction surface
      (lesson-2026-05-19-001 origin epic-1; re-violated 3 times in epic-5).
      Auditor itself surfaced the affordance candidate in story 5-2 bridge
      hint. Two options to pick between during bridge design: (a) new CLI
      "tds story modify-frozen-test --story=<id> --file=<path>" that bundles
      unfreeze-window + opens for Edit + closes with integrity record in one
      ceremony; (b) git pre-commit hook that warns when a class-A path is
      edited without a surrounding unfreeze window. (a) is more discoverable;
      (b) is lower-effort and catches every code path including direct Edits.
      Bridge design picks one. TDS-module bridge.
    sources:
      - story: 5-2-anchor-pages-7-fr36-protection-lint-content-freeze-typographic-system-checkpoint
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: 5-4-scoring-4-remaining-norming-3
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: 5-5-ethics-2-remaining-provenance-2-remaining-reference-3-remaining
        kind: auditor-finding
        round: 1
        finding_index: 1
  - title: Restore Carry-forward-lessons injection in story-create
    justification: >-
      Only story 5-1 carried a populated "### Carry-forward lessons" section
      in epic-5; stories 5-2..5-7 omitted it entirely. The downstream effect
      was 3 lesson-2026-05-19-001 violations that the injection would have
      prevented. Diagnostic-first bridge: (1) determine where the injection
      regressed (template? bmad-create-story? tds story create?); (2) decide
      mitigation — make the section mandatory in the spec template, or
      auto-populate via "tds memory query --story=<id>" at create-time. The
      lesson-delivery pipeline is the load-bearing affordance — a captured
      lesson that doesn't reach the next author is functionally equivalent
      to no lesson at all. Bridge mixes process + tooling.
    sources:
      - story: 5-2-anchor-pages-7-fr36-protection-lint-content-freeze-typographic-system-checkpoint
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: 5-4-scoring-4-remaining-norming-3
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: 5-5-ethics-2-remaining-provenance-2-remaining-reference-3-remaining
        kind: auditor-finding
        round: 1
        finding_index: 1
```

## Action items (not bridge-scope)

- **Run `bmad-tds-bridge-from-retros` before opening Epic-6.** With 4 strong tech-debt candidates queued (B1 + B2 + B3 + B4 above, all tooling-or-process surfaces on the BMAD-TDS pipeline itself), the forcing function for `tds epic create-bridge-from-retros --all-unprocessed --blocks=epic-6` has arrived. Bundle is coherent: every candidate targets the same lifecycle (story-create → add-finding → frozen-test edit → integrity record → deliver). Recommend bridge-5-6 was already shipped (sweep auto-record); the next bridge-N-(N+1) is therefore `bridge-6` (or `bridge-5-6-extension`, depending on how the applier names it).
- **Sweep clears `sprint-status.yaml` drift automatically.** No manual action; verify post-retro that `tds integrity verify` exits 0 after this sweep commit.
- **Epic-6 PRD/architecture reference:** Epic-6 picks up several explicit Epic-5 deferrals: lede auto-wrap evaluation (story 5-2 AC-8), tail-aware-trail HTML composition (story 5-7), eap-shrinkage SVG inline rendering in `scoring/eap.md` (story 5-7 → 5-3 AC-5). All three are bounded; none escalate.

## References

- Stories: [_bmad-output/implementation-artifacts/stories/5-*.md](../stories/)
- Lessons: [_bmad-output/_tds/memory/lessons.yaml](../../_tds/memory/lessons.yaml)
- Integrity manifest: [_bmad-output/_tds/state-manifest.yaml](../../_tds/state-manifest.yaml)
- Branch registry: [_bmad-output/_tds/branch-registry.yaml](../../_tds/branch-registry.yaml)
- Epic merge commit: `5484185` (PR #11)
- Finalization recovery commit: `246bf95` (post-merge OH-07 patch)
- Previous retros: [retro-epic-1.md](retro-epic-1.md), [retro-epic-2.md](retro-epic-2.md), [retro-bridge-1-2.md](retro-bridge-1-2.md), [retro-epic-3.md](retro-epic-3.md), [retro-epic-4.md](retro-epic-4.md), [retro-bridge-4-5.md](retro-bridge-4-5.md)

## Applied to bridge: bridge-6-7 @ 2026-05-20T12:18:05.867Z
