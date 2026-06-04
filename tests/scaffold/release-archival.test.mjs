// Story 8.2 — Acceptance tests for the corpus-release ARCHIVAL extension:
// Zenodo DOI minting + Internet Archive Save-Page-Now + Software Heritage save.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one AC (or AC-group) in spec
// _bmad-output/implementation-artifacts/stories/8-2-zenodo-doi-minting-internet-archive-software-heritage-on-corpus-v.md.
//
// Run: `node --test tests/scaffold/release-archival.test.mjs`
//
// RED PHASE: .github/workflows/release.yml currently ends the corpus-release
// job at a `# --- Deferred to Story 8.2 … ---` marker with NO archival steps,
// and the docs/launch-readiness/{internet-archive,software-heritage}-snapshots.md
// record files do not yet exist. These assertions describe the *extended*
// corpus-release contract + the record files, so they FAIL until Story 8.2
// implements them.
//
// Structural-only checks — no YAML parser dep (NFR33). We treat the workflow
// file as text and assert presence/proximity of expected lines, slicing the
// corpus-release job body by findIndex + a fixed window (same approach as
// release-workflow.test.mjs / ci-matrix.test.mjs). Regexes tolerate optional
// quotes/whitespace.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const RELEASE = join(REPO_ROOT, ".github", "workflows", "release.yml");
const CITATION = join(REPO_ROOT, "CITATION.cff");
const IA_RECORD = join(REPO_ROOT, "docs", "launch-readiness", "internet-archive-snapshots.md");
const SH_RECORD = join(REPO_ROOT, "docs", "launch-readiness", "software-heritage-snapshots.md");
const DOI_JSON = join(REPO_ROOT, "corpus", "doi.json");

function loadRelease() {
  assert.ok(existsSync(RELEASE), `release.yml missing at ${RELEASE}`);
  return readFileSync(RELEASE, "utf8");
}

// Slice the corpus-release job body: find the `  corpus-release:` declaration
// line and return from there to the next top-level `  <job>:` declaration (or
// EOF). The archival steps are appended at the END of the job (after deploy),
// so a generous slice-to-next-job is more robust than a fixed window.
function corpusReleaseBody(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^  corpus-release:\s*$/.test(l));
  if (start === -1) return { idx: -1, body: "" };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    // Next top-level job declaration (2-space indent, `name:`-style key).
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { idx: start, body: lines.slice(start, end).join("\n") };
}

// ─────────────────────────────────────────────────────────────────────
// AC-1 / AC-6: Zenodo DOI step writes the canonical DOI sink (CITATION.cff)
// ─────────────────────────────────────────────────────────────────────

test("AC-1: corpus-release implements a Zenodo DOI step that writes the CITATION.cff DOI sink", () => {
  const text = loadRelease();
  const { idx, body } = corpusReleaseBody(text);
  assert.notEqual(idx, -1, `corpus-release job declaration not found.`);

  // A Zenodo DOI step is present in the corpus-release body (e.g. a
  // `mint-and-record-zenodo-doi` step referencing the Zenodo API). Match the
  // API host or a hyphenated step-id token rather than the bare word "Zenodo":
  // the 8.1-era "Deferred to Story 8.2 … append Zenodo DOI mint …" prose marker
  // contains "Zenodo" / "Zenodo DOI" as plain text, so a bare /zenodo/ or
  // /zenodo.*doi/ would false-pass against the un-implemented workflow. A
  // hyphenated id (zenodo-doi) or the api host appears only in a real step.
  assert.match(
    body,
    /api\.zenodo\.org|zenodo[-_]doi|doi[-_]zenodo|record[-_]zenodo|zenodo[-_](?:doi|mint|record)/i,
    `corpus-release must gain a Zenodo DOI step (e.g. mint-and-record-zenodo-doi fetching the minted DOI via the Zenodo API / api.zenodo.org). Body:\n${body}`,
  );

  // The DOI sink the step writes/targets is CITATION.cff (canonical sink per
  // Dev Notes — the build reads fm.doi, CITATION.cff is the populated source).
  assert.match(
    body,
    /CITATION\.cff/,
    `the Zenodo DOI step must write/target the canonical DOI sink CITATION.cff (AC-1/AC-6). Body:\n${body}`,
  );
});

test("AC-6: CITATION.cff exists and is the named DOI sink (has a doi: field)", () => {
  assert.ok(existsSync(CITATION), `CITATION.cff missing at ${CITATION} — it is the canonical DOI sink.`);
  const cff = readFileSync(CITATION, "utf8");
  assert.match(
    cff,
    /^doi:\s*.*$/m,
    `CITATION.cff must carry a "doi:" field (the canonical DOI sink the release step populates). Got:\n${cff}`,
  );
});

