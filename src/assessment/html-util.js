// Shared HTML escape + interpolation helpers (bridge-7-8-5 dedup of copies
// across consent/error-fallback/landing/theme/item-runner/result). escapeText:
// text content; escapeAttr: + &quot; for attribute values; fmt: {k} templating.
export const escapeText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const escapeAttr = (s) => escapeText(s).replace(/"/g, "&quot;");
export const fmt = (t, v) => String(t).replace(/\{(\w+)\}/g, (_m, k) => (k in v ? String(v[k]) : `{${k}}`));
