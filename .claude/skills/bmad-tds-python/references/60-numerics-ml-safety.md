# Python numerics / ML safety gates

> **Priority:** P2 (specialised — load только когда story touches
> numerical / ML code).
> **Gate level:** advisory.
> **Load trigger:** story adds OR changes:
> - numpy / pandas / polars array operations с shape constraints;
> - torch / jax / tensorflow model code, training loops, custom
>   layers;
> - simulation engines (physics, MPPI controllers, kalman filters);
> - geometry / coordinate / projection / transform code;
> - high-volume numerical pipelines (signal processing, image
>   processing, batch ETL над arrays).
> **Evidence level:** single-project lesson (fly-robin-fly
> simulation/control project). **Watch для over-fit:** these patterns
> caught real bugs в that project's domain, но may не generalise к
> all numerical work. Apply judgment — если pattern doesn't match
> story shape, skip it.

## Rule 1 — assert array shape early

Operations chained across numpy/torch arrays silently broadcast или
collapse shape mismatches into wrong-but-runnable results. Catch
shape violations at function boundaries:

```python
def project_to_world(points_camera: np.ndarray, R: np.ndarray, t: np.ndarray) -> np.ndarray:
    # Explicit contract — fails fast on caller mistake.
    assert points_camera.shape[-1] == 3, \
        f"expected (..., 3) camera points, got {points_camera.shape}"
    assert R.shape == (3, 3), f"expected (3, 3) rotation, got {R.shape}"
    assert t.shape == (3,), f"expected (3,) translation, got {t.shape}"
    return points_camera @ R.T + t
```

Alternative: typed array libraries (`jaxtyping`, `nptyping`, beartype-
checked annotations). Trade-off: stricter checking but extra dep.

**Anti-pattern:**

```python
def project_to_world(points_camera, R, t):
    return points_camera @ R.T + t  # ← silently broadcasts wrong
                                    # shapes, produces garbage.
```

## Rule 2 — test NaN / Inf invariants on outputs

Numerical operations can produce `NaN` / `inf` без exception
(division by zero on floats yields `inf`/`nan` rather than raising
under default numpy settings). Production code paths reading these
values silently propagate them downstream.

```python
def test_dispatcher_output_is_finite():
    output = controller.compute_action(state)
    assert np.isfinite(output).all(), \
        f"output contains NaN/Inf: {output}"
```

Patterns:
- `np.isfinite(...).all()` после every numerical SUT call.
- Configure `np.seterr(all='raise')` в test setup для critical paths
  — converts NaN/Inf generation to immediate `FloatingPointError`.
- For torch: `torch.isfinite(tensor).all()` plus consider
  `torch.autograd.set_detect_anomaly(True)` в test mode (slow, но
  catches NaN gradients early).

## Rule 3 — gradient flow tests where backprop matters

ML training fails silently когда a part of the graph has detached
gradients (`.detach()` forgotten, `with torch.no_grad():` accidental,
non-differentiable op replacing differentiable). Test that loss
gradients reach все expected parameters:

```python
def test_model_gradients_flow_to_all_parameters():
    model = MyModel()
    loss = model(sample_input).sum()
    loss.backward()
    for name, param in model.named_parameters():
        assert param.grad is not None, f"{name}: grad is None"
        assert torch.isfinite(param.grad).all(), \
            f"{name}: NaN/Inf gradient"
        # Optional: minimum magnitude — catches «grad exists but zero»
        # (e.g. ReLU-dead unit).
        assert param.grad.abs().max() > 0, f"{name}: zero gradient"
```

Apply only когда story builds / modifies trainable model. For pure
inference / data pipeline stories — skip.

## Rule 4 — boolean sanity helpers must be asserted or raised on

Helper functions returning `bool` («is this state valid?», «does
this constraint hold?») are silent if caller forgets к check. Three
patterns:

```python
# Anti-pattern: silent no-op
def step(self):
    self.controller.check_invariants()  # ← returns bool, ignored.
    self._do_work()

# Pattern A: assert at call site
def step(self):
    assert self.controller.check_invariants(), "invariants violated"
    self._do_work()

# Pattern B: raise inside (preferred when called from many sites)
def check_invariants(self) -> None:
    if not (self._a > 0): raise ValueError("a must be positive")
    if not (self._b.shape == (3,)): raise ValueError(...)
```

