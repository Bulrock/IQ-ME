# Corpus build conventions

This document is the **AI-iteration guide** for everyone (human or AI agent) working on the methodology corpus. It is loaded on every authoring session. It is intentionally short; the schemas (`corpus/schema.json`, `corpus/methodology-claims-v1.schema.json`, `corpus/manifest.schema.json`) and the markdown subset (`corpus/markdown-subset-v1.md`) are the contracts. This file explains the *whys* and the *workflow*.

## Per-corpus-release re-emit semantics (NFR25)

Every time the corpus changes meaningfully, we tag a new `corpus-v<X>.<Y>.<Z>`. The renderer emits **every page in every locale** under `dist/methodology/v<X>.<Y>.<Z>/<lang>/`. Old corpus versions stay in `dist/` and remain accessible by URL — readers who cited a specific page at an old corpus version follow the citation and see exactly the page they cited, with a version-mismatch hatnote pointing to the current revision.

The corollary: **changing a single page bumps `corpusVersion` and re-emits all pages**. This is the price of citation stability. The byte-stable build assertion (Story 1.8 / Epic 4) catches accidental non-determinism in the re-emit.

## Block-level content-key parity (NFR27)

Every block-level construct in an EN methodology page (heading, paragraph, code fence, list item) carries an implicit content-key derived from its position. The RU and PL translations of that page MUST contain a matching block at the same position. The `lint-translation-parity.mjs` script (Story 4.7 — no-op stub at v0.0.1, full implementation in Epic 7) walks the EN tree and asserts every block has a counterpart in every translated tree.

Adding or removing a block in EN means adding or removing the matching block in RU and PL in the same PR. The frontmatter `sourceHashEN` field is the lock: changing the EN file changes its hash, which invalidates every translated `sourceHashEN` that pinned the old hash, which fires the stale-translation hatnote (NFR29) until each translator re-reviews and re-pins.

## EN-source-hash rule for RU/PL frontmatter (NFR29)

RU and PL `.md` files declare `sourceHashEN: <SHA-256 of EN file>`. When the EN source file changes, all dependent translations are flagged as stale. The hatnote that the user sees on a stale translation reads (in the appropriate locale): "This translation was reviewed against EN source version `<old-hash>`; the canonical EN source has since changed. The displayed text may be out of date. See the canonical EN version at `<link>`."

The hash is over the EN file body only, not the frontmatter (rendering frontmatter would create a self-referential cycle).

## Glossary-first rule (NFR30)

Methodology pages reference glossary terms by camelCase key (e.g. `irt`, `eap`, `theta`, `flynnEffect`). The renderer auto-links the first occurrence in each page to `/methodology/v<X>/<lang>/reference/glossary/#<key>`. Subsequent occurrences in the same page are unstyled.

Authors **declare which keys a page references** in the frontmatter `glossaryRefs:` array. The `lint-frontmatter.mjs` script (Story 4.3) asserts every camelCase token that matches a glossary key has been declared. Forgetting to declare a key is a lint error.

## Style invariants (NFR31)

The methodology corpus is written for an over-anxious lay test-taker, a skeptic, a Wikipedia editor, and a clinical-register translator simultaneously. Style invariants:

- **No idioms.** "By and large", "all things considered", "at the end of the day" — strip them. Idiomatic English does not translate.
- **Sentence-length cap.** No body sentence longer than 30 words. (Headings exempt.)
- **No metaphors stronger than the literal claim.** "The validity envelope" is permitted because the envelope is the literal claim. "The IRT model is the engine under the hood" is rejected — there is no hood.
- **No second-person imperatives in claims.** "We compute the posterior" not "you can see we compute the posterior". Reserved for the trail-aware-trail component which IS second-person by design.

The Story 4.4 `lint-reading-level-en.mjs` enforces a Flesch-Kincaid reading level upper bound (target Grade 11; cap Grade 13).

## Renderer contract (v1)

