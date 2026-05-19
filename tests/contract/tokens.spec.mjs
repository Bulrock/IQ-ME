// tests/contract/tokens.spec.mjs
//
// Story 1.10 — contract test: the SHA-256 of (primitives.css + semantic.css)
// must equal the committed value in tests/snapshots/tokens.hash.json. Drift
// requires `make snapshot-update` (the codified D→E exception).

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const SNAPSHOT = resolve(REPO_ROOT, "tests/snapshots/tokens.hash.json");
const FILES = [
  resolve(REPO_ROOT, "src/css/primitives.css"),
  resolve(REPO_ROOT, "src/css/semantic.css"),
].sort();

test("tokens contract: SHA-256 of primitives.css + semantic.css matches committed snapshot", () => {
  const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const hash = createHash("sha256");
  for (const f of FILES) hash.update(readFileSync(f));
  const actual = hash.digest("hex");
  assert.equal(
    actual,
    snap.primitives_semantic_sha256,
    `Token drift detected.\n  snapshot: ${snap.primitives_semantic_sha256}\n  actual:   ${actual}\n  → run 'make snapshot-update' to refresh the snapshot (intentional token change).`,
  );
});
