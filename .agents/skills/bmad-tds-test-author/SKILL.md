---
name: bmad-tds-test-author
description: |
  Test-author phase orchestrator (ATDD + test-review with retry-loop). Активируется на phrases: «write failing tests for story X», «test-author phase для SP-N», «start ATDD for <story>». Делегирует BMAD TEA workflows (`bmad-testarch-atdd` + `bmad-testarch-test-review`) в clean-context subagents с inject'ом language-specific guidance (через `Skill(bmad-tds-<lang>)` consult-only mode) + corp testing standards. Финал = status=tests-approved (frozen tests, ready for impl) ИЛИ status=tests-needs-revision (cap exceeded, user разбирается).
---

# bmad-tds-test-author

Test-author phase: от `ready-for-dev` до `tests-approved`. Orchestrator только; реальная работа делегируется BMAD TEA module (Murat — Master Test Architect). Specialist потом приходит к **frozen failing tests** через `bmad-tds-execute-story` Step 4.

**Когда использовать:**
- Story в `ready-for-dev` state, AC сформулированы тестируемо.
- Test-discipline критична (security/integrity/auth/billing — anywhere where «тесты подогнаны под реализацию» неприемлемо).
- Standalone invocation OR через `bmad-tds-execute-story` Step 4-pre delegation.

**Что делает в итоге:**
- Failing test files в repo (committed как scoped commits через TDS).
- `tds integrity record --as=test-author` per test file (audit trail).
- Story state flipped к `tests-approved` (frozen — specialists приходят к готовым красным тестам).
- ATDD report + test-review verdict в `<output>/_bmad-output/test-artifacts/` (TEA-canonical paths).

**Hard dependency:** BMAD TEA module installed (`_bmad/tea/config.yaml` exists). Без TEA — halt at Step 1 с `TDS-ERR:DEP_MISSING_TEA_MODULE` инструкцией.

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

Treat `{workflow.persistent_facts}` как foundational session context.

### Step 3 — Load BMAD config

Из `{project-root}/_bmad/bmm/config.yaml`: `{user_name}`, `{communication_language}`, `{document_output_language}`, `{project_knowledge}`, `{impl_artifacts}`.

### Step 4 — Apply principles

Combine Karpathy 4 principles + `{workflow.principles}` (team additions).

### Step 5 — Execute orchestration

Proceed to «Process» section ниже. После завершения — execute `{workflow.activation_steps_append}`.

---

## Process — orchestration steps

| # | Step | Что делает | Делегация |
|---|------|-----------|-----------|
| 1 | **TEA dependency assert + spec read + state flip** | Hard-dependency gate: assert `_bmad/tea/config.yaml` exists; иначе halt с `TDS-ERR:DEP_MISSING_TEA_MODULE: bmad-tea-module not installed. Run: bmad install bmad-tea-module first.` Read story spec (`<impl_artifacts>/stories/<story-id>.md`) — extract AC, primary_specialist, file_list. Если spec отсутствует → halt: запусти `/bmad-create-story <story-id>` сначала. State flip: `tds state set --as=test-author --story=<id> --status=tests-drafting` (matrix: test-author × state-set = allow-conditional → tests-* targets allowed). | — (CLI + assertion) |
| 2 | **Specialist consultation (consult-only mode)** | Sub-skill invocation `Skill(bmad-tds-<primary_specialist>)` с menu code `CT` («Consult: provide test guidance for story X»). Specialist activates в **consult-only mode** — output ТОЛЬКО guidance markdown с секциями `Critical patterns`, `Framework gotchas`, `Forbidden anti-patterns`, `Coverage focus`. **No code, no CLI calls.** Если spec не имеет primary_specialist → activate `bmad-tds-engineer` CT mode. Output specialist'а сохраняется в `/tmp/test-author-consult-<story-id>.md`. | <primary_specialist> или engineer (consult only) |
| 3 | **Load corp-standards** | Read `{project-root}/_bmad/tds/shared/testing-standards/*.md` (TDS-defaults: forbidden-patterns, coverage-thresholds, framework-recipes, ac-mapping-rules). Поверх — team overrides из `{workflow.additional_resources}` paths (per-team docs). Compose в structured context briefing для TEA. | — (file read) |
| 4 | **Invoke ATDD (TEA delegation, clean-context subagent)** | Sub-skill invocation `Skill(bmad-testarch-atdd)` в **clean-context subagent**. Composed input: story AC + specialist guidance from Step 2 + corp-standards from Step 3. TEA self-orchestrates internal subagents через свой `runtime.canLaunchSubagents` probe — мы их **не управляем**. Output: failing test files written к repo (test paths matching pattern: `test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`, `*_test.go`, `test_*.py`, `*.bats`). | TEA `bmad-testarch-atdd` (clean-context) |
| 5 | **Per-test-file integrity record** | Для каждого written test file — `tds integrity record --as=test-author --files=<test-path>`. Handler-level path-filter (TI-2): test-author может integrity record только test-files; non-test paths → AUTHZ deny. Aggregate count для terminal output. | — (CLI loop) |
| 6 | **Invoke test-review (TEA delegation, **другой** clean-context subagent)** | Sub-skill invocation `Skill(bmad-testarch-test-review)` в **другом** clean-context subagent (independent verdict; желательно other model если runtime supports). Input: written tests from Step 4 + AC from spec. Verdict: `approved` ИЛИ `needs-revision` (со structured findings: missing AC mapping, fragility patterns, tautology, hardcoded values). Output: review report в `<output>/_bmad-output/test-artifacts/test-reviews/`. | TEA `bmad-testarch-test-review` (clean-context) |
| 7 | **Verdict routing + retry-loop** | Parse verdict: <br/>• `approved` → `tds state set --as=test-author --status=tests-approved`. Exit OK. Output user'у: «Story <id> в tests-approved (frozen). Specialist приходит через `/bmad-tds-execute-story`.» <br/>• `needs-revision` AND cycle counter < `{workflow.test_review_max_cycles}` (default 2) → re-invoke ATDD Create-mode (NOT Edit-mode — interactive only) с **augmented input**: original AC + findings prepended as additional constraints. Cycle counter ++. Loop back to Step 4. <br/>• `needs-revision` AND cycle counter ≥ cap → `tds state set --as=test-author --status=tests-needs-revision`. Halt с одной строкой: «Cap exceeded after N cycles. Findings: <category-summary>. User decides: (a) fix AC structurally → /bmad-create-story re-author; (b) manual edit tests + `/bmad-tds-execute-story --status=tests-approved`.» | — (CLI + retry control) |

