# .NET integration review checklist — AC-to-assert discipline

> **Priority:** P0.
> **Gate level:** hard для production-path stories implementing AC
> contract fields.
> **Load trigger:** story adds/changes:
> - public API endpoint (controller / Minimal API route) returning
>   structured response;
> - service contract method с multi-field result;
> - middleware / filter that mutates response payload;
> - any AC referencing specific output field names or condition
>   combinations.
> **Evidence level:** multi-project-validated (alcosi pattern of «AC
> says 5 fields, test checks status=200 only» observed multiple
> times).
>
> **Related (cross-language):** DI registration + production-path
> invocation rule lives в `payload/role-skills/bmad-tds-engineer/
> references/20-di-integration-gate.md` — load when story touches DI.

## Rule — every AC field/condition has an explicit assertion

«Acceptance Criteria» enumerates specific contract behaviour. Tests
that pass на broad-success-only (`response.StatusCode == 200`) create
false confidence: implementation may return `200` while silently
dropping half the documented fields. Each AC field MUST be asserted
explicitly.

**Anti-pattern (broad-success only):**

```csharp
[Fact]
public async Task GetNotification_ReturnsNotification()
{
    var resp = await _client.GetAsync("/api/notifications/42");
    resp.StatusCode.Should().Be(HttpStatusCode.OK); // ← passes if
                                                    // payload is {}
}
```

If AC says response must include `id`, `recipient`, `status`,
`scheduledAt`, `retryCount` — implementation could omit any of them
and this test never notices.

**Correct (AC-to-assert mapping):**

```csharp
[Fact]
public async Task GetNotification_ReturnsAllAcceptanceFields()
{
    var resp = await _client.GetAsync("/api/notifications/42");
    resp.StatusCode.Should().Be(HttpStatusCode.OK);
    var body = await resp.Content.ReadFromJsonAsync<NotificationDto>();
    body.Should().NotBeNull();
    body!.Id.Should().Be(42);
    body.Recipient.Should().Be("alice@example.com");
    body.Status.Should().Be(NotificationStatus.Scheduled);
    body.ScheduledAt.Should().BeCloseTo(_clockNow, TimeSpan.FromSeconds(2));
    body.RetryCount.Should().Be(0);
}
```

Each AC field has its own assertion — implementation drift silently
breaks one of them, test surfaces the exact gap.

## Pattern — table-driven AC mapping в test method

Map AC items 1:1 к assertions через comment + `Should()` chain:

```csharp
[Fact]
public async Task Create_AC_Mapping()
{
    var resp = await _client.PostAsJsonAsync("/api/notifications",
        new CreateRequest { Recipient = "x", Channel = "email" });

    // AC 1: returns 201 + Location header pointing к new resource.
    resp.StatusCode.Should().Be(HttpStatusCode.Created);
    resp.Headers.Location.Should().NotBeNull();

    // AC 2: response body has Id (non-zero), Status=Scheduled.
    var body = await resp.Content.ReadFromJsonAsync<NotificationDto>();
    body!.Id.Should().BeGreaterThan(0);
    body.Status.Should().Be(NotificationStatus.Scheduled);

    // AC 3: side effect — exactly one row inserted в database.
    using var scope = _factory.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    var rows = await db.Notifications.CountAsync();
    rows.Should().Be(1);

    // AC 4: integration event emitted exactly once.
    _eventBusSpy.PublishedEvents.Should().ContainSingle(
        e => e is NotificationCreated && ((NotificationCreated)e).Id == body.Id);
}
```

When test fails, failure message points к the failed AC item; specialist
fixes именно that gap.

## Anti-patterns

```csharp
// Anti-pattern A: success-only smoke
resp.StatusCode.Should().Be(HttpStatusCode.OK);
// — nothing else asserted; payload could be {} or wrong shape entirely.

// Anti-pattern B: serialization round-trip без field-level check
var body = await resp.Content.ReadFromJsonAsync<MyDto>();
body.Should().NotBeNull();
// — verifies parseable JSON, не contract fields.

// Anti-pattern C: snapshot/golden file без AC-link comments
body.Should().BeEquivalentTo(_goldenFile);
// — works, но when AC changes, snapshot updates silently без re-linking
//   к AC list. Snapshot tests need AC commentary either inline или
//   adjacent.

// Anti-pattern D: testing implementation detail instead of AC field
_repoMock.Verify(r => r.SaveAsync(It.IsAny<Notification>()), Times.Once);
// — asserts «repo was called» вместо «AC #3: notification persisted».
//   AC describes observable behaviour; assert на observable, не на
//   internal mock invocations.
```

## Side effects — also AC fields

If AC mentions «notification persisted» / «event emitted» / «email
queued» — those ARE AC fields, even though they live в side effects:

- DB persistence → query DB (как пример AC 3 above).
- Event emission → spy / test double bus collects events.
- External API call → record via `WireMock.Net` или similar, assert
  exact request shape.
- Background job queue → query queue length / inspect job payload.

Test must verify the side effect happened, не just that the API
returned «success».

## Detection (review checklist)

- [ ] Story AC enumerated в spec? List of fields/conditions extractable?
- [ ] Test method counts assertions ≥ AC field count?
- [ ] Each AC item has at least one corresponding assertion
      (comment-linked если non-obvious)?
- [ ] Side-effect AC items (DB row / event / queue) covered by
      integration test (not unit-mock-verify)?

## Related

- `references/30-testing.md` (когда landed) — xUnit + FluentAssertions
  patterns.
- `references/15-clean-code-csharp.md` — clean test method shape.
- Cross-language: `bmad-tds-engineer/references/20-di-integration-gate.md`
  — DI piece of integration-test discipline (если story also touches
  DI registration).
