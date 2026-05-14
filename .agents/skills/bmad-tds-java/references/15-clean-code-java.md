# Java Clean Code Principles

> Adapted from Robert Martin's *Clean Code* (2008), Joshua Bloch's *Effective Java*
> (3rd ed., 2018), Brian Goetz's *Java Concurrency in Practice* (2006, principles still
> applicable + Project Loom additions), Oracle Code Conventions, и G. Ann Campbell's
> *Cognitive Complexity*.
>
> Применяется в каждом Java story (auto-loaded в Step 3 Plan).
> Для Kotlin (backend) — также см. отдельные Kotlin idioms (упомянуты в этом файле где applicable).
> Дополняет (не заменяет) Karpathy 4 принципа .

## Соотношение с Karpathy

| Karpathy | Clean Code (Java) |
|----------|--------------------|
| #1 Think Before Coding | Naming first; nullable annotations explicit (Optional / @Nullable) |
| #2 Simplicity First | Records over POJOs; virtual threads over reactive если applicable |
| #3 Surgical Changes | DRY; existing patterns; не fix unrelated checkstyle |
| #4 Goal-Driven Execution (TDD) | JUnit 5 + AssertJ; failing test first |

---

## 1. Meaningful Names — Java conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Class / Interface / Enum / Record | `PascalCase` | `UserService`, `OrderRepository` |
| Method / variable / parameter | `camelCase` | `findUser`, `connectionString` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Package | `lowercase.dotted` | `com.example.user.service` |
| Generic type param | Single uppercase: `T`, `E`, `K`, `V` или `TPascalCase`: `TElement` | `Map<K, V>`, `List<T>` |
| Boolean | `is*` / `has*` / `can*` / `should*` | `isActive`, `hasPermission` |
| Test method | `should_expected_when_scenario` или `methodName_scenario_expected` (per team style) | `shouldReturnUser_whenIdValid` |

**Anti-patterns:**

- Hungarian: `strName`, `iCount` — Java type system сильный, redundant.
- `m_` / `_` field prefixes — old C++ legacy; Java convention — plain `name`.
- `Manager`, `Helper`, `Util`, `Handler` без specifics — usually SRP violation. `UserManager` → `UserService` или `UserRepository` (more specific).
- Acronyms inconsistent: `xmlHttpRequest` vs `XMLHttpRequest` — pick one (Oracle: `xmlHttpRequest` since 1.5).
- Single-letter outside short scopes: `i`, `j` для loop indices OK; `x`, `y` outside math — анти-pattern.

---

## 2. Methods (Functions, Ch. 3)

### Size

- **≤20 lines** (excl. javadoc).
- ≤10 ideal.
- Section comments inside method = method does too much; split.

### Single responsibility

Method does ONE thing если cannot extract helper с meaningful name.

### Method arguments

- **0** ideal.
- **1** good.
- **2** acceptable.
- **3+** group в record / DTO.
- **Bool flags** — split:

```java
// BAD
public User createUser(String name, String email, boolean isAdmin, boolean sendWelcome) { }

// GOOD
public User createUser(UserCreationRequest request) { }
// OR
public User createUser(String name, String email) { }
public User createAdminUser(String name, String email) { }
```

### Records (Java 16+) для DTOs

```java
// BAD — POJO boilerplate
public class User {
    private final UUID id;
    private final String name;
    private final String email;
    
    public User(UUID id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    
    @Override
    public boolean equals(Object o) { /* ... */ }
    @Override
    public int hashCode() { /* ... */ }
    @Override
    public String toString() { /* ... */ }
}

// GOOD — record
public record User(UUID id, String name, String email) { }
```

Records — immutable; equality by component values; concise.

### Optional — для return values, NOT parameters

```java
// GOOD — return Optional если absence semantically valid
public Optional<User> findUser(UUID id) {
    return repository.findById(id);
}

// Caller:
var user = findUser(id).orElseThrow(() -> new UserNotFoundException(id));

// BAD — Optional как parameter
public void process(Optional<User> user) { }  // ❌

// GOOD — overload или nullable convention
public void process(User user) { }
public void process() { /* default */ }
```

`Optional` — сигнал absence. Don't pass через method parameters; don't store as field.

### Sealed types (Java 17+) для exhaustive matching

