// Schema validation for METHODOLOGY_CLAIMS.json.
// Story 2-7: red-phase test until manifest is populated (AC-5).

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const MANIFEST_PATH = resolve(REPO_ROOT, "METHODOLOGY_CLAIMS.json");
const SCHEMA_PATH = resolve(REPO_ROOT, "corpus/methodology-claims-v1.schema.json");

const CLAIM_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const ENGINE_SOURCE_PATTERN = /^src\/scoring\/.+\.js$/;
const METHODOLOGY_PATH_PATTERN = /^src\/content\/methodology\/[a-z]{2}\/.+\.md$/;
const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+$/;

const REQUIRED_CLAIM_IDS = [
  "irt-2pl-model",
  "eap-estimation-method",
  "quadpts-61",
  "theta-lim-pm-6",
  "prior-standard-normal",
  "percentile-from-standard-normal-cdf",
  "iq-scale-mean-100-sd-15",
  "se-total-rss",
  "golden-vector-parity-0001-logits",
];

test("METHODOLOGY_CLAIMS.json exists at repo root", () => {
  assert.ok(
    existsSync(MANIFEST_PATH),
    `METHODOLOGY_CLAIMS.json not found at ${MANIFEST_PATH}`,
  );
});

test("METHODOLOGY_CLAIMS.json is valid JSON", () => {
  const text = readFileSync(MANIFEST_PATH, "utf8");
  assert.doesNotThrow(() => JSON.parse(text), "manifest must parse as JSON");
});

test("manifest top-level shape: version + claims[]", () => {
  const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  assert.ok("version" in m, "missing top-level 'version'");
  assert.ok(VERSION_PATTERN.test(m.version), `version pattern: ${m.version}`);
  assert.ok(Array.isArray(m.claims), "claims must be array");
});

test("manifest version is 1.0.0", () => {
  const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  assert.equal(m.version, "1.0.0");
});

test("manifest declares at least 9 claims", () => {
  const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  assert.ok(
    m.claims.length >= 9,
    `expected ≥9 claims (got ${m.claims.length})`,
  );
});

test("every claim has required fields with correct patterns", () => {
  const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  for (const c of m.claims) {
    for (const key of ["claim-id", "engine-source", "methodology-path", "value-or-formula"]) {
      assert.ok(key in c, `claim missing '${key}': ${JSON.stringify(c)}`);
    }
    assert.ok(
      CLAIM_ID_PATTERN.test(c["claim-id"]),
      `claim-id pattern fail: ${c["claim-id"]}`,
    );
    assert.ok(
      ENGINE_SOURCE_PATTERN.test(c["engine-source"]),
      `engine-source pattern fail: ${c["engine-source"]}`,
    );
    assert.ok(
      METHODOLOGY_PATH_PATTERN.test(c["methodology-path"]),
      `methodology-path pattern fail: ${c["methodology-path"]}`,
    );
    assert.ok(
      typeof c["value-or-formula"] === "string" && c["value-or-formula"].length > 0,
      `value-or-formula missing/empty: ${c["claim-id"]}`,
    );
  }
});

test("manifest contains all 9 required claim IDs", () => {
  const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const ids = new Set(m.claims.map((c) => c["claim-id"]));
  for (const required of REQUIRED_CLAIM_IDS) {
    assert.ok(ids.has(required), `missing claim-id: ${required}`);
  }
});

test("every claim's engine-source file exists on disk", () => {
  const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  for (const c of m.claims) {
    const fullPath = resolve(REPO_ROOT, c["engine-source"]);
    assert.ok(
      existsSync(fullPath),
      `engine-source missing on disk: ${c["engine-source"]} (claim: ${c["claim-id"]})`,
    );
  }
});
