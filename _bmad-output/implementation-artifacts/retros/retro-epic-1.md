# Retro — Epic 1 (Foundation Scaffolding)

- **Date:** 2026-05-19
- **Scope:** epic-1 (10 stories: 1-1 through 1-10)
- **Status:** all stories `done`; epic squash-merged to `main` via PR #1 (commit 941d466)
- **Aggregate metrics:** 10/10 delivered; 2 cross-story integrity findings (ratified); 26/26 integrity entries verified at close; 1 squash-merge to main; 0 abandoned stories

## What went well

- **NFR33 (zero runtime deps) held end-to-end.** No `package.json` introduced; dev tooling routed through `npx --yes <pkg>@<pin>` (ESLint, Playwright), stdlib-only scripts (`node:fs.globSync`, `node:crypto`, `node:test`), hand-rolled PDF generator (~120 LOC, 1058 bytes). Zero transitive supply-chain surface at epic close. Disciplined across 6+ stories that each had an easy excuse to add a dep.
- **Determinism + integrity gates worked under stress.** Both honestly-disclosed post-impl edits to frozen tests (story-1-6 ci-matrix, story-1-7 playwright-network-trace) were caught by `tds integrity verify` and ratified via engineer re-record. The forensic trail (test-author recorded_at → engineer re-record with `notes=...`) is intact. The audit-first posture worked exactly as designed.
- **Layered scaffolding pattern proved out.** Stories 1-1 through 1-10 each shipped a discrete trust-artifact layer (Makefile → trust docs → ICAR slot → corpus schemas → budgets lint → CI matrix → network-trace → determinism harness → ESLint → design system tokens). Each layer was independently auditable; later stories deferred AC components to future epics (axe-core to Epic 6, byte-stable real impl to Epic 4) with explicit `# Activates in Epic <N>` markers — no silent placeholders.
- **Hand-rolled artifacts (PDF, determinism harness, lint scripts) optimized for skeptic-audit.** The PDF generator is readable in `vim`; the determinism marker uses content-bytes SHA-256 not mtimes; lint scripts are ≤30 LOC each, no shared "lint-base.mjs" premature DRY abstraction. NFR32 (cognitive-load) honored at script-file granularity.
- **Cross-story commit boundaries held.** Story 1-1 deliberately did NOT touch trust artifacts that belonged to 1-2; 1-5's `BUDGETS.json` and 1-6's CI matrix were each owned by exactly one story. Clean diffs per story, traceable per-AC.

## What broke / what's friction-hostile

- **Frozen-test drift via Edit + skip-re-register (2 occurrences).** Story 1-7 specialist edited two frozen tests for honest bug-fixes (AC-2 regex newline span, AC-5 scan-window bleed), and additionally edited story-1-6's `ci-matrix.test.mjs` cross-story to add `network-trace` to `EPIC_1_ACTIVE` (also semantically correct). All three edits omitted `tds integrity record --as=engineer`. The auditor caught them via `tds integrity verify` failing — the system worked — but the absence of a `tds story unfreeze-tests` CLI affordance makes this slip recur. **See L1 + Bridge B1.**
- **Frozen-test regexes over-fit to prose patterns force unnatural specialist workarounds.** Story 1-2 had to deliberately misspell `anti-credentialiation` (no 'z' before that section's body) because `\Z` in JS regex is literal Z, not end-of-string anchor; story 1-2 also had to rewrite Forking-ethics section to front-load a disclaimer, forced by a section-extraction regex. Story 1-4 had to dodge `<lang>` placeholders (HTML-tag regex false-positive). Story 1-9 README needed `no-telemetry` not `zero-telemetry` to match `no[-\s]?telemetry`. **See L2.**
- **`package.json` decision recurs in every JS-adjacent story without an authoritative project policy doc.** Stories 1-1, 1-5, 1-7, 1-9 each independently relitigated "should we add it?" Each time the answer was "no, route through `npx --yes`" — but it was an ad-hoc judgment call, not a documented policy. **See L3.**
- **Story Self-Reviews routinely surface follow-ups that have no home.** Across all 10 stories, "Areas of uncertainty" sections flagged concrete future work (relink ICAR-CONFIRMATION.pdf for dist/ in Epic 4; relax test-8 regex to allow re-spelling 'anti-credentialization'; dynamic-import boundary lint; spacing scale to --space-12; etc). Many never make it to a backlog — captured here in retro aggregate by reading those sections directly. **See L4.**

## Lessons captured

- [lesson-2026-05-19-001](../../_tds/memory/lessons.yaml) — **L1 (tooling, high):** Cross-story / post-impl frozen-test edits silently drift `tds integrity`; re-register via `tds integrity record --as=engineer` is mandatory and easy to skip.
- [lesson-2026-05-19-002](../../_tds/memory/lessons.yaml) — **L2 (process, medium):** Frozen-test regex assertions on prose force unnatural workarounds; prefer structural/semantic checks over keyword/regex grep on prose bodies.
- [lesson-2026-05-19-003](../../_tds/memory/lessons.yaml) — **L3 (tooling, low):** `package.json` deferral works under NFR33 via `npx --yes` + `.mjs` ESM; introduce only when scale demands.
- [lesson-2026-05-19-004](../../_tds/memory/lessons.yaml) — **L4 (process, medium):** Specialist Self-Review "Areas of uncertainty" sections are a high-signal retro input source; aggregate them deliberately alongside `## Auditor Findings`.

## Bridge Plan

```yaml
proposed_at: 2026-05-19
type: tech-debt
candidates:
  - title: Add `tds story unfreeze-tests --story=<id>` CLI affordance
    justification: |
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
    sources:
      - story: 1-6-author-ci-matrix-yaml-with-full-future-lint-stub-jobs
        kind: auditor-finding
        round: 1
        finding_index: 1
      - story: 1-7-implement-playwright-network-trace-infrastructure-with-strict-zero-third-party-assertion-from-day-1
        kind: auditor-finding
        round: 1
        finding_index: 1
```

## Action items (not bridge-scope)

- **Epic 4 design owner:** decide ICAR-CONFIRMATION.pdf link strategy when methodology renderer lands (relative-rewrite vs absolute repo-root link). Source: story-1-3 Self-Review.
- **Epic 6 design owner:** confirm `--space-10/11/12` extension before tail-scene chrome lands. Will not break the design-system hash contract until `make snapshot-update` is rerun. Source: story-1-10 Self-Review.
- **Epic 3 design owner:** dynamic-import boundary lint (`await import(...)` bypasses ESLint `no-restricted-imports`). Decision: defer-with-explicit-note OR custom AST visitor. Source: story-1-9 Self-Review.
- **Cross-cutting:** decide whether `package.json` policy lives in `docs/` as an explicit document; if yes, lesson L3 graduates from memory to docs. Source: L3 + recurrence across 4 stories.

## References

- Stories: [_bmad-output/implementation-artifacts/stories/1-*.md](../stories/)
- Lessons: [_bmad-output/_tds/memory/lessons.yaml](../../_tds/memory/lessons.yaml)
- Integrity manifest: [_bmad-output/_tds/state-manifest.yaml](../../_tds/state-manifest.yaml)
- Branch registry: [_bmad-output/_tds/branch-registry.yaml](../../_tds/branch-registry.yaml)
- Epic merge commit: 941d466 (PR #1, squash → main)

## Applied to bridge: bridge-1-2 @ 2026-05-19T10:48:14.938Z
