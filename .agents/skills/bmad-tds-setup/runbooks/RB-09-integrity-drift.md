# RB-09: integrity-drift (Class A primary state)

- **Trigger:** exit 26 от `tds integrity verify`, причём хотя бы один `failedEntries[].path` совпадает с Class A primary state pattern (см. routing ниже)
- **Severity:** SEV1 (state suspect; не безопасно продолжать)
- **Symptom:** integrity registry sha256 record не совпадает с фактическим sha256 файла, и этот файл — primary BMAD/TDS state (sprint-status / branch-registry / story spec / lessons)
- **MTTR target:** ≤ 45 минут

> **Note (наблюдаемое поведение, не TDS-ERR symbol):** spec
> декларирует symbols `TDS-ERR:INTEGRITY_DRIFT` /
> `TDS-ERR:STORY_LOCATION_DRIFT` для exit 26 в этих сценариях
> (`_docs/spec/registry/error-codes.yaml`). **Runtime эти symbols
> прямо в stderr сейчас не печатает** — увидите только exit code 26 +
> `verified=N failed=K` от `tds integrity verify`. Routing в этот
> runbook делается по path-pattern в JSON-выводе, не по symbol
> string в stderr.
>
> **Disambiguation с RB-06:** обе runbook triggered exit 26. Сначала
> `tds integrity verify --json` — если хотя бы один drifted path
> в Class A primary set ниже, идите сюда. Иначе — RB-06.

## Class A primary state — routing pattern

Drift в любом из этих файлов = SEV1, RB-09:

| Path pattern | Owner CLI | Что в drift'e означает |
|---|---|---|
| `_bmad/bmm/sprint-status.yaml` | `tds story update` / `tds epic` | Direct YAML write обходит CLI (см. §17.5 TS-1) |
| `<output>/_tds/branch-registry.yaml` | `tds branch *` | Direct write обходит branch-grammar enforcement |
| `<impl_artifacts>/stories/**/*.md` (default `_bmad-output/implementation-artifacts/stories/`) | `tds story update` / `tds story add-finding` | Direct edit story frontmatter / body / `## Auditor Findings` секций |
| `<output>/_tds/memory/lessons.yaml` | `tds memory add/supersede/tag` | Direct edit лишает audit-trail в `lesson-events.jsonl` |

Любой другой drifted path → [RB-06](./RB-06-doctor-bundle.md).

## Triage (5 минут)

1. **Identify mismatch detail:**
   ```
   tds integrity verify --json > /tmp/tds-integrity.json
   jq '.failedEntries[]' /tmp/tds-integrity.json
   ```
   Each entry = `{path, expectedSha256, actualSha256, recordedAt}`.
2. **Match drifted paths против Class A primary set выше.**
3. **Cross-check git history:** legitimate edit (commit author = team member, sensible timestamp) vs unexpected (force-push / unknown author / mid-Story timestamp без CLI rationale)?
   ```
   git log -p -- <drifted-file> | head -200
   git diff HEAD -- <drifted-file>
   ```

## Containment

1. **Halt текущего story:**
   ```
   tds state set --story <current> --status halted --reason="integrity-drift-classA"
   ```
2. **Snapshot all primary files** (используем пути из `failedEntries[].path`):
   ```
   STAMP=$(date +%Y%m%dT%H%M%SZ)
   mkdir -p /tmp/tds-pre-recovery-${STAMP}
   cp _bmad/bmm/sprint-status.yaml \
      <output>/_tds/state-manifest.yaml \
      <output>/_tds/branch-registry.yaml \
      /tmp/tds-pre-recovery-${STAMP}/
   tar czf /tmp/tds-pre-recovery-${STAMP}-stories.tar.gz \
      _bmad-output/implementation-artifacts/stories/
   ```

## Recovery

### Decision tree

```
drift в Class A primary
├── git history shows legitimate edit (commit author = team member)?
│   ├── yes → accept-and-record (Path A)
│   └── no  → tamper investigation (Path B)
└── unable to determine?
    └── conservative path: backup + Path A с manual review
```

### Path A: Legitimate edit (most common)

1. Inspect diff (отдельный `tds integrity diff` в текущей реализации не реализован — используем git):
   ```
   git log -p -- <drifted-file> | head -200
   git diff HEAD -- <drifted-file>
   ```
2. Accept drift — это re-record новый sha256 в registry с audit-trail:
   ```
   tds integrity accept --files=<comma-separated-list> \
     --reason="<who/why; e.g. emergency hotfix by alice 2026-04-28>"
   ```
3. **`--reason` обязателен** (handler требует non-empty string) — попадает в `integrity-events.jsonl`.

### Path B: Tamper / unauthorized edit

1. Revert изменения:
   ```
   git checkout <last-known-good-sha> -- <drifted-files>
   tds integrity verify    # exit 0?
   ```
2. Investigate via `git log` / `git blame`:
   - Кто edit'ил? Когда? Без `tds story update` / `tds epic` rationale?
3. Add lesson:
   ```
   tds memory add --category=integrity --severity=high \
     --summary="<short>" --lesson="<2-5 sentences>" \
     --story-refs="<comma-separated-list>"
   ```
4. Если tampering systematic — раскрыть в team retro.

## Verification

```
tds integrity verify                          # exit 0?
tds preflight check --action=story-execute    # exit 0?
tds doctor diagnose                           # status=ok?
```

## Postmortem

- Add lesson через `tds memory add` (per Path A или Path B выше).
- Если drift был из-за прямого LLM Edit — add CI guard / preflight check для prevention в next session (e.g., bats-style invariant `inv-<file>-via-cli-only.bats`).
- Если drift из-за external tooling — document в SECURITY.md / CONTRIBUTING.md.

## Связанные ADR / spec

- §12 Integrity registry
- §17.2 Class A read-only enforcement
- §17.5 TS-1, TS-2 threat scenarios
- ADR-0001 sha256 registry rationale
