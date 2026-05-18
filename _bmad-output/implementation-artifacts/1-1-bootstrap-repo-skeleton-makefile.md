# Story 1.1: Bootstrap repo skeleton + Makefile

Status: ready-for-dev

## Story

As a **solo-dev maintainer (CEP)**,
I want **the project's runtime-zero-build scaffolding to exist as a Makefile-driven repository**,
so that **every subsequent epic has a `make test` / `make lint` / `make build` target to wire into and no contributor needs to learn project-specific tooling conventions from scratch**.

## Acceptance Criteria

1. **AC-1 (`make help` enumerates documented targets):** Given the repository is at its first commit, when a developer runs `make help`, then the output lists `test`, `lint`, `build`, `build-methodology`, `dev`, `clean`, `snapshot-update` as documented targets, and each target's one-line description matches the convention to be codified in `docs/corpus-build-conventions.md` (Story 1.4 lands the conventions doc — for Story 1.1 the descriptions live in the Makefile and the doc cross-reference is a forward link).
2. **AC-2 (Empty-tree lint+test exits 0 with no missing-tool errors):** Given the repository is freshly cloned, when a developer runs `make lint && make test`, then both commands exit 0 against an empty source tree, and no errors related to missing tools or dependencies are emitted (`npx --yes` resolves dev-tools on demand per NFR33).
3. **AC-3 (Makefile is byte-identical-build-portable):** Given the deployment posture requires byte-identical mirror builds (NFR17), when the `Makefile` is inspected, then no absolute paths or environment-specific assumptions exist, and all referenced tools are documented in either `vendor/` (with SHA pin in `vendor/SHASUMS` — empty placeholder file is acceptable at Story 1.1) or invoked via `npx --yes`.

## Tasks / Subtasks

- [ ] **Task 1: Remove the prototype** (AC: enabling — prototype must be gone before scaffolding lands per architecture §Bootstrap Sequence)
  - [ ] 1.1 `git rm iq-me.html` (the single-file prototype at repo root). Verify removal with `git status`.
- [ ] **Task 2: Scaffold directory skeleton** (AC: 1, 2 — empty trees must exist so `make lint` / `make test` find nothing to fail on)
  - [ ] 2.1 Create `src/` subtrees: `src/assessment/`, `src/assessment/i18n/`, `src/scoring/irt/`, `src/css/components/`, `src/css/utilities/`, `src/items/`, `src/content/methodology/{en,ru,pl}/`, `src/content/i18n/{en,ru,pl}/`, `src/content/glossary/`, `src/content/trails/`, `src/content/crisis-resources/`, `src/content/diagrams/`. Each leaf gets a `.gitkeep` file (empty) so git tracks the directory.
  - [ ] 2.2 Create `tests/` subtrees: `tests/golden/`, `tests/playwright/`, `tests/a11y/`, `tests/perf/`, `tests/snapshots/methodology/`. Each leaf gets `.gitkeep`.
  - [ ] 2.3 Create `tools/`, `vendor/`, `corpus/`, `docs/`, `templates/`, `.github/workflows/` with `.gitkeep` files where the directory is empty at end-of-Story-1.1 (`docs/` already exists; do not overwrite).
  - [ ] 2.4 Touch `vendor/SHASUMS` as an empty file (placeholder for SHA-pinned vendored tools — AC-3 documents this slot).
