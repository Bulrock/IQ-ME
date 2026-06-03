# Retro — Epic 6 (Result-page ceremony, difficulty breakdown, bail-out, chrome shell, tail-scenes, tear-edge, opt-in save)

- **Scope:** epic-6 — stories 6-1 … 6-7 (7 stories, all `done`, all squash-merged into `epic/6`, delivered via #13).
- **Retro date:** 2026-06-03
- **Facilitator:** bmad-tds-retro (auditor analysis + writer cross-check)
- **Lessons captured:** 3 (`lesson-2026-06-03-001`, `-002`, `-003`)
- **Bridge candidates:** 2 (both accepted → see `## Bridge Plan`)

---

## What went well

- **Zero stories abandoned; one clean (6-2).** Per-item difficulty breakdown shipped with no auditor findings at all — the AC set was tight and the surface was self-contained.
- **The auditor caught every self-inflicted blocker before delivery.** Both hard blockers (6-3 CI-wiring gap, 6-6 red `ci-matrix.test.mjs`) were found in Mode-2 review and fixed by rework on `epic/6` — nothing red reached `main`.
- **Carry-forward-lessons delivery held this epic.** Every epic-6 spec carried a populated `### Carry-forward lessons` section (the epic-5 regression that `lesson-2026-05-19-022` named). Class-A integrity re-records were performed correctly on every frozen-test edit (6-1 contract spec, 6-3 bail unit spec, 6-6 scaffold spec).
- **Deferred work was tracked, not dropped.** `reveal-stage-timings.json` was flagged unused in 6-1 round-3, deferred to 6-5, and is now genuinely consumed (`src/assessment/reveal-stage.js` imports it). The deferral chain closed.
- **One rework commit consolidated two findings.** The 6-3 rework wired BOTH the bail-out spec (its own blocker) and the asymmetric-tail spec (6-5's warn) into CI in a single commit — efficient cross-story cleanup.

## What broke

- **The false "greedy-glob" CI premise — twice.** Stories 6-3 and 6-5 both deferred Playwright CI-wiring on the same factually-wrong assumption that `pr-checks.yml` greedy-globs `tests/playwright/*.spec.mjs`. It lists specs individually, one job each. 6-3's bail-out spec is the *sole* guard of the NFR9/FR4 zero-localStorage privacy invariant, and epic-6 newly added two legitimate localStorage writers (`theme.js`, `save-result.js`) — so a privacy regression could have shipped green. → **`lesson-2026-06-03-001`**.
- **Regression provenance misattributed in both directions.** 6-3/6-4 self-reviews called the dead `bindTriplet` methodology-handoff a 6.1/6.2 regression (it was pre-existing on `main`, byte-identical); 6-4/6-5/6-7 called the red `ci-matrix.test.mjs` AC-3 pre-existing (it was a self-inflicted epic-6 regression from activating CI jobs without updating the frozen job-set). Neither claim was backed by a baseline diff. → **`lesson-2026-06-03-002`**.
- **Activating a CI job drifted the frozen job-matrix contract.** 6-4 (`lighthouse`) and 6-6 (`cropping-fuzzer`) removed `if:false` stubs in `pr-checks.yml` but the class-A frozen `ci-matrix.test.mjs` was only partially updated (the new jobs were never moved out of the "deferred" set), so AC-3 went red and blocked `tds deliver`. This is the same `ci-matrix.test.mjs` class-A coordination friction epic-1 hit twice; it is already named by `lesson-2026-05-19-001` (integrity re-register) — here the gap was the *content* of the frozen job-classification sets, not the integrity record.
- **An unreviewable binary test file landed.** `tests/unit/save-result.test.mjs` embeds literal `0x00`/`0x1F` bytes in a regex; git classifies the 9.5KB file as binary, so its logic is invisible to diffs/grep/PR tooling. Runs 5/5 green but cannot be code-reviewed. **Still UNRESOLVED** (`file` reports `data`). → **`lesson-2026-06-03-003`** + **Bridge B1**.
- **Cumulative byte-budget inflation, again.** `app-modules-bytes` grew 30720 → 49152 (~60%) across five consecutive per-story raises (6.2, 6.4, 6.5, 6.7), each individually justified but never audited as a whole. This is exactly the "refactor-or-revise" trigger that the existing epic-3 budget lesson (`app-modules-bytes` SLI) prescribes — routed to **Bridge B2** rather than a duplicate lesson.

## Surprising patterns

- **Two opposite misattributions in one epic.** The same root cause — nobody ran a baseline diff before claiming provenance — produced one false "introduced" and one false "pre-existing." Both wasted reviewer attention; one would have hidden a real regression.
- **The budget lesson worked as designed.** `lesson` capture from epic-3 explicitly said "two consecutive near-misses → retro emits a Bridge Plan item, not a next-story squeeze." Epic-6 ran five squeezes; the lesson's prescribed exit (Bridge B2) is now firing. The *capture* held; the *in-loop discipline* (stop squeezing) did not — the budget guard has decayed toward a rubber stamp exactly as 6-7 round-1 warned.

## Lessons captured (linked)

| id | sev | category | one-line |
|---|---|---|---|
| [`lesson-2026-06-03-001`] | high | tooling | `pr-checks.yml` wires Playwright specs per-spec, NOT via greedy glob — a new spec is uncovered until explicitly added (verify: `grep <spec> pr-checks.yml`). |
| [`lesson-2026-06-03-002`] | high | process | Verify regression provenance with a baseline diff (`git stash` / `git diff main`) before claiming pre-existing vs introduced. |
| [`lesson-2026-06-03-003`] | medium | technical | Control-char regex assertions must use `\x00`-`\x1f` escapes, never literal bytes — a raw NUL makes the file binary/unreviewable (verify: `file` never reports `data`). |

Pre-existing lessons re-confirmed (not re-captured): `lesson-2026-05-19-001` (class-A frozen-test re-register — `ci-matrix.test.mjs` again), epic-3 `app-modules-bytes` budget-SLI lesson (its prescribed Bridge-Plan exit fired → B2).

## Metrics

- Stories: 7 done / 0 abandoned.
- Findings: 6-1 ×3, 6-2 ×0, 6-3 ×1, 6-4 ×1, 6-5 ×2, 6-6 ×1, 6-7 ×3 → 11 finding-rounds; 2 blockers (both resolved), 2 warns (1 resolved, 1 → bridge), 1 unresolved warn (binary file → bridge).
- `app-modules-bytes`: 30720 (epic start) → 49152 (6-7), ~60% growth across 4 raises.
- `make test` at delivery: green (974/974 after 6-6 rework).

---

## Bridge Plan

```yaml
proposed_at: 2026-06-03
type: tech-debt
candidates:
  - title: "De-binary save-result.test.mjs: replace literal control bytes with \\x escapes"
    justification: >-
      tests/unit/save-result.test.mjs embeds literal 0x00 and 0x1F bytes in the
      hashSeed no-control-chars regex, so git classifies the 9.5KB file as binary
      and its test logic is invisible to diffs, grep, and PR-review tooling. The
      test runs 5/5 green and integrity is intact, so this is not a functional
      defect — it is a reviewability defect that persists in every future PR until
      fixed. Small, concrete, no behaviour change: swap the two literal bytes for
      the textual \x00 / \x1f escape forms, re-record class-A integrity for the
      file. Still UNRESOLVED at epic-6 close (file(1) reports "data"). Pairs with
      lesson-2026-06-03-003 which prevents recurrence; this bridge fixes the
      existing instance.
    sources:
      - story: 6-7-opt-in-localstorage-save-retest-effect-copy-on-result-page
        kind: auditor-finding
        round: 3
        finding_index: 1
  - title: "Post-epic app-modules-bytes trim pass + re-establish principled ceiling"
    justification: >-
      app-modules-bytes grew 30720 -> 49152 (~60%) across five consecutive
      per-story raises in epic-6 (6.2, 6.4, 6.5, 6.7), each individually justified
      but never audited as a whole; the budget has decayed toward a rubber stamp
      (6-7 round-1). This is the exact "refactor-or-revise" trigger the existing
      epic-3 byte-budget SLI lesson prescribes as a Bridge-Plan item. Scope: audit
      src/assessment/** for trim/shared-util opportunities (e.g. duplicated escape
      / DOM helpers), recover headroom, and re-pin a principled ceiling BEFORE
      Epic-7 adds i18n locale-loading weight on top. Lands before epic-7;
      app-side bridge (not TDS-module).
    sources:
      - story: 6-7-opt-in-localstorage-save-retest-effect-copy-on-result-page
        kind: auditor-finding
        round: 1
        finding_index: 1
```

> These two candidates are recorded as **intent only**. They assemble into a real pre-epic when you run `/bmad-tds-bridge-from-retros` (likely batched with any later retro tech-debt). `bridge-6-7` already exists in the registry (sourced from retro-epic-5), so the applier will auto-derive the next free bridge id.
