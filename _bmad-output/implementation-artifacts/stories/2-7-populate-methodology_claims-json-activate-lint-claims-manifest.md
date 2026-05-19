---
id: 2-7-populate-methodology_claims-json-activate-lint-claims-manifest
title: "Story 2.7: Populate METHODOLOGY_CLAIMS.json + activate lint-claims-manifest"
status: review
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

- [x] **Task 1 — Author `METHODOLOGY_CLAIMS.json`** (AC: 1)
  - [x] Create `METHODOLOGY_CLAIMS.json` at repo root with the 9 claims listed in AC-1.
  - [x] `version: "1.0.0"`, JSON-valid, 2-space indent, trailing newline.
  - [x] Each claim has all 4 required fields per schema; methodology-path conforms to the `src/content/methodology/[a-z]{2}/.+\.md` pattern.

- [x] **Task 2 — Author `tools/lint-claims-manifest.mjs`** (AC: 2, 3)
  - [x] Pure Node.js, no third-party deps (NFR33).
  - [x] CLI args: `--strict` (default off) + `--manifest=<path>` (default `METHODOLOGY_CLAIMS.json`).
  - [x] Load + schema-validate the manifest (basic structure check).
  - [x] For each claim: existsSync on engine-source → ERROR if missing (always exits 1, regardless of mode; missing engine source is a hard failure).
  - [x] For each claim: existsSync on methodology-path → in warn-mode emit warn to stderr, continue; in strict-mode emit error to stderr, set exit code 1.
  - [x] For each claim with present methodology page: read frontmatter `asserts:` field; verify it contains the claim-id; warn/error per mode.
  - [x] Final exit 0 in warn-mode (unless engine-source missing); strict-mode exits 1 if any methodology-path / asserts-missing issues.

- [x] **Task 3 — Author `tests/unit/tools/lint-claims-manifest.test.mjs`** (AC: 4)
  - [x] 4 AC-4 sub-tests as spawnSync-based shell-out tests.
  - [x] Use temp dirs for mock methodology pages.

- [x] **Task 4 — Author `tests/unit/methodology-claims/schema.test.mjs`** (AC: 5)
  - [x] Load + parse `METHODOLOGY_CLAIMS.json`.
  - [x] Manual schema validation against pattern from `corpus/methodology-claims-v1.schema.json`.
  - [x] Verify all 9 claims exist with required fields + correct patterns.

- [x] **Task 5 — Add lint-claims-manifest to Makefile lint target** (AC: 7)
  - [x] Add `node tools/lint-claims-manifest.mjs` line to `lint` target (warn-mode, no `--strict`).
  - [x] Preserve ordering with other linters.

- [x] **Task 6 — Verify pr-checks.yml `lint-claims-manifest` job remains deferred** (AC: 3)
  - [x] Confirm `if: false` + `# Activates in Epic 2 (Story 2.7)` comment is now updated to `# Activates in Story 4.3` (since 2.7 deliberately does NOT flip).
  - [x] Comment-only change; the job remains stubbed.

- [x] **Task 7 — Run full local pipeline** (AC: 6, 8)
  - [x] `make lint` → 0 (with 9 warnings on stderr from lint-claims-manifest).
  - [x] `make test` → 0 (existing 284 + new tests).
  - [x] No scoring-irt budget changes (new code in `tools/`, `tests/unit/tools/`).

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

- Story 2-7 finalized: METHODOLOGY_CLAIMS.json with 9 engine claims + lint-claims-manifest.mjs warn-mode + 13 unit tests. make test 297/297 pass. Strict-mode graduation deferred to Story 4.3 per spec. claim-id 'golden-vector-parity-0001-logits' (transformed from 0.001 form to honor schema regex).
- Ready for code-review (cumulative-epic Mode 2). Closes Epic 2.

### File List

- METHODOLOGY_CLAIMS.json
- tools/lint-claims-manifest.mjs
- tests/unit/methodology-claims/schema.test.mjs
- tests/unit/tools/lint-claims-manifest.test.mjs
- Makefile
- .github/workflows/pr-checks.yml

