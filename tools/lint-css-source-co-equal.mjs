#!/usr/bin/env node
// tools/lint-css-source-co-equal.mjs
//
// Story 3.5 AC-7 — CSS-AST source lint: asserts the three triplet selectors
// .score-panel__anchor / .score-panel__percentile / .score-panel__band share
// identical font-size, font-weight, font-family declarations at the source.
// Murat tier-1 (epic 6 lint-co-equal-triplet-runtime.spec graduates to runtime).
//
// Stdlib-only (NFR33). Hand-rolled tokenizer sufficient for the narrow scope.
// Test injection: IQME_LINT_TARGET overrides the default file path.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const DEFAULT_TARGET = "src/css/components/score-panel.css";
const TARGET = process.env.IQME_LINT_TARGET || resolve(REPO_ROOT, DEFAULT_TARGET);

const TRIPLET = [".score-panel__anchor", ".score-panel__percentile", ".score-panel__band"];
const PROPS = ["font-size", "font-weight", "font-family"];

function stripComments(css) {
  let out = "";
  let i = 0;
  while (i < css.length) {
    if (css[i] === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
    } else {
      out += css[i];
      i++;
    }
  }
  return out;
}

function parseRules(css) {
  const rules = [];
  const src = stripComments(css);
  let i = 0;
  const n = src.length;
  while (i < n) {
    const open = src.indexOf("{", i);
    if (open === -1) break;
    const close = src.indexOf("}", open);
    if (close === -1) break;
    const selectorList = src.slice(i, open).trim();
    const body = src.slice(open + 1, close);
    if (selectorList) {
      const selectors = selectorList.split(",").map((s) => s.trim()).filter(Boolean);
      const decls = {};
      for (const decl of body.split(";")) {
        const idx = decl.indexOf(":");
        if (idx === -1) continue;
        const prop = decl.slice(0, idx).trim();
        const value = decl.slice(idx + 1).trim();
        if (prop) decls[prop] = value;
      }
      rules.push({ selectors, decls });
    }
    i = close + 1;
  }
  return rules;
}

function selectorBase(sel) {
  // Strip pseudo-class / attribute suffixes — lint scope = base class rule.
  return sel.replace(/[:[].*$/, "");
}

function computeEffective(rules, targetSelector) {
  // Last-write-wins per CSS cascade order within the file.
  const eff = {};
  for (const rule of rules) {
    const matches = rule.selectors.some((s) => selectorBase(s) === targetSelector);
    if (!matches) continue;
    for (const p of PROPS) {
      if (p in rule.decls) eff[p] = rule.decls[p];
    }
  }
  return eff;
}

function main() {
  let css;
  try { css = readFileSync(TARGET, "utf8"); }
  catch (err) {
    process.stderr.write(`BREACH lint-css-source-co-equal: cannot read ${TARGET}: ${err.message}\n`);
    process.exit(1);
  }
  const rules = parseRules(css);
  const effective = {};
  for (const sel of TRIPLET) effective[sel] = computeEffective(rules, sel);

  const breaches = [];

  // Each selector must explicitly set each property (no implicit-inheritance escape).
  for (const sel of TRIPLET) {
    for (const p of PROPS) {
      if (!(p in effective[sel])) {
        breaches.push(`missing declaration: ${sel} does not set ${p} (no implicit-inheritance escape)`);
      }
    }
  }

  // Parity check: each property's value must be identical across the three.
  for (const p of PROPS) {
    const values = TRIPLET.map((s) => effective[s][p]);
    const seen = new Set(values.filter((v) => v !== undefined));
    if (seen.size > 1) {
      const detail = TRIPLET.map((s, i) => `${s}=${values[i] ?? "<unset>"}`).join("; ");
      breaches.push(`${p} divergence: ${detail}`);
    }
  }

  if (breaches.length === 0) {
    process.stdout.write(`lint-css-source-co-equal: ok (${TARGET})\n`);
    process.exit(0);
  }
  for (const b of breaches) {
    process.stderr.write(`BREACH lint-css-source-co-equal: ${b}\n`);
  }
  process.exit(1);
}

main();
