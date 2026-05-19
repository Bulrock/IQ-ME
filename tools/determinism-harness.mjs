// tools/determinism-harness.mjs
//
// Story 1.8 — Determinism harness. Single canonical home for the
// determinism constants Epic 2 (golden vectors) + Epic 4 (byte-stable
// build) will consume, plus three small utility functions.
//
// Stdlib-only per NFR33.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// Declarative locale contract. Node's crypto doesn't actually consume
// LC_ALL for hash input — but downstream tooling (Epic 2's R bridge,
// Epic 4's snapshot tooling) DOES depend on locale-independent string
// ordering. The constant tells them the canonical answer.
export const DETERMINISM = Object.freeze({
  SOURCE_DATE_EPOCH: 0,
  FROZEN_TIMESTAMP_ISO: "1970-01-01T00:00:00.000Z",
  HASH_LOCALE: "C.UTF-8",
  R_SEED: 20260514,
  R_QUADPTS: 61,
  R_THETA_LIM: Object.freeze([-6, 6]),
});

export function sortedReaddir(dir) {
  return readdirSync(dir).sort();
}

export function frozenStat(path) {
  const st = statSync(path);
  return {
    size: st.size,
    mtime: DETERMINISM.FROZEN_TIMESTAMP_ISO,
    mode: st.mode,
  };
}

// Recursive SHA-256 over a directory tree. Sorted at each level for
// determinism; includes content bytes, not mtimes. Empty directory
// yields the canonical empty-string sha256:
//   e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
export function hashTree(rootDir) {
  const hash = createHash("sha256");
  const entries = sortedReaddir(rootDir);
  for (const entry of entries) {
    const full = join(rootDir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      hash.update(`D|${entry}|`);
      hash.update(hashTree(full));
    } else {
      hash.update(`F|${entry}|${st.size}|`);
      hash.update(readFileSync(full));
    }
  }
  return hash.digest("hex");
}

export default DETERMINISM;
