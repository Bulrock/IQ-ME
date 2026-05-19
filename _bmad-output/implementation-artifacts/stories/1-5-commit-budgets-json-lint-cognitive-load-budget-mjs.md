---
id: 1-5-commit-budgets-json-lint-cognitive-load-budget-mjs
title: "Story 1.5: Commit BUDGETS.json + lint-cognitive-load-budget.mjs"
status: ready-for-dev
---

# Story 1.5: Commit BUDGETS.json + lint-cognitive-load-budget.mjs

## Story

As a **solo-dev maintainer (CEP) protecting NFR32-NFR35 from contributor pressure**,
I want **the project's cognitive-load budgets to be machine-enforced from commit #1**,
so that **any future PR that materially exceeds a budget (e.g. scoring engine LOC, CSS total, methodology-page count) fails CI and forces an explicit budget conversation rather than drift**.

## Acceptance Criteria

1. **AC-1 (`BUDGETS.json` shape):** Valid JSON at repo root. Top-level keys are budget IDs; each entry has `{ "domain": <path-glob>, "metric": "lines"|"bytes"|"files", "limit": <number>, "rationale": <NFR-link-string> }`. Per Murat's "fixture-architecture-first" applied to budgets: every NFR32 budget shipped from day 1, not lazily added.
2. **AC-2 (NFR32 budget coverage):** `BUDGETS.json` MUST contain at minimum these budgets, all keyed to NFR32:
   - `scoring-irt-lines` → domain `src/scoring/irt/**/*.js`, metric `lines`, limit `250`
   - `css-components-lines` → domain `src/css/components/**/*.css`, metric `lines`, limit `1500`
   - `app-modules-bytes` → domain `src/assessment/**/*.js`, metric `bytes`, limit `30720` (~30 KB)
   - `i18n-harness-bytes` → domain `src/assessment/i18n/**/*.js` + locale loader, metric `bytes`, limit `15360` (~15 KB)
   - `methodology-pages-en` → domain `src/content/methodology/en/**/*.md`, metric `files`, limit `30`
   - (`ru` and `pl` variants ALSO present with the same `30` limit — they activate when Epic 7 lands content.)
3. **AC-3 (rationale links):** Each entry's `rationale` field contains a substring referencing the binding NFR by ID (e.g. `"NFR32"`, `"NFR33"`, `"NFR34"`, or `"NFR35"`). Acceptance tests grep for that token.
4. **AC-4 (empty-tree green):** With the current repo state (no `src/scoring/`, no `src/css/components/`, no `src/content/methodology/`), `node tools/lint-cognitive-load-budget.mjs` exits 0. Output includes, **for every budget entry**, a summary line of the form `OK <budget-id>: <current>/<limit> <metric>` so a green run is still informative.
5. **AC-5 (breach → fail):** When the lint is run with an override env var `IQME_BUDGET_OVERRIDE_<BUDGET_ID>=<n>` simulating a PR breach (or any equivalent test injection point), it exits non-zero (`1`), writes to stderr a clear `BREACH <budget-id>: <current>/<limit> <metric>` line, **and** includes the entry's `rationale` text in that error block. The exit code, stderr line, and rationale presence are independently asserted by tests.
6. **AC-6 (zero runtime deps):** `tools/lint-cognitive-load-budget.mjs` uses **only** Node's stdlib (`node:fs`, `node:path`, `node:process`, `node:url`). No `import` from any external module. Per NFR33.
7. **AC-7 (deterministic, no network):** Lint walks the filesystem from `REPO_ROOT` (resolved relative to the script's own location via `import.meta.url`) and never opens a socket. Test exercises this by running with `--no-network` env (Node's default) and confirming behaviour is identical.
8. **AC-8 (Makefile wiring):** `make lint` either runs `tools/lint-cognitive-load-budget.mjs` directly (preferred — simplest), or registers it in a `lint-budgets` sub-target invoked by `lint`. Either way, `make lint` exits 0 on the current empty-tree state. The Story 1.1 placeholder `echo "lint: no rules registered yet …"` is replaced with the real invocation chain.

## Tasks / Subtasks

