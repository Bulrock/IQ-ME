---
id: 8-6-full-contributing-md-branch-protection-config-required-ci-checks-scheduled-yml-failure-routing-docs
title: "Story 8.6: Full CONTRIBUTING.md + branch-protection + required-ci-checks + scheduled-yml-failure-routing docs"
status: ready-for-dev
---

# Story 8.6: Full CONTRIBUTING.md + required-ci-checks docs + cross-links

## Story

As a **future contributor (Marek journey) opening their first PR**,
I want **the full `CONTRIBUTING.md` to document the PR workflow, the per-language reviewer-of-record discipline, the linter expectations, and the failure-routing for scheduled checks — replacing Epic 1's slim stub (FR47)**,
so that **a translator like Marek can find the workflow, see who the reviewer-of-record is, and understand what their PR is checked against without asking the maintainer**.

## Acceptance Criteria

> **Note — docs story.** This story is markdown authoring + a structural test. The cross-link targets (`docs/branch-protection-config.md` from Story 7.8, `docs/scheduled-yml-failure-routing.md` from Story 8.3) already exist on epic/8; `docs/required-ci-checks.md` is created fresh here. The real CI job names enumerated MUST be the actual current set (incl. the Story 8.5 additions) per lesson-2026-06-03-001 — no glob assumptions.

