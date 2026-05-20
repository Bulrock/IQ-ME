# Story bridge-6-7-3-restore-carry-forward-lessons: Restore Carry-forward-lessons injection in story-create plus pre-commit warning on class-A edits

Status: backlog

## Story

Sibling candidates 3 and 4 from the input share auditor-finding sources 5-2 / 5-4 / 5-5 round-1 finding 1 — the integrity-record ceremony was forgotten BECAUSE the Carry-forward lessons section was missing from 5-2..5-7. Merge into one story with two phased deliverables: Phase A (root) — diagnose where Carry-forward injection regressed (template / bmad-create-story / tds story create) and restore it (make the section mandatory or auto-populate via tds memory query at create-time); Phase B (defense) — ship a git pre-commit hook warning on class-A path edits without a surrounding unfreeze window. Pre-commit picked over modify- frozen-test CLI per Karpathy Simplicity-First — lower effort, catches every code path including direct Edits, and the bundled CLI loses value once Phase A delivers the lesson reliably. Diagnostic and fix stay in one story — the diagnostic is small (grep templates + regression bisect) and inseparable from picking the mitigation. TDS-module + process bridge.

## Sources (deferred from)

- `5-2-anchor-pages-7-fr36-protection-lint-content-freeze-typographic-system-checkpoint` (kind=auditor-finding, round=1, finding_index=1)
- `5-4-scoring-4-remaining-norming-3` (kind=auditor-finding, round=1, finding_index=1)
- `5-5-ethics-2-remaining-provenance-2-remaining-reference-3-remaining` (kind=auditor-finding, round=1, finding_index=1)

## Acceptance Criteria

1. **Phase A — diagnostic write-up.** A short root-cause analysis (≤1 page of prose, in the story Self-Review or a referenced ADR under `_docs/spec/decisions/`) identifies WHERE the `### Carry-forward lessons` section injection regressed between story 5-1 (last working) and stories 5-2..5-7 (omitted). Possible loci: (a) `.claude/skills/bmad-create-story/template.md`, (b) `.claude/skills/bmad-create-story/SKILL.md` workflow logic, (c) `tds story create` CLI (sibling-repo `bmad-tds-module`), (d) a downstream prose-edit step that strips the section, (e) other. The diagnosis names the exact file + line range where the regression lives.
2. **Phase A — injection restored.** After the fix, every NEW story spec created via the normal flow (`bmad-create-story` skill OR `tds story create` CLI, whichever path is currently load-bearing) contains a populated `### Carry-forward lessons` section listing the `tds memory query --story=<id>` hits relevant to the touched surfaces. The section appears in the spec BEFORE the engineer starts implementation (not retroactively after retro). Two implementation paths are acceptable: (a) make the section mandatory in the spec template AND call `tds memory query` at create-time to populate it, OR (b) make it mandatory in template and have a validator block forward state-transitions when the section is missing/empty. Pick whichever requires the smaller change to the load-bearing path.
3. **Phase A — regression test.** A new test under `tests/scaffold/` (or the appropriate test directory matching IQ-ME conventions) covers: (a) creating a fresh story via the load-bearing path produces a spec-md whose `### Carry-forward lessons` section is non-empty when `tds memory query --story=<id>` returns ≥1 hit; (b) the section is present (possibly with an explicit "no relevant lessons" sentinel) when the query returns zero hits — never omitted; (c) `lint-frontmatter` or an equivalent existing-or-new lint flags any spec-md missing the section heading. Test must fail against current main and pass after the fix.
4. **Phase B — git pre-commit hook scaffolded.** A new `pre-commit` hook installed under `.git/hooks/pre-commit` (managed via `tds setup init` or equivalent — same provenance as the existing `commit-msg` hook) inspects staged changes; if any staged path matches a known class-A frozen-test pattern (initial scope: `tests/scaffold/**.test.mjs` + `tests/unit/tools/**.test.mjs` + any path with `artefact_class: A` per `_bmad-output/_tds/state-manifest.yaml`), AND there is no corresponding active unfreeze-window entry in `_bmad-output/_tds/unfreeze-windows.yaml` covering that file, the hook prints a WARNING (not a hard fail by default — Karpathy Simplicity-First, warning gives the engineer a chance to remember the ceremony without blocking emergency commits). Bypass via the existing `TDS_BYPASS=1` env var (parity with the `commit-msg` hook). Hook MUST exit 0 in all cases when bypass is set OR when no class-A staged paths matched.
5. **Phase B — hook installer wired.** The existing `tds setup init` (or equivalent host-adapter install path under `_bmad/tds/`) creates the new `pre-commit` hook on `--profile=full` installs. Re-running setup is idempotent (does not duplicate-append, does not stomp user customizations — file is rewritten verbatim from the canonical template, parity with current `commit-msg` behavior). Update relevant install docs / `MEMORY.md` reference if present.
6. **Phase B — hook regression coverage.** New test under sibling `bmad-tds-module/src/cli/setup/__tests__/precommit-hook.test.ts` (or IQ-ME local scaffold equivalent) covers: (a) class-A staged path WITHOUT active unfreeze-window → hook prints warning to stderr, exit 0; (b) class-A staged path WITH active unfreeze-window → hook silent, exit 0; (c) `TDS_BYPASS=1` → hook silent regardless of state, exit 0; (d) non-class-A staged path → hook silent, exit 0; (e) re-running `tds setup init` does not duplicate the hook installation.
7. **Cross-phase verification on a new epic-6 story.** After both phases land + bundle bump, create one throwaway story via the standard path and verify: (a) spec contains populated `### Carry-forward lessons` section (Phase A); (b) staging a class-A frozen-test path without unfreeze prints the warning (Phase B). Document the verification trace in Completion Notes.

