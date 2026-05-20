# Story {{epic_num}}.{{story_num}}: {{story_title}}

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a {{role}},
I want {{action}},
so that {{benefit}}.

## Acceptance Criteria

1. [Add acceptance criteria from epics/PRD]

## Tasks / Subtasks

- [ ] Task 1 (AC: #)
  - [ ] Subtask 1.1
- [ ] Task 2 (AC: #)
  - [ ] Subtask 2.1

## Dev Notes

- Relevant architecture patterns and constraints
- Source tree components to touch
- Testing standards summary

### Carry-forward lessons

<!--
Populate this section BEFORE engineer starts implementation. Run:
  tds memory query --story=<this-story-id> --top=5 --as=engineer
and inline each relevant hit as a bullet (id + one-line summary + actionable
takeaway for THIS story's touched surfaces). If the query returns zero hits,
keep the section with an explicit sentinel:
  _(no relevant lessons — `tds memory query` returned zero hits)_
Never omit the heading. See lesson-2026-05-20-007.
-->

_(populate via `tds memory query --story=<id>` at create-time; see comment above)_

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
