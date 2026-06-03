// src/assessment/i18n/locale-loader.js
//
// Story 3.3 AC-6 — single-eager-bundle i18n loader. Fetches
// /src/content/i18n/<locale>/strings.json, caches it in a module-level Map,
// falls back to EN once on non-EN failure, resolves to {} on EN failure.
// `get(key)` walks the current-locale namespace, falls back to EN cache, and
// finally returns the bare key literal (architecture line 836-837 — the
// "highly visible failure" pattern).

const cache = new Map();
let currentLocale = null;

// Story 7.1 AC-1 — canonical supported-locale list (Architecture gap #2).
export const SUPPORTED = ["en", "ru", "pl"];

// Story 7.1 AC-1 — pure locale normalizer: lowercase + primary subtag +
// SUPPORTED guard, falling back to "en" for anything unsupported. No I/O.
export function normalizeLocale(code) {
  if (!code) return "en";
  const primary = String(code).toLowerCase().split("-")[0];
  return SUPPORTED.includes(primary) ? primary : "en";
}

// Story 7.1 AC-2 — pure boot-locale resolver. Precedence:
// stored (if SUPPORTED) > normalizeLocale(navigatorLang) > "en".
// Reads NO globals — the persisted-locale read lives in main.js so this
// module stays storage-free (Story 3.3 AC-6.7 source invariant).
export function resolveInitialLocale({ stored, navigatorLang } = {}) {
  if (stored && SUPPORTED.includes(String(stored))) return String(stored);
  return normalizeLocale(navigatorLang);
}

export async function load(localeCode) {
  localeCode = normalizeLocale(localeCode);
  const url = `/src/content/i18n/${localeCode}/strings.json`;
  try {
    const res = await fetch(url);
    if (!res || !res.ok) throw new Error(`fetch failed: ${res ? res.status : "no-response"}`);
    const bundle = await res.json();
    cache.set(localeCode, bundle);
    currentLocale = localeCode;
    return bundle;
  } catch (_err) {
    if (localeCode !== "en") {
      try {
        const enRes = await fetch("/src/content/i18n/en/strings.json");
        if (!enRes || !enRes.ok) throw new Error("en fallback fetch failed");
        const enBundle = await enRes.json();
        cache.set("en", enBundle);
        currentLocale = "en";
        return enBundle;
      } catch (_err2) {
        cache.delete("en");
        currentLocale = "en";
        return {};
      }
    }
    cache.delete("en");
    currentLocale = "en";
    return {};
  }
}

export function get(key) {
  const parts = String(key).split(".");
  const tryLocale = (loc) => {
    const bundle = cache.get(loc);
    if (!bundle) return undefined;
    let cursor = bundle;
    for (const p of parts) {
      if (cursor && typeof cursor === "object" && p in cursor) cursor = cursor[p];
      else return undefined;
    }
    return typeof cursor === "string" ? cursor : undefined;
  };
  const fromCurrent = currentLocale ? tryLocale(currentLocale) : undefined;
  if (fromCurrent !== undefined) return fromCurrent;
  if (currentLocale !== "en") {
    const fromEn = tryLocale("en");
    if (fromEn !== undefined) return fromEn;
  }
  return key;
}

export function getCurrentLocale() {
  return currentLocale;
}

// Story 7.1 AC-1 — translator alias. `t()` is the public name components
// import going forward; `get()` remains the implementation (same return for
// present + missing keys, incl. the bare-key-literal failure mode).
export function t(key) {
  return get(key);
}
