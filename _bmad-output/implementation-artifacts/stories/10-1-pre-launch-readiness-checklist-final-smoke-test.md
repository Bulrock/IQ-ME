---
id: 10-1-pre-launch-readiness-checklist-final-smoke-test
title: "Story 10-1: Pre-launch readiness checklist + final smoke test"
status: done
---

# Story 10-1: Pre-launch readiness checklist + final smoke test

## Story

As the **IQ-ME maintainer (CEP) about to push the v1.0.0 tag pair**,
I want a final pre-launch readiness checklist that verifies all eight dev epics merged, all five gates closed with their committed artifacts, all CI checks green on main, the full Playwright + Lighthouse + axe-core suite passing, the byte-stable build assertion green, the network-trace assertion green, and a manual smoke test of the canonical + mirror URLs complete,
so that the launch-day tag-push is mechanical and any surprise is caught one hour before tagging, not one minute after deployment.

## ⚠️ HUMAN-GATED — do not fabricate

**This story cannot be completed by a coding agent alone.** Its load-bearing inputs are:

1. **Real human gate closures** — ICAR PDF (9a), psychometrician sign-off (9b), RU/PL translator sign-offs (9c/9d), tester credibility report ≥12/15 (9e). Do NOT fabricate these as closed.
2. **Live URL access** for manual smoke testing canonical + mirror domains. The agent can author the checklist scaffold and baseline document templates, but the actual sign-off fields require human completion.

The **agent-executable deliverables** are: authoring `docs/launch-readiness/v1.0.0-checklist.md`, authoring `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md` (template — to be completed at actual launch), and authoring `docs/launch-readiness/v1.0.0-rollback-runbook.md` (pre-validated runbook for Story 10.3). The checklist items themselves require human verification at actual launch time.

## Acceptance Criteria

1. `docs/launch-readiness/v1.0.0-checklist.md` is authored enumerating: (a) dev-epic merges: Epics 1–8 all merged to main + each epic's exit criterion satisfied; (b) gate-epic closures: `ICAR-CONFIRMATION.pdf` committed (9a), `docs/launch-readiness/psychometrician-signoff.md` finalized (9b), `docs/launch-readiness/ru-translator-signoff.md` finalized (9c), `docs/launch-readiness/pl-translator-signoff.md` finalized (9d), `docs/launch-readiness/tester-credibility-report.md` showing ≥12/15 overall + ≥4/5 per language (9e); (c) CI gates: all `pr-checks.yml` jobs green on main (no `if: false` stubs remaining for v1-scope lints); (d) smoke test: manual happy-path on canonical GitHub Pages URL + mirror URL in EN/RU/PL; (e) browser matrix: Yandex Browser QA pass per NFR5.
2. Every checklist item has a verification step + a sign-off field (date + maintainer handle).
3. `docs/launch-readiness/v1.0.0-rollback-runbook.md` is authored documenting: how to revert `app-v1.0.0` tag, how to redeploy a prior known-good version, how to mark the Zenodo DOI withdrawn, how to issue an Internet Archive correction notice — validated dry-run completable by Story 10.3.
4. `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md` template is authored with fill-in fields for: zero-analytics network-trace snapshot, zero-third-party CSP-violation-count snapshot, no-signup assertion, deployed-tree SHA vs `main` SHA, `LICENSES.md` hash for T+6/T+12/T+24 month audits.
5. The checklist explicitly references the network-trace assertion (FR41 30-second DevTools check) and byte-stable build assertion as required manual verification steps.
6. `make lint` exit 0, `make build` exit 0 on the branch containing these documents (they are documentation-only, no code changes).

## Tasks / Subtasks

- [x] **Task 1:** Author `docs/launch-readiness/v1.0.0-checklist.md` — the master pre-launch checklist (AC 1, AC 2, AC 5).
  - [x] **Subtask 1.1:** Section A — Dev-epic merges (Epics 1–8): list each epic + its exit criterion reference + sign-off field.
  - [x] **Subtask 1.2:** Section B — Gate-epic closures (9a–9e): list each gate with artifact path, threshold, and sign-off field.
  - [x] **Subtask 1.3:** Section C — CI gates: enumerate all `pr-checks.yml` job names (reference `docs/required-ci-checks.md`), add "no `if: false` stubs remaining" assertion, sign-off field.
  - [x] **Subtask 1.4:** Section D — Manual smoke test matrix: EN/RU/PL × Chrome/Firefox/Safari(+Yandex Browser), happy-path steps (consent → 16 items → result → methodology click), FR41 30-second zero-third-party DevTools check, score panel co-equal triplet visual check, bottom/top decile tail-scenes per locale, `hreflang` navigation, cite-this-page widget citation validation, sign-off fields.
  - [x] **Subtask 1.5:** Section E — Byte-stable build assertion: `make test-byte-stable` green, sign-off field.
  - [x] **Subtask 1.6:** Verify the checklist cross-references `docs/launch-readiness/v1.0.0-rollback-runbook.md`.
