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

## Process — orchestration steps (10)

| # | Step | Что делает |
|---|------|-----------|
| 1 | preflight + scope determination | `tds preflight check --action=archive-phase` (canonical PreflightAction enum: `install\|story-execute\|epic-execute\|story-review\|epic-finalize\|archive-phase\|migrate` — см. `src/preflight/check.ts`; нет bash wrappers под `_bmad/tds/scripts/`). Subsequent `tds archive create` requires `--phase=<name>`. Optional: `--epics=<list>` (default — все epics с status=done не в предыдущих архивах). |
| 2 | guard checks | (a) Все scope.stories status=done; (b) Все scope.branches merged/abandoned (`tds doctor branch-orphans` clean); (c) `tds sync` recent (sync-events ≤ 24h ago — иначе warn). Любое нарушение → exit 5 + clear error + list of in-progress / orphan items. |
| 3 | snapshot stories | `cp <impl_artifacts>/stories/<phase-files>` → `<output_folder>/_archive/<phase>/stories/`. Bridging epics тоже архивируются. |
| 4 | snapshot _tds slices | (a) state-manifest entries scope → `_tds-snapshot/state-manifest.yaml`. (b) branch-registry entries scope → `_tds-snapshot/branch-registry.yaml`. (c) llm-manifest, claim-index — filtered by phase scope. (d) Telemetry JSONL filtered by phase-period (gzip per stream): `_tds-snapshot/telemetry/<stream>.<phase>.jsonl.gz`. |
| 5 | snapshot sprint-status entries | Filter sprint-status.epics[] по scope; write to `<archive>/sprint-status-snapshot.yaml`. |
| 6 | delegate to writer (phase-summary.md) | Sub-skill invocation, mode=phase-summary. CLI calls use `--as=writer`. Diátaxis: explanation + reference. Sections: что было сделано, ключевые epics, метрики (avg story duration, lessons captured, bridging epics resolved), key ADRs, risks discharged. |
| 7 | compute sha256 (per-file + manifest_sha256) | Walk archive directory; sha256 каждый file → manifest.integrity.files. Compute manifest_sha256 over content excluding self-field. |
| 8 | write manifest.yaml | Save `<archive>/manifest.yaml` per archive-manifest.schema.yaml. |
| 9 | update state-manifest.tds_meta | Append entry to `tds_meta.archived_phases[]` в `<output_folder>/_tds/state-manifest.yaml`. Re-record state-manifest sha256 (since tds_meta changed). |
| 10 | emit telemetry + final output | `archive-events.jsonl` event=complete. Print: «Archive complete. Source artefacts preserved. Run `tds archive verify <phase>` to confirm, then optionally `rm -rf <output_folder>/{impl_artifacts}/stories/<phase-old-files>` manually.» |
| 11 | **state-commit sweep** | Финальный workflow shaq — `tds state-commit -m "chore(archive-<phase>): archive phase sweep" --as=engineer`. Sweep аккумулирует ВСЕ archive-create mutations одним aggregate commit: новый `_archive/<phase>/` дерево (manifest, snapshots, telemetry slices), state-manifest.yaml update (archived_phases entry + re-recorded sha256), branch-registry/sprint-status snapshots. Большой commit (десятки файлов) — это OK, archive — fundamentally large mutation. Idempotent + never-throws. | — (CLI) |

**Restore semantics — read-only:**
- `tds archive list` — list all archived phases (one line per phase).
- `tds archive show --phase=<name>` — display manifest + stories list. Реальный flag — `--phase=<name>` (handler требует, см. `src/cli/handlers/archive.ts:127`).
- `tds archive verify --phase=<name>` — re-compute sha256s vs manifest; mismatch → exit 26 (см. [RB-06](../bmad-tds-setup/runbooks/RB-06-doctor-bundle.md) Path C).
- Чтобы прочитать конкретную archived story — открыть file напрямую: `cat <output_folder>/_archive/<phase>/stories/<story-id>.md` (paths приведены в `manifest.yaml.integrity.files`). Отдельного `tds archive show --story=<id>` flag'а нет.
- **NO** `archive restore` subcommand — архивы никогда не resurrected как active.

## Examples

```
<example>
User: «Archive phase v1.0-launch»
Process:
  [Step 1 preflight] phase_name=v1.0-launch.
  [Step 2 guard] All 24 stories status=done. branch-orphans clean. tds sync 6h ago. OK.
  [Step 3 snapshot stories] cp 24 story files → _archive/v1.0-launch/stories/.
  [Step 4 snapshot _tds] state-manifest entries (87), branch-registry (24 branches), llm-manifest filtered, claim-index filtered, telemetry 15 streams gzipped.
  [Step 5 sprint-status snapshot] 4 epics (epic-1, epic-2, bridge-1-5, epic-3) → sprint-status-snapshot.yaml.
  [Step 6 writer] sub-skill: writer. CLI calls use --as=writer.
                  Phase-summary.md generated (Diátaxis explanation+reference):
                  «v1.0-launch: 102 days, 24 stories across 4 epics, 8 lessons captured, 1 bridging epic resolved...»
  [Step 7 sha256] 156 files hashed; manifest_sha256 computed.
  [Step 8 manifest] manifest.yaml written.
  [Step 9 tds_meta] archived_phases.append({phase_name: v1.0-launch, archived_at: ts, archive_path: ..., included_epics: [...]}).
                    state-manifest sha256 re-recorded.
  [Step 10] archive-events.jsonl event=complete.
            Output: «Archive complete: _bmad-output/_archive/v1.0-launch/. 24 stories + 156 files snapshot. Source preserved. Run `tds archive verify v1.0-launch` to confirm.»
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

- **Forbidden-quadrant:** workflow-skill вне matrix. Engineer delegation для technical snapshot operations: `engineer × archive-ops = allow`. Writer delegation для phase-summary: `writer × archive-ops = allow`.

- **Karpathy working principles:**
  1. **Think Before Coding** — Step 2 explicit guard checks. Не «архивируем как-нибудь, разберёмся при verify».
  2. **Simplicity First** — single phase = single archive folder. No incremental archiving (либо весь phase scope, либо ничего).
  3. **Surgical Changes** — Step 10 critical: source artefacts preserved. NO auto-rm. Operator manually решает после verify.
  4. **Goal-Driven Execution** — success criterion: archive verifies (`tds archive verify`) + tds_meta updated + writer-summary clear.

- **Read-only restore semantics:** `tds archive` НЕ имеет команды `restore-as-active`. Если operator хочет вернуться к функциональности — это **new story**, не resurrection. Архив для historical reference.

- **Phase scope determination:** scope = stories со status=done не входящие в previous archives. tds_meta.archived_phases tracking предотвращает double-archive.

## References

- `workflow.md` — детальный flow всех 10 steps + error handling.
- `references/phase-summary-template.md` — Diátaxis explanation+reference template для writer'а.
- `references/integrity-archive-policy.md` — почему source preserved (Karpathy #3).
