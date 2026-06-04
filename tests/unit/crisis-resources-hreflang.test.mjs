// Unit tests for Story 7.7 — RU + PL crisis-resource lists (honest pending
// placeholders) + per-locale crisis loading (no EN fallback, FR20) + hreflang
// declarations on every methodology page (FR31).
//
// RED PHASE: authored before implementation; these MUST fail now.
//   - src/content/crisis-resources/{ru,pl}.json do not exist yet
//   - src/assessment/crisis-resources-url.js does not exist yet
//   - src/assessment/result.js still hardcodes fetch("/src/content/crisis-resources/en.json")
//   - tools/build-methodology.mjs does not yet emit <link rel="alternate" hreflang=…>
//
// Assertions are structural/behavioral against real repo paths (no fixtures).
// The crisis schema is checked with a minimal stdlib validator (the same shape
// the schema declares). RU/PL are asserted DIRECTLY — nothing is derived from
// en (a distressed-user safety surface must be verified per-locale, not mirrored).
//
// Pure stdlib (NFR33): node:test, node:assert/strict, node:fs, node:os,
// node:path, node:url, node:child_process. ESM .mjs.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, relative, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");

const CRISIS_DIR = resolve(REPO_ROOT, "src/content/crisis-resources");
const SCHEMA_PATH = join(CRISIS_DIR, "crisis-resources.schema.json");
const RESULT_JS = resolve(REPO_ROOT, "src/assessment/result.js");
const CRISIS_URL_HELPER = resolve(REPO_ROOT, "src/assessment/crisis-resources-url.js");
const BUILD_SCRIPT = resolve(REPO_ROOT, "tools/build-methodology.mjs");
const METHODOLOGY_ROOT = resolve(REPO_ROOT, "src/content/methodology");
const EN_METHODOLOGY_ROOT = join(METHODOLOGY_ROOT, "en");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^(https?:|tel:)/;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// Minimal stdlib validator covering the contract crisis-resources.schema.json
// declares (locale enum, lastUpdated date, resources minItems 3, each with
// non-empty name/description, url ^(https?:|tel:), lastVerified date). Returns
// an array of violation strings (empty = valid).
function validateCrisisShape(data, expectedLocale) {
  const errs = [];
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return ["root is not an object"];
  }
  if (data.locale !== expectedLocale) {
    errs.push(`locale=${JSON.stringify(data.locale)} expected ${JSON.stringify(expectedLocale)}`);
  }
  if (!["en", "ru", "pl"].includes(data.locale)) {
    errs.push(`locale ${JSON.stringify(data.locale)} not in enum [en,ru,pl]`);
  }
  if (typeof data.lastUpdated !== "string" || !DATE_RE.test(data.lastUpdated)) {
    errs.push(`lastUpdated ${JSON.stringify(data.lastUpdated)} must match YYYY-MM-DD`);
  }
  if (!Array.isArray(data.resources)) {
    errs.push("resources must be an array");
    return errs;
  }
  if (data.resources.length < 3) {
    errs.push(`resources length ${data.resources.length} < minItems 3`);
  }
  data.resources.forEach((r, i) => {
    if (r === null || typeof r !== "object" || Array.isArray(r)) {
      errs.push(`resources[${i}] is not an object`);
      return;
    }
    if (typeof r.name !== "string" || r.name.length < 1) {
      errs.push(`resources[${i}].name must be a non-empty string`);
    }
    if (typeof r.description !== "string" || r.description.length < 1) {
      errs.push(`resources[${i}].description must be a non-empty string`);
    }
    if (typeof r.url !== "string" || !URL_RE.test(r.url)) {
      errs.push(`resources[${i}].url ${JSON.stringify(r.url)} must match ^(https?:|tel:)`);
    }
    if (typeof r.lastVerified !== "string" || !DATE_RE.test(r.lastVerified)) {
      errs.push(`resources[${i}].lastVerified ${JSON.stringify(r.lastVerified)} must match YYYY-MM-DD`);
    }
  });
  return errs;
}

// Walk *.md files under dir (skip dotfiles), repo-relative-to-root POSIX paths,
// sorted for determinism. Mirrors build-methodology.mjs walkMd().
function walkMdRel(root) {
  const out = [];
  function rec(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      if (e.code === "ENOENT") return;
      throw e;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) rec(p);
      else if (e.isFile() && e.name.endsWith(".md")) {
        out.push(relative(root, p).split("\\").join("/"));
      }
    }
  }
  rec(root);
  out.sort();
  return out;
}