- [ ] **Task 3: Author the `Makefile`** (AC: 1, 2, 3)
  - [ ] 3.1 Set `.DEFAULT_GOAL := help` so a bare `make` invocation prints the target list.
  - [ ] 3.2 Add `.PHONY:` declarations for every target (`help`, `test`, `lint`, `build`, `build-methodology`, `dev`, `clean`, `snapshot-update`).
  - [ ] 3.3 Implement `help` as an auto-generated target list parsed from `## <description>` comments adjacent to each target header (standard idiom: `grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST)`). Each target carries a one-line `## <description>` comment.
  - [ ] 3.4 Implement `test` to run `node --test tests/` (Node's built-in test runner — no dev-dep needed; NFR33). Against an empty `tests/` tree the runner must exit 0 (verify: `node --test tests/` on empty dir returns 0; if it returns non-zero on macOS/Linux empty-glob behavior, gate with `[ -n "$$(find tests -name '*.test.*' -print -quit)" ] || exit 0`).
  - [ ] 3.5 Implement `lint` as a no-op-on-empty-tree dispatcher. At Story 1.1 there are no lint scripts yet — the target must succeed with `@echo "lint: no rules registered yet (Stories 1.5, 1.6, 1.9 land lint scripts)"; exit 0`. Do not invoke ESLint here; Story 1.9 wires it.
  - [ ] 3.6 Implement `build` as an alias dispatching to `build-methodology` (architecture §Bootstrap: `make build` IS `make build-methodology` at v1; there is no separate compile step per NFR21 runtime-zero-build invariant).
  - [ ] 3.7 Implement `build-methodology` as a no-op-on-empty-corpus stub: `@echo "build-methodology: no corpus content to render (Epic 4 lands tools/build-methodology.mjs)"; exit 0`. Do not invoke a renderer; Epic 4 wires `tools/build-methodology.mjs`.
  - [ ] 3.8 Implement `dev` as a no-op stub at Story 1.1: `@echo "dev: live-reload harness not yet implemented (Epic 4 lands tools/dev-server.mjs)"; exit 0`. Forward-link only.
  - [ ] 3.9 Implement `clean` to `rm -rf dist/` (idempotent; `dist/` does not exist at end-of-Story-1.1).
  - [ ] 3.10 Implement `snapshot-update` as a no-op stub: `@echo "snapshot-update: no snapshots registered yet (Epic 4 lands tests/snapshots/methodology/)"; exit 0`.
  - [ ] 3.11 Add a top-of-file comment block: `# IQ-ME Makefile — runtime-zero-build invariant per NFR21/NFR33. All dev tools invoked via npx --yes or vendor/SHASUMS-pinned files. No absolute paths. See docs/corpus-build-conventions.md (Story 1.4) for target conventions.`
  - [ ] 3.12 Audit Makefile for absolute paths: `grep -nE '^/|=/' Makefile` must return nothing. Any path is relative (use `./`, `$(CURDIR)` only if strictly necessary — prefer bare relative).
- [ ] **Task 4: Verify ACs end-to-end** (AC: 1, 2, 3)
  - [ ] 4.1 Run `make help` from a clean checkout — output must list all seven targets with their descriptions; exit 0.
  - [ ] 4.2 Run `make lint && make test` — both must exit 0 with no "command not found" / "no such file" errors. Capture stderr; assert empty (or only contains the intentional `@echo` stubs from §3.5–3.10).
  - [ ] 4.3 Run `grep -nE '^[[:space:]]*/' Makefile` — output must be empty (no absolute paths used). Run `grep -nE '\$\$\{?HOME\}?|\$\$\{?USER\}?' Makefile` — output must be empty (no env-specific assumptions).
  - [ ] 4.4 Record file-list in `Dev Agent Record → File List` below.

## Dev Notes

### Architectural Context

This story is **Phase 0 — Bootstrap & Prototype Removal** per [architecture.md §Implementation Sequence](../planning-artifacts/architecture.md#L569) (line 569). It is sequenced *first*, before any other Epic 1 story, because every subsequent story (1.2–1.10 and Epics 2+) relies on the directory structure and Makefile targets existing.

**The runtime-zero-build invariant (NFR21):** the deployed JS tree must be byte-identical to the source JS tree. This Makefile must NOT introduce any compile/bundle/minify/transpile step for app code — the only "build" is `build-methodology` (CommonMark → static HTML at author time), which lands in Epic 4. At Story 1.1, `build-methodology` is a no-op stub.

**The no-runtime-deps invariant (NFR33):** zero npm packages in production. Dev tools are invoked via `npx --yes` (no install, fetched on demand) or vendored under `vendor/` with SHA pin in `vendor/SHASUMS`. A `package.json` is **optional** at Story 1.1 — do not create one unless a dev tool requires node-resolution. The Node-native `node --test` runner (used in §3.4) needs no install.

**Five-Domain Boundary Model:** the directory skeleton scaffolded in Task 2 reifies Winston's domain model from [architecture.md §1022](../planning-artifacts/architecture.md#L1022). Domain ownership:
- A — Assessment SPA → `src/assessment/`, `src/assessment/i18n/`, `src/css/components/`, `src/items/`
- B — Scoring Engine → `src/scoring/irt/`
- C — Methodology Corpus → `src/content/`, `corpus/`, `templates/`
- D — Tools → `tools/`, `.github/workflows/`, `Makefile`
- E — Test Fixtures → `tests/`

### Files to Touch (NEW; no UPDATE files at Story 1.1)

NEW:
- `Makefile` — author per Task 3
- `vendor/SHASUMS` — empty placeholder (Task 2.4)
- `.gitkeep` files under every leaf directory created in Task 2

REMOVED:
- `iq-me.html` — `git rm` per Task 1

UPDATE: none (no existing source code touched; `docs/` already exists from BMAD scaffolding but is not modified).

### Things That Must NOT Happen in Story 1.1

- **Do not** author `LICENSES.md`, `CITATION.cff`, `README.md`, `CONTRIBUTING.md`, `CODEOWNERS` — those are Story 1.2's deliverables. Touch-stubbing them here would create false-positive trust artifacts and contaminate Story 1.2's commit boundary.
- **Do not** commit `ICAR-CONFIRMATION.pdf` — Story 1.3.
- **Do not** create `corpus/schema.json` or `docs/corpus-build-conventions.md` content — Story 1.4. (The empty `corpus/` directory + `.gitkeep` is fine.)
- **Do not** create `BUDGETS.json` or `tools/lint-cognitive-load-budget.mjs` — Story 1.5.
- **Do not** create any `.github/workflows/*.yml` — Story 1.6. (The empty `.github/workflows/` directory + `.gitkeep` is fine.)
- **Do not** wire ESLint or `.eslintrc.json` — Story 1.9.
- **Do not** add real lint or test logic to Makefile targets — they are intentionally no-op stubs at Story 1.1; subsequent stories register hooks.
- **Do not** create `package.json` unless a dev tool genuinely requires it (Story 1.1 uses only `node --test` which is built-in).

### Testing Standards

- Story-level verification is the AC suite (Task 4). No unit tests required for a Makefile.
- The Makefile itself is the contract; assertions are shell commands (Tasks 4.1–4.3).
- Future stories (1.6) will add CI workflow YAML that runs `make help && make lint && make test` on every PR — this story's exit-0 guarantee is the precondition for that CI gate not failing on the empty-repo state.

### Cognitive-Load Budget Note (NFR32)

The Makefile is the project's primary discoverability surface for new contributors (`make help` is the front door). Keep total Makefile LOC under ~80 lines including the help comments. If it grows past that, the implementation is doing too much — likely accreting logic that belongs in a `tools/*.mjs` script that the Makefile *invokes*.

### Project Structure Notes

- Alignment with [architecture.md §Bootstrap Sequence](../planning-artifacts/architecture.md#L220) is exact — same directory list, same Makefile target set.
- Detected variance: architecture's bootstrap snippet `touch Makefile LICENSES.md CITATION.cff README.md CONTRIBUTING.md` bundles trust-artifact stubs with the directory scaffold. The PRD-shard split into Stories 1.1 vs 1.2 means **Story 1.1 only touches `Makefile`**; the four other root files are Story 1.2's commit. Rationale: clean review boundary per story; trust artifacts deserve their own diff for skeptic-audit (Tomáš journey).
- Detected variance: architecture lists `BUDGETS.json` and `ICAR-CONFIRMATION.pdf` at repo root in the master tree — those are Story 1.5 and 1.3 respectively. End-of-Story-1.1 root will not have them; that is correct per shard plan.
- Stray `{output_folder}/` directory exists at repo root (unexpanded BMAD template var artifact) — out of scope for Story 1.1; do not touch.

### References

- [epics.md §Story 1.1](../planning-artifacts/epics.md#L476) — story statement + 3 AC blocks (source for AC-1, AC-2, AC-3)
- [architecture.md §Bootstrap Sequence](../planning-artifacts/architecture.md#L220) — directory scaffold sequence
- [architecture.md §Five-Domain Boundary Model](../planning-artifacts/architecture.md#L1022) — domain ownership the skeleton reifies
- [architecture.md §Build Tooling](../planning-artifacts/architecture.md#L263) — Makefile target set + `npx --yes` / `vendor/` policy
- [architecture.md §Complete Project Directory Structure](../planning-artifacts/architecture.md#L1041) — canonical tree
- [prd.md §NFR21](../planning-artifacts/prd.md#L920) — runtime-zero-build invariant
- [prd.md §NFR33](../planning-artifacts/prd.md#L940) — no external runtime dependencies
- [prd.md §NFR17](../planning-artifacts/prd.md#L) — byte-identical mirror build constraint (AC-3)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

### File List
