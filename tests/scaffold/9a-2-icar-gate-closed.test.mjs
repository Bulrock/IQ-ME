// Story 9a-2 — Gate-closed guard for ICAR confirmation arrival.
//
// Asserts that the REAL written reply has landed:
//   - ICAR-CONFIRMATION.pdf is non-empty and NOT the Epic-1 placeholder
//   - The placeholder's tell-tale "Pending" title string is gone
//   - The file is large enough to be an actual letter/PDF (>5 KB)
//   - icar-outreach-log.md records a real outcome (not "pending")
//   - icar-license.md (EN/RU/PL) no longer carries pending: true
//
// RED until Story 9a-2 impl phase completes (real artifact committed).
// Governing lesson lesson-2026-06-04-002: never fabricate confirmation.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const PDF_PATH = join(REPO_ROOT, "ICAR-CONFIRMATION.pdf");
const LOG_PATH = join(REPO_ROOT, "docs", "launch-readiness", "icar-outreach-log.md");
const ICAR_LICENSE_EN = join(REPO_ROOT, "src", "content", "methodology", "en", "provenance", "icar-license.md");
const ICAR_LICENSE_RU = join(REPO_ROOT, "src", "content", "methodology", "ru", "provenance", "icar-license.md");
const ICAR_LICENSE_PL = join(REPO_ROOT, "src", "content", "methodology", "pl", "provenance", "icar-license.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// The Epic-1 placeholder is tiny (≤2 KB) and contains "Pending" in the PDF title.
// The real confirmation will be a substantive letter/scan (>5 KB).
test("AC1: ICAR-CONFIRMATION.pdf exists, is non-empty, and is not the Epic-1 placeholder", () => {
  assert.ok(existsSync(PDF_PATH), "ICAR-CONFIRMATION.pdf must exist at repo root");
  const size = statSync(PDF_PATH).size;
  assert.ok(size > 5_000, `ICAR-CONFIRMATION.pdf is ${size} bytes — expected >5 KB for a real confirmation letter (current file is the placeholder)`);
});

test("AC1: ICAR-CONFIRMATION.pdf does not contain the placeholder title string", () => {
  const pdf = readFileSync(PDF_PATH, "latin1");
  assert.ok(
    !/ICAR License Confirmation\s*[—\-]\s*Pending/i.test(pdf),
    "ICAR-CONFIRMATION.pdf must not contain 'ICAR License Confirmation — Pending' (that is the Epic-1 placeholder title; replace with the real reply)",
  );
});

test("AC1: ICAR-CONFIRMATION.pdf does not contain the Pre-launch gate placeholder body", () => {
  const pdf = readFileSync(PDF_PATH, "latin1");
  assert.ok(
    !/Pre-launch gate #1/i.test(pdf),
    "ICAR-CONFIRMATION.pdf must not contain 'Pre-launch gate #1' (placeholder body text)",
  );
});

test("AC5: outreach log records a real outcome — at least one row has a non-pending date", () => {
  const log = read(LOG_PATH);
  // Every row "pending" means no real send has been recorded.
  // A real outcome: at least one table row has a date that is not "pending".
  const rows = log.split("\n").filter((l) => l.startsWith("|") && /\d{4}-\d{2}-\d{2}/.test(l));
  assert.ok(
    rows.length > 0,
    "icar-outreach-log.md must have at least one table row with a real ISO date (YYYY-MM-DD) — all rows are still 'pending'",
  );
});

test("AC5: outreach log does not carry STATUS: PENDING at the top (gate should be closed)", () => {
  const log = read(LOG_PATH);
  assert.ok(
    !/STATUS:\s*PENDING/i.test(log),
    "icar-outreach-log.md must not carry 'STATUS: PENDING' when Gate 9a is closed",
  );
});

test("AC4: EN icar-license.md no longer has pending: true (real confirmation summary in place)", () => {
  const en = read(ICAR_LICENSE_EN);
  assert.ok(
    !/^pending:\s*true\s*$/m.test(en),
    "src/content/methodology/en/provenance/icar-license.md must not carry 'pending: true' after Gate 9a closes",
  );
});

test("AC4: RU icar-license.md no longer has pending: true (NFR27 parity)", () => {
  const ru = read(ICAR_LICENSE_RU);
  assert.ok(
    !/^pending:\s*true\s*$/m.test(ru),
    "src/content/methodology/ru/provenance/icar-license.md must not carry 'pending: true' after Gate 9a closes (NFR27 parity required)",
  );
});

test("AC4: PL icar-license.md no longer has pending: true (NFR27 parity)", () => {
  const pl = read(ICAR_LICENSE_PL);
  assert.ok(
    !/^pending:\s*true\s*$/m.test(pl),
    "src/content/methodology/pl/provenance/icar-license.md must not carry 'pending: true' after Gate 9a closes (NFR27 parity required)",
  );
});
