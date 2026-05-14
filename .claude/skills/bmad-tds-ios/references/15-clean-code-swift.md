# Swift Clean Code Principles

> Adapted from Robert Martin's *Clean Code* (2008) and G. Ann Campbell's *Cognitive Complexity*
> для Swift / iOS. Source: [levabond/iOS-clean-code-skills](https://github.com/levabond/iOS-clean-code-skills) (MIT).
>
> Применяется в каждом iOS story (auto-loaded в Step 3 Plan если applicable).
> Дополняет (не заменяет) Karpathy 4 принципа .

## Соотношение с Karpathy

| Karpathy | Clean Code (Swift) |
|----------|--------------------|
| #1 Think Before Coding | Naming first — choose name BEFORE writing body |
| #2 Simplicity First | Small functions (≤20 lines), single responsibility |
| #3 Surgical Changes | DRY — extract repeated blocks; don't refactor unrelated |
| #4 Goal-Driven Execution (TDD) | FIRST principles for tests + AAA pattern |

Karpathy — про LLM coding pitfalls (general). Clean Code — про code quality patterns (Swift-specific).

---

## 1. Meaningful Names (Ch. 2)

**Choose intention-revealing names.**

- ✅ `elapsedDays`, `loginAttemptsRemaining`, `isUserVerified`
- ❌ `d`, `n`, `flag`, `data`, `info`, `temp`

**Conventions:**

| Element | Style |
|---------|-------|
| Types (class/struct/enum/protocol) | `PascalCase` |
| Values, functions, methods | `camelCase` |
| Booleans | `is*` / `has*` / `can*` / `should*` |
| Constants | `camelCase` (Swift idiom; not SCREAMING_SNAKE) |
| Generic params | Single uppercase или descriptive: `T`, `Element`, `Output` |
| Private internals | `_camelCase` if shadowing, иначе plain |

**Anti-patterns:**
- Hungarian notation (`strName`, `iCount`).
- Abbreviations except universally known (`URL`, `ID`, `JSON` — OK; `usr`, `cnt`, `mgr` — not).
- Noise words: `info`, `data`, `manager`, `processor` без specifics. Prefix `User` is OK; `UserData` adds nothing.
- Misleading: `isActiveAccount` returning Optional<Bool> — name implies boolean, type lies.

**Karpathy #1 application:** if you cannot name the function/type cleanly, the design is wrong — refactor before continuing.

## 2. Functions (Ch. 3)

### Size

- **≤20 lines** (target ≤10).
- If function needs comment to explain a block — that block is a new function.
- Each `if` / `guard` / `for` body should ideally be a single function call.

### Single responsibility

A function does one thing if you cannot extract another function from it with a name that's not a restatement of its implementation.

Section comments inside a function (e.g., `// MARK: - Setup`, `// Then validate`) = it does more than one thing. Extract.

### One level of abstraction

All statements at SAME level. Don't mix high-level orchestration with low-level detail.

```swift
// BAD — mixing levels
func submitOrder() {
    let json = try? JSONEncoder().encode(order)  // low-level
    coordinator.navigateToConfirmation()          // high-level
}

// GOOD — orchestrator only
func submitOrder() {
    let payload = encodeOrder()
    sendToAPI(payload)
    navigateToConfirmation()
}
```

### Arguments

- **0** — niladic — ideal.
- **1** — monadic — good.
- **2** — dyadic — acceptable; document order.
- **3+** — group into struct.
- **Bool flag** — never. Split into two functions.

```swift
// BAD
func saveUser(_ user: User, validate: Bool, sync: Bool) { }

// GOOD — one function per behavior
func saveUser(_ user: User) throws { }
func saveAndValidateUser(_ user: User) throws { }
func saveAndSyncUser(_ user: User) async throws { }
```

### No side effects

A function named `getUser()` must NOT save to database, mutate global state, or send analytics.

If side effect needed — name reveals it: `fetchAndCacheUser()`, `loadAndValidateConfig()`.

### Command–Query separation

Function either **does** something (command) или **answers** something (query) — never both.

- `isValid()` returns Bool без mutation.
- `save()` saves and returns Void (or throws).

### Prefer `throws` to `nil`

```swift
// BAD — nil hides reason
func parseConfig(from data: Data) -> Config? { ... }

// GOOD — explicit error
func parseConfig(from data: Data) throws -> Config { ... }

enum ConfigError: Error {
    case malformedJSON(line: Int)
    case missingRequiredField(name: String)
    case unsupportedVersion(found: String, expected: String)
}
```

### DRY

Code block appearing 2+ times → extract. Parameterize what differs; name what stays.

### Trailing closures + clarity

- Use trailing closure ONLY когда closure is last argument AND purpose clear.
- Name closure parameters when type ambiguous: `completion: (Result<User, Error>) -> Void`.
- Deeply nested closures — extract each level into named function or use `async/await`.

### `guard` for early exit

Never `if let x = x { ... }` для happy path. Use `guard let`:

```swift
// BAD — nested
func loadProfile(id: String?) {
    if let id = id {
        if let user = userCache[id] {
            display(user)
        }
    }
}

// GOOD — flat happy path
func loadProfile(id: String?) {
    guard let id = id else { return }
    guard let user = userCache[id] else { return }
    display(user)
}
```

## 3. Comments (Ch. 4)

**Default: zero comments.**

- Code should explain itself через naming + structure.
- Comments lie over time as code changes.

**When to comment:**

1. **WHY non-obvious** — workaround / hidden constraint / unusual invariant.
   ```swift
   // Apple's URLSession doesn't honor `httpAdditionalHeaders` for HTTP/2;
   // we set headers per-request to ensure delivery.
   ```
2. **External requirement** — link to ticket / RFC / doc.
3. **Performance optimization** — why non-obvious code (e.g., manual loop instead of map).

**Never comment WHAT code does:**

```swift
// BAD: comment-as-name-substitute
// Increments the counter by 1
counter += 1

// GOOD: rename if needed; otherwise no comment
counter += 1
```

**Never:**
- Commented-out code (delete; git remembers).
- Section comments inside functions (= function does too much).
- TODO comments without ticket reference.

## 4. Types (Ch. 6, 10)

### Prefer `struct` (value types)

Default: `struct`. Use `class` only for:
- Reference identity required (Equatable by reference).
- Shared mutable state across multiple owners.
- Inheritance hierarchy required (rare — prefer composition).
- ObjC interop / framework requires class.

### Single Responsibility Principle (SRP)

Each type owns ONE concept. If type description requires «and» — split.

- `UserService` — manages user CRUD. ✓
- `UserAndAuthService` — split into `UserService` + `AuthService`. ✗
- `NetworkAndCacheManager` — split. ✗

### Cohesion

Methods на type should mostly use type's stored properties. Если method ignores all properties — it doesn't belong here.

### Dependency Injection

- Inject dependencies via `init`.
- Avoid `.shared`, `.default`, `.main` singletons in domain logic.
- Define protocols for seams; production impl + test mock.

```swift
// BAD — hidden dependency
class LoginViewModel {
    func login() {
        UserService.shared.authenticate()  // не testable, не replaceable
    }
}

// GOOD — explicit dependency
protocol UserServiceProtocol {
    func authenticate() async throws -> Token
}

class LoginViewModel {
    private let userService: UserServiceProtocol
    init(userService: UserServiceProtocol) {
        self.userService = userService
    }
    func login() async throws -> Token {
        try await userService.authenticate()
    }
}
```

### Open/Closed Principle

Open for extension, closed for modification. Use protocols + extensions:

```swift
protocol PaymentMethod {
    func charge(_ amount: Decimal) async throws
}

// New payment method = new conformance, не modification existing code
struct ApplePayMethod: PaymentMethod { ... }
struct StripeMethod: PaymentMethod { ... }
```

## 5. Error Handling (Ch. 7)

### Throws over nil

Functions that fail on external input always `throw`; never return `nil` to signal errors.

### Named errors

```swift
enum UserError: Error {
    case notFound(id: String)
    case unauthorized
    case rateLimited(retryAfter: TimeInterval)
}
```

Provide associated values для context. `case unknown(reason: String)` better than naked `case unknown`.

### Never silent catches

```swift
// BAD — error vanishes
do {
    try save()
} catch {
}

// GOOD — at minimum log
do {
    try save()
} catch {
    logger.error("save() failed: \(error)")
    throw error  // or handle specifically
}
```

### Force unwrap (`!`) only for invariants

Force unwrap acceptable когда:
- Compiler-impossible nil (e.g., literal `URL(string: "https://example.com")!`).
- Programmer-asserted invariant с loud failure: `array.first!` after explicit check.

Never:
- On values from external input (API, user, file system).
- On values that might legitimately be nil (use `if let` / `guard let`).

## 6. Tests (Ch. 9) — FIRST principles

| Letter | Principle | Means |
|--------|-----------|-------|
| **F** | Fast | Unit test ≤ 0.1s. Integration ≤ 1s. Slow tests run separately. |
| **I** | Independent | Test order doesn't matter. No shared state. Each test self-contained. |
| **R** | Repeatable | Same result every run. No randomness, no time-dependence (use clock injection). |
| **S** | Self-validating | Pass / fail boolean. NO «check the log to see». |
| **T** | Timely | Written close to (или before) the production code. TDD ideal. |

### AAA pattern

```swift
@Test
func login_withValidCredentials_returnsToken() async throws {
    // Arrange
    let mockService = MockUserService(returnToken: "abc123")
    let viewModel = LoginViewModel(userService: mockService)
    
    // Act
    let token = try await viewModel.login(email: "x@y.z", password: "secret")
    
    // Assert
    #expect(token == "abc123")
}
```

### Test naming

Format: `methodName_scenario_expectedBehavior` или `should_expected_when_scenario`.

- `login_withValidCredentials_returnsToken` ✓
- `should_returnToken_when_credentialsValid` ✓
- `testLogin1` ✗ (no info)
- `testEverything` ✗ (test too broad — split)

### Mocking

Mock через protocol conformance. Don't subclass production types.

```swift
class MockUserService: UserServiceProtocol {
    var loginCallCount = 0
    var stubbedToken = "test-token"
    func authenticate() async throws -> Token {
        loginCallCount += 1
        return stubbedToken
    }
}
```

## 7. Cognitive Complexity (G. Ann Campbell)

Cognitive complexity measures **mental effort to understand code** — не path count.

### Scoring rules

**Structural increments (+1 each, + nesting penalty):**

| Construct | Inc |
|-----------|-----|
| `if` / `else if` / `else` | +1 + nesting |
| `guard ... else` | +1 + nesting |
| `switch` | +1 + nesting |
| `for` / `while` / `repeat...while` | +1 + nesting |
| `catch` | +1 + nesting |
| Ternary `? :` | +1 + nesting |
| Nested closure | +1 + nesting |
| Recursive call | +1 |

**Flat increments (+1, no nesting penalty):**

| Construct | Inc |
|-----------|-----|
| `break` / `continue` к label | +1 |
| Mixed logical operators sequence | +1 per mixed sequence |

### Thresholds (SonarQube defaults)

| Score | Signal |
|-------|--------|
| 0–15 | Good |
| 16–25 | Review candidate |
| 25+ | Refactor (split into smaller functions) |

### Reduction tactics

1. **Early return / guard** — flatten happy path.
2. **Extract function** — encapsulate inner block.
3. **Replace nested ternary** с function or switch.
4. **Polymorphism** — switch на type → protocol method.
5. **Lookup table / dictionary** — replace if-chain.
6. **Combine sequential conditions** — single guard with multiple conditions.

```swift
// BAD — cognitive complexity 8
func process(_ user: User?) {
    if let user = user {
        if user.isActive {
            if user.hasPermission(.write) {
                if user.subscription != nil {
                    save(user)
                }
            }
        }
    }
}

// GOOD — cognitive complexity 4
func process(_ user: User?) {
    guard let user = user else { return }
    guard user.isActive else { return }
    guard user.hasPermission(.write) else { return }
    guard user.subscription != nil else { return }
    save(user)
}
```

## 8. Swift-specific (additional)

### File organization

```swift
// MARK: - Properties
// MARK: - Lifecycle
// MARK: - Public
// MARK: - Private
```

One MARK section per concern. Если single section grows huge — extract type.

### Extensions for protocol conformance

```swift
// MARK: - Equatable
extension User: Equatable {
    static func == (lhs: User, rhs: User) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - CustomStringConvertible
extension User: CustomStringConvertible {
    var description: String { "User(\(id))" }
}
```

One extension per protocol; `// MARK: - <ProtocolName>` heading.

### `async/await` over callbacks

For new code. Bridge legacy callbacks через `withCheckedContinuation`:

```swift
func fetchUser(id: String) async throws -> User {
    try await withCheckedThrowingContinuation { continuation in
        legacy.fetchUser(id: id) { result in
            switch result {
            case .success(let user): continuation.resume(returning: user)
            case .failure(let error): continuation.resume(throwing: error)
            }
        }
    }
}
```

### Avoid `Any` / `AnyObject`

Type erasure пuhlcfly justified (e.g., heterogeneous collection). Otherwise — use generics / protocol with associated type / sum type.

### Prefer composition over inheritance

Class inheritance hierarchies in Swift — anti-pattern в most cases. Use:
- Struct + protocol conformance.
- Class composition (one class holds another via property).
- Generic constraints.

## Apply this in TDS iOS workflow

В iOS SKILL.md Process Step 3 (Plan):

1. **Apply Karpathy 4** (general LLM coding hygiene).
2. **Apply Clean Code Swift** (this file) — specifically:
   - Naming first (#1).
   - Function size ≤20 lines (#2).
   - SRP for new types (#4).
   - `throws` over `nil` (#5).
   - Cognitive complexity check на critical paths.

В Step 4 (Execute):
- Each Edit/Write — function-by-function check.
- Если any rule violated — fix BEFORE moving to next.

В Step 5 (Verify):
- SwiftLint catches some (e.g., function_length 40, type_body_length).
- Manual spot-check для cognitive complexity на complex functions.

## Cross-tool: applies в Codex too

Эти principles — Swift-specific, не Anthropic-specific. Apply equally в Codex CLI sessions.

## TDS-specific reminders

- **Integrity record per file-write** — independent of clean-code rules. Always done in Step 4.
- **Lessons applied** (memory query Step 2) — может contain Swift-specific lesson contradicting Clean Code (rare; flag для retro lesson update).
- **Auditor will flag violations** в `bmad-tds-code-review` Mode 1 / Mode 2. Anticipate findings — fix before promote.
