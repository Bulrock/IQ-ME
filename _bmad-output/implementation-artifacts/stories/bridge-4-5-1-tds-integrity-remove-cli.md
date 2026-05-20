---
id: bridge-4-5-1-tds-integrity-remove-cli
title: "Story bridge-4-5-1-tds-integrity-remove-cli: tds integrity-remove CLI + sweep auto-clean + cross-repo entry policy decision"
status: approved
---

# Story bridge-4-5-1-tds-integrity-remove-cli: tds integrity-remove CLI + sweep auto-clean + cross-repo entry policy decision

## Story

Consolidates epic-3 B1, epic-4 B1, epic-4 B2 — all three target integrity-manifest hygiene and the same state-manifest.yaml + sweep heuristic surface. Pattern established across three consecutive retros (bridge-1-2, epic-3, epic-4). Scope: (1) add `tds integrity remove --files=<path> --reason=<text>` subcommand; (2) teach state-sweep to auto-record spec-md whose bytes changed since last record AND skip re-recording paths whose on-disk file is absent; (3) commit cross-repo entry policy decision and apply it to `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` (three options: remove via new CLI / formalize external/ prefix policy / explicit carry-until-upstream-PR). Must land BEFORE Epic-5 — sweep noise S/N degrading.

## Sources (deferred from)

- `3-2-implement-state-js-contract-test` (kind=auditor-finding, round=1, finding_index=1)
- `3-2-implement-state-js-contract-test` (kind=auditor-finding, round=2, finding_index=1)
- `4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit` (kind=auditor-finding, round=1, finding_index=1)
- `4-1-implement-subset-markdown-renderer-build-methodology-pipeline-with-per-corpus-release-re-emit` (kind=completion-note) — Two legacy tests (AC-8.1 / scaffold AC-9) unfrozen + assertions updated to Story-4-1 HTML shape; integrity=88 verified / 3 pre-existing failures

## Acceptance Criteria

1. **CLI affordance — `tds integrity remove`.** A new subcommand `tds integrity remove --files=<path>[,<path>...] --reason=<text> --as=engineer` exists in the `bmad-tds-module` repo. It removes the named entries from `_bmad-output/_tds/state-manifest.yaml`'s `entries:` array (matched by `file:` field), prints a one-line confirmation per removed entry, and exit-0 on success. Unknown paths exit non-zero with a usage error listing the unmatched paths. Reason text is appended to the JSONL event log (same shape as other mutating CLI calls).
2. **Sweep auto-records changed spec-md.** `tds state-commit` (workflow-level sweep handler) detects any `_bmad-output/implementation-artifacts/stories/**.md` whose on-disk sha256 differs from the most recent `recorded_at` entry in `state-manifest.yaml` and re-records it in the same aggregate commit. After a `tds story add-finding` + sweep round, `tds integrity verify --as=auditor` returns `failed=N` not `failed=N+1` for that spec.
3. **Sweep skips absent files.** Same sweep handler also detects any entry in `state-manifest.yaml` whose `file:` no longer exists on disk and leaves it alone (does NOT auto-remove — explicit `tds integrity remove --reason=...` is the only removal path, preserving auditability). However, `tds integrity verify` continues to surface the missing entry as a failure so the operator knows recovery is required.
4. **Cross-repo entry policy decided + applied.** A short policy note (1-3 paragraphs) lands in `bmad-tds-module/docs/cross-repo-integrity-policy.md` (or the closest existing docs surface in that repo) committing to one of three options for sibling-project entries: (a) remove the offending entry via the new `tds integrity remove --reason=cross-repo-cleanup` and forbid future cross-repo records; (b) formalize an `external/` prefix convention; (c) "carry until upstream PR" with an explicit checklist item. The chosen policy is applied to the existing IQ-ME drift entry `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` so that `tds integrity verify --as=auditor` in `IQ-ME` returns at most 1 remaining out-of-scope failure (`tests/golden/regenerate.R`, which is its own re-record concern not covered by this story).
5. **Regression coverage in `bmad-tds-module`.** New unit + scaffold tests in `bmad-tds-module` cover: (a) `tds integrity remove` removes one entry, leaves others; (b) `tds integrity remove` errors on unknown path; (c) sweep-handler re-records a spec-md after byte-change (uses fixture story-md whose bytes are mutated mid-test); (d) sweep-handler does NOT silently remove a missing-file entry (asserts the entry still present + `integrity verify` still reports it).
6. **IQ-ME drift inventory shrinks.** After the policy from AC-4 is applied, `tds integrity verify --as=auditor` in IQ-ME returns either `failed=0` or `failed=1` (only `tests/golden/regenerate.R` remaining; addressing that is out-of-scope and tracked separately as an Epic-5 action item). Pre-existing entry for `tests/scaffold/story-3-1-marker.test.mjs` already resolved by 3-2/round-1 direct-edit; this story does not need to re-do that work.

