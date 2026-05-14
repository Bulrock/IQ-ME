# Framework recipes (TDS defaults)

> **Purpose.** Sanctioned baseline test framework configs + naming
> conventions per stack. Loaded by `bmad-tds-test-author` Step 3;
> referenced when ATDD chooses test scaffold layout.
>
> **Override pattern.** Per-team additions via `_bmad/custom/...
> additional_resources` block. Frameworks listed here — TDS-canonical;
> alternatives возможны в team override но specialist consult mode
> может рекомендовать stick to canonical (less integration friction).

## TypeScript / JavaScript

### Test runner — vitest (canonical) или jest (legacy)

**vitest** (recommended 2026):
- Native ESM, faster startup, vite-aligned.
- Config: `vitest.config.ts` с `test.coverage.provider = 'v8'`.
- File naming: `<source>.test.ts` co-located OR `__tests__/<source>.test.ts`.
- Methods: `describe('<unit>', () => { it('<behavior>', () => {...}) })`.

**jest** (legacy projects only):
- Heavier, requires Babel/swc transform; ts-jest для TypeScript.
- Migration к vitest recommended если CI > 30s baseline test runtime.

### Naming convention

```
test_<method>_<scenario>_<expected>
  ↓
it('returns null when input is empty', () => {...})
it('throws TypeError on negative size', () => {...})
```

BDD style acceptable: `it('should return null when input is empty')`.

### Async patterns

```ts
// Correct — async test fn.
it('fetches data', async () => {
  const data = await api.fetch();
  expect(data).toBeDefined();
});

// Forbidden — sync expectation на pending Promise.
it('fetches data', () => {
  api.fetch().then(data => expect(data).toBeDefined());  // assertion never reached
});
```

### Coverage tooling

vitest c8: `vitest --coverage`. JSON output: `coverage/coverage-final.json`. CI gates через `nyc check-coverage --lines 80`.

## Python

### Test runner — pytest (canonical)

- Config: `pyproject.toml` `[tool.pytest.ini_options]` или `pytest.ini`.
- File naming: `test_<module>.py` (default; `<module>_test.py` also accepted).
- Methods: `def test_<scenario>(): ...` (snake_case).
- Async: `pytest-asyncio` plugin, `mode = "auto"` рекомендуется.

### Naming convention

```python
def test_<method>_<scenario>_<expected>():
    pass

# Examples
def test_parse_email_with_unicode_domain_succeeds(): ...
def test_save_user_with_duplicate_id_raises_conflict_error(): ...
```

Hypothesis property-based testing для validation/parsers/math:
```python
from hypothesis import given, strategies as st

@given(st.integers(min_value=0))
def test_factorial_is_positive(n):
    assert factorial(n) > 0
```

### Async patterns

```python
# pytest-asyncio mode=auto — async tests automatically detected
async def test_fetch_user_succeeds():
    user = await api.fetch_user(1)
    assert user is not None

# AsyncMock when mocking async functions
from unittest.mock import AsyncMock
mock = AsyncMock(return_value={"id": 1})
```

### Coverage tooling

pytest-cov: `pytest --cov=src --cov-report=xml --cov-fail-under=80`.

## C# / .NET

### Test runner — xUnit (canonical) / NUnit / MSTest

**xUnit** (recommended):
- Config: `.csproj` PackageReference + `xunit.runner.json`.
- File naming: `<Class>Tests.cs` mirroring source structure.
- Methods: `[Fact]` или `[Theory] + [InlineData(...)]`.

### Naming convention

```csharp
public class CalculatorTests {
    [Fact]
    public void Add_TwoPositiveNumbers_ReturnsSum() {
        // Arrange
        var calc = new Calculator();
        // Act
        var result = calc.Add(2, 3);
        // Assert
        result.Should().Be(5);  // FluentAssertions
    }
}
```

`MethodUnderTest_Scenario_Expected` (PascalCase).

### Async patterns

```csharp
[Fact]
public async Task FetchUserAsync_ValidId_ReturnsUser() {
    var user = await _repo.FetchUserAsync(1);
    user.Should().NotBeNull();
}

// IClassFixture для shared expensive setup
public class DatabaseTests : IClassFixture<DatabaseFixture> { ... }
```

### Coverage tooling

coverlet: `dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover`.

## Java / JVM

### Test runner — JUnit 5 (canonical)

