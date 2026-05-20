---
title: "How to cite IQ-ME"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# How to cite IQ-ME

A citer who refers to IQ-ME in academic, journalistic, or wiki-encyclopaedic work should cite the specific corpus version they read, not a generic project reference. The corpus version anchors the citation to a frozen state of the methodology that the reader can verify.

IQ-ME ships two citation templates on every methodology page: an APA-style entry and a Wikipedia-template entry. Both are filled in by the cite-this-page widget at the foot of each page. The widget reads the page's frontmatter for the version, last-reviewed date, and reviewer, and produces a copy-pasteable citation block.

The APA-style entry uses the form: `IQ-ME Project. (YYYY-MM-DD). Title of page. IQ-ME methodology v<version>. <permalink>`. The permalink is the versioned URL pattern `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/`.

The Wikipedia-template entry uses the form: `{{cite web | title= | url= | website=IQ-ME | date= | access-date= | version= }}`. A citer in MediaWiki can paste the block directly into a reference list.

The BibTeX format is a nice-to-have for academic work. It is not in the v1 launch; it will land in a v1.0.1 follow-up. The CITATION.cff file at the repository root provides the underlying citation metadata in a machine-readable form. A citation-manager that reads CFF can produce BibTeX from it.

The DOI permanence guarantee in the project's non-functional requirements means a corpus version, once released, has a stable URL. The Internet Archive and Software Heritage archival redundancy commitment means the URL will continue to resolve even if the project's primary hosting fails. Citers can rely on the version permalink as a long-term reference.

The full per-corpus-release versioning policy lives in the changelog. A new version is cut when the methodology corpus changes in a way that affects a citation. Patch releases for typographic fixes do not change the citation; minor releases that add content do; major releases that change a claim require a corresponding bump of the engine version.
