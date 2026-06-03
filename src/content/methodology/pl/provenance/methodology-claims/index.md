---
title: "Methodology claims — engine and corpus coupling"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "a88f5518316815988f9d460ae66ac314244de64c1d3ffe21063881a51c13d410"
translationStatus: "in-progress"
---

# Methodology claims — engine and corpus coupling

A scoring engine is a set of design choices about how to turn responses into a score. A methodology corpus is a set of statements about what those design choices are. If the two drift, the public record about the screener stops being honest.

IQ-ME enforces the coupling mechanically. The file `METHODOLOGY_CLAIMS.json` at the repository root lists every load-bearing design choice in the engine. Each claim names the engine source file that implements it, the methodology page that documents it, and the value or formula in question.

On every CI run, the project's lint-claims-manifest tool walks the manifest. For each claim, it verifies the methodology page exists and that the page's frontmatter declares the matching claim in its `asserts:` list. If a claim's engine source changes without the methodology page tracking it, CI fails the pull request.

The current manifest covers nine claims. They span the IRT 2PL model formula, the EAP estimation method, the quadrature points and theta range, the prior on the latent ability scale, the percentile-from-normal-CDF transform, the IQ-scale mean and standard deviation, the root-sum-square uncertainty combination, and the golden-vector parity tolerance against the R reference implementation.

A reader who wants to audit the screener can read the manifest, follow each claim's `methodology-path` link to read what the project says about that choice, and then read the engine source at the `engine-source` path to verify the code matches. The auditable surface is small enough — about 250 lines of pure-function scoring code — that the audit can be done in under ten minutes by anyone with a working `node` installation.

Innovation pillar #2 of the project is methodology-as-coupled-artefact. The mechanical CI enforcement of `METHODOLOGY_CLAIMS.json` is the technical surface that makes the pillar real. Without the manifest, the coupling would be a documentation aspiration; with it, the coupling is a CI gate.
