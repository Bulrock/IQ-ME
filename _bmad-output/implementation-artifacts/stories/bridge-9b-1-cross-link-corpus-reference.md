---
id: bridge-9b-1-cross-link-corpus-reference
title: "Story bridge-9b-1-cross-link-corpus-reference: Cross-link corpus /reference/changelog/ to root CHANGELOG.md"
status: done
---

# Story bridge-9b-1-cross-link-corpus-reference: Cross-link corpus /reference/changelog/ to root CHANGELOG.md

## Story

Story 8-7 deferred (Task 3, marked [-]) the note + relative link from the en corpus reference/changelog/ page to the root CHANGELOG.md because it forces a golden-snapshot regen and risks the external-link-policy lint + byte-stable build for optional non-test-gated polish. The two changelogs are documented as distinct (root=dev/release, corpus=citation). Do it in a controlled corpus-edit story that owns the golden-snapshot regen + the external-link-policy and byte-stable consequences end to end.

## Sources (deferred from)

- `8-7-changelog-md-format-release-yml-automation-contributor-credit-by-handle` (kind=auditor-finding, round=1, finding_index=1)

## Acceptance Criteria

1. The en corpus changelog page (`src/content/methodology/en/reference/changelog/index.md`) carries a short note distinguishing the two changelogs (corpus page = citation/version history; root `CHANGELOG.md` = dev/release log) plus a **relative** link to the root `CHANGELOG.md`. No absolute or external URL is used — the link is repo-relative so the external-link/link-policy lint stays green.
2. A structural test asserts the corpus changelog page contains both the distinguishing note and the relative link to root `CHANGELOG.md`, so the cross-reference cannot silently regress (this is the gap Story 8-7 deferred — Task 3 marked `[-]` — for lack of a controlled owner).
3. The golden HTML snapshot for that page (`tests/snapshots/methodology/en/reference/changelog/index.html`) is regenerated via `tools/snapshot-update.mjs` (`make snapshot-update`) and committed; the byte-stable build spec passes (`make test-byte-stable` — two `make clean && make build` runs produce identical `dist/` hashes).
4. Full test suite green, `make lint` exit 0, `make build` exit 0 — no other corpus page, snapshot, or lint regresses as a side-effect of the corpus edit.

## Tasks / Subtasks

- [x] **Task 1: write the failing structural test** (extend/add under `tests/scaffold/`) asserting the en `/reference/changelog/` page contains the two-changelog distinguishing note + a relative link to root `CHANGELOG.md` (AC 2). Confirm it fails against the current page. (test-author phase)
- [x] **Task 2: edit the en corpus changelog page** (`src/content/methodology/en/reference/changelog/index.md`): add the minimal note + relative link, keeping wording tight so frontmatter / reading-level / glossary lints stay green (AC 1). (impl phase)
- [x] **Task 3: regenerate the golden snapshot** via `make snapshot-update` (`node tools/snapshot-update.mjs`) and commit `tests/snapshots/methodology/en/reference/changelog/index.html` (AC 3). (impl phase)
- [x] **Task 4: integration/regression verification** — `make test-byte-stable`, `make lint`, `make build`, and the full suite all green; confirm the link-policy lint accepts the relative link and no sibling snapshot drifted (AC 3, AC 4). (integration phase)

## Dev Notes

### Carry-forward lessons

- lesson-2026-05-20-007 (high): stories touching a class-A frozen test must carry this section AND re-register integrity for the touched test. Apply: the new `tests/scaffold/bridge-9b-1-corpus-changelog-crosslink.test.mjs` is integrity-recorded as test-author; this section is populated from `tds memory query`.
- lesson-2026-06-03-002 (high): verify regression provenance with a baseline diff before labeling a failure pre-existing-vs-introduced. Apply: the structural test was confirmed RED against the unedited EN page (direct run) before the impl edit turned it GREEN — provenance observed, not assumed.
- lesson-2026-05-19-013 (high): direct YAML edits to `_tds/state-manifest.yaml` can be silently re-recorded by the next sweep. Apply: integrity/state were mutated only through `tds integrity record` / `tds story update`, never by hand-editing manifest YAML.
- lesson-2026-06-03-001 (high): `pr-checks.yml` wires tests per-job, not via a greedy glob. Apply (verified non-applicable): the new test lives under `tests/scaffold/**`, which `make test` globs directly (`node --test 'tests/scaffold/**/*.test.mjs'`), so no per-spec CI job is required.

### Cross-language parity note

Editing the EN changelog body invalidates the `sourceHashEN` parity invariant (NFR27) for the PL/RU mirrors. The PL/RU `reference/changelog/` pages are EN-text dev-phase stubs (`translationStatus: in-progress`, reviewer TBD); the same structural note + relative link were mirrored into them and each `sourceHashEN` bumped to the new EN body hash so `lint-translation-parity` stays green. This is reference/structural prose, not clinical-register tail-scene content (the latter remains gated on Gate-9c/9d).

