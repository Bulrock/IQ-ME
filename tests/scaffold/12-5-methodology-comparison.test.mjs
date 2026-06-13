// Story 12-5 — scaffold guard for the methodology corpus comparison pages.
// EN description (letter-number-series) + comparison pages exist with required
// frontmatter; the comparison names both methodologies + carries the
// not-a-diagnosis caveat; RU/PL mirrors exist at identical paths with
// sourceHashEN === SHA-256(EN body). RED until impl.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const M = (lang, p) => join(REPO_ROOT, "src", "content", "methodology", lang, p, "index.md");

const REQUIRED_FM = ["title", "version", "lastReviewed", "reviewer", "reviewerHandle", "asserts", "glossaryRefs", "sourceHashEN"];
const PAGES = ["constructs/letter-number-series", "reference/methodology-comparison"];

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

function splitFm(text) {
  const lines = text.split(/\r?\n/);
  assert.equal(lines[0], "---", "page must start with frontmatter");
  let end = -1;
  for (let i = 1; i < lines.length; i++) { if (lines[i] === "---") { end = i; break; } }
  assert.ok(end > 0, "frontmatter must close with ---");
  return { fm: lines.slice(1, end).join("\n"), body: lines.slice(end + 1).join("\n") };
}

test("AC1/AC2/AC3: EN pages exist with all required frontmatter keys", () => {
  for (const p of PAGES) {
    const { fm } = splitFm(read(M("en", p)));
    for (const k of REQUIRED_FM) {
      assert.match(fm, new RegExp(`^${k}\\s*:`, "m"), `${p} EN frontmatter missing "${k}"`);
    }
  }
});

test("AC2: the comparison page names both methodologies + carries the not-a-diagnosis caveat", () => {
  const { body } = splitFm(read(M("en", "reference/methodology-comparison")));
  assert.match(body, /matrix/i, "comparison must name the geometric matrix methodology");
  assert.match(body, /letter|number|series/i, "comparison must name the letter/number series methodology");
  assert.match(body, /(not a (clinical )?(diagnosis|assessment)|not a credential|screen, not)/i,
    "comparison must carry the honest not-a-diagnosis caveat");
  // No fabricated precise psychometric statistic presented as measured.
  assert.ok(!/\br\s*=\s*0\.\d{2}\b/.test(body), "must not assert an invented correlation coefficient");
});

test("AC4: RU + PL mirrors exist at identical paths with sourceHashEN === SHA-256(EN body)", () => {
  for (const p of PAGES) {
    const enBody = splitFm(read(M("en", p))).body;
    const enHash = createHash("sha256").update(enBody, "utf8").digest("hex");
    for (const lang of ["ru", "pl"]) {
      const { fm } = splitFm(read(M(lang, p)));
      const m = fm.match(/^sourceHashEN\s*:\s*"?([0-9a-f]{64})"?/m);
      assert.ok(m, `${lang}/${p} must declare a 64-hex sourceHashEN`);
      assert.equal(m[1], enHash, `${lang}/${p} sourceHashEN must match the current EN body hash (NFR27 parity)`);
      assert.match(fm, /reviewer\s*:\s*"?TBD/i, `${lang}/${p} reviewer must be TBD (gated draft posture)`);
    }
  }
});
