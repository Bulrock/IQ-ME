# AC ↔ test mapping rules (TDS defaults)

> **Purpose.** Traceability convention — каждый AC из story spec должен
> быть mapped к ≥ 1 verifiable test. Used by TEA test-review verdict
> (Step 6 в `bmad-tds-test-author`): без этого mapping verdict =
> needs-revision regardless of coverage numbers.
>
> **Override pattern.** Per-team mapping conventions via
> `_bmad/custom/bmad-tds-test-author.toml additional_resources`. Team
> overrides **augment** (not replace) — TDS-default convention остаётся
> baseline для AC-to-test traceability.

## Why traceability matters

Coverage tools report «80% lines hit»; mutation audit reports «90% mutants killed». Neither answers the question: **«does each AC из spec have a test that fails если AC violated?»**

Without explicit AC-to-test mapping:
- AC #4 («system должна показывать error message при duplicate email») может быть mapped к test, который exists но не actually verifies the contract.
- Coverage может быть высокой через many tests на helper functions, but core AC contract uncovered.
- TEA test-review verdict can detect this gap только если каждый test claims its AC.

## Naming convention — canonical

Каждый test name **должен** include reference к AC index:

### Inline AC reference (preferred)

```python
def test_login_AC1_invalid_email_shows_error_message():
    # AC #1: «system shows error message при invalid email format»
    ...

def test_signup_AC4_AC5_duplicate_email_returns_conflict_status():
    # Multi-AC: AC #4 (duplicate detection) + AC #5 (status code 409)
    ...
```

### Comment-based AC reference (acceptable)

```typescript
it('shows error message on invalid email', () => {
    // AC #1: invalid-email-format error display
    ...
});
```

### NOT acceptable

```python
def test_login_validation():  # No AC reference; impossible to trace
    ...
```

## Single-AC vs multi-AC tests

**One AC per test (preferred).** Each test exercises one acceptance contract; failure pinpoints which AC violated.

**Multi-AC tests acceptable** для:
- Cross-cutting concerns (e.g., authorization affects multiple endpoints — single auth test verifies AC #N1, AC #N2 simultaneously).
- AC #N depends на AC #M (testing AC #N already verifies AC #M as precondition).

Document multi-AC tests с explicit list:
```kotlin
// AC #2 + AC #3: rate limit returns 429 AND includes Retry-After header
@Test
fun `rate limit returns 429 with Retry-After header`() { ... }
```

## Coverage matrix (TEA test-review uses)

`bmad-tds-test-author` Step 6 (test-review) generates AC-to-test mapping table:

| AC index | AC text | Mapped tests | Verified |
|---|---|---|---|
| AC #1 | «invalid email shows error» | `test_login_AC1_*` (1 test) | ✅ |
| AC #2 | «rate limit returns 429» | `test_rate_limit_AC2_*`, `test_rate_limit_AC2_AC3_*` | ✅ |
| AC #3 | «Retry-After header set» | `test_rate_limit_AC2_AC3_*` | ✅ |
| AC #4 | «system должна быть надёжной» | — | ❌ NOT TESTABLE (non-quantitative AC; see story authoring) |
| AC #5 | «duplicate email returns conflict» | (none) | ❌ MISSING |

**Verdict outcomes:**
- All AC mapped + tested → `approved` candidate.
- Missing AC test → `needs-revision` (back to ATDD Step 4 with «AC #5 missing» finding prepended).
- Non-testable AC (AC #4 example) → halt back to story authoring (out-of-scope test-author phase; AC reformulation needed).

## Story authoring expectations

For test-author phase to succeed, story spec must have:

### Numbered AC list

```markdown
## Acceptance Criteria

1. <AC text — quantitative / verifiable>
2. <AC text>
3. <AC text>
```

Numbering preserved во всём pipeline; ATDD references AC by index.

### Quantitative phrasing

**Bad** (non-testable):
- «System should be reliable»
- «UX must be smooth»
- «Performance acceptable»

**Good** (testable):
- «P95 latency ≤ 200ms under 100rps load»
- «Error message displayed within 100ms of submit click»
- «Bulk import of 10k records completes within 30s»

### Boundary conditions explicit

When AC implies edge cases, spell them out:

**Bad:** «System validates email format»
**Good:**
- AC #1: invalid email format → error message displayed.
- AC #2: empty email field → no submit; «email required» message.
- AC #3: email with unicode domain (e.g., `user@münchen.de`) accepted.

## Override examples

**Add team-specific mapping rules:**

```markdown
# team-ac-mapping.md
## Stripe-specific AC traceability
- Webhook tests must reference `event.type` в test name
  (e.g., `test_AC2_charge_succeeded_webhook_processes_correctly`).
- Idempotency tests reference idempotency-key behavior (AC + idempotency contract).
```

```toml
# _bmad/custom/bmad-tds-test-author.toml
[workflow]
additional_resources = [
  "{project-root}/docs/testing/team-ac-mapping.md"
]
```

## What NOT to require

- AC reference в **internal helper test** — they don't exercise AC directly, just tested functions used by AC tests. Helper tests reference function under test, not AC.
- AC reference в **integration tests crossing many AC** — they reference scenario / user-journey, AC mapping listed в test docstring instead of name (length).

## Cross-references

- `forbidden-patterns.md` — patterns that break traceability (e.g., unnamed parameterised tests).
- `coverage-thresholds.md` — quantity signal complementary to traceability (qualitative).
- `framework-recipes.md` — naming conventions per stack adapt this rule.
- TEA workflow `bmad-testarch-trace` — automated coverage-trace tooling (TI scope: future).
