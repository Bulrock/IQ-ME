---
id: 12-1-methodology-landscape-research-accuracy-popularity-comparison
title: "Story 12-1: Methodology landscape research — candidate tests, accuracy & popularity comparison"
status: done
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

- [x] **Task 1: author the scaffold guard** (`tests/scaffold/12-1-methodology-research.test.mjs`) encoding AC 6. Confirm RED. (test-author phase)
- [x] **Task 2: write the research artifact** (`_bmad-output/planning-artifacts/methodology-landscape-research.md`) satisfying AC 1–5 — candidate enumeration, sourced claims, shortlist with short/full variants, corpus-content identification, gating contract; grounded only in public/verifiable sources (no fabricated statistics). (impl phase)
- [x] **Task 3: verification** — guard GREEN, `make lint`/`make build` exit 0; confirm no `src/`/corpus/snapshot touched. (integration phase)

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

- Methodology-landscape research: 5+ candidates (ICAR-MR/VR/LN/R3D + WAIS/SB context), ICAR+Condon&Revelle sourcing (no fabricated stats), shortlist with short/full variants, ICAR-LN as 12-4 first slice, corpus-content list, gating contract for 12-2..12-5. Guard 5/5, lint 0, build 0.

### File List

- _bmad-output/planning-artifacts/methodology-landscape-research.md
- tests/scaffold/12-1-methodology-research.test.mjs

## Specialist Self-Review

**Decisions made:**
- Anchored the shortlist on **other openly-licensed ICAR subscales** (Verbal Reasoning, Letter/Number Series, Three-Dimensional Rotation) rather than new external instruments — IQ-ME already depends on the ICAR CC BY-NC-SA license and SVG/text item pipeline, so these add zero new licensing risk and reuse the existing IRT scoring path.
- Named WAIS and Stanford–Binet **for recognizability/validity context only** and explicitly excluded them: proprietary, licensed, clinician-administered, not redistributable — implementing them would violate the public-redistribution and zero-third-party constraints.
- Chose **ICAR Letter/Number Series (ICAR-LN)** as the recommended first non-geometric vertical slice (12-4): locale-robust (digits/letters, minimal translation cost), pure text, simplest to localize across EN/RU/PL, and reuses the dichotomous IRT model already in `state.js`.

**Alternatives considered:**
- Implementing a Raven's-style test from scratch: rejected — the recognizable Raven's APM/SPM forms are commercial/copyrighted; the open matrix equivalent is exactly ICAR-MR, which IQ-ME already ships.
- ICAR Verbal Reasoning first: deferred to P3 — verbal items are the most translation-sensitive (EN/RU/PL), so highest cost; better to prove the multi-methodology engine on locale-robust series items first.
- Inventing precise psychometric statistics (g-loadings, correlations) to make the comparison look authoritative: refused per the no-fabrication discipline — claims are cited to the ICAR project + Condon & Revelle (2014); precise figures are left for the corpus author (12-5) to cite directly from source rather than invented here.

**Framework gotchas avoided:**
- The guard forbids invented `r = 0.xx` / precise g-loading patterns; wrote the artifact qualitatively-but-sourced so it passes honestly (the bar is *cited*, not *number-free*).
- Each new methodology needs its OWN calibrated item-parameters set sourced from the ICAR pool (analogous to `src/items/item-parameters.json`) — flagged so downstream stories don't reuse the matrix parameters for a different construct.

**Areas of uncertainty:**
- Exact full-variant item counts (~24–32 for MR, ~20 for LN/VR, ~16 for R3D) are reasoned starting points balancing standard-error reduction against session length; 12-3/12-4 should confirm against the actual ICAR pool sizes and the golden-vector parity budget.
- Whether ICAR-VR is worth the translation cost for a 3-locale free screener is a real product call left open (P3, after the engine is proven).

**Tested edge cases:**
- 12-1 guard (5 assertions) GREEN: ≥5 candidates with construct/licensing/feasibility fields; ICAR + Condon/Revelle sourcing with no fabricated-stat patterns; shortlist with short+full variants + the 16-item baseline + proprietary exclusions; corpus-content identification with NFR27 mirroring; gating contract mapping 12-2..12-5 + the unsourced-methodology bar.
- `make lint` 0, `make build` 0 (planning doc — no corpus/snapshot/token impact).
