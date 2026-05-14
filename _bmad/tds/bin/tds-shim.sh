#!/usr/bin/env bash
# tds-shim — global dispatcher for project-local _bmad/tds/bin/tds.
# tds-shim-version: 3
#
# Walks from $PWD up through parent directories looking for the nearest
# `_bmad/tds/bin/tds` and exec's it with all original args. Lets the
# user invoke `tds <subcmd>` from anywhere inside a TDS-enabled project
# (or any subdirectory of one) without binding skills to a hard-coded
# `_bmad/tds/bin/tds` path.
#
# Each project carries its own per-install version of the TDS bundle
# under `_bmad/tds/`; this shim is the dispatcher only. Pattern mirrors
# rbenv / pyenv / nvm / asdf shims.
#
# Installed by `tds setup install-shim` into ~/.local/bin/tds (default).
# Idempotent — re-running setup install-shim with the same shim version
# is a no-op.
#
# v2 (2026-05-07): exports TDS_INVOCATION_FORM=global-shim (only when not
# already set, so wrapper scripts can override) for cli-events.jsonl
# adoption telemetry. The downstream project shim sees the var and
# propagates it; the bundle reads it in the dispatcher.
#
# v3 (P1-04 от reviews/v1): manifest trust check. После finding'а
# `_bmad/tds/bin/tds` verify, что `_bmad/_config/manifest.yaml` exists
# AND содержит `name: tds` entry. Без этого random untrusted repo с
# подложенным `_bmad/tds/bin/tds` глобальным shim'ом exec'ится — что
# критично для AI-driven tooling. Манифест BMAD installer ставит при
# `bmad install --custom-source <tds>`; его отсутствие = repo не был
# TDS-installed, exec блокируется.

set -e

# Tag the invocation form for cli-events telemetry. `:-` keeps any
# pre-set value intact, so test harnesses / CI wrappers can override.
export TDS_INVOCATION_FORM="${TDS_INVOCATION_FORM:-global-shim}"

find_project_tds() {
  local dir
  dir="${PWD}"
  while [[ -n "${dir}" && "${dir}" != "/" ]]; do
    if [[ -x "${dir}/_bmad/tds/bin/tds" ]]; then
      printf '%s\n' "${dir}/_bmad/tds/bin/tds"
      return 0
    fi
    dir="$(dirname "${dir}")"
  done
  return 1
}

# verify_tds_manifest <project_root>
# Returns 0 if <project_root>/_bmad/_config/manifest.yaml exists и
# содержит `name: tds` entry под `modules:` block; non-zero иначе.
# Минимальный YAML matching без зависимостей: literal `- name: tds`
# pattern (BMAD installer's manifest writer canonicalises к одной
# форме — leading spaces + dash + space + `name: tds`).
verify_tds_manifest() {
  local project_root="$1"
  local manifest="${project_root}/_bmad/_config/manifest.yaml"
  [[ -r "${manifest}" ]] || return 1
  [[ -s "${manifest}" ]] || return 1
  grep -Eq '^[[:space:]]*-[[:space:]]+name:[[:space:]]+tds[[:space:]]*$' "${manifest}"
}

PROJECT_TDS="$(find_project_tds || true)"
if [[ -z "${PROJECT_TDS}" ]]; then
  printf 'tds: no _bmad/tds/bin/tds found in %s or any parent directory\n' "${PWD}" >&2
  printf 'Run `bmad install` then `_bmad/tds/bin/tds setup install` first, or cd into a TDS project.\n' >&2
  exit 127
fi

# Trust gate (P1-04). Derive project root from PROJECT_TDS path:
# `.../<project>/_bmad/tds/bin/tds` → <project>.
PROJECT_ROOT="${PROJECT_TDS%/_bmad/tds/bin/tds}"
if ! verify_tds_manifest "${PROJECT_ROOT}"; then
  printf 'tds: refused to exec %s — TDS manifest check failed.\n' "${PROJECT_TDS}" >&2
  printf '  expected: %s/_bmad/_config/manifest.yaml containing `name: tds` entry.\n' "${PROJECT_ROOT}" >&2
  printf '  cause: this project was not TDS-installed (`bmad install --custom-source <tds>` not run),\n' >&2
  printf '         or the manifest was tampered / removed.\n' >&2
  printf '  recovery: run `bmad install --custom-source <bmad-tds-module path>` from the project root.\n' >&2
  exit 126
fi

exec "${PROJECT_TDS}" "$@"
