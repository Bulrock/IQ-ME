---
id: 2-7-populate-methodology_claims-json-activate-lint-claims-manifest
title: "Story 2.7: Populate METHODOLOGY_CLAIMS.json + activate lint-claims-manifest"
status: ready-for-dev
---

# Story 2.7: Populate METHODOLOGY_CLAIMS.json + activate lint-claims-manifest

## Story

As a **Tomáš-the-skeptic verifying the claims-as-coupled-artifact innovation pillar #2**,
I want **the scoring engine's declared methodology dependencies committed at `METHODOLOGY_CLAIMS.json` and `tools/lint-claims-manifest.mjs` activated in warn-mode (graduated from "green on empty" Epic-1 state to "green on populated, warn on missing methodology pages")**,
so that **subsequent epics' methodology pages MUST declare matching `asserts:` frontmatter or CI warns (and Story 4.3 graduates the lint to `--strict` fail mode at the corpus pipeline cutover) — drift is mechanically impossible from this point forward**.

This is the final story of Epic 2 — closes out the scoring-engine + claims-manifest deliverable. After 2.7, every load-bearing claim in `src/scoring/irt/` is named, sourced, and linked to the future methodology page that will document it.

## Acceptance Criteria

1. **AC-1 (`METHODOLOGY_CLAIMS.json` populated with 9 engine claims):**
   - File at repo root: `METHODOLOGY_CLAIMS.json`.
   - Contains `version: "1.0.0"` and a `claims:` array with at least these 9 entries (one per load-bearing claim of the scoring engine):
     1. `irt-2pl-model` — engine-source: `src/scoring/irt/likelihood.js` — methodology-path: `src/content/methodology/en/scoring/irt-2pl.md` — value-or-formula: `P(correct | θ, a, b) = 1 / (1 + exp(-a(θ - b)))`
     2. `eap-estimation-method` — engine-source: `src/scoring/irt/eap.js` — methodology-path: `src/content/methodology/en/scoring/eap.md` — value-or-formula: `θ_EAP = Σ_i nodes[i] · L(nodes[i] | r) · weights[i] / Σ_i L(nodes[i] | r) · weights[i]`
     3. `quadpts-61` — engine-source: `src/scoring/irt/quadrature.js` — methodology-path: `src/content/methodology/en/scoring/eap.md` — value-or-formula: `quadpts = 61`
     4. `theta-lim-pm-6` — engine-source: `src/scoring/irt/quadrature.js` — methodology-path: `src/content/methodology/en/scoring/eap.md` — value-or-formula: `theta_lim = [-6, 6]`
     5. `prior-standard-normal` — engine-source: `src/scoring/irt/quadrature.js` — methodology-path: `src/content/methodology/en/scoring/eap.md` — value-or-formula: `weights[i] = φ(nodes[i]) / Σ_j φ(nodes[j]), φ = N(0, 1) PDF`
     6. `percentile-from-standard-normal-cdf` — engine-source: `src/scoring/irt/index.js` — methodology-path: `src/content/methodology/en/scoring/percentile-to-iq.md` — value-or-formula: `percentile = 100 · Φ(θ), Φ = N(0, 1) CDF (Abramowitz & Stegun 7.1.26)`
     7. `iq-scale-mean-100-sd-15` — engine-source: `src/scoring/irt/index.js` — methodology-path: `src/content/methodology/en/scoring/percentile-to-iq.md` — value-or-formula: `iqScale = round(100 + 15 · θ)`
     8. `se-total-rss` — engine-source: `src/scoring/irt/se.js` — methodology-path: `src/content/methodology/en/scoring/uncertainty.md` — value-or-formula: `SE_total = √(SEM² + SE_norming²)`
     9. `golden-vector-parity-0.001-logits` — engine-source: `src/scoring/irt/index.js` — methodology-path: `src/content/methodology/en/scoring/golden-vectors.md` — value-or-formula: `|θ_js - θ_r_mirt| ≤ 0.001 over ≥1000 patterns, R 4.4.x + mirt 1.41.x + set.seed(20260514)`
   - File validates against `corpus/methodology-claims-v1.schema.json` (verified via `jsonschema`-style check OR a unit test that loads schema + claims and applies AJV-style validation using pure-JS regex per the schema patterns; AJV itself is not a runtime dep per NFR33).

