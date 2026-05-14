# RB-06: doctor-bundle (reconcile drift, generic / Class B)

- **Trigger:** exit 26 от `tds integrity verify` или `tds archive verify` с failed_entries вне Class A primary state (см. routing в [README](./README.md))
- **Severity:** SEV2 (degraded)
- **Symptom:** integrity registry sha256 не совпадает с фактическим sha256 файлов — но дрифт **не** в primary BMAD/TDS state (sprint-status / branch-registry / story spec / lessons), а в payload Class A под `_bmad/tds/`, archive bundle artefacts, или есть stale halt.json edge case
- **MTTR target:** ≤ 30 минут (typical)

> **Note (наблюдаемое поведение, не TDS-ERR symbol):** `tds-design.md`
> §11 + `_docs/spec/registry/error-codes.yaml` декларируют symbols
> `TDS-ERR:RECONCILE_TOCTOU` / `TDS-ERR:ARCHIVE_INTEGRITY_DRIFT` для
> exit 26 в этих сценариях. **Runtime эти symbols прямо в stderr
> сейчас не печатает** — exit code 26 + пустой stderr (или
> `verified=N failed=K\n` от `tds integrity verify`) единственное
> что user увидит. Routing — по выводу `tds integrity verify --json`.
>
> **Disambiguation с RB-09:** оба runbook'а triggered exit 26. Если
> хотя бы один `failed_entries[].path` совпадает с Class A primary
> path-pattern (`_bmad/bmm/sprint-status.yaml`, `<output>/_tds/
> branch-registry.yaml`, `<impl_artifacts>/stories/**/*.md`,
> `<output>/_tds/memory/lessons.yaml`) — идите в **RB-09**. Иначе
> остаётесь здесь.

## Triage (5 минут)

1. **Получить детали drift'a:**
   ```
   tds integrity verify --json > /tmp/tds-integrity.json
   jq '.failedEntries[]' /tmp/tds-integrity.json
   ```
   Каждый entry = `{path, expectedSha256, actualSha256, recordedAt}`. Поле `class` в выводе `verify` отсутствует — классификацию делаем по `path`.
2. **Если drift пришёл от `tds archive verify --phase=<name>`** — failed_entries относятся к archived bundle artefacts (под `<output>/_tds/_archive/<phase>/`). Это RB-06 territory (Path C ниже), не RB-09.
3. **Check halt.json edge:**
   ```
   tds doctor diagnose
   ```
   Если `halt` check = fail с stale `runtime/halt.json` от предыдущего run'a — это Path D ниже.

## Containment (5 минут)

1. **Stop in-flight work.** Текущий story не должен продолжаться до resolve.
   ```
   tds state set --story <current> --status halted --reason="integrity-drift-classB"
   ```
2. **Snapshot для forensics.**
   ```
   STAMP=$(date +%Y%m%dT%H%M%SZ)
   tar czf /tmp/tds-pre-recovery-${STAMP}.tar.gz \
     <output>/_tds/state-manifest.yaml \
     <output>/_tds/runtime/halt.json
   ```

## Recovery

### Path A: Drift в `_bmad/tds/` payload (supply-chain risk)

Файлы под `_bmad/tds/` (TDS bundle, runbooks, references) — read-only после install.
Drift здесь означает либо post-install corruption (antivirus, disk error), либо
supply-chain compromise.

1. Verify cosign signature (если canonical release sign'ит — на сегодня release-time
   signing является design intent в §17.4 spec, runtime auto-verify ещё не реализован):
   ```
   cosign verify-blob --certificate <classI>.cert --signature <classI>.sig <classI-file>
   ```
2. Если signature INVALID — **abort**. Re-clone TDS из verified source:
   ```
   bmad install --update --custom-source <git-url> --force
   ```
3. Если signature VALID (или canonical release без cosign) — drift false-positive.
   Re-record post-install state:
   ```
   tds integrity recover --strategy=trust-classI \
     --reason="<why; e.g. canonical re-clone verified by sha256>"
   ```

### Path B: Drift в Class A primary state

→ **переходите на [RB-09](./RB-09-integrity-drift.md).** Этот runbook (RB-06) покрывает только non-primary-state drift.

### Path C: Drift в archive bundle (от `tds archive verify`)

1. Ничего не меняем в archive — archives **immutable** by design.
2. Investigate какой phase затронут:
   ```
   tds archive list
   tds archive show --phase=<name>
   ```
3. **Если archive был corrupted после write** (rare — proper-lockfile + write-file-atomic
   защищают write-time): re-build archive из source phase data — но это лосс audit-trail.
   В большинстве случаев правильный путь — **mark archive как corrupted в operator
   notes**, продолжить работу без него, добавить lesson про root cause (диск, бэкапы,
   etc.).
4. Если archive bundle ещё не финальный (work-in-progress) — re-create через `tds
   archive create --phase=<name>` (он перезапишет drift'нувший bundle).

### Path D: Stale halt.json (no actual drift)

`tds doctor diagnose` shows halt=fail но `tds integrity verify` exit 0 — halt.json
остался от прошлого run'a и не очищен.

```
rm <output>/_tds/runtime/halt.json
tds doctor diagnose                          # halt должен быть pass
tds preflight check --action=story-execute   # exit 0?
```

В текущей реализации **отдельного `tds setup repair --action=clear-halt` нет** —
delete вручную.

## Verification (5 минут)

```
tds integrity verify                          # exit 0 (no failedEntries)
tds preflight check --action=story-execute    # exit 0?
tds doctor diagnose                           # status=ok
```

## Postmortem (asynchronous)

1. Если drift был user / LLM прямой write — добавьте lesson:
   ```
   tds memory add --category=integrity --severity=warn \
     --summary="<short>" --lesson="<2-5 sentences>" \
     --during-retro=<retro-id>
   ```
2. Если supply-chain (Path A signature invalid) — **security incident**:
   - Rotate exposed secrets.
   - Update `SECURITY.md` advisory.
   - lesson через `tds memory add --severity=critical`.

## Communication

Для team scenario:
- Slack/Teams: «TDS halt SEV2 на story <id>; recovery via RB-06 Path X.»
- Escalate maintainer'у если Path A signature invalid.
