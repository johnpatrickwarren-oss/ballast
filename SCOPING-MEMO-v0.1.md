# Ballast — Scoping Memo v0.1 (Scope Cycle 1: Reservation Core)

**Working name:** Ballast _(placeholder — naming is OQ-1)_. The reserve you carry to stay
stable, sized to conditions. Sibling to DeploySignal / Tessera / Cairn; vendors the same
`deploysignal-engine` statistical core.

**Status:** Scope Cycle 1 — DRAFT. Covers the insurance-framed reservation core only.
Detection panel, procurement buy-signal loop, and incentive-mechanism calibration are
later cycles (see Phasing).

**Operating assumption (preconditions).** Ballast is a **steady-state** tool. It assumes the
centralized capacity pool exists and teams are onboarded. The migration to that pool —
and its validation — is an **external workstream worked separately**, assumed resolved. Ballast
does not validate, gate, or unblock the migration (that is a pre-promotion concern — DeploySignal's
lifecycle slot). Ballast's north star: **are org forecasts within range, and meetable without gaming.**

**Lineage note:** This project began as "stocksig" (find signals in equity markets). That
framing was retired under research: the engine is a de-biasing change-detector, not an alpha
generator, and markets offer no stable baseline to deviate from (Martin–Nagel; Campbell–
Thompson). The same machinery is, however, an excellent *validation / measurement* substrate —
which is what Ballast is. The directory name is vestigial.

---

## The one operational question

> **Given the capacity each org reserves and what it actually draws, what is the fair, honest
> price of that reservation — and what is the defensible, replay-clean evidence behind it —
> without the tool ever deciding who gets capacity?**

Ballast prices and meters reservations and produces the evidence trail. It does **not**
allocate, accuse, or predict returns. A human + a pricing policy make decisions; Ballast makes
those decisions *fair, legible, and enforceable*.

### Motivating scenario — "show me the math"

A capacity-allocation dispute escalated to senior leadership, who asked to **see the requesting
team's math**. The team **could not provide it.** That evidentiary vacuum is a primary driver of
the move to a centralized capacity pool. The artifact leadership demanded — defensible,
reproducible justification behind a capacity claim — **is exactly what Ballast generates.** Two
design consequences:

1. **Ballast is the legibility half of pool centralization.** Centralization delivers *control*
   but does **not** produce the math; move the same teams onto a central pool and the next
   escalation has the identical empty-handed outcome. **Centralization relocates the evidentiary
   vacuum; Ballast fills it** — it is what makes the centralized pool *governable*.
2. **The primary consumer is the adjudicator, not middle-management policing.** Leadership wanted
   the math to make the call *itself* — the decoupled evidence-for-human-decision model (which is
   also what the decision-market impossibility forces). Real need and theory converge.

---

## Core model: a reservation is a risk-priced insurance policy

The waste we are attacking (capacity idle on the wrong P&L, last-minute churn) comes from
conflating two things an org holds: a **claim/guarantee** on future capacity (an option) and
**physical inventory** (GPUs out of the pool). Ballast separates them and prices three objects:

1. **Reservation premium** — a (small) covariance-risk-priced fee for the *right* to draw up to
   `R`, accruing from the moment of reservation. Prices the option that was previously free
   (closes the soft-budget-constraint free-ride; Kornai). Capacity stays in the central pool.
2. **Metered usage** — full price, charged only on capacity actually drawn from the pool as the
   service grows, released in **utilization-gated stages** (not one upfront grab). The
   quantity-flexibility "downside bound" is the documented anti-inflation lever (Tsay 1999;
   Tsay–Lovejoy 1999).
3. **Cancellation curve** — declining release credit / rising penalty as the deadline nears.
   Early release is cheap and rewarded (frees capacity others can plan around); late dumping is
   expensive and documented. Grounded in option-value-of-waiting / irreversibility (Dixit–
   Pindyck) and mirrored by AWS Capacity Reservations (idle is billed; future-dated carry a
   cancellation charge).

**The sanctioned buffer is policy, not zero.** The "honest" reservation is *not* expected draw —
queueing theory makes some idle mathematically required (delay ∝ 1/(1−ρ); headroom ∝ √load and
rises with demand variability — Halfin–Whitt). The buffer target is a newsvendor critical
fractile `Cu/(Cu+Co)` **plus a congestion term**. Over-reservation is measured as deviation
*beyond this sanctioned buffer*, never beyond expected use.

---

## The tool's jobs (Cycle 1 build surface)

Ballast is a **risk-meter**, an **evidence ledger**, and the **justification packet** that
composes them. Nothing else this cycle.

### A. Risk-meter — computes the inputs to the premium
- **Consumes the capacity planner as the demand-forecasting substrate** (the capacity planner already builds per-minute
  per-service baselines + growth prediction, accurate through correlated peaks like a major peak event).
  Ballast does not rebuild forecasting; it adds the accountability + pricing layer on top.
