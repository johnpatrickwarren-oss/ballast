// cohort.ts — empirical correlated-cohort generator (C5b). Validates the C5 pooling formula
// against REALIZED demand: build N equicorrelated workloads via a shared common factor, then
// measure realized pooling benefit = Σ(per-workload scale) / scale(aggregate). With finite-
// variance (normal) shocks this reproduces poolingBenefit(N, ρ, 2) = √N/√(1+(N−1)ρ). (The heavy-
// tail half stays analytic: stable α<2 has infinite variance, so a std-based realized benefit
// does not converge — that limit is verified in pooling.ts, not here.)

import { type Rng, normal } from './rng';
import { std } from './stats';

export interface CohortSpec {
  readonly n: number;
  readonly base: number;
  readonly sigma: number;
  /** Pairwise correlation via shared-factor weight ρ ∈ [0,1]. */
  readonly rho: number;
  readonly steps: number;
}

/** Equicorrelated cohort: demand[w][t] = base + σ(√ρ·commonₜ + √(1−ρ)·idioₜ,w). */
export function correlatedCohort(spec: CohortSpec, rng: Rng): number[][] {
  const sr = Math.sqrt(Math.max(spec.rho, 0));
  const si = Math.sqrt(Math.max(1 - spec.rho, 0));
  const cohort: number[][] = Array.from({ length: spec.n }, () => [] as number[]);
  for (let t = 0; t < spec.steps; t++) {
    const common = normal(rng, 0, 1);
    for (let w = 0; w < spec.n; w++) {
      cohort[w].push(spec.base + spec.sigma * (sr * common + si * normal(rng, 0, 1)));
    }
  }
  return cohort;
}

/** Realized pooling benefit = Σ scale(workload) / scale(aggregate series). */
export function realizedPoolingBenefit(cohort: readonly (readonly number[])[]): number {
  const steps = cohort[0]?.length ?? 0;
  const aggregate: number[] = new Array(steps).fill(0);
  let sumScales = 0;
  for (const wl of cohort) {
    sumScales += std(wl);
    for (let t = 0; t < steps; t++) aggregate[t] += wl[t];
  }
  const aggScale = std(aggregate);
  return aggScale > 0 ? sumScales / aggScale : 0;
}
