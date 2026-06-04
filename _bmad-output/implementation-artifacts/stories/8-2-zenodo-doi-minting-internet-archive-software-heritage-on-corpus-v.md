---
id: 8-2-zenodo-doi-minting-internet-archive-software-heritage-on-corpus-v
title: "Story 8.2: Zenodo DOI minting + Internet Archive + Software Heritage on corpus-v*"
status: review
---

# Story 8.2: Zenodo DOI minting + Internet Archive + Software Heritage on corpus-v*

## Story

As a **citer (Karolina journey) resolving a Zenodo DOI two years post-launch**,
I want **every tagged corpus release to mint a Zenodo DOI, snapshot to Internet Archive Save Page Now, and archive to Software Heritage's `save` endpoint — automatically, triggered by the `corpus-v*` release tag (FR30, FR46, NFR18)**,
so that **the citability vision (Journey 5) operates at scale (Wikipedia editors, course instructors, paper authors get a stable citation without maintainer intervention) and Internet-Archive-level permanence holds**.

## Acceptance Criteria

> **Epic-8 dev-phase decision (infra-now) — no live archival.** Same posture as Story 8.1 and Story 7.8. `release.yml` only runs on real `corpus-v*` tag pushes against the live repo with GitHub Pages + secrets + the one-time GitHub–Zenodo integration configured (launch / Epic 10). The dev-phase deliverable is: (a) the `corpus-release` job **extended** with the three archival steps (structurally correct, but exercised live only at launch); (b) the two launch-readiness doc records (template + PENDING marker); (c) the DOI-sink wiring. **NO live DOI mint, NO live Save-Page-Now / Software Heritage call, NO `gh` API issue creation runs in dev** — these fire first on the v1.0.0 coordinated tag (Epic 10). The structural contract is verified by tests parsing `release.yml` + asserting the doc/sink files exist.
>
> **Scope boundary.** This story REPLACES the `# --- Deferred to Story 8.2: … ---` marker in the `corpus-release` job with the real archival steps and KEEPS the deploy steps + the **Story 8.4 mirror** deferral intact (the Codeberg/Cloudflare mirror is still Story 8.4 — do NOT implement it here). The `scheduled.yml` health-check probes for these archival URLs are **Story 8.3** (not this story); 8.2 only emits the snapshot-URL record files those checks will later read.
>
> **DOI-sink decision (see Dev Notes — load-bearing).** The cite-this-page widget and the page masthead read the DOI from the build-injected `<meta name="iqme-doi">` tag, which `tools/build-methodology.mjs` derives from `fm.doi` (per-page frontmatter); there is **no runtime JSON fetch**. `CITATION.cff` already exists with `doi: ""` and a comment naming "the Epic 8 release.yml workflow" as its populator, and `lint-trust-artifacts.mjs` already lints it. `corpus/doi.json` does **not** exist and has **no** consumer. Per epics.md ("written to `corpus/doi.json` (or `CITATION.cff` directly)") and the prefer-existing-mechanism rule, **CITATION.cff is the canonical DOI sink** the release step writes; `corpus/doi.json` is landed as an OPTIONAL secondary machine-readable sink with a PENDING placeholder (it does not replace CITATION.cff and the build does not yet read it). The actual `fm.doi`-population path (frontmatter / CITATION-to-build wiring) remains as-is — flipping every masthead off "DOI: pending" end-to-end is a launch concern; this story lands the sink + the workflow write step, not a build-pipeline rewrite.

