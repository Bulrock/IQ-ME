---
name: bmad-tds-setup
description: |
  TDS phase-2 bootstrap orchestrator. Host-agnostic skill — invoke по host's pattern (Claude Code: `/bmad-tds-setup [install|upgrade|status|init]`; Codex: `$bmad-tds-setup ...` or prose «Use bmad-tds-setup to install TDS»). Выполняется один раз после `bmad-method install`. 4 шага: preflight → resolve source → run bundle install (state + host adapter sync + commit-msg hook + global walk-up shim в `~/.local/bin/tds`) → self-check. Без него TDS-CLI не работает, role-skills не функционируют.
---

# bmad-tds-setup

Phase-2 bootstrap orchestrator: завершает установку TDS после того, как BMAD installer скопировал артефакты в `_bmad/tds/` (Class I read-only). НЕ копирует skills (это installer уже сделал — V-2 verified). НЕ создаёт symlink `bin/tds` (Class I read-only). Выполняет только то, что installer не может: chmod-equivalent через Node + permissions, generate user-state в `<output_folder>/_tds/`, merge'ит TDS deny+allow listings в `.claude/settings.json` (preserve user keys), пишет Codex advisory под `<output>/_tds/runtime/doctor/codex-advisory.md` (informational only — Codex не поддерживает per-command allow/deny model, а sandbox protects `.codex/` как read-only).

## On Activation

### Step 0 — Resolve customization (MUST, before anything else)

Run:

```
python3 {project-root}/_bmad/scripts/resolve_customization.py \
  --skill {skill-root} --key workflow
```

**If the script fails**, resolve `workflow` block manually base → team → user:

1. `{skill-root}/customize.toml` — defaults (Class I)
2. `{project-root}/_bmad/custom/{skill-name}.toml` — team overrides (Class III)
3. `{project-root}/_bmad/custom/{skill-name}.user.toml` — personal overrides (Class III)

Merge rules: scalars override; tables deep-merge; arrays of tables keyed by `code`/`id` replace + append; other arrays append.

### Step 1 — Execute prepend steps

Execute each entry в `{workflow.activation_steps_prepend}`.

### Step 2 — Load persistent facts

Treat `{workflow.persistent_facts}` как foundational session context (`file:` префиксы — load contents).

### Step 3 — Load BMAD config

Из `{project-root}/_bmad/bmm/config.yaml`: `{user_name}`, `{communication_language}`, `{document_output_language}`, `{project_knowledge}`, `{impl_artifacts}`.

### Step 4 — Apply principles

Combine Karpathy 4 принципов (MANDATORY; полный текст в `## Constraints` секции) + `{workflow.principles}` (team additions).

### Step 5 — Execute orchestration

Proceed to «Process» section ниже. После завершения — execute `{workflow.activation_steps_append}`.

---

## Process — orchestration

**Один CLI-вызов делает всё** (`tds setup install`): drop runtime → merge `.claude/settings.json` (existing user-keys preserved) + write Codex advisory под `<output>/_tds/runtime/doctor/codex-advisory.md` → state init → install commit-msg hook → write global walk-up shim в `~/.local/bin/tds` (idempotent, no-op на втором проекте). После этого `tds <cmd>` доступен из любого TDS-проекта. Финал — preflight self-check.

**Почему Codex advisory под TDS state, а не `.codex/`:** Codex's default `workspace-write` sandbox protects `.codex/` recursively as read-only. Если `tds setup install` попытается записать туда — install fail'нет либо потребует sandbox escalation. TDS-owned state (`<output>/_tds/`) всегда writable, поэтому advisory ships там. `.codex/config.toml` — user's territory; runtime его НЕ трогает (per-command allow/deny model там не существует, fake `[permissions.tds_default]` block в earlier versions Codex silently ignored). Реальная enforcement layer — `tds` CLI authz/integrity/telemetry; host settings уменьшают prompt-churn для known-trusted patterns, но не являются security boundary.

