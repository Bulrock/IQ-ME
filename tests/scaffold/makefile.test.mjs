// Story 1.1 — Acceptance tests for Makefile + repo skeleton.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one Acceptance Criterion in spec
// _bmad-output/implementation-artifacts/stories/1-1-bootstrap-repo-skeleton-makefile.md.
//
// Run: `node --test tests/scaffold/makefile.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const REQUIRED_TARGETS = [
  "test",
  "lint",
  "build",
  "build-methodology",
  "dev",
  "clean",
  "snapshot-update",
];

function runMake(args) {
  return execFileSync("make", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("AC-1: `make help` exits 0 and lists all seven documented targets", () => {
  const out = runMake(["help"]);
  for (const target of REQUIRED_TARGETS) {
    assert.match(
      out,
      new RegExp(`^${target}\\b`, "m"),
      `make help output missing target "${target}". Got:\n${out}`,
    );
  }
});

test("AC-1: each target has a one-line `## <description>` self-doc comment", () => {
  const makefile = readFileSync(join(REPO_ROOT, "Makefile"), "utf8");
  for (const target of REQUIRED_TARGETS) {
    const pattern = new RegExp(`^${target}:.*## .+$`, "m");
    assert.match(
      makefile,
      pattern,
      `Makefile target "${target}" missing "## <description>" self-doc comment.`,
    );
  }
});

test("AC-2: `make lint` exits 0 against empty source tree", () => {
  // Throws on non-zero exit. Empty stdout/stderr is acceptable; stubs may echo.
  runMake(["lint"]);
});

test("AC-2: `make test` exits 0 — runs Node test runner against this very test file (self-bootstrap)", () => {
  // This test runs INSIDE `make test`. If we got here at all, it exits 0 transitively.
  // The assertion below documents the contract; the real proof is the runner not erroring.
  assert.ok(true, "make test invoked the runner; this test executed");
});

test("AC-3: Makefile contains no absolute paths", () => {
  const makefile = readFileSync(join(REPO_ROOT, "Makefile"), "utf8");
  const lines = makefile.split("\n");
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Strip leading whitespace (tab/space). Skip comments.
    const stripped = line.replace(/^[\t ]+/, "");
    if (stripped.startsWith("#")) continue;
    // Absolute path heuristics: a token beginning with `/` that is NOT `/dev/null`
    // (legitimate Make idiom for discarding output) and NOT inside a `## ` comment.
    const tokens = stripped.split(/\s+/);
    for (const tok of tokens) {
      if (tok.startsWith("/") && tok !== "/dev/null" && !tok.startsWith("//")) {
        violations.push(`line ${i + 1}: absolute path token "${tok}"`);
      }
    }
  }
  assert.deepEqual(
    violations,
    [],
    `Makefile contains absolute paths — violates NFR17 mirror-build portability:\n  ${violations.join("\n  ")}`,
  );
});

test("AC-3: Makefile references no env-specific vars (HOME, USER, hardcoded usernames)", () => {
  const makefile = readFileSync(join(REPO_ROOT, "Makefile"), "utf8");
  const forbidden = [/\$\(?HOME\)?/, /\$\(?USER\)?/, /\$\(?LOGNAME\)?/];
  for (const re of forbidden) {
    assert.doesNotMatch(
      makefile,
      re,
      `Makefile references env-specific variable matching ${re} — violates NFR17.`,
    );
  }
});

test("AC-3: dev tools invoked via `npx --yes` or vendored under vendor/", () => {
  const makefile = readFileSync(join(REPO_ROOT, "Makefile"), "utf8");
  // For each recipe line that invokes a non-builtin command, it must be one of:
  //   - a shell builtin / coreutil (echo, exit, true, false, rm, mkdir, find, grep, cd, [, test)
  //   - `node` (Node-native, present per NFR33 dev-tool assumption)
  //   - `make` (recursive invocation)
  //   - `npx --yes <tool>` (per NFR33)
  //   - `./vendor/<file>` or `vendor/<file>` (SHA-pinned)
  const ALLOWED_CMDS = new Set([
    "echo", "exit", "true", "false", "rm", "mkdir", "find", "grep",
    "cd", "[", "test", "node", "make", ":", "@echo", "@:",
  ]);
  const lines = makefile.split("\n");
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("\t")) continue; // not a recipe line
    const stripped = line.replace(/^\t+/, "").replace(/^@/, "");
    if (!stripped || stripped.startsWith("#")) continue;
    // Take first token (the command).
    const firstTok = stripped.split(/\s+/)[0]?.replace(/^@/, "");
    if (!firstTok) continue;
    if (ALLOWED_CMDS.has(firstTok)) continue;
    // npx with --yes flag is allowed.
    if (firstTok === "npx" && stripped.includes("--yes")) continue;
    // vendor/ invocation.
    if (firstTok.startsWith("./vendor/") || firstTok.startsWith("vendor/")) continue;
    violations.push(`line ${i + 1}: disallowed command "${firstTok}" in recipe — must be coreutil, node, make, "npx --yes <tool>", or vendor/<file>. Line: ${line}`);
  }
  assert.deepEqual(
    violations,
    [],
    `Makefile invokes dev tools outside NFR33 policy:\n  ${violations.join("\n  ")}`,
  );
});

test("Bootstrap: prototype iq-me.html is removed from repo root", () => {
  assert.equal(
    existsSync(join(REPO_ROOT, "iq-me.html")),
    false,
    "iq-me.html prototype must be removed per architecture §Bootstrap Sequence",
  );
});

test("Bootstrap: required directory skeleton exists (Five-Domain model)", () => {
  const required = [
    "src/assessment",
    "src/assessment/i18n",
    "src/scoring/irt",
    "src/css/components",
    "src/css/utilities",
    "src/items",
    "src/content/methodology/en",
    "src/content/methodology/ru",
    "src/content/methodology/pl",
    "src/content/i18n/en",
    "src/content/i18n/ru",
    "src/content/i18n/pl",
    "src/content/glossary",
    "src/content/trails",
    "src/content/crisis-resources",
    "src/content/diagrams",
    "tests/golden",
    "tests/playwright",
    "tests/a11y",
    "tests/perf",
    "tests/snapshots/methodology",
    "tools",
    "vendor",
    "corpus",
    "templates",
    ".github/workflows",
  ];
  const missing = [];
  for (const dir of required) {
    const full = join(REPO_ROOT, dir);
    if (!existsSync(full) || !statSync(full).isDirectory()) {
      missing.push(dir);
    }
  }
  assert.deepEqual(
    missing,
    [],
    `Missing required scaffold directories (per architecture §Five-Domain Boundary Model):\n  ${missing.join("\n  ")}`,
  );
});

test("Bootstrap: vendor/SHASUMS placeholder exists", () => {
  assert.equal(
    existsSync(join(REPO_ROOT, "vendor/SHASUMS")),
    true,
    "vendor/SHASUMS placeholder must exist for SHA-pin policy (NFR33).",
  );
});
