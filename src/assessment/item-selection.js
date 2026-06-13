// src/assessment/item-selection.js
//
// FR7 subset + ordering: given a pool, a 128-bit seed, and a session size,
// produce a deterministic permutation of item ids and a deterministic
// augmentation code per position. Pure module (Story 3-4 AC-2 / AC-10.3).
//
// v1 stub-pool case (pool.length === sessionSize === 16): the "subset" step
// collapses to "all items" — we permute the entire pool. Story 9a-2 will
// expand the pool above sessionSize; at that point the function will do a
// uniform-random subset selection first, then permute. Architecture line
// 812-813 documents the two-phase contract.

import { createPrng } from "./item-prng.js";

const AUGMENTATION_CODES = ["none", "rot90", "rot180", "rot270", "flip-h", "flip-v"];

export function selectSession(pool, seed128, sessionSize) {
  const prng = createPrng(seed128);

  // Step 1: build the index array [0..pool.length-1].
  const indices = [];
  for (let i = 0; i < pool.length; i++) indices.push(i);

  let selectedIndices;
  if (pool.length === sessionSize) {
    // v1 / equal-size case (every shipped variant today): permute the whole
    // pool. Fisher-Yates shuffle, backward iteration (impl note 5 — reverse-
    // order shuffle pinned by spec for reproducibility regression protection).
    // This path is byte-identical to the original implementation; the frozen
    // FR7 / golden tests pin it.
    for (let i = indices.length - 1; i > 0; i--) {
      const j = prng.next() % (i + 1);
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    selectedIndices = indices.slice(0, sessionSize);
  } else {
    // pool.length > sessionSize: uniform-random SUBSET first, THEN permute
    // (architecture lines 812-813). A partial Fisher-Yates over the leading
    // sessionSize slots both selects a uniform subset AND orders it in one
    // forward pass: for each target slot i, swap in a uniformly-chosen element
    // from the remaining unused indices [i..n-1]. The subset and its order are
    // determined before the augmentation draws, so augmentations draw from the
    // intended PRNG position regardless of pool size.
    const k = Math.min(sessionSize, pool.length);
    for (let i = 0; i < k; i++) {
      const j = i + (prng.next() % (pool.length - i));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    selectedIndices = indices.slice(0, sessionSize);
  }
  const items = selectedIndices.map((idx) => pool[idx].id);

  // Step 4: augmentations — draw sessionSize codes from the 6-element set
  // AFTER the shuffle. Order matters: shuffle exhausts N draws, then
  // augmentations exhaust sessionSize more (architecture line 813).
  const augmentations = [];
  for (let i = 0; i < sessionSize; i++) {
    augmentations.push(AUGMENTATION_CODES[prng.next() % AUGMENTATION_CODES.length]);
  }

  return { items, augmentations };
}
