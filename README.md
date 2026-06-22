# Ballast

**Capacity-forecast accountability for centralized GPU pools.** An anytime-valid,
gaming-resistant evidence-and-attribution layer that answers *"show me the math"* behind a
team's capacity reservation — without ever deciding who gets capacity. Sibling to DeploySignal /
Tessera / Cairn; built as a synthetic, trace-grounded reference implementation (no production
data required), consuming `deploysignal-engine`.

> A capacity-allocation dispute escalated to senior leadership, who asked to see the requesting
> team's math; the team couldn't provide it. Centralizing the pool delivers control but does not
> produce the math. **Ballast is the legibility layer that does.**

## Docs
- [`SCOPING-MEMO-v0.1.md`](SCOPING-MEMO-v0.1.md) — the scope: insurance-framed reservation core,
  pricing levers, invariants, anti-scope, open questions.
- [`HARNESS-SPEC-v0.1.md`](HARNESS-SPEC-v0.1.md) — the synthetic validation harness: scenario
  pool, coverage matrix, two-mode (open-loop detection / closed-loop incentive) design.
- [`STATE.md`](STATE.md) — current build status.

## Build / test / gate
```bash
npm install
npm test          # compile + node --test (36 tests, incl. the statistical FP guard)
npm run coverage  # the C2 coverage matrix
npm run gate      # anchor-guard / sprag arch gate (god-file / complexity / test-presence)
```

## What's validated so far
The full verified design except the remaining archetypes:
- **C2** peer-anchored over-reservation calibration (FP=0 guard) · **C3** objective congestion
  headroom · **C4** changepoint + cancellation curve (catch-early, price-late) · **C5/C5b**
  pooling de-rating (analytic + empirically validated ≤0.6%) · **C6/H3** the "show me the math"
  justification packet · **H4** closed-loop incentive efficacy + performative stability.
- **Engine consumption:** fleet FDR via `deploysignal-engine/fleet/e-bh` (e-BH under arbitrary
  dependence).

The coverage matrix shows the padder caught (TP=1.0) while *both* honest archetypes — including a
high-stockout-cost team that reserves the most and utilizes the least — are not flagged (FP=0),
because the calibration bar is the reference class's, not an absolute threshold. 64 tests; arch
gate clean.

License: Apache-2.0.