## Tasks / Subtasks

- [x] **Task 1 — write failing tests in `bmad-tds-module`** covering AC-5 (CLI happy-path + error path; sweep re-record + sweep keeps missing entry). Verify they fail against current `main`.
- [x] **Task 2 — implement `tds integrity remove` subcommand** in `bmad-tds-module` (CLI dispatch + state-manifest entry removal + JSONL event emission + `--reason` propagation). Make Task 1's CLI tests pass.
- [x] **Task 3 — extend `tds state-commit` sweep handler** to (a) auto-re-record spec-md byte-changes since last record, (b) leave missing-file entries untouched. Make Task 1's sweep tests pass.
- [x] **Task 4 — author cross-repo policy doc** in `bmad-tds-module/docs/` (or chosen surface). Decide between options (a)/(b)/(c) — recommend (a) "remove + forbid" for simplicity unless inventory shows recurring need. Record the decision in the doc.
- [x] **Task 5 — apply policy to IQ-ME drift entry** for `../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts` via the new `tds integrity remove --reason=cross-repo-cleanup-policy` (or whatever the chosen option dictates). Verify IQ-ME `tds integrity verify --as=auditor` reports the smaller failure set (AC-6).
- [x] **Task 6 — integration verification.** Run `tds integrity verify` in both repos post-change. Run a `tds story add-finding` + `tds state-commit` cycle on a throwaway IQ-ME spec to confirm sweep re-records bytes (AC-2). Confirm no test regressions in either repo (`make test` IQ-ME side; `bmad-tds-module` test suite).

## Dev Agent Record

### Agent Model Used

engineer (general-purpose, TypeScript/Node/vitest in `bmad-tds-module`; CLI invocation + policy application in IQ-ME).

### Completion Notes List

- **Scope partition (Option A per user pick):** Tasks 1-4 implemented in `../bmad-tds-module` on branch `feat/integrity-remove-and-sweep-autorecord` (commits 848fd1a, a3a7298). Tasks 5-6 + bundle bump executed in IQ-ME on `story/bridge-4-5-1-tds-integrity-remove-cli`. The sibling-repo changes ship via that repo's normal PR/release flow; IQ-ME consumes via temporary bundle bump on this epic branch.
- **AC-1 implementation:** `removeIntegrity` core function in `src/integrity/index.ts`; atomic on unknown paths (whole call fails, no partial removal); CLI handler branch in `src/cli/handlers/integrity.ts`; `INTEGRITY_SUBCOMMANDS` extended in `src/cli/shared.ts`; emits `kind: remove` event with `reason` audit field.
- **AC-2 implementation:** `autoRecordDriftedSpecs` helper added to `src/state/commit-sweep.ts`. Invoked from `sweepStateCommit` BEFORE path collection so the manifest mutation lands in the same aggregate commit. Scoped to `_bmad-output/implementation-artifacts/stories/**.md` only — retros/, archive/, other paths untouched.
- **AC-3 enforcement:** `autoRecordDriftedSpecs` explicitly skips missing-file entries (`if (!existsSync(absPath)) continue;`). `verifyIntegrity` already surfaces missing entries as failures with `actualSha256: "<missing>"`. No silent removal.
- **AC-4 decision:** Option (a) "remove + forbid" — documented in `_docs/cross-repo-integrity-policy.md`. Rejected (b) and (c) because integrity registry was never designed to sha-track paths outside `projectRoot`; future hardening via `assertPathAllowed` is documented but out-of-scope.
- **AC-5 coverage:** 18 new tests across `src/integrity/__tests__/remove.test.ts` (7), `src/cli/__tests__/integrity-remove-cli.test.ts` (6), `src/state/__tests__/commit-sweep-autorecord.test.ts` (5). All green; sibling-repo full suite 1358/1359 pass (1 pre-existing preflight test failure unrelated to this story, verified via stash-on-main reproduction).
- **AC-6 verification:** Pre-policy IQ-ME `tds integrity verify` reported `failed=5`. After applying policy via `tds integrity remove --files=../bmad-tds-module/src/cli/__tests__/bridge-1-2-1-unfreeze-tests.test.ts --reason=cross-repo-cleanup-policy` + running `tds state-commit` (which exercised the AC-2 sweep auto-record for two story-spec drift entries) + removing the stale `tests/scaffold/story-3-1-marker.test.mjs` entry, post-policy state is `verified=114 failed=1` with only `tests/golden/regenerate.R` remaining (Epic-5 follow-up).
- **Stale scaffold-marker note:** The spec text claimed `tests/scaffold/story-3-1-marker.test.mjs` was "already resolved by 3-2/round-1 direct-edit" but the manifest still contained the entry (file missing on disk). Removed via the new CLI with reason `"stale registry entry — file already removed during 3-2 round-1 direct-edit per bridge-4-5-1 AC-6 narrative"`. The design intent (registry hygiene) is preserved; the spec narrative's assumption about manifest state was outdated.
- **IQ-ME test regression check:** `make test` 683/684 pass, 1 skipped, 0 fail. One transient flake observed in `lint-csp-source` test 199 — unrelated to bridge-4-5-1; reproduced and disappeared on re-run.
- **Bundle bump on epic branch:** `_bmad/tds/shared/tds-runtime.bundle.js` + `.sha256` updated from sibling-repo `payload/shared/` to make the new CLI usable in IQ-ME ahead of the bmad-tds-module npm release. Commit message marks this as temporary; superseded by next formal release.

