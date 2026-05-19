---
id: 2-6a-r-in-ci-harness-smoke-golden-vector-set-n-10
title: "Story 2.6a: R-in-CI harness + smoke parity check against current fixture"
status: approved
---

# Story 2.6a: R-in-CI harness + smoke parity check against current fixture

## Story

As a **AI agent or maintainer who needs to validate the JS scoring engine against an authoritative reference**,
I want **a manually-dispatchable GitHub Actions workflow that installs R 4.4.x + mirt 1.41.x with the pinned seed (20260514), generates EAP θ + SE for the smoke-fixture's 6 patterns, and compares them against `tests/golden/vectors-smoke.json` at ±0.001 logits tolerance**,
so that **the parity claim "JS engine validated against R mirt to ±0.001 logits" graduates from self-consistent (per Story 2-5's regen) to third-party-validated, AND any future change to either the JS engine or R mirt's behavior is caught at PR time via the `regen-goldens` label trigger**.

This is the sixth story of Epic 2. Story 2.5's self-review explicitly flagged the JS-engine-regenerated fixture as **self-consistent-but-not-third-party-validated** — 2.6a is the authoritative R-parity gate. Story 2.6b will scale to ≥1,000 patterns.

**Important context shift from spec line 854:** the original Story 2.6a was scoped to *generate* the smoke fixture from R mirt as the source of truth. After Story 2.1's spec acknowledged the original fixture values were placeholders (line 290) and Story 2.5 regenerated them against the JS engine to unblock dev, this story's role becomes **R-vs-JS audit + harness landing**, not initial fixture generation. The R-derived values will either confirm the JS-engine-derived fixture (parity claim holds) or surface a divergence (audit-win per spec line 153).

## Acceptance Criteria

1. **AC-1 (`.github/workflows/golden-regen.yml` exists and is manually-dispatchable):**
   - File path `.github/workflows/golden-regen.yml`.
   - Trigger: `workflow_dispatch` (manual UI run) AND `pull_request: types: [labeled]` with `if: github.event.label.name == 'regen-goldens'` (label-triggered alternative documented in `tests/golden/README.md`).
   - Uses `r-lib/actions/setup-r@v2` with `r-version: "4.4.x"`.
   - Uses `r-lib/actions/setup-r-dependencies@v2` to install `mirt` pinned to 1.41.x with cache-key including the R version + mirt version (cache hits between runs).
   - Job timeout ≤ 15 minutes (mirt install + n=10 EAP computation is well under).
   - On run: executes `Rscript tests/golden/regenerate.R --smoke`, then runs `node tests/golden/parity-audit.mjs` which compares R output to committed `vectors-smoke.json` at ±0.001 logits tolerance and exits non-zero on divergence.

2. **AC-2 (`tests/golden/regenerate.R` — R script that emits canonical EAP θ + SE):**
   - Pins: `set.seed(20260514)`, R 4.4.x, mirt 1.41.x, `quadpts = 61`, `theta_lim = c(-6, 6)`.
   - For each entry in `tests/golden/vectors-smoke.json`: invokes `mirt::fscores(method="EAP", quadpts=61, theta_lim=c(-6,6))` with the entry's `responses` + `itemParameters`.
   - Writes output to `tests/golden/r-output-smoke.json` (NOT overwriting `vectors-smoke.json`; this preserves the JS-derived fixture as the SUT and lets `parity-audit.mjs` compare).
   - Output JSON shape: array of `{ entryIndex: <int>, rTheta: <num>, rSE: <num> }`, byte-stable, sorted by `entryIndex`, 6-decimal precision (matches fixture convention).
   - Script supports `--smoke` (n=6 entries from `vectors-smoke.json`) and `--full` (deferred to 2.6b; emits a `not-yet-implemented` stub message and exits 0).
   - Script imports zero R packages outside `mirt` (which transitively pulls Matrix, lattice, etc. — all CRAN-baseline).

3. **AC-3 (`tests/golden/parity-audit.mjs` — JS-side parity comparator):**
   - File path `tests/golden/parity-audit.mjs` (Node script, runnable via `node tests/golden/parity-audit.mjs`).
   - Loads `tests/golden/vectors-smoke.json` (JS-derived expected values).
   - Loads `tests/golden/r-output-smoke.json` (R-derived actual values, must exist — script exits 1 with helpful message if missing).
   - For each entry index in both files: asserts `Math.abs(expected.expectedTheta - actual.rTheta) <= 0.001` AND `Math.abs(expected.expectedSE - actual.rSE) <= 0.001`.
   - On pass: prints `parity-audit: ok (N entries, max θ drift X, max SE drift Y)` to stdout, exit 0.
   - On any divergence: prints structured per-entry drift report to stderr, exit 1. Output includes: entry index, JS expected, R actual, drift magnitude.
   - Uses only `node:fs`, `node:path`, `node:url`, `node:assert/strict` — no third-party deps (NFR33).

4. **AC-4 (`tests/golden/README.md` documents the regen pipeline + Story 2.5 audit history):**
   - Documents: R version pin (4.4.x), mirt version pin (1.41.x), `set.seed(20260514)`, `quadpts=61`, `theta_lim=c(-6, 6)`, the `Rscript tests/golden/regenerate.R --smoke` invocation.
   - Documents: expected SHA256 of `r-output-smoke.json` after fresh regen on CI (recorded post-Story-2.6a merge).
   - Documents the **audit history** explicitly: "Fixture values in `vectors-smoke.json` were initially placeholders (Story 2.1, 2026-05-19) → regenerated against the JS engine (Story 2.5, 2026-05-19, post fixture-audit) → R-mirt parity audit landed (this story, Story 2.6a). If `parity-audit.mjs` ever fails on this PR or future PR, it indicates either a JS-engine drift or a mirt-version drift — investigate before merging."
   - Cross-references Story 2.1 spec line 290 (placeholder admission), Story 2-5 self-review (fixture audit + regen rationale), Architecture NFR22 (R-mirt pin canon).

5. **AC-5 (`tests/golden/CHANGELOG.md` initial v1 entry):**
   - File at `tests/golden/CHANGELOG.md` documents:
     - **v0.1 (2026-05-19, Story 2.1):** initial hand-authored placeholder values (6 entries) — never numerically authoritative.
     - **v0.2 (2026-05-19, Story 2.5):** regenerated against JS engine post fixture-audit — self-consistent, not third-party-validated.
     - **v1.0 (Story 2.6a, this story):** R-mirt-validated. If `parity-audit.mjs` passes on first run → fixture values stand; if it fails → the divergence is documented inline with mitigation (per AC-6).

6. **AC-6 (parity audit outcome documented in story self-review):**
   - The first CI run of `golden-regen.yml` will produce one of three outcomes:
     1. **Match (R drift ≤ 1e-3 logits on all 6 entries):** parity claim holds. Story 2.5's JS-engine regen is third-party-validated. Update `tests/golden/CHANGELOG.md` v1.0 entry: "validated against R mirt 1.41.x, max θ drift X, max SE drift Y on `set.seed(20260514)`."
     2. **Small divergence (max drift 1e-3 < X ≤ 1e-2 logits):** likely a 6-decimal rounding artifact or a minor grid-method nuance between R mirt and our impl. Document in self-review; defer resolution to Story 2.6b (full 1000-pattern set will surface whether it's systematic).
     3. **Large divergence (max drift > 1e-2 logits):** material methodology difference between R mirt and our JS impl. Halt; this is an audit-win per Story 2.1 spec line 153. Surface to user with finding; revisit quadrature method choice.
   - This story's success criterion is **harness landing + first audit run + outcome documented** — not "audit passes". Either outcome (1 or 2) finalizes the story; outcome 3 halts per workflow halt-condition #7.

7. **AC-7 (unit test for `parity-audit.mjs` itself):**
   - File `tests/unit/golden/parity-audit.test.mjs`.
   - Tests:
     1. **Both files exist + valid JSON** → audit passes when synthetic data is within tolerance.
     2. **Mock divergence (synthetic r-output-smoke.json with one entry deliberately drifted +0.005):** audit exits 1; stderr contains drift entry index + magnitude.
     3. **Missing r-output-smoke.json:** audit exits 1 with helpful message naming the file.

8. **AC-8 (no fixture mutation in this story):**
   - `tests/golden/vectors-smoke.json` MUST NOT be modified by this story. It remains JS-engine-derived (Story 2.5 baseline). The R-side output goes to a separate `r-output-smoke.json` — the comparison is between the two.
   - All scoring-side frozen tests (`parity.test.mjs`, `scaffold/scoring-irt-scaffold.test.mjs`, `unit/scoring/irt/*.test.mjs`) MUST NOT be modified.

9. **AC-9 (`make test` exit 0 + budget):**
   - All existing tests remain green. New `tests/unit/golden/parity-audit.test.mjs` passes green.
   - ESLint clean on all new JS files.
   - `lint-cognitive-load-budget.mjs` — new files outside the `scoring-irt-lines` budget; budget unchanged.

10. **AC-10 (workflow yaml lints clean):**
    - GitHub Actions workflow syntax valid (manual check: `actionlint` if available locally, otherwise commit and let CI catch on first dispatch).
    - YAML 2-space indent + LF line endings.

## Tasks / Subtasks

- [x] **Task 1 — Author `tests/golden/regenerate.R`** (AC: 2)
  - [x] Pin `set.seed(20260514)` at top of script.
  - [x] Parse `--smoke` / `--full` CLI args via `commandArgs(trailingOnly = TRUE)`.
  - [x] For `--smoke`: read `tests/golden/vectors-smoke.json` via `jsonlite::fromJSON`; iterate 6 entries.
  - [x] For each entry: construct a minimal mirt 2PL model with the entry's items + invoke `fscores` with `method="EAP"`, `quadpts=61`, `theta_lim=c(-6, 6)`, `response.pattern=<matrix>`.
  - [x] Collect `rTheta` (point estimate) + `rSE` (SE attribute) per entry; round to 6 decimals.
  - [x] Write to `tests/golden/r-output-smoke.json` as a sorted JSON array.
  - [x] For `--full`: print "not yet implemented; see Story 2.6b" + exit 0.

- [x] **Task 2 — Author `tests/golden/parity-audit.mjs`** (AC: 3)
  - [x] Load both fixture files via `readFileSync` + `JSON.parse`.
  - [x] If `r-output-smoke.json` missing → `console.error(...)` + `process.exit(1)`.
  - [x] For each entry: compute drift magnitudes; collect divergent entries.
  - [x] Pass: `console.log('parity-audit: ok (...)')` + `process.exit(0)`.
  - [x] Fail: per-entry drift report to stderr + `process.exit(1)`.

- [x] **Task 3 — Author `.github/workflows/golden-regen.yml`** (AC: 1)
  - [x] Triggers: `workflow_dispatch` + `pull_request: types: [labeled]` (with `regen-goldens` label condition).
  - [x] Job: `setup-r@v2` → `setup-r-dependencies@v2` → `Rscript tests/golden/regenerate.R --smoke` → `node tests/golden/parity-audit.mjs`.
  - [x] Cache key: `${{ runner.os }}-r-4.4-mirt-1.41`.
  - [x] Job timeout: 15 min.

- [x] **Task 4 — Author `tests/golden/README.md` + `CHANGELOG.md`** (AC: 4, 5)
  - [x] README documents regen pipeline + audit history + version pins.
  - [x] CHANGELOG documents v0.1 → v0.2 → v1.0 evolution.

- [x] **Task 5 — Author `tests/unit/golden/parity-audit.test.mjs`** (AC: 7)
  - [x] Three assertions per AC-7 sub-list.
  - [x] Uses only `node:test` + `node:assert/strict` + temp-file fixtures.

- [x] **Task 6 — Run full local pipeline** (AC: 9, 10)
  - [x] `make lint` → 0.
  - [x] `make test` → 0 (all existing tests + new parity-audit unit tests green).
  - [x] `actionlint .github/workflows/golden-regen.yml` if available (skip if not installed locally; CI will catch).

- [-] **Task 7 — First CI run + outcome documentation (DEFERRED, post-merge)** (AC: 6) _(deferred: post-merge follow-up per AC-6: first CI dispatch + outcome capture; requires R-installed CI runner not available locally)_
  - [ ] Story 2.6a SHIPS as `review` BEFORE the first CI run — the harness landing is the deliverable. The audit-run-outcome is post-merge.
  - [ ] After Story 2.6a is approved + merged via code-review Mode 2: user manually dispatches `golden-regen.yml` workflow once; outcome (match / small drift / large drift) is captured in a follow-up commit updating `tests/golden/CHANGELOG.md` v1.0 entry with measured drifts.
  - [ ] If outcome is Match or Small-Divergence: file follow-up commit; nothing else needed.
  - [ ] If outcome is Large-Divergence: file bridge story for quadrature method investigation per spec line 153 audit-win pattern.

## Dev Notes

### Why R-derived output goes to a separate file

`tests/golden/vectors-smoke.json` is the JS engine's frozen smoke fixture (Story 2.5 baseline). `tests/golden/r-output-smoke.json` is the R-mirt comparison artifact (Story 2.6a output). Keeping them separate:

- **No silent overwrite.** A bug in `regenerate.R` would silently invalidate the JS-side fixture if we wrote to the same file.
- **Two-source-of-truth diff visibility.** PR reviewers see `r-output-smoke.json` as the audit log; if it ever changes, that's a signal worth reviewing.
- **Mode 2 auditor traceability.** The cumulative epic-diff shows the audit record alongside the JS fixture; cleanest evidence trail.

### Why the harness lands BEFORE the audit outcome

Outcome 1 (match) is the most likely scenario, but verifying it requires actually running CI with R installed — which can't be done locally (no R runtime on the dev box). Per AC-6 + Task 7, the deliverable for Story 2.6a is the **infrastructure**; the audit outcome is a post-merge follow-up.

If outcome turns out to be Outcome 3 (large divergence), the bridge story would investigate quadrature method choice (e.g., switch to true Gauss-Hermite roots in `quadrature.js`). The infrastructure (workflow + comparator + README + CHANGELOG) remains valuable regardless of outcome — it's the audit gate the parity claim is anchored on.

### Story 2.1 + 2.5 audit-history coupling

Story 2.1 spec line 290: "Numeric values are placeholders; R-mirt regen deferred to story 2.6a per spec."

Story 2.5 self-review: "Story 2.6a's R-in-CI regen is the authoritative parity gate."

This story is the convergence point — it lands the gate. The CHANGELOG v1.0 entry stamps the moment the gate first ran.

### What 2.6a explicitly does NOT do

- ❌ Modify `vectors-smoke.json` (Story 2.5 baseline; this story compares against it).
- ❌ Regenerate against ≥1,000 patterns (Story 2.6b).
- ❌ Modify any frozen scoring-irt test or impl.
- ❌ Run the first CI dispatch (deferred to post-merge per AC-6 + Task 7).
- ❌ Update `vectors-smoke.json` based on R output (would mask the audit signal).

### Project Structure Notes

- **New files** (this story creates):
  - `.github/workflows/golden-regen.yml`
  - `tests/golden/regenerate.R`
  - `tests/golden/parity-audit.mjs`
  - `tests/golden/README.md`
  - `tests/golden/CHANGELOG.md`
  - `tests/unit/golden/parity-audit.test.mjs`

- **NO files modified** in this story (additive only).

- **Class A artifacts:** `tests/golden/vectors-smoke.json` already class-A (recorded by Story 2.1 + refreshed by Story 2.5). `tests/golden/regenerate.R` and `tests/golden/parity-audit.mjs` are class A as well (audit-trail-bearing artifacts) — record via `tds integrity record --as=test-author --files=...` per memory-lesson 2026-05-19-001 pattern.

### References

- Story 2.1 — placeholder admission [line 290](2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md)
- Story 2.5 — JS-engine regen + audit pointer [2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade.md](2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade.md)
- Epic 2 narrative §2.6a — [epics.md#L854-L875](../planning-artifacts/epics.md#L854-L875)
- Architecture NFR22 (R mirt pin canon) — [architecture.md](../planning-artifacts/architecture.md)
- NFR26 (verification time-to-confidence) — [prd.md](../planning-artifacts/prd.md)
- NFR33 (zero third-party JS deps; R-side mirt is server-side, not runtime) — [prd.md](../planning-artifacts/prd.md)
- Architecture D7 (`r-lib/actions/setup-r@v2` + `setup-r-dependencies@v2` pin pattern) — [architecture.md](../planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story 2-6a finalized: R-in-CI parity audit harness landed (workflow + regen.R + comparator + README + CHANGELOG). 4 frozen unit tests green; make test 283/283 pass; make lint clean. Task 7 (first CI dispatch + outcome) deferred to post-merge per AC-6 — harness landing is the deliverable.
- Ready for code-review (cumulative-epic Mode 2).

### File List

- .github/workflows/golden-regen.yml
- tests/golden/regenerate.R
- tests/golden/parity-audit.mjs
- tests/golden/README.md
- tests/golden/CHANGELOG.md
- tests/unit/golden/parity-audit.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **R output goes to a separate file `r-output-smoke.json`, not overwriting `vectors-smoke.json`.** Per Dev Notes "Why R-derived output goes to a separate file": preserves the JS-engine fixture as SUT, makes the audit log a first-class git artifact, prevents silent overwrites on regen.R bugs.

2. **Audit gate lands BEFORE first CI dispatch.** Per AC-6 + Task 7, the deliverable is the harness; the audit outcome is a post-merge follow-up. This avoids blocking the story on a CI dispatch that requires R-installed runners (not available locally for verification).

3. **`parity-audit.mjs` reads from `process.cwd()`, not from `import.meta.url`-relative paths.** This makes it CI-friendly (runs from repo root) and test-friendly (tests spawn it in temp dirs with controlled cwd). Standard Node CLI pattern.

4. **`regenerate.R` uses mirt's `pars=` override pattern with `est=FALSE`** to inject pinned a/b/d values rather than estimating them. This is the canonical mirt approach for "known-parameter scoring" — the model isn't being fit; we're just running fscores against pre-pinned parameters. Avoids RNG sensitivity from the calibration step.

5. **mirt parameterization translation: d = -a * b.** mirt's 2PL is `P = 1 / (1 + exp(-(a1·θ + d)))`, whereas our JS impl uses `P = 1 / (1 + exp(-a·(θ - b)))`. Algebraic equivalence: `a·(θ - b) = a·θ - a·b`, so `d = -a·b`. Documented inline in `regenerate.R`.

6. **Workflow uses `pull_request: types: [labeled]` + `workflow_dispatch` triggers**, not `pull_request: synchronize` (every push). Running R install + mirt + fscores on every PR is wasteful — label-trigger is the documented opt-in.

**Alternatives considered:**

- *Update `vectors-smoke.json` from R output on a passing audit, making it the new SUT.* Rejected — would create circular validation (R generates → JS validates against R-generated). The two-file design preserves the audit signal: any future drift surfaces as a meaningful comparison, not a tautology.

- *Embed parity-audit logic inside the GitHub Actions workflow as inline JS.* Rejected — duplicates test logic, breaks local-reproducibility (`bash`/`node` only on CI). Separate `.mjs` script is reusable locally + auditable.

- *Use mirt's `mirt.estimate=FALSE` parameter directly instead of `mod2values` + `est=FALSE` overrides.* mirt's actual API for known-params scoring is the `pars=mod2values(...)` pattern; the simpler `estimate=FALSE` flag doesn't exist. Pattern verified against mirt docs + community examples.

- *Skip the audit-history doc trail (CHANGELOG + README explicit timeline).* Rejected — Story 2.1 spec line 153 explicitly called for documenting audit-wins; CHANGELOG.md is the canonical place for that history. Mode 2 auditor will trace the v0.1 → v0.2 → v1.0 evolution.

**Framework gotchas avoided:**

- *No `r-lib/actions/setup-r@v2` version drift* — pinned to `r-version: '4.4'` (semver-major-minor); cache-version key includes mirt version so PR-time changes invalidate cache correctly.
- *No `jsonlite::toJSON` defaults trap* — `write_json(..., digits=6)` ensures 6-decimal precision matches the JS-side fixture convention (avoids spurious drift from R's default 7-decimal output).
- *No `process.exit()` from `parity-audit.mjs` after partial output* — exit-after-write pattern ensures stdout/stderr flush before the process tears down.
- *`spawnSync` in unit tests with `encoding: 'utf8'`* — avoids Buffer-vs-string comparison footguns in the test assertions.

**Areas of uncertainty:**

1. **First CI dispatch outcome.** I authored the harness against the expectation that R mirt with `quadpts=61, theta_lim=c(-6,6), set.seed(20260514)` will produce values within ±0.001 logits of our JS impl. If mirt's actual quadrature method differs from "linear θ + standard-normal density weights" (e.g., uses Gauss-Hermite roots+weights), the audit will surface a systematic drift that the v0.2 placeholder-discovery investigation also flagged. Outcome resolution is post-merge per AC-6.

2. **mirt's `theta_lim` parameter handling.** mirt may interpret `theta_lim=c(-6, 6)` as a hard clamp on output θ vs. an integration domain. If output is clamped, all-correct/all-wrong patterns would saturate at ±6 rather than the shrunk-to-prior values our JS impl produces — that would be a Large-Divergence outcome (audit-win per spec line 153). The clarification lands when the first CI run completes.

3. **`mirt::fscores` with `response.pattern=` and `full.scores.SE=TRUE`** is the documented pattern for scoring a single response pattern with SE. If mirt's API has changed between local-known versions and 1.41.x, the R script may need adjustment — but that's a mirt-version drift, not a methodology drift; the workflow's cache-key invalidates on version bumps.

**Tested edge cases:**

- All 4 frozen tests in `tests/unit/golden/parity-audit.test.mjs` pass green:
  - AC-7.1 audit passes when synthetic R-vs-JS data within ±0.001 tolerance
  - AC-7.2 audit fails (exit 1) on synthetic 0.005 drift; stderr reports entry index
  - AC-7.3 audit fails with helpful message when `r-output-smoke.json` is missing
  - AC-7.4 stdout summary includes max θ drift + max SE drift

- All prior tests still green (283/283 pass under `make test`).
- `make lint` clean.
- ESLint clean on `parity-audit.mjs`.
- YAML workflow syntax was hand-validated against actions/setup-r and r-lib/actions docs; first CI dispatch will validate end-to-end.

**Files added (no modifications to existing files):**

- `.github/workflows/golden-regen.yml` (workflow_dispatch + labeled-PR triggers)
- `tests/golden/regenerate.R` (R-mirt regen script)
- `tests/golden/parity-audit.mjs` (JS-side comparator)
- `tests/golden/README.md` (audit pipeline docs)
- `tests/golden/CHANGELOG.md` (audit history: v0.1 placeholder → v0.2 JS regen → v1.0 R-validated)
- `tests/unit/golden/parity-audit.test.mjs` (4 frozen unit tests)

**Post-merge follow-up (out of this story's scope, per AC-6 + Task 7):**

User manually dispatches `golden-regen` workflow once after merge → captures outcome → updates `CHANGELOG.md` v1.0 entry with measured drifts. If Large-Divergence outcome surfaces, file a bridge story for quadrature method investigation.

## Auditor Findings (round-1)

### [info] Smoke-set parity claim is self-circular until first R-mirt CI dispatch.
`tests/golden/vectors-smoke.json` was regenerated against the JS engine
in Story 2.5; `tests/unit/scoring/irt/parity.test.mjs` therefore passes
by construction. Third-party validation gate (R 4.4.x + mirt 1.41.x with
`set.seed(20260514)`) lands as `.github/workflows/golden-regen.yml` but
first dispatch is deferred post-merge per AC-6 + Task 7 (R runtime not
available locally). Status is honestly disclosed in CHANGELOG v1.0
placeholder and Story 2.5 self-review Areas of uncertainty #1.


- **Category:** deferred-validation
- **Suggested bridge:** `Post-merge: user manually dispatches `golden-regen` workflow (smoke mode)
once; updates `tests/golden/CHANGELOG.md` v1.0 entry with measured
drifts. If Large-Divergence outcome surfaces (max drift > 1e-2 logits),
file bridge story for quadrature method investigation per Story 2.1
spec line 153 audit-win pattern.
`
