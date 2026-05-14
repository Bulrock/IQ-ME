# Diátaxis Cheatsheet

> Diátaxis framework — структурирует documentation на 4 different квадранта.
> Каждый квадрант servir конкретному use-case + audience need.
>
> **Source:** [diataxis.fr](https://diataxis.fr/) — canonical framework by Daniele Procida.
>
> Use: writer's Step 1 (Frame) — declare quadrant explicitly. Karpathy #1 Think Before Writing.

## 4 квадранта (matrix)

| Quadrant | Orientation | When user reads |
|----------|-------------|------------------|
| **Tutorial** | Learning-oriented | I want to **learn** how to use this |
| **How-to** | Problem-oriented | I want to **solve** a specific problem |
| **Reference** | Information-oriented | I want to **look up** specific information |
| **Explanation** | Understanding-oriented | I want to **understand** how it works |

```
       ╭───────────────────────────╮
       │     PRACTICAL APPLICATION │
       │                           │
       │   Tutorial    │   How-to  │
       │   (learn)     │  (solve)  │
       ├───────────────┼───────────┤
       │ Explanation   │ Reference │
       │ (understand)  │ (look up) │
       │                           │
       │     THEORETICAL KNOWLEDGE │
       ╰───────────────────────────╯
        STUDY            WORK
```

## Decision tree — which quadrant?

Ask 2 questions:

**Q1: Is the user STUDYING or WORKING right now?**
- Studying → Tutorial OR Explanation.
- Working → How-to OR Reference.

**Q2: Does the user want PRACTICAL APPLICATION или THEORETICAL KNOWLEDGE?**
- Practical → Tutorial (study) OR How-to (work).
- Theoretical → Explanation (study) OR Reference (work).

## Quadrant details

### Tutorial — learning-oriented

**Purpose:** show beginners how to do something useful, get them experiencing success.

**Form:**
- Step-by-step concrete actions.
- Always works (verified happy path; no «if this doesn't work, try X»).
- Single, maintained example.
- Minimum explanation — focus on doing.

**Anti-patterns:**
- Reference info («here's the full API surface») — wrong quadrant.
- Multiple alternatives at every step — overwhelming.
- Discussion of trade-offs — distracting; that's Explanation.
- «Optional steps» — anti-pattern; user must follow exactly.

**Examples in TDS spec:**
- README quickstart.
- "First story with TDS" walkthrough.
- "Setting up your first BMAD module" guide.

---

### How-to — problem-oriented

**Purpose:** help someone working on real problem solve it.

**Form:**
- Recipe format: «To do X, follow these steps».
- Pre-conditions explicit: «You'll need: ...».
- Each step verifiable (you'll know if it worked).
- Multiple variants OK if user needs to choose («If you use GitHub, do A; if GitLab, do B»).

**Anti-patterns:**
- Teaching from scratch — wrong quadrant (that's Tutorial).
- API enumeration — wrong (Reference).
- Why-это-так — distracting (Explanation).

**Examples:**
- "How to add a custom domain role-skill".
- "How to recover from halt-not-rollback (RB-09)".
- "How to migrate from trunk to branch-per-story mode".

---

### Reference — information-oriented

**Purpose:** describe the machinery — accurate, complete, structured.

**Form:**
- Comprehensive enumeration.
- Predictable structure (every entry has same fields).
- Less prose, more tables/lists.
- Authoritative (can be cited).

**Anti-patterns:**
- Tutorials embedded — wrong (Tutorial).
- Opinions or trade-offs — wrong (Explanation).
- Long paragraphs — wrong format.

**Examples:**
- `tds` CLI command reference (all subcommands + flags).
- error-codes.yaml (registry).
- forbidden-quadrant.matrix.yaml (matrix).
- API endpoint specs.
- Config schema reference.

---

### Explanation — understanding-oriented

**Purpose:** illuminate concepts, give context, discuss alternatives & trade-offs.

**Form:**
- Discussion / essay / commentary.
- Why decisions were made (ADRs typically here).
- Compare alternatives.
- Conceptual not action-oriented.

**Anti-patterns:**
- Step-by-step instructions — wrong quadrant.
- API enumeration — wrong.
- «Click here, then click there» — wrong (How-to).

**Examples:**
- ADRs (decision records — context + decision + consequences + alternatives).
- "Why TDS uses tamper-evidence (sha256) instead of HMAC authentication".
- "Why TDS-CLI вызывается через `node bundle.js`, не через symlink".
- Architectural overview essays.

## Mixed-quadrant docs are ANTI-PATTERN

**Don't conflate quadrants in one doc.** Karpathy #2 Simplicity First — split into multiple docs если scope mixed.

Common bad pattern: **README with everything**:
- Quickstart (tutorial) — OK in README.
- Full CLI reference (reference) — extract to `docs/reference/cli.md`.
- Why-это-так architectural notes (explanation) — extract to ADRs.
- Detailed how-tos (how-to) — extract to `docs/how-to/`.

**Acceptable in README:**
- Brief description.
- Quickstart (tutorial-style, 5 min).
- Links to other docs by quadrant.
- Contributing pointer.

## TDS-specific mapping

| TDS doc | Quadrant | File location |
|---------|----------|---------------|
| README | Tutorial (mostly) + links | repo root |
| CHANGELOG | Reference (chronological) | repo root |
| ADRs (decision records) | Explanation | `docs/adr/` |
| Runbooks (RB-06..RB-10) | How-to | `_bmad/tds/skills/bmad-tds-setup/references/` |
| `tds-design.md` | Mixed (foundational) — Reference + Explanation | `spec/tds-design.md` |
| Story completion notes | Brief Reference | story-frontmatter `tds.completion_notes` |
| Phase summary | Explanation + Reference | `<archive>/phase-summary.md` |
| PR description | Brief Explanation (context for reviewer) | PR/MR body |
| Lesson (lessons.yaml entry) | Reference (avoid_pattern) + Explanation (lesson) | `<output_folder>/_tds/memory/lessons.yaml` |
| Retro summary | Explanation + Reference | `<output_folder>/_tds/runtime/doctor/retro-<id>.md` |
| Tutorial: «First story with TDS» | Tutorial | `docs/tutorials/first-story.md` |
| How-to: «Recover from halt» | How-to | `docs/how-to/recover-halt.md` |
| Reference: `tds` CLI commands | Reference | `docs/reference/cli.md` |

## Quick-decision flowchart

```
User asks: "Update <doc>" → writer applies:

1. What does user say? Sometimes explicit:
   "tutorial" → Tutorial.
   "how to fix X" → How-to.
   "explain why we chose X" → Explanation.
   "list of all subcommands" → Reference.

2. If unclear — ask audience first (see 20-audience-personas.md):
   - New developer onboarding → Tutorial.
   - Existing dev solving problem → How-to.
   - Existing dev looking up syntax → Reference.
   - Reviewer 6 months later → Explanation.

3. If still unclear — surface assumptions to user:
   "I see two interpretations: (a) tutorial-style walkthrough,
    (b) reference table of all options. Which fits your audience?"
```

## Reading test per quadrant (Karpathy #4 acceptance)

| Quadrant | Acceptance criterion |
|----------|---------------------|
| Tutorial | Beginner copies steps, achieves working result without external help. |
| How-to | Engineer with the problem can finish the task in stated time-box. |
| Reference | Reader finds specific entry in <30 seconds. Each entry self-contained. |
| Explanation | Reader builds mental model; can answer «why was X chosen?» |

If reading test fails → doc broken; rewrite.
