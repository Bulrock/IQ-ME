---
name: bmad-tds-archive-phase
description: |
  Phase finalization orchestrator (release v1.0, MVP, quarter). Активируется на phrases: «archive phase», «закрыть фазу», «finish phase X». Snapshot-копирует stories + _tds slices + sprint-status в <output>/_archive/<phase>/; делегирует writer для phase-summary.md (Diátaxis); update state-manifest.archived_phases. Read-only restore — архивы никогда не resurrected как active.
---

# bmad-tds-archive-phase

Когда фаза завершена и нужно подготовиться к следующему этапу — этот workflow:
1. Verify готовность (no in-progress stories, no orphan branches).
2. Snapshot всех phase artefacts (stories, integrity entries, branches, telemetry, sprint-status).
3. Generate phase-summary.md через writer (для stakeholders).
4. Compute sha256 для archive integrity.
5. Update tds_meta.archived_phases (append-only, never removed).

Source artefacts **остаются на месте** — Karpathy #3 Surgical Changes — Operator manually делает rm после verify, если хочет.

## On Activation

### Step 0 — Resolve customization (MUST, before anything else)

Run:

```
python3 {project-root}/_bmad/scripts/resolve_customization.py \
  --skill {skill-root} --key workflow
```

**If the script fails**, resolve `workflow` block manually base → team → user:

1. `{skill-root}/customize.toml` — defaults (Class I)
2. `{project-root}/_bmad/custom/{skill-name}.toml` — team overrides (Class III)
3. `{project-root}/_bmad/custom/{skill-name}.user.toml` — personal overrides (Class III)

Merge rules: scalars override; tables deep-merge; arrays of tables keyed by `code`/`id` replace + append; other arrays append.

### Step 1 — Execute prepend steps

Execute each entry в `{workflow.activation_steps_prepend}`.

### Step 2 — Load persistent facts

Treat `{workflow.persistent_facts}` как foundational session context (`file:` префиксы — load contents).

### Step 3 — Load BMAD config

Из `{project-root}/_bmad/bmm/config.yaml`: `{user_name}`, `{communication_language}`, `{document_output_language}`, `{project_knowledge}`, `{impl_artifacts}`.

### Step 4 — Apply principles

Combine Karpathy 4 принципов (MANDATORY; полный текст в `## Constraints` секции) + `{workflow.principles}` (team additions).

### Step 5 — Execute orchestration

Proceed to «Process» section ниже. После завершения — execute `{workflow.activation_steps_append}`.

---

## Process — orchestration steps (8)

