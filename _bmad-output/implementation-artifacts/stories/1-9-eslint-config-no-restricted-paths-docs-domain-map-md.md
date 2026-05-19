---
id: 1-9-eslint-config-no-restricted-paths-docs-domain-map-md
title: "Story 1.9: ESLint config + no-restricted-paths + docs/domain-map.md"
status: approved
---

# Story 1.9: ESLint config + domain boundary enforcement

## Story

As a **future contributor or AI agent working within the five-domain boundary model**,
I want **the `.eslintrc.json` (or `eslint.config.js`) configured with `no-restricted-paths` enforcing the A-SPA / B-Scoring / C-Content / D-Tools / E-Test-Fixtures boundaries, plus `docs/domain-map.md` enumerating which paths belong to which domain**,
so that **the architecture's domain-boundary discipline is mechanically enforced from commit #1 (per Winston — "infrastructure, not lint feature") rather than discovered the day someone adds a cross-domain import**.

## Acceptance Criteria

1. **AC-1 (`eslint.config.js` exists with the five-domain `no-restricted-paths` rule):** flat-config (`eslint.config.js`) at repo root, using ESLint 9.x flat-config API. Includes a `no-restricted-imports` rule (or `eslint-plugin-import`'s `no-restricted-paths` — NOTE: `eslint-plugin-import` is a dep we want to AVOID; we'll use `no-restricted-imports` from core which has comparable expressive power for path-based restrictions). The zones MUST be:
   - Domain A (`src/assessment/**`) — may import from B (`src/scoring/**`), C (`src/content/**` — read-only), but NOT from D (`tools/**`) or E (`tests/**`)
   - Domain B (`src/scoring/**`) — may NOT import from A, C, D, or E (pure math, no app coupling)
   - Domain C (`src/content/**`) — generally markdown/static files, not JS imports — but if any JS lives here, may NOT import from A, B, or D
   - Domain D (`tools/**`) — may import from anywhere (build tools have legitimate cross-domain read access)
   - Domain E (`tests/**`) — may import from anywhere

2. **AC-2 (`docs/domain-map.md` exists):** the human-readable single source of truth. Enumerates every path under `src/`, `tools/`, and `tests/` with its domain letter and a one-line rationale. The file MUST contain these sections: `## Domain A — SPA`, `## Domain B — Scoring Engine`, `## Domain C — Content`, `## Domain D — Tools`, `## Domain E — Test Fixtures`, and `## Codified Exceptions` (listing the D→E exception via `make snapshot-update`).

3. **AC-3 (ESLint runs green on empty tree):** `npx --yes eslint --max-warnings 0 .` (with the new config) exits 0 against the current `src/` tree. Since `src/` is largely empty (only `src/content/methodology/en/provenance/icar-license.md` exists, which is markdown not JS), there should be no lint errors.

4. **AC-4 (`pr-checks.yml` eslint job activated):** the `pr-checks.yml` currently has no `eslint` job listed in Story 1.6's job set. **However, story 1.6 mandated 28 specific jobs** — `eslint` is not on that list. **For Story 1.9, ADD a new `eslint` job** (29th) that runs `npx --yes eslint --max-warnings 0 .`. This is the ONE exception to Story 1.6's "no new jobs after this" rule — eslint is foundational and orthogonal to the 28 lint/spec jobs. Document in the inline YAML comment why eslint is the exception.

5. **AC-5 (Makefile `lint` target chains eslint):** `make lint` runs ESLint after the seven Story-1.6 lints, exits 0 on the current tree.

6. **AC-6 (acceptance tests):**
   - `tests/scaffold/eslint-config.test.mjs` — asserts config file exists, parses, declares `no-restricted-imports` (or equivalent) with the five-domain zones, runs eslint and expects exit 0, asserts `pr-checks.yml` has the `eslint` job (active).
   - `tests/scaffold/domain-map.test.mjs` — asserts `docs/domain-map.md` exists, contains all six required sections, mentions the D→E `make snapshot-update` exception.

## Tasks / Subtasks

- [x] **Task 1: Author `eslint.config.js`** (AC: 1)
  - [x] ESLint 9.x flat-config format
  - [x] Five-domain zones via `no-restricted-imports` patterns
  - [x] Globally: `ecmaVersion: 2022`, `sourceType: "module"`
- [x] **Task 2: Author `docs/domain-map.md`** (AC: 2)
  - [x] Five required `## Domain X — …` sections
  - [x] `## Codified Exceptions` section
  - [x] Enumerate concrete paths per domain
- [x] **Task 3: Add `eslint` job to `pr-checks.yml`** (AC: 4)
  - [x] Active (no `if: false`)
  - [x] Inline comment explaining why eslint is a 29th-job exception
