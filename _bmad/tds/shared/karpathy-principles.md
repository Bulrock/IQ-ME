# Karpathy 4 working principles — TDS canonical reference

**Source-of-truth для четырёх принципов** упоминаемых в `## Constraints`
секции каждого role-skill (engineer / auditor / writer / navigator + 6
domain specialists) и в каждом workflow `## Constraints` (where appropriate).

## Origin

Andrej Karpathy's observations про LLM-coding pitfalls (recurring failure
modes when LLMs write production code), formalized в
[`forrestchang/andrej-karpathy-skills`](https://github.com/forrestchang/andrej-karpathy-skills)
(MIT). TDS adapts эти 4 принципа как behavioural anchors для каждого
mutating role-skill.

## The four principles (canonical names — НЕ менять)

Каждый SKILL.md `## Constraints` секция MUST содержать все четыре в
этом порядке, с этими точными именами (regex-checked в
`test/inv-karpathy-include-coherence.bats`):

### 1. Think Before Coding (writer/docs: «Think Before Writing»)

State assumptions explicitly. Surface ambiguity → ask, don't guess.
Plan ДО Execute. Не «сразу writeFile» — сначала understand: что просит
требование, какие constraints не описаны, какие данные нужны.

**Allowed name variants** (drift-guard `inv-karpathy-include-coherence.bats`
accepts both):
- `Think Before Coding` — engineer / domain specialists / auditor / navigator
- `Think Before Writing` — writer / generate-docs (Karpathy adapted для prose)

### 2. Simplicity First

Minimum viable change. Прямой путь над abstractions. Если решение в 50
строк — не пиши 200. Premature abstraction = future debt; concrete
implementation первой, abstraction только когда повторяющийся pattern
realised трижды.

### 3. Surgical Changes

Touch только то что в scope (story.file_list[], explicit task targets).
Adjacent code — leave untouched, даже если хочется «улучшить по дороге»
(most common failure mode). Refactor adjacent only когда становится
orphan от твоих changes (uncalled / type-broken).

### 4. Goal-Driven Execution

Verifiable success criterion ДО start. Каждый step должен иметь явный
test для «done?» — passing test, integrity record, AC satisfied. Без
verifiable goal — no commit, no state-flip.

## Role-specific clarifications

Каждый role-skill MAY (и часто DOES) добавить **role-specific
clarifications** под каждым принципом — что именно «Surgical Changes»
означает для writer'а (don't decorate adjacent docs) vs для auditor'а
(don't fix; only flag) vs для engineer'а (don't refactor adjacent
functions). Эти clarifications живут **inline в каждом SKILL.md**
`## Constraints` секции — это **по дизайну**, не drift.

Drift-guard `inv-karpathy-include-coherence.bats` проверяет только что
все 4 canonical names присутствуют в правильном порядке; bodies free
to vary per role.

## When to update this file

- Karpathy publishes revision principles → update canonical names + universal
  description here, propagate role-specific clarifications в каждом SKILL.md
  через separate sweep.
- TDS adds 5-й принцип → update bats guard count + add section here +
  add inline в каждом SKILL.md одним sweep'ом.
- Wording polish on universal description → update here only; role-specific
  clarifications не affected.

## References

- Source: [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) (MIT).
- ADR-0008 — customize.toml Step 0 ritual (где включение Karpathy mandated).
- `_docs/spec/tds-design.md` §3.1 — design rationale.
