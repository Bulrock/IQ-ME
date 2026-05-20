// tests/unit/cite-this-page.test.mjs
//
// Story 4.6 AC-3 + AC-7 — cite-this-page widget (src/assessment/cite-this-page.js).
//
// Unit tests for:
//   - APA + Wikipedia-template citation generators (with/without DOI)
//   - Year extraction from lastReviewed (YYYY-MM-DD)
//   - Reviewer/handle escaping (Wikipedia-template injection guard)
//   - DOM init on data-cite-widget placeholder
//   - Click handler + navigator.clipboard.writeText (mocked)
//   - APA ↔ Wikipedia-template toggle
//   - Graceful degradation when meta tags are absent
//
// Strategy: hand-rolled DOM stub mirroring src/assessment/cite-this-page.js's
// surface area. Each test seeds a fresh `globalThis.document`, `window`,
// `navigator` and re-imports the module (cache-busted via dynamic import +
// query string).

import { test } from "node:test";
import assert from "node:assert/strict";

import { makeElementStub, parseHTML } from "./_dom-stub.mjs";

// ── DOM-stub helpers (Story-4-6 local; mirrors but extends _dom-stub.mjs) ──

function makeDocStub(initialHTML) {
  const docFragmentRoot = makeElementStub("#document");
  // Pre-populate via parseHTML if given.
  if (initialHTML) {
    const roots = parseHTML(initialHTML);
    for (const r of roots) {
      r.parentNode = docFragmentRoot;
      docFragmentRoot.children.push(r);
    }
  }
  const metaMap = new Map();
  // Index <meta name="..." content="..."> nodes for quick lookup.
  function indexMeta(node) {
    if (node?.tag === "meta" && node.attrs?.name) {
      metaMap.set(node.attrs.name, node.attrs.content ?? "");
    }
    for (const c of node?.children ?? []) indexMeta(c);
  }
  indexMeta(docFragmentRoot);
  const listeners = Object.create(null);
  const doc = {
    _root: docFragmentRoot,
    querySelector(sel) {
      // Accept simple selectors used by impl:
      //   'meta[name="iqme-title"]'  → look up by metaMap
      //   '[data-cite-widget]'       → walk tree for any attr data-cite-widget
      //   '.cite-this-page-widget'   → class match
      const metaMatch = sel.match(/^meta\[name="([^"]+)"\]$/);
      if (metaMatch) {
        const name = metaMatch[1];
        if (!metaMap.has(name)) return null;
        return { getAttribute: (k) => (k === "content" ? metaMap.get(name) : null), attrs: { content: metaMap.get(name) } };
      }
      // Walk for data-cite-widget attribute or class selector.
      return walkFind(docFragmentRoot, sel);
    },
    querySelectorAll(sel) {
      const acc = [];
      walkAll(docFragmentRoot, sel, acc);
      return acc;
    },
    createElement(tag) {
      const el = makeElementStub(tag);
      // Add minimal innerHTML setter (parse + attach).
      let _inner = "";
      Object.defineProperty(el, "innerHTML", {
        get() { return _inner; },
        set(v) {
          _inner = v;
          el.children.length = 0;
          const roots = parseHTML(v);
          for (const r of roots) {
            r.parentNode = el;
            el.children.push(r);
          }
        },
        configurable: true,
      });
      return el;
    },
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    removeEventListener(type, handler) {
      const arr = listeners[type];
      if (!arr) return;
      const i = arr.indexOf(handler);
      if (i >= 0) arr.splice(i, 1);
    },
    dispatchEvent(ev) {
      const arr = listeners[ev.type] || [];
      for (const h of arr) h(ev);
    },
    // Helper used by tests to fire DOMContentLoaded after module init.
    _fireDOMContentLoaded() {
      this.dispatchEvent({ type: "DOMContentLoaded" });
    },
    readyState: "loading",
  };
  return doc;
}

function walkFind(node, sel) {
  if (!node) return null;
  if (matchSel(node, sel)) return node;
  for (const c of node.children ?? []) {
    const found = walkFind(c, sel);
    if (found) return found;
  }
  return null;
}

