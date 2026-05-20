---
title: "Methodology corpus changelog"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# Methodology corpus changelog

The changelog records every corpus-version change that affects a citation. Each entry includes the version tag, the release date, and the substance of the change. The format follows the loose conventions of Keep-a-Changelog.

## v1.0.0 — pending

The v1.0.0 release will tag the methodology corpus and engine as ready for citation by external academic and wiki-encyclopaedic work. The release will land after the Gate-9 sequence completes (ICAR license sign-off, external psychometrician review, clinical-register reviewer-of-record sign-off for the bottom-decile and top-decile tail scenes, and the hallway-test comprehension recording).

## v0.5.0-anchor-pages-frozen — pending

The v0.5.0 release will tag the methodology corpus once the 7 anchor pages (Story 5.2) are merged to main. The tag freezes the typographic and tonal system for the corpus. Epic 6's score-panel and tail-scene CSS components are built against the frozen state.

## v0.1.0 — 2026-05

The v0.1.0 release ships the initial Epic-3 stub methodology pages: `scoring/percentile-to-iq/index.md`, `scoring/uncertainty/index.md`, `scoring/overview/index.md`. These three pages are the click-targets behind the score-panel triplet in the Epic-3 vertical slice. The pages are honest stubs; the v0.5.0 release expands them in place per the FR28 permalink commitment (URLs unchanged across version bumps).

## Format

Each entry above is shipped with a tag of the form `corpus-v<X>.<Y>.<Z>`. The release pipeline applies the tag when the corresponding methodology change merges to main. The Epic-8 release-automation story will land the tag-emission CI workflow. Until then, tags are applied manually by maintainers.

A change that does not affect citation does not appear in the changelog. Editorial fixes to prose, typographic refinements that do not alter computed-style assertions, and dependency updates that do not change a claim are committed without a changelog entry. A change that alters a claim, adds a page, or removes a page does require an entry.