```java
public sealed interface Shape permits Circle, Rectangle, Triangle { }

public record Circle(double radius) implements Shape { }
public record Rectangle(double width, double height) implements Shape { }
public record Triangle(double base, double height) implements Shape { }

// Compiler enforces exhaustiveness
double area = switch (shape) {
    case Circle c -> Math.PI * c.radius() * c.radius();
    case Rectangle r -> r.width() * r.height();
    case Triangle t -> 0.5 * t.base() * t.height();
    // no default needed — compiler knows
};
```

### Pattern matching (Java 21+)

```java
public String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "positive int: " + i;
        case Integer i -> "non-positive int: " + i;
        case String s -> "string of length " + s.length();
        case null -> "null";
        default -> "other: " + obj.getClass().getSimpleName();
    };
}
```

### Side effects + Command-Query

`getUser()` returns без mutation. `saveUser()` returns void/throws.

### Throw exceptions, не error codes

```java
// BAD — null hides reason
public User parseUser(String json) {
    try { return mapper.readValue(json, User.class); }
    catch (Exception e) { return null; }
}

// GOOD — checked exception
public User parseUser(String json) throws UserParseException {
    try { return mapper.readValue(json, User.class); }
    catch (IOException e) { throw new UserParseException("malformed JSON", e); }
}
```

### Checked vs unchecked exceptions

- **Checked** (`extends Exception`): for recoverable conditions — caller MUST handle.
- **Unchecked** (`extends RuntimeException`): for programmer errors — bugs.

Modern Java trend: prefer unchecked для library APIs (less call-site noise). Use checked для truly recoverable cases (e.g., `IOException`).

### DRY

2+ occurrences → extract method.

---

## 3. Comments (Ch. 4)

Default: zero. Javadoc — yes for public API:

```java
/**
 * Fetches a user by ID.
 *
 * @param id The unique identifier of the user.
 * @return The user, or empty Optional if not found.
 * @throws DatabaseException If connection fails.
 */
public Optional<User> findUser(UUID id) throws DatabaseException {
    ...
}
```

Javadoc — required for public API в libraries (published artifacts).

**Never:**
- TODO без ticket reference.
- Commented-out code.
- Section comments внутри methods.
- Restating WHAT (`i++; // increment i`).

---

## 4. Types (Ch. 6, 10)

### Records vs Classes

| Use case | Choice |
|----------|--------|
| Immutable data carrier (DTO, event, message, value object) | `record` (Java 16+) |
| Reference identity (services, controllers) | `class` |
| Inheritance hierarchy | `class` (но prefer composition + interface) |
| Exhaustive type set | `sealed interface` + records (Java 17+) |

### Final by default

```java
// GOOD — final means no inheritance
public final class UserService { }

// Or even sealed if extension needs to be controlled:
public sealed class Shape permits Circle, Rectangle { }
```

`final` для local variables / parameters — controversial; community style varies. Microsoft / Bloch recommend final-by-default; Oracle Code Conventions don't enforce.

### Single Responsibility

`UserService` — one role. `UserAndAuthService` → split.

### Effective Java item 18: Favor composition over inheritance

```java
// BAD — inherits from concrete HashMap (fragile)
public class CountingHashMap<K, V> extends HashMap<K, V> {
    private int putCount = 0;
    @Override public V put(K key, V value) { putCount++; return super.put(key, value); }
}
// putAll() calls put() — counts each twice.

// GOOD — composition
public final class CountingMap<K, V> {
    private final Map<K, V> delegate;
    private int putCount = 0;
    
    public CountingMap(Map<K, V> delegate) { this.delegate = delegate; }
    
    public V put(K key, V value) {
        putCount++;
        return delegate.put(key, value);
    }
    // ... explicit delegation
}
```

### Effective Java item 17: Minimize mutability

Make classes immutable where possible:

1. Don't provide mutators.
2. Make class `final` (or all mutators final).
3. Make all fields `private final`.
4. No mutable references escape.

Records — automatic immutability (with caveat: components can themselves be mutable — defensive copies).

### Builder pattern для many-arg constructors

```java
// BAD
public UserPreferences(boolean a, boolean b, int c, int d, String e, String f, ... ) { }

// GOOD — builder
public final class UserPreferences {
    public static Builder builder() { return new Builder(); }
    
    public static final class Builder {
        private boolean a = false;
        // ... fields с defaults
        
        public Builder a(boolean value) { this.a = value; return this; }
        // ... fluent setters
        
        public UserPreferences build() { return new UserPreferences(this); }
    }
    
    private UserPreferences(Builder b) { /* copy fields */ }
}

// Usage
UserPreferences prefs = UserPreferences.builder()
    .a(true)
    .c(42)
    .build();
```