function walkAll(node, sel, acc) {
  if (!node) return;
  if (matchSel(node, sel)) acc.push(node);
  for (const c of node.children ?? []) walkAll(c, sel, acc);
}

function matchSel(node, sel) {
  if (!node || !node.attrs) return false;
  if (sel.startsWith("[") && sel.endsWith("]")) {
    const attr = sel.slice(1, -1);
    return Object.prototype.hasOwnProperty.call(node.attrs, attr);
  }
  if (sel.startsWith(".")) {
    const want = sel.slice(1);
    const cls = node.attrs.class ?? "";
    return cls.split(/\s+/).includes(want);
  }
  // Tag fallback
  return node.tag?.toLowerCase() === sel.toLowerCase();
}

// Standard meta payload used by most tests.
const META_OK = `
<html><head>
<meta name="iqme-title" content="Sample page">
<meta name="iqme-version" content="v0.1.0">
<meta name="iqme-doi" content="">
<meta name="iqme-last-reviewed" content="2026-05-19">
<meta name="iqme-reviewer" content="Sample Reviewer">
<meta name="iqme-reviewer-handle" content="@sample-handle">
<meta name="iqme-lang" content="en">
<meta name="iqme-url" content="https://iq-me.example/methodology/v0.1.0/en/scoring/overview/">
</head><body>
<aside class="cite-this-page-affordance"><div data-cite-widget></div></aside>
</body></html>
`;

const META_WITH_DOI = `
<html><head>
<meta name="iqme-title" content="Sample page">
<meta name="iqme-version" content="v0.1.0">
<meta name="iqme-doi" content="10.5281/zenodo.9999999">
<meta name="iqme-last-reviewed" content="2026-05-19">
<meta name="iqme-reviewer" content="Sample Reviewer">
<meta name="iqme-reviewer-handle" content="@sample-handle">
<meta name="iqme-lang" content="en">
<meta name="iqme-url" content="https://iq-me.example/methodology/v0.1.0/en/scoring/overview/">
</head><body>
<aside class="cite-this-page-affordance"><div data-cite-widget></div></aside>
</body></html>
`;

const META_MISSING = `
<html><head></head><body>
<aside class="cite-this-page-affordance"><div data-cite-widget></div></aside>
</body></html>
`;

// Helper: import the SUT fresh per test (cache-bust via dynamic suffix).
async function importCiteModule() {
  // Module caching: Node ESM caches by URL. Use a query suffix to dodge cache.
  const url = new URL("../../src/assessment/cite-this-page.js", import.meta.url);
  url.search = `?t=${Date.now()}-${Math.random()}`;
  return await import(url.href);
}

function setupGlobals(html) {
  const doc = makeDocStub(html);
  Object.defineProperty(globalThis, "document", { value: doc, configurable: true, writable: true });
  Object.defineProperty(globalThis, "window", { value: { document: doc }, configurable: true, writable: true });
  const calls = [];
  Object.defineProperty(globalThis, "navigator", {
    value: { clipboard: { writeText: async (txt) => { calls.push(txt); return undefined; } } },
    configurable: true,
    writable: true,
  });
  return { doc, clipboardCalls: calls };
}

function teardownGlobals() {
  try { delete globalThis.document; } catch { /* ignore */ }
  try { delete globalThis.window; } catch { /* ignore */ }
  try { delete globalThis.navigator; } catch { /* ignore */ }
}

// ── Tests ─────────────────────────────────────────────────────────────────

