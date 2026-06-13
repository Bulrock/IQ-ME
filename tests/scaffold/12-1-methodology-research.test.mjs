// Story 12-1 — Acceptance guard for the methodology-landscape research artifact
// (AC 1–5). Epic 12 is research-first; this story ships only the research
// Markdown under _bmad-output/planning-artifacts/ plus this structural guard.
// The shortlist + variant design it pins feed Stories 12-2..12-5.
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks over the artifact text. RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const ART = join(REPO_ROOT, "_bmad-output", "planning-artifacts", "methodology-landscape-research.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

test("AC1: enumerates >=5 candidate methodologies with the required fields", () => {
  const a = read(ART);
  for (const m of ["ICAR Matrix Reasoning", "Verbal Reasoning", "Letter", "Rotation", "Wechsler"]) {
    assert.ok(a.includes(m), `must enumerate candidate referencing "${m}"`);
  }
  for (const field of ["Construct", "Licensing", "feasib"]) {
    assert.match(a, new RegExp(field, "i"), `candidate table must cover "${field}"`);
  }
});

test("AC2: claims are sourced; no obviously-fabricated statistics", () => {
  const a = read(ART);
  assert.match(a, /ICAR|International Cognitive Ability Resource/, "must cite the ICAR project basis");
  assert.match(a, /Condon|Revelle/, "must cite the foundational ICAR validation source");
  // Guard against invented precise psychometric stats presented as measured here.
  assert.ok(
    !/\br\s*=\s*0\.\d{2}\b/.test(a),
    "must not assert an invented correlation coefficient (r = 0.xx) as if measured here",
  );
  assert.ok(
    !/\bg-loading of 0\.\d+\b/i.test(a),
    "must not assert an invented precise g-loading figure",
  );
});

test("AC3: recommends a shortlist with short AND full variants, and flags unsuitable ones", () => {
  const a = read(ART);
  assert.match(a, /shortlist/i, "must recommend a shortlist");
  assert.match(a, /short variant/i, "shortlist must specify short variants");
  assert.match(a, /full variant/i, "shortlist must specify full variants");
  assert.match(a, /(proprietar|licensed|not redistributable|Excluded)/i, "must flag unsuitable proprietary tests");
  // Concrete item counts pinned for the variants.
  assert.match(a, /\b16 items?\b/i, "must pin the existing 16-item short variant");
});

test("AC4: identifies the corpus content required for PR-15 (input to 12-5)", () => {
  const a = read(ART);
  assert.match(a, /corpus/i, "must identify corpus content for PR-15");
  assert.match(a, /comparison/i, "must call for an accuracy/popularity comparison page");
  assert.match(a, /NFR27|mirror/i, "must note EN→PL/RU mirroring (NFR27) for the corpus pages");
});

test("AC5: states the gating contract mapping downstream stories to the shortlist", () => {
  const a = read(ART);
  assert.match(a, /gat(e|ing)/i, "must state the gating contract");
  for (const s of ["12-2", "12-3", "12-4", "12-5"]) {
    assert.ok(a.includes(s), `gating contract must map downstream story ${s}`);
  }
  assert.match(a, /no implementation story proceeds on an unsourced methodology/i, "must state the unsourced-methodology bar");
});
