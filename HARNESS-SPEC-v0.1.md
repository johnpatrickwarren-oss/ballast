# Ballast — Validation Harness Spec v0.1

**Status:** Cycle 2 design doc — DRAFT. Precedes code. Pairs with `SCOPING-MEMO-v0.1.md`
(resolves OQ-3, validation method).

**Purpose.** Prove Ballast's mechanism is correct on synthetic, trace-grounded data with
**known ground truth**, with zero dependency on organization data. Same methodology as DeploySignal
(120-scenario adversarial pool), Tessera ("synthetic fixtures derived from public sources"),
and Tessera-RNG (synthetic telemetry + coverage matrices). Ballast consumes `deploysignal-engine`
as a git-dep; the harness validates the Ballast layer on top.

**The epistemic argument (why synthetic is correct, not a fallback).** The core claim —
"Ballast distinguished the padder from the honest-but-bursty team" — can only be scored against
**known intent**. In real data, intent is unobservable (the identifiability limit). Only a
generator that *created* the true `Cu` and the true intent lets you measure detection accuracy
against it. Synthetic ground truth is the one place the central claim is even testable.

---

## 1. Design principles

1. **Deterministic / replay-clean.** Seeded RNG; same seed → byte-identical demand streams,
   `AuditRecord`, and justification packet. Enforced by a golden-fixture regression (cf.
   DeploySignal's byte-identical `dist/`).
2. **Known ground truth.** Every scenario carries the true demand process, true `Cu`, and true
   intent label. Verdicts are scored against these, not against a proxy.
3. **Trace-grounded, not invented.** Demand shapes are calibrated to **public cluster traces**
   and the verified magnitudes, so the structure is realistic.
4. **Adversarial.** The pool is built to *break* the detector — especially the false-positive
   guards (honest-but-bursty, risk-averse-high-`Cu`), which are the politically fatal failures.
5. **Two modes** (§2): open-loop scores detection; closed-loop scores incentive/equilibrium.

---

## 2. Two harness modes

| Mode | Agents | Validates | Answers |
|---|---|---|---|
| **A — Open-loop** | Scripted archetypes (fixed behavior) | Detection/measurement **accuracy** (TP/FP vs known truth) | "Does the meter correctly identify padding vs honest?" |
| **B — Closed-loop** | Best-responding agents (optimize against the mechanism) | **Incentive** efficacy + gaming resistance + control-loop stability | "Does the premium actually deter padding, and does the loop converge (not thrash)?" |

Mode B is where the questions real data would otherwise be needed for get tested *in silico*:
the chargeback-efficacy question (OQ-3 behavioral half), Goodhart/gaming resistance, and the
**performative-stability** condition (ε < γ/β — Perdomo et al.). Build A first; B is Phase 3.

---

## 3. Demand generator (the substrate)

Emits the four ingestion-contract streams from `SCOPING-MEMO` (`ReservationEvent`, `DrawRecord`,
`UtilizationSample`, `AttributionMap`) on two timescales: **reservation** (planning cycles, e.g.
quarterly) and **usage** (per-minute/hour).

**Per-workload demand process** `D_w(t)`:
- base level `μ_w`;
- **heavy-tailed** fluctuation: stable distribution with class tail index **α_c ∈ (1,2)** — the
  verified parameter governing pooling degradation `n^((α−1)/α)` (Bimpikis–Markakis). Bursty
  serving classes get low α (heavy tails); steady batch gets high α.
- **diurnal/seasonal** multiplier + occasional **event pulses** (launches);
- **growth** drift (hypergrowth — also where changepoints live);
- **common factor** at org/class level → **correlated peaks** (peak-event common-mode). Correlation
  ρ is a swept parameter (pooling benefit must vanish as ρ→1 — Eppen).

**Public-trace grounding** (calibrate generator params, don't invent): Google Borg 2019,
Microsoft Philly (Jeon et al. ATC'19), Alibaba PAI (Weng et al. NSDI'22). Anchor magnitudes to
verified figures: Borg ~30% CPU util, LLM clusters 99%-busy/40%-SM, CAST-AI ~13% CPU/~20% mem.
Reuse the existing **NAB** harness for changepoint-component validation.

---

## 4. Reservation-behavior archetypes (the scenario pool)

Each archetype maps true demand → a reservation via a strategic transform. Ground truth = the
transform + true `Cu`.

| Archetype | Behavior | True intent | Expected Ballast verdict |
|---|---|---|---|
| `honest_bursty` | R = forecast + congestion headroom; genuinely spiky (low α) | Honest | **No flag** (FP guard — most important cell) |
| `risk_averse_high_Cu` | High buffer, but true `Cu` genuinely high; **buys platinum tier** | Honest | **No flag** — tier purchase reveals real `Cu` (the hard discrimination) |
| `padder_steady` | R = honest_R × inflation; steady demand; won't buy the tier | Padding | **Flag** + premium on unused guarantee |
| `ratchet_sandbagger` | Under-forecasts early, over-draws later | Gaming the ratchet | **Flag** via draw-vs-forecast, **not** via own-history |
| `late_backout` | Reserves high, holds guarantee, cancels at T−δ | Free-option gaming | **Catch early** (changepoint timestamp) + steep cancellation price |
| `junk_job_inflater` | Raises SM activity with useless work when monitored | Faking utilization | **Meter does NOT catch** (value boundary) — handled by incentive + Cycle-2 util-vector, logged as known-uncovered |
| `correlated_peak` | Cohort peaks together (high ρ) | (cohort property) | Pool buffer **de-rates** (not √N) |

---

## 5. Components under test

- **C1 Risk-meter** — recover `μ`, `α`, correlation from the series (estimation accuracy).
- **C2 Reference-class calibration / de-biasing** — "is this workload over-reserving vs its
  **peer class**" (never own-history). The TP/FP engine.
- **C3 Congestion headroom** — objective headroom from variability + SLO; must match queueing
  theory (Halfin–Whitt √load) and **not** flag `honest_bursty`.
- **C4 Cancellation curve + changepoint** — detect `late_backout` *early*, timestamp when it became
  knowable, price the late release.
- **C5 Pooling de-rating** — central buffer from measured ρ + α; must track `n^((α−1)/α)` and the
  ρ→1 collapse, never naive √N.
- **C6 Justification packet** — compose C1–C5 into the defensible artifact (the "math").

---

## 6. Coverage matrix (scenarios × components)

Each cell = expected outcome; harness measures actual + TP/FP. Load-bearing cells in **bold**.

| Scenario \ Component | C2 calib | C3 congestion | C4 cancel | C5 pooling |
|---|---|---|---|---|
| `honest_bursty` | **no-flag** | headroom justified | — | — |
| `risk_averse_high_Cu` | **no-flag** | — | — | — |
| `padder_steady` | **flag** | — | — | — |
| `ratchet_sandbagger` | flag (draw-vs-fcst) | — | — | — |
| `late_backout` | — | — | **early-catch + price** | — |
| `junk_job_inflater` | **uncovered (logged)** | — | — | — |
| `correlated_peak` | — | — | — | **de-rate, not √N** |

---

## 7. Metrics & pass/fail thresholds

- **TP rate** on padding archetypes (`padder_steady`, `ratchet_sandbagger`) **≥ 0.95**.
- **FP rate** on honest archetypes (`honest_bursty`, `risk_averse_high_Cu`) **= 0** — non-negotiable;
  flagging an honest team is the politically fatal error.
- **Cancellation timeliness** — `late_backout` caught within **1 planning cycle** of when the gap
  became statistically established (anytime-valid; the "knowable-at-T-60" timestamp).
- **Pooling-buffer error** — |estimated central buffer − true newsvendor-on-pool| within tolerance
  across a (ρ × α) sweep; must visibly degrade from √N as ρ→1 and α→1.
- **Determinism** — same seed → byte-identical streams + `AuditRecord` + packet (golden fixture).
- **Mode B (Phase 3)** — under best-responding agents: padding share **declines** vs the
  no-premium baseline; the procurement/recalibration loop **converges** (no sustained oscillation)
  under the ε < γ/β regime and **is shown to diverge** when feedback is made too strong (positive
  control).

---

## 8. The escalation headline demo

A single scenario instance reconstructing the escalation (cf. DeploySignal reconstructing a public
regression). A `padder_steady` (or `risk_averse_high_Cu`) team escalates; an adjudicator asks for
the math. Output: a **side-by-side** — what the team presented (a number) vs Ballast's justification
packet (calibrated forecast vs peer class, congestion-justified headroom, tier purchased / `Cu`
revealed, peak-covariance risk imposed). **Pass** = the packet is sufficient for an adjudicator to
make the call, and is replay-clean. This is the artifact you walk in with.

---

## 9. Determinism & replay

Seeded generator; replay-clean audit inherited from `deploysignal-engine`. A golden-fixture
regression asserts byte-identical output across rebuilds (CI gate). No `Date.now()`/`Math.random()`
in the scored path — seed-threaded RNG only.

---

## 10. Build phasing

| Phase | Scope |
|---|---|
| **H1** | Generator (single workload, heavy-tail + diurnal + growth) + `honest_bursty` and `padder_steady` end-to-end through C1/C2; FP=0 guard. |
| **H2** | Full 7-archetype pool + C3/C4/C5; coverage matrix; trace-grounding from one public trace. |
| **H3** | Justification packet (C6) + the escalation demo (interactive, cf. `FAMILY-INTUITION.html`). |
| **H4** | Mode B closed-loop agents (incentive efficacy, gaming resistance, loop stability). |

---

## 11. Boundary — what this does NOT prove (state it like Tessera does)

- Does **not** prove the organization.s real demand has the assumed structure — that's an access-gated later
  phase (cf. Tessera "real-cluster validation = Phase 4 candidate").
- Mode A uses **scripted** agents → validates **detection/measurement**, not the behavioral
  response to pricing. The incentive claim is only addressed in **Mode B**, and even there with
  modeled (not real) agents.
- The `junk_job_inflater` value-boundary is **explicitly uncovered** by the meter — surfaced, not
  hidden (provenance secures measurement integrity, not work value).

---

_Grounding: parameters and degradations trace to the verified research record (heavy-tailed
pooling `n^((α−1)/α)`; Halfin–Whitt √load congestion; Eppen correlation collapse; performative
ε < γ/β stability). Public traces: Borg 2019, Philly ATC'19, Alibaba PAI NSDI'22._
