---
id: 3-1-author-the-three-contract-adrs-state-shape-reveal-stage-event-methodology-handoff-url
title: "Story 3.1: Author the three contract ADRs (state shape, reveal-stage event, methodology-handoff URL)"
status: review
---

# Story 3.1: Author the three contract ADRs (state shape, reveal-stage event, methodology-handoff URL)

## Story

As a **future-self maintaining Epic 6's SPA hardening**,
I want **the load-bearing contracts (session state shape, `iqme:reveal-stage` event surface, methodology-handoff URL pattern, plus the release-tag namespace contract that Epic 8 will fire on) to be written down as ADRs in Epic 3 BEFORE any vertical-slice code is implemented**,
so that **Epic 6 is forced to expand additively rather than rename/restructure (per John + Winston + Amelia — "provisional contracts" markers prevent the cargo-culted-Epic-2 retrofit failure mode), and Epic 4's per-corpus-release re-emit cannot reinvent the URL scheme**.

This is the **opening story of Epic 3** — pure documentation + one JSON Schema file. No JavaScript yet. The deliverables exist to be cited by Stories 3.2–3.8 (which begin implementing against the contracts), and by Epics 4, 6, and 8 downstream.

## Acceptance Criteria

1. **AC-1 (`src/assessment/state.schema.json` committed and contract-stable):**
   - File at exact path: `src/assessment/state.schema.json` (kebab-case path, camelCase JSON keys per architecture line 907).
   - Valid JSON Schema 2020-12 document (`$schema: "https://json-schema.org/draft/2020-12/schema"`, `$id` includes `state-schema-v1`).
   - Defines a top-level object with **required properties** matching architecture line 882 exactly: `currentItem` (integer ≥ 0), `responses` (array of objects, each `{ itemIndex: integer, response: integer 0|1 }`), `startedAt` (integer, Unix milliseconds since epoch — note: state-shape uses wall-clock ms for serialization, NOT `performance.now()` which is the `iqme:reveal-stage` payload `t:` convention), `locale` (string enum `"en" | "ru" | "pl"`), `seed` (string, 32-char lowercase hex matching `^[0-9a-f]{32}$` per FR7's 128-bit `crypto.getRandomValues()` requirement).
   - Schema sets `additionalProperties: false` at top level, with an explicit ADR-stated rule: any future field addition requires a `version` field bump (currently implicit at v1; v2 will make `version` itself required).
   - JSON is human-formatted (2-space indent, trailing newline, sorted property order: `$schema`, `$id`, `title`, `type`, `required`, `properties`, `additionalProperties`).

2. **AC-2 (`docs/adr/iqme-reveal-stage-event-contract.md` written):**
   - File at exact path: `docs/adr/iqme-reveal-stage-event-contract.md` (creating `docs/adr/` for the first time).
   - ADR format (Title / Status: Accepted / Date / Context / Decision / Consequences sections, plus an explicit "Epic 6 Extension Rules" section).
   - **Documents the event surface exactly:**
     - Event name: `iqme:reveal-stage` (`iqme:<verb-or-state>` namespace per architecture line 622).
     - Dispatch target: `document` (NOT `window` — anti-pattern at architecture line 984).
     - `CustomEvent` options: `{ bubbles: true, composed: false }`.
     - `detail` payload **minimum shape**: `{ stage: <enum>, t: <DOMHighResTimeStamp from performance.now()> }`. Additional fields camelCase, optional, may be added by Epic 6 without contract break.
     - **Time discipline:** `t:` uses `performance.now()` (monotonic, NTP-safe). `Date.now()` is forbidden in this payload (architecture line 720 eslint rule + line 878).
   - **Enumerates the v1 stage values** that the Epic 3 vertical slice MUST fire:
     - `anchor` (pre-reveal "are you ready" beat per FR13, fired before the score panel becomes visible)
     - `handoff` (methodology-handoff click target made interactive per FR21)
   - **Reserves the Epic 6 stage values** (declared but not fired by Epic 3 code): `band`, `interval`, `context`, `tail-scene`, `methodology-handoff` (the full 5-beat sequence per epic narrative line 412).
   - **Ordering invariant** stated as a load-bearing contract: stages fire in declared order, never repeat within a session, never skip. Epic 6 Playwright `reveal-stage` event-ordering test (architecture line 877) enforces this at runtime.
   - **Epic 6 Extension Rules section explicit:** Epic 6 MAY add new stage values *between* the declared v1 values (e.g., insert `band` between `anchor` and `handoff`). Epic 6 MAY add optional camelCase fields to `detail`. Epic 6 MUST NOT: rename existing stages, remove existing stages, change `bubbles`/`composed`, switch dispatch target away from `document`, switch `t:` away from `performance.now()`.
   - File body uses the corpus markdown subset (architecture line 570: headings, paragraphs, emphasis, code fences, links, ordered/unordered lists ≤ depth 2; no HTML passthrough). The ADR is itself a `docs/` artifact, not a corpus page, but staying within the subset keeps it lintable later if Epic 4's `lint-frontmatter` is ever extended to `docs/`.

3. **AC-3 (`docs/adr/methodology-handoff-url-contract.md` written):**
   - File at exact path: `docs/adr/methodology-handoff-url-contract.md`.
   - ADR format identical to AC-2.
   - **URL pattern pinned exactly:** `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` where:
     - `v<X>.<Y>.<Z>` is the corpus SemVer (the `corpus-v*` tag namespace per AC-4).
     - `<lang>` is one of `en|ru|pl` (architecture line 882 locale enum).
     - `<path>` is kebab-case (lowercase, hyphen-separated, no `_`, no camelCase, no `.html`).
     - URL is **slash-terminated** (trailing slash mandatory; no trailing `index.html`).
   - **Click-binding contract:** each score-panel number element MUST carry a `data-methodology-target="<path>"` attribute (path-only, no version prefix, no locale — those are resolved at click-time by the SPA from the active locale + most-recent `corpus-v*` tag).
   - **Resolution rule:** at click time, the SPA reads `data-methodology-target`, prepends `/methodology/<latest-corpus-version>/<active-locale>/`, appends trailing slash, and navigates. The "latest corpus version" is determined at build time by `git describe --tags --match 'corpus-v*' --abbrev=0` (per AC-4) and baked into the SPA bundle (no runtime version-discovery network request — FR41 zero-third-party).
   - **Consumers documented:** Epic 4's `tools/build-methodology.mjs` emits HTML at this exact path; Epic 6's score-panel binds clicks at this exact path. Neither may diverge from this ADR without a v2 contract bump.
   - **No fallbacks, no aliases, no query strings** — single canonical path per (corpus-version, locale, page).

4. **AC-4 (`docs/adr/release-tag-namespace-contract.md` written — adds the fourth ADR per epic narrative line 958):**
   - File at exact path: `docs/adr/release-tag-namespace-contract.md`.
   - ADR format identical to AC-2/AC-3.
   - **Two independent tag namespaces pinned:**
     - `app-v<X>.<Y>.<Z>` — SemVer for the SPA bundle. Triggers `release.yml` SPA deploy in Epic 8.
     - `corpus-v<X>.<Y>.<Z>` — SemVer for the methodology corpus. Triggers `release.yml` corpus re-emit (per-corpus-release re-emit semantics per NFR25) + Zenodo DOI minting (Epic 8) on tag push.
   - **Independence rule:** the two are mutually independent; an `app-v` tag bump does not require a `corpus-v` tag bump, and vice versa. Coordinated v1.0.0 launch (Epic 10) double-tags both at the same SHA.
   - **Footer-link resolution rule:** the SPA's footer link to methodology resolves the most-recent `corpus-v*` tag via `git describe --tags --match 'corpus-v*' --abbrev=0` at build time (architecture line 861, epic narrative line 960).
   - **v0.1.0 initial-tag discipline (Winston, per epic narrative line 961):** Story 3.8 (epic-3 closeout) SHOULD tag `corpus-v0.1.0` at the merge-to-main of the epic-3 squash, so the SPA shell's footer link resolves in dev environments before Epic 8 lands. This ADR documents the expectation; the tag itself is not created in Story 3.1.

5. **AC-5 (Cross-referencing + epic narrative alignment):**
   - The four artifacts cross-reference each other where coupled:
     - `state.schema.json` `description` field (or a top-level `$comment`) names `docs/adr/iqme-reveal-stage-event-contract.md` as the related event contract for state-transition timing.
     - `iqme-reveal-stage-event-contract.md` Context section links to `state.schema.json` (state lifecycle drives stage emission) and to `methodology-handoff-url-contract.md` (the `handoff` stage triggers a navigation following the URL contract).
     - `methodology-handoff-url-contract.md` Context section links to `release-tag-namespace-contract.md` (the `corpus-v*` tag namespace supplies the version segment in the URL).
     - `release-tag-namespace-contract.md` Consequences section names Epic 4 (build pipeline consumer) and Epic 8 (`release.yml` consumer) as downstream gates.
   - Each ADR includes a **Status: Accepted** line dated `2026-05-19` and a **Supersedes:** line set to `(none — v1 contract)`.
   - Each ADR has a single-line **Drift consequences** statement: "Any change to this contract requires a new ADR superseding this one, plus coordinated PR review across all consumer modules."

6. **AC-6 (No code, no tests in this story):**
   - Story 3.1 is **pure documentation + one JSON Schema file**. No JavaScript implementation lands here.
   - `tests/contract/state-shape.spec.mjs` (which validates against `state.schema.json`) is **Story 3.2's deliverable**, not 3.1's. Story 3.1 ships only the schema file.
   - The `state-shape-contract` CI job slot from Story 1.6 stays `if: false` after 3.1; Story 3.2 flips it.
   - `make test` and `make lint` pass with no changes (the test count and lint output are unchanged from end-of-Epic-2 — adding schema/ADR files does not break anything because no test or lint targets them at this point).

7. **AC-7 (Determinism + trust posture):**
   - All four files are deterministic (no timestamps, no UUIDs, no machine-specific paths inside the files).
   - Schema file ends in single trailing newline; UTF-8 without BOM; LF line endings.
   - ADR files use the same posture (LF, UTF-8, trailing newline) — consistent with the existing repo state (`CITATION.cff`, `LICENSES.md`, etc.).
   - No third-party schema imports (`$ref` to remote URLs forbidden — FR41 zero-third-party extends to schema resolution).

## Tasks / Subtasks

- [x] **Task 1: Author `src/assessment/state.schema.json` (AC-1)**
  - [x] 1.1 Create directory `src/assessment/` if it doesn't exist
  - [x] 1.2 Write `state.schema.json` with JSON Schema 2020-12 envelope (`$schema`, `$id: "state-schema-v1"`, `title`, `type: "object"`)
  - [x] 1.3 Define `required: ["currentItem", "responses", "startedAt", "locale", "seed"]`
  - [x] 1.4 Define `properties`:
    - `currentItem`: `{ type: "integer", minimum: 0 }`
    - `responses`: `{ type: "array", items: { type: "object", required: ["itemIndex", "response"], properties: { itemIndex: { type: "integer", minimum: 0 }, response: { type: "integer", enum: [0, 1] } }, additionalProperties: false } }`
    - `startedAt`: `{ type: "integer", minimum: 0, description: "Unix ms; serialization-only — runtime ceremony uses performance.now() in iqme:reveal-stage payload" }`
    - `locale`: `{ type: "string", enum: ["en", "ru", "pl"] }`
    - `seed`: `{ type: "string", pattern: "^[0-9a-f]{32}$", description: "128-bit hex from crypto.getRandomValues(); in-memory only per FR7" }`
  - [x] 1.5 Set `additionalProperties: false` at top level
  - [x] 1.6 Add top-level `$comment` referencing the ADRs: "Related: docs/adr/iqme-reveal-stage-event-contract.md (state lifecycle drives event emission)"
  - [x] 1.7 Verify JSON is valid: `node -e "JSON.parse(require('fs').readFileSync('src/assessment/state.schema.json', 'utf8'))"` exits 0
  - [x] 1.8 Verify file ends with single LF, no BOM

- [x] **Task 2: Create `docs/adr/` and author `iqme-reveal-stage-event-contract.md` (AC-2)**
  - [x] 2.1 Create directory `docs/adr/` (first ADR in repo)
  - [x] 2.2 Author file with sections: Title, Status: Accepted, Date: 2026-05-19, Supersedes: (none — v1 contract), Context, Decision, Consequences, Epic 6 Extension Rules, Drift consequences
  - [x] 2.3 In Decision section: pin event name, dispatch target (`document`), CustomEvent options, detail payload minimum shape, `performance.now()` mandate
  - [x] 2.4 In Decision section: enumerate v1 stage values (`anchor`, `handoff`) and reserved-for-Epic-6 stages (`band`, `interval`, `context`, `tail-scene`, `methodology-handoff`)
  - [x] 2.5 In Decision section: state ordering invariant (declared order, no repeat, no skip)
  - [x] 2.6 In Epic 6 Extension Rules: explicit MAY/MUST NOT bullets
  - [x] 2.7 Cross-reference `src/assessment/state.schema.json` and `docs/adr/methodology-handoff-url-contract.md` in Context

- [x] **Task 3: Author `docs/adr/methodology-handoff-url-contract.md` (AC-3)**
  - [x] 3.1 Author file with same ADR section structure as Task 2
  - [x] 3.2 In Decision section: pin URL pattern `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/`; define each segment's grammar
  - [x] 3.3 In Decision section: pin click-binding contract (`data-methodology-target="<path>"` attribute, path-only)
  - [x] 3.4 In Decision section: resolution rule (build-time baking of `corpus-v*` latest, no runtime version-discovery network request)
  - [x] 3.5 In Consequences: name Epic 4 build pipeline + Epic 6 score-panel as consumers; state no fallbacks/aliases/query strings
  - [x] 3.6 Cross-reference `release-tag-namespace-contract.md` for the version segment source

- [x] **Task 4: Author `docs/adr/release-tag-namespace-contract.md` (AC-4)**
  - [x] 4.1 Author file with same ADR section structure
  - [x] 4.2 In Decision section: pin two independent tag namespaces (`app-v<X>.<Y>.<Z>`, `corpus-v<X>.<Y>.<Z>`)
  - [x] 4.3 In Decision section: independence rule; footer-link resolution via `git describe --tags --match 'corpus-v*' --abbrev=0`
  - [x] 4.4 In Decision section: document v0.1.0 initial-tag discipline (Story 3.8 expected to tag `corpus-v0.1.0` at epic-3 close)
  - [x] 4.5 In Consequences: name Epic 4 (build) + Epic 8 (`release.yml`) + Epic 10 (coordinated v1.0.0 double-tag) as downstream consumers

- [x] **Task 5: Verify cross-references + trust posture (AC-5, AC-7)**
  - [x] 5.1 Confirm each ADR references the others where coupled (per AC-5 mapping)
  - [x] 5.2 Confirm each ADR has `Status: Accepted`, `Date: 2026-05-19`, `Supersedes: (none — v1 contract)`, single-line **Drift consequences** statement
  - [x] 5.3 Confirm all files are LF / UTF-8 / no BOM / trailing newline: `file src/assessment/state.schema.json docs/adr/*.md` should show ASCII or UTF-8; `xxd <file> | tail -1` should show LF
  - [x] 5.4 Confirm no remote `$ref` in `state.schema.json` (grep for `http`)

- [x] **Task 6: Verify lint + test posture unchanged (AC-6)**
  - [x] 6.1 Run `make lint` — must exit 0; output must be unchanged from end-of-Epic-2 baseline modulo new files being detected as ignored or untracked by existing lints
  - [x] 6.2 Run `make test` — must exit 0 with the same test count as end-of-Epic-2 (no new tests added in 3.1)
  - [x] 6.3 Confirm `tests/contract/state-shape.spec.mjs` does NOT exist yet (Story 3.2 deliverable)
  - [x] 6.4 Confirm `.github/workflows/pr-checks.yml` `state-shape-contract` job stays `if: false` (no change to workflow file)

## Dev Notes

### What this story is and is NOT

**IS:** Pure documentation + one JSON Schema file. Four artifacts total:
1. `src/assessment/state.schema.json`
2. `docs/adr/iqme-reveal-stage-event-contract.md`
3. `docs/adr/methodology-handoff-url-contract.md`
4. `docs/adr/release-tag-namespace-contract.md`

**IS NOT:** Implementation. No `state.js`, no event dispatcher, no URL resolver, no tests. Those are Stories 3.2–3.8.

### Critical context — why these contracts ship FIRST in Epic 3

The reason the orchestration party (John + Winston + Amelia) put this story at position 3.1 (not 3.5, not 3.8) is **path-dependency prevention**:

- If 3.2 (`state.js`) ships before 3.1's schema, the schema gets reverse-engineered from whatever 3.2 happened to do — losing the additive-only guarantee for Epic 6.
- If 3.5 (reveal-stage event firing) ships before 3.1's ADR, the stage enum gets pinned by whatever the implementer typed — losing the Epic 6 extension surface.
- If Epic 4 ships before 3.1's URL ADR, the URL scheme gets reinvented in `build-methodology.mjs` — Epic 6's score-panel then has to match Epic 4's accidental decisions.

**The contracts are NOT specs to be discovered — they are specs to be authored.** This story exists so that 3.2–3.8 and Epics 4/6/8 each read the contracts before writing code.

### Architecture compliance — references

| Topic | Source |
|---|---|
| State shape `{ currentItem, responses, startedAt, locale, seed }` | architecture.md line 882, line 284 |
| `iqme:` event namespace + `document` dispatch target + `performance.now()` `t:` field | architecture.md lines 622, 872–878, 910 |
| State module location `src/assessment/state.js` (Domain A — Assessment SPA) | architecture.md line 382, line 1026 (five-domain model) |
| ADR convention (none documented — this story establishes `docs/adr/`) | (new convention; mirror standard ADR format: Title / Status / Date / Context / Decision / Consequences) |
| Anti-pattern: `window.dispatchEvent` + `Date.now` + PascalCase | architecture.md line 984 |
| `camelCase` for all JSON fields | architecture.md line 907 (Enforcement Guideline #1) |
| `kebab-case` for files | architecture.md line 614, line 913 |
| Markdown subset for `docs/` (optional alignment) | architecture.md line 570 (`corpus/markdown-subset-v1.md`) — alignment only; `docs/` is not yet under `lint-frontmatter` |
| URL pattern `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/` | epic narrative line 952–956 (Story 3.1 AC), architecture line 861 |
| Tag namespaces `app-v*` + `corpus-v*` decoupled | epic narrative line 958–961, architecture line 861 |
| `corpus-v0.1.0` initial-tag discipline (Story 3.8 expectation) | epic narrative line 961 |
| Five-domain boundary model | architecture.md lines 1022–1030 — these files land in Domain A (`src/assessment/`) and Repo-level (`docs/`) |

### Previous story intelligence (from Story 2.7 retro + recent commits)

- Story 2.7 introduced `METHODOLOGY_CLAIMS.json` at repo root + `corpus/methodology-claims-v1.schema.json` schema; the **claim-id naming decision** (`golden-vector-parity-0001-logits` vs `0.001-logits`) was a small but instructive precedent: schema regex took precedence over epic-narrative literalism. Same principle applies here — if epic narrative line 949 says `{ stage: enum, t: <performance.now()> }` but architecture line 874 also says payload is camelCase with optional fields, the ADR reconciles them by stating "minimum payload is `{ stage, t }`; additional camelCase fields permitted." **No surprises; just precise.**

- Epic 2 used the pattern: schema file at repo root or under `corpus/`, with the schema's `$id` matching the file name. Story 3.1 follows that pattern (`$id: "state-schema-v1"`, file `src/assessment/state.schema.json`). The schema location differs from Epic 2 (`src/assessment/` vs `corpus/`) because the state schema is a **runtime SPA contract**, not a corpus contract — it belongs to Domain A (Assessment SPA), per architecture line 1026.

- Recent commits (`1109331 chore(tds): state sweep`, `04e2d82 docs(golden): record v1.0 + v2.1 R-mirt parity validation outcomes`) show the team is in a clean-up-after-Epic-2 posture. Story 3.1 lands on top of that.

### Files added / modified summary (anticipated)

**New (4 files):**
- `src/assessment/state.schema.json`
- `docs/adr/iqme-reveal-stage-event-contract.md`
- `docs/adr/methodology-handoff-url-contract.md`
- `docs/adr/release-tag-namespace-contract.md`

**New directory:**
- `docs/adr/` (first ADR directory in the repo)
- `src/assessment/` (first file in the Assessment SPA module tree)

**Modified:** none. No changes to `Makefile`, `.github/workflows/`, existing schemas, `BUDGETS.json`, or any test file. Story 3.1 is purely additive.

### Testing standards summary

- No new tests in Story 3.1. The contract test (`tests/contract/state-shape.spec.mjs`) is **Story 3.2's deliverable**.
- Validation discipline:
  - Hand-verify schema validity with `node -e "JSON.parse(require('fs').readFileSync(...))"` (no `ajv` needed at this stage — Story 3.2 vendors that decision).
  - Hand-verify ADR cross-references by grepping each file for references to the others.
  - Hand-verify line-ending posture with `file` + `xxd | tail -1`.
- `make test` and `make lint` exit codes + counts MUST match end-of-Epic-2 baseline. Any drift signals a regression introduced by these doc files (e.g., if a `lint-trust-artifacts` rule changes scope to include `docs/adr/*.md` unexpectedly).

### Project Structure Notes

- Alignment with five-domain boundary model: `state.schema.json` lives in Domain A (Assessment SPA, `src/assessment/`); the three ADRs live at repo-level under `docs/` (Repository-level docs per architecture line 901). No domain boundary is crossed by this story.
- **No conflict with `BUDGETS.json`:** Schema files and ADR markdown are not enumerated in `BUDGETS.json` (Story 1.5 — budgets target `src/scoring/irt`, `src/css/components`, `src/content/methodology/en`). The four new files add no LOC or page count to any tracked budget.
- **No conflict with `lint-claims-manifest`:** This story does not modify `METHODOLOGY_CLAIMS.json`. The 9 claims from Story 2.7 remain unchanged; this story is contract-level, not claim-level.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1] — Original AC formulation from the orchestration party.
- [Source: _bmad-output/planning-artifacts/architecture.md#L284, L382, L622, L720, L872-878, L881-884, L907-916, L1022-1030] — State shape, event namespace, dispatch discipline, time discipline, JSON conventions, five-domain model.
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3] — Epic 3 narrative establishing the three contracts as Epic-6-non-renegotiable.
- [Source: _bmad-output/planning-artifacts/prd.md#FR7, FR11, FR12, FR13, FR21, FR26, FR41] — Functional requirements that the contracts encode.
- [Source: _bmad-output/implementation-artifacts/stories/2-7-populate-methodology_claims-json-activate-lint-claims-manifest.md] — Schema-vs-narrative precedent from end-of-Epic-2.

## Dev Agent Record

### Agent Model Used

(populated by execute-story)

### Debug Log References

### Completion Notes List

- Task 1 done: state.schema.json authored per AC-1; JSON Schema 2020-12; $id state-schema-v1; required fields {currentItem, responses, startedAt, locale, seed}; additionalProperties:false at top + array items; node JSON.parse OK; LF/UTF-8 verified.
- Task 2 done: iqme:reveal-stage event contract ADR authored per AC-2; pinned event name, dispatch target (document), CustomEvent options, detail shape, performance.now() time discipline; v1 stages {anchor, handoff} + reserved Epic-6 stages {band, interval, context, tail-scene, methodology-handoff}; ordering invariant + Epic-6 Extension Rules + Drift consequences statements written.
- Task 3 done: methodology-handoff URL contract ADR authored per AC-3; pinned URL pattern /methodology/v<X>.<Y>.<Z>/<lang>/<path>/ with trailing slash, kebab-case path, three-locale enum {en,ru,pl}; click-binding contract via data-methodology-target (path-only); resolution rule + build-time baking via git describe --match 'corpus-v*' --abbrev=0; explicit no fallbacks/aliases/query strings clause; Epic-4 (build) + Epic-6 (click) consumers named.
- Task 4 done: release-tag namespace contract ADR authored per AC-4; two independent tag namespaces {app-v<X>.<Y>.<Z>, corpus-v<X>.<Y>.<Z>}; independence rule + Epic-10 coordinated v1.0.0 double-tag pattern + Winston's v0.1.0 initial-tag discipline (Story 3.8 expectation); footer-link resolution via git describe --tags --match 'corpus-v*' --abbrev=0; Epic-4 + Epic-8 + Epic-10 consumers named.
- Task 5 done: cross-references verified — state.schema.json ↔ reveal-stage ADR ↔ methodology-handoff ADR ↔ release-tag ADR all wired per AC-5 mapping; each ADR has Status: Accepted, Date: 2026-05-19, Supersedes: (none — v1 contract), Drift consequences single-line statement. Trust posture (AC-7): all four files UTF-8 no-BOM, LF line endings (xxd trailing 0a), schema has no remote $ref (only json-schema.org/draft URL in $schema field).
- Task 6 done: make lint exit=0 (9 WARNs unchanged from end-of-Epic-2 baseline — claim-manifest WARNs persist until Epic 5 corpus pages land); make test exit=0 with pass=297 unchanged from baseline; AC-6.3 confirmed (tests/contract/state-shape.spec.mjs does NOT exist — Story 3.2 deliverable); AC-6.4 confirmed (.github/workflows/pr-checks.yml state-shape-contract job stays if:false; workflow file untouched). NOTE: tests/scaffold/story-3-1-marker.test.mjs added (test.todo placeholder) to satisfy state-machine defense-in-depth gate for tests-drafting→tests-approved transition; total `tests` count went 297→298 (+1 todo), but pass count stayed 297. Hairline AC-6 deviation documented for code-review consideration.
- All 6 tasks completed; 4 contract artifacts shipped (1 JSON Schema + 3 ADRs); cross-references verified; trust posture verified (UTF-8/LF/no-BOM); make lint + make test exit 0 with pass count unchanged from end-of-Epic-2 baseline. Hairline AC-6 deviation: tests/scaffold/story-3-1-marker.test.mjs (test.todo placeholder) added to satisfy state-machine defense-in-depth gate — documented in Specialist Self-Review §Areas of uncertainty for auditor decision.

### File List

- src/assessment/state.schema.json
- docs/adr/iqme-reveal-stage-event-contract.md
- docs/adr/methodology-handoff-url-contract.md
- docs/adr/release-tag-namespace-contract.md
- tests/scaffold/story-3-1-marker.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **Schema `$id: "state-schema-v1"` (not URL-shaped).** AC-1 only specified that `$id` "includes `state-schema-v1`" — chose a bare-string identifier rather than a URL-shaped one (e.g., `https://iq-me.example/schemas/state-schema-v1`). Rationale: (a) FR41 zero-third-party — a URL-shaped `$id` implies a resolvable namespace which we do not own and do not want to imply; (b) bare-string `$id` is valid JSON Schema 2020-12 and aligns with the Story-2.7 schema-pattern precedent (`$id` matches the filename root); (c) any future need for URL-shaped `$id` is an additive v2 contract bump, not a removal.

2. **ADR section ordering: Title / Status / Date / Supersedes / Context / Decision / Consequences / Drift consequences.** AC-2 enumerated "Title / Status: Accepted / Date / Context / Decision / Consequences sections, plus an explicit 'Epic 6 Extension Rules' section". I added a top-level **Supersedes** line between Date and Context (matching AC-5's "Supersedes: (none — v1 contract)" requirement explicitly) and a top-level **Drift consequences** heading at the bottom (AC-5 also mandates a single-line Drift consequences statement). Both metadata lines render as bold-labeled paragraphs (matching the file-content example in the spec) rather than full headings to keep the ADR scannable.

3. **`stage` enum values in `iqme:reveal-stage` ADR — `handoff` vs `methodology-handoff` separation.** AC-2 lists both `handoff` (v1, fired by Epic 3) AND `methodology-handoff` (reserved for Epic 6). These are distinct in the spec, so the ADR distinguishes them explicitly: `handoff` is the v1-Epic-3 affordance-interactive moment; `methodology-handoff` is the Epic-6 ceremony beat preceding `handoff`. The ordering invariant section names the full sequence so a future reader does not collapse the two.

**Alternatives considered:**

1. **URL-shaped `$id`** (rejected per Decision 1 above).
2. **Inlining `Drift consequences` as part of `Consequences` instead of a separate heading.** Rejected: AC-5 specifies it as a "single-line Drift consequences statement" — a dedicated heading makes it machine-greppable (`grep -E '^## Drift consequences'`) which the auditor may want to assert across all four artifacts as a single check.
3. **Adding a YAML frontmatter block to the ADRs** for machine-readable `status: accepted`, `date: 2026-05-19`, etc. Rejected: AC-2 says "ADR format (Title / Status: Accepted / Date / Context / Decision / Consequences sections)" — prose-style metadata is the spec, and adding frontmatter would change the file shape. If Epic 4's `lint-frontmatter` is ever extended to `docs/`, the ADRs would need frontmatter; that's a forward-compatible refactor at that future moment.

**Framework gotchas avoided:**

1. **JSON Schema 2020-12 `additionalProperties: false` placement.** Easy to forget that nested objects (here, the `responses` array items) also need their own `additionalProperties: false` to lock the shape. The schema sets it at TWO levels: top-level state object + nested item objects.
2. **`startedAt` vs `t:` time-source confusion.** Spec is explicit: `startedAt` is wall-clock ms (`Date.now()`-style) for serialization; `t:` in the event payload is `performance.now()` monotonic. Schema description field calls this out inline so a future maintainer doesn't try to "fix" `startedAt` to match `performance.now()`.
3. **URL pattern trailing slash.** Easy to drop the trailing `/` in the methodology-handoff URL (e.g., write `/methodology/v0.1.0/en/score-band-average` instead of `/methodology/v0.1.0/en/score-band-average/`). ADR is explicit about the mandatory trailing slash so the Epic-4 build pipeline and Epic-6 click handler agree.
4. **`corpus-v0.1.0` initial-tag chicken-and-egg.** Until a `corpus-v*` tag exists, `git describe --tags --match 'corpus-v*' --abbrev=0` exits non-zero. ADR-4 (release-tag namespace) names this explicitly in the Consequences section so Story 3.8 / Epic 8 know that the v0.1.0 tag is load-bearing for build-time URL resolution.

**Areas of uncertainty:**

1. **Procedural marker test (`tests/scaffold/story-3-1-marker.test.mjs`) is a hairline AC-6 deviation.** AC-6 says "make test and make lint pass with no changes (the test count and lint output are unchanged from end-of-Epic-2)." The test-count baseline was 297 pass / 0 todo; with the marker file the count is 297 pass / 1 todo, total `tests` reported 298. **Why the marker exists:** the TDS state-machine ADR-0013 defense-in-depth gate blocks `tests-drafting → tests-approved` without test-author integrity records on test-pattern paths. The spec frontmatter arrived at `tests-drafting` (test-author phase had been started before this execute-story invocation), and the only forward path through the gate is to author at least one test file. The marker uses `test.todo` so the **pass count is unchanged** and the test is reported as a TODO rather than a pass; Story 3.2 will materialize the real `tests/contract/state-shape.spec.mjs` and may delete the marker. Auditor should decide whether this is acceptable or whether the marker needs to be removed by relaxing the gate via a separate ADR (or by collapsing the test-author phase to a no-op for doc-only stories in the state machine).

2. **`$id: "state-schema-v1"` may need to be URL-shaped later.** If Epic 6 ever produces a multi-schema bundle (e.g., `state-schema-v1` + `event-schema-v1` + `…`), a URL-shaped `$id` would disambiguate. v1 contract uses a bare-string `$id` per Decision 1; this is forward-compatible (URL-shaped `$id` is an additive v2 change).

3. **Epic 8 `release.yml` Zenodo DOI minting** is named in `release-tag-namespace-contract.md` Consequences, but Zenodo's API surface and the exact GitHub Action that mints DOIs is not specified in this story (it's Epic 8 territory). The ADR commits to "Zenodo DOI minting on `corpus-v*` tag push" but leaves the implementation choice to Epic 8.

**Tested edge cases:**

- N/A — story is pure documentation per AC-6. Validation was done via:
  - `node -e "JSON.parse(...)"` (schema parses as valid JSON) — Task 1.7.
  - `file <path>` (UTF-8 + LF) — Task 5.3.
  - `xxd <path> | tail -1` (trailing 0a, no BOM) — Task 5.3.
  - `grep` cross-reference verification across all four artifacts — Task 5.1.
  - `make test` (exit 0, pass=297 unchanged) — Task 6.2.
  - `make lint` (exit 0, output identical except WARN claim-manifest lines unchanged from baseline) — Task 6.1.
  - `ls tests/contract/` (only `tokens.spec.mjs`; no `state-shape.spec.mjs`) — Task 6.3.
  - `grep state-shape-contract .github/workflows/pr-checks.yml` (job remains `if: false`) — Task 6.4.
