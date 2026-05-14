# Frontend (React / Vue / Angular) — recommended `.claude/settings.local.json` allow patterns

Copy-paste в свой `.claude/settings.local.json` (под `permissions.allow`)
чтобы pre-approve typical web frontend dev-cycle commands. Patterns —
Claude Code prefix-matching, `*` в конце = «любые args».

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm *)",
      "Bash(pnpm install *)",
      "Bash(pnpm install)",
      "Bash(pnpm add *)",
      "Bash(pnpm remove *)",
      "Bash(pnpm run *)",
      "Bash(pnpm test *)",
      "Bash(pnpm dev *)",
      "Bash(pnpm dev)",
      "Bash(pnpm build *)",
      "Bash(pnpm build)",
      "Bash(pnpm lint *)",
      "Bash(pnpm typecheck *)",
      "Bash(pnpm vitest *)",
      "Bash(pnpm vitest)",
      "Bash(npm install *)",
      "Bash(npm run *)",
      "Bash(npm test *)",
      "Bash(npx *)",
      "Bash(yarn *)",
      "Bash(vitest *)",
      "Bash(vitest)",
      "Bash(vite *)",
      "Bash(tsc *)",
      "Bash(tsc --noEmit)",
      "Bash(eslint *)",
      "Bash(prettier *)",
      "Bash(playwright test *)",
      "Bash(playwright test)",
      "Bash(playwright install *)"
    ]
  }
}
```

## Storybook / build tools

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm storybook *)",
      "Bash(pnpm storybook)",
      "Bash(pnpm build-storybook *)",
      "Bash(webpack *)",
      "Bash(rollup *)",
      "Bash(esbuild *)"
    ]
  }
}
```

## Известные ограничения

Claude Code permission engine — **strict prefix match**:

- Wildcards `*` работают **в конце** pattern'а или в command body
  (`pnpm vitest *` matches `pnpm vitest run --coverage src/foo.test.ts`).
- Wildcards в **середине / начале** не работают.
- **Compound chains** (`pnpm install && pnpm test 2>&1 | tail`) каждая
  unique string. См. Шаг 4e в `bmad-tds-execute-story` SKILL.md —
  recommended избегать compound.

## Альтернатива: shell rc / direnv / .nvmrc

```sh
# .envrc (project-root)
export NODE_ENV="development"
export VITE_API_URL="http://localhost:3000"
```

`.nvmrc` файл pins node version, `nvm use` или `fnm use` авто-switch'ит
при `cd`. Standalone commands match'ят pre-allowed patterns без inline
`export`.