Lombok `@Builder` или manual implementation. Bloch's classic.

### Dependency Injection

Constructor injection — Spring + Hibernate idiomatic:

```java
// BAD — field injection
@Component
public class OrderService {
    @Autowired private OrderRepository repo;  // ❌ hidden, not testable
}

// GOOD — constructor injection (final, testable, immutable)
@Component
public final class OrderService {
    private final OrderRepository repo;
    
    public OrderService(OrderRepository repo) {  // @Autowired implicit на single ctor
        this.repo = repo;
    }
}
```

`@RequiredArgsConstructor` (Lombok) — auto-generates если все fields final.

---

## 5. Error Handling (Ch. 7)

### Exception hierarchy

```java
public abstract class AppException extends RuntimeException {
    protected AppException(String message) { super(message); }
    protected AppException(String message, Throwable cause) { super(message, cause); }
}

public final class UserNotFoundException extends AppException {
    private final UUID userId;
    
    public UserNotFoundException(UUID userId) {
        super("User not found: " + userId);
        this.userId = userId;
    }
    
    public UUID userId() { return userId; }
}
```

### Effective Java item 73: Throw exceptions appropriate to abstraction

Catch low-level, throw higher-level:

```java
// Repository layer — translates SQLException → DataAccessException
public User findUser(UUID id) {
    try {
        return jdbcTemplate.queryForObject("SELECT * FROM users WHERE id = ?", mapper, id);
    } catch (EmptyResultDataAccessException e) {
        throw new UserNotFoundException(id);
    } catch (DataAccessException e) {
        throw new UserRepositoryException("Failed to fetch user", e);
    }
}
```

### Never silent catches

```java
// BAD
try { save(); } catch (Exception ignored) { }  // ❌

// GOOD — at minimum log + re-throw
try {
    save();
} catch (DataAccessException e) {
    logger.error("Save failed for user {}", user.id(), e);
    throw e;
}
```

### Try-with-resources

```java
// BAD — resource leak risk
InputStream stream = new FileInputStream("data.txt");
try {
    process(stream);
} finally {
    stream.close();  // can throw, masking original exception
}

// GOOD — try-with-resources
try (InputStream stream = new FileInputStream("data.txt")) {
    process(stream);
}
```

Implements `AutoCloseable` (или `Closeable`).

### Don't catch `Throwable` или `Error`

`Error` (e.g., `OutOfMemoryError`) — JVM-fatal, не recover.

---

## 6. Concurrency (Java Concurrency in Practice — Brian Goetz)

### Virtual threads (Java 21+) для I/O-bound

```java
// Old: ExecutorService с pool
var executor = Executors.newFixedThreadPool(50);

// New: virtual threads — each task its own thread, scheduled by JVM
var executor = Executors.newVirtualThreadPerTaskExecutor();

// Or в Spring Boot 3.2+
spring.threads.virtual.enabled=true
```

Virtual threads — major shift 2024+. For I/O-bound code looks sync, scales like async.

### CompletableFuture (если composing futures)

```java
CompletableFuture<User> userFuture = userService.fetchAsync(id);
CompletableFuture<List<Order>> ordersFuture = orderService.fetchAllAsync(id);

CompletableFuture<UserSummary> summary = userFuture
    .thenCombine(ordersFuture, UserSummary::new)
    .exceptionally(ex -> {
        logger.error("Failed", ex);
        return UserSummary.empty();
    });
```

### Reactive (WebFlux + Reactor) — when needed

```java
public Mono<User> findUser(UUID id) {
    return userRepo.findById(id)
        .switchIfEmpty(Mono.error(new UserNotFoundException(id)));
}

public Flux<Order> findOrders(UUID userId) {
    return orderRepo.findByUserId(userId);
}
```

Reactive когда:
- Streaming / SSE / WebSocket.
- Tight backpressure required.
- Existing reactive codebase.

Иначе — virtual threads + servlet (simpler).

### Synchronization

`synchronized` блоки — minimal (только critical section). Don't synchronize public methods entire body.

