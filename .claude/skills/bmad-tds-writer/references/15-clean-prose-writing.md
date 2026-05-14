# Clean Prose Writing — Foundations

> Adapted from canonical writing guides:
>
> - **Strunk & White** — *The Elements of Style* (1918+, the foundation).
> - **Joseph M. Williams** — *Style: Lessons in Clarity and Grace* (sentence-level craft).
> - **Steven Pinker** — *The Sense of Style* (cognitive-science-informed modern guide).
> - **William Zinsser** — *On Writing Well* (nonfiction simplicity + clarity).
> - **George Orwell** — *Politics and the English Language* (6 rules; anti-jargon manifesto).
> - **G. Ann Campbell** — *Cognitive Complexity* (adapted к prose).
>
> Применяется в каждом writer task (auto-loaded в Step 3 Plan если doc-write).
> Дополняет (не заменяет) Karpathy 4 принципа .
>
> Это «Clean Code для prose» — параллель к 15-clean-code-*.md в domain role-skills.

## Соотношение с Karpathy (adapted для writing)

| Karpathy | Clean Prose |
|----------|-------------|
| #1 Think Before Coding → **Think Before Writing** | Declare audience + Diátaxis quadrant ДО первого слова. Pinker's «curse of knowledge» — writer assumes reader knows what writer knows; surface assumptions. |
| #2 Simplicity First | Strunk #17: «Omit needless words». Zinsser ch. 2: «Clutter is the disease of American writing». 200-word doc, может быть 50 — переписать. |
| #3 Surgical Changes | Williams' «cohesion» — match existing voice/tense; не переписывать adjacent paragraphs. Most common writer-failure mode. |
| #4 Goal-Driven Execution → **Reading Test** | «Audience reads doc, achieves goal in expected time / format / mental model.» Karpathy's TDD = writer's «test before publish». |

---

## 1. The 6 Foundational Rules (Orwell, *Politics and the English Language*, 1946)

Orwell's 6 rules — most cited writing rules в English. Modern, decisive, deletable-friendly.

1. **Never use a metaphor, simile or other figure of speech which you are used to seeing in print.**
   - «Cutting-edge» / «paradigm shift» / «move the needle» — **dead metaphors**. Cut.

2. **Never use a long word where a short one will do.**
   - «utilize» → «use». «commence» → «start». «approximately» → «about».

3. **If it is possible to cut a word out, always cut it out.**
   - «It's important to note that» → cut entire phrase. Just say the point.
   - «In order to» → «to». «At this point in time» → «now».

4. **Never use the passive where you can use the active.**
   - «Errors могут возникать» (passive) → «Network failures cause errors» (active).
   - Active: concrete subject + verb + object. More forceful.

5. **Never use a foreign phrase, a scientific word or a jargon word if you can think of an everyday English equivalent.**
   - «In situ» → «in place». «A priori» → «from the outset».
   - Exception для technical accuracy: keep правильные technical terms (mutex, idempotent — не «replace with» plain English).

6. **Break any of these rules sooner than say anything outright barbarous.**
   - Orwell's escape clause: rules serve clarity. If breaking one makes prose clearer, break it.

**Application:** check каждое draft against the 6 rules before publishing. Karpathy #2 + #3 в writing form.

---

## 2. Strunk & White — *The Elements of Style* (key rules)

The 100-page classic. Some rules outdated на usage; principles solid.

### Composition principles

#### Strunk #13: Omit needless words

> «Vigorous writing is concise. A sentence should contain no unnecessary words, a paragraph no unnecessary sentences, for the same reason that a drawing should have no unnecessary lines and a machine no unnecessary parts.»

| Bloated | Concise |
|---------|---------|
| owing to the fact that | because |
| in spite of the fact that | although |
| call your attention to the fact that | remind / show |
| the reason why is that | because |
| this is a subject that | this subject |
| due to the fact that | because |
| at all times | always |
| at the present time | now |
| in the event that | if |
| in the event of | if |
| with reference to | about |

#### Strunk #14: Avoid a succession of loose sentences

«Loose sentence» — main clause + subordinate clauses tagged on с conjunctions. Three+ in row → monotonous.

```
✗ The user logs in, and the system validates credentials, and a token is issued, and the dashboard appears.

✓ When the user logs in, the system validates credentials. After issuing a token, it shows the dashboard.
```

