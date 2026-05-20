// eslint.config.mjs — flat-config (ESLint 9.x)
//
// Story 1.9 — mechanizes the architecture's five-domain boundary model via the
// core `no-restricted-imports` rule. We deliberately avoid `eslint-plugin-import`
// (and its `no-restricted-paths` rule) to keep dev-deps minimal per NFR33.
//
// Domain assignments (canonical reference: docs/domain-map.md):
//   A — src/assessment/**  (SPA runtime)
//   B — src/scoring/**     (pure-math scoring engine)
//   C — src/content/**     (static markdown / locale data)
//   D — tools/**           (build/lint scripts; cross-domain read OK)
//   E — tests/**           (test fixtures; cross-domain read OK)
//
// Edge allow-rules:
//   A → B  OK (assessment uses scoring)
//   A → C  OK (assessment reads locale-content imports — runtime data)
//   A → D  FORBIDDEN (SPA must not depend on dev tooling)
//   A → E  FORBIDDEN (SPA must not depend on tests)
//   B → *  FORBIDDEN (scoring is pure; no app/content/tools/tests imports)
//   C → A  FORBIDDEN
//   C → B  FORBIDDEN
//   C → D  FORBIDDEN
//   D → *  OK (build tools have legitimate cross-domain read access)
//   E → *  OK (tests need cross-domain access for fixtures)
//
// The single codified exception is the D→E write via `make snapshot-update`;
// that's a build-target convention, not an import-graph concern, so eslint
// doesn't enforce it.

export default [
  // Global defaults.
  {
    languageOptions: {
      // Story 6.2 — raised from 2022 to 2025 so import-attributes
      // (`import x from "./y.json" with { type: "json" }`) parses cleanly.
      // Story 6.1 introduced the syntax in src/assessment/reveal-stage.js
      // but the lint-chain short-circuit at cognitive-load-budget hid the
      // parse error; bumping app-modules-bytes (Story 6.2 — see BUDGETS.json)
      // unblocked the chain and surfaced it.
      ecmaVersion: 2025,
      sourceType: "module",
    },
  },

  // Domain A — SPA — may NOT import from D (tools) or E (tests).
  {
    files: ["src/assessment/**/*.{js,mjs}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/tools/*", "tools/*"], message: "Domain A → D import forbidden (see docs/domain-map.md)." },
          { group: ["**/tests/*", "tests/*"], message: "Domain A → E import forbidden (see docs/domain-map.md)." },
        ],
      }],
    },
  },

  // Domain B — Scoring — pure math, no cross-domain imports.
  {
    files: ["src/scoring/**/*.{js,mjs}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/assessment/*", "../assessment/*", "src/assessment/*"], message: "Domain B → A import forbidden — scoring must be pure (see docs/domain-map.md)." },
          { group: ["**/content/*", "../content/*", "src/content/*"], message: "Domain B → C import forbidden (see docs/domain-map.md)." },
          { group: ["**/tools/*", "tools/*"], message: "Domain B → D import forbidden (see docs/domain-map.md)." },
          { group: ["**/tests/*", "tests/*"], message: "Domain B → E import forbidden (see docs/domain-map.md)." },
        ],
      }],
    },
  },

  // Domain C — Content — markdown-first, but if JS lives here, no cross-domain.
  {
    files: ["src/content/**/*.{js,mjs}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/assessment/*", "../assessment/*", "src/assessment/*"], message: "Domain C → A import forbidden (see docs/domain-map.md)." },
          { group: ["**/scoring/*", "../scoring/*", "src/scoring/*"], message: "Domain C → B import forbidden (see docs/domain-map.md)." },
          { group: ["**/tools/*", "tools/*"], message: "Domain C → D import forbidden (see docs/domain-map.md)." },
        ],
      }],
    },
  },

  // Domains D (tools) and E (tests) have no inbound restrictions — they are
  // allowed to import from anywhere. No per-file rules needed for those.

  // Ignore generated/external paths.
  {
    ignores: [
      "dist/**",
      "vendor/**",
      "node_modules/**",
      "_bmad/**",
      "_bmad-output/**",
    ],
  },
];
