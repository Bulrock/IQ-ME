---
title: "Methodology corpus markdown subset, v1"
version: 0.0.1
lastReviewed: 2026-05-18
reviewer: "IQ-ME maintainers"
reviewerHandle: "@Bulrock"
asserts: []
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# Methodology corpus markdown subset, v1

This document declares the markdown constructs permitted in every page under the methodology tree at `src/content/methodology/LANG/`, where LANG is one of `en`, `ru`, `pl`. The strict-mode renderer authored in Epic 4 rejects any out-of-subset construct.

## Permitted constructs

The following six categories are permitted, and nothing else.

### Headings

ATX style only, levels 1 through 4. Each page has exactly one level-1 heading, matching the frontmatter title.

### Paragraphs

Lines of body text separated by a blank line.

### Emphasis

Single asterisk for emphasis and double asterisk for strong emphasis. Underscores not permitted. Combined nested emphasis not permitted at depth 3 or beyond.

### Code fences

Triple backtick fences with an optional language tag on the opening fence. Inline backticks for code spans permitted within paragraphs and list items.

### Links

Standard inline links written as bracket-paren pairs. Reference-style links permitted at the end of the document. Image links not permitted within methodology body text; static diagrams are referenced via the diagram component, not via inline image syntax.

### Lists

Ordered lists using `1.` and unordered lists using `-`. Nesting permitted up to depth 2. Lists of depth 3 or beyond are rejected by the renderer.

## Forbidden constructs

The following are explicitly rejected by the strict-mode renderer.

- HTML passthrough. Raw HTML tags inside markdown body text are not permitted. The renderer escapes any angle bracket that begins a tag-like token.
- Autolinks. The shorthand of placing a URL between angle brackets is not permitted (no autolinks). Use the standard bracket-paren link form.
- Setext headings. The underline form of headings, with equals signs or hyphens beneath a line, is not permitted. Use ATX style.
- Reference-style image links. Images are not permitted in methodology body text at all.
- Tables. The pipe-table extension is not permitted in this subset. Tabular content is rendered via the diagram component or by referencing a separate JSON data file.

## Why a subset

Auditability. A bounded subset converts the question "did we implement CommonMark correctly" into the question "does our corpus stay within the declared subset," which is bounded, lintable, and cheap to verify in CI. See `architecture.md` decision D1 for the full panel debate.

The subset is versioned. This document is version 1. Any future expansion ships as `markdown-subset-v2.md` with a corresponding renderer flag.

## Self-validation

This document is itself written entirely in the declared subset. It uses headings of level 1 through 3, paragraphs, lists of depth 1, and links inside paragraphs. There is no raw HTML, no autolink shorthand, no setext heading, no image, and no table.
