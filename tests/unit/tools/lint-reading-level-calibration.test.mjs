// Unit tests for tools/lint-reading-level.mjs — Story 7.5a calibration.
// Red-phase failing tests authored pre-implementation.
//
// 7.5a extends the EN reading-level lint with per-locale calibration:
//   - RU: Oborneva-equivalent grade (Cyrillic tokenizer + Russian-vowel
//     syllables), capped per NFR28.
//   - PL: Pisarek/Jasnopis-equivalent grade (Polish tokenizer + Polish-vowel
//     syllables), capped per NFR28.
// Enforcement is GATED on frontmatter translationStatus:
//   - in-progress non-EN page → skipped with a per-locale WARN (no failure)
//   - complete (or unset) non-EN page → graded + fails on cap exceedance
//   - EN keeps FK <= 12 unchanged.
// With --include-i18n, NFR31 sentence-length caps apply per locale:
//   EN <= 25 words; RU <= 180 chars; PL <= 160 chars. i18n bundles with
//   _meta.translationStatus:"in-progress" are skipped (WARN). The _meta
//   object's own string values are never graded.
//
// CRITICAL: these tests assert BEHAVIOR (exit code + presence/absence of a
// per-locale exceedance message and the skip-WARN), NOT exact grade floats.
// Fixtures use comfortable margins (clearly hard vs clearly easy).

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-reading-level.mjs");

// ─── fixture helpers ───────────────────────────────────────────────────────
// Layout (so the lint's `../i18n` derivation from the methodology root works):
//   <tmp>/methodology/<lang>/<page>/index.md   ← --paths=<tmp>/methodology
//   <tmp>/i18n/<lang>/strings.json             ← sibling of methodology
const METHODOLOGY_SUBDIR = "methodology";

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-rl-cal-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function methodologyRoot(dir) {
  return join(dir, METHODOLOGY_SUBDIR);
}

// Write a methodology page. `frontmatter` is an object of key→raw-YAML-value
// (omit for an unset frontmatter); pass `null` to write no frontmatter at all.
function writePage(dir, lang, relPath, body, frontmatter = {}) {
  const full = join(methodologyRoot(dir), lang, relPath);
  mkdirSync(dirname(full), { recursive: true });
  let content = "";
  if (frontmatter !== null) {
    const lines = ["---", 'title: "Fixture page"'];
    for (const [k, v] of Object.entries(frontmatter)) lines.push(`${k}: ${v}`);
    lines.push("---", "");
    content += lines.join("\n");
  }
  content += "\n" + body + "\n";
  writeFileSync(full, content);
  return full;
}

function writeI18n(dir, lang, fileName, obj) {
  const full = join(dir, "i18n", lang, fileName);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(obj, null, 2));
  return full;
}

