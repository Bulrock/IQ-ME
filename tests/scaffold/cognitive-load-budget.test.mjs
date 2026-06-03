// Story 1.5 — Acceptance tests for BUDGETS.json + lint-cognitive-load-budget.mjs.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one Acceptance Criterion in spec
// _bmad-output/implementation-artifacts/stories/1-5-commit-budgets-json-lint-cognitive-load-budget-mjs.md.
//
// Run: `node --test tests/scaffold/cognitive-load-budget.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const BUDGETS_PATH = join(REPO_ROOT, "BUDGETS.json");
const LINT_PATH = join(REPO_ROOT, "tools", "lint-cognitive-load-budget.mjs");

// Per AC-2 — the exact NFR32 budgets that MUST be present.
const REQUIRED_BUDGETS = {
  "scoring-irt-lines":      { metric: "lines", limit: 250 },
  "css-components-lines":   { metric: "lines", limit: 1500 },
  "app-modules-bytes":      { metric: "bytes", limit: 57344 },
  "i18n-harness-bytes":     { metric: "bytes", limit: 15360 },
  "methodology-pages-en":   { metric: "files", limit: 45 },
  "methodology-pages-ru":   { metric: "files", limit: 45 },
  "methodology-pages-pl":   { metric: "files", limit: 30 },
};

function loadBudgets() {
  assert.ok(existsSync(BUDGETS_PATH), `BUDGETS.json missing at repo root: ${BUDGETS_PATH}`);
  const raw = readFileSync(BUDGETS_PATH, "utf8");
  return JSON.parse(raw); // throws on malformed JSON — AC-1 implicit
}

