# Scheduled-check failure routing

This document explains how the weekly `scheduled.yml` workflow watches for silent drift and how the maintainer responds when something breaks. It is written for a solo project with no email or Slack integrations (NFR6): the only "alert" is a labeled GitHub Issue that the maintainer reads during a weekly triage pass.

## What runs, and when

The `.github/workflows/scheduled.yml` workflow runs **weekly**, every Monday at 06:00 UTC, via a cron schedule. It does not run on every push — it is a slow background watchdog, not a per-change gate.

It runs three independent health checks:

| Job | What it checks | Issue label |
| --- | -------------- | ----------- |
| `internet-archive-snapshot-health` | The recorded Internet Archive snapshot URLs (`web.archive.org`) still return HTTP 200 | `area:archive-health` |
| `software-heritage-snapshot-health` | The recorded Software Heritage archive URLs (`archive.softwareheritage.org`) still return HTTP 200 | `area:archive-health` |
| `zenodo-doi-resolution` | The DOI recorded in `CITATION.cff` still resolves to a real Zenodo record (`doi.org` / `api.zenodo.org`) | `area:doi-health` |

The recorded URLs are read at run time from the launch-readiness record files (`docs/launch-readiness/internet-archive-snapshots.md`, `docs/launch-readiness/software-heritage-snapshots.md`) and from `CITATION.cff`. The workflow never embeds fabricated URLs — until the first `corpus-v*` release populates those files, the probes have nothing to check and quietly no-op.

## The labels

Every routed Issue carries the always-on label **`area:scheduled-check`** plus exactly one per-check label that says which watchdog tripped:

- `area:archive-health` — either archival snapshot check. Internet Archive and Software Heritage **share** this label because they are the same drift surface ("archive health"); the Issue title names which one. This keeps the label aligned with the `archival-health` surface that `release.yml` already uses at archival time.
- `area:doi-health` — the Zenodo DOI resolution check.

So `area:scheduled-check` lets the maintainer find every watchdog Issue at a glance, and the per-check label sorts them by kind.

## The triage discipline

The maintainer **triages these Issues weekly** — there is **no email and no Slack notification**, and no third-party paging service (NFR8 — zero IP-based logging; NFR35 — no host-account-binding runtime dependency). The labeled GitHub Issue *is* the dashboard. This is a deliberate "outlast the maintainer" choice: drift is recorded in the open for posterity rather than silently auto-fixed or pushed to a SaaS inbox that may not outlive the project.

To avoid noise, the failure routing **dedups**: before opening a new Issue, the handler looks up an already-open Issue with the same label set. If one exists, it **appends a comment** (with the new run link) instead of opening a duplicate — so a check that stays broken for several weeks produces one Issue with a comment trail, not a pile of identical Issues. Each Issue body carries the failure context, the broken URL(s), and a direct link to the GitHub Actions run.

## Per-check mitigation playbooks

When you triage one of these Issues, here is the first move for each kind:

- **`area:archive-health` — Internet Archive (snapshot 404).** A recorded `web.archive.org` snapshot stopped resolving. **Re-snapshot** the affected page via the Internet Archive Save Page Now endpoint and record the new URL.
- **`area:archive-health` — Software Heritage (archive missing).** A recorded `archive.softwareheritage.org` URL stopped resolving. **Re-save** the repository origin via the Software Heritage save endpoint and record the new save-request URL.
- **`area:doi-health` (DOI not resolving).** The DOI from `CITATION.cff` did not resolve. **Check the Zenodo record** — confirm the DOI is correct and the record is published; correct the `doi:` field at the next release if it drifted.

## Where the full contributor cross-link lives

The contributor-facing cross-link from `CONTRIBUTING.md` to this document — institutionalizing the weekly-triage discipline in the contribution flow — is finalized in Story 8.6, when `CONTRIBUTING.md` is rewritten. This document is the canonical description of the routing in the meantime.
