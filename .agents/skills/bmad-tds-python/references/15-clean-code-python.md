# Python Clean Code Principles

> Adapted from Robert Martin's *Clean Code* (2008), PEP 8 (style guide), PEP 20
> (The Zen of Python), Brett Slatkin's *Effective Python* (3rd ed., 2024),
> и G. Ann Campbell's *Cognitive Complexity*.
>
> Применяется в каждом Python story (auto-loaded в Step 3 Plan если applicable).
> Дополняет (не заменяет) Karpathy 4 принципа .

## Соотношение с Karpathy

| Karpathy | Clean Code (Python) |
|----------|---------------------|
| #1 Think Before Coding | Naming first; explicit > implicit (Zen) |
| #2 Simplicity First | «Simple is better than complex» (Zen); ≤20 lines per function |
| #3 Surgical Changes | DRY; не «улучшай» PEP 8 violations не в scope |
| #4 Goal-Driven Execution (TDD) | pytest tests-first; Hypothesis для property-based |

Karpathy — общие LLM coding pitfalls. Clean Code Python — language-specific patterns.

---

## 1. The Zen of Python (PEP 20) — foundation

```
$ python -c "import this"

Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Complex is better than complicated.
Flat is better than nested.
Sparse is better than dense.
Readability counts.
Special cases aren't special enough to break the rules.
Although practicality beats purity.
Errors should never pass silently.
Unless explicitly silenced.
In the face of ambiguity, refuse the temptation to guess.
There should be one—and preferably only one—obvious way to do it.
Now is better than never.
Although never is often better than *right* now.
If the implementation is hard to explain, it's a bad idea.
If the implementation is easy to explain, it may be a good idea.
Namespaces are one honking great idea—let's do more of them!
```

These are NOT decorative — каждый принцип applies в reviews. «Errors should never pass silently» direct correlate с Karpathy #1 (don't hide confusion).

---

## 2. Meaningful Names (Ch. 2, adapted)

**Choose intention-revealing names. PEP 8 conventions.**

| Element | Convention | Example |
|---------|-----------|---------|
| Function / variable | `snake_case` | `user_count`, `parse_config` |
| Class | `PascalCase` | `UserService`, `OrderRepository` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Module / package | `snake_case` (short) | `auth`, `payments`, `db_utils` |
| Private (convention) | `_leading_underscore` | `_internal_cache` |
| Name-mangled | `__double_leading` | `__ClassName_attribute` (rare) |
| Boolean | `is_*` / `has_*` / `can_*` / `should_*` | `is_active`, `has_permission` |
| Generator | `iter_*` или verb-form | `iter_users()`, `read_lines()` |
| Async function | suffix `_async` НЕ требуется (await-aware) | `fetch_user()` (можно distinguish от `fetch_user_sync`) |

**Anti-patterns:**

- Single-letter outside short loops: `i`, `j` для index OK; `x`, `y` outside math context — анти-pattern.
- `data`, `info`, `manager`, `handler`, `processor` без specifics — noise words.
- Type-suffix Hungarian: `user_dict` , `count_int` — type system already знает; drop suffix.
- Misleading: `get_users()` returning generator (lazy) vs list (eager) — name lies. Use `iter_users()` для lazy, `get_users()` или `fetch_users()` для eager.

**Karpathy #1 application:** if cannot name the function/class cleanly — design wrong, refactor before continuing.

---

## 3. Functions (Ch. 3, adapted to Python)

### Size

- **≤20 lines** target; ≤10 ideal.
- Если function needs comment to explain a block — extract that block.
- Each `if` / `for` body ideally one expression or function call.

### Single responsibility

Function does ONE thing если cannot extract helper с meaningful name. Section comments inside (`# parse data` / `# validate` / `# save`) = function does 3 things; split.

### Arguments

- **0** ideal.
- **1** good.
- **2** acceptable.
- **3+** — group в dataclass / Pydantic model.
- **Bool flags** — never. Split into two functions.
- **`*args` / `**kwargs`** — sparingly; only когда truly variadic API. Don't use to hide complex parameter count.

```python
# BAD
def create_user(name: str, email: str, age: int, is_admin: bool, is_verified: bool) -> User:
    ...

# GOOD — group into dataclass
from dataclasses import dataclass

@dataclass
class UserCreationRequest:
    name: str
    email: str
    age: int
    role: UserRole
    verification_status: VerificationStatus

def create_user(request: UserCreationRequest) -> User:
    ...

# OR — separate functions for boolean variants
def create_user(name: str, email: str, age: int) -> User: ...
def create_admin_user(name: str, email: str, age: int) -> User: ...
def create_verified_user(...) -> User: ...
```

