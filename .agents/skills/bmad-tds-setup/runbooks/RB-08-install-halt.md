# RB-08: install-halt (payload integrity)

- **Trigger (reserved):** exit 41 — symbols `TDS-ERR:PAYLOAD_INTEGRITY_FAILED` / `TDS-ERR:STAGING_SETUP_FAILED` (см. `_docs/spec/registry/error-codes.yaml`)
- **Severity:** SEV1 (TDS не работает; install incomplete)
- **Symptom:** sha256 файлов в `_bmad/tds/` не совпадает с `module.yaml.expected_payload_sha256` map (или частичное копирование payload, отсутствующий helper file, и т.п.)
- **MTTR target:** ≤ 1 час

> ## ⚠️ STATUS: design-reserved (runtime ещё не emit'ит exit 41)
>
> `EXIT.INSTALL_HALT = 41` определён в `src/registry/error-codes.ts`
> и зарезервирован в `_docs/spec/registry/error-codes.yaml`, но
> **никаким кодом сегодня не emit'ится** (grep `INSTALL_HALT` /
> `EXIT.INSTALL_HALT` в `src/` возвращает только определение enum,
> ни одного call-site).
>
> Practical implications: попасть на этот runbook через runtime
> pointer прямо сейчас невозможно. Подобные failure modes (incomplete
> install, missing helper file, antivirus quarantine of `_bmad/tds/`)
> сегодня surface'ятся через **`tds preflight check --action=install`
> с exit 3 (PRECONDITION)** + конкретное failure message — runbook
> ниже актуален как операционный playbook для этих случаев, просто
> без exit 41 как trigger'a.
>
> Когда install-time integrity verification реализуется и начнёт
> emit'ить 41 — runbook готов к использованию as-is.

## Triage (5 минут)

1. **Run preflight на install action — это первая точка где integrity Class I проверяется:**
   ```
   tds preflight check --action=install --json
   ```
   Failed entries (`python-helper not found at ...`, `bmad-resolve-script missing`, `node < 22`, `python3 ≥ 3.10 + ruamel.yaml ≥ 0.18 required`) — индикатор того что именно не доехало.
2. **Verify Class I integrity явно:**
   ```
   tds integrity verify --json | jq '.failed_entries[]'
   ```
3. **Classify:**
   - Single file mismatch на known-canonical source ⇒ либо false-positive (sha256 map устарел maintainer-side), либо incomplete copy (antivirus / .gitignore filter / packaging miss).
   - Multiple files mismatch ⇒ supply-chain compromise или incomplete install.
   - Cosign signature INVALID (если canonical source signs releases) ⇒ supply-chain compromise — abort, не proceed.

## Containment (immediately)

1. **Stop install.** Не запускать `tds setup install` снова до диагностики.
2. **Не activate role-skills** — they могут полагаться на compromised payload.
3. Snapshot:
   ```
   tar czf /tmp/tds-classI-pre-recovery-$(date +%Y%m%dT%H%M%SZ).tar.gz \
     _bmad/tds/
   ```

## Recovery

### Path A: cosign signature INVALID (supply-chain compromise)

1. **DO NOT proceed.**
2. Verify via offline canonical source:
   ```
   git clone https://github.com/<owner>/tds-bmad-module /tmp/tds-canonical
   cd /tmp/tds-canonical && git verify-commit HEAD  # GPG-signed commit?
   sha256sum payload/shared/tds-runtime.bundle.js
   ```
3. Compare к local payload. Если разные — escalate к maintainer + security disclosure.
4. После confirmation supply-chain compromise — re-install из verified source:
   ```
   bmad install --update --custom-source <verified-path> --force
   ```

### Path B: Single file mismatch + signature OK (или canonical без cosign)

1. **Re-install** для re-fetch:
   ```
   bmad install --update --force
   ```
   (BMAD installer сам копирует `payload/` в `_bmad/tds/`. Slash-command `/bmad-tds-setup install` запускает TDS-side bootstrap уже после доставки payload'а.)
2. Re-bootstrap TDS runtime:
   ```
   /bmad-tds-setup install --profile=<profile>
   ```

### Path C: Incomplete install (interrupted при previous run)

1. Identify last successful step через `<output>/_tds/runtime/halt.json` (если есть) и `tds doctor diagnose`.
2. Re-run setup install — он идемпотентен, повторно создаёт недостающие файлы и пропускает уже валидные:
   ```
   /bmad-tds-setup install --profile=<profile>
   ```

## Verification

```
tds preflight check --action=install         # exit 0?
tds integrity verify                          # exit 0?
tds doctor diagnose                           # status=ok?
```
Если все green — install complete.

## Postmortem

- **Path A (compromise):**
  - Security incident report.
  - Rotate any secrets exposed.
  - Update `SECURITY.md` с advisory.
  - Add lesson `tds memory add --category=integrity --severity=critical --summary=... --lesson=...`.
- **Path B (re-install fix):**
  - Если повторяется — investigate antivirus quarantine on `_bmad/` path / network reliability / git LFS issues.
- **Path C (interrupted):**
  - Add lesson если interrupting cause systemic (CI runner OOM, etc.).