### File List

- `../bmad-tds-module/src/integrity/index.ts` — new `removeIntegrity` function (export).
- `../bmad-tds-module/src/cli/handlers/integrity.ts` — new `remove` subcommand branch; imports `removeIntegrity`.
- `../bmad-tds-module/src/cli/shared.ts` — `INTEGRITY_SUBCOMMANDS` extended with `"remove"`; USAGE help text surfaces new subcommand.
- `../bmad-tds-module/src/state/commit-sweep.ts` — `autoRecordDriftedSpecs` helper added; called from `sweepStateCommit` before path collection.
- `../bmad-tds-module/src/integrity/__tests__/remove.test.ts` — 7 unit tests covering `removeIntegrity`.
- `../bmad-tds-module/src/cli/__tests__/integrity-remove-cli.test.ts` — 6 CLI dispatch tests.
- `../bmad-tds-module/src/state/__tests__/commit-sweep-autorecord.test.ts` — 5 sweep auto-record + skip-missing tests.
- `../bmad-tds-module/_docs/cross-repo-integrity-policy.md` — new policy doc (AC-4).
- `../bmad-tds-module/_docs/INDEX.md` — added policy doc to Living docs section.
- `../bmad-tds-module/payload/shared/tds-runtime.bundle.js` + `.sha256` + `payload/module.yaml` — bundle rebuild artefacts (committed in sibling repo only).
- `_bmad-output/_tds/state-manifest.yaml` — two `integrity remove` calls + sweep auto-record of two story-spec drifts.
- `_bmad/tds/shared/tds-runtime.bundle.js` + `.sha256` — bundle bump on epic branch (temporary pre-release).

## Specialist Self-Review

**Decisions made:**

1. **`removeIntegrity` is atomic on unknown paths** (throws if any listed path absent in manifest, leaves manifest untouched). Rationale: partial removal has no sane semantics for operator audit — if `remove --files=a,b` removed `a` then errored on `b`, the operator can't safely retry without first reading the manifest. Atomic-fail makes the call idempotent (retry after fixing typo).
2. **Cross-repo policy chose Option (a) "remove + forbid"** over Options (b)/(c) in the AC-4 doc. Rationale: the integrity registry was never designed to sha-track files outside `projectRoot` — `_archive/` recovery has no story for `../`-prefixed paths, and "carry until upstream PR" becomes audit debt that compounds. Option (a) is the only one that doesn't normalize a pattern we'll regret.
3. **AC-2 sweep auto-record scoped to `stories/**.md` only** (not retros/, not archives/). Rationale: the spec text explicitly named that subdirectory; broader scope risks tampering with retros/archive snapshots that should be frozen. If retros need auto-record later, that's a separate decision with its own AC.
4. **Bundle bumped in-place on epic branch** (not waiting for bmad-tds-module npm release). Rationale: Task 5 requires the new CLI; deferring would split the story across two releases. The bundle bump commit message + Story-Id trailer make the temporary-pre-release nature explicit; next release supersedes naturally.

**Alternatives considered:**

- **Soft-fail on unknown path in `remove`** (warn + remove the rest). Rejected for atomicity reason above.
- **Auto-remove missing-file entries in sweep** instead of just leaving them. Rejected per AC-3 explicit design intent — preserving auditability means explicit removal only. The cost: operator must run `integrity remove` for ghost entries; the value: no silent registry mutation.
- **Allowlist-level enforcement of `projectRoot` scoping** (compile-time gate, reject `../` paths in `assertPathAllowed`). Documented as future-hardening in `_docs/cross-repo-integrity-policy.md` but explicitly out of scope for bridge-4-5-1 — convention + review is enough until a second offence appears.

**Framework gotchas avoided:**

