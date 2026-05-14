# Readability

> Plain-language rules + sentence/paragraph structure + scannability.
> Karpathy #2 Simplicity First applied к prose: minimum words for the meaning.

## Plain language

**Replace jargon with clearer alternatives where possible.**

| Jargon | Plain |
|--------|-------|
| utilize | use |
| facilitate | help / make easier |
| in order to | to |
| in the event that | if |
| at this point in time | now |
| due to the fact that | because |
| with regard to | about / regarding |
| terminate | end / stop |
| commence | start / begin |
| approximately | about |
| subsequently | then / later |
| prior to | before |

**Exception: technical terms.** Keep correct technical vocabulary (mutex, idempotent, refactor, regression).

## Sentence structure

**Active voice + concrete subject.**

- ❌ «Errors могут возникать в случае network failure.» (passive, abstract)
- ✅ «Network failure causes errors.» (active, concrete)

**One idea per sentence.**

- ❌ «If the preflight fails, which means dependency check returned non-zero exit code, due to missing binaries like git, node, or python, then you should install them and retry.»
- ✅ «Preflight fails if a required binary is missing. Install the missing binary, then retry.»

**Avoid nested clauses ≥ 3 deep.**

- ❌ «The integrity registry, which tracks sha256 hashes of files, including ones that the auditor verifies during reviews, signals tamper-evidence.»
- ✅ «The integrity registry tracks sha256 hashes for tamper-evidence. The auditor verifies these during review.»

## Paragraph structure

**Topic sentence first; supporting sentences after; transition or summary last.**

```
[Topic sentence — main point]
[Supporting evidence / detail]
[Supporting evidence / detail]
[Closing — transition to next paragraph or summary]
```

**Length:**
- Web/docs: 2-5 sentences (~50-150 words).
- Long paragraphs (>200 words) → split.
- Single-sentence paragraphs OK для emphasis (sparingly).

## Scannability

Readers scan before they read. Make scan-friendly:

- **Headings every 200-400 words** (depending on content density).
- **Lead paragraph** summarizes the section.
- **Key terms in bold** in long prose.
- **Tables/lists** для parallel data.
- **Code examples** clearly delimited.

## Word count budget

| Doc type | Target | Hard cap |
|----------|--------|----------|
| README | 300-800 words | 1500 |
| ADR | 400-800 words | 1500 |
| Runbook | 200-600 words | 1000 |
| Tutorial step | 50-150 words / step | 200 |
| How-to | 300-700 words | 1200 |
| Reference entry | 50-300 words / entry | 500 |
| Phase summary | 500-1500 words | 3000 |
| Lesson | 50-150 words (incl. patterns) | 300 |

If exceeding hard cap → split doc или delete content. Karpathy #2 — 200 lines, могут быть 50.

## Reading level — calibration

Use mental check: «Would a competent developer read this and understand на single pass?»

For dev docs target: graduate-level technical reader (~14-16 years education equivalent), но в native technical vocabulary. NOT «easy enough for non-tech reader» (that's stakeholder docs).

For stakeholder docs target: business-level reader (~10-12 grade equivalent). Replace ALL acronyms first use; avoid technical depth.

## Anti-patterns to avoid

### Marketing speak

- ❌ «Cutting-edge, blazing-fast framework that seamlessly integrates...»
- ❌ «Robust, scalable solution для modern teams.»
- ✅ «Async-first HTTP framework for Python 3.11+. Generates OpenAPI schema from type hints.»

### Weasel words

«Usually», «generally», «in most cases», «sometimes», «can be» — usually mean writer не уверен или hedging.

- ❌ «`tds preflight` generally takes <1 second.»
- ✅ «`tds preflight` typically completes in 200-500ms на Linux/macOS; up to 2s on Windows during cold start.»
- (Or, если really uncertain: «Performance characteristics not yet calibrated; pilot data needed.»)

### Filler

- ❌ «It's important to note that...» (just say it)
- ❌ «As we mentioned previously...» (assumes reader linear)
- ❌ «Without going into too much detail...» (then don't)
- ❌ «Needless to say...» (then don't say it)

### Vague pronouns

- ❌ «This is the recommended approach.» (this what?)
- ✅ «Using `StateFlow` is the recommended approach.» (named subject)

### Redundancy

- ❌ «added new feature» (additions are inherently new)
- ❌ «return back» (return implies back)
- ❌ «final result» (results are final)
- ❌ «12 noon» (just «noon» или «12:00»)
- ❌ «advance planning» (planning is advance)

### Hedge phrases

- ❌ «It might be a good idea to...» — say or don't say.
- ❌ «You may want to consider...» — same.
- ✅ «Consider X if Y.» (conditional, but action-oriented)

### «Click here» links

- ❌ «Click [here](url) для documentation.»
- ✅ «Read the [Diátaxis framework](https://diataxis.fr/).»

### Time-relative references

- ❌ «Recently, TDS added X.» (when is «recently»?)
- ✅ «In v1.2.0, TDS added X.» (specific reference)

## Tools / checks

(For TDS we don't ship automated readability tools v1; manual check.)

Optional v2+ ideas:
- `vale` (linter for prose; rules в `.vale.ini`).
- `alex` (catches insensitive language).
- Hemingway-style sentence-length check (custom script).

## Pre-publish reading test

Before declaring doc «done», do mental simulation per audience persona:

1. **Persona match:** is это writing для declared persona (см. 20-audience-personas.md)?
2. **Quadrant match:** does это cleanly fit Diátaxis quadrant (см. 10-diataxis-cheatsheet.md)?
3. **Reading test:** simulated reader achieves goal в expected time?
   - Onboarding dev → installs project в 30 minutes?
   - Existing dev → finds reference в <30 sec?
   - Ops engineer → resolves incident в RB time-box?
   - Maintainer → understands trade-offs?
   - Stakeholder → can paste summary into board update?
4. **Karpathy violations** (см. 70-anti-patterns.md):
   - Marketing speak? (none)
   - Filler? (cut)
   - Weasel words? (replaced or removed)
   - Adjacent edits «по дороге»? (revert)
   - Voice/tense match existing doc? (consistent)

Failed any check → revise. Karpathy #4 Goal-Driven: «reading test» как success criterion.
