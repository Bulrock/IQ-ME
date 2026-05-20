#!/usr/bin/env node
// tools/lint-spec-carry-forward.mjs — bridge-6-7-3 Phase A.
//
// Walks story-spec markdown files and validates each one carries a
// non-empty `### Carry-forward lessons` section. Per lesson-2026-05-20-007,
// the section is the load-bearing delivery mechanism for prior-story lessons;
// authors forgot to include it in 5-2..5-7, which directly caused the
// integrity-record ceremony to be skipped (lesson-2026-05-19-001 fired 3×).
//
// Acceptance:
//   - section heading present (case-sensitive `### Carry-forward lessons`).
//   - section is non-empty (at least one non-blank line OR an explicit
//     "no relevant lessons" sentinel — never silent omission).
//
// Exit 0 with a single summary line on full pass.
// Exit 1 with one `lint-spec-carry-forward: <path>: <reason>` line per
// violation.
//
// Optional flags:
//   --paths=<dir>  override the stories root
//                  (default: _bmad-output/implementation-artifacts/stories)
//   --ignore-old   skip pre-existing legacy specs that already shipped
//                  without the section. Identified via the
//                  `LEGACY_EXEMPT` allow-list below (kept tight on purpose
//                  — every entry is technical debt).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { argv, cwd, stdout, stderr, exit } from "node:process";

const CWD = cwd();

const args = argv.slice(2);
let pathsArg = null;
let ignoreOld = false;
for (const a of args) {
  if (a.startsWith("--paths=")) pathsArg = a.slice("--paths=".length);
  if (a === "--ignore-old") ignoreOld = true;
}
const ROOT = resolve(
  CWD,
  pathsArg ?? "_bmad-output/implementation-artifacts/stories",
);

// Pre-existing specs that already shipped without the section. Allow-list
// keeps the lint useful (every NEW spec must have the section) without
// blocking on retroactive backfill. Trim as specs are remediated.
const LEGACY_EXEMPT = new Set([
  // Epic-1..3 + parts of 4..5 predate the convention; bridge-6-7-3 is the
  // restoration story itself, exempt by definition.
  "1-1-bootstrap-repo-skeleton-makefile.md",
  "1-2-author-licenses-md-citation-cff-readme-forking-ethics-slim-contributing-md-codeowners.md",
  "1-3-commit-icar-confirmation-pdf-slot-with-visible-fallback-copy.md",
  "1-4-commit-corpus-schema-set-docs-corpus-build-conventions-md.md",
  "1-5-commit-budgets-json-lint-cognitive-load-budget-mjs.md",
  "1-6-author-ci-matrix-yaml-with-full-future-lint-stub-jobs.md",
  "1-7-implement-playwright-network-trace-infrastructure-with-strict-zero-third-party-assertion-from-day-1.md",
  "1-8-ship-deterministic-build-harness-ready-for-epic-2-s-golden-vectors.md",
  "1-9-eslint-config-no-restricted-paths-docs-domain-map-md.md",
  "1-10-design-system-foundation-primitives-css-semantic-css-dark-mode-overrides-tokens-spec-ts.md",
  "bridge-1-2-1-add-tds-story-unfreeze.md",
  "2-1-scaffold-src-scoring-irt-module-write-red-phase-parity-test.md",
  "2-2-implement-quadrature-js-likelihood-js-pure-math-primitives.md",
  "2-3-implement-eap-js-eap-estimation.md",
  "2-4-implement-se-js-standard-error-from-posterior-variance.md",
  "2-5-public-api-in-src-scoring-irt-index-js-scoresession-facade.md",
  "2-6a-r-in-ci-harness-smoke-golden-vector-set-n-10.md",
  "2-6b-full-1-000-pattern-golden-vector-set-ci-parity-wiring.md",
  "2-7-populate-methodology_claims-json-activate-lint-claims-manifest.md",
  "3-1-author-the-three-contract-adrs-state-shape-reveal-stage-event-methodology-handoff-url.md",
  "3-2-implement-state-js-contract-test.md",
  "3-3-implement-landing-consent-scene-en.md",
  "3-4-implement-item-runner-progress-indicator-16-item-session-with-fr7-seed.md",
  "3-5-implement-reveal-stage-event-score-panel-css-source-co-equal-triplet-lint.md",
  "3-6-author-3-en-methodology-stub-pages-the-click-targets.md",
  "3-7-exercise-the-strict-network-trace-assertion-against-the-full-live-slice.md",
  "3-8-aha-click-hallway-test-3-5-outside-team-comprehension-recording.md",
  // Epic-4 partially adopted; some specs do carry the section. Exempt the
  // ones that don't pending backfill or supersession.
  "bridge-4-5-1-tds-integrity-remove-cli.md",
  "bridge-4-5-2-convention-doc-for-filesystem.md",
  "bridge-5-6-1-extend-sweep-auto-record.md",
  // Epic-5 specs 5-2..5-7 — exact regression cohort the bridge addresses.
  // Keep exempt: those specs are already shipped/in-flight; the fix is to
  // enforce the section going forward, not to rewrite history.
  "5-2-anchor-pages-7-fr36-protection-lint-content-freeze-typographic-system-checkpoint.md",
  "5-3-result-page-validity-envelope-tail-aware-trail-prerequisite-checkpoint.md",
  "5-3-constructs-4-remaining-limitations-3-remaining.md",
  "5-4-scoring-4-remaining-norming-3.md",
  "5-5-ethics-2-remaining-provenance-2-remaining-reference-3-remaining.md",
  "5-6-claims-2-remaining-trust-3-remaining-coverage-graduation.md",
  "5-6-tail-scenes-en-placeholders-reviewer-of-record-tbd.md",
  "5-7-phase-2-components-eap-shrinkage-diagram-tail-aware-trail-ship-if-budget-allows.md",
  "epic-5-retrospective.md",
  // Bridge-6-7 family — siblings of this story, already in flight.
  "bridge-6-7-1-extend-state-commit-sweep.md",
  "bridge-6-7-2-tds-deliver-mode-2.md",
  "bridge-6-7-3-restore-carry-forward-lessons.md",
]);

