# ADR template (Architecture Decision Record)

> Diátaxis: **Explanation**.
> Audience: future maintainer (Persona 4) + reviewer (existing dev Persona 2).
> Format: [Markdown ADR](https://adr.github.io/madr/) — community standard.
> Length: 400-1500 words.

---

```markdown
# ADR-NNN: <Short noun phrase describing the decision>

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
- **Date:** YYYY-MM-DD
- **Deciders:** @author1, @author2 (или role: TDS-team)
- **Technical story:** link к story / issue / RFC if applicable

## Context

Why this decision is needed. What forces are at play (technical, business, team, external).

Это где writer establish'ит framing — что именно problem; what alternatives exist conceptually; what constraints apply.

Bad: «We need to choose a database.» (too vague — choose for what?)
Good: «We need persistent storage for TDS state-manifest with: (1) tamper-evidence integrity (sha256 over content); (2) human-readable diff в git history; (3) no external dependencies для TDS-runtime; (4) cross-platform (Windows / macOS / Linux). YAML matches all четыре constraints.»

## Decision

State the decision plainly. **One sentence summary** ideally, then expand.

«We use YAML for state-manifest format with ruamel.yaml round-trip preservation для writes, and we forbid direct YAML-write outside `tds` CLI (CI-guard inv-state-manifest-via-cli-only.bats).»

## Consequences

What becomes easier, harder, или impossible after this decision.

**Positive:**
- (specific positive consequence)
- (another)

**Negative:**
- (specific negative consequence — be honest)
- (another)

**Neutral / Trade-offs:**
- (what we accepted as cost)

Be explicit. Karpathy #1 — don't hide tradeoffs.

## Alternatives considered

For each alternative — why was it rejected (или partially considered)? Future maintainer needs this for re-evaluation 6 months later.

### Alternative 1: <Name>

Brief description.

**Why rejected:** (specific reason — was it tested? assumed? out-of-scope?)

### Alternative 2: <Name>

Brief description.

**Why rejected:** ...

### Alternative 3: <Name>

(Continue if applicable; usually 2-4 alternatives.)

## Related decisions

- Supersedes: ADR-XXX (if applicable)
- Superseded by: — (filled if this ADR ever replaced)
- Related: ADR-YYY, ADR-ZZZ (cross-references)

## References

- External docs / RFCs / blog posts that informed decision.
- Code locations affected (file:line).
- Discussion threads (issues / PRs / Slack archive если accessible).
```

---

## Notes for writer

### Title

- Noun phrase, NOT verb phrase. «Use sha256 instead of HMAC for integrity» (decision-as-action) actually OK, но «Storage format choice» (noun) also fine. Be specific.
- Number ADRs sequentially: ADR-001, ADR-002, ... Never reuse numbers.

### Status lifecycle

- **Proposed** — under discussion, not yet binding.
- **Accepted** — actively in force.
- **Deprecated** — no longer recommended, but artefacts remain (transition period).
- **Superseded by ADR-XXX** — replaced; see new ADR for rationale.

### Karpathy adapted

- **#1 Think Before Writing:** present alternatives — don't pick silently.
- **#2 Simplicity First:** ADR text concise. 1-page ADRs are good. Massive design docs split into multiple ADRs.
- **#3 Surgical Changes:** when writing follow-up ADRs, don't retroactively edit prior ones — supersede them с new ADR.
- **#4 Goal-Driven:** «Future maintainer can answer: why was X chosen, what alternatives existed?»

### Common pitfalls

- ❌ ADR с **Decision** but no **Alternatives** — maintainer doesn't know if alternatives were considered.
- ❌ ADR с marketing speak («This robust solution...») — Explanation should be neutral, not selling.
- ❌ ADR-as-tutorial («Here's how to use it») — wrong quadrant; that's a tutorial doc.
- ❌ ADR без date — temporal context lost.

### When to write ADR

- Architecture-level decisions (storage format, DI library choice, async vs sync).
- Long-term implications (security model, API design, data migration policy).
- Trade-offs the team will face again.

NOT for:
- Implementation details (what variable name, what file path) — code-comments / inline docs sufficient.
- Personal preferences (which IDE, which formatter setting) — `_bmad/custom/` overrides.

### Real example structure

Look at `tds-design.md §1.1 BMAD-compatibility principle` — that's an ADR worth of content captured inline. Likely should be extracted as ADR-001 for self-contained reference.

### TDS examples that need ADRs

- ADR-001: BMAD-compatibility (sprint-status MUST remain valid for pure BMAD).
- ADR-002: Tamper-evidence (sha256 registry) instead of HMAC authentication.
- ADR-003: Variant A — registry-based branch naming (vs regex parsing).
- ADR-004: Phase archival read-only restore semantics (no resurrection).
- ADR-005: TypeScript + esbuild bundle (vs shell scripts).
- ADR-006: Karpathy 4 принципа embedded в каждый role-skill.

(These are suggestions; project may number ADRs differently.)