function runLint(dir, extraArgs = []) {
  return spawnSync(
    "node",
    [SCRIPT, `--paths=${methodologyRoot(dir)}`, ...extraArgs],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
}

// ─── synthetic prose ────────────────────────────────────────────────────────

// Clearly-HARD Russian: long single sentence, polysyllabic abstract nouns.
const RU_HARD =
  "Транснациональная институционализация многофункциональных " +
  "административно-управленческих структур обуславливает " +
  "взаимообусловленность концептуализации методологических предпосылок, " +
  "характеризующих интернационализацию высокотехнологичных " +
  "производственных подразделений соответствующих государственных " +
  "учреждений и негосударственных некоммерческих организаций современности.";

// Clearly-EASY Russian: short sentences, short words.
const RU_EASY =
  "Кот спит. Дом стоит. Мы идём в парк. Там тепло. День был ясный. " +
  "Я рад. Он бежит. Она поёт. Мы ели суп. Всё было вкусно.";

// Clearly-HARD Polish: long single sentence, polysyllabic words.
const PL_HARD =
  "Wielopłaszczyznowa instytucjonalizacja interdyscyplinarnych " +
  "przedsięwzięć administracyjno-organizacyjnych determinuje " +
  "współzależność konceptualizacji metodologicznych założeń " +
  "charakteryzujących internacjonalizację wysokospecjalistycznych " +
  "jednostek produkcyjnych poszczególnych instytucji państwowych " +
  "oraz pozarządowych organizacji niekomercyjnych współczesności.";

// Clearly-EASY Polish: short sentences, short words.
const PL_EASY =
  "Kot śpi. Dom stoi. Idziemy do parku. Jest ciepło. Dzień był jasny. " +
  "Cieszę się. On biegnie. Ona śpiewa. Jedliśmy zupę. Było smaczne.";

// EN — simple prose, well under FK 12.
const EN_EASY =
  "The cat sat on the mat. We went to the park. It was a warm day. " +
  "We had fun. Then we ate lunch. We went home and slept.";

// EN — deliberately hard, long sentence with polysyllabic words.
const EN_HARD =
  "The institutionalization of multifunctional administrative " +
  "organizations necessitates the conceptualization of " +
  "interdisciplinary methodological presuppositions characterizing " +
  "the internationalization of contemporary governmental " +
  "establishments alongside nongovernmental noncommercial associations.";

// ─── per-locale exceedance / skip-WARN matchers (behavioral, not numeric) ───
const RU_EXCEED = /\bru\b[\s\S]*?(exceed|cap|threshold)/i;
const PL_EXCEED = /\bpl\b[\s\S]*?(exceed|cap|threshold)/i;
const RU_SKIP_WARN = /WARN[\s\S]*\bru\b[\s\S]*(in-progress|skip)/i;
const PL_SKIP_WARN = /WARN[\s\S]*\bpl\b[\s\S]*(in-progress|skip)/i;

// ════════════════════════════════════════════════════════════════════════════
// 1. RU enforcement (translationStatus: complete)
// ════════════════════════════════════════════════════════════════════════════

// AC-1/AC-2 — a COMPLETE RU page with hard prose exceeds the RU cap → exit 1
// with an RU-attributed exceedance message.
test("7.5a RU: complete page with hard Russian prose fails (RU exceedance)", () => {
  withFixture((dir) => {
    writePage(dir, "ru", "hard/index.md", RU_HARD, {
      translationStatus: '"complete"',
    });
    const r = runLint(dir);
    const out = r.stderr + r.stdout;
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(out, RU_EXCEED, "must report an RU reading-level exceedance");
  });
});

// AC-1/AC-2 — a COMPLETE RU page with easy prose passes (no RU failure).
test("7.5a RU: complete page with easy Russian prose passes", () => {
  withFixture((dir) => {
    writePage(dir, "ru", "easy/index.md", RU_EASY, {
      translationStatus: '"complete"',
    });
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, RU_EXCEED, "easy RU must not be flagged");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. PL enforcement (translationStatus: complete)
// ════════════════════════════════════════════════════════════════════════════

test("7.5a PL: complete page with hard Polish prose fails (PL exceedance)", () => {
  withFixture((dir) => {
    writePage(dir, "pl", "hard/index.md", PL_HARD, {
      translationStatus: '"complete"',
    });
    const r = runLint(dir);
    const out = r.stderr + r.stdout;
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(out, PL_EXCEED, "must report a PL reading-level exceedance");
  });
});

test("7.5a PL: complete page with easy Polish prose passes", () => {
  withFixture((dir) => {
    writePage(dir, "pl", "easy/index.md", PL_EASY, {
      translationStatus: '"complete"',
    });
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, PL_EXCEED, "easy PL must not be flagged");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. in-progress skip — hard prose does NOT fail; per-locale skip WARN emitted
// ════════════════════════════════════════════════════════════════════════════

test("7.5a RU: in-progress page with hard prose is skipped (WARN, no fail)", () => {
  withFixture((dir) => {
    writePage(dir, "ru", "hard/index.md", RU_HARD, {
      translationStatus: '"in-progress"',
    });
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, RU_EXCEED, "in-progress RU must not be graded/failed");
    assert.match(r.stderr + r.stdout, RU_SKIP_WARN, "must WARN that in-progress RU was skipped");
  });
});

test("7.5a PL: in-progress page with hard prose is skipped (WARN, no fail)", () => {
  withFixture((dir) => {
    writePage(dir, "pl", "hard/index.md", PL_HARD, {
      translationStatus: '"in-progress"',
    });
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, PL_EXCEED, "in-progress PL must not be graded/failed");
    assert.match(r.stderr + r.stdout, PL_SKIP_WARN, "must WARN that in-progress PL was skipped");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. EN unchanged — FK <= 12
// ════════════════════════════════════════════════════════════════════════════

test("7.5a EN: simple prose passes (FK <= 12 unchanged)", () => {
  withFixture((dir) => {
    writePage(dir, "en", "easy/index.md", EN_EASY, {});
    const r = runLint(dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
  });
});

test("7.5a EN: deliberately hard prose exceeds FK 12 (fails)", () => {
  withFixture((dir) => {
    writePage(dir, "en", "hard/index.md", EN_HARD, {});
    const r = runLint(dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stderr + r.stdout, /exceed|threshold/i, "EN must report FK exceedance");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. i18n caps (--include-i18n) — NFR31 sentence-length caps per locale
// ════════════════════════════════════════════════════════════════════════════

// Need >=1 EN methodology page so the run has a benign baseline; EN i18n
// content is kept short so it never trips the EN word cap.
function seedEnPage(dir) {
  writePage(dir, "en", "seed/index.md", EN_EASY, {});
}

// String comfortably over the RU 180-char cap.
const RU_LONG_STRING = "Это " + "очень ".repeat(40) + "длинное предложение.";
// String comfortably under the RU 180-char cap.
const RU_SHORT_STRING = "Короткая строка интерфейса.";
// String comfortably over the PL 160-char cap.
const PL_LONG_STRING = "To " + "bardzo ".repeat(35) + "długie zdanie.";
// String comfortably under the PL 160-char cap.
const PL_SHORT_STRING = "Krótki napis interfejsu.";

// AC-3 — RU complete bundle with a >180-char string fails.
test("7.5a i18n RU: complete bundle with >180-char string fails", () => {
  withFixture((dir) => {
    seedEnPage(dir);
    writeI18n(dir, "ru", "strings.json", {
      _meta: { translationStatus: "complete" },
      title: RU_LONG_STRING,
    });
    const r = runLint(dir, ["--include-i18n"]);
    const out = r.stderr + r.stdout;
    assert.ok(RU_LONG_STRING.length > 180, "fixture sanity: string exceeds 180 chars");
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(out, RU_EXCEED, "must report an RU i18n cap exceedance");
  });
});

// AC-3 — RU complete bundle with a <=180-char string passes.
test("7.5a i18n RU: complete bundle with <=180-char string passes", () => {
  withFixture((dir) => {
    seedEnPage(dir);
    writeI18n(dir, "ru", "strings.json", {
      _meta: { translationStatus: "complete" },
      title: RU_SHORT_STRING,
    });
    const r = runLint(dir, ["--include-i18n"]);
    assert.ok(RU_SHORT_STRING.length <= 180, "fixture sanity: string within 180 chars");
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, RU_EXCEED, "within-cap RU string must not flag");
  });
});

// AC-3 — PL complete bundle with a >160-char string fails.
test("7.5a i18n PL: complete bundle with >160-char string fails", () => {
  withFixture((dir) => {
    seedEnPage(dir);
    writeI18n(dir, "pl", "strings.json", {
      _meta: { translationStatus: "complete" },
      title: PL_LONG_STRING,
    });
    const r = runLint(dir, ["--include-i18n"]);
    const out = r.stderr + r.stdout;
    assert.ok(PL_LONG_STRING.length > 160, "fixture sanity: string exceeds 160 chars");
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(out, PL_EXCEED, "must report a PL i18n cap exceedance");
  });
});

// AC-3 — PL complete bundle with a <=160-char string passes.
test("7.5a i18n PL: complete bundle with <=160-char string passes", () => {
  withFixture((dir) => {
    seedEnPage(dir);
    writeI18n(dir, "pl", "strings.json", {
      _meta: { translationStatus: "complete" },
      title: PL_SHORT_STRING,
    });
    const r = runLint(dir, ["--include-i18n"]);
    assert.ok(PL_SHORT_STRING.length <= 160, "fixture sanity: string within 160 chars");
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, PL_EXCEED, "within-cap PL string must not flag");
  });
});

// AC-3 — a bundle with _meta.translationStatus:"in-progress" is skipped
// (WARN, no fail) even though it carries an overlong string.
test("7.5a i18n RU: in-progress bundle is skipped (WARN, no fail)", () => {
  withFixture((dir) => {
    seedEnPage(dir);
    writeI18n(dir, "ru", "strings.json", {
      _meta: { translationStatus: "in-progress" },
      title: RU_LONG_STRING,
    });
    const r = runLint(dir, ["--include-i18n"]);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, RU_EXCEED, "in-progress RU bundle must not be graded");
    assert.match(r.stderr + r.stdout, RU_SKIP_WARN, "must WARN that in-progress RU bundle was skipped");
  });
});

// AC-3 — the _meta object's own string values are NEVER graded: a complete
// RU bundle whose ONLY overlong string lives under _meta passes.
test("7.5a i18n RU: overlong string inside _meta is never graded", () => {
  withFixture((dir) => {
    seedEnPage(dir);
    writeI18n(dir, "ru", "strings.json", {
      _meta: { translationStatus: "complete", note: RU_LONG_STRING },
      title: RU_SHORT_STRING,
    });
    const r = runLint(dir, ["--include-i18n"]);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.doesNotMatch(r.stderr + r.stdout, RU_EXCEED, "_meta string values must not be graded");
  });
});