function runLint(env = {}) {
  // We intentionally do NOT use execFileSync's `throws on non-zero` behavior because
  // we need both exit codes (0 for green, 1 for breach). spawnSync returns the
  // status without throwing.
  return spawnSync("node", [LINT_PATH], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

// ─────────────────────────────────────────────────────────────────────
// AC-1 — BUDGETS.json shape
// ─────────────────────────────────────────────────────────────────────

test("AC-1: BUDGETS.json is valid JSON at repo root", () => {
  const budgets = loadBudgets();
  assert.equal(typeof budgets, "object", "BUDGETS.json must parse as JSON object");
  assert.ok(!Array.isArray(budgets), "BUDGETS.json must be an object, not array");
});

test("AC-1: every BUDGETS.json entry has required keys with correct types", () => {
  const budgets = loadBudgets();
  for (const [id, entry] of Object.entries(budgets)) {
    assert.equal(typeof entry.domain, "string", `${id}: domain must be string`);
    assert.ok(entry.domain.length > 0, `${id}: domain must be non-empty`);
    assert.ok(
      ["lines", "bytes", "files"].includes(entry.metric),
      `${id}: metric must be one of lines/bytes/files (got ${entry.metric})`,
    );
    assert.equal(typeof entry.limit, "number", `${id}: limit must be number`);
    assert.ok(entry.limit > 0, `${id}: limit must be positive`);
    assert.equal(typeof entry.rationale, "string", `${id}: rationale must be string`);
    assert.ok(entry.rationale.length > 0, `${id}: rationale must be non-empty`);
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-2 — NFR32 budget coverage
// ─────────────────────────────────────────────────────────────────────

test("AC-2: all required NFR32 budgets are present with exact limits", () => {
  const budgets = loadBudgets();
  for (const [id, expected] of Object.entries(REQUIRED_BUDGETS)) {
    assert.ok(budgets[id], `Required budget "${id}" missing from BUDGETS.json`);
    assert.equal(
      budgets[id].metric,
      expected.metric,
      `${id}: metric mismatch (expected ${expected.metric}, got ${budgets[id].metric})`,
    );
    assert.equal(
      budgets[id].limit,
      expected.limit,
      `${id}: limit mismatch (expected ${expected.limit}, got ${budgets[id].limit})`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-3 — rationale links reference NFR
// ─────────────────────────────────────────────────────────────────────

test("AC-3: every budget's rationale references its binding NFR (NFR32-NFR35)", () => {
  const budgets = loadBudgets();
  const nfrRegex = /NFR3[2-5]/;
  for (const [id, entry] of Object.entries(budgets)) {
    assert.match(
      entry.rationale,
      nfrRegex,
      `${id}: rationale must reference NFR32-NFR35 (got: ${entry.rationale})`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-4 — empty-tree green run
// ─────────────────────────────────────────────────────────────────────

test("AC-4: lint-cognitive-load-budget.mjs exists and is executable as a Node script", () => {
  assert.ok(existsSync(LINT_PATH), `tools/lint-cognitive-load-budget.mjs missing`);
});

test("AC-4: lint exits 0 on the current (empty) tree", () => {
  const r = runLint();
  assert.equal(
    r.status,
    0,
    `lint exited ${r.status}; stderr:\n${r.stderr}\nstdout:\n${r.stdout}`,
  );
});

test("AC-4: lint emits one `OK <budget-id>: <current>/<limit> <metric>` line per budget", () => {
  const budgets = loadBudgets();
  const r = runLint();
  assert.equal(r.status, 0, `expected green run; got status ${r.status}`);
  for (const id of Object.keys(budgets)) {
    const pattern = new RegExp(`^OK ${id.replace(/-/g, "\\-")}: \\d+/\\d+ (lines|bytes|files)`, "m");
    assert.match(
      r.stdout,
      pattern,
      `lint stdout missing "OK ${id}: <n>/<n> <metric>" line. stdout:\n${r.stdout}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-5 — breach path: env-override forces a BREACH and non-zero exit
// ─────────────────────────────────────────────────────────────────────

test("AC-5: env-override IQME_BUDGET_OVERRIDE_<ID> simulates breach, exit code 1", () => {
  // Override the scoring-irt-lines budget's `current` to 3000 (exceeds 250).
  const r = runLint({ IQME_BUDGET_OVERRIDE_SCORING_IRT_LINES: "3000" });
  assert.equal(
    r.status,
    1,
    `lint should exit 1 on breach; got ${r.status}. stderr:\n${r.stderr}\nstdout:\n${r.stdout}`,
  );
});

test("AC-5: breach run writes `BREACH <budget-id>:` line to stderr", () => {
  const r = runLint({ IQME_BUDGET_OVERRIDE_SCORING_IRT_LINES: "3000" });
  assert.match(
    r.stderr,
    /^BREACH scoring-irt-lines: 3000\/250 lines/m,
    `lint stderr missing BREACH line. stderr:\n${r.stderr}`,
  );
});

test("AC-5: breach output includes the budget's rationale text", () => {
  const budgets = loadBudgets();
  const rationale = budgets["scoring-irt-lines"].rationale;
  const r = runLint({ IQME_BUDGET_OVERRIDE_SCORING_IRT_LINES: "3000" });
  // Rationale may appear on stderr (preferred) or stdout — accept either.
  const combined = `${r.stderr}\n${r.stdout}`;
  assert.ok(
    combined.includes(rationale),
    `breach output missing rationale text "${rationale}". combined output:\n${combined}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-6 — zero runtime deps: stdlib-only imports
// ─────────────────────────────────────────────────────────────────────

test("AC-6: lint script imports ONLY from node: stdlib (NFR33)", () => {
  const source = readFileSync(LINT_PATH, "utf8");
  // Match every `from "<spec>"` and `from '<spec>'` (and dynamic imports).
  const importRegex = /\b(?:from|import\()\s*["']([^"']+)["']/g;
  let m;
  const violations = [];
  while ((m = importRegex.exec(source)) !== null) {
    const spec = m[1];
    if (!spec.startsWith("node:")) {
      violations.push(`disallowed import spec "${spec}"`);
    }
  }
  assert.deepEqual(
    violations,
    [],
    `lint-cognitive-load-budget.mjs must be stdlib-only (NFR33). Found:\n  ${violations.join("\n  ")}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-8 — Makefile wiring: `make lint` runs the budget lint and exits 0
// ─────────────────────────────────────────────────────────────────────

test("AC-8: `make lint` exits 0 on the current tree", () => {
  // Throws on non-zero.
  execFileSync("make", ["lint"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
});

test("AC-8: `make lint` invokes lint-cognitive-load-budget (visible OK line)", () => {
  const out = execFileSync("make", ["lint"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  // At minimum one budget's OK line should appear in make's output.
  assert.match(
    out,
    /^OK \S+: \d+\/\d+ (lines|bytes|files)/m,
    `make lint did not surface lint-cognitive-load-budget's "OK <id>: ..." output.\nGot:\n${out}`,
  );
});
