// src/assessment/cite-this-page.js
//
// Story 4.6 AC-3/AC-5 — cite-this-page widget for methodology corpus pages.
// Pure ES module, stdlib browser API only (no third-party). Reads frontmatter
// values from the <meta name="iqme-*"> tags injected by the builder
// (tools/build-methodology.mjs), renders a widget into the
// `<aside class="cite-this-page-affordance"><div data-cite-widget>` placeholder,
// and exposes copy-to-clipboard for two formats: APA + Wikipedia-template.
//
// DOI handling (visible-fallback discipline per Story 1.3): when DOI is empty
// the page URL is used as the citation link target, and the Wikipedia-template
// emits an empty `doi=` field (Karolina sees a real URL she can paste).
//
// Wikipedia-template-injection guard: any `|` or `=` or `}}` characters that
// appear in user-controlled fields are HTML-numeric-escaped (`&#124;` for `|`,
// `&#61;` for `=`) so they can't break the template syntax.
//
// Exports (for unit tests):
//   readMeta(doc)             → meta-bag from <meta name="iqme-*">
//   yearFromDate(s)           → "YYYY" or "n.d." fallback
//   formatApa(meta)           → APA citation string
//   formatWikipediaTemplate(meta) → {{cite web | ... }} string
//   init(doc)                 → render widget into [data-cite-widget] placeholder
//
// Auto-init: on DOMContentLoaded (only when running in a browser context).

const META_KEYS = [
  "iqme-title",
  "iqme-version",
  "iqme-doi",
  "iqme-last-reviewed",
  "iqme-reviewer",
  "iqme-reviewer-handle",
  "iqme-lang",
  "iqme-url",
];

// Escape `|`, `=`, `{`, `}` to prevent Wikipedia-template injection from
// user-controlled field values.
function escWiki(s) {
  return String(s)
    .replace(/\|/g, "&#124;")
    .replace(/=/g, "&#61;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}

export function readMeta(doc) {
  const out = Object.create(null);
  let anyFound = false;
  for (const name of META_KEYS) {
    const el = doc.querySelector(`meta[name="${name}"]`);
    if (el) {
      anyFound = true;
      const v = el.getAttribute ? el.getAttribute("content") : (el.attrs?.content ?? "");
      out[name] = v == null ? "" : String(v);
    } else {
      out[name] = "";
    }
  }
  out._anyFound = anyFound;
  return out;
}

export function yearFromDate(s) {
  const m = /^(\d{4})-\d{2}-\d{2}$/.exec(String(s ?? ""));
  return m ? m[1] : "n.d.";
}

export function formatApa(meta) {
  const reviewer = meta["iqme-reviewer"] || "TBD";
  const year = yearFromDate(meta["iqme-last-reviewed"]);
  const title = meta["iqme-title"] || "(untitled)";
  const version = meta["iqme-version"] || "v0.0.0";
  const doi = meta["iqme-doi"] || "";
  const url = meta["iqme-url"] || "";
  const link = doi ? `https://doi.org/${doi}` : url;
  return `${reviewer}. (${year}). ${title}. IQ-ME Methodology Corpus, ${version}. ${link}`;
}

export function formatWikipediaTemplate(meta) {
  const title = escWiki(meta["iqme-title"] || "(untitled)");
  const date = escWiki(meta["iqme-last-reviewed"] || "");
  const version = escWiki(meta["iqme-version"] || "");
  const url = escWiki(meta["iqme-url"] || "");
  const doi = escWiki(meta["iqme-doi"] || "");
  const reviewer = escWiki(meta["iqme-reviewer"] || "");
  return (
    `{{cite web | title=${title} | website=IQ-ME Methodology Corpus ` +
    `| date=${date} | version=${version} | url=${url} | doi=${doi} ` +
    `| reviewer=${reviewer} }}`
  );
}

// ── DOM construction helpers ─────────────────────────────────────────────

function el(doc, tag, attrs, textOrChildren) {
  const node = doc.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (v === true) {
        node.setAttribute(k, "");
      } else {
        node.setAttribute(k, String(v));
      }
    }
  }
  if (typeof textOrChildren === "string") {
    node.textContent = textOrChildren;
  } else if (Array.isArray(textOrChildren)) {
    for (const child of textOrChildren) {
      if (child) node.appendChild(child);
    }
  }
  return node;
}

