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
import { createHash } from "node:crypto";

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
      // Story 4.1 AC-2 removed the <pre class="methodology-stub-source"> wrap;
      // body now lives inside <main> as real subset-rendered HTML.
      assert.ok(/<main>/.test(html), `${full} missing <main> wrapper`);
      // Story 4-6: <h1> now lives in the masthead chrome, not the body.
      assert.ok(/<h1\b/.test(html), `${full} missing <h1> (masthead)`);
      assert.ok(!/<pre class="methodology-stub-source">/.test(html), `${full} legacy stub <pre> wrap leaked`);
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

// ─── Story 4.1 extensions ───────────────────────────────────────────────────
//
// AC-4: dist/methodology/latest/<lang>/<path>/index.html companion exists for
//       each of the four EN pages and bytes equal the versioned page bytes.
// AC-5: all four pre-existing EN pages (3 scoring stubs + icar-license) still
//       render at the v0.1.0 URL after Story 4.1 lands.
//
// Per-test mkdtempSync is preserved from Story 3-6 round-1 — do not regress
// the test-isolation fix.

const EPIC_4_EXPECTED = [
  "scoring/percentile-to-iq/index.html",
  "scoring/uncertainty/index.html",
  "scoring/overview/index.html",
  // PR-12b (Story 11-1): icar-license.md now emits directory-style index.html
  // (trailing-slash served URL, matching canonicalUrlFor) like every page.
  "provenance/icar-license/index.html",
];

test("AC-5 4.1: all four pre-Story-3-6 EN pages render at v0.1.0/en/ (path contract preserved)", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-build-meth-4-1-ac5-"));
  try {
    const r = spawnSync("node", [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: out },
    });
    assert.equal(r.status, 0, `expected build exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
    for (const rel of EPIC_4_EXPECTED) {
      const full = join(out, "v0.1.0/en", rel);
      assert.ok(existsSync(full), `expected versioned output at ${full}`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-4 4.1: latest/en/<path>/index.html companion exists for each of the 4 EN pages", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-build-meth-4-1-ac4-exist-"));
  try {
    const r = spawnSync("node", [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: out },
    });
    assert.equal(r.status, 0, `stderr=${r.stderr}`);
    for (const rel of EPIC_4_EXPECTED) {
      const full = join(out, "latest/en", rel);
      assert.ok(existsSync(full), `expected latest companion at ${full}`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-4 4.1: latest/<path> bytes equal v0.1.0/<path> bytes for each EN page", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-build-meth-4-1-ac4-bytes-"));
  try {
    const r = spawnSync("node", [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: out },
    });
    assert.equal(r.status, 0, `stderr=${r.stderr}`);
    for (const rel of EPIC_4_EXPECTED) {
      const versioned = readFileSync(join(out, "v0.1.0/en", rel));
      const latest = readFileSync(join(out, "latest/en", rel));
      const hv = createHash("sha256").update(versioned).digest("hex");
      const hl = createHash("sha256").update(latest).digest("hex");
      assert.equal(hv, hl, `byte mismatch for ${rel}: versioned ${hv} vs latest ${hl}`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-5 4.1: rendered pages no longer carry the stub <pre class=\"methodology-stub-source\"> wrap", () => {
  const out = mkdtempSync(join(tmpdir(), "iqme-build-meth-4-1-nostub-"));
  try {
    const r = spawnSync("node", [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, IQME_BUILD_METHODOLOGY_OUT: out },
    });
    assert.equal(r.status, 0, `stderr=${r.stderr}`);
    for (const rel of EPIC_4_EXPECTED) {
      const full = join(out, "v0.1.0/en", rel);
      const html = readFileSync(full, "utf8");
      assert.ok(
        !/<pre class="methodology-stub-source">/.test(html),
        `stub <pre> wrap leaked into Story-4-1 output at ${full}`,
      );
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
