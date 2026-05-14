# Reference template

> Diátaxis: **Reference** (information-oriented).
> Audience: existing developer doing lookup (Persona 2).
> Length: variable; per-entry concise; can be 100+ entries в one ref doc.

---

```markdown
# <Subject> Reference

Brief introduction (≤3 sentences) — what this reference covers, how to navigate.

## Conventions used

(Optional but recommended если notation is non-obvious.)

- `<arg>` — required argument.
- `[opt]` — optional argument.
- `--flag` — option flag.
- `key=value` — key-value option.

## <Section 1: e.g., CLI commands>

### `<command-or-entry-name>`

<One-line summary>.

**Synopsis:**
```bash
<command> <args> [options]
```

**Description:**
<1-3 sentences>.

**Arguments:**
- `<arg1>` — description.
- `<arg2>` — description.

**Options:**
- `--flag1` — description.
- `--flag2=<value>` — description; default: `<default>`.

**Returns / Output:**
<format / schema / exit code>.

**Examples:**
```bash
<command> <example-1>
```
<expected output>

```bash
<command> <example-2>
```
<expected output>

**Errors:**
- `TDS-ERR:<CODE>` — when triggered, what to do.

**See also:**
- Related entries.

---

### `<next-command>`

(Same structure, repeated.)

---

## <Section 2: e.g., Configuration keys>

### `<config.key.name>`

**Type:** `<type>`
**Default:** `<default-value>`
**Description:** <1-3 sentences>.

**Example:**
```yaml
<key>: <value>
```

**See also:** ...

---

## <Section 3: e.g., Error codes>

### `TDS-ERR:<CODE>`

**Exit code:** <integer>
**Severity:** <P0|P1|P2|P3>
**Semantic:** <what happened>
**Recovery:** <pointer к runbook / fix>

---

## Index (alphabetical)

(Optional если ≥ 30 entries — alphabetical index for quick scan.)

- A: ...
- B: ...
- C: ...
```

---

## Notes for writer

### Reference principles (Diátaxis canon)

1. **Comprehensive.** All entries present (NOT cherry-picked).
2. **Predictable structure.** Every entry has SAME fields в same order.
3. **Authoritative.** Can be cited; accurate.
4. **Less prose, more structure.** Tables, definition lists, code blocks.
5. **No teaching.** No «remember to...» / «be careful with...» — those are how-to / explanation.
6. **No opinions.** «X is faster than Y» — explanation. Reference states facts: «X completes in O(log n)».

### What NOT в reference

- ❌ Tutorials embedded — wrong quadrant.
- ❌ Trade-offs / opinions — explanation.
- ❌ Why-это-так — explanation.
- ❌ How to use в context — how-to.

### Karpathy в reference

- **#2 Simplicity:** entry minimum needed. Don't pad с «Description: This command does X. It's a great way to do X. You'll find это useful when...» — что-то одно.
- **#3 Surgical:** when adding entry — don't reorganize existing entries «по дороге».

### Auto-generation viable

Reference docs often lend themselves to auto-generation:
- CLI reference от argument parser definitions.
- API reference от OpenAPI schema.
- Error codes reference от `error-codes.yaml`.
- Config reference от schema files.

If auto-gen possible — use it. Reduces drift. Manual reference docs accumulate inconsistencies.

### TDS references

| Reference doc | Source of truth | Auto-genable? |
|---------------|-----------------|---------------|
| CLI commands | `src-ts/cli/commands.ts` argparse definitions | Yes (script) |
| Error codes | `_bmad/tds/shared/error-codes.yaml` | Yes (script) |
| Forbidden-quadrant matrix | `_bmad/tds/shared/forbidden-quadrant.matrix.yaml` | Yes (markdown table from yq) |
| Config keys | TDS schemas + module.yaml prompts | Yes (script) |
| Skill list | `marketplace.json` plugins[].skills[] | Yes (script) |

### Reading test

«Reader knows the entry name (e.g., `tds preflight`); finds full reference в <30 seconds; entry self-contained (doesn't need to read 3 other entries first).»

Failed → reorganize:
- Sections too deep? Flatten.
- Cross-references too dense? Inline minimum.
- Entry too long? Split into smaller entries.
