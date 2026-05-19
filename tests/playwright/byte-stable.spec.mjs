// tests/playwright/byte-stable.spec.mjs
//
// Stub — full byte-stable build assertion activates in Epic 4 (Story 4.2).
// At end-of-Epic-1, the structural infrastructure is in place via Story 1.8
// (tools/determinism-harness.mjs); the runtime Playwright assertion is
// deferred to Epic 4 when an actual dist/ build exists to check.

import { test } from "@playwright/test";
import { DETERMINISM } from "../../tools/determinism-harness.mjs";

test.fixme("byte-stable build — full assertion activates in Epic 4 (Story 4.2)", async () => {
  // When this lands in Epic 4, it will:
  //   1. Run `make clean && make build` twice.
  //   2. Compare hashTree(dist) outputs byte-by-byte using DETERMINISM.SOURCE_DATE_EPOCH.
  //   3. Optionally probe the GH Pages mirror artifact for byte-identicality (NFR17).
  // For now the test is fixme'd so the spec file parses without raising.
  void DETERMINISM;
});
