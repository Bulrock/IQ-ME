# Python test quality gates

> **Priority:** P0.
> **Gate level:** SUT-invocation = hard; subprocess-marker = hard;
> xfail-strict = advisory.
> **Load trigger:** story adds OR changes:
> - tests that assert on `caplog.text`, mock call counts, metrics,
>   telemetry events;
> - tests with `pytest.mark.xfail`;
> - tests calling `subprocess.*`, `sys.executable`, `multiprocessing.
>   Process`, or `concurrent.futures.ProcessPoolExecutor`.
> **Evidence level:** external-source (pytest docs) +
> single-project lesson (fly-robin-fly).

## Rule 1 — SUT invocation before behavioural assertion

A test asserting on `caplog.text`, mock call counts, telemetry events,
or metrics MUST explicitly invoke the system-under-test (SUT) between
setup and assertion. «Test theater» — assertion на mock created within
the test body without ever calling the real production path — passes
trivially and proves nothing.

**Anti-pattern:**

```python
def test_logs_warning(caplog):
    caplog.set_level(logging.WARNING, logger="my.module")
    # Bug: SUT never invoked. caplog stays empty, assertion vacuous.
    assert "deprecation" in caplog.text  # passes when caplog is "" too?
```

(Actually `"" in caplog.text` → True for substring `""` only; для real
substring assertion this fails, but variations using `not in` / `count`
slip through silently.)

**Correct:**

```python
def test_logs_warning(caplog):
    caplog.set_level(logging.WARNING, logger="my.module")
    my_module.do_thing()  # <- the SUT invocation
    assert "deprecation" in caplog.text
```

Same applies к `mock.assert_called_with(...)` — the mock must have
been invoked through production code path, not via direct call in the
test body.

## Rule 2 — `pytest.mark.xfail(strict=True)` for deferred positive gates

When a test describes intended behaviour that's intentionally blocked
by a future story, mark it `xfail(strict=True)`. Strict mode flips
XPASS (unexpected pass) into a failure — forcing the follow-up story
к flip the marker into a positive gate когда the feature lands.

```python
@pytest.mark.xfail(strict=True, reason="implemented в story SP-42")
def test_future_feature():
    assert my_module.future_thing() == 42
```

**Anti-patterns:**

- `xfail` without `strict=True` — XPASS silently passes; marker
  rots в codebase as future-feature lands and no one removes it.
- `pytest.skip(...)` instead of `xfail` — hides intent (was it
  blocked or just unsupported?).

## Rule 3 — Subprocess tests are integration tier

Tests invoking `subprocess.*`, `sys.executable`, `os.execv*`,
`multiprocessing.Process`, or `concurrent.futures.ProcessPoolExecutor`
spawn child processes — they are integration tests, не unit tests,
regardless of file location. Function-level marker wins over path:

```python
@pytest.mark.integration
def test_cli_help_output():
    result = subprocess.run(
        [sys.executable, "-m", "my_pkg", "--help"],
        capture_output=True, check=True,
    )
    assert b"Usage" in result.stdout
```

**Why marker over path:**
- Tests under `tests/unit/` calling subprocess silently миграрируют в
  integration tier — CI marker filters expect them в integration tier
  (slower, separate resources, different determinism profile).
- Path moves are expensive; markers are cheap and explicit.
- Mixed-tier modules (unit + integration tests в same file) need
  per-test marking anyway.

**Anti-pattern:** unmarked subprocess test under `tests/unit/` —
будет run alongside fast unit tests, slow them down, и periodically
fail under load.

## Adjacent — pytest marker / CI filter sync

When you add a new marker tier (e.g. `pytest.mark.slow`,
`pytest.mark.integration`, `pytest.mark.smoke`), update в same commit:

1. `pyproject.toml [tool.pytest.ini_options] markers` — registers
   marker, suppresses `PytestUnknownMarkWarning`.
2. CI marker filter (`pytest -m "not slow"` или job-specific filter)
   — tests do not silently drop out of PR-blocking gate.
3. Contributor docs (`README.md`, `CONTRIBUTING.md`) — explains
   marker semantics + when к use.

Drift between these = tests appearing «green в CI» actually skipped.
Catch это via:

- `pytest --strict-markers` (rejects unregistered markers, exit 1).
- CI grep на new markers introduced (`git diff origin/main -- '*test*.py'
  | grep -E 'pytest.mark.[a-z]+' | sort -u`) — surfaces unexpected
  marker additions.

## Detection (review checklist)

- [ ] Tests asserting on `caplog` / `mock.assert_*` / metrics — does
      production code path execute between fixture setup и assertion?
- [ ] `xfail` markers — strict=True?
- [ ] Tests calling subprocess / multiprocessing — marked integration?
- [ ] New marker tier — `pyproject.toml`, CI filter, docs all touched?