Vary sentence structure: simple / compound / complex.

#### Strunk #16: Use definite, specific, concrete language

| Vague | Specific |
|-------|----------|
| user | onboarding developer (Persona 1) |
| performance issue | LCP > 3 seconds on cart page |
| data | story-frontmatter sha256 record |
| handle the error | log error with context, retry once with exponential backoff, then surface to user |

Specificity builds trust + invites verification.

#### Strunk #17: Place yourself in the background

Don't make the writer the subject. Write about the topic, not about yourself writing about the topic.

```
✗ I think it's important to mention that...
✗ I believe the best approach is...
✗ In my opinion, ...

✓ The best approach is ...
✓ The data shows ...
```

Exception: explicit «I» when you ARE the subject (e.g., a postmortem reflecting on your decision).

#### Strunk #19: Express coordinate ideas in similar form

Parallel structure для parallel meaning.

```
✗ The system supports authentication, payment processing, and to manage users.

✓ The system supports authentication, payment processing, and user management.
```

(All gerunds + nouns or all infinitives — pick one.)

### Style principles

#### Strunk White ch. V #4: Write in a way that comes naturally

But not «as you talk». Spoken language has fillers, trail-offs, repetitions. Written has structure.

#### Strunk White ch. V #11: Do not explain too much

Trust the reader. Pinker's «curse of knowledge» — writer over-explains because writer remembers the discovery process; reader cares about the conclusion.

```
✗ The TDS module, which is the Team Developer Standards module, which I'll explain in detail later, provides...

✓ TDS provides ...
```

#### Strunk White ch. V #16: Be clear

«Clarity is not the prize in writing, nor is it always the principal mark of a good style. There are occasions when obscurity serves a literary yearning, if not a literary purpose, and there are writers whose attainments are difficult.»

For tech writing: clarity is the prize. Always.

---

## 3. Williams — *Style: Lessons in Clarity and Grace* (sentence-level craft)

Williams introduced **two principles** that transform sentence quality:

### Principle 1: Characters → Subjects, Actions → Verbs

A sentence is clearest when its **main characters are subjects** and **main actions are verbs**.

```
✗ The decision by the team to defer the migration was based on a recognition that there was a lack of testing infrastructure.

(characters: «team», «migration», «testing infrastructure» — buried)
(actions: «decided», «recognized», «lacked» — buried as nouns)

✓ The team deferred the migration because it lacked testing infrastructure.

(characters as subjects: team, it (the team))
(actions as verbs: deferred, lacked)
```

This is the **most powerful single rewrite**. Find «-tion», «-ment», «-ance», «-sion» nouns hiding actions. Rewrite as verbs.

| Nominalization (noun) | Verb |
|-----------------------|------|
| the decision was made | decided |
| performed an evaluation | evaluated |
| reached an agreement | agreed |
| made a recommendation | recommended |
| gave a description | described |
| conducted an investigation | investigated |

### Principle 2: Old before new (cohesion)

Sentences flow when **familiar information appears first**, **new information last**.

```
Bad — broken cohesion:
The integrity registry tracks every artefact change. Tampering occurs when the file's
sha256 differs from the record. The auditor catches this during reviews.

Better — old → new:
The integrity registry tracks every artefact change. When a file's sha256 differs from
its registered value, tampering has occurred. Reviews catch this — that's the auditor's role.
```

Each sentence opens with information от previous sentence; new info at sentence-end. Reader's mental model builds smoothly.

### Williams' «Diagnosis» method

To find what's wrong с a sentence:

1. **Find subjects of main verbs.** Are they characters?
2. **Find main verbs.** Are they actions?
3. **If no — rewrite.** Make characters subjects, actions verbs.
4. **Old → new check.** Does each sentence start с familiar info?

This applies к almost every sentence в technical doc.

---

## 4. Zinsser — *On Writing Well* (clutter is the disease)

Zinsser's diagnosis: «**Clutter is the disease of American writing.**»

### The 4 enemies

1. **The pomposity of inflated language** — «utilize», «implement», «leverage».
2. **The redundancy of doubled-up phrases** — «final outcome», «true facts», «added bonus».
3. **The padding of meaningless adverbs** — «very», «actually», «definitely», «basically».
4. **The dressing-up of plain ideas** — adding modifiers to disguise simple statements.

### Zinsser's method

