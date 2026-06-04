// tests/playwright/byte-stable.spec.mjs
//
// Story 4.2 AC-1 — byte-stable build assertion (NFR21 mechanization).
//
// Runs `make clean && make build` twice with SOURCE_DATE_EPOCH=0 propagated
// per the determinism harness contract, hashes the resulting `dist/` tree
// with `hashTree`, and asserts the two hashes are byte-identical. On failure
// emits a per-file hash diff to stderr to make debugging actionable.
//
// Per Story 4.2 Halt Condition: if this test ever fails on a deterministic
// renderer, that is a real Story-4.1 determinism bug — do not loosen.

import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { readdirSync, readFileSync, statSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

import { hashTree, sortedReaddir, DETERMINISM } from "../../tools/determinism-harness.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

// Story bridge-9a-1 — concurrency isolation. This spec used to `make clean &&
// make build` against the SHARED REPO_ROOT/dist tree, which a concurrent
// `make test` reader could observe mid-rewrite (lesson-2026-05-19-014). Each
// build now targets a fresh per-invocation tmpdir via IQME_DIST_DIR /
// IQME_DIFFICULTY_BANDS_OUT, so the spec never touches a shared artefact. Two
// independent fresh-tmpdir builds == two `make clean && make build` cycles, so
// the byte-stability contract (NFR21) is unchanged.
function runBuildToTmp() {
  const distDir = mkdtempSync(join(tmpdir(), "iqme-byte-stable-"));
  execSync("make build", {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      SOURCE_DATE_EPOCH: String(DETERMINISM.SOURCE_DATE_EPOCH),
      IQME_DIST_DIR: distDir,
      IQME_DIFFICULTY_BANDS_OUT: join(distDir, "item-difficulty-bands.json"),
    },
  });
  return distDir;
}

// Walk dist/ and produce a map of relative-path → sha256 for per-file diffing
// on failure. Uses the same sorted traversal as hashTree so file ordering is
// stable regardless of fs readdir order.
function perFileHashes(root, rel = "") {
  const acc = {};
  const here = rel ? join(root, rel) : root;
  if (!existsSync(here)) return acc;
  for (const name of sortedReaddir(here)) {
    const childRel = rel ? join(rel, name) : name;
    const full = join(root, childRel);
    const st = statSync(full);
    if (st.isDirectory()) Object.assign(acc, perFileHashes(root, childRel));
    else acc[childRel] = createHash("sha256").update(readFileSync(full)).digest("hex");
  }
  return acc;
}

test("AC-1: `make clean && make build` produces byte-identical dist/ on repeated invocation", () => {
  const distA = runBuildToTmp();
  const distB = runBuildToTmp();
  try {
    runByteStableAssertion(distA, distB);
  } finally {
    rmSync(distA, { recursive: true, force: true });
    rmSync(distB, { recursive: true, force: true });
  }
});

function runByteStableAssertion(DIST_A, DIST_B) {
  const hashA = hashTree(DIST_A);
  const filesA = perFileHashes(DIST_A);

  const hashB = hashTree(DIST_B);
  const filesB = perFileHashes(DIST_B);

  if (hashA !== hashB) {
    const allKeys = new Set([...Object.keys(filesA), ...Object.keys(filesB)]);
    const diff = [];
    for (const k of [...allKeys].sort()) {
      const a = filesA[k];
      const b = filesB[k];
      if (a !== b) diff.push(`  ${k}: ${a ?? "(missing run A)"} → ${b ?? "(missing run B)"}`);
    }
    process.stderr.write(
      `\nbyte-stable build assertion FAILED.\n` +
      `  hashA = ${hashA}\n` +
      `  hashB = ${hashB}\n` +
      `Per-file divergence:\n${diff.join("\n") || "  (none — directory structure must differ)"}\n`,
    );
  }

  expect(hashA, "build is non-deterministic — dist/ hash changed between identical invocations").toBe(hashB);
}
