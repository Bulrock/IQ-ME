---
name: bmad-tds-generate-docs
description: |
  Documentation update orchestrator. Активируется на phrases: «generate docs», «update README», «create documentation», «write CHANGELOG», «add ADR for decision X». Делегирует auditor (drift detection), затем writer (prose generation — НЕ engineer, writer специализирован на тексте). Inline code-comments — это code-write, не doc-update (engineer/domain в story-flow).
---

# bmad-tds-generate-docs

Документация — отдельная компетенция от кода. Этот workflow НЕ запускается из `bmad-tds-execute-story` для inline-comments — те остаются в scope engineer/domain. Запускается:
- Standalone: пользователь явно просит обновить README/CHANGELOG/ADR/runbook.
- В составе `bmad-tds-execute-epic` Step 5 (docs aggregation после всех stories эпика).
- В составе `bmad-tds-archive-phase` для phase-summary generation.

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
| 1 | orient + scope determination | `tds orient`. Из user-prompt extract scope: какие docs обновлять (README, CHANGELOG, ADR, runbook, all), какой trigger (epic completion, manual update, phase archive). | — |
| 2 | delegate to auditor (drift detection) | Sub-skill invocation, mode=docs-drift. CLI calls use `--as=auditor`. Auditor read'ит current docs state vs project state (recent commits, recently merged epics, lessons added). Output: list of «what's stale» + «what's missing». | auditor (read-only) |
| 3 | confirm scope с пользователем | Present auditor's drift-list к user'у: «Detected stale: README quickstart (last updated 2 mo ago). Missing: ADR for OAuth choice (decision in epic-2 not documented). Update which?» Karpathy #1 surface assumptions. | — |
| 4 | delegate to writer (prose) | Sub-skill invocation. CLI calls use `--as=writer`. Writer applies Diátaxis classification (tutorial / how-to / reference / explanation), audience-mapping, content-pack templates (`50-templates/`). Karpathy adapted for prose. | writer |
| 5 | integrity record (если doc — integrity-tracked) | Если updated docs включают integrity-tracked artefacts (ADR, runbooks под `_bmad/tds/runtime/doctor/`, или specifically marked в state-manifest) → `tds integrity record`. README / CHANGELOG обычно не tracked. | — |
| 6 | emit telemetry | `state-transitions` событие для doc-update (через `tds story update` CLI call). | — |
| 7 | **state-commit sweep** | Финальный workflow shaq — `tds state-commit -m "chore(docs): generate-docs sweep" --as=engineer`. Sweep аккумулирует TDS-managed mutations этой sessions (state-manifest.yaml updates от integrity record, sprint-status flips). Doc-files сами (README, CHANGELOG, ADR md) — НЕ под TDS-managed whitelist'ом, их commit'ит engineer через обычный `tds commit -- <doc-paths>`. Idempotent + never-throws. | — (CLI) |

**Особый случай — inline code-comments в Python/Swift/etc.:**
- НЕ scope этого workflow. Это часть code-write в `bmad-tds-execute-story` Step 4 — engineer/domain пишет comments вместе с кодом.
- Если user говорит «add docstrings to module X» → орчестратор предлагает: «This is code-write task; better handled by /bmad-tds-execute-story SP-NN-add-docstrings или delegate to <python|other> domain skill directly.»

## Examples

```
<example>
User: «Update README — quickstart section is stale»
Process:
  [Step 1 scope] Target: README.md, section quickstart.
  [Step 2 auditor] Reads README.md vs recent commits. Output:
                  «Quickstart references `npm start` but project moved to `pnpm dev` (commit 3 weeks ago).
                   Also missing OAuth setup step (added in epic-2 story-3).»
  [Step 3 confirm] Present к user: «Two updates: (1) pnpm command, (2) OAuth setup. Both?»
                   User: «Both.»
  [Step 4 delegate writer] sub-skill: writer. CLI calls use --as=writer.
                  Writer Frame: audience = developer onboarding; Diátaxis = tutorial.
                  Plan: update quickstart bash block (Karpathy #3 Surgical), add OAuth subsection.
                  Execute: Edit README.md. Karpathy #2 Simplicity — no marketing speak.
                  Verify: «reading test» — новичок прочитает за 5 min, запустит проект; OK.
  [Step 5 integrity] README не integrity-tracked → skip.
  [Step 6 telemetry] state-transitions logged.
  Output: «README updated: quickstart now uses pnpm; OAuth setup section added.»
</example>

<example>
User: «Generate ADR for our OAuth provider choice (epic-2 decision)»
Process:
  [Step 1 scope] Target: new ADR doc.
  [Step 2 auditor] Reads epic-2 stories' completion-notes, integrity registry для linked claims. Output:
                  «Decision: adopted OAuth provider (Auth0). Trade-offs documented in story-2.1 completion notes.»
  [Step 3 confirm] «Generate ADR-007: 'Use Auth0 for OAuth provider'? Diátaxis: explanation.»
                   User: «Yes.»
  [Step 4 delegate writer] writer use'ает references/50-templates/adr.md.
                  Frame: audience = future maintainers; Diátaxis = explanation.
                  Sections: context, decision, consequences, alternatives.
                  Karpathy #2: концисный (~1 page).
  [Step 5 integrity] ADR — integrity-tracked (per state-manifest entry). tds integrity record.
  Output: «ADR-007 created: docs/adr/007-auth0-oauth-provider.md. Integrity recorded.»
</example>
```

## Constraints

- Respond to user in {communication_language}.
- Generate deliverables in {document_output_language}.

- **Forbidden-quadrant:** workflow-skill вне matrix. Auditor delegation Step 2 — `auditor × review-read = allow`. Writer delegation Step 4 — `writer × code-write = allow³` (только doc-files).

- **Karpathy working principles:**
  1. **Think Before Writing** (Karpathy #1 adapted) — Step 3 confirm scope c user'ом ОБЯЗАТЕЛЬНО. Не «как-нибудь решим».
  2. **Simplicity First** — minimum updates necessary; не «улучшать всё document» если user просит про конкретный section.
  3. **Surgical Changes** — критично для writer. Step 4 delegation envelopes Karpathy #3 в writer's `## Constraints`. Writer не должен перерабатывать adjacent secciones.
  4. **Goal-Driven Execution** — «reading test» как acceptance criterion. Karpathy #4 для prose: «новичок прочитает за 5 min, запустит проект» / «ops найдёт runbook за <30 сек».

- **Делегация writer'у — обязательна для prose** (Step 4). Engineer/domain не подходит — у них scope code, не text quality. Writer имеет content-pack (Diátaxis cheatsheet, templates) — engineer не имеет.

- **Inline code-comments out-of-scope.** Routing к bmad-tds-execute-story если user явно просит «docstrings module X».

## References

- `workflow.md` — детальный flow.
- `references/diataxis-routing.md` — auditor's drift-detection rules.
- `references/doc-types-mapping.md` — README/CHANGELOG/ADR/runbook → Diátaxis quadrant.