### Type hints — обязательны

Modern Python (3.11+):

```python
def fetch_user(user_id: UUID, *, include_deleted: bool = False) -> User | None:
    ...

# 3.12+: PEP 695 generic syntax
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None
```

mypy strict mode: 0 errors on commit. `Any` discouraged — use generics, Protocol, или TypedDict.

### Default mutable arguments — ANTI-PATTERN

```python
# BAD — list shared across calls
def add_item(item, items=[]):  # ❌
    items.append(item)
    return items

# GOOD
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

### Side effects + Command-Query separation

- `get_user()` returns без side effects (no save, no analytics, no log mutation).
- `save_user()` returns None (or raises) — командный.
- Mixing — anti-pattern. `fetch_and_cache_user()` если both нужны (name reveals).

### Prefer exceptions to error codes

```python
# BAD — None hides reason
def parse_config(data: bytes) -> Config | None:
    ...

# GOOD — exceptions explicit, typed
class ConfigError(Exception):
    """Base config error."""

class MalformedJSONError(ConfigError):
    line: int

class MissingFieldError(ConfigError):
    field_name: str

def parse_config(data: bytes) -> Config:
    """Raises ConfigError subclass on parse failure."""
    ...
```

### DRY

Code block 2+ occurrences — extract. Not «утром ещё раз посмотрю» — refactor сейчас.

### Comprehensions vs explicit loops

Use comprehensions для transformations:

```python
# BAD — explicit append loop
result = []
for user in users:
    if user.is_active:
        result.append(user.email)

# GOOD — list comprehension
result = [user.email for user in users if user.is_active]
```

But:
- Multi-line compre-hellsions become hard to read; switch to loop or multiple comprehensions.
- Side-effect comprehensions (`[print(x) for x in items]`) — anti-pattern; use plain `for` loop.
- Generator expressions для memory-bounded streams: `(line.strip() for line in f)`.

---

## 4. Comments (Ch. 4)

**Default: zero comments. Code explains itself через naming + structure + type hints.**

**When to comment:**

1. **WHY non-obvious** — workaround, hidden constraint:
   ```python
   # SQLAlchemy session.query() returns list-like proxy; iterate explicitly
   # to avoid lazy-load surprise during JSON serialization.
   for user in users:
       ...
   ```
2. **External requirement**:
   ```python
   # OAuth 2.0 RFC 6749 §3.1.2: state must be opaque to client; prevents CSRF.
   state = secrets.token_urlsafe(32)
   ```
3. **Performance optimization** — why non-obvious code.

**Docstrings — yes, всегда для public API:**

```python
def fetch_user(user_id: UUID) -> User:
    """Fetch user by ID.

    Args:
        user_id: UUID of the user.

    Returns:
        User instance.

    Raises:
        UserNotFoundError: if no user with this ID exists.
        DatabaseError: on connection failure.
    """
```

Format: Google / NumPy / reStructuredText. Pick one per project, stay consistent.

**Never:**

- Commented-out code (delete; git remembers).
- TODO без ticket reference.
- Section comments inside functions (= function does too much).
- Comments restating WHAT (`x += 1  # Increment x by 1`).

---

## 5. Types / Classes (Ch. 6, 10)

### Prefer `dataclass` over manual class for data containers

```python
# BAD
class User:
    def __init__(self, id, name, email):
        self.id = id
        self.name = name
        self.email = email
    
    def __repr__(self):
        return f"User(id={self.id}, name={self.name}, email={self.email})"

# GOOD — dataclass
from dataclasses import dataclass
from uuid import UUID

@dataclass(frozen=True)  # frozen — immutable
class User:
    id: UUID
    name: str
    email: str
```

`frozen=True` для immutable data.
`slots=True` (Python 3.10+) если perf-critical and no `__dict__` needed.

### Pydantic для boundary validation

API request bodies, config files, env vars — pydantic v2 `BaseModel`:

```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=0, le=150)
```

Plain dataclass для internal data structures; Pydantic для I/O boundary.

### Single Responsibility (SRP)

Each class owns ONE concept. «UserAndAuthService» — split.