| # | Step | Что делает | Failure mode (наблюдаемое сегодня) |
|---|------|-----------|--------------|
| 1 | preflight | Проверяет deps: `git --version`, `node --version` (≥ 22), `python3 --version` (≥ 3.10), `python3 -c "import ruamel.yaml"` (≥ 0.18). | exit 3 (PRECONDITION) с конкретным missing-dep сообщением (см. `src/preflight/check.ts`). Symbol `TDS-ERR:DEP_MISSING_<binary>` зарезервирован в `_docs/spec/registry/error-codes.yaml` (exit 11) — runtime сейчас в stderr этот symbol не печатает. |
| 2 | resolve source | Прочитай `_bmad/_config/manifest.yaml`, найди запись `name: tds`. **Two manifest shapes** (BMAD installer 6.6.x):<br>· `localPath: <abs>` — `bmad install --custom-source <local-path>`. Source root: `<localPath>/shared/tds-runtime.bundle.js` существует → `<localPath>`; иначе `<localPath>/payload`.<br>· `repoUrl: <url>` без `localPath` — `bmad install --custom-source <git-url>` или `<https-url>`. BMAD клонирует репо в `~/.bmad/cache/custom-modules/<host>/<owner>/<repo>/` (`.git` суффикс strip'ается; SSH `git@host:owner/repo` → `host/owner/repo`). Source root: тот же fallback, но базой служит cached path; на практике `<cache>/payload` (наш репозиторий держит payload в подпапке). <br>**Atomic helper** (после первого успешного install — но handler работает и до того, ему нужен только cwd внутри BMAD-tree): `tds setup resolve-source --json` → emit'ит `{sourceRoot, via: "localPath" \| "repoUrl-cache"}`. На самом первом install'е bundle ещё не на shim'е — следуй алгоритму выше вручную или вызови `node <candidate>/shared/tds-runtime.bundle.js setup resolve-source --json` чтобы валидировать выбранный path. | exit 3 (PRECONDITION) если `manifest.yaml` отсутствует, нет записи `name: tds`, ни `localPath` ни `repoUrl` не заданы, или bundle отсутствует на ожидаемом месте. Symbol `TDS-ERR:PAYLOAD_INTEGRITY_FAILED` (exit 41) — design-reserved, см. [RB-08](./runbooks/RB-08-install-halt.md) banner. |
| 3 | run bundle install | Одна команда: `node <source>/shared/tds-runtime.bundle.js setup install --profile=<full\|lite> --json`. Bundle копирует `shared/` + `bin/` в `_bmad/tds/` (skip `*.map`/`.DS_Store`, chmod +x), мерджит `.claude/settings.json` (preserve existing user-keys), пишет Codex advisory под `<output>/_tds/runtime/doctor/codex-advisory.md` (informational only — НЕ трогает `.codex/config.toml` и НЕ пишет под `.codex/` вообще, поскольку Codex sandbox protects it read-only), создаёт schema-compliant `state-manifest.yaml` + `branch-registry.yaml` + `memory/lessons.yaml` + 8 runtime subdirs, ставит `.git/hooks/commit-msg` (full mode). **Также авто-устанавливает global walk-up shim** в `$HOME/.local/bin/tds` (idempotent — newer preserved, same version → no-op; `--no-shim` opts out для CI/shared-host). Если `$HOME/.local/bin` не в PATH — installer печатает hint, НЕ модифицирует `.bashrc`/`.zshrc`. После этого `tds <cmd>` доступен из любого TDS-проекта (walk-up до nearest `_bmad/tds/bin/tds`). Через канонический proper-lockfile + write-file-atomic + eemeli/yaml stack — никаких ручных bash cp/chmod/mkdir, никаких permission-prompt'ов на отдельные file-ops. Idempotent: existing schema-valid files preserved. Эмитит `install-events.jsonl`. Shim install errors — non-fatal warning. | exit 5 (state init / branch grammar pre-condition) или exit 12 (filesystem permission); RUNTIME для прочих сбоев. Symbols `TDS-ERR:STATE_INIT_FAILED` / `TDS-ERR:OUTPUT_FOLDER_NOT_WRITABLE` зарезервированы; в stderr — конкретное человекочитаемое сообщение. exit 41/42 (`PAYLOAD_INTEGRITY_FAILED` / `ADAPTER_BOOTSTRAP_FAILED`) — design-reserved, runtime их не emit'ит. |
| 4 | self-check | `tds preflight check --action=install --json` → ожидаем exit 0 + `decision: go`. (После Step 3 bare `tds` работает via global shim; fallback — `_bmad/tds/bin/tds preflight check ...`.) **Bundle integrity** (subshell обязателен): `( cd _bmad/tds/shared && shasum -a 256 -c tds-runtime.bundle.js.sha256 )`. Subshell scope'ит `cd` — cwd основной сессии не меняется. | exit 3 (PRECONDITION) от `preflight check` если какой-то check fail (e.g., python helper missing). `shasum -c` non-zero → bundle integrity drift; recovery — re-run `bmad install --update --force` (re-fetch payload). |

**Action variants:**

> **Host invocation patterns.** Examples ниже используют Claude Code wording (`/bmad-tds-setup`). В Codex same skill invokes через `$bmad-tds-setup` shortcut, `/skills` UI selection, или prose («Use bmad-tds-setup to install TDS»). Custom slash-commands в стиле `/bmad-tds-setup` Codex не resolves — он matches skills via `name:` / `description:` frontmatter. Arguments после `$bmad-tds-setup`/skill phrase identical в обоих hosts: `install --profile=lite`, `upgrade`, `status`, `init`.

- `/bmad-tds-setup` — без аргументов. **Auto-detect** проверяет ОБА маркера install'а:
  1. `<output_folder>/_tds/state-manifest.yaml` (state init).
  2. `_bmad/tds/shared/tds-runtime.bundle.js` (runtime payload).
  Если **оба присутствуют** → `tds setup install` отработал чисто, skill переключается в diagnostic mode (read-only `tds doctor diagnose` + bundle integrity sha256-check). Если **state есть, но runtime отсутствует** (или наоборот — partial install после `bmad install --update` где payload не подложился, либо после `rm -rf _bmad/tds/`) → install режим (`tds setup install` идемпотентен — preserves valid state, restoring missing runtime). Если **ни одного нет** → full bootstrap.
- `/bmad-tds-setup install [--profile=lite|full]` — explicit fresh install. Все 4 шага выше.
- `/bmad-tds-setup upgrade` — semantic alias после `bmad install --update`. Маршрутизируется в тот же `tds setup install` (он идемпотентен): refresh'ает runtime + reconcile patches, preserves user-state. Отдельного `setup upgrade` subcommand'a у CLI нет.
- `/bmad-tds-setup status` — read-only diagnostic (без модификаций). Skill вызывает `tds doctor diagnose` + bundle integrity sha256-check (`shasum -a 256 -c tds-runtime.bundle.js.sha256` в subshell). **НЕ вызывает `tds integrity verify`** — этот subcommand requires `--as=<role>` (forbidden-quadrant authz), а orchestrator-skill роли не имеет. Integrity verify запускается изнутри role-skill (engineer/auditor) с правильным `--as`. Отдельного `setup status` subcommand'a у CLI нет.
- `/bmad-tds-setup init` — advanced/repair: state-init only без host-config patches. Маппится на `tds setup init`.

> **Не реализовано:** `/bmad-tds-setup repair` (auto re-run failed step + downstream)
> и `/bmad-tds-setup uninstall [--purge]` — design intent, но в текущей версии модуля
> отсутствуют. Recovery после halt-not-rollback делается вручную: re-run
> `/bmad-tds-setup install` (idempotent — пропускает уже валидные файлы) или
> восстановление по соответствующему [runbook](./runbooks/README.md).
> Uninstall — пока вручную: `rm -rf <output_folder>/_tds/` + remove TDS-specific
> entries из `.claude/settings.json` (`.codex/` не трогается — runtime туда
> ничего не пишет; advisory file ушёл вместе с `<output_folder>/_tds/`).

## CLI surface — what `tds` exposes

The TDS-runtime is invoked via the global shim `tds <subcommand>` (auto-installed by Step 3 `tds setup install`), or via the project-rooted Node-shim `_bmad/tds/bin/tds <subcommand>` (always works as fallback). The bundle is also directly invokable as `node _bmad/tds/shared/tds-runtime.bundle.js <subcommand>` for diagnostics.

```
tds --help | help | -h         # print full usage
tds version [--json]
tds preflight check --action=install [--json]
tds setup install [--profile=full|lite] [--no-shim] [--json]  # full bootstrap: runtime + host configs + state + hooks + global shim (Step 3)
tds setup init [--profile=full|lite] [--json]                 # state init only (advanced/repair)
tds setup install-shim [--target=<path>] [--json]             # repair-only: re-install global shim (auto-chained from `setup install` by default)
tds orient
tds doctor diagnose [--json]   # also: doctor branch-orphans
tds integrity record|verify|accept|recover
tds state get|set
tds memory add|list|show|query|supersede|tag|candidates
tds branch start|attach|info|merge|prune|remove|push [--safe]|sync
tds commit --story=<id> -m <msg> -- <paths>
tds story update|status|add-finding|add-findings   # update: --status, --task-complete, --completion-note, --file-list-add, --self-review-from (specialist proactive disclosure); add-finding/add-findings = auditor only
tds pr create|update|merge-status|merge
tds deliver|sync|revert-story
tds epic create-bridge-from-retros|bridge list|bridge resolve
tds archive create|list|show|verify
```

Don't probe — call `tds --help` once if you need a refresher; it prints the full block to stdout (exit 0).

## Adapter patches reference (Step 1)

Step 1 merges TWO blocks into `.claude/settings.json`. **Both required** — without `allow`, the AI host re-prompts permission for every single `tds <cmd>` invocation (15+ prompts in a single story). Doing this BEFORE Steps 2-4 means setup-time bash calls (cp/chmod/mkdir/shasum) reach a settings.json that already permits them; users don't accumulate ~10 entries in their per-user `.claude/settings.local.json`.

```jsonc
{
  "permissions": {
    "deny": [
      // TDS Class I (read-only after install): payload integrity surface.
      "Edit(_bmad/tds/**)",
      "Write(_bmad/tds/**)",
      // TDS-managed Class II state: every write must go through `tds <cmd>`,
      // never direct file edit. Bypassing this defeats integrity verification
      // + telemetry + forbidden-quadrant authz.
      "Edit(_bmad-output/_tds/state-manifest.yaml)",
      "Write(_bmad-output/_tds/state-manifest.yaml)",
      "Edit(_bmad-output/_tds/branch-registry.yaml)",
      "Write(_bmad-output/_tds/branch-registry.yaml)",
      "Edit(_bmad-output/_tds/memory/lessons.yaml)",
      "Write(_bmad-output/_tds/memory/lessons.yaml)"
    ],
    "allow": [
      // Bare `tds` — global walk-up shim installed by Step 4 (`tds setup
      // install-shim`) into ~/.local/bin/tds. Once on PATH, every skill
      // body invokes `tds <cmd>` and walk-up resolves to the project's
      // own _bmad/tds/bin/tds.
      "Bash(tds:*)",
      "Bash(tds)",
      // TDS CLI surfaces — project-rooted forms (always work, even before
      // install-shim or in CI / sandbox environments without PATH).
      "Bash(node _bmad/tds/shared/tds-runtime.bundle.js *)",
      "Bash(_bmad/tds/bin/tds *)",
      "Bash(node _bmad/tds/shared/tds-runtime.bundle.js)",
      "Bash(_bmad/tds/bin/tds)",

      // Setup-time helpers used by /bmad-tds-setup itself. Tight patterns
      // (specific commands or specific paths) wherever possible. Adding
      // these to the COMMITTED settings.json saves users from accumulating
      // ~10 entries in their per-user settings.local.json on first setup.
      "Bash(python3 _bmad/scripts/resolve_customization.py *)",
      "Bash(python3 _bmad/scripts/resolve_customization.py)",
      "Bash(python3 -c *)",
      "Bash(git --version)",
      "Bash(node --version)",
      "Bash(python3 --version)",
      "Bash(whoami)",
      "Bash(date *)",
      "Bash(pwd)",
      "Bash(shasum -a 256 -c *)",
      "Bash(chmod +x _bmad/tds/bin/*)",
      "Bash(chmod +x _bmad/tds/bin/**)",
      "Bash(cp -r */shared _bmad/tds/shared)",
      "Bash(cp -r */bin _bmad/tds/bin)",
      "Bash(rsync -a --exclude=* *)",
      "Bash(rsync -a *)",
      "Bash(rm _bmad/tds/shared/*.map)",
      "Bash(touch _bmad-output/_tds/runtime/**/.gitkeep)",
      "Bash(mkdir -p _bmad-output/_tds/**)",
      "Bash(mkdir -p _bmad-output/_tds/runtime/**)"
    ]
  }
}
```

**Codex CLI:** TDS НЕ пишет `.codex/config.toml` и НЕ создаёт `.codex/` directory (CX-01 + CX-02 — Codex's `workspace-write` sandbox protects `.codex/` recursively read-only by default, и per-command allow/deny model там не существует — fake `[permissions.tds_default]` block только misleads). Вместо этого `tds setup install` пишет comment-only advisory под `<output>/_tds/runtime/doctor/codex-advisory.md` с recommended Codex profile snippet (`approval_policy`, `sandbox_mode`, `[sandbox_workspace_write]` сетевые entries). Пользователь применяет конфигурацию вручную к своему `~/.codex/config.toml` (global) или project Codex config. Real enforcement layer for TDS — `tds` CLI authz + integrity + telemetry; host settings (Claude или Codex) уменьшают prompt-churn для known-trusted patterns, но security boundary не являются.

## Examples

```
<example>
User: «/bmad-tds-setup install --profile=lite»
Process:
  [Step 1 preflight] node ≥ 22 ✓, git ✓, python3 ≥ 3.10 + ruamel.yaml ≥ 0.18 ✓.
  [Step 2 resolve source] manifest.yaml → modules[name=tds].localPath = "/Users/.../bmad-tds-module"; bundle existence ✓ → source = localPath.
  [Step 3 run bundle install] node <source>/shared/tds-runtime.bundle.js setup install --profile=lite --json
                              → копирует shared/ + bin/ в _bmad/tds/, мерджит .claude/settings.json
                                (preserve user keys), пишет codex advisory под
                                <output>/_tds/runtime/doctor/codex-advisory.md (НЕ трогает .codex/),
                                создаёт <output_folder>/_tds/{state-manifest.yaml, branch-registry.yaml, memory/lessons.yaml, runtime/...},
                                ставит .git/hooks/commit-msg, авто-устанавливает global shim в ~/.local/bin/tds. exit 0.
  [Step 4 self-check] preflight check --action=install → exit 0 + decision=go;
                      shasum -a 256 -c tds-runtime.bundle.js.sha256 → OK.
  Output: «TDS install complete. Profile: lite. Shim: installed at ~/.local/bin/tds (verify PATH; `tds version` should work). Next: `tds orient` для read-only snapshot'а проекта, либо /bmad-tds-navigator для structured next-step proposal, либо /bmad-tds-execute-story <id> чтобы запустить story-orchestrator.»
