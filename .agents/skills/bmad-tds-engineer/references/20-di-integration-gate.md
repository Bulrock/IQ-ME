# DI integration gate (cross-language)

> **Priority:** P0.
> **Gate level:** hard для production-path DI components; advisory для
> small libs / test-only registrations.
> **Load trigger:** story adds OR changes any of these:
> - service/middleware/provider/interceptor/hosted-service registration;
> - constructor-injected dependency;
> - factory / decorator binding в DI container;
> - lifecycle scope (singleton / scoped / transient / request-scoped).
> **Evidence level:** multi-project-validated (C# alcosi + ad-hoc Python
> / Spring observations).

## Principle

**A DI registration без production-path invocation = silently dead
feature.** If a service is `services.AddSingleton<IFoo, Foo>()`-ed but
never `IFoo`-injected by anyone в production code, the registration
ships как ceremony — tests can mock it, the build passes, and the
intent never executes.

Two assertions per new DI component:

1. **Structural:** registration exists и resolves через DI container
   (catches typo / wrong lifetime / wrong interface).
2. **Behavioural:** at least one production code path calls the
   injected interface, exercised by an integration test or end-to-end
   behavioral test.

Unit tests на implementation в isolation (`new Foo(...)`) do NOT
satisfy #2 — they don't prove anyone wired up DI properly. Integration
tests using the actual container являются authoritative.

## Detection

Per-PR review checklist:

- [ ] New `services.Add*` / `Container.register` / `@Service` / `fx.Provide`
      / `container.bind` line added?
- [ ] Production code calls injected interface (not test mock)?
- [ ] Integration test exercises the production path that uses the
      injection?

If #1 yes но #2 missing → silently dead. If #1 yes и #2 yes но #3
missing → impossible to catch regression of #2.

## Examples per stack

### C# / .NET (`Microsoft.Extensions.DependencyInjection`)

```csharp
// Registration (Startup / Program.cs)
services.AddSingleton<INotificationSubscriber, NotificationSubscriber>();

// Production-path invocation (NotificationDispatcher constructor)
public NotificationDispatcher(INotificationSubscriber subscriber) { ... }
// + subscriber.HandleAsync(...) somewhere в Dispatch method.

// Integration test
var host = await StartTestHostAsync();
var dispatcher = host.Services.GetRequiredService<INotificationDispatcher>();
await dispatcher.DispatchAsync(testEvent);
Assert.That(spy.HandledEvents, Contains.Item(testEvent));
```

**Anti-pattern (silently dead):** registered subscriber not constructor-
injected anywhere; unit tests construct `Dispatcher` с mock subscriber
directly. Production code path is empty.

### Python (`dependency-injector` / FastAPI `Depends`)

```python
# dependency-injector — Container
class Container(containers.DeclarativeContainer):
    notification_subscriber = providers.Singleton(NotificationSubscriber)
    dispatcher = providers.Singleton(
        NotificationDispatcher,
        subscriber=notification_subscriber,
    )

# Production-path invocation (dispatcher uses subscriber внутри)
class NotificationDispatcher:
    def __init__(self, subscriber: NotificationSubscriber): ...
    def dispatch(self, evt): self.subscriber.handle(evt)

# Integration test
container = Container()
disp = container.dispatcher()
disp.dispatch(test_event)
assert spy.handled == [test_event]
```

FastAPI variant:

```python
# Route depends on subscriber via Depends(...)
@app.post("/notify")
def notify(subscriber: NotificationSubscriber = Depends(get_subscriber)):
    subscriber.handle(...)

# Integration test using TestClient
client.post("/notify", json={...})
```

**Anti-pattern:** `Container.notification_subscriber` declared,
no route или service injects it.

### Java / Spring Boot

```java
@Service
public class NotificationSubscriber { ... }

// Constructor injection in dispatcher
@Service
public class NotificationDispatcher {
  private final NotificationSubscriber subscriber;
  public NotificationDispatcher(NotificationSubscriber subscriber) {
    this.subscriber = subscriber;
  }
  public void dispatch(Event evt) { subscriber.handle(evt); }
}

// Integration test
@SpringBootTest
class NotificationDispatcherIT {
  @Autowired NotificationDispatcher dispatcher;
  // + verify call reached subscriber via spy / test double bean
}
```

**Anti-pattern:** `@Service` без any `@Autowired` consumer in
production code; only test contexts wire it.

### Go (`uber-go/fx`)

```go
// Module registration
fx.Module("notifications",
    fx.Provide(NewNotificationSubscriber),
    fx.Provide(NewNotificationDispatcher),
    fx.Invoke(StartDispatcher), // <- enforces actual invocation
)

// Without fx.Invoke(...) the provided components могут остаться
// unused; fx.Invoke is the explicit "must run" marker.
```

**Pattern:** Go fx's `fx.Invoke` is the explicit "production path
exercises this" marker — use it instead of leaving providers
dangling.

### Node.js (InversifyJS / tsyringe)

```typescript
// InversifyJS
container.bind<INotificationSubscriber>(TYPES.Subscriber)
  .to(NotificationSubscriber).inSingletonScope();

// Constructor injection
@injectable()
class NotificationDispatcher {
  constructor(
    @inject(TYPES.Subscriber) private subscriber: INotificationSubscriber,
  ) {}
  dispatch(evt: Event) { this.subscriber.handle(evt); }
}

// Integration test
const container = buildContainer();
const dispatcher = container.get<NotificationDispatcher>(TYPES.Dispatcher);
dispatcher.dispatch(testEvent);
```

**Anti-pattern:** `container.bind(TYPES.Subscriber)` без any
`@inject` consumer.

## Per-language pointer table

| Stack | Detailed reference (когда landed) |
|---|---|
| C# / .NET | `payload/role-skills/bmad-tds-csharp/references/20-dotnet-integration-review-checklist.md` |
| Python | (no language-specific DI reference yet — общие правила выше + framework docs) |
| Java/Spring | (deferred — `payload/role-skills/bmad-tds-java/references/`) |
| iOS / Android | (DI patterns differ — Swinject / Dagger; deferred) |
| Frontend (DI rare) | N/A — DI usually unnecessary в React/Vue/Angular DI-free patterns |

## Halt-condition for engineer self-review

Если specialist self-review (Verify step) covers DI-component story и
behavioural test absent → mark `**Areas of uncertainty:** "no integration
test exercises DI registration"` so auditor catches the gap rather
than silently passing.

## Cross-references

- `references/tdd-cycle-templates.md` — Red/Green/Refactor cycle (DI
  гейт integrates с Refactor phase: production-path invocation добавляется
  до Green, integration test до Refactor's end).
- `references/scoped-commit-policy.md` — scoped commit groups (DI
  registration + invocation site + integration test ideally land
  одним commit).