`UserService` — CRUD users.
`AuthService` — authenticate / authorize.
`UserRepository` — persistence layer.

### Composition over inheritance

Python supports multiple inheritance — but используй для mixins (cohesive small interfaces) или `ABC` (abstract base classes), не deep hierarchies.

```python
# BAD — deep inheritance
class Shape: ...
class Polygon(Shape): ...
class Quadrilateral(Polygon): ...
class Rectangle(Quadrilateral): ...

# GOOD — composition + Protocol
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height
    def draw(self) -> None: ...
```

### Dependency Injection

Inject dependencies via `__init__` (or factory). Avoid module-level globals в domain logic.

```python
# BAD — hidden global dependency
class UserService:
    def get_user(self, id):
        return db.query(User).get(id)  # `db` is module global

# GOOD — explicit dependency
from typing import Protocol

class UserRepositoryProtocol(Protocol):
    def get_by_id(self, id: UUID) -> User | None: ...

class UserService:
    def __init__(self, repo: UserRepositoryProtocol):
        self._repo = repo
    def get_user(self, id: UUID) -> User | None:
        return self._repo.get_by_id(id)
```

### Protocols (PEP 544) для testability

Use `Protocol` для structural subtyping (duck typing с types). Mock через any class implementing protocol — не required ABC.

### Open/Closed

Extension через new conformances; modification existing code — anti-pattern.

---

## 6. Error Handling (Ch. 7) — Pythonic

### Use exceptions, not return codes

```python
# BAD
def divide(a: float, b: float) -> tuple[float | None, str | None]:
    if b == 0:
        return None, "Division by zero"
    return a / b, None

# GOOD
class DivisionError(ValueError): pass

def divide(a: float, b: float) -> float:
    if b == 0:
        raise DivisionError(f"Cannot divide {a} by zero")
    return a / b
```

### Custom exception hierarchy

```python
class AppError(Exception):
    """Base для всех app-specific errors."""

class ValidationError(AppError): pass
class NotFoundError(AppError): pass
class AuthorizationError(AppError): pass
```

Catch specific, not bare `Exception`:

```python
# BAD
try:
    do_work()
except Exception:  # ловит всё, включая KeyboardInterrupt в old Python
    logger.error("Failed")

# GOOD
try:
    do_work()
except (ValidationError, NotFoundError) as e:
    logger.warning("Recoverable: %s", e)
    raise
except AppError as e:
    logger.error("App error: %s", e, exc_info=True)
    raise
```

### Never silent catches

```python
# BAD
try:
    save()
except Exception:
    pass  # ❌

# GOOD — at minimum log + re-raise или handle
try:
    save()
except DatabaseError as e:
    logger.error("Save failed: %s", e)
    raise

# OR explicitly silenced (Zen: «Unless explicitly silenced»):
try:
    optional_telemetry_emit()
except TelemetryError as e:
    logger.debug("Telemetry skip (non-fatal): %s", e)
    # explicit: telemetry failure не блокирует main flow
```

### Use `else` clauses

```python
try:
    value = parse(data)
except ParseError:
    fallback()
else:
    # выполняется если parse() succeeded
    process(value)
finally:
    cleanup()
```

### Context managers (`with` statement)

For resource management — always:

```python
# BAD
f = open("data.txt")
data = f.read()
f.close()  # пропустится если read() raises

# GOOD
with open("data.txt") as f:
    data = f.read()
```

Custom context managers — `@contextmanager` decorator или `__enter__` / `__exit__`.

---

## 7. Async Patterns (Effective Python ch. 7-8)

### `async def` для I/O-bound concurrency

```python
# Concurrent fetch
import asyncio

async def fetch_users(ids: list[UUID]) -> list[User]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"/users/{id}") for id in ids]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        return [parse_user(r) for r in responses if not isinstance(r, Exception)]
```

### `asyncio.gather` — ALWAYS pass `return_exceptions=True` если errors handlable

```python
# BAD — first exception cancels rest, others lost
results = await asyncio.gather(*tasks)

# GOOD — explicit handling
results = await asyncio.gather(*tasks, return_exceptions=True)
for task, result in zip(tasks, results, strict=True):
    if isinstance(result, Exception):
        logger.error("Task failed: %s", result)
```

### TaskGroup (Python 3.11+) для structured concurrency

```python
async def process_all():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_a())
        task2 = tg.create_task(fetch_b())
    # exit-block — ждёт all tasks; collects ALL exceptions
    return task1.result(), task2.result()
```

