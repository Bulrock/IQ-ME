// Story 14-6 — Acceptance / regression guard for assessment question-to-answer
// RENDERING CORRECTNESS (NOT a visual restyle). AC 1–6 of epics.md §"Story 14.6"
// (PR-24).
//
// Mix of structural source-text checks and live-module behavior checks:
//   - the optional gridRows/gridCols schema fields + the four stub pools still
//     validating under additionalProperties:false;
//   - resolveGrid's 3x3 default + per-item read (live import of the registry);
//   - the renderer exposing data-grid-cols additively (source text);
//   - the explicit .item-runner__option input:focus-visible token-only keyboard
//     indicator + state-distinct registers (source text);
//   - the augmentation regression guard (options never transformed; the matrix
//     carries the transform; correct answer matched by raw filename);
//   - the frozen Epic 11/13 DOM contract markers unchanged in item-runner.js.
//
// The RENDERED visual-regression baselines + the live ±5% option/cell scale
// parity (Playwright pr2-mobile-layout.spec.mjs) run on ubuntu-latest CI /
// Story 14.11 — the authoring host is darwin. This file is the source-text +
// schema + live-default acceptance guard that RUNS locally in `make test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { validateItemParameters } from "../contract/_item-parameters-schema-check.mjs";
import { resolveGrid } from "../../src/assessment/methodology-registry.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const r = (...p) => {
  const f = join(REPO_ROOT, ...p);
  assert.ok(existsSync(f), `missing file: ${f}`);
  return readFileSync(f, "utf8");
};
const readJson = (...p) => JSON.parse(r(...p));

const STUB_POOLS = [
  ["src", "items", "item-parameters.json"],
  ["src", "items", "item-parameters-geometric-full.json"],
  ["src", "items", "item-parameters-letter-number.json"],
  ["src", "items", "item-parameters-letter-number-full.json"],
];

// Two-layer rule (UX-DR1): item-runner.css consumes ONLY semantic roles — never
// a --glass-* / --color-neutral-* primitive, never a literal hex glass value.
const FORBIDDEN_PRIMITIVE_RE = /var\(--glass-[a-z-]+\)|var\(--color-neutral-[0-9]+\)/;

// ─── AC2 (schema): gridRows/gridCols are OPTIONAL integers ──────────────────

test("AC2: schema declares gridRows/gridCols as OPTIONAL integer item properties (not in required)", () => {
  const schema = readJson("corpus", "item-parameters.schema.json");
  const itemProps = schema.properties.items.items.properties;
  for (const key of ["gridRows", "gridCols"]) {
    assert.ok(itemProps[key], `the schema must declare an item.${key} property`);
    assert.equal(itemProps[key].type, "integer", `item.${key} must be an integer`);
    assert.equal(itemProps[key].minimum, 1, `item.${key} must require minimum 1`);
  }
  // CRITICAL: they MUST be optional so the omitting stub pools keep validating
  // under additionalProperties:false.
  const required = schema.properties.items.items.required;
  assert.ok(!required.includes("gridRows"), "gridRows must NOT be required (stub pools omit it)");
  assert.ok(!required.includes("gridCols"), "gridCols must NOT be required (stub pools omit it)");
  // additionalProperties:false must still be enforced.
  assert.equal(schema.properties.items.items.additionalProperties, false, "item additionalProperties must stay false");
});

// ─── AC2 (pools): the four stub pools STILL validate under the new schema ────

test("AC2: all four stub pools still validate under additionalProperties:false with the new optional fields", () => {
  const schema = readJson("corpus", "item-parameters.schema.json");
  for (const p of STUB_POOLS) {
    const pool = readJson(...p);
    const { valid, errors } = validateItemParameters(pool, schema);
    assert.equal(valid, true, `${p.join("/")} must still validate:\n  ${errors.join("\n  ")}`);
  }
});

test("AC2: the four stub pools OMIT gridRows/gridCols (so they exercise the 3x3 default path)", () => {
  for (const p of STUB_POOLS) {
    const pool = readJson(...p);
    for (const item of pool.items) {
      assert.ok(!("gridRows" in item), `${p.join("/")} item ${item.id} should omit gridRows (default path)`);
      assert.ok(!("gridCols" in item), `${p.join("/")} item ${item.id} should omit gridCols (default path)`);
    }
  }
});

// ─── AC2 (default): resolveGrid reads the item and DEFAULTS to 3x3 ──────────

