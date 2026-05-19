#!/usr/bin/env node
// tools/snapshot-update.mjs
//
// Story 1.10 — recomputes tests/snapshots/tokens.hash.json from the current
// state of src/css/primitives.css + src/css/semantic.css.
//
// This is the codified D→E write exception (per docs/domain-map.md): tools/
// writes into tests/snapshots/ via this single, target-gated script.
//
// Idempotent: running twice in a row produces the byte-identical output file.
// Stdlib-only per NFR33.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DETERMINISM } from "./determinism-harness.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const SNAPSHOT_DIR = resolve(REPO_ROOT, "tests", "snapshots");
const SNAPSHOT_PATH = resolve(SNAPSHOT_DIR, "tokens.hash.json");

const FILES = [
  resolve(REPO_ROOT, "src/css/primitives.css"),
  resolve(REPO_ROOT, "src/css/semantic.css"),
].sort();

const hash = createHash("sha256");
for (const f of FILES) hash.update(readFileSync(f));
const sha = hash.digest("hex");

const snapshot = {
  primitives_semantic_sha256: sha,
  generated_at: DETERMINISM.FROZEN_TIMESTAMP_ISO,
};

mkdirSync(SNAPSHOT_DIR, { recursive: true });
writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
process.stdout.write(`snapshot-update: tests/snapshots/tokens.hash.json sha256=${sha}\n`);