2. **AC-2 (`tools/lint-claims-manifest.mjs` exists + runs):**
   - File at `tools/lint-claims-manifest.mjs`.
   - Loads `METHODOLOGY_CLAIMS.json` from repo root.
   - Validates each claim's `engine-source` exists on disk (the JS file).
   - For each claim, checks if its `methodology-path` exists on disk. If MISSING:
     - In **warn-mode** (default for this story): emits `WARN <claim-id>: expected methodology page at <path> not yet created (Epic 5)` to stderr; CONTINUES to next claim; exits 0 at end.
     - In **strict-mode** (`--strict` flag; Story 4.3 will flip CI to use it): emits `ERROR <claim-id>: ...` to stderr; exits 1 if any claim has missing methodology page.
   - For each claim that DOES have a methodology page, reads the page's YAML frontmatter `asserts:` field and verifies it contains the `claim-id`. If frontmatter `asserts:` missing or doesn't contain the claim:
     - warn-mode: warn message; continue.
     - strict-mode: error; exit 1.
   - Exit 0 by default on Epic-2 state (no methodology pages exist yet; lint emits 9 warnings, exits 0 per AC).

3. **AC-3 (warn-mode is the default in this story; --strict deferred):**
   - The lint script accepts `--strict` flag but does NOT default to it.
   - The `pr-checks.yml` `lint-claims-manifest` job currently has `if: false` (deferred); this story does NOT activate it (per spec line 921 — "this story does NOT flip the strict flag"). Activation happens in Story 4.3.
   - **However**, this story SHOULD activate the warn-mode invocation in pr-checks.yml? Re-reading spec line 920–921: "the lint exits 0 (warnings allowed until Story 4.3 graduates the flag)". The lint should be **runnable** but pr-checks doesn't need to call it yet — that's Story 4.3's responsibility (the strict-graduation). For Story 2.7, `lint-claims-manifest` job remains `if: false` in pr-checks; ad-hoc local invocations + future Story 4.3 activation are the consumers.
   - **Decision:** Story 2.7 leaves `lint-claims-manifest` job in pr-checks.yml at `if: false` per Murat's duplicate-gate-trap finding (spec line 924–926). Story 4.3 owns the activation.

4. **AC-4 (unit test for `lint-claims-manifest.mjs`):**
   - File `tests/unit/tools/lint-claims-manifest.test.mjs`.
   - Asserts:
     1. Script runs against the real `METHODOLOGY_CLAIMS.json` and exits 0 in warn-mode (current state: no methodology pages → all 9 claims emit warnings; warn-mode exits 0).
     2. Synthetic `--strict` invocation with same fixture exits 1.
     3. Synthetic invocation with mock methodology page file that contains correct `asserts:` frontmatter → that specific claim emits no warning.
     4. Synthetic invocation with broken JSON → script exits 1 with parse error.

5. **AC-5 (`METHODOLOGY_CLAIMS.json` schema validation test):**
   - File `tests/unit/methodology-claims/schema.test.mjs`.
   - Loads `METHODOLOGY_CLAIMS.json` + `corpus/methodology-claims-v1.schema.json`.
   - Validates the file against the schema using a pure-JS validator (no third-party AJV; manual regex/type checks per schema spec).
   - Asserts each claim has all required fields with correct patterns.
   - Asserts version is `1.0.0`.

6. **AC-6 (`make test` exit 0 + budget):**
   - All 286+ tests pass (existing 284 + 2 new = 286+).
   - ESLint clean on new JS files.
   - `lint-cognitive-load-budget.mjs` — new files in `tools/` (outside scoring-irt budget); no scoring-irt impact.