test("AC-6: corpus/doi.json secondary machine-readable sink exists, is valid JSON, and carries a PENDING placeholder", () => {
  assert.ok(
    existsSync(DOI_JSON),
    `corpus/doi.json missing at ${DOI_JSON} — AC-6 lands it as the optional secondary machine-readable DOI sink (real DOI populated by release.yml at launch).`,
  );
  const raw = readFileSync(DOI_JSON, "utf8");
  let parsed;
  assert.doesNotThrow(() => {
    parsed = JSON.parse(raw);
  }, `corpus/doi.json must be valid JSON. Got:\n${raw}`);
  // Pre-launch placeholder: no DOI minted yet. Accept either an explicit
  // pending marker or a null/empty doi — do not over-pin the exact shape.
  assert.ok(
    /pending/i.test(raw) || parsed.doi === null || parsed.doi === "",
    `corpus/doi.json must carry a PENDING placeholder (e.g. {"doi": null, "status": "pending"}) until release.yml mints the real DOI at launch. Got:\n${raw}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: Internet Archive Save-Page-Now step — best-effort + failure-routed
// ─────────────────────────────────────────────────────────────────────

test("AC-2: corpus-release implements an Internet Archive Save-Page-Now step (best-effort, failure-routed to a labeled Issue)", () => {
  const text = loadRelease();
  const { idx, body } = corpusReleaseBody(text);
  assert.notEqual(idx, -1, `corpus-release job declaration not found.`);

  // Internet Archive Save Page Now step present (targets web.archive.org/save).
  // Match the endpoint host, NOT the bare phrase "Save Page Now": the 8.1-era
  // "Deferred to Story 8.2 … Internet Archive Save Page Now …" prose marker
  // contains "Save Page Now", so /save\s*page\s*now/ would false-pass against
  // the un-implemented workflow.
  assert.match(
    body,
    /web\.archive\.org\/save/i,
    `corpus-release must gain an Internet Archive Save-Page-Now step targeting https://web.archive.org/save/<url> (AC-2). Body:\n${body}`,
  );

  // Best-effort: a failed snapshot must NOT fail the release. Accept either a
  // continue-on-error step or an if: failure() routing step.
  assert.match(
    body,
    /continue-on-error:\s*true|if:\s*\$\{\{\s*failure\(\)|if:\s*failure\(\)/i,
    `the Internet Archive step must be best-effort / non-fatal (continue-on-error: true or an if: failure() routing step) so a failed snapshot does not fail the release (AC-2). Body:\n${body}`,
  );

  // Failure routes to a labeled GitHub Issue per the scheduled.yml pattern
  // (Story 8.3) — archival-health label vocabulary, via gh CLI or
  // actions/github-script.
  assert.match(
    body,
    /archival-health|archive-health/i,
    `the Internet Archive step's failure path must route to a labeled GitHub Issue (archival-health / area:archival-health) per the scheduled.yml pattern (AC-2). Body:\n${body}`,
  );
  assert.match(
    body,
    /gh\s+issue\s+create|actions\/github-script|github\.rest\.issues|issues\.create/i,
    `the Internet Archive failure-routing must create a GitHub Issue (gh issue create / actions/github-script) — the labeled-issue routing replacing Slack/PagerDuty (AC-2). Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: Software Heritage save step — best-effort + failure-routed
// ─────────────────────────────────────────────────────────────────────

test("AC-3: corpus-release implements a Software Heritage save step (best-effort, failure-routed to a labeled Issue)", () => {
  const text = loadRelease();
  const { idx, body } = corpusReleaseBody(text);
  assert.notEqual(idx, -1, `corpus-release job declaration not found.`);

  // Software Heritage save step present (targets the SH save endpoint host).
  // Match the endpoint host, NOT the bare phrase "Software Heritage": the
  // 8.1-era "Deferred to Story 8.2 … Software Heritage save …" prose marker
  // contains "Software Heritage", so /software\s*heritage/ would false-pass
  // against the un-implemented workflow.
  assert.match(
    body,
    /archive\.softwareheritage\.org|softwareheritage\.org\/api/i,
    `corpus-release must gain a Software Heritage save step targeting https://archive.softwareheritage.org/api/1/origin/save/git/url/<repo-url> (AC-3). Body:\n${body}`,
  );

  // The SH save endpoint specifically (origin/save) — confirms it is the save
  // action, not merely a reference to the SH host.
  assert.match(
    body,
    /origin\/save/i,
    `the Software Heritage step must hit the SH "save" endpoint (.../origin/save/git/url/...) (AC-3). Body:\n${body}`,
  );

  // Best-effort: non-fatal (continue-on-error or if: failure() routing).
  assert.match(
    body,
    /continue-on-error:\s*true|if:\s*\$\{\{\s*failure\(\)|if:\s*failure\(\)/i,
    `the Software Heritage step must be best-effort / non-fatal (continue-on-error: true or an if: failure() routing step) (AC-3). Body:\n${body}`,
  );

  // Same labeled-Issue failure-routing as AC-2.
  assert.match(
    body,
    /archival-health|archive-health/i,
    `the Software Heritage step's failure path must route to a labeled GitHub Issue (archival-health) per the scheduled.yml pattern (AC-3). Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-5: launch-readiness record files exist with a PENDING marker
// ─────────────────────────────────────────────────────────────────────

test("AC-5: docs/launch-readiness/internet-archive-snapshots.md exists with a PENDING marker", () => {
  assert.ok(
    existsSync(IA_RECORD),
    `docs/launch-readiness/internet-archive-snapshots.md missing at ${IA_RECORD} — the IA snapshot-URL record file (AC-5).`,
  );
  const doc = readFileSync(IA_RECORD, "utf8");
  assert.match(
    doc,
    /PENDING/i,
    `internet-archive-snapshots.md must carry an explicit PENDING marker (real URLs captured at launch / Epic 10 — never fabricated). Got:\n${doc}`,
  );
});

test("AC-5: docs/launch-readiness/software-heritage-snapshots.md exists with a PENDING marker", () => {
  assert.ok(
    existsSync(SH_RECORD),
    `docs/launch-readiness/software-heritage-snapshots.md missing at ${SH_RECORD} — the SH snapshot-URL record file (AC-5).`,
  );
  const doc = readFileSync(SH_RECORD, "utf8");
  assert.match(
    doc,
    /PENDING/i,
    `software-heritage-snapshots.md must carry an explicit PENDING marker (real URLs captured at launch / Epic 10 — never fabricated). Got:\n${doc}`,
  );
});
