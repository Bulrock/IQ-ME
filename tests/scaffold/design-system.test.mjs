// Story 1.10 — Acceptance tests for the design system foundation:
// primitives.css + semantic.css + dark-mode overrides + tokens.spec.mjs.
//
// Authored in test-author phase (frozen during specialist impl).
// Run: `node --test tests/scaffold/design-system.test.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const PRIMITIVES = join(REPO_ROOT, "src", "css", "primitives.css");
const SEMANTIC = join(REPO_ROOT, "src", "css", "semantic.css");
const TOKENS_SPEC = join(REPO_ROOT, "tests", "contract", "tokens.spec.mjs");
const TOKENS_HASH_JSON = join(REPO_ROOT, "tests", "snapshots", "tokens.hash.json");
const MAKEFILE = join(REPO_ROOT, "Makefile");

// ─────────────────────────────────────────────────────────────────────
// AC-1: primitives.css
// ─────────────────────────────────────────────────────────────────────

test("AC-1: src/css/primitives.css exists", () => {
  assert.ok(existsSync(PRIMITIVES), `${PRIMITIVES} missing`);
});

const PRIMITIVE_TOKENS = [
  // 12 neutral steps
  "--color-neutral-0", "--color-neutral-50", "--color-neutral-100",
  "--color-neutral-200", "--color-neutral-300", "--color-neutral-400",
  "--color-neutral-500", "--color-neutral-600", "--color-neutral-700",
  "--color-neutral-800", "--color-neutral-900", "--color-neutral-1000",
  // accent 3 steps
  "--color-accent-300", "--color-accent-500", "--color-accent-700",
  // attention 3 steps
  "--color-attention-300", "--color-attention-500", "--color-attention-700",
  // type-scale 100-800
  "--font-size-100", "--font-size-200", "--font-size-300",
  "--font-size-400", "--font-size-500", "--font-size-600",
  "--font-size-700", "--font-size-800",
  // spacing 1-9
  "--space-1", "--space-2", "--space-3", "--space-4",
  "--space-5", "--space-6", "--space-7", "--space-8", "--space-9",
  // font families
  "--font-family-sans", "--font-family-mono",
  // line heights
  "--line-height-tight", "--line-height-base", "--line-height-prose",
];

for (const token of PRIMITIVE_TOKENS) {
  test(`AC-1: primitives.css declares ${token}`, () => {
    const text = readFileSync(PRIMITIVES, "utf8");
    // CSS declaration: --token-name: value;
    const re = new RegExp(`${token.replace(/-/g, "\\-")}\\s*:`, "m");
    assert.match(text, re, `primitives.css missing declaration for ${token}`);
  });
}

