// Story 1.4 — Acceptance tests for corpus schema set + conventions doc.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const read = (p) => readFileSync(join(REPO_ROOT, p), "utf8");
const readJson = (p) => JSON.parse(read(p));

test("AC-1: corpus/schema.json is valid JSON Schema 2020-12", () => {
  assert.equal(existsSync(join(REPO_ROOT, "corpus/schema.json")), true);
  const schema = readJson("corpus/schema.json");
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.type, "object");
});

test("AC-1: corpus/schema.json declares all required frontmatter fields", () => {
  const schema = readJson("corpus/schema.json");
  const REQUIRED = [
    "title",
    "version",
    "lastReviewed",
    "reviewer",
    "reviewerHandle",
    "asserts",
    "glossaryRefs",
    "sourceHashEN",
  ];
  for (const f of REQUIRED) {
    assert.ok(
      schema.required?.includes(f),
      `schema.required must include "${f}"`,
    );
    assert.ok(
      schema.properties?.[f],
      `schema.properties must declare "${f}"`,
    );
  }
});

test("AC-1: corpus/schema.json permits optional `protected: true`", () => {
  const schema = readJson("corpus/schema.json");
  assert.ok(
    schema.properties?.protected,
    "schema must declare optional `protected` property",
  );
  assert.equal(schema.properties.protected.type, "boolean");
  assert.ok(
    !schema.required?.includes("protected"),
    "`protected` must NOT be in required list (optional only)",
  );
});

test("AC-2: corpus/markdown-subset-v1.md exists and enumerates the subset", () => {
  const path = "corpus/markdown-subset-v1.md";
  assert.equal(existsSync(join(REPO_ROOT, path)), true);
  const md = read(path);
  for (const construct of [
    /heading/i,
    /paragraph/i,
    /emphasis/i,
    /code\s*fence/i,
    /link/i,
    /list/i,
  ]) {
    assert.match(md, construct, `must enumerate ${construct}`);
  }
  assert.match(md, /depth\s*2/i, "must declare list depth cap of 2");
  assert.match(
    md,
    /(no\s+HTML|HTML\s+passthrough)/i,
    "must declare no-HTML-passthrough rule",
  );
  assert.match(md, /(no\s+autolinks|autolinks?\s+(are\s+)?forbidden)/i);
});

test("AC-2: corpus/markdown-subset-v1.md uses only subset constructs (self-validation)", () => {
  const md = read("corpus/markdown-subset-v1.md");
  // Heuristic checks for forbidden constructs:
  // - No HTML tags (raw or inline)
  assert.doesNotMatch(
    md,
    /<\/?[a-zA-Z][^>]*>/,
    "must not use HTML passthrough (raw HTML tags)",
  );
  // - No autolinks like <https://...>
  assert.doesNotMatch(
    md,
    /<https?:\/\/[^>]+>/,
    "must not use autolinks",
  );
  // - No lists deeper than depth 2 (4-space or 2-tab indented list markers)
  assert.doesNotMatch(
    md,
    /^( {8}|\t{2,3})[-*+]\s/m,
    "must not contain lists at depth 3+ (indent ≥ 8 spaces or 2 tabs)",
  );
});

test("AC-3: corpus/methodology-claims-v1.schema.json defines required claim fields", () => {
  const path = "corpus/methodology-claims-v1.schema.json";
  assert.equal(existsSync(join(REPO_ROOT, path)), true);
  const schema = readJson(path);
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  // Schema describes an array of claim entries; entries have required fields
  // claim-id, engine-source, methodology-path, value-or-formula.
  const entrySchema =
    schema.items ??
    schema.properties?.claims?.items ??
    schema.$defs?.claim ??
    schema.definitions?.claim;
  assert.ok(entrySchema, "schema must declare an entry shape (items / $defs.claim)");
  const REQUIRED = ["claim-id", "engine-source", "methodology-path", "value-or-formula"];
  for (const f of REQUIRED) {
    assert.ok(
      entrySchema.required?.includes(f),
      `claim entry must require "${f}"`,
    );
  }
});

test("AC-4: corpus/manifest.schema.json defines `bankFrozen` with default false", () => {
  const path = "corpus/manifest.schema.json";
  assert.equal(existsSync(join(REPO_ROOT, path)), true);
  const schema = readJson(path);
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  const bf = schema.properties?.bankFrozen;
  assert.ok(bf, "manifest schema must declare `bankFrozen` property");
  assert.equal(bf.type, "boolean");
  assert.equal(bf.default, false, "bankFrozen default must be false");
  // Related manifest fields: item-bank version pin + locked-at-corpus-version.
  assert.ok(
    schema.properties?.itemBankVersion ?? schema.properties?.["item-bank-version"],
    "manifest must declare itemBankVersion / item-bank-version field",
  );
  assert.ok(
    schema.properties?.lockedAtCorpusVersion ?? schema.properties?.["locked-at-corpus-version"],
    "manifest must declare lockedAtCorpusVersion / locked-at-corpus-version field",
  );
});

test("AC-5: docs/corpus-build-conventions.md covers all required topics", () => {
  const path = "docs/corpus-build-conventions.md";
  assert.equal(existsSync(join(REPO_ROOT, path)), true);
  const md = read(path);
  for (const topic of [
    /per[-\s]corpus[-\s]release\s+re[-\s]emit/i,
    /(block[-\s]level\s+content[-\s]key\s+parity|content[-\s]key\s+parity)/i,
    /sourceHashEN/,
    /(glossary[-\s]first|glossary\s+first)/i,
    /(style\s+invariants?|no\s+idioms|sentence[-\s]length)/i,
    /Epic\s*4/i,
    /Epic\s*5/i,
  ]) {
    assert.match(md, topic, `conventions doc must cover ${topic}`);
  }
});
