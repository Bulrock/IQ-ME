// Story 8.8 — Acceptance tests for the chrome-footer Discussions link + the
// release-notification subscription path (FR52: no email subscription).
//
// Authored in test-author phase (frozen during specialist impl).
// Structural-only checks (no DOM/markdown parser) — treat the files as text.
// The footer anchor + CONTRIBUTING path + no-preconnect invariants already hold
// (Story 6.4 / 8.6); the README "Following updates" subscription section is the
// net-new deliverable this story adds (RED until Task 1).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const INDEX = join(REPO_ROOT, "src", "index.html");
const README = join(REPO_ROOT, "README.md");
const CONTRIBUTING = join(REPO_ROOT, "CONTRIBUTING.md");

function read(p) {
  assert.ok(existsSync(p), `missing file: ${p}`);
  return readFileSync(p, "utf8");
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: footer Discussions anchor is the real public URL, <a href> only,
//        and no third-party preconnect/dns-prefetch to github in the head
// ─────────────────────────────────────────────────────────────────────

test("AC-1: chrome-footer has the real public GitHub Discussions anchor", () => {
  const html = read(INDEX);
  // The footer anchor points at the canonical public Discussions URL.
  assert.match(
    html,
    /class="chrome-footer__discussions-link"[^>]*href="https:\/\/github\.com\/[^"]+\/discussions"/,
    "src/index.html chrome-footer must contain the real public GitHub Discussions <a href> (no account required to read)",
  );
});

test("AC-1: the Discussions link is an <a href> only — no prefetch/preload/preconnect to github (zero third-party)", () => {
  const html = read(INDEX);
  // The discussions anchor itself carries no prefetch/preload rel.
  const anchor = html.match(/<a[^>]*chrome-footer__discussions-link[^>]*>/);
  assert.ok(anchor, "discussions anchor not found");
  assert.doesNotMatch(
    anchor[0],
    /rel="[^"]*(prefetch|preload)[^"]*"/i,
    "the Discussions <a> must not carry rel=prefetch/preload (no third-party fetch on hover/load)",
  );
  // No <link rel="preconnect"|"dns-prefetch"> to github anywhere in the document
  // (those open a third-party connection on load).
  assert.doesNotMatch(
    html,
    /<link[^>]*rel="[^"]*(preconnect|dns-prefetch)[^"]*"[^>]*github|github[^>]*<link[^>]*rel="[^"]*(preconnect|dns-prefetch)/i,
    "src/index.html must not preconnect/dns-prefetch to github (the Discussions link is navigational only)",
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: README documents the subscription path (Watch→Releases + Discussions
//        Subscribe) with NO email-signup CTA; CONTRIBUTING states the same
// ─────────────────────────────────────────────────────────────────────

test("AC-2: README documents the release-notification subscription path (Watch -> Releases only + Discussions Subscribe)", () => {
  const txt = read(README);
  // Repo release notifications via Watch -> Releases only.
  assert.match(txt, /watch[^.]*releases?\s*(only|notifications)?/i, "README must document GitHub repo release notifications (Watch -> Releases only)");
  // Discussions thread subscription.
  assert.match(txt, /discussion[^.]*subscrib|subscrib[^.]*discussion/i, "README must document GitHub Discussions thread subscription");
});

test("AC-2: README has no email-signup / newsletter CTA (FR52)", () => {
  const txt = read(README);
  assert.doesNotMatch(
    txt,
    /sign\s*up\s+(with\s+)?your\s+email|enter\s+your\s+email|email\s+(sign[\s-]?up|subscription)|subscribe\s+(with|via)\s+email|newsletter/i,
    "README must not contain an email-signup / newsletter CTA (FR52)",
  );
});

test("AC-2: CONTRIBUTING.md documents the same subscription path (Watch Releases + Discussions)", () => {
  const txt = read(CONTRIBUTING);
  assert.match(txt, /watch/i, "CONTRIBUTING.md must mention Watching the repository for releases");
  assert.match(txt, /releases?\s*only|releases?\)/i, "CONTRIBUTING.md must mention Releases-only notifications");
  assert.match(txt, /discussion/i, "CONTRIBUTING.md must mention Discussions subscription");
});
