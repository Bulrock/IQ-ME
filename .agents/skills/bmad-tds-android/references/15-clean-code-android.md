# Android (Kotlin) Clean Code Principles

> Adapted from Robert Martin's *Clean Code* (2008), Marcin Moskała's *Effective Kotlin*
> (2nd ed., 2024), Jetbrains' Kotlin Coding Conventions, Google's Android Architecture
> Guidelines, и G. Ann Campbell's *Cognitive Complexity*.
>
> Применяется в каждом Android story (auto-loaded в Step 3 Plan).
> Дополняет (не заменяет) Karpathy 4 принципа .

## Соотношение с Karpathy

| Karpathy | Clean Code (Android/Kotlin) |
|----------|------------------------------|
| #1 Think Before Coding | Naming first; null safety explicit (no `!!` без reasoning) |
| #2 Simplicity First | StateFlow + sealed class > MVI; DataStore > SharedPreferences |
| #3 Surgical Changes | DRY; no «improve adjacent ViewModel» |
| #4 Goal-Driven Execution (TDD) | JUnit + runTest + Compose UI Testing; failing test first |

---

## 1. Meaningful Names — Kotlin conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Class / Interface / Enum / Object | `PascalCase` | `UserRepository`, `OrderStatus` |
| Function / property / parameter | `camelCase` | `fetchUser`, `userId`, `isLoading` |
| Constant (top-level / companion) | `UPPER_SNAKE_CASE` | `const val MAX_RETRIES = 5` |
| Package | `lowercase.dotted` | `com.example.user.di` |
| Composable function | `PascalCase` (per Compose convention!) | `LoginScreen`, `UserCard` |
| Generic param | `T`, `R`, `E` или descriptive: `TItem` | `List<T>`, `Map<K, V>` |
| Boolean | `is*` / `has*` / `can*` / `should*` | `isActive`, `hasPermission` |
| Coroutine scope | `<context>Scope` | `viewModelScope`, `lifecycleScope` |
| Test method | `should ... when ...` (backticks для readability) | ``fun `should return token when credentials valid`() = runTest { ... }`` |

**Anti-patterns:**

- Hungarian: `mUserName` (старый Android 1.0 convention) — modern Kotlin: drop `m`/`s` prefixes.
- Java getters/setters в Kotlin: `getName()` → property `name`.
- `Manager`, `Helper`, `Util` без specifics — usually SRP violation.
- Composables в camelCase: `loginScreen()` ❌; `LoginScreen()` ✅ (Jetpack Compose convention).
- `Activity` / `Fragment` суффикс с conventional name OK (`MainActivity`, `LoginFragment`).

---

## 2. Functions (Ch. 3)

### Size

- **≤20 lines** target.
- ≤10 ideal.
- Composable functions ≤100 lines (UI tree complex); split into sub-composables.

### Single responsibility

```kotlin
// BAD — does too much
fun loadUserAndRefreshUiAndShowToast() { }

// GOOD — separate
suspend fun loadUser(id: String): User
fun refreshUi(user: User)
fun showWelcomeToast(user: User)
```

### Function arguments

- **0** ideal.
- **1** good.
- **2** acceptable.
- **3+** group в data class.
- **Bool flags** — split.

```kotlin
// BAD
fun createUser(name: String, email: String, isAdmin: Boolean, sendWelcome: Boolean) { }

// GOOD — data class
data class UserCreationRequest(
    val name: String,
    val email: String,
    val role: UserRole,
    val notification: NotificationPreference,
)

fun createUser(request: UserCreationRequest) { }
```

### Default + named parameters (Kotlin advantage)

```kotlin
// Prefer named + defaults вместо overloading:
fun createUser(
    name: String,
    email: String,
    age: Int = 18,
    role: UserRole = UserRole.User,
) { ... }

// Caller может skip defaults:
createUser(name = "Alice", email = "a@b.c")
createUser(name = "Bob", email = "x@y.z", role = UserRole.Admin)
```

### Null safety — explicit

```kotlin
// BAD — `!!` без reasoning
fun process(user: User?) {
    val name = user!!.name  // ❌ NullPointerException risk
}

// GOOD — explicit null handling
fun process(user: User?) {
    val name = user?.name ?: "Unknown"
    // OR:
    user ?: error("User must not be null")
    // OR:
    requireNotNull(user) { "User required" }
}
```

`!!` acceptable только когда invariant explicitly held (e.g., after `requireNotNull` / null check).

### Scope functions — choose deliberately