### Don't mix sync I/O в async functions

```python
# BAD — blocks event loop
async def save_user(user: User):
    with open("users.txt", "a") as f:  # ❌ sync I/O
        f.write(str(user))

# GOOD
import aiofiles
async def save_user(user: User):
    async with aiofiles.open("users.txt", "a") as f:
        await f.write(str(user))

# OR — run in executor
async def save_user(user: User):
    await asyncio.to_thread(write_user_sync, user)
```

### Never `await` в loop без `gather` если concurrent OK

```python
# SLOW — sequential
for url in urls:
    result = await fetch(url)
    results.append(result)

# FAST — concurrent
results = await asyncio.gather(*[fetch(url) for url in urls], return_exceptions=True)
```

---

## 8. Tests (Ch. 9) — pytest + FIRST

| Letter | Principle |
|--------|-----------|
| **F**ast | Unit ≤ 0.1s. Slow tests separate (`@pytest.mark.slow`). |
| **I**ndependent | Test order doesn't matter. No shared mutable state. |
| **R**epeatable | Same result every run. Inject clock / random / IDs. |
| **S**elf-validating | `assert` boolean. No «check the log». |
| **T**imely | Test-first — TDD. Failing test commits BEFORE impl commits. |

### AAA pattern

```python
def test_login_with_valid_credentials_returns_token():
    # Arrange
    auth_service = MockAuthService(return_token="abc123")
    view_model = LoginViewModel(auth_service=auth_service)
    
    # Act
    token = view_model.login(email="x@y.z", password="secret")
    
    # Assert
    assert token == "abc123"
```

### Test naming

`test_<method>_<scenario>_<expected>`:

- ✅ `test_login_with_valid_credentials_returns_token`
- ✅ `test_login_with_wrong_password_raises_AuthError`
- ❌ `test_login` (no info)
- ❌ `test_everything` (test too broad)

### Fixtures

```python
@pytest.fixture
def db():
    # setup
    conn = create_test_db()
    yield conn
    # teardown
    conn.close()

def test_save_user(db):
    repo = UserRepository(db)
    user = repo.save(User(name="Alice"))
    assert user.id is not None
```

`scope="function"` (default) — most isolated. `scope="session"` для expensive setup (e.g., Docker container).

### Hypothesis для property-based testing

```python
from hypothesis import given, strategies as st

@given(st.integers(min_value=1, max_value=1000))
def test_factorial_is_positive(n):
    assert factorial(n) > 0
```

For validation logic, parsers, math — finds edge cases automatic.

### Mocking

Mock через protocol conformance / dependency injection. Don't `unittest.mock` production internals.

```python
# BAD — patching internals
@patch("myapp.services.user_service._db")
def test_get_user(mock_db):
    ...

# GOOD — inject mock
def test_get_user():
    mock_repo = Mock(spec=UserRepositoryProtocol)
    mock_repo.get_by_id.return_value = User(...)
    service = UserService(repo=mock_repo)
    assert service.get_user(some_id) is not None
```

### Coverage

- ≥80% default.
- ≥95% security/integrity (auth, crypto, parsing untrusted input).
- `pytest --cov=myapp --cov-report=term-missing`.

---

## 9. Cognitive Complexity (Campbell, SonarSource)

Same scoring rules as iOS Clean Code (см. iOS section 7), with Python adjustments:

**Python-specific structural increments:**

| Construct | Inc |
|-----------|-----|
| `if` / `elif` / `else` | +1 + nesting |
| `for` / `while` | +1 + nesting |
| `with` (multi-clause OR async) | +1 + nesting |
| `try` / `except` / `else` / `finally` | each `except` +1; `try` no inc itself |
| Comprehension (with filter `if`) | +1 + nesting |
| Lambda | +1 + nesting |
| Recursion | +1 |

**Python-specific flat increments:**

| Construct | Inc |
|-----------|-----|
| Mixed `and` / `or` chain | +1 per mixed sequence |
| `break` / `continue` to label | +1 |

### Threshold

| Score | Signal |
|-------|--------|
| 0–15 | Good |
| 16–25 | Review |
| 25+ | Refactor |

### Reduction tactics — Python-specific

