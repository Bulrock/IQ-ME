# Test isolation for shared filesystem fixtures

> **When to apply:** any new test that touches `dist/`, the project root,
> or any other path written by sibling tests must follow this convention.

## Problem

`node --test` runs test files in parallel by default. When two test files
both write to a shared sibling-test artefact — most often `dist/` under the
repo root, but the rule generalizes to any path that lives outside the test
file's own scratch area — they race. Symptoms include: tests pass solo but
fail under `make test`; one test erases another's output mid-assert; CI is
intermittently red on a machine with a different scheduler.

This was discovered concretely during Story 3-6 round-1 (auditor finding
#1) when `tests/scaffold/build-methodology-output.test.mjs` and a sibling
test both wrote into `dist/methodology/`. The fix landed there; the
convention below is the general pattern to keep new tests off the same
rake.

## Pattern — `mkdtempSync` + env-var override

The writable surface goes into a unique tmpdir per test; the code under
test reads the path from an environment variable, defaulting to its
canonical production path. The same source file works in production
(env var unset → writes to repo path) and in tests (env var set →
writes to tmpdir) without conditional branches.

```javascript
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("emits foo at the expected layout", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-<scope>-"));
  try {
    execSync("node tools/build-foo.mjs", {
      env: { ...process.env, IQME_<SCOPE>_OUT: out },
    });
    // Assert against `out/...` paths.
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
```

On the producer side (the tool or library being tested):

```javascript
const OUT_ROOT = resolve(CWD, env.IQME_<SCOPE>_OUT || "dist/<scope>");
```

Naming convention: `iqme-<scope>-` for the tmpdir prefix (so stray
tmpdirs are identifiable on shared CI hosts), `IQME_<SCOPE>_OUT` for the
override env var. Use the same `<scope>` token in both — e.g.
`iqme-build-meth-*` ↔ `IQME_BUILD_METHODOLOGY_OUT`.

## Read-only counter-pattern

Tests that only **read** a shared artefact (e.g. asserting that
`dist/methodology/v0.1.0/en/foo/index.html` has some property) MUST:

- Skip (`t.skip()` or equivalent early-return) if the artefact is
  absent, rather than failing or attempting to build it on demand.
- Never `rm`, `writeFileSync`, or otherwise mutate the shared path.

A read-only test that creates its dependencies is a writer in disguise
and races with the proper writers above.

## Worked example

The reference implementation lives in two places:

- Consumer: [`tests/scaffold/build-methodology-output.test.mjs`](../tests/scaffold/build-methodology-output.test.mjs)
  — every test in the file allocates its own
  `mkdtempSync(join(tmpdir(), "iqme-build-meth-..."))` and passes
  `IQME_BUILD_METHODOLOGY_OUT` to the build subprocess.
- Producer: [`tools/build-methodology.mjs`](../tools/build-methodology.mjs)
  line 32 — `const OUT_ROOT = resolve(CWD, env.IQME_BUILD_METHODOLOGY_OUT
  || "dist/methodology");`

When adding a new scope (e.g. a new build tool with its own output
directory), copy that two-line pattern: one env-var-aware constant on
the producer side, one `mkdtempSync` + `env:` override on each test
that exercises the producer.

## Why not `process.chdir(tmpdir)` instead?

Two reasons:

1. `process.chdir` is global; concurrent tests in the same process
   trample each other's cwd.
2. It also rebases every other relative path the tool reads (e.g.
   `src/content/methodology/`), so the tool no longer sees the real
   inputs. The env-var override changes exactly one path (the output
   path) and leaves the rest of the production layout intact.

## When in doubt

If you're about to add a test that does `writeFileSync(repoRel, ...)`
or `execSync("build-something", ...)` without an env-var override —
stop and apply this convention. Tests that pass solo and fail in
`make test` are the most expensive kind to diagnose later; the cost
of `mkdtempSync` + one env-var addition is small now.
