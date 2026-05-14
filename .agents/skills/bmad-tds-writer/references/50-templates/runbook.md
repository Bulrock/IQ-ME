# Runbook template

> Diátaxis: **How-to** (problem-oriented).
> Audience: ops engineer at 3 AM (Persona 3) — high stress, low patience.
> Length: 200-600 words. Action-first.

---

```markdown
# RB-NN: <Symptom or trigger condition>

**Severity:** P0 (production down) | P1 (degraded) | P2 (warning) | P3 (informational)

**Last verified:** YYYY-MM-DD

## Symptom

What the operator sees / what triggered this runbook.

«Exit code 26 from `tds integrity verify` with `failedEntries[].path` под `_bmad/bmm/sprint-status.yaml`.»

> Pick a real, observable symptom — exit code + конкретное человекочитаемое
> stderr/stdout сообщение. `TDS-ERR:*` symbols декларированы в
> `_docs/spec/registry/error-codes.yaml` как design-time mapping, но runtime
> их прямо в stderr сейчас не печатает — не пиши их как ожидаемое сообщение
> в Symptom (см. `payload/workflows/bmad-tds-setup/runbooks/README.md`
> «TDS-ERR symbols vs runtime stderr»).

## Pre-conditions

What must be true before running steps.

- You have shell access to project root.
- TDS module installed (`_bmad/tds/` exists).
- BMAD installer ≥ v6.5.0.

## Steps

### Step 1 — <action>

```bash
<exact command>
```

You should see: `<expected output>`.

If different output, see [Escalation](#escalation).

### Step 2 — <action>

```bash
<exact command>
```

You should see: `<expected>`.

### Step 3 — <action>

(Continue as needed; usually 3-7 steps.)

## Verification

After all steps, confirm fix:

```bash
<verification command>
```

Expected output: `<exact text or pattern>`.

If verification fails — see [Escalation](#escalation).

## Escalation

If steps don't resolve OR verification fails:

1. **Capture state:**
   ```bash
   tds doctor bundle --output=/tmp/tds-incident-<ts>.tar.gz
   ```
2. **Notify oncall:** <channel / contact>.
3. **Reference this runbook by ID:** `RB-NN`.

## Context (optional)

(Why this happens — *brief* explanation. NOT essay. ≤2 paragraphs.)

«Exit 41 indicates BMAD installer copied `_bmad/tds/` but one or more files have unexpected sha256. Common causes: antivirus quarantined a file; disk corruption; partial install due to network interruption.»

## Related

- ADR-XXX (if relevant decision context).
- Other runbooks (RB-MM if symptoms overlap).
- Code: `<file:line>` where logic lives.
```

---

## Notes for writer

### Severity classification

- **P0** — production down / data loss risk. Page immediately.
- **P1** — degraded but functional. Address within hours.
- **P2** — warning, address within day.
- **P3** — informational, no action required (но runbook exists для context).

### Action-first structure

Operator at 3 AM scans first 10 lines:

1. Title (symptom they see).
2. Severity (how urgent).
3. Pre-conditions (do они apply).
4. Step 1 command (immediate action).

If они don't get to Step 1 в 30 seconds — runbook fails. Karpathy #2 Simplicity First.

### Each step must be:

- **Singular action** (not 3 things at once).
- **Verifiable** («You should see X»).
- **Reversible если possible** (or warn если irreversible).

### Common pitfalls

- ❌ Long «Background» section before steps. Background goes к bottom (Context).
- ❌ Multiple alternative paths early («If you have GitHub, do A; if GitLab, do B; if local repo, do C»). Move alternatives to per-step inline; or split runbooks per platform.
- ❌ Vague «Try X». «Try» — anti-pattern. Specific command или branch decision.
- ❌ Missing verification. Operator не знает if fix worked.
- ❌ No escalation path. Operator stuck if step fails.

### TDS-specific runbooks

Standard set:

- **RB-06: Doctor bundle generation** — when capturing state for support.
- **RB-07: Snapshot corrupt recovery** — exit 27 (auxiliary artefact corrupt).
- **RB-08: Install halt recovery** — exit 41 (payload integrity / staging swap failed).
- **RB-09: Integrity drift recovery** — exit 26 + integrity context (sha256 mismatch).
- **RB-10: Migration recovery** — exit 44/45 (schema migration partial halt).

(Each follows this template, customized к specific symptom.)

### Reading test (Karpathy #4)

«At 3 AM, woken by pager, can ops engineer find this runbook + complete steps within 10 minutes?»

If стресс-test simulation fails — runbook broken; rewrite.
