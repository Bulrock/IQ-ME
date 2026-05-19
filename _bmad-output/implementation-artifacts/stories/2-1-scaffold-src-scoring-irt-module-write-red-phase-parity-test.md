---
id: 2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test
title: "Story 2.1: Scaffold src/scoring/irt/ module + write red-phase parity test"
status: ready-for-dev
---

# Story 2.1: Scaffold src/scoring/irt/ module + write red-phase parity test

## Story

As a **TDD-disciplined solo-dev**,
I want **the scoring module's directory structure and a failing red-phase parity test to exist before any implementation lands**,
so that **every subsequent scoring story (2.2–2.5) is implemented green-against-test rather than retrofitted with tests after the fact (per Amelia's red-green-refactor discipline)**.

This is the first story of Epic 2 (Auditable Scoring Engine + Golden Vectors). It produces the empty skeleton of `src/scoring/irt/` and a parity test that fails *with a `TypeError: Not implemented`* — making "red phase" mechanically verifiable. Stories 2.2–2.5 turn it green; Stories 2.6a/2.6b replace the hand-verified fixture with a full R-mirt-generated golden set.

## Acceptance Criteria

1. **AC-1 (`src/scoring/irt/` stub modules exist):** the directory contains five JS files at exactly these paths:
   - `src/scoring/irt/quadrature.js`
   - `src/scoring/irt/likelihood.js`
   - `src/scoring/irt/eap.js`
   - `src/scoring/irt/se.js`
   - `src/scoring/irt/index.js`

   Each non-`index.js` file exports **one named function** (no default exports — see Dev Notes for the canonical names) whose body is exactly:
   ```js
   throw new TypeError("Not implemented");
   ```
   No `NaN` returns, no error objects (per architecture's scoring-failure contract — Architecture §Process Patterns "Scoring failure contract"). `.gitkeep` in `src/scoring/irt/` is removed.

2. **AC-2 (`src/scoring/irt/index.js` public surface):** uses **named re-exports only** matching architecture D3 §Frontend Architecture. It re-exports the four stub functions from sibling modules **and** declares `scoreSession` as a named export whose body also throws `TypeError("Not implemented")` (the SPA-facing facade — its full shape lands in Story 2.5). No default export. `index.js` imports are top-of-file, sorted per `tools/lint-import-order.mjs` conventions (stdlib first, then sibling `./`).

3. **AC-3 (`tests/golden/vectors-smoke.json` hand-authored fixture committed):** a fixture file at `tests/golden/vectors-smoke.json` is committed with **5–10 hand-verified response patterns**, each entry:
   ```json
   {
     "responses": [/* binary array */],
     "itemParameters": [{ "a": <num>, "b": <num> }, ...],
     "expectedTheta": <num>,
     "expectedSE": <num>
   }
   ```
   - Field names are **camelCase** per architecture §JSON Field Naming Convention.
   - Patterns MUST be hand-computable (e.g. degenerate all-correct, all-wrong, mid-symmetric) — values verified by paper-arithmetic or `R --vanilla` one-liner pasted in `## Dev Agent Record → Completion Notes`.
   - File is valid JSON; trailing newline; 2-space indent (matches Prettier defaults).
   - **This fixture is intentionally provisional.** Story 2.6a regenerates it from R + mirt 1.41.x. The Story 2.6a regen MUST produce an entry-set that is a **superset** of the hand-verified patterns (or document the divergence). Story 2.1's job is to give 2.2–2.5 a real assertion target; Story 2.6a takes the byte-stable contract.

4. **AC-4 (`tests/unit/scoring/irt/parity.test.mjs` exists as the red-phase test):**
   - File path is **exactly** `tests/unit/scoring/irt/parity.test.mjs` (mirror-tree rule from architecture §Structure Patterns: `src/scoring/irt/<file>.js → tests/unit/scoring/irt/<file>.test.mjs`; this is the cross-module parity test, hence `parity.test.mjs` at that level).
   - Imports are **only** `node:test` + `node:assert/strict` + sibling-relative `../../../src/scoring/irt/index.js` + `node:fs` (for fixture read) + `node:path` + `node:url` (for `import.meta.url`). **No third-party test framework** (NFR33).
   - Loads `tests/golden/vectors-smoke.json` via `readFileSync` + `JSON.parse`.
   - For each fixture entry: calls `scoreSession({ responses, itemParameters, normingStats: <stub-zero-norming> })` (architecture D3 shape — object argument, NOT the epic spec's positional `(responses, items, options)` form; see Dev Notes "Naming reconciliation").
   - Asserts `Math.abs(result.theta - expectedTheta) <= 0.001` AND `Math.abs(result.sem - expectedSE) <= 0.001` for each entry.
   - **Mandatory: `make test` exits non-zero** with a stack trace containing the literal string `TypeError: Not implemented` and a path frame pointing at one of the stub files. The test does NOT swallow the throw with `assert.throws` — the throw is *the failure*.

5. **AC-5 (`tests/unit/` is included in the `make test` target):** `Makefile`'s `test` target is updated to include `tests/unit/**/*.test.mjs` in its discovery glob. Current target (Story 1.10) scans `tests/scaffold/` + `tests/contract/`; this story extends it to scan `tests/unit/` as a third subtree. Example acceptable form:
   ```makefile
   test: ## run node --test against scaffold + contract + unit (Playwright excluded)
       node --test 'tests/scaffold/**/*.test.mjs' 'tests/contract/**/*.spec.mjs' 'tests/unit/**/*.test.mjs'
   ```

6. **AC-6 (red-phase runs in <1s on a dev laptop):** `make test` completes in under 1 second wall-clock on a developer laptop while failing on the parity test (NFR26 — verification time-to-confidence). Subsequent dev work in 2.2–2.5 will keep total <5s as the test iterates over the smoke set.

7. **AC-7 (acceptance test pins the scaffold):** `tests/scaffold/scoring-irt-scaffold.test.mjs` exists and asserts:
   - All five `src/scoring/irt/*.js` files exist.
   - Each stub file exports the documented function name (regex grep of `export function <name>` or `export { <name> }`).
   - `tests/golden/vectors-smoke.json` exists, is valid JSON, contains 5–10 entries, every entry has the four required camelCase fields with correct types.
   - `tests/unit/scoring/irt/parity.test.mjs` exists; its body imports `node:test` + `node:assert/strict` + the irt `index.js`; does NOT import any third-party module (regex grep — no imports outside `node:`, `../`, `./`).
   - `Makefile`'s `test` target string includes the literal `tests/unit/`.

   **Crucial: this scaffold test must pass green** (it tests the structure, not the math). The parity test is the only red-phase test in this story.

8. **AC-8 (`make lint` exits 0):** the stubs are ESLint-clean under the flat config. `no-unused-vars` is satisfied (function parameters are prefixed `_` if unread, OR the throw-before-use makes them "used"). No `no-restricted-imports` violations: `src/scoring/**` may not import from `assessment/`, `content/`, `tools/`, `tests/` (per `eslint.config.mjs` Domain B rules).

9. **AC-9 (cognitive-load budget honored):** `node tools/lint-cognitive-load-budget.mjs` exits 0. The budget for `src/scoring/irt/**/*.js` is 250 lines total (`BUDGETS.json` → `scoring-irt-lines`). Stubs MUST consume <50 lines total to leave headroom for Stories 2.2–2.5 implementations.

## Tasks / Subtasks

- [ ] **Task 1 — Author stub files in `src/scoring/irt/`** (AC: 1, 2, 8, 9)
  - [ ] Remove `src/scoring/irt/.gitkeep`.
  - [ ] Create `quadrature.js` with `export function quadraturePoints({ quadpts, theta_lim }) { throw new TypeError("Not implemented"); }` — name from architecture D3.
  - [ ] Create `likelihood.js` with `export function logLikelihood(theta, items, responses) { throw new TypeError("Not implemented"); }` — name from architecture D3.
  - [ ] Create `eap.js` with `export function eapEstimate(responses, itemParameters, quad) { throw new TypeError("Not implemented"); }`.
  - [ ] Create `se.js` with `export function standardError(theta, responses, itemParameters) { throw new TypeError("Not implemented"); }`.
  - [ ] Create `index.js` that re-exports `quadraturePoints`, `logLikelihood`, `eapEstimate`, `standardError` from siblings AND declares `export function scoreSession({ responses, itemParameters, normingStats }) { throw new TypeError("Not implemented"); }`.

- [ ] **Task 2 — Hand-author `tests/golden/vectors-smoke.json`** (AC: 3)
  - [ ] Remove `tests/golden/.gitkeep`.
  - [ ] Pick 5–10 patterns. Recommended seed set: all-correct (expect θ ≈ +ceiling), all-wrong (expect θ ≈ -floor), single-correct (expect θ ≈ b - small), single-wrong (expect θ ≈ b + small), perfectly-symmetric mid-pattern (expect θ ≈ 0).
  - [ ] Verify each `expectedTheta` / `expectedSE` either via paper arithmetic OR by pasting a one-shot `Rscript -e 'library(mirt); ...'` invocation into `## Dev Agent Record → Completion Notes`. Note: full R-in-CI infrastructure is **deferred to Story 2.6a** — for 2.1 a local `Rscript` invocation or notebook is sufficient.
  - [ ] camelCase fields only. 2-space indent. Trailing newline.

- [ ] **Task 3 — Write `tests/unit/scoring/irt/parity.test.mjs`** (AC: 4, 6)
  - [ ] Create directory `tests/unit/scoring/irt/`.
  - [ ] Use only `node:test`, `node:assert/strict`, `node:fs`, `node:path`, `node:url`.
  - [ ] Resolve fixture path relative to `import.meta.url` (do NOT hardcode absolute paths).
  - [ ] One `test('parity vs hand-verified smoke vectors', (t) => { ... })` block iterating over fixture entries.
  - [ ] For each: `t.test(\`entry ${i}\`, () => { const r = scoreSession({...}); assert.ok(Math.abs(r.theta - e.expectedTheta) <= 0.001); ... });` — so the failure trace pinpoints the throw inside the stub.
  - [ ] Confirm `make test` exit code != 0 and stderr contains `TypeError: Not implemented`.

- [ ] **Task 4 — Update `Makefile` `test` target** (AC: 5)
  - [ ] Extend the glob to include `tests/unit/**/*.test.mjs`. Preserve `tests/scaffold/` + `tests/contract/` discovery.
  - [ ] Update the inline `##` help string to mention `unit`.

- [ ] **Task 5 — Author `tests/scaffold/scoring-irt-scaffold.test.mjs`** (AC: 7)
  - [ ] `node:test`-based scaffold acceptance. **This test passes green** — it's structural.
  - [ ] File-existence checks for all five `src/scoring/irt/*.js`.
  - [ ] Regex check: each stub source contains `export function <name>` or `export { <name> }` with the exact canonical name.
  - [ ] JSON shape check on fixture.
  - [ ] Regex check on `parity.test.mjs` import lines.
  - [ ] Read `Makefile` and assert `tests/unit/` substring present in the `test` recipe.

- [ ] **Task 6 — Run full local pipeline + capture artifacts** (AC: 6, 8, 9)
  - [ ] `make lint` → 0
  - [ ] `make test` → non-zero with `TypeError: Not implemented` in stderr; scaffold test passes; parity test fails as designed. Document exit code + first 20 stderr lines in `## Dev Agent Record → Debug Log References`.
  - [ ] `node tools/lint-cognitive-load-budget.mjs` → 0.
  - [ ] Time `make test` and note duration is <1s.

## Dev Notes

### Critical reading order

Before you write a single line of code, read these three sections **in this order**:

1. **`_bmad-output/planning-artifacts/epics.md` lines 745–765** — the canonical AC for this story.
2. **`_bmad-output/planning-artifacts/architecture.md` §"D3 — Scoring engine public API"** (lines ~438–510) — the canonical function names and the `scoreSession({ ... })` object-argument shape.
3. **`tools/determinism-harness.mjs`** — the `DETERMINISM` constants object you may import in *later* stories (2.6a/2.6b). For 2.1 you don't need it yet; just know it exists. **Do NOT recreate seed/quadpts/theta_lim constants** — when 2.2 lands, `quadrature.js` will read them from the harness (Story 1.8's contract).

### Naming reconciliation — Architecture D3 wins for the public surface

The epics document and the architecture document use **two different function name sets**:

| Concept | Epics doc says | Architecture D3 says | **This story uses** |
| --- | --- | --- | --- |
| Quadrature grid | `gridPoints` | `quadraturePoints` | **`quadraturePoints`** |
| Single-item likelihood | `itemLikelihood` | (folded into `logLikelihood`) | **`logLikelihood`** (re-exported from likelihood.js) |
| Pattern log-likelihood | `patternLogLikelihood` | `logLikelihood` | **`logLikelihood`** |
| EAP estimator | `estimateTheta` | `eapEstimate` | **`eapEstimate`** |
| Posterior SE | `posteriorSE` | `standardError` | **`standardError`** |
| Public facade | `scoreSession(responses, items, options)` | `scoreSession({ responses, itemParameters, normingStats })` | **object-argument `scoreSession({ ... })`** |

**Why architecture wins:** Architecture D3 is the contract that Epic 3 (`state.schema.json`), Epic 5 (`METHODOLOGY_CLAIMS.json`'s `method` field), and the assessment SPA result page all consume. Epic narrative names are *descriptive*, not normative. Flag this divergence in your `## Specialist Self-Review` so the epic spec can be reconciled in a follow-up doc PR; do **not** rename architecture or invent a third name set.

Stories 2.2–2.5 will refine these stubs into real implementations — and Story 2.2's AC may name `gridPoints` / `itemLikelihood` / `patternLogLikelihood`. Treat those names as *additional* function exports that 2.2 can layer on top of `logLikelihood` if needed; the architecture D3 public surface is the floor, not the ceiling.

### Why the fixture must be hand-authored at this story (not deferred to 2.6a)

Story 2.6a delivers the R-in-CI harness + R-generated `vectors-smoke.json`. But Story 2.1 needs *something* committed at that path so:

- The red-phase test fails with `TypeError: Not implemented` (the stub's throw), NOT with `ENOENT: no such file or directory` (a fixture-missing throw that would mask whether the engine is implemented at all).
- Stories 2.2–2.4 can iteratively turn the parity test green pattern-by-pattern as primitives + EAP land — they need a real assertion target, not just compile-error stubs.

Story 2.6a's R regen will produce a `vectors-smoke.json` whose values are derived from the canonical R-mirt pipeline (pinned seed). The R values for the hand-picked degenerate patterns (all-correct, all-wrong, single-correct, mid-symmetric) should agree with your hand-arithmetic to ±0.001 logits. If they don't, that's an audit win — flag it in 2.6a's Specialist Self-Review and reconcile then. **For 2.1: pick patterns where your paper arithmetic is unambiguous.**

### Pattern-picking heuristic for `vectors-smoke.json`

Suggested 6-entry seed (you may add 2–4 more):

1. **All-correct pattern, 3 items, identical params (a=1, b=0):** responses=[1,1,1] → EAP shrinks toward prior mean; expected θ ≈ ~+1.0 to +1.5 (compute against `quadpts=61, theta_lim=[-6,6]`).
2. **All-wrong pattern, 3 items, identical params (a=1, b=0):** responses=[0,0,0] → mirror of (1); expected θ ≈ -1.0 to -1.5.
3. **Single-correct, 1 item, (a=1, b=0):** responses=[1] → minimal info, θ near +0.5 (heavily shrunken).
4. **Single-wrong, 1 item, (a=1, b=0):** responses=[0] → θ near -0.5.
5. **Symmetric mixed, 4 items, (a=1, b in {-1, -0.5, 0.5, 1}):** responses=[1,1,0,0] → θ ≈ 0.0 exactly by symmetry.
6. **Discriminating item with high a, b=2:** (a=2.5, b=2) responses=[1] → θ shifted higher; useful for catching reversed-direction bugs in `eap.js`.

Verify each with `Rscript -e 'library(mirt); items <- data.frame(a1=c(1,1,1), d=c(0,0,0)); fscores(mirt(...), method="EAP", response.pattern=matrix(c(1,1,1), nrow=1), quadpts=61, theta_lim=c(-6,6))'` or equivalent. **Round expected values to 6 decimals in the JSON** to keep diffs readable.

### Stub function signatures — exact contracts to honor

`scoreSession` MUST match architecture D3 exactly (Stories 2.2–2.5 will fill in the body):

```js
// src/scoring/irt/index.js
export { logLikelihood } from "./likelihood.js";
export { quadraturePoints } from "./quadrature.js";
export { eapEstimate } from "./eap.js";
export { standardError } from "./se.js";

export function scoreSession({ responses, itemParameters, normingStats }) {
  throw new TypeError("Not implemented");
}
```

Sibling stubs follow the same throw-only pattern. Use `_responses`, `_itemParameters` etc. ONLY if ESLint `no-unused-vars` complains; the rule treats parameters as used once the function executes a `throw`, so unprefixed names should be fine. Verify with `make lint`.

### Test file: avoid the assert.throws trap

Murat's red-phase discipline: **the parity assertion itself must throw**, propagating the `TypeError: Not implemented` from inside `scoreSession`. Do NOT wrap calls in `assert.throws(() => scoreSession(...))` — that would *pass* the test (asserting the throw), which defeats the red-phase purpose. The test asserts numeric closeness; the throw inside `scoreSession` is what makes it fail.

```js
// CORRECT — calls scoreSession; the stub throws; the test fails
for (const e of fixture) {
  const r = scoreSession({ responses: e.responses, itemParameters: e.itemParameters, normingStats: { se_norming: 0 } });
  assert.ok(Math.abs(r.theta - e.expectedTheta) <= 0.001, `entry ${i}: θ drift`);
  assert.ok(Math.abs(r.sem - e.expectedSE) <= 0.001, `entry ${i}: SE drift`);
}
```

The `normingStats: { se_norming: 0 }` stub is the *only* hand-fixture compatible value — real norming stats land via Story 2.5 + `NORMING_CONSTANTS`. Document this stub-zero in Completion Notes.

### Existing repo state (do NOT break)

After Epic 1 + bridge-1-2, the repo already has:

- `tests/scaffold/` — 12 frozen tests (1.1–1.10 + bridge). Story 2.1 ADDS one (`scoring-irt-scaffold.test.mjs`); does NOT touch the existing 12.
- `tests/contract/tokens.spec.mjs` — design-system contract (Story 1.10). Untouched.
- `Makefile` — `test` target currently `node --test 'tests/scaffold/**/*.test.mjs' 'tests/contract/**/*.spec.mjs'`. Story 2.1 *extends* this glob; do NOT replace.
- `tools/determinism-harness.mjs` — Story 1.8's `DETERMINISM` object. Not consumed in 2.1; consumed in 2.2 (`quadrature.js` will use `DETERMINISM.R_QUADPTS` and `R_THETA_LIM` as defaults).
- `eslint.config.mjs` — Domain B (`src/scoring/**`) is FORBIDDEN from importing `src/assessment/`, `src/content/`, `tools/`, `tests/`. Your stubs only import from siblings — clean by construction.
- `BUDGETS.json.scoring-irt-lines.limit = 250`. Stubs total <50 lines = ~200 LOC headroom for 2.2–2.5. **Do not pad stubs with verbose comments**; the audit pillar lives on terseness.

The five `src/scoring/irt/*.js` paths currently do not exist (only `.gitkeep`). The `tests/golden/` directory contains only `.gitkeep`. Remove both `.gitkeep`s as part of this story (file presence supersedes them).

### TDS state-machine pre-flight (per [[tds-state-machine-quirks]] memory)

This story runs through TDS execute-story orchestration in IQ-ME. The forward-only state machine for this story will be:

```
ready-for-dev → tests-pending (auto, on tds branch start)
              → tests-drafting (manual, --as=test-author)
              → tests-approved (manual, --as=test-author)
              → in-progress (manual, --as=engineer)
              → review (manual, --as=engineer)
```

**The five `src/scoring/irt/*.js` stubs are written in the `engineer` phase, not `test-author`.** Test-author phase writes the *failing* `parity.test.mjs` + the hand-fixture + the scaffold test; engineer phase writes the stubs that make the scaffold test green (but parity stays red until 2.2–2.5). Engineer phase also touches the Makefile.

If you need to mutate any frozen test (none expected for 2.1), use `tds story unfreeze-tests --story=2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test --files=... --reason=... --as=<role>` per the bridge-1-2-1 affordance — NOT manual `Edit` + `tds integrity record`.

### Story 1.10 learnings to carry forward

- **`make snapshot-update` is the ONLY codified D→E write exception.** Story 2.1 introduces a new `tests/golden/vectors-smoke.json` file — but this is **hand-authored once**, not target-regenerated. No D→E concern in 2.1. (Story 2.6a will introduce `tests/golden/regenerate.R` which IS D→E and DOES need an ADR / domain-map update — but that's 2.6a's burden, not 2.1's.)
- **JSON files end with trailing newline + 2-space indent + path-sorted keys where order matters** (Story 1.10's `tokens.hash.json` convention). For `vectors-smoke.json`, entry order is preserved as written — DO add an array-position comment in `## Completion Notes` so 2.6a's regen can preserve it.
- **Scaffold test for THIS story goes in `tests/scaffold/` with `.test.mjs` suffix** (matches all 1.x stories' convention). The parity test goes in `tests/unit/scoring/irt/` with `.test.mjs` suffix (architecture mirror-tree rule).

### What 2.1 explicitly does NOT do

- ❌ Implement any actual math in `quadrature.js`, `likelihood.js`, `eap.js`, `se.js`, or the body of `scoreSession`. **Stubs only.**
- ❌ Set up R-in-CI / `.github/workflows/golden-regen.yml` — that's Story 2.6a.
- ❌ Generate `tests/golden/vectors.json` (the full ≥1,000-entry set) — that's Story 2.6b.
- ❌ Populate `src/scoring/irt/METHODOLOGY_CLAIMS.json` — that's Story 2.7.
- ❌ Wire the parity test into a CI label-trigger — pr-checks.yml runs `make test` in all PRs already (Story 1.6); the parity test will execute on every PR from this story onward.
- ❌ Touch `src/assessment/`, `src/content/`, or any other domain. Pure Domain B scaffolding.

### Project Structure Notes

- **New files** (this story creates):
  - `src/scoring/irt/quadrature.js`
  - `src/scoring/irt/likelihood.js`
  - `src/scoring/irt/eap.js`
  - `src/scoring/irt/se.js`
  - `src/scoring/irt/index.js`
  - `tests/golden/vectors-smoke.json`
  - `tests/unit/scoring/irt/parity.test.mjs`
  - `tests/scaffold/scoring-irt-scaffold.test.mjs`

- **Modified files** (this story touches):
  - `Makefile` — extend `test` recipe glob to include `tests/unit/**/*.test.mjs`.

- **Deleted files**:
  - `src/scoring/irt/.gitkeep`
  - `tests/golden/.gitkeep`

- **Untouched** (do not modify): every other file in the repo, including all 12 existing `tests/scaffold/*.test.mjs` files.

### References

- Story spec — [epics.md#L745-L765](../planning-artifacts/epics.md#L745-L765)
- Story 2.6a (where the fixture path/format is reaffirmed) — [epics.md#L854-L875](../planning-artifacts/epics.md#L854-L875)
- Architecture D3 (canonical function names + `scoreSession` shape) — [architecture.md#L438-L510](../planning-artifacts/architecture.md#L438-L510)
- Architecture §Structure Patterns (mirror-tree test naming) — [architecture.md#L665-L695](../planning-artifacts/architecture.md#L665-L695)
- Architecture §Process Patterns "Scoring failure contract" — [architecture.md#L791-L798](../planning-artifacts/architecture.md#L791-L798)
- Architecture §Frontend §Decision D2 (repo layout) — [architecture.md#L376-L436](../planning-artifacts/architecture.md#L376-L436)
- NFR10 / NFR21 / NFR26 / NFR33 — [prd.md](../planning-artifacts/prd.md) (no-`Math.random` in scoring; no-build runtime; verification time-to-confidence; zero runtime deps)
- BUDGETS.json `scoring-irt-lines` (250 LOC cap) — [BUDGETS.json](../../BUDGETS.json)
- Determinism harness (consumed in Story 2.2, not 2.1) — [tools/determinism-harness.mjs](../../tools/determinism-harness.mjs)
- Domain-map (eslint Domain B rules) — [eslint.config.mjs](../../eslint.config.mjs) + [docs/domain-map.md](../../docs/domain-map.md)
- Previous story (1.10 design system) for `node:test` + `tests/contract/` conventions — [1-10-design-system-foundation-primitives-css-semantic-css-dark-mode-overrides-tokens-spec-ts.md](1-10-design-system-foundation-primitives-css-semantic-css-dark-mode-overrides-tokens-spec-ts.md)
- TDS state-machine quirks memory — `~/.claude/projects/-Users-maksim-git-IQ-ME/memory/feedback_tds_state_machine_quirks.md`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Specialist Self-Review

(populated by engineer / specialist at end of impl)
