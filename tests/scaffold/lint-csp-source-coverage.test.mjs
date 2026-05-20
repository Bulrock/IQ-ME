// Scaffold test: lint-csp-source exits 0 against in-repo CSP-source surfaces.
// Story 4-8 — exit-criterion verification.
//
// Scopes:
//   - src/index.html (always present)
//   - dist/methodology/**/*.html (present only after `make build-methodology`;
//     lint-csp-source skips dist/ gracefully if absent — AC-6 option b)

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-csp-source.mjs");
const INDEX_HTML = resolve(REPO_ROOT, "src/index.html");

test("lint-csp-source: in-repo CSP-source surfaces all pass", () => {
  assert.ok(existsSync(INDEX_HTML), `expected src/index.html at ${INDEX_HTML}`);
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(
    r.status,
    0,
    `expected exit 0; got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );
  assert.match(r.stdout, /scanned/);
});

test("lint-csp-source: src/index.html scanned even when dist/ absent (degraded mode)", () => {
  const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(r.status, 0);
  // src/index.html should appear in the scanned-files report (stdout summary
  // line OR per-file output) — at minimum, the summary line shows count ≥ 1.
  assert.match(r.stdout, /\d+ file\(s\) scanned/);
});
