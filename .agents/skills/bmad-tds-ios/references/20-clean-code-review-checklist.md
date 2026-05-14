# iOS clean-code review checklist (self-review)

> **Priority:** P1.
> **Gate level:** advisory; hard только для obvious correctness /
> safety / test-coverage gaps.
> **Load trigger:** iOS story changes Swift production code или tests
> (Verify step). Skip для docs-only / asset-only / configuration-only
> stories.
> **Evidence level:** external-source — Swift API Design Guidelines
> (developer.apple.com), Apple HIG, и adaptation of upstream
> levabond/iOS-clean-code-skills (MIT, attributed в
> `references/15-clean-code-swift.md`).

## Purpose

Compact self-review pass run by iOS specialist в Step 5 «Verify»
before flipping status к `review`. Surfaces five categories of issue
с deliberate severity classification:

- **critical** (hard — block flip к review): correctness, safety,
  test-coverage gaps.
- **warning** (advisory — surface but не block): style / clarity /
  maintainability.
- **suggestion** (advisory — note для auditor): refactor opportunities.
- **positive** (advisory — explicit «good choice» note): non-obvious
  design decisions worth flagging для reviewer context.

Output этого checklist'a fed в `/tmp/self-review-<story>.md`
`**Decisions made:**` / `**Areas of uncertainty:**` sections (Step 5
Verify в SKILL.md).

## Category 1 — naming

- [ ] Function names express intent + side effects? Anti-pattern:
      `processData` / `handleStuff` (опаque). Pattern: `loadUser-
      Profile(id:)` / `dispatchPendingNotifications(after:)`.
- [ ] Type names singular + describe responsibility? Anti-pattern:
      `Utils` / `Helpers` / `Manager`. Pattern: `URLBuilder` /
      `NotificationDispatcher`.
- [ ] Boolean parameters / properties prefix `is*` / `has*` / `should*`?
      `loadAsync` < `shouldLoadAsync`.
- [ ] Argument labels read as English at call site? Swift API design:
      `array.insert(value, at: index)` reads naturally.

Severity: warning по default; critical если name actively misleads
(e.g. `delete` actually marks-as-soft-deleted).

## Category 2 — function shape

- [ ] Function body ≤ 20 lines? If >20, extract one cohesive block.
- [ ] ≤ 2 args? 3+ → wrap в struct / extract context object. Anti-
      pattern: `func send(message: String, to recipient: String,
      from sender: String, with priority: Int, retry: Bool)` →
      pattern: `func send(_ message: NotificationMessage)` где
      struct carries all fields.
- [ ] No Boolean flags? `func render(detailed: Bool)` splits в
      `func render()` / `func renderDetailed()` или separate
      methods. Boolean flags imply two functions glued together.
- [ ] Cognitive complexity ≤ 15? Nested closures / multi-level
      `guard` chains push above 15 fast. If hit cap — extract
      inner block в named helper.
- [ ] Early-exit pattern via `guard` preferred over deeply nested
      `if let` chains.

Severity: warning. Function-size cutoffs report findings — НЕ hard-
fail; refactor follows если bandwidth available.

## Category 3 — side effects

- [ ] Side-effect-free functions marked clearly? Pure functions
      preferred for testability; impure (DB / network / UI) live в
      service types.
- [ ] No `.shared` singletons в domain code? Use protocol-based DI
      so test substitutes inject easily. Singletons OK для
      framework-mandated APIs (`UIApplication.shared`, `FileManager.
      default`) but не для project services.
- [ ] No hidden state — global mutable variables, file-scope `var`,
      or class-internal cache mutated from multiple call sites
      without explicit `@MainActor` / `actor` boundary.
- [ ] `@MainActor` / `actor` / `Sendable` annotations explicit где
      concurrency boundary crossed (Swift 6 strict).

Severity: critical для concurrency safety violations (data race
patterns); warning для singleton-in-domain.

## Category 4 — error handling

- [ ] `throws` over `nil` return where the absence has a reason?
      `func load(id: UUID) throws -> User` > `func load(id: UUID) ->
      User?` если `nil` would mean «something specific went wrong».
- [ ] `Result<Success, Failure>` only когда caller branches differently
      по error type. Otherwise prefer `throws` (less ceremony).
- [ ] Force-unwrap (`!`) ONLY на actually-impossible-nil values
      (e.g. compile-time literal URLs). Production `!` без comment
      explaining why-nil-is-impossible — hard finding.
- [ ] Force-try (`try!`) prohibited в production paths. OK в test
      setup где failure means broken test infrastructure.

Severity: critical для force-unwrap / force-try на user-supplied OR
runtime-determined values; warning для `Result` vs `throws` style
inconsistency.

## Category 5 — state ownership

- [ ] SwiftUI: `@State` for view-local; `@StateObject` (iOS <17) /
      `@Observable` (iOS 17+) для view-model owned by view;
      `@ObservedObject` / `Bindable` для injected; `@Environment`
      для cross-view.
- [ ] UIKit: weak delegate refs to avoid retain cycles. Closure
      captures explicit `[weak self]` где view controller lifecycle
      might end before async completion.
- [ ] Cross-actor state crosses `await` boundary explicitly — no
      `nonisolated(unsafe)` shortcuts без rationale.
- [ ] `@Published` / `@MainActor` ViewModel — UI-mutating properties
      isolated, off-main-actor work goes through `async let` / Task.

Severity: critical для retain-cycle patterns + concurrency state
crossings без proper isolation; warning для wrapper-property choice.

## Category 6 — tests

- [ ] AC coverage: каждый AC item has at least one corresponding
      XCTest case?
- [ ] Test names describe behaviour: `test_dispatch_retriesOnNetwork-
      Failure()` > `test1()`.
- [ ] No shared mutable state across tests (rely on `setUp` /
      `tearDown` или fresh ViewModel instance per test).
- [ ] Async tests await actual completion via `expectation` /
      `XCTestExpectation` / Swift Testing's `async/await`-native API,
      NOT `sleep(...)` или fixed timeouts.
- [ ] Snapshot tests — golden file diff explained (purpose +
      expected updates); не silent overwrites.

Severity: critical для missing AC coverage; warning для test name
clarity / sleep-based async.

## Output template (для `/tmp/self-review-<story>.md`)

```markdown
## Specialist Self-Review

**Decisions made:**
- <key technical choices>

**Alternatives considered:**
- <what was rejected and why>

**Framework gotchas avoided:**
- <e.g. weak/strong cycles, MainActor boundaries, @StateObject vs @ObservedObject>

**Areas of uncertainty:**
- <where reviewer should dig deeper>

**Tested edge cases:**
- <refs к tests covering them>

**Clean-code review pass (categories per `references/20-clean-code-review-checklist.md`):**
- Critical: <list, or "none">
- Warnings: <list, or "none">
- Positives: <non-obvious good design choices worth noting>
```

## Related

- `references/15-clean-code-swift.md` — full Swift clean-code
  principles (Robert Martin + Swift API Design Guidelines + levabond
  attribution).
- Apple Swift API Design Guidelines (developer.apple.com).
- Apple Human Interface Guidelines.
- Cross-language: `bmad-tds-engineer/references/20-di-integration-
  gate.md` — DI / dependency-resolution piece applies to iOS too
  (Swinject containers, factory protocols).
