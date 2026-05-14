# iOS mobile system-design preflight checklist

> **Priority:** P1.
> **Gate level:** advisory — surface checklist findings в `Plan` step;
> hard только когда implementation skips a category that the AC
> explicitly requires (e.g. AC says «works offline» but Plan ignores
> the offline column).
> **Load trigger (conditional — DO NOT load для UI bugfixes / small
> CRUD)**: story touches OR introduces any of:
> - offline-first behaviour (cache, deferred sync);
> - server synchronisation (REST/GraphQL/SSE/WebSocket);
> - networking client construction (URLSession config, retry, certificate
>   pinning);
> - background execution (BGTaskScheduler, silent push, location
>   updates);
> - push notifications (APNs, registration, payload handling);
> - persistent storage (Core Data, SwiftData, Keychain, File-system
>   artefacts);
> - data migration (schema bumps, format conversions, key-store
>   moves);
> - privacy-sensitive data (location, contacts, biometric, health,
>   tracking transparency);
> - mobile API contract design (custom client-server protocol).
> **Evidence level:** external-source after rewrite — Apple
> documentation (HIG, App Programming Guide, BG modes, Privacy
> Manifests) + general mobile engineering practice. Adapted from
> upstream `levabond/ai-mobile-system-design-skills` (originally
> interview-oriented; rewritten к production-checklist form per
> v6.5.0 plan).

## Purpose

iOS stories that touch architectural categories above need explicit
preflight consideration before TDD cycle starts. Without preflight,
common failure modes:

- Offline behaviour assumed «just works»; reality: cache invalidation
  / conflict resolution missing.
- Background task registered, never tested от scheduler dispatch
  perspective — silently no-op'ит в production.
- Storage layer wired без migration plan; v2 of app crashes на v1
  schema.
- Privacy data captured без manifest declaration — App Store reject.

Run этот checklist в Plan step для stories matching load trigger.
Categories below — yes/no questions; explicit «no, not relevant»
beats silent gap.

## Category 1 — offline-first behaviour

- [ ] Does story require functionality когда device offline?
- [ ] If yes: cache layer specified? Cache invalidation strategy
      named (time-based, server push, manual refresh)?
- [ ] Optimistic UI updates на mutations? Conflict resolution when
      server reconciles?
- [ ] Reachability handling: graceful degradation messaging vs.
      silent retry?

Apple references: `URLSessionConfiguration.waitsForConnectivity`,
`NWPathMonitor`, Core Data NSPersistentCloudKitContainer for
sync-aware persistence.

## Category 2 — server synchronisation

- [ ] Sync direction: client → server, server → client, или
      bidirectional?
- [ ] Conflict resolution policy: last-write-wins, server-authoritative,
      CRDT, или domain-specific merge?
- [ ] Delta sync (since-timestamp / sync-tokens) или full-page
      reload?
- [ ] Partial-failure handling: какие операции idempotent retry,
      какие требуют manual recovery prompt?
- [ ] Backoff policy: exponential? Jitter? Max retries?

Pattern: `AsyncSequence` + token-based pagination для server-driven
sync; explicit per-resource sync state в Core Data / SwiftData.

## Category 3 — networking client

- [ ] HTTPS only? `App Transport Security` declaration в
      Info.plist matches actual endpoint set?
- [ ] Certificate pinning required (high-security apps)? If yes,
      `URLSessionDelegate.urlSession(_:didReceive:completionHandler:)`
      implements pinning?
- [ ] Authentication: bearer token storage (Keychain, not
      UserDefaults), refresh flow, 401-response retry chain?
- [ ] Request timeout вырваном — `URLSessionConfiguration.
      timeoutIntervalForRequest` set explicitly (default 60s often
      wrong)?
- [ ] Cancellation propagation: `Task` cancellation reaches
      `URLSessionDataTask.cancel()`?

## Category 4 — background execution

Apple background categories — each requires explicit Info.plist
declaration AND explicit registration code AND testable invocation:

- [ ] `BGTaskScheduler` (BGAppRefreshTask / BGProcessingTask)?
      Identifier declared в `BGTaskSchedulerPermittedIdentifiers`
      Info.plist key?
- [ ] Silent push (`content-available: 1`)? `aps-environment`
      entitlement set? Background fetch mode toggled в capabilities?
- [ ] Location updates background mode (sparingly — privacy
      surface)? Justification documented в App Store metadata?
- [ ] Test plan: how does developer trigger background task для
      verification (debug pause + `e -l objc -- (void)[[
      BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWith
      Identifier:@"..."]` lldb invocation)?

## Category 5 — push notifications

- [ ] APNs registration: production + sandbox certificates / token
      provisioned?
- [ ] User permission request copy approved (UX writer review)?
      Provisional authorization considered (deliver quietly,
      promote later)?
