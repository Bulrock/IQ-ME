# Local build — instructions for hallway-test participants

This is a short procedural document for running the IQ-ME pre-release build on your own machine. The build is intentionally minimal; it shows what the project looks like today, not what it will look like at v1.

## Prerequisites

- Node.js 22 or newer.
- Git.
- A modern browser (Chrome, Firefox, Safari, or Yandex Browser).

## One-command build

```
git clone <repo-url>
cd IQ-ME
make build-methodology
make dev
```

`make build-methodology` renders the three methodology stub pages once. `make dev` starts the interim static-file dev-server on `http://127.0.0.1:4173/`. Stop the server with Ctrl-C.

## Happy-path walkthrough

1. Open `http://127.0.0.1:4173/` in your browser.
2. Read the landing page. Click "Start the test".
3. Read the consent + validity-envelope disclosure. Click "Continue" when it becomes available.
4. Answer the 16 matrix-reasoning items at your own pace. There is no time pressure.
5. When you finish item 16, you'll see "Your result is ready" — that's the pre-reveal beat. Click "Show me".
6. The score panel shows three numbers: your percentile, your IQ-scale anchor, and an uncertainty band.
7. Click any one of the three numbers to read what that number means.
8. The page that loads is a methodology stub — interim presentation; the content is real but the styling is minimal.

## Known interim limitations

These are deliberate, not bugs:

- The methodology pages are stubs. Their bodies are raw markdown wrapped in a `<pre>` block. Epic 4 lands the full subset-parsing renderer + styled corpus.
- Only the EN locale is available. Epic 7 lands RU and PL.
- The 16 items in the test are placeholders for the full ICAR-MR pool. Epic 9a finalizes the licensed item set.
- The score's uncertainty band currently uses `SE_norming = 0` as a placeholder. Epic 9b finalizes the norming-sample standard error with psychometrician sign-off; the band will widen.
- The dev-server is a minimal static-file handler (NFR33 stdlib-only). No live-reload; restart `make dev` to pick up file changes during development. Epic 4 lands the full dev-server.

## What to expect on your score

The displayed score is one estimate from 16 items. The uncertainty band tells you how much weight to put on the midpoint — a wide band means a less precise estimate. The methodology pages explain percentile, IQ-scale convention, and the uncertainty band in plain language; read them if you want context on what the numbers mean.

If something feels off — confusing copy, unexpected behavior, a tonal-handoff that didn't click — please share that observation. It's exactly the feedback the hallway test is trying to surface.

## corpus-v0.1.0 git tag (maintainer note)

The SPA shell's footer link to the methodology corpus uses `git describe --tags --match 'corpus-v*' --abbrev=0` to resolve the version segment. Until the `corpus-v0.1.0` tag exists, this lookup fails locally.

After the epic-3 squash lands on `main` (via `tds deliver` in code-review Mode 2), the maintainer or auditor creates the tag:

```
git tag corpus-v0.1.0 <main-HEAD-sha>
git push origin corpus-v0.1.0
```

Or the equivalent via `gh release create corpus-v0.1.0`. This is a one-time action per `docs/adr/release-tag-namespace-contract.md` line 61-73 — Story 3.8's corpus-v0.1.0 initial-tag discipline. Epic 8 lands the full `release.yml` automation that handles future `corpus-v*` tags.

If you get stuck or something looks broken, ping the maintainer. That observation is part of the test.
