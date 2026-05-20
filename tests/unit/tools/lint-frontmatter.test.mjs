// Unit tests for tools/lint-frontmatter.mjs.
// Story 4-3: red-phase failing tests authored pre-implementation.
//
// The lint validates YAML frontmatter on src/content/methodology/**.md pages
// against corpus/schema.json (hand-rolled stdlib subset validator).

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-frontmatter.mjs");

// Valid frontmatter baseline — all 8 required keys present with valid values.
const VALID_FM_FIELDS = {
  title: '"Test page"',
  version: '"0.1.0"',
  lastReviewed: '"2026-05-19"',
  reviewer: '"Test Reviewer"',
  reviewerHandle: '"@TBD-en-reviewer"',
  asserts: "[]",
  glossaryRefs: "[]",
  sourceHashEN: '"0000000000000000000000000000000000000000000000000000000000000000"',
};

function buildFrontmatter(overrides = {}, omitKeys = []) {
  const fields = { ...VALID_FM_FIELDS, ...overrides };
  for (const k of omitKeys) delete fields[k];
  const lines = ["---"];
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push("---");
  lines.push("");
  lines.push("# Body");
  lines.push("");
  return lines.join("\n");
}

function writePage(dir, relPath, content) {
  const full = join(dir, "src/content/methodology/en", relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

function runLint(args = [], cwd = REPO_ROOT) {
  return spawnSync("node", [SCRIPT, ...args], { cwd, encoding: "utf8" });
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-fm-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// AC-6.1 — Happy-path: minimal valid frontmatter passes.
test("lint-frontmatter: minimal valid frontmatter exits 0", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter());
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stdout, /validated/);
  });
});

// AC-6.2 — Each required key missing → fail.
for (const key of Object.keys(VALID_FM_FIELDS)) {
  test(`lint-frontmatter: missing required key '${key}' exits 1`, () => {
    withFixture((dir) => {
      writePage(dir, "bad/index.md", buildFrontmatter({}, [key]));
      const r = runLint([], dir);
      assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
      assert.match(
        r.stderr + r.stdout,
        new RegExp(key),
        `error output should mention '${key}'`,
      );
    });
  });
}

// AC-6.3 — Wrong type: title as number.
test("lint-frontmatter: title as number exits 1", () => {
  withFixture((dir) => {
    // Use bareword 123 — our mini-parser stores as string "123"; but our
    // validator should distinguish via the type-marker: schema requires string
    // with minLength 1. We instead test the empty-title case which the parser
    // can express. For real type-failure, see asserts-as-string below.
    writePage(dir, "bad/index.md", buildFrontmatter({ title: '""' }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /title/);
  });
});

// AC-6.4 — Version regex failures.
for (const bad of ['"0.1"', '"v0.1.0"', '"0.1.0.1"', '"latest"']) {
  test(`lint-frontmatter: invalid version ${bad} exits 1`, () => {
    withFixture((dir) => {
      writePage(dir, "bad/index.md", buildFrontmatter({ version: bad }));
      const r = runLint([], dir);
      assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
      assert.match(r.stderr + r.stdout, /version/);
    });
  });
}

test("lint-frontmatter: valid version 1.2.3 exits 0", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter({ version: '"1.2.3"' }));
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});

// AC-6.5 — lastReviewed format.
for (const bad of ['"not-a-date"', '"2026/05/20"', '"05-20-2026"']) {
  test(`lint-frontmatter: invalid lastReviewed ${bad} exits 1`, () => {
    withFixture((dir) => {
      writePage(dir, "bad/index.md", buildFrontmatter({ lastReviewed: bad }));
      const r = runLint([], dir);
      assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
      assert.match(r.stderr + r.stdout, /lastReviewed/);
    });
  });
}

test("lint-frontmatter: valid lastReviewed 2026-05-19 exits 0", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter({ lastReviewed: '"2026-05-19"' }));
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});

