---
id: 8-8-github-discussions-link-in-chrome-footer-release-notification-subscription-path
title: "Story 8.8: GitHub Discussions link in chrome-footer + release-notification subscription path"
status: review
---

# Story 8.8: GitHub Discussions link + release-notification subscription path

## Story

As a **user wanting to follow project updates without giving an email address (FR52)**,
I want **a GitHub Discussions link in the chrome-footer (UX-DR8) and a documented path to subscribe to repo release notifications via GitHub — no email-subscription mechanism**,
so that **the structural no-signup / no-email posture holds and updates reach interested users via channels they already control**.

## Acceptance Criteria

> **Note — mostly verification + a README addition.** The chrome-footer already carries the real Discussions anchor (Epic 6 / Story 6.4) and `chrome-components.spec.mjs` already exercises it; README already states the no-email posture. This story PINS the FR52 invariants with a structural test and adds the explicit release-notification subscription path (Watch → Releases only + Discussions thread Subscribe) to README, so the documented subscription mechanisms are unambiguous.

1. **AC-1 (footer Discussions link finalized + zero-third-party):** the `<footer class="chrome-footer">` in `src/index.html` contains the real repository Discussions anchor (`<a … href="https://github.com/Bulrock/IQ-ME/discussions" …>`) to the PUBLIC Discussions area (no account required to read). It is an `<a href>` ONLY — no `rel="prefetch"`/`rel="preload"`, and there is NO `<link rel="preconnect">` / `rel="dns-prefetch">` to github in the document head (no third-party fetch on load or hover). The strict CSP from Epic 1 holds. (The Playwright network-trace / `trust-verification` suite already asserts zero third-party requests on the footer-bearing pages.)
2. **AC-2 (release-notification subscription path documented; no email):** `README.md` documents the two — and only two — update-subscription mechanisms: GitHub repository **release notifications** ("Watch → Custom → Releases only") and GitHub **Discussions thread subscription** (per-thread "Subscribe" in the GitHub UI). `CONTRIBUTING.md` (Story 8.6) already states the same; both contain NO email-signup CTA, NO newsletter reference, and ask for NO user identifier (FR52).
3. **AC-3 (test + no regression):** a NEW `tests/scaffold/discussions-footer.test.mjs` asserts: the footer Discussions anchor (real URL, `<a href>`, no prefetch/preload on it); no `<link rel="preconnect"|"dns-prefetch">` to github in `src/index.html`; `README.md` documents the Watch-→-Releases-only + Discussions-Subscribe path and has no email-signup/newsletter CTA; `CONTRIBUTING.md` documents the same subscription path. `make test`/`make lint`/`make build` green.

## Tasks / Subtasks

- [x] **Task 1: Add the release-notification subscription path to README** (AC: 2)
  - [x] Add a short "Following updates" section to `README.md`: GitHub repository release notifications (Watch → Custom → Releases only) + Discussions thread Subscribe; explicitly no email/newsletter/account-identifier (FR52). Keep the existing Discussions link + no-email posture.
- [x] **Task 2: Verify the footer Discussions anchor invariants** (AC: 1)
  - [x] Confirm `src/index.html` footer Discussions anchor is the real public URL, `<a href>` only (no prefetch/preload), and there is no `<link rel="preconnect"/"dns-prefetch">` to github in the head. No change expected (already correct from Story 6.4) — adjust only if an invariant is violated.
- [x] **Task 3 (test-author phase): Add discussions-footer structural test** (AC: 3)
  - [x] `tests/scaffold/discussions-footer.test.mjs`: footer real-URL anchor + no prefetch on it + no `<link rel=preconnect/dns-prefetch>` to github in the head; README Watch-→-Releases-only + Discussions-Subscribe + no email-signup CTA; CONTRIBUTING subscription path.
- [x] **Task 4: Regression gate** (AC: 3)
  - [x] `make test`/`make lint`/`make build` green + deterministic; baseline-diff any ambiguous failure (lesson-2026-06-03-002).

