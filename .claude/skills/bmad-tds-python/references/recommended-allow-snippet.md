# Python — recommended `.claude/settings.local.json` allow patterns

Copy-paste в свой `.claude/settings.local.json` (под `permissions.allow`)
чтобы pre-approve typical Python dev-cycle commands. Patterns — Claude
Code prefix-matching, `*` в конце = «любые args».

```json
{
  "permissions": {
    "allow": [
      "Bash(python -m *)",
      "Bash(python3 -m *)",
      "Bash(python --version)",
      "Bash(python3 --version)",
      "Bash(pytest *)",
      "Bash(pytest)",
      "Bash(ruff check *)",
      "Bash(ruff format *)",
      "Bash(ruff *)",
      "Bash(mypy *)",
      "Bash(black *)",
      "Bash(isort *)",
      "Bash(uvicorn *)",
      "Bash(alembic *)",
      "Bash(pip install *)",
      "Bash(pip list *)",
      "Bash(pip freeze *)",
      "Bash(pip show *)",
      "Bash(poetry install *)",
      "Bash(poetry run *)",
      "Bash(poetry add *)",
      "Bash(poetry lock *)",
      "Bash(uv pip install *)",
      "Bash(uv run *)",
      "Bash(uv sync *)"
    ]
  }
}
```

## Известные ограничения

Claude Code permission engine — **strict prefix match**:

- Wildcards `*` работают **в конце** pattern'а или в command body
  (`pytest *` matches `pytest tests/ -v -k integration`).
- Wildcards в **середине / начале** не работают.
- **Compound chains** (`source .venv/bin/activate && pytest 2>&1 | tail`)
  каждая unique string. См. Шаг 4e в `bmad-tds-execute-story` SKILL.md —
  recommended избегать compound.

## Альтернатива: shell rc / direnv / .python-version

```sh
# .envrc (project-root)
source .venv/bin/activate
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1
```

После `direnv allow` venv активирована при `cd`. `python` standalone
match'ит pre-allowed pattern. Альтернативно — `pyenv` / `.python-version`
файл для version pin'а без inline manipulation.
