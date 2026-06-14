---
lint-exempt-carry-forward: true
id: 3-8-aha-click-hallway-test-3-5-outside-team-comprehension-recording
title: "Story 3.8: Aha-click hallway test — 3-5 outside-team comprehension recording"
status: done
---

# Story 3.8: Aha-click hallway test — 3-5 outside-team comprehension recording

## Story

As a **maintainer (CEP) validating the LOAD-BEARING UX HYPOTHESIS that the score→methodology click triggers "aha"**,
I want **3-5 outside-team English-speaking users to run the Epic-3 vertical slice on a local build, complete the score→methodology click, and self-report comprehension in a documented `_evidence/` artifact (per John + Sally — Gate 9e is too late, the hypothesis dies or lives at Epic 3)**,
so that **the epic-goal "tester-testable" is *actually tested* (not aspirational), and any tonal-handoff or comprehension failure surfaces NOW — before Epic 4 commits to the corpus pipeline and Epic 5 commits to 30 pages of prose**.

## Story scope: SCAFFOLD-ONLY (this run)

**This story is intentionally scaffolded, not executed, in this dev-phase run.** The hallway test is a human-evidence-collection task — the maintainer (CEP) personally recruits 3-5 outside-team English-speakers, runs them through the local build, and writes the qualitative notes in `_evidence/`. There is no automation that substitutes for this human work.

What this story lands in code: the scaffolding the maintainer needs to actually run the hallway test efficiently — a recruitment README, per-user evidence templates, the aggregate-summary template, the `corpus-v0.1.0` git tag (per `docs/adr/release-tag-namespace-contract.md` line 61 — "Story 3.8 SHOULD tag `corpus-v0.1.0` at the merge-to-main of the epic-3 squash"), and the documented "run the local build" instructions so an outside-team participant can complete the happy-path without the maintainer screen-sharing the whole time.

What this story does NOT land: the actual qualitative evidence (`_evidence/3.8-hallway-test-<handle>.md` files with real participant notes + the aggregate summary). Those are appended by the maintainer after this story merges to epic/3. Story status remains `review` with a note in the Dev Agent Record explaining the scaffold-only posture; clean-context auditor in code-review Mode 2 accepts the story as-is if the scaffolding is complete and validated.

This story owns:

1. `_evidence/` directory created with a `.gitkeep` so it commits.
2. `_evidence/3.8-hallway-test-template.md` — the per-user evidence template the maintainer copies-and-fills per participant.
3. `_evidence/3.8-hallway-test-summary-template.md` — the aggregate-summary template the maintainer fills after 3-5 sessions.
4. `_evidence/3.8-recruitment-and-protocol.md` — the recruitment-and-protocol README: where to find participants, what to say at recruitment, the exact 4 questions to ask, consent + redaction handling, the maintainer's go/no-go criteria.
5. `docs/local-build-instructions.md` — short README a participant can read to start the local build themselves (or that the maintainer screen-shares): `make build-methodology && make dev`, navigate to `http://127.0.0.1:4173/?test=1` (without `?test=1` for the real-tester path), click through, etc.
6. The `corpus-v0.1.0` git tag — created via `git tag corpus-v0.1.0 <sha>` once the epic-3 squash lands on main (this happens in code-review Mode 2's `tds deliver`, NOT in this story's dev-phase run; this story authors the **instruction** for the auditor / deliver flow to do the tag — see Dev Notes).
7. A retro Bridge Plan note pointing forward: if the hallway test produces a "comprehension fails" verdict, `epic-3-retrospective` opens a Bridge Plan item naming the specific story-3.8b candidates.

## Acceptance Criteria

1. **AC-1 (`_evidence/.gitkeep` — directory committed):**
   - File at exact path: `_evidence/.gitkeep`. Empty (or one-line comment); presence-only.
   - The `_evidence/` directory becomes a tracked commit target so subsequent `_evidence/*.md` files have a home.