- [x] **Task 4: Extend `Makefile` `lint` target** (AC: 5)
  - [x] Add `npx --yes eslint --max-warnings 0 .` as final lint recipe line
- [x] **Task 5: Author acceptance tests** (AC: 6)
  - [x] `tests/scaffold/eslint-config.test.mjs`
  - [x] `tests/scaffold/domain-map.test.mjs`

## Dev Notes

### ESLint 9 flat-config (`eslint.config.js`, not `.eslintrc.json`)

ESLint 9.x deprecated the JSON config in favor of `eslint.config.js`. The story-spec mentions both forms — we use the modern flat-config.

```js
// eslint.config.js (flat-config)
export default [
  {
    files: ["src/assessment/**/*.{js,mjs}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["tools/*", "../../tools/*"], message: "Domain A → D import forbidden" },
          { group: ["tests/*", "../../tests/*"], message: "Domain A → E import forbidden" },
        ],
      }],
    },
  },
  // ... per-domain configs
];
```

### `no-restricted-imports` vs `no-restricted-paths`

`eslint-plugin-import` provides `no-restricted-paths` which is more expressive (regex-based zones). Adding that plugin = adding a dev dep. The core ESLint `no-restricted-imports` rule supports `patterns` with `group` matchers (glob-style) — sufficient for our domain-boundary needs. Document the choice + tradeoff in the config file's header comment.

### `make lint` integration

The current `lint` recipe is a list of `node tools/lint-*.mjs` invocations. Add at the bottom: `npx --yes eslint --max-warnings 0 .`. **One issue:** running ESLint with `npx --yes eslint` fetches eslint on demand. Each `make lint` on a cold cache downloads eslint (~50MB). For CI, this is fine (one download per runner). For local dev, cache hits help. **Alternative:** add `package.json` with `devDependencies.eslint`. **Decision:** keep `npx --yes` per NFR33 spirit and the existing Story 1.7 precedent (Playwright also via npx). Document.

### ESLint config file extension

`eslint.config.js` (not `.mjs`). ESLint 9 supports either; `.js` matches the existing project pattern (`tools/*.mjs` are scripts; config files commonly use `.js`). However, the project has NO `package.json` AND no `"type": "module"` declaration. Without that, `.js` is treated as CommonJS. **Two options:**
- (a) Use `eslint.config.mjs` to force ESM — works without `package.json`. **Preferred.**
- (b) Add a minimal `package.json` with `"type": "module"` — adds a file but solves it for any future config. Out of scope for this story; defer to retro.

Going with (a) `eslint.config.mjs`.

### Acceptance test — don't actually invoke eslint locally?

eslint download is ~50MB. For acceptance tests, we don't want every `make test` to fetch eslint. Same compromise as Story 1.7 Playwright: **structural-only test for AC-3** (assert config parses, declares the rule, references all five domain zones). CI runs the real `eslint --max-warnings 0 .`.

### Avoid `eslint-plugin-import` and other plugins

NFR33 spirit: minimize external deps. Core `no-restricted-imports` is sufficient. The story-spec's `no-restricted-paths` name is taken from the plugin API; clarify in the config and Dev Notes that we're using the core equivalent.

### Project Structure Notes

- New files:
  - `eslint.config.mjs`
  - `docs/domain-map.md`
  - `tests/scaffold/eslint-config.test.mjs`
  - `tests/scaffold/domain-map.test.mjs`
- Modified files:
  - `Makefile` — extend `lint`
  - `.github/workflows/pr-checks.yml` — add 29th `eslint` job

### References

