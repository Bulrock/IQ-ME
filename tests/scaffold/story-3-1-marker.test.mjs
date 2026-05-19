// tests/scaffold/story-3-1-marker.test.mjs
//
// Story 3.1 marker — procedural placeholder.
//
// Story 3.1 is documentation-only (4 contract artifacts: 1 JSON Schema + 3 ADRs)
// per AC-6: "No code, no tests in this story. tests/contract/state-shape.spec.mjs
// is Story 3.2's deliverable, not 3.1's." This file exists ONLY to satisfy the
// TDS state-machine defense-in-depth gate which requires test-author integrity
// records before tests-drafting → tests-approved. It uses `test.todo` so it is
// reported as todo (not pass/fail) and does not change the test-count baseline.
//
// Story 3.2 will materialize the real contract test at
// tests/contract/state-shape.spec.mjs and may delete this marker.

import { test } from "node:test";

test.todo("story-3-1 contract artifacts authored — see Story 3.2 for state-shape contract test");