function buildWidget(doc, meta) {
  const widgetRoot = doc.querySelector("[data-cite-widget]");
  if (!widgetRoot) return null;
  // Promote the placeholder div to the widget container.
  widgetRoot.setAttribute("class", "cite-this-page-widget");
  // Clear any pre-existing children (the placeholder is empty by contract,
  // but be defensive against repeat-init).
  while (widgetRoot.children.length > 0) {
    widgetRoot.removeChild(widgetRoot.children[0]);
  }
  widgetRoot._text = "";

  if (!meta._anyFound) {
    widgetRoot.appendChild(
      el(doc, "p", { class: "cite-this-page-widget__warning" }, "(no metadata)"),
    );
    return widgetRoot;
  }

  const apaText = formatApa(meta);
  const wikiText = formatWikipediaTemplate(meta);

  const heading = el(doc, "h2", { class: "cite-this-page-widget__heading" }, "Cite this page");

  const apaTab = el(doc, "button", {
    type: "button",
    class: "cite-this-page-widget__tab",
    "data-cite-format": "apa",
    role: "tab",
    id: "cite-tab-apa",
    "aria-controls": "cite-panel-apa",
    "aria-selected": "true",
  }, "APA");
  const wikiTab = el(doc, "button", {
    type: "button",
    class: "cite-this-page-widget__tab",
    "data-cite-format": "wikipedia",
    role: "tab",
    id: "cite-tab-wikipedia",
    "aria-controls": "cite-panel-wikipedia",
    "aria-selected": "false",
  }, "Wikipedia template");
  const tabs = el(doc, "div", { class: "cite-this-page-widget__tabs", role: "tablist" }, [apaTab, wikiTab]);

  const header = el(doc, "div", { class: "cite-this-page-widget__header" }, [heading, tabs]);

  const apaPre = el(doc, "pre", {
    class: "cite-format-apa",
    id: "cite-panel-apa",
    role: "tabpanel",
    "aria-labelledby": "cite-tab-apa",
  }, apaText);
  const wikiPre = el(doc, "pre", {
    class: "cite-format-wikipedia",
    id: "cite-panel-wikipedia",
    role: "tabpanel",
    "aria-labelledby": "cite-tab-wikipedia",
  }, wikiText);
  wikiPre.setAttribute("hidden", "");

  const copyBtn = el(doc, "button", {
    type: "button",
    class: "cite-this-page-widget__copy-btn",
    "data-cite-copy": "",
  }, "Copy citation");

  widgetRoot.appendChild(header);
  widgetRoot.appendChild(apaPre);
  widgetRoot.appendChild(wikiPre);
  widgetRoot.appendChild(copyBtn);

  // State: which format is active.
  const state = { active: "apa" };

  function selectFormat(name) {
    state.active = name;
    if (name === "apa") {
      apaTab.setAttribute("aria-selected", "true");
      wikiTab.setAttribute("aria-selected", "false");
      apaPre.removeAttribute("hidden");
      wikiPre.setAttribute("hidden", "");
    } else {
      apaTab.setAttribute("aria-selected", "false");
      wikiTab.setAttribute("aria-selected", "true");
      apaPre.setAttribute("hidden", "");
      wikiPre.removeAttribute("hidden");
    }
  }

  apaTab.addEventListener("click", () => selectFormat("apa"));
  wikiTab.addEventListener("click", () => selectFormat("wikipedia"));

  copyBtn.addEventListener("click", () => {
    const text = state.active === "apa" ? apaText : wikiText;
    const clip = (typeof navigator !== "undefined" && navigator.clipboard)
      ? navigator.clipboard : null;
    if (clip && typeof clip.writeText === "function") {
      // Fire and forget; widget contract doesn't await.
      clip.writeText(text);
    }
  });

  return widgetRoot;
}

export function init(doc) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return null;
  const meta = readMeta(d);
  return buildWidget(d, meta);
}

// Auto-init on DOMContentLoaded when running in a browser context. The test
// suite imports the module without an actual document.readyState lifecycle, so
// we gate on the presence of a real-window-style document with addEventListener.
if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { init(document); });
  } else {
    // Document already parsed; init synchronously.
    // (Module is loaded with `defer` so this branch is the normal path.)
    init(document);
  }
}