«Examine every word you put on paper. You'll find a surprising number that don't serve any purpose.»

For each word ask:
- Does it contribute meaning?
- Could a shorter word work?
- Could the sentence work without it?

### Concrete examples

| Cluttered | Clean |
|-----------|-------|
| At the present time we are studying the situation | We're studying it now |
| In a not-too-distant future | Soon |
| With the possible exception of | except |
| The fact that he had not succeeded | his failure |
| Owing to the fact that | because |
| He was a man who | he |
| This is a subject that | this subject |
| In a hasty manner | hastily |
| Used for fuel purposes | used for fuel |

### Adverb cleanup

Most adverbs are fillers:

```
✗ He totally agreed.       ✓ He agreed.
✗ She was quite tired.      ✓ She was tired. (Or: She was exhausted.)
✗ It's actually working.    ✓ It works.
✗ Very unique.              ✓ Unique. (Unique cannot be intensified.)
```

Look для «-ly» words. Cut если possible. Replace verb if needed.

```
✗ She said angrily.    ✓ She snapped.
✗ He walked slowly.    ✓ He plodded.
```

Strong verbs > weak verbs + adverbs.

---

## 5. Pinker — *The Sense of Style* (modern cognitive guide)

Pinker brings 21st-century cognitive science to writing.

### The Curse of Knowledge

> «The single most important reason competent writing is rare is the curse of knowledge.»

Writer remembers the discovery journey; reader doesn't have that context. Writer over-references «as we discussed» / «you'll recall» / «obviously». Reader is lost.

**Antidote:**
1. **Show your work** для key transitions. Don't say «obviously»; explain.
2. **Define terms** when first used.
3. **Read your draft as a stranger** — could a reader without your background follow?
4. **Test on a real reader** — the gold standard.

### Classic style

Pinker advocates **«classic style»**: writer guides reader to see something в the world. Writer and reader as equals; writer points, reader looks.

Hallmarks:
- **Concrete subjects, active verbs.**
- **Specific, not abstract.**
- **Showing, not telling.** «The system handled 5,000 requests/second» NOT «The system was performant».
- **Reader-respecting:** treats reader as intelligent, not stupid; does not over-explain or condescend.

### Tree thinking

Pinker (drawing on linguistic theory): every sentence is a tree of nested phrases. Long sentences с deep nesting overload the reader.

```
The decision that was made by the engineer who was working on the team that was
responsible for the project that the manager had assigned to them last week was wrong.
                                                                            ↑
                                            5 levels deep of relative clauses
```

Refactor:

```
The engineer made the wrong decision. Last week, the manager had assigned the project
to her team.
```

**Test:** can reader hold the sentence in working memory? If sentence requires re-reading, it's too deep.

### Coherent prose has cohesion

Each sentence flows to the next. Williams' old → new principle. Pinker calls it **«coherence»**.

Coherence checklist:
- Does each sentence start with familiar info?
- Does each paragraph have a topic sentence?
- Are transitions explicit when needed («however», «as a result», «in contrast»)?

---

## 6. Sentence-level craft (synthesis of all 5 sources)

### Subject + verb proximity

Don't separate subject from verb с long modifying phrases.

```
✗ The integrity registry, which tracks all sha256 hashes for every artefact in the
   `<output_folder>/_tds/state-manifest.yaml` file (added в v1.0 release as primary
   class A artefact, see ADR-002 for details), provides tamper-evidence.

✓ The integrity registry provides tamper-evidence. It tracks sha256 hashes for every
   artefact, stored в `<output_folder>/_tds/state-manifest.yaml`. (See ADR-002 for the
   classification rationale.)
```

### Sentence length

- Vary: short / medium / long mix.
- Average: ~20 words for tech docs (Pinker recommends 15-25).
- Max: ~40 words (anything beyond — split).
- Min: occasional short sentence (≤8 words) for emphasis.

```
The system handles 5,000 requests per second. It does this by sharding state across
ten partitions. Each partition runs independently. They never block each other.
                                                                              ↑
                                                                        Short for impact
```

### Active voice (default)

```
✗ Errors are logged by the auditor.       ✓ The auditor logs errors.
✗ The decision was reached by the team.   ✓ The team decided.
```

Passive acceptable when:
- Actor unknown / irrelevant: «The state was modified externally.»
- Universal statement: «Logs are written в JSONL format.»
- Patient is more important than agent: «Three users were locked out by the bug.»