2. **AC-2 (`_evidence/3.8-hallway-test-template.md` — per-user evidence template):**
   - File at exact path: `_evidence/3.8-hallway-test-template.md`.
   - Markdown structure with named sections the maintainer fills per participant:
     ```
     # Hallway test — <handle-or-pseudonym>

     **Date:** YYYY-MM-DD
     **Build:** corpus-v0.1.0 (or commit SHA if pre-tag)
     **Locale:** EN
     **Recruitment source:** <friend / family / online-community / HN-equivalent / other>
     **Consent:** <consented to redacted-pseudonym publication / consented to handle publication / declined publication — notes for maintainer-eyes-only>

     ## Setup observations

     - Did the participant get the local build running without assistance?  <yes / yes-with-coaching / no — maintainer screen-shared>
     - Browser used: <Chrome / Firefox / Safari / Yandex / other>
     - Time-to-first-item-render observation: <fast / slow / very-slow>

     ## Happy-path completion

     - Did the participant complete the 16-item session in one sitting?  <yes / partial — bailed at item N / no>
     - Did they describe any UI friction during the session?  <free text — verbatim quotes preferred>

     ## The four hypothesis questions (verbatim quotes encouraged)

     ### Q1 — What did your score mean?
     <paste the participant's words; the maintainer asks open-endedly, does not lead>

     ### Q2 — What did you learn by clicking through to methodology?
     <paste>

     ### Q3 — Would you trust this site enough to share it with a friend?
     <paste; flag if the participant qualifies the answer ("trust *who* — depends on what they're using it for"); record qualifications verbatim>

     ### Q4 — Did anything feel off?
     <paste; include both UI-tonal observations and content-comprehension observations>

     ## Maintainer's coded summary

     - Comprehension verdict on the score number itself: <understood / partial / didn't-understand>
     - Comprehension verdict on the methodology click target: <understood / partial / didn't-understand>
     - Voluntary click-through observation: <clicked methodology voluntarily / had to be prompted / never clicked>
     - Tonal handoff felt: <smooth / acceptable / jarring / very-jarring>
     - Trust read: <would-share / mixed / would-not-share>

     ## Free-form notes

     <anything else the maintainer wants to capture: body language, surprised laughter, sighs, time-on-page>
     ```
   - The template intentionally records BOTH verbatim quotes AND coded summaries — the verbatim is the raw evidence; the coded is for aggregation in AC-3.

3. **AC-3 (`_evidence/3.8-hallway-test-summary-template.md` — aggregate summary template):**
   - File at exact path: `_evidence/3.8-hallway-test-summary-template.md`.
   - Markdown structure:
     ```
     # Hallway test aggregate — Story 3.8

     **Sessions completed:** N (target: 3-5)
     **Date range:** YYYY-MM-DD to YYYY-MM-DD
     **Build at test time:** corpus-v0.1.0 (or pre-tag commit)
     **Maintainer:** <handle>

     ## Per-session links

     - [<handle-1>](3.8-hallway-test-<handle-1>.md) — <one-line maintainer note>
     - [<handle-2>](3.8-hallway-test-<handle-2>.md) — <one-line note>
     - ...

     ## Aggregate verdict (per epic-spec AC: ≥3 of N participants on each axis)

     | Axis | Threshold | Result |
     |---|---|---|
     | Comprehension of the score number | ≥3 of N | <N-of-N> |
     | Voluntary click-through to methodology | ≥3 of N | <N-of-N> |
     | Tonal handoff felt smooth or acceptable | (per epic-spec — no explicit threshold; record observation) | <N-of-N> |
     | Trust to share with a friend | (per epic-spec — record observation) | <N-of-N> |

     ## Qualitative pain points

     - <each named pain point that appeared in ≥2 participants>
     - <each named pain point that appeared in 1 participant but seems important to the maintainer>

     ## Go/no-go decision on advancing to Epic 4

     - **Decision:** <GO / NO-GO / GO-WITH-BRIDGE>
     - **Reason:** <the maintainer's reasoning in 2-4 sentences>

     ## Bridge Plan candidates (only if NO-GO or GO-WITH-BRIDGE)

     - <each candidate that would unblock the GO decision, named as a "Story 3.8b: <slug>" entry that the epic-3-retrospective will pick up as a Bridge Plan item per docs/corpus-build-conventions.md retro flow>
     ```
   - The summary's "Go/no-go decision" is the document Epic 4's first PR description references (per epic-spec AC).

