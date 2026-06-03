# Test-review verdict — story 6-7 (cycle 1)

**Verdict: approved**

Reviewer: independent clean-context subagent (sonnet), did not author the tests.
Files reviewed:
- tests/unit/save-result.test.mjs (5 cases)
- tests/unit/result-save-retest.test.mjs (5 cases)

## AC coverage
| AC | Unit-testable | Covered | Test(s) |
|----|---------------|---------|---------|
| AC-1 save button default state | yes | yes | result-save-retest "AC-1 …" |
| AC-2 single write + key + payload | yes | yes | save-result "AC-2 …" + "AC-2/hash …" |
| AC-3 NFR9 first-render / read-only | yes | yes | save-result import-time + isSaved; result-save-retest first-render |
| AC-4 saved-state flip + idempotent | yes | yes | save-result idempotent; result-save-retest click + 2nd-click |
| AC-5 retest-note presence | yes (presence) | yes | result-save-retest "AC-5/AC-6 …" |
| AC-6 methodology link href | yes | yes | result-save-retest exact href assertion |
| AC-7 zero-third-party | Playwright | deferred (acceptable) | network-trace spec at impl Task 6 |
| AC-8 separation-of-concerns / frozen-grep | yes (structural) | yes | storage tests target save-result.js only |

## Findings
None blocking.

## Non-blocking notes (for impl/auditor awareness)
1. AC-5 content depth: tests assert retest-note presence via sentinel, not the three required prose points (small pool / correlated estimate / no cooldown). Those live in strings.json — content review, not unit assertion.
2. save-result.test.mjs key-safety regex comment vs code mismatch (cosmetic; meaningful no-whitespace/colon check already present).
3. AC-3 import-time test intentionally relies on spy-installed-before-import call order (mirrors theme.test.mjs). Correct.
4. AC naming uses "AC-N:" prefixes inline — compliant with ac-mapping-rules.md.
5. Frozen-grep safety confirmed: no test forces localStorage/Date.now into result.js; result.test.mjs AC-9.15 stays orthogonal.
