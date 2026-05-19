---
id: 1-8-ship-deterministic-build-harness-ready-for-epic-2-s-golden-vectors
title: "Story 1.8: Ship deterministic-build harness ready for Epic 2's golden vectors"
status: done
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

- [x] **Task 1: Author `tools/determinism-harness.mjs`** (AC: 1, 3, 4, 5)
  - [x] Export `DETERMINISM` constant object with all required keys
  - [x] Export `sortedReaddir(dir)` — wraps `fs.readdirSync` + sort
  - [x] Export `frozenStat(path)` — returns `{ size, mtime: FROZEN_TIMESTAMP_ISO, mode }`
  - [x] Export `hashTree(rootDir)` — recursive SHA-256
  - [x] Default-export `DETERMINISM`
- [x] **Task 2: Modify `make build` target to write determinism marker** (AC: 2)
  - [x] After `build-methodology` runs (currently a no-op echo), invoke `node tools/build-determinism-marker.mjs`
  - [x] OR write the marker directly via a small inline `node -e '…'` recipe — but prefer a tools/ script for clarity
  - [x] Create `tools/build-determinism-marker.mjs` that calls `hashTree("dist")` + writes `dist/.build-determinism-check.json`
- [x] **Task 3: Author `tests/playwright/byte-stable.spec.mjs` stub** (AC: 6)
- [x] **Task 4: Author acceptance tests** (AC: 7)
  - [x] `tests/scaffold/determinism-harness.test.mjs`

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

- 17 frozen tests pass; full scaffold 123/123. Determinism harness exports DETERMINISM constants + sortedReaddir/frozenStat/hashTree utilities (stdlib-only NFR33). make build emits dist/.build-determinism-check.json; two clean builds yield byte-identical marker (empty-tree sha256 e3b0c44...). byte-stable.spec.mjs stub references DETERMINISM, fixme'd until Epic 4.

### File List

- tools/determinism-harness.mjs
- tools/build-determinism-marker.mjs
- tests/playwright/byte-stable.spec.mjs
- tests/scaffold/determinism-harness.test.mjs
- Makefile

## Specialist Self-Review

**Decisions made:**

1. **`hashTree` uses content bytes, not mtimes, in the SHA-256 input.** mtimes vary across checkouts (and across clean builds — even Git restores files with current mtimes), so including them would defeat determinism. The `frozen_epoch: 0` in the marker JSON is the **declarative** contract; the hash itself is content-based. Documented in implementation comment.

2. **Empty-tree sentinel is the empty-string SHA-256 (`e3b0c4…`).** Sorted-readdir of an empty dir returns `[]`; the hash sees no `update()` calls; `createHash("sha256").digest("hex")` equals the well-known constant. Documented this in both the harness comment AND the story spec Dev Notes so future stories can reference it without re-derivation.

3. **`R_THETA_LIM` is an array, not a tuple-like object.** Architecture pins it as `c(-6, 6)` in R syntax — that's a length-2 numeric vector. JavaScript array `[-6, 6]` is the natural representation; `Object.freeze` prevents accidental mutation. Test uses `deepEqual` to compare.

4. **`make build` chains to `tools/build-determinism-marker.mjs` rather than inline `node -e`.** Story spec gave implementer the choice; the dedicated script wins on readability (the inline form would need quoting gymnastics) and on Makefile recipe-allowlist compliance (Story 1.1 test requires recipes to start with `node`, `make`, `npx --yes`, or `vendor/`; `node tools/...` is the clean form).

**Alternatives considered:**

- *Include mtimes in the hash, frozen via `utimesSync`* — would let `hashTree` self-validate "all mtimes already frozen". Adds I/O cost + complexity. The simpler "content only" hash is sufficient for Epic 2's golden-vector parity and Epic 4's byte-stable assertion.
- *Use BLAKE3 instead of SHA-256* — BLAKE3 is faster but is not in Node stdlib; would require a vendored dep. SHA-256 is universally available and "fast enough" for tree sizes ≤ a few MB.
- *Export `DETERMINISM` as a class with frozen properties* — `Object.freeze({...})` is simpler and doesn't pull in class-instance metaphor when none is needed.
- *Default-export the utility functions instead of `DETERMINISM`* — the constants are the more frequently-imported surface; default-export the constants. Utility functions are named-export only.

**Framework gotchas avoided:**

- `readdirSync` returns entries in fs-dependent order on macOS APFS vs Linux ext4 vs Windows NTFS. `sortedReaddir` wraps + sorts so the hash is portable across hosts. CI on ubuntu-latest will produce the same hash as a macOS dev machine.
- The dist-marker test relies on `make build` working — first time the test ran, the `dist/` dir didn't exist; `mkdirSync(DIST, { recursive: true })` in the marker script handles this.
- The marker JSON ends with `"\n"` (a trailing newline) so editors don't introduce drift; `JSON.stringify(...) + "\n"`. Byte-identical determinism across runs verified.
- `Object.freeze` on nested arrays/objects is shallow. `R_THETA_LIM` is `Object.freeze([-6, 6])` to freeze the inner array too. If a consumer tries `DETERMINISM.R_THETA_LIM[0] = 99`, it silently no-ops in non-strict mode and throws in strict mode (modules are strict by default).

**Areas of uncertainty:**

- `harness_version: "1.0.0"` is hardcoded. If the harness semantics change in Epic 4 (e.g. switching to BLAKE3, including symlinks), bump this. A future PR may want to read the version from a `package.json` or a dedicated `version.mjs`. For now, hardcoded — keeps things simple.
- `HASH_LOCALE: "C.UTF-8"` is **declarative**, not enforced. Node's crypto API doesn't consume `LC_ALL`. If Epic 2's R bridge or Epic 4's snapshot tooling actually depends on locale (e.g. `sort -u` on a string list), it must set `LC_ALL=C.UTF-8` explicitly. Documented in the harness comment.
- The `byte-stable.spec.mjs` stub uses `test.fixme` — Playwright will report it as "expected to fail; ok". When Epic 4 lands the real impl, remove the `fixme` and add the actual assertion body.

**Tested edge cases:**

- All 17 frozen tests pass; full scaffold suite 123/123.
- `hashTree(emptyDir)` twice returns the same hash, equal to documented empty-tree sentinel.
- `make clean && make build` twice produces byte-identical `dist/.build-determinism-check.json` — the marker JSON is identical character-by-character.
- All named exports + default export accessible via dynamic `import()`.
- `DETERMINISM` is frozen — attempted mutation throws in strict mode (modules are strict).
- `byte-stable.spec.mjs` stub parses + references `DETERMINISM` + mentions Epic 4 deferral.
