// Scaffold test: lint-translation-parity exits 0 against in-repo state.
// Story 4-7 AC-2, AC-5, AC-7 (assertions updated by Story 7.3 — RU corpus landed).
//
// Stories 7.3 (RU) + 7.4 (PL) landed the full non-EN methodology mirrors, so the
// "no non-EN content yet" WARN no longer fires.
// The in-repo invocation `node tools/lint-translation-parity.mjs` must:
//   1. exit 0 (RU+PL pages carry valid 64-hex sourceHashEN — defensive check passes)
//   2. emit the EN source-of-truth summary line
//   3. emit a per-locale summary: RU pages found, PL pages found

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-translation-parity.mjs");

test("lint-translation-parity: in-repo state → exit 0 with per-locale summary (RU landed, PL pending)", () => {
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );
  const all = r.stdout + r.stderr;
  // Story 7.3 landed RU content → the "no non-EN content yet" WARN must NOT fire.
  assert.doesNotMatch(
    all,
    /no non-EN content yet/i,
    `RU content is present (Story 7.3) — the "no non-EN content yet" WARN should not appear; got:\n${all}`,
  );
  assert.match(
    all,
    /EN:\s*source-of-truth/i,
    `expected EN: source-of-truth summary line; got:\n${all}`,
  );
  // Both RU (Story 7.3) and PL (Story 7.4) are authored — page counts reported.
  assert.match(
    all,
    /RU:\s*\d+\s*page\(s\) found/i,
    `expected RU per-locale "N page(s) found" summary; got:\n${all}`,
  );
  assert.match(
    all,
    /PL:\s*\d+\s*page\(s\) found/i,
    `expected PL per-locale "N page(s) found" summary; got:\n${all}`,
  );
});
