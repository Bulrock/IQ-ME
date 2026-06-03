#!/usr/bin/env node
// tools/lint-frontmatter.mjs — Story 4.3.
//
// Walks `src/content/methodology/**.md`, parses YAML frontmatter via the
// mini-parser pattern from `tools/build-methodology.mjs`, and validates each
// page against a stdlib-only subset of `corpus/schema.json` (NFR33).
//
// Exit 0 with one summary line on full pass.
// Exit 1 with one `lint-frontmatter: <path>: <field> <reason>` line per
// violation.
//
// Optional flags:
//   --paths=<dir>   override the methodology root (default: src/content/methodology)

import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { argv, cwd, stdout, stderr, exit } from "node:process";

const CWD = cwd();

// ─── arg parsing ─────────────────────────────────────────────────────────
const args = argv.slice(2);
let pathsArg = null;
for (const a of args) {
  if (a.startsWith("--paths=")) pathsArg = a.slice("--paths=".length);
}
const ROOT = resolve(CWD, pathsArg ?? "src/content/methodology");

// Story 6.5 AC-8 — crisis-resources schema validation extension.
const CRISIS_ROOT = resolve(CWD, "src/content/crisis-resources");
// Schema ships at script-relative path so the validation works on any cwd
// (including tmpdir-fixtures in tests/unit/tools/lint-frontmatter.test.mjs).
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CRISIS_SCHEMA_PATH = resolve(SCRIPT_DIR, "..", "src/content/crisis-resources/crisis-resources.schema.json");

// ─── schema-subset validators ────────────────────────────────────────────
const REQUIRED_KEYS = [
  "title",
  "version",
  "lastReviewed",
  "reviewer",
  "reviewerHandle",
  "asserts",
  "glossaryRefs",
  "sourceHashEN",
];

// Story 5.1 — translationStatus is optional with default "complete". Enforced
// EN-cannot-be-in-progress in the per-page validation block below.
const OPTIONAL_KEYS = ["translationStatus"];
const TRANSLATION_STATUS_ENUM = new Set(["complete", "in-progress"]);

const VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const HANDLE_RE = /^@[A-Za-z0-9_.-]+$/;
const GLOSSARY_KEY_RE = /^[a-z][a-zA-Z0-9]*$/;

// Each validator returns null on pass, or a string reason on fail.
const VALIDATORS = {
  title(v) {
    if (typeof v !== "string") return "must be a string";
    if (v.length < 1) return "must be non-empty";
    return null;
  },
  version(v) {
    if (typeof v !== "string") return "must be a string";
    if (!VERSION_RE.test(v)) return `${JSON.stringify(v)} does not match <major>.<minor>.<patch>`;
    return null;
  },
  lastReviewed(v) {
    if (typeof v !== "string") return "must be a string";
    if (!DATE_RE.test(v)) return `${JSON.stringify(v)} is not ISO 8601 YYYY-MM-DD`;
    return null;
  },
  reviewer(v) {
    if (typeof v !== "string") return "must be a string";
    if (v.length < 1) return "must be non-empty";
    return null;
  },
  reviewerHandle(v) {
    if (typeof v !== "string") return "must be a string";
    if (!HANDLE_RE.test(v)) return `${JSON.stringify(v)} does not match @<handle>`;
    return null;
  },
  asserts(v) {
    if (!Array.isArray(v)) return "must be an array";
    for (let i = 0; i < v.length; i++) {
      if (typeof v[i] !== "string" || v[i].length < 1) {
        return `item ${i} must be a non-empty string`;
      }
    }
    return null;
  },
  glossaryRefs(v) {
    if (!Array.isArray(v)) return "must be an array";
    for (let i = 0; i < v.length; i++) {
      if (typeof v[i] !== "string") return `item ${i} must be a string`;
      if (!GLOSSARY_KEY_RE.test(v[i])) {
        return `item ${i} ${JSON.stringify(v[i])} does not match camelCase key`;
      }
    }
    return null;
  },
  sourceHashEN(v) {
    if (typeof v !== "string") return "must be a string";
    if (!HEX64_RE.test(v)) return `must be 64-char lowercase hex (got length ${v.length})`;
    return null;
  },
};

// ─── frontmatter mini-parser (adapted from build-methodology.mjs) ─────
// Distinguishes between bareword scalars (string), quoted scalars (string),
// and block-list arrays. Returns the parsed frontmatter object or throws.
function parseFrontmatter(text, srcPath) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error("missing frontmatter delimiter (first line must be '---')");
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { endIdx = i; break; }
  }
  if (endIdx === -1) throw new Error("missing closing frontmatter delimiter '---'");
  const fm = {};
  let i = 1;
  while (i < endIdx) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) throw new Error(`cannot parse frontmatter line ${i + 1}: ${JSON.stringify(line)}`);
    const key = m[1];
    const rest = m[2];
    if (rest === "") {
      const items = [];
      i++;
      while (i < endIdx) {
        const lst = lines[i].match(/^\s+-\s+(.*)$/);
        if (!lst) break;
        items.push(parseScalar(lst[1].trim()));
        i++;
      }
      fm[key] = items;
      continue;
    }
    // Inline array: `key: [a, b]` or `key: []`.
    if (rest.startsWith("[")) {
      const trimmed = rest.trim();
      if (!trimmed.endsWith("]")) {
        throw new Error(`inline array on line ${i + 1} not closed: ${JSON.stringify(rest)}`);
      }
      const inner = trimmed.slice(1, -1).trim();
      if (inner === "") fm[key] = [];
      else fm[key] = inner.split(",").map((x) => parseScalar(x.trim()));
      i++;
      continue;
    }
    fm[key] = parseScalar(rest);
    i++;
  }
  return fm;
}