Convention: helpers prefixed `check_*` raise on violation (no return);
helpers prefixed `is_*` / `has_*` return bool but caller MUST branch
on result. Static check (lint rule или arch-test): grep `check_\w+\(`
call sites не followed by `assert ` или wrapped в `if`.

## Rule 5 — non-degenerate test fixtures

Geometry / coordinate / projection / transform tests using zero-
vectors, identity matrices, or origin-aligned coordinates miss bugs
hidden by the symmetry:

```python
# Anti-pattern: identity rotation, origin translation, zero vector.
R = np.eye(3)
t = np.zeros(3)
points = np.zeros((10, 3))
projected = project(points, R, t)
assert projected.shape == (10, 3)
# ← Passes for buggy implementation that just returns input.

# Pattern: non-zero, non-identity references.
R = scipy_rotation_from_axis_angle(axis=[0, 0, 1], angle=np.pi / 6)
t = np.array([1.5, -2.0, 3.0])
points = np.random.default_rng(42).normal(size=(10, 3))
projected = project(points, R, t)
# Verify specific known result (computed by hand или alt impl).
assert np.allclose(projected[0], expected_first_point, atol=1e-6)
```

Use `np.random.default_rng(seed)` для deterministic non-degenerate
fixtures.

## Rule 6 — protocol / public API for cross-module state

Tests reaching into another module's private state (`obj._private`,
`Mock(_internal=...)`) cement implementation details — refactor
breaks tests без functional regression. If consumer needs state from
dependency, expose это публично:

```python
# Anti-pattern (test cements internal):
def test_dispatcher_uses_correct_subscriber():
    dispatcher = NotificationDispatcher()
    # Inspecting private — test breaks when field renamed.
    assert dispatcher._subscriber.__class__.__name__ == "EmailSubscriber"

# Pattern (public Protocol-based substitution):
from typing import Protocol

class SubscriberProtocol(Protocol):
    def handle(self, event: Event) -> None: ...

class NotificationDispatcher:
    def __init__(self, subscriber: SubscriberProtocol):
        self._subscriber = subscriber
    @property
    def subscriber(self) -> SubscriberProtocol:  # public accessor.
        return self._subscriber

def test_dispatcher_uses_correct_subscriber():
    spy = FakeSubscriber()
    dispatcher = NotificationDispatcher(spy)
    dispatcher.dispatch(test_event)
    assert spy.handled == [test_event]
```

Cross-language analog (same principle в C# / Java / Swift): hide
implementation, expose interface. Already covered в
`bmad-tds-engineer/references/20-di-integration-gate.md` для DI
context.

## Rule 7 — config-driven dimensions in tests

Hard-coded dimensions (`feature_dim = 128`) в tests pass even когда
production config changes к `feature_dim = 256` — test runs против
stale shape, regression untested.

```python
# Anti-pattern: hard-coded.
def test_layer_output_shape():
    layer = MyLayer(input_dim=128, output_dim=64)
    out = layer(torch.zeros(1, 128))
    assert out.shape == (1, 64)

# Pattern: dimensions from config.
def test_layer_output_shape(config):
    layer = MyLayer(input_dim=config.input_dim, output_dim=config.output_dim)
    out = layer(torch.zeros(1, config.input_dim))
    assert out.shape == (1, config.output_dim)
```

Config fixture passed explicitly; production config changes propagate
to tests via shared source-of-truth.

## Detection (review checklist)

- [ ] Array-shape contracts на function boundaries (assert или
      typed annotations)?
- [ ] NaN/Inf invariants asserted on numerical SUT outputs?
- [ ] Gradient-flow tests где backprop matters (ML training stories)?
- [ ] `check_*` helpers raise (не return bool); `is_*` results
      always branched на?
- [ ] Test fixtures non-degenerate (non-identity rotations, non-zero
      vectors, non-origin coords)?
- [ ] Tests substitute через public Protocol (не `obj._private`
      access)?
- [ ] Hard-coded dimensions в tests replaced с config-fixture
      reads?

## Related

- `references/20-test-quality-gates.md` — SUT-invocation gate
  applies к numerical tests too (assert on output, не just mock
  call count).
- `references/15-clean-code-python.md` — type hints, exceptions
  over return-codes principles intersect с Rule 4 (`check_*` /
  `is_*` convention).
- Cross-language: `bmad-tds-engineer/references/20-di-integration-
  gate.md` — Protocol/Public boundary principle (Rule 6) is the
  cross-language form of «registered+invoked» rigor.