**Final output (success):** «Story <id> в tests-approved. <N> failing tests committed; <N> integrity records; <K> retry cycles; review-verdict approved.»

**Final output (cap exceeded):** «Story <id> в tests-needs-revision after <cap> cycles. Findings categories: <list>. See test-artifacts/test-reviews/<latest>.md для details.»

## Examples

```
<example>
User: «Write failing tests для story 1-3-plant-data-model»
Story spec: AC #1..#4, primary_specialist=python.

Process:
  [Step 1] tea check ✓; spec read; state flipped к tests-drafting.
  [Step 2] Skill(bmad-tds-python) CT mode → guidance:
    «Critical patterns: pytest fixtures для async DB; Forbidden: time.sleep
     для timing; Coverage focus: edge cases на NULL plant_id»
  [Step 3] Loaded 4 corp-standards docs + team override (org-pytest-conventions.md).
  [Step 4] Skill(bmad-testarch-atdd) clean-context — written:
    tests/test_plant_data_model.py (4 test functions, all failing).
  [Step 5] tds integrity record --as=test-author --files=tests/test_plant_data_model.py — recorded.
  [Step 6] Skill(bmad-testarch-test-review) clean-context — verdict: needs-revision.
    Findings: «AC #4 не covered; test_create_plant tests реализацию через mocked DB instead of contract.»
  [Step 7 cycle 1 → re-invoke Step 4 with findings prepended to AC]
    Skill(bmad-testarch-atdd) — added test_plant_invalid_status (AC #4 covered);
    refactored test_create_plant к use real test DB.
  [Step 6 again] verdict: approved.
  [Step 7] state flipped к tests-approved.

Output: «Story 1-3-plant-data-model в tests-approved. 5 failing tests committed;
5 integrity records; 1 retry cycle; review-verdict approved.»
</example>

<example>
User: «Test-author phase для 2-1-checkout-validation»
Story spec: AC #1..#7 (very ambitious), primary_specialist=engineer.

Process:
  [Step 1..6] cycle 1 → needs-revision (5 of 7 AC covered).
  [Step 7 cycle 1 → re-invoke Step 4]
  [Step 6 again] verdict: needs-revision (6 of 7; AC #7 ambiguous — «system должна быть надёжной» не testable).
  [Step 7 cycle 2 = cap reached] state flipped к tests-needs-revision. Halt:

  «Cap exceeded after 2 cycles. Findings categories: AC-coverage-gap (AC #7
   ambiguous — «надёжной» не testable; reformulate как latency-budget /
   error-rate-cap). User decides:
     (a) fix AC #7 structurally → /bmad-create-story re-author 2-1-checkout-validation;
     (b) manual edit tests + tds state set --as=test-author --status=tests-approved.
   See test-artifacts/test-reviews/2-1-checkout-validation-cycle-2.md.»
</example>

<example>
User: «ATDD для 3-2-readonly-fix» (no TEA installed)

Process:
  [Step 1] _bmad/tea/config.yaml not found.
  Halt: «TDS-ERR:DEP_MISSING_TEA_MODULE: bmad-tea-module not installed.
   Run: bmad install bmad-tea-module first. Test-author phase delegates ATDD
   и test-review к TEA — hard dependency.»
</example>
```