4. **AC-4 (`_evidence/3.8-recruitment-and-protocol.md` — recruitment-and-protocol README):**
   - File at exact path: `_evidence/3.8-recruitment-and-protocol.md`.
   - Markdown structure documenting:
     - **Recruitment sources** (per epic-spec): friends/family without psychometric background, online communities (r/cognitiveTesting low-key DM, Mastodon), an HN-comment-equivalent recruitment if the maintainer is comfortable. The build is *visibly pre-release* — no marketing, no signup, just "I'm building something, would you try this self-paced assessment and tell me what you think?"
     - **Recruitment message template** — a 3-sentence cold-message the maintainer can paste into a DM: pre-release context, time ask (20 minutes), what the participant gets (an interesting brief experience + the maintainer's gratitude). Explicitly NOT: free testing labor for a commercial product, since this is non-commercial.
     - **The four interview questions** (verbatim, from epic-spec):
       1. What did your score mean?
       2. What did you learn by clicking through to methodology?
       3. Would you trust this site to a friend?
       4. Did anything feel off?
     - **Consent + redaction handling**: ask each participant before the session whether their notes can be published with handle, with pseudonym, or maintainer-eyes-only. Default to pseudonym if the participant is unsure. The aggregate summary is publishable; individual session files are gated on each participant's choice.
     - **Maintainer's go/no-go protocol**: per epic-spec — ≥3 of N participants comprehend the score AND ≥3 of N click methodology voluntarily → GO. Any participant reports the click felt confusing OR the page was incomprehensible OR the handoff felt jarring → consider GO-WITH-BRIDGE (Bridge Plan item in retro) rather than NO-GO. NO-GO only if ≥2 of N report the score handoff is fundamentally broken.
     - **Session protocol**: setup steps for the participant (local build + URL), 16-item session, pre-reveal beat + score panel, methodology click, the four interview questions. Total: 20 minutes target; 30 minutes hard ceiling.

5. **AC-5 (`docs/local-build-instructions.md` — participant-facing local-build README):**
   - File at exact path: `docs/local-build-instructions.md`.
   - Markdown structure:
     - **Prerequisites**: Node.js 22+, git, a modern browser.
     - **One-command build**: `git clone <repo> && cd IQ-ME && make build-methodology && make dev`.
     - **Open the SPA**: navigate to `http://127.0.0.1:4173/`. The `?test=1` query param is NOT included — that's the Playwright-only path; participants run the real UX.
     - **Expected happy-path**: landing page → "Start the test" → consent + Continue → 16 matrix items → "Show me" → score panel → click a number → methodology stub page.
     - **Stop the dev-server**: Ctrl-C.
     - **Known interim limitations** (so the participant doesn't think these are bugs): the methodology pages are stubs (`<pre>`-wrapped raw markdown — Epic 4 lands the styled corpus); only EN locale (Epic 7 lands RU/PL); the items are placeholders, not the full ICAR-MR pool (Epic 9a finalizes the licensed pool).
     - **What to expect on the score**: brief plain-language note that the v1 score is an estimate from a 16-item sample; the uncertainty band is honest about that.
   - The doc is short (1-2 pages); explicitly says "if you get stuck, ping the maintainer — and that observation is part of the test."

6. **AC-6 (`corpus-v0.1.0` tag instruction for the deliver flow):**
   - This story does NOT create the `corpus-v0.1.0` tag in the dev-phase run. The tag MUST be created on the COMMIT-TO-MAIN that lands the epic-3 squash. That commit is produced by `tds deliver` during code-review Mode 2.
   - To make this happen, this story adds an instruction line in `docs/local-build-instructions.md` AND in the Story 3-8 Dev Agent Record below:
     > After epic-3 code-review Mode 2 `tds deliver` lands the epic-3 squash on main, run `git tag corpus-v0.1.0 <main-HEAD-sha>` and `git push origin corpus-v0.1.0` (or equivalent via the gh CLI). This unblocks the SPA shell's footer `git describe --tags --match 'corpus-v*' --abbrev=0` lookup in dev environments before Epic 8 lands `release.yml` automation.
   - The instruction also surfaces in the Story 3-8 self-review areas-of-uncertainty so the auditor reads it during code-review Mode 2.

7. **AC-7 (no test files, no lint changes, no source-code changes):**
   - This story is documentation + directory scaffolding only. No `tests/*` files, no `src/*` files, no `tools/*` files modified. No `Makefile` / `BUDGETS.json` changes.
   - All prior tests + lints continue to pass unchanged.
   - `make test` exit 0 with same 434 baseline.
   - `make lint` exit 0.
   - `make build-methodology` + `make test-full-slice` continue to work.

8. **AC-8 (status posture):**
   - Story moves to `review` at the end of the dev-phase, like every other Story 3-X. The scaffold-only posture is documented in the Dev Agent Record + self-review.
   - **The hallway test itself runs OUTSIDE this dev-phase**: the maintainer recruits + runs participants after epic-3 ships, fills `_evidence/` per AC-2..AC-5, and the aggregate go/no-go gates Epic 4 start.
   - Code-review Mode 2 accepts this story at `review` status with the scaffold-only Dev Agent Record note; **`tds deliver` flips epic-3 stories review → approved → done** at delivery time. The eventual `_evidence/` files are appended in a separate non-epic-3 commit on main (or via a `_evidence/`-scoped follow-up PR).

## Tasks / Subtasks

- [x] **Task 1: Create `_evidence/` directory + `.gitkeep` (AC-1)**
  - [x] 1.1 `_evidence/.gitkeep` empty file.

- [x] **Task 2: Author `_evidence/3.8-hallway-test-template.md` (AC-2)**
  - [x] 2.1 Per-user evidence template with the named sections + the four hypothesis questions verbatim.

- [x] **Task 3: Author `_evidence/3.8-hallway-test-summary-template.md` (AC-3)**
  - [x] 3.1 Aggregate-summary template with per-session links, aggregate verdict table, qualitative pain points, go/no-go decision.

- [x] **Task 4: Author `_evidence/3.8-recruitment-and-protocol.md` (AC-4)**
  - [x] 4.1 Recruitment sources + cold-message template.
  - [x] 4.2 The four interview questions verbatim.
  - [x] 4.3 Consent + redaction handling.
  - [x] 4.4 Maintainer go/no-go protocol.
  - [x] 4.5 Session protocol + timing.

- [x] **Task 5: Author `docs/local-build-instructions.md` (AC-5)**
  - [x] 5.1 Prerequisites + one-command build.
  - [x] 5.2 Happy-path walkthrough.
  - [x] 5.3 Known interim limitations.
  - [x] 5.4 corpus-v0.1.0 tag instruction (Task 6 cross-reference).

- [x] **Task 6: Document the `corpus-v0.1.0` tag instruction (AC-6)**
  - [x] 6.1 Embed the instruction in `docs/local-build-instructions.md` (close to where `make dev` runs) — "if `git describe --tags --match 'corpus-v*'` fails locally, the footer link is unresolved; the tag lands at epic-3 delivery time".
  - [x] 6.2 Embed the same instruction in this story's Dev Agent Record so the auditor sees it during code-review Mode 2.

- [x] **Task 7: Verify no-regression (AC-7, AC-8)**
  - [x] 7.1 `make test` exit 0 (same 434 baseline).
  - [x] 7.2 `make lint` exit 0.
  - [x] 7.3 `make build-methodology` exit 0.
  - [x] 7.4 Story file's `status:` reaches `review` per state-machine flow.

## Dev Notes

### What this story is and is NOT

**IS (this dev-phase run):**
1. `_evidence/.gitkeep` (1 file, empty).
2. `_evidence/3.8-hallway-test-template.md` (per-user evidence template).
3. `_evidence/3.8-hallway-test-summary-template.md` (aggregate summary template).
4. `_evidence/3.8-recruitment-and-protocol.md` (recruitment + interview protocol README).
5. `docs/local-build-instructions.md` (participant-facing local-build README).
6. Documented instruction for the `corpus-v0.1.0` tag (created at epic-3 deliver, not here).

**IS NOT (this dev-phase run):**
- The actual hallway-test sessions (3-5 outside-team participants). The maintainer recruits + runs these AFTER epic-3 ships. The session evidence (`_evidence/3.8-hallway-test-<handle>.md` files) is appended in a separate commit / PR.
- The aggregate summary's go/no-go verdict (the `_evidence/3.8-hallway-test-summary.md` filled-in file, distinct from the *template*). Filled in after sessions complete.
- The `corpus-v0.1.0` git tag itself. Created by `tds deliver` flow at epic-3 merge-to-main time.
- Any code or test changes. This story is documentation + scaffolding only.

**EXPLICITLY DEFERRED to a non-epic-3 follow-up:**
- The filled-in `_evidence/3.8-hallway-test-<handle>.md` files per participant.
- The filled-in `_evidence/3.8-hallway-test-summary.md` aggregate.
- Epic 4 PR description's reference to the aggregate summary (Epic 4 first-PR author cites this when opening Epic 4 Story 4.1).
- Any "Story 3.8b" bridge items surfaced by the hallway test (handled in `epic-3-retrospective` as Bridge Plan items).

### Critical decisions encoded here

**Decision 1: SCAFFOLD-ONLY for the dev-phase run; evidence appended later.** A hallway test is a human-evidence-collection task that cannot be automated. Trying to "execute" the story in a dev-phase run would either (a) fake the evidence (forbidden), or (b) block epic-3 delivery for weeks while the maintainer recruits. The scaffold-only posture lets epic-3 deliver to main + the methodology stub pages become reachable + the maintainer recruits in their own time. The aggregate go/no-go gates Epic 4 START, NOT epic-3 DELIVERY. Per epic-spec wording: "the v1 hypothesis is provisionally validated and Epic 4 can proceed" — the gate is on Epic 4, not on Epic 3 close. This decision was made explicitly via user prompt at the start of `/bmad-tds-execute-epic` run.

**Decision 2: Templates live in `_evidence/`, NOT in `docs/` or `_bmad-output/`.** The maintainer's working directory for evidence is `_evidence/` (root-level). The path is short, owned, and easy to grep. The templates live next to where the filled-in files will live; copy-and-fill workflow.

**Decision 3: The `corpus-v0.1.0` tag is INSTRUCTED here, CREATED at deliver.** `tds deliver` runs in code-review Mode 2 and produces the squash commit on main. The tag is created on that exact commit. Putting `git tag` in the dev-phase story would create a tag on the story-branch (wrong commit); deferring to the auditor flow is correct. The instruction surfaces in the self-review so the auditor sees it.

**Decision 4: Four interview questions verbatim from epic-spec.** Resist the temptation to refine. The epic-spec wording is the contract; refining the questions in the protocol README would re-open scope that John + Sally already closed. If the maintainer finds the questions don't elicit useful answers after 2-3 sessions, that's a retro Bridge Plan item, not a Story 3-8 in-flight refinement.

**Decision 5: Coded summary + verbatim quotes BOTH recorded per participant.** Verbatim is the raw evidence (immune to maintainer-bias coding errors); coded is the aggregation surface (countable for the ≥3-of-N threshold). The aggregate summary references coded; researchers / auditors verify by reading verbatim. Standard qualitative-research practice.

**Decision 6: Consent + redaction is OPT-IN by the participant.** Default to pseudonym for participants who don't choose. The aggregate summary is publishable (it's coded, no PII); individual session files are gated on participant choice. This makes the hallway test ethically defensible to the project's stated zero-PII posture (NFR8) and to participants who DM the maintainer in good faith.

**Decision 7: Local-build instructions document is `docs/local-build-instructions.md`, NOT a section in README.md.** README.md is project-facing (for skeptics + citers + the wider audience); local-build is participant-facing (a narrow procedural document). Keeping them separate keeps each audience's information density right.

### Architecture compliance — references

| Topic | Source |
|---|---|
| Load-bearing aha-click UX hypothesis | epics.md Epic 3 narrative + Story 3.8 (lines 1119-1146) |
| corpus-v0.1.0 initial-tag discipline | docs/adr/release-tag-namespace-contract.md line 61-73 |
| Interview question wording (verbatim) | epics.md Story 3.8 (a), (b), (c), (d) |
| Aggregate verdict thresholds (≥3 of N) | epics.md Story 3.8 |
| Bridge Plan retro pattern | docs/corpus-build-conventions.md retro flow (Story 3-8b deferred to retro) |
| Zero PII posture | prd.md NFR8 |
| Local-build prerequisites (Node 22) | Makefile, .github/workflows/pr-checks.yml |

### Previous story intelligence

- **Story 3-7** lands the dev-server (`tools/dev-server.mjs`) + the `make dev` target. The local-build-instructions.md document points participants at `make dev` → `http://127.0.0.1:4173/`. Without 3-7's dev-server, participants would need a static-server alternative; with it, the path is one-command.
- **Story 3-6** lands the methodology stub pages at `dist/methodology/v0.1.0/en/scoring/{percentile-to-iq,uncertainty,overview}/`. Participants will see these after the score-panel click. The interim `<pre>`-wrap rendering is intentionally ugly; the protocol README flags this so participants don't report "the page is broken" — they were warned.
- **Story 3-5** lands the score-panel + the methodology-handoff click. Participants will exercise this click as part of the hallway test.
- **Story 3-1** authored the release-tag ADR (`docs/adr/release-tag-namespace-contract.md`). Line 61-73 of that ADR pins Story 3.8 as the corpus-v0.1.0 initial-tag site. This story honors that pin via the documented instruction (the tag is created at deliver time on the right commit).
- **Story 3-3 / 3-4 / 3-5 / 3-6 / 3-7 frozen-test discipline does NOT apply** — this story authors no tests.
- **lesson-2026-05-19-001** (comments tripping source-grep lints) does NOT apply — this story authors no source files.

### Files added / modified summary (anticipated)

**New (5 documentation + scaffolding files):**
- `_evidence/.gitkeep`
- `_evidence/3.8-hallway-test-template.md`
- `_evidence/3.8-hallway-test-summary-template.md`
- `_evidence/3.8-recruitment-and-protocol.md`
- `docs/local-build-instructions.md`

**Modified (0 files):** None.

**Deleted (0 files):** None.

### Testing standards summary

- No tests authored in this story.
- All prior tests continue to pass (no regression risk).

### Project Structure Notes

- `_evidence/` is a NEW root-level directory. The directory's purpose is "evidence and artifact files that are not source, planning, or test"; this is the first time the project uses it. The `.gitkeep` commits the empty directory.
- `docs/` already exists; one new file added.

### Implementation Notes — gotchas to avoid

1. **Don't pre-fill any participant evidence.** The templates are blanks; the maintainer fills them per participant. Filling them with fake data would invalidate the qualitative-research integrity.
2. **Don't create the `corpus-v0.1.0` git tag in this story's dev-phase run.** The tag is created at epic-3 deliver time on the merge-to-main commit. Creating it on the story-branch would put the tag on the wrong commit + complicate `tds deliver`.
3. **The recruitment-and-protocol README mentions external recruitment sources (Reddit, Mastodon, HN-equivalent).** Be careful that the README does NOT instruct the maintainer to do anything that violates community norms or community ToS. The instruction is "low-key DM if you're comfortable", not "blast a thread". The maintainer's discretion is the gate.
4. **The interview questions are verbatim from the epic-spec.** Do not refine them in this story. The protocol README copies them as-written; if they need refinement, that's a retro Bridge Plan item.
5. **`_evidence/*.md` files containing real participant notes** will be appended LATER (not in this story). When that happens, the maintainer should re-read the consent posture (per AC-4) and respect each participant's redaction choice. Individual session files MAY be gitignored if maintainer-eyes-only; the aggregate summary is always publishable.
6. **The local-build-instructions.md flags interim limitations** (Pre-wrap rendering, EN-only, placeholder items) so participants don't report "broken site". The flag is non-defensive: "this is pre-release; here's what's interim". A participant who reports "the methodology page looked weird" SHOULD have that observation recorded — it's qualitative evidence — but the maintainer codes it as "expected interim" vs "tonal-handoff issue".
7. **The aggregate summary template's go/no-go threshold table is normative.** If the hallway test produces "2 of 3 comprehended the score", that does NOT meet the ≥3-of-N threshold from the epic-spec, but it does NOT necessarily mean NO-GO — it means GO-WITH-BRIDGE (Bridge Plan item in retro). The protocol README clarifies this.

### corpus-v0.1.0 tag — instruction for the deliver flow

> **For the auditor reviewing epic-3 in code-review Mode 2:**
>
> Per `docs/adr/release-tag-namespace-contract.md` line 61-73, Story 3.8 SHOULD tag `corpus-v0.1.0` at the merge-to-main of the epic-3 squash. This story (Story 3-8) is scaffold-only in the dev-phase run; the tag is NOT created here. After `tds deliver` lands the epic-3 squash on main, the auditor (or maintainer, post-deliver) MUST run:
>
> ```
> git tag corpus-v0.1.0 <main-HEAD-sha>
> git push origin corpus-v0.1.0
> ```
>
> Or the equivalent via the `gh` CLI. This unblocks the SPA shell's footer `git describe --tags --match 'corpus-v*' --abbrev=0` lookup in dev environments before Epic 8 lands the full `release.yml` automation. Without this tag, the dev-environment footer-link to methodology cannot resolve the version segment.
>
> If `tds deliver` does NOT include a hook for post-merge tagging, the auditor's epic-3 delivery checklist MUST include the tag-creation step as a manual post-merge action.

### References

- [Source: _bmad-output/planning-artifacts/epics.md] lines 1119-1146 — Story 3.8 ACs (verbatim interview questions, ≥3-of-N threshold).
- [Source: _bmad-output/planning-artifacts/prd.md] FR11 (Not-today exit, related), NFR8 (zero PII — informs consent posture).
- [Source: docs/adr/release-tag-namespace-contract.md](../../../docs/adr/release-tag-namespace-contract.md) lines 61-73 — corpus-v0.1.0 initial-tag discipline.
- [Source: docs/corpus-build-conventions.md](../../../docs/corpus-build-conventions.md) — Pipeline land schedule; the retro Bridge Plan flow.
- [Source: _bmad-output/implementation-artifacts/stories/3-7-...md] — `make dev` + dev-server (consumer for the local-build instructions).
- [Source: _bmad-output/implementation-artifacts/stories/3-6-...md] — methodology stub pages the participant will see.
- [Source: _bmad-output/implementation-artifacts/stories/3-5-...md] — score-panel + methodology-handoff click the participant will exercise.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7) via Claude Code, orchestrator role: bmad-tds-execute-epic delegating engineer phase inline for scaffold authoring.

