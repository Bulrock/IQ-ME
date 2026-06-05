// Story 8.4 — Acceptance tests for the Codeberg/Cloudflare byte-identical
// mirror: the `deploy-to-mirror` job in .github/workflows/release.yml, the
// byte-identical-artifact SHA256 verification step, the README mirror-strategy
// section, the chrome-footer no-mirror-link invariant, and the launch-gated
// Playwright-against-mirror step.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one AC (or AC-group) in spec
// _bmad-output/implementation-artifacts/stories/8-4-mirror-failover-deployment-to-codeberg-cloudflare-byte-identical-artifact-verification.md.
//
// Run: `node --test tests/scaffold/mirror-deploy.test.mjs`
//
// RED PHASE: release.yml currently ends the corpus-release job at a
// `# --- Deferred to Story 8.4: Codeberg / Cloudflare Pages byte-identical
// mirror … ---` comment — there is NO `deploy-to-mirror` job, NO byte-identical
// SHA256 step. README.md has no mirror-strategy section. These assertions
// describe the *activated* mirror contract that does NOT yet exist, so they
// FAIL until Story 8.4 implements them. (The chrome-footer no-mirror-link
// assertion and AC-1..AC-4 of the Story-3.7 relative-path posture already
// hold, so AC-4 here is expected GREEN.)
//
// Structural-only checks — no YAML parser dep (NFR33). We treat the workflow,
// README, and SPA shell as text and assert presence/proximity of expected
// lines, slicing the deploy-to-mirror job body so the (to-be-removed) deferral
// comment does NOT false-pass the endpoint/artifact signatures (the marker
// comment says "Codeberg / Cloudflare Pages byte-identical mirror", so bare
// /codeberg/|/cloudflare/ on the WHOLE file would match the comment — every
// workflow-presence assertion slices the job body first). Same structural
// approach as release-workflow.test.mjs / release-archival.test.mjs. Regexes
// tolerate optional quotes/whitespace.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const RELEASE = join(REPO_ROOT, ".github", "workflows", "release.yml");
const README = join(REPO_ROOT, "README.md");
const INDEX_HTML = join(REPO_ROOT, "src", "index.html");

function loadRelease() {
  assert.ok(existsSync(RELEASE), `release.yml missing at ${RELEASE}`);
  return readFileSync(RELEASE, "utf8");
}

// Slice the deploy-to-mirror job body: find the `  deploy-to-mirror:`
// declaration line and return from there to the next top-level `  <job>:`
// declaration (or EOF). The mirror push / SHA256 compare / Playwright steps may
// sit anywhere in the job, so a slice-to-next-job is more robust than a fixed
// window — and critically it EXCLUDES the deferral-marker comment that lives in
// the corpus-release job above. Mirrors release-archival.test.mjs's
// corpusReleaseBody helper.
function mirrorJobBody(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^  deploy-to-mirror:\s*$/.test(l));
  if (start === -1) return { idx: -1, body: "" };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    // Next top-level job declaration (2-space indent, `key:`-style line).
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { idx: start, body: lines.slice(start, end).join("\n") };
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: deploy-to-mirror job present + tag-triggered + pushes the same
// dist/ artifact to a Codeberg/Cloudflare endpoint, live-gated dev-inert.
// ─────────────────────────────────────────────────────────────────────