### Subject-verb agreement, even через distance

```
✗ The list of active users were displayed.
✓ The list of active users was displayed. (subject: «the list» — singular)
```

### Avoid empty subjects

```
✗ It is important to note that...    (skip; «empty it»)
✗ There is a need to validate...     (passive «there»; bury action)

✓ Validation matters.
✓ Validate before saving.
```

«It is» / «there is/are» — flag, often deletable.

### Variety in clause types

- **Simple sentence:** one independent clause. «The system started.»
- **Compound:** two independent с conjunction. «The system started, and it loaded data.»
- **Complex:** independent + dependent. «After the system started, it loaded data.»
- **Compound-complex:** mix.

Mix all four. Monotonous structure = boring prose.

---

## 7. Paragraph-level craft

### Topic sentence first

The topic sentence (usually first sentence of paragraph) establishes:
- What the paragraph is about.
- Where it fits в the larger argument.

Subsequent sentences support / extend / qualify the topic.

```
Topic: «The integrity registry has three artefact classes.»

Supporting sentences: classification details, examples, edge cases.

Closing: «These classes determine when re-recording is mandatory.»
```

### Paragraph length

- 2-5 sentences for web/docs.
- 50-150 words typical.
- Long paragraphs (>200 words) → split.
- Single-sentence paragraphs OK for emphasis (sparingly).

### Paragraph transitions

Each paragraph should connect to the previous:
- **Continuation:** «Furthermore», «In addition», «Similarly».
- **Contrast:** «However», «In contrast», «By contrast».
- **Cause/effect:** «Therefore», «As a result», «Consequently».
- **Sequence:** «First», «Next», «Finally».
- **Example:** «For example», «To illustrate», «Specifically».

Use transitions when relationship between paragraphs не self-evident.

### One idea per paragraph

If you find «moreover», «also», «additionally» introducing new topics — split paragraph.

---

## 8. Word-level decisions

### Specific > general

```
✗ The user interacted with the interface.
✓ The user clicked Submit.
```

### Concrete > abstract

```
✗ A delay occurred during processing.
✓ Validation took 8 seconds.
```

### Strong verbs > weak verbs + modifiers

```
✗ He walked slowly into the room.
✓ He plodded into the room.

✗ She quickly grabbed the file.
✓ She snatched the file.

✗ The system responded promptly.
✓ The system responded в 200ms.
```

### Avoid jargon (Orwell #5) unless precise technical term

- Tech term есть в glossary / industry-standard → keep: «idempotent», «mutex», «schema migration».
- Jargon imitating technical sound but adds nothing → cut: «leverage», «utilize», «paradigm», «synergy».

### Acronyms

- First use: spell out + parens. «BMAD-METHOD (Breakthrough Method for Agile AI-Driven Development)».
- Subsequent: just acronym.
- Common (HTTP, JSON, SQL, YAML) — assume reader knows; no expansion.
- Glossary section if ≥ 5 acronyms.

### Numbers

- ≤ 9 in prose: spell out. «three quadrants», «two profiles».
- ≥ 10: numerals. «10 operations», «110 cells».
- Always numerals для technical: «exit 4», «Node 20+», «5 шагов».

---

## 9. The Reading Test (Karpathy #4 для prose)

Like TDD: define success criteria, simulate, iterate.

### Per-audience reading test

| Audience | Test |
|----------|------|
| Onboarding dev | Copies quickstart commands as-is, achieves working state in advertised time. |
| Existing dev | Finds reference entry в <30 seconds. Entry self-contained. |
| Ops engineer (3 AM) | Locates runbook + completes within 10 minutes. |
| Future maintainer | Can answer «why was X chosen?» after reading ADR. |
| Stakeholder | Can paste paragraph into board email without rewriting. |
| External contributor | Sets up dev environment + files first PR within 2 hours. |

### Universal mental tests before publish

1. **First-3-sentence test.** Read first 3 sentences only. Does reader know what doc is about?
2. **Strangerness test.** Pretend you've never seen this project. Does prose make sense?
3. **Skim test.** Skim only headings + first sentences of paragraphs. Can reader extract main points?
4. **Cut test.** Try cutting any paragraph. If meaning unchanged → paragraph wasn't earning its space.
5. **Dependency test.** Each sentence — depends на info present earlier?

### Failure modes (rewrite signals)

