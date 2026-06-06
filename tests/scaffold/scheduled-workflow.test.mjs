// Story 8.3 — Acceptance tests for the ACTIVATED .github/workflows/scheduled.yml.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one AC (or AC-group) in spec
// _bmad-output/implementation-artifacts/stories/8-3-scheduled-yml-workflow-mirror-parity-archival-health-failure-routing.md.
//
// Run: `node --test tests/scaffold/scheduled-workflow.test.mjs`
//
// RED PHASE: scheduled.yml is still the Epic-1 stub (daily `0 6 * * *` cron,
// a single `scheduled-check` job whose only step is `echo "Activates in
// Epic 8"`) and `docs/scheduled-yml-failure-routing.md` does NOT exist yet.
// These assertions describe the *activated* three-job contract + the finalized
// doc that do NOT yet exist, so they FAIL until Story 8.3 implements them.
//
// Structural-only checks — no YAML parser dep (NFR33). We treat the workflow
// file as text and assert presence/proximity of expected lines, slicing job
// bodies by findIndex + a fixed window (same approach as
// release-workflow.test.mjs / release-archival.test.mjs / ci-matrix.test.mjs
// AC-2/AC-3). Regexes tolerate optional quotes/whitespace.
//
// ANCHORING DISCIPLINE (lesson-2026-06-04-002 + the 8.1/8.2 false-pass trap):
// the Epic-1 stub's header comment already contains the bare words "mirror
// parity", "Zenodo DOI", "Internet Archive", "archival-health", "mirror-
// divergence" — so bare-word regexes would FALSE-PASS against the un-activated
// stub. We therefore anchor every presence assertion to a REAL signature: the
// hyphenated job ids, the `area:` label vocabulary, the endpoint hosts
// (web.archive.org, archive.softwareheritage.org, doi.org / api.zenodo.org),
// the canonical host (iq-me.org), and the exact skip-notice string — never the
// stub's prose comments.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const SCHEDULED = join(REPO_ROOT, ".github", "workflows", "scheduled.yml");
const FAILURE_ROUTING_DOC = join(
  REPO_ROOT,
  "docs",
  "scheduled-yml-failure-routing.md",
);

// The three health-check jobs the activated workflow must declare (AC-1).
const CHECK_JOBS = [
  "internet-archive-snapshot-health",
  "software-heritage-snapshot-health",
  "zenodo-doi-resolution",
];

function loadScheduled() {
  assert.ok(existsSync(SCHEDULED), `scheduled.yml missing at ${SCHEDULED}`);
  return readFileSync(SCHEDULED, "utf8");
}

// Slice a job body: find the `  <job>:` declaration line and return from there
// to the next top-level `  <job>:` declaration (or EOF). The check jobs each
// carry multiple steps (HEAD probe, gate, failure-route), so a slice-to-
// next-job is more robust than a fixed window. Mirrors the
// release-archival.test.mjs corpusReleaseBody() slicer.
function jobBody(text, job) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) =>
    new RegExp(`^  ${job.replace(/-/g, "\\-")}:\\s*$`).test(l),
  );
  if (start === -1) return { idx: -1, body: "" };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    // Next top-level job declaration (2-space indent, bare `key:`).
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { idx: start, body: lines.slice(start, end).join("\n") };
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: weekly cron + three health-check jobs, each carrying an `area:` label
// ─────────────────────────────────────────────────────────────────────