- Per-org/per-workload demand **distribution** (not a point estimate): level, variability,
  burstiness, tail index α.
- **Covariance with aggregate demand** — an org peaking *with* everyone else (shared launch
  window) consumes more of the scarce pooled buffer → higher premium; counter-cyclical demand
  is diversifying → lower premium.
- **Calibration track record** — de-biased via reference class (below), feeding the premium and
  the haircut, anchored to peers, **never to the org's own history** (no ratchet — Weitzman).

### B. Evidence ledger — replay-clean accrual
- Three deterministic streams: premium accrual (held-guarantee-time), usage on draw,
  cancellation credit/penalty.
- Inherits the engine's **replay-clean audit** (same inputs → byte-identical record), which is
  what makes mechanical (non-discretionary) enforcement credible — the Dewatripont–Maskin
  commitment requirement.
- Anytime-valid by construction: the bill survives the "you checked at a convenient moment"
  objection (Henzi–Ziegel: classical tests inflate to 0.12 under optional stopping; e-processes
  do not).

### C. Justification packet — the on-demand "math"
The primary human-facing deliverable: a per-team, on-demand artifact answering "show me the math"
(the escalation scenario). Composes A + B + calibration into a defensible bundle:
- the team's forecast vs its **peer reference class** (calibration track record, de-biased);
- the **congestion-justified headroom** (objective queueing math, not opinion);
- the **guarantee tier purchased** (revealed `Cu`) and premium paid;
- the **peak/covariance risk** the reservation imposes on the shared pool.
Built for the *adjudicator* (VP/CEO) and the requesting team — not a policing dashboard. Replay-
clean, so the same inputs reproduce the same packet.

---

## Reference classes (assignment, not accusation — Cycle 1 minimum)

- Classes defined on **legitimate cost-drivers** (workload type, demand volatility, SLO tier,
  maturity) and assigned by **measured behavior, never self-declaration** — the structural
  defense against reference-class-selection gaming (Flyvbjerg).
- Classify at **workload** granularity, roll up; an org's training and serving fleets are
  different classes.
- Small classes borrow strength up the hierarchy (workload→class→population shrinkage), reusing
  the engine's hierarchical e-value combination.
- **Exchangeability test is used to AUDIT THE TAXONOMY only**, not to accuse orgs (pressure-test
  result: relative tests are blind to class-wide padding and conflate outlier with guilty).

---

## Central pooling — explicitly de-rated (load-bearing caveat)

Pooling cuts buffer ∝ √N for light-tailed, independent demand (Eppen 1979) — but GPU demand is
**both correlated and heavy-tailed**, and *both* erode it:
- Positive correlation shrinks the benefit, → **zero** at perfect correlation (Eppen).
- Heavy tails degrade √N to **`n^((α−1)/α)`**, collapsing toward zero as α→1 (Bimpikis–Markakis
  2016).

**Design rule:** size the central buffer from the *measured* correlation matrix and tail index,
never the naive √N. Do not over-bank pooling savings; where pooling underdelivers, lean on the
price and staging levers. The buffer is held **centrally**, not by each team.

---

## Invariants (must hold across all later cycles)

1. **Decoupled from allocation.** Ballast's outputs feed pricing and human judgment; they are
   **never** wired to the allocation function or to next-period allocation (decision-market
   impossibility; ratchet).
2. **Anchor external, never own-history.** Calibration is judged vs peer reference class. In
   particular, **the capacity planner's per-service historical forecast may feed the demand and procurement
   signal but must NOT serve as the accountability baseline** — own-history anchoring bakes each
   service's past padding into its own target (ratchet). Same numbers, two strictly separated uses.
3. **Transparent rules / translucent detection.** Pricing rules, premium/cancellation curves,
   and class definitions are fully published; detection thresholds are disclosed in kind
   ("we monitor for X") but not in exact value.
4. **Rollover, never use-it-or-lose-it** (Liebman–Mahoney: expiry → year-end burn; rollover
   removes it).
5. **Replay-clean, deterministic, anytime-valid** evidence — inherited from the engine.
6. **Buffer central, de-rated for correlation + tails.**

---

## Anti-scope (explicitly out — killed in pressure-testing)

- ❌ **Not a lie-detector / per-org verdict engine.** Over-reservation ≠ dishonesty; intent is
  not statistically identifiable (rational risk-aversion under asymmetric stockout cost). Output
  is burden-shift ("explain the variance"), never a verdict.
- ❌ **Not a market / return predictor** (original framing, retired).
- ❌ **Not an auction / VCG / internal market** (impractical; AWS retired its own spot auction
  in 2017).
- ❌ **Not a utilization-maximizer** (congestion makes some idle mandatory).
- ❌ **Does not allocate, and does not decide procurement** (procurement is a later, separately-
  designed damped control loop).
