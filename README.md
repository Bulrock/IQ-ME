# IQ-ME

A public, no-signup, no-telemetry, source-on-GitHub matrix-reasoning self-assessment with no time limit. The full scoring engine (~250 LOC of pure JavaScript) ships unminified and unbundled — every shipped byte of math is auditable in the browser's "View Source." There are no accounts. No email. No login. No tracking pixels. No third-party requests. No remote APIs. The entire deployed artifact is byte-identical to the source tree in this repository: what you read here is what your browser runs.

The methodology corpus — about thirty short pages explaining what IRT is, what an EAP estimate is, where the validity envelope ends, and why a 16-item self-assessment cannot replace a clinical evaluation — lives at `/methodology/v<X>.<Y>.<Z>/<lang>/`. Every page is plain HTML rendered at author time from CommonMark source committed to this repo. The corpus is per-language reviewed-of-record (see `.github/CODEOWNERS`) and per-corpus-release citation-stable.

The full posture, including the trust artifacts (`LICENSES.md`, `CITATION.cff`, `ICAR-CONFIRMATION.pdf`, `CONTRIBUTING.md`), the deterministic build (`make build && hash dist/` is repeatable), and the negative-assertion lint suite (`make lint`), is verifiable in under five minutes by a skeptic clone-and-grep workflow.

## How to verify

```sh
git clone https://github.com/Bulrock/IQ-ME && cd IQ-ME
make help        # enumerate documented targets
make lint        # all trust + negative-assertion lints
make test        # strict Fallow gates + node --test (including IRT golden vectors)
make build       # author-time methodology corpus render → dist/
```

## License posture

App code is MIT. Item pool (under `src/items/`) is CC-BY-NC-SA 4.0 (or upstream-ICAR-author-specified). Methodology corpus and translated content are CC-BY-NC-SA 4.0. See [`LICENSES.md`](LICENSES.md) for the per-class enumeration and the attribution string convention.

## Forking ethics

This is a **request, not enforceable** under MIT. The MIT license permits stripping any caveats and shipping an ad-supported credential-flavored fork; we cannot prevent that. Still, the request stands.

If you fork IQ-ME, **we ask** that you preserve the methodology corpus and the caveats that constitute the project's anti-credentialiation posture (the validity envelope, the bottom-decile-care language, the top-decile-misuse warnings, the "this is not a clinical evaluation" framing, and the citation-stable per-corpus-release versioning). These caveats are load-bearing for the project's claim that a 16-item self-assessment can be ethical at all.

The structural defenses are (a) canonical-site discoverability, (b) DOI permanence per corpus release, and (c) community recommendation. If you do fork and modify, please change the project name so that comparisons against the canonical version remain meaningful, and please consider preserving at least the validity-envelope and bottom-decile-care pages — they are short, they are public domain in spirit (CC-BY-NC-SA in license), and they are what makes the project deserve any trust at all.

## Anti-credentialization

IQ-ME has no entity, no revenue, no exit. There is no product team, no growth roadmap, no premium tier. The point is not to grow; the point is to outlast the maintainer (NFR35) by being so small, so audit-friendly, and so license-clean that the methodology corpus can be re-hosted as a static archive after the maintainer is no longer active.

## Status

This repository is at **v0.0.1**. Most epics are still in implementation. Track progress in [`_bmad-output/implementation-artifacts/sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml). Pre-launch gates (ICAR license confirmation, external psychometrician sign-off, RU/PL clinical-register translators, native-speaker testing) are tracked as Epic 9{a..e}.

## Following updates

There is **no email list, no account capture, and no signup** (FR52). The two ways to follow IQ-ME are both GitHub-native and ask for no identifier beyond a GitHub account you already have:

- **Release notifications** — on the [repository](https://github.com/Bulrock/IQ-ME), choose **Watch → Custom → Releases** to be notified only when a new `app-v*` or `corpus-v*` release is tagged.
- **Discussions** — use the **Subscribe** button on any [GitHub Discussions thread](https://github.com/Bulrock/IQ-ME/discussions) to follow a conversation.

Updates reach you only through channels you already control — there is no mailing list and nothing to sign up for.

## Citation

Please cite per [`CITATION.cff`](CITATION.cff). At v0.0.1 the `doi` field is empty; it is populated by the Epic 8 `release.yml` workflow on the first per-corpus-release tag.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) — the full contribution guide, including the per-language reviewer-of-record discipline enforced via branch protection.
