// tests/contract/item-parameters-schema.spec.mjs
//
// Story 3.4 AC-10.5 — `src/items/item-parameters.json` + `corpus/item-parameters.schema.json`
// contract test (4 sub-cases per AC-10.5 / 10.5b / 10.5c / 10.5d).
//
// Node 22 native node:test + node:assert/strict. No third-party deps.
// Uses local hand-rolled validator in `./_item-parameters-schema-check.mjs`
// (precedent: `tests/contract/_state-schema-check.mjs` from Story 3.2).
//
// Red phase: neither `src/items/item-parameters.json` nor
// `corpus/item-parameters.schema.json` exists yet — file reads throw,
// caught by try/catch and surfaced as readable test failures.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { validateItemParameters } from "./_item-parameters-schema-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const ITEMS_JSON_PATH = resolve(REPO_ROOT, "src", "items", "item-parameters.json");
const SCHEMA_PATH = resolve(REPO_ROOT, "corpus", "item-parameters.schema.json");
const ITEMS_DIR = resolve(REPO_ROOT, "src", "items");

function safeReadJson(p) {
  try {
    const raw = readFileSync(p, "utf8");
    return { ok: true, data: JSON.parse(raw), raw };
  } catch (err) {
    return { ok: false, error: err };
  }
}

test("AC-10.5: src/items/item-parameters.json exists and parses as JSON", () => {
  const r = safeReadJson(ITEMS_JSON_PATH);
  assert.equal(r.ok, true, `item-parameters.json must exist and parse: ${r.error?.message ?? ""}`);
  assert.equal(typeof r.data, "object");
  assert.notEqual(r.data, null);
});

test("AC-10.5b: item-parameters.json validates against corpus/item-parameters.schema.json (hand-rolled validator)", () => {
  const data = safeReadJson(ITEMS_JSON_PATH);
  assert.equal(data.ok, true, `item-parameters.json must be readable: ${data.error?.message ?? ""}`);
  const schema = safeReadJson(SCHEMA_PATH);
  assert.equal(schema.ok, true, `corpus/item-parameters.schema.json must exist and parse: ${schema.error?.message ?? ""}`);
  const { valid, errors } = validateItemParameters(data.data, schema.data);
  assert.equal(
    valid,
    true,
    `item-parameters.json failed schema validation:\n  ${errors.join("\n  ")}`,
  );
});

test("AC-10.5c: every item.asset filename exists at src/items/{asset}", () => {
  const data = safeReadJson(ITEMS_JSON_PATH);
  assert.equal(data.ok, true, `item-parameters.json must be readable: ${data.error?.message ?? ""}`);
  assert.ok(Array.isArray(data.data.items), "items[] must be an array");
  const missing = [];
  for (const item of data.data.items) {
    assert.equal(typeof item.asset, "string", `item ${item.id}: asset must be a string`);
    const assetPath = resolve(ITEMS_DIR, item.asset);
    if (!existsSync(assetPath)) missing.push(item.asset);
  }
  assert.equal(missing.length, 0, `Missing asset files: ${missing.join(", ")}`);
});

test("AC-10.5d: poolSize === items.length === 16 (v1 stub: pool == session size)", () => {
  const data = safeReadJson(ITEMS_JSON_PATH);
  assert.equal(data.ok, true, `item-parameters.json must be readable: ${data.error?.message ?? ""}`);
  assert.equal(typeof data.data.poolSize, "number", "poolSize must be a number");
  assert.equal(Array.isArray(data.data.items), true, "items must be an array");
  assert.equal(data.data.items.length, 16, "Story 3.4 v1: exactly 16 stub items (real pool ships in Story 9a-2)");
  assert.equal(data.data.poolSize, data.data.items.length, "poolSize must equal items.length");
});