function parseScalar(raw) {
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith('"')) {
    if (!v.endsWith('"') || v.length < 2) throw new Error(`unterminated quoted string: ${raw}`);
    return v.slice(1, -1);
  }
  if (v.startsWith("'")) {
    if (!v.endsWith("'") || v.length < 2) throw new Error(`unterminated quoted string: ${raw}`);
    return v.slice(1, -1);
  }
  return v; // bareword → string
}

// ─── walk + validate ─────────────────────────────────────────────────────
function* walkMd(dir) {
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
    if (e.isDirectory()) yield* walkMd(p);
    else if (e.isFile() && e.name.endsWith(".md")) yield p;
  }
}

function emit(path, field, reason) {
  stderr.write(`lint-frontmatter: ${path}: ${field} ${reason}\n`);
}

// Story 6.5 AC-8 — stdlib-only mini-validator subset for crisis-resources schema.
// Supports: type, required, properties, items, enum, pattern, minLength, minItems.
function validateAgainst(schema, value, pathField) {
  const errs = [];
  if (schema.type === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      errs.push([pathField, "must be an object"]);
      return errs;
    }
    if (Array.isArray(schema.required)) {
      for (const k of schema.required) {
        if (!(k in value)) errs.push([pathField ? `${pathField}.${k}` : k, "missing required key"]);
      }
    }
    if (schema.properties) {
      for (const [k, sub] of Object.entries(schema.properties)) {
        if (k in value) {
          errs.push(...validateAgainst(sub, value[k], pathField ? `${pathField}.${k}` : k));
        }
      }
    }
    return errs;
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) { errs.push([pathField, "must be an array"]); return errs; }
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errs.push([pathField, `must have ≥${schema.minItems} entries (got ${value.length})`]);
    }
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        errs.push(...validateAgainst(schema.items, value[i], `${pathField}[${i}]`));
      }
    }
    return errs;
  }
  if (schema.type === "string") {
    if (typeof value !== "string") { errs.push([pathField, "must be a string"]); return errs; }
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      errs.push([pathField, `must have length ≥${schema.minLength} (got ${value.length})`]);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errs.push([pathField, `value ${JSON.stringify(value)} does not match pattern ${schema.pattern}`]);
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
      errs.push([pathField, `value ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`]);
    }
    return errs;
  }
  return errs;
}

function* walkCrisisJson(dir) {
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
    if (!e.isFile() || !e.name.endsWith(".json")) continue;
    if (e.name === "crisis-resources.schema.json") continue;
    yield join(dir, e.name);
  }
}

function main() {
  let count = 0;
  let failures = 0;

  for (const fullPath of walkMd(ROOT)) {
    const rel = relative(CWD, fullPath);
    let text;
    try {
      text = readFileSync(fullPath, "utf8");
    } catch (e) {
      emit(rel, "<file>", `read error: ${e.message}`);
      failures++;
      count++;
      continue;
    }
    let fm;
    try {
      fm = parseFrontmatter(text, fullPath);
    } catch (e) {
      emit(rel, "<frontmatter>", e.message);
      failures++;
      count++;
      continue;
    }

    // Required keys.
    for (const k of REQUIRED_KEYS) {
      if (!(k in fm)) {
        emit(rel, k, "missing required key");
        failures++;
      }
    }
    // Per-key validation (only for keys present).
    for (const k of REQUIRED_KEYS) {
      if (!(k in fm)) continue;
      const reason = VALIDATORS[k](fm[k]);
      if (reason !== null) {
        emit(rel, k, reason);
        failures++;
      }
    }
    // Story 5.1 — translationStatus optional field validation.
    if ("translationStatus" in fm) {
      const v = fm.translationStatus;
      if (typeof v !== "string" || !TRANSLATION_STATUS_ENUM.has(v)) {
        emit(
          rel,
          "translationStatus",
          `must be one of ${JSON.stringify([...TRANSLATION_STATUS_ENUM])} (got ${JSON.stringify(v)})`,
        );
        failures++;
      } else if (v === "in-progress") {
        // EN is source-of-truth — non-EN-only flag.
        const relFromRoot = relative(ROOT, fullPath);
        const lang = relFromRoot.split(/[\\/]/)[0];
        if (lang === "en") {
          emit(rel, "translationStatus", "en pages cannot be in-progress (EN is source-of-truth)");
          failures++;
        }
      }
    }
    count++;
  }

  // Story 6.5 AC-8 — crisis-resources/*.json validation (when schema present).
  let crisisSchema = null;
  try { crisisSchema = JSON.parse(readFileSync(CRISIS_SCHEMA_PATH, "utf8")); } catch {}
  if (crisisSchema) {
    for (const fullPath of walkCrisisJson(CRISIS_ROOT)) {
      const rel = relative(CWD, fullPath);
      let body;
      try { body = JSON.parse(readFileSync(fullPath, "utf8")); }
      catch (e) { emit(rel, "<json>", `parse error: ${e.message}`); failures++; count++; continue; }
      const errs = validateAgainst(crisisSchema, body, "");
      for (const [field, reason] of errs) { emit(rel, field || "<root>", reason); failures++; }
      count++;
    }
  }

  if (failures > 0) {
    stderr.write(`lint-frontmatter: ${failures} violation(s) across ${count} file(s)\n`);
    exit(1);
  }
  stdout.write(`lint-frontmatter: ${count} file(s) validated\n`);
  exit(0);
}

main();