const CARRY_FORWARD_HEADING_RE = /^### Carry-forward lessons\b/m;
// Heading-line index, plus next H2/H3 (any "## " or "### ") as section end.
function findSectionRange(lines) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^### Carry-forward lessons\b/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^(#{2,3}) /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function sectionHasContent(lines, range) {
  // Any non-blank line BETWEEN start+1 and end counts.
  for (let i = range.start + 1; i < range.end; i++) {
    if (lines[i].trim().length > 0) return true;
  }
  return false;
}

function listMarkdownFiles(rootDir) {
  let entries;
  try {
    entries = readdirSync(rootDir);
  } catch (err) {
    return [];
  }
  const out = [];
  for (const name of entries) {
    const full = join(rootDir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isFile() && name.endsWith(".md")) out.push(full);
  }
  return out;
}

const files = listMarkdownFiles(ROOT);
const violations = [];
let exempted = 0;
let checked = 0;

for (const path of files) {
  const basename = path.split("/").pop() ?? path;
  if (ignoreOld && LEGACY_EXEMPT.has(basename)) {
    exempted++;
    continue;
  }
  checked++;
  const body = readFileSync(path, "utf8");
  const lines = body.split("\n");
  const range = findSectionRange(lines);
  if (range === null) {
    if (LEGACY_EXEMPT.has(basename)) {
      // Even without --ignore-old, exempt legacy entries automatically
      // (allow-list captures known pre-convention specs).
      exempted++;
      continue;
    }
    violations.push(
      `${relative(CWD, path)}: missing '### Carry-forward lessons' heading (per lesson-2026-05-20-007 every new story spec must carry the section)`,
    );
    continue;
  }
  if (!sectionHasContent(lines, range)) {
    violations.push(
      `${relative(CWD, path)}: '### Carry-forward lessons' section is empty — populate from 'tds memory query --story=<id>' or insert explicit zero-hits sentinel`,
    );
  }
}

if (violations.length === 0) {
  stdout.write(
    `lint-spec-carry-forward: ${checked} spec(s) OK, ${exempted} legacy-exempt.\n`,
  );
  exit(0);
}

for (const v of violations) {
  stderr.write(`lint-spec-carry-forward: ${v}\n`);
}
exit(1);
