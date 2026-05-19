#!/usr/bin/env node
// tools/lint-cognitive-load-budget.mjs
//
// John gap #3 / NFR32-NFR35 enforcement. Reads BUDGETS.json at repo root,
// computes each entry's current value via filesystem walk, compares against
// the entry's limit, and fails (exit 1) if any budget is exceeded.
//
// Stdlib-only per NFR33 — no external imports. Resolves REPO_ROOT relative
// to this script's own location (import.meta.url) so the tool works from any
// cwd.
//
// Override-injection (for tests / breach simulation):
//   IQME_BUDGET_OVERRIDE_<BUDGET_ID_UPPER_SNAKE>=<integer>
//   replaces the computed `current` for that budget. Example:
//     IQME_BUDGET_OVERRIDE_SCORING_IRT_LINES=3000

import { readFileSync, statSync } from "node:fs";
import { globSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const BUDGETS_PATH = resolve(REPO_ROOT, "BUDGETS.json");

function loadBudgets() {
  let raw;
  try {
    raw = readFileSync(BUDGETS_PATH, "utf8");
  } catch (err) {
    process.stderr.write(`lint-cognitive-load-budget: cannot read ${BUDGETS_PATH}: ${err.message}\n`);
    process.exit(2);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`lint-cognitive-load-budget: ${BUDGETS_PATH} is not valid JSON: ${err.message}\n`);
    process.exit(2);
  }
}

function envOverrideFor(budgetId) {
  const key = "IQME_BUDGET_OVERRIDE_" + budgetId.replace(/-/g, "_").toUpperCase();
  const raw = process.env[key];
  if (raw === undefined) return null;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) {
    process.stderr.write(`lint-cognitive-load-budget: env ${key}="${raw}" is not a non-negative integer; ignoring\n`);
    return null;
  }
  return n;
}

function listFiles(domainGlob) {
  // node:fs globSync resolves patterns relative to its cwd option.
  // We want REPO_ROOT-relative results regardless of where the script is invoked.
  const matches = globSync(domainGlob, { cwd: REPO_ROOT });
  return matches.map((p) => resolve(REPO_ROOT, p));
}

function countLines(filePath) {
  const text = readFileSync(filePath, "utf8");
  let count = 0;
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.length === 0) continue;
    if (t.startsWith("//")) continue;
    count += 1;
  }
  return count;
}

function computeCurrent(entry) {
  let files = listFiles(entry.domain);
  if (Array.isArray(entry.exclude) && entry.exclude.length > 0) {
    const excludeSet = new Set(entry.exclude.map((p) => resolve(REPO_ROOT, p)));
    files = files.filter((f) => !excludeSet.has(f));
  }
  if (entry.metric === "files") {
    return files.length;
  }
  if (entry.metric === "bytes") {
    let total = 0;
    for (const f of files) {
      total += statSync(f).size;
    }
    return total;
  }
  if (entry.metric === "lines") {
    let total = 0;
    for (const f of files) {
      total += countLines(f);
    }
    return total;
  }
  process.stderr.write(`lint-cognitive-load-budget: unknown metric "${entry.metric}"\n`);
  process.exit(2);
  return 0;
}

function main() {
  const budgets = loadBudgets();
  const breaches = [];

  for (const [id, entry] of Object.entries(budgets)) {
    const override = envOverrideFor(id);
    const current = override !== null ? override : computeCurrent(entry);
    if (current > entry.limit) {
      breaches.push({ id, entry, current });
    } else {
      process.stdout.write(`OK ${id}: ${current}/${entry.limit} ${entry.metric}\n`);
    }
  }

  if (breaches.length === 0) {
    process.exit(0);
  }

  for (const b of breaches) {
    process.stderr.write(`BREACH ${b.id}: ${b.current}/${b.entry.limit} ${b.entry.metric}\n`);
    process.stderr.write(`  rationale: ${b.entry.rationale}\n`);
  }
  process.exit(1);
}

main();