test("AC-1: primitives.css declares breakpoints via @custom-media", () => {
  const text = readFileSync(PRIMITIVES, "utf8");
  assert.match(text, /@custom-media --bp-tablet\s*\(min-width:\s*600px\)/, `--bp-tablet @custom-media missing`);
  assert.match(text, /@custom-media --bp-desktop\s*\(min-width:\s*1024px\)/, `--bp-desktop @custom-media missing`);
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: semantic.css (light)
// ─────────────────────────────────────────────────────────────────────

test("AC-2: src/css/semantic.css exists", () => {
  assert.ok(existsSync(SEMANTIC), `${SEMANTIC} missing`);
});

const SEMANTIC_LIGHT_MAPPINGS = [
  ["--color-text-body", "--color-neutral-900"],
  ["--color-text-muted", "--color-neutral-600"],
  ["--color-text-link", "--color-accent-500"],
  ["--color-text-link-hover", "--color-accent-300"],
  ["--color-text-link-active", "--color-accent-700"],
  ["--color-text-link-disabled", "--color-neutral-400"],
  ["--color-surface-base", "--color-neutral-0"],
  ["--color-surface-elevated", "--color-neutral-50"],
  ["--color-surface-attention", "--color-attention-300"],
  ["--color-rule-divider", "--color-neutral-200"],
  ["--color-rule-strong", "--color-neutral-400"],
  ["--color-focus-ring", "--color-accent-500"],
  ["--color-text-attention-body", "--color-attention-700"],
  ["--space-prose-paragraph-gap", "--space-4"],
  ["--space-section-gap", "--space-7"],
  ["--space-score-triplet-gap", "--space-5"],
];

for (const [role, target] of SEMANTIC_LIGHT_MAPPINGS) {
  test(`AC-2: semantic.css maps ${role} → var(${target}) in light mode`, () => {
    const text = readFileSync(SEMANTIC, "utf8");
    const escaped = role.replace(/-/g, "\\-");
    const tgt = target.replace(/-/g, "\\-");
    const re = new RegExp(`${escaped}\\s*:\\s*var\\(\\s*${tgt}\\s*\\)`, "m");
    assert.match(text, re, `semantic.css missing light-mode mapping ${role} → var(${target})`);
  });
}

// ─────────────────────────────────────────────────────────────────────
// AC-3: dark-mode overrides
// ─────────────────────────────────────────────────────────────────────

test("AC-3: semantic.css has [data-theme=\"dark\"] selector", () => {
  const text = readFileSync(SEMANTIC, "utf8");
  assert.match(text, /\[data-theme\s*=\s*["']dark["']\]/, `semantic.css missing [data-theme="dark"] selector`);
});

test("AC-3: semantic.css has @media (prefers-color-scheme: dark) selector", () => {
  const text = readFileSync(SEMANTIC, "utf8");
  assert.match(text, /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/, `semantic.css missing @media prefers-color-scheme: dark`);
});

const DARK_OVERRIDES = [
  ["--color-text-body", "--color-neutral-100"],
  ["--color-text-muted", "--color-neutral-400"],
  ["--color-surface-base", "--color-neutral-900"],
  ["--color-surface-elevated", "--color-neutral-800"],
  ["--color-rule-divider", "--color-neutral-700"],
  ["--color-text-link", "--color-accent-300"],
];

for (const [role, target] of DARK_OVERRIDES) {
  test(`AC-3: semantic.css re-maps ${role} → var(${target}) in dark mode`, () => {
    const text = readFileSync(SEMANTIC, "utf8");
    // The mapping appears at least once in the file (in the dark-mode block).
    // We assert there are at least TWO occurrences (one light, one dark) for re-mapped roles,
    // OR one occurrence of the dark value if the role only exists in dark.
    const escaped = role.replace(/-/g, "\\-");
    const tgt = target.replace(/-/g, "\\-");
    const re = new RegExp(`${escaped}\\s*:\\s*var\\(\\s*${tgt}\\s*\\)`, "g");
    const matches = text.match(re);
    assert.ok(
      matches && matches.length >= 1,
      `semantic.css missing dark-mode mapping ${role} → var(${target})`,
    );
  });
}

// ─────────────────────────────────────────────────────────────────────
// AC-4 / AC-5: tokens.spec.mjs + tokens.hash.json
// ─────────────────────────────────────────────────────────────────────

test("AC-4: tests/contract/tokens.spec.mjs exists", () => {
  assert.ok(existsSync(TOKENS_SPEC), `${TOKENS_SPEC} missing`);
});

test("AC-4: tokens.spec.mjs references the snapshot path", () => {
  const text = readFileSync(TOKENS_SPEC, "utf8");
  assert.match(text, /tokens\.hash\.json/, `tokens.spec.mjs must reference tokens.hash.json`);
});

test("AC-5: tests/snapshots/tokens.hash.json exists", () => {
  assert.ok(existsSync(TOKENS_HASH_JSON), `${TOKENS_HASH_JSON} missing`);
});

test("AC-5: tokens.hash.json has correct shape", () => {
  const data = JSON.parse(readFileSync(TOKENS_HASH_JSON, "utf8"));
  assert.equal(typeof data.primitives_semantic_sha256, "string", `primitives_semantic_sha256 must be string`);
  assert.match(data.primitives_semantic_sha256, /^[0-9a-f]{64}$/, `primitives_semantic_sha256 must be 64 hex chars`);
  assert.equal(data.generated_at, "1970-01-01T00:00:00.000Z", `generated_at must be frozen epoch ISO`);
});

test("AC-5: tokens.hash.json hash matches current SHA-256 of primitives.css + semantic.css", () => {
  const data = JSON.parse(readFileSync(TOKENS_HASH_JSON, "utf8"));
  const files = [PRIMITIVES, SEMANTIC].sort();
  const hash = createHash("sha256");
  for (const f of files) hash.update(readFileSync(f));
  const actual = hash.digest("hex");
  assert.equal(
    data.primitives_semantic_sha256,
    actual,
    `snapshot hash drift: expected ${data.primitives_semantic_sha256}, actual ${actual}. Run 'make snapshot-update'.`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-6: make snapshot-update is idempotent
// ─────────────────────────────────────────────────────────────────────

test("AC-6: Makefile declares snapshot-update target", () => {
  const text = readFileSync(MAKEFILE, "utf8");
  assert.match(text, /^snapshot-update:.*##/m, `Makefile missing snapshot-update target with ## comment`);
});

test("AC-6: `make snapshot-update` is idempotent (two runs yield byte-identical tokens.hash.json)", () => {
  const r1 = spawnSync("make", ["snapshot-update"], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(r1.status, 0, `first make snapshot-update failed: ${r1.stderr}`);
  const first = readFileSync(TOKENS_HASH_JSON, "utf8");
  const r2 = spawnSync("make", ["snapshot-update"], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(r2.status, 0, `second make snapshot-update failed: ${r2.stderr}`);
  const second = readFileSync(TOKENS_HASH_JSON, "utf8");
  assert.equal(first, second, `tokens.hash.json drifted between two runs:\nfirst:\n${first}\nsecond:\n${second}`);
});
