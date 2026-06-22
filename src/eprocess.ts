// eprocess.ts — anytime-valid betting e-process (Ballast-native; H2 aligns with the engine's
// betting-e-process primitive for e-BH combination).
//
// Wealth starts at 1 and is multiplied by (1 + λ·eₜ) each step for bounded evidence eₜ ∈ [−1, 1].
// Under the null (E[eₜ] ≤ 0) wealth is a non-negative supermartingale, so by Ville's inequality
// P(ever ≥ 1/α) ≤ α — the test fires at most α of the time on an honest workload, at any
// (data-dependent) stopping time. λ ∈ (0, 1) keeps the factor positive.

import type { EProcessResult } from './domain';

export interface EProcessOpts {
  readonly lambda: number;
  readonly alpha: number;
}

export const DEFAULT_EPROCESS: EProcessOpts = { lambda: 0.5, alpha: 0.05 };

export function runEProcess(evidence: readonly number[], opts: EProcessOpts = DEFAULT_EPROCESS): EProcessResult {
  const threshold = 1 / opts.alpha;
  let wealth = 1;
  let firedAtCycle: number | null = null;
  for (let i = 0; i < evidence.length; i++) {
    const factor = 1 + opts.lambda * evidence[i];
    wealth *= factor > 0 ? factor : Number.EPSILON;
    if (firedAtCycle === null && wealth >= threshold) firedAtCycle = i;
  }
  return { wealth, fired: firedAtCycle !== null, firedAtCycle };
}