## Specialist Self-Review

**Decisions made:**

1. **claim-id `golden-vector-parity-0001-logits`, not `0.001-logits`.** Schema regex `^[a-z][a-z0-9-]*$` doesn't allow dots. The original epic-narrative line 915 had `golden-vector-parity-0.001-logits` which would fail schema validation. Transformed to `0001-logits` to honor the frozen schema contract (Story 1.4 deliverable). Epic 5's eventual `golden-vectors.md` methodology page will assert this same form.

2. **Warn-mode lint by default.** Per spec line 921 + 924–926, Story 2.7 explicitly does NOT flip to `--strict`. The lint accepts `--strict` flag but defaults to warn. Makefile invocation uses warn-mode. pr-checks.yml `lint-claims-manifest` job remains `if: false` with the comment updated from "Epic 2" to "Story 4.3 (--strict mode after methodology pages land in Epic 5)."

3. **Methodology-path patterns reference English-only paths.** All 9 claims use `src/content/methodology/en/<topic>/<page>.md`. Epic 7 will extend to ru/pl with the lint enforcing per-language `asserts:` frontmatter when those pages exist.

4. **Engine-source missing is ALWAYS a hard ERROR.** Per spec AC-2: if a claim references `src/scoring/irt/foo.js` and that file doesn't exist, the lint exits 1 regardless of mode. This guards against renames that orphan the manifest.

5. **YAML frontmatter parser is regex-based (not a YAML lib).** Pure JS per NFR33. The asserts-detection regex matches inline-array form `asserts: [a, b]` and continues until next top-level key. Good enough for the simple format methodology pages will use; can be replaced with a proper YAML parser in a follow-up if needed.

6. **`combinedSE` mapped to `se-total-rss` claim.** D3 names the engine-side function `combinedSE` (FR15 RSS combiner). The methodology page will document `SE_total = √(SEM² + SE_norming²)` under the claim-id `se-total-rss`. The naming asymmetry (function `combinedSE` vs claim `se-total-rss`) is intentional — the claim names the math relationship, not the JS function.

**Alternatives considered:**