</example>

<example>
User: «/bmad-tds-setup install» (после `bmad install --custom-source https://github.com/procksha/bmad-tds-module --tools claude-code --yes`)
Process:
  [Step 1 preflight] node ≥ 22 ✓, git ✓, python3 ≥ 3.10 + ruamel.yaml ≥ 0.18 ✓.
  [Step 2 resolve source] manifest.yaml → modules[name=tds] = { repoUrl: "https://github.com/procksha/bmad-tds-module" }
                          (NO `localPath` — URL install). Cache path:
                          ~/.bmad/cache/custom-modules/github.com/procksha/bmad-tds-module/payload/
                          → bundle exists ✓ → source = <cache>/payload.
  [Step 3 run bundle install] node <source>/shared/tds-runtime.bundle.js setup install --profile=full --json
                              → exit 0; runtime drop'ed, state init'ed, hooks installed, shim installed.
  [Step 4 self-check] OK.
  Output: «TDS install complete» (как в первом примере).
</example>

<example>
User: «/bmad-tds-setup install» (после неудачного Step 1 на свежей машине)
Process:
  [Step 1 preflight] node ≥ 22 ✓, git ✓, python3 ≥ 3.10 ✓, ruamel.yaml ✗
                     stderr: «python3 ≥ 3.10 + ruamel.yaml ≥ 0.18 required (ADR-0010, RB-08).
                              ModuleNotFoundError: No module named 'ruamel'»
                     exit 3 (PRECONDITION).
  [Halt-not-rollback] Skill печатает remediation:
                     «Install ruamel.yaml: `pip install --user 'ruamel.yaml>=0.18'`
                      (или `python3 -m pip install --user 'ruamel.yaml>=0.18'`).
                      Затем re-run /bmad-tds-setup install — он idempotent.»
  User: устанавливает ruamel.yaml, повторяет /bmad-tds-setup install.
  [Step 1] OK; Steps 2-4 проходят; install complete.
