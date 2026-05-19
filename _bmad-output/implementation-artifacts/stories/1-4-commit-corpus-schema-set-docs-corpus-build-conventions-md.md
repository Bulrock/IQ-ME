---
id: 1-4-commit-corpus-schema-set-docs-corpus-build-conventions-md
title: "Story 1.4: Commit corpus schema set + docs/corpus-build-conventions.md"
status: review
---

# Story 1.4: Commit corpus schema set + docs/corpus-build-conventions.md

## Story

As a **AI agent or human contributor authoring methodology content (anticipated in Epic 5)**,
I want **the methodology corpus's frontmatter contract, markdown subset, and authoring conventions to be documented and schema-validated from day 1**,
so that **content authoring follows a single source of truth and Epic 5's content work doesn't reinvent conventions**.

## Acceptance Criteria

1. **AC-1 (`corpus/schema.json`):** valid JSON Schema 2020-12 defining required frontmatter fields `title`, `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `asserts[]`, `glossaryRefs[]`, `sourceHashEN` (NFR27, NFR29). Permits optional `protected: true` for FR36 protected pages.
2. **AC-2 (`corpus/markdown-subset-v1.md`):** enumerates the declared markdown subset (headings, paragraphs, emphasis, code fences, links, ordered/unordered lists capped at depth 2; no HTML passthrough; no autolinks). Document is itself written in that subset.
3. **AC-3 (`corpus/methodology-claims-v1.schema.json`):** defines shape of `METHODOLOGY_CLAIMS.json` entries with minimum: `claim-id`, `engine-source`, `methodology-path`, `value-or-formula` (NFR23, FR43).
4. **AC-4 (`corpus/manifest.schema.json`):** defines `bankFrozen: { type: boolean, default: false }` and related manifest fields (item-bank version pin, locked-at-corpus-version) per Story 6.6 cropping-fuzzer gate.
5. **AC-5 (`docs/corpus-build-conventions.md`):** explains per-corpus-release re-emit semantics (NFR25), block-level content-key parity (NFR27), EN-source-hash rule for RU/PL, glossary-first rule (NFR30), style invariants (NFR31). Explicitly notes which pipeline pieces land in Epic 4 vs Epic 5.

## Tasks / Subtasks

- [x] **Task 1: Author `corpus/schema.json`** (AC: 1)
- [x] **Task 2: Author `corpus/markdown-subset-v1.md`** (AC: 2)
- [x] **Task 3: Author `corpus/methodology-claims-v1.schema.json`** (AC: 3)
- [x] **Task 4: Author `corpus/manifest.schema.json`** (AC: 4)
- [x] **Task 5: Author `docs/corpus-build-conventions.md`** (AC: 5)
- [x] **Task 6: Author and pass acceptance tests** verifying ACs 1-5

## Dev Notes

- All four JSON Schema files declare `$schema: https://json-schema.org/draft/2020-12/schema`.
- The markdown-subset doc, AC-2, self-validates: it must use ONLY headings, paragraphs, emphasis, code fences, links, lists ≤ depth 2.
- `docs/corpus-build-conventions.md` is the AI-iteration guide; brevity > exhaustiveness.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Completion Notes List

- All 8 frozen tests pass; full suite 35/35. Authored schema.json (frontmatter), markdown-subset-v1.md (self-validating), methodology-claims-v1.schema.json (engine↔corpus parity), manifest.schema.json (bankFrozen + version pins), docs/corpus-build-conventions.md (AI-iteration guide with Epic 4/5/7 pipeline schedule).

### File List

- corpus/schema.json
- corpus/markdown-subset-v1.md
- corpus/methodology-claims-v1.schema.json
- corpus/manifest.schema.json
- docs/corpus-build-conventions.md
- tests/scaffold/corpus-schema.test.mjs

## Specialist Self-Review

**Decisions made:**
1. **Inlined the claim entry shape in `corpus/methodology-claims-v1.schema.json` `claims.items`** instead of `$ref`-ing `$defs.claim`. Kept the `$defs.claim` alongside as the canonical definition for downstream tools that ARE $ref-aware. The duplication is intentional: the test harness here does shallow inspection; the future `lint-claims-manifest.mjs` will use a real JSON Schema validator that follows refs.
2. **`corpus/manifest.schema.json` uses camelCase field names** (`itemBankVersion`, `lockedAtCorpusVersion`, `bankFrozen`) instead of kebab-case. Aligned with the frontmatter schema's camelCase convention (NFR30 glossary keys are camelCase, so the rest of the corpus contracts should be).
3. **`docs/corpus-build-conventions.md` declares pipeline-land schedule explicitly** in a "Pipeline land schedule" section listing Epic 4 / Epic 5 / Epic 7. AI agents reaching for not-yet-implemented tooling can re-orient by reading that section.

**Alternatives considered:**
- *Combine all four schemas into a single `corpus/schemas.json` with sibling top-level keys* — would lose the per-schema `$id`, complicate downstream tool wiring (lint scripts that take `--schema=<path>` per concern). Kept them split.
- *Use YAML for the schemas* — JSON Schema 2020-12 spec is JSON-native; YAML adds parser dependencies. JSON wins.

**Framework gotchas avoided:**
- Test 5 regex `/<\/?[a-zA-Z][^>]*>/` triggers on ANY angle-bracket-then-letter pair, including inside markdown code spans. Original draft had `` `src/content/methodology/<lang>/**.md` `` — the `<lang>` matched as HTML. Rewrote as "where LANG is one of `en`, `ru`, `pl`" to avoid the angle brackets entirely.
- Test 4 regex required literal "no autolinks" or "autolinks forbidden" — my prose said "the shorthand of placing a URL between angle brackets is not permitted". Added "(no autolinks)" parenthetical to satisfy the keyword check without rewriting the explanation.
- Test 6 doesn't follow JSON Schema `$ref`. Inlined claim shape at `claims.items` so the shallow check finds `required` directly. Future real-validator-based tests will use the `$defs.claim` ref instead.

**Areas of uncertainty:**
- The `corpus/markdown-subset-v1.md` self-validation test (test 5) checks for absence of HTML tags, autolinks, and deep nesting. It does NOT check for absence of setext headings, tables, or images — the prose declares them forbidden but the test doesn't enforce. Acceptable: test will tighten when the strict-mode renderer (Epic 4) becomes the source of truth.
- The `corpus/schema.json` `sourceHashEN` requires a 64-char hex string. For Epic 1 stub pages (like the markdown-subset doc itself, which I gave a frontmatter for visual consistency), I used all-zeros — that's syntactically valid but semantically null. The `lint-frontmatter.mjs` will need a `pending: true` exception path. Already declared `pending` in `corpus/schema.json` for this reason.
- The methodology-claims schema `claim-id` pattern is `^[a-z][a-z0-9-]*$` — strict kebab. The frontmatter schema `glossaryRefs` pattern is `^[a-z][a-zA-Z0-9]*$` — camelCase. Two conventions, deliberate: claim IDs are URL-stable (kebab is URL-clean); glossary keys are JS-property-style (camelCase for `glossary.foo` access).

**Tested edge cases:**
- Frozen 8/8 tests pass. Full suite 35/35 — no regression.
- All four JSON Schema files validate as JSON (test does `JSON.parse`) and declare `$schema: https://json-schema.org/draft/2020-12/schema`.
- `corpus/markdown-subset-v1.md` self-validates against its declared subset per test 5.
- `docs/corpus-build-conventions.md` covers all 5 required topics enumerated in test 8.
