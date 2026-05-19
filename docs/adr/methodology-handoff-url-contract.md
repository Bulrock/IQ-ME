# ADR: Methodology Handoff URL Contract

**Status:** Accepted

**Date:** 2026-05-19

**Supersedes:** (none — v1 contract)

## Context

The IQ-ME assessment SPA's reveal ceremony culminates in a handoff to the methodology corpus — the user clicks a number on the score panel (e.g., a band label, a credible-interval endpoint, a context anchor) and is navigated to a corpus page that explains exactly what that number means. This crossing of the SPA → corpus boundary is **two-sided**: Epic 4 (corpus build pipeline) emits the methodology HTML pages at a specific URL pattern, and Epic 6 (score-panel ceremony) binds clicks that navigate to those exact URLs. If the two sides disagree on the URL shape — even subtly (trailing slash drift, locale-segment placement, version-segment placement) — the click silently 404s in production.

To prevent that, this ADR **pins the URL pattern before either side ships**. Epic 4 reads this ADR to know where to emit; Epic 6 reads this ADR to know where to click.

Related contracts:

- `docs/adr/release-tag-namespace-contract.md` — the `corpus-v*` tag namespace supplies the version segment in the URL.
- `docs/adr/iqme-reveal-stage-event-contract.md` — the `handoff` stage marks the click target as interactive.

## Decision

### URL pattern (canonical, pinned)

```
/methodology/v<X>.<Y>.<Z>/<lang>/<path>/
```

Where:

- `v<X>.<Y>.<Z>` is the **corpus SemVer** — the `corpus-v*` tag namespace per `release-tag-namespace-contract.md`. Note the `v` prefix is part of the URL segment (matches the tag's `v` prefix); SemVer parts `<X>`, `<Y>`, `<Z>` are non-negative integers per SemVer 2.0.0.
- `<lang>` is one of `en | ru | pl` — matches the locale enum in `src/assessment/state.schema.json` and architecture line 882.
- `<path>` is **kebab-case** — lowercase ASCII letters, digits, and hyphens; no underscores, no camelCase, no `.html` extension, no nested deeper than allowed by the corpus tree.
- URL is **slash-terminated** — the trailing slash is mandatory. No trailing `index.html`. No version-less, locale-less, or path-less variants.

Example resolved URL:

```
/methodology/v0.1.0/en/score-band-average/
```

### Click-binding contract

Each score-panel number element (anything rendered by Epic 6's score-panel that should be clickable into the methodology corpus) MUST carry the attribute:

```
data-methodology-target="<path>"
```

- `<path>` is **path-only** — no version prefix, no locale prefix. Just the kebab-case page slug.
- The version and locale are resolved at click-time by the SPA from the active locale (state) and the baked-in latest `corpus-v*` tag (build artifact).

### Resolution rule (click-time)

At click time, the SPA:

1. Reads the value of `data-methodology-target` on the clicked element.
2. Reads the active locale from session state (`src/assessment/state.schema.json` `locale` field).
3. Reads the baked-in latest corpus version constant (see "Build-time baking" below).
4. Composes the URL: `/methodology/<latest-corpus-version>/<active-locale>/<path>/` (note the leading slash, three slashes between segments, trailing slash).
5. Navigates (e.g., `window.location.href = ...` or equivalent SPA navigation).

### Build-time baking

The "latest corpus version" is determined **at build time** by:

```
git describe --tags --match 'corpus-v*' --abbrev=0
```

…and baked into the SPA bundle as a string constant. **No runtime version-discovery network request is permitted** — that would violate FR41 (zero-third-party network) and would also create a runtime dependency on the corpus repo's tag state.

### No fallbacks, no aliases, no query strings

- There is exactly **one canonical URL** per (corpus-version, locale, page) tuple.
- No `?v=…` query strings, no `#anchor` fragments mandated, no `/methodology/latest/...` aliases, no `/methodology/<lang>/...` shortcuts.
- A missing page is a 404, not a redirect to an alternative locale or version.

## Consequences

- **Epic 4** (`tools/build-methodology.mjs`) emits HTML at this exact URL pattern; the build pipeline is responsible for the trailing slash, the version-segment placement, and the locale-segment placement. Drift between this ADR and the build pipeline is a regression.
- **Epic 6** (score-panel) binds clicks to this exact URL pattern via the `data-methodology-target` attribute on numeric elements. Drift between this ADR and the click handler is a regression.
- Neither Epic 4 nor Epic 6 may diverge from this ADR without a v2 contract bump (and coordinated PR review across both modules + the SPA bundle's baked-in version constant).
- The SPA's footer link to the methodology corpus index (separate from score-panel clicks) follows the same `/methodology/<latest-corpus-version>/<active-locale>/` prefix; the exact path for that footer link is detailed in `release-tag-namespace-contract.md`.

## Drift consequences

Any change to this contract requires a new ADR superseding this one, plus coordinated PR review across all consumer modules.
