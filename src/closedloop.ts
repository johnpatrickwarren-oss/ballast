// closedloop.ts — the performative control loop (Mode B / H4). The center adjusts the premium to
// drive aggregate utilization to a target; agents re-best-respond, which changes utilization —
// the demand model is invalidated by the policy that acts on it (Lucas critique / performative
// prediction). The update is slope-normalized so the EFFECTIVE gain maps directly to the
// Perdomo-style contraction factor: gain < 2 converges to the performatively-stable fixed point;
// gain > 2 diverges. The divergent case is the positive control proving the stability test is real.

import { type Agent, aggregateUtilization } from './agent';

export interface LoopOpts {
  /** Effective gain. <2 converges, >2 diverges (the ε < γ/β analog). */
  readonly gain: number;
  readonly targetUtil: number;
  readonly rounds: number;
  readonly initialPremium: number;
}

export interface LoopResult {
  readonly premiums: number[];
  readonly utils: number[];
  readonly converged: boolean;
}

function localSlope(agents: readonly Agent[], p: number): number {
  const dp = Math.max(p * 0.1, 0.05);
  return (aggregateUtilization(agents, p + dp) - aggregateUtilization(agents, p)) / dp;
}

function isConverged(premiums: readonly number[]): boolean {
  if (premiums.length < 6) return false;
  const tail = premiums.slice(-5);
  const range = Math.max(...tail) - Math.min(...tail);
  return range < 0.02 * (Math.abs(premiums[0]) + 1);
}

export function runClosedLoop(agents: readonly Agent[], opts: LoopOpts): LoopResult {
  let p = opts.initialPremium;
  const premiums: number[] = [];
  const utils: number[] = [];
  for (let r = 0; r < opts.rounds; r++) {
    const u = aggregateUtilization(agents, p);
    premiums.push(p);
    utils.push(u);
    // Recompute the slope each round so the effective gain equals the local contraction factor:
    // p_{t+1} − p* ≈ (1 − gain)(p_t − p*). gain < 2 contracts; gain > 2 amplifies → diverges.
    const s = Math.max(Math.abs(localSlope(agents, p)), 1e-6);
    p = Math.max(p + (opts.gain / s) * (opts.targetUtil - u), 0);
  }
  return { premiums, utils, converged: isConverged(premiums) };
}
