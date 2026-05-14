# EF Core operational patterns

> **Priority:** P0 для EF-Core-touching stories; otherwise conditional
> (do NOT load для non-EF stories).
> **Gate level:** hard for the NoTracking default + write-path
> `.AsTracking()` discipline; conditional for migration rollback
> tests (load when story claims schema reversibility).
> **Load trigger:** story adds OR changes:
> - `DbContext` configuration / registration;
> - LINQ query against `DbSet<T>`;
> - EF migration (`Add-Migration` / `Update-Database`);
> - hot-path bulk update / delete (`ExecuteUpdateAsync` /
>   `ExecuteDeleteAsync`).
> **Evidence level:** external-source (Microsoft EF Core docs) +
> single-project lesson (alcosi).

## Rule 1 — NoTracking by default; explicit `.AsTracking()` for writes

EF Core change tracking is expensive: hydrated entities get attached
к `ChangeTracker`, snapshot copies retained, dirty checking runs on
`SaveChangesAsync`. Read-only queries don't need any of это.

**Recommended pattern — configure NoTracking as default:**

```csharp
// Startup / Program.cs
services.AddDbContext<MyDbContext>(options =>
    options
        .UseNpgsql(connectionString)
        .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));
```

This makes ALL queries no-tracking by default — large-scale read
workloads get the perf win automatically.

**Write paths — opt back в с `.AsTracking()`:**

```csharp
// Read для display — defaults к NoTracking, good.
var users = await _db.Users.Where(u => u.IsActive).ToListAsync();

// Write — must opt back in tracking, иначе SaveChangesAsync
// doesn't see mutations.
var user = await _db.Users
    .AsTracking()                              // ← explicit
    .SingleAsync(u => u.Id == userId);
user.Status = UserStatus.Suspended;
await _db.SaveChangesAsync();
```

**Anti-pattern (silent no-op):**

```csharp
// DbContext defaults к NoTracking. Загруженная entity не tracked.
var user = await _db.Users.SingleAsync(u => u.Id == userId);
user.Status = UserStatus.Suspended;
await _db.SaveChangesAsync();  // ← saves nothing; mutation lost.
```

This silently «works» (no exception), regression slipped через
tests которые mock the DbContext.

## Rule 2 — `FindAsync` is tracking-enabled и thus a write-path tool

`FindAsync(...)` always uses tracking, regardless of context-level
default. Under NoTracking default, calling `FindAsync` for read-only
flow accidentally tracks the entity — confusing pattern читателя.

**Convention:**

- `_db.Set<T>().FirstOrDefaultAsync(x => x.Id == id)` — read path
  (no-tracking default applies).
- `_db.Set<T>().AsTracking().FirstOrDefaultAsync(...)` — write path
  (explicit opt-in).
- `_db.Set<T>().FindAsync(id)` — write path только, и pattern
  обычно used for «load + mutate + save». Don't use для pure reads.

## Rule 3 — Hot-path: `ExecuteUpdateAsync(SetProperty(...))`

For bulk updates touching ≥10 rows OR running на hot path, prefer
EF Core 7+ `ExecuteUpdateAsync` — server-side UPDATE без roundtrip-
through-entities:

```csharp
// EF Core 7+
await _db.Notifications
    .Where(n => n.Status == NotificationStatus.Scheduled
                && n.ScheduledAt <= _clockNow)
    .ExecuteUpdateAsync(s => s
        .SetProperty(n => n.Status, NotificationStatus.Sent)
        .SetProperty(n => n.SentAt, _clockNow));
```

**Anti-pattern (entity-by-entity update):**

```csharp
var due = await _db.Notifications
    .AsTracking()
    .Where(n => n.Status == NotificationStatus.Scheduled
                && n.ScheduledAt <= _clockNow)
    .ToListAsync();
foreach (var n in due)
{
    n.Status = NotificationStatus.Sent;
    n.SentAt = _clockNow;
}
await _db.SaveChangesAsync();  // ← N+1 UPDATEs, N entity snapshots
                               //   loaded, change-tracking overhead.
```

`ExecuteUpdateAsync` skips entity hydration entirely — single SQL
statement, no tracker pressure.

**Caveats:**

- `ExecuteUpdateAsync` runs OUTSIDE the change tracker — entities
  already tracked stay stale. Either use it на untracked queries
  exclusively, or call `_db.ChangeTracker.Clear()` after.
- DB triggers / shadow properties / value converters behave
  differently — verify against actual DB for non-trivial schemas.

## Rule 4 — Migration rollback tests cover schema, not just table names

When story claims «migration reversible» / «rollback safe», test must
verify schema fidelity beyond `dotnet ef database update --target X`
returning 0. Roll forward + roll back + diff schema:

- Tables present matches pre-migration state.
- Columns present + correct types + nullability.
- Indexes present + correct columns/uniqueness/include columns.
- Constraints present (FK / CHECK / UNIQUE / DEFAULT).
- Computed columns / generated columns / sequences preserved.

**Pattern:**

```csharp
[Fact]
public async Task Migration_AddNotificationRetryColumn_RollbackPreservesSchema()
{
    await using var db = await BuildFreshDbAsync();

    // Capture baseline schema fingerprint.
    var baseline = await CaptureSchemaFingerprintAsync(db);

    // Roll forward.
    await db.Database.MigrateAsync();
    // Roll back к previous migration.
    var migrator = db.GetService<IMigrator>();
    await migrator.MigrateAsync("PreviousMigrationName");

    // Schema must match baseline (table + column + index +
    // constraint level).
    var rolledBack = await CaptureSchemaFingerprintAsync(db);
    rolledBack.Should().BeEquivalentTo(baseline);
}
```

`CaptureSchemaFingerprintAsync` — helper enumerating
`INFORMATION_SCHEMA` (Postgres / SQL Server) or `sqlite_master`
(SQLite) и building a deterministic record. Implementation detail
varies; the test contract is invariant.

**Anti-pattern:**

```csharp
// Verifies migration runs both directions, не schema fidelity.
await db.Database.MigrateAsync();
await migrator.MigrateAsync("Previous");
Assert.True(true);  // ← never catches «column dropped с rollback».
```

## Detection (review checklist)

- [ ] DbContext registration — `QueryTrackingBehavior.NoTracking` set?
- [ ] Write-path queries explicitly `.AsTracking()` (или use
      `FindAsync` для write flow)?
- [ ] Bulk update / delete — `ExecuteUpdateAsync` / `ExecuteDeleteAsync`
      preferred over entity-by-entity loop?
- [ ] Migration claims «reversible»? Rollback test verifies schema
      fidelity (columns, indexes, constraints), not just exit code?

## Related

- `references/15-clean-code-csharp.md` — naming + async/await patterns.
- Microsoft EF Core docs: query tracking, ExecuteUpdate/Delete APIs,
  migration tooling reference.
- Cross-language: `bmad-tds-engineer/references/20-di-integration-gate.md`
  — DbContext registration is itself a DI integration concern.
