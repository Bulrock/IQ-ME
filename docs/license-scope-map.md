# License scope map

This file is the **machine-readable, human-readable mapping** from file-globs
to license classes named in `LICENSES.md`. `tools/lint-license-provenance.mjs`
loads the fenced YAML block below as its config (NFR33 stdlib-only — no
external YAML library, we parse the subset we need inline).

The contract:

1. Every shipped source file under any class's declared `globs:` prefix MUST
   be covered by at least one glob OR by the top-level `exclusions:` list.
2. Adding a new file class (e.g., `src/content/crisis-resources/**`) means
   adding **both** a class entry here AND a `## N. <class name>` section in
   `LICENSES.md` (the human-facing license attribution surface).
3. Exclusions are for files that are intentionally out-of-scope (e.g.,
   `.gitkeep` directory sentinels). Use sparingly; a real file should always
   get a real class.

The lint walks the directory union of all class glob prefixes. It does NOT
walk the whole repository — `tests/`, `_bmad-output/`, `.github/`,
`node_modules/`, etc. are intentionally outside the licensing surface area
this lint enforces. Build outputs (`dist/`) are likewise out of scope.

If you encounter a "no LICENSES.md scope entry found" error from the lint,
the correct response is to either:

- Add the file's glob to an existing class here, AND ensure `LICENSES.md`
  already names that scope (no further LICENSES.md edit needed); OR
- Author a new class here AND author a matching `## N. <class>` section in
  `LICENSES.md` (this triggers Phase 2 hash drift — add a `CHANGELOG.md`
  entry naming `LICENSES.md` in the same PR).

The **wrong** response is to widen `exclusions:` so the file disappears
from enforcement.

## Mapping

```yaml
classes:
  mit:
    globs:
      - "src/assessment/**"
      - "src/scoring/**"
      - "src/css/**"
      - "src/index.html"
      - "tools/**"
    licenses-md-section: "1. App code — MIT"
  item-pool:
    globs:
      - "src/items/*.svg"
      - "src/items/item-parameters.json"
    licenses-md-section: "2. Item pool (matrix-reasoning items) — CC-BY-NC-SA 4.0 (or ICAR-author-specified)"
  methodology-corpus:
    globs:
      - "src/content/methodology/en/**/*.md"
    licenses-md-section: "3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0"
  translated-content:
    globs:
      - "src/content/methodology/ru/**"
      - "src/content/methodology/pl/**"
      - "src/content/i18n/ru/**"
      - "src/content/i18n/pl/**"
      - "src/content/glossary/ru/**"
      - "src/content/glossary/pl/**"
      - "src/content/trails/ru/**"
      - "src/content/trails/pl/**"
      - "src/content/crisis-resources/ru/**"
      - "src/content/crisis-resources/pl/**"
    licenses-md-section: "4. Translated content — CC-BY-NC-SA 4.0"
  locale-strings:
    globs:
      - "src/content/i18n/en/**"
    licenses-md-section: "1. App code — MIT"
  glossary:
    globs:
      - "src/content/glossary/en/**"
    licenses-md-section: "3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0"
  crisis-resources:
    globs:
      - "src/content/crisis-resources/en/**"
    licenses-md-section: "3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0"
  trails:
    globs:
      - "src/content/trails/en/**"
    licenses-md-section: "3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0"
  diagrams:
    globs:
      - "src/content/diagrams/**"
    licenses-md-section: "3. Methodology corpus (project-authored derivative content) — CC-BY-NC-SA 4.0"
exclusions:
  - "**/.gitkeep"
```

## Notes

- **MIT class** intentionally includes both runtime code (`src/assessment/`,
  `src/scoring/`, `src/css/`, `src/index.html`) and author-time tooling
  (`tools/**`). Both ship under the same MIT permission set; the runtime/
  tooling split is a code-organization concern, not a license concern.
- **Item pool** is a flat directory by design — `*.svg` + `item-parameters.json`.
  A nested-tree extension would require a glob update.
- **Translated content** classes are listed exhaustively per-locale to keep
  the scope map auditable without recursive wildcards across locale roots.
  Adding a new locale (e.g., `de`, `cs`) requires adding the four content
  trees (`methodology/<locale>`, `i18n/<locale>`, `glossary/<locale>`,
  optional `trails/<locale>` + `crisis-resources/<locale>`).
- The lint walks only directories reachable from these globs. It does not
  walk `tests/`, `_bmad-output/`, `.github/`, `node_modules/`, or `dist/`.
