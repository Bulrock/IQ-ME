// Scaffold test: lint-translation-parity exits 0 against in-repo state.
// Story 4-7 AC-2/5/7 → Story 7.3/7.4 (RU/PL landed) → Story 7.5b (full coverage).
//
// Story 7.5b graduated the lint to full tri-locale parity (no missing / no
// orphan / EN-source-hash match). The in-repo RU+PL mirrors (7.3/7.4) are
// byte-parity with EN, so the in-repo invocation must:
//   1. exit 0 (full parity holds)
//   2. emit the EN source-of-truth summary line
//   3. emit a per-locale "N/N pages parity-green" summary for RU and PL

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-translation-parity.mjs");

test("lint-translation-parity: in-repo state → exit 0, full tri-locale parity-green", () => {
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );
  const all = r.stdout + r.stderr;
  // Story 7.3/7.4 landed RU+PL → the "no non-EN content yet" WARN must NOT fire.
  assert.doesNotMatch(
    all,
    /no non-EN content yet/i,
    `RU+PL content is present — the "no non-EN content yet" WARN should not appear; got:\n${all}`,
  );
  // Story 7.5b graduated to full coverage → the deferral line is gone.
  assert.doesNotMatch(
    all,
    /deferred to Epic 7/i,
    `Story 7.5b graduated the lint — the "deferred to Epic 7" line should be gone; got:\n${all}`,
  );
  assert.match(
    all,
    /EN:\s*source-of-truth/i,
    `expected EN: source-of-truth summary line; got:\n${all}`,
  );
  // RU + PL are full byte-parity with EN → per-locale parity-green summary.
  assert.match(
    all,
    /RU:\s*\d+\s*\/\s*\d+\s*pages parity-green/i,
    `expected RU "N/N pages parity-green" summary; got:\n${all}`,
  );
  assert.match(
    all,
    /PL:\s*\d+\s*\/\s*\d+\s*pages parity-green/i,
    `expected PL "N/N pages parity-green" summary; got:\n${all}`,
  );
});
