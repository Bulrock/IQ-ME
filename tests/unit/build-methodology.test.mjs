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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
    // Story 4.1 AC-2 removed the <pre class="methodology-stub-source"> wrap;
    // the body now lives inside <main> as real subset-rendered HTML.
    assert.ok(/<main>/.test(html), `expected <main> wrapper; got: ${html.slice(0, 500)}`);
    // Story 4-6: title moves into the masthead <h1 class="methodology-masthead__title">.
    assert.ok(/<h1 class="methodology-masthead__title">Sample page<\/h1>/.test(html),
      `expected masthead <h1> title from frontmatter; got: ${html.slice(0, 500)}`);
    assert.ok(!/<pre class="methodology-stub-source">/.test(html), `legacy stub <pre> wrap leaked; got: ${html.slice(0, 500)}`);
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
  // Imports must be node: stdlib only — with a single permitted relative import
  // to the in-repo renderer at tools/markdown-subset.mjs (Story 4.1).
  const importLines = src.match(/^import .*$/gm) || [];
  for (const line of importLines) {
    const isStdlib = /from\s+["']node:/.test(line);
    const isLocalRenderer = /from\s+["']\.\/markdown-subset\.mjs["']/.test(line);
    assert.ok(isStdlib || isLocalRenderer, `non-stdlib import detected: ${line}`);
  }
});

// ─── Story 4.1 extensions ───────────────────────────────────────────────────
//
// AC-2..AC-7, AC-10: env-override precedence, corpus-version resolution order,
// latest-companion emission, idempotency, frontmatter required-key validation,
// new template surfaces (no `<pre class="methodology-stub-source">` wrap, no
// "v0.1.0 stub" interim footer paragraph, no duplicated <h1>).

function runBuildWithVersion(srcFixture, outDir, version) {
  return spawnSync("node", [SCRIPT], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      IQME_BUILD_METHODOLOGY_SRC: resolve(FIXTURES, srcFixture),
      IQME_BUILD_METHODOLOGY_OUT: outDir,
      IQME_CORPUS_VERSION: version,
    },
  });
}