### Debug Log References

- Scaffold-only posture confirmed via `AskUserQuestion` at start of `/bmad-tds-execute-epic` run. User chose "Scaffold-only (recommended)" over "Skip 3-8 entirely" and "Halt — manual hallway test first". Decision recorded here for auditor reading in code-review Mode 2.

### Completion Notes List

- All 7 tasks complete (scaffold + protocol + instructions + tag-instruction documented).
- 5 new files (_evidence/.gitkeep + 3 _evidence templates + docs/local-build-instructions.md). No source-code changes, no test changes.
- `make test` exit 0 (434/434 unchanged); `make lint` exit 0; `make build-methodology` exit 0; no regressions.
- The `corpus-v0.1.0` git tag is NOT created in this story's dev-phase run; the instruction for the deliver flow is documented in this Dev Agent Record + in `docs/local-build-instructions.md`.
- The actual hallway-test sessions + filled-in `_evidence/*.md` per participant + the aggregate summary are appended LATER by the maintainer in a non-epic-3 follow-up. Epic 4 START is gated on the aggregate go/no-go; epic-3 DELIVERY is NOT gated on hallway-test completion.

### File List

- _evidence/.gitkeep (new)
- _evidence/3.8-hallway-test-template.md (new)
- _evidence/3.8-hallway-test-summary-template.md (new)
- _evidence/3.8-recruitment-and-protocol.md (new)
- docs/local-build-instructions.md (new)

