// Unit tests for the PL methodology corpus mirror scaffold (Story 7-4).
// Story 7-4: red-phase failing tests authored pre-scaffold.
//
// The PL tree (src/content/methodology/pl/) is .gitkeep-only today; these
// tests MUST fail now and pass once the engineer scaffolds the PL mirror:
// every EN page gets a PL counterpart at the identical relative path with
// parity frontmatter (sourceHashEN = SHA256(EN body), translationStatus =
// in-progress, reviewer = TBD, reviewerHandle = @TBD-pl-reviewer) and an
// EN-placeholder body. We assert STRUCTURE / frontmatter / parity / build
// attrs only — never PL body prose (gated on Gate 9d).
//
// Pure stdlib (NFR33): node:test, node:assert/strict, node:fs, node:crypto,
// node:path, node:child_process. ESM .mjs.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const METHODOLOGY_ROOT = resolve(REPO_ROOT, "src/content/methodology");
const EN_ROOT = join(METHODOLOGY_ROOT, "en");
const PL_ROOT = join(METHODOLOGY_ROOT, "pl");
const BUILD_SCRIPT = resolve(REPO_ROOT, "tools/build-methodology.mjs");

// Walk *.md files under dir, skipping dotfiles (e.g. .gitkeep). Returns
// repo-tree-relative-to-`root` POSIX paths, sorted for determinism. Mirrors
// build-methodology.mjs walkMd().
function walkMdRel(root) {
  const out = [];
  function rec(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      if (e.code === "ENOENT") return;
      throw e;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) rec(p);
      else if (e.isFile() && e.name.endsWith(".md")) {
        out.push(relative(root, p).split("\\").join("/"));
      }
    }
  }
  rec(root);
  out.sort();
  return out;
}

// Compute the EN body SHA256 EXACTLY as build-methodology.mjs enSourceHashFor()
// does: read EN file utf8, split on /\r?\n/, drop frontmatter (text after the
// closing `---`), join survivors with \n, sha256 utf8 → lowercase hex.
function enBodyHash(enAbsPath) {
  const text = readFileSync(enAbsPath, "utf8");
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return undefined;
  const body = lines.slice(end + 1).join("\n");
  return createHash("sha256").update(body, "utf8").digest("hex");
}

// Extract a top-level scalar frontmatter value (quoted or bareword), matching
// the lenient parser shape used by the corpus tools. Returns undefined if the
// key is absent or there is no frontmatter block.
function frontmatterValue(text, key) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return undefined;
  const keyRe = new RegExp(`^${key}\\s*:\\s*(.*)$`);
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(keyRe);
    if (m) {
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return undefined;
}

// Derive the EN page list from the real tree (no magic count).
const EN_PAGES = walkMdRel(EN_ROOT);

// Sanity guard for the test fixture itself (not an AC): if the EN corpus
// vanished, every assertion below is vacuous — fail loud instead of green.
test("AC-4 fixture: EN methodology corpus is non-empty", () => {
  assert.ok(
    EN_PAGES.length > 0,
    `expected EN methodology pages under ${EN_ROOT}; found none`,
  );
});

// AC-4 (a) — every EN page has a PL counterpart at the identical relative
// path, and there are no orphan PL pages without an EN counterpart.
test("AC-4 (a): PL mirror has exact path parity with EN (no missing, no orphans)", () => {
  const plPages = walkMdRel(PL_ROOT);
  const enSet = new Set(EN_PAGES);
  const plSet = new Set(plPages);

  const missing = EN_PAGES.filter((p) => !plSet.has(p));
  const orphans = plPages.filter((p) => !enSet.has(p));

  assert.deepEqual(
    missing,
    [],
    `EN pages with no PL counterpart at the same relative path: ${JSON.stringify(missing)}`,
  );
  assert.deepEqual(
    orphans,
    [],
    `PL pages with no EN counterpart (orphans): ${JSON.stringify(orphans)}`,
  );
});