| Function | Returns | Use case |
|----------|---------|----------|
| `let` | result of block | Null-safe transformation `user?.let { it.name }` |
| `apply` | receiver | Configure object: `User().apply { name = "Alice" }` |
| `run` | result of block | Multi-statement expression on object: `user.run { "$name has $age" }` |
| `with` | result of block | Same as `run`, но non-extension: `with(user) { "$name has $age" }` |
| `also` | receiver | Side effect: `user.also { logger.log(it) }` |

Don't chain too many — readability suffers. Karpathy #2 — sometimes plain code is clearer.

### Coroutines

```kotlin
// BAD — GlobalScope (anti-pattern)
GlobalScope.launch {
    fetchUser()
}

// BAD — runBlocking в Android (ANR risk)
runBlocking { fetchUser() }

// GOOD — scoped к ViewModel
viewModelScope.launch {
    val user = fetchUser()
    _uiState.update { it.copy(user = user) }
}
```

`viewModelScope` (auto-cancelled на ViewModel cleared), `lifecycleScope` (auto-cancelled на lifecycle destroyed).

### Suspend functions

```kotlin
// BAD — нет structured concurrency
suspend fun loadAll(): Pair<User, List<Order>> {
    val user = fetchUser()
    val orders = fetchOrders()  // sequential
    return user to orders
}

// GOOD — concurrent
suspend fun loadAll(): Pair<User, List<Order>> = coroutineScope {
    val userDeferred = async { fetchUser() }
    val ordersDeferred = async { fetchOrders() }
    userDeferred.await() to ordersDeferred.await()
}
```

`coroutineScope` — structured concurrency: failure of any child cancels all.

### Flow vs LiveData

```kotlin
// BAD — LiveData в new code (старый AAC pattern)
private val _user = MutableLiveData<User>()
val user: LiveData<User> = _user

// GOOD — StateFlow (Compose-native, structured concurrency)
private val _uiState = MutableStateFlow(UiState.Idle)
val uiState: StateFlow<UiState> = _uiState.asStateFlow()
```

В Compose: `collectAsStateWithLifecycle()` (lifecycle-aware), не `collectAsState()`.

### `withContext` для switching dispatchers

```kotlin
suspend fun saveUser(user: User) {
    withContext(Dispatchers.IO) {
        // file/db/network I/O — runs on IO dispatcher
        repository.save(user)
    }
}
```

Don't call blocking I/O on Main dispatcher (ANR risk).

### DRY

2+ occurrences → extract function / extension function.

---

## 3. Comments (Ch. 4)

Default: zero. KDoc для public API:

```kotlin
/**
 * Fetches a user by ID.
 *
 * @param id The unique identifier of the user.
 * @return The user, or `null` if not found.
 * @throws NetworkException If the network request fails.
 */
suspend fun fetchUser(id: String): User?
```

**Never:**
- Commented-out code.
- TODO без ticket reference.
- Section comments inside functions.

---

## 4. Types (Ch. 6, 10)

### Data classes для DTOs / values

```kotlin
data class User(
    val id: UUID,
    val name: String,
    val email: String,
)

// Auto-generated: equals, hashCode, toString, copy, componentN
```

### Sealed classes / interfaces для exhaustive matching

```kotlin
sealed interface LoginState {
    data object Idle : LoginState
    data object Loading : LoginState
    data class Success(val token: String) : LoginState
    data class Error(val message: String) : LoginState
}

// Exhaustive when:
when (state) {
    LoginState.Idle -> { /* ... */ }
    LoginState.Loading -> { /* ... */ }
    is LoginState.Success -> showSuccess(state.token)
    is LoginState.Error -> showError(state.message)
    // no else needed — compiler enforces exhaustiveness
}
```

### `data object` (Kotlin 1.9+)

```kotlin
sealed interface UiState {
    data object Idle : UiState  // singleton с auto toString "Idle"
    data object Loading : UiState
    data class Success(val user: User) : UiState
}
```

### `value class` (inline classes) для type-safe wrappers

```kotlin
@JvmInline
value class UserId(val value: String)
@JvmInline
value class Email(val value: String)

fun fetchUser(id: UserId): User?  // type system prevents passing Email instead

// At runtime: zero overhead (boxing only when type-erased)
```

### Single Responsibility

`UserService` — one role. `UserAndAuthService` — split.

### Composition over inheritance

Kotlin discourages deep inheritance. Use:
- Interfaces для contracts.
- Composition (delegate properties / class delegation).
- Sealed hierarchies для closed type sets.