7. **AC-7 (`tools/lint-claims-manifest.mjs` is also runnable via `make lint`):**
   - Add `lint-claims-manifest.mjs` invocation to the `lint` target in `Makefile` (warn-mode, no `--strict`).
   - `make lint` exits 0 even though the lint emits 9 warnings to stderr (warnings ≠ errors).

8. **AC-8 (no scoring-irt source mutation; no other story scope creep):**
   - `src/scoring/irt/*.js` MUST NOT be modified.
   - Frozen tests MUST NOT be modified.
   - Existing `tests/golden/*` fixtures MUST NOT be modified.
   - Story 4.3 explicitly retains the `--strict` graduation; this story does NOT pre-empt it.

## Tasks / Subtasks

- [ ] **Task 1 — Author `METHODOLOGY_CLAIMS.json`** (AC: 1)
  - [ ] Create `METHODOLOGY_CLAIMS.json` at repo root with the 9 claims listed in AC-1.
  - [ ] `version: "1.0.0"`, JSON-valid, 2-space indent, trailing newline.
  - [ ] Each claim has all 4 required fields per schema; methodology-path conforms to the `src/content/methodology/[a-z]{2}/.+\.md` pattern.

- [ ] **Task 2 — Author `tools/lint-claims-manifest.mjs`** (AC: 2, 3)
  - [ ] Pure Node.js, no third-party deps (NFR33).
  - [ ] CLI args: `--strict` (default off) + `--manifest=<path>` (default `METHODOLOGY_CLAIMS.json`).
  - [ ] Load + schema-validate the manifest (basic structure check).
  - [ ] For each claim: existsSync on engine-source → ERROR if missing (always exits 1, regardless of mode; missing engine source is a hard failure).
  - [ ] For each claim: existsSync on methodology-path → in warn-mode emit warn to stderr, continue; in strict-mode emit error to stderr, set exit code 1.
  - [ ] For each claim with present methodology page: read frontmatter `asserts:` field; verify it contains the claim-id; warn/error per mode.
  - [ ] Final exit 0 in warn-mode (unless engine-source missing); strict-mode exits 1 if any methodology-path / asserts-missing issues.

- [ ] **Task 3 — Author `tests/unit/tools/lint-claims-manifest.test.mjs`** (AC: 4)
  - [ ] 4 AC-4 sub-tests as spawnSync-based shell-out tests.
  - [ ] Use temp dirs for mock methodology pages.

- [ ] **Task 4 — Author `tests/unit/methodology-claims/schema.test.mjs`** (AC: 5)
  - [ ] Load + parse `METHODOLOGY_CLAIMS.json`.
  - [ ] Manual schema validation against pattern from `corpus/methodology-claims-v1.schema.json`.
  - [ ] Verify all 9 claims exist with required fields + correct patterns.

- [ ] **Task 5 — Add lint-claims-manifest to Makefile lint target** (AC: 7)
  - [ ] Add `node tools/lint-claims-manifest.mjs` line to `lint` target (warn-mode, no `--strict`).
  - [ ] Preserve ordering with other linters.

- [ ] **Task 6 — Verify pr-checks.yml `lint-claims-manifest` job remains deferred** (AC: 3)
  - [ ] Confirm `if: false` + `# Activates in Epic 2 (Story 2.7)` comment is now updated to `# Activates in Story 4.3` (since 2.7 deliberately does NOT flip).
  - [ ] Comment-only change; the job remains stubbed.

- [ ] **Task 7 — Run full local pipeline** (AC: 6, 8)
  - [ ] `make lint` → 0 (with 9 warnings on stderr from lint-claims-manifest).
  - [ ] `make test` → 0 (existing 284 + new tests).
  - [ ] No scoring-irt budget changes (new code in `tools/`, `tests/unit/tools/`).