## Dev Notes

- **Footer today** (`src/index.html`): `<a class="chrome-footer__discussions-link" href="https://github.com/Bulrock/IQ-ME/discussions" target="_blank" rel="noopener">Discussions</a>` — already the real public URL, `<a href>` only, `rel="noopener"` (no prefetch). Story 6.4's `chrome-components.spec.mjs` already verifies the anchor points at the canonical Discussions URL; this story does NOT need to graduate it — the new scaffold test adds the FR52/zero-third-party invariants (no preconnect/dns-prefetch, no email CTA) that 6.4 does not cover.
- **README today** has the no-email posture (line 3: "No email. No login.") + the Discussions link in the mirror section. ADD an explicit "Following updates" section naming the two subscription mechanisms (Watch → Releases only + Discussions Subscribe) so the path is documented (AC-2), not just implied.
- **CONTRIBUTING.md** (Story 8.6) already says "Watch the repository (Releases only) or subscribe to a Discussion thread" — the test pins this stays true. No CONTRIBUTING change needed.
- **Zero-third-party (AC-1/AC-3):** the footer link is a navigational `<a href>` — clicking it leaves the site; it does NOT fetch github on load/hover. The test asserts no `<link rel="preconnect">`/`rel="dns-prefetch">` to github in the head (those WOULD open a third-party connection on load). The `trust-verification`/`network-trace` suite already asserts zero third-party requests at runtime.
- **Files:** `README.md` (add subscription section), `tests/scaffold/discussions-footer.test.mjs` (NEW, test-author). No src/ change expected (footer already correct); if `make build`/byte-stable is touched, regenerate nothing (README isn't a corpus page).
- **No frozen-test graduation** — `chrome-components.spec.mjs` already passes and is not disturbed.

### Carry-forward lessons

- lesson-2026-06-03-002 (high): verify provenance with a baseline diff. Apply: the README addition is net-new; baseline-diff before labeling any failure pre-existing.
- lesson-2026-06-03-001 (medium here): CI wires per-spec. Apply: the new `discussions-footer.test.mjs` is a `tests/scaffold/` test auto-discovered by `make test` — no pr-checks job needed.
- lesson-2026-06-04-002 (informational): no fabrication. Apply: use the real repository Discussions URL (already present), no invented links.

### Project Structure Notes

- chrome-footer in `src/index.html`; `README.md` at repo root; test under `tests/scaffold/`. No structural variance.

### References

- [Source: epics.md#Story-8.8] — AC source (Discussions footer link, FR52 subscription path, zero-third-party).
- [Source: src/index.html] — the chrome-footer Discussions anchor (already real-URL from Story 6.4).
- [Source: README.md] — no-email posture + Discussions link (gains the subscription section).
- [Source: CONTRIBUTING.md] — already documents Watch-→-Releases + Discussions subscribe (Story 8.6).
- [Source: tests/playwright/chrome-components.spec.mjs] — Story 6.4 footer-anchor verification (not disturbed).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- README 'Following updates' section (Watch->Releases only + Discussions Subscribe; FR52 no-email/no-signup). Footer Discussions anchor already real-URL/no-prefetch (6.4) — verified, no src change. Frozen 5/5; suite 1275 pass/0 fail; lint+build exit 0.
- Promoted to review: 4/4 tasks; frozen discussions-footer test green; suite 1275 pass/0 fail; lint+build exit 0.

### File List

- README.md
- tests/scaffold/discussions-footer.test.mjs

## Specialist Self-Review

## Specialist Self-Review — Story 8-8 (Discussions footer link + release-notification subscription path, FR52)

**Decisions made:**
- Added a `## Following updates` section to `README.md` documenting the two — and only two — GitHub-native update-subscription mechanisms: repository **release notifications** ("Watch → Custom → Releases" — notified only on a new `app-v*`/`corpus-v*` tag) and **Discussions** thread **Subscribe**. Explicit FR52 posture: no email list, no account capture, no signup, no mailing list.
- The chrome-footer Discussions anchor was ALREADY the real public URL from Story 6.4 (`<a class="chrome-footer__discussions-link" href="https://github.com/Bulrock/IQ-ME/discussions" target="_blank" rel="noopener">`) — an `<a href>` only, `rel="noopener"`, no prefetch/preload — so Task 2 was a verification (no src/ change). Confirmed there is no `<link rel="preconnect">`/`rel="dns-prefetch">` to github in the head.

**Alternatives considered:**
- Graduate the Story-6.4 `chrome-components.spec.mjs` — rejected; it already passes and verifies the anchor points at the canonical Discussions URL, and 8.8's FR52/zero-third-party invariants (no preconnect, no email CTA, subscription path) are orthogonal — covered by the new scaffold test instead, leaving 6.4 undisturbed.
- Add the subscription path to CONTRIBUTING.md — already there from Story 8.6 ("Watch the repository (Releases only) or subscribe to a Discussion thread"); the test pins it stays true. Only README needed the explicit section.

**Framework gotchas avoided:**
- **Self-test trap avoided:** my own `discussions-footer.test.mjs` AC-2 no-email regex forbids `newsletter` / `email sign-up` / `enter your email` / `email subscription`. I phrased the README disclaimer to AVOID those literals ("no email list, no account capture, and no signup"; "no mailing list and nothing to sign up for") so the disclaiming prose does not trip the FR52 doesNotMatch — the lesson learned the hard way on 8.6 (`analytics`) and 8.7 (`analytics`), applied proactively here.
- Kept the "Watch → … → Releases" and "Subscribe … Discussions" phrasing period-free so the structural `watch[^.]*releases` / `subscrib[^.]*discussion` regexes match.

**Areas of uncertainty:**
- The footer Discussions link's zero-third-party behavior (a navigational `<a href>` that fetches github only on a deliberate click, never on load/hover) is asserted STRUCTURALLY here (no `<link>` preconnect/dns-prefetch + no prefetch/preload rel on the anchor); the live runtime guarantee (zero third-party requests on the footer-bearing pages) is the Story-8.5 `trust-verification`/`network-trace` suite's job in CI — not separately browser-run in dev.
- The stale "## Contributing" README line (still says the surface is "slim … expanded in Epic 8") is now inaccurate post-8.6 but is OUT of scope for 8.8 (no test covers it); left untouched per scope discipline — a candidate for a tiny follow-up.

**Tested edge cases:**
- Frozen `tests/scaffold/discussions-footer.test.mjs`: footer has the real public GitHub Discussions `<a href>`; the anchor carries no prefetch/preload rel; no `<link rel="preconnect"/"dns-prefetch">` to github in `src/index.html`; README documents Watch-→-Releases-only + Discussions-Subscribe and has no email-signup/newsletter CTA; CONTRIBUTING.md states the same subscription path.
- Regression: full suite 1275 pass / 0 fail; `make lint` exit 0; `make build` exit 0 (deterministic; README is not a corpus page). Provenance: the README "Following updates" section is net-new this story.

## Auditor Findings (round-1)

### [info] The 8-8 self-review honestly discloses a stale README "## Contributing" line that still says the surface is "slim … expanded in Epic 8" — inaccurate after Story 8.6 rewrote CONTRIBUTING.md to the full guide. No test covers that line so it is out of 8-8's scope; left untouched per scope discipline. Minor documentation drift, info-level follow-up.

- **Category:** doc-staleness
- **Suggested bridge:** `Tiny doc fix: update the README "## Contributing" sentence to drop the "expanded in Epic 8" framing now that CONTRIBUTING.md is the full guide.`
- **Bridged to:** `bridge-9b-2-refresh-stale-readme-contributing`
