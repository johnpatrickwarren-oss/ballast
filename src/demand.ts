// demand.ts — synthetic demand-process generator (HARNESS-SPEC §3).
//
// Emits a per-step demand series with the verified statistical structure: heavy-tailed
// (Pareto, index α ∈ (1,2)), diurnal, growing, with occasional event spikes. Pure function
// of (spec, rng) — replay-clean.

import type { DemandSpec } from './domain';
import { type Rng, pareto, bernoulli } from './rng';

/** One demand sample at step `t` given the running level. */
function sample(spec: DemandSpec, level: number, rng: Rng): number {
  // Upward-only heavy-tail burst: pareto(α,1) ≥ 1, so (raw − 1) ≥ 0 is the burst excess. Demand
  // spikes up with a heavy right tail and never collapses to zero (the realistic shape, and the
  // one whose peak-vs-median spread C3 reads correctly).
  const burst = spec.tailScale * (pareto(rng, spec.tailAlpha, 1) - 1);
  let value = level * (1 + burst);
  if (bernoulli(rng, spec.spikeProb)) value *= spec.spikeMult;
  return value;
}

/** Deterministic per-step level: base, growth, diurnal, optional regime shift. */
function levelAt(spec: DemandSpec, t: number): number {
  const growth = Math.pow(1 + spec.growthPerStep, t);
  const diurnal = 1 + spec.diurnalAmp * Math.sin((2 * Math.PI * t) / spec.period);
  const shift = spec.shift && t >= spec.shift.atStep ? spec.shift.factor : 1;
  return spec.base * growth * diurnal * shift;
}

/** Generate `steps` demand samples. */
export function demandSeries(spec: DemandSpec, steps: number, rng: Rng): number[] {
  const out: number[] = new Array(steps);
  for (let t = 0; t < steps; t++) {
    out[t] = sample(spec, levelAt(spec, t), rng);
  }
  return out;
}