## Dev Agent Record

### Completion Notes List

- EN corpus changelog cross-linked to root CHANGELOG.md (repo-relative); note+link mirrored into PL/RU EN-stubs with sourceHashEN bumped to keep NFR27 parity green; snapshots regen; carry-forward sections backfilled on both 9b specs (lint-spec-carry-forward gate). All green: lint 0, build 0, byte-stable pass, scaffold 559/559.

### File List

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-9b` (blocks `epic-9b`).
- tests/scaffold/bridge-9b-1-corpus-changelog-crosslink.test.mjs
- src/content/methodology/en/reference/changelog/index.md
- src/content/methodology/pl/reference/changelog/index.md
- src/content/methodology/ru/reference/changelog/index.md
- tests/snapshots/methodology/en/reference/changelog/index.html
- tests/snapshots/methodology/pl/reference/changelog/index.html
- tests/snapshots/methodology/ru/reference/changelog/index.html

## Specialist Self-Review

**Decisions made:**
- Repo-relative link depth `../../../../../../CHANGELOG.md` (6 levels) from `src/content/methodology/en/reference/changelog/index.md` to repo root, satisfying AC1's "no absolute/external URL" so `lint-csp-source`/link handling stays green. `markdown-subset.mjs` renders inline `[text](url)` links verbatim, so the relative target round-trips cleanly into the golden HTML.
- Mirrored the identical note + link into the PL/RU `reference/changelog/` pages and bumped each `sourceHashEN` to the new EN body hash (`239a0d1…`). Rationale below.

**Alternatives considered:**
- Hash-bump PL/RU `sourceHashEN` *without* mirroring the note: rejected — it would make `lint-translation-parity` green while leaving the PL/RU bodies missing content the EN body has, violating the NFR27 measurement-equivalence invariant in spirit (the lint checks the hash, but the intent is body-equivalence).
- Leaving PL/RU untouched: rejected — editing the EN body deterministically breaks `lint-translation-parity` (verified: 2 BREACH lines), which fails AC4 (`make lint` exit 0).

**Framework gotchas avoided:**
- The PL/RU `reference/changelog/` pages are EN-text dev-phase stubs (`translationStatus: in-progress`, reviewer `@TBD-*-reviewer`), not real translations. Mirroring EN verbatim is consistent with their current state and does NOT constitute clinical-register translation work (which remains gated on Gate-9c/9d). This note is structural/reference prose, not tail-scene clinical content.
- `sourceHashEN` is `sha256(body-after-frontmatter)` per `lint-translation-parity.mjs` `pageBody()`; computed with the same algorithm rather than guessed.

**Areas of uncertainty:**
- Whether mirroring the cross-link note into the PL/RU stubs is desired now vs deferring until those pages are properly translated. I chose to mirror because (a) AC4 mandates lint-green and (b) the stubs already mirror EN verbatim. An auditor may prefer a different parity-resolution policy.
- The two bridge-9b story specs were missing the mandatory `### Carry-forward lessons` section (a known bridge-from-retros stub gap, lesson-2026-05-20-007). I backfilled BOTH (9b-1 fully; 9b-2 with its memory-query hits) because `lint-spec-carry-forward` is repo-global and gates AC4. 9b-2's section will be the one it carries when executed next.

**Tested edge cases:**
- `tests/scaffold/bridge-9b-1-corpus-changelog-crosslink.test.mjs`: asserts (1) a repo-relative `../…/CHANGELOG.md` link is present AND no absolute/external `//…CHANGELOG.md` form exists; (2) the note references the root CHANGELOG, frames it as the dev/release log, and frames this page as the citation history. Frontmatter is stripped before assertion. Confirmed RED against the unedited EN page, GREEN after the edit.
- Provenance verified by direct test run on the pre-edit page (lesson-2026-06-03-002), not assumed.
- Full regression: `make lint` exit 0, `make build` exit 0, `make test-byte-stable` pass (byte-identical dist), scaffold suite 559/559 pass.

## Auditor Findings (round-1)

### [info] The `tds epic create-bridge-from-retros` stub generator again emitted both 9b story specs without the mandatory `### Carry-forward lessons` section, which `lint-spec-carry-forward` gates repo-globally (AC4). The specialist manually backfilled both specs (9b-1 fully, 9b-2 with its memory-query hits) to clear lint. This is a recurring stub gap observed across prior bridge epics (bridge-7-8, bridge-9a) — the manual backfill is correct but the generator should emit the section itself so each bridge epic does not re-pay the cost. Non-blocking; no functional impact on the shipped corpus cross-link or README fix.

- **Category:** workflow-tooling
- **Suggested bridge:** `Harden `create-bridge-from-retros` stub emission to include the `### Carry-forward lessons` section (populated from `tds memory query`) and bold `**Task N:**` markers, closing the recurring lint-spec-carry-forward backfill loop.`
