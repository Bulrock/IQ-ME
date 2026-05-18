---
stepsCompleted: ['step-01-document-discovery', 'prd-only-review']
filesIncluded:
  - '{output_folder}/planning-artifacts/prd.md'
filesMissing:
  - architecture document (none found)
  - ux design document (none found)
  - epics & stories (none found)
scope: 'PARTIAL — PRD-only sanity review (Architecture/UX/Epics absent)'
status: 'partial-review-complete'
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-15
**Project:** IQ-ME
**Author:** CEP (review by Claude as PM-auditor)

---

## ⚠️ Scope Clarifier — Read This First

The standard Implementation Readiness check validates **PRD ↔ UX ↔ Architecture ↔ Epics/Stories alignment**. Three of those four artifacts do not exist yet in `{output_folder}/planning-artifacts/`:

- **Architecture:** missing
- **UX Design:** missing
- **Epics & Stories:** missing

By user direction, this report is scoped to a **PRD-only sanity review** of `prd.md` (919 lines, frontmatter-recorded as complete on 2026-05-14). It assesses:

1. Internal consistency
2. Completeness against PRD standards
3. Implementation-readiness signals (can downstream artifacts be derived from this?)
4. Gaps that would block Architecture/UX/Epics generation

It does **not** assess cross-artifact alignment. A full readiness pass must be re-run after Architecture, UX, and Epics exist.

---

## Document Inventory

| Type | File | Status |
|---|---|---|
| Product Brief | `product-brief-IQ-ME.md` | Present (input to PRD per frontmatter) |
| Product Brief Distillate | `product-brief-IQ-ME-distillate.md` | Present (input to PRD per frontmatter) |
| **PRD** | **`prd.md`** | **Present; frontmatter status: `complete`** |
| Architecture | — | **Missing** |
| UX Design | — | **Missing** |
| Epics & Stories | — | **Missing** |

---

## Summary Verdict

**PRD quality: high.** This is an unusually rigorous PRD — comprehensive carry-forward register, traced FR↔Journey↔Innovation↔Success-criteria cross-references, quantified NFRs, explicit non-goals, explicit risk register with mitigations. It is materially ready to drive Architecture and UX work.

**Blocking issues for Epics/Stories generation: small but real.** Several items in the frontmatter `openDecisions` register were resolved in the PRD body but never closed in the register; one decision remains genuinely open; a handful of FRs are under-specified at the level of detail epics need.

**Recommendation:** before invoking `/bmad-create-architecture`, `/bmad-create-ux-design`, and `/bmad-create-epics-and-stories`, reconcile the open-decisions ledger and close the gaps in §"Blocking Gaps" below. Estimated effort: 1–2 focused passes on the PRD.

---

## Strengths (worth preserving as Architecture/Epics are written)

- **Frontmatter as ledger.** `stepsCompleted` array, classification record, party-mode rounds, carry-forward register linking source steps → epic candidates → NFR candidates → open decisions → scope adjustments. This is a textbook traceability surface.
- **Measurable success gates.** The 8-row `Measurable Outcomes` table (lines 152–160) gives binary or threshold gates with explicit measurement methods. Epics can hang acceptance off these.
- **Six user journeys including the hardest scenes.** Bottom-decile (Mikhail, lines 232–250), top-decile anti-credentialization (Daria, lines 260–281), skeptic (Tomáš, 283–307), citer who never takes the test (Karolina, 309–329), translation-PR contributor (Marek, 331–351). The Journey Requirements Summary table (lines 356–384) maps every revealed capability to its source journeys.
- **53 FRs grouped by capability area + 35 NFRs grouped by quality attribute,** with a self-validation cross-reference at the end of each that ties back to earlier sections. This level of internal traceability is rare.
- **Quantified NFR thresholds** — FCP <1.5s, ±0.001 logits, CSP string spelled out, page-weight budgets, WCAG 2.2 AA, sentence-length caps per language. Not "fast / accessible / secure" hand-waving.
- **Explicit anti-scope.** "Forbidden integrations" list (lines 459–466) and "anything not in either list is out of v1 scope" (line 728) prevent epic-creep.
- **Risk register with named mitigations and owning artifacts** (lines 480–494 and 561–570). Each risk has a structural mitigation, not a wish.
- **Solo-dev cognitive load is a budgeted NFR** (NFR32). Forces the Architecture pass to stay simple.

---

## Blocking Gaps (resolve before generating Architecture/UX/Epics)

