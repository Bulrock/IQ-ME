# Writing Anti-Patterns

> Specific patterns to AVOID in TDS docs. Check writing against this list before publish.
> Cross-ref: 30-style-guide.md (defaults), 40-readability.md (plain language).

## Marketing speak

Words and phrases that sound impressive но communicate nothing:

| Avoid | Use instead (если applicable) |
|-------|--------------------------------|
| «cutting-edge» | (specific feature) |
| «blazing-fast» | «<latency> ms» / «handles N req/sec» |
| «robust» | (specific reliability property) |
| «scalable» | «scales к N concurrent X» |
| «seamless» | (drop entirely или describe boundary) |
| «innovative» | (drop) |
| «best-of-breed» | (drop) |
| «enterprise-grade» | (drop) |
| «industry-leading» | (drop) |
| «next-generation» | (drop or be specific: «v3 architecture») |
| «powerful» | (specific capability) |
| «intuitive» | (если really intuitive — show, don't claim) |

Rule: if sentence still meaningful after removing word, the word was filler.

## Weasel words

Hedging without commitment:

| Avoid | Reasoning |
|-------|-----------|
| «generally» | Generally чему? Surface conditions. |
| «usually» | Usually на каких systems? |
| «in most cases» | Specify which cases; surface remainder. |
| «sometimes» | When? List the cases. |
| «can be» | Either it is или isn't. Or: «is X if Y». |
| «may want to» | Recommend or don't. «Consider X if Y». |
| «might be» | Same as «may». |
| «approximately» | Use «about» (simpler) или specific number. |
| «relatively» | Relative to what? Specify or drop. |
| «basically» | Drop. |
| «actually» | Drop. |
| «in fact» | Drop. |

Rule: if hedge real (uncertainty exists) — surface uncertainty as fact: «Performance varies от 200-500ms depending on disk speed. Не calibrated на NVMe-only systems.»

## Filler phrases

Words that pad без adding info:

| Avoid | Why |
|-------|-----|
| «It's important to note that» | Just state the point. |
| «As we mentioned previously» | Assumes linear reading; doesn't help linker. |
| «It should be noted» | Drop. |
| «Without going into too much detail» | Then don't. |
| «Needless to say» | Then don't say it. |
| «As a matter of fact» | Drop. |
| «In other words» | Reword the original instead. |
| «That being said» | Use «but» or «however». |
| «At the end of the day» | Drop. |
| «To be honest» | Suspicious — what were you saying before? |
| «As you might know» | Patronizing. Drop. |

## Redundancy

Tautologies + double-negatives + duplicates:

| Redundant | Plain |
|-----------|-------|
| added new feature | added feature |
| return back | return |
| advance planning | planning |
| final outcome | outcome |
| each individual user | each user |
| past history | history |
| 12 noon / midnight | noon / midnight |
| true facts | facts |
| close proximity | proximity |
| general consensus | consensus |
| revert back | revert |
| repeat again | repeat |

## Vague pronouns

«This», «that», «it» referring to ambiguous antecedents:

- ❌ «After installing the binary and running migrate, this should work.» (this = installing? migrate? both?)
- ✅ «After installing the binary and running migrate, the integration tests should pass.»

Rule: if «this/that/it» referent isn't clear within previous one sentence — name the subject.

## Time-relative references

«Recently», «lately», «soon» — meaningless after publication:

- ❌ «Recently, TDS added X.» (when?)
- ✅ «In v1.2.0 (Apr 2026), TDS added X.»
- ❌ «Soon, this feature will...» (when?)
- ✅ «In Q3 2026 (per roadmap)...» or remove vague claim entirely.

## Unsupported claims

Quantitative claims without source:

- ❌ «10x faster than alternative.»
- ✅ «Benchmark shows 10x throughput improvement on workload X (см. perf/bench-results.md).»
- ❌ «Most users prefer X.»
- ✅ «70% of polled users (N=50) preferred X (Q4 2025 survey).»
- ❌ «Industry standard.»
- ✅ «Standardized в RFC 9110.» or remove claim.

## Apologies / hedging

Excessive softening:

- ❌ «Sorry for the long doc.»
- ❌ «This is a complex topic, but...» (if complex, doc is right; don't apologize.)
- ❌ «I might be wrong, but...» (then either fix или skip the claim.)

Confidence is OK. False modesty annoying.

## Patronizing phrases

Talking down to reader:

- ❌ «As you can clearly see...»
- ❌ «Obviously...»
- ❌ «Simply do X.» (если really simple, just say «Do X».)
- ❌ «Just <verb>...» (assumes ease.)
- ❌ «You should already know X.» (says reader inferior.)

If pre-requisite assumed — link к prerequisite explicitly: «Prerequisite: familiarity with [X concept](link).»

## Click here / read more

Generic link text:

- ❌ «Click [here](url).»
- ❌ «Read more [here](url).»
- ✅ «Read the [Diátaxis framework spec](https://diataxis.fr/).»
- ✅ «See [forbidden-quadrant matrix](spec/matrix/forbidden-quadrant.matrix.yaml).»

Link text should describe target. Accessibility benefit (screen readers) too.

## Adjacent edits «по дороге»

(Karpathy #3 violation — most common writer failure mode.)

Updating section A — touching section B as «improvement»:

- ❌ «Я fixed quickstart, and while I was в README, I cleaned up the architecture section too.»
- ✅ «Fixed quickstart. Architecture section needs work — separate doc-update story.»

Why это bad:
- Diff больше чем necessary.
- Reviewer must check unrelated changes.
- Possibly breaks something (silent regression).
- Voice/tense drift между sections.

If fixing А truly requires touching B (e.g., links to A changed) — minimum surgical change в B. Document _почему_ B changed.

## Voice / tense drift

When updating existing doc, NEW text matches existing:

- ❌ Existing doc passive: «`tds preflight` is run...» — new edit active: «You run `tds preflight`.»
- ✅ Match existing voice (или migrate entire doc consistent в separate refactor doc-update task).

## Inconsistent terminology

Same concept в different places named differently:

- ❌ «role-skill» в one section, «specialist» в next, «agent role» в third.
- ✅ Pick one (per glossary): «role-skill». Stick with it.

CI-guard candidate: glossary check (see 99-checklists.md).

## Code block без language tag

```
some code
```

vs

````
```python
some code
```
````

Always specify language. Syntax highlighting + tools that parse markdown.

## ALL-CAPS for emphasis

- ❌ «You MUST NOT bypass this step.»
- ✅ «You **must not** bypass this step.»

ALL-CAPS reads as shouting (and ironically often skipped как «warning text»).

## Comprehensive list of every option

Reader experience: skim первые 3, miss the rest.

- ❌ «Available subcommands: `tds`, `tds preflight`, `tds orient`, `tds story update`, `tds story status`, `tds state get`, `tds state set`, `tds branch start`, `tds branch info`, `tds pr create`, `tds memory query`, ...» (15+ items)
- ✅ Group + intro: «`tds` provides commands across 8 categories: orient, story, state, branch, pr, integrity, memory, archive. See [Reference](link) для full list.»

Or use a table.

## Pre-publish anti-pattern check

Before declaring doc «done», scan для:

- [ ] Marketing speak (cutting-edge, blazing-fast, etc.).
- [ ] Weasel words (generally, usually, in most cases).
- [ ] Filler phrases («It's important to note...»).
- [ ] Redundancies («added new», «final outcome»).
- [ ] Vague pronouns (this, that — что именно?).
- [ ] Time-relative («recently», «soon»).
- [ ] Unsupported claims (numerical or comparative).
- [ ] Adjacent edits (touching unrelated sections).
- [ ] Voice / tense drift.
- [ ] Inconsistent terminology.
- [ ] Generic link text («click here»).

If found — fix. Karpathy #2 Simplicity + #3 Surgical Changes.
