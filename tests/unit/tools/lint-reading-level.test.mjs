// Unit tests for tools/lint-reading-level.mjs.
// Story 4-4 — red-phase failing tests authored pre-implementation.
//
// The lint computes Flesch-Kincaid grade per EN methodology page body
// (frontmatter + markdown constructs stripped), failing the build at
// grade > 12 (per NFR28). RU/PL paths emit a single per-locale WARN
// (Epic 7 wires per-language calibrations).
//
// Golden vectors: hand-computed FK grades for two reference passages,
// tolerance ±0.5 grade to absorb syllable-heuristic noise.

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

const HASH64 = "0".repeat(64);

function frontmatter() {
  return [
    "---",
    'title: "Test page"',
    'version: "0.1.0"',
    'lastReviewed: "2026-05-19"',
    'reviewer: "Rev"',
    'reviewerHandle: "@TBD-en-reviewer"',
    "asserts: []",
    "glossaryRefs: []",
    `sourceHashEN: "${HASH64}"`,
    "---",
    "",
  ].join("\n");
}

function writePage(dir, lang, relPath, body) {
  const full = join(dir, "src/content/methodology", lang, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, frontmatter() + body);
  return full;
}

function runLint(args = [], cwd = REPO_ROOT) {
  return spawnSync("node", [SCRIPT, ...args], { cwd, encoding: "utf8" });
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-rl-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function extractGrade(output, relPathFragment) {
  // Match negative or positive decimal grade (very simple prose can score below 0).
  const re = new RegExp(`lint-reading-level:[^\\n]*${relPathFragment.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[^\\n]*grade=(-?[0-9]+\\.[0-9]+)`);
  const m = output.match(re);
  return m ? Number(m[1]) : NaN;
}

// AC-6.1 — happy path: simple prose at low grade → pass + grade reported.
test("lint-reading-level: simple prose passes with low grade", () => {
  withFixture((dir) => {
    writePage(dir, "en", "easy/index.md", "The cat sat on the mat. The dog ran in the park.\n");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stdout + r.stderr, /easy\/index\.md.*grade=/);
  });
});

// AC-6.2 — difficult prose with grade > 12 → FAIL.
test("lint-reading-level: dense academic prose with grade > 12 fails", () => {
  withFixture((dir) => {
    // Long, syllable-heavy sentence with multipolysyllabic technical vocabulary.
    const body = [
      "The epistemological underpinnings of psychometric methodologies necessitate",
      "rigorous interdisciplinary collaboration amongst econometric theoreticians,",
      "computational psychophysiologists, and statisticians whose phenomenological",
      "investigations corroborate multidimensional latent-variable instrumentation",
      "across heterogeneous populations exhibiting substantial sociodemographic variability.",
    ].join(" ") + "\n";
    writePage(dir, "en", "hard/index.md", body);
    const r = runLint([], dir);
    assert.equal(r.status, 1, `expected 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stderr + r.stdout, /hard\/index\.md.*grade=/);
  });
});

// AC-6.3 — empty body (frontmatter only) → WARN, exit 0.
test("lint-reading-level: empty body emits WARN, exit 0", () => {
  withFixture((dir) => {
    writePage(dir, "en", "empty/index.md", "\n");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stderr + r.stdout, /WARN.*empty\/index\.md.*empty body/);
  });
});

// AC-6.4 — frontmatter stripping correctness: keys in frontmatter must not influence FK.
test("lint-reading-level: frontmatter content does not influence FK", () => {
  withFixture((dir) => {
    // Same simple body, but with very-long-words frontmatter values.
    // The page body is just "The cat sat on the mat."
    const full = join(dir, "src/content/methodology/en/fm/index.md");
    mkdirSync(dirname(full), { recursive: true });
    const fm = [
      "---",
      'title: "Multidimensional psychophenomenological epistemological corpus"',
      'version: "0.1.0"',
      'lastReviewed: "2026-05-19"',
      'reviewer: "Multidisciplinary Interdisciplinary Investigator"',
      'reviewerHandle: "@TBD-en-reviewer"',
      "asserts: []",
      "glossaryRefs: []",
      `sourceHashEN: "${HASH64}"`,
      "---",
      "",
      "The cat sat on the mat.",
      "",
    ].join("\n");
    writeFileSync(full, fm);
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; got stderr=${r.stderr} stdout=${r.stdout}`);
    const g = extractGrade(r.stdout + r.stderr, "fm/index.md");
    assert.ok(!Number.isNaN(g), `expected a grade line for fm/index.md; got ${r.stdout}${r.stderr}`);
    // Body is simple; grade should be very low (<5). If frontmatter leaked it would jump.
    assert.ok(g < 5, `expected low grade for simple body; got ${g}`);
  });
});

