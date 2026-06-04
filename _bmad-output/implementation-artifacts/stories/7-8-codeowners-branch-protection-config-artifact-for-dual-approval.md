---
id: 7-8-codeowners-branch-protection-config-artifact-for-dual-approval
title: "Story 7.8: CODEOWNERS + branch-protection-config artifact for dual-approval"
status: ready-for-dev
---

# Story 7.8: CODEOWNERS + branch-protection-config artifact for dual-approval

## Story

As a **maintainer protecting against translation drift after launch (Innovation Risk I7)**,
I want **`.github/CODEOWNERS` to encode per-language reviewer-of-record + maintainer co-ownership and `docs/branch-protection-config.md` to document the GitHub branch-protection settings that enforce maintainer + per-language-reviewer dual-approval on non-EN content-key changes (FR49)**,
so that **the dual-approval discipline is mechanical (not cultural) — even a maintainer cannot override a missing per-language-reviewer sign-off on a non-EN content change**.

## Acceptance Criteria

> **Epic-7 dev-phase decision (infra-now) — gated handle note.** The real RU/PL reviewer GitHub handles are gated on Gates 9c/9d (backlog) and the CODEOWNERS contract forbids replacing `@TBD-{ru,pl}-reviewer` until the gate is documented closed in CHANGELOG.md. So this story does NOT name real reviewers (AC-1's "actual handle" replacement is the gate-close deliverable). It DOES land the ungated, mechanically-buildable parts: maintainer co-ownership on every non-EN path (dual-approval structure), and the full `docs/branch-protection-config.md` settings doc + regression-recovery playbook. The actual GitHub branch-protection rule export/screenshot is gated on real repo configuration (launch / Epic 10) and is marked pending in the doc.

1. **AC-1 (CODEOWNERS dual-ownership, all non-EN paths):** `.github/CODEOWNERS` lists BOTH the per-language reviewer-of-record (`@TBD-{ru,pl}-reviewer`, un-resolvable until the gate) AND the maintainer (`@Bulrock`) as co-owners for every non-EN content-key path: `src/content/methodology/{ru,pl}/**`, `src/content/i18n/{ru,pl}/**`, `src/content/crisis-resources/{ru,pl}.json` (and the existing `glossary/{ru,pl}.json`, `trails/{ru,pl}.json`). The `@TBD-*` handles are NOT replaced (gated). The header comment is updated to point to `docs/branch-protection-config.md` and note the maintainer co-owner enables dual-approval.
2. **AC-2 (branch-protection-config.md settings doc):** `docs/branch-protection-config.md` documents the exact intended GitHub branch-protection settings for `main`: require a pull request before merging; require review from Code Owners; require the required status checks to pass (enumerate the Epic-1/3/4/7 lint + test jobs by name); dismiss stale approvals; require conversation resolution; disable force pushes; disable deletions; and "do not allow bypassing the above settings" (so even an admin/maintainer cannot self-merge a non-EN content-key change without the per-language reviewer). The actual rule YAML/JSON export or screenshot is marked **PENDING** (captured at launch/Epic-10 when the live rules are configured) — not fabricated.
3. **AC-3 (synthetic-PR regression-recovery playbook):** `docs/branch-protection-config.md` includes a documented regression-recovery playbook describing the synthetic-PR test scenario: a single-line change to `src/content/methodology/pl/scoring/overview/index.md` opens a PR that GitHub shows as blocked-from-merge until BOTH the maintainer and the PL reviewer-of-record approve; and the recovery steps if a non-EN change is ever merged without dual-approval. (The live synthetic PR is run at launch when real reviewers + branch protection exist; the playbook is the dev-phase artifact.)
4. **AC-4 (no faked handles / no live config):** No real reviewer GitHub handle is invented (gated). No GitHub API call is made to configure branch protection in the dev phase. `make lint` (incl. `lint-trust-artifacts`) stays green — the `@TBD-*` handles remain un-resolvable as the still-open-gate signal.
5. **AC-5 (tests + no regression):** Tests cover: CODEOWNERS maps all 6 core non-EN paths (`methodology/{ru,pl}`, `i18n/{ru,pl}`, `crisis-resources/{ru,pl}.json`) to BOTH `@TBD-{lang}-reviewer` AND `@Bulrock`; the existing trust-artifacts CODEOWNERS assertions still pass (the `@TBD-{lang}-reviewer` token remains present per path); `docs/branch-protection-config.md` exists and contains the required settings (require-CODEOWNERS-review, required status checks, disable force-push, no-bypass) + the synthetic-PR playbook + a PENDING marker for the live export. `make test` green; `make lint` green; `make build` deterministic.

## Tasks / Subtasks

- [ ] **Task 1: CODEOWNERS maintainer co-ownership** (AC: 1, 4)
  - [ ] Add `@Bulrock` co-owner to every non-EN path line (keep `@TBD-{ru,pl}-reviewer`); update header comment to reference branch-protection-config.md.
- [ ] **Task 2: branch-protection-config.md settings doc** (AC: 2)
  - [ ] Document the exact main-branch protection settings; mark the live YAML/JSON export PENDING (launch/Epic-10).
- [ ] **Task 3: synthetic-PR regression-recovery playbook** (AC: 3)
  - [ ] Document the pl/scoring/overview single-line synthetic-PR scenario + recovery steps.
- [ ] **Task 4: tests** (AC: 5)
  - [ ] CODEOWNERS dual-ownership per non-EN path; branch-protection-config.md required sections + playbook + PENDING marker.
- [ ] **Task 5: regression gate** (AC: 5)
  - [ ] `make test`/`make lint` (incl. lint-trust-artifacts) /`make build` green.

## Dev Notes

- **CODEOWNERS today** already maps each non-EN path to `@TBD-{ru,pl}-reviewer` only. Adding `@Bulrock` as a trailing co-owner (`<path> @TBD-{lang}-reviewer @Bulrock`) is compatible with the frozen `tests/scaffold/trust-artifacts.test.mjs` AC-5 (its regex `\s+@TBD-{lang}-reviewer` is not end-anchored). Do NOT replace the `@TBD-*` handles — the CODEOWNERS header + lint-trust-artifacts rely on them being un-resolvable until the gate closes.
- **Dual-approval semantics:** listing both the reviewer and maintainer as code-owners + branch-protection "require review from Code Owners" with "required approving reviews ≥ 1" + "do not allow bypass" is the mechanical enforcement; document precisely in branch-protection-config.md (GitHub requires at least one code-owner approval; with the per-language reviewer as the sole content-domain owner + maintainer co-owner, a non-EN change needs the reviewer's approval and cannot be self-merged by the maintainer when bypass is disabled).
- **No live GitHub config in dev phase (AC-4):** the actual branch-protection rules are applied at launch (Epic 10) against the real repo with real reviewers; the doc captures the intended config + marks the export PENDING. Do not call the GitHub API.
- **Files:** `.github/CODEOWNERS` (add maintainer co-owner + header), `docs/branch-protection-config.md` (NEW), tests. Do NOT touch content, other docs.

### Carry-forward lessons

- lesson-2026-06-03-001 (high): pr-checks wires jobs explicitly. Apply: when enumerating "required status checks" in the doc, list the actual job names from `.github/workflows/pr-checks.yml` (don't assume a glob).
- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: CODEOWNERS/doc are net-new edits; baseline-diff before labeling any failure pre-existing.
- lesson-2026-05-20-010 (medium): match observable AC intent. Apply: AC-1 "actual handle" is gated; maintainer co-ownership + the settings doc satisfy the ungated intent; the handle replacement is the gate-close deliverable (documented).

### Project Structure Notes

- CODEOWNERS at `.github/CODEOWNERS`; branch-protection doc under `docs/`. No variance.

### References

- [Source: epics.md#Story-7.8] — AC source (CODEOWNERS dual-approval, branch-protection-config.md, synthetic-PR playbook).
- [Source: .github/CODEOWNERS] — current per-language @TBD ownership + un-resolvable-handle contract.
- [Source: tests/scaffold/trust-artifacts.test.mjs#AC-5] — existing CODEOWNERS assertions to keep green.
- [Source: .github/workflows/pr-checks.yml] — required-status-check job names for the doc.
- [Source: project memory project_iqme_epic7_infra_now_decision] — infra-now; real handles gated on Gates 9c/9d.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
