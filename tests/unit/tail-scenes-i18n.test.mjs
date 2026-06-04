// Unit tests for Story 7.6 — RU + PL tail-scene clinical-register copy
// (per-locale loading infra + EN-placeholder scaffolds, infra-now).
//
// RED PHASE: these tests are authored before implementation and MUST fail.
//   - src/content/i18n/{ru,pl}/tail-scenes.json do not exist yet
//   - src/assessment/result.js still hardcodes the EN tail-scenes fetch
//   - docs/launch-readiness/{ru,pl}-translator-signoff.md do not exist yet
//
// Assertions are structural/behavioral against real repo paths (no fixtures):
// these paths MUST exist post-implementation, so reading them directly is the
// observable AC surface. The EN scene-key set is derived from en/tail-scenes.json
// (never hardcoded) so the parity check tracks the real template.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");

const I18N = resolve(REPO_ROOT, "src/content/i18n");
const EN_PATH = resolve(I18N, "en/tail-scenes.json");
const RESULT_JS = resolve(REPO_ROOT, "src/assessment/result.js");
const LAUNCH = resolve(REPO_ROOT, "docs/launch-readiness");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// Collect the full set of "scenes.<scene>.<field>" leaf keys from the EN
// template so parity is measured against the real structure, including
// bottom-decile.silentCompanionLine, mid-band, and top-decile.
function sceneLeafKeys(obj) {
  const scenes = (obj && obj.scenes) || {};
  const keys = [];
  for (const scene of Object.keys(scenes)) {
    const fields = scenes[scene] && typeof scenes[scene] === "object" ? scenes[scene] : {};
    for (const field of Object.keys(fields)) keys.push(`${scene}.${field}`);
  }
  return keys.sort();
}

const EN = readJson(EN_PATH);
const EN_SCENE_KEYS = sceneLeafKeys(EN);

// ─── AC-1: RU + PL tail-scenes.json EN-placeholder parity ────────────────

for (const locale of ["ru", "pl"]) {
  const localePath = resolve(I18N, locale, "tail-scenes.json");

  test(`7.6 AC-1: ${locale}/tail-scenes.json exists`, () => {
    assert.ok(
      existsSync(localePath),
      `expected ${locale}/tail-scenes.json to exist at ${localePath}`,
    );
  });

  test(`7.6 AC-1: ${locale}/tail-scenes.json has same scene keys as EN`, () => {
    const data = readJson(localePath);
    const keys = sceneLeafKeys(data);
    assert.deepEqual(
      keys,
      EN_SCENE_KEYS,
      `${locale} scene-leaf keys must match EN exactly (incl. ` +
        `bottom-decile.heading/copy/silentCompanionLine, mid-band, top-decile)`,
    );
    // Spot-check the load-bearing leaves are present (guards against EN itself
    // regressing to a smaller key-set that would trivially pass deepEqual).
    for (const must of [
      "bottom-decile.heading",
      "bottom-decile.copy",
      "bottom-decile.silentCompanionLine",
      "mid-band.copy",
      "top-decile.copy",
    ]) {
      assert.ok(keys.includes(must), `${locale} must include scene leaf ${must}`);
    }
  });

  test(`7.6 AC-1: ${locale}/tail-scenes.json clinicalRegisterReviewed === false`, () => {
    const data = readJson(localePath);
    assert.equal(
      data.clinicalRegisterReviewed,
      false,
      `${locale} clinicalRegisterReviewed must be false (no faked sign-off)`,
    );
  });

  test(`7.6 AC-1: ${locale}/tail-scenes.json _meta.translationStatus === "in-progress"`, () => {
    const data = readJson(localePath);
    assert.ok(data._meta && typeof data._meta === "object", `${locale} must have _meta object`);
    assert.equal(
      data._meta.translationStatus,
      "in-progress",
      `${locale} _meta.translationStatus must be "in-progress"`,
    );
  });

  test(`7.6 AC-1: ${locale}/tail-scenes.json reviewer matches @TBD-${locale}-clinical-register`, () => {
    const data = readJson(localePath);
    assert.match(
      String(data.reviewer || ""),
      new RegExp(`@TBD-${locale}-clinical-register`),
      `${locale} reviewer handle must be @TBD-${locale}-clinical-register`,
    );
    assert.equal(data.locale, locale, `${locale} locale field must be "${locale}"`);
  });
}

// ─── AC-2: per-locale tail-scenes loading + EN fallback ───────────────────
//
// render() is browser-coupled (fetch + DOM), so the per-locale URL construction
// is factored into a pure, unit-testable helper `tailScenesUrl(locale)` in
// src/assessment/tail-scenes-url.js. We verify the helper BEHAVIORALLY (it maps
// each locale to its own path) AND that result.js actually fetches tail-scenes
// THROUGH the helper (so a dead/unused interpolated string + a still-hardcoded
// EN fetch cannot pass). The two together close the dead-string gap.

