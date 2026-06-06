// Story 10-2 — Acceptance guard for launch postscript scaffold and
// doi.json / snapshot record format correctness.
//
// This story's runtime ACs (tag push, release.yml execution, Zenodo DOI
// minting, IA/SH snapshot capture) are human-gated launch
// operations. The automated guards cover:
//   - AC4: corpus/doi.json structure (field presence, no fabricated DOI)
//   - AC5/AC6: internet-archive-snapshots.md and software-heritage-snapshots.md
//     format (exist, have pending sentinel, no fabricated URLs)
//   - AC10: v1.0.0-launch-postscript.md structure (created by specialist at
//     launch; scaffold test verifies required sections exist)
//   - No-fabrication invariant (lesson-2026-06-04-002): no real DOI, SHA256,
//     or IA/SH URLs committed before the actual launch run
//
// RED until specialist authors v1.0.0-launch-postscript.md.
// doi.json and snapshot records are managed by release.yml at launch time.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const DOI_JSON = join(REPO_ROOT, "corpus", "doi.json");
const IA_SNAPSHOTS = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "internet-archive-snapshots.md",
);
const SH_SNAPSHOTS = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "software-heritage-snapshots.md",
);
const POSTSCRIPT = join(
  REPO_ROOT,
  "docs",
  "launch-readiness",
  "v1.0.0-launch-postscript.md",
);

function read(p) {
  assert.ok(existsSync(p), `missing required file: ${p}`);
  return readFileSync(p, "utf8");
}

// A fabricated DOI looks like "10.NNNN/zenodo.NNNNNNN" — real DOIs have this
// shape. The doi.json must stay {"doi": null, "status": "pending"} until
// release.yml actually mints it at launch time. We guard against pre-filling.
const FABRICATED_DOI = /\b10\.\d{4,}\/zenodo\.\d{5,}\b/;

// Fabricated IA URL: web.archive.org/web/YYYYMMDDHHMMSS/
const FABRICATED_IA_URL =
  /web\.archive\.org\/web\/\d{14}\//;

// Fabricated SHA256 (64 hex chars committed as a real baseline value)
// We allow it in templates with [FILL IN AT LAUNCH] context but not as
// a bare committed hash value in the postscript.
const FABRICATED_SHA256_BARE = /^[0-9a-f]{64}\s/im;

// AC4: corpus/doi.json must exist, have required fields, no fabricated DOI pre-launch
test("AC4: corpus/doi.json exists with required fields", () => {
  const raw = read(DOI_JSON);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    assert.fail(`corpus/doi.json is not valid JSON: ${e.message}`);
  }
  assert.ok("doi" in parsed, "doi.json must have a 'doi' field");
  assert.ok("status" in parsed, "doi.json must have a 'status' field");
});

test("AC4 + lesson-2026-06-04-002: corpus/doi.json must not contain a fabricated DOI pre-launch", () => {
  const raw = read(DOI_JSON);
  // Before actual launch, doi must be null (pending); a real DOI would be
  // 10.NNNN/zenodo.NNNNNNN — guard against pre-filling
  const parsed = JSON.parse(raw);
  if (parsed.doi !== null && parsed.status !== "minted") {
    // It's minted post-launch — verify it looks real (not a placeholder string)
    assert.ok(
      typeof parsed.doi === "string" && parsed.doi.length > 5,
      "doi.json doi field when non-null must be a real DOI string",
    );
  }
  // If status is pending, doi must be null (not a fabricated value)
  if (parsed.status === "pending") {
    assert.strictEqual(
      parsed.doi,
      null,
      "doi.json doi must be null when status=pending — do not pre-fill with a fabricated DOI",
    );
  }
});

// AC5: internet-archive-snapshots.md exists and has required structure
test("AC5: internet-archive-snapshots.md exists and has snapshot log section", () => {
  const ia = read(IA_SNAPSHOTS);
  assert.match(
    ia,
    /Snapshot\s+log|snapshot log/i,
    "internet-archive-snapshots.md must have a 'Snapshot log' section",
  );
  assert.match(
    ia,
    /corpus-v|corpus version/i,
    "internet-archive-snapshots.md must reference corpus versions",
  );
});