## Specialist Self-Review

**Decisions made:**

1. **Scaffold-only posture explicit + auditor-readable.** The user chose this mode at the start of the orchestration run. The Dev Agent Record documents the decision clearly so the clean-context auditor in code-review Mode 2 understands why `_evidence/*.md` per-participant files are absent. No fake evidence.

2. **`_evidence/` as a new root-level directory.** Short path, owned, easy to grep. The first user is Story 3-8; future stories that produce qualitative or maintainer-authored evidence will use the same directory.

3. **Templates structured for verbatim + coded both.** Standard qualitative-research practice; protects against maintainer-bias coding errors AND gives the aggregate summary a countable surface.

4. **corpus-v0.1.0 tag deferred to deliver, instructed here.** Putting `git tag` in the story would create the tag on the wrong commit (story-branch instead of main-HEAD post-squash). The instruction surfaces in two places — Dev Agent Record + docs/local-build-instructions.md — to ensure the auditor + post-deliver maintainer both see it.

5. **Local-build instructions are participant-facing, not README.md-style.** Audience separation: README is for skeptics + citers + the wider audience; local-build is for a narrow participant procedure. Keeping them separate preserves each audience's information density.

**Alternatives considered:**

1. **Execute the hallway test inline as part of this run** — rejected per user choice + impossible (human evidence collection cannot be automated; faking evidence is forbidden).

