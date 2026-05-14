# Coverage thresholds (TDS defaults)

> **Purpose.** Authoritative coverage thresholds + mutation-audit policy
> для test-author phase. Used by TEA test-review verdict + по test-author
> когда AC coverage matrix verifies.
>
> **Override pattern.** Per-team thresholds via
> `_bmad/custom/bmad-tds-test-author.toml` `additional_resources` block.
> Team override **replaces** TDS-defaults для overlapping metrics
> (last-write-wins per metric, not append).

## Default thresholds

### Line / branch coverage

| Tier | Threshold | Applies to |
|---|---|---|
| **Default** | ≥ 80% line coverage | All production code unless tier override matches |
| **Security/integrity-critical** | ≥ 95% line coverage + ≥ 90% branch coverage | Auth, crypto, parsing, state-machine, financial calc, RBAC |
| **UI / view layer** | ≥ 60% line coverage | Pure render code (heavy uses E2E tests instead) |
| **Generated code** | excluded | Migrations, protobuf-generated, `.d.ts` |

### Why tiered (not flat)

Flat ≥ 80% либо too lax (security paths under-tested) либо too strict (UI render code disproportionately costly). Tiered approach lets TDS focus testing effort где risk highest.

## Security/integrity-critical patterns

Files matching эти glob patterns automatically classified `security_critical_min = 95`:

```
**/auth/**
**/authn/**
**/authz/**
**/crypto/**
**/security/**
**/parsing/**
**/jwt*
**/oauth*
**/state-machine/**
**/billing/**
**/payment/**
```

Per-language additions (override через `additional_resources`):
- Python: `**/migrations/**` (Django/Alembic) — usually generated, exclude.
- C#: `**/Crypto/*Provider.cs`.
- Java: `**/security/*Filter.java`, `**/SecurityConfig.java`.
- Frontend: `**/auth/AuthGuard.{ts,tsx}`, `**/utils/sanitize*.ts`.
- iOS: `**/Keychain/*Service.swift`, `**/Crypto/*Provider.swift`.
- Android: `**/security/*Fragment.kt`, `**/util/Encrypt*.kt`.

## Mutation-audit (Stryker etc.)

Line coverage measures **execution**, not **assertion strength** — mutation audit catches «covered but не verified» gap.

### Default mutation thresholds

| Tier | Threshold | Tool |
|---|---|---|
| **Security/integrity-critical** | ≥ 90% covered-mutation score | Stryker (JS/TS/C#), mutmut (Python), PIT (Java), Mull (C++) |
| **Default** | ≥ 70% covered-mutation score (recommend; warn-only) | same |
| **UI render** | exempt (unstable mutators, low signal) | — |

«Covered-mutation score» — mutants killed / (mutants killed + mutants survived). Excluded mutants (timed-out, no-coverage, equivalent) считаются как denominator-included для total score, separately reported.

**Why covered-score, не total:** total score includes uncovered mutations (lines never executed by tests) — это уже tracked by line coverage. Covered-score isolates assertion-strength signal: «of executed lines, какая доля mutations did tests catch?»

### When mutation-audit runs

- **CI:** on every PR touching security/integrity-critical paths (incremental — only changed files).
- **Test-author phase Step 6 (test-review verdict):** TEA-side validation для critical paths, optional для default-tier (configurable).
- **Pre-release:** full-suite mutation audit на критических modules.

## Coverage delta on PR

| Rule | Default |
|---|---|
| Story should not **decrease** total coverage | mandatory (story rejected if delta < 0) |
| Story should add coverage to new code | ≥ 80% per AC (не cumulative) |
| Untested AC | story rejected (TEA test-review verdict) |

## What NOT to gate on coverage

- **Display files** (templates, JSX render functions без logic) — minimal value.
- **Bootstrap / DI registration** (`appsettings.json` parsing, container.Register(...)).
- **Trivial getters/setters** (without business logic).
- **Auto-generated** (migration, ORM mapper, protobuf compile output).

These are **tracked** but exempt from threshold gate — coverage report shows them as «exempt» rather than «failing».

## Override examples

**Lower threshold for ML training pipelines** (long-running, expensive to mock):
```markdown
# team-coverage-thresholds.md
## ML-specific tier
- Pipeline orchestration code (DAG definitions): ≥ 50% (heavy E2E coverage instead)
- Training loops: exempt from line coverage; mutation audit on loss-function only.
```

**Stricter threshold для fintech production:**
```markdown
- **Default tier:** ≥ 90% line coverage (vs TDS-default 80%).
- **Critical tier:** ≥ 98% line coverage + ≥ 95% branch + ≥ 95% mutation.
```

## Cross-references

- `forbidden-patterns.md` — quantity vs quality (high coverage с forbidden patterns ≠ good).
- `framework-recipes.md` — coverage tooling per stack (vitest c8, pytest-cov, JaCoCo, etc.).
- `ac-mapping-rules.md` — AC-to-test traceability как complementary signal.
- Per-language overrides в `bmad-tds-<lang>/customize.toml workflow.coverage` block.