test("AC5 + lesson-2026-06-04-002: IA snapshot record must not contain fabricated snapshot URLs pre-launch", () => {
  const ia = read(IA_SNAPSHOTS);
  // If the file contains real captured IA URLs, they'll be present after launch.
  // Guard: if status still shows PENDING (pre-launch), no real IA URLs should exist.
  const isPending = /STATUS:\s*PENDING/i.test(ia);
  if (isPending) {
    assert.ok(
      !FABRICATED_IA_URL.test(ia),
      "IA snapshot record must not contain fabricated web.archive.org/web/ URLs while STATUS: PENDING",
    );
  }
});

// AC6: software-heritage-snapshots.md exists and has required structure
test("AC6: software-heritage-snapshots.md exists and has save-request log section", () => {
  const sh = read(SH_SNAPSHOTS);
  assert.match(
    sh,
    /Save[- ]request\s+log|save.request log/i,
    "software-heritage-snapshots.md must have a 'Save-request log' section",
  );
  assert.match(
    sh,
    /corpus-v|softwareheritage|Software Heritage/i,
    "software-heritage-snapshots.md must reference Software Heritage or corpus versions",
  );
});

// AC10: v1.0.0-launch-postscript.md exists with required sections
test("AC10: v1.0.0-launch-postscript.md exists with launch date section", () => {
  const postscript = read(POSTSCRIPT);
  assert.match(
    postscript,
    /launch date|launched|v1\.0\.0/i,
    "launch postscript must reference the v1.0.0 launch date",
  );
});

test("AC10: launch postscript covers gate-closure timeline (9a–9e)", () => {
  const postscript = read(POSTSCRIPT);
  // Must reference all five gates
  for (const gate of ["9a", "9b", "9c", "9d", "9e"]) {
    assert.match(
      postscript,
      new RegExp(`\\b${gate}\\b`, "i"),
      `launch postscript must reference gate ${gate} closure date`,
    );
  }
});

test("AC10: launch postscript covers release.yml run reference", () => {
  const postscript = read(POSTSCRIPT);
  assert.match(
    postscript,
    /release\.yml|github\.com.*actions.*runs|run URL/i,
    "launch postscript must reference the release.yml run",
  );
});

test("AC10: launch postscript covers Zenodo DOI reference", () => {
  const postscript = read(POSTSCRIPT);
  assert.match(
    postscript,
    /Zenodo|DOI|10\.\d{4,}/i,
    "launch postscript must reference the Zenodo DOI",
  );
});

test("AC10: launch postscript covers tester-credibility-report summary", () => {
  const postscript = read(POSTSCRIPT);
  assert.match(
    postscript,
    /tester|credibility|9e|\/15/i,
    "launch postscript must include a tester credibility report summary",
  );
});

test("AC10 + lesson-2026-06-04-002: launch postscript must not contain fabricated bare SHA256 hashes", () => {
  const postscript = read(POSTSCRIPT);
  assert.ok(
    !FABRICATED_SHA256_BARE.test(postscript),
    "launch postscript must not contain bare SHA256 hashes — these are filled at actual launch time",
  );
});

test("AC9 + lesson-2026-06-04-002: launch postscript must not solicit viral distribution", () => {
  const postscript = read(POSTSCRIPT);
  // The announcement (referenced in postscript) must not solicit shares/upvotes
  const VIRAL_SOLICITATION =
    /\b(share this|submit to HN|post to reddit|tweet this|upvote|retweet|go viral)\b/i;
  assert.ok(
    !VIRAL_SOLICITATION.test(postscript),
    "launch postscript must not solicit viral distribution (no 'share this', 'submit to HN', 'upvote', etc.)",
  );
});
