# Changelog

All notable user-facing changes to IQ-ME are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses the
decoupled version namespaces `app-v<X>.<Y>.<Z>` (application) and
`corpus-v<X>.<Y>.<Z>` (methodology corpus).

Each released entry carries its release date, the corpus-version and app-version
(when they differ), and a `### Contributors` subsection crediting the GitHub
handles whose pull requests landed in that release. Contributor credit is
generated from `git log` between release tags by `release.yml` and reviewed by
the maintainer in a release-prep pull request before tagging — there is **no
external tracking, no analytics, no social-graph lookup, and no email
notification** (FR53). Updates reach users via GitHub Discussions and repository
release notifications only.

## [Unreleased]

### Added

### Changed

- (Story 4.5) `lint-license-provenance` activated; `LICENSES.md` last-modified-hash flipped from placeholder to real SHA-256.

### Deprecated

### Removed

### Fixed

### Security

## [v0.1.0] — 2026-05

Initial public-stub release. Corpus-version `corpus-v0.1.0`; app shipped from the
Epic-3 vertical slice. The `lint-license-provenance` drift-reference target is
preserved above under Unreleased per NFR24.

### Added

- The initial Epic-3 stub methodology pages — `scoring/percentile-to-iq/`,
  `scoring/uncertainty/`, `scoring/overview/` — the click-targets behind the
  score-panel triplet. Honest stubs; expanded in place at `v0.5.0` per the FR28
  permalink commitment (URLs unchanged across version bumps).

### Contributors

- @Bulrock
