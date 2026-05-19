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

export async function load(localeCode) {
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