- `emit()` wraps event payload under `event:` key (envelope shape: `{stream, schema_version, ts, seq, event}`); test assertions must look at `e.event.kind` not `e.kind`. Found this via the integrity-events.jsonl read in the first test failure; fixed in `remove.test.ts`.
- `proper-lockfile` + `write-file-atomic` (used in `writeManifest`) need `realpath:false` because the manifest file may not exist yet on first write. Followed the pattern from `recordIntegrity` to avoid ENOENT.
- `parseYaml` returns `null` (not empty doc) when the file is empty; `commit-sweep.ts` `autoRecordDriftedSpecs` guards both `doc === null` and `!Array.isArray(doc.entries)` before mutating.

**Areas of uncertainty:**

- **Should `--reason` be free-form or constrained to a small enum?** I went with free-form (consistent with `accept`/`recover`). If audit-trail analytics later wants to bucket reasons, a `--reason-tag=<enum>` could be added without breaking — orthogonal to current API.
- **Is the sweep auto-record `recorded_by` value of `"state-commit-autorecord"` discoverable?** It's a synthesized role string (not a real authz row). Auditor might be confused why no telemetry event mentions this actor. Maybe emit a synthetic `kind: "autorecord"` integrity event in the future. Not done in this story to keep scope tight.
- **The `tests/scaffold/story-3-1-marker.test.mjs` removal** — spec said this was "already resolved by 3-2/round-1 direct-edit", but the manifest still contained it. I removed it via the new CLI with a self-documenting reason. If the spec author intended a different remediation, this could be revisited; but the design intent (registry hygiene) was clearly served by removal.

**Tested edge cases:**

- Atomic-fail on unknown path: `remove.test.ts` "throws on unknown path, leaves manifest untouched" + "throws on mixed known+unknown — no partial removal (atomic)" (both verify byte-for-byte manifest equality after rejected call).
- Empty reason: `remove.test.ts` "requires non-empty reason (audit field)" + CLI-level same.
- Missing file: `remove.test.ts` "succeeds even when on-disk file is missing (registry-only removal)" — explicit coverage that `remove` operates on the registry, not the filesystem.
- Sweep auto-record with no drift: `commit-sweep-autorecord.test.ts` "no-op when on-disk spec matches manifest sha".
- Sweep with mixed drift + missing entry: same suite, "missing entry + drifted entry: drift re-recorded, missing left alone".
- Scope restriction: `commit-sweep-autorecord.test.ts` "auto-record applies only to stories/**.md (not retros/, not other paths)".
- JSONL audit trail: `remove.test.ts` "emits integrity-events `kind: remove` telemetry" + CLI-level event-log inspection.

---
Generated by `tds epic create-bridge-from-retros` for bridge `bridge-4-5` (blocks `epic-5`).

## Auditor Findings (round-1)

### [info] `tds state-commit` sweep auto-record (AC-2 implementation) scopes mutation
to `_bmad-output/implementation-artifacts/stories/**.md` only. Observed at
review time: `_bmad-output/implementation-artifacts/sprint-status.yaml`
drifts after every story status flip and is not auto-re-recorded by the
sweep, surfacing as `tds integrity verify` failure (expectedSha256
66f9756c... vs actualSha256 914f35da... in post-bridge-4-5-2 state).
Specialist Self-Review decision #3 deliberately narrowed scope to avoid
retros/archive tampering, which is correct — but `sprint-status.yaml` is
a known high-mutation workflow artefact that sits outside `stories/**.md`
and is the natural next-scope candidate.


- **Category:** sweep-scope
- **Suggested fix:** Out of scope for bridge-4-5-1 (would expand AC-2 surface). Capture as
bridge candidate for next retro.

- **Suggested bridge:** `Extend `autoRecordDriftedSpecs` sweep handler to also cover the single
well-known path `_bmad-output/implementation-artifacts/sprint-status.yaml`
(or a small allowlist of workflow-mutated state-yaml files). Keeps retros/
archive frozen per current decision; closes the observed drift class.
`
- **Bridged to:** `bridge-5-6-1-extend-sweep-auto-record`

## Auditor Findings (round-2)

### [info] Specialist Self-Review (Areas of uncertainty #2) flagged that sweep
auto-record uses synthesized `recorded_by: "state-commit-autorecord"`
role string in the manifest, but emits no matching telemetry event in
`integrity-events.jsonl`. Future auditor reading the manifest will see
a mutation with no JSONL counterpart and have to infer it came from the
sweep. Honest self-disclosure; not security/integrity-critical because
the manifest itself carries the `recorded_by` attribution.


- **Category:** observability
- **Suggested fix:** Out of scope for bridge-4-5-1 — orthogonal observability concern.
Capture as bridge candidate.

- **Suggested bridge:** `Emit `kind: autorecord` (or equivalent) integrity event from
`autoRecordDriftedSpecs` so JSONL audit trail mirrors the manifest
mutation. Aligns with the existing `kind: record` / `kind: remove`
pattern.
`
- **Bridged to:** `bridge-5-6-1-extend-sweep-auto-record`
