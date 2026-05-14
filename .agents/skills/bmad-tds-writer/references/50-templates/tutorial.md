# Tutorial template

> Diátaxis: **Tutorial** (learning-oriented).
> Audience: developer onboarding (Persona 1) — first contact, learning by doing.
> Length: 800-2500 words. Step-by-step с verified outputs.

---

```markdown
# Tutorial: <Outcome the learner achieves>

By following this tutorial, you'll <achievement, concrete>.

This tutorial assumes:
- <prerequisite tool / version>
- <prerequisite knowledge — minimal>

**Time:** ~<estimate> minutes.

## What you'll build

(1-3 sentences describing the end state. Optionally screenshot / diagram.)

## Step 1 — <First action>

(1-2 paragraphs of context — what we're doing in this step + why.)

```bash
<command>
```

You'll see:

```
<expected output, abbreviated if long>
```

If your output differs — see [Troubleshooting](#troubleshooting).

## Step 2 — <Next action>

(Same pattern.)

```bash
<command>
```

Expected: <description>.

(Continue Steps 3, 4, 5, ... as needed. Each step ≤ 100-150 words context + commands + expected output.)

## Step N — Verify the result

(Final verification — what did learner achieve.)

```bash
<verification command>
```

You should see: `<exact output>`.

🎉 You've built <achievement>.

## What you learned

- (Concrete fact 1)
- (Concrete fact 2)
- (Concrete fact 3)

## Next steps

- **To go deeper:** [Explanation: Why TDS uses X](../adr/...)
- **To solve specific problems:** [How-to guides](../how-to/)
- **To look up API:** [Reference](../reference/)

## Troubleshooting

### Step 2 — `<exact error>`

This usually means <specific cause>. Try: <specific fix>.

### Step 3 — `<exact error>`

(One troubleshooting entry per known failure mode. NOT exhaustive — just observed cases.)

If your issue не in this list — file an issue с runbook RB-06 doctor bundle attached.
```

---

## Notes for writer

### Tutorial principles (Diátaxis canon)

1. **Always works.** Tutorial должен work end-to-end. Test before publish. NOT «this should work, mostly» — fix the path.
2. **Single happy path.** No «Option A or Option B». No conditional branches («if Linux do X, if macOS do Y» — split tutorials или provide both verbatim).
3. **Concrete actions.** «Run `tds preflight check`» NOT «Run preflight».
4. **Minimum explanation.** Why = Explanation quadrant; tutorial = doing. Brief context sentence per step OK; not paragraph.
5. **Maintained example.** Same project / data throughout. NOT switching examples per step.

### What NOT в tutorial

- ❌ API enumeration («here are all subcommands of `tds`»). That's reference.
- ❌ Trade-offs discussion («`StateFlow` vs `LiveData` — depends on...»). That's explanation.
- ❌ «Optional steps» — anti-pattern. If optional, leave out; tutorial должен work without.
- ❌ Edge cases — those are how-to.

### Verified outputs

- Test the commands AS WRITTEN. NOT «this should output something like».
- Quote exact output (or representative excerpt с `# truncated` marker).
- Update output если version changes change format.

### Time estimate

- Be honest. If tutorial honestly takes 45 min, say 45. Not «10 minutes».
- Onboarding dev (Persona 1) drops out если tutorial advertised 10 min reaches 30 with no end visible.

### Reading test (Karpathy #4)

«Onboarding developer copies all commands as-is, achieves stated outcome в advertised time.»

Failed → rewrite. Likely fixes:
- Missing prerequisite (учли OS-specific gotchas?).
- Skipped step (mentally inserted assumed action).
- Outdated commands / version (tools changed; tutorial out of date).

### TDS tutorials (suggested)

- **«First story with TDS»** — install → configure → first execute-story → verdict.
- **«Setting up multi-stack project»** — Python backend + React frontend; primary_specialist routing.
- **«From Lite to Full mode»** — upgrade profile, branch-mode change.
- **«Custom techstack-pack»** — extending domain role-skill для team-specific style.

Each ~30-60 minutes. Tutorial ≠ documentation; Tutorial = guided experience.
