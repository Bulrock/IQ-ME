// Scaffold test: lint-license-provenance exits 0 against in-repo state.
// Story 4-5 AC-6 / AC-7.
//
// After AC-3 (hash flip) and AC-4 (CHANGELOG.md stub) land, the in-repo
// invocation `node tools/lint-license-provenance.mjs` must:
//   1. exit 0
//   2. report a summary line naming the file count
//   3. NOT flag any orphan files (every shipped path covered by scope-map)
//   4. NOT print the placeholder WARN (because the hash was flipped)

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-license-provenance.mjs");

test("lint-license-provenance: in-repo state → exit 0, no orphans, hash verified", () => {
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );

  const all = r.stdout + r.stderr;
  assert.doesNotMatch(
    all,
    /no LICENSES\.md scope entry found/,
    `unexpected orphan(s) reported. If a new file legitimately lacks a class, extend docs/license-scope-map.md (do not relax the lint).\noutput:\n${all}`,
  );
  assert.match(
    all,
    /lint-license-provenance:.*\d+ file\(s\) attributed/i,
    `expected summary line "lint-license-provenance: N file(s) attributed; ...".\noutput:\n${all}`,
  );
  assert.match(
    all,
    /hash verified/i,
    `expected "hash verified" in summary (post-AC-3 hash flip).\noutput:\n${all}`,
  );
});
