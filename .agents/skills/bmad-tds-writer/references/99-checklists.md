# Pre-publish checklists

> Per-doc-type checklists. Writer's Step 5 (Verify) — run applicable checklist
> before declaring doc «ready».

## Universal checklist (every doc)

- [ ] **Audience declared** in Step 1 (Frame). Persona match per `20-audience-personas.md`.
- [ ] **Diátaxis quadrant declared.** Single quadrant (mixed-quadrant docs split, not conflated).
- [ ] **Voice + tense match** existing doc если update; default active second-person + present.
- [ ] **No marketing speak** (см. `70-anti-patterns.md` checklist).
- [ ] **No weasel words** (если hedge real — surface as fact).
- [ ] **No filler phrases** («It's important to note...»).
- [ ] **Vague pronouns resolved** («this/that/it» → named subject within 1 sentence).
- [ ] **Time-relative refs replaced** («recently» → version reference).
- [ ] **Generic link text replaced** («click here» → describe target).
- [ ] **Code blocks have language tags** (` ```python`, ` ```bash`, etc.).
- [ ] **Acronyms expanded** at first use (если не common — HTTP, JSON, etc.).
- [ ] **Sentence-length target** ~25 words avg.
- [ ] **Section depth ≤ 3** levels (h1/h2/h3).
- [ ] **Reading test** mentally simulated per audience persona — passes.

## README checklist

(Diátaxis: Tutorial + links, audience: onboarding dev.)

- [ ] **Hero/description ≤ 120 chars** — plain, what + why.
- [ ] **Quickstart works end-to-end.** Test commands AS WRITTEN before publish.
- [ ] **Prerequisites explicit** (versions, accounts, tools).
- [ ] **Single happy path** — no «Option A или B» в quickstart.
- [ ] **Time estimate** (30 min target для onboarding).
- [ ] **Link table к other quadrants** (tutorials, how-to, reference, ADRs).
- [ ] **CONTRIBUTING.md exists и linked.**
- [ ] **License clear** + linked.
- [ ] **Word count 300-800** (hard cap 1500).

## CHANGELOG checklist

(Diátaxis: Reference, Keep a Changelog format.)

- [ ] **Format header present** — points к Keep a Changelog 1.1.0.
- [ ] **`[Unreleased]` section first** (always present).
- [ ] **Categories used:** Added / Changed / Deprecated / Removed / Fixed / Security.
- [ ] **Past tense** entries («Added X», not «adds X»).
- [ ] **User-facing language** (not internal implementation jargon).
- [ ] **Breaking changes link к migration guide** (если applicable).
- [ ] **Compare URLs** at bottom (auto-generated по tags).
- [ ] **Version + date format consistent** ([1.2.0] - 2026-04-28).

## ADR checklist

(Diátaxis: Explanation, audience: future maintainer.)

- [ ] **Number sequential** (no gaps, no reuse).
- [ ] **Title — noun phrase**, specific.
- [ ] **Status + Date present.**
- [ ] **Context section** establishes framing.
- [ ] **Decision — single sentence summary** + expand.
- [ ] **Consequences explicit** — positive AND negative AND trade-offs.
- [ ] **Alternatives considered** — at least 2; «why rejected» specific.
- [ ] **No marketing speak** — Explanation should be neutral.
- [ ] **Word count 400-1500** (hard cap 1500).

## Runbook checklist

(Diátaxis: How-to, audience: ops at 3 AM.)

- [ ] **Severity declared** (P0/P1/P2/P3).
- [ ] **Symptom** matches what operator sees.
- [ ] **Pre-conditions explicit.**
- [ ] **Each step:** singular action + verifiable expected output.
- [ ] **Each command copy-pasteable** (no `$` prefix unless literal prompt).
- [ ] **Verification at end** — operator знает if fix worked.
- [ ] **Escalation path** present (if steps fail).
- [ ] **Last verified date** present.
- [ ] **Action-first structure** — no long «Background» before steps.
- [ ] **Word count 200-600** (hard cap 1000).
- [ ] **Reading test:** ops engineer at 3 AM finds + completes within 10 minutes — simulated.

## Tutorial checklist

(Diátaxis: Tutorial, audience: onboarding.)

- [ ] **Outcome stated upfront** (what learner achieves).
- [ ] **Prerequisites explicit + minimal.**
- [ ] **Time estimate** honest.
- [ ] **Single happy path** — NO conditional branches.
- [ ] **Each step has expected output** (verified).
- [ ] **Final verification** — learner confirms success.
- [ ] **«What you learned»** section — 3-5 concrete facts.
- [ ] **«Next steps»** linking к other quadrants.
- [ ] **Troubleshooting** — observed cases only (NOT exhaustive).
- [ ] **Word count 800-2500** (hard cap 4000).
- [ ] **End-to-end run-through tested** before publish.

## How-to checklist

(Diátaxis: How-to, audience: existing dev with problem.)

- [ ] **Title states outcome** (action-oriented).
- [ ] **Pre-conditions explicit** (tools, state, permissions).
- [ ] **Steps 3-7** typically (split if more).
- [ ] **Each step verifiable.**
- [ ] **Variants** OK if user must choose (clearly delimited).
- [ ] **Troubleshooting** — observed cases only.
- [ ] **Related doc links** — tutorial / reference / explanation pointers.
- [ ] **Word count 300-700** (hard cap 1200).

## Reference checklist

(Diátaxis: Reference.)

- [ ] **Predictable per-entry structure** — every entry has same fields в same order.
- [ ] **Entries comprehensive** (NOT cherry-picked).
- [ ] **No teaching / opinions / how-to embedded.**
- [ ] **Cross-references concise** (NOT entire entries restated).
- [ ] **Auto-genable consideration** — if applicable (CLI, API, schemas), is это auto-generated?
- [ ] **Index если ≥ 30 entries** (alphabetical, для quick scan).

## Explanation checklist

(Diátaxis: Explanation, audience: future maintainer.)

- [ ] **Background establishes framing** (2-4 paragraphs).
- [ ] **Decision / approach plainly stated.**
- [ ] **Why-это-так analysis** — forces / requirements / trade-offs.
- [ ] **How it works** — mechanism, not how-to.
- [ ] **Alternatives considered** — at least 2.
- [ ] **Trade-offs / Limitations** explicit.
- [ ] **«When this might change»** section — re-evaluation conditions.
- [ ] **No step-by-step instructions embedded** (move to how-to).
- [ ] **No API enumeration** (move to reference).
- [ ] **Word count 500-2000** (hard cap 3000).

## Story completion notes checklist

(Field в story-frontmatter.)

- [ ] **What was implemented** — 1-2 sentences.
- [ ] **Key decisions** — если applicable, brief rationale.
- [ ] **Lessons applied** — confirm injected lessons (if relevant).
- [ ] **Deferred items** — future improvements identified.
- [ ] **Notes для retro** — flagged для retrospective.
- [ ] **Word count 50-200** (hard cap 300).
- [ ] **No marketing-speak** («great», «excellent», «successfully»).

## PR description checklist

(Body для `tds pr create`.)

- [ ] **Summary** — 1-3 sentences with story link.
- [ ] **AC table** — each AC + status + verified-by.
- [ ] **File list** matches story.frontmatter.tds.file_list[].
- [ ] **Lessons applied** noted (if any).
- [ ] **Tests info** — count + coverage delta.
- [ ] **Migration / breaking changes** disclosed.
- [ ] **Reviewer guidance** — what to focus on; out-of-scope.
- [ ] **Linked story / issues / ADRs.**
- [ ] **Word count 200-500** (hard cap 800).

## Phase summary checklist

(`<archive>/phase-summary.md` — `bmad-tds-archive-phase` output.)

- [ ] **Phase identifier + dates.**
- [ ] **Epics shipped** — list.
- [ ] **Metrics** — story count, avg duration, lessons captured, bridges resolved.
- [ ] **Key ADRs** linked.
- [ ] **Risks discharged** — what was uncertain start of phase, resolved.
- [ ] **Word count 500-1500** (hard cap 3000).
- [ ] **Stakeholder-readable** — Persona 5 audience match.

## Lesson formulation checklist

(`lessons.yaml` entry.)

- [ ] **summary** ≤ 200 chars.
- [ ] **lesson** 2-5 sentences.
- [ ] **avoid_pattern** present (if technical lesson).
- [ ] **preferred_pattern** present (if applicable).
- [ ] **severity** appropriate (high / medium / low).
- [ ] **tags** match story domain (≥ 1).
- [ ] **story_refs** linking back к where pattern observed.
- [ ] **Karpathy #4 verifiable** — testable through grep / linting / code review.
- [ ] **Auditor cross-checked** — factual accuracy verified.
