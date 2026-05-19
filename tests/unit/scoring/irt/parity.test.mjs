// Red-phase parity test for src/scoring/irt/.
//
// While stubs throw `TypeError: Not implemented`, this test fails with that
// throw propagating from inside scoreSession. Once Stories 2.2–2.5 land the
// real implementation, this test turns green. Story 2.6a then replaces the
// hand-fixture with an R-mirt-generated superset; the assertion shape is
// preserved.
//
// IMPORTANT: do NOT wrap calls in assert.throws — the throw IS the failure.
// See story spec §"Test file: avoid the assert.throws trap".

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { scoreSession } from "../../../../src/scoring/irt/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = resolve(__dirname, "../../../golden/vectors-smoke.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

test("parity vs hand-verified smoke vectors", async (t) => {
  for (let i = 0; i < fixture.length; i++) {
    const e = fixture[i];
    await t.test(`entry ${i}`, () => {
      const r = scoreSession({
        responses: e.responses,
        itemParameters: e.itemParameters,
        normingStats: { se_norming: 0 },
      });
      assert.ok(
        Math.abs(r.theta - e.expectedTheta) <= 0.001,
        `entry ${i}: theta drift (got ${r.theta}, expected ${e.expectedTheta})`,
      );
      assert.ok(
        Math.abs(r.sem - e.expectedSE) <= 0.001,
        `entry ${i}: SE drift (got ${r.sem}, expected ${e.expectedSE})`,
      );
    });
  }
});
