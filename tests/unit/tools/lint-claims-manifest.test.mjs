// Unit tests for tools/lint-claims-manifest.mjs.
// Story 2-7: red-phase failing tests authored pre-implementation.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-claims-manifest.mjs");

function runLint(args, cwd) {
  return spawnSync("node", [SCRIPT, ...args], {
    cwd: cwd ?? REPO_ROOT,
    encoding: "utf8",
  });
}

// AC-4.1 — Default invocation in warn-mode against real manifest exits 0.
test("lint-claims-manifest: warn-mode exits 0 on real manifest (no methodology pages yet)", () => {
  const result = runLint([]);
  assert.equal(
    result.status,
    0,
    `expected exit 0; got ${result.status}; stderr: ${result.stderr}`,
  );
  // Should emit WARN lines but not exit 1.
  assert.ok(
    result.stderr.includes("WARN") || result.stdout.includes("WARN"),
    "expected WARN lines in output when methodology pages missing",
  );
});

// AC-4.2 (Story 4.3 update) — --strict on real manifest exits 0: in-repo
// pages have matching asserts; Epic-5 stub pages WARN (not fail) per AC-2.
test("lint-claims-manifest: --strict on real manifest exits 0 (Epic-5 stubs WARN)", () => {
  const result = runLint(["--strict"]);
  assert.equal(
    result.status,
    0,
    `expected exit 0; got ${result.status}; stderr: ${result.stderr}`,
  );
  // Should emit WARN lines for the 6 deferred Epic-5 stub pages.
  assert.ok(
    result.stderr.includes("WARN") || result.stdout.includes("WARN"),
    "expected WARN lines for Epic-5 stub methodology pages",
  );
});

