// Story 12-4 — scaffold guard for the ICAR Letter/Number Series vertical slice.
// Both LN pools (short 12, full 20) are schema-valid, all SVG assets exist,
// correct ∈ options, the full pool spans wider; the registry routes
// letter-number to these pools; the LN result methodology line resolves.
// RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const ITEMS_DIR = join(REPO_ROOT, "src", "items");
const SHORT = join(ITEMS_DIR, "item-parameters-letter-number.json");
const FULL = join(ITEMS_DIR, "item-parameters-letter-number-full.json");
const SCHEMA = join(REPO_ROOT, "corpus", "item-parameters.schema.json");
const EN = join(REPO_ROOT, "src", "content", "i18n", "en", "strings.json");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

function validatePool(path, expectedSize, schema) {
  const pool = JSON.parse(read(path));
  for (const k of schema.required) assert.ok(k in pool, `${path} missing required "${k}"`);
  assert.equal(pool.items.length, expectedSize, `${path} must have ${expectedSize} items`);
  assert.equal(pool.poolSize, pool.items.length, `${path} poolSize must equal items.length`);
  const itemReq = schema.properties.items.items.required;
  const ids = new Set();
  for (const it of pool.items) {
    for (const k of itemReq) assert.ok(k in it, `${path} item ${it.id || "?"} missing "${k}"`);
    assert.match(it.id, /^[a-z][a-z0-9-]*$/, `${path} item id "${it.id}" must match the schema id pattern`);
    assert.ok(!ids.has(it.id), `${path} duplicate item id ${it.id}`);
    ids.add(it.id);
    assert.ok(typeof it.a === "number" && it.a >= 0, `${path} item ${it.id} a>=0`);
    assert.ok(typeof it.b === "number" && it.b >= -10 && it.b <= 10, `${path} item ${it.id} b in [-10,10]`);
    assert.match(it.asset, /^[a-z0-9-]+\.svg$/, `${path} item ${it.id} asset must be an svg name`);
    assert.ok(existsSync(resolve(ITEMS_DIR, it.asset)), `${path} item ${it.id} asset ${it.asset} must exist`);
    assert.ok(Array.isArray(it.options) && it.options.length === 6, `${path} item ${it.id} must have 6 options`);
    for (const opt of it.options) assert.ok(existsSync(resolve(ITEMS_DIR, opt)), `${path} option ${opt} must exist`);
    assert.ok(it.options.includes(it.correct), `${path} item ${it.id} correct must be one of options`);
  }
  return pool;
}

test("AC1/AC2: LN short pool (12) is schema-valid with all assets present", () => {
  const schema = JSON.parse(read(SCHEMA));
  validatePool(SHORT, 12, schema);
});

test("AC1/AC2: LN full pool (20) is schema-valid with all assets present", () => {
  const schema = JSON.parse(read(SCHEMA));
  validatePool(FULL, 20, schema);
});

test("AC1: the LN full pool spans a wider difficulty range than the short pool", () => {
  const span = (p) => { const bs = JSON.parse(read(p)).items.map(i => i.b); return Math.max(...bs) - Math.min(...bs); };
  assert.ok(span(FULL) >= span(SHORT), "full LN difficulty spread must be >= short");
});

test("AC3: the registry routes letter-number to the LN pools", async () => {
  const mod = await import(`../../src/assessment/methodology-registry.js?cb=${encodeURIComponent("12-4")}`);
  const short = mod.resolveVariant("letter-number", "short");
  assert.equal(short.poolUrl, "/src/items/item-parameters-letter-number.json");
  assert.equal(short.sessionSize, 12);
  const full = mod.resolveVariant("letter-number", "full");
  assert.equal(full.poolUrl, "/src/items/item-parameters-letter-number-full.json");
  assert.equal(full.sessionSize, 20);
});

test("AC5: the LN methodology display name + result line keys exist (anti-credentialization-safe)", () => {
  const r = JSON.parse(read(EN)).result || {};
  assert.ok(typeof r["method_letter-number"] === "string" && r["method_letter-number"].length > 0,
    "result.method_letter-number display name must exist");
  assert.ok(typeof r.methodologyVariantLine === "string", "result.methodologyVariantLine must exist");
  // honest naming — must not imply a credential
  assert.ok(!/certificate|credential|IQ certificate/i.test(r["method_letter-number"]),
    "LN methodology name must not imply a credential");
});

test("AC4: an LN difficulty-bands file exists and is consistent with the short pool", () => {
  const bandsPath = join(ITEMS_DIR, "item-difficulty-bands-letter-number.json");
  assert.ok(existsSync(bandsPath), "LN difficulty-bands file must exist");
  const bands = JSON.parse(read(bandsPath));
  const pool = JSON.parse(read(SHORT));
  const ids = new Set(pool.items.map(i => i.id));
  assert.ok(Array.isArray(bands.items) && bands.items.length === pool.items.length,
    "bands must cover every short-pool item");
  for (const b of bands.items) {
    assert.ok(ids.has(b.id), `bands id ${b.id} must be a short-pool item`);
    assert.ok(["easy", "medium", "hard"].includes(b.band), `bands ${b.id} band must be easy|medium|hard`);
  }
});
