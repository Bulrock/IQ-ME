# C# / .NET — recommended `.claude/settings.local.json` allow patterns

Copy-paste в свой `.claude/settings.local.json` (под `permissions.allow`)
чтобы pre-approve typical dotnet dev-cycle commands и снизить
permission-prompt churn. Patterns — Claude Code prefix-matching, `*` в
конце означает «любые args».

```json
{
  "permissions": {
    "allow": [
      "Bash(dotnet build *)",
      "Bash(dotnet test *)",
      "Bash(dotnet run *)",
      "Bash(dotnet restore *)",
      "Bash(dotnet restore)",
      "Bash(dotnet ef migrations add *)",
      "Bash(dotnet ef migrations remove *)",
      "Bash(dotnet ef migrations list *)",
      "Bash(dotnet ef database update *)",
      "Bash(dotnet ef database update)",
      "Bash(dotnet ef *)",
      "Bash(dotnet format *)",
      "Bash(dotnet pack *)",
      "Bash(dotnet --version)",
      "Bash(dotnet --info)"
    ]
  }
}
```

## Test runner standalone binaries

После `dotnet build` testhost кладётся в `bin/Debug/<framework>/`.
Прямой запуск (типичный pattern в callisto pilot) тоже стоит pre-allow:

```json
{
  "permissions": {
    "allow": [
      "Bash(tests/*/bin/Debug/*/Callisto.* *)",
      "Bash(tests/*/bin/Debug/*/Callisto.*)"
    ]
  }
}
```

Замените `tests/*/bin/Debug/*/Callisto.*` на ваш actual layout/naming
(test project convention в каждой команде разный).

## Известные ограничения

Claude Code permission engine — **strict prefix match**:

- Wildcards `*` работают **в конце** pattern'а или **в command body**
  (`dotnet build *` matches `dotnet build src/X.csproj --configuration Release`).
- Wildcards в **середине / начале** pattern'а **не работают**
  (`Bash(* | tail *)` бесполезен).
- **Compound chains** (`export X=... && cmd 2>&1 | tail -N`) — каждая
  unique string, никакой allow pattern их не покрывает. См. Шаг 4e в
  `bmad-tds-execute-story` SKILL.md — recommended pattern это избегать
  compound.

## Альтернатива: shell rc / direnv

Глобальные env vars (TMPDIR, ASPNETCORE_ENVIRONMENT, NUGET_CONFIG) лучше
ставить через `~/.zshrc` или project `.envrc` (с `direnv`):

```sh
# .envrc (project-root)
export TMPDIR="$PWD/.dev-cache/tmp"
export ASPNETCORE_ENVIRONMENT="Development"
```

После `direnv allow` env'ы applied при `cd`. Команды можно вызывать
standalone (`dotnet build ...`), они match'ят pre-approved
`Bash(dotnet build *)`. Убирает inline `export X=Y && cmd` антипаттерн.
