// tests/unit/build-methodology.test.mjs
//
// Story 3.6 AC-8.1..8.8 — tools/build-methodology.mjs (interim stub renderer).
//
// Drives the builder via spawnSync with IQME_BUILD_METHODOLOGY_SRC + ..._OUT
// pointing at fixture trees + a per-test temp output dir.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/build-methodology.mjs");
const FIXTURES = resolve(REPO_ROOT, "tests/fixtures/build-methodology");

function makeOutDir() {
  return mkdtempSync(join(tmpdir(), "iqme-bm-"));
}

function runBuild(srcFixture, outDir) {
  return spawnSync("node", [SCRIPT], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      IQME_BUILD_METHODOLOGY_SRC: resolve(FIXTURES, srcFixture),
      IQME_BUILD_METHODOLOGY_OUT: outDir,
    },
  });
}

// ─── AC-8.1 ─────────────────────────────────────────────────────────────

test("AC-8.1: fixture-ok renders to expected output path with template surfaces", () => {
  const out = makeOutDir();
  try {
    const r = runBuild("fixture-ok", out);
    assert.equal(r.status, 0, `expected exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
    const outFile = join(out, "v0.1.0/en/scoring/sample-page/index.html");
    assert.ok(existsSync(outFile), `expected output at ${outFile}`);
    const html = readFileSync(outFile, "utf8");
    assert.ok(/<title>Sample page/.test(html), `expected <title> from frontmatter; got: ${html.slice(0, 200)}`);
    assert.ok(/<pre class="methodology-stub-source">/.test(html), `expected stub <pre> wrapper; got: ${html.slice(0, 500)}`);
    assert.ok(/v0\.1\.0/.test(html), `expected v0.1.0 in masthead; got: ${html.slice(0, 500)}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── AC-8.2 ─────────────────────────────────────────────────────────────

test("AC-8.2: malformed YAML frontmatter exits 1 with informative stderr", () => {
  const out = makeOutDir();
  try {
    const r = runBuild("fixture-malformed-yaml", out);
    assert.equal(r.status, 1, `expected exit 1; stdout=${r.stdout}; stderr=${r.stderr}`);
    assert.ok(/parsing|parse|frontmatter|yaml/i.test(r.stderr), `stderr must indicate parse failure; got: ${r.stderr}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── AC-8.3 ─────────────────────────────────────────────────────────────

test("AC-8.3: missing frontmatter exits 1 with informative stderr", () => {
  const out = makeOutDir();
  try {
    const r = runBuild("fixture-no-frontmatter", out);
    assert.equal(r.status, 1, `expected exit 1; stdout=${r.stdout}; stderr=${r.stderr}`);
    assert.ok(/frontmatter|missing|delimiter|---/i.test(r.stderr), `stderr must indicate missing frontmatter; got: ${r.stderr}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── AC-8.4 ─────────────────────────────────────────────────────────────

test("AC-8.4: fixture-multi renders both pages", () => {
  const out = makeOutDir();
  try {
    const r = runBuild("fixture-multi", out);
    assert.equal(r.status, 0, `expected exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
    const a = join(out, "v0.1.0/en/scoring/page-a/index.html");
    const b = join(out, "v0.1.0/en/scoring/page-b/index.html");
    assert.ok(existsSync(a), `expected ${a}`);
    assert.ok(existsSync(b), `expected ${b}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── AC-8.5 ─────────────────────────────────────────────────────────────

test("AC-8.5: HTML-text-escape correctness inside <pre>", () => {
  const out = makeOutDir();
  try {
    const r = runBuild("fixture-multi", out);
    assert.equal(r.status, 0);
    const b = join(out, "v0.1.0/en/scoring/page-b/index.html");
    const html = readFileSync(b, "utf8");
    // Body contains: <tag> & "quotes"
    assert.ok(/&lt;tag&gt;/.test(html), `expected &lt;tag&gt; in escaped body; got: ${html.slice(0, 800)}`);
    assert.ok(/&amp;/.test(html), `expected &amp; in escaped body`);
    // No double-escape: should NOT see &amp;lt; or &amp;amp;
    assert.ok(!/&amp;lt;|&amp;amp;|&amp;gt;/.test(html), `double-escape detected in body; got: ${html.slice(0, 800)}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── AC-8.6 ─────────────────────────────────────────────────────────────

test("AC-8.6: builder is deterministic (idempotent re-run yields byte-identical output)", () => {
  const out1 = makeOutDir();
  const out2 = makeOutDir();
  try {
    const r1 = runBuild("fixture-ok", out1);
    const r2 = runBuild("fixture-ok", out2);
    assert.equal(r1.status, 0);
    assert.equal(r2.status, 0);
    const f1 = readFileSync(join(out1, "v0.1.0/en/scoring/sample-page/index.html"));
    const f2 = readFileSync(join(out2, "v0.1.0/en/scoring/sample-page/index.html"));
    const h1 = createHash("sha256").update(f1).digest("hex");
    const h2 = createHash("sha256").update(f2).digest("hex");
    assert.equal(h1, h2, `expected byte-identical output across runs; sha256=${h1} vs ${h2}`);
  } finally {
    rmSync(out1, { recursive: true, force: true });
    rmSync(out2, { recursive: true, force: true });
  }
});

// ─── AC-8.7 ─────────────────────────────────────────────────────────────

test("AC-8.7: non-md files are skipped (walker ignores .txt / .json)", () => {
  const out = makeOutDir();
  try {
    const r = runBuild("fixture-non-md", out);
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    // Only .md should produce an .html output.
    const mdOut = join(out, "v0.1.0/en/sample/index.html");
    assert.ok(existsSync(mdOut), `expected .md output at ${mdOut}`);
    // No .txt-derived or .json-derived output should exist anywhere under out.
    function walk(dir) {
      let files = [];
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) files = files.concat(walk(p));
        else files.push(p);
      }
      return files;
    }
    const allOut = walk(out);
    assert.ok(!allOut.some((p) => p.endsWith(".txt") || p.endsWith(".json")), `non-md outputs leaked: ${allOut.join(", ")}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── AC-8.8 ─────────────────────────────────────────────────────────────

test("AC-8.8: tools/build-methodology.mjs has no forbidden globals / third-party imports", () => {
  const src = readFileSync(SCRIPT, "utf8");
  assert.ok(!/Math\.random/.test(src), "must not use Math.random");
  assert.ok(!/Date\.now/.test(src), "must not use Date.now");
  assert.ok(!/setTimeout|setInterval/.test(src), "must not use setTimeout/setInterval");
  assert.ok(!/localStorage|sessionStorage/.test(src), "must not reference localStorage/sessionStorage");
  // Imports must be node: stdlib only.
  const importLines = src.match(/^import .*$/gm) || [];
  for (const line of importLines) {
    assert.ok(/from\s+["']node:/.test(line), `non-stdlib import detected: ${line}`);
  }
});
