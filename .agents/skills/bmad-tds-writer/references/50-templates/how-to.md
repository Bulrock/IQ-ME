# How-to template

> Diátaxis: **How-to** (problem-oriented).
> Audience: existing developer / ops engineer with specific goal (Persona 2 / 3).
> Length: 300-700 words.

---

```markdown
# How to <achieve specific outcome>

(One-sentence summary of what this guide accomplishes.)

## Pre-conditions

What must be true before starting:

- <Tool / version>
- <Project state>
- <Permissions>

## Steps

### 1. <Action>

(1-2 sentences context.)

```bash
<command>
```

### 2. <Action>

```bash
<command>
```

(Continue 3-7 steps.)

## Verify

```bash
<verification command>
```

Expected: <description>.

## Troubleshooting

### <Specific failure mode 1>

<Symptom>: ...

<Fix>: ...

### <Specific failure mode 2>

<Symptom>: ...

<Fix>: ...

## Variants (optional)

If the user might choose between paths:

### Variant A: <Condition>

(When applies, abbreviated steps.)

### Variant B: <Condition>

(When applies, abbreviated steps.)

## Related

- Tutorial: [Learning <topic>](../tutorials/...) — if user is new.
- Reference: [<related API>](../reference/...).
- Explanation: [Why <decision>](../adr/...).
```

---

## Notes for writer

### How-to vs Tutorial

| | Tutorial | How-to |
|--|----------|--------|
| **Reader state** | New, learning | Working, has problem |
| **Outcome** | Skill / understanding | Specific result |
| **Optional steps** | NO | OK if branched cleanly |
| **Multiple alternatives** | NO | OK if user must choose |
| **Detailed explanation** | Brief context | Almost none — just enough |
| **Length** | Long (30-60 min) | Short (5-15 min) |

### How-to vs Reference

| | How-to | Reference |
|--|--------|-----------|
| **Format** | Step-by-step recipe | Comprehensive enumeration |
| **Reading time** | Sequential | Lookup |
| **Examples** | One canonical | Many entries |

### Karpathy #2 Simplicity для How-to

- ≤ 7 steps usually. Если больше — split into multiple how-to (composable).
- ≤ 3 troubleshooting entries — those are observed cases, NOT exhaustive list.
- ≤ 2-3 variants — если more, structure indicates user really needs separate how-to per condition.

### TDS how-to topics (suggested)

- «How to add a custom domain role-skill».
- «How to migrate sprint-status.yaml from BMAD-only to TDS-extended».
- «How to recover from halt-not-rollback (RB-09 wrapper)».
- «How to switch from trunk to branch-per-story mode».
- «How to add a custom techstack-pack fragment».
- «How to write a bridging epic for tech-debt».
- «How to verify integrity сверкой sha256s manually».
- «How to archive a phase + verify restore».
