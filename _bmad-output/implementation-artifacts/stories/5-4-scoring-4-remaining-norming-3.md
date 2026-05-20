---
id: 5-4-scoring-4-remaining-norming-3
title: "Story 5.4: Scoring (4 remaining) + Norming (3)"
status: review
tds:
  primary_specialist: frontend
  story_tags:
    - methodology-corpus
    - scoring
    - norming
    - claims-manifest
---

# Story 5.4: Scoring (4 remaining) + Norming (3)

## Story

Author the 4 remaining Scoring pages (`irt-2pl`, `eap`, `percentile-to-iq` already exists at `scoring/percentile-to-iq/index.md`, `golden-vectors`) and all 3 Norming pages (`sapa-sample`, `representativeness`, `flynn-effects`). Each Scoring page's frontmatter `asserts:` maps to engine claims so `lint-claims-manifest --strict` finds matching pages for every claim.

## Acceptance Criteria

1. **AC-1 (Scoring pages):**
   - `src/content/methodology/en/scoring/irt-2pl.md` — asserts `irt-2pl-model`.
   - `src/content/methodology/en/scoring/eap.md` — asserts `eap-estimation-method`, `quadpts-61`, `theta-lim-pm-6`, `prior-standard-normal`.
   - `src/content/methodology/en/scoring/percentile-to-iq/index.md` — **already exists** from Story 3.6; verify asserts include `percentile-from-standard-normal-cdf` and `iq-scale-mean-100-sd-15`.
   - `src/content/methodology/en/scoring/golden-vectors.md` — asserts `golden-vector-parity-0001-logits`; pins R 4.4.x + mirt 1.41.x + `set.seed(20260514)` reference implementation per NFR22.

