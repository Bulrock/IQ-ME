# Audience Personas

> Writer's Step 1 (Frame) — declare audience explicitly. Tone, depth, jargon-level
> зависят от persona. Karpathy #1 Think Before Writing.

## 7 personas

### Persona 1: Developer onboarding (new contributor, day 0-3)

**Context:** First day на проекте. Cloned repo, читает README, пытается запустить локально.

**Goals:** «I want to clone, install, run the project в течение 30 minutes.»

**Pain points:**
- Стек незнакомый или slightly knowing.
- Не знает project conventions.
- Может legitimately не понимать, что делает каждая команда.

**Tone:** encouraging, simple language, copy-pasteable commands. NOT condescending. NOT marketing-heavy.

**What they need:**
- Quickstart (tutorial-style, 5-10 commands maximum to working state).
- Prerequisites explicit (versions, tools, accounts).
- Single happy-path. NO «if this doesn't work, try X».
- Single example (NOT alternatives at every step).
- Pointer to other docs after success: «Now that it runs, see [Architecture Overview] для context».

**Doc types:** README quickstart, Tutorial (`tutorial.md`), Contribution guide.

**Failure mode** if writer ignores this persona:
- README starts with «Architecture decisions» — onboarding dev sees wall of theory, bounces.
- README has 5 alternative install methods — onboarding dev paralyzed.
- Marketing speak («cutting-edge ai-driven framework») — dev distrusts, looks for actual technical content.

---

### Persona 2: Existing developer (working на feature, day N+1)

**Context:** Already onboarded; working на specific story / bug. Needs to look up something specific.

**Goals:** «I want to find the exact API/command/setting in <30 seconds.»

**Pain points:**
- Doesn't want to re-read tutorial для known concepts.
- Wants table / structured data, not prose.
- Knows project conventions; assume baseline.

**Tone:** technical, concise, structured. Don't explain «what is async/await» — assume baseline.

**What they need:**
- Reference docs (CLI commands, API endpoints, config keys, error codes).
- Code examples copy-pasteable.
- Cross-references to related docs.
- Predictable structure (every entry has same fields).

**Doc types:** Reference (CLI reference, API docs, error-codes registry, schema reference).

**Failure mode:**
- Lengthy intro paragraphs before getting to the actual reference table.
- Mixing «here's the API» с «and let me tell you why we chose it» — reference contaminated с explanation.
- Missing examples — reader must guess from signatures.

---

### Persona 3: Operations engineer (incident response, day stressful)

**Context:** Production incident at 3 AM. Pager went off. Looking for runbook.

**Goals:** «I want to find the runbook for this exact symptom in <30 seconds, follow steps, verify resolution.»

**Pain points:**
- High stress, low patience.
- Cognitive load already maxed.
- Needs unambiguous instructions.

**Tone:** action-first, no preamble. Clear pre-conditions. Each step verifiable.

**What they need:**
- Runbook structure: Symptom → Pre-conditions → Steps → Verification → Escalation.
- Bash commands копируются.
- Each step has «You should see X» verification.
- Escalation path explicit if step fails.

**Doc types:** Runbook (RB-06..RB-10), monitoring/alerting docs, oncall guide.

**Failure mode:**
- Runbook starts с «Background: in 2026 we decided to...» — ops engineer skips entire intro, may miss critical context.
- Multiple alternative paths — paralyzes under stress.
- Missing verification steps — ops doesn't know if fix worked.
- No escalation path — ops stuck.

---

### Persona 4: Future maintainer (re-opens 6+ months later)

**Context:** Inherited the project. Trying to understand «why was X chosen?». Considering changes that might break assumptions.

**Goals:** «I want to understand context + trade-offs + alternatives considered, so I don't redo the same mistakes.»

**Pain points:**
- Original authors gone or memory fading.
- May want to challenge old decision (legitimately).
- Needs evidence trail.

**Tone:** explanatory, balanced, trade-offs explicit. Document alternatives considered + why rejected.

**What they need:**
- ADRs (Architecture Decision Records): Context, Decision, Consequences, Alternatives.
- Design docs / system overview.
- Lessons learned (lessons.yaml).
- Links to original discussions / spec / requirements.

**Doc types:** ADRs, design docs, retrospective notes, lessons.

**Failure mode:**
- ADR с decision но без alternatives → maintainer can't tell if alternatives were considered or just missed.
- Design doc presents «the way» without context → maintainer assumes it's only-way, doesn't challenge.
- Missing trade-offs — maintainer doesn't see when defaults no longer apply.

---

### Persona 5: Stakeholder (PM / exec / customer-facing)

**Context:** Wants to understand outcomes / status / value, not implementation details.

**Goals:** «I want a 1-2 paragraph summary I can paste into board update / customer email.»

**Pain points:**
- Limited technical vocabulary.
- Limited time.
- Cares about outcomes, не process.

**Tone:** outcome-focused, low-jargon. Plain language. Quantify if possible.

**What they need:**
- Phase summaries (what shipped, metrics, next).
- Release notes (user-facing).
- Roadmap docs.
- Risk/decision summaries.

**Doc types:** Phase summary, release notes (Customer-facing CHANGELOG), one-pagers.