</example>
```

## Constraints

- Respond to user in {communication_language} (резолвится через customize.toml + BMAD config.toml.0).
- Generate deliverables in {document_output_language}.

- **Forbidden-quadrant:** workflow-skills вне матрицы (orchestrators над forbidden-quadrant). При self-execution делегирует CLI напрямую — каждый мутирующий `tds <cmd>` идёт с explicit `--as=<role>` flag (single source of truth для authz).

- **Karpathy working principles** :
  1. **Think Before Coding** — preflight surface'ит exact missing dep / version mismatch; не «как-нибудь установится».
  2. **Simplicity First** — 4 шага, не 7. Step «chmod +x» удалён (bundle — JS), step «symlink bin/tds» удалён (Class I read-only).
  3. **Surgical Changes** — adapter patches MERGE, не overwrite; existing user-keys в `.claude/settings.json` preserved.
  4. **Goal-Driven Execution** — Step 4 self-check — единственный success criterion. Без него `tds preflight check --action=install` вернёт exit 3 (PRECONDITION) + конкретный failed check (e.g., python helper missing, host-adapter unauthenticated). Recovery — re-run `/bmad-tds-setup install` после фикса.

- **Никаких write в `_bmad/tds/`** — Class I read-only. Все state в `<output_folder>/_tds/`.
- **Idempotent re-run.** `--resume` flag не нужен — каждый step проверяет «уже сделано? skip : execute». Halt-not-rollback оставляет partial state; repair re-runs intelligently.

## References

- `workflow.md` — детальный flow всех 4 шагов с error-recovery integration (если присутствует — ссылается на runbook'и в `./runbooks/`).
- `runbooks/README.md` — RB-06/08/09/10 + disambiguation matrix; RB-08 / RB-10 помечены как design-reserved / placeholder соответственно.
- `references/expected-payload-format.md` — формат `module.yaml.expected_payload_sha256` map (build-time generated).
- `references/adapter-patches.md` — точные patterns для `.claude/settings.json` deny-list. Codex CLI не имеет per-command allow/deny model, runtime туда не пишет; see `<output>/_tds/runtime/doctor/codex-advisory.md` после install для recommended profile snippet.