test("AC2: resolveGrid defaults to 3x3 when the item omits its grid, and reads explicit dimensions when present", () => {
  // Absent → 3x3 default (the four stub pools rely on this — never re-assumed inline).
  assert.deepEqual(resolveGrid({}), { rows: 3, cols: 3 }, "missing grid must default to 3x3");
  assert.deepEqual(resolveGrid(undefined), { rows: 3, cols: 3 }, "undefined item must default to 3x3");
  // Explicit → forwarded verbatim (the per-item source of truth).
  assert.deepEqual(resolveGrid({ gridRows: 4, gridCols: 5 }), { rows: 4, cols: 5 }, "explicit grid must be forwarded");
  // Invalid / non-integer / <1 → falls back to 3 (defensive).
  assert.deepEqual(resolveGrid({ gridRows: 0, gridCols: -2 }), { rows: 3, cols: 3 }, "out-of-range grid must fall back to 3");
  assert.deepEqual(resolveGrid({ gridCols: 2.5 }), { rows: 3, cols: 3 }, "non-integer grid must fall back to 3");
});

// ─── AC1 (expose): the renderer exposes the column count to the DOM additively ─

test("AC1: item-runner.js reads the grid via resolveGrid and exposes data-grid-cols/data-grid-rows on the section (no inline 3x3)", () => {
  const js = r("src", "assessment", "item-runner.js");
  assert.match(js, /import\s*\{[^}]*\bresolveGrid\b[^}]*\}\s*from\s*"\.\/methodology-registry\.js"/, "item-runner.js must import resolveGrid from the registry (single source of grid truth)");
  assert.match(js, /resolveGrid\(item\)/, "item-runner.js must read the grid via resolveGrid(item)");
  assert.match(js, /data-grid-cols="/, "the section must expose data-grid-cols so the rendered-scale verification can compute the matrix-cell edge");
  assert.match(js, /data-grid-rows="/, "the section must also expose data-grid-rows");
  // It must NOT silently re-assume a literal 3x3 inline (e.g. `/ 3` cell math or a hardcoded grid object).
  assert.doesNotMatch(js, /gridCols\s*[:=]\s*3\b/, "item-runner.js must not hardcode gridCols = 3 inline (read from the item via the registry)");
});

// ─── AC1 (frozen DOM contract): Epic 11/13 markers unchanged ────────────────