// AC-6.6 — sourceHashEN: must be 64-char hex.
test("lint-frontmatter: 63-char sourceHashEN exits 1", () => {
  withFixture((dir) => {
    writePage(dir, "bad/index.md", buildFrontmatter({
      sourceHashEN: '"' + "0".repeat(63) + '"',
    }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /sourceHashEN/);
  });
});

test("lint-frontmatter: 65-char sourceHashEN exits 1", () => {
  withFixture((dir) => {
    writePage(dir, "bad/index.md", buildFrontmatter({
      sourceHashEN: '"' + "0".repeat(65) + '"',
    }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /sourceHashEN/);
  });
});

test("lint-frontmatter: non-hex sourceHashEN exits 1", () => {
  withFixture((dir) => {
    writePage(dir, "bad/index.md", buildFrontmatter({
      sourceHashEN: '"' + "Z".repeat(64) + '"',
    }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /sourceHashEN/);
  });
});

test("lint-frontmatter: 64-char lowercase hex sourceHashEN exits 0", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter({
      sourceHashEN: '"' + "abcdef0123456789".repeat(4) + '"',
    }));
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});

// AC-6.7 — Arrays.
test("lint-frontmatter: asserts as bareword string exits 1", () => {
  withFixture((dir) => {
    // Express asserts as a non-array scalar by using a bareword that the
    // parser will store as a string. The validator must reject (schema: array).
    writePage(dir, "bad/index.md", buildFrontmatter({ asserts: "notAnArray" }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /asserts/);
  });
});

test("lint-frontmatter: asserts as block-list with one item exits 0", () => {
  withFixture((dir) => {
    const fm = [
      "---",
      'title: "Test"',
      'version: "0.1.0"',
      'lastReviewed: "2026-05-19"',
      'reviewer: "Rev"',
      'reviewerHandle: "@TBD-en-reviewer"',
      "asserts:",
      '  - "some-claim"',
      "glossaryRefs: []",
      `sourceHashEN: "${"0".repeat(64)}"`,
      "---",
      "",
      "body",
      "",
    ].join("\n");
    writePage(dir, "ok/index.md", fm);
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});

test("lint-frontmatter: empty asserts array exits 0", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter({ asserts: "[]" }));
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});

// AC-6.8 — Extra unknown keys (additionalProperties: true).
test("lint-frontmatter: extra unknown key 'pending: true' passes", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter({ pending: "true" }));
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});

// AC-6.9 — reviewerHandle pattern.
for (const bad of ['"no-at-sign"', '"@with spaces"']) {
  test(`lint-frontmatter: invalid reviewerHandle ${bad} exits 1`, () => {
    withFixture((dir) => {
      writePage(dir, "bad/index.md", buildFrontmatter({ reviewerHandle: bad }));
      const r = runLint([], dir);
      assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
      assert.match(r.stderr + r.stdout, /reviewerHandle/);
    });
  });
}

// AC-6.10 — No frontmatter at all.
test("lint-frontmatter: file without frontmatter exits 1", () => {
  withFixture((dir) => {
    writePage(dir, "bad/index.md", "# Just markdown, no frontmatter\n\nbody\n");
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
  });
});

// AC-6.11 — Multiple pages, one invalid → exit 1 mentioning invalid path.
test("lint-frontmatter: mixed valid+invalid pages exit 1 and report bad path", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter());
    writePage(dir, "bad/index.md", buildFrontmatter({ version: '"bogus"' }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /bad\/index\.md/);
  });
});

// AC-6.12 — No methodology dir / no pages → exit 0 with 0 validated.
test("lint-frontmatter: empty methodology tree exits 0", () => {
  withFixture((dir) => {
    mkdirSync(join(dir, "src/content/methodology/en"), { recursive: true });
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});

// ─── Story 5.1 — translationStatus optional field ───────────────────────

function writePageLang(dir, lang, relPath, content) {
  const full = join(dir, "src/content/methodology", lang, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

// 5.1 AC-5 — non-EN page with translationStatus: in-progress is valid
test("lint-frontmatter (5.1): non-EN translationStatus=in-progress exits 0", () => {
  withFixture((dir) => {
    writePageLang(
      dir,
      "ru",
      "ok/index.md",
      buildFrontmatter({ translationStatus: '"in-progress"' }),
    );
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
  });
});

// 5.1 AC-5 — EN page with translationStatus: in-progress is INVALID
test("lint-frontmatter (5.1): EN translationStatus=in-progress exits 1", () => {
  withFixture((dir) => {
    writePage(dir, "bad/index.md", buildFrontmatter({ translationStatus: '"in-progress"' }));
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(
      r.stderr + r.stdout,
      /translationStatus|source-of-truth|en.*in-progress/i,
      "must explain EN cannot be in-progress",
    );
  });
});

// 5.1 AC-5 — invalid enum value rejected
test("lint-frontmatter (5.1): translationStatus=bogus exits 1", () => {
  withFixture((dir) => {
    writePageLang(
      dir,
      "ru",
      "bad/index.md",
      buildFrontmatter({ translationStatus: '"bogus"' }),
    );
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}`);
    assert.match(r.stderr + r.stdout, /translationStatus/i);
  });
});

// 5.1 AC-5 — translationStatus omitted (default complete) still passes
test("lint-frontmatter (5.1): translationStatus omitted exits 0", () => {
  withFixture((dir) => {
    writePage(dir, "ok/index.md", buildFrontmatter());
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
  });
});