- Config: Maven `surefire-plugin` или Gradle `test` task.
- File naming: `<Class>Test.java` под `src/test/java/...`.
- Methods: `@Test` annotated.

### Naming convention

```java
@Test
void add_twoPositiveNumbers_returnsSum() {
    Calculator calc = new Calculator();
    int result = calc.add(2, 3);
    assertThat(result).isEqualTo(5);  // AssertJ
}
```

### Spring slice testing

```java
@WebMvcTest(UserController.class)  // controller layer only
@DataJpaTest                        // JPA layer only
@SpringBootTest                     // full context (slow — use sparingly)
```

### Coverage tooling

JaCoCo: `<jacoco-maven-plugin>` или Gradle `jacoco` plugin. Threshold rule:
```xml
<rule>
    <element>BUNDLE</element>
    <limits>
        <limit>
            <counter>LINE</counter>
            <minimum>0.80</minimum>
        </limit>
    </limits>
</rule>
```

## Frontend (React/Vue/Angular)

### Test runner — vitest или jest + Testing Library

**React Testing Library + vitest:**
- Query от user perspective (`getByRole`, `findByText`).
- `userEvent` (NOT `fireEvent`) для realistic interactions.
- a11y assertions через `jest-axe`.

### Naming convention

```ts
describe('LoginForm', () => {
  it('shows error when email is invalid', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'bad');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid email/i);
  });
});
```

### Coverage tooling

vitest c8 (см. TypeScript section). E2E: Playwright recommended (Cypress acceptable).

## iOS / Swift

### Test runner — XCTest (canonical)

- Config: Xcode test target.
- File naming: `<Class>Tests.swift`.
- Methods: `func test_<scenario>()` или `func test_<methodUnderTest>_<scenario>_<expected>()`.

### Naming convention

```swift
func test_login_invalidEmail_showsError() async throws {
    let viewModel = LoginViewModel()
    await viewModel.submit(email: "bad")
    XCTAssertTrue(viewModel.hasError)
}
```

### Async patterns

```swift
// Swift Concurrency (5.5+)
func test_fetchUser_async() async throws {
    let user = try await api.fetchUser(id: 1)
    XCTAssertNotNil(user)
}

// XCTestExpectation для completion handlers (legacy)
let exp = expectation(description: "fetched")
api.fetch { _ in exp.fulfill() }
await fulfillment(of: [exp], timeout: 5)
```

### Coverage tooling

Xcode built-in: `xcodebuild test -enableCodeCoverage YES`. Reports в `.xcresult` bundle.

## Android / Kotlin

### Test runner — JUnit 4 + Robolectric (canonical) или JUnit 5

**JUnit 4 + Robolectric:**
- Config: `build.gradle.kts` `testImplementation("org.robolectric:robolectric:...")`.
- Hilt test rules для DI (`@HiltAndroidTest`).
- Coroutines: `runTest`, `TestDispatcher`.

### Naming convention

```kotlin
@Test
fun `login with invalid email shows error`() = runTest {
    val viewModel = LoginViewModel()
    viewModel.submit(email = "bad")
    assertTrue(viewModel.hasError.value)
}
```

Backticks-style allowed (Kotlin idiom для readability).

### Coroutines test

```kotlin
@get:Rule
val mainDispatcherRule = MainDispatcherRule()

@Test
fun fetchUser_succeeds() = runTest {
    val user = repo.fetchUser(1)
    assertEquals(1, user.id)
}
```

### Coverage tooling

JaCoCo Gradle plugin: `./gradlew jacocoTestReport`. CI gate в `build.gradle`:
```kotlin
tasks.jacocoTestCoverageVerification {
    violationRules { rule { limit { minimum = "0.80".toBigDecimal() } } }
}
```

## Bash scripts

### Test runner — bats (canonical)

- File naming: `<feature>.bats`.
- Test functions: `@test "<description>" { ... }`.

```bash
@test "tds version reports v6.x" {
    run tds_in "${SANDBOX}" version
    [ "$status" -eq 0 ]
    [[ "$output" == *"v6."* ]]
}
```

## Cross-references

- `forbidden-patterns.md` — anti-patterns even within sanctioned framework.
- `coverage-thresholds.md` — coverage gates that reference these tools.
- `ac-mapping-rules.md` — naming convention для AC traceability.
- Per-language `bmad-tds-<lang>/customize.toml workflow.test_naming` — overridable conventions.