2. **Skip Story 3-8 entirely** — rejected per user choice. Skipping would leave epic-3 incomplete and prevent code-review Mode 2 from delivering.

3. **Halt the orchestration until manual hallway test runs** — rejected per user choice. Would block epic-3 delivery for the recruitment + sessions timeline (likely weeks).

4. **Create the corpus-v0.1.0 tag here on the story-branch** — rejected. The tag MUST be on main-HEAD post-squash; creating it earlier puts it on the wrong commit.

5. **Author the participant evidence as placeholder text** — rejected; would invalidate the qualitative-research integrity. Better to have empty templates than fake data.

**Framework gotchas avoided:**

- Per the memory feedback `lesson-2026-05-19-001` — comment-text tripping source-grep lints: not applicable (no source code authored).
- Per `feedback_tds_state_machine_quirks` — branch start auto-flips to tests-pending; this story has no tests, so the `tests-pending → tests-drafting → tests-approved → in-progress → review` flow is exercised entirely through the documentation-only impl. No frozen-test edits.
- Per `feedback_tds_retro_state_flip` — that's about retro state flips, not applicable in this dev-phase story.

**Areas of uncertainty:**

1. **The `corpus-v0.1.0` tag's exact post-deliver creation path.** If `tds deliver` includes a hook for post-merge tagging, the tag lands automatically; if not, the auditor's delivery checklist or the maintainer's post-deliver action is the path. Auditor in code-review Mode 2 should confirm which path applies and surface it explicitly in the epic-3 delivery summary.

