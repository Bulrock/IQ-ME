# OpenTelemetry (.NET)

> **Priority:** P1.
> **Gate level:** conditional — load only когда story touches
> observability code or tests; advisory severity (warnings, не
> hard-fails — observability misconfiguration silently degrades
> диагностику, не breaks runtime).
> **Load trigger:** story adds OR changes:
> - `ActivitySource`, `Activity`, custom `ActivityListener`;
> - OpenTelemetry SDK setup (`AddOpenTelemetry()` builder);
> - tracing / metrics / logs exporter configuration;
> - `ResourceBuilder` setup;
> - tests asserting on tracing / metrics / logs output.
> **Evidence level:** external-source (Microsoft OpenTelemetry .NET
> docs, OpenTelemetry Specification) + multi-project pattern.

## Rule 1 — register every `ActivitySource` with `AddSource`

OpenTelemetry SDK does NOT auto-discover `ActivitySource` instances.
Without `AddSource("<name>")`, the SDK silently ignores all spans
from that source — code emits Activities, exporter sees nothing,
debug session puzzles over «traces work locally, missing в
production».

**Anti-pattern (silent drop):**

```csharp
// SomeService.cs
private static readonly ActivitySource Source = new("MyApp.Notifications");

public void Dispatch() {
    using var activity = Source.StartActivity("Dispatch");
    // ... do work ...
}

// Program.cs
services.AddOpenTelemetry()
    .WithTracing(b => b
        .AddSource("MyApp.Web")   // ← MyApp.Notifications NOT listed
        .AddOtlpExporter());
// → Dispatch spans silently dropped.
```

**Correct:**

```csharp
services.AddOpenTelemetry()
    .WithTracing(b => b
        .AddSource("MyApp.Web")
        .AddSource("MyApp.Notifications")   // ← explicit
        .AddSource("MyApp.Auth")            // ← explicit
        .AddOtlpExporter());
```

**Pattern (centralize source names):**

```csharp
// /Common/Telemetry/SourceNames.cs
public static class SourceNames
{
    public const string Web = "MyApp.Web";
    public const string Notifications = "MyApp.Notifications";
    public const string Auth = "MyApp.Auth";
    public static readonly string[] All = { Web, Notifications, Auth };
}

// Program.cs
.WithTracing(b => {
    foreach (var src in SourceNames.All) b.AddSource(src);
    b.AddOtlpExporter();
});
```

Drift catch: arch-test grepping `new ActivitySource\("([^"]+)"\)`
across `src/` and verifying every captured name appears в
`SourceNames.All`.

## Rule 2 — single `ResourceBuilder` shared across tracing / metrics / logs

Telemetry pillars (traces, metrics, logs) MUST publish identical
resource attributes (`service.name`, `service.version`,
`deployment.environment`, `host.*`, custom labels) — иначе correlation
queries в backend (Tempo / Honeycomb / Datadog) fail (different
service identities for same process).

**Anti-pattern (resource drift):**

```csharp
services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("MyApp"))   // tracing only
    .WithTracing(b => b.AddOtlpExporter())
    .WithMetrics(b => b
        .ConfigureResource(r => r.AddService("MyApp-metrics"))   // ← drift!
        .AddOtlpExporter());
// → traces в MyApp service, metrics в MyApp-metrics service. Queries
//   joining traces к metrics fail silently.
```

**Correct (single resource builder):**

```csharp
var resource = ResourceBuilder.CreateDefault()
    .AddService(
        serviceName: "MyApp",
        serviceVersion: typeof(Program).Assembly.GetName().Version?.ToString())
    .AddAttributes(new[] {
        new KeyValuePair<string, object>("deployment.environment", env),
    });

services.AddOpenTelemetry()
    .ConfigureResource(b => b.AddDetector(_ => resource.Build()))
    .WithTracing(...)
    .WithMetrics(...)
    .WithLogging(...);
```

(`.WithLogging` available в `OpenTelemetry.Extensions.Hosting` ≥ 1.x.)

## Rule 3 — kill-switch symmetry across pillars

Если you have a tracing kill-switch (e.g. `OTEL_TRACES_DISABLED=true` /
config flag), metrics/logs MUST have analogous switches. Asymmetric
kill-switches mean «I turned off traces для performance debugging» в
production silently leaves metrics streaming load на the OTLP
collector.

**Pattern (one flag per pillar, plus master):**

```csharp
public class TelemetryOptions
{
    public bool TracingEnabled { get; init; } = true;
    public bool MetricsEnabled { get; init; } = true;
    public bool LoggingEnabled { get; init; } = true;
    public bool Enabled { get; init; } = true;   // master switch
}

var otelBuilder = services.AddOpenTelemetry();
if (opts.Enabled && opts.TracingEnabled) otelBuilder.WithTracing(...);
if (opts.Enabled && opts.MetricsEnabled) otelBuilder.WithMetrics(...);
if (opts.Enabled && opts.LoggingEnabled) otelBuilder.WithLogging(...);
```

