#!/usr/bin/env node
// tools/lint-no-duration-estimate.mjs
//
// Negative-assertion lint (Story 14.12 / PR-31): forbids assessment-completion
// DURATION ESTIMATES in user-facing + project copy. IQ-ME is a SELF-PACED,
// no-time-limit screener; any "takes about 25 minutes" / "~30min" / "25 minutes
// to complete the test" phrasing re-implies a fixed completion time and is a
// regression toward the anti-credentialization posture the project rejects.
//
// Scan scope: src/content/** (i18n + methodology corpus), README.md,
// docs/launch-readiness/** and the state schema description strings.
//
// ALLOWED vocabulary (exempt): "self-paced", "no time limit", "no time
// pressure". EXCLUDED (legitimate non-user-facing duration language):
//   - release-schedule / launch-ops docs (v1.0.0-*, *monitoring*, *runbook*,
//     *checklist*, *snapshots*) — "1 hour after tag push", smoke-test minutes;
//   - reviewer-outreach drafts/logs/sign-offs (*-outreach-*, *-signoff*) —
//     "estimated 4-8 hours" reviewer time-commitment, not assessment time;
//   - performance / benchmark files (perf/, benchmark/);
//   - methodology retest-timing passages ("test-retest interval",
//     "retest interval") and reader-verification time ("verify in under
//     ten minutes") — these are methodology, not completion-time claims.
//
// Test injection: env IQME_LINT_TARGET=<path> overrides the scan root with a
// single file or directory (used by the scaffold fixture leg).
// Stdlib-only per NFR33/NFR6. No new CI job — runs inside `make lint`.

import { readFileSync, globSync, statSync } from "node:fs";
import { basename, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

// A duration token (minutes/hours) that sits within ~80 chars of an
// assessment word — i.e. an assessment-completion-time claim. The two
// orderings cover "<n> minutes ... test" and "test ... <n> minutes". The
// explicit "about <n> minutes" / "~<n>min" / "takes about <n> min" phrasings
// are caught by the first alternation regardless of the proximity term.
const DURATION = "\\d+\\s*(?:minute|min|hour)s?";
const ASSESS = "test|assessment|session|screener|quiz|exam|complete[ds]?\\b";
const EXPLICIT = `(?:about\\s+${DURATION}|~\\s*${DURATION}|takes\\s+about\\s+${DURATION})`;
const NEAR = `(?:(?:${ASSESS})[^\\n]{0,80}?${DURATION}|${DURATION}[^\\n]{0,80}?(?:${ASSESS}))`;
const FORBIDDEN = new RegExp(`${EXPLICIT}|${NEAR}`, "gi");

// Exempt the allowed self-paced vocabulary, plus methodology retest-timing /
// reader-verification windows that legitimately use minute words.
const ALLOWED = /self[- ]paced|no time (?:limit|pressure)|test[- ]retest|retest[- ]interval|retest\b|verify .{0,40}\bin under|confirm .{0,40}\bin under|under (?:five|ten|\d+) minutes/i;

// File-scope exclusions: release-schedule / launch-ops, reviewer outreach,
// and performance/benchmark files carry legitimate non-assessment duration.
const EXCLUDED_FILE =
  /(?:^|\/)(?:v\d+\.\d+\.\d+|.*(?:monitoring|runbook|checklist|snapshots|post-launch|launch-postscript|outreach|signoff|sign-off|perf|benchmark))/i;

function targets() {
  const override = process.env.IQME_LINT_TARGET;
  if (override) {
    const p = resolve(REPO_ROOT, override);
    if (statSync(p).isDirectory()) return globSync(`${p}/**/*.{md,json}`);
    return [p];
  }
  return [
    ...globSync(`${resolve(REPO_ROOT, "src/content")}/**/*.{md,json}`),
    resolve(REPO_ROOT, "README.md"),
    ...globSync(`${resolve(REPO_ROOT, "docs/launch-readiness")}/**/*.md`),
    resolve(REPO_ROOT, "src/assessment/state.schema.json"),
  ];
}

const files = targets();
const violations = [];
for (const f of files) {
  const rel = relative(REPO_ROOT, f);
  if (EXCLUDED_FILE.test(rel) || EXCLUDED_FILE.test(basename(f))) continue;
  const text = readFileSync(f, "utf8");
  for (const m of text.matchAll(FORBIDDEN)) {
    const window = text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
    if (ALLOWED.test(window)) continue;
    violations.push({ file: rel, snippet: m[0].replace(/\s+/g, " ").trim() });
  }
}

if (violations.length === 0) {
  process.stdout.write(`lint-no-duration-estimate: ok (${files.length} files scanned)\n`);
  process.exit(0);
}
for (const { file, snippet } of violations) {
  process.stderr.write(`BREACH lint-no-duration-estimate: ${file} estimates assessment duration ("${snippet}")\n`);
}
process.exit(1);
