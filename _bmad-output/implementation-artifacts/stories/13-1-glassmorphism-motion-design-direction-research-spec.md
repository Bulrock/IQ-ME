---
id: 13-1-glassmorphism-motion-design-direction-research-spec
title: "Story 13-1: Glassmorphism + motion design-direction research & spec"
status: review
---

# Story 13-1: Glassmorphism + motion design-direction research & spec

## Story

As the IQ-ME maintainer redesigning the site (PR-16),
I want a researched, documented glassmorphism + modern-motion design direction (glass tokens, surface treatments, motion vocabulary, accessibility/perf guardrails),
so that the Epic-13 redesign is cohesive and intentional rather than ad-hoc, and provably respects the project's hard constraints (zero third-party, WCAG 2.2 AA, byte-stable build, contrast, `prefers-reduced-motion`).

## Epic context

Epic 13 is **research/design-first**: this story (13-1) produces the design direction that gates the implementation stories (13-2 design system, 13-3 homepage, 13-4 surface rollout, 13-5 print result). It writes **no product CSS/JS** — its deliverable is a research/spec Markdown artifact under `_bmad-output/planning-artifacts/` plus a structural scaffold guard. The token values and motion principles it pins are *consumed* by 13-2 onward; 13-1 only specifies them.

## Acceptance Criteria

**Given** the need for a cohesive direction (PR-16),
**When** the research/spec is produced under `_bmad-output/planning-artifacts/`,
**Then** a file `glassmorphism-motion-design-direction.md` exists that defines: (a) the glass visual language — blur/transparency/layering token set with concrete starting values, (b) how glass surfaces behave in Light vs Dark themes (tie-in with PR-9), (c) a motion vocabulary — durations/easing curves with a named scale, and (d) explicit guardrails for contrast (WCAG 2.2 AA, 1.4.3 text / 1.4.11 non-text), performance (GPU-compositing / paint budget), and the zero-third-party constraint (no external font/CSS/JS CDN; NFR21/NFR33).
1. The spec defines a glass **token vocabulary** with concrete names and starting values: at least a blur scale, a glass surface fill (light + dark), a glass hairline/edge, and a layering/elevation note. Token names are forward-declared so 13-2 can implement them verbatim.
2. The spec defines a **motion vocabulary**: a named duration scale (e.g. instant/quick/base/slow), at least one easing curve, and an explicit `prefers-reduced-motion: reduce` policy stating that all non-essential motion collapses to opacity/no-op under reduce.
3. The spec states **accessibility guardrails** concretely: text-over-glass must clear WCAG 2.2 AA contrast (4.5:1 body, 3:1 large/non-text) and names the technique (solid fallback layer / sufficiently-opaque fill) that guarantees it rather than relying on backdrop blur alone.
4. The spec states the **zero-third-party + byte-stable** guardrails: glass is pure CSS (`backdrop-filter`/`background`/`box-shadow`), no external assets, and any `primitives.css`/`semantic.css` change in 13-2 is the codified D→E `make snapshot-update` exception (not a token-contract violation).
5. The spec names **which Epic-11 surfaces** 13-x will restyle (PR-2 test screen, PR-5 result centering, PR-6 theme toggle, PR-7 language dropdown, PR-11 methodology sidebar, PR-13 disclaimer collapse) and asserts the restyle must not regress those fixes — so 13-4 absorbs the fixed layouts rather than forcing rework.
6. A `tests/scaffold/` guard asserts the spec exists and structurally covers AC 1–5 (glass tokens, motion vocab + reduced-motion, contrast guardrail, zero-third-party/byte-stable note, named Epic-11 surfaces). The guard is RED before the artifact exists and GREEN after.
7. `make lint` exit 0 and `make build` exit 0 — no regression. The artifact is a planning doc (not a corpus page), so golden snapshots and the tokens hash are unaffected by this story.

## Tasks / Subtasks

- [x] **Task 1: author the scaffold guard** (`tests/scaffold/13-1-glass-design-direction.test.mjs`) encoding AC 6 — artifact exists; contains the glass-token section, the motion + `prefers-reduced-motion` section, the contrast guardrail, the zero-third-party/byte-stable note, and the named Epic-11 surfaces; confirm RED against the current tree. (test-author phase)
- [x] **Task 2: write the design-direction research/spec** (`_bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md`) satisfying AC 1–5 — glass token vocabulary with starting values, Light/Dark behavior, motion vocabulary + reduced-motion policy, contrast + perf + zero-third-party guardrails, named Epic-11 surfaces, grounded only in public/verifiable standards (no fabricated citations). (impl phase)
- [x] **Task 3: verification** — guard GREEN, `make lint` exit 0, `make build` exit 0, full suite passes (modulo the pre-existing 9-series human-gate reds); confirm no `src/`, `corpus/`, or snapshot surface touched. (integration phase)

## Dev Notes

