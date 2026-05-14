# PR / MR description template

> Diátaxis: brief **Explanation** + **Reference** (links).
> Audience: code reviewer (Persona 2 / 4 — existing dev / maintainer).
> Used by `tds pr create` для PR/MR body.
> Length: 200-500 words.

---

```markdown
## Summary

(1-3 sentences: what changes, why. Link to story.)

Implements story `<story-id>` — <brief story description>.

## Changes

- (Bullet list of significant changes)
- (Map к acceptance criteria)
- (Reference files where most action happens)

## Acceptance Criteria

| AC | Status | Verified by |
|----|--------|-------------|
| AC#1: <description> | ✅ | tests/some_test.py::test_ac1 |
| AC#2: <description> | ✅ | tests/some_test.py::test_ac2 |
| AC#3: <description> | ✅ | manual smoke (see comments) |
| AC#4: <description> | ✅ | tests/integration/... |

## File list

- `path/to/changed/file.ts` — <one-line what changed>
- `path/to/another/file.test.ts` — <one-line>
- (Should match story.frontmatter.tds.file_list[])

## Lessons applied (if any)

- `lesson-YYYY-MM-DD-NNN` — <how applied>

## Tests

- New tests: <count>.
- Coverage: <%> (was <%>).
- All existing tests pass.

## Migration / breaking changes

(Если applicable — describe migration steps OR write «No breaking changes».)

## Reviewer guidance

What to focus on:
- <specific area>
- <specific concern>

Out of scope (intentionally NOT в этом PR):
- <future work item>

## Linked

- Story: `<story-id>` (link к sprint-status entry если public).
- Issues: closes #N, refs #M.
- ADRs: ADR-XXX (если applicable).
```

---

## Notes for writer / orchestrator

### Auto-population

`tds pr create --story=<id>` orchestrator generates body using этот template; writer's role — review / refine output.

Auto-populated fields:
- Summary (from story.title + completion_notes).
- AC table (from story.frontmatter.acceptance_criteria + auditor verdict).
- File list (from story.frontmatter.tds.file_list).
- Lessons applied (from memory query results captured during story).
- Tests count (from CI output).

Writer review: check tone, fix any auto-population gaps, add reviewer guidance section.

### Karpathy applied

- **#2 Simplicity:** PR body should fit on one screen (≤500 words). Reviewer scrolls otherwise — Karpathy #1 violation by writer.
- **#3 Surgical:** don't oversell PR («This greatly improves...»). State changes plainly.
- **#4 Goal-Driven:** «Reviewer can decide approve / request changes within 5 minutes of reading description.»

### Reviewer guidance section is gold

Tells reviewer where to focus. Without — reviewer has to discover focus areas, takes longer, might miss point.

Examples:
- ✅ «Focus on `tds_authz.ts:42-120` — new role check логика. Edge cases tested на mod в test_authz.»
- ✅ «Out of scope: refactoring legacy `oldAuth.ts` — separate story planned (SP-50).»
- ❌ «Look at everything carefully.» (useless)

### Common pitfalls

- ❌ PR body that's just commit message dump.
- ❌ «See linked issue» without context — reviewer must hop to read.
- ❌ Marketing speak («This rocking new feature...»).
- ❌ AC table missing — reviewer can't check completeness.
- ❌ File list out of sync с actual diff — auditor will catch (Karpathy #3 scope creep finding).

### Variants

- **Squash merge target (story → epic_branch):** typically auto-merge без human review (within team trust). Body может be brief.
- **Final epic squash (epic_branch → main):** epic-level review; body should aggregate epic summary, NOT just last story.
- **Hotfix:** add «Severity» upfront; reduce ceremony.

### Stakeholder release notes

PR description ≠ user-facing release notes. After merge, separate update к CHANGELOG (or RELEASE_NOTES) — that's writer's separate task (typically через `bmad-tds-generate-docs` workflow).
