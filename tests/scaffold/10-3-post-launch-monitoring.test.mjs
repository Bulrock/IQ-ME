// Story 10-3 — Acceptance guard for the 48-hour post-launch monitoring
// scaffold and rollback runbook dry-run validation table.
//
// The actual monitoring checkpoints (T+1h, T+6h, T+24h, T+48h) are
// human-gated — no automated test can cover them. These guards cover:
//   - AC1/AC2: v1.0.0-post-launch-monitoring.md exists with required
//     checkpoint structure and zero-analytics notice (AC5)
//   - AC3: v1.0.0-rollback-runbook.md contains the dry-run validation
//     table with sign-off fields (filled in by specialist)
//   - AC4: T+48h closure section present
//   - No-fabrication: monitoring log must not contain fabricated
//     checkpoint timestamps or anomaly descriptions
//
// RED until specialist authors v1.0.0-post-launch-monitoring.md.
// Rollback runbook already exists from Story 10-1.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const MONITORING = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "v1.0.0-post-launch-monitoring.md",
);
const RUNBOOK = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "v1.0.0-rollback-runbook.md",
);

function read(p) {
  assert.ok(existsSync(p), `missing required file: ${p}`);
  return readFileSync(p, "utf8");
}

// Fabricated checkpoint: a real UTC timestamp that looks like it was
// pre-filled (e.g. "T+1h: 2026-06-05T10:00:00Z — all green").
// Allow ISO dates in metadata/header sections but not in the checkpoint
// log rows themselves (they should say [FILL IN AT T+Nh]).
const FABRICATED_CHECKPOINT_RESULT =
  /T\+[1-9]\d*h.*:\s*20\d\d-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\s*[—\-–]\s*(?!FILL)/i;

// AC1: monitoring log exists with checkpoint structure
test("AC1: v1.0.0-post-launch-monitoring.md exists with T+1h/T+6h/T+24h/T+48h checkpoint structure", () => {
  const log = read(MONITORING);
  for (const checkpoint of ["T+1h", "T+6h", "T+24h", "T+48h"]) {
    assert.match(
      log,
      new RegExp(checkpoint.replace("+", "\\+"), "i"),
      `monitoring log must include ${checkpoint} checkpoint`,
    );
  }
});

test("AC1: monitoring log covers all required check types per checkpoint", () => {
  const log = read(MONITORING);
  // Each checkpoint must reference canonical + mirror URL checks
  assert.match(
    log,
    /canonical.*URL|iq-me\.org/i,
    "monitoring log must reference canonical URL check",
  );
  assert.match(
    log,
    /mirror.*URL|iq-me\.pages\.dev/i,
    "monitoring log must reference mirror URL check",
  );
  // Zenodo DOI check
  assert.match(
    log,
    /Zenodo|DOI/i,
    "monitoring log must include Zenodo DOI resolution check",
  );
  // GitHub Discussions check
  assert.match(
    log,
    /GitHub\s+Discussions|Discussions/i,
    "monitoring log must include GitHub Discussions user-report scan",
  );
});

// AC2: timestamp + anomalies fields
test("AC2: monitoring log has timestamp and anomalies fields per checkpoint", () => {
  const log = read(MONITORING);
  assert.match(
    log,
    /timestamp|UTC/i,
    "monitoring log must have timestamp (UTC) field per checkpoint",
  );
  assert.match(
    log,
    /anomal|anomaly|issue|finding/i,
    "monitoring log must have anomalies/findings field per checkpoint",
  );
});

// AC5: zero-analytics notice
test("AC5: monitoring log explicitly documents zero-analytics posture (NFR6)", () => {
  const log = read(MONITORING);
  assert.match(
    log,
    /no\s+sentry|no\s+logrocket|no\s+telemetry|zero[- ]telemetry|NFR6/i,
    "monitoring log must explicitly note zero analytics / no telemetry (NFR6 compliance)",
  );
});

// AC4: T+48h closure section
test("AC4: monitoring log has T+48h closure / steady-state declaration section", () => {
  const log = read(MONITORING);
  assert.match(
    log,
    /steady[- ]state|maintenance\s+posture|48[- ]hour\s+window\s+close/i,
    "monitoring log must have a T+48h closure / steady-state maintenance posture section",
  );
});

// No-fabrication: checkpoint log rows must be placeholders
test("AC1 + lesson-2026-06-04-002: monitoring log checkpoint rows must be placeholders, not pre-filled", () => {
  const log = read(MONITORING);
  assert.ok(
    !FABRICATED_CHECKPOINT_RESULT.test(log),
    "monitoring log must not contain fabricated checkpoint timestamps with results — use [FILL IN AT T+Nh] placeholders",
  );
  // Must contain FILL IN placeholder markers
  assert.match(
    log,
    /FILL\s+IN|fill.*in.*at|pending/i,
    "monitoring log must use placeholder markers for checkpoint entries not yet completed",
  );
});

// AC3: rollback runbook has dry-run validation table with sign-off fields
test("AC3: v1.0.0-rollback-runbook.md contains dry-run validation checklist table", () => {
  const runbook = read(RUNBOOK);
  assert.match(
    runbook,
    /[Dd]ry[- ]run\s+validation|dry.run.*checklist/i,
    "rollback runbook must contain a dry-run validation checklist section",
  );
  assert.match(
    runbook,
    /FILL\s+IN\s+STORY\s+10\.3|Story\s+10\.?3|FILL\s+IN\s+STORY\s+10-3/i,
    "rollback runbook dry-run table must have FILL IN STORY 10.3 sign-off fields",
  );
});

test("AC3: rollback runbook dry-run table covers all 6 validation steps", () => {
  const runbook = read(RUNBOOK);
  // Step 1a: local tag check
  assert.match(
    runbook,
    /git\s+tag\s+-l|local\s+tag\s+check/i,
    "runbook dry-run must include local tag check step",
  );
  // Step 2a: git log check
  assert.match(
    runbook,
    /git\s+log.*oneline|log\s+check/i,
    "runbook dry-run must include git log check step",
  );
  // Step 2b: make build check
  assert.match(
    runbook,
    /make\s+build|build\s+check/i,
    "runbook dry-run must include make build check step",
  );
  // Step 3c: Zenodo access
  assert.match(
    runbook,
    /zenodo\.org|Zenodo\s+access/i,
    "runbook dry-run must include Zenodo access check step",
  );
  // Step 4a: IA access
  assert.match(
    runbook,
    /web\.archive\.org|Internet\s+Archive\s+access/i,
    "runbook dry-run must include Internet Archive access check step",
  );
});