- [x] **Task 2:** Author `docs/launch-readiness/v1.0.0-rollback-runbook.md` — pre-launch emergency rollback runbook (AC 3).
  - [x] **Subtask 2.1:** Step-by-step: `git tag -d app-v1.0.0` + `git push origin --delete app-v1.0.0` (allowed for emergency only), redeploy prior gh-pages artifact from known-good branch.
  - [x] **Subtask 2.2:** Zenodo DOI withdrawal: link to Zenodo "Mark as withdrawal" docs, note process.
  - [x] **Subtask 2.3:** Internet Archive correction notice: document the `https://web.archive.org/` `Save Page Now` re-run + IA correction-note process.
  - [x] **Subtask 2.4:** Add "dry-run validation" checklist inside the runbook itself (each step annotated with the verification command/check, for Story 10.3 validation).
- [x] **Task 3:** Author `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md` template (AC 4).
  - [x] **Subtask 3.1:** Fields: capture date, zero-analytics verdict (network-trace snapshot reference), zero-third-party fetches (CSP violation count = 0), no-signup assertion, deployed-tree SHA vs `main`-branch source-tree SHA, `LICENSES.md` sha256 hash, `CITATION.cff` sha256 hash.
  - [x] **Subtask 3.2:** Audit schedule section: T+6 months, T+12 months, T+24 months — per-field re-verification protocol (each field has a "current value" + "audit result" pair).
  - [x] **Subtask 3.3:** Note that this template is committed now; actual baseline values are filled in during Story 10.2 execution at real launch.
- [x] **Task 4:** Verify `make lint` exit 0 and `make build` exit 0 on the branch after authoring these docs (AC 6).
  - [x] **Subtask 4.1:** Run `make lint` — confirm exit 0.
  - [x] **Subtask 4.2:** Run `make build` — confirm exit 0.

## Dev Notes

- **This story is documentation-only.** It creates three markdown files under `docs/launch-readiness/`. No source code, no tests, no CI job changes.
- **Checklist section C (CI gates):** pull the authoritative job-name list from `docs/required-ci-checks.md` (actively maintained) and `.github/workflows/pr-checks.yml` (source of truth). Do NOT hardcode job names from memory — use `grep 'name:' .github/workflows/pr-checks.yml` to extract them.
- **NFR5 / Yandex Browser:** the browser matrix requires a Yandex Browser QA pass. The checklist sign-off field for this should note "Yandex Browser — manual; no CI equivalent."
- **Gate 9a–9e artifacts:** paths are:
  - 9a: `ICAR-CONFIRMATION.pdf` at repo root
  - 9b: `docs/launch-readiness/psychometrician-signoff.md`
  - 9c: `docs/launch-readiness/ru-translator-signoff.md`
  - 9d: `docs/launch-readiness/pl-translator-signoff.md`
  - 9e: `docs/launch-readiness/tester-credibility-report.md` (≥12/15 overall + ≥4/5 per language)
- **Epic exit criteria references:**
  - Epic 1: Story 1.9 eslint-no-restricted-paths green; trust artifacts present (LICENSES.md, CODEOWNERS, CITATION.cff, CONTRIBUTING.md, ICAR-CONFIRMATION.pdf non-placeholder)
  - Epic 2: golden-vector ±0.001 logits parity green (`tests/golden/vectors.json`)
  - Epic 3: full-slice Playwright happy-path green
  - Epic 4: all corpus lints demonstrated on corpus + SPA (Story 4.8)
  - Epic 5: corpus anchor pages + scoring/norming pages complete (Story 5.8)
  - Epic 6: full 5-beat reveal-stage event + score panel + all tail scenes + all 3 locales
  - Epic 7: RU/PL localization complete + clinical-register copy
  - Epic 8: release.yml ships both jobs + byte-identical mirror + archival (Story 8.8)