- [ ] **Task 1: Author `BUDGETS.json`** (AC: 1, 2, 3)
  - [ ] All six NFR32 budgets present with correct shape
  - [ ] RU and PL methodology-page budgets included with same `30` limit
  - [ ] Every entry's `rationale` references its binding NFR ID literally
- [ ] **Task 2: Implement `tools/lint-cognitive-load-budget.mjs`** (AC: 4, 5, 6, 7)
  - [ ] Reads `BUDGETS.json` from repo root
  - [ ] For each entry, computes `current` value per `metric`:
    - `lines` — sum of non-empty, non-comment-only lines across all files matching `domain` glob
    - `bytes` — sum of file sizes in bytes
    - `files` — count of matching files
  - [ ] On empty tree, every `current` reads as `0`, exit `0`, emit `OK …` per entry to stdout
  - [ ] Override-injection path: env var `IQME_BUDGET_OVERRIDE_<BUDGET_ID>` is parsed as integer and added to `current` (or replaces it — implementer's choice, just document)
  - [ ] Breach path: exit `1`, stderr `BREACH …` line + rationale text
  - [ ] Stdlib-only — no `import` outside `node:` namespace
- [ ] **Task 3: Update `Makefile` `lint` target** (AC: 8)
  - [ ] Replace the placeholder `echo` with `node tools/lint-cognitive-load-budget.mjs`
  - [ ] If future-proofing, wrap in a `lint-budgets` recipe and add to `lint`'s deps — but a single direct invocation is also acceptable for this story (Stories 1.6/1.9 will likely add more lint chains; YAGNI applies here)
  - [ ] `make lint` exits 0 on the current tree
- [ ] **Task 4: Author and pass acceptance tests** verifying ACs 1-8
  - [ ] Tests live at `tests/scaffold/cognitive-load-budget.test.mjs`
  - [ ] Use `node --test` (matches existing `tests/scaffold/*.test.mjs` pattern)
  - [ ] AC-1: parses `BUDGETS.json`, asserts every entry has the required keys with correct types
  - [ ] AC-2: asserts the six (plus RU/PL) named budgets are present with the exact NFR32 limits
  - [ ] AC-3: regex grep on each `rationale` for `/NFR3[2-5]/`
  - [ ] AC-4: `execFileSync('node', ['tools/lint-cognitive-load-budget.mjs'])` exits 0; stdout contains one `OK <id>` line per budget
  - [ ] AC-5: re-run with `IQME_BUDGET_OVERRIDE_SCORING_IRT_LINES=5000` (or equivalent), asserts exit 1, stderr contains `BREACH`, contains rationale text
  - [ ] AC-6: file content grep — every `import` line starts with `from "node:`
  - [ ] AC-7: implicit — if AC-6 passes, no network is possible (verified by stdlib-only invariant)
  - [ ] AC-8: `execFileSync('make', ['lint'])` exits 0; output includes evidence of the budget lint running (e.g. an `OK` line)

## Dev Notes

### Critical context — do not reinvent these

- **Frozen Story 1.1 Makefile is already wired** ([Makefile](Makefile)). Its `lint` target currently echoes a stub message. Story 1.5 replaces that single line. **Do not rewrite the rest of the Makefile.** The `.PHONY` list already includes `lint`; no need to touch it.
- **`tools/` directory exists.** Story 1.3 added [tools/generate-icar-stub-pdf.mjs](tools/generate-icar-stub-pdf.mjs); use it as a structural model for any helper script (stdlib-only, `import.meta.url`-anchored paths, exits cleanly).
- **Test scaffold pattern is set.** See [tests/scaffold/makefile.test.mjs](tests/scaffold/makefile.test.mjs) — uses `node:test`, `node:assert/strict`, `execFileSync`, `import.meta.dirname` to anchor `REPO_ROOT`. Match this style exactly.
- **`package.json` is intentionally dev-deps-only and may not yet exist.** Story 1.1 lists it in the master tree but the current repo doesn't have it. **Do not add it solely for this story.** Stdlib-only Node scripts work without `package.json`. If Story 1.5 needs a `package.json` to register `"type": "module"`, prefer adding it minimally (`{"type": "module", "private": true}`) and document the addition in `Completion Notes`.
- All `.mjs` files in this repo are ES modules by extension — no `package.json` `"type"` declaration is strictly required for `.mjs`.

### NFR limit numbers — the canonical source is the story spec, not architecture summary

Architecture doc section [architecture.md#L1314](_bmad-output/planning-artifacts/architecture.md#L1314) cites budgets as `300/1700/35` — these are the *ceiling* in the architecture's NFR table. The story-spec (and PRD line [epics.md#L165](_bmad-output/planning-artifacts/epics.md#L165)) and NFR32 itself cite `250/1500/30` — the **target**. **Use the story-spec/NFR32 numbers `250/1500/30/30 KB/15 KB`** in `BUDGETS.json`. A future PR can argue ceiling-vs-target, but day-1 enforcement starts at the tighter number per NFR32 verbatim.

### Why glob domains, not directory paths

Each budget entry's `domain` is a **glob pattern** (e.g. `src/scoring/irt/**/*.js`) so that the lint resolves correctly even on the empty tree (no matches → `current = 0` → exit 0). A bare directory path would require an `existsSync` guard.

### `current` calculation per metric

- **`lines`:** read each matching file, split on `\n`, count lines where `line.trim().length > 0` and `!line.trim().startsWith("//")` (single-line comments). Block comments are *not* stripped — keeping the counter simple is more honest than gaming with a parser. Document in implementation comments.
- **`bytes`:** sum of `statSync(file).size` per matching file.
- **`files`:** count of matching paths (using the same glob walk).

### Glob walking without a dependency

Node 22+ has `fs.glob` (stable in Node 22). Use `import { glob } from "node:fs/promises"` (or `globSync` from `node:fs`) — stdlib, no dependency. Verified available in the project's Node 22.22.2.

### Override injection format

`IQME_BUDGET_OVERRIDE_<BUDGET_ID_UPPER_SNAKE>=<integer>` where the budget ID's hyphens become underscores and the whole thing is uppercased. Example: budget `scoring-irt-lines` → env var `IQME_BUDGET_OVERRIDE_SCORING_IRT_LINES`. **The value REPLACES `current`** (simpler than additive, matches the "simulating a 3000-LOC dependency PR" framing in the AC).

### Output format — be uniform

```
OK scoring-irt-lines: 0/250 lines
OK css-components-lines: 0/1500 lines
OK app-modules-bytes: 0/30720 bytes
OK i18n-harness-bytes: 0/15360 bytes
OK methodology-pages-en: 0/30 files
OK methodology-pages-ru: 0/30 files
OK methodology-pages-pl: 0/30 files
```

On breach:

```
BREACH scoring-irt-lines: 3000/250 lines
  rationale: NFR32 — scoring engine cognitive-load cap
```

### Project Structure Notes

- New files (per [architecture.md#L1041-L1213](_bmad-output/planning-artifacts/architecture.md#L1041-L1213)):
  - `BUDGETS.json` at repo root
  - `tools/lint-cognitive-load-budget.mjs`
  - `tests/scaffold/cognitive-load-budget.test.mjs`
- Modified files:
  - `Makefile` — single-line replacement of `lint` recipe
- No conflicts with prior stories. Story 1.1 reserved the `lint` target as a stub; Story 1.5 fills it in.

### References

- Story spec — [epics.md#L587-L608](_bmad-output/planning-artifacts/epics.md#L587-L608)
- NFR32 (canonical numbers) — [epics.md#L165](_bmad-output/planning-artifacts/epics.md#L165)
- NFR33 (zero runtime deps) — [epics.md#L166](_bmad-output/planning-artifacts/epics.md#L166)
- Architecture — directory tree — [architecture.md#L1041-L1213](_bmad-output/planning-artifacts/architecture.md#L1041-L1213)
- Architecture — NFR32-35 enforcement — [architecture.md#L1314](_bmad-output/planning-artifacts/architecture.md#L1314)
- Prior pattern — `tools/generate-icar-stub-pdf.mjs` ([tools/generate-icar-stub-pdf.mjs](tools/generate-icar-stub-pdf.mjs))
- Test pattern — [tests/scaffold/makefile.test.mjs](tests/scaffold/makefile.test.mjs)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
