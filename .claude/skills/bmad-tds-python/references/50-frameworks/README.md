# 50-frameworks/ — Python techstack-pack (deferred)

> Status: **deferred to a post-1.0 expansion**.
> The Python role-skill (`SKILL.md`) references files in this directory by
> path (`50-frameworks/<framework>.md`) under "lazy-load on demand"
> semantics. They are not yet authored. Until they land, the skill operates
> from `15-clean-code-python.md` plus general LLM knowledge of the
> framework — which is sufficient for routine work but lacks the curated,
> opinionated guidance the deep-dives are meant to encode.

## Planned deep-dives (alphabetical)

| File              | Topic                                                    |
|-------------------|----------------------------------------------------------|
| `asyncio.md`      | Event-loop hygiene, gather/race-condition patterns       |
| `django.md`       | ORM N+1, migrations, REST framework conventions          |
| `fastapi.md`      | Pydantic v2, dependency injection, async lifespan        |
| `flask.md`        | Blueprints, request lifecycle, SQLAlchemy integration    |
| `pytest.md`       | Fixture scoping, parametrize, anyio, coverage gates      |
| `sqlalchemy.md`   | 2.0 style, session scoping, migration via Alembic        |

## Why deferred

Authoring opinionated framework deep-dives is high-stakes content work
(must hold up against framework version churn). The 1.0 release ships
the structural skeleton + `15-clean-code-python.md` so the skill is
fully functional. Deep-dives land on a per-framework basis as community
contributions or maintainer-driven authoring sweeps.

## Contributing

PRs welcome. See `CONTRIBUTING.md` (repo root) for the file-format
expectation: each deep-dive is a self-contained Diátaxis "explanation"
document, not a tutorial — readers arrive with a problem in hand.
