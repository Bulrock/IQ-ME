// Scaffold acceptance test for Story 2.1 — passes green.
//
// Asserts the structural skeleton of src/scoring/irt/ exists with the
// canonical function names (architecture D3), that vectors-smoke.json is a
// valid JSON fixture of the documented shape, that parity.test.mjs imports
// only allow-listed modules, and that the Makefile `test` recipe includes
// tests/unit/.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../..");

const STUBS = [
  { file: "src/scoring/irt/quadrature.js", name: "quadraturePoints" },
  { file: "src/scoring/irt/likelihood.js", name: "logLikelihood" },
  { file: "src/scoring/irt/eap.js", name: "eapEstimate" },
  { file: "src/scoring/irt/se.js", name: "standardError" },
];

test("scoring-irt scaffold: src/scoring/irt/*.js stubs exist", () => {
  for (const { file } of STUBS) {
    assert.ok(existsSync(resolve(repoRoot, file)), `missing: ${file}`);
  }
  assert.ok(
    existsSync(resolve(repoRoot, "src/scoring/irt/index.js")),
    "missing: src/scoring/irt/index.js",
  );
});

test("scoring-irt scaffold: each stub exports its canonical function name", () => {
  for (const { file, name } of STUBS) {
    const src = readFileSync(resolve(repoRoot, file), "utf8");
    const pattern = new RegExp(
      `export\\s+(?:function\\s+${name}\\b|\\{[^}]*\\b${name}\\b[^}]*\\})`,
    );
    assert.ok(pattern.test(src), `${file} does not export ${name}`);
  }
});

test("scoring-irt scaffold: index.js exposes scoreSession and the four primitives", () => {
  const src = readFileSync(
    resolve(repoRoot, "src/scoring/irt/index.js"),
    "utf8",
  );
  for (const { name } of STUBS) {
    assert.ok(
      new RegExp(`\\b${name}\\b`).test(src),
      `index.js does not re-export ${name}`,
    );
  }
  assert.ok(
    /export\s+function\s+scoreSession\b/.test(src),
    "index.js does not declare scoreSession",
  );
});

test("scoring-irt scaffold: vectors-smoke.json is valid and shape-correct", () => {
  const path = resolve(repoRoot, "tests/golden/vectors-smoke.json");
  assert.ok(existsSync(path), "missing: tests/golden/vectors-smoke.json");
  const data = JSON.parse(readFileSync(path, "utf8"));
  assert.ok(Array.isArray(data), "fixture must be a JSON array");
  assert.ok(
    data.length >= 5 && data.length <= 10,
    `fixture must have 5–10 entries (got ${data.length})`,
  );
  for (let i = 0; i < data.length; i++) {
    const e = data[i];
    assert.ok(
      Array.isArray(e.responses),
      `entry ${i}: responses must be an array`,
    );
    assert.ok(
      Array.isArray(e.itemParameters),
      `entry ${i}: itemParameters must be an array`,
    );
    assert.equal(
      typeof e.expectedTheta,
      "number",
      `entry ${i}: expectedTheta must be a number`,
    );
    assert.equal(
      typeof e.expectedSE,
      "number",
      `entry ${i}: expectedSE must be a number`,
    );
    for (let j = 0; j < e.itemParameters.length; j++) {
      const p = e.itemParameters[j];
      assert.equal(
        typeof p.a,
        "number",
        `entry ${i} item ${j}: a must be a number`,
      );
      assert.equal(
        typeof p.b,
        "number",
        `entry ${i} item ${j}: b must be a number`,
      );
    }
  }
});

test("scoring-irt scaffold: parity.test.mjs imports only allow-listed sources", () => {
  const src = readFileSync(
    resolve(repoRoot, "tests/unit/scoring/irt/parity.test.mjs"),
    "utf8",
  );
  const importLines = src
    .split("\n")
    .filter((line) => /^\s*import\s/.test(line));
  assert.ok(importLines.length > 0, "parity.test.mjs has no import lines");
  for (const line of importLines) {
    const m = line.match(/from\s+["']([^"']+)["']/);
    assert.ok(m, `cannot parse import: ${line}`);
    const spec = m[1];
    const allowed =
      spec.startsWith("node:") ||
      spec.startsWith("./") ||
      spec.startsWith("../");
    assert.ok(
      allowed,
      `parity.test.mjs imports disallowed module: ${spec} (only node:, ./, ../ permitted per NFR33)`,
    );
  }
});

test("scoring-irt scaffold: Makefile test target includes tests/unit/", () => {
  const mk = readFileSync(resolve(repoRoot, "Makefile"), "utf8");
  assert.ok(
    /tests\/unit\//.test(mk),
    "Makefile does not reference tests/unit/ in any recipe",
  );
});
