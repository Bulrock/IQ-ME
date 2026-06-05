# Contributing to IQ-ME

Thank you for helping. IQ-ME is a free, no-signup, zero-telemetry self-assessment. Everything ships from this repository and runs as-described in the browser. This guide explains how to open a pull request, what it will be checked against, and who reviews it.

If anything here is unclear, open a GitHub Discussion or an issue — that is itself a useful contribution.

## How to open a pull request

1. **Fork** this repository to your own GitHub account.
2. **Branch** from `main` with a short, descriptive name (for example `fix/pl-glossary-typo` or `docs/clarify-scoring`).
3. Make your change. Keep it small and focused — one concern per pull request.
4. Run the local gate before you push:
   ```sh
   make lint && make test && make build
   ```
   All three must exit 0. See [`docs/required-ci-checks.md`](docs/required-ci-checks.md) for the full list of checks and how to fix each failure.
5. **Open a pull request** against `main`. Describe what changed and why. Link any related issue or Discussion.
6. CI runs automatically (see below). A maintainer — and, for non-English content, the per-language reviewer-of-record — reviews and merges.

### The minimum bar

- `make lint && make test && make build` exit 0 locally and in CI.
- **No new runtime npm dependencies** (NFR33). Dev-only tooling is allowed via `npx --yes` or vendored under `vendor/` with a SHA in `vendor/SHASUMS`.
- **No third-party network requests** from any shipped JS or HTML (NFR6 / FR41). The Playwright network-trace asserts zero third-party requests on every PR.
- **English is the source of truth** for methodology content. RU/PL translations follow only after the EN content stabilizes; the frontmatter `sourceHashEN` field drives stale-translation detection (NFR29).

## What CI checks your pull request against

Every pull request runs the checks in [`pr-checks.yml`](.github/workflows/pr-checks.yml). [`docs/required-ci-checks.md`](docs/required-ci-checks.md) enumerates each check by name — what it enforces, what triggers it, what a failure looks like, and how to fix it — with a link to the lint source under `tools/` or the test spec under `tests/`. Read it before opening a PR so you know what to expect.

A weekly scheduled workflow ([`scheduled.yml`](.github/workflows/scheduled.yml)) verifies mirror parity and archival health. If you ever see a GitHub Issue labeled `area:scheduled-check`, the triage playbook is in [`docs/scheduled-yml-failure-routing.md`](docs/scheduled-yml-failure-routing.md).

## Dual approval for non-English content (FR49)

Changes to **non-English content-key paths** (RU/PL methodology, i18n strings, glossary, crisis-resource lists, tail-scene copy) require **two approvals**: the maintainer **and** the per-language reviewer-of-record. This is mechanical, not cultural — branch protection blocks the merge until both approve, and even the maintainer cannot self-merge such a change.

The exact branch-protection settings (required reviews, required status checks, no-bypass, disable force-push) and the synthetic-PR regression-recovery playbook are documented in [`docs/branch-protection-config.md`](docs/branch-protection-config.md).

## Reviewer-of-record discipline

Per-language reviewers are encoded in [`.github/CODEOWNERS`](.github/CODEOWNERS). Until Gate 9c (RU) and Gate 9d (PL) close, the per-language reviewers are placeholders (`@TBD-ru-reviewer`, `@TBD-pl-reviewer`) and the maintainer co-owns every non-English path. When a real reviewer-of-record is onboarded, their GitHub handle replaces the placeholder in CODEOWNERS and is recorded in the page masthead and `CHANGELOG.md`.

## How to propose a translation improvement

1. Find the EN source under `src/content/methodology/en/…` and the matching locale file under `…/ru/…` or `…/pl/…`.
2. Make the translation change. Do **not** change the EN source in the same PR — translations track EN, not the other way around.
3. If the EN source has drifted (the stale-translation hatnote shows), reconcile the `sourceHashEN` only after the translation matches the current EN meaning.
4. Open the PR. It will route to the per-language reviewer-of-record (CODEOWNERS) plus the maintainer for dual approval.

Crisis-resource and other harm-sensitive placeholders must never invent specifics (for example a wrong hotline number). Reference real, verified directories and mark anything pending reviewer-of-record vetting.

## How to propose a methodology corpus change

The methodology corpus is the load-bearing trust surface. A change to a scoring or methodology claim must stay coupled to the evidence:

1. Edit the EN methodology page under `src/content/methodology/en/…` following [`docs/corpus-build-conventions.md`](docs/corpus-build-conventions.md) and the strict markdown subset (`corpus/markdown-subset-v1.md`).
2. If you add, change, or remove a methodological **claim**, update the **claims manifest** (`corpus/METHODOLOGY_CLAIMS.json`) in lockstep — the `lint-claims-manifest` check fails a PR whose claims and manifest disagree.
3. Run `make build` to re-emit the corpus and confirm byte-stable output; run `make lint` so the frontmatter, glossary, reading-level, and license-provenance checks pass.
4. Open the PR. Methodology changes are reviewed by the maintainer; substantive psychometric claims may be held for external sign-off (Gate 9b).

## License and attribution

The app is MIT, the content is CC-BY-NC-SA — see [`LICENSES.md`](LICENSES.md). Any change to `LICENSES.md` requires a matching `CHANGELOG.md` entry (NFR24). Contributors are credited by GitHub handle in the per-release `CHANGELOG.md` — no email, no newsletter, no external tracking (FR53).

## Where to ask

- **GitHub Discussions** for questions, ideas, and scope conversations.
- **Issues** for bugs and concrete proposals.

There is no email list and no signup. Watch the repository (Releases only) or subscribe to a Discussion thread to follow updates.
