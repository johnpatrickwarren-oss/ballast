# Ballast — STATE

**As of:** Cycle-2 build, H1 complete + H2 partial. All gates green.

## Green status
- `npm test` — **72 tests pass** (one test file per `src/` module + the FP guard).
- `npm run coverage` — coverage matrix **PASS**.
- `node tools/pooling-sweep.js` — C5 (ρ × α) de-rating sweep.
- `node tools/escalation-demo.js` — H3 "show me the math" side-by-side.
- `node tools/cancellation-demo.js` — C4 late-backout: knowable@cycle-14, late dump costs +118.
- `node tools/cohort-validate.js` — C5b realized-vs-analytic pooling (rel. err ≤ 0.6%).
- `node tools/closedloop-demo.js` — H4 incentive efficacy + performative stability.
- `node tools/fleet-audit.js` — engine e-BH FDR audit (flags 5 padders / 15, excludes honest).
- `npm run gate` — anchor-guard / sprag arch gate: **0 violations** across all six invariants
  (no god files >800L, no functions >150L, no complexity >12, no module fan-in >20, every
  `src/` module has a test, no time-bomb tests).

## Coverage matrix (component C2 — calibration, N=200 seeds/scenario)

| scenario | intent | expect | flag-rate | result |
|---|---|---|---|---|
| `cov-honest` (honest_bursty) | honest | no-flag | 0.000 | PASS |
| `cov-riskaverse` (risk_averse_high_cu) | honest | no-flag | 0.000 | PASS |
| `cov-padder` (padder_steady) | padding | flag | 1.000 | PASS |

The crux: `risk_averse` reserves the MOST per unit forecast (≈3.3×) and utilizes the least, yet
is not flagged — flagging is **class-relative**, not an absolute utilization threshold. The FP=0
guard (HARNESS-SPEC §7) is enforced statistically: honest archetypes flag ≤ α over many seeds
(anytime-valid Type-I control), not merely on one instance.

## Implemented (src/)
- `rng` seeded PRNG + samplers (replay-clean) · `stats` (incl. `invNormCdf`) · `demand`
  heavy-tailed generator
- `domain` type contracts · `archetypes` reservation transforms + ground-truth intent
- `workload` per-cycle observation stream · `eprocess` anytime-valid betting e-process
- `calibration` (C2) peer-anchored over-reservation test · `congestion` (C3) objective
  sanctioned-ratio from variability · `pooling` (C5) central-buffer de-rating · `scenario`
  pool + classes · `pipeline` end-to-end
- `packet` (C6/H3) justification "math" artifact · `changepoint` (C4) Page-CUSUM downshift ·
  `cancellation` (C4) cancellation curve · `cohort` (C5b) empirical correlated-cohort validation
- `agent` + `closedloop` (H4 Mode B) best-responding agents + performative control loop ·
  `fdr` (ENGINE CONSUMPTION) fleet e-BH FDR via `deploysignal-engine/fleet/e-bh`
- `sandbag` under-reservation (stockout) detector — the mirror of calibration, for `ratchet_sandbagger`

All seven archetypes are now built. **C3 drives the class ratios**: `serving.scenario` computes each
class's sanctioned bar from demand variability via robust dispersion (high_cu 0.34 < bursty 0.42 <
steady 0.66) rather than hand-setting it.

## C5 pooling de-rating (verified result)
Benefit B = N_eff^((α−1)/α), N_eff = N/(1+(N−1)ρ). Reduces exactly to Eppen √N (ρ=0,α=2),
vanishes at ρ=1, and collapses as α→1 (Bimpikis–Markakis). Sweep at N=64: top-left 8.00 (=√64);
at realistic GPU demand (ρ≈0.3, α≈1.3) only **1.31×** — so a naive √N assumption under-sizes the
central buffer ~6×. The `pooledBuffer` > `naivePooledBuffer` test enforces the honest sizing.

## H3 / C4 / C5b results (this increment)
- **H3 escalation demo:** padder presents "279 units"; packet shows 45.3% utilization vs 82% sanctioned
  bar, 44.7% excess, C2 flag (wealth 55.8 @cycle 17) — the math the real team couldn't produce.
- **C4:** launch slips at cycle 12; changepoint flags it **knowable at cycle 14**; releasing then
  costs 142 vs dumping at the deadline 261 → **late dumping costs +118**, so early release dominates.
- **C5b:** realized pooling benefit matches the analytic √N/√(1+(N−1)ρ) within **≤0.6%** across
  ρ ∈ {0, 0.1, 0.3, 0.6} — empirical confirmation of the Eppen correlation half of C5.

## H4 / engine-consumption results (this increment)
- **H4 incentive efficacy:** padding share falls 35.9% → 0% as the premium rises (revealed
  preference); the premium proportionally weeds out low-Cu padders faster than high-Cu teams.
- **H4 performative stability:** the control loop converges to the stable fixed point at gain 0.5
  (util → 0.85) and **diverges at gain 2.5** (oscillates) — the ε<γ/β boundary with a working
  positive control.
- **Engine consumption:** `fdr.ts` consumes `deploysignal-engine/fleet/e-bh` (Wang–Ramdas e-BH,
  FDR under arbitrary dependence). Fleet of 15 (5 padders + 8 honest + 2 risk-averse) at q=0.1 →
  watch list = exactly the 5 padders; honest + risk-averse excluded.

## Archetype coverage (all seven)
| archetype | caught by | result |
|---|---|---|
| `honest_bursty`, `risk_averse_high_cu` | C2 (FP guard) | not flagged ✓ |
| `padder_steady` | C2 calibration | flagged ✓ |
| `ratchet_sandbagger` | sandbag (stockout) detector | flagged ✓ (C2 correctly silent) |
| `late_backout` | C4 changepoint + cancellation | knowable-early, priced ✓ |
| `junk_job_inflater` | NONE (value boundary) | C2 & sandbag both silent — **deterrence is the premium, not the meter** ✓ documented |
| `correlated_peak` | C5 pooling de-rating | buffer de-rated ✓ |

## Demand-model fix (correctness)
The heavy-tail shock was centering on the Pareto *mean*, collapsing right-skewed demand toward zero.
Replaced with an upward-only heavy-tail burst (demand spikes up, never collapses) — the realistic
shape, and the one whose peak-vs-median spread C3 reads correctly. Calibration is forecast-relative,
so all prior results held.

## Not yet built (next increments)
- **Engine betting-e-process primitive** (calibration is currently Ballast-native; e-BH already
  engine-consumed).
- **Mode B hardening:** stochastic agent demand + gaming-strategy search beyond the newsvendor
  best-response.

## Design notes / honest boundaries
- C3's `computeSanctionedRatio` is validated standalone (bursty CV → lower ratio) but the
  scenario classes still carry hand-set ratios consistent with it (k=1 reproduces 0.45/0.82);
  wiring C3 to drive class ratios is a follow-up.
- Calibration discrimination in H1/H2 is forecast-relative, so demand magnitude/shape does not
  yet affect the verdict — the risk-meter (C1 α/correlation estimation) and pooling (C5) are
  where demand shape becomes load-bearing.