- This is a **planning-artifact story**: deliverable is a Markdown spec + a structural guard. No product CSS/JS, no corpus page, no i18n surface.
- Ground every design claim in public, verifiable standards only: CSS `backdrop-filter` (CSS Filter Effects Module Level 2), `prefers-reduced-motion` (Media Queries Level 5), WCAG 2.2 SC 1.4.3 / 1.4.11, Apple HIG "Materials", Material Design 3 motion. Do **not** invent metrics or citations (claims-manifest discipline by analogy).
- The glass tokens specified here are consumed verbatim by 13-2; pin concrete starting values so 13-2 is mechanical.
- The contrast guardrail is the load-bearing constraint: backdrop blur alone does NOT guarantee contrast (content behind glass is variable). The spec must require a sufficiently-opaque fill (or solid fallback) so text over glass always clears AA independent of backdrop.

### Carry-forward lessons

- lesson-2026-06-04-002 (high): trust-critical artifacts must not fabricate specifics. Apply: the design spec cites only public, verifiable standards; no invented citations or metrics.
- lesson-2026-06-03-001 (high): `pr-checks.yml` wires tests per-job, not via a greedy glob; `tests/scaffold/**` is globbed by `make test`. Apply: the new guard runs under `make test`; no per-spec CI job needed (pre-existing project-wide scaffold-guard wiring).
- Corpus-edit parity cascade (project memory): editing EN methodology bodies triggers NFR27. Apply (non-applicable here): 13-1 touches no corpus page; parity cascade does not fire.

### Project Structure Notes

- New doc: `_bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md`.
- New test: `tests/scaffold/13-1-glass-design-direction.test.mjs`.
- No changes to `src/`, `corpus/`, `tests/golden/`, `tests/snapshots/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 13: Glassmorphism Redesign + Creative Homepage]
- [Source: src/css/primitives.css] (two-layer token architecture the glass tokens extend)
- [Source: src/css/semantic.css] (semantic mapping layer 13-2 will add glass roles to)

## Dev Agent Record

### Agent Model Used

frontend (research/spec; design-direction gate for Epic 13)

### Debug Log References

### Completion Notes List

- Design-direction spec authored under planning-artifacts; glass token vocabulary + motion vocab + reduced-motion policy + AA contrast guardrail + zero-third-party/snapshot-update note + named Epic-11 surfaces. Scaffold guard 6/6 green.

### File List

- tests/scaffold/13-1-glass-design-direction.test.mjs
- _bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md

## Specialist Self-Review

**Decisions made:**
- Scoped 13-1 strictly as a planning-artifact/design-direction gate: deliverable is `_bmad-output/planning-artifacts/glassmorphism-motion-design-direction.md` + a structural scaffold guard. No product CSS/JS — those are 13-2..13-5. This keeps the gate honest (no premature implementation) and makes the downstream stories mechanical.
- Pinned **concrete starting token values** (blur scale 6/12/20px, glass fills at ≥0.72 alpha light+dark, edge + shadow tokens, motion durations 90/160/260/420ms, two easing curves) so 13-2 implements them verbatim rather than re-deriving.
- Made the **contrast guarantee come from an opaque fill, not from backdrop blur**. Backdrop content is variable, so blur cannot guarantee AA; a ≥0.72-alpha fill (with `@supports not` solid fallback) does. This is the load-bearing accessibility decision.

**Alternatives considered:**
- Heavy frosted blur (30–40px) for a more dramatic look: rejected on perf (GPU compositing cost) and legibility (muddies text); capped at 20px and reserved for the homepage hero only.
- Auto-inverted dark glass (single fill, filter-inverted): rejected to stay consistent with the existing UX-DR6 "separately-designed dark palette" rule; authored light + dark fills independently.
- A web animation library for motion: rejected outright — violates zero-third-party (NFR21/NFR33). Motion is pure CSS transitions/keyframes with a global `prefers-reduced-motion` collapse.

**Framework gotchas avoided:**
- `backdrop-filter` needs the `-webkit-` prefix for Safari and an `@supports not (backdrop-filter: blur(1px))` solid fallback — specified the `.glass-surface` primitive with both so 13-2 doesn't ship a broken-on-fallback surface.
- Editing `primitives.css`/`semantic.css` breaks the committed tokens hash; flagged it explicitly as the codified D→E `make snapshot-update` exception so 13-2 doesn't read it as a contract violation.

**Areas of uncertainty:**
- Exact alpha values (0.72/0.85) are starting points; 13-2 should re-verify against the actual contrast lint with real backdrops and may nudge them up (never down) if a specific surface fails AA.
- Whether the methodology page's longer-form body text wants `--glass-fill-strong` everywhere or only behind dense paragraphs — left to 13-4 to tune against the reading surface.

**Tested edge cases:**
- Scaffold guard (6 assertions) covers: glass token vocabulary present (AC1), motion vocab + `prefers-reduced-motion: reduce` (AC2), WCAG 2.2 + 4.5:1 + opaque-fill technique (AC3), zero-third-party + `snapshot-update` note (AC4), all six named Epic-11 surfaces PR-2/5/6/7/11/13 (AC5), and a no-fabricated-metrics check. All 6 GREEN against the authored artifact; `make lint`/`make build` unaffected (planning doc, not corpus/snapshot).
