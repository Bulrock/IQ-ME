#!/usr/bin/env node
// tools/lint-license-provenance.mjs — Story 4.5.
//
// Two-phase lint enforcing the LICENSES.md attribution chain (NFR24, FR45).
//
// Phase 1 (orphan detection):
//   - Load docs/license-scope-map.md fenced-yaml block.
//   - Walk every shipped file under the union of class glob prefixes.
//   - Each file must match at least one class glob OR an exclusion.
//   - Orphan → exit 1.
//
// Phase 2 (LICENSES.md last-modified-hash discipline):
//   - SHA-256 of LICENSES.md body excluding the `<!-- last-modified-hash: <X> -->` line.
//   - Compare to declared hash.
//   - declared == placeholder ("0".repeat(64)) → WARN, exit 0.
//   - declared == actual → "hash verified", exit 0.
//   - declared != actual → require CHANGELOG.md with a line referencing
//     LICENSES.md; otherwise exit 1.
//
// Stdlib-only (NFR33). Pure ESM (.mjs). ~150 LOC target.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, relative, dirname } from "node:path";
import { argv, cwd, stdout, stderr, exit } from "node:process";

const CWD = cwd();
const PLACEHOLDER = "0".repeat(64);
const SCOPE_MAP_PATH = resolve(CWD, "docs/license-scope-map.md");
const LICENSES_PATH = resolve(CWD, "LICENSES.md");
const CHANGELOG_PATH = resolve(CWD, "CHANGELOG.md");

function fail(msg) {
  stderr.write(`lint-license-provenance: ${msg}\n`);
  exit(1);
}

// ─── tiny YAML subset parser ─────────────────────────────────────────────
// Supports the shape:
//   classes:
//     <class-id>:
//       globs:
//         - "glob1"
//         - "glob2"
//       licenses-md-section: "string"
//   exclusions:
//     - "glob"
// Or inline `globs: ["a", "b"]` arrays.
//
// Reasons we hand-roll: stdlib-only invariant (NFR33).