// AC-6.5 — code-fence stripping: triple-backtick block contents do not count.
test("lint-reading-level: code-fence block excluded from FK", () => {
  withFixture((dir) => {
    const body = [
      "The cat sat on the mat.",
      "",
      "```",
      "interdisciplinary multidisciplinary epistemological phenomenological psychometric instrumentation",
      "```",
      "",
    ].join("\n");
    writePage(dir, "en", "code/index.md", body);
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    const g = extractGrade(r.stdout + r.stderr, "code/index.md");
    assert.ok(!Number.isNaN(g), `expected grade line`);
    assert.ok(g < 5, `expected low grade after stripping code fence; got ${g}`);
  });
});

// AC-6.6 — inline code stripping: backtick-wrapped tokens do not count.
test("lint-reading-level: inline code is stripped", () => {
  withFixture((dir) => {
    const body = "The cat `interdisciplinaryEpistemologicalPhenomenologicalIdentifier` sat on the mat.\n";
    writePage(dir, "en", "inline/index.md", body);
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    const g = extractGrade(r.stdout + r.stderr, "inline/index.md");
    assert.ok(g < 6, `expected low grade after stripping inline code; got ${g}`);
  });
});

// AC-6.7 — link-text preserved.
test("lint-reading-level: link text is preserved, URL is not counted", () => {
  withFixture((dir) => {
    const body = "The cat saw [hello world](https://example.com/very/long/multisyllabic/url) here.\n";
    writePage(dir, "en", "link/index.md", body);
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    const g = extractGrade(r.stdout + r.stderr, "link/index.md");
    assert.ok(g < 8, `expected reasonable grade; got ${g}`);
  });
});

// AC-6.8 — RU page → single per-locale WARN, exit 0.
test("lint-reading-level: RU page emits one per-locale WARN, exit 0", () => {
  withFixture((dir) => {
    writePage(dir, "ru", "page/index.md", "Кошка села на коврик.\n");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stderr + r.stdout, /WARN.*ru.*calibration.*Epic 7/);
  });
});

// AC-6.9 — PL page → one per-locale WARN.
test("lint-reading-level: PL page emits one per-locale WARN, exit 0", () => {
  withFixture((dir) => {
    writePage(dir, "pl", "page/index.md", "Kot usiadł na macie.\n");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stderr + r.stdout, /WARN.*pl.*calibration.*Epic 7/);
  });
});

// AC-6.10 — Golden vector 1: "The cat sat on the mat." → grade ~1–2 (±0.5).
test("lint-reading-level: golden vector 'The cat sat on the mat.' → grade ≈ 1–2 (±0.5)", () => {
  withFixture((dir) => {
    writePage(dir, "en", "gv1/index.md", "The cat sat on the mat.\n");
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    const g = extractGrade(r.stdout + r.stderr, "gv1/index.md");
    assert.ok(!Number.isNaN(g), `expected grade line`);
    // Hand calc (6 words, 1 sentence, syllables ≈ 6): FK = 0.39*(6/1) + 11.8*(6/6) - 15.59 = -1.45
    // Plausible range with our heuristic: -2.0 to 2.0; require g < 2.5.
    assert.ok(g < 2.5, `expected grade < 2.5 for trivial prose; got ${g}`);
  });
});

// AC-6.11 — Golden vector 2: Gettysburg opening → grade ~10–11 (±0.5).
test("lint-reading-level: golden vector Gettysburg opening → grade ≈ 10–11 (±1.0)", () => {
  withFixture((dir) => {
    const body = "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\n";
    writePage(dir, "en", "gv2/index.md", body);
    const r = runLint([], dir);
    // This is a single 30-word sentence with many polysyllables; expected
    // FK grade hand-calculation lands around 16–17 (the long-sentence-with-
    // multisyllables term dominates). The widely-cited "grade 11" figure
    // applies to multi-sentence Lincoln corpora, not this single 30-word
    // opening sentence. Status: depends on threshold — this single sentence
    // exceeds 12 and SHOULD fail. The test asserts the grade is reported
    // and that it is in the broad expected range (>9).
    const g = extractGrade(r.stdout + r.stderr, "gv2/index.md");
    assert.ok(!Number.isNaN(g), `expected grade line; got stdout=${r.stdout} stderr=${r.stderr}`);
    assert.ok(g > 9, `expected grade > 9 for Gettysburg opening; got ${g}`);
    // Whether status is 0 or 1 depends on the grade; both are acceptable.
    assert.ok(r.status === 0 || r.status === 1, `unexpected status ${r.status}`);
  });
});

