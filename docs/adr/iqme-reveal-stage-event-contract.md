# ADR: `iqme:reveal-stage` Event Contract

**Status:** Accepted

**Date:** 2026-05-19

**Supersedes:** (none — v1 contract)

## Context

The IQ-ME assessment SPA emits a structured runtime event, `iqme:reveal-stage`, to signal progression through the post-assessment ceremony (the "reveal" — the carefully paced unveiling of the score result, the band interpretation, the methodology handoff, etc.). This event surface is the **load-bearing seam** between the Epic 3 vertical slice (assessment + naive reveal) and Epic 6 (full hardened SPA ceremony, including the five-beat reveal sequence per epic-3 narrative line 412).

If the event surface is reverse-engineered from whatever Epic 3 happens to ship, Epic 6 is forced into rename/restructure churn (the cargo-culted-Epic-2 retrofit failure mode John, Winston, and Amelia called out). To prevent that, the contract is **authored before** the dispatcher code lands (Story 3.5 fires the first events; Story 3.1 — this ADR — pins the shape).

Related contracts:

- `src/assessment/state.schema.json` — state lifecycle drives stage emission (state transitions trigger `iqme:reveal-stage` dispatches).
- `docs/adr/methodology-handoff-url-contract.md` — the `handoff` stage triggers a navigation following that URL contract.

## Decision

### Event identity

- **Event name:** `iqme:reveal-stage` (lowercase, colon-delimited, `iqme:<verb-or-state>` namespace per architecture line 622).
- **Dispatch target:** `document` (NOT `window`; anti-pattern at architecture line 984).
- **`CustomEvent` options:** `{ bubbles: true, composed: false }` (bubbles allows listener attachment at any ancestor; `composed: false` keeps the event scoped to the light DOM tree, which is sufficient because the IQ-ME SPA does not use Shadow DOM).

### `detail` payload — minimum shape

```
{
  stage: <enum>,
  t:     <DOMHighResTimeStamp from performance.now()>
}
```

- `stage`: one of the v1 stage enum values (see below) — additionally, Epic 6 may insert new stage values between or after v1 values per the extension rules below.
- `t`: monotonic timestamp from `performance.now()`. **`Date.now()` is forbidden in this payload** (architecture line 720 eslint rule + line 878 time-discipline mandate). `performance.now()` is NTP-safe (monotonic across the document lifetime), which is the property the Epic 6 event-ordering Playwright test relies on.

Additional fields in `detail` are permitted (Epic 6 will add them), provided they are camelCase and optional. No required field may be added without a v2 contract bump.

### v1 stage enum (fired by Epic 3 code)

The Epic 3 vertical slice MUST fire these stage values:

- `anchor` — pre-reveal "are you ready" beat (per FR13), fired before the score panel becomes visible.
- `handoff` — methodology-handoff click target is made interactive (per FR21).

### Reserved Epic 6 stage values (declared, not fired by Epic 3)

These stages are reserved by this ADR for Epic 6 to fire as part of the five-beat reveal sequence (epic-3 narrative line 412). They are listed here so future-self does not collide with them when adding instrumentation:

- `band` — the cohort-band cue beat.
- `interval` — the credible-interval reveal beat.
- `context` — the contextualizing copy beat.
- `tail-scene` — the tail-scene beat closing the ceremony.
- `methodology-handoff` — the full methodology-handoff beat (NB: distinct from `handoff`; `handoff` is the v1 Epic-3 affordance click moment; `methodology-handoff` is the Epic-6 ceremony beat that precedes it).

### Ordering invariant (load-bearing)

- Stages fire in **declared order** (the order they appear in the canonical sequence: `anchor` → … → `handoff` for Epic 3; `anchor` → `band` → `interval` → `context` → `tail-scene` → `methodology-handoff` → `handoff` once Epic 6 lands).
- A stage **never repeats** within a single session.
- A stage **never skips** (every declared stage fires exactly once, in order).
- The Epic 6 Playwright `reveal-stage` event-ordering test (architecture line 877) enforces this at runtime.

## Consequences

- Story 3.5 (reveal-stage event firing) implements against this ADR directly — it does not get to pick the event name, the dispatch target, the payload shape, or the time source.
- Story 3.2 (`state.js`) coordinates with this ADR via cross-reference in `src/assessment/state.schema.json` `$comment` — the state lifecycle drives stage emission, so any state-transition refactor needs to verify the event-ordering invariant is preserved.
- Epic 6 inherits the v1 enum and extension rules. Any Epic 6 stage insertion follows the rules in the next section.
- Epic 4 (corpus build) is unaffected by this ADR (it does not consume reveal-stage events).

## Epic 6 Extension Rules

Epic 6 MAY:

- Add new stage values **between** declared v1 values (e.g., insert `band` between `anchor` and `handoff`, which is the explicit Epic 6 ceremony plan).
- Add optional camelCase fields to `detail` (e.g., `cohortBand`, `methodologyTargetPath`).
- Wire new listeners on `document` (or any ancestor in the light DOM) without touching the dispatcher.

Epic 6 MUST NOT:

- Rename existing stages (`anchor`, `handoff`, or any reserved stage value).
- Remove existing stages.
- Change `bubbles` or `composed` on the `CustomEvent`.
- Switch dispatch target away from `document` (no migration to `window`, no migration to a private element).
- Switch `t:` away from `performance.now()` (no `Date.now()`, no `Date.now() / 1000`, no high-resolution variant).
- Promote a previously-optional `detail` field to required without a v2 contract bump.

Any deviation from MUST NOT requires a new ADR superseding this one, plus a coordinated migration of all consumer modules.

## Drift consequences

Any change to this contract requires a new ADR superseding this one, plus coordinated PR review across all consumer modules.
