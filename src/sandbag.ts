// sandbag.ts — under-reservation (sandbagging) detector, the mirror of calibration.ts. A ratchet-
// sandbagger under-asks (to dodge next period's tighter allocation) then over-draws, so realized
// demand persistently EXCEEDS its reservation (chronic stockout). The signature is draw-vs-
// reservation, NOT own-history — honest forecasting is never penalized. Catching chronic under-
// asking matters because it is the other half of the last-minute-churn problem (teams that
// low-balled then scramble for capacity). Anytime-valid via the same betting e-process.

import type { CycleObservation, Verdict } from './domain';
import { runEProcess, type EProcessOpts, DEFAULT_EPROCESS } from './eprocess';

function clamp(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/** Stockout evidence: relative unmet demand beyond a slack tolerance. >0 ⇒ under-reserved. */
export function stockoutEvidence(obs: CycleObservation, slack = 0.05): number {
  const overrun = obs.reserved > 0 ? (obs.demand - obs.reserved) / obs.reserved : 0;
  return clamp(overrun - slack, -1, 1);
}

export function detectSandbag(
  workloadId: string,
  obs: readonly CycleObservation[],
  opts: EProcessOpts = DEFAULT_EPROCESS,
): Verdict {
  const evidence = obs.map((o) => stockoutEvidence(o));
  const result = runEProcess(evidence, opts);
  return {
    workloadId,
    flag: result.fired ? 'flag' : 'no-flag',
    wealth: result.wealth,
    firedAtCycle: result.firedAtCycle,
  };
}