- [ ] Payload schema versioned? Backward compat strategy для users
      на старых app versions?
- [ ] Critical alerts entitlement (если bypassing Focus modes)?
- [ ] Token refresh handling: `application(_:didRegisterForRemote
      NotificationsWithDeviceToken:)` syncs к server backend?

## Category 6 — persistent storage

- [ ] Storage class chosen explicitly: UserDefaults (small prefs
      ≤512KB), Keychain (secrets), Core Data / SwiftData
      (relational), file-system (large blobs / media)?
- [ ] Encryption at rest: NSFileProtection class set appropriately
      (`complete`, `completeUnlessOpen`, `completeUntilFirstUser
      Authentication`)?
- [ ] Backup posture: should this data appear в iCloud / iTunes
      backup? `URLResourceKey.isExcludedFromBackupKey` for transient
      caches?
- [ ] Quota management: how does app behave when storage budget
      reached?

## Category 7 — data migration

- [ ] Schema versioned (model version, migration mapping, или
      lightweight migration eligibility)?
- [ ] Lightweight migration validated через actual run против
      previous-version DB snapshot (not just `requiresMigration`
      check)?
- [ ] Heavyweight migration: mapping model written + tested на
      realistic data volume?
- [ ] Failure mode: corrupt DB / failed migration — app crashes,
      shows recovery UI, или wipes data?
- [ ] Keychain migration (app group changes, account-name
      changes): explicit move logic + cleanup of old keys?

## Category 8 — privacy

- [ ] Apple Privacy Manifest (`PrivacyInfo.xcprivacy`) declares
      every data category collected?
- [ ] Required reason API declarations (file timestamps, system
      boot time, disk space, UserDefaults, active keyboard list)?
- [ ] App Tracking Transparency: `ATTrackingManager.request
      TrackingAuthorization` flow needed?
- [ ] Sensor permissions (camera, microphone, location, health)
      have usage description strings approved для clarity?
- [ ] On-device-only vs. server-transmitted distinction documented
      per data category?

Apple ref: Privacy Manifests required for App Store submission
(rolling effective dates per data category).

## Category 9 — mobile API contract

- [ ] If app introduces custom protocol с backend: contract
      versioned (`/v1/...`, header, or capability negotiation)?
- [ ] Backward compatibility plan для users на older app versions?
- [ ] Forced-update mechanism если protocol breaks?
- [ ] Idempotency keys for mutations? Server-side dedup window?
- [ ] Pagination / limit / order semantics explicit (clients
      hard-code page size at peril)?

## Output template (для Plan step)

```markdown
## Mobile system-design preflight (per references/30-mobile-system-design-checklist.md)

| Category | Relevant? | Plan |
|---|---|---|
| 1 Offline-first | yes/no/N-A | <how addressed, or «N-A because ...»> |
| 2 Server sync | yes/no/N-A | ... |
| 3 Networking client | yes/no/N-A | ... |
| 4 Background execution | yes/no/N-A | ... |
| 5 Push notifications | yes/no/N-A | ... |
| 6 Persistent storage | yes/no/N-A | ... |
| 7 Data migration | yes/no/N-A | ... |
| 8 Privacy | yes/no/N-A | ... |
| 9 Mobile API contract | yes/no/N-A | ... |
```

Explicit «N-A because X» beats silent gap — auditor sees the row
addressed.

## Severity classification

- **Hard finding** (block Plan completion): AC explicitly requires
  category capability и Plan row reads «N-A» / blank. E.g. AC
  «works offline», Plan row 1 «N-A» → blocker.
- **Advisory finding**: Plan row addressed but shallow («handle
  offline» без cache invalidation strategy). Auditor will surface
  during code review; не block Plan.
- **Suggestion**: cross-category interactions worth noting (e.g.
  «row 4 background sync + row 8 privacy: background location use
  requires extra App Store justification»).

## Anti-patterns

- **Filling rows in retro**: checklist run after impl — too late
  для design decisions. Run в Plan step.
- **«Everything N-A» for non-trivial story**: pattern of dismissing
  все categories — sign that story scope не matches load trigger
  (skip checklist entirely) или specialist скрывает gaps. Auditor
  pushes back.
- **Plan column copy-pastes the question**: «Cache invalidation
  strategy named» → Plan row says «cache invalidation strategy» —
  не actual plan, just rephrasing the prompt. Plan column must
  contain the actual decision.

## Related

- `references/15-clean-code-swift.md` — Swift idioms applied к
  implementation phase.
- `references/20-clean-code-review-checklist.md` — Verify-step
  self-review; mobile system-design findings cross-reference here
  для concurrency / state-ownership categories.
- Apple Human Interface Guidelines.
- Apple App Programming Guide.
- Apple Privacy Manifests documentation.
- Apple Background Modes documentation.
