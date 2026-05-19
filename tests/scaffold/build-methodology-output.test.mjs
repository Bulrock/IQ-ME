// tests/scaffold/build-methodology-output.test.mjs
//
// Story 3.6 AC-9 — integration smoke for the real corpus.
//
// Runs the real builder against src/content/methodology/en/ and asserts the
// three Story-3-6 stub pages produce well-formed HTML at expected paths.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/build-methodology.mjs");

// Paths relative to IQME_BUILD_METHODOLOGY_OUT (which replaces the
// `dist/methodology` segment per tools/build-methodology.mjs:24).
const EXPECTED = [
  "v0.1.0/en/scoring/percentile-to-iq/index.html",
  "v0.1.0/en/scoring/uncertainty/index.html",
  "v0.1.0/en/scoring/overview/index.html",
];

const EXPECTED_TITLES = {
  "percentile-to-iq": /percentile/i,
  "uncertainty": /uncertainty/i,
  "overview": /IQ-?scale|IQ scale/i,
};

test("AC-9: build-methodology renders the 3 Epic-3 stub pages with template surfaces", () => {
  // Per-test temp dir keeps this test isolated from tests/unit/dev-server.test.mjs:91
  // (AC-8.5: GET methodology stub page), which reads the shared repo `dist/` and
  // skips when absent. Sharing `dist/` produced ~75% flakiness under node:test
  // file-parallelism — see round-1 code-review finding (epic-3).
  const tmpOutRoot = mkdtempSync(join(tmpdir(), "iqme-build-meth-"));
  try {
    const r = spawnSync("node", [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: tmpOutRoot },
    });
    assert.equal(r.status, 0, `expected build exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);

    for (const rel of EXPECTED) {
      const full = join(tmpOutRoot, rel);
      assert.ok(existsSync(full), `expected output at ${full}`);
      const html = readFileSync(full, "utf8");
      assert.ok(html.length > 0, `${full} is empty`);
      assert.ok(/<title>[^<]+<\/title>/.test(html), `${full} missing <title>`);
      assert.ok(/<pre class="methodology-stub-source">/.test(html), `${full} missing stub <pre> wrapper`);
      assert.ok(/v0\.1\.0/.test(html), `${full} missing v0.1.0 masthead version`);

      const slugMatch = rel.match(/\/scoring\/([^/]+)\//);
      assert.ok(slugMatch, `unexpected output rel path: ${rel}`);
      const slug = slugMatch[1];
      const titleRegex = EXPECTED_TITLES[slug];
      assert.ok(titleRegex.test(html), `${full} title does not match ${titleRegex} for slug ${slug}; first 400 chars: ${html.slice(0, 400)}`);
    }
  } finally {
    rmSync(tmpOutRoot, { recursive: true, force: true });
  }
});
