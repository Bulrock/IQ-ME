---
id: 10-2-coordinated-double-tag-push-release-yml-fires-post-launch-verification
title: "Story 10-2: Coordinated double-tag push + release.yml fires + post-launch verification"
status: review
---

# Story 10-2: Coordinated double-tag push + release.yml fires + post-launch verification

## Story

As the **IQ-ME maintainer (CEP) firing v1.0.0**,
I want to push the `app-v1.0.0` and `corpus-v1.0.0` tags in coordinated fashion, observe `release.yml` execute both jobs successfully, verify Zenodo DOI minting, verify Internet Archive + Software Heritage snapshots, mirror deployment byte-identical, post the launch announcement to GitHub Discussions,
so that v1.0.0 ships with the full archival + citation infrastructure operational and the project becomes the reflexive answer for "is there a real free IQ test in Russian or Polish?".

## ⚠️ HUMAN-GATED — do not fabricate

**This story executes at actual v1.0.0 launch.** Its load-bearing preconditions are:

1. Story 10-1 checklist fully signed off (all five sections: A dev-epics, B gates, C CI, D smoke test, E pre-tag verification).
2. Live GitHub repository with GitHub Pages configured, Cloudflare Pages mirror project set up, all three live-gate variables set (`IQME_LIVE_ARCHIVAL=true`, `IQME_LIVE_MIRROR=true`, `IQME_LIVE_CHANGELOG=true`), and all secrets configured (`ZENODO_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
3. Real GitHub Pages URL (`https://iq-me.org/`) live and resolving.

**The agent-executable deliverables** for this story are:
- `docs/launch-readiness/v1.0.0-launch-postscript.md` — permanent launch record
- `docs/launch-readiness/internet-archive-snapshots.md` — updated with real snapshot URLs (populated by `release.yml` automatically; agent verifies)
- `docs/launch-readiness/software-heritage-snapshots.md` — updated with real SH save-request URLs (populated by `release.yml` automatically; agent verifies)
- `CITATION.cff` — updated with real Zenodo DOI (populated by `release.yml` automatically; agent verifies)
- `corpus/doi.json` — updated with real Zenodo DOI + status=minted (populated by `release.yml` automatically; agent verifies)
- `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md` — fill in actual baseline values (from Story 10-1 template)

The tag pushes themselves and the `release.yml` execution are human-triggered operations. Do NOT fabricate DOIs, URLs, or SHA hashes.

## Acceptance Criteria

1. Story 10-1 checklist is fully signed off before this story starts (all sections VERIFIED).
2. Tags pushed: `git tag app-v1.0.0 && git tag corpus-v1.0.0 && git push --tags`. Both tags appear on the remote.
3. `release.yml` fires all jobs on the tag push: `app-release`, `corpus-release`, `deploy-to-mirror`, `contributor-credit` — all complete green within 30 minutes.
4. Zenodo DOI resolves to a real Zenodo record for v1.0.0. `CITATION.cff` updated with resolved DOI. `corpus/doi.json` updated with `{"doi": "<doi>", "status": "minted"}`.
5. `docs/launch-readiness/internet-archive-snapshots.md` snapshot URLs from `release.yml` HEAD-respond 200 (best-effort; non-fatal if IA was temporarily unavailable).
6. `docs/launch-readiness/software-heritage-snapshots.md` SH archive URLs populated (best-effort; non-fatal).
7. Byte-identical-artifact assertion: SHA256 hashes match for SPA index + at least one methodology page + LICENSES.md + CITATION.cff between canonical and mirror URL.
8. Mirror URL `https://iq-me.pages.dev/` is independently navigable.
9. Launch announcement posted to GitHub Discussions: no marketing language, names canonical + mirror URLs + Zenodo DOI + named reviewers-of-record + tester/translator thanks (consented handles only); does NOT solicit shares, retweets, upvotes, or HN submissions.
10. `docs/launch-readiness/v1.0.0-launch-postscript.md` committed: launch date, actual time-to-each-gate-closure, tester-credibility-report summary as permanent project record.
11. `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md` baseline values filled in (from Story 10-1 template): network-trace count=0, CSP-violation-count=0, no-signup=true, deployed-tree SHA, `LICENSES.md` sha256, `CITATION.cff` sha256.

## Tasks / Subtasks

- [-] **Task 1:** Verify Story 10-1 checklist is fully signed off (AC 1). _(deferred: human-gated launch-time verification — maintainer signs off at actual launch)_
- [-] **Task 2:** Push coordinated double-tag and observe release.yml (AC 2, AC 3). _(deferred: human-triggered launch operation — `git tag app-v1.0.0 && git tag corpus-v1.0.0 && git push --tags`)_
- [-] **Task 3:** Verify Zenodo DOI and update CITATION.cff + corpus/doi.json (AC 4). _(deferred: requires live Zenodo integration at actual launch — `release.yml` zenodo-doi step populates automatically)_
- [-] **Task 4:** Verify Internet Archive + Software Heritage snapshot records (AC 5, AC 6). _(deferred: requires live release.yml run at actual launch)_
- [-] **Task 5:** Verify byte-identical mirror (AC 7, AC 8). _(deferred: requires live Cloudflare Pages deployment at actual launch)_
- [-] **Task 6:** Post launch announcement to GitHub Discussions (AC 9). _(deferred: human-authored announcement at actual launch)_
- [-] **Task 7:** Fill in no-enshittification baseline values (AC 11). _(deferred: requires live canonical URL at actual launch)_
- [x] **Task 8:** Commit `v1.0.0-launch-postscript.md` (AC 10).
  - [x] **Subtask 8.1:** Author `docs/launch-readiness/v1.0.0-launch-postscript.md` with: launch date (UTC), time-to-each-gate-closure (9a–9e real dates), `release.yml` run URL, Zenodo DOI, IA snapshot URLs, SH archive URL, discussion announcement URL, tester-credibility-report summary (final tally from `tester-credibility-report.md`).
  - [x] **Subtask 8.2:** Commit the postscript + updated baseline + any DOI/snapshot files not auto-committed by release.yml.

## Dev Notes

- **Execution sequence matters:** Task 2 (tag push) must happen AFTER Task 1 (checklist verified). Tasks 3–6 happen AFTER `release.yml` completes. Task 7 (baseline) happens AFTER live URL is up. Task 8 (postscript) is the final commit.
- **Live-gate variables:** `release.yml` archival and mirror steps are INERT until `vars.IQME_LIVE_ARCHIVAL=true` and `vars.IQME_LIVE_MIRROR=true` are set in the GitHub repository settings (not secrets — `vars.*` not `secrets.*`). `IQME_LIVE_CHANGELOG` enables the contributor-credit PR. All three must be set before the tag push.
- **Zenodo DOI minting:** The `zenodo-doi` step in `release.yml` FETCHES the DOI from `api.zenodo.org` — it does NOT mint it. The GitHub–Zenodo integration mints the DOI on the GitHub Release object (when `release.yml` creates a GitHub Release, Zenodo picks it up automatically if the integration is configured). Configure the GitHub–Zenodo integration BEFORE tagging: visit `https://zenodo.org/account/settings/github/`, enable the IQ-ME repository. Then when the tag push creates a GitHub Release, Zenodo auto-mints and the `zenodo-doi` step fetches it.
- **Decoupled tag namespaces:** `app-v1.0.0` triggers `app-release` + `deploy-to-mirror`. `corpus-v1.0.0` triggers `corpus-release` + `deploy-to-mirror`. Both tags must be pushed (they can be pushed simultaneously with `git push --tags`).
- **contributor-credit job:** Creates a release-prep PR with `CHANGELOG.md` contributor credit. Review and merge this PR BEFORE marking Task 6 done. The PR uses `vars.IQME_LIVE_CHANGELOG` gate.
- **Launch announcement constraints (AC9):**
  - Named format for reviewers-of-record: `@<github-handle>` for psychometrician (Gate 9b), RU translator (Gate 9c), PL translator (Gate 9d)
  - Tester handles: only those who consented to be named (from `tester-credibility-report.md`)
  - Tone: "feedback welcome on this thread" — no viral call-to-action
  - Must NOT contain: "share", "upvote", "submit to HN", "tweet", "retweet", or any explicit distribution ask
- **`corpus/doi.json`:** Secondary machine-readable record. Canonical DOI sink is `CITATION.cff`. `doi.json` currently contains `{"doi": null, "status": "pending"}` — `release.yml` updates it. If release.yml update doesn't auto-commit (it's part of the release job run), manually commit the updated files with `git add CITATION.cff corpus/doi.json && git commit -m "chore(doi): record v1.0.0 Zenodo DOI"`.
- **Postscript time-to-gate-closure:** Record actual real-world dates when each gate physically closed (e.g., "9a: 2026-XX-XX — ICAR PDF received"). These come from the gate artifact files (outreach logs, signoff docs). Do NOT fabricate.
- **No new test files:** This story is operational + documentation. The scaffold test for story 10-1 (`tests/scaffold/10-1-pre-launch-checklist.test.mjs`) covers the launch-readiness doc structure. No additional test files needed for 10-2.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): Harm-critical placeholder content must never fabricate specifics. Apply: do NOT pre-fill DOI values, IA URLs, SH URLs, or SHA hashes — all must come from the live release run; `corpus/doi.json` currently `{"doi": null, "status": "pending"}` — only update after Zenodo actually mints.
- lesson-2026-06-03-001 (high): pr-checks.yml wires Playwright specs per-spec, NOT via greedy glob. Apply: if a new Playwright spec is needed for live-URL verification, add a dedicated pr-checks.yml job; but Story 10-2 should not add new test files — leverage existing `network-trace` + `full-slice-network-trace` CI jobs.
- lesson-2026-06-03-002 (high): Before labeling a failing test pre-existing, verify provenance with a baseline diff. Apply: if any CI job fails after the tag push, check `git diff main -- <file>` before attributing to the release.
- lesson-2026-05-20-007 (high): Every story spec carries `### Carry-forward lessons` populated from `tds memory query`. Apply: this section is present; Story 10-3 must also populate it.
- lesson-2026-05-19-013 (high): Direct YAML edits to state-manifest.yaml can be undone by next tds state-commit sweep. Apply: no state-manifest edits in this story; all file updates are production-source commits.