### B1. Open-decisions ledger is stale relative to PRD body

Frontmatter `openDecisions` (lines 59–66) lists 7 decisions to lock "before epic-definition step." Of those:

| # | Frontmatter open decision | PRD body says | Action |
|---|---|---|---|
| 1 | CTT vs IRT-EAP for v1 | **Decided: IRT 2PL EAP** (FR14, NFR22, Innovation #5) | Close in frontmatter |
| 2 | Item delivery: fixed-form vs randomized order | **Partially decided**: FR7 says "subset … reproducible given the session and not pre-predictable across independent sessions" — but session-item-count, seeding strategy, and image-augmentation are not pinned | Pin in body, then close |
| 3 | Bail-out mid-session: partial / resume / discard | **Decided: discard-or-continue, no resume, no silent partial** (FR4) | Close in frontmatter |
| 4 | Share/screenshot policy | **Decided: no share UI; anti-screenshot composition** (FR24, FR25, Journey 3) | Close in frontmatter |
| 5 | Retake cooldown: soft / hard / show-prior | **Not decided** — FR27 commits only to *explaining* retest implications, not a cooldown mechanism | **Genuinely still open** |
| 6 | Locale-switch mid-session | **Decided: blocked** (FR8) | Close in frontmatter |
| 7 | Russia mirror: single-origin v1 vs mirror-ready v1 | **Decided: mirror-ready v1** (NFR17) | Close in frontmatter |

Net: 5 close-outs, 1 partial pin needed, 1 genuinely open. Epics for "retake cooldown" cannot be written without #5.

### B2. Test-session shape underspecified

The body never pins:

- **Item count per session** (Journey 2 mentions "16 items" in narrative; spec section nowhere fixes it; Journey 1 implies similar but ambiguous).
- **Seeding/PRNG strategy.** FR7's "reproducible given the session AND not pre-predictable across independent sessions" is contradictory unless there's an in-session seed. Is the seed user-visible (URL hash), persistent in memory only, or something else?
- **Image augmentation per draw.** Risk #2 mitigation (line 482) names "image-augmentation (rotation/reflection on draw)" but no FR reifies it. In scope or not?

Architecture and the scoring-engine epic both depend on these.

### B3. Uncertainty-band math is undocumented

FR15 commits to "an honest uncertainty band that includes measurement error **and** norming-sample uncertainty." NFR22 binds the scoring engine to R `mirt::fscores(method="EAP")` to ±0.001 logits — but mirt's EAP returns SEM only. How is norming-sample uncertainty mathematically combined with SEM into the displayed band? This is load-bearing (the visual co-equality of point estimate + band is Innovation Pillar #3) and the math is absent.

### B4. Tail-band terminology is inconsistent

User Success criterion #4 (line 116) reads "Bottom-decile testers (**P ≤ 25**)" — but P≤25 is the bottom quartile, not the bottom decile. Throughout the PRD the term "bottom-decile" is used for both the harm-mitigation scene (FR19) and the threshold the scene applies at. Either:

- (a) the threshold should be P≤10 to match "decile" naming, **or**
- (b) the term should be "bottom-quartile" with the P≤25 threshold preserved.

This will mis-scope the harm-mitigation epic if not fixed. Same risk on the top side: "top-decile (P≥90)" is internally consistent.

### B5. Methodology corpus content inventory is missing

NFR32 estimates "~30 methodology pages per locale" but no concrete page list exists. The PRD names categories (constructs, scoring, norming, ethics, glossary, changelog, citation) but no TOC. The Methodology Corpus epic cannot be sliced into stories without a page enumeration — and translation parity, reading-level lints, and reviewer-of-record per page all key off a stable inventory.

### B6. Methodology page versioning policy is ambiguous

`/methodology/v1.2.0/<lang>/<path>` permalinks are mandated (FR28, NFR25). Unclear:

- Is the version per-corpus-release (every page re-emitted under each new version, even unchanged) or per-page (versions bump only on page change)?
- Citers (Journey 5) need a permalink that *resolves forever*. Both policies satisfy that. But they imply very different storage and build behavior — and one of them needs to be the contract.

This is partly Architecture territory but the *policy* is PRD-level.

### B7. `mirt` reference version is not pinned

Golden vectors are mandated to agree with R `mirt::fscores(method="EAP")` to ±0.001 logits. `mirt` versions ship subtle defaults changes (quadrature node count, integration limits). Without a pinned version + invocation string, the parity test is irreproducible across CI runs that re-generate vectors. Pin: `mirt` version + R version + `quadpts`/`theta_lim` arguments + RNG seed for the simulated patterns.

### B8. Per-item-type breakdown ambiguity

FR22 promises a "per-item-type breakdown" on the result page. ICAR-MR is a single sub-test in v1 (per scoping). What are the *types* being broken down? Pattern-completion family? Difficulty band? Without a definition this FR cannot be implemented or designed.

---

## Non-Blocking Gaps (acceptable to defer; flag for Architecture/UX/Epics phase)

- **N1. No per-FR acceptance criteria.** FRs are one-sentence capability statements. Stories will need ACs; this is normal but worth flagging that ~53 FRs × ~3 ACs each is real work downstream.
- **N2. No data-model spec.** Item shape (a, b, c-parameters), response record, result record, methodology-claims manifest schema. Architecture will define; PRD-level absence is fine.
- **N3. Crisis-resource list curation policy.** Per-language list is mandated but no update cadence, stale-data handling, or curator-of-record discipline. Real ethics surface; defer to a dedicated content-governance doc.
- **N4. Build-process specification.** NFR21 reconciles the no-build invariant with the author-time `make build-methodology` step (build output IS the artifact, CI byte-for-byte verifies). Mechanism — who runs build, is HTML committed, does CI re-run build — is Architecture-territory.
- **N5. Outreach plans for external human gates.** Resource-requirements table names 5 external gates with mitigation postures. Concrete outreach playbooks (psychometrician shortlist, RU/PL translator outreach) are operational artifacts, not PRD. Defer.
- **N6. Score-reveal animation sequence enumerated.** NFR15 says reveal is "sequenced" and Journey 1 implies "Your result is ready" → "Show me / Not yet" → composition reveal. UX design will enumerate frames; not a PRD-level miss.
- **N7. CITATION.cff / Zenodo DOI minting workflow** is mandated as a capability but not as a runbook. Acceptable.

---

## Pre-Architecture / Pre-UX Checklist

Before invoking `/bmad-create-architecture` and `/bmad-create-ux-design`:

- [ ] **B1**: Reconcile open-decisions ledger — close 5, pin 1, decide 1 (retake cooldown)
- [ ] **B2**: Pin item count per session, seeding strategy, and image-augmentation scope
- [ ] **B3**: Define how norming-sample uncertainty combines with SEM into displayed band
- [ ] **B4**: Decide bottom-tail terminology + threshold (decile/P≤10 OR quartile/P≤25)
- [ ] **B5**: Enumerate methodology-corpus pages (concrete TOC, target ~30 per locale)
- [ ] **B6**: Pin methodology-page versioning policy (per-corpus-release vs per-page)
- [ ] **B7**: Pin `mirt` reference version + arguments + RNG seed for golden vectors
- [ ] **B8**: Define "per-item-type breakdown" categories for v1 ICAR-MR

None of these require external human input (translator, psychometrician, ICAR). All are author-decidable in 1–2 focused passes on the PRD.

---

## Recommended Next Steps

1. **Reconcile the 8 blocking gaps above** in `prd.md` (estimated 1–2 sessions).
2. **Run `/bmad-create-architecture`** — should be a relatively constrained pass given the rich technical-architecture, performance, and security material already in the PRD.
3. **Run `/bmad-create-ux-design`** — the journeys and score-delivery ceremony sections give the UX designer a strong starting brief; main work is the result-page composition + reveal sequence frames.
4. **Run `/bmad-create-epics-and-stories`** — the carry-forward `epicCandidates` register (lines 39–46) plus the Journey Requirements Summary table is a near-complete epic backbone.
5. **Re-run `/bmad-check-implementation-readiness`** with all four artifacts present for the full cross-artifact alignment audit this skill is designed for.

---

## Notes on the Review

- Reviewed: full text of `prd.md` (919 lines), including frontmatter, all sections, all journey narratives, all FR/NFR lists, and risk registers.
- Cross-referenced: frontmatter ledger ↔ body decisions ↔ Journey Requirements Summary table ↔ FR/NFR self-validation summaries.
- Out of scope (declared above): cross-artifact alignment with Architecture/UX/Epics (artifacts absent).
- The product brief and distillate were not re-read for this pass — frontmatter records them as PRD inputs and that traceability is sufficient for a PRD-internal sanity review.