- ❌ **Does not validate or gate the centralization** (pre-promotion concern, separate
  workstream, DeploySignal's lifecycle slot). Ballast assumes the migrated pool as a precondition.

---

## Open questions (need John's input to close Cycle 1)

- **OQ-1 — Name.** Ballast is a placeholder.
- **OQ-2 — Sanctioned buffer / `Cu/Co`.** _RESOLVED._ The buffer **decomposes**: (1) **congestion
  headroom** — objective queueing math from measured variability + SLO, not negotiated; (2)
  **insurance buffer** — the `Cu/(Cu+Co)` slice. `Co` (idle cost) is center-side/knowable; only
  `Cu` (stockout cost) is private. **No one adjudicates `Cu`:** the center sets `Co` and prices
  **guarantee tiers**; the org **reveals `Cu` by which tier it pays for** (revealed preference).
  Tiering confirmed culturally viable (org-wide ruthless prioritization) and self-selects padders out.
  Residual = tier-menu governance (→ OQ-4).
- **OQ-3 — Validation approach.** _RESOLVED (method)._ No organization data is available pre-deployment,
  and intent (padding vs honest) is unobservable in real data anyway (identifiability limit). So
  validate the way DeploySignal/Tessera/Tessera-RNG were: a **synthetic, trace-grounded reference
  implementation** with an adversarial scenario pool of **known-ground-truth** archetypes
  (`honest_bursty`, `padder_steady`, `risk_averse_high_Cu`, `ratchet_sandbagger`, `late_backout`,
  `junk_job_inflater`, `correlated_peak`) + a coverage matrix (TP/FP per component). Ground demand
  shapes in **public cluster traces** (Google Borg 2019, Microsoft Philly, Alibaba PAI) and the
  verified magnitudes; reuse the existing **NAB** harness for changepoint components. **Headline
  demo:** a synthetic "escalation archetype" — reconstruct the escalation, show Ballast producing the
  justification packet the real team couldn't. **Boundary:** proves the mechanism on assumed-
  structure data; real-data efficacy is an access-gated later phase (cf. Tessera "Phase 4 candidate").
  Synthetic ground truth is the *only* place intent-detection can be scored — a feature, not a fallback.
- **OQ-4 — Participation channel.** Transparency adds legitimacy but does **not** substitute for
  voice (Lind et al.; Tyler). Top-down corp can't grant rule-setting, but a *real* consultation
  + appeal path (Leventhal correctability) recovers most of voice's value and the upward
  private-demand information. Scope it as part of Cycle 1 or defer?
- **OQ-5 — the capacity planner integration / data provenance.** _PARTIALLY RESOLVED._
  - ✅ **Independent utilization telemetry** (hardware-layer; SM/HBM/power) can be **mandated as a
    condition of service**, with **no org write path** — the separation-of-duties linchpin holds.
  - ✅ **Stable workload/org identity** — reference classes + ledger have a stable key.
  - ✅ **the capacity planner = demand-forecasting substrate** Ballast consumes (not rebuilt).
  - ✅ **Reservation event log** — can be built (purpose understood: it is the substrate for the
    cancellation curve + "knowable-at-T-60" defensibility); distinct from the capacity planner's usage series.
  - ✅ **Central pool is strategically backed, not a fight** — the organization is already migrating all teams
    to **a centralized platform**, which is centralized by construction. Ballast's pooled-metering bet rides this
    mandate rather than fighting "reserved = dedicated."
  - ✅ **External precondition, worked separately.** The centralized pool is a precondition
    Ballast *consumes*, not a problem Ballast *solves*. The migration (incl. its current
    early-volunteer test failures) is a **separate workstream**, assumed resolved. Migration
    validation is a pre-promotion gate — **DeploySignal's lifecycle slot, not Ballast's.**
- **OQ-6 — Pool de-rating estimator.** Method + cadence for estimating per-class correlation and
  tail index α that size the central buffer.

---

## Phasing

| Cycle | Scope |
|---|---|
| **1 (this)** | Insurance-framed reservation core: premium + metered draw + cancellation curve; tool as risk-meter + evidence ledger; reference-class assignment; pooling de-rated. |
| 2 | Detection panel (changepoint / utilization-vector / e-BH FDR) for **triage + context**, not verdict. Multi-substrate: telemetry, time, money, history. |
| 3 | Procurement buy-signal loop: de-biased aggregate demand → ISD hysteresis trigger + proportional smoothing (re-derive damping for non-i.i.d. demand) + performative recalibration cadence. |
| 4 | Incentive-mechanism calibration + reference-class governance + participation channel. |

---

_Grounding: 8 verified research passes (see conversation record). All load-bearing claims
carry primary-source citations; three items (OQ-3 chargeback efficacy, population-scale slack
magnitude, Folger backfire effect) remain design-time assumptions to validate empirically._