function parseScopeMap(text) {
  // Extract the first fenced ```yaml ... ``` block.
  const m = text.match(/```yaml\s*\n([\s\S]*?)\n```/);
  if (!m) throw new Error("missing ```yaml ... ``` fenced block in docs/license-scope-map.md");
  const yaml = m[1];
  const lines = yaml.split(/\r?\n/);
  const out = { classes: {}, exclusions: [] };
  let section = null;       // "classes" | "exclusions"
  let currentClass = null;  // class id
  let currentClassObj = null;
  let currentList = null;   // reference to a globs array we are populating
  let listIndent = -1;

  function indentOf(s) {
    const m2 = s.match(/^( *)/);
    return m2 ? m2[1].length : 0;
  }

  function parseInlineArray(s) {
    // expects something like ["a", "b", 'c']
    const inner = s.trim().replace(/^\[/, "").replace(/\]$/, "");
    if (inner.trim().length === 0) return [];
    return inner.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
    const ind = indentOf(raw);
    const line = raw.trimEnd();
    const content = line.trimStart();

    if (ind === 0) {
      currentList = null;
      currentClass = null;
      currentClassObj = null;
      if (content.startsWith("classes:")) { section = "classes"; continue; }
      if (content.startsWith("exclusions:")) {
        section = "exclusions";
        // inline?
        const rest = content.slice("exclusions:".length).trim();
        if (rest.startsWith("[")) {
          out.exclusions = parseInlineArray(rest);
          section = null;
        } else {
          currentList = out.exclusions;
          listIndent = -1;
        }
        continue;
      }
      throw new Error(`unexpected top-level key at line ${i + 1}: ${raw}`);
    }

    if (section === "exclusions" && currentList === out.exclusions) {
      if (content.startsWith("- ")) {
        const v = content.slice(2).trim().replace(/^["']|["']$/g, "");
        out.exclusions.push(v);
        continue;
      }
      // fallthrough: not an exclusion line; treat as end of exclusions section
      section = null;
      currentList = null;
    }

    if (section === "classes") {
      if (ind === 2 && content.endsWith(":")) {
        // new class id
        currentClass = content.slice(0, -1).trim();
        currentClassObj = { globs: [], "licenses-md-section": null };
        out.classes[currentClass] = currentClassObj;
        currentList = null;
        continue;
      }
      if (ind === 4 && currentClassObj) {
        if (content.startsWith("globs:")) {
          const rest = content.slice("globs:".length).trim();
          if (rest.startsWith("[")) {
            currentClassObj.globs = parseInlineArray(rest);
            currentList = null;
          } else {
            currentList = currentClassObj.globs;
            listIndent = 6;
          }
          continue;
        }
        if (content.startsWith("licenses-md-section:")) {
          const rest = content.slice("licenses-md-section:".length).trim();
          currentClassObj["licenses-md-section"] = rest.replace(/^["']|["']$/g, "");
          currentList = null;
          continue;
        }
      }
      if (ind === 6 && currentList && content.startsWith("- ")) {
        const v = content.slice(2).trim().replace(/^["']|["']$/g, "");
        currentList.push(v);
        continue;
      }
      throw new Error(`unexpected content at line ${i + 1}: ${raw}`);
    }
  }

  if (Object.keys(out.classes).length === 0) {
    throw new Error("classes: must contain at least one entry");
  }
  for (const [cid, cls] of Object.entries(out.classes)) {
    if (!Array.isArray(cls.globs) || cls.globs.length === 0) {
      throw new Error(`class "${cid}" has no globs`);
    }
    if (!cls["licenses-md-section"]) {
      throw new Error(`class "${cid}" missing licenses-md-section`);
    }
  }
  return out;
}

// ─── glob matching ───────────────────────────────────────────────────────
// Supports `**` (any depth), `*` (no slash), literal segments.
function globToRegex(glob) {
  // Escape regex specials except for our wildcards.
  let i = 0;
  let re = "^";
  while (i < glob.length) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      // `**` matches any number of path segments (including zero).
      // Variants:
      //   "**/x"   → (.*/)? x   — match anywhere including root
      //   "x/**"   → x(/.*)?    — match x or x/anything
      //   "x/**/y" → x(/.*)?/y
      if (glob[i + 2] === "/") {
        re += "(?:.*/)?";
        i += 3;
      } else {
        re += ".*";
        i += 2;
      }
      continue;
    }
    if (c === "*") {
      re += "[^/]*";
      i++;
      continue;
    }
    if (c === "?") { re += "[^/]"; i++; continue; }
    if (/[.+^${}()|[\]\\]/.test(c)) re += "\\" + c;
    else re += c;
    i++;
  }
  re += "$";
  return new RegExp(re);
}

function matchesAny(path, globs) {
  for (const g of globs) {
    if (globToRegex(g).test(path)) return true;
  }
  return false;
}

// ─── scan roots (directories implied by class globs) ─────────────────────
function staticPrefix(glob) {
  // Return the longest path prefix containing no glob metacharacters.
  const segs = glob.split("/");
  const out = [];
  for (const s of segs) {
    if (/[*?[]/.test(s)) break;
    out.push(s);
  }
  return out.join("/");
}

function walk(dir, baseRel = "", out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return out;
    throw e;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const full = join(dir, e.name);
    const rel = baseRel ? `${baseRel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(full, rel, out);
    else if (e.isFile()) out.push(rel);
  }
  return out;
}

// ─── main ────────────────────────────────────────────────────────────────
function main() {
  // Phase 1 — load scope-map.
  if (!existsSync(SCOPE_MAP_PATH)) {
    fail(`docs/license-scope-map.md not found at ${relative(CWD, SCOPE_MAP_PATH)}; this file is the lint config`);
  }
  let scopeMap;
  try {
    const raw = readFileSync(SCOPE_MAP_PATH, "utf8");
    scopeMap = parseScopeMap(raw);
  } catch (e) {
    fail(`failed to parse docs/license-scope-map.md: ${e.message}`);
  }

  // Phase 1 — load LICENSES.md (needed before walking — Phase 2 also uses it).
  if (!existsSync(LICENSES_PATH)) {
    fail(`LICENSES.md not found at repo root; cannot enforce license-class attribution`);
  }
  const licensesText = readFileSync(LICENSES_PATH, "utf8");

  // Collect all class globs + exclusions.
  const allGlobs = [];
  for (const cls of Object.values(scopeMap.classes)) {
    for (const g of cls.globs) allGlobs.push(g);
  }
  const exclusionGlobs = scopeMap.exclusions ?? [];

  // Derive scan roots from static prefixes.
  const rootSet = new Set();
  for (const g of allGlobs) {
    const pfx = staticPrefix(g);
    if (!pfx) continue;
    // If the prefix is itself a file (e.g., "src/index.html"), include it directly.
    rootSet.add(pfx);
  }
  // Prune redundant roots (a root contained in another root).
  const sortedRoots = [...rootSet].sort();
  const minimalRoots = [];
  for (const r of sortedRoots) {
    if (minimalRoots.some((m) => r === m || r.startsWith(m + "/"))) continue;
    minimalRoots.push(r);
  }

  // Walk roots; gather files.
  const files = [];
  for (const r of minimalRoots) {
    const abs = resolve(CWD, r);
    if (!existsSync(abs)) continue;
    const st = statSync(abs);
    if (st.isFile()) {
      files.push(r);
    } else if (st.isDirectory()) {
      walk(abs, r, files);
    }
  }
  files.sort();

  // Phase 1 — orphan detection.
  const orphans = [];
  let attributed = 0;
  for (const f of files) {
    if (matchesAny(f, exclusionGlobs)) continue;
    if (matchesAny(f, allGlobs)) { attributed++; continue; }
    orphans.push(f);
  }

  if (orphans.length > 0) {
    for (const o of orphans) {
      stderr.write(
        `lint-license-provenance: ${o}: no LICENSES.md scope entry found; ` +
          `either add to docs/license-scope-map.md and LICENSES.md, ` +
          `OR exclude from the lint via docs/license-scope-map.md exclusions\n`,
      );
    }
    exit(1);
  }

  // Phase 2 — hash discipline.
  const hashLineRe = /^<!--\s*last-modified-hash:\s*([0-9a-f]+)\s*-->\s*$/m;
  const hashMatch = licensesText.match(hashLineRe);
  if (!hashMatch) {
    fail(`LICENSES.md missing <!-- last-modified-hash: <X> --> line; cannot enforce NFR24 drift discipline`);
  }
  const declared = hashMatch[1];
  const bodyNoHash = licensesText
    .split(/\r?\n/)
    .filter((l) => !hashLineRe.test(l + "\n") && !/^<!--\s*last-modified-hash:/.test(l))
    .join("\n");
  const actual = createHash("sha256").update(bodyNoHash, "utf8").digest("hex");

  let hashStatus = "verified";
  if (declared === PLACEHOLDER) {
    stderr.write(
      `lint-license-provenance: WARN LICENSES.md hash placeholder; real hash should be flipped to ${actual}\n`,
    );
    hashStatus = "warned";
  } else if (declared !== actual) {
    // Drift — require CHANGELOG entry naming LICENSES.md.
    if (!existsSync(CHANGELOG_PATH)) {
      fail(
        `LICENSES.md hash drift (declared=${declared.slice(0, 12)}… actual=${actual.slice(0, 12)}…) ` +
          `but CHANGELOG.md is missing; create CHANGELOG.md and add a line naming LICENSES.md`,
      );
    }
    const changelog = readFileSync(CHANGELOG_PATH, "utf8");
    if (!/LICENSES\.md/.test(changelog)) {
      fail(
        `LICENSES.md hash drift without CHANGELOG.md entry; add a CHANGELOG.md line naming LICENSES.md before merging ` +
          `(declared=${declared.slice(0, 12)}… actual=${actual.slice(0, 12)}…)`,
      );
    }
    hashStatus = "verified-via-changelog";
  }

  stdout.write(
    `lint-license-provenance: ${attributed} file(s) attributed; LICENSES.md hash ${hashStatus}\n`,
  );
  exit(0);
}

main();
