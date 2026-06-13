// src/assessment/state.js
//
// Single in-memory session state module for the IQ-ME Assessment SPA.
// Contract-validated against ./state.schema.json (Story 3.1).
//
// `startedAt` lazy initialization: at module load we set startedAt=0 so the
// schema validates from the first read (minimum is 0). The first mutator call
// then bumps it to Date.now(). This avoids pinning a fake timestamp at load
// time while still keeping the initial state schema-valid. `Date.now()` here
// is the *serialization* timestamp per Story 3.1 ADR; the `t:` field in the
// iqme:reveal-stage event payload uses performance.now() — these are distinct
// time sources by ADR.

const HEX_32 = /^[0-9a-f]{32}$/;
const LOCALES = ["en", "ru", "pl"];
const INITIAL_SEED = "0".repeat(32);
const SCHEMA_VERSION = "v2";
const METHODOLOGIES = ["geometric", "letter-number"];
const VARIANTS = ["short", "full"];

let state = freshState();

function freshState() {
  // Story 12-2: v2 adds an explicit `version` tag. `methodology`/`variant` are
  // OPTIONAL — they are set once the user passes the selection scene; a bare
  // reset state omits them entirely (still schema-valid).
  return {
    version: SCHEMA_VERSION,
    currentItem: 0,
    responses: [],
    startedAt: 0,
    locale: "en",
    seed: INITIAL_SEED,
  };
}

function touchStartedAt() {
  if (state.startedAt === 0) {
    state.startedAt = Date.now();
  }
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return Object.freeze(value);
}

export function getState() {
  const snapshot = {
    version: state.version,
    currentItem: state.currentItem,
    responses: state.responses.map(r => ({ itemIndex: r.itemIndex, response: r.response })),
    startedAt: state.startedAt,
    locale: state.locale,
    seed: state.seed,
  };
  // methodology/variant are optional — include only when the user has chosen
  // them (so a bare reset state stays minimal + schema-valid).
  if (state.methodology !== undefined) snapshot.methodology = state.methodology;
  if (state.variant !== undefined) snapshot.variant = state.variant;
  return deepFreeze(snapshot);
}

export function resetState() {
  state = freshState();
}

export function setSeed(seed) {
  if (typeof seed !== "string" || !HEX_32.test(seed)) {
    throw new TypeError("setSeed: seed must be a 32-char lowercase hex string");
  }
  touchStartedAt();
  state.seed = seed;
}

export function setLocale(locale) {
  if (!LOCALES.includes(locale)) {
    throw new RangeError(`setLocale: locale must be one of ${JSON.stringify(LOCALES)}`);
  }
  touchStartedAt();
  state.locale = locale;
}

export function setMethodology(methodology) {
  if (!METHODOLOGIES.includes(methodology)) {
    throw new RangeError(`setMethodology: methodology must be one of ${JSON.stringify(METHODOLOGIES)}`);
  }
  // Story 12-2: deliberately does NOT touchStartedAt — the selection scene is
  // pre-test, and bumping startedAt would lock the locale switcher (which gates
  // on startedAt > 0). The session clock starts only at the first item mutator.
  state.methodology = methodology;
}

export function setVariant(variant) {
  if (!VARIANTS.includes(variant)) {
    throw new RangeError(`setVariant: variant must be one of ${JSON.stringify(VARIANTS)}`);
  }
  state.variant = variant;
}

export function setItem(itemIndex) {
  if (typeof itemIndex !== "number" || !Number.isInteger(itemIndex)) {
    throw new TypeError("setItem: itemIndex must be an integer");
  }
  if (itemIndex < 0) {
    throw new RangeError("setItem: itemIndex must be >= 0");
  }
  touchStartedAt();
  state.currentItem = itemIndex;
}

export function recordResponse(itemIndex, response) {
  if (typeof itemIndex !== "number" || !Number.isInteger(itemIndex)) {
    throw new TypeError("recordResponse: itemIndex must be an integer");
  }
  if (itemIndex < 0) {
    throw new RangeError("recordResponse: itemIndex must be >= 0");
  }
  if (response !== 0 && response !== 1) {
    throw new RangeError("recordResponse: response must be 0 or 1");
  }
  touchStartedAt();
  const existing = state.responses.findIndex(r => r.itemIndex === itemIndex);
  if (existing >= 0) {
    state.responses[existing] = { itemIndex, response };
  } else {
    state.responses.push({ itemIndex, response });
  }
}
