# README template

> Diátaxis: primarily Tutorial (quickstart) + Reference (links to other docs).
> Audience: developer onboarding (Persona 1) + existing developer (Persona 2).
> Length: 300-800 words. NOT comprehensive doc — links to other quadrants.

---

```markdown
# Project Name

Brief one-line description (≤120 chars). Says **what it is** + **what problem it solves**.

[![Build Status](badge-url)](ci-url) [![Coverage](badge-url)](coverage-url) [![License](badge-url)](license-url)

## Quickstart

What to install / how to clone / how to run. ≤30 minutes target.

```bash
# Clone
git clone https://github.com/<owner>/<repo>.git
cd <repo>

# Install dependencies
pnpm install   # or npm install / poetry install / etc.

# Run
pnpm dev       # or appropriate command
```

You should see <expected output / URL>. If это не работает — see [Troubleshooting](docs/how-to/troubleshooting.md).

## What this project does

1-3 paragraphs:
- Problem space (what need does this serve).
- Approach (high-level — not implementation).
- Key features в bullet form (3-7 items, parallel structure).

## Documentation

| Reading | Where |
|---------|-------|
| **Tutorials** (learning) | [docs/tutorials/](docs/tutorials/) |
| **How-to guides** (problem-solving) | [docs/how-to/](docs/how-to/) |
| **Reference** (API / CLI / config) | [docs/reference/](docs/reference/) |
| **Explanation** (architecture / decisions) | [docs/adr/](docs/adr/) |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) для setup, conventions, и PR process.

Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) (or applicable).

## Acknowledgments

(Optional — credits, inspirations, dependencies highlight.)
```

---

## Notes for writer

- **NO marketing speak в hero/description.** «State-of-the-art» / «cutting-edge» / «blazing-fast» — drop.
- **Quickstart должен работать.** Test commands manually before publishing.
- **Don't list every feature** в README — that's reference. README hits highlights, links to depth.
- **Update CHANGELOG separately** — link в README, but don't dump release-notes content в README.
- **Badge etiquette** — only badges that update automatically (CI status, coverage, version). NOT decorative badges.

## Common variations

- **Library README:** add «Installation» section (npm install / pip install / cargo add).
- **CLI tool README:** add «Usage» section с canonical examples.
- **Web app README:** add «Live demo» link if applicable.
- **OSS project:** add «Roadmap» pointer и «Sponsors» if applicable.