test("AC1: frozen Epic 11/13 DOM contract preserved — section/heading/fieldset + radio name/value names + values unchanged (additive only)", () => {
  const js = r("src", "assessment", "item-runner.js");
  assert.match(js, /<section class="item-runner" aria-labelledby="item-runner-heading"/, "section.item-runner + aria-labelledby must be unchanged");
  assert.match(js, /id="item-runner-heading"/, "#item-runner-heading must be unchanged");
  assert.match(js, /<fieldset class="item-runner__options">/, "fieldset.item-runner__options must be unchanged");
  // The radio group name is the frozen `item-<N>` form and value is the raw option string.
  assert.match(js, /name="item-' \+ N/, "the radio group name attribute (item-<N>) must be unchanged");
  assert.match(js, /value="' \+ esc\(opt\)/, "the radio value attribute (raw option filename) must be unchanged");
});

// ─── AC4 (augmentation regression guard) ────────────────────────────────────

test("AC4: augmentation transforms the MATRIX only (data-augmentation on .item-runner__image) — options are never transformed", () => {
  const css = r("src", "css", "components", "item-runner.css");
  // Every transform rule keyed on data-augmentation must target the matrix image.
  const augRules = css.match(/[^\n]*\[data-augmentation="[a-z0-9-]+"\][^\n]*transform/g) || [];
  assert.ok(augRules.length >= 6, `expected the full augmentation transform set (none/rot90/rot180/rot270/flip-h/flip-v); found ${augRules.length}`);
  for (const rule of augRules) {
    assert.match(rule, /\.item-runner__image\[data-augmentation=/, `augmentation transform must target the matrix image only, not an option: ${rule.trim()}`);
  }
  // The option figure/image must NOT carry a transform — keeps every candidate
  // visually equivalent to its source SVG so scoring by raw filename stays valid.
  assert.doesNotMatch(css, /\.item-runner__option-image[^{]*\{[^}]*transform:/, "option images must NEVER receive a transform (would break filename-keyed scoring)");
  assert.doesNotMatch(css, /\.item-runner__option-figure[^{]*\{[^}]*transform:/, "option figures must NEVER receive a transform");
});

test("AC4: the correct answer stays matched by raw filename (value === item.correct) — scoring is NOT re-keyed to an augmented identity", () => {
  const js = r("src", "assessment", "item-runner.js");
  // The scoring match is purely the raw option value vs item.correct (a filename
  // string). If options ever DO receive augmentation, this raw-filename match
  // becomes wrong and must be re-keyed — this guard pins the current contract so
  // such a change fails loudly here rather than silently mis-scoring.
  assert.match(js, /value === item\.correct \? 1 : 0/, "scoring must match the raw selected option value against item.correct (filename-keyed; unchanged)");
  // The matrix render path forwards the seed-determined augmentation onto the
  // matrix image attribute — options carry no augmentation attribute at all.
  assert.match(js, /class="item-runner__image"[\s\S]*?data-augmentation="/, "the augmentation must be applied to the matrix image attribute");
  assert.doesNotMatch(js, /item-runner__option-image[^\n]*data-augmentation/, "option images must carry NO data-augmentation attribute (options are never augmented)");
});

// ─── AC3 (CSS): explicit keyboard focus indicator + state-distinct registers ─

test("AC3: item-runner.css adds an explicit .item-runner__option input:focus-visible keyboard indicator using only --color-focus-ring (not the browser default)", () => {
  const css = r("src", "css", "components", "item-runner.css");
  assert.match(
    css,
    /\.item-runner__option input:focus-visible\s*\{[\s\S]*?outline:\s*var\(--space-1\) solid var\(--color-focus-ring\)/,
    "an explicit .item-runner__option input:focus-visible outline ring using --color-focus-ring must exist (token-only, not the browser default)",
  );
});

test("AC3: selected / focus / hover / disabled / unselected are visually distinct (not by colour alone — WCAG 1.4.1)", () => {
  const css = r("src", "css", "components", "item-runner.css");
  // Selected carries a SHAPE cue (heavier inline-start marker), not just a hue —
  // so it is distinguishable from the focus/hover registers without colour.
  assert.match(css, /\.item-runner__option:has\(input:checked\)\s*\{[\s\S]*?border-inline-start-width:\s*var\(--space-2\)/, "the selected tile must carry a heavier inline-start marker (shape cue, not colour alone)");
  // Hover + focus-within each still paint.
  assert.match(css, /\.item-runner__option:hover\s*\{/, "the hover register must exist");
  assert.match(css, /\.item-runner__option:focus-within\s*\{/, "the focus-within register must exist");
  // Disabled is distinguished by reduced affordance (cursor:not-allowed), not colour alone.
  assert.match(css, /\.item-runner__option:has\(input:disabled\)\s*\{[\s\S]*?cursor:\s*not-allowed/, "the disabled register must carry a non-colour affordance cue (cursor:not-allowed)");
});

test("AC3: option images keep aspect-ratio 1/1 fidelity (no stretch/clip)", () => {
  const css = r("src", "css", "components", "item-runner.css");
  assert.match(css, /\.item-runner__option-figure\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1/, "the option figure must keep aspect-ratio 1/1");
  assert.match(css, /\.item-runner__option-image\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1/, "the option image must keep aspect-ratio 1/1");
  assert.match(css, /\.item-runner__image\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1/, "the matrix image must keep aspect-ratio 1/1");
});

test("AC3: item-runner.css consumes only semantic roles — NO --glass-*/--color-neutral-* primitive, NO literal hex (two-layer rule)", () => {
  const css = r("src", "css", "components", "item-runner.css");
  assert.doesNotMatch(css, FORBIDDEN_PRIMITIVE_RE, "item-runner.css must not reference a --glass-*/--color-neutral-* primitive");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "item-runner.css must not contain a literal hex colour");
});

// ─── AC2 (NFR27 parity): the new fields are language-neutral numeric metadata ─

test("AC2/NFR27: gridRows/gridCols are language-neutral numeric metadata — no EN prose introduced into the schema", () => {
  const schema = readJson("corpus", "item-parameters.schema.json");
  const grid = [schema.properties.items.items.properties.gridRows, schema.properties.items.items.properties.gridCols];
  for (const g of grid) {
    // Numeric only — no string/enum/prose default that would seed an EN stem and
    // trigger a sourceHashEN parity cascade (NFR27).
    assert.equal(g.type, "integer", "grid dimensions must be purely numeric (language-neutral)");
    assert.equal("default" in g, false, "grid dimensions must carry no schema default prose");
  }
});
