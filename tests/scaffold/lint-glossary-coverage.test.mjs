// Scaffold test: lint-glossary exits 0 against in-repo methodology pages.
// Story 4-4 AC-5 / AC-6 — updated by Story 5.2 once the glossary tree landed.
//
// Story 5.2 authored src/content/methodology/en/reference/glossary/ with
// entries for gFactor, iqScale, percentile, sem, uncertainty. The lint now
// validates every glossaryRefs:[] entry against that tree (no more deferred
// WARNs).

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-glossary.mjs");

test("lint-glossary: in-repo methodology pages → exit 0 with deferred WARNs", () => {
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );

  const all = r.stdout + r.stderr;
  // Story 11-1: the reference/glossary tree was removed in the methodology cut
  // (maintainer decision), so lint-glossary returns to defer-mode — it emits a
  // deferred WARN per page and still exits 0 (the absent-tree contract).
  const warnLines = (all.match(/lint-glossary: WARN/g) || []).length;
  assert.ok(
    warnLines > 0,
    `expected deferred WARN lines (glossary tree removed in Story 11-1); got ${warnLines}\noutput:\n${all}`,
  );
  // Summary line should still mention validated count.
  assert.match(
    r.stdout,
    /lint-glossary:.*page\(s\) validated/,
    `expected summary line mentioning validated count; got: ${r.stdout}`,
  );
});
