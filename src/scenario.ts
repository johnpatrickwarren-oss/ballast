// scenario.ts — the scenario pool (HARNESS-SPEC §4). Each scenario carries ground truth: the
// archetype, the reference class, and the verdict a correct Ballast MUST produce.
//
// Class sanctioned ratios are NOT hand-set — they are COMPUTED from each class's demand
// variability via C3 (congestion). That operationalizes the verified insight that legitimate
// utilization is objective and class-specific: a bursty serving class earns a low bar (large
// congestion headroom); a steady batch class earns a high bar. The padder is caught precisely
// because its steady class has a high bar it falls far below.

import type { Archetype, DemandSpec, RefClass, Scenario, WorkloadSpec } from './domain';
import { intentOf } from './archetypes';
import { sanctionedRatioForSeries } from './congestion';
import { demandSeries } from './demand';
import { makeRng } from './rng';

// ── Demand specs (defined before classes — classes derive their bar from these) ──────────────

const BURSTY_DEMAND: DemandSpec = {
  base: 100, diurnalAmp: 0.5, period: 24, growthPerStep: 0.0003,
  tailAlpha: 1.3, tailScale: 0.6, spikeProb: 0.03, spikeMult: 4,
};

const STEADY_DEMAND: DemandSpec = {
  base: 100, diurnalAmp: 0.1, period: 24, growthPerStep: 0.0003,
  tailAlpha: 1.9, tailScale: 0.15, spikeProb: 0.002, spikeMult: 2,
};

const HIGH_CU_DEMAND: DemandSpec = {
  base: 100, diurnalAmp: 0.6, period: 24, growthPerStep: 0.0003,
  tailAlpha: 1.2, tailScale: 0.8, spikeProb: 0.05, spikeMult: 5,
};

// Reserves up front for an anticipated launch (held); the launch slips at mid-horizon
// (step 720 = cycle 12 at 60 steps/cycle), halving demand and stranding the held reservation.
const LATE_BACKOUT_DEMAND: DemandSpec = {
  base: 100, diurnalAmp: 0.2, period: 24, growthPerStep: 0.0003,
  tailAlpha: 1.6, tailScale: 0.2, spikeProb: 0.005, spikeMult: 3,
  shift: { atStep: 720, factor: 0.5 },
};

// ── C3-derived class ratios (computed from variability, not opinion) ─────────────────────────

const CALIB_SEED = 0x5ca1ab1e;
const CALIB_STEPS = 4000;

function classRatio(demand: DemandSpec): number {
  return sanctionedRatioForSeries(demandSeries(demand, CALIB_STEPS, makeRng(CALIB_SEED)));
}

export const BURSTY_CLASS: RefClass = { id: 'serving-bursty', sanctionedRatio: classRatio(BURSTY_DEMAND) };
export const STEADY_CLASS: RefClass = { id: 'batch-steady', sanctionedRatio: classRatio(STEADY_DEMAND) };
// High stockout-cost serving: the burstiest demand → C3 gives it the LOWEST bar. The hard FP case.
export const HIGH_CU_CLASS: RefClass = { id: 'serving-high-cu', sanctionedRatio: classRatio(HIGH_CU_DEMAND) };

// ── Scenarios ────────────────────────────────────────────────────────────────────────────────

function workload(id: string, archetype: Archetype, refClass: RefClass, demand: DemandSpec): WorkloadSpec {
  return { id, org: `org-${id}`, refClass, demand, archetype };
}

function scenario(id: string, archetype: Archetype, refClass: RefClass, demand: DemandSpec, expectedFlag: Scenario['expectedFlag']): Scenario {
  return { id, workload: workload(id, archetype, refClass, demand), intent: intentOf(archetype), expectedFlag };
}

export function honestBurstyScenario(id: string): Scenario {
  return scenario(id, 'honest_bursty', BURSTY_CLASS, BURSTY_DEMAND, 'no-flag');
}

export function padderSteadyScenario(id: string): Scenario {
  return scenario(id, 'padder_steady', STEADY_CLASS, STEADY_DEMAND, 'flag');
}

/** Risk-averse, genuinely high stockout cost. Honest but reserves the MOST per unit forecast —
 *  must NOT be flagged, because its class sanctions the headroom. The crux discrimination. */
export function riskAverseHighCuScenario(id: string): Scenario {
  return scenario(id, 'risk_averse_high_cu', HIGH_CU_CLASS, HIGH_CU_DEMAND, 'no-flag');
}

/** Holds an up-front over-reservation for a launch that then slips. Consumed in held-reservation
 *  mode; the changepoint (C4) flags it early and the cancellation curve prices late release. */
export function lateBackoutScenario(id: string): Scenario {
  return scenario(id, 'late_backout', BURSTY_CLASS, LATE_BACKOUT_DEMAND, 'flag');
}

/** Sandbagger: under-reserves below the sanctioned bar to dodge the ratchet, then over-draws.
 *  Caught by the under-reservation (stockout) detector, NOT the over-reservation calibration. */
export function ratchetSandbaggerScenario(id: string): Scenario {
  return scenario(id, 'ratchet_sandbagger', STEADY_CLASS, STEADY_DEMAND, 'flag');
}

/** Junk-job inflater: over-reserves like a padder but fakes high utilization. The meter CANNOT
 *  catch it (value boundary) — expectedFlag is no-flag by C2; deterrence is the premium, not
 *  detection. The explicitly-uncovered cell. */
export function junkJobInflaterScenario(id: string): Scenario {
  return scenario(id, 'junk_job_inflater', STEADY_CLASS, STEADY_DEMAND, 'no-flag');
}

/** The H1 pool: the false-positive guard archetype + the true-positive archetype. */
export const H1_POOL: readonly Scenario[] = [honestBurstyScenario('h1-honest'), padderSteadyScenario('h1-padder')];

/** H2 coverage pool (component C2): both honest cases (incl. the hard one) + the padder. */
export const COVERAGE_POOL: readonly Scenario[] = [
  honestBurstyScenario('cov-honest'),
  riskAverseHighCuScenario('cov-riskaverse'),
  padderSteadyScenario('cov-padder'),
];
