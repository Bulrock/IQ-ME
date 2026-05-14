---
name: bmad-tds-execute-epic
description: |
  Epic dev-phase orchestrator (Full mode only). Активируется на phrases: «execute epic E-2», «start epic», «work on epic X». Создаёт epic-integration branch, итеративно вызывает execute-story per story → status=review. Stories НЕ мержатся внутри этого workflow — merge решает clean-context auditor через /bmad-tds-code-review Mode 2.
---

# bmad-tds-execute-epic

Epic dev-phase orchestrator. Создаёт epic_branch, итеративно прогоняет каждую story через `/bmad-tds-execute-story` до `status=review`. **Stories НЕ мержатся в epic_branch здесь** — story_branches остаются висеть, ждут clean-context auditor.

**Принцип:** dev-phase отделён от review-phase ради clean-context invariant'а. Этот workflow только разрабатывает; cumulative epic verdict + delivery — задача `/bmad-tds-code-review` Mode 2. После того как execute-story per story squash'нул свой branch в `epic_branch` и оставил `status=review`, auditor смотрит cumulative diff `epic_branch vs main` свежим контекстом: **approved** → apply-verdict flip stories `review → approved` + epic `in-progress → approved`, затем `tds deliver` squash epic → main + engineer flip `approved → done` для всех stories + epic; **changes-requested** → apply-verdict flip problem-stories `review → rework`, halt с findings; rework делается как fix-commit поверх epic_branch (через `/bmad-tds-execute-story <id>` на rework'имой story — orchestrator детектит status=rework и работает на новой story_branch от epic_branch tip).

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

## Process — orchestration steps

| # | Step | Что делает | Делегация |
|---|------|-----------|-----------|
| 1 | orient + preflight | `tds orient`, `tds preflight check --action=epic-execute` (canonical PreflightAction enum: `install\|story-execute\|epic-execute\|story-review\|epic-finalize\|archive-phase\|migrate` — см. `src/preflight/check.ts`; не предполагай других имён и не выдумывай bash wrappers — `tds` CLI invokes everything, нет `_bmad/tds/scripts/*.sh`). Проверяет: working tree clean, нет других in-progress эпиков (INV-09 single-in-progress-epic), `tds-execution-state.yaml` либо отсутствует, либо относится к текущему эпику. **При detected legacy execute-state от другого эпика** — halt + ОДНОстрочный prompt пользователю: «Найдено execute-state от epic-N (started YYYY-MM-DD). Очистите перед стартом: `rm <output>/_tds/runtime/tds-execution-state.yaml`. Продолжить?» Не пытаться мигрировать. | — |
| 2 | **bridge dependencies check** | Парсит `sprint-status.yaml.epics[<id>].tds.depends_on_bridges[]`. Если есть unfinished bridges (`status != done`) → halt + RB-pointer «complete bridge first» + suggestion: `tds epic bridge list --blocks=<id>`. | — |
| 2.5 | **bridge spec readiness gate** (only when `<id>` matches `bridge-*` pattern) | Для bridge-эпиков (id начинается с `bridge-`): запустить `tds epic bridge validate-specs --bridge=<id>` ПЕРЕД любой Step 3 mutation. Validator проверяет каждый story stub: `## Acceptance Criteria` и `## Tasks / Subtasks` должны содержать concrete items, не TBD placeholders. **На `ready: false`** → halt с одной строкой: `Author bridge specs per failures above, then run "tds epic bridge validate-specs --bridge=<id>" и rerun /bmad-tds-execute-epic <id>.` Не пытаться auto-fix, не делать `tds branch start`, не flip'ать sprint-status. **На `ready: true`** → continue к Step 3 normally. Non-bridge epics (regular `epic-N`) — skip this gate целиком. | — (CLI: `tds epic bridge validate-specs`) |
| 3 | create or resume epic_branch | `tds branch start --epic=<id>` (без `--story`). **Idempotent:** если registry уже содержит epic-integration entry для этого `epic_id` (story_id=null) — CLI возвращает existing entry, не throw'ит. Это позволяет resume orchestration на ветке, созданной в предыдущем прогоне. <br/>Если entry нет — CLI создаёт ветку `epic/<numeric>-<slug>` (имя берётся из `# Epic N: Title`-комментария в sprint-status), регистрирует с story_id=null, epic_id=<id>, base_branch=main. <br/>Если в git УЖЕ есть ветка от старого прогона со старым именем (`epic/10` без slug), но в registry её нет — orchestrator делает `tds branch attach --epic=<id> --branch=<existing-name>` ВМЕСТО `start`, чтобы adopt'ить её без переименования. <br/>В обоих случаях flip `epic-<id>: backlog → in-progress` в sprint-status через ruamel.yaml writer. | — |
| 4 | **iterate stories** — sequential dev + immediate squash (Full mode) | Для каждой story в epic.stories[] **по очереди**: <br/>(a) если spec `<impl_artifacts>/stories/<story-id>.md` отсутствует — sub-skill invocation `/bmad-create-story <story-id>`. <br/>(b) sub-skill invocation `bmad-tds-execute-story <story-id>` с `TDS_BASE_BRANCH=epic_branch`. Story создаёт `story_branch` от **текущего tip** epic_branch (содержит squashed stories предыдущих iteration'ов), проходит dev до `status=review`, **в Step 6 САМА squash-merge'ит story_branch → epic_branch** (через `tds branch merge`). story_branch deleted локально, registry flip merged. Story status остаётся `review` (ждёт final approve в Mode 2). <br/>(c) Следующая iteration: новая story_branch создаётся от **обновлённого** epic_branch tip — видит код всех предыдущих squashed stories. Cross-story visibility natural. <br/>**После цикла:** все stories=`review`, epic_branch содержит N squash-коммитов (по одному на story в порядке dispatch'a). | bmad-create-story (BMAD-native) + bmad-tds-execute-story workflow |
| 5 | handoff к code-review Mode 2 | Epic dev-phase complete. epic_branch имеет cumulative diff (все stories squashed sequentially). Output к user'у: «Epic <id>: dev-phase complete. N stories squashed в epic_branch (по одному коммиту на story). Все stories=review. Запусти `/bmad-tds-code-review --epic=<id>` — clean-context auditor посмотрит full diff `epic_branch vs main`. **approved** → apply-verdict flip stories `review → approved` + epic `in-progress → approved`, затем `tds deliver` squash epic → main + engineer flip `approved → done` для всех stories + epic. **changes-requested** → halt с findings; rework делается как fix-commit поверх epic_branch (через `/bmad-tds-execute-story <id>` на rework'имой story — orchestrator детектит status=rework и работает на новой story_branch от epic_branch tip).» | — |
| 6 | **state-commit sweep** | После Step 5 — `tds state-commit -m "chore(<epic-id>): execute-epic session sweep" --story=<epic-id> --as=engineer`. Sweep аккумулирует epic-level state mutations что не покрыли child execute-story sweeps (например epic-branch registry attach/start, sprint-status epic flip). Idempotent — typically no-op если каждый child execute-story session корректно sweep'нул свои mutations. | — (CLI) |

**Важные инварианты:**
- Stories не запускаются параллельно (одна за одной) — orchestrator sequential для предсказуемости + memory-injection cascade'а + immediate cross-story visibility (каждая следующая видит squashed предыдущих).
- **Stories squash-мержатся в epic_branch внутри execute-story Step 6** — это **ключевая** механика этого workflow vs alternatives. epic_branch постепенно растёт по мере прохождения stories.
- **Cross-story dependencies решаются natural'но** — sequential squash означает story-3 видит весь код 1+2 в своей dev base.
- Epic-уровневый PR не открывается этим workflow. Открывает `code-review Mode 2` через `tds deliver` после approve полного эпика.
- Если в среде stories обнаруживается blocker, требующий bridge — halt orchestration + suggestion `/bmad-tds-retro` для proposal bridging epic.

## Examples

```
<example>
User: «Execute epic E-2 (oauth-integration)»
Process:
  [Step 1 orient+preflight] tds orient: no in-progress epic. preflight check OK.
  [Step 2 bridge check] sprint-status.epic-2.tds.depends_on_bridges = ["bridge-1-5"].
                        bridge-1-5.status = "done". OK, продолжаем.
  [Step 3 create] tds branch start --epic=epic-2 --as=engineer → epic/2-oauth-integration. Base = main.
                  Registry append: epic/2-oauth-integration entry. Sprint-status: epic-2 → in-progress.
  [Step 4 iterate stories — sequential dev + squash]:
    2-1-personality-system (frontend): /bmad-tds-execute-story SP-21 → frontend role.
        Step 6: tds branch merge --as=frontend --story=SP-21 --target=epic/2-oauth-integration --message="SP-21: personality system".
        epic/2-oauth-integration теперь содержит коммит "SP-21: personality system".
        story/SP-21 deleted. Status SP-21=review.
    2-2-chat-interface (backend Python): /bmad-tds-execute-story SP-22 → python role.
        story_branch создаётся от epic/2-oauth-integration tip (содержит SP-21).
        Видит код SP-21 — может строить chat-interface поверх personality-system.
        Step 6: squash → epic/2-oauth-integration. Теперь содержит SP-21 + SP-22.
    2-3-llm-integration (frontend integration): /bmad-tds-execute-story SP-23 → frontend.
        story_branch от epic/2-oauth-integration tip (SP-21 + SP-22). Видит обе.
        Step 6: squash → epic/2-oauth-integration. Содержит SP-21 + SP-22 + SP-23.
  [Step 5 handoff] Output: «Epic-2 dev-phase complete. 3 stories в state=review,
                  все squashed в epic/2-oauth-integration (3 коммита).
                  Run /bmad-tds-code-review --epic=epic-2 — clean-context auditor смотрит
                  full diff epic/2-oauth-integration vs main:
                    approved → tds deliver: squash epic → main, flip stories done, cleanup.
                    changes-requested → halt с findings; rework как fix-commit (re-run
                    /bmad-tds-execute-story SP-X на той story что нужно поправить —
                    orchestrator detect'ит status=in-progress и работает на новой
                    story_branch от epic_branch tip).»
</example>

<example>
User: «Execute epic E-3»
Process:
  [Step 1 orient] tds orient: epic-2 still in-progress (epic_branch exists, stories some in review).
  [Halt INV-09] exit 4 + WARN: «Epic-3 cannot start; epic-2 still active. Complete or abandon epic-2 first.
                Use /bmad-tds-code-review --epic=epic-2 to finalize, или manual abandon через
                tds branch remove --branch=epic/2-oauth-integration.»
</example>

<example>
User: «Execute epic bridge-10-11» (bridge с TBD specs, ready=false)
Process:
  [Step 1 orient+preflight] OK.
  [Step 2 bridge dependencies] N/A (bridge сам — нет depends_on_bridges).
  [Step 2.5 bridge spec readiness gate] tds epic bridge validate-specs --bridge=bridge-10-11
                                         → bridge bridge-10-11: NOT ready (failures=8, warnings=0)
                                           bridge-10-11-1-foo: fail (AC TBD placeholder, Tasks TBD)
                                           bridge-10-11-2-bar: fail (AC TBD placeholder, Tasks TBD)
                                           bridge-10-11-3-baz: fail (AC TBD placeholder, Tasks TBD)
                                           bridge-10-11-4-qux: fail (AC TBD placeholder, Tasks TBD)
  [Halt PR-3] «Author bridge specs per failures above, then run
               `tds epic bridge validate-specs --bridge=bridge-10-11` и rerun
               /bmad-tds-execute-epic bridge-10-11.»
  → NO branch creation, NO sprint-status mutation. Stub specs остались как были,
    bridge остаётся в backlog. User открывает каждый stub, заполняет AC/Tasks из
    `## Sources (deferred from)` + originating specs/findings/retro Bridge Plan,
    re-runs validator → ready: true → rerun /bmad-tds-execute-epic bridge-10-11.
</example>

<example>
User: «Execute epic bridge-10-11» (after authoring, ready=true)
Process:
  [Step 1 orient+preflight] OK.
  [Step 2 bridge deps] N/A.
  [Step 2.5 bridge spec readiness gate] tds epic bridge validate-specs --bridge=bridge-10-11
                                         → bridge bridge-10-11: ready (failures=0, warnings=0)
  [Step 3 create epic_branch] tds branch start --epic=bridge-10-11 → epic/10-11-tech-debt.
                              sprint-status: bridge-10-11 backlog → in-progress.
  [Step 4 iterate] sequential execute-story per bridge-10-11-{1..4}-* stub.
  [Step 5 handoff] «bridge-10-11: dev-phase complete. Run /bmad-tds-code-review --epic=bridge-10-11.»
</example>
```

## Constraints

- Respond to user in {communication_language}.
- Generate deliverables in {document_output_language}.

- **Forbidden-quadrant:** workflow-skill вне matrix. На каждый делегированный `tds <cmd>` в Step 4 передавай explicit `--as=<role>` flag (engineer / domain / auditor) — единственный источник роли; env-vars сознательно не читаются. Workflow-skill сам не делает code-write напрямую.

- **Karpathy working principles:**
  1. **Think Before Coding** — Step 2 bridge-check surface'ит blockers ДО создания epic_branch (не «как-нибудь разберёмся в процессе»).
  2. **Simplicity First** — НЕ применяется в Lite mode. Lite пользователи могут только `/bmad-tds-execute-story` с trunk-mode commits.
  3. **Surgical Changes** — orchestrator не модифицирует stories или их content; только координация. **Никаких direct commit'ов в epic_branch** — все commits идут через story_branches.
  4. **Goal-Driven Execution** — success criterion для этого workflow: все epic.stories[] = `review` + story_branches push'нуты. Auditor verdict + merge — задача code-review Mode 2.

- **INV-09 single in-progress epic** (per worktree): только один эпик может быть active на worktree. Проверяется в Step 1 preflight.

- **Lite mode НЕ ИСПОЛЬЗУЕТ этот workflow** — Lite default `branch.mode: trunk`; epic-as-integration не применяется. Если пользователь в Lite вызывает `/bmad-tds-execute-epic` — halt + suggestion: «Epic execution requires Full profile. Either re-bootstrap with `/bmad-tds-setup install --profile=full` (idempotent — preserves user-state, переключает profile flag в `state-manifest.tds_meta`), либо use /bmad-tds-execute-story sequentially в trunk mode.» (Отдельного `setup upgrade --to=full` subcommand'a у CLI нет — profile меняется через re-run install'a с новым `--profile=`.)

- **Терсность halt-output'ов.** При detected blocker в любом step'е orchestrator эмитит максимум:
  1. одну строку с типом блокера (`working tree dirty`, `legacy execute-state`, `bridge unfinished`, etc.);
  2. одну строку с конкретной командой пользователю для resolve;
  3. одну строку «Продолжить после resolve?».

  НЕ предлагать A/B/C-tree вариантов, НЕ перечислять альтернативы, НЕ объяснять архитектурные причины. Пользователь либо resolve'ит и говорит «продолжай», либо отменяет. Это **direct mode**: orchestrator существует чтобы автоматизировать, не чтобы консультировать. Для consultation flow — `/bmad-tds-navigator`.

- **Закрытый список halt-conditions.** Halt'ить orchestration разрешено ТОЛЬКО по этим причинам:
  1. working tree dirty (Step 1);
  2. legacy execute-state от другого эпика (Step 1);
  3. INV-09 single-in-progress-epic conflict (Step 1);
  4. unfinished bridge dependency (Step 2);
  5. **bridge spec readiness gate fail** (Step 2.5) — `tds epic bridge validate-specs --bridge=<id>` вернул `ready: false`; bridge stub specs всё ещё с TBD AC/Tasks. Halt без branch / sprint-status mutation;
  6. `/bmad-create-story` fail из-за incomplete planning-artifacts data (Step 4);
  7. `/bmad-tds-execute-story` returned hard failure — tests red, ambiguous spec, executor reported blocker (Step 4 — halt + ОДНОстрочный prompt);
  8. exit 4 (forbidden-quadrant deny) или exit 5 (RUNTIME) от any CLI call;
  9. user явно сказал «stop» / «pause» / «остановись» в running session.

  **Не halt-condition:**
  - оценка «multi-hour» / «не вместится в одну сессию» / «займёт долго» — orchestrator работает столько, сколько нужно;
  - «natural checkpoint после Step 3» / «boundary между story N и N+1» — таких boundary НЕ существует;
  - желание дать пользователю review состояния перед continue — pipeline идёт от Step 1 до Step 5 без user-facing pause'ов, кроме (1)–(8) выше;
  - **отсутствие auditor verdict** — этот workflow в принципе verdict не делает. Дойти до status=review всех stories и закончить.

  Если orchestrator в сомнении — НЕ halt'ить. Continue до следующего legitimate halt-condition или Step 5. User видит весь output после завершения, не до.

## References

- `workflow.md` — детальный flow.
- `references/inv-09-single-epic.md` — почему single-in-progress (concurrency, integrity, telemetry).
- `references/sequential-vs-parallel-stories.md` — обоснование sequential mode (vs параллельная разработка stories).