test("AC-3 4.6: APA citation uses page URL when DOI is empty", async () => {
  setupGlobals(META_OK);
  try {
    const mod = await importCiteModule();
    const meta = mod.readMeta(document);
    const apa = mod.formatApa(meta);
    assert.match(apa, /Sample Reviewer\. \(2026\)\. Sample page\./);
    assert.match(apa, /IQ-ME Methodology Corpus/);
    assert.match(apa, /v0\.1\.0/);
    assert.match(apa, /https:\/\/iq-me\.example\//);
    assert.ok(!/doi\.org/.test(apa), `APA should not reference doi.org when DOI empty; got: ${apa}`);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: APA citation uses DOI URL when DOI is populated", async () => {
  setupGlobals(META_WITH_DOI);
  try {
    const mod = await importCiteModule();
    const meta = mod.readMeta(document);
    const apa = mod.formatApa(meta);
    assert.match(apa, /https:\/\/doi\.org\/10\.5281\/zenodo\.9999999/);
    // Should not also include the canonical URL as the link target when DOI present.
    assert.ok(!/iq-me\.example/.test(apa), `APA should prefer DOI over URL when DOI populated; got: ${apa}`);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: Wikipedia-template citation contains all fields with DOI populated", async () => {
  setupGlobals(META_WITH_DOI);
  try {
    const mod = await importCiteModule();
    const meta = mod.readMeta(document);
    const wt = mod.formatWikipediaTemplate(meta);
    assert.match(wt, /\{\{cite web/);
    assert.match(wt, /title=Sample page/);
    assert.match(wt, /website=IQ-ME Methodology Corpus/);
    assert.match(wt, /date=2026-05-19/);
    assert.match(wt, /version=v0\.1\.0/);
    assert.match(wt, /url=https:\/\/iq-me\.example\//);
    assert.match(wt, /doi=10\.5281\/zenodo\.9999999/);
    assert.match(wt, /reviewer=Sample Reviewer/);
    assert.match(wt, /\}\}\s*$/);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: Wikipedia-template citation emits empty doi= when DOI absent", async () => {
  setupGlobals(META_OK);
  try {
    const mod = await importCiteModule();
    const meta = mod.readMeta(document);
    const wt = mod.formatWikipediaTemplate(meta);
    assert.match(wt, /doi=\s*\|/, `expected empty doi= field; got: ${wt}`);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: year extracted from lastReviewed YYYY-MM-DD", async () => {
  setupGlobals(META_OK);
  try {
    const mod = await importCiteModule();
    assert.equal(mod.yearFromDate("2026-05-19"), "2026");
    assert.equal(mod.yearFromDate("1999-12-31"), "1999");
    // Graceful fallback when malformed:
    assert.equal(mod.yearFromDate(""), "n.d.");
    assert.equal(mod.yearFromDate("not-a-date"), "n.d.");
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: Wikipedia-template reviewer/handle pipes are escaped to prevent template injection", async () => {
  const malicious = META_OK.replace(
    `content="@sample-handle"`,
    `content="@evil|injected=true"`,
  ).replace(
    `content="Sample Reviewer"`,
    `content="Bad|Name"`,
  );
  setupGlobals(malicious);
  try {
    const mod = await importCiteModule();
    const meta = mod.readMeta(document);
    const wt = mod.formatWikipediaTemplate(meta);
    // Pipes inside field values must be escaped (e.g., to &#124; or {{!}}).
    // We accept either common Wikipedia escaping idiom; the contract is:
    // the raw `|` must NOT appear inside the reviewer field's value.
    assert.ok(!/reviewer=Bad\|Name/.test(wt), `pipe must be escaped in reviewer field; got: ${wt}`);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: init replaces data-cite-widget placeholder with full widget DOM", async () => {
  const { doc } = setupGlobals(META_OK);
  try {
    const mod = await importCiteModule();
    mod.init(doc);
    // After init, the affordance container should now contain a widget root.
    const widget = doc.querySelector(".cite-this-page-widget");
    assert.ok(widget, "expected .cite-this-page-widget after init");
    // The placeholder <div data-cite-widget> may persist as the widget root
    // OR be replaced; either way, a cite widget element must exist.
    // Both <pre class="cite-format-apa"> and cite-format-wikipedia must be present.
    const apaBlock = doc.querySelector(".cite-format-apa");
    const wpBlock = doc.querySelector(".cite-format-wikipedia");
    assert.ok(apaBlock, "expected .cite-format-apa block");
    assert.ok(wpBlock, "expected .cite-format-wikipedia block");
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: clicking the copy button invokes navigator.clipboard.writeText with the active citation", async () => {
  const { doc, clipboardCalls } = setupGlobals(META_OK);
  try {
    const mod = await importCiteModule();
    mod.init(doc);
    // Find the copy-button and fire a synthetic click event through listeners.
    const button = doc.querySelector(".cite-this-page-widget__copy-btn") ||
                   walkFind(doc._root, "[data-cite-copy]");
    assert.ok(button, "expected a copy button (.cite-this-page-widget__copy-btn or [data-cite-copy])");
    // Dispatch a click event on the button.
    button.dispatchEvent({ type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });
    // Allow the promise from clipboard.writeText to settle.
    await new Promise((r) => setImmediate(r));
    assert.equal(clipboardCalls.length, 1, `expected exactly 1 clipboard call; got ${clipboardCalls.length}`);
    // Default format is APA — expect Sample Reviewer + Sample page in the call.
    assert.match(clipboardCalls[0], /Sample Reviewer/);
    assert.match(clipboardCalls[0], /Sample page/);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: format toggle switches between APA and Wikipedia-template", async () => {
  const { doc, clipboardCalls } = setupGlobals(META_OK);
  try {
    const mod = await importCiteModule();
    mod.init(doc);
    // Find toggle button (radio/tab/button); contract: an element with
    // [data-cite-format="wikipedia"] toggles to the Wikipedia-template active state.
    const toggle = walkFind(doc._root, `[data-cite-format]`);
    assert.ok(toggle, "expected a [data-cite-format] toggle element");
    // Find the wikipedia-specific toggle (may itself or a sibling).
    let wikiToggle = walkFind(doc._root, `[data-cite-format]`);
    // Iterate descendants for one whose attr value is wikipedia.
    function findByAttr(node, attr, val) {
      if (node?.attrs?.[attr] === val) return node;
      for (const c of node?.children ?? []) {
        const f = findByAttr(c, attr, val);
        if (f) return f;
      }
      return null;
    }
    wikiToggle = findByAttr(doc._root, "data-cite-format", "wikipedia");
    assert.ok(wikiToggle, "expected an element with data-cite-format=\"wikipedia\"");
    wikiToggle.dispatchEvent({ type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });
    // Now click the copy button — should copy the Wikipedia-template, not APA.
    const button = walkFind(doc._root, "[data-cite-copy]") ||
                   doc.querySelector(".cite-this-page-widget__copy-btn");
    assert.ok(button, "expected a copy button");
    button.dispatchEvent({ type: "click", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });
    await new Promise((r) => setImmediate(r));
    assert.equal(clipboardCalls.length, 1);
    assert.match(clipboardCalls[0], /\{\{cite web/, `expected Wikipedia-template after toggle; got: ${clipboardCalls[0]}`);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: missing meta tags trigger graceful degradation (no throw, warning shown)", async () => {
  const { doc } = setupGlobals(META_MISSING);
  try {
    const mod = await importCiteModule();
    // Must not throw.
    let threw = null;
    try { mod.init(doc); } catch (e) { threw = e; }
    assert.equal(threw, null, `init must not throw on missing meta tags; got ${threw?.stack || threw}`);
    // Widget must render a visible warning string ("no metadata").
    const widget = doc.querySelector(".cite-this-page-widget");
    assert.ok(widget, "expected widget to render even with no meta tags");
    function collectText(node) {
      let out = (node?._text ?? "") + " ";
      for (const c of node?.children ?? []) out += collectText(c);
      return out;
    }
    const text = collectText(widget).toLowerCase();
    assert.ok(/no metadata/.test(text), `expected 'no metadata' warning text; got: ${text.slice(0, 300)}`);
  } finally { teardownGlobals(); }
});

test("AC-3 4.6: module has no inline scripts / no third-party imports", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const src = readFileSync(
    fileURLToPath(new URL("../../src/assessment/cite-this-page.js", import.meta.url)),
    "utf8",
  );
  const importLines = src.match(/^import .*$/gm) || [];
  for (const line of importLines) {
    // Only stdlib (node:) or relative imports permitted; no bare-specifier third-party.
    const isStdlib = /from\s+["']node:/.test(line);
    const isRelative = /from\s+["']\.{1,2}\//.test(line);
    assert.ok(isStdlib || isRelative, `non-stdlib/non-relative import detected: ${line}`);
  }
  // No usage of document.write (CSP).
  assert.ok(!/document\.write\s*\(/.test(src), "must not use document.write");
});
