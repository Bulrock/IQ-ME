# Branch-protection configuration — `main` (Story 7.8, FR49 / NFR29)

This document specifies the GitHub branch-protection settings that mechanically enforce **maintainer + per-language-reviewer dual-approval** on non-EN content-key changes, so the discipline is structural (not cultural) — even a maintainer cannot self-merge a non-EN content change without the per-language reviewer-of-record.

> **Live-rule export status: PENDING.** The actual GitHub branch-protection rule export (YAML/JSON) and a confirming screenshot are captured at **launch (Epic 10)**, when the live rules are applied against the real repository with the named Gate-9c/9d reviewers resolved. This dev-phase artifact documents the **intended** settings + the regression-recovery playbook; no GitHub API call configures protection during the dev phase. Replace this PENDING block with the real export when the rules go live.

## Required `main` branch-protection settings

Configure these on the `main` branch (Settings → Branches → Branch protection rules):

1. **Require a pull request before merging.** Direct pushes to `main` are disallowed; all changes land via PR.
2. **Require review from Code Owners.** GitHub blocks merge until the `.github/CODEOWNERS`-designated owner(s) for every touched path have approved. For non-EN content paths this is the per-language reviewer-of-record (`@TBD-{ru,pl}-reviewer` until Gate 9c/9d) **and** the maintainer (`@Bulrock`).
3. **Require approvals** — required approving review count ≥ 1, **and dismiss stale pull-request approvals when new commits are pushed** (a re-push re-opens review).
4. **Require status checks to pass before merging** — require branches to be up to date, and mark ALL of the `pr-checks.yml` jobs (Epic-1/3/4/6/7) as **required status checks**. The required status checks are (non-exhaustive, mirror the live `.github/workflows/pr-checks.yml` job set):
   `lint-trust-artifacts`, `lint-no-role-alert`, `lint-no-share`, `lint-no-cookie-banner`, `lint-no-analytics-script`, `lint-no-external-font`, `lint-i18n-coverage`, `lint-cognitive-load-budget`, `eslint`, `lint-claims-manifest`, `golden-vector-parity`, `network-trace`, `full-slice-network-trace`, `lint-css-link-order`, `co-equal-triplet-computed-style`, `i18n-locale-switch`, `co-equal-triplet-css-source`, `reveal-stage-event-ordering`, `difficulty-sentence`, `mid-session-bail-out`, `chrome-components`, `csp-violation-count`, `state-shape-contract`, `lint-frontmatter`, `lint-glossary`, `lint-reading-level`, `lint-license-provenance`, `byte-stable-build`, `lint-fr36-protection`, `viewport-overflow`, `asymmetric-tail-scenes`, `tear-edge-overlay`, `cropping-fuzzer`, `lighthouse`, `axe-core-pa11y`, `lint-translation-parity`, `lint-csp-source`, `exit-criterion-spec`.
   (The `lint-translation-parity` + `lint-reading-level` jobs (Stories 7.5b / 7.5a) are required so a non-EN parity/reading-level regression is merge-blocking.)
5. **Require conversation resolution before merging.**
6. **Disable / block force pushes** to `main`.
7. **Block deletions** of `main`.
8. **Do not allow bypassing the above settings.** Critically, **administrators and the maintainer are NOT exempt** — "Allow specified actors to bypass required pull requests" is left empty and "Do not allow bypassing the above settings" is enabled. This is what makes the dual-approval mechanical: the maintainer cannot push past a missing per-language-reviewer approval on a non-EN content-key change.

### Dual-approval semantics (why both owners)

GitHub's "Require review from Code Owners" requires at least one approval from a code owner of each touched path. By listing the per-language reviewer-of-record as the content-domain owner **and** `@Bulrock` as maintainer co-owner on every non-EN path, and disabling bypass, a non-EN content-key change requires the per-language reviewer's approval (they own the path) and cannot be merged unilaterally by the maintainer. Until Gates 9c/9d resolve the real handles, the `@TBD-*` owners are un-resolvable — which (by design) leaves non-EN content paths un-mergeable through the normal flow, the strongest possible "not yet ready" signal.

## Regression-recovery playbook — synthetic dual-approval PR

**Goal:** verify (at launch, with real reviewers + live protection) that the dual-approval gate actually blocks merge, and document how to recover if a non-EN change ever lands without it.

**Synthetic test scenario (run at launch):**
1. Open a PR proposing a **single-line change to `src/content/methodology/pl/scoring/overview/index.md`** (a trivial, revertible edit).
2. GitHub must show the PR as **blocked from merge** ("Review required — Code Owners") until **BOTH** the maintainer (`@Bulrock`) and the PL reviewer-of-record have approved. Confirm the merge button stays disabled with only one approval.
3. Confirm an administrator/maintainer **cannot** bypass the requirement (the "merge without waiting for requirements" path is absent because bypass is disabled).
4. Close the synthetic PR without merging; record the result (screenshot) alongside the live-rule export above.

**Recovery — if a non-EN content-key change is ever merged WITHOUT dual-approval:**
1. Treat it as a content-integrity incident. Identify the merge commit (`git log -- src/content/{methodology,i18n,crisis-resources}/{ru,pl}/...`).
2. Open a revert PR immediately; route it through the same dual-approval gate.
3. Re-request the per-language reviewer-of-record's review on the reverted content before re-landing.
4. Audit branch-protection settings (force-push disabled, bypass disabled, Code-Owners review required) — a successful no-dual-approval merge means one of these was relaxed; restore it and capture a fresh export.
5. Note the incident in `CHANGELOG.md` and the relevant `docs/launch-readiness/{ru,pl}-translator-signoff.md`.

## Related artifacts

- `.github/CODEOWNERS` — per-path ownership (per-language reviewer + `@Bulrock` co-owner).
- `.github/workflows/pr-checks.yml` — the required status-check jobs.
- `docs/launch-readiness/{ru,pl}-translator-signoff.md` — the per-language reviewer-of-record sign-off (Gate 9c/9d), enumerating the deliverables that must be signed before launch.
