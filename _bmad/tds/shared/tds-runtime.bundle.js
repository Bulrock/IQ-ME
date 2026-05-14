#!/usr/bin/env node
import { createRequire as __cr } from 'node:module'; import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path'; const require = __cr(import.meta.url); globalThis.__filename ??= __ftp(import.meta.url); globalThis.__dirname ??= __dn(globalThis.__filename);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key2, node, visitor, path) {
      const ctrl = callVisitor(key2, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key2, path, ctrl);
        return visit_(key2, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key2, node, visitor, path) {
      const ctrl = await callVisitor(key2, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key2, path, ctrl);
        return visitAsync_(key2, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key2, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key2, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key2, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key2, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key2, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key2, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key2, node, path);
      return void 0;
    }
    function replaceNode(key2, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key2] = node;
      } else if (identity.isPair(parent)) {
        if (key2 === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key2, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key2, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v = value;
      for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key2, ...rest] = path;
          const node = this.get(key2, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key2, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key2}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key2, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key2);
        const node = this.get(key2, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key2}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key2, ...rest] = path;
        const node = this.get(key2, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key2, ...rest] = path;
        if (rest.length === 0)
          return this.has(key2);
        const node = this.get(key2, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key2, ...rest] = path;
        if (rest.length === 0) {
          this.set(key2, value);
        } else {
          const node = this.get(key2, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key2, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key2}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key: key2, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key2) && key2.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key2) || !identity.isNode(key2) && typeof key2 === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key2 || keyComment && value == null && !ctx.inFlow || identity.isCollection(key2) || (identity.isScalar(key2) ? key2.type === Scalar.Scalar.BLOCK_FOLDED || key2.type === Scalar.Scalar.BLOCK_LITERAL : typeof key2 === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key2, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key2) => (merge.identify(key2) || identity.isScalar(key2) && (!key2.type || key2.type === Scalar.Scalar.PLAIN) && merge.identify(key2.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      value = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
      if (identity.isSeq(value))
        for (const it of value.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(value))
        for (const it of value)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, value);
    }
    function mergeValue(ctx, map, value) {
      const source = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key2, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key2))
            map.set(key2, value2);
        } else if (map instanceof Set) {
          map.add(key2);
        } else if (!Object.prototype.hasOwnProperty.call(map, key2)) {
          Object.defineProperty(map, key2, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key: key2, value }) {
      if (identity.isNode(key2) && key2.addToJSMap)
        key2.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key2))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key2, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key2, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key2, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key2) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key2.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key2, value, ctx) {
      const k = createNode.createNode(key2, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key2, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key2;
        this.value = value;
      }
      clone(schema) {
        let { key: key2, value } = this;
        if (identity.isNode(key2))
          key2 = key2.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key2, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key2) {
      const k = identity.isScalar(key2) ? key2.value : key2;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key2 || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key2, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key2, value);
          else if (Array.isArray(replacer) && !replacer.includes(key2))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key2, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key2, value] of obj)
            add(key2, value);
        } else if (obj && typeof obj === "object") {
          for (const key2 of Object.keys(obj))
            add(key2, obj[key2]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key2) {
        const it = findPair(this.items, key2);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key2, keepScalar) {
        const it = findPair(this.items, key2);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key2) {
        return !!findPair(this.items, key2);
      }
      set(key2, value) {
        this.add(new Pair.Pair(key2, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key2) {
        const idx = asItemIndex(key2);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key2, keepScalar) {
        const idx = asItemIndex(key2);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key2) {
        const idx = asItemIndex(key2);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key2, value) {
        const idx = asItemIndex(key2);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key2}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key2 = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key2, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key2) {
      let idx = identity.isScalar(key2) ? key2.value : key2;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key2, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key2 = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key2 = keys[0];
              value = it[key2];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key2 = it;
          }
          pairs2.items.push(Pair.createPair(key2, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key2, value;
          if (identity.isPair(pair)) {
            key2 = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key2, ctx);
          } else {
            key2 = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key2))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key2, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key: key2 } of pairs$1.items) {
          if (identity.isScalar(key2)) {
            if (seenKeys.includes(key2.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key2.value}`);
            } else {
              seenKeys.push(key2.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key2) {
        let pair;
        if (identity.isPair(key2))
          pair = key2;
        else if (key2 && typeof key2 === "object" && "key" in key2 && "value" in key2 && key2.value === null)
          pair = new Pair.Pair(key2.key, null);
        else
          pair = new Pair.Pair(key2, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key2, keepPair) {
        const pair = YAMLMap.findPair(this.items, key2);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key2, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key2);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key2));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key2) => key2 !== "yaml11").map((key2) => JSON.stringify(key2)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key2) => JSON.stringify(key2)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key2, value, options = {}) {
        const k = this.createNode(key2, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key2) {
        return assertCollection(this.contents) ? this.contents.delete(key2) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key2, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key2, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key2) {
        return identity.isCollection(this.contents) ? this.contents.has(key2) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key2, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key2], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key2, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key2) {
      if (!key2)
        return null;
      switch (key2.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key2.source.includes("\n"))
            return true;
          if (key2.end) {
            for (const st of key2.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key2.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key: key2, sep: sep3, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key2 ?? sep3?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key2) {
            if (key2.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key2 && key2.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep3) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key2)) {
            onError(key2 ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key2 ? composeNode(ctx, key2, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key2, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep3 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key2 || key2.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep3, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep3 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep3 + cb;
              sep3 = "";
              break;
            }
            case "newline":
              if (comment)
                sep3 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key: key2, sep: sep3, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key2 ?? sep3?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep3 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key2))
            onError(
              key2,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep3 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep3, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key2 ? composeNode(ctx, key2, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key2))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep3 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep3)
                for (const st of sep3) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep3, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep3 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep3 + indent.slice(trimIndent) + content;
          sep3 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep3 === " ")
            sep3 = "\n";
          else if (!prevMoreIndented && sep3 === "\n")
            sep3 = "\n\n";
          value += sep3 + indent.slice(trimIndent) + content;
          sep3 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep3 === "\n")
            value += "\n";
          else
            sep3 = "\n";
        } else {
          value += sep3 + content;
          sep3 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep3 = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep3 === "\n")
            res += sep3;
          else
            sep3 = "\n";
        } else {
          res += sep3 + match[1];
          sep3 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep3 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = { x: 2, u: 4, U: 8 }[next];
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      if (isNaN(code)) {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
      return String.fromCodePoint(code);
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          Array.prototype.push.apply(doc.errors, this.errors);
          Array.prototype.push.apply(doc.warnings, this.warnings);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key2 of Object.keys(token))
          if (key2 !== "type" && key2 !== "offset")
            delete token[key2];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key2 of Object.keys(token))
            if (key2 !== "type" && key2 !== "offset")
              delete token[key2];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key: key2, sep: sep3, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key2)
        res += stringifyToken(key2);
      if (sep3)
        for (const st of sep3)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return yield* this.parseBlockStart();
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        switch (this.charAt(0)) {
          case "!":
            return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          case "&":
            return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          case "-":
          // this is an error
          case "?":
          // this is an error outside flow collections
          case ":": {
            const inFlow = this.flowLevel > 0;
            const ch1 = this.charAt(1);
            if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
              if (!inFlow)
                this.indentNext = this.indentValue + 1;
              else if (this.flowKey)
                this.flowKey = false;
              return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
            }
          }
        }
        return 0;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                Array.prototype.push.apply(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              Array.prototype.push.apply(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep3;
          if (scalar.end) {
            sep3 = scalar.end;
            sep3.push(this.sourceToken);
            delete scalar.end;
          } else
            sep3 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep3 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  Array.prototype.push.apply(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key2 = it.key;
                  const sep3 = it.sep;
                  sep3.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key: key2, sep: sep3 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  Array.prototype.push.apply(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep3 = fc.end.splice(1, fc.end.length);
            sep3.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep3 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// src/log/emit.ts
var emit_exports = {};
__export(emit_exports, {
  STREAM_IDS: () => STREAM_IDS,
  __resetForTests: () => __resetForTests,
  emit: () => emit,
  isKnownStream: () => isKnownStream
});
import {
  mkdirSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync
} from "node:fs";
import { join as join2 } from "node:path";
function isKnownStream(s) {
  return STREAM_SET.has(s);
}
function nextSeq(dir, stream) {
  let inner = seqByStreamByDir.get(dir);
  if (!inner) {
    inner = /* @__PURE__ */ new Map();
    seqByStreamByDir.set(dir, inner);
  }
  const next = (inner.get(stream) ?? 0) + 1;
  inner.set(stream, next);
  return next;
}
async function emit(args) {
  if (!isKnownStream(args.stream)) {
    throw new Error(`unknown stream: ${args.stream}`);
  }
  mkdirSync(args.telemetryDir, { recursive: true });
  const seq = nextSeq(args.telemetryDir, args.stream);
  const ts = args.ts ?? (/* @__PURE__ */ new Date()).toISOString();
  const envelope2 = {
    stream: args.stream,
    schema_version: "1.0",
    ts,
    seq,
    event: args.event
  };
  const line = `${JSON.stringify(envelope2)}
`;
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes > MAX_LINE_BYTES) {
    throw new Error(
      `event size ${bytes}B exceeds PIPE_BUF 4 KiB atomic-append guarantee; split or summarise before emit`
    );
  }
  const target = join2(args.telemetryDir, `${args.stream}.jsonl`);
  const fd = openSync(target, "a");
  try {
    writeSync(fd, line);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function __resetForTests() {
  seqByStreamByDir.clear();
}
var STREAM_IDS, STREAM_SET, seqByStreamByDir, MAX_LINE_BYTES;
var init_emit = __esm({
  "src/log/emit.ts"() {
    "use strict";
    STREAM_IDS = [
      "install-events",
      "state-transitions",
      "preflight-events",
      "integrity-events",
      "forbidden-quadrant-events",
      "archive-events",
      "lesson-events",
      "bridge-epic-events",
      "review-events",
      "pr-events",
      "cli-events",
      "branch-events"
    ];
    STREAM_SET = new Set(STREAM_IDS);
    seqByStreamByDir = /* @__PURE__ */ new Map();
    MAX_LINE_BYTES = 4096;
  }
});

// src/paths/helper.ts
import { resolve as resolve2 } from "node:path";
function resolveHelperPath(callerDir) {
  const bundled = true;
  return bundled ? resolve2(callerDir, HELPER_BASENAME) : resolve2(callerDir, "../..", "payload", "shared", HELPER_BASENAME);
}
var HELPER_BASENAME;
var init_helper = __esm({
  "src/paths/helper.ts"() {
    "use strict";
    HELPER_BASENAME = "sprint_status_writer.py";
  }
});

// src/branch/git.ts
var git_exports = {};
__export(git_exports, {
  GitError: () => GitError,
  autoCommitTdsState: () => autoCommitTdsState,
  branchExists: () => branchExists,
  createBranch: () => createBranch,
  currentBranch: () => currentBranch,
  deleteBranch: () => deleteBranch,
  forceDeleteBranch: () => forceDeleteBranch,
  listLocalBranches: () => listLocalBranches,
  pullRebase: () => pullRebase,
  pushForceWithLease: () => pushForceWithLease,
  pushPlain: () => pushPlain,
  revertCommit: () => revertCommit,
  scopedCommit: () => scopedCommit,
  squashMerge: () => squashMerge
});
import { spawnSync as spawnSync4 } from "node:child_process";
function run3(args, opts) {
  const spawnOpts = {
    cwd: opts.cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  };
  if (opts.env) spawnOpts.env = opts.env;
  const r = spawnSync4("git", args, spawnOpts);
  if (r.error) {
    throw new GitError(
      `git ${args.join(" ")}: spawn failed (${r.error.message})`,
      127,
      ""
    );
  }
  if (r.status !== 0) {
    throw new GitError(
      `git ${args.join(" ")}: exit ${r.status} \u2014 ${r.stderr.trim()}`,
      r.status ?? 1,
      r.stderr
    );
  }
  return { stdout: r.stdout, stderr: r.stderr };
}
function currentBranch(opts) {
  return run3(["rev-parse", "--abbrev-ref", "HEAD"], opts).stdout.trim();
}
function squashMerge(source, target, commitMessage, opts) {
  run3(["checkout", target], opts);
  run3(["merge", "--squash", source], opts);
  run3(["commit", "-m", commitMessage], opts);
}
function branchExists(branch, opts) {
  const r = spawnSync4("git", ["show-ref", "--verify", `refs/heads/${branch}`], {
    cwd: opts.cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return r.status === 0;
}
function createBranch(branch, base, opts) {
  run3(["checkout", "-b", branch, base], opts);
}
function deleteBranch(branch, opts) {
  run3(["branch", "-d", branch], opts);
}
function forceDeleteBranch(branch, opts) {
  run3(["branch", "-D", branch], opts);
}
function listLocalBranches(opts) {
  const out = run3(["branch", "--format=%(refname:short)"], opts).stdout;
  return out.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
}
function pushForceWithLease(branch, opts) {
  run3(["push", "--force-with-lease", "origin", branch], opts);
}
function pullRebase(opts) {
  run3(["pull", "--rebase"], opts);
}
function pushPlain(branch, opts) {
  run3(["push", "--set-upstream", "origin", branch], opts);
}
function revertCommit(targetCommit, opts) {
  run3(["revert", "--no-edit", targetCommit], opts);
  const sha = run3(["rev-parse", "HEAD"], opts).stdout.trim();
  return { commitSha: sha };
}
function scopedCommit(paths, message, trailers, opts) {
  if (paths.length === 0) {
    throw new GitError(
      "scopedCommit requires at least one path (use `tds commit --story=<id> -- <paths>`)",
      1,
      ""
    );
  }
  run3(["add", "--", ...paths], opts);
  const trailerBlock = Object.entries(trailers).map(([k, v]) => `${k}: ${v}`).join("\n");
  const fullMessage = trailerBlock.length > 0 ? `${message}

${trailerBlock}
` : `${message}
`;
  run3(["commit", "-m", fullMessage], opts);
  const sha = run3(["rev-parse", "HEAD"], opts).stdout.trim();
  return { commitSha: sha };
}
function autoCommitTdsState(opts) {
  if (opts.paths.length === 0) {
    return { committed: false, sha: null, reason: "no paths to commit" };
  }
  const inGitTree = spawnSync4(
    "git",
    ["rev-parse", "--is-inside-work-tree"],
    { cwd: opts.cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (inGitTree.status !== 0) {
    return { committed: false, sha: null, reason: "not in git tree" };
  }
  const addResult = spawnSync4(
    "git",
    ["add", "--", ...opts.paths],
    { cwd: opts.cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (addResult.status !== 0) {
    return {
      committed: false,
      sha: null,
      reason: `git add failed: ${addResult.stderr.trim()}`
    };
  }
  const diffStaged = spawnSync4(
    "git",
    ["diff", "--cached", "--quiet"],
    { cwd: opts.cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (diffStaged.status === 0) {
    return { committed: false, sha: null, reason: "no changes to commit" };
  }
  const fullMessage = `${opts.message}

Story-Id: ${opts.storyId}
`;
  const commitResult = spawnSync4(
    "git",
    ["commit", "-m", fullMessage],
    { cwd: opts.cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (commitResult.status !== 0) {
    spawnSync4("git", ["reset", "HEAD", "--", ...opts.paths], {
      cwd: opts.cwd,
      encoding: "utf8",
      stdio: "ignore"
    });
    return {
      committed: false,
      sha: null,
      reason: `commit failed: ${commitResult.stderr.trim()}`
    };
  }
  const shaResult = spawnSync4(
    "git",
    ["rev-parse", "HEAD"],
    { cwd: opts.cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  const sha = shaResult.status === 0 ? shaResult.stdout.trim() : null;
  return { committed: true, sha };
}
var GitError;
var init_git = __esm({
  "src/branch/git.ts"() {
    "use strict";
    GitError = class extends Error {
      constructor(message, exitCode, stderr) {
        super(message);
        this.exitCode = exitCode;
        this.stderr = stderr;
        this.name = "GitError";
      }
      exitCode;
      stderr;
      cause;
    };
  }
});

// src/state/commit-sweep.ts
import { spawnSync as spawnSync5 } from "node:child_process";
import { relative, sep as sep2, posix } from "node:path";
function toPosixRel(projectRoot, abs) {
  const rel = relative(projectRoot, abs);
  return sep2 === posix.sep ? rel : rel.split(sep2).join(posix.sep);
}
function buildWhitelist(opts) {
  const tdsStateRel = toPosixRel(opts.projectRoot, opts.tdsStateDir);
  const outRel = toPosixRel(opts.projectRoot, opts.outputFolder);
  return [
    `${tdsStateRel}/`,
    `${outRel}/implementation-artifacts/stories/`,
    `${outRel}/implementation-artifacts/retros/`,
    `${outRel}/_archive/`,
    // Sprint-status canonical file + extension. BMAD-canonical lives
    // в `<output>/implementation-artifacts/sprint-status.yaml` — это
    // мутируется apply-transition (Issue #3 fix v6.2.0). Без явного
    // entry sweep оставлял dirty sprint-status (callisto trace 2026-05-08).
    `${outRel}/implementation-artifacts/sprint-status.yaml`,
    `${outRel}/implementation-artifacts/sprint-status-extension.yaml`
  ];
}
function gitDirtyPaths(projectRoot) {
  const r = spawnSync5(
    "git",
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (r.status !== 0) return null;
  const out = r.stdout;
  if (out.length === 0) return [];
  const paths = [];
  const records = out.split("\0");
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (!rec || rec.length < 4) continue;
    const xy = rec.slice(0, 2);
    const path = rec.slice(3);
    paths.push(path);
    if (xy[0] === "R" || xy[0] === "C") {
      i++;
    }
  }
  return paths;
}
function collectDirtyTdsPaths(opts) {
  const dirty = gitDirtyPaths(opts.projectRoot);
  if (dirty === null) return null;
  const whitelist = buildWhitelist(opts);
  const inWhitelist = [];
  const outsideWhitelist = [];
  for (const p of dirty) {
    const matched = whitelist.some((prefix) => p.startsWith(prefix));
    (matched ? inWhitelist : outsideWhitelist).push(p);
  }
  return { paths: inWhitelist, filteredOut: outsideWhitelist };
}
function sweepStateCommit(opts) {
  const storyId = opts.storyId ?? "chore-tds-internal";
  let pathsToCommit;
  let pathsFilteredOut;
  if (opts.explicitPaths !== void 0) {
    pathsToCommit = opts.explicitPaths;
    pathsFilteredOut = [];
  } else {
    const collected = collectDirtyTdsPaths(opts);
    if (collected === null) {
      return {
        committed: false,
        sha: null,
        pathsCommitted: [],
        pathsFilteredOut: [],
        skipReason: "not in git tree",
        dryRun: opts.dryRun ?? false
      };
    }
    pathsToCommit = collected.paths;
    pathsFilteredOut = collected.filteredOut;
  }
  if (pathsToCommit.length === 0) {
    return {
      committed: false,
      sha: null,
      pathsCommitted: [],
      pathsFilteredOut,
      skipReason: "no dirty TDS-managed paths",
      dryRun: opts.dryRun ?? false
    };
  }
  if (opts.dryRun === true) {
    return {
      committed: false,
      sha: null,
      pathsCommitted: pathsToCommit,
      pathsFilteredOut,
      skipReason: "dry-run",
      dryRun: true
    };
  }
  const commit = autoCommitTdsState({
    cwd: opts.projectRoot,
    paths: pathsToCommit,
    message: opts.message,
    storyId
  });
  return {
    committed: commit.committed,
    sha: commit.sha,
    pathsCommitted: commit.committed ? pathsToCommit : [],
    pathsFilteredOut,
    ...commit.reason !== void 0 ? { skipReason: commit.reason } : {},
    dryRun: false
  };
}
var init_commit_sweep = __esm({
  "src/state/commit-sweep.ts"() {
    "use strict";
    init_git();
  }
});

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js"(exports, module) {
    var constants = __require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d) {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module.exports = patch;
    function patch(fs) {
      if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs);
      }
      if (!fs.lutimes) {
        patchLutimes(fs);
      }
      fs.chown = chownFix(fs.chown);
      fs.fchown = chownFix(fs.fchown);
      fs.lchown = chownFix(fs.lchown);
      fs.chmod = chmodFix(fs.chmod);
      fs.fchmod = chmodFix(fs.fchmod);
      fs.lchmod = chmodFix(fs.lchmod);
      fs.chownSync = chownFixSync(fs.chownSync);
      fs.fchownSync = chownFixSync(fs.fchownSync);
      fs.lchownSync = chownFixSync(fs.lchownSync);
      fs.chmodSync = chmodFixSync(fs.chmodSync);
      fs.fchmodSync = chmodFixSync(fs.fchmodSync);
      fs.lchmodSync = chmodFixSync(fs.lchmodSync);
      fs.stat = statFix(fs.stat);
      fs.fstat = statFix(fs.fstat);
      fs.lstat = statFix(fs.lstat);
      fs.statSync = statFixSync(fs.statSync);
      fs.fstatSync = statFixSync(fs.fstatSync);
      fs.lstatSync = statFixSync(fs.lstatSync);
      if (fs.chmod && !fs.lchmod) {
        fs.lchmod = function(path, mode, cb) {
          if (cb) process.nextTick(cb);
        };
        fs.lchmodSync = function() {
        };
      }
      if (fs.chown && !fs.lchown) {
        fs.lchown = function(path, uid, gid, cb) {
          if (cb) process.nextTick(cb);
        };
        fs.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs.rename = typeof fs.rename !== "function" ? fs.rename : (function(fs$rename) {
          function rename(from, to, cb) {
            var start = Date.now();
            var backoff = 0;
            fs$rename(from, to, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs.stat(to, function(stater, st) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to, CB);
                    else
                      cb(er);
                  });
                }, backoff);
                if (backoff < 100)
                  backoff += 10;
                return;
              }
              if (cb) cb(er);
            });
          }
          if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
          return rename;
        })(fs.rename);
      }
      fs.read = typeof fs.read !== "function" ? fs.read : (function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
        return read;
      })(fs.read);
      fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : /* @__PURE__ */ (function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      })(fs.readSync);
      function patchLchmod(fs2) {
        fs2.lchmod = function(path, mode, callback) {
          fs2.open(
            path,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback) callback(err);
                return;
              }
              fs2.fchmod(fd, mode, function(err2) {
                fs2.close(fd, function(err22) {
                  if (callback) callback(err2 || err22);
                });
              });
            }
          );
        };
        fs2.lchmodSync = function(path, mode) {
          var fd = fs2.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs2.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs2.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs2.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs2) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs2.futimes) {
          fs2.lutimes = function(path, at, mt, cb) {
            fs2.open(path, constants.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb) cb(er);
                return;
              }
              fs2.futimes(fd, at, mt, function(er2) {
                fs2.close(fd, function(er22) {
                  if (cb) cb(er2 || er22);
                });
              });
            });
          };
          fs2.lutimesSync = function(path, at, mt) {
            var fd = fs2.openSync(path, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs2.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs2.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs2.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs2.futimes) {
          fs2.lutimes = function(_a, _b, _c, cb) {
            if (cb) process.nextTick(cb);
          };
          fs2.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig;
        return function(target, mode, cb) {
          return orig.call(fs, target, mode, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig) return orig;
        return function(target, mode) {
          try {
            return orig.call(fs, target, mode);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig) return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs, target, uid, gid, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig) return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig) return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296;
              if (stats.gid < 0) stats.gid += 4294967296;
            }
            if (cb) cb.apply(this, arguments);
          }
          return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig) return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js"(exports, module) {
    var Stream = __require("stream").Stream;
    module.exports = legacy;
    function legacy(fs) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path, options);
        Stream.call(this);
        var self = this;
        this.path = path;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key2 = keys[index];
          this[key2] = options[key2];
        }
        if (this.encoding) this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self._read();
          });
          return;
        }
        fs.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self.emit("error", err);
            self.readable = false;
            return;
          }
          self.fd = fd;
          self.emit("open", fd);
          self._read();
        });
      }
      function WriteStream(path, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path, options);
        Stream.call(this);
        this.path = path;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key2 = keys[index];
          this[key2] = options[key2];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js"(exports, module) {
    "use strict";
    module.exports = clone;
    var getPrototypeOf = Object.getPrototypeOf || function(obj) {
      return obj.__proto__;
    };
    function clone(obj) {
      if (obj === null || typeof obj !== "object")
        return obj;
      if (obj instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function(key2) {
        Object.defineProperty(copy, key2, Object.getOwnPropertyDescriptor(obj, key2));
      });
      return copy;
    }
  }
});

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js"(exports, module) {
    var fs = __require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = __require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = /* @__PURE__ */ Symbol.for("graceful-fs.queue");
      previousSymbol = /* @__PURE__ */ Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m = util.format.apply(util, arguments);
        m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
        console.error(m);
      };
    if (!fs[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs, queue);
      fs.close = (function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      })(fs.close);
      fs.closeSync = (function(fs$closeSync) {
        function closeSync2(fd) {
          fs$closeSync.apply(fs, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync2, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync2;
      })(fs.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs[gracefulQueue]);
          __require("assert").equal(fs[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs[gracefulQueue]);
    }
    module.exports = patch(clone(fs));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
      module.exports = patch(fs);
      fs.__patched = true;
    }
    function patch(fs2) {
      polyfills(fs2);
      fs2.gracefulify = patch;
      fs2.createReadStream = createReadStream;
      fs2.createWriteStream = createWriteStream;
      var fs$readFile = fs2.readFile;
      fs2.readFile = readFile;
      function readFile(path, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path, options, cb);
        function go$readFile(path2, options2, cb2, startTime) {
          return fs$readFile(path2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs2.writeFile;
      fs2.writeFile = writeFile;
      function writeFile(path, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path, data, options, cb);
        function go$writeFile(path2, data2, options2, cb2, startTime) {
          return fs$writeFile(path2, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs2.appendFile;
      if (fs$appendFile)
        fs2.appendFile = appendFile;
      function appendFile(path, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path, data, options, cb);
        function go$appendFile(path2, data2, options2, cb2, startTime) {
          return fs$appendFile(path2, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs2.copyFile;
      if (fs$copyFile)
        fs2.copyFile = copyFile2;
      function copyFile2(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs2.readdir;
      fs2.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path2, options2, cb2, startTime) {
          return fs$readdir(path2, fs$readdirCallback(
            path2,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path2, options2, cb2, startTime) {
          return fs$readdir(path2, options2, fs$readdirCallback(
            path2,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path, options, cb);
        function fs$readdirCallback(path2, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs2);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs2.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs2.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs2, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs2, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs2, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs2, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream(path, options) {
        return new fs2.ReadStream(path, options);
      }
      function createWriteStream(path, options) {
        return new fs2.WriteStream(path, options);
      }
      var fs$open = fs2.open;
      fs2.open = open;
      function open(path, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path, flags, mode, cb);
        function go$open(path2, flags2, mode2, cb2, startTime) {
          return fs$open(path2, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path2, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs2;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs[gracefulQueue].length; ++i) {
        if (fs[gracefulQueue][i].length > 2) {
          fs[gracefulQueue][i][3] = now;
          fs[gracefulQueue][i][4] = now;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs[gracefulQueue].length === 0)
        return;
      var elem = fs[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn.name, args);
        var cb = args.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  }
});

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js
var require_retry_operation = __commonJS({
  "node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js"(exports, module) {
    function RetryOperation(timeouts, options) {
      if (typeof options === "boolean") {
        options = { forever: options };
      }
      this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
      this._timeouts = timeouts;
      this._options = options || {};
      this._maxRetryTime = options && options.maxRetryTime || Infinity;
      this._fn = null;
      this._errors = [];
      this._attempts = 1;
      this._operationTimeout = null;
      this._operationTimeoutCb = null;
      this._timeout = null;
      this._operationStart = null;
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0);
      }
    }
    module.exports = RetryOperation;
    RetryOperation.prototype.reset = function() {
      this._attempts = 1;
      this._timeouts = this._originalTimeouts;
    };
    RetryOperation.prototype.stop = function() {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      this._timeouts = [];
      this._cachedTimeouts = null;
    };
    RetryOperation.prototype.retry = function(err) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (!err) {
        return false;
      }
      var currentTime = (/* @__PURE__ */ new Date()).getTime();
      if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.unshift(new Error("RetryOperation timeout occurred"));
        return false;
      }
      this._errors.push(err);
      var timeout = this._timeouts.shift();
      if (timeout === void 0) {
        if (this._cachedTimeouts) {
          this._errors.splice(this._errors.length - 1, this._errors.length);
          this._timeouts = this._cachedTimeouts.slice(0);
          timeout = this._timeouts.shift();
        } else {
          return false;
        }
      }
      var self = this;
      var timer = setTimeout(function() {
        self._attempts++;
        if (self._operationTimeoutCb) {
          self._timeout = setTimeout(function() {
            self._operationTimeoutCb(self._attempts);
          }, self._operationTimeout);
          if (self._options.unref) {
            self._timeout.unref();
          }
        }
        self._fn(self._attempts);
      }, timeout);
      if (this._options.unref) {
        timer.unref();
      }
      return true;
    };
    RetryOperation.prototype.attempt = function(fn, timeoutOps) {
      this._fn = fn;
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout;
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb;
        }
      }
      var self = this;
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function() {
          self._operationTimeoutCb();
        }, self._operationTimeout);
      }
      this._operationStart = (/* @__PURE__ */ new Date()).getTime();
      this._fn(this._attempts);
    };
    RetryOperation.prototype.try = function(fn) {
      console.log("Using RetryOperation.try() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = function(fn) {
      console.log("Using RetryOperation.start() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = RetryOperation.prototype.try;
    RetryOperation.prototype.errors = function() {
      return this._errors;
    };
    RetryOperation.prototype.attempts = function() {
      return this._attempts;
    };
    RetryOperation.prototype.mainError = function() {
      if (this._errors.length === 0) {
        return null;
      }
      var counts = {};
      var mainError = null;
      var mainErrorCount = 0;
      for (var i = 0; i < this._errors.length; i++) {
        var error = this._errors[i];
        var message = error.message;
        var count = (counts[message] || 0) + 1;
        counts[message] = count;
        if (count >= mainErrorCount) {
          mainError = error;
          mainErrorCount = count;
        }
      }
      return mainError;
    };
  }
});

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js
var require_retry = __commonJS({
  "node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js"(exports) {
    var RetryOperation = require_retry_operation();
    exports.operation = function(options) {
      var timeouts = exports.timeouts(options);
      return new RetryOperation(timeouts, {
        forever: options && options.forever,
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime
      });
    };
    exports.timeouts = function(options) {
      if (options instanceof Array) {
        return [].concat(options);
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1e3,
        maxTimeout: Infinity,
        randomize: false
      };
      for (var key2 in options) {
        opts[key2] = options[key2];
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error("minTimeout is greater than maxTimeout");
      }
      var timeouts = [];
      for (var i = 0; i < opts.retries; i++) {
        timeouts.push(this.createTimeout(i, opts));
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts));
      }
      timeouts.sort(function(a, b) {
        return a - b;
      });
      return timeouts;
    };
    exports.createTimeout = function(attempt, opts) {
      var random = opts.randomize ? Math.random() + 1 : 1;
      var timeout = Math.round(random * opts.minTimeout * Math.pow(opts.factor, attempt));
      timeout = Math.min(timeout, opts.maxTimeout);
      return timeout;
    };
    exports.wrap = function(obj, options, methods) {
      if (options instanceof Array) {
        methods = options;
        options = null;
      }
      if (!methods) {
        methods = [];
        for (var key2 in obj) {
          if (typeof obj[key2] === "function") {
            methods.push(key2);
          }
        }
      }
      for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        var original = obj[method];
        obj[method] = function retryWrapper(original2) {
          var op = exports.operation(options);
          var args = Array.prototype.slice.call(arguments, 1);
          var callback = args.pop();
          args.push(function(err) {
            if (op.retry(err)) {
              return;
            }
            if (err) {
              arguments[0] = op.mainError();
            }
            callback.apply(this, arguments);
          });
          op.attempt(function() {
            original2.apply(obj, args);
          });
        }.bind(obj, original);
        obj[method].options = options;
      }
    };
  }
});

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js
var require_retry2 = __commonJS({
  "node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js"(exports, module) {
    module.exports = require_retry();
  }
});

// node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js
var require_signals = __commonJS({
  "node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js"(exports, module) {
    module.exports = [
      "SIGABRT",
      "SIGALRM",
      "SIGHUP",
      "SIGINT",
      "SIGTERM"
    ];
    if (process.platform !== "win32") {
      module.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      module.exports.push(
        "SIGIO",
        "SIGPOLL",
        "SIGPWR",
        "SIGSTKFLT",
        "SIGUNUSED"
      );
    }
  }
});

// node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js
var require_signal_exit = __commonJS({
  "node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js"(exports, module) {
    var process2 = global.process;
    var processOk = function(process3) {
      return process3 && typeof process3 === "object" && typeof process3.removeListener === "function" && typeof process3.emit === "function" && typeof process3.reallyExit === "function" && typeof process3.listeners === "function" && typeof process3.kill === "function" && typeof process3.pid === "number" && typeof process3.on === "function";
    };
    if (!processOk(process2)) {
      module.exports = function() {
        return function() {
        };
      };
    } else {
      assert = __require("assert");
      signals = require_signals();
      isWin = /^win/i.test(process2.platform);
      EE = __require("events");
      if (typeof EE !== "function") {
        EE = EE.EventEmitter;
      }
      if (process2.__signal_exit_emitter__) {
        emitter = process2.__signal_exit_emitter__;
      } else {
        emitter = process2.__signal_exit_emitter__ = new EE();
        emitter.count = 0;
        emitter.emitted = {};
      }
      if (!emitter.infinite) {
        emitter.setMaxListeners(Infinity);
        emitter.infinite = true;
      }
      module.exports = function(cb, opts) {
        if (!processOk(global.process)) {
          return function() {
          };
        }
        assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
        if (loaded === false) {
          load();
        }
        var ev = "exit";
        if (opts && opts.alwaysLast) {
          ev = "afterexit";
        }
        var remove2 = function() {
          emitter.removeListener(ev, cb);
          if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
            unload();
          }
        };
        emitter.on(ev, cb);
        return remove2;
      };
      unload = function unload2() {
        if (!loaded || !processOk(global.process)) {
          return;
        }
        loaded = false;
        signals.forEach(function(sig) {
          try {
            process2.removeListener(sig, sigListeners[sig]);
          } catch (er) {
          }
        });
        process2.emit = originalProcessEmit;
        process2.reallyExit = originalProcessReallyExit;
        emitter.count -= 1;
      };
      module.exports.unload = unload;
      emit2 = function emit3(event, code, signal) {
        if (emitter.emitted[event]) {
          return;
        }
        emitter.emitted[event] = true;
        emitter.emit(event, code, signal);
      };
      sigListeners = {};
      signals.forEach(function(sig) {
        sigListeners[sig] = function listener() {
          if (!processOk(global.process)) {
            return;
          }
          var listeners = process2.listeners(sig);
          if (listeners.length === emitter.count) {
            unload();
            emit2("exit", null, sig);
            emit2("afterexit", null, sig);
            if (isWin && sig === "SIGHUP") {
              sig = "SIGINT";
            }
            process2.kill(process2.pid, sig);
          }
        };
      });
      module.exports.signals = function() {
        return signals;
      };
      loaded = false;
      load = function load2() {
        if (loaded || !processOk(global.process)) {
          return;
        }
        loaded = true;
        emitter.count += 1;
        signals = signals.filter(function(sig) {
          try {
            process2.on(sig, sigListeners[sig]);
            return true;
          } catch (er) {
            return false;
          }
        });
        process2.emit = processEmit;
        process2.reallyExit = processReallyExit;
      };
      module.exports.load = load;
      originalProcessReallyExit = process2.reallyExit;
      processReallyExit = function processReallyExit2(code) {
        if (!processOk(global.process)) {
          return;
        }
        process2.exitCode = code || /* istanbul ignore next */
        0;
        emit2("exit", process2.exitCode, null);
        emit2("afterexit", process2.exitCode, null);
        originalProcessReallyExit.call(process2, process2.exitCode);
      };
      originalProcessEmit = process2.emit;
      processEmit = function processEmit2(ev, arg) {
        if (ev === "exit" && processOk(global.process)) {
          if (arg !== void 0) {
            process2.exitCode = arg;
          }
          var ret = originalProcessEmit.apply(this, arguments);
          emit2("exit", process2.exitCode, null);
          emit2("afterexit", process2.exitCode, null);
          return ret;
        } else {
          return originalProcessEmit.apply(this, arguments);
        }
      };
    }
    var assert;
    var signals;
    var isWin;
    var EE;
    var emitter;
    var unload;
    var emit2;
    var sigListeners;
    var loaded;
    var load;
    var originalProcessReallyExit;
    var processReallyExit;
    var originalProcessEmit;
    var processEmit;
  }
});

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js
var require_mtime_precision = __commonJS({
  "node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js"(exports, module) {
    "use strict";
    var cacheSymbol = /* @__PURE__ */ Symbol();
    function probe(file, fs, callback) {
      const cachedPrecision = fs[cacheSymbol];
      if (cachedPrecision) {
        return fs.stat(file, (err, stat) => {
          if (err) {
            return callback(err);
          }
          callback(null, stat.mtime, cachedPrecision);
        });
      }
      const mtime = new Date(Math.ceil(Date.now() / 1e3) * 1e3 + 5);
      fs.utimes(file, mtime, mtime, (err) => {
        if (err) {
          return callback(err);
        }
        fs.stat(file, (err2, stat) => {
          if (err2) {
            return callback(err2);
          }
          const precision = stat.mtime.getTime() % 1e3 === 0 ? "s" : "ms";
          Object.defineProperty(fs, cacheSymbol, { value: precision });
          callback(null, stat.mtime, precision);
        });
      });
    }
    function getMtime(precision) {
      let now = Date.now();
      if (precision === "s") {
        now = Math.ceil(now / 1e3) * 1e3;
      }
      return new Date(now);
    }
    module.exports.probe = probe;
    module.exports.getMtime = getMtime;
  }
});

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js
var require_lockfile = __commonJS({
  "node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var fs = require_graceful_fs();
    var retry = require_retry2();
    var onExit = require_signal_exit();
    var mtimePrecision = require_mtime_precision();
    var locks = {};
    function getLockFile(file, options) {
      return options.lockfilePath || `${file}.lock`;
    }
    function resolveCanonicalPath(file, options, callback) {
      if (!options.realpath) {
        return callback(null, path.resolve(file));
      }
      options.fs.realpath(file, callback);
    }
    function acquireLock(file, options, callback) {
      const lockfilePath = getLockFile(file, options);
      options.fs.mkdir(lockfilePath, (err) => {
        if (!err) {
          return mtimePrecision.probe(lockfilePath, options.fs, (err2, mtime, mtimePrecision2) => {
            if (err2) {
              options.fs.rmdir(lockfilePath, () => {
              });
              return callback(err2);
            }
            callback(null, mtime, mtimePrecision2);
          });
        }
        if (err.code !== "EEXIST") {
          return callback(err);
        }
        if (options.stale <= 0) {
          return callback(Object.assign(new Error("Lock file is already being held"), { code: "ELOCKED", file }));
        }
        options.fs.stat(lockfilePath, (err2, stat) => {
          if (err2) {
            if (err2.code === "ENOENT") {
              return acquireLock(file, { ...options, stale: 0 }, callback);
            }
            return callback(err2);
          }
          if (!isLockStale(stat, options)) {
            return callback(Object.assign(new Error("Lock file is already being held"), { code: "ELOCKED", file }));
          }
          removeLock(file, options, (err3) => {
            if (err3) {
              return callback(err3);
            }
            acquireLock(file, { ...options, stale: 0 }, callback);
          });
        });
      });
    }
    function isLockStale(stat, options) {
      return stat.mtime.getTime() < Date.now() - options.stale;
    }
    function removeLock(file, options, callback) {
      options.fs.rmdir(getLockFile(file, options), (err) => {
        if (err && err.code !== "ENOENT") {
          return callback(err);
        }
        callback();
      });
    }
    function updateLock(file, options) {
      const lock2 = locks[file];
      if (lock2.updateTimeout) {
        return;
      }
      lock2.updateDelay = lock2.updateDelay || options.update;
      lock2.updateTimeout = setTimeout(() => {
        lock2.updateTimeout = null;
        options.fs.stat(lock2.lockfilePath, (err, stat) => {
          const isOverThreshold = lock2.lastUpdate + options.stale < Date.now();
          if (err) {
            if (err.code === "ENOENT" || isOverThreshold) {
              return setLockAsCompromised(file, lock2, Object.assign(err, { code: "ECOMPROMISED" }));
            }
            lock2.updateDelay = 1e3;
            return updateLock(file, options);
          }
          const isMtimeOurs = lock2.mtime.getTime() === stat.mtime.getTime();
          if (!isMtimeOurs) {
            return setLockAsCompromised(
              file,
              lock2,
              Object.assign(
                new Error("Unable to update lock within the stale threshold"),
                { code: "ECOMPROMISED" }
              )
            );
          }
          const mtime = mtimePrecision.getMtime(lock2.mtimePrecision);
          options.fs.utimes(lock2.lockfilePath, mtime, mtime, (err2) => {
            const isOverThreshold2 = lock2.lastUpdate + options.stale < Date.now();
            if (lock2.released) {
              return;
            }
            if (err2) {
              if (err2.code === "ENOENT" || isOverThreshold2) {
                return setLockAsCompromised(file, lock2, Object.assign(err2, { code: "ECOMPROMISED" }));
              }
              lock2.updateDelay = 1e3;
              return updateLock(file, options);
            }
            lock2.mtime = mtime;
            lock2.lastUpdate = Date.now();
            lock2.updateDelay = null;
            updateLock(file, options);
          });
        });
      }, lock2.updateDelay);
      if (lock2.updateTimeout.unref) {
        lock2.updateTimeout.unref();
      }
    }
    function setLockAsCompromised(file, lock2, err) {
      lock2.released = true;
      if (lock2.updateTimeout) {
        clearTimeout(lock2.updateTimeout);
      }
      if (locks[file] === lock2) {
        delete locks[file];
      }
      lock2.options.onCompromised(err);
    }
    function lock(file, options, callback) {
      options = {
        stale: 1e4,
        update: null,
        realpath: true,
        retries: 0,
        fs,
        onCompromised: (err) => {
          throw err;
        },
        ...options
      };
      options.retries = options.retries || 0;
      options.retries = typeof options.retries === "number" ? { retries: options.retries } : options.retries;
      options.stale = Math.max(options.stale || 0, 2e3);
      options.update = options.update == null ? options.stale / 2 : options.update || 0;
      options.update = Math.max(Math.min(options.update, options.stale / 2), 1e3);
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err);
        }
        const operation = retry.operation(options.retries);
        operation.attempt(() => {
          acquireLock(file2, options, (err2, mtime, mtimePrecision2) => {
            if (operation.retry(err2)) {
              return;
            }
            if (err2) {
              return callback(operation.mainError());
            }
            const lock2 = locks[file2] = {
              lockfilePath: getLockFile(file2, options),
              mtime,
              mtimePrecision: mtimePrecision2,
              options,
              lastUpdate: Date.now()
            };
            updateLock(file2, options);
            callback(null, (releasedCallback) => {
              if (lock2.released) {
                return releasedCallback && releasedCallback(Object.assign(new Error("Lock is already released"), { code: "ERELEASED" }));
              }
              unlock(file2, { ...options, realpath: false }, releasedCallback);
            });
          });
        });
      });
    }
    function unlock(file, options, callback) {
      options = {
        fs,
        realpath: true,
        ...options
      };
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err);
        }
        const lock2 = locks[file2];
        if (!lock2) {
          return callback(Object.assign(new Error("Lock is not acquired/owned by you"), { code: "ENOTACQUIRED" }));
        }
        lock2.updateTimeout && clearTimeout(lock2.updateTimeout);
        lock2.released = true;
        delete locks[file2];
        removeLock(file2, options, callback);
      });
    }
    function check(file, options, callback) {
      options = {
        stale: 1e4,
        realpath: true,
        fs,
        ...options
      };
      options.stale = Math.max(options.stale || 0, 2e3);
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err);
        }
        options.fs.stat(getLockFile(file2, options), (err2, stat) => {
          if (err2) {
            return err2.code === "ENOENT" ? callback(null, false) : callback(err2);
          }
          return callback(null, !isLockStale(stat, options));
        });
      });
    }
    function getLocks() {
      return locks;
    }
    onExit(() => {
      for (const file in locks) {
        const options = locks[file].options;
        try {
          options.fs.rmdirSync(getLockFile(file, options));
        } catch (e) {
        }
      }
    });
    module.exports.lock = lock;
    module.exports.unlock = unlock;
    module.exports.check = check;
    module.exports.getLocks = getLocks;
  }
});

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js
var require_adapter = __commonJS({
  "node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js"(exports, module) {
    "use strict";
    var fs = require_graceful_fs();
    function createSyncFs(fs2) {
      const methods = ["mkdir", "realpath", "stat", "rmdir", "utimes"];
      const newFs = { ...fs2 };
      methods.forEach((method) => {
        newFs[method] = (...args) => {
          const callback = args.pop();
          let ret;
          try {
            ret = fs2[`${method}Sync`](...args);
          } catch (err) {
            return callback(err);
          }
          callback(null, ret);
        };
      });
      return newFs;
    }
    function toPromise(method) {
      return (...args) => new Promise((resolve6, reject) => {
        args.push((err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve6(result);
          }
        });
        method(...args);
      });
    }
    function toSync(method) {
      return (...args) => {
        let err;
        let result;
        args.push((_err, _result) => {
          err = _err;
          result = _result;
        });
        method(...args);
        if (err) {
          throw err;
        }
        return result;
      };
    }
    function toSyncOptions(options) {
      options = { ...options };
      options.fs = createSyncFs(options.fs || fs);
      if (typeof options.retries === "number" && options.retries > 0 || options.retries && typeof options.retries.retries === "number" && options.retries.retries > 0) {
        throw Object.assign(new Error("Cannot use retries with the sync api"), { code: "ESYNC" });
      }
      return options;
    }
    module.exports = {
      toPromise,
      toSync,
      toSyncOptions
    };
  }
});

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js
var require_proper_lockfile = __commonJS({
  "node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js"(exports, module) {
    "use strict";
    var lockfile10 = require_lockfile();
    var { toPromise, toSync, toSyncOptions } = require_adapter();
    async function lock(file, options) {
      const release = await toPromise(lockfile10.lock)(file, options);
      return toPromise(release);
    }
    function lockSync(file, options) {
      const release = toSync(lockfile10.lock)(file, toSyncOptions(options));
      return toSync(release);
    }
    function unlock(file, options) {
      return toPromise(lockfile10.unlock)(file, options);
    }
    function unlockSync(file, options) {
      return toSync(lockfile10.unlock)(file, toSyncOptions(options));
    }
    function check(file, options) {
      return toPromise(lockfile10.check)(file, options);
    }
    function checkSync(file, options) {
      return toSync(lockfile10.check)(file, toSyncOptions(options));
    }
    module.exports = lock;
    module.exports.lock = lock;
    module.exports.unlock = unlock;
    module.exports.lockSync = lockSync;
    module.exports.unlockSync = unlockSync;
    module.exports.check = check;
    module.exports.checkSync = checkSync;
  }
});

// node_modules/.pnpm/signal-exit@4.1.0/node_modules/signal-exit/dist/cjs/signals.js
var require_signals2 = __commonJS({
  "node_modules/.pnpm/signal-exit@4.1.0/node_modules/signal-exit/dist/cjs/signals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.signals = void 0;
    exports.signals = [];
    exports.signals.push("SIGHUP", "SIGINT", "SIGTERM");
    if (process.platform !== "win32") {
      exports.signals.push(
        "SIGALRM",
        "SIGABRT",
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      exports.signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
    }
  }
});

// node_modules/.pnpm/signal-exit@4.1.0/node_modules/signal-exit/dist/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/.pnpm/signal-exit@4.1.0/node_modules/signal-exit/dist/cjs/index.js"(exports) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.unload = exports.load = exports.onExit = exports.signals = void 0;
    var signals_js_1 = require_signals2();
    Object.defineProperty(exports, "signals", { enumerable: true, get: function() {
      return signals_js_1.signals;
    } });
    var processOk = (process3) => !!process3 && typeof process3 === "object" && typeof process3.removeListener === "function" && typeof process3.emit === "function" && typeof process3.reallyExit === "function" && typeof process3.listeners === "function" && typeof process3.kill === "function" && typeof process3.pid === "number" && typeof process3.on === "function";
    var kExitEmitter = /* @__PURE__ */ Symbol.for("signal-exit emitter");
    var global2 = globalThis;
    var ObjectDefineProperty = Object.defineProperty.bind(Object);
    var Emitter = class {
      emitted = {
        afterExit: false,
        exit: false
      };
      listeners = {
        afterExit: [],
        exit: []
      };
      count = 0;
      id = Math.random();
      constructor() {
        if (global2[kExitEmitter]) {
          return global2[kExitEmitter];
        }
        ObjectDefineProperty(global2, kExitEmitter, {
          value: this,
          writable: false,
          enumerable: false,
          configurable: false
        });
      }
      on(ev, fn) {
        this.listeners[ev].push(fn);
      }
      removeListener(ev, fn) {
        const list = this.listeners[ev];
        const i = list.indexOf(fn);
        if (i === -1) {
          return;
        }
        if (i === 0 && list.length === 1) {
          list.length = 0;
        } else {
          list.splice(i, 1);
        }
      }
      emit(ev, code, signal) {
        if (this.emitted[ev]) {
          return false;
        }
        this.emitted[ev] = true;
        let ret = false;
        for (const fn of this.listeners[ev]) {
          ret = fn(code, signal) === true || ret;
        }
        if (ev === "exit") {
          ret = this.emit("afterExit", code, signal) || ret;
        }
        return ret;
      }
    };
    var SignalExitBase = class {
    };
    var signalExitWrap = (handler) => {
      return {
        onExit(cb, opts) {
          return handler.onExit(cb, opts);
        },
        load() {
          return handler.load();
        },
        unload() {
          return handler.unload();
        }
      };
    };
    var SignalExitFallback = class extends SignalExitBase {
      onExit() {
        return () => {
        };
      }
      load() {
      }
      unload() {
      }
    };
    var SignalExit = class extends SignalExitBase {
      // "SIGHUP" throws an `ENOSYS` error on Windows,
      // so use a supported signal instead
      /* c8 ignore start */
      #hupSig = process2.platform === "win32" ? "SIGINT" : "SIGHUP";
      /* c8 ignore stop */
      #emitter = new Emitter();
      #process;
      #originalProcessEmit;
      #originalProcessReallyExit;
      #sigListeners = {};
      #loaded = false;
      constructor(process3) {
        super();
        this.#process = process3;
        this.#sigListeners = {};
        for (const sig of signals_js_1.signals) {
          this.#sigListeners[sig] = () => {
            const listeners = this.#process.listeners(sig);
            let { count } = this.#emitter;
            const p = process3;
            if (typeof p.__signal_exit_emitter__ === "object" && typeof p.__signal_exit_emitter__.count === "number") {
              count += p.__signal_exit_emitter__.count;
            }
            if (listeners.length === count) {
              this.unload();
              const ret = this.#emitter.emit("exit", null, sig);
              const s = sig === "SIGHUP" ? this.#hupSig : sig;
              if (!ret)
                process3.kill(process3.pid, s);
            }
          };
        }
        this.#originalProcessReallyExit = process3.reallyExit;
        this.#originalProcessEmit = process3.emit;
      }
      onExit(cb, opts) {
        if (!processOk(this.#process)) {
          return () => {
          };
        }
        if (this.#loaded === false) {
          this.load();
        }
        const ev = opts?.alwaysLast ? "afterExit" : "exit";
        this.#emitter.on(ev, cb);
        return () => {
          this.#emitter.removeListener(ev, cb);
          if (this.#emitter.listeners["exit"].length === 0 && this.#emitter.listeners["afterExit"].length === 0) {
            this.unload();
          }
        };
      }
      load() {
        if (this.#loaded) {
          return;
        }
        this.#loaded = true;
        this.#emitter.count += 1;
        for (const sig of signals_js_1.signals) {
          try {
            const fn = this.#sigListeners[sig];
            if (fn)
              this.#process.on(sig, fn);
          } catch (_) {
          }
        }
        this.#process.emit = (ev, ...a) => {
          return this.#processEmit(ev, ...a);
        };
        this.#process.reallyExit = (code) => {
          return this.#processReallyExit(code);
        };
      }
      unload() {
        if (!this.#loaded) {
          return;
        }
        this.#loaded = false;
        signals_js_1.signals.forEach((sig) => {
          const listener = this.#sigListeners[sig];
          if (!listener) {
            throw new Error("Listener not defined for signal: " + sig);
          }
          try {
            this.#process.removeListener(sig, listener);
          } catch (_) {
          }
        });
        this.#process.emit = this.#originalProcessEmit;
        this.#process.reallyExit = this.#originalProcessReallyExit;
        this.#emitter.count -= 1;
      }
      #processReallyExit(code) {
        if (!processOk(this.#process)) {
          return 0;
        }
        this.#process.exitCode = code || 0;
        this.#emitter.emit("exit", this.#process.exitCode, null);
        return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
      }
      #processEmit(ev, ...args) {
        const og = this.#originalProcessEmit;
        if (ev === "exit" && processOk(this.#process)) {
          if (typeof args[0] === "number") {
            this.#process.exitCode = args[0];
          }
          const ret = og.call(this.#process, ev, ...args);
          this.#emitter.emit("exit", this.#process.exitCode, null);
          return ret;
        } else {
          return og.call(this.#process, ev, ...args);
        }
      }
    };
    var process2 = globalThis.process;
    _a = signalExitWrap(processOk(process2) ? new SignalExit(process2) : new SignalExitFallback()), /**
     * Called when the process is exiting, whether via signal, explicit
     * exit, or running out of stuff to do.
     *
     * If the global process object is not suitable for instrumentation,
     * then this will be a no-op.
     *
     * Returns a function that may be used to unload signal-exit.
     */
    exports.onExit = _a.onExit, /**
     * Load the listeners.  Likely you never need to call this, unless
     * doing a rather deep integration with signal-exit functionality.
     * Mostly exposed for the benefit of testing.
     *
     * @internal
     */
    exports.load = _a.load, /**
     * Unload the listeners.  Likely you never need to call this, unless
     * doing a rather deep integration with signal-exit functionality.
     * Mostly exposed for the benefit of testing.
     *
     * @internal
     */
    exports.unload = _a.unload;
  }
});

// node_modules/.pnpm/write-file-atomic@7.0.1/node_modules/write-file-atomic/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/write-file-atomic@7.0.1/node_modules/write-file-atomic/lib/index.js"(exports, module) {
    "use strict";
    module.exports = writeFile;
    module.exports.sync = writeFileSync6;
    module.exports._getTmpname = getTmpname;
    module.exports._cleanupOnExit = cleanupOnExit;
    var fs = __require("fs");
    var crypto = __require("node:crypto");
    var { onExit } = require_cjs();
    var path = __require("path");
    var { promisify } = __require("util");
    var activeFiles = {};
    var threadId = (function getId() {
      try {
        const workerThreads = __require("worker_threads");
        return workerThreads.threadId;
      } catch (e) {
        return 0;
      }
    })();
    var invocations = 0;
    function getTmpname(filename) {
      return filename + "." + crypto.createHash("sha1").update(__filename).update(String(process.pid)).update(String(threadId)).update(String(++invocations)).digest().readUInt32BE(0);
    }
    function cleanupOnExit(tmpfile) {
      return () => {
        try {
          fs.unlinkSync(typeof tmpfile === "function" ? tmpfile() : tmpfile);
        } catch {
        }
      };
    }
    function serializeActiveFile(absoluteName) {
      return new Promise((resolve6) => {
        if (!activeFiles[absoluteName]) {
          activeFiles[absoluteName] = [];
        }
        activeFiles[absoluteName].push(resolve6);
        if (activeFiles[absoluteName].length === 1) {
          resolve6();
        }
      });
    }
    function isChownErrOk(err) {
      if (err.code === "ENOSYS") {
        return true;
      }
      const nonroot = !process.getuid || process.getuid() !== 0;
      if (nonroot) {
        if (err.code === "EINVAL" || err.code === "EPERM") {
          return true;
        }
      }
      return false;
    }
    async function writeFileAsync(filename, data, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      let fd;
      let tmpfile;
      const removeOnExitHandler = onExit(cleanupOnExit(() => tmpfile));
      const absoluteName = path.resolve(filename);
      try {
        await serializeActiveFile(absoluteName);
        const truename = await promisify(fs.realpath)(filename).catch(() => filename);
        tmpfile = getTmpname(truename);
        if (!options.mode || !options.chown) {
          const stats = await promisify(fs.stat)(truename).catch(() => {
          });
          if (stats) {
            if (options.mode == null) {
              options.mode = stats.mode;
            }
            if (options.chown == null && process.getuid) {
              options.chown = { uid: stats.uid, gid: stats.gid };
            }
          }
        }
        fd = await promisify(fs.open)(tmpfile, "w", options.mode);
        if (options.tmpfileCreated) {
          await options.tmpfileCreated(tmpfile);
        }
        if (ArrayBuffer.isView(data)) {
          await promisify(fs.write)(fd, data, 0, data.length, 0);
        } else if (data != null) {
          await promisify(fs.write)(fd, String(data), 0, String(options.encoding || "utf8"));
        }
        if (options.fsync !== false) {
          await promisify(fs.fsync)(fd);
        }
        await promisify(fs.close)(fd);
        fd = null;
        if (options.chown) {
          await promisify(fs.chown)(tmpfile, options.chown.uid, options.chown.gid).catch((err) => {
            if (!isChownErrOk(err)) {
              throw err;
            }
          });
        }
        if (options.mode) {
          await promisify(fs.chmod)(tmpfile, options.mode).catch((err) => {
            if (!isChownErrOk(err)) {
              throw err;
            }
          });
        }
        await promisify(fs.rename)(tmpfile, truename);
      } finally {
        if (fd) {
          await promisify(fs.close)(fd).catch(
            /* istanbul ignore next */
            () => {
            }
          );
        }
        removeOnExitHandler();
        await promisify(fs.unlink)(tmpfile).catch(() => {
        });
        activeFiles[absoluteName].shift();
        if (activeFiles[absoluteName].length > 0) {
          activeFiles[absoluteName][0]();
        } else {
          delete activeFiles[absoluteName];
        }
      }
    }
    async function writeFile(filename, data, options, callback) {
      if (options instanceof Function) {
        callback = options;
        options = {};
      }
      const promise = writeFileAsync(filename, data, options);
      if (callback) {
        try {
          const result = await promise;
          return callback(result);
        } catch (err) {
          return callback(err);
        }
      }
      return promise;
    }
    function writeFileSync6(filename, data, options) {
      if (typeof options === "string") {
        options = { encoding: options };
      } else if (!options) {
        options = {};
      }
      try {
        filename = fs.realpathSync(filename);
      } catch (ex) {
      }
      const tmpfile = getTmpname(filename);
      if (!options.mode || !options.chown) {
        try {
          const stats = fs.statSync(filename);
          options = Object.assign({}, options);
          if (!options.mode) {
            options.mode = stats.mode;
          }
          if (!options.chown && process.getuid) {
            options.chown = { uid: stats.uid, gid: stats.gid };
          }
        } catch (ex) {
        }
      }
      let fd;
      const cleanup = cleanupOnExit(tmpfile);
      const removeOnExitHandler = onExit(cleanup);
      let threw = true;
      try {
        fd = fs.openSync(tmpfile, "w", options.mode || 438);
        if (options.tmpfileCreated) {
          options.tmpfileCreated(tmpfile);
        }
        if (ArrayBuffer.isView(data)) {
          fs.writeSync(fd, data, 0, data.length, 0);
        } else if (data != null) {
          fs.writeSync(fd, String(data), 0, String(options.encoding || "utf8"));
        }
        if (options.fsync !== false) {
          fs.fsyncSync(fd);
        }
        fs.closeSync(fd);
        fd = null;
        if (options.chown) {
          try {
            fs.chownSync(tmpfile, options.chown.uid, options.chown.gid);
          } catch (err) {
            if (!isChownErrOk(err)) {
              throw err;
            }
          }
        }
        if (options.mode) {
          try {
            fs.chmodSync(tmpfile, options.mode);
          } catch (err) {
            if (!isChownErrOk(err)) {
              throw err;
            }
          }
        }
        fs.renameSync(tmpfile, filename);
        threw = false;
      } finally {
        if (fd) {
          try {
            fs.closeSync(fd);
          } catch (ex) {
          }
        }
        removeOnExitHandler();
        if (threw) {
          cleanup();
        }
      }
    }
  }
});

// src/state/test-artifacts-required.ts
import { existsSync as existsSync5, readFileSync as readFileSync4 } from "node:fs";
function isTestFilePath2(path) {
  return TEST_FILE_PATTERNS.some((re) => re.test(path));
}
function hasTestAuthorRecords(opts) {
  if (!existsSync5(opts.manifestPath)) return false;
  let doc;
  try {
    doc = (0, import_yaml3.parse)(readFileSync4(opts.manifestPath, "utf8")) ?? {};
  } catch {
    return false;
  }
  const entries = Array.isArray(doc.entries) ? doc.entries : [];
  return entries.some(
    (e) => e.recorded_by === "test-author" && e.story_id === opts.storyId && typeof e.file === "string" && isTestFilePath2(e.file)
  );
}
var import_yaml3, TEST_FILE_PATTERNS;
var init_test_artifacts_required = __esm({
  "src/state/test-artifacts-required.ts"() {
    "use strict";
    import_yaml3 = __toESM(require_dist(), 1);
    TEST_FILE_PATTERNS = [
      /(^|\/)__tests__\//,
      /(^|\/)tests?\//,
      /(^|\/)spec\//,
      /\.test\.[a-z]+$/i,
      /\.spec\.[a-z]+$/i,
      /_test\.[a-z]+$/i,
      /^test_.*\.py$/i,
      /Tests?\.cs$/,
      /\.bats$/i
    ];
  }
});

// src/integrity/allowlist.ts
function isPathAllowed(relativePath, artefactClass) {
  const normalised = relativePath.replace(/\\/g, "/");
  if (artefactClass === "A") {
    if (isTestFilePath2(normalised)) return true;
    return A_ALLOWLIST.some((re) => re.test(normalised));
  }
  return B_ALLOWLIST.some((re) => re.test(normalised));
}
function assertPathAllowed(relativePath, artefactClass) {
  if (!isPathAllowed(relativePath, artefactClass)) {
    throw new ClassNotAllowedError(relativePath, artefactClass);
  }
}
var A_ALLOWLIST, B_ALLOWLIST, ClassNotAllowedError;
var init_allowlist = __esm({
  "src/integrity/allowlist.ts"() {
    "use strict";
    init_test_artifacts_required();
    A_ALLOWLIST = [
      // Exact-path artefacts in the TDS state tree.
      /^_bmad-output\/_tds\/state-manifest\.yaml$/,
      /^_bmad-output\/_tds\/branch-registry\.yaml$/,
      /^_bmad-output\/_tds\/memory\/lessons\.yaml$/,
      // sprint-status-extension — TDS sidecar for bridges + opaque-id parents map
      // (ADR-0005, ADR-0011, ADR-0015). Read on every state transition; mutated
      // by bridge create/resolve + bootstrap-parents + setup install.
      /^_bmad-output\/_tds\/sprint-status-extension\.yaml$/,
      // sprint-status.yaml — BMAD-canonical (`_bmad/bmm/`) OR custom impl_artifacts location.
      // Tests sometimes place it under impl_artifacts; production is _bmad/bmm/.
      /(?:^|\/)sprint-status\.yaml$/,
      // Story specs / sbom under impl_artifacts (any prefix → /stories/<id>.md).
      /(?:^|\/)(?:[^/]+\/)*stories\/[^/]+\.md$/,
      /(?:^|\/)(?:[^/]+\/)*sbom\/[^/]+\.spdx\.json$/,
      // Runtime sub-trees under _tds.
      /^_bmad-output\/_tds\/runtime\/llm-manifest\/[^/]+\.json$/,
      /^_bmad-output\/_tds\/runtime\/claim-index\/[^/]+\.yaml$/
    ];
    B_ALLOWLIST = [
      /^_bmad-output\/_tds\/runtime\/snapshots\/[^/]+$/,
      /^_bmad-output\/_tds\/runtime\/sbom\/aux-[^/]+$/
    ];
    ClassNotAllowedError = class extends Error {
      code = "TDS-ERR:CLASS_NOT_ALLOWED";
      file;
      artefactClass;
      constructor(file, artefactClass) {
        const recovery = artefactClass === "A" ? `Class A allowlist (\xA712.3): _tds/state-manifest|branch-registry|memory/lessons.yaml, _bmad/bmm/sprint-status.yaml, <impl_artifacts>/stories/*.md, <impl_artifacts>/sbom/*.spdx.json, _tds/runtime/llm-manifest/*.json, _tds/runtime/claim-index/*.yaml.` : `Class B allowlist (\xA712.3): _tds/runtime/snapshots/*, _tds/runtime/sbom/aux-*.`;
        super(
          `TDS-ERR:CLASS_NOT_ALLOWED \u2014 path "${file}" not in \xA712.3 class-${artefactClass} allowlist. ${recovery} Production source is delegated to git tamper-evidence (ADR-0014 \xA7B); for migration of legacy entries run \`tds integrity sweep --purge-out-of-spec\`.`
        );
        this.name = "ClassNotAllowedError";
        this.file = file;
        this.artefactClass = artefactClass;
      }
    };
  }
});

// src/integrity/index.ts
import { createHash } from "node:crypto";
import {
  existsSync as existsSync6,
  mkdirSync as mkdirSync2,
  readdirSync,
  readFileSync as readFileSync5,
  statSync as statSync2
} from "node:fs";
import { dirname as dirname5, join as join6, relative as relative2, resolve as resolve3 } from "node:path";
function readManifest(path) {
  if (!existsSync6(path)) return structuredClone(EMPTY_MANIFEST);
  const raw = readFileSync5(path, "utf8");
  const parsed = (0, import_yaml4.parse)(raw) ?? structuredClone(EMPTY_MANIFEST);
  if (!Array.isArray(parsed.entries)) parsed.entries = [];
  if (parsed.schema_version === void 0) parsed.schema_version = "1.0";
  return parsed;
}
async function writeManifest(path, doc) {
  const yaml = (0, import_yaml4.stringify)(doc, { indent: 2, lineWidth: 0 });
  mkdirSync2(dirname5(path), { recursive: true });
  const release = await import_proper_lockfile.default.lock(path, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic.default)(path, yaml, { fsync: true });
  } finally {
    await release();
  }
}
function sha256OfFile(path) {
  const buf = readFileSync5(path);
  return createHash("sha256").update(buf).digest("hex");
}
function relPath(projectRoot, file) {
  return relative2(projectRoot, resolve3(file));
}
function lookupArchivedSha(archiveRoot, relFile) {
  if (!existsSync6(archiveRoot)) return null;
  let bestTs = -Infinity;
  let bestSha = null;
  for (const phase of readdirSync(archiveRoot)) {
    const phaseDir = join6(archiveRoot, phase);
    let isDir2 = false;
    try {
      isDir2 = statSync2(phaseDir).isDirectory();
    } catch {
      continue;
    }
    if (!isDir2) continue;
    const manifestPath = join6(phaseDir, "manifest.yaml");
    if (!existsSync6(manifestPath)) continue;
    let doc;
    try {
      doc = (0, import_yaml4.parse)(readFileSync5(manifestPath, "utf8")) ?? {};
    } catch {
      continue;
    }
    const ts = doc.archived_at ? Date.parse(doc.archived_at) : NaN;
    const ranking = Number.isFinite(ts) ? ts : 0;
    for (const row of doc.files ?? []) {
      if (row.path === relFile && typeof row.sha256 === "string") {
        if (ranking > bestTs) {
          bestTs = ranking;
          bestSha = row.sha256;
        }
      }
    }
  }
  return bestSha;
}
async function recordIntegrity(opts) {
  if (!CLASS_SET.has(opts.artefactClass)) {
    throw new Error(`unknown artefact class: ${opts.artefactClass}`);
  }
  for (const f of opts.files) {
    if (!existsSync6(f)) throw new Error(`file missing: ${f}`);
  }
  for (const f of opts.files) {
    const rel = relPath(opts.projectRoot, f);
    assertPathAllowed(rel, opts.artefactClass);
  }
  const doc = readManifest(opts.manifestPath);
  const recorded = [];
  for (const f of opts.files) {
    const rel = relPath(opts.projectRoot, f);
    const sha = sha256OfFile(f);
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    const entry = {
      artefact_class: opts.artefactClass,
      file: rel,
      sha256: sha,
      canonical_form: "raw-bytes",
      recorded_at: ts,
      recorded_by: opts.recordedBy,
      ...opts.storyId !== void 0 ? { story_id: opts.storyId } : {},
      ...opts.reason !== void 0 ? { notes: opts.reason } : {}
    };
    const existingIdx = doc.entries.findIndex((e) => e.file === rel);
    if (existingIdx >= 0) {
      doc.entries.splice(existingIdx, 1, entry);
    } else {
      doc.entries.push(entry);
    }
    recorded.push({ path: rel, sha256: sha, recordedAt: ts });
  }
  await writeManifest(opts.manifestPath, doc);
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "integrity-events",
    event: {
      kind: "record",
      recorded_count: recorded.length,
      recorded_by: opts.recordedBy,
      artefact_class: opts.artefactClass,
      ...opts.reason !== void 0 ? { reason: opts.reason } : {}
    }
  });
  return { recorded, skipped: [] };
}
async function acceptIntegrity(opts) {
  if (typeof opts.reason !== "string" || opts.reason.length === 0) {
    throw new Error("accept requires a non-empty reason (audit field, \xA712.2)");
  }
  const doc = readManifest(opts.manifestPath);
  const accepted = [];
  for (const f of opts.files) {
    if (!existsSync6(f)) throw new Error(`file missing: ${f}`);
    const rel = relPath(opts.projectRoot, f);
    const idx = doc.entries.findIndex((e) => e.file === rel);
    if (idx < 0) {
      throw new Error(
        `file not in registry: ${rel} (no prior entry to accept; use record)`
      );
    }
    const existing = doc.entries[idx];
    const newSha = sha256OfFile(f);
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    doc.entries[idx] = {
      artefact_class: existing.artefact_class,
      file: rel,
      sha256: newSha,
      canonical_form: "raw-bytes",
      recorded_at: ts,
      recorded_by: opts.acceptedBy,
      notes: `accept: ${opts.reason}`
    };
    accepted.push({
      path: rel,
      oldSha256: existing.sha256,
      newSha256: newSha
    });
  }
  await writeManifest(opts.manifestPath, doc);
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "integrity-events",
    event: {
      kind: "accept",
      accepted_count: accepted.length,
      accepted_by: opts.acceptedBy,
      reason: opts.reason
    }
  });
  return { accepted };
}
async function recoverIntegrity(opts) {
  if (typeof opts.reason !== "string" || opts.reason.length === 0) {
    throw new Error(
      "recover requires a non-empty reason (audit field; RB-09 procedure)"
    );
  }
  if (opts.strategy !== "trust-classI" && opts.strategy !== "restore-from-archive" && opts.strategy !== "prompt") {
    throw new Error(
      `unknown strategy "${opts.strategy}"; allowed: trust-classI | restore-from-archive | prompt`
    );
  }
  if (opts.strategy === "restore-from-archive" && !opts.archiveRoot) {
    throw new Error(
      "strategy=restore-from-archive requires --archive-root=<path>"
    );
  }
  const doc = readManifest(opts.manifestPath);
  const recoveredFiles = [];
  const skippedFiles = [];
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < doc.entries.length; i++) {
    const entry = doc.entries[i];
    if (entry.artefact_class !== "A") continue;
    const abs = join6(opts.projectRoot, entry.file);
    if (!existsSync6(abs)) {
      skippedFiles.push({
        path: entry.file,
        reason: "file missing on disk; cannot trust"
      });
      continue;
    }
    const currentSha = sha256OfFile(abs);
    const isDrifted = currentSha !== entry.sha256;
    let newSha;
    let strategyTag;
    if (opts.strategy === "trust-classI") {
      newSha = currentSha;
      strategyTag = "trust-classI";
    } else if (opts.strategy === "restore-from-archive") {
      if (!isDrifted) {
        continue;
      }
      const restored = lookupArchivedSha(opts.archiveRoot, entry.file);
      if (restored === null) {
        skippedFiles.push({
          path: entry.file,
          reason: "no matching entry in archive root"
        });
        continue;
      }
      newSha = restored;
      strategyTag = "restore-from-archive";
    } else {
      if (!isDrifted) continue;
      const decision = opts.promptResolver ? opts.promptResolver(entry.file) : "trust";
      if (decision === "abort") {
        throw new Error(
          `recover aborted at ${entry.file} (operator decision)`
        );
      }
      if (decision === "skip") {
        skippedFiles.push({
          path: entry.file,
          reason: "operator chose skip in prompt mode"
        });
        continue;
      }
      newSha = currentSha;
      strategyTag = "prompt-trust";
    }
    doc.entries[i] = {
      ...entry,
      sha256: newSha,
      recorded_at: ts,
      recorded_by: opts.recoveredBy,
      notes: `recover (${strategyTag}): ${opts.reason}`
    };
    recoveredFiles.push({ path: entry.file, newSha256: newSha });
  }
  await writeManifest(opts.manifestPath, doc);
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "integrity-events",
    event: {
      kind: "recover",
      strategy: opts.strategy,
      recovered_count: recoveredFiles.length,
      skipped_count: skippedFiles.length,
      recovered_by: opts.recoveredBy,
      reason: opts.reason
    }
  });
  return {
    strategy: opts.strategy,
    recoveredFiles,
    skippedFiles,
    haltCleared: true
  };
}
async function verifyIntegrity(opts) {
  const doc = readManifest(opts.manifestPath);
  let verified = 0;
  const failedEntries = [];
  for (const e of doc.entries) {
    const abs = join6(opts.projectRoot, e.file);
    if (!existsSync6(abs)) {
      failedEntries.push({
        path: e.file,
        expectedSha256: e.sha256,
        actualSha256: "<missing>",
        recordedAt: e.recorded_at
      });
      continue;
    }
    const actual = sha256OfFile(abs);
    if (actual === e.sha256) {
      verified++;
    } else {
      failedEntries.push({
        path: e.file,
        expectedSha256: e.sha256,
        actualSha256: actual,
        recordedAt: e.recorded_at
      });
    }
  }
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "integrity-events",
    event: {
      kind: "verify",
      verified,
      failed: failedEntries.length
    }
  });
  return { verified, failed: failedEntries.length, failedEntries };
}
var import_proper_lockfile, import_write_file_atomic, import_yaml4, ARTEFACT_CLASSES, CLASS_SET, EMPTY_MANIFEST;
var init_integrity = __esm({
  "src/integrity/index.ts"() {
    "use strict";
    import_proper_lockfile = __toESM(require_proper_lockfile(), 1);
    import_write_file_atomic = __toESM(require_lib(), 1);
    import_yaml4 = __toESM(require_dist(), 1);
    init_emit();
    init_allowlist();
    ARTEFACT_CLASSES = ["A", "B"];
    CLASS_SET = new Set(ARTEFACT_CLASSES);
    EMPTY_MANIFEST = {
      schema_version: "1.0",
      entries: []
    };
  }
});

// src/integrity/auto-record.ts
async function recordAfterWrite(opts) {
  await recordIntegrity({
    files: [opts.file],
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    artefactClass: "A",
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir,
    ...opts.storyId !== void 0 ? { storyId: opts.storyId } : {},
    ...opts.reason !== void 0 ? { reason: opts.reason } : {}
  });
}
var init_auto_record = __esm({
  "src/integrity/auto-record.ts"() {
    "use strict";
    init_integrity();
  }
});

// src/domain/model.ts
function isSpecialistRole(r) {
  return SPECIALIST_ROLES_SET.has(r);
}
function isStoryStatus(s) {
  return STORY_STATUSES_SET.has(s);
}
function isEpicStatus(s) {
  return EPIC_STATUSES_SET.has(s);
}
function isTestsState(s) {
  return TESTS_STATES_SET.has(s);
}
function isFindingSeverity(s) {
  return FINDING_SEVERITIES_SET.has(s);
}
var SPECIALIST_ROLES, SPECIALIST_ROLES_SET, STORY_STATUSES, STORY_STATUSES_SET, EPIC_STATUSES, EPIC_STATUSES_SET, TESTS_STATES, TESTS_STATES_SET, PRE_IMPL_STATUSES, PRE_IMPL_STATUSES_SET, EPIC_ID_RE, FINDING_SEVERITIES, FINDING_SEVERITIES_SET, FINDING_HEADING_REGEX, FINDING_HEADING_REGEX_PREFIX;
var init_model = __esm({
  "src/domain/model.ts"() {
    "use strict";
    SPECIALIST_ROLES = [
      "engineer",
      "python",
      "csharp",
      "java",
      "frontend",
      "ios",
      "android"
    ];
    SPECIALIST_ROLES_SET = new Set(SPECIALIST_ROLES);
    STORY_STATUSES = [
      "backlog",
      "ready-for-dev",
      "tests-pending",
      "tests-drafting",
      "tests-needs-revision",
      "tests-approved",
      "in-progress",
      "review",
      "rework",
      "approved",
      "done",
      "halted"
    ];
    STORY_STATUSES_SET = new Set(STORY_STATUSES);
    EPIC_STATUSES = [
      "backlog",
      "in-progress",
      "approved",
      "done",
      "halted"
    ];
    EPIC_STATUSES_SET = new Set(EPIC_STATUSES);
    TESTS_STATES = [
      "tests-drafting",
      "tests-needs-revision",
      "tests-approved"
    ];
    TESTS_STATES_SET = new Set(TESTS_STATES);
    PRE_IMPL_STATUSES = [
      "ready-for-dev",
      "tests-pending",
      "tests-drafting",
      "tests-needs-revision"
    ];
    PRE_IMPL_STATUSES_SET = new Set(PRE_IMPL_STATUSES);
    EPIC_ID_RE = /^epic-(\d+)(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
    FINDING_SEVERITIES = ["blocker", "warn", "info"];
    FINDING_SEVERITIES_SET = new Set(FINDING_SEVERITIES);
    FINDING_HEADING_REGEX = new RegExp(
      `^### \\[(${FINDING_SEVERITIES.join("|")})\\] (.+)\\s*$`
    );
    FINDING_HEADING_REGEX_PREFIX = new RegExp(
      `^### \\[(${FINDING_SEVERITIES.join("|")})\\] `
    );
  }
});

// src/epic/bridge.ts
var bridge_exports = {};
__export(bridge_exports, {
  BRIDGE_TYPES: () => BRIDGE_TYPES,
  bridgeIdFor: () => bridgeIdFor,
  listBridges: () => listBridges,
  pyStatusWrite: () => pyStatusWrite,
  readExtension: () => readExtension,
  resolveBridge: () => resolveBridge,
  slugify: () => slugify,
  slugifyShort: () => slugifyShort,
  writeExtension: () => writeExtension
});
import { spawnSync as spawnSync7 } from "node:child_process";
import { dirname as dirname6 } from "node:path";
import { existsSync as existsSync7, mkdirSync as mkdirSync3, readFileSync as readFileSync6 } from "node:fs";
import { fileURLToPath as fileURLToPath5 } from "node:url";
function readExtension(path) {
  if (!existsSync7(path)) return structuredClone(EMPTY_EXTENSION);
  const parsed = (0, import_yaml5.parse)(readFileSync6(path, "utf8")) ?? structuredClone(EMPTY_EXTENSION);
  if (!Array.isArray(parsed.bridges)) parsed.bridges = [];
  if (!parsed.schema_version) parsed.schema_version = "1.0";
  if (!parsed.parents || typeof parsed.parents !== "object") {
    parsed.parents = {};
  }
  return parsed;
}
async function writeExtension(path, doc, recordOpts) {
  doc.last_updated = (/* @__PURE__ */ new Date()).toISOString();
  const yaml = (0, import_yaml5.stringify)(doc, { indent: 2, lineWidth: 0 });
  mkdirSync3(dirname6(path), { recursive: true });
  const release = await import_proper_lockfile2.default.lock(path, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic2.default)(path, yaml, { fsync: true });
    await recordAfterWrite({
      manifestPath: recordOpts.manifestPath,
      projectRoot: recordOpts.projectRoot,
      file: path,
      recordedBy: recordOpts.recordedBy,
      telemetryDir: recordOpts.telemetryDir,
      ...recordOpts.reason !== void 0 ? { reason: recordOpts.reason } : {}
    });
  } finally {
    await release();
  }
}
async function pyStatusWrite(args) {
  const py = args.pythonBin ?? "python3";
  const cliArgs = [
    HELPER_PATH,
    "--path",
    args.sprintStatusPath,
    "--key",
    args.key,
    "--status",
    args.status
  ];
  if (args.append) cliArgs.push("--append");
  if (args.insertBefore) cliArgs.push("--insert-before", args.insertBefore);
  if (args.comment) cliArgs.push("--comment", args.comment);
  if (args.inlineComment) cliArgs.push("--inline-comment", args.inlineComment);
  const r = spawnSync7(py, cliArgs, { encoding: "utf8" });
  if (r.error) {
    throw new Error(`python helper spawn failed: ${r.error.message}`);
  }
  if (r.status !== 0) {
    throw new Error(
      `sprint_status_writer.py exit ${r.status}: ${r.stderr.trim()}`
    );
  }
  await recordAfterWrite({
    manifestPath: args.manifestPath,
    projectRoot: args.projectRoot,
    file: args.sprintStatusPath,
    recordedBy: args.recordedBy,
    telemetryDir: args.telemetryDir
  });
}
function slugify(s, max = 40) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-").slice(0, max) || "untitled";
}
function slugifyShort(s, maxWords = 4) {
  const words = s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "untitled";
  return words.slice(0, maxWords).join("-");
}
function bridgeIdFor(blocksEpic) {
  const match = blocksEpic.match(EPIC_ID_RE);
  if (match) {
    const to = Number(match[1]);
    const from = to - 1;
    return `bridge-${from}-${to}`;
  }
  return `bridge-${slugify(blocksEpic, 30)}`;
}
async function listBridges(opts) {
  const ext = readExtension(opts.extensionPath);
  let filtered = ext.bridges;
  if (opts.blocksEpic) {
    filtered = filtered.filter((b) => b.blocks_epic === opts.blocksEpic);
  }
  if (opts.type) {
    filtered = filtered.filter((b) => b.type === opts.type);
  }
  if (opts.status) {
    filtered = filtered.filter((b) => b.status === opts.status);
  }
  return { bridges: filtered };
}
async function resolveBridge(opts) {
  if (typeof opts.outcome !== "string" || opts.outcome.length === 0) {
    throw new Error("resolve requires a non-empty --outcome (audit field)");
  }
  const ext = readExtension(opts.extensionPath);
  const idx = ext.bridges.findIndex((b) => b.id === opts.bridgeId);
  if (idx < 0) throw new Error(`bridge not found: ${opts.bridgeId}`);
  const before = ext.bridges[idx].status;
  ext.bridges[idx] = { ...ext.bridges[idx], status: "done", outcome: opts.outcome };
  await writeExtension(opts.extensionPath, ext, {
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir
  });
  await pyStatusWrite({
    sprintStatusPath: opts.sprintStatusPath,
    key: opts.bridgeId,
    status: "done",
    append: false,
    ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {},
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir
  });
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "bridge-epic-events",
    event: {
      kind: "resolve",
      bridge_id: opts.bridgeId,
      status_before: before,
      status_after: "done",
      outcome_recorded: opts.outcome
    }
  });
  return {
    bridgeId: opts.bridgeId,
    statusBefore: before,
    statusAfter: "done",
    outcomeRecorded: opts.outcome
  };
}
var import_proper_lockfile2, import_write_file_atomic2, import_yaml5, HELPER_PATH, BRIDGE_TYPES, TYPE_SET, EMPTY_EXTENSION;
var init_bridge = __esm({
  "src/epic/bridge.ts"() {
    "use strict";
    import_proper_lockfile2 = __toESM(require_proper_lockfile(), 1);
    import_write_file_atomic2 = __toESM(require_lib(), 1);
    import_yaml5 = __toESM(require_dist(), 1);
    init_emit();
    init_helper();
    init_auto_record();
    init_model();
    HELPER_PATH = resolveHelperPath(
      dirname6(fileURLToPath5(import.meta.url))
    );
    BRIDGE_TYPES = [
      "spike",
      "tech-debt",
      "refactor",
      "infra",
      "dependency-upgrade"
    ];
    TYPE_SET = new Set(BRIDGE_TYPES);
    EMPTY_EXTENSION = {
      schema_version: "1.1",
      bridges: [],
      parents: {}
    };
  }
});

// src/state/sprint-status.ts
var sprint_status_exports = {};
__export(sprint_status_exports, {
  ACTIVE_STATUSES: () => ACTIVE_STATUSES,
  activeStoryKeys: () => activeStoryKeys,
  classifyEntityKind: () => classifyEntityKind,
  epicTitleFromSprintStatus: () => epicTitleFromSprintStatus,
  readSprintStatus: () => readSprintStatus,
  slugifyEpicTitle: () => slugifyEpicTitle
});
import { existsSync as existsSync8, readFileSync as readFileSync7 } from "node:fs";
function classify(key2, ctx = EMPTY_CTX) {
  const parentId = ctx.parents.get(key2);
  if (parentId !== void 0) {
    if (parentId.startsWith("bridge-")) {
      const bridge2 = ctx.bridgeIds.get(parentId);
      const out = {
        key: key2,
        status: "",
        kind: "bridge-story",
        parentEpic: parentId
      };
      if (bridge2) {
        out.fromEpic = bridge2.fromEpic;
        out.toEpic = bridge2.toEpic;
      }
      return out;
    }
    return {
      key: key2,
      status: "",
      kind: "story",
      parentEpic: parentId
    };
  }
  const bridge = ctx.bridgeIds.get(key2);
  if (bridge) {
    return {
      key: key2,
      status: "",
      kind: "bridge",
      fromEpic: bridge.fromEpic,
      toEpic: bridge.toEpic
    };
  }
  const m = EPIC_ID_RE.exec(key2);
  if (m) return { key: key2, status: "", kind: "epic" };
  return null;
}
function readSprintStatus(opts) {
  if (!existsSync8(opts.sprintStatusPath)) {
    return {
      entries: [],
      byKey: /* @__PURE__ */ new Map(),
      storiesByEpic: /* @__PURE__ */ new Map(),
      unrecognizedKeys: []
    };
  }
  const parsed = (0, import_yaml6.parse)(readFileSync7(opts.sprintStatusPath, "utf8")) ?? {};
  const dev = parsed.development_status;
  const entries = [];
  const byKey = /* @__PURE__ */ new Map();
  const storiesByEpic = /* @__PURE__ */ new Map();
  const unrecognizedKeys = [];
  if (!dev || typeof dev !== "object") {
    return { entries, byKey, storiesByEpic, unrecognizedKeys };
  }
  const ctx = { parents: /* @__PURE__ */ new Map(), bridgeIds: /* @__PURE__ */ new Map() };
  if (opts.extensionPath) {
    const ext = readExtension(opts.extensionPath);
    if (ext.parents) {
      for (const [k, v] of Object.entries(ext.parents)) {
        if (typeof v === "string") ctx.parents.set(k, v);
      }
    }
    for (const b of ext.bridges) {
      const m = /^bridge-(\d+)-(\d+)$/.exec(b.id);
      if (m) {
        ctx.bridgeIds.set(b.id, {
          fromEpic: Number(m[1]),
          toEpic: Number(m[2])
        });
      }
    }
  }
  for (const [key2, rawStatus] of Object.entries(dev)) {
    const cls = classify(key2, ctx);
    if (!cls) {
      unrecognizedKeys.push(key2);
      continue;
    }
    cls.status = typeof rawStatus === "string" ? rawStatus : String(rawStatus);
    entries.push(cls);
    byKey.set(key2, cls);
    if ((cls.kind === "story" || cls.kind === "bridge-story") && cls.parentEpic) {
      const list = storiesByEpic.get(cls.parentEpic) ?? [];
      list.push(cls);
      storiesByEpic.set(cls.parentEpic, list);
    }
  }
  return { entries, byKey, storiesByEpic, unrecognizedKeys };
}
function activeStoryKeys(doc) {
  return doc.entries.filter((e) => e.kind === "story" || e.kind === "bridge-story").filter((e) => ACTIVE_STATUSES.has(e.status)).map((e) => e.key);
}
function classifyEntityKind(storyId, extensionPath) {
  if (extensionPath && existsSync8(extensionPath)) {
    const ext = readExtension(extensionPath);
    if (ext.bridges.some((b) => b.id === storyId)) return "epic";
  }
  if (EPIC_ID_RE.test(storyId)) return "epic";
  return "story";
}
function slugifyEpicTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function epicTitleFromSprintStatus(sprintStatusPath, epicId) {
  if (!existsSync8(sprintStatusPath)) return null;
  const lines = readFileSync7(sprintStatusPath, "utf8").split("\n");
  const keyLineRe = new RegExp(
    `^\\s*${epicId.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&")}\\s*:`
  );
  let keyLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (keyLineRe.test(lines[i])) {
      keyLineIdx = i;
      break;
    }
  }
  if (keyLineIdx === -1) return null;
  const titleRe = /^\s*#\s*(?:Epic\s+\d+\s*:\s*|E\d+\s*:\s*|epic-\d+\s*:\s*)?(.+?)\s*$/i;
  for (let j = keyLineIdx - 1; j >= 0; j--) {
    const line = lines[j];
    if (line.trim() === "") continue;
    if (!line.trim().startsWith("#")) break;
    const m = titleRe.exec(line);
    if (m && m[1] && m[1].length > 0) {
      return m[1];
    }
  }
  return null;
}
var import_yaml6, ACTIVE_STATUSES, EMPTY_CTX;
var init_sprint_status = __esm({
  "src/state/sprint-status.ts"() {
    "use strict";
    import_yaml6 = __toESM(require_dist(), 1);
    init_bridge();
    init_model();
    ACTIVE_STATUSES = /* @__PURE__ */ new Set([
      "ready-for-dev",
      "tests-pending",
      "tests-drafting",
      "tests-needs-revision",
      "tests-approved",
      "in-progress",
      "review",
      "rework",
      "halted"
    ]);
    EMPTY_CTX = {
      parents: /* @__PURE__ */ new Map(),
      bridgeIds: /* @__PURE__ */ new Map()
    };
  }
});

// src/branch/registry.ts
var registry_exports = {};
__export(registry_exports, {
  attach: () => attach,
  findByBranch: () => findByBranch,
  findByEpic: () => findByEpic,
  findByStory: () => findByStory,
  listActive: () => listActive,
  readRegistryDoc: () => readRegistryDoc,
  register: () => register,
  remove: () => remove,
  updateStatus: () => updateStatus,
  writeRegistryDoc: () => writeRegistryDoc
});
import { existsSync as existsSync11, readFileSync as readFileSync11, mkdirSync as mkdirSync4 } from "node:fs";
import { dirname as dirname7 } from "node:path";
function validateBranchName(branch) {
  if (!PREFIX_RE.test(branch)) {
    throw new Error(
      `branch name has invalid prefix or charset: ${branch} (allowed prefixes: ${BRANCH_TYPES.join("|")}; free-form must match [a-z0-9._/-]+)`
    );
  }
  if (branch.includes("..")) {
    throw new Error(`branch name contains double-dot: ${branch} (invalid)`);
  }
  const free = branch.slice(branch.indexOf("/") + 1);
  if (free.length > 80) {
    throw new Error(
      `branch free-form part is too long (${free.length}>80): ${branch}`
    );
  }
  if (free.startsWith("-") || free.startsWith(".") || free.endsWith("-") || free.endsWith(".")) {
    throw new Error(
      `branch free-form part has leading/trailing - or .: ${branch} (invalid)`
    );
  }
}
function readRegistryDoc(path) {
  return readDoc(path);
}
async function writeRegistryDoc(path, doc, recordOpts) {
  return writeDoc(path, doc, recordOpts);
}
function readDoc(path) {
  if (!existsSync11(path)) return structuredClone(EMPTY_DOC);
  const parsed = (0, import_yaml10.parse)(readFileSync11(path, "utf8")) ?? structuredClone(EMPTY_DOC);
  if (!Array.isArray(parsed.branches)) parsed.branches = [];
  if (!parsed.schema_version) parsed.schema_version = "1.0";
  return parsed;
}
async function writeDoc(path, doc, recordOpts) {
  const yaml = (0, import_yaml10.stringify)(doc, { indent: 2, lineWidth: 0 });
  mkdirSync4(dirname7(path), { recursive: true });
  const release = await import_proper_lockfile4.default.lock(path, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic4.default)(path, yaml, { fsync: true });
    await recordAfterWrite({
      manifestPath: recordOpts.manifestPath,
      projectRoot: recordOpts.projectRoot,
      file: path,
      recordedBy: recordOpts.recordedBy,
      telemetryDir: recordOpts.telemetryDir,
      ...recordOpts.reason !== void 0 ? { reason: recordOpts.reason } : {}
    });
  } finally {
    await release();
  }
}
async function lockedMutateRegistry(path, mutator, recordOpts) {
  mkdirSync4(dirname7(path), { recursive: true });
  if (!existsSync11(path)) {
    const yaml = (0, import_yaml10.stringify)(EMPTY_DOC, { indent: 2, lineWidth: 0 });
    await (0, import_write_file_atomic4.default)(path, yaml, { fsync: true });
  }
  const release = await import_proper_lockfile4.default.lock(path, {
    retries: { retries: 200, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    const doc = readDoc(path);
    const result = await mutator(doc);
    const yaml = (0, import_yaml10.stringify)(doc, { indent: 2, lineWidth: 0 });
    await (0, import_write_file_atomic4.default)(path, yaml, { fsync: true });
    await recordAfterWrite({
      manifestPath: recordOpts.manifestPath,
      projectRoot: recordOpts.projectRoot,
      file: path,
      recordedBy: recordOpts.recordedBy,
      telemetryDir: recordOpts.telemetryDir,
      ...recordOpts.reason !== void 0 ? { reason: recordOpts.reason } : {}
    });
    return result;
  } finally {
    await release();
  }
}
async function register(opts) {
  validateBranchName(opts.entry.branch);
  return lockedMutateRegistry(
    opts.registryPath,
    (doc) => {
      if (doc.branches.some((b) => b.branch === opts.entry.branch)) {
        throw new Error(
          `branch already exists in registry: ${opts.entry.branch} (collision)`
        );
      }
      const entry = {
        ...opts.entry,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      doc.branches.push(entry);
      return entry;
    },
    opts.recordOpts
  );
}
async function attach(opts) {
  return register({
    registryPath: opts.registryPath,
    recordOpts: opts.recordOpts,
    entry: {
      branch: opts.branch,
      story_id: opts.storyId,
      epic_id: opts.epicId,
      base_branch: opts.baseBranch,
      created_by: "tds-branch-attach",
      status: "active",
      pr_url: null,
      pr_number: null,
      last_synced_at: null,
      notes: opts.notes ?? ""
    }
  });
}
async function findByBranch(opts) {
  const doc = readDoc(opts.registryPath);
  return doc.branches.find((b) => b.branch === opts.branch) ?? null;
}
async function findByStory(opts) {
  const doc = readDoc(opts.registryPath);
  return doc.branches.filter((b) => b.story_id === opts.storyId);
}
async function findByEpic(opts) {
  const doc = readDoc(opts.registryPath);
  return doc.branches.filter((b) => b.epic_id === opts.epicId);
}
async function listActive(opts) {
  const doc = readDoc(opts.registryPath);
  return doc.branches.filter((b) => b.status === "active");
}
async function updateStatus(opts) {
  return lockedMutateRegistry(
    opts.registryPath,
    (doc) => {
      const idx = doc.branches.findIndex((b) => b.branch === opts.branch);
      if (idx < 0) throw new Error(`branch not found in registry: ${opts.branch}`);
      const existing = doc.branches[idx];
      const updated = {
        ...existing,
        status: opts.status,
        ...opts.fields ?? {}
      };
      doc.branches[idx] = updated;
      return updated;
    },
    opts.recordOpts
  );
}
async function remove(opts) {
  await lockedMutateRegistry(
    opts.registryPath,
    (doc) => {
      const before = doc.branches.length;
      doc.branches = doc.branches.filter((b) => b.branch !== opts.branch);
      if (doc.branches.length === before) {
        throw new Error(`branch not found in registry: ${opts.branch}`);
      }
    },
    opts.recordOpts
  );
}
var import_proper_lockfile4, import_write_file_atomic4, import_yaml10, BRANCH_TYPES, EMPTY_DOC, PREFIX_RE;
var init_registry = __esm({
  "src/branch/registry.ts"() {
    "use strict";
    import_proper_lockfile4 = __toESM(require_proper_lockfile(), 1);
    import_write_file_atomic4 = __toESM(require_lib(), 1);
    import_yaml10 = __toESM(require_dist(), 1);
    init_auto_record();
    BRANCH_TYPES = [
      "feature",
      "bugfix",
      "hotfix",
      "chore",
      "refactor",
      "docs",
      "epic",
      // `story/<id>` is what `tds branch start --story=<id>` auto-derives
      // when --name is omitted. Was previously rejected by validation,
      // forcing callers to either pass --name explicitly or rename
      // post-creation. Caught in callisto pilot — sub-skill created
      // `story/10-0-...` and the prefix check rejected it.
      "story"
    ];
    EMPTY_DOC = { schema_version: "1.0", branches: [] };
    PREFIX_RE = new RegExp(
      `^(?:${BRANCH_TYPES.join("|")})/[a-z0-9._/-]+$`
    );
  }
});

// src/state/state-machine.ts
var state_machine_exports = {};
__export(state_machine_exports, {
  EPIC_TRANSITIONS: () => EPIC_TRANSITIONS,
  TRANSITIONS: () => TRANSITIONS,
  validateTransition: () => validateTransition
});
function key(from, to) {
  return `${from}\u2192${to}`;
}
function validateTransition(opts) {
  if (opts.from === opts.to) return { allow: true };
  if (opts.kind === "epic") {
    return validateEpicTransition(opts);
  }
  const allowed = TRANSITIONS[opts.from];
  if (!allowed.has(opts.to)) {
    return {
      allow: false,
      reason: `Transition ${opts.from} \u2192 ${opts.to} not permitted by state machine. Allowed exits \u0438\u0437 ${opts.from}: ${Array.from(allowed).join(", ") || "<terminal>"}.`,
      recovery: opts.to === "in-progress" && opts.from === "ready-for-dev" ? `Use \`tds branch start --story=<id>\` to enter test-author phase (ready-for-dev \u2192 tests-pending), \u0437\u0430\u0442\u0435\u043C /bmad-tds-test-author skill (tests-pending \u2192 tests-drafting \u2192 tests-approved), \u043F\u043E\u0442\u043E\u043C specialist flips tests-approved \u2192 in-progress.` : `Recovery: \`tds story reset --story=<id> --to=halted --as=auditor\` + subsequent halted \u2192 ready-for-dev re-entry.`
    };
  }
  const policy = ROLE_POLICY[key(opts.from, opts.to)];
  if (!policy) {
    return {
      allow: false,
      reason: `Transition ${opts.from} \u2192 ${opts.to} edge present in TRANSITIONS but missing ROLE_POLICY entry \u2014 \u044D\u0442\u043E bug, \u043D\u0435 legitimate denial. Open issue \u0441 \u044D\u0442\u0438\u043C message.`
    };
  }
  if (policy.roles !== ANY_ROLE_KEY && !policy.roles.has(opts.role)) {
    return {
      allow: false,
      reason: `Transition ${opts.from} \u2192 ${opts.to} restricted to ${policy.descriptor} (got role=${opts.role}).`,
      recovery: `Re-run \u0441 --as=${policy.descriptor.split(" ")[0]} (or invoke through the canonical workflow skill).`
    };
  }
  return { allow: true };
}
function validateEpicTransition(opts) {
  const epicAllowed = EPIC_TRANSITIONS[opts.from];
  if (!epicAllowed) {
    return {
      allow: false,
      reason: `Transition ${opts.from} \u2192 ${opts.to} not permitted for kind=epic. Epic states: backlog | in-progress | done | halted. Story-only state ${opts.from} unreachable through epic lifecycle.`
    };
  }
  if (!epicAllowed.has(opts.to)) {
    const result = {
      allow: false,
      reason: `Transition ${opts.from} \u2192 ${opts.to} not permitted for kind=epic. Allowed exits \u0438\u0437 ${opts.from}: ${Array.from(epicAllowed).join(", ") || "<terminal>"}.`
    };
    if (opts.from === "backlog" && opts.to === "done") {
      result.recovery = `Use \`tds state set --story=<epic-id> --status=in-progress\` first, \u0437\u0430\u0442\u0435\u043C \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F \u0432\u0441\u0435\u0445 stories \u2014 \`--status=done\`.`;
    }
    return result;
  }
  const epicPolicy = EPIC_ROLE_POLICY[key(opts.from, opts.to)];
  if (epicPolicy && epicPolicy.roles !== ANY_ROLE_KEY && !epicPolicy.roles.has(opts.role)) {
    return {
      allow: false,
      reason: `Epic transition ${opts.from} \u2192 ${opts.to} restricted to ${epicPolicy.descriptor} (got role=${opts.role}).`,
      recovery: `Re-run \u0441 --as=${epicPolicy.descriptor.split(" ")[0]} (or invoke through the canonical workflow skill).`
    };
  }
  return { allow: true };
}
var TRANSITIONS, EPIC_TRANSITIONS, SPECIALIST_ROLES3, ANY_ROLE_KEY, ROLE_POLICY, EPIC_ROLE_POLICY;
var init_state_machine = __esm({
  "src/state/state-machine.ts"() {
    "use strict";
    init_model();
    TRANSITIONS = {
      backlog: /* @__PURE__ */ new Set(["ready-for-dev", "halted"]),
      "ready-for-dev": /* @__PURE__ */ new Set(["tests-pending", "halted"]),
      "tests-pending": /* @__PURE__ */ new Set(["tests-drafting", "halted"]),
      "tests-drafting": /* @__PURE__ */ new Set(["tests-approved", "tests-needs-revision", "halted"]),
      "tests-needs-revision": /* @__PURE__ */ new Set(["tests-drafting", "halted"]),
      "tests-approved": /* @__PURE__ */ new Set(["in-progress", "tests-needs-revision", "halted"]),
      // ADR-0016 §B canonical (Model B): in-progress → review → approved → done.
      // PR-13 removed the legacy direct edges `in-progress → done` and
      // `review → done` — verdict (`review → approved`) и delivery
      // (`approved → done`) теперь две отдельные ownership-boundaries.
      "in-progress": /* @__PURE__ */ new Set(["review", "halted"]),
      review: /* @__PURE__ */ new Set(["approved", "rework", "halted"]),
      rework: /* @__PURE__ */ new Set(["in-progress", "review", "halted"]),
      // ADR-0016 §B — intermediate state between `review` and `done`.
      // `approved` means «auditor verdict approved, deliver boundary
      // pending». `approved → done` is the delivery orchestrator's flip.
      // `approved → halted` is the recovery escape.
      approved: /* @__PURE__ */ new Set(["done", "halted"]),
      done: /* @__PURE__ */ new Set([]),
      halted: /* @__PURE__ */ new Set(["ready-for-dev"])
    };
    EPIC_TRANSITIONS = {
      backlog: /* @__PURE__ */ new Set(["in-progress", "halted"]),
      // ADR-0016 §C canonical (Model B): in-progress → approved → done.
      // PR-13 removed the legacy direct edge `in-progress → done` — epic
      // delivery теперь requires explicit verdict via auditor (auditor
      // flip `in-progress → approved`) and explicit delivery via engineer
      // (engineer flip `approved → done`), per EPIC_ROLE_POLICY.
      "in-progress": /* @__PURE__ */ new Set(["approved", "halted"]),
      // ADR-0016 §C — aggregate delivery gate. `approved` means «all
      // in-scope stories approved + epic-level review verdict approved,
      // deliver pending». `approved → done` is the delivery flip.
      approved: /* @__PURE__ */ new Set(["done", "halted"]),
      done: /* @__PURE__ */ new Set([]),
      halted: /* @__PURE__ */ new Set(["in-progress"])
    };
    SPECIALIST_ROLES3 = new Set(SPECIALIST_ROLES);
    ANY_ROLE_KEY = "*";
    ROLE_POLICY = {
      // Story-creation lane: any role may move backlog → ready-for-dev.
      [key("backlog", "ready-for-dev")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      // Branch-start lane: any role triggering `tds branch start --story` —
      // typically engineer/orchestrator, occasionally specialist resuming.
      [key("ready-for-dev", "tests-pending")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      // Test-author phase lane (test-author exclusive ownership).
      [key("tests-pending", "tests-drafting")]: {
        roles: /* @__PURE__ */ new Set(["test-author"]),
        descriptor: "test-author"
      },
      [key("tests-drafting", "tests-approved")]: {
        roles: /* @__PURE__ */ new Set(["test-author"]),
        descriptor: "test-author"
      },
      [key("tests-drafting", "tests-needs-revision")]: {
        roles: /* @__PURE__ */ new Set(["test-author"]),
        descriptor: "test-author"
      },
      [key("tests-needs-revision", "tests-drafting")]: {
        roles: /* @__PURE__ */ new Set(["test-author"]),
        descriptor: "test-author"
      },
      // `tds story unfreeze-tests` — specialist расжимает frozen tests.
      [key("tests-approved", "tests-needs-revision")]: {
        roles: SPECIALIST_ROLES3,
        descriptor: "specialist (via tds story unfreeze-tests)"
      },
      // Specialist takeover lane.
      [key("tests-approved", "in-progress")]: {
        roles: SPECIALIST_ROLES3,
        descriptor: "specialist"
      },
      // Specialist finalize lane.
      [key("in-progress", "review")]: {
        roles: SPECIALIST_ROLES3,
        descriptor: "specialist"
      },
      // ADR-0016 §B canonical auditor verdict lane: review → approved or
      // review → rework. PR-13 removed the legacy direct edges
      // `in-progress → done` and `review → done` — verdict is now strictly
      // separated from delivery (`approved → done` через engineer).
      [key("review", "approved")]: {
        roles: /* @__PURE__ */ new Set(["auditor"]),
        descriptor: "auditor"
      },
      [key("review", "rework")]: {
        roles: /* @__PURE__ */ new Set(["auditor"]),
        descriptor: "auditor"
      },
      // ADR-0016 §B — approved → done is the delivery orchestrator's flip.
      // Narrow to `engineer` specifically (not the whole specialist umbrella):
      // csharp/python/etc. specialists implement; engineer orchestrates
      // delivery. CODE-03 (PR-12) will centralise this constant.
      [key("approved", "done")]: {
        roles: /* @__PURE__ */ new Set(["engineer"]),
        descriptor: "engineer (delivery orchestrator)"
      },
      [key("approved", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      // Rework-cycle lane.
      [key("rework", "in-progress")]: {
        roles: SPECIALIST_ROLES3,
        descriptor: "specialist"
      },
      [key("rework", "review")]: {
        roles: SPECIALIST_ROLES3,
        descriptor: "specialist"
      },
      // Universal halt lane (any active state → halted, any role).
      [key("backlog", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("ready-for-dev", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("tests-pending", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("tests-drafting", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("tests-needs-revision", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("tests-approved", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("in-progress", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("review", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      [key("rework", "halted")]: { roles: ANY_ROLE_KEY, descriptor: "any role" },
      // Halt-recovery lane.
      [key("halted", "ready-for-dev")]: { roles: ANY_ROLE_KEY, descriptor: "any role" }
    };
    EPIC_ROLE_POLICY = {
      [key("in-progress", "approved")]: {
        roles: /* @__PURE__ */ new Set(["auditor"]),
        descriptor: "auditor"
      },
      [key("approved", "done")]: {
        roles: /* @__PURE__ */ new Set(["engineer"]),
        descriptor: "engineer (delivery orchestrator)"
      }
      // approved → halted intentionally role-free (recovery escape).
    };
  }
});

// src/state/story-frontmatter.ts
var story_frontmatter_exports = {};
__export(story_frontmatter_exports, {
  StoryFrontmatterError: () => StoryFrontmatterError,
  readStoryFrontmatter: () => readStoryFrontmatter,
  storyFrontmatterPath: () => storyFrontmatterPath,
  writeStoryFrontmatter: () => writeStoryFrontmatter
});
import {
  existsSync as existsSync14,
  readFileSync as readFileSync14,
  writeFileSync
} from "node:fs";
function findFenceBoundaries(text) {
  if (!text.startsWith(`${FENCE}
`) && !text.startsWith(`${FENCE}\r
`)) {
    return null;
  }
  const startNewlineLen = text.startsWith(`${FENCE}\r
`) ? 2 : 1;
  const start = FENCE.length + startNewlineLen;
  const closeRegex = /\r?\n---(\r?\n|$)/;
  const m = closeRegex.exec(text.slice(start));
  if (!m) return null;
  const closeIdx = start + m.index;
  const closeLen = m[0].length;
  return { start, end: closeIdx + closeLen };
}
function readStoryFrontmatter(path) {
  if (!existsSync14(path)) {
    throw new StoryFrontmatterError(`story file not found: ${path}`);
  }
  const text = readFileSync14(path, "utf8");
  const fence = findFenceBoundaries(text);
  if (!fence) return null;
  const yamlBlock = text.slice(FENCE.length + 1, fence.end - FENCE.length - 2);
  let frontmatter;
  try {
    frontmatter = (0, import_yaml13.parse)(yamlBlock);
  } catch (err) {
    throw new StoryFrontmatterError(
      `frontmatter at ${path} is not valid YAML: ${err.message}`,
      err
    );
  }
  const body = text.slice(fence.end);
  return {
    frontmatter,
    body,
    raw: { fenceStart: 0, fenceEnd: fence.end }
  };
}
function migratePlainStatusToFrontmatter(path) {
  const text = readFileSync14(path, "utf8");
  const statusMatch = text.match(/^Status:\s*(\S+)\s*$/m);
  if (!statusMatch) {
    throw new StoryFrontmatterError(
      `cannot migrate ${path} \u2014 no \`Status:\` line found in markdown body. bmad-create-story output should include a \`Status: <value>\` line (typically after H1 heading). Refusing \u043A write blind.`
    );
  }
  const initialStatus = statusMatch[1];
  const headingMatch = text.match(/^#\s+(.+?)\s*$/m);
  const filenameId = path.split(/[\/\\]/).pop().replace(/\.md$/, "");
  const title = headingMatch ? headingMatch[1].trim() : filenameId;
  const bodyWithoutStatus = text.replace(/^Status:\s*\S+\s*\n?/m, "");
  const yamlFrontmatter = `---
id: ${JSON.stringify(filenameId)}
title: ${JSON.stringify(title)}
status: ${JSON.stringify(initialStatus)}
---

`;
  writeFileSync(path, yamlFrontmatter + bodyWithoutStatus);
  const reparsed = readStoryFrontmatter(path);
  if (reparsed === null) {
    throw new StoryFrontmatterError(
      `migration of ${path} produced invalid frontmatter; this is a bug`
    );
  }
  return reparsed;
}
async function writeStoryFrontmatter(path, update, recordOpts) {
  let parsed = readStoryFrontmatter(path);
  if (!parsed) {
    parsed = migratePlainStatusToFrontmatter(path);
  }
  const fm = parsed.frontmatter;
  if (update.status !== void 0) {
    fm.status = update.status;
  }
  if (update.topLevel) {
    Object.assign(fm, update.topLevel);
  }
  const needsTds = update.tds !== void 0 || update.appendHalt !== void 0 || update.markHaltRecovered !== void 0 || update.appendReviewFollowup !== void 0 || update.appendReviewers !== void 0;
  if (needsTds && !fm.tds) fm.tds = {};
  if (update.tds) {
    fm.tds = { ...fm.tds, ...update.tds };
  }
  if (update.appendHalt) {
    const list = fm.tds.halt_history ?? [];
    list.push(update.appendHalt);
    fm.tds.halt_history = list;
  }
  if (update.markHaltRecovered) {
    const list = fm.tds.halt_history ?? [];
    if (list.length === 0) {
      throw new StoryFrontmatterError(
        "no halt records to mark recovered (halt_history is empty)"
      );
    }
    const last = list[list.length - 1];
    last.recovered_at = update.markHaltRecovered.recovered_at;
  }
  if (update.appendReviewFollowup) {
    const list = fm.tds.review_followups ?? [];
    list.push(update.appendReviewFollowup);
    fm.tds.review_followups = list;
  }
  if (update.appendReviewers && update.appendReviewers.length > 0) {
    const existing = fm.tds.reviewers ?? [];
    const seen = new Set(existing);
    for (const handle of update.appendReviewers) {
      if (handle && !seen.has(handle)) {
        seen.add(handle);
        existing.push(handle);
      }
    }
    fm.tds.reviewers = existing;
  }
  const cleanedBody = parsed.body.replace(/^Status:\s*\S+\s*\n?/m, "");
  const yamlOut = (0, import_yaml13.stringify)(fm, { indent: 2, lineWidth: 0 });
  const newText = `${FENCE}
${yamlOut}${FENCE}
${cleanedBody}`;
  const release = await import_proper_lockfile5.default.lock(path, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic5.default)(path, newText, { fsync: true });
    await recordAfterWrite({
      manifestPath: recordOpts.manifestPath,
      projectRoot: recordOpts.projectRoot,
      file: path,
      recordedBy: recordOpts.recordedBy,
      telemetryDir: recordOpts.telemetryDir,
      ...recordOpts.storyId !== void 0 ? { storyId: recordOpts.storyId } : {},
      ...recordOpts.reason !== void 0 ? { reason: recordOpts.reason } : {}
    });
  } finally {
    await release();
  }
}
function storyFrontmatterPath(implArtifactsDir, storyId) {
  return `${implArtifactsDir}/stories/${storyId}.md`;
}
var import_proper_lockfile5, import_write_file_atomic5, import_yaml13, StoryFrontmatterError, FENCE;
var init_story_frontmatter = __esm({
  "src/state/story-frontmatter.ts"() {
    "use strict";
    import_proper_lockfile5 = __toESM(require_proper_lockfile(), 1);
    import_write_file_atomic5 = __toESM(require_lib(), 1);
    import_yaml13 = __toESM(require_dist(), 1);
    init_auto_record();
    init_model();
    StoryFrontmatterError = class extends Error {
      cause;
      constructor(message, cause) {
        super(message);
        this.name = "StoryFrontmatterError";
        if (cause !== void 0) this.cause = cause;
      }
    };
    FENCE = "---";
  }
});

// src/state/story-spec.ts
var story_spec_exports = {};
__export(story_spec_exports, {
  appendAuditorFinding: () => appendAuditorFinding,
  appendCompletionNote: () => appendCompletionNote,
  appendFileListEntry: () => appendFileListEntry,
  countOpenTasks: () => countOpenTasks,
  listOpenTaskLabels: () => listOpenTaskLabels,
  markFindingBridged: () => markFindingBridged,
  markFindingResolved: () => markFindingResolved,
  markSubtaskComplete: () => markSubtaskComplete,
  markTaskComplete: () => markTaskComplete,
  markTaskDeferred: () => markTaskDeferred,
  nextAuditorRound: () => nextAuditorRound,
  parseStorySpec: () => parseStorySpec,
  readAuditorFindings: () => readAuditorFindings,
  readStorySpec: () => readStorySpec,
  setSpecialistSelfReview: () => setSpecialistSelfReview,
  setStatus: () => setStatus,
  writeStorySpec: () => writeStorySpec
});
import { readFileSync as readFileSync15, existsSync as existsSync15 } from "node:fs";
import { dirname as dirname8 } from "node:path";
function parseStorySpec(content) {
  const m = STATUS_RE.exec(content);
  return {
    body: content,
    status: m ? m[1] : null
  };
}
function readStorySpec(path) {
  if (!existsSync15(path)) return null;
  return parseStorySpec(readFileSync15(path, "utf8"));
}
function setStatus(spec, newStatus) {
  if (!STATUS_RE.test(spec.body)) return null;
  if (spec.status === newStatus) return spec;
  const body = spec.body.replace(STATUS_RE, `Status: ${newStatus}`);
  return { body, status: newStatus };
}
function markTaskComplete(spec, taskLabel) {
  const escaped = taskLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `^- \\[ \\] (#\\d+ )?\\*\\*(${escaped}\\b[^*]*)\\*\\*`,
    "m"
  );
  if (!re.test(spec.body)) {
    const reDone = new RegExp(
      `^- \\[x\\] (#\\d+ )?\\*\\*(${escaped}\\b[^*]*)\\*\\*`,
      "m"
    );
    if (reDone.test(spec.body)) {
      return cascadeSubtasks(spec, escaped);
    }
    return null;
  }
  const flipped = spec.body.replace(re, (_match, num, label) => {
    return `- [x] ${num ?? ""}**${label}**`;
  });
  return cascadeSubtasks({ ...spec, body: flipped }, escaped);
}
function cascadeSubtasks(spec, escaped) {
  const lines = spec.body.split("\n");
  const headRe = new RegExp(
    `^- \\[x\\] (?:#\\d+ )?\\*\\*${escaped}\\b`,
    ""
  );
  let headIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headRe.test(lines[i])) {
      headIdx = i;
      break;
    }
  }
  if (headIdx === -1) return spec;
  for (let i = headIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^- /.test(line)) break;
    if (/^#{1,6}\s/.test(line)) break;
    if (/^\s+- \[ \] /.test(line)) {
      lines[i] = line.replace(/- \[ \] /, "- [x] ");
    }
  }
  return { ...spec, body: lines.join("\n") };
}
function markTaskDeferred(spec, taskLabel, reason) {
  const escaped = taskLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reDeferred = new RegExp(
    `^- \\[-\\] (?:#\\d+ )?\\*\\*${escaped}\\b[^*]*\\*\\*`,
    "m"
  );
  if (reDeferred.test(spec.body)) return spec;
  const reDone = new RegExp(
    `^- \\[x\\] (?:#\\d+ )?\\*\\*${escaped}\\b[^*]*\\*\\*`,
    "m"
  );
  if (reDone.test(spec.body)) return null;
  const reOpen = new RegExp(
    `^- \\[ \\] (#\\d+ )?\\*\\*(${escaped}\\b[^*]*)\\*\\*(.*)$`,
    "m"
  );
  if (!reOpen.test(spec.body)) return null;
  const body = spec.body.replace(reOpen, (_match, num, label, rest) => {
    return `- [-] ${num ?? ""}**${label}**${rest} _(deferred: ${reason})_`;
  });
  return { ...spec, body };
}
function countOpenTasks(body) {
  const re = /^- \[ \] (?:#\d+ )?\*\*Task /gm;
  const matches = body.match(re);
  return matches ? matches.length : 0;
}
function listOpenTaskLabels(body) {
  const re = /^- \[ \] (?:#\d+ )?\*\*(Task [^*]+)\*\*/gm;
  const labels = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    labels.push(m[1].trim());
  }
  return labels;
}
function markSubtaskComplete(spec, subtaskFragment) {
  const escaped = subtaskFragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^(\\s+)- \\[ \\] (.*${escaped}.*)$`, "m");
  if (!re.test(spec.body)) {
    const reDone = new RegExp(`^\\s+- \\[x\\] .*${escaped}`, "m");
    if (reDone.test(spec.body)) return spec;
    return null;
  }
  const body = spec.body.replace(re, "$1- [x] $2");
  return { ...spec, body };
}
function appendCompletionNote(spec, note) {
  return appendUnderHeading(spec, COMPLETION_NOTES_HEADING, note);
}
function appendFileListEntry(spec, path) {
  return appendUnderHeading(spec, FILE_LIST_HEADING, path);
}
function appendAuditorFinding(spec, finding, round) {
  const heading = `${AUDITOR_FINDINGS_HEADING_PREFIX} (round-${round})`;
  const lines = spec.body.split("\n");
  const findingBlock = [
    "",
    `### [${finding.severity}] ${finding.finding}`,
    "",
    `- **Category:** ${finding.category}`
  ];
  if (finding.suggestedFix !== void 0) {
    findingBlock.push(`- **Suggested fix:** ${finding.suggestedFix}`);
  }
  if (finding.suggestedBridge !== void 0) {
    findingBlock.push(`- **Suggested bridge:** \`${finding.suggestedBridge}\``);
  }
  const headingIdx = lines.findIndex((l) => l.trim() === heading);
  if (headingIdx === -1) {
    const tail = spec.body.endsWith("\n") ? "" : "\n";
    const block = `${tail}
${heading}
${findingBlock.join("\n")}
`;
    return { ...spec, body: spec.body + block };
  }
  let cursor = headingIdx + 1;
  while (cursor < lines.length) {
    if (/^##\s/.test(lines[cursor])) break;
    cursor++;
  }
  const before = lines.slice(0, cursor);
  const after = lines.slice(cursor);
  const body = [...before, ...findingBlock, ...after].join("\n");
  return { ...spec, body };
}
function setSpecialistSelfReview(spec, body) {
  const trimmedBody = body.replace(/\s+$/, "");
  const lines = spec.body.split("\n");
  const headingIdx = lines.findIndex((l) => l.trim() === SELF_REVIEW_HEADING);
  if (headingIdx === -1) {
    const findingsIdx = lines.findIndex(
      (l) => /^## Auditor Findings \(round-\d+\)\s*$/.test(l.trim())
    );
    const insertAt = findingsIdx === -1 ? lines.length : findingsIdx;
    const block = [SELF_REVIEW_HEADING, "", trimmedBody, ""];
    if (insertAt > 0 && lines[insertAt - 1] !== "") block.unshift("");
    const newLines2 = [...lines.slice(0, insertAt), ...block, ...lines.slice(insertAt)];
    return { ...spec, body: newLines2.join("\n") };
  }
  let endIdx = lines.length;
  for (let i = headingIdx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  const newLines = [
    ...lines.slice(0, headingIdx),
    SELF_REVIEW_HEADING,
    "",
    trimmedBody,
    "",
    ...lines.slice(endIdx)
  ];
  return { ...spec, body: newLines.join("\n") };
}
function nextAuditorRound(spec) {
  const re = /^## Auditor Findings \(round-(\d+)\)\s*$/gm;
  let max = 0;
  let m;
  while ((m = re.exec(spec.body)) !== null) {
    const n = Number(m[1]);
    if (n > max) max = n;
  }
  return max + 1;
}
function readAuditorFindings(spec) {
  const out = [];
  const lines = spec.body.split("\n");
  let currentRound = 0;
  let currentFindingIdx = 0;
  let currentFinding = null;
  const headingRe = /^## Auditor Findings \(round-(\d+)\)\s*$/;
  const findingHeadingRe = FINDING_HEADING_REGEX;
  const fieldRe = /^- \*\*([^*]+):\*\*\s*(.*)$/;
  function flush() {
    if (currentFinding) {
      out.push(currentFinding);
      currentFinding = null;
    }
  }
  for (const line of lines) {
    const hMatch = headingRe.exec(line);
    if (hMatch) {
      flush();
      currentRound = Number(hMatch[1]);
      currentFindingIdx = 0;
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      currentRound = 0;
      continue;
    }
    if (currentRound === 0) continue;
    const fMatch = findingHeadingRe.exec(line);
    if (fMatch) {
      flush();
      currentFindingIdx++;
      currentFinding = {
        round: currentRound,
        findingIndex: currentFindingIdx,
        severity: fMatch[1],
        finding: fMatch[2].trim()
      };
      continue;
    }
    if (currentFinding) {
      const fieldMatch = fieldRe.exec(line);
      if (!fieldMatch) continue;
      const key2 = fieldMatch[1].trim().toLowerCase();
      const valRaw = fieldMatch[2].trim();
      const val = valRaw.replace(/^`(.*)`$/, "$1");
      if (key2 === "category") currentFinding.category = val;
      else if (key2 === "suggested fix") currentFinding.suggestedFix = val;
      else if (key2 === "suggested bridge") currentFinding.suggestedBridge = val;
      else if (key2 === "bridged to") currentFinding.bridgedTo = val;
      else if (key2 === "resolved") currentFinding.resolved = val;
    }
  }
  flush();
  return out;
}
function markFindingBridged(spec, round, findingIndex, bridgeStoryId) {
  const lines = spec.body.split("\n");
  const headingTarget = `## Auditor Findings (round-${round})`;
  const headingIdx = lines.findIndex((l) => l.trim() === headingTarget);
  if (headingIdx === -1) return null;
  let foundCount = 0;
  let findingStartIdx = -1;
  let cursor = headingIdx + 1;
  while (cursor < lines.length) {
    const line = lines[cursor];
    if (/^## /.test(line)) break;
    if (FINDING_HEADING_REGEX_PREFIX.test(line)) {
      foundCount++;
      if (foundCount === findingIndex) {
        findingStartIdx = cursor;
        break;
      }
    }
    cursor++;
  }
  if (findingStartIdx === -1) return null;
  let blockEnd = findingStartIdx + 1;
  while (blockEnd < lines.length) {
    const l = lines[blockEnd];
    if (/^###?\s/.test(l) || /^## /.test(l)) break;
    blockEnd++;
  }
  for (let i = findingStartIdx + 1; i < blockEnd; i++) {
    if (/^- \*\*Bridged to:\*\*/.test(lines[i])) {
      return spec;
    }
  }
  let insertIdx = blockEnd;
  while (insertIdx > findingStartIdx + 1 && lines[insertIdx - 1].trim() === "") {
    insertIdx--;
  }
  const newLine = `- **Bridged to:** \`${bridgeStoryId}\``;
  const before = lines.slice(0, insertIdx);
  const after = lines.slice(insertIdx);
  const body = [...before, newLine, ...after].join("\n");
  return { ...spec, body };
}
function markFindingResolved(spec, round, findingIndex, reference) {
  const lines = spec.body.split("\n");
  const headingTarget = `## Auditor Findings (round-${round})`;
  const headingIdx = lines.findIndex((l) => l.trim() === headingTarget);
  if (headingIdx === -1) return null;
  let foundCount = 0;
  let findingStartIdx = -1;
  let cursor = headingIdx + 1;
  while (cursor < lines.length) {
    const line = lines[cursor];
    if (/^## /.test(line)) break;
    if (FINDING_HEADING_REGEX_PREFIX.test(line)) {
      foundCount++;
      if (foundCount === findingIndex) {
        findingStartIdx = cursor;
        break;
      }
    }
    cursor++;
  }
  if (findingStartIdx === -1) return null;
  let blockEnd = findingStartIdx + 1;
  while (blockEnd < lines.length) {
    const l = lines[blockEnd];
    if (/^###?\s/.test(l) || /^## /.test(l)) break;
    blockEnd++;
  }
  for (let i = findingStartIdx + 1; i < blockEnd; i++) {
    if (/^- \*\*Resolved:\*\*/.test(lines[i])) {
      return spec;
    }
  }
  let insertIdx = blockEnd;
  while (insertIdx > findingStartIdx + 1 && lines[insertIdx - 1].trim() === "") {
    insertIdx--;
  }
  const newLine = `- **Resolved:** \`${reference}\``;
  const before = lines.slice(0, insertIdx);
  const after = lines.slice(insertIdx);
  const body = [...before, newLine, ...after].join("\n");
  return { ...spec, body };
}
function appendUnderHeading(spec, heading, entry) {
  const lines = spec.body.split("\n");
  const headingIdx = lines.findIndex((l) => l.trim() === heading);
  if (headingIdx === -1) return null;
  let cursor = headingIdx + 1;
  while (cursor < lines.length) {
    const line = lines[cursor];
    if (/^#{1,3}\s/.test(line)) break;
    cursor++;
  }
  const sectionStart = headingIdx + 1;
  const sectionEnd = cursor;
  const sectionLines = lines.slice(sectionStart, sectionEnd);
  const placeholderRe = /^_\(populated during implementation[^)]*\)_$/;
  const filtered = sectionLines.filter((l) => {
    const trimmed = l.trim();
    return trimmed !== "" && !placeholderRe.test(trimmed);
  });
  const newEntry = `- ${entry}`;
  if (filtered.includes(newEntry)) return spec;
  filtered.push(newEntry);
  const before = lines.slice(0, headingIdx + 1);
  const after = lines.slice(sectionEnd);
  const middle = ["", ...filtered, ""];
  const body = [...before, ...middle, ...after].join("\n");
  return { ...spec, body };
}
async function writeStorySpec(path, spec) {
  if (!existsSync15(path)) {
    throw new Error(`story spec not found: ${path}`);
  }
  const release = await lockfile6.lock(dirname8(path), {
    realpath: false,
    stale: 5e3,
    retries: 5
  });
  try {
    await (0, import_write_file_atomic6.default)(path, spec.body);
  } finally {
    await release();
  }
}
var import_proper_lockfile6, import_write_file_atomic6, lockfile6, STATUS_RE, COMPLETION_NOTES_HEADING, FILE_LIST_HEADING, AUDITOR_FINDINGS_HEADING_PREFIX, SELF_REVIEW_HEADING;
var init_story_spec = __esm({
  "src/state/story-spec.ts"() {
    "use strict";
    import_proper_lockfile6 = __toESM(require_proper_lockfile(), 1);
    import_write_file_atomic6 = __toESM(require_lib(), 1);
    init_model();
    lockfile6 = import_proper_lockfile6.default;
    STATUS_RE = /^Status:\s*(.+?)\s*$/m;
    COMPLETION_NOTES_HEADING = "### Completion Notes List";
    FILE_LIST_HEADING = "### File List";
    AUDITOR_FINDINGS_HEADING_PREFIX = "## Auditor Findings";
    SELF_REVIEW_HEADING = "## Specialist Self-Review";
  }
});

// src/state/apply-transition.ts
var apply_transition_exports = {};
__export(apply_transition_exports, {
  StateTransitionDeniedError: () => StateTransitionDeniedError,
  applyStateTransition: () => applyStateTransition
});
import { spawnSync as spawnSync8 } from "node:child_process";
import { readFileSync as readFileSync16, existsSync as existsSync16, accessSync, constants as fsConstants } from "node:fs";
import { dirname as dirname9 } from "node:path";
import { fileURLToPath as fileURLToPath6 } from "node:url";
function statusVocabularyDeny(opts) {
  const legacy = LEGACY_STATUS_RECOVERY[opts.value];
  const allowed = opts.kind === "epic" ? EPIC_STATUSES : STORY_STATUSES;
  const allowedList = allowed.join(", ");
  const reason = legacy ? `${opts.field}=${opts.value} is a legacy status name no longer recognized by the canonical state machine (ADR-0016). ${legacy}` : `${opts.field}=${opts.value} is unknown / not recognized as a valid ${opts.kind} status. Canonical ${opts.kind} states: ${allowedList}.`;
  const recovery = legacy ? legacy : `Validate sprint-status.yaml for ${opts.storyId}; ensure status \u2208 {${allowedList}}. If stale write \u2014 re-run the workflow's canonical command (e.g. \`tds story reset --story=${opts.storyId} --to=halted --as=auditor\` then progress forward) rather than hand-editing.`;
  return new StateTransitionDeniedError({
    from: opts.fromForError,
    to: opts.toForError,
    role: opts.role,
    reason,
    recovery
  });
}
function readCurrentStatus(sprintPath, storyId) {
  if (!existsSync16(sprintPath)) {
    throw new Error(`sprint-status.yaml not found at ${sprintPath}`);
  }
  const parsed = (0, import_yaml14.parse)(readFileSync16(sprintPath, "utf8")) ?? {};
  const dev = parsed.development_status;
  if (!dev || typeof dev !== "object") {
    return { found: false, hasDev: false, value: null };
  }
  if (!Object.prototype.hasOwnProperty.call(dev, storyId)) {
    return { found: false, hasDev: true, value: null };
  }
  const v = dev[storyId];
  return {
    found: true,
    hasDev: true,
    value: typeof v === "string" ? v : String(v)
  };
}
async function applyStateTransition(opts) {
  const current = readCurrentStatus(opts.sprintStatusPath, opts.storyId);
  if (!current.hasDev) {
    throw new Error(
      "sprint-status.yaml is missing the 'development_status' block"
    );
  }
  if (!current.found) {
    if (!opts.appendIfMissing) {
      throw new Error(
        `key ${JSON.stringify(opts.storyId)} not found in development_status`
      );
    }
    current.value = "backlog";
  }
  const fromRaw = current.value ?? "backlog";
  const toRaw = opts.newStatus;
  const role = opts.role;
  const kind = opts.kind ?? "story";
  const isValidStatus = kind === "epic" ? isEpicStatus : isStoryStatus;
  if (!isValidStatus(fromRaw)) {
    throw statusVocabularyDeny({
      field: "from",
      value: fromRaw,
      kind,
      storyId: opts.storyId,
      fromForError: fromRaw,
      toForError: toRaw,
      role
    });
  }
  if (!isValidStatus(toRaw)) {
    throw statusVocabularyDeny({
      field: "to",
      value: toRaw,
      kind,
      storyId: opts.storyId,
      fromForError: fromRaw,
      toForError: toRaw,
      role
    });
  }
  const from = fromRaw;
  const to = toRaw;
  const validation = validateTransition({ from, to, role, kind });
  if (validation.allow && kind === "story" && from === "tests-drafting" && to === "tests-approved" && opts.stateManifestPath) {
    if (!hasTestAuthorRecords({
      manifestPath: opts.stateManifestPath,
      storyId: opts.storyId
    })) {
      throw new StateTransitionDeniedError({
        from,
        to,
        role,
        reason: `tests-drafting \u2192 tests-approved denied: no integrity records \u0441 recorded_by=test-author + story_id=${opts.storyId} + test-pattern path. State machine \u0440\u0430\u0437\u0440\u0435\u0448\u0430\u0435\u0442 transition, \u043D\u043E defense-in-depth gate \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0444\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0443\u044E test-author \u0440\u0430\u0431\u043E\u0442\u0443 (failing tests written + integrity record per file).`,
        recovery: `Invoke \`Skill(bmad-tds-test-author)\` properly: ATDD subagent writes failing tests \u2192 \`tds integrity record --as=test-author --files=<test-paths>\` per test file \u2192 test-review subagent \u2192 verdict=approved. Direct \`tds state set --as=test-author\` \u0431\u0435\u0437 actual test-author skill invocation \u0442\u0435\u043F\u0435\u0440\u044C rejected.`
      });
    }
  }
  if (validation.allow && kind === "story" && to === "review" && opts.storyMdPath) {
    const spec = readStorySpec(opts.storyMdPath);
    if (spec !== null) {
      const findings = readAuditorFindings(spec);
      const openBlockers = findings.filter(
        (f) => f.severity === "blocker" && f.bridgedTo === void 0 && f.resolved === void 0
      );
      if (openBlockers.length > 0) {
        const labels = openBlockers.map((f) => `round-${f.round}#${f.findingIndex}`).join(", ");
        throw new StateTransitionDeniedError({
          from,
          to,
          role,
          reason: `${from} \u2192 review denied: ${openBlockers.length} unresolved blocker finding(s) in spec (${labels}). Earlier-round blockers must be closed before re-entering review \u2014 apply-verdict counts blockers across all rounds (post 2026-05-09 multi-round fix).`,
          recovery: `Per blocker, run ONE of:
  - inline-fix flow: \`tds story resolve-finding --story=${opts.storyId} --round=<R> --finding-index=<N> --resolution=<text> --as=engineer\` (\u043F\u043E\u0441\u043B\u0435 \u0444\u0438\u043A\u0441\u0430 \u0432 \u043A\u043E\u0434\u0435)
  - defer flow: \`tds story add-finding --story=${opts.storyId} --suggested-bridge=<bridge-desc> ... --as=auditor\` (bridge applier \u043F\u043E\u0442\u043E\u043C \u0437\u0430\u043F\u0438\u0448\u0435\u0442 Bridged to: marker).
\u0417\u0430\u0442\u0435\u043C \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 ${opts.viaCommand}.`
        });
      }
    }
  }
  if (!validation.allow) {
    if (opts.telemetryDir) try {
      await emit({
        telemetryDir: opts.telemetryDir,
        stream: "forbidden-quadrant-events",
        event: {
          role,
          op: "state-transition",
          target: opts.storyId,
          decision: "deny",
          reason: validation.reason ?? "denied",
          via_command: opts.viaCommand,
          state_from: from,
          state_to: to
        }
      });
    } catch {
    }
    throw new StateTransitionDeniedError({
      from,
      to,
      role,
      reason: validation.reason ?? "denied by state machine",
      ...validation.recovery !== void 0 ? { recovery: validation.recovery } : {}
    });
  }
  if (opts.storyMdPath && kind === "story") {
    const parent = dirname9(opts.storyMdPath);
    if (!existsSync16(parent)) {
      throw new Error(
        `story-md preflight failed: parent directory does not exist (${parent}). Cannot flip ${opts.storyId} ${fromRaw} \u2192 ${toRaw} \u2014 would leave sprint-status mutated without matching story-md update. Recovery: ensure ${parent} exists (run \`bmad install\` if BMAD output_folder dropped, or correct \`storyMdPath\` arg in caller).`
      );
    }
    try {
      accessSync(parent, fsConstants.W_OK);
    } catch {
      throw new Error(
        `story-md preflight failed: parent directory not writable (${parent}). Cannot flip ${opts.storyId} ${fromRaw} \u2192 ${toRaw}.`
      );
    }
    if (existsSync16(opts.storyMdPath)) {
      try {
        accessSync(opts.storyMdPath, fsConstants.W_OK);
      } catch {
        throw new Error(
          `story-md preflight failed: file not writable (${opts.storyMdPath}). Cannot flip ${opts.storyId} ${fromRaw} \u2192 ${toRaw} \u2014 would leave sprint-status mutated without matching story-md update. Recovery: \`chmod +w ${opts.storyMdPath}\` or remove the read-only attribute set by a parent CI tool.`
        );
      }
    }
  }
  const py = opts.pythonBin ?? "python3";
  const args = [
    HELPER_PATH2,
    "--path",
    opts.sprintStatusPath,
    "--key",
    opts.storyId,
    "--status",
    opts.newStatus
  ];
  if (opts.appendIfMissing) args.push("--append");
  if (opts.touchTimestamp ?? true) args.push("--touch-timestamp");
  const r = spawnSync8(py, args, { encoding: "utf8" });
  if (r.error) {
    throw new Error(`python subprocess failed to spawn: ${r.error.message}`);
  }
  if (r.status === 1) {
    throw new Error(
      `key ${opts.storyId} not found in development_status: ${r.stderr.trim()}`
    );
  }
  if (r.status === 3) {
    throw new Error(`development_status missing: ${r.stderr.trim()}`);
  }
  if (r.status !== 0) {
    throw new Error(
      `sprint_status_writer.py exited ${r.status}: ${r.stderr.trim()}`
    );
  }
  if (opts.stateManifestPath && opts.projectRoot && opts.telemetryDir) {
    await recordAfterWrite({
      manifestPath: opts.stateManifestPath,
      projectRoot: opts.projectRoot,
      file: opts.sprintStatusPath,
      recordedBy: opts.role,
      telemetryDir: opts.telemetryDir,
      storyId: opts.storyId
    });
  }
  let storyMdUpdated = false;
  let storyMdSkipped;
  if (opts.storyMdPath && kind === "story") {
    if (!opts.stateManifestPath) {
      throw new Error(
        "applyStateTransition: stateManifestPath required when storyMdPath set (ADR-0014 \xA7A auto-record)"
      );
    }
    if (!opts.projectRoot) {
      throw new Error(
        "applyStateTransition: projectRoot required when storyMdPath set (ADR-0014 \xA7A auto-record)"
      );
    }
    if (!opts.telemetryDir) {
      throw new Error(
        "applyStateTransition: telemetryDir required when storyMdPath set (ADR-0014 \xA7A auto-record)"
      );
    }
    try {
      await writeStoryFrontmatter(
        opts.storyMdPath,
        { status: to },
        {
          manifestPath: opts.stateManifestPath,
          projectRoot: opts.projectRoot,
          recordedBy: opts.role,
          storyId: opts.storyId,
          telemetryDir: opts.telemetryDir
        }
      );
      storyMdUpdated = true;
    } catch (err) {
      const msg = err.message;
      if (msg.includes("not found")) {
        storyMdSkipped = `story-md not found at ${opts.storyMdPath}`;
      } else {
        storyMdSkipped = `story-md update failed: ${msg}`;
      }
    }
  }
  if (opts.telemetryDir) try {
    await emit({
      telemetryDir: opts.telemetryDir,
      stream: "state-transitions",
      event: {
        story_id: opts.storyId,
        state_before: from,
        state_after: to,
        triggered_by: role,
        via_command: opts.viaCommand,
        story_md_updated: storyMdUpdated,
        ...storyMdSkipped ? { story_md_skipped: storyMdSkipped } : {}
      }
    });
  } catch {
  }
  return {
    storyId: opts.storyId,
    stateBefore: from,
    stateAfter: to,
    storyMdUpdated,
    ...storyMdSkipped ? { storyMdSkipped } : {}
  };
}
var import_yaml14, HELPER_PATH2, StateTransitionDeniedError, LEGACY_STATUS_RECOVERY;
var init_apply_transition = __esm({
  "src/state/apply-transition.ts"() {
    "use strict";
    import_yaml14 = __toESM(require_dist(), 1);
    init_emit();
    init_helper();
    init_state_machine();
    init_model();
    init_story_frontmatter();
    init_auto_record();
    init_test_artifacts_required();
    init_story_spec();
    HELPER_PATH2 = resolveHelperPath(
      dirname9(fileURLToPath6(import.meta.url))
    );
    StateTransitionDeniedError = class extends Error {
      from;
      to;
      role;
      reason;
      recovery;
      constructor(opts) {
        const msg = `state transition denied: ${opts.from} \u2192 ${opts.to} as role=${opts.role}: ` + opts.reason;
        super(msg);
        this.name = "StateTransitionDeniedError";
        this.from = opts.from;
        this.to = opts.to;
        this.role = opts.role;
        this.reason = opts.reason;
        if (opts.recovery !== void 0) this.recovery = opts.recovery;
      }
    };
    LEGACY_STATUS_RECOVERY = {
      "merge-ready": "legacy pre-PR state \u2014 current canon is `approved` (ADR-0016 \xA7B). Migration: \u0432\u0440\u0443\u0447\u043D\u0443\u044E replace \u0432 sprint-status.yaml or run `tds story reset --story=<id> --to=halted --as=auditor` \u0437\u0430\u0442\u0435\u043C halted \u2192 ready-for-dev \u2192 \u2026 \u2192 review \u2192 approved.",
      "in-review": "legacy post-PR state \u2014 current canon collapses post-merge sync into `approved \u2192 done` via deliver. Migration: same as merge-ready.",
      "ready-for-review": "legacy pre-verdict alias \u2014 current canon is `review` (specialist flips in-progress \u2192 review; auditor \u0437\u0430\u0442\u0435\u043C review \u2192 approved). Migration: rename status to `review` \u0432 sprint-status.yaml."
    };
  }
});

// src/state/set.ts
var set_exports = {};
__export(set_exports, {
  StateTransitionDeniedError: () => StateTransitionDeniedError,
  setSprintStatusByKey: () => setSprintStatusByKey,
  stateSet: () => stateSet
});
async function stateSet(opts) {
  const transitionOpts = {
    sprintStatusPath: opts.sprintStatusPath,
    storyId: opts.storyId,
    newStatus: opts.newStatus,
    role: opts.transitionBy,
    viaCommand: "tds state set",
    telemetryDir: opts.telemetryDir,
    ...opts.storyMdPath !== void 0 ? { storyMdPath: opts.storyMdPath } : {},
    ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {},
    ...opts.touchTimestamp !== void 0 ? { touchTimestamp: opts.touchTimestamp } : {},
    ...opts.stateManifestPath !== void 0 ? { stateManifestPath: opts.stateManifestPath } : {},
    ...opts.projectRoot !== void 0 ? { projectRoot: opts.projectRoot } : {},
    ...opts.kind !== void 0 ? { kind: opts.kind } : {}
  };
  const r = await applyStateTransition(transitionOpts);
  return {
    storyId: r.storyId,
    stateBefore: r.stateBefore,
    stateAfter: r.stateAfter,
    storyMdUpdated: r.storyMdUpdated,
    ...r.storyMdSkipped !== void 0 ? { storyMdSkipped: r.storyMdSkipped } : {}
  };
}
async function setSprintStatusByKey(opts) {
  const effectiveKind = opts.kind ?? (opts.extensionPath !== void 0 ? classifyEntityKind(opts.storyId, opts.extensionPath) : void 0);
  const transitionOpts = {
    sprintStatusPath: opts.sprintStatusPath,
    storyId: opts.storyId,
    newStatus: opts.newStatus,
    role: opts.triggeredBy ?? "unknown",
    viaCommand: opts.viaCommand ?? "tds (helper:setSprintStatusByKey)",
    ...opts.telemetryDir !== void 0 ? { telemetryDir: opts.telemetryDir } : {},
    ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {},
    ...opts.appendIfMissing !== void 0 ? { appendIfMissing: opts.appendIfMissing } : {},
    ...opts.touchTimestamp !== void 0 ? { touchTimestamp: opts.touchTimestamp } : {},
    ...opts.stateManifestPath !== void 0 ? { stateManifestPath: opts.stateManifestPath } : {},
    ...opts.projectRoot !== void 0 ? { projectRoot: opts.projectRoot } : {},
    ...effectiveKind !== void 0 ? { kind: effectiveKind } : {}
  };
  await applyStateTransition(transitionOpts);
}
var init_set = __esm({
  "src/state/set.ts"() {
    "use strict";
    init_apply_transition();
    init_sprint_status();
    init_apply_transition();
  }
});

// src/review/apply-verdict.ts
var apply_verdict_exports = {};
__export(apply_verdict_exports, {
  applyVerdict: () => applyVerdict
});
import { existsSync as existsSync24 } from "node:fs";
import { join as join13 } from "node:path";
function resolveStoryIds(scope, sprintStatusPath, extensionPath) {
  if (scope.kind === "story") return [scope.id];
  const doc = readSprintStatus(
    extensionPath !== void 0 ? { sprintStatusPath, extensionPath } : { sprintStatusPath }
  );
  const stories = doc.storiesByEpic.get(scope.id) ?? [];
  if (stories.length === 0) {
    throw new Error(
      `apply-verdict: no stories found for epic '${scope.id}' in sprint-status.yaml` + (doc.unrecognizedKeys.length > 0 ? ` (${doc.unrecognizedKeys.length} unrecognized keys \u2014 run \`tds setup bootstrap-parents\`)` : "")
    );
  }
  return stories.map((e) => e.key);
}
function analyseStory(storyId, storiesDir, sprintStatus) {
  const specPath = join13(storiesDir, `${storyId}.md`);
  const statusBefore = sprintStatus.byKey.get(storyId)?.status ?? null;
  if (!existsSync24(specPath)) {
    return {
      story_id: storyId,
      latestRound: null,
      blockerCount: 0,
      statusBefore,
      flipped: false,
      alreadyRework: statusBefore === "rework",
      skipReason: "spec-not-found"
    };
  }
  const spec = readStorySpec(specPath);
  if (spec === null) {
    return {
      story_id: storyId,
      latestRound: null,
      blockerCount: 0,
      statusBefore,
      flipped: false,
      alreadyRework: statusBefore === "rework",
      skipReason: "spec-not-found"
    };
  }
  const findings = readAuditorFindings(spec);
  const latestRound = findings.length === 0 ? null : findings.reduce((max, f) => f.round > max ? f.round : max, 0);
  const blockerCount = findings.filter(
    (f) => f.severity === "blocker" && f.bridgedTo === void 0 && f.resolved === void 0
  ).length;
  return {
    story_id: storyId,
    latestRound,
    blockerCount,
    statusBefore,
    flipped: false,
    alreadyRework: statusBefore === "rework"
  };
}
async function applyVerdict(opts) {
  const storyIds = resolveStoryIds(
    opts.scope,
    opts.sprintStatusPath,
    opts.extensionPath
  );
  const sprint = readSprintStatus(
    opts.extensionPath !== void 0 ? {
      sprintStatusPath: opts.sprintStatusPath,
      extensionPath: opts.extensionPath
    } : { sprintStatusPath: opts.sprintStatusPath }
  );
  const reports = storyIds.map(
    (id) => analyseStory(id, opts.storiesDir, sprint)
  );
  for (const report of reports) {
    if (report.blockerCount === 0) continue;
    if (report.alreadyRework) continue;
    if (report.statusBefore !== null && !FLIPPABLE_STATUSES.has(report.statusBefore)) {
      report.skipReason = "non-flippable-status";
      continue;
    }
    if (report.statusBefore === null) {
      report.skipReason = "non-flippable-status";
      continue;
    }
    const specPath = join13(opts.storiesDir, `${report.story_id}.md`);
    if (!existsSync24(specPath)) {
      report.skipReason = "spec-not-found";
      continue;
    }
    const stateManifestPath = join13(opts.tdsStateDir, "state-manifest.yaml");
    const result = await applyStateTransition({
      sprintStatusPath: opts.sprintStatusPath,
      storyId: report.story_id,
      newStatus: "rework",
      role: "auditor",
      viaCommand: "tds review apply-verdict",
      telemetryDir: opts.telemetryDir,
      storyMdPath: specPath,
      stateManifestPath,
      projectRoot: opts.projectRoot,
      ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {}
    });
    if (!result.storyMdUpdated && result.storyMdSkipped !== void 0) {
      report.skipReason = "spec-not-found";
      continue;
    }
    report.flipped = true;
  }
  const flippedStoryIds = reports.filter((r) => r.flipped).map((r) => r.story_id);
  const totalBlockers = reports.reduce((n, r) => n + r.blockerCount, 0);
  const verdict = totalBlockers > 0 ? "changes-requested" : "approved";
  const flippedToApproved = [];
  if (verdict === "approved") {
    const stateManifestPath = join13(opts.tdsStateDir, "state-manifest.yaml");
    for (const report of reports) {
      if (report.statusBefore !== "review") continue;
      if (report.skipReason !== void 0) continue;
      const specPath = join13(opts.storiesDir, `${report.story_id}.md`);
      if (!existsSync24(specPath)) {
        report.skipReason = "spec-not-found";
        continue;
      }
      const result = await applyStateTransition({
        sprintStatusPath: opts.sprintStatusPath,
        storyId: report.story_id,
        newStatus: "approved",
        role: "auditor",
        viaCommand: "tds review apply-verdict",
        telemetryDir: opts.telemetryDir,
        storyMdPath: specPath,
        stateManifestPath,
        projectRoot: opts.projectRoot,
        ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {}
      });
      if (!result.storyMdUpdated && result.storyMdSkipped !== void 0) {
        report.skipReason = "spec-not-found";
        continue;
      }
      flippedToApproved.push(report.story_id);
    }
  }
  let epicFlippedToApproved = false;
  if (verdict === "approved" && opts.scope.kind === "epic") {
    const epicId = opts.scope.id;
    const epicStatusBefore = sprint.byKey.get(epicId)?.status ?? null;
    if (epicStatusBefore === "in-progress") {
      const stateManifestPath = join13(opts.tdsStateDir, "state-manifest.yaml");
      try {
        await applyStateTransition({
          sprintStatusPath: opts.sprintStatusPath,
          storyId: epicId,
          newStatus: "approved",
          role: "auditor",
          kind: "epic",
          viaCommand: "tds review apply-verdict",
          telemetryDir: opts.telemetryDir,
          stateManifestPath,
          projectRoot: opts.projectRoot,
          ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {}
        });
        epicFlippedToApproved = true;
      } catch {
      }
    }
  }
  let sweep = null;
  const totalFlips = flippedStoryIds.length + flippedToApproved.length + (epicFlippedToApproved ? 1 : 0);
  if (totalFlips > 0) {
    const segments = [];
    if (flippedStoryIds.length > 0) segments.push(`${flippedStoryIds.length}\u2192rework`);
    if (flippedToApproved.length > 0)
      segments.push(`${flippedToApproved.length}\u2192approved`);
    if (epicFlippedToApproved) segments.push(`epic\u2192approved`);
    sweep = sweepStateCommit({
      projectRoot: opts.projectRoot,
      tdsStateDir: opts.tdsStateDir,
      outputFolder: opts.outputFolder,
      message: `chore(${opts.scope.id}): apply-verdict \u2014 ${segments.join(" + ")}`,
      storyId: opts.scope.id
    });
  }
  try {
    const blockerCounts = {};
    for (const r of reports) blockerCounts[r.story_id] = r.blockerCount;
    await emit({
      telemetryDir: opts.telemetryDir,
      stream: "review-events",
      event: {
        kind: "verdict",
        scope_kind: opts.scope.kind,
        scope_id: opts.scope.id,
        verdict,
        flipped_story_ids: flippedStoryIds,
        flipped_to_approved: flippedToApproved,
        epic_flipped_to_approved: epicFlippedToApproved,
        blocker_counts: blockerCounts,
        total_blockers: totalBlockers,
        recorded_by: opts.triggeredBy
      }
    });
  } catch {
  }
  return {
    scope: opts.scope,
    verdict,
    perStory: reports,
    flippedStoryIds,
    flippedToApproved,
    epicFlippedToApproved,
    totalBlockers,
    sweep
  };
}
var FLIPPABLE_STATUSES;
var init_apply_verdict = __esm({
  "src/review/apply-verdict.ts"() {
    "use strict";
    init_story_spec();
    init_sprint_status();
    init_apply_transition();
    init_commit_sweep();
    init_emit();
    FLIPPABLE_STATUSES = /* @__PURE__ */ new Set(["review"]);
  }
});

// src/cli/dispatcher.ts
import { join as pathJoin18 } from "node:path";

// src/cli/shared.ts
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

// src/registry/error-codes.ts
var EXIT = {
  SUCCESS: 0,
  USAGE: 1,
  ENVIRONMENT: 2,
  PRECONDITION: 3,
  AUTHZ: 4,
  RUNTIME: 5,
  CONFLICT: 6,
  DEP_MISSING: 11,
  RECONCILE_DRIFT: 26,
  SNAPSHOT_CORRUPT: 27,
  CLASS_NOT_ALLOWED: 28,
  INSTALL_HALT: 41,
  ADAPTER_BOOTSTRAP: 42,
  MIGRATION_STEP: 44,
  MIGRATION_CHAIN: 45
};

// src/cli/shared.ts
function envelope(command, exitCode, result) {
  return {
    version: "1.0",
    command,
    exit_code: exitCode,
    result,
    warnings: [],
    errors: []
  };
}
function parseFlag(rest, name) {
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === `--${name}` && i + 1 < rest.length) return rest[i + 1];
    if (arg.startsWith(`--${name}=`)) return arg.slice(name.length + 3);
  }
  return void 0;
}
function parseDuration(input) {
  if (input === void 0) return null;
  const m = /^(\d+)(ms|s|m|h)?$/.exec(input.trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  switch (m[2]) {
    case "h":
      return n * 60 * 60 * 1e3;
    case "m":
      return n * 60 * 1e3;
    case "s":
      return n * 1e3;
    case "ms":
    case void 0:
      return n;
    default:
      return null;
  }
}
function parseFlagAll(rest, name) {
  const out = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === `--${name}` && i + 1 < rest.length) {
      out.push(rest[i + 1]);
      i++;
    } else if (arg.startsWith(`--${name}=`)) {
      out.push(arg.slice(name.length + 3));
    }
  }
  return out;
}
function isMember(arr, val) {
  return arr.includes(val ?? "");
}
function exhaustiveSwitch(_, domain) {
  throw new Error(`unreachable ${domain} switch case: ${String(_)}`);
}
function formatAuthzDeny(opts) {
  if (opts.role === "unknown") {
    return `${opts.command} requires --as=<role> (missing flag \u2192 role 'unknown' has no permissions). add --as=engineer (or another role with ${opts.op} permission)
`;
  }
  return `forbidden-quadrant: ${opts.role} \xD7 ${opts.op} = deny (${opts.reason})
`;
}
var PREFLIGHT_SUBCOMMANDS = ["check"];
var INTEGRITY_SUBCOMMANDS = [
  "record",
  "verify",
  "accept",
  "recover",
  "sweep"
];
var DOCTOR_SUBCOMMANDS = ["diagnose", "branch-orphans"];
var STATE_SUBCOMMANDS = ["get", "set"];
var MEMORY_SUBCOMMANDS = [
  "add",
  "list",
  "show",
  "query",
  "supersede",
  "tag",
  "candidates"
];
var BRANCH_SUBCOMMANDS = [
  "start",
  "attach",
  "info",
  "merge",
  "prune",
  "remove",
  "push",
  "sync"
];
var PR_SUBCOMMANDS = [
  "create",
  "update",
  "merge-status",
  "merge"
];
var ARCHIVE_SUBCOMMANDS = [
  "create",
  "list",
  "show",
  "verify"
];
var STORY_SUBCOMMANDS = [
  "update",
  "status",
  "add-finding",
  "add-findings",
  "resolve-finding",
  "unfreeze-tests",
  "reset"
];
var SETUP_SUBCOMMANDS = [
  "install",
  "init",
  "install-shim",
  "bootstrap-parents",
  "resolve-source"
];
var EPIC_SUBCOMMANDS = [
  "bridge",
  "create-bridge-from-retros"
];
var EPIC_BRIDGE_SUBCOMMANDS = [
  "list",
  "resolve",
  "validate-specs"
];
var REVIEW_SUBCOMMANDS = ["apply-verdict"];
var TEST_PATH_PATTERNS = [
  /(^|\/)test\//,
  /(^|\/)tests\//,
  /(^|\/)__tests__\//,
  /\.test\.[a-z0-9]+$/i,
  /\.spec\.[a-z0-9]+$/i,
  /_test\.go$/i,
  /(^|\/)test_[^/]*\.py$/i,
  /\.bats$/i
];
function isTestFilePath(path) {
  const norm = path.replace(/\\/g, "/");
  return TEST_PATH_PATTERNS.some((re) => re.test(norm));
}
var __dirname_shared = dirname(fileURLToPath(import.meta.url));
var SPEC_MATRIX_PATH = true ? resolvePath(__dirname_shared, "forbidden-quadrant.matrix.yaml") : resolvePath(
  __dirname_shared,
  "../../_docs/spec/matrix/forbidden-quadrant.matrix.yaml"
);
var USAGE = "usage: tds <subcommand> [args] [--json] [--as=<role>]\n  global flags:\n    --as=<role>    declared role for this invocation (required for any\n                   mutating subcommand; missing \u2192 unknown \u2192 deny)\n    --json         emit JSON envelope (most subcommands)\n  subcommands:\n    version\n    preflight check --action=<install|story-execute|epic-execute|archive-phase|migrate>\n    orient [--scope=full|blockers]\n    doctor diagnose\n    doctor branch-orphans\n    integrity record --files=<path,path,...> [--reason=<text>]\n    integrity verify\n    integrity accept --files=<path,path,...> --reason=<text>\n    integrity recover --strategy=<trust-classI|restore-from-archive|prompt> --reason=<text> [--archive-root=<path>]\n    state get --story=<id>\n    state set --story=<id> --status=<status>\n    state-commit [-m <msg>] [--story=<id>] [--paths=<p1,p2,...>] [--dry-run]\n                                                          (workflow-level sweep \u2014 auto-collects dirty TDS-managed paths via git status,\n                                                           one aggregate commit; skills invoke at end of logical unit of work;\n                                                           idempotent + never-throws; --story sets Story-Id trailer (default chore-tds-internal))\n    memory add --category=<technical|process|tooling|communication> --severity=<high|medium|low> --summary=<text> [--lesson=<text>] [--avoid-pattern=<text>] [--preferred-pattern=<text>] [--tags=<t1,t2>] [--story-refs=<id1,id2>] [--during-retro=<id>]\n    memory list [--category=<x>] [--severity=<x>] [--tags=<t1,t2>] [--status=<active|superseded>] [--limit=<n>]\n    memory show <lesson-id>\n    memory query --story=<id> [--story-tags=<t1,t2>] [--primary-specialist=<role>] [--severity-min=<high|medium|low>] [--top=<n>]\n    memory supersede <old-id> --by=<new-id> --reason=<text>\n    memory tag <lesson-id> [--add=<t1,t2>] [--remove=<t3>]\n    memory candidates [--since=<iso>] [--until=<iso>] [--min-occurrences=<n>]\n    branch start (--story=<id> | --epic=<id>) [--name=<branch>] [--base=<branch>] [--epic=<id>]\n                                                          (story-branch when --story; epic-integration branch when --epic only;\n                                                           --name auto-derives to story/<id> or epic/<slug> when omitted)\n    branch attach (--story=<id> | --epic=<id>) [--branch=<name>] [--base=<branch>] [--notes=<text>]\n                                                          (adopt existing git branch into registry; epic-only mode for epic-integration branches)\n    branch info [--branch=<name>]\n    branch remove --branch=<name> [--delete-local]\n    branch prune [--epic=<id>]                              (bulk-remove status=merged entries; optionally scoped to one epic)\n    branch merge --story=<id> --target=<branch> --message=<text> [--no-delete-source]\n                                                          (squash-merge story_branch \u2192 target; e.g. story \u2192 epic_branch)\n    branch push --safe                                       (force-with-lease only; --safe required)\n    branch sync                                              (git pull --rebase; halt on conflict)\n    commit --story=<id> [--task-id=<id>] -m <msg> -- <path> [<path> ...]\n    pr create --story=<id> --branch=<name> --base=<branch> --title=<text> --body=<text> [--draft]\n    pr update --branch=<name> [--title=<text>] [--body=<text>]\n    pr merge-status --branch=<name>\n    pr merge --branch=<name>                                  (squash; refuses if not mergeable)\n    deliver --epic=<id> --epic-branch=<name> [--default-branch=<name>] --title=<text> --body=<text> [--no-auto-merge] [--poll-timeout=<30m|1h|...>]\n                                                          (atomic: push + PR (idempotent \u043D\u0430 existing) + squash + sprint-status flips + branch cleanup;\n                                                           auto-merge default true; \u043D\u0430 GitLab CI-async \u2014 poll-loop \u043F\u043E\u043A\u0430 merge \u043D\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0441\u044F, default 30m)\n    sync                                                      (post-merge reconcile registry vs host)\n    revert-story --story=<id> --target=<commit> [--base=<branch>] [--branch-name=<name>]\n    epic bridge list [--blocks=<epic-id>] [--type=<x>] [--status=<backlog|in-progress|done>]\n    epic bridge resolve <bridge-id> --outcome=<text>\n    epic bridge validate-specs --bridge=<bridge-id> [--json]\n                                                          (readiness gate: fails when any bridge story stub still carries TBD AC/Tasks placeholders;\n                                                           exit=2 \u043D\u0430 NOT ready, exit=0 \u043D\u0430 ready; bridge-scoped \u2014 `/bmad-tds-execute-epic <bridge-id>` preflight)\n    epic create-bridge-from-retros --blocks=<epic-id> (--retros=<path1,path2,...> | --all-unprocessed) [--type=<x>] [--dry-run]\n                                                          (curated bridge \u044D\u043F\u0438\u043A \u0438\u0437 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u043D\u044B\u0445 `## Bridge Plan` \u0441\u0435\u043A\u0446\u0438\u0439 retro-md'\u043E\u0432; pre-epic flow)\n    review apply-verdict (--epic=<id> | --story=<id>) --as=engineer [--json]\n                                                          (post-auditor: counts unresolved blocker findings across ALL rounds \u2014 excluding entries marked `Resolved:` or `Bridged to:` \u2014 \n                                                           \u2192 flip review\u2192approved when zero, OR review\u2192rework + sweep + emit kind=verdict when \u22651)\n    story update --story=<id> [--status=<x>] [--task-complete=<label>]+ [--subtask-complete=<fragment>]+ [--completion-note=<text>]+ [--file-list-add=<path>]+\n                                                          (mutates spec markdown + optionally flips sprint-status; --task-complete cascades subtasks;\n                                                           --subtask-complete granular for partial completion; --as=<role> required)\n    story status --story=<id>                              (aggregate: spec status + sprint-status + branches + tasks done/total)\n    story status --epic=<id>                               (bulk: per-story records \u043E\u0434\u043D\u043E\u0433\u043E \u044D\u043F\u0438\u043A\u0430 \u043F\u043E\u0434 \u043E\u0434\u043D\u0438\u043C envelope \u2014 single permission match)\n    story add-finding --story=<id> --severity=<blocker|warn|info> --category=<text> --finding=<text> [--suggested-fix=<text>] [--suggested-bridge=<short-desc>] --as=auditor\n                                                          (auditor verdict writeback into spec ## Auditor Findings section; auto round-N increment)\n    story add-findings --findings-file=<path.yaml> --as=auditor\n                                                          (BATCH writeback for whole review session \u2014 array of findings \u0432 YAML, one CLI call \u2192 \u043E\u0434\u0438\u043D permission popup;\n                                                           emits per-finding review-events + aggregate summary event; preferred over per-finding add-finding \u0432 bulk reviews)\n    archive create --phase=<name> --description=<text> [--epics=<id1,id2>]\n    archive list\n    archive show --phase=<name>\n    archive verify --phase=<name>\n    setup install [--profile=full|lite]                       (full bootstrap: drop runtime + host configs + state + hooks; idempotent)\n    setup init [--profile=full|lite]                          (state init + hooks only; advanced/repair use)\n    setup install-shim [--target=<path>]                       (one-time global: write walk-up dispatcher to ~/.local/bin/tds; idempotent)\n    setup resolve-source [--json]                              (read _bmad/_config/manifest.yaml, locate the TDS source bundle \u2014\n                                                                local path or BMAD custom-modules cache; phase-2 bootstrap helper)\n";

// src/version/index.ts
import { readFileSync } from "node:fs";
import { dirname as dirname2, resolve } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var __dirname = dirname2(fileURLToPath2(import.meta.url));
var repoRoot = resolve(__dirname, "../..");
function readModuleVersion() {
  if (true) {
    return "6.5.31";
  }
  const pkg = JSON.parse(
    readFileSync(resolve(repoRoot, "package.json"), "utf8")
  );
  return pkg.version;
}
var SCHEMA_VERSIONS = {
  state_manifest: "1.0",
  branch_registry: "1.0",
  lessons: "1.0",
  archive_manifest: "1.0",
  story_frontmatter: "1.0",
  claim_index: "1.0"
};
function readBundleSha256() {
  return "unbundled";
}
function buildVersionInfo() {
  return {
    module_version: readModuleVersion(),
    bundle_sha256: readBundleSha256(),
    schema_versions: SCHEMA_VERSIONS
  };
}

// src/cli/handlers/version.ts
function handleVersion(wantJson) {
  const info = buildVersionInfo();
  const env = envelope("version", EXIT.SUCCESS, info);
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : `tds ${info.module_version}
`,
    stderr: ""
  };
}

// src/paths/resolver.ts
var import_yaml = __toESM(require_dist(), 1);
import { readFileSync as readFileSync2, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname as dirname3, join, resolve as resolvePath2, sep } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
var TdsPathError = class extends Error {
  cause;
  constructor(message, cause) {
    super(message);
    this.name = "TdsPathError";
    if (cause !== void 0) this.cause = cause;
  }
};
function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
function findProjectRootFrom(start) {
  let dir = start;
  for (let i = 0; i < 64; i++) {
    if (isDir(join(dir, "_bmad", "bmm"))) return dir;
    const parent = dirname3(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}
function detectProjectRoot() {
  const fromCwd = findProjectRootFrom(process.cwd());
  if (fromCwd) return fromCwd;
  const bundled = true;
  if (bundled) {
    try {
      const here = dirname3(fileURLToPath3(import.meta.url));
      const fromBundle = findProjectRootFrom(resolvePath2(here, "../../.."));
      if (fromBundle) return fromBundle;
    } catch {
    }
  }
  try {
    return execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (err) {
    throw new TdsPathError(
      `Failed to detect project root. Tried walking up from cwd (${process.cwd()}) and from the bundle location, then \`git rev-parse\`. Pass \`projectRoot\` explicitly or invoke from inside an installed BMAD project tree.`,
      err
    );
  }
}
function readOutputFolder(bmadDir) {
  const configPath = join(bmadDir, "bmm", "config.yaml");
  if (!existsSync(configPath)) {
    throw new TdsPathError(
      `Missing _bmad/bmm/config.yaml at ${configPath}. Run \`bmad install\` to bootstrap BMAD before invoking TDS.`
    );
  }
  let parsed = {};
  try {
    parsed = (0, import_yaml.parse)(readFileSync2(configPath, "utf8")) ?? {};
  } catch (err) {
    throw new TdsPathError(
      `_bmad/bmm/config.yaml is not valid YAML: ${err.message}`,
      err
    );
  }
  const out = parsed.output_folder;
  if (typeof out === "string" && out.length > 0) {
    return out.replace(/^\{project-root\}\/+/, "");
  }
  return "_bmad-output";
}
async function resolveTdsPaths(opts = {}) {
  const projectRoot = opts.projectRoot ?? detectProjectRoot();
  const bmadDir = join(projectRoot, "_bmad");
  const tdsPackageDir = join(bmadDir, "tds");
  const customDir = join(bmadDir, "custom");
  const outputFolderRel = readOutputFolder(bmadDir);
  const outputFolder = resolvePath2(projectRoot, outputFolderRel);
  const projectRootResolved = resolvePath2(projectRoot);
  if (outputFolder !== projectRootResolved && !outputFolder.startsWith(projectRootResolved + sep)) {
    throw new TdsPathError(
      `output_folder (${outputFolderRel}) resolves outside the project root (${projectRootResolved}). Edit \`_bmad/bmm/config.yaml\` so output_folder is project-relative \u0438 \u043D\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \`..\` exits \u0438 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D absolute path \u0432\u043D\u0435 project tree.`
    );
  }
  const tdsStateDir = join(outputFolder, "_tds");
  return {
    projectRoot,
    bmadDir,
    tdsPackageDir,
    customDir,
    outputFolder,
    tdsStateDir,
    stateManifestYaml: join(tdsStateDir, "state-manifest.yaml"),
    branchRegistryYaml: join(tdsStateDir, "branch-registry.yaml"),
    runtimeDir: join(tdsStateDir, "runtime"),
    sprintStatusYaml: resolveSprintStatusPath(bmadDir, outputFolder)
  };
}
function resolveSprintStatusPath(_bmadDir, outputFolder) {
  return join(outputFolder, "implementation-artifacts", "sprint-status.yaml");
}

// src/preflight/check.ts
init_emit();
init_helper();
import { spawnSync as spawnSync6 } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { dirname as dirname4, join as join3 } from "node:path";
import { fileURLToPath as fileURLToPath4 } from "node:url";

// src/host/detect.ts
import { spawnSync as spawnSync3 } from "node:child_process";

// src/host/github.ts
import { spawnSync } from "node:child_process";

// src/host/parse.ts
var GITLAB_TRANSITIONAL = /* @__PURE__ */ new Set([
  "checking",
  "ci_still_running",
  "ci_must_pass",
  "approvals_syncing",
  "preparing",
  "unchecked"
]);
var GITLAB_LEGACY_TRANSITIONAL = /* @__PURE__ */ new Set(["unchecked", "checking"]);
var GITHUB_TRANSITIONAL = /* @__PURE__ */ new Set(["BLOCKED", "UNSTABLE", "BEHIND", "UNKNOWN"]);
var GITHUB_READY = /* @__PURE__ */ new Set(["CLEAN", "HAS_HOOKS"]);
var GITLAB_PIPELINE_TERMINAL_FAIL = /* @__PURE__ */ new Set(["failed", "canceled"]);
var GITHUB_CHECK_TERMINAL_FAIL = /* @__PURE__ */ new Set([
  "FAILURE",
  "CANCELLED",
  "TIMED_OUT",
  "ACTION_REQUIRED"
]);
var GITLAB_STATE_MAP = {
  opened: "open",
  merged: "merged",
  closed: "closed",
  locked: "closed"
};
var GITHUB_STATE_MAP = {
  OPEN: "open",
  MERGED: "merged",
  CLOSED: "closed"
};
function parseGitlab(raw) {
  const detailed = raw.detailed_merge_status;
  const legacy = raw.merge_status ?? void 0;
  let mergeable = false;
  let transitional = false;
  let blockedBy = null;
  if (detailed !== void 0) {
    if (detailed === "mergeable") {
      mergeable = true;
    } else if (GITLAB_TRANSITIONAL.has(detailed)) {
      const hp = raw.head_pipeline;
      if (hp?.source === "merge_request_event" && hp.status !== void 0 && GITLAB_PIPELINE_TERMINAL_FAIL.has(hp.status)) {
        blockedBy = `head_pipeline_${hp.status}`;
      } else {
        transitional = true;
        blockedBy = detailed;
      }
    } else {
      blockedBy = detailed;
    }
  } else if (legacy !== void 0) {
    if (legacy === "can_be_merged") {
      mergeable = true;
    } else if (GITLAB_LEGACY_TRANSITIONAL.has(legacy)) {
      transitional = true;
      blockedBy = legacy;
    } else {
      blockedBy = legacy;
    }
  } else {
    transitional = true;
    blockedBy = "UNKNOWN";
  }
  const seen = /* @__PURE__ */ new Set();
  const reviewers = [];
  for (const a of raw.approved_by ?? []) {
    const handle = a.user?.username;
    if (handle && !seen.has(handle)) {
      seen.add(handle);
      reviewers.push(handle);
    }
  }
  const state = GITLAB_STATE_MAP[raw.state ?? ""];
  const finalSha = raw.squash_commit_sha ?? raw.merge_commit_sha;
  return {
    mergeable,
    transitional,
    ciState: detailed ?? raw.pipeline?.status ?? "UNKNOWN",
    approvals: raw.upvotes ?? 0,
    blockedBy,
    reviewers,
    ...state !== void 0 ? { state } : {},
    ...finalSha !== void 0 ? { mergeCommitSha: finalSha } : {}
  };
}
function parseGithub(raw) {
  const mss = raw.mergeStateStatus;
  const conflicts = raw.mergeable === "CONFLICTING";
  const unknownConflicts = raw.mergeable === "UNKNOWN";
  let mergeable = false;
  let transitional = false;
  let blockedBy = null;
  if (conflicts) {
    blockedBy = mss ?? "CONFLICTING";
  } else if (unknownConflicts) {
    transitional = true;
    blockedBy = mss ?? "UNKNOWN";
  } else if (mss !== void 0 && GITHUB_READY.has(mss)) {
    mergeable = true;
  } else if (mss !== void 0 && GITHUB_TRANSITIONAL.has(mss)) {
    const failedCheck = (raw.statusCheckRollup ?? []).find(
      (c) => c.conclusion !== void 0 && GITHUB_CHECK_TERMINAL_FAIL.has(c.conclusion)
    );
    if (failedCheck) {
      blockedBy = `status_check_${failedCheck.conclusion.toLowerCase()}`;
    } else {
      transitional = true;
      blockedBy = mss;
    }
  } else {
    blockedBy = mss ?? "UNKNOWN";
  }
  const approvedReviews = (raw.reviews ?? []).filter(
    (rv) => rv.state === "APPROVED"
  );
  const seen = /* @__PURE__ */ new Set();
  const reviewers = [];
  for (const rv of approvedReviews) {
    const handle = rv.author?.login;
    if (handle && !seen.has(handle)) {
      seen.add(handle);
      reviewers.push(handle);
    }
  }
  const state = GITHUB_STATE_MAP[raw.state ?? ""];
  return {
    mergeable,
    transitional,
    ciState: mss ?? "UNKNOWN",
    approvals: approvedReviews.length,
    blockedBy,
    reviewers,
    ...state !== void 0 ? { state } : {},
    ...raw.mergeCommit?.oid !== void 0 ? { mergeCommitSha: raw.mergeCommit.oid } : {}
  };
}

// src/host/retry.ts
function defaultSleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
async function retryOnTransient(fn, opts) {
  const sleep = opts.sleep ?? defaultSleep;
  let lastErr;
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const fatal = !opts.isTransient(err);
      const exhausted = attempt === opts.maxAttempts;
      if (fatal || exhausted) throw err;
      await sleep(opts.delayMsForAttempt(attempt));
    }
  }
  throw lastErr ?? new Error("retryOnTransient: maxAttempts must be \u2265 1");
}
var TRANSIENT_RE = /\b(405|409|502|503)\b|\bMethod Not Allowed\b|\bBad Gateway\b|\bService Unavailable\b|\bconnection reset\b|\bupstream connect error\b/i;
function isTransientStderr(stderr) {
  if (typeof stderr !== "string" || stderr.length === 0) return false;
  return TRANSIENT_RE.test(stderr);
}

// src/host/github.ts
var GhCliError = class extends Error {
  constructor(message, exitCode, stderr) {
    super(message);
    this.exitCode = exitCode;
    this.stderr = stderr;
    this.name = "GhCliError";
  }
  exitCode;
  stderr;
  cause;
};
function run(args, ctx, stdin) {
  const bin = ctx.binPath ?? "gh";
  const r = spawnSync(bin, args, {
    cwd: ctx.projectRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...stdin !== void 0 ? { input: stdin } : {}
  });
  if (r.error) {
    throw new GhCliError(
      `${bin} ${args.join(" ")}: spawn failed (${r.error.message})`,
      127,
      ""
    );
  }
  if (r.status !== 0) {
    throw new GhCliError(
      `${bin} ${args.join(" ")}: exit ${r.status} \u2014 ${r.stderr.trim()}`,
      r.status ?? 1,
      r.stderr
    );
  }
  return { stdout: r.stdout, stderr: r.stderr };
}
var GitHubAdapter = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  ctx;
  id = "github";
  async createPR(opts) {
    const args = [
      "pr",
      "create",
      "--head",
      opts.head,
      "--base",
      opts.base,
      "--title",
      opts.title,
      "--body",
      opts.body
    ];
    if (opts.draft) args.push("--draft");
    const r = run(args, this.ctx);
    const url = r.stdout.trim().split("\n").pop() ?? "";
    const numMatch = url.match(/\/pull\/(\d+)$/);
    if (!numMatch) {
      throw new GhCliError(
        `gh pr create returned non-URL stdout: ${r.stdout.trim()}`,
        5,
        r.stderr
      );
    }
    return { url, number: Number(numMatch[1]) };
  }
  async updatePR(opts) {
    const args = ["pr", "edit", String(opts.number)];
    if (opts.title !== void 0) {
      args.push("--title", opts.title);
    }
    if (opts.body !== void 0) {
      args.push("--body", opts.body);
    }
    const r = run(args, this.ctx);
    const url = r.stdout.trim().split("\n").pop() ?? "";
    return { url, updated: true };
  }
  async getStatus(prNumber) {
    const fields = "mergeable,mergeStateStatus,reviewDecision,reviews,state,mergeCommit,statusCheckRollup";
    const r = run(
      ["pr", "view", String(prNumber), "--json", fields],
      this.ctx
    );
    return parseGithub(JSON.parse(r.stdout));
  }
  async squashMerge(prNumber) {
    await retryOnTransient(
      async () => {
        run(
          [
            "pr",
            "merge",
            String(prNumber),
            "--auto",
            "--squash",
            "--delete-branch=false"
          ],
          this.ctx
        );
      },
      {
        maxAttempts: 3,
        delayMsForAttempt: (a) => 5e3 * a,
        isTransient: (err) => err instanceof GhCliError && isTransientStderr(err.stderr)
      }
    );
    const view = run(
      ["pr", "view", String(prNumber), "--json", "mergeCommit,state"],
      this.ctx
    );
    const parsed = JSON.parse(view.stdout);
    const sha = parsed.mergeCommit?.oid;
    if (sha) {
      return { commitSha: sha, awaitingCi: false };
    }
    if (parsed.state === "OPEN") {
      return { commitSha: null, awaitingCi: true };
    }
    throw new GhCliError(
      `gh pr ${prNumber}: unexpected state '${parsed.state ?? "unknown"}' \u0431\u0435\u0437 mergeCommit.oid after merge attempt`,
      5,
      ""
    );
  }
  async closePR(prNumber) {
    run(["pr", "close", String(prNumber)], this.ctx);
  }
  async findPRForBranch(branch) {
    const r = run(
      ["pr", "list", "--head", branch, "--state", "open", "--json", "number,url", "--limit", "1"],
      this.ctx
    );
    let parsed;
    try {
      parsed = JSON.parse(r.stdout);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const first = parsed[0];
    if (typeof first.number !== "number" || typeof first.url !== "string") {
      return null;
    }
    return { number: first.number, url: first.url };
  }
};

// src/host/gitlab.ts
import { spawnSync as spawnSync2 } from "node:child_process";
var GlabCliError = class extends Error {
  constructor(message, exitCode, stderr) {
    super(message);
    this.exitCode = exitCode;
    this.stderr = stderr;
    this.name = "GlabCliError";
  }
  exitCode;
  stderr;
  cause;
};
function run2(args, ctx) {
  const bin = ctx.binPath ?? "glab";
  const r = spawnSync2(bin, args, {
    cwd: ctx.projectRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (r.error) {
    throw new GlabCliError(
      `${bin} ${args.join(" ")}: spawn failed (${r.error.message})`,
      127,
      ""
    );
  }
  if (r.status !== 0) {
    throw new GlabCliError(
      `${bin} ${args.join(" ")}: exit ${r.status} \u2014 ${r.stderr.trim()}`,
      r.status ?? 1,
      r.stderr
    );
  }
  return { stdout: r.stdout, stderr: r.stderr };
}
var GitLabAdapter = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  ctx;
  id = "gitlab";
  async createPR(opts) {
    const args = [
      "mr",
      "create",
      "--source-branch",
      opts.head,
      "--target-branch",
      opts.base,
      "--title",
      opts.title,
      "--description",
      opts.body,
      "--yes"
    ];
    if (opts.draft) args.push("--draft");
    const r = run2(args, this.ctx);
    const url = r.stdout.trim().split("\n").pop() ?? "";
    const numMatch = url.match(/\/merge_requests\/(\d+)$/);
    if (!numMatch) {
      throw new GlabCliError(
        `glab mr create returned non-URL stdout: ${r.stdout.trim()}`,
        5,
        r.stderr
      );
    }
    return { url, number: Number(numMatch[1]) };
  }
  async updatePR(opts) {
    const args = ["mr", "update", String(opts.number)];
    if (opts.title !== void 0) {
      args.push("--title", opts.title);
    }
    if (opts.body !== void 0) {
      args.push("--description", opts.body);
    }
    const r = run2(args, this.ctx);
    return { url: r.stdout.trim(), updated: true };
  }
  async getStatus(prNumber) {
    const r = run2(
      ["mr", "view", String(prNumber), "-F", "json"],
      this.ctx
    );
    return parseGitlab(JSON.parse(r.stdout));
  }
  async squashMerge(prNumber) {
    await retryOnTransient(
      async () => {
        run2(["mr", "merge", String(prNumber), "--squash", "--yes"], this.ctx);
      },
      {
        maxAttempts: 3,
        delayMsForAttempt: (a) => 5e3 * a,
        isTransient: (err) => err instanceof GlabCliError && isTransientStderr(err.stderr)
      }
    );
    const view = run2(
      ["mr", "view", String(prNumber), "-F", "json"],
      this.ctx
    );
    const parsed = JSON.parse(view.stdout);
    const sha = parsed.squash_commit_sha ?? parsed.merge_commit_sha;
    if (sha) {
      return { commitSha: sha, awaitingCi: false };
    }
    if (parsed.state === "opened") {
      return { commitSha: null, awaitingCi: true };
    }
    throw new GlabCliError(
      `glab mr ${prNumber}: unexpected state '${parsed.state ?? "unknown"}' \u0431\u0435\u0437 commit sha after merge attempt`,
      5,
      ""
    );
  }
  async closePR(prNumber) {
    run2(["mr", "close", String(prNumber), "--yes"], this.ctx);
  }
  async findPRForBranch(branch) {
    const r = run2(
      ["mr", "list", "--source-branch", branch, "-F", "json"],
      this.ctx
    );
    let parsed;
    try {
      parsed = JSON.parse(r.stdout);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const first = parsed[0];
    if (typeof first.iid !== "number" || typeof first.web_url !== "string") {
      return null;
    }
    return { number: first.iid, url: first.web_url };
  }
};

// src/host/detect.ts
function readRemoteUrl(projectRoot) {
  const r = spawnSync3("git", ["config", "--get", "remote.origin.url"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (r.status !== 0) return null;
  return r.stdout.trim() || null;
}
function classifyByUrl(url) {
  if (/(?:^|@|\/\/)github\.com[:\/]/i.test(url)) return "github";
  if (/(?:^|@|\/\/)gitlab\.com[:\/]/i.test(url)) return "gitlab";
  if (/github\./i.test(url)) return "github";
  if (/gitlab\./i.test(url)) return "gitlab";
  return null;
}
function which(bin) {
  const r = spawnSync3(process.platform === "win32" ? "where" : "which", [bin], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return r.status === 0;
}
function detectAdapter(opts) {
  const ctx = { projectRoot: opts.projectRoot };
  const url = opts.remoteUrl ?? readRemoteUrl(opts.projectRoot);
  if (url) {
    const kind = classifyByUrl(url);
    if (kind === "github") return new GitHubAdapter(ctx);
    if (kind === "gitlab") return new GitLabAdapter(ctx);
  }
  const hasGh = which("gh");
  const hasGlab = which("glab");
  if (hasGh) return new GitHubAdapter(ctx);
  if (hasGlab) return new GitLabAdapter(ctx);
  throw new Error(
    "no host adapter available \u2014 install `gh` (GitHub) or `glab` (GitLab) and ensure `git remote.origin.url` points at a recognised host"
  );
}

// src/preflight/check.ts
init_commit_sweep();
function checkBinary(bin, args, id, parser) {
  const r = spawnSync6(bin, args, { encoding: "utf8" });
  if (r.error || r.status !== 0) {
    return {
      id,
      status: "fail",
      message: `${bin} not found or exited non-zero (${r.error?.message ?? r.stderr ?? "no detail"})`
    };
  }
  const status = parser ? parser(r.stdout) ?? "pass" : "pass";
  return { id, status, message: r.stdout.trim() };
}
function checkNode() {
  const major = Number(process.versions.node.split(".")[0]);
  if (Number.isNaN(major) || major < 22) {
    return {
      id: "node",
      status: "fail",
      message: `node ${process.versions.node} (need \u2265 22; Wave 1 spec \xA70.3)`
    };
  }
  return {
    id: "node",
    status: "pass",
    message: `node ${process.versions.node}`
  };
}
function checkGit() {
  return checkBinary("git", ["--version"], "git");
}
function checkPythonRuamel() {
  const r = spawnSync6(
    "python3",
    [
      "-c",
      "import sys, ruamel.yaml; assert sys.version_info >= (3,10), 'py<3.10'; v = ruamel.yaml.version_info; assert v >= (0,18,0), f'ruamel<0.18:{v}'; print(f'python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} + ruamel.yaml {v[0]}.{v[1]}.{v[2]}')"
    ],
    { encoding: "utf8" }
  );
  if (r.error || r.status !== 0) {
    return {
      id: "python-ruamel",
      status: "fail",
      message: "python3 \u2265 3.10 + ruamel.yaml \u2265 0.18 required (ADR-0010, RB-08). " + (r.stderr?.trim() ?? r.error?.message ?? "")
    };
  }
  return {
    id: "python-ruamel",
    status: "pass",
    message: r.stdout.trim()
  };
}
function checkPythonHelper() {
  const here = dirname4(fileURLToPath4(import.meta.url));
  const path = resolveHelperPath(here);
  if (!existsSync2(path)) {
    return {
      id: "python-helper",
      status: "fail",
      message: `${HELPER_BASENAME} not found at ${path} \u2014 TDS payload incomplete (re-run \`bmad install --update\`; check antivirus on _bmad/ path).`
    };
  }
  return { id: "python-helper", status: "pass", message: path };
}
function checkBmadResolveScript(projectRoot) {
  const p = join3(projectRoot, "_bmad", "scripts", "resolve_customization.py");
  if (!existsSync2(p)) {
    return {
      id: "bmad-resolve-script",
      status: "fail",
      message: `missing ${p} \u2014 run \`bmad install\` to bootstrap`
    };
  }
  return { id: "bmad-resolve-script", status: "pass", message: p };
}
function checkHostAdapter(projectRoot) {
  const url = readRemoteUrl(projectRoot);
  if (!url) {
    return {
      id: "host-adapter",
      status: "warn",
      message: "no `git remote.origin.url` configured \u2014 PR operations will be unavailable until you `git remote add origin <url>`."
    };
  }
  const kind = classifyByUrl(url);
  if (!kind) {
    return {
      id: "host-adapter",
      status: "warn",
      message: `remote URL ${url} doesn't match a known host (github.* / gitlab.*); PR operations may fail at runtime`
    };
  }
  const bin = kind === "github" ? "gh" : "glab";
  const installed = spawnSync6(bin, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (installed.status !== 0) {
    return {
      id: "host-adapter",
      status: "fail",
      message: `host=${kind} but \`${bin}\` not installed; ` + (kind === "github" ? "install via `brew install gh` / `apt install gh` / https://cli.github.com" : "install via `brew install glab` / https://gitlab.com/gitlab-org/cli")
    };
  }
  const authArgs = bin === "gh" ? ["auth", "status"] : ["auth", "status"];
  const auth = spawnSync6(bin, authArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (auth.status !== 0) {
    return {
      id: "host-adapter",
      status: "fail",
      message: `\`${bin}\` installed but not authenticated; run \`${bin} auth login\` before using PR operations (host=${kind}, remote=${url})`
    };
  }
  return {
    id: "host-adapter",
    status: "pass",
    message: `${kind} (${bin}) authenticated; remote=${url}`
  };
}
async function checkDirtyTdsState(projectRoot) {
  let paths;
  try {
    paths = await resolveTdsPaths({ projectRoot });
  } catch {
    return {
      id: "dirty-tds-state",
      status: "pass",
      message: "skipped (no BMAD tree)"
    };
  }
  const collected = collectDirtyTdsPaths({
    projectRoot,
    tdsStateDir: paths.tdsStateDir,
    outputFolder: paths.outputFolder
  });
  if (collected === null) {
    return {
      id: "dirty-tds-state",
      status: "pass",
      message: "skipped (not a git tree)"
    };
  }
  if (collected.paths.length === 0) {
    return {
      id: "dirty-tds-state",
      status: "pass",
      message: "TDS-managed paths clean"
    };
  }
  const preview = collected.paths.slice(0, 3).join(", ");
  const more = collected.paths.length > 3 ? ` (+${collected.paths.length - 3} more)` : "";
  return {
    id: "dirty-tds-state",
    status: "warn",
    message: `${collected.paths.length} TDS-managed path(s) uncommitted from prior session: ${preview}${more} \u2014 run \`tds state-commit --auto -m "<summary>" --as=<role>\` before starting new work to keep audit trail clean`
  };
}
function checkBmadConfigYaml(projectRoot) {
  const p = join3(projectRoot, "_bmad", "bmm", "config.yaml");
  if (!existsSync2(p)) {
    return {
      id: "bmad-config-yaml",
      status: "fail",
      message: `missing ${p} \u2014 run \`bmad install\` to bootstrap`
    };
  }
  return { id: "bmad-config-yaml", status: "pass", message: p };
}
var CHECKS_BY_ACTION = {
  install: async (root) => [
    checkNode(),
    checkGit(),
    checkPythonRuamel(),
    checkPythonHelper(),
    checkBmadResolveScript(root),
    checkBmadConfigYaml(root),
    checkHostAdapter(root)
  ],
  // Action-specific actions add `dirty-tds-state` warning — это actions
  // которые start новую logical unit of work, и user'у нужно знать что
  // от предыдущей session остались uncommitted state files (sweep gap).
  // `install` / `archive-phase` / `migrate` намеренно его не включают —
  // dirty inevitable / сами мутируют / special path.
  "story-execute": async (root) => [
    checkNode(),
    checkGit(),
    checkBmadConfigYaml(root),
    checkHostAdapter(root),
    await checkDirtyTdsState(root)
  ],
  "epic-execute": async (root) => [
    checkNode(),
    checkGit(),
    checkBmadConfigYaml(root),
    checkHostAdapter(root),
    await checkDirtyTdsState(root)
  ],
  // Mode 1 review preflight (`bmad-tds-code-review` Step 1, standalone
  // story). State-shape checks (story=review, branch pushed) делает
  // workflow-skill отдельно через `tds story status` — здесь только
  // baseline (Node/git/BMAD config/host-adapter), потому что review
  // вызывает `gh pr create` / `glab mr create`.
  "story-review": async (root) => [
    checkNode(),
    checkGit(),
    checkBmadConfigYaml(root),
    checkHostAdapter(root),
    await checkDirtyTdsState(root)
  ],
  // Mode 2 review preflight (cumulative epic). Same baseline — finalize
  // в конечном итоге дёргает `tds deliver` с git push + host PR
  // create + squash merge, поэтому host-adapter обязателен.
  "epic-finalize": async (root) => [
    checkNode(),
    checkGit(),
    checkBmadConfigYaml(root),
    checkHostAdapter(root),
    await checkDirtyTdsState(root)
  ],
  "archive-phase": async (root) => [
    checkNode(),
    checkGit(),
    checkBmadConfigYaml(root)
  ],
  migrate: async (root) => [
    checkNode(),
    checkBmadConfigYaml(root)
  ]
};
async function runPreflight(opts) {
  const factory = CHECKS_BY_ACTION[opts.action];
  if (!factory) {
    throw new Error(`unknown action: ${opts.action}`);
  }
  const checks = await factory(opts.projectRoot);
  const failed = checks.some((c) => c.status === "fail");
  const decision = failed ? "halt" : "go";
  const exitCode = failed ? EXIT.PRECONDITION : EXIT.SUCCESS;
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "preflight-events",
    event: {
      action: opts.action,
      decision,
      checks: checks.map((c) => ({ id: c.id, status: c.status }))
    }
  });
  return { action: opts.action, checks, decision, exitCode };
}

// src/cli/handlers/preflight.ts
async function handlePreflight(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(PREFLIGHT_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown preflight subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  void sub;
  const action = parseFlag(rest.slice(1), "action");
  if (!action) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "preflight check requires --action=<...>\n"
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const result = await runPreflight({
    action,
    projectRoot: paths.projectRoot,
    telemetryDir: `${paths.runtimeDir}/telemetry`
  });
  const env = envelope("preflight check", result.exitCode, {
    action: result.action,
    decision: result.decision,
    checks: result.checks
  });
  return {
    exitCode: result.exitCode,
    stdout: wantJson ? JSON.stringify(env) : `decision: ${result.decision}
` + result.checks.map((c) => `  [${c.status}] ${c.id}: ${c.message}`).join("\n") + "\n",
    stderr: ""
  };
}

// src/orient/orient.ts
var import_yaml2 = __toESM(require_dist(), 1);
import { readFileSync as readFileSync3, existsSync as existsSync3 } from "node:fs";
import { join as join4 } from "node:path";
function readBmmConfig(bmadDir) {
  const p = join4(bmadDir, "bmm", "config.yaml");
  if (!existsSync3(p)) return { projectName: "unknown", projectKey: "NOKEY" };
  try {
    const raw = (0, import_yaml2.parse)(readFileSync3(p, "utf8")) ?? {};
    return {
      projectName: typeof raw.project_name === "string" && raw.project_name.length > 0 ? raw.project_name : "unknown",
      projectKey: typeof raw.project_key === "string" && raw.project_key.length > 0 ? raw.project_key : "NOKEY"
    };
  } catch {
    return { projectName: "unknown", projectKey: "NOKEY" };
  }
}
function readProfile(stateManifestPath) {
  if (!existsSync3(stateManifestPath)) return "lite";
  try {
    const raw = (0, import_yaml2.parse)(readFileSync3(stateManifestPath, "utf8")) ?? {};
    const profile = raw.tds_meta?.profile;
    return profile === "full" ? "full" : "lite";
  } catch {
    return "lite";
  }
}
async function orient(opts) {
  const paths = await resolveTdsPaths(
    opts.projectRoot !== void 0 ? { projectRoot: opts.projectRoot } : {}
  );
  const { projectName, projectKey } = readBmmConfig(paths.bmadDir);
  const profile = readProfile(paths.stateManifestYaml);
  return {
    project: { name: projectName, key: projectKey, profile },
    current_epic: null,
    current_story: null,
    in_progress: [],
    halts: [],
    recent_lessons: [],
    next_action_suggestion: "Run `tds preflight check --action=install` to verify environment, then invoke the slash-skill `/bmad-tds-setup install --profile=lite` (or --profile=full) from your AI host to bootstrap."
  };
}

// src/cli/handlers/orient.ts
async function handleOrient(rest, wantJson) {
  const scopeFlag = parseFlag(rest, "scope") ?? "full";
  if (scopeFlag !== "full" && scopeFlag !== "blockers") {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `--scope must be one of full|blockers (got ${scopeFlag})
`
    };
  }
  try {
    const result = await orient({ scope: scopeFlag });
    const env = envelope("orient", EXIT.SUCCESS, result);
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : `${result.project.name} (${result.project.profile}) \u2014 ${result.next_action_suggestion}
`,
      stderr: ""
    };
  } catch (err) {
    return {
      exitCode: EXIT.RUNTIME,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
}

// src/doctor/diagnose.ts
import { existsSync as existsSync4 } from "node:fs";
import { join as join5 } from "node:path";
async function diagnose(opts = {}) {
  const paths = await resolveTdsPaths(
    opts.projectRoot !== void 0 ? { projectRoot: opts.projectRoot } : {}
  );
  const checks = [];
  if (existsSync4(paths.stateManifestYaml)) {
    checks.push({
      id: "state-manifest",
      status: "pass",
      message: paths.stateManifestYaml
    });
  } else {
    checks.push({
      id: "state-manifest",
      status: "warn",
      message: `${paths.stateManifestYaml} not found \u2014 invoke \`/bmad-tds-setup install\` from your AI host to bootstrap`
    });
  }
  const haltPath = join5(paths.runtimeDir, "halt.json");
  if (!existsSync4(haltPath)) {
    checks.push({
      id: "halt",
      status: "pass",
      message: "no active halt"
    });
  } else {
    checks.push({
      id: "halt",
      status: "fail",
      message: `active halt at ${haltPath} \u2014 see RB runbook for the failed action`
    });
  }
  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarn = checks.some((c) => c.status === "warn");
  const status = hasFail ? "halted" : hasWarn ? "degraded" : "ok";
  return { status, checks };
}

// src/branch/orphans.ts
init_git();
var import_yaml7 = __toESM(require_dist(), 1);
init_sprint_status();
import { readFileSync as readFileSync8, existsSync as existsSync9 } from "node:fs";
function readRegistryEntries(path) {
  if (!existsSync9(path)) return [];
  const parsed = (0, import_yaml7.parse)(readFileSync8(path, "utf8")) ?? {};
  return Array.isArray(parsed.branches) ? parsed.branches : [];
}
async function diagnoseOrphans(opts) {
  const localBranches = new Set(
    listLocalBranches({ cwd: opts.projectRoot })
  );
  const registryEntries = readRegistryEntries(opts.registryPath);
  const registryBranches = new Set(registryEntries.map((e) => e.branch));
  const orphanInGit = [];
  for (const b of localBranches) {
    if (b === "main" || b === "master" || b === "develop") continue;
    if (!registryBranches.has(b)) orphanInGit.push(b);
  }
  const orphanInRegistry = [];
  for (const e of registryEntries) {
    if (e.status !== "active") continue;
    if (!localBranches.has(e.branch)) orphanInRegistry.push(e.branch);
  }
  const storyWithoutBranch = [];
  if (opts.sprintStatusPath) {
    const doc = readSprintStatus(
      opts.extensionPath !== void 0 ? {
        sprintStatusPath: opts.sprintStatusPath,
        extensionPath: opts.extensionPath
      } : { sprintStatusPath: opts.sprintStatusPath }
    );
    const active = activeStoryKeys(doc);
    const registeredStoryIds = new Set(
      registryEntries.filter((e) => e.status === "active" && typeof e.story_id === "string").map((e) => e.story_id)
    );
    for (const storyKey of active) {
      if (!registeredStoryIds.has(storyKey)) {
        storyWithoutBranch.push(storyKey);
      }
    }
  }
  return { orphanInGit, orphanInRegistry, storyWithoutBranch };
}

// src/cli/handlers/doctor.ts
async function handleDoctor(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(DOCTOR_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown doctor subcommand: ${sub ?? ""}
supported: diagnose | branch-orphans
`
    };
  }
  if (sub === "branch-orphans") {
    let paths;
    try {
      paths = await resolveTdsPaths();
    } catch (err) {
      return {
        exitCode: EXIT.PRECONDITION,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
    try {
      const result = await diagnoseOrphans({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        sprintStatusPath: paths.sprintStatusYaml
      });
      const totalOrphans = result.orphanInGit.length + result.orphanInRegistry.length + result.storyWithoutBranch.length;
      const exitCode = totalOrphans > 0 ? EXIT.PRECONDITION : EXIT.SUCCESS;
      const env = envelope("doctor branch-orphans", exitCode, result);
      return {
        exitCode,
        stdout: wantJson ? JSON.stringify({ ...env, exit_code: exitCode }) : `orphan_in_git=${result.orphanInGit.length} orphan_in_registry=${result.orphanInRegistry.length} story_without_branch=${result.storyWithoutBranch.length}
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "diagnose") {
    try {
      const result = await diagnose();
      const env = envelope("doctor diagnose", EXIT.SUCCESS, result);
      const exitCode = result.status === "halted" ? EXIT.PRECONDITION : EXIT.SUCCESS;
      return {
        exitCode,
        stdout: wantJson ? JSON.stringify({ ...env, exit_code: exitCode }) : `status: ${result.status}
` + result.checks.map((c) => `  [${c.status}] ${c.id}: ${c.message}`).join("\n") + "\n",
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  return exhaustiveSwitch(sub, "doctor");
}

// src/cli/handlers/integrity.ts
import { join as pathJoin } from "node:path";
init_integrity();

// src/integrity/sweep.ts
var import_proper_lockfile3 = __toESM(require_proper_lockfile(), 1);
var import_write_file_atomic3 = __toESM(require_lib(), 1);
var import_yaml8 = __toESM(require_dist(), 1);
init_emit();
init_allowlist();
import { existsSync as existsSync10, readFileSync as readFileSync9 } from "node:fs";
import { createHash as createHash2 } from "node:crypto";
import { join as join7 } from "node:path";
function readManifest2(path) {
  if (!existsSync10(path)) return { schema_version: "1.0", entries: [] };
  const parsed = (0, import_yaml8.parse)(readFileSync9(path, "utf8"));
  if (!parsed || !Array.isArray(parsed.entries)) {
    return { schema_version: "1.0", entries: [] };
  }
  return parsed;
}
async function writeManifestAtomic(path, doc) {
  const yaml = (0, import_yaml8.stringify)(doc, { indent: 2, lineWidth: 0 });
  const release = await import_proper_lockfile3.default.lock(path, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic3.default)(path, yaml, { fsync: true });
  } finally {
    await release();
  }
}
function readDoneStories(sprintStatusPath) {
  if (!existsSync10(sprintStatusPath)) return /* @__PURE__ */ new Set();
  const parsed = (0, import_yaml8.parse)(readFileSync9(sprintStatusPath, "utf8"));
  if (!parsed || !parsed.development_status) return /* @__PURE__ */ new Set();
  return new Set(
    Object.entries(parsed.development_status).filter(([_, status]) => status === "done").map(([key2]) => key2)
  );
}
function sha256OfFile2(path) {
  const h = createHash2("sha256");
  h.update(readFileSync9(path));
  return h.digest("hex");
}
async function sweepIntegrity(opts) {
  const doc = readManifest2(opts.manifestPath);
  const doneStories = readDoneStories(opts.sprintStatusPath);
  const recordedBy = opts.recordedBy ?? "sweep";
  const proposed = [];
  const applied = [];
  const survivors = [];
  let okCount = 0;
  for (const entry of doc.entries) {
    const isAllowed = isPathAllowed(entry.file, entry.artefact_class);
    if (!isAllowed) {
      const proposal2 = {
        file: entry.file,
        action: "purge_out_of_spec",
        reason: `path "${entry.file}" not in \xA712.3 class-${entry.artefact_class} allowlist`
      };
      proposed.push(proposal2);
      if (opts.purgeOutOfSpec) {
        applied.push(proposal2);
        continue;
      }
      survivors.push(entry);
      continue;
    }
    const absPath = join7(opts.projectRoot, entry.file);
    if (!existsSync10(absPath)) {
      const proposal2 = {
        file: entry.file,
        action: entry.story_id && doneStories.has(entry.story_id) ? "remove_orphan" : "flag_unresolved",
        reason: entry.story_id && doneStories.has(entry.story_id) ? `file missing on disk; story ${entry.story_id} is done \u2014 orphan` : `file missing on disk; cannot auto-resolve`
      };
      proposed.push(proposal2);
      if (proposal2.action === "remove_orphan" && opts.removeMissingOrphans) {
        applied.push(proposal2);
        continue;
      }
      survivors.push(entry);
      continue;
    }
    const currentSha = sha256OfFile2(absPath);
    if (currentSha === entry.sha256) {
      okCount++;
      survivors.push(entry);
      continue;
    }
    const proposal = {
      file: entry.file,
      action: entry.story_id && doneStories.has(entry.story_id) ? "accept_done_drift" : "flag_unresolved",
      reason: entry.story_id && doneStories.has(entry.story_id) ? `sha mismatch; story ${entry.story_id} is done \u2014 safe to accept` : `sha mismatch; story not done or absent \u2014 manual review required`
    };
    proposed.push(proposal);
    if (proposal.action === "accept_done_drift" && opts.acceptDoneStoryDrift) {
      applied.push(proposal);
      survivors.push({
        ...entry,
        sha256: currentSha,
        recorded_at: (/* @__PURE__ */ new Date()).toISOString(),
        recorded_by: recordedBy,
        notes: "swept: accept_done_drift"
      });
      continue;
    }
    survivors.push(entry);
  }
  if (applied.length > 0) {
    await writeManifestAtomic(opts.manifestPath, {
      schema_version: "1.0",
      entries: survivors
    });
  }
  for (const action of applied) {
    await emit({
      telemetryDir: opts.telemetryDir,
      stream: "integrity-events",
      event: {
        kind: "sweep",
        action: action.action,
        file: action.file,
        reason: action.reason
      }
    });
  }
  if (applied.length === 0 && proposed.length > 0) {
    await emit({
      telemetryDir: opts.telemetryDir,
      stream: "integrity-events",
      event: {
        kind: "sweep",
        action: "dry_run",
        proposed_count: proposed.length
      }
    });
  }
  return { proposed, applied, okCount };
}

// src/authz/check.ts
var import_yaml9 = __toESM(require_dist(), 1);
init_emit();
import { readFileSync as readFileSync10 } from "node:fs";
var ROLES = [
  "navigator",
  "engineer",
  "auditor",
  "writer",
  "python",
  "csharp",
  "java",
  "frontend",
  "ios",
  "android",
  "test-author",
  "unknown"
];
var ROLE_SET = new Set(ROLES);
var OPERATIONS = [
  "orient",
  "review-read",
  "code-write",
  "story-ops",
  "state-set",
  "integrity-ops",
  "archive-ops",
  "memory-ops",
  "install-ops",
  "key-ops",
  "test-edit-frozen"
];
var OP_SET = new Set(OPERATIONS);
var cached = null;
function loadMatrix(matrixPath) {
  if (cached !== null) return cached;
  const raw = readFileSync10(matrixPath, "utf8");
  const parsed = (0, import_yaml9.parse)(raw);
  if (!parsed?.matrix) {
    throw new Error(`malformed matrix at ${matrixPath}: missing 'matrix' key`);
  }
  cached = parsed;
  return cached;
}
function normaliseRole(role) {
  return ROLE_SET.has(role) ? role : "unknown";
}
function resolveRole(args) {
  if (args.cliRole && ROLE_SET.has(args.cliRole)) {
    return args.cliRole;
  }
  return args.fallback ?? "unknown";
}
function decide(cell, intent) {
  switch (cell) {
    case "allow":
      return { decision: "allow", reason: "matrix.allow" };
    case "allow-conditional":
      return {
        decision: "allow",
        reason: "matrix.allow-conditional (SKILL.md ## Constraints layer)"
      };
    case "deny":
      return { decision: "deny", reason: "matrix.deny" };
    case "read-only":
      if (intent === "read")
        return { decision: "allow", reason: "matrix.read-only + intent=read" };
      if (intent === "write")
        return { decision: "deny", reason: "matrix.read-only + intent=write" };
      return {
        decision: "deny",
        reason: "matrix.read-only requires intent: 'read' | 'write' (fail-closed)"
      };
  }
}
async function checkRoleSkillOperation(args) {
  if (!OP_SET.has(args.op)) {
    throw new Error(`unknown operation: ${args.op}`);
  }
  const role = normaliseRole(args.role);
  const matrix = loadMatrix(args.matrixPath).matrix;
  const row = matrix[role];
  if (!row) {
    const result2 = {
      decision: "deny",
      role,
      op: args.op,
      matchedCell: "deny",
      reason: `role "${role}" not present in matrix.matrix (fail-closed)`
    };
    await emitDecision(args.telemetryDir, result2, args.intent);
    return result2;
  }
  const cell = row[args.op];
  if (!cell) {
    const result2 = {
      decision: "deny",
      role,
      op: args.op,
      matchedCell: "deny",
      reason: `cell ${role}\xD7${args.op} missing (fail-closed)`
    };
    await emitDecision(args.telemetryDir, result2, args.intent);
    return result2;
  }
  const { decision, reason } = decide(cell, args.intent);
  const result = {
    decision,
    role,
    op: args.op,
    matchedCell: cell,
    reason
  };
  await emitDecision(args.telemetryDir, result, args.intent);
  return result;
}
async function emitDecision(telemetryDir, r, intent) {
  await emit({
    telemetryDir,
    stream: "forbidden-quadrant-events",
    event: {
      role: r.role,
      op: r.op,
      intent: intent ?? null,
      decision: r.decision,
      matched_cell: r.matchedCell,
      reason: r.reason
    }
  });
}

// src/authz/pre-impl-status-gate.ts
var import_yaml11 = __toESM(require_dist(), 1);
init_git();
init_registry();
init_model();
import { existsSync as existsSync12, readFileSync as readFileSync12 } from "node:fs";
var PRE_IMPL_STATUSES2 = new Set(PRE_IMPL_STATUSES);
var SPECIALIST_ROLES2 = new Set(SPECIALIST_ROLES);
function checkPreImplStatus(opts) {
  if (!SPECIALIST_ROLES2.has(opts.role)) return { shouldDeny: false };
  let branch;
  try {
    branch = currentBranch({ cwd: opts.projectRoot });
  } catch {
    return { shouldDeny: false };
  }
  if (!existsSync12(opts.registryPath)) return { shouldDeny: false };
  let storyId = null;
  try {
    const doc = readRegistryDoc(opts.registryPath);
    const entry = doc.branches.find((b) => b.branch === branch);
    if (!entry || !entry.story_id) return { shouldDeny: false };
    storyId = entry.story_id;
  } catch {
    return { shouldDeny: false };
  }
  if (!existsSync12(opts.sprintStatusPath)) return { shouldDeny: false };
  let status = null;
  try {
    const parsed = (0, import_yaml11.parse)(readFileSync12(opts.sprintStatusPath, "utf8")) ?? {};
    const v = parsed.development_status?.[storyId];
    status = typeof v === "string" ? v : null;
  } catch {
    return { shouldDeny: false };
  }
  if (status === null) return { shouldDeny: false };
  if (!PRE_IMPL_STATUSES2.has(status)) return { shouldDeny: false };
  return {
    shouldDeny: true,
    storyId,
    status,
    reason: `story ${storyId} \u0432 pre-impl status=${status} \u2014 specialist \u0440\u043E\u043B\u044C=${opts.role} cannot record/commit impl files \u0434\u043E test-author phase completed.`,
    recovery: `Run \`Skill(bmad-tds-test-author)\` \u0447\u0442\u043E\u0431\u044B flip status: tests-pending \u2192 tests-drafting \u2192 tests-approved. \u041F\u043E\u0441\u043B\u0435 tests-approved specialist via \`tds story update --as=${opts.role} --story=${storyId} --status=in-progress\` \u0431\u0435\u0440\u0451\u0442 impl phase \u043F\u043E\u0434 \u0441\u0435\u0431\u044F.`
  };
}

// src/cli/handlers/integrity.ts
async function handleIntegrity(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(INTEGRITY_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown integrity subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = `${paths.runtimeDir}/telemetry`;
  const decision = await checkRoleSkillOperation({
    role,
    op: "integrity-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "integrity-ops",
        reason: decision.reason,
        command: `tds integrity ${sub}`
      })
    };
  }
  if (sub === "record") {
    const filesFlag = parseFlag(rest.slice(1), "files");
    if (!filesFlag) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "integrity record requires --files=<path,path,...>\n"
      };
    }
    const fileList = filesFlag.split(",").map((s) => s.trim()).filter(Boolean);
    if (role === "test-author") {
      const nonTest = fileList.filter((p) => !isTestFilePath(p));
      if (nonTest.length > 0) {
        return {
          exitCode: EXIT.AUTHZ,
          stdout: "",
          stderr: formatAuthzDeny({
            role,
            op: "integrity-ops/test-paths-only",
            reason: `test-author \u043C\u043E\u0436\u0435\u0442 record \u0442\u043E\u043B\u044C\u043A\u043E test-files; non-test paths rejected: ${nonTest.join(", ")}. Pattern: test/, tests/, __tests__/, *.test.*, *.spec.*, *_test.go, test_*.py, *.bats. Product code \u2192 engineer/specialist (--as=<lang>).`,
            command: "tds integrity record"
          })
        };
      }
    }
    const preImpl = checkPreImplStatus({
      role,
      projectRoot: paths.projectRoot,
      registryPath: paths.branchRegistryYaml,
      sprintStatusPath: paths.sprintStatusYaml
    });
    if (preImpl.shouldDeny) {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "integrity-ops/pre-impl-status",
          reason: preImpl.reason ?? "denied by pre-impl gate",
          command: "tds integrity record"
        }) + (preImpl.recovery ? `${preImpl.recovery}
` : "")
      };
    }
    const reason = parseFlag(rest.slice(1), "reason");
    let attributedStoryId;
    try {
      const { currentBranch: currentBranch2 } = await Promise.resolve().then(() => (init_git(), git_exports));
      const { readRegistryDoc: readRegistryDoc2 } = await Promise.resolve().then(() => (init_registry(), registry_exports));
      const branch = currentBranch2({ cwd: paths.projectRoot });
      const doc = readRegistryDoc2(paths.branchRegistryYaml);
      const entry = doc.branches.find((b) => b.branch === branch);
      if (entry?.story_id) attributedStoryId = entry.story_id;
    } catch {
    }
    try {
      const result = await recordIntegrity({
        files: fileList,
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        artefactClass: "A",
        recordedBy: role,
        telemetryDir,
        ...reason !== void 0 ? { reason } : {},
        ...attributedStoryId !== void 0 ? { storyId: attributedStoryId } : {}
      });
      const env = envelope("integrity record", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `recorded ${result.recorded.length} file(s)
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "verify") {
    try {
      const result = await verifyIntegrity({
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        telemetryDir
      });
      const exitCode = result.failed > 0 ? EXIT.RECONCILE_DRIFT : EXIT.SUCCESS;
      const env = envelope("integrity verify", exitCode, result);
      return {
        exitCode,
        stdout: wantJson ? JSON.stringify({ ...env, exit_code: exitCode }) : `verified=${result.verified} failed=${result.failed}
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "accept") {
    const filesFlag = parseFlag(rest.slice(1), "files");
    const reason = parseFlag(rest.slice(1), "reason");
    if (!filesFlag) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "integrity accept requires --files=<path,path,...>\n"
      };
    }
    if (!reason) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "integrity accept requires --reason=<text> (audit field)\n"
      };
    }
    try {
      const result = await acceptIntegrity({
        files: filesFlag.split(",").map((s) => s.trim()).filter(Boolean),
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        acceptedBy: role,
        reason,
        telemetryDir
      });
      const env = envelope("integrity accept", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `accepted ${result.accepted.length} drift entries
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "recover") {
    const strategy = parseFlag(rest.slice(1), "strategy") ?? "trust-classI";
    const reason = parseFlag(rest.slice(1), "reason");
    if (!reason) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "integrity recover requires --reason=<text> (audit field)\n"
      };
    }
    const archiveRoot = parseFlag(rest.slice(1), "archive-root") ?? pathJoin(paths.outputFolder, "_archive");
    try {
      const result = await recoverIntegrity({
        strategy,
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        recoveredBy: role,
        reason,
        telemetryDir,
        ...strategy === "restore-from-archive" ? { archiveRoot } : {}
      });
      const env = envelope("integrity recover", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `recovered=${result.recoveredFiles.length} skipped=${result.skippedFiles.length} (strategy=${result.strategy})
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "sweep") {
    const flags = rest.slice(1);
    const purgeOutOfSpec = flags.includes("--purge-out-of-spec");
    const acceptDoneStoryDrift = flags.includes("--accept-done-story-drift");
    const removeMissingOrphans = flags.includes("--remove-missing-orphans");
    try {
      const result = await sweepIntegrity({
        manifestPath: paths.stateManifestYaml,
        sprintStatusPath: paths.sprintStatusYaml,
        projectRoot: paths.projectRoot,
        telemetryDir,
        purgeOutOfSpec,
        acceptDoneStoryDrift,
        removeMissingOrphans,
        recordedBy: role
      });
      const env = envelope("integrity sweep", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `proposed=${result.proposed.length} applied=${result.applied.length} ok=${result.okCount}
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  return exhaustiveSwitch(sub, "integrity");
}

// src/cli/handlers/state.ts
import { join as pathJoin2 } from "node:path";

// src/state/get.ts
var import_yaml12 = __toESM(require_dist(), 1);
import { readFileSync as readFileSync13, existsSync as existsSync13 } from "node:fs";
async function stateGet(opts) {
  if (!existsSync13(opts.sprintStatusPath)) {
    throw new Error(
      `sprint-status.yaml not found at ${opts.sprintStatusPath} (run \`bmad install\` to bootstrap)`
    );
  }
  const raw = readFileSync13(opts.sprintStatusPath, "utf8");
  const parsed = (0, import_yaml12.parse)(raw) ?? {};
  if (!parsed.development_status || typeof parsed.development_status !== "object") {
    throw new Error(
      "sprint-status.yaml is missing the 'development_status' block (BMAD-canonical key)"
    );
  }
  const dev = parsed.development_status;
  if (!Object.prototype.hasOwnProperty.call(dev, opts.storyId)) {
    return { storyId: opts.storyId, status: null };
  }
  const value = dev[opts.storyId];
  return {
    storyId: opts.storyId,
    status: typeof value === "string" ? value : String(value)
  };
}

// src/cli/handlers/state.ts
init_set();
init_apply_transition();
init_sprint_status();
init_model();
var STATE_DISPATCH = {
  get: async ({ storyId, sprintStatusPath, role, telemetryDir, wantJson }) => {
    const decision = await checkRoleSkillOperation({
      role,
      op: "review-read",
      telemetryDir,
      matrixPath: SPEC_MATRIX_PATH
    });
    if (decision.decision === "deny") {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "review-read",
          reason: decision.reason,
          command: "tds state get"
        })
      };
    }
    try {
      const result = await stateGet({ sprintStatusPath, storyId });
      const env = envelope("state get", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.storyId}: ${result.status ?? "<not in registry>"}
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  },
  set: async ({
    storyId,
    rest,
    paths,
    sprintStatusPath,
    role,
    telemetryDir,
    wantJson
  }) => {
    const newStatus = parseFlag(rest.slice(1), "status");
    if (!newStatus) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "state set requires --status=<status>\n"
      };
    }
    const decision = await checkRoleSkillOperation({
      role,
      op: "state-set",
      telemetryDir,
      matrixPath: SPEC_MATRIX_PATH
    });
    if (decision.decision === "deny") {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "state-set",
          reason: decision.reason,
          command: "tds state set"
        })
      };
    }
    if (isTestsState(newStatus) && role !== "test-author") {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "state-set",
          reason: `target tests-* states reserved for test-author role (got --as=${role}, --status=${newStatus}). Test-author phase \u0434\u0435\u043B\u0435\u0433\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 bmad-tds-test-author workflow.`,
          command: "tds state set"
        })
      };
    }
    if (role === "test-author" && !isTestsState(newStatus)) {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "state-set",
          reason: `test-author can only set tests-drafting | tests-needs-revision | tests-approved (got --status=${newStatus}). Non-tests-* transitions handled by specialist after tests-approved.`,
          command: "tds state set"
        })
      };
    }
    const extensionPath = pathJoin2(
      paths.tdsStateDir,
      "sprint-status-extension.yaml"
    );
    const kind = classifyEntityKind(storyId, extensionPath);
    let storyMdPath;
    if (kind !== "epic") {
      const { existsSync: existsSync31 } = await import("node:fs");
      const candidate = pathJoin2(
        paths.outputFolder,
        "implementation-artifacts",
        "stories",
        `${storyId}.md`
      );
      if (existsSync31(pathJoin2(paths.outputFolder, "implementation-artifacts", "stories"))) {
        storyMdPath = candidate;
      }
    }
    try {
      const result = await stateSet({
        sprintStatusPath,
        storyId,
        newStatus,
        transitionBy: role,
        telemetryDir,
        ...storyMdPath !== void 0 ? { storyMdPath } : {},
        stateManifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        kind
      });
      const env = envelope("state set", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.storyId}: ${result.stateBefore} \u2192 ${result.stateAfter}` + (result.storyMdUpdated ? " (story-md updated)" : "") + (result.storyMdSkipped ? ` [story-md: ${result.storyMdSkipped}]` : "") + "\n",
        stderr: ""
      };
    } catch (err) {
      if (err instanceof StateTransitionDeniedError) {
        return {
          exitCode: EXIT.AUTHZ,
          stdout: "",
          stderr: formatAuthzDeny({
            role,
            op: "state-set",
            reason: err.reason,
            command: "tds state set"
          }) + (err.recovery ? `${err.recovery}
` : "")
        };
      }
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
};
async function handleState(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(STATE_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown state subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  const storyId = parseFlag(rest.slice(1), "story");
  if (!storyId) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `state ${sub} requires --story=<id>
`
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin2(paths.runtimeDir, "telemetry");
  return STATE_DISPATCH[sub]({
    storyId,
    flags: rest.slice(1),
    rest,
    wantJson,
    role,
    paths,
    sprintStatusPath: paths.sprintStatusYaml,
    telemetryDir
  });
}

// src/cli/handlers/memory.ts
import { join as pathJoin3 } from "node:path";

// src/memory/crud.ts
init_emit();

// src/memory/store.ts
var import_proper_lockfile7 = __toESM(require_proper_lockfile(), 1);
var import_write_file_atomic7 = __toESM(require_lib(), 1);
var import_yaml15 = __toESM(require_dist(), 1);
init_auto_record();
import { existsSync as existsSync17, readFileSync as readFileSync17, mkdirSync as mkdirSync5 } from "node:fs";
import { dirname as dirname10 } from "node:path";
var EMPTY_DOC2 = { schema_version: "1.0", lessons: [] };
function readDoc2(path) {
  if (!existsSync17(path)) return structuredClone(EMPTY_DOC2);
  const parsed = (0, import_yaml15.parse)(readFileSync17(path, "utf8")) ?? structuredClone(EMPTY_DOC2);
  if (!Array.isArray(parsed.lessons)) parsed.lessons = [];
  if (!parsed.schema_version) parsed.schema_version = "1.0";
  return parsed;
}
async function writeDoc2(path, doc, recordOpts) {
  const yaml = (0, import_yaml15.stringify)(doc, { indent: 2, lineWidth: 0 });
  mkdirSync5(dirname10(path), { recursive: true });
  const release = await import_proper_lockfile7.default.lock(path, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic7.default)(path, yaml, { fsync: true });
    await recordAfterWrite({
      manifestPath: recordOpts.manifestPath,
      projectRoot: recordOpts.projectRoot,
      file: path,
      recordedBy: recordOpts.recordedBy,
      telemetryDir: recordOpts.telemetryDir,
      ...recordOpts.reason !== void 0 ? { reason: recordOpts.reason } : {}
    });
  } finally {
    await release();
  }
}

// src/memory/injection-defense.ts
var ADVERSARIAL_PATTERNS = [
  {
    name: "imperative-override",
    regex: /\b(ignore|disregard|forget)\s+(previous|all|earlier|above|prior)\b/i,
    explanation: "imperative override pattern (e.g. 'IGNORE PREVIOUS instructions') \u2014 classic prompt-injection attempt to discard prior context"
  },
  {
    name: "system-prompt-impersonation",
    regex: /\b(system\s*[:>]|system\s+prompt|<\s*system\b)/i,
    explanation: "attempt to impersonate system role / system prompt \u2014 claims elevated authority that lessons.yaml MUST NOT have"
  },
  {
    name: "trust-boundary-escape",
    regex: /<\s*\/?\s*untrusted-content\b/i,
    explanation: "attempt to break out of <untrusted-content> trust boundary wrapper that read-side defense uses"
  },
  {
    name: "chat-format-injection",
    regex: /(\[\s*\/?\s*INST\s*\]|<\|im_(start|end)\|>|<\|endoftext\|>)/i,
    explanation: "model-format token injection (Llama [INST] / ChatML <|im_*|> / GPT <|endoftext|>) \u2014 attempts to fake conversation boundaries"
  },
  {
    name: "unicode-direction-override",
    regex: /[‪-‮⁦-⁩]/,
    explanation: "Unicode bidirectional / direction-override character \u2014 used to render text differently than its byte order (homograph attacks)"
  },
  {
    name: "tool-use-injection",
    regex: /<\s*\/?\s*(tool_use|tool_result|function_call|invoke)\b/i,
    explanation: "attempt to inject tool-use protocol tags \u2014 could trick LLM into fabricated tool calls"
  }
];
function scanLessonForInjection(input) {
  const matches = [];
  const fields = [
    { name: "summary", value: input.summary },
    { name: "lesson", value: input.lesson },
    { name: "avoid_pattern", value: input.avoidPattern },
    { name: "preferred_pattern", value: input.preferredPattern }
  ];
  for (const { name, value } of fields) {
    if (value === void 0 || value.length === 0) continue;
    for (const pat of ADVERSARIAL_PATTERNS) {
      const m = pat.regex.exec(value);
      if (m === null) continue;
      const idx = m.index;
      const excerpt = value.slice(Math.max(0, idx - 20), Math.min(value.length, idx + 60)).replace(/\s+/g, " ").trim();
      matches.push({
        pattern: pat.name,
        field: name,
        excerpt,
        explanation: pat.explanation
      });
    }
  }
  return matches;
}
var InjectionRejected = class extends Error {
  constructor(matches) {
    const summary = matches.map((m) => `${m.field}: ${m.pattern} ('${m.excerpt}')`).join("; ");
    super(`memory_injection_blocked: ${summary}`);
    this.matches = matches;
    this.name = "InjectionRejected";
  }
  matches;
};
function wrapLessonForInjection(lesson) {
  const lines = [];
  lines.push(
    `<untrusted-content source="lessons.yaml" lesson_id="${escapeAttr(lesson.id)}" severity="${escapeAttr(lesson.severity)}">`
  );
  lines.push(`summary: ${escapeBody(lesson.summary)}`);
  if (lesson.lesson !== void 0) {
    lines.push(`lesson: ${escapeBody(lesson.lesson)}`);
  }
  if (lesson.avoid_pattern !== void 0) {
    lines.push(`avoid_pattern: ${escapeBody(lesson.avoid_pattern)}`);
  }
  if (lesson.preferred_pattern !== void 0) {
    lines.push(`preferred_pattern: ${escapeBody(lesson.preferred_pattern)}`);
  }
  lines.push(`</untrusted-content>`);
  return lines.join("\n");
}
function escapeAttr(s) {
  return s.replace(/[&<>"]/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
function escapeBody(s) {
  return s.replace(/<\/(untrusted-content)\b/gi, "&lt;/$1");
}

// src/memory/crud.ts
var CATEGORIES = [
  "technical",
  "process",
  "tooling",
  "communication"
];
var CATEGORY_SET = new Set(CATEGORIES);
var SEVERITIES = ["high", "medium", "low"];
var SEVERITY_SET = new Set(SEVERITIES);
function nextLessonId(existing) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const prefix = `lesson-${today}-`;
  const sameDay = existing.map((l) => l.id).filter((id) => id.startsWith(prefix)).map((id) => Number(id.slice(prefix.length))).filter((n) => Number.isFinite(n));
  const next = sameDay.length === 0 ? 1 : Math.max(...sameDay) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}
async function addLesson(opts) {
  if (!CATEGORY_SET.has(opts.category)) {
    throw new Error(
      `unknown category: ${opts.category} (allowed: ${[...CATEGORIES].join(", ")})`
    );
  }
  if (!SEVERITY_SET.has(opts.severity)) {
    throw new Error(
      `unknown severity: ${opts.severity} (allowed: ${[...SEVERITIES].join(", ")})`
    );
  }
  if (typeof opts.summary !== "string" || opts.summary.length === 0) {
    throw new Error("summary must be a non-empty string");
  }
  const matches = scanLessonForInjection({
    summary: opts.summary,
    ...opts.lesson !== void 0 ? { lesson: opts.lesson } : {},
    ...opts.avoidPattern !== void 0 ? { avoidPattern: opts.avoidPattern } : {},
    ...opts.preferredPattern !== void 0 ? { preferredPattern: opts.preferredPattern } : {}
  });
  if (matches.length > 0) {
    await emit({
      telemetryDir: opts.telemetryDir,
      stream: "forbidden-quadrant-events",
      event: {
        kind: "memory_injection_blocked",
        category: opts.category,
        severity: opts.severity,
        match_count: matches.length,
        patterns: matches.map((m) => m.pattern),
        fields: matches.map((m) => m.field),
        created_by: opts.createdBy
      }
    });
    throw new InjectionRejected(matches);
  }
  const doc = readDoc2(opts.lessonsPath);
  const id = nextLessonId(doc.lessons);
  const entry = {
    id,
    ...opts.createdDuring !== void 0 ? { created_during: opts.createdDuring } : {},
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    created_by: opts.createdBy,
    ...opts.formulatedBy !== void 0 ? { formulated_by: opts.formulatedBy } : {},
    story_refs: opts.storyRefs ?? [],
    category: opts.category,
    tags: opts.tags ?? [],
    summary: opts.summary,
    ...opts.lesson !== void 0 ? { lesson: opts.lesson } : {},
    ...opts.avoidPattern !== void 0 ? { avoid_pattern: opts.avoidPattern } : {},
    ...opts.preferredPattern !== void 0 ? { preferred_pattern: opts.preferredPattern } : {},
    severity: opts.severity,
    status: "active",
    superseded_by: null,
    ...opts.notes !== void 0 ? { notes: opts.notes } : {}
  };
  doc.lessons.push(entry);
  await writeDoc2(opts.lessonsPath, doc, {
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir
  });
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "lesson-events",
    event: {
      kind: "add",
      lesson_id: id,
      category: opts.category,
      severity: opts.severity
    }
  });
  return { lessonId: id };
}
async function listLessons(opts) {
  const doc = readDoc2(opts.lessonsPath);
  let filtered = doc.lessons;
  if (opts.severity) {
    filtered = filtered.filter((l) => l.severity === opts.severity);
  }
  if (opts.category) {
    filtered = filtered.filter((l) => l.category === opts.category);
  }
  if (opts.status) {
    filtered = filtered.filter((l) => l.status === opts.status);
  }
  if (opts.tags && opts.tags.length > 0) {
    const wanted = new Set(opts.tags);
    filtered = filtered.filter((l) => l.tags.some((t) => wanted.has(t)));
  }
  const total = filtered.length;
  if (opts.limit !== void 0) {
    filtered = filtered.slice(0, opts.limit);
  }
  return { lessons: filtered, total };
}
async function showLesson(opts) {
  const doc = readDoc2(opts.lessonsPath);
  const found = doc.lessons.find((l) => l.id === opts.lessonId);
  if (!found) {
    throw new Error(`lesson not found: ${opts.lessonId}`);
  }
  return found;
}

// src/memory/query.ts
init_model();
var SEVERITY_WEIGHT = {
  high: 1,
  medium: 0.6,
  low: 0.3
};
var SEVERITY_RANK = { high: 3, medium: 2, low: 1 };
var DOMAIN_STACKS = /* @__PURE__ */ new Set([
  "python",
  "csharp",
  "java",
  "frontend",
  "ios",
  "android"
]);
var PROCESS_ROLES = /* @__PURE__ */ new Set([
  "navigator",
  "engineer",
  "auditor",
  "writer"
]);
function domainMatch(category, primarySpecialist) {
  if (!primarySpecialist) return 0;
  switch (category) {
    case "technical":
      if (DOMAIN_STACKS.has(primarySpecialist)) return 1;
      if (primarySpecialist === "engineer") return 0.7;
      if (primarySpecialist === "auditor") return 0.5;
      return 0;
    case "process":
      if (PROCESS_ROLES.has(primarySpecialist)) return 1;
      return 0.3;
    // domain stacks still benefit from process discipline
    case "tooling":
      return 0.5;
    case "communication":
      if (primarySpecialist === "writer") return 1;
      if (PROCESS_ROLES.has(primarySpecialist)) return 0.6;
      return 0.3;
  }
}
function jaccard(a, b) {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const x of setA) if (setB.has(x)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
function parentEpicOf(id, sprintDoc) {
  if (sprintDoc) {
    const entry = sprintDoc.byKey.get(id);
    if (entry) {
      if (entry.kind === "story" && entry.parentEpic) return entry.parentEpic;
      if (entry.kind === "bridge-story" && entry.toEpic !== void 0) {
        return `epic-${entry.toEpic}`;
      }
      if (entry.kind === "bridge" && entry.toEpic !== void 0) {
        return `epic-${entry.toEpic}`;
      }
    }
  }
  const story = /^(\d+)-\d+-[a-z0-9-]+$/.exec(id);
  if (story) return `epic-${story[1]}`;
  const bridge = /^bridge-(\d+)-(\d+)-\d+-[a-z0-9-]+$/.exec(id);
  if (bridge) return `epic-${bridge[2]}`;
  const bridgeOnly = /^bridge-(\d+)-(\d+)$/.exec(id);
  if (bridgeOnly) return `epic-${bridgeOnly[2]}`;
  return null;
}
function bridgeConnects(doc, epicA, epicB) {
  const aMatch = EPIC_ID_RE.exec(epicA);
  const bMatch = EPIC_ID_RE.exec(epicB);
  if (!aMatch || !bMatch) return false;
  const a = Number(aMatch[1]);
  const b = Number(bMatch[1]);
  for (const e of doc.entries) {
    if (e.kind !== "bridge" && e.kind !== "bridge-story") continue;
    if (e.fromEpic === a && e.toEpic === b || e.fromEpic === b && e.toEpic === a) {
      return true;
    }
  }
  return false;
}
function storyProximityHeuristic(storyRefs, storyId) {
  if (storyRefs.includes(storyId)) return 1;
  const epicPrefix = (id) => {
    const segs = id.split("-");
    return segs.slice(0, Math.min(2, segs.length)).join("-");
  };
  const target = epicPrefix(storyId);
  for (const ref of storyRefs) {
    if (epicPrefix(ref) === target) return 0.5;
  }
  return 0;
}
function storyProximity(storyRefs, storyId, sprintDoc) {
  if (storyRefs.includes(storyId)) return 1;
  if (!sprintDoc) {
    return storyProximityHeuristic(storyRefs, storyId);
  }
  const targetEpic = parentEpicOf(storyId, sprintDoc);
  if (!targetEpic) {
    return storyProximityHeuristic(storyRefs, storyId);
  }
  let best = 0;
  for (const ref of storyRefs) {
    const refEpic = parentEpicOf(ref, sprintDoc);
    if (!refEpic) continue;
    if (refEpic === targetEpic) {
      best = Math.max(best, 0.7);
      continue;
    }
    if (bridgeConnects(sprintDoc, targetEpic, refEpic)) {
      best = Math.max(best, 0.5);
    }
  }
  return best;
}
function recencyDecay(createdAt) {
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return 0;
  const ageDays = (Date.now() - t) / (1e3 * 60 * 60 * 24);
  return Math.exp(-ageDays / 90);
}
async function queryLessons(opts) {
  const doc = readDoc2(opts.lessonsPath);
  const top = opts.top ?? 5;
  const minRank = opts.severityMin ? SEVERITY_RANK[opts.severityMin] : 0;
  const candidates = doc.lessons.filter((l) => {
    if (l.status !== "active") return false;
    if (SEVERITY_RANK[l.severity] < minRank) return false;
    return true;
  });
  const storyTagBag = opts.primarySpecialist ? [...opts.storyTags, opts.primarySpecialist] : opts.storyTags;
  const scored = candidates.map((l) => {
    const score = 1 * jaccard(l.tags, storyTagBag) + 0.7 * domainMatch(l.category, opts.primarySpecialist) + 0.5 * storyProximity(l.story_refs, opts.storyId, opts.sprintStatus) + 0.4 * recencyDecay(l.created_at) + 0.3 * SEVERITY_WEIGHT[l.severity];
    return { ...l, score };
  }).sort((a, b) => b.score - a.score).slice(0, top);
  return { storyId: opts.storyId, lessons: scored };
}

// src/memory/supersede.ts
init_emit();
async function supersedeLesson(opts) {
  if (typeof opts.reason !== "string" || opts.reason.length === 0) {
    throw new Error("supersede requires a non-empty reason (audit field)");
  }
  const doc = readDoc2(opts.lessonsPath);
  const oldIdx = doc.lessons.findIndex((l) => l.id === opts.oldId);
  if (oldIdx < 0) throw new Error(`old lesson not found: ${opts.oldId}`);
  const newIdx = doc.lessons.findIndex((l) => l.id === opts.newId);
  if (newIdx < 0) throw new Error(`new lesson not found: ${opts.newId}`);
  const old = doc.lessons[oldIdx];
  doc.lessons[oldIdx] = {
    ...old,
    status: "superseded",
    superseded_by: opts.newId,
    notes: `superseded: ${opts.reason}`
  };
  await writeDoc2(opts.lessonsPath, doc, {
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir
  });
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "lesson-events",
    event: {
      kind: "supersede",
      old_id: opts.oldId,
      new_id: opts.newId,
      reason: opts.reason,
      superseded_by: opts.supersededBy
    }
  });
  return { oldId: opts.oldId, newId: opts.newId, status: "superseded" };
}

// src/memory/tag.ts
init_emit();
async function tagLesson(opts) {
  const doc = readDoc2(opts.lessonsPath);
  const idx = doc.lessons.findIndex((l) => l.id === opts.lessonId);
  if (idx < 0) throw new Error(`lesson not found: ${opts.lessonId}`);
  const lesson = doc.lessons[idx];
  const tagsBefore = [...lesson.tags];
  const set = new Set(lesson.tags);
  for (const t of opts.add ?? []) set.add(t);
  for (const t of opts.remove ?? []) set.delete(t);
  const removed = new Set(opts.remove ?? []);
  const ordered = tagsBefore.filter((t) => !removed.has(t));
  for (const t of opts.add ?? []) {
    if (!ordered.includes(t)) ordered.push(t);
  }
  doc.lessons[idx] = { ...lesson, tags: ordered };
  await writeDoc2(opts.lessonsPath, doc, {
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir
  });
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "lesson-events",
    event: {
      kind: "tag",
      lesson_id: opts.lessonId,
      tags_before: tagsBefore,
      tags_after: ordered,
      tagged_by: opts.taggedBy
    }
  });
  return { lessonId: opts.lessonId, tagsBefore, tagsAfter: ordered };
}

// src/memory/candidates.ts
import { existsSync as existsSync18, readFileSync as readFileSync18 } from "node:fs";
import { join as join8 } from "node:path";
function parseStream(path) {
  if (!existsSync18(path)) return [];
  return readFileSync18(path, "utf8").split("\n").filter((l) => l.length > 0).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter((e) => e !== null);
}
function withinWindow(ts, sinceMs, untilMs) {
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return false;
  return t >= sinceMs && t <= untilMs;
}
async function memoryCandidates(opts) {
  const minOccurrences = opts.minOccurrences ?? 2;
  const now = Date.now();
  const sinceMs = opts.since ? Date.parse(opts.since) : now - 90 * 24 * 60 * 60 * 1e3;
  const untilMs = opts.until ? Date.parse(opts.until) : now;
  const sinceIso = new Date(sinceMs).toISOString();
  const untilIso = new Date(untilMs).toISOString();
  const candidates = [];
  const fbqEvents = parseStream(
    join8(opts.telemetryDir, "forbidden-quadrant-events.jsonl")
  ).filter((e) => withinWindow(e.ts, sinceMs, untilMs));
  const fbqCounts = /* @__PURE__ */ new Map();
  const fbqRoles = /* @__PURE__ */ new Map();
  const fbqOps = /* @__PURE__ */ new Map();
  for (const e of fbqEvents) {
    const decision = e.event.decision;
    if (decision !== "deny") continue;
    const role = String(e.event.role ?? "?");
    const op = String(e.event.op ?? "?");
    const key2 = `fbq:${role}\xD7${op}`;
    fbqCounts.set(key2, (fbqCounts.get(key2) ?? 0) + 1);
    fbqRoles.set(key2, role);
    fbqOps.set(key2, op);
  }
  for (const [id, count] of fbqCounts) {
    if (count < minOccurrences) continue;
    const role = fbqRoles.get(id) ?? "?";
    const op = fbqOps.get(id) ?? "?";
    candidates.push({
      id,
      category: "process",
      severity: count >= 5 ? "high" : "medium",
      suggestedSummary: `${role} repeatedly hit forbidden-quadrant deny on ${op} (${count} occurrences) \u2014 investigate whether the workflow asks ${role} to perform ops outside its matrix authorisation`,
      suggestedTags: ["forbidden-quadrant", role, op],
      occurrences: count,
      sources: ["forbidden-quadrant-events.jsonl"],
      storyRefs: []
    });
  }
  const integEvents = parseStream(
    join8(opts.telemetryDir, "integrity-events.jsonl")
  ).filter((e) => withinWindow(e.ts, sinceMs, untilMs));
  const driftCounts = /* @__PURE__ */ new Map();
  for (const e of integEvents) {
    const kind = e.event.kind;
    if (kind !== "verify") continue;
    const failed = Number(e.event.failed ?? 0);
    if (failed > 0) {
      driftCounts.set("verify-fail", (driftCounts.get("verify-fail") ?? 0) + 1);
    }
  }
  const verifyFails = driftCounts.get("verify-fail") ?? 0;
  if (verifyFails >= minOccurrences) {
    candidates.push({
      id: "drift:verify-fail-cluster",
      category: "tooling",
      severity: verifyFails >= 5 ? "high" : "medium",
      suggestedSummary: `tds integrity verify reported failures ${verifyFails} times in the window \u2014 check whether automation writes outside the CLI or whether the registry needs a refresh`,
      suggestedTags: ["integrity", "drift"],
      occurrences: verifyFails,
      sources: ["integrity-events.jsonl"],
      storyRefs: []
    });
  }
  const stateEvents = parseStream(
    join8(opts.telemetryDir, "state-transitions.jsonl")
  ).filter((e) => withinWindow(e.ts, sinceMs, untilMs));
  const reversals = /* @__PURE__ */ new Map();
  for (const e of stateEvents) {
    const ev = e.event;
    if (ev.state_before === "review" && ev.state_after === "in-progress" && ev.story_id) {
      reversals.set(ev.story_id, (reversals.get(ev.story_id) ?? 0) + 1);
    }
  }
  for (const [storyId, count] of reversals) {
    if (count < minOccurrences) continue;
    candidates.push({
      id: `state:reversal:${storyId}`,
      category: "process",
      severity: "medium",
      suggestedSummary: `Story ${storyId} bounced review \u2192 in-progress ${count} times \u2014 review acceptance-criteria sharpness or auditor signal noise`,
      suggestedTags: ["state-machine", "review-bounce", storyId],
      occurrences: count,
      sources: ["state-transitions.jsonl"],
      storyRefs: [storyId]
    });
  }
  return {
    since: sinceIso,
    until: untilIso,
    candidates
  };
}

// src/cli/handlers/memory.ts
async function handleMemory(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(MEMORY_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown memory subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin3(paths.runtimeDir, "telemetry");
  const lessonsPath = pathJoin3(paths.tdsStateDir, "memory", "lessons.yaml");
  const writeSubs = /* @__PURE__ */ new Set(["add", "supersede", "tag"]);
  const intent = writeSubs.has(sub) ? "write" : "read";
  const decision = await checkRoleSkillOperation({
    role,
    op: "memory-ops",
    intent,
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: `memory-ops/${intent}`,
        reason: decision.reason,
        command: `tds memory ${sub}`
      })
    };
  }
  const flags = rest.slice(1);
  try {
    if (sub === "add") {
      const category = parseFlag(flags, "category");
      const severity = parseFlag(flags, "severity");
      const summary = parseFlag(flags, "summary");
      if (!category || !severity || !summary) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "memory add requires --category, --severity, --summary\n"
        };
      }
      const lessonText = parseFlag(flags, "lesson");
      const avoidPattern = parseFlag(flags, "avoid-pattern");
      const preferredPattern = parseFlag(flags, "preferred-pattern");
      const tagsRaw = parseFlag(flags, "tags");
      const storyRefsRaw = parseFlag(flags, "story-refs");
      const duringRetro = parseFlag(flags, "during-retro");
      const result = await addLesson({
        lessonsPath,
        telemetryDir,
        category,
        severity,
        summary,
        ...lessonText !== void 0 ? { lesson: lessonText } : {},
        ...avoidPattern !== void 0 ? { avoidPattern } : {},
        ...preferredPattern !== void 0 ? { preferredPattern } : {},
        ...tagsRaw !== void 0 ? { tags: tagsRaw.split(",") } : {},
        ...storyRefsRaw !== void 0 ? { storyRefs: storyRefsRaw.split(",") } : {},
        ...duringRetro !== void 0 ? { createdDuring: duringRetro } : {},
        createdBy: role,
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        recordedBy: role
      });
      const env = envelope("memory add", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.lessonId}
`,
        stderr: ""
      };
    }
    if (sub === "list") {
      const result = await listLessons({
        lessonsPath,
        ...parseFlag(flags, "category") ? { category: parseFlag(flags, "category") } : {},
        ...parseFlag(flags, "severity") ? { severity: parseFlag(flags, "severity") } : {},
        ...parseFlag(flags, "tags") ? { tags: parseFlag(flags, "tags").split(",") } : {},
        ...parseFlag(flags, "status") ? { status: parseFlag(flags, "status") } : {},
        ...parseFlag(flags, "limit") ? { limit: Number(parseFlag(flags, "limit")) } : {}
      });
      const env = envelope("memory list", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.total} lesson(s)
` + result.lessons.map((l) => `  ${l.id} [${l.severity}/${l.category}] ${l.summary}`).join("\n") + "\n",
        stderr: ""
      };
    }
    if (sub === "show") {
      const lessonId = flags[0];
      if (!lessonId || lessonId.startsWith("--")) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "memory show requires <lesson-id>\n"
        };
      }
      const lesson = await showLesson({ lessonsPath, lessonId });
      const env = envelope("memory show", EXIT.SUCCESS, lesson);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${lesson.id} [${lesson.severity}/${lesson.category}]
${lesson.summary}
`,
        stderr: ""
      };
    }
    if (sub === "query") {
      const storyId = parseFlag(flags, "story");
      if (!storyId) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "memory query requires --story=<id>\n"
        };
      }
      const primarySpecialist = parseFlag(flags, "primary-specialist");
      const severityMin = parseFlag(flags, "severity-min");
      const { readSprintStatus: readSprintStatus2 } = await Promise.resolve().then(() => (init_sprint_status(), sprint_status_exports));
      const sprintStatus = readSprintStatus2({
        sprintStatusPath: paths.sprintStatusYaml
      });
      const result = await queryLessons({
        lessonsPath,
        storyId,
        storyTags: parseFlag(flags, "story-tags")?.split(",") ?? [],
        top: parseFlag(flags, "top") ? Number(parseFlag(flags, "top")) : 5,
        ...primarySpecialist !== void 0 ? { primarySpecialist } : {},
        ...severityMin !== void 0 ? { severityMin } : {},
        sprintStatus
      });
      const wrappedLessons = result.lessons.map((l) => ({
        id: l.id,
        severity: l.severity,
        category: l.category,
        score: l.score,
        wrapped: wrapLessonForInjection(l)
      }));
      const envResult = {
        ...result,
        lessons_wrapped: wrappedLessons
      };
      const env = envelope("memory query", EXIT.SUCCESS, envResult);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.lessons.length} relevant lesson(s) for ${result.storyId}
`,
        stderr: ""
      };
    }
    if (sub === "supersede") {
      const oldId = flags[0];
      const newId = parseFlag(flags, "by");
      const reason = parseFlag(flags, "reason");
      if (!oldId || oldId.startsWith("--") || !newId || !reason) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "memory supersede requires <old-id> --by=<new-id> --reason=<text>\n"
        };
      }
      const result = await supersedeLesson({
        lessonsPath,
        telemetryDir,
        oldId,
        newId,
        reason,
        supersededBy: role,
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        recordedBy: role
      });
      const env = envelope("memory supersede", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${oldId} \u2192 superseded by ${newId}
`,
        stderr: ""
      };
    }
    if (sub === "candidates") {
      const since = parseFlag(flags, "since");
      const until = parseFlag(flags, "until");
      const minOccRaw = parseFlag(flags, "min-occurrences");
      const result = await memoryCandidates({
        telemetryDir,
        ...since !== void 0 ? { since } : {},
        ...until !== void 0 ? { until } : {},
        ...minOccRaw !== void 0 ? { minOccurrences: Number(minOccRaw) } : {}
      });
      const env = envelope("memory candidates", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.candidates.length} candidate(s) in [${result.since}, ${result.until})
` + result.candidates.map((c) => `  ${c.id} [${c.severity}/${c.category} \xD7${c.occurrences}] ${c.suggestedSummary}`).join("\n") + (result.candidates.length > 0 ? "\n" : ""),
        stderr: ""
      };
    }
    if (sub === "tag") {
      const lessonId = flags[0];
      if (!lessonId || lessonId.startsWith("--")) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "memory tag requires <lesson-id> [--add=<...>] [--remove=<...>]\n"
        };
      }
      const result = await tagLesson({
        lessonsPath,
        telemetryDir,
        lessonId,
        ...parseFlag(flags, "add") ? { add: parseFlag(flags, "add").split(",") } : {},
        ...parseFlag(flags, "remove") ? { remove: parseFlag(flags, "remove").split(",") } : {},
        taggedBy: role,
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        recordedBy: role
      });
      const env = envelope("memory tag", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${lessonId}: tags = [${result.tagsAfter.join(", ")}]
`,
        stderr: ""
      };
    }
    return exhaustiveSwitch(sub, "memory");
  } catch (err) {
    if (err instanceof InjectionRejected) {
      const lines = err.matches.map(
        (m) => `  - field=${m.field} pattern=${m.pattern}: ${m.explanation} (excerpt: '${m.excerpt}')`
      );
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: `memory add rejected: ${err.matches.length} adversarial pattern(s) detected:
${lines.join("\n")}
(emitted forbidden-quadrant-events kind=memory_injection_blocked)
`
      };
    }
    return {
      exitCode: EXIT.RUNTIME,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
}

// src/cli/handlers/branch.ts
import { join as pathJoin4 } from "node:path";

// src/branch/cli.ts
init_registry();
init_git();
init_emit();
async function emitBranchEvent(telemetryDir, event) {
  if (!telemetryDir) return;
  try {
    await emit({ telemetryDir, stream: "branch-events", event });
  } catch {
  }
}
async function branchStart(opts) {
  if (opts.storyId === null && opts.epicId !== null) {
    const existing = (await findByEpic({
      registryPath: opts.registryPath,
      epicId: opts.epicId
    })).find((b) => b.story_id === null);
    if (existing) {
      if (!branchExists(existing.branch, { cwd: opts.projectRoot })) {
        throw new Error(
          `epic-integration branch ${existing.branch} is in registry but missing from git. Run \`tds branch remove --branch=${existing.branch}\` first if you want to re-create.`
        );
      }
      await emitBranchEvent(opts.telemetryDir, {
        kind: "branch-start",
        branch: existing.branch,
        story_id: null,
        epic_id: opts.epicId,
        base_branch: existing.base_branch,
        mode: "resume"
      });
      return existing;
    }
  }
  if (await findByBranch({
    registryPath: opts.registryPath,
    branch: opts.branchName
  })) {
    throw new Error(
      `branch already in registry: ${opts.branchName} (use \`tds branch info\` to inspect)`
    );
  }
  if (branchExists(opts.branchName, { cwd: opts.projectRoot })) {
    throw new Error(
      `branch already exists in git but not in registry: ${opts.branchName} (use \`tds branch attach --epic=${opts.epicId ?? "<id>"}\` to register the existing branch)`
    );
  }
  createBranch(opts.branchName, opts.baseBranch, { cwd: opts.projectRoot });
  const entry = await register({
    registryPath: opts.registryPath,
    recordOpts: {
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir ?? ""
    },
    entry: {
      branch: opts.branchName,
      story_id: opts.storyId,
      epic_id: opts.epicId,
      base_branch: opts.baseBranch,
      created_by: "tds-branch-start",
      status: "active",
      pr_url: null,
      pr_number: null,
      last_synced_at: null,
      notes: ""
    }
  });
  await emitBranchEvent(opts.telemetryDir, {
    kind: "branch-start",
    branch: opts.branchName,
    story_id: opts.storyId,
    epic_id: opts.epicId,
    base_branch: opts.baseBranch,
    mode: opts.storyId === null ? "epic-only" : "story"
  });
  return entry;
}
async function branchAttach(opts) {
  const branch = opts.branchName ?? currentBranch({ cwd: opts.projectRoot });
  const entry = await attach({
    registryPath: opts.registryPath,
    branch,
    storyId: opts.storyId,
    baseBranch: opts.baseBranch ?? "main",
    epicId: opts.epicId ?? null,
    recordOpts: {
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir ?? ""
    },
    ...opts.notes !== void 0 ? { notes: opts.notes } : {}
  });
  await emitBranchEvent(opts.telemetryDir, {
    kind: "branch-attach",
    branch,
    story_id: opts.storyId,
    epic_id: opts.epicId ?? null,
    base_branch: opts.baseBranch ?? "main"
  });
  return entry;
}
async function branchInfo(opts) {
  const branch = opts.branch ?? currentBranch({ cwd: opts.projectRoot });
  const entry = await findByBranch({
    registryPath: opts.registryPath,
    branch
  });
  return { branch, entry };
}
async function branchMerge(opts) {
  const entries = await findByStory({
    registryPath: opts.registryPath,
    storyId: opts.storyId
  });
  const entry = entries.find((b) => b.status === "active");
  if (!entry) {
    throw new Error(
      `no active branch in registry for story ${opts.storyId}`
    );
  }
  const sourceBranch = entry.branch;
  if (!branchExists(sourceBranch, { cwd: opts.projectRoot })) {
    throw new Error(
      `git is missing the source branch: ${sourceBranch}`
    );
  }
  if (!branchExists(opts.targetBranch, { cwd: opts.projectRoot })) {
    throw new Error(
      `target branch does not exist: ${opts.targetBranch}`
    );
  }
  const messageWithTrailer = `${opts.commitMessage}

Story-Id: ${opts.storyId}
`;
  squashMerge(
    sourceBranch,
    opts.targetBranch,
    messageWithTrailer,
    { cwd: opts.projectRoot }
  );
  await updateStatus({
    registryPath: opts.registryPath,
    branch: sourceBranch,
    status: "merged",
    // last_synced_at: без этого story-branches в эпик-flow остаются
    // с null timestamp'ом навсегда (`tdsDeliver` post-merge
    // пропускает уже-merged entries — `if (s.status === "active")`).
    // Caused callisto pilot null'ы 2026-05-06.
    fields: { last_synced_at: (/* @__PURE__ */ new Date()).toISOString() },
    recordOpts: {
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir ?? ""
    }
  });
  let sourceDeleted = false;
  if (opts.deleteSource ?? true) {
    forceDeleteBranch(sourceBranch, { cwd: opts.projectRoot });
    sourceDeleted = true;
  }
  await emitBranchEvent(opts.telemetryDir, {
    kind: "branch-merge",
    source_branch: sourceBranch,
    target_branch: opts.targetBranch,
    story_id: opts.storyId,
    source_deleted: sourceDeleted
  });
  return {
    storyId: opts.storyId,
    sourceBranch,
    targetBranch: opts.targetBranch,
    commitMessage: opts.commitMessage,
    sourceDeleted
  };
}
async function branchPrune(opts) {
  const doc = readRegistryDoc(opts.registryPath);
  const removed = [];
  const kept = [];
  for (const b of doc.branches ?? []) {
    const isMerged = b.status === "merged";
    const matchesScope = opts.epicId ? b.epic_id === opts.epicId : true;
    if (isMerged && matchesScope) {
      removed.push({ branch: b.branch, story_id: b.story_id, epic_id: b.epic_id });
    } else {
      kept.push(b);
    }
  }
  if (removed.length === 0) {
    await emitBranchEvent(opts.telemetryDir, {
      kind: "branch-prune",
      removed_count: 0,
      kept_count: kept.length,
      scope_epic: opts.epicId ?? null
    });
    return { removed: [], kept_count: kept.length };
  }
  doc.branches = kept;
  await writeRegistryDoc(opts.registryPath, doc, {
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir ?? ""
  });
  await emitBranchEvent(opts.telemetryDir, {
    kind: "branch-prune",
    removed_count: removed.length,
    kept_count: kept.length,
    scope_epic: opts.epicId ?? null
  });
  return { removed, kept_count: kept.length };
}
async function branchRemove(opts) {
  let removedFromRegistry = false;
  try {
    await remove({
      registryPath: opts.registryPath,
      branch: opts.branch,
      recordOpts: {
        manifestPath: opts.manifestPath,
        projectRoot: opts.projectRoot,
        recordedBy: opts.recordedBy,
        telemetryDir: opts.telemetryDir ?? ""
      }
    });
    removedFromRegistry = true;
  } catch (err) {
    if (!(err instanceof Error) || !/not found/i.test(err.message)) {
      throw err;
    }
  }
  let removedFromGit = false;
  if (opts.deleteLocal) {
    if (branchExists(opts.branch, { cwd: opts.projectRoot })) {
      deleteBranch(opts.branch, { cwd: opts.projectRoot });
      removedFromGit = true;
    }
  }
  await emitBranchEvent(opts.telemetryDir, {
    kind: "branch-remove",
    branch: opts.branch,
    removed_from_registry: removedFromRegistry,
    removed_from_git: removedFromGit
  });
  return {
    branch: opts.branch,
    removedFromRegistry,
    removedFromGit
  };
}
async function branchPush(opts) {
  if (!opts.safe) {
    throw new Error(
      "tds branch push refuses to run without --safe (non-negotiable per spec \xA710.7; --force-with-lease is the only allowed mode)"
    );
  }
  pushForceWithLease(opts.branch, { cwd: opts.projectRoot });
  return { branch: opts.branch };
}
async function branchSync(opts) {
  const branch = currentBranch({ cwd: opts.projectRoot });
  try {
    pullRebase({ cwd: opts.projectRoot });
    await emitBranchEvent(opts.telemetryDir, {
      kind: "branch-sync",
      branch,
      synced: true,
      conflicts: false
    });
    return {
      synced: true,
      conflicts: false,
      branch,
      message: "rebase clean"
    };
  } catch (err) {
    if (err instanceof GitError) {
      const conflicts = /conflict/i.test(err.stderr);
      await emitBranchEvent(opts.telemetryDir, {
        kind: "branch-sync",
        branch,
        synced: false,
        conflicts
      });
      return {
        synced: false,
        conflicts,
        branch,
        message: err.stderr.trim() || err.message
      };
    }
    throw err;
  }
}
async function tdsCommit(opts) {
  if (opts.paths.length === 0) {
    throw new Error(
      "tds commit requires explicit paths after `--`: `tds commit --story=<id> -- <path1> <path2>`"
    );
  }
  const trailers = {
    "Story-Id": opts.storyId,
    ...opts.taskId !== void 0 ? { "Task-Id": opts.taskId } : {},
    ...opts.extraTrailers ?? {}
  };
  const { commitSha } = scopedCommit(opts.paths, opts.message, trailers, {
    cwd: opts.projectRoot
  });
  return {
    commitSha,
    storyId: opts.storyId,
    paths: opts.paths
  };
}

// src/cli/handlers/branch.ts
async function handleBranch(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(BRANCH_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown branch subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin4(paths.runtimeDir, "telemetry");
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny" && sub !== "info") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: `tds branch ${sub}`
      })
    };
  }
  const flags = rest.slice(1);
  try {
    if (sub === "start") {
      const storyIdRaw = parseFlag(flags, "story");
      const epicIdRaw = parseFlag(flags, "epic");
      const storyId = storyIdRaw ?? null;
      const epicId = epicIdRaw ?? null;
      if (!storyId && !epicId) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "branch start requires --story=<id> (story branch) or --epic=<id> (epic-integration branch)\n"
        };
      }
      const explicitName = parseFlag(flags, "name");
      let branchName;
      if (explicitName) {
        branchName = explicitName;
      } else if (storyId) {
        branchName = `story/${storyId}`;
      } else {
        const epicNumeric = epicId.replace(/^epic-/, "");
        const { epicTitleFromSprintStatus: epicTitleFromSprintStatus2, slugifyEpicTitle: slugifyEpicTitle2 } = await Promise.resolve().then(() => (init_sprint_status(), sprint_status_exports));
        const title = epicTitleFromSprintStatus2(paths.sprintStatusYaml, epicId);
        branchName = title ? `epic/${epicNumeric}-${slugifyEpicTitle2(title)}` : `epic/${epicNumeric}`;
      }
      const explicitBase = parseFlag(flags, "base");
      let baseBranch;
      if (explicitBase) {
        baseBranch = explicitBase;
      } else if (storyId) {
        try {
          const { currentBranch: currentBranch2 } = await Promise.resolve().then(() => (init_git(), git_exports));
          const cur = currentBranch2({ cwd: paths.projectRoot });
          baseBranch = /^epic\//.test(cur) ? cur : "main";
        } catch {
          baseBranch = "main";
        }
      } else {
        baseBranch = "main";
      }
      const result = await branchStart({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        storyId,
        baseBranch,
        branchName,
        epicId,
        telemetryDir,
        manifestPath: paths.stateManifestYaml,
        recordedBy: role
      });
      const flipKey = storyId ?? epicId ?? null;
      let sprintStatusUpdated = false;
      if (flipKey) {
        try {
          const { readSprintStatus: readSprintStatus2 } = await Promise.resolve().then(() => (init_sprint_status(), sprint_status_exports));
          const doc = readSprintStatus2({
            sprintStatusPath: paths.sprintStatusYaml
          });
          const current = doc.byKey.get(flipKey)?.status;
          let targetStatus = null;
          if (storyId) {
            if (current === "ready-for-dev" || current === void 0) {
              targetStatus = "tests-pending";
            }
          } else if (epicId) {
            if (current === "ready-for-dev" || current === "backlog" || current === void 0) {
              targetStatus = "in-progress";
            }
          }
          if (targetStatus !== null) {
            const { setSprintStatusByKey: setSprintStatusByKey2 } = await Promise.resolve().then(() => (init_set(), set_exports));
            const storyMdPath = storyId ? pathJoin4(
              paths.outputFolder,
              "implementation-artifacts",
              "stories",
              `${storyId}.md`
            ) : void 0;
            const { applyStateTransition: applyStateTransition2 } = await Promise.resolve().then(() => (init_apply_transition(), apply_transition_exports));
            const opts2 = {
              sprintStatusPath: paths.sprintStatusYaml,
              storyId: flipKey,
              newStatus: targetStatus,
              role,
              viaCommand: "tds branch start",
              telemetryDir,
              stateManifestPath: paths.stateManifestYaml,
              projectRoot: paths.projectRoot
            };
            if (storyMdPath !== void 0) opts2.storyMdPath = storyMdPath;
            await applyStateTransition2(opts2);
            sprintStatusUpdated = true;
            void setSprintStatusByKey2;
          }
        } catch {
        }
      }
      const env = envelope("branch start", EXIT.SUCCESS, {
        ...result,
        sprint_status_updated: sprintStatusUpdated
      });
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.branch} (story=${result.story_id}, epic=${result.epic_id}, base=${result.base_branch}${sprintStatusUpdated ? ", sprint-status: in-progress" : ""})
`,
        stderr: ""
      };
    }
    if (sub === "attach") {
      const storyIdRaw = parseFlag(flags, "story");
      const epicFlag = parseFlag(flags, "epic");
      const storyId = storyIdRaw ?? null;
      if (!storyId && !epicFlag) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "branch attach requires --story=<id> (story branch) or --epic=<id> (epic-integration branch)\n"
        };
      }
      const branchName = parseFlag(flags, "branch");
      const baseBranch = parseFlag(flags, "base");
      const notes = parseFlag(flags, "notes");
      const result = await branchAttach({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        storyId,
        ...branchName !== void 0 ? { branchName } : {},
        ...baseBranch !== void 0 ? { baseBranch } : {},
        ...epicFlag !== void 0 ? { epicId: epicFlag } : {},
        ...notes !== void 0 ? { notes } : {},
        telemetryDir,
        manifestPath: paths.stateManifestYaml,
        recordedBy: role
      });
      const env = envelope("branch attach", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.branch} attached (story=${result.story_id}, epic=${result.epic_id})
`,
        stderr: ""
      };
    }
    if (sub === "info") {
      const branchName = parseFlag(flags, "branch");
      const result = await branchInfo({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        ...branchName !== void 0 ? { branch: branchName } : {}
      });
      const env = envelope("branch info", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : result.entry ? `${result.branch}: story=${result.entry.story_id} status=${result.entry.status}
` : `${result.branch}: <not in registry>
`,
        stderr: ""
      };
    }
    if (sub === "merge") {
      const storyId = parseFlag(flags, "story");
      const targetBranch = parseFlag(flags, "target");
      const message = parseFlag(flags, "message") ?? parseFlag(flags, "m");
      if (!storyId || !targetBranch || !message) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "branch merge requires --story=<id> --target=<branch> --message=<text> (squash commit message)\n"
        };
      }
      const deleteSourceFlag = flags.includes("--no-delete-source") ? false : true;
      try {
        const result = await branchMerge({
          registryPath: paths.branchRegistryYaml,
          projectRoot: paths.projectRoot,
          storyId,
          targetBranch,
          commitMessage: message,
          deleteSource: deleteSourceFlag,
          telemetryDir,
          manifestPath: paths.stateManifestYaml,
          recordedBy: role
        });
        const env = envelope("branch merge", EXIT.SUCCESS, result);
        return {
          exitCode: EXIT.SUCCESS,
          stdout: wantJson ? JSON.stringify(env) : `squash-merged ${result.sourceBranch} \u2192 ${result.targetBranch} (story=${result.storyId}, source_deleted=${result.sourceDeleted})
`,
          stderr: ""
        };
      } catch (err) {
        const msg = err.message;
        const isConflict = /conflict|CONFLICT/i.test(msg);
        return {
          exitCode: isConflict ? EXIT.CONFLICT : EXIT.RUNTIME,
          stdout: "",
          stderr: `${msg}
`
        };
      }
    }
    if (sub === "prune") {
      const epicId = parseFlag(flags, "epic");
      const result = await branchPrune({
        registryPath: paths.branchRegistryYaml,
        ...epicId !== void 0 ? { epicId } : {},
        telemetryDir,
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        recordedBy: role
      });
      const env = envelope("branch prune", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `pruned ${result.removed.length} merged ${result.removed.length === 1 ? "entry" : "entries"} (${result.kept_count} kept)
` + result.removed.map((r) => `  - ${r.branch} (story=${r.story_id ?? "-"}, epic=${r.epic_id ?? "-"})`).join("\n") + (result.removed.length > 0 ? "\n" : ""),
        stderr: ""
      };
    }
    if (sub === "remove") {
      const branchName = parseFlag(flags, "branch");
      if (!branchName) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "branch remove requires --branch=<name>\n"
        };
      }
      const deleteLocal = flags.includes("--delete-local");
      const result = await branchRemove({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        branch: branchName,
        deleteLocal,
        telemetryDir,
        manifestPath: paths.stateManifestYaml,
        recordedBy: role
      });
      const env = envelope("branch remove", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.branch}: registry=${result.removedFromRegistry} git=${result.removedFromGit}
`,
        stderr: ""
      };
    }
    if (sub === "push") {
      const safe = flags.includes("--safe");
      const branchName = parseFlag(flags, "branch") ?? (await Promise.resolve().then(() => (init_git(), git_exports))).currentBranch({ cwd: paths.projectRoot });
      const result = await branchPush({
        projectRoot: paths.projectRoot,
        branch: branchName,
        safe
      });
      const env = envelope("branch push", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `pushed ${result.branch} (--force-with-lease)
`,
        stderr: ""
      };
    }
    if (sub === "sync") {
      const result = await branchSync({ projectRoot: paths.projectRoot, telemetryDir });
      const exitCode = result.synced ? EXIT.SUCCESS : result.conflicts ? EXIT.CONFLICT : EXIT.RUNTIME;
      const env = envelope("branch sync", exitCode, result);
      return {
        exitCode,
        stdout: wantJson ? JSON.stringify({ ...env, exit_code: exitCode }) : `${result.branch}: ${result.message}
`,
        stderr: ""
      };
    }
    return exhaustiveSwitch(sub, "branch");
  } catch (err) {
    return {
      exitCode: EXIT.RUNTIME,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
}

// src/cli/handlers/commit.ts
import { join as pathJoin5 } from "node:path";

// src/authz/frozen-tests-gate.ts
var import_yaml16 = __toESM(require_dist(), 1);
import { existsSync as existsSync19, readFileSync as readFileSync19 } from "node:fs";
var FROZEN_STATUS = "tests-approved";
function checkFrozenTestsGate(opts) {
  if (opts.role === "test-author") {
    return { shouldDeny: false, deniedPaths: [] };
  }
  if (!existsSync19(opts.sprintStatusPath)) {
    return { shouldDeny: false, deniedPaths: [] };
  }
  let raw;
  try {
    raw = (0, import_yaml16.parse)(readFileSync19(opts.sprintStatusPath, "utf8"));
  } catch {
    return { shouldDeny: false, deniedPaths: [] };
  }
  const dev = raw?.development_status;
  if (!dev || typeof dev !== "object") {
    return { shouldDeny: false, deniedPaths: [] };
  }
  const status = dev[opts.storyId];
  if (typeof status !== "string" || status !== FROZEN_STATUS) {
    return { shouldDeny: false, deniedPaths: [] };
  }
  const testFiles = opts.paths.filter(isTestFilePath);
  if (testFiles.length === 0) {
    return { shouldDeny: false, deniedPaths: [] };
  }
  return {
    shouldDeny: true,
    deniedPaths: [...testFiles],
    reason: `story ${opts.storyId} status=${FROZEN_STATUS} (frozen); role '${opts.role}' cannot edit test files: ${testFiles.join(", ")}. Run \`tds story unfreeze-tests --as=${opts.role} --story=${opts.storyId} --reason="<text>"\` first to flip status \u043A tests-needs-revision.`
  };
}

// src/cli/handlers/commit.ts
async function handleCommit(rest, wantJson) {
  const storyId = parseFlag(rest, "story");
  if (!storyId) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "tds commit requires --story=<id>\n"
    };
  }
  const taskId = parseFlag(rest, "task-id");
  let message = "";
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "-m" && i + 1 < rest.length) {
      message = rest[i + 1];
      break;
    }
  }
  if (!message) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "tds commit requires -m <message>\n"
    };
  }
  const ddIdx = rest.indexOf("--");
  if (ddIdx < 0 || ddIdx === rest.length - 1) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "tds commit requires `-- <path1> <path2>` (explicit scoped paths)\n"
    };
  }
  const paths = rest.slice(ddIdx + 1).filter((p) => !p.startsWith("--"));
  if (paths.length === 0) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "tds commit requires at least one path after `--`\n"
    };
  }
  let resolved;
  try {
    resolved = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin5(resolved.runtimeDir, "telemetry");
  const decision = await checkRoleSkillOperation({
    role,
    op: "code-write",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "code-write",
        reason: decision.reason,
        command: "tds commit"
      })
    };
  }
  const frozenGate = checkFrozenTestsGate({
    role,
    storyId,
    paths,
    sprintStatusPath: resolved.sprintStatusYaml
  });
  if (frozenGate.shouldDeny) {
    const frozenDecision = await checkRoleSkillOperation({
      role,
      op: "test-edit-frozen",
      telemetryDir,
      matrixPath: SPEC_MATRIX_PATH
    });
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "test-edit-frozen",
        reason: frozenGate.reason ?? frozenDecision.reason,
        command: "tds commit"
      })
    };
  }
  const preImpl = checkPreImplStatus({
    role,
    projectRoot: resolved.projectRoot,
    registryPath: resolved.branchRegistryYaml,
    sprintStatusPath: resolved.sprintStatusYaml
  });
  if (preImpl.shouldDeny) {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "code-write/pre-impl-status",
        reason: preImpl.reason ?? "denied by pre-impl gate",
        command: "tds commit"
      }) + (preImpl.recovery ? `${preImpl.recovery}
` : "")
    };
  }
  try {
    const result = await tdsCommit({
      projectRoot: resolved.projectRoot,
      storyId,
      paths,
      message,
      ...taskId !== void 0 ? { taskId } : {}
    });
    const env = envelope("commit", EXIT.SUCCESS, result);
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : `${result.commitSha} (story=${result.storyId}, ${result.paths.length} file(s))
`,
      stderr: ""
    };
  } catch (err) {
    return {
      exitCode: EXIT.RUNTIME,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
}

// src/cli/handlers/pr.ts
import { join as pathJoin6 } from "node:path";

// src/branch/pr.ts
init_registry();
init_emit();
async function emitPrEvent(telemetryDir, event) {
  if (!telemetryDir) return;
  try {
    await emit({ telemetryDir, stream: "pr-events", event });
  } catch {
  }
}
async function prCreate(opts) {
  const entry = await findByBranch({
    registryPath: opts.registryPath,
    branch: opts.branch
  });
  if (!entry) {
    throw new Error(
      `branch ${opts.branch} not in registry \u2014 run \`tds branch start\` or \`tds branch attach\` first`
    );
  }
  const adapter = opts.adapterOverride ?? detectAdapter({ projectRoot: opts.projectRoot });
  const created = await adapter.createPR({
    head: opts.branch,
    base: opts.base,
    title: opts.title,
    body: opts.body,
    ...opts.draft !== void 0 ? { draft: opts.draft } : {}
  });
  await emitPrEvent(opts.telemetryDir, {
    kind: "pr-create",
    pr_number: created.number,
    branch: opts.branch,
    base: opts.base,
    host_id: adapter.id
  });
  await updateStatus({
    registryPath: opts.registryPath,
    branch: opts.branch,
    status: entry.status,
    // unchanged
    fields: {
      pr_url: created.url,
      pr_number: created.number
    },
    recordOpts: {
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir ?? ""
    }
  });
  return {
    url: created.url,
    number: created.number,
    branch: opts.branch,
    storyId: opts.storyId
  };
}
async function prUpdate(opts) {
  const entry = await findByBranch({
    registryPath: opts.registryPath,
    branch: opts.branch
  });
  if (!entry || entry.pr_number === null) {
    throw new Error(
      `branch ${opts.branch} has no associated PR (run \`tds pr create\` first)`
    );
  }
  const adapter = opts.adapterOverride ?? detectAdapter({ projectRoot: opts.projectRoot });
  const r = await adapter.updatePR({
    number: entry.pr_number,
    ...opts.title !== void 0 ? { title: opts.title } : {},
    ...opts.body !== void 0 ? { body: opts.body } : {}
  });
  return {
    url: r.url || (entry.pr_url ?? ""),
    number: entry.pr_number,
    branch: opts.branch
  };
}
async function prMergeStatus(opts) {
  const entry = await assertHasPR(opts.registryPath, opts.branch);
  const adapter = opts.adapterOverride ?? detectAdapter({ projectRoot: opts.projectRoot });
  const status = await adapter.getStatus(entry.pr_number);
  await emitPrEvent(opts.telemetryDir, {
    kind: "pr-merge-status-cli",
    pr_number: entry.pr_number,
    mergeable: status.mergeable,
    transitional: status.transitional,
    blocked_by: status.blockedBy,
    ci_state: status.ciState,
    host_id: adapter.id
  });
  return { ...status, branch: opts.branch, prNumber: entry.pr_number };
}
async function prMerge(opts) {
  const entry = await assertHasPR(opts.registryPath, opts.branch);
  const adapter = opts.adapterOverride ?? detectAdapter({ projectRoot: opts.projectRoot });
  const status = await adapter.getStatus(entry.pr_number);
  if (!status.mergeable) {
    throw new Error(
      `PR #${entry.pr_number} on ${opts.branch} is not mergeable: ${status.blockedBy ?? status.ciState}`
    );
  }
  const merged = await adapter.squashMerge(entry.pr_number);
  if (merged.commitSha === null) {
    await emitPrEvent(opts.telemetryDir, {
      kind: "pr-merge",
      pr_number: entry.pr_number,
      merged: false,
      awaiting_ci: true,
      host_id: adapter.id
    });
    throw new Error(
      `PR #${entry.pr_number} ${opts.branch}: host set'\u043D\u0443\u043B auto-merge (CI \u0435\u0449\u0451 running). Run \`tds sync --as=engineer\` \u043F\u043E\u0441\u043B\u0435 CI passes \u2014 registry status flip'\u043D\u0435\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 post-merge sync. \u0414\u043B\u044F cumulative epic-level merge \u0441 poll-loop'\u043E\u043C \u2014 use \`tds deliver\`.`
    );
  }
  await updateStatus({
    registryPath: opts.registryPath,
    branch: opts.branch,
    status: "merged",
    fields: {
      last_synced_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    recordOpts: {
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir ?? ""
    }
  });
  await emitPrEvent(opts.telemetryDir, {
    kind: "pr-merge",
    pr_number: entry.pr_number,
    merged: true,
    awaiting_ci: false,
    host_id: adapter.id
  });
  return {
    branch: opts.branch,
    storyId: entry.story_id,
    prNumber: entry.pr_number,
    mergeStrategy: "squash",
    mergeCommitSha: merged.commitSha,
    reviewers: status.reviewers
  };
}
async function assertHasPR(registryPath, branch) {
  const entry = await findByBranch({ registryPath, branch });
  if (!entry || entry.pr_number === null) {
    throw new Error(
      `branch ${branch} has no associated PR (run \`tds pr create\` first)`
    );
  }
  return entry;
}

// src/cli/handlers/pr.ts
async function handlePr(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(PR_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown pr subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin6(paths.runtimeDir, "telemetry");
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny" && sub !== "merge-status") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: `tds pr ${sub}`
      })
    };
  }
  const flags = rest.slice(1);
  const branch = parseFlag(flags, "branch");
  if (!branch) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `pr ${sub} requires --branch=<name>
`
    };
  }
  try {
    if (sub === "create") {
      const storyId = parseFlag(flags, "story");
      const base = parseFlag(flags, "base");
      const title = parseFlag(flags, "title");
      const body = parseFlag(flags, "body");
      if (!storyId || !base || !title || !body) {
        return {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: "pr create requires --story, --branch, --base, --title, --body\n"
        };
      }
      const draft = flags.includes("--draft");
      const result = await prCreate({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        storyId,
        branch,
        base,
        title,
        body,
        draft,
        telemetryDir,
        manifestPath: paths.stateManifestYaml,
        recordedBy: role
      });
      const env = envelope("pr create", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.url}
`,
        stderr: ""
      };
    }
    if (sub === "update") {
      const title = parseFlag(flags, "title");
      const body = parseFlag(flags, "body");
      const result = await prUpdate({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        branch,
        ...title !== void 0 ? { title } : {},
        ...body !== void 0 ? { body } : {}
      });
      const env = envelope("pr update", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.url}
`,
        stderr: ""
      };
    }
    if (sub === "merge-status") {
      const result = await prMergeStatus({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        branch,
        telemetryDir
      });
      const env = envelope("pr merge-status", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `mergeable=${result.mergeable} ci=${result.ciState} approvals=${result.approvals}
`,
        stderr: ""
      };
    }
    if (sub === "merge") {
      const result = await prMerge({
        registryPath: paths.branchRegistryYaml,
        projectRoot: paths.projectRoot,
        branch,
        telemetryDir,
        manifestPath: paths.stateManifestYaml,
        recordedBy: role
      });
      let reviewedByWrittenTo = null;
      let reviewedByError = null;
      if (result.storyId && result.reviewers.length > 0) {
        const storyMdPath = pathJoin6(
          paths.outputFolder,
          "implementation-artifacts",
          "stories",
          `${result.storyId}.md`
        );
        try {
          const { readStoryFrontmatter: readStoryFrontmatter2, writeStoryFrontmatter: writeStoryFrontmatter2 } = await Promise.resolve().then(() => (init_story_frontmatter(), story_frontmatter_exports));
          if (readStoryFrontmatter2(storyMdPath) !== null) {
            await writeStoryFrontmatter2(
              storyMdPath,
              { appendReviewers: result.reviewers },
              {
                manifestPath: paths.stateManifestYaml,
                projectRoot: paths.projectRoot,
                recordedBy: "auditor",
                storyId: result.storyId,
                telemetryDir
              }
            );
            reviewedByWrittenTo = storyMdPath;
          }
        } catch (err) {
          reviewedByError = err.message;
        }
      }
      const augmented = { ...result, reviewedByWrittenTo, reviewedByError };
      const env = envelope("pr merge", EXIT.SUCCESS, augmented);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `merged ${result.branch} (${result.mergeCommitSha.slice(0, 12)}\u2026)` + (result.reviewers.length > 0 ? ` reviewed-by=${result.reviewers.join(",")}` : "") + (reviewedByWrittenTo ? ` [story-md updated]` : "") + "\n",
        stderr: ""
      };
    }
    return exhaustiveSwitch(sub, "pr");
  } catch (err) {
    const msg = err.message;
    const exitCode = /not mergeable/i.test(msg) ? EXIT.CONFLICT : EXIT.RUNTIME;
    return {
      exitCode,
      stdout: "",
      stderr: `${msg}
`
    };
  }
}

// src/cli/handlers/deliver.ts
import { join as pathJoin7 } from "node:path";

// src/branch/deliver.ts
init_registry();
init_git();
init_set();
init_sprint_status();
init_emit();
var APPROVED_OR_DONE = /* @__PURE__ */ new Set(["approved", "done"]);
function validatePreMergeApprovedState(opts) {
  const doc = readSprintStatus(
    opts.extensionPath !== void 0 ? { sprintStatusPath: opts.sprintStatusPath, extensionPath: opts.extensionPath } : { sprintStatusPath: opts.sprintStatusPath }
  );
  const epicStatus = doc.byKey.get(opts.epicId)?.status ?? null;
  if (epicStatus !== null && !APPROVED_OR_DONE.has(epicStatus)) {
    return {
      ok: false,
      reason: `Epic '${opts.epicId}' is at status '${epicStatus}'; tds deliver requires epic at 'approved' (run \`/bmad-tds-code-review --epic=${opts.epicId}\` to get there) or 'done' (idempotent re-run).`
    };
  }
  const stories = doc.storiesByEpic.get(opts.epicId) ?? [];
  const wrong = [];
  for (const s of stories) {
    if (!APPROVED_OR_DONE.has(s.status)) {
      wrong.push({ id: s.key, status: s.status });
    }
  }
  if (wrong.length > 0) {
    return {
      ok: false,
      reason: `tds deliver requires all in-scope stories at 'approved' or 'done'; ${wrong.length} are not: ` + wrong.map((s) => `${s.id}=${s.status}`).join(", ") + `. Run \`tds review apply-verdict --epic=${opts.epicId}\` to flip review\u2192approved per ADR-0016 \xA7D.`
    };
  }
  return { ok: true };
}
async function emitPrEvent2(telemetryDir, event) {
  if (!telemetryDir) return;
  try {
    await emit({ telemetryDir, stream: "pr-events", event });
  } catch {
  }
}
function defaultSleep2(ms) {
  return new Promise((resolve6) => setTimeout(resolve6, ms));
}
async function pollUntilMerged(args) {
  const start = Date.now();
  while (Date.now() - start < args.timeoutMs) {
    await args.sleep(args.intervalMs);
    const elapsedMs = Date.now() - start;
    args.onTick?.({ elapsedMs, prNumber: args.prNumber });
    const status = await args.adapter.getStatus(args.prNumber);
    await emitPrEvent2(args.telemetryDir, {
      kind: "poll-tick",
      pr_number: args.prNumber,
      elapsed_ms: elapsedMs,
      pr_state: status.state ?? "open",
      mergeable: status.mergeable,
      transitional: status.transitional,
      host_id: args.adapter.id
    });
    if (status.state === "merged" && status.mergeCommitSha) {
      return status.mergeCommitSha;
    }
    if (status.state === "closed") {
      throw new Error(
        `PR #${args.prNumber} closed \u0431\u0435\u0437 merge \u0432\u043E \u0432\u0440\u0435\u043C\u044F poll-loop'\u0430 (\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E host detected conflict, \u043B\u0438\u0431\u043E closed manually). Inspect MR + run \`tds sync\` \u0435\u0441\u043B\u0438 merge \u0432\u0441\u0451-\u0442\u0430\u043A\u0438 \u043F\u0440\u043E\u0438\u0437\u043E\u0448\u0451\u043B.`
      );
    }
  }
  throw new Error(
    `merge timeout (${args.timeoutMs}ms) \u0434\u043B\u044F PR #${args.prNumber}: auto-merge \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D \u043D\u0430 host'\u0435, \u043D\u043E CI \u0435\u0449\u0451 running. Run \`tds sync --as=engineer\` \u043F\u043E\u0441\u043B\u0435 \u0442\u043E\u0433\u043E \u043A\u0430\u043A pipeline \u043F\u0440\u043E\u0439\u0434\u0451\u0442 \u2014 flip sprint-status statuses \u043F\u043E\u0434\u0445\u0432\u0430\u0442\u044F\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 post-merge sync.`
  );
}
async function tdsDeliver(opts) {
  const autoMerge = opts.autoMerge ?? true;
  const deliverStart = Date.now();
  const adapter = opts.adapterOverride ?? detectAdapter({ projectRoot: opts.projectRoot });
  await emitPrEvent2(opts.telemetryDir, {
    kind: "deliver-start",
    epic_id: opts.epicId,
    epic_branch: opts.epicBranch,
    default_branch: opts.defaultBranch,
    auto_merge: autoMerge,
    host_id: adapter.id
  });
  let merged = false;
  let mergeCommitSha = null;
  try {
    if (opts.sprintStatusPath) {
      const validation = validatePreMergeApprovedState({
        sprintStatusPath: opts.sprintStatusPath,
        epicId: opts.epicId,
        ...opts.extensionPath !== void 0 ? { extensionPath: opts.extensionPath } : {}
      });
      if (!validation.ok) {
        await emitPrEvent2(opts.telemetryDir, {
          kind: "deliver-end",
          epic_id: opts.epicId,
          merged: false,
          has_merge_commit: false,
          duration_ms: Date.now() - deliverStart,
          error_class: "PreMergeValidation",
          error_reason: validation.reason
        });
        throw new Error(validation.reason);
      }
    }
    pushPlain(opts.epicBranch, { cwd: opts.projectRoot });
    let prNumber;
    let prUrl;
    let prReused = false;
    const existing = await adapter.findPRForBranch(opts.epicBranch);
    if (existing) {
      prNumber = existing.number;
      prUrl = existing.url;
      prReused = true;
    } else {
      const created = await adapter.createPR({
        head: opts.epicBranch,
        base: opts.defaultBranch,
        title: opts.title,
        body: opts.body
      });
      prNumber = created.number;
      prUrl = created.url;
      await emitPrEvent2(opts.telemetryDir, {
        kind: "pr-create",
        pr_number: prNumber,
        branch: opts.epicBranch,
        base: opts.defaultBranch,
        host_id: adapter.id
      });
    }
    if (autoMerge) {
      const status = await adapter.getStatus(prNumber);
      if (status.state === "merged" && status.mergeCommitSha) {
        merged = true;
        mergeCommitSha = status.mergeCommitSha;
        await emitPrEvent2(opts.telemetryDir, {
          kind: "deliver-resumed",
          epic_id: opts.epicId,
          pr_number: prNumber,
          merge_commit_sha: status.mergeCommitSha,
          pr_was_reused: prReused,
          host_id: adapter.id
        });
      } else {
        const willProceed = status.mergeable || status.transitional;
        await emitPrEvent2(opts.telemetryDir, {
          kind: "mergeability-check",
          pr_number: prNumber,
          mergeable: status.mergeable,
          transitional: status.transitional,
          blocked_by: status.blockedBy,
          ci_state: status.ciState,
          decision: willProceed ? "proceed" : "throw",
          host_id: adapter.id
        });
        if (!willProceed) {
          throw new Error(
            `epic PR #${prNumber} not mergeable: ${status.blockedBy ?? status.ciState}`
          );
        }
        const m = await adapter.squashMerge(prNumber);
        await emitPrEvent2(opts.telemetryDir, {
          kind: "squash-attempt",
          pr_number: prNumber,
          awaiting_ci: m.awaitingCi,
          has_commit_sha: m.commitSha !== null,
          host_id: adapter.id
        });
        if (m.commitSha !== null) {
          merged = true;
          mergeCommitSha = m.commitSha;
        } else if (m.awaitingCi) {
          mergeCommitSha = await pollUntilMerged({
            adapter,
            prNumber,
            timeoutMs: opts.pollTimeoutMs ?? 30 * 60 * 1e3,
            intervalMs: opts.pollIntervalMs ?? 3e4,
            sleep: opts.sleepFn ?? defaultSleep2,
            ...opts.telemetryDir !== void 0 ? { telemetryDir: opts.telemetryDir } : {},
            ...opts.onPollTick !== void 0 ? { onTick: opts.onPollTick } : {}
          });
          merged = true;
        } else {
          throw new Error(
            `squashMerge for PR #${prNumber} returned \u043D\u0435\u043A\u043E\u043D\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u043D\u044B\u0439 result: commitSha=null & awaitingCi=false`
          );
        }
      }
    }
    let branchDeletedLocal = false;
    if (merged) {
      if (branchExists(opts.epicBranch, { cwd: opts.projectRoot })) {
        try {
          deleteBranch(opts.epicBranch, { cwd: opts.projectRoot });
          branchDeletedLocal = true;
        } catch {
        }
      } else {
        branchDeletedLocal = true;
      }
    }
    const stories = await findByEpic({
      registryPath: opts.registryPath,
      epicId: opts.epicId
    });
    let storiesTransitioned = 0;
    if (merged) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      for (const s of stories) {
        if (s.status === "active") {
          await updateStatus({
            registryPath: opts.registryPath,
            branch: s.branch,
            status: "merged",
            fields: { last_synced_at: now, pr_url: s.pr_url },
            recordOpts: {
              manifestPath: opts.manifestPath,
              projectRoot: opts.projectRoot,
              recordedBy: opts.recordedBy,
              telemetryDir: opts.telemetryDir ?? ""
            }
          });
          storiesTransitioned++;
        }
      }
      const epicEntry = stories.find((s) => s.branch === opts.epicBranch);
      if (!epicEntry) {
      }
    }
    const sprintStatusFlips = [];
    const storyFlipsFailed = [];
    let epicFlipFailed = null;
    if (merged && opts.sprintStatusPath && opts.telemetryDir) {
      const triggeredBy = opts.triggeredBy ?? "engineer";
      for (const s of stories) {
        if (!s.story_id) continue;
        try {
          await setSprintStatusByKey({
            sprintStatusPath: opts.sprintStatusPath,
            storyId: s.story_id,
            newStatus: "done",
            telemetryDir: opts.telemetryDir,
            triggeredBy,
            viaCommand: "tds deliver (post-merge)"
          });
          sprintStatusFlips.push({ key: s.story_id, before: null, after: "done" });
        } catch (err) {
          const message = err.message;
          storyFlipsFailed.push({ storyId: s.story_id, error: message });
          sprintStatusFlips.push({
            key: s.story_id,
            before: null,
            after: `flip failed: ${message}`
          });
        }
      }
      try {
        await setSprintStatusByKey({
          sprintStatusPath: opts.sprintStatusPath,
          storyId: opts.epicId,
          newStatus: "done",
          telemetryDir: opts.telemetryDir,
          triggeredBy,
          viaCommand: "tds deliver (post-merge)",
          kind: "epic"
        });
        sprintStatusFlips.push({ key: opts.epicId, before: null, after: "done" });
      } catch (err) {
        const message = err.message;
        epicFlipFailed = { error: message };
        sprintStatusFlips.push({
          key: opts.epicId,
          before: null,
          after: `flip failed: ${message}`
        });
      }
    }
    const partialFailure = storyFlipsFailed.length > 0 || epicFlipFailed !== null ? { storyFlipsFailed, epicFlipFailed } : null;
    await emitPrEvent2(opts.telemetryDir, {
      kind: "deliver-end",
      epic_id: opts.epicId,
      merged,
      has_merge_commit: mergeCommitSha !== null,
      duration_ms: Date.now() - deliverStart,
      stories_transitioned: storiesTransitioned
    });
    return {
      epicId: opts.epicId,
      epicBranch: opts.epicBranch,
      prUrl,
      prNumber,
      prReused,
      merged,
      mergeCommitSha,
      storiesTransitioned,
      sprintStatusFlips,
      partialFailure,
      branchDeletedLocal
    };
  } catch (err) {
    await emitPrEvent2(opts.telemetryDir, {
      kind: "deliver-end",
      epic_id: opts.epicId,
      merged,
      has_merge_commit: mergeCommitSha !== null,
      duration_ms: Date.now() - deliverStart,
      error_class: err.name || "Error"
    });
    throw err;
  }
}

// src/cli/handlers/deliver.ts
async function handleDeliver(rest, wantJson) {
  const epicId = parseFlag(rest, "epic");
  const epicBranch = parseFlag(rest, "epic-branch");
  const defaultBranch = parseFlag(rest, "default-branch") ?? "main";
  const title = parseFlag(rest, "title");
  const body = parseFlag(rest, "body");
  if (!epicId || !epicBranch || !title || !body) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "deliver requires --epic, --epic-branch, --title, --body\n"
    };
  }
  const autoMerge = !rest.includes("--no-auto-merge");
  const pollTimeoutMs = parseDuration(parseFlag(rest, "poll-timeout")) ?? 30 * 60 * 1e3;
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return { exitCode: EXIT.PRECONDITION, stdout: "", stderr: `${err.message}
` };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin7(paths.runtimeDir, "telemetry");
  const decision = await checkRoleSkillOperation({
    role,
    op: "state-set",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "state-set",
        reason: decision.reason,
        command: "tds deliver"
      })
    };
  }
  try {
    const result = await tdsDeliver({
      registryPath: paths.branchRegistryYaml,
      projectRoot: paths.projectRoot,
      epicId,
      epicBranch,
      defaultBranch,
      title,
      body,
      autoMerge,
      sprintStatusPath: paths.sprintStatusYaml,
      extensionPath: pathJoin7(paths.tdsStateDir, "sprint-status-extension.yaml"),
      telemetryDir,
      triggeredBy: role,
      pollTimeoutMs,
      manifestPath: paths.stateManifestYaml,
      recordedBy: role,
      onPollTick: ({ elapsedMs, prNumber }) => {
        const elapsedMin = Math.floor(elapsedMs / 6e4);
        const elapsedSec = Math.floor(elapsedMs % 6e4 / 1e3);
        const human = elapsedMin > 0 ? `${elapsedMin}m ${elapsedSec}s` : `${elapsedSec}s`;
        process.stderr.write(
          `[tds deliver] PR #${prNumber}: waiting for CI\u2026 (elapsed ${human})
`
        );
      }
    });
    const exitCode = result.partialFailure !== null ? EXIT.RUNTIME : EXIT.SUCCESS;
    const env = envelope("deliver", exitCode, result);
    const flipsLine = result.sprintStatusFlips.length > 0 ? `; flipped ${result.sprintStatusFlips.length} sprint-status keys` : "";
    const partialLine = result.partialFailure !== null ? ` [PARTIAL-DELIVER: ${result.partialFailure.storyFlipsFailed.length} story flip(s)` + (result.partialFailure.epicFlipFailed !== null ? " + epic flip" : "") + ` failed after merge \u2014 re-run \`tds deliver\` to resume]` : "";
    const stderrLine = result.partialFailure !== null ? `tds deliver: PARTIAL-DELIVER after merge \u2014 flips remaining:
` + result.partialFailure.storyFlipsFailed.map((f) => `  story ${f.storyId}: ${f.error}`).join("\n") + (result.partialFailure.epicFlipFailed !== null ? `
  epic ${result.epicId}: ${result.partialFailure.epicFlipFailed.error}` : "") + `
Recovery: re-run \`tds deliver --epic=${result.epicId} ...\` (host-already-merged short-circuit resumes flips).
` : "";
    return {
      exitCode,
      stdout: wantJson ? JSON.stringify(env) : `epic ${result.epicId}: PR ${result.prUrl}${result.prReused ? " [reused]" : ""}` + (result.merged ? ` (merged: ${result.mergeCommitSha?.slice(0, 12)}\u2026, stories=${result.storiesTransitioned}${flipsLine}${result.branchDeletedLocal ? ", local branch deleted" : ""})${partialLine}
` : ` [PR opened, auto-merge=false \u2014 run \`tds sync\` after host-merge]
`),
      stderr: stderrLine
    };
  } catch (err) {
    const msg = err.message;
    const exitCode = /not mergeable/i.test(msg) ? EXIT.CONFLICT : EXIT.RUNTIME;
    return { exitCode, stdout: "", stderr: `${msg}
` };
  }
}

// src/cli/handlers/sync.ts
import { join as pathJoin8 } from "node:path";

// src/branch/sync.ts
init_registry();
var import_yaml17 = __toESM(require_dist(), 1);
init_emit();
init_apply_transition();
import { readFileSync as readFileSync20, existsSync as existsSync20 } from "node:fs";
import { join as join9 } from "node:path";
function readAllActive(path) {
  if (!existsSync20(path)) return [];
  const parsed = (0, import_yaml17.parse)(readFileSync20(path, "utf8")) ?? {};
  return (parsed.branches ?? []).filter((b) => b.status === "active");
}
async function tdsSync(opts) {
  const active = await listActive({ registryPath: opts.registryPath });
  void active;
  const entries = readAllActive(opts.registryPath);
  const adapter = opts.adapterOverride ?? (entries.some((e) => e.pr_number !== null) ? detectAdapter({ projectRoot: opts.projectRoot }) : null);
  const syncedBranches = [];
  const skipped = [];
  const storyFlips = [];
  for (const entry of entries) {
    if (entry.pr_number === null) {
      skipped.push(entry.branch);
      continue;
    }
    if (!adapter) {
      skipped.push(entry.branch);
      continue;
    }
    const status = await adapter.getStatus(entry.pr_number);
    const looksMerged = /^merged$/i.test(status.ciState) || /merged/i.test(status.blockedBy ?? "");
    if (looksMerged) {
      await updateStatus({
        registryPath: opts.registryPath,
        branch: entry.branch,
        status: "merged",
        fields: { last_synced_at: (/* @__PURE__ */ new Date()).toISOString() },
        recordOpts: {
          manifestPath: opts.manifestPath,
          projectRoot: opts.projectRoot,
          recordedBy: opts.recordedBy,
          telemetryDir: opts.telemetryDir ?? ""
        }
      });
      syncedBranches.push({
        branch: entry.branch,
        prNumber: entry.pr_number,
        statusBefore: entry.status,
        statusAfter: "merged"
      });
      if (entry.story_id) {
        const flipReport = await flipStoryApprovedToDone({
          opts,
          storyId: entry.story_id,
          branch: entry.branch
        });
        storyFlips.push(flipReport);
      }
    } else {
      skipped.push(entry.branch);
    }
  }
  if (opts.telemetryDir) {
    try {
      await emit({
        telemetryDir: opts.telemetryDir,
        stream: "branch-events",
        event: {
          kind: "registry-reconcile",
          synced_count: syncedBranches.length
        }
      });
    } catch {
    }
  }
  return { syncedBranches, skipped, storyFlips };
}
function readStatus(sprintStatusPath, storyId) {
  if (!existsSync20(sprintStatusPath)) return null;
  try {
    const parsed = (0, import_yaml17.parse)(readFileSync20(sprintStatusPath, "utf8")) ?? {};
    const v = parsed.development_status?.[storyId];
    return typeof v === "string" ? v : null;
  } catch {
    return null;
  }
}
async function flipStoryApprovedToDone(args) {
  const { opts, storyId, branch } = args;
  if (!opts.sprintStatusPath) {
    return {
      storyId,
      branch,
      statusBefore: null,
      statusAfter: null,
      flipped: false,
      skipReason: "no-sprint-status"
    };
  }
  const statusBefore = readStatus(opts.sprintStatusPath, storyId);
  if (statusBefore === null) {
    return {
      storyId,
      branch,
      statusBefore: null,
      statusAfter: null,
      flipped: false,
      skipReason: "missing-key"
    };
  }
  if (statusBefore === "done") {
    return {
      storyId,
      branch,
      statusBefore,
      statusAfter: statusBefore,
      flipped: false,
      skipReason: "already-done"
    };
  }
  if (statusBefore !== "approved") {
    return {
      storyId,
      branch,
      statusBefore,
      statusAfter: statusBefore,
      flipped: false,
      skipReason: "not-approved"
    };
  }
  const storyMdPath = opts.storiesDir ? join9(opts.storiesDir, `${storyId}.md`) : void 0;
  try {
    await applyStateTransition({
      sprintStatusPath: opts.sprintStatusPath,
      storyId,
      newStatus: "done",
      role: "engineer",
      kind: "story",
      viaCommand: "tds sync",
      ...opts.telemetryDir ? { telemetryDir: opts.telemetryDir } : {},
      ...storyMdPath ? { storyMdPath } : {},
      stateManifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      ...opts.pythonBin ? { pythonBin: opts.pythonBin } : {}
    });
    return {
      storyId,
      branch,
      statusBefore,
      statusAfter: "done",
      flipped: true
    };
  } catch (err) {
    if (err instanceof StateTransitionDeniedError) {
      return {
        storyId,
        branch,
        statusBefore,
        statusAfter: statusBefore,
        flipped: false,
        skipReason: "deny",
        denyReason: err.reason
      };
    }
    throw err;
  }
}

// src/cli/handlers/sync.ts
async function handleSync(rest, wantJson) {
  void rest;
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return { exitCode: EXIT.PRECONDITION, stdout: "", stderr: `${err.message}
` };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin8(paths.runtimeDir, "telemetry");
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: "tds sync"
      })
    };
  }
  try {
    const storiesDir = pathJoin8(
      paths.outputFolder,
      "implementation-artifacts",
      "stories"
    );
    const result = await tdsSync({
      registryPath: paths.branchRegistryYaml,
      projectRoot: paths.projectRoot,
      telemetryDir,
      manifestPath: paths.stateManifestYaml,
      recordedBy: role,
      // v6.3.0 stabilisation (ADR-0016 §E Mode 1 completion): pass
      // sprint-status + storiesDir so tdsSync flips merged-on-host
      // stories `approved → done` через applyStateTransition.
      sprintStatusPath: paths.sprintStatusYaml,
      storiesDir
    });
    const env = envelope("sync", EXIT.SUCCESS, result);
    const flippedToDone = result.storyFlips.filter((f) => f.flipped).length;
    const nonCanonical = result.storyFlips.filter(
      (f) => f.skipReason === "not-approved" || f.skipReason === "deny"
    );
    const summary = `synced=${result.syncedBranches.length} skipped=${result.skipped.length} approved\u2192done=${flippedToDone}` + (nonCanonical.length > 0 ? ` non_canonical=${nonCanonical.length} (` + nonCanonical.map((f) => `${f.storyId}@${f.statusBefore ?? "?"}`).join(", ") + ")" : "") + "\n";
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : summary,
      stderr: ""
    };
  } catch (err) {
    return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
  }
}

// src/cli/handlers/revert.ts
import { join as pathJoin9 } from "node:path";

// src/branch/revert.ts
init_registry();
init_git();
async function tdsRevertStory(opts) {
  const baseBranch = opts.baseBranch ?? "main";
  const branchName = opts.branchName ?? `bugfix/revert-${opts.storyId}`;
  const priorEntries = await findByStory({
    registryPath: opts.registryPath,
    storyId: opts.storyId
  });
  void priorEntries;
  if (branchExists(branchName, { cwd: opts.projectRoot })) {
    throw new Error(
      `revert branch already exists: ${branchName} (remove it manually or pass --branch-name=<other> to override)`
    );
  }
  createBranch(branchName, baseBranch, { cwd: opts.projectRoot });
  const reverted = revertCommit(opts.targetCommit, { cwd: opts.projectRoot });
  void reverted;
  const entry = await register({
    registryPath: opts.registryPath,
    recordOpts: {
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir ?? ""
    },
    entry: {
      branch: branchName,
      story_id: opts.storyId,
      epic_id: null,
      base_branch: baseBranch,
      created_by: "tds-branch-start",
      status: "active",
      pr_url: null,
      pr_number: null,
      last_synced_at: null,
      notes: `revert of ${opts.targetCommit.slice(0, 12)} for story ${opts.storyId}`
    }
  });
  return {
    branch: branchName,
    revertCommitSha: reverted.commitSha,
    storyId: opts.storyId,
    registered: entry
  };
}

// src/cli/handlers/revert.ts
async function handleRevertStory(rest, wantJson) {
  const storyId = parseFlag(rest, "story");
  const target = parseFlag(rest, "target");
  if (!storyId || !target) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "revert-story requires --story=<id> --target=<commit>\n"
    };
  }
  const baseBranch = parseFlag(rest, "base");
  const branchName = parseFlag(rest, "branch-name");
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return { exitCode: EXIT.PRECONDITION, stdout: "", stderr: `${err.message}
` };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin9(paths.runtimeDir, "telemetry");
  const decision = await checkRoleSkillOperation({
    role,
    op: "code-write",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "code-write",
        reason: decision.reason,
        command: "tds revert-story"
      })
    };
  }
  try {
    const result = await tdsRevertStory({
      registryPath: paths.branchRegistryYaml,
      projectRoot: paths.projectRoot,
      storyId,
      targetCommit: target,
      ...baseBranch !== void 0 ? { baseBranch } : {},
      ...branchName !== void 0 ? { branchName } : {},
      manifestPath: paths.stateManifestYaml,
      recordedBy: role
    });
    const env = envelope("revert-story", EXIT.SUCCESS, result);
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : `${result.branch} (${result.revertCommitSha.slice(0, 12)}\u2026)
`,
      stderr: ""
    };
  } catch (err) {
    return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
  }
}

// src/cli/handlers/epic.ts
import { join as pathJoin10 } from "node:path";
init_bridge();

// src/epic/bridge-from-retros.ts
var import_yaml18 = __toESM(require_dist(), 1);
init_emit();
init_bridge();
init_story_spec();
import {
  readFileSync as readFileSync21,
  existsSync as existsSync21,
  readdirSync as readdirSync2,
  appendFileSync,
  mkdirSync as mkdirSync6,
  writeFileSync as writeFileSync2
} from "node:fs";
import { join as join10, basename, dirname as dirname11 } from "node:path";
var APPLIED_MARKER_RE = /^## Applied to bridge: (\S+) @ ([0-9T:.\-Z]+)\s*$/m;
var BRIDGE_PLAN_HEADING_RE = /^##\s+(?:[\d.]+\s+)?Bridge Plan\s*$/m;
var YAML_BLOCK_RE = /```yaml\s*\n([\s\S]+?)\n```/;
var TYPE_SET2 = new Set(BRIDGE_TYPES);
var BridgeFromRetrosError = class extends Error {
  cause;
  constructor(message, cause) {
    super(message);
    this.name = "BridgeFromRetrosError";
    if (cause !== void 0) this.cause = cause;
  }
};
function parseRetroDoc(retroPath) {
  if (!existsSync21(retroPath)) {
    throw new BridgeFromRetrosError(`retro doc not found: ${retroPath}`);
  }
  const body = readFileSync21(retroPath, "utf8");
  const result = {
    retroPath,
    candidates: []
  };
  const appliedMatch = APPLIED_MARKER_RE.exec(body);
  if (appliedMatch) {
    result.appliedTo = {
      bridgeId: appliedMatch[1],
      appliedAt: appliedMatch[2]
    };
    return result;
  }
  const headingMatch = BRIDGE_PLAN_HEADING_RE.exec(body);
  if (!headingMatch) {
    return result;
  }
  const sectionStart = headingMatch.index + headingMatch[0].length;
  const nextHeading = body.slice(sectionStart).search(/^## /m);
  const sectionEnd = nextHeading >= 0 ? sectionStart + nextHeading : body.length;
  const section = body.slice(sectionStart, sectionEnd);
  const yamlMatch = YAML_BLOCK_RE.exec(section);
  if (!yamlMatch) {
    throw new BridgeFromRetrosError(
      `${basename(retroPath)}: '## Bridge Plan' \u0441\u0435\u043A\u0446\u0438\u044F \u043D\u0430\u0439\u0434\u0435\u043D\u0430, \u043D\u043E YAML-\u0431\u043B\u043E\u043A \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0438\u043B\u0438 malformed (\u043D\u0443\u0436\u0435\u043D fenced \`\`\`yaml ... \`\`\` \u0431\u043B\u043E\u043A)`
    );
  }
  let parsed;
  try {
    parsed = (0, import_yaml18.parse)(yamlMatch[1]);
  } catch (err) {
    throw new BridgeFromRetrosError(
      `${basename(retroPath)}: YAML parse failed in Bridge Plan: ${err.message}`
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new BridgeFromRetrosError(
      `${basename(retroPath)}: Bridge Plan YAML must be a mapping (got ${typeof parsed})`
    );
  }
  const obj = parsed;
  if (typeof obj["proposed_at"] === "string") {
    result.proposedAt = obj["proposed_at"];
  }
  if (typeof obj["type"] === "string") {
    if (!TYPE_SET2.has(obj["type"])) {
      throw new BridgeFromRetrosError(
        `${basename(retroPath)}: unknown bridge type: ${obj["type"]} (allowed: ${[...BRIDGE_TYPES].join(", ")})`
      );
    }
    result.type = obj["type"];
  }
  const rawCandidates = obj["candidates"];
  if (!Array.isArray(rawCandidates)) {
    throw new BridgeFromRetrosError(
      `${basename(retroPath)}: Bridge Plan 'candidates' must be a list`
    );
  }
  for (const [i, raw] of rawCandidates.entries()) {
    if (!raw || typeof raw !== "object") {
      throw new BridgeFromRetrosError(
        `${basename(retroPath)}: candidate[${i}] must be a mapping`
      );
    }
    const c = raw;
    const title = c["title"];
    if (typeof title !== "string" || title.length === 0) {
      throw new BridgeFromRetrosError(
        `${basename(retroPath)}: candidate[${i}] missing 'title' (non-empty string)`
      );
    }
    const justification = typeof c["justification"] === "string" ? c["justification"] : "";
    const rawSources = c["sources"];
    if (!Array.isArray(rawSources) || rawSources.length === 0) {
      throw new BridgeFromRetrosError(
        `${basename(retroPath)}: candidate[${i}] '${title}' missing 'sources' (non-empty list)`
      );
    }
    const sources = [];
    for (const [j, sraw] of rawSources.entries()) {
      if (!sraw || typeof sraw !== "object") {
        throw new BridgeFromRetrosError(
          `${basename(retroPath)}: candidate[${i}].sources[${j}] must be a mapping`
        );
      }
      const s = sraw;
      if (typeof s["story"] !== "string") {
        throw new BridgeFromRetrosError(
          `${basename(retroPath)}: candidate[${i}].sources[${j}] missing 'story' (string)`
        );
      }
      const kind = s["kind"];
      if (kind !== "completion-note" && kind !== "auditor-finding") {
        throw new BridgeFromRetrosError(
          `${basename(retroPath)}: candidate[${i}].sources[${j}].kind must be 'completion-note' | 'auditor-finding' (got ${String(kind)})`
        );
      }
      const src = {
        story: s["story"],
        kind
      };
      if (typeof s["ref"] === "string") src.ref = s["ref"];
      if (typeof s["round"] === "number") src.round = s["round"];
      if (typeof s["finding_index"] === "number") {
        src.finding_index = s["finding_index"];
      }
      sources.push(src);
    }
    result.candidates.push({ title, justification, sources });
  }
  return result;
}
var RETRO_FILENAME_RE = /(?:^|-)retro(?:-|\.)/i;
function scanRetroDocs(retrosDir) {
  if (!existsSync21(retrosDir)) return [];
  return readdirSync2(retrosDir).filter((f) => !f.startsWith("_") && f.endsWith(".md")).filter((f) => RETRO_FILENAME_RE.test(f)).map((f) => join10(retrosDir, f)).sort();
}
function aggregateCandidates(perRetro) {
  const byTitle = /* @__PURE__ */ new Map();
  for (const r of perRetro) {
    for (const c of r.candidates) {
      const key2 = c.title.trim().toLowerCase();
      const existing = byTitle.get(key2);
      if (!existing) {
        byTitle.set(key2, {
          title: c.title.trim(),
          justification: c.justification,
          sources: [...c.sources]
        });
      } else {
        const seen = new Set(
          existing.sources.map(sourceKey)
        );
        for (const s of c.sources) {
          const k = sourceKey(s);
          if (!seen.has(k)) {
            existing.sources.push(s);
            seen.add(k);
          }
        }
        if (existing.justification.length === 0 && c.justification.length > 0) {
          existing.justification = c.justification;
        }
      }
    }
  }
  return [...byTitle.values()];
}
function sourceKey(s) {
  if (s.kind === "auditor-finding") {
    return `af|${s.story}|${s.round ?? ""}|${s.finding_index ?? ""}`;
  }
  return `cn|${s.story}|${s.ref ?? ""}`;
}
function buildBridgeStorySpec(args) {
  const sourceLines = args.sources.map((s) => {
    if (s.kind === "auditor-finding") {
      const parts = [`kind=auditor-finding`];
      if (s.round !== void 0) parts.push(`round=${s.round}`);
      if (s.finding_index !== void 0) parts.push(`finding_index=${s.finding_index}`);
      return `- \`${s.story}\` (${parts.join(", ")})`;
    }
    const ref = s.ref ? ` \u2014 ${s.ref}` : "";
    return `- \`${s.story}\` (kind=completion-note)${ref}`;
  });
  return [
    `# Story ${args.storyId}: ${args.title}`,
    ``,
    `Status: backlog`,
    ``,
    `## Story`,
    ``,
    args.justification.length > 0 ? args.justification : `_(Justification not provided in retro Bridge Plan; bridge story consolidates deferred items from sources below.)_`,
    ``,
    `## Sources (deferred from)`,
    ``,
    ...sourceLines,
    ``,
    `## Acceptance Criteria`,
    ``,
    `_(TBD \u2014 fill before execute. Bridge stories are accumulated tech-debt; AC must reflect what "done" means for this specific consolidated scope.)_`,
    ``,
    `## Tasks / Subtasks`,
    ``,
    `_(TBD \u2014 break down before execute. Use bmad-create-story-style task list once scope is settled.)_`,
    ``,
    `## Dev Agent Record`,
    ``,
    `### Completion Notes List`,
    ``,
    `_(populated during implementation)_`,
    ``,
    `### File List`,
    ``,
    `_(populated during implementation)_`,
    ``,
    `---`,
    `Generated by \`tds epic create-bridge-from-retros\` for bridge \`${args.bridgeId}\` (blocks \`${args.blocksEpic}\`).`,
    ``
  ].join("\n");
}
async function createBridgeFromRetros(opts) {
  if (opts.retroPaths.length === 0) {
    throw new BridgeFromRetrosError(
      "no retro docs supplied (skill / --retros / --all-unprocessed should resolve at least one)"
    );
  }
  const bridgeId = bridgeIdFor(opts.blocksEpic);
  const parsed = [];
  const skipped = [];
  for (const path of opts.retroPaths) {
    const p = parseRetroDoc(path);
    if (p.appliedTo) {
      skipped.push(path);
      continue;
    }
    parsed.push(p);
  }
  if (parsed.length === 0) {
    throw new BridgeFromRetrosError(
      `all ${opts.retroPaths.length} retro docs already applied; nothing to do`
    );
  }
  const candidates = aggregateCandidates(parsed);
  if (candidates.length === 0) {
    throw new BridgeFromRetrosError(
      `parsed ${parsed.length} retro doc(s) but no candidates extracted (Bridge Plan \u0441\u0435\u043A\u0446\u0438\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u0438\u043B\u0438 \u043F\u0443\u0441\u0442\u044B)`
    );
  }
  let type = opts.type ?? "tech-debt";
  if (!opts.type) {
    for (const r of parsed) {
      if (r.type) {
        type = r.type;
        break;
      }
    }
  }
  const ext = readExtension(opts.extensionPath);
  if (ext.bridges.some((b) => b.id === bridgeId)) {
    throw new BridgeFromRetrosError(
      `bridge ${bridgeId} already exists in extension \u2014 call resolve to close it first`
    );
  }
  const storyIds = [];
  const storySources = [];
  for (const [i, c] of candidates.entries()) {
    const storyId = `${bridgeId}-${i + 1}-${slugifyShort(c.title)}`;
    storyIds.push(storyId);
    storySources.push({ storyId, sources: c.sources });
  }
  if (opts.dryRun) {
    return {
      bridgeId,
      blocksEpic: opts.blocksEpic,
      type,
      storyIds,
      storySources,
      retrosApplied: [],
      retrosSkipped: skipped,
      findingMarkers: [],
      findingMarkerWarnings: [],
      storySpecsCreated: [],
      dryRun: true
    };
  }
  const titleExtended = candidates.map((c) => c.title).join(" + ");
  const fromTo = bridgeId.replace(/^bridge-/, "").replace(/-/, "\u2192");
  const headerComment = `Bridge ${fromTo}: ${storyIds.length} ${storyIds.length === 1 ? "story" : "stories"} from ${parsed.length} retro${parsed.length === 1 ? "" : "s"}`;
  await pyStatusWrite({
    sprintStatusPath: opts.sprintStatusPath,
    key: bridgeId,
    status: "backlog",
    append: true,
    insertBefore: opts.blocksEpic,
    comment: headerComment,
    ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {},
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir
  });
  for (const [i, sid] of storyIds.entries()) {
    await pyStatusWrite({
      sprintStatusPath: opts.sprintStatusPath,
      key: sid,
      status: "backlog",
      append: true,
      insertBefore: opts.blocksEpic,
      inlineComment: candidates[i].title,
      ...opts.pythonBin !== void 0 ? { pythonBin: opts.pythonBin } : {},
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir
    });
  }
  const newEntry = {
    id: bridgeId,
    type,
    title_extended: titleExtended,
    blocks_epic: opts.blocksEpic,
    outcome_required: [],
    stories: storyIds,
    status: "backlog"
  };
  ext.bridges.push(newEntry);
  ext.generated_by = "bmad-tds-bridge-from-retros";
  if (!ext.parents) ext.parents = {};
  for (const sid of storyIds) {
    ext.parents[sid] = bridgeId;
  }
  ext.schema_version = "1.1";
  await writeExtension(opts.extensionPath, ext, {
    manifestPath: opts.manifestPath,
    projectRoot: opts.projectRoot,
    recordedBy: opts.recordedBy,
    telemetryDir: opts.telemetryDir
  });
  const appliedAt = (/* @__PURE__ */ new Date()).toISOString();
  const retrosApplied = [];
  for (const r of parsed) {
    appendFileSync(
      r.retroPath,
      `
## Applied to bridge: ${bridgeId} @ ${appliedAt}
`
    );
    retrosApplied.push(r.retroPath);
  }
  const findingMarkers = [];
  const findingMarkerWarnings = [];
  if (opts.storiesDir) {
    for (const { storyId, sources } of storySources) {
      for (const src of sources) {
        if (src.kind !== "auditor-finding") continue;
        if (src.round === void 0 || src.finding_index === void 0) {
          findingMarkerWarnings.push(
            `${src.story}: auditor-finding source \u0431\u0435\u0437 round/finding_index \u2014 marker skipped`
          );
          continue;
        }
        const specPath = join10(opts.storiesDir, `${src.story}.md`);
        if (!existsSync21(specPath)) {
          findingMarkerWarnings.push(
            `${src.story}: spec not found at ${specPath} \u2014 marker skipped`
          );
          continue;
        }
        const body = readFileSync21(specPath, "utf8");
        const spec = parseStorySpec(body);
        const updated = markFindingBridged(
          spec,
          src.round,
          src.finding_index,
          storyId
        );
        if (updated === null) {
          findingMarkerWarnings.push(
            `${src.story}: round-${src.round} finding-${src.finding_index} not found \u2014 marker skipped`
          );
          continue;
        }
        if (updated.body !== spec.body) {
          await writeStorySpec(specPath, updated);
        }
        findingMarkers.push({
          storyId: src.story,
          round: src.round,
          findingIndex: src.finding_index,
          bridgeStoryId: storyId
        });
      }
    }
  }
  const storySpecsCreated = [];
  if (opts.storiesDir) {
    for (const [i, sid] of storyIds.entries()) {
      const candidate = candidates[i];
      const specPath = join10(opts.storiesDir, `${sid}.md`);
      if (existsSync21(specPath)) continue;
      mkdirSync6(dirname11(specPath), { recursive: true });
      const body = buildBridgeStorySpec({
        storyId: sid,
        title: candidate.title,
        justification: candidate.justification,
        sources: candidate.sources,
        bridgeId,
        blocksEpic: opts.blocksEpic
      });
      writeFileSync2(specPath, body);
      storySpecsCreated.push(sid);
    }
  }
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "bridge-epic-events",
    event: {
      kind: "create-from-retros",
      bridge_id: bridgeId,
      type,
      blocks_epic: opts.blocksEpic,
      story_ids: storyIds,
      retros_applied: retrosApplied.map((p) => basename(p)),
      retros_skipped: skipped.map((p) => basename(p)),
      finding_markers_count: findingMarkers.length,
      finding_marker_warnings_count: findingMarkerWarnings.length,
      story_specs_created_count: storySpecsCreated.length
    }
  });
  return {
    bridgeId,
    blocksEpic: opts.blocksEpic,
    type,
    storyIds,
    storySources,
    retrosApplied,
    retrosSkipped: skipped,
    findingMarkers,
    findingMarkerWarnings,
    storySpecsCreated,
    dryRun: false
  };
}

// src/epic/bridge-spec-readiness.ts
init_bridge();
import { existsSync as existsSync22, readFileSync as readFileSync22 } from "node:fs";
import { join as join11 } from "node:path";
var TBD_AC_RE = /_\(TBD\s*[—-]\s*fill\s+before\s+execute/i;
var TBD_TASKS_RE = /_\(TBD\s*[—-]\s*break\s+down\s+before\s+execute/i;
var SECTION_HEADINGS = {
  ac: /^##\s+Acceptance\s+Criteria\s*$/i,
  tasks: /^##\s+Tasks\s*\/\s*Subtasks\s*$/i,
  sources: /^##\s+Sources\s+\(deferred\s+from\)\s*$/i,
  /** Any other `## ...` heading — used to detect section boundaries. */
  anySection: /^##\s+/
};
var TASK_CHECKBOX_RE = /^\s*-\s*\[[\sx]\]/i;
function extractSection(body, headingRe) {
  const lines = body.split("\n");
  let inSection = false;
  const out = [];
  for (const line of lines) {
    if (inSection) {
      if (SECTION_HEADINGS.anySection.test(line)) break;
      out.push(line);
      continue;
    }
    if (headingRe.test(line)) inSection = true;
  }
  return inSection ? out : null;
}
function hasConcreteContent(sectionLines, placeholderRe) {
  for (const raw of sectionLines) {
    const line = raw.trim();
    if (line.length === 0) continue;
    if (placeholderRe.test(line)) continue;
    return true;
  }
  return false;
}
function validateStorySpec(args) {
  const failures = [];
  const warnings = [];
  if (!existsSync22(args.specPath)) {
    failures.push(`spec file not found at ${args.specPath}`);
    return {
      storyId: args.storyId,
      specPath: args.specPath,
      ready: false,
      failures,
      warnings
    };
  }
  const body = readFileSync22(args.specPath, "utf8");
  const acSection = extractSection(body, SECTION_HEADINGS.ac);
  if (acSection === null) {
    failures.push("missing `## Acceptance Criteria` heading");
  } else {
    const hasPlaceholder = acSection.some((l) => TBD_AC_RE.test(l));
    const hasConcrete = hasConcreteContent(acSection, TBD_AC_RE);
    if (hasPlaceholder && !hasConcrete) {
      failures.push(
        "`## Acceptance Criteria` contains generated TBD placeholder; replace _(TBD \u2014 fill before execute. ...)_ with concrete AC items"
      );
    } else if (!hasConcrete) {
      failures.push(
        "`## Acceptance Criteria` section is empty; add concrete AC items before execute"
      );
    }
  }
  const tasksSection = extractSection(body, SECTION_HEADINGS.tasks);
  if (tasksSection === null) {
    failures.push("missing `## Tasks / Subtasks` heading");
  } else {
    const hasPlaceholder = tasksSection.some((l) => TBD_TASKS_RE.test(l));
    const hasCheckbox = tasksSection.some((l) => TASK_CHECKBOX_RE.test(l));
    if (hasPlaceholder && !hasCheckbox) {
      failures.push(
        "`## Tasks / Subtasks` contains generated TBD placeholder; replace _(TBD \u2014 break down before execute. ...)_ with `- [ ]` actionable task checkboxes"
      );
    } else if (!hasCheckbox) {
      failures.push(
        "`## Tasks / Subtasks` section has no `- [ ]` checkboxes; add actionable tasks before execute"
      );
    }
  }
  const sourcesSection = extractSection(body, SECTION_HEADINGS.sources);
  if (sourcesSection === null) {
    warnings.push(
      "missing `## Sources (deferred from)` heading \u2014 authoring guidance for AC/Tasks may be harder to trace"
    );
  }
  return {
    storyId: args.storyId,
    specPath: args.specPath,
    ready: failures.length === 0,
    failures,
    warnings
  };
}
function validateBridgeSpecs(opts) {
  const ext = readExtension(opts.extensionPath);
  const entry = ext.bridges.find((b) => b.id === opts.bridgeId);
  if (!entry) {
    throw new Error(
      `bridge not found in extension: ${opts.bridgeId}. Available bridges: ${ext.bridges.map((b) => b.id).join(", ") || "<none>"}.`
    );
  }
  const stories = entry.stories.map(
    (storyId) => validateStorySpec({
      storyId,
      specPath: join11(opts.storiesDir, `${storyId}.md`)
    })
  );
  const totalFailures = stories.reduce((n, s) => n + s.failures.length, 0);
  const totalWarnings = stories.reduce((n, s) => n + s.warnings.length, 0);
  return {
    bridgeId: opts.bridgeId,
    ready: stories.every((s) => s.ready),
    totalFailures,
    totalWarnings,
    stories
  };
}

// src/cli/handlers/epic.ts
async function handleEpic(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(EPIC_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown epic subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return { exitCode: EXIT.PRECONDITION, stdout: "", stderr: `${err.message}
` };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin10(paths.runtimeDir, "telemetry");
  const sprintStatusPath = paths.sprintStatusYaml;
  const extensionPath = pathJoin10(paths.tdsStateDir, "sprint-status-extension.yaml");
  if (sub === "create-bridge-from-retros") {
    const decision2 = await checkRoleSkillOperation({
      role,
      op: "state-set",
      telemetryDir,
      matrixPath: SPEC_MATRIX_PATH
    });
    if (decision2.decision === "deny") {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "state-set",
          reason: decision2.reason,
          command: "tds epic create-bridge-from-retros"
        })
      };
    }
    const flags2 = rest.slice(1);
    const blocks = parseFlag(flags2, "blocks");
    if (!blocks) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "epic create-bridge-from-retros requires --blocks=<next-epic-id>\n"
      };
    }
    const retrosFlag = parseFlag(flags2, "retros");
    const allUnprocessed = flags2.includes("--all-unprocessed");
    if (!retrosFlag && !allUnprocessed) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "epic create-bridge-from-retros requires --retros=<path1,path2,...> OR --all-unprocessed\n"
      };
    }
    let retroPaths;
    if (retrosFlag) {
      retroPaths = retrosFlag.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    } else {
      const retrosDir = pathJoin10(
        paths.outputFolder,
        "implementation-artifacts",
        "retros"
      );
      retroPaths = scanRetroDocs(retrosDir);
      if (retroPaths.length === 0) {
        return {
          exitCode: EXIT.PRECONDITION,
          stdout: "",
          stderr: `no retro docs found under ${retrosDir} (--all-unprocessed)
`
        };
      }
    }
    const typeFlag = parseFlag(flags2, "type");
    const dryRun = flags2.includes("--dry-run");
    const storiesDir = pathJoin10(
      paths.outputFolder,
      "implementation-artifacts",
      "stories"
    );
    try {
      const result = await createBridgeFromRetros({
        blocksEpic: blocks,
        sprintStatusPath,
        extensionPath,
        telemetryDir,
        retroPaths,
        storiesDir,
        ...typeFlag !== void 0 ? { type: typeFlag } : {},
        dryRun,
        manifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot,
        recordedBy: role
      });
      const env = envelope("epic create-bridge-from-retros", EXIT.SUCCESS, result);
      const summary = `${result.bridgeId} (type=${result.type}, blocks=${result.blocksEpic}, ${result.storyIds.length} stories) \u2014 ${result.dryRun ? "DRY-RUN" : `applied ${result.retrosApplied.length} retro(s), skipped ${result.retrosSkipped.length}`}
`;
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : summary,
        stderr: ""
      };
    } catch (err) {
      if (err instanceof BridgeFromRetrosError) {
        return {
          exitCode: EXIT.PRECONDITION,
          stdout: "",
          stderr: `${err.message}
`
        };
      }
      return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
    }
  }
  if (sub !== "bridge") {
    return exhaustiveSwitch(sub, "epic");
  }
  const sub2 = rest[1];
  if (!isMember(EPIC_BRIDGE_SUBCOMMANDS, sub2)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown epic bridge subcommand: ${sub2 ?? ""}
${USAGE}`
    };
  }
  const flags = rest.slice(2);
  if (sub2 === "list") {
    try {
      const result = await listBridges({
        extensionPath,
        ...parseFlag(flags, "blocks") !== void 0 ? { blocksEpic: parseFlag(flags, "blocks") } : {},
        ...parseFlag(flags, "type") !== void 0 ? { type: parseFlag(flags, "type") } : {},
        ...parseFlag(flags, "status") !== void 0 ? { status: parseFlag(flags, "status") } : {}
      });
      const env = envelope("epic bridge list", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.bridges.length} bridge(s)
` + result.bridges.map((b) => `  ${b.id} [${b.status}] ${b.type} \u2192 blocks ${b.blocks_epic}`).join("\n") + (result.bridges.length > 0 ? "\n" : ""),
        stderr: ""
      };
    } catch (err) {
      return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
    }
  }
  if (sub2 === "validate-specs") {
    const bridgeIdArg = parseFlag(flags, "bridge");
    if (!bridgeIdArg) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "epic bridge validate-specs requires --bridge=<bridge-id>\n"
      };
    }
    const storiesDir = pathJoin10(
      paths.outputFolder,
      "implementation-artifacts",
      "stories"
    );
    try {
      const result = validateBridgeSpecs({
        extensionPath,
        storiesDir,
        bridgeId: bridgeIdArg
      });
      const env = envelope("epic bridge validate-specs", EXIT.SUCCESS, result);
      const lines = [
        `bridge ${result.bridgeId}: ${result.ready ? "ready" : "NOT ready"} (failures=${result.totalFailures}, warnings=${result.totalWarnings})`
      ];
      for (const s of result.stories) {
        lines.push(`  ${s.storyId}: ${s.ready ? "ok" : "fail"}  \u2192  ${s.specPath}`);
        for (const f of s.failures) lines.push(`    - fail: ${f}`);
        for (const w of s.warnings) lines.push(`    - warn: ${w}`);
      }
      const human = lines.join("\n") + "\n";
      const recovery = result.ready ? "" : `bridge not ready for execute. Recovery (no rollback needed):
  1. open each spec listed above and author concrete \`## Acceptance Criteria\` + \`## Tasks / Subtasks\`
     from \`## Sources (deferred from)\` + originating story specs / findings / retro Bridge Plan;
  2. rerun \`tds epic bridge validate-specs --bridge=${result.bridgeId}\` until ready=true;
  3. then \`/bmad-tds-execute-epic ${result.bridgeId}\` (Step 2.5 will re-check).
`;
      return {
        exitCode: result.ready ? EXIT.SUCCESS : EXIT.PRECONDITION,
        stdout: wantJson ? JSON.stringify(env) : human,
        stderr: recovery
      };
    } catch (err) {
      return {
        exitCode: EXIT.PRECONDITION,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub2 !== "resolve") {
    return exhaustiveSwitch(sub2, "epic-bridge");
  }
  const decision = await checkRoleSkillOperation({
    role,
    op: "state-set",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "state-set",
        reason: decision.reason,
        command: "tds epic bridge resolve"
      })
    };
  }
  const bridgeId = flags[0];
  const outcome = parseFlag(flags, "outcome");
  if (!bridgeId || bridgeId.startsWith("--") || !outcome) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "epic bridge resolve requires <bridge-id> --outcome=<text>\n"
    };
  }
  try {
    const result = await resolveBridge({
      sprintStatusPath,
      extensionPath,
      telemetryDir,
      bridgeId,
      outcome,
      manifestPath: paths.stateManifestYaml,
      projectRoot: paths.projectRoot,
      recordedBy: role
    });
    const env = envelope("epic bridge resolve", EXIT.SUCCESS, result);
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : `${result.bridgeId}: ${result.statusBefore} \u2192 ${result.statusAfter}
`,
      stderr: ""
    };
  } catch (err) {
    return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
  }
}

// src/cli/handlers/archive.ts
import { join as pathJoin11 } from "node:path";

// src/archive/index.ts
var import_proper_lockfile8 = __toESM(require_proper_lockfile(), 1);
var import_write_file_atomic8 = __toESM(require_lib(), 1);
var import_yaml19 = __toESM(require_dist(), 1);
init_emit();
import { createHash as createHash3 } from "node:crypto";
import {
  copyFileSync,
  existsSync as existsSync23,
  mkdirSync as mkdirSync7,
  readFileSync as readFileSync23,
  readdirSync as readdirSync3,
  statSync as statSync3,
  writeFileSync as writeFileSync3
} from "node:fs";
import { join as join12 } from "node:path";
function sha256Bytes(buf) {
  return createHash3("sha256").update(buf).digest("hex");
}
async function archiveCreate(opts) {
  const archivePath = join12(opts.archiveRoot, opts.phaseName);
  if (existsSync23(archivePath)) {
    throw new Error(
      `archive already exists at ${archivePath} \u2014 choose a different phase name or remove the directory manually`
    );
  }
  mkdirSync7(archivePath, { recursive: true });
  const fileSha256 = {};
  const recordSha = (relPath2, abs) => {
    if (existsSync23(abs)) {
      fileSha256[relPath2] = sha256Bytes(readFileSync23(abs));
    }
  };
  const storiesDst = join12(archivePath, "stories");
  mkdirSync7(storiesDst, { recursive: true });
  let storiesCount = 0;
  if (existsSync23(opts.storiesDir)) {
    for (const entry of readdirSync3(opts.storiesDir)) {
      const src = join12(opts.storiesDir, entry);
      if (statSync3(src).isFile() && entry.endsWith(".md")) {
        const dst = join12(storiesDst, entry);
        copyFileSync(src, dst);
        recordSha(`stories/${entry}`, dst);
        storiesCount++;
      }
    }
  }
  const tdsSnapshotDir = join12(archivePath, "_tds-snapshot");
  mkdirSync7(tdsSnapshotDir, { recursive: true });
  if (existsSync23(opts.stateManifestPath)) {
    const dst = join12(tdsSnapshotDir, "state-manifest.yaml");
    copyFileSync(opts.stateManifestPath, dst);
    recordSha("_tds-snapshot/state-manifest.yaml", dst);
  }
  if (existsSync23(opts.branchRegistryPath)) {
    const dst = join12(tdsSnapshotDir, "branch-registry.yaml");
    copyFileSync(opts.branchRegistryPath, dst);
    recordSha("_tds-snapshot/branch-registry.yaml", dst);
  }
  let telemetryCount = 0;
  let telemetryEvents = 0;
  const telemetryDst = join12(tdsSnapshotDir, "telemetry");
  for (const streamId of opts.telemetryStreams) {
    const src = join12(opts.telemetryDir, `${streamId}.jsonl`);
    if (!existsSync23(src)) continue;
    mkdirSync7(telemetryDst, { recursive: true });
    const dst = join12(telemetryDst, `${streamId}.jsonl`);
    copyFileSync(src, dst);
    recordSha(`_tds-snapshot/telemetry/${streamId}.jsonl`, dst);
    telemetryCount++;
    const lines = readFileSync23(dst, "utf8").split("\n").filter(Boolean);
    telemetryEvents += lines.length;
  }
  if (existsSync23(opts.sprintStatusPath)) {
    const dst = join12(archivePath, "sprint-status-snapshot.yaml");
    copyFileSync(opts.sprintStatusPath, dst);
    recordSha("sprint-status-snapshot.yaml", dst);
  }
  const summaryPath = join12(archivePath, "phase-summary.md");
  const summaryStub = `# Phase ${opts.phaseName} \u2014 summary

_Description:_ ${opts.description}

Archived ${opts.nowIso ?? (/* @__PURE__ */ new Date()).toISOString()} by ${opts.archivedBy}.

Stories archived: ${storiesCount}.

_(This file is a stub \u2014 replace with the writer-generated Di\xE1taxis explanation + reference summary.)_
`;
  writeFileSync3(summaryPath, summaryStub);
  recordSha("phase-summary.md", summaryPath);
  let integrityEntries = 0;
  if (fileSha256["_tds-snapshot/state-manifest.yaml"]) {
    const sm = (0, import_yaml19.parse)(
      readFileSync23(join12(tdsSnapshotDir, "state-manifest.yaml"), "utf8")
    );
    integrityEntries = Array.isArray(sm?.entries) ? sm.entries.length : 0;
  }
  let branchesArchived = 0;
  if (fileSha256["_tds-snapshot/branch-registry.yaml"]) {
    const br = (0, import_yaml19.parse)(
      readFileSync23(join12(tdsSnapshotDir, "branch-registry.yaml"), "utf8")
    );
    branchesArchived = Array.isArray(br?.branches) ? br.branches.length : 0;
  }
  const bridgeIds = (opts.epicIds ?? []).filter((e) => e.startsWith("bridge-"));
  const archivedAt = opts.nowIso ?? (/* @__PURE__ */ new Date()).toISOString();
  const startedAt = opts.startedAtIso ?? archivedAt;
  const durationDays = Math.max(
    0,
    Math.round(
      (new Date(archivedAt).getTime() - new Date(startedAt).getTime()) / (24 * 60 * 60 * 1e3)
    )
  );
  const manifestNoSelfSha = {
    schema_version: "1.0",
    phase: {
      name: opts.phaseName,
      description: opts.description,
      archived_at: archivedAt,
      archived_by: opts.archivedBy
    },
    period: {
      started_at: startedAt,
      ended_at: archivedAt,
      duration_days: durationDays
    },
    contents: {
      epics: opts.epicIds ?? [],
      stories_count: storiesCount,
      bridging_epics_count: bridgeIds.length,
      artefacts: {
        stories: storiesCount,
        integrity_entries: integrityEntries,
        branches_archived: branchesArchived,
        telemetry_streams: telemetryCount,
        telemetry_events_total: telemetryEvents
      }
    },
    integrity: {
      manifest_sha256: "<self>",
      files: fileSha256
    },
    phase_summary_path: "phase-summary.md",
    restore_policy: "read-only"
  };
  const placeholderYaml = (0, import_yaml19.stringify)(manifestNoSelfSha, { indent: 2, lineWidth: 0 });
  const manifestSha = sha256Bytes(Buffer.from(placeholderYaml, "utf8"));
  const finalManifest = {
    ...manifestNoSelfSha,
    integrity: { ...manifestNoSelfSha.integrity, manifest_sha256: manifestSha }
  };
  const manifestPath = join12(archivePath, "manifest.yaml");
  const release = await import_proper_lockfile8.default.lock(manifestPath, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic8.default)(
      manifestPath,
      (0, import_yaml19.stringify)(finalManifest, { indent: 2, lineWidth: 0 }),
      { fsync: true }
    );
  } finally {
    await release();
  }
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "archive-events",
    event: {
      kind: "create",
      phase_name: opts.phaseName,
      stories_count: storiesCount,
      manifest_sha256: manifestSha
    }
  });
  return {
    phaseName: opts.phaseName,
    archivePath,
    manifestSha256: manifestSha,
    contents: finalManifest.contents
  };
}
async function archiveList(opts) {
  if (!existsSync23(opts.archiveRoot)) return { phases: [] };
  const phases = [];
  for (const entry of readdirSync3(opts.archiveRoot)) {
    const manifestPath = join12(opts.archiveRoot, entry, "manifest.yaml");
    if (!existsSync23(manifestPath)) continue;
    const m = (0, import_yaml19.parse)(readFileSync23(manifestPath, "utf8"));
    phases.push({
      name: m.phase.name,
      archivedAt: m.phase.archived_at,
      storiesCount: m.contents.stories_count,
      manifestPath
    });
  }
  return { phases };
}
async function archiveShow(opts) {
  const manifestPath = join12(opts.archiveRoot, opts.phaseName, "manifest.yaml");
  if (!existsSync23(manifestPath)) {
    throw new Error(`archive not found: ${opts.phaseName} (no manifest at ${manifestPath})`);
  }
  return (0, import_yaml19.parse)(readFileSync23(manifestPath, "utf8"));
}
async function archiveVerify(opts) {
  const archivePath = join12(opts.archiveRoot, opts.phaseName);
  const manifestPath = join12(archivePath, "manifest.yaml");
  if (!existsSync23(manifestPath)) {
    throw new Error(`archive not found: ${opts.phaseName}`);
  }
  const manifest = (0, import_yaml19.parse)(readFileSync23(manifestPath, "utf8"));
  let verified = 0;
  const failed = [];
  for (const [relPath2, expectedSha] of Object.entries(manifest.integrity.files)) {
    const abs = join12(archivePath, relPath2);
    if (!existsSync23(abs)) {
      failed.push({
        path: relPath2,
        expectedSha256: expectedSha,
        actualSha256: "<missing>"
      });
      continue;
    }
    const actual = sha256Bytes(readFileSync23(abs));
    if (actual === expectedSha) {
      verified++;
    } else {
      failed.push({
        path: relPath2,
        expectedSha256: expectedSha,
        actualSha256: actual
      });
    }
  }
  return { phaseName: opts.phaseName, verified, failed };
}

// src/cli/handlers/archive.ts
init_emit();
async function handleArchive(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(ARCHIVE_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown archive subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return { exitCode: EXIT.PRECONDITION, stdout: "", stderr: `${err.message}
` };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin11(paths.runtimeDir, "telemetry");
  const archiveRoot = pathJoin11(paths.outputFolder, "_archive");
  const flags = rest.slice(1);
  if (sub === "create") {
    const decision = await checkRoleSkillOperation({
      role,
      op: "archive-ops",
      telemetryDir,
      matrixPath: SPEC_MATRIX_PATH
    });
    if (decision.decision === "deny") {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "archive-ops",
          reason: decision.reason,
          command: "tds archive create"
        })
      };
    }
    const phase2 = parseFlag(flags, "phase");
    const description = parseFlag(flags, "description") ?? "";
    if (!phase2) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "archive create requires --phase=<name>\n"
      };
    }
    const epicsRaw = parseFlag(flags, "epics");
    try {
      const storiesDir = pathJoin11(paths.outputFolder, "stories");
      const sprintStatusPath = paths.sprintStatusYaml;
      const result = await archiveCreate({
        archiveRoot,
        storiesDir,
        stateManifestPath: paths.stateManifestYaml,
        branchRegistryPath: paths.branchRegistryYaml,
        sprintStatusPath,
        telemetryDir,
        telemetryStreams: [...STREAM_IDS],
        phaseName: phase2,
        description,
        archivedBy: role,
        ...epicsRaw !== void 0 ? { epicIds: epicsRaw.split(",") } : {}
      });
      const env = envelope("archive create", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `archived ${result.phaseName} (${result.contents.stories_count} stories) \u2192 ${result.archivePath}
`,
        stderr: ""
      };
    } catch (err) {
      return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
    }
  }
  if (sub === "list") {
    const result = await archiveList({ archiveRoot });
    const env = envelope("archive list", EXIT.SUCCESS, result);
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : `${result.phases.length} phase(s)
` + result.phases.map((p) => `  ${p.name} (${p.storiesCount} stories, archived ${p.archivedAt})`).join("\n") + (result.phases.length > 0 ? "\n" : ""),
      stderr: ""
    };
  }
  if (sub === "show") {
    const phase2 = parseFlag(flags, "phase");
    if (!phase2) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: "archive show requires --phase=<name>\n"
      };
    }
    try {
      const m = await archiveShow({ archiveRoot, phaseName: phase2 });
      const env = envelope("archive show", EXIT.SUCCESS, m);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `phase=${m.phase.name} archived=${m.phase.archived_at} stories=${m.contents.stories_count}
`,
        stderr: ""
      };
    } catch (err) {
      return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
    }
  }
  if (sub !== "verify") {
    return exhaustiveSwitch(sub, "archive");
  }
  const phase = parseFlag(flags, "phase");
  if (!phase) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "archive verify requires --phase=<name>\n"
    };
  }
  try {
    const r = await archiveVerify({ archiveRoot, phaseName: phase });
    const exitCode = r.failed.length === 0 ? EXIT.SUCCESS : EXIT.RECONCILE_DRIFT;
    const env = envelope("archive verify", exitCode, r);
    return {
      exitCode,
      stdout: wantJson ? JSON.stringify({ ...env, exit_code: exitCode }) : `${phase}: verified=${r.verified} failed=${r.failed.length}
`,
      stderr: ""
    };
  } catch (err) {
    return { exitCode: EXIT.RUNTIME, stdout: "", stderr: `${err.message}
` };
  }
}

// src/cli/handlers/story.ts
import { join as pathJoin14 } from "node:path";

// src/cli/handlers/story-update.ts
import { join as pathJoin12 } from "node:path";
init_model();
async function handleStoryUpdate(opts) {
  const { role, storyId, flags, paths, telemetryDir, wantJson } = opts;
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: "tds story update"
      })
    };
  }
  {
    const newStatusEarly = parseFlag(flags, "status");
    if (role === "test-author" && newStatusEarly !== void 0 && !isTestsState(newStatusEarly)) {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "story-ops/status-flip",
          reason: `test-author can only flip status \u043A tests-drafting | tests-needs-revision | tests-approved (got --status=${newStatusEarly}). Non-tests-* transitions handled by specialist after tests-approved.`,
          command: "tds story update --status"
        })
      };
    }
  }
  const specPath = pathJoin12(
    paths.outputFolder,
    "implementation-artifacts",
    "stories",
    `${storyId}.md`
  );
  const {
    readStorySpec: readStorySpec2,
    setStatus: setStatus2,
    markTaskComplete: markTaskComplete2,
    markSubtaskComplete: markSubtaskComplete2,
    markTaskDeferred: markTaskDeferred2,
    countOpenTasks: countOpenTasks2,
    listOpenTaskLabels: listOpenTaskLabels2,
    appendCompletionNote: appendCompletionNote2,
    appendFileListEntry: appendFileListEntry2,
    setSpecialistSelfReview: setSpecialistSelfReview2,
    writeStorySpec: writeStorySpec2
  } = await Promise.resolve().then(() => (init_story_spec(), story_spec_exports));
  const spec = readStorySpec2(specPath);
  if (!spec) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `story spec not found: ${specPath}
`
    };
  }
  let mutated = spec;
  const newStatus = parseFlag(flags, "status");
  const taskCompleteFlags = parseFlagAll(flags, "task-complete");
  const subtaskCompleteFlags = parseFlagAll(flags, "subtask-complete");
  const taskDeferFlags = parseFlagAll(flags, "task-defer");
  const completionNoteFlags = parseFlagAll(flags, "completion-note");
  const fileListFlags = parseFlagAll(flags, "file-list-add");
  const selfReviewFromPath = parseFlag(flags, "self-review-from");
  let selfReviewBody = null;
  if (selfReviewFromPath !== void 0) {
    if (role === "auditor") {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "story-ops/self-review",
          reason: "auditor \xD7 story-ops = allow-conditional (only add-finding); self-review is specialist disclosure, not auditor verdict writeback",
          command: "tds story update --self-review-from"
        })
      };
    }
    const { readFileSync: readFileSync29, existsSync: existsSync31 } = await import("node:fs");
    if (!existsSync31(selfReviewFromPath)) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: `--self-review-from path does not exist: ${selfReviewFromPath}
`
      };
    }
    selfReviewBody = readFileSync29(selfReviewFromPath, "utf8");
  }
  if (newStatus === void 0 && taskCompleteFlags.length === 0 && subtaskCompleteFlags.length === 0 && taskDeferFlags.length === 0 && completionNoteFlags.length === 0 && fileListFlags.length === 0 && selfReviewBody === null) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "story update requires at least one of: --status, --task-complete, --subtask-complete, --completion-note, --file-list-add, --self-review-from\n"
    };
  }
  if (newStatus !== void 0) {
    const { validateTransition: validateTransition2 } = await Promise.resolve().then(() => (init_state_machine(), state_machine_exports));
    const { readSprintStatus: readSprintStatus2 } = await Promise.resolve().then(() => (init_sprint_status(), sprint_status_exports));
    const { existsSync: existsSync31 } = await import("node:fs");
    let currentStatus = null;
    if (existsSync31(paths.sprintStatusYaml)) {
      try {
        const doc = readSprintStatus2({ sprintStatusPath: paths.sprintStatusYaml });
        currentStatus = doc.byKey.get(storyId)?.status ?? null;
      } catch {
      }
    }
    if (currentStatus !== null) {
      const validation = validateTransition2({
        from: currentStatus,
        to: newStatus,
        role
      });
      if (!validation.allow) {
        return {
          exitCode: EXIT.AUTHZ,
          stdout: "",
          stderr: formatAuthzDeny({
            role,
            op: "story-ops/state-set",
            reason: validation.reason ?? "denied by state machine",
            command: "tds story update --status"
          }) + (validation.recovery ? `${validation.recovery}
` : "")
        };
      }
    }
  }
  const warnings = [];
  const TMP_SELF_REVIEW_RE = /(?:^|[\s"'(=])(?:\/tmp\/|\/var\/folders\/[^\s/]+\/[^\s/]+\/T\/)[^\s"')]*self-review[^\s"')]*/i;
  if (selfReviewBody === null) {
    const tmpRefs = [
      ...completionNoteFlags.filter((n) => TMP_SELF_REVIEW_RE.test(n)),
      ...fileListFlags.filter((p) => TMP_SELF_REVIEW_RE.test(p))
    ];
    if (tmpRefs.length > 0) {
      warnings.push(
        `anti-pattern: completion-note/file-list-add references /tmp/...self-review-*.md \u0431\u0435\u0437 --self-review-from= ingest. Tmp file ephemeral \u2014 reference dies on next session, auditor surfaces 'missing-self-review-evidence' finding \u043A\u0430\u0436\u0434\u044B\u0439 round. Pair tmp file write + --self-review-from=<path> \u0432 \u0442\u043E\u0439 \u0436\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0435, OR materialise content directly \u0447\u0435\u0440\u0435\u0437 --self-review-from= \u0438 avoid tmp-ref \u0432 notes/file-list. Detected refs: ${tmpRefs.map((r) => JSON.stringify(r)).join(", ")}`
      );
    }
  }
  if (newStatus !== void 0) {
    const updated = setStatus2(mutated, newStatus);
    if (updated !== null) {
      mutated = updated;
    }
  }
  for (const t of taskCompleteFlags) {
    const updated = markTaskComplete2(mutated, t);
    if (updated === null) {
      warnings.push(`task not found: ${t}`);
    } else {
      mutated = updated;
    }
  }
  for (const s of subtaskCompleteFlags) {
    const updated = markSubtaskComplete2(mutated, s);
    if (updated === null) {
      warnings.push(`subtask not found: ${s}`);
    } else {
      mutated = updated;
    }
  }
  for (const td of taskDeferFlags) {
    const sepIdx = td.indexOf(" // ");
    if (sepIdx < 0) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: `--task-defer requires '<label> // <reason>' format (separator: space-slash-slash-space). Got: ${JSON.stringify(td)}
`
      };
    }
    const label = td.slice(0, sepIdx).trim();
    const reason = td.slice(sepIdx + 4).trim();
    if (!label || !reason) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: `--task-defer requires non-empty label and reason
`
      };
    }
    const updated = markTaskDeferred2(mutated, label, reason);
    if (updated === null) {
      warnings.push(`task-defer \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0451\u043D: '${label}' (\u043B\u0438\u0431\u043E \u043D\u0435 open, \u043B\u0438\u0431\u043E already done)`);
    } else {
      mutated = updated;
    }
  }
  for (const n of completionNoteFlags) {
    const updated = appendCompletionNote2(mutated, n);
    if (updated === null) {
      warnings.push("Completion Notes List heading absent \u2014 note skipped");
    } else {
      mutated = updated;
    }
  }
  for (const f of fileListFlags) {
    const updated = appendFileListEntry2(mutated, f);
    if (updated === null) {
      warnings.push("File List heading absent \u2014 entry skipped");
    } else {
      mutated = updated;
    }
  }
  if (selfReviewBody !== null) {
    mutated = setSpecialistSelfReview2(mutated, selfReviewBody);
  }
  if (newStatus === "review") {
    const openCount = countOpenTasks2(mutated.body);
    if (openCount > 0) {
      const labels = listOpenTaskLabels2(mutated.body);
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "story-ops/review-with-open-tasks",
          reason: `cannot flip story \u043A status=review \u0441 ${openCount} open task(s):
` + labels.map((l) => `  - ${l}`).join("\n") + `
Open \`- [ ]\` markers indicate work \u043D\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D.`,
          command: "tds story update --status=review"
        }) + `Recovery options:
  \u2022 Complete \u043A\u0430\u0436\u0434\u0443\u044E: \`--task-complete="<label>"\` (one per task done).
  \u2022 Defer \u043A\u0430\u0436\u0434\u0443\u044E \u0441 reason: \`--task-defer="<label> // <reason>"\`.
    Mark \`- [-]\` _(deferred: ...)_, \u043D\u0435 \u0431\u043B\u043E\u043A\u0438\u0440\u0443\u0435\u0442 review, visible \u043A\u0430\u043A known-incomplete.
  \u2022 Halt story: \`tds story reset --to=halted --as=auditor --reason=<text>\`.
`
      };
    }
  }
  if (mutated.body !== spec.body) {
    await writeStorySpec2(specPath, mutated);
  }
  let sprintStatusUpdated = false;
  if (newStatus !== void 0) {
    try {
      const { applyStateTransition: applyStateTransition2 } = await Promise.resolve().then(() => (init_apply_transition(), apply_transition_exports));
      await applyStateTransition2({
        sprintStatusPath: paths.sprintStatusYaml,
        storyId,
        newStatus,
        role,
        viaCommand: "tds story update",
        telemetryDir,
        storyMdPath: specPath,
        stateManifestPath: paths.stateManifestYaml,
        projectRoot: paths.projectRoot
      });
      sprintStatusUpdated = true;
    } catch (err) {
      const msg = err.message;
      const specWritten = mutated.body !== spec.body;
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `tds story update: PARTIAL after spec write \u2014 sprint-status flip failed.
  story: ${storyId}
  intended status: ${newStatus}
  spec body updated: ${specWritten ? "yes (on disk)" : "no"}
  sprint-status: NOT updated (still at previous status)
  error: ${msg}
Recovery: re-run \`tds story update --story=${storyId} --status=${newStatus} --as=${role}\` (idempotent \u2014 re-applies sprint flip without re-mutating spec body).
`
      };
    }
  }
  const { autoCommitTdsState: autoCommitTdsState2 } = await Promise.resolve().then(() => (init_git(), git_exports));
  const commitPaths = [specPath];
  if (sprintStatusUpdated) commitPaths.push(paths.sprintStatusYaml);
  const summary = [];
  if (newStatus !== void 0) summary.push(`status\u2192${newStatus}`);
  if (taskCompleteFlags.length > 0) summary.push(`tasks=${taskCompleteFlags.length}`);
  if (subtaskCompleteFlags.length > 0) summary.push(`subtasks=${subtaskCompleteFlags.length}`);
  if (completionNoteFlags.length > 0) summary.push(`notes=${completionNoteFlags.length}`);
  if (fileListFlags.length > 0) summary.push(`files=${fileListFlags.length}`);
  if (selfReviewBody !== null) summary.push("self-review");
  const autoCommit = autoCommitTdsState2({
    paths: commitPaths,
    message: `chore(${storyId}): ${summary.length > 0 ? summary.join(", ") : "spec update"}`,
    storyId,
    cwd: paths.projectRoot
  });
  const result = {
    story_id: storyId,
    spec_path: specPath,
    status: mutated.status,
    tasks_marked: taskCompleteFlags,
    subtasks_marked: subtaskCompleteFlags,
    notes_added: completionNoteFlags.length,
    files_added: fileListFlags,
    sprint_status_updated: sprintStatusUpdated,
    auto_committed: autoCommit.committed,
    ...autoCommit.sha !== null ? { commit_sha: autoCommit.sha } : {},
    ...autoCommit.reason !== void 0 ? { commit_skip_reason: autoCommit.reason } : {},
    warnings
  };
  const env = envelope("story update", EXIT.SUCCESS, result);
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : `story ${storyId} updated (status=${mutated.status ?? newStatus ?? "?"}, tasks=${taskCompleteFlags.length}, ` + (subtaskCompleteFlags.length > 0 ? `subtasks=${subtaskCompleteFlags.length}, ` : "") + `notes=${completionNoteFlags.length}, files=${fileListFlags.length}` + (warnings.length > 0 ? `, warnings=${warnings.length}` : "") + ")\n",
    stderr: ""
  };
}

// src/cli/handlers/story-findings.ts
import { join as pathJoin13 } from "node:path";
init_model();
async function handleStoryAddFinding(opts) {
  const { role, storyId, flags, paths, telemetryDir, wantJson } = opts;
  if (role !== "auditor") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: `tds story add-finding requires --as=auditor; current role '${role}' has no review-write permission (findings = auditor verdict writeback per spec \xA711)
`
    };
  }
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: "tds story add-finding"
      })
    };
  }
  const severityRaw = parseFlag(flags, "severity");
  const category = parseFlag(flags, "category");
  const finding = parseFlag(flags, "finding");
  if (!severityRaw || !category || !finding) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `story add-finding requires --severity=<${FINDING_SEVERITIES.join("|")}> --category=<text> --finding=<text>
`
    };
  }
  if (!isFindingSeverity(severityRaw)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `story add-finding --severity must be ${FINDING_SEVERITIES.join(" | ")} (got ${severityRaw})
`
    };
  }
  const severity = severityRaw;
  const suggestedFix = parseFlag(flags, "suggested-fix");
  const suggestedBridge = parseFlag(flags, "suggested-bridge");
  const specPath = pathJoin13(
    paths.outputFolder,
    "implementation-artifacts",
    "stories",
    `${storyId}.md`
  );
  const {
    readStorySpec: readStorySpec2,
    writeStorySpec: writeStorySpec2,
    appendAuditorFinding: appendAuditorFinding2,
    nextAuditorRound: nextAuditorRound2
  } = await Promise.resolve().then(() => (init_story_spec(), story_spec_exports));
  const spec = readStorySpec2(specPath);
  if (!spec) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `story spec not found: ${specPath}
`
    };
  }
  const round = nextAuditorRound2(spec);
  const mutated = appendAuditorFinding2(
    spec,
    {
      severity,
      category,
      finding,
      ...suggestedFix !== void 0 ? { suggestedFix } : {},
      ...suggestedBridge !== void 0 ? { suggestedBridge } : {}
    },
    round
  );
  await writeStorySpec2(specPath, mutated);
  const { autoCommitTdsState: autoCommitTdsState2 } = await Promise.resolve().then(() => (init_git(), git_exports));
  const autoCommit = autoCommitTdsState2({
    paths: [specPath],
    message: `chore(${storyId}): auditor finding (round-${round}, ${severity}, ${category})`,
    storyId,
    cwd: paths.projectRoot
  });
  const { emit: emit2 } = await Promise.resolve().then(() => (init_emit(), emit_exports));
  await emit2({
    telemetryDir,
    stream: "review-events",
    event: {
      kind: "finding",
      story_id: storyId,
      round,
      severity,
      category,
      has_suggested_fix: suggestedFix !== void 0,
      has_suggested_bridge: suggestedBridge !== void 0,
      recorded_by: role
    }
  });
  const result = {
    story_id: storyId,
    spec_path: specPath,
    round,
    severity,
    category,
    auto_committed: autoCommit.committed,
    ...autoCommit.sha !== null ? { commit_sha: autoCommit.sha } : {},
    ...autoCommit.reason !== void 0 ? { commit_skip_reason: autoCommit.reason } : {}
  };
  const env = envelope("story add-finding", EXIT.SUCCESS, result);
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : `${storyId}: finding added (round-${round}, severity=${severity}, category=${category})
`,
    stderr: ""
  };
}
async function handleStoryResolveFinding(opts) {
  const { role, storyId, flags, paths, telemetryDir, wantJson } = opts;
  if (role !== "auditor" && !isSpecialistRole(role)) {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: `tds story resolve-finding requires --as=auditor \u0438\u043B\u0438 specialist (engineer/csharp/python/java/frontend/ios/android); current role '${role}' has no closure permission
`
    };
  }
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: "tds story resolve-finding"
      })
    };
  }
  const roundRaw = parseFlag(flags, "round");
  const findingIndexRaw = parseFlag(flags, "finding-index");
  const reference = parseFlag(flags, "reference") ?? "manual";
  if (!roundRaw || !findingIndexRaw) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "story resolve-finding requires --round=<n> --finding-index=<i>\n"
    };
  }
  const round = Number(roundRaw);
  const findingIndex = Number(findingIndexRaw);
  if (!Number.isInteger(round) || round < 1) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `story resolve-finding --round must be positive integer (got ${roundRaw})
`
    };
  }
  if (!Number.isInteger(findingIndex) || findingIndex < 1) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `story resolve-finding --finding-index must be positive integer (got ${findingIndexRaw})
`
    };
  }
  const specPath = pathJoin13(
    paths.outputFolder,
    "implementation-artifacts",
    "stories",
    `${storyId}.md`
  );
  const { readStorySpec: readStorySpec2, writeStorySpec: writeStorySpec2, markFindingResolved: markFindingResolved2 } = await Promise.resolve().then(() => (init_story_spec(), story_spec_exports));
  const spec = readStorySpec2(specPath);
  if (!spec) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `story spec not found: ${specPath}
`
    };
  }
  const mutated = markFindingResolved2(spec, round, findingIndex, reference);
  if (mutated === null) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `story resolve-finding: round-${round} finding-${findingIndex} not found in ${storyId}.md (check round/finding-index via '## Auditor Findings (round-${round})' section)
`
    };
  }
  if (mutated === spec) {
    const env2 = envelope("story resolve-finding", EXIT.SUCCESS, {
      story_id: storyId,
      round,
      finding_index: findingIndex,
      reference,
      already_resolved: true
    });
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env2) : `${storyId}: round-${round} finding-${findingIndex} \u0443\u0436\u0435 resolved (idempotent)
`,
      stderr: ""
    };
  }
  await writeStorySpec2(specPath, mutated);
  const { autoCommitTdsState: autoCommitTdsState2 } = await Promise.resolve().then(() => (init_git(), git_exports));
  const autoCommit = autoCommitTdsState2({
    paths: [specPath],
    message: `chore(${storyId}): resolve finding round-${round}#${findingIndex} (${reference})`,
    storyId,
    cwd: paths.projectRoot
  });
  const { emit: emit2 } = await Promise.resolve().then(() => (init_emit(), emit_exports));
  await emit2({
    telemetryDir,
    stream: "review-events",
    event: {
      kind: "resolve-finding",
      story_id: storyId,
      round,
      finding_index: findingIndex,
      reference,
      recorded_by: role
    }
  });
  const result = {
    story_id: storyId,
    round,
    finding_index: findingIndex,
    reference,
    auto_committed: autoCommit.committed,
    ...autoCommit.sha !== null ? { commit_sha: autoCommit.sha } : {},
    ...autoCommit.reason !== void 0 ? { commit_skip_reason: autoCommit.reason } : {}
  };
  const env = envelope("story resolve-finding", EXIT.SUCCESS, result);
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : `${storyId}: round-${round} finding-${findingIndex} resolved (${reference})
`,
    stderr: ""
  };
}

// src/cli/handlers/story.ts
init_model();
async function handleStory(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(STORY_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown story subcommand: ${sub ?? ""} (allowed: ${STORY_SUBCOMMANDS.join(", ")})
${USAGE}`
    };
  }
  const flags = rest.slice(1);
  const storyId = parseFlag(flags, "story");
  const epicIdFlag = parseFlag(flags, "epic");
  if (!storyId && sub !== "add-findings" && !(sub === "status" && epicIdFlag)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `story ${sub} requires --story=<id>${sub === "status" ? " or --epic=<id>" : ""}
`
    };
  }
  if (sub === "update") {
    const newStatusEarly = parseFlag(flags, "status");
    const taskFlagsEarly = parseFlagAll(flags, "task-complete");
    const subtaskFlagsEarly = parseFlagAll(flags, "subtask-complete");
    const noteFlagsEarly = parseFlagAll(flags, "completion-note");
    const deferFlagsEarly = parseFlagAll(flags, "task-defer");
    const skipFinalEarly = flags.includes("--skip-finalization-check");
    const CLOSURES = /* @__PURE__ */ new Set(["review", "approved", "done"]);
    if (!skipFinalEarly && newStatusEarly !== void 0 && CLOSURES.has(newStatusEarly) && taskFlagsEarly.length === 0 && subtaskFlagsEarly.length === 0 && noteFlagsEarly.length === 0 && deferFlagsEarly.length === 0) {
      return {
        exitCode: EXIT.USAGE,
        stdout: "",
        stderr: `story update --status=${newStatusEarly} requires spec finalization: pass at least one of --task-complete=<label>, --subtask-complete=<fragment>, --completion-note=<text>, --task-defer=<label> // <reason>. Closure \u0431\u0435\u0437 \u0443\u043A\u0430\u0437\u0430\u043D\u0438\u044F what \u0431\u044B\u043B\u043E \u0441\u0434\u0435\u043B\u0430\u043D\u043E \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 spec \u043F\u0443\u0441\u0442\u043E\u0439 (false-clean state). Override: --skip-finalization-check (rare).
`
      };
    }
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin14(paths.runtimeDir, "telemetry");
  if (sub === "add-findings") {
    return await handleAddFindingsBatch({
      role,
      flags,
      paths,
      telemetryDir,
      wantJson
    });
  }
  if (sub === "unfreeze-tests") {
    if (!storyId) {
      throw new Error("unreachable: storyId required \u0434\u043B\u044F unfreeze-tests");
    }
    return await handleUnfreezeTests({
      role,
      storyId,
      flags,
      paths,
      telemetryDir,
      wantJson
    });
  }
  if (sub === "reset") {
    if (!storyId) {
      throw new Error("unreachable: storyId required \u0434\u043B\u044F reset");
    }
    return await handleStoryReset({
      role,
      storyId,
      flags,
      paths,
      telemetryDir,
      wantJson
    });
  }
  if (sub === "status" && epicIdFlag && !storyId) {
    const { readStorySpec: readStorySpec3 } = await Promise.resolve().then(() => (init_story_spec(), story_spec_exports));
    const { readSprintStatus: readSprintStatus3 } = await Promise.resolve().then(() => (init_sprint_status(), sprint_status_exports));
    const { findByStory: findByStory3 } = await Promise.resolve().then(() => (init_registry(), registry_exports));
    const extensionPath = pathJoin14(
      paths.tdsStateDir,
      "sprint-status-extension.yaml"
    );
    const sprintDoc = readSprintStatus3({
      sprintStatusPath: paths.sprintStatusYaml,
      extensionPath
    });
    const stories = sprintDoc.storiesByEpic.get(epicIdFlag) ?? [];
    if (stories.length === 0) {
      return {
        exitCode: EXIT.PRECONDITION,
        stdout: "",
        stderr: `story status --epic=${epicIdFlag}: no stories found in sprint-status.yaml
`
      };
    }
    const records = await Promise.all(
      stories.map(
        (s) => analyzeSingleStoryStatus({
          storyId: s.key,
          paths,
          sprintDoc,
          readStorySpec: readStorySpec3,
          findByStory: findByStory3
        })
      )
    );
    const result2 = { epic_id: epicIdFlag, stories: records };
    const env2 = envelope("story status", EXIT.SUCCESS, result2);
    if (wantJson) {
      return { exitCode: EXIT.SUCCESS, stdout: JSON.stringify(env2), stderr: "" };
    }
    const lines = records.map(
      (r) => `${r.story_id}: spec=${r.spec?.status ?? "missing"} sprint=${r.sprint_status?.status ?? "missing"} tasks=${r.spec?.tasks_done ?? 0}/${r.spec?.tasks_total ?? 0} branches=${r.branches.length}`
    );
    return {
      exitCode: EXIT.SUCCESS,
      stdout: lines.join("\n") + "\n",
      stderr: ""
    };
  }
  if (!storyId) {
    throw new Error("unreachable: storyId required \u0434\u043B\u044F sub=" + sub);
  }
  if (sub === "update") {
    if (!storyId) {
      throw new Error("unreachable: storyId required \u0434\u043B\u044F update");
    }
    return await handleStoryUpdate({
      role,
      storyId,
      flags,
      paths,
      telemetryDir,
      wantJson
    });
  }
  if (sub === "add-finding") {
    return await handleStoryAddFinding({
      role,
      storyId,
      flags,
      paths,
      telemetryDir,
      wantJson
    });
  }
  if (sub === "resolve-finding") {
    return await handleStoryResolveFinding({
      role,
      storyId,
      flags,
      paths,
      telemetryDir,
      wantJson
    });
  }
  if (sub !== "status") {
    return exhaustiveSwitch(sub, "story");
  }
  const { readStorySpec: readStorySpec2 } = await Promise.resolve().then(() => (init_story_spec(), story_spec_exports));
  const { readSprintStatus: readSprintStatus2 } = await Promise.resolve().then(() => (init_sprint_status(), sprint_status_exports));
  const { findByStory: findByStory2 } = await Promise.resolve().then(() => (init_registry(), registry_exports));
  const specPath = pathJoin14(
    paths.outputFolder,
    "implementation-artifacts",
    "stories",
    `${storyId}.md`
  );
  const spec = readStorySpec2(specPath);
  const tasksTotal = spec ? (spec.body.match(/^- \[[ x]\] \*\*Task\b/gm) ?? []).length : 0;
  const tasksDone = spec ? (spec.body.match(/^- \[x\] \*\*Task\b/gm) ?? []).length : 0;
  const subtasksTotal = spec ? (spec.body.match(/^\s+- \[[ x]\] /gm) ?? []).length : 0;
  const subtasksDone = spec ? (spec.body.match(/^\s+- \[x\] /gm) ?? []).length : 0;
  const sprint = readSprintStatus2({ sprintStatusPath: paths.sprintStatusYaml });
  const sprintEntry = sprint.byKey.get(storyId);
  const branches = await findByStory2({
    registryPath: paths.branchRegistryYaml,
    storyId
  });
  const inconsistencies = [];
  if (spec && spec.status === "review") {
    const activeBranch = branches.find((b) => b.status === "active");
    if (activeBranch) {
      inconsistencies.push(
        `spec status=review but branch ${activeBranch.branch} is still active \u2014 run \`tds branch merge --story=${storyId} --target=${activeBranch.base_branch} --message="${storyId}: <title>"\` to squash story_branch into base.`
      );
    }
  }
  if (spec && sprintEntry && spec.status !== sprintEntry.status) {
    inconsistencies.push(
      `spec status="${spec.status}" but sprint-status="${sprintEntry.status}" \u2014 run \`tds story update --as=engineer --story=${storyId} --status=${spec.status}\` to resync.`
    );
  }
  if (spec && tasksTotal > 0 && tasksDone === tasksTotal && spec.status === "ready-for-dev") {
    inconsistencies.push(
      `all ${tasksTotal} Tasks marked done but spec status=ready-for-dev \u2014 run \`tds story update --as=engineer --story=${storyId} --status=review\`.`
    );
  }
  if (spec && tasksDone > 0 && subtasksTotal > 0 && subtasksDone < tasksDone * (subtasksTotal / tasksTotal) * 0.5) {
    inconsistencies.push(
      `${tasksDone}/${tasksTotal} Tasks marked done but only ${subtasksDone}/${subtasksTotal} subtasks \u2014 re-run \`tds story update --as=engineer --story=${storyId} --task-complete="<task-label>"\` for each done Task to cascade subtasks (v6.0.1+).`
    );
  }
  const result = {
    story_id: storyId,
    spec: spec ? {
      path: specPath,
      status: spec.status,
      tasks_done: tasksDone,
      tasks_total: tasksTotal,
      subtasks_done: subtasksDone,
      subtasks_total: subtasksTotal
    } : null,
    sprint_status: sprintEntry ? { status: sprintEntry.status, kind: sprintEntry.kind } : null,
    branches: branches.map((b) => ({
      branch: b.branch,
      status: b.status,
      base_branch: b.base_branch,
      pr_number: b.pr_number,
      epic_id: b.epic_id
    })),
    inconsistencies
  };
  const env = envelope("story status", EXIT.SUCCESS, result);
  const inconsistencySuffix = inconsistencies.length > 0 ? "\n  warnings:\n    - " + inconsistencies.join("\n    - ") + "\n" : "";
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : `${storyId}: spec=${spec?.status ?? "missing"} sprint=${sprintEntry?.status ?? "missing"} tasks=${tasksDone}/${tasksTotal} subtasks=${subtasksDone}/${subtasksTotal} branches=${branches.length}` + inconsistencySuffix + (inconsistencySuffix ? "" : "\n"),
    stderr: ""
  };
}
async function handleUnfreezeTests(opts) {
  const { role, storyId, flags, paths, telemetryDir, wantJson } = opts;
  if (!isSpecialistRole(role)) {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: `tds story unfreeze-tests requires --as=<specialist> (engineer | python | csharp | java | frontend | ios | android); current role '${role}' has no test-edit-frozen unfreeze permission. Test-author writes original tests; specialists own unfreeze for impl-discovered issues (ADR-0012).
`
    };
  }
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: "tds story unfreeze-tests"
      })
    };
  }
  const reason = parseFlag(flags, "reason");
  if (!reason) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "story unfreeze-tests requires --reason=<text> (audit field \u2014 what made you reopen frozen tests; goes to state-transitions JSONL).\n"
    };
  }
  const { readSprintStatus: readSprintStatus2 } = await Promise.resolve().then(() => (init_sprint_status(), sprint_status_exports));
  const sprint = readSprintStatus2({ sprintStatusPath: paths.sprintStatusYaml });
  const stateBefore = sprint.byKey.get(storyId)?.status ?? null;
  const { setSprintStatusByKey: setSprintStatusByKey2, StateTransitionDeniedError: StateTransitionDeniedError2 } = await Promise.resolve().then(() => (init_set(), set_exports));
  try {
    await setSprintStatusByKey2({
      sprintStatusPath: paths.sprintStatusYaml,
      storyId,
      newStatus: "tests-needs-revision",
      triggeredBy: role,
      viaCommand: "tds story unfreeze-tests"
    });
  } catch (err) {
    if (err instanceof StateTransitionDeniedError2) {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "story-ops",
          reason: err.reason,
          command: "tds story unfreeze-tests"
        }) + (err.recovery ? `${err.recovery}
` : "")
      };
    }
    return {
      exitCode: EXIT.RUNTIME,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const { emit: emit2 } = await Promise.resolve().then(() => (init_emit(), emit_exports));
  await emit2({
    telemetryDir,
    stream: "state-transitions",
    event: {
      story_id: storyId,
      state_before: stateBefore,
      state_after: "tests-needs-revision",
      triggered_by: role,
      via_command: "tds story unfreeze-tests",
      kind: "unfreeze-tests",
      reason
    }
  });
  const result = {
    story_id: storyId,
    state_before: stateBefore,
    state_after: "tests-needs-revision",
    reason,
    triggered_by: role
  };
  const env = envelope("story unfreeze-tests", EXIT.SUCCESS, result);
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : `${storyId}: ${stateBefore ?? "?"} \u2192 tests-needs-revision (unfreeze, by=${role})
`,
    stderr: ""
  };
}
async function handleAddFindingsBatch(opts) {
  const { role, flags, paths, telemetryDir, wantJson } = opts;
  if (role !== "auditor") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: `tds story add-findings requires --as=auditor; current role '${role}' has no review-write permission (findings = auditor verdict writeback per spec \xA711)
`
    };
  }
  const decision = await checkRoleSkillOperation({
    role,
    op: "story-ops",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops",
        reason: decision.reason,
        command: "tds story add-findings"
      })
    };
  }
  const findingsFile = parseFlag(flags, "findings-file");
  if (!findingsFile) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "story add-findings requires --findings-file=<path.yaml>\n"
    };
  }
  const { existsSync: existsSync31, readFileSync: readFileSync29 } = await import("node:fs");
  if (!existsSync31(findingsFile)) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `findings file not found: ${findingsFile}
`
    };
  }
  const { parse: parseYaml24 } = await Promise.resolve().then(() => __toESM(require_dist(), 1));
  let parsed;
  try {
    parsed = parseYaml24(readFileSync29(findingsFile, "utf8"));
  } catch (err) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `findings file YAML parse failed: ${err.message}
`
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `findings file must contain a YAML array of records (got ${typeof parsed})
`
    };
  }
  const {
    readStorySpec: readStorySpec2,
    writeStorySpec: writeStorySpec2,
    appendAuditorFinding: appendAuditorFinding2,
    nextAuditorRound: nextAuditorRound2
  } = await Promise.resolve().then(() => (init_story_spec(), story_spec_exports));
  const { emit: emit2 } = await Promise.resolve().then(() => (init_emit(), emit_exports));
  const written = [];
  const writeFailures = [];
  const counts = { blockers: 0, warnings: 0, info: 0 };
  for (const [idx, raw] of parsed.entries()) {
    if (!raw || typeof raw !== "object") {
      writeFailures.push({
        index: idx,
        error: "entry must be a YAML mapping"
      });
      continue;
    }
    const r = raw;
    const storyId = typeof r["story"] === "string" ? r["story"] : void 0;
    const severity = typeof r["severity"] === "string" && isFindingSeverity(r["severity"]) ? r["severity"] : void 0;
    const category = typeof r["category"] === "string" ? r["category"] : void 0;
    const finding = typeof r["finding"] === "string" ? r["finding"] : void 0;
    const suggestedFix = typeof r["suggested_fix"] === "string" ? r["suggested_fix"] : void 0;
    const suggestedBridge = typeof r["suggested_bridge"] === "string" ? r["suggested_bridge"] : void 0;
    if (!storyId || !severity || !category || !finding) {
      writeFailures.push({
        index: idx,
        ...storyId !== void 0 ? { story_id: storyId } : {},
        error: "missing required fields (story, severity, category, finding)"
      });
      continue;
    }
    const specPath = pathJoin14(
      paths.outputFolder,
      "implementation-artifacts",
      "stories",
      `${storyId}.md`
    );
    const spec = readStorySpec2(specPath);
    if (!spec) {
      writeFailures.push({
        index: idx,
        story_id: storyId,
        error: `spec not found: ${specPath}`
      });
      continue;
    }
    const round = nextAuditorRound2(spec);
    const mutated = appendAuditorFinding2(
      spec,
      {
        severity,
        category,
        finding,
        ...suggestedFix !== void 0 ? { suggestedFix } : {},
        ...suggestedBridge !== void 0 ? { suggestedBridge } : {}
      },
      round
    );
    try {
      await writeStorySpec2(specPath, mutated);
    } catch (err) {
      writeFailures.push({
        index: idx,
        story_id: storyId,
        error: `write failed: ${err.message}`
      });
      continue;
    }
    await emit2({
      telemetryDir,
      stream: "review-events",
      event: {
        kind: "finding",
        story_id: storyId,
        round,
        severity,
        category,
        has_suggested_fix: suggestedFix !== void 0,
        has_suggested_bridge: suggestedBridge !== void 0,
        recorded_by: role
      }
    });
    written.push({ story_id: storyId, round, severity, category });
    if (severity === "blocker") counts.blockers++;
    else if (severity === "warn") counts.warnings++;
    else counts.info++;
  }
  const { autoCommitTdsState: autoCommitTdsState2 } = await Promise.resolve().then(() => (init_git(), git_exports));
  const autoCommitsByStory = {};
  const perStory = /* @__PURE__ */ new Map();
  for (const w of written) {
    const specPath = pathJoin14(
      paths.outputFolder,
      "implementation-artifacts",
      "stories",
      `${w.story_id}.md`
    );
    const existing = perStory.get(w.story_id);
    perStory.set(w.story_id, {
      count: (existing?.count ?? 0) + 1,
      specPath
    });
  }
  for (const [storyId, info] of perStory.entries()) {
    autoCommitsByStory[storyId] = autoCommitTdsState2({
      paths: [info.specPath],
      message: `chore(${storyId}): auditor finding writeback (${info.count} finding${info.count > 1 ? "s" : ""})`,
      storyId,
      cwd: paths.projectRoot
    });
  }
  const auto_commits = Object.fromEntries(
    Object.entries(autoCommitsByStory).map(([sid, ac]) => [
      sid,
      {
        committed: ac.committed,
        ...ac.sha !== null ? { sha: ac.sha } : {},
        ...ac.reason !== void 0 ? { reason: ac.reason } : {}
      }
    ])
  );
  let applyVerdictResult = null;
  let applyVerdictError = null;
  if (flags.includes("--apply-verdict")) {
    try {
      const { applyVerdict: applyVerdict2 } = await Promise.resolve().then(() => (init_apply_verdict(), apply_verdict_exports));
      const writtenStoryIds = [...new Set(written.map((w) => w.story_id))];
      let scope;
      if (writtenStoryIds.length === 1) {
        scope = { kind: "story", id: writtenStoryIds[0] };
      } else {
        const { readExtension: readExtension2 } = await Promise.resolve().then(() => (init_bridge(), bridge_exports));
        const ext = readExtension2(
          pathJoin14(paths.tdsStateDir, "sprint-status-extension.yaml")
        );
        const epicIds = /* @__PURE__ */ new Set();
        for (const sid of writtenStoryIds) {
          const epic = ext.parents?.[sid];
          if (typeof epic === "string") epicIds.add(epic);
        }
        if (epicIds.size === 1) {
          scope = { kind: "epic", id: [...epicIds][0] };
        } else {
          applyVerdictError = `--apply-verdict requires single epic scope; findings span ${epicIds.size} epic(s) \u2014 invoke \`tds review apply-verdict --epic=<id>\` per epic explicitly`;
          scope = null;
        }
      }
      if (applyVerdictError === null) {
        applyVerdictResult = await applyVerdict2({
          scope,
          projectRoot: paths.projectRoot,
          sprintStatusPath: paths.sprintStatusYaml,
          extensionPath: pathJoin14(
            paths.tdsStateDir,
            "sprint-status-extension.yaml"
          ),
          storiesDir: pathJoin14(
            paths.outputFolder,
            "implementation-artifacts",
            "stories"
          ),
          tdsStateDir: paths.tdsStateDir,
          outputFolder: paths.outputFolder,
          telemetryDir,
          triggeredBy: role
        });
      }
    } catch (err) {
      applyVerdictError = err.message;
    }
  }
  await emit2({
    telemetryDir,
    stream: "review-events",
    event: {
      kind: "summary",
      written_count: written.length,
      write_failures_count: writeFailures.length,
      counts,
      recorded_by: role,
      ...applyVerdictResult !== null ? {
        apply_verdict: {
          verdict: applyVerdictResult.verdict,
          flipped_to_rework: applyVerdictResult.flippedStoryIds,
          flipped_to_approved: applyVerdictResult.flippedToApproved,
          epic_flipped_to_approved: applyVerdictResult.epicFlippedToApproved
        }
      } : {},
      ...applyVerdictError !== null ? { apply_verdict_error: applyVerdictError } : {}
    }
  });
  let nextStepHint = null;
  if (!flags.includes("--apply-verdict") && writeFailures.length === 0 && written.length > 0) {
    const writtenStoryIds = [...new Set(written.map((w) => w.story_id))];
    if (writtenStoryIds.length === 1) {
      nextStepHint = `next-step: tds review apply-verdict --story=${writtenStoryIds[0]} --as=engineer`;
    } else {
      const { readExtension: readExtension2 } = await Promise.resolve().then(() => (init_bridge(), bridge_exports));
      const ext = readExtension2(
        pathJoin14(paths.tdsStateDir, "sprint-status-extension.yaml")
      );
      const epicIds = /* @__PURE__ */ new Set();
      for (const sid of writtenStoryIds) {
        const epic = ext.parents?.[sid];
        if (typeof epic === "string") epicIds.add(epic);
      }
      if (epicIds.size === 1) {
        nextStepHint = `next-step: tds review apply-verdict --epic=${[...epicIds][0]} --as=engineer`;
      }
    }
  }
  const result = {
    written_count: written.length,
    written,
    write_failures: writeFailures,
    counts,
    auto_commits,
    ...applyVerdictResult !== null ? { apply_verdict: applyVerdictResult } : {},
    ...applyVerdictError !== null ? { apply_verdict_error: applyVerdictError } : {},
    ...nextStepHint !== null ? { next_step: nextStepHint } : {}
  };
  const env = envelope("story add-findings", EXIT.SUCCESS, result);
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : `wrote ${written.length} finding(s) (blockers=${counts.blockers} warnings=${counts.warnings} info=${counts.info})` + (writeFailures.length > 0 ? `; ${writeFailures.length} failure(s):
` + writeFailures.map((f) => `  [${f.index}] ${f.story_id ?? "?"}: ${f.error}`).join("\n") + "\n" : "\n") + (applyVerdictResult !== null ? `apply-verdict: ${applyVerdictResult.verdict} (rework=${applyVerdictResult.flippedStoryIds.length} approved=${applyVerdictResult.flippedToApproved.length}` + (applyVerdictResult.epicFlippedToApproved ? " epic\u2192approved" : "") + `)
` : applyVerdictError !== null ? `apply-verdict skipped: ${applyVerdictError}
` : "") + (nextStepHint !== null ? `${nextStepHint}
` : ""),
    stderr: ""
  };
}
async function handleStoryReset(opts) {
  const { role, storyId, flags, paths, telemetryDir, wantJson } = opts;
  if (role !== "auditor") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "story-ops/reset",
        reason: `tds story reset reserved for auditor (got --as=${role}). Recovery \u2014 operator-level decision, not specialist option.`,
        command: "tds story reset"
      })
    };
  }
  const target = parseFlag(flags, "to");
  if (!target) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "tds story reset requires --to=<halted|ready-for-dev>. halted = universal halt; ready-for-dev = re-entry from halted.\n"
    };
  }
  if (target !== "halted" && target !== "ready-for-dev") {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `tds story reset --to=<value>: only 'halted' or 'ready-for-dev' allowed (got ${target}).
`
    };
  }
  const reason = parseFlag(flags, "reason");
  if (!reason) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "tds story reset requires --reason=<text> (audit-trail \u0434\u043B\u044F recovery).\n"
    };
  }
  const { applyStateTransition: applyStateTransition2, StateTransitionDeniedError: StateTransitionDeniedError2 } = await Promise.resolve().then(() => (init_apply_transition(), apply_transition_exports));
  const storyMdPath = pathJoin14(
    paths.outputFolder,
    "implementation-artifacts",
    "stories",
    `${storyId}.md`
  );
  try {
    const r = await applyStateTransition2({
      sprintStatusPath: paths.sprintStatusYaml,
      storyId,
      newStatus: target,
      role,
      viaCommand: `tds story reset (reason: ${reason})`,
      telemetryDir,
      storyMdPath,
      stateManifestPath: paths.stateManifestYaml,
      projectRoot: paths.projectRoot
    });
    const result = {
      story_id: storyId,
      state_before: r.stateBefore,
      state_after: r.stateAfter,
      reason,
      triggered_by: role
    };
    const env = envelope("story reset", EXIT.SUCCESS, result);
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : `${storyId}: ${r.stateBefore} \u2192 ${r.stateAfter} (reset, by=${role}, reason: ${reason})
`,
      stderr: ""
    };
  } catch (err) {
    if (err instanceof StateTransitionDeniedError2) {
      return {
        exitCode: EXIT.AUTHZ,
        stdout: "",
        stderr: formatAuthzDeny({
          role,
          op: "story-ops/reset",
          reason: err.reason,
          command: "tds story reset"
        }) + (err.recovery ? `${err.recovery}
` : "")
      };
    }
    return {
      exitCode: EXIT.RUNTIME,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
}
async function analyzeSingleStoryStatus(opts) {
  const specPath = pathJoin14(
    opts.paths.outputFolder,
    "implementation-artifacts",
    "stories",
    `${opts.storyId}.md`
  );
  const spec = opts.readStorySpec(specPath);
  const tasksTotal = spec ? (spec.body.match(/^- \[[ x]\] \*\*Task\b/gm) ?? []).length : 0;
  const tasksDone = spec ? (spec.body.match(/^- \[x\] \*\*Task\b/gm) ?? []).length : 0;
  const subtasksTotal = spec ? (spec.body.match(/^\s+- \[[ x]\] /gm) ?? []).length : 0;
  const subtasksDone = spec ? (spec.body.match(/^\s+- \[x\] /gm) ?? []).length : 0;
  const sprintEntry = opts.sprintDoc.byKey.get(opts.storyId);
  const branches = await opts.findByStory({
    registryPath: opts.paths.branchRegistryYaml,
    storyId: opts.storyId
  });
  return {
    story_id: opts.storyId,
    spec: spec ? {
      path: specPath,
      status: spec.status,
      tasks_done: tasksDone,
      tasks_total: tasksTotal,
      subtasks_done: subtasksDone,
      subtasks_total: subtasksTotal
    } : null,
    sprint_status: sprintEntry ? { status: sprintEntry.status, kind: sprintEntry.kind } : null,
    branches: branches.map((b) => ({
      branch: b.branch,
      status: b.status,
      base_branch: b.base_branch,
      pr_number: b.pr_number,
      epic_id: b.epic_id
    }))
  };
}

// src/cli/handlers/setup.ts
import { existsSync as existsSync30 } from "node:fs";
import { join as pathJoin15, dirname as pathDirname } from "node:path";

// src/setup/init.ts
var import_proper_lockfile9 = __toESM(require_proper_lockfile(), 1);
var import_write_file_atomic9 = __toESM(require_lib(), 1);
var import_yaml20 = __toESM(require_dist(), 1);
init_emit();
import {
  chmodSync,
  existsSync as existsSync25,
  mkdirSync as mkdirSync8,
  readFileSync as readFileSync24,
  writeFileSync as writeFileSync4
} from "node:fs";
import { dirname as dirname12, join as join14 } from "node:path";
import { execSync as execSync2 } from "node:child_process";
var SETUP_PROFILES = ["lite", "full"];
var PROFILE_SET = new Set(SETUP_PROFILES);
var RUNTIME_SUBDIRS = [
  "locks",
  "doctor",
  "telemetry"
];
var COMMIT_MSG_HOOK_BODY = `#!/usr/bin/env bash
# TDS commit-msg hook (full profile) \u2014 enforces Story-Id trailer presence.
# Generated by \`tds setup init --profile=full\`. Re-run setup init to refresh.
# Bypass: set TDS_BYPASS=1 (intentional for emergency / TDS-internal commits).
set -e

if [ "\${TDS_BYPASS:-0}" = "1" ]; then exit 0; fi

msg_file="$1"
if [ -z "\${msg_file}" ] || [ ! -f "\${msg_file}" ]; then exit 0; fi

# Use git interpret-trailers (canonical parser) to detect the trailer block.
if git interpret-trailers --parse "\${msg_file}" | grep -q "^Story-Id: "; then
  exit 0
fi

# Note: heredoc terminator MUST be quoted (<<'EOF', not <<EOF). Without
# quoting, bash performs command substitution on backticks inside the
# heredoc body \u2014 the literal markdown backticks around 'full' and
# 'git commit' would be parsed as \`full\` / \`git commit\` and bash
# would try to execute them, exiting with "full: command not found"
# under \`set -e\`. Quoted heredoc \u2192 bytes printed verbatim.
cat >&2 <<'EOF'
\u2717 TDS commit-msg hook: missing 'Story-Id:' trailer in commit message.

  TDS 'full' profile enforces story-attributed commits. Use:
    tds commit --story=<id> -m "<msg>" -- <path> [<path> ...]

  This adds the Story-Id trailer + writes through forbidden-quadrant authz
  + records integrity sha256 + emits JSONL telemetry \u2014 none of which raw
  'git commit' does.

  Emergency override: set TDS_BYPASS=1 (use sparingly; audit trail breaks).
EOF
exit 1
`;
function installCommitMsgHook(projectRoot) {
  const hooksDir = join14(projectRoot, ".git", "hooks");
  if (!existsSync25(hooksDir)) return null;
  const hookPath = join14(hooksDir, "commit-msg");
  import_write_file_atomic9.default.sync(hookPath, COMMIT_MSG_HOOK_BODY);
  chmodSync(hookPath, 493);
  return hookPath;
}
var PREPARE_COMMIT_MSG_HOOK_BODY = `#!/usr/bin/env bash
# TDS prepare-commit-msg hook \u2014 auto-injects fallback Story-Id trailer.
# Generated by \`tds setup init --profile=full\`. Re-run setup init to refresh.
#
# Pairs with commit-msg hook: prepare runs first, optionally adding trailer;
# commit-msg then validates presence. User-supplied Story-Id wins (no dup).
set -e

msg_file="$1"
commit_source="\${2:-}"

if [ -z "\${msg_file}" ] || [ ! -f "\${msg_file}" ]; then exit 0; fi

# Skip merge/squash/amend \u2014 those preserve original message bytes.
case "\${commit_source}" in
  merge|squash|commit) exit 0 ;;
esac

# Skip if Story-Id already present (canonical parser handles trailer block).
if git interpret-trailers --parse "\${msg_file}" | grep -q "^Story-Id: "; then
  exit 0
fi

# Inject default trailer. \`chore-auto\` = signal \xABnon-attributed\xBB; commit-msg
# hook accepts presence-only, audit reviewer sees explicit category.
git interpret-trailers --in-place --trailer "Story-Id: chore-auto" "\${msg_file}"
`;
function installPrepareCommitMsgHook(projectRoot) {
  const hooksDir = join14(projectRoot, ".git", "hooks");
  if (!existsSync25(hooksDir)) return null;
  const hookPath = join14(hooksDir, "prepare-commit-msg");
  import_write_file_atomic9.default.sync(hookPath, PREPARE_COMMIT_MSG_HOOK_BODY);
  chmodSync(hookPath, 493);
  return hookPath;
}
function detectInstalledBy() {
  try {
    return execSync2("whoami", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch {
    return process.env["USER"] ?? process.env["USERNAME"] ?? "unknown";
  }
}
async function writeYamlAtomic(path, doc) {
  mkdirSync8(dirname12(path), { recursive: true });
  const yaml = (0, import_yaml20.stringify)(doc, { indent: 2, lineWidth: 0 });
  if (!existsSync25(path)) {
    writeFileSync4(path, "");
  }
  const release = await import_proper_lockfile9.default.lock(path, {
    retries: { retries: 50, factor: 1, minTimeout: 5, maxTimeout: 50 },
    stale: 5e3,
    realpath: false
  });
  try {
    await (0, import_write_file_atomic9.default)(path, yaml, { fsync: true });
  } finally {
    await release();
  }
}
function isValidStateManifest(raw) {
  try {
    const doc = (0, import_yaml20.parse)(raw);
    return doc.schema_version === "1.0" && Array.isArray(doc.entries);
  } catch {
    return false;
  }
}
function isValidBranchRegistry(raw) {
  try {
    const doc = (0, import_yaml20.parse)(raw);
    return doc.schema_version === "1.0" && Array.isArray(doc.branches);
  } catch {
    return false;
  }
}
function isValidLessons(raw) {
  try {
    const doc = (0, import_yaml20.parse)(raw);
    return doc.schema_version === "1.0" && Array.isArray(doc.lessons);
  } catch {
    return false;
  }
}
async function setupInit(opts) {
  const profile = opts.profile ?? "full";
  if (!PROFILE_SET.has(profile)) {
    throw new Error(
      `unknown profile: ${profile} (allowed: ${[...SETUP_PROFILES].join(", ")})`
    );
  }
  const branchMode = profile === "full" ? "branch" : "trunk";
  const installedAt = opts.installedAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const installedBy = opts.installedBy ?? detectInstalledBy();
  const filesCreated = [];
  const filesPreserved = [];
  if (existsSync25(opts.stateManifestYaml)) {
    const existing = readFileSync24(opts.stateManifestYaml, "utf8");
    if (isValidStateManifest(existing)) {
      filesPreserved.push(opts.stateManifestYaml);
    } else {
      throw new Error(
        `${opts.stateManifestYaml} exists but is schema-invalid; remove or repair before re-running \`tds setup init\`.`
      );
    }
  } else {
    const doc = {
      schema_version: "1.0",
      tds_meta: {
        profile,
        branch_mode: branchMode,
        installed_at: installedAt,
        installed_by: installedBy,
        archived_phases: []
      },
      entries: []
    };
    await writeYamlAtomic(opts.stateManifestYaml, doc);
    filesCreated.push(opts.stateManifestYaml);
  }
  if (existsSync25(opts.branchRegistryYaml)) {
    const existing = readFileSync24(opts.branchRegistryYaml, "utf8");
    if (isValidBranchRegistry(existing)) {
      filesPreserved.push(opts.branchRegistryYaml);
    } else {
      throw new Error(
        `${opts.branchRegistryYaml} exists but is schema-invalid; remove or repair before re-running \`tds setup init\`.`
      );
    }
  } else {
    const doc = {
      schema_version: "1.0",
      branches: []
    };
    await writeYamlAtomic(opts.branchRegistryYaml, doc);
    filesCreated.push(opts.branchRegistryYaml);
  }
  const lessonsPath = `${opts.tdsStateDir}/memory/lessons.yaml`;
  if (existsSync25(lessonsPath)) {
    const existing = readFileSync24(lessonsPath, "utf8");
    if (isValidLessons(existing)) {
      filesPreserved.push(lessonsPath);
    } else {
      throw new Error(
        `${lessonsPath} exists but is schema-invalid; remove or repair before re-running \`tds setup init\`.`
      );
    }
  } else {
    const doc = {
      schema_version: "1.0",
      lessons: []
    };
    await writeYamlAtomic(lessonsPath, doc);
    filesCreated.push(lessonsPath);
  }
  for (const sub of RUNTIME_SUBDIRS) {
    const dir = `${opts.tdsStateDir}/runtime/${sub}`;
    mkdirSync8(dir, { recursive: true });
    const gitkeep = `${dir}/.gitkeep`;
    if (!existsSync25(gitkeep)) {
      writeFileSync4(gitkeep, "");
      filesCreated.push(gitkeep);
    } else {
      filesPreserved.push(gitkeep);
    }
  }
  const hooksInstalled = [];
  if (profile === "full" && !opts.skipHooks) {
    const commitMsg = installCommitMsgHook(opts.projectRoot);
    if (commitMsg !== null) hooksInstalled.push(commitMsg);
    const prepare = installPrepareCommitMsgHook(opts.projectRoot);
    if (prepare !== null) hooksInstalled.push(prepare);
  }
  await emit({
    telemetryDir: opts.telemetryDir,
    stream: "install-events",
    event: {
      kind: "setup-init",
      profile,
      branch_mode: branchMode,
      installed_at: installedAt,
      installed_by: installedBy,
      files_created_count: filesCreated.length,
      files_preserved_count: filesPreserved.length,
      hooks_installed: hooksInstalled.length
    }
  });
  return {
    profile,
    branchMode,
    installedAt,
    installedBy,
    filesCreated,
    filesPreserved,
    hooksInstalled
  };
}

// src/setup/install.ts
var import_yaml21 = __toESM(require_dist(), 1);
var import_write_file_atomic10 = __toESM(require_lib(), 1);
import {
  chmodSync as chmodSync2,
  existsSync as existsSync26,
  mkdirSync as mkdirSync9,
  readFileSync as readFileSync25,
  readdirSync as readdirSync4,
  statSync as statSync4,
  writeFileSync as writeFileSync5
} from "node:fs";
import { copyFile } from "node:fs/promises";
import { createHash as createHash4 } from "node:crypto";
import { spawnSync as spawnSync9 } from "node:child_process";
import { dirname as dirname13, join as join15, resolve as resolve4 } from "node:path";
import { fileURLToPath as fileURLToPath7 } from "node:url";
function defaultSourceRoot() {
  const here = dirname13(fileURLToPath7(import.meta.url));
  return resolve4(here, "..");
}
function copyTreeFiltered(src, dst, filter, recorded) {
  mkdirSync9(dst, { recursive: true });
  for (const entry of readdirSync4(src, { withFileTypes: true })) {
    const srcPath = join15(src, entry.name);
    const dstPath = join15(dst, entry.name);
    if (entry.isDirectory()) {
      copyTreeFiltered(srcPath, dstPath, filter, recorded);
    } else if (entry.isFile()) {
      if (!filter(entry.name)) continue;
      const bytes = readFileSync25(srcPath);
      writeFileSync5(dstPath, bytes);
      recorded.push(dstPath);
    }
  }
}
function sha256Hex(content) {
  return createHash4("sha256").update(content).digest("hex");
}
function verifyPayloadIntegrity(sourceRoot, targetRoot) {
  const sourceModuleYaml = join15(sourceRoot, "module.yaml");
  if (!existsSync26(sourceModuleYaml)) {
    throw new Error(
      `TDS-ERR:PAYLOAD_INTEGRITY_FAILED: ${sourceModuleYaml} missing \u2014 cannot verify payload sha256 \u0431\u0435\u0437 manifest. Source root may be truncated / partially-cached. Re-run \`bmad install --update --force\` (re-fetch payload), then retry.`
    );
  }
  let parsed;
  try {
    parsed = (0, import_yaml21.parse)(readFileSync25(sourceModuleYaml, "utf8")) ?? {};
  } catch (err) {
    throw new Error(
      `TDS-ERR:PAYLOAD_INTEGRITY_FAILED: ${sourceModuleYaml} is not valid YAML: ${err.message}`
    );
  }
  const expectedRaw = parsed.expected_payload_sha256;
  if (!expectedRaw || typeof expectedRaw !== "object" || Object.keys(expectedRaw).length === 0) {
    throw new Error(
      `TDS-ERR:PAYLOAD_INTEGRITY_FAILED: ${sourceModuleYaml} missing \`expected_payload_sha256\` map. The build (\`pnpm run build:bundle\`) must inject this \u2014 see build/payload-sha256.ts.`
    );
  }
  const failures = [];
  for (const [relPath2, expectedHash] of Object.entries(expectedRaw)) {
    if (typeof expectedHash !== "string") {
      failures.push(`${relPath2}: expected sha256 is not a string`);
      continue;
    }
    const targetFile = join15(targetRoot, relPath2);
    if (!existsSync26(targetFile)) {
      failures.push(`${relPath2}: missing from installed payload`);
      continue;
    }
    const actual = sha256Hex(readFileSync25(targetFile));
    if (actual !== expectedHash) {
      failures.push(
        `${relPath2}: sha256 mismatch (expected ${expectedHash.slice(0, 16)}\u2026, actual ${actual.slice(0, 16)}\u2026)`
      );
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `TDS-ERR:PAYLOAD_INTEGRITY_FAILED: ${failures.length} integrity violation(s) detected post-copy. The installed payload at ${targetRoot} does not match \`module.yaml.expected_payload_sha256\` from ${sourceRoot}. Probable causes: tampered \`--custom-source\` path, truncated cache, stale build (run \`pnpm run build:bundle\` in source repo to refresh sha256 map). Failures:
` + failures.map((f) => `  - ${f}`).join("\n")
    );
  }
}
function shouldSkipShared(name) {
  if (name === ".DS_Store") return false;
  if (name.endsWith(".map")) return false;
  return true;
}
function shouldSkipBin(name) {
  if (name === ".DS_Store") return false;
  return true;
}
var TDS_DENY_PATTERNS = [
  "Edit(_bmad/tds/**)",
  "Write(_bmad/tds/**)",
  "Edit(_bmad-output/_tds/state-manifest.yaml)",
  "Write(_bmad-output/_tds/state-manifest.yaml)",
  "Edit(_bmad-output/_tds/branch-registry.yaml)",
  "Write(_bmad-output/_tds/branch-registry.yaml)",
  "Edit(_bmad-output/_tds/memory/lessons.yaml)",
  "Write(_bmad-output/_tds/memory/lessons.yaml)"
  // Story specs — НЕ deny'им. Earlier версии модуля carried
  // `Edit(_bmad-output/implementation-artifacts/stories/**)` чтобы
  // forсе'ить mutations через `tds story update` (status flip / task
  // checkmarks / completion notes / file list / self-review). На
  // практике это блокировало legitimate prose edits в Dev Notes / AC
  // дополнениях / design rationale секциях spec body. Skill text в
  // `bmad-tds-execute-story` Step 4 предупреждает LLM никогда не
  // редактировать вручную: Status: line, `- [ ]` task markers, ###
  // Completion Notes List / ### File List / ## Specialist Self-Review —
  // те через CLI atomically + telemetry. Free-form prose edits — Read +
  // Edit OK. Legacy rule cleaning — см. TDS_LEGACY_DENY_TO_REMOVE.
];
var TDS_ASK_PATTERNS = [
  "Edit(_bmad-output/implementation-artifacts/sprint-status.yaml)",
  "Write(_bmad-output/implementation-artifacts/sprint-status.yaml)",
  "Edit(_bmad/bmm/sprint-status.yaml)",
  "Write(_bmad/bmm/sprint-status.yaml)"
];
var TDS_LEGACY_DENY_TO_REMOVE = [
  // v6.0.49+: overly-aggressive. См. TDS_DENY_PATTERNS comment block выше.
  "Edit(_bmad-output/implementation-artifacts/stories/**)",
  // 2026-05-12: sprint-status moved deny → ask (см. TDS_ASK_PATTERNS).
  // Removing legacy deny entries из existing settings.json чтобы не
  // оставались параллельно с new ask entries — иначе deny wins, ask
  // не has effect.
  "Edit(_bmad-output/implementation-artifacts/sprint-status.yaml)",
  "Write(_bmad-output/implementation-artifacts/sprint-status.yaml)",
  "Edit(_bmad/bmm/sprint-status.yaml)",
  "Write(_bmad/bmm/sprint-status.yaml)"
];
var TDS_ALLOW_RELATIVE_PATTERNS = [
  // Bare `tds` — global walk-up shim installed by `tds setup install-shim`
  // into ~/.local/bin/tds (or user's chosen --target). When the shim is on
  // PATH every project resolves `tds <cmd>` via walk-up to its own
  // _bmad/tds/bin/tds. Keeping the project-rooted patterns below so
  // projects without the shim still work.
  "Bash(tds:*)",
  "Bash(tds)",
  // Runtime CLI surfaces — relative form (match when cwd == project root).
  "Bash(node _bmad/tds/shared/tds-runtime.bundle.js *)",
  "Bash(_bmad/tds/bin/tds *)",
  "Bash(node _bmad/tds/shared/tds-runtime.bundle.js)",
  "Bash(_bmad/tds/bin/tds)",
  // Same surfaces with explicit `./` prefix. Claude sometimes types
  // `./_bmad/tds/bin/tds ...` when emphasising "current directory" —
  // strict-prefix match treats this as a different path than the bare
  // form, so it needs its own pattern (callisto pilot caught this:
  // `Bash(./_bmad/tds/bin/tds ...)` triggered a permission prompt
  // because only `Bash(_bmad/tds/bin/tds *)` was pre-approved).
  "Bash(node ./_bmad/tds/shared/tds-runtime.bundle.js *)",
  "Bash(./_bmad/tds/bin/tds *)",
  "Bash(node ./_bmad/tds/shared/tds-runtime.bundle.js)",
  "Bash(./_bmad/tds/bin/tds)",
  // Setup-time helpers (kept for skill upgrades / repair flows that may
  // still touch shell). Tight patterns only.
  "Bash(python3 _bmad/scripts/resolve_customization.py *)",
  "Bash(python3 ./_bmad/scripts/resolve_customization.py *)",
  "Bash(git --version)",
  "Bash(node --version)",
  "Bash(python3 --version)",
  "Bash(shasum -a 256 -c *)"
];
function buildAllowPatterns(projectRoot) {
  const absolute = [
    `Bash(node ${projectRoot}/_bmad/tds/shared/tds-runtime.bundle.js *)`,
    `Bash(${projectRoot}/_bmad/tds/bin/tds *)`,
    `Bash(node ${projectRoot}/_bmad/tds/shared/tds-runtime.bundle.js)`,
    `Bash(${projectRoot}/_bmad/tds/bin/tds)`,
    `Bash(python3 ${projectRoot}/_bmad/scripts/resolve_customization.py *)`
  ];
  return [...TDS_ALLOW_RELATIVE_PATTERNS, ...absolute];
}
function mergeStringArray(existing, additions) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  if (Array.isArray(existing)) {
    for (const v of existing) {
      if (typeof v === "string" && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
  }
  for (const v of additions) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
var GITIGNORE_BLOCK_HEADER = "# === TDS runtime artifacts (auto-managed by `tds setup install`) ===";
var GITIGNORE_BLOCK_FOOTER = "# === end TDS block ===";
var TDS_GITIGNORE_PATTERNS = [
  GITIGNORE_BLOCK_HEADER,
  "_bmad-output/_tds/runtime/",
  GITIGNORE_BLOCK_FOOTER
];
function patchGitignore(projectRoot) {
  const path = join15(projectRoot, ".gitignore");
  let body = "";
  if (existsSync26(path)) {
    body = readFileSync25(path, "utf8");
    if (body.includes(GITIGNORE_BLOCK_HEADER)) {
      return null;
    }
    if (body.length > 0 && !body.endsWith("\n")) body += "\n";
  }
  body += `
${TDS_GITIGNORE_PATTERNS.join("\n")}
`;
  import_write_file_atomic10.default.sync(path, body);
  return path;
}
function untrackRuntimeArtifacts(projectRoot) {
  if (!existsSync26(join15(projectRoot, ".git"))) return [];
  const runtimePath = "_bmad-output/_tds/runtime";
  if (!existsSync26(join15(projectRoot, runtimePath))) return [];
  const lsFiles = spawnSync9(
    "git",
    ["ls-files", "--", runtimePath],
    { cwd: projectRoot, encoding: "utf8" }
  );
  if (lsFiles.status !== 0) return [];
  const tracked = lsFiles.stdout.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  if (tracked.length === 0) return [];
  spawnSync9(
    "git",
    ["rm", "--cached", "-r", "--quiet", "--ignore-unmatch", runtimePath],
    { cwd: projectRoot }
  );
  return tracked;
}
function writeClaudeSettings(projectRoot) {
  const dir = join15(projectRoot, ".claude");
  mkdirSync9(dir, { recursive: true });
  const path = join15(dir, "settings.json");
  let existing = {};
  if (existsSync26(path)) {
    try {
      existing = JSON.parse(readFileSync25(path, "utf8"));
    } catch {
      existing = {};
    }
  }
  const allowPatterns = buildAllowPatterns(projectRoot);
  const existingDenyFiltered = Array.isArray(existing.permissions?.deny) ? existing.permissions.deny.filter(
    (v) => typeof v !== "string" || !TDS_LEGACY_DENY_TO_REMOVE.includes(v)
  ) : existing.permissions?.deny;
  const merged = {
    ...existing,
    skillListingBudgetFraction: typeof existing.skillListingBudgetFraction === "number" ? existing.skillListingBudgetFraction : 0.15,
    permissions: {
      ...existing.permissions ?? {},
      deny: mergeStringArray(existingDenyFiltered, TDS_DENY_PATTERNS),
      allow: mergeStringArray(existing.permissions?.allow, allowPatterns),
      ask: mergeStringArray(existing.permissions?.ask, TDS_ASK_PATTERNS)
    }
  };
  import_write_file_atomic10.default.sync(path, `${JSON.stringify(merged, null, 2)}
`);
  return path;
}
var CODEX_ADVISORY_BODY = `# TDS module installed \u2014 Codex configuration advisory

This file is informational only. Generated by \`tds setup install\`.
Codex CLI's permission model differs from Claude Code: there is no
per-command allow/deny list. Codex uses **global** \`approval_policy\`
+ \`sandbox_mode\` + \`[permissions.workspace.*]\` filesystem entries
(see https://developers.openai.com/codex/sandbox).

Earlier TDS releases attempted to write a \`[permissions.tds_default]\`
block into \`.codex/config.toml\` \u2014 that was incorrect (Codex silently
ignored it). The correct integration is documented below; apply it
manually to your \`~/.codex/config.toml\` (global) or your project
Codex config.

## TDS Class I paths (read-only by design)

Direct edits to these MUST go through \`tds <subcommand>\` so authz,
integrity tracking, and JSONL telemetry stay coherent. Codex cannot
deny per-path edits the way Claude Code can; the practical defence is
\`approval_policy = "on-request"\` + reviewing prompts when Codex
proposes touching them:

  - \`_bmad/tds/**\` (entire payload \u2014 installer-managed)
  - \`_bmad-output/_tds/state-manifest.yaml\`
  - \`_bmad-output/_tds/branch-registry.yaml\`
  - \`_bmad-output/_tds/memory/lessons.yaml\`

## TDS-CLI invocation patterns to whitelist (when you want auto-trust)

Codex's existing trust mechanisms (\`approval_policy = "never"\` for
fully auto, or workspace-trusted profiles) apply globally. To
auto-trust only TDS commands, the cleanest path on current Codex is
manual approval the first few times \u2014 Codex remembers approvals.

The runtime entry points are:

  - \`node _bmad/tds/shared/tds-runtime.bundle.js <subcommand>\`
  - \`_bmad/tds/bin/tds <subcommand>\` (shim)

## Recommended Codex config snippet

For projects with TDS installed, a sensible Codex profile is:

\`\`\`toml
# In ~/.codex/config.toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true   # required for \`tds pr create\` (gh/glab)
\`\`\`

This file (\`<output>/_tds/runtime/doctor/codex-advisory.md\`) is safe to
delete \u2014 TDS does not read it. Re-running \`tds setup install\` will
re-write it with the current advisory text.

## Why this file lives under TDS state, not \`.codex/\`

Codex \`workspace-write\` sandbox protects \`.codex/\` recursively as
read-only by default \u2014 writes from \`tds setup install\` there would
trigger sandbox escalation or fail the install entirely. TDS-owned
state (\`<output>/_tds/\`) is always writable, so the advisory ships
there \u0438 Codex sees nothing unusual.
`;
function writeCodexAdvisory(tdsStateDir) {
  const dir = join15(tdsStateDir, "runtime", "doctor");
  mkdirSync9(dir, { recursive: true });
  const path = join15(dir, "codex-advisory.md");
  import_write_file_atomic10.default.sync(path, CODEX_ADVISORY_BODY);
  return path;
}
async function setupInstall(opts) {
  const profile = opts.profile ?? "full";
  if (!SETUP_PROFILES.includes(profile)) {
    throw new Error(
      `unknown profile: ${profile} (allowed: ${[...SETUP_PROFILES].join(", ")})`
    );
  }
  if (!opts.skipTeaCheckForTesting) {
    const manifestPath = join15(opts.projectRoot, "_bmad", "_config", "manifest.yaml");
    if (!existsSync26(manifestPath)) {
      throw new Error(
        `TDS-ERR:DEP_MISSING_TEA_MODULE: BMAD manifest not found (${manifestPath} missing). Either BMAD itself is not installed in this project, \u0438\u043B\u0438 _bmad/_config/manifest.yaml was removed manually. Run: bmad install (BMAD bootstrap) + bmad install bmad-tea-module.`
      );
    }
    const manifestRaw = readFileSync25(manifestPath, "utf8");
    const manifestDoc = (0, import_yaml21.parse)(manifestRaw);
    const modules = manifestDoc?.modules ?? [];
    const hasTea = modules.some(
      (m) => typeof m === "object" && m !== null && m.name === "tea"
    );
    if (!hasTea) {
      const installedNames = modules.map((m) => typeof m === "object" && m !== null ? String(m.name ?? "?") : "?").join(", ");
      throw new Error(
        `TDS-ERR:DEP_MISSING_TEA_MODULE: bmad-tea-module not in BMAD manifest (${manifestPath}). Installed modules: [${installedNames}]. Run: bmad install bmad-tea-module first. Test-author phase (ADR-0012/0013) hard-required, no opt-out flag.`
      );
    }
  }
  const sourceRoot = opts.sourceRootOverride ?? defaultSourceRoot();
  const sourceShared = join15(sourceRoot, "shared");
  const sourceBin = join15(sourceRoot, "bin");
  if (!existsSync26(join15(sourceShared, "tds-runtime.bundle.js"))) {
    throw new Error(
      `source root ${sourceRoot} doesn't contain shared/tds-runtime.bundle.js \u2014 invoke \`tds setup install\` from the SOURCE bundle, not the installed target. The skill text in payload/workflows/bmad-tds-setup explains how to find the source path via _bmad/_config/manifest.yaml.modules[name=tds].localPath.`
    );
  }
  const targetRoot = join15(opts.projectRoot, "_bmad", "tds");
  const targetShared = join15(targetRoot, "shared");
  const targetBin = join15(targetRoot, "bin");
  const filesCopied = [];
  copyTreeFiltered(sourceShared, targetShared, shouldSkipShared, filesCopied);
  const bundlePath = join15(targetShared, "tds-runtime.bundle.js");
  if (existsSync26(bundlePath)) chmodSync2(bundlePath, 493);
  if (existsSync26(sourceBin) && statSync4(sourceBin).isDirectory()) {
    copyTreeFiltered(sourceBin, targetBin, shouldSkipBin, filesCopied);
    for (const entry of readdirSync4(targetBin)) {
      chmodSync2(join15(targetBin, entry), 493);
    }
  }
  if (!opts.skipPayloadIntegrityForTesting) {
    verifyPayloadIntegrity(sourceRoot, targetRoot);
  }
  const claudeSettings = writeClaudeSettings(opts.projectRoot);
  const codexAdvisory = writeCodexAdvisory(opts.tdsStateDir);
  const gitignorePatched = patchGitignore(opts.projectRoot);
  const runtimeUntracked = untrackRuntimeArtifacts(opts.projectRoot);
  let customizeExampleCopied = null;
  const exampleSrc = join15(
    targetShared,
    "customize-examples",
    "bmad-testarch-atdd.toml.example"
  );
  if (existsSync26(exampleSrc)) {
    const customDir = join15(opts.projectRoot, "_bmad", "custom");
    mkdirSync9(customDir, { recursive: true });
    const exampleDst = join15(customDir, "bmad-testarch-atdd.toml.example");
    if (!existsSync26(exampleDst)) {
      await copyFile(exampleSrc, exampleDst);
      customizeExampleCopied = exampleDst;
      filesCopied.push(exampleDst);
    }
  }
  const state = await setupInit({
    tdsStateDir: opts.tdsStateDir,
    stateManifestYaml: opts.stateManifestYaml,
    branchRegistryYaml: opts.branchRegistryYaml,
    telemetryDir: opts.telemetryDir,
    projectRoot: opts.projectRoot,
    profile,
    ...opts.skipHooks !== void 0 ? { skipHooks: opts.skipHooks } : {}
  });
  return {
    profile,
    source: sourceRoot,
    target: targetRoot,
    filesCopied,
    customizeExampleCopied,
    hostConfigs: { claudeSettings, codexAdvisory },
    gitignorePatched,
    runtimeUntracked,
    state
  };
}

// src/setup/install-shim.ts
var import_write_file_atomic11 = __toESM(require_lib(), 1);
import {
  chmodSync as chmodSync3,
  existsSync as existsSync27,
  mkdirSync as mkdirSync10,
  readFileSync as readFileSync26,
  statSync as statSync5
} from "node:fs";
import { homedir } from "node:os";
import { dirname as dirname14, join as join16, resolve as resolve5 } from "node:path";
import { fileURLToPath as fileURLToPath8 } from "node:url";
function parseShimVersion(body) {
  const lines = body.split(/\r?\n/, 20);
  for (const line of lines) {
    const m = /^#\s*tds-shim-version:\s*(\d+)\s*$/.exec(line);
    if (m) {
      const n = Number(m[1]);
      if (Number.isInteger(n) && n >= 0) return n;
    }
  }
  return null;
}
function resolveTemplatePath(override) {
  if (override !== void 0) return override;
  const here = dirname14(fileURLToPath8(import.meta.url));
  if (true) {
    return resolve5(here, "..", "bin", "tds-shim.sh");
  }
  return resolve5(here, "..", "..", "payload", "bin", "tds-shim.sh");
}
function defaultTarget(homeOverride) {
  const h = homeOverride ?? homedir();
  return join16(h, ".local", "bin", "tds");
}
function pathContainsDir(pathEnv, dir) {
  if (pathEnv.length === 0) return false;
  const entries = pathEnv.split(":").filter((e) => e.length > 0);
  return entries.includes(dir);
}
function buildPathHint(targetDir) {
  return [
    `${targetDir} is not in your PATH.`,
    `Add this line to your shell rc (~/.zshrc or ~/.bashrc):`,
    `    export PATH="${targetDir}:$PATH"`,
    `Then restart your shell and run \`tds version\` to verify.`
  ];
}
async function installShim(opts = {}) {
  const target = opts.target ?? defaultTarget(opts.homeOverride);
  const templatePath = resolveTemplatePath(opts.templateOverride);
  if (!existsSync27(templatePath)) {
    throw new Error(
      `tds-shim template not found at ${templatePath} \u2014 bundle layout broken`
    );
  }
  const templateBody = readFileSync26(templatePath, "utf8");
  const installedVersion = parseShimVersion(templateBody);
  if (installedVersion === null) {
    throw new Error(
      `tds-shim template at ${templatePath} has no parsable # tds-shim-version: header \u2014 refusing to install`
    );
  }
  const targetDir = dirname14(target);
  const pathEnv = opts.pathOverride ?? process.env["PATH"] ?? "";
  const pathOk = pathContainsDir(pathEnv, targetDir);
  const pathHintLines = pathOk ? [] : buildPathHint(targetDir);
  let existingVersion = null;
  let existingBody = null;
  if (existsSync27(target)) {
    existingBody = readFileSync26(target, "utf8");
    const parsed = parseShimVersion(existingBody);
    existingVersion = parsed ?? 0;
  }
  let action;
  if (existingVersion === null) {
    action = "installed";
  } else if (existingVersion > installedVersion) {
    action = "preserved-newer";
  } else if (existingVersion === installedVersion && existingBody === templateBody) {
    action = "unchanged";
  } else {
    action = "upgraded";
  }
  if (action === "installed" || action === "upgraded") {
    mkdirSync10(targetDir, { recursive: true });
    import_write_file_atomic11.default.sync(target, templateBody);
    chmodSync3(target, 493);
  } else if (action === "unchanged") {
    const mode = statSync5(target).mode & 511;
    if ((mode & 64) === 0) chmodSync3(target, 493);
  }
  return {
    target,
    action,
    installedVersion,
    existingVersion,
    pathOk,
    pathHintLines
  };
}

// src/setup/resolve-source.ts
var import_yaml22 = __toESM(require_dist(), 1);
import { existsSync as existsSync28, readFileSync as readFileSync27 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { join as join17 } from "node:path";
var BUNDLE_REL = join17("shared", "tds-runtime.bundle.js");
async function resolveSource(opts) {
  const home = opts.homeDir ?? homedir2();
  const manifestPath = join17(opts.projectRoot, "_bmad", "_config", "manifest.yaml");
  if (!existsSync28(manifestPath)) {
    throw new Error(
      `TDS-ERR:PRECONDITION: BMAD manifest.yaml not found at ${manifestPath}. Run \`bmad install --custom-source <path-or-url>\` first to register the TDS module, then retry \`/bmad-tds-setup install\`.`
    );
  }
  const raw = readFileSync27(manifestPath, "utf8");
  const doc = (0, import_yaml22.parse)(raw) ?? {};
  const modules = Array.isArray(doc.modules) ? doc.modules : [];
  const tds = modules.find(
    (m) => typeof m === "object" && m !== null && m.name === "tds"
  );
  if (!tds) {
    const installed = modules.map(
      (m) => typeof m === "object" && m !== null ? String(m.name ?? "?") : "?"
    ).join(", ");
    throw new Error(
      `TDS-ERR:PRECONDITION: no \`tds\` module entry in ${manifestPath}. Installed modules: [${installed}]. Run \`bmad install --custom-source <path-or-url-to-bmad-tds-module>\` first.`
    );
  }
  const localPath = typeof tds.localPath === "string" ? tds.localPath : null;
  const repoUrl = typeof tds.repoUrl === "string" ? tds.repoUrl : null;
  if (localPath) {
    const result = pickLocalSourceRoot(localPath);
    if (result) return { sourceRoot: result, via: "localPath", bundleExists: true };
    throw new Error(
      `TDS-ERR:PRECONDITION: localPath=${localPath} doesn't contain ${BUNDLE_REL} (checked \`<localPath>\` and \`<localPath>/payload\`). Re-run \`bmad install --custom-source ${localPath}\` to refresh, or verify the source tree wasn't moved.`
    );
  }
  if (repoUrl) {
    const cacheKey = parseRepoUrlCacheKey(repoUrl);
    if (!cacheKey) {
      throw new Error(
        `TDS-ERR:PRECONDITION: cannot derive cache path from repoUrl=${repoUrl}. Expected \`https://<host>/<owner>/<repo>\` or \`git@<host>:<owner>/<repo>\`. Re-run \`bmad install\` with \`--custom-source <local-path>\` instead.`
      );
    }
    const cacheRoot = join17(home, ".bmad", "cache", "custom-modules", ...cacheKey);
    const result = pickLocalSourceRoot(cacheRoot);
    if (result) return { sourceRoot: result, via: "repoUrl-cache", bundleExists: true };
    throw new Error(
      `TDS-ERR:PRECONDITION: repoUrl=${repoUrl} but cached clone at ${cacheRoot} doesn't contain ${BUNDLE_REL} (checked root and \`payload/\`). Re-run \`bmad install\` to re-fetch the module, or switch to \`bmad install --custom-source <local-path>\`.`
    );
  }
  throw new Error(
    `TDS-ERR:PRECONDITION: tds module entry in ${manifestPath} has neither \`localPath\` nor \`repoUrl\`. The manifest is corrupt \u2014 re-run \`bmad install --custom-source <path-or-url>\` to rewrite it.`
  );
}
function pickLocalSourceRoot(root) {
  if (existsSync28(join17(root, BUNDLE_REL))) return root;
  const payloadCandidate = join17(root, "payload");
  if (existsSync28(join17(payloadCandidate, BUNDLE_REL))) return payloadCandidate;
  return null;
}
function parseRepoUrlCacheKey(url) {
  const trimmed = url.trim();
  const ssh = trimmed.match(/^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/);
  if (ssh && ssh[1] && ssh[2] && ssh[3]) {
    return [ssh[1], ssh[2], ssh[3]];
  }
  let parsed = null;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol) || !parsed.host) return null;
  const cleanedPath = parsed.pathname.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.git$/i, "");
  if (!cleanedPath) return null;
  const segments = cleanedPath.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  return [parsed.host, ...segments];
}

// src/epic/bootstrap-parents.ts
var import_yaml23 = __toESM(require_dist(), 1);
init_story_frontmatter();
init_bridge();
import { readdirSync as readdirSync5, existsSync as existsSync29, readFileSync as readFileSync28 } from "node:fs";
import { join as join18 } from "node:path";
async function bootstrapParents(opts) {
  if (!existsSync29(opts.storiesDir)) {
    return {
      added: [],
      skipped: [{ storyId: "*", reason: "dir-missing" }]
    };
  }
  const ext = readExtension(opts.extensionPath);
  if (!ext.parents) ext.parents = {};
  const sprintStatusKeys = readSprintStatusKeys(opts.sprintStatusPath);
  const added = [];
  const skipped = [];
  const files = readdirSync5(opts.storiesDir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const storyId = file.slice(0, -3);
    const path = join18(opts.storiesDir, file);
    let parsed;
    try {
      parsed = readStoryFrontmatter(path);
    } catch (err) {
      if (err instanceof StoryFrontmatterError) {
        skipped.push({ storyId, reason: "parse-error" });
        continue;
      }
      throw err;
    }
    if (parsed === null) {
      skipped.push({ storyId, reason: "no-frontmatter" });
      continue;
    }
    let epic;
    const rawEpic = parsed.frontmatter.epic;
    if (typeof rawEpic === "string" && rawEpic.length > 0) {
      epic = rawEpic;
    } else if (typeof rawEpic === "number") {
      epic = `epic-${rawEpic}`;
    } else {
      const prefixMatch = /^(\d+)-/.exec(storyId);
      if (prefixMatch) {
        epic = `epic-${prefixMatch[1]}`;
      } else {
        skipped.push({ storyId, reason: "no-epic-field" });
        continue;
      }
    }
    epic = resolveCanonicalEpic(epic, sprintStatusKeys);
    if (ext.parents[storyId] !== epic) {
      ext.parents[storyId] = epic;
      added.push(storyId);
    }
  }
  if (!opts.dryRun && added.length > 0) {
    if (ext.schema_version !== "1.1") ext.schema_version = "1.1";
    if (!opts.manifestPath || !opts.projectRoot || !opts.recordedBy || !opts.telemetryDir) {
      throw new Error(
        "bootstrapParents: manifestPath/projectRoot/recordedBy/telemetryDir required when writing (ADR-0015 \xA7A auto-record)"
      );
    }
    await writeExtension(opts.extensionPath, ext, {
      manifestPath: opts.manifestPath,
      projectRoot: opts.projectRoot,
      recordedBy: opts.recordedBy,
      telemetryDir: opts.telemetryDir
    });
  }
  return { added, skipped };
}
function readSprintStatusKeys(sprintStatusPath) {
  if (!sprintStatusPath || !existsSync29(sprintStatusPath)) return null;
  try {
    const parsed = (0, import_yaml23.parse)(readFileSync28(sprintStatusPath, "utf8"));
    const dev = parsed?.development_status;
    if (!dev || typeof dev !== "object") return null;
    return new Set(Object.keys(dev));
  } catch {
    return null;
  }
}
function resolveCanonicalEpic(candidate, sprintStatusKeys) {
  if (!sprintStatusKeys) return candidate;
  if (sprintStatusKeys.has(candidate)) return candidate;
  const bareMatch = /^epic-(\d+)$/.exec(candidate);
  if (bareMatch) {
    const prefix = `epic-${bareMatch[1]}-`;
    for (const key2 of sprintStatusKeys) {
      if (key2.startsWith(prefix)) return key2;
    }
  }
  return candidate;
}

// src/cli/handlers/setup.ts
async function handleSetup(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(SETUP_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown setup subcommand: ${sub ?? ""} (allowed: ${SETUP_SUBCOMMANDS.join(", ")})
${USAGE}`
    };
  }
  const flags = rest.slice(1);
  if (sub === "resolve-source") {
    const projectRoot = findBmadProjectRoot(process.cwd());
    if (projectRoot === null) {
      return {
        exitCode: EXIT.PRECONDITION,
        stdout: "",
        stderr: `TDS-ERR:PRECONDITION: not inside a BMAD project tree (no \`_bmad/\` directory found walking up from ${process.cwd()}). cd into the project root and retry.
`
      };
    }
    try {
      const result = await resolveSource({ projectRoot });
      const env = envelope("setup resolve-source", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${result.sourceRoot}  via=${result.via}
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.PRECONDITION,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "install-shim") {
    try {
      const targetFlag = parseFlag(flags, "target");
      const result = await installShim(
        targetFlag !== void 0 ? { target: targetFlag } : {}
      );
      const env = envelope("setup install-shim", EXIT.SUCCESS, result);
      const humanLines = [
        `tds-shim ${result.action}: ${result.target} (version=${result.installedVersion}` + (result.existingVersion !== null ? `, existing=${result.existingVersion}` : "") + `)`
      ];
      if (!result.pathOk) {
        humanLines.push("");
        humanLines.push(...result.pathHintLines);
      } else {
        humanLines.push("PATH OK \u2014 `tds version` should now work from any project.");
      }
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `${humanLines.join("\n")}
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "bootstrap-parents") {
    let bpPaths;
    try {
      bpPaths = await resolveTdsPaths();
    } catch (err) {
      return {
        exitCode: EXIT.PRECONDITION,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
    const storiesDir = pathJoin15(
      bpPaths.outputFolder,
      "implementation-artifacts",
      "stories"
    );
    const extensionPath = pathJoin15(
      bpPaths.tdsStateDir,
      "sprint-status-extension.yaml"
    );
    const dryRun = flags.includes("--dry-run");
    try {
      const result = await bootstrapParents({
        storiesDir,
        extensionPath,
        sprintStatusPath: bpPaths.sprintStatusYaml,
        dryRun,
        manifestPath: bpPaths.stateManifestYaml,
        projectRoot: bpPaths.projectRoot,
        recordedBy: "setup",
        telemetryDir: pathJoin15(bpPaths.runtimeDir, "telemetry")
      });
      const env = envelope("setup bootstrap-parents", EXIT.SUCCESS, result);
      const human = `bootstrap-parents: ${dryRun ? "(dry-run) " : ""}added=${result.added.length}, skipped=${result.skipped.length}
` + (result.added.length > 0 ? `  added: ${result.added.slice(0, 5).join(", ")}${result.added.length > 5 ? `, ... (+${result.added.length - 5})` : ""}
` : "") + (result.skipped.length > 0 ? `  skipped: ${result.skipped.slice(0, 3).map((s) => `${s.storyId}(${s.reason})`).join(", ")}${result.skipped.length > 3 ? `, ... (+${result.skipped.length - 3})` : ""}
` : "");
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : human,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  const profileRaw = parseFlag(flags, "profile") ?? "full";
  if (!SETUP_PROFILES.includes(profileRaw)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown profile: ${profileRaw} (allowed: ${[...SETUP_PROFILES].join(", ")})
`
    };
  }
  const profile = profileRaw;
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const telemetryDir = pathJoin15(paths.runtimeDir, "telemetry");
  if (sub === "install") {
    try {
      const result = await setupInstall({
        projectRoot: paths.projectRoot,
        tdsStateDir: paths.tdsStateDir,
        stateManifestYaml: paths.stateManifestYaml,
        branchRegistryYaml: paths.branchRegistryYaml,
        telemetryDir,
        profile
      });
      const noShim = flags.includes("--no-shim");
      let shimEnvelope;
      let shimHumanLine = "";
      if (noShim) {
        shimEnvelope = { skipped: true, reason: "--no-shim flag" };
        shimHumanLine = `  shim=skipped (--no-shim)
`;
      } else {
        try {
          const shimResult = await installShim({});
          shimEnvelope = {
            skipped: false,
            action: shimResult.action,
            target: shimResult.target,
            installedVersion: shimResult.installedVersion,
            existingVersion: shimResult.existingVersion,
            pathOk: shimResult.pathOk,
            pathHintLines: shimResult.pathHintLines
          };
          shimHumanLine = `  shim=${shimResult.action} target=${shimResult.target}` + (shimResult.pathOk ? "\n" : `
${shimResult.pathHintLines.map((l) => `    ${l}`).join("\n")}
`);
        } catch (err) {
          shimEnvelope = { skipped: false, error: err.message };
          shimHumanLine = `  shim=ERROR (non-fatal): ${err.message}
`;
        }
      }
      const combinedResult = { ...result, shim: shimEnvelope };
      const env = envelope("setup install", EXIT.SUCCESS, combinedResult);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `TDS install complete: profile=${result.profile} branch_mode=${result.state.branchMode}
  source=${result.source}
  target=${result.target}
  files_copied=${result.filesCopied.length}
  state_files_created=${result.state.filesCreated.length}
  hooks_installed=${result.state.hooksInstalled.length}
  host_configs=.claude/settings.json + ${result.hostConfigs.codexAdvisory}
  gitignore=${result.gitignorePatched === null ? "already-patched" : "patched"}
  runtime_untracked=${result.runtimeUntracked.length}
` + shimHumanLine + `
IMPORTANT: Claude Code caches .claude/settings.json per session.
Restart your Claude Code session (exit and re-launch) so the
updated allow/deny lists take effect \u2014 otherwise tds CLI calls
via absolute paths will continue to prompt for permission.
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  if (sub === "init") {
    try {
      const result = await setupInit({
        tdsStateDir: paths.tdsStateDir,
        stateManifestYaml: paths.stateManifestYaml,
        branchRegistryYaml: paths.branchRegistryYaml,
        telemetryDir,
        projectRoot: paths.projectRoot,
        profile
      });
      const env = envelope("setup init", EXIT.SUCCESS, result);
      return {
        exitCode: EXIT.SUCCESS,
        stdout: wantJson ? JSON.stringify(env) : `TDS state initialised: profile=${result.profile} branch_mode=${result.branchMode}
  created=${result.filesCreated.length} preserved=${result.filesPreserved.length}
`,
        stderr: ""
      };
    } catch (err) {
      return {
        exitCode: EXIT.RUNTIME,
        stdout: "",
        stderr: `${err.message}
`
      };
    }
  }
  return exhaustiveSwitch(sub, "setup");
}
function findBmadProjectRoot(start) {
  let dir = start;
  for (let i = 0; i < 64; i++) {
    if (existsSync30(pathJoin15(dir, "_bmad"))) return dir;
    const parent = pathDirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

// src/cli/handlers/review.ts
import { join as pathJoin16 } from "node:path";
init_apply_verdict();
async function handleReview(rest, wantJson) {
  const sub = rest[0];
  if (!isMember(REVIEW_SUBCOMMANDS, sub)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: `unknown review subcommand: ${sub ?? ""}
${USAGE}`
    };
  }
  if (sub !== "apply-verdict") return exhaustiveSwitch(sub, "review");
  const flags = rest.slice(1);
  const epicId = parseFlag(flags, "epic");
  const storyId = parseFlag(flags, "story");
  if (epicId === void 0 === (storyId === void 0)) {
    return {
      exitCode: EXIT.USAGE,
      stdout: "",
      stderr: "review apply-verdict requires exactly one of --epic=<id> or --story=<id>\n"
    };
  }
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin16(paths.runtimeDir, "telemetry");
  const decision = await checkRoleSkillOperation({
    role,
    op: "state-set",
    telemetryDir,
    matrixPath: SPEC_MATRIX_PATH
  });
  if (decision.decision === "deny") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "state-set",
        reason: decision.reason,
        command: "tds review apply-verdict"
      })
    };
  }
  const storiesDir = pathJoin16(
    paths.outputFolder,
    "implementation-artifacts",
    "stories"
  );
  const scope = epicId !== void 0 ? { kind: "epic", id: epicId } : { kind: "story", id: storyId };
  try {
    const result = await applyVerdict({
      scope,
      projectRoot: paths.projectRoot,
      sprintStatusPath: paths.sprintStatusYaml,
      extensionPath: pathJoin16(paths.tdsStateDir, "sprint-status-extension.yaml"),
      storiesDir,
      tdsStateDir: paths.tdsStateDir,
      outputFolder: paths.outputFolder,
      telemetryDir,
      triggeredBy: role
    });
    const env = envelope("review apply-verdict", EXIT.SUCCESS, result);
    const human = buildVerdictHuman(result, scope);
    return {
      exitCode: EXIT.SUCCESS,
      stdout: wantJson ? JSON.stringify(env) : human,
      stderr: ""
    };
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
}
function buildVerdictHuman(result, scope) {
  if (result.verdict === "changes-requested") {
    return `verdict: changes-requested \u2014 ${result.flippedStoryIds.length}/${result.perStory.length} stories flipped to rework: ${result.flippedStoryIds.join(", ")}.
Resolve: /bmad-tds-execute-${scope.kind} ${scope.id}.
`;
  }
  const approved = result.flippedToApproved.length;
  const total = result.perStory.length;
  const epicFlip = scope.kind === "epic" ? ` epic ${scope.id} approved: ${result.epicFlippedToApproved ? "yes" : "no (idempotent)"};` : "";
  return `verdict: approved \u2014 no unresolved blockers across ${total} story(s); ${approved} story(s) flipped review \u2192 approved${approved === total ? "" : ` (${total - approved} already at approved \u2014 idempotent)`}.${epicFlip}
Next: /bmad-tds-code-review proceeds to deliver (Mode 2) or sync (Mode 1) for approved \u2192 done.
`;
}

// src/cli/handlers/state-commit.ts
import { join as pathJoin17 } from "node:path";
init_commit_sweep();
init_emit();
async function handleStateCommit(rest, wantJson) {
  let paths;
  try {
    paths = await resolveTdsPaths();
  } catch (err) {
    return {
      exitCode: EXIT.PRECONDITION,
      stdout: "",
      stderr: `${err.message}
`
    };
  }
  const role = resolveRole({ cliRole: parseFlag(rest, "as") });
  const telemetryDir = pathJoin17(paths.runtimeDir, "telemetry");
  if (role === "unknown") {
    return {
      exitCode: EXIT.AUTHZ,
      stdout: "",
      stderr: formatAuthzDeny({
        role,
        op: "state-commit",
        reason: "unknown role has no permissions",
        command: "tds state-commit"
      })
    };
  }
  const messageFlag = parseFlag(rest, "message") ?? parseFlag(rest, "m");
  const storyId = parseFlag(rest, "story");
  const dryRun = rest.includes("--dry-run");
  const explicitPathsRaw = parseFlag(rest, "paths");
  const explicitPaths = explicitPathsRaw ? explicitPathsRaw.split(",").map((s) => s.trim()).filter((s) => s.length > 0) : void 0;
  const sweep = sweepStateCommit({
    projectRoot: paths.projectRoot,
    tdsStateDir: paths.tdsStateDir,
    outputFolder: paths.outputFolder,
    message: messageFlag ?? `chore(tds): state sweep`,
    ...storyId !== void 0 ? { storyId } : {},
    ...explicitPaths !== void 0 ? { explicitPaths } : {},
    ...dryRun ? { dryRun: true } : {}
  });
  if (sweep.pathsFilteredOut.length > 0) {
    try {
      await emit({
        telemetryDir,
        stream: "cli-events",
        event: {
          kind: "state-commit-filtered",
          filtered_out_count: sweep.pathsFilteredOut.length,
          committed: sweep.committed,
          dry_run: sweep.dryRun
        }
      });
    } catch {
    }
  }
  const result = {
    committed: sweep.committed,
    ...sweep.sha !== null ? { commit_sha: sweep.sha } : {},
    paths_committed: sweep.pathsCommitted,
    paths_filtered_out: sweep.pathsFilteredOut,
    ...sweep.skipReason !== void 0 ? { skip_reason: sweep.skipReason } : {},
    dry_run: sweep.dryRun
  };
  const env = envelope("state-commit", EXIT.SUCCESS, result);
  let humanLine;
  if (sweep.dryRun) {
    humanLine = `dry-run: would commit ${sweep.pathsCommitted.length} TDS-managed path(s)` + (sweep.pathsFilteredOut.length > 0 ? ` (${sweep.pathsFilteredOut.length} non-TDS dirty paths excluded)` : "") + "\n";
  } else if (sweep.committed) {
    humanLine = `committed ${sweep.pathsCommitted.length} TDS-managed path(s)` + (sweep.sha !== null ? ` \u2192 ${sweep.sha.slice(0, 12)}` : "") + (sweep.pathsFilteredOut.length > 0 ? ` (${sweep.pathsFilteredOut.length} non-TDS dirty paths excluded)` : "") + "\n";
  } else {
    humanLine = `no commit (${sweep.skipReason ?? "unknown"})` + (sweep.pathsFilteredOut.length > 0 ? ` \u2014 ${sweep.pathsFilteredOut.length} non-TDS dirty paths still uncommitted` : "") + "\n";
  }
  return {
    exitCode: EXIT.SUCCESS,
    stdout: wantJson ? JSON.stringify(env) : humanLine,
    stderr: ""
  };
}

// src/cli/dispatcher.ts
init_emit();
async function emitCliEvent(telemetryDir, event) {
  if (!telemetryDir) return;
  try {
    await emit({ telemetryDir, stream: "cli-events", event });
  } catch {
  }
}
function extractFlagNames(argv) {
  const names = [];
  const seen = /* @__PURE__ */ new Set();
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    const name = eq === -1 ? a.slice(2) : a.slice(2, eq);
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}
function extractAsRole(argv) {
  for (const a of argv) {
    if (a.startsWith("--as=")) return a.slice("--as=".length);
  }
  return void 0;
}
function countPositional(argv) {
  let n = 0;
  for (const a of argv) if (!a.startsWith("--")) n++;
  return n;
}
var INVOCATION_FORMS = [
  "global-shim",
  "project-shim",
  "bundle-direct",
  "unknown"
];
function detectInvocationForm() {
  const raw = process.env["TDS_INVOCATION_FORM"];
  if (raw === void 0 || raw === "") return "bundle-direct";
  if (INVOCATION_FORMS.includes(raw)) {
    return raw;
  }
  return "unknown";
}
async function resolveTelemetryDir(opts) {
  if (opts.telemetryDir !== void 0) return opts.telemetryDir;
  try {
    const paths = await resolveTdsPaths();
    return pathJoin18(paths.runtimeDir, "telemetry");
  } catch {
    return void 0;
  }
}
function splitSubcommand(argv) {
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) {
      return {
        subcommand: argv[i],
        rest: [...argv.slice(0, i), ...argv.slice(i + 1)]
      };
    }
  }
  return { subcommand: void 0, rest: argv };
}
function isGlobalFlag(arg) {
  return arg === "--json" || arg.startsWith("--as=");
}
function normaliseGlobalFlags(rest) {
  const nonGlobal = [];
  const globals = [];
  for (const arg of rest) {
    if (isGlobalFlag(arg)) globals.push(arg);
    else nonGlobal.push(arg);
  }
  return [...nonGlobal, ...globals];
}
async function dispatch(argv, opts = {}) {
  if (argv.length === 0) {
    return { exitCode: EXIT.USAGE, stdout: "", stderr: USAGE };
  }
  if (argv.includes("--help") || argv.includes("-h") || argv[0] === "help") {
    return { exitCode: EXIT.SUCCESS, stdout: USAGE, stderr: "" };
  }
  const { subcommand, rest: rawRest } = splitSubcommand(argv);
  const rest = normaliseGlobalFlags(rawRest);
  const wantJson = rest.includes("--json");
  if (subcommand === void 0) {
    return { exitCode: EXIT.USAGE, stdout: "", stderr: USAGE };
  }
  const telemetryDir = await resolveTelemetryDir(opts);
  const flagNames = extractFlagNames(argv);
  const asRole = extractAsRole(argv);
  const invocationForm = detectInvocationForm();
  const startedAt = Date.now();
  await emitCliEvent(telemetryDir, {
    kind: "invocation-start",
    subcommand,
    flag_names: flagNames,
    arg_count: countPositional(rest),
    invocation_form: invocationForm,
    ...asRole !== void 0 ? { as_role: asRole } : {}
  });
  try {
    let result;
    switch (subcommand) {
      case "setup":
        result = await handleSetup(rest, wantJson);
        break;
      case "version":
        result = handleVersion(wantJson);
        break;
      case "preflight":
        result = await handlePreflight(rest, wantJson);
        break;
      case "orient":
        result = await handleOrient(rest, wantJson);
        break;
      case "doctor":
        result = await handleDoctor(rest, wantJson);
        break;
      case "integrity":
        result = await handleIntegrity(rest, wantJson);
        break;
      case "state":
        result = await handleState(rest, wantJson);
        break;
      case "state-commit":
        result = await handleStateCommit(rest, wantJson);
        break;
      case "memory":
        result = await handleMemory(rest, wantJson);
        break;
      case "branch":
        result = await handleBranch(rest, wantJson);
        break;
      case "commit":
        result = await handleCommit(rest, wantJson);
        break;
      case "pr":
        result = await handlePr(rest, wantJson);
        break;
      case "deliver":
        result = await handleDeliver(rest, wantJson);
        break;
      case "sync":
        result = await handleSync(rest, wantJson);
        break;
      case "revert-story":
        result = await handleRevertStory(rest, wantJson);
        break;
      case "epic":
        result = await handleEpic(rest, wantJson);
        break;
      case "archive":
        result = await handleArchive(rest, wantJson);
        break;
      case "story":
        result = await handleStory(rest, wantJson);
        break;
      case "review":
        result = await handleReview(rest, wantJson);
        break;
      default:
        result = {
          exitCode: EXIT.USAGE,
          stdout: "",
          stderr: `unknown subcommand: ${subcommand ?? ""}
${USAGE}`
        };
    }
    await emitCliEvent(telemetryDir, {
      kind: "invocation-end",
      subcommand,
      exit_code: result.exitCode,
      duration_ms: Date.now() - startedAt,
      invocation_form: invocationForm
    });
    return result;
  } catch (err) {
    await emitCliEvent(telemetryDir, {
      kind: "invocation-end",
      subcommand,
      exit_code: EXIT.RUNTIME,
      duration_ms: Date.now() - startedAt,
      invocation_form: invocationForm,
      error_class: err.name || "Error"
    });
    throw err;
  }
}

// src/cli/main.ts
(async () => {
  const result = await dispatch(process.argv.slice(2));
  if (result.stdout.length > 0) process.stdout.write(result.stdout);
  if (result.stderr.length > 0) process.stderr.write(result.stderr);
  process.exit(result.exitCode);
})().catch((err) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`tds: unhandled error: ${msg}
`);
  process.exit(1);
});
