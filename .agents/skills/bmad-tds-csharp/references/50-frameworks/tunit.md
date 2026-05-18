# TUnit — modern .NET test framework (greenfield default)

> Status: **landed v6.6.8**. Lazy-load по требованию из bmad-tds-csharp
> Step 2 / Step 4 / Decision Tree A1, когда story.target_framework =
> net10.0 или explicit TUnit packages в test project.
>
> Source: https://tunit.dev/ (project home, MIT) — verified 2026-05-16
> via Context7 `/thomhurst/tunit`. Microsoft docs:
> https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-dotnet-test

TUnit — source-generator-based test framework на Microsoft.Testing.Platform
(MTP). Async-first lifecycle, AOT-friendly, parallelism by default.
Greenfield default для bmad-tds-csharp начиная с v6.6.8 (см.
`customize.toml workflow.tooling.test_framework`).

## Critical: `dotnet test` на .NET 10 SDK — MTP mode syntax

Самый частый stumble на новых .NET 10 проектах. .NET 10 SDK ввёл native
MTP runner для `dotnet test`, который **меняет argument syntax** против
legacy VSTest. Без понимания — agent зацикливается на «unknown switch» /
«unexpected argument».

### Шаг 1. Opt-in через `global.json` (repo root)

```json
{
  "test": {
    "runner": "Microsoft.Testing.Platform"
  }
}
```

Без этого файла `dotnet test` на .NET 10 SDK работает в VSTest fallback
mode, но MTP v2 (TUnit upstream) **больше не support'ит VSTest** —
behavior undefined / errors. Файл обязателен для любого .NET 10 + TUnit
greenfield setup.

### Шаг 2. Invocation syntax — flag-based, не positional

| Mode | Project path | Extension flags | Example |
|------|--------------|-----------------|---------|
| **MTP (.NET 10 + opt-in)** | `--project` / `--solution` / `--test-modules` flag | напрямую, без `--` separator | `dotnet test --project tests/Api.Tests.csproj -c Release --coverage --report-trx` |
| **VSTest (legacy, .NET 8/9)** | positional argument | после `--` separator | `dotnet test tests/Api.Tests.csproj -c Release -- --coverage --report-trx` |

**Common stumble:** `dotnet test tests/Api.Tests.csproj` (positional) в MTP
mode → fails. Правильно — `dotnet test --project tests/Api.Tests.csproj`.

### Шаг 3. Extension packages для coverage / TRX

`--coverage` и `--report-trx` приходят из MTP extension packages.
Добавляй в `*.Tests.csproj`:

```xml
<ItemGroup>
  <PackageReference Include="TUnit" />
  <PackageReference Include="Microsoft.Testing.Extensions.CodeCoverage" />
  <PackageReference Include="Microsoft.Testing.Extensions.TrxReport" />
</ItemGroup>
```

С `Directory.Packages.props` (Central Package Management) — versions
живут отдельно.

## Test patterns

### Basic test

```csharp
using TUnit.Core;
using FluentAssertions;

public class CalculatorTests
{
    [Test]
    public async Task Add_PositiveNumbers_ReturnsSum()
    {
        var sut = new Calculator();
        var result = sut.Add(2, 3);
        result.Should().Be(5);
    }
}
```

`[Test]` (не `[Fact]` как в xUnit). Test methods как правило `async Task`
даже для sync logic — TUnit hooks все async-aware.

### Parameterised (data-driven)

```csharp
[Test]
[Arguments(1, 1, 2)]
[Arguments(2, 3, 5)]
[Arguments(-1, 1, 0)]
public async Task Add_VariousInputs_ReturnsExpected(int a, int b, int expected)
{
    var sut = new Calculator();
    sut.Add(a, b).Should().Be(expected);
}
```

`[Arguments(...)]` вместо xUnit's `[InlineData(...)]`. Для complex data —
`[ClassDataSource<T>]` / `[MethodDataSource(nameof(Source))]`.

### Async lifecycle hooks

