// Story 5.6 — crisis-resources/en.json scaffold test (FR20).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const FILE = join(REPO_ROOT, "src", "content", "crisis-resources", "en.json");

test("Story 5.6: src/content/crisis-resources/en.json exists", () => {
  assert.ok(existsSync(FILE), `${FILE} missing`);
});

test("Story 5.6: crisis-resources/en.json parses + has ≥3 entries", () => {
  const data = JSON.parse(readFileSync(FILE, "utf8"));
  assert.ok(Array.isArray(data.resources), "must have resources[] array");
  assert.ok(data.resources.length >= 3, `expected ≥3 resources; got ${data.resources.length}`);
});

test("Story 5.6: each crisis-resource has name + url + lastVerified", () => {
  const data = JSON.parse(readFileSync(FILE, "utf8"));
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  for (const r of data.resources) {
    assert.equal(typeof r.name, "string", `resource missing name: ${JSON.stringify(r)}`);
    assert.ok(r.name.length > 0, "name must be non-empty");
    assert.equal(typeof r.url, "string", "url must be string");
    assert.match(r.url, /^https?:\/\/|^tel:/, `url must be http(s) or tel: ${r.url}`);
    assert.equal(typeof r.lastVerified, "string", "lastVerified must be string");
    assert.match(r.lastVerified, DATE_RE, `lastVerified must be ISO YYYY-MM-DD: ${r.lastVerified}`);
  }
});

test("Story 5.6: bottom-decile + top-decile tail-scene pages exist and carry @TBD-en-clinical-register reviewer", () => {
  for (const rel of ["tails/bottom-decile/index.md", "tails/top-decile/index.md"]) {
    const p = join(REPO_ROOT, "src", "content", "methodology", "en", rel);
    assert.ok(existsSync(p), `${p} missing`);
    const text = readFileSync(p, "utf8");
    assert.match(
      text,
      /reviewerHandle:\s*"@TBD-en-clinical-register"/,
      `${rel}: must declare reviewerHandle @TBD-en-clinical-register (placeholder posture)`,
    );
    assert.match(
      text,
      /placeholder.*Gate-9|EN placeholder/i,
      `${rel}: must declare placeholder-awaiting-Gate-9 status in body`,
    );
  }
});
