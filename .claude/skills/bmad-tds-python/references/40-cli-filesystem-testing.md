# Python CLI / filesystem test isolation

> **Priority:** P0.
> **Gate level:** hard (real bug pattern — pollutes project root).
> **Load trigger:** story adds OR changes:
> - CLI integration tests (`click.testing.CliRunner`, `typer.testing.
>   CliRunner`, `argparse` parser invocation tests);
> - tests that create files / directories / databases;
> - tests touching `Path.cwd()` или relative paths.
> **Evidence level:** external-source (Click + Pytest tmp_path docs)
> + single-project lesson (fly-robin-fly artefacts leaking к project
> root during pytest runs).

## Rule — CLI tests writing artefacts MUST isolate CWD

A CLI integration test that creates files (config, output artefacts,
local databases, log files) must run в an isolated directory, not the
project root. Otherwise:

- Test creates files в `<project-root>/some-output.json` → CI works,
  local pytest pollutes git status.
- Tests cross-contaminate (one test creates `config.toml`, next test
  reads stale version).
- Project's own config files (`pyproject.toml`, `pytest.ini`,
  `.git/`) leak into test behaviour — false greens.

## Three canonical patterns

### Pattern A — `monkeypatch.chdir(tmp_path)`

Best when test needs an empty working directory:

```python
def test_writes_output_in_cwd(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    # Now Path.cwd() == tmp_path. Any relative-path write lands in
    # tmp_path, automatically cleaned up after test.
    my_cli.run(["generate", "--out=local.json"])
    assert (tmp_path / "local.json").exists()
```

`monkeypatch.chdir` reverts CWD after test — safe для parallel test
runs.

### Pattern B — Click / Typer `isolated_filesystem()`

For Click-based CLIs, the framework provides isolation natively:

```python
from click.testing import CliRunner

def test_click_command_with_isolated_fs():
    runner = CliRunner()
    with runner.isolated_filesystem():
        # Empty temp dir, CWD switched, automatically cleaned up.
        result = runner.invoke(my_command, ["--out=out.json"])
        assert result.exit_code == 0
        assert os.path.exists("out.json")
```

When `isolated_filesystem()` to use:

- Project configs (`pyproject.toml`, `setup.py`) NOT needed by the
  test — clean slate. Это и есть the common case for unit-style CLI
  tests verifying flag-parsing / output-formatting.

When NOT to use:

- Test exercises behavior that reads project's `pyproject.toml` или
  needs walking up к find a config — use `tmp_path` + explicit fixture
  setup instead.

### Pattern C — explicit fixture link

When a CLI command needs particular project state, build the test
fixtures explicitly через `tmp_path`:

```python
@pytest.fixture
def project_dir(tmp_path):
    (tmp_path / "pyproject.toml").write_text("[tool.my_cli]\nfoo = 'bar'\n")
    (tmp_path / "src").mkdir()
    return tmp_path

def test_cli_reads_project_config(project_dir, monkeypatch):
    monkeypatch.chdir(project_dir)
    result = my_cli.run(["status"])
    assert result.exit_code == 0
```

Explicit fixture beats implicit «relies on whatever happens to be в
project root» — test failures point к exact missing file.

## Anti-patterns

```python
# Anti-pattern A: no isolation — writes к project root
def test_bad():
    my_cli.run(["init"])  # creates project-root/.my-cli/ — leaks!

# Anti-pattern B: isolated_filesystem with project config dependency
def test_bad_b():
    runner = CliRunner()
    with runner.isolated_filesystem():
        # CLI tries к read pyproject.toml — not in temp dir, walks up
        # past tmp boundary, finds REAL project's pyproject.toml.
        runner.invoke(my_command, [...])

# Anti-pattern C: shared tmp not cleaned across tests
@pytest.fixture(scope="module")
def shared_tmp(tmp_path_factory):
    return tmp_path_factory.mktemp("shared")

def test_one(shared_tmp): (shared_tmp / "a.json").write_text("...")
def test_two(shared_tmp): assert (shared_tmp / "a.json").exists()
# test_two passes only когда test_one ran first — fragile ordering.
```

## Detection (review checklist)

- [ ] CLI test invokes command that creates files / dirs?
- [ ] If yes, isolation via `monkeypatch.chdir(tmp_path)` или
      `CliRunner.isolated_filesystem()`?
- [ ] Test reads project config? Explicit fixture build inside
      isolated dir, not «walks up by accident»?
- [ ] No `scope="module" / scope="session"` tmp fixtures unless test
      ordering invariant explicit?
- [ ] After full pytest run: `git status` — no untracked files leaked?

## Related

- Pytest `tmp_path` / `tmp_path_factory` — official scratch-dir
  fixtures.
- Click `CliRunner` — `invoke(cmd, args)` + `isolated_filesystem()`.
- Typer wraps Click — same `CliRunner` mechanic.
