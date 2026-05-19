---
id: 1-8-ship-deterministic-build-harness-ready-for-epic-2-s-golden-vectors
title: "Story 1.8: Ship deterministic-build harness ready for Epic 2's golden vectors"
status: ready-for-dev
---

# Story 1.8: Deterministic-build harness

## Story

As a **AI agent or solo-dev building Epic 2's golden-vector parity test**,
I want **the deterministic-build harness (frozen timestamps, sorted file ordering, locale-independent hashing) to exist at end-of-Epic-1 (per Murat — golden vectors already require deterministic numerical output, so the 80%-shared harness should be hoisted)**,
so that **Epic 2 can land golden-vector regeneration with a known-good determinism foundation, and Epic 4's byte-stable build assertion can build on the same harness rather than reinventing it**.

## Acceptance Criteria

1. **AC-1 (`tools/determinism-harness.mjs` exists):** module at this path that exports a `DETERMINISM` object exposing the canonical constants Epic 2 + Epic 4 will consume:
   - `SOURCE_DATE_EPOCH = 0` (Unix epoch; corresponds to `1970-01-01T00:00:00Z`)
   - `FROZEN_TIMESTAMP_ISO = "1970-01-01T00:00:00.000Z"`
   - `HASH_LOCALE = "C.UTF-8"` (or noted equivalent — see Dev Notes)
   - `R_SEED = 20260514` (per architecture pin)
   - `R_QUADPTS = 61`
   - `R_THETA_LIM = [-6, 6]`
   - Plus utility functions: `sortedReaddir(dir)`, `frozenStat(file)`, `hashTree(rootDir)`.

2. **AC-2 (`make build` produces a deterministic empty-build marker):** `make build` (which currently aliases `build-methodology`) ALSO writes `dist/.build-determinism-check.json` containing `{ "sha256": "<hash-of-empty-dist-tree>", "frozen_epoch": 0, "harness_version": "1.0.0" }`. Running `make clean && make build` twice produces byte-identical `dist/.build-determinism-check.json` — verified by an acceptance test that runs `make clean build`, hashes the JSON, runs again, hashes again, asserts equal.