## Constraints

- Respond to user in {communication_language}.
- Generate deliverables in {document_output_language}.

- **Forbidden-quadrant:** workflow-skill — orchestrator, вне matrix. Каждый делегированный `tds <cmd>` ОБЯЗАН содержать explicit `--as=test-author` flag. CLI calls в Step 1/5/7 use `--as=test-author`; Skill invocations в Step 2/4/6 — sub-skill activations (target skill defines its own role context). State flips test-author × state-set = allow-conditional (только tests-* targets — handler-level enforcement, см. `tds state set` policy gate).

- **Karpathy working principles:**
  1. **Think Before Coding** — Step 1 explicit assertion: TEA available, spec exists, AC формулированы testably (no «должна быть надёжной» wishlist).
  2. **Simplicity First** — retry-loop с cap=2 default. Не infinite-recovery; cap halt → user decides structural vs tactical fix.
  3. **Surgical Changes** — TEA writes только test files (matched by path-pattern). Product code untouched. Step 5 integrity record path-filter rejects non-test files (handler-level via test-author × code-write convention).
  4. **Goal-Driven Execution** — success criterion: `status=tests-approved` + N failing tests covering all AC + integrity records. Не «красивый ATDD report».

- **Clean-context invariant:** ATDD (Step 4) и test-review (Step 6) **обязаны** идти в **разных** clean-context subagents. Если runtime не предоставляет subagent capability и `enforce_clean_context = true` → halt с инструкцией пользователю прогнать вручную в отдельных сессиях. Single-context fallback **ослабляет** test-discipline guarantee — main value этого workflow в independent test-author и independent test-reviewer.

  **Host fallback details (CX-03).** Claude Code spawns child sessions implicitly при `Skill(bmad-testarch-atdd)` / `Skill(bmad-testarch-test-review)` invocation — clean-context достигается без user action. Codex spawns subagents только при explicit authorization (user invokes via `/skills` UI или говорит «spawn ATDD subagent for tests»). Если host не supports subagent capability ИЛИ не получена authorization — halt single line: «Test-author phase requires two clean-context subagents (ATDD writer + independent test-reviewer). Authorize subagent spawns в текущем host'е, либо run ATDD + test-review manually в отдельных sessions и rerun с `--status=tests-approved` после success.» Never silently degrade в single-context — invalidates independence invariant.

- **Frozen tests invariant.** После `tests-approved` test files — frozen. Specialist (engineer + 6 lang) НЕ может править их без `tds story unfreeze-tests --as=<specialist> --reason=<text>`. Это handler-level enforcement через matrix `<specialist> × test-edit-frozen = deny` + `test-author × test-edit-frozen = allow`.

- **Edit-mode НЕ используется в retry.** TEA `bmad-testarch-atdd` Edit-mode (`steps-e/`) — interactive only, нет programmatic findings input. Retry loop **обязан** идти через full re-invoke Create-mode (`steps-c/`) с findings prepended to AC briefing. Каждый run idempotent с точки зрения TEA (нет state между cycles на TEA-side).

- **Closed list of halt-conditions:**
  1. Step 1: TEA missing → `TDS-ERR:DEP_MISSING_TEA_MODULE` halt.
  2. Step 1: story spec missing → halt с recommend `/bmad-create-story`.
  3. Step 1: AC empty / not testable → halt: возврат к authoring (PM/engineer переформулирует).
  4. Step 4 / Step 6: TEA returns failure (config.yaml malformed, capability-probe failed) → halt с TEA stderr.
  5. Step 7 cap exceeded → halt at `tests-needs-revision`.
  6. user явно сказал stop/pause.

## References

- `payload/workflows/bmad-tds-execute-story/SKILL.md` — caller workflow (Step 4-pre delegates сюда после TI-6 integration).
- `payload/role-skills/bmad-tds-<lang>/SKILL.md` — specialist consultation targets (CT menu code added in TI-4).
- `payload/shared/testing-standards/*.md` — corp-standards scaffold (TI-5 deliverable).
- TEA upstream: `bmad-testarch-atdd` + `bmad-testarch-test-review` workflows in BMAD TEA module.
