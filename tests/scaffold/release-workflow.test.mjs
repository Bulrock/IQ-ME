// Story 8.1 — Acceptance tests for the ACTIVATED .github/workflows/release.yml.
//
// Authored in test-author phase (frozen during specialist impl).
// Each test maps to one AC (or AC-group) in spec
// _bmad-output/implementation-artifacts/stories/8-1-release-yml-workflow-app-v-corpus-v-tag-triggers-deployment.md.
//
// Run: `node --test tests/scaffold/release-workflow.test.mjs`
//
// RED PHASE: release.yml is still the Epic-1 stub (`echo "Activates in Epic 8"`).
// These assertions describe the *activated* two-job contract that does NOT yet
// exist, so they FAIL until Story 8.1 implements the workflow.
//
// Structural-only checks — no YAML parser dep (NFR33). We treat the workflow
// file as text and assert presence/proximity of expected lines, slicing job
// bodies by findIndex + a fixed window (same approach as ci-matrix.test.mjs
// AC-2/AC-3). Regexes tolerate optional quotes/whitespace.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const RELEASE = join(REPO_ROOT, ".github", "workflows", "release.yml");

function loadRelease() {
  assert.ok(existsSync(RELEASE), `release.yml missing at ${RELEASE}`);
  return readFileSync(RELEASE, "utf8");
}

// Slice a job body: find the `  <job>:` declaration line and return the next
// `window` lines joined (the job's steps/if/with block). Mirrors the
// ci-matrix.test.mjs AC-2/AC-3 job-body slicing.
function jobBody(text, job, window = 30) {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) =>
    l.match(new RegExp(`^  ${job.replace(/-/g, "\\-")}:\\s*$`)),
  );
  return { idx, body: idx === -1 ? "" : lines.slice(idx, Math.min(idx + window, lines.length)).join("\n") };
}

// ─────────────────────────────────────────────────────────────────────
// AC-1: tag triggers + two tag-gated jobs
// ─────────────────────────────────────────────────────────────────────

