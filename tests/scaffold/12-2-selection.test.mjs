// Story 12-2 — scaffold guard for the pre-test methodology + variant selection.
// Structural checks: routing registration of #/selection, the selection i18n
// namespace present in all three locales, state v2 (version + methodology +
// variant) in schema + state.js, and the selection-scene.css index.html link.
//
// Authored in test-author phase (frozen during specialist impl). RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const ROUTING = join(REPO_ROOT, "src", "assessment", "routing.js");
const SELECTION = join(REPO_ROOT, "src", "assessment", "selection.js");
const STATE = join(REPO_ROOT, "src", "assessment", "state.js");
const SCHEMA = join(REPO_ROOT, "src", "assessment", "state.schema.json");
const INDEX = join(REPO_ROOT, "src", "index.html");
const CSS = join(REPO_ROOT, "src", "css", "components", "selection-scene.css");
const I18N = (lang) => join(REPO_ROOT, "src", "content", "i18n", lang, "strings.json");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

test("AC1: routing.js registers the #/selection route + NS namespace", () => {
  const js = read(ROUTING);
  assert.match(js, /import \* as selection from "\.\/selection\.js"/, "routing must import selection scene");
  assert.match(js, /"#\/selection"\s*:\s*selection/, "ROUTES must map #/selection → selection");
  assert.match(js, /selection:\s*\[/, "NS map must declare a selection namespace key list");
});

test("AC1: selection.js exists and exports render + unmount (scene contract)", () => {
  const js = read(SELECTION);
  assert.match(js, /export function render\b/, "selection.js must export render");
  assert.match(js, /export function unmount\b/, "selection.js must export unmount");
  assert.ok(!/^export\s+default\b/m.test(js), "no default export");
});

test("AC2: state.schema.json is migrated to v2 (version required + methodology/variant optional)", () => {
  const raw = read(SCHEMA);
  const schema = JSON.parse(raw);
  assert.match(schema.$id, /v2/, "schema $id must signal v2");
  assert.ok(schema.required.includes("version"), "v2 must require a version field");
  assert.equal(schema.additionalProperties, false, "additionalProperties:false must be preserved");
  assert.ok(schema.properties.version, "schema must declare version property");
  assert.ok(schema.properties.methodology, "schema must declare methodology property");
  assert.ok(schema.properties.variant, "schema must declare variant property");
  // variant must be a short|full enum
  assert.deepEqual(
    [...(schema.properties.variant.enum || [])].sort(),
    ["full", "short"],
    "variant enum must be short|full",
  );
});

test("AC2: state.js exposes version + methodology/variant mutators in the snapshot", () => {
  const js = read(STATE);
  assert.match(js, /version/, "state.js must carry a version field");
  assert.match(js, /export function setMethodology\b/, "state.js must export setMethodology");
  assert.match(js, /export function setVariant\b/, "state.js must export setVariant");
});

test("AC4: the selection i18n namespace exists in all three locales", () => {
  for (const lang of ["en", "ru", "pl"]) {
    const bundle = JSON.parse(read(I18N(lang)));
    assert.ok(bundle.selection, `${lang}/strings.json must declare a selection namespace`);
    for (const key of ["heading", "continueButton", "methodologyLegend", "variantLegend"]) {
      assert.ok(
        typeof bundle.selection[key] === "string" && bundle.selection[key].length > 0,
        `${lang} selection.${key} must be a non-empty string`,
      );
    }
  }
});

test("AC4: every selection NS key declared in routing.js exists in the EN bundle (coverage contract)", () => {
  // selection.js uses the idiomatic NS-map string-passing pattern (like
  // landing/consent): routing.js declares the selection key list and resolves
  // them via localeLoader.get(ns + "." + k). The real coverage contract is that
  // every declared NS key exists in the EN bundle (a missing key renders as the
  // bare key literal — architecture's "highly visible failure"). Assert that.
  const routing = read(ROUTING);
  const m = routing.match(/selection:\s*\[([^\]]*)\]/);
  assert.ok(m, "routing.js must declare a selection NS key list");
  const keys = m[1].match(/"([^"]+)"|'([^']+)'/g)?.map(s => s.slice(1, -1)) ?? [];
  assert.ok(keys.length >= 8, `selection NS should declare the scene's keys (got ${keys.length})`);
  const en = JSON.parse(read(I18N("en"))).selection || {};
  for (const k of keys) {
    assert.ok(Object.prototype.hasOwnProperty.call(en, k), `routing NS selection.${k} absent from EN bundle`);
  }
});

test("AC5: index.html links selection-scene.css in alphabetical component order", () => {
  assert.ok(existsSync(CSS), "selection-scene.css must exist");
  const html = read(INDEX);
  assert.match(html, /href="\/src\/css\/components\/selection-scene\.css"/, "index.html must link selection-scene.css");
  const re = /<link\b[^>]*\bhref="(\/src\/css\/components\/[^"]+\.css)"/g;
  const names = [];
  for (const m of html.matchAll(re)) names.push(basename(m[1], ".css"));
  const sorted = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  assert.deepEqual(names, sorted, "component CSS <link> block must stay alphabetical");
});

test("AC3: landing.js navigates to selection (new flow)", () => {
  const js = read(join(REPO_ROOT, "src", "assessment", "landing.js"));
  assert.match(js, /navigate\(\s*["']selection["']\s*\)/, "landing Start button must navigate to selection");
});
