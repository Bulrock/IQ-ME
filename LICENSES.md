# IQ-ME Licenses

<!-- last-modified-hash: 0000000000000000000000000000000000000000000000000000000000000000 -->
<!-- The hash above is the SHA-256 of this file's contents *excluding* the
     hash line itself. The Story 1.9 `lint-license-provenance.mjs` script
     recomputes and compares it on every PR (NFR24). At v0.0.1 the placeholder
     all-zeros hash will be flipped to a real digest by the Story 1.9 commit
     that introduces the lint script. Drift requires a CHANGELOG entry. -->

## Why this file exists (NFR24, NFR34, FR50)

IQ-ME is composed of artifacts that originate under different licenses. This file enumerates every license class, names the artifact paths that fall under each class, and pins an attribution string for every ICAR-sourced item. A skeptic (Tomáš journey, per the PRD) can read this file in under 60 seconds and verify the project's "trust-through-transparency" claim without needing to clone or run anything.

## License class enumeration

### 1. App code — MIT

**Scope:** every file under `src/assessment/`, `src/scoring/`, `src/css/`, `src/index.html`, and every file under `tools/` (author-time build pipeline).

**License:** MIT License (text below). Permits commercial use, modification, redistribution, sublicensing; requires preservation of copyright + license notice; carries no warranty.

> Copyright (c) 2026 IQ-ME maintainers.
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### 2. Item pool (matrix-reasoning items) — CC-BY-NC-SA 4.0 (or ICAR-author-specified)

**Scope:** every file under `src/items/`. Each item file carries a frontmatter `attribution:` field that names the original ICAR / SAPA author and the upstream URL.

**License:** Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0), unless the upstream ICAR author specified a different (more permissive) license — in which case the upstream license wins and the item frontmatter records it.

**Attribution strings (per shipped item):** every item file in `src/items/` must declare:
```yaml
attribution:
  upstream-source: "ICAR (International Cognitive Ability Resource) — https://icar-project.com/"
  upstream-author: "<author or 'SAPA Project'>"
  upstream-license: "CC-BY-NC-SA 4.0"
  upstream-url: "<canonical URL to the item or item pool entry>"
```
The Story 1.9 `lint-license-provenance.mjs` script asserts this block is present and well-formed for every item file before merge.

### 3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0

**Scope:** every file under `src/content/methodology/en/**.md`. These are the project's original derivative explanations of IRT, EAP estimation, validity-envelope reasoning, etc.

**License:** Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0). Attribution: "IQ-ME maintainers, 2026". The NonCommercial constraint is honored in perpetuity by the project's structural posture: no entity, no revenue, no exit (see `README.md` § Anti-credentialization).

### 4. Translated content — CC-BY-NC-SA 4.0

**Scope:** every file under `src/content/methodology/ru/**.md`, `src/content/methodology/pl/**.md`, `src/content/i18n/ru/**.json`, `src/content/i18n/pl/**.json`, `src/content/glossary/{ru,pl}.json`, `src/content/trails/{ru,pl}.json`, `src/content/crisis-resources/{ru,pl}.json`.

**License:** Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0). Each translated content file carries a `sourceHashEN` field in its YAML frontmatter that pins which EN-source version the translation was reviewed against (NFR29 stale-translation hatnote enforcement).

**Attribution for translations:** the original author of the EN source (the IQ-ME maintainers) plus the per-locale reviewer-of-record named in `.github/CODEOWNERS`.

## Per-class CHANGELOG protocol

Any modification to this `LICENSES.md` file — including a license-class addition, an attribution-string change, or a per-item license upgrade — requires a corresponding `CHANGELOG.md` entry under the matching `[Unreleased] → Licenses` section. The Story 1.9 `lint-license-provenance.mjs` script asserts that any `LICENSES.md` diff in a PR is paired with a `CHANGELOG.md` edit in the same commit (NFR24 unmodified-between-releases-except-via-changelog invariant).

## ICAR license confirmation slot

The repository root carries `ICAR-CONFIRMATION.pdf` (Story 1.3) which is the written, signed confirmation from the ICAR / SAPA project that public free-self-assessment redistribution is permitted under CC BY-NC-SA. At v0.0.1 it is a "pending" stub; Gate 9a replaces it with the real signed confirmation. The replacement is itself a license-provenance-affecting change and follows the CHANGELOG protocol above.
