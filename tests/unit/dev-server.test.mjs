// tests/unit/dev-server.test.mjs
//
// Story 3.7 AC-8 — tools/dev-server.mjs programmatic API.

import { test } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const SCRIPT = resolve(REPO_ROOT, "tools/dev-server.mjs");

let start;
try {
  ({ start } = await import("../../tools/dev-server.mjs"));
} catch (_e) {
  // Module not present yet — tests will fail at runtime per the import.
}

function fetchPath(port, path) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: "127.0.0.1", port, path, method: "GET" }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

// ─── AC-8.1 ─────────────────────────────────────────────────────────────

test("AC-8.1: GET / returns 200 with index.html body", async () => {
  const srv = await start(0);
  try {
    const r = await fetchPath(srv.port, "/");
    assert.equal(r.status, 200);
    assert.ok(/<title>IQ-ME/.test(r.body), `expected IQ-ME in title; got: ${r.body.slice(0, 200)}`);
  } finally {
    await srv.close();
  }
});

// ─── AC-8.2 ─────────────────────────────────────────────────────────────

test("AC-8.2: GET /src/assessment/main.js returns 200 application/javascript", async () => {
  const srv = await start(0);
  try {
    const r = await fetchPath(srv.port, "/src/assessment/main.js");
    assert.equal(r.status, 200);
    assert.ok(/javascript/.test(r.headers["content-type"] || ""), `expected js content-type; got: ${r.headers["content-type"]}`);
  } finally {
    await srv.close();
  }
});

// ─── AC-8.3 ─────────────────────────────────────────────────────────────

test("AC-8.3: GET /src/css/primitives.css returns 200 text/css", async () => {
  const srv = await start(0);
  try {
    const r = await fetchPath(srv.port, "/src/css/primitives.css");
    assert.equal(r.status, 200);
    assert.ok(/css/.test(r.headers["content-type"] || ""), `expected css content-type; got: ${r.headers["content-type"]}`);
  } finally {
    await srv.close();
  }
});

// ─── AC-8.4 ─────────────────────────────────────────────────────────────

test("AC-8.4: GET /nonexistent returns 404", async () => {
  const srv = await start(0);
  try {
    const r = await fetchPath(srv.port, "/nonexistent-path");
    assert.equal(r.status, 404);
  } finally {
    await srv.close();
  }
});

// ─── AC-8.5 ─────────────────────────────────────────────────────────────

test("AC-8.5: GET methodology stub page returns 200 if dist/ built (else skip)", async (t) => {
  const stubPath = resolve(REPO_ROOT, "dist/methodology/v0.1.0/en/scoring/percentile-to-iq/index.html");
  if (!existsSync(stubPath)) {
    t.skip("dist/methodology/ not built — run make build-methodology first");
    return;
  }
  const srv = await start(0);
  try {
    const r = await fetchPath(srv.port, "/methodology/v0.1.0/en/scoring/percentile-to-iq/index.html");
    assert.equal(r.status, 200);
    assert.ok(/percentile/i.test(r.body), `expected percentile content; got: ${r.body.slice(0, 200)}`);
  } finally {
    await srv.close();
  }
});

// ─── AC-8.6 ─────────────────────────────────────────────────────────────

test("AC-8.6: server.close() resolves cleanly", async () => {
  const srv = await start(0);
  await srv.close();
  // Connect-refused after close means it really closed.
  try {
    await fetchPath(srv.port, "/");
    assert.fail("expected connection refused after close");
  } catch (e) {
    assert.ok(/ECONNREFUSED|ECONNRESET|connect/i.test(e.message), `expected connection-refused; got: ${e.message}`);
  }
});

// ─── AC-8.7 ─────────────────────────────────────────────────────────────

test("AC-8.7: tools/dev-server.mjs has no forbidden globals / third-party imports", () => {
  const src = readFileSync(SCRIPT, "utf8");
  assert.ok(!/Math\.random/.test(src), "must not use Math.random");
  assert.ok(!/setTimeout|setInterval/.test(src), "must not use setTimeout/setInterval");
  assert.ok(!/localStorage|sessionStorage/.test(src), "must not reference localStorage/sessionStorage");
  const importLines = src.match(/^import .*$/gm) || [];
  for (const line of importLines) {
    assert.ok(/from\s+["']node:/.test(line), `non-stdlib import detected: ${line}`);
  }
});
