---
id: 8-8-github-discussions-link-in-chrome-footer-release-notification-subscription-path
title: "Story 8.8: GitHub Discussions link in chrome-footer + release-notification subscription path"
status: ready-for-dev
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

- [ ] **Task 1: Add the release-notification subscription path to README** (AC: 2)
  - [ ] Add a short "Following updates" section to `README.md`: GitHub repository release notifications (Watch → Custom → Releases only) + Discussions thread Subscribe; explicitly no email/newsletter/account-identifier (FR52). Keep the existing Discussions link + no-email posture.
- [ ] **Task 2: Verify the footer Discussions anchor invariants** (AC: 1)
  - [ ] Confirm `src/index.html` footer Discussions anchor is the real public URL, `<a href>` only (no prefetch/preload), and there is no `<link rel="preconnect"/"dns-prefetch">` to github in the head. No change expected (already correct from Story 6.4) — adjust only if an invariant is violated.
- [ ] **Task 3 (test-author phase): Add discussions-footer structural test** (AC: 3)
  - [ ] `tests/scaffold/discussions-footer.test.mjs`: footer real-URL anchor + no prefetch on it + no `<link rel=preconnect/dns-prefetch>` to github in the head; README Watch-→-Releases-only + Discussions-Subscribe + no email-signup CTA; CONTRIBUTING subscription path.
- [ ] **Task 4: Regression gate** (AC: 3)
  - [ ] `make test`/`make lint`/`make build` green + deterministic; baseline-diff any ambiguous failure (lesson-2026-06-03-002).

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

### File List

## Specialist Self-Review
