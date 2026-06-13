// Story 12-3 — scaffold guard for the short/full variant engine.
// Checks: the methodology-registry resolver (defaults + variant mapping), the
// full geometric pool's schema validity + size, item-runner/result reading
// sessionSize from the registry (no variant-ignoring hardcoded 16), and the
// result methodology/variant line. RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const REGISTRY = join(REPO_ROOT, "src", "assessment", "methodology-registry.js");
const ITEM_RUNNER = join(REPO_ROOT, "src", "assessment", "item-runner.js");
const RESULT = join(REPO_ROOT, "src", "assessment", "result.js");
const FULL_POOL = join(REPO_ROOT, "src", "items", "item-parameters-geometric-full.json");
const ITEMS_DIR = join(REPO_ROOT, "src", "items");
const SCHEMA = join(REPO_ROOT, "corpus", "item-parameters.schema.json");
const EN = join(REPO_ROOT, "src", "content", "i18n", "en", "strings.json");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

test("AC1: methodology-registry resolveVariant defaults to geometric+short (existing pool/size)", async () => {
  assert.ok(existsSync(REGISTRY), "methodology-registry.js must exist");
  const mod = await import(`../../src/assessment/methodology-registry.js?cb=${encodeURIComponent("12-3")}`);
  assert.equal(typeof mod.resolveVariant, "function", "must export resolveVariant");
  const def = mod.resolveVariant(undefined, undefined);
  assert.equal(def.poolUrl, "/src/items/item-parameters.json", "default poolUrl = the existing 16-item pool");
  assert.equal(def.sessionSize, 16, "default sessionSize = 16 (existing short)");
  const short = mod.resolveVariant("geometric", "short");
  assert.equal(short.sessionSize, 16);
  const full = mod.resolveVariant("geometric", "full");
  assert.equal(full.poolUrl, "/src/items/item-parameters-geometric-full.json", "full → the full pool");
  assert.ok(full.sessionSize > 16, "full variant sessionSize must exceed short (more items)");
});

test("AC4: the full geometric pool exists, is schema-valid, has >16 items, and all assets exist", () => {
  const pool = JSON.parse(read(FULL_POOL));
  const schema = JSON.parse(read(SCHEMA));
  // required top-level fields
  for (const k of schema.required) assert.ok(k in pool, `full pool missing required "${k}"`);
  assert.ok(Array.isArray(pool.items) && pool.items.length > 16, "full pool must have >16 items");
  assert.equal(pool.poolSize, pool.items.length, "poolSize must equal items.length");
  const itemReq = schema.properties.items.items.required;
  for (const it of pool.items) {
    for (const k of itemReq) assert.ok(k in it, `item ${it.id || "?"} missing "${k}"`);
    assert.ok(typeof it.a === "number" && it.a >= 0, `item ${it.id} a must be >=0`);
    assert.ok(typeof it.b === "number" && it.b >= -10 && it.b <= 10, `item ${it.id} b in [-10,10]`);
    assert.match(it.asset, /^[a-z0-9-]+\.svg$/, `item ${it.id} asset must be an svg name`);
    assert.ok(existsSync(resolve(ITEMS_DIR, it.asset)), `item ${it.id} asset ${it.asset} must exist on disk`);
    for (const opt of it.options) assert.ok(existsSync(resolve(ITEMS_DIR, opt)), `option ${opt} must exist`);
    assert.ok(it.options.includes(it.correct), `item ${it.id} correct must be one of options`);
  }
});

test("AC4: the full pool spans a wider difficulty range than the 16-item short pool", () => {
  const full = JSON.parse(read(FULL_POOL)).items.map(i => i.b);
  const short = JSON.parse(read(join(ITEMS_DIR, "item-parameters.json"))).items.map(i => i.b);
  const span = (xs) => Math.max(...xs) - Math.min(...xs);
  assert.ok(span(full) >= span(short), "full variant difficulty spread must be >= the short pool's");
});

test("AC2/AC3: item-runner and result resolve sessionSize from the registry (not a fixed 16)", () => {
  const ir = read(ITEM_RUNNER);
  const rs = read(RESULT);
  // Both scenes resolve the pool + session size from the chosen (methodology,
  // variant) via the registry, then USE the resolved size for the live path.
  assert.match(ir, /methodology-registry/, "item-runner must import the methodology-registry");
  assert.match(ir, /resolve(Variant|FromState)/, "item-runner must call the registry resolver");
  assert.match(ir, /cache\.sessionSize/, "item-runner must drive the loop from the resolved cache.sessionSize");
  assert.match(rs, /methodology-registry/, "result must import the methodology-registry");
  assert.match(rs, /resolveFromState/, "result must resolve the variant from state");
  // The live completeness guard + scoring length must use the resolved size,
  // not a fixed literal. (A back-compat default param on the exported
  // computeDifficultyCounts is fine — what matters is the render path resolves.)
  assert.match(rs, /responses\.length\s*!==\s*mv\.sessionSize/, "result completeness guard must use the resolved mv.sessionSize");
  assert.match(rs, /length:\s*mv\.sessionSize/, "result ordered-responses must use the resolved mv.sessionSize");
  // item-runner must not keep a variant-ignoring module-level SESSION_SIZE const.
  assert.ok(
    !/const\s+SESSION_SIZE\s*=\s*16\b/.test(ir),
    "item-runner must not keep a module-level SESSION_SIZE = 16 (resolve per session instead)",
  );
});

test("AC5: the result methodology/variant line key exists in the EN bundle", () => {
  const en = JSON.parse(read(EN));
  const r = en.result || {};
  assert.ok(
    typeof r.methodologyVariantLine === "string" && r.methodologyVariantLine.length > 0,
    "result.methodologyVariantLine must exist (the localized methodology+variant line)",
  );
});

// Resume-correctness for variants (self-found during adversarial verify): the
// in-progress persistence + resume path must round-trip methodology/variant AND
// use the variant-aware session size — otherwise a resumed full (24) or
// letter-number session would refetch the wrong pool / refuse to persist past 16.
test("AC6: session-persistence round-trips methodology/variant + uses a variant-aware size guard", () => {
  const sp = read(join(REPO_ROOT, "src", "assessment", "session-persistence.js"));
  assert.match(sp, /resolveFromState|resolveVariant/, "persistence must resolve the variant's session size");
  assert.ok(
    !/>=\s*SESSION_SIZE\b/.test(sp) && !/const\s+SESSION_SIZE\s*=\s*16\b/.test(sp),
    "persistence must not use a hardcoded SESSION_SIZE=16 completion cutoff (use the resolved size)",
  );
  assert.match(sp, /methodology:\s*state\.methodology/, "saved blob must persist methodology");
  assert.match(sp, /variant:\s*state\.variant/, "saved blob must persist variant");
});

test("AC6: resumeSession restores methodology + variant before navigating to the test", () => {
  const sr = read(join(REPO_ROOT, "src", "assessment", "saved-results.js"));
  assert.match(sr, /setMethodology\(\s*ip\.methodology/, "resume must restore methodology from the saved blob");
  assert.match(sr, /setVariant\(\s*ip\.variant/, "resume must restore variant from the saved blob");
});