- Story spec — [epics.md#L683-L704](_bmad-output/planning-artifacts/epics.md#L683-L704)
- NFR21 (no-build/no-framework) — see [epics.md](_bmad-output/planning-artifacts/epics.md)
- NFR33 (zero runtime deps, dev deps permitted via npx) — [epics.md#L166](_bmad-output/planning-artifacts/epics.md#L166)
- Architecture five-domain model — see [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Prior story 1.6 — established `pr-checks.yml` 28-job baseline.
- Prior story 1.7 — established `npx --yes <tool>` precedent for Playwright.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- 15 frozen tests pass; full scaffold 138/138. ESLint 9 flat-config with five-domain no-restricted-imports zones. docs/domain-map.md as canonical human-readable source. 29th pr-checks.yml eslint job (admitted exception to Story 1.6 boundary). npx --yes eslint@^9.16.0 — no package.json (per Story 1.7 precedent).

### File List

- eslint.config.mjs
- docs/domain-map.md
- .github/workflows/pr-checks.yml
- Makefile
- tests/scaffold/eslint-config.test.mjs
- tests/scaffold/domain-map.test.mjs

## Specialist Self-Review

**Decisions made:**

1. **Core `no-restricted-imports` rule, not `eslint-plugin-import`.** Per NFR33 (minimize dev deps), the core rule is sufficient. It supports `patterns` with `group` matchers (glob-style), which covers our domain-boundary intent. The story-spec uses the name `no-restricted-paths` (which is the plugin rule); the config and Dev Notes clarify the substitution.

2. **`eslint.config.mjs`, not `.js` or `.eslintrc.json`.** Two reasons: (a) no `package.json` exists → `.js` would be CommonJS by default, but the rest of the codebase is ESM (`.mjs`). The `.mjs` extension forces ESM regardless. (b) Flat-config (ESLint 9.x) deprecates JSON.

3. **Domain B (scoring) has zero allowed imports.** The strictest zone — pure math, no app/content/tools/test coupling. Even importing from `node:fs` would be a smell; the scoring engine should be a pure function over inputs.

4. **`eslint` is the 29th CI job, openly admitted as an exception.** Story 1.6 mandated 28 specific jobs and stated "no new jobs after Epic 1". Story 1.9 adds `eslint`. The pr-checks.yml inline comment **explicitly admits** this is an exception with reasoning: eslint is foundational, mechanizes the architecture's domain model, and is orthogonal to the 28 lint/spec jobs.

5. **`npx --yes eslint@^9.16.0` pins to ESLint 9.x caret-range.** ESLint 8→9 was breaking (flat-config requirement); the pin prevents an accidental `latest` resolve into ESLint 10 (when that ships). Caret-range allows 9.16+ patches.

**Alternatives considered:**

- *Add `package.json` with `devDependencies.eslint`* — would let `make lint` use the locally-installed binary instead of `npx --yes` cold-cache fetches. But the project deliberately has no `package.json` yet (Story 1.7 made the same call for Playwright). Adding it as a side effect of this story would be unrequested scope creep. Defer to retro.
- *Use `no-restricted-paths` from `eslint-plugin-import`* — more expressive (regex zones). But adds a plugin dep + transitive deps. Avoided per NFR33.
- *Configure each domain in a separate config file* — splits the policy across 5 files. Keeping it in one `eslint.config.mjs` makes the domain boundaries auditable at a glance.

**Framework gotchas avoided:**

- **`.js` vs `.mjs` extension** — without `package.json` `"type": "module"`, `.js` is CommonJS by default, and `import` statements in `.js` files would fail. ESLint 9 supports `eslint.config.mjs` cleanly. Locked in `.mjs`.
- **Glob patterns for `no-restricted-imports`** — the rule accepts `group` arrays of glob patterns matched against the import specifier (not the importer's path). So `"**/tools/*"` matches `import x from "tools/foo.mjs"` or `import x from "../tools/foo.mjs"`. Included both bare and relative forms.
- **`ignores` field** — must NOT include leading `!`; just glob patterns. Excluded `_bmad/`, `_bmad-output/`, `dist/`, `vendor/`, `node_modules/` (the last for completeness even though we don't have a `node_modules`).

**Areas of uncertainty:**

- ESLint 9 flat-config's `no-restricted-imports` may not catch dynamic `import()` calls — only static `import` declarations. If a future PR sneaks a `await import("../../tools/foo.mjs")` past the lint, the runtime would still cross the boundary. A future story might want a custom AST visitor or `tools/lint-domain-boundary.mjs` for dynamic-import enforcement. YAGNI for v1.
- The domain-map's "concrete paths" enumeration will rot as new files land. Mitigation: each new file's PR should update `docs/domain-map.md`; a future `tools/lint-domain-map-coverage.mjs` could mechanize this, but it's a future-story concern.
- `npx --yes eslint@^9.16.0` resolves to the latest 9.x at runtime. If ESLint introduces a breaking change inside 9.x (semver violation in the lint ecosystem is not unheard of), the CI could break. For maximum safety, an exact pin (`eslint@9.16.0`) is preferable; the caret was used for low-friction patch updates. Documented trade-off here.

**Tested edge cases:**

- All 15 frozen tests pass; full scaffold suite 138/138.
- `eslint.config.mjs` parses as ESM (dynamic-import test).
- Default export is array; references all five domain paths.
- `ecmaVersion: 2022` + `sourceType: "module"` set globally.
- `pr-checks.yml` `eslint` job present, NOT carrying `if: false`, invokes `eslint`.
- `Makefile` `lint` recipe includes `npx --yes eslint` after the seven Story-1.6 lints.
- `docs/domain-map.md` has all six required sections + the D→E `make snapshot-update` codified exception + concrete path tokens for each domain.
- Did NOT invoke `eslint` itself locally (would download ~50MB); CI runs the real lint.
