# Runbooks (RB-06..RB-10)

> Source-of-truth для recovery операций после halt-not-rollback.
> Структура каждого runbook'а — Triage / Containment / Recovery / Postmortem
> ([Nobl9 / Rootly mainstream](https://nobl9.com/blog/runbook-template-best-practices/)).
>
> Severity: SEV1 (production-down) | SEV2 (degraded) | SEV3 (workaround exists) | SEV4 (cosmetic).

| Runbook | Trigger (exit code) | Severity | Status | Owner skill |
|---------|---------------------|----------|--------|-------------|
| [RB-06](./RB-06-doctor-bundle.md) | exit 26 (reconcile drift, generic / Class B) | SEV2 | active | bmad-tds-setup |
| [RB-08](./RB-08-install-halt.md) | exit 41 (payload integrity) | SEV1 | **design-reserved** — exit 41 не emit'ится в текущей реализации | bmad-tds-setup |
| [RB-09](./RB-09-integrity-drift.md) | exit 26 (Class A primary state drift) | SEV1 | active | (CLI core) |
| [RB-10](./RB-10-migration-recovery.md) | exit 44/45 (schema migration) | SEV1 | **placeholder** — migration framework не реализован | bmad-tds-setup (upgrade, future) |

## RB-06 vs RB-09 disambiguation

Оба runbook'а triggered одним и тем же exit 26, и в обоих случаях source —
`tds integrity verify` (или `tds archive verify` для RB-06 archive case).
Различение делается по `failedEntries[].path` value:

```
tds integrity verify --json | jq '.failedEntries[].path'
```

**В RB-09**, если хотя бы один path попадает в Class A primary set:

- `_bmad/bmm/sprint-status.yaml`
- `<output>/_tds/branch-registry.yaml`
- `<impl_artifacts>/stories/**/*.md` (по умолчанию `_bmad-output/implementation-artifacts/stories/`)
- `<output>/_tds/memory/lessons.yaml`

**В RB-06**, если drift только в Class B / archive bundle / `_bmad/tds/` payload, или
это stale halt.json edge case без actual sha mismatch.

> **Реальный shape `failedEntries[]`** — `{path, expectedSha256, actualSha256, recordedAt}`.
> Поля `class` в JSON-выводе `verify` нет — раздели́тель только по path-pattern.
> `ARTEFACT_CLASSES` enum в TypeScript registry — `["A", "B"]`; «Class I/II/III»
> терминология иногда встречается в spec text как design-time категории, но в коде
> их нет.

## TDS-ERR symbols vs runtime stderr

Spec `_docs/spec/registry/error-codes.yaml` декларирует canonical symbols
(`TDS-ERR:RECONCILE_TOCTOU`, `TDS-ERR:INTEGRITY_DRIFT`, `TDS-ERR:PAYLOAD_INTEGRITY_FAILED`,
etc.) для каждого exit code. **Runtime эти symbols прямо в stderr сегодня не печатает** —
вы увидите exit code + конкретное human-readable сообщение (e.g.
`"verified=12 failed=1\n"` от `tds integrity verify`, или
`"recover requires a non-empty reason (audit field; RB-09 procedure)\n"`
от `tds integrity recover`). Symbols в Trigger frontmatter указаны как
design-time mapping для cross-reference со spec, не как ожидаемая stderr-строка.

## Sync с runtime

Runbook'и упоминаются в production коде через pointer'ы — **их перенос
ломает UX SEV1 случаев** (после `bmad install` user получает их локально
и открывает прямо при exit с pointer'ом):

- `src/preflight/check.ts` — exit 3 «python3 ≥ 3.10 + ruamel.yaml ≥ 0.18 (ADR-0010, RB-08)»
- `src/integrity/index.ts` — recover guard «recover requires reason (RB-09 procedure)»
- `payload/workflows/bmad-tds-setup/SKILL.md` — Step 2 design-reserved exit 41 (PAYLOAD_INTEGRITY_FAILED) с явной маркировкой статуса; failure modes в Step'ах 1-4 переведены на наблюдаемые сегодня exit codes (3/5/12) с указанием design-reserved symbols.
- `payload/role-skills/bmad-tds-auditor/SKILL.md` — verdict «integrity record missing → RB-09»

При добавлении новых exit codes / pointer'ов — добавляйте/обновляйте
соответствующий runbook одновременно (поиск: `grep -rn "RB-0[6-9]\|RB-10"
src/ payload/`).

> **RB-07 (snapshot-corrupt) выпилен 2026-05-05** вместе с
> `runtime/snapshots/` каталогом — фича никогда не была реализована;
> backup-recovery в TDS закрывается комбинацией git-checkpoints +
> `tds archive create` (snapshot фактически дублировал archive).
> `_docs/spec/registry/error-codes.yaml` всё ещё ссылается на RB-07
> в recovery-string'е exit 27 (`AUXILIARY_ARTEFACT_CORRUPT`) —
> известное расхождение, фиксится отдельно вместе с rev'ом snapshot
> spec-section'ов.