- **`v1.0.0-no-enshittification-baseline.md`:** this is a template committed *now*, to be filled in during actual launch (Story 10.2). The template must clearly mark all value fields as `[FILL IN AT LAUNCH]` — do not invent values.
- **Rollback runbook:** tag deletion with `git push origin --delete` is an exception to the no-force-push rule; explicitly annotate as "emergency rollback only" and reference the runbook context.
- **Do not check that gates are actually closed** — that is human work at launch time. The checklist is the instruction scaffold; the human signs it off.
- **No new test files** — this story is pure documentation. lint-trust-artifacts and other lints do not assert on `docs/launch-readiness/*.md` content (only on `LICENSES.md`, `CITATION.cff`, `CODEOWNERS`, `CONTRIBUTING.md`). No CI wiring change needed.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): Harm-critical placeholder content must never fabricate specifics. Apply: the baseline template must mark all value fields as `[FILL IN AT LAUNCH]`; the checklist sign-off fields must not be pre-filled with made-up dates or outcomes.
- lesson-2026-06-03-001 (high): pr-checks.yml wires specs per-spec (one job each), NOT via greedy glob. Apply: when enumerating CI jobs in the checklist, use `grep 'name:' .github/workflows/pr-checks.yml` to extract actual job names — do not list from memory.
- lesson-2026-05-20-007 (high): Every story spec carries `### Carry-forward lessons` populated from `tds memory query`. Apply: this section is present and populated; any follow-on story for epic 10 must also populate it.
- lesson-2026-06-03-002 (high): Before labeling a failing test pre-existing vs introduced, verify with a baseline diff. Apply: if `make lint` or `make build` fails after authoring docs, run `git diff main -- <file>` to confirm the failing check is not pre-existing before attributing it to this story.
- lesson-2026-05-19-013 (high): Direct YAML edits to state-manifest.yaml can be silently undone by next tds state-commit sweep. Apply: this story does not edit state-manifest.yaml; if the story sweep records the docs/launch-readiness/*.md paths as class-A, do NOT manually remove them — use `tds integrity remove` if needed.

### Project Structure Notes

- **New files:** `docs/launch-readiness/v1.0.0-checklist.md`, `docs/launch-readiness/v1.0.0-rollback-runbook.md`, `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md`
- **No existing files modified** (documentation-only story).
- Canonical URL: `https://iq-me.org/` (GitHub Pages); Mirror URL: `https://iq-me.pages.dev/` (Cloudflare Pages). Both referenced in release.yml `CANONICAL_URL` / `MIRROR_URL` env vars.
- `docs/required-ci-checks.md` is the authoritative CI job reference (maintained by `tests/scaffold/contributing-docs.test.mjs`).
- `docs/adr/release-tag-namespace-contract.md` documents the `app-v*.*.*` + `corpus-v*.*.*` decoupled-tag pattern.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.1]
- [Source: .github/workflows/release.yml — release jobs, archival steps, mirror deploy, vars.IQME_LIVE_ARCHIVAL / vars.IQME_LIVE_MIRROR gates]
- [Source: docs/required-ci-checks.md — authoritative CI job enumeration]
- [Source: docs/launch-readiness/tester-credibility-report.md — 9e threshold (≥12/15 + ≥4/5 per lang)]
- [Source: docs/launch-readiness/psychometrician-signoff.md — 9b sign-off template]
- [Source: docs/launch-readiness/internet-archive-snapshots.md — IA snapshot record]
- [Source: docs/launch-readiness/software-heritage-snapshots.md — SH archive record]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- All 3 launch-readiness docs authored; 14/14 scaffold tests green; make lint exit 0; make build exit 0

### File List

- docs/launch-readiness/v1.0.0-checklist.md
- docs/launch-readiness/v1.0.0-rollback-runbook.md
- docs/launch-readiness/v1.0.0-no-enshittification-baseline.md
- tests/scaffold/10-1-pre-launch-checklist.test.mjs

## Auditor Findings (round-1)

### [info] Epic-10 deliverables (5 launch-readiness docs + 3 scaffold tests) were integrity-recorded during the dev phase but never git-committed — they sat untracked in the working tree until clean-context code-review caught them. Root cause: the "chore(tds): state sweep" commits only stage TDS-managed path globs (state-manifest, branch-registry, sprint-status, story specs); production deliverables under docs/ and tests/scaffold/ fall outside those globs and were never `git add`ed. Preflight `dirty-tds-state` and `tds integrity verify` both stayed green because the files exist on disk and are hash-recorded — neither guard checks git tracking state. Had this not been caught, `tds deliver` would have squash-merged an epic missing its own deliverables. Resolved in-review: committed as 3 per-story commits onto epic/10 before auditor delegation.

- **Category:** workflow-gap
- **Suggested bridge:** `execute-story / engineer should git-add + commit production deliverables in each story's File List (not only integrity-record them), OR the state-sweep glob should widen to include committed File List paths. Add a preflight check that flags File-List paths present on disk + integrity-recorded but untracked/uncommitted in git, so the gap surfaces at story close rather than at epic delivery.`