// AC-6: env-override precedence — IQME_CORPUS_VERSION wins, output path uses it.
test("AC-2/AC-6 4.1: IQME_CORPUS_VERSION env override drives output path", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const versioned = join(out, "v1.2.0/en/scoring/sample-page/index.html");
    assert.ok(existsSync(versioned), `expected versioned output at ${versioned}`);
    const v010 = join(out, "v0.1.0/en/scoring/sample-page/index.html");
    assert.ok(!existsSync(v010), `expected NO v0.1.0 output when env override set; found ${v010}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-6: when no env override and no corpus-v* tag, fallback to v0.1.0.
test("AC-6 4.1: with no env override the resolved version falls back to v0.1.0", () => {
  const out = makeOutDir();
  try {
    // Run with the env var EXPLICITLY removed so the resolver can fall through
    // to the git-describe path and then to the literal fallback.
    const cleanEnv = { ...process.env };
    delete cleanEnv.IQME_CORPUS_VERSION;
    cleanEnv.IQME_BUILD_METHODOLOGY_SRC = resolve(FIXTURES, "fixture-ok");
    cleanEnv.IQME_BUILD_METHODOLOGY_OUT = out;
    const r = spawnSync("node", [SCRIPT], { cwd: REPO_ROOT, encoding: "utf8", env: cleanEnv });
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const fallback = join(out, "v0.1.0/en/scoring/sample-page/index.html");
    assert.ok(existsSync(fallback), `expected fallback v0.1.0 path at ${fallback}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-6: malformed env value should be rejected; builder must NOT use a value
// that doesn't match /^v\d+\.\d+\.\d+$/.
test("AC-6 4.1: malformed IQME_CORPUS_VERSION (e.g. 'not-a-version') exits 1", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "not-a-version");
    assert.notEqual(r.status, 0, `expected non-zero exit for malformed version; stdout=${r.stdout}; stderr=${r.stderr}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-4: latest-companion emission.
test("AC-4 4.1: builder emits dist/.../latest/<lang>/<path>/index.html alongside versioned", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const latest = join(out, "latest/en/scoring/sample-page/index.html");
    assert.ok(existsSync(latest), `expected latest companion at ${latest}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-4: latest companion is byte-identical to versioned page.
test("AC-4 4.1: latest companion bytes equal versioned page bytes", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0);
    const versioned = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"));
    const latest = readFileSync(join(out, "latest/en/scoring/sample-page/index.html"));
    const hv = createHash("sha256").update(versioned).digest("hex");
    const hl = createHash("sha256").update(latest).digest("hex");
    assert.equal(hv, hl, `latest companion bytes differ from versioned bytes; sha256 ${hv} vs ${hl}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-3/AC-7: idempotency — two consecutive builds with the same env produce
// byte-identical output (per-corpus-release re-emit + deterministic bytes).
test("AC-3/AC-7 4.1: two consecutive builds with same version yield byte-identical bytes", () => {
  const out1 = makeOutDir();
  const out2 = makeOutDir();
  try {
    const r1 = runBuildWithVersion("fixture-ok", out1, "v1.2.0");
    const r2 = runBuildWithVersion("fixture-ok", out2, "v1.2.0");
    assert.equal(r1.status, 0);
    assert.equal(r2.status, 0);
    const a = readFileSync(join(out1, "v1.2.0/en/scoring/sample-page/index.html"));
    const b = readFileSync(join(out2, "v1.2.0/en/scoring/sample-page/index.html"));
    assert.equal(
      createHash("sha256").update(a).digest("hex"),
      createHash("sha256").update(b).digest("hex"),
      "two builds with same env not byte-identical",
    );
  } finally {
    rmSync(out1, { recursive: true, force: true });
    rmSync(out2, { recursive: true, force: true });
  }
});

// AC-3: re-emit semantics — second build into the SAME outDir must succeed and
// re-write the file even though nothing changed. No "skip if unchanged" logic.
test("AC-3 4.1: re-run into same outDir re-emits the page (no skip-if-unchanged)", () => {
  const out = makeOutDir();
  try {
    const r1 = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r1.status, 0);
    const file = join(out, "v1.2.0/en/scoring/sample-page/index.html");
    assert.ok(existsSync(file));
    const before = readFileSync(file, "utf8");
    const r2 = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r2.status, 0, `second run failed; stderr=${r2.stderr}`);
    assert.ok(existsSync(file), "file disappeared on second run");
    const after = readFileSync(file, "utf8");
    assert.equal(before, after, "re-emitted bytes differ — expected deterministic re-emit");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-2: stub-renderer wrap removed.
test("AC-2 4.1: output HTML does NOT contain <pre class=\"methodology-stub-source\"> wrap", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.ok(
      !/<pre class="methodology-stub-source">/.test(html),
      `stub <pre> wrap leaked into Story-4-1 output: ${html.slice(0, 500)}`,
    );
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-2: interim "v0.1.0 stub" footer paragraph removed.
test("AC-2 4.1: output HTML does NOT contain the interim 'v0.1.0 stub' footer paragraph", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.ok(
      !/v0\.1\.0 stub/i.test(html),
      `interim 'v0.1.0 stub' footer paragraph leaked into Story-4-1 output`,
    );
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-2 / AC-8 (Story 4-6 update): exactly one <h1> on the page; it now belongs
// to the masthead chrome, sourced from frontmatter `title`. The body heading
// (`# Sample heading`) is no longer rendered as <h1> — Story 4-6 reconciles the
// h1-duplication by either stripping the leading `#` from the body OR by
// allowing zero <h1> in the renderer. Engineer-choice; either way the only
// <h1> on the page is the masthead one.
test("AC-2 4.1 / AC-8 4.6: page has exactly one <h1> and it lives in the masthead", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    // Exactly one <h1>
    const h1Count = (html.match(/<h1\b/g) || []).length;
    assert.equal(h1Count, 1, `expected exactly one <h1>, found ${h1Count}`);
    // The single <h1> is the masthead title sourced from frontmatter.
    assert.match(html, /<h1 class="methodology-masthead__title">Sample page<\/h1>/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// AC-2 4.1: corpus-version appears in masthead and in <title> tag.
test("AC-2 4.1: rendered HTML contains the resolved corpus-version in masthead + title", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<title>[^<]*v1\.2\.0[^<]*<\/title>/, `expected v1.2.0 in <title>; got: ${html.slice(0, 400)}`);
    assert.match(html, /v1\.2\.0/, `expected v1.2.0 in body chrome`);
    assert.ok(!/v0\.1\.0/.test(html), `v0.1.0 leaked when v1.2.0 was requested: ${html.slice(0, 600)}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── Frontmatter required-key validation (AC-2) ────────────────────────────
//
// Parametrize across every required key; for each, build a fixture with the
// key missing and assert the builder exits non-zero with a message naming the
// missing key (or "missing required").

const REQUIRED_KEYS = [
  "title",
  "version",
  "lastReviewed",
  "reviewer",
  "reviewerHandle",
  "asserts",
  "glossaryRefs",
  "sourceHashEN",
];

for (const key of REQUIRED_KEYS) {
  test(`AC-2 4.1: missing frontmatter key '${key}' causes builder to exit non-zero`, () => {
    const fmRoot = mkdtempSync(join(tmpdir(), `iqme-fm-${key}-`));
    const out = makeOutDir();
    try {
      // Build the page tree at fmRoot/en/scoring/page/index.md with `key` omitted.
      const pageDir = join(fmRoot, "en/scoring/page");
      mkdirSync(pageDir, { recursive: true });
      const all = {
        title: '"X"',
        version: '"0.1.0"',
        lastReviewed: '"2026-05-19"',
        reviewer: '"R"',
        reviewerHandle: '"@r"',
        asserts: "\n  - \"a\"",
        glossaryRefs: "\n  - \"g\"",
        sourceHashEN: '"0000000000000000000000000000000000000000000000000000000000000000"',
      };
      const lines = ["---"];
      for (const [k, v] of Object.entries(all)) {
        if (k === key) continue;
        lines.push(`${k}: ${v}`);
      }
      lines.push("---", "", "# X", "", "Body.", "");
      writeFileSync(join(pageDir, "index.md"), lines.join("\n"));

      const r = spawnSync("node", [SCRIPT], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: {
          ...process.env,
          IQME_BUILD_METHODOLOGY_SRC: fmRoot,
          IQME_BUILD_METHODOLOGY_OUT: out,
          IQME_CORPUS_VERSION: "v1.2.0",
        },
      });
      assert.notEqual(r.status, 0, `expected non-zero exit when '${key}' missing; stdout=${r.stdout}; stderr=${r.stderr}`);
      assert.ok(
        new RegExp(key, "i").test(r.stderr) || /missing|required|frontmatter/i.test(r.stderr),
        `stderr should reference missing key '${key}' or 'missing required'; got: ${r.stderr}`,
      );
    } finally {
      rmSync(fmRoot, { recursive: true, force: true });
      rmSync(out, { recursive: true, force: true });
    }
  });
}

// ─── Real-renderer engagement: invalid body throws ─────────────────────────
//
// Author a fixture whose body contains a forbidden construct (e.g. autolink)
// and confirm the builder exits 1 with a markdown-subset diagnostic.
test("AC-2 4.1: body containing a forbidden construct (autolink) exits 1 via MarkdownSubsetError", () => {
  const root = mkdtempSync(join(tmpdir(), "iqme-bad-body-"));
  const out = makeOutDir();
  try {
    const pageDir = join(root, "en/scoring/bad");
    mkdirSync(pageDir, { recursive: true });
    const src =
      `---\n` +
      `title: "Bad"\n` +
      `version: "0.1.0"\n` +
      `lastReviewed: "2026-05-19"\n` +
      `reviewer: "R"\n` +
      `reviewerHandle: "@r"\n` +
      `asserts:\n  - "a"\n` +
      `glossaryRefs:\n  - "g"\n` +
      `sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"\n` +
      `---\n\n` +
      `# Bad page\n\n` +
      `An autolink to <https://example.com> is forbidden.\n`;
    writeFileSync(join(pageDir, "index.md"), src);
    const r = spawnSync("node", [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        IQME_BUILD_METHODOLOGY_SRC: root,
        IQME_BUILD_METHODOLOGY_OUT: out,
        IQME_CORPUS_VERSION: "v1.2.0",
      },
    });
    assert.notEqual(r.status, 0, `expected non-zero exit on forbidden construct; stdout=${r.stdout}; stderr=${r.stderr}`);
    assert.ok(
      /markdown-subset|autolink|forbidden|reject/i.test(r.stderr),
      `stderr should reference markdown-subset rejection; got: ${r.stderr}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

// ─── Story 4.6 template extensions ──────────────────────────────────────────
//
// AC-4: full masthead replaces minimal chrome.
// AC-7: meta tags, cite-widget placeholder, link tags, script tag, no-body-h1.

test("AC-4 4.6: emitted HTML contains full methodology-masthead with all 5 fields", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<header class="methodology-masthead">/);
    assert.match(html, /<h1 class="methodology-masthead__title">Sample page<\/h1>/);
    assert.match(html, /methodology-masthead__version[^>]*>[^<]*v1\.2\.0/);
    assert.match(html, /methodology-masthead__doi[^>]*>DOI: pending v1\.0\.0 release/);
    assert.match(html, /methodology-masthead__last-reviewed[^>]*>Last reviewed:[^<]*<time datetime="2026-05-19">2026-05-19<\/time>/);
    assert.match(html, /methodology-masthead__reviewer[^>]*>Reviewer: Sample \(@sample\)/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-4 4.6: emitted HTML contains <meta name=\"iqme-*\"> tags in <head>", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<meta name="iqme-title" content="Sample page">/);
    assert.match(html, /<meta name="iqme-version" content="v1\.2\.0">/);
    assert.match(html, /<meta name="iqme-doi" content="">/);
    assert.match(html, /<meta name="iqme-last-reviewed" content="2026-05-19">/);
    assert.match(html, /<meta name="iqme-reviewer" content="Sample">/);
    assert.match(html, /<meta name="iqme-reviewer-handle" content="@sample">/);
    assert.match(html, /<meta name="iqme-lang" content="en">/);
    assert.match(html, /<meta name="iqme-url" content="[^"]+">/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-4 4.6: emitted HTML contains the cite-widget placeholder aside", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<aside class="cite-this-page-affordance">\s*<div data-cite-widget>\s*<\/div>\s*<\/aside>/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-4 4.6: emitted HTML contains link tags for masthead.css and cite-this-page-widget.css", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<link rel="stylesheet" href="[^"]*masthead\.css">/);
    assert.match(html, /<link rel="stylesheet" href="[^"]*cite-this-page-widget\.css">/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-4 4.6: emitted HTML contains <script type=\"module\"> tag for cite-this-page.js", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /<script type="module" src="[^"]*cite-this-page\.js"[^>]*>\s*<\/script>/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-8 4.6: renderer body does NOT contain a <h1> (masthead owns the title)", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    // Extract the <main>...</main> block; it must not contain any <h1>.
    const mainMatch = html.match(/<main>([\s\S]*?)<\/main>/);
    assert.ok(mainMatch, "expected a <main> block in output");
    const mainBody = mainMatch[1];
    assert.ok(!/<h1\b/.test(mainBody), `<main> body must not contain <h1>; found in: ${mainBody.slice(0, 400)}`);
    // Title appears in the masthead <h1 class="methodology-masthead__title">.
    const h1Count = (html.match(/<h1\b/g) || []).length;
    assert.equal(h1Count, 1, `expected exactly one <h1> on the page (masthead); found ${h1Count}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("AC-5 4.6: DOI placeholder text appears verbatim when iqme-doi is empty", () => {
  const out = makeOutDir();
  try {
    const r = runBuildWithVersion("fixture-ok", out, "v1.2.0");
    assert.equal(r.status, 0);
    const html = readFileSync(join(out, "v1.2.0/en/scoring/sample-page/index.html"), "utf8");
    assert.match(html, /DOI: pending v1\.0\.0 release/);
    assert.match(html, /data-doi-pending/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
