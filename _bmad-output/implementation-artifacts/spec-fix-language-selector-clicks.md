---
title: 'Fix language selector clicks'
type: 'bugfix'
created: '2026-06-13'
status: 'done'
route: 'one-shot'
---

# Fix language selector clicks

## Intent

**Problem:** The open language dropdown appeared above the landing page, but the later-painted landing scene intercepted pointer input, preventing users from selecting a language.

**Approach:** Raise the glass header stacking context above scene content and add a browser regression assertion that verifies an open language option is the top pointer hit target.

## Suggested Review Order

**Interaction fix**

- Keep the glass header and its dropdown above later scene content.
  [`chrome-header.css:11`](../../src/css/components/chrome-header.css#L11)

**Regression coverage**

- Verify browser hit-testing reaches an open language option instead of the landing scene.
  [`pr7-language-dropdown.spec.mjs:65`](../../tests/playwright/pr7-language-dropdown.spec.mjs#L65)