1. **AC-1 (full CONTRIBUTING.md replaces the slim stub):** `CONTRIBUTING.md` is rewritten from the Epic-1 slim stub to the full guide documenting: how to fork, branch, and open a PR; the CI checks a PR will run (linking `docs/required-ci-checks.md`); the dual-approval requirement for non-EN content-key changes (FR49, linking `docs/branch-protection-config.md`); the per-language reviewer-of-record discipline (linking `.github/CODEOWNERS`); how to propose translation improvements; how to propose methodology corpus changes (the claims-manifest coupling). Plain-language style (short sentences, no jargon-without-gloss — the corpus reading-level spirit, though no lint enforces it on CONTRIBUTING.md). It STILL points to `.github/CODEOWNERS` (keeps the frozen trust-artifacts AC-4 CODEOWNERS-pointer assertion green).
2. **AC-2 (docs/required-ci-checks.md full enumeration):** `docs/required-ci-checks.md` (NEW) enumerates EVERY CI check from `pr-checks.yml` + `scheduled.yml` (+ the `release.yml` jobs): for each, what it enforces, what triggers it, what failure looks like, and how to fix; and each entry links the corresponding `tools/lint-*.mjs` source OR the relevant `tests/**/*.spec.mjs`. The pr-checks set is the real current ~40 jobs (incl. `trust-verification-full`, `csp-violation-count`, `viewport-overflow`, `axe-core-pa11y`, `lighthouse`, `byte-stable-build`, the negative-assertion lints, etc.); the scheduled set is the 4 health checks (`mirror-parity-check`, `internet-archive-snapshot-health`, `software-heritage-snapshot-health`, `zenodo-doi-resolution`). Enumerate by REAL job name (lesson-2026-06-03-001), not a glob.
3. **AC-3 (cross-links at the right moments):** `CONTRIBUTING.md` cross-links `docs/required-ci-checks.md` (at the "CI checks" step), `docs/branch-protection-config.md` (at the dual-approval step, so the contributor learns about it at the right moment — Story 7.8's regression-recovery playbook is thereby reachable), `docs/scheduled-yml-failure-routing.md` (so anyone seeing a scheduled-check Issue finds the playbook), and `.github/CODEOWNERS` (reviewer-of-record).
4. **AC-4 (graduate frozen trust-artifacts AC-4 + new structural test + integrity + no regression):** `tests/scaffold/trust-artifacts.test.mjs` (class-A) AC-4 currently asserts CONTRIBUTING.md "references Epic 8 expansion timing" + the CODEOWNERS pointer. The full version is no longer "expanded in Epic 8" (it IS that expansion), so graduate AC-4: drop the "Epic 8 expansion timing" assertion, KEEP `existsSync` + the CODEOWNERS pointer, and assert the full guide's presence (e.g. a "Pull request" / "dual approval" section). A NEW `tests/scaffold/contributing-docs.test.mjs` asserts: CONTRIBUTING.md has the fork/branch/PR + dual-approval + reviewer-of-record + translation + corpus-change sections + the four cross-links; `docs/required-ci-checks.md` exists and enumerates a representative set of the real job names (incl. `trust-verification-full` + the 4 scheduled health checks) with source links. Re-register integrity for the edited class-A `trust-artifacts.test.mjs` (lesson-2026-05-20-007). `make test`/`make lint`/`make build` green.

## Tasks / Subtasks

- [ ] **Task 1: Author the full CONTRIBUTING.md** (AC: 1)
  - [ ] Replace the slim stub with the full guide: fork/branch/PR workflow; CI-checks section; dual-approval (FR49) section; reviewer-of-record section; propose-translation-improvements; propose-corpus-changes (claims-manifest coupling). Plain language. Keep the CODEOWNERS pointer.
- [ ] **Task 2: Author docs/required-ci-checks.md enumeration** (AC: 2)
  - [ ] Enumerate every pr-checks.yml + scheduled.yml (+ release.yml) job by REAL name with enforces/trigger/failure/fix + a link to the `tools/lint-*.mjs` or `tests/**/*.spec.mjs` source (lesson-2026-06-03-001).
- [ ] **Task 3: Cross-link the four docs from CONTRIBUTING.md** (AC: 3)
  - [ ] required-ci-checks.md (CI step), branch-protection-config.md (dual-approval step), scheduled-yml-failure-routing.md, CODEOWNERS — each at the right moment.
- [ ] **Task 4 (test-author phase): Graduate frozen trust-artifacts AC-4 + add contributing-docs test + re-register integrity** (AC: 4)
  - [ ] Graduate `tests/scaffold/trust-artifacts.test.mjs` AC-4 (drop "Epic 8 expansion timing", keep exists + CODEOWNERS pointer, assert full-guide presence) + add `tests/scaffold/contributing-docs.test.mjs` (sections + cross-links + required-ci-checks enumeration) + `tds integrity record` the edited trust-artifacts.test.mjs; re-grep manifest post-sweep.
- [ ] **Task 5: Regression gate** (AC: 4)
  - [ ] `make test`/`make lint`/`make build` green + deterministic; baseline-diff any ambiguous failure (lesson-2026-06-03-002).

## Dev Notes

- **Frozen trust-artifacts AC-4 (class-A):** `tests/scaffold/trust-artifacts.test.mjs` AC-4 (~lines 113-125) asserts CONTRIBUTING.md exists + "references Epic 8 expansion timing" + points to CODEOWNERS. Writing the full guide removes the "expanded in Epic 8" framing → the timing assertion goes red. Graduate it (test-author phase) + `tds integrity record --files=tests/scaffold/trust-artifacts.test.mjs --reason="story-8-6: graduate AC-4 CONTRIBUTING slim→full"`; re-grep state-manifest after the sweep (lesson-2026-05-19-013). Keep the CODEOWNERS-pointer assertion — the full guide still links CODEOWNERS.
- **Real CI job set to enumerate (required-ci-checks.md):** pr-checks.yml has ~40 jobs (the negative-assertion lints `lint-no-*`, corpus lints `lint-frontmatter`/`lint-glossary`/`lint-reading-level`/`lint-claims-manifest`/`lint-license-provenance`/`lint-translation-parity`/`lint-fr36-protection`/`lint-csp-source`/`lint-css-link-order`/`lint-cognitive-load-budget`/`lint-i18n-coverage`/`lint-trust-artifacts`, `eslint`, `golden-vector-parity`, `byte-stable-build`, the Playwright specs `network-trace`/`full-slice-network-trace`/`co-equal-triplet-*`/`reveal-stage-event-ordering`/`difficulty-sentence`/`mid-session-bail-out`/`chrome-components`/`csp-violation-count`/`viewport-overflow`/`state-shape-contract`/`tear-edge-overlay`/`cropping-fuzzer`/`asymmetric-tail-scenes`/`i18n-locale-switch`/`exit-criterion-spec`, `lighthouse`, `axe-core-pa11y`, `trust-verification-full`). scheduled.yml: `mirror-parity-check`, `internet-archive-snapshot-health`, `software-heritage-snapshot-health`, `zenodo-doi-resolution`. release.yml: `app-release`, `corpus-release`, `deploy-to-mirror`. The doc can group these (negative-assertion lints / corpus lints / scoring / build-integrity / Playwright trust / a11y+perf / scheduled / release) but must NAME each real job + link a source.
- **Cross-link targets exist:** `docs/branch-protection-config.md` (Story 7.8) + `docs/scheduled-yml-failure-routing.md` (Story 8.3) are on epic/8. `.github/CODEOWNERS` exists. Only `docs/required-ci-checks.md` is new.
- **lint-reading-level does NOT scan CONTRIBUTING.md** (it globs `src/content/methodology`), so the "plain language" AC is an authoring guideline, not a lint gate — but write it readably anyway (Marek journey).
- **Files:** `CONTRIBUTING.md` (rewrite), `docs/required-ci-checks.md` (NEW), `tests/scaffold/trust-artifacts.test.mjs` (class-A graduation, test-author), `tests/scaffold/contributing-docs.test.mjs` (NEW, test-author). No code/workflow changes.

### Carry-forward lessons

- lesson-2026-06-03-001 (high): CI wires per-spec; enumerate REAL job names, not a glob. Apply: docs/required-ci-checks.md lists each actual pr-checks/scheduled job by name (verify against the workflow files), the load-bearing content of this story.
- lesson-2026-05-20-007 (high): class-A frozen-test edits need a Carry-forward entry + integrity re-registration. Apply: graduating trust-artifacts.test.mjs AC-4 is class-A → `tds integrity record` it (Task 4).
- lesson-2026-05-19-013 (high): direct state-manifest edits can be undone by the sweep. Apply: re-register via the CLI, re-grep the manifest after the state-commit sweep.
- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: the CONTRIBUTING rewrite is net-new; baseline-diff before labeling any failure pre-existing.

### Project Structure Notes

- `CONTRIBUTING.md` at repo root; `docs/required-ci-checks.md` under `docs/`. Tests under `tests/scaffold/`. No structural variance.

### References

- [Source: epics.md#Story-8.6] — AC source (full CONTRIBUTING.md, required-ci-checks.md, cross-links).
- [Source: CONTRIBUTING.md] — current Epic-1 slim stub being replaced.
- [Source: tests/scaffold/trust-artifacts.test.mjs#AC-4] — frozen class-A CONTRIBUTING assertions to graduate (~lines 113-125).
- [Source: .github/workflows/pr-checks.yml + scheduled.yml + release.yml] — the real job names to enumerate.
- [Source: docs/branch-protection-config.md (Story 7.8), docs/scheduled-yml-failure-routing.md (Story 8.3), .github/CODEOWNERS] — cross-link targets.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
