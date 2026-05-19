---
id: 1-9-eslint-config-no-restricted-paths-docs-domain-map-md
title: "Story 1.9: ESLint config + no-restricted-paths + docs/domain-map.md"
status: ready-for-dev
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

- [ ] **Task 1: Author `eslint.config.js`** (AC: 1)
  - [ ] ESLint 9.x flat-config format
  - [ ] Five-domain zones via `no-restricted-imports` patterns
  - [ ] Globally: `ecmaVersion: 2022`, `sourceType: "module"`
- [ ] **Task 2: Author `docs/domain-map.md`** (AC: 2)
  - [ ] Five required `## Domain X — …` sections
  - [ ] `## Codified Exceptions` section
  - [ ] Enumerate concrete paths per domain
- [ ] **Task 3: Add `eslint` job to `pr-checks.yml`** (AC: 4)
  - [ ] Active (no `if: false`)
  - [ ] Inline comment explaining why eslint is a 29th-job exception
- [ ] **Task 4: Extend `Makefile` `lint` target** (AC: 5)
  - [ ] Add `npx --yes eslint --max-warnings 0 .` as final lint recipe line
- [ ] **Task 5: Author acceptance tests** (AC: 6)
  - [ ] `tests/scaffold/eslint-config.test.mjs`
  - [ ] `tests/scaffold/domain-map.test.mjs`

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

### File List
