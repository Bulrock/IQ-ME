# C# Clean Code Principles

> Adapted from Robert Martin's *Clean Code* (2008), Microsoft's *Framework Design
> Guidelines* (3rd ed.), Bill Wagner's *Effective C#* (3rd ed., 2017+),
> Jon Skeet's *C# in Depth* (4th ed., 2019+), и G. Ann Campbell's *Cognitive Complexity*.
>
> Применяется в каждом C# / .NET story (auto-loaded в Step 3 Plan).
> Дополняет (не заменяет) Karpathy 4 принципа .

## Соотношение с Karpathy

| Karpathy | Clean Code (C#) |
|----------|------------------|
| #1 Think Before Coding | Naming first; nullable annotations explicit |
| #2 Simplicity First | Minimal API > MVC controllers if simple; records > class for DTOs |
| #3 Surgical Changes | DRY; respect existing patterns; не fix unrelated warnings |
| #4 Goal-Driven Execution (TDD) | xUnit + FluentAssertions; failing test first |

---

## 1. Meaningful Names — C# conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Class / Struct / Record / Enum | `PascalCase` | `UserService`, `OrderRecord` |
| Interface | `IPascalCase` (prefix `I`) | `IUserRepository`, `IDisposable` |
| Method | `PascalCase` | `GetUser`, `SaveAsync` |
| Property | `PascalCase` | `UserId`, `IsActive` |
| Public field | `PascalCase` | `MaxRetries` |
| Private field | `_camelCase` (leading underscore) | `_logger`, `_cache` |
| Local variable / parameter | `camelCase` | `userId`, `connectionString` |
| Constant | `PascalCase` (NOT SCREAMING) | `MaxRetryCount`, `DefaultTimeout` |
| Generic type param | `T` или `TPascalCase` | `T`, `TElement`, `TResult` |
| Async method | suffix `Async` | `FetchUserAsync`, `SaveAsync` |
| Boolean | `Is*` / `Has*` / `Can*` / `Should*` | `IsActive`, `HasPermission`, `CanWrite` |
| Event handler | `On<EventName>` или `<Event>Handler` | `OnUserCreated`, `ButtonClickHandler` |

**Anti-patterns:**

- Hungarian: `strName`, `iCount`, `bIsActive` — modern C# type system делает this redundant.
- `m_` prefix для fields — old C++ legacy; use `_` prefix in modern C#.
- Suffix `Manager`, `Handler`, `Helper`, `Utility` без specifics — usually means SRP violation.
- Async methods без `Async` suffix — Microsoft convention; всегда suffix.
- Interface без `I` prefix — community style varies, но `I` prefix — Microsoft Framework Design Guidelines.

---

## 2. Methods (Functions, Ch. 3 adapted)

### Size

- **≤20 lines** target (excluding doc comments).
- ≤10 lines ideal.
- Section comments inside method (`// Validate`, `// Save`, `// Notify`) → split into 3 methods.

### Single responsibility

Method does ONE thing: cannot extract helper с meaningful name.

### Method arguments

- **0** ideal.
- **1** good.
- **2** acceptable.
- **3+** group в record / DTO.
- **Bool flags** — split:
  ```csharp
  // BAD
  public User CreateUser(string name, string email, bool isAdmin, bool sendWelcome) { }
  
  // GOOD
  public User CreateUser(UserCreationRequest request) { }
  // OR
  public User CreateUser(string name, string email) { }
  public User CreateAdmin(string name, string email) { }
  ```
- **`params` arrays** — sparingly; only когда truly variadic (e.g., `string.Concat`).

### Records для DTOs (C# 9+)

```csharp
// BAD — manual class for data
public class UserCreationRequest
{
    public string Name { get; set; }
    public string Email { get; set; }
    // ... boilerplate Equals, GetHashCode
}

// GOOD — record (positional / property syntax)
public record UserCreationRequest(string Name, string Email, int Age);

// Mutable variant если нужно:
public record UserDraft
{
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}
```

`record` для immutable value-like types; `class` для reference identity.
`record struct` (C# 10+) для small value types.

### Nullable reference types — обязательны

```csharp
// .csproj: <Nullable>enable</Nullable>

public User? FindUser(string id)        // returns null если not found — explicit
{
    return _repo.FindById(id);
}

public User GetUser(string id)           // non-null OR throws
{
    return _repo.FindById(id) ?? throw new UserNotFoundException(id);
}

public void Process(User? user)
{
    ArgumentNullException.ThrowIfNull(user);  // .NET 6+ helper
    // дальше user — non-null
}
```

`ArgumentNullException.ThrowIfNull(arg)` — modern shorthand.
`required` modifier (C# 11+) для mandatory init properties.

### Async/await — обязательно для I/O

```csharp
// BAD — sync на ASP.NET handler
public IActionResult GetUser(string id)
{
    var user = _service.GetUser(id);  // sync — blocks ThreadPool
    return Ok(user);
}

// GOOD — async
public async Task<ActionResult<User>> GetUserAsync(string id, CancellationToken ct)
{
    var user = await _service.GetUserAsync(id, ct);
    return user is null ? NotFound() : Ok(user);
}
```

### CancellationToken — propagate всегда

```csharp
public async Task<User> FetchUserAsync(string id, CancellationToken ct)
{
    var response = await _httpClient.GetAsync(url, ct);  // propagated
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadFromJsonAsync<User>(ct);
}
```

CancellationToken — last parameter в method signature (.NET convention).

### `ConfigureAwait(false)` в library code

```csharp
// Library / class library code:
public async Task<User> FetchAsync(string id)
{
    var response = await _client.GetAsync(url).ConfigureAwait(false);
    return await response.Content.ReadFromJsonAsync<User>().ConfigureAwait(false);
}

// Application code (ASP.NET 9+ — sync context removed): ConfigureAwait не required.
```

Library habit — for cross-version compat.

### `Task.Run` carefully

```csharp
// BAD — на ASP.NET handler — Task.Run inside async — uselessly hops to ThreadPool
public async Task<IActionResult> Handler()
{
    var result = await Task.Run(() => SomeAsyncWork());  // ❌ already on ThreadPool
}

// GOOD — для CPU-bound work из desktop / non-async context only
public async Task<int> ComputeHashAsync(byte[] data)
{
    return await Task.Run(() => HeavyHashAlgorithm(data));
}
```

Do not use `.Result` или `.Wait()` — deadlock risk на sync context (ASP.NET 4.x; less в ASP.NET Core).

### Side effects + Command-Query

`GetUser()` returns без mutation. `SaveUser()` returns void/Task (or throws).

### DRY

2+ occurrences → extract method или extension.

---

## 3. Comments (Ch. 4)

Default: zero. XML doc comments — yes for public API:

```csharp
/// <summary>
/// Fetches a user by ID.
/// </summary>
/// <param name="id">The unique identifier of the user.</param>
/// <param name="ct">Cancellation token.</param>
/// <returns>The user, or <c>null</c> if not found.</returns>
/// <exception cref="DatabaseException">Thrown on connection failure.</exception>
public async Task<User?> FetchUserAsync(string id, CancellationToken ct = default)
{
    ...
}
```

XML docs — required для public API в libraries (NuGet packages); generated reference docs.

**Never:**
- `// TODO:` без ticket reference.
- Commented-out code.
- Section comments inside methods.

---

## 4. Types (Ch. 6, 10)

### Records vs Classes vs Structs

| Use case | Choice |
|----------|--------|
| Immutable value-like data (DTO, event, message) | `record` (or `record struct` для small) |
| Reference identity (services, repositories) | `class` |
| Hot-path small value (e.g., `Point`) | `struct` (or `record struct`) |
| Mutable state container | `class` (или `record` с `init` properties + manual mutator methods) |

### Single Responsibility

`UserService` — one role. `UserAndOrderService` — split.

### Sealed by default (best practice)

```csharp
// Mark classes sealed unless you DESIGNED for inheritance:
public sealed class UserService { }
```

`sealed` — performance + no surprise overrides. Open for extension через composition + interfaces, не inheritance.

### Dependency Injection

Constructor injection — Microsoft Framework convention. Avoid:
- Property injection (hidden dependencies).
- Service locator pattern (`serviceProvider.GetService<T>()`) внутри domain logic.
- Static dependencies (`StaticConfig.Instance`) — not testable.

```csharp
// GOOD — constructor injection
public sealed class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IOrderRepository repo, ILogger<OrderService> logger)
    {
        _repo = repo;
        _logger = logger;
    }
}
```

### Lifetime scopes (DI)

| Scope | Use case |
|-------|----------|
| Singleton | Stateless services (no per-request data) |
| Scoped | Per-request: HTTP request, DB context |
| Transient | Cheap, stateless, ephemeral |

Mistakes:
- `DbContext` as Singleton — concurrency violation.
- IHttpClientFactory `HttpClient` not as singleton (use factory).
- Scoped service injected into Singleton — captive dependency anti-pattern.

### Records: structural equality

```csharp
public record User(Guid Id, string Name);

var a = new User(Guid.NewGuid(), "Alice");
var b = a with { Name = "Bob" };  // copy с mutation
// a.Equals(b) → false (different Name)
```

`with` — record copy expression (Tony Hoare's «vector cloning»).

---

## 5. Error Handling (Ch. 7)

### Throw exceptions, return `null` only when intentional

```csharp
// BAD — null hides reason
public User? ParseUser(string json)
{
    try { return JsonSerializer.Deserialize<User>(json); }
    catch { return null; }
}

// GOOD — exceptions
public User ParseUser(string json)
{
    return JsonSerializer.Deserialize<User>(json)
        ?? throw new InvalidUserDataException("JSON deserialized to null");
}
```

Exception для exceptional, NULL для absence of value (e.g., `FindById` returning null OK).

### Exception hierarchy

```csharp
public abstract class AppException : Exception
{
    protected AppException(string message, Exception? inner = null)
        : base(message, inner) { }
}

public sealed class UserNotFoundException : AppException
{
    public string UserId { get; }
    public UserNotFoundException(string userId)
        : base($"User '{userId}' not found")
    {
        UserId = userId;
    }
}
```

### Catch specific, not bare `catch`

```csharp
// BAD
try { } catch (Exception) { /* lose context */ }

// GOOD
try { }
catch (UserNotFoundException) { /* recoverable */ }
catch (DbException ex) { _logger.LogError(ex, "DB error"); throw; }
```

### Never silent catches

```csharp
// BAD
try { Save(); } catch { }  // ❌

// GOOD
try { Save(); }
catch (DbException ex)
{
    _logger.LogError(ex, "Save failed for {UserId}", user.Id);
    throw;  // или handle specifically
}
```

### `using` declarations / `using` statements

```csharp
// Modern (C# 8+)
using var stream = File.OpenRead("data.txt");
// dispose at end of scope

// Or explicit block
using (var stream = File.OpenRead("data.txt")) { }
```

### `IAsyncDisposable` для async resources

```csharp
public sealed class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync() { ... }
}

await using var resource = new AsyncResource();
```

### Result pattern (alternative к exceptions for control flow)

For functional / non-exceptional flows:

```csharp
public record Result<T>(T? Value, string? Error)
{
    public static Result<T> Ok(T value) => new(value, null);
    public static Result<T> Fail(string error) => new(default, error);
    public bool IsSuccess => Error is null;
}
```

Use when failure is expected control flow (e.g., validation), not for I/O exceptions.

Libraries: `LanguageExt`, `OneOf`, `FluentResults` — popular community options.

---

## 6. Tests (Ch. 9) — xUnit + FIRST

### FIRST principles (same as iOS)

| Letter | Principle |
|--------|-----------|
| **F**ast | ≤ 0.1s unit tests |
| **I**ndependent | Order doesn't matter |
| **R**epeatable | No randomness, no time-dependence |
| **S**elf-validating | `Assert.X` boolean |
| **T**imely | Test-first (TDD) |

### AAA + naming

```csharp
[Fact]
public async Task LoginAsync_WithValidCredentials_ReturnsToken()
{
    // Arrange
    var mockAuth = new Mock<IAuthService>();
    mockAuth.Setup(a => a.AuthenticateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Token("abc123"));
    var service = new LoginService(mockAuth.Object);
    
    // Act
    var token = await service.LoginAsync("x@y.z", "secret");
    
    // Assert
    Assert.Equal("abc123", token.Value);
    // OR with FluentAssertions:
    token.Value.Should().Be("abc123");
}
```

### xUnit (recommended) vs NUnit vs MSTest

xUnit — most modern, parallelism by default, no `[SetUp]` / `[TearDown]` (use constructor / `IDisposable`).

### `[Theory]` для parametrized tests

```csharp
[Theory]
[InlineData("", false)]
[InlineData("a@b.c", true)]
[InlineData("invalid", false)]
public void IsValidEmail_VariousInputs_ReturnsExpected(string email, bool expected)
{
    Assert.Equal(expected, EmailValidator.IsValid(email));
}
```

### FluentAssertions для readability

```csharp
user.Name.Should().Be("Alice");
users.Should().HaveCount(3).And.OnlyContain(u => u.IsActive);
action.Should().Throw<InvalidOperationException>().WithMessage("*invalid state*");
```

### Mocking — Moq or NSubstitute

```csharp
// Moq
var mock = new Mock<IUserRepository>();
mock.Setup(r => r.FindAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

// NSubstitute (cleaner syntax)
var mock = Substitute.For<IUserRepository>();
mock.FindAsync(Arg.Any<Guid>()).Returns((User?)null);
```

Mock через interfaces / abstract classes — never patch concrete classes.

### Integration tests — `WebApplicationFactory<Program>`

```csharp
public class IntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    
    [Fact]
    public async Task Get_Users_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

### Testcontainers — real DBs in tests

```csharp
var container = new PostgreSqlBuilder()
    .WithDatabase("test")
    .Build();
await container.StartAsync();
```

Real DB > InMemoryProvider for high fidelity.

### Coverage

- ≥80% default.
- ≥95% security/integrity (auth, crypto, DB transaction logic).
- `dotnet test --collect:"XPlat Code Coverage"` → coverlet.

---

## 7. Cognitive Complexity (Campbell, SonarSource)

C#-specific structural increments:

| Construct | Inc |
|-----------|-----|
| `if` / `else if` / `else` | +1 + nesting |
| `switch` (statement) | +1 + nesting |
| `switch` expression (C# 8+) | depends on arm count; +1 per non-trivial pattern arm |
| `foreach` / `for` / `while` / `do` | +1 + nesting |
| `catch` (each) | +1 + nesting |
| `?:` ternary | +1 + nesting |
| Lambda | +1 + nesting |
| Pattern matching (`is X y when Z`) | +1 |
| Recursion | +1 |

Flat increments:

| Construct | Inc |
|-----------|-----|
| `goto` | +1 |
| Mixed `&&` / `||` chains | +1 per mixed sequence |

### Threshold (SonarQube)

| Score | Signal |
|-------|--------|
| 0–15 | Good |
| 16–25 | Review |
| 25+ | Refactor |

### Reduction tactics

1. **Early return** — flatten happy path:
   ```csharp
   // BAD
   public Result Process(User? user)
   {
       if (user is not null)
           if (user.IsActive)
               if (user.HasPermission)
                   return Save(user);
       return Result.Fail();
   }
   
   // GOOD
   public Result Process(User? user)
   {
       if (user is null) return Result.Fail("null user");
       if (!user.IsActive) return Result.Fail("inactive");
       if (!user.HasPermission) return Result.Fail("no permission");
       return Save(user);
   }
   ```
2. **Extract method** — encapsulate inner block.
3. **Pattern matching** для type-based dispatch:
   ```csharp
   // BAD
   if (shape is Circle c) area = c.Radius * c.Radius * Math.PI;
   else if (shape is Rectangle r) area = r.Width * r.Height;
   else if (shape is Triangle t) area = 0.5 * t.Base * t.Height;
   
   // GOOD — switch expression
   var area = shape switch
   {
       Circle c => c.Radius * c.Radius * Math.PI,
       Rectangle r => r.Width * r.Height,
       Triangle t => 0.5 * t.Base * t.Height,
       _ => throw new InvalidOperationException($"Unknown shape: {shape}"),
   };
   ```
4. **LINQ vs explicit loops** — usually clearer if chain короткий:
   ```csharp
   // BAD — explicit
   var activeEmails = new List<string>();
   foreach (var user in users)
       if (user.IsActive)
           activeEmails.Add(user.Email);
   
   // GOOD — LINQ (если flow simple)
   var activeEmails = users.Where(u => u.IsActive).Select(u => u.Email).ToList();
   ```

---

## 8. C#-specific anti-patterns

### `async void` (кроме event handlers)

```csharp
// BAD — exceptions crash process
public async void DoWork()
{
    await SomeAsync();  // throw — boom
}

// GOOD
public async Task DoWorkAsync() { ... }

// Acceptable for event handlers ONLY:
private async void Button_Click(object sender, EventArgs e)
{
    try { await DoWorkAsync(); } catch (Exception ex) { /* handle */ }
}
```

### `.Result` / `.Wait()` на async method

```csharp
// BAD — deadlock risk
var user = service.GetUserAsync(id).Result;

// GOOD
var user = await service.GetUserAsync(id);
```

### N+1 queries в EF Core

```csharp
// BAD — N+1
var orders = _db.Orders.ToList();  // 1 query
foreach (var order in orders)
{
    Console.WriteLine(order.Customer.Name);  // N queries (lazy load)
}

// GOOD — eager load
var orders = _db.Orders.Include(o => o.Customer).ToList();  // 1 query

// OR — projection
var data = _db.Orders.Select(o => new { o.Id, CustomerName = o.Customer.Name }).ToList();
```

### `IQueryable` leak through abstraction

```csharp
// BAD — DB query leaks к caller
public IQueryable<User> GetUsers() => _db.Users;

// GOOD — materialize (или take filter parameters)
public List<User> GetActiveUsers() => _db.Users.Where(u => u.IsActive).ToList();
```

Caller не должен знать «это IQueryable»; abstraction leakage.

### Mutable static fields

```csharp
// BAD — global mutable state
public static class Config
{
    public static int MaxRetries = 5;  // anyone can mutate
}

// GOOD — immutable + DI
public sealed record AppConfig
{
    public required int MaxRetries { get; init; }
}
```

### `Dictionary` / `List` exposed как public mutable collections

```csharp
// BAD
public Dictionary<string, int> Counts { get; set; }  // caller mutates!

// GOOD — IReadOnlyDictionary or readonly + private set
public IReadOnlyDictionary<string, int> Counts => _counts;
private readonly Dictionary<string, int> _counts = new();
```

### Capture variables в lambda incorrectly

```csharp
// BAD — captures by reference; all printed N (last value)
for (int i = 0; i < 10; i++)
{
    Task.Run(() => Console.WriteLine(i));
}

// GOOD — capture local copy
for (int i = 0; i < 10; i++)
{
    int local = i;
    Task.Run(() => Console.WriteLine(local));
}

// Modern fix (C# 7+): foreach уже capture's properly per iteration
```

### Boxing struct в interface call

```csharp
// BAD — struct boxed when used through interface (allocation per call)
IComparable<int> cmp = 5;

// GOOD — generic constraint (no boxing)
public T Max<T>(T a, T b) where T : IComparable<T>
{
    return a.CompareTo(b) > 0 ? a : b;
}
```

---

## 9. Apply в TDS C# workflow

В csharp SKILL.md Process Step 3 (Plan):

1. **Apply Karpathy 4** (general LLM coding hygiene).
2. **Apply Clean Code C#** (this file):
   - Naming first; suffix `Async` для async methods.
   - Method size ≤20 lines.
   - SRP per type; sealed by default.
   - Records для DTO; class для service.
   - Exceptions over null; constructor DI.
   - `ConfigureAwait(false)` в lib code.
   - Cognitive complexity ≤15 per method.
3. **Tooling check** в Step 5 Verify:
   - `dotnet build` — `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` — 0 warnings.
   - `dotnet format` — 0 violations.
   - `dotnet test --collect:"XPlat Code Coverage"` — ≥80% (≥95% critical).
   - Roslyn analyzers (FxCop / built-in) — 0 violations.
   - `<Nullable>enable</Nullable>` mandatory.

## Cross-tool: applies в Codex too

Эти principles — C#-specific. Apply equally в Codex CLI.

---

## References

- **Microsoft Framework Design Guidelines** (Cwalina & Abrams) — 3rd ed.
- **C# Coding Conventions** — https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions
- **Effective C#** (Bill Wagner) — 50 specific ways to improve C#.
- **C# in Depth** (Jon Skeet) — comprehensive language reference.
- **.NET API Design Guidelines** — https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/
- **Robert Martin, *Clean Code*** — adapted к C#.
- **Cognitive Complexity** — SonarSource white paper.
- **Async best practices** — https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/
