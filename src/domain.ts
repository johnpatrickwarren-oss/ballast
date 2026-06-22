// domain.ts — Ballast type/contract surface. ZERO behavior (admitted hub per arch-invariants).
//
// The synthetic-harness vocabulary: how a workload's demand is specified, how a reservation
// archetype transforms true need into a (possibly inflated) reservation, what the meter
// observes per planning cycle, and the verdict the calibration engine emits.

/** Statistical shape of a single workload's demand process (HARNESS-SPEC §3). */
export interface DemandSpec {
  /** Base demand level (units of capacity). */
  readonly base: number;
  /** Diurnal amplitude as a fraction of base, in [0, 1). */
  readonly diurnalAmp: number;
  /** Diurnal period in usage steps. */
  readonly period: number;
  /** Multiplicative growth per usage step (e.g. 0.0002 ≈ hypergrowth). */
  readonly growthPerStep: number;
  /** Heavy-tail index α ∈ (1, 2): lower = burstier (verified pooling driver). */
  readonly tailAlpha: number;
  /** Heavy-tail shock scale as a fraction of level. */
  readonly tailScale: number;
  /** Per-step probability of an event spike (launch). */
  readonly spikeProb: number;
  /** Spike multiplier applied to level when a spike fires. */
  readonly spikeMult: number;
  /** Optional regime shift: from step `atStep`, multiply the level by `factor` (a slipped launch). */
  readonly shift?: { readonly atStep: number; readonly factor: number };
}

/** The seven HARNESS-SPEC §4 archetypes. H1 implements the first two. */
export type Archetype =
  | 'honest_bursty'
  | 'padder_steady'
  | 'risk_averse_high_cu'
  | 'ratchet_sandbagger'
  | 'late_backout'
  | 'junk_job_inflater'
  | 'correlated_peak';

/** Ground-truth intent label attached to an archetype. */
export type Intent = 'honest' | 'padding' | 'gaming' | 'cohort';

/** A reference class: the peer cohort a workload is judged against. */
export interface RefClass {
  readonly id: string;
  /**
   * The legitimate utilization ratio (avg-draw / reserved) for this class — its congestion
   * headroom expressed as a ratio. In H1 a class parameter (peer-estimated); H2 (C3) computes
   * it from measured variability + SLO. Anchoring to THIS, never to a workload's own history,
   * is the no-ratchet invariant.
   */
  readonly sanctionedRatio: number;
}

/** A fully specified synthetic workload. */
export interface WorkloadSpec {
  readonly id: string;
  readonly org: string;
  readonly refClass: RefClass;
  readonly demand: DemandSpec;
  readonly archetype: Archetype;
}

/** What the meter observes for one workload in one planning cycle. */
export interface CycleObservation {
  readonly cycle: number;
  /** Capacity reserved for the cycle (the claim). */
  readonly reserved: number;
  /** Metered draw over the cycle, capped at `reserved` (what the meter records). */
  readonly used: number;
  /** True average demand before capping — used > reserved means stockout (sandbagging signal). */
  readonly demand: number;
  /** used / reserved ∈ [0, 1]. */
  readonly utilizationRatio: number;
}

/** Result of running the anytime-valid e-process over a workload's cycle stream. */
export interface EProcessResult {
  /** Final wealth (evidence). Fires when wealth ≥ 1/alpha. */
  readonly wealth: number;
  readonly fired: boolean;
  /** Cycle index at which wealth first crossed 1/alpha, or null. */
  readonly firedAtCycle: number | null;
}

export type Flag = 'flag' | 'no-flag';

/** The calibration verdict for one workload — burden-shift, never a verdict of intent. */
export interface Verdict {
  readonly workloadId: string;
  readonly flag: Flag;
  readonly wealth: number;
  readonly firedAtCycle: number | null;
}

/** A scenario: an archetype instance with the correct expected verdict (ground truth). */
export interface Scenario {
  readonly id: string;
  readonly workload: WorkloadSpec;
  readonly intent: Intent;
  /** The verdict a correct Ballast must produce. */
  readonly expectedFlag: Flag;
}

/** Result of the downshift changepoint detector (component C4). */
export interface ChangepointResult {
  readonly fired: boolean;
  /** Cycle at which the durable downshift was first established ("knowable-at"), or null. */
  readonly firedAtCycle: number | null;
}

/** The per-team "show me the math" artifact (component C6 / H3). The escalation deliverable. */
export interface JustificationPacket {
  readonly workloadId: string;
  readonly org: string;
  readonly refClassId: string;
  readonly reservedAvg: number;
  readonly usedAvg: number;
  readonly utilizationRatio: number;
  /** Class-sanctioned (congestion-justified) utilization — the legitimate bar. */
  readonly sanctionedRatio: number;
  /** What an honest reservation at the sanctioned headroom would have been. */
  readonly impliedHonestReservation: number;
  /** Reservation held beyond the sanctioned headroom (≥ 0). */
  readonly excessReservation: number;
  readonly excessFraction: number;
  readonly calibration: Verdict;
  /** Demand tail index — the workload's contribution to pool de-rating (C5). */
  readonly poolTailAlpha: number;
  /** Safety-stock the workload contributes to the central buffer. */
  readonly poolBufferContribution: number;
  /** Burden-shift framing — never an accusation. */
  readonly assessment: 'within-range' | 'variance-to-explain';
}