- Reader emails «can you clarify X?» — your prose failed на that point. Don't email back; rewrite the doc.
- Reader pastes your text into Slack and adds explanation — your prose required translation. Replace with their explanation.
- You yourself can't paraphrase without re-reading — too convoluted.

---

## 10. Cognitive Complexity для prose (adapted Campbell)

Campbell's Cognitive Complexity для code measures mental effort to understand. Same idea applies to prose.

### Prose complexity factors

| Construct | Penalty |
|-----------|---------|
| Long sentence (>30 words) | +1 |
| Long sentence (>40 words) | +3 |
| Nested subordinate clause (depth >2) | +1 per level |
| Passive voice (when active possible) | +1 |
| Nominalization (action hidden as noun) | +1 |
| Vague pronoun («this/that/it» без named antecedent) | +1 |
| Negation chain («not unimportant») | +1 |
| Idiom / metaphor (live, not dead) | +0 (often clarifying), +2 if mixed metaphors |
| Acronym not yet defined | +1 |
| Footnote / parenthetical aside | +1 |

### Score per paragraph

- 0-3: clear.
- 4-7: borderline; review.
- 8+: rewrite.

### Reduction tactics

1. **Williams' character-as-subject.** Buried characters → explicit. Buried actions → verb.
2. **Active voice.** Passive → active where possible.
3. **Cut nominalizations.** «-tion / -ment / -ance» nouns → verbs.
4. **Split long sentences.** >30 words → split.
5. **Resolve vague pronouns.** «This is critical» → «This invariant is critical».
6. **Define acronyms.** First use, spell out.
7. **Avoid footnotes.** Inline или cut.

```
✗ Original (cognitive complexity ~8):
The implementation of the integrity registry, which was designed to provide
tamper-evidence by storing sha256 hashes of integrity-tracked artefacts, was completed
in v1.0, and it has been verified by multiple audits, none of which found significant
issues, although there are some edge cases that we still need to investigate.

✓ Rewritten (cognitive complexity ~3):
The integrity registry provides tamper-evidence. It stores sha256 hashes of tracked
artefacts. We shipped it in v1.0; multiple audits have verified it without significant
findings. Some edge cases remain to investigate.
```

(Action verbs surface; subjects are characters; sentences split; passive removed; footnote-style aside cut.)

---

## 11. Anti-patterns (synthesis с 70-anti-patterns.md, here from a writing-craft angle)

### Buried main idea

Most important point hidden mid-paragraph:

```
✗ While there are several considerations to keep in mind regarding storage strategies,
   it should be noted that one critical aspect is integrity. The system uses sha256...

✓ Integrity is the critical storage decision. The system uses sha256...
```

### Trailing apologies

```
✗ This is a complex topic, but I'll try to explain it as best I can...
✓ Skip apology. Explain.
```

### Overhedging

```
✗ It might be reasonable to consider, in some cases, that perhaps the team could,
   at their discretion, look into the possibility of...
✓ Consider X. (Or: We recommend X.)
```

### Dead metaphors

```
✗ Move the needle / boil the ocean / ducks in a row / low-hanging fruit /
   cutting-edge / paradigm shift / robust solution / scalable platform.
✓ State the actual claim plainly.
```

### Mixed metaphors

«We need to circle back and run it up the flagpole — it's a moving target on a slippery slope.» Comedy gold. Cut.

### Long noun phrases

```
✗ user account verification process completion notification
✓ verified-account email
```

Strings of nouns are hard parsing. Add prepositions or rewrite.

### Pseudo-precise language

```
✗ Approximately 30 minutes (give or take)
✓ About 30 minutes. (Or: 25-35 minutes if range matters.)
```

### Hedge stacking

```
✗ It is generally usually thought to be the case that perhaps...
✓ It's the case that... (Or: It is.)
```

### Unjustified «we»

```
✗ We need to be careful here.   (Who is «we»?)
✓ Be careful here. (Or: Operators must be careful.)
```

### «Click here» links

```
✗ Read more [here](url).
✓ Read the [Diátaxis framework](url).
```

Link text describes target.

---

## 12. Voice & tense — defaults (synthesis с 30-style-guide.md)

### Voice: active + second-person

«You can run...» / «Run...» (imperative).

### Tense: present

«The system handles 5K req/sec.» NOT «The system will handle...» (future) or «The system handled...» (past).

