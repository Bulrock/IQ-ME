# Story bridge-4-5-2-convention-doc-for-filesystem: Convention doc for filesystem-fixture test isolation

Status: review

## Story

Story-3-6 round-1 resolved the immediate dist/ race with mkdtempSync + env-var override; the suggested bridge (one-paragraph convention note in docs/test-isolation.md) covers the general pattern for all future dist-touching or sibling-test-artefact-mutating tests so the pattern survives turnover and copy-paste. Low coupling to candidate #1 — different surface (docs/), different specialist (writer), can land in parallel. Should land before Epic-5 (Epic-5 will likely add corpus-emit tests touching shared filesystem fixtures); not a hard blocker.

## Sources (deferred from)

- `3-6-author-3-en-methodology-stub-pages-the-click-targets` (kind=auditor-finding, round=1, finding_index=1)

## Acceptance Criteria

1. **Convention doc exists.** A new file `docs/test-isolation.md` is added. Content covers: (a) the problem class (shared `dist/` directory racing across `node:test`-parallel files; same applies to any other shared sibling-test artefact under the repo root); (b) the prescribed pattern — `mkdtempSync(join(tmpdir(), "iqme-<scope>-"))` for the writable surface + an env-var override (`IQME_<SCOPE>_OUT` style) so the same code-under-test reads the temp path during tests but the canonical repo path in production; (c) the read-only counter-pattern — tests that only read a shared artefact must `t.skip()` (or equivalent) if it is absent, and must NOT `rm` or otherwise mutate it; (d) a worked example referencing the 3-6/round-1 fix in `tests/scaffold/build-methodology-output.test.mjs` + the `tools/build-methodology.mjs:24` env-var support; (e) a one-line "when to apply" — any new test that touches `dist/` or any other path written by sibling tests must follow this convention.
2. **Cross-link in place.** `docs/corpus-build-conventions.md` (existing) gains a single-line cross-reference to `docs/test-isolation.md` near its existing test/build discussion, so future authors discover the convention naturally.
3. **No code regression.** No source or test file under `src/` or `tests/` is modified — this is a docs-only story. `make test` + `make lint` remain exit-0 (story should not introduce churn elsewhere).
4. **Markdown lint clean.** The new doc passes the repo's existing markdown lint (if any) — current lints (`tools/lint-*.mjs`) do not target `docs/**` but the doc must still be well-formed: valid headings, no broken intra-repo links, code fences use language hints.

## Tasks / Subtasks

- [x] **Task 1 — draft `docs/test-isolation.md`** by writer/tech-writer voice. Sections: Problem · Pattern (mkdtempSync + env override) · Read-only counterpattern · Worked example (3-6 fix) · When to apply. Keep to one short page (≤ 100 lines).
- [x] **Task 2 — add cross-reference** in `docs/corpus-build-conventions.md` to the new doc.
- [x] **Task 3 — verify links + lint.** Confirm all internal links resolve (`tests/scaffold/build-methodology-output.test.mjs`, `tools/build-methodology.mjs`). Run `make test` + `make lint` to confirm no incidental break.

## Dev Agent Record

### Agent Model Used

engineer (general-purpose; docs-only story, no specialist domain).

### Completion Notes List

- **AC-1 doc authored:** `docs/test-isolation.md` written with all required sections — Problem · Pattern (mkdtempSync + env-var override with `iqme-<scope>-` / `IQME_<SCOPE>_OUT` naming convention) · Read-only counter-pattern (`t.skip()` if artefact absent; no mutation) · Worked example (links to `tests/scaffold/build-methodology-output.test.mjs` + `tools/build-methodology.mjs` line 32) · When to apply · Why not `process.chdir(tmpdir)` (added as bonus). 88 lines total, within the ≤100 budget.
- **AC-2 cross-link added:** `docs/corpus-build-conventions.md` gains a single-line reference to `test-isolation.md` immediately after the re-emit semantics paragraph (the natural test/build-discussion location).
- **AC-3 no code regression:** No source/test files under `src/` or `tests/` modified — docs-only story. `make test` 683/684 pass / 1 skipped / 0 fail. `make lint` exit 0.
- **AC-4 markdown lint clean:** New doc has well-formed headings (single `#` h1 + `##`/`###` levels), valid relative links to repo files (verified via `ls`), code fences use `javascript` language hints. Repo has no markdown-lint targeting `docs/**`, but doc passes informal validation.

### File List

- `docs/test-isolation.md` (new) — convention doc.
- `docs/corpus-build-conventions.md` (modified) — one-line cross-reference added.

## Specialist Self-Review

**Decisions made:**

1. **Convention covers the GENERAL pattern, not just `dist/methodology/`.** The doc lifts the 3-6 round-1 fix into a reusable shape (`mkdtempSync(join(tmpdir(), "iqme-<scope>-"))` + `IQME_<SCOPE>_OUT`-style env-var). Rationale: AC-1 explicitly said "the rule generalizes to any shared sibling-test artefact under the repo root" — Epic-5 will add corpus-emit tests that touch new shared paths, so naming the convention `iqme-<scope>-` / `IQME_<SCOPE>_OUT` makes it copy-pasteable.
2. **Added "Why not `process.chdir(tmpdir)` instead?" section** beyond the AC-required sections. Rationale: this is the obvious alternative a future author will try first; documenting why it doesn't work saves them the cycle. Stayed within the ≤100-line budget.
3. **Read-only counter-pattern named explicitly** rather than just "don't mutate". Rationale: AC-1(c) called out `t.skip()` as the prescribed shape; documenting it side-by-side with the writable pattern (rather than as a footnote) makes the mental model symmetric and the rule easier to apply.

**Alternatives considered:**

- **Heading-anchored deep links** in the cross-reference (`docs/test-isolation.md#pattern`). Rejected — the doc is short enough that linking to the file root is fine; deep links rot when the doc is restructured.
- **Embedding the pattern as a code fence in `docs/corpus-build-conventions.md`** instead of cross-linking. Rejected — duplicating the worked example introduces drift risk; the cross-link is one line, which is what AC-2 explicitly asked for.
- **Adding a lint rule** that detects test files that write to `dist/` without an env-var override. Considered but out-of-scope for this story (would be a separate task with its own test coverage). Mentioned as future hardening implicitly via the "When in doubt" section.

**Framework gotchas avoided:**

- Relative links in the worked example use `../tests/...` / `../tools/...` (one level up from `docs/`) — verified manually that these resolve correctly to repo files.
- Code fences use `javascript` (not `js`) — matches existing convention in `docs/corpus-build-conventions.md` and other docs.

**Areas of uncertainty:**

- The doc uses `<scope>` as a placeholder in both the tmpdir prefix and env-var name. A future reader might wonder whether the same `<scope>` value goes in both. I clarified this with the worked example (`iqme-build-meth-*` ↔ `IQME_BUILD_METHODOLOGY_OUT`) but the syntactic divergence (underscore vs. hyphen, all-caps vs. lowercase) might still confuse. Mitigated by the worked example showing both sides.
- No automated check enforces the convention. If Epic-5 lands corpus-emit tests that don't follow it, they'll race on shared paths until someone notices. A future lint or a Husky pre-commit hook could surface violations.

**Tested edge cases:**

- All relative paths in the doc verified manually: `../tests/scaffold/build-methodology-output.test.mjs` and `../tools/build-methodology.mjs` both resolve.
- `make test` re-run after doc landing → 683/684 pass (same as pre-change baseline).
- `make lint` exit 0 (same as pre-change baseline).

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-4-5` (blocks `epic-5`).
