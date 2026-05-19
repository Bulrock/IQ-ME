// tests/unit/_dom-stub.mjs
//
// Shared DOM stub helpers for Story 3.3 unit tests. Naming precedent:
// `tests/contract/_state-schema-check.mjs` (Story 3-2). Leading-underscore
// marks this as a private test helper, not a test file picked up by node:test.
//
// What this module provides:
//   - makeElementStub(tag) — a minimal DOM-like element with attrs, children,
//     listeners, querySelector/querySelectorAll, addEventListener, etc.
//   - makeRootEl() — a root element whose `innerHTML` setter PARSES the assigned
//     HTML string into nested makeElementStub instances. The parser is
//     attribute-order-agnostic: it captures every attribute regardless of order.
//   - parseHTML(html) — standalone tokenizer that returns an array of root-level
//     elements (used by makeRootEl, exposed for tests that want direct access).
//
// Why not regex chains: the cycle-1 implementation used per-element regexes
// that each baked in a specific attribute order (e.g. `id` before `class`).
// That forced impl to match the test's chosen ordering — an
// implementation-detail leak from the test back into the SUT contract. The
// tokenizer below parses attributes generically, so impl is free to author
// `<button class="..." aria-disabled="true" id="continue-btn">` in any order.

// ─── Element stub ────────────────────────────────────────────────────────

export function makeElementStub(tag) {
  const attrs = Object.create(null);
  const children = [];
  const listeners = Object.create(null);
  const el = {
    tag,
    attrs,
    children,
    listeners,
    parentNode: null,
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
    removeAttribute(k) { delete attrs[k]; },
    hasAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k); },
    get id() { return attrs.id ?? ""; },
    set id(v) { attrs.id = v; },
    get className() { return attrs.class ?? ""; },
    set className(v) { attrs.class = v; },
    get href() { return attrs.href ?? ""; },
    set href(v) { attrs.href = v; },
    _text: "",
    get textContent() {
      if (this._text) return this._text;
      // Composite: concatenate textContent of children if any.
      return children.map(c => (typeof c === "object" ? c.textContent : "")).join("");
    },
    set textContent(v) { this._text = v; children.length = 0; },
    appendChild(child) {
      child.parentNode = this;
      children.push(child);
      return child;
    },
    removeChild(child) {
      const i = children.indexOf(child);
      if (i >= 0) {
        children.splice(i, 1);
        child.parentNode = null;
      }
      return child;
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
      for (const h of arr) {
        try { h(ev); } catch (_e) { /* swallow stub-internal failures */ }
      }
      return !ev.defaultPrevented;
    },
    querySelector(selector) { return queryAll(this, selector)[0] ?? null; },
    querySelectorAll(selector) { return queryAll(this, selector); },
  };
  return el;
}

function queryAll(root, selector) {
  // Supported selector shapes:
  //   '#id'            — match by attrs.id
  //   '.class'         — match by attrs.class (whitespace-tokenised)
  //   'tag'            — match by tag (case-insensitive)
  //   'A B' (space)    — descendant: A in ancestors of B (any depth)
  // Multiple parts via space are walked left-to-right.
  const parts = selector.trim().split(/\s+/);
  if (parts.length === 1) {
    const found = [];
    walkDescendants(root, (node) => { if (matchSimple(node, parts[0])) found.push(node); });
    return found;
  }
  // Descendant combinator: find all nodes matching the rightmost selector
  // whose ancestor chain contains a match for each leading selector in order.
  const matchesRight = [];
  walkDescendants(root, (node) => { if (matchSimple(node, parts[parts.length - 1])) matchesRight.push(node); });
  return matchesRight.filter(node => hasAncestorChain(node, parts.slice(0, -1)));
}

function hasAncestorChain(node, ancestorSelectors) {
  // Walk parents; for each selector (right-to-left within ancestors), must find a match.
  let cursor = node.parentNode;
  let i = ancestorSelectors.length - 1;
  while (cursor && i >= 0) {
    if (matchSimple(cursor, ancestorSelectors[i])) i--;
    cursor = cursor.parentNode;
  }
  return i < 0;
}

function matchSimple(node, sel) {
  if (!node || typeof node !== "object") return false;
  if (sel.startsWith("#")) {
    return node.attrs?.id === sel.slice(1);
  }
  if (sel.startsWith(".")) {
    const want = sel.slice(1);
    const classes = (node.attrs?.class ?? "").split(/\s+/).filter(Boolean);
    return classes.includes(want);
  }
  return (node.tag ?? "").toLowerCase() === sel.toLowerCase();
}

function walkDescendants(root, visit) {
  for (const c of root.children ?? []) {
    visit(c);
    walkDescendants(c, visit);
  }
}

// ─── HTML tokenizer (attribute-order-agnostic) ───────────────────────────

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * parseHTML(html) → array of top-level element stubs (parsed nesting included).
 *
 * Tokenizer supports:
 *   - <tag attr="..." attr='...'>...</tag>
 *   - <tag attr="..." />  (self-closing)
 *   - <void-tag attr="...">   (HTML void elements, no closing tag required)
 *   - <!-- comments -->   (skipped)
 *   - Text between tags (assigned to nearest open parent's `_text` when
 *     no element children precede it; otherwise appended as a synthetic
 *     text node — kept in `children` as `{ tag: "#text", textContent: "..." }`).
 *
 * Attribute parsing collects every `name="value"` or `name='value'` regardless
 * of order. Boolean attributes (no `=`) are stored with value `""`.
 *
 * Not supported (deliberately scope-limited): nested quotes within attributes,
 * unquoted attribute values, CDATA, <script>/<style> body parsing.
 */