**Anti-pattern:** only `OTEL_SDK_DISABLED=true` master flag without
per-pillar granularity → operator can't isolate «too many traces» от
«too many metrics» problem.

## Rule 4 — hot read-path logs default Debug, not Information

Hot read paths (per-request middleware, DB query interceptors,
per-message handlers) often log diagnostic context. At Information
level, these flood production log storage (1k req/s × 5 logs/req =
432M logs/day). At Debug, opt-in only via runtime config.

```csharp
// Anti-pattern (floods production):
_logger.LogInformation("Resolved user {UserId} via cache", userId);

// Pattern (Debug for hot path):
if (_logger.IsEnabled(LogLevel.Debug))
{
    _logger.LogDebug("Resolved user {UserId} via cache", userId);
}
```

`if (_logger.IsEnabled(...))` guard avoids unnecessary message
formatting cost даже когда Debug filtered out — Microsoft official
guidance.

**Exceptions** (do log at Information):
- Authentication outcomes (security audit).
- State transitions (workflow visibility).
- Errors (always — `LogWarning` / `LogError`).

## Rule 5 — deterministic Activity tests via `ActivityListener`

Asserting on traces в xUnit requires `ActivityListener` attached
**before** SUT starts. Common bug: listener attached после the
SUT begins emitting → first N activities lost, intermittent test
failures.

**Pattern:**

```csharp
[Fact]
public async Task Dispatch_EmitsActivity()
{
    var activities = new ConcurrentBag<Activity>();
    using var listener = new ActivityListener
    {
        ShouldListenTo = source => source.Name == "MyApp.Notifications",
        Sample = (ref ActivityCreationOptions<ActivityContext> _) =>
            ActivitySamplingResult.AllDataAndRecorded,
        ActivityStopped = activity => activities.Add(activity),
    };
    ActivitySource.AddActivityListener(listener);
    // ↑ MUST be attached before SUT first .StartActivity call.

    var sut = new NotificationDispatcher();
    await sut.DispatchAsync(testMessage);

    activities.Should().ContainSingle(a => a.OperationName == "Dispatch");
}
```

**Parallel test runs:** filter by `TraceId` или per-test source name
suffix (`"MyApp.Notifications.test-42"`) чтобы avoid cross-pollution
between concurrent test cases.

## Rule 6 — propagate `ActivityContext` across async boundaries explicitly

`Activity.Current` flows automatically через `await` (uses
`AsyncLocal<T>`). But across:
- `Task.Run(() => ...)` без explicit context capture;
- `BackgroundService.ExecuteAsync` from `IHostedService` start;
- message broker handlers (Kafka / RabbitMQ / Azure Service Bus)
  consuming serialized context from headers;

— `Activity.Current` is null on the new flow. Inject context
explicitly via traceparent header.

```csharp
// Producer side
using var activity = Source.StartActivity("PublishMessage");
message.Headers["traceparent"] = activity?.Id;
// ... publish to broker ...

// Consumer side (different process / thread / Task.Run)
var traceparent = message.Headers["traceparent"];
var contextResult = ActivityContext.TryParse(traceparent, null, out var ctx);
using var activity = Source.StartActivity(
    "ConsumeMessage", ActivityKind.Consumer,
    parentContext: ctx);
```

W3C traceparent format — official propagation standard.

## Detection (review checklist)

- [ ] Every new `ActivitySource` listed in `SourceNames.*` (или
      equivalent registry) AND wired via `AddSource(...)` в SDK
      setup?
- [ ] `ResourceBuilder` shared across `.WithTracing` / `.WithMetrics`
      / `.WithLogging`?
- [ ] Per-pillar kill-switches symmetrical (или explicit rationale
      для asymmetry)?
- [ ] Hot-path logs at Debug, не Information? `IsEnabled` guard
      before format cost?
- [ ] Activity tests attach `ActivityListener` **before** SUT start?
      Filter by TraceId / source name suffix for parallel runs?
- [ ] Async boundary crossings preserve trace context via explicit
      W3C traceparent injection?

## Related

- `references/15-clean-code-csharp.md` — naming, constructor DI
  patterns используемые в telemetry setup code.
- `references/60-security-and-logging-invariants.md` — masking
  rules apply equally к telemetry attributes (no secrets в
  `tags["api.key"]`).
- Microsoft OpenTelemetry .NET docs: <https://learn.microsoft.com/
  dotnet/core/diagnostics/observability-with-otel>.
- OpenTelemetry .NET SDK: <https://opentelemetry.io/docs/languages/
  net/>.
- W3C Trace Context spec (traceparent propagation).