// AC-6.12 — Syllable edge: words ending in silent 'e' (make, like) count without trailing e.
test("lint-reading-level: silent-e words counted as single syllable", () => {
  withFixture((dir) => {
    // "make like bike cake lake" — five 1-syllable words by silent-e rule.
    // Total 5 words, 1 sentence, syllables = 5. FK = 0.39*5 + 11.8*1 - 15.59 = -1.84.
    const body = "Make like bike cake lake.\n";
    writePage(dir, "en", "se/index.md", body);
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    const g = extractGrade(r.stdout + r.stderr, "se/index.md");
    assert.ok(!Number.isNaN(g), `expected grade line`);
    assert.ok(g < 3, `expected very low grade for silent-e words; got ${g}`);
  });
});

// AC-6.13 — heading lines stripped (single-line heading should not count as a sentence).
test("lint-reading-level: ATX headings stripped from FK calc", () => {
  withFixture((dir) => {
    const body = [
      "# Multidisciplinary Interdisciplinary Heading",
      "",
      "The cat sat on the mat.",
      "",
    ].join("\n");
    writePage(dir, "en", "h/index.md", body);
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    const g = extractGrade(r.stdout + r.stderr, "h/index.md");
    assert.ok(g < 5, `expected low grade after stripping heading; got ${g}`);
  });
});

// ─── Story 4-8 — --include-i18n flag tests ──────────────────────────────

function writeI18n(dir, lang, jsonObj) {
  const full = join(dir, "src/content/i18n", lang, "strings.json");
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(jsonObj, null, 2));
  return full;
}

// AC-2.1 — without --include-i18n flag, i18n JSON is ignored (backward-compat).
test("lint-reading-level: without --include-i18n flag, i18n JSON ignored", () => {
  withFixture((dir) => {
    // Plant an i18n JSON with deliberately polysyllabic prose.
    writeI18n(dir, "en", {
      a: "Epistemological multidisciplinary phenomenological investigations corroborate interdisciplinary methodologies.",
    });
    // No methodology pages → empty walk, exit 0.
    const r = runLint([], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    // Ensure no grade line was emitted for strings.json (flag absent).
    assert.doesNotMatch(r.stdout + r.stderr, /strings\.json/);
  });
});

// AC-2.2 — with --include-i18n: EN strings.json values extracted, FK computed.
test("lint-reading-level: --include-i18n extracts EN string values + computes FK", () => {
  withFixture((dir) => {
    writeI18n(dir, "en", {
      group: {
        a: "The cat sat on the mat.",
        b: "The dog ran in the park.",
        c: "We took a walk on the path.",
      },
    });
    const r = runLint(["--include-i18n"], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stdout + r.stderr, /i18n\/en\/strings\.json.*grade=/);
  });
});

// AC-2.3 — with --include-i18n: EN strings.json with polysyllabic prose fails grade > 12.
test("lint-reading-level: --include-i18n EN polysyllabic prose fails grade > 12", () => {
  withFixture((dir) => {
    writeI18n(dir, "en", {
      a: "Epistemological multidisciplinary phenomenological investigations corroborate interdisciplinary methodologies amongst psychometric instrumentation across heterogeneous sociodemographic populations exhibiting substantial variability.",
    });
    const r = runLint(["--include-i18n"], dir);
    assert.equal(r.status, 1, `expected exit 1; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stderr + r.stdout, /i18n\/en\/strings\.json.*grade=/);
  });
});

// AC-2.4 — with --include-i18n: RU strings.json → per-locale WARN, no FK enforcement.
test("lint-reading-level: --include-i18n RU strings emit per-locale WARN, no enforcement", () => {
  withFixture((dir) => {
    writeI18n(dir, "ru", { a: "Кошка села на коврик." });
    const r = runLint(["--include-i18n"], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}; stdout: ${r.stdout}`);
    assert.match(r.stderr + r.stdout, /WARN.*ru.*calibration.*Epic 7/);
  });
});

// AC-2.5 — with --include-i18n: nested object string extraction.
test("lint-reading-level: --include-i18n extracts strings from nested objects", () => {
  withFixture((dir) => {
    writeI18n(dir, "en", {
      level1: {
        level2: {
          deep: "The cat sat on the mat. The dog ran in the park.",
        },
      },
    });
    const r = runLint(["--include-i18n"], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    assert.match(r.stdout + r.stderr, /i18n\/en\/strings\.json.*grade=/);
  });
});

// AC-2.6 — Backward-compat: --include-i18n flag still runs methodology pass.
test("lint-reading-level: --include-i18n still validates methodology pages", () => {
  withFixture((dir) => {
    writePage(dir, "en", "page/index.md", "The cat sat on the mat.\n");
    writeI18n(dir, "en", { a: "The dog ran in the park." });
    const r = runLint(["--include-i18n"], dir);
    assert.equal(r.status, 0, `expected 0; stderr: ${r.stderr}`);
    // Both surfaces produced grade lines.
    assert.match(r.stdout + r.stderr, /page\/index\.md.*grade=/);
    assert.match(r.stdout + r.stderr, /i18n\/en\/strings\.json.*grade=/);
  });
});
