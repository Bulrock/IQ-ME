# 50-frameworks/ — C# / .NET techstack-pack

> Status: incremental landing — first deep-dive landed v6.5.0 PR-6
> (`opentelemetry.md`). The C# role-skill references files в этой
> directory under "lazy-load on demand" semantics. Files что не landed
> yet — skill operates from `15-clean-code-csharp.md` plus general
> LLM knowledge для that framework.

## Deep-dives

| File                | Topic                                                  | Status |
|---------------------|--------------------------------------------------------|--------|
| `aspnet.md`         | Minimal APIs, middleware order, dependency injection   | deferred |
| `efcore.md`         | Change tracking, migrations, query plan diagnostics    | deferred (overlap с `../30-ef-core-operational-patterns.md`) |
| `blazor.md`         | Server vs WebAssembly, render modes, state containers  | deferred |
| `mediatr.md`        | Command/query separation, pipeline behaviours          | deferred |
| `xunit.md`          | Theory data, fixtures, async test patterns             | deferred |
| `serilog.md`        | Structured logging, sinks, correlation                 | deferred |
| **`opentelemetry.md`** | ActivitySource registration, ResourceBuilder, kill-switch symmetry, deterministic Activity tests, W3C traceparent | **landed (v6.5.0 PR-6)** |

## Why deferred

See `../README.md` siblings — same reasoning applies. The 1.0 release
ships the structural skeleton + `15-clean-code-csharp.md`; deep-dives
land per-framework over time.

## Contributing

PRs welcome. Follow Diátaxis "explanation" form — opinionated guidance
for an engineer who already has the problem in hand.
