// pipeline.ts — end-to-end: scenario × seed → calibration verdict. Replay-clean (deterministic
// in the seed). This is the spine H2 extends with the multi-component coverage matrix.

import type { Scenario, Verdict } from './domain';
import { makeRng } from './rng';
import { cycleObservations, type ObsOpts, DEFAULT_OBS } from './workload';
import { calibrate } from './calibration';
import { type EProcessOpts, DEFAULT_EPROCESS } from './eprocess';

export interface RunOpts {
  readonly obs: ObsOpts;
  readonly eprocess: EProcessOpts;
}

export const DEFAULT_RUN: RunOpts = { obs: DEFAULT_OBS, eprocess: DEFAULT_EPROCESS };

export function runScenario(scenario: Scenario, seed: number, opts: RunOpts = DEFAULT_RUN): Verdict {
  const rng = makeRng(seed);
  const obs = cycleObservations(scenario.workload, rng, opts.obs);
  return calibrate(scenario.workload.id, obs, scenario.workload.refClass, opts.eprocess);
}