| # | Step | Что делает |
|---|------|-----------|
| 1 | preflight + scope determination | `tds preflight check --action=archive-phase` (canonical PreflightAction enum: `install\|story-execute\|epic-execute\|story-review\|epic-finalize\|archive-phase\|migrate` — см. `src/preflight/check.ts`; нет bash wrappers под `_bmad/tds/scripts/`). Subsequent `tds archive create` requires `--phase=<name>`. Optional: `--epics=<list>` (default — все epics с status=done не в предыдущих архивах). |
| 2 | guard checks | (a) Все scope.stories status=done; (b) Все scope.branches merged/abandoned (`tds doctor branch-orphans` clean); (c) `tds sync` recent (sync-events ≤ 24h ago — иначе warn). Любое нарушение → exit 5 + clear error + list of in-progress / orphan items. |
| 3 | delegate to writer (phase-summary.md) | Sub-skill invocation, mode=phase-summary. CLI calls use `--as=writer`. Diátaxis: explanation + reference. Sections: что было сделано, ключевые epics, метрики (avg story duration, lessons captured, bridging epics resolved), key ADRs, risks discharged. Writer записывает файл в staging path (e.g. `_bmad-output/_tds/runtime/archive-staging/<phase>-summary.md`) — он передаётся в Step 4 через `--phase-summary=<path>`. Writer **должен** выполняться ДО `tds archive create`, иначе stub попадёт в manifest и `tds archive verify` будет ругаться. |
| 4 | run archive create (single atomic CLI call) | `tds archive create --phase=<name> --as=engineer --phase-summary=<writer-summary> [--epics=<list>] [--description=<text>]`. CLI atomically: (a) snapshots stories из `<output_folder>/implementation-artifacts/stories/`; (b) snapshots `_tds/` slices (state-manifest, branch-registry, telemetry streams); (c) snapshots sprint-status; (d) копирует writer-summary как `phase-summary.md`; (e) хэширует все файлы → `manifest.integrity.files`; (f) пишет `manifest.yaml`; (g) appends entry в `state-manifest.yaml.tds_meta.archived_phases[]` (idempotent на phase_name, legacy `string[]` мигрируется автоматически). Никаких ручных `cp`/`sha256sum`/`python -c "yaml.dump"` workaround'ов. |
| 5 | verify | `tds archive verify --phase=<name>`. Должен вернуть `failed=0` сразу после Step 4. Failure → exit 26 (см. RB-06 Path C). НЕ переходить к Step 6, пока verify не passing — cleanup полагается на manifest integrity. |
| 6 | cleanup (verify-gated, optional но рекомендуется) | `tds archive cleanup --phase=<name> --dry-run --as=engineer` → preview списка source story files, которые будут удалены. Затем `tds archive cleanup --phase=<name> --confirm --as=engineer` — destructive removal только тех stories, чей source sha совпадает с archived copy. Любая drift между source и archive → atomic abort, ничего не удалено. Archive directory не трогается; Step 5 продолжит passing после cleanup. **Engineer-only** (matrix `archive-cleanup`); writer'у — deny, потому что summary-generation и source-eviction разделены. Если cleanup пропустить — source files останутся на месте, это explicit choice (например, для ручного `git mv` в archive-tree). |
| 7 | final output | CLI Steps 4+6 уже emit'нули `archive-events.jsonl` events=create + cleanup. Print: «Archive complete: <archivePath>. <N> stories archived; <M> source files removed (или <M> preserved if cleanup skipped).» |
| 8 | **state-commit sweep** | Финальный workflow shaq — `tds state-commit -m "chore(archive-<phase>): archive phase sweep" --as=engineer`. Sweep аккумулирует ВСЕ archive-create + cleanup mutations одним aggregate commit: новый `_archive/<phase>/` дерево (manifest, snapshots, telemetry slices), `state-manifest.yaml` update (archived_phases entry), branch-registry/sprint-status snapshots, и (если Step 6 выполнялся) удалённые `implementation-artifacts/stories/<phase-files>.md`. Большой commit (десятки файлов) — это OK. Idempotent + never-throws. |

**Restore semantics — read-only:**
- `tds archive list` — list all archived phases (one line per phase).
- `tds archive show --phase=<name>` — display manifest + stories list. Реальный flag — `--phase=<name>` (handler требует, см. `src/cli/handlers/archive.ts`).
- `tds archive verify --phase=<name>` — re-compute sha256s vs manifest; mismatch → exit 26 (см. [RB-06](../bmad-tds-setup/runbooks/RB-06-doctor-bundle.md) Path C).
- `tds archive cleanup --phase=<name> {--dry-run | --confirm} --as=engineer` — verify-gated rm source story files (ARCH-04). Никакой default destructive path — обязательный explicit choice between preview и destroy.
- Чтобы прочитать конкретную archived story — открыть file напрямую: `cat <output_folder>/_archive/<phase>/stories/<story-id>.md` (paths приведены в `manifest.yaml.integrity.files`). Отдельного `tds archive show --story=<id>` flag'а нет.
- **NO** `archive restore` subcommand — архивы никогда не resurrected как active.

## Examples