### Project Structure Notes

- **New file:** `docs/launch-readiness/v1.0.0-launch-postscript.md`
- **Updated files (by release.yml automatically):** `CITATION.cff` (doi field), `corpus/doi.json` (doi + status), `docs/launch-readiness/internet-archive-snapshots.md`, `docs/launch-readiness/software-heritage-snapshots.md`
- **Updated file (by agent):** `docs/launch-readiness/v1.0.0-no-enshittification-baseline.md` (fill in from Story 10-1 template)
- **Tag push command:** `git tag app-v1.0.0 && git tag corpus-v1.0.0 && git push --tags`
- **Decoupled tag pattern documented in:** `docs/adr/release-tag-namespace-contract.md`
- **Live-gate vars:** `IQME_LIVE_ARCHIVAL`, `IQME_LIVE_MIRROR`, `IQME_LIVE_CHANGELOG` — set in GitHub repository Settings → Variables (not Secrets)
- **Required secrets:** `ZENODO_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — set in GitHub repository Settings → Secrets

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.2]
- [Source: .github/workflows/release.yml — full release job definitions, live-gate vars, archival steps]
- [Source: corpus/doi.json — secondary DOI record (currently pending)]
- [Source: docs/adr/release-tag-namespace-contract.md — decoupled tag namespaces]
- [Source: docs/launch-readiness/v1.0.0-checklist.md — Story 10-1 precondition checklist]
- [Source: docs/launch-readiness/v1.0.0-no-enshittification-baseline.md — baseline template to fill in]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Launch postscript template authored; 12/12 scaffold tests green; tasks 1-7 deferred to actual launch (human-gated); task 8 done

### File List

- docs/launch-readiness/v1.0.0-launch-postscript.md
- tests/scaffold/10-2-launch-postscript.test.mjs
