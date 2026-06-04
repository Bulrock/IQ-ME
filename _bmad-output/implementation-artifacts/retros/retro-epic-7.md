# Retro — Epic 7 (RU/PL localization infrastructure: i18n harness, methodology + tail-scene + crisis mirrors, parity/reading-level gates, dual-approval CODEOWNERS)

- **Scope:** epic-7 — stories 7-1 … 7-8 (9 stories incl. 7-5a/7-5b split, all `done`, squash-merged into `epic/7`, delivered via #15).
- **Retro date:** 2026-06-04
- **Facilitator:** bmad-tds-retro (auditor analysis + writer cross-check)
- **Lessons captured:** 2 (`lesson-2026-06-04-001`, `-002`)
- **Bridge candidates:** 1 accepted (see `## Bridge Plan`); the rest are Gate-9c/9d content-gated (Deferred section).

---

## What went well

- **Cleanest epic to date — zero blockers, zero changes-requested.** All 5 auditor findings across the epic were `[info]` severity; 4 of 9 stories (7-2, 7-3, 7-4, 7-8) drew no findings at all. Nothing red reached `epic/7` or `main`.
- **One design decision propagated cleanly across four content surfaces.** The "infra-now, content-gated-on-9c/9d" decision (`project_iqme_epic7_infra_now_decision`) — ship full-parity EN-placeholder scaffolds carrying a machine-readable `_meta.translationStatus: in-progress` + `sourceHashEN`, never fake human authorship — held identically for i18n string bundles (7-1/7-2), the methodology corpus (7-3/7-4), tail-scenes (7-6), and crisis lists (7-7). The discriminator let every gate stay meaningful without disabling any lint. → **`lesson-2026-06-04-001`**.
- **A committed idempotent generator killed RU/PL duplication.** `tools/scaffold-translation-mirror.mjs` was written in 7-3 and reused verbatim by 7-4 (`--langs=pl`), so the 35-page PL mirror was structurally identical to RU with independent failure isolation (separate tree, reviewer handle, budget) — no copy-paste drift.
- **Safety content was handled with discipline, not schema-filling.** 7-7 refused to fabricate `tel:` hotline numbers (a wrong number is catastrophic for a distressed user); it shipped real internationally-recognized directories (Find A Helpline, IASP) + an explicit pending-vetting entry, FR20 no-EN-fallback preserved, guarded by a frozen test that forbids `tel:` and requires ≥1 https directory. → **`lesson-2026-06-04-002`**.
- **Gates graduated cleanly from their epic-4 no-op stubs.** 7-5b flipped `lint-translation-parity` from the 4.7 no-op stub to a real graduated contract (EN-only now FAILS; tri-locale completeness + matching `sourceHashEN` passes), and 7-5a re-wired `--include-i18n` into `make lint` + pr-checks (un-wired since 4.8). Both graduations landed without regressing the EN FK contract.

## What broke

- **Nothing hard.** No abandoned stories, no blockers, no warns — only info findings. The "what broke" this epic is structural rather than story-level:
- **A test-infra flake recurred under aggregate concurrency.** 7-6 observed a transient `lint-csp-source-coverage` aggregate-only failure when `make`/`lint` ran against the shared working tree concurrently, then self-cleared (not caused by 7-6; no CSP change). It is the same flake class as the design-system AC-6 snapshot issue fixed in 7.5b via tmpdir isolation. → **Bridge B1**.
- **Every quality cap shipped provisional, by construction.** The per-locale reading-level cap (12), the PL Pisarek/Jasnopis FOG-*equivalent* (an approximation, not the proprietary Jasnopis model), the RU/PL microcopy length caps, and the crisis-directory choices are all unexercised against real graded prose — because no real RU/PL clinical-register content exists yet (Gates 9c/9d are `backlog`). These are honestly-flagged provisional constants, tracked in the launch-readiness sign-off docs, not defects. → **Deferred (Gate-9c/9d)**.

## Surprising patterns

- **An epic whose entire finding-set is "re-validate when the gate opens."** 5 of 5 info findings are variants of "this is provisional until Gate-9c/9d real prose lands." That is the expected and *correct* shape of a deliberately content-gated epic: the auditor confirmed the infra is sound and surfaced exactly the deferred-verification points, none of which is actionable before the gates flip. The honest read is that this is **not** a tech-debt cluster for a near-term bridge — it is launch-readiness backlog already enumerated in the sign-off docs.
- **The infra-now decision paid for itself in finding-count.** Forward-designing a stable status discriminator (instead of disabling lints or faking content) meant the auditor never had to choose between "lint is green but meaningless" and "lint is red on absent content." Parity/drift stayed hard-enforced the whole epic; only content-grading deferred. This is the generalizable win captured as `lesson-2026-06-04-001`.

## Lessons captured (linked)

| id | sev | category | one-line |
|---|---|---|---|
| `lesson-2026-06-04-001` | medium | technical | A machine-readable status discriminator (`translationStatus:in-progress` + `sourceHashEN`) keeps a parity/quality lint fully enforced (key parity + hash drift) while human-gated content is deferred — without faking authorship. |
| `lesson-2026-06-04-002` | high | process | Harm-critical placeholder content (crisis hotlines) must never fabricate specifics; ship real internationally-recognized fallback directories + a pending-vetting marker, test-guarded against fabricated `tel:`. |

Pre-existing lessons re-confirmed (not re-captured): `lesson-2026-05-20-003` (forward-design infra stubs with stable contracts) — epic-7 is its largest application; the 7-1 Playwright CI-deferral finding is already covered by `lesson-2026-06-03-001` (per-spec CI wiring) and the deferred-validation-surfaces-post-merge lesson.

## Metrics

- Stories: 9 done / 0 abandoned.
- Findings: 7-1 ×1, 7-2 ×0, 7-3 ×0, 7-4 ×0, 7-5a ×1, 7-5b ×1, 7-6 ×1, 7-7 ×1, 7-8 ×0 → 5 finding-rounds, **all `[info]`; 0 blockers, 0 warns**.
- `app-modules-bytes`: 48128 (epic start) → 59392 (7-6), ~23% growth across the i18n harness + per-locale loaders (each story flagged the anticipated raise).
- `methodology-pages-{ru,pl}` budgets: forward-bumped 30 → 45 + pinned in 7-3/7-4 to accommodate the 35-page mirrors.
- `make test` at delivery: green (1197 pass / 0 fail after 7-7).

---

## Bridge Plan

```yaml
proposed_at: 2026-06-04
type: tech-debt
candidates:
  - title: "Isolate concurrency-sensitive coverage/lint tests to tmpdir"
    justification: >-
      Story 7-6 observed a transient lint-csp-source-coverage aggregate-only
      failure when make/lint ran against the shared working tree under
      concurrency, then self-cleared (no CSP change; not caused by 7-6). It is
      the same flake class as the design-system AC-6 snapshot issue already
      fixed in 7.5b via tmpdir isolation. The recurring surface is coverage/lint
      tests that spawn make/lint against the REAL working tree and can be
      cross-contaminated by a concurrent make run. Scope: audit all such tests,
      isolate each to a per-test tmpdir + env-var output override (the same fix
      the design-system AC-6 and the epic-3 dist/ race already used), so
      concurrent make runs cannot cross-contaminate. Bounded, non-gate-gated,
      and the only actionable tech-debt this epic surfaced. Pairs with the
      existing filesystem-fixture-isolation lesson (per-test mkdtempSync +
      env-var output override).
    sources:
      - story: 7-6-ru-pl-tail-scene-clinical-register-copy-replaces-epic-6-placeholders
        kind: auditor-finding
        round: 1
        finding_index: 1
```

## Deferred (kept here for audit trail — NOT bridge-scope)

All Gate-9c/9d items below are **content-gated on backlog gates** (no named RU/PL clinical-register reviewer yet) and are already enumerated in the launch-readiness sign-off docs created by stories 7-6/7-7. They cannot be actioned in a near-term dev bridge; they light up when the gates flip.

- **Re-calibrate per-locale reading-level caps against real graded prose; reconcile PL Pisarek/Jasnopis approximation against the reference model.** Cap=12 is a named, trivially-re-tunable constant; placeholder content is skipped today. Source: 7-5a finding round-1 #1 (Gate-9c/9d).
- **Reviewer-of-record validates + replaces the interim RU/PL crisis directories with curated vetted lists.** Source: 7-7 finding round-1 #1 (Gate-9c/9d).
- **Named reviewers author the RU/PL tail-scene clinical-register copy + RU/PL microcopy** (replacing the EN placeholders; flip `clinicalRegisterReviewed`/`translationStatus`). Source: 7-6 / 7-1 / 7-2 areas-of-uncertainty (Gate-9c/9d).
- **Partial-locale workflow (downgrade missing-page parity to WARN while keeping orphan + stale-hash as hard fails).** Speculative-only — "if a partial-locale workflow is ever wanted." Re-promote if a genuinely-partial future locale is introduced. Source: 7-5b finding round-1 #1.

## References

- Epic delivered via #15 (`Epic 7: RU/PL localization infrastructure`).
- Governing decision: `project_iqme_epic7_infra_now_decision` (infra-now, content-gated-on-9c/9d).
- Bridge id will auto-derive when assembled via `tds epic create-bridge-from-retros` (next free `bridge-8-9` or accumulated with later retros).

## Applied to bridge: bridge-epic-9a @ 2026-06-04T08:27:44.647Z