2. **AC-2 (Norming pages):**
   - `src/content/methodology/en/norming/sapa-sample/index.md`
   - `src/content/methodology/en/norming/representativeness/index.md` — discloses young/online/educated skew explicitly (Risk #3).
   - `src/content/methodology/en/norming/flynn-effects/index.md` — addresses cohort-effect honestly.

3. **AC-3 (claims-manifest strict pass):**
   - `lint-claims-manifest --strict` passes with zero deferred WARNs for the 6 scoring claims (the 6 claims now have authored methodology pages).

4. **AC-4 (FK ≤ 12):**
   - All 6 new pages + the existing `percentile-to-iq/index.md` (if modified) pass `lint-reading-level`.

5. **AC-5 (anchor-pages.test.mjs extension):**
   - Add 7 new pages (4 scoring + 3 norming, but percentile-to-iq already exists) to the test's `ANCHOR_PAGES` list. Net: +6 entries.

6. **AC-6 (Makefile + lint):**
   - `make test/lint/build` exit 0.

7. **AC-7 (deferred):**
   - Golden-vector regeneration `R` script run: out-of-scope — the R harness from Story 2.6a/b already exists; this story is documentation-only.

## Tasks / Subtasks

- [x] **Task 1: Author 4 Scoring pages (irt-2pl, eap, golden-vectors; verify percentile-to-iq)** (AC-1)
- [x] **Task 2: Author 3 Norming pages** (AC-2)
- [x] **Task 3: Extend anchor-pages.test.mjs with 6 new entries** (AC-5)
- [x] **Task 4: Verify lint-claims-manifest strict pass** (AC-3)
- [x] **Task 5: Full baseline (make test/lint/build)** (AC-6)
- [x] **Task 6: Branch + state hygiene**

## Dev Notes

- Story 2.7 populated `METHODOLOGY_CLAIMS.json`; this story authors the matching methodology pages.
- Plain-language FK ≤12. Short sentences.
- New glossary entries may be needed (e.g. `irt`, `eap`, `theta`, `quadrature`) — add when used in `glossaryRefs:`.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- 4 Scoring + 3 Norming pages; lint-claims-manifest --strict exit 0 with zero deferred WARNs; 9/9 claims have authored pages; 20 EN pages all FK ≤12; make test 817/817+1skip; lint+build exit 0.

### File List

- src/content/methodology/en/scoring/irt-2pl.md
- src/content/methodology/en/scoring/eap.md
- src/content/methodology/en/scoring/golden-vectors.md
- src/content/methodology/en/scoring/percentile-to-iq/index.md
- src/content/methodology/en/norming/sapa-sample/index.md
- src/content/methodology/en/norming/representativeness/index.md
- src/content/methodology/en/norming/flynn-effects/index.md
- tests/scaffold/anchor-pages.test.mjs
- tests/unit/tools/lint-claims-manifest.test.mjs

## Specialist Self-Review

## Specialist Self-Review

**Decisions made:**
1. **`scoring/irt-2pl.md`, `scoring/eap.md`, `scoring/golden-vectors.md` authored at the flat top-level** (not `irt-2pl/index.md`) because `METHODOLOGY_CLAIMS.json` mapped them that way. Following the manifest is the load-bearing contract.
2. **Did NOT add `iq-scale-mean-100-sd-15` to `percentile-to-iq` asserts** — that claim is mapped to `scoring/overview/index.md` per the manifest. Adding it to both pages would be redundant and the lint doesn't require it.
3. **Cleared `pending: true` from `scoring/percentile-to-iq/index.md`** — it's a real authored anchor page now, not a stub.

**Alternatives considered:**
- Adding glossary entries `irt`, `eap`, `theta`, `quadrature` — not needed; pages explain inline. Add later if a reader trips up.

**Framework gotchas avoided:**
- The lint expects flat-path `scoring/irt-2pl.md`, not `scoring/irt-2pl/index.md`. Verified by reading the manifest's `methodology-path` values.
- Updated `lint-claims-manifest.test.mjs` AC-4.1/AC-4.2 — the prior tests asserted WARN lines for Epic-5 deferrals; those deferrals are now structurally cleared.

**Areas of uncertainty:**
- Whether reviewer (psychometrician) will want longer prose on irt-2pl or eap. Current pages are accurate but brief; editorial follow-ups can expand without breaking structure.

**Tested edge cases:**
- All 20 EN pages now pass lint-frontmatter, lint-glossary, lint-reading-level (FK ≤12), lint-license-provenance.
- lint-claims-manifest --strict exit 0 with 9 claims, zero WARNs (load-bearing AC-3).
- make test 817/817+1skip. lint exit 0. build exit 0.

## Auditor Findings (round-1)

### [blocker] `tds integrity verify` reports sha256 mismatch on `tests/unit/tools/lint-claims-manifest.test.mjs` (artefact_class=A, registered story 4-3, recorded 2026-05-20T00:28:53Z; expected bb945c…, actual 0a1d11…). Specialist Self-Review §2 discloses the intentional modification ("Updated `lint-claims-manifest.test.mjs` AC-4.1/AC-4.2 — the prior tests asserted WARN lines for Epic-5 deferrals; those deferrals are now structurally cleared") — intent transparent but integrity registry not re-registered. Same lesson-2026-05-19-001 (severity=high) as 5-2 finding.


- **Category:** integrity-drift
- **Suggested fix:** Recommended: while on epic/5, run `tds integrity record --as=engineer --file=tests/unit/tools/lint-claims-manifest.test.mjs --story=5-4-... --notes="Story 5-4 AC-4.1/AC-4.2 deferral-WARN clearance"`, then `tds state-commit -m "chore(5-4): re-register lint-claims-manifest test after deferral clearance" --story=5-4-... --as=engineer`, then re-verify.
- **Resolved:** Re-registered via `tds integrity record --as=engineer --files=tests/unit/tools/lint-claims-manifest.test.mjs --reason="..."` at 2026-05-20T11:41:12Z. `tds integrity verify` → exit 0. Sweep commits: 849ca95, bf9980f.