2. **Whether the hallway-test participant evidence files should be gitignored.** Individual session files contain participant-chosen redaction; some participants may want maintainer-eyes-only. Options: (a) commit all files but mark each participant's name with their consent choice; (b) gitignore `_evidence/3.8-hallway-test-*.md` (except the summary + template) and the maintainer keeps participant files local-only; (c) commit only the publishable ones, gitignore the maintainer-eyes-only ones explicitly. The protocol README documents the choice as a decision for the maintainer at session time. Future-Maksim should decide; no commit needed in this story.

3. **The aggregate summary's go/no-go threshold semantics** — the epic-spec says "≥3 of N" but doesn't pin N. If the maintainer runs 3 participants and all 3 comprehend, that's ≥3 of 3 → GO. If the maintainer runs 5 and 3 comprehend, that's ≥3 of 5 → GO. The protocol README pins the more conservative reading: if N=3, all three must comprehend; the threshold makes sense at any N in the [3, 5] range.

4. **The maintainer's recruitment time isn't gated by epic-3 delivery.** This is intentional per Decision 1. But epic-4 start IS gated. The protocol README + the aggregate summary template surface this clearly so future-Maksim doesn't accidentally start Epic 4 work before the hallway test concludes.

5. **The protocol README mentions external recruitment sources.** None of these are project-controlled; the maintainer's discretion governs.

**Tested edge cases:**

- No automated tests in this story. The scaffold is documentation; auditor in code-review Mode 2 reviews the markdown content for completeness + clarity, not for test-pass.
- `make test` continues to pass (no regression — no source-code touched).
- `make lint` continues to pass (no regression).
- The instruction for `corpus-v0.1.0` tag creation is documented in two places (Dev Agent Record + docs/local-build-instructions.md) for auditor + post-deliver maintainer visibility.