export function parseHTML(html) {
  const roots = [];
  const stack = []; // stack of open elements (top = current parent)
  let i = 0;
  const n = html.length;

  const currentParent = () => stack[stack.length - 1] ?? null;

  while (i < n) {
    // Comment?
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      if (end === -1) break;
      i = end + 3;
      continue;
    }
    // Doctype / processing instruction — skip.
    if (html.startsWith("<!", i) || html.startsWith("<?", i)) {
      const end = html.indexOf(">", i);
      if (end === -1) break;
      i = end + 1;
      continue;
    }
    // Closing tag?
    if (html.startsWith("</", i)) {
      const end = html.indexOf(">", i);
      if (end === -1) break;
      const tagName = html.slice(i + 2, end).trim().toLowerCase();
      // Pop matching tag from stack (lenient — pop any until match found).
      for (let j = stack.length - 1; j >= 0; j--) {
        if (stack[j].tag === tagName) {
          stack.length = j;
          break;
        }
      }
      i = end + 1;
      continue;
    }
    // Opening tag?
    if (html[i] === "<") {
      const end = findTagEnd(html, i);
      if (end === -1) break;
      const tagBody = html.slice(i + 1, end).trim();
      const selfClosing = tagBody.endsWith("/");
      const inner = selfClosing ? tagBody.slice(0, -1).trim() : tagBody;
      const spaceIdx = findFirstSpace(inner);
      const tagName = (spaceIdx === -1 ? inner : inner.slice(0, spaceIdx)).toLowerCase();
      const attrsStr = spaceIdx === -1 ? "" : inner.slice(spaceIdx + 1);
      const el = makeElementStub(tagName);
      parseAttrs(attrsStr, el.attrs);
      // Attach to current parent.
      const parent = currentParent();
      if (parent) parent.appendChild(el);
      else roots.push(el);
      // Push to stack unless void or self-closing.
      if (!selfClosing && !VOID_TAGS.has(tagName)) {
        stack.push(el);
      }
      i = end + 1;
      continue;
    }
    // Text content.
    const nextLt = html.indexOf("<", i);
    const textEnd = nextLt === -1 ? n : nextLt;
    const text = html.slice(i, textEnd);
    if (text.trim().length > 0) {
      const parent = currentParent();
      if (parent) {
        // If parent has no element children yet, store in _text directly so
        // textContent of the parent equals this text. Otherwise append a
        // synthetic text node (preserves order with sibling elements).
        const hasElementChild = (parent.children ?? []).some(c => c && c.tag && c.tag !== "#text");
        if (!hasElementChild && !parent._text) {
          parent._text = decodeEntities(text);
        } else {
          const textNode = { tag: "#text", textContent: decodeEntities(text), children: [], attrs: {}, parentNode: parent };
          parent.children.push(textNode);
        }
      }
    }
    i = textEnd;
  }
  return roots;
}

function findTagEnd(html, start) {
  // Find the matching `>` while respecting quoted attribute values.
  let i = start + 1;
  let inSingle = false;
  let inDouble = false;
  const n = html.length;
  while (i < n) {
    const c = html[i];
    if (inSingle) {
      if (c === "'") inSingle = false;
    } else if (inDouble) {
      if (c === '"') inDouble = false;
    } else {
      if (c === "'") inSingle = true;
      else if (c === '"') inDouble = true;
      else if (c === ">") return i;
    }
    i++;
  }
  return -1;
}

function findFirstSpace(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 32 || c === 9 || c === 10 || c === 13) return i;
  }
  return -1;
}

function parseAttrs(attrsStr, target) {
  // Walk attribute string left-to-right. Attribute name is ASCII letters/digits/
  // hyphens/underscores/colons. Value is either "..." or '...' or absent (boolean).
  let i = 0;
  const n = attrsStr.length;
  while (i < n) {
    // skip whitespace
    while (i < n && /\s/.test(attrsStr[i])) i++;
    if (i >= n) break;
    // Read name.
    const nameStart = i;
    while (i < n && /[a-zA-Z0-9_:\-]/.test(attrsStr[i])) i++;
    const name = attrsStr.slice(nameStart, i);
    if (!name) { i++; continue; }
    // skip whitespace
    while (i < n && /\s/.test(attrsStr[i])) i++;
    if (attrsStr[i] !== "=") {
      target[name] = "";
      continue;
    }
    i++; // consume '='
    while (i < n && /\s/.test(attrsStr[i])) i++;
    const quote = attrsStr[i];
    if (quote === '"' || quote === "'") {
      const end = attrsStr.indexOf(quote, i + 1);
      if (end === -1) { target[name] = attrsStr.slice(i + 1); i = n; continue; }
      target[name] = decodeEntities(attrsStr.slice(i + 1, end));
      i = end + 1;
    } else {
      // Unquoted value (rare; permitted for boolean-like markup). Read until whitespace.
      const valStart = i;
      while (i < n && !/\s/.test(attrsStr[i])) i++;
      target[name] = decodeEntities(attrsStr.slice(valStart, i));
    }
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// ─── makeRootEl: app-mount stub whose innerHTML setter invokes parseHTML ──

export function makeRootEl({ tag = "MAIN", id = "app" } = {}) {
  const el = makeElementStub(tag);
  el.attrs.id = id;
  let _innerHTML = "";
  Object.defineProperty(el, "innerHTML", {
    get() { return _innerHTML; },
    set(v) {
      _innerHTML = v;
      el.children.length = 0;
      // Parse the assigned HTML into nested children.
      const roots = parseHTML(v);
      for (const r of roots) {
        r.parentNode = el;
        el.children.push(r);
      }
    },
    configurable: true,
  });
  return el;
}
