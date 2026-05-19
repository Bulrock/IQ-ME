#!/usr/bin/env node
// tools/build-determinism-marker.mjs
//
// Story 1.8 — emits dist/.build-determinism-check.json after make build
// runs. The marker captures the SHA-256 of the dist tree plus the frozen
// epoch + harness version, so a `make clean && make build` twice can be
// verified byte-identical (NFR17 / Epic 4 prep).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DETERMINISM, hashTree } from "./determinism-harness.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const DIST = resolve(REPO_ROOT, "dist");

mkdirSync(DIST, { recursive: true });
const sha256 = hashTree(DIST);

const marker = {
  sha256,
  frozen_epoch: DETERMINISM.SOURCE_DATE_EPOCH,
  harness_version: "1.0.0",
};

writeFileSync(resolve(DIST, ".build-determinism-check.json"), JSON.stringify(marker, null, 2) + "\n");
process.stdout.write(`determinism-marker: dist/.build-determinism-check.json sha256=${sha256}\n`);