// AC-4.3 — Mock methodology page with correct asserts → that claim emits no warning.
test("lint-claims-manifest: claim with matching methodology page emits no warning for that claim", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-"));
  try {
    // Build a minimal fixture with 1 claim + a matching methodology page.
    const manifest = {
      version: "1.0.0",
      claims: [
        {
          "claim-id": "test-claim",
          "engine-source": "src/scoring/irt/eap.js",
          "methodology-path": "src/content/methodology/en/test/page.md",
          "value-or-formula": "test = 1",
        },
      ],
    };
    writeFileSync(join(dir, "METHODOLOGY_CLAIMS.json"), JSON.stringify(manifest));
    mkdirSync(join(dir, "src/scoring/irt"), { recursive: true });
    writeFileSync(join(dir, "src/scoring/irt/eap.js"), "// stub\n");
    mkdirSync(join(dir, "src/content/methodology/en/test"), { recursive: true });
    writeFileSync(
      join(dir, "src/content/methodology/en/test/page.md"),
      "---\ntitle: test\nasserts: [test-claim]\n---\n\nbody\n",
    );

    const result = runLint([], dir);
    assert.equal(result.status, 0, `expected exit 0; got ${result.status}; stderr: ${result.stderr}`);
    assert.ok(
      !result.stderr.includes("test-claim") || !result.stderr.includes("WARN"),
      `test-claim should not WARN when page asserts it; stderr: ${result.stderr}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-4.4 — Broken JSON exits 1.
test("lint-claims-manifest: broken JSON manifest exits 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-"));
  try {
    writeFileSync(join(dir, "METHODOLOGY_CLAIMS.json"), "{ not valid json");
    const result = runLint([], dir);
    assert.equal(result.status, 1, `expected exit 1; got ${result.status}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-4.5 — Missing manifest file exits 1.
test("lint-claims-manifest: missing manifest exits 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-"));
  try {
    const result = runLint([], dir);
    assert.equal(result.status, 1, `expected exit 1; got ${result.status}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Story 4-3 strict-mode bidirectional extensions ──────────────────

// Helper to build a minimal repo with engine-source + optional methodology page.
function buildFixture(dir, { claims, pages = {} }) {
  writeFileSync(
    join(dir, "METHODOLOGY_CLAIMS.json"),
    JSON.stringify({ version: "1.0.0", claims }),
  );
  // Provide engine-source files for every unique path.
  const engineSources = new Set(claims.map((c) => c["engine-source"]));
  for (const es of engineSources) {
    const p = join(dir, es);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, "// stub\n");
  }
  // Write pages.
  for (const [relPath, content] of Object.entries(pages)) {
    const p = join(dir, relPath);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}

// AC-2: strict mode + methodology-path exists + assert MISSING → fail.
test("lint-claims-manifest: --strict + existing page missing assert → exit 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-strict-"));
  try {
    buildFixture(dir, {
      claims: [
        {
          "claim-id": "foo-claim",
          "engine-source": "src/engine/foo.js",
          "methodology-path": "src/content/methodology/en/foo.md",
          "value-or-formula": "foo = 1",
        },
      ],
      pages: {
        "src/content/methodology/en/foo.md":
          '---\ntitle: "Foo"\nasserts: []\n---\n\nbody\n',
      },
    });
    const r = runLint(["--strict"], dir);
    assert.equal(r.status, 1, `expected exit 1; stderr: ${r.stderr}`);
    assert.match(
      r.stderr + r.stdout,
      /foo-claim/,
      "should mention claim-id in error",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-2: strict mode + methodology-path MISSING on disk → WARN (not fail).
test("lint-claims-manifest: --strict + page not yet authored → exit 0 with WARN", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-strict-"));
  try {
    buildFixture(dir, {
      claims: [
        {
          "claim-id": "deferred-claim",
          "engine-source": "src/engine/foo.js",
          "methodology-path": "src/content/methodology/en/not-yet.md",
          "value-or-formula": "foo = 1",
        },
      ],
    });
    const r = runLint(["--strict"], dir);
    assert.equal(
      r.status,
      0,
      `expected exit 0 (deferred-page → WARN); got ${r.status}; stderr: ${r.stderr}`,
    );
    assert.match(
      r.stderr + r.stdout,
      /WARN/,
      "should emit WARN for deferred page",
    );
    assert.match(
      r.stderr + r.stdout,
      /deferred-claim|not-yet\.md/,
      "WARN should reference the deferred claim or path",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-2: strict mode + orphan assert in page (claim-id not in manifest) → fail.
test("lint-claims-manifest: --strict + orphan assert in page → exit 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-strict-"));
  try {
    buildFixture(dir, {
      claims: [
        {
          "claim-id": "real-claim",
          "engine-source": "src/engine/foo.js",
          "methodology-path": "src/content/methodology/en/foo.md",
          "value-or-formula": "foo = 1",
        },
      ],
      pages: {
        "src/content/methodology/en/foo.md":
          '---\ntitle: "Foo"\nasserts:\n  - "real-claim"\n  - "ghost-claim-not-in-manifest"\n---\n\nbody\n',
      },
    });
    const r = runLint(["--strict"], dir);
    assert.equal(r.status, 1, `expected exit 1; stderr: ${r.stderr}`);
    assert.match(
      r.stderr + r.stdout,
      /ghost-claim-not-in-manifest|orphan/,
      "should call out the orphan assert",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-5: warn-mode default unchanged — no orphan-assert checking in warn-mode.
test("lint-claims-manifest: warn-mode does NOT enforce orphan-assert check", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-warn-"));
  try {
    buildFixture(dir, {
      claims: [
        {
          "claim-id": "real-claim",
          "engine-source": "src/engine/foo.js",
          "methodology-path": "src/content/methodology/en/foo.md",
          "value-or-formula": "foo = 1",
        },
      ],
      pages: {
        "src/content/methodology/en/foo.md":
          '---\ntitle: "Foo"\nasserts:\n  - "real-claim"\n  - "ghost-claim-not-in-manifest"\n---\n\nbody\n',
      },
    });
    const r = runLint([], dir);
    assert.equal(
      r.status,
      0,
      `warn-mode should not fail on orphan assert; got ${r.status}; stderr: ${r.stderr}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// AC-2: strict mode + page with all asserts matching manifest → exit 0.
test("lint-claims-manifest: --strict + page with matching asserts → exit 0", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-claims-strict-"));
  try {
    buildFixture(dir, {
      claims: [
        {
          "claim-id": "matched-claim",
          "engine-source": "src/engine/foo.js",
          "methodology-path": "src/content/methodology/en/foo.md",
          "value-or-formula": "foo = 1",
        },
      ],
      pages: {
        "src/content/methodology/en/foo.md":
          '---\ntitle: "Foo"\nasserts:\n  - "matched-claim"\n---\n\nbody\n',
      },
    });
    const r = runLint(["--strict"], dir);
    assert.equal(r.status, 0, `expected exit 0; stderr: ${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
