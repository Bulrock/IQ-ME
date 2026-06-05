# IQ-ME native-speaker credibility report (Gate 9e)

> **STATUS: PENDING — no tester verdicts received yet.** This is a launch-readiness scaffold.
>
> Gate 9e closes only when this report records **≥12/15 overall AND ≥4/5 per language** with real consented tester handles. Until then, every tally below is `pending`. **Do NOT ship below threshold even if launch slips** (Risk #12).

---

## Launch-gate threshold

| Threshold | Value | Status |
|-----------|-------|--------|
| Overall credibility pass | ≥ 12 of 15 (≥12/15) testers mark "Credible" | pending |
| Per-language minimum | ≥ 4 of 5 (≥4/5) per language — no single-language failure masked by aggregation | pending |

Failing either threshold blocks v1.0.0 launch regardless of overall tally.

---

## Per-language credibility tally

### English (EN)

| Tester handle | Archetype | Verdict | Notes |
|---------------|-----------|---------|-------|
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| **EN subtotal** | | **0/5 credible** | |

### Russian (RU)

| Tester handle | Archetype | Verdict | Notes |
|---------------|-----------|---------|-------|
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| **RU subtotal** | | **0/5 credible** | |

### Polish (PL)

| Tester handle | Archetype | Verdict | Notes |
|---------------|-----------|---------|-------|
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| pending | TBD | pending | — |
| **PL subtotal** | | **0/5 credible** | |

### Overall

| Metric | Result | Threshold met? |
|--------|--------|----------------|
| Overall | 0 / 15 credible | pending — threshold: ≥12/15 |
| EN | 0 / 5 credible | pending — threshold: ≥4/5 |
| RU | 0 / 5 credible | pending — threshold: ≥4/5 |
| PL | 0 / 5 credible | pending — threshold: ≥4/5 |

---

## Iteration history

If copy revisions were needed between tester rounds, document them here:

| Iteration | Language | Issue surfaced | Fix applied | Re-test result |
|-----------|----------|----------------|-------------|----------------|
| (none yet) | — | — | — | — |

---

## Risk #12 note

> **Do not ship below threshold even if launch slips.**

If the 12/15 overall OR the 4/5 per-language threshold is not met after the first tester cohort, the required response is:
1. Identify which copy triggered "Not credible" verdicts.
2. Iterate the copy with the relevant Gate-9c/9d reviewer.
3. Redeploy and re-run the tester cohort for the affected language(s).
4. Document each iteration in the table above.
5. Only mark Gate 9e closed once all thresholds are met with real consented handles.

A launch slip is preferable to shipping below credibility threshold.

---

_All tally cells above are `pending`. Tester handles will be populated only with consented GitHub handles when real verdicts arrive. This document must not be modified to show a passing tally before that happens._