```csharp
public class IntegrationTests
{
    private HttpClient _client = null!;

    [Before(Test)]
    public async Task SetupClient()
    {
        var factory = new WebApplicationFactory<Program>();
        _client = factory.CreateClient();
        await Task.CompletedTask;
    }

    [After(Test)]
    public async Task TeardownClient()
    {
        _client.Dispose();
        await Task.CompletedTask;
    }

    [Test]
    public async Task HealthEndpoint_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");
        response.IsSuccessStatusCode.Should().BeTrue();
    }
}
```

`[Before(Test)]` / `[After(Test)]` вместо xUnit's constructor +
`IAsyncDisposable`. Native async — нет sync/async dual API gotchas.

### Shared expensive setup

```csharp
public sealed class DatabaseFixture
{
    public string ConnectionString { get; } = "...";
    // ...
}

public class RepositoryTests
{
    [ClassDataSource<DatabaseFixture>]
    public required DatabaseFixture Fx { get; init; }

    [Test]
    public async Task Get_FetchesRow() { /* ... */ }
}
```

`[ClassDataSource<T>]` injection вместо xUnit's `IClassFixture<T>`.
Lifecycle scope: per test class.

## Parallelism

TUnit parallel-by-default. Контроль:

- `[NotInParallel]` — атрибут на test class или method для serialisation.
- `--maximum-parallel-tests 4` — CLI flag (MTP mode, без `--` separator).
- `[ParallelGroup("name")]` — группировка тестов с shared resource.

Не использовать static state между тестами без explicit `[NotInParallel]`
— parallelism breaks race-y assumptions.

## Filtering

TUnit использует MTP `--treenode-filter` (xUnit-style filter string не
поддерживается).

```bash
# Run single test class
dotnet test --project tests/Api.Tests.csproj --treenode-filter "/*/*/CalculatorTests/*"

# Run single test method
dotnet test --project tests/Api.Tests.csproj --treenode-filter "/*/*/CalculatorTests/Add_PositiveNumbers_ReturnsSum"

# List tests without running
dotnet test --project tests/Api.Tests.csproj --list-tests
```

## CI/CD example (GitHub Actions, .NET 10 MTP mode)

```yaml
- name: Setup .NET 10
  uses: actions/setup-dotnet@v4
  with:
    dotnet-version: '10.0.x'

- name: Run tests
  run: dotnet test --solution MyApp.sln -c Release --coverage --report-trx --results-directory ./TestResults
```

С `global.json` opt-in в repo root no `--` separator нужен. Note: для
`dotnet-version: '9.0.x'` — нужен `-- --coverage --report-trx` (VSTest
mode).

## Gotchas (live observations)

1. **Забыл `global.json` opt-in** на .NET 10 → `dotnet test` либо
   fall-through на legacy VSTest (которая не support'ит MTP v2 features),
   либо непредсказуемая ошибка. Setup всегда начинай с создания
   global.json.
2. **Positional project path в MTP mode** → «unknown argument». Всегда
   `--project=<csproj>` / `--solution=<sln>` через flag.
3. **`--` separator в MTP mode** — не нужен (был обязателен в VSTest),
   но не fatal — MTP игнорирует одиночный `--`. Если код-snippet от
   .NET 9 era содержит `--`, MTP-mode работает; убирать не обязательно
   но cleaner без.
4. **Mixed xUnit + TUnit в одной test-сборке** — НЕ работает. Один
   test framework на assembly (Karpathy #3). Если migration нужна —
   отдельная story.
5. **Mocking стек:** NSubstitute / Moq работают с TUnit без изменений
   (они library-level, не coupled к test framework runtime). Assertions —
   FluentAssertions remains the choice.

## References

- TUnit docs home: https://tunit.dev/
- Microsoft.Testing.Platform overview: https://learn.microsoft.com/en-us/dotnet/core/testing/microsoft-testing-platform-intro
- MTP v1 → v2 migration: https://learn.microsoft.com/en-us/dotnet/core/testing/microsoft-testing-platform-migration-from-v1-to-v2
- `dotnet test` MTP mode (.NET 10 SDK): https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-dotnet-test#mtp-mode-of-dotnet-test
