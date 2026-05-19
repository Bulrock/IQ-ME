# Test review — story 2-1 (cycle 1)

**Story:** 2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test
**Reviewer:** test-author (lightweight inline; user-authorised deviation from full TEA subagent fan-out for context efficiency on prescriptive spec)
**Date:** 2026-05-19
**Verdict:** **approved**

## Artifacts reviewed

- `tests/unit/scoring/irt/parity.test.mjs` — 47 lines, red-phase parity
- `tests/scaffold/scoring-irt-scaffold.test.mjs` — 84 lines, green structural
- `tests/golden/vectors-smoke.json` — 6 hand-fixture entries

## AC coverage

| AC | Covered | Notes |
|----|---------|-------|
| AC-3 fixture shape | yes | 6 entries; camelCase fields; 2-space indent; trailing newline; scaffold test asserts shape (count, types, nested item param shape). |
| AC-4 parity test red-phase discipline | yes | Direct `scoreSession({...})` call; no `assert.throws` wrap; imports only `node:` + sibling-relative; throws propagate from stub `TypeError`. |
| AC-6 <1s wall-clock | yes structurally | First scoreSession call throws → suite returns immediately. Verified post-engineer-phase via `make test` timing. |
| AC-7 scaffold pinning | yes | Assertions: (a) stub file existence ×5, (b) canonical export name regex ×4, (c) index.js re-exports + scoreSession decl, (d) fixture JSON shape + counts + types, (e) parity.test import allowlist, (f) Makefile substring `tests/unit/`. |

## Quality dimensions

- **Determinism:** clean — no `Date.now`, no `Math.random`, no network, no env coupling.
- **Isolation:** clean — fixture loaded once at module scope (read-only); no shared mutable state across tests.
- **Maintainability:** good — `STUBS` table at top of scaffold test centralizes (file, canonical-name) pairs; parity test uses paginated subtests with descriptive labels.
- **Performance:** trivial assertions; no expensive setup/teardown.

## Findings (info-only, non-blocking)

1. **Hand-fixture numeric values not R-verified.** Story 2.1 spec lines 165-166 explicitly defer R-mirt regeneration to story 2.6a. Acceptable per spec scope; engineer phase tests will produce `TypeError: Not implemented` long before numeric closeness is evaluated.
2. **`entry ${i}` subtest labels 0-indexed.** Minor cosmetic; aligns with JavaScript array conventions.

## Action

State flipped: `tests-drafting → tests-approved`. Engineer phase activates next via `bmad-tds-execute-story` Step 4b.