The build pipeline at `tools/build-methodology.mjs` parses every EN methodology source through the strict-mode subset renderer at `tools/markdown-subset.mjs`. The renderer implements the constructs declared in `corpus/markdown-subset-v1.md` and rejects every out-of-subset construct with a `MarkdownSubsetError` carrying line, column, and source-path coordinates. The build fails on any rejection; pages that need a forbidden construct must be reshaped to stay in the subset, never the renderer relaxed in place. New constructs ship as `markdown-subset-v2.md` plus a renderer flag.

## Corpus-version resolution

The builder resolves the corpus-version segment of every output URL in this order, first match wins. First, the env override `IQME_CORPUS_VERSION` if set and matching the `v<X>.<Y>.<Z>` semver pattern. Second, the output of `git describe --tags --match 'corpus-v*' --abbrev=0` with the leading `corpus-` stripped, if the command exits cleanly and the tag matches `corpus-v<X>.<Y>.<Z>`. Third, the literal fallback `v0.1.0`, which preserves the Story 3-6 URL contract in repositories that have not yet been corpus-tagged.

## Per-corpus-release re-emit

Every source page emits at every invocation regardless of whether its content changed. No skip-if-unchanged logic exists in the pipeline. Citers of `/<corpus-version>/<lang>/<path>` keep resolving to that frozen version forever because the emission is unconditional and the bytes are deterministic. The build-cache contract noted in `architecture.md` under the pending-decision section is deliberately not implemented at the current page count; premature optimization at four pages is exactly the trap to avoid.

## Latest companion

In addition to the versioned output path, the builder writes a byte-identical copy to `dist/methodology/latest/<lang>/<path>/index.html`. This companion exists for unversioned-link semantics, including the future root-redirect from `/methodology/<lang>/<path>/` and the eventual `x-default` hreflang anchor. It is a build-time byte copy, not a `<meta refresh>` redirect, because UX discipline says clipboard-pasted versioned URLs must always land the reader on the page they saw without a navigation surprise.

## Pipeline land schedule

The corpus pipeline lands across two epics. AI agents iterating on the corpus should **not invoke tooling that doesn't exist yet**:

- **Epic 4 lands:** `tools/build-methodology.mjs` (the renderer), `tools/markdown-subset.mjs` (the strict-mode subset parser), `tools/lint-frontmatter.mjs` (schema validator), `tools/lint-claims-manifest.mjs` (NFR23 parity), `tests/snapshots/methodology/**` (golden HTML snapshots), the dev-server harness with live-reload, the build-cache contract (deferred per D8 but interface stable).
- **Epic 5 lands:** the actual EN methodology content (about 30 pages), the diagrams under `src/content/diagrams/`, the per-language glossary JSON files at `src/content/glossary/{en,ru,pl}.json`, the trails JSON files at `src/content/trails/{en,ru,pl}.json`, the crisis-resources JSON files.
- **Epic 7 lands:** the RU and PL translations of every Epic-5 page, the `lint-translation-parity.mjs` script in non-stub form, the per-language reviewer-of-record CODEOWNERS resolution (Gates 9c + 9d).

If your authoring agent reaches for a tool not yet implemented, write a short note in the PR description ("blocked on `lint-frontmatter.mjs` — Story 4.3") and proceed with the manual validation step.

## Markdown subset

See `corpus/markdown-subset-v1.md` for the declared subset. The renderer is strict; pages that use out-of-subset constructs fail the build. Adopt new constructs by shipping `markdown-subset-v2.md` and a renderer flag, never by relaxing the v1 subset in-place.

## Schema set

See `corpus/schema.json` (frontmatter), `corpus/methodology-claims-v1.schema.json` (engine-claim cross-reference), `corpus/manifest.schema.json` (per-release manifest). All are JSON Schema 2020-12. All are committed at v0.0.1 (Story 1.4); the lint scripts that consume them land in Stories 4.3 / 5.x.