test("AC-1: scheduled.yml triggers on a weekly schedule cron and the stub `scheduled-check` job is gone", () => {
  const text = loadScheduled();

  // on: schedule: block exists at top level.
  assert.match(
    text,
    /^on:\s*\n(?:[ \t]+[^\n]*\n)*?[ \t]+schedule:/m,
    `scheduled.yml must declare on: schedule: at top level. Got:\n${text.slice(0, 400)}`,
  );

  // A cron entry is present.
  assert.match(
    text,
    /cron:\s*['"]?[\d*/, -]+['"]?/,
    `scheduled.yml must declare a schedule cron entry. Got:\n${text}`,
  );

  // WEEKLY cadence: the 5th cron field (day-of-week) is a single weekday digit
  // (e.g. "0 6 * * 1" — Monday), NOT the stub's daily "0 6 * * *". Assert the
  // day-of-week field is a concrete digit (the daily stub has "*" there).
  assert.match(
    text,
    /cron:\s*['"]?\s*\S+\s+\S+\s+\S+\s+\S+\s+[0-7]\b/,
    `scheduled.yml must run WEEKLY — the cron day-of-week field must be a concrete weekday (e.g. "0 6 * * 1"), not the Epic-1 stub's daily "0 6 * * *". Got:\n${text}`,
  );

  // The Epic-1 stub single `scheduled-check:` job must be gone (the activated
  // three-job structure replaces it).
  assert.doesNotMatch(
    text,
    /^  scheduled-check:\s*$/m,
    `scheduled.yml must no longer declare the Epic-1 stub "  scheduled-check:" job (graduated to the three health-check jobs).`,
  );
});

test("AC-1: scheduled.yml declares all three health-check jobs at the jobs: top level", () => {
  const text = loadScheduled();
  for (const job of CHECK_JOBS) {
    const { idx } = jobBody(text, job);
    assert.notEqual(
      idx,
      -1,
      `scheduled.yml must declare the "  ${job}:" job at the jobs: top level (2-space indent).`,
    );
  }
});

test("AC-1: each health-check job carries a grep-able per-job `area:<check>` label reference", () => {
  const text = loadScheduled();
  // Each check job's body must reference its per-check `area:` label so the
  // routed Issue label is grep-able in the workflow text (AC-1 + AC-4).
  // IA/SH -> area:archive-health ; zenodo -> area:doi-health.
  const expected = {
    "internet-archive-snapshot-health": /area:archive-health/,
    "software-heritage-snapshot-health": /area:archive-health/,
    "zenodo-doi-resolution": /area:doi-health/,
  };
  for (const [job, labelPattern] of Object.entries(expected)) {
    const { idx, body } = jobBody(text, job);
    assert.notEqual(idx, -1, `job "${job}" declaration not found.`);
    assert.match(
      body,
      labelPattern,
      `job "${job}" must carry a grep-able per-job ${labelPattern} label reference (the label the routed Issue will also carry, AC-1). Body:\n${body}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: jobs name the REAL endpoints + read the REAL record files
// (anchored to endpoint hosts / record-file paths, NOT the stub prose)
// ─────────────────────────────────────────────────────────────────────

test("AC-2: internet-archive-snapshot-health HEAD-probes web.archive.org and reads the IA record file", () => {
  const text = loadScheduled();
  const { idx, body } = jobBody(text, "internet-archive-snapshot-health");
  assert.notEqual(
    idx,
    -1,
    `internet-archive-snapshot-health job declaration not found.`,
  );
  // Anchor to the IA endpoint host (NOT the bare "Internet Archive" prose).
  assert.match(
    body,
    /web\.archive\.org/i,
    `internet-archive-snapshot-health must name the Internet Archive endpoint host web.archive.org (the recorded snapshot URLs it HEAD-probes). Body:\n${body}`,
  );
  // Reads the Story-8.2 record file rather than embedding URLs (URLs are
  // PENDING in dev — lesson-2026-06-04-002).
  assert.match(
    body,
    /docs\/launch-readiness\/internet-archive-snapshots\.md/,
    `internet-archive-snapshot-health must READ the recorded URLs from docs/launch-readiness/internet-archive-snapshots.md (not embed fabricated URLs — they are PENDING in dev). Body:\n${body}`,
  );
});

test("AC-2: software-heritage-snapshot-health HEAD-probes archive.softwareheritage.org and reads the SH record file", () => {
  const text = loadScheduled();
  const { idx, body } = jobBody(text, "software-heritage-snapshot-health");
  assert.notEqual(
    idx,
    -1,
    `software-heritage-snapshot-health job declaration not found.`,
  );
  // Anchor to the SH endpoint host (NOT the bare "Software Heritage" prose).
  assert.match(
    body,
    /archive\.softwareheritage\.org|softwareheritage\.org\/api/i,
    `software-heritage-snapshot-health must name the Software Heritage endpoint host archive.softwareheritage.org (the recorded save/archived-origin URLs it HEAD-probes). Body:\n${body}`,
  );
  // Reads the Story-8.2 record file rather than embedding URLs.
  assert.match(
    body,
    /docs\/launch-readiness\/software-heritage-snapshots\.md/,
    `software-heritage-snapshot-health must READ the recorded URLs from docs/launch-readiness/software-heritage-snapshots.md (not embed fabricated URLs — they are PENDING in dev). Body:\n${body}`,
  );
});

test("AC-2: zenodo-doi-resolution reads the DOI from the canonical CITATION.cff sink and resolves it (doi.org / api.zenodo.org)", () => {
  const text = loadScheduled();
  const { idx, body } = jobBody(text, "zenodo-doi-resolution");
  assert.notEqual(idx, -1, `zenodo-doi-resolution job declaration not found.`);
  // Reads the DOI from the canonical sink (CITATION.cff), per Story 8.2.
  assert.match(
    body,
    /CITATION\.cff/,
    `zenodo-doi-resolution must read the DOI from the canonical sink CITATION.cff (doi: field — empty in dev, populated at the first corpus-v* release). Body:\n${body}`,
  );
  // Resolution target host (NOT the bare "Zenodo DOI" prose): the DOI resolver
  // (doi.org) or the Zenodo API host.
  assert.match(
    body,
    /doi\.org|api\.zenodo\.org/i,
    `zenodo-doi-resolution must resolve the DOI against doi.org / api.zenodo.org (a real Zenodo record), not merely mention "Zenodo DOI" in prose. Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-4: failure routing → labeled GitHub Issue, open-or-append dedup
// ─────────────────────────────────────────────────────────────────────

test("AC-4: a failure handler opens a GitHub Issue labeled area:scheduled-check + a per-check label", () => {
  const text = loadScheduled();

  // The failure-routing path exists somewhere in the workflow (a dedicated
  // routing job that needs: the checks, OR a per-job if: failure() step —
  // engineer's call). Anchor to the failure() condition.
  assert.match(
    text,
    /if:\s*\$\{\{\s*failure\(\)|if:\s*failure\(\)|needs:/i,
    `scheduled.yml must wire a failure handler — an if: failure() step or a routing job that needs: the check jobs (AC-4). Got:\n${text}`,
  );

  // It creates a GitHub Issue via gh CLI or actions/github-script (the
  // labeled-Issue routing replacing Slack/PagerDuty, NFR8/NFR35).
  assert.match(
    text,
    /gh\s+issue\s+create|actions\/github-script|github\.rest\.issues|issues\.create/i,
    `scheduled.yml failure routing must create a GitHub Issue (gh issue create / actions/github-script) — the labeled-Issue routing replacing Slack/PagerDuty (AC-4). Got:\n${text}`,
  );

  // The always-on label is area:scheduled-check.
  assert.match(
    text,
    /area:scheduled-check/,
    `scheduled.yml failure routing must label the Issue with the always-on "area:scheduled-check" label (AC-4). Got:\n${text}`,
  );

  // PLUS at least one per-check specific label.
  assert.match(
    text,
    /area:mirror-health|area:archive-health|area:doi-health/,
    `scheduled.yml failure routing must add a per-check specific label (area:mirror-health / area:archive-health / area:doi-health) alongside area:scheduled-check (AC-4). Got:\n${text}`,
  );
});

test("AC-4: the failure-routing Issue body carries the broken URL + the action-run link", () => {
  const text = loadScheduled();
  // The action-run permalink mandated by AC-4:
  // $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID.
  assert.match(
    text,
    /GITHUB_RUN_ID|github\.run_id/i,
    `scheduled.yml failure-routing Issue body must link to the action run (e.g. $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID) (AC-4). Got:\n${text}`,
  );
  assert.match(
    text,
    /actions\/runs/i,
    `scheduled.yml failure-routing must build the actions/runs/<id> permalink in the Issue body (AC-4). Got:\n${text}`,
  );
});

test("AC-4: failure routing dedups — appends a comment if an Issue with the same labels is already open (open-or-append)", () => {
  const text = loadScheduled();
  // Dedup: search for an already-open same-labeled Issue and append a comment
  // rather than duplicating. Anchor to a list/search + a comment signature.
  assert.match(
    text,
    /gh\s+issue\s+list|--state\s+open|issues\.listForRepo|search.*label|already\s+open/i,
    `scheduled.yml failure routing must look up an already-open same-labeled Issue (gh issue list --state open / issues.listForRepo) before opening a duplicate (dedup, AC-4). Got:\n${text}`,
  );
  assert.match(
    text,
    /gh\s+issue\s+comment|issues\.createComment|createComment|add(?:ing)?\s+a?\s*comment|append.*comment/i,
    `scheduled.yml failure routing must APPEND a comment to the existing Issue when one is already open (open-or-append dedup, AC-4). Got:\n${text}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-4 (dev-inert): the live gh / probe path is gated behind a launch var
// ─────────────────────────────────────────────────────────────────────

test("AC-2/AC-4 dev-inert: live probes + the gh API call are gated behind a vars.* launch gate (no secrets.* in step if:)", () => {
  const text = loadScheduled();
  // Same posture as Story 8.2: every live touch sits behind a repo var gate
  // (vars.IQME_LIVE_ARCHIVAL or a parallel vars.IQME_LIVE_PROBES). Assert a
  // vars.* gate is present on a live step's if:.
  assert.match(
    text,
    /if:\s*[^\n]*vars\.IQME_LIVE/i,
    `scheduled.yml live probes / gh API call must be gated behind a vars.IQME_LIVE_* repo var on the step if: (dev-inert, same as Story 8.2's vars.IQME_LIVE_ARCHIVAL). Got:\n${text}`,
  );
  // secrets.* is NOT a valid step-level if: context (actionlint error Story 8.2
  // hit) — the gate must be vars.*, never secrets.* in a step if:.
  assert.doesNotMatch(
    text,
    /if:\s*[^\n]*secrets\./i,
    `scheduled.yml must NOT gate a step if: on secrets.* (invalid actionlint context — Story 8.2 hit this); gate on vars.* instead. Got:\n${text}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-5: docs/scheduled-yml-failure-routing.md finalized (NEW)
// ─────────────────────────────────────────────────────────────────────

test("AC-5: docs/scheduled-yml-failure-routing.md exists", () => {
  assert.ok(
    existsSync(FAILURE_ROUTING_DOC),
    `docs/scheduled-yml-failure-routing.md missing at ${FAILURE_ROUTING_DOC} — Story 8.3 creates/finalizes it (no Epic-1 stub on disk).`,
  );
});

test("AC-5: the doc documents the weekly cadence, the per-check labels, and the triage discipline", () => {
  assert.ok(
    existsSync(FAILURE_ROUTING_DOC),
    `docs/scheduled-yml-failure-routing.md missing at ${FAILURE_ROUTING_DOC}.`,
  );
  const doc = readFileSync(FAILURE_ROUTING_DOC, "utf8");

  // Weekly cadence.
  assert.match(
    doc,
    /weekly/i,
    `the doc must document the weekly cadence (AC-5). Got:\n${doc.slice(0, 600)}`,
  );

  // The always-on label + at least one per-check specific label.
  assert.match(
    doc,
    /area:scheduled-check/,
    `the doc must document the always-on area:scheduled-check label (AC-5). Got:\n${doc.slice(0, 800)}`,
  );
  assert.match(
    doc,
    /area:mirror-health|area:archive-health|area:doi-health/,
    `the doc must document the per-check labels (area:mirror-health / area:archive-health / area:doi-health) (AC-5). Got:\n${doc.slice(0, 800)}`,
  );

  // Triage discipline — weekly maintainer triage, no email/Slack notification
  // (NFR6/NFR8/NFR35).
  assert.match(
    doc,
    /triage/i,
    `the doc must document the weekly-triage discipline (AC-5). Got:\n${doc}`,
  );
  assert.match(
    doc,
    /no\s+(email|slack)|email.*slack|notification/i,
    `the doc must document the "no email/Slack notification" posture (NFR6/NFR8/NFR35) (AC-5). Got:\n${doc}`,
  );
});

test("AC-5: the doc names a per-check mitigation playbook (re-snapshot / re-save / re-deploy / check Zenodo record)", () => {
  assert.ok(
    existsSync(FAILURE_ROUTING_DOC),
    `docs/scheduled-yml-failure-routing.md missing at ${FAILURE_ROUTING_DOC}.`,
  );
  const doc = readFileSync(FAILURE_ROUTING_DOC, "utf8");
  // Per-check mitigation: at least the re-snapshot (IA 404) + re-save (SH
  // missing) + a mirror/DOI response are documented.
  assert.match(
    doc,
    /re-?snapshot|re-?save|re-?deploy|failover|check.*zenodo/i,
    `the doc must document per-check mitigation playbooks (IA 404 → re-snapshot; SH → re-save; mirror → re-deploy/failover; DOI → check Zenodo record) (AC-5). Got:\n${doc}`,
  );
});
