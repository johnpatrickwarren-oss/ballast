// changepoint.ts — downshift detector (Page-CUSUM, component C4). Detects the cycle at which a
// workload's realized draw falls durably below an expected level — i.e. when over-reservation
// first becomes KNOWABLE. The "knowable-at-T−k" timestamp the cancellation curve keys off; a
// miniature of the engine's changepoint family. Operates on relative deficit so it is scale-free.

import type { ChangepointResult } from './domain';

export interface CusumOpts {
  /** Per-cycle relative-deficit tolerance absorbed before accumulation begins. */
  readonly slack: number;
  /** Accumulated-deficit threshold to fire. */
  readonly threshold: number;
}

export const DEFAULT_CUSUM: CusumOpts = { slack: 0.1, threshold: 1.0 };

export function detectDownshift(
  signal: readonly number[],
  expected: readonly number[],
  opts: CusumOpts = DEFAULT_CUSUM,
): ChangepointResult {
  let s = 0;
  let firedAtCycle: number | null = null;
  for (let t = 0; t < signal.length; t++) {
    const e = expected[t] > 0 ? expected[t] : 1;
    const deficit = (e - signal[t]) / e - opts.slack;
    s = Math.max(0, s + deficit);
    if (firedAtCycle === null && s > opts.threshold) firedAtCycle = t;
  }
  return { fired: firedAtCycle !== null, firedAtCycle };
}
