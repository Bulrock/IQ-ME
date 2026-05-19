// Full-set parity test for src/scoring/irt/.
// Story 2-6b: iterates all entries in tests/golden/vectors.json and asserts
// JS engine output matches the committed expectedTheta + expectedSE within
// ±0.001 logits per NFR22.
//
// Lands GREEN on first run since vectors.json is JS-engine-derived (Story 2.6b
// generator script). PR-check guards against engine regressions.
// R-mirt third-party validation runs via golden-regen.yml --mode=full.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { scoreSession } from "../../../../src/scoring/irt/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = resolve(__dirname, "../../../golden/vectors.json");

test("parity vs full golden-vector set (n≥1000)", async (t) => {
  assert.ok(
    existsSync(fixturePath),
    `tests/golden/vectors.json not found — run \`node tools/generate-full-vectors.mjs > tests/golden/vectors.json\``,
  );

  const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
  assert.ok(
    fixture.length >= 1000,
    `expected ≥1000 entries (got ${fixture.length})`,
  );

  const t0 = performance.now();
  let maxThetaDrift = 0;
  let maxSeDrift = 0;

  for (let i = 0; i < fixture.length; i++) {
    const e = fixture[i];
    const r = scoreSession({
      responses: e.responses,
      itemParameters: e.itemParameters,
      normingStats: { se_norming: 0 },
    });
    const tDrift = Math.abs(r.theta - e.expectedTheta);
    const sDrift = Math.abs(r.sem - e.expectedSE);
    if (tDrift > maxThetaDrift) maxThetaDrift = tDrift;
    if (sDrift > maxSeDrift) maxSeDrift = sDrift;
    if (tDrift > 0.001 || sDrift > 0.001) {
      await t.test(`entry ${i}: parity drift`, () => {
        assert.ok(
          tDrift <= 0.001,
          `entry ${i}: theta drift ${tDrift} > 0.001 (got ${r.theta}, expected ${e.expectedTheta})`,
        );
        assert.ok(
          sDrift <= 0.001,
          `entry ${i}: SE drift ${sDrift} > 0.001 (got ${r.sem}, expected ${e.expectedSE})`,
        );
      });
    }
  }

  const elapsed = performance.now() - t0;
  t.diagnostic(
    `parity-full: ${fixture.length} entries; max θ drift ${maxThetaDrift.toFixed(6)}; max SE drift ${maxSeDrift.toFixed(6)}; ${elapsed.toFixed(0)}ms`,
  );

  assert.ok(
    maxThetaDrift <= 0.001,
    `max θ drift ${maxThetaDrift} > 0.001`,
  );
  assert.ok(
    maxSeDrift <= 0.001,
    `max SE drift ${maxSeDrift} > 0.001`,
  );
  assert.ok(
    elapsed < 5000,
    `parity-full runtime ${elapsed}ms exceeds 5s budget per NFR26`,
  );
});
