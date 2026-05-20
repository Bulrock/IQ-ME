// Scaffold test: lint-glossary exits 0 against in-repo methodology pages.
// Story 4-4 AC-5 / AC-6.
//
// Current state: the per-language glossary tree
// (src/content/methodology/<lang>/reference/glossary/) does NOT exist for
// any locale. Each of the 4 EN methodology pages should emit a deferred
// WARN line, and the lint should exit 0.

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
  // Expect WARN line for each of the 4 in-repo EN pages (glossary tree absent).
  const warnLines = (all.match(/lint-glossary: WARN/g) || []).length;
  assert.equal(
    warnLines,
    4,
    `expected 4 deferred WARN lines (one per in-repo EN page); got ${warnLines}\noutput:\n${all}`,
  );
  // Summary line should mention deferred count.
  assert.match(
    r.stdout,
    /lint-glossary:.*page\(s\) validated.*deferred/,
    `expected summary line mentioning validated + deferred counts; got: ${r.stdout}`,
  );
});