1. **Early return** — flatten happy path:
   ```python
   # BAD
   def process(user):
       if user is not None:
           if user.is_active:
               if user.has_permission:
                   save(user)

   # GOOD
   def process(user):
       if user is None: return
       if not user.is_active: return
       if not user.has_permission: return
       save(user)
   ```
2. **Extract function** — encapsulate inner block.
3. **Comprehension / `filter` / `map`** — replace explicit loops где applicable.
4. **`dict` / `match` (3.10+)** — replace if-elif-elif chains:
   ```python
   # BAD
   if status == 200: return "OK"
   elif status == 404: return "Not Found"
   elif status == 500: return "Server Error"

   # GOOD — dict
   STATUS_MESSAGES = {200: "OK", 404: "Not Found", 500: "Server Error"}
   return STATUS_MESSAGES.get(status, "Unknown")

   # OR — match statement (Python 3.10+)
   match status:
       case 200: return "OK"
       case 404: return "Not Found"
       case 500: return "Server Error"
       case _: return "Unknown"
   ```
5. **Combine guards:**
   ```python
   if not user or not user.is_active or not user.has_permission:
       return
   ```

---

## 10. Python-specific anti-patterns

### Bare `except`

```python
# BAD — ловит KeyboardInterrupt, SystemExit (старая semantic)
try: do_work()
except: pass

# GOOD
try: do_work()
except SpecificError as e: logger.error("...", e); raise
```

### Mutable default args (covered above) — repeat для emphasis

```python
# ❌
def f(x=[]): ...

# ✅
def f(x=None):
    if x is None: x = []
```

### `print` для debugging в production code

Replace с `logging`:

```python
# BAD
print(f"User loaded: {user}")

# GOOD
import logging
logger = logging.getLogger(__name__)
logger.info("User loaded: %s", user)  # %s, не f-string — lazy formatting
```

### Star imports

```python
# BAD — namespace pollution
from module import *

# GOOD — explicit
from module import specific_function, OtherClass
```

### Loops для `sum` / `min` / `max` / `any` / `all`

```python
# BAD
total = 0
for x in numbers:
    total += x

# GOOD
total = sum(numbers)
```

### List concatenation в loop

```python
# BAD — quadratic
result = []
for chunk in chunks:
    result += chunk  # ❌ creates new list each iteration

# GOOD
result = list(itertools.chain.from_iterable(chunks))
# OR
result = []
for chunk in chunks:
    result.extend(chunk)
```

### String concatenation `+` в loop

```python
# BAD — quadratic
s = ""
for word in words:
    s += word  # ❌

# GOOD
s = "".join(words)
```

### Modifying dict / list during iteration

```python
# BAD — RuntimeError
for key in d:
    if condition(d[key]):
        del d[key]

# GOOD — iterate over copy
for key in list(d.keys()):
    if condition(d[key]):
        del d[key]
```

---

## 11. Apply в TDS Python workflow

В Python SKILL.md Process Step 3 (Plan):

1. **Apply Karpathy 4** (general LLM coding hygiene).
2. **Apply Clean Code Python** (this file):
   - Naming first (Zen of Python — Explicit > Implicit).
   - Function size ≤20 lines.
   - SRP / dataclass / Pydantic boundary.
   - Exceptions over return codes; named hierarchy.
   - `asyncio.gather` с `return_exceptions=True`.
   - Cognitive complexity ≤15 per function.
3. **Tooling check** в Step 5 Verify:
   - `ruff` (recommended 2026 — replaces black + flake8 + isort): 0 warnings.
   - `mypy --strict`: 0 errors.
   - `pytest --cov`: ≥80% (≥95% critical).
   - PEP 8 conformance via ruff.

## Cross-tool: applies в Codex too

Эти principles — Python-specific, не Anthropic-specific. Apply equally в Codex CLI sessions.

---

## References

- **PEP 8** — https://peps.python.org/pep-0008/
- **PEP 20** (Zen of Python) — https://peps.python.org/pep-0020/
- **PEP 257** (Docstring conventions) — https://peps.python.org/pep-0257/
- **PEP 484** (Type hints) — https://peps.python.org/pep-0484/
- **Effective Python** (Brett Slatkin) — 3rd ed., 2024.
- **Robert Martin, *Clean Code*** — adapted к Python idioms.
- **G. Ann Campbell, *Cognitive Complexity*** — SonarSource white paper.
- **Hitchhiker's Guide to Python** — https://docs.python-guide.org/
- **Python Patterns** — https://refactoring.guru/design-patterns/python
