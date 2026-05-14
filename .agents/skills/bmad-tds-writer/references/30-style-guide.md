# Style Guide

> Voice / tense / list-vs-prose / sentence-length defaults для TDS docs.
> Override через `_bmad/custom/bmad-tds-writer.toml [agent.style]`.

## Voice

**Default: active, second-person.**

- ✅ «Run `tds preflight` to verify the install.»
- ❌ «`tds preflight` should be run to verify the install.» (passive — vague)
- ❌ «We run `tds preflight`.» (first-person plural — assumes shared «we»)
- ❌ «One runs `tds preflight`.» (impersonal — distancing)

Exceptions where passive OK:
- Acknowledging unclear ownership: «The state was modified externally». (Don't blame agent.)
- Universal statement: «Logs are written в JSONL format». (Active forms feel awkward.)

## Tense

**Default: present.**

- ✅ «`tds story update --status=review` transitions state from in-progress to review.»
- ❌ «`tds story update --status=review` will transition state...» (future — doc should describe what is, not what will happen)
- ❌ «`tds story update --status=review` transitioned state...» (past — confusing)

Exceptions:
- CHANGELOG entries — past tense for historical fact: «Added pre-commit hook support».
- Migration guides describing prior state: «Previously, integrity used HMAC. Now it uses sha256 registry.»

## Person

**Default: second-person ("you").**

- ✅ «To install TDS, run `/bmad-tds-setup install`.»
- ❌ «To install TDS, the user should run...» (clinical)
- ✅ «You'll see this output:» (talking to reader)
- ❌ «The reader will see this output:» (third-person clinical)

Exception — reference docs: avoid «you» in pure structured reference (tables, schemas). Use imperative: «Run `tds preflight check`». Or impersonal: «The `preflight check` command verifies...».

> Note: `tds migrate` ранее был в этих примерах; не используй его — schema-migration framework в текущей версии модуля не реализован (см. `payload/workflows/bmad-tds-setup/runbooks/RB-10-migration-recovery.md` placeholder banner).

## Lists vs prose

**Default: prose for explanation; lists for parallel items ≥ 3.**

❌ Bad — bulleted everything:
> «TDS provides:
> - integrity
> - tests
> - lessons
> - workflows»

✅ Better — prose where flow makes sense:
> «TDS provides integrity-tracked artefacts, TDD-driven runtime, lesson capture for retrospectives, and orchestrated workflows for story / epic / phase lifecycle.»

❌ Bad — prose where 5 parallel items:
> «The seven workflows include execute-story для running individual stories, and execute-epic для coordinating multiple stories on integration branches, and code-review для verification, and generate-docs для documentation updates, and retro для lesson extraction, and archive-phase для closing development phases, and setup для bootstrap.»

✅ Better — list:
> «The seven workflows:
> - **`bmad-tds-setup`** — phase-2 bootstrap.
> - **`bmad-tds-execute-story`** — single-story lifecycle.
> - **`bmad-tds-execute-epic`** — multi-story integration on `epic_branch`.
> - **`bmad-tds-code-review`** — Mode 1 (story) / Mode 2 (epic finalize).
> - **`bmad-tds-generate-docs`** — docs orchestrator.
> - **`bmad-tds-retro`** — lesson extraction + bridge proposal.
> - **`bmad-tds-archive-phase`** — phase finalization.»

## Sentence length

**Default target: ~25 words average.**

- Short sentences (≤15) feel choppy if too many.
- Long sentences (≥40) lose readers.
- Mix lengths for rhythm.

Tools that flag long sentences: Hemingway-style readability. Use mental check: «Would I say this aloud в one breath?»

## Section depth

**Default max: 3 levels (h1, h2, h3).** Допустимые exceptions ниже.

- h1 — doc title.
- h2 — major sections.
- h3 — sub-sections within section.
- h4+ — обычно over-structured. Если ты дошёл до h4 — спроси «не разбить ли doc?»

### Acceptable h4 exceptions (do not flag)

- API reference (per-endpoint / per-method).
- Reference matrix с многомерным lookup (e.g., `## §17.8 OWASP LLM Top 10 mapping → ### LLM01..LLM10` или nested invariant tree).
- Architectural design-doc, где §X.Y.Z structure отражает logical containment, и flatten уменьшил бы readability (typical для multi-page Diátaxis explanation quadrant — `tds-design.md` например).

## Code blocks

- Always specify language for syntax highlighting:
  - ✅ ```python
  - ❌ ``` (no language)
- Inline code: backticks for command names, file paths, env vars: `tds preflight`, `_bmad/tds/`, `$NODE_ENV`.
- Block code: full snippet, runnable if possible (or marked `# truncated`).
- Examples copy-pasteable. NO `$` prefix unless it's literal shell prompt (then use `$ ` consistently).

## Headings

- Sentence case (NOT Title Case): «How to add a domain role-skill», NOT «How To Add A Domain Role-Skill».
- Action-oriented for tutorials/how-to: «Set up the dev environment», «Recover from halt-not-rollback».
- Noun-phrase для reference: «CLI commands», «Error codes».
- Question for explanation: «Why does TDS use sha256 instead of HMAC?»

## Emphasis

- **Bold** для important terms (first introduction): «**TDS** (Team Developer Standards) extends BMAD-METHOD».
- *Italic* sparingly: emphasis or technical terms in conceptual prose.
- `code` для everything that could be typed: commands, file paths, env vars, API names.
- ALL-CAPS — anti-pattern для emphasis. Use bold или restructure.

## Numbers

- Spell out in prose ≤ 9: «three quadrants», «two profiles».
- Numerals для ≥ 10: «10 operations», «110 cells».
- Always numerals для technical: «exit 4», «Node 20+», «5 шагов».

## Punctuation

- **Em dash** — для thought-breaks. Use space-em-space: « — ».
- **En dash** – для ranges (rarely needed).
- **Oxford comma**: «integrity, lessons, and bridges» (Yes Oxford in default).
- **Quotation:** double `"` for direct quotes; single `'` for code-like в prose.

## Lists formatting

- Use `-` for unordered (consistent с Markdown convention).
- Numbers `1.` for ordered.
- Nested: 2-space indent.
- End each item:
  - Period if full sentence.
  - No period if fragment.
  - Stay consistent в one list.

## Cross-references

- Internal: `[link text](relative-path.md#anchor)`.
- External: full URL.
- Reference design-doc sections: `tds-design.md §10.4` (informal, no link if same project context).
- Reference TDS-CLI: `tds <subcommand>` (backticks).

## Acronyms

- First use: spell out + acronym in parens. «BMAD-METHOD (Breakthrough Method for Agile AI-Driven Development)».
- Subsequent: just acronym.
- Glossary section если ≥ 5 acronyms.
- Common acronyms (SQL, HTTP, JSON, YAML) don't need expansion.

## Configurable defaults

Команда может override эти defaults через `_bmad/custom/bmad-tds-writer.toml`:

```toml
[agent.style]
voice = "active-second-person"           # alternatives: "active-third-person", "passive-allowed"
tense = "present"                         # alternatives: "past-for-changelog"
person = "second"                         # alternatives: "third", "neutral"
list-vs-prose = "prose-default"          # alternatives: "list-default", "always-list"
sentence-length-target = 25              # words
section-depth-max = 3                     # h1/h2/h3
oxford-comma = true
emphasis-mark = "bold"                    # alternatives: "italic", "underline"
```

Если override exists — writer matches override. Karpathy #3 Surgical Changes — не «улучшать» style mid-document.

## Anti-pattern reminder

См. `70-anti-patterns.md` для full list:
- Marketing speak (cutting-edge, robust, seamless).
- Weasel words (generally, usually, in most cases).
- Filler («It's important to note that»).
- Redundancy («added new», «final result»).
- Vague pronouns (this, that — что именно?).