```kotlin
// Class delegation
class UserRepository(
    private val cache: Cache by Cache.Default,  // delegate property
) {
    // Methods can delegate к cache when needed
}
```

### Final by default

Kotlin: classes `final` по умолчанию (нужно `open` для extension). Effective Kotlin Item 36: prefer `final` (Bloch's wisdom).

### Dependency Injection (Hilt — recommended Android 2026)

```kotlin
// BAD — ManualDependency
class LoginViewModel : ViewModel() {
    private val auth = AuthService.getInstance()  // ❌ static singleton
}

// GOOD — Hilt @Inject
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val auth: AuthService,
    private val tokenStore: SecureTokenStore,
) : ViewModel()
```

Constructor injection — Kotlin convention; final fields = test-friendly.

---

## 5. Error Handling (Ch. 7)

### Result type для recoverable errors

```kotlin
sealed interface UserResult {
    data class Success(val user: User) : UserResult
    data class Error(val cause: Throwable) : UserResult
    data object NotFound : UserResult
}

suspend fun fetchUser(id: String): UserResult = runCatching {
    repository.findById(id)
}.fold(
    onSuccess = { user ->
        if (user != null) UserResult.Success(user)
        else UserResult.NotFound
    },
    onFailure = { e -> UserResult.Error(e) }
)
```

`runCatching` — Kotlin built-in для exception → `Result<T>` conversion.

### Throw exceptions для programmer errors / unrecoverable

```kotlin
fun divide(a: Int, b: Int): Int {
    require(b != 0) { "Cannot divide by zero" }  // IllegalArgumentException
    return a / b
}

fun process(user: User?) {
    requireNotNull(user) { "User required" }  // throws if null
    check(user.isActive) { "User must be active" }  // IllegalStateException
    // ...
}
```

`require` (input validation), `check` (state validation), `error` (unreachable code).

### Coroutine exceptions

```kotlin
viewModelScope.launch {
    try {
        val user = fetchUser()
        _uiState.update { Success(user) }
    } catch (e: CancellationException) {
        throw e  // ALWAYS re-throw CancellationException
    } catch (e: Exception) {
        _uiState.update { Error(e.message ?: "Unknown") }
    }
}
```

Never silently catch `CancellationException` — coroutines rely on it for cancellation.

### Never silent catches (general)

```kotlin
// BAD
try { save() } catch (e: Exception) { }  // ❌

// GOOD — at minimum log
try {
    save()
} catch (e: SQLException) {
    Log.e(TAG, "Save failed", e)
    throw e
}
```

---

## 6. Compose UI (Modern Android 2026)

### State hoisting

```kotlin
// BAD — state inside leaf component (not reusable, hard to test)
@Composable
fun LoginButton() {
    var isLoading by remember { mutableStateOf(false) }
    Button(onClick = { isLoading = true; ... }) {
        Text(if (isLoading) "Loading" else "Login")
    }
}

// GOOD — state hoisted to caller
@Composable
fun LoginButton(
    isLoading: Boolean,
    onClick: () -> Unit,
) {
    Button(onClick = onClick) {
        Text(if (isLoading) "Loading" else "Login")
    }
}
// Caller manages state.
```

### `rememberSaveable` для process-death survival

```kotlin
@Composable
fun LoginScreen() {
    var email by rememberSaveable { mutableStateOf("") }  // survives config change + process death
    var password by remember { mutableStateOf("") }       // survives only config change
    // password might be intentional security choice — don't persist plaintext
}
```

### `LaunchedEffect` для side effects

```kotlin
@Composable
fun UserScreen(userId: String) {
    var user by remember { mutableStateOf<User?>(null) }
    
    LaunchedEffect(userId) {  // re-launches только если userId меняется
        user = fetchUser(userId)
    }
    
    UserDisplay(user)
}
```

`LaunchedEffect(Unit)` — fires once on composition.
`LaunchedEffect(key)` — re-fires when key changes.

### Anti-patterns в Compose

- `MutableState` exposed из ViewModel:
  ```kotlin
  // BAD
  class ViewModel { val state = mutableStateOf(...) }  // mutable from outside
  
  // GOOD
  class ViewModel {
      private val _state = mutableStateOf(...)
      val state: State<...> = _state  // immutable view
  }
  // OR: use StateFlow
  ```
- `remember { ... }` без `key`:
  ```kotlin
  // BAD — captured value never updated
  val expensive = remember { calculate(input) }  // input changes, calc stays old
  
  // GOOD
  val expensive = remember(input) { calculate(input) }
  ```
- Recomposing parent re-creates lambdas каждый раз:
  ```kotlin
  // Considering memoization carefully:
  Button(onClick = { handleClick(id) }) { Text("...") }  // new lambda each render
  ```
  Modern Compose compiler handles this for stable types — manual `remember { { ... } }` rarely needed.

---

## 7. Tests (Ch. 9) — JUnit + runTest + Compose UI Testing

### FIRST principles (same).

### AAA + naming

```kotlin
class LoginViewModelTest {
    @Test
    fun `should return token when credentials valid`() = runTest {
        // Arrange
        val mockAuth = mockk<AuthService>()
        coEvery { mockAuth.authenticate(any(), any()) } returns "abc123"
        val viewModel = LoginViewModel(mockAuth, mockTokenStore)
        
        // Act
        viewModel.login("x@y.z", "secret")
        
        // Assert
        assertThat(viewModel.uiState.value).isEqualTo(LoginState.Success("abc123"))
    }
}
```

Backticks для multi-word test names — readable.

### `runTest` (kotlinx-coroutines-test)

```kotlin
@Test
fun `should emit loading then success`() = runTest {
    val viewModel = LoginViewModel(...)
    
    viewModel.uiState.test {  // turbine library
        assertThat(awaitItem()).isEqualTo(LoginState.Idle)
        viewModel.login("x", "y")
        assertThat(awaitItem()).isEqualTo(LoginState.Loading)
        assertThat(awaitItem()).isInstanceOf(LoginState.Success::class.java)
    }
}
```

`runTest` — virtual time, controllable scheduler, deterministic.

### Mocking — mockk (Kotlin-friendly)

```kotlin
// mockk supports suspending functions, final classes, top-level functions
val service = mockk<UserService>()
coEvery { service.fetchUser(any()) } returns User(...)
verify(exactly = 1) { service.fetchUser("id") }
```

Mockito works too но mockk более Kotlin-idiomatic.

### Compose UI Testing

```kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun `login screen shows email field`() {
    composeRule.setContent {
        LoginScreen(state = LoginState.Idle, onLogin = {})
    }
    
    composeRule.onNodeWithTag("emailField").assertIsDisplayed()
    composeRule.onNodeWithText("Sign in").performClick()
}
```

### Robolectric vs androidTest

- **Robolectric** (JVM, fast) — for repository / ViewModel / business logic.
- **androidTest** (real device / emulator, slow) — for Compose UI / integration / sensors / WebView.

### Coverage

- ≥80% default. ≥95% security-critical (Keystore, encrypted DataStore, payment flows).
- Jacoco + ReportGenerator.

---

## 8. Cognitive Complexity (Campbell)

Kotlin-specific increments:

| Construct | Inc |
|-----------|-----|
| `if` / `else if` / `else` | +1 + nesting |
| `when` (statement) | +1 + nesting |
| `when` (expression) | per non-trivial pattern arm |
| `for` / `while` / `do` | +1 + nesting |
| `try` / `catch` (each) | +1 + nesting |
| `?:` Elvis | +0 (just null fallback — not control flow complexity) |
| `?.` safe call | +0 (idiomatic null handling) |
| Lambda | +1 + nesting |
| Recursion | +1 |

Flat:

| Construct | Inc |
|-----------|-----|
| `break` / `continue` к label | +1 |
| Mixed `&&` / `||` | +1 per mixed |

### Threshold

| Score | Signal |
|-------|--------|
| 0–15 | Good |
| 16–25 | Review |
| 25+ | Refactor |

### Reduction tactics

1. **Early return** через `?:` + return или explicit:
   ```kotlin
   // BAD
   fun process(user: User?) {
       if (user != null) {
           if (user.isActive) {
               if (user.hasPermission) {
                   save(user)
               }
           }
       }
   }
   
   // GOOD
   fun process(user: User?) {
       user ?: return
       if (!user.isActive) return
       if (!user.hasPermission) return
       save(user)
   }
   ```
2. **`when` для type/state dispatch** (replaces if-else chains).
3. **Sealed class** для exhaustive when.
4. **Extension functions** для extracting repeated logic:
   ```kotlin
   // BAD — repeated null check + property access
   if (user != null && user.isActive && user.permission != null) { }
   
   // GOOD — extension
   val User?.canPerform: Boolean
       get() = this?.isActive == true && this.permission != null
   
   if (user.canPerform) { }
   ```
5. **Functional operators** (`map`, `filter`, `flatMap`, `fold`) для collection transformations:
   ```kotlin
   // BAD
   val emails = mutableListOf<String>()
   for (user in users) {
       if (user.isActive) emails.add(user.email)
   }
   
   // GOOD
   val emails = users.filter { it.isActive }.map { it.email }
   ```

---

## 9. Android-specific anti-patterns

### `GlobalScope.launch`

```kotlin
// BAD — leaks; never cancelled
GlobalScope.launch { fetchUser() }

// GOOD — scoped
viewModelScope.launch { fetchUser() }
```

### Plain `SharedPreferences` для sensitive data

```kotlin
// BAD — plaintext token
prefs.edit { putString("auth_token", token) }

// GOOD — Encrypted DataStore или Android Keystore
val encryptedPrefs = EncryptedSharedPreferences.create(...)
encryptedPrefs.edit { putString("auth_token", token) }
```

### Activity Context leak

```kotlin
// BAD — singleton holding Activity context → leak
class Manager {
    companion object {
        var context: Context? = null  // leaks Activity!
    }
}

// GOOD — Application context only для singletons
class Manager(private val appContext: Context)  // pass via DI
```

### `runBlocking` в Main thread

```kotlin
// BAD — ANR
fun onUserClick() {
    runBlocking { fetchUser() }  // ❌ blocks UI
}

// GOOD
fun onUserClick() {
    viewModelScope.launch { fetchUser() }
}
```

### LiveData в new code

См. above — use StateFlow / SharedFlow.

### Missing `collectAsStateWithLifecycle`

```kotlin
// BAD — leaks coroutine when app backgrounded
val state by viewModel.uiState.collectAsState()

// GOOD — lifecycle-aware
val state by viewModel.uiState.collectAsStateWithLifecycle()
```

### Hardcoded strings вместо string resources

```kotlin
// BAD — not localizable
Text("Welcome")

// GOOD
Text(stringResource(R.string.welcome))
```

### `findViewById` в new code (если Compose project)

Modern Android 2026: Compose-only для new screens. `findViewById` — legacy XML View system.

### Missing `@Stable` / `@Immutable` annotations (Compose perf)

```kotlin
// BAD — Compose can't tell if this is stable; recomposes pessimistically
data class UiState(val users: List<User>)

// GOOD — explicit stability
@Immutable
data class UiState(val users: List<User>)
```

(Modern Compose compiler getting better at inference — manual annotations less critical.)

### Modifying mutable list during iteration

```kotlin
// BAD — ConcurrentModificationException
for (user in users) {
    if (user.isInactive) users.remove(user)
}

// GOOD
users.removeAll { it.isInactive }
```

---

## 10. Apply в TDS Android workflow

В android SKILL.md Process Step 3 (Plan):

1. **Apply Karpathy 4** (general).
2. **Apply Clean Code Android** (this file):
   - Naming first; PascalCase composables, camelCase functions.
   - Function size ≤20 lines; composable ≤100.
   - SRP per class / composable.
   - Sealed classes для state; data class для DTOs; `value class` для ID wrappers.
   - StateFlow over LiveData; `collectAsStateWithLifecycle`.
   - viewModelScope / lifecycleScope (no GlobalScope).
   - Constructor injection (Hilt).
   - Encrypted DataStore / Keystore для sensitive.
   - Cognitive complexity ≤15 per function.
3. **Tooling check** в Step 5 Verify:
   - `./gradlew build` — 0 warnings.
   - Detekt — clean (0 issues).
   - ktlint — formatted.
   - `./gradlew lint` — 0 issues.
   - `./gradlew test connectedAndroidTest` — passing.
   - Jacoco coverage — ≥80% (≥95% security).

## Cross-tool: applies в Codex too

Эти principles — Android-specific. Apply equally в Codex CLI.

---

## References

- **Effective Kotlin** (Marcin Moskała) — 2nd ed., 2024.
- **Kotlin Coding Conventions** — https://kotlinlang.org/docs/coding-conventions.html
- **Android Architecture Guide** — https://developer.android.com/topic/architecture
- **Jetpack Compose docs** — https://developer.android.com/jetpack/compose
- **Kotlin Coroutines guide** — https://kotlinlang.org/docs/coroutines-guide.html
- **Robert Martin, *Clean Code*** — adapted к Kotlin.
- **Material 3 design system** — https://m3.material.io/
- **Cognitive Complexity** — SonarSource white paper.