## Tasks / Subtasks

- [ ] **Task 1 — Phase A diagnostic.** Grep `.claude/skills/bmad-create-story/` for `Carry-forward` references; compare against story 5-1 vs 5-2 spec output to identify where the injection lives (or used to live). Write the ≤1-page diagnostic into Self-Review or a new ADR. Make AC-1 satisfied.
- [ ] **Task 2 — Phase A failing test.** Write the test for AC-3 (section presence + populated when memory has hits + sentinel when empty + lint flags omission). Verify it fails against current main.
- [ ] **Task 3 — Phase A injection restore.** Patch the load-bearing path identified in Task 1: either the `bmad-create-story` template + skill, or the `tds story create` CLI, or both — whichever the diagnostic shows is the actual regression site. Make Task 2's test pass. Karpathy Simplicity-First: prefer the smallest change to the smallest number of files.
- [ ] **Task 4 — Phase A lint hook.** Add `lint-spec-carry-forward.mjs` (or extend existing `lint-frontmatter`) to flag any spec-md missing the `### Carry-forward lessons` heading. Wire into `make lint`. Make AC-3's lint sub-test pass.
- [ ] **Task 5 — Phase B failing test.** Write tests for AC-6 (4 hook-behavior scenarios + idempotent re-install). Verify they fail against current main (since no `pre-commit` hook exists yet).
- [ ] **Task 6 — Phase B hook script.** Author `pre-commit` bash hook script template (parity with `commit-msg` style — heredoc-quoted, `TDS_BYPASS=1` short-circuit, scan staged files via `git diff --cached --name-only`, cross-reference against `state-manifest.yaml` artefact_class=A entries + `unfreeze-windows.yaml` active windows). Wire into `tds setup init --profile=full` installer logic. Make Task 5's hook-behavior tests pass.
- [ ] **Task 7 — Phase B installer integration.** Verify `tds setup init` rewrites the new hook idempotently (parity with current `commit-msg` behavior). Make Task 5's idempotent-reinstall test pass.
- [ ] **Task 8 — bundle bump (if Phase B touches sibling repo).** If Phase B's installer logic lives in `bmad-tds-module`, follow the bridge-4-5-1 / bridge-5-6-1 bundle-bump pattern: copy refreshed `tds-runtime.bundle.js` + `.sha256` from sibling `payload/shared/` into `_bmad/tds/shared/`; commit with "temporary; superseded by next bmad-tds-module release" + Story-Id trailer. If Phase B lives entirely in IQ-ME hooks/scripts, skip this task.
- [ ] **Task 9 — Cross-phase verification.** Per AC-7, on a throwaway story confirm both phases work end-to-end. Capture the trace in Completion Notes.
- [ ] **Task 10 — `make test` + `make lint` + sibling `pnpm test`.** Confirm no regression across all three suites.

## Dev Agent Record

### Completion Notes List

_(populated during implementation)_

### File List

_(populated during implementation)_

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-6-7` (blocks `epic-7`).
