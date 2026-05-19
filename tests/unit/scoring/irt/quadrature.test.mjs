// Unit tests for src/scoring/irt/quadrature.js — pure math primitive.

import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  quadraturePoints,
  gridPoints,
} from "../../../../src/scoring/irt/quadrature.js";

test("quadraturePoints: returns 61 nodes + weights at default args", () => {
  const q = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  assert.equal(q.nodes.length, 61);
  assert.equal(q.weights.length, 61);
});

test("quadraturePoints: first/last node at theta_lim bounds", () => {
  const q = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  assert.equal(q.nodes[0], -6);
  assert.equal(q.nodes[60], 6);
});

test("quadraturePoints: weights sum to 1 (normalized discrete prior)", () => {
  const q = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  const sum = q.weights.reduce((s, w) => s + w, 0);
  assert.ok(
    Math.abs(sum - 1) < 1e-12,
    `weights sum ${sum} differs from 1 by > 1e-12`,
  );
});

test("quadraturePoints: weights symmetric about 0 for symmetric theta_lim", () => {
  const q = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  for (let i = 0; i < 30; i++) {
    const mirror = 60 - i;
    assert.ok(
      Math.abs(q.weights[i] - q.weights[mirror]) < 1e-15,
      `weights[${i}] != weights[${mirror}]: ${q.weights[i]} vs ${q.weights[mirror]}`,
    );
  }
});

test("quadraturePoints: deterministic — repeated calls byte-identical", () => {
  const a = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  const b = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  assert.deepEqual(a, b);
});

test("quadraturePoints: throws RangeError on quadpts <= 0", () => {
  assert.throws(
    () => quadraturePoints({ quadpts: 0, theta_lim: [-6, 6] }),
    RangeError,
  );
  assert.throws(
    () => quadraturePoints({ quadpts: -1, theta_lim: [-6, 6] }),
    RangeError,
  );
});

test("quadraturePoints: throws RangeError on non-integer quadpts", () => {
  assert.throws(
    () => quadraturePoints({ quadpts: 61.5, theta_lim: [-6, 6] }),
    RangeError,
  );
});

test("quadraturePoints: throws RangeError on inverted theta_lim", () => {
  assert.throws(
    () => quadraturePoints({ quadpts: 61, theta_lim: [6, -6] }),
    RangeError,
  );
  assert.throws(
    () => quadraturePoints({ quadpts: 61, theta_lim: [0, 0] }),
    RangeError,
  );
});

test("gridPoints: positional shim forwards to quadraturePoints", () => {
  const positional = gridPoints(61, [-6, 6]);
  const objectArg = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  assert.deepEqual(positional, objectArg);
});

test("gridPoints: defaults to (61, [-6, 6])", () => {
  const defaulted = gridPoints();
  const explicit = quadraturePoints({ quadpts: 61, theta_lim: [-6, 6] });
  assert.deepEqual(defaulted, explicit);
});