- *Add `lint-claims-manifest` to pr-checks.yml in warn-mode now, flip to strict in Story 4.3.* Rejected per spec line 924-926 (Murat's duplicate-gate-trap finding): two activation points → confusion about which is canonical. Story 4.3 is the single activation event; Story 2.7 just lands the tool.

- *Use AJV or a third-party JSON-schema validator.* Rejected for NFR33 (zero runtime deps). Manual regex validation against the schema patterns is sufficient — 4 simple patterns + required-field check. Less than 50 lines of validation logic.

- *Keep `claim-id: golden-vector-parity-0.001-logits` and update the schema to allow dots.* Rejected — schema is frozen (Story 1.4 deliverable, class-A). Modifying it now would invalidate the integrity-record audit trail and trigger a cascade of test updates. Cleaner to honor the constraint and adapt the claim-id.

- *Include methodology-page asserts checking only when pages exist (skip silently if missing).* The implementation does this: missing pages emit WARN; pages without asserts emit WARN. This separates "page not yet created" (Epic 5 pending) from "page exists but methodology contract violated" (will be a real CI failure in Story 4.3 strict mode).

**Framework gotchas avoided:**

- *YAML frontmatter regex must not be greedy across multiple `---` boundaries.* Used non-greedy `\n([\s\S]*?)\n---\n` to match only the first frontmatter block.
- *spawnSync(node, args)* in unit tests with `encoding: 'utf8'` and explicit `cwd` parameter — controlled temp-dir invocation prevents cross-test pollution.
- *`existsSync` synchronous* — fine for one-shot CLI tool; not in a hot loop.
- *Exit-code semantics in CLI tool* — hard fail (exit 1) separate from soft warn (exit 0) via two boolean flags; final exit decision after all claims processed.

**Areas of uncertainty:**

1. **Schema's methodology-path regex may need a 3rd-letter variant for some future locale.** Pattern `[a-z]{2}` doesn't allow `zh-CN`-style locale tags. Spec uses 2-letter ISO 639-1, which is sufficient for `en`/`ru`/`pl` (Epic 7). If future expansion needs sub-locales, the schema (and methodology directory structure) would need an explicit update.

2. **Some claims map to the same methodology-path** (`eap.md` has 4 claims: `eap-estimation-method`, `quadpts-61`, `theta-lim-pm-6`, `prior-standard-normal`; `percentile-to-iq.md` has 2). The lint's per-claim check will run multiple iterations over the same file when it exists, each verifying the frontmatter contains the specific claim-id. Correct behavior, slightly redundant reads. Acceptable for n=9 claims; could be optimized to per-page reading if scale grows.

3. **`combinedSE` engine-source is `se.js`** — but `index.js` also re-exports it. The claim ties to where the function is DEFINED, not where it's PUBLICLY EXPORTED. This is a judgment call; auditor may want to revisit if the convention should be "exported-from" vs "defined-in".

**Tested edge cases:**

- 8 schema validation tests in `tests/unit/methodology-claims/schema.test.mjs` all pass green:
  - Manifest exists at repo root
  - Valid JSON
  - Top-level shape (version + claims[])
  - Version is "1.0.0"
  - At least 9 claims
  - Every claim has required fields with correct patterns
  - All 9 required claim IDs present
  - Every engine-source file exists on disk

- 5 lint-claims-manifest tests in `tests/unit/tools/lint-claims-manifest.test.mjs` all pass green:
  - warn-mode exits 0 against real manifest (9 warnings, exit 0)
  - --strict exits 1 when methodology pages missing
  - Claim with matching methodology page emits no warning
  - Broken JSON exits 1
  - Missing manifest exits 1

- `make test`: 297/297 pass (+13 from 284 baseline).
- `make lint`: clean, with 9 warnings from lint-claims-manifest (warnings ≠ errors).
- ESLint clean.

**Frozen-test ratification trail:**

- `tests/unit/methodology-claims/schema.test.mjs` unfrozen + edited + re-recorded: updated `REQUIRED_CLAIM_IDS` to use `golden-vector-parity-0001-logits` (schema-compliant) instead of `0.001-logits` (epic-narrative). Documented in unfreeze reason + closed via `tds integrity record`.

**Files added/modified:**

New:
- `METHODOLOGY_CLAIMS.json` (at repo root, 9 engine claims)
- `tools/lint-claims-manifest.mjs` (warn-mode by default; `--strict` flag for Story 4.3)
- `tests/unit/methodology-claims/schema.test.mjs` (8 schema validation tests)
- `tests/unit/tools/lint-claims-manifest.test.mjs` (5 lint behavior tests)

Modified:
- `Makefile` (lint target runs lint-claims-manifest in warn-mode)
- `.github/workflows/pr-checks.yml` (comment updated: `lint-claims-manifest` activates in Story 4.3, not Epic 2)

**Story 2.7 closes out Epic 2.** All 9 stories (2-1 through 2-7) are in `status=review`, squashed into `epic/2`. Ready for `/bmad-tds-code-review --epic=epic-2` Mode 2 final approve + `tds deliver` squash to main.

## Auditor Findings (round-1)

### [info] `claim-id` for the golden-vector parity claim is
`golden-vector-parity-0001-logits` (digit-string) rather than the
epic-narrative form `golden-vector-parity-0.001-logits` (decimal-dot).
Schema regex `^[a-z][a-z0-9-]*$` (frozen Story 1.4 deliverable) forbids
dots; transformation honors schema integrity over narrative literalism.
Decision documented in Story 2-7 self-review #1. Epic 5's eventual
methodology page `golden-vectors.md` will assert the digit-string form.


- **Category:** claim-id-deviation
- **Suggested bridge:** `None — this is a settled naming decision. Future epics asserting this
claim in their methodology pages' `asserts:` frontmatter must use the
digit-string form. Lint-claims-manifest in strict mode (Story 4.3) will
enforce this consistency.
`
