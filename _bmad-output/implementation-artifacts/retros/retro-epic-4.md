# Retro — Epic 4 (Methodology corpus build pipeline + 7 lints + exit-criterion verification)

- **Date:** 2026-05-20
- **Scope:** epic-4 (8 stories: 4-1, 4-2, 4-3, 4-4, 4-5, 4-6, 4-7, 4-8)
- **Status:** all stories `done`; epic squash-merged to `main` as commit `5c4545d` (PR #8)
- **Aggregate metrics:** 8/8 delivered; 0 abandoned; 0 blockers; 5 stories carried round-1 `[info]`-only findings (4-1, 4-3, 4-6, 4-7, 4-8); avg review rounds ≈ 0.5 (lowest-friction epic to date — epic-2 ≈ 1+, epic-3 ≈ 0.4); 113 verified integrity entries / 4 failed (3 carry-over from epic-2/epic-3 retros, 1 fresh sweep-churn — see "What broke" §1); 683 tests at epic close (+245 from epic-3 baseline of 438); 0 forbidden-quadrant violations; 7 new lints activated in CI (lint-frontmatter, lint-claims-manifest strict, lint-glossary, lint-reading-level, lint-license-provenance, lint-translation-parity stub, lint-csp-source)

## What went well

- **Subset markdown renderer hit the design contract on first commit.** Story 4-1 shipped `tools/markdown-subset.mjs` at 275 LOC (under the 300 cap) plus a rewritten builder with per-corpus-release re-emit + latest-companion + git-describe resolver. 45 unit tests + 9 contract tests + 33 builder tests green out-of-gate. No mid-impl renderer redesign; the strict-mode contract held across stories 4-2 (byte-stable snapshots), 4-6 (masthead/cite-widget integration), and 4-7 (multi-locale walk) without renderer churn.
- **Byte-stable build assertion landed as a gate, not a wish.** Story 4-2 committed 4 EN snapshot HTML files (`tests/snapshots/methodology/en/...`) + activated the Playwright `byte-stable.spec.mjs` + wired the CI `byte-stable-build` job. The contract is now defensible: any non-deterministic renderer change trips the job; any legitimate renderer change requires `make snapshot-update` + reviewed diff. Validated by Story 4-6's masthead/cite-widget integration — snapshot regen of 4 files was a deliberate, reviewable diff rather than mystery churn.
- **Seven lints activated in one epic without false positives.** All 7 new lints (frontmatter strict-mode, claims-manifest strict, glossary, reading-level EN, license-provenance hash-discipline, translation-parity stub, csp-source) shipped with passing baselines on first run — no "lint exists but emits warnings we accept" intermediate state. Combined with the strict-mode graduation of `lint-claims-manifest` from Epic 2 WARN-mode, the corpus now has 12 active CI lints (5 baseline → 12 close).
- **Forward-design infrastructure for i18n (Story 4-7) is a lesson-worthy counter-pattern.** Multi-locale builder loop, body-only EN-source-hash hook, stale-translation hatnote component (CSS-gated by `data-translation-stale`), and `lint-translation-parity` no-op stub — all with production-shape contracts — shipped at Epic-4 close. RU/PL trees are `.gitkeep`-only until Epic 7; the contract is frozen now, content flips later. Counter-pattern to Epic-2's lesson-2026-05-19-010 (mid-impl identifier transformation). See [L3](#lessons-captured).
- **Lessons applied successfully.** lesson-2026-05-19-009 (deferred-validation CI surfaces) was named explicitly in stories 4-3, 4-5, 4-6, 4-8 and verified via local `make lint`/`make test` against the post-flip state before status flip. lesson-2026-05-19-016 (byte-budget refactor-or-revise signal) appears honored — `BUDGETS.json` `app-modules-bytes` was tuned in this epic and `cite-this-page.js` was deliberately excluded with documented rationale (methodology-corpus-only, not SPA-runtime); no near-misses in epic-4.
- **NFR33 (zero runtime deps) carried into the build pipeline.** Renderer, builder, snapshot helper, and all 7 lints are stdlib-only (Node ≥22 + node:test). No new `package.json` entries; the dependency-free trust signal compounded across one more epic. Methodology corpus output (HTML) is also dependency-free at runtime — `cite-this-page.js` is the only script-tag emit, and it's vanilla ES module clipboard API.
- **License-provenance discipline wired before content lands.** Story 4-5 created `LICENSES.md` + `CHANGELOG.md` slot + `docs/license-scope-map.md` + `lint-license-provenance` (Phase 1 orphan detection + Phase 2 NFR24 hash discipline). 73 files attributed at first lint run; zero orphans. The drift surface (any LICENSES.md edit requires CHANGELOG entry) is now mechanical-gated, not vibes-based.

## What broke / what's friction-hostile

- **`sprint-status.yaml` integrity drifts after every chore(tds) sweep.** `tds integrity verify` reports `sprint-status.yaml` (expected sha from 2026-05-20 08:44, actual sha differs) as failed at this retro's open. Same class as epic-3 retro §What broke item 5 (auditor `add-finding` writeback induces drift); now the sweep itself does it post-merge. The state-manifest re-records the path during the sweep but the sweep commit closes before the verify runs in the *next* session. Audit-noise, not blocking — every relevant sweep eventually clears it. Strongly supports B1.
- **Self-review-to-`/tmp/` anti-pattern surfaced twice (4-6, 4-7).** Both stories committed a Dev Agent Record line `Self-review at /tmp/self-review-4-N.md` without inlining the prose under `## Specialist Self-Review` in the spec. The `/tmp/` files are ephemeral — gone on next reboot or cleanup. Auditor caught both as `[info]/process-discipline` findings (non-critical paths so info, not blocker). The spec now carries a permanent dangling pointer. **See [L1](#lessons-captured).**
- **Dev Agent Record `### File List` left empty twice (4-3, 4-8).** Both specs have populated file lists under `## Specialist Self-Review` but the BMAD-canonical `### File List` section is empty. Two-file-lists drift; the empty stub gives false signal to any automated tooling reading the canonical location. **See [L2](#lessons-captured).**
- **Pre-existing integrity drift recurring across THREE retros.**
  - `tests/scaffold/story-3-1-marker.test.mjs` (epic-3 L1 — resurrected by sweep after manual YAML cleanup) still fails: `<missing>` actual sha.
  - `tests/golden/regenerate.R` (epic-2 hotfix PR #5 — legitimate edit, sha not re-recorded) still fails.
  - `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` (bridge-1-2 cross-repo entry) still fails.
  Each retro defers to the next; the deferral itself is now the decision. **See bridges [B1](#bridge-plan) and [B2](#bridge-plan).**
- **Two parallel "file list" sections in the spec template diverge in practice.** Spec template carries both `## Specialist Self-Review` (with embedded file list) and `## Dev Agent Record` → `### File List`. When the engineer remembers one, they forget the other (twice in epic-4: 4-3 SR-populated DAR-empty; 4-8 same). The template invites the bug. Spec-template tweak is a candidate Epic-5+ housekeeping item (track in future retro before promoting to bridge).
- **Bridge from epic-3 (B1: `tds integrity-remove` CLI) not yet assembled.** Epic-3 retro proposed `tds integrity remove` + sweep auto-clean as the resolution to the state-manifest resurrection class. Bridge has not been pulled into a pre-epic via `tds epic create-bridge-from-retros`. Epic-4 confirms the same noise (this retro's sprint-status sha drift). The pattern of "bridge proposed → deferred → re-proposed next retro" needs a forcing function (or the bridge needs to be pulled). **Re-confirming as [B1](#bridge-plan).**

## Lessons captured

- [lesson-2026-05-20-001](../../_tds/memory/lessons.yaml) — **L1 (process, medium):** Self-review prose must be committed inline in the story spec under `## Specialist Self-Review`, never to `/tmp/self-review-N.md`. Twice in epic-4 (4-6, 4-7) the spec referenced a `/tmp/` path; the file is ephemeral and the audit trail is broken. Cost to fix at story-time is one Edit; cost to fix retro-time is reconstructing from memory.
- [lesson-2026-05-20-002](../../_tds/memory/lessons.yaml) — **L2 (process, low):** Dev Agent Record `### File List` must mirror the Specialist Self-Review file list before status flip. Twice in epic-4 (4-3, 4-8) the section was left empty despite an accurate Self-Review file list in the same spec. Mechanical copy-paste; future direction is to consolidate to one canonical location (spec-template tweak).
- [lesson-2026-05-20-003](../../_tds/memory/lessons.yaml) — **L3 (technical, medium):** Forward-design infrastructure stubs with stable contracts preserve cross-epic stability. Story 4-7 planted multi-locale walk + EN-source-hash hook + hatnote component + lint-translation-parity stub at Epic-4 close; RU/PL content lights up at Epic 7 with zero rename churn. Counter-pattern to lesson-2026-05-19-010 (Epic-2 mid-impl identifier transformation). When an epic will revisit a surface in N epics, plant the structurally-complete stub with the production contract NOW and gate behavior on data presence.

## Bridge Plan

```yaml
proposed_at: 2026-05-20
type: tech-debt
candidates:
  - title: tds integrity-remove CLI + sweep auto-clean for deleted files (re-confirm from epic-3)
    justification: Re-affirming epic-3 retro B1. The same noise class surfaces again in epic-4 (sprint-status.yaml sha drift post-sweep; story-3-1-marker still failing as <missing>). Pattern is now established across three consecutive retros (bridge-1-2, epic-3, epic-4). Single TDS-module bridge — add `tds integrity remove --files=<path> --reason=<text>` subcommand + teach state-sweep to (a) auto-record spec-md whose bytes changed since last record, (b) skip re-recording paths whose on-disk file is absent. Forcing-function signal — pull this into a bridge pre-epic before Epic-5.
    sources:
      - story: 4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: 4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit
        kind: completion-note
        ref: "Two legacy tests (AC-8.1 / scaffold AC-9) unfrozen + assertions updated to Story-4-1 HTML shape ... integrity=88 verified / 3 pre-existing failures"
  - title: Cross-repo integrity entry policy decision (../bmad-tds-module/)
    justification: `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` entry has been in the failed-verify list across three retros (bridge-1-2, epic-3, epic-4). The deferral itself is now the implicit decision. Bundle this with the integrity-remove CLI bridge — same domain (integrity-manifest hygiene). Three options to commit to during bridge design: (a) remove entry via `tds integrity accept --files=...`, (b) formalize cross-project registry policy (entries from sibling projects allowed, scoped under `external/` prefix), (c) explicit "carry until upstream PR" with a checklist item to remove on bmad-tds-module deliver.
    sources:
      - story: 4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit
        kind: auditor-finding
        round: 1
        finding_index: 1
```

## Action items (not bridge-scope)

- **Story-spec template tweak (Epic-5+ housekeeping):** Investigate consolidating `### File List` (under `## Dev Agent Record`) and the parallel file list inside `## Specialist Self-Review` into a single canonical section. Twice-in-epic-4 drift suggests the template invites the bug. Track in retro before promoting to bridge.
- **`bmad-tds-bridge-from-retros` assembly trigger:** With three retros (bridge-1-2, epic-3, epic-4) all referencing the integrity-CLI bridge, the forcing function for `tds epic create-bridge-from-retros --all-unprocessed --blocks=epic-5` has arrived. Recommend running it before opening Epic-5 work.
- **Apply lesson-2026-05-19-009 prophylactically in Epic-5:** 7 newly-activated lint jobs from Epic-4 will first execute on the next external PR. Engineer of Epic-5 Story 5-1 should confirm CI exit-0 in the first CI run before status flip.

## References

- Stories: [_bmad-output/implementation-artifacts/stories/4-*.md](../stories/)
- Lessons: [_bmad-output/_tds/memory/lessons.yaml](../../_tds/memory/lessons.yaml)
- Integrity manifest: [_bmad-output/_tds/state-manifest.yaml](../../_tds/state-manifest.yaml)
- Branch registry: [_bmad-output/_tds/branch-registry.yaml](../../_tds/branch-registry.yaml)
- Epic merge commit: `5c4545d` (PR #8)
- Previous retros: [retro-epic-1.md](retro-epic-1.md), [retro-epic-2.md](retro-epic-2.md), [retro-bridge-1-2.md](retro-bridge-1-2.md), [retro-epic-3.md](retro-epic-3.md)
- Exit-criterion verification: [docs/epic-4-exit-criterion.md](../../../docs/epic-4-exit-criterion.md)

## Applied to bridge: bridge-4-5 @ 2026-05-20T09:05:27.285Z

Bridge Plan candidates B1 (4-1 integrity-CLI re-confirm) + B2 (4-1 cross-repo entry policy) consolidated into `bridge-4-5-1-tds-integrity-remove-cli`. See [`_bridge-plan-20260520T090442Z.md`](_bridge-plan-20260520T090442Z.md) for the auditor-refined plan.
