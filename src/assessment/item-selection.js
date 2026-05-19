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

  // Step 1: build the index array [0..pool.length-1]. For v1 stub-pool
  // (pool.length === sessionSize) the slice/subset step is identity; when
  // pool.length > sessionSize lands in Story 9a-2, this is where the
  // uniform-random subset selection inserts (drawing sessionSize indices).
  const indices = [];
  for (let i = 0; i < pool.length; i++) indices.push(i);

  // Step 2: Fisher-Yates shuffle, backward iteration (impl note 5 —
  // reverse-order shuffle pinned by spec for reproducibility regression
  // protection if any reviewer or other story re-derives the permutation).
  for (let i = indices.length - 1; i > 0; i--) {
    const j = prng.next() % (i + 1);
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }

  // Step 3: slice to sessionSize (no-op for v1; load-bearing for Story 9a-2).
  const selectedIndices = indices.slice(0, sessionSize);
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
