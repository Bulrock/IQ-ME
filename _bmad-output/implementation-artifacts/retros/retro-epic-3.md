# Retro — Epic 3 (Assessment runtime: state, scenes, ADRs, lints)

- **Date:** 2026-05-20
- **Scope:** epic-3 (8 stories: 3-1, 3-2, 3-3, 3-4, 3-5, 3-6, 3-7, 3-8)
- **Status:** all stories `done`; epic squash-merged to `main` (commits 46bb04e, e76837c, a0ae900 — PRs #6 + #7); story-3-8 intentionally scaffold-only (human hallway-test evidence collection deferred to maintainer post-merge)
- **Aggregate metrics:** 8/8 delivered; 0 abandoned; 2 stories required round-1 rework (3-2 integrity-cleanup, 3-6 test-isolation); 1 round-2 info-only finding (3-5); avg review rounds ≈ 0.4 (vs epic-2 ≈ 1+); 84 verified integrity entries in repo / 3 failed (2 carried from epic-2 — `regenerate.R`, cross-repo `bmad-tds-module` — plus 1 resurrected entry from this epic, see L1); 438/438 tests green at epic close (+141 from epic-2 baseline of 297); 0 forbidden-quadrant violations

## What went well

- **Contract-first epic discipline survived eight stories.** Story-3-1 froze the load-bearing contracts (state-shape JSON Schema, `iqme:reveal-stage` event surface, methodology-handoff URL pattern, release-tag namespace) as ADRs BEFORE any vertical-slice code. Stories 3-2 through 3-7 implemented against the frozen contracts without renaming or restructuring them; the Epic-2 retrofit failure mode (D3 vs epic-narrative naming relitigation per story — see [retro-epic-2.md](retro-epic-2.md) §What broke) did not recur in epic-3.
- **Clean-context auditor caught two real blockers pre-merge.** Story-3-2 round-1: stale integrity entry for the deleted story-3-1 marker would have refused `tds deliver`. Story-3-6 round-1: shared-`dist/` parallel-test race reproduced at ~75% of `make test` runs and would have inherited into CI on unrelated PRs. Both surfaced cleanly via `tds story add-finding` writeback to the spec-md; both resolved in single-cycle rework branches (`story/3-2-rework-integrity-cleanup`, `story/3-6-rework-test-isolation`) without epic rollback.
- **Per-test temp-dir pattern landed correctly in 3-6.** `mkdtempSync(join(tmpdir(), "iqme-build-meth-"))` + env-var output override (`IQME_BUILD_METHODOLOGY_OUT`) eliminated the shared-`dist/` race; complementary read-side test (`dev-server.test.mjs`) was already `t.skip()`-guarded — the correct counterpart. Validated 5/5 parallel races + full `make test` 438/0/1. See [L2](#lessons-captured).
- **NFR32 byte-budget held under stress (with two near-misses, see L4).** `app-modules-bytes` 30720 cap brushed in 3-5 (30715/30720, 5 bytes headroom); 3-7 reclaimed 97 bytes via main.js comment-collapse + test-hook.js exclude. The budget never broke, but the pattern of two consecutive near-misses is a refactor-or-revise signal — see [L4](#lessons-captured) and bridge B4.
- **NFR33 (zero runtime deps) carried into the SPA shell.** No `package.json` introduced for the SPA layer; hash-based router, EN-only landing/consent/result scenes, 128-bit-seed-deterministic Mulberry32 PRNG all hand-rolled. Same posture as epic-2's scoring engine — the dependency-free trust signal compounded across one more epic.
- **Story-3-8 SCAFFOLD-ONLY posture documented honestly.** The hallway test is human-evidence work — `_evidence/` templates, recruitment protocol, local-build instructions, and the `corpus-v0.1.0` git-tag instruction shipped as the scaffold; the actual participant notes are appended by the maintainer post-merge. The Dev Agent Record explicitly disclosed the scaffold-only posture and named the `epic-3-retrospective` as the place where a "comprehension fails" verdict would open Bridge Plan items. Auditor accepted the story without forcing a fake "completion" status.

## What broke / what's friction-hostile

- **Direct YAML edits to `state-manifest.yaml` can be silently undone by a later sweep.** Story-3-2 round-1 resolution removed the stale `tests/scaffold/story-3-1-marker.test.mjs` integrity entry via direct YAML edit (no `tds integrity remove` CLI exists). At epic close, that entry is back in `state-manifest.yaml` (recorded_at `2026-05-19T17:16:25Z` — after the round-1 fix), and `tds integrity verify` reports it as `failed` because the on-disk file is gone. Hypothesis: a subsequent `tds state-commit` sweep re-recorded the path as part of its "dirty TDS-managed paths" collection. The auditor resolution note declared the cleanup complete; reality is the cleanup was undone. **See [L1](#lessons-captured) and bridge B1.**
- **Stories that delete a previous story's class-A artefact need an explicit cleanup task.** Story-3-2 deleted the 3-1 marker as part of Task 5.1 but the AC list named only the file deletion, not the integrity-registry cleanup. Auditor caught it as a blocker; without the auditor, the epic would have refused at `tds deliver`'s pre-merge integrity-verify gate. **See [L3](#lessons-captured) and bridge B1.**
- **Byte-budget brushed twice in one epic.** Story-3-5 closed at 5 bytes headroom; 3-7 had to comment-strip main.js and exclude test-hook.js to fit. Story-3-5 self-review §uncertainty #1 named the candidate refactor: extract `_html-escape.js` shared util across 5+ modules. Pattern: the budget that requires clever workarounds to fit is no longer a clean cognitive-load signal. **See [L4](#lessons-captured) and bridge B4.**
- **Cross-epic version-literal mismatch in `src/index.html` `<noscript>`.** The fallback container references `/methodology/v1.0.0/en/` while the SPA runtime resolves corpus version as `v0.1.0` (per story-3-1 ADR `release-tag-namespace-contract`). Not a regression from this epic (literal pre-dates the work); no runtime code path exercises it (noscript renders only when JS is disabled). Cross-epic-debt flagged in story-3-5/round-1 [info] finding, scoped out of round-1 deliverable. **See bridge B3.**
- **Auditor `add-finding` spec-md writeback induces transient integrity drift.** Story-3-2 round-2 [info]: after `tds story add-finding` mutates a spec-md, the next `tds state-commit` sweep doesn't always re-record the new sha256 → `tds integrity verify` reports stale spec-md until a follow-up sweep or manual `integrity record`. Not blocking (every relevant change-set sweep eventually clears it) but produces audit-noise that downstream operators must triage. **See bridge B1.**
- **Cross-repo + epic-2 integrity drift carried over.** `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` (epic-2 carryover) and `tests/golden/regenerate.R` (epic-2 hotfix PR #5 edit) still listed in `failed entries`. Identical to epic-2 retro §What broke item 4 — decision was "handle inline whenever a future preflight gate trips on it"; epic-3 did not trip, so still deferred.

## Lessons captured

- [lesson-2026-05-19-013](../../_tds/memory/lessons.yaml) — **L1 (process, high):** Direct YAML edits to `state-manifest.yaml` can be silently re-recorded by the next `tds state-commit` sweep; resolution notes claiming "entry removed" must be verified post-sweep. If the entry resurrects, escalate to a `tds integrity remove` bridge story rather than fighting the sweep heuristic.
- [lesson-2026-05-19-014](../../_tds/memory/lessons.yaml) — **L2 (technical, medium):** Tests sharing a filesystem fixture path (`dist/`) race under default `node:test` parallelism at ~75% reproduction rate; per-test `mkdtempSync` + env-var output override eliminates the flake. Read-side tests `t.skip()` when fixture absent; never write to a shared fixture directory.
- [lesson-2026-05-19-015](../../_tds/memory/lessons.yaml) — **L3 (process, medium):** Stories that delete a previous story's class-A artefact must include a paired "remove integrity entry for `<path>`" AC task; implicit deletion ships green on its own tests but `tds deliver` refuses the epic squash on the phantom registry entry.
- [lesson-2026-05-19-016](../../_tds/memory/lessons.yaml) — **L4 (technical, low):** Two consecutive byte/perf-budget near-misses within one epic (Δ < 1% of cap) are a refactor-or-revise signal, not a "next story squeezes it tighter" signal. Track headroom (bytes-free / budget) as a retro SLI alongside test count + lint count.

## Bridge Plan

```yaml
proposed_at: 2026-05-20
type: tech-debt
candidates:
  - title: tds integrity-remove CLI + sweep auto-clean for deleted files
    justification: Consolidates 3-2/round-1 (stale entry for deleted story-3-1 marker resurrects after manual YAML edit) and 3-2/round-2 (spec-md sha256 drifts after `tds story add-finding` until next sweep). Both surface as `tds integrity verify failed=N` noise that masks real drift. Single TDS-module bridge: add `tds integrity remove --files=<path> --reason=<text>` subcommand + teach state-sweep to (a) auto-record spec-md whose bytes changed since last record, (b) skip re-recording paths whose on-disk file is absent.
    sources:
      - story: 3-2-implement-state-js-contract-test
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: 3-2-implement-state-js-contract-test
        kind: auditor-finding
        round: 2
        finding_index: 1
  - title: Convention doc for filesystem-fixture test isolation
    justification: Story-3-6 round-1 resolved the immediate `dist/` race with `mkdtempSync` + env-var override; the suggested bridge (one-paragraph convention note in `docs/test-isolation.md`) covers the general pattern for all future dist-touching or sibling-test-artefact-mutating tests so the pattern survives turnover and copy-paste.
    sources:
      - story: 3-6-author-3-en-methodology-stub-pages-the-click-targets
        kind: auditor-finding
        round: 1
        finding_index: 1
  - title: Reconcile noscript methodology version literal with corpus version
    justification: `src/index.html` `<noscript>` hardcodes `/methodology/v1.0.0/en/` while SPA runtime resolves `v0.1.0` per story-3-1 ADR `release-tag-namespace-contract`. Not regression; no runtime code path exercises noscript with JS enabled; but cross-epic-debt flagged by 3-5 round-1 [info]. Likely Epic-4 build-methodology-generator territory (resolve the literal at build time from the same source as the SPA bundle).
    sources:
      - story: 3-5-implement-reveal-stage-event-score-panel-css-source-co-equal-triplet-lint
        kind: auditor-finding
        round: 1
        finding_index: 1
  - title: Re-evaluate app-modules-bytes budget OR extract _html-escape.js shared util
    justification: Epic-3 brushed the 30720 budget twice (3-5 closed at 5 bytes headroom; 3-7 reclaimed 97 bytes via comment-strip + test-hook exclude). 3-5 self-review §uncertainty #1 named `_html-escape.js` as the candidate factor — duplicated across 5+ modules. Per L4, two consecutive Δ < 1% near-misses is the refactor-or-revise threshold; commit the decision before Epic 4 adds the build-methodology pipeline modules.
    sources:
      - story: 3-5-implement-reveal-stage-event-score-panel-css-source-co-equal-triplet-lint
        kind: auditor-finding
        round: 2
        finding_index: 1
```

## Action items (not bridge-scope)

- **Epic 4 design owner:** When `tools/build-methodology.mjs` extends to emit the per-corpus-release HTML (Epic 4), use it as the resolution point for the `src/index.html` `<noscript>` `v1.0.0` literal (bridge B3) — single source of truth between SPA + noscript.
- **Cross-repo integrity scrub (still deferred from epic-2):** Remove `../bmad-tds-module/*` entries from `_bmad-output/_tds/state-manifest.yaml` if any future preflight gate trips on them. Same posture as epic-2 retro.
- **Maintainer (CEP) post-merge:** Run the story-3-8 hallway test with 3-5 outside-team English-speakers; if "comprehension fails" verdict emerges, append a follow-up Bridge Plan item to this retro naming specific 3-8b candidates (per story-3-8 §Story scope point 7). Tag `corpus-v0.1.0` at the squash-merge SHA per the story-3-8 + ADR-`release-tag-namespace-contract` instruction.

## References

- Stories: [_bmad-output/implementation-artifacts/stories/3-*.md](../stories/)
- Lessons: [_bmad-output/_tds/memory/lessons.yaml](../../_tds/memory/lessons.yaml)
- Integrity manifest: [_bmad-output/_tds/state-manifest.yaml](../../_tds/state-manifest.yaml)
- Branch registry: [_bmad-output/_tds/branch-registry.yaml](../../_tds/branch-registry.yaml)
- ADRs frozen this epic: [docs/adr/state-shape-contract.md](../../../docs/adr/state-shape-contract.md), [docs/adr/reveal-stage-event-contract.md](../../../docs/adr/reveal-stage-event-contract.md), [docs/adr/methodology-handoff-url-contract.md](../../../docs/adr/methodology-handoff-url-contract.md), [docs/adr/release-tag-namespace-contract.md](../../../docs/adr/release-tag-namespace-contract.md)
- Epic merge commits: 46bb04e, e76837c, a0ae900 (PRs #6 + #7)
- Previous retros: [retro-epic-1.md](retro-epic-1.md), [retro-epic-2.md](retro-epic-2.md), [retro-bridge-1-2.md](retro-bridge-1-2.md)

## Applied to bridge: bridge-4-5 @ 2026-05-20T09:05:27.285Z

Bridge Plan candidates B1 (3-2) consolidated into `bridge-4-5-1-tds-integrity-remove-cli`. B2 (3-6) → `bridge-4-5-2-convention-doc-for-filesystem`. B3 (3-5 noscript) + B4 (3-5 byte-budget) deferred per auditor refinement — see [`_bridge-plan-20260520T090442Z.md`](_bridge-plan-20260520T090442Z.md) for rationale.