const TAIL_SCENES_URL = resolve(REPO_ROOT, "src/assessment/tail-scenes-url.js");

test("7.6 AC-2: tailScenesUrl(locale) maps each locale to its own tail-scenes path", async () => {
  assert.ok(existsSync(TAIL_SCENES_URL), `expected helper at ${TAIL_SCENES_URL}`);
  const mod = await import(pathToFileURL(TAIL_SCENES_URL).href);
  assert.equal(typeof mod.tailScenesUrl, "function", "must export tailScenesUrl(locale)");
  assert.match(mod.tailScenesUrl("ru"), /\/src\/content\/i18n\/ru\/tail-scenes\.json$/);
  assert.match(mod.tailScenesUrl("pl"), /\/src\/content\/i18n\/pl\/tail-scenes\.json$/);
  assert.match(mod.tailScenesUrl("en"), /\/src\/content\/i18n\/en\/tail-scenes\.json$/);
});

test("7.6 AC-2: result.js fetches tail-scenes THROUGH tailScenesUrl (active locale, not hardcoded EN)", () => {
  const src = readFileSync(RESULT_JS, "utf8");
  // The bare hardcoded EN tail-scenes fetch must be gone…
  assert.doesNotMatch(
    src,
    /fetch\(\s*["'`]\/src\/content\/i18n\/en\/tail-scenes\.json["'`]\s*\)/,
    'result.js must not hardcode fetch("/src/content/i18n/en/tail-scenes.json")',
  );
  // …and the tail-scenes fetch must go THROUGH the helper (defeats a dead,
  // unused interpolated string sitting next to a hardcoded EN fetch).
  assert.match(
    src,
    /fetch\(\s*tailScenesUrl\(/,
    "result.js must fetch tail-scenes via tailScenesUrl(...)",
  );
  // …fed by the active locale from state.
  assert.match(
    src,
    /state\.getState\(\)\.locale/,
    "result.js must derive the active locale from state.getState().locale",
  );
});

test("7.6 AC-2: result.js retains an EN fallback for tail-scenes", () => {
  const src = readFileSync(RESULT_JS, "utf8");
  // A fallback to the EN locale: either tailScenesUrl("en") or a `|| "en"` guard.
  assert.match(
    src,
    /tailScenesUrl\(\s*["'`]en["'`]\s*\)|\|\|\s*["'`]en["'`]/,
    'result.js must fall back to the EN tail-scenes when the active locale is missing',
  );
});

// ─── AC-4: launch-readiness sign-off doc stubs (7-deliverable enumeration) ─

const DELIVERABLE_TOKENS = [
  { label: "tail-scene bottom", re: /tail-scene.{0,8}bottom|bottom.{0,12}tail-scene|bottom-decile/i },
  { label: "tail-scene mid", re: /tail-scene.{0,8}mid|mid-band|mid.{0,12}tail-scene/i },
  { label: "tail-scene top", re: /tail-scene.{0,8}top|top-decile|top.{0,12}tail-scene/i },
  { label: "silent-companion-line", re: /silent[ -]?companion[ -]?line/i },
  { label: "locale-switch-blocker-hint", re: /locale[ -]?switch[ -]?blocker[ -]?hint/i },
  { label: "crisis-resources", re: /crisis[ -]?resources?/i },
  { label: "retest-effect", re: /retest[ -]?effects?/i },
];

for (const locale of ["ru", "pl"]) {
  const docPath = resolve(LAUNCH, `${locale}-translator-signoff.md`);

  test(`7.6 AC-4: docs/launch-readiness/${locale}-translator-signoff.md exists`, () => {
    assert.ok(
      existsSync(docPath),
      `expected ${locale}-translator-signoff.md to exist at ${docPath}`,
    );
  });

  test(`7.6 AC-4: ${locale}-translator-signoff.md enumerates all 7 deliverables`, () => {
    const doc = readFileSync(docPath, "utf8");
    const missing = DELIVERABLE_TOKENS.filter((d) => !d.re.test(doc)).map((d) => d.label);
    assert.deepEqual(
      missing,
      [],
      `${locale} sign-off doc must enumerate all 7 deliverables; missing: ${missing.join(", ")}`,
    );
  });

  test(`7.6 AC-4: ${locale}-translator-signoff.md marks not-yet-signed-off / blocks launch`, () => {
    const doc = readFileSync(docPath, "utf8");
    assert.match(
      doc,
      /not[ -]?yet[ -]?signed[ -]?off|pending|TBD/i,
      `${locale} sign-off doc must carry a "not yet signed off" / pending / TBD marker`,
    );
    assert.match(
      doc,
      /blocks?.{0,12}(epic[ -]?10|launch)/i,
      `${locale} sign-off doc must state that un-signed deliverables block Epic 10 launch`,
    );
  });
}
