// Story 14.12 — Guard for the assessment-duration copy cleanup (PR-31).
//
// The duration-estimate removal landed in commit 00ea3ea (27 files). This guard
// (a) asserts ZERO remaining assessment-completion duration estimates in shipped
// + project copy via the same regex family the AC enumerates, (b) asserts the
// permanent guard lint exists, is stdlib-only, is wired into the Makefile `lint`
// target, and is registered in negative-assertion-lints.test.mjs, (c) asserts the
// lint exits 0 on the current tree and non-zero on an injected fixture (via a
// temp IQME_LINT_TARGET), and (d) asserts the allowed self-paced vocabulary is
// present in all three locales.
//
// Run: `node --test tests/scaffold/14-12-duration-copy-guard.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, globSync, rmSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { tmpdir } from "node:os";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const LINT = "tools/lint-no-duration-estimate.mjs";
const GUARD_FIXTURE_TEXT = "the test takes 20 minutes";

// Same exclusions the lint encodes — release-schedule / launch-ops, reviewer
// outreach, and performance/benchmark files carry legitimate non-assessment
// duration language and are out of scope for the user-facing-copy assertion.
const EXCLUDED_FILE =
  /(?:^|\/)(?:v\d+\.\d+\.\d+|.*(?:monitoring|runbook|checklist|snapshots|post-launch|launch-postscript|outreach|signoff|sign-off|perf|benchmark))/i;

// The allowed methodology / verification windows (retest timing, "under N minutes"
// reader-verification) are not assessment-completion claims.
const ALLOWED =
  /self[- ]paced|no time (?:limit|pressure)|test[- ]retest|retest[- ]interval|retest\b|verify .{0,40}\bin under|confirm .{0,40}\bin under|under (?:five|ten|\d+) minutes/i;

// Duration token near an assessment word, OR an explicit estimate phrasing.
const DURATION = "\\d+\\s*(?:minute|min|hour)s?";
const ASSESS = "test|assessment|session|screener|quiz|exam|complete[ds]?\\b";
const EXPLICIT = `(?:about\\s+${DURATION}|~\\s*${DURATION}|takes\\s+about\\s+${DURATION})`;
const NEAR = `(?:(?:${ASSESS})[^\\n]{0,80}?${DURATION}|${DURATION}[^\\n]{0,80}?(?:${ASSESS}))`;
const DURATION_RE = new RegExp(`${EXPLICIT}|${NEAR}`, "gi");

function copyFiles() {
  return [
    ...globSync(`${join(REPO_ROOT, "src/content")}/**/*.{md,json}`),
    join(REPO_ROOT, "README.md"),
    ...globSync(`${join(REPO_ROOT, "docs/launch-readiness")}/**/*.md`),
    join(REPO_ROOT, "src/assessment/state.schema.json"),
  ];
}

function runLint(env = {}) {
  return spawnSync("node", [join(REPO_ROOT, LINT)], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

// ── (a) zero remaining duration-estimate matches in shipped + project copy ──
test("AC1: no assessment-completion duration estimate survives in shipped/project copy", () => {
  const offenders = [];
  for (const f of copyFiles()) {
    const rel = relative(REPO_ROOT, f);
    if (EXCLUDED_FILE.test(rel) || EXCLUDED_FILE.test(basename(f))) continue;
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(DURATION_RE)) {
      const window = text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
      if (ALLOWED.test(window)) continue;
      offenders.push(`${rel}: "${m[0].replace(/\s+/g, " ").trim()}"`);
    }
  }
  assert.deepEqual(offenders, [], `duration-estimate leftover(s):\n${offenders.join("\n")}`);
});

// ── (b) the permanent guard lint exists + stdlib-only + wired + registered ──
test("AC3: lint-no-duration-estimate.mjs exists and is stdlib-only (NFR33)", () => {
  const p = join(REPO_ROOT, LINT);
  assert.ok(existsSync(p), `${LINT} missing`);
  const src = readFileSync(p, "utf8");
  const importRe = /\b(?:from|import\()\s*["']([^"']+)["']/g;
  let m;
  const thirdParty = [];
  while ((m = importRe.exec(src)) !== null) {
    if (!m[1].startsWith("node:")) thirdParty.push(m[1]);
  }
  assert.deepEqual(thirdParty, [], `${LINT} must import only node: stdlib. Found: ${thirdParty.join(", ")}`);
});

test("AC3: lint is wired into the Makefile `lint` target", () => {
  const makefile = readFileSync(join(REPO_ROOT, "Makefile"), "utf8");
  assert.match(
    makefile,
    /^\s*node tools\/lint-no-duration-estimate\.mjs\s*$/m,
    "Makefile `lint` target must run `node tools/lint-no-duration-estimate.mjs`",
  );
});

test("AC3: lint is registered in negative-assertion-lints.test.mjs", () => {
  const registry = readFileSync(join(REPO_ROOT, "tests/scaffold/negative-assertion-lints.test.mjs"), "utf8");
  assert.match(registry, /tools\/lint-no-duration-estimate\.mjs/, "registry test must list the new lint script");
  assert.match(
    registry,
    /lint-negative-assertions\/no-duration-estimate/,
    "registry test must point at the no-duration-estimate fixture dir",
  );
});

// ── (c) exits 0 clean, non-zero on an injected fixture ──
test("AC3: lint exits 0 on the current tree", () => {
  const r = runLint();
  assert.equal(r.status, 0, `lint exited ${r.status} on the current tree. stderr:\n${r.stderr}\nstdout:\n${r.stdout}`);
});

test("AC3: lint exits non-zero on an injected duration-estimate fixture", () => {
  const dir = mkdtempSync(join(tmpdir(), "iqme-dur-"));
  try {
    writeFileSync(join(dir, "leak.md"), `${GUARD_FIXTURE_TEXT}\n`);
    const r = runLint({ IQME_LINT_TARGET: dir });
    assert.notEqual(r.status, 0, `lint should fail on "${GUARD_FIXTURE_TEXT}". stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    assert.match(r.stderr, /BREACH/i, `lint should emit BREACH. stderr:\n${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("AC4: the allowed self-paced vocabulary survives the injected fixture exemption", () => {
  const dir = mkdtempSync(join(tmpdir(), "iqme-dur-ok-"));
  try {
    writeFileSync(
      join(dir, "ok.md"),
      "This is a self-paced screener with no time limit and no time pressure.\n",
    );
    const r = runLint({ IQME_LINT_TARGET: dir });
    assert.equal(r.status, 0, `allowed self-paced vocabulary must not trip the lint. stderr:\n${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── (d) allowed self-paced vocabulary present in EN/PL/RU strings ──
test("AC2: allowed self-paced / no-time vocabulary is present in all three locales", () => {
  const locales = {
    en: /self[- ]paced/i,
    pl: /we własnym tempie|bez presji czasu/i,
    ru: /в собственном темпе|без ограничения по времени/i,
  };
  // Non-global clone: assert.doesNotMatch uses .test(), which mutates lastIndex
  // on a /g regex and would make repeated calls order-dependent.
  const durationNonGlobal = new RegExp(DURATION_RE.source, "i");
  for (const [loc, re] of Object.entries(locales)) {
    const strings = readFileSync(join(REPO_ROOT, "src/content/i18n", loc, "strings.json"), "utf8");
    assert.match(strings, re, `${loc}/strings.json must carry the allowed self-paced/no-time-limit phrasing`);
    assert.doesNotMatch(
      strings,
      durationNonGlobal,
      `${loc}/strings.json must not estimate assessment-completion time`,
    );
  }
});