// AC-4 (b) — every PL page's frontmatter sourceHashEN equals SHA256(EN body)
// for its counterpart, computed exactly as build-methodology.mjs does → the
// build sees isStale=false at landing.
test("AC-4 (b): every PL sourceHashEN === SHA256(EN counterpart body)", () => {
  const mismatches = [];
  for (const rel of EN_PAGES) {
    const plAbs = join(PL_ROOT, rel);
    const enAbs = join(EN_ROOT, rel);
    if (!existsSync(plAbs)) {
      mismatches.push(`${rel}: PL counterpart missing`);
      continue;
    }
    const expected = enBodyHash(enAbs);
    const actual = frontmatterValue(readFileSync(plAbs, "utf8"), "sourceHashEN");
    if (actual !== expected) {
      mismatches.push(`${rel}: sourceHashEN=${actual} expected ${expected}`);
    }
  }
  assert.deepEqual(mismatches, [], `sourceHashEN parity failures:\n${mismatches.join("\n")}`);
});

// AC-4 (c) — every PL page frontmatter carries the gated-reviewer scaffold
// markers: translationStatus=in-progress, reviewerHandle=@TBD-pl-reviewer,
// reviewer=TBD.
test("AC-4 (c): every PL page carries translationStatus/reviewerHandle/reviewer scaffold markers", () => {
  const violations = [];
  for (const rel of EN_PAGES) {
    const plAbs = join(PL_ROOT, rel);
    if (!existsSync(plAbs)) {
      violations.push(`${rel}: PL counterpart missing`);
      continue;
    }
    const text = readFileSync(plAbs, "utf8");
    const status = frontmatterValue(text, "translationStatus");
    const handle = frontmatterValue(text, "reviewerHandle");
    const reviewer = frontmatterValue(text, "reviewer");
    if (status !== "in-progress") {
      violations.push(`${rel}: translationStatus=${JSON.stringify(status)} expected "in-progress"`);
    }
    if (handle !== "@TBD-pl-reviewer") {
      violations.push(`${rel}: reviewerHandle=${JSON.stringify(handle)} expected "@TBD-pl-reviewer"`);
    }
    if (reviewer !== "TBD") {
      violations.push(`${rel}: reviewer=${JSON.stringify(reviewer)} expected "TBD"`);
    }
  }
  assert.deepEqual(violations, [], `PL scaffold-marker violations:\n${violations.join("\n")}`);
});

// AC-4 (d) — building the corpus emits, for a sampled PL page, HTML containing
// data-translation-status="in-progress" and NOT data-translation-stale="true".
// We invoke build-methodology.mjs directly into a throwaway dist via its env
// overrides (IQME_BUILD_METHODOLOGY_OUT + IQME_CORPUS_VERSION), then read the
// emitted PL HTML. The sampled page is derived from the real EN tree so it
// can never reference a page that doesn't exist.
test("AC-4 (d): built PL page HTML has data-translation-status=\"in-progress\" and not stale", () => {
  assert.ok(EN_PAGES.length > 0, "no EN pages to sample from");
  // Deterministic sample: first page in sorted order.
  const sampleRel = EN_PAGES[0];

  const outDir = mkdtempSync(join(tmpdir(), "pl-mirror-build-"));
  try {
    const version = "v0.1.0";
    const r = spawnSync("node", [BUILD_SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        IQME_BUILD_METHODOLOGY_OUT: outDir,
        IQME_CORPUS_VERSION: version,
      },
    });
    assert.equal(
      r.status,
      0,
      `build-methodology exited ${r.status}; stderr: ${r.stderr}; stdout: ${r.stdout}`,
    );

    const htmlRel = sampleRel.replace(/\.md$/, ".html");
    const htmlPath = join(outDir, version, "pl", htmlRel);
    assert.ok(
      existsSync(htmlPath),
      `expected built PL HTML at ${htmlPath} (PL page ${sampleRel} not rendered); build stdout: ${r.stdout}`,
    );

    const html = readFileSync(htmlPath, "utf8");
    assert.match(
      html,
      /data-translation-status="in-progress"/,
      `PL page ${sampleRel} HTML missing data-translation-status="in-progress"`,
    );
    assert.doesNotMatch(
      html,
      /data-translation-stale="true"/,
      `PL page ${sampleRel} HTML must NOT be stale at landing (sourceHashEN must match EN body)`,
    );
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
