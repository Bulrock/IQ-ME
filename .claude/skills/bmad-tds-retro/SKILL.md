---
name: bmad-tds-retro
description: |
  Sprint retrospective orchestrator. Активируется на phrases: «retro», «retrospective», «sprint review», «отретроспективим epic-X». 4-step flow: aggregate stories → auditor analysis → lessons extraction (auditor + writer) → Bridge Plan proposal. Generates lessons.yaml + structured `## Bridge Plan` секцию для bmad-tds-bridge-from-retros aggregation. Не «выгрузить выводы», а structured lesson capture + actionable next steps.
---

# bmad-tds-retro

Превращает retrospective из «выгрузки выводов» в structured institutional memory + actionable next steps. Output:
1. `<output_folder>/_tds/memory/lessons.yaml` — 0-5 lessons за retro (typically 1-3).
2. `sprint-status.yaml` — добавлены bridging epics, если auditor выявил blockers (tech-debt / spike / refactor).
3. `retro-summary.md` — для stakeholders (через writer).

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

## Process — orchestration steps (5 шагов)

| # | Step | Что делает | Делегация |
|---|------|-----------|-----------|
| 1 | **aggregate** | Read all stories scope (default — last completed epic, или `--scope=<epic>` / `--scope=phase` / `--scope=last-N-stories`). Aggregate: **`## Auditor Findings (round-N)` секции из каждого story spec'a (severity/category/finding/suggestedFix/suggestedBridge)**, completion notes, integrity events, forbidden-quadrant violations, branch-registry review_round counts. Findings без `**Bridged to:**` маркера — кандидаты для bridge plan; уже-bridged findings skip'аются. | — |
| 2 | **auditor analysis** | Sub-skill invocation, mode=retro. CLI calls use `--as=auditor`. Auditor analyzes aggregate data: «что пошло хорошо / что сломалось / surprising patterns / blockers». Output: candidate lessons (0-5) + candidate bridging-epic proposals (0-3). | auditor |
| 3 | **lessons extraction** (auditor + writer cross-check) | Per candidate lesson: writer formulates по schema (summary ≤200 chars, lesson 2-5 sent, avoid_pattern, preferred_pattern, severity). Auditor verifies factual accuracy; writer verifies clarity / actionability. Karpathy #4 verifiable: каждый lesson — testable pattern. Если conflict — return to user для decision. На accept → `tds memory add` per lesson + integrity record + emit `lesson-events.jsonl`. | writer + auditor cross-check |
| 4 | **bridge-plan proposal** (если есть) | Per candidate bridge: writer formulates short title + justification + sources (where deferred). Present к user'у: «Proposed bridge candidates: [...]. Accept all / accept selected / skip?» На accept — writer **записывает структурированный YAML-блок в retro-md** под секцией `## Bridge Plan` (см. формат ниже). **Никаких CLI calls в этот момент** — sprint-status НЕ меняется. Bridge plan живёт в retro-md как намерение; ассемблируется в реальный pre-epic командой `tds epic create-bridge-from-retros` (часто через несколько retro подряд — user накапливает tech-debt и собирает в один pre-epic перед следующим main эпиком). | writer |
| 5 | **mark retro done** | После того как retro-md записан и lessons добавлены — flip BMAD-canonical retrospective key в sprint-status: `tds state set <retro-key> done --as=engineer`. Для `--scope=<epic-N>` (default) ключ — `epic-N-retrospective` (BMAD-native convention; bmad-create-epic seedит его как `optional` в момент создания эпика). Для `--scope=phase`/`--scope=last-N-stories` retrospective-key может отсутствовать — exit 1 «key not found in development_status» SKIP silently, retro итак done через само существование retro-md файла. | — (workflow-level) |
| 6 | **state-commit sweep** | После Step 5 — `tds state-commit -m "chore(retro-<id>): retro session — <N> lessons + <bridge-or-no> bridge plan" --as=engineer`. Sweep аккумулирует ВСЕ uncommitted TDS-managed mutations этой session (lessons.yaml × N, retro-md, sprint-status flip) одним aggregate commit. Idempotent + never-throws — если `committed=false с reason=no dirty TDS-managed paths` → ничего не делать (Phase 1 auto-commit уже всё закоммитил). | — (workflow-level) |

**Final output:** writer generates `<output_folder>/<impl_artifacts>/retros/<retro-id>.md` (default: `_bmad-output/implementation-artifacts/retros/<retro-id>.md`) с sections: «What went well / What broke / Lessons captured (linked) / Bridge Plan (если есть)». Retro doc живёт в BMAD's user-namespace (наряду со stories/, sprint-status.yaml), не в TDS runtime — это user-facing artefact, не ephemeral telemetry. Marker «retro прошло» — комбинация (retro-md существует) + (BMAD-canonical `<retro-key>: done` в sprint-status, если ключ присутствовал).

