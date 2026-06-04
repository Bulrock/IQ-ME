---
id: 8-1-release-yml-workflow-app-v-corpus-v-tag-triggers-deployment
title: "Story 8.1: release.yml workflow — app-v* + corpus-v* tag triggers + deployment"
status: ready-for-dev
---

# Story 8.1: release.yml workflow — app-v* + corpus-v* tag triggers + deployment

## Story

As a **maintainer cutting v1.0.0**,
I want **the `release.yml` GitHub Actions workflow (stub from Epic 1) fully implemented with separate triggers for `app-v*` tags (deploy SPA to GitHub Pages) and `corpus-v*` tags (re-emit + deploy the methodology corpus), per the decoupled tag namespaces (architecture D7)**,
so that **the app and corpus version namespaces operate independently and the v1.0.0 launch is a coordinated double-tag (`app-v1.0.0` + `corpus-v1.0.0`)**.

## Acceptance Criteria

> **Epic-8 dev-phase decision (infra-now) — no live deploy.** `release.yml` only runs on real tag pushes against the live repo with GitHub Pages + secrets configured (launch / Epic 10). The dev-phase deliverable is the **fully-authored workflow** + a **structural contract test** that parses `release.yml` and asserts the job/trigger/step contract. NO tag is pushed, NO GitHub API / Pages deploy is exercised in dev (same posture as Story 7.8's branch-protection doc). **Scope boundary:** this story lands the release skeleton deploying to **GitHub Pages canonical only**. The `corpus-release` archival steps (Zenodo DOI + Internet Archive + Software Heritage) are **Story 8.2**; the `deploy-to-mirror` (Codeberg/Cloudflare) job is **Story 8.4**. 8-1 must leave clearly-marked extension points for those, not implement them.

1. **AC-1 (triggers + two tag-gated jobs):** `.github/workflows/release.yml` triggers on `on: push: { tags: ['app-v*.*.*', 'corpus-v*.*.*'] }` and defines two distinct jobs — `app-release` (runs only for `app-v*` tags) and `corpus-release` (runs only for `corpus-v*` tags). The per-job gating is via a job-level `if:` on the tag ref (e.g. `if: startsWith(github.ref, 'refs/tags/app-v')` / `'refs/tags/corpus-v'`) so a single-namespace tag push runs exactly one job, and the coordinated double-tag runs both.
2. **AC-2 (app-release job → GitHub Pages):** the `app-release` job checks out, assembles the `dist/` SPA artifact via `make build` (a no-op *transform* per NFR21 — the shipped JS equals source JS byte-for-byte; "build" = deterministic assembly, not transpile), runs the full lint + test suite (`make lint && make test`, which is the same gate `pr-checks.yml` enforces — enumerate by the aggregate `make` targets, NOT a glob, per lesson-2026-06-03-001), and deploys the artifact to the `gh-pages` branch (standard GitHub Pages pattern per architecture §860–862). All asset paths stay relative (no GitHub-Pages-specific path tricks — mirror-readiness NFR17).
3. **AC-3 (corpus-release job → per-corpus-release re-emit, NFR25):** the `corpus-release` job derives the corpus version from the tag (`refs/tags/corpus-v<X>.<Y>.<Z>` → `IQME_CORPUS_VERSION=v<X>.<Y>.<Z>`), invokes `make build-methodology IQME_CORPUS_VERSION=v<X>.<Y>.<Z>` (the real version-injection mechanism — see Dev Notes; the epics' loose `--corpus-version` phrasing is NOT the actual flag), and deploys the resulting `dist/methodology/v<X>.<Y>.<Z>/` tree to the `gh-pages` canonical path **without** clobbering prior `dist/methodology/v<prior>/` permalinks (archaeological citations must keep resolving). The unconditional re-emit semantics (every page re-emitted regardless of content change) are exercised by the build step.
4. **AC-4 (coordinated double-tag + footer resolution + byte-stable):** the workflow handles the v1.0.0 coordinated `app-v1.0.0` + `corpus-v1.0.0` path (both jobs run independently). The SPA shell's footer methodology link is resolved at build time via `git describe --tags --match 'corpus-v*' --abbrev=0` (the single build-time version substitution touching the SPA shell, architecture §596–597) so the deployed app points at the just-deployed corpus version. The `app-release` verification invokes the byte-stable build assertion (Epic 4 — `make test-byte-stable` / `tests/playwright/byte-stable.spec.mjs`) so a non-byte-stable artifact blocks the release.
5. **AC-5 (structural contract test; no live deploy):** a new `tests/scaffold/release-workflow.test.mjs` parses `release.yml` (YAML) and asserts AC-1…AC-4: the two tag globs; the two `if:`-gated jobs; the app-release `make build` + `make lint`/`make test` + gh-pages deploy steps; the corpus-release `IQME_CORPUS_VERSION` derivation + `make build-methodology` + methodology deploy; the `git describe --match 'corpus-v*'` footer substitution; the byte-stable invocation; and that the Zenodo/IA/SH + mirror steps are absent-but-marked-as-deferred (a TODO/comment naming Story 8.2 / 8.4 extension points). No tag push, no GitHub API, no Pages deploy in dev.
6. **AC-6 (graduate frozen ci-matrix AC-6 + integrity + no regression):** `tests/scaffold/ci-matrix.test.mjs` (class-A) AC-6 currently asserts `release.yml` STILL contains `echo "Activates in Epic 8"` + the inline `app-v*`/`corpus-v*` namespace comments (lines ~214–234). Implementing release.yml breaks those frozen assertions, so this story graduates the release.yml AC-6 assertions to assert the **activated** structure (workflow no longer a stub) and **re-registers integrity** for the edited class-A test via `tds integrity record` (lesson-2026-05-20-007 / lesson-2026-05-19-001). The `scheduled.yml` stub assertions in AC-6 stay untouched (scheduled.yml is activated in Story 8.3). `make test` green, `make lint` green, `make build` deterministic.

## Tasks / Subtasks

- [ ] **Task 1: release.yml triggers + two tag-gated jobs** (AC: 1)
  - [ ] Replace the stub `echo` job with `on: push: { tags: ['app-v*.*.*', 'corpus-v*.*.*'] }` + `app-release` and `corpus-release` jobs, each gated by a job-level `if:` on the tag ref.
- [ ] **Task 2: app-release job (build + full gate + Pages deploy + byte-stable)** (AC: 2, 4)
  - [ ] checkout → `make build` → `make lint && make test` → `make test-byte-stable` → deploy `dist/` to `gh-pages` (relative paths only).
- [ ] **Task 3: corpus-release job (IQME_CORPUS_VERSION re-emit + methodology deploy)** (AC: 3)
  - [ ] Derive `IQME_CORPUS_VERSION=v<X.Y.Z>` from the `corpus-v*` tag ref; `make build-methodology IQME_CORPUS_VERSION=…`; deploy `dist/methodology/v<X.Y.Z>/` to gh-pages without clobbering prior version dirs.
- [ ] **Task 4: footer corpus-version substitution + double-tag handling** (AC: 4)
  - [ ] Substitute `git describe --tags --match 'corpus-v*' --abbrev=0` into the SPA shell footer link at build; document the coordinated `app-v1.0.0` + `corpus-v1.0.0` double-tag flow inline.
  - [ ] Mark deferred extension points: Zenodo/IA/SH archival (Story 8.2), Codeberg/Cloudflare mirror deploy (Story 8.4).
- [ ] **Task 5: structural contract test (no live deploy)** (AC: 5)
  - [ ] `tests/scaffold/release-workflow.test.mjs` parses release.yml and asserts the AC-1…AC-4 contract + the deferred-marker presence; no tag push / no API / no deploy.
- [ ] **Task 6: graduate frozen ci-matrix AC-6 + re-register integrity** (AC: 6)
  - [ ] Update `tests/scaffold/ci-matrix.test.mjs` AC-6 release.yml assertions from stub-placeholder to activated-structure; keep scheduled.yml stub assertions; run `tds integrity record --files=tests/scaffold/ci-matrix.test.mjs` and verify it persists after the next state-commit sweep.
- [ ] **Task 7: regression gate** (AC: 6)
  - [ ] `make test` / `make lint` / `make build` all green + deterministic; baseline-diff any ambiguous failure before labeling pre-existing (lesson-2026-06-03-002).

## Dev Notes

- **release.yml contract (architecture §539–543, §860–862):** `on: push: tags: ['app-v*.*.*','corpus-v*.*.*']`. On `app-v*` → build `dist/` (app modules; corpus version unchanged), deploy to gh-pages + (mirror in 8.4), open Release. On `corpus-v*` → build `dist/methodology/v<new>/{en,ru,pl}/…`, deploy, (Zenodo/IA/SH in 8.2), open Release with corpus changelog + DOI (8.2). Deploy pattern = push `dist/` to the `gh-pages` branch; on corpus tags only `dist/methodology/v<new>/` is (re)built+pushed, prior version dirs preserved by re-emit semantics.
- **Corpus-version injection — USE THE REAL MECHANISM.** `tools/build-methodology.mjs` reads the version from (1) `IQME_CORPUS_VERSION` env (must match `/^v\d+\.\d+\.\d+$/`), else (2) `git describe --tags --match 'corpus-v*' --abbrev=0` (strips the `corpus-` prefix). The Makefile documents `make build-methodology IQME_CORPUS_VERSION=v1.2.0`. The epics' `--corpus-version` phrasing is NOT a real flag — the workflow MUST set the env var (e.g. parse `${GITHUB_REF#refs/tags/corpus-}` → `IQME_CORPUS_VERSION`). Writing `--corpus-version` would silently fall through to `git describe`.
- **Footer substitution (architecture §596–597):** the ONLY build-time version substitution touching the SPA shell is the footer methodology link, resolved via `git describe --tags --match 'corpus-v*' --abbrev=0`. On an `app-v*` release this picks up the most-recently-tagged corpus version.
- **NFR21 "build" is assembly, not transpile:** "builds the SPA artifact (no-op since runtime-zero-build)" means `dist/` is assembled deterministically; the deployed JS tree must equal the source JS tree byte-for-byte. Do not introduce a bundler/transpile step. The byte-stable assertion (Epic 4) guards this.
- **CLASS-A frozen edit (AC-6) — non-optional ceremony.** `tests/scaffold/ci-matrix.test.mjs` is `artefact_class: A`. Its AC-6 (`release.yml stub exists with echo "Activates in Epic 8"`, lines ~214–234) WILL go red when release.yml is implemented. This is an authorized, in-scope graduation (the story OWNS release.yml activation). After editing: `tds integrity record --files=tests/scaffold/ci-matrix.test.mjs --reason="story-8-1: graduate AC-6 release.yml stub→activated"` as engineer, then re-grep state-manifest after the sweep to confirm it didn't resurrect the old hash (lesson-2026-05-19-013). Do NOT hand-edit state-manifest.yaml.
- **Test runner:** `release-workflow.test.mjs` lives in `tests/scaffold/` → runs under `make test` (node --test), NOT a Playwright spec, so it needs NO per-spec `pr-checks.yml` job (lesson-2026-06-03-001 applies to Playwright specs; this is a scaffold test in the batched run). Parse YAML with the same approach `ci-matrix.test.mjs` uses.
- **Files:** `.github/workflows/release.yml` (implement, replacing stub), `tests/scaffold/release-workflow.test.mjs` (NEW), `tests/scaffold/ci-matrix.test.mjs` (class-A graduation). Do NOT implement archival (8.2) or mirror (8.4) — leave marked extension points. Do NOT touch scheduled.yml (8.3).

### Carry-forward lessons

- lesson-2026-05-20-007 (high): class-A frozen-test edits need a Carry-forward entry + integrity re-registration. Apply: graduating `ci-matrix.test.mjs` AC-6 is a class-A edit → `tds integrity record` it (Task 6), don't skip the ceremony.
- lesson-2026-05-19-013 (high): direct state-manifest.yaml edits can be undone by the next sweep. Apply: re-register via the `tds integrity record` CLI, then re-grep the manifest after the state-commit sweep to confirm the new hash persisted.
- lesson-2026-06-03-001 (high): pr-checks wires jobs explicitly, not via a glob. Apply: release.yml's app-release gate enumerates `make lint && make test` (aggregate targets); the structural test asserts the concrete invocation, not a globbed run.
- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: release.yml activation is net-new; before calling any red test pre-existing, run `git diff main -- <file>` or a baseline checkout and quote it in the self-review.

### Project Structure Notes

- Workflow under `.github/workflows/release.yml`; tests under `tests/scaffold/`. `tools/build-methodology.mjs` + `Makefile` are the build entry points. No structural variance; Domain D (`tools/` + `.github/workflows/` + `Makefile`) owns this per architecture §1029.

### References

- [Source: epics.md#Story-8.1] — AC source (two tag-gated jobs, app/corpus deploy, coordinated double-tag, byte-stable).
- [Source: architecture.md#D7] (§549–557) — decoupled `app-v*`/`corpus-v*` namespaces; per-corpus re-emit NFR25.
- [Source: architecture.md] §539–543 (release.yml job contract), §860–862 (gh-pages deploy pattern), §596–597 (footer `git describe` substitution).
- [Source: .github/workflows/release.yml] — current Epic-1 stub being replaced.
- [Source: tests/scaffold/ci-matrix.test.mjs#AC-6] — frozen class-A stub assertions to graduate (lines ~214–234).
- [Source: Makefile] — `build`, `build-methodology IQME_CORPUS_VERSION=…`, `test-byte-stable`.
- [Source: tools/build-methodology.mjs] — `IQME_CORPUS_VERSION` env + `git describe --match 'corpus-v*'` fallback.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