Exception: CHANGELOG entries (past tense for fact: «Added X»). Migration guides describing prior state («Previously, integrity used HMAC»).

### Person

- **Second person (default):** technical docs, tutorials, how-to.
- **Third person:** reference (avoid «you» in pure structured ref).
- **First person plural («we»)**: avoid; ambiguous «we».
- **First person singular («I»)**: only когда explicitly autobiographical (postmortem reflection, RFC author commentary).

---

## 13. Apply в TDS workflow

В writer SKILL.md Process Step 3 (Plan):

1. **Apply Karpathy 4** (general).
2. **Apply Clean Prose Writing** (this file):
   - **Frame** Pinker's curse-of-knowledge: surface assumptions; show your work for key transitions.
   - **Williams' diagnosis:** find buried characters / actions; rewrite with characters-as-subjects, actions-as-verbs.
   - **Zinsser/Strunk:** cut clutter; «omit needless words».
   - **Orwell's 6 rules:** dead metaphors / long words / cuttable words / passive / jargon / barbarism — pre-publish scan.
   - **Cohesion:** old → new info per sentence; topic sentence first per paragraph; transitions explicit.
   - **Reading test:** define success criterion per audience BEFORE writing; verify after.

3. **Tooling check** (manual + optional automated):
   - Manual: reading test simulation per audience.
   - Optional: `vale` linter (configurable rules), `alex` (insensitive language), Hemingway-style sentence-length flagger.

## Cross-tool: applies в Codex too

Эти principles — language-agnostic; apply equally в Codex CLI sessions. Writer in either host respects same principles.

---

## 14. Checklist before publish

- [ ] **Audience declared** (Persona 1-6 per `20-audience-personas.md`).
- [ ] **Diátaxis quadrant declared** (Tutorial / How-to / Reference / Explanation per `10-diataxis-cheatsheet.md`).
- [ ] **Reading test defined** для this audience: what does success look like (and in what time)?
- [ ] **Orwell's 6 rules pass:** no dead metaphors, no inflated words, no cuttable words, active voice, no avoidable jargon.
- [ ] **Strunk #17 «Omit needless words» applied.**
- [ ] **Williams' Principle 1:** main characters as subjects, main actions as verbs (no nominalizations hiding actions).
- [ ] **Williams' Principle 2 (cohesion):** old info first, new info last, per sentence.
- [ ] **Pinker's curse-of-knowledge check:** would a stranger to this project understand?
- [ ] **No marketing speak** (см. `70-anti-patterns.md`).
- [ ] **No weasel words** или filler phrases.
- [ ] **Sentences vary в length** (mix short / medium / long).
- [ ] **Average sentence ≤25 words.**
- [ ] **Paragraphs 2-5 sentences** (50-150 words typical).
- [ ] **Topic sentence per paragraph.**
- [ ] **Specific, concrete language** (not vague abstractions).
- [ ] **Voice + tense consistent** with project default (or with existing doc если update).
- [ ] **Karpathy #3 Surgical:** не trogal'и adjacent secciones что не в scope.
- [ ] **Reading test (mental simulation):** target audience achieves goal в expected time.

Failed any check → revise. Karpathy #4 — «test before publish».

---

## References

- **Strunk & White, *The Elements of Style*** — 4th ed., 2000. Classic foundation.
- **Joseph M. Williams, *Style: Lessons in Clarity and Grace*** — 12th ed., 2016. Sentence-level craft.
- **Steven Pinker, *The Sense of Style*** — 2014. Modern cognitive-science guide.
- **William Zinsser, *On Writing Well*** — 30th anniversary ed., 2006. Nonfiction simplicity.
- **George Orwell, *Politics and the English Language*** — 1946 essay. The 6 rules.
- **Bryan A. Garner, *Garner's Modern English Usage*** — 5th ed., 2022. Reference for usage questions.
- **Roy Peter Clark, *Writing Tools: 50 Essential Strategies*** — 2008. Tactical techniques.
- **Mailchimp Content Style Guide** — modern web tone reference.
- **Microsoft Writing Style Guide** — https://learn.microsoft.com/en-us/style-guide/welcome/
- **Google Developer Documentation Style Guide** — https://developers.google.com/style/
- **G. Ann Campbell, *Cognitive Complexity*** — SonarSource white paper, adapted к prose в section 10.
