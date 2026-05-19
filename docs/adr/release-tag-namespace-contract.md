# ADR: Release Tag Namespace Contract

**Status:** Accepted

**Date:** 2026-05-19

**Supersedes:** (none — v1 contract)

## Context

IQ-ME ships two independent artifacts from a single repository:

1. The **assessment SPA bundle** — JavaScript, CSS, HTML, manifest, baked-in constants.
2. The **methodology corpus** — the rendered HTML pages explaining what the assessment numbers mean.

These two artifacts evolve on **independent cadences**:

- The corpus is updated when the methodology copy changes (translation fixes, clarifications, new methodology pages added).
- The SPA bundle is updated when the assessment engine, the reveal ceremony, the styling, or the build harness changes.

Coupling the two through a single version number forces unnecessary deployments (a typo fix in `methodology/en/score-band-average.md` should not require redeploying `scoring.js`). Decoupling them through **two independent tag namespaces** lets the two ship on their natural cadences and lets Epic 8 wire two separate release workflows (one for the SPA, one for the corpus + Zenodo DOI minting).

This ADR pins the tag-namespace contract so Epic 8's `release.yml` and Epic 4's per-corpus-release re-emit semantics (NFR25) can be authored against a stable expectation.

Related contracts:

- `docs/adr/methodology-handoff-url-contract.md` — consumer of the `corpus-v*` tag namespace (the version segment of the methodology URL).
- `docs/adr/iqme-reveal-stage-event-contract.md` — orthogonal to tag namespaces (no version segment in event payloads).

## Decision

### Two independent tag namespaces

The repository uses exactly two tag namespaces, both lowercase, both `v`-prefixed, both SemVer 2.0.0:

- **`app-v<X>.<Y>.<Z>`** — SemVer for the SPA bundle. Triggers `release.yml` SPA deploy in Epic 8.
- **`corpus-v<X>.<Y>.<Z>`** — SemVer for the methodology corpus. Triggers `release.yml` corpus re-emit (per-corpus-release re-emit semantics per NFR25) + Zenodo DOI minting (Epic 8) on tag push.

`<X>`, `<Y>`, `<Z>` are non-negative integers per SemVer 2.0.0. Pre-release identifiers (`-alpha.1`, `-rc.1`) and build metadata (`+sha.abc1234`) are permitted per SemVer; CI workflows that consume the tags must handle them per SemVer parsing.

### Independence rule

- An `app-v` tag bump **does not require** a `corpus-v` tag bump. A typo fix in `tools/build-determinism-marker.mjs` is `app-v` only.
- A `corpus-v` tag bump **does not require** an `app-v` tag bump. A translation fix in `corpus/en/score-band-average.md` is `corpus-v` only.
- The two namespaces share the repo and may share commits (the same SHA may carry both an `app-v*` and a `corpus-v*` tag — see "Coordinated launch" below) but **must not** share version numbers as a matter of policy. `app-v0.3.0` and `corpus-v0.3.0` are unrelated artifacts that happen to share a number.

### Coordinated launch (v1.0.0)

Epic 10 (coordinated v1.0.0 launch) **double-tags** both namespaces at the same SHA — i.e., the commit that ships v1.0.0 of both artifacts simultaneously gets both `app-v1.0.0` and `corpus-v1.0.0`. This is the only sanctioned coordination point; intermediate epics tag independently.

### Footer-link resolution rule

The SPA's footer link to the methodology corpus index resolves the most-recent `corpus-v*` tag via:

```
git describe --tags --match 'corpus-v*' --abbrev=0
```

…at **build time** (architecture line 861; epic narrative line 960). The resolved version is baked into the SPA bundle as a string constant; no runtime version-discovery network request is permitted (FR41 zero-third-party — see also `methodology-handoff-url-contract.md` for the same rule applied to score-panel clicks).

### v0.1.0 initial-tag discipline (Winston)

Per epic narrative line 961, **Story 3.8 (epic-3 closeout)** SHOULD tag `corpus-v0.1.0` at the merge-to-main of the epic-3 squash. The rationale: until a `corpus-v*` tag exists, `git describe --tags --match 'corpus-v*' --abbrev=0` fails, the build cannot bake a version constant, and the SPA shell's footer link cannot resolve. Story 3.8 ensures dev environments work before Epic 8 lands the full `release.yml`.

This ADR **documents the expectation**; the tag itself is not created in Story 3.1.

## Consequences

- **Epic 4** (`tools/build-methodology.mjs`) consumes the `corpus-v*` tag namespace: per-corpus-release re-emit semantics per NFR25 mean the build pipeline reads the latest `corpus-v*` tag, embeds it in emitted URLs, and re-emits all corpus pages whenever a new `corpus-v*` lands.
- **Epic 8** (`release.yml`) consumes both tag namespaces: two trigger filters (`tags: ['app-v*']` and `tags: ['corpus-v*']`) wire two independent workflows (SPA deploy + corpus re-emit with Zenodo DOI minting).
- **Epic 10** (coordinated v1.0.0 launch) consumes both tag namespaces via the double-tag pattern at the launch SHA.
- **Story 3.8** (epic-3 closeout) consumes this ADR by tagging `corpus-v0.1.0` to unblock dev-environment footer-link resolution.
- The `corpus-v0.1.0` tag is the **first** `corpus-v*` tag; until it lands, `git describe` fails and any code path that depends on the baked-in version constant must either gate on tag presence or fail loudly at build time.

## Drift consequences

Any change to this contract requires a new ADR superseding this one, plus coordinated PR review across all consumer modules.