test("AC-1: release.yml triggers on app-v* + corpus-v* tags and declares two if-gated jobs", () => {
  const text = loadRelease();

  // on: push: tags: block exists at top level.
  assert.match(
    text,
    /^on:\s*\n(?:[ \t]+[^\n]*\n)*?[ \t]+push:\s*\n(?:[ \t]+[^\n]*\n)*?[ \t]+tags:/m,
    `release.yml must declare on: push: tags: at top level. Got:\n${text.slice(0, 400)}`,
  );

  // Both semver tag globs present (quotes optional).
  assert.match(
    text,
    /app-v\*\.\*\.\*/,
    `release.yml must trigger on the "app-v*.*.*" tag glob (decoupled app namespace, architecture D7).`,
  );
  assert.match(
    text,
    /corpus-v\*\.\*\.\*/,
    `release.yml must trigger on the "corpus-v*.*.*" tag glob (decoupled corpus namespace, architecture D7).`,
  );

  // Two distinct jobs declared at the jobs: top level (2-space indent).
  const { idx: appIdx } = jobBody(text, "app-release");
  const { idx: corpusIdx } = jobBody(text, "corpus-release");
  assert.notEqual(
    appIdx,
    -1,
    `release.yml must declare an "  app-release:" job at the jobs: top level.`,
  );
  assert.notEqual(
    corpusIdx,
    -1,
    `release.yml must declare a "  corpus-release:" job at the jobs: top level.`,
  );

  // The stub single `release:` job must be gone (activated structure replaces it).
  assert.doesNotMatch(
    text,
    /^  release:\s*$/m,
    `release.yml must no longer declare the Epic-1 stub "  release:" job (graduated to app-release/corpus-release).`,
  );

  // Each job body carries an `if:` gating on ITS OWN tag ref.
  const { body: appBody } = jobBody(text, "app-release");
  assert.match(
    appBody,
    /^\s*if:.*refs\/tags\/app-v/m,
    `app-release job must carry a job-level if: gating on refs/tags/app-v (e.g. if: startsWith(github.ref, 'refs/tags/app-v')). Body:\n${appBody}`,
  );

  const { body: corpusBody } = jobBody(text, "corpus-release");
  assert.match(
    corpusBody,
    /^\s*if:.*refs\/tags\/corpus-v/m,
    `corpus-release job must carry a job-level if: gating on refs/tags/corpus-v (e.g. if: startsWith(github.ref, 'refs/tags/corpus-v')). Body:\n${corpusBody}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-2: app-release job → make build + full gate + byte-stable + gh-pages
// ─────────────────────────────────────────────────────────────────────

test("AC-2: app-release job runs make build + make lint + make test + byte-stable and deploys to gh-pages", () => {
  const text = loadRelease();
  const { idx, body } = jobBody(text, "app-release", 40);
  assert.notEqual(idx, -1, `app-release job declaration not found.`);

  // Deterministic dist/ assembly (NFR21 no-op transform).
  assert.match(
    body,
    /make build\b/,
    `app-release must assemble the dist/ SPA artifact via "make build". Body:\n${body}`,
  );

  // Full lint + test gate — enumerated by aggregate make targets, NOT a glob
  // (lesson-2026-06-03-001). Assert the concrete invocations independently so
  // ordering / chaining (&&) can vary.
  assert.match(
    body,
    /make lint\b/,
    `app-release must run the aggregate "make lint" gate (same gate pr-checks.yml enforces). Body:\n${body}`,
  );
  assert.match(
    body,
    /make test\b/,
    `app-release must run the aggregate "make test" gate. Body:\n${body}`,
  );

  // Byte-stable assertion (Epic 4) blocks a non-byte-stable artifact.
  assert.match(
    body,
    /make test-byte-stable\b|byte-stable/,
    `app-release must invoke the byte-stable build assertion (make test-byte-stable / byte-stable, Epic 4) so a non-byte-stable artifact blocks the release. Body:\n${body}`,
  );

  // GitHub Pages deploy of the SPA artifact.
  assert.match(
    body,
    /gh-pages|github\s*pages|pages-?(deploy|action)|actions\/deploy-pages/i,
    `app-release must deploy the dist/ artifact to GitHub Pages / gh-pages (architecture §860-862). Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-3: corpus-release job → IQME_CORPUS_VERSION re-emit + methodology deploy
// ─────────────────────────────────────────────────────────────────────

test("AC-3: corpus-release derives IQME_CORPUS_VERSION, runs make build-methodology, deploys dist/methodology preserving prior versions", () => {
  const text = loadRelease();
  const { idx, body } = jobBody(text, "corpus-release", 40);
  assert.notEqual(idx, -1, `corpus-release job declaration not found.`);

  // Version derived from the corpus tag into the IQME_CORPUS_VERSION env
  // (the REAL version-injection mechanism — NOT a `--corpus-version` flag).
  assert.match(
    body,
    /IQME_CORPUS_VERSION/,
    `corpus-release must set IQME_CORPUS_VERSION (derived from refs/tags/corpus-v<X.Y.Z>) — the real version-injection mechanism, not a --corpus-version flag. Body:\n${body}`,
  );

  // Per-corpus re-emit build (NFR25).
  assert.match(
    body,
    /make build-methodology\b/,
    `corpus-release must invoke "make build-methodology" (per-corpus re-emit, NFR25). Body:\n${body}`,
  );

  // Methodology deploy references the versioned dist/methodology tree.
  assert.match(
    body,
    /dist\/methodology/,
    `corpus-release must deploy the dist/methodology/v<X.Y.Z>/ tree to gh-pages. Body:\n${body}`,
  );

  // Prior version permalinks must be preserved (archaeological citations keep
  // resolving) — the deploy must NOT wholesale clobber gh-pages. Assert a
  // preservation hint (keep prior dirs / no full clean / incremental publish).
  assert.match(
    body,
    /preserv|prior|without\s+clobber|keep[-_ ]?(prior|existing|files)|clean:\s*false|don'?t\s+clobber/i,
    `corpus-release must preserve prior dist/methodology/v<prior>/ permalinks when deploying (no wholesale clobber of gh-pages). Body:\n${body}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-4: footer corpus-version substitution via git describe
// ─────────────────────────────────────────────────────────────────────

test("AC-4: workflow resolves the footer methodology link via git describe --match 'corpus-v*'", () => {
  const text = loadRelease();

  // The single build-time version substitution touching the SPA shell footer
  // (architecture §596-597). Tolerate optional --abbrev=0 / quoting variance.
  assert.match(
    text,
    /git describe[^\n]*--match\s*['"]?corpus-v\*['"]?/,
    `release.yml must resolve the SPA footer methodology link via "git describe --tags --match 'corpus-v*'" (architecture §596-597). Got:\n${text}`,
  );
});

// ─────────────────────────────────────────────────────────────────────
// AC-5: archival steps PRESENT (graduated by Story 8.2) AND the
// Codeberg/Cloudflare mirror PRESENT (graduated by Story 8.4).
//
// GRADUATED in Story 8.2: the 8.1-era archival-ABSENCE assertions flipped
// to archival-PRESENCE (Zenodo/IA/SH) — KEPT untouched here.
//
// GRADUATED in Story 8.4: this story OWNS the mirror activation, so the
// 8.2-era mirror-ABSENCE assertion (`doesNotMatch(/deploy-to-mirror:|…/)`)
// flips to mirror-PRESENCE (the `deploy-to-mirror` job is present + a
// byte-identical SHA256 compare names the four artifacts), and the
// Story-8.4 deferral-marker assertion is DROPPED (the marker is graduated
// to a real job). Detailed per-step archival contract lives in
// release-archival.test.mjs; the detailed mirror contract in
// mirror-deploy.test.mjs.
// ─────────────────────────────────────────────────────────────────────

test("AC-5: corpus-release implements the Zenodo/IA/SH archival steps (Story 8.2); release.yml implements the Codeberg/Cloudflare deploy-to-mirror job (Story 8.4)", () => {
  const text = loadRelease();
  const { idx, body } = jobBody(text, "corpus-release", 80);
  assert.notEqual(idx, -1, `corpus-release job declaration not found.`);

  // GRADUATED: the Story-8.2 archival steps are now PRESENT in the
  // corpus-release body (was: archival ABSENT + a "Story 8.2" marker). We
  // assert the REAL endpoint/sink signatures (api.zenodo.org / CITATION.cff
  // write, web.archive.org/save, archive.softwareheritage.org) rather than the
  // bare service names — the bare names also appeared in the 8.1-era
  // "Deferred to Story 8.2 …" prose marker, so matching them would false-pass
  // against the un-graduated workflow. (Detailed per-step contract lives in
  // release-archival.test.mjs.)
  // Zenodo DOI step → fetches via the Zenodo API and writes the CITATION.cff sink.
  assert.match(
    body,
    /api\.zenodo\.org|CITATION\.cff/,
    `corpus-release must now implement a Zenodo DOI step (Zenodo API fetch + CITATION.cff sink write), graduated by Story 8.2. Body:\n${body}`,
  );
  // Internet Archive Save Page Now step → the web.archive.org/save endpoint.
  assert.match(
    body,
    /web\.archive\.org\/save/i,
    `corpus-release must now implement an Internet Archive Save-Page-Now step targeting web.archive.org/save (graduated by Story 8.2). Body:\n${body}`,
  );
  // Software Heritage save step → the SH save endpoint.
  assert.match(
    body,
    /archive\.softwareheritage\.org|softwareheritage\.org\/api/i,
    `corpus-release must now implement a Software Heritage save step targeting archive.softwareheritage.org (graduated by Story 8.2). Body:\n${body}`,
  );

  // GRADUATED (Story 8.4): the Codeberg/Cloudflare mirror is now a REAL job.
  // (The Story-8.4 deferral-marker assertion — assert.match(/(8\.4|8-4|Story
  // 8\.4)/) — is DROPPED: the marker is graduated to the deploy-to-mirror job.)
  //
  // The `deploy-to-mirror:` job is declared at the jobs: top level. We slice
  // its body with a generous window so the (now-removed) deferral-marker
  // comment can no longer satisfy the endpoint/artifact signatures.
  const { idx: mirrorIdx, body: mirrorBody } = jobBody(text, "deploy-to-mirror", 80);
  assert.notEqual(
    mirrorIdx,
    -1,
    `release.yml must declare a "  deploy-to-mirror:" job at the jobs: top level (graduated by Story 8.4). Got:\n${text}`,
  );

  // The mirror job pushes the dist/ artifact to a real Codeberg/Cloudflare
  // endpoint (anchor to a real endpoint signature inside the job body, NOT the
  // bare /codeberg/|/cloudflare/ on the whole file — the prior deferral-marker
  // comment carried those bare words).
  assert.match(
    mirrorBody,
    /codeberg|cloudflare|wrangler\s+pages\s+deploy/i,
    `deploy-to-mirror must push to the real Codeberg/Cloudflare Pages endpoint (Codeberg Pages push / wrangler pages deploy). Body:\n${mirrorBody}`,
  );

  // Byte-identical SHA256 comparison step naming the four trust artifacts +
  // fail-on-mismatch (architecture §860-862 / NFR17). The detailed contract
  // lives in mirror-deploy.test.mjs; here we assert the core signatures.
  assert.match(
    mirrorBody,
    /sha256sum|shasum/i,
    `deploy-to-mirror must SHA256-compare the canonical vs mirror artifacts (sha256sum / shasum). Body:\n${mirrorBody}`,
  );
  assert.match(
    mirrorBody,
    /LICENSES\.md/,
    `the byte-identical compare must name the LICENSES.md trust artifact. Body:\n${mirrorBody}`,
  );
  assert.match(
    mirrorBody,
    /CITATION\.cff/,
    `the byte-identical compare must name the CITATION.cff trust artifact. Body:\n${mirrorBody}`,
  );
});
