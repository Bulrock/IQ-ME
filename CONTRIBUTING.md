# Contributing to IQ-ME

This file is **intentionally slim** at Epic 1 (v0.0.1). The full contribution surface — including the reviewer-of-record discipline, branch-protection rules, the corpus-build-conventions deep-dive, and the per-locale translation workflow — lands in Epic 8 alongside the per-language reviewer-of-record onboarding.

## What this file covers today

- Where the actual rules live (until Epic 8).
- The minimum bar a PR must meet right now.

## Where the actual rules live

- **Reviewer-of-record discipline:** see [`.github/CODEOWNERS`](.github/CODEOWNERS). At v0.0.1 the per-language reviewers are placeholders (`@TBD-ru-reviewer`, `@TBD-pl-reviewer`); branch protection enforces co-equal reviewer approval once Gate 9c (RU) and Gate 9d (PL) close.
- **License posture and attribution rules:** see [`LICENSES.md`](LICENSES.md). Any change to that file requires a matching `CHANGELOG.md` entry per NFR24.
- **Corpus authoring conventions:** see `docs/corpus-build-conventions.md` (Story 1.4). Schema lives in `corpus/schema.json`.
- **Markdown subset for methodology pages:** see `corpus/markdown-subset-v1.md` (Story 1.4). The renderer is strict — any out-of-subset construct fails the build.

## Minimum bar for a PR at v0.0.1

1. `make lint && make test && make build` exit 0 locally.
2. No new runtime npm dependencies (NFR33). Dev-only tooling is permitted via `npx --yes` or vendored under `vendor/` with a SHA in `vendor/SHASUMS`.
3. No third-party network requests from any shipped JS or HTML (NFR6 / FR41). The Story 1.7 Playwright network-trace asserts zero third-party requests on every PR.
4. Methodology content changes touch only the `en/` source-of-truth. RU/PL translations follow only after EN content stabilizes; the Story 1.4 frontmatter contract carries `sourceHashEN` for stale-translation detection (NFR29).

## Expanded in Epic 8

Epic 8 lands the full contributing guide: the per-locale translator onboarding flow, the methodology-claims manifest review checklist, the per-corpus-release tagging protocol (`app-v*` vs `corpus-v*`), the byte-stable build assertion contract, and the archival workflow (Zenodo + Internet Archive + Software Heritage). Until then, defer to `.github/CODEOWNERS` and to the issue tracker for substantive scope discussion.
