// Unit tests for tools/lint-csp-source.mjs.
// Story 4-8 — red-phase failing tests authored pre-implementation.
//
// The lint scans `src/index.html` and (if present) `dist/methodology/**/*.html`
// asserting NFR7 CSP-source contract:
//   - no <style> element
//   - no <script> element with inline body (src= is OK)
//   - no style="..." attribute
//   - no on*="..." event-handler attributes
//
// Architectural exemption (per architecture.md §D10):
//   - <script nomodule> with body limited to display-toggle is allowed (the
//     only inline script the project ships).
//   - style="display:none" on the #fallback element is allowed (the D10
//     fallback container).
//
// Lint invocation:
//   node tools/lint-csp-source.mjs --paths=<file-or-dir>[,<file-or-dir>...]
// Default scope (no --paths): src/index.html + dist/methodology/**/*.html.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/lint-csp-source.mjs");

function withDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "lint-csp-"));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

function writeHtml(dir, name, html) {
  const full = join(dir, name);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
  return full;
}

function runLint(paths, cwd = REPO_ROOT) {
  const args = paths ? [`--paths=${paths}`] : [];
  return spawnSync("node", [SCRIPT, ...args], { cwd, encoding: "utf8" });
}

// AC-7.1 — clean HTML with <link> + <script src> → exit 0.
test("lint-csp-source: clean HTML (external script + external stylesheet) passes", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "clean.html", [
      "<!doctype html>",
      "<html><head>",
      '<link rel="stylesheet" href="/x.css">',
      "</head><body>",
      "<p>hello</p>",
      '<script type="module" src="/x.js"></script>',
      "</body></html>",
      "",
    ].join("\n"));
    const r = runLint(f);
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr} stdout=${r.stdout}`);
    assert.match(r.stdout, /scanned/);
  });
});

// AC-7.2 — inline <style> element → fail.
test("lint-csp-source: <style> element fails", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "style.html",
      "<!doctype html><html><head><style>p{color:red}</style></head><body></body></html>\n");
    const r = runLint(f);
    assert.equal(r.status, 1, `expected exit 1; stderr=${r.stderr}`);
    assert.match(r.stderr, /style.*element|inline style element/i);
  });
});

// AC-7.3 — inline style="..." attribute → fail.
test("lint-csp-source: inline style=\"...\" attribute fails", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "attr.html",
      '<!doctype html><html><body><p style="color:red">hi</p></body></html>\n');
    const r = runLint(f);
    assert.equal(r.status, 1, `expected exit 1; stderr=${r.stderr}`);
    assert.match(r.stderr, /inline.*style.*attribute|style="/i);
  });
});

// AC-7.4 — inline <script>...</script> with body → fail.
test("lint-csp-source: inline <script>body</script> fails", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "inline-script.html",
      "<!doctype html><html><body><script>alert(1)</script></body></html>\n");
    const r = runLint(f);
    assert.equal(r.status, 1, `expected exit 1; stderr=${r.stderr}`);
    assert.match(r.stderr, /inline script/i);
  });
});

// AC-7.5 — <script src="..."> with no body → pass.
test("lint-csp-source: <script src> with no body passes", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "extsrc.html",
      '<!doctype html><html><body><script type="module" src="/m.js"></script></body></html>\n');
    const r = runLint(f);
    assert.equal(r.status, 0, `expected exit 0; stderr=${r.stderr} stdout=${r.stdout}`);
  });
});

// AC-7.6 — onclick="..." event-handler attribute → fail.
test("lint-csp-source: onclick=\"...\" attribute fails", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "onclick.html",
      '<!doctype html><html><body><button onclick="boom()">x</button></body></html>\n');
    const r = runLint(f);
    assert.equal(r.status, 1, `expected exit 1; stderr=${r.stderr}`);
    assert.match(r.stderr, /event.handler|on[a-z]+=/i);
  });
});

// AC-7.7 — architectural exemption: <script nomodule> with display-toggle body passes.
test("lint-csp-source: <script nomodule> display-toggle body passes (D10 exemption)", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "nomodule.html", [
      "<!doctype html><html><body>",
      "<main id=\"app\"></main>",
      '<div id="fallback" style="display:none"></div>',
      "<script nomodule>",
      "document.getElementById('fallback').style.display='block';",
      "document.getElementById('app').style.display='none';",
      "</script>",
      "</body></html>",
      "",
    ].join("\n"));
    const r = runLint(f);
    assert.equal(r.status, 0,
      `expected exit 0 (D10 exemption); stderr=${r.stderr} stdout=${r.stdout}`);
  });
});

// AC-7.8 — <script nomodule> with NON-display-toggle body still fails (exemption is narrow).
test("lint-csp-source: <script nomodule> with foreign body still fails", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "nomodule-bad.html", [
      "<!doctype html><html><body>",
      "<script nomodule>",
      "fetch('//evil.example/x').then(r=>r.json())",
      "</script>",
      "</body></html>",
      "",
    ].join("\n"));
    const r = runLint(f);
    assert.equal(r.status, 1, `expected exit 1; stderr=${r.stderr}`);
    assert.match(r.stderr, /inline script|nomodule/i);
  });
});

// AC-7.9 — diagnostic line format: lint-csp-source: <file>: <violation>
test("lint-csp-source: diagnostic line names file and violation", () => {
  withDir((dir) => {
    const f = writeHtml(dir, "fmt.html",
      '<!doctype html><html><body><p style="x">hi</p></body></html>\n');
    const r = runLint(f);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /lint-csp-source:.*fmt\.html.*/);
  });
});
