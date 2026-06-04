# Software Heritage archive record (launch-readiness)

> **STATUS: PENDING — no archives captured yet.** This is a launch-readiness
> record file. Real save-request URLs are captured at launch (Epic 10) by the
> first `corpus-v*` release. **No URLs are fabricated here.**

This file is the record of where each tagged corpus release is archived on
[Software Heritage](https://archive.softwareheritage.org/) via the **save**
endpoint
(`https://archive.softwareheritage.org/api/1/origin/save/git/url/<repo-url>`).
The `corpus-release` job in `.github/workflows/release.yml` appends the
resulting save-request / archived-origin URLs below, one block per release.

## How it works

- **Cadence:** one save request per `corpus-v*` release tag (after the
  methodology corpus is deployed).
- **Scope:** the repository origin (`origin/save/git/url/<repo-url>`) — Software
  Heritage crawls and archives the full source tree.
- **Best-effort:** the save step is non-fatal (`continue-on-error: true`) — a
  failed save does **not** fail the release. On failure the workflow opens a
  GitHub Issue labeled `archival-health` (replacing Slack/PagerDuty per
  NFR8/NFR35); the Story 8.3 scheduled health-check later re-probes these URLs.

## Save-request log

_PENDING — populated at the first `corpus-v*` release (launch / Epic 10)._

| Corpus version | Save-request URL | Requested (UTC) |
| -------------- | ---------------- | --------------- |
| _pending_      | _pending_        | _pending_       |
