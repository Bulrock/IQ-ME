# Explanation template

> Diátaxis: **Explanation** (understanding-oriented).
> Audience: future maintainer (Persona 4) — wants to understand WHY.
> Length: 500-2000 words.

---

```markdown
# <Topic — concept or decision name>

(One-paragraph summary — what this doc explains. Why это relevant к reader.)

## Background / Context

What's the situation? Why is this topic worth explaining?

(2-4 paragraphs. Establish framing. Define terms used. Provide just enough context for the subsequent discussion.)

## The decision / approach / concept

State the core position plainly.

(1-2 paragraphs. The «what» — clear and unambiguous.)

## Why это chosen

What forces / requirements / trade-offs led к this?

- **Force 1:** <description>.
- **Force 2:** <description>.
- **Force 3:** <description>.

(2-4 paragraphs. The «why». Not opinions — analysis of forces.)

## How it works

Mechanism, not step-by-step.

(2-3 paragraphs. Explain the dynamics; не how-to. «State changes flow through... because... which means...».)

## Alternatives considered

What else was on the table? Why rejected?

### Alternative A: <Name>

(Description + why rejected. Be honest — don't strawman alternatives.)

### Alternative B: <Name>

(Same.)

## Trade-offs / Limitations

What's the cost we accepted?

- **Cost 1:** <specific>.
- **Cost 2:** <specific>.

(NOT «there are no downsides». Karpathy #1 — surface tradeoffs.)

## When this might change

Under what conditions would we revisit?

(1-2 paragraphs. Sets future maintainer's mental model для re-evaluation.)

## See also

- Related decisions (ADRs).
- How-to guides applying this concept.
- Reference docs.
- External references (RFCs, papers, blog posts).
```

---

## Notes for writer

### Explanation principles (Diátaxis canon)

1. **Discussion / commentary.** Like an essay, not instructions.
2. **Why, not how.** «Why» = explanation. «How» = how-to / tutorial.
3. **Trade-offs explicit.** Honesty wins respect.
4. **Alternatives considered.** Future reader needs evidence trail.
5. **Conceptual.** Not action-oriented.

### Explanation vs ADR

| | Explanation | ADR |
|--|-------------|-----|
| **Format** | Essay / discussion | Structured (Context, Decision, Consequences, Alternatives) |
| **Length** | Variable | 400-1500 words |
| **Status** | Living doc | Snapshot (Accepted / Superseded) |
| **Use case** | Concept / framework explanation | Specific decision |

ADR is a specialized explanation. Use ADR template for decisions; this template для broader concepts.

### Karpathy applied

- **#1 Think Before Writing:** explicit declaration of trade-offs / alternatives. No silent picks.
- **#2 Simplicity First:** Concise. 1500 words for foundational concept; не 5000.
- **#3 Surgical Changes:** when updating, match existing voice; don't reorganize entire doc.
- **#4 Goal-Driven:** «Future maintainer can answer «why X?» after reading.»

### Common pitfalls

- ❌ Marketing speak («robust», «scalable»). Drop.
- ❌ «It's important to note...» (filler). Drop.
- ❌ Step-by-step instructions embedded. Move them to how-to.
- ❌ API enumeration. Move to reference.
- ❌ Single perspective без acknowledging trade-offs. Karpathy #1 violation.
- ❌ Vague claims («generally faster», «usually preferred»). Quantify or qualify.

### TDS explanation topics (suggested)

- «Why TDS uses tamper-evidence (sha256) instead of HMAC authentication» — security model.
- «Why phase archives are read-only» — Karpathy #3 + audit trail integrity.
- «Why workflow-skills are orchestrators (not 'doers')» — separation of concerns.
- «Why Karpathy 4 принципа are mandatory» — empirical evidence on LLM coding pitfalls.
- «Why Variant A registry-based branch naming» — supersedes regex parsing.
- «Why TDD MANDATORY for TDS-runtime» — coverage thresholds and security/integrity-critical modules.

(Each ~800-1500 words; conceptual, not action.)
