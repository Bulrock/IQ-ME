# Localization Policy

> Multilingual handling: 4 axes того, что где какой language.

## 4 axes

| Axis | What | Source | Default |
|------|------|--------|---------|
| **Build-spec language** | Этот документ + `tds-design.md` + ADRs (project-internal) | Team choice | English (international compat) |
| **CLI output (`communication_language`)** | What user sees в terminal | `_bmad/bmm/config.yaml#communication_language` | English |
| **Document output (`document_output_language`)** | What writer generates (README, runbooks, ADRs, etc.) | `_bmad/bmm/config.yaml#document_output_language` | English |
| **Runtime docs locale** | Generated docs available в multiple languages | Team policy | English minimum + others |

## Why 4 axes (not 1)?

User on Russian-speaking team может want:

- chat agent на русском (`communication_language = Russian`),
- но deliverables (story-completion-notes, ADRs) на English (`document_output_language = English`) — для international team / OSS.

Or vice versa. Both legitimate. Single language config conflates these — TDS keeps separate.

## SKILL.md placeholders

В каждом role-skill SKILL.md `## Constraints`:

```markdown
- Respond to user in {communication_language}.
- Generate deliverables in {document_output_language}.
```

Resolver (BMAD-нативный — `src/scripts/resolve_customization.py`) substitutes значения at runtime.

## Writer's responsibility

При invocation writer reads BOTH:

- `{communication_language}` — для conversational replies к user (e.g., «I see two interpretations...»).
- `{document_output_language}` — для written deliverables.

If writer asks user «which audience?» — chat language = `communication_language`.
If writer outputs README content — language = `document_output_language`.

Mixed answer (chat + deliverable в одной session) — possible. Both placeholders separate.

## Multilingual deliverables

Если team needs README.md в multiple languages:

```
docs/
├── README.md           # English (default)
├── ru/README.md        # Russian
├── es/README.md        # Spanish
└── ...
```

Writer's responsibility — keep translations sync'd. Practical pattern:

1. English — source of truth (master version).
2. Translations — manual или machine-assisted, with explicit «Last synced: <date>» marker.
3. CHANGELOG entries в English first; translations follow major releases.
4. ADRs typically English only (international maintainability).

## Codex / Claude Code differences

Both hosts respect language preferences:

- Claude Code: explicit `language` setting + frontmatter в SKILL.md `description` уважает language.
- Codex CLI: `~/.codex/config.toml` may have language preference; SKILL.md text inherent language.

Cross-tool issue: SKILL.md `description` field (cross-tool minimum) — language matters. Default rec: English для description (max audience reach); body may be в local language если team-only deployment.

## Acronyms / technical terms

Don't translate:
- Code identifiers, command names, file paths.
- Common technical acronyms (HTTP, JSON, YAML, SQL, API).
- TDS / BMAD specific terms (skills, workflow, role-skill, integrity, forbidden-quadrant).

Do translate:
- Prose explanations.
- User-facing error messages (если localized).
- Navigation / UI text в docs.

## Implementation hint для TDS-runtime

Both `communication_language` и `document_output_language` resolved через BMAD's customize.toml stack. TDS doesn't read these directly — host reads через BMAD resolver's substitution в SKILL.md text.

Для CLI output (e.g., `tds preflight check` error messages) — either:
- All-English (current default; simpler).
- Localized via i18n message catalog (future feature; out-of-scope v1).

V1 default: CLI output English; docs respect `document_output_language` per-file.

## Decision points для team

- **Team на одном языке + OSS?** Build-spec English; CLI English; docs both English + local; SKILL.md description English.
- **Team на одном языке + closed source?** Everything в local language acceptable; ASCII-friendly identifiers.
- **Team multilingual?** All docs English; chat language per-user via `communication_language`.

## Karpathy applied

- **#1 Think Before Writing:** writer declares language in Frame. Don't silently translate.
- **#2 Simplicity First:** if uncertain — default English. Don't add multilingual complexity until needed.
- **#3 Surgical Changes:** when updating doc — match existing language. Don't translate «по дороге» если master is English.
