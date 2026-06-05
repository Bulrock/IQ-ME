# Retro — Epic 8 (launch-readiness automation: release.yml deploy + Zenodo/IA/SH archival, scheduled.yml health/parity checks, Codeberg/Cloudflare mirror failover, Playwright trust-verification consolidation, CONTRIBUTING/CHANGELOG/Discussions)

- **Scope:** epic-8 — stories 8-1 … 8-8 (8 stories, all `done`, squash-merged into `epic/8`, delivered via #17).
- **Retro date:** 2026-06-05
- **Facilitator:** bmad-tds-retro (auditor analysis + writer cross-check)
- **Lessons captured:** 2 (`lesson-2026-06-05-001`, `-002`)
- **Bridge candidates:** 3 accepted (see `## Bridge Plan`) — 2 documentation tech-debt + 1 launch-runbook note.

---

## What went well

- **One-pass epic — zero blockers, zero changes-requested.** All 8 stories merged cleanly into `epic/8`; every auditor finding was `warn` or `info` severity (3 findings total across 8-7 and 8-8). Nothing red reached `epic/8` or `main`.
- **In-file deferred-marker handoff chain on a shared workflow file.** Story 8.1 planted `# --- Deferred to Story 8.2 / 8.4 ---` comment markers in `release.yml`, and its frozen structural test asserted both the *active steps' presence* and the *deferred steps' marked-absence*. Story 8.2 (archival) and Story 8.4 (mirror) each replaced their marker with the real steps and graduated the matching test assertion from absence→presence. Four stories edited one shared file with no merge collisions, no scope ambiguity, and a test set that always encoded exactly what was live vs deferred. → **`lesson-2026-06-05-001`**.
- **The dev/launch boundary held identically across every live side-effect.** gh-pages deploy, Zenodo DOI mint, IA Save-Page-Now + Software Heritage snapshots, Codeberg/Cloudflare mirror, and the contributor-credit step were all wired but inert in dev, gated on a `vars.IQME_LIVE_*` repo-variable in the step-level `if:` (not `secrets.*`, which is invalid there). Dev-phase asserted the workflow *steps* structurally; the live execution flips on at launch (Epic 10). → **`lesson-2026-06-05-002`**.
- **Prior lessons applied live, not just filed.** 8.5 landed the pr-checks job activations and the frozen `ci-matrix.test.mjs` graduation **together** (lesson-2026-06-03-002, avoiding the epic-6 self-inflicted-red/misattribution failure mode) and wired the activated jobs **per-spec** rather than via a greedy glob (lesson-2026-06-03-001).
- **Cross-story doc dependencies resolved in-epic.** 8.3 deferred the `docs/scheduled-yml-failure-routing.md` ← CONTRIBUTING.md cross-link to 8.6; 8.6 then shipped it (plus `docs/required-ci-checks.md` enumerating the real current CI job set, including the 8.5 additions). No carry-forward.

## What broke

- **Nothing hard.** No abandoned stories, no blockers, no warns that masked a defect. The only carryovers are honest, documented deferrals:
  - **8.7** — the corpus `/reference/changelog/` page was *not* cross-linked to the root `CHANGELOG.md` (Task 3 explicitly deferred `[-]`): doing so forces a golden-snapshot regen and risks the external-link-policy lint + byte-stable, for optional non-test-gated polish. Disclosed in Completion Notes + the `[warn]` finding, not silently dropped. → **Bridge B1**.
  - **8.8** — the README `## Contributing` line still says the surface is "slim … expanded in Epic 8", which became inaccurate after 8.6 shipped the full `CONTRIBUTING.md`. No test covers that line, so it was left untouched per scope discipline. → **Bridge B2**.

## Surprising patterns

- **An entire epic delivered against external systems with zero live execution in dev.** Every story shipped a launch-critical integration (DOI minting, multi-mirror archival, failover deploy, release automation) yet the dev-phase artifact in each case was a *structural* assertion that the workflow steps exist and are correctly gated — the live side-effect is a single repo-variable flip away at launch. This is the forward-design-infra-stub pattern (`lesson-2026-05-20-003`) taken to its logical end: the whole launch pipeline is test-covered and reviewable months before any live tag push.
- **The `secrets.*`-invalid-in-step-`if:` gotcha is load-bearing.** Because GitHub does not expose `secrets.*` inside a step-level `if:`, gating live steps on secret presence would silently *never fire*. The epic uniformly gated on `vars.IQME_LIVE_*` instead — a small, easy-to-get-wrong detail that determines whether the entire launch automation works. Captured as `lesson-2026-06-05-002`.

## Lessons captured (linked)

| id | sev | category | one-line |
|---|---|---|---|
| `lesson-2026-06-05-001` | low | process | Sequential workflow activation across stories: Story N plants `# Deferred to Story M` markers in a shared CI file + structural tests assert active-present AND deferred-absent-but-marked; Story M replaces the marker and flips the assertion (absence→presence). |
| `lesson-2026-06-05-002` | medium | technical | Gate live external side-effects behind a `vars.IQME_LIVE_*` step-`if:` (`secrets.*` is invalid in a step `if:`); dev asserts the steps structurally, the live run defers to launch. |

Pre-existing lessons re-confirmed (not re-captured): `lesson-2026-05-20-003` (forward-design infra stubs with stable contracts — epic-8 is its purest application); `lesson-2026-06-03-001` (per-spec CI wiring) and `lesson-2026-06-03-002` (baseline-diff before labeling red pre-existing) both applied cleanly in 8.5.

## Metrics

- Stories: 8 done / 0 abandoned.
- Findings: 8-1…8-6 ×0, 8-7 ×2 (`warn` + `info`), 8-8 ×1 (`info`) → **3 findings total; 0 blockers, 0 changes-requested**.
- Review rounds: all 8 story branches merged into `epic/8` one-pass; `epic/8` delivered to `main` via PR #17.
- `make test` growth across the epic: 1220 (8-1) → 1228 (8-2) → 1270 (8-7) → 1275 (8-8) pass / 0 fail; `make lint` exit 0, `make build` deterministic throughout.

---

## Bridge Plan

```yaml
proposed_at: 2026-06-05
type: tech-debt
candidates:
  - title: "Cross-link corpus /reference/changelog/ to root CHANGELOG.md"
    justification: >-
      Story 8-7 deferred (Task 3, marked [-]) the note + relative link from the
      en corpus reference/changelog/ page to the root CHANGELOG.md because it
      forces a golden-snapshot regen and risks the external-link-policy lint +
      byte-stable build for optional non-test-gated polish. The two changelogs
      are documented as distinct (root=dev/release, corpus=citation). Do it in a
      controlled corpus-edit story that owns the golden-snapshot regen + the
      external-link-policy and byte-stable consequences end to end.
    sources:
      - story: 8-7-changelog-md-format-release-yml-automation-contributor-credit-by-handle
        kind: auditor-finding
        round: 1
        finding_index: 1
  - title: "Refresh stale README '## Contributing' framing post-8.6"
    justification: >-
      Story 8-8 honestly disclosed that the README '## Contributing' sentence
      still says the surface is slim and will be expanded in Epic 8 — inaccurate
      now that Story 8.6 rewrote CONTRIBUTING.md into the full guide. No test
      covers that line so it was left untouched per scope discipline. Tiny doc
      fix: drop the 'expanded in Epic 8' framing.
    sources:
      - story: 8-8-github-discussions-link-in-chrome-footer-release-notification-subscription-path
        kind: auditor-finding
        round: 1
        finding_index: 1
  - title: "Launch runbook: reconcile contributor author-name vs real GitHub handle"
    justification: >-
      Story 8-7's contributor-credit job maps git-log author display names to
      handles via git log %an | sed 's/^/@/', which is NOT a guaranteed GitHub
      handle. FR53 (no third-party/social-graph API) is correctly honored and
      the maintainer's release-prep PR review is the real handle-resolution step.
      This is a launch-time (Epic 10) runbook item, not dev tech-debt — recorded
      here so the launch runbook expects the PR-review reconciliation of
      author-name vs real handle before the contributor-credit step goes live.
    sources:
      - story: 8-7-changelog-md-format-release-yml-automation-contributor-credit-by-handle
        kind: auditor-finding
        round: 2
        finding_index: 1
```

## References

- Epic delivered via #17 (`Epic 8: launch-readiness automation`).
- Bridge id will auto-derive when assembled via `tds epic create-bridge-from-retros` (next free `bridge-8-9`, or accumulated with later retros before the next main epic).
- B3 is a launch-runbook (Epic 10) note rather than near-term dev tech-debt; it is carried in the Bridge Plan for traceability but is best actioned in the Epic-10 launch sign-off, not a pre-epic dev bridge.

## Applied to bridge: bridge-9b @ 2026-06-05T11:55:30.126Z