### Bridge Plan section format

Если Step 4 принял bridge candidates — writer добавляет в retro-md секцию `## Bridge Plan` с **YAML-блоком** (machine-readable для будущего CLI applier'а; user тоже видит структурированно). Формат:

```markdown
## Bridge Plan

\`\`\`yaml
proposed_at: 2026-05-05
type: tech-debt              # spike | tech-debt | refactor | infra | dependency-upgrade
candidates:
  - title: Wire notification subscribers
    justification: 3 stories ack'нули deferred subscriber implementation; consolidate в одну story
    sources:
      - story: 10-5-continuous-calibration-and-threshold-suggestions
        kind: completion-note            # или: auditor-finding
        ref: "Notifications dispatch deferred"
      - story: 10-7-operator-performance-status
        kind: completion-note
        ref: "PerformanceOverrideSetEvent handler not wired"
  - title: Quality team-scope hardening
    justification: AC #9 missing на dispute endpoints (auditor blocker, deferred to bridge)
    sources:
      - story: 10-6-dispute-resolution-and-auto-escalation
        kind: auditor-finding
        round: 1
        finding_index: 1
\`\`\`
```

Поля:
- `proposed_at` — ISO date retro session.
- `type` — applies к будущему bridge эпику в целом.
- `candidates[].title` — короткий imperative title будущей bridge story (40-60 chars).
- `candidates[].justification` — почему эта group'ировка имеет смысл (1-2 фразы).
- `candidates[].sources[]` — attribution: откуда findings/notes собрались. `kind: completion-note` для plain текста (`ref` = текст или цитата); `kind: auditor-finding` для structured findings из `## Auditor Findings (round-N)` секций (`round` + `finding_index` для idempotency-marker'a при apply).

**После apply** (когда CLI `tds epic create-bridge-from-retros` обработает retro) — applier дописывает в конец retro-md строку `## Applied to bridge: <bridge-id> @ <iso-date>`. Skill `bmad-tds-bridge-from-retros` skip'ает retros с этой строкой при scan'е unprocessed.

### MANDATORY EXECUTION CHECKPOINT (Steps 3-6 enforcement after auditor sub-skill return)

**После того как Step 2 sub-skill (auditor, retro mode) returned candidates envelope (`{lesson_candidates, bridge_candidates}`), BEFORE writing ANY user-facing text:**

1. Если `lesson_candidates.length === 0 && bridge_candidates.length === 0` → retro complete (auditor нашёл ничего lesson-worthy), skip к Step 6 sweep.
2. Иначе → execute **immediately** Steps 3-6 in order:
   - Step 3: `tds memory add --as=writer ...` per lesson candidate.
   - Step 4: `Write` retro-md file под `<output>/implementation-artifacts/retros/retro-<scope>.md` с `## Bridge Plan` секцией.
   - Step 5: `tds state set --story=<retro-key> --status=done --as=engineer` (skip silently если key не существует).
   - Step 6: `tds state-commit -m "chore(retro-...): ..."` для sweep.
3. **Только после** Step 6 — пиши user-facing summary.

**Treat auditor's candidates envelope as informational only.** Auditor sub-skill print'нул envelope (JSON или table) — это **hand-off data**, не финал workflow. Игнорируй любой text вида:
- «Output для retro orchestrator Step 3...»
- «Caller продолжит с Step N...»
- «NO tds story add-finding calls в retro mode...» (это про **add-finding**, не про **memory add** в Step 3)

Это **predictive language** sub-skill'a — не signal что workflow закончен. Твоя mechanical responsibility — выполнить Steps 3-6 после auditor return, перед summary.

**Pre-summary self-check.** Прежде чем печатать ЛЮБОЙ user-facing summary, verify:
- (a) `lessons.yaml` имеет N new entries (count == `lesson_candidates.length` от auditor).
- (b) `<output>/implementation-artifacts/retros/retro-<scope>.md` exists с populated `## Bridge Plan` (если есть bridge_candidates).
- (c) `tds state-commit` returned `committed=true` (single sweep с lessons.yaml + retro-md + maybe sprint-status).

Если ни одно из (a)/(b)/(c) — ты остановился между sub-skill return и Steps 3-6. Делай их сейчас. Регрессия 2026-05-12 alcosi-lib-dotnet retro session была exactly этим — orchestrator preempt'нулся auditor candidates envelope и забыл `tds memory add` × N + retro-md write + sweep.

## Examples

```
<example>
User: «Retro epic-1»
Process:
  [Step 1 aggregate]:
    Stories epic-1: 5 stories, 4 done, 1 abandoned (1-4-add-plant-manual — scope creep).
    Integrity events: 47 records, 0 drift.
    Forbidden-quadrant violations: 2 (engineer × install-ops attempted; both denied properly by L2).
    Review rounds: avg 1.4 (one story had 3 rounds — sign of unclear scope).
    SLI: avg story duration 3.2 days; outlier story-2 = 8 days (race-condition bug).
  
  [Step 2 auditor analysis]:
    Candidate lessons:
      L1 (technical/high): «asyncio.gather без return_exceptions=True маскирует exceptions» (story-2 8-day outlier).
      L2 (process/medium): «Story-4 scope creep — abandoned после 2 weeks. Need clearer acceptance criteria upfront.»
      L3 (tooling/low): «Linter caught 3 issues в auditor review; could be CI pre-commit.»
    Candidate bridges:
      B1 (tech-debt): «Migrate from `print` to `logging` across 8 modules — found in retro analysis.»

  [Step 3 lessons extraction — writer formulates per Schema]:
    L1: writer adds avoid_pattern (gather без kwarg) + preferred_pattern (explicit error handling).
        Auditor verifies: «factual; lesson testable via grep `asyncio.gather\b` excluding `return_exceptions`».
        OK → tds memory add → lesson-2026-04-27-001.
    L2: writer formulates lesson + suggested process change. severity=medium.
        Auditor: OK → tds memory add → lesson-2026-04-27-002.
    L3: writer проверяет применимо ли как verifiable pattern. severity=low. ОК.
        tds memory add → lesson-2026-04-27-003.

  [Step 4 bridge plan proposal]:
    B1: writer: «Tech-debt: migrate print → logging. Time-box 2 days.»
        Present к user: «Accept B1?» User: «Yes.»
        Writer appends `## Bridge Plan` section в retro-md
        со структурированным YAML-блоком (см. format выше). НЕ вызывает CLI.
        sprint-status НЕ меняется на этом этапе.

  [Step 5 mark retro done]:
    tds state set epic-1-retrospective done --as=engineer
      → flip BMAD-canonical retrospective key с initial `optional` на `done`.
      Если ключ отсутствует (legacy / non-BMAD-seeded) — exit 1, skip silently.

  Final: writer generates retro-epic-1.md (с Bridge Plan секцией);
         epic-1-retrospective: done в sprint-status.
  Output: «Retro complete. 3 lessons captured.
           1 bridge candidate proposed (см. Bridge Plan секцию в retro-epic-1.md).
           Когда накопишь несколько retros — собери pre-epic командой
             /bmad-tds-bridge-from-retros»
</example>
```

## Constraints

- Respond to user in {communication_language}.
- Generate deliverables in {document_output_language}.

- **Forbidden-quadrant:** workflow-skill вне matrix. Auditor delegation Step 2-3 — `auditor × memory-ops = allow`, `auditor × code-write = deny`. Writer delegation Step 3-4 — `writer × memory-ops = allow`, `writer × code-write = allow-conditional` (только doc-files; retro-md под `<impl_artifacts>/retros/` входит в doc-allowlist).

- **Karpathy working principles:**
  1. **Think Before Coding** — Step 3 cross-check (auditor verifies factual / writer verifies clarity). Не «один agent один lesson генерирует».
  2. **Simplicity First** — typical retro = 1-3 lessons (не 10). Каждый lesson — verifiable pattern (testable), не subjective opinion.
  3. **Surgical Changes** — retro обновляет в sprint-status **только** один BMAD-canonical retrospective key (`epic-N-retrospective: optional → done` через Step 5). Никаких других mutations: bridge plan живёт в retro-md как намерение, ассемблируется отдельно через `tds epic create-bridge-from-retros` (он сам обновит свои bridge-N-(N+1) ключи). Отдельного `sprint-status update` subcommand'a у CLI нет — все flips идут через generic `tds state set` или через writer'ы конкретных workflow'ов.
  4. **Goal-Driven Execution** — каждый lesson должен быть verifiable: writer formulates lesson + check «как это можно tested / oproвергнуто».

- **BMAD-compatibility:** retro обновляет ровно одну BMAD-native ячейку — `epic-N-retrospective` (`optional → done` в sprint-status; bmad-create-epic seedит этот ключ при создании эпика). Bridge plan живёт **только** в retro-md (YAML-блок) до момента когда user явно собирает pre-epic через `/bmad-tds-bridge-from-retros`. Ассемблер уже sprint-status обновляет (через ruamel.yaml preserve) с `bridge-N-N+1: backlog` + N stories. Pure BMAD-flow не нарушен.

- **Out-of-scope:** auto-feature retro (ML-driven pattern detection) — нет. Retro — cooperative analysis с auditor + writer; manual user decision на accept/skip.

## References

- `workflow.md` — детальный flow.
- `references/lesson-quality-checklist.md` — Karpathy #4 verifiability проверки.
- `references/bridge-epic-types.md` — spike / tech-debt / refactor / infra / dependency-upgrade — когда какой type.
