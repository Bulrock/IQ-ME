---
id: 12-1-methodology-landscape-research-accuracy-popularity-comparison
title: "Story 12-1: Methodology landscape research — candidate tests, accuracy & popularity comparison"
status: in-progress
---

# Story 12-1: Methodology landscape research — candidate tests, accuracy & popularity comparison

## Story

As the IQ-ME maintainer deciding how to expand beyond geometric matrix reasoning (PR-15),
I want a researched, sourced comparison of established intelligence-test methodologies by validity/accuracy, popularity, licensing/openness, and browser-feasibility,
so that the choice of which tests to add — and the short/full item-count design — is evidence-based rather than arbitrary.

## Epic context

Epic 12 is **research-first**: this story gates the implementation stories (12-2 selector, 12-3 variant engine, 12-4 first non-geometric vertical slice, 12-5 corpus pages). Its deliverable is a research artifact under `_bmad-output/planning-artifacts/` plus a structural scaffold guard. No product code. Every accuracy/popularity claim must be sourced (claims-manifest discipline by analogy) — no fabricated statistics. The shortlist + short/full variant design it produces feeds the downstream stories.

## Acceptance Criteria

**Given** the need for an evidence base (PR-15),
**When** the research is conducted,
**Then** a research artifact `methodology-landscape-research.md` exists under `_bmad-output/planning-artifacts/` enumerating candidate methodologies, each with: construct measured, validity/accuracy evidence (with citations), popularity/recognition, licensing/openness for reuse, and browser-feasibility notes.
1. The artifact enumerates ≥5 candidate methodologies (e.g. Raven's-style progressive matrices / ICAR Matrix Reasoning, ICAR Verbal Reasoning, ICAR Letter/Number Series, ICAR Three-Dimensional Rotation, plus a recognized battery reference such as WAIS/Stanford–Binet for context), each with: construct, validity/accuracy basis (cited), popularity/recognition, licensing/openness, browser-feasibility.
2. Every accuracy and popularity claim is **sourced** — references point to public, verifiable sources (the ICAR project / International Cognitive Ability Resource, published psychometric literature, openly-documented item pools). NO fabricated statistics, sample sizes, or correlation coefficients invented for effect.
3. The artifact recommends a concrete **shortlist** of methodologies to implement, each with a proposed **short and full variant** (item counts + difficulty spread), and explicitly flags unsuitable ones (proprietary/licensed like WAIS/Raven's commercial forms, or not browser-feasible).
4. The artifact identifies which content must enter the methodology corpus for PR-15 (per-test descriptions + the accuracy/popularity comparison) — the input to Story 12-5.
5. The artifact states the **gating contract**: the follow-on implementation stories (12-2..12-5) proceed from this output, and no implementation story proceeds on an unsourced methodology. It maps each downstream story to the shortlist.
6. A `tests/scaffold/` guard asserts AC 1–5 structurally: artifact exists; ≥5 candidates with the required fields; a sourced-claims discipline (no obviously-fabricated stat patterns); a shortlist with short/full variants; the corpus-content identification; the gating contract. RED before artifact exists, GREEN after.
7. `make lint` exit 0, `make build` exit 0. Planning doc only — no corpus/snapshot/token impact.

## Tasks / Subtasks

- [ ] **Task 1: author the scaffold guard** (`tests/scaffold/12-1-methodology-research.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [ ] **Task 2: write the research artifact** (`_bmad-output/planning-artifacts/methodology-landscape-research.md`) satisfying AC 1–5 — candidate enumeration, sourced claims, shortlist with short/full variants, corpus-content identification, gating contract; grounded only in public/verifiable sources (no fabricated statistics). (impl phase)
- [ ] **Task 3: verification** — guard GREEN, `make lint`/`make build` exit 0; confirm no `src/`/corpus/snapshot touched. (integration phase)

## Dev Notes

- Ground in public, verifiable sources only: the ICAR project (International Cognitive Ability Resource, openly-published CC BY-NC-SA item pools — already the basis of the existing IQ-ME matrix test), and well-established psychometric facts (e.g. that matrix reasoning loads strongly on fluid intelligence g; that proprietary clinical batteries like WAIS/Stanford–Binet are licensed and NOT redistributable). Do NOT invent specific correlation coefficients or sample sizes.
- The existing geometric matrix test = the ICAR Matrix Reasoning short variant; the shortlist should prefer **other openly-licensed ICAR subscales** (Verbal Reasoning, Letter/Number Series, Three-Dimensional Rotation) because they share the ICAR licensing basis IQ-ME already depends on — browser-feasible (text/SVG), no new licensing risk.
- Mirror the no-fabrication discipline of the 9-series gates: cite real sources, flag unknowns as such.
- This artifact is the single source of truth for 12-2..12-5; pin variant item counts concretely.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): trust-critical artifacts must not fabricate specifics. Apply: cite only public/verifiable sources; no invented psychometric statistics.
- lesson-2026-06-03-001 (high): scaffold guards run under `make test`. Apply: the guard runs via `make test`.
- Corpus-edit parity cascade (project memory): 12-1 touches no corpus body; NFR27 does not fire. (12-5 will, when it authors EN corpus pages.)

### Project Structure Notes

- New doc: `_bmad-output/planning-artifacts/methodology-landscape-research.md`.
- New test: `tests/scaffold/12-1-methodology-research.test.mjs`.
- No `src/`, `corpus/`, snapshot, or token change.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 12: Methodology Expansion]
- [Source: src/items/item-parameters.json] (existing ICAR Matrix Reasoning item pool — the baseline methodology)
- [Source: src/scoring/irt/*] (the existing IRT engine the new methodologies build on)

## Dev Agent Record

### Agent Model Used

engineer (research/spec; methodology-landscape gate for Epic 12)

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