**Failure mode:**
- Phase summary lists 24 stories с technical names — stakeholder bounces.
- Acronyms without expansion — stakeholder doesn't know what TDS / BMAD / SLI are.
- Implementation details — irrelevant к outcome focus.

---

### Persona 6: External contributor / contributor

**Context:** Wants to submit PR / file issue. Доес not have repo write access yet.

**Goals:** «I want to know how to set up dev environment, what conventions to follow, how to file PR.»

**Pain points:**
- Project conventions unclear from outside.
- Code style might differ от their habits.
- Doesn't know CI requirements.

**Tone:** welcoming, expectations explicit. NOT gatekeeping. Yes there are rules, but they're achievable.

**What they need:**
- CONTRIBUTING.md (DCO / CLA если applicable, code style, test requirements).
- PR template (what reviewers look for).
- Issue template (reproduction steps требуются).
- Code of Conduct.
- License clarity.

**Doc types:** CONTRIBUTING.md, .github/PULL_REQUEST_TEMPLATE.md, CODE_OF_CONDUCT.md.

**Failure mode:**
- CONTRIBUTING demands «just follow project style» without explaining what that is.
- Hidden tests requirements — contributor PR fails CI, doesn't know why.
- No issue template — issues filed without reproduction steps, hard to triage.

## Audience priority — default order

If document scope is mixed and не указан single audience, default priority order:

1. **Persona 2 (Existing developer)** — most common reader того, что мы пишем.
2. **Persona 3 (Ops engineer)** — стресс-сценарий критичен для ошибок.
3. **Persona 1 (Developer onboarding)** — second-most common (first impression).
4. **Persona 4 (Future maintainer)** — long-term sustainability.
5. **Persona 5 (Stakeholder)** — non-developer, separate doc usually.
6. **Persona 6 (External contributor)** — narrower scope.

Override через `_bmad/custom/bmad-tds-writer.toml`:

```toml
[agent.audience-priorities]
# Override default order:
default = ["onboarding", "ops", "existing-dev", "maintainer", "stakeholder", "contributor"]
```

## Persona × Diátaxis quadrant — typical mapping

| Persona | Primary quadrant | Secondary |
|---------|------------------|-----------|
| Onboarding | Tutorial | How-to (когда blocked) |
| Existing dev | Reference | How-to |
| Ops | How-to (Runbook) | Reference (error codes) |
| Maintainer | Explanation (ADR) | Reference |
| Stakeholder | Explanation (high-level) | — |
| Contributor | How-to (CONTRIBUTING) | Reference (PR template) |
| AI agent / LLM coder | Reference (machine-parseable) | How-to |

If audience и quadrant mismatch (e.g., trying tutorial для ops engineer at 3 AM) — что-то wrong; rethink.

---

### Persona 7: AI agent / LLM coder

**Context:** Claude Code / Codex CLI / другой LLM activates skill через description matching, читает SKILL.md body, parses customize.toml, executes steps. Не имеет долговременной памяти; каждый turn — fresh context.

**Goals:** «Activate точный skill по триггерам пользователя; resolve customization без human-loop; execute steps deterministically; emit traceable telemetry.»

**Pain points:**
- Неоднозначные triggers в `description:` → wrong skill activates.
- Imperative форма vs descriptive — LLM хуже парсит conditional steps embedded в prose.
- Cross-references ломаются после install (`spec/...` → `_bmad/tds/skills/...`) — LLM не догадывается перепрошить.
- Bilingual descriptions (ru+en) дробят skill-discovery accuracy.
- Curse of knowledge: spec ссылается на ADR γ/δ/ε без объяснения «что значит».

**Tone:** machine-readable structure first, prose second. Bullets > paragraphs. Headings → numbered steps. Imperative voice. Glossary в начале (раскрывает аббревиатуры).

**What they need:**
- Frontmatter `description:` — short (≤200 chars), Anthropic spec-conformant, English-first.
- Imperative `## Process` со step-numbering (`Step 1.`, `Step 2.`).
- Acceptance Criteria (DoD) explicit per step (что значит «done»).
- Cross-references — relative paths через canonical aliases (`{skill-root}`, `{project-root}`, `{tds-runtime}`).
- Inline glossary новых терминов (forbidden-quadrant matrix, Class I, halt-not-rollback) — once-per-doc.
- Examples в структуре, которую можно скопировать как baseline (не «free-form prose»).
- Triggers явно разделены comma — иначе LLM группирует «navigator orient» как single-trigger.

**Doc types:** SKILL.md (frontmatter + body), customize.toml (heavy commented), error messages (`TDS-ERR:*` text), CLI help.

**Failure mode if writer ignores this persona:**
- Skill не активируется на user phrase, потому что description слишком абстрактен.
- Steps неоднозначны → LLM делает not-quite-right action, halt.
- Cross-references broken после install → LLM возвращает «file not found» к user'у.
- Bilingual mix снижает activation accuracy на ~20% (гипотеза, требует A/B eval).

**Test:** при разработке нового SKILL.md прогнать через 2 модели (Claude + Codex). Если activation rate >95% и steps execute deterministically на 5 typical inputs — skill готов к release.

> **Cross-ref:** Anthropic skills best-practices ([platform.claude.com/.../agent-skills/best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)), Anthropic skill-creator canonical (github.com/anthropics/skills).
