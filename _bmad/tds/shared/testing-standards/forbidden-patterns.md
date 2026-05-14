# Forbidden test-side patterns (TDS defaults)

> **Purpose.** Authoritative list of test-side anti-patterns that TEA's
> ATDD + test-review workflows reject. Loaded by `bmad-tds-test-author`
> Step 3 + injected как corp-standards в TEA briefing.
>
> **Override pattern.** Per-team additions / removals via
> `_bmad/custom/bmad-tds-test-author.toml` `additional_resources` block
> pointing к team's `<paths>/forbidden-patterns.md`. Per-team docs are
> *appended* to TDS defaults (not replace) — TDS-defaults remain baseline.

## Universal forbidden (any stack)

### Timing through sleep

`sleep(...)` / `Thread.sleep(...)` / `time.sleep(...)` / `setTimeout` для синхронизации с async work — **forbidden**.

**Why:** sleep-based timing flakes на slow CI, производительных machines, под load. False-positive «test passed» когда sleep coincidentally дольше operation; false-negative flaky failure когда sleep слишком короткий.

**Correct:** event-driven waits — `await` on Promise / Task / Future, polling с timeout (`waitFor`, `Awaitility.await().untilAsserted(...)`), test framework's expectation primitives (`XCTestExpectation`, `runTest` virtual time).

### Hardcoded URLs / secrets / paths

Hardcoded `http://localhost:3000`, `/Users/<name>/...`, API keys, tokens — **forbidden** в test source.

**Why:** breaks parallel test runs (port collisions), cross-machine portability, leaks credentials into git history.

**Correct:** test-time configuration via fixture / environment variable (`process.env.TEST_API_URL`), random-port allocation для parallel runs, test-only credential mocks.

### Tautology («test passes by construction»)

```ts
// Forbidden: assertion identical to setup.
const x = 5;
expect(x).toBe(5);
```

**Why:** zero information value — tests passes regardless of code-under-test changes.

**Correct:** test exercises behavior — call function, assert result that's not trivially derivable from input.

### Mocking the unit under test

```python
# Forbidden: mocking method we're claiming to test.
mock_calc = Mock()
mock_calc.add.return_value = 5
result = mock_calc.add(2, 3)
assert result == 5  # tests Mock framework, not Calculator
```

**Why:** test exercises mock, not production code. Passes даже если real `add()` broken.

**Correct:** mock **boundaries** (HTTP, DB, FS, external services). Unit under test runs real.

### ID-based test ordering reliance

Tests that depend on alphabetical / file-order execution для shared state setup.

**Why:** parallel runners, randomised order (vitest `--shuffle`, pytest `pytest-randomly`) break.

**Correct:** each test starts с clean state — fixtures recreate dependencies.

### Commented-out tests

```kotlin
// @Test fun should_handle_edge_case() { ... }  // TODO: fix later
```

**Why:** untracked technical debt; «later» becomes «never»; CI doesn't track regressions.

**Correct:** either delete (if superseded), `@Disabled("issue-N")` / `@Ignore` с tracked-issue reference, or fix.

### Testing implementation details

Reading private fields через reflection, asserting на internal method call counts beyond contract, snapshot-testing every component output.

**Why:** refactor-fragile — internal change breaks test без behavior change.

**Correct:** test public contract (inputs → outputs); use behavior assertions (`should display error message` vs `should call setState 3 times`).

### Catch-all swallowing

```python
try:
    ...
except Exception:  # Forbidden: swallows real bugs
    pass
```

**Why:** masks production-relevant failures; test passes when something completely unrelated breaks.

**Correct:** `except SpecificError as e:` + assert `e.message` shape, либо `pytest.raises(SpecificError, match=r"...")`.

### Concurrent test pollution

Shared singletons / static state / global registries modified between tests без teardown reset.

**Why:** parallel runs interfere; test order matters; flakiness source.

**Correct:** explicit teardown reset, dependency injection вместо globals, fresh instance per test.

## Stack-specific forbidden

Per-stack details live в specialist SKILL.md `## Consult Mode` sections (загружаются consultation phase). Brief summary:

- **Python** — `time.sleep` для async, bare `except Exception:`, mocking ORM session implementation.
- **C#** — `Task.Wait()` / `.Result` (deadlocks), shared `static` mutable, `Thread.Sleep`.
- **Java** — `Thread.sleep`, reflection on private methods, static state pollution.
- **Frontend** — `setTimeout` for waits, `wrapper.state()` testing, Enzyme `shallow()` (deprecated).
- **iOS** — `sleep(_:)` для async, force-unwrap `!` в тестах, snapshot tests без device matrix.
- **Android** — `Thread.sleep` для coroutines, real Looper sans Robolectric, force-cast `as`.
- **General** — see specialist consultation для stack-specific.

## Override examples

**Add team-specific forbidden:**

```markdown
# team-forbidden-patterns.md
## Stripe-specific forbidden
- Hardcoded test card numbers other than Stripe's official `4242 4242 4242 4242` family.
- Live API calls в unit tests (use Stripe Mock или `stripe-mock` container).
```

Reference в `_bmad/custom/bmad-tds-test-author.toml`:
```toml
[workflow]
additional_resources = [
  "{project-root}/docs/testing/team-forbidden-patterns.md"
]
```

## Cross-references

- `coverage-thresholds.md` — when forbidden patterns are quantitatively gated.
- `framework-recipes.md` — sanctioned alternatives для forbidden patterns.
- `ac-mapping-rules.md` — naming convention для test-AC traceability.
