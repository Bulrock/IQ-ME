# Story completion notes template

> Diátaxis: brief **Reference** (chronological per-story record).
> Audience: future retro analyst (auditor) + future maintainer.
> Field: `story.frontmatter.tds.completion_notes` — single field в YAML frontmatter.
> Length: 50-200 words.

---

## Format

```yaml
---
# BMAD-native fields above (id, title, status, etc.)

tds:
  schema_version: "1.0"
  # other tds fields...
  completion_notes: |
    <prose summary>
---
```

---

## Content structure

Brief prose covering:

1. **What was implemented** (1-2 sentences).
2. **Key decisions** (если applicable — лесят значимые trade-offs).
3. **Lessons applied** (if relevant memory was injected — confirm application).
4. **Deferred items** (future improvements identified, NOT done в этой story).
5. **Notes для retro** (anything worth bringing up на retrospective).

---

## Examples

```yaml
tds:
  completion_notes: |
    Implemented login form (LoginView + LoginViewModel + tests).
    
    Used @Observable + @MainActor pattern (iOS 17+). Did not extract LoginField as
    reusable component (single-use; Karpathy #2). Auditor suggested extracting
    in next story if 2nd login-like screen emerges.
    
    Applied lesson-2026-04-15-008 (Keychain SecAccessControl proper) — token
    storage uses biometric requirement.
    
    Deferred: animated transitions (out of AC scope; would benefit from new story).
    
    For retro: Combine could be replaced with async/await throughout — pattern
    persists в legacy modules; potential tech-debt bridge candidate.
```

```yaml
tds:
  completion_notes: |
    Migrated state-manifest.yaml writer from raw yaml package to ruamel.yaml
    round-trip (BMAD-compatibility — preserves user comments + STATUS DEFINITIONS).
    
    All 12 existing tests pass. Coverage at 96% (was 91% — improvement from added
    edge case tests).
    
    Lesson-relevant: lesson-2026-04-20-002 (YAML round-trip pitfalls) — applied;
    flow style preserved.
    
    Deferred: consider extracting yaml-write helper into shared module if other
    YAML writers added.
```

```yaml
tds:
  completion_notes: |
    Added pre-commit hook config (.husky/pre-commit + package.json prepare script).
    
    4 AC items addressed; 4 tests pass.
    
    Idempotent per lesson-2026-04-15-003 — re-running install is safe.
    
    Nothing deferred.
```

---

## Notes for writer

### Karpathy applied

- **#2 Simplicity First:** ≤200 words. Don't pad. If story trivial — 50 words OK.
- **#3 Surgical Changes:** when writing notes — don't editorialize. State facts.
- **#4 Goal-Driven:** retro analyst (auditor) on next sprint должен find этой entry actionable. Lessons / deferred items / retro flags — concrete.

### What to AVOID

- ❌ «Successfully completed all tasks.» (no info)
- ❌ «Implementation went smoothly.» (boilerplate)
- ❌ Marketing-speak: «Built a robust solution».
- ❌ Detailed code excerpts — those are в diff. Notes summarize.
- ❌ Long paragraphs — keep 2-3 sentences per topic.

### What HELPS retro analysis

- **Decisions**: «chose X over Y because of Z» — captures rationale that diff doesn't show.
- **Deferred items**: «didn't do X (would need new story)» — tracks tech-debt candidates.
- **Lessons applied**: confirms auto-injected lessons were useful, OR notes if they were irrelevant.
- **Surprises**: «discovered that <library> has gotcha — see how-to для workaround» — flags для doc updates.

### Updates / freezes

- Notes written by engineer / domain role-skill at story completion (Step 5 Verify в SKILL.md Process) через `tds story update --completion-note=<text>`.
- Auditor может suggest amendments через `tds story add-finding` (writeback в `## Auditor Findings (round-N)` секцию); engineer applies fixes в rework cycle.
- After `tds story update --status=review` (specialist hand-off), `--status=approved` (auditor verdict через apply-verdict), или `--status=done` (engineer post-delivery) — completion-note entries в `### Completion Notes List` становятся частью integrity-tracked spec'а (sha256 в state-manifest).
- Post-`done` modifications: re-open через `tds story reset --to=halted --as=auditor` + halt-recovery `halted → ready-for-dev` (rare, audit-trail-noted). Отдельной `tds story reopen` команды нет — `STORY_SUBCOMMANDS = ["update","status","add-finding","add-findings"]`.

### Auditor использование

В retro mode (bmad-tds-auditor `mode=retro`) — auditor reads completion_notes для всех stories scope. Looking for:

- Patterns in deferred items → bridging epic candidates.
- Lessons applied / not-applied → memory hit-rate.
- Decisions → architecture patterns emerging.
- Surprises → doc-drift candidates.

Этот поле critical to retro quality. Karpathy #4: completion_notes должно быть verifiable (linked к code artifacts) и actionable.