```java
// BAD — synchronizes too much
public synchronized void process(User user) {
    validate(user);
    callExternalApi(user);  // network I/O blocks lock
    save(user);
}

// GOOD — synchronize only critical state mutation
public void process(User user) {
    validate(user);
    callExternalApi(user);
    synchronized (lock) {
        users.add(user);
    }
}
```

Prefer `java.util.concurrent` types (`ConcurrentHashMap`, `AtomicInteger`, `ReentrantLock`) over manual `synchronized`.

### Avoid shared mutable state

Effective Java: minimize mutability. Concurrency easier когда state immutable.

---

## 7. Tests (Ch. 9) — JUnit 5 + AssertJ + FIRST

### FIRST principles (same as iOS / C#)

### AAA + naming

```java
@Test
@DisplayName("login with valid credentials returns token")
void loginAsync_WithValidCredentials_ReturnsToken() {
    // Arrange
    AuthService mock = mock(AuthService.class);
    when(mock.authenticate(any(), any())).thenReturn("abc123");
    var service = new LoginService(mock);
    
    // Act
    var token = service.login("x@y.z", "secret");
    
    // Assert
    assertThat(token).isEqualTo("abc123");
}
```

### JUnit 5 (Jupiter) — preferred 2026

- `@Test`, `@ParameterizedTest`, `@RepeatedTest`.
- `@BeforeEach`, `@AfterEach`, `@BeforeAll`, `@AfterAll`.
- `@DisplayName` — readable test names.
- `@ExtendWith(MockitoExtension.class)` для Mockito integration.

### AssertJ (recommended) over Hamcrest

```java
// AssertJ — fluent, readable
assertThat(users)
    .hasSize(3)
    .extracting(User::name)
    .containsExactly("Alice", "Bob", "Charlie");

// Hamcrest (older)
assertThat(users, hasSize(3));
```

### Mocking — Mockito

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository repo;
    @InjectMocks OrderService service;
    
    @Test
    void shouldReturnOrder_whenIdValid() {
        when(repo.findById(any())).thenReturn(Optional.of(new Order(...)));
        
        var order = service.findOrder(UUID.randomUUID());
        
        assertThat(order).isNotNull();
        verify(repo, times(1)).findById(any());
    }
}
```

### Testcontainers — real DBs

```java
@Testcontainers
class IntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
    
    @Test
    void shouldPersistUser() { ... }
}
```

Real Postgres / MySQL > H2 in-memory (which deviates from production behavior).

### Spring Boot Test slices

- `@SpringBootTest` — full context, slow.
- `@WebMvcTest(MyController.class)` — web layer only.
- `@DataJpaTest` — JPA layer only (uses TestEntityManager + embedded DB).

Choose narrow slice; full `@SpringBootTest` only когда integration genuinely needed.

### Coverage

- ≥80% default. ≥95% security/integrity.
- Jacoco + ReportGenerator.

---

## 8. Cognitive Complexity (Campbell)

Java-specific structural increments:

| Construct | Inc |
|-----------|-----|
| `if` / `else if` / `else` | +1 + nesting |
| `switch` (statement) | +1 + nesting |
| `switch` expression (Java 14+) | +1 + per non-trivial pattern arm |
| `for` (any kind) / `while` / `do` | +1 + nesting |
| `catch` (each) | +1 + nesting |
| `?:` ternary | +1 + nesting |
| Lambda | +1 + nesting |
| Pattern (with `when` clause) | +1 |
| Recursion | +1 |

Flat increments:

| Construct | Inc |
|-----------|-----|
| `break` / `continue` to label | +1 |
| Mixed `&&` / `||` chains | +1 per mixed |

### Threshold

| Score | Signal |
|-------|--------|
| 0–15 | Good |
| 16–25 | Review |
| 25+ | Refactor |

### Reduction

1. **Early return** (guards):
   ```java
   public Result process(User user) {
       if (user == null) return Result.fail("null");
       if (!user.isActive()) return Result.fail("inactive");
       if (!user.hasPermission()) return Result.fail("no permission");
       return save(user);
   }
   ```
2. **Extract method** для inner block.
3. **Switch expression** для type-based dispatch:
   ```java
   double area = switch (shape) {
       case Circle c -> Math.PI * c.radius() * c.radius();
       case Rectangle r -> r.width() * r.height();
       default -> throw new IllegalArgumentException();
   };
   ```
4. **Streams** для collection transformations:
   ```java
   // BAD
   List<String> emails = new ArrayList<>();
   for (User u : users) {
       if (u.isActive()) emails.add(u.email());
   }
   
   // GOOD
   List<String> emails = users.stream()
       .filter(User::isActive)
       .map(User::email)
       .toList();
   ```

---

## 9. Java-specific anti-patterns

### N+1 queries (JPA/Hibernate)

```java
// BAD — N+1
List<Order> orders = entityManager.createQuery("SELECT o FROM Order o", Order.class).getResultList();
for (Order o : orders) {
    System.out.println(o.getCustomer().getName());  // each triggers SELECT
}