```
<example>
User: «Archive phase v1.0-launch»
Process:
  [Step 1 preflight] phase_name=v1.0-launch.
  [Step 2 guard] All 24 stories status=done. branch-orphans clean. tds sync 6h ago. OK.
  [Step 3 writer] sub-skill: writer, mode=phase-summary. CLI calls use --as=writer.
                  Phase-summary.md generated (Diátaxis explanation+reference) → 
                  _bmad-output/_tds/runtime/archive-staging/v1.0-launch-summary.md:
                  «v1.0-launch: 102 days, 24 stories across 4 epics, 8 lessons captured, 1 bridging epic resolved...»
  [Step 4 archive create] tds archive create --phase=v1.0-launch --as=engineer \
                            --phase-summary=_bmad-output/_tds/runtime/archive-staging/v1.0-launch-summary.md \
                            --epics=epic-1,epic-2,bridge-1-5,epic-3
                          CLI atomically: snapshots 24 stories из implementation-artifacts/stories/,
                          _tds slices, sprint-status, копирует writer-summary как phase-summary.md,
                          хэширует 156 files, пишет manifest.yaml, appends archived_phases entry.
  [Step 5 verify] tds archive verify --phase=v1.0-launch → failed=0.
  [Step 6 cleanup] tds archive cleanup --phase=v1.0-launch --dry-run --as=engineer →
                   «would remove 24 source story file(s); skipped 0».
                   tds archive cleanup --phase=v1.0-launch --confirm --as=engineer →
                   «removed 24 source story file(s); skipped 0».
                   (Если 1 story изменилась после archive — abort, ничего не удалено;
                   operator решает: либо revert, либо re-archive с новым phase-name.)
  [Step 7 output] «Archive complete: _bmad-output/_archive/v1.0-launch/. 24 stories + 156 files snapshot.
                  24 source files removed. tds_meta.archived_phases updated.»
  [Step 8 sweep] tds state-commit -m "chore(archive-v1.0-launch): archive phase sweep" --as=engineer.
</example>

<example>
User: «Archive phase mvp» (но 1 story в in-progress)
Process:
  [Step 1 preflight] OK.
  [Step 2 guard] story 3-2-analytics-dashboard = in-progress. exit 5 + 
                 «Cannot archive: 1 in-progress story (3-2-analytics-dashboard). Either: (a) complete it,
                  (b) abandon via tds branch info --branch=<>, или (c) exclude from scope:
                  /bmad-tds-archive-phase mvp --epics=epic-1,epic-2.»
</example>
```

## Constraints

- Respond to user in {communication_language}.
- Generate deliverables in {document_output_language}.

- **Forbidden-quadrant:** workflow-skill вне matrix. Engineer delegation для technical snapshot operations: `engineer × archive-ops = allow`. Writer delegation для phase-summary: `writer × archive-ops = allow`. Source eviction (`tds archive cleanup`) — `engineer × archive-cleanup = allow` only (ARCH-04); writer'у matrix говорит deny, потому что `rm` source files это разрушительная операция, отдельная от summary generation.

- **Karpathy working principles:**
  1. **Think Before Coding** — Step 2 explicit guard checks. Не «архивируем как-нибудь, разберёмся при verify».
  2. **Simplicity First** — single phase = single archive folder. No incremental archiving (либо весь phase scope, либо ничего).
  3. **Surgical Changes** — `archive create` НЕ удаляет source. Cleanup — отдельная команда (`tds archive cleanup`), verify-gated, требует explicit `--dry-run`/`--confirm` choice. Любой drift → abort без mutation. Operator имеет одну точку решения «делать cleanup или нет».
  4. **Goal-Driven Execution** — success criterion: archive verifies (`tds archive verify`) + tds_meta updated + writer-summary clear.

- **Read-only restore semantics:** `tds archive` НЕ имеет команды `restore-as-active`. Если operator хочет вернуться к функциональности — это **new story**, не resurrection. Архив для historical reference.

- **Phase scope determination:** scope = stories со status=done не входящие в previous archives. tds_meta.archived_phases tracking предотвращает double-archive.

## References

- `workflow.md` — детальный flow всех 10 steps + error handling.
- `references/phase-summary-template.md` — Diátaxis explanation+reference template для writer'а.
- `references/integrity-archive-policy.md` — почему source preserved (Karpathy #3).
