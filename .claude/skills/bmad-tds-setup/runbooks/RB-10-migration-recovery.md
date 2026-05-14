# RB-10: migration-recovery (schema migration failure)

- **Trigger (reserved):** exit 44 — symbols `TDS-ERR:MIGRATION_MISSING | MIGRATION_VERSION_GAP | MIGRATION_SCHEMA_INCOMPATIBLE | DOWNGRADE_BLOCKED`; exit 45 — `TDS-ERR:MIGRATION_HALT_PARTIAL` (см. `_docs/spec/registry/error-codes.yaml`)
- **Severity:** SEV1 (схема в неконсистентном state; runtime могут читать partially migrated data)
- **MTTR target:** ≤ 2 часа

> ## ⚠️ STATUS: not-yet-implemented (placeholder runbook)
>
> **Schema migration framework НЕ реализован в текущей версии модуля.**
> Exit codes 44/45 зарезервированы в `EXIT` enum (`src/registry/error-codes.ts`)
> и в `_docs/spec/registry/error-codes.yaml`, но никем сейчас не emit'ятся.
> Соответственно отсутствуют:
>
> - `tds migrate` subcommand (и `ci-check`, `--resume-from=<step>` flags)
> - `tds setup upgrade` subcommand
> - `tds doctor halt-active-stories` subcommand
> - каталог `_bmad/tds/shared/migrations/` (migration scripts)
> - каталог `<output>/_tds/.migration-backup/` (auto-backup перед migration)
> - field `tds_runtime` в `module.yaml` (version pin)
> - setting `migration_backup_keep_count`
>
> Этот runbook — **design intent для будущего Wave**. Если вы попали
> сюда из live error pointer'a — это bug (никакая команда сейчас не
> emit'ит exit 44/45). Откройте issue с собранным `tds integrity
> verify --json` + `tds doctor diagnose --json` outputs.
>
> Дальнейший текст сохранён как specification draft. Не выполнять как
> recovery procedure пока migration framework не land'нул.

## Triage (10 минут) — *draft*

1. **Identify failed step:**
   ```
   tds migrate ci-check --json > /tmp/tds-migrate.json
   jq '.failed_step' /tmp/tds-migrate.json
   ```
2. **Classify error:**
   - exit 44 (single step failed) ⇒ specific migration script crashed
   - exit 45 (chain invalid) ⇒ schema_version в state-manifest имеет gaps; cannot determine valid migration path
3. Check `<output>/_tds/.migration-backup/` — auto-backup перед migration?

## Containment — *draft*

1. **STOP** — не run `tds setup upgrade` снова до диагностики.
2. **Halt all in-flight stories.**
   ```
   tds doctor halt-active-stories --reason="schema-migration-recovery"
   ```
3. **Snapshot:**
   ```
   tar czf /tmp/tds-pre-migrate-recovery-$(date +%Y%m%dT%H%M%SZ).tar.gz \
     <output>/_tds/state-manifest.yaml \
     <output>/_tds/branch-registry.yaml \
     <output>/_tds/.migration-backup/
   ```

## Recovery — *draft*

### Path A: Single step failed (exit 44)

1. Inspect failed migration script log:
   ```
   cat <output>/_tds/runtime/halt.json | jq '.migration_log'
   ```
2. **Common causes:**
   - YAML parse error в input → fix manually + resume
   - Missing required field → check upgrade source vs target schema
   - Permission error → fix file permissions + resume
3. **Fix and resume:**
   ```
   tds migrate --resume-from=<step>
   ```
4. После успешного resume — `tds integrity verify`.

### Path B: Chain invalid (exit 45)

1. **Determine current schema_version:**
   ```
   yq '.schema_version' <output>/_tds/state-manifest.yaml
   ```
2. **Inspect available migration scripts:**
   ```
   ls _bmad/tds/shared/migrations/
   # 1.0-to-1.1.js  1.1-to-1.2.js  1.2-to-2.0.js  ...
   ```
3. **Если schema_version из gap (e.g., 1.5 а есть только 1.0→1.1, 1.1→1.2)** — это указывает на manual edit или corrupted state. Восстановить из backup:
   ```
   cp <output>/_tds/.migration-backup/state-manifest.yaml.<ts> \
      <output>/_tds/state-manifest.yaml
   ```
4. Re-run upgrade с verified starting point:
   ```
   tds setup upgrade
   ```

### Path C: Migration script bug (rare)

1. Если migration crashes consistently на same input — это bug в TDS migration script.
2. **Workaround:**
   - Pin TDS version к pre-bug version в `module.yaml.tds_runtime`.
   - File issue к maintainer.
3. Не accept'ить partial migration без maintainer guidance.

## Verification — *draft*

```
tds migrate ci-check --json | jq '.status'    # = "ok"?
tds integrity verify                          # exit 0?
tds preflight check --action=story-execute    # exit 0?
```

## Postmortem — *draft*

1. **Root cause analysis** — why migration failed:
   - Input data invalid → tighten validation в migration script (TDS source change).
   - Timing race → add lock around migration.
   - Insufficient backup retention → tune `migration_backup_keep_count` в setup customize.toml.
2. Add lesson:
   ```
   tds memory add --category=integrity --severity=high \
     --summary="Schema migration X→Y failed" \
     --lesson="<root cause + remediation, 2-5 sentences>" \
     --story-refs="<refs>" --during-retro=<retro-id>
   ```
3. **Verify backup retention** — `<output>/_tds/.migration-backup/` должен иметь last 3-5 backups (configurable).
4. **Update spec** если migration framework gap discovered (см. §14 schema migration framework).

## Связанные ADR / spec

- §14 Schema migration framework (design)
- §12 Integrity registry (sha256 verify post-migration)
- ADR-0006 halt-not-rollback (migration не rollback'ится автоматически)
- error-codes.yaml entries 44, 45
