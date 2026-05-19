---
id: 1-3-commit-icar-confirmation-pdf-slot-with-visible-fallback-copy
title: "Story 1.3: Commit ICAR-CONFIRMATION.pdf slot with visible-fallback copy"
status: review
---

# Story 1.3: Commit ICAR-CONFIRMATION.pdf slot with visible-fallback copy

## Story

As a **skeptic (Tomáš journey) verifying license-chain integrity**,
I want **the ICAR license confirmation artifact slot to exist in the repository root with a visible-fallback explanation rather than a silent null**,
so that **I know the gate's status at a glance and the affordance isn't broken-looking while Gate 9a's outreach runs**.

## Acceptance Criteria

1. **AC-1 (slot exists with pending body):** `ICAR-CONFIRMATION.pdf` at repo root resolves to a one-page PDF whose title is "ICAR License Confirmation — Pending" and whose body contains the prescribed pre-launch-gate explanatory copy.
2. **AC-2 (README link resolves):** README's license section links to `ICAR-CONFIRMATION.pdf` (relative path); the file exists; the future `lint-trust-artifacts.mjs` (Story 1.6 / 1.9) can assert the file exists regardless of pending-vs-real content.
3. **AC-3 (Epic-5 stub page exists and is bidirectional):** a temporary stub at `src/content/methodology/en/provenance/icar-license.md` exists during Epics 1-4 with body that points back to `ICAR-CONFIRMATION.pdf`. Epic 5 replaces this stub with the real methodology page.

## Tasks / Subtasks

- [x] **Task 1: Author the pending-stub ICAR-CONFIRMATION.pdf** (AC: 1)
- [x] **Task 2: Verify README link target exists** (AC: 2 — README link added in Story 1.2; this task only verifies)
- [x] **Task 3: Author the temporary methodology stub `src/content/methodology/en/provenance/icar-license.md`** (AC: 3)
- [x] **Task 4: Author and pass acceptance tests** verifying ACs 1-3

## Dev Notes

- PDF authored as a hand-rolled minimal PDF 1.4 (no compression, no fonts other than built-in Helvetica) — under 2 KB. Avoids dependency on `wkhtmltopdf`, LaTeX, or any other dev-tool the project has not yet vetted. This matches the project's "audit-first, dependency-last" posture.
- The methodology stub uses minimal frontmatter at this story (only `title:` + `pending: true`); the full Story 1.4 frontmatter contract (`sourceHashEN`, `lastReviewed`, etc.) lands when Epic 5 replaces the stub.

### References

- [epics.md §Story 1.3](../planning-artifacts/epics.md#L532)
- [prd.md §FR45 / NFR24](../planning-artifacts/prd.md#L859)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

- Hand-rolled 120 LOC PDF generator → ICAR-CONFIRMATION.pdf (1.058B); methodology stub at provenance/icar-license.md (bidirectional ref); 6/6 frozen tests pass, full suite 27/27.

### File List

- ICAR-CONFIRMATION.pdf
- tools/generate-icar-stub-pdf.mjs
- src/content/methodology/en/provenance/icar-license.md
- tests/scaffold/icar-slot.test.mjs

## Specialist Self-Review

**Decisions made:**
1. **Hand-rolled PDF generator (`tools/generate-icar-stub-pdf.mjs`, ~120 LOC)** rather than depending on a PDF library (pdfkit / puppeteer / wkhtmltopdf). Reasons: (a) NFR33 zero-runtime-dep posture extends in spirit to dev-time dependencies that ship binary artifacts; (b) the generator output is itself a load-bearing trust artifact that a skeptic should be able to reproduce; (c) the PDF is 1.058 bytes and human-readable in `vim` — auditable. Trade-off: no UTF-8 (em-dash etc.) without font embedding. Used ASCII hyphen in title; the test regex accepts both.
2. **Generator committed alongside the PDF**, not just the output. Lets the byte-stable build assertion (Story 1.8) reproduce the artifact deterministically if needed, and preserves the audit trail when Gate 9a replaces the PDF.
3. **Methodology stub frontmatter is intentionally minimal** (`title`, `pending: true`, `slug`). The full Story 1.4 schema requires `version`, `lastReviewed`, `reviewer`, `reviewerHandle`, `asserts[]`, `glossaryRefs[]`, `sourceHashEN`. Adding those at v0.0.1 would force Epic 5 to replace placeholder values for fields that don't apply to a "this page is pending" stub. The `pending: true` flag is a signal for the future `lint-frontmatter.mjs` to skip strict validation on this file class.

**Alternatives considered:**
- *Generate the PDF via `chromium-headless` print-to-PDF* — adds a 200 MB dependency to dev-time, output is non-byte-deterministic (timestamps, font subsetting), would fail the byte-stable build assertion. Rejected.
- *Use LaTeX (`pdflatex`)* — heavy dependency for a 1 KB output; output also non-deterministic without `--reproducible` flags. Rejected.
- *Skip the PDF, write a `.txt` "pending" file* — spec explicitly says one-page PDF. The skeptic affordance (the README link is to a PDF, the link target opens in a browser PDF viewer) requires it actually be a PDF.

**Framework gotchas avoided:**
- PDF literal strings escape `\`, `(`, `)` with backslash. The body text uses parenthesized URL `/methodology/v0.0.1/en/provenance/icar-license/` with NO parens, so escape handler not exercised — but the helper is there for future edits.
- `Buffer.byteLength(str, 'latin1')` for the `/Length` field in the content stream — multi-byte UTF-8 would mis-count if I used `utf8`. Used `latin1` (1 byte = 1 char) consistently.
- The PDF binary marker `%\xE2\xE3\xCF\xD3` after the header tells viewers the file may contain binary; without it some readers misinterpret as 7-bit ASCII. Included.

**Areas of uncertainty:**
- The methodology stub's relative-link `../../../../../ICAR-CONFIRMATION.pdf` (5 levels up from `src/content/methodology/en/provenance/icar-license.md`) is correct against the source-tree layout but the rendered HTML lives under `dist/methodology/v0.0.1/en/provenance/icar-license/`. The link will need to be re-anchored against `dist/` paths in Epic 4 when the renderer lands. Probably needs to become an absolute repo-root link (`/ICAR-CONFIRMATION.pdf`) or the renderer needs a relative-link rewriter. Flagged for Epic 4 design.
- The pending PDF has a placeholder body URL `/methodology/v0.0.1/en/provenance/icar-license/` — at v0.0.1 nothing serves that path. The hatnote-on-broken-link behavior is Epic-5 work; until then, clicking the URL from a PDF viewer 404s. Acceptable per AC-1 (only the *content* of the slot is asserted, not the resolvability of every link in it).
- Open question for Gate 9a closure: when the real signed PDF arrives, does the generator script stay committed (as historical reproducibility) or get deleted (no longer the source of truth)? Recommend keeping it with a `## Superseded` header comment.

**Tested edge cases:**
- Frozen 6/6 tests pass. Full suite 27/27 — no regression on previous stories.
- PDF size 1.058 bytes — under any reasonable "is this a real PDF" threshold but above the 200-byte sanity floor the test asserts.
- ASCII-only body text — the test regex uses `[—\-]` to accept em-dash OR hyphen, so the ASCII compromise doesn't break the title assertion.
