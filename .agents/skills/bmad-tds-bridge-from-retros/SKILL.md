---
name: bmad-tds-bridge-from-retros
description: |
  Собирает curated pre-epic из накопленных `## Bridge Plan` секций retro-md'ов. Активируется на phrases: «собери pre-epic из техдолга», «bridge-эпик из ретро», «build pre-epic from retros». Симметрично bmad-create-epic — input это accumulated tech-debt вместо business-PRD.
---

# bmad-tds-bridge-from-retros

Workflow-orchestrator для **bulk-create pre-epic из накопленных retro plans**. Не делается автоматически после каждого retro (по решению user'a 2026-05-05) — user накапливает несколько retros и собирает один curated bridge-эпик одной командой.

**Когда использовать:**
- В конце нескольких циклов разработки накопилось N ретроспектив, каждая с `## Bridge Plan` секцией.
- Перед стартом следующего main-эпика хочется закрыть техдолг.
- Хочется один консолидированный pre-epic, а не N мелких bridge'ев.

**Что делает в итоге:**
- В sprint-status появляется `bridge-N-N+1: backlog` + N stories `bridge-N-N+1-K-<slug>: backlog`.
- Каждый processed retro получает маркер `## Applied to bridge: <bridge-id> @ <iso>` (idempotency).
- Под `<impl_artifacts>/stories/<bridge-N-N+1-K-slug>.md` появляются **stub spec файлы** с title, justification, sources — но `## Acceptance Criteria` и `## Tasks / Subtasks` начинают с TBD placeholders (applier не выдумывает product intent).
- **Authoring path (two routes):**
  1. **LLM-assisted (default opt-in prompt после Step 5)** — workflow agent reads stub Sources + originating story specs / `## Auditor Findings` / `### Completion Notes List` / retro `## Bridge Plan` / referenced ADRs, synthesizes AC + Tasks, writes back via `Edit` tool, validates через `tds epic bridge validate-specs`. Halts с structured missing-context list если sources contradict / too abstract / non-resolvable.
  2. **Manual (opt-out via `--no-author` flag, or декline LLM prompt)** — user заполняет каждый stub вручную по «Recovery / authoring pattern» section.
- **Bridge остаётся в `authoring-pending` state до validator passes**: `/bmad-tds-execute-epic <bridge-id>` halts через bridge spec readiness validator если AC/Tasks остались как TBD placeholders (validator's hard rule).

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

### Step 1 — Execute prepend steps

Execute each entry в `{workflow.activation_steps_prepend}`.

### Step 2 — Load persistent facts

Treat `{workflow.persistent_facts}` как foundational session context.

### Step 3 — Load BMAD config

Из `{project-root}/_bmad/bmm/config.yaml`: `{user_name}`, `{communication_language}`, `{document_output_language}`, `{project_knowledge}`, `{impl_artifacts}`.

### Step 4 — Apply principles

Combine Karpathy 4 principles + `{workflow.principles}` (team additions).

### Step 5 — Execute orchestration

Proceed to «Process» section ниже.

---

## Process — orchestration steps

| # | Step | Что делает | Делегация |
|---|------|-----------|-----------|
| 1 | **scan unprocessed retros** | Read `<output_folder>/<impl_artifacts>/retros/`. Filter все retro markdown файлы без `## Applied to bridge:` маркера. Accepted filename patterns: `retro-<anything>.md` (TDS-canonical) AND `<prefix>-retro-<anything>.md` (BMAD-native, e.g. `epic-13-retro-2026-05-07.md`). `_-prefixed` файлы (scratch / applied-marker) skipped. Если пусто → halt с сообщением «no unprocessed retros — nothing to bridge». | — |
| 2 | **aggregate Bridge Plan sections** | Для каждого unprocessed retro распарсить `## Bridge Plan` YAML-блок. Heading accepts optional numbering prefix: `## Bridge Plan`, `## 6. Bridge Plan`, `## 6.1 Bridge Plan` — все matched. Aggregate всех candidates со всех retros. Candidates с одинаковым title (case-insensitive) merge'атся в одну bridge story; sources внутри объединённой story дедуп'aтся. | — |
| 3 | **delegate to auditor (clean context)** | Sub-skill invocation в новой clean-context session. CLI calls use `--as=auditor`. Auditor reviews aggregate plan: что осмысленно консолидировать дальше (например, объединить два adjacent candidates в один scope), что отложить, что разделить. **Output: refined plan** (тот же YAML-формат, что и input). Это второй уровень curation после Step 2 mechanical merge. | auditor (read-only) |
| 4 | **present к user** | Show structured плана: bridge-id (auto-derived из --blocks), type, list of N stories с title + sources count + retro-paths. User: «Accept all / accept selected / edit titles / cancel?» На accept без правок → continue Step 5. На edit — write modified plan в temp retro-md (`<retros>/_bridge-plan-<timestamp>.md`) и call CLI с `--retros=<path>`. | — |
| 5 | **invoke CLI applier** | `tds epic create-bridge-from-retros --as=engineer --blocks=<next-epic-id> --retros=<comma-separated-paths>` (либо `--all-unprocessed` если accept all без правок). Applier создаст atomically: sprint-status (root + N stories backlog), extension entry, **bridge story spec markdown файлы под `<storiesDir>/<bridge-N-M-X-slug>.md`** (idempotent — existing files preserved; bmad-create-story skill отказывается принимать bridge naming, поэтому applier пишет minimal-valid template сам — closes the gap where `/bmad-tds-execute-epic` halt'ил on missing specs), Applied marker в каждом retro, bridge-epic-events JSONL emit с `story_specs_created_count`. На success — output `bridge-id + N story-ids + retros applied + N spec'ов created`. **AC + Tasks остаются TBD placeholders** — applier вписывает только title/justification/sources в template-form. Authoring — отдельный Step 5.5 (opt-in) либо manual fallback (см. «Recovery / authoring pattern» section). | engineer (state-set) |
| 5.5 | **authoring sub-flow (opt-in, LLM-assisted)** | После Step 5, **prompt user**: «Author N stubs now via LLM-assisted synthesis? [yes / no (default no = manual fallback)]». На `--no-author` flag к workflow invocation — skip этот шаг целиком, переход к Step 6. На `yes`: для каждого stub под `<storiesDir>/<bridge-N-M-X-slug>.md`: <br/>(a) **Gather source context** — read stub's `## Sources (deferred from)` lines (1-N entries: `\`<story-id>\` (kind=auditor-finding, round=N, finding_index=K)` или `\`<story-id>\` (kind=completion-note) — <ref>`). Для каждого source: read originating `<storiesDir>/<story-id>.md`; locate referenced finding (parse `## Auditor Findings (round-N)` headings, match by index) OR completion note (parse `### Completion Notes List`, match by ref text). Also read retro `## Bridge Plan` candidate (the YAML block which seeded this stub) и любые ADRs referenced в source text (`_docs/spec/decisions/NNNN-*.md`). <br/>(b) **Synthesize content** — pattern: 1-N concrete `## Acceptance Criteria` items (numbered list) that define «what does done mean для this consolidated scope», derived from source intents; 1-N actionable `- [ ]` Task checkboxes под `## Tasks / Subtasks` (TDD-shaped: e.g. `- [ ] Task 1 — write failing tests covering AC #1`, `- [ ] Task 2 — implement minimal change passing tests`, optional `- [ ] Task 3 — refactor / integration verification`). <br/>(c) **Write back via `Edit` tool** — replace exact TBD placeholder strings (`_(TBD — fill before execute. ...)_`) с authored content. Preserve all other spec sections untouched (Status, Story, Sources, Dev Agent Record). <br/>(d) **Halt conditions** (structured per-stub missing-context output, не silent best-guess): <br/>&nbsp;&nbsp;• source spec не найден / не readable; <br/>&nbsp;&nbsp;• sources contradict (e.g. completion-note says «X done», finding says «X broken в different scope»); <br/>&nbsp;&nbsp;• source intent too abstract (retro Bridge Plan говорит «improve X» без specifics; finding text — single sentence без actionable detail); <br/>&nbsp;&nbsp;• synthesized AC count == 0 или Task count == 0. <br/>(e) **Post-authoring validation** — после всех stubs authored, run `tds epic bridge validate-specs --bridge=<bridge-id>` automatically; на `ready: false` surface failures и halt for user manual fixes. | — (workflow-level LLM synthesis + validator CLI) |
| 6 | **state-commit sweep** | После Step 5 (или Step 5.5 if invoked) — `tds state-commit -m "chore(<bridge-id>): bridge from <N> retro(s), <M> stories" --story=<bridge-id> --as=engineer`. Sweep аккумулирует ВСЕ mutations applier'а одним aggregate commit: sprint-status, extension, retro markers, story spec markers (если были finding-source markers), authoring writes (если Step 5.5 ran). Idempotent + never-throws. | — (workflow-level) |

**Final output (three-branch — depends on authoring path):**

1. **authoring-pending — manual fallback** (workflow invoked с `--no-author` flag, or user declined Step 5.5 LLM prompt): «Pre-epic `bridge-N-N+1` создан с M story stubs. Applied to N retro(s). **Не запускай `/bmad-tds-execute-epic <bridge-id>` пока AC/Tasks не заполнены** — каждый stub под `<impl_artifacts>/stories/<bridge-story-id>.md` содержит TBD placeholders. Author AC/Tasks из `## Sources (deferred from)` каждого stub'а + originating story specs / `## Auditor Findings` / `### Completion Notes List` / retro `## Bridge Plan`, затем `tds epic bridge validate-specs --bridge=<bridge-id>` → если passes, run `/bmad-tds-execute-epic <bridge-id>`.»
2. **authoring-pending — partial authoring** (Step 5.5 ran, some stubs halted на missing-context): «Pre-epic `bridge-N-N+1` создан. K of M stubs authored через LLM synthesis. Remaining M-K stubs halted на missing context: <per-stub structured reasons>. Author the remaining stubs manually (см. «Recovery / authoring pattern»), validate, run execute-epic.»
3. **execution-ready** (Step 5.5 ran, all stubs authored, validator passed): «Pre-epic `bridge-N-N+1` created с M stubs, **AC/Tasks synthesized via LLM and validated**. Ready for `/bmad-tds-execute-epic <bridge-id>`. Review authored content в каждом stub before invocation if you want sanity-check.»

Workflow никогда **не** утверждает execution-readiness без validator confirmation — option 3 only после `tds epic bridge validate-specs` returned `ready: true`.

## Bridge Plan format (input contract)

Skill читает retro-md'ы созданные `bmad-tds-retro` workflow'ом. Каждый retro содержит секцию `## Bridge Plan` с YAML-блоком (см. `bmad-tds-retro` SKILL.md → «Bridge Plan section format» для полной схемы):

```yaml
proposed_at: 2026-05-05
type: tech-debt              # spike | tech-debt | refactor | infra | dependency-upgrade
candidates:
  - title: <short imperative title>
    justification: <1-2 phrases>
    sources:
      - story: <story-id>
        kind: completion-note | auditor-finding
        ref: <text>           # для completion-note
        round: <N>            # для auditor-finding
        finding_index: <K>    # для auditor-finding
```

## Examples

```
<example>
User: «Собери pre-epic из накопленного техдолга»

Process:
  [Step 1 scan]: Found 3 retro docs:
    - retro-epic-9.md (NOT applied)
    - retro-epic-10.md (NOT applied)
    - retro-epic-8.md (## Applied to bridge: bridge-7-8 @ 2026-04-15 — skip)

  [Step 2 aggregate]: 5 candidates total из 2 unprocessed retros.
    - "Wire notification subscribers" (sources: 9-3, 10-5, 10-7) — merged
    - "Quality team-scope hardening" (source: 10-6 finding round-1#1)
    - "Refactor PluginRegistry" (sources: 9-2, 9-4) — merged

  [Step 3 auditor refines]: «PluginRegistry refactor шире чем bridge может вынести; recommend разделить на 2 stories: API + tests.»
    → updated plan: 4 candidates вместо 3.

  [Step 4 present]:
    «Pre-epic plan для blocks=epic-11:
       1. Wire notification subscribers (3 sources)
       2. Quality team-scope hardening (1 finding)
       3. PluginRegistry API refactor (1 source)
       4. PluginRegistry tests refactor (1 source)
     Applied to retros: retro-epic-9.md, retro-epic-10.md
     Accept all?»
    User: «Yes»

  [Step 5 invoke]:
    tds epic create-bridge-from-retros \
      --as=engineer \
      --blocks=epic-11 \
      --retros=retro-epic-9.md,retro-epic-10.md

  Output:
    bridge-10-11 (type=tech-debt, 4 story stubs, applied 2 retros).
    Stubs созданы под <impl_artifacts>/stories/bridge-10-11-{1..4}-*.md.

  [Step 5.5 prompt]: «Author 4 stubs now via LLM-assisted synthesis? [yes/no]»
  User: yes.

  Step 5.5 (LLM authoring) iterates каждый stub:
    bridge-10-11-1-wire-subscribers:
      Sources: epic-9-3, epic-10-5, epic-10-7 (kind=completion-note —
        notification subscriber stubs deferred).
      Read originating specs + notes → synthesize:
        AC 1: NotificationSubscriber registered в DI + invoked by
              NotificationDispatcher production path.
        AC 2: Idempotent on duplicate delivery (dedup window 5s).
        AC 3: Failure path emits subscriber-events JSONL.
        Tasks: [ ] write failing tests covering AC 1-3;
               [ ] implement subscriber + DI wiring;
               [ ] integration test exercising production path.
      Write back via Edit, replace TBD placeholders.
    bridge-10-11-2-...: authored similarly.
    bridge-10-11-3-...: HALT — source intent too abstract («clean
      up PluginRegistry API» — no specific surface mentioned in
      finding). Marked for manual authoring.
    bridge-10-11-4-...: authored.

  Step 5.5 post-validation: tds epic bridge validate-specs --bridge=bridge-10-11
    → 3/4 stubs ready, 1/4 fails (bridge-10-11-3 has TBD AC/Tasks).

  Output (option 2 — authoring-pending, partial):
    bridge-10-11: 3 of 4 stubs authored via LLM synthesis.
    1 stub halted на missing context:
      bridge-10-11-3-refactor-plugin-registry — source intent too
      abstract (finding text: «refactor PluginRegistry» без specifics).
    Author this stub manually (см. «Recovery / authoring pattern»),
    re-run `tds epic bridge validate-specs --bridge=bridge-10-11`,
    then run `/bmad-tds-execute-epic bridge-10-11`.
</example>

<example>
User: «Bridge from retros --no-author --all-unprocessed» (explicit manual fallback)
Process: same as above до Step 5; Step 5.5 skipped entirely
  (`--no-author` flag passed).
  Output (option 1 — authoring-pending, manual): identical к pre-PR
  «author AC/Tasks manually, validate, run execute-epic» message.
</example>

<example>
User: «Bridge from retros», но нет unprocessed retros.

Process:
  [Step 1 scan]: All 3 retro-*.md files have `## Applied to bridge:` marker.
  Halt с сообщением: «No unprocessed retros — nothing to bridge. (3 retros already applied to existing bridges.)»
</example>
```

## Constraints

- Respond to user in {communication_language}.
- Generate deliverables in {document_output_language}.

- **Forbidden-quadrant:** workflow-skill вне matrix. Step 3 auditor delegation — `auditor × review-read = allow`, `auditor × code-write = deny`. Step 5 CLI вызов под `--as=engineer` (matrix `engineer × state-set = allow`). Auditor НЕ пишет в sprint-status — это invariant peer-review.

- **Karpathy working principles:**
  1. **Think Before Coding** — Step 3 auditor refines aggregate plan перед apply. Не «merge всех findings одним dump'ом».
  2. **Simplicity First** — bulk-applier в одном transactional walk'е (bridge entry + N stories + Applied markers + JSONL emit), не цепочка из N independent CLI calls.
  3. **Surgical Changes** — applier пишет только те retros которые в `--retros` list или `--all-unprocessed` resolve'ит. Никаких side-effects на другие retros.
  4. **Goal-Driven Execution** — success criterion: pre-epic появился в sprint-status и готов к `/bmad-tds-execute-epic`. Не «retro doc красивый».

- **Idempotency.** Маркер `## Applied to bridge: <id> @ <iso>` дописывается в retro-md после успешного applier-run. Re-run skill scan'ит и skip'ает retros с маркером. CLI applier дополнительно throw'ает если все resolved retros уже applied.

- **Stub-only spec generation.** Skill **создаёт** story spec файлы под `<impl_artifacts>/stories/<bridge-story-id>.md`, но строго в stub-форме: title / justification / `## Sources (deferred from)` populated из retro Bridge Plan candidate; `## Acceptance Criteria` и `## Tasks / Subtasks` остаются **TBD placeholders**. Это намеренная boundary: applier не выдумывает product intent — author/user заполняет AC/Tasks сам (либо через optional authoring step, либо вручную). BMAD-canonical `bmad-create-story` skill отказывается принимать bridge-naming, поэтому applier пишет stub'ы сам, чтобы `/bmad-tds-execute-epic` не падал на missing specs. Execute-epic preflight validator (`tds epic bridge validate-specs`) гарантирует что bridge не запустится до того как stub'ы authored.

- **Closed list of halt-conditions:**
  1. Step 1: `<retros>/` директории нет или нет unprocessed retros — halt.
  2. Step 2: parsing failure (malformed YAML, missing fenced block, unknown type) — halt с file/line context.
  3. Step 4: user declined / cancelled — halt.
  4. Step 5: CLI applier exit ≠ 0 — halt с stderr показанный user'у.
  5. Step 5.5 (when invoked): missing/contradictory/abstract source context per stub — halt с structured per-stub list; remaining stubs authored may proceed к Step 6 (validator caught the rest), unauthored stubs require manual fallback per «Recovery / authoring pattern».
  6. Step 5.5 post-authoring validator returned `ready: false` — halt с per-stub failure list; user fixes manually, re-runs validator.
  7. user явно сказал stop/pause.

## Recovery / authoring pattern

Authoring path branches на two routes per «Что делает в итоге»:

- **LLM-assisted route** (Step 5.5 opt-in) — agent reads sources +
  synthesizes AC/Tasks + writes back; validator runs auto. Halt
  cases yield structured per-stub missing-context list, user picks
  up failing stubs manually (steps 1-5 below).
- **Manual fallback route** (`--no-author` flag, declined LLM
  prompt, или resuming after partial LLM authoring) — user follows
  steps 1-5 below per stub.

**Authoring per stub** (`<impl_artifacts>/stories/<bridge-story-id>.md`):

1. Open stub. Под title — `## Sources (deferred from)` уже populated
   (story-id'ы originating findings / completion notes / retro
   candidate); читай sources как ground-truth для intent.
2. Pull originating context per source: relevant story spec, его
   `## Auditor Findings` round entries, `### Completion Notes List`,
   plus retro `## Bridge Plan` candidate text + retro `## What broke /
   what to bridge` discussion. Local ADR(s) и docs упомянутые в source
   text — туда же.
3. Replace `_(TBD - fill before execute...)_` под `## Acceptance Criteria`
   на конкретные AC items (1-N bullets, выводимые из source intent).
4. Replace `_(TBD - break down before execute...)_` под `## Tasks /
   Subtasks` на actionable `- [ ]` checkboxes (test-author phase + impl
   phase + integration, как в любой story).
5. Repeat для каждого stub под bridge.

**Validate:** `tds epic bridge validate-specs --bridge=<bridge-id>`
(PR-2). Output: per-story `ready=true|false` + failures[] + warnings[].

**Re-run** `/bmad-tds-execute-epic <bridge-id>` только после
`ready: true` для всех stub'ов. Preflight (PR-3) сам халтит если
validator не passes.

**No rollback by default.** Authoring — additive write в existing stub
файл; не нужно удалять sprint-status entries или retro markers. Rollback
оправдан только если bridge grouping fundamentally wrong (e.g. Step 4
user accept'нул plan который при reread выглядит off-scope) — тогда
manually delete entries + revert Applied markers + restart workflow.

### Recovery for existing applied bridges (legacy stub problem)

Если в проекте уже есть bridge'ы созданные ДО v6.3.1 — `tds epic
create-bridge-from-retros` написал stub'ы и потенциально
`/bmad-tds-execute-epic` уже запустился поверх них (raw TBD AC/Tasks
прошёл legacy без validator). Recovery — additive authoring, без
rollback:

1. Identify stuck bridge: `tds epic bridge list --status=in-progress`
   плюс просмотр sprint-status. Если `bridge-N-M` в `backlog` но stub'ы
   уже на месте — recovery — просто authoring (steps 1-5 выше).
2. Если bridge уже `in-progress` (legacy execute-epic flip'нул его), и
   какая-то story внутри тоже мутировала status (e.g. tests-pending,
   in-progress) поверх TBD spec'a:
   - Halt the active story session (если идёт). `tds story status
     --story=<id>` для verification.
   - Author AC/Tasks в stub'е (steps 1-3 выше). Spec body — append-only
     edits в existing file; sprint-status / branch-registry / retro
     markers НЕ трогать.
   - Run `tds epic bridge validate-specs --bridge=<bridge-id>` →
     ready: true для всех stub'ов.
   - Re-enter execute через `/bmad-tds-execute-epic <bridge-id>` —
     orchestrator detect'ит existing epic_branch / current sprint-
     status statuses и picks up откуда были. Никаких branch deletions
     не нужно.
3. Когда rollback всё-таки оправдан: bridge grouping fundamentally
   wrong (Step 4 user accept'нул plan который оказался off-scope при
   reread). Тогда — manual sequence: `tds story reset --story=<id>
   --to=halted --as=auditor` per affected story → manually delete
   sprint-status entries + extension bridge entry → revert
   `## Applied to bridge:` markers в retro-md → restart workflow.
   Это последний resort; default — author existing stub'ы.

## References

- `payload/workflows/bmad-tds-retro/SKILL.md` — где `## Bridge Plan` секция формируется (источник input).
- CLI: `tds epic create-bridge-from-retros --help` — applier-уровень contract.
- CLI: `tds epic bridge validate-specs --help` — readiness validator (v6.3.1+).
