# Python optional dependency import hygiene

> **Priority:** P0.
> **Gate level:** advisory (broadly useful, low blast radius если
> miss; promote к hard after multi-project validation).
> **Load trigger:** story adds OR changes:
> - new optional extra в `pyproject.toml [project.optional-
>   dependencies]`;
> - import statement guarded by try/except ImportError;
> - `pytest.importorskip(...)` call;
> - `__init__.py` re-export of optional-heavy module.
> **Evidence level:** external-source (Pytest `importorskip` docs,
> PEP 621 extras) + single-project lesson.

## Rule 1 — Actionable ImportError messages

When optional import fails, the error message must name (a) the
required extra и (b) the install command. Vague «ImportError: No
module named 'foo'» wastes user debugging time.

**Anti-pattern:**

```python
try:
    import foo_lib
except ImportError:
    raise ImportError("foo_lib not installed")  # ← unhelpful
```

**Correct:**

```python
try:
    import foo_lib
except ImportError as exc:
    raise ImportError(
        "Feature X requires the 'foo' extra. Install via:\n"
        "  pip install 'my-package[foo]'\n"
        "  # or: uv pip install 'my-package[foo]'"
    ) from exc
```

Include `from exc` чтобы original traceback survives — debugging
preserves both the user-facing hint и the underlying chain.

## Rule 2 — `pytest.importorskip` scope discipline

Use function-level or class-level `importorskip` для heavy optional
dependencies. Module-level skip is too coarse — it skips ALL tests в
file, including ones that don't need the optional dep.

**Anti-pattern (module-level — too coarse):**

```python
# test_my_module.py
import pytest
pytest.importorskip("torch")  # ← skips entire file even when 80%
                              # of tests don't need torch.

def test_pure_logic():  # doesn't use torch, gets skipped anyway.
    assert pure_function(...) == 42

def test_with_torch():
    import torch
    ...
```

**Correct (function/class-level — precise):**

```python
def test_pure_logic():
    assert pure_function(...) == 42

def test_with_torch():
    pytest.importorskip("torch")  # ← only this test skipped.
    import torch
    ...

class TestTorchFeatures:
    @pytest.fixture(autouse=True)
    def _require_torch(self):
        pytest.importorskip("torch")
    # All methods in class skipped if torch missing.
```

When module-level IS appropriate:

- File contains ONLY tests that need the optional dep (rare; usually
  a mixed-purpose module emerges).

## Rule 3 — Avoid eager `__init__.py` re-exports of optional-heavy deps

`__init__.py` runs on every `import my_package` — even `import
my_package.unrelated_submodule` triggers it. Re-exporting an
optional-heavy module from `__init__.py` means ANY import of
`my_package` requires the optional extra.

**Anti-pattern:**

```python
# my_package/__init__.py
from my_package.heavy_submodule import HeavyClass  # ← triggers
                                                   # numpy / torch /
                                                   # other heavy
                                                   # imports на
                                                   # every package
                                                   # import.
```

Result: `pip install my-package` (без extras) → `import my_package`
fails immediately. Users have к install heavy extras even when they
only need light functionality.

**Correct:**

```python
# my_package/__init__.py
__version__ = "1.0.0"
# No re-exports of optional-heavy submodules. Users explicitly:
#   from my_package.heavy_submodule import HeavyClass
# который then triggers the optional dep check there.
```

If discoverability matters, document the optional-dep path в README
and module-level docstrings instead of eager re-exports.

## Rule 4 — Optional import guards at use site, not module top

If a module USES optional dependency conditionally (e.g. fast-path
when available, fallback otherwise), guard at the use site:

```python
# Anti-pattern: module-top conditional import
try:
    from foo_lib import fast_thing
    _HAS_FOO = True
except ImportError:
    _HAS_FOO = False

def do_work(data):
    if _HAS_FOO:
        return fast_thing(data)
    return slow_fallback(data)
```

This works but obscures the optionality. Cleaner:

```python
# Better: import inside the use site
def do_work(data):
    try:
        from foo_lib import fast_thing
    except ImportError:
        return slow_fallback(data)
    return fast_thing(data)
```

Trade-off: slight per-call overhead (cached after first import via
`sys.modules`), explicit dependency at point of use. Acceptable if
`do_work` isn't on a hot path.

## Detection (review checklist)

- [ ] New optional extra в `pyproject.toml` — corresponding
      `ImportError` messages name the extra + install command?
- [ ] `pytest.importorskip` calls — function/class level (not
      module-level unless the whole file requires the dep)?
- [ ] `__init__.py` re-exports — does any re-exported submodule
      transitively import an optional-heavy dependency?
- [ ] Use-site guards prefer try/except at the use site over
      module-top `_HAS_X = True/False` flags?

## Related

- PEP 621 — `[project.optional-dependencies]` schema.
- Pytest `pytest.importorskip(modname, minversion=None,
  reason=None)` docs.