## Dev Notes

### Why warn-mode now, strict-mode in Story 4.3

Spec line 921: "warnings allowed until Story 4.3 graduates the flag; this story does NOT flip the strict flag — per Murat's duplicate-gate-trap finding, Story 4.3 is the canonical graduation point."

Two related gates:
- **Epic-1 state (now-pre-2.7):** lint-claims-manifest is "green on empty" — manifest empty, lint trivially passes.
- **Epic-2 state (post-2.7):** lint-claims-manifest is "green on populated, warn on missing methodology pages" — manifest has 9 claims, methodology pages don't exist yet (Epic 5 lands them).
- **Epic-4 state (post-Story-4.3):** lint-claims-manifest is `--strict` — methodology pages MUST exist + MUST declare matching `asserts:` frontmatter or CI fails.

The progression is deliberate: Epic 2 establishes the claims contract; Epic 4 (corpus pipeline) enforces it once content exists.

### Why methodology-path patterns reference English-only paths

Spec line 915 (from epic narrative) lists claim IDs without language qualifiers. The methodology-claims schema enforces `src/content/methodology/[a-z]{2}/.+\.md` — 2-letter ISO 639-1 language code. For Story 2.7, all 9 paths use `en/` (English first, per Epic 5's anchor-pages-first sequencing). Epic 7 will add `ru/` and `pl/` parallel paths; the lint will then verify each language has its own `asserts:` frontmatter.

### Why `engine-source` paths are concrete .js files (not directories)

Schema regex: `^src/scoring/.+\.js$`. This means each claim is tied to a specific implementation file, not a directory. Story 2.7's mapping:
- `irt-2pl-model` → `likelihood.js` (the file implementing the 2PL formula)
- `eap-estimation-method` → `eap.js` (the file implementing the posterior-weighted mean)
- `quadpts-61`, `theta-lim-pm-6`, `prior-standard-normal` → `quadrature.js` (the file implementing the grid)
- `percentile-from-standard-normal-cdf`, `iq-scale-mean-100-sd-15`, `golden-vector-parity-0.001-logits` → `index.js` (the public-facing facade)
- `se-total-rss` → `se.js` (where `combinedSE` lives)

If the implementation moves between files later, the JSON manifest must be updated alongside the move — that's the audit-trail-as-coupled-artifact pattern.

### What 2.7 explicitly does NOT do

- ❌ Modify `src/scoring/irt/*.js` files.
- ❌ Create methodology pages — Epic 5.
- ❌ Activate `pr-checks.yml` `lint-claims-manifest` job — Story 4.3 (after methodology pages exist).
- ❌ Switch lint to `--strict` mode — Story 4.3.

### Project Structure Notes

- **New files:**
  - `METHODOLOGY_CLAIMS.json` (at repo root)
  - `tools/lint-claims-manifest.mjs`
  - `tests/unit/tools/lint-claims-manifest.test.mjs`
  - `tests/unit/methodology-claims/schema.test.mjs`

- **Modified files:**
  - `Makefile` (add lint-claims-manifest invocation)
  - `.github/workflows/pr-checks.yml` (update comment from "Activates in Epic 2" to "Activates in Story 4.3"; keep `if: false`)

- **Untouched (frozen):** all `src/scoring/irt/*.js`; all prior test files; `tests/golden/*`; etc.

### References

- Epic 2 narrative §2.7 — [epics.md#L905-L926](../planning-artifacts/epics.md#L905-L926)
- Architecture D3 (claims-manifest format) — [architecture.md#L463-L493](../planning-artifacts/architecture.md#L463-L493)
- `corpus/methodology-claims-v1.schema.json` — schema contract from Epic 1.
- Story 4.3 (strict graduation) — [_bmad-output/planning-artifacts/epics.md](../planning-artifacts/epics.md)
- NFR23 (claims-as-coupled-artifact)
- FR43 (lint enforces docs/code consistency)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review
