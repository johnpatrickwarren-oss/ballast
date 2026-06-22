// calibration.ts — peer-anchored over-reservation calibration (component C2).
//
// Evidence of padding = how far a workload's utilization sits BELOW its reference class's
// sanctioned ratio. Anchoring to the class (not the workload's own history) is the no-ratchet
// invariant. The evidence stream feeds the anytime-valid e-process; firing = "over-reservation
// beyond sanctioned headroom is statistically established" — a burden-shift, never a verdict.

import type { CycleObservation, RefClass, Verdict } from './domain';
import { runEProcess, type EProcessOpts, DEFAULT_EPROCESS } from './eprocess';

function clamp(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/** Padding signal for one cycle: sanctioned − utilization, clamped to [−1, 1]. >0 ⇒ under-using. */
export function paddingEvidence(obs: CycleObservation, cls: RefClass): number {
  return clamp(cls.sanctionedRatio - obs.utilizationRatio, -1, 1);
}

export function calibrate(
  workloadId: string,
  obs: readonly CycleObservation[],
  cls: RefClass,
  opts: EProcessOpts = DEFAULT_EPROCESS,
): Verdict {
  const evidence = obs.map((o) => paddingEvidence(o, cls));
  const result = runEProcess(evidence, opts);
  return {
    workloadId,
    flag: result.fired ? 'flag' : 'no-flag',
    wealth: result.wealth,
    firedAtCycle: result.firedAtCycle,
  };
}
