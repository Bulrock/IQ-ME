# Internet Archive snapshot record (launch-readiness)

> **STATUS: PENDING — no snapshots captured yet.** This is a launch-readiness
> record file. Real snapshot URLs are captured at launch (Epic 10) by the first
> `corpus-v*` release. **No snapshot URLs are fabricated here.**

This file is the record of where each tagged corpus release is snapshotted on the
[Internet Archive](https://web.archive.org/) via the **Save Page Now** endpoint
(`https://web.archive.org/save/<url>`). The `corpus-release` job in
`.github/workflows/release.yml` appends the resulting `web.archive.org/web/...`
snapshot URLs below, one block per release.

## How it works

- **Cadence:** one snapshot per `corpus-v*` release tag (after the methodology
  corpus is deployed — a page must be live before it can be snapshotted).
- **Scope:** the corpus root plus key pages (the FR36-protected page, the
  citation page, the reference pages).
- **Best-effort:** the snapshot step is non-fatal (`continue-on-error: true`) —
  a failed snapshot does **not** fail the release. On failure the workflow opens
  a GitHub Issue labeled `archival-health` (replacing Slack/PagerDuty per
  NFR8/NFR35); the Story 8.3 scheduled health-check later re-probes these URLs.

## Snapshot log

_PENDING — populated at the first `corpus-v*` release (launch / Epic 10)._

| Corpus version | Page | Snapshot URL | Captured (UTC) |
| -------------- | ---- | ------------ | -------------- |
| _pending_      | —    | _pending_    | _pending_      |