test("AC-1: release.yml declares a deploy-to-mirror job that pushes the same dist/ artifact to the Codeberg/Cloudflare endpoint", () => {
  const text = loadRelease();
  const { idx, body } = mirrorJobBody(text);

  // The job exists at the jobs: top level.
  assert.notEqual(
    idx,
    -1,
    `release.yml must declare a "  deploy-to-mirror:" job at the jobs: top level (replacing the Story-8.4 deferral marker). Got:\n${text}`,
  );

  // Tag-triggered by the SAME release tags as app-release/corpus-release. The
  // on: push: tags: block (app-v* / corpus-v*) already drives both; the mirror
  // job is gated on a release tag ref (app-v* and/or corpus-v*) so it only runs
  // on a real release tag, not every push.
  assert.match(
    body,
    /refs\/tags\/(app-v|corpus-v)|startsWith\(github\.ref/i,
    `deploy-to-mirror must be triggered by the same release tags (app-v*/corpus-v*) — a job-level if: gating on refs/tags/app-v or refs/tags/corpus-v (architecture §860-862). Body:\n${body}`,
  );

  // Pushes the SAME dist/ artifact (the byte-identical artifact, NFR17 /
  // architecture §862) — the job references dist/.
  assert.match(
    body,
    /\bdist\b|\.\/dist/,
    `deploy-to-mirror must push the same dist/ artifact the canonical gh-pages deploy ships (byte-identical, NFR17 / architecture §862). Body:\n${body}`,
  );

  // Real mirror endpoint named in the JOB BODY (Codeberg Pages push OR
  // `wrangler pages deploy ./dist` for Cloudflare) — anchored to the job slice,
  // NOT the bare word on the whole file (the deferral-marker comment in the
  // corpus-release job carries "Codeberg / Cloudflare" as plain prose).
  assert.match(
    body,
    /codeberg|cloudflare|wrangler\s+pages\s+deploy/i,
    `deploy-to-mirror must name the real mirror endpoint — a Codeberg Pages push of dist/ OR "wrangler pages deploy ./dist" for Cloudflare Pages (Dev Notes: engineer's call, document it). Body:\n${body}`,
  );

  // Live push gated INERT behind vars.IQME_LIVE_MIRROR (mirror the Story-8.2
  // vars.IQME_LIVE_ARCHIVAL step-if: pattern; secrets.* is NOT a valid step-if:
  // context — gate on vars.*, per the 8.2 actionlint gotcha). In dev the var is
  // unset ⇒ the live push is INERT (no fabricated mirror deploy — lesson-
  // 2026-06-04-002).
  assert.match(
    body,
    /vars\.IQME_LIVE_MIRROR/,
    `the live mirror push must be gated behind vars.IQME_LIVE_MIRROR == 'true' (parallel to Story-8.2 vars.IQME_LIVE_ARCHIVAL; gate on vars.*, not secrets.* — the actionlint step-if: gotcha) so it is INERT in dev. Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: byte-identical-artifact SHA256 verification step — fetch the same
// path from canonical + mirror, SHA256-compare the four named artifacts,
// fail on mismatch, live-gated dev-inert.
// ─────────────────────────────────────────────────────────────────────

test("AC-2: deploy-to-mirror SHA256-compares the four named artifacts (canonical vs mirror) and fails the build on mismatch", () => {
  const text = loadRelease();
  const { idx, body } = mirrorJobBody(text);
  assert.notEqual(idx, -1, `deploy-to-mirror job declaration not found.`);

  // SHA256 hashing of the fetched artifacts (sha256sum / shasum -a 256).
  assert.match(
    body,
    /sha256sum|shasum\b/i,
    `the byte-identical-artifact verification step must SHA256-hash the artifacts (sha256sum / shasum) to compare canonical vs mirror (AC-2). Body:\n${body}`,
  );

  // Fetches from BOTH the canonical and the mirror URL (a fetch mechanism +
  // both origins implied by the compare). The live fetch is via curl/wget; the
  // canonical-vs-mirror compare is the heart of AC-2.
  assert.match(
    body,
    /curl|wget|fetch/i,
    `the verification step must FETCH the same path from the canonical + mirror URLs (curl/wget) before the SHA256 compare (AC-2). Body:\n${body}`,
  );

  // The four named trust artifacts must ALL appear in the step text (grep-able,
  // per AC-2): (1) the SPA index, (2) ≥1 methodology page, (3) LICENSES.md,
  // (4) CITATION.cff.
  assert.match(
    body,
    /index\.html/i,
    `the byte-identical compare must name the SPA index (index.html) — artifact 1 of 4 (AC-2). Body:\n${body}`,
  );
  assert.match(
    body,
    /methodology/i,
    `the byte-identical compare must name at least one methodology page (e.g. methodology/v<X.Y.Z>/en/…) — artifact 2 of 4 (AC-2). Body:\n${body}`,
  );
  assert.match(
    body,
    /LICENSES\.md/,
    `the byte-identical compare must name LICENSES.md — artifact 3 of 4, the license enumeration trust file (AC-2). Body:\n${body}`,
  );
  assert.match(
    body,
    /CITATION\.cff/,
    `the byte-identical compare must name CITATION.cff — artifact 4 of 4, the citation/DOI sink (AC-2). Body:\n${body}`,
  );

  // Fail-on-mismatch: a non-byte-identical mirror is a release-blocker. Accept
  // a non-zero exit / explicit failure signal on a hash difference (exit 1,
  // `::error`, `diff`-fail, `[ "$a" = "$b" ] || exit`, `set -e` + a failing
  // cmp, etc.). Do NOT match continue-on-error (the opposite posture).
  assert.match(
    body,
    /exit\s+1|::error|\bcmp\b|!=|-ne\b|\|\|\s*exit|differ|mismatch|fail/i,
    `the byte-identical compare must FAIL the build on ANY mismatch (a non-byte-identical mirror is a release-blocker — AC-2). Body:\n${body}`,
  );

  // Live curl-fetch + sha256 compare gated INERT behind vars.IQME_LIVE_MIRROR
  // (no live fetch / no fabricated hash in dev — lesson-2026-06-04-002).
  assert.match(
    body,
    /vars\.IQME_LIVE_MIRROR/,
    `the live fetch + SHA256 compare must be gated behind vars.IQME_LIVE_MIRROR == 'true' so no live curl / fabricated hash runs in dev (lesson-2026-06-04-002). Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: README mirror-strategy section — canonical URL + mirror URL +
// manual-failover trigger-policy + explicit no-automatic-redirect.
// ─────────────────────────────────────────────────────────────────────

test("AC-3: README.md documents the canonical + mirror URLs, the manual-failover trigger-policy, and an explicit no-automatic-redirect", () => {
  assert.ok(existsSync(README), `README.md missing at ${README}`);
  const readme = readFileSync(README, "utf8");

  // A mirror-strategy section naming both the mirror and the canonical host.
  assert.match(
    readme,
    /mirror/i,
    `README.md must gain a mirror-strategy section (the canonical URL + the mirror URL + the failover policy — PRD §Mirror Strategy). Got:\n${readme.slice(0, 600)}…`,
  );
  // Canonical host (GitHub Pages).
  assert.match(
    readme,
    /github\s*pages|github\.io|bulrock\.github\.io|canonical/i,
    `README.md mirror section must document the CANONICAL URL (GitHub Pages). Got:\n${readme}`,
  );
  // Mirror host (Codeberg Pages or Cloudflare Pages secondary domain).
  assert.match(
    readme,
    /codeberg|cloudflare/i,
    `README.md mirror section must document the MIRROR URL (Codeberg Pages / Cloudflare Pages secondary domain). Got:\n${readme}`,
  );

  // Manual-failover trigger-policy, verbatim in spirit: "manual failover within
  // one day of sustained outage or regional block detection" (NFR17 / PRD
  // §Mirror Strategy). Assert the load-bearing phrases independently so wording
  // can vary slightly.
  assert.match(
    readme,
    /manual\s+failover|manually[-\s]triggered\s+failover|manual[-\s]?fail[-\s]?over/i,
    `README.md must state the failover is MANUAL (no automatic switch) — "manual failover" (NFR17). Got:\n${readme}`,
  );
  assert.match(
    readme,
    /within\s+one\s+day|within\s+a\s+day|within\s+24\s*h(?:ours?|rs?)?|same[-\s]day/i,
    `README.md must state the "within one day" failover window (NFR17: live within one day of detecting a sustained outage or regional block). Got:\n${readme}`,
  );
  assert.match(
    readme,
    /sustained\s+outage|regional\s+block/i,
    `README.md must name the failover trigger conditions — "sustained outage" / "regional block" (NFR17 / Risk #8). Got:\n${readme}`,
  );

  // Explicit no-automatic-redirect (and no JS-based detection) — PRD §Mirror
  // Strategy: "No automatic redirect, no JS-based detection."
  assert.match(
    readme,
    /no\s+automatic\s+redirect|without\s+(?:an?\s+)?automatic\s+redirect|no\s+auto(?:matic)?[-\s]?redirect/i,
    `README.md must explicitly state "no automatic redirect" (PRD §Mirror Strategy — the failover is documented, not JS-detected). Got:\n${readme}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-4: chrome-footer has NO mirror link (discoverability via
// README/Discussions only). EXPECTED GREEN — the footer already omits it.
// ─────────────────────────────────────────────────────────────────────

test("AC-4: the src/index.html chrome-footer block contains NO mirror/Codeberg/Cloudflare link", () => {
  assert.ok(existsSync(INDEX_HTML), `src/index.html missing at ${INDEX_HTML}`);
  const html = readFileSync(INDEX_HTML, "utf8");

  // Slice the <footer class="chrome-footer"> … </footer> block. The existing
  // chrome-components.spec.mjs (Story 6.4, Test 5) enumerates the three footer
  // links by class but does NOT forbid a mirror link — so this explicit
  // no-mirror-link assertion is the AC-4 contract (Dev Notes).
  const footerMatch = html.match(
    /<footer\b[^>]*class\s*=\s*["'][^"']*\bchrome-footer\b[^"']*["'][^>]*>([\s\S]*?)<\/footer>/i,
  );
  assert.ok(
    footerMatch,
    `src/index.html must contain a <footer class="chrome-footer">…</footer> block (Story 6.4). Got:\n${html}`,
  );
  const footer = footerMatch[0];

  // No mirror affordance anywhere in the footer block — discoverability of the
  // mirror is via README/Discussions ONLY (epics AC + PRD §Mirror Strategy).
  assert.doesNotMatch(
    footer,
    /codeberg|cloudflare|mirror/i,
    `the chrome-footer must NOT contain a mirror/Codeberg/Cloudflare link — discoverability is via README/Discussions only (AC-4). Footer block:\n${footer}`,
  );

  // Sanity: the three legitimate footer affordances are still present (so the
  // assertion above isn't passing against an empty/missing footer slice).
  assert.match(
    footer,
    /chrome-footer__methodology-link/,
    `footer slice sanity: the methodology link must still be present (the no-mirror-link assertion must not pass vacuously). Footer block:\n${footer}`,
  );
  assert.match(
    footer,
    /chrome-footer__discussions-link/,
    `footer slice sanity: the Discussions link must still be present. Footer block:\n${footer}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-5: the deploy-to-mirror job declares a STEP that runs the Story-3.7
// full Playwright happy-path against the mirror URL — launch-time live
// (gated INERT behind vars.IQME_LIVE_MIRROR), release-blocker posture
// (NOT continue-on-error). Dev-phase asserts the STEP exists, not a run.
// ─────────────────────────────────────────────────────────────────────

test("AC-5: deploy-to-mirror declares a launch-gated Playwright-against-mirror step (full-slice happy-path) with a release-blocker posture", () => {
  const text = loadRelease();
  const { idx, body } = mirrorJobBody(text);
  assert.notEqual(idx, -1, `deploy-to-mirror job declaration not found.`);

  // The Story-3.7 happy-path runs against the mirror — a playwright /
  // full-slice reference in the job body.
  assert.match(
    body,
    /playwright|full-slice/i,
    `deploy-to-mirror must declare a step running the Story-3.7 full happy-path (tests/playwright/full-slice.spec.mjs) against the mirror URL (AC-5). Body:\n${body}`,
  );

  // The spec re-points at the MIRROR URL — a mirror-URL env/var the Story-3.7
  // spec's configurable origin reads at launch (e.g. IQME_MIRROR_URL /
  // MIRROR_URL / a mirror base-url env). Anchor to a mirror-URL variable so the
  // step is wired against the mirror origin, not the local dev server.
  assert.match(
    body,
    /MIRROR_URL|MIRROR_BASE|MIRROR_ORIGIN|mirror[-_]?url|baseURL[^\n]*mirror/i,
    `the Playwright-against-mirror step must point the Story-3.7 spec at a mirror-URL env/var (e.g. IQME_MIRROR_URL) so the same spec re-targets the mirror origin at launch (AC-5). Body:\n${body}`,
  );

  // Launch-gated INERT behind vars.IQME_LIVE_MIRROR — no live Playwright run in
  // dev (the live run fires at launch / Epic 10).
  assert.match(
    body,
    /vars\.IQME_LIVE_MIRROR/,
    `the Playwright-against-mirror step must be gated behind vars.IQME_LIVE_MIRROR == 'true' so no live run executes in dev (launch-time live — Epic 10). Body:\n${body}`,
  );

  // Release-blocker posture: the mirror Playwright step is NOT continue-on-error
  // (a mirror-specific failure FAILS the job — epics AC). Assert the step body
  // does not mark the Playwright invocation continue-on-error. (The archival
  // steps' continue-on-error lives in the corpus-release job, sliced out here.)
  assert.doesNotMatch(
    body,
    /continue-on-error:\s*true/i,
    `the mirror Playwright step must be a RELEASE-BLOCKER — NOT continue-on-error: true (a mirror-specific failure fails the job — AC-5 / epics AC). Body:\n${body}`,
  );
});