1. **AC-1 (Zenodo DOI step writes the DOI sink — dev-phase structural):** the `corpus-release` job gains a step (e.g. `mint-and-record-zenodo-doi`) documenting that the one-time GitHub–Zenodo integration mints the DOI on the GitHub Release, then fetches the minted DOI via the Zenodo API and writes it to the canonical DOI sink **`CITATION.cff`** (`doi:` field) — with `corpus/doi.json` updated as an optional secondary record. The step is **structurally present and commented**, but performs no live API call in dev (guarded/inert at dev — e.g. the live `curl`/`api.zenodo.org` call sits behind the launch path, not executed without secrets). The dev-phase artifact is the step + the sink files, NOT a real DOI.
2. **AC-2 (Internet Archive Save-Page-Now step — best-effort, failure-routed):** the `corpus-release` job gains a step (e.g. `snapshot-to-internet-archive`) that targets the Save Page Now endpoint (`https://web.archive.org/save/<url>`) for the corpus root + key pages (the FR36-protected page, the citation page, the reference pages) and records the resulting snapshot URLs in `docs/launch-readiness/internet-archive-snapshots.md`. **Failure does NOT fail the build** (mirror is best-effort — the step is `continue-on-error` / non-fatal) but routes to a **labeled GitHub Issue** following the `scheduled.yml` failure-routing pattern (Story 8.3) — `area:archival-health` / `area:archive-health` label, via `gh` CLI or `actions/github-script`. In dev, neither the live snapshot nor the live issue creation runs (guarded behind the launch path); the dev artifact is the structurally-correct step + the record file with a PENDING marker.
3. **AC-3 (Software Heritage save step — best-effort, failure-routed):** the same job gains a step (e.g. `archive-to-software-heritage`) that targets the SH save endpoint (`https://archive.softwareheritage.org/api/1/origin/save/git/url/<repo-url>`) and records the response/save-request URL in `docs/launch-readiness/software-heritage-snapshots.md`. Same best-effort + labeled-Issue failure-routing as AC-2 (non-fatal; `area:archival-health`). In dev, no live call / no issue; the dev artifact is the step + the PENDING record file.
4. **AC-4 (deploy + Story 8.4 mirror deferral preserved):** the existing `corpus-release` deploy steps (`make build-methodology` re-emit + the `peaceiris/actions-gh-pages` methodology deploy with `keep_files: true`) are **unchanged**, and the **Story 8.4** Codeberg/Cloudflare mirror remains an explicit deferred extension point (a comment marker naming Story 8.4) — NOT implemented in this story. The three archival steps are appended AFTER the deploy step (a page must be live before it can be snapshotted).
5. **AC-5 (launch-readiness record files — template + PENDING):** `docs/launch-readiness/internet-archive-snapshots.md` and `docs/launch-readiness/software-heritage-snapshots.md` exist (NEW), each in the project's plain-language launch-readiness doc style (a `> **STATUS: PENDING** …` blockquote header, matching `{ru,pl}-translator-signoff.md`), documenting **where** the per-release snapshot URLs will be logged, the per-release cadence (`corpus-v*` tag), the best-effort + failure-routing contract, and an explicit PENDING marker (real URLs captured at launch / Epic 10). No fabricated snapshot URLs.
6. **AC-6 (DOI sink — CITATION.cff canonical, doi.json optional secondary):** `CITATION.cff` remains the canonical DOI sink (its `doi: ""` placeholder + comment unchanged — the release step is what populates it at launch; `lint-trust-artifacts` stays green). `corpus/doi.json` (NEW) is landed as an OPTIONAL secondary machine-readable record with a PENDING placeholder (e.g. `{ "doi": null, "status": "pending", "note": "populated by release.yml on the first corpus-v* tag — canonical sink is CITATION.cff" }`), valid JSON. No live DOI value is invented.
7. **AC-7 (frozen class-A test graduation + new structural test + regression):** the **test-author phase** (not this spec's job, but a required task — see Tasks) must: (a) **graduate** `tests/scaffold/release-workflow.test.mjs` **AC-5** so the archival-absence assertion flips to **archival-PRESENT** (the Zenodo/IA/SH steps now MUST appear) while **KEEPING** the Story-8.4 mirror-absence + "Story 8.4" marker assertions (mirror still deferred); (b) add NEW structural assertions for the three archival steps + the two record files + `corpus/doi.json` (cleanest as a NEW `tests/scaffold/release-archival.test.mjs`); (c) **re-register integrity** for the edited class-A `release-workflow.test.mjs` via `tds integrity record` and re-grep the manifest after the next sweep (lesson-2026-05-20-007 / lesson-2026-05-19-013). `make test` green, `make lint` green (incl. `lint-trust-artifacts`), `make build` deterministic.

## Tasks / Subtasks

- [x] **Task 1: Zenodo DOI step (write CITATION.cff sink; doi.json secondary)** (AC: 1, 6)
  - [x] In `corpus-release`, REPLACE the `# --- Deferred to Story 8.2 … ---` marker with a `mint-and-record-zenodo-doi` step: comment the GitHub–Zenodo integration (mints on Release), fetch the DOI via the Zenodo API, write it to `CITATION.cff` `doi:` (canonical sink) + update `corpus/doi.json` (secondary). The live API call must be inert in dev (no secrets → not executed); the dev artifact is the step + the sink files.
  - [x] Land `corpus/doi.json` (NEW) with a PENDING placeholder noting CITATION.cff is canonical. Do NOT touch CITATION.cff's `doi: ""` placeholder or its comment.
- [x] **Task 2: Internet Archive Save-Page-Now step (best-effort + failure-routed)** (AC: 2, 5)
  - [x] Add a `snapshot-to-internet-archive` step targeting `https://web.archive.org/save/<url>` for the corpus root + key pages; record snapshot URLs in `docs/launch-readiness/internet-archive-snapshots.md`. Mark the step non-fatal (`continue-on-error: true`); on failure route to a labeled GitHub Issue (`area:archival-health`) per the `scheduled.yml` pattern (Story 8.3). Live snapshot + live issue creation guarded behind the launch path (not run in dev).
- [x] **Task 3: Software Heritage save step (best-effort + failure-routed)** (AC: 3, 5)
  - [x] Add an `archive-to-software-heritage` step targeting `https://archive.softwareheritage.org/api/1/origin/save/git/url/<repo-url>`; record the response in `docs/launch-readiness/software-heritage-snapshots.md`. Same non-fatal + labeled-Issue routing as Task 2.
- [x] **Task 4: preserve deploy + Story 8.4 mirror marker** (AC: 4)
  - [x] Keep `make build-methodology` + the `peaceiris/actions-gh-pages` methodology deploy (`keep_files: true`) unchanged; append the three archival steps AFTER deploy. Keep the **Story 8.4** Codeberg/Cloudflare mirror as an explicit deferred-extension comment marker — do NOT implement the mirror.
- [x] **Task 5: launch-readiness record files (NEW)** (AC: 5)
  - [x] Create `docs/launch-readiness/internet-archive-snapshots.md` + `docs/launch-readiness/software-heritage-snapshots.md` in the launch-readiness plain-language style (PENDING blockquote header, cadence, best-effort + failure-routing note, where URLs get logged). No fabricated URLs.
- [x] **Task 6 (test-author phase — NOT engineer): graduate frozen release-workflow.test.mjs AC-5 + add release-archival.test.mjs + re-register integrity** (AC: 7)
  - [x] Graduate `tests/scaffold/release-workflow.test.mjs` AC-5: flip archival-absence → archival-PRESENT (Zenodo/IA/SH steps now required); KEEP the Story-8.4 mirror-absence + "Story 8.4" marker assertions.
  - [x] Add `tests/scaffold/release-archival.test.mjs` (NEW): assert the three archival steps in the `corpus-release` body, the best-effort/failure-routing markers, the two record files exist, and `corpus/doi.json` exists + is valid JSON with a PENDING placeholder.
  - [x] `tds integrity record --files=tests/scaffold/release-workflow.test.mjs` (engineer) after the edit; re-grep `state-manifest.yaml` after the next state-commit sweep to confirm the new hash persisted (do NOT hand-edit the manifest).
- [x] **Task 7: regression gate** (AC: 7)
  - [x] `make test` / `make lint` (incl. `lint-trust-artifacts`) / `make build` all green + deterministic; baseline-diff any ambiguous failure before labeling it pre-existing (lesson-2026-06-03-002).

## Dev Notes

- **DOI sink — the load-bearing finding.** The DOI-resolution chain is: `tools/build-methodology.mjs` reads `fm.doi` (per-page frontmatter) → injects `<meta name="iqme-doi" content="…">` + the masthead `<p class="methodology-masthead__doi">DOI: …</p>` line (empty → the visible-fallback `data-doi-pending` "DOI: pending v1.0.0 release"). The runtime `src/assessment/cite-this-page.js` widget reads the DOI **only** from `<meta name="iqme-doi">` — there is **NO runtime JSON fetch** (it cannot read `corpus/doi.json` at runtime). `CITATION.cff` exists with `doi: ""` and an explicit comment ("populated by the Epic 8 release.yml workflow at the first per-corpus-release tag"); `lint-trust-artifacts.mjs` lints its existence (`minBytes: 50`). `corpus/doi.json` does NOT exist and has NO consumer anywhere in `src/` or `tools/`. **Therefore: CITATION.cff is the canonical sink** the release step writes (matches the existing comment + the epics' "or `CITATION.cff` directly" clause + the prefer-existing-mechanism rule). `corpus/doi.json` is landed as an OPTIONAL secondary machine-readable record only. NOTE: making every masthead flip off "DOI: pending" end-to-end requires the build to actually read a populated DOI into `fm.doi` (frontmatter or a CITATION→build wire) — that pipeline step is a launch concern (Epic 10), out of scope here; this story lands the sink + the workflow's write step.
- **release.yml `corpus-release` extension point.** The job currently ends at `# --- Deferred to Story 8.2: append Zenodo DOI mint + Internet Archive Save Page Now + Software Heritage save steps to this job. ---` (release.yml ~line 103-104). REPLACE that marker with the three steps, appended AFTER the `peaceiris/actions-gh-pages` methodology deploy (a page must be deployed before Save-Page-Now can snapshot it). Keep the deploy + the `keep_files: true` permalink-preservation intact. The **Story 8.4** mirror marker must REMAIN (lines ~16-17 header comment already name it; add/keep an inline marker too if clearer).
- **Best-effort + failure-routing (architecture §289, §1327-1329; scheduled.yml stub).** IA + SH are best-effort: a failed snapshot must NOT fail the release (`continue-on-error: true` on the step). On failure, open a labeled GitHub Issue per the `scheduled.yml` failure-routing pattern (Story 8.3) — `scheduled.yml`'s stub names the `archival-health` label for "Zenodo DOI resolves + Internet Archive snapshot reachability" failures, and "Failure → labeled GitHub Issue routing replaces traditional Slack/PagerDuty alerting (NFR8/NFR35)". Use that label vocabulary (`area:archival-health` / `archival-health`). The live `gh issue create` / `actions/github-script` is guarded behind the launch path (no API in dev).
- **Zenodo is dual-trigger.** Architecture (§97, §541, §1343) describes the Zenodo DOI as minted by the **one-time GitHub–Zenodo integration** (configured outside CI, fires on the GitHub Release) — the workflow step's job is to **fetch** the minted DOI (Zenodo API) and **write it to the sink**, NOT to mint via API. Document this in the step comment so it isn't mistaken for an in-CI minting call. The fetch/write is inert in dev (no secrets).
- **No-API-in-dev (infra-now).** Same posture as 8.1 / 7.8: no tag push, no Zenodo/IA/SH HTTP call, no `gh` API issue creation runs in the dev phase. The workflow steps are authored structurally; live archival is first exercised at the v1.0.0 coordinated tag (Epic 10). The DOI-sink + record files carry PENDING markers (no fabricated DOI/URLs — cf. lesson-2026-06-04-002: structural placeholders reference the real mechanism + an explicit pending marker, never fabricate specifics).
- **CLASS-A frozen edit (AC-7) — non-optional ceremony.** `tests/scaffold/release-workflow.test.mjs` is class-A (frozen from Story 8.1). Its **AC-5** currently asserts the Zenodo/IA/SH steps are ABSENT (`assert.doesNotMatch(… zenodo|web.archive.org/save|softwareheritage …)`) AND the "Story 8.2" + "Story 8.4" markers are present. Implementing 8.2 makes the archival steps PRESENT → that absence assertion WILL go red. This is an authorized, in-scope graduation (the story OWNS the archival activation). The test-author must flip archival-absence → archival-PRESENT, KEEP the mirror-absence + "Story 8.4" marker assertions (mirror is still Story 8.4), then `tds integrity record --files=tests/scaffold/release-workflow.test.mjs` as engineer and re-grep `state-manifest.yaml` after the sweep (lesson-2026-05-20-007 / lesson-2026-05-19-013). Do NOT hand-edit state-manifest.yaml.
- **New scaffold test needs NO per-spec CI job.** `make test` runs `node --test 'tests/scaffold/**/*.test.mjs' …` (glob-discovered — Makefile line 14-15), so a NEW `tests/scaffold/release-archival.test.mjs` is auto-picked-up by the batched run — no dedicated `pr-checks.yml` job needed. lesson-2026-06-03-001's per-spec-wiring requirement applies to **Playwright** specs (`tests/playwright/*.spec.mjs`, wired one job each in pr-checks.yml), NOT scaffold tests. (This is exactly how Story 8.1 added `release-workflow.test.mjs`.) Do NOT add a spurious CI job for the new scaffold test.
- **Files:** `.github/workflows/release.yml` (extend corpus-release — replace 8.2 marker, keep deploy + 8.4 marker), `corpus/doi.json` (NEW, secondary sink), `docs/launch-readiness/internet-archive-snapshots.md` (NEW), `docs/launch-readiness/software-heritage-snapshots.md` (NEW), `tests/scaffold/release-workflow.test.mjs` (class-A AC-5 graduation, test-author phase), `tests/scaffold/release-archival.test.mjs` (NEW, test-author phase). Do NOT touch CITATION.cff's `doi: ""` placeholder/comment, do NOT implement the Story 8.4 mirror, do NOT touch `scheduled.yml` (Story 8.3).

### Carry-forward lessons

- lesson-2026-05-20-007 (high): class-A frozen-test edits need a Carry-forward entry + integrity re-registration. Apply: graduating `release-workflow.test.mjs` AC-5 (archival absent→present, keep mirror-absence) is a class-A edit → `tds integrity record` it (Task 6); don't skip the ceremony.
- lesson-2026-05-19-013 (high): direct state-manifest.yaml edits can be undone by the next sweep. Apply: after `tds integrity record` on the edited class-A test, re-grep `state-manifest.yaml` post-sweep to confirm the new hash persisted; never hand-edit the manifest.
- lesson-2026-06-03-001 (high): pr-checks wires Playwright specs per-spec, NOT via a glob; scaffold tests run batched under `make test`. Apply: the NEW `release-archival.test.mjs` is a `tests/scaffold/` test → auto-discovered by `make test`'s glob → needs NO per-spec pr-checks job (don't add one, don't defer "wiring" on a false glob premise).
- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: the corpus-release archival extension is net-new this story; before calling any red test pre-existing, run `git diff main -- .github/workflows/release.yml` (or a baseline checkout) and quote it in the self-review.
- lesson-2026-06-04-002 (high): harm/trust-critical placeholders must reference the real mechanism + an explicit pending marker, never fabricate specifics. Apply: the DOI sink + the IA/SH record files carry a PENDING marker and name the real populating workflow — never invent a DOI value or a snapshot URL to satisfy structure.

### Project Structure Notes

- Workflow under `.github/workflows/release.yml`; launch-readiness docs under `docs/launch-readiness/` (alongside `{ru,pl}-translator-signoff.md`); DOI sink `CITATION.cff` at repo root (canonical) + `corpus/doi.json` (secondary, alongside `corpus/manifest.json` etc.); scaffold tests under `tests/scaffold/`. Domain D (`tools/` + `.github/workflows/` + `Makefile` + release/archival infra) owns this per architecture §1029 — no structural variance. Engineer role (no domain specialist).

### References

- [Source: epics.md#Story-8.2] — AC source (Zenodo DOI mint + write to `corpus/doi.json`-or-`CITATION.cff`; IA Save-Page-Now best-effort + labeled Issue; SH save; possible 8.2a/8.2b split; deferral documented in CHANGELOG).
- [Source: architecture.md] §97-99 + §289 (external integrations: Zenodo / Internet Archive Save-Page-Now / Software Heritage `save`, per corpus release, NFR18/NFR25), §541 + §1343 + §1358 (corpus-v* release flow: deploy + mint Zenodo DOI + archive IA + SH), §1327-1329 (archival external integrations), §757 (Z-suffix ISO 8601 in Zenodo/IA/SH payloads), §1424 (outlast-the-maintainer runbook — DOI + IA + SH redundancy).
- [Source: .github/workflows/release.yml] — the activated Story 8.1 workflow; `corpus-release` job ends at the `# --- Deferred to Story 8.2 … ---` marker (~line 103-104) this story replaces; the Story 8.4 mirror marker (~line 16-17) stays.
- [Source: tests/scaffold/release-workflow.test.mjs#AC-5] — frozen class-A AC-5 (archival ABSENT + "Story 8.2"/"Story 8.4" markers present) to graduate: archival absent→present, KEEP mirror-absence + "Story 8.4" marker.
- [Source: .github/workflows/scheduled.yml] — the failure-routing pattern (Story 8.3) the IA/SH best-effort steps follow: labeled GitHub Issue (`archival-health`) replaces Slack/PagerDuty (NFR8/NFR35).
- [Source: tools/build-methodology.mjs] — `fm.doi` → `<meta name="iqme-doi">` + masthead DOI line (visible-fallback when empty); the build is the only DOI consumer (no runtime JSON fetch).
- [Source: src/assessment/cite-this-page.js] — reads DOI from `<meta name="iqme-doi">` only; confirms CITATION.cff (build-injected) is the sink, not a runtime doi.json.
- [Source: CITATION.cff] — existing canonical DOI sink: `doi: ""` + comment naming the Epic 8 release.yml workflow as populator.
- [Source: _bmad-output/implementation-artifacts/stories/8-1-release-yml-workflow-app-v-corpus-v-tag-triggers-deployment.md] — format reference + the infra-now dev-phase posture + class-A graduation precedent.
- [Source: _bmad-output/implementation-artifacts/stories/7-8-codeowners-branch-protection-config-artifact-for-dual-approval.md] — format reference + the PENDING-doc-record (launch-gated artifact) precedent.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Zenodo DOI->CITATION.cff + corpus/doi.json; IA + SH best-effort archival w/ archival-health failure-routing; live calls gated inert (vars.IQME_LIVE_ARCHIVAL); docs record files PENDING. Frozen 12/12 green; suite 1228 pass/0 fail; lint+build exit 0.
- Promoted to review: 7/7 tasks complete; frozen archival + graduated AC-5 tests green; suite 1228 pass/0 fail; lint+build exit 0.

### File List

- .github/workflows/release.yml
- corpus/doi.json
- docs/launch-readiness/internet-archive-snapshots.md
- docs/launch-readiness/software-heritage-snapshots.md
- tests/scaffold/release-archival.test.mjs
- tests/scaffold/release-workflow.test.mjs

## Specialist Self-Review

## Specialist Self-Review — Story 8-2 (Zenodo DOI + Internet Archive + Software Heritage on corpus-v*, infra-now)

**Decisions made:**
- Appended three archival steps to the `corpus-release` job (after the methodology deploy): a Zenodo DOI step that fetches the GitHub–Zenodo-minted DOI via `api.zenodo.org` and writes the **canonical sink CITATION.cff** (plus the secondary `corpus/doi.json`); an Internet Archive Save-Page-Now step (`web.archive.org/save`); a Software Heritage `origin/save` step (`archive.softwareheritage.org`). A final `if: failure()` step routes any archival failure to a GitHub Issue labeled **`archival-health`** (the label Story 8.3's scheduled.yml also uses).
- **IA + SH are best-effort** (`continue-on-error: true`) — a snapshot failure does NOT fail the release (mirror/archival is non-blocking per the spec); only the labeled Issue records the drift.
- **All live calls are gated INERT in dev** behind `vars.IQME_LIVE_ARCHIVAL` (+ an in-script empty-token guard) — no DOI is minted, no IA/SH call is made, no Issue is opened until launch (Epic 10) configures the repo var + `ZENODO_TOKEN`. Same infra-now posture as 8.1/7.8.
- **CITATION.cff `doi:` left empty** (`doi: ""`) — the field stays present (lint-trust-artifacts green) and is populated by the workflow at the first real corpus-v* release.
- **Mirror still absent** — no Codeberg/Cloudflare/`deploy-to-mirror` (deferred to Story 8.4); the Story-8.4 marker comment is preserved.

**Alternatives considered:**
- `corpus/doi.json` as the PRIMARY DOI sink — rejected: the cite-this-page widget reads the build-injected `<meta iqme-doi>` from frontmatter `fm.doi`, and CITATION.cff is the existing populated source (with a "populated by Epic 8 release.yml" comment) that lint-trust-artifacts already lints. `corpus/doi.json` has no runtime consumer, so it's the secondary machine-readable record only.
- Gating the Zenodo step on `if: secrets.ZENODO_TOKEN != ''` — rejected: `secrets.*` is not a valid step-level `if:` context (actionlint error). Gated on `vars.IQME_LIVE_ARCHIVAL` with the empty-token as an in-script second guard.

**Framework gotchas avoided:**
- `secrets.*` invalid in step `if:` → `vars.*` gate (actionlint clean except benign "context access might be invalid" warnings for launch-configured vars/secrets, which are valid syntax).
- `release-workflow.test.mjs` AC-5 slices the corpus-release body with a FIXED 80-line window — the `archive.softwareheritage.org` reference must land within 79 lines of `  corpus-release:`. Compressed the archival-block comments (load-bearing tokens preserved) so the SH host sits at delta 79, inside the window.
- Verified `corpus/doi.json` placement trips no lint: only `lint-frontmatter`/`markdown-subset` scan `corpus/` and only `.md` (lint-frontmatter validates `.json` only under `src/content/crisis-resources/`); eslint lints only `.js/.mjs`. No corpus lint touches the new JSON.

**Areas of uncertainty:**
- Live archival is not exercised in dev (gated inert) — first real run is launch/Epic 10 (real `ZENODO_TOKEN` + `vars.IQME_LIVE_ARCHIVAL=true`). The labeled-Issue failure routing shares the `archival-health` label with Story 8.3's scheduled.yml, which formalizes the weekly health-check routing; 8.2 only emits on a release-time archival failure.
- End-to-end "masthead shows the real DOI" also needs the build to read a populated `fm.doi` — that pipeline wiring is a launch concern, out of scope here; this story lands the sink + the workflow write step.

**Tested edge cases:**
- Frozen `tests/scaffold/release-archival.test.mjs`: Zenodo step → CITATION.cff sink; CITATION.cff has `doi:` field; `corpus/doi.json` exists + valid JSON + PENDING; IA Save-Page-Now best-effort + `archival-health` failure-routed Issue; SH `origin/save` best-effort; both `docs/launch-readiness/{internet-archive,software-heritage}-snapshots.md` exist with PENDING markers.
- Graduated `tests/scaffold/release-workflow.test.mjs` AC-5: corpus-release now CONTAINS the Zenodo/IA/SH steps; the Story-8.4 mirror stays absent (mirror-absence + 8.4-marker assertions kept green).
- Regression: full suite 1228 pass / 0 fail; `make lint` exit 0; `make build` exit 0 (deterministic, 105 methodology pages). Provenance: net-new this story (baseline epic/8 corpus-release had only the `# Deferred to Story 8.2` marker — `git diff` against the merge base confirms).