// ─── AC-1: RU + PL crisis-resources honest placeholders ───────────────────

for (const locale of ["ru", "pl"]) {
  const localePath = join(CRISIS_DIR, `${locale}.json`);

  test(`7.7 AC-1: src/content/crisis-resources/${locale}.json exists`, () => {
    assert.ok(
      existsSync(localePath),
      `expected ${locale}.json to exist at ${localePath}`,
    );
  });

  test(`7.7 AC-1: ${locale}.json is schema-valid (locale/lastUpdated/>=3 resources)`, () => {
    const data = readJson(localePath);
    const errs = validateCrisisShape(data, locale);
    assert.deepEqual(errs, [], `${locale}.json schema violations:\n${errs.join("\n")}`);
  });

  test(`7.7 AC-1: ${locale}.json _doc marks the list pending (Gate-9c/9d reviewer-of-record)`, () => {
    const data = readJson(localePath);
    assert.equal(typeof data._doc, "string", `${locale}.json must carry a string _doc marker`);
    assert.match(
      data._doc,
      /pending|Gate[ -]?9|reviewer[ -]?of[ -]?record/i,
      `${locale}.json _doc must mark the list as a pending placeholder awaiting the Gate-9c/9d reviewer-of-record`,
    );
  });

  test(`7.7 AC-1 SAFETY: ${locale}.json fabricates NO tel: hotline numbers (https directories + pending entry only)`, () => {
    const data = readJson(localePath);
    const telEntries = (data.resources || []).filter(
      (r) => typeof r.url === "string" && /^tel:/i.test(r.url),
    );
    assert.deepEqual(
      telEntries.map((r) => r.url),
      [],
      `${locale}.json placeholder MUST NOT invent national hotline numbers; ` +
        `a wrong tel: is catastrophic for a distressed user. Use https: directories ` +
        `+ an explicit pending-vetting entry instead.`,
    );
    // At least some entry must be an https: directory link (so the placeholder
    // genuinely routes the user somewhere, not just an empty pending note).
    const httpsEntries = (data.resources || []).filter(
      (r) => typeof r.url === "string" && /^https?:/i.test(r.url),
    );
    assert.ok(
      httpsEntries.length >= 1,
      `${locale}.json must reference at least one https: international crisis-line directory`,
    );
  });
}

// ─── AC-2: pure helper + result.js coupling (mirror 7.6) ──────────────────
//
// render() is browser-coupled (fetch + DOM), so the per-locale crisis URL
// construction is factored into a pure helper crisisResourcesUrl(locale) in
// src/assessment/crisis-resources-url.js. We verify the helper BEHAVIORALLY
// (each locale → its own path) AND that result.js fetches crisis THROUGH the
// helper (so a dead/unused interpolated string + a still-hardcoded EN fetch
// cannot pass). Together these close the dead-string gap.

test("7.7 AC-2: crisisResourcesUrl(locale) maps each locale to its own crisis path", async () => {
  assert.ok(existsSync(CRISIS_URL_HELPER), `expected helper at ${CRISIS_URL_HELPER}`);
  const mod = await import(pathToFileURL(CRISIS_URL_HELPER).href);
  assert.equal(
    typeof mod.crisisResourcesUrl,
    "function",
    "must export crisisResourcesUrl(locale)",
  );
  assert.match(mod.crisisResourcesUrl("ru"), /\/crisis-resources\/ru\.json$/);
  assert.match(mod.crisisResourcesUrl("pl"), /\/crisis-resources\/pl\.json$/);
  assert.match(mod.crisisResourcesUrl("en"), /\/crisis-resources\/en\.json$/);
});