// GOOD — eager load
@EntityGraph(attributePaths = "customer")
List<Order> findAll();

// OR — JPQL JOIN FETCH
List<Order> orders = em.createQuery(
    "SELECT o FROM Order o JOIN FETCH o.customer", Order.class).getResultList();
```

### `@Transactional` on private method

```java
// BAD — Spring proxies don't intercept private methods
private @Transactional void doWork() { }  // ❌ no tx

// GOOD — public method
public @Transactional void doWork() { }
```

### Returning `null` from public collection-returning methods

```java
// BAD
public List<User> getUsers() { return null; }  // caller NPE risk

// GOOD
public List<User> getUsers() { return List.of(); }  // empty list
```

Effective Java item 54.

### `equals` / `hashCode` inconsistent

If you override `equals`, override `hashCode` (and vice versa). Records auto-generate; manual classes — need IDE generation or `Objects.equals`/`Objects.hash`.

### Mutable static fields

```java
// BAD — shared mutable state across threads
public static int counter = 0;

// GOOD — immutable or AtomicInteger
public static final int MAX_VALUE = 100;
public static final AtomicInteger COUNTER = new AtomicInteger(0);
```

### `String` concatenation в loop

```java
// BAD — O(n²) — String immutable
String s = "";
for (String word : words) {
    s += word;  // creates new String each iteration
}

// GOOD — StringBuilder (если performance matters)
StringBuilder sb = new StringBuilder();
for (String word : words) {
    sb.append(word);
}
String result = sb.toString();

// OR — String.join (если delimiter applicable)
String result = String.join(",", words);
```

### `synchronized(this)`

```java
// BAD — clients can lock too
public synchronized void method() { }

// GOOD — private lock
private final Object lock = new Object();
public void method() {
    synchronized (lock) { ... }
}
```

Or `ReentrantLock`.

### Boxing autoboxing в hot path

```java
// BAD — autoboxing creates Long allocation per iteration
Long sum = 0L;
for (long i = 0; i < 1_000_000; i++) {
    sum += i;  // unboxing + boxing
}

// GOOD
long sum = 0L;  // primitive
```

---

## 10. Apply в TDS Java workflow

В java SKILL.md Process Step 3 (Plan):

1. **Apply Karpathy 4** (general LLM coding hygiene).
2. **Apply Clean Code Java** (this file):
   - Naming first; PascalCase / camelCase / UPPER_SNAKE per element type.
   - Method size ≤20 lines.
   - SRP per class.
   - Records для DTO; final / sealed for immutability.
   - Constructor DI; no field injection.
   - Try-with-resources.
   - Cognitive complexity ≤15.
3. **Tooling check** в Step 5 Verify:
   - `./gradlew build` (или `mvn verify`) — 0 warnings.
   - Spotless / Checkstyle — clean.
   - Jacoco coverage — ≥80% (≥95% critical).
   - SpotBugs или PMD — 0 violations.

## Cross-tool: applies в Codex too

Эти principles — Java-specific. Apply equally в Codex CLI.

---

## References

- **Effective Java** (Joshua Bloch) — 3rd ed., 2018.
- **Java Concurrency in Practice** (Brian Goetz) — 2006 (principles still apply).
- **Java Language Specification** — https://docs.oracle.com/javase/specs/
- **Oracle Code Conventions** — https://www.oracle.com/java/technologies/javase/codeconventions-introduction.html
- **Robert Martin, *Clean Code*** — adapted к Java.
- **Kotlin Coding Conventions** (если Kotlin) — https://kotlinlang.org/docs/coding-conventions.html
- **Effective Kotlin** (Marcin Moskała) — для Kotlin-backend.
- **Cognitive Complexity** — SonarSource white paper.
- **Spring Framework reference** — https://docs.spring.io/spring-framework/reference/