3. **AC-3 (`hashTree` is deterministic across runs):** the `hashTree(dir)` utility walks `dir` recursively, sorts entries lexicographically at each level, and produces a SHA-256 over `(path|size|mtime-frozen|content-bytes)` tuples. Calling `hashTree` against the same `dist/` twice produces the same output. Against an empty directory, returns a known constant (e.g. `"e3b0c44…"` style or the harness's documented empty-tree sentinel).

4. **AC-4 (utility functions are pure + stdlib-only):** `sortedReaddir`, `frozenStat`, `hashTree` use only `node:fs`, `node:path`, `node:crypto`. No external imports. Each is ≤ 40 LOC.

5. **AC-5 (constants exported as named + default):** `import { DETERMINISM, sortedReaddir, frozenStat, hashTree } from "tools/determinism-harness.mjs"` works. Also default-exports `DETERMINISM` so `import D from "tools/determinism-harness.mjs"` works.

6. **AC-6 (`tests/playwright/byte-stable.spec.mjs` stub):** stub file at this path that imports the harness and contains a single `test.fixme(...)` (or commented-out test) noting "full byte-stable assertion activates in Epic 4 (Story 4.2)". The stub MUST parse (be syntactically valid JS module) and reference `DETERMINISM` from the harness.

7. **AC-7 (acceptance tests):** `tests/scaffold/determinism-harness.test.mjs` verifies:
   - harness exists, exports required names
   - `DETERMINISM` contains required keys with correct types/values
   - `sortedReaddir` returns sorted output
   - `hashTree` of empty dir returns same hash twice
   - `make build` produces `dist/.build-determinism-check.json` with the expected shape
   - Running `make clean && make build` twice yields byte-identical determinism marker

## Tasks / Subtasks

- [ ] **Task 1: Author `tools/determinism-harness.mjs`** (AC: 1, 3, 4, 5)
  - [ ] Export `DETERMINISM` constant object with all required keys
  - [ ] Export `sortedReaddir(dir)` — wraps `fs.readdirSync` + sort
  - [ ] Export `frozenStat(path)` — returns `{ size, mtime: FROZEN_TIMESTAMP_ISO, mode }`
  - [ ] Export `hashTree(rootDir)` — recursive SHA-256
  - [ ] Default-export `DETERMINISM`
- [ ] **Task 2: Modify `make build` target to write determinism marker** (AC: 2)
  - [ ] After `build-methodology` runs (currently a no-op echo), invoke `node tools/build-determinism-marker.mjs`
  - [ ] OR write the marker directly via a small inline `node -e '…'` recipe — but prefer a tools/ script for clarity
  - [ ] Create `tools/build-determinism-marker.mjs` that calls `hashTree("dist")` + writes `dist/.build-determinism-check.json`
- [ ] **Task 3: Author `tests/playwright/byte-stable.spec.mjs` stub** (AC: 6)
- [ ] **Task 4: Author acceptance tests** (AC: 7)
  - [ ] `tests/scaffold/determinism-harness.test.mjs`

## Dev Notes

### `HASH_LOCALE`: macOS doesn't ship `C.UTF-8`

`C.UTF-8` is the canonical locale-independent UTF-8 locale on Linux/glibc. macOS uses `en_US.UTF-8` by default and *technically* has `C.UTF-8` only via locale data — but Node's `crypto` doesn't actually consume `LC_ALL` for hash input. The constant is **declarative**: it tells downstream tools (Epic 2's R bridge, Epic 4's snapshot tooling) the contract, even if Node itself is locale-independent. Document this in implementation comments.

### Why `FROZEN_TIMESTAMP_ISO = "1970-01-01T00:00:00.000Z"`

Maximum compatibility with `SOURCE_DATE_EPOCH` (the GNU Make / Debian Reproducible Builds convention). Epic 4's byte-stable-build target may want to pin to a different epoch; that's a future story decision. Day-1: 0.

### `hashTree` recursive walk semantics

```js
hashTree(rootDir) {
  const hash = createHash("sha256");
  for (const entry of sortedReaddir(rootDir)) {           // sorted!
    const full = join(rootDir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      hash.update(`D|${entry}|`);
      hash.update(hashTree(full));                         // recursive
    } else {
      hash.update(`F|${entry}|${st.size}|`);
      hash.update(readFileSync(full));                     // content bytes
    }
  }
  return hash.digest("hex");
}
```

Note: includes content bytes, **not** file mtimes. mtimes vary across checkouts; content does not. The `frozen_epoch: 0` in the marker JSON is the contract, not an mtime-from-disk.

### `dist/` directory creation

`make build` may run on an empty repo with no existing `dist/`. The build-determinism-marker script must:
- `mkdirSync("dist", { recursive: true })`
- compute `hashTree("dist")` (which is now an empty dir → known-constant hash)
- write `dist/.build-determinism-check.json`

The empty-dir hash from the recursive `hashTree` impl is `createHash("sha256").update("").digest("hex")` = `"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"`.

### Test for `make clean && make build` determinism

Run twice in the test:
```js
spawnSync("make", ["clean"], ...);
spawnSync("make", ["build"], ...);
const first = readFileSync("dist/.build-determinism-check.json", "utf8");
spawnSync("make", ["clean"], ...);
spawnSync("make", ["build"], ...);
const second = readFileSync("dist/.build-determinism-check.json", "utf8");
assert.equal(first, second);
```

### Why expose R_SEED / R_QUADPTS / R_THETA_LIM now?

Architecture pins these for Epic 2's mirt 1.41.x golden-vector regeneration ([architecture.md#L1314](_bmad-output/planning-artifacts/architecture.md#L1314) + related sections). Exposing them in the harness today means Epic 2 imports `R_SEED` from the canonical place; no second source of truth, no drift risk.

### Project Structure Notes

- New files:
  - `tools/determinism-harness.mjs`
  - `tools/build-determinism-marker.mjs`
  - `tests/playwright/byte-stable.spec.mjs` (stub)
  - `tests/scaffold/determinism-harness.test.mjs`
- Modified files:
  - `Makefile` — `build` target now triggers the determinism marker writer

### References

- Story spec — [epics.md#L659-L681](_bmad-output/planning-artifacts/epics.md#L659-L681)
- Architecture R pinning — quadpts=61, theta_lim=c(-6,6), set.seed(20260514).
- NFR17 byte-stable mirror artifact — see [architecture.md](_bmad-output/planning-artifacts/architecture.md).
- NFR33 zero-runtime-deps — [epics.md#L166](_bmad-output/planning-artifacts/epics.md#L166).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
