#!/usr/bin/env node
// tools/dev-server.mjs — Epic 3 interim static-file dev-server.
//
// Stdlib-only http.createServer that serves the SPA from src/ + emitted
// methodology pages from dist/methodology/. Epic 4 (Story 4.1) lands the
// real dev-server with live-reload + corpus-rebuild watchers.
//
// Routes:
//   GET /                       → src/index.html
//   GET /src/<path>             → <repo-root>/src/<path>
//   GET /tests/<path>           → <repo-root>/tests/<path>
//   GET /methodology/<path>     → <repo-root>/dist/methodology/<path>
//                                  (path/  → path/index.html)
//   else                        → 404
//
// CLI: `node tools/dev-server.mjs` (port from IQME_DEV_PORT, default 4173).
// Programmatic: `import { start } from "./dev-server.mjs"; const srv = await start(0);`

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, join, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
import process, { env, argv, stdout, stderr, exit } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

function contentTypeFor(filePath) {
  return MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
}

// Safely resolve a request path under a base. Returns null on traversal.
function safeResolve(base, suffix) {
  const full = resolve(base, "." + suffix);
  if (full !== base && !full.startsWith(base + sep)) return null;
  return full;
}

async function serveFile(res, filePath) {
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) {
      // Try index.html.
      const idx = join(filePath, "index.html");
      return serveFile(res, idx);
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": contentTypeFor(filePath) });
    res.end(body);
    return true;
  } catch (e) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return false;
    }
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("server error");
    return false;
  }
}

async function handle(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    res.end("method not allowed");
    return;
  }
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (urlPath === "/" || urlPath === "/index.html") {
    return void serveFile(res, resolve(REPO_ROOT, "src/index.html"));
  }
  if (urlPath.startsWith("/src/")) {
    const p = safeResolve(resolve(REPO_ROOT, "src"), urlPath.slice("/src".length));
    if (!p) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("forbidden");
      return;
    }
    return void serveFile(res, p);
  }
  if (urlPath.startsWith("/tests/")) {
    const p = safeResolve(resolve(REPO_ROOT, "tests"), urlPath.slice("/tests".length));
    if (!p) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("forbidden");
      return;
    }
    return void serveFile(res, p);
  }
  if (urlPath.startsWith("/methodology/")) {
    const p = safeResolve(resolve(REPO_ROOT, "dist/methodology"), urlPath.slice("/methodology".length));
    if (!p) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("forbidden");
      return;
    }
    return void serveFile(res, p);
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not found: " + urlPath);
}

export function start(port) {
  return new Promise((resolveStart, rejectStart) => {
    const server = createServer((req, res) => {
      handle(req, res).catch(() => {
        try {
          res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
          res.end("server error");
        } catch {}
      });
    });
    server.on("error", rejectStart);
    server.listen(port ?? 0, "127.0.0.1", () => {
      const addr = server.address();
      const boundPort = typeof addr === "object" && addr !== null ? addr.port : port;
      resolveStart({
        server,
        port: boundPort,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

const isCli = import.meta.url === `file://${argv[1]}`;
if (isCli) {
  const port = Number(env.IQME_DEV_PORT || 4173);
  start(port)
    .then((srv) => {
      stdout.write(`dev-server: listening on http://127.0.0.1:${srv.port}\n`);
      const shutdown = async () => {
        await srv.close();
        exit(0);
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    })
    .catch((e) => {
      stderr.write(`dev-server: failed to start: ${e.message}\n`);
      exit(1);
    });
}
