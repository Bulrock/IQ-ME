// Scaffold test: lint-translation-parity exits 0 against in-repo state.
// Story 4-7 AC-2, AC-5, AC-7.
//
// At Epic 4 close, src/content/methodology/ contains EN content only; RU + PL
// dirs are .gitkeep-only. The in-repo invocation `node
// tools/lint-translation-parity.mjs` must:
//   1. exit 0
//   2. emit a single WARN line referencing Epic 7's deferred coverage
//   3. emit a per-locale summary noting RU + PL are not yet authored

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-translation-parity.mjs");

test("lint-translation-parity: in-repo state → exit 0 with WARN + per-locale summary", () => {
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );
  const all = r.stdout + r.stderr;
  assert.match(
    all,
    /lint-translation-parity:\s*WARN\s+no non-EN content yet/i,
    `expected WARN line "no non-EN content yet"; got:\n${all}`,
  );
  assert.match(
    all,
    /EN:\s*source-of-truth/i,
    `expected EN: source-of-truth summary line; got:\n${all}`,
  );
  assert.match(
    all,
    /RU.*Epic 7|RU.*not yet authored|RU\/PL.*not yet authored/i,
    `expected RU deferred-to-Epic-7 summary; got:\n${all}`,
  );
});