test("7.7 AC-2: result.js fetches crisis THROUGH crisisResourcesUrl (no hardcoded EN literal)", () => {
  const src = readFileSync(RESULT_JS, "utf8");
  // The bare hardcoded EN crisis fetch must be gone…
  assert.doesNotMatch(
    src,
    /fetch\(\s*["'`]\/src\/content\/crisis-resources\/en\.json["'`]\s*\)/,
    'result.js must not hardcode fetch("/src/content/crisis-resources/en.json")',
  );
  // …and the crisis fetch must go THROUGH the helper (defeats a dead, unused
  // interpolated string sitting next to a hardcoded EN fetch).
  assert.match(
    src,
    /fetch\(\s*crisisResourcesUrl\(/,
    "result.js must fetch crisis resources via crisisResourcesUrl(...)",
  );
});

test("7.7 AC-2: result.js crisis fetch is locale-driven with NO EN fallback (FR20)", () => {
  const src = readFileSync(RESULT_JS, "utf8");
  // The crisis fetch must be driven by the active locale variable, not a
  // hardcoded "en" literal. Robust check: crisisResourcesUrl is called with the
  // locale variable somewhere in the source.
  assert.match(
    src,
    /crisisResourcesUrl\(\s*locale\s*\)/,
    "result.js crisis fetch must pass the active `locale` variable to crisisResourcesUrl",
  );
  // FR20: NO English fallback for the crisis fetch — there must be no second
  // crisis fetch to a hardcoded en (neither crisisResourcesUrl("en") nor the
  // bare en.json literal). RU/PL sessions must never cross-load EN crisis data.
  assert.doesNotMatch(
    src,
    /crisisResourcesUrl\(\s*["'`]en["'`]\s*\)/,
    'result.js must NOT have a crisisResourcesUrl("en") fallback (FR20: no EN crisis fallback for non-EN)',
  );
  assert.doesNotMatch(
    src,
    /["'`]\/src\/content\/crisis-resources\/en\.json["'`]/,
    "result.js must not reference the en crisis JSON literal anywhere (FR20)",
  );
});

// ─── AC-3: hreflang on every methodology page (FR31) ──────────────────────
//
// hreflang changes the built <head> of every methodology page. We build the
// corpus to a throwaway dist via the build-methodology env overrides
// (IQME_BUILD_METHODOLOGY_OUT + IQME_CORPUS_VERSION), then read a
// deterministically-sampled built EN page and assert its <head> declares
// rel="alternate" hreflang for en/ru/pl with hrefs pointing at the per-locale
// versioned permalink for the SAME page directory.

const EN_PAGES = walkMdRel(EN_METHODOLOGY_ROOT);

test("7.7 AC-3 fixture: EN methodology corpus is non-empty", () => {
  assert.ok(
    EN_PAGES.length > 0,
    `expected EN methodology pages under ${EN_METHODOLOGY_ROOT}; found none`,
  );
});

test("7.7 AC-3: built methodology page <head> declares hreflang en/ru/pl with per-locale hrefs", () => {
  assert.ok(EN_PAGES.length > 0, "no EN pages to sample from");
  // Deterministic sample: first EN page in sorted order.
  const sampleRel = EN_PAGES[0];
  // Directory permalink path: drop .md, drop a trailing /index (canonicalUrlFor
  // contract). e.g. "foo/index.md" → "foo"; "bar.md" → "bar".
  const noExt = sampleRel.replace(/\.md$/, "");
  const dirPath = noExt.endsWith("/index") ? noExt.slice(0, -"/index".length) : noExt;

  const outDir = mkdtempSync(join(tmpdir(), "crisis-hreflang-build-"));
  try {
    const version = "v0.1.0";
    const r = spawnSync("node", [BUILD_SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        IQME_BUILD_METHODOLOGY_OUT: outDir,
        IQME_CORPUS_VERSION: version,
      },
    });
    assert.equal(
      r.status,
      0,
      `build-methodology exited ${r.status}; stderr: ${r.stderr}; stdout: ${r.stdout}`,
    );

    const htmlRel = sampleRel.replace(/\.md$/, ".html");
    const htmlPath = join(outDir, version, "en", htmlRel);
    assert.ok(
      existsSync(htmlPath),
      `expected built EN HTML at ${htmlPath} (page ${sampleRel} not rendered); build stdout: ${r.stdout}`,
    );

    const html = readFileSync(htmlPath, "utf8");
    const head = html.slice(0, html.indexOf("</head>"));
    assert.ok(head.length > 0, "could not isolate <head> of the built page");

    for (const L of ["en", "ru", "pl"]) {
      const expectedHref = `/methodology/${version}/${L}/${dirPath}/`;
      // A <link rel="alternate" hreflang="L" href="…/<locale>/<dirPath>/"> in <head>.
      const re = new RegExp(
        `<link[^>]*rel="alternate"[^>]*hreflang="${L}"[^>]*href="${expectedHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
      );
      const reLoose = new RegExp(
        `<link[^>]*hreflang="${L}"[^>]*href="[^"]*\\/methodology\\/${version}\\/${L}\\/${dirPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/"`,
      );
      assert.ok(
        re.test(head) || reLoose.test(head),
        `built page ${sampleRel} <head> must declare ` +
          `<link rel="alternate" hreflang="${L}" href="${expectedHref}">; head was:\n${head}`,
      );
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
