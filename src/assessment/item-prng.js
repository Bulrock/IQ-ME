// src/assessment/item-prng.js
//
// xoshiro128++ deterministic PRNG seeded from a 128-bit byte sequence.
// Inline copy per Vigna's reference: https://prng.di.unimi.it/xoshiro128plusplus.c
// Architecture line 813: "a small inline xoshiro128 in src/assessment/ — written
// twice if needed per inline-copy rule". Story 3-4 writes it once; downstream
// stories copy rather than import across cohort boundaries.
//
// Pure module: no side effects on import, no module-level mutable singletons.
// Multiple createPrng() calls with the same seed produce byte-identical
// sequences (FR7 reproducibility, Story 3-4 AC-1 / AC-10.2).

function rotl(x, k) {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

function readUint32LE(bytes, offset) {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

export function createPrng(seed128) {
  // State: four Uint32 words, little-endian reads from the 16-byte seed.
  // Vigna's caveat: state must not be all-zero. crypto.getRandomValues makes
  // that effectively impossible; deterministic test seeds (e.g. 0x42-fill)
  // satisfy the constraint trivially.
  const s = new Uint32Array(4);
  s[0] = readUint32LE(seed128, 0);
  s[1] = readUint32LE(seed128, 4);
  s[2] = readUint32LE(seed128, 8);
  s[3] = readUint32LE(seed128, 12);

  return {
    next() {
      const result = (rotl((s[0] + s[3]) >>> 0, 7) + s[0]) >>> 0;
      const t = (s[1] << 9) >>> 0;
      s[2] = (s[2] ^ s[0]) >>> 0;
      s[3] = (s[3] ^ s[1]) >>> 0;
      s[1] = (s[1] ^ s[2]) >>> 0;
      s[0] = (s[0] ^ s[3]) >>> 0;
      s[2] = (s[2] ^ t) >>> 0;
      s[3] = rotl(s[3], 11);
      return result;
    },
  };
}
